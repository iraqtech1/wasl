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
            const shape = (d, fill) => {
              const part = document.createElementNS("http://www.w3.org/2000/svg", "path");
              part.setAttribute("d", d);
              part.style.fill = fill;
              part.style.stroke = "none";
              svg.append(part);
            };
            const blue = "#00567a", orange = "#f47d2f";
            if (g.vehicle === "motorcycle") {
              shape("M11 18a4 4 0 1 0-8 0 4 4 0 0 0 8 0M30 18a4 4 0 1 0-8 0 4 4 0 0 0 8 0", blue);
              shape("M2 4h10v7H2zM5 12h8l3 5h4l2-7-3-6h5l4 10-3 1-3 5H12l-4-5H5z", orange);
              shape("M9 10h7v3H9zM18 2h6v3h-6z", blue);
              shape("M9 18a2 2 0 1 0-4 0 2 2 0 0 0 4 0M28 18a2 2 0 1 0-4 0 2 2 0 0 0 4 0", "#fff");
            } else if (g.vehicle === "truck" || g.vehicle === "refrigerated") {
              shape("M2 3h17v15H2zM19 8h7l5 7v4H19z", orange);
              shape("M21 10h4l3 4h-7z", "#fff");
              shape("M2 17h29v3H2zM11 19a4 4 0 1 0-8 0 4 4 0 0 0 8 0M29 19a4 4 0 1 0-8 0 4 4 0 0 0 8 0", blue);
              shape("M9 19a2 2 0 1 0-4 0 2 2 0 0 0 4 0M27 19a2 2 0 1 0-4 0 2 2 0 0 0 4 0", "#fff");
              if (g.vehicle === "refrigerated") {
                const snow = document.createElementNS("http://www.w3.org/2000/svg", "path");
                snow.setAttribute("d", "M10.5 6v8M7 8l7 4m-7 0 7-4");
                snow.style.stroke = "#fff";
                snow.style.strokeWidth = "1.8";
                svg.append(snow);
              }
            } else {
              shape("M5 16h6v7H5zM21 16h6v7h-6z", blue);
              shape("M8 3h16l3 8 3 3v6H2v-6l3-3z", orange);
              shape("M10 5h12l2 6H8zM5 14h5v3H5zM22 14h5v3h-5z", "#fff");
              shape("M12 16h8v2h-8z", blue);
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
