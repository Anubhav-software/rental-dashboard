/**
 * Calendar availability: fetch rentals and expenses for the displayed month,
 * then apply light gradient backgrounds to date cells (active rental = green, completed = blue, expense = red).
 */
(function () {
  var wrap = document.getElementById('cal-availability-wrap');
  var loadingEl = document.getElementById('cal-availability-loading');
  if (!wrap) return;

  var year = parseInt(wrap.getAttribute('data-year'), 10);
  var month = parseInt(wrap.getAttribute('data-month'), 10);
  var basePath = (wrap.getAttribute('data-base-path') || '').replace(/\/$/, '') || (window.location.pathname.indexOf('/staff') !== -1 ? '/staff' : '/owner');
  if (isNaN(year) || isNaN(month)) return;

  var MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  /** Format YYYY-MM-DD to "7 Feb 2026" */
  function formatDateLabel(dateStr) {
    if (!dateStr || dateStr.length < 10) return dateStr;
    var y = dateStr.slice(0, 4);
    var m = parseInt(dateStr.slice(5, 7), 10) - 1;
    var d = parseInt(dateStr.slice(8, 10), 10);
    return d + ' ' + MONTH_NAMES[m] + ' ' + y;
  }

  var firstDay = year + '-' + pad(month) + '-01';
  var lastDate = new Date(year, month, 0);
  var lastDay = year + '-' + pad(month) + '-' + pad(lastDate.getDate());

  function dateStrInRange(dateStr, start, end) {
    if (!dateStr || !start || !end) return false;
    var s = typeof start === 'string' ? start.slice(0, 10) : (start.toISOString && start.toISOString().slice(0, 10));
    var e = typeof end === 'string' ? end.slice(0, 10) : (end.toISOString && end.toISOString().slice(0, 10));
    return dateStr >= s && dateStr <= e;
  }

  /** Priority: active rental (green) > expense (red) > completed rental (blue). Set classes and tooltips. */
  function setCellClasses(activeDays, completedDays, expenseDays, tooltipsByDate) {
    var cells = wrap.querySelectorAll('td.cal-day-cell[data-date]');
    cells.forEach(function (td) {
      var dateStr = td.getAttribute('data-date');
      if (!dateStr) return;
      var link = td.querySelector('a.cal-day-link');
      td.classList.remove('cal-day-active', 'cal-day-completed', 'cal-day-expense');
      if (activeDays.has(dateStr)) {
        td.classList.add('cal-day-active');
        if (link) link.href = basePath + '/rental?on_date=' + encodeURIComponent(dateStr);
      } else if (expenseDays.has(dateStr)) {
        td.classList.add('cal-day-expense');
        if (link) link.href = basePath + '/expense/list?expense_date_from=' + encodeURIComponent(dateStr) + '&expense_date_to=' + encodeURIComponent(dateStr);
      } else if (completedDays.has(dateStr)) {
        td.classList.add('cal-day-completed');
        if (link) link.href = basePath + '/rental?on_date=' + encodeURIComponent(dateStr);
      } else {
        if (link) link.href = basePath + '/rental?on_date=' + encodeURIComponent(dateStr);
      }
      var tips = tooltipsByDate && tooltipsByDate[dateStr];
      if (tips && tips.length) {
        td.setAttribute('title', tips.join('\n'));
      } else {
        td.removeAttribute('title');
      }
    });
  }

  function goToRentalsForDate(dateStr) {
    window.location.href = basePath + '/rental?on_date=' + encodeURIComponent(dateStr);
  }

  function goToExpensesForDate(dateStr) {
    window.location.href = basePath + '/expense/list?expense_date_from=' + encodeURIComponent(dateStr) + '&expense_date_to=' + encodeURIComponent(dateStr);
  }

  function goToAvailableVehicles(dateStr) {
    // Vehicle list supports status filter; date param is passed for context (ignored if not supported).
    window.location.href = basePath + '/vehicle?status=AVAILABLE&on_date=' + encodeURIComponent(dateStr);
  }

  function promptDateAction(dateStr, isExpenseDay) {
    var title = 'Choose action';
    var text = 'For ' + formatDateLabel(dateStr);

    if (typeof Swal !== 'undefined' && Swal && typeof Swal.fire === 'function') {
      return Swal.fire({
        title: title,
        text: text,
        icon: 'question',
        showDenyButton: true,
        showCancelButton: true,
        showCloseButton: true,
        confirmButtonText: 'View rentals',
        denyButtonText: 'Available vehicles',
        cancelButtonText: isExpenseDay ? 'View expenses' : 'Cancel',
        confirmButtonColor: '#0d6efd',
        denyButtonColor: '#6c757d',
        cancelButtonColor: isExpenseDay ? '#dc3545' : '#6c757d',
      }).then(function (result) {
        if (result.isConfirmed) return goToRentalsForDate(dateStr);
        if (result.isDenied) return goToAvailableVehicles(dateStr);
        if (result.dismiss && isExpenseDay) return goToExpensesForDate(dateStr);
      });
    }

    // Fallback: simple confirm
    var ok = window.confirm('View rentals for ' + formatDateLabel(dateStr) + '?\nOK = Rentals, Cancel = Available vehicles');
    if (ok) goToRentalsForDate(dateStr);
    else goToAvailableVehicles(dateStr);
  }

  function attachDateClickPrompts() {
    var links = wrap.querySelectorAll('a.cal-day-link');
    links.forEach(function (a) {
      if (a.getAttribute('data-cal-prompt') === '1') return;
      a.setAttribute('data-cal-prompt', '1');
      a.addEventListener('click', function (e) {
        var td = a.closest('td.cal-day-cell[data-date]');
        if (!td) return;
        var dateStr = td.getAttribute('data-date');
        if (!dateStr) return;
        e.preventDefault();
        var isExpenseDay = td.classList.contains('cal-day-expense');
        promptDateAction(dateStr, isExpenseDay);
      });
    });
  }

  function escapeHtml(s) {
    if (s == null) return '';
    var div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function renderDescriptions(rentalItems, expenseItems) {
    var rentalsEl = document.getElementById('cal-desc-rentals');
    var expensesEl = document.getElementById('cal-desc-expenses');
    var rentalsBlock = document.getElementById('cal-desc-rentals-block');
    var expensesBlock = document.getElementById('cal-desc-expenses-block');
    var section = document.getElementById('cal-descriptions');
    if (!section) return;
    if (rentalsEl) {
      rentalsEl.innerHTML = rentalItems.length ? rentalItems.map(function (r) {
        var badgeClass = (r.status === 'ACTIVE') ? 'badge-rental-active' : 'badge-rental-completed';
        var vehicleLine = r.registrationNumber
          ? escapeHtml(r.vehicleLabel) + ' (' + escapeHtml(r.registrationNumber) + ')'
          : escapeHtml(r.vehicleLabel);
        return '<li class="cal-desc-rental">' +
          '<iconify-icon icon="solar:car-outline" class="cal-desc-item-icon"></iconify-icon>' +
          '<span class="cal-desc-item-text">' + escapeHtml(r.fromLabel) + ' → ' + escapeHtml(r.toLabel) +
          ' <span class="text-secondary-light text-sm d-block mt-4">' + vehicleLine + '</span>' +
          ' <span class="' + badgeClass + '">' + escapeHtml(r.status || '—') + '</span></span></li>';
      }).join('') : '<li class="cal-desc-empty cal-desc-rental"><iconify-icon icon="solar:calendar-minimalistic-outline" class="cal-desc-item-icon"></iconify-icon><span class="cal-desc-item-text">No rentals this month</span></li>';
    }
    if (expensesEl) {
      expensesEl.innerHTML = expenseItems.length ? expenseItems.map(function (e) {
        return '<li class="cal-desc-expense">' +
          '<iconify-icon icon="solar:wallet-money-outline" class="cal-desc-item-icon"></iconify-icon>' +
          '<span class="cal-desc-item-text">Expense on ' + escapeHtml(e.dateLabel) + '</span></li>';
      }).join('') : '<li class="cal-desc-empty cal-desc-expense"><iconify-icon icon="solar:wallet-outline" class="cal-desc-item-icon"></iconify-icon><span class="cal-desc-item-text">No expenses this month</span></li>';
    }
    section.classList.toggle('d-none', !rentalItems.length && !expenseItems.length);
  }

  /** Fetch all pages when total > limit so calendar stays correct as data grows. */
  function fetchAllRentals(baseParams) {
    var limit = 100;
    if (!window.rentalApi || !window.rentalApi.list) return Promise.resolve([]);
    return window.rentalApi.list({ page: 1, limit: limit, start_date_to: baseParams.start_date_to })
      .then(function (res) {
        var list = (res && res.rentals) ? res.rentals : [];
        var total = (res && res.total != null) ? res.total : list.length;
        if (total <= limit) return list;
        var pages = Math.ceil(total / limit);
        var rest = [];
        for (var p = 2; p <= pages; p++) rest.push(window.rentalApi.list({ page: p, limit: limit, start_date_to: baseParams.start_date_to }));
        return Promise.all(rest).then(function (pagesData) {
          pagesData.forEach(function (r) {
            var arr = (r && r.rentals) ? r.rentals : [];
            list = list.concat(arr);
          });
          return list;
        });
      })
      .catch(function () { return []; });
  }

  function fetchAllExpenses(baseParams) {
    var limit = 100;
    if (!window.expenseApi || !window.expenseApi.list) return Promise.resolve([]);
    return window.expenseApi.list({
      page: 1,
      limit: limit,
      expense_date_from: baseParams.expense_date_from,
      expense_date_to: baseParams.expense_date_to
    }).then(function (res) {
      var list = (res && res.expenses) ? res.expenses : [];
      var total = (res && res.total != null) ? res.total : list.length;
      if (total <= limit) return list;
      var pages = Math.ceil(total / limit);
      var rest = [];
      for (var p = 2; p <= pages; p++) {
        rest.push(window.expenseApi.list({
          page: p,
          limit: limit,
          expense_date_from: baseParams.expense_date_from,
          expense_date_to: baseParams.expense_date_to
        }));
      }
      return Promise.all(rest).then(function (pagesData) {
        pagesData.forEach(function (r) {
          var arr = (r && r.expenses) ? r.expenses : [];
          list = list.concat(arr);
        });
        return list;
      });
    }).catch(function () { return []; });
  }

  function run() {
    if (loadingEl) loadingEl.classList.remove('d-none');

    var rentalPromise = fetchAllRentals({ start_date_to: lastDay });
    var expensePromise = fetchAllExpenses({ expense_date_from: firstDay, expense_date_to: lastDay });

    Promise.all([rentalPromise, expensePromise])
      .then(function (results) {
        var rentals = Array.isArray(results[0]) ? results[0] : [];
        var expenses = Array.isArray(results[1]) ? results[1] : [];

        // Rentals overlapping the month: startDate <= lastDay and endDate >= firstDay
        var overlapping = rentals.filter(function (r) {
          var end = (r.endDate && (typeof r.endDate === 'string' ? r.endDate.slice(0, 10) : (r.endDate.toISOString && r.endDate.toISOString().slice(0, 10))));
          return end && end >= firstDay;
        });

        var activeDays = new Set();
        var completedDays = new Set();
        var d = 1;
        while (d <= lastDate.getDate()) {
          var dateStr = year + '-' + pad(month) + '-' + pad(d);
          overlapping.forEach(function (r) {
            if (!dateStrInRange(dateStr, r.startDate, r.endDate)) return;
            if (r.status === 'ACTIVE') activeDays.add(dateStr);
            else if (r.status === 'COMPLETED') completedDays.add(dateStr);
          });
          d += 1;
        }

        var expenseDays = new Set();
        expenses.forEach(function (ex) {
          var ed = ex.expenseDate && (typeof ex.expenseDate === 'string' ? ex.expenseDate.slice(0, 10) : (ex.expenseDate.toISOString && ex.expenseDate.toISOString().slice(0, 10)));
          if (ed && ed >= firstDay && ed <= lastDay) expenseDays.add(ed);
        });

        // Tooltips per date: "Rental from X to Y", "Expense on Z"
        var tooltipsByDate = {};
        function addTooltip(dateStr, text) {
          if (!tooltipsByDate[dateStr]) tooltipsByDate[dateStr] = [];
          tooltipsByDate[dateStr].push(text);
        }
        overlapping.forEach(function (r) {
          var startStr = (r.startDate && (typeof r.startDate === 'string' ? r.startDate.slice(0, 10) : (r.startDate.toISOString && r.startDate.toISOString().slice(0, 10)))) || '';
          var endStr = (r.endDate && (typeof r.endDate === 'string' ? r.endDate.slice(0, 10) : (r.endDate.toISOString && r.endDate.toISOString().slice(0, 10)))) || '';
          var label = 'Rental from ' + formatDateLabel(startStr) + ' to ' + formatDateLabel(endStr) + (r.status ? ' (' + r.status + ')' : '');
          var d = 1;
          while (d <= lastDate.getDate()) {
            var dateStr = year + '-' + pad(month) + '-' + pad(d);
            if (dateStrInRange(dateStr, r.startDate, r.endDate)) addTooltip(dateStr, label);
            d += 1;
          }
        });
        expenses.forEach(function (ex) {
          var ed = ex.expenseDate && (typeof ex.expenseDate === 'string' ? ex.expenseDate.slice(0, 10) : (ex.expenseDate.toISOString && ex.expenseDate.toISOString().slice(0, 10)));
          if (ed && ed >= firstDay && ed <= lastDay) addTooltip(ed, 'Expense on ' + formatDateLabel(ed));
        });

        setCellClasses(activeDays, completedDays, expenseDays, tooltipsByDate);
        attachDateClickPrompts();

        // Descriptions below calendar: add vehicle (make model year) and registration number
        var rentalItems = overlapping.map(function (r) {
          var startStr = (r.startDate && (typeof r.startDate === 'string' ? r.startDate.slice(0, 10) : (r.startDate.toISOString && r.startDate.toISOString().slice(0, 10)))) || '';
          var endStr = (r.endDate && (typeof r.endDate === 'string' ? r.endDate.slice(0, 10) : (r.endDate.toISOString && r.endDate.toISOString().slice(0, 10)))) || '';
          var v = r.vehicle;
          var make = (v && v.make) ? String(v.make).trim() : '';
          var model = (v && v.model) ? String(v.model).trim() : '';
          var year = (v && v.year != null) ? String(v.year) : '';
          var vehicleLabel = [make, model, year].filter(Boolean).join(' ') || '—';
          var regNo = (v && v.registrationNumber) ? String(v.registrationNumber).trim() : '';
          return { fromLabel: formatDateLabel(startStr), toLabel: formatDateLabel(endStr), status: r.status || '—', vehicleLabel: vehicleLabel, registrationNumber: regNo };
        });
        var expenseItems = expenses
          .filter(function (ex) {
            var ed = ex.expenseDate && (typeof ex.expenseDate === 'string' ? ex.expenseDate.slice(0, 10) : (ex.expenseDate.toISOString && ex.expenseDate.toISOString().slice(0, 10)));
            return ed && ed >= firstDay && ed <= lastDay;
          })
          .map(function (ex) {
            var ed = ex.expenseDate && (typeof ex.expenseDate === 'string' ? ex.expenseDate.slice(0, 10) : (ex.expenseDate.toISOString && ex.expenseDate.toISOString().slice(0, 10)));
            return { dateLabel: formatDateLabel(ed) };
          });
        renderDescriptions(rentalItems, expenseItems);

        if (loadingEl) loadingEl.classList.add('d-none');
      })
      .catch(function () {
        if (loadingEl) loadingEl.classList.add('d-none');
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
