import React, { useState } from "react";
import { Shield, Lock, Mail, ArrowLeft, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { authAPI } from "../api/api";

const DEMO_ADMIN_EMAIL = "admin@ecocity.com";
const DEMO_ADMIN_PASSWORD = "Admin@123";

export function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If already logged in as admin, redirect to admin panel
  React.useEffect(() => {
    if (user?.role === "admin") {
      navigate("/admin");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const res = await authAPI.adminLogin({ email: normalizedEmail, password });
      
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        login(normalizedEmail, "admin");
        setIsLoading(false);
        navigate("/admin");
        return;
      }
    } catch (apiErr: any) {
      console.warn("Backend admin login error, checking local fallback:", apiErr.message);
    }

    // Local fallback check
    const normalizedEmail = email.trim().toLowerCase();
    if (normalizedEmail === DEMO_ADMIN_EMAIL.toLowerCase() && password === DEMO_ADMIN_PASSWORD) {
      login(DEMO_ADMIN_EMAIL, "admin");
      setIsLoading(false);
      navigate("/admin");
    } else {
      setError("Invalid administrator email or password.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="absolute top-8 left-8">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-charcoal-light hover:text-charcoal transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Citizen App
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-16 h-16 rounded-2xl bg-charcoal/5 items-center justify-center mb-6 text-charcoal">
          <Shield className="w-8 h-8 stroke-[1.5]" />
        </div>
        <h2 className="text-3xl font-display font-medium text-charcoal tracking-tight">
          Admin Console
        </h2>
        <p className="mt-2 text-sm text-charcoal-light">
          Authorized personnel and municipal service operators only.
        </p>
      </div>

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
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-charcoal">
                Email
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-charcoal/30">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="admin@ecocity.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-charcoal/10 pl-11 pr-4 py-3 placeholder-charcoal-light/30 focus:border-charcoal focus:outline-none focus:ring-charcoal sm:text-sm bg-ivory"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-charcoal">
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
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-charcoal/10 pl-11 pr-4 py-3 placeholder-charcoal-light/30 focus:border-charcoal focus:outline-none focus:ring-charcoal sm:text-sm bg-ivory"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center items-center gap-2 rounded-xl bg-charcoal text-white py-3 px-4 text-sm font-medium hover:bg-charcoal/90 transition-all disabled:opacity-50 font-display cursor-pointer"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Login
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Authorized Operators only text */}
          <div className="mt-6 pt-6 border-t border-charcoal/5 text-center">
            <span className="text-xs text-charcoal-light font-medium">
              Demo Credentials: <span className="font-mono text-charcoal font-semibold">admin@ecocity.com</span> &bull; <span className="font-mono text-charcoal font-semibold">Admin@123</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
