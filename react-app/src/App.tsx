// src/App.tsx
// App shell: fetch server logo, pass to Header, simple view switching

import { useEffect, useState, useMemo } from "react";
import { api, setAuthToken } from "./api";
import LoginRegister from "./pages/LoginRegister";
import TimeTracker from "./components/TimeTracker";
import Home from "./pages/Home";
import Reports from "./pages/Reports";
import Header from "./components/Header";
import AdminLogo from "./pages/AdminLogo";
import { motion } from "framer-motion";
import type { Lang } from "./i18n";

// ---- helper: make absolute URL if server returns a relative path ----
function toAbsoluteUrl(u?: string | null) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const base = ((api as any)?.defaults?.baseURL as string) || "http://localhost:4000";
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}
// ---- main App component ----
// This is the main entry point of the React app, handling routing and state management
export default function App() {
  const [loggedIn, setLoggedIn] = useState<boolean>(!!localStorage.getItem("token"));
  const [showTracker, setShowTracker] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [showAdminLogo, setShowAdminLogo] = useState(false);

  const [lang, setLang] = useState<Lang>((localStorage.getItem("lang") as Lang) || "en");

  // شعار التطبيق (يأتي من السيرفر أو من localStorage عند الرفع)
  const [serverLogo, setServerLogo] = useState<string | null>(null);
  const [localLogo, setLocalLogo] = useState<string | null>(localStorage.getItem("app_logo"));

  // اجلب التوكن (إن وُجد) عند أول تحميل
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) setAuthToken(token);
  }, []);

  // اجلب اللوجو من السيرفر
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/admin/logo"); // يجب أن يرجّع { logoUrl: "/uploads/..." أو "http://..." }
        const url = res?.data?.logoUrl as string | undefined;
        if (url) setServerLogo(toAbsoluteUrl(url));
      } catch (e) {
        console.warn("[App] failed to fetch server logo:", e);
      }
    })();
  }, []);

  // استمع لأي تغيير على app_logo (بعد الرفع من صفحة AdminLogo)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "app_logo") setLocalLogo(e.newValue);
    };
    const onCustom = () => setLocalLogo(localStorage.getItem("app_logo"));
    window.addEventListener("storage", onStorage);
    window.addEventListener("app_logo_changed", onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("app_logo_changed", onCustom);
    };
  }, []);

  // حدّد اللوجو النهائي: (محلي بعد الرفع) ← (سيرفر) ← (افتراضي)
  const finalLogo = useMemo(() => {
    if (localLogo && localLogo.trim()) return toAbsoluteUrl(localLogo);
    if (serverLogo && serverLogo.trim()) return serverLogo;
    return toAbsoluteUrl("/public/logo.png");
  }, [localLogo, serverLogo]);

  const logout = () => {
    setAuthToken(null);
    setLoggedIn(false);
    setShowTracker(false);
    setShowReports(false);
    setShowAdminLogo(false);
  };

  const onChangeLang = (v: Lang) => {
    setLang(v);
    localStorage.setItem("lang", v);
  };

  return (
    <div className="min-vh-100 bg-light d-flex flex-column">
      {/* Header */}
      <Header
        lang={lang}
        onChangeLang={onChangeLang}
        loggedIn={loggedIn}
        onLogout={logout}
        logoUrl={finalLogo} // 👈 نمرّر اللوجو النهائي
      />

      {/* Body */}
      <div className="container py-5 flex-fill">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          {!loggedIn ? (
            <LoginRegister onLoggedIn={() => setLoggedIn(true)} />
          ) : showAdminLogo ? (
            <AdminLogo />
          ) : showReports ? (
            <Reports lang={lang} onBack={() => setShowReports(false)} />
          ) : showTracker ? (
            <TimeTracker lang={lang} onBack={() => setShowTracker(false)} />
          ) : (
            <Home
              lang={lang}
              onGoTrack={() => setShowTracker(true)}
              onGoReports={() => setShowReports(true)}
              onGoAdminLogo={() => setShowAdminLogo(true)}
            />
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-4 bg-white border-top">
        <div className="container text-center text-muted small">
          Built with React + Bootstrap + Framer Motion
        </div>
      </footer>
    </div>
  );
}
