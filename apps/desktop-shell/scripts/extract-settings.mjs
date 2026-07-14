// Eclipse OS desktop shell - G12 settings extractor.
//
// Deterministically slices the frozen settings static authority
// (components/eclipse-os/settings/eclipse-os-settings.html) into a single
// generated TypeScript fixture consumed by SettingsSurface.tsx:
//
//   - SETTINGS_STYLES  : the contents of the single <style> block
//   - SETTINGS_MARKUP  : the <body> markup (the `.win` tree), scripts removed
//   - SETTINGS_SCRIPTS : the inline <script> bodies, in source order
//
// The slice is mechanical (marker-based, no reformatting). Two documented,
// deterministic transforms are applied so the surface honors repo policy:
//
//   1. The Google Fonts `@import` in the <style> block is dropped. IBM Plex Mono
//      and Fragment Mono already ship locally via the app's fonts.css (G2/G4
//      offline-font route), so the network @import is both redundant and
//      forbidden in app runtime. Font matching is by family name, so removing the
//      import does not change the rendered result.
//   2. The settings "Back to app" link href `../desktop-main/eclipse-os.html`
//      (an old static-file path) is rewritten to the in-app route `/` so the
//      return path stays inside the Vite app instead of the legacy static file.
//
// Re-run: node apps/desktop-shell/scripts/extract-settings.mjs
// The output is generated - do not hand-edit settingsStatic.generated.ts.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const SOURCE = resolve(repoRoot, "components/eclipse-os/settings/eclipse-os-settings.html");
const OUT = resolve(here, "../src/settings/settingsStatic.generated.ts");

const html = readFileSync(SOURCE, "utf8");

function sliceBetween(source, openTag, closeTag, fromIndex = 0) {
  const open = source.indexOf(openTag, fromIndex);
  if (open === -1) throw new Error(`Missing ${openTag}`);
  const contentStart = open + openTag.length;
  const close = source.indexOf(closeTag, contentStart);
  if (close === -1) throw new Error(`Missing ${closeTag}`);
  return { content: source.slice(contentStart, close), end: close + closeTag.length };
}

// ---- styles (single <style> block) ----
const styleSlice = sliceBetween(html, "<style>", "</style>");
let styles = styleSlice.content;
// Transform 1: drop the forbidden Google Fonts @import (kept locally instead).
const beforeStyles = styles;
styles = styles.replace(
  /^[ \t]*@import url\("https:\/\/fonts\.googleapis\.com[^\n]*\n/m,
  "  /* G12: Google Fonts @import removed - IBM Plex Mono + Fragment Mono ship locally via fonts.css. */\n",
);
if (styles === beforeStyles) {
  throw new Error("Expected to find and remove the Google Fonts @import");
}

// ---- body (everything between <body> and </body>) ----
const bodySlice = sliceBetween(html, "<body>", "</body>");
let body = bodySlice.content;

// Collect the inline <script> bodies, in order, then strip them from the markup.
const scripts = [];
const scriptRe = /<script>([\s\S]*?)<\/script>/g;
let m;
while ((m = scriptRe.exec(body)) !== null) {
  scripts.push(m[1]);
}
if (scripts.length === 0) throw new Error("Expected at least one <script> block in settings body");

// Markup = body with the <script> blocks removed, trimmed of edge whitespace.
let markup = body.replace(scriptRe, "").trim();
// Transform 2: rewrite the "Back to app" link to the in-app route.
const beforeMarkup = markup;
markup = markup.replace('href="../desktop-main/eclipse-os.html"', 'href="/"');
if (markup === beforeMarkup) {
  throw new Error('Expected to find and rewrite the "Back to app" href');
}

const header = `// AUTO-GENERATED - DO NOT EDIT.
//
// Source : components/eclipse-os/settings/eclipse-os-settings.html
// Tool   : apps/desktop-shell/scripts/extract-settings.mjs
//
// G12 settings conversion fixture. The static settings reference is sliced
// mechanically into its <style> block, its <body> markup (the \`.win\` tree, with
// inline <script> blocks removed), and the inline <script> bodies in source order.
// Two deterministic transforms are applied by the extractor and documented there:
// the Google Fonts @import is dropped (fonts ship locally) and the "Back to app"
// link is rewritten to the in-app \`/\` route. Re-generate with:
//   node apps/desktop-shell/scripts/extract-settings.mjs
/* eslint-disable */
`;

const file =
  header +
  `\nexport const SETTINGS_STYLES = ${JSON.stringify(styles)};\n` +
  `\nexport const SETTINGS_MARKUP = ${JSON.stringify(markup)};\n` +
  `\nexport const SETTINGS_SCRIPTS: string[] = [\n` +
  scripts.map((s) => `  ${JSON.stringify(s)},`).join("\n") +
  `\n];\n`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, file, "utf8");

console.log(
  `Wrote ${OUT}\n  styles: ${styles.length} chars\n  markup: ${markup.length} chars\n  scripts: ${scripts.length} block(s)`,
);
