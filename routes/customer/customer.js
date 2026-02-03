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

// List customers (with optional search)
router.get("/", (req, res) => {
  let list = [...demoCustomers];
  const search = (req.query.search || "").trim().toLowerCase();
  if (search) {
    list = list.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(search) ||
        (c.phone || "").toLowerCase().includes(search) ||
        (c.email || "").toLowerCase().includes(search)
    );
  }
  res.render("customer/list-customers", {
    title: "Customers",
    subTitle: "Customer List",
    customers: list,
    query: { search: req.query.search || "" },
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
  return res.redirect((req.baseUrl || "") + "/customer");
});

// Edit customer form
router.get("/edit/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const customer = demoCustomers.find((c) => c.id === id);
  if (!customer) return res.redirect((req.baseUrl || "") + "/customer");
  res.render("customer/edit-customer", { title: "Customers", subTitle: "Edit Customer", customer, error: null });
});

// Edit customer submit
router.post("/edit/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const customer = demoCustomers.find((c) => c.id === id);
  if (!customer) return res.redirect((req.baseUrl || "") + "/customer");
  const body = req.body || {};
  const name = trim(body.name);
  const phone = trim(body.phone);
  if (!name || !phone) {
    return res.status(400).render("customer/edit-customer", {
      title: "Customers",
      subTitle: "Edit Customer",
      customer: { ...customer, ...body },
      error: "Name and Phone are required",
    });
  }
  const duplicate = demoCustomers.find(
    (c) => c.id !== id && (c.phone || "").replace(/\D/g, "") === (phone || "").replace(/\D/g, "")
  );
  if (duplicate) {
    return res.status(409).render("customer/edit-customer", {
      title: "Customers",
      subTitle: "Edit Customer",
      customer: { ...customer, ...body },
      error: "A customer with this phone number already exists",
    });
  }
  const isB2B = body.isBusinessCustomer === "on" || body.isBusinessCustomer === "1";
  customer.name = name;
  customer.phone = phone;
  customer.email = orNull(body.email);
  customer.nationality = orNull(body.nationality);
  customer.passportNumber = orNull(body.passportNumber);
  customer.hotelName = orNull(body.hotelName);
  customer.address = orNull(body.address);
  customer.customerPincode = orNull(body.customerPincode);
  customer.customerState = orNull(body.customerState);
  customer.idProofType = orNull(body.idProofType);
  customer.idProofNumber = orNull(body.idProofNumber);
  customer.licenseNumber = orNull(body.licenseNumber);
  customer.isBusinessCustomer = isB2B;
  customer.taxIdNumber = isB2B ? orNull(body.taxIdNumber) : null;
  customer.taxIdType = isB2B ? orNull(body.taxIdType) : null;
  customer.businessName = isB2B ? orNull(body.businessName) : null;
  customer.customerCompanyAddress = isB2B ? orNull(body.customerCompanyAddress) : null;
  customer.customerCompanyPincode = isB2B ? orNull(body.customerCompanyPincode) : null;
  customer.customerCompanyState = isB2B ? orNull(body.customerCompanyState) : null;
  return res.redirect((req.baseUrl || "") + "/customer");
});

// View customer
router.get("/view/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const customer = demoCustomers.find((c) => c.id === id);
  if (!customer) return res.redirect((req.baseUrl || "") + "/customer");
  res.render("customer/view-customer", { title: "Customers", subTitle: "View Customer", customer });
});

// Delete customer
router.post("/delete/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const idx = demoCustomers.findIndex((c) => c.id === id);
  if (idx !== -1) demoCustomers.splice(idx, 1);
  return res.redirect((req.baseUrl || "") + "/customer");
});

// Expose for rental module (customer dropdown)
router.demoCustomers = demoCustomers;
module.exports = router;
