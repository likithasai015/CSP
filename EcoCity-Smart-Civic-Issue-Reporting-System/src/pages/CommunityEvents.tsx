import React, { useState, useEffect } from "react";
import { 
  MapPin, Users, Plus, ArrowRight, Calendar, Clock, 
  User, Check, ShieldCheck, X, Sparkles, Building
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getEventIcon, getCategoryStyle, cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

export interface CommunityEvent {
  id: number;
  title: string;
  category: string;
  eventDate: string;
  time: string;
  venue: string;
  organizer: string;
  maxParticipants: number;
  initialParticipants: number;
  initialVolunteers: number;
}

export const INITIAL_EVENTS: CommunityEvent[] = [
  {
    id: 1,
    title: "Weekend Beach Cleanup",
    category: "Beach Cleanup",
    eventDate: "Nov 14, 2026",
    time: "9:00 AM - 12:00 PM",
    venue: "Sunny Beach South Pier",
    organizer: "Eco Warriors Team",
    maxParticipants: 100,
    initialParticipants: 42,
    initialVolunteers: 18
  },
  {
    id: 2,
    title: "Downtown Tree Plantation",
    category: "Tree Plantation",
    eventDate: "Nov 15, 2026",
    time: "8:00 AM - 11:00 AM",
    venue: "City Central Park (East Side)",
    organizer: "Green City Council",
    maxParticipants: 80,
    initialParticipants: 35,
    initialVolunteers: 15
  },
  {
    id: 3,
    title: "Community Clothes Drive",
    category: "Clothes Donation",
    eventDate: "Nov 18, 2026",
    time: "10:00 AM - 4:00 PM",
    venue: "Community Center Hall B",
    organizer: "Helping Hands NGO",
    maxParticipants: 150,
    initialParticipants: 94,
    initialVolunteers: 12
  }
];

export function CommunityEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load events from localStorage or fallback to INITIAL_EVENTS
  const [events, setEvents] = useState<CommunityEvent[]>(() => {
    const stored = localStorage.getItem("ecocity_community_events");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    localStorage.setItem("ecocity_community_events", JSON.stringify(INITIAL_EVENTS));
    return INITIAL_EVENTS;
  });

  // Listen for storage events (e.g. updates from Admin Dashboard)
  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem("ecocity_community_events");
      if (stored) {
        try {
          setEvents(JSON.parse(stored));
        } catch (e) {}
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Load participation action maps from localStorage
  const [joinedMap, setJoinedMap] = useState<Record<number, boolean>>(() => {
    const stored = localStorage.getItem("ecocity_joined_events");
    if (stored) {
      try {
        const arr = JSON.parse(stored);
        return arr.reduce((acc: Record<number, boolean>, id: number) => {
          acc[id] = true;
          return acc;
        }, {});
      } catch (e) {}
    }
    return {};
  });

  const [volunteeredMap, setVolunteeredMap] = useState<Record<number, boolean>>(() => {
    const stored = localStorage.getItem("ecocity_volunteered_events");
    if (stored) {
      try {
        const arr = JSON.parse(stored);
        return arr.reduce((acc: Record<number, boolean>, id: number) => {
          acc[id] = true;
          return acc;
        }, {});
      } catch (e) {}
    }
    return {};
  });

  // Modal alert success dialog
  const [activeModal, setActiveModal] = useState<{
    type: "join" | "volunteer";
    eventName: string;
  } | null>(null);

  const handleJoinEvent = (eventId: number, eventName: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const isAlreadyJoined = joinedMap[eventId];
    const nextState = !isAlreadyJoined;

    // Toggle join state
    const nextMap = { ...joinedMap, [eventId]: nextState };
    setJoinedMap(nextMap);

    // Save to localStorage
    const storedList = Object.keys(nextMap)
      .filter((k) => nextMap[Number(k)])
      .map(Number);
    localStorage.setItem("ecocity_joined_events", JSON.stringify(storedList));

    if (nextState) {
      setActiveModal({ type: "join", eventName });
    }
  };

  const handleRegisterVolunteer = (eventId: number, eventName: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const isAlreadyVolunteered = volunteeredMap[eventId];
    const nextState = !isAlreadyVolunteered;

    // Toggle volunteer state
    const nextMap = { ...volunteeredMap, [eventId]: nextState };
    setVolunteeredMap(nextMap);

    // Save to localStorage
    const storedList = Object.keys(nextMap)
      .filter((k) => nextMap[Number(k)])
      .map(Number);
    localStorage.setItem("ecocity_volunteered_events", JSON.stringify(storedList));

    if (nextState) {
      setActiveModal({ type: "volunteer", eventName });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
      
      {/* Header */}
      <div className="mb-16">
        <div className="max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-display font-medium text-charcoal mb-4">Community Events</h1>
          <p className="text-base text-charcoal-light leading-relaxed">
            EcoCity is a Smart Civic Engagement Platform that empowers citizens to report civic issues, participate in environmental initiatives, volunteer for community activities, and collaborate with local authorities to build cleaner, greener, and smarter cities.
          </p>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => {
          const CategoryIcon = getEventIcon(event.category || event.title);
          const categoryStyle = getCategoryStyle(event.category || event.title);
          
          const hasJoined = joinedMap[event.id] || false;
          const hasVolunteered = volunteeredMap[event.id] || false;

          // Dynamic calculation of counters
          const totalParticipants = event.initialParticipants + (hasJoined ? 1 : 0);
          const totalVolunteers = event.initialVolunteers + (hasVolunteered ? 1 : 0);
          const seatsRemaining = Math.max(event.maxParticipants - totalParticipants, 0);

          return (
            <div key={event.id} className="bg-white rounded-3xl border border-charcoal/5 p-8 shadow-sm hover:shadow-md transition-all group flex flex-col h-full relative">
              
              {/* Category indicator */}
              <div className="absolute top-6 right-6">
                 <div className={cn("px-3 py-1 rounded-full text-xs font-semibold", categoryStyle)}>
                  {event.category}
                </div>
              </div>

              {/* Graphic Icon */}
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border", categoryStyle)}>
                <CategoryIcon className="w-6 h-6 stroke-[1.5]" />
              </div>
              
              <div className="flex flex-col flex-grow">
                <h3 className="text-xl font-medium text-charcoal mb-4 pr-16">{event.title}</h3>
                
                {/* Event details block (Requirement 6) */}
                <div className="space-y-3.5 mb-6 flex-grow border-b border-charcoal/5 pb-6">
                  <div className="flex items-center gap-3 text-xs text-charcoal-light">
                    <Calendar className="w-4 h-4 text-teal/60 flex-shrink-0" />
                    <span className="font-semibold text-charcoal">Date: </span>
                    <span>{event.eventDate}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-charcoal-light">
                    <Clock className="w-4 h-4 text-teal/60 flex-shrink-0" />
                    <span className="font-semibold text-charcoal">Time: </span>
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-start gap-3 text-xs text-charcoal-light">
                    <MapPin className="w-4 h-4 text-teal/60 flex-shrink-0 mt-0.5" />
                    <span className="font-semibold text-charcoal">Venue: </span>
                    <span>{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-charcoal-light">
                    <Building className="w-4 h-4 text-teal/60 flex-shrink-0" />
                    <span className="font-semibold text-charcoal">Organizer: </span>
                    <span>{event.organizer}</span>
                  </div>
                </div>

                {/* Additional Event Sizing Details */}
                <div className="grid grid-cols-2 gap-4 mb-6 bg-ivory rounded-2xl p-4 text-xs">
                  <div>
                    <span className="text-charcoal-light block">Max Seats</span>
                    <strong className="text-charcoal text-sm">{event.maxParticipants}</strong>
                  </div>
                  <div>
                    <span className="text-charcoal-light block">Seats Remaining</span>
                    <strong className={cn("text-sm", seatsRemaining < 10 ? "text-coral font-bold" : "text-teal font-bold")}>
                      {seatsRemaining} Left
                    </strong>
                  </div>
                </div>

                {/* Participant Counter section (Requirement 5) */}
                <div className="flex items-center justify-between py-3 px-4 bg-teal/5 border border-teal/10 rounded-2xl mb-6 text-xs text-teal font-medium">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Participants: <strong>{totalParticipants}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-sage" />
                    <span>Volunteers: <strong className="text-sage">{totalVolunteers}</strong></span>
                  </div>
                </div>

                {/* Interactive Actions (Requirement 4) */}
                <div className="pt-6 border-t border-charcoal/5 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  {/* Join as Volunteer Button */}
                  <button 
                    onClick={() => handleRegisterVolunteer(event.id, event.title)}
                    className={cn(
                      "w-full sm:w-auto px-4 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer border",
                      hasVolunteered 
                        ? "bg-sage/10 text-sage border-sage/20 font-bold" 
                        : "bg-white border-charcoal/10 text-charcoal hover:bg-ivory"
                    )}
                  >
                    {hasVolunteered ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Volunteering!
                      </>
                    ) : (
                      "Join as Volunteer"
                    )}
                  </button>

                  {/* Join Event Button */}
                  <button 
                    onClick={() => handleJoinEvent(event.id, event.title)}
                    className={cn(
                      "w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs",
                      hasJoined 
                        ? "bg-teal-light text-white font-bold" 
                        : "bg-teal text-white hover:bg-teal-light"
                    )}
                  >
                    {hasJoined ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Joined!
                      </>
                    ) : (
                      <>
                        Join Event
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modern Dialog Success Modal (Requirement 4 success popups) */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full border border-charcoal/5 shadow-xl relative text-center"
            >
              <button 
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-2 text-charcoal-light/60 hover:text-charcoal hover:bg-charcoal/5 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-teal animate-pulse" />
              </div>

              {activeModal.type === "volunteer" ? (
                <>
                  <h3 className="text-2xl font-display font-medium text-charcoal mb-3">Volunteer Registered!</h3>
                  <p className="text-sm text-charcoal-light leading-relaxed mb-6">
                    You have successfully registered as a volunteer. Thank you for committing your time to support <strong className="text-teal font-medium">{activeModal.eventName}</strong>. You've earned <strong className="text-teal">+25 Eco Points</strong>!
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-2xl font-display font-medium text-charcoal mb-3">Participation Confirmed!</h3>
                  <p className="text-sm text-charcoal-light leading-relaxed mb-6">
                    You have successfully joined this event! We are thrilled to have you support <strong className="text-teal font-medium">{activeModal.eventName}</strong>. You've earned <strong className="text-teal">+15 Eco Points</strong>!
                  </p>
                </>
              )}

              <button
                onClick={() => setActiveModal(null)}
                className="w-full py-3 bg-teal hover:bg-teal-light text-white rounded-xl font-medium text-xs transition-all shadow-sm cursor-pointer"
              >
                Done, Great!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
