/**
 * Calendar day view: load rentals for the selected date via rentalApi.list({ on_date }).
 * Renders rentals whose start–end range includes the date.
 */
(function () {
  var card = document.getElementById('cal-day-card');
  var content = document.getElementById('cal-day-content');
  if (!card || !content) return;

  var dateStr = card.getAttribute('data-date');
  var basePath = card.getAttribute('data-base-path') || '';

  if (!dateStr) {
    content.innerHTML = '<p class="text-secondary-light mb-0">Invalid date.</p>';
    return;
  }

  function fmtDate(d) {
    if (!d) return '-';
    var s = typeof d === 'string' ? d : (d.toISOString && d.toISOString());
    return s ? s.slice(0, 10) : '-';
  }

  function statusClass(s) {
    if (s === 'ACTIVE') return 'status-active';
    if (s === 'COMPLETED') return 'status-completed';
    return 'status-other';
  }

  function statusLabel(s) {
    if (s === 'ACTIVE') return 'Active';
    if (s === 'COMPLETED') return 'Completed';
    return 'Cancelled';
  }

  if (!window.rentalApi || !window.rentalApi.list) {
    content.innerHTML = '<p class="text-danger mb-0">Rental API not available.</p>';
    return;
  }

  window.rentalApi
    .list({ on_date: dateStr, limit: 100 })
    .then(function (data) {
      var rentals = (data && data.rentals) ? data.rentals : [];
      if (rentals.length === 0) {
        content.innerHTML =
          '<div class="cal-day-empty">' +
          '<iconify-icon icon="mdi:calendar-blank-outline"></iconify-icon>' +
          '<p class="mb-0">No rentals on this date.</p>' +
          '<a href="' + basePath + '/rental/add?startDate=' + encodeURIComponent(dateStr) + '" class="btn btn-primary btn-sm radius-8 d-inline-flex align-items-center gap-2">' +
          '<iconify-icon icon="ic:baseline-plus"></iconify-icon> Create rental for this date</a>' +
          '</div>';
        return;
      }
      var rows = rentals.map(function (r, i) {
        var cust = r.customer;
        var veh = r.vehicle;
        var custName = cust && cust.name ? cust.name : '-';
        var vehName = veh && (veh.make || veh.model) ? ((veh.make || '') + ' ' + (veh.model || '')).trim() : '-';
        var startEnd = fmtDate(r.startDate) + ' — ' + fmtDate(r.endDate);
        var viewUrl = basePath + '/rental/view/' + encodeURIComponent(r.id);
        return (
          '<tr>' +
          '<td><span class="text-secondary-light">' + (i + 1) + '</span></td>' +
          '<td><span class="contract-num">' + (r.contractNumber || '-') + '</span></td>' +
          '<td><span class="text-secondary-light">' + custName + '</span></td>' +
          '<td><span class="text-secondary-light">' + vehName + '</span></td>' +
          '<td><span class="text-secondary-light">' + startEnd + '</span></td>' +
          '<td><span class="' + statusClass(r.status) + '">' + statusLabel(r.status) + '</span></td>' +
          '<td class="text-center"><a href="' + viewUrl + '" class="btn btn-sm btn-outline-primary radius-8">View</a></td>' +
          '</tr>'
        );
      });
      content.innerHTML =
        '<div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-16">' +
        '<p class="text-sm text-secondary-light mb-0">Rentals that include this date (start — end range).</p>' +
        '<a href="' + basePath + '/rental/add?startDate=' + encodeURIComponent(dateStr) + '" class="btn btn-primary btn-sm radius-8 d-inline-flex align-items-center gap-2">' +
        '<iconify-icon icon="ic:baseline-plus"></iconify-icon> Create rental for this date</a>' +
        '</div>' +
        '<div class="table-responsive scroll-sm">' +
        '<table class="table cal-day-table mb-0">' +
        '<thead><tr>' +
        '<th scope="col">#</th><th scope="col">Contract</th><th scope="col">Customer</th><th scope="col">Vehicle</th>' +
        '<th scope="col">Start — End</th><th scope="col">Status</th><th scope="col" class="text-center">Action</th>' +
        '</tr></thead><tbody>' +
        rows.join('') +
        '</tbody></table></div>';
    })
    .catch(function (err) {
      var msg = (err && err.message) ? err.message : 'Failed to load rentals.';
      if (typeof window.showToast === 'function') {
        window.showToast(msg, 'error');
      }
      content.innerHTML = '<p class="text-danger mb-0">' + (msg || 'Failed to load rentals.') + '</p>';
    });
})();
