// Test harness: drives the real index.html in headless Chromium.
// Black-box by design: tests seed localStorage, use the UI, and read results
// from the screen or from an exported backup. No app code is imported.
const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

// PESAPILOT_APP lets a tool point the harness at another build (e.g. an older version for comparisons).
const APP_URL = "file://" + (process.env.PESAPILOT_APP || path.resolve(__dirname, "..", "index.html"));
const STORAGE_KEY = "pesapilot_v2";
const ONBOARDING_KEY = "pesapilot_onboarding_v1";
// Fixed "now" so results are reproducible: 25 Nov 2026, 10:00 Nairobi time.
const FIXED_NOW = new Date("2026-11-25T10:00:00+03:00");

let browser;
async function getBrowser() {
  if (!browser) browser = await chromium.launch();
  return browser;
}
async function closeBrowser() {
  if (browser) await browser.close();
  browser = null;
}

/** Open the app. `seed` (object) is written to storage before load. */
async function openApp({ seed = null, onboardingDone = true, viewport = { width: 1280, height: 900 } } = {}) {
  const context = await (await getBrowser()).newContext({ acceptDownloads: true, timezoneId: "Africa/Nairobi", locale: "en-KE", viewport });
  const page = await context.newPage();
  const errors = [], dialogs = [];
  page.on("pageerror", err => errors.push(String(err && err.message || err)));
  page.on("console", msg => { if (msg.type() === "error") errors.push("console: " + msg.text()); });
  page.on("dialog", dialog => { dialogs.push(dialog.message()); dialog.accept(); });
  await page.clock.setFixedTime(FIXED_NOW);
  await page.goto(APP_URL);
  await page.evaluate(({ seed, onboardingDone, STORAGE_KEY, ONBOARDING_KEY }) => {
    localStorage.clear();
    if (seed) localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    if (onboardingDone) localStorage.setItem(ONBOARDING_KEY, "done");
  }, { seed, onboardingDone, STORAGE_KEY, ONBOARDING_KEY });
  await page.reload();
  await settle(page);
  return { page, context, errors, dialogs };
}

async function settle(page, ms = 1200) {
  await page.waitForLoadState("load");
  await page.waitForTimeout(ms); // splash screen + onboarding timers
}

async function goView(page, view) {
  await page.evaluate(v => document.querySelector(`[data-view="${v}"]`).click(), view);
  await page.waitForTimeout(150);
}

/** Export a backup through the Settings screen and return the parsed JSON. */
async function exportBackup(page) {
  await goView(page, "settings");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.evaluate(() => document.querySelector('[data-action="export-backup"]').click())
  ]);
  return JSON.parse(fs.readFileSync(await download.path(), "utf8"));
}

/** Import a backup object through the Settings file input (accepts dialogs, waits for reload). */
async function importBackup(page, backup) {
  await goView(page, "settings");
  const navigation = page.waitForNavigation().catch(() => {});
  const downloads = []; // a safety backup is downloaded before import
  page.on("download", d => downloads.push(d));
  await page.setInputFiles("#importFile", { name: "backup.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(backup)) });
  await navigation;
  await settle(page);
  return downloads;
}

async function storedState(page) {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key) || "null"), STORAGE_KEY);
}

async function bodyText(page) {
  return (await page.innerText("body")).replace(/\s+/g, " ");
}

async function clickAction(page, action, id) {
  await page.evaluate(({ action, id }) => {
    const sel = id == null ? `[data-action="${action}"]` : `[data-action="${action}"][data-id="${id}"]`;
    const el = document.querySelector(sel);
    if (!el) throw new Error("No button for " + sel);
    el.click();
  }, { action, id });
  await page.waitForTimeout(150);
}

async function toastText(page) {
  return page.evaluate(() => document.getElementById("toast").textContent);
}
/** Fill a form's fields ({ id: value }, selects included) and submit it. */
async function submitForm(page, formId, values = {}) {
  await page.evaluate(({ formId, values }) => {
    for (const [field, value] of Object.entries(values)) {
      const el = document.getElementById(field);
      if (!el) throw new Error("No field #" + field);
      if (el.type === "checkbox") el.checked = Boolean(value); else el.value = value;
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    document.getElementById(formId).requestSubmit();
  }, { formId, values });
  await page.waitForTimeout(150);
}

/** Text of a figure marked data-figure="name" on the current screen (optionally inside a container). */
async function figure(page, name, scope = "") {
  return page.evaluate(({ name, scope }) => {
    const root = scope ? document.querySelector(scope) : document.querySelector(".view.active");
    const el = root && root.querySelector(`[data-figure="${name}"]`);
    return el ? el.textContent.replace(/\s+/g, " ").trim() : null;
  }, { name, scope });
}

module.exports = { figure, toastText, submitForm, openApp, closeBrowser, settle, goView, exportBackup, importBackup, storedState, bodyText, clickAction, FIXED_NOW, STORAGE_KEY };
