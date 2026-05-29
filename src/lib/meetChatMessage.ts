import type { MeetChatMessage, MeetChatMessageType } from "../types";

export function getMeetChatSenderName(message: MeetChatMessage): string {
  return (
    message.sender?.full_name ||
    `${message.sender?.firstname ?? ""} ${message.sender?.lastname ?? ""}`.trim() ||
    message.sender?.email ||
    "Participant"
  );
}

export function formatMeetChatTime(value?: string | null, style: "time" | "full" = "time") {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (style === "full") {
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return value;
  }
}

export const MEET_CHAT_REPLY_PREFIX = "[[GRE_REPLY]]";

/** Strip nested reply metadata and duplicate text from stored snippets (legacy messages). */
export function formatMeetChatReplySnippet(snippet: string): string {
  let text = (snippet || "").replace(/\s+/g, " ").trim();
  if (!text) return "";

  let guard = 0;
  while (text.includes(MEET_CHAT_REPLY_PREFIX) && guard < 6) {
    guard += 1;
    const prefixAt = text.indexOf(MEET_CHAT_REPLY_PREFIX);
    const payload = text.slice(prefixAt + MEET_CHAT_REPLY_PREFIX.length);
    const sep = payload.indexOf("|||");
    if (sep < 0) {
      text = payload.trim();
      break;
    }
    text = payload.slice(sep + 3).trim();
  }

  text = text.replace(/\[\[GRE_REPLY\]\]/g, "").replace(/\|\|\|/g, " ").replace(/\s+/g, " ").trim();

  const half = Math.floor(text.length / 2);
  if (half > 2) {
    const left = text.slice(0, half).trim();
    const right = text.slice(half).trim();
    if (left === right) {
      text = left;
    }
  }

  const words = text.split(" ");
  if (words.length >= 2 && words.length % 2 === 0) {
    const mid = words.length / 2;
    if (words.slice(0, mid).join(" ") === words.slice(mid).join(" ")) {
      text = words.slice(0, mid).join(" ");
    }
  }

  return text.trim();
}

export function parseMeetChatReply(rawMessage: string): {
  replyToName?: string;
  replySnippet?: string;
  body: string;
} {
  const text = (rawMessage || "").trim();
  if (!text) return { body: "" };

  const lines = text.split("\n");
  const firstLine = lines[0] || "";
  const rest = lines.slice(1).join("\n").trim();

  if (firstLine.startsWith(MEET_CHAT_REPLY_PREFIX)) {
    const payload = firstLine.slice(MEET_CHAT_REPLY_PREFIX.length);
    const sep = payload.indexOf("|||");
    const name = (sep >= 0 ? payload.slice(0, sep) : payload).trim() || "Participant";
    const rawSnippet = sep >= 0 ? payload.slice(sep + 3).trim() : "";
    const replySnippet = formatMeetChatReplySnippet(rawSnippet);
    return {
      replyToName: name,
      ...(replySnippet ? { replySnippet } : {}),
      body: rest,
    };
  }

  const legacy = firstLine.match(/^↪\s*Reply to\s+(.+?):\s*"(.*)"$/);
  if (legacy) {
    const replySnippet = formatMeetChatReplySnippet((legacy[2] || "").trim());
    return {
      replyToName: (legacy[1] || "").trim() || "Participant",
      ...(replySnippet ? { replySnippet } : {}),
      body: rest,
    };
  }

  return { body: text };
}

/** Visible text to quote when replying (never includes reply metadata). */
export function getMeetChatReplyQuoteSnippet(rawMessage: string, maxLen = 160): string {
  const { body } = parseMeetChatReply(rawMessage);
  const quote = (body || rawMessage || "").replace(/\s+/g, " ").trim();
  return quote.slice(0, maxLen);
}

export function composeMeetChatMessage(opts: {
  body: string;
  replyToName?: string;
  replyToMessage?: string;
  tagName?: string;
}): string {
  const lines: string[] = [];
  if (opts.tagName?.trim()) lines.push(`@${opts.tagName.trim()}`);
  if (opts.replyToName?.trim() && opts.replyToMessage != null) {
    const snippet = getMeetChatReplyQuoteSnippet(opts.replyToMessage);
    lines.push(`${MEET_CHAT_REPLY_PREFIX}${opts.replyToName.trim()}|||${snippet}`);
  }
  const body = opts.body.trim();
  if (body) lines.push(body);
  return lines.join("\n").trim();
}

const SENDER_ACCENT = [
  "ring-brand-200 bg-brand-50 text-brand-800",
  "ring-teal-200 bg-teal-50 text-teal-800",
  "ring-violet-200 bg-violet-50 text-violet-800",
  "ring-amber-200 bg-amber-50 text-amber-900",
  "ring-rose-200 bg-rose-50 text-rose-800",
  "ring-sky-200 bg-sky-50 text-sky-800",
] as const;

export function meetChatSenderAccent(senderId: number) {
  return SENDER_ACCENT[Math.abs(senderId) % SENDER_ACCENT.length];
}

export function meetChatTypeMeta(type: MeetChatMessageType) {
  if (type === "question") {
    return {
      label: "Question",
      bubble: "border-l-4 border-l-amber-400 bg-amber-50/90 ring-amber-200/80",
      chip: "bg-amber-100 text-amber-900",
    };
  }
  if (type === "reaction") {
    return {
      label: "Reaction",
      bubble: "bg-slate-100 ring-slate-200/90",
      chip: "bg-slate-200 text-slate-700",
    };
  }
  return {
    label: "Message",
    bubble: "bg-white ring-slate-200/90",
    chip: "bg-slate-100 text-slate-600",
  };
}

export type MeetChatMessageGroup = {
  senderId: number;
  senderName: string;
  messages: MeetChatMessage[];
};

export function groupMeetChatMessages(messages: MeetChatMessage[]): MeetChatMessageGroup[] {
  const groups: MeetChatMessageGroup[] = [];
  for (const message of messages) {
    const senderName = getMeetChatSenderName(message);
    const last = groups[groups.length - 1];
    if (last && last.senderId === message.sender_id) {
      last.messages.push(message);
      continue;
    }
    groups.push({
      senderId: message.sender_id,
      senderName,
      messages: [message],
    });
  }
  return groups;
}

export function shouldShowMeetChatTimeGap(prev?: string | null, next?: string | null, minutes = 12) {
  if (!prev || !next) return false;
  try {
    const gap = new Date(next).getTime() - new Date(prev).getTime();
    return gap >= minutes * 60 * 1000;
  } catch {
    return false;
  }
}
