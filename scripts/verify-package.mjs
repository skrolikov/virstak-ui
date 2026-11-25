import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const smoke = resolve(root, "examples/smoke");
const manifest = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const archive = resolve(root, "artifacts", `virstak-ui-${manifest.version}.tgz`);
const npmCli = process.env.npm_execpath;
assert.ok(npmCli, "Run this check with npm run verify:release.");

function npm(...args) {
  execFileSync(process.execPath, [npmCli, ...args], { cwd: smoke, stdio: "inherit" });
}

npm("ci", "--no-fund", "--no-audit");
npm("install", "--no-save", "--ignore-scripts", "--no-fund", "--no-audit", archive);

const installed = resolve(smoke, "node_modules/@virstak/ui");
const packedManifest = JSON.parse(await readFile(resolve(installed, "package.json"), "utf8"));
assert.deepEqual(packedManifest, manifest);
assert.deepEqual((await readdir(installed)).sort(), ["README.md", "dist", "package.json"]);

const expectedDist = ["browser.js", "components.css", "css.d.ts", "index.d.ts", "index.js", "styles.css", "themes.css", "tokens.css"];
assert.deepEqual((await readdir(resolve(installed, "dist"))).sort(), expectedDist);
for (const name of expectedDist) {
  assert.deepEqual(
    await readFile(resolve(installed, "dist", name)),
    await readFile(resolve(root, "dist", name)),
    `Installed artifact mismatch: ${name}`,
  );
}

npm("run", "verify:ssr");
npm("run", "build");
console.log(`Verified ${manifest.name}@${manifest.version} from ${archive}`);
