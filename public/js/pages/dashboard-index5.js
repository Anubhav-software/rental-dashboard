/**
 * Dashboard index5: load real revenue, expenses, profit from analytics API (current month),
 * Active Rentals count and Recent Rentals table from rental API. Shows "—" on error.
 */
(function () {
  var revenueEl = document.getElementById('dashboard-kpi-revenue');
  var expensesEl = document.getElementById('dashboard-kpi-expenses');
  var profitEl = document.getElementById('dashboard-kpi-profit');
  var activeEl = document.getElementById('dashboard-kpi-active-rentals');
  var recentTbody = document.getElementById('dashboard-recent-rentals-tbody');
  if (!revenueEl && !expensesEl && !profitEl && !activeEl && !recentTbody) return;

  var fallback = '—';
  function formatNum(n) {
    if (n == null || isNaN(n)) return '0';
    return Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  function setKpiError() {
    if (revenueEl) revenueEl.textContent = fallback;
    if (expensesEl) expensesEl.textContent = fallback;
    if (profitEl) {
      profitEl.textContent = fallback;
      profitEl.classList.remove('text-success-600', 'text-danger-600');
    }
  }

  if (window.analyticsApi && window.analyticsApi.summary) {
    window.analyticsApi.summary({})
      .then(function (data) {
        if (revenueEl) revenueEl.textContent = '₹' + formatNum(data.revenue);
        if (expensesEl) expensesEl.textContent = '₹' + formatNum(data.expenses);
        if (profitEl) {
          var profit = data.netProfit != null ? Number(data.netProfit) : 0;
          profitEl.textContent = '₹' + formatNum(profit);
          profitEl.classList.remove('text-success-600', 'text-danger-600');
          profitEl.classList.add(profit >= 0 ? 'text-success-600' : 'text-danger-600');
        }
      })
      .catch(setKpiError);
  } else {
    setKpiError();
  }

  if (activeEl && window.rentalApi && window.rentalApi.list) {
    window.rentalApi.list({ status: 'ACTIVE', limit: 1, page: 1 })
      .then(function (data) {
        var total = (data && data.total != null) ? data.total : 0;
        activeEl.textContent = String(total);
      })
      .catch(function () {
        activeEl.textContent = fallback;
      });
  }

  function formatDate(d) {
    if (d == null) return '—';
    if (typeof d === 'string') return d.slice(0, 10);
    try { return new Date(d).toISOString().slice(0, 10); } catch (e) { return '—'; }
  }
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function renderRecentRentals(list) {
    if (!recentTbody) return;
    var card = recentTbody.closest('[data-base-path]');
    var base = (card && card.getAttribute('data-base-path')) || '';
    if (!list || list.length === 0) {
      recentTbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary-light py-24">No rentals yet.</td></tr>';
      return;
    }
    var html = list.map(function (r) {
      var custName = (r.customer && r.customer.name) ? esc(r.customer.name) : '—';
      var vehName = (r.vehicle && (r.vehicle.make || r.vehicle.model)) ? esc((r.vehicle.make || '') + ' ' + (r.vehicle.model || '')).trim() || '—' : '—';
      var contract = esc(r.contractNumber || '—');
      var startEnd = formatDate(r.startDate) + ' — ' + formatDate(r.endDate);
      var amount = '₹' + formatNum(r.totalAmount);
      var status = r.status === 'ACTIVE' ? 'bg-success-focus text-success-600' : r.status === 'COMPLETED' ? 'bg-info-focus text-info-600' : 'bg-neutral-200 text-neutral-600';
      var statusText = r.status === 'ACTIVE' ? 'Active' : r.status === 'COMPLETED' ? 'Completed' : 'Cancelled';
      var viewUrl = base + '/rental/view/' + (r.id || '');
      return '<tr><td><span class="fw-medium text-primary-light">' + contract + '</span></td><td><span class="text-secondary-light">' + custName + '</span></td><td><span class="text-secondary-light">' + vehName + '</span></td><td><span class="text-secondary-light">' + startEnd + '</span></td><td><span class="fw-medium">' + amount + '</span></td><td><span class="badge ' + status + '">' + statusText + '</span></td><td class="text-center"><a href="' + viewUrl + '" class="btn btn-sm btn-outline-primary radius-8">View</a></td></tr>';
    }).join('');
    recentTbody.innerHTML = html;
  }

  if (recentTbody && window.rentalApi && window.rentalApi.list) {
    window.rentalApi.list({ limit: 5, page: 1 })
      .then(function (data) {
        var list = (data && data.rentals) ? data.rentals : [];
        renderRecentRentals(list);
      })
      .catch(function () {
        if (recentTbody) recentTbody.innerHTML = '<tr><td colspan="7" class="text-center text-secondary-light py-24">Failed to load.</td></tr>';
      });
  } else if (recentTbody) {
    renderRecentRentals([]);
  }
})();
