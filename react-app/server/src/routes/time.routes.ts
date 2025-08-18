import { Router } from "express";
import { pool } from "../db";
import { AuthedRequest } from "../middleware/authMiddleware";
import { RowDataPacket } from "mysql2";
const router = Router();

router.post("/start", async (req: AuthedRequest, res) => {
  const userId = req.user!.id;

  const [open] = await pool.query(
    "SELECT id FROM time_entries WHERE user_id = ? AND end_at IS NULL",
    [userId]
  );
  if ((open as any[]).length > 0) return res.status(400).json({ message: "Already running" });

  await pool.query("INSERT INTO time_entries (user_id, start_at) VALUES (?, NOW())", [userId]);
  return res.json({ message: "Started" });
});

router.post("/end", async (req: AuthedRequest, res) => {
  const userId = req.user!.id;

  const [open] = await pool.query(
    "SELECT id, start_at FROM time_entries WHERE user_id = ? AND end_at IS NULL ORDER BY id DESC LIMIT 1",
    [userId]
  );
  const current = (open as any[])[0];
  if (!current) return res.status(400).json({ message: "No running entry" });

  await pool.query("UPDATE time_entries SET end_at = NOW() WHERE id = ?", [current.id]);

  const [row] = await pool.query(
    "SELECT TIMESTAMPDIFF(SECOND, start_at, end_at) AS seconds FROM time_entries WHERE id = ?",
    [current.id]
  );
  const seconds = (row as any[])[0]?.seconds ?? null;

  return res.json({ message: "Stopped", seconds });
});

router.get("/today", async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const [totalRows] = await pool.query(
    `SELECT COALESCE(SUM(TIMESTAMPDIFF(SECOND, start_at, IFNULL(end_at, NOW()))), 0) AS total_seconds
     FROM time_entries
     WHERE user_id = ? AND DATE(start_at) = CURDATE()`,
    [userId]
  );
  const total_seconds = (totalRows as any[])[0].total_seconds;

  const [openRows] = await pool.query(
    "SELECT id FROM time_entries WHERE user_id = ? AND end_at IS NULL LIMIT 1",
    [userId]
  );
  const running = (openRows as any[])[0] ? true : false;

  return res.json({ total_seconds, running });
});
// إجمالي الوقت مجمّع حسب اليوم (آخر 60 يومًا افتراضياً)
router.get("/history", async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const limitDays = Math.min(parseInt((req.query.days as string) || "60", 10), 365);

  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      DATE(start_at) AS day,
      COALESCE(SUM(TIMESTAMPDIFF(SECOND, start_at, IFNULL(end_at, NOW()))), 0) AS total_seconds
    FROM time_entries
    WHERE user_id = ? AND start_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
    GROUP BY DATE(start_at)
    ORDER BY day DESC
    `,
    [userId, limitDays]
  );

  // نرجع شكل مناسب للواجهة
  const history = rows.map(r => ({
    day: r.day,                 // '2025-08-18'
    total_seconds: Number(r.total_seconds)
  }));

  return res.json({ history });
});

// (اختياري) إدخالات مفصلة (آخر 100 إدخال)
router.get("/entries", async (req: AuthedRequest, res) => {
  const userId = req.user!.id;
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT id, start_at, end_at
    FROM time_entries
    WHERE user_id = ?
    ORDER BY start_at DESC
    LIMIT 100
    `,
    [userId]
  );
  return res.json({ entries: rows });
});
export default router;
