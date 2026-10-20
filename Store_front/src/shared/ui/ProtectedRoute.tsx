import type { ReactNode } from "react";
import { useAuth } from "@/features/auth/useAuth";
import { Outlet, Navigate } from "react-router-dom";

/**
 * ProtectedRoute - Requires authentication
 * Shows loading while auth initializes, redirects to /login if not authenticated
 */
export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

/**
 * PublicRoute - For unauthenticated pages (login, register)
 * Redirects to home if already authenticated
 */
export function PublicRoute({ children }: { children?: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

/**
 * AdminOnlyRoute - Requires Admin role
 */
export function AdminOnlyRoute({ children }: { children?: ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const userRoles = useAuth().user?.roles ?? [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !userRoles.includes("Admin")) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}