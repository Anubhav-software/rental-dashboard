const express = require('express');
const router = express.Router();

// List invoices — client-side loads via invoiceApi.list(); filters in query for initial state
router.get('/list', (req, res) => {
  const query = {
    status: (req.query.status || '').trim(),
    customer_id: (req.query.customer_id || '').trim(),
    rental_id: (req.query.rental_id || '').trim(),
    issue_date_from: (req.query.issue_date_from || '').trim(),
    issue_date_to: (req.query.issue_date_to || '').trim(),
    page: Math.max(1, parseInt(req.query.page, 10) || 1),
    limit: Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20)),
  };
  res.render('invoice/list', {
    title: 'Invoices',
    subTitle: 'Invoice List',
    query,
  });
});

// View invoice by id
router.get('/view/:id', (req, res) => {
  res.render('invoice/view', {
    title: 'Invoice',
    subTitle: 'Invoice Details',
    invoiceId: req.params.id,
  });
});

// Manual create form
router.get('/add', (req, res) => {
  res.render('invoice/add', {
    title: 'Invoices',
    subTitle: 'Create Invoice',
  });
});

// Edit invoice (status, due_date, notes)
router.get('/edit/:id', (req, res) => {
  res.render('invoice/edit', {
    title: 'Invoice',
    subTitle: 'Edit Invoice',
    invoiceId: req.params.id,
  });
});

// Legacy routes (redirect to new paths when under owner/staff)
router.get('/add-new', (req, res) => {
  const base = (req.app.locals.basePath || res.locals.basePath || '').replace(/\/$/, '') || '/owner';
  return res.redirect(base + '/invoice/add');
});
router.get('/preview', (req, res) => {
  const base = (req.app.locals.basePath || res.locals.basePath || '').replace(/\/$/, '') || '/owner';
  return res.redirect(base + '/invoice/list');
});
router.get('/edit', (req, res) => {
  const base = (req.app.locals.basePath || res.locals.basePath || '').replace(/\/$/, '') || '/owner';
  return res.redirect(base + '/invoice/list');
});

module.exports = router;
