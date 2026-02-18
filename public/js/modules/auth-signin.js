/**
 * Auth: Sign in — direct password ya OTP flow. Backend USE_OTP_LOGIN se decide hota hai.
 * Requires: config.js, authApi.js, jQuery (from layout2).
 */
(function () {
  "use strict";

  // Backend se login mode (OTP vs direct). Default false = direct password.
  window.USE_OTP_LOGIN = false;
  if (window.authApi && window.authApi.getLoginConfig) {
    window.authApi.getLoginConfig().then(function (c) {
      window.USE_OTP_LOGIN = !!c.useOtpLogin;
    }).catch(function () {});
  }

  function initPasswordToggle() {
    $(".toggle-password").on("click", function () {
      $(this).toggleClass("ri-eye-off-line");
      var input = $($(this).attr("data-toggle"));
      input.attr("type", input.attr("type") === "password" ? "text" : "password");
    });
  }

  $("#signin-form").on("submit", function (e) {
    e.preventDefault();
    var email = $(this).find("[name=email]").val().trim();
    var password = $(this).find("[name=password]").val();
    var role = $(this).find("[name=role]").val();

    if (!email || !password || !role) {
      $("#signin-error").removeClass("d-none").text("Please fill all fields.");
      return;
    }

    var btn = $(this).find("button[type=submit]");
    $("#signin-error").addClass("d-none");
    $("#signin-success").addClass("d-none");
    btn.prop("disabled", true);

    var useOtp = window.USE_OTP_LOGIN;
    var apiPromise = useOtp
      ? window.authApi.loginPasswordWithOtp(email, password, role)
      : window.authApi.loginPassword(email, password, role);

    apiPromise
      .then(function (data) {
        if (useOtp) {
          $("#signin-success").removeClass("d-none").text(data.message || "OTP sent! Check your email...");
          sessionStorage.setItem("pendingLoginEmail", email);
          setTimeout(function () { window.location.href = "/authentication/verify-otp"; }, 1500);
        } else if (data.token) {
          localStorage.setItem("authToken", data.token);
          $("#signin-success").removeClass("d-none").text("Login successful! Redirecting...");
          var base = (data.user && data.user.role === "STAFF") ? "/staff" : "/owner";
          setTimeout(function () { window.location.href = base + "/dashboard/index5"; }, 500);
        } else {
          $("#signin-error").removeClass("d-none").text("Invalid response. Try again.");
          btn.prop("disabled", false);
        }
      })
      .catch(function (err) {
        console.error("❌ Login failed:", err);
        btn.prop("disabled", false);
        $("#signin-error").removeClass("d-none").text(err.data && err.data.error ? err.data.error : err.message);
      });
  });

  initPasswordToggle();
})();
