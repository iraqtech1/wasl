import { defineComponent, h } from "vue";

// Filter the two original ink colors so the settled silhouette stays unchanged.
export default defineComponent({
  name: "AnimatedLogo",
  setup() {
    const filter = (id, alpha) =>
      h(
        "filter",
        {
          id,
          "color-interpolation-filters": "sRGB",
        },
        [
          h("feColorMatrix", {
            type: "matrix",
            values: `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  ${alpha}`,
          }),
        ],
      );
    const half = (color) =>
      h("g", { class: `logo-half logo-half-${color}` }, [
        h(
          "svg",
          {
            viewBox: "450 220 855 445",
            width: 855,
            height: 445,
            overflow: "hidden",
          },
          [
            h("image", {
              href: "assets/wasel-brand.jpeg",
              width: 1800,
              height: 1800,
              filter: `url(#opening-${color})`,
            }),
          ],
        ),
      ]);
    return () =>
      h(
        "svg",
        {
          class: "opening-logo",
          viewBox: "0 0 855 445",
          role: "img",
          "aria-label": "شعار واصل",
        },
        [
          h("defs", [
            filter("opening-orange", "5 0 -5 0 -0.3"),
            filter("opening-blue", "-5 0 5 0 -0.3"),
          ]),
          half("blue"),
          half("orange"),
        ],
      );
  },
});
