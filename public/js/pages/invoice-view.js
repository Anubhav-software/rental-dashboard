/**
 * Invoice view page: load via invoiceApi.getById(id), show snapshot + line items.
 * Layout matches PDF: company logo, Bill to & details, line items (4 cols), totals.
 */
(function () {
  var card = document.getElementById('invoice-view-card');
  var loadingEl = document.getElementById('invoice-view-loading');
  var contentEl = document.getElementById('invoice-view-content');
  var errorEl = document.getElementById('invoice-view-error');
  if (!card) return;
  var invoiceId = card.getAttribute('data-invoice-id');
  var basePath = (card.getAttribute('data-base-path') || '').replace(/\/$/, '') || (window.location.pathname.indexOf('/staff') === 0 ? '/staff' : '/owner');

  function esc(s) {
    if (s == null || s === undefined) return '';
    var str = String(s);
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function showError(msg) {
    if (loadingEl) loadingEl.classList.add('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    if (errorEl) {
      errorEl.textContent = msg || 'Invoice not found';
      errorEl.classList.remove('d-none');
    }
    if (typeof window.showToast === 'function') window.showToast(msg || 'Failed to load invoice', 'error');
  }

  function formatDate(d) {
    if (!d) return '—';
    var s = typeof d === 'string' ? d : (d instanceof Date ? d.toISOString() : String(d));
    return s.slice(0, 10);
  }

  function formatNum(n) {
    if (n == null || n === undefined) return '0.00';
    return Number(n).toFixed(2);
  }

  if (!invoiceId) {
    showError('Invalid invoice');
    return;
  }
  if (!window.invoiceApi || !window.invoiceApi.getById) {
    showError('Invoice API not loaded');
    return;
  }

  window.invoiceApi.getById(invoiceId)
    .then(function (data) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) errorEl.classList.add('d-none');
      if (!contentEl) return;
      contentEl.classList.remove('d-none');

      var inv = data.invoice || data;
      var sym = inv.currencySymbol || '';
      var companyName = (inv.company && inv.company.name) ? inv.company.name : 'Company';
      var logoUrl = '';
      if (inv.company && inv.company.logo) {
        var raw = String(inv.company.logo).trim();
        logoUrl = raw.indexOf('http') === 0 ? raw : ((window.API_BASE_URL || '').replace(/\/$/, '') + '/uploads/Company-logos/' + raw);
      }

      var logoWrapHtml = logoUrl
        ? '<div class="invoice-view-logo-wrap"><img src="' + esc(logoUrl) + '" class="invoice-view-logo" alt=""></div>'
        : '<div class="invoice-view-logo-wrap"></div>';
      var headerLeftHtml = '<div class="invoice-view-brand">' + logoWrapHtml + '</div>';
      var badgeHtml = '<div class="invoice-view-badge">' +
        '<iconify-icon icon="hugeicons:invoice-03" class="invoice-view-badge-icon"></iconify-icon>' +
        '<span>Invoice ' + esc(inv.invoiceNumber || '') + '</span></div>';
      var dueDateStr = inv.dueDate ? formatDate(inv.dueDate) : 'N/A (invoice issued after payment)';
      var vehicleDisplay = [inv.vehicleDocumentNumber, inv.vehicleMakeModel].filter(Boolean).join(' ').trim();
      var vehicleRow = vehicleDisplay ? '<tr><th>Vehicle</th><td>' + esc(vehicleDisplay) + '</td></tr>' : '';
      var rentalPeriodRow = (inv.rentalStartDate || inv.rentalEndDate)
        ? '<tr><th>Rental period</th><td>' + formatDate(inv.rentalStartDate) + ' – ' + formatDate(inv.rentalEndDate) + '</td></tr>'
        : '';
      var contractRow = inv.contractNumber ? '<tr><th>Contract</th><td>' + esc(inv.contractNumber) + '</td></tr>' : '';

      var lineItems = Array.isArray(inv.lineItems) ? inv.lineItems : [];
      var rows = lineItems.map(function (item) {
        var qty = item.quantity != null ? item.quantity : 1;
        var unitPrice = item.unit_price != null ? item.unit_price : (item.amount != null ? item.amount : 0);
        var amt = item.amount != null ? item.amount : 0;
        return '<tr><td>' + esc(item.description || '') + '</td><td class="text-end">' + qty + '</td><td class="text-end">' + formatNum(unitPrice) + '</td><td class="text-end">' + formatNum(amt) + '</td></tr>';
      }).join('');

      var notesHtml = (inv.notes && String(inv.notes).trim()) ? '<div class="invoice-view-notes">' + esc(inv.notes) + '</div>' : '';

      contentEl.innerHTML =
        '<div class="invoice-view-wrap">' +
          '<div class="d-flex flex-wrap gap-2 mb-24">' +
            '<a href="' + basePath + '/invoice/list" class="btn btn-sm border border-neutral-400 radius-8">Back to list</a>' +
            '<a href="' + basePath + '/invoice/edit/' + encodeURIComponent(inv.id) + '" class="btn btn-sm btn-success radius-8">Edit</a>' +
            '<button type="button" class="btn btn-sm btn-warning radius-8 invoice-send-pdf-btn" data-invoice-id="' + encodeURIComponent(inv.id) + '">Send PDF</button>' +
          '</div>' +
          '<div class="invoice-view-header">' +
            headerLeftHtml +
            badgeHtml +
          '</div>' +
          '<p class="invoice-view-section-title">Bill to &amp; details</p>' +
          '<table class="invoice-view-meta">' +
            '<tr><th>Customer</th><td>' + esc(inv.customerName || '') + '</td></tr>' +
            '<tr><th>Email</th><td>' + esc(inv.customerEmail || '') + '</td></tr>' +
            '<tr><th>Phone</th><td>' + esc(inv.customerPhone || '') + '</td></tr>' +
            '<tr><th>Issue date</th><td>' + formatDate(inv.issueDate) + '</td></tr>' +
            '<tr><th>Due date</th><td>' + dueDateStr + '</td></tr>' +
            vehicleRow + rentalPeriodRow + contractRow +
          '</table>' +
          '<p class="invoice-view-section-title">Line items</p>' +
          '<table class="invoice-view-table">' +
            '<thead><tr><th>Description</th><th class="text-end">Qty</th><th class="text-end">Unit price</th><th class="text-end">Amount</th></tr></thead>' +
            '<tbody>' + (rows || '<tr><td colspan="4" class="text-center text-secondary-light">No line items</td></tr>') + '</tbody>' +
          '</table>' +
          '<div class="invoice-view-totals">' +
            '<table class="invoice-view-totals-table">' +
              '<tr><td class="text-end text-secondary-light">Subtotal (' + esc(inv.currencyCode || '') + ')</td><td class="text-end fw-semibold">' + sym + ' ' + formatNum(inv.subtotal) + '</td></tr>' +
              '<tr><td class="text-end text-secondary-light">Tax (' + formatNum(inv.taxPercentage) + '%)</td><td class="text-end fw-semibold">' + sym + ' ' + formatNum(inv.taxAmount) + '</td></tr>' +
              '<tr class="invoice-view-total-row"><td class="text-end">Total</td><td class="text-end">' + sym + ' ' + formatNum(inv.totalAmount) + '</td></tr>' +
            '</table>' +
          '</div>' +
          notesHtml +
        '</div>';

      var btn = contentEl.querySelector('.invoice-send-pdf-btn');
      if (btn && window.Swal && window.invoiceApi.sendPdf) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-invoice-id');
          window.Swal.fire({ title: 'Send PDF?', text: 'Send invoice PDF to customer email?', icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, send', cancelButtonText: 'Cancel' })
            .then(function (result) {
              if (result.isConfirmed) {
                window.invoiceApi.sendPdf(id).then(function () {
                  if (typeof window.showToast === 'function') window.showToast('PDF sent to customer email', 'success');
                }).catch(function (err) {
                  if (typeof window.showToast === 'function') window.showToast(err.message || err.data?.error || 'Failed to send PDF', 'error');
                });
              }
            });
        });
      }
    })
    .catch(function (err) {
      showError(err.message || err.data?.error || 'Failed to load invoice');
    });
})();
