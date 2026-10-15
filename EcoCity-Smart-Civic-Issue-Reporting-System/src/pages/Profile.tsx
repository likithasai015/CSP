import React, { useState, useEffect } from "react";
import { 
  MapPin, Award, CheckCircle, Flame, Calendar, Leaf, HeartHandshake, HelpCircle, AlertCircle, Sparkles, LogOut, ChevronRight
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  pointsRequired: number;
  color: string;
}

const BADGES: Badge[] = [
  { id: "green-citizen", name: "Green Citizen", icon: "🌱", description: "Earned automatically upon joining EcoCity. Welcome to the team!", pointsRequired: 0, color: "text-teal bg-teal/5 border-teal/10" },
  { id: "cleanliness-hero", name: "Cleanliness Hero", icon: "🧹", description: "Report your first few civic cleanup issues to clear the streets.", pointsRequired: 50, color: "text-amber-600 bg-amber-50 border-amber-100" },
  { id: "tree-guardian", name: "Tree Guardian", icon: "🌳", description: "Actively support neighborhood greening and preservation efforts.", pointsRequired: 120, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  { id: "community-volunteer", name: "Community Volunteer", icon: "🤝", description: "Go above and beyond by volunteering for public neighborhood initiatives.", pointsRequired: 180, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
  { id: "eco-champion", name: "Eco Champion", icon: "🏆", description: "The pinnacle of local impact. Leading the charge for smart city evolution.", pointsRequired: 250, color: "text-purple-600 bg-purple-50 border-purple-100" },
];

export function Profile() {
  const { user, logout } = useAuth();
  const [totalPoints, setTotalPoints] = useState(180); // Default placeholder matching prompt
  const [reportsCount, setReportsCount] = useState(2);
  const [resolvedCount, setResolvedCount] = useState(1);
  const [joinedEventsCount, setJoinedEventsCount] = useState(1);
  const [volunteeredEventsCount, setVolunteeredEventsCount] = useState(1);

  useEffect(() => {
    if (!user) return;

    // Retrieve active reports
    let userReports = [];
    const storedReports = localStorage.getItem("ecocity_reports");
    if (storedReports) {
      try {
        const parsed = JSON.parse(storedReports);
        userReports = parsed.filter((r: any) => 
          r.userEmail?.toLowerCase() === user.email.toLowerCase() || 
          r.user?.toLowerCase() === user.name.toLowerCase()
        );
      } catch (e) {
        console.error(e);
      }
    }

    // Retrieve joined events
    let joined = [];
    const storedJoined = localStorage.getItem("ecocity_joined_events");
    if (storedJoined) {
      try {
        joined = JSON.parse(storedJoined);
      } catch (e) {}
    }

    // Retrieve volunteered events
    let volunteered = [];
    const storedVolunteered = localStorage.getItem("ecocity_volunteered_events");
    if (storedVolunteered) {
      try {
        volunteered = JSON.parse(storedVolunteered);
      } catch (e) {}
    }

    const repCount = userReports.length || 2;
    const resCount = userReports.filter((r: any) => r.status === "Resolved").length || 1;
    const jCount = joined.length || 1;
    const vCount = volunteered.length || 1;

    setReportsCount(repCount);
    setResolvedCount(resCount);
    setJoinedEventsCount(jCount);
    setVolunteeredEventsCount(vCount);

    // Dynamic points calculation
    // Base points to simulate prior contributions so user starts with a realistic positive score
    const baseContributionPoints = 120;
    const pointsFromReports = repCount * 10;
    const pointsFromResolved = resCount * 20;
    const pointsFromJoined = jCount * 15;
    const pointsFromVolunteered = vCount * 25;

    setTotalPoints(baseContributionPoints + pointsFromReports + pointsFromResolved + pointsFromJoined + pointsFromVolunteered);
  }, [user]);

  if (!user) return null;

  // Determine current badge
  const earnedBadges = BADGES.filter(b => totalPoints >= b.pointsRequired);
  const currentBadge = earnedBadges[earnedBadges.length - 1] || BADGES[0];
  const nextBadge = BADGES.find(b => totalPoints < b.pointsRequired) || null;

  // Calculate percentage progress to next badge
  let progressPercent = 100;
  let pointsNeeded = 0;
  if (nextBadge) {
    const currentTierMin = currentBadge.pointsRequired;
    const nextTierMax = nextBadge.pointsRequired;
    const range = nextTierMax - currentTierMin;
    const currentProgress = totalPoints - currentTierMin;
    progressPercent = Math.min(Math.round((currentProgress / range) * 100), 100);
    pointsNeeded = nextBadge.pointsRequired - totalPoints;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Intro Grid */}
      <div className="grid md:grid-cols-3 gap-8 items-start mb-12">
        
        {/* Profile Card */}
        <div className="md:col-span-1 bg-white rounded-3xl p-8 border border-charcoal/5 shadow-sm text-center flex flex-col items-center">
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full bg-teal/10 flex items-center justify-center font-display text-4xl text-teal font-semibold shadow-inner">
              {user.name.charAt(0)}
            </div>
            <span className="absolute bottom-1 right-1 bg-teal text-white p-1.5 rounded-full shadow-md text-xs" title="Verified Citizen">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          
          <h2 className="text-2xl font-display font-medium text-charcoal mb-1">{user.name}</h2>
          <p className="text-xs text-charcoal-light flex items-center gap-1 mb-6">
            <MapPin className="w-3.5 h-3.5 text-teal" /> EcoCity Citizen
          </p>

          <div className="w-full h-px bg-charcoal/5 mb-6" />

          {/* Core Stats Overview */}
          <div className="w-full space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-charcoal-light font-medium">Joined Email</span>
              <span className="font-mono text-charcoal font-semibold">{user.email}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-charcoal-light font-medium">Role Privilege</span>
              <span className="px-2 py-0.5 rounded-full bg-charcoal/5 text-charcoal text-[10px] font-bold uppercase tracking-wider">
                {user.role}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-charcoal-light font-medium">Active Complaints</span>
              <span className="text-charcoal font-bold">{reportsCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-charcoal-light font-medium">Events Supported</span>
              <span className="text-charcoal font-bold">{joinedEventsCount}</span>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="mt-8 w-full py-3 border border-coral/20 hover:bg-coral/5 text-coral rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Session
          </button>
        </div>

        {/* Eco Points Main Board */}
        <div className="md:col-span-2 space-y-8">
          
          {/* Points Card */}
          <div className="bg-white rounded-3xl p-8 border border-charcoal/5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Award className="w-32 h-32 text-teal" />
            </div>

            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal font-sans">Citizen Activity Score</span>
                <h3 className="text-4xl font-display font-semibold text-charcoal mt-1">
                  {totalPoints} <span className="text-lg font-medium text-charcoal-light font-sans">Eco Points</span>
                </h3>
              </div>
              <div className="px-4 py-2 bg-teal/10 rounded-2xl text-teal text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                {currentBadge.name}
              </div>
            </div>

            <p className="text-sm text-charcoal-light leading-relaxed mb-8 max-w-xl">
              Your points reflect your continuous positive footprint. Earn points by reporting municipal problems, ensuring completion, and registering as a volunteer for environmental drives.
            </p>

            {/* Next Badge Progress Bar */}
            {nextBadge ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-charcoal-light font-medium flex items-center gap-1">
                    Next Achievement: <strong className="text-charcoal font-semibold">{nextBadge.name}</strong>
                  </span>
                  <span className="font-semibold text-charcoal">{totalPoints} / {nextBadge.pointsRequired} pts</span>
                </div>
                <div className="w-full h-3 bg-ivory rounded-full border border-charcoal/5 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-teal to-teal-light rounded-full transition-all duration-1000"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-charcoal-light italic">
                  * Reach {nextBadge.pointsRequired} points to unlock {nextBadge.icon} {nextBadge.name} ({pointsNeeded} points remaining).
                </p>
              </div>
            ) : (
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <h4 className="font-bold text-purple-900 text-xs">Supreme Eco Champion Level</h4>
                  <p className="text-[10px] text-purple-700 leading-normal">You have achieved the ultimate level of smart civic integration. Thank you for your leadership!</p>
                </div>
              </div>
            )}
          </div>

          {/* Point Distribution Rules Table */}
          <div className="bg-ivory rounded-3xl p-6 border border-charcoal/5">
            <h4 className="font-semibold text-charcoal text-sm mb-4 flex items-center gap-2">
              <Leaf className="w-4.5 h-4.5 text-teal" /> Points Reward Distribution
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { title: "Report Issue", points: "+10", color: "text-teal" },
                { title: "Issue Resolved", points: "+20", color: "text-sage" },
                { title: "Join Event", points: "+15", color: "text-indigo-600" },
                { title: "Volunteer Drive", points: "+25", color: "text-purple-600" }
              ].map((rule, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl border border-charcoal/5 text-center shadow-xs">
                  <span className="block text-[10px] font-bold text-charcoal-light uppercase tracking-wider mb-1">{rule.title}</span>
                  <strong className={cn("text-xl font-display font-semibold", rule.color)}>{rule.points}</strong>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Requirement 2: My Badges Grid */}
      <div className="bg-white rounded-3xl border border-charcoal/5 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8 border-b border-charcoal/5 pb-4">
          <div className="p-2 bg-teal/5 rounded-xl text-teal">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-display font-medium text-charcoal">My Badges & Honors</h3>
            <p className="text-xs text-charcoal-light">A timeline of your achievements as you support EcoCity environmental evolution.</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {BADGES.map((badge) => {
            const isEarned = totalPoints >= badge.pointsRequired;
            
            return (
              <div 
                key={badge.id}
                className={cn(
                  "border p-6 rounded-2xl transition-all duration-300 flex flex-col items-center text-center relative overflow-hidden",
                  isEarned 
                    ? `${badge.color} shadow-sm scale-100 hover:scale-102` 
                    : "bg-charcoal/[0.02] border-charcoal/5 grayscale opacity-50 cursor-not-allowed"
                )}
              >
                {/* Badge status ribbon */}
                <div className="absolute top-2 right-2">
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-widest",
                    isEarned ? "bg-teal/10 text-teal" : "bg-charcoal/10 text-charcoal"
                  )}>
                    {isEarned ? "Unlocked" : "Locked"}
                  </span>
                </div>

                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl shadow-sm bg-white border border-charcoal/5",
                  !isEarned && "opacity-40"
                )}>
                  {badge.icon}
                </div>

                <h4 className="font-semibold text-charcoal text-sm mb-1.5 leading-snug">{badge.name}</h4>
                <p className="text-[10px] text-charcoal-light leading-normal mb-3 flex-grow">{badge.description}</p>
                
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-white border border-charcoal/5 rounded-md text-charcoal">
                  {badge.pointsRequired} pts
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
