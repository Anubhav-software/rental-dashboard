/**
 * Add Customer page: basePath, listUrl, form submit via customerApi.create
 */
(function () {
  var form = document.getElementById('customer-form');
  if (!form) return;
  var basePath = (form.closest('[data-base-path]') && form.closest('[data-base-path]').getAttribute('data-base-path'))
    ? form.closest('[data-base-path]').getAttribute('data-base-path')
    : (typeof window !== 'undefined' && window.location.pathname.indexOf('/staff') === 0 ? '/staff' : '/owner');
  basePath = (basePath || '').replace(/\/$/, '');
  if (!basePath || /\/customer$/.test(basePath)) basePath = (typeof window !== 'undefined' && window.location.pathname.indexOf('/staff') === 0) ? '/staff' : '/owner';
  var listUrl = basePath + '/customer';

  var cancelLink = document.getElementById('add-customer-cancel-link');
  if (cancelLink) cancelLink.href = listUrl;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var get = function (name) {
      var el = form.querySelector('[name="' + name + '"]');
      return el ? (el.type === 'checkbox' ? el.checked : (el.value || '').trim()) : '';
    };
    var bookingDate = get('bookingDate');
    var dateOfTour = get('dateOfTour');
    var numPeople = get('numberOfPeople');
    var body = {
      name: get('name'),
      phone: get('phone'),
      nationality: get('nationality'),
      passportNumber: get('passportNumber'),
      hotelName: get('hotelName'),
      bookingDate: bookingDate || null,
      dateOfTour: dateOfTour || null,
      numberOfPeople: numPeople !== '' ? parseInt(numPeople, 10) : null,
      roomNo: get('roomNo'),
      confirmedBy: get('confirmedBy'),
      email: get('email') || undefined,
      address: get('address') || undefined,
      customerPincode: get('customerPincode') || undefined,
      customerState: get('customerState') || undefined,
      idProofType: get('idProofType') || undefined,
      idProofNumber: get('idProofNumber') || undefined,
      licenseNumber: get('licenseNumber') || undefined,
      isBusinessCustomer: !!(form.querySelector('[name="isBusinessCustomer"]') && form.querySelector('[name="isBusinessCustomer"]').checked),
      taxIdNumber: get('taxIdNumber') || undefined,
      taxIdType: get('taxIdType') || undefined,
      businessName: get('businessName') || undefined,
      customerCompanyAddress: get('customerCompanyAddress') || undefined,
      customerCompanyPincode: get('customerCompanyPincode') || undefined,
      customerCompanyState: get('customerCompanyState') || undefined
    };
    if (!body.name || !body.phone) {
      if (window.showToast) window.showToast('Name and Phone are required.', 'error');
      else alert('Name and Phone are required.');
      return;
    }
    if (!body.nationality || !body.passportNumber || !body.hotelName || !body.roomNo || !body.confirmedBy) {
      if (window.showToast) window.showToast('Nationality, Passport number, Hotel name, Room number and Confirmed by are required.', 'error');
      else alert('Nationality, Passport number, Hotel name, Room number and Confirmed by are required.');
      return;
    }
    if (!body.bookingDate || !body.dateOfTour || body.numberOfPeople == null) {
      if (window.showToast) window.showToast('Booking date, Date of tour and Number of people are required.', 'error');
      else alert('Booking date, Date of tour and Number of people are required.');
      return;
    }
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    if (!window.customerApi || !window.customerApi.create) {
      if (btn) btn.disabled = false;
      if (window.showToast) window.showToast('Customer API not loaded.', 'error');
      else alert('Customer API not loaded.');
      return;
    }
    window.customerApi.create(body).then(function () {
      if (window.showToast) window.showToast('Customer saved successfully!', 'success');
      setTimeout(function () { window.location.href = listUrl; }, 800);
    }).catch(function (err) {
      if (btn) btn.disabled = false;
      var msg = err.data && err.data.error ? err.data.error : (err.message || 'Failed to create customer.');
      if (window.showToast) window.showToast(msg, 'error');
      else alert(msg);
    });
  });
})();
