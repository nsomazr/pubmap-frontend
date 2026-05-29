import { BookOpen } from "lucide-react";
import { useMemo } from "react";
import {
  REFERENCE_ITEM_LIMIT,
  limitReferences,
  parseReferenceItems,
} from "../../lib/manuscriptFieldLimits";
import { Textarea } from "../ui/Textarea";

interface Props {
  value: string;
  paperTitle: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ReferencesFromResearch({ value, paperTitle, onChange, disabled }: Props) {
  const formatted = useMemo(
    () => limitReferences(value, paperTitle),
    [value, paperTitle]
  );
  const items = useMemo(() => parseReferenceItems(formatted), [formatted]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-medium text-slate-700">Key references</label>
        <span className="text-[11px] font-medium text-slate-500">
          Research · max {REFERENCE_ITEM_LIMIT}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Enter up to {REFERENCE_ITEM_LIMIT} key citations yourself (including this paper). This field
        is not filled from manuscript extraction.
      </p>
      <Textarea
        label="References"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onChange(formatted)}
        rows={6}
        placeholder={`1. First key reference\n2. Second reference\n…\n${REFERENCE_ITEM_LIMIT}. ${paperTitle.trim() || "This paper"} (this paper)`}
        disabled={disabled}
      />
      <p className="text-xs text-slate-500">
        Numbered list, max {REFERENCE_ITEM_LIMIT} items. On blur, entries are trimmed to the limit.
      </p>
      {items.length > 0 ? (
        <ol className="list-decimal space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm leading-relaxed text-slate-800">
          {items.map((item, index) => (
            <li key={`${index}-${item.slice(0, 40)}`} className="pl-1">
              {item}
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5">
          <BookOpen className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          <p className="text-sm text-slate-600">
            Add the {REFERENCE_ITEM_LIMIT} references most important to your study.
          </p>
        </div>
      )}
    </div>
  );
}
