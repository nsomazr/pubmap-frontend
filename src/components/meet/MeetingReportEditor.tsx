import { useEffect, useId, useRef, type CSSProperties } from "react";
import { loadCkEditor } from "../../lib/ckeditorLoader";

const MEET_REPORT_TOOLBAR = [
  "heading",
  "|",
  "bold",
  "italic",
  "link",
  "|",
  "bulletedList",
  "numberedList",
  "|",
  "blockQuote",
  "|",
  "undo",
  "redo",
] as const;

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
};

export function MeetingReportEditor({
  value,
  onChange,
  placeholder = "Your meeting report will appear here after generation finishes.",
  disabled = false,
  minHeight = 320,
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
        toolbar: [...MEET_REPORT_TOOLBAR],
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
      if (disabled) {
        editor.enableReadOnlyMode("gre-meet-report");
      }
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
    if (disabled) {
      ed.enableReadOnlyMode("gre-meet-report");
    } else {
      ed.disableReadOnlyMode("gre-meet-report");
    }
  }, [disabled]);

  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    const current = ed.getData();
    if ((value || "") !== current) {
      ed.setData(value || "");
    }
  }, [value]);

  return (
    <div
      className={`gre-manuscript-editor-shell overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition gre-field-composer focus-within:border-brand-400 focus-within:ring-0 ${
        disabled ? "opacity-70" : ""
      }`}
    >
      <div
        id={id}
        ref={hostRef}
        className="gre-ckeditor-host gre-manuscript-ckeditor gre-meet-report-ckeditor"
        style={{ "--gre-editor-min-height": `${minHeight}px` } as CSSProperties}
        aria-disabled={disabled}
      />
    </div>
  );
}
