/**
 * Expense add page: form submit via expenseApi.create; success toast + redirect to list or view.
 * Optionally show message when auto-approved (amount <= threshold).
 */
(function () {
  var card = document.getElementById("expense-add-card");
  var form = document.getElementById("expense-add-form");
  var errorEl = document.getElementById("expense-add-error");
  var submitBtn = document.getElementById("expense-add-submit");

  var basePath = (card && card.getAttribute("data-base-path")) || "";
  basePath = (basePath || "").replace(/\/$/, "");
  if (!basePath) basePath = (typeof window !== "undefined" && window.location.pathname.indexOf("/staff") !== -1) ? "/staff" : "/owner";

  function setDefaultDate() {
    var el = document.getElementById("expense-add-expense-date");
    if (el && !el.value) {
      var d = new Date();
      el.value = d.toISOString().slice(0, 10);
    }
  }

  function showError(msg) {
    if (errorEl) {
      errorEl.textContent = msg || "Failed to create expense";
      errorEl.classList.remove("d-none");
    }
    if (typeof window.showToast === "function") window.showToast(msg || "Failed to create expense", "error");
  }

  function hideError() {
    if (errorEl) errorEl.classList.add("d-none");
  }

  function loadVehicles() {
    var sel = document.getElementById("expense-add-vehicle-id");
    if (!sel || !window.vehicleApi || !window.vehicleApi.list) return;
    sel.innerHTML = "<option value=\"\">Loading vehicles…</option>";
    var fetchFn = window.fetchAllVehicles ? window.fetchAllVehicles() : window.vehicleApi.list({ limit: 100 }).then(function (r) { return (r && r.vehicles) ? r.vehicles : []; });
    fetchFn.then(function (list) {
      list = Array.isArray(list) ? list : [];
      sel.innerHTML = "<option value=\"\">Select vehicle</option>";
      list.forEach(function (v) {
        var opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = (v.registrationNumber || "") + " – " + (v.make || "") + " " + (v.model || "");
        sel.appendChild(opt);
      });
      if (window.attachSearchToSelect) window.attachSearchToSelect(sel, "Search vehicle…");
    }).catch(function () {
      if (window.showToast) window.showToast("Could not load vehicles", "error");
      sel.innerHTML = "<option value=\"\">Error loading</option>";
    });
  }

  function init() {
    if (!card || !form) return;
    setDefaultDate();
    loadVehicles();
    hideError();
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var amountEl = document.getElementById("expense-add-amount");
      var categoryEl = document.getElementById("expense-add-category");
      var vehicleEl = document.getElementById("expense-add-vehicle-id");
      var descEl = document.getElementById("expense-add-description");
      var dateEl = document.getElementById("expense-add-expense-date");
      var statusEl = document.getElementById("expense-add-status");
      var receiptFileEl = document.getElementById("expense-add-receipt");
      var amount = amountEl ? parseFloat(amountEl.value) : NaN;
      var status = (statusEl && statusEl.value) ? statusEl.value.trim() : "PENDING";
      if (isNaN(amount) || amount < 0) {
        showError("Please enter a valid amount.");
        return;
      }
      var category = categoryEl ? (categoryEl.value || "").trim() : "";
      var vehicleId = vehicleEl ? (vehicleEl.value || "").trim() : "";
      var description = descEl ? (descEl.value || "").trim() : "";
      var expenseDate = dateEl ? (dateEl.value || "").trim() : "";
      if (!category || !description || !expenseDate) {
        showError("Category, description and expense date are required.");
        return;
      }
      if (!vehicleId) {
        showError("Please select a vehicle.");
        return;
      }

      var hasReceiptFile = receiptFileEl && receiptFileEl.files && receiptFileEl.files.length > 0;
      var payload;
      var options = {};
      if (hasReceiptFile) {
        var formData = new FormData();
        formData.append("amount", amount);
        formData.append("category", category);
        formData.append("vehicle_id", vehicleId);
        formData.append("description", description);
        formData.append("expense_date", expenseDate);
        formData.append("status", status);
        formData.append("receipt", receiptFileEl.files[0]);
        payload = formData;
        options.formData = true;
      } else {
        payload = {
          amount: amount,
          category: category,
          vehicle_id: vehicleId,
          description: description,
          expense_date: expenseDate,
          status: status,
        };
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Creating…";
      }
      hideError();
      if (!window.expenseApi || !window.expenseApi.create) {
        showError("Expense API not loaded.");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Create expense"; }
        return;
      }
      window.expenseApi
        .create(payload, options)
        .then(function (data) {
          var expense = (data && data.expense) ? data.expense : data;
          var status = expense && expense.status ? expense.status : "";
          if (typeof window.showToast === "function") {
            if (status === "APPROVED") {
              window.showToast("Expense created and auto-approved.", "success");
            } else {
              window.showToast("Expense created. Pending approval.", "success");
            }
          }
          if (expense && expense.id) {
            window.location.href = basePath + "/expense/view/" + encodeURIComponent(expense.id);
          } else {
            window.location.href = basePath + "/expense/list";
          }
        })
        .catch(function (err) {
          var msg = (err.data && err.data.error) ? err.data.error : (err.message || "Failed to create expense.");
          showError(msg);
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Create expense";
          }
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
