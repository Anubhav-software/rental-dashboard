/**
 * Expense list page: load list via expenseApi.list, filters, pagination, View/Approve/Reject.
 * Load error → toast. Approve/Reject only for PENDING; 403 → "Owner access required" toast.
 */
(function () {
  var card = document.getElementById('expense-list-card');
  var loadingEl = document.getElementById('expense-list-loading');
  var contentEl = document.getElementById('expense-list-content');
  var errorEl = document.getElementById('expense-list-error');
  var tbody = document.getElementById('expense-list-tbody');
  var paginationEl = document.getElementById('expense-list-pagination');

  var basePath = (card && card.getAttribute('data-base-path')) || '';
  basePath = (basePath || '').replace(/\/$/, '');
  if (!basePath) basePath = (typeof window !== 'undefined' && window.location.pathname.indexOf('/staff') !== -1) ? '/staff' : '/owner';

  function getFilters() {
    var statusEl = document.getElementById('expense-filter-status');
    var categoryEl = document.getElementById('expense-filter-category');
    var fromEl = document.getElementById('expense-filter-date-from');
    var toEl = document.getElementById('expense-filter-date-to');
    var initialPage = card && card.getAttribute('data-page');
    var initialLimit = card && card.getAttribute('data-limit');
    var params = {
      page: parseInt(sessionStorage.getItem('expenseListPage') || initialPage || '1', 10),
      limit: parseInt(initialLimit || '20', 10),
    };
    if (statusEl && statusEl.value) params.status = statusEl.value.trim();
    if (categoryEl && categoryEl.value) params.category = categoryEl.value.trim();
    if (fromEl && fromEl.value) params.expense_date_from = fromEl.value.trim();
    if (toEl && toEl.value) params.expense_date_to = toEl.value.trim();
    return params;
  }

  function setPage(p) {
    sessionStorage.setItem('expenseListPage', String(p));
  }

  function formatDate(d) {
    if (!d) return '-';
    var s = typeof d === 'string' ? d : (d instanceof Date ? d.toISOString() : String(d));
    return s.slice(0, 10);
  }

  function categoryLabel(cat) {
    var map = { FUEL: 'Fuel', MAINTENANCE: 'Maintenance', INSURANCE: 'Insurance', REPAIR: 'Repair', OFFICE: 'Office', OTHER: 'Other' };
    return map[cat] || cat || '-';
  }

  function statusBadge(status) {
    if (status === 'APPROVED') return '<span class="bg-success-focus text-success-main px-24 py-4 rounded-pill fw-medium text-sm">Approved</span>';
    if (status === 'REJECTED') return '<span class="bg-danger-focus text-danger-main px-24 py-4 rounded-pill fw-medium text-sm">Rejected</span>';
    if (status === 'PENDING') return '<span class="bg-warning-focus text-warning-main px-24 py-4 rounded-pill fw-medium text-sm">Pending</span>';
    return '<span class="bg-neutral-200 text-neutral-600 px-24 py-4 rounded-pill fw-medium text-sm">' + (status || '-') + '</span>';
  }

  function doApprove(id) {
    if (!window.expenseApi || !window.expenseApi.approve) return;
    window.expenseApi.approve(id)
      .then(function () {
        if (typeof window.showToast === 'function') window.showToast('Expense approved', 'success');
        loadList();
      })
      .catch(function (err) {
        var msg = (err.status === 403) ? 'Owner access required' : (err.message || 'Failed to approve');
        if (typeof window.showToast === 'function') window.showToast(msg, 'error');
      });
  }

  function doReject(id, reason) {
    if (!window.expenseApi || !window.expenseApi.reject) return;
    window.expenseApi.reject(id, { rejection_reason: reason || '' })
      .then(function () {
        if (typeof window.showToast === 'function') window.showToast('Expense rejected', 'success');
        loadList();
      })
      .catch(function (err) {
        var msg = (err.status === 403) ? 'Owner access required' : (err.message || 'Failed to reject');
        if (typeof window.showToast === 'function') window.showToast(msg, 'error');
      });
  }

  function vehicleLabel(exp) {
    if (!exp.vehicle) return '-';
    var v = exp.vehicle;
    return (v.registrationNumber || '') + (v.make || v.model ? ' – ' + (v.make || '') + ' ' + (v.model || '') : '') || '-';
  }

  function renderRow(exp, index) {
    var sym = exp.currencySymbol || '₹';
    var amountStr = sym + (exp.amount != null ? Number(exp.amount).toFixed(2) : '0');
    var viewUrl = basePath + '/expense/view/' + encodeURIComponent(exp.id);
    var viewBtn = '<a href="' + viewUrl + '" class="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle text-decoration-none" title="View"><iconify-icon icon="majesticons:eye-line" class="icon text-xl"></iconify-icon></a>';
    var editBtn = (exp.status !== 'APPROVED') ? '<a href="' + basePath + '/expense/edit/' + encodeURIComponent(exp.id) + '" class="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle text-decoration-none" title="Edit"><iconify-icon icon="lucide:edit" class="menu-icon"></iconify-icon></a>' : '';
    var approveBtn = '';
    var rejectBtn = '';
    if (exp.status === 'PENDING') {
      approveBtn = '<button type="button" class="expense-approve-btn btn border-0 bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" data-expense-id="' + encodeURIComponent(exp.id) + '" title="Approve"><iconify-icon icon="mdi:check-circle" class="menu-icon"></iconify-icon></button>';
      rejectBtn = '<button type="button" class="expense-reject-btn btn border-0 bg-danger-focus text-danger-600 bg-hover-danger-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" data-expense-id="' + encodeURIComponent(exp.id) + '" title="Reject"><iconify-icon icon="mdi:close-circle" class="menu-icon"></iconify-icon></button>';
    }
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + (index + 1) + '</td>' +
      '<td><span class="text-md fw-medium">' + amountStr + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + vehicleLabel(exp) + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + categoryLabel(exp.category) + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + (exp.description ? String(exp.description).slice(0, 40) + (String(exp.description).length > 40 ? '…' : '') : '-') + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + formatDate(exp.expenseDate) + '</span></td>' +
      '<td class="text-center">' + statusBadge(exp.status) + '</td>' +
      '<td class="text-center"><div class="d-flex align-items-center gap-10 justify-content-center">' + viewBtn + editBtn + approveBtn + rejectBtn + '</div></td>';
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
      '<button type="button" class="btn btn-sm border border-neutral-400 radius-8' + prevDisabled + '" id="expense-prev-page">Previous</button>' +
      '<button type="button" class="btn btn-sm border border-neutral-400 radius-8' + nextDisabled + '" id="expense-next-page">Next</button>' +
      '</div>';
    var prevBtn = document.getElementById('expense-prev-page');
    var nextBtn = document.getElementById('expense-next-page');
    if (prevBtn && !prevBtn.disabled) prevBtn.addEventListener('click', function () { setPage(page - 1); loadList(); });
    if (nextBtn && !nextBtn.disabled) nextBtn.addEventListener('click', function () { setPage(page + 1); loadList(); });
  }

  function attachRowActions() {
    if (!tbody) return;
    tbody.querySelectorAll('.expense-approve-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-expense-id');
        if (!id) return;
        if (typeof window.Swal !== 'undefined') {
          window.Swal.fire({
            title: 'Approve expense?',
            text: 'This expense will be marked as approved.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, approve',
            cancelButtonText: 'Cancel',
          }).then(function (result) {
            if (result.isConfirmed) doApprove(id);
          });
        } else {
          doApprove(id);
        }
      });
    });
    tbody.querySelectorAll('.expense-reject-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-expense-id');
        if (!id) return;
        if (typeof window.Swal !== 'undefined') {
          window.Swal.fire({
            title: 'Reject expense?',
            html: '<p class="mb-2">Optionally add a reason:</p><textarea id="swal-rejection-reason" class="form-control" rows="2" placeholder="Reason (optional)"></textarea>',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Reject',
            confirmButtonColor: '#dc3545',
            cancelButtonText: 'Cancel',
          }).then(function (result) {
            if (result.isConfirmed) {
              var reasonEl = document.getElementById('swal-rejection-reason');
              doReject(id, reasonEl ? reasonEl.value : '');
            }
          });
        } else {
          doReject(id, '');
        }
      });
    });
  }

  function showError(msg) {
    if (loadingEl) loadingEl.classList.add('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    if (errorEl) {
      errorEl.textContent = msg || 'Failed to load expenses';
      errorEl.classList.remove('d-none');
    }
    if (typeof window.showToast === 'function') window.showToast(msg || 'Failed to load expenses', 'error');
  }

  function loadList() {
    if (!window.expenseApi || !window.expenseApi.list) {
      showError('Expense API not loaded');
      return;
    }
    if (loadingEl) loadingEl.classList.remove('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    if (errorEl) errorEl.classList.add('d-none');
    var params = getFilters();
    window.expenseApi.list(params)
      .then(function (data) {
        if (loadingEl) loadingEl.classList.add('d-none');
        if (errorEl) errorEl.classList.add('d-none');
        if (contentEl) contentEl.classList.remove('d-none');
        var list = (data && data.expenses) ? data.expenses : [];
        var total = (data && data.total != null) ? data.total : 0;
        var page = (data && data.page != null) ? data.page : 1;
        var limit = (data && data.limit != null) ? data.limit : 20;
        tbody.innerHTML = '';
        if (list.length === 0) {
          var tr = document.createElement('tr');
          tr.innerHTML = '<td colspan="8" class="text-center text-secondary-light py-24">No expenses found.</td>';
          tbody.appendChild(tr);
        } else {
          list.forEach(function (exp, i) {
            tbody.appendChild(renderRow(exp, (page - 1) * limit + i));
          });
        }
        renderPagination(total, page, limit);
        attachRowActions();
      })
      .catch(function (err) {
        showError(err.message || 'Failed to load expenses');
      });
  }

  function init() {
    if (!card) return;
    var applyBtn = document.getElementById('expense-filter-apply');
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
