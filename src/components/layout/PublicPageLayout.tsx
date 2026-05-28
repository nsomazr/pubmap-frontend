import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { PageBackLink } from "../ui/PageBackLink";
import { PublicNav } from "./PublicNav";
import { PublicFooter } from "./PublicFooter";
import {
  greGradientPremium,
  greGradientPremiumTeal,
} from "../../lib/greTheme";

export type PageAccent = "blue" | "teal";

interface Crumb {
  label: string;
  to?: string;
}

export interface PageBack {
  to: string;
  label?: string;
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
  /** Optional back link rendered above page content, aligned with the hero. */
  back?: PageBack;
  /** Optional visual shown beside the hero heading. */
  heroVisual?: React.ReactNode;
}

const accentStyles: Record<
  PageAccent,
  { hero: string; orb1: string; orb2: string; badge: string }
> = {
  blue: {
    hero: greGradientPremium,
    orb1: "bg-brand-400/25",
    orb2: "bg-teal-400/20",
    badge: "bg-brand-500/20 text-brand-100 ring-brand-400/30",
  },
  teal: {
    hero: greGradientPremiumTeal,
    orb1: "bg-teal-300/30",
    orb2: "bg-brand-400/20",
    badge: "bg-teal-500/20 text-teal-50 ring-teal-400/30",
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
  back,
  heroVisual,
}: Props) {
  const a = accentStyles[accent];
  const contentShell = wide ? "gre-content-wide" : "gre-page-shell";

  return (
    <div className="public-site-bg flex min-h-screen min-h-[100dvh] flex-col overflow-x-hidden">
      <PublicNav />
      <section className={`relative overflow-hidden ${a.hero}`}>
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.12]"
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
          className={`relative mx-auto ${contentShell} px-4 sm:px-6 ${
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
          <div
            className={`flex flex-col gap-4 ${
              compactHero ? "sm:flex-row sm:items-start sm:gap-5" : "sm:flex-row sm:items-start sm:gap-6"
            }`}
          >
            {heroVisual ? <div className="mx-auto shrink-0 sm:mx-0">{heroVisual}</div> : null}
            <div className={`min-w-0 ${heroVisual ? "text-center sm:text-left" : ""}`}>
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
                className={`gre-display max-w-4xl font-bold tracking-tight text-white ${
                  compactHero
                    ? "text-2xl sm:text-3xl lg:text-4xl"
                    : "text-4xl sm:text-5xl lg:text-6xl"
                }`}
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className={`gre-readable max-w-2xl text-white/80 ${
                    compactHero
                      ? "mt-2 text-sm sm:text-base"
                      : "mt-5 text-lg sm:text-xl"
                  }`}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
        <div
          className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#f8fafc] to-transparent ${
            compactHero ? "h-8" : "h-16"
          }`}
        />
      </section>

      <main
        className={`relative z-10 mx-auto w-full flex-1 px-4 pb-16 sm:px-6 ${contentShell}`}
        style={{ marginTop: compactHero ? "-1.25rem" : "-2.5rem" }}
      >
        <div className="animate-fade-up">
          {back && <PageBackLink to={back.to} label={back.label} className="mb-6" />}
          {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
