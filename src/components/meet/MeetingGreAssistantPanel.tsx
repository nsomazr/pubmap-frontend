import { useMutation } from "@tanstack/react-query";
import { Bot, Loader2, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { FormattedAssistantText } from "../../lib/formatAssistantText";
import { askMeetingAssistant, type MeetingAssistantTurn } from "../../lib/meetAssistant";
import { parseApiError } from "../../lib/api";
import type { MeetSession } from "../../types";

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
  /** Light cards (archive, dashboard); dark drawer in live meet room. */
  variant?: "light" | "dark";
};

export function MeetingGreAssistantPanel({
  meeting,
  compact = false,
  variant = "light",
}: Props) {
  const isDark = variant === "dark";
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
      // Ignore storage failures (private mode/quota), keep in-memory behavior.
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

  if (!enabled) {
    return (
      <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        GRE Assistant is not enabled for this meeting.
      </p>
    );
  }

  const threadShell = isDark
    ? "min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-3"
    : `min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/80 p-3 ${
        compact ? "max-h-64" : "max-h-80"
      }`;

  const emptyHint = isDark
    ? "text-sm text-slate-400"
    : "text-sm text-slate-600";

  const renderTurn = (turn: MeetingAssistantTurn, index: number) => {
    const isUser = turn.role === "user";
    if (isUser) {
      return (
        <div key={`${turn.role}-${index}`} className="flex justify-end">
          <p
            className={`max-w-[92%] rounded-2xl rounded-br-md px-3.5 py-2.5 text-sm leading-relaxed ${
              isDark ? "bg-brand-900/40 text-slate-100" : "bg-brand-600 text-white"
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
            isDark ? "bg-slate-800 text-brand-300" : "bg-brand-100 text-brand-700"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <div
          className={`min-w-0 max-w-[88%] flex-1 rounded-2xl rounded-tl-md px-3.5 py-2.5 text-sm leading-relaxed ${
            isDark
              ? "bg-slate-800 text-slate-100"
              : "bg-white text-slate-800 ring-1 ring-slate-200/80"
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
          isDark ? "bg-slate-800 text-brand-300" : "bg-brand-100 text-brand-700"
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
    <div className={`flex h-full min-h-0 flex-col ${compact ? "gap-3" : "gap-4"}`}>
      {isDark && (
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-brand-400" />
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
              Ask anything about this meeting — minutes, decisions, or the transcript.
            </p>
            {askMutation.isPending && thinkingBubble}
          </>
        )}
      </div>

      <form
        className={isDark ? "mt-auto space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-3" : "space-y-2"}
        onSubmit={(event) => {
          event.preventDefault();
          handleAsk();
        }}
      >
        {isDark ? (
          <div className="relative">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                if (event.shiftKey) return;
                event.preventDefault();
                handleAsk();
              }}
              placeholder="Ask a question…"
              rows={1}
              className="max-h-28 min-h-11 w-full resize-y rounded-3xl border border-slate-700 bg-slate-950 py-3 pl-4 pr-24 text-sm text-slate-100 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-900/40"
            />
            <Button
              type="submit"
              disabled={!question.trim()}
              loading={askMutation.isPending}
              className="absolute right-1.5 top-1/2 h-8 min-w-[72px] -translate-y-1/2 rounded-full px-3 text-sm"
            >
              <Sparkles className="h-4 w-4" />
              Ask
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Ask GRE Assistant</span>
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  if (event.shiftKey) return;
                  event.preventDefault();
                  handleAsk();
                }}
                placeholder="Ask a question…"
                rows={compact ? 2 : 2}
                className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400"
              />
            </label>
            <button
              type="submit"
              disabled={!question.trim() || askMutation.isPending}
              className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {askMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Ask
            </button>
          </div>
        )}
        {error && (
          <p className={`text-sm ${isDark ? "text-red-400" : "text-red-600"}`}>{error}</p>
        )}
      </form>
    </div>
  );
}
