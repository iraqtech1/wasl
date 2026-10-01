export function parseRoute(hash) {
  const [role, page] = (hash || "").replace(/^#\/?/, "").split("/");
  if (!["merchant", "courier"].includes(role))
    return { role: null, page: "choose" };
  const pages = [
    "login",
    "register",
    "home",
    "registry",
    "wallet",
    "account",
    ...(role === "merchant" ? ["new", "draft"] : ["available"]),
  ];
  return { role, page: pages.includes(page) ? page : "home" };
}
export function routeHash(role, page) {
  return role ? `#/${role}/${page}` : "#/choose";
}
