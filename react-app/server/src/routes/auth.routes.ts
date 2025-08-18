import { Router } from "express";
import { pool } from "../db";
import { hashPassword, verifyPassword, signToken } from "../auth";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, password, fullName } = req.body;
  if (!email || !password || !fullName) return res.status(400).json({ message: "Missing fields" });

  const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
  if ((rows as any[]).length > 0) return res.status(409).json({ message: "Email exists" });

  const password_hash = await hashPassword(password);
  await pool.query(
    "INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)",
    [email, password_hash, fullName]
  );

  return res.json({ message: "Registered" });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query("SELECT id, password_hash FROM users WHERE email = ?", [email]);
  const user = (rows as any[])[0];
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: user.id, email });
  return res.json({ token });
});

export default router;
