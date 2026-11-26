/* ==========================================================
   nav.js - opens and closes the mobile menu
   CSS hides .site-nav on small screens until it has the "open" class.
   ========================================================== */

(function () {
  const toggle = document.getElementById("navToggle");
  const nav = document.getElementById("siteNav");

  // Stop quietly if this page has no menu
  if (!toggle || !nav) return;

  // Add or remove the "open" class and keep aria-expanded in sync
  function setOpen(isOpen) {
    nav.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  }

  // Click the Menu button: flip between open and closed
  toggle.addEventListener("click", function () {
    setOpen(!nav.classList.contains("open"));
  });

  // Click a link inside the menu: close it
  nav.addEventListener("click", function (event) {
    if (event.target.closest("a")) setOpen(false);
  });

  // Press Escape: close the menu and return focus to the button
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Widening the window past the mobile breakpoint resets the menu
  window.addEventListener("resize", function () {
    if (window.innerWidth > 700) setOpen(false);
  });
})();