/**
 * Searchable dropdowns: fetch all pages for APIs that limit to 100, and add a search input to filter options.
 * Use attachSearchToSelect(selectElement, placeholder) after populating a <select>.
 * Use fetchAllVehicles / fetchAllCustomers when you need the full list for dropdowns.
 */
(function () {
  var LIMIT = 100;

  function getTotal(res) {
    if (res && res.pagination && res.pagination.total != null) return res.pagination.total;
    if (res && res.total != null) return res.total;
    return null;
  }

  function fetchAllVehicles(params) {
    params = params || {};
    if (!window.vehicleApi || !window.vehicleApi.list) return Promise.resolve([]);
    var query = { page: 1, limit: LIMIT };
    if (params.status) query.status = params.status;
    return window.vehicleApi.list(query)
      .then(function (res) {
        var list = (res && res.vehicles) ? res.vehicles : [];
        var total = getTotal(res);
        if (total == null) total = list.length;
        if (total <= LIMIT) return list;
        var pages = Math.ceil(total / LIMIT);
        var rest = [];
        for (var p = 2; p <= pages; p++) {
          var q = { page: p, limit: LIMIT };
          if (query.status) q.status = query.status;
          rest.push(window.vehicleApi.list(q));
        }
        return Promise.all(rest).then(function (pagesData) {
          pagesData.forEach(function (r) {
            list = list.concat((r && r.vehicles) ? r.vehicles : []);
          });
          return list;
        });
      });
  }

  function fetchAllCustomers(params) {
    params = params || {};
    if (!window.customerApi || !window.customerApi.list) return Promise.resolve([]);
    var query = { page: 1, limit: LIMIT };
    if (params.search && String(params.search).trim()) query.search = String(params.search).trim();
    return window.customerApi.list(query)
      .then(function (res) {
        var list = (res && res.customers) ? res.customers : [];
        var total = getTotal(res);
        if (total == null) total = list.length;
        if (total <= LIMIT) return list;
        var pages = Math.ceil(total / LIMIT);
        var rest = [];
        for (var p = 2; p <= pages; p++) {
          var q = { page: p, limit: LIMIT };
          if (query.search) q.search = query.search;
          rest.push(window.customerApi.list(q));
        }
        return Promise.all(rest).then(function (pagesData) {
          pagesData.forEach(function (r) {
            list = list.concat((r && r.customers) ? r.customers : []);
          });
          return list;
        });
      });
  }

  /**
   * Insert a search input above the select and filter options by text as the user types.
   * @param {HTMLSelectElement} selectEl - The <select> element (already populated with options).
   * @param {string} placeholder - Placeholder for the search input, e.g. "Search vehicle…".
   */
  function attachSearchToSelect(selectEl, placeholder) {
    if (!selectEl || !selectEl.options) return;
    placeholder = placeholder || 'Search…';
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control form-control-sm mb-2';
    input.placeholder = placeholder;
    input.setAttribute('autocomplete', 'off');
    input.style.maxWidth = '100%';
    selectEl.parentNode.insertBefore(input, selectEl);

    function filterOptions() {
      var q = (input.value || '').toLowerCase().trim();
      var opts = selectEl.options;
      for (var i = 0; i < opts.length; i++) {
        var opt = opts[i];
        var isPlaceholder = (opt.value === '' || opt.value === ' ');
        if (isPlaceholder) {
          opt.hidden = false;
          continue;
        }
        opt.hidden = q ? opt.textContent.toLowerCase().indexOf(q) === -1 : false;
      }
    }

    input.addEventListener('input', filterOptions);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') e.preventDefault();
    });
  }

  window.fetchAllVehicles = fetchAllVehicles;
  window.fetchAllCustomers = fetchAllCustomers;
  window.attachSearchToSelect = attachSearchToSelect;
})();
