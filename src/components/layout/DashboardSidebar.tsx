import {
  BookOpen,
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
import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { BrandMark } from "../brand/BrandMark";
import { GreAvatarSlot } from "../ui/GreHeroBanner";
import { userInitials } from "../../lib/userDisplay";
import { greUnreadBadge } from "../../lib/greTheme";
import { useUnreadCounts } from "../../hooks/useUnreadCounts";
import type { User } from "../../types";

const workspaceNav: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/publications", label: "Publications", icon: FileText, end: true },
  { to: "/dashboard/meetings", label: "GRE Meet", icon: Video },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/plagiarism", label: "Plagiarism", icon: Scale },
  { to: "/dashboard/account", label: "Account", icon: Settings },
];

const adminNavGroups: { label: string; items: { to: string; label: string; icon: LucideIcon }[] }[] = [
  {
    label: "Moderation",
    items: [
      { to: "/dashboard/operations", label: "Operations", icon: Shield },
      { to: "/dashboard/review", label: "Review queue", icon: ClipboardCheck },
    ],
  },
  {
    label: "Directory",
    items: [
      { to: "/dashboard/managers", label: "Managers", icon: UserCog },
      { to: "/dashboard/authors", label: "Users", icon: Users },
      { to: "/dashboard/categories", label: "Fields", icon: BookOpen },
    ],
  },
  {
    label: "Content",
    items: [
      { to: "/dashboard/events", label: "Events", icon: Calendar },
      { to: "/dashboard/ads", label: "Ads", icon: Megaphone },
    ],
  },
];

interface Props {
  collapsed: boolean;
  showLabels: boolean;
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

function roleLabel(isAdmin: boolean, canReview: boolean, user: User | null) {
  if (isAdmin) return "Administrator";
  if (canReview) return "Field manager";
  return user?.area_of_study?.trim() || "Researcher";
}

function NavItem({
  to,
  label,
  icon: Icon,
  end,
  showLabels,
  onNavigate,
  badge,
  compact,
}: {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  showLabels: boolean;
  onNavigate: () => void;
  badge?: number;
  compact?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      title={showLabels ? undefined : label}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group relative flex items-center rounded-lg transition-colors duration-150 ${
          compact ? "text-[13px]" : "text-sm"
        } font-medium ${
          showLabels ? `gap-2.5 ${compact ? "px-2 py-1.5" : "px-2.5 py-2"}` : "mx-auto h-10 w-10 justify-center"
        } ${
          isActive
            ? "bg-white/[0.12] text-white shadow-sm ring-1 ring-white/10"
            : "text-white/55 hover:bg-white/[0.06] hover:text-white/90"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {showLabels && isActive && (
            <span
              className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-teal-400"
              aria-hidden
            />
          )}
          <span className="relative shrink-0">
            <Icon className={compact ? "h-4 w-4" : "h-[17px] w-[17px]"} strokeWidth={isActive ? 2.25 : 2} />
            {badge != null && badge > 0 && (
              <span
                className={`absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full ${greUnreadBadge} px-0.5 text-[8px] font-bold text-white ring-2 ring-[#12151c]`}
              >
                {badge > 9 ? "9+" : badge}
              </span>
            )}
          </span>
          {showLabels && <span className="min-w-0 truncate">{label}</span>}
          {!showLabels && (
            <span className="pointer-events-none absolute left-[calc(100%+0.5rem)] top-1/2 z-[60] hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white shadow-lg group-hover:block group-focus-visible:block">
              {label}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function NavSection({
  title,
  showLabels,
  children,
  action,
}: {
  title: string;
  showLabels: boolean;
  children: ReactNode;
  action?: ReactNode;
}) {
  if (!showLabels) return <div className="space-y-0.5 py-1">{children}</div>;
  return (
    <div className="py-1">
      <div className="mb-1 flex items-center justify-between gap-2 px-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/30">{title}</p>
        {action}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function DashboardSidebar({
  collapsed,
  showLabels,
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
  const [adminOpen, setAdminOpen] = useState(true);

  return (
    <aside
      className={`gre-dashboard-sidebar fixed inset-y-0 left-0 z-50 flex flex-col border-r border-white/[0.06] bg-[#12151c] text-white shadow-2xl transition-[width,transform] duration-300 ease-out ${
        isMobile ? (mobileOpen ? "translate-x-0" : "-translate-x-full") : ""
      }`}
      style={{ width: sidebarW }}
      aria-label="Dashboard navigation"
    >
      <div
        className={`flex shrink-0 items-center border-b border-white/[0.06] bg-gradient-to-r from-white/[0.03] to-transparent ${
          showLabels ? "justify-between gap-2 px-3 py-3" : "justify-center px-2 py-3"
        }`}
      >
        <Link
          to="/"
          onClick={onCloseMobile}
          className={`flex min-w-0 items-center ${showLabels ? "gap-2.5" : ""}`}
          title="GRE home"
        >
          <BrandMark symbol="full" variant="dark" size="sm" />
          {showLabels && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">GRE</p>
              <p className="truncate text-[10px] text-white/40">Research dashboard</p>
            </div>
          )}
        </Link>
        {showLabels && !isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/45 transition hover:bg-white/[0.08] hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      <Link
        to="/dashboard/account"
        onClick={onCloseMobile}
        title="Your account"
        className={`mx-3 mt-3 flex shrink-0 items-center rounded-xl bg-white/[0.04] ring-1 ring-white/[0.07] transition hover:bg-white/[0.07] ${
          showLabels ? "gap-2.5 px-2.5 py-2" : "h-10 w-10 justify-center"
        }`}
      >
        <GreAvatarSlot
          photoUrl={user?.photo}
          initials={userInitials(user)}
          size="sm"
          className="h-8 w-8 shrink-0 border border-brand-400/30"
        />
        {showLabels && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {user?.firstname} {user?.lastname}
            </p>
            <p className="truncate text-[11px] text-white/45">{roleLabel(isAdmin, canReview, user)}</p>
          </div>
        )}
      </Link>

      {showLabels && (
        <div className="mx-3 mt-2.5 grid grid-cols-2 gap-2">
          <Link
            to="/dashboard/publications/new"
            onClick={onCloseMobile}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-2 py-2 text-xs font-semibold text-white shadow-md shadow-brand-900/40 transition hover:bg-brand-500"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            New paper
          </Link>
          <Link
            to="/dashboard/meetings/new"
            onClick={onCloseMobile}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.08] px-2 py-2 text-xs font-semibold text-white ring-1 ring-white/10 transition hover:bg-white/[0.12]"
          >
            <Video className="h-3.5 w-3.5" />
            GRE Meet
          </Link>
        </div>
      )}

      {!showLabels && (
        <div className="mt-2 flex flex-col items-center gap-1.5 px-2">
          <Link
            to="/dashboard/publications/new"
            onClick={onCloseMobile}
            title="New publication"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white shadow-md hover:bg-brand-500"
          >
            <Plus className="h-4 w-4" strokeWidth={2.5} />
          </Link>
          <Link
            to="/dashboard/meetings/new"
            onClick={onCloseMobile}
            title="Schedule GRE Meet"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.08] text-white ring-1 ring-white/10 hover:bg-white/[0.12]"
          >
            <Video className="h-4 w-4" />
          </Link>
        </div>
      )}

      <nav className="mt-3 min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-2">
        <NavSection title="Workspace" showLabels={showLabels}>
          {workspaceNav.map((item) => (
            <NavItem
              key={item.to}
              {...item}
              showLabels={showLabels}
              onNavigate={onCloseMobile}
              badge={item.to === "/dashboard/messages" ? messageBadge : undefined}
            />
          ))}
        </NavSection>

        {canReview && !isAdmin && (
          <NavSection title="Review" showLabels={showLabels}>
            <NavItem
              to="/dashboard/review"
              label="Review queue"
              icon={ClipboardCheck}
              showLabels={showLabels}
              onNavigate={onCloseMobile}
            />
          </NavSection>
        )}

        {isAdmin && (
          <NavSection
            title="Administration"
            showLabels={showLabels}
            action={
              showLabels ? (
                <button
                  type="button"
                  onClick={() => setAdminOpen((open) => !open)}
                  className="rounded p-0.5 text-white/35 transition hover:text-white/70"
                  aria-expanded={adminOpen}
                  aria-label={adminOpen ? "Collapse admin menu" : "Expand admin menu"}
                >
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition ${adminOpen ? "" : "-rotate-90"}`}
                  />
                </button>
              ) : undefined
            }
          >
            {(adminOpen || !showLabels) &&
              adminNavGroups.map((group) => (
                <div key={group.label} className={showLabels ? "pt-1" : ""}>
                  {showLabels && (
                    <p className="mb-0.5 px-2.5 text-[9px] font-semibold uppercase tracking-wider text-white/25">
                      {group.label}
                    </p>
                  )}
                  {group.items.map((item) => (
                    <NavItem
                      key={item.to}
                      {...item}
                      showLabels={showLabels}
                      onNavigate={onCloseMobile}
                      compact={showLabels}
                    />
                  ))}
                </div>
              ))}
          </NavSection>
        )}
      </nav>

      <div className="shrink-0 border-t border-white/[0.06] bg-[#0f1218]/80 p-2">
        <div
          className={`flex ${showLabels ? "flex-col gap-0.5" : "flex-col items-center gap-1"}`}
        >
          {!isMobile && collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className={`flex items-center rounded-lg text-white/50 transition hover:bg-white/[0.06] hover:text-white ${
                showLabels ? "gap-2 px-2.5 py-2 text-sm" : "h-10 w-10 justify-center"
              }`}
            >
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>
          )}
          <Link
            to="/"
            onClick={onCloseMobile}
            title="Public research map"
            className={`flex items-center rounded-lg text-sm text-white/50 transition hover:bg-white/[0.06] hover:text-white ${
              showLabels ? "gap-2.5 px-2.5 py-2" : "h-10 w-10 justify-center"
            }`}
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            {showLabels && <span className="text-[13px]">Explore map</span>}
          </Link>
          <button
            type="button"
            onClick={onLogout}
            title="Sign out"
            className={`flex items-center rounded-lg text-sm text-white/50 transition hover:bg-red-500/10 hover:text-red-200 ${
              showLabels ? "w-full gap-2.5 px-2.5 py-2" : "h-10 w-10 justify-center"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {showLabels && <span className="text-[13px]">Sign out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
