import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Home } from "./pages/Home";
import { ReportIssue } from "./pages/ReportIssue";
import { CommunityEvents } from "./pages/CommunityEvents";
import { Auth } from "./pages/Auth";
import { AdminLogin } from "./pages/AdminLogin";
import { Profile } from "./pages/Profile";
import { Notifications } from "./pages/Notifications";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<CommunityEvents />} />
            <Route path="/memories" element={<Navigate to="/events" replace />} />
            <Route path="/about" element={<Navigate to="/" replace />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/report" element={<ReportIssue />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
            
            {/* Admin Routes */}
            <Route element={<ProtectedRoute requireAdmin={true} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>
          {/* Auth page without Navbar/Footer */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin-login" element={<AdminLogin />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
