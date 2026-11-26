# Release 1: Deployment Checklist & Recovery Procedure

**Scope:** Phases 0.5, 1, 2, PIN protection, the UI/UX redesign and the D12 fix (CR-001 to CR-006), released as one upgrade (DEC-018, DEC-021).
**From:** live `main` @ `8e33d44` (schema 9).
**To:** the work-branch head at approval time (schema 10).
**Status: NOT DEPLOYED. Waiting for the owner's preview review and explicit approval.**

---

## 1. Release gate (DEC-018)

| # | Condition | Status | Evidence |
|---|---|---|---|
| 1 | Owner reviews the preview on their phone with realistic made-up data | ⏳ **Owner** | §3 below |
| 2 | Migration tested on representative copies of existing data | ✅ (re-run after the redesign: `evidence/redesign-migration.txt`) | `tests/migration.js` → `evidence/release-1-migration.txt`: 4 data sets (earliest/no-schema, schema 5, heavy 1,498-entry schema 9, messy values) |
| 3 | Balances, transactions, goals, debts, bills and account histories correct after upgrade | ✅ | Same suite. Every record is compared with the original live app. Balances match an independent re-implementation, in total and for every account card. |
| 4 | Successful rollback test | ✅ | The pre-accounts copy imports into the **original** live app with results identical to before the upgrade (4/4). Upgraded data survives the emergency rollback build unchanged (4/4). |
| 5 | Deployment checklist and recovery procedure | ✅ | This document, §5–§8 |
| 6 | D3 / D9 / D10 assessed as release blockers | ✅ | §4: none blocking |
| — | Regression suite | ✅ | 54 passed, 0 failed after the redesign (`evidence/redesign-tests.txt`); 76/76 UI snapshots stable |
| — | Redesign changed nothing in the engine | ✅ | `evidence/redesign-engine-fingerprint.txt`: 106/106 unchanged |
| — | Accessibility (overflow, touch targets, WCAG AA contrast; light+dark; 320/360/390/1280px) | ✅ | `evidence/redesign-ui-audit.txt`: 0 issues |
| — | **Owner's explicit approval to deploy** | ⏳ **Owner** | Must be a clear message, e.g. "Deploy Release 1" |

## 2. What changes for users (plain language)
- On first opening, their data upgrades automatically **on their own phone**. An untouched copy is kept on the device.
- **Their total goes up by the money they had saved towards goals.** The old app wrongly counted savings as spending.
- Their spending figures go down by savings and debt repayments. Neither is spending.
- **Accounts** appear (M-Pesa, Cash, Bank, …). Older entries are placed by payment method, so some accounts may show below zero until the user taps **Reconcile**. A banner explains this.
- **The app looks new:** calmer colours, clearer screens, a bottom bar on phones. Nothing they could do before is removed.
- Their **PIN keeps working**. It is now stored in a protected form and never put in backups.
- A backup reminder appears until they download a backup.

## 3. Owner preview review (phone, about 20 minutes)
The preview is **https://deploy-preview-1--pesa-pilot.netlify.app**. It is a separate address with its own empty storage, so **nothing you do there touches the live app or anyone's data**.

1. Open the preview. Complete the welcome screen with any name and a test PIN, e.g. 1234.
2. **Load the demo data.**
   - Download https://raw.githubusercontent.com/mdenistone-netizen/Pesa-Pilot/claude/pesapilot-master-handover-0z1xae/docs/demo/pesapilot-demo-schema9.json. In the browser menu choose Download, or long-press → Download link.
   - In the preview: Settings (under **More** on a phone) → **Import backup** → choose that file.
   - This is made-up data in the *old* format, so importing it also exercises the upgrade.
3. **Check, and note anything confusing:**
   - **Home:** total, the "set aside for goals" line, safe to spend, and the backup reminder.
   - **First impressions of the new design:** is it clear what each screen shows, with no explanation needed? Try the bottom bar and **More**.
   - **Money:** account cards. Reconcile *Cash* to an amount you choose. Then reverse that adjustment and see that both entries remain.
   - **Transfer:** move money M-Pesa → a new "M-Shwari" account (Money → ＋ Account, type Savings).
   - **Goals:** Set aside → Move money (to M-Shwari) → Use / release. Try to set aside more than is available; it must refuse.
   - **Plan:** Edit plan → "Irregularly", 1 week, buffer 1,000. Read the breakdown. Add an expected income and mark it Received.
   - **Debts:** "Loan from Otieno" shows "No repayment plan". Record a Fuliza repayment.
   - **Settings:** change the PIN. Close the browser, reopen, and unlock with the new PIN. Download a backup and see the reminder disappear.
4. Tell me what felt wrong, unclear or slow. Nothing is too small.

## 4. Release-blocker assessment of open defects

| ID | Issue | Risk to data or trust in Release 1 | Verdict |
|---|---|---|---|
| D3 | No "money owed to me" | Missing feature. Users can't track lending yet; the workaround is a note. No effect on existing records. | **Not blocking.** Phase 3 |
| D9 | No PWA manifest / service worker | "Install app" doesn't work and offline loading isn't supported. Data is unaffected. Adding a service worker later needs a careful update strategy so users don't get stuck on old versions. | **Not blocking.** Phase 4, with its own decision |
| D10 | Dates use the phone's timezone | Tested: the upgrade gives identical records in Nairobi, New York and Kolkata timezones. Only "today" follows the phone's clock, which is correct for a phone set to Kenyan time. | **Not blocking** |
| R1 | **New:** the app open in two tabs during the upgrade | An old-version tab could save over new data. The new version reloads when another tab saves (tested). The *old* version can't be changed, so a tab left open from before deployment is a small residual risk. | **Mitigated.** Deploy at a quiet hour (§6) |
| R2 | **New:** redeploying the original build after release | The original loader converts unknown entries to expenses and drops accounts. **Proven destructive** for upgraded data. | **Never redeploy `8e33d44`.** Use §8 instead |
| R3 | Browser serving an old cached page | Netlify normally tells browsers to recheck HTML on every load (`max-age=0, must-revalidate`), so a reload gets the new version. To be confirmed after deployment (§7). | Low |
| R4 | **New (26 Nov): Release 1 displays cancelled expected payments.** Release 1 knows only "received" and "not received". If it ever runs against data from a future schema 11 version (an old tab left open, or a rollback to Release 1), a payment cancelled in schema 11 **appears in Release 1's expected-income list (Plan) and in Home's "If expected income arrives" line**. Tested: `prototypes/schema11/e2e-release1.js`, step 3. | **No effect on available money:** expected income is never counted in Left to spend or safe to spend. Display only, and temporary: the cancellation is restored from `cancelledAt` when the newer version reopens. Release 1 itself creates no cancelled payments, so this can't happen until schema 11 exists. | **Accepted for Release 1 (display only).** Mitigations at schema 11: D13 released first; schema 11 backups refused by Release 1; `cancelledAt` as the source of truth; never roll back to Release 1 after schema 11; the cancellation test re-run against the real DB-5 code before that release |

## 5. Pre-deployment steps (Claude, on the day)
- [ ] Work branch up to date. `npm test` passes in full (regression + migration). UI snapshot stable.
- [ ] Preview rebuilt from the exact commit being released, and its status is "Deploy Preview ready".
- [ ] Record the release commit hash here: `________`.
- [ ] Confirm `main` is still `8e33d44`, so nothing slipped in.
- [ ] **Decide how to keep `docs/` (research, prototypes, demo data) off the live site.** Netlify publishes the whole repository. Options: a Netlify rule that blocks `/docs/*`, or publishing only the app files. It's an infrastructure-config change, so it gets its own small approval before the merge.
- [ ] Owner has completed §3 and **explicitly approved**.

## 6. Deployment steps
1. Choose a quiet time (late evening EAT). Owner and Claude are both available for an hour afterwards.
2. Owner: download a backup from the **live** app on your own phone first (Settings → Download backup), as a personal safety copy.
3. Claude:
   - updates PR #1's title and description to "Release 1";
   - marks it ready;
   - merges it into `main` (squash or merge commit, no force-push).
   - Netlify then deploys automatically. Alternatively the owner taps **Merge** in GitHub after Claude prepares it.
4. Claude confirms the Netlify production deploy succeeded (GitHub status on the merge commit).

## 7. Post-deployment verification (first hour)
- [ ] Owner opens https://pesa-pilot.netlify.app on their phone. The new version loads (you see "Accounts" on the Money screen), your PIN still unlocks, and your records are present.
- [ ] Your total = old total + goal savings, and your goals and debts show the same amounts as before.
- [ ] Settings shows **Download pre-accounts copy**. Download it once and keep it.
- [ ] Download a normal backup. The reminder disappears.
- [ ] No error messages. Claude reviews any issue you report immediately.

## 8. Recovery procedure

**A. A display or usability bug, data correct** (most likely)
- Fix forward on the branch, test, preview, approve, deploy.
- Users' data needs no action.

**B. A serious bug: the app must be taken back quickly**
- **Do not** redeploy the original version (R2).
- Deploy the **safe rollback build**, commit `8370097` (Phase 0.5). It looks like the old app and is proven to keep upgraded data intact (accounts, allocations, transfers and adjustments survive unchanged and reappear when Release 1 is redeployed).
  - In GitHub, create a branch from `8370097` and open a PR to `main`. Claude prepares it; the owner approves the merge.
- **Known effects of the rollback build:**
  - Totals are shown with the old rules.
  - The PIN lock is off: it doesn't read protected PINs. Users can set a temporary PIN.
- Then fix forward and redeploy.

**C. A user's data looks wrong after the upgrade**
1. The user downloads a backup immediately (Settings).
2. The user downloads the **pre-accounts copy**: the untouched pre-upgrade data, without PIN.
3. Claude investigates using made-up data that reproduces the problem. Real files are never committed, because the repo is public.
4. If needed, the user imports the pre-accounts copy into a fixed version.

**D. A user loses their phone or browser data**
- See `DATA_RECOVERY.md`: restore from their latest backup file.
- There is no server copy. This is why the backup reminder exists.
