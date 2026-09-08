import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Run axe-core accessibility checks in development only. Violations are
// printed to the browser console (see DevTools → Console, filter "axe").
if (import.meta.env.DEV) {
  void import("./dev/run-axe");
  void (async () => {
    const [{ default: React }, { default: ReactDOM }, { default: axe }] = await Promise.all([
      import("react"),
      import("react-dom"),
      import("@axe-core/react"),
    ]);
    axe(React, ReactDOM, 1000);
  })();
}

createRoot(document.getElementById("root")!).render(<App />);
