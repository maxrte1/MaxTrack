(function () {
  const key = "maxtrack.theme";
  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  let savedTheme = null;

  try {
    savedTheme = localStorage.getItem(key);
  } catch (error) {
    // The switch still works if browser storage is blocked.
  }

  function getTheme() {
    if (savedTheme === "light" || savedTheme === "dark") return savedTheme;
    return systemTheme.matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    const button = document.getElementById("themeToggle");
    if (button) {
      const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
      button.setAttribute("aria-label", label);
      button.title = label;
    }
  }

  // Apply before the page is painted to avoid a flash of the wrong theme.
  applyTheme(getTheme());

  document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("themeToggle");
    if (!button) return;

    applyTheme(getTheme());
    button.hidden = false;
    button.addEventListener("click", function () {
      savedTheme = getTheme() === "dark" ? "light" : "dark";
      applyTheme(savedTheme);
      try {
        localStorage.setItem(key, savedTheme);
      } catch (error) {
        // Keep the current theme even if it cannot be saved.
      }
    });
  });

  systemTheme.addEventListener("change", function () {
    applyTheme(getTheme());
  });

  window.addEventListener("storage", function (event) {
    if (event.key === key || event.key === null) {
      savedTheme = event.key === key ? event.newValue : null;
      applyTheme(getTheme());
    }
  });
})();
