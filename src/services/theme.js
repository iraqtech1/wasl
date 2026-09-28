import { ref } from "vue";
export const darkMode = ref(false);
export function applyTheme(value) {
  darkMode.value = value;
  document.documentElement.dataset.theme = value ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", value ? "#102636" : "#00567a");
}
export function initTheme() {
  let saved;
  try {
    saved = localStorage.getItem("wasel-theme");
  } catch {}
  applyTheme(
    saved
      ? saved === "dark"
      : matchMedia("(prefers-color-scheme: dark)").matches,
  );
}
export function toggleTheme() {
  applyTheme(!darkMode.value);
  try {
    localStorage.setItem("wasel-theme", darkMode.value ? "dark" : "light");
  } catch {}
}
