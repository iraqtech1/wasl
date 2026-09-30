"use strict";
require("./tools/register-vue-tests.cjs");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path");
process.env.WASEL_DATA_DIR = fs.mkdtempSync(
  path.join(os.tmpdir(), "wasel-phone-tests-"),
);
const domain = require("./domain.cjs");
const storage = new Map();
global.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
};
global.location = { hostname: "localhost", hash: "" };
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
  querySelectorAll: () => [],
  hidden: false,
};
global.matchMedia = window.matchMedia;

const helpers = () => import("./src/renderers/helpers.js");

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
  return { html, app };
}

// Every rendered phone input must be marked as an eleven-digit English field.
function assertPhoneField(html, name) {
  const tag = html.match(new RegExp(`<input[^>]*name="${name}"[^>]*>`));
  assert.ok(tag, `missing input[name=${name}]`);
  assert.match(tag[0], /inputmode="numeric"/, name);
  assert.match(tag[0], /pattern="07\[789\]\[0-9\]\{8\}"/, name);
  assert.match(tag[0], /maxlength="11"/, name);
  assert.match(tag[0], /minlength="11"/, name);
  assert.match(tag[0], /dir="ltr"/, name);
}

test("phone helpers keep English digits and stop at eleven", async () => {
  const { phoneDigits, phoneError, toEnglishDigits, PHONE_ATTRIBUTES } =
    await helpers();
  assert.equal(phoneDigits("07712345678"), "07712345678");
  assert.equal(phoneDigits("077123456789999"), "07712345678");
  assert.equal(phoneDigits("+964 770 123 4567"), "07701234567");
  assert.equal(toEnglishDigits("٠٧٧١٢٣٤٥٦٧٨"), "07712345678");
  assert.equal(phoneDigits("٠٧٧١٢٣٤٥٦٧٨"), "07712345678");
  assert.equal(phoneDigits("077-123 4567"), "0771234567");
  assert.equal(phoneError("07712345678"), "");
  assert.equal(phoneError(""), "");
  assert.equal(phoneError(undefined), "");
  assert.equal(phoneError("0771234567"), "رقم الهاتف يتكون من 11 رقماً");
  assert.equal(phoneError("077123456789"), "رقم الهاتف يتكون من 11 رقماً");
  assert.equal(
    phoneError("٠٧٧١٢٣٤٥٦٧٨"),
    "أدخل رقم الهاتف بالأرقام الإنجليزية فقط",
  );
  assert.match(PHONE_ATTRIBUTES, /inputmode="numeric"/);
  assert.match(PHONE_ATTRIBUTES, /pattern="07\[789\]\[0-9\]\{8\}"/);
});

test("login allows usernames or phone numbers for both roles", async () => {
  for (const role of ["merchant", "courier"]) {
    const { html } = await renderPage(
      "AuthView",
      (a) => (a.state.authRole = role),
    );
    const field = html.match(/<input[^>]*name="identifier"[^>]*>/);
    assert.ok(field, "missing login identifier for " + role);
    assert.match(field[0], /type="text"/);
    assert.match(field[0], /autocomplete="username"/);
    assert.doesNotMatch(field[0], /inputmode="numeric"|pattern=|maxlength="11"/);
  }
});

test("registration and order forms expose a numeric eleven-digit keyboard", async () => {
  for (let step = 0; step < 4; step++) {
    const { html } = await renderPage(
      "MerchantRegistration",
      (a) =>
        (a.state.registration = {
          step,
          role: "merchant",
          name: "اختبار",
          phone: "07712345678",
          province: "بغداد",
          photos: [],
          documents: {},
          location: { lat: 33, lng: 44 },
        }),
    );
    if (step === 0) assertPhoneField(html, "phone");
  }

  const courier = await renderPage(
    "CourierRegistration",
    (a) =>
      (a.state.registration = {
        role: "courier",
        name: "مندوب",
        phone: "07712345678",
        vehicle: "sedan",
        province: "بغداد",
        documents: {},
        location: { lat: 33, lng: 44 },
      }),
  );
  assertPhoneField(courier.html, "phone");

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
    notes: "",
    sender: { ...domain.user("MER-DEMO") },
    recipient: {
      name: "اختبار",
      phone: "07712345678",
      phone2: "",
      province: "بغداد",
      area: "الكرادة",
      address: "عنوان",
    },
  };
  const wizard = await renderPage(
    "OrderWizard",
    (a) => (a.state.wizard = { step: 2, data }),
  );
  assertPhoneField(wizard.html, "phone");
  assertPhoneField(wizard.html, "phone2");

  // The backup phone lives in the profile dialog opened from the account screen.
  const account = await renderPage("AccountView");
  await account.app.dispatch("click", {
    target: {
      closest: () => ({
        dataset: { action: "edit-profile" },
        disabled: false,
      }),
    },
  });
  const { renderToString: dialogHtml } = await import("vue/server-renderer");
  const { h: vueH } = await import("vue");
  const profile = await dialogHtml(vueH("div", account.app.ui.dialogContent));
  assertPhoneField(profile, "phone2");
});

test("registration rejects short, long and Arabic-digit phone numbers", async () => {
  const { createDemoApi } = await import("./src/services/demoApi.js");
  const base = {
    role: "courier",
    name: "مندوب فحص",
    password: "Password123!",
    confirmPassword: "Password123!",
    province: "بغداد",
    area: "الكرادة",
    address: "عنوان",
    location: { lat: 33.3, lng: 44.43 },
    vehicle: "sedan",
    plate: "بغداد 12345",
    documents: {},
  };
  const api = createDemoApi({
    getItem: () => null,
    setItem: () => {},
  });
  for (const phone of [
    "0771234567", // ten digits
    "077123456789", // twelve digits
    "٠٧٧١٢٣٤٥٦٧٨", // Arabic-Indic digits
    "0771234567a",
  ]) {
    await assert.rejects(
      () => api("/api/register", { ...base, phone }),
      /11 رقماً/,
      `phone ${phone} must be refused`,
    );
  }
  const ok = await api("/api/register", { ...base, phone: "07712345678" });
  assert.equal(ok.user.phone, "07712345678");
});

test("submitting a phone that is not eleven English digits shows an Arabic error", async () => {
  const { createSSRApp, h } = await import("vue");
  const { renderToString } = await import("vue/server-renderer");
  const { useWasel } = await import("./src/composables/useWasel.js");
  global.FormData = class {
    constructor(form) {
      this.entries = form.entries || [];
    }
    [Symbol.iterator]() {
      return this.entries[Symbol.iterator]();
    }
  };
  let app;
  await renderToString(
    createSSRApp({
      setup() {
        app = useWasel();
        app.state.S = domain.view(domain.user("MER-DEMO"));
        return () => h("div");
      },
    }),
  );

  async function submit(id, entries, elements) {
    app.ui.toast = "";
    await app.dispatch("submit", {
      preventDefault() {},
      target: { id, entries, elements, querySelector: () => null },
    });
    return app.ui.toast;
  }

  const short = await submit(
    "register-form",
    [
      ["name", "اختبار"],
      ["phone", "077123456"],
    ],
    [{ name: "phone", value: "077123456" }],
  );
  assert.match(short, /11 رقماً/);

  const arabic = await submit(
    "register-form",
    [
      ["name", "اختبار"],
      ["phone", "٠٧٧١٢٣٤٥٦٧٨"],
    ],
    [{ name: "phone", value: "٠٧٧١٢٣٤٥٦٧٨" }],
  );
  assert.match(arabic, /الإنجليزية فقط/);

  const valid = await submit(
    "unknown-form",
    [["phone", "07712345678"]],
    [{ name: "phone", value: "07712345678" }],
  );
  assert.equal(valid, "", "an eleven-digit English number must pass");

  const empty = await submit(
    "unknown-form",
    [],
    [{ name: "phone", value: "" }],
  );
  assert.equal(empty, "", "an optional phone field may stay empty");
});
