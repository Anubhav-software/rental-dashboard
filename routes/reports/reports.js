const express = require("express");
const router = express.Router();

const rentalRouter = require("../rental/rental");
const expenseRouter = require("../expense/expense");

const demoRentals = rentalRouter.demoRentals;
const demoExpenses = expenseRouter.demoExpenses;

function parseDateRange(req) {
  const from = (req.query.from || "").trim();
  const to = (req.query.to || "").trim();
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const defaultTo = now.toISOString().slice(0, 10);
  return {
    from: from || defaultFrom,
    to: to || defaultTo,
  };
}

function revenueInRange(from, to) {
  return demoRentals
    .filter((r) => r.status !== "CANCELLED" && r.totalAmount != null && r.startDate >= from && r.startDate <= to)
    .reduce((sum, r) => sum + Number(r.totalAmount), 0);
}

function expensesInRange(from, to) {
  return demoExpenses
    .filter((e) => (e.status === "PAID" || e.status === "APPROVED") && e.expenseDate >= from && e.expenseDate <= to)
    .reduce((sum, e) => sum + Number(e.amount), 0);
}

// Revenue report
router.get("/revenue", (req, res) => {
  const { from, to } = parseDateRange(req);
  const total = revenueInRange(from, to);
  const rentalsInRange = demoRentals.filter((r) => r.status !== "CANCELLED" && r.startDate >= from && r.startDate <= to);
  res.render("reports/revenue-report", {
    title: "Reports",
    subTitle: "Revenue Report",
    from,
    to,
    total,
    rentals: rentalsInRange,
    currencySymbol: "₹",
  });
});

// Expense report
router.get("/expense", (req, res) => {
  const { from, to } = parseDateRange(req);
  const total = expensesInRange(from, to);
  const expensesInRangeList = demoExpenses.filter((e) => (e.status === "PAID" || e.status === "APPROVED") && e.expenseDate >= from && e.expenseDate <= to);
  res.render("reports/expense-report", {
    title: "Reports",
    subTitle: "Expense Report",
    from,
    to,
    total,
    expenses: expensesInRangeList,
    currencySymbol: "₹",
  });
});

// Profit report
router.get("/profit", (req, res) => {
  const { from, to } = parseDateRange(req);
  const revenue = revenueInRange(from, to);
  const expenses = expensesInRange(from, to);
  const profit = revenue - expenses;
  res.render("reports/profit-report", {
    title: "Reports",
    subTitle: "Profit Report",
    from,
    to,
    revenue,
    expenses,
    profit,
    currencySymbol: "₹",
  });
});

// Reports index (redirect to profit)
router.get("/", (req, res) => {
  res.redirect((req.baseUrl || "") + "/reports/profit");
});

module.exports = router;
