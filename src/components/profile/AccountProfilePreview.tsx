import { Building2, Eye, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { displayRoleName, userFormalName } from "../../lib/userDisplay";
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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{live ? "Preview" : "Public profile"}</p>
        {user?.id ? (
          <Link
            to={`/researcher/${user.id}`}
            className="text-xs font-semibold text-brand-700 hover:underline"
          >
            View live
          </Link>
        ) : null}
      </div>

      <div className="flex gap-3">
        <UserAvatar
          user={user}
          name={displayName}
          photoVersion={user?.updated_at}
          size="md"
          className="!h-11 !w-11 !rounded-full !text-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink">{displayName}</p>
          <p className="text-xs text-slate-500">{displayRoleName(draft.roleName)}</p>
          {draft.affiliation ? (
            <p className="mt-1 flex items-start gap-1 text-xs text-slate-600">
              <Building2 className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
              <span className="line-clamp-2">{draft.affiliation}</span>
            </p>
          ) : null}
        </div>
      </div>

      <ul className="mt-3 space-y-1 text-xs text-slate-600">
        {draft.email ? (
          <li className="flex items-center gap-2 truncate">
            <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {draft.email}
          </li>
        ) : null}
        {draft.phone?.trim() ? (
          <li className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {draft.phone.trim()}
          </li>
        ) : null}
        {draft.countryLabel ? (
          <li className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {draft.countryLabel}
          </li>
        ) : null}
      </ul>

      {draft.interests.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1">
          {draft.interests.slice(0, 5).map((interest) => (
            <span
              key={interest}
              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
            >
              {interest}
            </span>
          ))}
        </div>
      ) : null}

      <p className="mt-3 text-xs text-slate-500">{publishedCount} published</p>
    </div>
  );
}
