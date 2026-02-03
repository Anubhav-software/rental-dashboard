/**
 * Return module: form validation for process return
 */
(function () {
  "use strict";

  var returnForm = document.getElementById("return-form");
  if (returnForm) {
    returnForm.addEventListener("submit", function (e) {
      var actualReturnDate = document.getElementById("actualReturnDate");
      if (actualReturnDate && !actualReturnDate.value.trim()) {
        e.preventDefault();
        alert("Return date is required.");
        actualReturnDate.focus();
        return false;
      }
    });
  }
})();
