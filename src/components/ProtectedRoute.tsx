import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@/lib/router-compat";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ 
  children, 
  allowedRoles 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate({ to: "/login" });
    }

    if (!loading && isAuthenticated && allowedRoles) {
      if (!allowedRoles.includes(user!.role)) {
        navigate({ to: "/" });
      }
    }
  }, [loading, isAuthenticated, user, navigate, allowedRoles]);

  // Show nothing while checking auth
  if (loading) {
    return (
      <div className="flex min-h-screen items-center 
                      justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full 
                          border-4 border-primary 
                          border-t-transparent mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Show nothing if not authenticated
  if (!isAuthenticated) return null;

  // Check role if specified
  if (allowedRoles && !allowedRoles.includes(user!.role)) {
    return null;
  }

  return <>{children}</>;
}