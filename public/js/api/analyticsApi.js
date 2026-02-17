/**
 * Analytics API client — calls rental_backend /api/analytics.
 * Depends: config.js (window.API_BASE_URL), auth token in localStorage (authToken).
 */
(function () {
  function base() {
    return (window.API_BASE_URL || '').replace(/\/$/, '') + '/api';
  }

  function getToken() {
    return localStorage.getItem('authToken') || '';
  }

  function request(method, path, useAuth) {
    var url = base() + path;
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    if (useAuth) {
      var t = getToken();
      if (t) opts.headers['Authorization'] = 'Bearer ' + t;
    }
    return fetch(url, opts).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) {
          var err = new Error(data.error || data.message || 'Request failed');
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    });
  }

  function buildQuery(params) {
    if (!params || typeof params !== 'object') return '';
    var q = [];
    if (params.date_from != null) q.push('date_from=' + encodeURIComponent(params.date_from));
    if (params.date_to != null) q.push('date_to=' + encodeURIComponent(params.date_to));
    if (params.dateFrom != null) q.push('date_from=' + encodeURIComponent(params.dateFrom));
    if (params.dateTo != null) q.push('date_to=' + encodeURIComponent(params.dateTo));
    if (params.year != null) q.push('year=' + encodeURIComponent(params.year));
    if (params.limit != null) q.push('limit=' + encodeURIComponent(params.limit));
    return q.length ? '?' + q.join('&') : '';
  }

  window.analyticsApi = {
    summary: function (params) {
      return request('GET', '/analytics/summary' + buildQuery(params || {}), true);
    },
    revenueByMonth: function (year) {
      return request('GET', '/analytics/revenue-by-month?year=' + encodeURIComponent(year), true);
    },
    expensesByMonth: function (year) {
      return request('GET', '/analytics/expenses-by-month?year=' + encodeURIComponent(year), true);
    },
    profitByMonth: function (year) {
      return request('GET', '/analytics/profit-by-month?year=' + encodeURIComponent(year), true);
    },
    topCustomers: function (params) {
      return request('GET', '/analytics/top-customers' + buildQuery(params || {}), true);
    },
    dashboard: function (params) {
      return request('GET', '/analytics/dashboard' + buildQuery(params || {}), true);
    },
  };
})();
