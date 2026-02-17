/**
 * Dashboard profit-by-month chart.
 * Fetches GET /api/analytics/profit-by-month?year= and renders ApexCharts bar chart.
 * Depends: analyticsApi.js, ApexCharts (global).
 */
(function () {
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var chartInstance = null;

  function getCurrentYear() {
    return new Date().getFullYear();
  }

  function fillYearSelect(selectEl) {
    if (!selectEl) return;
    var current = getCurrentYear();
    var start = current - 3;
    var end = current;
    selectEl.innerHTML = '';
    for (var y = end; y >= start; y--) {
      var opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      if (y === current) opt.selected = true;
      selectEl.appendChild(opt);
    }
  }

  function renderChart(data) {
    var el = document.getElementById('profitByMonthChart');
    if (!el || typeof ApexCharts === 'undefined') return;

    var categories = MONTHS;
    var seriesData = (data && data.length) ? data.map(function (row) { return row.netProfit != null ? Number(row.netProfit) : 0; }) : Array(12).fill(0);

    var options = {
      series: [{ name: 'Net profit', data: seriesData }],
      chart: {
        type: 'bar',
        height: 263,
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
        labels: {
          style: { colors: '#d4d7d9', fontSize: '10px', fontWeight: 500 },
        },
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
        y: {
          formatter: function (v) { return (v != null ? Number(v).toLocaleString('en-IN') : '0'); },
        },
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

  function setChartError() {
    var el = document.getElementById('profitByMonthChart');
    if (el) {
      el.innerHTML = '<p class="text-secondary-light text-sm py-16 mb-0">Failed to load chart.</p>';
    }
    chartInstance = null;
  }

  function loadProfitByMonth(year) {
    var el = document.getElementById('profitByMonthChart');
    if (el && !chartInstance) el.innerHTML = '<p class="text-secondary-light text-sm py-16 mb-0">Loading…</p>';
    var y = year || getCurrentYear();
    if (!window.analyticsApi || !window.analyticsApi.profitByMonth) {
      setChartError();
      return;
    }
    window.analyticsApi.profitByMonth(y)
      .then(function (data) {
        if (Array.isArray(data)) {
          renderChart(data);
        } else {
          renderChart([]);
        }
      })
      .catch(setChartError);
  }

  function init() {
    var yearSelect = document.getElementById('dashboard-profit-year');
    fillYearSelect(yearSelect);
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
