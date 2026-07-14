// One-time G5 extraction helper.
//
// Slices the frozen desktop static authority into the monolithic parity scaffold
// files, preserving bytes exactly. This reads the read-only visual authority and
// only writes inside apps/desktop-shell. It is committed for provenance/repeatability
// but is not part of the app build.
//
// Source line ranges (1-based, inclusive) verified against
// components/eclipse-os/desktop-main/eclipse-os.html on 2026-06-17:
//   CSS bulk (inside <style>, minus the unpkg Geist @font-face): 18-1490
//   theme + interface-prefs IIFEs (head <script>):               1493-1521
//   markup (<div class="app"> .. </div>):                        1525-1762
//   composer / conversation / sidebar behavior (<script>):       1765-2073
//   moon albedo data + comments (<script>):                      2078-2081
//   ASCII moon field renderer (<script>):                        2084-2721
//
// The two `<script type="text/babel">` Tweaks-panel islands (2726-3712) are the
// dev-only edit-mode tool. Per docs/workflow/FONT_OFFLINE_STRATEGY.md they are
// intentionally NOT carried forward as a browser-Babel island in G5.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const srcHtml = resolve(
  repoRoot,
  "components/eclipse-os/desktop-main/eclipse-os.html",
);
const appSrc = resolve(here, "../src");

const lines = readFileSync(srcHtml, "utf8").split("\n");
// slice(a-1, b) -> 1-based inclusive [a, b]
const range = (a, b) => lines.slice(a - 1, b).join("\n");

function write(rel, contents) {
  const out = resolve(appSrc, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, contents);
  console.log("wrote", rel, `(${contents.length} bytes)`);
}

// ---------------------------------------------------------------------------
// 1) CSS — verbatim copy of the <style> block (excluding the unpkg Geist
//    @font-face on lines 12-17, which is replaced by local font wiring).
// ---------------------------------------------------------------------------
const cssHeader = `/* ============================================================================
   Eclipse OS desktop shell — desktop static baseline CSS (G5)

   Verbatim copy of the <style> block in the frozen visual authority
   components/eclipse-os/desktop-main/eclipse-os.html (source lines 18-1490),
   selectors / declaration order / values / radii / shadows / animations
   preserved. The only omission is the source's unpkg Geist @font-face; the
   equivalent local declaration lives in ./fonts.css per the approved font route.

   Do not refactor, rename, reorder, or tokenize here. CSS extraction/cleanup is
   a later goal (G7).
   ============================================================================ */
`;
write("styles/desktop-static-baseline.css", cssHeader + "\n" + range(18, 1490) + "\n");

// ---------------------------------------------------------------------------
// 2) Markup — exact HTML for the desktop shell, rendered via
//    dangerouslySetInnerHTML so class names, DOM nesting, attribute casing
//    (e.g. stroke-width) and inline SVG paths stay byte-identical. Component
//    extraction into real JSX is deferred to G8.
// ---------------------------------------------------------------------------
const markup = range(1525, 1762);
const markupFile = `/* eslint-disable */
// Eclipse OS desktop shell — monolithic static baseline markup (G5).
//
// This is the exact desktop markup from the frozen visual authority
// components/eclipse-os/desktop-main/eclipse-os.html (source lines 1525-1762),
// reproduced byte-for-byte and injected with dangerouslySetInnerHTML so the
// rendered DOM matches the baseline exactly: class names, nesting, attribute
// casing, and inline SVG paths are unchanged. Per the scaffold plan this stays
// monolithic in G5; Shell/Sidebar/Composer/EnvironmentPanel component extraction
// is G8, not now.

const DESKTOP_STATIC_MARKUP = ${JSON.stringify(markup)};

export function DesktopStaticMarkup() {
  return <div dangerouslySetInnerHTML={{ __html: DESKTOP_STATIC_MARKUP }} />;
}
`;
write("baseline/desktopStaticMarkup.tsx", markupFile);

// ---------------------------------------------------------------------------
// 3) Behavior — verbatim copy of the frozen baseline's vanilla scripts wrapped
//    in init functions. @ts-nocheck keeps the logic byte-identical (the source
//    is untyped `var`-style code); typed app state is deferred to G9.
// ---------------------------------------------------------------------------
const rootChrome = range(1493, 1521); // theme + interface-prefs IIFEs
const composer = range(1765, 2073); // composer / conversation / sidebar
const moonData = range(2078, 2081); // window.__MOON_ALBEDO comments + data
const moonRenderer = range(2084, 2721); // ASCII moon field renderer (IIFE)

const behaviorFile = `// @ts-nocheck
/* eslint-disable */
// Eclipse OS desktop shell — ported static baseline behavior (G5).
//
// Verbatim copy of the vanilla <script> blocks from the frozen visual authority
// components/eclipse-os/desktop-main/eclipse-os.html, wrapped in init functions
// so they run against the React-mounted baseline DOM (same element ids). Logic,
// timings, and motion are unchanged. @ts-nocheck preserves the original untyped
// source; conversion to typed app state is deferred to G9.
//
// The dev-only Tweaks-panel React/Babel islands from the source are intentionally
// NOT ported here (see docs/workflow/FONT_OFFLINE_STRATEGY.md).

// Moon albedo data — set on window at module load so the renderer can read it,
// exactly as the standalone <script> did in the source.
// --- source lines 2078-2081 ---
${moonData}

let __eclipseBehaviorStarted = false;

/**
 * Theme + interface preferences, applied to <html> before render to avoid a
 * flash. Mirrors the two head IIFEs in the static source (lines 1493-1521).
 */
export function initRootChrome() {
  // --- source lines 1493-1521 ---
${indent(rootChrome, "  ")}
}

/**
 * Composer / conversation / sidebar behavior and the ASCII moon field renderer.
 * Call once, after the baseline markup is mounted. Guarded so it binds a single
 * set of listeners and starts a single animation loop (parity with the source's
 * single script execution).
 */
export function initDesktopBehavior() {
  if (__eclipseBehaviorStarted) return;
  __eclipseBehaviorStarted = true;

  // --- composer / conversation / sidebar (source lines 1765-2073) ---
${indent(composer, "  ")}

  // --- ASCII moon field renderer (source lines 2084-2721) ---
${indent(moonRenderer, "  ")}
}
`;
write("baseline/desktopStaticBehavior.ts", behaviorFile);

function indent(block, pad) {
  return block
    .split("\n")
    .map((l) => (l.length ? pad + l : l))
    .join("\n");
}
