import { useMutation } from "@tanstack/react-query";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
};

export function MeetingGreAssistantPanel({ meeting, compact = false }: Props) {
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

  const isLive = meeting.status === "live";
  const enabled = meeting.gre_assistant_enabled !== false;

  const handleAsk = (prompt?: string) => {
    const value = (prompt ?? question).trim();
    if (!value || askMutation.isPending) return;
    askMutation.mutate(value);
  };

  if (!enabled) {
    return (
      <p className="text-sm text-slate-500">GRE Assistant is not enabled for this meeting.</p>
    );
  }

  return (
    <div className={`flex h-full min-h-0 flex-col ${compact ? "gap-3" : "gap-4"}`}>
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-brand-400" />
        <p className="text-sm font-semibold text-slate-100">GRE Assistant</p>
        {isLive && (
          <span className="rounded-full bg-emerald-900/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">
            Live
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
        {history.length > 0 ? (
          <>
          {history.map((turn, index) => (
            <div
              key={`${turn.role}-${index}`}
              className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                  turn.role === "user"
                    ? "rounded-br-md bg-brand-900/40 text-slate-100"
                    : "rounded-bl-md bg-slate-800 text-slate-100"
                }`}
              >
                <p
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    turn.role === "user" ? "text-brand-200/80" : "text-slate-400"
                  }`}
                >
                  {turn.role === "user" ? "You" : "GRE Assistant"}
                </p>
                <div className="mt-1">
                  <FormattedAssistantText content={turn.content} />
                </div>
              </div>
            </div>
          ))}
          {askMutation.isPending && (
            <div className="flex justify-start">
              <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-slate-800 px-3 py-2 text-sm text-slate-100">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  GRE Assistant
                </p>
                <div className="mt-1 flex items-center gap-2 text-slate-300">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Thinking...
                </div>
              </div>
            </div>
          )}
          </>
        ) : (
          <>
            <p className="text-sm text-slate-400">Ask anything about this meeting. The assistant replies here.</p>
            {askMutation.isPending && (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-slate-800 px-3 py-2 text-sm text-slate-100">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    GRE Assistant
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-slate-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <form
        className="mt-auto space-y-2 rounded-2xl border border-slate-800 bg-slate-900/80 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleAsk();
        }}
      >
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
            placeholder="Ask a question..."
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
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </div>
  );
}
