/**
 * Company API client — calls rental_backend /api/companies.
 * Depends on: config.js (window.API_BASE_URL), auth token (authApi or localStorage).
 */
(function () {
  var base = function () {
    return (window.API_BASE_URL || '').replace(/\/$/, '') + '/api';
  };

  function getToken() {
    if (window.authApi && window.authApi.getToken) return window.authApi.getToken();
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

  function requestFormData(method, path, formData, useAuth) {
    var url = base() + path;
    var opts = { method: method, body: formData };
    if (useAuth) {
      var t = getToken();
      if (t) opts.headers = { 'Authorization': 'Bearer ' + t };
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

  window.companyApi = {
    getCompany: function (companyId) {
      return request('GET', '/companies/' + encodeURIComponent(companyId), undefined, false);
    },
    createCompany: function (formData) {
      return requestFormData('POST', '/companies', formData, true);
    },
    updateCompany: function (companyId, formData) {
      return requestFormData('PATCH', '/companies/' + encodeURIComponent(companyId), formData, true);
    },
  };
})();
