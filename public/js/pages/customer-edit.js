/**
 * Customer edit page: load customer by ID, fill form, handle submit.
 * Expects #customer-edit-root with data-customer-id and data-base-path.
 */
(function () {
  var root = document.getElementById('customer-edit-root');
  var form = document.getElementById('customer-form');
  var loadingEl = document.getElementById('customer-edit-loading');
  var errorEl = document.getElementById('customer-edit-error');
  var contentEl = document.getElementById('customer-edit-content');
  if (!root || !form) return;
  var customerId = root.getAttribute('data-customer-id');
  var basePath = (root.getAttribute('data-base-path') || '').replace(/\/$/, '');
  if (!basePath || /\/customer$/.test(basePath)) basePath = (typeof window !== 'undefined' && window.location.pathname.indexOf('/staff') === 0) ? '/staff' : '/owner';

  function setEl(name, value) {
    var el = form.querySelector('[name="' + name + '"]');
    if (!el) return;
    if (el.type === 'checkbox') el.checked = !!value;
    else el.value = value != null && value !== '' ? value : '';
  }

  function dateStr(d) {
    if (!d) return '';
    if (typeof d === 'string') return d.slice(0, 10);
    return d.toISOString ? d.toISOString().slice(0, 10) : '';
  }

  var cancelLink = document.getElementById('edit-cancel-link');
  if (cancelLink) cancelLink.href = basePath + '/customer';

  if (!customerId || !window.customerApi || !window.customerApi.getById) {
    if (loadingEl) loadingEl.classList.add('d-none');
    if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = 'Customer ID or API missing.'; }
    return;
  }

  window.customerApi.getById(customerId).then(function (data) {
    var c = (data && data.customer) ? data.customer : data;
    if (loadingEl) loadingEl.classList.add('d-none');
    if (errorEl) errorEl.classList.add('d-none');
    setEl('name', c.name);
    setEl('phone', c.phone);
    setEl('email', c.email);
    setEl('nationality', c.nationality);
    setEl('passportNumber', c.passportNumber);
    setEl('hotelName', c.hotelName);
    setEl('bookingDate', dateStr(c.bookingDate));
    setEl('dateOfTour', dateStr(c.dateOfTour));
    setEl('numberOfPeople', c.numberOfPeople);
    setEl('roomNo', c.roomNo);
    setEl('confirmedBy', c.confirmedBy);
    if (contentEl) contentEl.classList.remove('d-none');
  }).catch(function (err) {
    if (loadingEl) loadingEl.classList.add('d-none');
    if (contentEl) contentEl.classList.add('d-none');
    if (errorEl) {
      errorEl.classList.remove('d-none');
      errorEl.textContent = err.message || 'Failed to load customer.';
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var get = function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      return el ? (el.type === 'checkbox' ? el.checked : (el.value || '').trim()) : '';
    };
    var body = {
      name: get('name'),
      phone: get('phone'),
      email: get('email') || undefined,
      nationality: get('nationality'),
      passportNumber: get('passportNumber'),
      hotelName: get('hotelName'),
      bookingDate: get('bookingDate') || undefined,
      dateOfTour: get('dateOfTour') || undefined,
      numberOfPeople: get('numberOfPeople') !== '' ? parseInt(get('numberOfPeople'), 10) : undefined,
      roomNo: get('roomNo'),
      confirmedBy: get('confirmedBy')
    };
    if (!body.name || !body.phone) {
      if (window.showToast) window.showToast('Name and Phone are required.', 'error');
      else alert('Name and Phone are required.');
      return;
    }
    var doUpdate = function () {
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      window.customerApi.update(customerId, body).then(function () {
        if (window.showToast) window.showToast('Customer updated successfully!', 'success');
        setTimeout(function () { window.location.href = basePath + '/customer/view/' + encodeURIComponent(customerId); }, 800);
      }).catch(function (err) {
        if (btn) btn.disabled = false;
        var msg = err.data && err.data.error ? err.data.error : (err.message || 'Update failed.');
        if (window.showToast) window.showToast(msg, 'error');
        else alert(msg);
      });
    };
    if (window.confirmUpdate) {
      window.confirmUpdate({ title: 'Are you sure?', text: 'You are about to edit the customer details!' }, doUpdate);
    } else {
      doUpdate();
    }
  });
})();
