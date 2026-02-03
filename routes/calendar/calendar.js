const express = require("express");
const router = express.Router();

const rentalRouter = require("../rental/rental");
const vehicleRouter = require("../vehicle/vehicle");
const customerRouter = require("../customer/customer");

const demoRentals = rentalRouter.demoRentals;
const demoVehicles = vehicleRouter.demoVehicles;
const demoCustomers = customerRouter.demoCustomers;

// Month view: availability calendar (which dates have rentals)
router.get("/", (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const daysInMonth = monthEnd.getDate();
  const firstDay = monthStart.getDay(); // 0 = Sun

  // Build calendar grid: rows of 7 days each
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = year + "-" + String(month).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    const rentalsOnDay = demoRentals.filter((r) => {
      const start = new Date(r.startDate + "T00:00:00");
      const end = new Date(r.endDate + "T23:59:59");
      const day = new Date(dateStr);
      return day >= start && day <= end;
    });
    days.push({ date: d, dateStr, rentals: rentalsOnDay });
  }
  const weekRows = [];
  for (let i = 0; i < days.length; i += 7) {
    weekRows.push(days.slice(i, i + 7));
  }
  // Pad last row to 7 cells
  if (weekRows.length > 0) {
    const last = weekRows[weekRows.length - 1];
    while (last.length < 7) last.push(null);
  }

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  res.render("calendar/availability", {
    title: "Calendar",
    subTitle: "Availability",
    year,
    month,
    monthName: monthStart.toLocaleString("default", { month: "long" }),
    weekRows,
    prevMonth,
    prevYear,
    nextMonth,
    nextYear,
  });
});

// Day view: rentals for a specific date
router.get("/day", (req, res) => {
  const dateStr = (req.query.date || "").trim();
  if (!dateStr) return res.redirect((req.baseUrl || "") + "/calendar");

  const rentalsOnDay = demoRentals.filter((r) => {
    const start = new Date(r.startDate + "T00:00:00");
    const end = new Date(r.endDate + "T23:59:59");
    const day = new Date(dateStr);
    return day >= start && day <= end;
  });

  const vehiclesMap = Object.fromEntries(demoVehicles.map((v) => [v.id, v]));
  const customersMap = Object.fromEntries(demoCustomers.map((c) => [c.id, c]));

  res.render("calendar/day-view", {
    title: "Calendar",
    subTitle: "Day — " + dateStr,
    dateStr,
    rentals: rentalsOnDay,
    vehiclesMap,
    customersMap,
  });
});

module.exports = router;
