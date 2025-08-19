import { OAuth2Client } from "google-auth-library";
import { Router } from "express";
import { pool } from "../db";
import { hashPassword, verifyPassword, signToken } from "../auth";
import { z } from "zod";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { validate } from "../middleware/validate";

// ===== Register/Login Routes =====
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
// These routes handle user registration and login, including input validation and password hashing.
const registerSchema = z.object({
  body: z.object({
    email: z.string().email().max(190),
    password: z.string().min(6).max(100),
    fullName: z.string().min(3).max(190),
  }),
});
/* This schema validates the registration input, ensuring email format, password length, and full name constraints.
* The email must be unique, and the password is hashed before storing in the database.
* The full name is also stored for user identification.
* If registration is successful, a success message is returned.
* If the email already exists, a 409 conflict error is returned.
*/
const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});
/* This schema validates the login input, ensuring the email format and password presence.
* It checks the database for the user and verifies the password.
* If successful, a JWT token is generated and returned.
* If the credentials are invalid, a 401 unauthorized error is returned.
*/
const router = Router();
/* This route handles user registration.
* It validates the input using the registerSchema.
* If the input is valid, it checks if the email already exists in the database.
* If it does, a 409 conflict error is returned.
* If the email is unique, the password is hashed and stored in the database along with the user's full name.
* A success message is returned upon successful registration.
*/
router.post("/register", validate(registerSchema), async (req, res) => {
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

router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const [rows] = await pool.query("SELECT id, password_hash FROM users WHERE email = ?", [email]);
  const user = (rows as any[])[0];
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signToken({ id: user.id, email });
  return res.json({ token });
});
router.post("/google", async (req, res, next) => {
  try {
    const { idToken } = req.body as { idToken?: string };
    if (!idToken) return res.status(400).json({ message: "idToken is required" });

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) return res.status(401).json({ message: "Invalid Google token" });

    const email = payload.email;
    const fullName = payload.name || "";
    if (!email) return res.status(400).json({ message: "Google account has no email" });

    // ابحث عن المستخدم، أو أنشئه لو غير موجود
    const [rows]: any = await pool.query("SELECT id, email FROM users WHERE email = ?", [email]);
    let userId: number;

    if (rows.length === 0) {
      // ملاحظة: كلمة المرور ليست مطلوبة مع Google؛ احفظ hash فارغ/ثابت أو NULL حسب تصميم جدولك
      const emptyHash = await bcrypt.hash(Math.random().toString(36), 10);
      const [ins]: any = await pool.query(
        "INSERT INTO users (email, password_hash, full_name) VALUES (?, ?, ?)",
        [email, emptyHash, fullName]
      );
      userId = ins.insertId;
    } else {
      userId = rows[0].id;
    }

    const token = jwt.sign(
      { id: userId, email },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
});
export default router;
