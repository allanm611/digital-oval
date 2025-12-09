import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ConfirmProvider } from "./contexts/ConfirmContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { color } from "./shared/utils/utils";

// ScrollToTop component to scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Function to perform scroll
    const performScroll = () => {
      // Scroll window
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      // Scroll document elements
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
      }
      // Scroll any scrollable containers
      const scrollableContainers = document.querySelectorAll(
        '[style*="overflow"], [class*="overflow"]'
      );
      scrollableContainers.forEach((container) => {
        if (container instanceof HTMLElement && container.scrollTop > 0) {
          container.scrollTop = 0;
        }
      });
    };

    // Immediate scroll
    performScroll();

    // Scroll after render (using requestAnimationFrame)
    requestAnimationFrame(() => {
      performScroll();
    });

    // Also scroll after a delay to catch any delayed renders
    const timeoutId1 = setTimeout(performScroll, 50);
    const timeoutId2 = setTimeout(performScroll, 150);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [pathname]);

  return null;
}

// Lazy load all pages for better performance
const LoginPage = lazy(() => import("./features/auth/pages/LoginPage"));
const RequestAccountPage = lazy(
  () => import("./features/auth/pages/RequestAccountPage")
);
const ResetPasswordPage = lazy(
  () => import("./features/auth/pages/ResetPasswordPage")
);
const LandingPage = lazy(() => import("./features/auth/pages/LandingPage"));
const AuthenticatedLandingPage = lazy(
  () => import("./features/dashboard/components/AuthenticatedLandingPage")
);
const Dashboard = lazy(() => import("./features/dashboard/pages/Dashboard"));

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
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/landingpage" /> : <LoginPage />
            }
          />
          <Route path="/request-account" element={<RequestAccountPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route
            path="/landingpage"
            element={
              isAuthenticated ? (
                <AuthenticatedLandingPage />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
          <Route
            path="/dashboard/*"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <ToastProvider>
          <ConfirmProvider>
            <NotificationProvider>
              <Router>
                <div
                  className="min-h-screen"
                  style={{ backgroundColor: color.primary.background }}
                >
                  <AppRoutes />
                </div>
              </Router>
            </NotificationProvider>
          </ConfirmProvider>
        </ToastProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
