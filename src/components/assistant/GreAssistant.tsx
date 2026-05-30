import { Bot, Loader2, RotateCcw, Sparkles, X } from "lucide-react";
import { InputWithSendAddon } from "../ui/FieldSendAddon";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { assistantChatStream, assistantHealth } from "../../lib/assistant";
import { FormattedAssistantText } from "../../lib/formatAssistantText";

type Msg = { role: "user" | "assistant"; text: string; streaming?: boolean };

const STARTERS = [
  "What is Global Research Exchange?",
  "How do I publish research on the map?",
  "What geology subcategories does GRE use?",
];

const INITIAL_MESSAGE: Msg = {
  role: "assistant",
  text: "Ask about publications on the map, research categories, forum topics, or events.",
};

export function GreAssistant() {
  const location = useLocation();
  const hideOnPublicationChat = /\/publication\/[^/]+\/chat\/?$/.test(location.pathname);
  const messagesThreadOpen =
    location.pathname.startsWith("/dashboard/messages") &&
    Boolean(new URLSearchParams(location.search).get("partner"));
  const hideFab = hideOnPublicationChat || messagesThreadOpen;
  const isMapLanding = location.pathname === "/";
  const isDashboard = location.pathname.startsWith("/dashboard");
  const [open, setOpen] = useState(false);
  const [health, setHealth] = useState<{
    available: boolean;
    provider?: string | null;
    model?: string | null;
    hint?: string;
  } | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState<Msg[]>([INITIAL_MESSAGE]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open && health === null) {
      assistantHealth().then((h) =>
        setHealth({
          available: h.available,
          provider: h.engine ?? h.provider,
          model: h.model,
          hint: h.hint,
        })
      );
    }
  }, [open, health]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const appendToLastAssistant = (token: string) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === "assistant" && last.streaming) {
        next[next.length - 1] = { ...last, text: last.text + token };
      }
      return next;
    });
  };

  const send = async (text: string) => {
    const msg = text.trim();
    if (!msg || loading) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setError("");
    setInput("");
    setMessages((m) => [
      ...m,
      { role: "user", text: msg },
      { role: "assistant", text: "", streaming: true },
    ]);
    setLoading(true);

    try {
      await assistantChatStream(
        msg,
        {
          onToken: appendToLastAssistant,
          onDone: () => {
            setMessages((prev) => {
              const next = [...prev];
              const last = next[next.length - 1];
              if (last?.streaming) {
                next[next.length - 1] = { role: "assistant", text: last.text || " " };
              }
              return next;
            });
            setHealth((h) => (h ? { ...h, available: true } : { available: true }));
          },
          onError: (detail) => setError(detail),
        },
        undefined,
        controller.signal
      );
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      const detail =
        (err as Error).message ||
        "GRE Assistant is temporarily unavailable. Please try again in a moment.";
      setError(detail);
      setHealth((h) => (h ? { ...h, available: false } : { available: false }));
      setMessages((prev) => {
        const next = prev.filter((m) => !m.streaming);
        if (next[next.length - 1]?.role !== "assistant" || next[next.length - 1]?.text) {
          return next;
        }
        next.pop();
        return next;
      });
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const isStreaming = messages.some((m) => m.streaming);
  const canClear = messages.length > 1 || loading;
  const fabPlacementClass = isMapLanding
    ? "gre-assistant-fab--on-map"
    : isDashboard
      ? "gre-assistant-fab--on-dashboard"
      : "gre-assistant-fab--default";
  const panelPositionClass = isMapLanding
    ? "gre-assistant-panel--on-map"
    : "gre-assistant-panel--default bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[min(100vw-2rem,380px)]";

  useEffect(() => {
    if (!isMapLanding) return;
    const root = document.querySelector(".landing-page");
    if (!root) return;
    if (open) root.classList.add("landing-page--assistant-open");
    else root.classList.remove("landing-page--assistant-open");
    return () => root.classList.remove("landing-page--assistant-open");
  }, [open, isMapLanding]);

  const clearChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setError("");
    setInput("");
    setMessages([INITIAL_MESSAGE]);
  };

  if (hideFab) {
    return null;
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`gre-assistant-fab ${fabPlacementClass} fixed flex h-12 w-12 items-center justify-center rounded-full border border-brand-500/30 bg-brand-600 text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 hover:shadow-xl sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-3 sm:text-sm sm:font-bold`}
          aria-label="Open GRE Assistant"
        >
          <Sparkles className="h-5 w-5" />
          <span className="hidden sm:inline">GRE Assistant</span>
        </button>
      )}

      {open && (
        <div
          className={`gre-assistant-panel gre-dashboard-card fixed mx-auto w-auto max-w-[380px] overflow-hidden shadow-[0_12px_40px_-12px_rgba(15,23,42,0.2)] ${panelPositionClass}`}
          role="dialog"
          aria-label="GRE Assistant"
        >
          <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 bg-white px-4 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700 ring-1 ring-brand-100">
                <Bot className="h-4 w-4" />
              </span>
              <p className="truncate text-sm font-semibold text-ink">GRE Assistant</p>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={clearChat}
                disabled={!canClear}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink disabled:opacity-40"
                aria-label="Clear chat"
                title="Clear chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="gre-assistant-panel__thread space-y-3 p-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {m.role === "user" ? (
                    <p>{m.text}</p>
                  ) : (
                    <FormattedAssistantText
                      content={m.text}
                      streaming={m.streaming}
                      className={m.streaming ? "" : "!text-slate-800"}
                    />
                  )}
                </div>
              </div>
            ))}
            {loading && !isStreaming && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Thinking…
              </div>
            )}
          </div>

          {messages.length <= 1 && !loading && (
            <div className="gre-chat-suggestions shrink-0 border-t border-slate-100 px-3 py-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full bg-slate-100 px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="border-t border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {error}
            </p>
          )}

          <div className="shrink-0 border-t border-slate-100 bg-white p-3">
            <InputWithSendAddon
              value={input}
              onChange={setInput}
              onSubmit={() => send(input)}
              placeholder="Ask GRE Assistant…"
              loading={loading}
              disabled={loading}
              submitAriaLabel="Send message"
              className="[&_input]:shadow-none"
            />
          </div>
        </div>
      )}
    </>
  );
}
