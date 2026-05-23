import { Link2 } from "lucide-react";
import { greDoiDisplayPath } from "../../lib/publicationGre";

export function GreDoiBadge({ greDoi, greDoiUrl }: { greDoi: string; greDoiUrl?: string | null }) {
  const href = greDoiUrl || greDoiDisplayPath(greDoi);
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
    >
      <Link2 className="h-3.5 w-3.5" />
      GRE DOI: {greDoi}
    </a>
  );
}
