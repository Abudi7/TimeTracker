import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes";
import timeRoutes from "./routes/time.routes";
import projectsRoutes from "./routes/projects.routes";
import tagsRoutes from "./routes/tags.routes";
import adminRoutes from "./routes/admin.routes"; // ← جديد
import { authMiddleware } from "./middleware/authMiddleware";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  credentials: true,
}));

// خدمة الملفات الستاتيكية من public/ و uploads/
app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));
app.use(express.static(path.join(process.cwd(), "public")));

// Rate limiting
const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300 });
app.use(generalLimiter);

// Routes
app.use("/auth", authRoutes);
app.use("/time", authMiddleware, timeRoutes);
app.use("/projects", authMiddleware, projectsRoutes);
app.use("/tags", authMiddleware, tagsRoutes);
app.use("/admin", adminRoutes); // ← جديد

app.get("/health", (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
});
