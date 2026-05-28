import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
  Mic,
  MicOff,
  MoreVertical,
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
import { UserAvatar } from "../components/ui/UserAvatar";
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
import { BrandMark } from "../components/brand/BrandMark";
import { MeetingGreAssistantPanel } from "../components/meet/MeetingGreAssistantPanel";
import { captureMeetingAssistantNotes } from "../lib/meetAssistant";
import {
  applyJitsiJoinMediaPolicy,
  buildJitsiConfigOverwrite,
  meetHostSettingsFromSession,
} from "../lib/meetHostSettings";
import {
  fetchMeetingBySlug,
  formatMeetingDate,
  formatMeetingId,
  inviteMeetingByEmail,
  joinMeetingRoom,
} from "../lib/meetings";
import type { MeetChatMessage, MeetSession } from "../types";

function normalizeParticipants(rows: JitsiParticipantInfo[] | undefined, localEmail?: string) {
  const local = (localEmail || "").toLowerCase();
  const byKey = new Map<
    string,
    {
      id: string;
      displayName: string;
      email?: string;
      isLocal?: boolean;
      audioMuted?: boolean;
      videoMuted?: boolean;
    }
  >();
  const normalized: {
    id: string;
    displayName: string;
    email?: string;
    isLocal?: boolean;
    audioMuted?: boolean;
    videoMuted?: boolean;
  }[] = [];

  for (const row of rows ?? []) {
    const id = row.participantId || row.id || "";
    const email = row.email?.toLowerCase() || "";
    const displayName = row.displayName || row.email || "Participant";
    const candidate = {
      id,
      displayName,
      email: row.email,
      isLocal: !!local && email === local,
      audioMuted: !!(row.audioMuted ?? row.isAudioMuted ?? row.muted ?? row.isMuted),
      videoMuted: !!(row.videoMuted ?? row.isVideoMuted),
    };
    const key = email ? `email:${email}` : `name:${displayName.trim().toLowerCase()}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, candidate);
      continue;
    }
    byKey.set(key, {
      id: existing.id || candidate.id,
      displayName: existing.displayName || candidate.displayName,
      email: existing.email || candidate.email,
      isLocal: existing.isLocal || candidate.isLocal,
      audioMuted: candidate.audioMuted,
      videoMuted: candidate.videoMuted,
    });
  }

  for (const value of byKey.values()) {
    normalized.push(value);
  }

  return normalized;
}

function formatChatTimestamp(value?: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return value;
  }
}

function parseReplyPayload(rawMessage: string): {
  replyToName?: string;
  replySnippet?: string;
  body: string;
} {
  const text = (rawMessage || "").trim();
  if (!text) return { body: "" };

  const lines = text.split("\n");
  const firstLine = lines[0] || "";
  const rest = lines.slice(1).join("\n").trim();

  // New structured format used by this client.
  if (firstLine.startsWith("[[GRE_REPLY]]")) {
    const payload = firstLine.replace("[[GRE_REPLY]]", "");
    const [name = "", snippet = ""] = payload.split("|||");
    return {
      replyToName: name.trim() || "Participant",
      replySnippet: snippet.trim(),
      body: rest,
    };
  }

  // Backward compatibility with old inline text format.
  const legacy = firstLine.match(/^↪\s*Reply to\s+(.+?):\s*"(.*)"$/);
  if (legacy) {
    return {
      replyToName: (legacy[1] || "").trim() || "Participant",
      replySnippet: (legacy[2] || "").trim(),
      body: rest,
    };
  }

  return { body: text };
}

function normalizeRoomErrorMessage(raw: string): string {
  const message = (raw || "").trim();
  const lower = message.toLowerCase();
  if (lower.includes("recording is not configured") || lower.includes("enable jibri")) {
    return "Recording is not available on this meeting server yet. Please ask the GRE admin to enable recording.";
  }
  return message;
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
    {
      id: string;
      displayName: string;
      email?: string;
      isLocal?: boolean;
      audioMuted?: boolean;
      videoMuted?: boolean;
    }[]
  >([]);
  const [isModerator, setIsModerator] = useState(false);
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
  const [participantActionMenuId, setParticipantActionMenuId] = useState<string | null>(null);
  const [waitingGuests, setWaitingGuests] = useState<
    { id: string; displayName: string; email?: string }[]
  >([]);
  const [roomDebug, setRoomDebug] = useState({
    bootRuns: 0,
    scriptLoaded: false,
    apiConstructed: false,
    joinedEvent: false,
    lastError: "",
  });
  const [inviteEmail, setInviteEmail] = useState("");
  const [pipOpening, setPipOpening] = useState(false);
  const [inviteSending, setInviteSending] = useState(false);
  const [replyTarget, setReplyTarget] = useState<MeetChatMessage | null>(null);
  const [tagTarget, setTagTarget] = useState<MeetChatMessage | null>(null);
  const [activeMessageActionId, setActiveMessageActionId] = useState<number | null>(null);
  const assistantCaptureUnavailableRef = useRef(false);
  const messageHoldTimeoutRef = useRef<number | null>(null);

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
      const taggedName =
        tagTarget?.sender?.full_name ||
        `${tagTarget?.sender?.firstname ?? ""} ${tagTarget?.sender?.lastname ?? ""}`.trim() ||
        tagTarget?.sender?.email ||
        "";
      const replyName =
        replyTarget?.sender?.full_name ||
        `${replyTarget?.sender?.firstname ?? ""} ${replyTarget?.sender?.lastname ?? ""}`.trim() ||
        replyTarget?.sender?.email ||
        "";
      const messageText = text.trim();
      const prefixParts: string[] = [];
      if (taggedName) prefixParts.push(`@${taggedName}`);
      if (replyTarget) {
        const snippet = (replyTarget.message || "").replace(/\s+/g, " ").trim().slice(0, 160);
        prefixParts.push(
          `[[GRE_REPLY]]${replyName || "participant"}|||${snippet}`
        );
      }
      const composedMessage = [...prefixParts, messageText].join("\n").trim();
      const { data } = await api.post<MeetChatMessage[]>(`/meetings/${meetingId}/chat/`, {
        message: composedMessage,
        message_type: "text",
      });
      return data;
    },
    onSuccess: () => {
      setText("");
      setReplyTarget(null);
      setTagTarget(null);
      setChatError("");
      queryClient.invalidateQueries({ queryKey: ["meeting-chat", meetingId] });
    },
    onError: (error) => setChatError(parseApiError(error, "Could not send that message.")),
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
    mutationFn: () => api.post(`/meetings/${meetingId}/end/`),
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
    mutationFn: async () => {
      const { data } = await api.post<MeetSession>(`/meetings/${meetingId}/recording/start/`);
      return data;
    },
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
    mutationFn: async () => {
      const { data } = await api.post<MeetSession>(`/meetings/${meetingId}/recording/stop/`);
      return data;
    },
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
  const syncRecordingMutation = syncRecordingState.mutate;

  const canManage = !!activeMeeting?.can_manage;
  const isLive = activeMeeting?.status === "live";
  const isHostUser = !!activeMeeting?.host_id && activeMeeting.host_id === user?.id;

  const clearMessageHoldTimer = () => {
    if (messageHoldTimeoutRef.current !== null) {
      window.clearTimeout(messageHoldTimeoutRef.current);
      messageHoldTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!participantActionMenuId) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (
        target.closest("[data-participant-menu='true']") ||
        target.closest("[data-participant-menu-trigger='true']")
      ) {
        return;
      }
      setParticipantActionMenuId(null);
    };
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setParticipantActionMenuId(null);
    };
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [participantActionMenuId]);

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
      setRoomDebug((prev) => ({
        ...prev,
        bootRuns: prev.bootRuns + 1,
        scriptLoaded: false,
        apiConstructed: false,
        joinedEvent: false,
        lastError: "",
      }));
      await loadJitsiExternalApi(joinData.server_url);
      setRoomDebug((prev) => ({ ...prev, scriptLoaded: true }));
      if (cancelled || !roomContainerRef.current || !window.JitsiMeetExternalAPI) return;

      const domain = new URL(joinData.server_url).host;
      const joinHostSettings = meetHostSettingsFromSession(joinData.meeting ?? activeMeeting);
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
        configOverwrite: buildJitsiConfigOverwrite(joinHostSettings),
      });
      setRoomDebug((prev) => ({ ...prev, apiConstructed: true }));
      jitsiApiRef.current = apiInstance;
      setIsModerator(canManage);
      if (activeMeeting?.title) {
        try {
          apiInstance.executeCommand("subject", `GRE Room : ${activeMeeting.title}`);
        } catch {
          // Non-fatal if subject command is unavailable.
        }
      }
      refreshParticipants();

      const onJoined = () => {
        setJitsiReady(true);
        setRoomDebug((prev) => ({ ...prev, joinedEvent: true, lastError: "" }));
        if (apiInstance) {
          applyJitsiJoinMediaPolicy(apiInstance, joinHostSettings);
        }
        refreshParticipants();
      };
      const onParticipantJoined = (payload: { id?: string; participantId?: string }) => {
        refreshParticipants();
        if (!joinHostSettings.mute_audio_on_join || !canManage || !apiInstance) return;
        const participantId = payload?.id || payload?.participantId;
        if (!participantId) return;
        try {
          apiInstance.executeCommand("muteParticipant", participantId);
        } catch {
          // Not available on all Jitsi builds; join-time local mute still applies per client.
        }
      };
      const onParticipantLeft = () => refreshParticipants();
      const onRoleChanged = (payload: { role?: string }) => {
        setIsModerator(payload?.role === "moderator" || canManage);
        refreshParticipants();
      };
      const onRecordingChanged = (payload: { on?: boolean; error?: string }) => {
        syncRecordingMutation({
          state: payload?.error ? "failed" : payload?.on ? "recording" : "ready",
          error: payload?.error || "",
        });
      };
      const onKnockingParticipant = (payload: {
        id?: string;
        participant?: { id?: string; name?: string; email?: string };
        name?: string;
        displayName?: string;
        email?: string;
      }) => {
        const participantId = payload?.id || payload?.participant?.id || "";
        if (!participantId) return;
        const displayName =
          payload?.displayName || payload?.name || payload?.participant?.name || "Guest";
        const email = payload?.email || payload?.participant?.email;
        setWaitingGuests((current) => {
          if (current.some((guest) => guest.id === participantId)) return current;
          return [...current, { id: participantId, displayName, email }];
        });
      };
      const removeWaitingGuest = (payload: { id?: string; participantId?: string }) => {
        const participantId = payload?.id || payload?.participantId || "";
        if (!participantId) return;
        setWaitingGuests((current) => current.filter((guest) => guest.id !== participantId));
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
      apiInstance.addListener("knockingParticipant", onKnockingParticipant);
      apiInstance.addListener("knockingParticipantAccepted", removeWaitingGuest);
      apiInstance.addListener("knockingParticipantRejected", removeWaitingGuest);
      apiInstance.addListener("readyToClose", onReadyToClose);
    };

    boot().catch((error) => {
      const message = error instanceof Error ? error.message : "Could not load the Jitsi meeting room.";
      setRoomError(message);
      setRoomDebug((prev) => ({ ...prev, lastError: message }));
    });

    return () => {
      cancelled = true;
      setJitsiReady(false);
      setWaitingGuests([]);
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
    syncRecordingMutation,
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
    setPipOpening(true);
    try {
      const joinData = await prepareRoom();
      const directUrl = buildExternalRoomUrl(joinData);
      if (!directUrl) {
        throw new Error("Could not prepare a direct Jitsi room link for picture-in-picture.");
      }

      const popupFeatures = "popup=yes,width=960,height=640,noopener,noreferrer";
      const docPiP = (window as Window & { documentPictureInPicture?: { requestWindow?: (opts: { width: number; height: number }) => Promise<Window> } }).documentPictureInPicture;
      if (docPiP?.requestWindow) {
        try {
          const pipWindow = await docPiP.requestWindow({
            width: 960,
            height: 640,
          });
          pipWindow.location.href = directUrl;
          toast.success({
            title: "Picture-in-picture opened",
            description: "Meeting opened in a floating Jitsi window.",
          });
          return;
        } catch {
          // Fall through to popup if browser blocks document PiP navigation.
        }
      }

      const popup = window.open(directUrl, "gre-meet-pip", popupFeatures);
      if (!popup) {
        toast.error({
          title: "Popup blocked",
          description: "Allow popups for this site to open the meeting pop-out window.",
        });
        return;
      }
      toast.success({
        title: "Meeting pop-out opened",
        description: "The Jitsi room opened in a separate window.",
      });
    } catch (error) {
      toast.error({
        title: "Could not open picture-in-picture",
        description: parseApiError(error, "Could not open the meeting pop-out window."),
      });
    } finally {
      setPipOpening(false);
    }
  };

  const inviteParticipantByEmail = async () => {
    const email = inviteEmail.trim();
    if (!meetingId) return;
    if (!email) {
      toast.error({
        title: "Enter an email",
        description: "Add an attendee email address before sending an invite.",
      });
      return;
    }

    setInviteSending(true);
    try {
      const result = await inviteMeetingByEmail(meetingId, { email });
      setInviteEmail("");
      toast.success({
        title: "Invitation sent",
        description: result.user_found
          ? `${email} received a GRE Meet invite email and in-app notification.`
          : `${email} received a GRE Meet invite email with join instructions.`,
      });
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
    } catch (error) {
      toast.error({
        title: "Could not send invite",
        description: parseApiError(error, "Could not send the meeting invitation email."),
      });
    } finally {
      setInviteSending(false);
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
  const embedMounted = roomDebug.apiConstructed;
  const embedUnavailable = isConnected && !embedMounted && !!roomError;
  const embedStatusMessage =
    roomError ||
    "The embedded meeting is taking too long to start. This is usually a Jitsi network/auth issue.";
  const headerTitle = activeMeeting?.title || "GRE Meet";
  const subtitle = useMemo(() => {
    if (!activeMeeting) return "";
    return `${activeMeeting.category_name} / ${activeMeeting.sub_category_name} · ${formatMeetingDate(activeMeeting.scheduled_at)}`;
  }, [activeMeeting]);

  const runJitsiRecordingCommand = (action: "start" | "stop", mode = "file") => {
    const apiInstance = jitsiApiRef.current;
    if (!apiInstance) {
      setRoomError("The Jitsi room is not ready yet.");
      return false;
    }
    try {
      if (action === "start") {
        apiInstance.executeCommand("startRecording", { mode });
      } else {
        apiInstance.executeCommand("stopRecording", mode);
      }
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not run the Jitsi recording command.";
      setRoomError(normalizeRoomErrorMessage(message));
      syncRecordingMutation({
        state: "failed",
        error: message,
      });
      return false;
    }
  };

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
    if (!participantId) return false;
    const ok = runModeratorCommand(command, participantId);
    if (ok) {
      toast.success({ title: successTitle, description: successDescription });
    } else {
      toast.error({
        title: "Could not run attendee action",
        description: fallbackError,
      });
    }
    return ok;
  };

  const answerKnockingParticipant = (participantId: string, approve: boolean) => {
    const ok = runModeratorCommand("answerKnockingParticipant", participantId, approve);
    if (!ok) return;
    setWaitingGuests((current) => current.filter((guest) => guest.id !== participantId));
    toast.success({
      title: approve ? "Guest admitted" : "Guest denied",
      description: approve
        ? "Guest can now enter the meeting."
        : "Guest request was declined from the waiting room.",
    });
  };

  const admitAllWaitingGuests = () => {
    if (!waitingGuests.length) return;
    waitingGuests.forEach((guest) => {
      runModeratorCommand("answerKnockingParticipant", guest.id, true);
    });
    setWaitingGuests([]);
    toast.success({
      title: "All guests admitted",
      description: "Every waiting guest has been approved to join.",
    });
  };

  const handleStartRecording = async () => {
    if (!isHostUser) {
      toast.error({
        title: "Host only",
        description: "Only the meeting host can start recording.",
      });
      return;
    }
    try {
      const updated = await startRecording.mutateAsync();
      const mode = updated?.recording_egress_id || "file";
      if (!runJitsiRecordingCommand("start", mode)) {
        toast.error({
          title: "Recording unavailable",
          description: roomError || "Could not start recording in the meeting room.",
        });
      }
    } catch (error) {
      const message = normalizeRoomErrorMessage(parseApiError(error, "Could not request recording."));
      setRoomError(message);
      toast.error({
        title: "Recording unavailable",
        description: message,
      });
    }
  };

  const handleStopRecording = async () => {
    if (!isHostUser) {
      toast.error({
        title: "Host only",
        description: "Only the meeting host can stop recording.",
      });
      return;
    }
    try {
      const updated = await stopRecording.mutateAsync();
      const mode = updated?.recording_egress_id || "file";
      if (!runJitsiRecordingCommand("stop", mode)) {
        toast.error({
          title: "Could not stop recording",
          description: roomError || "Could not stop recording in the meeting room.",
        });
      }
    } catch (error) {
      const message = normalizeRoomErrorMessage(parseApiError(error, "Could not stop recording."));
      setRoomError(message);
      toast.error({
        title: "Could not stop recording",
        description: message,
      });
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
    assistantCaptureUnavailableRef.current = false;

    const refreshNotes = () => {
      if (assistantCaptureUnavailableRef.current) return;
      void captureMeetingAssistantNotes(meetingId)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
          queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
        })
        .catch((error) => {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            assistantCaptureUnavailableRef.current = true;
          }
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
      buildCopilotPrompt(activeMeeting, chat, activeMeeting.assistant_notes || "", task, question),
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
            <div className="pointer-events-none absolute left-1/2 top-14 z-30 w-[min(92%,780px)] -translate-x-1/2 rounded-2xl border border-red-700/60 bg-red-950/95 px-4 py-3 text-sm text-red-100 shadow-[0_10px_28px_rgba(127,29,29,0.35)]">
              {roomError}
            </div>
          )}
        </div>
      )}

      {!drawerOpen && <MeetRoomControlsFab onClick={() => setDrawerOpen(true)} />}
      <div
        className="pointer-events-none fixed left-6 top-6 z-[2147483645] sm:left-8 sm:top-7"
        style={{ zIndex: 2147483647 }}
      >
        <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/95 px-4 py-2.5 shadow-[0_6px_18px_rgba(2,6,23,0.35)]">
          <BrandMark
            symbol="full"
            variant="plain"
            size="lg"
            className="shrink-0 !h-14 !max-w-[200px]"
            title="GRE"
          />
          <div className="leading-none text-slate-100">
            <p className="text-base font-extrabold tracking-wide">GRE</p>
            <p className="mt-1 text-sm font-semibold text-slate-300">Meet</p>
          </div>
        </div>
      </div>

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
              <div className="space-y-3">
                <Link
                  to={meetingId ? `/dashboard/meetings/${meetingId}` : "/dashboard/meetings"}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-brand-300"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to meeting
                </Link>
                <h3 className="text-lg font-bold text-slate-100">{headerTitle}</h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-brand-950/50 px-2.5 py-1 font-semibold text-brand-200">
                    {archiveId}
                  </span>
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 capitalize text-slate-300">
                    {activeMeeting.status}
                  </span>
                  <span className="rounded-full bg-slate-800 px-2.5 py-1 text-slate-300">
                    {roomParticipants.length} live participant
                    {roomParticipants.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-2.5">
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Quick actions</p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button
                      variant="secondary"
                      className="h-9 w-full !border-slate-700 !bg-slate-900 !text-slate-100 hover:!bg-slate-800 disabled:!bg-slate-800 disabled:!text-slate-500 disabled:!opacity-100"
                      onClick={copyLink}
                    >
                      <Copy className="h-4 w-4" />
                      Copy link
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-9 w-full !border-slate-700 !bg-slate-900 !text-slate-100 hover:!bg-slate-800 disabled:!bg-slate-800 disabled:!text-slate-500 disabled:!opacity-100"
                      loading={pipOpening}
                      onClick={() => void openMeetingPictureInPicture()}
                    >
                      <PictureInPicture2 className="h-4 w-4" />
                      Picture in picture
                    </Button>
                    {shareLink && (
                      <a href={shareLink} target="_blank" rel="noreferrer" className="sm:col-span-2">
                        <Button variant="secondary" className="h-9 w-full !border-slate-700 !bg-slate-900 !text-slate-100 hover:!bg-slate-800 disabled:!bg-slate-800 disabled:!text-slate-500 disabled:!opacity-100">
                          <ExternalLink className="h-4 w-4" />
                          Open GRE link
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
                {!isConnected && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Join room
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button className="h-10" loading={isPreparingRoom} onClick={() => void handleEnterRoom()}>
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
                      <Button variant="secondary" className="h-10 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800" onClick={() => void handleOpenExternalRoom()}>
                        <ExternalLink className="h-4 w-4" />
                        Join in browser
                      </Button>
                    </div>
                  </div>
                )}
                <div className="space-y-2 pt-2">
                  <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-2.5">
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Live actions</p>
                    <div className="grid grid-cols-1 gap-2">
                    {activeMeeting.status === "scheduled" && (
                      <Button className="h-10" loading={startMeeting.isPending} onClick={() => startMeeting.mutate()}>
                        Start on GRE
                      </Button>
                    )}
                    {isHostUser && isModerator && isLive && activeMeeting.recording_status !== "recording" && (
                      <Button
                        variant="secondary"
                        className="h-8 !border-slate-700 !bg-slate-900 !text-slate-100 hover:!bg-slate-800 disabled:!border-slate-700 disabled:!bg-slate-800 disabled:!text-slate-500 disabled:!opacity-100"
                        loading={startRecording.isPending}
                        onClick={handleStartRecording}
                      >
                        Start recording
                      </Button>
                    )}
                    {isHostUser && isModerator && isLive && activeMeeting.recording_status === "recording" && (
                      <Button variant="secondary" className="h-8 !border-slate-700 !bg-slate-900 !text-slate-100 hover:!bg-slate-800 disabled:!border-slate-700 disabled:!bg-slate-800 disabled:!text-slate-500 disabled:!opacity-100" loading={stopRecording.isPending} onClick={handleStopRecording}>
                        Stop recording
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      className="h-8"
                      loading={endMeeting.isPending}
                      onClick={() => setConfirmEndOpen(true)}
                    >
                      End meeting
                    </Button>
                  </div>
                  </div>
                </div>
                {isHostUser && (
                  <div className="space-y-2 pt-1">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-2.5">
                      <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Host controls
                      </p>
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
                    </div>
                  </div>
                )}
              </div>
            ),
            assistant: (
              <div className="flex h-full min-h-0 flex-col gap-3">
                <div className="min-h-0 flex-1">
                  <MeetingGreAssistantPanel meeting={activeMeeting} compact variant="dark" />
                </div>
                {canManage && (
                  <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-2.5">
                    <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Assistant tools</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 !border-slate-700 !bg-slate-900 !text-slate-100 hover:!bg-slate-800 disabled:!bg-slate-800 disabled:!text-slate-500 disabled:!opacity-100"
                        loading={copilotLoading}
                        onClick={() => void runCopilot("notes")}
                      >
                        <Sparkles className="h-4 w-4" />
                        Draft notes
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 !border-slate-700 !bg-slate-900 !text-slate-100 hover:!bg-slate-800 disabled:!bg-slate-800 disabled:!text-slate-500 disabled:!opacity-100"
                        loading={copilotLoading}
                        onClick={() => void runCopilot("actions")}
                      >
                        Action items
                      </Button>
                    </div>
                    {(copilotOutput || copilotError || copilotLoading) && (
                      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                        {copilotError ? (
                          <p className="text-sm text-red-400">{copilotError}</p>
                        ) : (
                          <FormattedAssistantText content={copilotOutput} streaming={copilotLoading} />
                        )}
                        {!!copilotOutput && !copilotLoading && (
                          <div className="mt-3 flex justify-end">
                            <Button
                              type="button"
                              variant="secondary"
                              className="h-8 !border-slate-700 !bg-slate-900 !text-slate-100 hover:!bg-slate-800"
                              onClick={() => {
                                if (!copilotOutput.trim()) return;
                                const write = navigator.clipboard?.writeText?.(copilotOutput) ?? Promise.reject();
                                void write
                                  .then(() => {
                                    toast.success({
                                      title: "Copied",
                                      description: "Generated content copied to clipboard.",
                                    });
                                  })
                                  .catch(() => {
                                    toast.error({
                                      title: "Could not copy",
                                      description: "Clipboard access is blocked. Copy manually from the panel.",
                                    });
                                  });
                              }}
                            >
                              <Copy className="h-4 w-4" />
                              Copy
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ),
              chat: (
                <div className="flex h-full min-h-0 flex-col gap-3">
                  <div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                    {chat.map((message) => {
                      const senderName =
                        message.sender?.full_name ||
                        `${message.sender?.firstname ?? ""} ${message.sender?.lastname ?? ""}`.trim() ||
                        message.sender?.email ||
                        "Participant";
                      const isOwn = message.sender_id === user?.id;
                      const parsedMessage = parseReplyPayload(message.message || "");
                      const isActionOpen = activeMessageActionId === message.id;
                      return (
                        <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div className={`flex w-full max-w-[96%] items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                            <UserAvatar user={message.sender} name={senderName} size="sm" className="shrink-0" />
                            <div
                              onPointerDown={() => {
                                clearMessageHoldTimer();
                                messageHoldTimeoutRef.current = window.setTimeout(() => {
                                  setActiveMessageActionId(message.id);
                                }, 420);
                              }}
                              onPointerUp={clearMessageHoldTimer}
                              onPointerLeave={clearMessageHoldTimer}
                              onPointerCancel={clearMessageHoldTimer}
                              onContextMenu={(event) => {
                                event.preventDefault();
                                setActiveMessageActionId(message.id);
                              }}
                              className={`w-full max-w-[92%] rounded-2xl border px-3 py-2.5 shadow-sm transition ${
                                isOwn
                                  ? "border-brand-800/50 bg-brand-900/30"
                                  : "border-slate-700 bg-slate-800/90"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                {senderName}
                                {isOwn ? " · You" : ""}
                              </p>
                              <span className="text-[11px] text-slate-500">
                                {formatChatTimestamp(message.created_at)}
                              </span>
                              </div>
                              {parsedMessage.replySnippet && (
                                <div className="mt-1.5 rounded-xl border border-slate-600/70 bg-slate-900/55 px-2.5 py-2">
                                  <p className="text-[11px] font-semibold text-brand-200">
                                    {parsedMessage.replyToName}
                                  </p>
                                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-300">
                                    {parsedMessage.replySnippet}
                                  </p>
                                </div>
                              )}
                              <p className="mt-1 text-sm whitespace-pre-wrap leading-relaxed text-slate-100">
                                {parsedMessage.body}
                              </p>
                              {isActionOpen ? (
                                <div className="mt-2 flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    className="rounded-full border border-transparent px-2 py-0.5 text-[11px] font-semibold text-brand-300 transition hover:border-brand-700/40 hover:bg-brand-900/30 hover:text-brand-200"
                                    onClick={() => {
                                      setReplyTarget(message);
                                      setActiveMessageActionId(null);
                                    }}
                                  >
                                    Reply
                                  </button>
                                  {!isOwn && (
                                    <button
                                      type="button"
                                      className="rounded-full border border-transparent px-2 py-0.5 text-[11px] font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-700/60 hover:text-slate-100"
                                      onClick={() => {
                                        setTagTarget(message);
                                        const mentionToken = `@${senderName}`;
                                        setText((prev) => {
                                          if (prev.toLowerCase().includes(mentionToken.toLowerCase())) return prev;
                                          return `${mentionToken} ${prev}`.trimStart();
                                        });
                                        setActiveMessageActionId(null);
                                      }}
                                    >
                                      Tag
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="rounded-full border border-transparent px-2 py-0.5 text-[11px] font-semibold text-slate-300 transition hover:border-slate-600 hover:bg-slate-700/60 hover:text-slate-100"
                                    onClick={() => {
                                      void (navigator.clipboard?.writeText?.(message.message) ?? Promise.reject()).catch(
                                        () => {}
                                      );
                                      setActiveMessageActionId(null);
                                    }}
                                  >
                                    Copy
                                  </button>
                                  <button
                                    type="button"
                                    className="rounded-full border border-transparent px-2 py-0.5 text-[11px] font-semibold text-slate-400 transition hover:border-slate-600 hover:bg-slate-700/60 hover:text-slate-200"
                                    onClick={() => setActiveMessageActionId(null)}
                                  >
                                    Close
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="mt-2 text-[11px] font-semibold text-slate-500"
                                  onClick={() => setActiveMessageActionId(message.id)}
                                >
                                  Hold for actions
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {chat.length === 0 && (
                      <p className="px-3 py-2 text-sm text-slate-400">
                        No messages yet.
                      </p>
                    )}
                  </div>
                  <form
                    className="mt-auto space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      if (!text.trim()) return;
                      setActiveMessageActionId(null);
                      sendChat.mutate();
                    }}
                  >
                    {(replyTarget || tagTarget) && (
                      <div className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300">
                        {replyTarget && (
                          <p>
                            Replying to{" "}
                            <span className="font-semibold text-slate-100">
                              {replyTarget.sender?.full_name ||
                                `${replyTarget.sender?.firstname ?? ""} ${replyTarget.sender?.lastname ?? ""}`.trim() ||
                                replyTarget.sender?.email ||
                                "Participant"}
                            </span>
                          </p>
                        )}
                        {tagTarget && (
                          <p>
                            Tagging{" "}
                            <span className="font-semibold text-slate-100">
                              {tagTarget.sender?.full_name ||
                                `${tagTarget.sender?.firstname ?? ""} ${tagTarget.sender?.lastname ?? ""}`.trim() ||
                                tagTarget.sender?.email ||
                                "Participant"}
                            </span>
                          </p>
                        )}
                        <button
                          type="button"
                          className="mt-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200"
                          onClick={() => {
                            setReplyTarget(null);
                            setTagTarget(null);
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                    <div className="relative">
                      <textarea
                        value={text}
                        onChange={(event) => setText(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key !== "Enter") return;
                          if (event.shiftKey) return;
                          event.preventDefault();
                          if (!text.trim() || !meetingId || sendChat.isPending) return;
                          sendChat.mutate();
                        }}
                        placeholder="Message..."
                        rows={1}
                        className="max-h-28 min-h-11 w-full resize-y rounded-3xl border border-slate-700 bg-slate-950 py-3 pl-4 pr-28 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-900/40"
                      />
                      <Button
                        type="submit"
                        loading={sendChat.isPending}
                        disabled={!text.trim() || !meetingId}
                        className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-full px-3 text-sm"
                      >
                        <Send className="h-4 w-4" />
                        Send
                      </Button>
                    </div>
                    {chatError && <p className="text-sm text-red-400">{chatError}</p>}
                  </form>
                </div>
              ),
              host: (
                <div className="text-sm text-slate-400">Host controls are available in Meeting.</div>
              ),
              people: (
                <div className="space-y-3">
                  {canManage && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                      <p className="text-xs font-semibold text-slate-400">Invite by email</p>
                      <form
                        className="mt-2 flex flex-col gap-2 sm:flex-row"
                        onSubmit={(event) => {
                          event.preventDefault();
                          void inviteParticipantByEmail();
                        }}
                      >
                        <input
                          type="email"
                          value={inviteEmail}
                          onChange={(event) => setInviteEmail(event.target.value)}
                          placeholder="attendee@example.com"
                          className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:ring-2 focus:ring-brand-900/40"
                        />
                        <Button
                          type="submit"
                          loading={inviteSending}
                          disabled={!inviteEmail.trim()}
                          className="h-10 min-w-[132px] !bg-brand-600 !text-white hover:!bg-brand-500 disabled:!bg-slate-700 disabled:!text-slate-300 disabled:!opacity-100 sm:shrink-0"
                        >
                          Send invite
                        </Button>
                      </form>
                    </div>
                  )}
                  {canManage && waitingGuests.length > 0 && (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Waiting room
                        </p>
                        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">
                          {waitingGuests.length}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {waitingGuests.map((guest) => (
                          <div key={guest.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-800 px-3 py-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-100">{guest.displayName}</p>
                              {guest.email && (
                                <p className="truncate text-xs text-slate-400">{guest.email}</p>
                              )}
                            </div>
                            <div className="flex shrink-0 gap-2">
                              <Button
                                type="button"
                                variant="secondary"
                                className="h-9 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                                onClick={() => answerKnockingParticipant(guest.id, true)}
                              >
                                Admit
                              </Button>
                              <Button
                                type="button"
                                variant="secondary"
                                className="h-9 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                                onClick={() => answerKnockingParticipant(guest.id, false)}
                              >
                                Deny
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button type="button" className="mt-3 h-10 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800" onClick={admitAllWaitingGuests}>
                        Admit all
                      </Button>
                    </div>
                  )}
                  {roomParticipants.map((participant) => (
                    (() => {
                      const participantEmail = (participant.email || "").trim().toLowerCase();
                      const linkedMeetingParticipant = activeMeeting?.participants?.find((row) => {
                        const rowEmail = (row.user?.email || "").trim().toLowerCase();
                        return !!participantEmail && !!rowEmail && rowEmail === participantEmail;
                      });
                      const isHostParticipant =
                        linkedMeetingParticipant?.role === "host" ||
                        (!!participantEmail &&
                          participantEmail === (activeMeeting?.host?.email || "").trim().toLowerCase());
                      const isAdminParticipant = Boolean(
                        linkedMeetingParticipant?.user?.role_name &&
                          linkedMeetingParticipant.user.role_name.toLowerCase().includes("admin")
                      );
                      const allowRemoveAction = !isHostParticipant && !isAdminParticipant;
                      return (
                    <div
                      key={participant.id}
                      className="relative flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {participant.displayName}
                          {participant.isLocal ? " · You" : ""}
                        </p>
                        {participant.email && (
                          <p className="truncate text-xs text-slate-400">{participant.email}</p>
                        )}
                      </div>
                      {isHostUser && isModerator && !participant.isLocal && participant.id && (
                        <div className="relative">
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-9 shrink-0 !bg-slate-900 !text-slate-200 hover:!bg-slate-800"
                            data-participant-menu-trigger="true"
                            onClick={(event) => {
                              event.stopPropagation();
                              setParticipantActionMenuId((prev) =>
                                prev === participant.id ? null : participant.id
                              );
                            }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                          {participantActionMenuId === participant.id && (
                            <div
                              className="absolute right-0 top-11 z-20 w-56 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-lg"
                              data-participant-menu="true"
                            >
                              <div className="space-y-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-10 w-full justify-start gap-2 whitespace-nowrap px-2.5 text-left !text-slate-100 hover:!bg-slate-800 hover:!text-slate-50"
                                  onClick={() => {
                                    const shouldMute = !participant.audioMuted;
                                    const ok = runParticipantAction(
                                      participant.id,
                                      shouldMute ? "muteParticipant" : "unmuteParticipant",
                                      shouldMute ? "Mute requested" : "Unmute requested",
                                      shouldMute
                                        ? "Moderator mute command sent for attendee microphone."
                                        : "Moderator unmute command sent for attendee microphone.",
                                      shouldMute
                                        ? "Could not mute this attendee's microphone."
                                        : "Could not unmute this attendee's microphone."
                                    );
                                    if (ok) {
                                      setRoomParticipants((current) =>
                                        current.map((item) =>
                                          item.id === participant.id ? { ...item, audioMuted: shouldMute } : item
                                        )
                                      );
                                    }
                                    setParticipantActionMenuId(null);
                                  }}
                                >
                                  {participant.audioMuted ? (
                                    <Mic className="h-4 w-4" />
                                  ) : (
                                    <MicOff className="h-4 w-4" />
                                  )}
                                  {participant.audioMuted ? "Unmute mic" : "Mute mic"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-10 w-full justify-start gap-2 whitespace-nowrap px-2.5 text-left !text-slate-100 hover:!bg-slate-800 hover:!text-slate-50"
                                  onClick={() => {
                                    const shouldTurnVideoOff = !participant.videoMuted;
                                    const ok = runParticipantAction(
                                      participant.id,
                                      shouldTurnVideoOff ? "muteParticipantVideo" : "unmuteParticipantVideo",
                                      shouldTurnVideoOff ? "Video-off requested" : "Video-on requested",
                                      shouldTurnVideoOff
                                        ? "Moderator camera-off command sent for attendee video."
                                        : "Moderator camera-on command sent for attendee video.",
                                      shouldTurnVideoOff
                                        ? "Could not turn off this attendee's camera."
                                        : "Could not turn on this attendee's camera."
                                    );
                                    if (ok) {
                                      setRoomParticipants((current) =>
                                        current.map((item) =>
                                          item.id === participant.id
                                            ? { ...item, videoMuted: shouldTurnVideoOff }
                                            : item
                                        )
                                      );
                                    }
                                    setParticipantActionMenuId(null);
                                  }}
                                >
                                  {participant.videoMuted ? (
                                    <Video className="h-4 w-4" />
                                  ) : (
                                    <VideoOff className="h-4 w-4" />
                                  )}
                                  {participant.videoMuted ? "Video on" : "Video off"}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-10 w-full justify-start gap-2 whitespace-nowrap px-2.5 text-left !text-slate-100 hover:!bg-slate-800 hover:!text-slate-50"
                                  onClick={() => {
                                    runParticipantAction(
                                      participant.id,
                                      "grantModerator",
                                      "Screen sharing allowed",
                                      "Attendee can now share screen as a moderator.",
                                      "Could not allow screen sharing for this attendee."
                                    );
                                    setParticipantActionMenuId(null);
                                  }}
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                  Allow share
                                </Button>
                                {allowRemoveAction && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="h-10 w-full justify-start gap-2 whitespace-nowrap px-2.5 text-left !text-red-300 hover:!bg-slate-800 hover:!text-red-200"
                                    onClick={() => {
                                      runParticipantAction(
                                        participant.id,
                                        "kickParticipant",
                                        "Attendee removed",
                                        "The attendee was removed from the meeting.",
                                        "Could not remove this attendee."
                                      );
                                      setParticipantActionMenuId(null);
                                    }}
                                  >
                                    <UserX className="h-4 w-4" />
                                    Remove attendee
                                  </Button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                      );
                    })()
                  ))}
                  {roomParticipants.length === 0 && (
                    <p className="text-sm text-slate-400">No room participants detected yet.</p>
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
