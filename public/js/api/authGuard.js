/**
 * Auth guard: require token on dashboard/settings pages. Call after authApi is loaded.
 * If no token, redirect to sign in.
 */
(function () {
  function run() {
    if (typeof window.authApi === 'undefined' || !window.authApi.getToken) return;
    if (!window.authApi.getToken()) {
      window.location.href = '/authentication/signin';
      return;
    }
    var links = document.querySelectorAll('a[href="/authentication/logout"]');
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener('click', function (e) {
        e.preventDefault();
        if (window.authApi.clearAuth) window.authApi.clearAuth();
        window.location.href = '/authentication/signin';
      });
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
