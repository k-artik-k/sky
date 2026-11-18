import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./sky.css";

function mount() {
  let rootEl = document.getElementById("root");
  if (!rootEl) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", mount, { once: true });
      return;
    }
    rootEl = document.createElement("div");
    rootEl.id = "root";
    document.body.appendChild(rootEl);
  }

  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

mount();
