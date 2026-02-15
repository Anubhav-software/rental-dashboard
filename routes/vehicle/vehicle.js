const express = require("express");
const router = express.Router();

// Demo vehicles (in-memory). Schema-aligned with workflow.md (incl. charges 142-159). Later: replace with DB.
const defaultCharges = () => ({
  lateReturnFeePerHour: null,
  lateReturnFeePerDay: null,
  geographicRestrictionEnabled: false,
  allowedGeographicArea: null,
  geographicViolationFine: null,
  earlyReturnRefundAllowed: false,
  earlyReturnPenaltyPercentage: null,
  helmetDamageMin: null,
  helmetDamageMax: null,
  keyLostMin: null,
  keyLostMax: null,
  punctureRepairMin: null,
  punctureRepairMax: null,
  pickupFeeMin: null,
  pickupFeeMax: null,
  oilChangeMin: null,
  oilChangeMax: null,
  batteryRundownCharge: null,
  accidentRecoveryMin: null,
  accidentRecoveryMax: null,
});
const dueDateFields = () => ({ taxExpiryDate: null, nextBatteryChangeDate: null, nextServiceDate: null, nextOilChangeDate: null });
const demoVehicles = [
  { id: 1, make: "Toyota", model: "Camry", registrationNumber: "TN-01-AB-1234", vehicleType: "CAR", year: 2022, color: "White", seatingCapacity: 5, fuelType: "Petrol", dailyRate: 2500, weeklyRate: 15000, monthlyRate: 50000, hourlyRate: 200, ownerName: "Fleet Owner", ownerContact: "+91 9876543210", status: "Available", imagePath: "", ...defaultCharges(), ...dueDateFields() },
  { id: 2, make: "Honda", model: "City", registrationNumber: "TN-02-CD-5678", vehicleType: "CAR", year: 2021, color: "Silver", seatingCapacity: 5, fuelType: "Petrol", dailyRate: 2200, weeklyRate: null, monthlyRate: null, hourlyRate: 180, ownerName: "", ownerContact: "", status: "Rented", imagePath: "", ...defaultCharges(), ...dueDateFields() },
  { id: 3, make: "Hyundai", model: "Creta", registrationNumber: "TN-03-EF-9012", vehicleType: "CAR", year: 2023, color: "Black", seatingCapacity: 5, fuelType: "Diesel", dailyRate: 3000, weeklyRate: 18000, monthlyRate: 60000, hourlyRate: null, ownerName: "", ownerContact: "", status: "Maintenance", imagePath: "", ...defaultCharges(), ...dueDateFields() },
];

let nextId = 4;

// List vehicles — render shell; data loaded client-side via vehicleApi.list()
router.get("/", (req, res) => {
  const status = (req.query.status || "").trim();
  const vehicle_type = (req.query.vehicle_type || "").trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  res.render("vehicle/list-vehicles", {
    title: "Vehicles",
    subTitle: "Vehicle List",
    vehicles: [],
    query: { status, vehicle_type, page, limit },
    pagination: { total: 0, page, limit, totalPages: 0 },
  });
});

// Download CSV template for vehicle import — only fields that exist on the add vehicle form (no extra columns).
// Same columns as backend bulk template so upload works; snake_case headers for parser.
router.get("/template/download", (req, res) => {
  const headers = [
    "registration_number", "vehicle_type", "make", "model", "status",
    "year", "color", "seating_capacity", "fuel_type", "engine_capacity_cc",
    "daily_rate", "weekly_rate", "monthly_rate", "deposit",
    "rate_1_day", "rate_2_days", "rate_3_days", "rate_4_days", "rate_5_days", "rate_6_days", "rate_7_days",
    "rate_14_days", "rate_21_days", "rate_28_days", "rate_60_days", "rate_90_days",
    "tax_expiry_date", "next_battery_change_date", "next_service_date", "next_oil_change_date",
    "image_url",
  ];
  const sampleRow = ["ABC-1234", "CAR", "Honda", "Civic", "AVAILABLE", "2022", "White", "5", "Petrol", "1200", "50", "300", "1000", "5000", "300", "600", "900", "1200", "1400", "1500", "1600", "2800", "4000", "5000", "10000", "15000", "2026-12-31", "2026-12-31", "2026-12-31", "2026-12-31", ""];
  const escapeCsv = (cell) => {
    const s = cell == null ? "" : String(cell);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const csvLine = (arr) => arr.map(escapeCsv).join(",");
  let csv = "\uFEFF" + csvLine(headers) + "\r\n" + csvLine(sampleRow) + "\r\n";
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="vehicle-import-template.csv"');
  res.send(csv);
});

// Export all vehicles as CSV (same columns as template, includes due-date fields)
const exportHeaders = [
  "Make", "Model", "Registration Number", "Vehicle Type", "Year", "Color", "Seating Capacity", "Fuel Type",
  "Daily Rate", "Hourly Rate", "Weekly Rate", "Monthly Rate", "Late Return Fee Per Hour", "Late Return Fee Per Day",
  "Owner Name", "Owner Contact", "Status", "Geographic Restriction Enabled", "Allowed Geographic Area", "Geographic Violation Fine",
  "Early Return Refund Allowed", "Early Return Penalty %", "Helmet Damage Min", "Helmet Damage Max", "Key Lost Min", "Key Lost Max",
  "Puncture Repair Min", "Puncture Repair Max", "Pickup Fee Min", "Pickup Fee Max", "Oil Change Min", "Oil Change Max",
  "Battery Rundown Charge", "Accident Recovery Min", "Accident Recovery Max",
  "Tax Expiry Date", "Next Battery Change Date", "Next Service Date", "Next Oil Change Date",
];
function vehicleToExportRow(v) {
  return [
    v.make ?? "",
    v.model ?? "",
    v.registrationNumber ?? "",
    v.vehicleType ?? "CAR",
    v.year ?? "",
    v.color ?? "",
    v.seatingCapacity ?? "",
    v.fuelType ?? "",
    v.dailyRate ?? "",
    v.hourlyRate ?? "",
    v.weeklyRate ?? "",
    v.monthlyRate ?? "",
    v.lateReturnFeePerHour ?? "",
    v.lateReturnFeePerDay ?? "",
    v.ownerName ?? "",
    v.ownerContact ?? "",
    v.status ?? "Available",
    v.geographicRestrictionEnabled ? "1" : "0",
    v.allowedGeographicArea ?? "",
    v.geographicViolationFine ?? "",
    v.earlyReturnRefundAllowed ? "1" : "0",
    v.earlyReturnPenaltyPercentage ?? "",
    v.helmetDamageMin ?? "", v.helmetDamageMax ?? "",
    v.keyLostMin ?? "", v.keyLostMax ?? "",
    v.punctureRepairMin ?? "", v.punctureRepairMax ?? "",
    v.pickupFeeMin ?? "", v.pickupFeeMax ?? "",
    v.oilChangeMin ?? "", v.oilChangeMax ?? "",
    v.batteryRundownCharge ?? "",
    v.accidentRecoveryMin ?? "", v.accidentRecoveryMax ?? "",
    v.taxExpiryDate ?? "",
    v.nextBatteryChangeDate ?? "",
    v.nextServiceDate ?? "",
    v.nextOilChangeDate ?? "",
  ];
}

router.get("/export", (req, res) => {
  // Quote every cell so Excel doesn't shift columns (e.g. no gap below Pickup Fee / Tax Expiry)
  const escapeCsv = (cell) => {
    const s = cell == null ? "" : String(cell);
    return '"' + s.replace(/"/g, '""') + '"';
  };
  const csvLine = (arr) => arr.map(escapeCsv).join(",");
  let csv = "\uFEFF" + csvLine(exportHeaders) + "\r\n";
  demoVehicles.forEach((v) => {
    csv += csvLine(vehicleToExportRow(v)) + "\r\n";
  });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="vehicles-export.csv"');
  res.send(csv);
});

// Add vehicle form
router.get("/add", (req, res) => {
  res.render("vehicle/add-vehicle", { title: "Vehicles", subTitle: "Add Vehicle", vehicle: null, error: null });
});

// Add vehicle submit
router.post("/add", (req, res) => {
  const body = req.body || {};
  const make = (body.make || "").trim();
  const model = (body.model || "").trim();
  const registrationNumber = (body.registrationNumber || "").trim();
  if (!make || !model || !registrationNumber) {
    return res.status(400).render("vehicle/add-vehicle", {
      title: "Vehicles",
      subTitle: "Add Vehicle",
      vehicle: body,
      error: "Make, Model and Registration Number are required",
    });
  }
  const existing = demoVehicles.find((v) => (v.registrationNumber || "").toLowerCase() === registrationNumber.toLowerCase());
  if (existing) {
    return res.status(409).render("vehicle/add-vehicle", {
      title: "Vehicles",
      subTitle: "Add Vehicle",
      vehicle: body,
      error: "Registration number already exists",
    });
  }
  const statusVal = ["Available", "Rented", "Maintenance"].includes(body.status) ? body.status : "Available";
  const vehicleType = ["MOTORBIKE", "CAR"].includes(body.vehicleType) ? body.vehicleType : "CAR";
  const num = (x) => (x !== "" && x !== undefined && x !== null ? parseFloat(String(x)) : null);
  const newVehicle = {
    id: nextId++,
    make,
    model,
    registrationNumber,
    vehicleType,
    year: body.year ? parseInt(body.year, 10) : null,
    color: (body.color || "").trim() || null,
    seatingCapacity: body.seatingCapacity ? parseInt(body.seatingCapacity, 10) : null,
    fuelType: (body.fuelType || "").trim() || null,
    dailyRate: num(body.dailyRate),
    weeklyRate: num(body.weeklyRate),
    monthlyRate: num(body.monthlyRate),
    hourlyRate: num(body.hourlyRate),
    ownerName: (body.ownerName || "").trim() || null,
    ownerContact: (body.ownerContact || "").trim() || null,
    status: statusVal,
    imagePath: "",
    lateReturnFeePerHour: num(body.lateReturnFeePerHour),
    lateReturnFeePerDay: num(body.lateReturnFeePerDay),
    geographicRestrictionEnabled: body.geographicRestrictionEnabled === "on" || body.geographicRestrictionEnabled === "1",
    allowedGeographicArea: (body.allowedGeographicArea || "").trim() || null,
    geographicViolationFine: num(body.geographicViolationFine),
    earlyReturnRefundAllowed: body.earlyReturnRefundAllowed === "on" || body.earlyReturnRefundAllowed === "1",
    earlyReturnPenaltyPercentage: num(body.earlyReturnPenaltyPercentage),
    helmetDamageMin: num(body.helmetDamageMin),
    helmetDamageMax: num(body.helmetDamageMax),
    keyLostMin: num(body.keyLostMin),
    keyLostMax: num(body.keyLostMax),
    punctureRepairMin: num(body.punctureRepairMin),
    punctureRepairMax: num(body.punctureRepairMax),
    pickupFeeMin: num(body.pickupFeeMin),
    pickupFeeMax: num(body.pickupFeeMax),
    oilChangeMin: num(body.oilChangeMin),
    oilChangeMax: num(body.oilChangeMax),
    batteryRundownCharge: num(body.batteryRundownCharge),
    accidentRecoveryMin: num(body.accidentRecoveryMin),
    accidentRecoveryMax: num(body.accidentRecoveryMax),
    taxExpiryDate: (body.taxExpiryDate || "").trim() || null,
    nextBatteryChangeDate: (body.nextBatteryChangeDate || "").trim() || null,
    nextServiceDate: (body.nextServiceDate || "").trim() || null,
    nextOilChangeDate: (body.nextOilChangeDate || "").trim() || null,
  };
  demoVehicles.push(newVehicle);
  return res.redirect((req.baseUrl || "") + "/vehicle");
});

// Due today / due this week list (client requirement: daily due list)
function getDueList(range = "today") {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  if (range === "week") end.setDate(end.getDate() + 7);
  const endStr = end.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);
  const dueTypes = [
    { key: "taxExpiryDate", label: "Tax expiry" },
    { key: "nextBatteryChangeDate", label: "Battery change" },
    { key: "nextServiceDate", label: "Service" },
    { key: "nextOilChangeDate", label: "Oil change" },
  ];
  const items = [];
  demoVehicles.forEach((v) => {
    dueTypes.forEach(({ key, label }) => {
      const d = v[key];
      if (!d) return;
      if (d >= todayStr && d <= endStr) items.push({ vehicle: v, dueType: label, dueDate: d });
    });
  });
  items.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  return items;
}

router.get("/due", (req, res) => {
  const range = (req.query.range || "today").toLowerCase() === "week" ? "week" : "today";
  const dueList = getDueList(range);
  res.render("vehicle/due-list", {
    title: "Vehicles",
    subTitle: range === "week" ? "Due this week" : "Due today",
    dueList,
    range,
  });
});

// View vehicle — render shell; data loaded client-side via vehicleApi.getById(id)
router.get("/view/:id", (req, res) => {
  const vehicleId = req.params.id;
  res.render("vehicle/view-vehicle", { title: "Vehicles", subTitle: "View Vehicle", vehicle: null, vehicleId });
});

// Edit vehicle — render shell; data loaded client-side via vehicleApi.getById(id), submit via PATCH
router.get("/edit/:id", (req, res) => {
  const vehicleId = req.params.id;
  res.render("vehicle/edit-vehicle", { title: "Vehicles", subTitle: "Edit Vehicle", vehicle: null, vehicleId, error: null });
});

// Delete vehicle — dashboard uses client-side vehicleApi.delete(id) from list and view pages; this route kept for legacy POST form
router.post("/delete/:id", (req, res) => {
  return res.redirect((req.baseUrl || "") + "/vehicle");
});

// Expose for rental module (dropdowns, availability) and dashboard (due list)
router.demoVehicles = demoVehicles;
router.getDueList = getDueList;
module.exports = router;
