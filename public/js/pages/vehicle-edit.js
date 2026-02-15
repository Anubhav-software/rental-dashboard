/**
 * Vehicle edit page: load vehicle by ID, fill form, handle submit.
 * Expects a card with data-vehicle-id and data-base-path.
 */
(function() {
  var card = document.querySelector('[data-vehicle-id]');
  if (!card) return;
  var vehicleId = card.getAttribute('data-vehicle-id');
  var basePath = card.getAttribute('data-base-path') || '';
  if (!vehicleId || !window.vehicleApi) return;
  var loadingEl = document.getElementById('edit-loading');
  var formWrap = document.getElementById('edit-form-wrap');
  var form = document.getElementById('vehicle-form');
  var errorEl = document.getElementById('edit-api-error');
  function formatDate(d) {
    if (!d) return '';
    if (typeof d === 'string') return d.slice(0, 10);
    if (d.toISOString) return d.toISOString().slice(0, 10);
    return '';
  }
  window.vehicleApi.getById(vehicleId).then(function(data) {
    var v = (data && data.vehicle) ? data.vehicle : data;
    if (!v || !form) return;
    var set = function(name, val) { var el = form.querySelector('[name="' + name + '"]'); if (el) el.value = (val !== undefined && val !== null && val !== '') ? val : ''; };
    set('make', v.make);
    set('model', v.model);
    set('registrationNumber', v.registrationNumber);
    set('vehicleType', v.vehicleType || 'CAR');
    set('year', v.year);
    set('color', v.color);
    set('seatingCapacity', v.seatingCapacity);
    set('fuelType', v.fuelType);
    set('engineCapacityCc', v.engineCapacityCc != null ? v.engineCapacityCc : v.engine_capacity_cc);
    set('dailyRate', v.dailyRate);
    set('weeklyRate', v.weeklyRate);
    set('monthlyRate', v.monthlyRate);
    set('ownerName', v.ownerName);
    set('ownerContact', v.ownerContact);
    set('deposit', v.deposit);
    var tiers = (v.dailyRateTiers && Array.isArray(v.dailyRateTiers)) ? v.dailyRateTiers : [];
    function totalForDays(tiers, days) {
      for (var i = 0; i < tiers.length; i++) {
        var t = tiers[i];
        if (t.min_days === days && t.max_days === days && t.rate_per_day != null) return t.rate_per_day * days;
      }
      return null;
    }
    for (var d = 1; d <= 7; d++) { var tot = totalForDays(tiers, d); if (tot != null) set('rate_day_' + d, Math.round(tot * 100) / 100); }
    for (var w = 1; w <= 4; w++) { var tot = totalForDays(tiers, w * 7); if (tot != null) set('rate_week_' + w, Math.round(tot * 100) / 100); }
    var m2 = totalForDays(tiers, 60); if (m2 != null) set('rate_month_2', Math.round(m2 * 100) / 100);
    var m3 = totalForDays(tiers, 90); if (m3 != null) set('rate_month_3', Math.round(m3 * 100) / 100);
    set('status', (v.status || 'AVAILABLE').toUpperCase());
    set('taxExpiryDate', formatDate(v.taxExpiryDate));
    set('nextBatteryChangeDate', formatDate(v.nextBatteryChangeDate));
    set('nextServiceDate', formatDate(v.nextServiceDate));
    set('nextOilChangeDate', formatDate(v.nextOilChangeDate));
    var currentImgWrap = document.getElementById('edit-current-image-wrap');
    var currentImg = document.getElementById('edit-current-image');
    if (v.image && currentImgWrap && currentImg) {
      var base = (window.API_BASE_URL || '').replace(/\/$/, '');
      currentImg.src = base + '/uploads/Vehicle-images/' + encodeURIComponent(v.image);
      currentImgWrap.classList.remove('d-none');
    }
    var imageInput = document.getElementById('vehicle-image');
    var previewWrap = document.getElementById('edit-image-preview');
    var previewImg = document.getElementById('edit-image-preview-img');
    if (imageInput && previewWrap && previewImg) {
      imageInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
          previewImg.src = URL.createObjectURL(this.files[0]);
          previewWrap.classList.remove('d-none');
        } else {
          previewImg.src = '';
          previewWrap.classList.add('d-none');
        }
      });
    }
    if (loadingEl) loadingEl.classList.add('d-none');
    if (formWrap) formWrap.classList.remove('d-none');
    form.onsubmit = function(e) {
      e.preventDefault();
      var fd = new FormData(form);
      var body = {
        registrationNumber: (fd.get('registrationNumber') || '').toString().trim() || '',
        vehicleType: (fd.get('vehicleType') || 'CAR').toString(),
        make: (fd.get('make') || '').toString().trim() || '',
        model: (fd.get('model') || '').toString().trim() || '',
        status: (fd.get('status') || 'AVAILABLE').toString()
      };
      if (!body.registrationNumber || !body.make || !body.model) {
        var msg = 'Registration number, Make and Model are required.';
        if (window.showToast) window.showToast(msg, 'error');
        else if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = msg; }
        return;
      }
      var numVal = function(x) { var n = parseFloat(String(x).trim()); return (x !== '' && x != null && !isNaN(n)) ? n : undefined; };
      var intVal = function(x) { var n = parseInt(String(x).trim(), 10); return (x !== '' && x != null && !isNaN(n)) ? n : undefined; };
      var strVal = function(x) { var s = (x == null ? '' : x).toString().trim(); return s === '' ? undefined : s; };
      var dateVal = function(x) { var s = strVal(x); return s || undefined; };
      var depositVal = numVal(fd.get('deposit'));
      if (depositVal == null || depositVal < 0) {
        var msgDep = 'Deposit is required.';
        if (window.showToast) window.showToast(msgDep, 'error');
        else if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = msgDep; }
        return;
      }
      if (intVal(fd.get('year')) != null) body.year = intVal(fd.get('year'));
      if (strVal(fd.get('color')) != null) body.color = strVal(fd.get('color'));
      if (intVal(fd.get('seatingCapacity')) != null) body.seatingCapacity = intVal(fd.get('seatingCapacity'));
      if (strVal(fd.get('fuelType')) != null) body.fuelType = strVal(fd.get('fuelType'));
      if (intVal(fd.get('engineCapacityCc')) != null) body.engineCapacityCc = intVal(fd.get('engineCapacityCc'));
      if (numVal(fd.get('dailyRate')) != null) body.dailyRate = numVal(fd.get('dailyRate'));
      if (numVal(fd.get('weeklyRate')) != null) body.weeklyRate = numVal(fd.get('weeklyRate'));
      if (numVal(fd.get('monthlyRate')) != null) body.monthlyRate = numVal(fd.get('monthlyRate'));
      if (numVal(fd.get('deposit')) != null) body.deposit = numVal(fd.get('deposit'));
      var dailyRateTiers = [];
      var dayDurations = [1,2,3,4,5,6,7];
      for (var d = 0; d < dayDurations.length; d++) {
        var days = dayDurations[d];
        var total = numVal(fd.get('rate_day_' + days));
        if (total != null && total >= 0) dailyRateTiers.push({ min_days: days, max_days: days, rate_per_day: total / days });
      }
      var weekDurations = [1,2,3,4];
      for (var w = 0; w < weekDurations.length; w++) {
        var weeks = weekDurations[w];
        var days = weeks * 7;
        var total = numVal(fd.get('rate_week_' + weeks));
        if (total != null && total >= 0) dailyRateTiers.push({ min_days: days, max_days: days, rate_per_day: total / days });
      }
      var monthDurations = [2,3];
      for (var m = 0; m < monthDurations.length; m++) {
        var months = monthDurations[m];
        var days = months * 30;
        var total = numVal(fd.get('rate_month_' + months));
        if (total != null && total >= 0) dailyRateTiers.push({ min_days: days, max_days: days, rate_per_day: total / days });
      }
      if (dailyRateTiers.length === 0) {
        var msgTiers = 'Please enter at least one rental charge by duration (e.g. 1 day, 1 week, or 2 months).';
        if (window.showToast) window.showToast(msgTiers, 'error');
        else if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = msgTiers; }
        return;
      }
      body.dailyRateTiers = dailyRateTiers;
      if (strVal(fd.get('ownerName')) != null) body.ownerName = strVal(fd.get('ownerName'));
      if (strVal(fd.get('ownerContact')) != null) body.ownerContact = strVal(fd.get('ownerContact'));
      if (dateVal(fd.get('taxExpiryDate'))) body.taxExpiryDate = dateVal(fd.get('taxExpiryDate'));
      if (dateVal(fd.get('nextBatteryChangeDate'))) body.nextBatteryChangeDate = dateVal(fd.get('nextBatteryChangeDate'));
      if (dateVal(fd.get('nextServiceDate'))) body.nextServiceDate = dateVal(fd.get('nextServiceDate'));
      if (dateVal(fd.get('nextOilChangeDate'))) body.nextOilChangeDate = dateVal(fd.get('nextOilChangeDate'));
      var imageInput = document.getElementById('vehicle-image');
      var imageFile = (imageInput && imageInput.files && imageInput.files[0]) ? imageInput.files[0] : null;
      if (errorEl) { errorEl.classList.add('d-none'); errorEl.textContent = ''; }
      var doUpdate = function() {
        var btn = form.querySelector('button[type=submit]');
        if (btn) btn.disabled = true;
        window.vehicleApi.update(v.id, body, imageFile).then(function() {
          if (window.showToast) window.showToast('Vehicle updated successfully!', 'success');
          setTimeout(function() { window.location.href = basePath + '/vehicle/view/' + encodeURIComponent(v.id); }, 800);
        }).catch(function(err) {
          if (btn) btn.disabled = false;
          var msg = (err.data && err.data.error) ? err.data.error : (err.message || 'Failed to update vehicle.');
          if (window.showToast) window.showToast(msg, 'error');
          else if (errorEl) { errorEl.classList.remove('d-none'); errorEl.textContent = msg; }
        });
      };
      if (window.confirmUpdate) {
        window.confirmUpdate({ title: 'Are you sure?', text: 'You are about to edit the vehicle details!' }, doUpdate);
      } else {
        doUpdate();
      }
    };
  }).catch(function(err) {
    if (err.status === 404 || (err.data && err.data.error && err.data.error.indexOf('not found') !== -1)) window.location.href = basePath + '/vehicle';
    else if (loadingEl) loadingEl.textContent = err.message || 'Failed to load vehicle.';
  });
})();
