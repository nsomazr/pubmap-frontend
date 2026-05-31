import { AUTHORS_PERSONAL_FEELING_LABEL, type PublicationGre } from "../../lib/publicationGre";
import { Textarea } from "../ui/Textarea";

interface Props {
  gre: PublicationGre;
  onChange: (next: PublicationGre) => void;
  disabled?: boolean;
}

export function AuthorsCommentSection({ gre, onChange, disabled }: Props) {
  return (
    <Textarea
      value={gre.authors_comment || ""}
      onChange={(e) => onChange({ ...gre, authors_comment: e.target.value })}
      rows={5}
      disabled={disabled}
      aria-label={AUTHORS_PERSONAL_FEELING_LABEL}
    />
  );
}
