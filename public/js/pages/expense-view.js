/**
 * Expense view page: load via expenseApi.getById; show full detail; Approve/Reject for PENDING (Owner only; 403 → toast).
 */
(function () {
  var card = document.getElementById("expense-view-card");
  var loadingEl = document.getElementById("expense-view-loading");
  var contentEl = document.getElementById("expense-view-content");
  var errorEl = document.getElementById("expense-view-error");

  if (!card) return;
  var expenseId = card.getAttribute("data-expense-id");
  var basePath = (card.getAttribute("data-base-path") || "").replace(/\/$/, "") || (window.location.pathname.indexOf("/staff") !== -1 ? "/staff" : "/owner");

  function esc(s) {
    if (s == null || s === undefined) return "";
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function formatDate(d) {
    if (!d) return "-";
    var s = typeof d === "string" ? d : (d instanceof Date ? d.toISOString() : String(d));
    return s.slice(0, 10);
  }

  function categoryLabel(cat) {
    var map = { FUEL: "Fuel", MAINTENANCE: "Maintenance", INSURANCE: "Insurance", REPAIR: "Repair", OFFICE: "Office", OTHER: "Other" };
    return map[cat] || cat || "-";
  }

  function statusBadge(status) {
    if (status === "APPROVED") return '<span class="bg-success-focus text-success-main px-24 py-4 rounded-pill fw-medium text-sm">Approved</span>';
    if (status === "REJECTED") return '<span class="bg-danger-focus text-danger-main px-24 py-4 rounded-pill fw-medium text-sm">Rejected</span>';
    if (status === "PENDING") return '<span class="bg-warning-focus text-warning-main px-24 py-4 rounded-pill fw-medium text-sm">Pending</span>';
    return '<span class="bg-neutral-200 text-neutral-600 px-24 py-4 rounded-pill fw-medium text-sm">' + (status || "-") + "</span>";
  }

  function doApprove() {
    if (!window.expenseApi || !window.expenseApi.approve) return;
    window.expenseApi
      .approve(expenseId)
      .then(function () {
        if (typeof window.showToast === "function") window.showToast("Expense approved", "success");
        loadExpense();
      })
      .catch(function (err) {
        var msg = err.status === 403 ? "Owner access required" : (err.message || "Failed to approve");
        if (typeof window.showToast === "function") window.showToast(msg, "error");
      });
  }

  function doReject(reason) {
    if (!window.expenseApi || !window.expenseApi.reject) return;
    window.expenseApi
      .reject(expenseId, { rejection_reason: reason || "" })
      .then(function () {
        if (typeof window.showToast === "function") window.showToast("Expense rejected", "success");
        loadExpense();
      })
      .catch(function (err) {
        var msg = err.status === 403 ? "Owner access required" : (err.message || "Failed to reject");
        if (typeof window.showToast === "function") window.showToast(msg, "error");
      });
  }

  function showError(msg) {
    if (loadingEl) loadingEl.classList.add("d-none");
    if (contentEl) contentEl.classList.add("d-none");
    if (errorEl) {
      errorEl.textContent = msg || "Failed to load expense";
      errorEl.classList.remove("d-none");
    }
    if (typeof window.showToast === "function") window.showToast(msg || "Failed to load expense", "error");
  }

  function attachApproveReject(exp) {
    if (exp.status !== "PENDING") return;
    var approveBtn = contentEl.querySelector(".expense-view-approve-btn");
    var rejectBtn = contentEl.querySelector(".expense-view-reject-btn");
    if (approveBtn) {
      approveBtn.addEventListener("click", function () {
        if (typeof window.Swal !== "undefined") {
          window.Swal.fire({
            title: "Approve expense?",
            text: "This expense will be marked as approved.",
            icon: "question",
            showCancelButton: true,
            confirmButtonText: "Yes, approve",
            cancelButtonText: "Cancel",
          }).then(function (result) {
            if (result.isConfirmed) doApprove();
          });
        } else {
          doApprove();
        }
      });
    }
    if (rejectBtn) {
      rejectBtn.addEventListener("click", function () {
        if (typeof window.Swal !== "undefined") {
          window.Swal.fire({
            title: "Reject expense?",
            html: '<p class="mb-2">Optionally add a reason:</p><textarea id="swal-expense-rejection-reason" class="form-control" rows="2" placeholder="Reason (optional)"></textarea>',
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Reject",
            confirmButtonColor: "#dc3545",
            cancelButtonText: "Cancel",
          }).then(function (result) {
            if (result.isConfirmed) {
              var reasonEl = document.getElementById("swal-expense-rejection-reason");
              doReject(reasonEl ? reasonEl.value : "");
            }
          });
        } else {
          doReject("");
        }
      });
    }
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
    if (loadingEl) loadingEl.classList.remove("d-none");
    if (contentEl) contentEl.classList.add("d-none");
    if (errorEl) errorEl.classList.add("d-none");
    window.expenseApi
      .getById(expenseId)
      .then(function (data) {
        var exp = (data && data.expense) ? data.expense : data;
        if (!exp) {
          showError("Expense not found");
          return;
        }
        if (loadingEl) loadingEl.classList.add("d-none");
        if (errorEl) errorEl.classList.add("d-none");
        if (contentEl) contentEl.classList.remove("d-none");

        var sym = exp.currencySymbol || "₹";
        var amountStr = sym + (exp.amount != null ? Number(exp.amount).toFixed(2) : "0");
        var actionsHtml =
          '<a href="' + basePath + '/expense/list" class="btn btn-sm border border-neutral-400 radius-8">Back to list</a>';
        if (exp.status !== "APPROVED") {
          actionsHtml += ' <a href="' + basePath + '/expense/edit/' + encodeURIComponent(expenseId) + '" class="btn btn-sm btn-outline-primary radius-8">Edit</a>';
        }
        if (exp.status === "PENDING") {
          actionsHtml +=
            ' <button type="button" class="btn btn-sm btn-success radius-8 expense-view-approve-btn">Approve</button>' +
            ' <button type="button" class="btn btn-sm btn-danger radius-8 expense-view-reject-btn">Reject</button>';
        }

        var createdByStr = exp.createdBy && (exp.createdBy.name || exp.createdBy.email) ? esc(exp.createdBy.name || exp.createdBy.email) : "-";
        var approvedByStr = exp.approvedBy && (exp.approvedBy.name || exp.approvedBy.email) ? esc(exp.approvedBy.name || exp.approvedBy.email) : "-";
        var approvedAtStr = exp.approvedAt ? formatDate(exp.approvedAt) : "-";
        var rejectionHtml = exp.rejectionReason
          ? '<tr><th class="text-secondary-light pe-3">Rejection reason</th><td>' + esc(exp.rejectionReason) + "</td></tr>"
          : "";
        var baseUrl = (typeof window.API_BASE_URL === "string" && window.API_BASE_URL) ? window.API_BASE_URL.replace(/\/api\/?$/, "") : "";
        var receiptUrl = (exp.receiptPath && baseUrl) ? baseUrl + "/uploads/Expense-receipts/" + encodeURIComponent(exp.receiptPath) : "";
        var receiptRow = exp.receiptPath
          ? "<tr><th class=\"text-secondary-light pe-3\">Receipt</th><td><a href=\"" + esc(receiptUrl) + "\" target=\"_blank\" rel=\"noopener\" class=\"text-primary-600\">View receipt</a></td></tr>"
          : "";

        var vehicleRow = (exp.vehicle || exp.vehicleId)
          ? "<tr><th class=\"text-secondary-light pe-3\">Vehicle</th><td>" + esc(exp.vehicle ? ((exp.vehicle.registrationNumber || "") + (exp.vehicle.make || exp.vehicle.model ? " – " + (exp.vehicle.make || "") + " " + (exp.vehicle.model || "") : "")) : exp.vehicleId) + "</td></tr>"
          : "";
        contentEl.innerHTML =
          '<div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-24">' + actionsHtml + "</div>" +
          '<table class="table bordered-table max-w-600">' +
          "<tr><th class=\"text-secondary-light pe-3\" style=\"width:140px\">Amount</th><td><strong>" + esc(amountStr) + "</strong></td></tr>" +
          vehicleRow +
          "<tr><th class=\"text-secondary-light pe-3\">Category</th><td>" + esc(categoryLabel(exp.category)) + "</td></tr>" +
          "<tr><th class=\"text-secondary-light pe-3\">Description</th><td>" + esc(exp.description || "-") + "</td></tr>" +
          "<tr><th class=\"text-secondary-light pe-3\">Expense date</th><td>" + formatDate(exp.expenseDate) + "</td></tr>" +
          "<tr><th class=\"text-secondary-light pe-3\">Status</th><td>" + statusBadge(exp.status) + "</td></tr>" +
          receiptRow +
          "<tr><th class=\"text-secondary-light pe-3\">Created by</th><td>" + createdByStr + "</td></tr>" +
          "<tr><th class=\"text-secondary-light pe-3\">Approved by</th><td>" + approvedByStr + "</td></tr>" +
          "<tr><th class=\"text-secondary-light pe-3\">Approved at</th><td>" + approvedAtStr + "</td></tr>" +
          rejectionHtml +
          "</table>";
        attachApproveReject(exp);
      })
      .catch(function (err) {
        showError(err.message || err.data?.error || "Failed to load expense");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadExpense);
  } else {
    loadExpense();
  }
})();
