const express = require("express");
const router = express.Router();

// Month view: availability calendar (which dates have rentals). Data loaded client-side for real rentals.
router.get("/", (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);
  const daysInMonth = monthEnd.getDate();
  const firstDay = monthStart.getDay(); // 0 = Sun

  // Build calendar grid: rows of 7 days each (no rental counts; day links only; month view can be enhanced with API later)
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = year + "-" + String(month).padStart(2, "0") + "-" + String(d).padStart(2, "0");
    days.push({ date: d, dateStr, rentals: [] });
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

  const now = new Date();
  const todayStr =
    now.getFullYear() +
    "-" +
    String(now.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(now.getDate()).padStart(2, "0");

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
    todayStr,
  });
});

// Redirect old calendar/day links to Rentals page with date filter (one less page to maintain)
router.get("/day", (req, res) => {
  const dateStr = (req.query.date || "").trim();
  if (!dateStr) return res.redirect((req.baseUrl || "").replace(/\/calendar\/?.*$/, "") || "/calendar");
  const base = (req.baseUrl || "").replace(/\/calendar\/?.*$/, "") || "";
  return res.redirect(base + "/rental?on_date=" + encodeURIComponent(dateStr));
});

module.exports = router;
