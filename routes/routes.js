// Import required modules
const express = require("express");

// Create a router
const router = express.Router();

const ai = require("./ai/ai");
const authentication = require("./authentication/authentication");
const blog = require("./blog/blog");
const chart = require("./chart/chart");
const components = require("./components/components");
const cryptoCurrency = require("./cryptoCurrency/cryptoCurrency");
const dashboard = require("./dashboard/dashboard");
const forms = require("./forms/forms");
const invoice = require("./invoice/invoice");
const rolesAndAccess = require("./rolesAndAccess/rolesAndAccess");
const settings = require("./settings/settings");
const table = require("./table/table");
const users = require("./users/users");
const vehicle = require("./vehicle/vehicle");
const customer = require("./customer/customer");
const rental = require("./rental/rental");
const returnRoutes = require("./return/return");
const expense = require("./expense/expense");
const calendarRouter = require("./calendar/calendar");
const reports = require("./reports/reports");

function requireAuth(req, res, next) {
  if (req.session?.user) return next();
  // if OTP pending, go to verify
  if (req.session?.pendingOtp) return res.redirect("/authentication/verify-otp");
  return res.redirect("/authentication/signin");
}

router.get("/", (req, res) => res.redirect("/authentication/signin"));
router.get("/index", (req, res) => res.redirect("/authentication/signin"));

// Default owner: bina /owner ya /staff prefix ke dashboard paths → /owner/... redirect (jab tak APIs/role fix nahi)
router.use((req, res, next) => {
  const p = req.path;
  if (p.startsWith("/owner") || p.startsWith("/staff")) return next();
  const prefixes = ["/vehicle", "/customer", "/rental", "/return", "/expense", "/calendar", "/reports", "/settings", "/dashboard", "/users"];
  if (prefixes.some((prefix) => p === prefix || p.startsWith(prefix + "/"))) {
    return res.redirect(302, "/owner" + p);
  }
  next();
});

router.get("/blankpage", (req, res) => {
  res.render("blankpage", { title: "Blank Page", subTitle: "Blank Page" });
});


router.get("/chat", (req, res) => {
  res.render("chat", { title: "Chat", subTitle: "Chat" });
});

router.get("/chat-profile", (req, res) => {
  res.render("chatProfile", { title: "Dashboard", subTitle: "subTitle" });
});

router.get("/comingsoon", (req, res) => {
  res.render("comingsoon", { title: "Dashboard", subTitle: "subTitle", layout: "../views/layout/layout2" });
});

router.get("/email", (req, res) => {
  res.render("email", { title: "Email", subTitle: "Components / Email" });
});

router.get("/faqs", (req, res) => {
  res.render("faqs", { title: "Faq", subTitle: "Faq" });
});

router.get("/gallery", (req, res) => {
  res.render("gallery", { title: "Gallery", subTitle: "Gallery" });
});

router.get("/kanban", (req, res) => {
  res.render("kanban", { title: "Kanban", subTitle: "Kanban" });
});

router.get("/maintenance", (req, res) => {
  res.render("maintenance", { title: "Dashboard", subTitle: "subTitle", layout: "../views/layout/layout2" });
});

router.get("/not-found", (req, res) => {
  res.render("notFound", { title: "404", subTitle: "404" });
});

router.get("/pricing", (req, res) => {
  res.render("pricing", { title: "Pricing", subTitle: "Pricing" });
});

router.get("/stared", (req, res) => {
  res.render("stared", { title: "Dashboard", subTitle: "subTitle" });
});

router.get("/terms-and-conditions", (req, res) => {
  res.render("termsAndConditions", { title: "Terms & Conditions", subTitle: "Terms & Conditions" });
});

router.get("/testimonials", (req, res) => {
  res.render("testimonials", { title: "Testimonials", subTitle: "Testimonials" });
});

router.get("/view-details", (req, res) => {
  res.render("viewDetails", { title: "Dashboard", subTitle: "subTitle" });
});

router.get("/widgets", (req, res) => {
  res.render("widgets", { title: "Widgets", subTitle: "Widgets" });
});

router.use("/ai", ai);
router.use("/authentication", authentication);
router.use("/blog", blog);
router.use("/chart", chart);
router.use("/components", components);
router.use("/crypto-currency", cryptoCurrency);
router.use("/forms", forms);
router.use("/invoice", invoice);
router.use("/role-and-access", rolesAndAccess);
router.use("/table", table);

// Owner and Staff prefixed routes (same modules under both; basePath set per prefix)
const ownerRoutes = express.Router();
const staffRoutes = express.Router();

function mountDashboardModules(router, basePath) {
  router.use((req, res, next) => {
    res.locals.basePath = basePath;
    next();
  });
  router.use("/dashboard", dashboard);
  router.use("/vehicle", vehicle);
  router.use("/customer", customer);
  router.use("/rental", rental);
  router.use("/return", returnRoutes);
  router.use("/expense", expense);
  router.use("/calendar", calendarRouter);
  router.use("/reports", reports);
  router.use("/settings", settings);
  router.use("/users", users);
}

mountDashboardModules(ownerRoutes, "/owner");
mountDashboardModules(staffRoutes, "/staff");

// Dashboard auth is JWT-based (authApi + authGuard). Session-based requireAuth would
// redirect API-login users back to sign-in because req.session.user is never set.
router.use("/owner", ownerRoutes);
router.use("/staff", staffRoutes);

// Export the router
module.exports = function (app) {
  app.use("/", router);
};
