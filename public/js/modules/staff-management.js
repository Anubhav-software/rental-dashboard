/**
 * Staff Management: List staff and add new staff members (OWNER only).
 * Requires: config.js, authApi.js, authGuard.js, jQuery (from layout).
 */
(function () {
  "use strict";

  var authUser = window.authApi && window.authApi.getAuthUser ? window.authApi.getAuthUser() : null;
  var token = window.authApi && window.authApi.getToken ? window.authApi.getToken() : "";

  console.log("[Staff] 🔍 Auth Check:");
  console.log("[Staff] - Token exists:", !!token);
  console.log("[Staff] - Token length:", token ? token.length : 0);
  console.log("[Staff] - User exists:", !!authUser);
  console.log("[Staff] - User data:", authUser);

  if (!authUser || !token) {
    console.log("[Staff] ⚠️ Missing auth data, redirecting to signin");
    alert("Your session has expired. Please login again.");
    window.location.href = "/authentication/signin";
    return;
  }

  console.log("[Staff] ✅ Auth data verified");
  console.log("[Staff] Current user:", authUser);

  // Check if user is OWNER
  if (authUser.role !== "OWNER") {
    console.log("[Staff] ⚠️ User is not OWNER, access denied");
    alert("Access Denied: Only owners can manage staff members.");
    window.location.href = (authUser.role === "STAFF" ? "/staff" : "/owner") + "/dashboard/index5";
    return;
  }

  // Check if OWNER has company
  if (!authUser.company_id) {
    console.log("[Staff] ⚠️ OWNER has no company");
    alert("Please create your company first before adding staff members.");
    window.location.href = "/owner/settings/company";
    return;
  }

  console.log("[Staff] ✅ OWNER with company, loading staff list");

  // Initialize password toggle
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
    var bar = $("#password-strength");
    var text = $("#password-strength-text");

    if (!password) {
      bar.css("width", "0%").removeClass("bg-danger bg-warning bg-success");
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
    bar.removeClass("bg-danger bg-warning bg-success");

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
  $("#staff-password").on("input", function () {
    updatePasswordStrength($(this).val());
  });

  // Format date
  function formatDate(dateString) {
    if (!dateString) return "N/A";
    var date = new Date(dateString);
    var options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }

  // Load staff list
  function loadStaffList() {
    console.log("[Staff] 📤 Fetching staff list from API");
    $("#staff-loading").removeClass("d-none");
    $("#staff-empty").addClass("d-none");
    $("#staff-table-container").addClass("d-none");
    $("#staff-api-error").addClass("d-none");

    window.authApi
      .getUsers()
      .then(function (data) {
        console.log("[Staff] ✅ Staff list received:", data);
        $("#staff-loading").addClass("d-none");

        if (!data.users || data.users.length === 0) {
          console.log("[Staff] No staff members found");
          $("#staff-empty").removeClass("d-none");
          return;
        }

        // Filter to show only STAFF users from same company
        var staffUsers = data.users.filter(function (u) {
          return u.role === "STAFF" && u.company_id === authUser.company_id;
        });

        console.log("[Staff] Filtered staff users:", staffUsers.length);

        if (staffUsers.length === 0) {
          $("#staff-empty").removeClass("d-none");
          return;
        }

        // Build table rows
        var tbody = $("#staff-table-body");
        tbody.empty();

        staffUsers.forEach(function (user, index) {
          var row = $("<tr></tr>");
          row.append("<td>" + (index + 1) + "</td>");
          row.append("<td>" + formatDate(user.created_at) + "</td>");
          row.append(
            '<td><div class="d-flex align-items-center">' +
              '<div class="w-40-px h-40-px rounded-circle bg-primary-600 text-white d-flex align-items-center justify-content-center me-12 fw-medium">' +
              user.name.charAt(0).toUpperCase() +
              "</div>" +
              '<span class="text-md mb-0 fw-normal text-secondary-light">' +
              user.name +
              "</span>" +
              "</div></td>"
          );
          row.append('<td><span class="text-md mb-0 fw-normal text-secondary-light">' + user.email + "</span></td>");
          row.append(
            '<td><span class="bg-info-focus text-info-600 border border-info-main px-24 py-4 radius-4 fw-medium text-sm">' +
              user.role +
              "</span></td>"
          );
          
          // Status badge
          var statusClass = user.status === "ACTIVE" ? "bg-success-focus text-success-600 border-success-main" : "bg-neutral-200 text-neutral-600 border-neutral-400";
          var statusText = user.status === "ACTIVE" ? "Active" : "Inactive";
          row.append(
            '<td class="text-center"><span class="' + statusClass + ' border px-24 py-4 radius-4 fw-medium text-sm">' +
              statusText +
              "</span></td>"
          );
          
          row.append('<td><span class="text-sm text-secondary-light">Company #' + user.company_id.slice(-8) + "</span></td>");
          
          // Actions column
          var actionsHtml = '<td class="text-center">' +
            '<div class="d-flex align-items-center gap-2 justify-content-center">' +
            '<button type="button" class="btn-edit-staff bg-success-focus text-success-600 bg-hover-success-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" data-id="' + user.id + '" data-name="' + user.name + '" data-email="' + user.email + '" data-status="' + user.status + '" title="Edit staff">' +
            '<iconify-icon icon="lucide:edit" class="menu-icon"></iconify-icon>' +
            '</button>' +
            '<button type="button" class="btn-delete-staff bg-danger-focus text-danger-600 bg-hover-danger-200 fw-medium w-40-px h-40-px d-flex justify-content-center align-items-center rounded-circle" data-id="' + user.id + '" data-name="' + user.name + '" title="Delete staff">' +
            '<iconify-icon icon="fluent:delete-24-regular" class="menu-icon"></iconify-icon>' +
            '</button>' +
            '</div>' +
            '</td>';
          row.append(actionsHtml);
          
          tbody.append(row);
        });

        $("#staff-table-container").removeClass("d-none");
        console.log("[Staff] ✅ Table rendered with", staffUsers.length, "staff members");
      })
      .catch(function (err) {
        console.error("[Staff] ❌ Failed to load staff list:", err);
        $("#staff-loading").addClass("d-none");
        $("#staff-api-error")
          .removeClass("d-none")
          .text("Failed to load staff members: " + (err.data && err.data.error ? err.data.error : err.message));
      });
  }

  // Handle add staff form submission
  $("#add-staff-form").on("submit", function (e) {
    e.preventDefault();

    var name = $(this).find("[name=name]").val().trim();
    var email = $(this).find("[name=email]").val().trim();
    var password = $(this).find("[name=password]").val();

    if (!name || !email || !password) {
      $("#modal-error").removeClass("d-none");
      $("#modal-error-text").text("Please fill all required fields.");
      return;
    }

    if (password.length < 6) {
      $("#modal-error").removeClass("d-none");
      $("#modal-error-text").text("Password must be at least 6 characters long.");
      return;
    }

    $("#modal-error").addClass("d-none");
    $("#modal-success").addClass("d-none");
    var btn = $("#add-staff-submit-btn");
    btn.prop("disabled", true);

    console.log("[Staff] 📤 Creating new staff user:", { name: name, email: email });
    console.log("[Staff] 🔑 Using token:", token ? "Token exists (length: " + token.length + ")" : "NO TOKEN!");

    window.authApi
      .createUser({ name: name, email: email, password: password })
      .then(function (data) {
        console.log("[Staff] ✅ Staff user created successfully:", data);
        $("#modal-success").removeClass("d-none");
        $("#modal-success-text").text("🎉 Staff member added successfully! They can now login.");
        
        // Reset form and password strength
        $("#add-staff-form")[0].reset();
        updatePasswordStrength("");
        
        // Reload staff list
        setTimeout(function () {
          $("#addStaffModal").modal("hide");
          $("#modal-success").addClass("d-none");
          loadStaffList();
        }, 2000);
      })
      .catch(function (err) {
        console.error("[Staff] ❌ Failed to create staff user:", err);
        btn.prop("disabled", false);
        $("#modal-error").removeClass("d-none");
        $("#modal-error-text").text(err.data && err.data.error ? err.data.error : err.message);
      });
  });

  // Reset modal on close
  $("#addStaffModal").on("hidden.bs.modal", function () {
    $("#add-staff-form")[0].reset();
    $("#modal-error").addClass("d-none");
    $("#modal-success").addClass("d-none");
    $("#add-staff-submit-btn").prop("disabled", false);
    updatePasswordStrength("");
  });

  // Handle edit staff button clicks (using event delegation)
  $(document).on("click", ".btn-edit-staff", function () {
    var staffId = $(this).data("id");
    var staffName = $(this).data("name");
    var staffEmail = $(this).data("email");
    var staffStatus = $(this).data("status");

    console.log("[Staff] 📝 Opening edit modal for:", { id: staffId, name: staffName, email: staffEmail, status: staffStatus });

    // Populate form
    $("#edit-staff-id").val(staffId);
    $("#edit-staff-name").val(staffName);
    $("#edit-staff-email").val(staffEmail);
    $("#edit-staff-status").val(staffStatus);

    // Clear messages
    $("#edit-modal-error").addClass("d-none");
    $("#edit-modal-success").addClass("d-none");

    // Show modal
    $("#editStaffModal").modal("show");
  });

  // Handle edit staff form submission
  $("#edit-staff-form").on("submit", function (e) {
    e.preventDefault();

    var staffId = $("#edit-staff-id").val();
    var name = $("#edit-staff-name").val().trim();
    var email = $("#edit-staff-email").val().trim();
    var status = $("#edit-staff-status").val();

    if (!name || !email || !status) {
      $("#edit-modal-error").removeClass("d-none");
      $("#edit-modal-error-text").text("Please fill all required fields.");
      return;
    }

    $("#edit-modal-error").addClass("d-none");
    $("#edit-modal-success").addClass("d-none");
    var btn = $("#edit-staff-submit-btn");
    btn.prop("disabled", true);

    console.log("[Staff] 📤 Updating staff user:", { id: staffId, name: name, email: email, status: status });

    window.authApi
      .updateUser(staffId, { name: name, email: email, status: status })
      .then(function (data) {
        console.log("[Staff] ✅ Staff user updated successfully:", data);
        $("#edit-modal-success").removeClass("d-none");
        $("#edit-modal-success-text").text("✨ Staff member updated successfully!");
        
        // Reload staff list
        setTimeout(function () {
          $("#editStaffModal").modal("hide");
          $("#edit-modal-success").addClass("d-none");
          loadStaffList();
        }, 1500);
      })
      .catch(function (err) {
        console.error("[Staff] ❌ Failed to update staff user:", err);
        btn.prop("disabled", false);
        $("#edit-modal-error").removeClass("d-none");
        $("#edit-modal-error-text").text(err.data && err.data.error ? err.data.error : err.message);
      });
  });

  // Reset edit modal on close
  $("#editStaffModal").on("hidden.bs.modal", function () {
    $("#edit-staff-form")[0].reset();
    $("#edit-modal-error").addClass("d-none");
    $("#edit-modal-success").addClass("d-none");
    $("#edit-staff-submit-btn").prop("disabled", false);
  });

  // Handle delete staff button clicks
  $(document).on("click", ".btn-delete-staff", function () {
    var staffId = $(this).data("id");
    var staffName = $(this).data("name");

    console.log("[Staff] 🗑️ Delete requested for:", { id: staffId, name: staffName });

    // Show confirmation modal
    $("#delete-staff-id").val(staffId);
    $("#delete-staff-name-display").text(staffName);
    $("#delete-modal-error").addClass("d-none");
    $("#deleteStaffModal").modal("show");
  });

  // Handle delete confirmation
  $("#confirm-delete-staff").on("click", function () {
    var staffId = $("#delete-staff-id").val();
    var btn = $(this);
    btn.prop("disabled", true);
    $("#delete-modal-error").addClass("d-none");

    console.log("[Staff] 📤 Deleting staff user:", staffId);

    window.authApi
      .deleteUser(staffId)
      .then(function (data) {
        console.log("[Staff] ✅ Staff user deleted successfully:", data);
        $("#deleteStaffModal").modal("hide");
        $("#staff-api-success").removeClass("d-none").text("🗑️ Staff member deleted successfully!");
        
        setTimeout(function () {
          $("#staff-api-success").addClass("d-none");
        }, 3000);
        
        loadStaffList();
      })
      .catch(function (err) {
        console.error("[Staff] ❌ Failed to delete staff user:", err);
        btn.prop("disabled", false);
        $("#delete-modal-error")
          .removeClass("d-none")
          .text(err.data && err.data.error ? err.data.error : err.message);
      });
  });

  // Reset delete modal on close
  $("#deleteStaffModal").on("hidden.bs.modal", function () {
    $("#confirm-delete-staff").prop("disabled", false);
    $("#delete-modal-error").addClass("d-none");
  });

  // Initialize
  initPasswordToggle();
  loadStaffList();
})();
