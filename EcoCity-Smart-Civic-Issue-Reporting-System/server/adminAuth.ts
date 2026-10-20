
import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;
const JWT_SECRET = process.env.JWT_SECRET;

console.log("Admin auth config:", {
  emailLoaded: Boolean(ADMIN_EMAIL),
  passwordHashLoaded: Boolean(ADMIN_PASSWORD_HASH),
  jwtSecretLoaded: Boolean(JWT_SECRET),
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH || !JWT_SECRET) {
      return res.status(500).json({
        message: "Admin authentication is not configured",
      });
    }

    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string"
        ? req.body.password
        : "";

    const emailMatches = email === ADMIN_EMAIL;
    const passwordMatches = await bcrypt.compare(
      password,
      ADMIN_PASSWORD_HASH
    );

    if (!emailMatches || !passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      { role: "admin", email: ADMIN_EMAIL },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      message: "Login successful",
      token,
      admin: { email: ADMIN_EMAIL },
    });
  } catch (error) {
    console.error("Admin login failed:", error);
    return res.status(500).json({
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

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({ message: "Admin login required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      typeof decoded === "string" ||
      decoded.role !== "admin" ||
      decoded.email !==
        process.env.ADMIN_EMAIL?.trim().toLowerCase()
    ) {
      return res.status(403).json({ message: "Admin access denied" });
    }

    next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired login token",
    });
  }
}

export default router;
