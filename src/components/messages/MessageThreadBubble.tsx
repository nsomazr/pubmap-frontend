import { Copy, Download, FileText, MoreVertical, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface AttachmentInfo {
  name: string;
}

interface Props {
  body: string;
  attachment?: AttachmentInfo | null;
  deleted: boolean;
  mine: boolean;
  timeLabel: string;
  deletePending: boolean;
  onCopy: () => void;
  onDelete: () => void;
  onDownloadAttachment?: () => void;
}

export function MessageThreadBubble({
  body,
  attachment,
  deleted,
  mine,
  timeLabel,
  deletePending,
  onCopy,
  onDelete,
  onDownloadAttachment,
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

  const actionToolbar = !deleted && (body || attachment) && (
    <>
      <div
        className="hidden shrink-0 items-center gap-0.5 sm:flex [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/message:opacity-100"
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

      <div ref={menuRef} className="relative shrink-0 sm:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium text-slate-600 hover:bg-slate-100 ${
            menuOpen ? "bg-slate-100 text-ink" : ""
          }`}
          aria-label="Message options"
          aria-expanded={menuOpen}
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div
            className={`absolute bottom-full z-20 mb-1 min-w-[9.5rem] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg ${
              mine ? "right-0" : "left-0"
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
  );

  return (
    <div
      className={`group/message flex w-full ${mine ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[min(100%,20rem)] flex-col gap-1 sm:max-w-[min(100%,24rem)] ${
          mine ? "items-end" : "items-start"
        }`}
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
          <div
            className={`min-w-0 max-w-full px-3.5 py-2.5 text-[15px] leading-relaxed break-words sm:px-4 ${
              mine
                ? "rounded-2xl rounded-br-md bg-brand-600 text-white shadow-sm shadow-brand-600/15"
                : "rounded-2xl rounded-bl-md border border-slate-200/70 bg-white text-slate-800 shadow-sm"
            }`}
          >
            {attachment && (
              <button
                type="button"
                onClick={onDownloadAttachment}
                className={`mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-medium ring-1 ${
                  mine
                    ? "bg-white/10 text-white ring-white/20 hover:bg-white/15"
                    : "bg-slate-50 text-slate-700 ring-slate-200/80 hover:bg-slate-100"
                }`}
              >
                <FileText className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
                <Download className="h-4 w-4 shrink-0 opacity-80" />
              </button>
            )}
            {body ? <div className="whitespace-pre-wrap">{body}</div> : null}
          </div>
        )}

        <div
          className={`flex w-full items-center gap-2 px-0.5 ${
            mine ? "justify-end" : "justify-start"
          }`}
        >
          <span className="text-[10px] tabular-nums text-slate-400">{timeLabel}</span>
          {actionToolbar}
        </div>
      </div>
    </div>
  );
}
