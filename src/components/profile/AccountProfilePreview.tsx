import { Building2, Eye, Mail, MapPin, Phone, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { assets } from "../../lib/brand";
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
  /** When true, sidebar reflects unsaved edits */
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
    <div className="account-profile-preview overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-br from-brand-50/70 via-white to-teal-50/40 px-5 py-4">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand-600">
          <Eye className="h-3.5 w-3.5" />
          {live ? "Live preview" : "Public profile"}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {live
            ? "Preview your changes before saving."
            : "How you appear on publications, the map, and researcher pages."}
        </p>
      </div>

      <div className="p-5">
        <div className="flex gap-4">
          <img
            src={assets.logo}
            alt=""
            className="hidden h-8 w-8 shrink-0 object-contain opacity-40 sm:block"
            aria-hidden
          />
          <div className="flex min-w-0 flex-1 gap-3">
            <UserAvatar
              user={user}
              name={displayName}
              size="lg"
              className="!h-16 !w-16 !rounded-2xl !text-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold leading-tight text-ink">{displayName}</p>
              {draft.roleName && (
                <span className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-700 ring-1 ring-brand-100">
                  {draft.roleName}
                </span>
              )}
              {draft.affiliation && (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
                  <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="line-clamp-2">{draft.affiliation}</span>
                </p>
              )}
              {draft.countryLabel && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {draft.countryLabel}
                </p>
              )}
            </div>
          </div>
        </div>

        <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
          {draft.email && (
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <span className="truncate">{draft.email}</span>
            </li>
          )}
          {draft.phone?.trim() && (
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-slate-400" />
              {draft.phone.trim()}
            </li>
          )}
        </ul>

        {draft.interests.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <Sparkles className="h-3.5 w-3.5 text-brand-500" />
              Research interests
            </p>
            <div className="flex flex-wrap gap-1.5">
              {draft.interests.slice(0, 8).map((interest) => (
                <span
                  key={interest}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700"
                >
                  {interest}
                </span>
              ))}
              {draft.interests.length > 8 && (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-500">
                  +{draft.interests.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}

        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
          {publishedCount} publication{publishedCount !== 1 ? "s" : ""} on GRE
        </p>

        {user?.id && (
          <Link
            to={`/researcher/${user.id}`}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
          >
            <Eye className="h-4 w-4 text-brand-600" />
            View live profile
          </Link>
        )}
      </div>
    </div>
  );
}
