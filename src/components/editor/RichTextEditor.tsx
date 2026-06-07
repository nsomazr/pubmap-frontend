import { useEffect, useId, useRef, type CSSProperties } from "react";
import { loadCkEditor } from "../../lib/ckeditorLoader";
import {
  countWords,
  truncateHtmlToWordLimit,
  truncateHtmlToWordLimitAtSentence,
  type ManuscriptLimitedField,
} from "../../lib/manuscriptFieldLimits";
import { RequiredMark } from "../ui/RequiredField";

interface Props {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  required?: boolean;
  maxWords?: number;
  /** When set, enforces sentence-aware trimming for narrative GRE sections. */
  narrativeField?: ManuscriptLimitedField;
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 176,
  required,
  maxWords,
  narrativeField,
}: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Awaited<ReturnType<NonNullable<typeof window.ClassicEditor>["create"]>> | null>(
    null
  );
  const onChangeRef = useRef(onChange);
  const maxWordsRef = useRef(maxWords);
  const valueRef = useRef(value);
  const id = useId();

  onChangeRef.current = onChange;
  maxWordsRef.current = maxWords;
  valueRef.current = value;

  const wordCount = countWords(value);
  const overLimit = Boolean(maxWords && wordCount > maxWords);

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

      // Use the freshest controlled value in case data arrived before editor init completed.
      editor.setData(valueRef.current || "");
      editor.model.document.on("change:data", () => {
        let next = editor.getData();
        const limit = maxWordsRef.current;
        if (limit && countWords(next) > limit) {
          next = narrativeField
            ? truncateHtmlToWordLimitAtSentence(next, limit)
            : truncateHtmlToWordLimit(next, limit);
          if (next !== editor.getData()) {
            editor.setData(next);
          }
        }
        onChangeRef.current(next);
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
          {required ? <RequiredMark /> : null}
        </label>
        {maxWords ? (
          <p className={`text-xs text-slate-500 ${overLimit ? "font-medium text-amber-700" : ""}`}>
            {wordCount}/{maxWords} words
          </p>
        ) : null}
      </div>
      <div className="gre-manuscript-editor-shell overflow-hidden rounded-xl border border-slate-200/90 bg-white transition gre-field-composer focus-within:border-brand-400 focus-within:ring-0">
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
