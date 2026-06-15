import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../../contexts/AuthContext";
import LoadingSpinner from "./ui/LoadingSpinner";

interface PermissionBasedRouteProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
}

export function PermissionBasedRoute({
  children,
  permission,
  fallback = <Navigate to="/landingpage" replace />,
}: PermissionBasedRouteProps) {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner variant="modern" size="lg" color="primary" />
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
