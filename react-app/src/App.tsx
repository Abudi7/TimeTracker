import { useEffect, useState } from "react";
import { setAuthToken } from "./api";
import LoginRegister from "./pages/LoginRegister";
import TimeTracker from "./components/TimeTracker";
import { motion } from "framer-motion";

export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(!!localStorage.getItem("token"));

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setAuthToken(token);
  }, []);

  const logout = () => {
    setAuthToken(null);
    setLoggedIn(false);
  };

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <a className="navbar-brand fw-bold" href="#">⏱️ TimeTracker</a>
          {loggedIn && (
            <button className="btn btn-outline-light" onClick={logout}>Logout</button>
          )}
        </div>
      </nav>

      <div className="container py-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {loggedIn ? (
            <TimeTracker />
          ) : (
            <LoginRegister onLoggedIn={() => setLoggedIn(true)} />
          )}
        </motion.div>
      </div>

      <footer className="py-4 bg-white border-top">
        <div className="container text-center text-muted small">
          Built with React + Bootstrap + Framer Motion
        </div>
      </footer>
    </div>
  );
}