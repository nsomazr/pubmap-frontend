import { Plus, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  parseAffiliationList,
  serializeAffiliationList,
} from "../../lib/affiliations";
import { InstitutionPicker } from "./InstitutionPicker";

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  countryCode?: string;
  required?: boolean;
  hideHint?: boolean;
  className?: string;
  maxInstitutions?: number;
}

export function MultiInstitutionPicker({
  value,
  onChange,
  label = "Institution / affiliation",
  countryCode,
  required,
  hideHint = false,
  className = "",
  maxInstitutions = 6,
}: Props) {
  const [rows, setRows] = useState<string[]>(() => {
    const parsed = parseAffiliationList(value);
    return parsed.length ? parsed : [""];
  });

  useEffect(() => {
    const parsed = parseAffiliationList(value);
    const next = parsed.length ? parsed : [""];
    setRows((current) => {
      if (serializeAffiliationList(current) === serializeAffiliationList(next)) {
        return current;
      }
      return next;
    });
  }, [value]);

  const commitRows = (nextRows: string[]) => {
    const normalized = nextRows.length ? nextRows : [""];
    setRows(normalized);
    onChange(serializeAffiliationList(normalized));
  };

  const updateRow = (index: number, institution: string) => {
    const next = [...rows];
    next[index] = institution;
    commitRows(next);
  };

  const addRow = () => {
    if (rows.length >= maxInstitutions) return;
    commitRows([...rows, ""]);
  };

  const removeRow = (index: number) => {
    if (rows.length <= 1) {
      commitRows([""]);
      return;
    }
    commitRows(rows.filter((_, rowIndex) => rowIndex !== index));
  };

  const canAdd = rows.length < maxInstitutions;

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink">
          {label}
          {required ? <span className="text-red-600"> *</span> : null}
        </p>
        {canAdd ? (
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 transition hover:text-brand-800"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Add institution
          </button>
        ) : null}
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => (
          <div key={`institution-row-${index}`} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <InstitutionPicker
                value={row}
                onChange={(institution) => updateRow(index, institution)}
                label={
                  rows.length > 1 ? `Institution ${index + 1}` : label
                }
                hideLabel={rows.length === 1}
                hideHint
                required={required && index === 0}
                countryCode={countryCode}
              />
            </div>
            {rows.length > 1 ? (
              <button
                type="button"
                onClick={() => removeRow(index)}
                className="mt-8 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                aria-label={`Remove institution ${index + 1}`}
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {!hideHint ? (
        <p className="mt-2 text-xs text-slate-500">
          Researchers often belong to more than one institution. Each affiliation appears with its
          own number on the published paper.
        </p>
      ) : null}
    </div>
  );
}
