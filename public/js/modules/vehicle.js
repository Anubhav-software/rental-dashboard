/**
 * Vehicle module: form validation, delete confirmation
 */
(function () {
  "use strict";

  // Delete confirmation
  document.querySelectorAll(".vehicle-delete-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      if (!confirm("Are you sure you want to delete this vehicle?")) {
        e.preventDefault();
      }
    });
  });

  // Optional: client-side form validation (required fields are already in HTML5)
  var vehicleForm = document.getElementById("vehicle-form");
  if (vehicleForm) {
    vehicleForm.addEventListener("submit", function (e) {
  var make = document.getElementById("make");
  var model = document.getElementById("model");
  var reg = document.getElementById("registrationNumber");
  if (make && !make.value.trim()) {
    e.preventDefault();
    alert("Make is required.");
    make.focus();
    return false;
  }
      if (model && !model.value.trim()) {
        e.preventDefault();
        alert("Model is required.");
        model.focus();
        return false;
      }
      if (reg && !reg.value.trim()) {
        e.preventDefault();
        alert("Registration Number is required.");
        reg.focus();
        return false;
      }
    });
  }
})();
