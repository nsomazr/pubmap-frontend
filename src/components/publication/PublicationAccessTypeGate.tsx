import { Check, Globe, Lock, Unlock } from "lucide-react";
import {
  greFormArtCardClass,
  greFormSectionTitleClass,
} from "../../lib/formStyles";
import type { PublicationAccessType } from "../../lib/publicationGre";

interface Props {
  selected: PublicationAccessType | null;
  onSelect: (type: PublicationAccessType) => void;
}

const OPTIONS: {
  type: PublicationAccessType;
  title: string;
  tagline: string;
  description: string;
  icon: typeof Unlock;
  accent: string;
  iconWrap: string;
}[] = [
  {
    type: "open",
    title: "Open access",
    tagline: "Free to read online",
    description:
      "Choose this when your publication is already published and anyone can read it on the internet without paying. You will share the full PDF and links on GRE so researchers can find and download your work.",
    icon: Unlock,
    accent: "border-brand-400 bg-brand-50/80 ring-brand-100",
    iconWrap: "bg-brand-600 text-white shadow-brand-600/20",
  },
  {
    type: "closed",
    title: "Restricted access",
    tagline: "Paywall or subscription",
    description:
      "Choose this when readers must pay or subscribe to access the full publication elsewhere. GRE will publish your summary and structured sections so your study is discoverable without hosting the paid manuscript.",
    icon: Lock,
    accent: "border-slate-400 bg-slate-50 ring-slate-200",
    iconWrap: "bg-slate-800 text-white shadow-slate-900/15",
  },
];

export function PublicationAccessTypeGate({ selected, onSelect }: Props) {
  return (
    <section className={greFormArtCardClass}>
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Step 1</p>
        <h2 className={`mt-1 ${greFormSectionTitleClass} !mb-2 text-lg sm:text-xl`}>
          Choose publication access
        </h2>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Tell us how readers can access your publication today. This helps GRE show the right materials on
          the map and publication page.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map(({ type, title, tagline, description, icon: Icon, accent, iconWrap }) => {
          const active = selected === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className={`gre-interactive group relative rounded-xl border-2 p-4 text-left transition sm:p-4 ${
                active
                  ? `${accent} shadow-sm ring-2`
                  : "border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50/50"
              }`}
            >
              {active && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
              <div className="flex items-start gap-3 pr-8">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconWrap}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    {tagline}
                  </p>
                  <h3 className="mt-0.5 text-base font-semibold text-ink">{title}</h3>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
              {type === "open" ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-brand-700">
                  <Globe className="h-3.5 w-3.5 shrink-0" />
                  Full PDF can be shared on GRE
                </p>
              ) : (
                <p className="mt-2 text-xs font-medium text-slate-600">
                  GRE summary + sections, not the paid full text
                </p>
              )}
            </button>
          );
        })}
      </div>

    </section>
  );
}
