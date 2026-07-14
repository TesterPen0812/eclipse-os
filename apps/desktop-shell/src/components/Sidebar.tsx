import { SIDEBAR_INNER } from "../fixtures/desktopShellMarkup";

/**
 * G8 Sidebar - owns the frozen `<aside class="sidebar">` subtree.
 *
 * The root element matches the baseline exactly; its children (nav items,
 * connection rows, inline SVG icons) are injected as byte-identical HTML so DOM,
 * class names, ids, and icon paths stay unchanged. Behavior (G9) still binds via
 * `.sidebar`, `.row`, `.nav-item`, `.conn-head`, and `#newChat`, all preserved here.
 */
export function Sidebar() {
  return (
    <aside className="sidebar" dangerouslySetInnerHTML={{ __html: SIDEBAR_INNER }} />
  );
}
