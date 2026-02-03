/**
 * Customer module: delete confirmation, form validation
 */
(function () {
  "use strict";

  // Delete confirmation
  document.querySelectorAll(".customer-delete-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      if (!confirm("Are you sure you want to delete this customer?")) {
        e.preventDefault();
      }
    });
  });

  // Form validation (name, phone required)
  var customerForm = document.getElementById("customer-form");
  if (customerForm) {
    customerForm.addEventListener("submit", function (e) {
      var name = document.getElementById("name");
      var phone = document.getElementById("phone");
      if (name && !name.value.trim()) {
        e.preventDefault();
        alert("Name is required.");
        name.focus();
        return false;
      }
      if (phone && !phone.value.trim()) {
        e.preventDefault();
        alert("Phone is required.");
        phone.focus();
        return false;
      }
    });
  }
})();
