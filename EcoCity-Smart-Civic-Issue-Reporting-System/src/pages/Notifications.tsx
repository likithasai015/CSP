import React, { useState } from "react";
import { 
  Bell, CheckCircle2, ShieldCheck, FileText, Calendar, 
  HeartHandshake, ChevronRight, MessageSquare, AlertCircle, Info, Trash2
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  category: "report" | "event" | "system" | "volunteer";
  read: boolean;
  actionUrl?: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "notif-1",
    title: "Complaint Resolved",
    message: "Excellent news! Your reported issue 'Broken Streetlight' has been fixed by the Electrical Department. Thank you for making EcoCity safer!",
    time: "2 hours ago",
    category: "report",
    read: false,
    actionUrl: "/report"
  },
  {
    id: "notif-2",
    title: "Thank You for Volunteering!",
    message: "You have successfully registered as a volunteer for the 'Weekend Beach Cleanup'. Your dedication helps build a greener community.",
    time: "4 hours ago",
    category: "volunteer",
    read: false,
    actionUrl: "/events"
  },
  {
    id: "notif-3",
    title: "Complaint In Progress",
    message: "Sanitation Department has dispatched a cleanup vehicle to address the 'Excessive Garbage Overflow' complaint. Progress is underway.",
    time: "1 day ago",
    category: "report",
    read: true,
    actionUrl: "/report"
  },
  {
    id: "notif-4",
    title: "Complaint Assigned",
    message: "The issue 'Excessive Garbage Overflow' has been officially assigned to the Sanitation Department.",
    time: "1 day ago",
    category: "report",
    read: true,
    actionUrl: "/report"
  },
  {
    id: "notif-5",
    title: "New Community Event Announced",
    message: "Join the upcoming 'Downtown Tree Plantation' drive this Sunday. Pledgers will earn +15 participation points and +25 volunteer points!",
    time: "2 days ago",
    category: "event",
    read: true,
    actionUrl: "/events"
  },
  {
    id: "notif-6",
    title: "Complaint Received",
    message: "Thank you for submitting 'Excessive Garbage Overflow' complaint. We are verifying details and will assign a municipal department shortly.",
    time: "2 days ago",
    category: "report",
    read: true,
    actionUrl: "/report"
  }
];

export function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const stored = localStorage.getItem("ecocity_notifications");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return INITIAL_NOTIFICATIONS;
      }
    }
    localStorage.setItem("ecocity_notifications", JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    localStorage.setItem("ecocity_notifications", JSON.stringify(updated));
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    localStorage.setItem("ecocity_notifications", JSON.stringify(updated));
  };

  const handleDeleteNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem("ecocity_notifications", JSON.stringify(updated));
  };

  const getNotifIcon = (category: string) => {
    switch (category) {
      case "report":
        return <FileText className="w-5 h-5 text-teal" />;
      case "event":
        return <Calendar className="w-5 h-5 text-indigo-600" />;
      case "volunteer":
        return <HeartHandshake className="w-5 h-5 text-sage animate-bounce" />;
      default:
        return <Bell className="w-5 h-5 text-charcoal-light" />;
    }
  };

  const getNotifStyle = (category: string) => {
    switch (category) {
      case "report":
        return "bg-teal/5 border-teal/10";
      case "event":
        return "bg-indigo-50 border-indigo-100";
      case "volunteer":
        return "bg-sage/10 border-sage/20";
      default:
        return "bg-ivory border-charcoal/5";
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 border-b border-charcoal/5 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-display font-medium text-charcoal">Citizen Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-coral text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse shadow-sm">
                {unreadCount} New
              </span>
            )}
          </div>
          <p className="text-sm text-charcoal-light leading-relaxed">
            Real-time updates regarding your reported civic issues, registered volunteer drives, and platform events.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-medium text-teal hover:text-teal-light bg-teal/5 hover:bg-teal/10 px-4 py-2.5 rounded-xl transition-all self-start sm:self-center"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Description Panel */}
      <div className="bg-white rounded-3xl border border-charcoal/5 p-6 mb-8 flex gap-4 items-start shadow-xs">
        <div className="p-2 bg-teal/5 rounded-xl text-teal flex-shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-semibold text-sm text-charcoal mb-1">EcoCity Civic Network</h4>
          <p className="text-xs text-charcoal-light leading-relaxed">
            EcoCity is a Smart Civic Engagement Platform that empowers citizens to report civic issues, participate in environmental initiatives, volunteer for community activities, and collaborate with local authorities to build cleaner, greener, and smarter cities.
          </p>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-charcoal/5 rounded-3xl p-16 text-center space-y-4"
            >
              <div className="w-16 h-16 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal-light opacity-60">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-display font-medium text-charcoal">Your inbox is clear</h3>
              <p className="text-sm text-charcoal-light max-w-sm mx-auto leading-relaxed">
                When you report issues, volunteer for community events, or receive points, notifications will appear here in real-time.
              </p>
            </motion.div>
          ) : (
            notifications.map((notif) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                onClick={() => handleMarkAsRead(notif.id)}
                className={cn(
                  "bg-white rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4 shadow-xs hover:shadow-md",
                  notif.read ? "border-charcoal/5 opacity-85" : "border-teal/30 ring-1 ring-teal/5"
                )}
              >
                <div className="flex items-start gap-4 flex-1">
                  {/* Category icon indicator */}
                  <div className={cn("p-3 rounded-2xl border flex-shrink-0 mt-0.5", getNotifStyle(notif.category))}>
                    {getNotifIcon(notif.category)}
                  </div>
                  
                  {/* Text Content */}
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4 className={cn("font-semibold text-sm", notif.read ? "text-charcoal" : "text-teal-dark font-medium")}>
                        {notif.title}
                      </h4>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-coral animate-ping" />
                      )}
                    </div>
                    <p className="text-xs text-charcoal-light leading-relaxed mb-1 max-w-2xl">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-charcoal-light font-medium tracking-wide">
                      {notif.time}
                    </span>
                  </div>
                </div>

                {/* Delete button and action details */}
                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={(e) => handleDeleteNotif(notif.id, e)}
                    className="p-2 text-charcoal-light/40 hover:text-coral hover:bg-coral/5 rounded-xl transition-colors"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
