const express = require("express");
const router = express.Router();

// Demo users (in-memory)
// NOTE: Phase 1 UI flow only. Later: replace with DB.
const demoUsers = [
  { id: 1, name: "Owner", email: "owner@example.com", password: "12345678", role: "OWNER" },
  { id: 2, name: "Staff", email: "staff@example.com", password: "12345678", role: "STAFF" },
];

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digit
}

router.get("/forgot-password", (req, res) => {
  res.render("authentication/forgotPassword", { title: "Dashboard", subTitle: "SubTitle", layout: "../views/layout/layout2" });
});

router.get("/signin", (req, res) => {
  res.render("authentication/signin", { title: "Dashboard", subTitle: "SubTitle", layout: "../views/layout/layout2" });
});

router.get("/signup", (req, res) => {
  res.render("authentication/signup", { title: "Dashboard", subTitle: "SubTitle", layout: "../views/layout/layout2" });
});

router.get("/verify-otp", (req, res) => {
  res.render("authentication/verifyOtp", {
    title: "Dashboard",
    subTitle: "SubTitle",
    layout: "../views/layout/layout2",
    maskedEmail: "",
  });
});

router.post("/signin", (req, res) => {
  const { email, password } = req.body || {};
  const user = demoUsers.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).render("authentication/signin", {
      title: "Dashboard",
      subTitle: "SubTitle",
      layout: "../views/layout/layout2",
      error: "Invalid email or password",
    });
  }

  const otp = generateOtp();
  req.session.pendingUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  req.session.pendingOtp = otp;
  return res.redirect("/authentication/verify-otp");
});

router.post("/signup", (req, res) => {
  const { name, email, password, role: rawRole } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).render("authentication/signup", {
      title: "Dashboard",
      subTitle: "SubTitle",
      layout: "../views/layout/layout2",
      error: "Please fill all fields",
    });
  }

  const role = rawRole === "STAFF" ? "STAFF" : "OWNER";

  const existing = demoUsers.find((u) => u.email === email);
  if (existing) {
    return res.status(409).render("authentication/signup", {
      title: "Dashboard",
      subTitle: "SubTitle",
      layout: "../views/layout/layout2",
      error: "Email already exists (demo)",
    });
  }

  const newUser = { id: demoUsers.length + 1, name, email, password, role };
  demoUsers.push(newUser);

  const otp = generateOtp();
  req.session.pendingUser = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
  req.session.pendingOtp = otp;
  return res.redirect("/authentication/verify-otp");
});

router.post("/verify-otp", (req, res) => {
  const { otp } = req.body || {};
  if (!req.session?.pendingOtp || !req.session?.pendingUser) return res.redirect("/authentication/signin");

  if (String(otp || "").trim() !== String(req.session.pendingOtp)) {
    return res.status(401).render("authentication/verifyOtp", {
      title: "Dashboard",
      subTitle: "SubTitle",
      layout: "../views/layout/layout2",
      maskedEmail: req.session.pendingUser.email.replace(/(.{2}).+(@.+)/, "$1****$2"),
      demoOtp: req.session.pendingOtp,
      error: "Invalid OTP. Please try again.",
    });
  }

  // OTP verified: set logged-in user
  req.session.user = req.session.pendingUser;
  req.session.pendingUser = null;
  req.session.pendingOtp = null;

  const role = req.session.user.role;
  return res.redirect(role === "STAFF" ? "/staff/dashboard/index5" : "/owner/dashboard/index5");
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/authentication/signin");
  });
});

module.exports = router;
