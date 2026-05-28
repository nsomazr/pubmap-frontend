import { HelpCircle, MessageCircle, Smile, Sparkles } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { UserAvatar } from "../ui/UserAvatar";
import type { MeetChatMessage, MeetChatMessageType } from "../../types";
import {
  formatMeetChatTime,
  getMeetChatSenderName,
  meetChatSenderAccent,
  meetChatTypeMeta,
  parseMeetChatReply,
  shouldShowMeetChatTimeGap,
  type MeetChatMessageGroup,
} from "../../lib/meetChatMessage";

type Filter = "all" | MeetChatMessageType;

type TimelineItem =
  | { kind: "time"; at: string; key: string }
  | { kind: "reaction"; message: MeetChatMessage; key: string }
  | { kind: "group"; group: MeetChatMessageGroup; key: string };

type Props = {
  messages: MeetChatMessage[];
};

function TranscriptEmptyState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-gradient-to-b from-slate-50/90 to-white px-6 py-14 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgb(59 91 219 / 0.08) 0%, transparent 42%), radial-gradient(circle at 80% 70%, rgb(20 184 166 / 0.08) 0%, transparent 40%)",
        }}
      />
      <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
        <MessageCircle className="h-7 w-7" />
      </div>
      <p className="relative mt-4 text-base font-semibold text-ink">No messages in the archive yet</p>
      <p className="relative mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
        When participants chat during the meeting, the full transcript will appear here as a
        conversation timeline — not a plain list.
      </p>
      <div className="relative mx-auto mt-8 flex max-w-xs justify-center gap-2 opacity-60" aria-hidden>
        <span className="h-9 w-24 rounded-2xl rounded-bl-md bg-white ring-1 ring-slate-200/80" />
        <span className="h-11 w-28 rounded-2xl rounded-br-md bg-brand-100/80 ring-1 ring-brand-200/60" />
      </div>
    </div>
  );
}

function TimeDivider({ at }: { at: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="h-px flex-1 bg-slate-200/80" />
      <time className="shrink-0 rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-slate-500 ring-1 ring-slate-200/80">
        {formatMeetChatTime(at, "full")}
      </time>
      <span className="h-px flex-1 bg-slate-200/80" />
    </div>
  );
}

function ReactionBurst({ message }: { message: MeetChatMessage }) {
  const parsed = parseMeetChatReply(message.message || "");
  const body = parsed.body || message.message;
  const senderName = getMeetChatSenderName(message);
  return (
    <div className="flex justify-center py-1">
      <div className="inline-flex max-w-[min(100%,20rem)] flex-col items-center gap-1.5 rounded-2xl bg-slate-100/90 px-4 py-3 text-center ring-1 ring-slate-200/80">
        <span className="text-2xl leading-none">{body.trim() || "—"}</span>
        <span className="text-[11px] font-medium text-slate-500">
          {senderName} · {formatMeetChatTime(message.created_at)} · reaction
        </span>
      </div>
    </div>
  );
}

function MessageBubble({ message, isLastInGroup }: { message: MeetChatMessage; isLastInGroup: boolean }) {
  const parsed = parseMeetChatReply(message.message || "");
  const meta = meetChatTypeMeta(message.message_type);
  const TypeIcon =
    message.message_type === "question" ? HelpCircle : message.message_type === "reaction" ? Smile : null;

  return (
    <div
      className={`relative max-w-[min(100%,28rem)] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ring-1 ${meta.bubble} ${
        isLastInGroup ? "rounded-bl-md" : "rounded-bl-2xl"
      }`}
    >
      {message.message_type !== "text" && (
        <span
          className={`mb-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.chip}`}
        >
          {TypeIcon && <TypeIcon className="h-3 w-3" />}
          {meta.label}
        </span>
      )}
      {parsed.replySnippet && (
        <div className="mb-2 rounded-xl border border-slate-200/80 bg-slate-50/90 px-2.5 py-2">
          <p className="text-[11px] font-semibold text-brand-700">{parsed.replyToName}</p>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{parsed.replySnippet}</p>
        </div>
      )}
      <p className="whitespace-pre-wrap text-slate-800">{parsed.body || message.message}</p>
      <time className="mt-1.5 block text-[10px] font-medium tabular-nums text-slate-400">
        {formatMeetChatTime(message.created_at)}
      </time>
    </div>
  );
}

function buildTimelineChronological(messages: MeetChatMessage[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  let previousTimestamp: string | null = null;
  let pendingGroup: MeetChatMessage[] = [];
  let pendingSenderId: number | null = null;
  let pendingSenderName = "";

  const flushGroup = () => {
    if (pendingGroup.length === 0 || pendingSenderId == null) return;
    items.push({
      kind: "group",
      group: {
        senderId: pendingSenderId,
        senderName: pendingSenderName,
        messages: pendingGroup,
      },
      key: `group-${pendingSenderId}-${pendingGroup[0]?.id}`,
    });
    pendingGroup = [];
    pendingSenderId = null;
    pendingSenderName = "";
  };

  for (const message of messages) {
    if (shouldShowMeetChatTimeGap(previousTimestamp, message.created_at)) {
      flushGroup();
      items.push({ kind: "time", at: message.created_at, key: `time-${message.id}` });
    }
    previousTimestamp = message.created_at;

    if (message.message_type === "reaction") {
      flushGroup();
      items.push({ kind: "reaction", message, key: `reaction-${message.id}` });
      continue;
    }

    if (pendingSenderId === message.sender_id) {
      pendingGroup.push(message);
      continue;
    }

    flushGroup();
    pendingSenderId = message.sender_id;
    pendingSenderName = getMeetChatSenderName(message);
    pendingGroup = [message];
  }

  flushGroup();
  return items;
}

export function MeetingArchiveTranscript({ messages }: Props) {
  const [filter, setFilter] = useState<Filter>("all");

  const sorted = useMemo(
    () =>
      [...messages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    [messages]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return sorted;
    return sorted.filter((m) => m.message_type === filter);
  }, [sorted, filter]);

  const timeline = useMemo(() => buildTimelineChronological(filtered), [filtered]);

  const voiceCount = useMemo(() => new Set(sorted.map((m) => m.sender_id)).size, [sorted]);
  const typeCounts = useMemo(
    () => ({
      question: sorted.filter((m) => m.message_type === "question").length,
      reaction: sorted.filter((m) => m.message_type === "reaction").length,
    }),
    [sorted]
  );

  if (sorted.length === 0) {
    return <TranscriptEmptyState />;
  }

  const filterOptions: { id: Filter; label: string; count?: number }[] = [
    { id: "all", label: "All", count: sorted.length },
  ];
  if (typeCounts.question > 0) {
    filterOptions.push({ id: "question", label: "Questions", count: typeCounts.question });
  }
  if (typeCounts.reaction > 0) {
    filterOptions.push({ id: "reaction", label: "Reactions", count: typeCounts.reaction });
  }

  const renderTimeline = (): ReactNode[] =>
    timeline.map((item) => {
      if (item.kind === "time") {
        return <TimeDivider key={item.key} at={item.at} />;
      }
      if (item.kind === "reaction") {
        return <ReactionBurst key={item.key} message={item.message} />;
      }

      const { group } = item;
      const accent = meetChatSenderAccent(group.senderId);
      const lastId = group.messages[group.messages.length - 1]?.id;

      return (
        <div key={item.key} className="flex gap-3 sm:gap-4">
          <div className="relative z-[1] shrink-0 pt-0.5">
            <UserAvatar
              user={group.messages[0]?.sender}
              name={group.senderName}
              size="sm"
              className={`ring-2 ${accent.split(" ")[0]}`}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2 pb-1">
            <p
              className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-semibold ring-1 ${accent}`}
            >
              {group.senderName}
            </p>
            <div className="space-y-2">
              {group.messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isLastInGroup={message.id === lastId}
                />
              ))}
            </div>
          </div>
        </div>
      );
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Sparkles className="h-4 w-4 text-brand-600" />
          <span>
            <span className="font-semibold text-ink">{sorted.length}</span> messages ·{" "}
            <span className="font-semibold text-ink">{voiceCount}</span>{" "}
            {voiceCount === 1 ? "voice" : "voices"}
          </span>
        </div>
        {filterOptions.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter transcript">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={filter === option.id}
                onClick={() => setFilter(option.id)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  filter === option.id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {option.label}
                {option.count != null && (
                  <span className={filter === option.id ? "text-white/80" : "text-slate-400"}>
                    {" "}
                    · {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center text-sm text-slate-500">
          No {filter === "question" ? "questions" : "reactions"} in this archive.
        </p>
      ) : (
        <div className="relative max-h-[min(32rem,70vh)] overflow-y-auto rounded-2xl border border-slate-200/80 bg-[linear-gradient(180deg,rgb(248_250_252)_0%,rgb(255_255_255)_12%,rgb(255_255_255)_100%)] px-3 py-4 sm:px-5">
          <div
            className="pointer-events-none absolute left-8 top-4 bottom-4 w-px bg-gradient-to-b from-brand-200/60 via-slate-200/50 to-transparent sm:left-10"
            aria-hidden
          />
          <div className="relative space-y-6">{renderTimeline()}</div>
        </div>
      )}
    </div>
  );
}
