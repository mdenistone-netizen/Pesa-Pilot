// Representative copies of data that real users may have in the live app (schema 1-9).
// Generated deterministically, never from real user data (the repo is public).
const { baseState, tx } = require("./fixtures");

function rng(seed) { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 4294967296); }
const pick = (r, list) => list[Math.floor(r() * list.length)];
const isoDay = (r, from, days) => { const d = new Date(from + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + Math.floor(r() * days)); return d.toISOString().slice(0, 10); };

// 1. Very early data: no schemaVersion, missing types and fields, no categories.
function earliest() {
  return {
    profile: { name: "Mwangi" },
    transactions: [
      { id: 1, type: "income", amount: 12000, category: "Salary", date: "2025-03-01" },
      { id: 2, amount: 350, category: "Food", date: "2025-03-02" },                // no type -> expense
      { id: 3, type: "expense", amount: "1200", category: "Transport", date: "2025-03-03", paymentMethod: "Cash" },
      { id: 4, type: "income", amount: 800, date: "2025-03-05" }                   // no category or method
    ],
    goals: [{ id: 5, name: "Phone", target: 15000, current: 2000 }],              // typed current, no contributions
    bills: [{ id: 6, name: "Rent", amount: 6000, dueDate: "2025-03-05", paid: true, paidDate: "2025-03-04" }],
    debts: [{ id: 7, name: "Okoa Jahazi", total: 500, repaid: 200 }],             // repaid with no repayment records
    nextId: 8
  };
}

// 2. Mid-life schema 5 data with legacy bill and debt shapes.
function schema5() {
  return {
    schemaVersion: 5,
    profile: { name: "Akinyi", paydayDay: 25, monthlyIncome: 38000, plannedExpenses: 1500, currency: "KSh", theme: "dark" },
    transactions: [
      tx(1, "income", 38000, "Income", "2026-06-25", { paymentMethod: "Bank" }),
      tx(2, "expense", 4500.5, "Food", "2026-06-26", { paymentMethod: "M-Pesa", notes: "Sokoni — mboga na matunda 🥬" }),
      tx(3, "expense", 2000, "Savings", "2026-06-27", { paymentMethod: "Other", reference: "goal:10:11" }),
      tx(4, "expense", 1000, "Debt repayment", "2026-06-28", { paymentMethod: "Other", reference: "debt:20:21" }),
      tx(5, "expense", 900, "Utilities", "2026-06-30", { paymentMethod: "Card", reference: "bill:30:2026-06-30:legacy" })
    ],
    goals: [{ id: 10, name: "School fees", target: 30000, current: 2500, contributions: [{ id: 11, amount: 2000, date: "2026-06-27" }] }],
    debts: [{ id: 20, name: "M-Shwari loan", creditor: "Safaricom", total: 6000, repaid: 1800, repayments: [{ id: 21, amount: 1000, date: "2026-06-28" }] }],
    bills: [
      { id: 30, name: "KPLC", amount: 900, dueDate: "2026-06-30", frequency: "monthly", paid: true, paidDate: "2026-06-30", paidOccurrence: "2026-06-30" },
      { id: 31, name: "Insurance", amount: 12000, dueDate: "2026-01-15", frequency: "yearly", paid: false }
    ],
    categories: ["Food", "Transport", "Chama"],
    budgets: { monthlySpending: 25000, categoryBudgets: { Food: 9000, Chama: 2000 } },
    pin: "1357",
    nextId: 40
  };
}

// 3. Heavy, long-running schema 9 user: 14 months, ~1,500 entries, every feature used.
function heavySchema9() {
  const r = rng(20261125);
  const s = baseState({ pin: "8642", nextId: 1 });
  s.profile.name = "Njeri Wambui";
  s.categories.push({ id: "chama", name: "Chama" }, { id: "airtime", name: "Airtime" });
  s.budgets = { monthlySpending: 40000, categoryBudgets: { Food: 12000, Transport: 6000, Airtime: 1000 } };
  let id = 1;
  const methods = ["M-Pesa", "M-Pesa", "M-Pesa", "Cash", "Cash", "Bank", "Card", "Other"];
  const cats = ["Food", "Transport", "Housing", "Utilities", "Health", "Shopping", "Entertainment", "Family", "Education", "Chama", "Airtime", "Other"];
  for (let m = 0; m < 14; m++) {
    const month = new Date(Date.UTC(2025, 9 + m, 1)).toISOString().slice(0, 7);
    s.transactions.push(tx(id++, "income", 52000, "Income", `${month}-28`, { paymentMethod: "Bank", description: "Salary" }));
    for (let k = 0; k < 3; k++) s.transactions.push(tx(id++, "income", Math.round(r() * 9000 + 500), "Income", isoDay(r, `${month}-01`, 27), { paymentMethod: pick(r, ["M-Pesa", "Cash"]), notes: "Side hustle" }));
    for (let k = 0; k < 100; k++) s.transactions.push(tx(id++, "expense", Math.round((r() * 700 + 20) * 100) / 100, pick(r, cats), isoDay(r, `${month}-01`, 28), { paymentMethod: pick(r, methods), notes: pick(r, ["", "Lunch", "Fare to town", "Unga & sukari", "Data bundles", "Matatu"]) }));
  }
  const goals = [["Emergency fund", 100000], ["Land deposit", 300000], ["Christmas", 20000]];
  goals.forEach(([name, target]) => {
    const goal = { id: id++, name, target, current: 0, targetDate: "2027-12-31", requiredMonthly: 3000, requiredWeekly: 0, contributions: [] };
    for (let k = 0; k < 6; k++) {
      const cid = id++, amount = Math.round(r() * 4000 + 500), date = isoDay(r, "2026-01-01", 300);
      goal.contributions.push({ id: cid, amount, date, note: "" });
      goal.current += amount;
      s.transactions.push(tx(id++, "expense", amount, "Savings", date, { paymentMethod: "Other", reference: `goal:${goal.id}:${cid}`, notes: `Contribution to ${name}` }));
    }
    goal.current += 1000; // a manual edit on top of the contributions
    s.goals.push(goal);
  });
  const debt = { id: id++, name: "Bank loan", creditor: "KCB", total: 80000, repaid: 0, interestRate: 13, dueDate: "2027-06-30", notes: "", repaymentAmount: 5000, repayments: [] };
  for (let k = 0; k < 10; k++) {
    const rid = id++, date = isoDay(r, "2026-01-01", 300);
    debt.repayments.push({ id: rid, amount: 5000, date, note: "" }); debt.repaid += 5000;
    s.transactions.push(tx(id++, "expense", 5000, "Debt repayment", date, { paymentMethod: "Other", reference: `debt:${debt.id}:${rid}` }));
  }
  debt.repaid += 3000; // "already repaid" before tracking
  s.debts.push(debt, { id: id++, name: "Fuliza", creditor: "Safaricom", total: 2500, repaid: 2500, interestRate: 0, dueDate: "", notes: "", repaymentAmount: 0, repayments: [] });
  const rent = { id: id++, name: "Rent", amount: 18000, dueDate: "2025-10-05", frequency: "monthly", paid: false, paidDate: "", paidOccurrence: "", category: "Housing", notes: "", recordAsExpense: true, paidOccurrences: [], payments: [] };
  for (let m = 0; m < 13; m++) {
    const occ = new Date(Date.UTC(2025, 9 + m, 5)).toISOString().slice(0, 10), pid = id++;
    if (m === 7) { // paid in two instalments
      const p2 = id++;
      rent.payments.push({ id: pid, occurrenceDate: occ, paymentDate: occ, amount: 10000, paymentMethod: "M-Pesa" }, { id: p2, occurrenceDate: occ, paymentDate: occ, amount: 8000, paymentMethod: "Bank" });
      s.transactions.push(tx(id++, "expense", 10000, "Housing", occ, { reference: `bill:${rent.id}:${occ}:${pid}` }), tx(id++, "expense", 8000, "Housing", occ, { paymentMethod: "Bank", reference: `bill:${rent.id}:${occ}:${p2}` }));
    } else {
      rent.payments.push({ id: pid, occurrenceDate: occ, paymentDate: occ, amount: 18000, paymentMethod: "M-Pesa" });
      s.transactions.push(tx(id++, "expense", 18000, "Housing", occ, { reference: `bill:${rent.id}:${occ}:${pid}` }));
    }
    rent.paidOccurrences.push(occ);
  }
  s.bills.push(rent,
    { id: id++, name: "Netflix", amount: 1100, dueDate: "2026-01-12", frequency: "monthly", paid: false, paidDate: "", paidOccurrence: "", category: "Entertainment", notes: "", recordAsExpense: false, paidOccurrences: ["2026-10-12"], payments: [] },
    { id: id++, name: "Car insurance", amount: 24000, dueDate: "2026-03-01", frequency: "yearly", paid: false, paidDate: "", paidOccurrence: "", category: "Other", notes: "", recordAsExpense: true, paidOccurrences: [], payments: [] },
    { id: id++, name: "Water", amount: 450, dueDate: "2026-09-02", frequency: "weekly", paid: false, paidDate: "", paidOccurrence: "", category: "Utilities", notes: "", recordAsExpense: true, paidOccurrences: [], payments: [] },
    { id: id++, name: "Dentist", amount: 3500, dueDate: "2026-12-10", frequency: "once", paid: false, paidDate: "", paidOccurrence: "", category: "Health", notes: "", recordAsExpense: true, paidOccurrences: [], payments: [] });
  s.nextId = id;
  return s;
}

// 4. Awkward values a long-lived local app accumulates.
function messy() {
  return {
    schemaVersion: 8,
    profile: { name: "Test <b>User</b>", paydayDay: 31, currency: "XYZ" },
    transactions: [
      tx(1, "income", 1000.1, "Income", "2026-02-28"),
      tx(2, "expense", 0.2, "Food", "2026-02-28"),
      tx(3, "expense", -50, "Food", "2026-02-28"),                                  // negative -> 0
      tx(4, "expense", 100, "Unknown category", "2026-02-29"),                      // invalid date kept as typed
      tx(5, "expense", 300, "Savings", "2026-03-01", { reference: "goal:999:1" }),   // goal no longer exists
      tx(6, "expense", 250, "Debt repayment", "2026-03-02", { reference: "debt:888:1" }) // debt no longer exists
    ],
    goals: [{ id: 10, name: "Overfunded", target: 100, current: 500, contributions: [] }],
    bills: [], debts: [], nextId: 11
  };
}

module.exports = { corpus: { earliest, schema5, heavySchema9, messy } };
