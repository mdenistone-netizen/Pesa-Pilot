# D13 · Fix Proposal: never downgrade data saved by a newer version

**Status:** **proposal only, not implemented.** It needs the owner's approval before any code is written. Discovered and tested during P6 (DB-6 §3.4).

## 1. The defect, in plain language
- Each version of PesaPilot labels the stored data with its "schema version" (today: **10**).
- **Tested on 25 Nov 2026:** when today's version opens data saved by a *newer* version (labelled 11, with a new field and a new kind of entry), it **keeps everything safely**. Good: DEC-004 works. But as soon as the user saves anything, it **re-labels the data as version 10**.
- **Why that matters:** the next time the newer version opens that data, it thinks the data is old and **re-runs its upgrade** on data that was already upgraded. Upgrades are designed to be repeatable (DEC-004), but relying on that is fragile. Each future upgrade would have to be perfectly safe to run twice, and we'd lose the reliable record of which version last wrote the data.

**When could this happen?**
- **Only after a future version changes the schema** (for example version 11 in a later release), *and* an older copy of the app is still running somewhere.
- Today that's only possible through a browser tab left open from before an update. The cross-tab reload added in CR-004 already reduces even that.
- **It becomes much more likely once the app is installable and works offline (DB-6),** because phones keep a cached copy of the app.

**Effect on Release 1:** **none.** No newer version exists yet.

## 2. Proposed fix (scope)
Two small changes in the storage layer, plus a clear message.

| # | Change | Where | Behaviour |
|---|---|---|---|
| 1 | **Detect newer data on load** | `loadState()` | If the stored `schemaVersion` is **higher** than this app's `SCHEMA_VERSION`: load and display the data as today (unknown fields are preserved), but switch on the existing **read-only** protection (`storageReadOnly = true`) and show a notice. |
| 2 | **Never lower the label** | `migrate()` | Set `schemaVersion` to the **higher** of the stored value and this app's version, instead of always this app's version. |
| 3 | **Clear message** | Existing app notice | "This data was saved by a newer version of PesaPilot. To protect your records, changes are paused. Please reload the page (or update the app) to continue." |

**What read-only already does today (reused, not new):**
- `persist()` refuses to save when `storageReadOnly` is on.
- Restore, import and reset paths already respect it.

**Explicitly out of scope:**
- No change to financial rules, balances, classification or calculations.
- No change to migrations for older data (schema 1–9), which keep upgrading exactly as today.
- No service worker or PWA work (that is DB-6).

## 3. Edge cases
- **Importing a newer backup file:** already refused today, because the backup version is checked ("This backup was created by a newer version of PesaPilot."). No change.
- **A user stuck offline on an old cached app (after DB-6):** they can view their data but not change it until they update, with a clear reason why. The data is never altered.
- **Equal version (normal case):** no change in behaviour.
- **Data that can't be read:** unchanged (the existing read-only notice and recovery options).

## 4. Tests (to be written with the fix)
1. Data labelled schema 11 with an unknown field and an unknown entry type:
   - it loads without errors, and **figures still display**;
   - the app is **read-only**: adding an expense doesn't change storage;
   - the stored label stays **11**;
   - the unknown field and entry are intact.
2. The notice text is shown.
3. Normal schema 10 data: saving works and the label stays 10 (regression).
4. Schema 1–9 data: upgrades exactly as today (the existing migration suite: 4 representative data sets plus rollback).
5. The full regression suite, the UI audit and the engine fingerprint:
   - **expected changes only to `migrate` and `loadState`**;
   - the baseline re-saved and documented.

## 5. Which release should carry it? (owner choice)
**Key point:** the guard must already be present in the **older** version that meets newer data. To protect users when schema 11 arrives, the guard should be live **before** (or at the latest together with) the first schema change.

| Option | Pros | Cons |
|---|---|---|
| **A. Add it to Release 1** (recommended if you're comfortable re-opening the candidate) | Every user gets the guard from the start; maximum protection for all future releases | Re-opens a frozen release: re-run all tests and re-check the preview. Small but non-zero risk. |
| **B. A small standalone release right after Release 1** (recommended default) | Release 1 stays frozen; the guard is live long before any schema 11 work | One more (tiny) deployment and approval cycle |
| **C. Bundle it with the PWA (Stage C)** | Fewer releases | Leaves a gap if any schema change happens first; ties a safety fix to a bigger change |

**Recommendation:** **B.** Keep Release 1 frozen, and ship D13 as its own small, fully tested release before any feature that changes the schema, and before the PWA. If you prefer maximum protection and accept re-testing the candidate, A is also sound.

## 6. Cost and risk
- **Size:** about 10–15 lines of code in two functions, plus tests.
- **Risk:** low.
  - It reuses the existing read-only mechanism.
  - The main risk is a false "newer data" detection. It can only trigger when the stored number is strictly higher than the app's, which never happens in normal use.
- **Reversible:** yes (revert the commit). No stored data format changes.

## 7. Decision needed
1. **Approve the fix as scoped** in §2 (yes / no / changes).
2. **Choose the release vehicle:** A, B or C (§5).
