import React, { useState } from "react";
import {
  Shield,
  Lock,
  Mail,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api/api";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { login, setAuthSession, user } = useAuth();
  const navigate = useNavigate();

  // Redirect an already authenticated administrator.
  React.useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setIsLoading(true);
    setError("");

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const res = await authAPI.adminLogin({
        email: normalizedEmail,
        password,
      });

      if (!res.data?.token) {
        throw new Error("The server did not return a login token.");
      }

      const token = res.data.token;
      const adminData = {
        id: res.data.admin?.id || "admin-master-1",
        name: res.data.admin?.name || "EcoCity Administrator",
        email: res.data.admin?.email || normalizedEmail,
        role: "admin" as const,
      };

      if (setAuthSession) {
        setAuthSession(token, adminData);
      } else {
        localStorage.setItem("token", token);
        login(normalizedEmail, "admin");
      }

      navigate("/admin");
    } catch (err: any) {
      console.error("Admin login failed:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to log in. Check your credentials and backend connection."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="absolute top-8 left-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-charcoal/60 hover:text-charcoal transition-colors group"
        >
          <div className="w-8 h-8 rounded-full border border-charcoal/10 flex items-center justify-center bg-white group-hover:border-charcoal/30">
            <ArrowLeft className="w-4 h-4 stroke-[1.5]" />
          </div>
          Return to citizen portal
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-white border border-charcoal/10 shadow-sm items-center justify-center mb-6 text-charcoal">
          <Shield className="w-8 h-8 stroke-[1.5]" />
        </div>

        <h2 className="text-3xl font-display font-medium text-charcoal tracking-tight">
          Admin Console
        </h2>

        <p className="mt-2 text-sm text-charcoal-light">
          Authorized personnel and municipal service operators only.
        </p>
      </div>

      {/* Login form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-sm border border-charcoal/5 sm:rounded-3xl sm:px-10">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-coral/5 border border-coral/10 text-coral flex items-start gap-2.5 text-sm"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-charcoal"
              >
                Administrator Email
              </label>

              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal/30">
                  <Mail className="w-4 h-4" />
                </div>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  placeholder="likithamindi024@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-charcoal/10 pl-11 pr-4 py-3 placeholder-charcoal-light/30 focus:border-charcoal focus:outline-none focus:ring-charcoal sm:text-sm bg-ivory"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-charcoal"
              >
                Password
              </label>

              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal/30">
                  <Lock className="w-4 h-4" />
                </div>

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-charcoal/10 pl-11 pr-4 py-3 placeholder-charcoal-light/30 focus:border-charcoal focus:outline-none focus:ring-charcoal sm:text-sm bg-ivory"
                />
              </div>
            </div>

            {/* Submit button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-medium text-white bg-charcoal hover:bg-charcoal/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-charcoal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Access Admin Dashboard"
                )}
              </button>
            </div>
          </form>

          {/* Security & Credentials Notice */}
          <div className="mt-6 pt-6 border-t border-charcoal/5 text-center">
            <span className="text-xs text-charcoal-light font-medium block">
              Configured Admin: <span className="font-mono text-charcoal font-semibold">likithamindi024@gmail.com</span>
            </span>
            <span className="text-[11px] text-charcoal-light/70 mt-1 block">
              Default password: <span className="font-mono text-charcoal font-semibold">likitha123</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
