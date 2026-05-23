import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { partneringUniversity } from "../../lib/brand";
import { BrandMark } from "../brand/BrandMark";

const exploreLinks = [
  { to: "/about", label: "About" },
  { to: "/events", label: "Events" },
  { to: "/forum", label: "Forum" },
  { to: "/contact", label: "Contact" },
];

interface Props {
  variant?: "full" | "compact";
  publicationCount?: number;
}

export function PublicFooter({ variant = "full", publicationCount }: Props) {
  if (variant === "compact") {
    return (
      <footer className="safe-bottom relative z-[1002] shrink-0 bg-slate-900/90 px-4 py-2.5 text-white backdrop-blur-md sm:px-5">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 text-xs">
          <Link to="/" className="flex items-center gap-2.5 font-semibold text-white/90">
            <BrandMark symbol="full" variant="dark" size="sm" />
            <span className="hidden sm:inline">GRE</span>
          </Link>
          {publicationCount !== undefined && publicationCount > 0 && (
            <span className="text-white/50">
              {publicationCount} publication{publicationCount !== 1 ? "s" : ""} on map
            </span>
          )}
          <div className="flex items-center gap-3">
            <span className="hidden text-white/35 sm:inline">© {new Date().getFullYear()}</span>
            <Link
              to="/register"
              className="inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              Join
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative mt-auto overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />
      <div
        className="absolute -left-40 top-0 h-64 w-64 rounded-full bg-brand-600/10 blur-3xl"
        aria-hidden
      />
      <div
        className="absolute -right-20 bottom-0 h-48 w-48 rounded-full bg-teal-500/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1600px] px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div>
            <Link to="/" className="inline-flex items-center gap-4">
              <BrandMark symbol="full" variant="gradient" size="lg" />
              <div>
                <p className="text-lg font-bold">Global Research Exchange</p>
                <p className="text-sm text-white/45">Connecting research worldwide</p>
              </div>
            </Link>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/55">
              Discover geolocated publications on an interactive world map, join discipline forums,
              and share your work with researchers across the globe.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 hover:bg-white/15"
              >
                Open research map
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-600 px-5 py-2.5 text-sm font-bold text-white"
              >
                Get started
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Explore</p>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link to="/" className="text-sm text-white/60 hover:text-teal-300">
                    Research map
                  </Link>
                </li>
                {exploreLinks.map(({ to, label }) => (
                  <li key={to}>
                    <Link to={to} className="text-sm text-white/60 hover:text-teal-300">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Account</p>
              <ul className="mt-5 space-y-3">
                <li>
                  <Link to="/login" className="text-sm text-white/60 hover:text-teal-300">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="text-sm text-white/60 hover:text-teal-300">
                    Create account
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className="text-sm text-white/60 hover:text-teal-300">
                    Author dashboard
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <div className="text-center sm:text-left">
            <p className="text-xs text-white/40">
              © {new Date().getFullYear()} Global Research Exchange. All rights reserved.
            </p>
            <p className="mt-1 text-xs text-white/35">
              Partnering university:{" "}
              <span className="font-medium text-white/55">{partneringUniversity}</span>
            </p>
          </div>
          <p className="bg-gradient-to-r from-brand-400 to-teal-400 bg-clip-text text-xs font-medium text-transparent">
            Built for researchers, by researchers.
          </p>
        </div>
      </div>
    </footer>
  );
}
