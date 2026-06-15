import { Link } from "react-router-dom";
import {
  compactAuthorLineFromPublication,
  publicationAuthorTeam,
} from "../../lib/publicationAuthors";
import { UserAvatar } from "../ui/UserAvatar";
import type { Publication } from "../../types";

interface Props {
  publication: Publication;
  /** When set, truncates with "et al."; omit to list every author. */
  maxAuthors?: number;
  showAvatars?: boolean;
  className?: string;
}

export function PublicationAuthorTeamRow({
  publication,
  maxAuthors,
  showAvatars = true,
  className = "",
}: Props) {
  const team = publicationAuthorTeam(publication);
  const line = compactAuthorLineFromPublication(publication, maxAuthors);
  if (!line && !team.length) return null;

  const avatars = team.slice(0, 3);

  return (
    <div className={`flex min-w-0 items-center gap-2 ${className}`.trim()}>
      {showAvatars && avatars.length > 0 && (
        <div className="flex shrink-0 -space-x-2">
          {avatars.map((person, index) => {
            const profilePath =
              person.profile_url || (person.user_id ? `/researcher/${person.user_id}` : null);
            const avatar = (
              <UserAvatar
                name={person.fullname}
                photoUrl={person.photo}
                size="sm"
                className="!h-8 !w-8 !border-2 !border-white !text-[10px] shadow-sm"
              />
            );
            return profilePath ? (
              <Link
                key={person.id ?? `${person.fullname}-${index}`}
                to={profilePath}
                className="relative transition hover:z-10 hover:scale-105"
                style={{ zIndex: avatars.length - index }}
              >
                {avatar}
              </Link>
            ) : (
              <span
                key={person.id ?? `${person.fullname}-${index}`}
                className="relative"
                style={{ zIndex: avatars.length - index }}
              >
                {avatar}
              </span>
            );
          })}
          {team.length > 3 && (
            <span className="relative z-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-600 shadow-sm">
              +{team.length - 3}
            </span>
          )}
        </div>
      )}
      {line && (
        <p className="min-w-0 text-xs font-medium leading-snug text-slate-600">{line}</p>
      )}
    </div>
  );
}
