import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PublicNav } from "./PublicNav";
import { PublicFooter } from "./PublicFooter";

export type PageAccent = "blue" | "teal" | "violet" | "amber" | "rose";

interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  crumbs?: Crumb[];
  children: React.ReactNode;
  wide?: boolean;
  accent?: PageAccent;
  badge?: string;
  /** Shorter hero for About, Events, Forum, Contact, etc. */
  compactHero?: boolean;
}

const accentStyles: Record<
  PageAccent,
  { hero: string; orb1: string; orb2: string; badge: string }
> = {
  blue: {
    hero: "from-[#1e3a8a] via-[#3b5bdb] to-[#0d9488]",
    orb1: "bg-blue-400/30",
    orb2: "bg-teal-400/25",
    badge: "bg-blue-500/20 text-blue-100 ring-blue-400/30",
  },
  teal: {
    hero: "from-[#0f766e] via-[#0d9488] to-[#3b5bdb]",
    orb1: "bg-teal-300/35",
    orb2: "bg-cyan-400/20",
    badge: "bg-teal-500/20 text-teal-50 ring-teal-400/30",
  },
  violet: {
    hero: "from-[#4c1d95] via-[#6366f1] to-[#3b5bdb]",
    orb1: "bg-violet-400/30",
    orb2: "bg-indigo-400/25",
    badge: "bg-violet-500/20 text-violet-100 ring-violet-400/30",
  },
  amber: {
    hero: "from-[#b45309] via-[#d97706] to-[#3b5bdb]",
    orb1: "bg-amber-400/25",
    orb2: "bg-orange-300/20",
    badge: "bg-amber-500/20 text-amber-50 ring-amber-400/30",
  },
  rose: {
    hero: "from-[#be123c] via-[#e11d48] to-[#7c3aed]",
    orb1: "bg-rose-400/25",
    orb2: "bg-pink-400/20",
    badge: "bg-rose-500/20 text-rose-50 ring-rose-400/30",
  },
};

export function PublicPageLayout({
  title,
  subtitle,
  crumbs,
  children,
  wide,
  accent = "blue",
  badge,
  compactHero = false,
}: Props) {
  const a = accentStyles[accent];

  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden bg-[#f8fafc]">
      <PublicNav />
      <section className={`relative overflow-hidden bg-gradient-to-br ${a.hero}`}>
        <div
          className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div
          className={`absolute -left-24 top-0 rounded-full blur-3xl ${a.orb1} ${
            compactHero ? "h-40 w-40" : "h-72 w-72"
          }`}
          aria-hidden
        />
        <div
          className={`absolute -right-16 bottom-0 rounded-full blur-3xl ${a.orb2} ${
            compactHero ? "h-44 w-44" : "h-80 w-80"
          }`}
          aria-hidden
        />
        <div
          className={`relative mx-auto max-w-[1600px] px-4 sm:px-6 ${
            compactHero
              ? "pb-8 pt-6 sm:pb-10 sm:pt-8"
              : "pb-16 pt-10 sm:pb-20 sm:pt-14 lg:pb-24"
          }`}
        >
          {crumbs && crumbs.length > 0 && (
            <nav
              className={`flex flex-wrap items-center gap-1.5 ${compactHero ? "mb-3" : "mb-6"}`}
            >
              {crumbs.map((c, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-sm">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-white/40" />}
                  {c.to ? (
                    <Link
                      to={c.to}
                      className="font-medium text-white/70 transition hover:text-white"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-white/90">{c.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}
          {badge && (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ring-1 ${a.badge} ${
                compactHero ? "mb-2" : "mb-4"
              }`}
            >
              {badge}
            </span>
          )}
          <h1
            className={`max-w-4xl font-bold leading-[1.15] tracking-tight text-white ${
              compactHero
                ? "text-2xl sm:text-3xl lg:text-4xl"
                : "text-4xl sm:text-5xl lg:text-6xl"
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`max-w-2xl leading-relaxed text-white/80 ${
                compactHero
                  ? "mt-2 text-sm sm:text-base"
                  : "mt-5 text-lg sm:text-xl"
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#f8fafc] to-transparent ${
            compactHero ? "h-8" : "h-16"
          }`}
        />
      </section>

      <main
        className={`relative z-10 mx-auto w-full flex-1 px-4 pb-16 sm:px-6 ${
          wide ? "max-w-[1600px]" : "max-w-5xl"
        }`}
        style={{ marginTop: compactHero ? "-1.25rem" : "-2.5rem" }}
      >
        <div className="animate-fade-up">{children}</div>
      </main>
      <PublicFooter />
    </div>
  );
}
