import { useEffect, useId, useRef } from "react";
import { loadCkEditor } from "../../lib/ckeditorLoader";

interface Props {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  required?: boolean;
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 160,
  required,
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
    <div className="gre-rich-editor space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <div
        id={id}
        ref={hostRef}
        className="gre-ckeditor-host rounded-xl border border-slate-200 bg-white shadow-sm"
        style={{ minHeight }}
      />
    </div>
  );
}
