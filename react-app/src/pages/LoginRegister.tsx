import { useState } from "react";
import { api, setAuthToken } from "../api"; // Importing API helper and token setter
import { motion } from "framer-motion"; // Importing animation library

// Component for Login and Register functionality
export default function LoginRegister({ onLoggedIn }: { onLoggedIn: () => void }) {
  // State variables for managing the current tab, form inputs, and alerts
  const [tab, setTab] = useState<"login" | "register">("login"); // Current tab: "login" or "register"
  const [email, setEmail] = useState(""); // Email input
  const [password, setPassword] = useState(""); // Password input
  const [fullName, setFullName] = useState(""); // Full name input (for registration)
  const [err, setErr] = useState<string | null>(null); // Error message
  const [ok, setOk] = useState<string | null>(null); // Success message

  // Function to reset error and success alerts
  const resetAlerts = () => { 
    setErr(null); 
    setOk(null); 
  };

  // Function to handle login form submission
  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    resetAlerts(); // Clear alerts
    try {
      // Send login request to the API
      const res = await api.post("/auth/login", { email, password });
      setAuthToken(res.data.token); // Save the token for authentication
      setOk("Login successful ✅"); // Show success message
      setTimeout(() => onLoggedIn(), 400); // Trigger callback after a short delay
    } catch (error: any) {
      // Handle errors and display error message
      setErr(error?.response?.data?.message || "Login failed");
    }
  };

  // Function to handle registration form submission
  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    resetAlerts(); // Clear alerts
    try {
      // Send registration request to the API
      await api.post("/auth/register", { email, password, fullName });
      setOk("Account created successfully ✅ — You can now log in"); // Show success message
      setTab("login"); // Switch to login tab
    } catch (error: any) {
      // Handle errors and display error message
      setErr(error?.response?.data?.message || "Account creation failed");
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-12 col-md-8 col-lg-6">
        <div className="card shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Header with tabs for switching between Login and Register */}
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

          {/* Body containing forms and alerts */}
          <div className="card-body p-4">
            {/* Display error or success messages */}
            {err && <div className="alert alert-danger rounded-3">{err}</div>}
            {ok && <div className="alert alert-success rounded-3">{ok}</div>}

            {/* Login form */}
            {tab === "login" ? (
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={doLogin}
              >
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input 
                    className="form-control" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input 
                    className="form-control" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                </div>
                <button className="btn btn-primary w-100" type="submit">Login</button>
              </motion.form>
            ) : (
              // Registration form
              <motion.form
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onSubmit={doRegister}
              >
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input 
                    className="form-control" 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input 
                    className="form-control" 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input 
                    className="form-control" 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    required 
                  />
                </div>
                <button className="btn btn-success w-100" type="submit">Register</button>
              </motion.form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}