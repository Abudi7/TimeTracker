// server/src/index.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit"; // 👈 استيراد وحيد هنا
import path from "path";

import authRoutes from "./routes/auth.routes";
import timeRoutes from "./routes/time.routes";
import projectsRoutes from "./routes/projects.routes";
import tagsRoutes from "./routes/tags.routes";
import adminRoutes from "./routes/admin.routes";
import { authMiddleware } from "./middleware/authMiddleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ===== Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // للسماح بتحميل الصور من /uploads
    crossOriginEmbedderPolicy: false,
  })
);

// ===== Static files (قبل الراوتس)
const publicDir = path.join(process.cwd(), "public");
app.use("/uploads", express.static(path.join(publicDir, "uploads")));
app.use(express.static(publicDir));

// ===== Rate limits
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
});
app.use(generalLimiter);

const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts. Try again later." },
});

// ===== Routes
app.use(
  "/auth",
  (req, res, next) => {
    if (req.path === "/login") return loginLimiter(req, res, next);
    next();
  },
  authRoutes
);

app.use("/time", authMiddleware, timeRoutes);
app.use("/projects", authMiddleware, projectsRoutes);
app.use("/tags", authMiddleware, tagsRoutes);
app.use("/admin", adminRoutes);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
});
