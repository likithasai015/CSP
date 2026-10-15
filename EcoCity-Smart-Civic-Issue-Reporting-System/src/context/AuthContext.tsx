import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authAPI, userAPI } from '../api/api';

export interface UserToken {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "Citizen" | "Admin";
}

export interface UserStats {
  ecoPoints: number;
  badges: string[];
  rank: number | null;
}

interface AuthContextType {
  user: UserToken | null;
  stats: UserStats;
  loading: boolean;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  login: (email: string, role?: "user" | "admin") => void; // Mock fallback
  refreshUser: () => Promise<void>;
  refreshStats: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCitizen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserToken | null>(() => {
    // Try to load mock user fallback if there is one
    const stored = localStorage.getItem("ecocity_auth");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  
  const [stats, setStats] = useState<UserStats>({ ecoPoints: 0, badges: [], rank: null });
  const [loading, setLoading] = useState(true);

  const fetchUserStats = useCallback(async () => {
    // Frontend-only mode stats state
    setStats((prev) => prev);
  }, []);

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    const stored = localStorage.getItem("ecocity_auth");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const loginWithGoogle = () => {
    const sessionRandom = Math.floor(1000 + Math.random() * 9000);
    const mockUser: UserToken = {
      id: `citizen-${sessionRandom}`,
      name: "Eco Citizen",
      email: `citizen${sessionRandom}@ecocity.org`,
      role: "user",
    };
    setUser(mockUser);
    localStorage.setItem("ecocity_auth", JSON.stringify(mockUser));
  };

  // Keep original mock login as a fallback for pure frontend demonstration or local tests
  const login = (email: string, role: "user" | "admin" = "user") => {
    const newUser: UserToken = {
      id: "mock-1",
      name: email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1),
      email,
      role: email.includes("admin") ? "admin" : role,
    };
    setUser(newUser);
    localStorage.setItem("ecocity_auth", JSON.stringify(newUser));
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Call backend logout if possible
      await authAPI.logout();
    } catch (err: any) {
      console.error('Logout API call failed', err.message);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('ecocity_auth');
      setUser(null);
      setStats({ ecoPoints: 0, badges: [], rank: null });
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleUrlToken = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const token = queryParams.get('token');
      if (token) {
        localStorage.setItem('token', token);
        const newUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, newUrl);
      }
      await fetchUserProfile();
    };

    handleUrlToken();

    const handleUnauthorized = () => {
      setUser(null);
      setStats({ ecoPoints: 0, badges: [], rank: null });
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [fetchUserProfile]);

  const role = user?.role || '';
  const isAdmin = role === 'Admin' || role === 'admin';
  const isCitizen = role === 'Citizen' || role === 'user';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        stats,
        loading,
        loginWithGoogle,
        logout,
        login,
        refreshUser: fetchUserProfile,
        refreshStats: fetchUserStats,
        isAuthenticated,
        isAdmin,
        isCitizen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
