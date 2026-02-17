/**
 * Profit report page: fetches real analytics (summary + profit by month), updates cards and chart.
 * Default range = start of year to today (set by server). Apply button reloads with new from/to.
 * Depends: analyticsApi.js, ApexCharts (global from layout).
 */
(function () {
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var chartInstance = null;

  function getCurrentYear() {
    return new Date().getFullYear();
  }

  function formatNum(n) {
    if (n == null || Number.isNaN(n)) return '0';
    return Number(n).toLocaleString('en-IN');
  }

  function getFromTo() {
    var fromEl = document.getElementById('profit-report-from');
    var toEl = document.getElementById('profit-report-to');
    return {
      from: fromEl ? fromEl.value : '',
      to: toEl ? toEl.value : '',
    };
  }

  function getBasePath() {
    var card = document.querySelector('[data-base-path]');
    return (card && card.getAttribute('data-base-path')) || '';
  }

  function updateSummaryCards(data) {
    var isError = data === null || data === undefined;
    var revenue = isError ? null : (data.revenue != null ? data.revenue : 0);
    var expenses = isError ? null : (data.expenses != null ? data.expenses : 0);
    var profit = isError ? null : (data.netProfit != null ? data.netProfit : (revenue - expenses));

    var revEl = document.getElementById('profit-report-revenue');
    var expEl = document.getElementById('profit-report-expenses');
    var profitEl = document.getElementById('profit-report-profit');
    var profitCard = document.getElementById('profit-report-profit-card');
    if (revEl) revEl.textContent = isError ? '—' : '₹' + formatNum(revenue);
    if (expEl) expEl.textContent = isError ? '—' : '₹' + formatNum(expenses);
    if (profitEl) {
      profitEl.textContent = isError ? '—' : '₹' + formatNum(profit);
      profitEl.className = 'fw-semibold mb-0 mt-4 ' + (isError ? 'text-secondary-light' : (profit >= 0 ? 'text-primary-600' : 'text-danger-600'));
    }
    if (profitCard) {
      profitCard.className = 'card border radius-12 ' + (isError ? 'bg-neutral-100 border-neutral-200' : (profit >= 0 ? 'bg-primary-50 border-primary-200' : 'bg-danger-50 border-danger-200'));
    }

    var periodEl = document.getElementById('profit-report-period');
    var range = getFromTo();
    if (periodEl && range.from && range.to) periodEl.textContent = 'Period: ' + range.from + ' to ' + range.to;

    var base = getBasePath();
    var revLink = document.getElementById('profit-report-revenue-link');
    var expLink = document.getElementById('profit-report-expense-link');
    if (revLink) revLink.href = base + '/reports/revenue?from=' + encodeURIComponent(range.from) + '&to=' + encodeURIComponent(range.to);
    if (expLink) expLink.href = base + '/reports/expense?from=' + encodeURIComponent(range.from) + '&to=' + encodeURIComponent(range.to);
  }

  function fillYearSelect(selectEl) {
    if (!selectEl) return;
    var current = getCurrentYear();
    var start = current - 3;
    selectEl.innerHTML = '';
    for (var y = current; y >= start; y--) {
      var opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === current) opt.selected = true;
      selectEl.appendChild(opt);
    }
  }

  function renderChart(data) {
    var el = document.getElementById('profit-report-chart');
    if (!el || typeof ApexCharts === 'undefined') return;

    var categories = MONTHS;
    var seriesData = (data && data.length) ? data.map(function (row) { return row.netProfit != null ? Number(row.netProfit) : 0; }) : Array(12).fill(0);

    var options = {
      series: [{ name: 'Net profit', data: seriesData }],
      chart: {
        type: 'bar',
        height: 280,
        fontFamily: 'Poppins, sans-serif',
        toolbar: { show: false },
      },
      colors: ['#487FFF'],
      plotOptions: {
        bar: {
          columnWidth: '60%',
          borderRadius: 4,
        },
      },
      dataLabels: { enabled: false },
      legend: { show: false },
      xaxis: {
        categories: categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#d4d7d9', fontSize: '10px', fontWeight: 500 } },
      },
      yaxis: {
        labels: {
          formatter: function (v) {
            if (v == null) return '0';
            var n = Number(v);
            return Math.abs(n) >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
          },
          style: { colors: '#d4d7d9' },
        },
      },
      tooltip: {
        theme: 'dark',
        y: { formatter: function (v) { return (v != null ? Number(v).toLocaleString('en-IN') : '0'); } },
      },
      grid: {
        borderColor: '#E3E6E9',
        strokeDashArray: 4,
        xaxis: { lines: { show: false } },
      },
    };

    if (chartInstance) {
      chartInstance.updateOptions({
        xaxis: { categories: categories },
        series: [{ name: 'Net profit', data: seriesData }],
      });
      return;
    }
    chartInstance = new ApexCharts(el, options);
    chartInstance.render();
  }

  function loadSummary() {
    var range = getFromTo();
    if (!range.from || !range.to) return;
    if (!window.analyticsApi || !window.analyticsApi.summary) {
      updateSummaryCards(null);
      return;
    }
    window.analyticsApi.summary({ date_from: range.from, date_to: range.to })
      .then(function (data) {
        updateSummaryCards(data);
      })
      .catch(function () {
        updateSummaryCards(null);
      });
  }

  function setChartError() {
    var el = document.getElementById('profit-report-chart');
    if (el) el.innerHTML = '<p class="text-secondary-light text-sm py-16 mb-0">Failed to load chart.</p>';
    chartInstance = null;
  }

  function loadProfitByMonth(year) {
    var el = document.getElementById('profit-report-chart');
    if (el && !chartInstance) el.innerHTML = '<p class="text-secondary-light text-sm py-16 mb-0">Loading…</p>';
    var y = year || getCurrentYear();
    if (!window.analyticsApi || !window.analyticsApi.profitByMonth) {
      setChartError();
      return;
    }
    window.analyticsApi.profitByMonth(y)
      .then(function (data) {
        renderChart(Array.isArray(data) ? data : []);
      })
      .catch(setChartError);
  }

  function init() {
    var yearSelect = document.getElementById('profit-report-year');
    fillYearSelect(yearSelect);
    loadSummary();
    loadProfitByMonth(yearSelect ? parseInt(yearSelect.value, 10) : getCurrentYear());
    if (yearSelect) {
      yearSelect.addEventListener('change', function () {
        loadProfitByMonth(parseInt(this.value, 10));
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
