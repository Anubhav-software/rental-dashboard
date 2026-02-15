/**
 * Company Logo Loader - Loads company logo in sidebar
 * Depends on: authApi.js, companyApi.js, config.js
 */
(function () {
  "use strict";

  // Get auth user and backend URL
  var authUser = window.authApi && window.authApi.getAuthUser ? window.authApi.getAuthUser() : null;
  var backendURL = window.API_BASE_URL || "";

  if (!authUser || !authUser.company_id) {
    console.log("[CompanyLogo] No company ID found, using default logo");
    return;
  }

  if (!window.companyApi || !window.companyApi.getCompany) {
    console.log("[CompanyLogo] companyApi not loaded");
    return;
  }

  console.log("[CompanyLogo] Loading company logo for:", authUser.company_id);

  // Fetch company data to get logo
  window.companyApi
    .getCompany(authUser.company_id)
    .then(function (data) {
      if (data.company && data.company.logo) {
        var logoUrl = backendURL + "/uploads/Company-logos/" + data.company.logo;
        
        // Update sidebar logo
        var lightLogo = document.querySelector(".sidebar-logo .light-logo");
        var darkLogo = document.querySelector(".sidebar-logo .dark-logo");
        var logoIcon = document.querySelector(".sidebar-logo .logo-icon");
        
        if (lightLogo) {
          lightLogo.src = logoUrl;
          lightLogo.style.maxWidth = "168px";
          lightLogo.style.maxHeight = "40px";
          lightLogo.style.objectFit = "contain";
        }
        if (darkLogo) {
          darkLogo.src = logoUrl;
          darkLogo.style.maxWidth = "168px";
          darkLogo.style.maxHeight = "40px";
          darkLogo.style.objectFit = "contain";
        }
        if (logoIcon) {
          logoIcon.src = logoUrl;
          logoIcon.style.maxWidth = "40px";
          logoIcon.style.maxHeight = "40px";
          logoIcon.style.objectFit = "contain";
        }
        
        console.log("[CompanyLogo] ✅ Logo updated in sidebar:", logoUrl);
      } else {
        console.log("[CompanyLogo] Company has no logo, using default");
      }
    })
    .catch(function (err) {
      console.error("[CompanyLogo] ❌ Failed to load company logo:", err);
    });
})();
