import { BookOpen } from "lucide-react";
import { useMemo } from "react";
import {
  REFERENCE_ITEM_LIMIT,
  limitReferences,
  parseReferenceItems,
} from "../../lib/manuscriptFieldLimits";

interface Props {
  value: string;
  paperTitle: string;
}

export function ReferencesFromResearch({ value, paperTitle }: Props) {
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
        Filled from your uploaded manuscript — the {REFERENCE_ITEM_LIMIT} most important citations,
        including this paper. Edit the manuscript and re-run extraction to update.
      </p>
      {items.length === 0 ? (
        <div className="flex gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-4 py-5">
          <BookOpen className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          <p className="text-sm text-slate-600">
            Upload a manuscript to generate {REFERENCE_ITEM_LIMIT} key references (including this
            paper).
          </p>
        </div>
      ) : (
        <ol className="list-decimal space-y-2 rounded-xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm leading-relaxed text-slate-800">
          {items.map((item, index) => (
            <li key={`${index}-${item.slice(0, 40)}`} className="pl-1">
              {item}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
