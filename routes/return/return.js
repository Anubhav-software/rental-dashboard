const express = require("express");
const router = express.Router();

// List active rentals (page loads data via API client)
router.get("/", (req, res) => {
  res.render("return/list-active", {
    title: "Returns",
    subTitle: "Process Return",
    basePath: res.locals.basePath || "",
  });
});

// Process return form — rental loaded by frontend via GET /api/rentals/:id
router.get("/process/:id", (req, res) => {
  const rentalId = (req.params.id || "").trim();
  if (!rentalId) return res.redirect((res.locals.basePath || "") + "/return");
  res.render("return/process-return", {
    title: "Returns",
    subTitle: "Process Return",
    rentalId,
    basePath: res.locals.basePath || "",
  });
});

module.exports = router;
