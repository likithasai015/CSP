import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useEffect } from "react";

export function Layout() {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-ivory font-sans selection:bg-teal/20 selection:text-teal-900">
      <Navbar />
      <main className="flex-grow pt-20 flex flex-col">
        {/* The Outlet renders the child route's component */}
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
