import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
  MicOff,
  PictureInPicture2,
  Radio,
  RefreshCcw,
  Send,
  Sparkles,
  ShieldCheck,
  UserX,
  Video,
  VideoOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Textarea } from "../components/ui/Textarea";
import { useToast } from "../components/ui/ToastProvider";
import { useAuth } from "../context/AuthContext";
import { assistantHealth, assistantSummarizeTextStream } from "../lib/assistant";
import api, { parseApiError } from "../lib/api";
import { FormattedAssistantText } from "../lib/formatAssistantText";
import {
  type JitsiMeetExternalAPIInstance,
  type JitsiParticipantInfo,
  loadJitsiExternalApi,
} from "../lib/jitsi";
import { MeetHostToolsPanel } from "../components/meet/MeetHostToolsPanel";
import {
  MeetRoomControlsFab,
  MeetRoomToolsDrawer,
  type MeetRoomDrawerTab,
} from "../components/meet/MeetRoomToolsDrawer";
import { MeetingGreAssistantPanel } from "../components/meet/MeetingGreAssistantPanel";
import { captureMeetingAssistantNotes } from "../lib/meetAssistant";
import { buildJitsiConfigOverwrite, meetHostSettingsFromSession } from "../lib/meetHostSettings";
import {
  fetchMeetingBySlug,
  formatMeetingDate,
  formatMeetingId,
  joinMeetingRoom,
} from "../lib/meetings";
import type { MeetChatMessage, MeetSession } from "../types";

function normalizeParticipants(rows: JitsiParticipantInfo[] | undefined, localEmail?: string) {
  return (rows ?? []).map((row) => ({
    id: row.participantId || row.id || "",
    displayName: row.displayName || row.email || "Participant",
    email: row.email,
    isLocal: !!localEmail && row.email?.toLowerCase() === localEmail.toLowerCase(),
  }));
}

function formatChatTimestamp(value?: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return value;
  }
}

type CopilotTask = "notes" | "actions" | "recap" | "question";

function buildCopilotPrompt(
  meeting: MeetSession,
  chat: MeetChatMessage[],
  notes: string,
  task: CopilotTask,
  question?: string
) {
  const transcript = chat
    .slice(-50)
    .map((message) => {
      const author =
        message.sender?.full_name ||
        `${message.sender?.firstname ?? ""} ${message.sender?.lastname ?? ""}`.trim() ||
        message.sender?.email ||
        "Participant";
      return `${author}: ${(message.message || "").trim()}`;
    })
    .filter(Boolean)
    .join("\n");

  const instructions =
    task === "notes"
      ? "Create structured live meeting notes using short markdown headings: Overview, Key points, Decisions, Open questions, and Action items."
      : task === "actions"
        ? "List only the concrete action items and owners if they are stated. Use short markdown bullets."
        : task === "recap"
          ? "Write a concise recap for someone joining late. Include context, current direction, and next steps."
          : `Answer this question about the meeting as a GRE meeting copilot: ${question?.trim() || ""}`;

  return [
    "You are the GRE Meet AI copilot.",
    "Use only the meeting metadata, saved notes, and GRE archive chat provided below.",
    "Do not invent facts, names, decisions, or action items that are not supported by the content.",
    "If the meeting transcript is still too short or vague, say that there is not enough information yet.",
    "Do not infer scientific findings, significance, methods, or outcomes from the category or title alone.",
    "Return markdown only.",
    instructions,
    "",
    `Meeting title: ${meeting.title}`,
    `Meeting ID: ${formatMeetingId(meeting.id)}`,
    `Meeting type: ${meeting.meeting_type}`,
    `Scheduled at: ${meeting.scheduled_at}`,
    `Category: ${meeting.category_name || ""}`,
    `Subcategory: ${meeting.sub_category_name || ""}`,
    "",
    "Saved human notes:",
    notes.trim() || "No human notes yet.",
    "",
    "GRE archive chat transcript:",
    transcript || "No GRE archive chat messages yet.",
  ].join("\n");
}

function buildExternalRoomUrl(joinData?: {
  server_url?: string;
  room_name?: string;
  token?: string;
} | null) {
  if (!joinData?.server_url || !joinData?.room_name || !joinData?.token) return null;
  const url = new URL(`${joinData.server_url.replace(/\/$/, "")}/${joinData.room_name}`);
  url.searchParams.set("jwt", joinData.token);
  return url.toString();
}

export function MeetRoomPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const lobbyOnly = searchParams.get("lobby") === "1";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const toast = useToast();
  const [text, setText] = useState("");
  const [chatError, setChatError] = useState("");
  const [roomError, setRoomError] = useState("");
  const [roomRetryKey, setRoomRetryKey] = useState(0);
  const [roomParticipants, setRoomParticipants] = useState<
    { id: string; displayName: string; email?: string; isLocal?: boolean }[]
  >([]);
  const [isModerator, setIsModerator] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSeedMeetingId, setNotesSeedMeetingId] = useState<number | null>(null);
  const [notesState, setNotesState] = useState<"idle" | "dirty" | "saving" | "saved" | "error">(
    "idle"
  );
  const [notesError, setNotesError] = useState("");
  const [copilotOutput, setCopilotOutput] = useState("");
  const [copilotError, setCopilotError] = useState("");
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState(false);
  const roomContainerRef = useRef<HTMLDivElement | null>(null);
  const jitsiApiRef = useRef<JitsiMeetExternalAPIInstance | null>(null);
  const [jitsiReady, setJitsiReady] = useState(false);
  const [autoJoinFailed, setAutoJoinFailed] = useState(false);
  const [autoJoining, setAutoJoining] = useState(false);
  const autoJoinStartedRef = useRef(false);
  const copilotAbortRef = useRef<AbortController | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<MeetRoomDrawerTab>("assistant");
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [embedTimedOut, setEmbedTimedOut] = useState(false);

  const { data: meeting, isLoading } = useQuery({
    queryKey: ["meeting-by-slug", slug],
    queryFn: () => fetchMeetingBySlug(slug!),
    enabled: !!slug,
  });

  const joinMutation = useMutation({
    mutationFn: () => joinMeetingRoom(meeting!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
      queryClient.invalidateQueries({ queryKey: ["meeting", meeting?.id] });
    },
  });

  const activeMeeting = joinMutation.data?.meeting || meeting;
  const meetingId = activeMeeting?.id;

  const syncRecordingState = useMutation({
    mutationFn: (payload: { state: string; recording_url?: string; error?: string }) =>
      api.post(`/meetings/${meetingId}/recording/state/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
    },
  });

  const { data: chat = [] } = useQuery({
    queryKey: ["meeting-chat", meetingId],
    queryFn: async () => {
      const { data } = await api.get<MeetChatMessage[]>(`/meetings/${meetingId}/chat/`);
      return data;
    },
    enabled: !!meetingId,
    refetchInterval: activeMeeting?.status === "live" ? 3000 : 10000,
  });

  const sendChat = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<MeetChatMessage[]>(`/meetings/${meetingId}/chat/`, {
        message: text,
        message_type: "text",
      });
      return data;
    },
    onSuccess: () => {
      setText("");
      setChatError("");
      queryClient.invalidateQueries({ queryKey: ["meeting-chat", meetingId] });
    },
    onError: (error) => setChatError(parseApiError(error, "Could not send that message.")),
  });

  const saveNotes = useMutation({
    mutationFn: async (value: string) => {
      const { data } = await api.patch<MeetSession>(`/meetings/${meetingId}/`, {
        host_notes: value,
      });
      return data;
    },
    onMutate: () => {
      setNotesState("saving");
      setNotesError("");
    },
    onSuccess: (data) => {
      setNotesState("saved");
      setNotesError("");
      queryClient.setQueryData(["meeting-by-slug", slug], data);
      queryClient.setQueryData(["meeting", data.id], data);
    },
    onError: (error) => {
      setNotesState("error");
      setNotesError(parseApiError(error, "Could not save meeting notes."));
    },
  });

  const startMeeting = useMutation({
    mutationFn: () => api.post(`/meetings/${meetingId}/start/`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
      await queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      toast.success({
        title: "Meeting started",
        description: "The live room is now open for participants.",
      });
    },
    onError: (error) => {
      toast.error({
        title: "Could not start meeting",
        description: parseApiError(error, "Could not start the meeting."),
      });
    },
  });

  const endMeeting = useMutation({
    mutationFn: () => api.post(`/meetings/${meetingId}/end/`, { host_notes: notes.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      toast.success({
        title: "Meeting ended",
        description: "The archive is being prepared now.",
      });
      if (meetingId) navigate(`/dashboard/meetings/${meetingId}/archive`);
    },
    onError: (error) => {
      toast.error({
        title: "Could not end meeting",
        description: parseApiError(error, "Could not end the meeting."),
      });
    },
  });

  const startRecording = useMutation({
    mutationFn: () => api.post(`/meetings/${meetingId}/recording/start/`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      await queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
      toast.success({
        title: "Recording requested",
        description: "GRE asked Jitsi to start recording this meeting.",
      });
    },
    onError: (error) => {
      toast.error({
        title: "Could not start recording",
        description: parseApiError(error, "Could not request recording."),
      });
    },
  });

  const stopRecording = useMutation({
    mutationFn: () => api.post(`/meetings/${meetingId}/recording/stop/`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      await queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
      toast.success({
        title: "Recording stop requested",
        description: "GRE asked Jitsi to stop recording this meeting.",
      });
    },
    onError: (error) => {
      toast.error({
        title: "Could not stop recording",
        description: parseApiError(error, "Could not stop recording."),
      });
    },
  });

  const canManage = !!activeMeeting?.can_manage;
  const isLive = activeMeeting?.status === "live";

  useEffect(() => {
    if (!activeMeeting?.id || notesSeedMeetingId === activeMeeting.id) return;
    setNotes(activeMeeting.host_notes || "");
    setNotesSeedMeetingId(activeMeeting.id);
    setNotesState(activeMeeting.host_notes?.trim() ? "saved" : "idle");
    setNotesError("");
  }, [activeMeeting?.host_notes, activeMeeting?.id, notesSeedMeetingId]);

  useEffect(() => {
    if (!canManage || !meetingId || notesSeedMeetingId !== activeMeeting?.id) return;
    const savedNotes = activeMeeting?.host_notes || "";
    if (notes === savedNotes) {
      return;
    }
    setNotesState("dirty");
    const timer = window.setTimeout(() => {
      saveNotes.mutate(notes);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [activeMeeting?.host_notes, activeMeeting?.id, canManage, meetingId, notes, notesSeedMeetingId, saveNotes]);

  useEffect(() => {
    const joinData = joinMutation.data;
    if (!joinData?.token || !joinData.server_url || !roomContainerRef.current) return;

    let cancelled = false;
    let apiInstance: JitsiMeetExternalAPIInstance | null = null;

    const refreshParticipants = () => {
      if (!apiInstance?.getParticipantsInfo) return;
      setRoomParticipants(normalizeParticipants(apiInstance.getParticipantsInfo(), user?.email));
    };

    const boot = async () => {
      setRoomError("");
      setJitsiReady(false);
      await loadJitsiExternalApi(joinData.server_url);
      if (cancelled || !roomContainerRef.current || !window.JitsiMeetExternalAPI) return;

      const domain = new URL(joinData.server_url).host;
      apiInstance = new window.JitsiMeetExternalAPI(domain, {
        roomName: joinData.room_name,
        parentNode: roomContainerRef.current,
        width: "100%",
        height: "100%",
        jwt: joinData.token,
        userInfo: {
          displayName:
            user?.full_name ||
            [user?.firstname, user?.middlename, user?.lastname].filter(Boolean).join(" ") ||
            user?.email,
          email: user?.email,
        },
        configOverwrite: buildJitsiConfigOverwrite(meetHostSettingsFromSession(activeMeeting)),
      });
      jitsiApiRef.current = apiInstance;
      setIsModerator(canManage);
      refreshParticipants();

      const onJoined = () => {
        setJitsiReady(true);
        setEmbedTimedOut(false);
        refreshParticipants();
      };
      const onParticipantJoined = () => refreshParticipants();
      const onParticipantLeft = () => refreshParticipants();
      const onRoleChanged = (payload: { role?: string }) => {
        setIsModerator(payload?.role === "moderator" || canManage);
        refreshParticipants();
      };
      const onRecordingChanged = (payload: { on?: boolean; error?: string }) => {
        syncRecordingState.mutate({
          state: payload?.error ? "failed" : payload?.on ? "recording" : "ready",
          error: payload?.error || "",
        });
      };
      const onReadyToClose = () => {
        queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
        queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
        if (meetingId) navigate(`/dashboard/meetings/${meetingId}/archive`);
      };

      apiInstance.addListener("videoConferenceJoined", onJoined);
      apiInstance.addListener("participantJoined", onParticipantJoined);
      apiInstance.addListener("participantLeft", onParticipantLeft);
      apiInstance.addListener("participantRoleChanged", onRoleChanged);
      apiInstance.addListener("recordingStatusChanged", onRecordingChanged);
      apiInstance.addListener("readyToClose", onReadyToClose);
    };

    boot().catch((error) => {
      setRoomError(error instanceof Error ? error.message : "Could not load the Jitsi meeting room.");
    });

    return () => {
      cancelled = true;
      setJitsiReady(false);
      try {
        apiInstance?.dispose?.();
      } catch {
        // Ignore dispose errors during navigation.
      }
      if (jitsiApiRef.current === apiInstance) {
        jitsiApiRef.current = null;
      }
    };
  }, [
    canManage,
    joinMutation.data,
    meetingId,
    navigate,
    queryClient,
    roomRetryKey,
    slug,
    syncRecordingState,
    user,
  ]);

  useEffect(() => {
    return () => {
      copilotAbortRef.current?.abort();
    };
  }, []);

  const copyLink = async () => {
    const fallback = slug ? `${window.location.origin.replace(/\/$/, "")}/meet/${slug}` : "";
    const link = activeMeeting?.meeting_link || fallback;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success({
        title: "Meeting link copied",
        description: "The share link was copied to your clipboard.",
      });
    } catch {
      window.prompt("Copy meeting link", link);
    }
  };

  const openMeetingPictureInPicture = async () => {
    const fallback = slug ? `${window.location.origin.replace(/\/$/, "")}/meet/${slug}` : "";
    const link = activeMeeting?.meeting_link || fallback;
    if (!link) {
      toast.error({
        title: "Meeting link unavailable",
        description: "Could not open picture-in-picture without a meeting link.",
      });
      return;
    }

    try {
      const docPiP = (window as Window & { documentPictureInPicture?: any }).documentPictureInPicture;
      if (docPiP?.requestWindow) {
        const pipWindow = await docPiP.requestWindow({
          width: 480,
          height: 320,
        });
        pipWindow.document.body.style.margin = "0";
        pipWindow.document.body.style.background = "#020617";

        const frame = pipWindow.document.createElement("iframe");
        frame.src = link;
        frame.style.width = "100%";
        frame.style.height = "100%";
        frame.style.border = "0";
        frame.allow =
          "camera; microphone; fullscreen; display-capture; autoplay; clipboard-write; encrypted-media";
        pipWindow.document.body.appendChild(frame);
        toast.success({
          title: "Picture-in-picture opened",
          description: "Meeting popped out into a floating window.",
        });
        return;
      }

      const popup = window.open(
        link,
        "gre-meet-pip",
        "popup=yes,width=480,height=320,noopener,noreferrer"
      );
      if (!popup) {
        toast.error({
          title: "Popup blocked",
          description: "Allow popups for this site to open a mini meeting window.",
        });
        return;
      }
      toast.success({
        title: "Mini meeting window opened",
        description: "Using popup mode because native picture-in-picture is unavailable.",
      });
    } catch (error) {
      toast.error({
        title: "Could not open picture-in-picture",
        description: error instanceof Error ? error.message : "Unexpected browser error.",
      });
    }
  };

  const canJoinMeeting =
    meeting?.can_join !== false &&
    (meeting?.status === "scheduled" || meeting?.status === "live");

  const isConnected = !!joinMutation.data?.token && !!joinMutation.data?.server_url;
  const isPreparingRoom =
    joinMutation.isPending || startMeeting.isPending || autoJoining;
  const showManualJoin = lobbyOnly || autoJoinFailed || joinMutation.isError;
  const shareLink =
    activeMeeting?.meeting_link ||
    (slug ? `${window.location.origin.replace(/\/$/, "")}/meet/${slug}` : "");
  const archiveId = activeMeeting ? formatMeetingId(activeMeeting.id) : "";
  const embedUnavailable = isConnected && !jitsiReady && (embedTimedOut || !!roomError);
  const embedStatusMessage =
    roomError ||
    "The embedded meeting is taking too long to start. This is usually a Jitsi network/auth issue.";
  useEffect(() => {
    if (!isConnected || jitsiReady || !!roomError) {
      setEmbedTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => {
      if (!jitsiReady) setEmbedTimedOut(true);
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [isConnected, jitsiReady, roomError]);
  const notesStatusLabel =
    notesState === "saving"
      ? "Saving notes..."
      : notesState === "saved"
        ? "Notes saved to GRE"
        : notesState === "error"
          ? "Notes could not be saved"
          : notesState === "dirty"
            ? "Waiting to save..."
            : "Notes will be saved to GRE";

  const headerTitle = activeMeeting?.title || "GRE Meet";
  const subtitle = useMemo(() => {
    if (!activeMeeting) return "";
    return `${activeMeeting.category_name} / ${activeMeeting.sub_category_name} · ${formatMeetingDate(activeMeeting.scheduled_at)}`;
  }, [activeMeeting]);

  const runModeratorCommand = (command: string, ...args: unknown[]) => {
    const apiInstance = jitsiApiRef.current;
    if (!apiInstance) {
      setRoomError("The Jitsi room is not ready yet.");
      return false;
    }
    try {
      apiInstance.executeCommand(command, ...args);
      return true;
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : "Could not run that Jitsi command.");
      return false;
    }
  };

  const runParticipantAction = (
    participantId: string,
    command: string,
    successTitle: string,
    successDescription: string,
    fallbackError: string
  ) => {
    if (!participantId) return;
    const ok = runModeratorCommand(command, participantId);
    if (ok) {
      toast.success({ title: successTitle, description: successDescription });
    } else {
      toast.error({
        title: "Could not run attendee action",
        description: fallbackError,
      });
    }
  };

  const handleStartRecording = async () => {
    try {
      await startRecording.mutateAsync();
      runModeratorCommand("startRecording", { mode: "file" });
    } catch (error) {
      setRoomError(parseApiError(error, "Could not request recording."));
    }
  };

  const handleStopRecording = async () => {
    if (!runModeratorCommand("stopRecording", "file")) return;
    try {
      await stopRecording.mutateAsync();
    } catch (error) {
      setRoomError(parseApiError(error, "Could not stop recording."));
    }
  };

  const handleEndConference = async () => {
    if (canManage) {
      runModeratorCommand("endConference");
    }
    endMeeting.mutate();
  };

  const prepareRoom = useCallback(async () => {
    const session = joinMutation.data?.meeting || meeting;
    if (!session?.id) {
      throw new Error("Meeting is not ready yet.");
    }
    if (session.can_manage && session.status === "scheduled") {
      await startMeeting.mutateAsync();
    }
    return joinMutation.data ?? (await joinMutation.mutateAsync());
  }, [joinMutation, meeting, startMeeting]);

  const handleEnterRoom = useCallback(async () => {
    try {
      setAutoJoinFailed(false);
      await prepareRoom();
      setRoomError("");
    } catch (error) {
      setAutoJoinFailed(true);
      setRoomError(parseApiError(error, "Could not prepare the meeting room."));
    }
  }, [prepareRoom]);

  useEffect(() => {
    autoJoinStartedRef.current = false;
    setAutoJoinFailed(false);
    setAutoJoining(false);
  }, [slug]);

  useEffect(() => {
    if (lobbyOnly || isLoading || !meeting || !canJoinMeeting) return;
    if (autoJoinStartedRef.current || joinMutation.data?.token) return;
    autoJoinStartedRef.current = true;
    setAutoJoining(true);
    void handleEnterRoom().finally(() => setAutoJoining(false));
  }, [
    canJoinMeeting,
    handleEnterRoom,
    isLoading,
    joinMutation.data?.token,
    lobbyOnly,
    meeting?.id,
    meeting?.status,
  ]);

  const handleOpenExternalRoom = async () => {
    try {
      const joinData = await prepareRoom();
      const directUrl = buildExternalRoomUrl(joinData);
      if (!directUrl) {
        throw new Error("Could not create the external room URL.");
      }
      window.location.assign(directUrl);
    } catch (error) {
      const detail = parseApiError(error, "Could not open the external room.");
      setRoomError(detail);
      toast.error({
        title: "Could not join in browser",
        description: detail,
      });
    }
  };

  useEffect(() => {
    if (!meetingId || !isLive || activeMeeting?.gre_assistant_enabled === false) return;

    const refreshNotes = () => {
      void captureMeetingAssistantNotes(meetingId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
          queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
        })
        .catch(() => {
          // Silent: capture is best-effort during live meetings.
        });
    };

    const initialTimer = window.setTimeout(refreshNotes, 45000);
    const interval = window.setInterval(refreshNotes, 120000);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [activeMeeting?.gre_assistant_enabled, isLive, meetingId, queryClient, slug]);

  const runCopilot = async (task: CopilotTask, question?: string) => {
    if (!activeMeeting) return;
    copilotAbortRef.current?.abort();
    setCopilotOutput("");
    setCopilotError("");
    setCopilotLoading(true);

    const health = await assistantHealth();
    if (!health.available) {
      setCopilotError(health.hint || health.error || "GRE Assistant is not available right now.");
      setCopilotLoading(false);
      return;
    }

    const controller = new AbortController();
    copilotAbortRef.current = controller;

    assistantSummarizeTextStream(
      buildCopilotPrompt(activeMeeting, chat, notes, task, question),
      {
        onToken: (token) => setCopilotOutput((current) => current + token),
        onError: (message) => setCopilotError(message),
        onDone: () => setCopilotLoading(false),
      },
      controller.signal
    ).catch((error: Error) => {
      if (error.name === "AbortError") return;
      setCopilotError(error.message || "Could not run the meeting copilot.");
      setCopilotLoading(false);
    });
  };

  if (isLoading || !meeting) {
    return <div className="gre-skeleton fixed inset-0 bg-slate-950" />;
  }

  if (activeMeeting?.status === "ended") {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="gre-card space-y-5 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Meeting ended</p>
          <h1 className="text-2xl font-bold text-ink">{activeMeeting.title}</h1>
          <p className="text-sm text-slate-600">
            This room is closed. The recording, transcript, and summary are available in the GRE archive view.
          </p>
          <Link to={`/dashboard/meetings/${activeMeeting.id}/archive`}>
            <Button>Open archive</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (activeMeeting?.status === "cancelled") {
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="gre-card space-y-5 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Meeting cancelled
          </p>
          <h1 className="text-2xl font-bold text-ink">{activeMeeting.title}</h1>
          <p className="text-sm text-slate-600">
            This scheduled meeting was cancelled before it started, so no archive was created.
          </p>
          <Link to={`/dashboard/meetings/${activeMeeting.id}`}>
            <Button>Open meeting details</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-0 bg-slate-950 p-2 sm:p-3">
      <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      {!isConnected ? (
        <div className="flex h-full flex-col items-center justify-center gap-5 p-6 text-center text-white">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/20 text-brand-300">
            {isPreparingRoom && !showManualJoin ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Video className="h-8 w-8" />
            )}
          </div>
          <div>
            <p className="text-xl font-semibold">
              {isPreparingRoom && !showManualJoin
                ? "Joining meeting room…"
                : activeMeeting?.status === "live"
                  ? "Join the live GRE meeting"
                  : "Ready to enter GRE Meet"}
            </p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">
              {isPreparingRoom && !showManualJoin
                ? "GRE is starting the session if needed and opening the video room. This usually takes a few seconds."
                : "Open Meeting controls for links, details, and manual join options."}
            </p>
          </div>
          {showManualJoin && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button loading={isPreparingRoom} onClick={() => void handleEnterRoom()}>
                {isPreparingRoom ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Preparing room
                  </>
                ) : activeMeeting?.status === "live" ? (
                  <>
                    <Radio className="h-4 w-4" />
                    Join live meeting
                  </>
                ) : (
                  <>
                    <Video className="h-4 w-4" />
                    Enter meeting room
                  </>
                )}
              </Button>
              <Button variant="secondary" onClick={() => void handleOpenExternalRoom()}>
                <ExternalLink className="h-4 w-4" />
                Join in browser
              </Button>
            </div>
          )}
          {(joinMutation.isError || roomError) && (
            <p className="text-sm text-red-400">
              {roomError || parseApiError(joinMutation.error, "Could not join the meeting room.")}
            </p>
          )}
          {!drawerOpen && (
            <button
              type="button"
              onClick={() => {
                setDrawerTab("info");
                setDrawerOpen(true);
              }}
              className="text-sm font-semibold text-brand-300 underline-offset-2 hover:underline"
            >
              Open meeting details
            </button>
          )}
        </div>
      ) : embedUnavailable ? (
        <div className="flex h-full flex-col items-center justify-center gap-5 p-6 text-center text-white">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-red-300">
            <Video className="h-8 w-8" />
          </div>
          <div>
            <p className="text-xl font-semibold">Embedded room unavailable</p>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">{embedStatusMessage}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => setRoomRetryKey((value) => value + 1)}>
              <RefreshCcw className="h-4 w-4" />
              Retry embed
            </Button>
            <Button onClick={handleOpenExternalRoom}>
              <ExternalLink className="h-4 w-4" />
              Join in browser
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative h-full w-full">
          <div ref={roomContainerRef} className="h-full w-full" />
          {roomError && (
            <div className="absolute inset-x-4 top-4 rounded-2xl bg-red-950/90 px-4 py-3 text-sm text-red-200 shadow">
              {roomError}
            </div>
          )}
        </div>
      )}

      {!drawerOpen && <MeetRoomControlsFab onClick={() => setDrawerOpen(true)} />}

      {activeMeeting && (
        <MeetRoomToolsDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          tab={drawerTab}
          onTabChange={setDrawerTab}
          canManage={canManage}
          meetingTitle={headerTitle}
          panels={{
            info: (
              <div className="space-y-5">
                <Link
                  to={meetingId ? `/dashboard/meetings/${meetingId}` : "/dashboard/meetings"}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to meeting
                </Link>
                <div>
                  <h3 className="text-lg font-bold text-ink">{headerTitle}</h3>
                  <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">
                    {archiveId}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize text-slate-600">
                    {activeMeeting.status}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                    {roomParticipants.length} live participant
                    {roomParticipants.length === 1 ? "" : "s"}
                  </span>
                </div>
                {!isConnected && (
                  <div className="space-y-3 border-t border-slate-100 pt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Join room
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button loading={isPreparingRoom} onClick={() => void handleEnterRoom()}>
                        {canManage && activeMeeting.status === "scheduled" ? (
                          <>
                            <Radio className="h-4 w-4" />
                            Start and enter
                          </>
                        ) : (
                          <>
                            <Video className="h-4 w-4" />
                            Enter room
                          </>
                        )}
                      </Button>
                      <Button variant="secondary" onClick={() => void handleOpenExternalRoom()}>
                        <ExternalLink className="h-4 w-4" />
                        Join in browser
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ),
            assistant: (
                <div className="space-y-5">
                  <MeetingGreAssistantPanel meeting={activeMeeting} compact />
                  {canManage && (
                    <div className="space-y-3 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Host notes for minutes
                        </p>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                          Auto-saved
                        </span>
                      </div>
                      <Textarea
                        label="Meeting notes"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Capture decisions, next steps, or context for the final archive summary..."
                        rows={4}
                      />
                      <p
                        className={`text-xs font-medium ${notesState === "error" ? "text-red-600" : "text-slate-500"}`}
                      >
                        {notesStatusLabel}
                      </p>
                      {notesError && <p className="text-xs text-red-600">{notesError}</p>}
                    </div>
                  )}
                </div>
              ),
              chat: (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Messages here are preserved for GRE Assistant notes, meeting minutes, and the archive.
                  </p>
                  <div className="max-h-[50vh] space-y-3 overflow-y-auto rounded-2xl bg-slate-50/80 p-1">
                    {chat.map((message) => (
                      <div key={message.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {message.sender?.full_name ||
                              `${message.sender?.firstname ?? ""} ${message.sender?.lastname ?? ""}`.trim() ||
                              message.sender?.email}
                            {message.sender_id === user?.id ? " · You" : ""}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            {formatChatTimestamp(message.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-700">{message.message}</p>
                      </div>
                    ))}
                    {chat.length === 0 && (
                      <p className="px-3 py-2 text-sm text-slate-500">
                        No GRE chat messages yet. Start the discussion.
                      </p>
                    )}
                  </div>
                  <form
                    className="space-y-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!text.trim()) return;
                      sendChat.mutate();
                    }}
                  >
                    <Textarea
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="Share a point, question, or reaction..."
                      rows={3}
                    />
                    {chatError && <p className="text-sm text-red-600">{chatError}</p>}
                    <div className="flex justify-end">
                      <Button type="submit" loading={sendChat.isPending} disabled={!text.trim() || !meetingId}>
                        <Send className="h-4 w-4" />
                        Send
                      </Button>
                    </div>
                  </form>
                </div>
              ),
              host: (
                <MeetHostToolsPanel
                  meeting={activeMeeting}
                  canManage={canManage}
                  showLiveControls
                  roomReady={isConnected && jitsiReady}
                  onMuteEveryone={(mediaType) => runModeratorCommand("muteEveryone", mediaType)}
                  onStopScreenshare={() => {
                    if (!runModeratorCommand("muteEveryone", "desktop")) {
                      runModeratorCommand("toggleShareScreen");
                    }
                  }}
                />
              ),
              people: (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={copyLink}>
                      <Copy className="h-4 w-4" />
                      Copy link
                    </Button>
                    <Button variant="secondary" onClick={() => void openMeetingPictureInPicture()}>
                      <PictureInPicture2 className="h-4 w-4" />
                      Picture in picture
                    </Button>
                    {shareLink && (
                      <a href={shareLink} target="_blank" rel="noreferrer">
                        <Button variant="ghost">
                          <ExternalLink className="h-4 w-4" />
                          Open GRE link
                        </Button>
                      </a>
                    )}
                  </div>
                  {canManage && activeMeeting.screen_share_moderator_only && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Per-attendee moderation
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Select one attendee below, then run actions only for that attendee.
                      </p>
                    </div>
                  )}

                  {roomParticipants.map((participant) => (
                    <div
                      key={participant.id}
                      className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 transition ${
                        participant.id === selectedParticipantId
                          ? "border-brand-300 bg-brand-50/70"
                          : "border-slate-100 bg-slate-50"
                      }`}
                      onClick={() => setSelectedParticipantId(participant.id)}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {participant.displayName}
                          {participant.isLocal ? " · You" : ""}
                        </p>
                        {participant.email && (
                          <p className="truncate text-xs text-slate-500">{participant.email}</p>
                        )}
                      </div>
                      {isModerator && !participant.isLocal && participant.id && (
                        <Button
                          variant="ghost"
                          className="shrink-0 text-red-600 hover:text-red-700"
                          onClick={(event) => {
                            event.stopPropagation();
                            runParticipantAction(
                              participant.id,
                              "kickParticipant",
                              "Attendee removed",
                              "The attendee was removed from the meeting.",
                              "Could not remove this attendee."
                            );
                          }}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {canManage && selectedParticipantId && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Selected attendee actions
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            runParticipantAction(
                              selectedParticipantId,
                              "muteParticipant",
                              "Microphone muted",
                              "Attendee microphone was muted.",
                              "Could not mute this attendee's microphone."
                            )
                          }
                        >
                          <MicOff className="h-4 w-4" />
                          Mute mic
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() =>
                            runParticipantAction(
                              selectedParticipantId,
                              "muteParticipantVideo",
                              "Camera turned off",
                              "Attendee camera was turned off.",
                              "Could not turn off this attendee's camera."
                            )
                          }
                        >
                          <VideoOff className="h-4 w-4" />
                          Turn off video
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() =>
                            runParticipantAction(
                              selectedParticipantId,
                              "grantModerator",
                              "Screen sharing allowed",
                              "Attendee can now share screen as a moderator.",
                              "Could not allow screen sharing for this attendee."
                            )
                          }
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Allow share
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() =>
                            runParticipantAction(
                              selectedParticipantId,
                              "kickParticipant",
                              "Attendee removed",
                              "The attendee was removed from the meeting.",
                              "Could not remove this attendee."
                            )
                          }
                        >
                          <UserX className="h-4 w-4" />
                          Remove attendee
                        </Button>
                      </div>
                    </div>
                  )}
                  {roomParticipants.length === 0 && (
                    <p className="text-sm text-slate-500">No room participants detected yet.</p>
                  )}
                </div>
              ),
              session: (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500">
                    Recording, external browser join, and ending the meeting are managed here.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeMeeting.status === "scheduled" && (
                      <Button loading={startMeeting.isPending} onClick={() => startMeeting.mutate()}>
                        Start on GRE
                      </Button>
                    )}
                    <Button variant="secondary" onClick={() => void handleOpenExternalRoom()}>
                      <ExternalLink className="h-4 w-4" />
                      Join in browser
                    </Button>
                    {isModerator && isLive && activeMeeting.recording_status !== "recording" && (
                      <Button
                        variant="secondary"
                        loading={startRecording.isPending}
                        onClick={handleStartRecording}
                      >
                        Start recording
                      </Button>
                    )}
                    {isModerator && isLive && activeMeeting.recording_status === "recording" && (
                      <Button variant="ghost" loading={stopRecording.isPending} onClick={handleStopRecording}>
                        Stop recording
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      loading={endMeeting.isPending}
                      onClick={() => setConfirmEndOpen(true)}
                    >
                      End meeting
                    </Button>
                  </div>
                  {canManage && (
                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Optional copilot drafts
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          loading={copilotLoading}
                          onClick={() => void runCopilot("notes")}
                        >
                          <Sparkles className="h-4 w-4" />
                          Draft notes
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          loading={copilotLoading}
                          onClick={() => void runCopilot("actions")}
                        >
                          Action items
                        </Button>
                      </div>
                      {(copilotOutput || copilotError || copilotLoading) && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          {copilotError ? (
                            <p className="text-sm text-red-600">{copilotError}</p>
                          ) : (
                            <FormattedAssistantText content={copilotOutput} streaming={copilotLoading} />
                          )}
                          {copilotOutput && (
                            <Button
                              type="button"
                              variant="secondary"
                              className="mt-3"
                              onClick={() => setNotes(copilotOutput)}
                            >
                              Use as host notes
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ),
            }}
          />
      )}
      </div>

      <ConfirmDialog
        open={confirmEndOpen}
        title="End this meeting?"
        description="This will close the live room for everyone and finalize the GRE archive."
        confirmLabel="End meeting"
        cancelLabel="Keep meeting live"
        tone="danger"
        loading={endMeeting.isPending}
        onClose={() => setConfirmEndOpen(false)}
        onConfirm={() => {
          handleEndConference();
          setConfirmEndOpen(false);
        }}
      />
    </div>
  );
}
