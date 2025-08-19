import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { pool } from "../db";
import { authMiddleware, AuthedRequest } from "../middleware/authMiddleware";

const router = Router();

// مجلد الرفع
const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = (path.extname(file.originalname) || ".png").toLowerCase();
    cb(null, `logo-${Date.now()}${ext}`);
  },
});

const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
  fileFilter: (_req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type"));
  },
});

// helper: base url
const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || "http://localhost:4000";

// helper: احذف ملف بأمان
function safeUnlink(p: string) {
  try {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  } catch (e) {
    console.warn("safeUnlink warn:", e);
  }
}

// GET /admin/logo → يرجّع رابط اللوجو الحالي (مطلق)
router.get("/logo", async (_req, res) => {
  try {
    const [rows]: any = await pool.query(
      "SELECT logo_path FROM app_settings WHERE id = 1"
    );
    const filename: string | null = rows?.[0]?.logo_path || null; // نخزّن اسم الملف فقط
    const logoUrl = filename
      ? `${PUBLIC_BASE}/uploads/${filename}`
      : `${PUBLIC_BASE}/logo.png`; // fallback مطلق
    res.json({ logoUrl });
  } catch (err) {
    console.error("GET /admin/logo error:", err);
    res.status(500).json({ message: "Failed to load logo" });
  }
});
// GET /admin/logo
router.get("/logo", async (_req, res) => {
    try {
      const [rows]: any = await pool.query(
        "SELECT logo_path FROM app_settings WHERE id = 1"
      );
      // 👈 لو كانت القيمة مسار كامل أو اسم ملف — خذ basename دايمًا
      const raw = rows?.[0]?.logo_path as string | null;
      const filename = raw ? path.basename(raw) : null;
  
      const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || "http://localhost:4000";
      const logoUrl = filename
        ? `${PUBLIC_BASE}/uploads/${filename}`
        : `${PUBLIC_BASE}/logo.png`;
  
      res.json({ logoUrl });
    } catch (e) {
      res.status(500).json({ message: "Failed to load logo" });
    }
  });
  
  // POST /admin/logo
  router.post(
    "/logo",
    authMiddleware,
    upload.single("file"),
    async (req: AuthedRequest, res) => {
      try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  
        const newFilename = req.file.filename; // ✅ خزّن اسم الملف فقط
  
        // أنشئ/ثبّت صف الإعدادات
        await pool.query(
          "INSERT INTO app_settings (id, logo_path) VALUES (1, NULL) ON DUPLICATE KEY UPDATE id=1"
        );
  
        // احذف القديم إن وجد
        const [rows]: any = await pool.query(
          "SELECT logo_path FROM app_settings WHERE id=1"
        );
        const oldRaw = rows?.[0]?.logo_path as string | null;
        const oldFilename = oldRaw ? path.basename(oldRaw) : null;
        if (oldFilename && oldFilename !== newFilename) {
          const oldPath = path.join(process.cwd(), "public", "uploads", oldFilename);
          try { fs.existsSync(oldPath) && fs.unlinkSync(oldPath); } catch {}
        }
  
        // حدّث DB بالاسم الجديد فقط
        await pool.query("UPDATE app_settings SET logo_path=? WHERE id=1", [newFilename]);
  
        const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || "http://localhost:4000";
        const logoUrl = `${PUBLIC_BASE}/uploads/${newFilename}`;
        res.json({ ok: true, logoUrl });
      } catch (e) {
        res.status(500).json({ message: "Upload failed" });
      }
    }
  );

export default router;
