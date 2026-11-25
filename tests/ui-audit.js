// UI audit: every screen (plus the More menu and the main forms), at 320/360/390/1280 px, light and dark.
// Checks: no horizontal scrolling, touch targets, WCAG AA text contrast. Run: node tests/ui-audit.js
const fs = require("fs"), path = require("path");
const h = require("./harness");
const demo = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "docs", "demo", "pesapilot-demo-schema9.json"), "utf8")).data;
const VIEWS = ["home", "money", "plan", "goals", "bills", "debts", "reports", "settings"];
const FORMS = [["money", "add-expense"], ["money", "add-transfer"], ["goals", "contribute-goal"], ["money", "reconcile-account"], ["goals", "use-goal"], ["goals", "goal-history"], ["home", "open-more"]];

function audit() { // runs in the page
  const W = window.innerWidth, mobile = W <= 760, problems = [];
  const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(",").map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
  const bgOf = el => { for (let n = el; n; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > .5) return c; } return parse(getComputedStyle(document.body).backgroundColor); };
  const visible = el => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== "hidden" && s.display !== "none" && el.closest(".hidden") === null; };
  const scope = document.querySelector(".modal-backdrop.open") ? [document.querySelector("#modal")] : [document.querySelector(".view.active"), document.querySelector(".topbar"), document.querySelector(mobile ? ".bottom-nav" : "#desktopNav")];
  if (document.documentElement.scrollWidth > W) problems.push(`page is ${document.documentElement.scrollWidth - W}px wider than the screen`);
  scope.filter(Boolean).forEach(root => {
    root.querySelectorAll("button, a, input:not([type=checkbox]):not([type=file]), select, summary, label.btn").forEach(el => {
      if (!visible(el) || el.classList.contains("sr-only")) return;
      const r = el.getBoundingClientRect(), inline = el.classList.contains("btn-link") || el.closest(".lock-help");
      const min = inline ? 24 : mobile ? 38 : 32;
      if (r.height < min - 0.5) problems.push(`small target (${Math.round(r.width)}x${Math.round(r.height)}): ${(el.textContent || el.id || el.tagName).trim().slice(0, 30)}`);
    });
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    while (walker.nextNode()) {
      const el = walker.currentNode.parentElement;
      if (!walker.currentNode.textContent.trim() || seen.has(el) || !visible(el)) continue;
      seen.add(el);
      const s = getComputedStyle(el), fg = parse(s.color), bg = bgOf(el);
      if (!fg || !bg || el.closest("[disabled]") || Number(s.opacity) < 1) continue;
      const size = parseFloat(s.fontSize), bold = Number(s.fontWeight) >= 700, large = size >= 24 || (size >= 18.66 && bold);
      const need = large ? 3 : 4.5, got = ratio(fg, bg);
      if (got < need - 0.01) problems.push(`contrast ${got.toFixed(2)} < ${need}: "${el.textContent.trim().slice(0, 32)}" (${s.color} on rgb(${bg.r},${bg.g},${bg.b}))`);
    }
  });
  return [...new Set(problems)];
}

(async () => {
  let total = 0;
  for (const theme of ["light", "dark"]) for (const width of [320, 360, 390, 1280]) {
    const seed = JSON.parse(JSON.stringify(demo)); seed.profile.theme = theme; seed.profile.lastBackupAt = "2026-11-20T10:00:00Z";
    const { page, context, errors } = await h.openApp({ seed, viewport: { width, height: 860 } });
    const found = [];
    for (const view of VIEWS) { await h.goView(page, view); (await page.evaluate(audit)).forEach(p => found.push(`${view}: ${p}`)); }
    for (const [view, action] of FORMS) {
      if (action === "open-more" && width > 760) continue;
      await h.goView(page, view);
      const ok = await page.evaluate(a => { const b = document.querySelector(`[data-action="${a}"]`); if (b) b.click(); return !!b; }, action);
      if (!ok) continue;
      await page.waitForTimeout(200);
      (await page.evaluate(audit)).forEach(p => found.push(`form ${action}: ${p}`));
      await page.evaluate(() => document.querySelector('#modal [data-action="close-modal"]')?.click()); await page.waitForTimeout(100);
    }
    errors.forEach(e => found.push("page error: " + e));
    total += found.length;
    console.log(`${found.length ? "ISSUES" : "OK    "} ${theme.padEnd(5)} ${String(width).padStart(4)}px  ${found.length} issue${found.length === 1 ? "" : "s"}`);
    found.slice(0, 12).forEach(p => console.log("         - " + p));
    await context.close();
  }
  await h.closeBrowser();
  console.log(`\n${total} issue${total === 1 ? "" : "s"} found`);
  process.exit(total ? 1 : 0);
})();
