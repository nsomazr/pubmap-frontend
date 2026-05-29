import type { JitsiMeetExternalAPIInstance } from "./jitsi";
import type { MeetSession } from "../types";

export type MeetHostRoomSettings = {
  mute_audio_on_join: boolean;
  video_off_on_join: boolean;
  screen_share_moderator_only: boolean;
};

export const DEFAULT_MEET_HOST_SETTINGS: MeetHostRoomSettings = {
  mute_audio_on_join: true,
  video_off_on_join: true,
  screen_share_moderator_only: true,
};

export function meetHostSettingsFromSession(
  meeting?: Partial<MeetSession> | null
): MeetHostRoomSettings {
  return {
    mute_audio_on_join: meeting?.mute_audio_on_join ?? DEFAULT_MEET_HOST_SETTINGS.mute_audio_on_join,
    video_off_on_join: meeting?.video_off_on_join ?? DEFAULT_MEET_HOST_SETTINGS.video_off_on_join,
    screen_share_moderator_only:
      meeting?.screen_share_moderator_only ?? DEFAULT_MEET_HOST_SETTINGS.screen_share_moderator_only,
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
      try {
        api.executeCommand("toggleAudio", false);
      } catch {
        // Jitsi version may not support one of these commands.
      }
    }
  }
  if (settings.video_off_on_join) {
    try {
      api.executeCommand("setVideoMuted", true);
    } catch {
      try {
        api.executeCommand("toggleVideo", false);
      } catch {
        // Jitsi version may not support one of these commands.
      }
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

export function buildJitsiConfigOverwrite(
  settings: MeetHostRoomSettings,
  isMeetingModerator = false,
  recordingEnabled = false
) {
  const moderatorToolbar = recordingEnabled
    ? [...JITSI_TOOLBAR_MODERATOR]
    : JITSI_TOOLBAR_MODERATOR.filter((btn) => btn !== "recording");
  return {
    prejoinPageEnabled: false,
    disableDeepLinking: true,
    disableInviteFunctions: true,
    startAudioOnly: false,
    startWithAudioMuted: settings.mute_audio_on_join,
    startWithVideoMuted: settings.video_off_on_join,
    disableRemoteMute: !isMeetingModerator,
    fileRecordingsEnabled: recordingEnabled,
    liveStreamingEnabled: false,
    toolbarButtons: isMeetingModerator ? moderatorToolbar : [...JITSI_TOOLBAR_ATTENDEE],
  };
}
