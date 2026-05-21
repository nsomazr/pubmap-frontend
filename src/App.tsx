import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthScreen, AuthScreenLoading } from "./components/auth/AuthScreen";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { OnboardingPage } from "./pages/auth/OnboardingPage";
import { PublicationDetailPage } from "./pages/PublicationDetailPage";
import { ForumPage } from "./pages/ForumPage";
import { ForumCategoryPage } from "./pages/ForumCategoryPage";
import { ForumTopicPage } from "./pages/ForumTopicPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { AboutPage } from "./pages/AboutPage";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { DashboardHome } from "./pages/dashboard/DashboardHome";
import { PublicationsPage } from "./pages/dashboard/PublicationsPage";
import { PublicationManagePage } from "./pages/dashboard/PublicationManagePage";
import { AccountPage } from "./pages/dashboard/AccountPage";
import { MessagesPage } from "./pages/dashboard/MessagesPage";
import { AdminReviewPage } from "./pages/dashboard/AdminReviewPage";
import { AuthorsPage } from "./pages/dashboard/AuthorsPage";
import { CategoriesPage } from "./pages/dashboard/CategoriesPage";
import { EventsAdminPage } from "./pages/dashboard/EventsAdminPage";
import { AdsPage } from "./pages/dashboard/AdsPage";
import { AdminOperationsPage } from "./pages/dashboard/AdminOperationsPage";
import { GreAssistant } from "./components/assistant/GreAssistant";

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

/** Full-screen auth routes only — never render dashboard behind login/register. */
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
      <Route path="/forum" element={<ForumPage />} />
      <Route path="/forum/category/:id" element={<ForumCategoryPage />} />
      <Route path="/forum/topic/:id" element={<ForumTopicPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/events/:id" element={<EventDetailPage />} />
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
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="events" element={<EventsAdminPage />} />
        <Route path="ads" element={<AdsPage />} />
        <Route path="operations" element={<AdminOperationsPage />} />
        <Route path="cms" element={<Navigate to="/dashboard/operations" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AppShell() {
  return (
    <>
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
