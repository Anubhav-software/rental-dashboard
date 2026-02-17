/**
 * API base URL for rental_backend. Set via meta tag (EJS) or default for dev.
 */
(function () {
  var meta = document.querySelector('meta[name="api-base-url"]');
  var fromMeta = meta && meta.getAttribute('content');
  window.API_BASE_URL = (fromMeta && fromMeta.trim()) || window.API_BASE_URL || 'http://localhost:7080';
})();
