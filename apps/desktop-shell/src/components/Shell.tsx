import { MainPane } from "./MainPane";
import { Sidebar } from "./Sidebar";
import { SIDE_TOGGLE_ICON } from "../fixtures/desktopShellMarkup";

/**
 * G8 Shell - top-level desktop shell structure.
 *
 * Renders the same hierarchy the monolithic baseline produced: the outer container
 * div (the dangerouslySetInnerHTML host the baseline already used), then
 * `<div class="app">` holding the shell-level controls (`#sidebarToggle`, `#resizer`),
 * the `Sidebar`, and the `MainPane`. No new wrapper is added relative to the frozen
 * render: `.app` and the existing outer div are preserved 1:1.
 *
 * The side-toggle keeps its inline SVG via byte-identical HTML; the resizer is empty
 * in the baseline so it is plain JSX. Both ids are preserved for G9 behavior binding.
 */
export function Shell() {
  return (
    <div>
      <div className="app">
        <button
          type="button"
          className="side-toggle"
          id="sidebarToggle"
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
          dangerouslySetInnerHTML={{ __html: SIDE_TOGGLE_ICON }}
        />
        <div
          className="resizer"
          id="resizer"
          title="Drag to resize · double-click to reset"
        ></div>
        <Sidebar />
        <MainPane />
      </div>
    </div>
  );
}
