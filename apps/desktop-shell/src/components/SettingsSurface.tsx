import { useEffect } from "react";

import {
  SETTINGS_MARKUP,
  SETTINGS_SCRIPTS,
  SETTINGS_STYLES,
} from "../settings/settingsStatic.generated";
import { mountHarnessSettingsPanel } from "../state/harnessSettingsPanel";

/**
 * G12 settings surface.
 *
 * Mounts the settings static reference as a self-contained island, preserving
 * visual parity with components/eclipse-os/settings/eclipse-os-settings.html.
 * The markup, styles, and inline scripts are mechanically extracted into
 * `settings/settingsStatic.generated.ts` (see scripts/extract-settings.mjs).
 *
 * CSS isolation: the settings <style> block contains global, element-level rules
 * (`*`, `html, body`, `:root` custom properties). To avoid leaking those into the
 * main shell, the block is injected into <head> only while this surface is
 * mounted and removed on unmount. The main shell and settings are mutually
 * exclusive routes (App renders one or the other), so while settings is mounted
 * the injected rules legitimately win over the always-bundled main-shell baseline
 * CSS; on unmount the baseline is restored intact.
 *
 * Behavior: the original inline scripts (pane switching, search filter, toggles,
 * segmented controls, theme cards, accent swatches, the font-size sample, the
 * interface-prefs persistence shared with the home screen, and the live ASCII
 * moon preview) are executed verbatim in source order after the markup is in the
 * DOM. They bind against the same ids/classes and the same localStorage keys
 * (`sb-theme`, `sb-density`, `sb-msgsize`, `sb-usage`, `sb-reduce`,
 * `sb-settings-pane`, `sb-moon`) the static source used, so no app rewiring is
 * needed and the main shell's root chrome stays in sync.
 *
 * The "Back to app" link and the sidebar "Settings" link are plain same-origin
 * navigations within the Vite app (the extractor rewrote "Back to app" to `/`),
 * so opening/returning is a full in-app page load and never reaches the old
 * static file or mutates main shell behavior.
 */
const STYLE_ELEMENT_ID = "eclipse-os-settings-styles";

export function SettingsSurface() {
  useEffect(() => {
    // Inject settings CSS only while mounted (scoped lifetime, not a global import).
    let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null;
    let injected = false;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ELEMENT_ID;
      styleEl.textContent = SETTINGS_STYLES;
      document.head.appendChild(styleEl);
      injected = true;
    }

    // Run the extracted static scripts verbatim, in source order, now that the
    // markup nodes exist. Each runs in its own function scope (like a separate
    // <script>), with window/document/localStorage available as globals. Script
    // order matters: the shared moon albedo (window.__MOON_ALBEDO_EQ) is defined
    // before the moon preview engine consumes it.
    for (const code of SETTINGS_SCRIPTS) {
      try {
        // eslint-disable-next-line no-new-func
        new Function(code)();
      } catch (err) {
        console.error("[settings] inline script failed:", err);
      }
    }
    mountHarnessSettingsPanel();

    return () => {
      if (injected && styleEl && styleEl.parentNode) {
        styleEl.parentNode.removeChild(styleEl);
      }
    };
  }, []);

  return (
    <div
      className="eclipse-os-settings-root"
      dangerouslySetInnerHTML={{ __html: SETTINGS_MARKUP }}
    />
  );
}
