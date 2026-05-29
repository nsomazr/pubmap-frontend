import { MessageSquareText } from "lucide-react";
import type { PublicationGre } from "../../lib/publicationGre";
import { Textarea } from "../ui/Textarea";

interface Props {
  gre: PublicationGre;
  onChange: (next: PublicationGre) => void;
  disabled?: boolean;
}

export function AuthorsCommentSection({ gre, onChange, disabled }: Props) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-100">
          <MessageSquareText className="h-5 w-5" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-ink">Authors&apos; comment</h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Optional note for GRE reviewers. Use this for context that does not belong in the
            manuscript sections — for example scope, authorship, or submission details.
          </p>
        </div>
      </div>
      <Textarea
        label="Authors' comment"
        value={gre.authors_comment || ""}
        onChange={(e) => onChange({ ...gre, authors_comment: e.target.value })}
        rows={5}
        placeholder="e.g. This study extends our 2024 field season; co-author affiliations were updated after acceptance at the host institution."
        disabled={disabled}
      />
      <p className="text-xs text-slate-500">
        Not shown on the public publication page. GRE reviewers see it with your submission.
      </p>
    </section>
  );
}
