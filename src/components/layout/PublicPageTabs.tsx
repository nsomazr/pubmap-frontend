import { Link } from "react-router-dom";

type TabLink = { kind: "link"; to: string; label: string };
type TabButton = { kind: "button"; id: string; label: string; icon?: React.ReactNode };

export type PublicPageTab = TabLink | TabButton;

interface Props {
  tabs: PublicPageTab[];
  active: string;
  onSelect?: (id: string) => void;
  className?: string;
}

export function PublicPageTabs({ tabs, active, onSelect, className = "" }: Props) {
  const base =
    "rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500";
  const activeClass = "bg-white text-ink shadow-sm ring-1 ring-slate-200";
  const idleClass = "text-slate-600 hover:bg-white/70 hover:text-ink";

  return (
    <nav
      className={`inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 ring-1 ring-slate-200/80 ${className}`}
      aria-label="Page sections"
    >
      {tabs.map((tab) => {
        const isActive = tab.kind === "link" ? active === tab.to : active === tab.id;
        const className = `${base} inline-flex items-center gap-1.5 ${isActive ? activeClass : idleClass}`;

        if (tab.kind === "link") {
          return (
            <Link key={tab.to} to={tab.to} className={className} aria-current={isActive ? "page" : undefined}>
              {tab.label}
            </Link>
          );
        }

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelect?.(tab.id)}
            className={className}
            aria-pressed={isActive}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
