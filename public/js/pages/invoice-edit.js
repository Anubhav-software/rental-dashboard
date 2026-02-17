/**
 * Invoice edit page: load via invoiceApi.getById, form for status, due_date, notes; PATCH on submit.
 * I.6: full form; this is minimal so edit route works.
 */
(function () {
  var card = document.getElementById('invoice-edit-card');
  var loadingEl = document.getElementById('invoice-edit-loading');
  var contentEl = document.getElementById('invoice-edit-content');
  var errorEl = document.getElementById('invoice-edit-error');
  if (!card) return;
  var invoiceId = card.getAttribute('data-invoice-id');
  var basePath = (card.getAttribute('data-base-path') || '').replace(/\/$/, '') || (window.location.pathname.indexOf('/staff') === 0 ? '/staff' : '/owner');

  function showError(msg) {
    if (loadingEl) loadingEl.classList.add('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    if (errorEl) {
      errorEl.textContent = msg || 'Failed to load invoice';
      errorEl.classList.remove('d-none');
    }
    if (typeof window.showToast === 'function') window.showToast(msg || 'Failed to load invoice', 'error');
  }

  if (!invoiceId || !window.invoiceApi) {
    showError('Invalid invoice or API not loaded');
    return;
  }
  window.invoiceApi.getById(invoiceId)
    .then(function (data) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) errorEl.classList.add('d-none');
      if (!contentEl) return;
      contentEl.classList.remove('d-none');
      var inv = data.invoice || data;
      var dueVal = inv.dueDate ? (typeof inv.dueDate === 'string' ? inv.dueDate.slice(0, 10) : new Date(inv.dueDate).toISOString().slice(0, 10)) : '';
      contentEl.innerHTML =
        '<div class="mb-24"><a href="' + basePath + '/invoice/view/' + encodeURIComponent(inv.id) + '" class="btn btn-sm border border-neutral-400 radius-8">Back to view</a></div>' +
        '<form id="invoice-edit-form" class="max-w-400">' +
        '<div class="mb-16"><label class="form-label">Status</label><select name="status" class="form-select">' +
        '<option value="DRAFT"' + (inv.status === 'DRAFT' ? ' selected' : '') + '>Draft</option>' +
        '<option value="ISSUED"' + (inv.status === 'ISSUED' ? ' selected' : '') + '>Issued</option>' +
        '<option value="SENT"' + (inv.status === 'SENT' ? ' selected' : '') + '>Sent</option>' +
        '<option value="PAID"' + (inv.status === 'PAID' ? ' selected' : '') + '>Paid</option>' +
        '<option value="CANCELLED"' + (inv.status === 'CANCELLED' ? ' selected' : '') + '>Cancelled</option></select></div>' +
        '<div class="mb-16"><label class="form-label">Due date</label><input type="date" name="due_date" class="form-control" value="' + dueVal + '"></div>' +
        '<div class="mb-16"><label class="form-label">Notes</label><textarea name="notes" class="form-control" rows="3">' + (inv.notes || '') + '</textarea></div>' +
        '<button type="submit" class="btn btn-primary">Update</button></form>';
      contentEl.querySelector('#invoice-edit-form').addEventListener('submit', function (e) {
        e.preventDefault();
        var form = e.target;
        var body = {
          status: form.status.value,
          due_date: form.due_date.value || null,
          notes: (form.notes.value || '').trim() || null,
        };
        window.invoiceApi.update(inv.id, body).then(function () {
          if (typeof window.showToast === 'function') window.showToast('Invoice updated', 'success');
          window.location.href = basePath + '/invoice/view/' + encodeURIComponent(inv.id);
        }).catch(function (err) {
          if (typeof window.showToast === 'function') window.showToast(err.message || 'Update failed', 'error');
        });
      });
    })
    .catch(function (err) {
      showError(err.message || 'Failed to load invoice');
    });
})();
