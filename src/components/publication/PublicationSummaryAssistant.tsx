import { Loader2, MessageCircle, Sparkles } from "lucide-react";
import { InputWithSendAddon } from "../ui/FieldSendAddon";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import {
  assistantHealth,
  assistantSummarizeFollowUpStream,
  assistantSummarizePublicationStream,
  type SummaryFollowUpTurn,
} from "../../lib/assistant";
import { formatGrePaperTitle } from "../../lib/grePaperTitle";
import { FormattedAssistantText } from "../../lib/formatAssistantText";
import { buildPublicationPath } from "../../lib/publicationPaths";
import { buildPublicationFollowUpSuggestions } from "../../lib/publicationFollowUpSuggestions";
import type { Publication } from "../../types";
import { PublicationSummaryActions } from "./PublicationSummaryActions";

type FollowUpItem = {
  id: string;
  question: string;
  answer: string;
  loading: boolean;
  error?: string;
};

interface Props {
  publicationId: number;
  publication?: Publication | null;
  autoGenerate?: boolean;
  layout?: "page" | "dock";
  className?: string;
  scrollContainerRef?: RefObject<HTMLDivElement | null>;
}

export function PublicationSummaryAssistant({
  publicationId,
  publication = null,
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

  const runSummary = useCallback(async () => {
    summaryAbortRef.current?.abort();
    followUpAbortRef.current?.abort();
    setSummary("");
    setSummaryError("");
    setFollowUps([]);
    setQuestion("");
    setSummaryLoading(true);

    const health = await assistantHealth();
    if (!health.available) {
      setSummaryError(
        health.hint || health.error || "GRE Assistant is not available right now."
      );
      setSummaryLoading(false);
      return;
    }

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

  const suggestedQuestions = useMemo(
    () => buildPublicationFollowUpSuggestions(publication),
    [publication]
  );

  const askedQuestions = useMemo(
    () => new Set(followUps.map((item) => item.question.trim().toLowerCase())),
    [followUps]
  );

  const visibleSuggestions = suggestedQuestions.filter(
    (suggestion) => !askedQuestions.has(suggestion.trim().toLowerCase())
  );

  const submitFollowUp = async (questionText: string) => {
    const trimmed = questionText.trim();
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

  const askFollowUp = (event?: React.FormEvent) => {
    event?.preventDefault();
    void submitFollowUp(question);
  };

  const canAskFollowUp = Boolean(summary.trim()) && !summaryLoading && !followUpLoading;
  const isDock = layout === "dock";
  const isPage = layout === "page";

  const publicationHref = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${buildPublicationPath(publicationId, publication?.encoded_id)}`;
  }, [publicationId, publication?.encoded_id]);

  const publicationTitle = useMemo(
    () =>
      publication
        ? formatGrePaperTitle(publication.title, publication.short_number)
        : undefined,
    [publication]
  );

  const summaryActions =
    summary.trim() && !summaryLoading ? (
      <PublicationSummaryActions
        publicationId={publicationId}
        summary={summary}
        publicationTitle={publicationTitle}
        publicationHref={publicationHref}
        onRegenerate={() => void runSummary()}
        regenerating={summaryLoading}
      />
    ) : null;

  const suggestionChips =
    visibleSuggestions.length > 0 ? (
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {visibleSuggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            disabled={!canAskFollowUp}
            onClick={() => void submitFollowUp(suggestion)}
            className="rounded-full bg-slate-100 px-2.5 py-1.5 text-left text-[11px] font-medium leading-snug text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-xs"
          >
            {suggestion}
          </button>
        ))}
      </div>
    ) : null;

  const followUpForm = (
    <InputWithSendAddon
      value={question}
      onChange={setQuestion}
      onSubmit={() => askFollowUp()}
      placeholder="Ask about authors, methods, findings…"
      disabled={!canAskFollowUp}
      loading={followUpLoading}
      submitAriaLabel="Ask follow-up question"
    />
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
      <div className={`publication-chat flex min-h-0 flex-1 flex-col ${className}`}>
        <div
          ref={scrollContainerRef}
          className="publication-chat__thread min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1 sm:space-y-4"
        >
          {summaryError ? (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3.5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                Summary
              </p>
              <p className="text-sm text-amber-900">{summaryError}</p>
              <button
                type="button"
                onClick={() => void runSummary()}
                className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50"
              >
                Try again
              </button>
            </div>
          ) : !summary && summaryLoading ? (
            <div className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                Summary
              </p>
              <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating summary…
              </span>
            </div>
          ) : summary ? (
            <div className="min-w-0 rounded-2xl border border-slate-200/80 bg-white px-4 py-3.5 shadow-sm">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                Summary
              </p>
              <div className="text-sm leading-relaxed text-slate-800">
                <FormattedAssistantText content={summary} streaming={summaryLoading} />
              </div>
              {summaryActions}
            </div>
          ) : null}

          {followUpThread}
        </div>

        <div className="publication-chat__composer mt-3 shrink-0 border-t border-slate-100 bg-white pt-3">
          {(summary.trim() || followUps.length > 0) && !summaryLoading && (
            <div className="space-y-2.5">
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-600">
                <MessageCircle className="h-3.5 w-3.5" />
                Follow-up questions
              </p>
              {suggestionChips && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500">Suggested questions</p>
                  {suggestionChips}
                </div>
              )}
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
          <>
            <FormattedAssistantText content={summary} streaming={summaryLoading} />
            {summaryActions}
          </>
        )}
      </div>

      {(summary.trim() || followUps.length > 0) && !summaryLoading && (
        <div className={`space-y-3 ${isDock ? "border-t border-slate-100 pt-3" : "border-t border-brand-100 pt-4"}`}>
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-600">
            <MessageCircle className="h-3.5 w-3.5" />
            Follow-up questions
          </p>
          {suggestionChips && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">Suggested questions</p>
              {suggestionChips}
            </div>
          )}
          {followUpThread}
          {followUpForm}
        </div>
      )}
    </div>
  );
}
