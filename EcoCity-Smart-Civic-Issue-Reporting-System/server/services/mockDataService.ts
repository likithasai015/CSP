import bcrypt from 'bcryptjs';

export interface IEmailNotification {
  sent: boolean;
  messageId?: string;
  error?: string;
  attemptedAt?: Date;
}

export interface IReportData {
  _id: string;
  id: string;
  complaintId: string;
  name: string;
  email: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  description: string;
  title: string;
  category: string;
  department: string;
  contact?: string;
  photoUrl: string;
  photoPublicId?: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedDepartment?: string;
  resolutionNotes?: string;
  resolutionImage?: string;
  emailNotification: IEmailNotification;
  createdAt: Date;
  updatedAt: Date;
  // Frontend compatibility helpers
  location?: string;
  img?: string;
  user?: string;
  userEmail?: string;
  date?: string;
}

export interface MockAdmin {
  id: string;
  _id: string;
  name: string;
  email: string;
  role: 'admin';
  createdAt: Date;
}

/**
 * In-Memory Mock Data Store
 * Provides a database-free centralized state for EcoCity.
 * NOTE: Data resets when the backend server process restarts.
 */
class MockDataService {
  private reports: IReportData[] = [];

  constructor() {
    this.seedDefaultReports();
  }

  /**
   * Initialize realistic civic reports for demonstration
   */
  private seedDefaultReports() {
    const defaultReports: IReportData[] = [
      {
        _id: 'rep-seed-1',
        id: 'rep-seed-1',
        complaintId: 'ECO-10001',
        title: 'Garbage Overflow',
        category: 'Garbage',
        status: 'Pending',
        locationName: 'Sector 4 Market, Main Square',
        location: 'Sector 4 Market, Main Square',
        latitude: 17.4399,
        longitude: 78.4982,
        name: 'Alex Walker',
        user: 'Alex Walker',
        email: 'alex.walker@gmail.com',
        userEmail: 'alex.walker@gmail.com',
        contact: '+91 98765 43210',
        description: 'Severe garbage overflow spilling out of the municipal dustbin with excessive waste and plastic accumulated on the pedestrian pavement.',
        department: 'Sanitation Department',
        assignedDepartment: 'Sanitation Department',
        priority: 'High',
        photoUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=1200',
        photoPublicId: 'report-1792070984340-abe79d636034dd90.jpg',
        img: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=1200',
        emailNotification: {
          sent: true,
          messageId: 'seed-notif-1',
          attemptedAt: new Date(Date.now() - 3600000 * 24 * 2)
        },
        createdAt: new Date(Date.now() - 3600000 * 24 * 2),
        updatedAt: new Date(Date.now() - 3600000 * 24 * 2)
      },
      {
        _id: 'rep-seed-2',
        id: 'rep-seed-2',
        complaintId: 'ECO-10002',
        title: 'Broken Streetlight',
        category: 'Broken Streetlights',
        status: 'Resolved',
        locationName: 'Oak Wood Avenue, Pole #42',
        location: 'Oak Wood Avenue, Pole #42',
        latitude: 17.4412,
        longitude: 78.4915,
        name: 'Sarah Jenkins',
        user: 'Sarah Jenkins',
        email: 'sarah.j@gmail.com',
        userEmail: 'sarah.j@gmail.com',
        contact: '+91 98123 45678',
        description: 'The street light in front of house 42 has been flickering and is now completely out, making the corner dangerous at night.',
        department: 'Electrical Department',
        assignedDepartment: 'Electrical Department',
        priority: 'Medium',
        resolutionNotes: 'Replaced LED bulb assembly and checked underground cabling. Lamp restored.',
        photoUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1200',
        photoPublicId: 'report-1792071173419-33e78100399624c2.jpg',
        img: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1200',
        emailNotification: {
          sent: true,
          messageId: 'seed-notif-2',
          attemptedAt: new Date(Date.now() - 3600000 * 24 * 5)
        },
        createdAt: new Date(Date.now() - 3600000 * 24 * 5),
        updatedAt: new Date(Date.now() - 3600000 * 12)
      },
      {
        _id: 'rep-seed-3',
        id: 'rep-seed-3',
        complaintId: 'ECO-10003',
        title: 'Dangerous Pothole on 5th Cross Road',
        category: 'Potholes',
        status: 'In Progress',
        locationName: '5th Cross Road, Near Central Library',
        location: '5th Cross Road, Near Central Library',
        latitude: 17.435,
        longitude: 78.489,
        name: 'Marcus Vance',
        user: 'Marcus Vance',
        email: 'marcus.v@ecocity.org',
        userEmail: 'marcus.v@ecocity.org',
        description: 'Deep road depression causing two-wheelers to swerve dangerously during peak evening hours.',
        department: 'Public Works Department',
        assignedDepartment: 'Public Works Department',
        priority: 'High',
        photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=1200',
        photoPublicId: 'report-1792071909470-602d96b2ea54128d.jpg',
        img: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=1200',
        emailNotification: {
          sent: true,
          messageId: 'seed-notif-3',
          attemptedAt: new Date(Date.now() - 3600000 * 24 * 1)
        },
        createdAt: new Date(Date.now() - 3600000 * 24 * 1),
        updatedAt: new Date(Date.now() - 3600000 * 4)
      },
      {
        _id: 'rep-seed-4',
        id: 'rep-seed-4',
        complaintId: 'ECO-10004',
        title: 'Water Leakage from Main Supply Pipe',
        category: 'Water Leakage',
        status: 'Pending',
        locationName: 'Riverside Boulevard, Near Block 3',
        location: 'Riverside Boulevard, Near Block 3',
        latitude: 17.448,
        longitude: 78.502,
        name: 'Priya Sharma',
        user: 'Priya Sharma',
        email: 'priya.sharma@gmail.com',
        userEmail: 'priya.sharma@gmail.com',
        description: 'Continuous clean water escaping from joint in distribution main, flooding adjacent walking path.',
        department: 'Water Department',
        assignedDepartment: 'Water Department',
        priority: 'Medium',
        photoUrl: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=1200',
        photoPublicId: 'report-1792075974281-1f975a02bfb931c5.jpg',
        img: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&q=80&w=1200',
        emailNotification: {
          sent: true,
          messageId: 'seed-notif-4',
          attemptedAt: new Date(Date.now() - 3600000 * 10)
        },
        createdAt: new Date(Date.now() - 3600000 * 10),
        updatedAt: new Date(Date.now() - 3600000 * 10)
      }
    ];

    this.reports = defaultReports;
  }

  // ==========================================
  // Administrator In-Memory Management
  // ==========================================
  public getAdminConfig(): { email: string; password: string; name: string } {
    return {
      email: (process.env.ADMIN_EMAIL || 'likithamindi024@gmail.com').trim().toLowerCase(),
      password: (process.env.ADMIN_PASSWORD || 'likitha123').trim(),
      name: (process.env.ADMIN_NAME || 'EcoCity Administrator').trim()
    };
  }

  public validateAdminCredentials(emailInput: string, passwordInput: string): MockAdmin | null {
    if (!emailInput || !passwordInput) return null;
    const config = this.getAdminConfig();

    const normalizedInput = emailInput.trim().toLowerCase();
    if (normalizedInput === config.email && passwordInput.trim() === config.password) {
      return {
        id: 'admin-master-1',
        _id: 'admin-master-1',
        name: config.name,
        email: config.email,
        role: 'admin',
        createdAt: new Date('2026-01-01T00:00:00.000Z')
      };
    }

    return null;
  }

  public getAdminById(id: string): MockAdmin | null {
    const config = this.getAdminConfig();
    return {
      id: id || 'admin-master-1',
      _id: id || 'admin-master-1',
      name: config.name,
      email: config.email,
      role: 'admin',
      createdAt: new Date('2026-01-01T00:00:00.000Z')
    };
  }

  // ==========================================
  // Reports In-Memory Management
  // ==========================================

  public createReport(data: {
    complaintId?: string;
    name: string;
    email: string;
    locationName: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    title?: string;
    category?: string;
    department?: string;
    contact?: string;
    photoUrl: string;
    photoPublicId?: string;
    status?: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
    priority?: 'Low' | 'Medium' | 'High' | 'Critical';
    assignedDepartment?: string;
  }): IReportData {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const complaintId = data.complaintId || `ECO-${timestamp}-${randomNum}`;
    const id = `report-${Date.now()}-${randomNum}`;

    const now = new Date();
    const report: IReportData = {
      _id: id,
      id,
      complaintId,
      name: data.name,
      user: data.name,
      email: data.email.toLowerCase(),
      userEmail: data.email.toLowerCase(),
      locationName: data.locationName,
      location: data.locationName,
      latitude: data.latitude,
      longitude: data.longitude,
      description: data.description || '',
      title: data.title || `Issue at ${data.locationName}`,
      category: data.category || 'Garbage',
      department: data.department || 'Sanitation Department',
      assignedDepartment: data.assignedDepartment || data.department || 'Sanitation Department',
      contact: data.contact,
      photoUrl: data.photoUrl,
      photoPublicId: data.photoPublicId,
      img: data.photoUrl,
      status: data.status || 'Pending',
      priority: data.priority || 'Medium',
      emailNotification: {
        sent: false,
        attemptedAt: now
      },
      createdAt: now,
      updatedAt: now
    };

    // Store in beginning of array for latest-first access
    this.reports.unshift(report);
    return report;
  }

  public getAllReports(filter: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }): {
    reports: IReportData[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  } {
    let result = [...this.reports];

    if (filter.status && filter.status !== 'All') {
      result = result.filter(r => r.status.toLowerCase() === filter.status!.toLowerCase());
    }

    if (filter.category && filter.category !== 'All') {
      result = result.filter(r => r.category.toLowerCase() === filter.category!.toLowerCase());
    }

    if (filter.search && filter.search.trim() !== '') {
      const q = filter.search.trim().toLowerCase();
      result = result.filter(r =>
        r.complaintId.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.locationName.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
      );
    }

    // Sort
    if (filter.sort === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    const total = result.length;
    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;
    const pagedReports = result.slice(skip, skip + limit);

    return {
      reports: pagedReports,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    };
  }

  public getPublicRecentReports(limit = 10): any[] {
    const sorted = [...this.reports].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    const sliced = sorted.slice(0, limit);

    // Sanitize citizen private details (email, contact)
    return sliced.map(r => {
      const { email, contact, userEmail, ...sanitized } = r;
      return sanitized;
    });
  }

  public getReportById(id: string): IReportData | null {
    if (!id) return null;
    const cleanId = String(id).trim().toLowerCase();
    const found = this.reports.find(
      r =>
        r._id.toLowerCase() === cleanId ||
        r.id.toLowerCase() === cleanId ||
        r.complaintId.toLowerCase() === cleanId
    );
    return found || null;
  }

  public updateReportStatus(
    id: string,
    updates: {
      status?: 'Pending' | 'In Progress' | 'Resolved' | 'Rejected';
      notes?: string;
      assignedDepartment?: string;
      priority?: 'Low' | 'Medium' | 'High' | 'Critical';
      resolutionImage?: string;
    }
  ): IReportData | null {
    const report = this.getReportById(id);
    if (!report) return null;

    if (updates.status) report.status = updates.status;
    if (updates.notes !== undefined) report.resolutionNotes = updates.notes;
    if (updates.assignedDepartment !== undefined) {
      report.assignedDepartment = updates.assignedDepartment;
      report.department = updates.assignedDepartment;
    }
    if (updates.priority) report.priority = updates.priority;
    if (updates.resolutionImage) report.resolutionImage = updates.resolutionImage;
    report.updatedAt = new Date();

    return report;
  }

  public updateEmailNotification(
    id: string,
    emailNotification: IEmailNotification
  ): void {
    const report = this.getReportById(id);
    if (report) {
      report.emailNotification = emailNotification;
    }
  }

  public getStats(): {
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
  } {
    return {
      total: this.reports.length,
      pending: this.reports.filter(r => r.status === 'Pending').length,
      inProgress: this.reports.filter(r => r.status === 'In Progress').length,
      resolved: this.reports.filter(r => r.status === 'Resolved').length,
      rejected: this.reports.filter(r => r.status === 'Rejected').length
    };
  }
}

// Centralized Singleton Instance
export const mockDataService = new MockDataService();
export default mockDataService;
