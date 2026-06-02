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
      <Textarea
        label={`Key references (max ${REFERENCE_ITEM_LIMIT})`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => onChange(formatted)}
        rows={6}
        placeholder={`1. First key reference\n2. Second reference\n…\n${REFERENCE_ITEM_LIMIT}. ${paperTitle.trim() || "This paper"} (this paper)`}
        disabled={disabled}
      />
      {items.length > 0 ? (
        <ol className="list-decimal space-y-2 border-l-2 border-slate-200/90 py-1 pl-5 text-sm leading-relaxed text-slate-800">
          {items.map((item, index) => (
            <li key={`${index}-${item.slice(0, 40)}`} className="pl-1">
              {item}
            </li>
          ))}
        </ol>
      ) : (
        <div className="flex gap-3 border-l-2 border-dashed border-slate-200 py-2 pl-4 text-slate-600">
          <BookOpen className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          <p className="text-sm text-slate-600">No references added yet.</p>
        </div>
      )}
    </div>
  );
}
