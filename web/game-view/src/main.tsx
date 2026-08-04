import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

async function bootstrap() {
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (res.ok) {
      const config = (await res.json()) as { apiBase?: string };
      if (config.apiBase && typeof config.apiBase === "string") {
        window.apiBase = config.apiBase.replace(/\/$/, "");
      }
    }
  } catch {
    // Keep fallback API base when config is unavailable.
  }

  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Missing root element");
  }

  createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
