import { h } from "vue";
export default function VipBanner({ compact = false }) {
  return h("section", { class: "vip-experience" + (compact ? " is-compact" : ""), "aria-label": "طلب VIP بمندوب مخصص" }, [
    h("span", { class: "vip-emblem", "aria-hidden": "true" }, [
      h("svg", { viewBox: "0 0 32 32", fill: "none" }, [
        h("path", { d: "M5 10l6 5 5-10 5 10 6-5-3 14H8L5 10Zm4 18h14", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round" }),
      ]),
    ]),
    h("div", { class: "vip-copy" }, [
      h("strong", {}, "واصل VIP"),
      h("span", {}, compact ? "مندوب مخصص لشحنتك" : "شحنتك وحدها تستحق الاهتمام"),
      !compact ? h("p", {}, "حجز حصري • مندوب متفرغ • متابعة مراحل التوصيل") : null,
    ]),
    h("span", { class: "vip-exclusive" }, "حصري"),
  ]);
}
