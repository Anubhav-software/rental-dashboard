/**
 * Sidebar control: Disable sidebar links for OWNER without company.
 * Load after authApi and authGuard.
 */
(function () {
  "use strict";

  function disableSidebar() {
    var authUser = window.authApi && window.authApi.getAuthUser ? window.authApi.getAuthUser() : null;
    
    if (!authUser) {
      console.log("[Sidebar] No auth user found");
      return;
    }

    var companyId = authUser.company_id !== undefined ? authUser.company_id : authUser.companyId;
    console.log("[Sidebar] Checking user:", {
      role: authUser.role,
      company_id: companyId
    });

    // Check if OWNER without company
    var isOwnerWithoutCompany =
      authUser.role === "OWNER" &&
      (companyId === null || companyId === undefined || companyId === "");

    if (isOwnerWithoutCompany) {
      console.log("[Sidebar] ⚠️ OWNER without company detected - disabling sidebar");

      // Disable all sidebar links except settings/company
      var sidebar = document.querySelector(".sidebar");
      if (sidebar) {
        var allLinks = sidebar.querySelectorAll("a");
        allLinks.forEach(function (link) {
          var href = link.getAttribute("href") || "";
          // Keep company settings page accessible
          if (href.indexOf("/settings/company") === -1) {
            link.style.pointerEvents = "none";
            link.style.opacity = "0.5";
            link.style.cursor = "not-allowed";
            link.setAttribute("title", "Please complete company setup first");
            
            // Prevent click
            link.addEventListener("click", function (e) {
              e.preventDefault();
              console.log("[Sidebar] ❌ Navigation blocked - company setup required");
            });
          }
        });

        // Add a notice at the top of sidebar
        var notice = document.createElement("div");
        notice.style.cssText =
          "padding: 15px; margin: 10px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px; font-size: 13px; text-align: center; font-weight: 500;";
        notice.innerHTML = "⚠️ Complete company setup to access dashboard";
        
        var sidebarMenu = sidebar.querySelector(".sidebar-menu");
        if (sidebarMenu) {
          sidebarMenu.insertBefore(notice, sidebarMenu.firstChild);
        }
      }

      console.log("[Sidebar] ✅ Sidebar disabled successfully");
    } else {
      console.log("[Sidebar] ✅ User has company access or is STAFF - sidebar enabled");
    }
  }

  function run() {
    // Wait for authApi to be available
    if (typeof window.authApi === "undefined") {
      console.log("[Sidebar] Waiting for authApi...");
      setTimeout(run, 100);
      return;
    }
    disableSidebar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
