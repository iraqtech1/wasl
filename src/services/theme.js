import { ref } from "vue";
export const darkMode = ref(false);
export function applyTheme(value) {
  darkMode.value = value;
  document.documentElement.dataset.theme = value ? "dark" : "light";
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", value ? "#0c1d29" : "#f6f9fa");
}
export function initTheme() {
  applyTheme(false);
}
export function toggleTheme() {
  applyTheme(!darkMode.value);
}
