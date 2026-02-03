/**
 * In-memory company (single-tenant for now). Schema as per workflow.md companies table.
 * Other modules (rental, expense, settings) use this for currency, prefix, threshold, etc.
 * When DB is added: replace with company_id from session and fetch from DB.
 */
const demoCompany = {
  id: 1,
  name: "Rental Co",
  phone: "+91 9876543210",
  email: "info@rentalco.com",
  address: "123 Main Street, City",
  country: "India",
  currency_code: "INR",
  currency_symbol: "₹",
  operating_hours_start: "08:00",
  operating_hours_end: "18:00",
  contract_number_prefix: "CNT",
  invoice_number_prefix: "INV",
  default_charge_calculation_method: "DAILY",
  enable_hourly_rates: true,
  enable_daily_rates: true,
  enable_weekly_rates: true,
  enable_monthly_rates: true,
  terms_and_conditions: "Standard rental terms apply. Vehicle must be returned on time.",
  tax_system_name: "GST",
  tax_percentage: 18,
  tax_registration_number: "",
  enable_tax_invoicing: false,
  enable_invoice_module: false,
  enable_irn_system: false,
  irn_api_endpoint: null,
  default_invoice_type: "B2C",
  expense_approval_threshold: 5000,
};

module.exports = { demoCompany };
