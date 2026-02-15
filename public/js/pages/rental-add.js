/**
 * Create Rental page: load vehicles (AVAILABLE) + customers via API; submit via rentalApi.create.
 */
(function () {
  var form = document.getElementById('rental-form');
  if (!form) return;

  var wrap = form.closest('[data-base-path]');
  var basePath = (wrap && wrap.getAttribute('data-base-path')) || '';
  basePath = (basePath || '').replace(/\/$/, '');
  if (!basePath || /\/rental$/.test(basePath)) basePath = (typeof window !== 'undefined' && window.location.pathname.indexOf('/staff') === 0) ? '/staff' : '/owner';
  var listUrl = basePath + '/rental';

  var customerSelect = document.getElementById('rental-customerId');
  var vehicleSelect = document.getElementById('rental-vehicleId');
  var totalAmountInput = document.getElementById('rental-totalAmount');
  var calculationBreakdown = document.getElementById('rental-calculation-breakdown');
  var calculationText = document.getElementById('rental-calculation-text');
  var vehiclesCache = [];

  /** Init a signature pad on a canvas; returns { getDataUrl, clear }. */
  function initSignaturePad(canvasEl) {
    var drawn = false;
    if (!canvasEl) return { getDataUrl: function () { return null; }, clear: function () {} };
    var ctx = canvasEl.getContext('2d');
    if (!ctx) return { getDataUrl: function () { return null; }, clear: function () {} };
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    var drawing = false;
    var lastX = 0, lastY = 0;
    function getPos(e) {
      var rect = canvasEl.getBoundingClientRect();
      var scaleX = canvasEl.width / rect.width;
      var scaleY = canvasEl.height / rect.height;
      var clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
      var clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
      return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    }
    function start(e) { e.preventDefault(); drawing = true; var p = getPos(e); lastX = p.x; lastY = p.y; drawn = true; }
    function move(e) {
      e.preventDefault();
      if (!drawing) return;
      var p = getPos(e);
      ctx.beginPath(); ctx.moveTo(lastX, lastY); ctx.lineTo(p.x, p.y); ctx.stroke();
      lastX = p.x; lastY = p.y;
    }
    function end(e) { e.preventDefault(); drawing = false; }
    canvasEl.addEventListener('mousedown', start);
    canvasEl.addEventListener('mousemove', move);
    canvasEl.addEventListener('mouseup', end);
    canvasEl.addEventListener('mouseleave', end);
    canvasEl.addEventListener('touchstart', start, { passive: false });
    canvasEl.addEventListener('touchmove', move, { passive: false });
    canvasEl.addEventListener('touchend', end, { passive: false });
    return {
      getDataUrl: function () { return drawn ? canvasEl.toDataURL('image/png') : null; },
      clear: function () { ctx.clearRect(0, 0, canvasEl.width, canvasEl.height); drawn = false; }
    };
  }
  var customerSignaturePad = null;
  var staffSignaturePad = null;

  /**
   * Get rate_per_day from vehicle's dailyRateTiers for given totalDays.
   * Tiers are e.g. { min_days: 1, max_days: 1, rate_per_day: 300 }, { min_days: 5, max_days: 5, rate_per_day: 280 }.
   * Pick the tier whose max_days >= totalDays (smallest bracket that fits); else use highest tier.
   */
  function getRateFromTiers(tiers, totalDays) {
    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) return null;
    var days = Math.ceil(totalDays);
    if (days < 1) days = 1;
    var sorted = tiers.slice().sort(function (a, b) {
      var maxA = a.max_days != null ? a.max_days : a.min_days;
      var maxB = b.max_days != null ? b.max_days : b.min_days;
      return maxA - maxB;
    });
    for (var i = 0; i < sorted.length; i++) {
      var max = sorted[i].max_days != null ? sorted[i].max_days : sorted[i].min_days;
      if (days <= max) return sorted[i].rate_per_day != null ? Number(sorted[i].rate_per_day) : null;
    }
    var last = sorted[sorted.length - 1];
    return last.rate_per_day != null ? Number(last.rate_per_day) : null;
  }

  /** Calculate total from vehicle's dailyRateTiers (duration-based rates) + start/end. No charge method — auto from period. Updates breakdown UI. */
  function updateTotalAmount() {
    if (!vehicleSelect || !totalAmountInput) return;
    var vehicleId = vehicleSelect.value;
    if (!vehicleId) {
      totalAmountInput.value = '';
      if (calculationBreakdown) calculationBreakdown.classList.add('d-none');
      return;
    }
    var vehicle = vehiclesCache.find(function (v) { return v.id === vehicleId; });
    var startDate = form.querySelector('[name="startDate"]') && form.querySelector('[name="startDate"]').value;
    var startTime = (form.querySelector('[name="startTime"]') && form.querySelector('[name="startTime"]').value) || '10:00';
    var endDate = form.querySelector('[name="endDate"]') && form.querySelector('[name="endDate"]').value;
    var endTime = (form.querySelector('[name="endTime"]') && form.querySelector('[name="endTime"]').value) || '10:00';
    if (!startDate || !endDate) {
      totalAmountInput.value = '';
      if (calculationBreakdown) calculationBreakdown.classList.add('d-none');
      return;
    }
    var start = new Date(startDate + 'T' + (startTime || '00:00'));
    var end = new Date(endDate + 'T' + (endTime || '00:00'));
    if (end <= start) {
      totalAmountInput.value = '';
      if (calculationBreakdown) calculationBreakdown.classList.add('d-none');
      return;
    }
    var totalMs = end - start;
    var totalDays = totalMs / (24 * 60 * 60 * 1000);
    var chargeDays = Math.ceil(totalDays);
    if (chargeDays < 1) chargeDays = 1;
    var ratePerDay = null;
    var amount = 0;
    var source = '';
    if (vehicle && vehicle.dailyRateTiers && vehicle.dailyRateTiers.length > 0) {
      ratePerDay = getRateFromTiers(vehicle.dailyRateTiers, totalDays);
      if (ratePerDay != null) {
        amount = chargeDays * ratePerDay;
        source = 'tier';
      }
    }
    if (amount === 0 && vehicle) {
      var daily = vehicle.dailyRate != null ? Number(vehicle.dailyRate) : 0;
      if (daily > 0) {
        ratePerDay = daily;
        amount = chargeDays * daily;
        source = 'daily';
      }
    }
    var rounded = amount > 0 ? Math.round(amount) : 0;
    totalAmountInput.value = rounded > 0 ? rounded : '';

    if (calculationBreakdown && calculationText) {
      if (rounded > 0 && ratePerDay != null) {
        var rateStr = typeof ratePerDay === 'number' && ratePerDay % 1 !== 0 ? ratePerDay.toFixed(2) : ratePerDay;
        var dayLabel = chargeDays === 1 ? 'day' : 'days';
        calculationText.textContent = chargeDays + ' ' + dayLabel + ' × ₹' + rateStr + '/day = ₹' + String(rounded);
        calculationBreakdown.classList.remove('d-none');
      } else {
        calculationBreakdown.classList.add('d-none');
      }
    }
  }

  function loadDropdowns() {
    if (!window.vehicleApi || !window.vehicleApi.list || !window.customerApi || !window.customerApi.list) {
      if (customerSelect) { customerSelect.innerHTML = '<option value="">API not loaded</option>'; }
      if (vehicleSelect) { vehicleSelect.innerHTML = '<option value="">API not loaded</option>'; }
      return;
    }
    Promise.all([
      window.vehicleApi.list({ status: 'AVAILABLE', limit: 100 }),
      window.customerApi.list({ limit: 100 })
    ]).then(function (results) {
      var vehicles = (results[0] && results[0].vehicles) ? results[0].vehicles : [];
      vehiclesCache = vehicles;
      var customers = (results[1] && results[1].customers) ? results[1].customers : [];
      if (customerSelect) {
        customerSelect.innerHTML = '<option value="">Select customer</option>';
        customers.forEach(function (c) {
          var opt = document.createElement('option');
          opt.value = c.id;
          opt.textContent = (c.name || '') + ' (' + (c.phone || '') + ')';
          customerSelect.appendChild(opt);
        });
      }
      if (vehicleSelect) {
        vehicleSelect.innerHTML = '<option value="">Select vehicle (available only)</option>';
        vehicles.forEach(function (v) {
          var opt = document.createElement('option');
          opt.value = v.id;
          var firstRate = (v.dailyRateTiers && v.dailyRateTiers[0] && v.dailyRateTiers[0].rate_per_day) ? v.dailyRateTiers[0].rate_per_day : (v.dailyRate != null ? v.dailyRate : '');
          opt.textContent = (v.make || '') + ' ' + (v.model || '') + ' - ' + (v.registrationNumber || '') + (firstRate !== '' ? ' (₹' + firstRate + '/day from tiers)' : '');
          vehicleSelect.appendChild(opt);
        });
        vehicleSelect.addEventListener('change', updateTotalAmount);
      }
    }).catch(function (err) {
      if (window.showToast) window.showToast(err.message || 'Failed to load options', 'error');
      if (customerSelect) customerSelect.innerHTML = '<option value="">Error loading</option>';
      if (vehicleSelect) vehicleSelect.innerHTML = '<option value="">Error loading</option>';
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    function get(name) {
      var el = form.querySelector('[name="' + name + '"]');
      return el ? (el.type === 'checkbox' ? el.checked : (el.value || '').trim()) : '';
    }
    var vehicleId = get('vehicleId');
    var customerId = get('customerId');
    var startDate = get('startDate');
    var startTime = get('startTime') || '10:00';
    var endDate = get('endDate');
    var endTime = get('endTime') || '10:00';
    var selectedChargeMethod = (form.querySelector('[name="selectedChargeMethod"]') && form.querySelector('[name="selectedChargeMethod"]').value) || 'DAILY';
    var totalAmount = parseFloat(get('totalAmount'), 10);
    var advancePaid = parseFloat(get('advancePaid'), 10);
    var deposit = parseFloat(get('deposit'), 10);
    var termsAccepted = form.querySelector('[name="termsAccepted"]') && form.querySelector('[name="termsAccepted"]').checked;
    var helmetsQuantity = form.querySelector('[name="helmetsQuantity"]');
    helmetsQuantity = helmetsQuantity && helmetsQuantity.value !== '' ? parseInt(helmetsQuantity.value, 10) : undefined;

    if (!vehicleId || !customerId) {
      if (window.showToast) window.showToast('Please select customer and vehicle.', 'error');
      return;
    }
    if (!startDate || !endDate) {
      if (window.showToast) window.showToast('Start date and end date are required.', 'error');
      return;
    }
    if (isNaN(totalAmount) || totalAmount < 0) {
      if (window.showToast) window.showToast('Please enter a valid total amount.', 'error');
      return;
    }
    if (isNaN(advancePaid)) advancePaid = 0;
    if (isNaN(deposit)) deposit = 0;
    if (!termsAccepted) {
      if (window.showToast) window.showToast('Please accept the terms and conditions.', 'error');
      return;
    }

    var body = {
      vehicle_id: vehicleId,
      customer_id: customerId,
      start_date: startDate,
      start_time: startTime,
      end_date: endDate,
      end_time: endTime,
      selected_charge_method: selectedChargeMethod,
      total_amount: totalAmount,
      advance_paid: advancePaid,
      deposit: deposit,
      terms_accepted: true
    };
    if (helmetsQuantity != null && !isNaN(helmetsQuantity)) body.helmets_quantity = helmetsQuantity;
    var custSig = customerSignaturePad && customerSignaturePad.getDataUrl();
    if (custSig) body.customer_signature = custSig;
    var staffSig = staffSignaturePad && staffSignaturePad.getDataUrl();
    if (staffSig) body.staff_signature = staffSig;

    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    if (!window.rentalApi || !window.rentalApi.create) {
      if (btn) btn.disabled = false;
      if (window.showToast) window.showToast('Rental API not loaded.', 'error');
      return;
    }
    window.rentalApi.create(body).then(function (data) {
      if (window.showToast) window.showToast('Rental created successfully!', 'success');
      var id = data.rental && data.rental.id;
      setTimeout(function () {
        window.location.href = id ? basePath + '/rental/view/' + encodeURIComponent(id) : listUrl;
      }, 800);
    }).catch(function (err) {
      if (btn) btn.disabled = false;
      var msg = (err.data && err.data.error) ? err.data.error : (err.message || 'Failed to create rental.');
      if (window.showToast) window.showToast(msg, 'error');
    });
  });

  var startDateEl = form.querySelector('[name="startDate"]');
  var startTimeEl = form.querySelector('[name="startTime"]');
  var endDateEl = form.querySelector('[name="endDate"]');
  var endTimeEl = form.querySelector('[name="endTime"]');
  [startDateEl, startTimeEl, endDateEl, endTimeEl].forEach(function (el) {
    if (el) el.addEventListener('change', updateTotalAmount);
  });
  if (startDateEl) startDateEl.addEventListener('input', updateTotalAmount);
  if (endDateEl) endDateEl.addEventListener('input', updateTotalAmount);

  var customerCanvas = document.getElementById('rental-customer-signature-canvas');
  var staffCanvas = document.getElementById('rental-staff-signature-canvas');
  var customerClearBtn = document.getElementById('rental-customer-signature-clear');
  var staffClearBtn = document.getElementById('rental-staff-signature-clear');
  if (customerCanvas) customerSignaturePad = initSignaturePad(customerCanvas);
  if (staffCanvas) staffSignaturePad = initSignaturePad(staffCanvas);
  if (customerClearBtn && customerSignaturePad) customerClearBtn.addEventListener('click', function () { customerSignaturePad.clear(); });
  if (staffClearBtn && staffSignaturePad) staffClearBtn.addEventListener('click', function () { staffSignaturePad.clear(); });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDropdowns);
  } else {
    loadDropdowns();
  }
})();
