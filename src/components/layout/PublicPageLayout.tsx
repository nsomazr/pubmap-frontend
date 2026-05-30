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
export type PublicHeroVariant = "clean" | "premium";

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
  /** clean = light header (default); premium = dark gradient band */
  heroVariant?: PublicHeroVariant;
  /** Optional back link rendered above page content, aligned with the hero. */
  back?: PageBack;
  /** Optional visual shown beside the hero heading. */
  heroVisual?: React.ReactNode;
  /** Fill the viewport; main content scrolls inside children (e.g. research assistant). */
  fillViewport?: boolean;
  /** Less hero chrome on small screens when fillViewport (more room for chat). */
  denseMobileHero?: boolean;
  /** Full-height manuscript assistant: minimal hero on mobile, chat fills viewport. */
  workspaceMode?: "chat";
}

const premiumAccent: Record<
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

const cleanBadge: Record<PageAccent, string> = {
  blue: "bg-brand-50 text-brand-800 ring-brand-200/80",
  teal: "bg-teal-50 text-teal-900 ring-teal-200/80",
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
  heroVariant = "clean",
  back,
  heroVisual,
  fillViewport = false,
  denseMobileHero = false,
  workspaceMode,
}: Props) {
  const isChatWorkspace = workspaceMode === "chat";
  const contentShell = wide ? "gre-content-wide" : "gre-page-shell";
  const isClean = heroVariant === "clean";
  const padY =
    compactHero && fillViewport && denseMobileHero
      ? "pb-3 pt-3 sm:pb-6 sm:pt-6"
      : compactHero
        ? "pb-5 pt-5 sm:pb-6 sm:pt-6"
        : "pb-10 pt-8 sm:pb-12 sm:pt-10";

  const crumbMargin = compactHero ? "mb-3" : "mb-5";
  const titleSize = compactHero
    ? "text-2xl sm:text-3xl lg:text-[2rem]"
    : "text-3xl sm:text-4xl lg:text-5xl";
  const subtitleSize = compactHero ? "mt-2 text-sm sm:text-base" : "mt-4 text-base sm:text-lg";

  const heroContent = (
    <div
      className={`relative mx-auto ${contentShell} px-4 sm:px-6 ${padY}`}
    >
      {crumbs && crumbs.length > 0 && (
        <nav
          className={`flex flex-wrap items-center gap-1.5 ${crumbMargin} ${
            isChatWorkspace ? "hidden md:flex" : ""
          }`}
        >
          {crumbs.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-sm">
              {i > 0 && (
                <ChevronRight
                  className={`h-3.5 w-3.5 ${isClean ? "text-slate-300" : "text-white/40"}`}
                />
              )}
              {c.to ? (
                <Link
                  to={c.to}
                  className={
                    isClean
                      ? "font-medium text-slate-500 transition hover:text-brand-700"
                      : "font-medium text-white/70 transition hover:text-white"
                  }
                >
                  {c.label}
                </Link>
              ) : (
                <span
                  className={
                    isClean ? "font-medium text-slate-700" : "font-medium text-white/90"
                  }
                >
                  {c.label}
                </span>
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
              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest ring-1 ${
                isClean ? cleanBadge[accent] : premiumAccent[accent].badge
              } ${compactHero ? "mb-2" : "mb-3"} ${isChatWorkspace ? "hidden md:inline-flex" : ""}`}
            >
              {badge}
            </span>
          )}
          <h1
            className={`gre-display max-w-4xl font-bold tracking-tight ${
              isClean ? "text-ink" : "text-white"
            } ${titleSize} ${isChatWorkspace ? "hidden md:block" : ""}`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`gre-readable max-w-2xl ${
                isClean ? "text-slate-600" : "text-white/80"
              } ${subtitleSize} ${
                denseMobileHero && fillViewport ? "hidden md:block" : ""
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`public-site-bg flex flex-col overflow-x-hidden ${
        fillViewport
          ? "h-[100dvh] max-h-[100dvh] overflow-hidden"
          : "min-h-screen min-h-[100dvh]"
      }${isChatWorkspace ? " public-site--chat-workspace" : ""}`}
    >
      <PublicNav />

      {isClean ? (
        <section
          className={`gre-public-hero relative border-b border-slate-200/90 bg-white ${
            isChatWorkspace ? "hidden md:block" : ""
          }`}
        >
          <div className="gre-public-hero__accent" aria-hidden />
          {heroContent}
        </section>
      ) : (
        <section className={`relative overflow-hidden ${premiumAccent[accent].hero}`}>
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
            aria-hidden
          />
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
          <div
            className={`absolute -left-24 top-0 rounded-full blur-3xl ${premiumAccent[accent].orb1} ${
              compactHero ? "h-40 w-40" : "h-72 w-72"
            }`}
            aria-hidden
          />
          <div
            className={`absolute -right-16 bottom-0 rounded-full blur-3xl ${premiumAccent[accent].orb2} ${
              compactHero ? "h-44 w-44" : "h-80 w-80"
            }`}
            aria-hidden
          />
          {heroContent}
          <div
            className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#f8fafc] to-transparent ${
              compactHero ? "h-8" : "h-16"
            }`}
          />
        </section>
      )}

      <main
        className={`relative z-10 mx-auto flex w-full flex-1 flex-col ${contentShell} ${
          isChatWorkspace
            ? "min-h-0 overflow-hidden px-0 pb-0 pt-0 sm:px-6 sm:pb-4 sm:pt-5"
            : fillViewport
              ? "min-h-0 overflow-hidden px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5"
              : "px-4 pb-16 pt-6 sm:px-6 sm:pt-8"
        }`}
      >
        <div
          className={`animate-fade-up ${
            fillViewport ? "flex min-h-0 flex-1 flex-col" : ""
          }`}
        >
          {back && (
            <PageBackLink
              to={back.to}
              label={back.label}
              className={
                isChatWorkspace
                  ? "mb-3 hidden shrink-0 sm:inline-flex"
                  : fillViewport
                    ? denseMobileHero
                      ? "mb-2 shrink-0"
                      : "mb-3 shrink-0"
                    : "mb-6"
              }
            />
          )}
          {children}
        </div>
      </main>
      {!fillViewport && <PublicFooter />}
    </div>
  );
}
