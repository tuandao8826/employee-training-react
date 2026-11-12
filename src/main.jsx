import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { healthApi } from "./services/healthApi";

try {
  sessionStorage.removeItem("peoplehub.accessToken");
} catch {
  // Some browsers disable Web Storage.
}

createRoot(document.getElementById("root")).render(<App />);

healthApi
  .check()
  .then((data) => console.log("Backend Connected:", data))
  .catch((error) => console.error("Backend Error:", error));
