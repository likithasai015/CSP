import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdminDoc extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin';
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AdminSchema = new Schema<IAdminDoc>(
  {
    name: {
      type: String,
      default: 'EcoCity Administrator'
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    role: {
      type: String,
      default: 'admin',
      enum: ['admin']
    }
  },
  { timestamps: true }
);

AdminSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export const Admin: any =
  mongoose.models.Admin || mongoose.model<IAdminDoc>('Admin', AdminSchema);

/**
 * Ensures the administrator account is initialized in MongoDB Atlas
 * with a secure bcrypt-hashed password.
 */
export async function ensureDefaultAdmin(): Promise<void> {
  try {
    const adminEmail = (
      process.env.ADMIN_EMAIL || 'likithamindi024@gmail.com'
    )
      .trim()
      .toLowerCase();

    const adminPassword = (process.env.ADMIN_PASSWORD || 'likitha123').trim();
    const adminName = (process.env.ADMIN_NAME || 'EcoCity Administrator').trim();

    const existingAdmin = await Admin.findOne({ email: adminEmail }).exec();

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await Admin.create({
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      console.log(`[Admin Account] Initialized admin user in MongoDB: ${adminEmail}`);
    } else {
      const matches = await bcrypt
        .compare(adminPassword, existingAdmin.password)
        .catch(() => false);

      if (!matches) {
        existingAdmin.password = await bcrypt.hash(adminPassword, 10);
        await existingAdmin.save();
        console.log(`[Admin Account] Updated bcrypt hashed password for: ${adminEmail}`);
      }
    }
  } catch (error: any) {
    console.error(
      '[Admin Account Setup] Could not verify/initialize admin account in MongoDB:',
      error.message
    );
  }
}

export default Admin;
