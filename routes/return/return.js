const express = require("express");
const router = express.Router();

const rentalRouter = require("../rental/rental");
const vehicleRouter = require("../vehicle/vehicle");
const customerRouter = require("../customer/customer");

const demoRentals = rentalRouter.demoRentals;
const demoVehicles = vehicleRouter.demoVehicles;
const demoCustomers = customerRouter.demoCustomers;

// List active rentals (to select which one to process return for)
router.get("/", (req, res) => {
  const activeRentals = demoRentals.filter((r) => r.status === "ACTIVE");
  const vehiclesMap = Object.fromEntries(demoVehicles.map((v) => [v.id, v]));
  const customersMap = Object.fromEntries(demoCustomers.map((c) => [c.id, c]));
  res.render("return/list-active", {
    title: "Returns",
    subTitle: "Process Return",
    rentals: activeRentals,
    vehiclesMap,
    customersMap,
  });
});

// Process return form (for a specific rental)
router.get("/process/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rental = demoRentals.find((r) => r.id === id);
  if (!rental) return res.redirect((req.baseUrl || "") + "/return");
  if (rental.status !== "ACTIVE") return res.redirect((req.baseUrl || "") + "/return");
  const vehicle = demoVehicles.find((v) => v.id === rental.vehicleId);
  const customer = demoCustomers.find((c) => c.id === rental.customerId);
  res.render("return/process-return", {
    title: "Returns",
    subTitle: "Process Return",
    rental,
    vehicle: vehicle || null,
    customer: customer || null,
    error: null,
  });
});

// Process return submit
router.post("/process/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const rental = demoRentals.find((r) => r.id === id);
  if (!rental) return res.redirect((req.baseUrl || "") + "/return");
  if (rental.status !== "ACTIVE") return res.redirect((req.baseUrl || "") + "/return");

  const body = req.body || {};
  const actualReturnDate = (body.actualReturnDate || "").trim();
  const actualReturnTime = (body.actualReturnTime || "00:00").trim();
  const lateReturnFee = parseFloat(body.lateReturnFee) || 0;
  const otherCharges = parseFloat(body.otherCharges) || 0;

  if (!actualReturnDate) {
    const vehicle = demoVehicles.find((v) => v.id === rental.vehicleId);
    const customer = demoCustomers.find((c) => c.id === rental.customerId);
    return res.status(400).render("return/process-return", {
      title: "Returns",
      subTitle: "Process Return",
      rental,
      vehicle: vehicle || null,
      customer: customer || null,
      error: "Return date is required.",
    });
  }

  const totalChargesAtReturn = lateReturnFee + otherCharges;
  const deposit = rental.deposit != null ? Number(rental.deposit) : 0;
  const depositDeduction = Math.min(totalChargesAtReturn, deposit);
  const depositRefundAmount = Math.max(0, deposit - depositDeduction);
  const additionalPaymentRequired = Math.max(0, totalChargesAtReturn - deposit);

  rental.actualReturnDate = actualReturnDate;
  rental.actualReturnTime = actualReturnTime;
  rental.lateReturnFee = lateReturnFee;
  rental.totalChargesAtReturn = totalChargesAtReturn;
  rental.depositDeduction = depositDeduction;
  rental.depositRefundAmount = depositRefundAmount;
  rental.additionalPaymentRequired = additionalPaymentRequired;
  rental.status = "COMPLETED";

  const v = demoVehicles.find((x) => x.id === rental.vehicleId);
  if (v) v.status = "Available";

  return res.redirect((req.baseUrl || "") + "/rental/view/" + rental.id + "?returned=1");
});

module.exports = router;
