import React, { useState } from "react";
import { Leaf, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Auth() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleClick = () => {
    setIsSigningIn(true);
    setTimeout(() => {
      loginWithGoogle();
      setIsSigningIn(false);
      navigate("/");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Decorative backdrop elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal/5 rounded-full filter blur-3xl -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sage/5 rounded-full filter blur-3xl -z-10" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex flex-col items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-teal/10 flex items-center justify-center shadow-inner">
            <Leaf className="w-8 h-8 text-teal" />
          </div>
          <div className="text-center">
            <h2 className="text-3xl font-display font-bold text-charcoal tracking-tight">EcoCity</h2>
            <p className="text-xs text-teal font-medium tracking-wider uppercase mt-1">Smart Civic Engagement Platform</p>
          </div>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-sm border border-charcoal/5 sm:rounded-3xl sm:px-10">
          
          <div className="text-center mb-8">
            <h3 className="text-lg font-display font-semibold text-charcoal">Citizen Portal Login</h3>
            <p className="text-sm text-charcoal-light mt-1">
              Access complaint reports, join community events, and share green initiatives.
            </p>
          </div>

          <div className="space-y-6">
            
            {/* Google Sign In Button */}
            <div>
              <button
                onClick={handleGoogleClick}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-3 bg-white border border-charcoal/10 hover:border-charcoal/20 rounded-2xl py-3.5 px-4 font-medium text-charcoal shadow-sm hover:shadow-md transition-all text-sm cursor-pointer disabled:opacity-50"
              >
                {isSigningIn ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-teal" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Connecting to Google...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61c-.3 1.55-1.17 2.86-2.48 3.74v3.1h4.01c2.34-2.16 3.61-5.33 3.61-8.69z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.01-3.1c-1.12.75-2.55 1.19-3.95 1.19-3.04 0-5.61-2.05-6.53-4.82H1.31v3.2A11.983 11.983 0 0012 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.47 14.36A7.12 7.12 0 015.06 12c0-.82.14-1.61.41-2.36V6.43H1.31A11.997 11.997 0 000 12c0 2.21.6 4.3 1.66 6.13l3.81-1.77z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.32 2.67 1.31 6.57l3.81 3.2C6.04 6.94 8.79 4.75 12 4.75z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-center">
              <span className="text-xs text-charcoal-light font-medium bg-ivory px-3.5 py-1.5 rounded-full inline-block border border-charcoal/5">
                Users will be authenticated securely using their Google Account.
              </span>
            </div>

          </div>

          <div className="mt-8 pt-6 border-t border-charcoal/5 flex flex-col items-center gap-3">
            <Link 
              to="/admin-login" 
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-light hover:text-charcoal transition-colors underline underline-offset-4"
            >
              <Shield className="w-3.5 h-3.5" />
              Municipal Administrator Console
            </Link>
            <Link
              to="/"
              className="text-xs text-teal hover:text-teal-light font-medium transition-colors"
            >
              Continue as Guest (Read Only)
            </Link>
          </div>
        </div>
      </div>

      {/* Real Platform Identity Summary Card */}
      <div className="mt-8 max-w-md mx-auto text-center px-4">
        <p className="text-xs text-charcoal-light leading-relaxed">
          <strong className="text-charcoal font-medium">EcoCity</strong> is a Smart Civic Engagement Platform that combines complaint management with community participation.
        </p>
      </div>

    </div>
  );
}
