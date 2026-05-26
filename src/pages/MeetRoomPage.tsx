import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bot,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  MicOff,
  MonitorUp,
  Radio,
  RefreshCcw,
  Send,
  Sparkles,
  UserX,
  Users,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { useAuth } from "../context/AuthContext";
import { assistantHealth, assistantSummarizeTextStream } from "../lib/assistant";
import api, { parseApiError } from "../lib/api";
import { FormattedAssistantText } from "../lib/formatAssistantText";
import {
  type JitsiMeetExternalAPIInstance,
  type JitsiParticipantInfo,
  loadJitsiExternalApi,
} from "../lib/jitsi";
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

export function MeetRoomPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
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
  const [copilotQuestion, setCopilotQuestion] = useState("");
  const roomContainerRef = useRef<HTMLDivElement | null>(null);
  const jitsiApiRef = useRef<JitsiMeetExternalAPIInstance | null>(null);
  const copilotAbortRef = useRef<AbortController | null>(null);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
    },
  });

  const endMeeting = useMutation({
    mutationFn: () => api.post(`/meetings/${meetingId}/end/`, { host_notes: notes.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      if (meetingId) navigate(`/dashboard/meetings/${meetingId}/archive`);
    },
  });

  const startRecording = useMutation({
    mutationFn: () => api.post(`/meetings/${meetingId}/recording/start/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
    },
  });

  const stopRecording = useMutation({
    mutationFn: () => api.post(`/meetings/${meetingId}/recording/stop/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
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
        configOverwrite: {
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          startAudioOnly: false,
          toolbarButtons: [
            "microphone",
            "camera",
            "desktop",
            "participants-pane",
            "tileview",
            "select-background",
            "settings",
            "raisehand",
            "videoquality",
            "recording",
            "end-conference",
            "mute-everyone",
            "hangup",
          ],
        },
      });
      jitsiApiRef.current = apiInstance;
      setIsModerator(canManage);
      refreshParticipants();

      const onJoined = () => refreshParticipants();
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
    } catch {
      window.prompt("Copy meeting link", link);
    }
  };

  const isConnected = !!joinMutation.data?.token && !!joinMutation.data?.server_url;
  const shareLink =
    activeMeeting?.meeting_link ||
    (slug ? `${window.location.origin.replace(/\/$/, "")}/meet/${slug}` : "");
  const archiveId = activeMeeting ? formatMeetingId(activeMeeting.id) : "";
  const embedUnavailable = isConnected && !!roomError && !jitsiApiRef.current;
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
    return <div className="gre-skeleton m-4 h-[80vh] rounded-3xl" />;
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

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="gre-card flex flex-wrap items-start justify-between gap-4 p-6">
          <div>
            <Link
              to={meetingId ? `/dashboard/meetings/${meetingId}` : "/dashboard/meetings"}
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to meeting
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-ink">{headerTitle}</h1>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700">
                {archiveId}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize text-slate-600">
                {activeMeeting?.status}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">
                {roomParticipants.length} live participant{roomParticipants.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={copyLink}>
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
            {shareLink && (
              <a href={shareLink} target="_blank" rel="noreferrer">
                <Button variant="ghost">
                  <ExternalLink className="h-4 w-4" />
                  Open link
                </Button>
              </a>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="min-w-0">
            <div className="gre-card overflow-hidden p-0">
              <div className="border-b border-slate-200 px-6 py-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-ink">Meeting room</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Join the live GRE Meet room, or fall back to the external meeting link if the embedded room cannot load.
                    </p>
                  </div>
                  <div className="min-w-[280px] flex-1">
                    <Input label="Meeting link" readOnly value={shareLink} />
                  </div>
                </div>
              </div>

              {!isConnected ? (
                <div className="flex min-h-[68vh] flex-col items-center justify-center gap-5 p-8 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <Video className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-ink">
                      {activeMeeting?.status === "live" ? "Join the live GRE meeting" : "Ready to enter GRE Meet"}
                    </p>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
                      GRE prepares a signed room token just before you join. The meeting link uses the shareable format
                      `/meet/gre-xxxx-xxxx`, and camera, microphone, screen share, and moderator tools appear inside the
                      live room.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button loading={joinMutation.isPending} onClick={() => joinMutation.mutate()}>
                      {joinMutation.isPending ? (
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
                    {shareLink && (
                      <a href={shareLink} target="_blank" rel="noreferrer">
                        <Button variant="secondary">
                          <ExternalLink className="h-4 w-4" />
                          Open external room
                        </Button>
                      </a>
                    )}
                  </div>
                  {joinMutation.isError && (
                    <p className="text-sm text-red-600">
                      {parseApiError(joinMutation.error, "Could not join the meeting room.")}
                    </p>
                  )}
                </div>
              ) : embedUnavailable ? (
                <div className="flex min-h-[68vh] flex-col items-center justify-center gap-5 p-8 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <Video className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-xl font-semibold text-ink">Embedded room unavailable</p>
                    <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">{roomError}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Button variant="secondary" onClick={() => setRoomRetryKey((value) => value + 1)}>
                      <RefreshCcw className="h-4 w-4" />
                      Retry embed
                    </Button>
                    {shareLink && (
                      <a href={shareLink} target="_blank" rel="noreferrer">
                        <Button>
                          <ExternalLink className="h-4 w-4" />
                          Open external room
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative h-[calc(100vh-14rem)] min-h-[620px] bg-slate-950">
                  <div ref={roomContainerRef} className="h-full w-full" />
                  {roomError && (
                    <div className="absolute inset-x-4 top-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 shadow">
                      {roomError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="gre-card space-y-4 p-5">
              <h2 className="text-lg font-semibold text-ink">Room controls</h2>
              <p className="text-sm text-slate-500">
                GRE manages the archive and notes while Jitsi runs the live video room.
              </p>
              <div className="flex flex-wrap gap-2">
                {canManage && activeMeeting?.status === "scheduled" && (
                  <Button loading={startMeeting.isPending} onClick={() => startMeeting.mutate()}>
                    Start on GRE
                  </Button>
                )}
                {isModerator && isLive && activeMeeting?.recording_status !== "recording" && (
                  <Button variant="secondary" loading={startRecording.isPending} onClick={handleStartRecording}>
                    Start recording
                  </Button>
                )}
                {isModerator && isLive && activeMeeting?.recording_status === "recording" && (
                  <Button variant="ghost" loading={stopRecording.isPending} onClick={handleStopRecording}>
                    Stop recording
                  </Button>
                )}
                {isModerator && (
                  <Button variant="secondary" onClick={() => runModeratorCommand("muteEveryone", "audio")}>
                    <MicOff className="h-4 w-4" />
                    Mute all
                  </Button>
                )}
                {isModerator && (
                  <Button variant="secondary" onClick={() => runModeratorCommand("muteEveryone", "video")}>
                    <MonitorUp className="h-4 w-4" />
                    Stop cameras
                  </Button>
                )}
                {canManage && (
                  <Button variant="danger" loading={endMeeting.isPending} onClick={handleEndConference}>
                    End meeting
                  </Button>
                )}
              </div>
              <p className="text-xs leading-relaxed text-slate-500">
                Local microphone, camera, screen share, and participant layout controls remain inside the Jitsi toolbar under the meeting grid.
              </p>
            </div>

            <div className="gre-card space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-semibold text-ink">AI copilot and note taker</h2>
              </div>
              <p className="text-sm text-slate-500">
                Save meeting notes to GRE and use the AI copilot to draft notes, recaps, and action items from the live archive chat.
              </p>
              <Textarea
                label="Meeting notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder={
                  canManage
                    ? "Capture decisions, next steps, or context for the final archive summary..."
                    : "The host's saved meeting notes will appear here."
                }
                readOnly={!canManage}
                rows={6}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className={`font-medium ${notesState === "error" ? "text-red-600" : "text-slate-500"}`}>
                  {notesStatusLabel}
                </span>
                {notesError && <span className="text-red-600">{notesError}</span>}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" loading={copilotLoading} onClick={() => void runCopilot("notes")}>
                  <Sparkles className="h-4 w-4" />
                  Draft notes
                </Button>
                <Button type="button" variant="ghost" loading={copilotLoading} onClick={() => void runCopilot("actions")}>
                  Action items
                </Button>
                <Button type="button" variant="ghost" loading={copilotLoading} onClick={() => void runCopilot("recap")}>
                  Late-join recap
                </Button>
              </div>

              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!copilotQuestion.trim()) return;
                  void runCopilot("question", copilotQuestion);
                }}
              >
                <Textarea
                  label="Ask the meeting copilot"
                  value={copilotQuestion}
                  onChange={(event) => setCopilotQuestion(event.target.value)}
                  placeholder="What decisions have we made so far? What should happen next?"
                  rows={3}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={!copilotQuestion.trim()} loading={copilotLoading}>
                    <Bot className="h-4 w-4" />
                    Ask copilot
                  </Button>
                </div>
              </form>

              {(copilotOutput || copilotError || copilotLoading) && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-ink">Copilot response</p>
                    {copilotOutput && canManage && (
                      <Button type="button" variant="secondary" className="px-3 py-2 text-xs" onClick={() => setNotes(copilotOutput)}>
                        Use as notes
                      </Button>
                    )}
                  </div>
                  {copilotError ? (
                    <p className="mt-3 text-sm text-red-600">{copilotError}</p>
                  ) : (
                    <div className="mt-3">
                      <FormattedAssistantText content={copilotOutput} streaming={copilotLoading} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="gre-card space-y-4 p-5">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-semibold text-ink">Live participants</h2>
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {roomParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {participant.displayName}
                        {participant.isLocal ? " · You" : ""}
                      </p>
                      {participant.email && <p className="truncate text-xs text-slate-500">{participant.email}</p>}
                    </div>
                    {isModerator && !participant.isLocal && participant.id && (
                      <Button
                        variant="ghost"
                        className="shrink-0 text-red-600 hover:text-red-700"
                        onClick={() => runModeratorCommand("kickParticipant", participant.id)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {roomParticipants.length === 0 && <p className="text-sm text-slate-500">No room participants detected yet.</p>}
              </div>
            </div>

            <div className="gre-card space-y-4 p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-600" />
                <h2 className="text-lg font-semibold text-ink">GRE archive chat</h2>
              </div>
              <p className="text-sm text-slate-500">
                Messages here are preserved for the post-meeting summary, AI copilot, and archive review.
              </p>
              <div className="max-h-[320px] space-y-3 overflow-y-auto rounded-2xl bg-slate-50/80 p-1">
                {chat.map((message) => (
                  <div key={message.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {message.sender?.full_name ||
                          `${message.sender?.firstname ?? ""} ${message.sender?.lastname ?? ""}`.trim() ||
                          message.sender?.email}
                        {message.sender_id === user?.id ? " · You" : ""}
                      </p>
                      <span className="text-[11px] text-slate-400">{formatChatTimestamp(message.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{message.message}</p>
                  </div>
                ))}
                {chat.length === 0 && <p className="px-3 py-2 text-sm text-slate-500">No GRE chat messages yet. Start the discussion.</p>}
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
          </aside>
        </div>
      </div>
    </div>
  );
}
