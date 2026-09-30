export function trackingLink(
  order,
  base = globalThis.location?.href || "https://iraqtech1.github.io/wasl/",
) {
  const safe = {
    id: order.id,
    status: order.status,
    at: new Date().toISOString(),
    events:
      order.history?.map((h) => ({ at: h.at, status: h.status })).slice(-20) ||
      [],
  };
  const encoded = btoa(
    Array.from(new TextEncoder().encode(JSON.stringify(safe)), (b) =>
      String.fromCharCode(b),
    ).join(""),
  )
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
  return base.split("#")[0] + "#/track/" + encoded;
}
export function readTracking(hash) {
  try {
    const encoded = hash.split("/track/")[1];
    if (!encoded || encoded.length > 20000) return null;
    const data = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(
          atob(encoded.replaceAll("-", "+").replaceAll("_", "/")),
          (c) => c.charCodeAt(0),
        ),
      ),
    );
    return typeof data.id === "string" &&
      typeof data.status === "string" &&
      Array.isArray(data.events)
      ? data
      : null;
  } catch {
    return null;
  }
}
