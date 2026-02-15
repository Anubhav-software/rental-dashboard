/**
 * Settings / Company: VIEW/CREATE/EDIT mode for company details.
 * Requires: config.js, authApi.js, companyApi.js, authGuard.js, jQuery (from layout).
 */
(function () {
  "use strict";

  var authUser = window.authApi && window.authApi.getAuthUser ? window.authApi.getAuthUser() : null;
  var token = window.authApi && window.authApi.getToken ? window.authApi.getToken() : "";
  var backendURL = window.API_BASE_URL || "";

  if (!token || !authUser) {
    window.location.href = "/authentication/signin";
    return;
  }

  var isCreateMode =
    authUser.company_id === null ||
    authUser.company_id === undefined ||
    authUser.company_id === "";

  var isViewMode = !isCreateMode && authUser.role === "OWNER";
  var isEditMode = false;
  var uploadedFile = null; // Store selected file

  console.log("[Company] Mode:", isCreateMode ? "CREATE" : "VIEW");
  console.log("[Company] User has company_id:", authUser.company_id);
  console.log("[Company] Backend URL:", backendURL);

  // If in VIEW mode, load company data and show view cards
  if (isViewMode) {
    console.log("[Company] 📤 Loading company details for viewing");
    $("#company-view-container").show();
    $("#company-form").hide();
    loadAndShowCompanyView();
  } else {
    // CREATE mode - show form, hide view
    console.log("[Company] ✅ CREATE mode active");
    $("#company-view-container").hide();
    $("#company-form").show();
  }

  function loadAndShowCompanyView() {
    window.companyApi
      .getCompany(authUser.company_id)
      .then(function (data) {
        console.log("[Company] ✅ Company data loaded:", data);
        populateViewCards(data.company);
      })
      .catch(function (err) {
        console.error("[Company] ❌ Failed to load company:", err);
        $("#company-api-error")
          .removeClass("d-none")
          .text("Failed to load company details: " + (err.data && err.data.error ? err.data.error : err.message));
      });
  }

  function populateViewCards(company) {
    // Header card
    $("#view-company-name").text(company.name || "-");
    $("#view-company-registration").text("Company ID: " + (company.id || "-"));
    
    // Show logo if available
    if (company.logo) {
      var logoUrl = backendURL + "/uploads/Company-logos/" + company.logo;
      $("#view-company-logo").attr("src", logoUrl);
      $("#view-logo-container").removeClass("d-none");
      $("#view-logo-icon").addClass("d-none");
      console.log("[Company] 📷 Logo URL:", logoUrl);
    } else {
      $("#view-logo-container").addClass("d-none");
      $("#view-logo-icon").removeClass("d-none");
    }

    // Basic Information
    $("#view-phone").text(company.phone || "-");
    $("#view-email").text(company.email || "-");
    $("#view-country").text(company.country || "-");
    $("#view-address").text(company.address || "-");

    // Currency & Hours
    $("#view-currency-code").text(company.currency_code || "-");
    $("#view-currency-symbol").text(company.currency_symbol || "-");
    var hours = "-";
    if (company.operating_hours_start && company.operating_hours_end) {
      hours = company.operating_hours_start + " - " + company.operating_hours_end;
    }
    $("#view-operating-hours").text(hours);

    // Rental Configuration
    $("#view-charge-method").text(company.default_charge_calculation_method || "-");
    
    var rateTypes = [];
    if (company.enable_hourly_rates) rateTypes.push("Hourly");
    if (company.enable_daily_rates) rateTypes.push("Daily");
    if (company.enable_weekly_rates) rateTypes.push("Weekly");
    if (company.enable_monthly_rates) rateTypes.push("Monthly");
    $("#view-rate-types").text(rateTypes.length > 0 ? rateTypes.join(", ") : "-");
    
    $("#view-contract-prefix").text(company.contract_number_prefix || "-");
    $("#view-invoice-prefix").text(company.invoice_number_prefix || "-");

    // Tax Configuration
    $("#view-tax-system").text(company.tax_system_name || "-");
    $("#view-tax-percentage").text(company.tax_percentage ? company.tax_percentage + "%" : "-");
    $("#view-tax-registration").text(company.tax_registration_number || "-");
    $("#view-invoice-type").text(company.default_invoice_type || "-");
    $("#view-expense-threshold").text(company.expense_approval_threshold ? company.currency_symbol + " " + company.expense_approval_threshold : "-");

    console.log("[Company] ✅ VIEW mode - Cards populated");
  }

  function populateFormForEdit(company) {
    var f = document.getElementById("company-form");
    if (f && company) {
      if (f.name) f.name.value = company.name || "";
      
      // Show existing logo preview if available
      if (company.logo) {
        var logoUrl = backendURL + "/uploads/Company-logos/" + company.logo;
        $("#logo-preview-img").attr("src", logoUrl);
        $("#logo-preview").show();
        console.log("[Company] 📷 Showing existing logo:", logoUrl);
      }
      
      if (f.phone) f.phone.value = company.phone || "";
      if (f.email) f.email.value = company.email || "";
      if (f.address) f.address.value = company.address || "";
      if (f.country) f.country.value = company.country || "";
      if (f.currency_code) f.currency_code.value = company.currency_code || "";
      if (f.currency_symbol) f.currency_symbol.value = company.currency_symbol || "";
      if (f.operating_hours_start) f.operating_hours_start.value = company.operating_hours_start || "";
      if (f.operating_hours_end) f.operating_hours_end.value = company.operating_hours_end || "";
      if (f.contract_number_prefix) f.contract_number_prefix.value = company.contract_number_prefix || "";
      if (f.invoice_number_prefix) f.invoice_number_prefix.value = company.invoice_number_prefix || "";
      if (f.default_charge_calculation_method) f.default_charge_calculation_method.value = company.default_charge_calculation_method || "";
      if (f.enable_hourly_rates) f.enable_hourly_rates.checked = company.enable_hourly_rates;
      if (f.enable_daily_rates) f.enable_daily_rates.checked = company.enable_daily_rates;
      if (f.enable_weekly_rates) f.enable_weekly_rates.checked = company.enable_weekly_rates;
      if (f.enable_monthly_rates) f.enable_monthly_rates.checked = company.enable_monthly_rates;
      if (f.terms_and_conditions) f.terms_and_conditions.value = company.terms_and_conditions || "";
      if (f.tax_system_name) f.tax_system_name.value = company.tax_system_name || "";
      if (f.tax_percentage) f.tax_percentage.value = company.tax_percentage || "";
      if (f.tax_registration_number) f.tax_registration_number.value = company.tax_registration_number || "";
      if (f.enable_tax_invoicing) f.enable_tax_invoicing.checked = company.enable_tax_invoicing;
      if (f.enable_invoice_module) f.enable_invoice_module.checked = company.enable_invoice_module;
      if (f.default_invoice_type) f.default_invoice_type.value = company.default_invoice_type || "";
      if (f.expense_approval_threshold) f.expense_approval_threshold.value = company.expense_approval_threshold || "";
    }
    console.log("[Company] ✅ Form populated for editing");
  }

  function enableEditMode() {
    isEditMode = true;
    console.log("[Company] ✏️ Switching to EDIT mode");
    
    // Hide view cards, show form
    $("#company-view-container").hide();
    $("#company-form").show();
    
    // Show cancel button in edit mode
    $("#cancel-edit-btn").removeClass("d-none");

    // Load company data into form
    window.companyApi
      .getCompany(authUser.company_id)
      .then(function (data) {
        populateFormForEdit(data.company);
      })
      .catch(function (err) {
        console.error("[Company] ❌ Failed to load company for editing:", err);
      });
  }

  function cancelEdit() {
    console.log("[Company] ❌ Cancelling edit mode");
    isEditMode = false;
    uploadedFile = null;
    
    // Hide form, show view cards
    $("#company-form").hide();
    $("#company-view-container").show();
    
    // Hide cancel button
    $("#cancel-edit-btn").addClass("d-none");
    
    // Clear any error/success messages
    $("#company-api-error").addClass("d-none");
    $("#company-api-success").addClass("d-none");
    
    // Reset file input
    $("#logo-upload").val("");
  }

  // Handle Edit button click in VIEW mode
  $(document).on("click", "#edit-company-btn", function (e) {
    e.preventDefault();
    enableEditMode();
  });

  // Handle Cancel button click in EDIT mode
  $(document).on("click", "#cancel-edit-btn", function (e) {
    e.preventDefault();
    cancelEdit();
  });

  function getFormData() {
    var f = document.getElementById("company-form");
    if (!f) return null;
    
    var formData = new FormData();
    formData.append("name", f.name ? f.name.value.trim() : "");
    if (f.phone && f.phone.value.trim()) formData.append("phone", f.phone.value.trim());
    if (f.email && f.email.value.trim()) formData.append("email", f.email.value.trim());
    if (f.address && f.address.value.trim()) formData.append("address", f.address.value.trim());
    if (f.country && f.country.value) formData.append("country", f.country.value);
    if (f.currency_code && f.currency_code.value.trim()) formData.append("currency_code", f.currency_code.value.trim());
    if (f.currency_symbol && f.currency_symbol.value.trim()) formData.append("currency_symbol", f.currency_symbol.value.trim());
    if (f.operating_hours_start && f.operating_hours_start.value.trim()) formData.append("operating_hours_start", f.operating_hours_start.value.trim());
    if (f.operating_hours_end && f.operating_hours_end.value.trim()) formData.append("operating_hours_end", f.operating_hours_end.value.trim());
    if (f.contract_number_prefix && f.contract_number_prefix.value.trim()) formData.append("contract_number_prefix", f.contract_number_prefix.value.trim());
    if (f.invoice_number_prefix && f.invoice_number_prefix.value.trim()) formData.append("invoice_number_prefix", f.invoice_number_prefix.value.trim());
    if (f.default_charge_calculation_method && f.default_charge_calculation_method.value) formData.append("default_charge_calculation_method", f.default_charge_calculation_method.value);
    formData.append("enable_hourly_rates", f.enable_hourly_rates ? f.enable_hourly_rates.checked : false);
    formData.append("enable_daily_rates", f.enable_daily_rates ? f.enable_daily_rates.checked : false);
    formData.append("enable_weekly_rates", f.enable_weekly_rates ? f.enable_weekly_rates.checked : false);
    formData.append("enable_monthly_rates", f.enable_monthly_rates ? f.enable_monthly_rates.checked : false);
    if (f.terms_and_conditions && f.terms_and_conditions.value.trim()) formData.append("terms_and_conditions", f.terms_and_conditions.value.trim());
    if (f.tax_system_name && f.tax_system_name.value.trim()) formData.append("tax_system_name", f.tax_system_name.value.trim());
    if (f.tax_percentage && f.tax_percentage.value) formData.append("tax_percentage", f.tax_percentage.value);
    if (f.tax_registration_number && f.tax_registration_number.value.trim()) formData.append("tax_registration_number", f.tax_registration_number.value.trim());
    formData.append("enable_tax_invoicing", f.enable_tax_invoicing ? f.enable_tax_invoicing.checked : false);
    formData.append("enable_invoice_module", f.enable_invoice_module ? f.enable_invoice_module.checked : false);
    if (f.default_invoice_type && f.default_invoice_type.value) formData.append("default_invoice_type", f.default_invoice_type.value);
    if (f.expense_approval_threshold && f.expense_approval_threshold.value) formData.append("expense_approval_threshold", f.expense_approval_threshold.value);
    
    // Append logo file if selected
    if (uploadedFile) {
      formData.append("logo", uploadedFile);
      console.log("[Company] 📷 Appending logo file to FormData:", uploadedFile.name);
    }
    
    return formData;
  }

  $("#company-form").on("submit", function (e) {
    e.preventDefault();
    var formData = getFormData();
    if (!formData) return;
    
    // Check required fields
    var nameValue = formData.get("name");
    if (!nameValue || nameValue.trim() === "") {
      $("#company-api-error").removeClass("d-none").text("Company name is required.");
      return;
    }
    
    $("#company-api-error").addClass("d-none");
    $("#company-api-success").addClass("d-none");
    var btn = document.getElementById("company-submit-btn");
    if (btn) btn.disabled = true;

    if (isCreateMode) {
      // CREATE MODE: Call API to create company
      console.log("📤 Sending company creation request with FormData");
      
      window.companyApi
        .createCompany(formData)
        .then(function (data) {
          console.log("✅ Company created successfully:", data);
          $("#company-api-success")
            .removeClass("d-none")
            .text("Company created. Redirecting to sign in...");
          setTimeout(function () {
            window.location.href = "/authentication/signin";
          }, 1500);
        })
        .catch(function (err) {
          console.error("❌ Company creation failed:", err);
          if (btn) btn.disabled = false;
          $("#company-api-error")
            .removeClass("d-none")
            .text(err.data && err.data.error ? err.data.error : err.message);
        });
    } else if (isEditMode) {
      // EDIT MODE: Update existing company
      console.log("📤 Updating company with FormData");
      
      window.companyApi
        .updateCompany(authUser.company_id, formData)
        .then(function (data) {
          console.log("✅ Company updated successfully:", data);
          $("#company-api-success")
            .removeClass("d-none")
            .text("✅ Company details updated successfully! Reloading...");
          if (btn) btn.disabled = false;
          
          // Reload page to show VIEW mode with updated data
          setTimeout(function () {
            window.location.reload();
          }, 1500);
        })
        .catch(function (err) {
          console.error("❌ Company update failed:", err);
          if (btn) btn.disabled = false;
          $("#company-api-error")
            .removeClass("d-none")
            .text(err.data && err.data.error ? err.data.error : err.message);
        });
    }
  });

  // Handle logo file upload
  $(document).on("change", "#logo-upload", function (e) {
    var file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      $("#logo-upload").val("");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Logo file size must be less than 5MB");
      $("#logo-upload").val("");
      return;
    }

    // Store file for form submission
    uploadedFile = file;
    
    // Show preview
    var reader = new FileReader();
    reader.onload = function (event) {
      $("#logo-preview-img").attr("src", event.target.result);
      $("#logo-preview").show();
      console.log("[Company] ✅ Logo file selected:", file.name, "(" + (file.size / 1024).toFixed(2) + " KB)");
    };
    reader.readAsDataURL(file);
  });

  // Handle remove logo button
  $(document).on("click", "#remove-logo-btn", function (e) {
    e.preventDefault();
    $("#logo-upload").val("");
    uploadedFile = null;
    $("#logo-preview-img").attr("src", "");
    $("#logo-preview").hide();
    console.log("[Company] ❌ Logo removed");
  });
})();
