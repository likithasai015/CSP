import { ArrowRight, Sparkles, MapPin, Calendar, HeartHandshake, Leaf, FileText, CheckCircle2, Trees, Trash2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

const RECENT_ISSUES = [
  { id: 1, title: "Fallen Tree on Main St", status: "Resolved", time: "2 hours ago" },
  { id: 2, title: "Blocked Drain near Central Park", status: "In Progress", time: "5 hours ago" },
  { id: 3, title: "Broken Streetlight", status: "Pending", time: "1 day ago" },
];

const UPCOMING_DRIVES = [
  { id: 1, title: "Weekend Beach Cleanup", date: "Saturday, 9:00 AM", volunteers: 42 },
  { id: 2, title: "Downtown Tree Plantation", date: "Sunday, 8:00 AM", volunteers: 15 },
];

export function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-24 md:py-32 overflow-hidden flex flex-col items-center text-center">
        {/* Subtle decorative background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-teal/5 rounded-full blur-3xl pointer-events-none" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 max-w-3xl flex flex-col items-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal/10 text-teal text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Join 2,400+ citizens making an impact</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-display font-medium text-charcoal tracking-tight leading-[1.1] mb-6">
            Build a cleaner, safer, <br className="hidden md:block" />
            <span className="text-teal">better city</span> together.
          </h1>
          
          <p className="text-base md:text-lg text-charcoal-light max-w-3xl mb-10 leading-relaxed">
            A Smart Civic Engagement Platform that empowers citizens to report civic issues, participate in environmental initiatives, volunteer for community activities, and collaborate with local authorities to build cleaner, greener, and smarter cities.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link
              to="/report"
              className="w-full sm:w-auto px-8 py-4 bg-teal hover:bg-teal-light text-ivory rounded-2xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 group"
            >
              Report an Issue
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/events"
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-ivory-dark text-charcoal border border-charcoal/10 rounded-2xl font-medium transition-all flex items-center justify-center gap-2 hover:shadow-sm"
            >
              Explore Events
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Daily Eco Tip & Quick Stats */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-white border-y border-charcoal/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="p-8 rounded-3xl bg-sage/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-20">
                <Leaf className="w-24 h-24 text-sage" />
              </div>
              <h3 className="text-sm font-bold tracking-widest uppercase text-sage mb-2">Daily Eco Tip</h3>
              <p className="text-2xl font-display font-medium text-charcoal leading-snug mb-4 relative z-10">
                "Keep a reusable bag in your backpack or car. It saves an average of 300 plastic bags per year."
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Issues Resolved", value: "1,204+", icon: HeartHandshake },
                { label: "Volunteer Hours", value: "8,500", icon: Calendar },
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-3xl bg-ivory border border-charcoal/5 flex flex-col justify-center">
                  <stat.icon className="w-6 h-6 text-teal mb-4 opacity-80" />
                  <div className="text-3xl font-display font-medium text-charcoal mb-1">{stat.value}</div>
                  <div className="text-sm text-charcoal-light">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* City Impact Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-ivory/30 border-b border-charcoal/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-teal font-sans">Municipal Progress Report</span>
            <h2 className="text-3xl md:text-4xl font-display font-medium text-charcoal mt-2 mb-3">City Impact</h2>
            <p className="text-sm text-charcoal-light leading-relaxed">
              Real-time ecological metrics tracking city-wide cleanliness, waste reduction, greening campaigns, and active community participation.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {[
              { label: "Complaints Reported", value: "1,452", desc: "Reported by citizens", icon: FileText, color: "text-amber-600 bg-amber-50 border-amber-100" },
              { label: "Complaints Resolved", value: "1,204", desc: "83% resolution rate", icon: CheckCircle2, color: "text-teal bg-teal/5 border-teal/10" },
              { label: "Trees Planted", value: "850", desc: "+120 this quarter", icon: Trees, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
              { label: "Events Conducted", value: "48", desc: "Cleanliness drives", icon: Calendar, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
              { label: "Volunteers Engaged", value: "2,400+", desc: "Active community hours", icon: Users, color: "text-purple-600 bg-purple-50 border-purple-100" },
              { label: "Waste Collected", value: "12.4 Tons", desc: "Cleared from pathways", icon: Trash2, color: "text-sky-600 bg-sky-50 border-sky-100" }
            ].map((impact, idx) => {
              const IconComp = impact.icon;
              return (
                <div key={idx} className="bg-white rounded-3xl p-6 border border-charcoal/5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all duration-300">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${impact.color.split(" ").slice(1).join(" ")}`}>
                    <IconComp className={cn("w-5 h-5", impact.color.split(" ")[0])} />
                  </div>
                  <div>
                    <div className="text-2xl font-display font-semibold text-charcoal leading-none mb-1.5">{impact.value}</div>
                    <div className="text-xs font-bold text-charcoal mb-0.5">{impact.label}</div>
                    <div className="text-[10px] text-charcoal-light leading-normal">{impact.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Community Dashboard Preview */}
      <section className="px-4 sm:px-6 lg:px-8 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-display font-medium text-charcoal mb-3">Community Activity</h2>
              <p className="text-charcoal-light">See what's happening around your neighborhood.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Recently Reported */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-charcoal/5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-medium text-xl text-charcoal">Recent Reports</h3>
                <Link to="/report" className="text-sm font-medium text-teal hover:text-teal-light">View all</Link>
              </div>
              <div className="space-y-4">
                {RECENT_ISSUES.map((issue) => (
                  <div key={issue.id} className="p-4 rounded-2xl bg-ivory flex items-center justify-between group hover:bg-ivory-dark transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <MapPin className="w-4 h-4 text-charcoal-light" />
                      </div>
                      <div>
                        <div className="font-medium text-charcoal">{issue.title}</div>
                        <div className="text-xs text-charcoal-light">{issue.time}</div>
                      </div>
                    </div>
                    <div className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      issue.status === 'Resolved' ? 'bg-sage/10 text-sage' : 
                      issue.status === 'In Progress' ? 'bg-teal/10 text-teal' : 
                      'bg-charcoal/5 text-charcoal-light'
                    }`}>
                      {issue.status}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Drives */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-charcoal/5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-display font-medium text-xl text-charcoal">Upcoming Drives</h3>
                <Link to="/events" className="text-sm font-medium text-teal hover:text-teal-light">Explore more</Link>
              </div>
              <div className="space-y-4">
                {UPCOMING_DRIVES.map((drive) => (
                  <div key={drive.id} className="p-4 rounded-2xl bg-ivory flex flex-col gap-3 group hover:bg-ivory-dark transition-colors cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div className="font-medium text-charcoal text-lg">{drive.title}</div>
                      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm flex-shrink-0 text-sm font-medium text-teal">
                        +{drive.volunteers}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-charcoal-light">
                      <Calendar className="w-4 h-4" />
                      {drive.date}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
