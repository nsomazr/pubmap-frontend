import { Users } from "lucide-react";
import { publicationCoAuthorsFromPublication } from "../../lib/publicationAuthors";
import type { Publication } from "../../types";
import { CoAuthorCard } from "./CoAuthorCard";
import { PublicationPageSection } from "./PublicationPageSection";

interface Props {
  publication: Publication;
}

function fallbackCoAuthors(publication: Publication) {
  return publicationCoAuthorsFromPublication(publication);
}

export function CoAuthorsPanel({ publication }: Props) {
  const coAuthors = publication.co_authors ?? fallbackCoAuthors(publication);

  return (
    <PublicationPageSection
      id="research-team"
      title="Research team"
      icon={Users}
      description={
        <>
          {coAuthors.total_authors} author{coAuthors.total_authors !== 1 ? "s" : ""} on this
          publication
        </>
      }
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <CoAuthorCard person={coAuthors.primary_author} highlight />
        {coAuthors.co_authors.map((person) => (
          <CoAuthorCard key={person.id ?? `${person.fullname}-${person.email}`} person={person} />
        ))}
      </div>
    </PublicationPageSection>
  );
}
