import { MessageSquareText } from "lucide-react";
import { AUTHORS_PERSONAL_FEELING_LABEL, type PublicationGre } from "../../lib/publicationGre";
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
          <h3 className="text-sm font-bold leading-snug text-ink">
            {AUTHORS_PERSONAL_FEELING_LABEL}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Optional personal note for GRE reviewers about how you feel about this paper. This is
            never filled from manuscript extraction.
          </p>
        </div>
      </div>
      <Textarea
        label={AUTHORS_PERSONAL_FEELING_LABEL}
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
