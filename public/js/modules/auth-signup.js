/**
 * Auth: Signup page — form submit via API, redirect on success.
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

  // Password strength indicator
  function updatePasswordStrength(password) {
    var strength = 0;
    var bar = $("#signup-password-strength");
    var text = $("#signup-password-strength-text");

    if (!password) {
      bar.css("width", "0%").removeClass("bg-danger bg-warning bg-info bg-success");
      text.text("");
      return;
    }

    // Calculate strength
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 25;

    // Update UI
    bar.css("width", strength + "%");
    bar.removeClass("bg-danger bg-warning bg-info bg-success");

    if (strength <= 25) {
      bar.addClass("bg-danger");
      text.text("Weak").css("color", "#dc3545");
    } else if (strength <= 50) {
      bar.addClass("bg-warning");
      text.text("Fair").css("color", "#ffc107");
    } else if (strength <= 75) {
      bar.addClass("bg-info");
      text.text("Good").css("color", "#0dcaf0");
    } else {
      bar.addClass("bg-success");
      text.text("Strong").css("color", "#198754");
    }
  }

  // Monitor password input
  $("#your-password").on("input", function () {
    updatePasswordStrength($(this).val());
  });

  function showError(msg) {
    $("#signup-success").addClass("d-none");
    $("#signup-error").removeClass("d-none").text(msg || "Something went wrong.");
  }

  function showSuccess(msg) {
    $("#signup-error").addClass("d-none");
    $("#signup-success").removeClass("d-none").text(msg || "Account created.");
  }

  $("#signup-form").on("submit", function (e) {
    e.preventDefault();
    var name = $(this).find("[name=name]").val().trim();
    var email = $(this).find("[name=email]").val().trim();
    var password = $(this).find("[name=password]").val();
    var role = $(this).find("[name=role]").val();
    if (!name || !email || !password || !role) {
      showError("Please fill all fields.");
      return;
    }
    var btn = $(this).find("button[type=submit]");
    btn.prop("disabled", true);
    window.authApi
      .signup({ name: name, email: email, password: password, role: role })
      .then(function (data) {
        console.log("✅ Signup successful:", data);
        showSuccess("Account created. Redirecting to sign in...");
        setTimeout(function () {
          window.location.href = "/authentication/signin";
        }, 1500);
      })
      .catch(function (err) {
        console.error("❌ Signup failed:", err);
        btn.prop("disabled", false);
        showError(err.data && err.data.error ? err.data.error : err.message);
      });
  });

  initPasswordToggle();
})();
