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

// List vehicles (with optional search & status filter)
router.get("/", (req, res) => {
  let list = [...demoVehicles];
  const search = (req.query.search || "").trim().toLowerCase();
  const statusFilter = (req.query.status || "").trim();

  if (search) {
    list = list.filter(
      (v) =>
        (v.make || "").toLowerCase().includes(search) ||
        v.model.toLowerCase().includes(search) ||
        (v.registrationNumber && v.registrationNumber.toLowerCase().includes(search))
    );
  }
  if (statusFilter) {
    list = list.filter((v) => v.status === statusFilter);
  }

  res.render("vehicle/list-vehicles", {
    title: "Vehicles",
    subTitle: "Vehicle List",
    vehicles: list,
    query: { search: req.query.search || "", status: statusFilter },
  });
});

// Download CSV template for vehicle import/export (readable headers + dummy rows)
router.get("/template/download", (req, res) => {
  const headers = [
    "Make",
    "Model",
    "Registration Number",
    "Vehicle Type",
    "Year",
    "Color",
    "Seating Capacity",
    "Fuel Type",
    "Daily Rate",
    "Hourly Rate",
    "Weekly Rate",
    "Monthly Rate",
    "Late Return Fee Per Hour",
    "Late Return Fee Per Day",
    "Owner Name",
    "Owner Contact",
    "Status",
    "Geographic Restriction Enabled",
    "Allowed Geographic Area",
    "Geographic Violation Fine",
    "Early Return Refund Allowed",
    "Early Return Penalty %",
    "Helmet Damage Min",
    "Helmet Damage Max",
    "Key Lost Min",
    "Key Lost Max",
    "Puncture Repair Min",
    "Puncture Repair Max",
    "Pickup Fee Min",
    "Pickup Fee Max",
    "Oil Change Min",
    "Oil Change Max",
    "Battery Rundown Charge",
    "Accident Recovery Min",
    "Accident Recovery Max",
    "Tax Expiry Date",
    "Next Battery Change Date",
    "Next Service Date",
    "Next Oil Change Date",
  ];
  // Dummy entries: CAR and MOTORBIKE examples
  const dummyRows = [
    ["Toyota", "Camry", "TN-01-AB-1234", "CAR", "2022", "White", "5", "Petrol", "2500", "200", "15000", "50000", "100", "500", "Fleet Owner", "+91 9876543210", "Available", "0", "", "", "1", "0", "", "", "", "", "", "", "", "", "", "", "", "", "", "2025-12-31", "2025-06-15", "2025-03-01", "2025-02-01"],
    ["Honda", "Activa", "TN-02-XY-5678", "MOTORBIKE", "2023", "Red", "2", "Petrol", "800", "80", "4500", "", "50", "200", "", "", "Available", "0", "", "", "0", "", "500", "2000", "1000", "5000", "200", "800", "100", "500", "150", "400", "300", "1000", "3000", "", "", "", ""],
  ];
  const escapeCsv = (cell) => {
    const s = cell == null ? "" : String(cell);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const csvLine = (arr) => arr.map(escapeCsv).join(",");
  let csv = "\uFEFF" + csvLine(headers) + "\r\n";
  dummyRows.forEach((row) => {
    csv += csvLine(row) + "\r\n";
  });
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

// Edit vehicle form
router.get("/edit/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const vehicle = demoVehicles.find((v) => v.id === id);
  if (!vehicle) return res.redirect((req.baseUrl || "") + "/vehicle");
  res.render("vehicle/edit-vehicle", { title: "Vehicles", subTitle: "Edit Vehicle", vehicle, error: null });
});

// Edit vehicle submit
router.post("/edit/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const vehicle = demoVehicles.find((v) => v.id === id);
  if (!vehicle) return res.redirect((req.baseUrl || "") + "/vehicle");
  const body = req.body || {};
  const make = (body.make || "").trim();
  const model = (body.model || "").trim();
  const registrationNumber = (body.registrationNumber || "").trim();
  if (!make || !model || !registrationNumber) {
    return res.status(400).render("vehicle/edit-vehicle", {
      title: "Vehicles",
      subTitle: "Edit Vehicle",
      vehicle: { ...vehicle, ...body },
      error: "Make, Model and Registration Number are required",
    });
  }
  const duplicate = demoVehicles.find((v) => v.id !== id && (v.registrationNumber || "").toLowerCase() === registrationNumber.toLowerCase());
  if (duplicate) {
    return res.status(409).render("vehicle/edit-vehicle", {
      title: "Vehicles",
      subTitle: "Edit Vehicle",
      vehicle: { ...vehicle, ...body },
      error: "Registration number already exists",
    });
  }
  const statusVal = ["Available", "Rented", "Maintenance"].includes(body.status) ? body.status : vehicle.status;
  const vehicleType = ["MOTORBIKE", "CAR"].includes(body.vehicleType) ? body.vehicleType : vehicle.vehicleType || "CAR";
  const num = (x) => (x !== "" && x !== undefined && x !== null ? parseFloat(String(x)) : null);
  vehicle.make = make;
  vehicle.model = model;
  vehicle.registrationNumber = registrationNumber;
  vehicle.vehicleType = vehicleType;
  vehicle.year = body.year ? parseInt(body.year, 10) : null;
  vehicle.color = (body.color || "").trim() || null;
  vehicle.seatingCapacity = body.seatingCapacity ? parseInt(body.seatingCapacity, 10) : null;
  vehicle.fuelType = (body.fuelType || "").trim() || null;
  vehicle.dailyRate = num(body.dailyRate);
  vehicle.weeklyRate = num(body.weeklyRate);
  vehicle.monthlyRate = num(body.monthlyRate);
  vehicle.hourlyRate = num(body.hourlyRate);
  vehicle.ownerName = (body.ownerName || "").trim() || null;
  vehicle.ownerContact = (body.ownerContact || "").trim() || null;
  vehicle.status = statusVal;
  vehicle.lateReturnFeePerHour = num(body.lateReturnFeePerHour);
  vehicle.lateReturnFeePerDay = num(body.lateReturnFeePerDay);
  vehicle.geographicRestrictionEnabled = body.geographicRestrictionEnabled === "on" || body.geographicRestrictionEnabled === "1";
  vehicle.allowedGeographicArea = (body.allowedGeographicArea || "").trim() || null;
  vehicle.geographicViolationFine = num(body.geographicViolationFine);
  vehicle.earlyReturnRefundAllowed = body.earlyReturnRefundAllowed === "on" || body.earlyReturnRefundAllowed === "1";
  vehicle.earlyReturnPenaltyPercentage = num(body.earlyReturnPenaltyPercentage);
  vehicle.helmetDamageMin = num(body.helmetDamageMin);
  vehicle.helmetDamageMax = num(body.helmetDamageMax);
  vehicle.keyLostMin = num(body.keyLostMin);
  vehicle.keyLostMax = num(body.keyLostMax);
  vehicle.punctureRepairMin = num(body.punctureRepairMin);
  vehicle.punctureRepairMax = num(body.punctureRepairMax);
  vehicle.pickupFeeMin = num(body.pickupFeeMin);
  vehicle.pickupFeeMax = num(body.pickupFeeMax);
  vehicle.oilChangeMin = num(body.oilChangeMin);
  vehicle.oilChangeMax = num(body.oilChangeMax);
  vehicle.batteryRundownCharge = num(body.batteryRundownCharge);
  vehicle.accidentRecoveryMin = num(body.accidentRecoveryMin);
  vehicle.accidentRecoveryMax = num(body.accidentRecoveryMax);
  vehicle.taxExpiryDate = (body.taxExpiryDate || "").trim() || null;
  vehicle.nextBatteryChangeDate = (body.nextBatteryChangeDate || "").trim() || null;
  vehicle.nextServiceDate = (body.nextServiceDate || "").trim() || null;
  vehicle.nextOilChangeDate = (body.nextOilChangeDate || "").trim() || null;
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

// View vehicle
router.get("/view/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const vehicle = demoVehicles.find((v) => v.id === id);
  if (!vehicle) return res.redirect((req.baseUrl || "") + "/vehicle");
  res.render("vehicle/view-vehicle", { title: "Vehicles", subTitle: "View Vehicle", vehicle });
});

// Delete vehicle
router.post("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = demoVehicles.findIndex((v) => v.id === id);
  if (idx !== -1) demoVehicles.splice(idx, 1);
  return res.redirect((req.baseUrl || "") + "/vehicle");
});

// Expose for rental module (dropdowns, availability) and dashboard (due list)
router.demoVehicles = demoVehicles;
router.getDueList = getDueList;
module.exports = router;
