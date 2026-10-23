(function () {
  try {
    var stored = localStorage.getItem("openpdf.theme");
    var resolved =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    document.documentElement.dataset.theme = resolved;
    var lang = localStorage.getItem("openpdf.lang");
    if (lang === "pt" || lang === "en") {
      document.documentElement.lang = lang === "pt" ? "pt-BR" : "en";
    }
  } catch (error) {
    document.documentElement.dataset.theme = "light";
  }
})();
