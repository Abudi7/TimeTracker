import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type LogoContextType = {
  logo: string | null;
  setLogo: (logo: string | null) => void;
};

const LogoContext = createContext<LogoContextType | undefined>(undefined);

export function LogoProvider({ children }: { children: ReactNode }) {
  const [logo, setLogo] = useState<string | null>(null);

  // عند تحميل الصفحة نقرأ من LocalStorage
  useEffect(() => {
    const stored = localStorage.getItem("app_logo");
    if (stored) setLogo(stored);
  }, []);

  // أي تغيير نحفظه في LocalStorage
  useEffect(() => {
    if (logo) {
      localStorage.setItem("app_logo", logo);
    } else {
      localStorage.removeItem("app_logo");
    }
  }, [logo]);

  return (
    <LogoContext.Provider value={{ logo, setLogo }}>
      {children}
    </LogoContext.Provider>
  );
}

export function useLogo() {
  const ctx = useContext(LogoContext);
  if (!ctx) throw new Error("useLogo must be used within LogoProvider");
  return ctx;
}
