import { Bot, Loader2, RotateCcw, Send, Sparkles, X } from "lucide-react";
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
  text: "Hi, I'm GRE Assistant. I can answer from live GRE data: categories, geology subcategories, published studies on the map, forum topics, and events, plus how to publish and use the platform.",
};

export function GreAssistant() {
  const location = useLocation();
  const hideOnPublicationChat = /\/publication\/\d+\/chat\/?$/.test(location.pathname);
  const isMapLanding = location.pathname === "/";
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
  const fabBottomClass = isMapLanding
    ? "bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] sm:bottom-[calc(env(safe-area-inset-bottom)+4.5rem)]"
    : "bottom-6 sm:bottom-8";
  const panelBottomClass = isMapLanding
    ? "bottom-[calc(env(safe-area-inset-bottom)+5rem)] sm:bottom-[calc(env(safe-area-inset-bottom)+4.25rem)]"
    : "bottom-4 sm:bottom-6";

  const clearChat = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
    setError("");
    setInput("");
    setMessages([INITIAL_MESSAGE]);
  };

  if (hideOnPublicationChat) {
    return null;
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`gre-assistant-fab fixed right-4 z-[1100] flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-brand-600 to-teal-600 text-white shadow-lg shadow-brand-600/30 transition hover:scale-[1.02] hover:shadow-xl ${fabBottomClass} sm:right-8 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-3 sm:text-sm sm:font-bold`}
          aria-label="Open GRE Assistant"
        >
          <Sparkles className="h-5 w-5" />
          <span className="hidden sm:inline">GRE Assistant</span>
        </button>
      )}

      {open && (
        <div
          className={`gre-assistant-panel fixed left-4 right-4 z-[1100] mx-auto flex max-w-[380px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/90 ${panelBottomClass} sm:left-auto sm:right-6 sm:mx-0 sm:w-[min(100vw-2rem,380px)]`}
          role="dialog"
          aria-label="GRE Assistant"
        >
          <header className="flex items-center justify-between gap-2 border-b border-slate-100 bg-gradient-to-r from-brand-600 to-teal-600 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-bold">GRE Assistant</p>
                <p className="text-[10px] text-white/80">
                  {health === null
                    ? "Checking…"
                    : health.available
                      ? `Online · ${health.provider ?? "AI"}${health.model ? ` (${health.model})` : ""}`
                      : health.hint ?? "Offline. Check API GROQ_API_KEY"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChat}
                disabled={!canClear}
                className="rounded-lg p-1.5 text-white/90 hover:bg-white/15 disabled:opacity-40"
                aria-label="Clear chat"
                title="Clear chat"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 hover:bg-white/15"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="max-h-[min(50vh,320px)] flex-1 space-y-3 overflow-y-auto p-3">
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
            <div className="flex flex-wrap gap-1.5 border-t border-slate-100 px-3 py-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700"
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

          {canClear && (
            <div className="border-t border-slate-100 px-3 py-1.5">
              <button
                type="button"
                onClick={clearChat}
                className="text-xs font-medium text-slate-500 hover:text-brand-700"
              >
                Clear chat
              </button>
            </div>
          )}

          <form
            className="flex gap-2 border-t border-slate-100 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask GRE Assistant…"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
