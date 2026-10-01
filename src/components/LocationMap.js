import {
  defineComponent,
  h,
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
} from "vue";
export default defineComponent({
  props: { groups: Array, movableLocation: Object },
  emits: ["location-change", "courier-select"],
  setup(props, { emit }) {
    const host = ref(),
      failed = ref(false);
    let map,
      observer,
      locationMarker,
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
          if (g.vehicle) {
            label.className = "courier-map-label";
            label.dir = "rtl";
            const svg = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "svg",
            );
            svg.setAttribute("viewBox", "0 0 32 24");
            svg.setAttribute("aria-hidden", "true");
            const path = document.createElementNS(
              "http://www.w3.org/2000/svg",
              "path",
            );
            const wheels =
              "M10 18a3 3 0 1 0-6 0 3 3 0 0 0 6 0M28 18a3 3 0 1 0-6 0 3 3 0 0 0 6 0";
            path.setAttribute(
              "d",
              g.vehicle === "motorcycle"
                ? wheels + "M3 13h7l3 5h6l3-7-2-7h-4M20 4h4M8 10h7M14 10l-2 5M22 11h4l3 3M3 9V4h7v5Z"
                : g.vehicle === "refrigerated" || g.vehicle === "truck"
                  ? wheels + "M3 15V4h15v14h-8M18 8h7l5 6v4h-2M18 18h4M22 8v6h8M3 11h15"
                  : "M7 10l2-6h14l2 6M6 10h20l2 4v5H4v-5Zm1 9v2h4v-2m10 0v2h4v-2M8 14h3m10 0h3M13 16h6M3 9h3m20 0h3",
            );
            svg.append(path);
            if (g.vehicle === "refrigerated") {
              const cooling = document.createElementNS("http://www.w3.org/2000/svg", "path");
              path.setAttribute("d", path.getAttribute("d").replace("M3 11h15", ""));
              cooling.setAttribute("d", "M10.5 6v9M6.6 8.3l7.8 4.4m-7.8 0 7.8-4.4M9 6.5l1.5 1.5L12 6.5M9 14.5l1.5-1.5 1.5 1.5");
              cooling.setAttribute("stroke-width", "1.3");
              svg.append(cooling);
            }
            label.append(svg);
            label.title = g.name + " — " + g.vehicleLabel;
          } else {
            label.textContent =
              g.name + " · " + g.count + (g.vip ? " · VIP" : "");
          }
          if (g.vehicle) {
            const marker = L.marker(point, {
              title: g.name + " — " + g.vehicleLabel,
              alt: "تفاصيل المندوب " + g.name,
              keyboard: true,
              icon: L.divIcon({
                className: "courier-vehicle-marker",
                html: label,
                iconSize: [52, 52],
                iconAnchor: [26, 26],
              }),
            }).addTo(map);
            marker.on("click", () => emit("courier-select", g.id));
          } else {
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
        }
        if (props.movableLocation) {
          const point = [props.movableLocation.lat, props.movableLocation.lng];
          points.push(point);
          locationMarker = L.marker(point, {
            draggable: true,
            autoPan: true,
            zIndexOffset: 1000,
            title: "موقع البحث — اسحب لتغييره",
            alt: "موقع البحث القابل للتحريك",
            icon: L.divIcon({
              className: "search-location-marker",
              html: '<span aria-hidden="true"></span>',
              iconSize: [44, 44],
              iconAnchor: [22, 22],
            }),
          }).addTo(map);
          locationMarker.bindTooltip("موقعك — اسحب العلامة", {
            direction: "bottom",
            offset: [0, 20],
          });
          const choose = (latlng) => {
            locationMarker.setLatLng(latlng);
            emit("location-change", { lat: latlng.lat, lng: latlng.lng });
          };
          locationMarker.on("dragend", () =>
            choose(locationMarker.getLatLng()),
          );
          map.on("click", (event) => choose(event.latlng));
        }
        if (points.length)
          map.fitBounds(points, {
            padding: [40, 40],
            maxZoom: 15,
          });
        observer = new ResizeObserver(() => map?.invalidateSize());
        observer.observe(host.value);
      } catch {
        failed.value = true;
      }
    });
    watch(
      () => props.movableLocation,
      (point) => {
        if (point && locationMarker) {
          locationMarker.setLatLng([point.lat, point.lng]);
          map?.panTo([point.lat, point.lng]);
        }
      },
    );
    onBeforeUnmount(() => {
      disposed = true;
      observer?.disconnect();
      map?.remove();
    });
    return () =>
      h("div", {}, [
        h("div", {
          ref: host,
          class: [
            "geographic-map",
            { "has-couriers": props.groups.some((g) => g.vehicle) },
          ],
          style: `height:${props.groups.some((g) => g.vehicle) ? 380 : 280}px;border-radius:18px;overflow:hidden;isolation:isolate`,
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
