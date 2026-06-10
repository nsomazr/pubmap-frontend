import { Suspense } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthScreen, AuthScreenLoading } from "./components/auth/AuthScreen";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { RouteErrorBoundary } from "./components/navigation/RouteErrorBoundary";
import { RouteLoadingFallback } from "./components/navigation/RouteLoadingFallback";
import { RouteNavigationEffects } from "./components/navigation/RouteNavigationEffects";
import { NavigationProgressProvider } from "./components/navigation/navigationProgress";
import { SummaryNavigationBridge } from "./components/navigation/SummaryNavigationBridge";
import { ConfirmProvider } from "./components/ui/ConfirmDialog";
import { ToastProvider } from "./components/ui/ToastProvider";
import { lazyPage } from "./lib/lazyRoute";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { OnboardingPage } from "./pages/auth/OnboardingPage";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { GreAssistant } from "./components/assistant/GreAssistant";

const PublicationDetailPage = lazyPage(
  () => import("./pages/PublicationDetailPage"),
  "PublicationDetailPage"
);
const PublicationChatPage = lazyPage(
  () => import("./pages/PublicationChatPage"),
  "PublicationChatPage"
);
const ForumPage = lazyPage(() => import("./pages/ForumPage"), "ForumPage");
const ForumCategoryPage = lazyPage(
  () => import("./pages/ForumCategoryPage"),
  "ForumCategoryPage"
);
const ForumTopicPage = lazyPage(() => import("./pages/ForumTopicPage"), "ForumTopicPage");
const EventsPage = lazyPage(() => import("./pages/EventsPage"), "EventsPage");
const EventDetailPage = lazyPage(() => import("./pages/EventDetailPage"), "EventDetailPage");
const MeetRoomPage = lazyPage(() => import("./pages/MeetRoomPage"), "MeetRoomPage");
const AboutPage = lazyPage(() => import("./pages/AboutPage"), "AboutPage");
const DoiRedirectPage = lazyPage(() => import("./pages/DoiRedirectPage"), "DoiRedirectPage");
const RankingsPage = lazyPage(() => import("./pages/RankingsPage"), "RankingsPage");
const AdDetailPage = lazyPage(() => import("./pages/AdDetailPage"), "AdDetailPage");
const StatisticsPage = lazyPage(() => import("./pages/StatisticsPage"), "StatisticsPage");
const ResearcherProfilePage = lazyPage(
  () => import("./pages/ResearcherProfilePage"),
  "ResearcherProfilePage"
);

const DashboardHome = lazyPage(() => import("./pages/dashboard/DashboardHome"), "DashboardHome");
const PublicationsPage = lazyPage(
  () => import("./pages/dashboard/PublicationsPage"),
  "PublicationsPage"
);
const PublicationManagePage = lazyPage(
  () => import("./pages/dashboard/PublicationManagePage"),
  "PublicationManagePage"
);
const PublicationReaderPage = lazyPage(
  () => import("./pages/dashboard/PublicationReaderPage"),
  "PublicationReaderPage"
);
const AccountPage = lazyPage(() => import("./pages/dashboard/AccountPage"), "AccountPage");
const MessagesPage = lazyPage(() => import("./pages/dashboard/MessagesPage"), "MessagesPage");
const AdminReviewPage = lazyPage(
  () => import("./pages/dashboard/AdminReviewPage"),
  "AdminReviewPage"
);
const AuthorsPage = lazyPage(() => import("./pages/dashboard/AuthorsPage"), "AuthorsPage");
const CategoriesPage = lazyPage(
  () => import("./pages/dashboard/CategoriesPage"),
  "CategoriesPage"
);
const ManagersPage = lazyPage(() => import("./pages/dashboard/ManagersPage"), "ManagersPage");
const EventsAdminPage = lazyPage(
  () => import("./pages/dashboard/EventsAdminPage"),
  "EventsAdminPage"
);
const MeetingsPage = lazyPage(() => import("./pages/dashboard/MeetingsPage"), "MeetingsPage");
const MeetManagePage = lazyPage(
  () => import("./pages/dashboard/MeetManagePage"),
  "MeetManagePage"
);
const MeetDetailPage = lazyPage(
  () => import("./pages/dashboard/MeetDetailPage"),
  "MeetDetailPage"
);
const MeetingArchivePage = lazyPage(
  () => import("./pages/dashboard/MeetingArchivePage"),
  "MeetingArchivePage"
);
const AdsPage = lazyPage(() => import("./pages/dashboard/AdsPage"), "AdsPage");
const AdminOperationsPage = lazyPage(
  () => import("./pages/dashboard/AdminOperationsPage"),
  "AdminOperationsPage"
);
const AdminLlmSettingsPage = lazyPage(
  () => import("./pages/dashboard/AdminLlmSettingsPage"),
  "AdminLlmSettingsPage"
);
const PlagiarismClaimsPage = lazyPage(
  () => import("./pages/dashboard/PlagiarismClaimsPage"),
  "PlagiarismClaimsPage"
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, onboardingRequired } = useAuth();
  if (loading) {
    return (
      <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-[#eef1f8] text-slate-500">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (onboardingRequired) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

/** Full-screen auth routes only  -  never render dashboard behind login/register. */
function AuthRoute() {
  const { user, loading, onboardingRequired } = useAuth();
  if (loading) return <AuthScreenLoading />;
  if (user) {
    return <Navigate to={onboardingRequired ? "/onboarding" : "/dashboard"} replace />;
  }
  return (
    <AuthScreen>
      <Outlet />
    </AuthScreen>
  );
}

function OnboardingRoute() {
  const { user, loading, onboardingRequired } = useAuth();
  if (loading) return <AuthScreenLoading />;
  if (!user) return <Navigate to="/login" replace />;
  if (!onboardingRequired) return <Navigate to="/dashboard" replace />;
  return (
    <AuthScreen>
      <Outlet />
    </AuthScreen>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <RouteErrorBoundary resetKeys={[location.pathname, location.search]}>
      <Suspense fallback={<RouteLoadingFallback overlay />}>
        <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<AuthRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route element={<OnboardingRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>
        <Route path="/publication/:id" element={<PublicationDetailPage />} />
        <Route path="/publication/:id/chat" element={<PublicationChatPage />} />
        <Route path="/researcher/:id" element={<ResearcherProfilePage />} />
        <Route path="/doi/:doi" element={<DoiRedirectPage />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/forum/category/:id" element={<ForumCategoryPage />} />
        <Route path="/forum/topic/:id" element={<ForumTopicPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route
          path="/meet/:slug"
          element={
            <PrivateRoute>
              <MeetRoomPage />
            </PrivateRoute>
          }
        />
        <Route path="/sponsored/:adId" element={<AdDetailPage />} />
        <Route path="/rankings" element={<RankingsPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<AboutPage />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          <Route path="publications" element={<PublicationsPage />} />
          <Route path="publications/new" element={<PublicationManagePage />} />
          <Route path="publications/:id" element={<PublicationManagePage />} />
          <Route path="publications/:id/reader" element={<PublicationReaderPage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="review" element={<AdminReviewPage />} />
          <Route path="authors" element={<AuthorsPage />} />
          <Route path="managers" element={<ManagersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="events" element={<EventsAdminPage />} />
          <Route path="meetings" element={<MeetingsPage />} />
          <Route path="meetings/new" element={<MeetManagePage />} />
          <Route path="meetings/:id" element={<MeetDetailPage />} />
          <Route path="meetings/:id/archive" element={<MeetingArchivePage />} />
          <Route path="meetings/:id/edit" element={<MeetManagePage />} />
          <Route path="ads" element={<AdsPage />} />
          <Route path="operations" element={<AdminOperationsPage />} />
          <Route path="llm-settings" element={<AdminLlmSettingsPage />} />
          <Route path="plagiarism" element={<PlagiarismClaimsPage />} />
          <Route path="cms" element={<Navigate to="/dashboard/operations" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}

function AppShell() {
  const location = useLocation();
  const hideAssistant = location.pathname.startsWith("/meet/");

  return (
    <NavigationProgressProvider>
      <RouteNavigationEffects />
      <SummaryNavigationBridge />
      <AppRoutes />
      {!hideAssistant && <GreAssistant />}
    </NavigationProgressProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <BrowserRouter>
              <AppShell />
            </BrowserRouter>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
