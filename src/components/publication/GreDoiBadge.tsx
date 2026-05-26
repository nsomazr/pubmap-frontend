import { Link2 } from "lucide-react";
import { greDoiDisplayPath } from "../../lib/publicationGre";
import { grePaperCode } from "../../lib/grePaperTitle";

export function GreDoiBadge({
  greDoi,
  greDoiUrl,
  paperNumber,
}: {
  greDoi: string;
  greDoiUrl?: string | null;
  paperNumber?: string | null;
}) {
  const href = greDoiUrl || greDoiDisplayPath(greDoi);
  const code = grePaperCode(paperNumber);
  return (
    <a
      href={href}
      className="inline-flex items-start gap-2 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
    >
      <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span className="leading-relaxed">
        <span className="block">DOI: {greDoi}</span>
        {code && (
          <span className="block text-[10px] font-normal tracking-wide text-slate-400">
            Paper number: {code}
          </span>
        )}
      </span>
    </a>
  );
}
