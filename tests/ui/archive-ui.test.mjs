import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const appRoot = path.join(root, "apps/desktop-shell");
const publicRoot = path.join(appRoot, "public");
const bridgeTag = '<script type="module" src="/src/harnessBridge.ts"></script>\n';
const canonicalHash = "678873df3dbdc0fc9795780a8a69c8785545e4f209777579377d83b951a075db";

const corePages = [
  path.join(appRoot, "EclipseOS.html"),
  path.join(publicRoot, "Settings.html"),
  path.join(publicRoot, "EclipseOSMobile.html"),
  path.join(publicRoot, "Workboard 2.html"),
  path.join(publicRoot, "Workboard Mobile.html"),
  path.join(publicRoot, "Automations 2.html"),
  path.join(publicRoot, "Automations Mobile.html"),
  path.join(publicRoot, "Plugins.html"),
  path.join(publicRoot, "Plugins Mobile.html"),
];

test("desktop shell matches the supplied visual authority", () => {
  const integrated = readFileSync(path.join(appRoot, "EclipseOS.html"), "utf8");
  assert.ok(integrated.includes(bridgeTag.trim()));

  const canonicalBytes = integrated.replace(bridgeTag, "");
  const actualHash = createHash("sha256").update(canonicalBytes).digest("hex");
  assert.equal(actualHash, canonicalHash);
});

test("canonical shell keeps every approved product surface", () => {
  const source = readFileSync(path.join(appRoot, "EclipseOS.html"), "utf8");
  for (const marker of [
    'id="inputField"',
    'id="transcriptInner"',
    'id="workboardView"',
    'id="a2Root"',
    'id="pgRoot"',
    'id="settingsOverlay"',
    'class="work-panel"',
    'components/chrome/view-router.js',
  ]) {
    assert.ok(source.includes(marker), `missing canonical marker: ${marker}`);
  }
});

test("all local assets referenced by the core pages are published", () => {
  for (const page of corePages) {
    assert.ok(existsSync(page), `missing page: ${path.relative(root, page)}`);
    const source = readFileSync(page, "utf8");
    for (const reference of localReferences(source)) {
      const candidates = reference.startsWith("/src/")
        ? [path.join(appRoot, reference.slice(1))]
        : [
            path.resolve(path.dirname(page) === appRoot ? publicRoot : path.dirname(page), reference),
            path.resolve(appRoot, reference),
          ];
      assert.ok(
        candidates.some((candidate) => existsSync(candidate)),
        `${path.relative(root, page)} references missing ${reference}`,
      );
    }
  }
});

test("private archive working material is not published", () => {
  for (const excluded of ["uploads", "briefs", "scraps", "screenshots"]) {
    assert.equal(existsSync(path.join(publicRoot, excluded)), false);
  }
});

function localReferences(source) {
  const references = [];
  for (const match of source.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const value = match[1].split(/[?#]/)[0];
    if (
      !value ||
      value.startsWith("#") ||
      value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:")
    ) {
      continue;
    }
    references.push(value);
  }
  return references;
}
