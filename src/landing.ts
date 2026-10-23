import { registerSW } from "virtual:pwa-register";

const root = document.documentElement;

const applyTheme = (theme: "light" | "dark") => {
  root.dataset.theme = theme;
  try {
    localStorage.setItem("openpdf.theme", theme);
  } catch {
    // Ignore storage failures.
  }
};

document.querySelectorAll<HTMLButtonElement>("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    applyTheme(root.dataset.theme === "dark" ? "light" : "dark");
  });
});

const nav = document.querySelector<HTMLElement>("[data-nav]");
document.querySelectorAll<HTMLButtonElement>("[data-menu-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    nav?.classList.toggle("open");
    button.setAttribute("aria-expanded", String(nav?.classList.contains("open")));
  });
});

document.querySelectorAll<HTMLAnchorElement>("[data-nav] a").forEach((link) => {
  link.addEventListener("click", () => {
    nav?.classList.remove("open");
    document.querySelector<HTMLButtonElement>("[data-menu-toggle]")?.setAttribute("aria-expanded", "false");
  });
});

let installPrompt: Event | null = null;
const installButtons = document.querySelectorAll<HTMLButtonElement>("[data-install]");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  installButtons.forEach((button) => {
    button.hidden = false;
  });
});

installButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    if (!installPrompt) return;
    const prompt = installPrompt as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
    await prompt.prompt();
    await prompt.userChoice;
    installPrompt = null;
    installButtons.forEach((item) => {
      item.hidden = true;
    });
  });
});

window.addEventListener("appinstalled", () => {
  installButtons.forEach((button) => {
    button.hidden = true;
  });
});

const year = document.querySelector("[data-year]");
if (year) year.textContent = String(new Date().getFullYear());

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}
