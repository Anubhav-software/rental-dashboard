/**
 * Invoice API client — calls rental_backend /api/invoices.
 * Depends on: config.js (window.API_BASE_URL), auth token in localStorage (authToken).
 */
(function () {
  function base() {
    return (window.API_BASE_URL || '').replace(/\/$/, '') + '/api';
  }

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

  window.invoiceApi = {
    list: function (params) {
      var q = new URLSearchParams(params || {}).toString();
      return request('GET', '/invoices' + (q ? '?' + q : ''), undefined, true);
    },
    getById: function (id) {
      return request('GET', '/invoices/' + encodeURIComponent(id), undefined, true);
    },
    createFromRental: function (body) {
      return request('POST', '/invoices', body, true);
    },
    createManual: function (body) {
      return request('POST', '/invoices', body, true);
    },
    update: function (id, body) {
      return request('PATCH', '/invoices/' + encodeURIComponent(id), body, true);
    },
    sendPdf: function (id) {
      return request('POST', '/invoices/' + encodeURIComponent(id) + '/send-pdf', undefined, true);
    },
  };
})();
