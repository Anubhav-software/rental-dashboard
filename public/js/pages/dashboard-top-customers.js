/**
 * Dashboard top customers widget: fetches GET /api/analytics/top-customers for current month.
 * Depends: analyticsApi.js.
 */
(function () {
  var container = document.getElementById('dashboard-top-customers');
  if (!container) return;

  function getCurrentMonthRange() {
    var now = new Date();
    var from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    var to = now.toISOString().slice(0, 10);
    return { date_from: from, date_to: to };
  }

  function formatNum(n) {
    if (n == null || Number.isNaN(n)) return '0';
    return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  function render(list) {
    if (!list || list.length === 0) {
      container.innerHTML = '<p class="text-secondary-light text-sm mb-0">No completed rentals this month.</p>';
      return;
    }
    var html = '<ul class="list-unstyled mb-0">' + list.map(function (c, i) {
      var name = (c.customerName || '—').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;');
      var revenue = formatNum(c.totalRevenue);
      var count = (c.rentalCount != null) ? c.rentalCount : 0;
      return '<li class="d-flex align-items-center justify-content-between py-8 border-bottom border-neutral-200"><span class="text-primary-light fw-medium">' + name + '</span><span class="text-secondary-light text-sm">₹' + revenue + ' (' + count + ')</span></li>';
    }).join('') + '</ul>';
    container.innerHTML = html;
  }

  function setError() {
    container.innerHTML = '<p class="text-secondary-light text-sm mb-0">Failed to load.</p>';
  }

  if (!window.analyticsApi || !window.analyticsApi.topCustomers) {
    setError();
    return;
  }
  var range = getCurrentMonthRange();
  window.analyticsApi.topCustomers({ limit: 10, date_from: range.date_from, date_to: range.date_to })
    .then(function (data) {
      render(Array.isArray(data) ? data : []);
    })
    .catch(setError);
})();
