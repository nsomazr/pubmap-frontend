import { Copy, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Props {
  body: string;
  deleted: boolean;
  mine: boolean;
  timeLabel: string;
  deletePending: boolean;
  onCopy: () => void;
  onDelete: () => void;
}

export function MessageThreadBubble({
  body,
  deleted,
  mine,
  timeLabel,
  deletePending,
  onCopy,
  onDelete,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [menuOpen]);

  return (
    <div
      className={`group/message flex w-full ${mine ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[min(100%,20rem)] flex-col gap-1 sm:max-w-[min(100%,24rem)] ${
          mine ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`flex items-end gap-1.5 ${mine ? "flex-row-reverse" : "flex-row"}`}
        >
          {deleted ? (
            <div
              className={`max-w-full rounded-2xl border border-dashed px-3.5 py-2.5 text-sm italic sm:px-4 ${
                mine
                  ? "border-brand-200/80 bg-brand-50/90 text-brand-800/70"
                  : "border-slate-200 bg-slate-100/90 text-slate-500"
              }`}
            >
              This message was deleted
            </div>
          ) : (
            <>
              <div
                className={`min-w-0 max-w-full px-3.5 py-2.5 text-[15px] leading-relaxed break-words sm:px-4 ${
                  mine
                    ? "rounded-2xl rounded-br-md bg-brand-600 text-white shadow-sm shadow-brand-600/15"
                    : "rounded-2xl rounded-bl-md border border-slate-200/70 bg-white text-slate-800 shadow-sm"
                }`}
              >
                {body}
              </div>

              {/* Desktop: icon actions beside the bubble */}
              <div
                className="hidden shrink-0 flex-col justify-center gap-0.5 pb-0.5 sm:flex [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/message:opacity-100 [@media(hover:hover)]:group-focus-within/message:opacity-100"
                role="toolbar"
                aria-label="Message actions"
              >
                <button
                  type="button"
                  onClick={onCopy}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm"
                  aria-label="Copy message"
                  title="Copy"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  disabled={deletePending}
                  onClick={onDelete}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40"
                  aria-label="Delete message"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Mobile: compact menu beside the bubble */}
              <div ref={menuRef} className="relative shrink-0 sm:hidden">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-600 shadow-sm ${
                    menuOpen ? "ring-2 ring-brand-200" : ""
                  }`}
                  aria-label="Message options"
                  aria-expanded={menuOpen}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div
                    className={`absolute top-1/2 z-20 min-w-[9.5rem] -translate-y-1/2 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg ${
                      mine ? "right-full mr-1.5" : "left-full ml-1.5"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onCopy();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      <Copy className="h-4 w-4 shrink-0" />
                      Copy
                    </button>
                    <button
                      type="button"
                      disabled={deletePending}
                      onClick={() => {
                        onDelete();
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4 shrink-0" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <span className="px-1 text-[10px] tabular-nums text-slate-400">{timeLabel}</span>
      </div>
    </div>
  );
}
