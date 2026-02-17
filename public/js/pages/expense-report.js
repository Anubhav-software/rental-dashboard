/**
 * Expense report page: fetches real analytics summary (expenses) and expenses list (APPROVED in range).
 * Default range = start of year to today (set by server). Apply button reloads with new from/to.
 * Depends: analyticsApi.js, expenseApi.js.
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
    var fromEl = document.getElementById('expense-report-from');
    var toEl = document.getElementById('expense-report-to');
    return {
      from: fromEl ? fromEl.value : '',
      to: toEl ? toEl.value : '',
    };
  }

  function setTotal(expenses) {
    var periodEl = document.getElementById('expense-report-period');
    var totalEl = document.getElementById('expense-report-total');
    var range = getFromTo();
    if (periodEl && range.from && range.to) periodEl.textContent = 'Total expenses (' + range.from + ' to ' + range.to + ')';
    if (totalEl) totalEl.textContent = (expenses == null ? '—' : CURRENCY + formatNum(expenses));
  }

  function renderTable(expenses) {
    var tbody = document.getElementById('expense-report-tbody');
    if (!tbody) return;
    if (!expenses || expenses.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary-light py-24">No expenses in this period.</td></tr>';
      return;
    }
    var html = expenses.map(function (e, i) {
      var type = (e.category || e.expenseType || '—').toString();
      var desc = (e.description || '—').toString();
      return '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td><span class="text-secondary-light">' + formatDate(e.expenseDate) + '</span></td>' +
        '<td><span class="fw-medium">' + type + '</span></td>' +
        '<td><span class="text-secondary-light">' + desc + '</span></td>' +
        '<td><span class="fw-medium">' + CURRENCY + formatNum(e.amount) + '</span></td>' +
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
    var tbody = document.getElementById('expense-report-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center text-secondary-light py-24">Loading…</td></tr>';

    var summaryPromise = (window.analyticsApi && window.analyticsApi.summary)
      ? window.analyticsApi.summary({ date_from: range.from, date_to: range.to })
      : Promise.reject(new Error('No API'));
    var expensesPromise = (window.expenseApi && window.expenseApi.list)
      ? window.expenseApi.list({
          expense_date_from: range.from,
          expense_date_to: range.to,
          status: 'APPROVED',
          limit: 100,
          page: 1,
        })
      : Promise.reject(new Error('No API'));

    summaryPromise
      .then(function (data) {
        setTotal(data && data.expenses != null ? data.expenses : 0);
      })
      .catch(function () {
        setTotal(null);
      });

    expensesPromise
      .then(function (data) {
        var list = (data && data.expenses) ? data.expenses : [];
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
