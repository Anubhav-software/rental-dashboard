/**
 * Customer view page: load customer by ID and fill the view template.
 * Expects #customer-view-root with data-customer-id and data-base-path.
 */
(function () {
  var root = document.getElementById('customer-view-root');
  var loadingEl = document.getElementById('customer-view-loading');
  var errorEl = document.getElementById('customer-view-error');
  var contentEl = document.getElementById('customer-view-content');
  if (!root) return;
  var customerId = root.getAttribute('data-customer-id');
  var basePath = (root.getAttribute('data-base-path') || '').replace(/\/$/, '');
  if (!basePath || /\/customer$/.test(basePath)) basePath = (typeof window !== 'undefined' && window.location.pathname.indexOf('/staff') === 0) ? '/staff' : '/owner';

  function setVal(field, value) {
    var els = root.querySelectorAll('[data-field="' + field + '"]');
    var v = value != null && value !== '' ? value : '-';
    els.forEach(function (el) { el.textContent = v; });
  }

  function formatDate(d) {
    if (!d) return '-';
    if (typeof d === 'string') return d.slice(0, 10);
    if (d.toISOString) return d.toISOString().slice(0, 10);
    return '-';
  }

  function setLinks() {
    var editLink = document.getElementById('view-edit-link');
    var backLink = document.getElementById('view-back-link');
    if (editLink) editLink.href = basePath + '/customer/edit/' + encodeURIComponent(customerId);
    if (backLink) backLink.href = basePath + '/customer';
  }

  if (!customerId || !window.customerApi || !window.customerApi.getById) {
    if (loadingEl) loadingEl.classList.add('d-none');
    if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = 'Customer ID or API missing.'; }
    return;
  }

  window.customerApi.getById(customerId).then(function (data) {
    var c = (data && data.customer) ? data.customer : data;
    if (loadingEl) loadingEl.classList.add('d-none');
    if (errorEl) errorEl.classList.add('d-none');
    setVal('name', c.name);
    setVal('phone', c.phone);
    setVal('email', c.email);
    setVal('nationality', c.nationality);
    setVal('passportNumber', c.passportNumber);
    setVal('hotelName', c.hotelName);
    setVal('bookingDate', formatDate(c.bookingDate));
    setVal('dateOfTour', formatDate(c.dateOfTour));
    setVal('numberOfPeople', c.numberOfPeople);
    setVal('roomNo', c.roomNo);
    setVal('confirmedBy', c.confirmedBy);
    setLinks();
    if (contentEl) contentEl.classList.remove('d-none');
  }).catch(function (err) {
    if (loadingEl) loadingEl.classList.add('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    if (errorEl) {
      errorEl.classList.remove('d-none');
      errorEl.textContent = err.message || 'Failed to load customer.';
    }
  });
})();
