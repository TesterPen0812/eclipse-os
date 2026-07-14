/**
 * G8 Transcript - owns the `<div class="transcript" id="transcript">` subtree.
 *
 * Both nodes are empty in the baseline (the after-send transcript is built at
 * runtime by behavior), so this is plain JSX with no inline SVG to preserve. The
 * `#transcript` / `#transcriptInner` ids are kept for G9 behavior binding.
 */
export function Transcript() {
  return (
    <div className="transcript" id="transcript">
      <div className="transcript-inner" id="transcriptInner"></div>
    </div>
  );
}
