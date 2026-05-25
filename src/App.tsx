import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthScreen, AuthScreenLoading } from "./components/auth/AuthScreen";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { OnboardingPage } from "./pages/auth/OnboardingPage";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { GreAssistant } from "./components/assistant/GreAssistant";
import { registerAppNavigate } from "./lib/appNavigate";

const PublicationDetailPage = lazy(() =>
  import("./pages/PublicationDetailPage").then((m) => ({ default: m.PublicationDetailPage }))
);
const ForumPage = lazy(() => import("./pages/ForumPage").then((m) => ({ default: m.ForumPage })));
const ForumCategoryPage = lazy(() =>
  import("./pages/ForumCategoryPage").then((m) => ({ default: m.ForumCategoryPage }))
);
const ForumTopicPage = lazy(() =>
  import("./pages/ForumTopicPage").then((m) => ({ default: m.ForumTopicPage }))
);
const EventsPage = lazy(() => import("./pages/EventsPage").then((m) => ({ default: m.EventsPage })));
const EventDetailPage = lazy(() =>
  import("./pages/EventDetailPage").then((m) => ({ default: m.EventDetailPage }))
);
const AboutPage = lazy(() => import("./pages/AboutPage").then((m) => ({ default: m.AboutPage })));
const DoiRedirectPage = lazy(() =>
  import("./pages/DoiRedirectPage").then((m) => ({ default: m.DoiRedirectPage }))
);
const RankingsPage = lazy(() =>
  import("./pages/RankingsPage").then((m) => ({ default: m.RankingsPage }))
);
const StatisticsPage = lazy(() =>
  import("./pages/StatisticsPage").then((m) => ({ default: m.StatisticsPage }))
);
const ResearcherProfilePage = lazy(() =>
  import("./pages/ResearcherProfilePage").then((m) => ({ default: m.ResearcherProfilePage }))
);

const DashboardHome = lazy(() =>
  import("./pages/dashboard/DashboardHome").then((m) => ({ default: m.DashboardHome }))
);
const PublicationsPage = lazy(() =>
  import("./pages/dashboard/PublicationsPage").then((m) => ({ default: m.PublicationsPage }))
);
const PublicationManagePage = lazy(() =>
  import("./pages/dashboard/PublicationManagePage").then((m) => ({ default: m.PublicationManagePage }))
);
const AccountPage = lazy(() =>
  import("./pages/dashboard/AccountPage").then((m) => ({ default: m.AccountPage }))
);
const MessagesPage = lazy(() =>
  import("./pages/dashboard/MessagesPage").then((m) => ({ default: m.MessagesPage }))
);
const AdminReviewPage = lazy(() =>
  import("./pages/dashboard/AdminReviewPage").then((m) => ({ default: m.AdminReviewPage }))
);
const AuthorsPage = lazy(() =>
  import("./pages/dashboard/AuthorsPage").then((m) => ({ default: m.AuthorsPage }))
);
const CategoriesPage = lazy(() =>
  import("./pages/dashboard/CategoriesPage").then((m) => ({ default: m.CategoriesPage }))
);
const ManagersPage = lazy(() =>
  import("./pages/dashboard/ManagersPage").then((m) => ({ default: m.ManagersPage }))
);
const EventsAdminPage = lazy(() =>
  import("./pages/dashboard/EventsAdminPage").then((m) => ({ default: m.EventsAdminPage }))
);
const AdsPage = lazy(() => import("./pages/dashboard/AdsPage").then((m) => ({ default: m.AdsPage })));
const AdminOperationsPage = lazy(() =>
  import("./pages/dashboard/AdminOperationsPage").then((m) => ({ default: m.AdminOperationsPage }))
);
const PlagiarismClaimsPage = lazy(() =>
  import("./pages/dashboard/PlagiarismClaimsPage").then((m) => ({ default: m.PlagiarismClaimsPage }))
);

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
      Loading…
    </div>
  );
}

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
  return (
    <Suspense fallback={<RouteFallback />}>
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
        <Route path="/researcher/:id" element={<ResearcherProfilePage />} />
        <Route path="/doi/:doi" element={<DoiRedirectPage />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/forum/category/:id" element={<ForumCategoryPage />} />
        <Route path="/forum/topic/:id" element={<ForumTopicPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
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
          <Route path="account" element={<AccountPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="review" element={<AdminReviewPage />} />
          <Route path="authors" element={<AuthorsPage />} />
          <Route path="managers" element={<ManagersPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="events" element={<EventsAdminPage />} />
          <Route path="ads" element={<AdsPage />} />
          <Route path="operations" element={<AdminOperationsPage />} />
          <Route path="plagiarism" element={<PlagiarismClaimsPage />} />
          <Route path="cms" element={<Navigate to="/dashboard/operations" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function AppNavigationRegistrar() {
  const navigate = useNavigate();

  useEffect(() => {
    registerAppNavigate(navigate);
    return () => registerAppNavigate(null);
  }, [navigate]);

  return null;
}

function AppShell() {
  return (
    <>
      <AppNavigationRegistrar />
      <AppRoutes />
      <GreAssistant />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
