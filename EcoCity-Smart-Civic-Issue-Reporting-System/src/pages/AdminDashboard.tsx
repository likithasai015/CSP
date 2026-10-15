import { 
  XCircle, BarChart3, AlertTriangle, Eye, Search, Download, 
  Trash2, Clock, User, MapPin, Calendar, ArrowUpDown, CheckCircle2, 
  Building2, LogOut, Filter, ChevronLeft, ChevronRight, FileSpreadsheet,
  Plus, Edit3, Users, X, Sparkles, Check, ShieldCheck
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { DEFAULT_REPORTS, UnifiedReport } from "./ReportIssue";
import { CommunityEvent, INITIAL_EVENTS } from "./CommunityEvents";
import { complaintAPI } from "../api/api";
import brokenStreetlightImg from "../assets/images/broken_streetlight_1784910893615.jpg";
import garbageOverflowImg from "../assets/images/garbage_overflow_1788787302130.jpg";

export interface EventRegistration {
  id: string;
  eventId: number;
  userName: string;
  userEmail: string;
  role: "Participant" | "Volunteer";
  registeredDate: string;
  status: "Confirmed" | "Attended" | "Cancelled";
}

const DEFAULT_EVENT_REGISTRATIONS: EventRegistration[] = [
  { id: "reg-1", eventId: 1, userName: "Alex Walker", userEmail: "alex.walker@gmail.com", role: "Participant", registeredDate: "Nov 02, 2026", status: "Confirmed" },
  { id: "reg-2", eventId: 1, userName: "Priya Sharma", userEmail: "priya.sharma@gmail.com", role: "Volunteer", registeredDate: "Nov 03, 2026", status: "Confirmed" },
  { id: "reg-3", eventId: 1, userName: "Marcus Vance", userEmail: "marcus.v@ecocity.org", role: "Participant", registeredDate: "Nov 04, 2026", status: "Confirmed" },
  { id: "reg-4", eventId: 2, userName: "David Chen", userEmail: "david.chen@gmail.com", role: "Participant", registeredDate: "Nov 05, 2026", status: "Confirmed" },
  { id: "reg-5", eventId: 2, userName: "Sarah Jenkins", userEmail: "sarah.j@ecocity.org", role: "Volunteer", registeredDate: "Nov 06, 2026", status: "Confirmed" },
  { id: "reg-6", eventId: 3, userName: "Elena Rostova", userEmail: "elena.r@gmail.com", role: "Participant", registeredDate: "Nov 07, 2026", status: "Confirmed" },
  { id: "reg-7", eventId: 3, userName: "Carlos Mendez", userEmail: "carlos.m@gmail.com", role: "Volunteer", registeredDate: "Nov 08, 2026", status: "Confirmed" },
];

const EVENT_CATEGORIES = [
  "Beach Cleanup",
  "Tree Plantation",
  "Clothes Donation",
  "Waste Segregation",
  "Park Maintenance",
  "River Cleanup",
  "Solar & Green Workshop",
  "Recycling Drive",
  "Other"
];

const DEPARTMENTS = [
  "Sanitation Department", 
  "Water Department", 
  "Electrical Department", 
  "Public Works Department", 
  "Sewer Department", 
  "Animal Control Department",
  "Parks & Forestry Department",
  "Environmental Protection Department"
];

const CATEGORIES = [
  "Garbage", "Potholes", "Broken Streetlights", "Water Leakage", 
  "Illegal Tree Cutting", "Pollution", "Waste Burning", "Stray Animal Issues", "Other"
];

export function AdminDashboard() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("reports");
  
  // Search & Filter state
  const [searchId, setSearchId] = useState("");
  const [searchName, setSearchName] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState<"latest" | "oldest">("latest");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Selected Report for Details Modal
  const [selectedReport, setSelectedReport] = useState<UnifiedReport | null>(null);

  // Dynamic reports state synced with localStorage
  const [reports, setReports] = useState<UnifiedReport[]>(() => {
    const stored = localStorage.getItem("ecocity_reports");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        let updated = false;
        const cleaned = parsed.map((r: UnifiedReport) => {
          if (r.category === "Broken Streetlights") {
            updated = true;
            return { ...r, img: brokenStreetlightImg };
          }
          if (r.category === "Garbage" || r.id === 1 || r.title.toLowerCase().includes("garbage")) {
            updated = true;
            return { ...r, title: "Garbage Overflow", img: garbageOverflowImg };
          }
          return r;
        });
        if (updated) {
          localStorage.setItem("ecocity_reports", JSON.stringify(cleaned));
        }
        return cleaned;
      } catch (e) {
        return DEFAULT_REPORTS;
      }
    }
    return DEFAULT_REPORTS;
  });

  // Fetch live reports from backend
  React.useEffect(() => {
    const fetchAdminReports = async () => {
      try {
        const res = await complaintAPI.adminGetAllComplaints();
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const backendReports: UnifiedReport[] = res.data.data.map((r: any) => ({
            id: r._id || r.id,
            complaintId: r.complaintId,
            title: r.title || `Issue at ${r.locationName}`,
            category: r.category || "Garbage",
            status: r.status || "Pending",
            location: r.locationName || r.location,
            date: r.createdAt ? new Date(r.createdAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            }) : "Recent",
            user: r.name || "Citizen",
            userEmail: r.email,
            description: r.description || "",
            contact: r.contact,
            img: r.photoUrl || r.img || garbageOverflowImg,
            afterImg: r.resolutionImage,
            department: r.department || r.assignedDepartment || "Sanitation Department",
            latitude: r.latitude,
            longitude: r.longitude,
            emailNotification: r.emailNotification
          }));

          setReports((prev) => {
            const existingIds = new Set(backendReports.map(b => String(b.id)));
            const nonDuplicates = prev.filter(p => !existingIds.has(String(p.id)));
            const merged = [...backendReports, ...nonDuplicates];
            localStorage.setItem("ecocity_reports", JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err: any) {
        console.warn("Could not fetch reports from backend, using cached reports:", err.message);
      }
    };

    fetchAdminReports();
  }, []);

  const handleUpdateStatus = async (id: number | string, newStatus: "Pending" | "In Progress" | "Resolved") => {
    const updated = reports.map(r => r.id === id ? { ...r, status: newStatus } : r);
    setReports(updated);
    localStorage.setItem("ecocity_reports", JSON.stringify(updated));
    if (selectedReport?.id === id) {
      setSelectedReport({ ...selectedReport, status: newStatus });
    }

    try {
      await complaintAPI.adminUpdateStatus(id, newStatus);
    } catch (err: any) {
      console.warn("Backend status update error:", err.message);
    }
  };

  const handleUpdateDepartment = async (id: number | string, dept: string) => {
    const updated = reports.map(r => r.id === id ? { ...r, department: dept === "Unassigned" ? undefined : dept } : r);
    setReports(updated);
    localStorage.setItem("ecocity_reports", JSON.stringify(updated));
    if (selectedReport?.id === id) {
      setSelectedReport({ ...selectedReport, department: dept === "Unassigned" ? undefined : dept });
    }

    try {
      await complaintAPI.adminUpdateDepartment(id, dept);
    } catch (err: any) {
      console.warn("Backend department update error:", err.message);
    }
  };

  const handleDeleteReport = (id: number | string) => {
    if (confirm("Are you sure you want to permanently delete this report?")) {
      const updated = reports.filter(r => r.id !== id);
      setReports(updated);
      localStorage.setItem("ecocity_reports", JSON.stringify(updated));
      if (selectedReport?.id === id) {
        setSelectedReport(null);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/admin-login");
  };

  // Events management state
  const [adminEvents, setAdminEvents] = useState<CommunityEvent[]>(() => {
    const stored = localStorage.getItem("ecocity_community_events");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return INITIAL_EVENTS;
  });

  const [eventRegistrations, setEventRegistrations] = useState<EventRegistration[]>(() => {
    const stored = localStorage.getItem("ecocity_event_registrations");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return DEFAULT_EVENT_REGISTRATIONS;
  });

  // Event modal states
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventFormData, setEventFormData] = useState({
    title: "",
    category: "Beach Cleanup",
    eventDate: "",
    time: "",
    venue: "",
    organizer: "EcoCity Municipal Administration",
    maxParticipants: 100,
    initialParticipants: 0,
    initialVolunteers: 0
  });

  // Registrations management modal
  const [managingEvent, setManagingEvent] = useState<CommunityEvent | null>(null);
  const [registrantSearch, setRegistrantSearch] = useState("");
  const [newRegistrantName, setNewRegistrantName] = useState("");
  const [newRegistrantEmail, setNewRegistrantEmail] = useState("");
  const [newRegistrantRole, setNewRegistrantRole] = useState<"Participant" | "Volunteer">("Participant");

  const handleOpenCreateEvent = () => {
    setEditingEventId(null);
    setEventFormData({
      title: "",
      category: "Beach Cleanup",
      eventDate: "",
      time: "9:00 AM - 1:00 PM",
      venue: "",
      organizer: "EcoCity Municipal Administration",
      maxParticipants: 100,
      initialParticipants: 0,
      initialVolunteers: 0
    });
    setIsEventModalOpen(true);
  };

  const handleOpenEditEvent = (evt: CommunityEvent) => {
    setEditingEventId(evt.id);
    setEventFormData({
      title: evt.title,
      category: evt.category,
      eventDate: evt.eventDate,
      time: evt.time,
      venue: evt.venue,
      organizer: evt.organizer,
      maxParticipants: evt.maxParticipants,
      initialParticipants: evt.initialParticipants,
      initialVolunteers: evt.initialVolunteers
    });
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormData.title.trim() || !eventFormData.eventDate.trim()) return;

    if (editingEventId !== null) {
      const updated = adminEvents.map(evt => {
        if (evt.id === editingEventId) {
          return {
            ...evt,
            ...eventFormData,
            maxParticipants: Number(eventFormData.maxParticipants) || 100,
            initialParticipants: Number(eventFormData.initialParticipants) || 0,
            initialVolunteers: Number(eventFormData.initialVolunteers) || 0,
          };
        }
        return evt;
      });
      setAdminEvents(updated);
      localStorage.setItem("ecocity_community_events", JSON.stringify(updated));
    } else {
      const nextId = adminEvents.length > 0 ? Math.max(...adminEvents.map(e => e.id)) + 1 : 1;
      const newEvt: CommunityEvent = {
        id: nextId,
        title: eventFormData.title.trim(),
        category: eventFormData.category,
        eventDate: eventFormData.eventDate.trim(),
        time: eventFormData.time.trim() || "9:00 AM - 1:00 PM",
        venue: eventFormData.venue.trim() || "EcoCity Central Plaza",
        organizer: eventFormData.organizer.trim() || "EcoCity Municipal Administration",
        maxParticipants: Number(eventFormData.maxParticipants) || 100,
        initialParticipants: Number(eventFormData.initialParticipants) || 0,
        initialVolunteers: Number(eventFormData.initialVolunteers) || 0,
      };
      const updated = [newEvt, ...adminEvents];
      setAdminEvents(updated);
      localStorage.setItem("ecocity_community_events", JSON.stringify(updated));
    }

    setIsEventModalOpen(false);
  };

  const handleDeleteEvent = (id: number) => {
    if (confirm("Are you sure you want to permanently delete this event? All associated registrations will also be removed.")) {
      const updated = adminEvents.filter(e => e.id !== id);
      setAdminEvents(updated);
      localStorage.setItem("ecocity_community_events", JSON.stringify(updated));

      const updatedRegs = eventRegistrations.filter(r => r.eventId !== id);
      setEventRegistrations(updatedRegs);
      localStorage.setItem("ecocity_event_registrations", JSON.stringify(updatedRegs));

      if (managingEvent?.id === id) {
        setManagingEvent(null);
      }
    }
  };

  const handleAddRegistrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingEvent || !newRegistrantName.trim() || !newRegistrantEmail.trim()) return;

    const newReg: EventRegistration = {
      id: `reg-${Date.now()}`,
      eventId: managingEvent.id,
      userName: newRegistrantName.trim(),
      userEmail: newRegistrantEmail.trim(),
      role: newRegistrantRole,
      registeredDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Confirmed"
    };

    const updated = [newReg, ...eventRegistrations];
    setEventRegistrations(updated);
    localStorage.setItem("ecocity_event_registrations", JSON.stringify(updated));

    // Update the event counters in adminEvents
    const updatedEvents = adminEvents.map(evt => {
      if (evt.id === managingEvent.id) {
        return {
          ...evt,
          initialParticipants: newRegistrantRole === "Participant" ? evt.initialParticipants + 1 : evt.initialParticipants,
          initialVolunteers: newRegistrantRole === "Volunteer" ? evt.initialVolunteers + 1 : evt.initialVolunteers
        };
      }
      return evt;
    });
    setAdminEvents(updatedEvents);
    localStorage.setItem("ecocity_community_events", JSON.stringify(updatedEvents));

    setNewRegistrantName("");
    setNewRegistrantEmail("");
  };

  const handleDeleteRegistrant = (regId: string) => {
    const regToRemove = eventRegistrations.find(r => r.id === regId);
    const updated = eventRegistrations.filter(r => r.id !== regId);
    setEventRegistrations(updated);
    localStorage.setItem("ecocity_event_registrations", JSON.stringify(updated));

    if (regToRemove && managingEvent) {
      const updatedEvents = adminEvents.map(evt => {
        if (evt.id === managingEvent.id) {
          return {
            ...evt,
            initialParticipants: regToRemove.role === "Participant" ? Math.max(0, evt.initialParticipants - 1) : evt.initialParticipants,
            initialVolunteers: regToRemove.role === "Volunteer" ? Math.max(0, evt.initialVolunteers - 1) : evt.initialVolunteers
          };
        }
        return evt;
      });
      setAdminEvents(updatedEvents);
      localStorage.setItem("ecocity_community_events", JSON.stringify(updatedEvents));
    }
  };

  // Filtered and Sorted Reports
  const filteredAndSortedReports = useMemo(() => {
    let result = reports.filter(report => {
      // Filter by Status
      if (statusFilter !== "All" && report.status !== statusFilter) return false;
      
      // Filter by Category
      if (categoryFilter !== "All" && report.category !== categoryFilter) return false;

      // Search by ID
      if (searchId.trim() !== "") {
        const query = searchId.toLowerCase();
        const formattedId = `REP-${report.id}`.toLowerCase();
        if (!formattedId.includes(query) && !String(report.id).includes(query)) return false;
      }

      // Search by Citizen Name
      if (searchName.trim() !== "") {
        const query = searchName.toLowerCase();
        if (!report.user.toLowerCase().includes(query)) return false;
      }

      return true;
    });

    // Sort
    return result.sort((a, b) => {
      const aTime = new Date(a.date).getTime() || (typeof a.id === 'number' ? a.id : 0);
      const bTime = new Date(b.date).getTime() || (typeof b.id === 'number' ? b.id : 0);
      if (sortBy === "latest") {
        return bTime - aTime;
      } else {
        return aTime - bTime;
      }
    });
  }, [reports, statusFilter, categoryFilter, searchId, searchName, sortBy]);

  // Pagination bounds
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedReports.length / pageSize));
  const activePage = currentPage > totalPages ? 1 : currentPage;
  
  const paginatedReports = useMemo(() => {
    return filteredAndSortedReports.slice((activePage - 1) * pageSize, activePage * pageSize);
  }, [filteredAndSortedReports, activePage, pageSize]);

  // Dynamic analytics calculations
  const totalCount = reports.length;
  const pendingCount = reports.filter(r => r.status === "Pending").length;
  const inProgressCount = reports.filter(r => r.status === "In Progress").length;
  const resolvedCount = reports.filter(r => r.status === "Resolved").length;

  // Category Distribution calculation
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    CATEGORIES.forEach(cat => { counts[cat] = 0; });
    reports.forEach(r => {
      if (counts[r.category] !== undefined) {
        counts[r.category]++;
      } else {
        counts["Other"] = (counts["Other"] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  // Department Distribution calculation
  const departmentCounts = useMemo(() => {
    const counts: Record<string, number> = { "Unassigned": 0 };
    DEPARTMENTS.forEach(dept => { counts[dept] = 0; });
    reports.forEach(r => {
      if (r.department && counts[r.department] !== undefined) {
        counts[r.department]++;
      } else {
        counts["Unassigned"]++;
      }
    });
    return Object.entries(counts);
  }, [reports]);

  // Export Filtered Reports to CSV format
  const handleExportCSV = () => {
    const headers = ["Complaint ID", "Citizen Name", "Title", "Category", "Description", "Location", "Date Submitted", "Status", "Assigned Department", "Contact"];
    const rows = filteredAndSortedReports.map(r => [
      `REP-${r.id}`,
      r.user,
      `"${r.title.replace(/"/g, '""')}"`,
      r.category,
      `"${r.description.replace(/"/g, '""')}"`,
      `"${r.location.replace(/"/g, '""')}"`,
      r.date,
      r.status,
      r.department || "Unassigned",
      r.contact || "None"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EcoCity_Complaints_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 pb-6 border-b border-charcoal/5 gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="bg-charcoal text-white text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
              Console
            </span>
            <span className="text-charcoal-light text-sm font-medium">EcoCity Operator Platform</span>
          </div>
          <h1 className="text-3xl font-display font-semibold text-charcoal">
            Municipal Dashboard
          </h1>
        </div>
        
        {/* Active operator profile & Log out */}
        <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-charcoal/5 shadow-sm">
          <div className="text-right">
            <div className="text-xs text-charcoal-light font-medium">Logged in as</div>
            <div className="text-sm font-semibold text-charcoal">{user?.name || "Administrator"}</div>
          </div>
          <div className="h-8 w-px bg-charcoal/10" />
          <button 
            onClick={handleLogout}
            className="p-2 text-coral hover:bg-coral/5 rounded-xl transition-all"
            title="Log Out of Session"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-charcoal/5 p-3 md:p-4 shadow-sm flex lg:flex-col overflow-x-auto lg:overflow-x-visible gap-2 lg:space-y-1.5 scrollbar-none">
            {[
              { id: 'reports', label: 'Manage Complaints', icon: AlertTriangle, count: totalCount },
              { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
              { id: 'departments', label: 'City Departments', icon: Building2 },
              { id: 'events', label: 'Events Management', icon: Calendar, count: adminEvents.length },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSelectedReport(null);
                }}
                className={cn(
                  "flex-shrink-0 lg:w-full flex items-center justify-between gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all",
                  activeTab === item.id 
                    ? "bg-charcoal text-white shadow-md font-semibold" 
                    : "text-charcoal-light hover:bg-ivory hover:text-charcoal"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4.5 h-4.5" />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-md font-mono",
                    activeTab === item.id ? "bg-white/20 text-white" : "bg-charcoal/5 text-charcoal"
                  )}>
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          
          {/* TAB 1: MANAGE COMPLAINTS */}
          {activeTab === 'reports' && (
            <>
              {/* Simulation Banner */}
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start shadow-xs">
                <div className="p-1 bg-amber-100 rounded-lg text-amber-700 flex-shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-amber-900 mb-0.5 font-sans">Operational Simulation Mode</h4>
                  <p className="text-[11px] text-amber-700 leading-normal">
                    This admin console is configured for cloud integration. Once the production backend database is connected, reports submitted by citizens will stream directly into this view in real time.
                  </p>
                </div>
              </div>

              {/* Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Recieved", count: totalCount, color: "text-charcoal bg-charcoal/5" },
                  { label: "Pending Review", count: pendingCount, color: "text-coral bg-coral/5" },
                  { label: "In Progress", count: inProgressCount, color: "text-amber-600 bg-amber-50" },
                  { label: "Resolved Issues", count: resolvedCount, color: "text-sage bg-sage/10" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-charcoal/5 p-5 shadow-sm">
                    <span className="text-xs font-semibold text-charcoal-light uppercase tracking-wider block mb-1">
                      {stat.label}
                    </span>
                    <span className={cn("text-2xl font-display font-bold", stat.color.split(" ")[0])}>
                      {stat.count}
                    </span>
                  </div>
                ))}
              </div>

              {/* Advanced Search & Filtering Console */}
              <div className="bg-white rounded-3xl border border-charcoal/5 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Filter className="w-4 h-4 text-charcoal-light" />
                  <h3 className="text-sm font-semibold text-charcoal uppercase tracking-wider">
                    Complaint Filtering Console
                  </h3>
                </div>
                
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Search by Complaint ID */}
                  <div>
                    <label className="block text-xs font-medium text-charcoal-light mb-1.5">Complaint ID</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-light/60" />
                      <input 
                        type="text" 
                        placeholder="e.g., REP-1"
                        value={searchId}
                        onChange={(e) => { setSearchId(e.target.value); setCurrentPage(1); }}
                        className="w-full text-xs bg-ivory border border-charcoal/10 rounded-xl pl-9 pr-3 py-2.5 focus:border-charcoal focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Search by Citizen Name */}
                  <div>
                    <label className="block text-xs font-medium text-charcoal-light mb-1.5">Citizen Name</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-light/60" />
                      <input 
                        type="text" 
                        placeholder="e.g., Alex"
                        value={searchName}
                        onChange={(e) => { setSearchName(e.target.value); setCurrentPage(1); }}
                        className="w-full text-xs bg-ivory border border-charcoal/10 rounded-xl pl-9 pr-3 py-2.5 focus:border-charcoal focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div>
                    <label className="block text-xs font-medium text-charcoal-light mb-1.5">Category</label>
                    <select 
                      value={categoryFilter}
                      onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full text-xs bg-ivory border border-charcoal/10 rounded-xl px-3 py-2.5 focus:border-charcoal focus:outline-none"
                    >
                      <option value="All">All Categories</option>
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-xs font-medium text-charcoal-light mb-1.5">Status</label>
                    <select 
                      value={statusFilter}
                      onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full text-xs bg-ivory border border-charcoal/10 rounded-xl px-3 py-2.5 focus:border-charcoal focus:outline-none"
                    >
                      <option value="All">All Statuses</option>
                      <option value="Pending">Pending</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>

                {/* Sort & CSV Export bar */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-charcoal/5">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium text-charcoal-light">Sort Order:</span>
                    <div className="flex rounded-lg bg-ivory p-0.5">
                      <button
                        onClick={() => setSortBy("latest")}
                        className={cn(
                          "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                          sortBy === "latest" ? "bg-white text-charcoal shadow-sm" : "text-charcoal-light hover:text-charcoal"
                        )}
                      >
                        Latest First
                      </button>
                      <button
                        onClick={() => setSortBy("oldest")}
                        className={cn(
                          "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                          sortBy === "oldest" ? "bg-white text-charcoal shadow-sm" : "text-charcoal-light hover:text-charcoal"
                        )}
                      >
                        Oldest First
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleExportCSV}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-charcoal text-white hover:bg-charcoal/90 rounded-xl text-xs font-medium transition-all shadow-sm cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export Filtered to CSV
                  </button>
                </div>
              </div>

              {/* Data Table Container */}
              <div className="bg-white rounded-3xl border border-charcoal/5 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-charcoal/5 flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-charcoal">Complaints Database</h2>
                    <p className="text-xs text-charcoal-light">Showing {filteredAndSortedReports.length} records</p>
                  </div>
                </div>
                
                {paginatedReports.length === 0 ? (
                  <div className="text-center py-20 px-6 text-charcoal-light space-y-3">
                    <div className="w-12 h-12 bg-charcoal/5 rounded-full flex items-center justify-center mx-auto text-charcoal/40">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <p className="font-semibold text-charcoal text-sm">No live complaints available.</p>
                    <p className="text-xs max-w-sm mx-auto leading-relaxed">
                      Once the backend is connected, all citizen reports will automatically appear here.
                    </p>
                  </div>
                ) : (
                  <div>
                    {/* Desktop View Table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-ivory text-[11px] uppercase tracking-wider text-charcoal-light font-semibold">
                            <th className="px-6 py-4">Complaint ID</th>
                            <th className="px-6 py-4">Citizen Name</th>
                            <th className="px-6 py-4">Issue Details</th>
                            <th className="px-6 py-4">Dept Assignment</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-charcoal/5">
                          {paginatedReports.map((report) => (
                            <tr key={report.id} className="hover:bg-ivory/50 transition-colors">
                              {/* Complaint ID */}
                              <td className="px-6 py-4 font-mono text-xs font-semibold text-charcoal">
                                REP-{report.id}
                              </td>
                              
                              {/* Citizen Name */}
                              <td className="px-6 py-4">
                                <div className="font-medium text-charcoal text-sm">{report.user}</div>
                                <div className="text-[10px] text-charcoal-light mt-0.5 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {report.date}
                                </div>
                              </td>
                              
                              {/* Issue details & Category */}
                              <td className="px-6 py-4 max-w-xs">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-semibold text-charcoal text-sm truncate">
                                    {report.title}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-charcoal/5 text-charcoal-light font-medium flex-shrink-0">
                                    {report.category}
                                  </span>
                                </div>
                                <p className="text-xs text-charcoal-light line-clamp-1">
                                  {report.description}
                                </p>
                              </td>

                              {/* Department Assignment */}
                              <td className="px-6 py-4">
                                <select
                                  value={report.department || "Unassigned"}
                                  onChange={(e) => handleUpdateDepartment(report.id, e.target.value)}
                                  className={cn(
                                    "text-xs border rounded-lg px-2.5 py-1 focus:outline-none font-medium",
                                    report.department 
                                      ? "bg-teal/5 border-teal/20 text-teal" 
                                      : "bg-charcoal/5 border-charcoal/10 text-charcoal-light"
                                  )}
                                >
                                  <option value="Unassigned">Unassigned</option>
                                  {DEPARTMENTS.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                  ))}
                                </select>
                              </td>
                              
                              {/* Status */}
                              <td className="px-6 py-4">
                                <span className={cn(
                                  "text-xs px-2.5 py-1 rounded-full font-semibold inline-block",
                                  report.status === 'Pending' ? "bg-coral/10 text-coral animate-pulse" : 
                                  report.status === 'In Progress' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-teal/10 text-teal"
                                )}>
                                  {report.status}
                                </span>
                              </td>

                              {/* Actions */}
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button 
                                    onClick={() => setSelectedReport(report)}
                                    className="p-1.5 text-teal hover:bg-teal/10 rounded-lg transition-colors"
                                    title="Expand Full Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  
                                  <div className="h-4 w-px bg-charcoal/10" />

                                  <button 
                                    onClick={() => handleUpdateStatus(report.id, "In Progress")}
                                    className={cn(
                                      "p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors",
                                      report.status === "In Progress" && "bg-amber-50"
                                    )}
                                    title="Mark In Progress"
                                  >
                                    <Clock className="w-4 h-4" />
                                  </button>

                                  <button 
                                    onClick={() => handleUpdateStatus(report.id, "Resolved")}
                                    className={cn(
                                      "p-1.5 text-sage hover:bg-sage/10 rounded-lg transition-colors",
                                      report.status === "Resolved" && "bg-sage/10"
                                    )}
                                    title="Mark Resolved"
                                  >
                                    <CheckCircle2 className="w-4 h-4" />
                                  </button>

                                  <button 
                                    onClick={() => handleDeleteReport(report.id)}
                                    className="p-1.5 text-coral hover:bg-coral/10 rounded-lg transition-colors"
                                    title="Delete Permanent"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile View Stacked Cards */}
                    <div className="block md:hidden divide-y divide-charcoal/5">
                      {paginatedReports.map((report) => (
                        <div key={report.id} className="p-5 space-y-4 hover:bg-ivory/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-charcoal bg-charcoal/5 px-2 py-0.5 rounded">
                              REP-{report.id}
                            </span>
                            <span className={cn(
                              "text-xs px-2.5 py-1 rounded-full font-semibold",
                              report.status === 'Pending' ? "bg-coral/10 text-coral" : 
                              report.status === 'In Progress' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-teal/10 text-teal"
                            )}>
                              {report.status}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-charcoal leading-snug">
                              {report.title}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-charcoal-light">
                              <span className="font-semibold text-charcoal">{report.user}</span>
                              <span>•</span>
                              <span>{report.date}</span>
                              <span>•</span>
                              <span className="bg-charcoal/5 px-1.5 py-0.5 rounded font-mono font-medium">{report.category}</span>
                            </div>
                            <p className="text-xs text-charcoal-light leading-relaxed line-clamp-2 pt-1">
                              {report.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1 items-end">
                            <div>
                              <label className="block text-[9px] uppercase font-bold text-charcoal-light tracking-wider mb-1">
                                Dept Assignment
                              </label>
                              <select
                                value={report.department || "Unassigned"}
                                onChange={(e) => handleUpdateDepartment(report.id, e.target.value)}
                                className={cn(
                                  "w-full text-[11px] border rounded-lg px-2 py-1.5 focus:outline-none font-medium",
                                  report.department 
                                    ? "bg-teal/5 border-teal/20 text-teal" 
                                    : "bg-charcoal/5 border-charcoal/10 text-charcoal-light"
                                )}
                              >
                                <option value="Unassigned">Unassigned</option>
                                {DEPARTMENTS.map(d => (
                                  <option key={d} value={d}>{d}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex justify-end">
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => setSelectedReport(report)}
                                  className="p-2 text-teal hover:bg-teal/10 rounded-lg transition-colors border border-charcoal/5"
                                  title="Expand Full Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                
                                <button 
                                  onClick={() => handleUpdateStatus(report.id, "In Progress")}
                                  className={cn(
                                    "p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-charcoal/5",
                                    report.status === "In Progress" && "bg-amber-50"
                                  )}
                                  title="Mark In Progress"
                                >
                                  <Clock className="w-4 h-4" />
                                </button>

                                <button 
                                  onClick={() => handleUpdateStatus(report.id, "Resolved")}
                                  className={cn(
                                    "p-2 text-sage hover:bg-sage/10 rounded-lg transition-colors border border-charcoal/5",
                                    report.status === "Resolved" && "bg-sage/10"
                                  )}
                                  title="Mark Resolved"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>

                                <button 
                                  onClick={() => handleDeleteReport(report.id)}
                                  className="p-2 text-coral hover:bg-coral/10 rounded-lg transition-colors border border-charcoal/5"
                                  title="Delete Permanent"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pagination footer */}
                {filteredAndSortedReports.length > 0 && (
                  <div className="p-4 bg-ivory border-t border-charcoal/5 flex items-center justify-between text-xs text-charcoal-light">
                    <span>
                      Page <strong className="text-charcoal">{activePage}</strong> of <strong className="text-charcoal">{totalPages}</strong> ({filteredAndSortedReports.length} total)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={activePage === 1}
                        className="p-1.5 rounded-lg border border-charcoal/10 bg-white text-charcoal hover:bg-ivory transition-colors disabled:opacity-40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={activePage === totalPages}
                        className="p-1.5 rounded-lg border border-charcoal/10 bg-white text-charcoal hover:bg-ivory transition-colors disabled:opacity-40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* View Detail Modal Overlay */}
              {selectedReport && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-charcoal/10 shadow-2xl relative">
                    {/* Header */}
                    <div className="p-6 border-b border-charcoal/5 flex items-center justify-between bg-ivory">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono font-bold text-charcoal bg-charcoal/5 px-2 py-0.5 rounded">
                            REP-{selectedReport.id}
                          </span>
                          <span className={cn(
                            "text-[10px] px-2 py-0.5 rounded font-semibold uppercase tracking-wider",
                            selectedReport.status === "Resolved" ? "bg-sage/10 text-sage" : 
                            selectedReport.status === "In Progress" ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-teal/10 text-teal"
                          )}>
                            {selectedReport.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-charcoal">{selectedReport.title}</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedReport(null)}
                        className="p-2 text-charcoal-light hover:text-charcoal hover:bg-charcoal/5 rounded-full transition-all"
                      >
                        <XCircle className="w-6 h-6 stroke-[1.5]" />
                      </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                      {/* Image Preview */}
                      {selectedReport.img && (
                        <div className="rounded-2xl overflow-hidden border border-charcoal/5 max-h-60 bg-ivory">
                          <img 
                            src={selectedReport.img} 
                            alt={selectedReport.title} 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {/* Complaint Info Grid */}
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-charcoal-light tracking-wider block mb-1">
                              Citizen Reporter
                            </span>
                            <div className="flex items-center gap-2 text-charcoal font-medium">
                              <User className="w-4 h-4 text-charcoal/40" />
                              <span className="text-sm">{selectedReport.user}</span>
                            </div>
                            {selectedReport.userEmail && (
                              <div className="text-[11px] text-teal font-medium ml-6 mt-0.5 font-mono">
                                {selectedReport.userEmail}
                              </div>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-charcoal-light tracking-wider block mb-1">
                              Contact Details
                            </span>
                            <p className="text-sm text-charcoal font-medium font-mono">
                              {selectedReport.contact || "No contact info provided"}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-charcoal-light tracking-wider block mb-1">
                              Date & Time Submitted
                            </span>
                            <div className="flex items-center gap-2 text-charcoal">
                              <Calendar className="w-4 h-4 text-charcoal/40" />
                              <span className="text-sm">{selectedReport.date}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-charcoal-light tracking-wider block mb-1">
                              Precise Location
                            </span>
                            <div className="flex items-center gap-2 text-charcoal">
                              <MapPin className="w-4 h-4 text-charcoal/40" />
                              <span className="text-sm font-medium">{selectedReport.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Full Description */}
                      <div className="bg-ivory rounded-2xl p-4 border border-charcoal/5">
                        <span className="text-[10px] uppercase font-bold text-charcoal-light tracking-wider block mb-1">
                          Full Issue Description
                        </span>
                        <p className="text-charcoal text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedReport.description}
                        </p>
                      </div>

                      {/* Management Controls */}
                      <div className="pt-6 border-t border-charcoal/5 grid sm:grid-cols-2 gap-4">
                        {/* Department assignment */}
                        <div>
                          <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-2">
                            Assigned Department
                          </label>
                          <select
                            value={selectedReport.department || "Unassigned"}
                            onChange={(e) => handleUpdateDepartment(selectedReport.id, e.target.value)}
                            className="w-full text-sm bg-ivory border border-charcoal/10 rounded-xl px-3 py-2.5 focus:border-charcoal focus:outline-none font-medium"
                          >
                            <option value="Unassigned">Unassigned / Dispatch</option>
                            {DEPARTMENTS.map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        {/* Status Adjustment */}
                        <div>
                          <label className="block text-xs font-semibold text-charcoal uppercase tracking-wider mb-2">
                            Resolution Status
                          </label>
                          <div className="flex gap-1.5">
                            {(["Pending", "In Progress", "Resolved"] as const).map(s => (
                              <button
                                key={s}
                                onClick={() => handleUpdateStatus(selectedReport.id, s)}
                                className={cn(
                                  "flex-1 text-xs py-2.5 font-medium rounded-xl border transition-all",
                                  selectedReport.status === s 
                                    ? s === "Resolved" ? "bg-sage border-sage text-white shadow-sm" : 
                                      s === "In Progress" ? "bg-amber-500 border-amber-500 text-white shadow-sm" : "bg-coral border-coral text-white shadow-sm"
                                    : "bg-white border-charcoal/10 text-charcoal hover:bg-ivory"
                                )}
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Timeline & Before/After Images for Admin Panel (Requirements 7 & 8) */}
                      <div className="pt-6 border-t border-charcoal/5 space-y-6">
                        <span className="text-[10px] uppercase font-bold text-charcoal-light tracking-wider block">
                          Visual Timeline & Documentation Progress
                        </span>

                        {/* Timeline */}
                        <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-charcoal/10 pl-1">
                          <div className="flex gap-4 items-start relative z-10">
                            <div className="w-5 h-5 rounded-full bg-teal text-white flex items-center justify-center text-[10px] font-bold shadow-sm">✓</div>
                            <div>
                              <span className="text-xs font-semibold text-charcoal block">Complaint Submitted</span>
                              <span className="text-[10px] text-charcoal-light">Logged and active.</span>
                            </div>
                          </div>

                          <div className="flex gap-4 items-start relative z-10">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm",
                              (selectedReport.status === "In Progress" || selectedReport.status === "Resolved") 
                                ? "bg-teal text-white" 
                                : "bg-white border-2 border-charcoal/20 text-charcoal-light"
                            )}>
                              {(selectedReport.status === "In Progress" || selectedReport.status === "Resolved") ? "✓" : "2"}
                            </div>
                            <div>
                              <span className={cn("text-xs font-semibold block", (selectedReport.status === "In Progress" || selectedReport.status === "Resolved") ? "text-charcoal" : "text-charcoal-light")}>
                                Assigned to Department
                              </span>
                              <span className="text-[10px] text-charcoal-light">
                                {selectedReport.department ? `Assigned to ${selectedReport.department}` : "Awaiting assignment dispatcher."}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-4 items-start relative z-10">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm",
                              (selectedReport.status === "In Progress" || selectedReport.status === "Resolved") 
                                ? "bg-teal text-white" 
                                : "bg-white border-2 border-charcoal/20 text-charcoal-light"
                            )}>
                              {selectedReport.status === "Resolved" ? "✓" : "3"}
                            </div>
                            <div>
                              <span className={cn("text-xs font-semibold block", (selectedReport.status === "In Progress" || selectedReport.status === "Resolved") ? "text-charcoal" : "text-charcoal-light")}>
                                In Progress
                              </span>
                              <span className="text-[10px] text-charcoal-light">
                                {selectedReport.status === "Resolved" ? "Operation finished." : selectedReport.status === "In Progress" ? "Site work currently underway." : "Awaiting site crew deployment."}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-4 items-start relative z-10">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm",
                              selectedReport.status === "Resolved" 
                                ? "bg-sage text-white" 
                                : "bg-white border-2 border-charcoal/20 text-charcoal-light"
                            )}>
                              {selectedReport.status === "Resolved" ? "✓" : "4"}
                            </div>
                            <div>
                              <span className={cn("text-xs font-semibold block", selectedReport.status === "Resolved" ? "text-sage" : "text-charcoal-light")}>
                                Resolved
                              </span>
                              <span className="text-[10px] text-charcoal-light">
                                {selectedReport.status === "Resolved" ? "Marked as complete. Citizen notified." : "Awaiting final operator review."}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Before & After Images */}
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <span className="text-[10px] text-charcoal-light uppercase font-bold tracking-wider block mb-1">Before Image</span>
                            <div className="h-32 rounded-xl bg-ivory border border-charcoal/5 overflow-hidden flex items-center justify-center relative">
                              {selectedReport.img ? (
                                <img src={selectedReport.img} alt="Before" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-charcoal-light italic">No photo uploaded</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] text-charcoal-light uppercase font-bold tracking-wider block mb-1">After Image</span>
                            <div className="h-32 rounded-xl bg-ivory border border-charcoal/5 overflow-hidden flex items-center justify-center text-center p-2 relative">
                              {selectedReport.status === "Resolved" ? (
                                <img src={selectedReport.afterImg || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600"} alt="After" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[10px] text-coral font-medium italic leading-normal">
                                  Resolution image will appear after the issue is resolved.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-ivory border-t border-charcoal/5 flex justify-between items-center">
                      <button
                        onClick={() => {
                          handleDeleteReport(selectedReport.id);
                        }}
                        className="flex items-center gap-1.5 text-xs text-coral hover:bg-coral/5 px-3 py-2 rounded-xl font-semibold transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Complaint Permanent
                      </button>
                      <button
                        onClick={() => setSelectedReport(null)}
                        className="px-5 py-2 bg-charcoal hover:bg-charcoal/90 text-white font-medium rounded-xl text-xs transition-colors"
                      >
                        Done Reviewing
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-8">
              {/* Category distribution charts */}
              <div className="bg-white rounded-3xl border border-charcoal/5 p-6 shadow-sm">
                <h3 className="text-lg font-display font-semibold text-charcoal mb-2">
                  Complaints by Category Distribution
                </h3>
                <p className="text-xs text-charcoal-light mb-6">Load share distribution of citizen reported environmental issues</p>
                
                {totalCount === 0 ? (
                  <p className="text-sm text-charcoal-light py-10 text-center">No reports in database to analyze.</p>
                ) : (
                  <div className="space-y-4">
                    {categoryCounts.map((cat, i) => {
                      const share = totalCount > 0 ? (cat.value / totalCount) * 100 : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-charcoal">{cat.name}</span>
                            <span className="font-mono text-charcoal-light">{cat.value} ({Math.round(share)}%)</span>
                          </div>
                          <div className="h-2.5 w-full bg-ivory rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${share}%` }} 
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                cat.name === "Garbage" ? "bg-teal" :
                                cat.name === "Potholes" ? "bg-amber-500" :
                                cat.name === "Broken Streetlights" ? "bg-coral" : "bg-charcoal/40"
                              )}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Department Resolution Rate Card */}
              <div className="bg-white rounded-3xl border border-charcoal/5 p-6 shadow-sm">
                <h3 className="text-lg font-display font-semibold text-charcoal mb-2">Resolution Rate Progress</h3>
                <div className="space-y-4 mt-6">
                  <div className="h-5 w-full bg-ivory rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${totalCount > 0 ? (resolvedCount / totalCount) * 100 : 0}%` }} 
                      className="bg-sage h-full" 
                      title={`Resolved: ${resolvedCount}`}
                    />
                    <div 
                      style={{ width: `${totalCount > 0 ? (inProgressCount / totalCount) * 100 : 0}%` }} 
                      className="bg-amber-500 h-full" 
                      title={`In Progress: ${inProgressCount}`}
                    />
                    <div 
                      style={{ width: `${totalCount > 0 ? (pendingCount / totalCount) * 100 : 0}%` }} 
                      className="bg-coral h-full" 
                      title={`Pending: ${pendingCount}`}
                    />
                  </div>
                  <div className="flex gap-6 text-xs flex-wrap justify-between">
                    <div className="flex items-center gap-1.5 text-charcoal-light font-medium">
                      <div className="w-3.5 h-3.5 rounded-md bg-sage" />
                      <span>Resolved ({resolvedCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-charcoal-light font-medium">
                      <div className="w-3.5 h-3.5 rounded-md bg-amber-500" />
                      <span>In Progress ({inProgressCount})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-charcoal-light font-medium">
                      <div className="w-3.5 h-3.5 rounded-md bg-coral" />
                      <span>Pending Review ({pendingCount})</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CITY DEPARTMENTS */}
          {activeTab === 'departments' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-charcoal/5 p-6 shadow-sm">
                <h2 className="text-xl font-display font-semibold text-charcoal mb-2">Municipal Departments</h2>
                <p className="text-xs text-charcoal-light">Overview of complaints load distributed by City Departments</p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {departmentCounts.map(([name, count]) => (
                  <div key={name} className="bg-white rounded-2xl border border-charcoal/5 p-6 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-charcoal/5 flex items-center justify-center text-charcoal">
                        <Building2 className="w-6 h-6 stroke-[1.5]" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-charcoal text-sm">{name}</h4>
                        <p className="text-xs text-charcoal-light">Official Municipal Dispatch</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-charcoal">{count}</div>
                      <div className="text-[10px] text-charcoal-light uppercase font-bold tracking-wider">Active Tasks</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EVENTS MANAGEMENT */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Header and Create Button */}
              <div className="bg-white rounded-3xl border border-charcoal/5 p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 text-teal font-medium text-xs mb-1.5 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Municipal Administration</span>
                  </div>
                  <h2 className="text-2xl font-display font-semibold text-charcoal">Events Management</h2>
                  <p className="text-xs md:text-sm text-charcoal-light mt-1">
                    Create municipal environmental initiatives, modify event schedules, and supervise citizen registrations.
                  </p>
                </div>
                <button
                  onClick={handleOpenCreateEvent}
                  className="px-5 py-3 bg-teal hover:bg-teal-light text-white rounded-xl font-medium text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Event</span>
                </button>
              </div>

              {/* Event Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-charcoal/5 p-5 shadow-sm">
                  <div className="text-xs text-charcoal-light font-medium mb-1">Active Events</div>
                  <div className="text-2xl font-bold font-display text-charcoal">{adminEvents.length}</div>
                  <div className="text-[11px] text-teal mt-1 font-medium">Scheduled in EcoCity</div>
                </div>
                <div className="bg-white rounded-2xl border border-charcoal/5 p-5 shadow-sm">
                  <div className="text-xs text-charcoal-light font-medium mb-1">Total Registrations</div>
                  <div className="text-2xl font-bold font-display text-charcoal">
                    {adminEvents.reduce((sum, e) => sum + e.initialParticipants, 0)}
                  </div>
                  <div className="text-[11px] text-charcoal-light mt-1">Citizen participants enrolled</div>
                </div>
                <div className="bg-white rounded-2xl border border-charcoal/5 p-5 shadow-sm">
                  <div className="text-xs text-charcoal-light font-medium mb-1">Community Volunteers</div>
                  <div className="text-2xl font-bold font-display text-sage">
                    {adminEvents.reduce((sum, e) => sum + e.initialVolunteers, 0)}
                  </div>
                  <div className="text-[11px] text-charcoal-light mt-1">Volunteers registered</div>
                </div>
              </div>

              {/* Events List */}
              <div className="space-y-4">
                {adminEvents.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-charcoal/5 shadow-sm p-12 text-center space-y-3">
                    <Calendar className="w-12 h-12 text-charcoal/20 mx-auto" />
                    <h3 className="text-lg font-display font-medium text-charcoal">No Events Created Yet</h3>
                    <p className="text-xs text-charcoal-light max-w-sm mx-auto">
                      Click "Create New Event" to launch your first municipal environmental or civic drive.
                    </p>
                    <button
                      onClick={handleOpenCreateEvent}
                      className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-teal text-white rounded-xl text-xs font-medium hover:bg-teal-light"
                    >
                      <Plus className="w-4 h-4" />
                      Create Event
                    </button>
                  </div>
                ) : (
                  adminEvents.map((evt) => {
                    const eventRegs = eventRegistrations.filter(r => r.eventId === evt.id);
                    const totalOccupancy = evt.initialParticipants + evt.initialVolunteers;
                    const pctOccupied = Math.min(100, Math.round((totalOccupancy / Math.max(1, evt.maxParticipants)) * 100));

                    return (
                      <div 
                        key={evt.id} 
                        className="bg-white rounded-2xl border border-charcoal/5 p-6 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
                      >
                        <div className="space-y-3 flex-grow">
                          <div className="flex flex-wrap items-center gap-2.5">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal/10 text-teal">
                              {evt.category}
                            </span>
                            <span className="text-xs text-charcoal-light font-mono">
                              ID: #EVT-{evt.id}
                            </span>
                          </div>

                          <h3 className="text-lg font-semibold text-charcoal">{evt.title}</h3>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs text-charcoal-light">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3.5 h-3.5 text-teal/70 flex-shrink-0" />
                              <span>{evt.eventDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-teal/70 flex-shrink-0" />
                              <span>{evt.time}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-3.5 h-3.5 text-teal/70 flex-shrink-0" />
                              <span className="truncate">{evt.venue}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-3.5 h-3.5 text-teal/70 flex-shrink-0" />
                              <span className="truncate">{evt.organizer}</span>
                            </div>
                          </div>

                          {/* Capacity indicator */}
                          <div className="space-y-1.5 pt-1 max-w-md">
                            <div className="flex justify-between items-center text-[11px]">
                              <span className="text-charcoal-light">
                                <strong>{totalOccupancy}</strong> of <strong>{evt.maxParticipants}</strong> seats occupied ({pctOccupied}%)
                              </span>
                              <span className="text-teal font-medium">
                                {Math.max(0, evt.maxParticipants - totalOccupancy)} seats remaining
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-ivory rounded-full overflow-hidden">
                              <div 
                                style={{ width: `${pctOccupied}%` }}
                                className="h-full bg-teal rounded-full"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0">
                          <button
                            onClick={() => {
                              setManagingEvent(evt);
                              setRegistrantSearch("");
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-medium border border-teal/20 text-teal hover:bg-teal/5 flex items-center gap-1.5 cursor-pointer transition-all"
                            title="View Registrations"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>Registrations</span>
                            <span className="ml-1 px-1.5 py-0.2 bg-teal/10 rounded-full font-mono text-[10px]">
                              {eventRegs.length > 0 ? eventRegs.length : totalOccupancy}
                            </span>
                          </button>

                          <button
                            onClick={() => handleOpenEditEvent(evt)}
                            className="px-3 py-2 rounded-xl text-xs font-medium border border-charcoal/10 text-charcoal hover:bg-ivory flex items-center gap-1.5 cursor-pointer transition-all"
                            title="Edit Event"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteEvent(evt.id)}
                            className="p-2 rounded-xl text-xs font-medium text-coral hover:bg-coral/10 transition-all cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* MODAL 1: CREATE / EDIT EVENT */}
              {isEventModalOpen && (
                <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-charcoal/5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                    <button
                      onClick={() => setIsEventModalOpen(false)}
                      className="absolute top-5 right-5 p-2 text-charcoal-light hover:text-charcoal hover:bg-charcoal/5 rounded-full transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="mb-6">
                      <div className="text-xs text-teal font-medium uppercase tracking-wider mb-1">
                        {editingEventId !== null ? "Edit Event" : "New Municipal Event"}
                      </div>
                      <h3 className="text-xl font-display font-semibold text-charcoal">
                        {editingEventId !== null ? "Update Event Details" : "Create Community Event"}
                      </h3>
                      <p className="text-xs text-charcoal-light mt-1">
                        All updates will appear immediately on the citizen Events portal.
                      </p>
                    </div>

                    <form onSubmit={handleSaveEvent} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-charcoal mb-1.5">Event Title *</label>
                        <input
                          type="text"
                          required
                          value={eventFormData.title}
                          onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                          placeholder="e.g. Riverside Plastic Cleanup Drive"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal/15 text-sm focus:outline-none focus:border-teal"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-charcoal mb-1.5">Category *</label>
                          <select
                            value={eventFormData.category}
                            onChange={(e) => setEventFormData({ ...eventFormData, category: e.target.value })}
                            className="w-full px-3 py-2.5 rounded-xl border border-charcoal/15 text-sm focus:outline-none focus:border-teal bg-white"
                          >
                            {EVENT_CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-charcoal mb-1.5">Event Date *</label>
                          <input
                            type="text"
                            required
                            value={eventFormData.eventDate}
                            onChange={(e) => setEventFormData({ ...eventFormData, eventDate: e.target.value })}
                            placeholder="e.g. Nov 25, 2026"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal/15 text-sm focus:outline-none focus:border-teal"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-charcoal mb-1.5">Time Schedule *</label>
                          <input
                            type="text"
                            required
                            value={eventFormData.time}
                            onChange={(e) => setEventFormData({ ...eventFormData, time: e.target.value })}
                            placeholder="e.g. 9:00 AM - 12:00 PM"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal/15 text-sm focus:outline-none focus:border-teal"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-charcoal mb-1.5">Max Seats / Capacity *</label>
                          <input
                            type="number"
                            min="1"
                            required
                            value={eventFormData.maxParticipants}
                            onChange={(e) => setEventFormData({ ...eventFormData, maxParticipants: Number(e.target.value) })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal/15 text-sm focus:outline-none focus:border-teal"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-charcoal mb-1.5">Venue / Location *</label>
                        <input
                          type="text"
                          required
                          value={eventFormData.venue}
                          onChange={(e) => setEventFormData({ ...eventFormData, venue: e.target.value })}
                          placeholder="e.g. City Central Park (East Entrance)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal/15 text-sm focus:outline-none focus:border-teal"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-charcoal mb-1.5">Organizer Department *</label>
                        <input
                          type="text"
                          required
                          value={eventFormData.organizer}
                          onChange={(e) => setEventFormData({ ...eventFormData, organizer: e.target.value })}
                          placeholder="e.g. Municipal Sanitation Department"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-charcoal/15 text-sm focus:outline-none focus:border-teal"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4 bg-ivory rounded-2xl p-3.5 text-xs">
                        <div>
                          <label className="block text-[11px] font-semibold text-charcoal mb-1">Initial Participants</label>
                          <input
                            type="number"
                            min="0"
                            value={eventFormData.initialParticipants}
                            onChange={(e) => setEventFormData({ ...eventFormData, initialParticipants: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 rounded-lg border border-charcoal/15 text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-charcoal mb-1">Initial Volunteers</label>
                          <input
                            type="number"
                            min="0"
                            value={eventFormData.initialVolunteers}
                            onChange={(e) => setEventFormData({ ...eventFormData, initialVolunteers: Number(e.target.value) })}
                            className="w-full px-3 py-1.5 rounded-lg border border-charcoal/15 text-xs bg-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setIsEventModalOpen(false)}
                          className="flex-1 py-2.5 rounded-xl border border-charcoal/15 text-xs font-medium text-charcoal hover:bg-ivory cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-2.5 bg-teal hover:bg-teal-light text-white rounded-xl text-xs font-medium transition-all shadow-sm cursor-pointer"
                        >
                          {editingEventId !== null ? "Save Changes" : "Create Event"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* MODAL 2: MANAGE EVENT REGISTRATIONS */}
              {managingEvent && (
                <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full border border-charcoal/5 shadow-2xl relative max-h-[90vh] flex flex-col">
                    <button
                      onClick={() => setManagingEvent(null)}
                      className="absolute top-5 right-5 p-2 text-charcoal-light hover:text-charcoal hover:bg-charcoal/5 rounded-full transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>

                    <div className="mb-6 flex-shrink-0">
                      <div className="flex items-center gap-2 text-xs font-medium text-teal mb-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>Registration Management</span>
                      </div>
                      <h3 className="text-xl font-display font-semibold text-charcoal">
                        {managingEvent.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-charcoal-light mt-2">
                        <span>{managingEvent.eventDate}</span>
                        <span>•</span>
                        <span>{managingEvent.venue}</span>
                        <span>•</span>
                        <span>Max Capacity: <strong>{managingEvent.maxParticipants}</strong></span>
                      </div>
                    </div>

                    {/* Add Registrant Inline Form */}
                    <div className="bg-ivory rounded-2xl p-4 mb-4 flex-shrink-0">
                      <div className="text-xs font-semibold text-charcoal mb-2">Register Citizen Attendee / Volunteer</div>
                      <form onSubmit={handleAddRegistrant} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                        <input
                          type="text"
                          required
                          placeholder="Citizen Name"
                          value={newRegistrantName}
                          onChange={(e) => setNewRegistrantName(e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-charcoal/15 text-xs bg-white focus:outline-none focus:border-teal"
                        />
                        <input
                          type="email"
                          required
                          placeholder="Email Address"
                          value={newRegistrantEmail}
                          onChange={(e) => setNewRegistrantEmail(e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-charcoal/15 text-xs bg-white focus:outline-none focus:border-teal"
                        />
                        <select
                          value={newRegistrantRole}
                          onChange={(e) => setNewRegistrantRole(e.target.value as "Participant" | "Volunteer")}
                          className="px-2.5 py-1.5 rounded-lg border border-charcoal/15 text-xs bg-white focus:outline-none focus:border-teal"
                        >
                          <option value="Participant">Participant</option>
                          <option value="Volunteer">Volunteer</option>
                        </select>
                        <button
                          type="submit"
                          className="py-1.5 px-3 bg-teal text-white rounded-lg text-xs font-medium hover:bg-teal-light cursor-pointer"
                        >
                          Add Record
                        </button>
                      </form>
                    </div>

                    {/* Search Registrants Filter */}
                    <div className="mb-3 flex-shrink-0">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-charcoal-light/50" />
                        <input
                          type="text"
                          value={registrantSearch}
                          onChange={(e) => setRegistrantSearch(e.target.value)}
                          placeholder="Search registered citizen by name or email..."
                          className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-charcoal/15 text-xs focus:outline-none focus:border-teal"
                        />
                      </div>
                    </div>

                    {/* Registrants Table */}
                    <div className="overflow-y-auto flex-grow rounded-xl border border-charcoal/10">
                      {(() => {
                        const matchingRegs = eventRegistrations
                          .filter(r => r.eventId === managingEvent.id)
                          .filter(r => {
                            if (!registrantSearch.trim()) return true;
                            const q = registrantSearch.toLowerCase();
                            return r.userName.toLowerCase().includes(q) || r.userEmail.toLowerCase().includes(q);
                          });

                        if (matchingRegs.length === 0) {
                          return (
                            <div className="p-8 text-center text-xs text-charcoal-light">
                              {registrantSearch.trim() ? "No registrants matched your search." : "No explicit citizen registrations recorded for this event yet. Use the form above to add attendees."}
                            </div>
                          );
                        }

                        return (
                          <table className="w-full text-left text-xs">
                            <thead className="bg-ivory border-b border-charcoal/10 font-medium text-charcoal">
                              <tr>
                                <th className="p-3">Citizen</th>
                                <th className="p-3">Role</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Status</th>
                                <th className="p-3 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-charcoal/5">
                              {matchingRegs.map((reg) => (
                                <tr key={reg.id} className="hover:bg-ivory/50">
                                  <td className="p-3">
                                    <div className="font-semibold text-charcoal">{reg.userName}</div>
                                    <div className="text-[11px] text-charcoal-light">{reg.userEmail}</div>
                                  </td>
                                  <td className="p-3">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                                      reg.role === "Volunteer" ? "bg-sage/15 text-sage" : "bg-teal/10 text-teal"
                                    )}>
                                      {reg.role}
                                    </span>
                                  </td>
                                  <td className="p-3 text-charcoal-light font-mono text-[11px]">
                                    {reg.registeredDate}
                                  </td>
                                  <td className="p-3">
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      {reg.status}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <button
                                      onClick={() => handleDeleteRegistrant(reg.id)}
                                      className="p-1.5 text-coral hover:bg-coral/10 rounded-lg transition-colors cursor-pointer"
                                      title="Remove Registration"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        );
                      })()}
                    </div>

                    <div className="pt-4 mt-4 border-t border-charcoal/10 flex justify-end flex-shrink-0">
                      <button
                        onClick={() => setManagingEvent(null)}
                        className="px-5 py-2 bg-charcoal text-white rounded-xl text-xs font-medium hover:bg-charcoal/90 cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
