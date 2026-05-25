import { LayoutDashboard, LogIn, LogOut, UserPlus, X } from "lucide-react";
import { useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { BrandMark } from "../brand/BrandMark";
import { GreAvatarSlot } from "../ui/GreHeroBanner";
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
  variant = "default",
}: Props) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
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
    `flex min-h-[44px] items-center rounded-xl px-4 py-3 text-[15px] font-semibold transition ${
      isActive
        ? variant === "map"
          ? "bg-brand-50 text-brand-700 ring-1 ring-brand-100"
          : "bg-gradient-to-r from-brand-600 to-teal-600 text-white shadow-md"
        : "text-slate-700 hover:bg-slate-50 active:bg-slate-100"
    }`;

  return (
    <div className="fixed inset-0 z-[1200]" role="dialog" aria-modal="true" aria-label="Site menu">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div className="public-mobile-menu absolute inset-y-0 right-0 flex w-[min(100%,20rem)] flex-col bg-white shadow-2xl safe-top safe-bottom">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
          <BrandMark symbol="full" variant="gradient" size="sm" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-ink"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {user && (
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="mb-3 flex items-center gap-3">
              <GreAvatarSlot
                photoUrl={user.photo}
                initials={userInitials(user)}
                size="sm"
                className="h-11 w-11 border-2 border-brand-200"
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
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <LayoutDashboard className="h-4 w-4" />
              Back to dashboard
            </Link>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Explore GRE
          </p>
          <div className="space-y-1">
            {PUBLIC_NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                onClick={onClose}
                className={({ isActive }) => navLinkClass(isActive)}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="space-y-2 border-t border-slate-100 p-4">
          {user ? (
            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          ) : (
            <>
              <Link
                to="/login"
                onClick={onClose}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <LogIn className="h-4 w-4" />
                Login
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-600 py-3 text-sm font-semibold text-white shadow-sm"
              >
                <UserPlus className="h-4 w-4" />
                Join free
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
