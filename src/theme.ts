export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "openpdf.theme";

export const readThemeMode = (): ThemeMode => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "light" || value === "dark" || value === "system") return value;
  } catch {
    // localStorage can be unavailable in hardened browser contexts.
  }
  return "system";
};

export const resolveTheme = (mode: ThemeMode): "light" | "dark" => {
  if (mode === "system") {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
};

export const applyTheme = (mode: ThemeMode): "light" | "dark" => {
  const resolved = resolveTheme(mode);
  document.documentElement.dataset.theme = resolved;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Ignore storage failures.
  }
  return resolved;
};

export const watchSystemTheme = (onChange: () => void): (() => void) => {
  const media = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!media) return () => undefined;
  const handler = () => onChange();
  media.addEventListener?.("change", handler);
  return () => media.removeEventListener?.("change", handler);
};
