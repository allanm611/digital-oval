import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "./ui/LoadingSpinner";

/**
 * ProtectedRoute component that wraps all routes requiring authentication
 * - Checks if user is authenticated
 * - Verifies user has valid user_id
 * - Redirects to login if not authenticated
 * - Shows loading spinner while checking auth
 */
export function ProtectedRoute() {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loader while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Redirect to login if:
  // - Not authenticated
  // - No user object
  // - No user_id or user_id is 0
  if (!isAuthenticated || !user || !user.user_id) {
    return <Navigate to="/login" replace />;
  }

  // Render protected routes
  return <Outlet />;
}
