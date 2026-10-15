import mongoose, { Document, Schema } from 'mongoose';

export interface IEmailNotification {
  sent: boolean;
  messageId?: string;
  error?: string;
  attemptedAt?: Date;
}

export interface IReport extends Document {
  complaintId: string;
  name: string;
  email: string;
  locationName: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  title?: string;
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
}

const emailNotificationSchema = new Schema<IEmailNotification>(
  {
    sent: { type: Boolean, default: false },
    messageId: { type: String },
    error: { type: String },
    attemptedAt: { type: Date }
  },
  { _id: false }
);

const reportSchema = new Schema<IReport>(
  {
    complaintId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    name: {
      type: String,
      default: 'Citizen Reporter',
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Citizen email is required'],
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    locationName: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true,
      maxlength: [200, 'Location name cannot exceed 200 characters']
    },
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: ''
    },
    title: {
      type: String,
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    category: {
      type: String,
      default: 'Garbage',
      trim: true
    },
    department: {
      type: String,
      default: 'Sanitation Department',
      trim: true
    },
    contact: {
      type: String,
      trim: true
    },
    photoUrl: {
      type: String,
      required: [true, 'Garbage photo is required']
    },
    photoPublicId: {
      type: String
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
      index: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    assignedDepartment: {
      type: String
    },
    resolutionNotes: {
      type: String
    },
    resolutionImage: {
      type: String
    },
    emailNotification: {
      type: emailNotificationSchema,
      default: () => ({ sent: false })
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: any) => {
        // Expose frontend-compatible properties
        ret.id = ret._id;
        ret.location = ret.locationName;
        ret.img = ret.photoUrl;
        ret.user = ret.name;
        ret.userEmail = ret.email;
        ret.date = ret.createdAt ? new Date(ret.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }) : '';
        return ret;
      }
    },
    toObject: { virtuals: true }
  }
);

export const Report = mongoose.model<IReport>('Report', reportSchema);
export default Report;
