import type { SubcategoryVisual as Visual, User } from "../../types";
import { SubcategoryVisual } from "../taxonomy/SubcategoryVisual";
import { UserAvatar } from "../ui/UserAvatar";

interface Props {
  user?: Pick<User, "photo" | "firstname" | "lastname" | "full_name" | "updated_at"> | null;
  authorName?: string;
  subVisual?: Visual | null;
  className?: string;
}

export function PublicationIdentityRow({ user, authorName, subVisual, className = "" }: Props) {
  if (!authorName && !subVisual) return null;

  return (
    <div className={`mb-3 flex flex-wrap items-center gap-2.5 ${className}`}>
      {authorName && (
        <div className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full bg-slate-50 py-1 pl-1 pr-3 ring-1 ring-slate-200/80">
          <UserAvatar user={user} size="sm" className="!h-9 !w-9 shrink-0 !border-2 !text-[11px]" />
          <span className="truncate text-xs font-semibold text-slate-700 sm:text-sm">{authorName}</span>
        </div>
      )}
      {subVisual && (
        <div className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-full bg-brand-50 px-2.5 py-1.5 ring-1 ring-brand-100/80">
          <SubcategoryVisual
            visual={subVisual}
            size="xs"
            fit="contain"
            clip={false}
            shadow={false}
            className="!h-7 !w-7 !rounded-lg"
          />
          <span className="truncate text-[11px] font-bold uppercase tracking-wide text-brand-700">
            {subVisual.name}
          </span>
        </div>
      )}
    </div>
  );
}
