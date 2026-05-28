import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MonitorX, VideoOff, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import api, { parseApiError } from "../../lib/api";
import {
  DEFAULT_MEET_HOST_SETTINGS,
  meetHostSettingsFromSession,
  type MeetHostRoomSettings,
} from "../../lib/meetHostSettings";
import type { MeetSession } from "../../types";
import { Button } from "../ui/Button";
import { useToast } from "../ui/ToastProvider";

type Props = {
  meeting: MeetSession;
  canManage: boolean;
  showLiveControls?: boolean;
  roomReady?: boolean;
  onMuteEveryone?: (mediaType: "audio" | "video") => void;
  onStopScreenshare?: () => void;
};

type SettingChange = {
  key: keyof MeetHostRoomSettings;
  enabled: boolean;
};

type SaveHostSettingsInput = {
  settings: MeetHostRoomSettings;
  change: SettingChange;
};

const HOST_SETTING_TOAST: Record<
  keyof MeetHostRoomSettings,
  { label: string; enabledDescription: string; disabledDescription: string }
> = {
  mute_audio_on_join: {
    label: "Mute microphones on join",
    enabledDescription: "New attendees will join with their microphone off.",
    disabledDescription: "New attendees can join with their microphone on.",
  },
  video_off_on_join: {
    label: "Join with video off",
    enabledDescription: "New attendees will join with their camera off.",
    disabledDescription: "New attendees can join with their camera on.",
  },
  screen_share_moderator_only: {
    label: "Screen share for host only",
    enabledDescription: "Only you can share your screen in this meeting.",
    disabledDescription: "Attendees can share their screen when the room allows it.",
  },
};

function toastForSettingChange(change: SettingChange) {
  const meta = HOST_SETTING_TOAST[change.key];
  return {
    title: change.enabled ? `${meta.label} enabled` : `${meta.label} disabled`,
    description: change.enabled ? meta.enabledDescription : meta.disabledDescription,
  };
}

function SettingToggle({
  id,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 transition ${
        disabled ? "cursor-not-allowed opacity-60" : "hover:bg-slate-800"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-950 text-brand-500 focus:ring-brand-500"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-slate-100">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-slate-400">{description}</span>
      </span>
    </label>
  );
}

export function MeetHostToolsPanel({
  meeting,
  canManage,
  showLiveControls = false,
  roomReady = false,
  onMuteEveryone,
  onStopScreenshare,
}: Props) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const meetingIdRef = useRef(meeting.id);
  const saveToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingToastRef = useRef<{ title: string; description: string } | null>(null);
  const [settings, setSettings] = useState<MeetHostRoomSettings>(() =>
    meetHostSettingsFromSession(meeting)
  );

  useEffect(() => {
    return () => {
      if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (meetingIdRef.current !== meeting.id) {
      meetingIdRef.current = meeting.id;
      setSettings(meetHostSettingsFromSession(meeting));
    }
  }, [meeting]);

  const patchMeetingCache = (updated: MeetSession) => {
    queryClient.setQueryData(["meeting", String(meeting.id)], updated);
    if (meeting.join_slug) {
      queryClient.setQueryData(["meeting-by-slug", meeting.join_slug], updated);
    }
  };

  const saveSettings = useMutation({
    mutationFn: ({ settings }: SaveHostSettingsInput) =>
      api.patch<MeetSession>(`/meetings/${meeting.id}/`, settings).then((response) => response.data),
    onSuccess: (updated, variables) => {
      const next = meetHostSettingsFromSession(updated);
      setSettings(next);
      patchMeetingCache(updated);
      pendingToastRef.current = toastForSettingChange(variables.change);
      if (saveToastTimerRef.current) clearTimeout(saveToastTimerRef.current);
      saveToastTimerRef.current = setTimeout(() => {
        if (pendingToastRef.current) {
          toast.success(pendingToastRef.current);
          pendingToastRef.current = null;
        }
        saveToastTimerRef.current = null;
      }, 350);
    },
    onError: (error, variables) => {
      const cached = queryClient.getQueryData<MeetSession>(["meeting", String(meeting.id)]);
      setSettings(meetHostSettingsFromSession(cached ?? meeting));
      const meta = HOST_SETTING_TOAST[variables.change.key];
      toast.error({
        title: `Could not update ${meta.label.toLowerCase()}`,
        description: parseApiError(error, "Could not update meeting settings."),
      });
    },
  });

  const updateSetting = (key: keyof MeetHostRoomSettings, value: boolean) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    if (!canManage) return;
    saveSettings.mutate({ settings: next, change: { key, enabled: value } });
  };

  if (!canManage) {
    return (
      <p className="text-sm text-slate-400">Only the host or an admin can manage room controls.</p>
    );
  }

  return (
    <div className="space-y-3">
      
      <div className="space-y-2">
        <SettingToggle
          id={`mute-audio-${meeting.id}`}
          label="Mute microphones on join"
          description="New attendees join with their microphone off. They can unmute themselves unless you mute the room."
          checked={settings.mute_audio_on_join}
          onChange={(checked) => updateSetting("mute_audio_on_join", checked)}
        />
        <SettingToggle
          id={`video-off-${meeting.id}`}
          label="Join with video off"
          description="Cameras stay off when someone enters. Useful for audio-first discussions."
          checked={settings.video_off_on_join}
          onChange={(checked) => updateSetting("video_off_on_join", checked)}
        />
        <SettingToggle
          id={`screen-host-${meeting.id}`}
          label="Screen share for host only"
          description="Only the meeting host can share their screen. Attendees will not see a screen-share button."
          checked={settings.screen_share_moderator_only}
          onChange={(checked) => updateSetting("screen_share_moderator_only", checked)}
        />
      </div>

      {showLiveControls && (
        <div className="space-y-2 pt-1">
          <p className="text-xs font-semibold text-slate-400">Live controls</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              className="h-9 !border-slate-700 !bg-slate-900 !text-slate-100 hover:!bg-slate-800 disabled:!border-slate-700 disabled:!bg-slate-800 disabled:!text-slate-500 disabled:!opacity-100"
              disabled={!roomReady}
              onClick={() => onMuteEveryone?.("audio")}
            >
              <VolumeX className="h-4 w-4" />
              Mute all
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 !border-slate-700 !bg-slate-900 !text-slate-100 hover:!bg-slate-800 disabled:!border-slate-700 disabled:!bg-slate-800 disabled:!text-slate-500 disabled:!opacity-100"
              disabled={!roomReady}
              onClick={() => onMuteEveryone?.("video")}
            >
              <VideoOff className="h-4 w-4" />
              Video off
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-9 !border-slate-700 !bg-slate-900 !text-slate-100 hover:!bg-slate-800 disabled:!border-slate-700 disabled:!bg-slate-800 disabled:!text-slate-500 disabled:!opacity-100"
              disabled={!roomReady}
              onClick={() => onStopScreenshare?.()}
            >
              <MonitorX className="h-4 w-4" />
              Stop share
            </Button>
          </div>
          {!roomReady && (
            <p className="text-xs text-slate-400">Enter the room to run live moderator commands.</p>
          )}
        </div>
      )}

      {meeting.status === "scheduled" && (
        <p className="text-xs leading-relaxed text-slate-400">
          Defaults apply when the meeting goes live. You can also use{" "}
          <span className="font-medium text-slate-200">Mute all now</span> after you start and join.
        </p>
      )}

      <p
        className="min-h-[1.25rem] text-xs font-medium text-brand-300 transition-opacity"
        aria-live="polite"
        style={{ opacity: saveSettings.isPending ? 1 : 0 }}
      >
        Saving…
      </p>
    </div>
  );
}

export { DEFAULT_MEET_HOST_SETTINGS };
