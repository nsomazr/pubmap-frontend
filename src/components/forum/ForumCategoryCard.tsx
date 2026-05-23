import { ArrowUpRight, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { DefaultBanner } from "../ui/DefaultBanner";
import { isHexColor, mediaUrl } from "../../lib/mediaUrl";
import { resolveSubcategoryFromModel } from "../../lib/taxonomyVisuals";
import { SubcategoryVisual } from "../taxonomy/SubcategoryVisual";
import type { SubCategory } from "../../types";

interface Props {
  sub: SubCategory;
}

export function ForumCategoryCard({ sub }: Props) {
  const visual = resolveSubcategoryFromModel(sub);
  const accent = visual?.accent_color ?? (isHexColor(sub.icon) ? sub.icon! : "#3b5bdb");
  const imageSrc = sub.icon && !isHexColor(sub.icon) ? mediaUrl(sub.icon) : null;
  const count = (sub as SubCategory & { topic_count?: number }).topic_count ?? 0;

  return (
    <Link
      to={`/forum/category/${sub.id}`}
      className="gre-card gre-card-hover group flex items-center gap-3.5 p-3.5 sm:gap-4 sm:p-4"
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
            {visual && (
              <div className="absolute bottom-1.5 right-1.5">
                <SubcategoryVisual visual={visual} size="xs" className="ring-2 ring-white" />
              </div>
            )}
          </>
        ) : visual ? (
          <div className="flex h-full w-full items-center justify-center">
            <SubcategoryVisual visual={visual} size="lg" className="h-full w-full rounded-xl" />
          </div>
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
