import { Check, FileText, Lock, Unlock } from "lucide-react";
import type { PublicationAccessType } from "../../lib/publicationGre";

interface Props {
  selected: PublicationAccessType | null;
  onSelect: (type: PublicationAccessType) => void;
}

const OPTIONS: {
  type: PublicationAccessType;
  title: string;
  summary: string;
  icon: typeof Unlock;
  points: string[];
}[] = [
  {
    type: "open",
    title: "Open access",
    summary: "Publish the full manuscript on GRE after review, with manuscript sections auto-filled from your upload.",
    icon: Unlock,
    points: [
      "Complete title, category, and map location.",
      "Upload the original PDF to auto-fill the abstract, methods, results, and other sections with Surya OCR.",
      "Review and edit the extracted sections before submitting.",
      "Readers access the full paper on GRE after approval.",
    ],
  },
  {
    type: "closed",
    title: "Restricted / closed access",
    summary: "Publish structured GRE summaries without sharing the full PDF.",
    icon: Lock,
    points: [
      "Complete title, abstract, all manuscript sections, category, and map location.",
      "Add the publisher access link where the full paper can be read.",
      "GRE publishes structured sections and a summary PDF, not the full manuscript.",
    ],
  },
];

export function PublicationAccessTypeGate({ selected, onSelect }: Props) {
  return (
    <section className="gre-card overflow-hidden p-0">
      <div className="border-b border-slate-100 bg-gradient-to-r from-brand-50/80 via-white to-teal-50/50 px-6 py-5 sm:px-8">
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Step 1</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Choose publication access</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Select how readers will access your work on GRE. You can only pick one path per submission;
          the form below will show the fields required for that type.
        </p>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
        {OPTIONS.map(({ type, title, summary, icon: Icon, points }) => {
          const active = selected === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={`group relative flex h-full flex-col rounded-2xl border-2 p-5 text-left transition ${
                active
                  ? "border-brand-500 bg-gradient-to-br from-brand-50/90 to-teal-50/40 shadow-md ring-2 ring-brand-100"
                  : "border-slate-200 bg-white hover:border-brand-200 hover:shadow-sm"
              }`}
            >
              {active && (
                <span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white shadow">
                  <Check className="h-4 w-4" />
                </span>
              )}
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-lg ${
                  type === "open"
                    ? "bg-brand-600 text-white shadow-brand-600/25"
                    : "bg-slate-800 text-white shadow-slate-900/20"
                }`}
              >
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{summary}</p>
              <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                {points.map((point) => (
                  <li key={point} className="flex gap-2 text-xs leading-relaxed text-slate-600">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" aria-hidden />
                    {point}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </section>
  );
}
