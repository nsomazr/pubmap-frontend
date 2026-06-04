/** Dynamic imports for route chunks — used for hover/focus prefetch. */

const prefetchers: Record<string, () => Promise<unknown>> = {
  "/rankings": () => import("../pages/RankingsPage"),
  "/statistics": () => import("../pages/StatisticsPage"),
  "/about": () => import("../pages/AboutPage"),
  "/contact": () => import("../pages/AboutPage"),
  "/forum": () => import("../pages/ForumPage"),
  "/events": () => import("../pages/EventsPage"),
  "/login": () => import("../pages/auth/LoginPage"),
  "/register": () => import("../pages/auth/RegisterPage"),
  "/dashboard": () => import("../pages/dashboard/DashboardHome"),
  "/dashboard/publications": () => import("../pages/dashboard/PublicationsPage"),
  "/dashboard/publications/new": () => import("../pages/dashboard/PublicationManagePage"),
  "/dashboard/meetings": () => import("../pages/dashboard/MeetingsPage"),
  "/dashboard/meetings/new": () => import("../pages/dashboard/MeetManagePage"),
  "/dashboard/messages": () => import("../pages/dashboard/MessagesPage"),
  "/dashboard/account": () => import("../pages/dashboard/AccountPage"),
  "/dashboard/review": () => import("../pages/dashboard/AdminReviewPage"),
  "/dashboard/authors": () => import("../pages/dashboard/AuthorsPage"),
  "/dashboard/categories": () => import("../pages/dashboard/CategoriesPage"),
  "/dashboard/managers": () => import("../pages/dashboard/ManagersPage"),
  "/dashboard/events": () => import("../pages/dashboard/EventsAdminPage"),
  "/dashboard/ads": () => import("../pages/dashboard/AdsPage"),
  "/dashboard/operations": () => import("../pages/dashboard/AdminOperationsPage"),
  "/dashboard/llm-settings": () => import("../pages/dashboard/AdminLlmSettingsPage"),
  "/dashboard/plagiarism": () => import("../pages/dashboard/PlagiarismClaimsPage"),
};

const prefetched = new Set<string>();

function normalizePath(path: string): string {
  const base = path.split("?")[0]?.split("#")[0] ?? path;
  if (base.length > 1 && base.endsWith("/")) return base.slice(0, -1);
  return base;
}

/** Best matching prefetch key for a pathname (longest prefix wins). */
export function prefetchPathForRoute(pathname: string): string | null {
  const path = normalizePath(pathname);
  if (prefetchers[path]) return path;

  const segments = [
    path.match(/^\/dashboard\/publications\/[^/]+/)?.[0],
    path.match(/^\/dashboard\/meetings\/[^/]+/)?.[0],
    path.match(/^\/publication\/[^/]+/)?.[0],
    path.match(/^\/researcher\/[^/]+/)?.[0],
    path.match(/^\/forum\/[^/]+/)?.[0],
    path.match(/^\/events\/[^/]+/)?.[0],
  ].filter(Boolean) as string[];

  if (segments[0]?.startsWith("/dashboard/publications/")) {
    if (path.endsWith("/reader")) return "__publication_reader__";
    return "__publication_manage__";
  }
  if (segments[0]?.startsWith("/dashboard/meetings/")) {
    if (path.endsWith("/archive")) return "__meeting_archive__";
    if (path.endsWith("/edit")) return "__meeting_manage__";
    return "__meeting_detail__";
  }
  if (segments[0]?.startsWith("/publication/")) {
    if (path.endsWith("/chat")) return "__publication_chat__";
    return "__publication_detail__";
  }
  if (segments[0]?.startsWith("/researcher/")) return "__researcher_profile__";
  if (segments[0]?.startsWith("/forum/category")) return "__forum_category__";
  if (segments[0]?.startsWith("/forum/topic")) return "__forum_topic__";
  if (segments[0]?.startsWith("/events/")) return "__event_detail__";

  let best: string | null = null;
  for (const key of Object.keys(prefetchers)) {
    if (path === key || path.startsWith(`${key}/`)) {
      if (!best || key.length > best.length) best = key;
    }
  }
  return best;
}

const dynamicPrefetchers: Record<string, () => Promise<unknown>> = {
  __publication_detail__: () => import("../pages/PublicationDetailPage"),
  __publication_chat__: () => import("../pages/PublicationChatPage"),
  __publication_manage__: () => import("../pages/dashboard/PublicationManagePage"),
  __publication_reader__: () => import("../pages/dashboard/PublicationReaderPage"),
  __researcher_profile__: () => import("../pages/ResearcherProfilePage"),
  __meeting_detail__: () => import("../pages/dashboard/MeetDetailPage"),
  __meeting_manage__: () => import("../pages/dashboard/MeetManagePage"),
  __meeting_archive__: () => import("../pages/dashboard/MeetingArchivePage"),
  __forum_category__: () => import("../pages/ForumCategoryPage"),
  __forum_topic__: () => import("../pages/ForumTopicPage"),
  __event_detail__: () => import("../pages/EventDetailPage"),
};

export function prefetchRoute(pathname: string): void {
  const path = normalizePath(pathname);
  const key = prefetchPathForRoute(path);
  if (!key || prefetched.has(key)) return;
  prefetched.add(key);

  const loader = prefetchers[key] ?? dynamicPrefetchers[key];
  if (!loader) return;
  void loader().catch(() => {
    prefetched.delete(key);
  });
}

export function prefetchLikelyDashboardRoutes(): void {
  prefetchRoute("/dashboard/publications");
  prefetchRoute("/dashboard/meetings");
  prefetchRoute("/dashboard/messages");
}
