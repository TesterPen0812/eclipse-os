import { ENV_PANEL_INNER } from "../fixtures/desktopShellMarkup";

/**
 * G8 EnvironmentPanel - owns the `<aside class="env-panel" id="envPanel">` subtree.
 *
 * Root attributes (`id="envPanel"`, `aria-hidden="true"`) and the inner `.env-scroll`
 * are preserved so the G9 environment-panel open/close behavior keeps binding.
 */
export function EnvironmentPanel() {
  return (
    <aside
      className="env-panel"
      id="envPanel"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: ENV_PANEL_INNER }}
    />
  );
}
