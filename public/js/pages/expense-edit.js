/**
 * Expense edit page: load via expenseApi.getById. If status is APPROVED, show "cannot edit" and link to view.
 * Otherwise show form; submit via expenseApi.update(id, body). Approved expenses are not editable.
 */
(function () {
  var card = document.getElementById("expense-edit-card");
  var loadingEl = document.getElementById("expense-edit-loading");
  var blockedEl = document.getElementById("expense-edit-blocked");
  var contentEl = document.getElementById("expense-edit-content");
  var errorEl = document.getElementById("expense-edit-error");
  var form = document.getElementById("expense-edit-form");
  var viewLink = document.getElementById("expense-edit-view-link");

  if (!card) return;
  var expenseId = card.getAttribute("data-expense-id");
  var basePath = (card.getAttribute("data-base-path") || "").replace(/\/$/, "") || (window.location.pathname.indexOf("/staff") !== -1 ? "/staff" : "/owner");

  function showError(msg) {
    if (loadingEl) loadingEl.classList.add("d-none");
    if (contentEl) contentEl.classList.add("d-none");
    if (blockedEl) blockedEl.classList.add("d-none");
    if (errorEl) {
      errorEl.textContent = msg || "Failed to load expense";
      errorEl.classList.remove("d-none");
    }
    if (typeof window.showToast === "function") window.showToast(msg || "Failed to load expense", "error");
  }

  function statusBadge(status) {
    if (status === "APPROVED") return '<span class="badge bg-success">Approved</span>';
    if (status === "REJECTED") return '<span class="badge bg-danger">Rejected</span>';
    return '<span class="badge bg-warning">Pending</span>';
  }

  function loadVehicles(selectedId) {
    var sel = document.getElementById("expense-edit-vehicle-id");
    if (!sel || !window.vehicleApi || !window.vehicleApi.list) return;
    var fetchFn = window.fetchAllVehicles ? window.fetchAllVehicles() : window.vehicleApi.list({ limit: 100 }).then(function (r) { return (r && r.vehicles) ? r.vehicles : []; });
    fetchFn.then(function (list) {
      list = Array.isArray(list) ? list : [];
      sel.innerHTML = "<option value=\"\">Select vehicle</option>";
      list.forEach(function (v) {
        var opt = document.createElement("option");
        opt.value = v.id;
        opt.textContent = (v.registrationNumber || "") + " – " + (v.make || "") + " " + (v.model || "");
        if (selectedId && v.id === selectedId) opt.selected = true;
        sel.appendChild(opt);
      });
      if (window.attachSearchToSelect) window.attachSearchToSelect(sel, "Search vehicle…");
    }).catch(function () {});
  }

  function loadExpense() {
    if (!expenseId) {
      showError("Invalid expense");
      return;
    }
    if (!window.expenseApi || !window.expenseApi.getById) {
      showError("Expense API not loaded");
      return;
    }
    window.expenseApi
      .getById(expenseId)
      .then(function (data) {
        var exp = (data && data.expense) ? data.expense : data;
        if (!exp) {
          showError("Expense not found");
          return;
        }
        if (loadingEl) loadingEl.classList.add("d-none");

        if (exp.status === "APPROVED") {
          if (blockedEl) blockedEl.classList.remove("d-none");
          if (contentEl) contentEl.classList.add("d-none");
          if (viewLink) viewLink.href = basePath + "/expense/view/" + encodeURIComponent(expenseId);
          if (typeof window.showToast === "function") window.showToast("Approved expenses cannot be edited.", "info");
          return;
        }

        if (blockedEl) blockedEl.classList.add("d-none");
        if (contentEl) contentEl.classList.remove("d-none");

        var statusBadgeEl = document.getElementById("expense-edit-status-badge");
        if (statusBadgeEl) statusBadgeEl.outerHTML = statusBadge(exp.status);

        document.getElementById("expense-edit-amount").value = exp.amount != null ? Number(exp.amount) : "";
        document.getElementById("expense-edit-category").value = exp.category || "";
        document.getElementById("expense-edit-description").value = exp.description || "";
        var dateStr = exp.expenseDate ? (typeof exp.expenseDate === "string" ? exp.expenseDate.slice(0, 10) : exp.expenseDate.toISOString().slice(0, 10)) : "";
        document.getElementById("expense-edit-expense-date").value = dateStr;

        loadVehicles(exp.vehicleId || exp.vehicle && exp.vehicle.id);
      })
      .catch(function (err) {
        showError(err.message || (err.data && err.data.error) || "Failed to load expense");
      });
  }

  function initForm() {
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var amountEl = document.getElementById("expense-edit-amount");
      var categoryEl = document.getElementById("expense-edit-category");
      var vehicleEl = document.getElementById("expense-edit-vehicle-id");
      var descEl = document.getElementById("expense-edit-description");
      var dateEl = document.getElementById("expense-edit-expense-date");
      var submitBtn = document.getElementById("expense-edit-submit");

      var amount = amountEl ? parseFloat(amountEl.value) : NaN;
      if (isNaN(amount) || amount < 0) {
        if (window.showToast) window.showToast("Please enter a valid amount.", "error");
        return;
      }
      var category = categoryEl ? (categoryEl.value || "").trim() : "";
      var vehicleId = vehicleEl ? (vehicleEl.value || "").trim() : "";
      var description = descEl ? (descEl.value || "").trim() : "";
      var expenseDate = dateEl ? (dateEl.value || "").trim() : "";
      if (!category || !description || !expenseDate) {
        if (window.showToast) window.showToast("Category, description and expense date are required.", "error");
        return;
      }
      if (!vehicleId) {
        if (window.showToast) window.showToast("Please select a vehicle.", "error");
        return;
      }

      var payload = {
        amount: amount,
        category: category,
        vehicle_id: vehicleId,
        description: description,
        expense_date: expenseDate,
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Updating…";
      }
      if (errorEl) errorEl.classList.add("d-none");

      window.expenseApi
        .update(expenseId, payload)
        .then(function () {
          if (typeof window.showToast === "function") window.showToast("Expense updated.", "success");
          window.location.href = basePath + "/expense/view/" + encodeURIComponent(expenseId);
        })
        .catch(function (err) {
          var msg = (err.data && err.data.error) ? err.data.error : (err.message || "Failed to update expense.");
          if (window.showToast) window.showToast(msg, "error");
          if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.remove("d-none");
          }
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Update expense";
          }
        });
    });
  }

  initForm();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadExpense);
  } else {
    loadExpense();
  }
})();
