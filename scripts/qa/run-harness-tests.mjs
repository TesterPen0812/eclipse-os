import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "../..");
const buildRoot = path.join(root, "build/harness-tests");
const tsc = path.join(root, "node_modules/.pnpm/node_modules/.bin/tsc");

rmSync(buildRoot, { force: true, recursive: true });
mkdirSync(buildRoot, { recursive: true });

run(tsc, ["-p", "tsconfig.harness-tests.json"], {
  cwd: root,
  label: "compile harness tests",
});

rewriteEmittedModules(path.join(buildRoot, "packages"));

run(process.execPath, ["--test", "tests/harness/harness.test.mjs"], {
  cwd: root,
  env: {
    ...process.env,
    HARNESS_TEST_BUILD_DIR: buildRoot,
  },
  label: "run harness tests",
});

function run(command, args, options) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    throw new Error(`${options.label} failed`);
  }
}

function rewriteEmittedModules(dir) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      rewriteEmittedModules(full);
      continue;
    }
    if (!full.endsWith(".js")) continue;
    let source = readFileSync(full, "utf8");
    source = source.replaceAll(
      'from "@eclipse-os/harness-core"',
      'from "../../harness-core/src/index.js"',
    );
    source = source.replaceAll(
      'from "@eclipse-os/harness-eclipse"',
      'from "../../harness-eclipse/src/index.js"',
    );
    source = source.replace(
      /(from\s+["'])(\.[^"']+?)(["'])/g,
      (_match, prefix, specifier, suffix) => {
        if (specifier.endsWith(".js") || specifier.endsWith(".json")) {
          return `${prefix}${specifier}${suffix}`;
        }
        return `${prefix}${specifier}.js${suffix}`;
      },
    );
    writeFileSync(full, source);
  }
}
