import { createRoot } from "react-dom/client";

// Font wiring is imported before the baseline stylesheet so the @font-face
// declarations resolve in the same order the frozen static authority used
// (Geist Pixel Line first, then IBM Plex Mono / Fragment Mono via @fontsource).
import "./styles/fonts.css";
import "./styles/desktop-static-baseline.css";

import { App } from "./App";
import { initRootChrome } from "./baseline/desktopStaticBehavior";

// The frozen baseline applies theme + interface preferences to <html> in <head>
// before the body renders, to avoid a flash. Run the equivalent before mount.
initRootChrome();

// No StrictMode: the ported baseline behavior binds listeners and starts a single
// moon animation loop imperatively, exactly like the static source. StrictMode's
// double-invoke would double-bind and is intentionally omitted for parity.
const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
