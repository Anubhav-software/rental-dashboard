/**
 * Process return page: load rental by id, show summary, form (actual date/time + charges). Submit → SweetAlert confirm → PATCH /api/rentals/:id/return.
 */
(function () {
  var root = document.getElementById('return-process-root');
  if (!root) return;

  var basePath = (root.getAttribute('data-base-path') || '').replace(/\/$/, '');
  if (!basePath) basePath = (typeof window !== 'undefined' && window.location.pathname.indexOf('/staff') === 0) ? '/staff' : '/owner';
  var rentalId = (root.getAttribute('data-rental-id') || '').trim();
  if (!rentalId) {
    if (window.showToast) window.showToast('Rental ID missing.', 'error');
    window.location.href = basePath + '/return';
    return;
  }

  var loadingEl = document.getElementById('return-process-loading');
  var errorEl = document.getElementById('return-process-error');
  var formWrap = document.getElementById('return-process-form-wrap');
  var form = document.getElementById('return-form');
  var formErrorEl = document.getElementById('return-form-error');
  var backLink = document.getElementById('return-process-back');
  var cancelLink = document.getElementById('return-process-cancel');
  var addChargeBtn = document.getElementById('return-add-charge');
  var chargesList = document.getElementById('return-charges-list');
  var signatureCanvas = document.getElementById('return-staff-signature-canvas');
  var signatureClearBtn = document.getElementById('return-signature-clear');

  var rental = null;
  var currencySymbol = '';
  var signatureDrawn = false;

  function initSignaturePad() {
    if (!signatureCanvas) return;
    var ctx = signatureCanvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';

    var drawing = false;
    var lastX = 0;
    var lastY = 0;

    function getPos(e) {
      var rect = signatureCanvas.getBoundingClientRect();
      var scaleX = signatureCanvas.width / rect.width;
      var scaleY = signatureCanvas.height / rect.height;
      var clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
      var clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    }

    function start(e) {
      e.preventDefault();
      drawing = true;
      var p = getPos(e);
      lastX = p.x;
      lastY = p.y;
      signatureDrawn = true;
    }
    function move(e) {
      e.preventDefault();
      if (!drawing) return;
      var p = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastX = p.x;
      lastY = p.y;
    }
    function end(e) {
      e.preventDefault();
      drawing = false;
    }

    signatureCanvas.addEventListener('mousedown', start);
    signatureCanvas.addEventListener('mousemove', move);
    signatureCanvas.addEventListener('mouseup', end);
    signatureCanvas.addEventListener('mouseleave', end);
    signatureCanvas.addEventListener('touchstart', start, { passive: false });
    signatureCanvas.addEventListener('touchmove', move, { passive: false });
    signatureCanvas.addEventListener('touchend', end, { passive: false });
  }

  function clearSignature() {
    if (!signatureCanvas) return;
    var ctx = signatureCanvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureDrawn = false;
  }

  function getSignatureDataUrl() {
    if (!signatureCanvas || !signatureDrawn) return null;
    return signatureCanvas.toDataURL('image/png');
  }

  function formatDateStr(d, time) {
    if (!d) return '—';
    var s = typeof d === 'string' ? d : (d instanceof Date ? d.toISOString() : String(d));
    var datePart = s.slice(0, 10);
    return time ? datePart + ' ' + (time || '') : datePart;
  }

  function renderSummary() {
    if (!rental) return;
    var sym = rental.currencySymbol || '';
    var contractEl = document.getElementById('return-summary-contract');
    var customerVehicleEl = document.getElementById('return-summary-customer-vehicle');
    var expectedEl = document.getElementById('return-summary-expected');
    var advanceDepositEl = document.getElementById('return-summary-advance-deposit');
    if (contractEl) contractEl.textContent = 'Contract ' + (rental.contractNumber || '—');
    var cust = rental.customer ? rental.customer.name : '—';
    var veh = rental.vehicle ? ((rental.vehicle.make || '') + ' ' + (rental.vehicle.model || '')).trim() : '—';
    if (customerVehicleEl) customerVehicleEl.textContent = cust + ' · ' + veh;
    var expectedStr = formatDateStr(rental.expectedReturnDate, rental.expectedReturnTime);
    if (expectedEl) expectedEl.textContent = 'Expected return: ' + expectedStr;
    var advance = rental.advancePaid != null ? Number(rental.advancePaid) : 0;
    var dep = rental.deposit != null ? Number(rental.deposit) : 0;
    if (advanceDepositEl) advanceDepositEl.textContent = 'Advance paid: ' + sym + advance + ' · Deposit: ' + sym + dep;
  }

  function addChargeRow() {
    var row = document.createElement('div');
    row.className = 'row g-3 mb-3 return-charge-row';
    row.innerHTML =
      '<div class="col-md-5"><input type="text" class="form-control form-control-sm bg-neutral-50 radius-12 return-charge-desc" placeholder="Description (e.g. Late fee, Fuel)"></div>' +
      '<div class="col-md-4"><input type="number" class="form-control form-control-sm bg-neutral-50 radius-12 return-charge-amount" placeholder="Amount" min="0" step="0.01" value="0"></div>' +
      '<div class="col-md-3 d-flex align-items-center"><button type="button" class="btn btn-sm btn-outline-danger radius-8 return-remove-charge">Remove</button></div>';
    chargesList.appendChild(row);
    row.querySelector('.return-remove-charge').addEventListener('click', function () { row.remove(); });
  }

  if (addChargeBtn) addChargeBtn.addEventListener('click', addChargeRow);
  if (signatureClearBtn) signatureClearBtn.addEventListener('click', clearSignature);

  function loadRental() {
    if (!window.rentalApi || !window.rentalApi.getById) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = 'Rental API not loaded.'; }
      return;
    }
    window.rentalApi.getById(rentalId).then(function (data) {
      rental = data.rental || data;
      if (!rental || !rental.id) {
        if (loadingEl) loadingEl.classList.add('d-none');
        if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = 'Rental not found.'; }
        if (window.showToast) window.showToast('Rental not found.', 'error');
        return;
      }
      if (rental.status !== 'ACTIVE') {
        if (loadingEl) loadingEl.classList.add('d-none');
        if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = 'This rental is not active. Return cannot be processed.'; }
        if (window.showToast) window.showToast('Rental is not active.', 'error');
        return;
      }
      currencySymbol = rental.currencySymbol || '';
      if (loadingEl) loadingEl.classList.add('d-none');
      if (formWrap) formWrap.classList.remove('d-none');
      renderSummary();
      initSignaturePad();
      var today = new Date();
      var dateStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      var dateInput = document.getElementById('actualReturnDate');
      if (dateInput && !dateInput.value) dateInput.value = dateStr;
      addChargeRow();
    }).catch(function (err) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) {
        errorEl.classList.remove('d-none');
        errorEl.textContent = err.message || 'Failed to load rental.';
      }
      if (window.showToast) window.showToast(err.message || 'Failed to load rental.', 'error');
    });
  }

  if (backLink) backLink.setAttribute('href', basePath + '/return');
  if (cancelLink) cancelLink.setAttribute('href', basePath + '/return');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var dateInput = document.getElementById('actualReturnDate');
      var timeInput = document.getElementById('actualReturnTime');
      var actualReturnDate = dateInput && dateInput.value ? dateInput.value.trim() : '';
      var actualReturnTime = (timeInput && timeInput.value ? timeInput.value.trim() : '') || '10:00';
      if (!actualReturnDate) {
        if (formErrorEl) { formErrorEl.textContent = 'Return date is required.'; formErrorEl.classList.remove('d-none'); }
        if (dateInput) dateInput.focus();
        return;
      }
      if (formErrorEl) formErrorEl.classList.add('d-none');

      var chargeRows = chargesList.querySelectorAll('.return-charge-row');
      var charges = [];
      chargeRows.forEach(function (row) {
        var desc = (row.querySelector('.return-charge-desc') && row.querySelector('.return-charge-desc').value) || '';
        var amt = parseFloat(row.querySelector('.return-charge-amount') && row.querySelector('.return-charge-amount').value, 10);
        if (desc.trim() && !isNaN(amt) && amt >= 0) charges.push({ description: desc.trim(), charge_amount: amt });
      });

      var doSubmit = function () {
        var btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        var body = { actual_return_date: actualReturnDate, actual_return_time: actualReturnTime, charges: charges };
        var sig = getSignatureDataUrl();
        if (sig) body.return_processed_by_signature = sig;
        window.rentalApi.processReturn(rentalId, body).then(function () {
          if (window.showToast) window.showToast('Return processed successfully. Rental completed.', 'success');
          window.location.href = basePath + '/rental/view/' + encodeURIComponent(rentalId) + '?returned=1';
        }).catch(function (err) {
          if (btn) btn.disabled = false;
          var msg = (err.data && err.data.error) ? err.data.error : (err.message || 'Failed to process return.');
          if (window.showToast) window.showToast(msg, 'error');
          if (formErrorEl) { formErrorEl.textContent = msg; formErrorEl.classList.remove('d-none'); }
        });
      };

      if (typeof Swal !== 'undefined') {
        Swal.fire({
          title: 'Confirm return?',
          text: 'This will complete the rental and free the vehicle.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonColor: '#0d6efd',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Yes, complete return'
        }).then(function (result) {
          if (result && result.isConfirmed) doSubmit();
        });
      } else if (confirm('Confirm return? This will complete the rental and free the vehicle.')) {
        doSubmit();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadRental);
  } else {
    loadRental();
  }
})();
