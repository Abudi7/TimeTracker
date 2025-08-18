import { useEffect, useMemo, useState } from "react";
import { api, setAuthToken } from "../api";
import { motion, AnimatePresence } from "framer-motion";

// ====== Helpers: validation & animations ======
const emailRegex =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function validateEmail(v: string) {
  if (!v) return "Email is required";
  if (!emailRegex.test(v)) return "Please enter a valid email address";
  return null;
}

function validateFullName(v: string) {
  if (!v) return "Full name is required";
  if (v.trim().length < 3) return "Full name must be at least 3 characters";
  return null;
}

function validatePassword(v: string) {
  if (!v) return "Password is required";
  if (v.length < 6) return "Password must be at least 6 characters";
  return null;
}

const shake = {
  initial: { x: 0 },
  animate: { x: 0 },
  transition: { type: "spring" as const, stiffness: 300, damping: 15 },
};

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25 },
};

// ====== Component ======
export default function LoginRegister({ onLoggedIn }: { onLoggedIn: () => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");

  // fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // UI state
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // messages
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  // touched flags for inline validation
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean; fullName?: boolean }>({});

  // field-level errors
  const emailError = useMemo(() => validateEmail(email), [email]);
  const passError = useMemo(() => validatePassword(password), [password]);
  const nameError = useMemo(() => (tab === "register" ? validateFullName(fullName) : null), [fullName, tab]);

  const resetAlerts = () => {
    setErr(null);
    setOk(null);
  };

  useEffect(() => {
    // تغيير التبويب يمسح التنبيهات
    resetAlerts();
    setTouched({});
  }, [tab]);

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();

    // validate before send
    if (emailError || passError) {
      setErr(emailError || passError);
      // small shake
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/login", { email, password });
      setAuthToken(res.data.token);
      setOk("Login successful ✅");
      setTimeout(() => onLoggedIn(), 450);
    } catch (error: any) {
      setErr(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function doRegister(e: React.FormEvent) {
    e.preventDefault();
    resetAlerts();

    if (nameError || emailError || passError) {
      setErr(nameError || emailError || passError);
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/register", { email, password, fullName });
      setOk("Account created successfully ✅ — You can now log in");
      setTab("login");
      // keep email/password for quick login
    } catch (error: any) {
      setErr(error?.response?.data?.message || "Account creation failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6">
        <motion.div
          className="card shadow-lg border-0 rounded-4 overflow-hidden"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* Header Tabs */}
          <div className="card-header bg-primary text-white">
            <ul className="nav nav-tabs card-header-tabs">
              <li className="nav-item">
                <button
                  className={`nav-link ${tab === "login" ? "active text-dark bg-white" : "text-white"}`}
                  onClick={() => setTab("login")}
                >
                  Login
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${tab === "register" ? "active text-dark bg-white" : "text-white"}`}
                  onClick={() => setTab("register")}
                >
                  Register
                </button>
              </li>
            </ul>
          </div>

          {/* Alerts */}
          <div className="card-body p-4">
            <AnimatePresence initial={false}>
              {err && (
                <motion.div
                  key="err"
                  className="alert alert-danger rounded-3 mb-3"
                  {...fadeSlide}
                >
                  {err}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {ok && (
                <motion.div
                  key="ok"
                  className="alert alert-success rounded-3 mb-3"
                  {...fadeSlide}
                >
                  {ok}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forms */}
            <AnimatePresence mode="wait">
              {tab === "login" ? (
                <motion.form
                  key="login"
                  {...fadeSlide}
                  onSubmit={doLogin}
                  noValidate
                >
                  {/* Email */}
                  <motion.div
                    className="mb-3"
                    {...(touched.email && emailError ? { animate: { x: [0, -6, 6, -4, 4, 0] }, transition: { duration: 0.4 } } : shake)}
                  >
                    <label className="form-label">Email</label>
                    <input
                      className={`form-control ${touched.email && emailError ? "is-invalid" : touched.email ? "is-valid" : ""}`}
                      type="email"
                      value={email}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      aria-invalid={!!(touched.email && emailError)}
                    />
                    {touched.email && emailError && <div className="invalid-feedback">{emailError}</div>}
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    className="mb-3"
                    {...(touched.password && passError ? { animate: { x: [0, -6, 6, -4, 4, 0] }, transition: { duration: 0.4 } } : shake)}
                  >
                    <label className="form-label">Password</label>
                    <div className="input-group">
                      <input
                        className={`form-control ${touched.password && passError ? "is-invalid" : touched.password ? "is-valid" : ""}`}
                        type={showPass ? "text" : "password"}
                        value={password}
                        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="••••••"
                        aria-invalid={!!(touched.password && passError)}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPass((s) => !s)}
                        aria-label={showPass ? "Hide password" : "Show password"}
                      >
                        {showPass ? "Hide" : "Show"}
                      </button>
                    </div>
                    {touched.password && passError && <div className="invalid-feedback d-block">{passError}</div>}
                  </motion.div>

                  <motion.button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ y: -1 }}
                  >
                    {loading ? (
                      <span className="d-inline-flex align-items-center gap-2">
                        <span className="spinner-border spinner-border-sm" role="status" />
                        Logging in...
                      </span>
                    ) : (
                      "Login"
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="register"
                  {...fadeSlide}
                  onSubmit={doRegister}
                  noValidate
                >
                  {/* Full Name */}
                  <motion.div
                    className="mb-3"
                    {...(touched.fullName && nameError ? { animate: { x: [0, -6, 6, -4, 4, 0] }, transition: { duration: 0.4 } } : shake)}
                  >
                    <label className="form-label">Full Name</label>
                    <input
                      className={`form-control ${touched.fullName && nameError ? "is-invalid" : touched.fullName ? "is-valid" : ""}`}
                      value={fullName}
                      onBlur={() => setTouched((t) => ({ ...t, fullName: true }))}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="John Doe"
                      aria-invalid={!!(touched.fullName && nameError)}
                    />
                    {touched.fullName && nameError && <div className="invalid-feedback">{nameError}</div>}
                  </motion.div>

                  {/* Email */}
                  <motion.div
                    className="mb-3"
                    {...(touched.email && emailError ? { animate: { x: [0, -6, 6, -4, 4, 0] }, transition: { duration: 0.4 } } : shake)}
                  >
                    <label className="form-label">Email</label>
                    <input
                      className={`form-control ${touched.email && emailError ? "is-invalid" : touched.email ? "is-valid" : ""}`}
                      type="email"
                      value={email}
                      onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      aria-invalid={!!(touched.email && emailError)}
                    />
                    {touched.email && emailError && <div className="invalid-feedback">{emailError}</div>}
                  </motion.div>

                  {/* Password */}
                  <motion.div
                    className="mb-3"
                    {...(touched.password && passError ? { animate: { x: [0, -6, 6, -4, 4, 0] }, transition: { duration: 0.4 } } : shake)}
                  >
                    <label className="form-label">Password</label>
                    <div className="input-group">
                      <input
                        className={`form-control ${touched.password && passError ? "is-invalid" : touched.password ? "is-valid" : ""}`}
                        type={showPass ? "text" : "password"}
                        value={password}
                        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="At least 6 characters"
                        aria-invalid={!!(touched.password && passError)}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPass((s) => !s)}
                        aria-label={showPass ? "Hide password" : "Show password"}
                      >
                        {showPass ? "Hide" : "Show"}
                      </button>
                    </div>
                    {touched.password && passError && <div className="invalid-feedback d-block">{passError}</div>}
                  </motion.div>

                  <motion.button
                    type="submit"
                    className="btn btn-success w-100"
                    disabled={loading}
                    whileTap={{ scale: 0.98 }}
                    whileHover={{ y: -1 }}
                  >
                    {loading ? (
                      <span className="d-inline-flex align-items-center gap-2">
                        <span className="spinner-border spinner-border-sm" role="status" />
                        Creating account...
                      </span>
                    ) : (
                      "Register"
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
