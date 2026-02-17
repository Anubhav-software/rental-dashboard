/**
 * Revenue report page: fetches real analytics summary (revenue) and rentals list (COMPLETED in range).
 * Default range = start of year to today (set by server). Apply button reloads with new from/to.
 * Depends: analyticsApi.js, rentalApi.js.
 */
(function () {
  var CURRENCY = '₹';

  function formatNum(n) {
    if (n == null || Number.isNaN(n)) return '0';
    return Number(n).toLocaleString('en-IN');
  }

  function formatDate(d) {
    if (d == null) return '—';
    if (typeof d === 'string') return d.slice(0, 10);
    try { return new Date(d).toISOString().slice(0, 10); } catch (e) { return '—'; }
  }

  function getFromTo() {
    var fromEl = document.getElementById('revenue-report-from');
    var toEl = document.getElementById('revenue-report-to');
    return {
      from: fromEl ? fromEl.value : '',
      to: toEl ? toEl.value : '',
    };
  }

  function getBasePath() {
    var card = document.querySelector('[data-base-path]');
    return (card && card.getAttribute('data-base-path')) || '';
  }

  function setTotal(revenue) {
    var periodEl = document.getElementById('revenue-report-period');
    var totalEl = document.getElementById('revenue-report-total');
    var range = getFromTo();
    if (periodEl && range.from && range.to) periodEl.textContent = 'Total revenue (' + range.from + ' to ' + range.to + ')';
    if (totalEl) totalEl.textContent = (revenue == null ? '—' : CURRENCY + formatNum(revenue));
  }

  function renderTable(rentals) {
    var tbody = document.getElementById('revenue-report-tbody');
    if (!tbody) return;
    var base = getBasePath();
    if (!rentals || rentals.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary-light py-24">No rentals in this period.</td></tr>';
      return;
    }
    var html = rentals.map(function (r, i) {
      var statusClass = r.status === 'ACTIVE' ? 'bg-success-focus text-success-600' : 'bg-info-focus text-info-600';
      var link = base + '/rental/view/' + (r.id || '');
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td><a href="' + link + '" class="text-primary-light text-decoration-none fw-medium">' + (r.contractNumber || '—') + '</a></td>' +
        '<td><span class="text-secondary-light">' + formatDate(r.startDate) + '</span></td>' +
        '<td><span class="fw-medium">' + CURRENCY + formatNum(r.totalAmount) + '</span></td>' +
        '<td><span class="badge ' + statusClass + '">' + (r.status || '') + '</span></td>' +
        '</tr>';
    }).join('');
    tbody.innerHTML = html;
  }

  function load() {
    var range = getFromTo();
    if (!range.from || !range.to) {
      setTotal(null);
      renderTable([]);
      return;
    }
    var tbody = document.getElementById('revenue-report-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary-light py-24">Loading…</td></tr>';

    var summaryPromise = (window.analyticsApi && window.analyticsApi.summary)
      ? window.analyticsApi.summary({ date_from: range.from, date_to: range.to })
      : Promise.reject(new Error('No API'));
    var rentalsPromise = (window.rentalApi && window.rentalApi.list)
      ? window.rentalApi.list({
          start_date_from: range.from,
          start_date_to: range.to,
          status: 'COMPLETED',
          limit: 100,
          page: 1,
        })
      : Promise.reject(new Error('No API'));

    summaryPromise
      .then(function (data) {
        setTotal(data && data.revenue != null ? data.revenue : 0);
      })
      .catch(function () {
        setTotal(null);
      });

    rentalsPromise
      .then(function (data) {
        var list = (data && data.rentals) ? data.rentals : [];
        renderTable(list);
      })
      .catch(function () {
        if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary-light py-24">Failed to load.</td></tr>';
      });
  }

  function init() {
    load();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
