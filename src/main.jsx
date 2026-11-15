import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import AntiDebugger from "./components/common/AntiDebugger";
import { ENABLE_ANTI_DEBUGGER } from "./security.config";
import { healthApi } from "./services/healthApi";

try {
  sessionStorage.removeItem("peoplehub.accessToken");
} catch {
  // Some browsers disable Web Storage.
}

try {
  localStorage.removeItem("ph-subjects");
  localStorage.removeItem("ph-courses");
} catch {
  // Some browsers disable Web Storage.
}

createRoot(document.getElementById("root")).render(
  <>
    <App />
    {ENABLE_ANTI_DEBUGGER && <AntiDebugger />}
  </>,
);

healthApi
  .check()
  .then((data) => console.log("Backend Connected:", data))
  .catch((error) => console.error("Backend Error:", error));
