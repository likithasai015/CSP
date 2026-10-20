import axios from 'axios';

/**
 * Determine the backend API base URL:
 * 1. If VITE_API_URL is configured (e.g. in separate Vercel deployment), use it (sanitizing trailing slashes).
 * 2. In browser production on Vercel (unified deployment), default to '/api' on the current domain.
 * 3. In local development, fallback to 'http://localhost:5000/api'.
 */
export const getBaseUrl = (): string => {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined" && import.meta.env.PROD) {
    return "/api";
  }

  return "http://localhost:5000/api";
};

export const API_URL = getBaseUrl();

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attaches token from localStorage as request authorization header fallback
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Triggers auth-unauthorized event if backend returns 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);

// 1. Authentication APIs
export const authAPI = {
  adminLogin: async (data: { email: string; password: string }) => {
    try {
      return await api.post('/admin/login', data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        return await api.post('/auth/login', data);
      }
      throw err;
    }
  },
  triggerGoogleLogin: () => {
    window.location.href = `${API_URL}/auth/google?prompt=select_account`;
  },
  getMe: () => api.get('/auth/me'),
  logout: () => api.get('/auth/logout')
};

// 2. Complaint & Report APIs
export const complaintAPI = {
  submitReport: (formData: FormData) => api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submitComplaint: (formData: FormData) => api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAllReports: (params = {}) => api.get('/reports', { params }),
  getPublicRecentReports: () => api.get('/reports/public/recent'),
  getMyComplaints: () => api.get('/reports/my'),
  getComplaintDetails: (id: string | number) => api.get(`/reports/${id}`),
  adminGetAllComplaints: (params = {}) => api.get('/reports', { params }),
  adminUpdateStatus: (id: string | number, status: string, notes?: string) => api.patch(`/reports/${id}/status`, { status, notes }),
  adminUpdateDepartment: (id: string | number, assignedDepartment: string) => api.patch(`/reports/${id}/department`, { assignedDepartment }),
  adminUpdatePriority: (id: string | number, priority: string) => api.patch(`/reports/${id}/priority`, { priority }),
  adminUploadResolutionImage: (id: string | number, formData: FormData) => api.patch(`/reports/${id}/resolution-image`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
};

// 3. Event APIs
export const eventAPI = {
  getUpcomingEvents: () => api.get('/events'),
  registerForEvent: (id: string | number) => api.post(`/events/${id}/register`),
  volunteerForEvent: (id: string | number) => api.post(`/events/${id}/volunteer`),
  getMyEvents: () => api.get('/events/my'),
  adminCreateEvent: (formData: FormData) => api.post('/admin/events', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  adminUpdateEvent: (id: string | number, formData: FormData) => api.patch(`/admin/events/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  adminDeleteEvent: (id: string | number) => api.delete(`/admin/events/${id}`),
  adminGetAllEvents: () => api.get('/admin/events'),
  adminMarkAttendance: (id: string | number, userId: string | number, role: string) => api.post(`/admin/events/${id}/attendance`, { userId, role })
};

// 4. Memory APIs
export const memoryAPI = {
  createMemory: (formData: FormData) => api.post('/memories', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAllMemories: () => api.get('/memories'),
  adminDeleteMemory: (id: string | number) => api.delete(`/admin/memories/${id}`)
};

// 5. Notification APIs
export const notificationAPI = {
  getMyNotifications: () => api.get('/notifications'),
  markAsRead: (id: string | number) => api.patch(`/notifications/${id}/read`),
  deleteNotification: (id: string | number) => api.delete(`/notifications/${id}`)
};

// 6. Stats & Leaderboard APIs
export const userAPI = {
  getMyStats: () => api.get('/users/me/stats'),
  getLeaderboard: () => api.get('/users/leaderboard')
};

export default api;
