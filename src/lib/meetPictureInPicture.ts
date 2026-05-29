import type { JitsiMeetExternalAPIInstance } from "./jitsi";

type DocumentPictureInPicture = {
  window: Window | null;
  requestWindow: (options?: { width?: number; height?: number }) => Promise<Window>;
};

function getDocumentPictureInPicture(): DocumentPictureInPicture | undefined {
  return (document as Document & { documentPictureInPicture?: DocumentPictureInPicture })
    .documentPictureInPicture;
}

export function isMeetDocumentPipSupported(): boolean {
  return typeof document !== "undefined" && !!getDocumentPictureInPicture()?.requestWindow;
}

export function isMeetDocumentPipActive(): boolean {
  return !!getDocumentPictureInPicture()?.window;
}

function iconSvg(kind: "mic" | "mic-off" | "video" | "video-off" | "hangup" | "external" | "close") {
  const common = 'xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
  switch (kind) {
    case "mic":
      return `<svg ${common}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;
    case "mic-off":
      return `<svg ${common}><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12.13 4.87"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>`;
    case "video":
      return `<svg ${common}><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>`;
    case "video-off":
      return `<svg ${common}><path d="M10.66 6H14a2 2 0 0 1 2 2v2.34l1 1L23 7l-2-2-3.66 3.66"/><path d="M16 16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`;
    case "hangup":
      return `<svg ${common}><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v2a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h2a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91"/><line x1="22" x2="2" y1="2" y2="22"/></svg>`;
    case "external":
      return `<svg ${common}><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`;
    case "close":
      return `<svg ${common}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
    default:
      return "";
  }
}

function injectPipStyles(doc: Document) {
  const style = doc.createElement("style");
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      height: 100%;
      background: #0f172a;
      color: #e2e8f0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      overflow: hidden;
    }
    .gre-pip {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
    }
    .gre-pip-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 8px 10px;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      font-size: 12px;
      font-weight: 600;
      color: #cbd5e1;
    }
    .gre-pip-top-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .gre-pip-icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
    }
    .gre-pip-icon-btn:hover {
      background: #334155;
      color: #f1f5f9;
    }
    .gre-pip-video {
      position: relative;
      flex: 1;
      min-height: 0;
      background: #020617;
    }
    .gre-pip-video > * {
      width: 100% !important;
      height: 100% !important;
    }
    .gre-pip-video iframe {
      border: 0;
    }
    .gre-pip-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px 14px 14px;
      background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
      border-top: 1px solid #334155;
    }
    .gre-pip-round {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border: none;
      border-radius: 14px;
      background: #fce7f3;
      color: #be123c;
      cursor: pointer;
      transition: transform 0.12s ease, background 0.12s ease;
    }
    .gre-pip-round:hover { transform: scale(1.04); }
    .gre-pip-round.is-muted {
      background: #fecdd3;
      color: #9f1239;
    }
    .gre-pip-hangup {
      width: 52px;
      height: 52px;
      border-radius: 999px;
      background: #dc2626;
      color: #fff;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(220, 38, 38, 0.35);
    }
    .gre-pip-hangup:hover { background: #b91c1c; }
  `;
  doc.head.appendChild(style);
}

export type OpenMeetDocumentPipOptions = {
  container: HTMLElement;
  api: JitsiMeetExternalAPIInstance;
  title?: string;
  onHangup?: () => void;
  onRestore?: () => void;
};

/**
 * Moves the live Jitsi embed into a Document Picture-in-Picture window (Chrome / Edge).
 * Returns true when opened, false when unsupported.
 */
export async function openMeetDocumentPictureInPicture(
  options: OpenMeetDocumentPipOptions
): Promise<boolean> {
  const docPip = getDocumentPictureInPicture();
  if (!docPip?.requestWindow) return false;

  if (docPip.window) {
    docPip.window.close();
    return true;
  }

  const pipWindow = await docPip.requestWindow({
    width: 400,
    height: 520,
  });

  const doc = pipWindow.document;
  doc.title = options.title || "GRE Meet";
  injectPipStyles(doc);

  const shell = doc.createElement("div");
  shell.className = "gre-pip";

  const top = doc.createElement("div");
  top.className = "gre-pip-top";
  top.innerHTML = `<span>${options.title || "GRE Meet"}</span>`;

  const topActions = doc.createElement("div");
  topActions.className = "gre-pip-top-actions";

  const backBtn = doc.createElement("button");
  backBtn.type = "button";
  backBtn.className = "gre-pip-icon-btn";
  backBtn.title = "Back to meeting tab";
  backBtn.setAttribute("aria-label", "Back to meeting tab");
  backBtn.innerHTML = iconSvg("external");

  const closeBtn = doc.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "gre-pip-icon-btn";
  closeBtn.title = "Close picture-in-picture";
  closeBtn.setAttribute("aria-label", "Close picture-in-picture");
  closeBtn.innerHTML = iconSvg("close");

  topActions.append(backBtn, closeBtn);
  top.appendChild(topActions);

  const videoHost = doc.createElement("div");
  videoHost.className = "gre-pip-video";

  const controls = doc.createElement("div");
  controls.className = "gre-pip-controls";

  const micBtn = doc.createElement("button");
  micBtn.type = "button";
  micBtn.className = "gre-pip-round";
  micBtn.title = "Microphone";
  micBtn.setAttribute("aria-label", "Toggle microphone");
  micBtn.innerHTML = iconSvg("mic");

  const camBtn = doc.createElement("button");
  camBtn.type = "button";
  camBtn.className = "gre-pip-round";
  camBtn.title = "Camera";
  camBtn.setAttribute("aria-label", "Toggle camera");
  camBtn.innerHTML = iconSvg("video");

  const hangupBtn = doc.createElement("button");
  hangupBtn.type = "button";
  hangupBtn.className = "gre-pip-hangup";
  hangupBtn.title = "Leave call";
  hangupBtn.setAttribute("aria-label", "Leave call");
  hangupBtn.innerHTML = iconSvg("hangup");

  controls.append(micBtn, camBtn, hangupBtn);
  shell.append(top, videoHost, controls);
  doc.body.replaceChildren(shell);

  const parent = options.container.parentElement;
  const placeholder = document.createComment("gre-meet-pip-placeholder");
  if (parent) {
    parent.insertBefore(placeholder, options.container);
  }
  videoHost.appendChild(options.container);

  const restore = () => {
    if (placeholder.parentNode) {
      placeholder.parentNode.insertBefore(options.container, placeholder);
      placeholder.remove();
    }
    options.onRestore?.();
  };

  pipWindow.addEventListener(
    "pagehide",
    () => {
      restore();
    },
    { once: true }
  );

  backBtn.addEventListener("click", () => {
    window.focus();
  });

  closeBtn.addEventListener("click", () => {
    pipWindow.close();
  });

  micBtn.addEventListener("click", () => {
    try {
      options.api.executeCommand("toggleAudio");
      micBtn.classList.toggle("is-muted");
      micBtn.innerHTML = iconSvg(micBtn.classList.contains("is-muted") ? "mic-off" : "mic");
    } catch {
      // Ignore if command unavailable.
    }
  });

  camBtn.addEventListener("click", () => {
    try {
      options.api.executeCommand("toggleVideo");
      camBtn.classList.toggle("is-muted");
      camBtn.innerHTML = iconSvg(camBtn.classList.contains("is-muted") ? "video-off" : "video");
    } catch {
      // Ignore if command unavailable.
    }
  });

  hangupBtn.addEventListener("click", () => {
    try {
      options.api.executeCommand("hangup");
    } catch {
      // Ignore if hangup command unavailable.
    }
    options.onHangup?.();
    pipWindow.close();
  });

  return true;
}

export function closeMeetDocumentPictureInPicture() {
  getDocumentPictureInPicture()?.window?.close();
}
