/**
 * Rental API client — calls rental_backend /api/rentals.
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

  window.rentalApi = {
    list: function (params) {
      var q = new URLSearchParams(params || {}).toString();
      return request('GET', '/rentals' + (q ? '?' + q : ''), undefined, true);
    },
    getById: function (id, includeCharges) {
      var path = '/rentals/' + encodeURIComponent(id);
      if (includeCharges) path += '?include_charges=true';
      return request('GET', path, undefined, true);
    },
    create: function (body) {
      return request('POST', '/rentals', body, true);
    },
    update: function (id, body) {
      return request('PATCH', '/rentals/' + encodeURIComponent(id), body, true);
    },
    delete: function (id) {
      return request('DELETE', '/rentals/' + encodeURIComponent(id), undefined, true);
    },
    processReturn: function (id, body) {
      return request('PATCH', '/rentals/' + encodeURIComponent(id) + '/return', body, true);
    },
    listCharges: function (id) {
      return request('GET', '/rentals/' + encodeURIComponent(id) + '/charges', undefined, true);
    },
    addCharge: function (id, body) {
      return request('POST', '/rentals/' + encodeURIComponent(id) + '/charges', body, true);
    },
    sendReminderEmail: function (rentalIds) {
      var ids = Array.isArray(rentalIds) ? rentalIds : (rentalIds ? [rentalIds] : []);
      return request('POST', '/rentals/send-reminder-email', { rental_ids: ids }, true);
    },
  };
})();
