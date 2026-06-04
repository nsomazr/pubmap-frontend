import { useEffect, useId, useRef, type CSSProperties } from "react";
import { loadCkEditor } from "../../lib/ckeditorLoader";
import { countWords, truncateHtmlToWordLimit } from "../../lib/manuscriptFieldLimits";
import { RequiredMark } from "../ui/RequiredField";

interface Props {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  required?: boolean;
  maxWords?: number;
  /** Minimum words (e.g. 60% of registry cap). */
  minWords?: number;
  /** Soft maximum before registry cap (e.g. 95% of cap). */
  bandMaxWords?: number;
}

export function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  minHeight = 176,
  required,
  maxWords,
  minWords,
  bandMaxWords,
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
  const registryCap = maxWords ?? 0;
  const bandMax = bandMaxWords ?? registryCap;
  const overRegistryCap = Boolean(registryCap && wordCount > registryCap);
  const belowBand = Boolean(minWords && wordCount > 0 && wordCount < minWords);
  const aboveBand = Boolean(bandMax && wordCount > bandMax);

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
          next = truncateHtmlToWordLimit(next, limit);
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
        {registryCap ? (
          <div className="flex flex-col items-end gap-0.5 text-xs text-slate-500">
            <p
              className={
                overRegistryCap || belowBand || aboveBand
                  ? "font-medium text-amber-700"
                  : undefined
              }
            >
              {wordCount}/{registryCap} words
            </p>
            {minWords && bandMax ? (
              <p className={belowBand || aboveBand ? "font-medium text-amber-700" : undefined}>
                Target {minWords}–{bandMax} words
              </p>
            ) : null}
          </div>
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
