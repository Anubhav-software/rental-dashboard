/**
 * Rental list page: load list via rentalApi.list, filters, pagination, action links.
 * Load error → toast. Cancel button wired in sub-phase 6.
 */
(function () {
  var card = document.getElementById('rental-list-card');
  var loadingEl = document.getElementById('rental-list-loading');
  var contentEl = document.getElementById('rental-list-content');
  var errorEl = document.getElementById('rental-list-error');
  var tbody = document.getElementById('rental-list-tbody');
  var paginationEl = document.getElementById('rental-list-pagination');

  var basePath = (card && card.getAttribute('data-base-path')) || '';
  basePath = (basePath || '').replace(/\/$/, '');
  if (!basePath || /\/rental$/.test(basePath)) {
    basePath = (typeof window !== 'undefined' && window.location.pathname.indexOf('/staff') === 0) ? '/staff' : '/owner';
  }

  function getFilters() {
    var statusEl = document.getElementById('rental-filter-status');
    var fromEl = document.getElementById('rental-filter-start-from');
    var toEl = document.getElementById('rental-filter-start-to');
    var activeOnly = (card && card.getAttribute('data-active-only')) === '1';
    var initialPage = card && card.getAttribute('data-page');
    var initialLimit = card && card.getAttribute('data-limit');
    var params = {
      page: parseInt(sessionStorage.getItem('rentalListPage') || initialPage || '1', 10),
      limit: parseInt(initialLimit || '20', 10),
    };
    if (activeOnly) params.status = 'ACTIVE';
    else if (statusEl && statusEl.value) params.status = statusEl.value.trim();
    if (fromEl && fromEl.value) params.start_date_from = fromEl.value.trim();
    if (toEl && toEl.value) params.start_date_to = toEl.value.trim();
    return params;
  }

  function setPage(p) {
    sessionStorage.setItem('rentalListPage', String(p));
  }

  function formatDate(d, time) {
    if (!d) return '-';
    var s = typeof d === 'string' ? d : (d instanceof Date ? d.toISOString() : String(d));
    var datePart = s.slice(0, 10);
    return time ? datePart + ' ' + (time || '') : datePart;
  }

  function statusBadge(status) {
    if (status === 'ACTIVE') return '<span class="bg-success-focus text-success-600 border border-success-main px-24 py-4 radius-4 fw-medium text-sm">Active</span>';
    if (status === 'COMPLETED') return '<span class="bg-info-focus text-info-600 border border-info-main px-24 py-4 radius-4 fw-medium text-sm">Completed</span>';
    return '<span class="bg-neutral-200 text-neutral-600 border border-neutral-400 px-24 py-4 radius-4 fw-medium text-sm">Cancelled</span>';
  }

  function renderRow(r, index) {
    var customerName = (r.customer && r.customer.name) ? r.customer.name : '-';
    var vehicleText = (r.vehicle && (r.vehicle.make || r.vehicle.model)) ? ((r.vehicle.make || '') + ' ' + (r.vehicle.model || '')).trim() : '-';
    var startStr = formatDate(r.startDate, r.startTime);
    var endStr = formatDate(r.endDate, r.endTime);
    var totalStr = (r.currencySymbol || '') + (r.totalAmount != null ? Number(r.totalAmount) : '0');
    var isActive = r.status === 'ACTIVE';

    var reminderEmail = '<button type="button" class="reminder-email-btn btn btn-sm border border-primary bg-hover-primary-50 text-primary px-12 py-8 radius-8 d-flex align-items-center gap-2" data-rental-id="' + encodeURIComponent(r.id) + '" title="Send reminder via Email"><iconify-icon icon="mdi:email-outline" class="icon text-xl line-height-1"></iconify-icon><span class="text-sm">Email</span></button>';
    var reminderWhatsApp = '<button type="button" class="reminder-whatsapp-btn btn btn-sm border border-success bg-hover-success-50 text-success px-12 py-8 radius-8 d-flex align-items-center gap-2" data-rental-id="' + encodeURIComponent(r.id) + '" title="Send reminder via WhatsApp"><iconify-icon icon="mdi:whatsapp" class="icon text-xl line-height-1"></iconify-icon><span class="text-sm">WhatsApp</span></button>';

    var actions = '<a href="' + basePath + '/rental/view/' + encodeURIComponent(r.id) + '" class="bg-info-focus bg-hover-info-200 text-info-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle text-decoration-none" title="View"><iconify-icon icon="majesticons:eye-line" class="icon text-xl"></iconify-icon></a>';
    if (isActive) {
      actions += '<a href="' + basePath + '/rental/edit/' + encodeURIComponent(r.id) + '" class="bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle text-decoration-none" title="Edit"><iconify-icon icon="lucide:edit" class="menu-icon"></iconify-icon></a>';
      actions += '<a href="' + basePath + '/return/process/' + encodeURIComponent(r.id) + '" class="bg-warning-focus text-warning-600 bg-hover-warning-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle text-decoration-none" title="Process return"><iconify-icon icon="mdi:key-return" class="menu-icon"></iconify-icon></a>';
      actions += '<button type="button" class="rental-cancel-btn remove-item-btn bg-danger-focus bg-hover-danger-200 text-danger-600 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle border-0" data-rental-id="' + encodeURIComponent(r.id) + '" title="Cancel rental"><iconify-icon icon="fluent:delete-24-regular" class="menu-icon"></iconify-icon></button>';
    }

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + (index + 1) + '</td>' +
      '<td><span class="text-md fw-medium text-primary-light">' + (r.contractNumber || '-') + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + customerName + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + vehicleText + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + startStr + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + endStr + '</span></td>' +
      '<td><span class="text-md fw-normal text-secondary-light">' + totalStr + '</span></td>' +
      '<td class="text-center">' + statusBadge(r.status) + '</td>' +
      '<td class="text-center"><div class="d-flex align-items-center gap-10 justify-content-center">' + reminderEmail + '</div></td>' +
      '<td class="text-center"><div class="d-flex align-items-center gap-10 justify-content-center">' + reminderWhatsApp + '</div></td>' +
      '<td class="text-center"><div class="d-flex align-items-center gap-10 justify-content-center">' + actions + '</div></td>';
    return tr;
  }

  function renderPagination(total, page, limit) {
    var totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
    if (totalPages <= 1) {
      paginationEl.innerHTML = '<span class="text-secondary-light text-sm">Page ' + page + ' of ' + totalPages + '</span>';
      return;
    }
    var prevDisabled = page <= 1 ? ' disabled' : '';
    var nextDisabled = page >= totalPages ? ' disabled' : '';
    paginationEl.innerHTML =
      '<span class="text-secondary-light text-sm">Page ' + page + ' of ' + totalPages + ' (' + total + ' total)</span>' +
      '<div class="d-flex gap-2">' +
      '<button type="button" class="btn btn-sm border border-neutral-400 radius-8' + prevDisabled + '" id="rental-prev-page">Previous</button>' +
      '<button type="button" class="btn btn-sm border border-neutral-400 radius-8' + nextDisabled + '" id="rental-next-page">Next</button>' +
      '</div>';
    var prevBtn = document.getElementById('rental-prev-page');
    var nextBtn = document.getElementById('rental-next-page');
    if (prevBtn && !prevDisabled) prevBtn.addEventListener('click', function () { setPage(page - 1); loadList(); });
    if (nextBtn && !nextDisabled) nextBtn.addEventListener('click', function () { setPage(page + 1); loadList(); });
  }

  function loadList() {
    if (!window.rentalApi || !window.rentalApi.list) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = 'Rental API not loaded.'; }
      return;
    }
    if (loadingEl) loadingEl.classList.remove('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    if (errorEl) errorEl.classList.add('d-none');

    var params = getFilters();
    setPage(params.page);

    window.rentalApi.list(params).then(function (data) {
      if (loadingEl) loadingEl.classList.add('d-none');
      var rentals = (data && data.rentals) ? data.rentals : [];
      var total = (data && data.total != null) ? data.total : 0;
      var page = (data && data.page != null) ? data.page : params.page;
      var limit = (data && data.limit != null) ? data.limit : params.limit;

      tbody.innerHTML = '';
      if (rentals.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center text-secondary-light py-24">No rentals found.</td></tr>';
      } else {
        rentals.forEach(function (r, i) { tbody.appendChild(renderRow(r, i)); });
        var reminderEmailBtns = tbody.querySelectorAll('.reminder-email-btn');
        reminderEmailBtns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var rentalId = this.getAttribute('data-rental-id');
            if (!rentalId || !window.rentalApi || !window.rentalApi.sendReminderEmail) return;
            var self = this;
            self.disabled = true;
            if (self.classList) self.classList.add('opacity-75');
            window.rentalApi.sendReminderEmail([rentalId]).then(function (data) {
              if (data.sent > 0 && window.showToast) window.showToast(data.message || 'Reminder email sent.', 'success');
              else if (data.failed > 0 && data.errors && data.errors[0] && window.showToast) window.showToast(data.errors[0].error || 'Could not send email.', 'error');
              self.disabled = false;
              if (self.classList) self.classList.remove('opacity-75');
            }).catch(function (err) {
              var msg = (err.data && err.data.error) ? err.data.error : (err.message || 'Failed to send email.');
              if (window.showToast) window.showToast(msg, 'error');
              self.disabled = false;
              if (self.classList) self.classList.remove('opacity-75');
            });
          });
        });
        var cancelBtns = tbody.querySelectorAll('.rental-cancel-btn');
        cancelBtns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-rental-id');
            if (!id || !window.rentalApi || !window.rentalApi.delete) return;
            var doCancel = function () {
              window.rentalApi.delete(id).then(function () {
                if (window.showToast) window.showToast('Rental cancelled.', 'success');
                loadList();
              }).catch(function (err) {
                if (window.showToast) window.showToast(err.message || 'Cancel failed', 'error');
              });
            };
            if (typeof Swal !== 'undefined') {
              Swal.fire({ title: 'Cancel rental?', text: 'Vehicle will be marked available.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#0d6efd', cancelButtonColor: '#6c757d', confirmButtonText: 'Yes, cancel' }).then(function (result) {
                if (result && result.isConfirmed) doCancel();
              });
            } else if (confirm('Cancel this rental?')) doCancel();
          });
        });
      }
      renderPagination(total, page, limit);
      if (contentEl) contentEl.classList.remove('d-none');
    }).catch(function (err) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) {
        errorEl.classList.remove('d-none');
        errorEl.textContent = err.message || 'Failed to load rentals.';
      }
      if (window.showToast) window.showToast(err.message || 'Failed to load rentals.', 'error');
    });
  }

  var applyBtn = document.getElementById('rental-filter-apply');
  if (applyBtn) applyBtn.addEventListener('click', function () { setPage(1); loadList(); });

  var statusEl = document.getElementById('rental-filter-status');
  if (statusEl) statusEl.addEventListener('change', function () { setPage(1); loadList(); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadList);
  } else {
    loadList();
  }
})();
