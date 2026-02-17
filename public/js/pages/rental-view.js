/**
 * View Rental: load via rentalApi.getById(id, true), render contract-style layout.
 */
(function () {
  var root = document.getElementById('rental-view-root');
  if (!root) return;
  var rentalId = root.getAttribute('data-rental-id');
  var basePath = (root.getAttribute('data-base-path') || '').replace(/\/$/, '');
  if (!basePath || /\/rental$/.test(basePath)) basePath = (typeof window !== 'undefined' && window.location.pathname.indexOf('/staff') === 0) ? '/staff' : '/owner';

  var loadingEl = document.getElementById('rental-view-loading');
  var contentEl = document.getElementById('rental-view-content');
  var errorEl = document.getElementById('rental-view-error');

  function esc(s) {
    if (s == null || s === undefined) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmtDate(d, time) {
    if (!d) return '';
    var s = typeof d === 'string' ? d : (d instanceof Date ? d.toISOString() : String(d));
    var datePart = s.slice(0, 10);
    return time ? datePart + ' ' + (time || '') : datePart;
  }

  function statusBadge(status) {
    if (status === 'ACTIVE') return '<span class="bg-success-focus text-success-600 border border-success-main px-20 py-8 radius-8 fw-medium text-sm">Active</span>';
    if (status === 'COMPLETED') return '<span class="bg-info-focus text-info-600 border border-info-main px-20 py-8 radius-8 fw-medium text-sm">Completed</span>';
    return '<span class="bg-neutral-200 text-neutral-600 border border-neutral-400 px-20 py-8 radius-8 fw-medium text-sm">Cancelled</span>';
  }

  function render(r) {
    var v = r.vehicle || {};
    var c = r.customer || {};
    var custName = (c.name || '-');
    var vehText = ((v.make || '') + ' ' + (v.model || '')).trim() || '-';
    var sym = r.currencySymbol || '';

    var html = '<div class="card border radius-16 overflow-hidden mb-24 bg-primary-50 border-primary-200">' +
      '<div class="card-body py-24 px-24"><div class="row align-items-center">' +
      '<div class="col-auto"><div class="w-64-px h-64-px rounded-12 bg-primary-100 d-flex align-items-center justify-content-center">' +
      '<iconify-icon icon="mdi:file-document-outline" class="text-primary-600" style="font-size: 2rem;"></iconify-icon></div></div>' +
      '<div class="col"><h5 class="fw-semibold text-primary-light mb-4">Contract ' + esc(r.contractNumber) + '</h5>' +
      '<p class="text-sm text-secondary-light mb-0">' + esc(custName) + ' · ' + esc(vehText) + '</p>' +
      '<p class="text-sm text-secondary-light mb-0 mt-4">' + esc(fmtDate(r.startDate, r.startTime)) + ' — ' + esc(fmtDate(r.endDate, r.endTime)) + '</p></div>' +
      '<div class="col-auto">' + statusBadge(r.status) + '</div>' +
      '<div class="col-auto d-flex gap-2">';
    if (r.status === 'ACTIVE') {
      html += '<a href="' + basePath + '/rental/edit/' + encodeURIComponent(r.id) + '" class="btn btn-outline-primary btn-sm radius-8 d-flex align-items-center gap-2"><iconify-icon icon="lucide:edit"></iconify-icon> Edit</a>';
      html += '<a href="' + basePath + '/return/process/' + encodeURIComponent(r.id) + '" class="btn btn-primary btn-sm radius-8 d-flex align-items-center gap-2"><iconify-icon icon="mdi:backup-restore"></iconify-icon> Process return</a>';
    }
    if (r.status === 'COMPLETED') {
      if (r.hasInvoice) {
        html += '<span class="btn btn-secondary btn-sm radius-8 d-flex align-items-center gap-2 disabled" title="Invoice already generated"><iconify-icon icon="hugeicons:invoice-03"></iconify-icon> Invoice generated</span>';
      } else {
        html += '<button type="button" class="btn btn-primary btn-sm radius-8 d-flex align-items-center gap-2 rental-generate-invoice-btn" data-rental-id="' + esc(r.id) + '"><iconify-icon icon="hugeicons:invoice-03"></iconify-icon> Generate invoice</button>';
      }
    }
    html += '<button type="button" class="btn btn-outline-secondary btn-sm radius-8 d-flex align-items-center gap-2" onclick="window.print()"><iconify-icon icon="mdi:printer-outline"></iconify-icon> Print</button>' +
      '<a href="' + basePath + '/rental" class="btn btn-outline-secondary btn-sm radius-8 d-flex align-items-center gap-2"><iconify-icon icon="mdi:arrow-left"></iconify-icon> Back</a></div></div></div></div>';

    html += '<div class="row g-3">';
    html += '<div class="col-lg-6"><div class="card border radius-12 h-100 overflow-hidden">' +
      '<div class="card-header bg-neutral-50 border-bottom py-14 px-20"><h6 class="text-sm fw-semibold text-primary-light mb-0">Rental Period & Rate</h6></div>' +
      '<div class="card-body p-20">' +
      '<div class="d-flex align-items-center py-10 border-bottom border-neutral-200"><span class="text-secondary-light text-sm" style="width: 140px;">Start</span><span class="fw-medium text-primary-light">' + esc(fmtDate(r.startDate, r.startTime)) + '</span></div>' +
      '<div class="d-flex align-items-center py-10 border-bottom border-neutral-200"><span class="text-secondary-light text-sm" style="width: 140px;">End</span><span class="fw-medium text-primary-light">' + esc(fmtDate(r.endDate, r.endTime)) + '</span></div>' +
      '<div class="d-flex align-items-center py-10 border-bottom border-neutral-200"><span class="text-secondary-light text-sm" style="width: 140px;">Charge method</span><span class="fw-medium text-primary-light">' + esc(r.selectedChargeMethod) + '</span></div>';
    if (r.totalDays != null) html += '<div class="d-flex align-items-center py-10 border-bottom border-neutral-200"><span class="text-secondary-light text-sm" style="width: 140px;">Total days</span><span class="fw-medium text-primary-light">' + esc(r.totalDays) + '</span></div>';
    html += '<div class="d-flex align-items-center py-10"><span class="text-secondary-light text-sm" style="width: 140px;">Rate</span><span class="fw-medium text-primary-light">' + sym + (r.dailyRate != null ? r.dailyRate : '') + '/day</span></div></div></div></div>';

    html += '<div class="col-lg-6"><div class="card border radius-12 h-100 overflow-hidden">' +
      '<div class="card-header bg-neutral-50 border-bottom py-14 px-20"><h6 class="text-sm fw-semibold text-primary-light mb-0">Payment Summary</h6></div>' +
      '<div class="card-body p-20">' +
      '<div class="d-flex align-items-center py-10 border-bottom border-neutral-200"><span class="text-secondary-light text-sm" style="width: 140px;">Total amount</span><span class="fw-semibold text-primary-light">' + sym + (r.totalAmount != null ? r.totalAmount : '0') + '</span></div>' +
      '<div class="d-flex align-items-center py-10 border-bottom border-neutral-200"><span class="text-secondary-light text-sm" style="width: 140px;">Advance paid</span><span class="fw-medium text-primary-light">' + sym + (r.advancePaid != null ? r.advancePaid : '0') + '</span></div>' +
      '<div class="d-flex align-items-center py-10 border-bottom border-neutral-200"><span class="text-secondary-light text-sm" style="width: 140px;">Deposit</span><span class="fw-medium text-primary-light">' + sym + (r.deposit != null ? r.deposit : '0') + '</span></div>' +
      '<div class="d-flex align-items-center py-10"><span class="text-secondary-light text-sm" style="width: 140px;">Balance</span><span class="fw-medium text-primary-light">' + sym + (r.balanceAmount != null ? r.balanceAmount : '0') + '</span></div></div></div></div>';

    if (r.status === 'COMPLETED' && (r.actualReturnDate || (r.totalChargesAtReturn != null))) {
      html += '<div class="col-12"><div class="card border radius-12 overflow-hidden border-success-200 bg-success-50">' +
        '<div class="card-header bg-success-100 border-bottom py-14 px-20"><h6 class="text-sm fw-semibold text-primary-light mb-0">Return settlement</h6></div>' +
        '<div class="card-body p-20"><div class="row g-3">' +
        '<div class="col-md-4"><span class="text-secondary-light text-sm">Actual return</span><p class="fw-medium text-primary-light mb-0">' + esc(fmtDate(r.actualReturnDate, r.actualReturnTime)) + '</p></div>' +
        '<div class="col-md-4"><span class="text-secondary-light text-sm">Total charges at return</span><p class="fw-medium text-primary-light mb-0">' + sym + (r.totalChargesAtReturn != null ? r.totalChargesAtReturn : 0) + '</p></div>' +
        '<div class="col-md-4"><span class="text-secondary-light text-sm">Deposit refund</span><p class="fw-semibold text-success-600 mb-0">' + sym + (r.depositRefundAmount != null ? r.depositRefundAmount : 0) + '</p></div>';
      if (r.additionalPaymentRequired != null && r.additionalPaymentRequired > 0) html += '<div class="col-md-4"><span class="text-secondary-light text-sm">Additional payment required</span><p class="fw-semibold text-danger-600 mb-0">' + sym + r.additionalPaymentRequired + '</p></div>';
      html += '</div></div></div></div>';
    }

    html += '<div class="col-lg-6"><div class="card border radius-12 h-100 overflow-hidden">' +
      '<div class="card-header bg-neutral-50 border-bottom py-14 px-20"><h6 class="text-sm fw-semibold text-primary-light mb-0">Customer</h6></div>' +
      '<div class="card-body p-20">' +
      '<div class="d-flex align-items-center py-10 border-bottom border-neutral-200"><span class="text-secondary-light text-sm" style="width: 100px;">Name</span><span class="fw-medium text-primary-light">' + esc(c.name || '-') + '</span></div>' +
      '<div class="d-flex align-items-center py-10"><span class="text-secondary-light text-sm" style="width: 100px;">Phone</span><span class="fw-medium text-primary-light">' + esc(c.phone || '-') + '</span></div></div></div></div>';

    html += '<div class="col-lg-6"><div class="card border radius-12 h-100 overflow-hidden">' +
      '<div class="card-header bg-neutral-50 border-bottom py-14 px-20"><h6 class="text-sm fw-semibold text-primary-light mb-0">Vehicle</h6></div>' +
      '<div class="card-body p-20">' +
      '<div class="d-flex align-items-center py-10 border-bottom border-neutral-200"><span class="text-secondary-light text-sm" style="width: 120px;">Make / Model</span><span class="fw-medium text-primary-light">' + esc((v.make || '') + ' ' + (v.model || '')) + '</span></div>' +
      '<div class="d-flex align-items-center py-10"><span class="text-secondary-light text-sm" style="width: 120px;">Registration</span><span class="fw-medium text-primary-light">' + esc(v.registrationNumber || '-') + '</span></div></div></div></div>';

    var custSig = (r.customerSignature || '').trim();
    var staffSig = (r.staffSignature || '').trim();
    if (custSig || staffSig) {
      html += '<div class="col-12"><div class="card border radius-12 overflow-hidden">' +
        '<div class="card-header bg-neutral-50 border-bottom py-14 px-20"><h6 class="text-sm fw-semibold text-primary-light mb-0 d-flex align-items-center gap-2"><iconify-icon icon="mdi:draw"></iconify-icon> Signatures</h6></div>' +
        '<div class="card-body p-20"><div class="row g-4">';
      html += '<div class="col-md-6">' +
        '<p class="text-secondary-light text-sm mb-2 fw-medium">Customer signature</p>' +
        (custSig ? '<div class="border border-neutral-300 radius-12 bg-white p-2 overflow-hidden" style="max-width: 280px;"><img src="' + custSig + '" alt="Customer signature" style="max-width: 100%; height: auto; display: block;"></div>' : '<p class="text-secondary-light text-sm mb-0">Not captured</p>') +
        '</div>';
      html += '<div class="col-md-6">' +
        '<p class="text-secondary-light text-sm mb-2 fw-medium">Staff signature (person who provided rental)</p>' +
        (staffSig ? '<div class="border border-neutral-300 radius-12 bg-white p-2 overflow-hidden" style="max-width: 280px;"><img src="' + staffSig + '" alt="Staff signature" style="max-width: 100%; height: auto; display: block;"></div>' : '<p class="text-secondary-light text-sm mb-0">Not captured</p>') +
        '</div>';
      html += '</div></div></div></div>';
    }

    html += '</div>';

    html += '<div class="col-12"><div class="card border radius-12 overflow-hidden">' +
      '<div class="card-header bg-neutral-50 border-bottom py-14 px-20 d-flex align-items-center justify-content-between flex-wrap gap-2">' +
      '<h6 class="text-sm fw-semibold text-primary-light mb-0">Charges</h6>';
    if (r.status === 'ACTIVE') {
      html += '<button type="button" class="rental-add-charge-btn btn btn-primary btn-sm radius-8 d-flex align-items-center gap-2"><iconify-icon icon="mdi:plus"></iconify-icon> Add charge</button>';
    }
    html += '</div><div class="card-body p-20">';
    var charges = r.charges || [];
    if (charges.length === 0) {
      html += '<p class="text-secondary-light text-sm mb-0">No charges.</p>';
    } else {
      html += '<div class="table-responsive"><table class="table table-sm bordered-table mb-0"><thead><tr><th class="text-secondary-light text-sm">Description</th><th class="text-secondary-light text-sm text-end">Amount</th></tr></thead><tbody>';
      charges.forEach(function (ch) {
        var amt = ch.chargeAmount != null ? ch.chargeAmount : ch.charge_amount;
        html += '<tr><td class="fw-medium text-primary-light">' + esc(ch.description || '-') + '</td><td class="text-end">' + (ch.currencySymbol || sym) + (amt != null ? amt : '0') + '</td></tr>';
      });
      html += '</tbody></table></div>';
    }
    html += '</div></div></div>';

    if (r.status === 'ACTIVE') {
      html += '<div class="mt-24 d-flex justify-content-end"><button type="button" class="rental-cancel-btn btn btn-outline-danger btn-sm radius-8 d-flex align-items-center gap-2" data-rental-id="' + esc(r.id) + '"><iconify-icon icon="fluent:delete-24-regular"></iconify-icon> Cancel rental</button></div>';
    }
    return html;
  }

  function doCancel(id) {
    window.rentalApi.delete(id).then(function () {
      if (window.showToast) window.showToast('Rental cancelled.', 'success');
      window.location.href = basePath + '/rental';
    }).catch(function (err) {
      if (window.showToast) window.showToast(err.message || 'Cancel failed', 'error');
    });
  }

  function bindCancel(container) {
    var cancelBtn = container && container.querySelector('.rental-cancel-btn');
    if (!cancelBtn || !window.rentalApi || !window.rentalApi.delete) return;
    cancelBtn.addEventListener('click', function () {
      var id = this.getAttribute('data-rental-id');
      if (!id) return;
      if (typeof Swal !== 'undefined') {
        Swal.fire({ title: 'Cancel rental?', text: 'Vehicle will be marked available. This cannot be undone.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#0d6efd', cancelButtonColor: '#6c757d', confirmButtonText: 'Yes, cancel' }).then(function (result) {
          if (result && result.isConfirmed) doCancel(id);
        });
      } else if (confirm('Cancel this rental? Vehicle will be marked available.')) doCancel(id);
    });
  }

  function bindGenerateInvoice(container) {
    var btn = container && container.querySelector('.rental-generate-invoice-btn');
    if (!btn || !window.invoiceApi || !window.invoiceApi.createFromRental) return;
    btn.addEventListener('click', function () {
      var rid = btn.getAttribute('data-rental-id');
      if (!rid) return;
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Generate invoice?',
          text: 'Create an invoice from this completed rental. PDF will be sent to customer email.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#0d6efd',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Yes, generate',
        }).then(function (result) {
          if (!result.isConfirmed) return;
          btn.disabled = true;
          window.invoiceApi.createFromRental({ rental_id: rid }).then(function (data) {
            var inv = data.invoice;
            var num = inv && inv.invoiceNumber ? inv.invoiceNumber : 'Invoice';
            if (window.showToast) window.showToast('Invoice ' + num + ' created. PDF sent to customer.', 'success');
            if (inv && inv.id) window.location.href = basePath + '/invoice/view/' + encodeURIComponent(inv.id);
            else window.location.href = basePath + '/invoice/list';
          }).catch(function (err) {
            btn.disabled = false;
            var msg = (err.data && err.data.error) ? err.data.error : (err.message || 'Failed to create invoice.');
            if (window.showToast) window.showToast(msg, 'error');
          });
        });
      } else {
        btn.disabled = true;
        window.invoiceApi.createFromRental({ rental_id: rid }).then(function (data) {
          var inv = data.invoice;
          if (inv && inv.id) window.location.href = basePath + '/invoice/view/' + encodeURIComponent(inv.id);
          else window.location.href = basePath + '/invoice/list';
        }).catch(function (err) {
          btn.disabled = false;
          if (window.showToast) window.showToast(err.message || 'Failed to create invoice.', 'error');
        });
      }
    });
  }

  function bindAddCharge(container) {
    var addBtn = container && container.querySelector('.rental-add-charge-btn');
    if (!addBtn || !window.rentalApi || !window.rentalApi.addCharge) return;
    addBtn.addEventListener('click', function () {
      if (typeof Swal === 'undefined') {
        if (window.showToast) window.showToast('Add charge: description and amount required.', 'error');
        return;
      }
      Swal.fire({
        title: 'Add charge',
        html: '<input id="rental-charge-desc" class="form-control mb-3" placeholder="Description (e.g. Late fee, Fuel)">' +
          '<input id="rental-charge-amt" type="number" class="form-control" placeholder="Amount" min="0" step="0.01" value="0">',
        showCancelButton: true,
        confirmButtonColor: '#0d6efd',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Add',
        preConfirm: function () {
          var desc = (document.getElementById('rental-charge-desc') && document.getElementById('rental-charge-desc').value) || '';
          var amt = parseFloat(document.getElementById('rental-charge-amt') && document.getElementById('rental-charge-amt').value, 10);
          desc = desc.trim();
          if (!desc) { Swal.showValidationMessage('Description is required'); return false; }
          if (isNaN(amt) || amt < 0) { Swal.showValidationMessage('Enter a valid amount'); return false; }
          return { description: desc, charge_amount: amt };
        }
      }).then(function (result) {
        if (!result.isConfirmed || !result.value) return;
        window.rentalApi.addCharge(rentalId, result.value).then(function () {
          if (window.showToast) window.showToast('Charge added.', 'success');
          loadAndRender();
        }).catch(function (err) {
          var msg = (err.data && err.data.error) ? err.data.error : (err.message || 'Failed to add charge.');
          if (window.showToast) window.showToast(msg, 'error');
        });
      });
    });
  }

  function loadAndRender() {
    if (!rentalId || !window.rentalApi || !window.rentalApi.getById) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = 'Rental ID or API missing.'; }
      return;
    }
    window.rentalApi.getById(rentalId, true).then(function (data) {
      var r = data.rental;
      if (!r) { if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = 'Rental not found.'; } return; }
      if (loadingEl) loadingEl.classList.add('d-none');
      contentEl.innerHTML = render(r);
      contentEl.classList.remove('d-none');
      bindCancel(contentEl);
      bindGenerateInvoice(contentEl);
      bindAddCharge(contentEl);
    }).catch(function (err) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = err.message || 'Failed to load rental.'; }
      if (window.showToast) window.showToast(err.message || 'Failed to load rental.', 'error');
    });
  }

  loadAndRender();
})();
