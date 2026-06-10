import { Building2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { RankedNameLabel } from "../rankings/RankedNameLabel";
import { UserAvatar } from "../ui/UserAvatar";
import type { CoAuthorPerson } from "../../types";

interface Props {
  person: CoAuthorPerson;
  highlight?: boolean;
}

export function CoAuthorCard({ person, highlight = false }: Props) {
  const profilePath = person.profile_url || (person.user_id ? `/researcher/${person.user_id}` : null);
  const institutionPath = person.institution_map_url || undefined;

  const shellClass = `flex items-start gap-3 rounded-2xl border px-4 py-3 transition ${
    highlight
      ? "border-brand-200 bg-gradient-to-br from-brand-50/80 to-white shadow-sm"
      : "border-slate-100 bg-slate-50/80 hover:border-brand-200 hover:bg-white"
  }`;

  return (
    <div className={shellClass}>
      {profilePath ? (
        <Link to={profilePath} className="shrink-0 rounded-full transition hover:opacity-90">
          <UserAvatar
            name={person.fullname}
            photoUrl={person.photo}
            size="md"
            className="h-12 w-12 border-2 border-white shadow-sm"
          />
        </Link>
      ) : (
        <UserAvatar
          name={person.fullname}
          photoUrl={person.photo}
          size="md"
          className="h-12 w-12 border-2 border-white shadow-sm"
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
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
            showBadges={Boolean(person.user_id)}
          />
          {person.role && (
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                highlight
                  ? "bg-brand-100 text-brand-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {person.role}
            </span>
          )}
        </div>

        {person.affiliation && (
          <div className="mt-2">
            {institutionPath ? (
              <Link
                to={institutionPath}
                className="flex items-start gap-1.5 text-sm text-slate-600 transition hover:text-brand-700"
              >
                <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-2">{person.affiliation}</span>
              </Link>
            ) : (
              <p className="flex items-start gap-1.5 text-sm text-slate-600">
                <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-2">{person.affiliation}</span>
              </p>
            )}
          </div>
        )}

        {person.is_registered && profilePath && (
          <Link
            to={profilePath}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50"
          >
            View GRE profile
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
