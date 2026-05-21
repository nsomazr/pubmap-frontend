import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  Plus,
  Settings,
  Shield,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { BrandMark } from "../brand/BrandMark";
import { assets } from "../../lib/brand";
import { useUnreadCounts } from "../../hooks/useUnreadCounts";
import type { User } from "../../types";

const mainNav: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/publications", label: "Publications", icon: FileText, end: true },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/account", label: "Account", icon: Settings },
];

const adminNav: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/dashboard/operations", label: "Operations", icon: Shield },
  { to: "/dashboard/review", label: "Review queue", icon: ClipboardCheck },
  { to: "/dashboard/authors", label: "Users", icon: Users },
  { to: "/dashboard/categories", label: "Categories", icon: BookOpen },
  { to: "/dashboard/events", label: "Events", icon: Calendar },
  { to: "/dashboard/ads", label: "Ads", icon: Megaphone },
];

interface Props {
  collapsed: boolean;
  showLabels: boolean;
  isAdmin: boolean;
  user: User | null;
  sidebarW: string;
  isMobile: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  showLabels,
  onNavigate,
  badge,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  showLabels: boolean;
  onNavigate: () => void;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={showLabels ? undefined : label}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group relative flex items-center rounded-xl text-sm font-medium transition-all duration-200 ${
          showLabels ? "gap-3 px-3 py-2.5" : "mx-auto h-11 w-11 justify-center"
        } ${
          isActive
            ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25 ring-1 ring-brand-500/50"
            : "text-slate-400 hover:bg-white/[0.07] hover:text-white"
        }`
      }
    >
      <span className="relative shrink-0">
        <Icon className="h-[18px] w-[18px]" />
        {badge != null && badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white ring-2 ring-[#0f1218]">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      {showLabels && <span className="truncate">{label}</span>}
      {!showLabels && (
        <span className="pointer-events-none absolute left-[calc(100%+0.5rem)] top-1/2 z-[60] hidden -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-white shadow-lg group-hover:block group-focus-visible:block">
          {label}
        </span>
      )}
    </NavLink>
  );
}

export function DashboardSidebar({
  collapsed,
  showLabels,
  isAdmin,
  user,
  sidebarW,
  isMobile,
  mobileOpen,
  onCloseMobile,
  onToggleCollapse,
  onLogout,
}: Props) {
  const { data: unread } = useUnreadCounts();
  const messageBadge = unread?.messages ?? 0;
  const photoUrl = user?.photo?.startsWith("http") ? user.photo : user?.photo || assets.logo;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[#0f1218] text-white shadow-xl transition-all duration-300 ease-out ${
        isMobile ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : ""
      }`}
      style={{ width: sidebarW }}
      aria-label="Dashboard navigation"
    >
      <div
        className={`flex shrink-0 items-center border-b border-white/[0.06] ${
          showLabels ? "gap-3 px-4 py-4" : "justify-center px-2 py-4"
        }`}
      >
        <Link to="/" onClick={onCloseMobile} className="flex min-w-0 items-center gap-3" title="Home">
          <BrandMark symbol="full" variant="dark" size="sm" />
          {showLabels && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">GRE</p>
              <p className="truncate text-[10px] uppercase tracking-wider text-white/40">
                Dashboard
              </p>
            </div>
          )}
        </Link>
      </div>

      <Link
        to="/dashboard/account"
        onClick={onCloseMobile}
        title="Your account"
        className={`mx-3 mt-4 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.08] transition hover:bg-white/[0.06] ${
          showLabels ? "flex items-center gap-3 p-3" : "mx-auto flex h-11 w-11 items-center justify-center"
        }`}
      >
        <img
          src={photoUrl}
          alt=""
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-brand-500/40"
        />
        {showLabels && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {user?.firstname} {user?.lastname}
            </p>
            <p className="truncate text-xs text-white/45">
              {user?.area_of_study?.trim() || (isAdmin ? "Administrator" : "Author")}
            </p>
          </div>
        )}
      </Link>

      <div className={showLabels ? "px-3 pt-3" : "flex justify-center px-2 pt-3"}>
        <Link
          to="/dashboard/publications/new"
          onClick={onCloseMobile}
          title="New publication"
          className={`flex items-center rounded-xl bg-brand-600 font-semibold text-white transition hover:bg-brand-500 ${
            showLabels
              ? "w-full gap-2 px-3 py-2.5 text-sm shadow-lg shadow-brand-600/30"
              : "h-11 w-11 justify-center shadow-lg shadow-brand-600/30"
          }`}
        >
          <Plus className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          {showLabels && <span>New publication</span>}
        </Link>
      </div>

      <nav className="mt-5 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 pb-2">
        {showLabels && (
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">
            Workspace
          </p>
        )}
        {!showLabels && <div className="mb-2 border-t border-white/[0.06]" />}
        {mainNav.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            showLabels={showLabels}
            onNavigate={onCloseMobile}
            badge={item.to === "/dashboard/messages" ? messageBadge : undefined}
          />
        ))}

        {isAdmin && (
          <>
            {showLabels ? (
              <p className="mb-2 mt-6 px-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/25">
                Administration
              </p>
            ) : (
              <div className="my-3 border-t border-white/[0.08]" />
            )}
            {adminNav.map((item) => (
              <NavItem key={item.to} {...item} showLabels={showLabels} onNavigate={onCloseMobile} />
            ))}
          </>
        )}
      </nav>

      <div className="shrink-0 space-y-1 border-t border-white/[0.06] p-3">
        {!isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`flex w-full items-center rounded-xl text-sm text-white/50 transition hover:bg-white/[0.06] hover:text-white ${
              showLabels ? "gap-2 px-3 py-2" : "h-11 justify-center"
            }`}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronLeft className="h-4 w-4 shrink-0" />
            )}
            {showLabels && <span>{collapsed ? "Expand menu" : "Collapse menu"}</span>}
          </button>
        )}
        <Link
          to="/"
          onClick={onCloseMobile}
          title="Public research map"
          className={`flex items-center rounded-xl text-sm text-white/50 transition hover:bg-white/[0.06] hover:text-white ${
            showLabels ? "gap-2 px-3 py-2" : "mx-auto h-11 w-11 justify-center"
          }`}
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {showLabels && "Explore map"}
        </Link>
        <button
          type="button"
          onClick={onLogout}
          title="Sign out"
          className={`flex items-center rounded-xl text-sm text-white/50 transition hover:bg-red-500/15 hover:text-red-300 ${
            showLabels ? "w-full gap-2 px-3 py-2" : "mx-auto h-11 w-11 justify-center"
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {showLabels && "Sign out"}
        </button>
      </div>
    </aside>
  );
}
