import { Composer } from "./Composer";
import { EnvironmentPanel } from "./EnvironmentPanel";
import { TopControls } from "./TopControls";
import { Transcript } from "./Transcript";
import {
  GREETING_INNER,
  STATUS_EYEBROW_INNER,
  SUGGESTIONS_INNER,
} from "../fixtures/desktopShellMarkup";

/**
 * G8 MainPane - owns the `<main class="main">` subtree and composes the extracted
 * regions in baseline order: toolbar (TopControls), environment panel, then the
 * `.center` column.
 *
 * Inside `.center`, the static header nodes (moon field, status eyebrow, hero
 * wordmark, greeting) and the runtime-driven `Transcript` / `Composer` / suggestions
 * are siblings with no wrapper in the baseline, so each is rendered as its own root
 * element here; no extra wrapping div is introduced. `#moonField`, `#greeting`,
 * `.hero-wordmark`, `.center`, and `#suggestions` are preserved for G9 behavior.
 */
export function MainPane() {
  return (
    <main className="main">
      <TopControls />
      <EnvironmentPanel />
      <div className="center">
        <pre id="moonField" aria-hidden="true"></pre>
        <div
          className="status-eyebrow"
          dangerouslySetInnerHTML={{ __html: STATUS_EYEBROW_INNER }}
        />
        <div className="hero-wordmark">ECLIPSE</div>
        <h1
          className="greeting"
          id="greeting"
          dangerouslySetInnerHTML={{ __html: GREETING_INNER }}
        />
        <Transcript />
        <Composer />
        <nav
          className="suggestions"
          id="suggestions"
          dangerouslySetInnerHTML={{ __html: SUGGESTIONS_INNER }}
        />
      </div>
    </main>
  );
}
