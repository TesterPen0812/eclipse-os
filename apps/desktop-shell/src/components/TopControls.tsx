import { TOP_CONTROLS_INNER } from "../fixtures/desktopShellMarkup";

/**
 * G8 TopControls - owns the main pane's `<div class="main-toolbar">` subtree.
 *
 * Interpretation: "TopControls" here is the main toolbar (chat title + window/panel
 * toggles), not the shell-level side-toggle/resizer, which stay in `Shell` next to
 * the sidebar where the baseline places them. The toolbar holds `#chatTitle`,
 * `#chatTitleText`, and `#envToggle`, all preserved for G9 behavior binding.
 */
export function TopControls() {
  return (
    <div className="main-toolbar" dangerouslySetInnerHTML={{ __html: TOP_CONTROLS_INNER }} />
  );
}
