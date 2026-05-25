import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, Loader2, MicOff, MonitorUp, Radio, Send, UserX, Users, Video } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Textarea";
import { useAuth } from "../context/AuthContext";
import api, { parseApiError } from "../lib/api";
import {
  type JitsiMeetExternalAPIInstance,
  type JitsiParticipantInfo,
  loadJitsiExternalApi,
} from "../lib/jitsi";
import { fetchMeetingBySlug, formatMeetingDate, joinMeetingRoom } from "../lib/meetings";
import type { MeetChatMessage } from "../types";

function normalizeParticipants(rows: JitsiParticipantInfo[] | undefined, localEmail?: string) {
  return (rows ?? []).map((row) => ({
    id: row.participantId || row.id || "",
    displayName: row.displayName || row.email || "Participant",
    email: row.email,
    isLocal: !!localEmail && row.email?.toLowerCase() === localEmail.toLowerCase(),
  }));
}

export function MeetRoomPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [chatError, setChatError] = useState("");
  const [roomError, setRoomError] = useState("");
  const [roomParticipants, setRoomParticipants] = useState<
    { id: string; displayName: string; email?: string; isLocal?: boolean }[]
  >([]);
  const [isModerator, setIsModerator] = useState(false);
  const roomContainerRef = useRef<HTMLDivElement | null>(null);
  const jitsiApiRef = useRef<JitsiMeetExternalAPIInstance | null>(null);

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

  const startMeeting = useMutation({
    mutationFn: () => api.post(`/meetings/${meetingId}/start/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
    },
  });

  const endMeeting = useMutation({
    mutationFn: () => api.post(`/meetings/${meetingId}/end/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-by-slug", slug] });
      queryClient.invalidateQueries({ queryKey: ["meeting", meetingId] });
      if (meetingId) navigate(`/dashboard/meetings/${meetingId}`);
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
        if (meetingId) navigate(`/dashboard/meetings/${meetingId}`);
      };

      apiInstance.addListener("videoConferenceJoined", onJoined);
      apiInstance.addListener("participantJoined", onParticipantJoined);
      apiInstance.addListener("participantLeft", onParticipantLeft);
      apiInstance.addListener("participantRoleChanged", onRoleChanged);
      apiInstance.addListener("recordingStatusChanged", onRecordingChanged);
      apiInstance.addListener("readyToClose", onReadyToClose);
    };

    boot().catch((error) => {
      setRoomError(
        error instanceof Error ? error.message : "Could not load the Jitsi meeting room."
      );
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
  }, [joinMutation.data, meetingId, navigate, queryClient, slug, syncRecordingState, user, canManage]);

  const copyLink = async () => {
    if (!activeMeeting?.meeting_link) return;
    try {
      await navigator.clipboard.writeText(activeMeeting.meeting_link);
    } catch {
      window.prompt("Copy meeting link", activeMeeting.meeting_link);
    }
  };

  const isConnected = !!joinMutation.data?.token && !!joinMutation.data?.server_url;

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
            This room is closed. The recording and summary are available in the GRE archive view.
          </p>
          <Link to={`/dashboard/meetings/${activeMeeting.id}`}>
            <Button>Open archive</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
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
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={copyLink}>
              <Copy className="h-4 w-4" />
              Copy link
            </Button>
            {canManage && activeMeeting?.status === "scheduled" && (
              <Button loading={startMeeting.isPending} onClick={() => startMeeting.mutate()}>
                Start meeting
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
            {canManage && (
              <Button variant="danger" loading={endMeeting.isPending} onClick={handleEndConference}>
                End meeting
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0">
            {!isConnected ? (
              <div className="gre-card flex min-h-[70vh] flex-col items-center justify-center gap-4 p-8 text-center">
                <Video className="h-12 w-12 text-brand-600" />
                <div>
                  <p className="text-lg font-semibold text-ink">
                    {activeMeeting?.status === "live" ? "Join the live room" : "Ready to enter GRE Meet"}
                  </p>
                  <p className="mt-2 max-w-xl text-sm text-slate-500">
                    GRE issues a signed Jitsi room token just before you join. Camera, microphone, screen share, and moderator controls become available inside the embedded meeting room.
                  </p>
                </div>
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
                    "Enter meeting room"
                  )}
                </Button>
                {joinMutation.isError && (
                  <p className="text-sm text-red-600">
                    {parseApiError(joinMutation.error, "Could not join the meeting room.")}
                  </p>
                )}
              </div>
            ) : (
              <div className="relative h-[calc(100vh-12rem)] min-h-[520px] overflow-hidden rounded-[28px] bg-slate-950 ring-1 ring-slate-900/10">
                <div ref={roomContainerRef} className="h-full w-full" />
                {roomError && (
                  <div className="absolute inset-x-4 top-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 shadow">
                    {roomError}
                  </div>
                )}
              </div>
            )}
          </div>

          <aside className="gre-card flex h-[calc(100vh-12rem)] min-h-[520px] flex-col overflow-hidden p-0">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-ink">Room controls</h2>
              <p className="mt-1 text-sm text-slate-500">
                GRE keeps meeting metadata and archive content, while Jitsi handles the live audio and video room.
              </p>
            </div>

            <div className="space-y-4 border-b border-slate-200 px-5 py-4">
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
                    End for everyone
                  </Button>
                )}
              </div>
              <p className="text-xs text-slate-500">
                Local microphone, camera, and screen share controls remain inside the Jitsi toolbar below the meeting grid.
              </p>
            </div>

            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-brand-600" />
                <h3 className="font-semibold text-ink">Live participants</h3>
              </div>
              <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
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
                      {participant.email && (
                        <p className="truncate text-xs text-slate-500">{participant.email}</p>
                      )}
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
                {roomParticipants.length === 0 && (
                  <p className="text-sm text-slate-500">No room participants detected yet.</p>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="border-b border-slate-200 px-5 py-4">
                <h3 className="text-lg font-semibold text-ink">GRE archive chat</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Messages here are preserved for post-meeting summary and archive review.
                </p>
              </div>
              <div className="space-y-3 px-5 py-4">
                {chat.map((message) => (
                  <div key={message.id} className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {message.sender?.full_name ||
                        `${message.sender?.firstname ?? ""} ${message.sender?.lastname ?? ""}`.trim() ||
                        message.sender?.email}
                      {message.sender_id === user?.id ? " · You" : ""}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{message.message}</p>
                  </div>
                ))}
                {chat.length === 0 && (
                  <p className="text-sm text-slate-500">No GRE chat messages yet. Start the discussion.</p>
                )}
              </div>
            </div>

            <form
              className="border-t border-slate-200 px-5 py-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!text.trim()) return;
                sendChat.mutate();
              }}
            >
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Share a point, question, or reaction…"
                rows={3}
              />
              {chatError && <p className="mt-2 text-sm text-red-600">{chatError}</p>}
              <div className="mt-3 flex justify-end">
                <Button type="submit" loading={sendChat.isPending} disabled={!text.trim() || !meetingId}>
                  <Send className="h-4 w-4" />
                  Send
                </Button>
              </div>
            </form>
          </aside>
        </div>
      </div>
    </div>
  );
}
