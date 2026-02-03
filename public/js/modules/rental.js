/**
 * Rental module: delete confirmation, form validation
 */
(function () {
  "use strict";

  // Delete / cancel rental confirmation
  document.querySelectorAll(".rental-delete-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      if (!confirm("Are you sure you want to cancel this rental? The vehicle will be marked as Available.")) {
        e.preventDefault();
      }
    });
  });

  // Create rental form: require customer, vehicle, start date, end date
  var rentalForm = document.getElementById("rental-form");
  if (rentalForm) {
    rentalForm.addEventListener("submit", function (e) {
      var customerId = document.getElementById("customerId");
      var vehicleId = document.getElementById("vehicleId");
      var startDate = document.getElementById("startDate");
      var endDate = document.getElementById("endDate");
      var termsAccepted = document.getElementById("termsAccepted");
      if (customerId && !customerId.value) {
        e.preventDefault();
        alert("Please select a customer.");
        customerId.focus();
        return false;
      }
      if (vehicleId && !vehicleId.value) {
        e.preventDefault();
        alert("Please select a vehicle.");
        vehicleId.focus();
        return false;
      }
      if (startDate && !startDate.value.trim()) {
        e.preventDefault();
        alert("Start date is required.");
        startDate.focus();
        return false;
      }
      if (endDate && !endDate.value.trim()) {
        e.preventDefault();
        alert("End date is required.");
        endDate.focus();
        return false;
      }
      if (startDate && endDate && startDate.value && endDate.value) {
        var start = new Date(startDate.value);
        var end = new Date(endDate.value);
        if (end <= start) {
          e.preventDefault();
          alert("End date must be after start date.");
          endDate.focus();
          return false;
        }
      }
      if (termsAccepted && !termsAccepted.checked) {
        e.preventDefault();
        alert("Please accept the terms and conditions.");
        termsAccepted.focus();
        return false;
      }
    });
  }
})();
