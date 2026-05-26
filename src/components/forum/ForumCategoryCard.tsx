import { useEffect, useState } from "react";
import { ArrowUpRight, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { DefaultBanner } from "../ui/DefaultBanner";
import { isHexColor, mediaUrl } from "../../lib/mediaUrl";
import { resolveSubcategoryFromModel } from "../../lib/taxonomyVisuals";
import { SubcategoryVisual } from "../taxonomy/SubcategoryVisual";
import type { SubCategory } from "../../types";

interface Props {
  sub: SubCategory;
  priorityImage?: boolean;
}

export function ForumCategoryCard({ sub, priorityImage = false }: Props) {
  const visual = resolveSubcategoryFromModel(sub);
  const accent = visual?.accent_color ?? (isHexColor(sub.icon) ? sub.icon! : "#3b5bdb");
  const imageSrc = sub.icon && !isHexColor(sub.icon) ? mediaUrl(sub.icon) : null;
  const count = (sub as SubCategory & { topic_count?: number }).topic_count ?? 0;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
  }, [imageSrc]);

  return (
    <Link
      to={`/forum/category/${sub.id}`}
      className="gre-card gre-card-hover group flex items-center gap-3 p-3 sm:gap-3.5 sm:p-3.5 md:gap-4 md:p-4"
    >
      <div
        className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 sm:h-16 sm:w-16 md:h-[4.5rem] md:w-[4.5rem]"
        style={{ boxShadow: `0 4px 14px -4px ${accent}66` }}
      >
        {imageSrc && !imageFailed ? (
          <>
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${
                imageLoaded ? "opacity-0" : "opacity-100"
              }`}
              style={{ background: `linear-gradient(135deg, ${accent}22, rgba(255,255,255,0.98))` }}
            >
              {visual ? (
                <SubcategoryVisual visual={visual} size="sm" shadow={false} />
              ) : (
                <DefaultBanner kind="forum" seed={sub.id} compact />
              )}
            </div>
            <img
              src={imageSrc}
              alt=""
              loading={priorityImage ? "eager" : "lazy"}
              fetchPriority={priorityImage ? "high" : "auto"}
              decoding="async"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageFailed(true)}
              className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
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

      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition group-hover:bg-brand-600 group-hover:text-white sm:h-8 sm:w-8">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
