import { defineComponent, computed, h } from "vue";
import QRCode from "qrcode";

export default defineComponent({
  props: { code: String, label: { type: String, default: "رمز الاستلام" } },
  setup(props) {
    const matrix = computed(() =>
      /^\d{6}$/.test(props.code || "")
        ? QRCode.create(props.code, { errorCorrectionLevel: "M" }).modules
        : null,
    );
    return () => {
      const qr = matrix.value;
      if (!qr) return null;
      let path = "";
      for (let y = 0; y < qr.size; y++)
        for (let x = 0; x < qr.size; x++) {
          if (qr.get(y, x)) path += `M${x + 4} ${y + 4}h1v1h-1z`;
        }
      return h(
        "svg",
        {
          class: "order-qr",
          viewBox: `0 0 ${qr.size + 8} ${qr.size + 8}`,
          role: "img",
          "aria-label": `${props.label} QR`,
          style:
            "display:block;width:200px;max-width:100%;height:auto;margin:12px auto;shape-rendering:crispEdges",
        },
        [
          h("rect", { width: "100%", height: "100%", fill: "#fff" }),
          h("path", { d: path, fill: "#003e57" }),
        ],
      );
    };
  },
});
