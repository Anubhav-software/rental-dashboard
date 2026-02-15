const express = require("express");
const router = express.Router();

// Demo customers (in-memory). Schema-aligned with workflow.md. Later: replace with DB.
const demoCustomers = [
  {
    id: 1,
    name: "Raj Kumar",
    phone: "9876543210",
    email: "raj@example.com",
    nationality: "Indian",
    passportNumber: "A12345678",
    hotelName: "Grand Hotel",
    address: "123 MG Road, Bangalore",
    customerPincode: "560001",
    customerState: "Karnataka",
    idProofType: "Aadhaar",
    idProofNumber: "XXXX-XXXX-1234",
    licenseNumber: "KA01-2020-1234567",
    isBusinessCustomer: false,
    taxIdNumber: null,
    taxIdType: null,
    businessName: null,
    customerCompanyAddress: null,
    customerCompanyPincode: null,
    customerCompanyState: null,
  },
  {
    id: 2,
    name: "ABC Travels Pvt Ltd",
    phone: "9123456789",
    email: "accounts@abctravels.com",
    nationality: "Indian",
    passportNumber: "",
    hotelName: "",
    address: "45 Park Street, Kolkata",
    customerPincode: "700016",
    customerState: "West Bengal",
    idProofType: "GST",
    idProofNumber: "27AABCU9603R1ZM",
    licenseNumber: "",
    isBusinessCustomer: true,
    taxIdNumber: "27AABCU9603R1ZM",
    taxIdType: "GST",
    businessName: "ABC Travels Pvt Ltd",
    customerCompanyAddress: "45 Park Street, Kolkata",
    customerCompanyPincode: "700016",
    customerCompanyState: "West Bengal",
  },
  {
    id: 3,
    name: "Priya Sharma",
    phone: "8765432109",
    email: "priya@gmail.com",
    nationality: "Indian",
    passportNumber: "",
    hotelName: "Beach Resort",
    address: "Goa Beach Road",
    customerPincode: "403001",
    customerState: "Goa",
    idProofType: "Aadhaar",
    idProofNumber: "",
    licenseNumber: "GA02-2019-9876543",
    isBusinessCustomer: false,
    taxIdNumber: null,
    taxIdType: null,
    businessName: null,
    customerCompanyAddress: null,
    customerCompanyPincode: null,
    customerCompanyState: null,
  },
];

let nextId = 4;

const trim = (x) => (x != null && typeof x === "string" ? x.trim() : "");
const orNull = (x) => (trim(x) === "" ? null : trim(x));

// List customers — data loaded client-side via GET /api/customers (search, page, limit)
router.get("/", (req, res) => {
  res.render("customer/list-customers", {
    title: "Customers",
    subTitle: "Customer List",
    query: { search: req.query.search || "", page: req.query.page || 1, limit: req.query.limit || 20 },
  });
});

// Add customer form
router.get("/add", (req, res) => {
  res.render("customer/add-customer", { title: "Customers", subTitle: "Add Customer", customer: null, error: null });
});

// Add customer submit
router.post("/add", (req, res) => {
  const body = req.body || {};
  const name = trim(body.name);
  const phone = trim(body.phone);
  if (!name || !phone) {
    return res.status(400).render("customer/add-customer", {
      title: "Customers",
      subTitle: "Add Customer",
      customer: body,
      error: "Name and Phone are required",
    });
  }
  const existing = demoCustomers.find((c) => (c.phone || "").replace(/\D/g, "") === (phone || "").replace(/\D/g, ""));
  if (existing) {
    return res.status(409).render("customer/add-customer", {
      title: "Customers",
      subTitle: "Add Customer",
      customer: body,
      error: "A customer with this phone number already exists",
    });
  }
  const isB2B = body.isBusinessCustomer === "on" || body.isBusinessCustomer === "1";
  const newCustomer = {
    id: nextId++,
    name,
    phone,
    email: orNull(body.email),
    nationality: orNull(body.nationality),
    passportNumber: orNull(body.passportNumber),
    hotelName: orNull(body.hotelName),
    address: orNull(body.address),
    customerPincode: orNull(body.customerPincode),
    customerState: orNull(body.customerState),
    idProofType: orNull(body.idProofType),
    idProofNumber: orNull(body.idProofNumber),
    licenseNumber: orNull(body.licenseNumber),
    isBusinessCustomer: isB2B,
    taxIdNumber: isB2B ? orNull(body.taxIdNumber) : null,
    taxIdType: isB2B ? orNull(body.taxIdType) : null,
    businessName: isB2B ? orNull(body.businessName) : null,
    customerCompanyAddress: isB2B ? orNull(body.customerCompanyAddress) : null,
    customerCompanyPincode: isB2B ? orNull(body.customerCompanyPincode) : null,
    customerCompanyState: isB2B ? orNull(body.customerCompanyState) : null,
  };
  demoCustomers.push(newCustomer);
  var listPath = (req.baseUrl || "").replace(/\/$/, "");
  return res.redirect(listPath);
});

// Edit customer — data loaded client-side via GET /api/customers/:id, submit via PATCH /api/customers/:id
router.get("/edit/:id", (req, res) => {
  res.render("customer/edit-customer", {
    title: "Customers",
    subTitle: "Edit Customer",
    customerId: req.params.id,
  });
});

// View customer — data loaded client-side via GET /api/customers/:id
router.get("/view/:id", (req, res) => {
  res.render("customer/view-customer", {
    title: "Customers",
    subTitle: "View Customer",
    customerId: req.params.id,
  });
});

// Delete customer — handled client-side via DELETE /api/customers/:id (list page)

// Expose for rental module (customer dropdown)
router.demoCustomers = demoCustomers;
module.exports = router;
