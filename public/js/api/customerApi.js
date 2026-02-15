/**
 * Customer API client — calls rental_backend /api/customers.
 * Depends on: config.js (window.API_BASE_URL), auth token in localStorage (authToken).
 */
(function () {
  var base = function () {
    return (window.API_BASE_URL || '').replace(/\/$/, '') + '/api';
  };

  function getToken() {
    return localStorage.getItem('authToken') || '';
  }

  function request(method, path, body, useAuth) {
    var url = base() + path;
    var opts = {
      method: method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
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

  window.customerApi = {
    list: function (params) {
      var q = new URLSearchParams(params || {}).toString();
      return request('GET', '/customers' + (q ? '?' + q : ''), undefined, true);
    },
    getById: function (id) {
      return request('GET', '/customers/' + encodeURIComponent(id), undefined, true);
    },
    create: function (body) {
      return request('POST', '/customers', body, true);
    },
    update: function (id, body) {
      return request('PATCH', '/customers/' + encodeURIComponent(id), body, true);
    },
    delete: function (id) {
      return request('DELETE', '/customers/' + encodeURIComponent(id), undefined, true);
    },
  };
})();
