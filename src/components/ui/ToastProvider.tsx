import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastInput = {
  title: string;
  description?: string;
};

type ToastContextValue = {
  show: (input: ToastInput & { tone?: ToastTone }) => void;
  success: (input: ToastInput) => void;
  error: (input: ToastInput) => void;
  info: (input: ToastInput) => void;
  /** Error-style feedback anchored on the left (same as `error`). */
  alert: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<
  ToastTone,
  { icon: typeof CheckCircle2; shell: string; iconClass: string }
> = {
  success: {
    icon: CheckCircle2,
    shell: "border-emerald-200 bg-white",
    iconClass: "text-emerald-600",
  },
  error: {
    icon: AlertCircle,
    shell: "border-red-200 bg-white",
    iconClass: "text-red-600",
  },
  info: {
    icon: Info,
    shell: "border-brand-200 bg-white",
    iconClass: "text-brand-600",
  },
};

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const style = toneStyles[toast.tone];
  const Icon = style.icon;
  return (
    <div
      className={`pointer-events-auto w-full rounded-2xl border p-4 shadow-xl ring-1 ring-slate-100 ${style.shell}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconClass}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{toast.title}</p>
          {toast.description && (
            <p className="mt-1 text-sm leading-relaxed text-slate-500">{toast.description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextIdRef = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    ({ title, description, tone = "info" }: ToastInput & { tone?: ToastTone }) => {
      const id = nextIdRef.current++;
      setToasts((current) => [...current, { id, title, description, tone }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (input) => show({ ...input, tone: "success" }),
      error: (input) => show({ ...input, tone: "error" }),
      info: (input) => show({ ...input, tone: "info" }),
      alert: (input) => show({ ...input, tone: "error" }),
    }),
    [show]
  );

  const centerToasts = toasts.filter((t) => t.tone !== "error");
  const leftAlerts = toasts.filter((t) => t.tone === "error");

  return (
    <ToastContext.Provider value={value}>
      {children}
      {typeof document !== "undefined" && centerToasts.length > 0
        ? createPortal(
            <div
              className="pointer-events-none fixed inset-0 z-[10100] flex flex-col items-center justify-center gap-3 p-4"
              aria-label="Notifications"
            >
              <div className="flex w-full max-w-sm flex-col gap-3">
                {centerToasts.map((toast) => (
                  <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
                ))}
              </div>
            </div>,
            document.body
          )
        : null}
      {typeof document !== "undefined" && leftAlerts.length > 0
        ? createPortal(
            <div
              className="pointer-events-none fixed left-4 top-1/2 z-[10100] flex w-[min(92vw,22rem)] -translate-y-1/2 flex-col gap-3 sm:left-6"
              aria-label="Alerts"
            >
              {leftAlerts.map((toast) => (
                <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
              ))}
            </div>,
            document.body
          )
        : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider.");
  }
  return context;
}
