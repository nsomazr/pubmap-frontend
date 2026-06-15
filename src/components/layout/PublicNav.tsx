import { LayoutDashboard, LogIn, Menu, UserPlus } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { buildLoginPath, buildRegisterPath } from "../../lib/authRedirect";
import { BrandMark } from "../brand/BrandMark";
import { PUBLIC_NAV_LINKS, PublicMobileMenu } from "./PublicMobileMenu";

interface Props {
  variant?: "map" | "default";
}

export function PublicNav({ variant = "default" }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const loginPath = buildLoginPath(`${location.pathname}${location.search}`);
  const registerPath = buildRegisterPath(`${location.pathname}${location.search}`);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isMap = variant === "map";

  const navLinkClass = (isActive: boolean) =>
    isActive
      ? "text-ink font-semibold"
      : "text-slate-500 hover:text-ink";

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
                className="flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-ink transition hover:border-slate-300 hover:bg-slate-50 sm:px-4"
              >
                <LayoutDashboard className="h-4 w-4 shrink-0" />
                <span className="hidden min-[380px]:inline">Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  to={loginPath}
                  className="hidden h-10 items-center rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:flex"
                >
                  Login
                </Link>
                <Link
                  to={registerPath}
                  className="hidden h-10 items-center rounded-lg bg-brand-600 px-3.5 text-sm font-medium text-white transition hover:bg-brand-700 sm:flex"
                >
                  Join
                </Link>
              </>
            )}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 transition hover:bg-slate-50 sm:px-4"
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
      <header className="sticky top-0 z-[1100] shrink-0 border-b border-slate-200 bg-white safe-top">
        <div className="gre-content-wide mx-auto flex h-14 items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="group flex min-w-0 shrink-0 items-center gap-3">
            <BrandMark
              symbol="full"
              variant="plain"
              size="md"
              className="transition group-hover:opacity-90"
            />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-semibold tracking-tight text-ink">GRE</p>
              <p className="truncate text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Research Exchange
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {PUBLIC_NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `rounded-lg px-3.5 py-2 text-sm font-medium transition ${navLinkClass(isActive)}`
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
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-slate-50"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-ink"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to={loginPath}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  Login
                </Link>
                <Link
                  to={registerPath}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
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
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-medium text-ink sm:text-sm"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden min-[380px]:inline">Dashboard</span>
              </Link>
            )}
            {!user && (
              <Link
                to={loginPath}
                className="inline-flex h-10 items-center rounded-lg px-3 text-xs font-medium text-brand-700 sm:text-sm"
              >
                Login
              </Link>
            )}
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-ink transition hover:bg-slate-50"
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
