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

    // ---------- OPTION A: Direct login (active). To use OTP flow: comment this block, uncomment OPTION B below ----------
    window.authApi
      .loginPassword(email, password, role)
      .then(function (data) {
        if (data.token) {
          localStorage.setItem("authToken", data.token);
          $("#signin-success").removeClass("d-none").text("Login successful! Redirecting...");
          setTimeout(function () { window.location.href = "/"; }, 500);
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

    // ---------- OPTION B: OTP flow (commented). To use: comment OPTION A above, uncomment this block ----------
    // console.log("📤 Attempting login with OTP verification:", { email: email, role: role });
    // window.authApi
    //   .loginPasswordWithOtp(email, password, role)
    //   .then(function (data) {
    //     console.log("✅ Password verified, OTP sent!");
    //     $("#signin-success").removeClass("d-none").text(data.message || "OTP sent! Check your email and redirecting...");
    //     sessionStorage.setItem("pendingLoginEmail", email);
    //     setTimeout(function () { window.location.href = "/authentication/verify-otp"; }, 1500);
    //   })
    //   .catch(function (err) {
    //     console.error("❌ Login failed:", err);
    //     btn.prop("disabled", false);
    //     $("#signin-error").removeClass("d-none").text(err.data && err.data.error ? err.data.error : err.message);
    //   });
  });

  initPasswordToggle();
})();
