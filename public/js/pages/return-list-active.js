/**
 * Return list (active rentals): load via rentalApi.list({ status: 'ACTIVE' }), render table, link to process return.
 */
(function () {
  var card = document.getElementById('return-list-card');
  var loadingEl = document.getElementById('return-list-loading');
  var contentEl = document.getElementById('return-list-content');
  var emptyEl = document.getElementById('return-list-empty');
  var errorEl = document.getElementById('return-list-error');
  var tbody = document.getElementById('return-list-tbody');

  var basePath = (card && card.getAttribute('data-base-path')) || '';
  basePath = (basePath || '').replace(/\/$/, '');
  if (!basePath) basePath = (typeof window !== 'undefined' && window.location.pathname.indexOf('/staff') === 0) ? '/staff' : '/owner';

  function formatDate(d, time) {
    if (!d) return '-';
    var s = typeof d === 'string' ? d : (d instanceof Date ? d.toISOString() : String(d));
    var datePart = s.slice(0, 10);
    return time ? datePart + ' ' + (time || '') : datePart;
  }

  function loadList() {
    if (!window.rentalApi || !window.rentalApi.list) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = 'Rental API not loaded.'; }
      return;
    }
    if (loadingEl) loadingEl.classList.remove('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    if (emptyEl) emptyEl.classList.add('d-none');
    if (errorEl) errorEl.classList.add('d-none');

    window.rentalApi.list({ status: 'ACTIVE', limit: 100 }).then(function (data) {
      if (loadingEl) loadingEl.classList.add('d-none');
      var rentals = (data && data.rentals) ? data.rentals : [];
      if (rentals.length === 0) {
        if (emptyEl) { emptyEl.classList.remove('d-none'); }
      } else {
        tbody.innerHTML = '';
        rentals.forEach(function (r, i) {
          var customerName = (r.customer && r.customer.name) ? r.customer.name : '-';
          var vehicleText = (r.vehicle && (r.vehicle.make || r.vehicle.model)) ? ((r.vehicle.make || '') + ' ' + (r.vehicle.model || '')).trim() : '-';
          var expectedStr = formatDate(r.expectedReturnDate, r.expectedReturnTime);
          var depositStr = (r.currencySymbol || '') + (r.deposit != null ? Number(r.deposit) : '0');
          var tr = document.createElement('tr');
          tr.innerHTML =
            '<td>' + (i + 1) + '</td>' +
            '<td><span class="text-md fw-medium text-primary-light">' + (r.contractNumber || '-') + '</span></td>' +
            '<td><span class="text-md fw-normal text-secondary-light">' + customerName + '</span></td>' +
            '<td><span class="text-md fw-normal text-secondary-light">' + vehicleText + '</span></td>' +
            '<td><span class="text-md fw-normal text-secondary-light">' + expectedStr + '</span></td>' +
            '<td><span class="text-md fw-normal text-secondary-light">' + depositStr + '</span></td>' +
            '<td class="text-center">' +
            '<a href="' + basePath + '/return/process/' + encodeURIComponent(r.id) + '" class="btn btn-primary btn-sm radius-8 d-inline-flex align-items-center gap-2">' +
            '<iconify-icon icon="mdi:backup-restore"></iconify-icon> Process return</a></td>';
          tbody.appendChild(tr);
        });
        if (contentEl) contentEl.classList.remove('d-none');
      }
    }).catch(function (err) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (contentEl) contentEl.classList.add('d-none');
      if (emptyEl) emptyEl.classList.add('d-none');
      if (errorEl) {
        errorEl.classList.remove('d-none');
        errorEl.textContent = err.message || 'Failed to load active rentals.';
      }
      if (window.showToast) window.showToast(err.message || 'Failed to load active rentals.', 'error');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadList);
  } else {
    loadList();
  }
})();
