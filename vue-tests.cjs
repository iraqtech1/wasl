"use strict";
require("./tools/register-vue-tests.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path"),
  vm = require("node:vm");
process.env.WASEL_DATA_DIR = fs.mkdtempSync(
  path.join(os.tmpdir(), "wasel-vue-tests-"),
);
const domain = require("./domain.cjs");
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
};
global.location = { hostname: "localhost" };
global.history = { pushState() {} };
global.window = {
  matchMedia: () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }),
  scrollTo() {},
};
global.document = {
  createElement: () => ({}),
  querySelector: () => null,
  hidden: false,
};
global.matchMedia = window.matchMedia;
async function renderPage(page, configure = () => {}) {
  const { createSSRApp, h } = await import("vue");
  const { renderToString } = await import("vue/server-renderer");
  const { useWasel } = await import("./src/composables/useWasel.js");
  let app;
  const html = await renderToString(
    createSSRApp({
      setup() {
        app = useWasel();
        app.state.S = domain.view(domain.user("MER-DEMO"));
        app.ui.page = page;
        configure(app);
        return () => h(app.currentView.value);
      },
    }),
  );
  assert.ok(
    !html.includes("[object Object]"),
    page + " must render Vue nodes, not stringified objects",
  );
  return { html, app };
}
test("account drafts open order details with English history dates", async () => {
  const { renderToString } = await import("vue/server-renderer");
  const { h } = await import("vue");
  const { app } = await renderPage("AccountView");
  const order = app.state.S.orders[0];
  assert.ok(order.history.length);
  const button = { dataset: { action: "order", id: order.id }, disabled: false };
  await app.dispatch("click", { target: { closest: () => button } });
  assert.equal(app.ui.dialogTitle, order.id);
  const html = await renderToString(h("div", app.ui.dialogContent));
  assert.match(html, /timeline/);
  assert.match(html, /\d{2}\/\d{2}\/\d{4}/);
  assert.doesNotMatch(html, /[٠-٩۰-۹]/);
});

test("auth screens preserve identity and safely escape content", async () => {
  const roles = await renderPage("AuthView");
  assert.match(roles.html, /حيّاك بواصل/);
  assert.match(roles.html, /glass-role merchant/);
  const login = await renderPage("AuthView", (a) => {
    a.state.authRole = "courier";
    a.ui.authError = "<img onerror=alert(1)>";
    a.ui.formError = a.ui.authError;
  });
  assert.match(login.html, /login-form/);
  assert.match(login.html, /&lt;img/);
  assert.doesNotMatch(login.html, /<img onerror/);
});
test("merchant and courier main views render through Vue", async () => {
  for (const role of ["MER-DEMO", "COU-DEMO"])
    for (const page of [
      "HomeView",
      "OrdersView",
      "WalletView",
      "AccountView",
    ]) {
      const { html } = await renderPage(page, (a) => {
        a.state.S = domain.view(domain.user(role));
        a.state.screen = page === "OrdersView" ? "registry" : "home";
      });
      assert.ok(html.length > 100, page);
    }
});
test("order wizard retains all four steps and form constraints", async () => {
  const data = {
    kind: "merchant",
    amount: 1000,
    count: 1,
    weight: 1,
    length: 20,
    width: 20,
    height: 20,
    nature: "normal",
    vehicle: "sedan",
    baseFee: 5000,
    fee: 5000,
    returnFee: 0,
    feePayer: "customer",
    service: "normal",
    collection: "none",
    notes: "<script>test</script>",
    sender: { ...domain.user("MER-DEMO") },
    recipient: {
      name: "اختبار",
      phone: "07700000003",
      province: "بغداد",
      area: "الكرادة",
      address: "عنوان",
    },
  };
  for (let step = 0; step < 4; step++) {
    const { html } = await renderPage(
      "OrderWizard",
      (a) => (a.state.wizard = { step, data }),
    );
    assert.match(html, /order-form/);
    if (step === 0) assert.match(html, /name="amount"/);
    if (step === 2) assert.match(html, /name="phone"/);
    if (step === 3) {
      assert.match(html, /حفظ دون نشر/);
      assert.match(html, /&lt;script&gt;/);
    }
  }
});
test("saved pickup and recipient choices fill editable locations and preserve notes", async () => {
  const address = { id: "ADR-TEST", area: "المنصور", address: "مخزن", location: { lat: 33.32, lng: 44.35 } };
  const recipient = { name: "والدة أحمد", phone: "07912345678", area: "زيونة", address: "بيت الوالدة", location: { lat: 33.33, lng: 44.46 } };
  const { app } = await renderPage("OrderWizard", (a) => {
    a.state.S.user.addresses = [address];
    a.state.S.user.customers = [recipient];
    a.state.wizard = { step: 1, data: { kind: "merchant", sender: { ...a.state.S.user }, recipient: {} } };
  });
  const form = { id: "order-form", elements: { phone: { value: recipient.phone }, notes: { value: "لا تضيع الملاحظات" } } };
  const select = async (name, value) => app.dispatch("change", { target: { name, value, form, matches: () => false } });
  await select("pickupAddress", address.id);
  assert.deepEqual(app.state.wizard.data.sender.location, address.location);
  await select("pickupAddress", "new");
  assert.equal(app.state.wizard.data.sender.location, undefined);
  app.state.wizard.step = 2;
  await select("savedCustomer", "0");
  assert.deepEqual(app.state.wizard.data.recipient, recipient);
  assert.equal(app.state.wizard.data.notes, "لا تضيع الملاحظات");
  await select("savedCustomer", "");
  assert.equal(app.state.wizard.data.recipient.phone, recipient.phone);
  assert.equal(app.state.wizard.data.recipient.name, undefined);
});

test("registration preserves merchant steps and five courier documents", async () => {
  for (let step = 0; step < 4; step++) {
    const { html } = await renderPage(
      "MerchantRegistration",
      (a) =>
        (a.state.registration = {
          step,
          role: "merchant",
          name: "اختبار",
          province: "بغداد",
          photos: [],
          location: { lat: 33, lng: 44 },
        }),
    );
    assert.match(html, /register-form/);
  }
  const { html } = await renderPage(
    "CourierRegistration",
    (a) =>
      (a.state.registration = {
        role: "courier",
        vehicle: "sedan",
        province: "بغداد",
        documents: {},
        location: { lat: 33, lng: 44 },
      }),
  );
  assert.equal((html.match(/data-document-upload=/g) || []).length, 5);
  assert.match(html, /confirmPassword/);
  assert.match(html, /data-field="confirmPassword"/);
});
test("built PWA caches only public files and supports offline role routes", async () => {
  const source = fs.readFileSync("dist/sw.js", "utf8"),
    handlers = {},
    entries = new Map();
  let precache = [];
  const cache = {
    addAll: async (list) => {
      precache = list;
      for (const url of list) {
        const file = new URL(url).pathname.slice(1) || "index.html";
        assert.ok(fs.existsSync(path.join("dist", file)), file);
        entries.set(url, new Response(file));
      }
    },
    match: async (key) => entries.get(key.url || key),
    put: async (key, value) => entries.set(key.url || key, value),
  };
  const context = {
    URL,
    Response,
    fetch: async () => {
      throw Error("offline");
    },
    caches: { open: async () => cache },
    self: {
      location: { href: "https://wasel.test/sw.js" },
      skipWaiting: async () => {},
      addEventListener: (name, fn) => (handlers[name] = fn),
    },
  };
  vm.runInNewContext(source, context);
  let ready;
  handlers.install({ waitUntil: (p) => (ready = p) });
  await ready;
  assert.ok(precache.length > 5);
  assert.ok(precache.every((u) => !u.includes("/api/") && !u.includes(".cjs")));
  let response;
  handlers.fetch({
    request: {
      url: "https://wasel.test/courier/",
      method: "GET",
      mode: "navigate",
    },
    respondWith: (p) => (response = p),
  });
  assert.equal(await (await response).text(), "index.html");
  response = undefined;
  handlers.fetch({
    request: { url: "https://wasel.test/api/state", method: "GET" },
    respondWith: (p) => (response = p),
  });
  assert.equal(response, undefined);
  context.fetch = async () => new Response("latest");
  handlers.fetch({
    request: { url: "https://wasel.test/index.html", method: "GET" },
    respondWith: (p) => (response = p),
  });
  assert.equal(await (await response).text(), "latest");
});

test("wallet ledger keeps rows inside tbody and escapes merchant names", async () => {
  const { html } = await renderPage("WalletView", (app) => {
    app.state.S = {
      ...app.state.S,
      ledger: [
        {
          reason: "<img src=x>",
          amount: 10,
          orderId: "T",
          at: new Date().toISOString(),
        },
      ],
    };
  });
  assert.match(html, /<tbody><tr[^>]*><td>&lt;img src=x&gt;<\/td>/);
  assert.match(html, /orbit-motion/);
  assert.match(html, /orbit-shimmer/);
});
test("all order action forms render with their validation fields", async () => {
  const { renderToString } = await import("vue/server-renderer");
  const { h } = await import("vue");
  const { app } = await renderPage("HomeView");
  const order = app.state.S.orders[0];
  assert.ok(order);
  const ops = {
    publish: null,
    unpublish: null,
    delete: null,
    cancel: null,
    reserve: null,
    depart: null,
    extend: null,
    arrive: null,
    wait: null,
    transit: null,
    customer_arrive: null,
    approve_retry: null,
    return: null,
    return_start: null,
    return_arrive: null,
    partial_approve: null,
    raise_fee: "fee",
    offer: "fee",
    exclude_pickup: "reason",
    resolve_exclusion: "resolution",
    release: "reason",
    fail: "reason",
    pickup: "code",
    deliver: "proof",
    retry: "when",
    receive_return: "inspected",
    settle_return: "fees",
    settle_delivery: "confirmed",
    partial_propose: "returnAmount",
    defer: "when",
    partial_confirm: "confirmed",
    rate: "stars",
    accept_offer: null,
    chat: "text",
  };
  for (const [op, field] of Object.entries(ops)) {
    const button = {
      dataset: { action: "order-action", id: order.id, op },
      disabled: false,
    };
    await app.dispatch("click", { target: { closest: () => button } });
    const html = await renderToString(h("div", app.ui.dialogContent));
    assert.match(html, /action-form/, op);
    assert.ok(!html.includes("[object Object]"), op);
    if (field)
      assert.ok(html.includes('name="' + field + '"'), op + " " + field);
  }
});
