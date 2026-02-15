/**
 * Auth: Verify OTP page — email from sessionStorage, submit OTP, save token, redirect.
 * Requires: config.js, authApi.js, jQuery (from layout2).
 */
(function () {
  "use strict";

  var email = sessionStorage.getItem("pendingLoginEmail") || "";

  function maskEmail(e) {
    if (!e) return "";
    return e.replace(/(.{2}).+(@.+)/, "$1****$2");
  }

  if (!email) {
    window.location.href = "/authentication/signin";
    return;
  }

  var displayEl = document.getElementById("verify-email-display");
  if (displayEl) displayEl.textContent = maskEmail(email);

  $("#verify-otp-form").on("submit", function (e) {
    e.preventDefault();
    var otp = $(this).find("[name=otp]").val().trim();
    if (!otp || otp.length !== 6) {
      $("#verify-error").removeClass("d-none").text("Please enter the 6-digit OTP.");
      return;
    }
    var btn = $(this).find("button[type=submit]");
    $("#verify-error").addClass("d-none");
    btn.prop("disabled", true);
    window.authApi
      .verifyOtp(email, otp)
      .then(function (data) {
        console.log("✅ OTP verified successfully!");
        console.log("📦 Response data:", data);
        console.log("👤 User info:", data.user);
        console.log("🔑 Token received:", data.token ? "Yes" : "No");
        
        window.authApi.setAuth(data.token, data.user);
        sessionStorage.removeItem("pendingLoginEmail");
        var u = data.user || {};
        
        console.log("🔄 Redirecting based on role:", u.role, "| Company ID:", u.company_id);
        
        if (u.role === "OWNER" && (u.company_id === null || u.company_id === undefined)) {
          console.log("➡️ Redirecting OWNER to company setup page");
          window.location.href = "/owner/settings/company";
        } else {
          console.log("➡️ Redirecting to dashboard");
          window.location.href = (u.role === "STAFF" ? "/staff" : "/owner") + "/dashboard/index5";
        }
      })
      .catch(function (err) {
        console.error("❌ OTP verification failed:", err);
        btn.prop("disabled", false);
        $("#verify-error")
          .removeClass("d-none")
          .text(err.data && err.data.error ? err.data.error : err.message);
      });
  });
})();
