import { NavLink, Link } from "react-router-dom";
import { Leaf, Menu, X, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../context/AuthContext";

const PUBLIC_LINKS = [
  { name: "Home", path: "/" },
  { name: "Events", path: "/events" },
  { name: "Report Issue", path: "/report" },
  { name: "Notifications", path: "/notifications" },
];

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ivory/80 backdrop-blur-md border-b border-charcoal/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-teal/10 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
              <Leaf className="w-5 h-5 text-teal" />
            </div>
            <span className="font-display font-semibold text-xl tracking-tight text-charcoal">
              EcoCity
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {PUBLIC_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    cn(
                      "text-sm font-medium transition-colors hover:text-teal",
                      isActive ? "text-teal" : "text-charcoal-light"
                    )
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </div>
            <div className="h-6 w-px bg-charcoal/10" />
            
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-10 h-10 rounded-full bg-teal text-white flex items-center justify-center font-medium font-display hover:bg-teal-light transition-colors"
                >
                  {user.name.charAt(0)}
                </button>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-sm border border-charcoal/5 py-2 overflow-hidden"
                    >
                      <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-charcoal hover:bg-ivory transition-colors">
                        Profile
                      </Link>
                      <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-charcoal hover:bg-ivory transition-colors">
                        My Reports
                      </Link>
                      <Link to="/profile" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-charcoal hover:bg-ivory transition-colors">
                        Settings
                      </Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2.5 text-sm text-charcoal hover:bg-ivory transition-colors border-t border-charcoal/5">
                          Admin Dashboard
                        </Link>
                      )}
                      <div className="h-px w-full bg-charcoal/5 my-1" />
                      <button 
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                        }} 
                        className="block w-full text-left px-4 py-2.5 text-sm text-coral hover:bg-ivory transition-colors"
                      >
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <NavLink
                to="/auth"
                className="flex items-center gap-2 text-sm font-medium text-charcoal hover:text-teal transition-colors"
              >
                <User className="w-4 h-4" />
                Sign In
              </NavLink>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center">
            {user && (
               <button
                 onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                 className="w-8 h-8 mr-3 rounded-full bg-teal text-white flex items-center justify-center font-medium font-display"
               >
                 {user.name.charAt(0)}
               </button>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 -mr-2 text-charcoal hover:bg-charcoal/5 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden bg-ivory border-b border-charcoal/5"
          >
            <div className="px-4 pt-2 pb-6 flex flex-col gap-2">
              {PUBLIC_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "block px-4 py-3 rounded-xl text-base font-medium transition-colors",
                      isActive
                        ? "bg-teal/10 text-teal"
                        : "text-charcoal-light hover:bg-charcoal/5 hover:text-charcoal"
                    )
                  }
                >
                  {link.name}
                </NavLink>
              ))}
              
              {user && (
                <>
                  <NavLink
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "block px-4 py-3 rounded-xl text-base font-medium transition-colors",
                        isActive
                          ? "bg-teal/10 text-teal"
                          : "text-charcoal-light hover:bg-charcoal/5 hover:text-charcoal"
                      )
                    }
                  >
                    Profile
                  </NavLink>
                  <NavLink
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "block px-4 py-3 rounded-xl text-base font-medium transition-colors",
                        isActive
                          ? "bg-teal/10 text-teal"
                          : "text-charcoal-light hover:bg-charcoal/5 hover:text-charcoal"
                      )
                    }
                  >
                    My Reports
                  </NavLink>
                  <NavLink
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "block px-4 py-3 rounded-xl text-base font-medium transition-colors",
                        isActive
                          ? "bg-teal/10 text-teal"
                          : "text-charcoal-light hover:bg-charcoal/5 hover:text-charcoal"
                      )
                    }
                  >
                    Settings
                  </NavLink>
                  {user.role === 'admin' && (
                    <NavLink
                      to="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "block px-4 py-3 rounded-xl text-base font-medium transition-colors border-t border-charcoal/5",
                          isActive
                            ? "bg-teal/10 text-teal"
                            : "text-charcoal-light hover:bg-charcoal/5 hover:text-charcoal"
                        )
                      }
                    >
                      Admin Dashboard
                    </NavLink>
                  )}
                </>
              )}

              <div className="h-px w-full bg-charcoal/5 my-2" />
              
              {user ? (
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-coral hover:bg-coral/5 transition-colors text-left"
                >
                  Sign Out
                </button>
              ) : (
                <NavLink
                  to="/auth"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-charcoal hover:bg-charcoal/5 transition-colors"
                >
                  <User className="w-5 h-5" />
                  Sign In
                </NavLink>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
