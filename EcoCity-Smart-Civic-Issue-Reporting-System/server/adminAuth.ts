import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import mockDataService from "./services/mockDataService.js";

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
        ? req.body.password
        : "";

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Both email and password are required",
      });
    }

    const admin = mockDataService.validateAdminCredentials(email, password);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid administrator email or password",
      });
    }

    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        id: admin.id,
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
        id: admin.id,
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
