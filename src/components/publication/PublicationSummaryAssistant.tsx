import { Loader2, MessageCircle, Send, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import {
  assistantSummarizeFollowUpStream,
  assistantSummarizePublicationStream,
  type SummaryFollowUpTurn,
} from "../../lib/assistant";
import { FormattedAssistantText } from "../../lib/formatAssistantText";

type FollowUpItem = {
  id: string;
  question: string;
  answer: string;
  loading: boolean;
  error?: string;
};

interface Props {
  publicationId: number;
  autoGenerate?: boolean;
  layout?: "page" | "dock";
  className?: string;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

export function PublicationSummaryAssistant({
  publicationId,
  autoGenerate = false,
  layout = "page",
  className = "",
  scrollContainerRef,
}: Props) {
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [question, setQuestion] = useState("");
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const summaryAbortRef = useRef<AbortController | null>(null);
  const followUpAbortRef = useRef<AbortController | null>(null);

  const runSummary = useCallback(() => {
    summaryAbortRef.current?.abort();
    followUpAbortRef.current?.abort();
    setSummary("");
    setSummaryError("");
    setFollowUps([]);
    setQuestion("");
    setSummaryLoading(true);

    const controller = new AbortController();
    summaryAbortRef.current = controller;

    assistantSummarizePublicationStream(
      publicationId,
      {
        onToken: (token) => setSummary((current) => current + token),
        onError: (message) => setSummaryError(message),
        onDone: () => setSummaryLoading(false),
      },
      controller.signal
    ).catch((err: Error) => {
      if (err.name === "AbortError") return;
      setSummaryError(err.message || "Summary unavailable.");
      setSummaryLoading(false);
    });
  }, [publicationId]);

  useEffect(() => {
    summaryAbortRef.current?.abort();
    followUpAbortRef.current?.abort();
    setSummary("");
    setSummaryError("");
    setFollowUps([]);
    setQuestion("");
    setSummaryLoading(false);
    setFollowUpLoading(false);

    if (autoGenerate) {
      runSummary();
    }
  }, [publicationId, autoGenerate, runSummary]);

  useEffect(() => {
    const container = scrollContainerRef?.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [summary, followUps, scrollContainerRef]);

  const askFollowUp = async (event?: React.FormEvent) => {
    event?.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || !summary.trim() || summaryLoading || followUpLoading) return;

    followUpAbortRef.current?.abort();
    const itemId = `${Date.now()}`;
    setFollowUps((items) => [
      ...items,
      { id: itemId, question: trimmed, answer: "", loading: true },
    ]);
    setQuestion("");
    setFollowUpLoading(true);

    const history: SummaryFollowUpTurn[] = followUps.flatMap((item) => {
      const turns: SummaryFollowUpTurn[] = [{ role: "user", content: item.question }];
      if (item.answer.trim()) {
        turns.push({ role: "assistant", content: item.answer });
      }
      return turns;
    });

    const controller = new AbortController();
    followUpAbortRef.current = controller;

    try {
      await assistantSummarizeFollowUpStream(
        publicationId,
        trimmed,
        {
          onToken: (token) => {
            setFollowUps((items) =>
              items.map((item) =>
                item.id === itemId ? { ...item, answer: item.answer + token } : item
              )
            );
          },
          onError: (message) => {
            setFollowUps((items) =>
              items.map((item) =>
                item.id === itemId ? { ...item, loading: false, error: message } : item
              )
            );
            setFollowUpLoading(false);
          },
          onDone: () => {
            setFollowUps((items) =>
              items.map((item) => (item.id === itemId ? { ...item, loading: false } : item))
            );
            setFollowUpLoading(false);
          },
        },
        { summary, history, signal: controller.signal }
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setFollowUps((items) =>
        items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                loading: false,
                error: (err as Error).message || "Could not answer follow-up.",
              }
            : item
        )
      );
      setFollowUpLoading(false);
    }
  };

  const canAskFollowUp = Boolean(summary.trim()) && !summaryLoading && !followUpLoading;
  const isDock = layout === "dock";
  const isPage = layout === "page";

  const followUpForm = (
    <form onSubmit={askFollowUp} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="min-w-0 flex-1">
        <span className="sr-only">Ask a follow-up question</span>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about authors, methods, findings…"
          disabled={!canAskFollowUp}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-slate-50 disabled:text-slate-400"
        />
      </label>
      <button
        type="submit"
        disabled={!canAskFollowUp || !question.trim()}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {followUpLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Ask
      </button>
    </form>
  );

  const followUpThread = followUps.map((item) => (
    <div key={item.id} className="space-y-2.5">
      <div className="flex justify-end">
        <p className="max-w-[92%] rounded-2xl rounded-br-md bg-brand-600 px-3.5 py-2.5 text-sm leading-relaxed text-white">
          {item.question}
        </p>
      </div>
      {item.error ? (
        <div className="space-y-2">
          <p className="rounded-xl bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900 ring-1 ring-amber-100">
            {item.error}
          </p>
          <button
            type="button"
            onClick={() => {
              setFollowUps((items) =>
                items.map((row) =>
                  row.id === item.id ? { ...row, error: undefined, loading: false, answer: "" } : row
                )
              );
              setQuestion(item.question);
            }}
            className="text-xs font-semibold text-brand-700 hover:text-brand-800"
          >
            Retry this question
          </button>
        </div>
      ) : (
        <div className="flex gap-2.5">
          <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <Sparkles className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-sm leading-relaxed text-slate-800 ring-1 ring-slate-200/80">
            <FormattedAssistantText content={item.answer} streaming={item.loading} />
          </div>
        </div>
      )}
    </div>
  ));

  if (isPage) {
    return (
      <div className={`publication-chat flex min-h-[min(68dvh,720px)] flex-col ${className}`}>
        <div ref={scrollContainerRef} className="flex-1 space-y-5 overflow-y-auto pr-1">
          {summaryError ? (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-100">
              {summaryError}
            </p>
          ) : !summary && summaryLoading ? (
            <div className="flex gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="rounded-2xl rounded-tl-md bg-brand-50/70 px-4 py-3 ring-1 ring-brand-100">
                <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating summary…
                </span>
              </div>
            </div>
          ) : summary ? (
            <div className="flex gap-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Sparkles className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-brand-50/70 px-4 py-3.5 ring-1 ring-brand-100">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  Summary
                </p>
                <FormattedAssistantText content={summary} streaming={summaryLoading} />
              </div>
            </div>
          ) : null}

          {followUpThread}
        </div>

        <div className="mt-4 border-t border-slate-100 pt-4">
          {!summary.trim() && !summaryLoading && (
            <p className="mb-3 text-xs text-slate-500">Waiting for the summary before you can ask follow-ups.</p>
          )}
          {(summary.trim() || followUps.length > 0) && !summaryLoading && (
            <div className="space-y-3">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                <MessageCircle className="h-3.5 w-3.5" />
                Follow-up questions
              </p>
              {followUpForm}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        {summaryError ? (
          <p className="text-sm text-amber-800">{summaryError}</p>
        ) : !summary && summaryLoading ? (
          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Generating summary…
          </span>
        ) : (
          <FormattedAssistantText content={summary} streaming={summaryLoading} />
        )}
      </div>

      {(summary.trim() || followUps.length > 0) && !summaryLoading && (
        <div className={`space-y-3 ${isDock ? "border-t border-slate-100 pt-3" : "border-t border-brand-100 pt-4"}`}>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-600">
            <MessageCircle className="h-3.5 w-3.5" />
            Follow-up questions
          </p>
          {followUpThread}
          {followUpForm}
        </div>
      )}
    </div>
  );
}
