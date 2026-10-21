
import mongoose, { Schema, Document } from 'mongoose';

export interface IEmailNotification {
  sent: boolean;
  messageId?: string;
  error?: string;
  attemptedAt?: Date;
}

export interface IReport extends Document {
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

const ReportSchema = new Schema<IReport>(
  {
    complaintId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true },
    locationName: { type: String, required: true },
    latitude: Number,
    longitude: Number,
    description: { type: String, default: '' },
    title: { type: String, required: true },
    category: { type: String, default: 'Garbage' },
    department: { type: String, required: true },
    contact: String,
    photoUrl: { type: String, required: true },
    photoPublicId: String,
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending'
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    assignedDepartment: String,
    resolutionNotes: String,
    resolutionImage: String,
    emailNotification: {
      sent: { type: Boolean, default: false },
      messageId: String,
      error: String,
      attemptedAt: Date
    },
    location: String,
    img: String,
    user: String,
    userEmail: String,
    date: String
  },
  { timestamps: true }
);

const Report =
  mongoose.models.Report ||
  mongoose.model<IReport>('Report', ReportSchema);

export default Report;
