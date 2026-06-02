import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface Props {
  open: boolean;
  onClose: () => void;
  src: string;
  alt?: string;
  children?: ReactNode;
}

/** Full-viewport figure zoom. Portaled to document.body so fixed centering works inside transformed ancestors. */
export function FigureLightbox({ open, onClose, src, alt = "Figure", children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !src) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10300] flex items-center justify-center bg-slate-900/85 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Figure preview"
    >
      <div
        className="relative flex max-h-[min(92vh,880px)] w-full max-w-[min(96vw,52rem)] flex-col overflow-hidden rounded-xl bg-slate-900/40 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute right-3 top-3 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/55"
          onClick={onClose}
          aria-label="Close preview"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4 pt-12">
          <img
            src={src}
            alt={alt}
            loading="eager"
            decoding="async"
            className="mx-auto max-h-[min(68vh,640px)] max-w-full object-contain"
          />
        </div>
        {children ? (
          <div className="shrink-0 border-t border-white/10 px-4 py-3 text-center text-sm text-white/95">
            {children}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
