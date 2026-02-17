/**
 * Invoice list page: load list via invoiceApi.list, filters, pagination, action links.
 * Load error → toast.
 */
(function () {
  var card = document.getElementById('invoice-list-card');
  var loadingEl = document.getElementById('invoice-list-loading');
  var contentEl = document.getElementById('invoice-list-content');
  var errorEl = document.getElementById('invoice-list-error');
  var tbody = document.getElementById('invoice-list-tbody');
  var paginationEl = document.getElementById('invoice-list-pagination');

  var basePath = (card && card.getAttribute('data-base-path')) || '';
  basePath = (basePath || '').replace(/\/$/, '');
  if (!basePath) basePath = (typeof window !== 'undefined' && window.location.pathname.indexOf('/staff') === 0) ? '/staff' : '/owner';

  function getFilters() {
    var statusEl = document.getElementById('invoice-filter-status');
    var fromEl = document.getElementById('invoice-filter-issue-from');
    var toEl = document.getElementById('invoice-filter-issue-to');
    var initialPage = card && card.getAttribute('data-page');
    var initialLimit = card && card.getAttribute('data-limit');
    var params = {
      page: parseInt(sessionStorage.getItem('invoiceListPage') || initialPage || '1', 10),
      limit: parseInt(initialLimit || '20', 10),
    };
    if (statusEl && statusEl.value) params.status = statusEl.value.trim();
    if (fromEl && fromEl.value) params.issue_date_from = fromEl.value.trim();
    if (toEl && toEl.value) params.issue_date_to = toEl.value.trim();
    return params;
  }

  function setPage(p) {
    sessionStorage.setItem('invoiceListPage', String(p));
  }

  function formatDate(d) {
    if (!d) return '-';
    var s = typeof d === 'string' ? d : (d instanceof Date ? d.toISOString() : String(d));
    return s.slice(0, 10);
  }

  function statusBadge(status) {
    if (status === 'PAID') return '<span class="bg-success-focus text-success-main px-24 py-4 rounded-pill fw-medium text-sm">Paid</span>';
    if (status === 'ISSUED') return '<span class="bg-info-focus text-info-main px-24 py-4 rounded-pill fw-medium text-sm">Issued</span>';
    if (status === 'SENT') return '<span class="bg-primary-focus text-primary-main px-24 py-4 rounded-pill fw-medium text-sm">Sent</span>';
    if (status === 'DRAFT') return '<span class="bg-neutral-200 text-neutral-600 px-24 py-4 rounded-pill fw-medium text-sm">Draft</span>';
    if (status === 'CANCELLED') return '<span class="bg-danger-focus text-danger-main px-24 py-4 rounded-pill fw-medium text-sm">Cancelled</span>';
    return '<span class="bg-neutral-200 text-neutral-600 px-24 py-4 rounded-pill fw-medium text-sm">' + (status || '-') + '</span>';
  }

  function renderRow(inv, index) {
    var sym = inv.currencySymbol || '';
    var totalStr = sym + (inv.totalAmount != null ? Number(inv.totalAmount).toFixed(2) : '0');
    var viewUrl = basePath + '/invoice/view/' + encodeURIComponent(inv.id);
    var editUrl = basePath + '/invoice/edit/' + encodeURIComponent(inv.id);
    var actions =
      '<a href="' + viewUrl + '" class="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle text-decoration-none" title="View"><iconify-icon icon="majesticons:eye-line" class="icon text-xl"></iconify-icon></a>' +
      '<a href="' + editUrl + '" class="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle text-decoration-none" title="Edit"><iconify-icon icon="lucide:edit" class="menu-icon"></iconify-icon></a>' +
      '<button type="button" class="invoice-send-pdf-btn btn border-0 bg-warning-focus text-warning-600 bg-hover-warning-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" data-invoice-id="' + encodeURIComponent(inv.id) + '" title="Send PDF"><iconify-icon icon="mdi:file-pdf-box" class="menu-icon"></iconify-icon></button>';
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + (index + 1) + '</td>' +
      '<td><a href="' + viewUrl + '" class="text-primary-600 fw-medium text-decoration-none">' + (inv.invoiceNumber || '-') + '</a></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + (inv.customerName || '-') + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + formatDate(inv.issueDate) + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + totalStr + '</span></td>' +
      '<td class="text-center">' + statusBadge(inv.status) + '</td>' +
      '<td class="text-center"><div class="d-flex align-items-center gap-10 justify-content-center">' + actions + '</div></td>';
    return tr;
  }

  function renderPagination(total, page, limit) {
    var totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
    if (totalPages <= 1) {
      paginationEl.innerHTML = '<span class="text-secondary-light text-sm">Page ' + page + ' of ' + totalPages + ' (' + total + ' total)</span>';
      return;
    }
    var prevDisabled = page <= 1 ? ' disabled' : '';
    var nextDisabled = page >= totalPages ? ' disabled' : '';
    paginationEl.innerHTML =
      '<span class="text-secondary-light text-sm">Page ' + page + ' of ' + totalPages + ' (' + total + ' total)</span>' +
      '<div class="d-flex gap-2">' +
      '<button type="button" class="btn btn-sm border border-neutral-400 radius-8' + prevDisabled + '" id="invoice-prev-page">Previous</button>' +
      '<button type="button" class="btn btn-sm border border-neutral-400 radius-8' + nextDisabled + '" id="invoice-next-page">Next</button>' +
      '</div>';
    var prevBtn = document.getElementById('invoice-prev-page');
    var nextBtn = document.getElementById('invoice-next-page');
    if (prevBtn && !prevBtn.disabled) prevBtn.addEventListener('click', function () { setPage(page - 1); loadList(); });
    if (nextBtn && !nextBtn.disabled) nextBtn.addEventListener('click', function () { setPage(page + 1); loadList(); });
  }

  function showError(msg) {
    if (loadingEl) loadingEl.classList.add('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    if (errorEl) {
      errorEl.textContent = msg || 'Failed to load invoices';
      errorEl.classList.remove('d-none');
    }
    if (typeof window.showToast === 'function') window.showToast(msg || 'Failed to load invoices', 'error');
  }

  function loadList() {
    if (!window.invoiceApi || !window.invoiceApi.list) {
      showError('Invoice API not loaded');
      return;
    }
    if (loadingEl) loadingEl.classList.remove('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    if (errorEl) errorEl.classList.add('d-none');
    var params = getFilters();
    window.invoiceApi.list(params)
      .then(function (data) {
        if (loadingEl) loadingEl.classList.add('d-none');
        if (errorEl) errorEl.classList.add('d-none');
        if (contentEl) contentEl.classList.remove('d-none');
        var list = (data && data.invoices) ? data.invoices : [];
        var total = (data && data.total != null) ? data.total : 0;
        var page = (data && data.page != null) ? data.page : 1;
        var limit = (data && data.limit != null) ? data.limit : 20;
        tbody.innerHTML = '';
        if (list.length === 0) {
          var tr = document.createElement('tr');
          tr.innerHTML = '<td colspan="7" class="text-center text-secondary-light py-24">No invoices found.</td>';
          tbody.appendChild(tr);
        } else {
          list.forEach(function (inv, i) {
            tbody.appendChild(renderRow(inv, (page - 1) * limit + i));
          });
        }
        renderPagination(total, page, limit);
        // Send PDF button handlers (I.7 will add confirm + API call)
        tbody.querySelectorAll('.invoice-send-pdf-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = btn.getAttribute('data-invoice-id');
            if (!id) return;
            if (typeof window.Swal !== 'undefined') {
              window.Swal.fire({
                title: 'Send PDF?',
                text: 'Send invoice PDF to customer email?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, send',
                cancelButtonText: 'Cancel',
              }).then(function (result) {
                if (result.isConfirmed && window.invoiceApi && window.invoiceApi.sendPdf) {
                  window.invoiceApi.sendPdf(id).then(function () {
                    if (typeof window.showToast === 'function') window.showToast('PDF sent to customer email', 'success');
                  }).catch(function (err) {
                    if (typeof window.showToast === 'function') window.showToast(err.message || 'Failed to send PDF', 'error');
                  });
                }
              });
            } else if (window.invoiceApi && window.invoiceApi.sendPdf) {
              window.invoiceApi.sendPdf(id).then(function () {
                if (typeof window.showToast === 'function') window.showToast('PDF sent to customer email', 'success');
              }).catch(function (err) {
                if (typeof window.showToast === 'function') window.showToast(err.message || 'Failed to send PDF', 'error');
              });
            }
          });
        });
      })
      .catch(function (err) {
        showError(err.message || 'Failed to load invoices');
      });
  }

  function init() {
    if (!card) return;
    var applyBtn = document.getElementById('invoice-filter-apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        setPage(1);
        loadList();
      });
    }
    loadList();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
