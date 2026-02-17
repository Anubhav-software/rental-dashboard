/**
 * Edit Rental: load rental + vehicles + customers; pre-fill form; submit via rentalApi.update with SweetAlert confirm.
 * Only ACTIVE rentals can be edited.
 */
(function () {
  var root = document.getElementById('rental-edit-root');
  if (!root) return;
  var rentalId = root.getAttribute('data-rental-id');
  var basePath = (root.getAttribute('data-base-path') || '').replace(/\/$/, '');
  if (!basePath || /\/rental$/.test(basePath)) basePath = (typeof window !== 'undefined' && window.location.pathname.indexOf('/staff') === 0) ? '/staff' : '/owner';

  var loadingEl = document.getElementById('rental-edit-loading');
  var errorEl = document.getElementById('rental-edit-error');
  var formWrap = document.getElementById('rental-edit-form-wrap');
  var form = document.getElementById('rental-edit-form');

  var vehiclesCache = [];

  function fmtDate(d) {
    if (!d) return '';
    var s = typeof d === 'string' ? d : (d instanceof Date ? d.toISOString() : String(d));
    return s.slice(0, 10);
  }

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

  function updateTotalAmount() {
    var vehSelect = document.getElementById('edit-vehicleId');
    var totalInput = document.getElementById('edit-totalAmount');
    var breakdown = document.getElementById('edit-calculation-breakdown');
    var breakdownText = document.getElementById('edit-calculation-text');
    if (!vehSelect || !totalInput) return;
    var vehicleId = vehSelect.value;
    if (!vehicleId) {
      if (breakdown) breakdown.classList.add('d-none');
      return;
    }
    var vehicle = vehiclesCache.find(function (v) { return v.id === vehicleId; });
    var startDate = document.getElementById('edit-startDate') && document.getElementById('edit-startDate').value;
    var startTime = (document.getElementById('edit-startTime') && document.getElementById('edit-startTime').value) || '10:00';
    var endDate = document.getElementById('edit-endDate') && document.getElementById('edit-endDate').value;
    var endTime = (document.getElementById('edit-endTime') && document.getElementById('edit-endTime').value) || '10:00';
    if (!startDate || !endDate) {
      if (breakdown) breakdown.classList.add('d-none');
      return;
    }
    var start = new Date(startDate + 'T' + (startTime || '00:00'));
    var end = new Date(endDate + 'T' + (endTime || '00:00'));
    if (end <= start) {
      if (breakdown) breakdown.classList.add('d-none');
      return;
    }
    var totalMs = end - start;
    var totalDays = totalMs / (24 * 60 * 60 * 1000);
    var chargeDays = Math.ceil(totalDays);
    if (chargeDays < 1) chargeDays = 1;
    var ratePerDay = null;
    var amount = 0;
    if (vehicle && vehicle.dailyRateTiers && vehicle.dailyRateTiers.length > 0) {
      ratePerDay = getRateFromTiers(vehicle.dailyRateTiers, totalDays);
      if (ratePerDay != null) amount = chargeDays * ratePerDay;
    }
    if (amount === 0 && vehicle && vehicle.dailyRate != null) {
      ratePerDay = Number(vehicle.dailyRate);
      if (ratePerDay > 0) amount = chargeDays * ratePerDay;
    }
    var rounded = amount > 0 ? Math.round(amount) : 0;
    if (rounded > 0) totalInput.value = rounded;
    if (breakdown && breakdownText) {
      if (rounded > 0 && ratePerDay != null) {
        var rateStr = typeof ratePerDay === 'number' && ratePerDay % 1 !== 0 ? ratePerDay.toFixed(2) : ratePerDay;
        var dayLabel = chargeDays === 1 ? 'day' : 'days';
        breakdownText.textContent = chargeDays + ' ' + dayLabel + ' × ₹' + rateStr + '/day = ₹' + String(rounded);
        breakdown.classList.remove('d-none');
      } else {
        breakdown.classList.add('d-none');
      }
    }
  }

  function setBackLinks() {
    var back = document.getElementById('rental-edit-back');
    var cancel = document.getElementById('rental-edit-cancel');
    if (back) back.href = basePath + '/rental/view/' + encodeURIComponent(rentalId);
    if (cancel) cancel.href = basePath + '/rental/view/' + encodeURIComponent(rentalId);
  }

  if (!rentalId || !window.rentalApi || !window.rentalApi.getById) {
    if (loadingEl) loadingEl.classList.add('d-none');
    if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = 'Rental ID or API missing.'; }
    return;
  }

  Promise.all([
    window.rentalApi.getById(rentalId, false),
    window.vehicleApi && window.fetchAllVehicles ? window.fetchAllVehicles() : (window.vehicleApi ? window.vehicleApi.list({ limit: 100 }) : Promise.resolve({ vehicles: [] })).then(function (res) { return (res && res.vehicles) ? res.vehicles : []; }),
    window.customerApi && window.fetchAllCustomers ? window.fetchAllCustomers() : (window.customerApi ? window.customerApi.list({ limit: 100 }) : Promise.resolve({ customers: [] })).then(function (res) { return (res && res.customers) ? res.customers : []; })
  ]).then(function (results) {
    var rentalData = results[0];
    var r = rentalData.rental;
    var vehicles = Array.isArray(results[1]) ? results[1] : (results[1] && results[1].vehicles ? results[1].vehicles : []);
    vehiclesCache = vehicles;
    var customers = Array.isArray(results[2]) ? results[2] : (results[2] && results[2].customers ? results[2].customers : []);

    if (!r) {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = 'Rental not found.'; }
      return;
    }
    if (r.status !== 'ACTIVE') {
      if (loadingEl) loadingEl.classList.add('d-none');
      if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = 'Only active rentals can be edited.'; }
      return;
    }

    if (loadingEl) loadingEl.classList.add('d-none');
    formWrap.classList.remove('d-none');
    setBackLinks();

    var custSelect = document.getElementById('edit-customerId');
    var vehSelect = document.getElementById('edit-vehicleId');
    custSelect.innerHTML = '<option value="">Select customer</option>';
    customers.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = (c.name || '') + ' (' + (c.phone || '') + ')';
      if (c.id === r.customerId) opt.selected = true;
      custSelect.appendChild(opt);
    });
    vehSelect.innerHTML = '<option value="">Select vehicle</option>';
    vehicles.forEach(function (v) {
      var opt = document.createElement('option');
      opt.value = v.id;
      opt.textContent = (v.make || '') + ' ' + (v.model || '') + ' - ' + (v.registrationNumber || '');
      if (v.id === r.vehicleId) opt.selected = true;
      vehSelect.appendChild(opt);
    });
    if (window.attachSearchToSelect) {
      window.attachSearchToSelect(custSelect, 'Search customer…');
      window.attachSearchToSelect(vehSelect, 'Search vehicle…');
    }

    document.getElementById('edit-startDate').value = fmtDate(r.startDate);
    document.getElementById('edit-startTime').value = (r.startTime || '10:00').toString().slice(0, 5);
    document.getElementById('edit-endDate').value = fmtDate(r.endDate);
    document.getElementById('edit-endTime').value = (r.endTime || '10:00').toString().slice(0, 5);
    document.getElementById('edit-selectedChargeMethod').value = r.selectedChargeMethod || 'DAILY';
    document.getElementById('edit-totalAmount').value = r.totalAmount != null ? r.totalAmount : '';
    document.getElementById('edit-advancePaid').value = r.advancePaid != null ? r.advancePaid : '0';
    document.getElementById('edit-deposit').value = r.deposit != null ? r.deposit : '0';
    var helmets = document.getElementById('edit-helmetsQuantity');
    if (helmets) helmets.value = r.helmetsQuantity != null ? r.helmetsQuantity : '';

    updateTotalAmount();
    var startDateEl = document.getElementById('edit-startDate');
    var startTimeEl = document.getElementById('edit-startTime');
    var endDateEl = document.getElementById('edit-endDate');
    var endTimeEl = document.getElementById('edit-endTime');
    var vehicleSelectEl = document.getElementById('edit-vehicleId');
    [startDateEl, startTimeEl, endDateEl, endTimeEl, vehicleSelectEl].forEach(function (el) {
      if (el) { el.addEventListener('change', updateTotalAmount); el.addEventListener('input', updateTotalAmount); }
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      function get(id) {
        var el = document.getElementById(id);
        return el ? (el.value || '').trim() : '';
      }
      var body = {
        vehicle_id: get('edit-vehicleId'),
        customer_id: get('edit-customerId'),
        start_date: get('edit-startDate'),
        start_time: get('edit-startTime') || '10:00',
        end_date: get('edit-endDate'),
        end_time: get('edit-endTime') || '10:00',
        selected_charge_method: get('edit-selectedChargeMethod') || 'DAILY',
        total_amount: parseFloat(get('edit-totalAmount'), 10),
        advance_paid: parseFloat(get('edit-advancePaid'), 10) || 0,
        deposit: parseFloat(get('edit-deposit'), 10) || 0
      };
      var hq = document.getElementById('edit-helmetsQuantity');
      if (hq && hq.value !== '') body.helmets_quantity = parseInt(hq.value, 10);

      if (!body.vehicle_id || !body.customer_id || !body.start_date || !body.end_date) {
        if (window.showToast) window.showToast('Please fill required fields.', 'error');
        return;
      }
      if (isNaN(body.total_amount) || body.total_amount < 0) {
        if (window.showToast) window.showToast('Please enter a valid total amount.', 'error');
        return;
      }

      var doUpdate = function () {
        var btn = form.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        window.rentalApi.update(rentalId, body).then(function () {
          if (window.showToast) window.showToast('Rental updated.', 'success');
          setTimeout(function () { window.location.href = basePath + '/rental/view/' + encodeURIComponent(rentalId); }, 800);
        }).catch(function (err) {
          if (btn) btn.disabled = false;
          var msg = (err.data && err.data.error) ? err.data.error : (err.message || 'Update failed.');
          if (window.showToast) window.showToast(msg, 'error');
        });
      };

      if (typeof Swal !== 'undefined') {
        Swal.fire({ title: 'Update rental?', text: 'Are you sure you want to save these changes?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#0d6efd', cancelButtonColor: '#6c757d', confirmButtonText: 'Yes, update' }).then(function (result) {
          if (result && result.isConfirmed) doUpdate();
        });
      } else if (confirm('Save changes?')) doUpdate();
    });
  }).catch(function (err) {
    if (loadingEl) loadingEl.classList.add('d-none');
    if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = err.message || 'Failed to load.'; }
    if (window.showToast) window.showToast(err.message || 'Failed to load.', 'error');
  });
})();
