/**
 * Auth API client — calls rental_backend /api/auth, /api/users.
 * Company APIs are in companyApi.js.
 * Depends on: config.js (window.API_BASE_URL)
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

  function requestFormData(method, path, formData, useAuth) {
    var url = base() + path;
    var opts = {
      method: method,
      body: formData,
    };
    // Don't set Content-Type header for FormData - browser sets it automatically with boundary
    if (useAuth) {
      var t = getToken();
      if (t) {
        opts.headers = opts.headers || {};
        opts.headers['Authorization'] = 'Bearer ' + t;
      }
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

  window.authApi = {
    signup: function (body) {
      return request('POST', '/auth/signup', body, false);
    },
    login: function (email) {
      return request('POST', '/auth/login', { email: email }, false);
    },
    loginPassword: function (email, password, role) {
      return request('POST', '/auth/login-password', { email: email, password: password, role: role }, false);
    },
    loginPasswordWithOtp: function (email, password, role) {
      return request('POST', '/auth/login-password-otp', { email: email, password: password, role: role }, false);
    },
    verifyOtp: function (email, otp) {
      return request('POST', '/auth/verify-otp', { email: email, otp: otp }, false);
    },
    getMe: function () {
      return request('GET', '/auth/me', undefined, true);
    },
    createUser: function (body) {
      return request('POST', '/users', body, true);
    },
    updateUser: function (userId, body) {
      return request('PATCH', '/users/' + userId, body, true);
    },
    deleteUser: function (userId) {
      return request('DELETE', '/users/' + userId, undefined, true);
    },
    getUsers: function () {
      return request('GET', '/users', undefined, false);
    },
    getToken: getToken,
    setAuth: function (token, user) {
      if (token) localStorage.setItem('authToken', token);
      if (user) localStorage.setItem('authUser', JSON.stringify(user));
    },
    clearAuth: function () {
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
    },
    getAuthUser: function () {
      try {
        var u = localStorage.getItem('authUser');
        return u ? JSON.parse(u) : null;
      } catch (e) {
        return null;
      }
    },
  };
})();
