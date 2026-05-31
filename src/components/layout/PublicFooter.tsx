import {
  ArrowUpRight,
  BarChart3,
  Calendar,
  Globe2,
  LayoutDashboard,
  LogIn,
  Map,
  MessageSquare,
  UserPlus,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BrandMark } from "../brand/BrandMark";

const exploreLinks = [
  { to: "/about", label: "About", icon: Globe2 },
  { to: "/statistics", label: "Statistics", icon: BarChart3 },
  { to: "/rankings", label: "Rankings", icon: BarChart3 },
  { to: "/events", label: "Events", icon: Calendar },
  { to: "/forum", label: "Forum", icon: MessageSquare },
  { to: "/contact", label: "Contact", icon: MessageSquare },
];

interface Props {
  variant?: "full" | "compact";
  publicationCount?: number;
}

export function PublicFooter({ variant = "full", publicationCount }: Props) {
  if (variant === "compact") {
    const year = new Date().getFullYear();
    const showCount =
      publicationCount !== undefined && publicationCount > 0;

    return (
      <footer className="safe-bottom relative z-[1002] shrink-0 bg-slate-900/90 px-3 py-2.5 text-white backdrop-blur-md sm:px-5">
        <div
          className={`gre-content-wide mx-auto flex flex-wrap items-center gap-x-4 gap-y-2 text-xs ${
            showCount ? "justify-between" : "justify-end"
          }`}
        >
          {showCount && (
            <p className="min-w-0 text-white/55">
              {publicationCount} publication{publicationCount !== 1 ? "s" : ""} on map
            </p>
          )}
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            <span className="text-white/35">© {year}</span>
            <Link
              to="/register"
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20 sm:py-1"
            >
              Join
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto overflow-hidden bg-slate-950 text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(59, 91, 219, 0.18) 0%, transparent 45%),
            radial-gradient(circle at 80% 60%, rgba(20, 184, 166, 0.12) 0%, transparent 40%),
            linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.4) 100%)
          `,
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/60 to-transparent" />

      <div className="gre-content-wide relative mx-auto px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Link to="/" className="group inline-flex items-center gap-4">
              <span className="rounded-2xl ring-1 ring-white/10 transition group-hover:ring-teal-400/40">
                <BrandMark symbol="full" variant="gradient" size="md" />
              </span>
              <div>
                <p className="text-xl font-bold tracking-tight">Global Research Exchange</p>
                <p className="mt-0.5 text-sm text-teal-300/80">Connecting research worldwide</p>
              </div>
            </Link>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/55">
              Discover geolocated publications on an interactive world map, join discipline forums,
              and share your work with researchers across the globe.
            </p>

            {publicationCount !== undefined && publicationCount > 0 && (
              <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 ring-1 ring-white/10">
                <Map className="h-3.5 w-3.5 text-teal-400" />
                {publicationCount.toLocaleString()} studies on the live map
              </p>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-white/8 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/12 transition hover:bg-white/12"
              >
                <Map className="h-4 w-4 text-teal-300" />
                Open research map
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-900/30 transition hover:brightness-110"
              >
                Get started
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/8 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                  Explore
                </p>
                <ul className="mt-4 grid gap-1">
                  <li>
                    <Link
                      to="/"
                      className="group flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-white/65 transition hover:bg-white/5 hover:text-teal-300"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600/20 text-brand-300">
                        <Map className="h-4 w-4" />
                      </span>
                      Research map
                    </Link>
                  </li>
                  {exploreLinks.map(({ to, label, icon: Icon }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="group flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-white/65 transition hover:bg-white/5 hover:text-teal-300"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/50 transition group-hover:bg-teal-500/15 group-hover:text-teal-300">
                          <Icon className="h-4 w-4" />
                        </span>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex-1 rounded-2xl bg-gradient-to-br from-brand-600/20 via-transparent to-teal-500/15 p-5 ring-1 ring-white/10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                    Account
                  </p>
                  <div className="mt-4 space-y-2">
                    <Link
                      to="/login"
                      className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      <span className="inline-flex items-center gap-2">
                        <LogIn className="h-4 w-4 text-teal-300" />
                        Sign in
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-white/40" />
                    </Link>
                    <Link
                      to="/register"
                      className="flex items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                    >
                      <span className="inline-flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-brand-600" />
                        Create account
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-slate-400" />
                    </Link>
                    <Link
                      to="/dashboard"
                      className="flex items-center justify-between gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white/80 ring-1 ring-white/15 transition hover:bg-white/5 hover:text-white"
                    >
                      <span className="inline-flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4 text-brand-300" />
                        Author dashboard
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-white/30" />
                    </Link>
                  </div>
                </div>

                <p className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-center text-xs leading-relaxed text-white/45">
                  <span className="bg-gradient-to-r from-brand-300 to-teal-300 bg-clip-text font-semibold text-transparent">
                    Built for researchers, by researchers.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-xs text-white/40">
              © {year} Global Research Exchange. All rights reserved.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-white/40">
            <Link to="/contact" className="transition hover:text-teal-300">
              Contact
            </Link>
            <span className="text-white/20" aria-hidden>
              ·
            </span>
            <Link to="/about" className="transition hover:text-teal-300">
              About GRE
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
