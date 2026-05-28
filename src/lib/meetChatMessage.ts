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

  if (firstLine.startsWith("[[GRE_REPLY]]")) {
    const payload = firstLine.replace("[[GRE_REPLY]]", "");
    const [name = "", snippet = ""] = payload.split("|||");
    return {
      replyToName: name.trim() || "Participant",
      replySnippet: snippet.trim(),
      body: rest,
    };
  }

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
