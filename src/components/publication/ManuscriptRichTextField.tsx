import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { RichTextEditor } from "../editor/RichTextEditor";
import { ManuscriptContent } from "./ManuscriptContent";

type ManuscriptRichTextFieldProps = {
  label: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  required?: boolean;
  hint?: string;
};

export function ManuscriptRichTextField({
  label,
  value,
  onChange,
  placeholder,
  minHeight,
  required,
  hint,
}: ManuscriptRichTextFieldProps) {
  const [previewOpen, setPreviewOpen] = useState(true);

  return (
    <div className="space-y-2">
      <RichTextEditor
        label={label}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minHeight={minHeight}
        required={required}
        hint={hint}
      />
      {value.trim() ? (
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/60">
          <button
            type="button"
            onClick={() => setPreviewOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:bg-slate-100/80"
          >
            <span>Formatted preview</span>
            {previewOpen ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          {previewOpen ? (
            <div className="border-t border-slate-200/90 px-4 py-4">
              <ManuscriptContent value={value} />
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
