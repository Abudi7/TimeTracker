import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import "leaflet/dist/leaflet.css";

import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "./theme";
import { LogoProvider } from "./context/LogoContext";  // ⬅️ جديد

const queryClient = new QueryClient();

// Debug
console.log("VITE_GOOGLE_CLIENT_ID =", import.meta.env.VITE_GOOGLE_CLIENT_ID);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID as string}>
        <ThemeProvider>
          <LogoProvider>   {/* ⬅️ التفاف التطبيق كله داخل مزود اللوجو */}
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
