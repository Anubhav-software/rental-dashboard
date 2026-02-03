/**
 * Expense module: delete confirmation, form validation
 */
(function () {
  "use strict";

  document.querySelectorAll(".expense-delete-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      if (!confirm("Are you sure you want to delete this expense?")) {
        e.preventDefault();
      }
    });
  });

  var expenseForm = document.getElementById("expense-form");
  if (expenseForm) {
    expenseForm.addEventListener("submit", function (e) {
      var amount = document.getElementById("amount");
      var expenseDate = document.getElementById("expenseDate");
      var expenseType = document.getElementById("expenseType");
      if (amount && (isNaN(parseFloat(amount.value)) || parseFloat(amount.value) < 0)) {
        e.preventDefault();
        alert("Please enter a valid amount.");
        amount.focus();
        return false;
      }
      if (expenseDate && !expenseDate.value.trim()) {
        e.preventDefault();
        alert("Expense date is required.");
        expenseDate.focus();
        return false;
      }
      if (expenseType && !expenseType.value) {
        e.preventDefault();
        alert("Please select expense type.");
        expenseType.focus();
        return false;
      }
    });
  }
})();
