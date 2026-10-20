import { Navigate, Outlet, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ShieldAlert, ArrowLeft, Lock } from "lucide-react";

export function ProtectedRoute({ requireAdmin = false }: { requireAdmin?: boolean }) {
  const { user, logout, loading } = useAuth();

  // Show clean spinner while loading session from backend/storage to prevent abrupt redirects on page refresh
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal/20 border-t-teal rounded-full animate-spin mb-4" />
        <p className="text-sm text-charcoal-light font-medium">Verifying authentication session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={requireAdmin ? "/admin-login" : "/auth"} replace />;
  }

  if (requireAdmin && user.role !== "admin") {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-coral/10 flex items-center justify-center mb-6 text-coral animate-bounce">
          <ShieldAlert className="w-10 h-10 stroke-[1.5]" />
        </div>
        <h1 className="text-3xl font-display font-medium text-charcoal mb-3">Access Denied</h1>
        <p className="text-charcoal-light max-w-md mb-8">
          You don't have the administrative permissions required to view the Admin Dashboard.
          Please sign in with authorized administrator credentials.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => {
              logout();
              window.location.href = "/admin-login";
            }}
            className="whitespace-nowrap px-6 py-3 bg-teal hover:bg-teal-light text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            Switch to Admin Login
          </button>
          <Link
            to="/"
            className="whitespace-nowrap px-6 py-3 bg-charcoal/5 hover:bg-charcoal/10 text-charcoal rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;
