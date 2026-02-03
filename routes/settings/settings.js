  const express = require('express');
  const router = express.Router();
  const { demoCompany } = require('../company-data/company-data');

  router.get('/company', (req, res) => {
    res.render('settings/company', {
      title: 'Company',
      subTitle: 'Settings - Company',
      company: demoCompany,
      error: null,
    });
  });

  router.post('/company', (req, res) => {
    const body = req.body || {};
    const num = (x) => (x !== '' && x != null ? parseFloat(String(x)) : null);
    demoCompany.name = (body.name || '').trim() || demoCompany.name;
    demoCompany.phone = (body.phone || '').trim() || '';
    demoCompany.email = (body.email || '').trim() || '';
    demoCompany.address = (body.address || '').trim() || '';
    demoCompany.country = (body.country || '').trim() || '';
    demoCompany.currency_code = (body.currency_code || '').trim() || 'INR';
    demoCompany.currency_symbol = (body.currency_symbol || '').trim() || '₹';
    demoCompany.operating_hours_start = (body.operating_hours_start || '').trim() || '08:00';
    demoCompany.operating_hours_end = (body.operating_hours_end || '').trim() || '18:00';
    demoCompany.contract_number_prefix = (body.contract_number_prefix || '').trim() || 'CNT';
    demoCompany.invoice_number_prefix = (body.invoice_number_prefix || '').trim() || 'INV';
    demoCompany.default_charge_calculation_method = ['DAILY', 'WEEKLY', 'MONTHLY', 'HOURLY'].includes(body.default_charge_calculation_method) ? body.default_charge_calculation_method : 'DAILY';
    demoCompany.enable_hourly_rates = body.enable_hourly_rates === 'on' || body.enable_hourly_rates === '1';
    demoCompany.enable_daily_rates = body.enable_daily_rates === 'on' || body.enable_daily_rates === '1';
    demoCompany.enable_weekly_rates = body.enable_weekly_rates === 'on' || body.enable_weekly_rates === '1';
    demoCompany.enable_monthly_rates = body.enable_monthly_rates === 'on' || body.enable_monthly_rates === '1';
    demoCompany.terms_and_conditions = (body.terms_and_conditions || '').trim() || null;
    demoCompany.tax_system_name = (body.tax_system_name || '').trim() || null;
    demoCompany.tax_percentage = num(body.tax_percentage);
    demoCompany.tax_registration_number = (body.tax_registration_number || '').trim() || null;
    demoCompany.enable_tax_invoicing = body.enable_tax_invoicing === 'on' || body.enable_tax_invoicing === '1';
    demoCompany.enable_invoice_module = body.enable_invoice_module === 'on' || body.enable_invoice_module === '1';
    demoCompany.default_invoice_type = body.default_invoice_type === 'B2B' ? 'B2B' : 'B2C';
    demoCompany.expense_approval_threshold = num(body.expense_approval_threshold) != null ? num(body.expense_approval_threshold) : 5000;
    return res.redirect((req.baseUrl || '') + '/settings/company');
  });
  
  router.get('/currencies',(req, res)=>{
      res.render('settings/currencies', {title: "Currencies", subTitle:"Settings - Currencies"})
  });
  
  router.get('/languages',(req, res)=>{
      res.render('settings/languages', {title: "Languages", subTitle:"Settings - Languages"})
  });
  
  router.get('/notification',(req, res)=>{
      res.render('settings/notification', {title: "Notification", subTitle:"Settings - Notification"})
  });
  
  router.get('/notification-alert',(req, res)=>{
      res.render('settings/notificationAlert', {title: "Notification Alert", subTitle:"Settings - Notification Alert"})
  });
  
  router.get('/payment-getway',(req, res)=>{
      res.render('settings/paymentGetway', {title: "Payment Getway", subTitle:"Settings - Payment Getway"})
  });
  
  router.get('/theme',(req, res)=>{
      res.render('settings/theme', {title: "Theme", subTitle:"Settings - Theme"})
  });
  
  
  module.exports = router;
