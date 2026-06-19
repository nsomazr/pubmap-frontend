import { Link } from "react-router-dom";
import { AffiliationList } from "../institutions/AffiliationList";
import { RankedNameLabel } from "../rankings/RankedNameLabel";
import { UserAvatar } from "../ui/UserAvatar";
import { isRegisteredGreResearcher, publicationAuthorTeam } from "../../lib/publicationAuthors";
import type { Publication } from "../../types";

interface Props {
  publication: Publication;
}

export function PublicationAuthorsSidebar({ publication }: Props) {
  const team = publicationAuthorTeam(publication);
  if (!team.length) return null;

  return (
    <div className="gre-public-card p-5">
      <p className="text-[11px] font-bold uppercase tracking-wide text-brand-600">
        {team.length > 1 ? "Authors" : "Author"}
      </p>
      <ul className="mt-4 space-y-4">
        {team.map((person, index) => {
          const profilePath =
            person.profile_url || (person.user_id ? `/researcher/${person.user_id}` : null);
          const isLead = person.kind === "primary" || index === 0;
          const registered = isRegisteredGreResearcher(person);
          return (
            <li key={person.id ?? `${person.fullname}-${person.user_id ?? index}`}>
              <div className="flex items-start gap-3">
                {profilePath ? (
                  <Link to={profilePath} className="shrink-0 rounded-full transition hover:opacity-90">
                    <UserAvatar
                      name={person.fullname}
                      photoUrl={person.photo}
                      size="md"
                    />
                  </Link>
                ) : (
                  <UserAvatar name={person.fullname} photoUrl={person.photo} size="md" />
                )}
                <div className="min-w-0 flex-1">
                  <RankedNameLabel
                    name={
                      profilePath ? (
                        <Link
                          to={profilePath}
                          className="font-semibold text-ink transition hover:text-brand-700"
                        >
                          {person.fullname}
                        </Link>
                      ) : (
                        <span className="font-semibold text-ink">{person.fullname}</span>
                      )
                    }
                    ranking={person.ranking}
                    registered={registered}
                    showBadges={registered}
                  />
                  {person.affiliation && (
                    <div className="mt-1">
                      <AffiliationList value={person.affiliation} className="text-xs" />
                    </div>
                  )}
                  {person.role && (
                    <span
                      className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        isLead
                          ? "bg-brand-100 text-brand-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {person.role}
                    </span>
                  )}
                  {registered && person.ranking && (
                    <p className="mt-2 text-xs text-slate-600">
                      {person.ranking.published_count} published on GRE
                    </p>
                  )}
                  {profilePath && (
                    <Link
                      to={profilePath}
                      className="mt-2 inline-flex text-xs font-semibold text-brand-600 hover:underline"
                    >
                      View profile
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
