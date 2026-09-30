const { test } = require("node:test");
const assert = require("node:assert/strict");
async function setup() {
  const { createDemoApi, DEMO_STORAGE_KEY } =
    await import("./src/services/demoApi.js");
  const { createDemoData } = await import("./src/services/demoData.js");
  const data = createDemoData(),
    template = structuredClone(data.orders[0]);
  data.orders = [];
  data.notifications = [];
  const values = new Map([[DEMO_STORAGE_KEY, JSON.stringify(data)]]);
  const storage = {
    getItem: (k) => values.get(k),
    setItem: (k, v) => values.set(k, v),
  };
  const api = createDemoApi(storage);
  const login = (role) => api("/api/login", { role });
  const state = () => api("/api/state");
  const act = (o, action, p = {}) =>
    api(`/api/orders/${o.id}/action`, { action, ...p });
  await login("merchant");
  const create = (p) =>
    api("/api/orders", { ...template, publish: true, ...p });
  return {
    api,
    login,
    state,
    act,
    create,
    template,
    values,
    storage,
    key: DEMO_STORAGE_KEY,
    createDemoApi,
  };
}
test("privacy changes at reservation and pickup; budget and wallet remain separate", async () => {
  const t = await setup(),
    o = await t.create();
  await t.login("courier");
  let s = await t.state();
  let v = s.orders[0];
  assert.equal(v.sender.phone, undefined);
  assert.equal(v.recipient.phone, undefined);
  assert.equal(v.handoverCode, undefined);
  const budget = s.user.budget,
    balance = s.balance;
  await t.act(o, "reserve");
  v = (await t.state()).orders[0];
  assert.ok(v.sender.phone);
  assert.equal(v.recipient.phone, undefined);
  await t.act(o, "arrive");
  await assert.rejects(
    t.act(o, "pickup", { code: o.handoverCode, inspected: true }),
    /الفحص/,
  );
  await t.act(o, "pickup", {
    code: o.handoverCode,
    inspected: true,
    paid: true,
  });
  s = await t.state();
  assert.equal(s.user.budget, budget - o.amount);
  assert.equal(s.balance, balance);
  assert.ok(s.orders[0].recipient.phone);
  await assert.rejects(
    t.act(o, "pickup", { code: o.handoverCode, inspected: true, paid: true }),
  );
  assert.equal((await t.state()).user.budget, budget - o.amount);
});
test("partial delivery refunds remaining goods, collects fees once, then closes", async () => {
  const t = await setup(),
    o = await t.create({ amount: 100000, count: 2, returnFee: 3000 });
  await t.login("courier");
  const initial = (await t.state()).user.budget;
  for (const a of ["reserve", "arrive"]) await t.act(o, a);
  await t.act(o, "pickup", {
    code: o.handoverCode,
    inspected: true,
    paid: true,
  });
  for (const a of ["transit", "customer_arrive"]) await t.act(o, a);
  await t.act(o, "partial_propose", { count: 1, amount: 60000 });
  await assert.rejects(t.act(o, "partial_confirm", { confirmed: true }));
  await t.login("merchant");
  await t.act(o, "partial_approve");
  await t.login("courier");
  await t.act(o, "partial_confirm", { confirmed: true });
  for (const a of ["return_start", "return_arrive"]) await t.act(o, a);
  await assert.rejects(
    t.act(o, "settle_return", { confirmed: true, fees: 3000 }),
  );
  await t.login("merchant");
  await t.act(o, "receive_return", { inspected: true });
  await t.login("courier");
  const before = (await t.state()).user.budget;
  await assert.rejects(
    t.act(o, "settle_return", { confirmed: true, fees: 8000 }),
  );
  assert.equal((await t.state()).user.budget, before);
  await t.act(o, "settle_return", { confirmed: true, fees: 3000 });
  assert.equal((await t.state()).user.budget, initial + 8000);
  await t.act(o, "complete");
  assert.equal((await t.state()).orders[0].status, "completed");
});
test("batch pickup is atomic, consumes one code, and leaves excluded orders unchanged", async () => {
  const t = await setup();
  const a = await t.create(),
    b = await t.create(),
    c = await t.create();
  await t.login("courier");
  const initial = (await t.state()).user.budget;
  for (const o of [a, b, c]) {
    await t.act(o, "reserve");
    await t.act(o, "arrive");
  }
  await t.login("merchant");
  const batch = await t.api("/api/batch", {
    action: "create",
    ids: [a.id, b.id],
  });
  await t.login("courier");
  assert.equal((await t.state()).batches[0].code, undefined);
  await assert.rejects(
    t.api("/api/batch", { code: batch.code, paid: true, inspected: false }),
  );
  assert.equal((await t.state()).user.budget, initial);
  await t.api("/api/batch", { code: batch.code, paid: true, inspected: true });
  let s = await t.state();
  assert.equal(s.user.budget, initial - a.amount - b.amount);
  assert.equal(s.orders.find((o) => o.id === c.id).status, "arrived");
  await assert.rejects(
    t.api("/api/batch", { code: batch.code, paid: true, inspected: true }),
  );
});
test("edits require courier acceptance and declining never counts as cancellation", async () => {
  const t = await setup(),
    o = await t.create();
  await t.login("courier");
  await t.act(o, "reserve");
  await t.login("merchant");
  await t.act(o, "edit", { amount: 30000 });
  await t.login("courier");
  await assert.rejects(t.act(o, "arrive"), /التعديل/);
  await t.act(o, "decline_edit");
  const s = await t.state();
  assert.equal(s.user.cancellations.length, 0);
  assert.equal(s.orders[0].status, "published");
  assert.equal(s.orders[0].amount, 30000);
});
test("VIP excludes simultaneous jobs; normal reservations group only one pickup site", async () => {
  const t = await setup();
  const vip = await t.create({ service: "vip", fee: 8000 }),
    normal = await t.create();
  await t.login("courier");
  await t.act(vip, "reserve");
  await assert.rejects(t.act(normal, "reserve"), /VIP/);
  await t.act(vip, "release", { reason: "اختبار" });
  await t.act(normal, "reserve");
  await assert.rejects(t.act(vip, "reserve"), /VIP/);
});
test("filtering enforces distance, cash, vehicle and availability", async () => {
  const t = await setup();
  await t.create();
  await t.login("courier");
  for (const p of [
    { budget: 0, available: true, location: { lat: 33.3, lng: 44.43 } },
    { budget: 500000, available: false, location: { lat: 33.3, lng: 44.43 } },
    { budget: 500000, available: true, location: { lat: 30, lng: 47 } },
  ]) {
    await t.api("/api/profile", { action: "readiness", radius: 5, ...p });
    assert.equal((await t.state()).orders.length, 0);
  }
});
test("one bounded extension requires merchant approval, arriving stops deadline", async () => {
  const t = await setup(),
    o = await t.create();
  await t.login("courier");
  await t.act(o, "reserve");
  await assert.rejects(t.act(o, "extend", { minutes: 100, reason: "ازدحام" }));
  await t.act(o, "extend", { minutes: 1, reason: "ازدحام" });
  await t.login("merchant");
  await t.act(o, "approve_extension");
  await t.login("courier");
  await assert.rejects(t.act(o, "extend", { minutes: 1, reason: "ازدحام" }));
  await t.act(o, "arrive");
  assert.equal((await t.state()).orders[0].deadline, null);
});
test("expired extension republishes without cancellation penalty", async () => {
  const t = await setup(),
    o = await t.create();
  await t.login("courier");
  await t.act(o, "reserve");
  await t.act(o, "extend", { minutes: 1, reason: "ازدحام" });
  const saved = JSON.parse(t.values.get(t.key));
  saved.orders[0].extensionRequest.expires = "2020-01-01T00:00:00Z";
  t.values.set(t.key, JSON.stringify(saved));
  const api = t.createDemoApi(t.storage);
  await api("/api/login", { role: "courier" });
  const s = await api("/api/state");
  assert.equal(s.orders[0].status, "published");
  assert.equal(s.user.cancellations.length, 0);
});
test("profile edits remain pending until reviewed, stable account number, unresolved orders lock edits", async () => {
  const t = await setup();
  await t.api("/api/profile", { action: "profile", name: "اسم جديد" });
  assert.notEqual((await t.state()).user.name, "اسم جديد");
  await t.api("/api/local-admin", {
    action: "approve-profile",
    id: "MER-DEMO",
  });
  assert.equal((await t.state()).user.name, "اسم جديد");
  assert.equal((await t.state()).user.id, "MER-DEMO");
  await t.create();
  await assert.rejects(
    t.api("/api/profile", { action: "profile", name: "آخر" }),
  );
});
test("supported networks, per-role identity, optional customer save and address edits", async () => {
  const t = await setup();
  await assert.rejects(
    t.api("/api/register", {
      role: "merchant",
      name: "A",
      phone: "07512345678",
    }),
  );
  for (const role of ["merchant", "courier"])
    await t.api("/api/register", { role, name: "A", phone: "07912345678" });
  await t.api("/api/addresses", {
    name: "مخزن",
    area: "الكرادة",
    address: "A",
    location: { lat: 33.3, lng: 44.43 },
  });
  let s = await t.state();
  const a = s.user.addresses[0];
  await t.api("/api/addresses", {
    ...a,
    address: "B",
    location: { lat: 33.301, lng: 44.431 },
  });
  assert.equal((await t.state()).user.addresses[0].address, "B");
  const n = s.user.customers.length;
  await t.create({ saveCustomer: false });
  assert.equal((await t.state()).user.customers.length, n);
  await t.create({ saveCustomer: true });
  assert.equal((await t.state()).user.customers.length, n + 1);
});
test("free delivery prevents goods collection and retry count is unlimited", async () => {
  const t = await setup();
  await assert.rejects(
    t.create({ kind: "free", amount: 50000, collection: "collect" }),
  );
  const o = await t.create({
    kind: "free",
    amount: 0,
    collection: "none",
    attempts: 99,
  });
  await t.login("courier");
  for (const a of ["reserve", "arrive"]) await t.act(o, a);
  await t.act(o, "pickup", {
    code: o.handoverCode,
    inspected: true,
    paid: true,
  });
  for (const a of ["transit", "customer_arrive"]) await t.act(o, a);
  for (let i = 0; i < 5; i++) {
    await t.act(o, "fail", { reason: "عدم الرد" });
    await t.act(o, "retry", {
      when: new Date(Date.now() + 3600000).toISOString(),
    });
    await t.login("merchant");
    await t.act(o, "approve_retry");
    await t.login("courier");
    await t.act(o, "customer_arrive");
  }
  assert.equal((await t.state()).user.failures.length, 5);
  assert.equal((await t.state()).user.restrictedUntil, undefined);
});
test("support includes history, admin reply notifies, outlet topup stays separate from cash budget", async () => {
  const t = await setup(),
    o = await t.create();
  await t.api("/api/support", {
    category: "تسوية",
    text: "فحص التذكرة",
    orderId: o.id,
  });
  const ticket = (await t.state()).tickets[0];
  assert.ok(ticket.history.length);
  await t.api("/api/local-admin", {
    action: "reply",
    id: ticket.id,
    text: "تمت المعالجة",
    close: true,
  });
  assert.equal((await t.state()).tickets[0].status, "closed");
  await t.login("courier");
  const s = await t.state();
  await t.api("/api/local-admin", {
    action: "topup",
    outlet: "OUT-DEMO",
    account: s.user.walletId,
    amount: 1000,
  });
  const after = await t.state();
  assert.equal(after.balance, s.balance + 1000);
  assert.equal(after.user.budget, s.user.budget);
});
test("tracking links exclude recipient, merchant, phone, address and financial data", async () => {
  const { trackingLink, readTracking } =
    await import("./src/services/tracking.js");
  const t = await setup(),
    o = await t.create();
  const link = trackingLink(o, "https://example.test/wasl/");
  const data = readTracking(link);
  assert.equal(data.id, o.id);
  assert.equal(data.amount, undefined);
  assert.equal(data.recipient, undefined);
  assert.equal(data.sender, undefined);
  assert.equal(readTracking("#/track/broken"), null);
});
test("unexecuted partial proposal must not reduce full-return refund", async () => {
  const t = await setup(),
    o = await t.create({ amount: 100000, count: 2, returnFee: 3000 });
  await t.login("courier");
  const initial = (await t.state()).user.budget;
  for (const a of ["reserve", "arrive"]) await t.act(o, a);
  await t.act(o, "pickup", {
    code: o.handoverCode,
    inspected: true,
    paid: true,
  });
  for (const a of ["transit", "customer_arrive"]) await t.act(o, a);
  await t.act(o, "partial_propose", { count: 1, amount: 60000 });
  await t.act(o, "fail", { reason: "رفض الزبون" });
  for (const a of ["return", "return_start", "return_arrive"])
    await t.act(o, a);
  await t.login("merchant");
  await t.act(o, "receive_return", { inspected: true });
  await t.login("courier");
  await t.act(o, "settle_return", { confirmed: true, fees: 8000 });
  assert.equal((await t.state()).user.budget, initial + 8000);
});
test("separate local tabs observe latest state without overwriting other role actions", async () => {
  const t = await setup(),
    o = await t.create();
  const courier = t.createDemoApi(t.storage);
  await courier("/api/login", { role: "courier" });
  await courier(`/api/orders/${o.id}/action`, { action: "reserve" });
  assert.equal((await t.state()).orders[0].status, "reserved");
  await t.act(o, "edit", { amount: 40000 });
  assert.equal((await courier("/api/state")).orders[0].amount, 40000);
});
test("offline hides available orders but keeps assigned records and draft creation", async () => {
  const t = await setup(),
    o = await t.create(),
    other = await t.create();
  await t.login("courier");
  await t.act(o, "reserve");
  const previous = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { onLine: false },
  });
  try {
    let s = await t.state();
    assert.equal(
      s.orders.some((x) => x.id === other.id),
      false,
    );
    assert.equal(
      s.orders.some((x) => x.id === o.id),
      true,
    );
    await assert.rejects(t.act(o, "arrive"), /اتصال/);
    await t.login("merchant");
    await assert.rejects(t.create(), /انقطاع/);
    const draft = await t.create({ publish: false });
    assert.equal(draft.status, "draft");
  } finally {
    if (previous) Object.defineProperty(globalThis, "navigator", previous);
    else delete globalThis.navigator;
  }
});
test("commission and monthly subscription are configurable, delayed and not duplicated", async () => {
  const t = await setup(),
    o = await t.create();
  await t.api("/api/local-admin", {
    action: "settings",
    values: {
      commission: 10,
      commissionMode: "percent",
      subscription: 2000,
      feesStartAt: "2020-01-01",
    },
  });
  const initial = (await t.state()).balance;
  await t.login("courier");
  for (const a of ["reserve", "arrive"]) await t.act(o, a);
  await t.act(o, "pickup", {
    code: o.handoverCode,
    inspected: true,
    paid: true,
  });
  for (const a of ["transit", "customer_arrive"]) await t.act(o, a);
  await t.act(o, "deliver", { confirmed: true, proof: "تم الاستلام تجريبياً" });
  await t.act(o, "settle_delivery", { confirmed: true });
  await assert.rejects(t.act(o, "settle_delivery", { confirmed: true }));
  await t.login("merchant");
  assert.equal((await t.state()).balance, initial - 500);
  await t.api("/api/local-admin", { action: "subscription" });
  await t.api("/api/local-admin", { action: "subscription" });
  assert.equal((await t.state()).balance, initial - 2500);
});
