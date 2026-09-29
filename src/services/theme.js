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
  applyTheme(false);
}
export function toggleTheme() {
  applyTheme(!darkMode.value);
}
