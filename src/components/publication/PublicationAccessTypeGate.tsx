import { Check, Lock, Unlock } from "lucide-react";
import type { PublicationAccessType } from "../../lib/publicationGre";

interface Props {
  selected: PublicationAccessType | null;
  onSelect: (type: PublicationAccessType) => void;
}

const OPTIONS: {
  type: PublicationAccessType;
  title: string;
  icon: typeof Unlock;
}[] = [
  {
    type: "open",
    title: "Open access",
    icon: Unlock,
  },
  {
    type: "closed",
    title: "Restricted — closed access",
    icon: Lock,
  },
];

export function PublicationAccessTypeGate({ selected, onSelect }: Props) {
  return (
    <section className="gre-card overflow-hidden p-0">
      <div className="border-b border-slate-100 bg-gradient-to-r from-brand-50/80 via-white to-teal-50/50 px-6 py-5 sm:px-8">
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600">Step 1</p>
        <h2 className="mt-1 text-xl font-bold text-ink">Choose publication access</h2>
      </div>

      <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
        {OPTIONS.map(({ type, title, icon: Icon }) => {
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
            </button>
          );
        })}
      </div>
    </section>
  );
}
