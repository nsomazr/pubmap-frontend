import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import {
  grePublicationSectionCardAmberClass,
  grePublicationSectionCardClass,
  grePublicationSectionDescClass,
  grePublicationSectionHeadClass,
  grePublicationSectionTitleClass,
} from "../../lib/publicationPageStyles";

type Props = {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  children?: ReactNode;
  variant?: "default" | "amber";
  className?: string;
  id?: string;
  /** Extra content beside the title (e.g. count, DOI chip). */
  titleAside?: ReactNode;
  iconClassName?: string;
};

export function PublicationPageSection({
  title,
  description,
  icon: Icon,
  children,
  variant = "default",
  className = "",
  id,
  titleAside,
  iconClassName,
}: Props) {
  const cardClass =
    variant === "amber" ? grePublicationSectionCardAmberClass : grePublicationSectionCardClass;
  const iconColor =
    iconClassName ?? (variant === "amber" ? "text-amber-700" : "text-brand-600");

  return (
    <section
      id={id}
      className={`${cardClass} min-w-0 overflow-visible p-5 sm:p-6 ${className}`.trim()}
    >
      <header className={grePublicationSectionHeadClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className={`flex items-center gap-2 ${grePublicationSectionTitleClass}`}>
              {Icon ? <Icon className={`h-5 w-5 shrink-0 ${iconColor}`} aria-hidden /> : null}
              <span>{title}</span>
            </h2>
            {description ? (
              <div className={grePublicationSectionDescClass}>{description}</div>
            ) : null}
          </div>
          {titleAside ? <div className="shrink-0">{titleAside}</div> : null}
        </div>
      </header>
      {children ? <div className="mt-5 min-w-0">{children}</div> : null}
    </section>
  );
}
