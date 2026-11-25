// Builds docs/demo/pesapilot-demo-schema9.json: made-up, realistic data in the format the
// LIVE app exports today (schema 9), for reviewing the preview on a phone. Importing it in
// the preview also exercises the upgrade to schema 10. No real user data.
const fs = require("fs"), path = require("path");
const { baseState, tx } = require("./fixtures");
let x = 7; const r = () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296);
const s = baseState({ pin: "", nextId: 1 });
delete s.pin; delete s.deviceId; delete s.deviceFingerprint;
s.profile = { ...s.profile, name: "Demo · Achieng", avatar: "AC", paydayDay: 28, monthlyIncome: 48000 };
s.categories.push({ id: "airtime", name: "Airtime" }, { id: "chama", name: "Chama" });
s.budgets = { monthlySpending: 32000, categoryBudgets: { Food: 9000, Transport: 5000, Airtime: 800 } };
let id = 1;
const day = (m, d) => `2026-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const spend = [["Food", 120, 700, ["Lunch", "Sokoni", "Unga & sukari", "Chips mayai"]], ["Transport", 80, 400, ["Matatu", "Boda", "Fare to town"]], ["Airtime", 50, 250, ["Data bundles", "Airtime"]], ["Shopping", 300, 1500, ["Naivas", "Shoes"]], ["Family", 500, 1500, ["Sent to mum"]], ["Entertainment", 200, 800, ["Movie", "Outing"]]];
for (const m of [9, 10, 11]) {
  s.transactions.push(tx(id++, "income", 48000, "Income", day(m - 1, 28), { paymentMethod: "M-Pesa", notes: "Salary" }));   // paid on the 28th of the previous month
  s.transactions.push(tx(id++, "income", Math.round(r() * 6000 + 2000), "Income", day(m, 12), { paymentMethod: "M-Pesa", notes: "Freelance design job" }));
  const lastDay = m === 11 ? 24 : 28;
  for (let k = 0; k < 28; k++) {
    const [cat, lo, hi, notes] = spend[Math.floor(r() * spend.length)];
    s.transactions.push(tx(id++, "expense", Math.round(r() * (hi - lo) + lo), cat, day(m, 1 + Math.floor(r() * lastDay)), { paymentMethod: r() < 0.7 ? "M-Pesa" : "Cash", notes: notes[Math.floor(r() * notes.length)] }));
  }
}
const goal = { id: id++, name: "Emergency fund", target: 60000, current: 0, targetDate: "2027-06-30", requiredMonthly: 4000, requiredWeekly: 0, contributions: [] };
for (const m of [9, 10, 11]) { const cid = id++; goal.contributions.push({ id: cid, amount: 4000, date: day(m, 2), note: "" }); goal.current += 4000; s.transactions.push(tx(id++, "expense", 4000, "Savings", day(m, 2), { paymentMethod: "Other", reference: `goal:${goal.id}:${cid}`, notes: "Contribution to Emergency fund" })); }
s.goals.push(goal, { id: id++, name: "New phone", target: 25000, current: 3000, targetDate: "2027-02-28", requiredMonthly: 0, requiredWeekly: 0, contributions: [] });
const rent = { id: id++, name: "Rent", amount: 14000, dueDate: "2026-09-05", frequency: "monthly", paid: false, paidDate: "", paidOccurrence: "", category: "Housing", notes: "", recordAsExpense: true, paidOccurrences: [], payments: [] };
for (const m of [9, 10, 11]) { const occ = day(m, 5), pid = id++; rent.payments.push({ id: pid, occurrenceDate: occ, paymentDate: occ, amount: 14000, paymentMethod: "M-Pesa" }); rent.paidOccurrences.push(occ); s.transactions.push(tx(id++, "expense", 14000, "Housing", occ, { reference: `bill:${rent.id}:${occ}:${pid}`, notes: "Rent payment" })); }
s.bills.push(rent,
  { id: id++, name: "KPLC tokens", amount: 1500, dueDate: "2026-09-27", frequency: "monthly", paid: false, paidDate: "", paidOccurrence: "", category: "Utilities", notes: "", recordAsExpense: true, paidOccurrences: ["2026-09-27", "2026-10-27"], payments: [] },
  { id: id++, name: "Home internet", amount: 2999, dueDate: "2026-09-30", frequency: "monthly", paid: false, paidDate: "", paidOccurrence: "", category: "Utilities", notes: "", recordAsExpense: true, paidOccurrences: ["2026-09-30", "2026-10-30"], payments: [] });
const loan = { id: id++, name: "Fuliza", creditor: "Safaricom", total: 3500, repaid: 0, interestRate: 0, dueDate: "2026-12-15", notes: "", repaymentAmount: 1000, repayments: [] };
for (const m of [10, 11]) { const rid = id++; loan.repayments.push({ id: rid, amount: 1000, date: day(m, 15), note: "" }); loan.repaid += 1000; s.transactions.push(tx(id++, "expense", 1000, "Debt repayment", day(m, 15), { paymentMethod: "Other", reference: `debt:${loan.id}:${rid}`, notes: "Repayment of Fuliza" })); }
s.debts.push(loan, { id: id++, name: "Loan from Otieno", creditor: "Otieno", total: 5000, repaid: 0, interestRate: 0, dueDate: "", notes: "", repaymentAmount: 0, repayments: [] });
s.nextId = id;
const out = { app: "PesaPilot", backupVersion: 3, schemaVersion: 9, exportedAt: "2026-11-25T07:00:00.000Z", data: s };
const file = path.join(__dirname, "..", "docs", "demo", "pesapilot-demo-schema9.json");
fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
console.log("wrote", path.relative(process.cwd(), file), s.transactions.length, "entries");
