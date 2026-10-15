import { 
  Camera, MapPin, Calendar as CalIcon, Send, CheckCircle2, 
  ChevronDown, X, User, Mail, AlertCircle, Info, Navigation, RefreshCw
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useAuth } from "../context/AuthContext";
import { complaintAPI } from "../api/api";
import brokenStreetlightImg from "../assets/images/broken_streetlight_1784910893615.jpg";
import garbageOverflowImg from "../assets/images/garbage_overflow_1788787302130.jpg";

const CATEGORIES = [
  "Garbage", "Potholes", "Broken Streetlights", "Water Leakage", 
  "Drainage", "Stray Animal Issues", "Illegal Tree Cutting", "Pollution", "Other"
];

export type UnifiedReport = {
  id: number | string;
  complaintId?: string;
  title: string;
  category: string;
  status: "Pending" | "In Progress" | "Resolved" | "Rejected";
  location: string;
  date: string;
  user: string;
  userEmail?: string;
  description: string;
  contact?: string;
  img?: string;
  afterImg?: string;
  department?: string;
  latitude?: number;
  longitude?: number;
  emailNotification?: {
    sent: boolean;
    messageId?: string;
    error?: string;
  };
};

const getDepartmentByCategory = (category: string): string => {
  switch (category) {
    case "Garbage": return "Sanitation Department";
    case "Potholes": return "Public Works Department";
    case "Broken Streetlights": return "Electrical Department";
    case "Water Leakage": return "Water Department";
    case "Drainage": return "Sewer Department";
    case "Stray Animal Issues": return "Animal Control Department";
    case "Illegal Tree Cutting": return "Parks & Forestry Department";
    case "Pollution": return "Environmental Protection Department";
    default: return "General Municipal Administration";
  }
};

export const DEFAULT_REPORTS: UnifiedReport[] = [
  { 
    id: 1, 
    complaintId: "ECO-10001",
    title: "Garbage Overflow", 
    category: "Garbage", 
    status: "Pending", 
    location: "Sector 4 Market", 
    date: "Oct 24, 2026, 10:30 AM", 
    user: "Alex Walker", 
    userEmail: "alex.walker@gmail.com", 
    description: "Severe garbage overflow spilling out of the municipal dustbin with excessive waste and plastic accumulated on the pedestrian pavement.", 
    department: "Sanitation Department",
    img: garbageOverflowImg
  },
  { 
    id: 2, 
    complaintId: "ECO-10002",
    title: "Broken Streetlight", 
    category: "Broken Streetlights", 
    status: "Resolved", 
    location: "Oak Wood Avenue", 
    date: "Oct 20, 2026, 08:15 PM", 
    user: "Sarah Jenkins", 
    userEmail: "sarah.j@gmail.com", 
    description: "The street light in front of house 42 has been flickering and is now completely out, making the corner dangerous at night.", 
    department: "Electrical Department",
    img: brokenStreetlightImg,
    afterImg: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&q=80&w=600"
  },
];

export function ReportIssue() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Controlled inputs
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [description, setDescription] = useState("");
  const [contact, setContact] = useState("");
  
  // Geolocation
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Photo Upload
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Submission result summary
  const [submissionResult, setSubmissionResult] = useState<{
    complaintId?: string;
    department?: string;
    emailSent?: boolean;
    emailError?: string;
  } | null>(null);

  // Selected complaint details modal state
  const [selectedReport, setSelectedReport] = useState<UnifiedReport | null>(null);

  // Sync citizen info when user object updates
  useEffect(() => {
    if (user?.name && !name) setName(user.name);
    if (user?.email && !email) setEmail(user.email);
  }, [user]);

  // Dynamic reports list synced with backend and localStorage
  const [reports, setReports] = useState<UnifiedReport[]>(() => {
    const stored = localStorage.getItem("ecocity_reports");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed;
      } catch (e) {
        return DEFAULT_REPORTS;
      }
    }
    return DEFAULT_REPORTS;
  });

  // Fetch latest public reports from backend on mount
  useEffect(() => {
    const fetchBackendReports = async () => {
      try {
        const res = await complaintAPI.getPublicRecentReports();
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
            department: r.department || getDepartmentByCategory(r.category || "Garbage"),
            latitude: r.latitude,
            longitude: r.longitude
          }));

          setReports((prev) => {
            // Merge backend reports with existing without duplicating
            const existingIds = new Set(backendReports.map(b => String(b.id)));
            const nonDuplicates = prev.filter(p => !existingIds.has(String(p.id)));
            const combined = [...backendReports, ...nonDuplicates];
            localStorage.setItem("ecocity_reports", JSON.stringify(combined));
            return combined;
          });
        }
      } catch (err) {
        // Silently use cached/localStorage reports if backend is starting up
        console.info("Using local cached reports:", err);
      }
    };

    fetchBackendReports();
  }, []);

  // Browser Geolocation capture handler
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Geolocation is not supported by your browser. Please enter location manually.");
      return;
    }

    setIsLocating(true);
    setGpsStatus("Acquiring GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lng);
        setIsLocating(false);
        setGpsStatus(`GPS Coordinates captured (Accuracy: ±${Math.round(pos.coords.accuracy)}m)`);
        
        // If location text input is empty, provide coordinate string
        if (!location) {
          setLocation(`GPS: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsStatus("Location permission denied. Please enter your location manually below.");
        } else {
          setGpsStatus("Unable to acquire GPS coordinates. Please enter location manually.");
        }
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  const handleClearGps = () => {
    setLatitude(null);
    setLongitude(null);
    setGpsStatus(null);
  };

  // Photo upload and validation
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        setErrorMessage("Please upload an image in JPEG, PNG, or WebP format.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Photo exceeds the 5 MB size limit. Please upload a smaller photo.");
        return;
      }

      setErrorMessage(null);
      setPhotoFile(file);
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  const formatReportDate = (dateTimeStr: string) => {
    if (!dateTimeStr) return "";
    try {
      const d = new Date(dateTimeStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (e) {
      return dateTimeStr;
    }
  };

  // Form submission connected to backend API
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate submissions

    // Client-side validations
    const reporterName = name.trim() || user?.name || "Citizen Reporter";

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setErrorMessage("Please provide a valid email address.");
      return;
    }

    if (!location.trim()) {
      setErrorMessage("Please enter the street, area, or landmark.");
      return;
    }

    if (!photoFile) {
      setErrorMessage("A photograph of the garbage issue is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    // Build FormData payload
    const formData = new FormData();
    formData.append("name", reporterName);
    formData.append("email", email.trim());
    formData.append("locationName", location.trim());
    if (latitude !== null) formData.append("latitude", latitude.toString());
    if (longitude !== null) formData.append("longitude", longitude.toString());
    formData.append("description", description.trim());
    formData.append("title", title.trim() || `${selectedCategory} Complaint near ${location.trim()}`);
    formData.append("category", selectedCategory);
    formData.append("photo", photoFile);
    if (contact.trim()) formData.append("contact", contact.trim());

    try {
      const res = await complaintAPI.submitReport(formData);
      const savedData = res.data?.data;
      const emailNotif = res.data?.emailNotification;

      const formattedDate = formatReportDate(dateTime) || new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const newReport: UnifiedReport = {
        id: savedData?._id || savedData?.id || Date.now(),
        complaintId: savedData?.complaintId || `ECO-${Date.now().toString().slice(-6)}`,
        title: savedData?.title || title || "Garbage Complaint",
        category: savedData?.category || selectedCategory,
        status: savedData?.status || "Pending",
        location: savedData?.locationName || location,
        date: formattedDate,
        user: savedData?.name || name,
        userEmail: savedData?.email || email,
        description: savedData?.description || description,
        contact: savedData?.contact || contact || undefined,
        img: savedData?.photoUrl || photoPreview || garbageOverflowImg,
        department: savedData?.department || getDepartmentByCategory(selectedCategory),
        latitude: savedData?.latitude,
        longitude: savedData?.longitude,
        emailNotification: emailNotif
      };

      const updatedReports = [newReport, ...reports];
      setReports(updatedReports);
      localStorage.setItem("ecocity_reports", JSON.stringify(updatedReports));

      setSubmissionResult({
        complaintId: newReport.complaintId,
        department: newReport.department,
        emailSent: emailNotif?.sent ?? false,
        emailError: emailNotif?.error
      });

      setIsSubmitting(false);
      setIsSuccess(true);

      // Reset form fields
      setTitle("");
      setLocation("");
      setDateTime("");
      setDescription("");
      setContact("");
      setPhotoFile(null);
      setPhotoPreview(null);
      setLatitude(null);
      setLongitude(null);
      setGpsStatus(null);
    } catch (err: any) {
      setIsSubmitting(false);
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to submit complaint. Please check your network connection.";
      setErrorMessage(serverMsg);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Intro Description Board */}
      <div className="bg-white border border-charcoal/5 rounded-3xl p-6 sm:p-8 mb-12 flex flex-col md:flex-row gap-6 items-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center text-teal flex-shrink-0 border border-teal/10">
          <Info className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-display font-medium text-charcoal mb-1">EcoCity Civic Incident Reporting</h2>
          <p className="text-xs sm:text-sm text-charcoal-light leading-relaxed">
            EcoCity connects citizens directly with municipal authorities. Every verified garbage submission is logged in our central database, routed to the Sanitation Department, and triggers an instant transactional email alert to the municipal administration.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        
        {/* Form Section */}
        <div className="lg:col-span-7">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-medium text-charcoal mb-3">Report a Civic Issue</h1>
            <p className="text-charcoal-light">Upload a photo, pinpoint the location, and alert local municipal services in real-time.</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 md:p-8 border border-charcoal/5 shadow-sm">
            
            {/* Error Message Alert */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-coral/10 border border-coral/20 text-coral flex items-start gap-3 text-sm"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Submission Error</strong>
                  <span>{errorMessage}</span>
                </div>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {isSuccess ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-16 h-16 bg-sage/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-sage" />
                  </div>
                  <h3 className="text-2xl font-display font-medium text-charcoal mb-2">Complaint Submitted Successfully!</h3>
                  
                  {submissionResult?.complaintId && (
                    <div className="inline-block px-3.5 py-1.5 rounded-full bg-teal/10 text-teal text-xs font-semibold mb-4">
                      Tracking ID: {submissionResult.complaintId}
                    </div>
                  )}

                  <div className="bg-ivory border border-charcoal/5 rounded-2xl p-5 max-w-md text-sm text-charcoal-light leading-relaxed mb-6 space-y-2 text-left">
                    <div>
                      &bull; Assigned Department: <strong className="text-teal font-semibold">{submissionResult?.department || "Sanitation Department"}</strong>
                    </div>
                    <div>
                      &bull; Status: <span className="font-semibold text-amber-600">Pending Verification</span>
                    </div>
                    <div>
                      &bull; Administrator Notification:{" "}
                      {submissionResult?.emailSent ? (
                        <span className="text-sage font-semibold">✓ Dispatched via Brevo API</span>
                      ) : (
                        <span className="text-charcoal-light italic">
                          (Saved in DB; {submissionResult?.emailError || "Email queued for dispatch"})
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    type="button" 
                    onClick={() => {
                      setIsSuccess(false);
                      setSubmissionResult(null);
                    }} 
                    className="px-6 py-2.5 bg-teal text-white rounded-xl font-medium shadow-sm hover:bg-teal-light transition-all text-xs cursor-pointer"
                  >
                    Submit Another Report
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Citizen Contact Section */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        Citizen Name <span className="text-charcoal-light text-xs font-normal">(Optional)</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your Full Name (or anonymous)"
                          disabled={isSubmitting}
                          className="w-full bg-ivory border border-charcoal/10 rounded-xl pl-11 pr-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all placeholder:text-charcoal-light/50 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        Email Address <span className="text-coral">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light" />
                        <input
                          required
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="email@example.com"
                          disabled={isSubmitting}
                          className="w-full bg-ivory border border-charcoal/10 rounded-xl pl-11 pr-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all placeholder:text-charcoal-light/50 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Short Title & Category */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Summary / Short Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="E.g., Garbage Overflow on Main Road"
                        disabled={isSubmitting}
                        className="w-full bg-ivory border border-charcoal/10 rounded-xl px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all placeholder:text-charcoal-light/50 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">Issue Category</label>
                      <div className="relative">
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          disabled={isSubmitting}
                          className="w-full appearance-none bg-ivory border border-charcoal/10 rounded-xl px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all text-sm"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Photo Upload (Required) */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-charcoal">
                        Garbage Photo <span className="text-coral">*</span>
                      </label>
                      <span className="text-[11px] text-charcoal-light">JPEG, PNG, WebP up to 5MB</span>
                    </div>

                    <label className={cn(
                      "flex flex-col items-center justify-center w-full h-44 border-2 border-dashed rounded-2xl bg-ivory transition-colors cursor-pointer overflow-hidden relative",
                      photoPreview ? "border-teal/30" : "border-charcoal/15 hover:bg-ivory-dark"
                    )}>
                      {photoPreview ? (
                        <div className="absolute inset-0 w-full h-full">
                          <img src={photoPreview} alt="Complaint preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-semibold backdrop-blur-xs">
                            Change Photo
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mb-2 shadow-sm border border-charcoal/5">
                            <Camera className="w-6 h-6 text-teal" />
                          </div>
                          <span className="text-sm font-medium text-charcoal">Tap or click to upload garbage photo</span>
                          <span className="text-xs text-charcoal-light mt-1">High-resolution image of the civic issue</span>
                        </>
                      )}
                      <input 
                        type="file" 
                        accept="image/jpeg,image/png,image/webp,image/*" 
                        className="hidden" 
                        onChange={handlePhotoUpload}
                        disabled={isSubmitting} 
                      />
                    </label>
                  </div>

                  {/* Location & GPS Capture */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-charcoal">
                        Location / Landmark <span className="text-coral">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        disabled={isLocating || isSubmitting}
                        className="inline-flex items-center gap-1.5 text-xs text-teal hover:text-teal-dark font-medium transition-colors cursor-pointer"
                      >
                        {isLocating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Locating...</span>
                          </>
                        ) : (
                          <>
                            <Navigation className="w-3.5 h-3.5" />
                            <span>Use Current GPS</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light" />
                      <input
                        required
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="E.g., 5th Avenue, near Green Park corner"
                        disabled={isSubmitting}
                        className="w-full bg-ivory border border-charcoal/10 rounded-xl pl-11 pr-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all placeholder:text-charcoal-light/50 text-sm"
                      />
                    </div>

                    {/* GPS Coordinates Badge or Status message */}
                    {latitude !== null && longitude !== null ? (
                      <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-xl bg-teal/10 border border-teal/20 text-xs text-teal">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-teal animate-pulse" />
                          <span>
                            <strong>GPS Locked:</strong> {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleClearGps}
                          className="text-[11px] underline hover:text-teal-dark cursor-pointer"
                        >
                          Clear GPS
                        </button>
                      </div>
                    ) : gpsStatus ? (
                      <p className="mt-2 text-xs text-charcoal-light flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-charcoal/50 flex-shrink-0" />
                        <span>{gpsStatus}</span>
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-charcoal-light">
                        Tip: You can click &ldquo;Use Current GPS&rdquo; for pinpoint accuracy, or type the address manually.
                      </p>
                    )}
                  </div>

                  {/* Date & Time */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Observation Date &amp; Time (Optional)</label>
                    <div className="relative">
                      <CalIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-light" />
                      <input
                        type="datetime-local"
                        value={dateTime}
                        onChange={(e) => setDateTime(e.target.value)}
                        disabled={isSubmitting}
                        className="w-full bg-ivory border border-charcoal/10 rounded-xl pl-11 pr-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all placeholder:text-charcoal-light/50 text-sm"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Description / Additional Notes</label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Please provide details about the garbage accumulation, nearby landmarks, or severity..."
                      disabled={isSubmitting}
                      className="w-full bg-ivory border border-charcoal/10 rounded-xl px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all placeholder:text-charcoal-light/50 resize-none text-sm"
                    ></textarea>
                  </div>

                  {/* Contact Info (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-2">Alternate Phone / Contact (Optional)</label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="Phone number for inspection field team"
                      disabled={isSubmitting}
                      className="w-full bg-ivory border border-charcoal/10 rounded-xl px-4 py-3 text-charcoal focus:outline-none focus:ring-2 focus:ring-teal/20 focus:border-teal transition-all placeholder:text-charcoal-light/50 text-sm"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-teal hover:bg-teal-light text-white rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Submitting complaint to EcoCity backend...</span>
                      </div>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Report
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>

        {/* History / Cards Section */}
        <div className="lg:col-span-5">
          <div className="mb-6">
            <h3 className="text-xl font-display font-medium text-charcoal">Recent Community Reports</h3>
            <p className="text-xs text-charcoal-light mt-1">Live complaints synchronized with municipal dispatch. Click any card to inspect status.</p>
          </div>
          <div className="space-y-4">
            {reports.map((report) => (
              <div 
                key={report.id} 
                onClick={() => setSelectedReport(report)}
                className="bg-white rounded-2xl border border-charcoal/5 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-teal/20 active:scale-99"
              >
                {report.img && (
                  <div className="h-48 w-full overflow-hidden border-b border-charcoal/5">
                    <img 
                      src={report.img} 
                      alt={report.title} 
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn(
                        "text-xs px-3 py-1 rounded-full font-medium shadow-sm transition-colors",
                        report.status === 'Resolved' ? "bg-sage/10 text-sage" : 
                        report.status === 'In Progress' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-teal/10 text-teal"
                      )}>
                        {report.status}
                    </span>
                    <div className="text-xs font-semibold tracking-wider uppercase text-charcoal-light">
                      {report.complaintId || report.category}
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-charcoal text-lg mb-2">{report.title}</h4>
                  <p className="text-charcoal-light text-sm mb-4 line-clamp-2 leading-relaxed">{report.description}</p>
                  
                  <div className="flex flex-col gap-2.5 pt-3 border-t border-charcoal/5">
                    <div className="flex items-start gap-2.5 text-xs text-charcoal-light">
                      <MapPin className="w-3.5 h-3.5 text-charcoal/40 flex-shrink-0 mt-0.5" />
                      <span>{report.location}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-charcoal-light">
                      <CalIcon className="w-3.5 h-3.5 text-charcoal/40" />
                      <span>{report.date}</span>
                    </div>
                    {report.department && (
                      <div className="flex items-center gap-2.5 text-xs text-teal font-medium mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse mr-1" />
                        <span>Assigned to: {report.department}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Citizen Complaint Details Modal */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-charcoal/5 shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-charcoal/5 px-6 py-5 flex justify-between items-center z-10">
                <div>
                  <span className={cn(
                    "text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider mb-2 inline-block",
                    selectedReport.status === 'Resolved' ? "bg-sage/10 text-sage" : 
                    selectedReport.status === 'In Progress' ? "bg-amber-50 text-amber-600 border border-amber-100" : "bg-teal/10 text-teal"
                  )}>
                    {selectedReport.status}
                  </span>
                  <h3 className="text-xl font-display font-medium text-charcoal">{selectedReport.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-2 text-charcoal-light/60 hover:text-charcoal hover:bg-charcoal/5 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-8">
                
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-ivory rounded-2xl p-4 text-xs">
                  <div>
                    <span className="text-charcoal-light block mb-0.5">Tracking ID</span>
                    <strong className="text-charcoal">{selectedReport.complaintId || String(selectedReport.id)}</strong>
                  </div>
                  <div>
                    <span className="text-charcoal-light block mb-0.5 font-sans">Responsible Department</span>
                    <strong className="text-teal font-medium">{selectedReport.department || "Sanitation Department"}</strong>
                  </div>
                  <div>
                    <span className="text-charcoal-light block mb-0.5">Location</span>
                    <strong className="text-charcoal flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-teal" /> {selectedReport.location}
                    </strong>
                  </div>
                  <div>
                    <span className="text-charcoal-light block mb-0.5">Submitted Date</span>
                    <strong className="text-charcoal flex items-center gap-1">
                      <CalIcon className="w-3 h-3 text-teal" /> {selectedReport.date}
                    </strong>
                  </div>
                </div>

                {/* GPS Info if present */}
                {selectedReport.latitude && selectedReport.longitude && (
                  <div className="bg-teal/5 border border-teal/10 rounded-2xl p-4 text-xs flex items-center justify-between">
                    <div>
                      <span className="text-charcoal-light block">Verified GPS Coordinates</span>
                      <strong className="text-charcoal">
                        {selectedReport.latitude.toFixed(6)}° N, {selectedReport.longitude.toFixed(6)}° E
                      </strong>
                    </div>
                    <a
                      href={`https://www.google.com/maps?q=${selectedReport.latitude},${selectedReport.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-teal text-white rounded-lg font-medium hover:bg-teal-light transition-colors text-[11px]"
                    >
                      Open in Maps &rarr;
                    </a>
                  </div>
                )}

                {/* Full Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-light mb-2">Description</h4>
                  <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap bg-ivory/50 rounded-2xl p-4 border border-charcoal/5">
                    {selectedReport.description || "No additional description provided."}
                  </p>
                </div>

                {/* Live Complaint Timeline */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-light mb-4">Complaint Dispatch Progress</h4>
                  <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-charcoal/10">
                    
                    {/* Step 1: Submitted */}
                    <div className="flex gap-4 items-start relative z-10">
                      <div className="w-6 h-6 rounded-full bg-teal text-white flex items-center justify-center text-xs font-bold shadow-sm">
                        ✓
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-charcoal">Complaint Submitted &amp; Logged</h5>
                        <p className="text-[10px] text-charcoal-light">Successfully stored in municipal database with automated Brevo notification.</p>
                      </div>
                    </div>

                    {/* Step 2: Assigned */}
                    <div className="flex gap-4 items-start relative z-10">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                        (selectedReport.status === "In Progress" || selectedReport.status === "Resolved") 
                          ? "bg-teal text-white" 
                          : "bg-white border-2 border-charcoal/20 text-charcoal-light"
                      )}>
                        {(selectedReport.status === "In Progress" || selectedReport.status === "Resolved") ? "✓" : "2"}
                      </div>
                      <div>
                        <h5 className={cn("text-xs font-bold", (selectedReport.status === "In Progress" || selectedReport.status === "Resolved") ? "text-charcoal" : "text-charcoal-light")}>
                          Assigned to Department
                        </h5>
                        <p className="text-[10px] text-charcoal-light">
                          {(selectedReport.status === "In Progress" || selectedReport.status === "Resolved") 
                            ? `Successfully assigned to ${selectedReport.department || "Sanitation Department"}.` 
                            : "Awaiting dispatcher department assignment."}
                        </p>
                      </div>
                    </div>

                    {/* Step 3: In Progress */}
                    <div className="flex gap-4 items-start relative z-10">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                        (selectedReport.status === "In Progress" || selectedReport.status === "Resolved") 
                          ? "bg-teal text-white animate-pulse" 
                          : "bg-white border-2 border-charcoal/20 text-charcoal-light"
                      )}>
                        {selectedReport.status === "Resolved" ? "✓" : "3"}
                      </div>
                      <div>
                        <h5 className={cn("text-xs font-bold", (selectedReport.status === "In Progress" || selectedReport.status === "Resolved") ? "text-charcoal" : "text-charcoal-light")}>
                          In Progress
                        </h5>
                        <p className="text-[10px] text-charcoal-light">
                          {selectedReport.status === "Resolved" 
                            ? "Field crew dispatched and operation completed." 
                            : selectedReport.status === "In Progress" 
                              ? "Crew has been dispatched to the physical site to initiate resolution works." 
                              : "Operation will begin once assignment is confirmed."}
                        </p>
                      </div>
                    </div>

                    {/* Step 4: Resolved */}
                    <div className="flex gap-4 items-start relative z-10">
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                        selectedReport.status === "Resolved" 
                          ? "bg-sage text-white" 
                          : "bg-white border-2 border-charcoal/20 text-charcoal-light"
                      )}>
                        {selectedReport.status === "Resolved" ? "✓" : "4"}
                      </div>
                      <div>
                        <h5 className={cn("text-xs font-bold", selectedReport.status === "Resolved" ? "text-sage" : "text-charcoal-light")}>
                          Resolved
                        </h5>
                        <p className="text-[10px] text-charcoal-light">
                          {selectedReport.status === "Resolved" 
                            ? "Issue resolved completely! Citizens rewarded with bonus Eco Points." 
                            : "Awaiting final municipal crew site completion sign-off."}
                        </p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Photographic Evidence */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-light mb-4">Site Visual Documentation</h4>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <span className="block text-[10px] font-bold text-charcoal-light uppercase tracking-wider mb-2">Before Image (Citizen Evidence)</span>
                      <div className="h-44 rounded-2xl overflow-hidden border border-charcoal/5 bg-ivory shadow-inner relative flex items-center justify-center">
                        {selectedReport.img ? (
                          <img 
                            src={selectedReport.img} 
                            alt="Before state" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[11px] text-charcoal-light italic">No initial photo uploaded.</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-charcoal-light uppercase tracking-wider mb-2">After Image (Administration)</span>
                      <div className="h-44 rounded-2xl overflow-hidden border border-charcoal/5 bg-ivory shadow-inner relative flex items-center justify-center text-center p-4">
                        {selectedReport.status === "Resolved" ? (
                          <img 
                            src={selectedReport.afterImg || "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=600"} 
                            alt="Resolved after state" 
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-[11px] text-coral/80 font-medium italic">
                            Resolution image will appear after the issue is resolved.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-6 bg-ivory border-t border-charcoal/5 flex justify-end">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-6 py-2.5 bg-teal text-white rounded-xl font-semibold text-xs shadow-sm hover:bg-teal-light transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

export default ReportIssue;
