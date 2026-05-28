export interface JitsiParticipantInfo {
  participantId?: string;
  id?: string;
  displayName?: string;
  email?: string;
  avatarURL?: string;
  audioMuted?: boolean;
  videoMuted?: boolean;
  isAudioMuted?: boolean;
  isVideoMuted?: boolean;
  muted?: boolean;
  isMuted?: boolean;
}

export interface JitsiRecordingStatusEvent {
  on?: boolean;
  mode?: string;
  error?: string;
  status?: string;
}

export interface JitsiMeetExternalAPIInstance {
  addListener: (event: string, listener: (payload: any) => void) => void;
  removeListener?: (event: string, listener: (payload: any) => void) => void;
  executeCommand: (command: string, ...args: any[]) => void;
  getParticipantsInfo?: () => JitsiParticipantInfo[];
  getNumberOfParticipants?: () => number;
  dispose?: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiMeetExternalAPIInstance;
  }
}

const loadedScripts = new Map<string, Promise<void>>();

export function loadJitsiExternalApi(baseUrl: string): Promise<void> {
  const scriptUrl = `${baseUrl.replace(/\/$/, "")}/external_api.js`;
  if (window.JitsiMeetExternalAPI) {
    return Promise.resolve();
  }
  const existing = loadedScripts.get(scriptUrl);
  if (existing) {
    return existing;
  }
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadedScripts.delete(scriptUrl);
      try {
        script.remove();
      } catch {
        // Ignore cleanup errors.
      }
      reject(new Error("Could not load the Jitsi Meet embed script."));
    };
    document.body.appendChild(script);
  });
  loadedScripts.set(scriptUrl, promise);
  return promise;
}
