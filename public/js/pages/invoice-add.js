/**
 * Invoice add page (manual): customer dropdown + line items; POST /api/invoices (no rental_id).
 */
(function () {
  var card = document.getElementById('invoice-add-card');
  var loadingEl = document.getElementById('invoice-add-loading');
  var contentEl = document.getElementById('invoice-add-content');
  var errorEl = document.getElementById('invoice-add-error');
  var tbody = document.getElementById('invoice-add-line-tbody');
  var basePath = (card && card.getAttribute('data-base-path')) || '';
  basePath = (basePath || '').replace(/\/$/, '') || (window.location.pathname.indexOf('/staff') === 0 ? '/staff' : '/owner');

  function showError(msg) {
    if (loadingEl) loadingEl.classList.add('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    if (errorEl) {
      errorEl.textContent = msg || 'Error';
      errorEl.classList.remove('d-none');
    }
    if (typeof window.showToast === 'function') window.showToast(msg || 'Error', 'error');
  }

  function lineRowHtml() {
    return '<tr class="invoice-line-row">' +
      '<td><input type="text" name="line_description" class="form-control form-control-sm" placeholder="Description" required></td>' +
      '<td><input type="number" name="line_quantity" class="form-control form-control-sm" min="0" step="1" value="1"></td>' +
      '<td><input type="number" name="line_unit_price" class="form-control form-control-sm" min="0" step="0.01" value="0" placeholder="0"></td>' +
      '<td><input type="number" name="line_amount" class="form-control form-control-sm line-amount" min="0" step="0.01" value="0" placeholder="0" required></td>' +
      '<td><button type="button" class="btn btn-sm btn-outline-danger p-0 border-0 remove-line-row" title="Remove">×</button></td></tr>';
  }

  function bindRemoveRows() {
    if (!tbody) return;
    tbody.querySelectorAll('.remove-line-row').forEach(function (btn) {
      if (btn._bound) return;
      btn._bound = true;
      btn.addEventListener('click', function () {
        var row = btn.closest('tr');
        var rows = tbody.querySelectorAll('.invoice-line-row');
        if (rows.length <= 1) return;
        if (row) row.remove();
      });
    });
  }

  function init() {
    if (!card) return;
    if (!window.customerApi || !window.customerApi.list) {
      showError('Customer API not loaded');
      return;
    }
    var fetchFn = window.fetchAllCustomers ? window.fetchAllCustomers() : window.customerApi.list({ limit: 100 }).then(function (r) { return (r && r.customers) ? r.customers : []; });
    fetchFn.then(function (list) {
      list = Array.isArray(list) ? list : (list && list.length ? list : []);
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) errorEl.classList.add('d-none');
      if (!contentEl) return;
      contentEl.classList.remove('d-none');
      var sel = contentEl.querySelector('#invoice-add-customer');
      if (sel) {
        sel.innerHTML = '<option value="">Select customer</option>';
        list.forEach(function (c) {
          var opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = (c.name || '') + (c.phone ? ' – ' + c.phone : '');
          sel.appendChild(opt);
        });
        if (window.attachSearchToSelect) window.attachSearchToSelect(sel, 'Search customer…');
      }
      var addRowBtn = document.getElementById('invoice-add-line-row');
      if (addRowBtn && tbody) {
        addRowBtn.addEventListener('click', function () {
          tbody.insertAdjacentHTML('beforeend', lineRowHtml());
          bindRemoveRows();
        });
      }
      bindRemoveRows();
      var form = document.getElementById('invoice-add-form');
      if (form && window.invoiceApi && window.invoiceApi.createManual) {
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var customerId = (form.customer_id && form.customer_id.value) || '';
          if (!customerId.trim()) {
            if (window.showToast) window.showToast('Select a customer', 'error');
            return;
          }
          var rows = tbody.querySelectorAll('.invoice-line-row');
          var lineItems = [];
          rows.forEach(function (tr) {
            var desc = (tr.querySelector('input[name="line_description"]') || {}).value;
            var qty = parseFloat((tr.querySelector('input[name="line_quantity"]') || {}).value, 10);
            var unitPrice = parseFloat((tr.querySelector('input[name="line_unit_price"]') || {}).value, 10);
            var amount = parseFloat((tr.querySelector('input[name="line_amount"]') || {}).value, 10);
            if (!desc || !String(desc).trim()) return;
            if (isNaN(amount)) amount = 0;
            if (isNaN(qty) || qty < 0) qty = 1;
            if (isNaN(unitPrice) || unitPrice < 0) unitPrice = amount;
            lineItems.push({ description: String(desc).trim(), quantity: qty, unit_price: unitPrice, amount: amount });
          });
          if (lineItems.length === 0) {
            if (window.showToast) window.showToast('Add at least one line item', 'error');
            return;
          }
          var body = {
            customer_id: customerId.trim(),
            invoice_type: (form.invoice_type && form.invoice_type.value) || 'B2C',
            line_items: lineItems,
            due_date: (form.due_date && form.due_date.value) ? form.due_date.value : null,
            notes: (form.notes && form.notes.value) ? String(form.notes.value).trim() || null,
          };
          var submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.disabled = true;
          window.invoiceApi.createManual(body).then(function (data) {
            var inv = data.invoice;
            if (window.showToast) window.showToast('Invoice ' + (inv && inv.invoiceNumber ? inv.invoiceNumber : '') + ' created', 'success');
            if (inv && inv.id) window.location.href = basePath + '/invoice/view/' + encodeURIComponent(inv.id);
            else window.location.href = basePath + '/invoice/list';
          }).catch(function (err) {
            if (submitBtn) submitBtn.disabled = false;
            var msg = (err.data && err.data.error) ? err.data.error : (err.message || 'Failed to create invoice');
            if (window.showToast) window.showToast(msg, 'error');
          });
        });
      }
    }).catch(function (err) {
      showError(err.message || 'Failed to load customers');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
