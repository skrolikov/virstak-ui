import { readFile, writeFile, mkdir } from "node:fs/promises";

for (const name of ["tokens", "themes", "styles"]) {
  const source = await readFile(new URL(`../src/styles/${name}.css`, import.meta.url), "utf8");
  await writeFile(new URL(`../dist/${name}.css`, import.meta.url), source.replace(/\r\n/g, "\n"));
}
await writeFile(new URL("../dist/css.d.ts", import.meta.url), "export {};\n");
await writeFile(
  new URL("../dist/browser.js", import.meta.url),
  '"use client";\nimport "./components.css";\nexport * from "./index.js";\n',
);
await mkdir(new URL("../artifacts/", import.meta.url), { recursive: true });
