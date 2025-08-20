import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "leaflet/dist/leaflet.css";

import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./theme";
import { LogoProvider } from "./context/LogoContext";

const queryClient = new QueryClient();

// Ensure we have a trimmed client id
const GOOGLE_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

// Debug logs
console.log("VITE_GOOGLE_CLIENT_ID =", GOOGLE_ID || "(missing)");

if (!GOOGLE_ID) {
  console.error(
    "Google Client ID is missing! Add VITE_GOOGLE_CLIENT_ID to .env.local and restart: npm run dev"
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_ID}>
        <ThemeProvider>
          <LogoProvider>
            <App />
            <Toaster position="top-center" />
          </LogoProvider>
        </ThemeProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);

console.log("React app started successfully");
if (import.meta.env.DEV) {
  console.log("Development mode: Hot module replacement is enabled.");
} else {
  console.log("Production mode: Hot module replacement is disabled.");
}
