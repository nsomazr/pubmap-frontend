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
    <div className={compact ? "space-y-3" : "space-y-4"}>
      <div className="flex items-center gap-2">
        <Bot className="h-4 w-4 text-brand-700" />
        <p className="text-sm font-semibold text-ink">GRE Assistant</p>
        {isLive && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
            Live
          </span>
        )}
      </div>

      {isLive && liveNotes && (
        <div className="rounded-xl bg-slate-50/70 p-3">
          <p className="text-xs font-semibold text-slate-500">Live notes</p>
          <div className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <FormattedAssistantText content={liveNotes} />
          </div>
        </div>
      )}

      {!isLive && minutesText && (
        <div className="rounded-xl bg-slate-50/70 p-3">
          <p className="text-xs font-semibold text-slate-500">Minutes</p>
          <div className="mt-2 max-h-44 overflow-y-auto rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <FormattedAssistantText content={minutesText} />
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl bg-slate-50/70 p-3">
          {history.map((turn, index) => (
            <div
              key={`${turn.role}-${index}`}
              className={`flex ${turn.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${
                  turn.role === "user"
                    ? "rounded-br-md bg-emerald-100 text-emerald-950"
                    : "rounded-bl-md bg-white text-slate-800"
                }`}
              >
                <p
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    turn.role === "user" ? "text-emerald-800/80" : "text-slate-400"
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
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking…
            </div>
          )}
        </div>
      )}

      {history.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((item) => (
            <button
              key={item}
              type="button"
              className="h-9 rounded-lg bg-white/90 px-3.5 text-xs font-medium text-slate-700 transition hover:bg-brand-50/60 hover:text-brand-700"
              onClick={() => handleAsk(item)}
              disabled={askMutation.isPending}
            >
              {item}
            </button>
          ))}
        </div>
      )}

      <form
        className="space-y-3 rounded-xl bg-slate-50/70 p-3"
        onSubmit={(event) => {
          event.preventDefault();
          handleAsk();
        }}
      >
        <Textarea
          label="Ask"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question..."
          rows={2}
          className="min-h-[4rem]"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!question.trim()}
            loading={askMutation.isPending}
            className="h-10 min-w-[92px]"
          >
            <Sparkles className="h-4 w-4" />
            Ask
          </Button>
        </div>
      </form>
    </div>
  );
}
