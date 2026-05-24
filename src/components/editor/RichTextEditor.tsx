import { useEffect, useId, useRef, type CSSProperties } from "react";
import { loadCkEditor } from "../../lib/ckeditorLoader";

interface Props {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  required?: boolean;
  hint?: string;
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 176,
  required,
  hint,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Awaited<ReturnType<NonNullable<typeof window.ClassicEditor>["create"]>> | null>(
    null
  );
  const onChangeRef = useRef(onChange);
  const id = useId();

  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadCkEditor();
      } catch {
        return;
      }
      if (cancelled || !hostRef.current || !window.ClassicEditor) return;

      const editor = await window.ClassicEditor.create(hostRef.current, {
        placeholder,
        toolbar: [
          "heading",
          "|",
          "bold",
          "italic",
          "link",
          "bulletedList",
          "numberedList",
          "|",
          "undo",
          "redo",
        ],
      });

      if (cancelled) {
        await editor.destroy();
        return;
      }

      editor.setData(value || "");
      editor.model.document.on("change:data", () => {
        onChangeRef.current(editor.getData());
      });
      editorRef.current = editor;
    })();

    return () => {
      cancelled = true;
      const ed = editorRef.current;
      editorRef.current = null;
      ed?.destroy().catch(() => {});
    };
  }, [placeholder]);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const current = ed.getData();
    if ((value || "") !== current) {
      ed.setData(value || "");
    }
  }, [value]);

  return (
    <div className="gre-manuscript-field space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
          {required && (
            <span className="ml-1 text-xs font-bold uppercase tracking-wide text-red-500">
              Required
            </span>
          )}
        </label>
        {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      </div>
      <div className="gre-manuscript-editor-shell overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100/90">
        <div
          id={id}
          ref={hostRef}
          className="gre-ckeditor-host gre-manuscript-ckeditor"
          style={{ "--gre-editor-min-height": `${minHeight}px` } as CSSProperties}
        />
      </div>
    </div>
  );
}
