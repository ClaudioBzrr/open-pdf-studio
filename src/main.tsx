import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import { I18nProvider } from "./i18n";
import { applyTheme, readThemeMode } from "./theme";

applyTheme(readThemeMode());

const root = document.getElementById("root");
if (!root) throw new Error("Elemento #root não encontrado.");

createRoot(root).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
}
