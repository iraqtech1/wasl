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
  await t.act(o, "return_start");
  await t.login("merchant");
  const returnCode = (await t.state()).orders.find(
    (x) => x.id === o.id,
  ).returnCode;
  await t.login("courier");
  await t.act(o, "return_arrive", { code: returnCode });
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
  assert.equal(s.orders.find((o) => o.id === c.id).status, "waiting");
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
test("VIP excludes simultaneous jobs in both reservation directions", async () => {
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
test("multiple merchants share budget and weight limits; exclusions preserve other orders", async () => {
  const t = await setup();
  const first = await t.create({ amount: 20000, weight: 40 });
  await t.api("/api/register", { role: "merchant", name: "تاجر ثان", phone: "07912345670", province: "بغداد", area: "الكرادة", address: "مخزن ثان", location: { lat: 33.301, lng: 44.43 } });
  await t.api("/api/login", { role: "merchant", phone: "07912345670" });
  const second = await t.create({ amount: 25000, weight: 40, sender: { ...t.template.sender, address: "مخزن ثان", location: { lat: 33.301, lng: 44.43 } } });
  const cashHeavy = await t.create({ amount: 10000, weight: 1 });
  const tooHeavy = await t.create({ amount: 1000, weight: 30 });
  await t.login("courier");
  await t.api("/api/profile", { action: "readiness", available: true, budget: 50000, radius: 5, location: { lat: 33.3, lng: 44.43 } });
  await t.act(first, "reserve"); await t.act(second, "reserve");
  await assert.rejects(t.act(cashHeavy, "reserve"), /الميزانية/);
  await assert.rejects(t.act(tooHeavy, "reserve"), /أوزان/);
  await assert.rejects(t.act(second, "arrive", { location: { lat: 34, lng: 45 }, reason: "وصلت" }));
  await assert.rejects(t.act(second, "arrive", { location: second.sender.location, accuracy: 1000 }));
  await t.act(second, "arrive", { location: second.sender.location, accuracy: 20 });
  await t.act(second, "exclude_pickup", { reason: "الكرتون مكسور" });
  const after = await t.state();
  assert.equal(after.user.budget, 50000);
  assert.equal(after.user.cancellations.length, 0);
  assert.equal(after.orders.find((o) => o.id === first.id).status, "reserved");
  await t.act(cashHeavy, "reserve");
  await t.api("/api/login", { role: "merchant", phone: "07700000001" });
  await assert.rejects(t.act(second, "resolve_exclusion", { resolution: "published" }));
  await t.api("/api/login", { role: "merchant", phone: "07912345670" });
  const excluded = (await t.state()).orders.find((o) => o.id === second.id);
  assert.equal(excluded.status, "draft"); assert.equal(excluded.courier, null);
  await t.act(second, "resolve_exclusion", { resolution: "published" });
  assert.equal((await t.state()).orders.find((o) => o.id === second.id).status, "published");
});

test("offers wait for configured delay, recheck capacity and cannot be reused after republishing", async () => {
  const t = await setup();
  const order = await t.create();
  await t.login("courier");
  await assert.rejects(t.act(order, "offer", { fee: 6000 }));
  const saved = JSON.parse(t.values.get(t.key)); saved.config.offerAfterMinutes = 0;
  t.values.set(t.key, JSON.stringify(saved));
  await assert.rejects(t.act(order, "offer", { fee: 1000 }));
  await t.act(order, "offer", { fee: 6000 });
  const offer = (await t.state()).offers[0];
  await t.api("/api/profile", { action: "readiness", available: true, budget: 0, radius: 5, location: { lat: 33.3, lng: 44.43 } });
  await t.login("merchant");
  await assert.rejects(t.act(order, "accept_offer", { offer: offer.id }));
  assert.equal((await t.state()).orders[0].fee, order.fee);
  await t.login("courier");
  await t.api("/api/profile", { action: "readiness", available: true, budget: 500000, radius: 5, location: { lat: 33.3, lng: 44.43 } });
  await t.login("merchant");
  await t.act(order, "accept_offer", { offer: offer.id });
  const reserved = (await t.state()).orders[0];
  assert.equal(reserved.fee, 6000); assert.equal(reserved.courier, "COU-DEMO");
  assert.ok(reserved.deadline);
  await assert.rejects(t.act(order, "accept_offer", { offer: offer.id }));
  await t.login("courier"); await t.act(order, "release", { reason: "اختبار" });
  await t.login("merchant");
  await assert.rejects(t.act(order, "accept_offer", { offer: offer.id }));
  assert.equal((await t.state()).offers.length, 0);
});

test("customer deferral preserves custody and money and needs merchant approval", async () => {
  const t = await setup(), o = await t.create();
  await t.login("courier");
  await t.act(o, "reserve"); await t.act(o, "arrive");
  const code = (await t.api("/api/login", { role: "merchant" }), (await t.state()).orders[0].handoverCode);
  await t.login("courier");
  await t.act(o, "pickup", { code, inspected: true, paid: true });
  const before = await t.state();
  await assert.rejects(t.act(o, "defer", { reason: "طلب الزبون", when: "2020-01-01" }));
  await t.act(o, "defer", { reason: "طلب التسليم غداً", when: new Date(Date.now() + 86400000).toISOString() });
  const after = await t.state();
  assert.equal(after.orders[0].status, "retry");
  assert.equal(after.orders[0].courier, before.user.id);
  assert.equal(after.user.budget, before.user.budget);
  assert.deepEqual(after.user.failures, before.user.failures);
  await assert.rejects(t.act(o, "customer_arrive"));
  await t.login("merchant"); await t.act(o, "approve_retry");
  await t.login("courier"); await t.act(o, "customer_arrive");
  assert.equal((await t.state()).orders[0].status, "at_customer");
});

test("return-value entry computes delivered goods without settling before approval", async () => {
  const t = await setup(), o = await t.create({ amount: 20000, count: 2 });
  await t.login("courier"); await t.act(o, "reserve"); await t.act(o, "arrive");
  await t.login("merchant"); const code = (await t.state()).orders[0].handoverCode;
  await t.login("courier"); await t.act(o, "pickup", { code, inspected: true, paid: true });
  await t.act(o, "transit"); await t.act(o, "customer_arrive");
  const before = (await t.state()).user.budget;
  await assert.rejects(t.act(o, "partial_propose", { returnAmount: 20000, returnCount: 1 }));
  await t.act(o, "partial_propose", { returnAmount: 8000, returnCount: 1 });
  const proposed = await t.state();
  assert.equal(proposed.orders[0].partial.amount, 12000);
  assert.equal(proposed.orders[0].partial.count, 1);
  assert.equal(proposed.user.budget, before);
  await assert.rejects(t.act(o, "partial_confirm", { confirmed: true }));
  await t.login("merchant"); await t.act(o, "partial_approve");
  await t.login("courier"); await t.act(o, "partial_confirm", { confirmed: true });
  const after = await t.state();
  assert.equal(after.orders[0].status, "partial_pending");
  assert.equal(after.orders[0].amount - after.orders[0].partial.amount, 8000);
  assert.equal(after.user.budget, before + 12000 + o.fee);
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
test("bounded direct extensions need no merchant approval, arriving stops deadline", async () => {
  const t = await setup(),
    o = await t.create();
  await t.login("courier");
  await t.act(o, "reserve");
  await assert.rejects(t.act(o, "extend", { minutes: 100, reason: "ازدحام" }));
  await t.act(o, "extend", { minutes: 1, reason: "ازدحام" });
  await t.act(o, "extend", { minutes: 1 });
  await assert.rejects(t.act(o, "extend", { minutes: 1 }));
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
  saved.orders[0].deadline = "2020-01-01T00:00:00Z";
  t.values.set(t.key, JSON.stringify(saved));
  const api = t.createDemoApi(t.storage);
  await api("/api/login", { role: "courier" });
  const s = await api("/api/state");
  assert.equal(s.orders[0].status, "published");
  assert.equal(s.user.cancellations.length, 0);
});

test("seven-minute reservation warns once and allows only four extra minutes in total", async () => {
  const t = await setup(), order = await t.create();
  await t.login("courier");
  await t.act(order, "reserve");
  const saved = JSON.parse(t.values.get(t.key));
  saved.orders[0].originalMinutes = 7;
  saved.orders[0].deadline = new Date(Date.now() + 110000).toISOString();
  t.values.set(t.key, JSON.stringify(saved));
  const api = t.createDemoApi(t.storage);
  await api("/api/login", { role: "courier" });
  const before = await api("/api/state");
  const deadline = Date.parse(before.orders[0].deadline);
  await api("/api/state");
  const notices = (await api("/api/state")).notifications.filter((n) => n.text.includes("باقي دقيقتين"));
  assert.equal(notices.length, 1);
  const extend = (minutes) => api(`/api/orders/${order.id}/action`, { action: "extend", minutes });
  await assert.rejects(extend(5));
  await assert.rejects(extend(1.5));
  await extend(2);
  await extend(2);
  await assert.rejects(extend(1));
  const after = (await api("/api/state")).orders[0];
  assert.equal(Date.parse(after.deadline), deadline + 240000);
  assert.equal(after.extensionMinutes, 4);
  assert.equal(after.extensionRequest, null);
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
test("supported networks, per-role identity, automatic customer save and address edits", async () => {
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
  const recipient = { ...t.template.recipient, name: "مستلم جديد للحفظ" };
  await t.create({ saveCustomer: false, recipient });
  assert.equal((await t.state()).user.customers.length, n + 1);
  await t.create({ saveCustomer: true, recipient });
  assert.equal((await t.state()).user.customers.length, n + 1);
});

test("saved orders remember multiple recipients per phone and pickup locations without duplicates", async () => {
  const t = await setup();
  const sender = { ...t.template.sender, area: "المنصور", address: "مخزن جديد", location: { lat: 33.32, lng: 44.35 } };
  const recipient = { ...t.template.recipient, phone: "07912345671", name: "أحمد", location: { lat: 33.31, lng: 44.4 } };
  const first = await t.create({ sender, recipient, publish: false });
  const mother = { ...recipient, name: "والدة أحمد", address: "بيت الوالدة", location: { lat: 33.34, lng: 44.44 } };
  await t.create({ sender, recipient: mother });
  await t.create({ sender, recipient: mother });
  await t.act(first, "edit", { recipient: { ...recipient, location: { lat: 33.315, lng: 44.415 } } });
  let state = await t.state();
  assert.equal(state.user.customers.filter((c) => c.phone === recipient.phone).length, 3);
  assert.equal(state.user.addresses.filter((a) => a.address === sender.address).length, 1);
  assert.equal(first.sender.addressId, state.user.addresses.find((a) => a.address === sender.address).id);
  assert.notEqual(state.user.address, sender.address);
  const reopened = t.createDemoApi(t.storage);
  await reopened("/api/login", { role: "merchant" });
  assert.deepEqual((await reopened("/api/state")).user.customers, state.user.customers);
  await reopened("/api/register", { role: "merchant", name: "تاجر آخر", phone: "07912345672", province: "بغداد" });
  await reopened("/api/login", { role: "merchant", phone: "07912345672" });
  assert.equal((await reopened("/api/state")).user.customers.length, 0);
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
  for (const a of ["return", "return_start"]) await t.act(o, a);
  await t.login("merchant");
  const returnCode = (await t.state()).orders.find(
    (x) => x.id === o.id,
  ).returnCode;
  await t.login("courier");
  await t.act(o, "return_arrive", { code: returnCode });
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

test("multiple vehicle choices persist and match either courier while rejecting unsuitable choices", async () => {
  const t = await setup();
  const { eligible } = await import('./src/services/orderPolicy.js');
  const o = await t.create({ vehicle: 'motorcycle', vehicles: ['motorcycle', 'sedan'], weight: 1, length: 10, width: 10, height: 10 });
  assert.deepEqual(o.vehicles, ['motorcycle', 'sedan']);
  const s = await t.state();
  const courier = { available: true, budget: 1000000, radius: 20, location: o.sender.location };
  assert.equal(eligible({ ...courier, vehicle: 'motorcycle' }, o, s.settings), true);
  assert.equal(eligible({ ...courier, vehicle: 'sedan' }, o, s.settings), true);
  assert.equal(eligible({ ...courier, vehicle: 'truck' }, o, s.settings), false);
  assert.equal(eligible({ ...courier, vehicle: 'sedan' }, { ...o, vehicles: undefined, vehicle: 'motorcycle' }, s.settings), false);
  await assert.rejects(t.create({ vehicles: [] }));
  await assert.rejects(t.create({ vehicles: ['motorcycle', 'sedan'], weight: s.settings.vehicleKg.motorcycle + 1 }));
  await assert.rejects(t.create({ nature: 'cold', vehicles: ['sedan', 'refrigerated'] }));
  assert.deepEqual((await t.state()).orders.find(x => x.id === o.id).vehicles, ['motorcycle', 'sedan']);
});

test("new recipient without street address can be saved and remembered", async () => {
  const t = await setup();
  const recipient = { ...t.template.recipient, name: 'Recipient without street', address: '' };
  const o = await t.create({ recipient });
  assert.equal(o.recipient.address, '');
  assert.ok((await t.state()).user.customers.some(c => c.name === recipient.name && c.area === recipient.area));
});
