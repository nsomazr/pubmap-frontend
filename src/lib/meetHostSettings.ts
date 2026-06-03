import type { JitsiMeetExternalAPIInstance } from "./jitsi";
import type { MeetSession } from "../types";

/** Host toggles exposed in GRE Meet room settings (screen share is always allowed for all participants). */
export type MeetHostRoomSettings = {
  mute_audio_on_join: boolean;
  video_off_on_join: boolean;
};

/** New meetings default to mic on so desktop peers can hear each other; hosts can re-enable mute-on-join. */
export const DEFAULT_MEET_HOST_SETTINGS: MeetHostRoomSettings = {
  mute_audio_on_join: false,
  video_off_on_join: true,
};

export function meetHostSettingsFromSession(
  meeting?: Partial<MeetSession> | null
): MeetHostRoomSettings {
  return {
    mute_audio_on_join: meeting?.mute_audio_on_join ?? DEFAULT_MEET_HOST_SETTINGS.mute_audio_on_join,
    video_off_on_join: meeting?.video_off_on_join ?? DEFAULT_MEET_HOST_SETTINGS.video_off_on_join,
  };
}

export function applyJitsiJoinMediaPolicy(
  api: JitsiMeetExternalAPIInstance,
  settings: MeetHostRoomSettings
) {
  if (settings.mute_audio_on_join) {
    try {
      api.executeCommand("setAudioMuted", true);
    } catch {
      // Older Jitsi builds may not expose setAudioMuted.
    }
  }
  if (settings.video_off_on_join) {
    try {
      api.executeCommand("setVideoMuted", true);
    } catch {
      // Older Jitsi builds may not expose setVideoMuted.
    }
  }
}

const JITSI_TOOLBAR_ATTENDEE = [
  "microphone",
  "camera",
  "desktop",
  "participants-pane",
  "tileview",
  "select-background",
  "settings",
  "raisehand",
  "videoquality",
  "hangup",
] as const;

const JITSI_TOOLBAR_MODERATOR = [
  ...JITSI_TOOLBAR_ATTENDEE.filter((btn) => btn !== "hangup"),
  "recording",
  "mute-everyone",
  "end-conference",
  "hangup",
] as const;

export function buildJitsiInterfaceConfigOverwrite() {
  return {
    MOBILE_APP_PROMO: false,
    SHOW_JITSI_WATERMARK: false,
    SHOW_PROMOTIONAL_CLOSE_PAGE: false,
    SETTINGS_SECTIONS: ["devices", "language", "moderator", "profile", "calendar"],
    SHOW_AUDIO_SETTINGS: true,
  };
}

export function buildJitsiConfigOverwrite(
  settings: MeetHostRoomSettings,
  isMeetingModerator = false,
  recordingEnabled = false
) {
  const moderatorToolbar = recordingEnabled
    ? [...JITSI_TOOLBAR_MODERATOR]
    : JITSI_TOOLBAR_MODERATOR.filter((btn) => btn !== "recording");
  return {
    prejoinPageEnabled: true,
    disableDeepLinking: true,
    disableInviteFunctions: true,
    pip: {
      disabled: false,
    },
    startAudioOnly: false,
    startSilent: false,
    startWithAudioMuted: settings.mute_audio_on_join,
    startWithVideoMuted: settings.video_off_on_join,
    disableRemoteMute: !isMeetingModerator,
    fileRecordingsEnabled: recordingEnabled,
    liveStreamingEnabled: false,
    toolbarButtons: isMeetingModerator ? moderatorToolbar : [...JITSI_TOOLBAR_ATTENDEE],
    // P2P between two desktops (e.g. Windows + macOS) often fails NAT/firewall checks and
    // produces one-way or no audio. Phones usually relay via JVB and work; force relay for all.
    p2p: {
      enabled: false,
      useStunTurn: true,
    },
    enableOpusRed: true,
    enableRemb: true,
    enableTcc: true,
    enableTalkWhileMuted: true,
    // Noisy-mic auto-mute can silence legitimate desktop mics in quiet rooms.
    enableNoAudioDetection: false,
    enableNoisyMicDetection: false,
    stereo: false,
    constraints: {
      audio: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    },
  };
}

/** Hash fragment for direct Jitsi room URLs (pop-out / join in browser). */
export function buildJitsiRoomUrlHash(settings: MeetHostRoomSettings): string {
  const params = new URLSearchParams();
  params.set("config.p2p.enabled", "false");
  params.set("config.prejoinPageEnabled", "true");
  params.set("config.startWithAudioMuted", String(settings.mute_audio_on_join));
  params.set("config.startWithVideoMuted", String(settings.video_off_on_join));
  params.set("config.enableNoisyMicDetection", "false");
  params.set("config.enableNoAudioDetection", "false");
  return params.toString();
}

export function buildExternalMeetRoomUrl(
  joinData: {
    server_url: string;
    room_name: string;
    token: string;
  },
  settings: MeetHostRoomSettings = DEFAULT_MEET_HOST_SETTINGS
): string {
  const url = new URL(`${joinData.server_url.replace(/\/$/, "")}/${joinData.room_name}`);
  url.searchParams.set("jwt", joinData.token);
  const hash = buildJitsiRoomUrlHash(settings);
  if (hash) url.hash = hash;
  return url.toString();
}
