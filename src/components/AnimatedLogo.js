import { defineComponent, h } from "vue";

export default defineComponent({
  name: "AnimatedLogo",
  setup: () => () =>
    h(
      "span",
      {
        class: "opening-logo",
        role: "img",
        "aria-label": "شعار واصل",
      },
      ["blue", "orange"].map((color) =>
        h("img", {
          class: `logo-half logo-half-${color}`,
          src: `assets/logo-${color}.svg`,
          width: 180,
          height: 95,
          alt: "",
          "aria-hidden": "true",
          decoding: "sync",
          fetchpriority: "high",
        }),
      ),
    ),
});
