import {
  BookOpen,
  Bot,
  Calendar,
  ChevronDown,
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
  Scale,
  Settings,
  Shield,
  UserCog,
  Users,
  Video,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { usePrefetchOnIntent } from "../navigation/navigationProgress";
import { BrandMark } from "../brand/BrandMark";
import { GreAvatarSlot } from "../ui/GreHeroBanner";
import { displayRoleName, userInitials } from "../../lib/userDisplay";
import { greUnreadBadge } from "../../lib/greTheme";
import { useUnreadCounts } from "../../hooks/useUnreadCounts";
import type { User } from "../../types";

const mainNav: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/publications", label: "Publications", icon: FileText, end: true },
  { to: "/dashboard/meetings", label: "Meetings", icon: Video },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/plagiarism", label: "Plagiarism", icon: Scale },
  { to: "/dashboard/account", label: "Account", icon: Settings },
];

const adminNav: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/dashboard/operations", label: "Operations", icon: Shield },
  { to: "/dashboard/llm-settings", label: "Assistant settings", icon: Bot },
  { to: "/dashboard/review", label: "Review", icon: ClipboardCheck },
  { to: "/dashboard/managers", label: "Managers", icon: UserCog },
  { to: "/dashboard/authors", label: "Users", icon: Users },
  { to: "/dashboard/categories", label: "Fields", icon: BookOpen },
  { to: "/dashboard/events", label: "Events", icon: Calendar },
  { to: "/dashboard/ads", label: "Ads", icon: Megaphone },
];

interface Props {
  collapsed: boolean;
  isAdmin: boolean;
  canReview: boolean;
  user: User | null;
  sidebarW: string;
  isMobile: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

const navItemMotion =
  "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]";

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  iconOnly,
  onNavigate,
  badge,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  iconOnly: boolean;
  onNavigate: () => void;
  badge?: number;
}) {
  const prefetch = usePrefetchOnIntent(to);
  return (
    <NavLink
      to={to}
      end={end}
      title={iconOnly ? label : undefined}
      onClick={onNavigate}
      onMouseEnter={prefetch.onMouseEnter}
      onFocus={prefetch.onFocus}
      className={({ isActive }) =>
        `group relative flex items-center overflow-hidden rounded-lg text-sm font-medium ${navItemMotion} ${
          iconOnly ? "mx-auto h-10 w-10 justify-center" : "gap-2.5 px-2.5 py-2"
        } ${
          isActive
            ? "bg-white/10 text-white"
            : "text-white/60 hover:bg-white/[0.06] hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {!iconOnly && isActive ? (
            <span
              className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand-400"
              aria-hidden
            />
          ) : null}
          <span className="relative shrink-0">
            <Icon className="h-[17px] w-[17px]" strokeWidth={isActive ? 2.25 : 2} />
            {badge != null && badge > 0 ? (
              <span
                className={`absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full ${greUnreadBadge} px-0.5 text-[8px] font-bold text-white ring-2 ring-[#12151c]`}
              >
                {badge > 9 ? "9+" : badge}
              </span>
            ) : null}
          </span>
          <span className="gre-dashboard-sidebar__fade-label truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function DashboardSidebar({
  collapsed,
  isAdmin,
  canReview,
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
  const [adminOpen, setAdminOpen] = useState(false);
  const iconOnly = !isMobile && collapsed;

  const displayName = [user?.firstname, user?.lastname].filter(Boolean).join(" ") || "Account";
  const role = isAdmin ? "Administrator" : canReview ? "Field manager" : displayRoleName(user?.role_name);

  return (
    <aside
      className={`gre-dashboard-sidebar fixed inset-y-0 left-0 z-50 flex flex-col overflow-x-hidden border-r border-white/[0.06] bg-[#12151c] text-white ${
        iconOnly ? "gre-dashboard-sidebar--icon-only" : ""
      } ${isMobile ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : ""}`}
      style={{ width: sidebarW }}
      aria-label="Dashboard navigation"
    >
      <div
        className={`flex shrink-0 items-center border-b border-white/[0.06] ${navItemMotion} ${
          iconOnly ? "justify-center px-2 py-3" : "justify-between gap-2 px-3 py-3"
        }`}
      >
        <Link
          to="/"
          onClick={onCloseMobile}
          className={`flex min-w-0 items-center ${iconOnly ? "" : "gap-2.5"}`}
          title="Home"
        >
          <BrandMark symbol="full" variant="dark" size="md" />
          <div className="gre-dashboard-sidebar__fade-block min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">GRE</p>
            <p className="truncate text-[11px] text-white/45">Dashboard</p>
          </div>
        </Link>
        {!iconOnly && !isMobile ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <Link
        to="/dashboard/account"
        onClick={onCloseMobile}
        title={iconOnly ? "Account" : undefined}
        className={`mx-3 mt-3 flex shrink-0 items-center rounded-lg ${navItemMotion} hover:bg-white/[0.06] ${
          iconOnly ? "justify-center px-2 py-2" : "gap-2.5 px-2 py-2"
        }`}
      >
        <GreAvatarSlot
          photoUrl={user?.photo}
          initials={userInitials(user)}
          size="sm"
          className={`shrink-0 ${iconOnly ? "!h-9 !w-9 !border-2" : "h-8 w-8"}`}
        />
        <div className="gre-dashboard-sidebar__fade-block min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{displayName}</p>
          <p className="truncate text-xs text-white/45">{role}</p>
        </div>
      </Link>

      <div
        className={`mx-3 mt-3 flex flex-col gap-2 ${iconOnly ? "items-center" : ""}`}
      >
        <Link
          to="/dashboard/publications/new"
          state={{ freshDraft: true }}
          onClick={onCloseMobile}
          title={iconOnly ? "New publication" : undefined}
          className={`inline-flex items-center justify-center rounded-lg bg-brand-600 text-xs font-semibold text-white ${navItemMotion} hover:bg-brand-500 ${
            iconOnly ? "h-10 w-10" : "gap-1.5 px-3 py-2"
          }`}
        >
          <Plus className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
          <span className="gre-dashboard-sidebar__fade-label">New publication</span>
        </Link>
        <Link
          to="/dashboard/meetings/new"
          onClick={onCloseMobile}
          title={iconOnly ? "New meet" : undefined}
          className={`inline-flex items-center justify-center rounded-lg bg-white/[0.08] text-xs font-semibold text-white ring-1 ring-white/10 ${navItemMotion} hover:bg-white/[0.12] ${
            iconOnly ? "h-10 w-10" : "gap-1.5 px-3 py-2"
          }`}
        >
          <Video className="h-3.5 w-3.5 shrink-0" />
          <span className="gre-dashboard-sidebar__fade-label">New meet</span>
        </Link>
      </div>

      <nav className="mt-4 min-h-0 flex-1 overflow-y-auto px-2.5 pb-2">
        <div className={`space-y-0.5 ${iconOnly ? "flex flex-col items-center" : ""}`}>
          {mainNav.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              iconOnly={iconOnly}
              onNavigate={onCloseMobile}
              badge={item.to === "/dashboard/messages" ? messageBadge : undefined}
            />
          ))}
        </div>

        {canReview && !isAdmin ? (
          <div
            className={`mt-4 space-y-0.5 border-t border-white/[0.06] pt-3 ${
              iconOnly ? "flex flex-col items-center" : ""
            }`}
          >
            <NavItem
              to="/dashboard/review"
              label="Review"
              icon={ClipboardCheck}
              iconOnly={iconOnly}
              onNavigate={onCloseMobile}
            />
          </div>
        ) : null}

        {isAdmin ? (
          <div className="mt-4 border-t border-white/[0.06] pt-3">
            {!iconOnly ? (
              <button
                type="button"
                onClick={() => setAdminOpen((open) => !open)}
                className="mb-1 flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/45 transition hover:bg-white/[0.04] hover:text-white/70"
                aria-expanded={adminOpen}
              >
                Admin
                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${adminOpen ? "" : "-rotate-90"}`}
                />
              </button>
            ) : null}
            {(adminOpen || iconOnly) && (
              <div className={`space-y-0.5 ${iconOnly ? "flex flex-col items-center" : ""}`}>
                {adminNav.map((item) => (
                  <NavItem
                    key={item.to}
                    {...item}
                    iconOnly={iconOnly}
                    onNavigate={onCloseMobile}
                  />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] p-2">
        <div className={`flex flex-col gap-0.5 ${iconOnly ? "items-center" : ""}`}>
          {!isMobile && collapsed ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/[0.06] hover:text-white"
            >
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>
          ) : null}
          <Link
            to="/"
            onClick={onCloseMobile}
            title={iconOnly ? "Research map" : undefined}
            className={`flex items-center rounded-lg text-sm text-white/50 ${navItemMotion} hover:bg-white/[0.06] hover:text-white ${
              iconOnly ? "mx-auto h-10 w-10 justify-center overflow-hidden" : "gap-2.5 px-2.5 py-2"
            }`}
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            <span className="gre-dashboard-sidebar__fade-label truncate">Research map</span>
          </Link>
          <button
            type="button"
            onClick={onLogout}
            title={iconOnly ? "Sign out" : undefined}
            className={`flex items-center rounded-lg text-sm text-white/50 ${navItemMotion} hover:bg-red-500/10 hover:text-red-200 ${
              iconOnly
                ? "mx-auto h-10 w-10 justify-center overflow-hidden"
                : "w-full gap-2.5 px-2.5 py-2"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="gre-dashboard-sidebar__fade-label truncate">Sign out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
