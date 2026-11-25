import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { preview } from "vite";

const smoke = await preview({
  root: fileURLToPath(new URL("../examples/smoke", import.meta.url)),
  configFile: false,
  preview: { host: "127.0.0.1", port: 5177, strictPort: true },
});

let browser;
try {
  browser = await chromium.launch({
    executablePath: process.env.UI_BROWSER_EXECUTABLE,
    channel: process.env.UI_BROWSER_CHANNEL,
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  page.setDefaultTimeout(8000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const origin = "http://127.0.0.1:5177";
  const requests = [];
  page.on("request", (request) => requests.push(new URL(request.url())));
  await page.goto(origin);

  const counter = page.getByRole("button", { name: "Нажатия: 0", exact: true });
  const appearance = await counter.evaluate((button) => {
    const style = getComputedStyle(button);
    return { borderWidth: style.borderWidth, brand: style.getPropertyValue("--color-brand").trim() };
  });
  assert.equal(appearance.borderWidth, "0px", "Missing component CSS");
  assert.ok(appearance.brand, "Missing theme tokens");
  await counter.click();
  await page.getByRole("button", { name: "Нажатия: 1", exact: true }).waitFor();

  await page.getByRole("button", { name: "Тема: dark", exact: true }).click();
  await page.waitForFunction(() => document.documentElement.dataset.theme === "light");

  const dialogButton = page.getByRole("button", { name: "Диалог", exact: true });
  const dialog = page.getByRole("dialog", { name: "Smoke dialog", exact: true });
  await dialogButton.click();
  await dialog.waitFor();
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "hidden" });
  assert.equal(await dialogButton.evaluate((button) => button === document.activeElement), true);

  await page.getByRole("button", { name: "SkyDrawer", exact: true }).click();
  await page.getByText("Панель без URL Edge.", { exact: true }).waitFor();
  assert.equal(new URL(page.url()).search, "");

  assert.deepEqual(errors, []);
  const unexpected = requests.filter((url) =>
    url.protocol !== "data:" && (url.origin !== origin || url.pathname.startsWith("/api/")),
  );
  const destinations = new Set(unexpected.map((url) =>
    url.origin === origin ? `${origin}/api/` : url.origin,
  ));
  assert.deepEqual([...destinations], [], "Unexpected network destinations");
  console.log("Packed browser consumer: PASS");
} finally {
  await browser?.close();
  await new Promise((done) => smoke.httpServer.close(done));
}
