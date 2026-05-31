import { useMutation } from "@tanstack/react-query";
import { Bot, Loader2, MessageSquare, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { TextareaWithSendAddon } from "../ui/FieldSendAddon";
import { FormattedAssistantText } from "../../lib/formatAssistantText";
import { askMeetingAssistant, type MeetingAssistantTurn } from "../../lib/meetAssistant";
import { parseApiError } from "../../lib/api";
import { meetDrawer } from "../../lib/meetDrawerTheme";
import { MeetDrawerComposer } from "./drawer/MeetDrawerComposer";
import { MeetDrawerEmptyState } from "./drawer/MeetDrawerEmptyState";
import {
  MeetDrawerActionButton,
  MeetDrawerMessageActions,
} from "./drawer/MeetDrawerMessageActions";
import { MeetDrawerThreadLayout } from "./drawer/MeetDrawerThreadLayout";
import type { MeetSession } from "../../types";

const ASSISTANT_STARTERS = [
  "Summarize this meeting",
  "What were the key decisions?",
  "List action items",
] as const;

type Props = {
  meeting: Pick<
    MeetSession,
    | "id"
    | "title"
    | "status"
    | "summary"
    | "meeting_minutes"
    | "assistant_notes"
    | "gre_assistant_enabled"
  >;
  compact?: boolean;
  variant?: "light" | "dark";
  drawerLayout?: boolean;
};

export function MeetingGreAssistantPanel({
  meeting,
  compact = false,
  variant = "light",
  drawerLayout = false,
}: Props) {
  const isDark = variant === "dark";
  const useDrawerChrome = isDark && drawerLayout;
  const threadRef = useRef<HTMLDivElement>(null);
  const historyStorageKey = useMemo(
    () => `gre-meet-assistant-history:${meeting.id}`,
    [meeting.id]
  );
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<MeetingAssistantTurn[]>(() => {
    try {
      const raw = sessionStorage.getItem(`gre-meet-assistant-history:${meeting.id}`);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as MeetingAssistantTurn[];
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(
        (turn) => turn && (turn.role === "user" || turn.role === "assistant") && typeof turn.content === "string"
      );
    } catch {
      return [];
    }
  });
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      sessionStorage.setItem(historyStorageKey, JSON.stringify(history));
    } catch {
      // Ignore storage failures.
    }
  }, [history, historyStorageKey]);

  const askMutation = useMutation({
    mutationFn: async (prompt: string) =>
      askMeetingAssistant(meeting.id, prompt, history),
    onSuccess: (answer, prompt) => {
      setHistory((prev) => [
        ...prev,
        { role: "user", content: prompt },
        { role: "assistant", content: answer },
      ]);
      setQuestion("");
      setError("");
    },
    onError: (err) => {
      setError(parseApiError(err, "GRE Assistant could not answer right now."));
    },
  });

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [history, askMutation.isPending]);

  const isLive = meeting.status === "live";
  const enabled = meeting.gre_assistant_enabled !== false;

  const handleAsk = (prompt?: string) => {
    const value = (prompt ?? question).trim();
    if (!value || askMutation.isPending) return;
    askMutation.mutate(value);
  };

  const copyTurnContent = (content: string) => {
    void (navigator.clipboard?.writeText?.(content) ?? Promise.reject()).catch(() => {});
  };

  if (!enabled) {
    return (
      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        GRE Assistant is not enabled for this meeting.
      </p>
    );
  }

  const renderDrawerTurn = (turn: MeetingAssistantTurn, index: number) => {
    const isUser = turn.role === "user";
    if (isUser) {
      return (
        <div key={`${turn.role}-${index}`} className="mb-5 flex flex-col items-end last:mb-0">
          <div className="group/msg max-w-[88%]">
            <div className={meetDrawer.chatBubbleOwn}>
              <p className="whitespace-pre-wrap">{turn.content}</p>
            </div>
            <MeetDrawerMessageActions align="end">
              <MeetDrawerActionButton variant="own" onClick={() => setQuestion(turn.content)}>
                Reuse
              </MeetDrawerActionButton>
              <MeetDrawerActionButton variant="own" onClick={() => copyTurnContent(turn.content)}>
                Copy
              </MeetDrawerActionButton>
            </MeetDrawerMessageActions>
          </div>
        </div>
      );
    }

    return (
      <div key={`${turn.role}-${index}`} className="mb-5 flex gap-2.5 last:mb-0">
        <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800/90 ring-1 ring-slate-700/50">
          <Sparkles className="h-4 w-4 text-cyan-500/75" />
        </span>
        <div className="group/msg min-w-0 max-w-[calc(100%-2.5rem)] flex-1">
          <p className="mb-1 text-[11px] font-medium text-slate-500">GRE Assistant</p>
          <div className={meetDrawer.chatBubbleOther}>
            <FormattedAssistantText content={turn.content} className="!text-slate-100" />
          </div>
          <MeetDrawerMessageActions align="start">
            <MeetDrawerActionButton variant="accent" onClick={() => copyTurnContent(turn.content)}>
              Copy
            </MeetDrawerActionButton>
          </MeetDrawerMessageActions>
        </div>
      </div>
    );
  };

  const thinkingRow = (
    <div className="mb-4 flex gap-2.5">
      <span className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800/90 ring-1 ring-slate-700/50">
        <Sparkles className="h-4 w-4 text-cyan-500/75" />
      </span>
      <div className={`${meetDrawer.chatBubbleOther} inline-flex items-center gap-2 text-slate-400`}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Thinking…</span>
      </div>
    </div>
  );

  if (useDrawerChrome) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <MeetDrawerThreadLayout
          threadRef={threadRef}
          notice={
            <div className={meetDrawer.chatNotice}>
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-cyan-500/60" />
              <p>
                Private to you. Answers use this meeting&apos;s transcript, minutes, and notes when
                available.
              </p>
            </div>
          }
          footer={
            <>
              <MeetDrawerComposer
                value={question}
                onChange={setQuestion}
                onSubmit={() => handleAsk()}
                placeholder="Ask a question…"
                loading={askMutation.isPending}
                disabled={askMutation.isPending}
                submitAriaLabel="Send question"
              />
            </>
          }
          footerError={error || undefined}
        >
          <>
            {history.length === 0 && !askMutation.isPending ? (
              <>
                <MeetDrawerEmptyState
                  icon={MessageSquare}
                  title="No questions yet"
                  description="Ask about decisions, action items, or what was discussed in this meeting."
                />
                <div className="flex flex-wrap justify-center gap-2 px-2">
                  {ASSISTANT_STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => handleAsk(starter)}
                      className="rounded-full border border-slate-700/80 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-cyan-900/50 hover:bg-slate-800 hover:text-slate-100"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-1">
                {history.map(renderDrawerTurn)}
                {askMutation.isPending && thinkingRow}
              </div>
            )}
          </>
        </MeetDrawerThreadLayout>
      </div>
    );
  }

  const threadShell = isDark
    ? "min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-3"
    : `min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-3 ${
        compact ? "max-h-64" : "max-h-80"
      }`;

  const emptyHint = isDark ? "text-sm text-slate-400" : "text-sm text-slate-600";

  const renderTurn = (turn: MeetingAssistantTurn, index: number) => {
    const isUser = turn.role === "user";
    if (isUser) {
      return (
        <div key={`${turn.role}-${index}`} className="flex justify-end">
          <p
            className={`max-w-[92%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm leading-relaxed ${
              isDark ? "bg-slate-700/95 text-slate-100" : "bg-brand-600 text-white"
            }`}
          >
            {turn.content}
          </p>
        </div>
      );
    }

    return (
      <div key={`${turn.role}-${index}`} className="flex gap-2.5">
        <span
          className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            isDark ? "bg-slate-800 text-cyan-500/85" : "bg-brand-100 text-brand-700"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div
          className={`min-w-0 max-w-[88%] flex-1 rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm leading-relaxed ${
            isDark ? "bg-slate-800 text-slate-100" : "bg-white text-slate-800 ring-1 ring-slate-200/80"
          }`}
        >
          <FormattedAssistantText content={turn.content} />
        </div>
      </div>
    );
  };

  const thinkingBubble = (
    <div className="flex gap-2.5">
      <span
        className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isDark ? "bg-slate-800 text-cyan-500/85" : "bg-brand-100 text-brand-700"
        }`}
      >
        <Sparkles className="h-3.5 w-3.5" />
      </span>
      <div
        className={`rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm ${
          isDark ? "bg-slate-800 text-slate-300" : "bg-white text-slate-600 ring-1 ring-slate-200/80"
        }`}
      >
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Thinking…
        </span>
      </div>
    </div>
  );

  return (
    <div className={`flex min-h-0 flex-col ${compact ? "h-full gap-3" : "gap-4"}`}>
      {isDark && (
        <div className="flex shrink-0 items-center gap-2">
          <Bot className="h-4 w-4 text-cyan-500/85" />
          <p className="text-sm font-semibold text-slate-100">GRE Assistant</p>
          {isLive && (
            <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
              Live
            </span>
          )}
        </div>
      )}

      {!isDark && isLive && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200/80">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden />
            Live meeting
          </span>
        </div>
      )}

      <div ref={threadRef} className={threadShell}>
        {history.length > 0 ? (
          <>
            {history.map(renderTurn)}
            {askMutation.isPending && thinkingBubble}
          </>
        ) : (
          <>
            <p className={emptyHint}>
              Ask anything about this meeting: minutes, decisions, or the transcript.
            </p>
            {askMutation.isPending && thinkingBubble}
          </>
        )}
      </div>

      <div
        className={
          isDark
            ? "mt-auto shrink-0 space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-3"
            : "shrink-0 space-y-2"
        }
      >
        <TextareaWithSendAddon
          value={question}
          onChange={setQuestion}
          onSubmit={() => handleAsk()}
          placeholder="Ask a question…"
          loading={askMutation.isPending}
          disabled={askMutation.isPending}
          rows={compact ? 2 : 2}
          submitAriaLabel="Send question"
          variant={isDark ? "dark" : "light"}
        />
        {error && (
          <p className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>
        )}
      </div>
    </div>
  );
}
