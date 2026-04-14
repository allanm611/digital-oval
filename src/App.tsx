import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationSettingsProvider } from "./contexts/NotificationSettingsContext";
import { GlobalLoadingProvider } from "./contexts/GlobalLoadingContext";
import { DocsVersionProvider } from "./features/docs/contexts/DocsVersionContext";
import { color } from "./shared/utils/utils";
import GlobalLoader from "./shared/components/GlobalLoader";
import { AppErrorBoundary } from "./shared/components/AppErrorBoundary";
import { SafeRoute } from "./shared/components/SafeRoute";
import { ProtectedRoute } from "./shared/components/ProtectedRoute";

// Lazy load all pages for better performance
const LoginPage = lazy(() => import("./features/auth/pages/LoginPage"));
const RequestAccountPage = lazy(
  () => import("./features/auth/pages/RequestAccountPage"),
);
const ResetPasswordPage = lazy(
  () => import("./features/auth/pages/ResetPasswordPage"),
);
const LandingPage = lazy(() => import("./features/auth/pages/LandingPage"));
const AuthenticatedLandingPage = lazy(
  () => import("./features/dashboard/components/AuthenticatedLandingPage"),
);
const Dashboard = lazy(() => import("./features/dashboard/pages/Dashboard"));
const DocsPage = lazy(() =>
  import("./features/docs/pages/DocsPage").then((m) => ({
    default: m.DocsPage,
  })),
);
const EditDocsPage = lazy(() => import("./features/docs/pages/EditDocsPage"));
const NotFoundPage = lazy(() => import("./shared/pages/NotFoundPage"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3b8169]"></div>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#3b8169]"></div>
      </div>
    );
  }

  return (
    <SafeRoute>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/landingpage" /> : <LoginPage />
            }
          />
          <Route path="/request-account" element={<RequestAccountPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/landing" element={<LandingPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/landingpage" element={<AuthenticatedLandingPage />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/documentation/edit" element={<EditDocsPage />} />
            <Route path="/documentation/add" element={<EditDocsPage />} />
            <Route path="/documentation/*" element={<DocsPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </SafeRoute>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <GlobalLoadingProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ToastProvider>
                <ConfirmProvider>
                  <NotificationProvider>
                    <NotificationSettingsProvider>
                      <DocsVersionProvider>
                        <Router>
                          <div
                            className="min-h-screen"
                            style={{ backgroundColor: color.primary.background }}
                          >
                            <GlobalLoader />
                            <AppRoutes />
                          </div>
                        </Router>
                      </DocsVersionProvider>
                    </NotificationSettingsProvider>
                  </NotificationProvider>
                </ConfirmProvider>
              </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </GlobalLoadingProvider>
    </AppErrorBoundary>
  );
}

export default App;
