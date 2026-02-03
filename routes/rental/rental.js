const express = require("express");
const router = express.Router();

const vehicleRouter = require("../vehicle/vehicle");
const customerRouter = require("../customer/customer");
const { demoCompany } = require("../company-data/company-data");
const demoVehicles = vehicleRouter.demoVehicles;
const demoCustomers = customerRouter.demoCustomers;

// Demo rentals (in-memory). Schema-aligned with workflow.md rentals table. Later: replace with DB.
const demoRentals = [
  {
    id: 1,
    contractNumber: "CNT-001",
    vehicleId: 1,
    customerId: 1,
    startDate: "2025-01-20",
    startTime: "10:00",
    endDate: "2025-01-25",
    endTime: "10:00",
    expectedReturnDate: "2025-01-25",
    expectedReturnTime: "10:00",
    actualReturnDate: null,
    actualReturnTime: null,
    selectedChargeMethod: "DAILY",
    dailyRate: 2500,
    weeklyRate: 15000,
    monthlyRate: 50000,
    hourlyRate: 200,
    totalDays: 5,
    totalWeeks: null,
    totalMonths: null,
    totalHours: null,
    totalAmount: 12500,
    advancePaid: 5000,
    deposit: 3000,
    balanceAmount: 4500,
    helmetsQuantity: null,
    lateReturnFee: null,
    earlyReturnPenalty: null,
    currencyCode: "INR",
    currencySymbol: "₹",
    status: "ACTIVE",
    termsAccepted: true,
    customerSignature: null,
    staffSignature: null,
    totalChargesAtReturn: null,
    depositDeduction: null,
    depositRefundAmount: null,
    additionalPaymentRequired: null,
  },
  {
    id: 2,
    contractNumber: "CNT-002",
    vehicleId: 2,
    customerId: 2,
    startDate: "2025-01-15",
    startTime: "09:00",
    endDate: "2025-01-18",
    endTime: "09:00",
    expectedReturnDate: "2025-01-18",
    expectedReturnTime: "09:00",
    actualReturnDate: "2025-01-18",
    actualReturnTime: "09:30",
    selectedChargeMethod: "DAILY",
    dailyRate: 2200,
    weeklyRate: null,
    monthlyRate: null,
    hourlyRate: 180,
    totalDays: 3,
    totalWeeks: null,
    totalMonths: null,
    totalHours: null,
    totalAmount: 6600,
    advancePaid: 6600,
    deposit: 2000,
    balanceAmount: 0,
    helmetsQuantity: null,
    lateReturnFee: null,
    earlyReturnPenalty: null,
    currencyCode: "INR",
    currencySymbol: "₹",
    status: "COMPLETED",
    termsAccepted: true,
    customerSignature: null,
    staffSignature: null,
    totalChargesAtReturn: 0,
    depositDeduction: 0,
    depositRefundAmount: 2000,
    additionalPaymentRequired: 0,
  },
];

let nextRentalId = 3;
let nextContractSeq = 3;

function getAvailableVehicles() {
  return demoVehicles.filter((v) => v.status === "Available");
}

// List all rentals (optional status filter)
router.get("/", (req, res) => {
  let list = [...demoRentals];
  const statusFilter = (req.query.status || "").trim();
  if (statusFilter) {
    list = list.filter((r) => r.status === statusFilter);
  }
  const vehiclesMap = Object.fromEntries(demoVehicles.map((v) => [v.id, v]));
  const customersMap = Object.fromEntries(demoCustomers.map((c) => [c.id, c]));
  res.render("rental/list-rentals", {
    title: "Rentals",
    subTitle: "Rental List",
    rentals: list,
    vehiclesMap,
    customersMap,
    query: { status: statusFilter },
    activeOnly: false,
  });
});

// List active rentals only
router.get("/active", (req, res) => {
  const list = demoRentals.filter((r) => r.status === "ACTIVE");
  const vehiclesMap = Object.fromEntries(demoVehicles.map((v) => [v.id, v]));
  const customersMap = Object.fromEntries(demoCustomers.map((c) => [c.id, c]));
  res.render("rental/list-rentals", {
    title: "Rentals",
    subTitle: "Active Rentals",
    rentals: list,
    vehiclesMap,
    customersMap,
    query: { status: "ACTIVE" },
    activeOnly: true,
  });
});

// Create rental form
router.get("/add", (req, res) => {
  const available = getAvailableVehicles();
  res.render("rental/create-rental", {
    title: "Rentals",
    subTitle: "Create Rental",
    customers: demoCustomers,
    vehicles: available,
    rental: null,
    error: null,
  });
});

// Create rental submit
router.post("/add", (req, res) => {
  const body = req.body || {};
  const customerId = parseInt(body.customerId, 10);
  const vehicleId = parseInt(body.vehicleId, 10);
  const startDate = (body.startDate || "").trim();
  const startTime = (body.startTime || "").trim();
  const endDate = (body.endDate || "").trim();
  const endTime = (body.endTime || "").trim();
  const selectedChargeMethod = (body.selectedChargeMethod || "DAILY").trim().toUpperCase();
  const advancePaid = parseFloat(body.advancePaid) || 0;
  const deposit = parseFloat(body.deposit) || 0;
  const termsAccepted = body.termsAccepted === "on" || body.termsAccepted === "true";

  if (!customerId || !vehicleId || !startDate || !endDate) {
    return res.status(400).render("rental/create-rental", {
      title: "Rentals",
      subTitle: "Create Rental",
      customers: demoCustomers,
      vehicles: getAvailableVehicles(),
      rental: body,
      error: "Customer, Vehicle, Start date and End date are required.",
    });
  }

  const customer = demoCustomers.find((c) => c.id === customerId);
  const vehicle = demoVehicles.find((v) => v.id === vehicleId);
  if (!customer || !vehicle) {
    return res.status(400).render("rental/create-rental", {
      title: "Rentals",
      subTitle: "Create Rental",
      customers: demoCustomers,
      vehicles: getAvailableVehicles(),
      rental: body,
      error: "Invalid customer or vehicle.",
    });
  }

  if (vehicle.status !== "Available") {
    return res.status(400).render("rental/create-rental", {
      title: "Rentals",
      subTitle: "Create Rental",
      customers: demoCustomers,
      vehicles: getAvailableVehicles(),
      rental: body,
      error: "Selected vehicle is not available.",
    });
  }

  const start = new Date(startDate + "T" + (startTime || "00:00"));
  const end = new Date(endDate + "T" + (endTime || "00:00"));
  if (end <= start) {
    return res.status(400).render("rental/create-rental", {
      title: "Rentals",
      subTitle: "Create Rental",
      customers: demoCustomers,
      vehicles: getAvailableVehicles(),
      rental: body,
      error: "End date/time must be after start date/time.",
    });
  }

  let totalDays = (end - start) / (1000 * 60 * 60 * 24);
  let totalWeeks = null;
  let totalMonths = null;
  let totalHours = null;
  let totalAmount = 0;
  const dailyRate = vehicle.dailyRate != null ? Number(vehicle.dailyRate) : 0;
  const weeklyRate = vehicle.weeklyRate != null ? Number(vehicle.weeklyRate) : null;
  const monthlyRate = vehicle.monthlyRate != null ? Number(vehicle.monthlyRate) : null;
  const hourlyRate = vehicle.hourlyRate != null ? Number(vehicle.hourlyRate) : null;

  if (selectedChargeMethod === "HOURLY" && hourlyRate != null) {
    totalHours = Math.max(0, (end - start) / (1000 * 60 * 60));
    totalAmount = Math.ceil(totalHours) * hourlyRate;
    totalDays = totalHours / 24;
  } else if (selectedChargeMethod === "WEEKLY" && weeklyRate != null) {
    totalWeeks = Math.ceil(totalDays / 7) || 1;
    totalAmount = totalWeeks * weeklyRate;
  } else if (selectedChargeMethod === "MONTHLY" && monthlyRate != null) {
    totalMonths = Math.ceil(totalDays / 30) || 1;
    totalAmount = totalMonths * monthlyRate;
  } else {
    totalDays = Math.ceil(totalDays) || 1;
    totalAmount = totalDays * dailyRate;
  }

  const balanceAmount = Math.max(0, totalAmount - advancePaid);
  const prefix = (demoCompany.contract_number_prefix || "CNT").replace(/\s/g, "");
  const contractNumber = prefix + "-" + String(nextContractSeq++).padStart(3, "0");

  const newRental = {
    id: nextRentalId++,
    contractNumber,
    vehicleId,
    customerId,
    startDate,
    startTime: startTime || "00:00",
    endDate,
    endTime: endTime || "00:00",
    expectedReturnDate: endDate,
    expectedReturnTime: endTime || "00:00",
    actualReturnDate: null,
    actualReturnTime: null,
    selectedChargeMethod,
    dailyRate,
    weeklyRate,
    monthlyRate,
    hourlyRate,
    totalDays,
    totalWeeks,
    totalMonths,
    totalHours,
    totalAmount,
    advancePaid,
    deposit,
    balanceAmount,
    helmetsQuantity: body.helmetsQuantity ? parseInt(body.helmetsQuantity, 10) : null,
    lateReturnFee: null,
    earlyReturnPenalty: null,
    currencyCode: demoCompany.currency_code || "INR",
    currencySymbol: demoCompany.currency_symbol || "₹",
    status: "ACTIVE",
    termsAccepted,
    customerSignature: null,
    staffSignature: null,
  };

  newRental.totalChargesAtReturn = null;
  newRental.depositDeduction = null;
  newRental.depositRefundAmount = null;
  newRental.additionalPaymentRequired = null;
  demoRentals.push(newRental);
  const v = demoVehicles.find((x) => x.id === vehicleId);
  if (v) v.status = "Rented";

  return res.redirect((req.baseUrl || "") + "/rental/view/" + newRental.id);
});

// View rental (contract-style)
router.get("/view/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rental = demoRentals.find((r) => r.id === id);
  if (!rental) return res.redirect((req.baseUrl || "") + "/rental");
  const vehicle = demoVehicles.find((v) => v.id === rental.vehicleId);
  const customer = demoCustomers.find((c) => c.id === rental.customerId);
  res.render("rental/view-rental", {
    title: "Rentals",
    subTitle: "View Rental",
    rental,
    vehicle: vehicle || null,
    customer: customer || null,
    query: req.query || {},
  });
});

// Delete rental
router.post("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rental = demoRentals.find((r) => r.id === id);
  if (rental && rental.status === "ACTIVE") {
    const v = demoVehicles.find((x) => x.id === rental.vehicleId);
    if (v) v.status = "Available";
  }
  const idx = demoRentals.findIndex((r) => r.id === id);
  if (idx !== -1) demoRentals.splice(idx, 1);
  return res.redirect((req.baseUrl || "") + "/rental");
});

// Expose for return module (process return, update status)
router.demoRentals = demoRentals;
module.exports = router;
