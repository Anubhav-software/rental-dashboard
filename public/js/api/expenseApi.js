/**
 * Expense API client — calls rental_backend /api/expenses.
 * Depends on: config.js (window.API_BASE_URL), auth token in localStorage (authToken).
 */
(function () {
  function base() {
    return (window.API_BASE_URL || '').replace(/\/$/, '') + '/api';
  }

  function getToken() {
    return localStorage.getItem('authToken') || '';
  }

  function request(method, path, body, useAuth, isFormData) {
    var url = base() + path;
    var opts = { method: method, headers: {} };
    if (isFormData && body instanceof FormData) {
      opts.body = body;
      // Do not set Content-Type so browser sets multipart boundary
    } else {
      opts.headers['Content-Type'] = 'application/json';
      if (body !== undefined) opts.body = JSON.stringify(body);
    }
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

  window.expenseApi = {
    list: function (params) {
      var q = new URLSearchParams(params || {}).toString();
      return request('GET', '/expenses' + (q ? '?' + q : ''), undefined, true);
    },
    getById: function (id) {
      return request('GET', '/expenses/' + encodeURIComponent(id), undefined, true);
    },
    create: function (bodyOrFormData, options) {
      var isFormData = options && options.formData === true && bodyOrFormData instanceof FormData;
      return request('POST', '/expenses', bodyOrFormData, true, isFormData);
    },
    update: function (id, body) {
      return request('PATCH', '/expenses/' + encodeURIComponent(id), body || {}, true);
    },
    approve: function (id) {
      return request('PATCH', '/expenses/' + encodeURIComponent(id) + '/approve', undefined, true);
    },
    reject: function (id, body) {
      return request('PATCH', '/expenses/' + encodeURIComponent(id) + '/reject', body || {}, true);
    },
  };
})();
