import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { createRequire } from "node:module";
import { chromium } from "playwright";
import { createServer, preview } from "vite";

const ui = fileURLToPath(new URL("../", import.meta.url));
const edge = resolve(ui, "../virstak-edge");
const baselineCommit = "8d34c37572903d50940d7c0fca0f70b86287b343";
const resultDir = resolve(ui, "verification-results");
await mkdir(resultDir, { recursive: true });
for (const consumer of [edge, resolve(ui, "examples/smoke")]) {
  for (const name of [
    "index.js",
    "components.css",
    "tokens.css",
    "themes.css",
  ]) {
    assert.deepEqual(
      await readFile(resolve(consumer, "node_modules/@virstak/ui/dist", name)),
      await readFile(resolve(ui, "dist", name)),
      `Stale installed UI package in ${consumer}: ${name}`,
    );
  }
  const host = createRequire(resolve(consumer, "package.json"));
  const component = createRequire(
    resolve(consumer, "node_modules/@virstak/ui/package.json"),
  );
  assert.equal(
    component.resolve("react"),
    host.resolve("react"),
    `Duplicate React in ${consumer}`,
  );
}
const baseline = Object.fromEntries(
  [
    "reset",
    "tokens",
    "breakpoints",
    "themes",
    "typography",
    "motion",
    "globals",
  ].map((name) => [
    name,
    execFileSync(
      "git",
      ["-C", edge, "show", `${baselineCommit}:src/app/styles/${name}.css`],
      { encoding: "utf8" },
    ),
  ]),
);
const variables = [
  ...new Set(
    Object.values(baseline)
      .join("\n")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .match(/--[\w-]+(?=\s*:)/g),
  ),
];

let server;
let smoke;
let edgeProduction;
let browser;
try {
  server = await createServer({
    root: edge,
    configFile: resolve(edge, "vite.config.ts"),
    optimizeDeps: { entries: ["tests/fixtures/ui-compat.html"] },
    server: { host: "127.0.0.1", port: 5174, strictPort: true },
  });
  await server.listen();
  smoke = await preview({
    root: resolve(ui, "examples/smoke"),
    configFile: false,
    preview: { host: "127.0.0.1", port: 5175, strictPort: true },
  });
  edgeProduction = await preview({
    root: edge,
    configFile: resolve(edge, "vite.config.ts"),
    preview: { host: "127.0.0.1", port: 5176, strictPort: true },
  });
  // Use an existing browser; this script never installs a browser globally.
  browser = await chromium.launch({
    ...(process.env.UI_BROWSER_EXECUTABLE
      ? { executablePath: process.env.UI_BROWSER_EXECUTABLE }
      : { channel: process.env.UI_BROWSER_CHANNEL || "msedge" }),
    headless: true,
    args: ["--disable-gpu"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  await context.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: "" }),
  );
  const errors = [];
  context.on("page", (page) =>
    page.on("pageerror", (error) => errors.push(error.message)),
  );
  const oldPage = await context.newPage();
  const newPage = await context.newPage();
  await oldPage.route("**/src/app/styles/*.css*", async (route) => {
    const name = new URL(route.request().url()).pathname
      .split("/")
      .at(-1)
      .replace(".css", "");
    if (!(name in baseline)) return route.continue();
    const css =
      name === "typography"
        ? baseline[name].replace(/@import url\("[^"]+"\);/g, "")
        : baseline[name];
    await route.fulfill({
      contentType: "application/javascript",
      body: `const s = document.createElement('style'); s.textContent = ${JSON.stringify(css)}; document.head.append(s);`,
    });
  });
  await Promise.all([
    oldPage.goto(
      "http://127.0.0.1:5174/tests/fixtures/ui-compat.html?legacy=1",
    ),
    newPage.goto("http://127.0.0.1:5174/tests/fixtures/ui-compat.html"),
  ]);
  await Promise.all([
    oldPage.waitForSelector('[data-check="primary-md-false"]'),
    newPage.waitForSelector('[data-check="primary-md-false"]'),
  ]);
  for (const page of [oldPage, newPage]) {
    await page
      .locator('[data-check="avatar-failure"]')
      .getByText("AL", { exact: true })
      .waitFor();
    await page.waitForFunction(
      () =>
        document.querySelector('[data-check="avatar-image"] img')
          ?.naturalWidth > 0,
    );
  }

  const snapshot = (page) =>
    page.evaluate((variables) => {
      const properties = [
        "display",
        "boxSizing",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "lineHeight",
        "letterSpacing",
        "color",
        "backgroundColor",
        "backgroundImage",
        "backgroundPosition",
        "backgroundSize",
        "objectFit",
        "height",
        "width",
        "padding",
        "margin",
        "border",
        "borderRadius",
        "boxShadow",
        "gap",
        "opacity",
        "cursor",
        "outline",
        "transform",
        "transitionDuration",
        "animationDuration",
        "animationIterationCount",
      ];
      const elements = [...document.querySelectorAll("[data-check]")].flatMap(
        (root) =>
          [root, ...root.querySelectorAll("*")].map((element, index) => {
            const css = getComputedStyle(element);
            return [
              `${root.dataset.check}/${index}:${element.tagName.toLowerCase()}`,
              Object.fromEntries(
                properties.map((property) => [
                  property,
                  // Position/size have no rendered effect when there is no image.
                  (property === "backgroundPosition" ||
                    property === "backgroundSize") &&
                  css.backgroundImage === "none"
                    ? "not-applicable"
                    : property === "transitionDuration" &&
                        css[property]
                          .split(",")
                          .every((value) => parseFloat(value) === 0)
                      ? "0s"
                      : css[property],
                ]),
              ),
            ];
          }),
      );
      const css = getComputedStyle(document.documentElement);
      return {
        elements: Object.fromEntries(elements),
        variables: Object.fromEntries(
          variables.map((name) => [
            name,
            css
              .getPropertyValue(name)
              .trim()
              .replace(/\s+/g, " ")
              .replace(/\(\s+/g, "(")
              .replace(/\s+\)/g, ")"),
          ]),
        ),
      };
    }, variables);

  async function compare(label) {
    // Settle CSS transitions on both pages, including a background browser tab.
    await Promise.all(
      [oldPage, newPage].map((page) =>
        page.evaluate(() => {
          for (const element of document.querySelectorAll("[data-check]"))
            getComputedStyle(element).backgroundColor;
          for (const animation of document.getAnimations()) {
            if (animation.effect?.getComputedTiming().iterations === Infinity) {
              animation.pause();
              animation.currentTime = 0;
            } else animation.finish();
          }
        }),
      ),
    );
    const actual = await snapshot(newPage);
    const expected = await snapshot(oldPage);
    if (!isDeepStrictEqual(actual, expected)) {
      await writeFile(
        resolve(resultDir, "difference.json"),
        JSON.stringify({ label, actual, expected }, null, 2),
      );
      const differences = [];
      for (const group of Object.keys(expected))
        for (const key of Object.keys(expected[group])) {
          if (!isDeepStrictEqual(actual[group][key], expected[group][key]))
            differences.push(`${group}.${key}`);
        }
      throw new Error(
        `${label}: mismatched ${differences.slice(0, 8).join(", ")}; see verification-results/difference.json`,
      );
    }
  }

  let combinations = 0;
  for (const width of [1280, 375]) {
    await Promise.all([
      oldPage.setViewportSize({ width, height: 900 }),
      newPage.setViewportSize({ width, height: 900 }),
    ]);
    for (const theme of ["dark", "light"])
      for (const design of ["extended", "simple"])
        for (const product of [
          "platform",
          "smp",
          "crm",
          "tasks",
          "omni",
          "finance",
          "inventory",
          "digital",
        ]) {
          await Promise.all(
            [oldPage, newPage].map((page) =>
              page.evaluate(
                ({ theme, design, product }) => {
                  Object.assign(document.documentElement.dataset, {
                    theme,
                    design,
                    product,
                  });
                },
                { theme, design, product },
              ),
            ),
          );
          await compare(`${width}/${theme}/${design}/${product}`);
          combinations++;
        }
    console.log(
      `Compared ${combinations} theme/design/accent/viewport combinations`,
    );
  }
  // Compare interactive states after transitions finish, including keyboard focus.
  for (const variant of ["primary", "secondary", "ghost", "danger"]) {
    const selector = `[data-check="${variant}-md-false"]`;
    await Promise.all(
      [oldPage, newPage].map(async (page) => {
        await page.locator(selector).hover();
      }),
    );
    await newPage.waitForTimeout(180);
    await compare(`${variant}/hover`);
    await Promise.all(
      [oldPage, newPage].map(async (page) => {
        await page.mouse.move(0, 0);
        await page.keyboard.press("Tab");
        await page.locator(selector).focus();
      }),
    );
    await newPage.waitForTimeout(180);
    await compare(`${variant}/focus`);
    await Promise.all(
      [oldPage, newPage].map(async (page) => {
        await page.locator(selector).hover();
        await page.mouse.down();
      }),
    );
    await compare(`${variant}/active`);
    await Promise.all([oldPage.mouse.up(), newPage.mouse.up()]);
  }
  await Promise.all(
    [oldPage, newPage].map((page) =>
      page.locator('[data-check="input-default"] input').fill("Updated"),
    ),
  );
  await compare("input/edit-and-focus");
  await Promise.all(
    [oldPage, newPage].map(async (page) => {
      const select = page.locator('[data-check="select-default"] select');
      await select.focus();
      await select.selectOption("b");
    }),
  );
  await compare("select/selection-and-focus");
  await Promise.all(
    [oldPage, newPage].map((page) =>
      page.getByText("Fixture consent", { exact: true }).click(),
    ),
  );
  await compare("checkbox/label-click");
  await Promise.all(
    [oldPage, newPage].map(async (page) => {
      await page.locator('[data-check="checkbox-default"] input').focus();
      await page.keyboard.press("Space");
    }),
  );
  await compare("checkbox/keyboard");
  await Promise.all(
    [oldPage, newPage].map((page) =>
      page
        .getByRole("button", { name: "Fixture action: 0", exact: true })
        .click(),
    ),
  );
  await compare("empty-state/action");
  for (const page of [oldPage, newPage]) {
    assert.equal(
      await page.locator('[data-check="input-default"] input').inputValue(),
      "Updated",
    );
    assert.equal(
      await page.locator('[data-check="select-default"] select').inputValue(),
      "b",
    );
    assert.equal(
      await page.locator('[data-check="checkbox-default"] input').isChecked(),
      false,
    );
    await page
      .getByRole("button", { name: "Fixture action: 1", exact: true })
      .waitFor();
  }
  await Promise.all(
    [oldPage, newPage].map((page) =>
      page.emulateMedia({ reducedMotion: "reduce" }),
    ),
  );
  await compare("reduced-motion");
  const screenshots = [];
  async function capture(page, name) {
    if (process.env.UI_SCREENSHOTS !== "1") return;
    await page.bringToFront();
    await page.screenshot({ path: resolve(resultDir, name), timeout: 10000 });
    screenshots.push(name);
  }
  await capture(oldPage, "edge-legacy.png");
  await capture(newPage, "edge-package.png");

  const page = await context.newPage();
  const requests = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("http://127.0.0.1:5175");
  const counter = page.getByRole("button", { name: "Нажатия: 0", exact: true });
  await counter.click();
  await page.getByRole("button", { name: "Нажатия: 1", exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("button", { name: "Недоступно", exact: true })
      .isDisabled(),
    true,
  );
  await page.getByRole("textbox", { name: /Smoke name/ }).fill("Standalone");
  await page
    .getByRole("combobox", { name: "Smoke choice", exact: true })
    .selectOption("b");
  await page.getByText("Smoke consent", { exact: true }).click();
  assert.equal(
    await page
      .getByRole("checkbox", { name: "Smoke consent", exact: true })
      .isChecked(),
    true,
  );
  assert.equal(
    await page.getByRole("textbox", { name: /Smoke name/ }).inputValue(),
    "Standalone",
  );
  assert.equal(
    await page
      .getByRole("combobox", { name: "Smoke choice", exact: true })
      .inputValue(),
    "b",
  );
  await page.getByRole("button", { name: "Smoke action", exact: true }).click();
  await page.getByRole("button", { name: "Нажатия: 2", exact: true }).waitFor();
  await page.emulateMedia({ reducedMotion: "reduce" });
  const isolated = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const light = getComputedStyle(
      document.querySelector('[aria-label="Светлая тема"] button'),
    );
    const control = getComputedStyle(document.querySelector("button"));
    const input = getComputedStyle(
      document.querySelector('input:not([type="checkbox"])'),
    );
    const select = getComputedStyle(document.querySelector("select"));
    const checkboxBox = getComputedStyle(
      document.querySelector('input[type="checkbox"] + span'),
    );
    const skeleton = getComputedStyle(
      document.querySelector('[aria-hidden="true"][style*="120px"]'),
    );
    return {
      overflow: body.overflow,
      backgroundImage: body.backgroundImage,
      scrolls: document.documentElement.scrollHeight > innerHeight,
      boxSizing: control.boxSizing,
      border: control.borderWidth,
      lightBackground: light.backgroundColor,
      inputFont: input.fontFamily,
      selectFont: select.fontFamily,
      bodyFont: body.fontFamily,
      checkboxWidth: checkboxBox.width,
      checkboxSizing: checkboxBox.boxSizing,
      skeletonDuration: skeleton.animationDuration,
      skeletonIterations: skeleton.animationIterationCount,
    };
  });
  assert.notEqual(isolated.overflow, "hidden");
  assert.equal(isolated.backgroundImage, "none");
  assert.equal(isolated.scrolls, true);
  assert.equal(isolated.boxSizing, "border-box");
  assert.equal(isolated.border, "0px");
  assert.equal(isolated.inputFont, isolated.bodyFont);
  assert.equal(isolated.selectFont, isolated.bodyFont);
  assert.equal(isolated.checkboxWidth, "18px");
  assert.equal(isolated.checkboxSizing, "border-box");
  assert.equal(isolated.skeletonIterations, "1");
  assert(parseFloat(isolated.skeletonDuration) < 0.001);
  assert.equal(
    requests.some((url) =>
      /virstak-edge|\/api\/|fonts\.google|\/assets\/bg\//.test(url),
    ),
    false,
  );
  await capture(page, "smoke.png");
  const productionPage = await context.newPage();
  await productionPage.goto("http://127.0.0.1:5176/login");
  await productionPage
    .getByRole("heading", { name: "Вход", exact: true })
    .waitFor();
  await productionPage
    .locator('input[type="email"]')
    .fill("ui-check@example.invalid");
  assert.equal(
    await productionPage.locator('form button[type="submit"]').count(),
    1,
  );
  assert.deepEqual(errors, []);
  await writeFile(
    resolve(resultDir, "browser.json"),
    JSON.stringify(
      {
        baselineCommit,
        browser: browser.version(),
        combinations,
        interactiveComparisons: 12,
        formComparisons: 5,
        components: [
          "Button",
          "Badge",
          "Input",
          "Select",
          "Checkbox",
          "Avatar",
          "Skeleton",
          "EmptyState",
        ],
        reducedMotion: true,
        screenshots,
        sharedReact: true,
        edgeConfig: "virstak-edge/vite.config.ts",
        edgeProductionLogin: true,
        independentConsumer: isolated,
        pageErrors: errors,
        fonts:
          "Network fonts disabled for deterministic comparison; host fallback fonts used.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Browser compatibility and independent packed consumer: PASS");
} finally {
  await browser?.close();
  await server?.close();
  if (smoke)
    await new Promise((resolveClose) => smoke.httpServer.close(resolveClose));
  if (edgeProduction)
    await new Promise((resolveClose) =>
      edgeProduction.httpServer.close(resolveClose),
    );
}
