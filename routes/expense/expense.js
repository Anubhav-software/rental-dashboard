const express = require("express");
const router = express.Router();

const vehicleRouter = require("../vehicle/vehicle");
const demoVehicles = vehicleRouter.demoVehicles;

// Demo expenses (in-memory). Schema-aligned with workflow.md expenses table.
const EXPENSE_TYPES = ["FUEL", "MAINTENANCE", "INSURANCE", "SALARY", "RENT", "UTILITIES", "REPAIRS", "VEHICLE_PURCHASE", "SPARE_PARTS", "MARKETING", "OFFICE_SUPPLIES", "LEGAL_FEES", "TAXES", "OTHER"];
const EXPENSE_CATEGORIES = ["VEHICLE_RELATED", "OPERATIONAL", "ADMINISTRATIVE", "STAFF", "OTHER"];
const PAYMENT_METHODS = ["CASH", "BANK_TRANSFER", "CREDIT_CARD", "CHEQUE", "UPI", "OTHER"];
const STATUSES = ["PENDING", "APPROVED", "PAID", "REJECTED"];

const demoExpenses = [
  { id: 1, expenseType: "FUEL", expenseCategory: "VEHICLE_RELATED", amount: 2500, currencyCode: "INR", currencySymbol: "₹", expenseDate: "2025-01-20", vehicleId: 1, rentalId: null, paymentMethod: "CASH", vendorName: "Petrol Pump", vendorContact: null, description: "Fuel refill", receiptNumber: null, status: "PAID", notes: null },
  { id: 2, expenseType: "MAINTENANCE", expenseCategory: "VEHICLE_RELATED", amount: 5000, currencyCode: "INR", currencySymbol: "₹", expenseDate: "2025-01-18", vehicleId: 2, rentalId: null, paymentMethod: "BANK_TRANSFER", vendorName: "Auto Service", vendorContact: null, description: "Oil change and service", receiptNumber: "SRV-001", status: "PAID", notes: null },
  { id: 3, expenseType: "RENT", expenseCategory: "OPERATIONAL", amount: 15000, currencyCode: "INR", currencySymbol: "₹", expenseDate: "2025-01-01", vehicleId: null, rentalId: null, paymentMethod: "BANK_TRANSFER", vendorName: "Landlord", vendorContact: null, description: "Monthly office rent", receiptNumber: null, status: "PAID", notes: null },
];

let nextId = 4;

// List expenses (optional type, status, date range)
router.get("/", (req, res) => {
  let list = [...demoExpenses];
  const typeFilter = (req.query.type || "").trim();
  const statusFilter = (req.query.status || "").trim();
  const fromDate = (req.query.from || "").trim();
  const toDate = (req.query.to || "").trim();

  if (typeFilter) list = list.filter((e) => e.expenseType === typeFilter);
  if (statusFilter) list = list.filter((e) => e.status === statusFilter);
  if (fromDate) list = list.filter((e) => e.expenseDate >= fromDate);
  if (toDate) list = list.filter((e) => e.expenseDate <= toDate);

  list.sort((a, b) => (b.expenseDate || "").localeCompare(a.expenseDate || ""));

  const vehiclesMap = Object.fromEntries(demoVehicles.map((v) => [v.id, v]));
  res.render("expense/list-expenses", {
    title: "Expenses",
    subTitle: "Expense List",
    expenses: list,
    vehiclesMap,
    query: { type: typeFilter, status: statusFilter, from: fromDate, to: toDate },
    expenseTypes: EXPENSE_TYPES,
    expenseCategories: EXPENSE_CATEGORIES,
    pendingOnly: false,
  });
});

// Pending approval (Owner: expenses with status PENDING)
router.get("/pending", (req, res) => {
  const list = demoExpenses.filter((e) => e.status === "PENDING");
  const vehiclesMap = Object.fromEntries(demoVehicles.map((v) => [v.id, v]));
  res.render("expense/list-expenses", {
    title: "Expenses",
    subTitle: "Pending Approval",
    expenses: list,
    vehiclesMap,
    query: { type: "", status: "PENDING", from: "", to: "" },
    expenseTypes: EXPENSE_TYPES,
    expenseCategories: EXPENSE_CATEGORIES,
    pendingOnly: true,
  });
});

// Add expense form
router.get("/add", (req, res) => {
  res.render("expense/add-expense", {
    title: "Expenses",
    subTitle: "Add Expense",
    expense: null,
    error: null,
    expenseTypes: EXPENSE_TYPES,
    expenseCategories: EXPENSE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS,
    vehicles: demoVehicles,
  });
});

// Add expense submit
router.post("/add", (req, res) => {
  const body = req.body || {};
  const amount = parseFloat(body.amount);
  const expenseDate = (body.expenseDate || "").trim();
  const expenseType = (body.expenseType || "").trim();
  const expenseCategory = (body.expenseCategory || "OTHER").trim();

  if (!expenseType || !expenseDate || amount == null || isNaN(amount) || amount < 0) {
    return res.status(400).render("expense/add-expense", {
      title: "Expenses",
      subTitle: "Add Expense",
      expense: body,
      error: "Type, date and amount are required.",
      expenseTypes: EXPENSE_TYPES,
      expenseCategories: EXPENSE_CATEGORIES,
      paymentMethods: PAYMENT_METHODS,
      vehicles: demoVehicles,
    });
  }

  const vehicleId = body.vehicleId ? parseInt(body.vehicleId, 10) : null;
  const status = amount > 5000 ? "PENDING" : "APPROVED"; // demo threshold 5000

  const expense = {
    id: nextId++,
    expenseType,
    expenseCategory,
    amount,
    currencyCode: "INR",
    currencySymbol: "₹",
    expenseDate,
    vehicleId: vehicleId || null,
    rentalId: null,
    paymentMethod: (body.paymentMethod || "").trim() || null,
    vendorName: (body.vendorName || "").trim() || null,
    vendorContact: (body.vendorContact || "").trim() || null,
    description: (body.description || "").trim() || null,
    receiptNumber: (body.receiptNumber || "").trim() || null,
    status,
    notes: (body.notes || "").trim() || null,
  };
  demoExpenses.push(expense);
  return res.redirect((req.baseUrl || "") + "/expense");
});

// Edit expense form
router.get("/edit/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const expense = demoExpenses.find((e) => e.id === id);
  if (!expense) return res.redirect((req.baseUrl || "") + "/expense");
  res.render("expense/edit-expense", {
    title: "Expenses",
    subTitle: "Edit Expense",
    expense,
    error: null,
    expenseTypes: EXPENSE_TYPES,
    expenseCategories: EXPENSE_CATEGORIES,
    paymentMethods: PAYMENT_METHODS,
    vehicles: demoVehicles,
  });
});

// Edit expense submit
router.post("/edit/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const expense = demoExpenses.find((e) => e.id === id);
  if (!expense) return res.redirect((req.baseUrl || "") + "/expense");

  const body = req.body || {};
  const amount = parseFloat(body.amount);
  const expenseDate = (body.expenseDate || "").trim();
  const expenseType = (body.expenseType || "").trim();
  const expenseCategory = (body.expenseCategory || "OTHER").trim();

  if (!expenseType || !expenseDate || amount == null || isNaN(amount) || amount < 0) {
    return res.status(400).render("expense/edit-expense", {
      title: "Expenses",
      subTitle: "Edit Expense",
      expense: { ...expense, ...body },
      error: "Type, date and amount are required.",
      expenseTypes: EXPENSE_TYPES,
      expenseCategories: EXPENSE_CATEGORIES,
      paymentMethods: PAYMENT_METHODS,
      vehicles: demoVehicles,
    });
  }

  expense.expenseType = expenseType;
  expense.expenseCategory = expenseCategory;
  expense.amount = amount;
  expense.expenseDate = expenseDate;
  expense.vehicleId = body.vehicleId ? parseInt(body.vehicleId, 10) : null;
  expense.paymentMethod = (body.paymentMethod || "").trim() || null;
  expense.vendorName = (body.vendorName || "").trim() || null;
  expense.vendorContact = (body.vendorContact || "").trim() || null;
  expense.description = (body.description || "").trim() || null;
  expense.receiptNumber = (body.receiptNumber || "").trim() || null;
  expense.notes = (body.notes || "").trim() || null;
  if (expense.status === "PENDING" && amount <= 5000) expense.status = "APPROVED";
  return res.redirect((req.baseUrl || "") + "/expense");
});

// View expense
router.get("/view/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const expense = demoExpenses.find((e) => e.id === id);
  if (!expense) return res.redirect((req.baseUrl || "") + "/expense");
  const vehicle = expense.vehicleId ? demoVehicles.find((v) => v.id === expense.vehicleId) : null;
  res.render("expense/view-expense", {
    title: "Expenses",
    subTitle: "View Expense",
    expense,
    vehicle: vehicle || null,
  });
});

// Approve expense (Owner: PENDING -> APPROVED)
router.post("/approve/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const expense = demoExpenses.find((e) => e.id === id);
  if (expense && expense.status === "PENDING") expense.status = "APPROVED";
  return res.redirect(req.headers.referer || (req.baseUrl || "") + "/expense/pending");
});

// Delete expense
router.post("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = demoExpenses.findIndex((e) => e.id === id);
  if (idx !== -1) demoExpenses.splice(idx, 1);
  return res.redirect((req.baseUrl || "") + "/expense");
});

// Expose for reports/dashboard
router.demoExpenses = demoExpenses;
module.exports = router;
