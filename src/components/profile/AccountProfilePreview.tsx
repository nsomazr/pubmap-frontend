import { Building2, Eye, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { userFormalName } from "../../lib/userDisplay";
import { UserAvatar } from "../ui/UserAvatar";
import type { User } from "../../types";

export interface AccountProfilePreviewData {
  title: string;
  firstname: string;
  middlename: string;
  lastname: string;
  affiliation: string;
  countryLabel?: string;
  interests: string[];
  phone: string;
  email?: string;
  roleName?: string;
}

interface Props {
  user: User | null;
  draft: AccountProfilePreviewData;
  publishedCount?: number;
  live?: boolean;
}

export function AccountProfilePreview({ user, draft, publishedCount = 0, live = false }: Props) {
  const previewUser: Pick<User, "title" | "firstname" | "middlename" | "lastname" | "full_name"> = {
    title: draft.title,
    firstname: draft.firstname,
    middlename: draft.middlename,
    lastname: draft.lastname,
    full_name: user?.full_name,
  };
  const displayName = userFormalName(previewUser) || "Your name";

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">
          <Eye className="h-3.5 w-3.5" />
          {live ? "Live preview" : "Public profile"}
        </p>
        {user?.id && (
          <Link
            to={`/researcher/${user.id}`}
            className="text-[11px] font-semibold text-brand-700 hover:underline"
          >
            View live
          </Link>
        )}
      </div>

      <div className="p-4">
        <div className="flex gap-3">
          <UserAvatar
            user={user}
            name={displayName}
            photoVersion={user?.updated_at}
            size="md"
            className="!h-12 !w-12 !rounded-xl !text-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold leading-tight text-ink">{displayName}</p>
            {draft.roleName && (
              <span className="mt-0.5 inline-block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {draft.roleName}
              </span>
            )}
            {draft.affiliation && (
              <p className="mt-1 flex items-start gap-1 text-xs text-slate-600">
                <Building2 className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                <span className="line-clamp-2">{draft.affiliation}</span>
              </p>
            )}
          </div>
        </div>

        <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
          {draft.email && (
            <li className="flex items-center gap-2 truncate">
              <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {draft.email}
            </li>
          )}
          {draft.phone?.trim() ? (
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {draft.phone.trim()}
            </li>
          ) : null}
          {draft.countryLabel && (
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              {draft.countryLabel}
            </li>
          )}
        </ul>

        {draft.interests.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <Sparkles className="h-3 w-3 text-brand-500" />
              Interests
            </p>
            <div className="flex flex-wrap gap-1">
              {draft.interests.slice(0, 6).map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                >
                  {interest}
                </span>
              ))}
              {draft.interests.length > 6 && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                  +{draft.interests.length - 6}
                </span>
              )}
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] text-slate-500">
          {publishedCount} published on GRE
        </p>
      </div>
    </div>
  );
}
