import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Clean initialization without dev-mode interference
const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container not found");
}

const root = createRoot(container);
root.render(<App />);
