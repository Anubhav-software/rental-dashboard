const express = require("express");
const router = express.Router();

const basePath = (req) => (req.app.locals && req.app.locals.basePath) || (req.baseUrl && req.baseUrl.split("/").slice(0, 2).join("/")) || "/owner";

// Redirect /expense to /expense/list
router.get("/", (req, res) => {
  const base = (res.locals.basePath || basePath(req)).replace(/\/$/, "") || "/owner";
  return res.redirect(base + "/expense/list");
});

// List expenses (API-driven; client loads via expenseApi.list)
router.get("/list", (req, res) => {
  const query = {
    status: (req.query.status || "").trim(),
    category: (req.query.category || "").trim(),
    expense_date_from: (req.query.expense_date_from || "").trim(),
    expense_date_to: (req.query.expense_date_to || "").trim(),
    page: Math.max(1, parseInt(req.query.page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20)),
  };
  res.render("expense/list", {
    title: "Expenses",
    subTitle: "Expense List",
    query,
    basePath: res.locals.basePath || "",
  });
});

// Add expense form (API-driven; client submits via expenseApi.create)
router.get("/add", (req, res) => {
  res.render("expense/add", {
    title: "Expenses",
    subTitle: "Add Expense",
    basePath: res.locals.basePath || "",
  });
});

// View expense (API-driven; client loads via expenseApi.getById)
router.get("/view/:id", (req, res) => {
  res.render("expense/view", {
    title: "Expenses",
    subTitle: "Expense Details",
    expenseId: req.params.id,
    basePath: res.locals.basePath || "",
  });
});

// Edit expense (API-driven; client loads via expenseApi.getById, submit via expenseApi.update; only when not APPROVED)
router.get("/edit/:id", (req, res) => {
  res.render("expense/edit", {
    title: "Expenses",
    subTitle: "Edit Expense",
    expenseId: req.params.id,
    basePath: res.locals.basePath || "",
  });
});

// Backward compatibility: reports/dashboard may use router.demoExpenses
router.demoExpenses = [];
module.exports = router;
