// Refactor-equivalence check. Records the rendered HTML of every screen and the
// main forms for fixed data and a fixed clock, so a refactor can be proven to
// change nothing visible.
//   node tests/snapshot.js save    -> writes tests/snapshots/ui-baseline.json
//   node tests/snapshot.js compare -> exits 1 and lists differences if any
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const h = require("./harness");
const { realisticMonth, baseState } = require("./fixtures");

const FILE = path.join(__dirname, "snapshots", "ui-baseline.json");
const VIEWS = ["home", "money", "plan", "goals", "bills", "debts", "reports", "settings"];
const MODALS = [
  ["money", "add-expense"], ["money", "add-income"], ["money", "edit-transaction", 3],
  ["goals", "add-goal"], ["goals", "contribute-goal", 20],
  ["bills", "add-bill"], ["bills", "pay-bill", 32],
  ["debts", "add-debt"], ["debts", "repay-debt", 40], ["debts", "debt-history", 40],
  ["settings", "change-pin"],
  ["money", "add-transfer"], ["money", "add-account"], ["money", "edit-account", "mpesa"],
  ["goals", "move-goal", 20], ["goals", "release-goal", 20], ["goals", "goal-history", 20],
  ["money", "reconcile-account", "mpesa"], ["plan", "edit-plan"], ["plan", "add-expected"], ["goals", "use-goal", 20]
];

async function capture() {
  const out = {};
  const scenarios = { realistic: realisticMonth(), empty: baseState() };
  for (const [scenario, seed] of Object.entries(scenarios)) {
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
      const { page, context, errors } = await h.openApp({ seed, viewport });
      const tag = `${scenario}@${viewport.width}`;
      for (const view of VIEWS) {
        await h.goView(page, view);
        out[`${tag} view:${view}`] = await page.evaluate(v => document.getElementById(v + "View").innerHTML, view);
      }
      if (scenario === "realistic") for (const [view, action, id] of MODALS) {
        await h.goView(page, view);
        const exists = await page.evaluate(({ a, i }) => !!document.querySelector(i == null ? `[data-action="${a}"]` : `[data-action="${a}"][data-id="${i}"]`), { a: action, i: id });
        if (!exists) { out[`${tag} modal:${action}`] = "<missing button>"; continue; }
        await h.clickAction(page, action, id);
        out[`${tag} modal:${action}`] = await page.evaluate(() => document.querySelector(".modal-backdrop .modal, .modal")?.outerHTML || "<no modal>");
        await page.keyboard.press("Escape"); await page.waitForTimeout(100);
      }
      out[`${tag} errors`] = errors.join(" | ");
      await context.close();
    }
  }
  await h.closeBrowser();
  return out;
}

(async () => {
  const mode = process.argv[2];
  const snap = await capture();
  const hashes = Object.fromEntries(Object.entries(snap).map(([k, v]) => [k, crypto.createHash("sha256").update(v).digest("hex").slice(0, 16)]));
  if (mode === "save") {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(hashes, null, 2) + "\n");
    console.log(`Saved ${Object.keys(hashes).length} UI snapshots to ${path.relative(process.cwd(), FILE)}`);
    return;
  }
  const base = JSON.parse(fs.readFileSync(FILE, "utf8"));
  const diffs = Object.keys({ ...base, ...hashes }).filter(k => base[k] !== hashes[k]);
  diffs.forEach(k => console.log(`DIFF  ${k}`));
  console.log(`${Object.keys(hashes).length - diffs.length}/${Object.keys(hashes).length} UI snapshots identical to baseline`);
  process.exit(diffs.length ? 1 : 0);
})();
