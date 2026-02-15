/**
 * Auth: Sign in page — password-based login with role selection.
 * Requires: config.js, authApi.js, jQuery (from layout2).
 */
(function () {
  "use strict";

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
    
    console.log("📤 Attempting login with OTP verification:", { email: email, role: role });
    
    window.authApi
      .loginPasswordWithOtp(email, password, role)
      .then(function (data) {
        console.log("✅ Password verified, OTP sent!");
        console.log("📦 Response:", data);
        
        $("#signin-success").removeClass("d-none").text(data.message || "OTP sent! Check your email and redirecting...");
        
        // Store email for OTP verification
        sessionStorage.setItem("pendingLoginEmail", email);
        
        setTimeout(function () {
          window.location.href = "/authentication/verify-otp";
        }, 1500);
      })
      .catch(function (err) {
        console.error("❌ Login failed:", err);
        btn.prop("disabled", false);
        $("#signin-error")
          .removeClass("d-none")
          .text(err.data && err.data.error ? err.data.error : err.message);
      });
  });

  initPasswordToggle();
})();
