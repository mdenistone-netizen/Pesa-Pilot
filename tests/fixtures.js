// Realistic seed data in the exact shape schema 9 writes today.
// Clock in tests is fixed at 2026-11-25 (see harness.js).
function baseState(overrides = {}) {
  return {
    schemaVersion: 9,
    profile: { name: "Wanjiku", avatar: "WA", paydayDay: 28, monthlyIncome: 45000, plannedExpenses: 0, emergencyFundMonths: 3, theme: "light", currency: "KSh" },
    transactions: [], goals: [], bills: [], debts: [],
    categories: ["Food", "Transport", "Housing", "Utilities", "Health", "Shopping", "Entertainment", "Family", "Education", "Other"].map(n => ({ id: n.toLowerCase(), name: n })),
    budgets: { monthlySpending: 0, categoryBudgets: {} },
    nextId: 100, pin: "", deviceId: "test-device", deviceFingerprint: "test",
    ...overrides
  };
}

const tx = (id, type, amount, category, date, extra = {}) => ({
  id, type, amount, category, date, notes: "", description: "", paymentMethod: "M-Pesa", reference: "",
  createdAt: "2026-11-01T08:00:00.000Z", updatedAt: "2026-11-01T08:00:00.000Z", ...extra
});

/** A month with income, spending, a goal contribution, a paid bill and a debt repayment. */
function realisticMonth() {
  return baseState({
    transactions: [
      tx(1, "income", 45000, "Income", "2026-11-01", { description: "November salary" }),
      tx(2, "income", 8000, "Income", "2026-11-12", { description: "Freelance design job" }),
      tx(3, "expense", 6500, "Food", "2026-11-03", { paymentMethod: "Cash" }),
      tx(4, "expense", 2400, "Transport", "2026-11-05"),
      tx(5, "expense", 3000, "Savings", "2026-11-06", { category: "Savings", paymentMethod: "Other", reference: "goal:20:21", description: "Contribution to Emergency fund", notes: "Contribution to Emergency fund" }),
      tx(6, "expense", 15000, "Housing", "2026-11-05", { reference: "bill:30:2026-11-05:31", description: "Rent payment", notes: "Rent payment" }),
      tx(7, "expense", 2000, "Debt repayment", "2026-11-10", { paymentMethod: "Other", reference: "debt:40:41", description: "Repayment of Fuliza", notes: "Repayment of Fuliza" }),
      tx(8, "expense", 1200, "Food", "2026-10-28", { paymentMethod: "Cash" })
    ],
    goals: [{ id: 20, name: "Emergency fund", target: 50000, current: 3000, targetDate: "2027-06-30", requiredMonthly: 0, requiredWeekly: 0, contributions: [{ id: 21, amount: 3000, date: "2026-11-06", note: "" }] }],
    bills: [{ id: 30, name: "Rent", amount: 15000, dueDate: "2026-09-05", frequency: "monthly", paid: false, paidDate: "", paidOccurrence: "", category: "Housing", notes: "", recordAsExpense: true,
      paidOccurrences: ["2026-11-05"], payments: [{ id: 31, occurrenceDate: "2026-11-05", paymentDate: "2026-11-05", amount: 15000, paymentMethod: "M-Pesa" }] },
      { id: 32, name: "KPLC tokens", amount: 1500, dueDate: "2026-09-27", frequency: "monthly", paid: false, paidDate: "", paidOccurrence: "", category: "Utilities", notes: "", recordAsExpense: true, paidOccurrences: [], payments: [] }],
    debts: [{ id: 40, name: "Fuliza", creditor: "Safaricom", total: 5000, repaid: 2000, interestRate: 0, dueDate: "2026-12-15", notes: "", repaymentAmount: 1000, repayments: [{ id: 41, amount: 2000, date: "2026-11-10", note: "" }] }],
    budgets: { monthlySpending: 30000, categoryBudgets: { Food: 8000 } },
    nextId: 100
  });
}

module.exports = { baseState, tx, realisticMonth };
