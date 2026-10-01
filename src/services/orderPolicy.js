export const BEFORE = [
  "draft",
  "published",
  "reserved",
  "approaching",
  "arrived",
  "waiting",
];
export const CLOSED = ["cancelled", "completed"];
export const supportedPhone = (value) =>
  /^07[789][0-9]{8}$/.test(String(value || ""));
export const distance = (a, b) => {
  if (!a || !b) return Infinity;
  const rad = (x) => (x * Math.PI) / 180,
    dlat = rad(b.lat - a.lat),
    dlng = rad(b.lng - a.lng);
  return (
    6371 *
    2 *
    Math.asin(
      Math.min(
        1,
        Math.sqrt(
          Math.sin(dlat / 2) ** 2 +
            Math.cos(rad(a.lat)) *
              Math.cos(rad(b.lat)) *
              Math.sin(dlng / 2) ** 2,
        ),
      ),
    )
  );
};
export const unresolved = (o) =>
  !CLOSED.includes(o.status) &&
  !(o.settled && ["delivered", "returned"].includes(o.status));
export const orderVehicles = (o) => Array.isArray(o.vehicles) ? [...new Set(o.vehicles)] : [o.vehicle];
export const vehicleFits = (v, o, s) =>
  (o.nature !== "cold" || v === "refrigerated") &&
  Number(o.weight) <= (s.vehicleKg[v] || 0) &&
  Math.max(o.length, o.width, o.height) <= (s.vehicleCm[v] || 0);
export function eligible(u, o, s) {
  return (
    u.available &&
    orderVehicles(o).includes(u.vehicle) && vehicleFits(u.vehicle, o, s) &&
    Number(u.budget) >= (o.kind === "free" ? 0 : o.amount) &&
    o.weight <= (s.vehicleKg[u.vehicle] || 0) &&
    Math.max(o.length, o.width, o.height) <= (s.vehicleCm[u.vehicle] || 0) &&
    distance(u.location, o.sender.location) <= u.radius
  );
}
export function recommendVehicle(d, s) {
  if (d.nature === "cold") return "refrigerated";
  return (
    ["motorcycle", "sedan", "truck"].find(
      (v) =>
        Number(d.weight) <= s.vehicleKg[v] &&
        Math.max(d.length, d.width, d.height) <= s.vehicleCm[v],
    ) || "truck"
  );
}
export const areas = {
  بغداد: [
    "الكرادة",
    "الأعظمية",
    "الجادرية",
    "الدورة",
    "المنصور",
    "زيونة",
    "بغداد الجديدة",
    "الشعب",
    "الكاظمية",
  ],
  البصرة: ["العشار", "المعقل", "الزبير", "أبي الخصيب"],
  نينوى: ["الموصل", "الزهور", "الدواسة"],
  أربيل: ["عينكاوة", "المنارة", "الإسكان"],
  النجف: ["المشراق", "الحنانة", "الكوفة"],
  كربلاء: ["العباسية", "الحسين", "الحر"],
};
export const areaLocations = {
  الكرادة: { lat: 33.3, lng: 44.43 },
  الأعظمية: { lat: 33.37, lng: 44.36 },
  الجادرية: { lat: 33.28, lng: 44.39 },
  الدورة: { lat: 33.24, lng: 44.39 },
  المنصور: { lat: 33.32, lng: 44.34 },
  زيونة: { lat: 33.33, lng: 44.47 },
};
export function nearestArea(location) {
  const result = Object.entries(areaLocations).sort(
    (a, b) => distance(location, a[1]) - distance(location, b[1]),
  )[0];
  return result && distance(location, result[1]) < 3 ? result[0] : "";
}
