import { LayoutDashboard, LogIn, Menu, UserPlus, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { BrandMark } from "../brand/BrandMark";

const links = [
  { to: "/", label: "Map" },
  { to: "/statistics", label: "Statistics" },
  { to: "/rankings", label: "Rankings" },
  { to: "/about", label: "About" },
  { to: "/events", label: "Events" },
  { to: "/forum", label: "Forum" },
  { to: "/contact", label: "Contact" },
];

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

  if (isMap) {
    return (
      <>
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-[1200] flex items-center justify-between gap-3 p-3 safe-top sm:p-4">
          <BrandMark
            to="/"
            symbol="full"
            variant="float"
            size="md"
            className="pointer-events-auto shrink-0 transition hover:scale-[1.02]"
          />

          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="pointer-events-auto flex h-11 items-center justify-center gap-2 rounded-full bg-white px-4 shadow-[0_8px_28px_-6px_rgba(15,23,42,0.35)] ring-2 ring-white transition hover:scale-[1.02]"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5 text-ink" />
            <span className="text-sm font-semibold text-ink">Menu</span>
          </button>
        </div>

        {mobileOpen && (
          <div className="fixed inset-0 z-[1200]">
            <button
              type="button"
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute inset-y-0 right-0 flex w-[min(100%,320px)] flex-col bg-white shadow-2xl safe-top safe-bottom">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                <BrandMark symbol="full" variant="gradient" size="sm" />
                <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-3">
                {links.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3 text-sm font-semibold ${
                        isActive ? "bg-brand-50 text-brand-700" : "text-slate-700 hover:bg-slate-50"
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                ))}
              </nav>
              <div className="space-y-2 border-t border-slate-100 p-3">
                {user ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        handleLogout();
                        setMobileOpen(false);
                      }}
                      className="w-full rounded-xl py-2.5 text-sm text-slate-500 hover:bg-slate-50"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl py-3 text-center text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-xl bg-brand-600 py-3 text-center text-sm font-semibold text-white"
                    >
                      Join free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <header className="sticky top-0 z-[1100] shrink-0 border-b border-slate-200/60 bg-white/90 shadow-sm backdrop-blur-2xl">
        <div className="mx-auto flex h-[4.25rem] max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-[4.5rem]">
          <Link to="/" className="group flex shrink-0 items-center gap-3">
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
            {links.map(({ to, label }) => (
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

          <button
            type="button"
            className="rounded-xl p-2.5 text-ink ring-1 ring-slate-200 md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-[1200] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[min(100%,340px)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-4">
              <span className="font-bold text-ink">Menu</span>
              <button type="button" onClick={() => setMobileOpen(false)} className="p-2">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {links.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/"}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3.5 text-sm font-semibold ${
                      isActive ? "bg-gradient-to-r from-brand-600 to-teal-600 text-white" : "text-slate-700"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
            <div className="space-y-2 border-t p-4">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl bg-slate-900 py-3.5 text-center text-sm font-semibold text-white"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl border py-3.5 text-center text-sm font-semibold"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-xl bg-gradient-to-r from-brand-600 to-teal-600 py-3.5 text-center text-sm font-semibold text-white"
                  >
                    Join free
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
