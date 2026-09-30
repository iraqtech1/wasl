const { test } = require("node:test");
const assert = require("node:assert/strict");
async function setup() {
  const { createDemoApi, DEMO_STORAGE_KEY } =
    await import("./src/services/demoApi.js");
  const values = new Map();
  const storage = {
    getItem: (k) => values.get(k),
    setItem: (k, v) => values.set(k, v),
  };
  return {
    api: createDemoApi(storage),
    values,
    storage,
    key: DEMO_STORAGE_KEY,
    createDemoApi,
  };
}
test("both roles navigate populated frontend data without network calls", async () => {
  const { api } = await setup();
  for (const role of ["merchant", "courier"]) {
    await api("/api/login", { role });
    const s = await api("/api/state");
    assert.equal(s.user.role, role);
    assert.ok(s.orders.length > 10);
    assert.ok(s.balance > 0);
    assert.equal(s.profileLocked, true);
    assert.ok(s.orders.every((o) => o.demo));
  }
});
test("a draft is saved locally and appears for the courier after publication", async () => {
  const { api, createDemoApi, storage } = await setup();
  await api("/api/login", { role: "merchant" });
  const s = await api("/api/state");
  const draft = await api("/api/orders", {
    ...s.orders[0],
    recipient: { ...s.orders[0].recipient, name: "Vue local" },
    publish: false,
  });
  assert.equal(draft.status, "draft");
  await api(`/api/orders/${draft.id}/action`, { action: "publish" });
  await api("/api/login", { role: "courier" });
  const available = await api("/api/state");
  assert.ok(available.orders.some((o) => o.id === draft.id));
  await api("/api/register", {
    role: "courier",
    name: "اختبار حجز",
    phone: "07912345670",
    vehicle: "sedan",
    province: "بغداد",
  });
  await api("/api/login", { role: "courier", phone: "07912345670" });
  await api("/api/profile", {
    action: "readiness",
    available: true,
    budget: 500000,
    radius: 5,
    location: { lat: 33.3, lng: 44.43 },
  });
  await api(`/api/orders/${draft.id}/action`, { action: "reserve" });
  const loaded = createDemoApi(storage);
  await loaded("/api/login", { role: "courier" });
  assert.equal(
    (await loaded("/api/state")).orders.find((o) => o.id === draft.id).status,
    "reserved",
  );
});
test("registration and profile edits do not persist passwords or documents", async () => {
  const { api, values, key } = await setup();
  await api("/api/register", {
    role: "courier",
    name: "مندوب فحص",
    phone: "07712345678",
    password: "never-save-secret",
    confirmPassword: "never-save-secret",
    documents: { nationalFront: "private-image" },
    photos: ["private-photo"],
  });
  await api("/api/login", { role: "courier", phone: "07712345678" });
  await api("/api/profile", {
    action: "profile",
    name: "اسم محدث",
    address: "عنوان",
  });
  assert.equal((await api("/api/state")).user.pendingProfile.name, "اسم محدث");
  assert.equal((await api("/api/state")).user.name, "مندوب فحص");
  assert.ok(!values.get(key).includes("never-save-secret"));
  assert.ok(!values.get(key).includes("private-image"));
  assert.ok(!values.get(key).includes("private-photo"));
});
test("demo forms, messages, ratings and return state work without a server", async () => {
  const { api } = await setup();
  await api("/api/login", { role: "courier" });
  let s = await api("/api/state");
  const o = s.orders.find((o) => o.status === "received");
  for (const action of ["transit", "customer_arrive"])
    await api(`/api/orders/${o.id}/action`, { action });
  await api(`/api/orders/${o.id}/action`, {
    action: "chat",
    text: "رسالة اختبار",
  });
  await api(`/api/orders/${o.id}/action`, {
    action: "deliver",
    confirmed: true,
    proof: "إثبات تجريبي",
  });
  await api(`/api/orders/${o.id}/action`, {
    action: "settle_delivery",
    confirmed: true,
  });
  await api(`/api/orders/${o.id}/action`, {
    action: "rate",
    stars: 5,
    text: "تقييم",
  });
  s = await api("/api/state");
  assert.equal(s.orders.find((x) => x.id === o.id).settled, true);
  assert.equal(s.messages[0].text, "رسالة اختبار");
  assert.equal(s.ratings[0].stars, 5);
});
test("hash routes stay inside the Pages project and reject invalid role pages", async () => {
  const { parseRoute, routeHash } = await import("./src/services/routes.js");
  for (const role of ["merchant", "courier"])
    for (const page of [
      "home",
      "wallet",
      "account",
      "registry",
      "login",
      "register",
    ])
      assert.deepEqual(parseRoute(routeHash(role, page)), { role, page });
  assert.deepEqual(parseRoute("#/courier/new"), {
    role: "courier",
    page: "home",
  });
  assert.deepEqual(parseRoute("#/anything"), { role: null, page: "choose" });
});
test("unavailable browser storage never prevents preview login", async () => {
  const { createDemoApi } = await import("./src/services/demoApi.js");
  const api = createDemoApi({
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("quota");
    },
  });
  await api("/api/login", { role: "merchant" });
  assert.equal((await api("/api/state")).user.id, "MER-DEMO");
});
