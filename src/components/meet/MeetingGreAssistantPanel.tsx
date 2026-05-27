import { useMutation } from "@tanstack/react-query";
import { Bot, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/Button";
import { Textarea } from "../ui/Textarea";
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
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<MeetingAssistantTurn[]>([]);
  const [error, setError] = useState("");

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

  const minutesText = (meeting.meeting_minutes || meeting.summary || "").trim();
  const liveNotes = (meeting.assistant_notes || "").trim();
  const isLive = meeting.status === "live";
  const enabled = meeting.gre_assistant_enabled !== false;

  const suggestedQuestions = isLive
    ? [
        "What has been discussed so far?",
        "What decisions or action items have we mentioned?",
        "Summarize the last few points for someone who joined late.",
      ]
    : [
        "What were the main outcomes of this meeting?",
        "List action items and who owns them if stated.",
        "What should I follow up on after this session?",
      ];

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
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/40 to-brand-100/40 px-5 py-4 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="rounded-full bg-brand-100 p-1.5 text-brand-700">
            <Bot className="h-4 w-4" />
          </div>
          <p className="text-sm font-semibold text-brand-900">GRE Assistant</p>
          {isLive && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              In meeting
            </span>
          )}
        </div>
        <p className="mt-2.5 text-sm leading-relaxed text-brand-900/80">
          {isLive
            ? "GRE Assistant joins every live session, captures notes from the archive chat, and answers questions during the meeting."
            : "Ask questions about the meeting minutes, summary, and saved transcript."}
        </p>
      </div>

      {isLive && liveNotes && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live notes</p>
          <div className="mt-2 max-h-44 overflow-y-auto rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <FormattedAssistantText content={liveNotes} />
          </div>
        </div>
      )}

      {!isLive && minutesText && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Meeting minutes
          </p>
          <div className="mt-2 max-h-48 overflow-y-auto rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <FormattedAssistantText content={minutesText} />
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="max-h-60 space-y-3 overflow-y-auto rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
          {history.map((turn, index) => (
            <div
              key={`${turn.role}-${index}`}
              className={
                turn.role === "user"
                  ? "rounded-2xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800"
                  : "rounded-2xl border border-brand-100 bg-brand-50/40 px-3.5 py-2.5 text-sm text-slate-700"
              }
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {turn.role === "user" ? "You" : "GRE Assistant"}
              </p>
              <div className="mt-1">
                <FormattedAssistantText content={turn.content} />
              </div>
            </div>
          ))}
          {askMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2.5">
        {suggestedQuestions.map((item) => (
          <button
            key={item}
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-700"
            onClick={() => handleAsk(item)}
            disabled={askMutation.isPending}
          >
            {item}
          </button>
        ))}
      </div>

      <form
        className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          handleAsk();
        }}
      >
        <Textarea
          label={isLive ? "Ask during the meeting" : "Ask about the minutes"}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder={
            isLive
              ? "What did we decide about the next experiment?"
              : "What action items were assigned in this meeting?"
          }
          rows={compact ? 2 : 3}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!question.trim()}
            loading={askMutation.isPending}
            className="rounded-xl px-5 py-2.5"
          >
            <Sparkles className="h-4 w-4" />
            Ask GRE Assistant
          </Button>
        </div>
      </form>
    </div>
  );
}
