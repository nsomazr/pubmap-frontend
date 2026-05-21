import { ArrowUpRight, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { DefaultBanner } from "../ui/DefaultBanner";
import { isHexColor, mediaUrl } from "../../lib/mediaUrl";
import type { SubCategory } from "../../types";

interface Props {
  sub: SubCategory;
}

export function ForumCategoryCard({ sub }: Props) {
  const accent = isHexColor(sub.icon) ? sub.icon! : "#3b5bdb";
  const imageSrc = sub.icon && !isHexColor(sub.icon) ? mediaUrl(sub.icon) : null;
  const count = (sub as SubCategory & { topic_count?: number }).topic_count ?? 0;

  return (
    <Link
      to={`/forum/category/${sub.id}`}
      className="group flex items-center gap-3.5 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-200/80 sm:gap-4 sm:p-4"
    >
      <div
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl sm:h-[4.5rem] sm:w-[4.5rem]"
        style={{ boxShadow: `0 4px 14px -4px ${accent}66` }}
      >
        {imageSrc ? (
          <>
            <img
              src={imageSrc}
              alt=""
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div
              className="absolute inset-0 opacity-40"
              style={{ background: `linear-gradient(135deg, ${accent}, rgba(15,23,42,0.5))` }}
            />
          </>
        ) : (
          <DefaultBanner kind="forum" seed={sub.id} compact />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {sub.category_name && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
            {sub.category_name}
          </span>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand-700 sm:text-[15px]">
          {sub.name}
        </h3>
        <span className="mt-1.5 inline-flex items-center gap-1 text-xs text-slate-500">
          <MessageSquare className="h-3 w-3 text-teal-600" />
          {count} {count === 1 ? "topic" : "topics"}
        </span>
      </div>

      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition group-hover:bg-brand-600 group-hover:text-white">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
