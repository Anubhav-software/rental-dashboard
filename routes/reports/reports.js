const express = require("express");
const router = express.Router();

/** Default range for reports: start of current year to today ("all data" / YTD). */
function parseProfitDateRange(req) {
  const from = (req.query.from || "").trim();
  const to = (req.query.to || "").trim();
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
  const defaultTo = now.toISOString().slice(0, 10);
  return {
    from: from || defaultFrom,
    to: to || defaultTo,
  };
}

// Revenue report — client-driven: default "all data" (start of year to today); script fetches real summary + rentals list.
router.get("/revenue", (req, res) => {
  const { from, to } = parseProfitDateRange(req);
  res.render("reports/revenue-report", {
    title: "Reports",
    subTitle: "Revenue Report",
    from,
    to,
    total: 0,
    rentals: [],
    currencySymbol: "₹",
    script: "<script src='/js/api/analyticsApi.js'></script><script src='/js/api/rentalApi.js'></script><script src='/js/pages/revenue-report.js'></script>",
  });
});

// Expense report — client-driven: default "all data" (start of year to today); script fetches real summary + expenses list.
router.get("/expense", (req, res) => {
  const { from, to } = parseProfitDateRange(req);
  res.render("reports/expense-report", {
    title: "Reports",
    subTitle: "Expense Report",
    from,
    to,
    total: 0,
    expenses: [],
    currencySymbol: "₹",
    script: "<script src='/js/api/analyticsApi.js'></script><script src='/js/api/expenseApi.js'></script><script src='/js/pages/expense-report.js'></script>",
  });
});

// Profit report — client-driven: default "all data" (start of year to today); script fetches real analytics.
router.get("/profit", (req, res) => {
  const { from, to } = parseProfitDateRange(req);
  res.render("reports/profit-report", {
    title: "Reports",
    subTitle: "Profit Report",
    from,
    to,
    revenue: 0,
    expenses: 0,
    profit: 0,
    currencySymbol: "₹",
    script: "<script src='/js/api/analyticsApi.js'></script><script src='/js/pages/profit-report.js'></script>",
  });
});

// Reports index (redirect to profit)
router.get("/", (req, res) => {
  res.redirect((req.baseUrl || "") + "/reports/profit");
});

module.exports = router;
