const { test } = require("node:test");
const assert = require("node:assert/strict");
test("notification badge reads persist per account and refresh does not replay a pulse", async () => {
  const { createRenderer, reactive, nextTick } = await import("vue");
  const { useNotificationBadge } =
    await import("./src/composables/useNotificationBadge.js");
  const saved = new Map();
  global.localStorage = {
    getItem: (k) => saved.get(k) || null,
    setItem: (k, v) => saved.set(k, v),
  };
  const state = reactive({
    S: { user: { id: "M" }, notifications: [{ id: "N1" }] },
  });
  let badge;
  const renderer = createRenderer({
    createComment: () => ({}),
    createElement: () => ({}),
    insert() {},
    remove() {},
    setElementText() {},
    parentNode() {},
    nextSibling() {},
  });
  const app = renderer.createApp({
    setup() {
      badge = useNotificationBadge(state);
      return () => null;
    },
  });
  app.mount({});
  assert.equal(badge.unread.value, 1);
  assert.equal(badge.pulse.value, true);
  badge.markRead();
  assert.equal(badge.unread.value, 0);
  state.S = { user: { id: "M" }, notifications: [{ id: "N1" }] };
  await nextTick();
  assert.equal(badge.pulse.value, false);
  state.S.notifications = [{ id: "N2" }, { id: "N1" }];
  await nextTick();
  assert.equal(badge.unread.value, 1);
  assert.equal(badge.pulse.value, true);
  state.S = { user: { id: "C" }, notifications: [{ id: "N3" }] };
  await nextTick();
  assert.equal(badge.unread.value, 1);
  state.S = { user: { id: "M" }, notifications: [{ id: "N1" }] };
  await nextTick();
  assert.equal(badge.unread.value, 0);
  app.unmount();
});
test("order updates generate local notifications for both parties", async () => {
  const { createDemoApi } = await import("./src/services/demoApi.js");
  const api = createDemoApi({ getItem: () => null, setItem() {} });
  await api("/api/register", {
    role: "courier",
    name: "اختبار",
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
  const before = await api("/api/state");
  const order = before.orders.find((o) => o.status === "published");
  await api(`/api/orders/${order.id}/action`, { action: "reserve" });
  const courier = await api("/api/state");
  assert.ok(courier.notifications.some((n) => n.orderId === order.id));
  await api("/api/login", { role: "merchant" });
  const merchant = await api("/api/state");
  assert.ok(merchant.notifications.some((n) => n.orderId === order.id));
});
