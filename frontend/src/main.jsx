import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { BrowserRouter } from "react-router-dom";

import { CartProvider } from "./context/CartContext.jsx";
import { LocationProvider } from "./context/LocationContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { PantryProvider } from "./context/PantryContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <LocationProvider>
            <PantryProvider>
              <App />
            </PantryProvider>
          </LocationProvider>
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  </BrowserRouter>,
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/notification-sw.js").catch(() => {
      // Non-fatal: app notifications still work without SW registration.
    });
  });
}
