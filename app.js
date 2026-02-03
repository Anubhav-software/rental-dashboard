const express = require("express");
const path = require("path");
const expressLayouts = require('express-ejs-layouts')
const session = require("express-session");
const app = express();

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session (Auth + OTP demo)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "rental_dashboard_dev_secret",
    resave: false,
    saveUninitialized: false,
  })
);

// Make user available to all views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.pendingOtp = Boolean(req.session.pendingOtp);
  next();
});

app.use(express.static('public'));

app.use(expressLayouts)
app.set('layout', './layout/layout')

// Set up views directory and view engine
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use('/css', express.static(__dirname + 'public/css'));
app.use('/fonts', express.static(__dirname + 'public/fonts'));
app.use('/images', express.static(__dirname + 'public/images'));
app.use('/js', express.static(__dirname + 'public/js'));
app.use('/webfonts', express.static(__dirname + 'public/webfonts'));

// Import Router File & Define All Routes
const pageRouter = require('./routes/routes');

pageRouter(app); // Pass the app object to the pageRouter function

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));  