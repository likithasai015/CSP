import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Admin from "./models/Admin.js";

const router = Router();

const getJwtSecret = (): string => {
  return process.env.JWT_SECRET || "ecocity-default-jwt-secret-key-change-in-production";
};

router.post("/login", async (req: Request, res: Response) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password.trim()
        : "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Both email and password are required",
      });
    }

    // Look up administrator in MongoDB
    let admin = await Admin.findOne({ email }).exec();
    let isValid = false;

    if (admin) {
      isValid = await admin.comparePassword(password);
    } else {
      // Fallback for initial account provisioning if not yet seeded
      const envEmail = (
        process.env.ADMIN_EMAIL || "likithamindi024@gmail.com"
      )
        .trim()
        .toLowerCase();

      const envPassword = (process.env.ADMIN_PASSWORD || "likitha123").trim();

      if (email === envEmail && password === envPassword) {
        const hashedPassword = await bcrypt.hash(password, 10);
        admin = await Admin.create({
          name: process.env.ADMIN_NAME || "EcoCity Administrator",
          email: envEmail,
          password: hashedPassword,
          role: "admin",
        });
        isValid = true;
      }
    }

    if (!admin || !isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid administrator email or password",
      });
    }

    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        id: String(admin._id || admin.id),
        role: "admin",
        email: admin.email,
      },
      secret,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful",
      token,
      admin: {
        id: String(admin._id || admin.id),
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error("Admin login failed:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to log in",
    });
  }
});

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    return res.status(401).json({ success: false, message: "Admin login required" });
  }

  try {
    const secret = getJwtSecret();
    const decoded: any = jwt.verify(token, secret);

    if (
      !decoded ||
      typeof decoded === "string" ||
      decoded.role !== "admin"
    ) {
      return res.status(403).json({ success: false, message: "Admin access denied" });
    }

    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired login token",
    });
  }
}

export default router;
