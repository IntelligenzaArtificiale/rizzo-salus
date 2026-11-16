import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/styles/fonts";
import "@/styles/globals.css";
import App from "@/App";
import { syncTheme } from "@/lib/theme";

syncTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
