import { LayoutDashboard, LogIn, Menu, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { BrandMark } from "../brand/BrandMark";
import { PUBLIC_NAV_LINKS, PublicMobileMenu } from "./PublicMobileMenu";

interface Props {
  variant?: "map" | "default";
}

export function PublicNav({ variant = "default" }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isMap = variant === "map";

  const navLinkClass = (isActive: boolean) =>
    isActive
      ? "bg-gradient-to-r from-brand-600 to-teal-600 text-white shadow-md"
      : "text-slate-600 hover:text-ink";

  const mobileMenu = (
    <PublicMobileMenu
      open={mobileOpen}
      onClose={() => setMobileOpen(false)}
      user={user}
      onLogout={handleLogout}
      variant={variant}
    />
  );

  if (isMap) {
    return (
      <>
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-[1200] flex items-center justify-between gap-2 p-3 safe-top sm:gap-3 sm:p-4">
          <BrandMark
            to="/"
            symbol="full"
            variant="float"
            size="md"
            className="pointer-events-auto shrink-0 transition hover:scale-[1.02]"
          />

          <div className="pointer-events-auto flex min-w-0 items-center gap-2">
            {user ? (
              <Link
                to="/dashboard"
                className="flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-full bg-slate-900 px-3.5 text-sm font-semibold text-white shadow-[0_8px_28px_-6px_rgba(15,23,42,0.35)] ring-2 ring-white transition hover:bg-slate-800 sm:px-4"
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span className="hidden min-[380px]:inline">Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden h-11 items-center rounded-full bg-white/95 px-3.5 text-sm font-semibold text-slate-700 shadow-lg ring-2 ring-white sm:flex"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="hidden h-11 items-center rounded-full bg-brand-600 px-3.5 text-sm font-semibold text-white shadow-lg ring-2 ring-white sm:flex"
                >
                  Join
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-11 items-center justify-center gap-2 rounded-full bg-white px-3.5 shadow-[0_8px_28px_-6px_rgba(15,23,42,0.35)] ring-2 ring-white transition hover:scale-[1.02] sm:px-4"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5 text-ink" />
              <span className="text-sm font-semibold text-ink">Menu</span>
            </button>
          </div>
        </div>
        {mobileMenu}
      </>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-[1100] shrink-0 border-b border-slate-200/60 bg-white/90 shadow-sm backdrop-blur-2xl safe-top">
        <div className="gre-content-wide mx-auto flex h-[3.5rem] items-center justify-between gap-3 px-4 sm:h-[4rem] sm:gap-4 sm:px-6">
          <Link to="/" className="group flex min-w-0 shrink-0 items-center gap-3">
            <BrandMark
              symbol="full"
              variant="gradient"
              size="md"
              className="transition group-hover:scale-[1.02]"
            />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-bold tracking-tight text-ink">GRE</p>
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                Research Exchange
              </p>
            </div>
          </Link>

          <nav className="hidden items-center rounded-2xl bg-slate-100/80 p-1 ring-1 ring-slate-200/80 md:flex">
            {PUBLIC_NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `relative rounded-xl px-4 py-2 text-sm font-semibold transition-all ${navLinkClass(isActive)}`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden items-center gap-2 sm:flex">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
                >
                  <UserPlus className="h-4 w-4" />
                  Join free
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            {user && (
              <Link
                to="/dashboard"
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-900 px-3 text-xs font-semibold text-white sm:text-sm"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden min-[380px]:inline">Dashboard</span>
              </Link>
            )}
            {!user && (
              <Link
                to="/login"
                className="inline-flex h-10 items-center rounded-xl px-3 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 sm:text-sm"
              >
                Login
              </Link>
            )}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-ink ring-1 ring-slate-200"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>
      {mobileMenu}
    </>
  );
}
