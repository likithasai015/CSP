import { Leaf, Heart } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-ivory-dark py-12 border-t border-charcoal/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 select-none md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-teal/10 flex items-center justify-center group-hover:bg-teal/20 transition-colors">
                <Leaf className="w-4 h-4 text-teal" />
              </div>
              <span className="font-display font-semibold text-lg tracking-tight text-charcoal">
                EcoCity
              </span>
            </Link>
            <p className="text-charcoal-light text-sm max-w-sm leading-relaxed">
              A community-driven platform for citizens to build a cleaner, safer, and better city together. Report issues, join events, and make a positive impact.
            </p>
          </div>
          <div>
            <h4 className="font-display font-medium text-charcoal mb-4">Platform</h4>
            <ul className="space-y-3">
              {["Report an Issue", "Community Events", "Admin Dashboard"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-charcoal-light hover:text-teal transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-medium text-charcoal mb-4">Connect</h4>
            <ul className="space-y-3">
              {["Contact Support", "Terms of Service", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-charcoal-light hover:text-teal transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-charcoal/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-charcoal-light">
            © {new Date().getFullYear()} EcoCity. All rights reserved.
          </p>
          <p className="text-sm text-charcoal-light flex items-center gap-1.5">
            Designed with <Heart className="w-4 h-4 text-coral" /> for the community
          </p>
        </div>
      </div>
    </footer>
  );
}
