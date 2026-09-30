import { defineComponent, h, ref, onMounted, onBeforeUnmount } from "vue";
export default defineComponent({
  props: { groups: Array },
  setup(props) {
    const host = ref(),
      failed = ref(false);
    let map,
      observer,
      disposed = false;
    onMounted(async () => {
      try {
        const L = await import("leaflet");
        if (disposed) return;
        map = L.map(host.value, {
          scrollWheelZoom: true,
          touchZoom: true,
          dragging: true,
          doubleClickZoom: true,
        }).setView([33.3, 44.43], 12);
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        })
          .on("tileerror", () => (failed.value = true))
          .addTo(map);
        const points = [];
        for (const g of props.groups.filter((g) => g.location)) {
          const point = [g.location.lat, g.location.lng];
          points.push(point);
          const label = document.createElement("div");
          label.textContent =
            g.name + " · " + g.count + (g.vip ? " · VIP" : "");
          const marker = L.circleMarker(point, {
            radius: g.vip ? 19 : 15,
            color: g.vip ? "#f47d2f" : "#00567a",
            fillColor: g.vip ? "#f47d2f" : "#00567a",
            fillOpacity: 0.88,
            weight: 3,
          }).addTo(map);
          marker.bindTooltip(label, { permanent: true, direction: "top" });
          marker.on("click", () =>
            document
              .getElementById("map-group-" + g.id)
              ?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
          );
        }
        if (points.length)
          map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
        observer = new ResizeObserver(() => map?.invalidateSize());
        observer.observe(host.value);
      } catch {
        failed.value = true;
      }
    });
    onBeforeUnmount(() => {
      disposed = true;
      observer?.disconnect();
      map?.remove();
    });
    return () =>
      h("div", {}, [
        h("div", {
          ref: host,
          class: "geographic-map",
          style:
            "height:280px;border-radius:18px;overflow:hidden;isolation:isolate",
          role: "region",
          "aria-label": "خريطة مواقع الطلبات",
        }),
        failed.value
          ? h(
              "p",
              { class: "file-help" },
              "تعذر تحميل بعض تفاصيل الخريطة. تبقى قائمة المواقع والاتجاهات متاحة.",
            )
          : null,
      ]);
  },
});
