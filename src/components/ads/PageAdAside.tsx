import type { ReactNode } from "react";
import type { AdPlacement, AdTargetingContext } from "../../lib/ads";
import { GreAdPlacement } from "./GreAdSlot";

interface PageAdAsideProps {
  context?: AdTargetingContext;
  primaryPlacement?: AdPlacement;
  secondaryPlacement?: AdPlacement;
  className?: string;
  children: ReactNode;
}

export function PageAdAside({
  context,
  primaryPlacement = "forum_sidebar",
  secondaryPlacement = "research_tool",
  className = "",
  children,
}: PageAdAsideProps) {
  return (
    <div className={`grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_min(100%,15rem)] ${className}`}>
      <div className="min-w-0">{children}</div>
      <aside className="hidden space-y-4 xl:sticky xl:top-24 xl:block">
        <GreAdPlacement placement={primaryPlacement} limit={3} rotate context={context} />
        {secondaryPlacement ? (
          <GreAdPlacement placement={secondaryPlacement} limit={2} rotate context={context} />
        ) : null}
      </aside>
    </div>
  );
}

interface ForumInlineAdProps {
  context?: AdTargetingContext;
  className?: string;
}

export function ForumInlineAd({ context, className = "mb-6 xl:hidden" }: ForumInlineAdProps) {
  return (
    <GreAdPlacement
      placement="forum_inline"
      variant="card"
      limit={1}
      rotate
      context={context}
      className={className}
    />
  );
}
