/**
 * Vehicle view page: load vehicle by ID and fill the view template.
 * Expects a card with data-vehicle-id and data-base-path.
 */
(function() {
  var card = document.querySelector('[data-vehicle-id]');
  if (!card) return;
  var vehicleId = card.getAttribute('data-vehicle-id');
  var basePath = card.getAttribute('data-base-path') || '';
  if (!vehicleId || !window.vehicleApi || !window.vehicleApi.getById) return;
  var loadingEl = document.getElementById('view-loading');
  var contentEl = document.getElementById('view-content');
  var editLink = document.getElementById('view-edit-link');
  var deleteBtn = document.getElementById('view-delete-btn');
  function setVal(field, val) {
    var els = document.querySelectorAll('[data-field="' + field + '"]');
    var text = (val !== undefined && val !== null && val !== '') ? String(val) : '-';
    els.forEach(function(el) { el.textContent = text; });
  }
  function formatDate(d) {
    if (!d) return '-';
    if (typeof d === 'string') return d.slice(0, 10);
    if (d.toISOString) return d.toISOString().slice(0, 10);
    return '-';
  }
  window.vehicleApi.getById(vehicleId).then(function(data) {
    var v = (data && data.vehicle) ? data.vehicle : data;
    if (!v) return;
    setVal('make', v.make);
    setVal('model', v.model);
    setVal('registrationNumber', v.registrationNumber);
    setVal('vehicleTypeLabel', v.vehicleType === 'MOTORBIKE' ? 'Motorbike' : 'Car');
    setVal('year', v.year);
    setVal('color', v.color);
    setVal('seatingCapacity', v.seatingCapacity);
    setVal('fuelType', v.fuelType);
    setVal('dailyRate', v.dailyRate);
    setVal('weeklyRate', v.weeklyRate);
    setVal('monthlyRate', v.monthlyRate);
    setVal('deposit', v.deposit);
    var tiersEl = document.getElementById('view-daily-rate-tiers');
    if (tiersEl && v.dailyRateTiers && Array.isArray(v.dailyRateTiers) && v.dailyRateTiers.length > 0) {
      var rows = [];
      v.dailyRateTiers.forEach(function(t) {
        var min = t.min_days != null ? t.min_days : t.minDays;
        var max = t.max_days != null ? t.max_days : t.maxDays;
        var rate = t.rate_per_day != null ? t.rate_per_day : t.ratePerDay;
        if (min == null || max == null || rate == null) return;
        var days = max;
        var total = Math.round(rate * days * 100) / 100;
        var label = days === 1 ? '1 day' : days === 7 ? '1 week (7 days)' : days === 14 ? '2 weeks (14 days)' : days === 21 ? '3 weeks (21 days)' : days === 28 ? '4 weeks (28 days)' : days === 60 ? '2 months (60 days)' : days === 90 ? '3 months (90 days)' : days + ' days';
        rows.push('<div class="vehicle-view-row d-flex align-items-center py-10 border-bottom border-neutral-200"><span class="text-secondary-light text-sm" style="width: 160px;">' + label + '</span><span class="fw-medium text-primary-light">&#8377;' + Number(rate).toFixed(2) + '/day (Total: &#8377;' + total + ')</span></div>');
      });
      tiersEl.innerHTML = rows.join('');
      tiersEl.classList.remove('d-none');
    } else if (tiersEl) {
      tiersEl.innerHTML = '<div class="text-secondary-light text-sm py-8">No rate tiers set.</div>';
      tiersEl.classList.remove('d-none');
    }
    setVal('taxExpiryDate', formatDate(v.taxExpiryDate));
    setVal('nextBatteryChangeDate', formatDate(v.nextBatteryChangeDate));
    setVal('nextServiceDate', formatDate(v.nextServiceDate));
    setVal('nextOilChangeDate', formatDate(v.nextOilChangeDate));
    var statusEl = document.getElementById('view-status-badge');
    if (statusEl) {
      var s = (v.status || '').toUpperCase();
      statusEl.className = 'px-20 py-8 radius-8 fw-medium text-sm d-inline-flex align-items-center gap-2 border ';
      if (s === 'AVAILABLE') statusEl.className += 'bg-success-focus text-success-600 border-success-main';
      else if (s === 'RENTED') statusEl.className += 'bg-info-focus text-info-600 border-info-main';
      else statusEl.className += 'bg-warning-focus text-warning-600 border-warning-main';
      var label = s === 'AVAILABLE' ? 'Available' : s === 'RENTED' ? 'Rented' : 'Maintenance';
      var lab = statusEl.querySelector('[data-field="statusLabel"]');
      if (lab) lab.textContent = label;
    }
    if (editLink) editLink.href = basePath + '/vehicle/edit/' + encodeURIComponent(v.id);
    var imgEl = document.getElementById('view-vehicle-image');
    var imgPlaceholder = document.getElementById('view-vehicle-image-placeholder');
    if (v.image && imgEl && imgPlaceholder) {
      var base = (window.API_BASE_URL || '').replace(/\/$/, '');
      imgEl.src = base + '/uploads/Vehicle-images/' + encodeURIComponent(v.image);
      imgEl.classList.remove('d-none');
      imgPlaceholder.classList.add('d-none');
    }
    if (loadingEl) loadingEl.classList.add('d-none');
    if (contentEl) contentEl.classList.remove('d-none');
    if (deleteBtn) {
      deleteBtn.onclick = function() {
        if (!confirm('Are you sure you want to delete this vehicle?')) return;
        window.vehicleApi.delete(v.id).then(function() {
          if (window.showToast) window.showToast('Vehicle deleted successfully.', 'success');
          window.location.href = basePath + '/vehicle';
        }).catch(function(err) {
          if (window.showToast) window.showToast(err.message || 'Delete failed', 'error');
          else alert(err.message || 'Delete failed');
        });
      };
    }
  }).catch(function(err) {
    if (err.status === 404 || (err.data && err.data.error && err.data.error.indexOf('not found') !== -1)) window.location.href = basePath + '/vehicle';
    else if (loadingEl) { loadingEl.textContent = err.message || 'Failed to load vehicle.'; }
  });
})();
