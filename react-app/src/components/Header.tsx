import type { Lang } from "../i18n";
import { t } from "../i18n";
import { useEffect, useMemo, useState } from "react";

type HeaderProps = {
  lang: Lang;
  onChangeLang: (v: Lang) => void;
  loggedIn: boolean;
  onLogout: () => void;
  logoUrl?: string;
};

export default function Header({
  lang,
  onChangeLang,
  loggedIn,
  onLogout,
  logoUrl,
}: HeaderProps) {
  const [storedLogo, setStoredLogo] = useState<string | null>(null);

  // عند التحميل + لو تغيّر اللوجو من AdminLogo
  useEffect(() => {
    const loadLogo = () => {
      const v = localStorage.getItem("app_logo");
      setStoredLogo(v || null);
    };
    loadLogo();
    window.addEventListener("app_logo_changed", loadLogo);
    return () => window.removeEventListener("app_logo_changed", loadLogo);
  }, []);

  // حدد المصدر النهائي
  const finalLogo = useMemo(() => {
    if (storedLogo && storedLogo.trim()) return storedLogo; // من localStorage
    if (logoUrl && logoUrl.trim()) return logoUrl; // من props
    return "/uploads/logo-default.png"; // ← ضع لوجو افتراضي بداخل public/uploads
  }, [storedLogo, logoUrl]);

  const [imgSrc, setImgSrc] = useState<string>(finalLogo);
  useEffect(() => setImgSrc(finalLogo), [finalLogo]);

  const handleError = () => {
    if (imgSrc !== "/uploads/logo-default.png") {
      console.warn("Logo failed to load, fallback used");
      setImgSrc("/uploads/logo-default.png");
    }
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
          <span>⏱️ {t(lang, "appTitle")}</span>
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
