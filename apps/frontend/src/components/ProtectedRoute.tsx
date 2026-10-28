import { Navigate } from "react-router-dom";
import { session } from "../utils/session";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallbackPath?: string;
}

/**
 * Wraps any route that requires a completed OTP-verified session.
 * If no access token exists → redirect to /login.
 */
export function ProtectedRoute({ children, allowedRoles, fallbackPath = "/dashboard" }: ProtectedRouteProps) {
  if (!session.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const user = session.getUser();
  const rawRole = user?.roleName ?? (user as any)?.role?.roleName ?? (user as any)?.role ?? "";
  const userRole = String(rawRole).trim().toLowerCase();

  if (allowedRoles?.length) {
    const isAllowed = allowedRoles.some((allowed) =>
      userRole.includes(allowed.toLowerCase())
    );
    if (!isAllowed) {
      return <Navigate to={fallbackPath} replace />;
    }
  }

  return <>{children}</>;
}
