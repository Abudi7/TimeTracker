import { useEffect, useMemo, useState } from "react";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import { api } from "../api";

type HeaderProps = {
  lang: Lang;
  onChangeLang: (v: Lang) => void;
  loggedIn: boolean;
  onLogout: () => void;
  logoUrl?: string; // ✅ اختياري
};

function toAbsolute(u?: string | null) {
  if (!u) return "";
  if (/^https?:\/\//i.test(u)) return u;
  const base = ((api as any)?.defaults?.baseURL as string) || "http://localhost:4000";
  return `${base}${u.startsWith("/") ? u : `/${u}`}`;
}

export default function Header({ lang, onChangeLang, loggedIn, onLogout, logoUrl }: HeaderProps) {
  const [storedLogo, setStoredLogo] = useState<string | null>(null);

  // التقط أي تغيير من صفحة الرفع
  useEffect(() => {
    const load = () => setStoredLogo(localStorage.getItem("app_logo"));
    load();
    window.addEventListener("app_logo_changed", load);
    return () => window.removeEventListener("app_logo_changed", load);
  }, []);

  const finalLogo = useMemo(() => {
    if (storedLogo && storedLogo.trim()) return toAbsolute(storedLogo);
    if (logoUrl && logoUrl.trim())     return toAbsolute(logoUrl);
    // 👇 افتراضي أكيد موجود لمنع 404
    return toAbsolute("/public/logo.png");
  }, [storedLogo, logoUrl]);

  const [imgSrc, setImgSrc] = useState(finalLogo);
  useEffect(() => setImgSrc(finalLogo), [finalLogo]);

  const handleError = () => {
    const fallback = toAbsolute("/uploads/logo-default.png");
    if (imgSrc !== fallback) setImgSrc(fallback);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div className="container">
        <a className="navbar-brand fw-bold d-flex align-items-center gap-2" href="#">
          <img
            src={imgSrc}
            alt="Logo"
            height={32}
            style={{ objectFit: "contain", borderRadius: 6 }}
            onError={handleError}
          />
       <span>{t(lang, "appTitle")}</span>
        </a>

        <div className="ms-auto d-flex align-items-center gap-2">
          <select
            className="form-select form-select-sm"
            value={lang}
            onChange={(e) => onChangeLang(e.target.value as Lang)}
            style={{ width: 140 }}
            aria-label="Language"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="de">Deutsch</option>
          </select>

          {loggedIn && (
            <button className="btn btn-outline-light btn-sm" onClick={onLogout}>
              {t(lang, "logout")}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
