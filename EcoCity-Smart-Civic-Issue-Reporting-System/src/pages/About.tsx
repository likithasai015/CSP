import React from "react";
import { 
  Leaf, User, ShieldCheck, FileText, Database, LayoutDashboard, 
  Building2, RefreshCw, Bell, Calendar, Heart, Award, Volume2, 
  Map, Cloud, Cpu, Phone, Sparkles, CheckCircle, Smartphone
} from "lucide-react";

export function About() {
  const steps = [
    { title: "Citizen", desc: "Reports local issue via portal", icon: User, color: "text-teal bg-teal/10 border-teal/20" },
    { title: "Google Auth", desc: "Secure account verification", icon: ShieldCheck, color: "text-blue-600 bg-blue-50 border-blue-100" },
    { title: "Complaint Submission", desc: "Uploads info & location coordinates", icon: FileText, color: "text-amber-600 bg-amber-50 border-amber-100" },
    { title: "Cloud Database", desc: "Securely stored in Firestore cloud", icon: Database, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
    { title: "Admin Dashboard", desc: "Live operational overview", icon: LayoutDashboard, color: "text-purple-600 bg-purple-50 border-purple-100" },
    { title: "Dept Assignment", desc: "Automatic or manual dispatch", icon: Building2, color: "text-sky-600 bg-sky-50 border-sky-100" },
    { title: "Status Update", desc: "Operator updates work progress", icon: RefreshCw, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
    { title: "Citizen Notification", desc: "Real-time dispatch alert & email", icon: Bell, color: "text-coral bg-coral/5 border-coral/10" }
  ];

  const uniqueFeatures = [
    { title: "Community Events", desc: "Organize, participate, and track localized cleanliness drives and neighborhood greening initiatives.", icon: Calendar },
    { title: "Community Memories", desc: "A shared gallery where citizens capture and celebrate milestones, successful cleanups, and local transformations.", icon: Heart },
    { title: "Volunteer Participation", desc: "Empowers eco-conscious residents to pledge hours, coordinate on schedules, and receive municipal appreciation certificates.", icon: Award },
    { title: "Eco Campaigns", desc: "Educational resources, waste-reduction advice, and city-wide awareness programs right at your fingertips.", icon: Volume2 },
    { title: "Modern Analytics", desc: "A transparent dashboard visualizing local cleanup ratios, category load distribution, and departmental resolution rates.", icon: LayoutDashboard },
    { title: "Smart Department Assignment", desc: "Under the hood, complaints are triaged directly to dedicated city departments depending on the category.", icon: Building2 },
    { title: "Live Complaint Tracking", desc: "Follow the status of municipal work from 'Pending Review' to 'In Progress' and 'Resolved' in real time.", icon: RefreshCw },
    { title: "Smart Categories", desc: "Intuitive classifications from garbage piles and water leakage to animal issues, reducing misrouting.", icon: Sparkles }
  ];

  const futureFeatures = [
    { title: "Google Authentication", desc: "Production-ready social sign-in utilizing secure Google accounts.", icon: ShieldCheck },
    { title: "Mobile OTP Verification", desc: "Dual-factor mobile confirmation to guarantee authentic user reports.", icon: Smartphone },
    { title: "Push Notifications", desc: "Real-time system updates pushed to your device as your report moves through the pipeline.", icon: Bell },
    { title: "AI Complaint Categorization", desc: "Automatic photo analysis and category recommendations using Gemini AI.", icon: Cpu },
    { title: "Duplicate Detection", desc: "Smart filtering algorithms to detect if a nearby issue has already been reported.", icon: Sparkles },
    { title: "GIS Map Integration", desc: "Interactive geographical maps for coordinate-level tracking and heat mapping.", icon: Map },
    { title: "Cloud Image Storage", desc: "Secure image hosting via Cloud Storage buckets, caching URLs directly in the DB.", icon: Cloud },
    { title: "Real-time Sync", desc: "Bi-directional WebSocket streaming ensuring seamless operator-to-citizen connection.", icon: RefreshCw }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      
      {/* Title block */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="w-16 h-16 bg-teal/10 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-inner">
          <Leaf className="w-8 h-8 text-teal animate-pulse" />
        </div>
        <h1 className="text-4xl md:text-5xl font-display font-semibold text-charcoal tracking-tight mb-4">
          About EcoCity
        </h1>
        <p className="text-lg text-teal font-medium uppercase tracking-wider mb-6">
          A Smart Civic Engagement Platform
        </p>
        <p className="text-base text-charcoal-light leading-relaxed">
          EcoCity combines complaint management with active community participation. We believe that modern cities thrive when municipal oversight and citizen action operate in perfect harmony.
        </p>
      </div>

      {/* Production Architecture Section */}
      <div className="bg-white rounded-3xl border border-charcoal/5 p-8 md:p-12 shadow-sm mb-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-display font-bold text-charcoal mb-3">
            Real Cloud System Architecture
          </h2>
          <p className="text-sm text-charcoal-light">
            Behind the interface, EcoCity is engineered to scale across modern serverless cloud infrastructures. Here is how your request travels:
          </p>
        </div>

        {/* Visual pipeline */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-ivory border border-charcoal/5 rounded-2xl p-5 relative flex flex-col items-center text-center">
              {/* Connector lines (decorative for desktop grid) */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 border shadow-sm transition-transform hover:scale-110 duration-250 bg-white">
                <step.icon className={`w-5 h-5 ${step.color.split(" ")[0]}`} />
              </div>
              <div className="text-xs font-bold text-charcoal mb-1">
                {idx + 1}. {step.title}
              </div>
              <p className="text-xs text-charcoal-light leading-relaxed">
                {step.desc}
              </p>
              {idx < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 -translate-y-1/2 text-charcoal/20 z-10 text-lg font-bold">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Unique EcoCity Features Grid */}
      <div className="mb-16">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-display font-bold text-charcoal mb-3">
            What Makes EcoCity Unique?
          </h2>
          <p className="text-sm text-charcoal-light">
            We go beyond standard complaints by integrating civic awareness, volunteer hours, and community memory loops.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {uniqueFeatures.map((feat, idx) => (
            <div key={idx} className="bg-white border border-charcoal/5 p-6 rounded-2xl shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-teal/5 flex items-center justify-center mb-4 text-teal">
                <feat.icon className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h4 className="font-semibold text-charcoal text-sm mb-2">{feat.title}</h4>
              <p className="text-xs text-charcoal-light leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Future roadmap section */}
      <div className="bg-ivory rounded-3xl border border-charcoal/5 p-8 md:p-12">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl font-display font-bold text-charcoal mb-3">
            Future Enhancements Pipeline
          </h2>
          <p className="text-sm text-charcoal-light">
            As we prepare to deploy the production build, we have aligned the following advanced modules for our upcoming release cycle:
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {futureFeatures.map((item, idx) => (
            <div key={idx} className="bg-white border border-charcoal/5 p-5 rounded-xl shadow-xs flex gap-3.5 items-start">
              <div className="p-2 bg-teal/5 rounded-lg text-teal flex-shrink-0 mt-0.5">
                <item.icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <h5 className="font-semibold text-charcoal text-xs mb-1">{item.title}</h5>
                <p className="text-[11px] text-charcoal-light leading-normal">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
