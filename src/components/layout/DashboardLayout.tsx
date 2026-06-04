import { ChevronRight, ExternalLink, Menu, X } from "lucide-react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { RouteLoadingFallback } from "../navigation/RouteLoadingFallback";
import { useAuth } from "../../context/AuthContext";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { NotificationBell } from "../dashboard/NotificationBell";
import { DashboardSidebar } from "./DashboardSidebar";
import { canAccessReviewQueue, isPlatformAdmin } from "../../lib/userAccess";

const SIDEBAR_KEY = "gre-sidebar-collapsed";
const EXPANDED_W = "16.5rem";
const COLLAPSED_W = "5.25rem";

function breadcrumbLabel(pathname: string): string {
  if (pathname.includes("/publications/new")) return "New publication";
  if (pathname.includes("/meetings/new")) return "New meeting";
  if (pathname.includes("/meetings")) return "Meetings";
  if (pathname.includes("/publications")) return "Publications";
  if (pathname.includes("/messages")) return "Messages";
  if (pathname.includes("/account")) return "Account";
  if (pathname.includes("/review")) return "Review queue";
  if (pathname.includes("/authors")) return "Users";
  if (pathname.includes("/categories")) return "Fields";
  if (pathname.includes("/managers")) return "Managers";
  if (pathname.includes("/events")) return "Events";
  if (pathname.includes("/plagiarism")) return "Plagiarism";
  if (pathname.includes("/ads")) return "Ads";
  if (pathname.includes("/operations")) return "Operations";
  if (pathname.includes("/llm-settings")) return "LLM provider";
  return "Overview";
}

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAdmin = isPlatformAdmin(user);
  const canReview = canAccessReviewQueue(user);
  const isMobile = useIsMobile(1024);

  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  const persistCollapsed = useCallback((value: boolean) => {
    setCollapsed(value);
    try {
      localStorage.setItem(SIDEBAR_KEY, String(value));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapse = () => {
    if (isMobile) setMobileOpen((o) => !o);
    else persistCollapsed(!collapsed);
  };

  const closeMobile = () => setMobileOpen(false);
  const showLabels = isMobile ? mobileOpen : !collapsed;
  const sidebarW = isMobile ? EXPANDED_W : collapsed ? COLLAPSED_W : EXPANDED_W;

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  useEffect(() => {
    import("../../lib/routePrefetch").then(({ prefetchLikelyDashboardRoutes }) => {
      prefetchLikelyDashboardRoutes();
    });
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-bg flex min-h-screen">
      {isMobile && mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-ink/60 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={closeMobile}
        />
      )}

      <DashboardSidebar
        collapsed={collapsed}
        showLabels={showLabels}
        isAdmin={isAdmin}
        canReview={canReview}
        user={user}
        sidebarW={sidebarW}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onCloseMobile={closeMobile}
        onToggleCollapse={toggleCollapse}
        onLogout={handleLogout}
      />

      <main
        className="flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-300"
        style={{ marginLeft: isMobile ? 0 : sidebarW }}
      >
        <header className="dashboard-topbar sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 overflow-visible px-3 backdrop-blur-xl safe-top sm:gap-3 sm:px-6">
          <button
            type="button"
            onClick={toggleCollapse}
            className="gre-interactive flex h-11 w-11 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Toggle menu"
          >
            {isMobile && mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
            <span className="text-slate-400">Dashboard</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-300" />
            <span className="truncate font-medium text-ink">{breadcrumbLabel(pathname)}</span>
          </div>
          <NotificationBell />
          <Link
            to="/"
            className="gre-interactive inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50 sm:px-3"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden min-[420px]:inline">Map</span>
          </Link>
        </header>

        <div className="flex-1 overflow-x-hidden px-3 py-4 sm:p-6 lg:p-8">
          <div className="gre-dashboard-shell gre-page-shell gre-page-with-fab mx-auto min-h-[calc(100vh-8rem)] w-full max-w-full">
            <Suspense fallback={<RouteLoadingFallback label="Loading…" />}>
              <Outlet />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
