import { COMPOSER_INNER } from "../fixtures/desktopShellMarkup";

/**
 * G8 Composer - owns the `<div class="composer">` subtree.
 *
 * The inner composer card, input box, control SVGs, and model/pill rows are kept as
 * byte-identical HTML so icon paths and the `#composerCard`, `#inputBox`,
 * `#inputField`, and `#sendBtn` ids stay intact for G9 behavior binding.
 */
export function Composer() {
  return (
    <div className="composer" dangerouslySetInnerHTML={{ __html: COMPOSER_INNER }} />
  );
}
