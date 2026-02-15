/**
 * Vehicle API client — calls rental_backend /api/vehicles.
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

  function requestFormData(method, path, formData, useAuth) {
    var url = base() + path;
    var opts = { method: method, body: formData };
    if (useAuth) {
      var t = getToken();
      if (t) {
        opts.headers = { 'Authorization': 'Bearer ' + t };
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

  function objectToFormData(obj, formData) {
    formData = formData || new FormData();
    Object.keys(obj || {}).forEach(function (key) {
      var val = obj[key];
      if (val === undefined || val === null) return;
      if (val instanceof Date) val = val.toISOString().slice(0, 10);
      if (typeof val === 'object' && !(val instanceof File)) formData.append(key, JSON.stringify(val));
      else formData.append(key, val);
    });
    return formData;
  }

  window.vehicleApi = {
    list: function (params) {
      var q = new URLSearchParams(params || {}).toString();
      return request('GET', '/vehicles' + (q ? '?' + q : ''), undefined, true);
    },
    getById: function (id) {
      return request('GET', '/vehicles/' + encodeURIComponent(id), undefined, true);
    },
    create: function (body, imageFile) {
      if (imageFile) {
        var fd = objectToFormData(body);
        fd.append('image', imageFile);
        return requestFormData('POST', '/vehicles', fd, true);
      }
      return request('POST', '/vehicles', body, true);
    },
    update: function (id, body, imageFile) {
      if (imageFile) {
        var fd = objectToFormData(body);
        fd.append('image', imageFile);
        return requestFormData('PATCH', '/vehicles/' + encodeURIComponent(id), fd, true);
      }
      return request('PATCH', '/vehicles/' + encodeURIComponent(id), body, true);
    },
    delete: function (id) {
      return request('DELETE', '/vehicles/' + encodeURIComponent(id), undefined, true);
    },
    downloadBulkTemplate: function () {
      var url = base() + '/vehicles/bulk-upload/template';
      var t = getToken();
      var opts = { method: 'GET' };
      if (t) opts.headers = { 'Authorization': 'Bearer ' + t };
      return fetch(url, opts).then(function (res) {
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
      }).then(function (blob) {
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'vehicle-bulk-upload-template.csv';
        a.click();
        URL.revokeObjectURL(a.href);
      });
    },
    bulkUpload: function (file) {
      var fd = new FormData();
      fd.append('file', file);
      return requestFormData('POST', '/vehicles/bulk-upload', fd, true);
    },
  };
})();
