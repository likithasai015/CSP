export interface IEmailNotification {
  sent: boolean;
  messageId?: string;
  error?: string;
  attemptedAt?: Date;
}

export interface IReport {
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
  location?: string;
  img?: string;
  user?: string;
  userEmail?: string;
  date?: string;
}

export default IReport;
