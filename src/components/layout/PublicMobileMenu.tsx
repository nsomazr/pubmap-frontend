import { LayoutDashboard, LogIn, LogOut, UserPlus, X } from "lucide-react";
import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { BrandMark } from "../brand/BrandMark";
import { GreAvatarSlot } from "../ui/GreHeroBanner";
import { buildLoginPath, buildRegisterPath } from "../../lib/authRedirect";
import { userInitials } from "../../lib/userDisplay";
import type { User } from "../../types";

export const PUBLIC_NAV_LINKS = [
  { to: "/", label: "Map" },
  { to: "/about", label: "About" },
  { to: "/statistics", label: "Statistics" },
  { to: "/rankings", label: "Rankings" },
  { to: "/events", label: "Events" },
  { to: "/forum", label: "Forum" },
  { to: "/contact", label: "Contact" },
] as const;

interface Props {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onLogout: () => void;
  variant?: "map" | "default";
}

export function PublicMobileMenu({
  open,
  onClose,
  user,
  onLogout,
}: Props) {
  const location = useLocation();
  const loginPath = buildLoginPath(`${location.pathname}${location.search}`);
  const registerPath = buildRegisterPath(`${location.pathname}${location.search}`);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.setAttribute("data-gre-mobile-nav-open", "");
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.removeAttribute("data-gre-mobile-nav-open");
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const navLinkClass = (isActive: boolean) =>
    `flex min-h-[44px] items-center rounded-lg px-3 py-2.5 text-[15px] font-medium transition ${
      isActive
        ? "bg-slate-100 text-ink"
        : "text-slate-600 hover:bg-slate-50 active:bg-slate-100"
    }`;

  return (
    <div
      className="public-mobile-menu-root fixed inset-0 z-[2000]"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40"
        aria-label="Close menu"
        onClick={onClose}
      />

      <aside className="public-mobile-menu absolute inset-y-0 right-0 flex w-[min(100%,19rem)] max-w-full flex-col bg-white shadow-xl safe-top">
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
          <BrandMark symbol="full" variant="plain" size="md" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-ink"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {user ? (
          <div className="shrink-0 border-b border-slate-100 px-4 py-4">
            <div className="mb-3 flex items-center gap-3">
              <GreAvatarSlot
                photoUrl={user.photo}
                initials={userInitials(user)}
                size="sm"
                className="h-10 w-10 border border-slate-200"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {user.firstname} {user.lastname}
                </p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>
            </div>
            <Link
              to="/dashboard"
              onClick={onClose}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-ink transition hover:bg-slate-50"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          </div>
        ) : null}

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Explore
          </p>
          <ul className="space-y-0.5">
            {PUBLIC_NAV_LINKS.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={to === "/"}
                  onClick={onClose}
                  className={({ isActive }) => navLinkClass(isActive)}
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <footer className="public-mobile-menu__footer shrink-0 border-t border-slate-100 bg-white px-4 pt-3">
          {user ? (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Link
                to={loginPath}
                onClick={onClose}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <LogIn className="h-4 w-4 shrink-0" />
                Login
              </Link>
              <Link
                to={registerPath}
                onClick={onClose}
                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
              >
                <UserPlus className="h-4 w-4 shrink-0" />
                Join
              </Link>
            </div>
          )}
        </footer>
      </aside>
    </div>
  );
}
