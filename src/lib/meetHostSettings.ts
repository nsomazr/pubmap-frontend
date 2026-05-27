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

export function buildJitsiConfigOverwrite(settings: MeetHostRoomSettings) {
  return {
    prejoinPageEnabled: false,
    disableDeepLinking: true,
    startAudioOnly: false,
    startWithAudioMuted: settings.mute_audio_on_join,
    startWithVideoMuted: settings.video_off_on_join,
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
  };
}
