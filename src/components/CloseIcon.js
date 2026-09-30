import { h } from "vue";
// Shared by every dismiss button, including the camera and account dialogs.
export default function CloseIcon() {
  return h(
    "svg",
    { class: "dialog-close-mark", viewBox: "0 0 24 24", "aria-hidden": "true" },
    [h("path", { d: "m5 5 14 14M19 5 5 19" })],
  );
}
