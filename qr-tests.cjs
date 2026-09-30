const { test } = require("node:test");
const assert = require("node:assert/strict");
const jsQR = require("jsqr");

test("rendered QR decodes to the exact handover or return code", async () => {
  const { default: OrderQr } = await import("./src/components/OrderQr.js");
  for (const code of ["123456", "907231"]) {
    const svg = OrderQr.setup({ code, label: "رمز" })();
    const size = Number(svg.props.viewBox.split(" ")[2]),
      scale = 8,
      width = size * scale;
    const pixels = new Uint8ClampedArray(width * width * 4).fill(255);
    for (const match of svg.children[1].props.d.matchAll(
      /M(\d+) (\d+)h1v1h-1z/g,
    )) {
      for (
        let y = Number(match[2]) * scale;
        y < (Number(match[2]) + 1) * scale;
        y++
      )
        for (
          let x = Number(match[1]) * scale;
          x < (Number(match[1]) + 1) * scale;
          x++
        ) {
          const at = (y * width + x) * 4;
          pixels[at] = 0;
          pixels[at + 1] = 62;
          pixels[at + 2] = 87;
        }
    }
    assert.equal(jsQR(pixels, width, width).data, code);
  }
});

async function fixture(overrides = {}) {
  const { createQrScanner } = await import("./src/services/qrScanner.js");
  const codes = [],
    errors = [];
  let stops = 0,
    requests = 0;
  const stream = { getTracks: () => [{ stop: () => stops++ }] };
  const video = { readyState: 4, srcObject: null, play: async () => {} };
  class Detector {
    static async getSupportedFormats() {
      return ["qr_code"];
    }
    async detect() {
      return [{ rawValue: "123456" }];
    }
  }
  const environment = {
    isSecureContext: true,
    BarcodeDetector: Detector,
    navigator: {
      mediaDevices: {
        getUserMedia: async () => {
          requests++;
          return stream;
        },
      },
    },
    setTimeout,
    clearTimeout,
    ...overrides,
  };
  const scanner = createQrScanner({
    video,
    onCode: (x) => codes.push(x),
    onError: (x) => errors.push(x),
    environment,
  });
  return {
    scanner,
    codes,
    errors,
    video,
    stream,
    get stops() {
      return stops;
    },
    get requests() {
      return requests;
    },
  };
}
test("scanner accepts only six digits and stops camera after detection", async () => {
  const { readHandoverQr } = await import("./src/services/qrScanner.js");
  for (const value of [
    "https://example.com/123456",
    "12345",
    "1234567",
    "<script>",
    null,
  ])
    assert.equal(readHandoverQr(value), null);
  const t = await fixture();
  await t.scanner.start();
  assert.deepEqual(t.codes, ["123456"]);
  assert.equal(t.stops, 1);
  assert.equal(t.video.srcObject, null);
});
test("unsupported detector keeps manual fallback and never requests camera", async () => {
  const t = await fixture({ BarcodeDetector: undefined });
  await t.scanner.start();
  assert.equal(t.requests, 0);
  assert.match(t.errors[0], /يدوياً/);
});
test("closing while camera permission is pending stops late streams", async () => {
  let resolve, requested;
  const ready = new Promise((r) => (requested = r));
  const t = await fixture({
    navigator: {
      mediaDevices: {
        getUserMedia: () => {
          requested();
          return new Promise((r) => (resolve = r));
        },
      },
    },
  });
  const start = t.scanner.start();
  await ready;
  t.scanner.stop();
  resolve(t.stream);
  await start;
  assert.equal(t.stops, 1);
  assert.deepEqual(t.codes, []);
});
test("late detections after close cannot fill a code", async () => {
  let resolve, detected;
  const ready = new Promise((r) => (detected = r));
  class Detector {
    static async getSupportedFormats() {
      return ["qr_code"];
    }
    detect() {
      detected();
      return new Promise((r) => (resolve = r));
    }
  }
  const t = await fixture({ BarcodeDetector: Detector });
  const start = t.scanner.start();
  await ready;
  t.scanner.stop();
  resolve([{ rawValue: "123456" }]);
  await start;
  assert.deepEqual(t.codes, []);
  assert.equal(t.stops, 1);
});
test("camera rejection leaves manual entry available", async () => {
  const t = await fixture({
    navigator: {
      mediaDevices: {
        getUserMedia: async () => {
          throw Object.assign(Error(), { name: "NotAllowedError" });
        },
      },
    },
  });
  await t.scanner.start();
  assert.match(t.errors[0], /يدوياً/);
  assert.deepEqual(t.codes, []);
});

test("pickup records QR verification only after code and inspection are valid", async () => {
  const { createDemoApi } = await import("./src/services/demoApi.js");
  const api = createDemoApi({ getItem: () => null, setItem: () => {} });
  await api("/api/login", { role: "courier" });
  const act = (extra) =>
    api("/api/orders/ORD-DEMO-0005/action", { action: "pickup", ...extra });
  await assert.rejects(
    act({ code: "000000", inspected: true, paid: true, scanMethod: "qr" }),
  );
  await assert.rejects(
    act({ code: "123456", inspected: false, paid: true, scanMethod: "qr" }),
  );
  assert.equal(
    (await api("/api/state")).orders
      .find((x) => x.id === "ORD-DEMO-0005")
      .history.filter((x) => x.action === "scan").length,
    0,
  );
  const result = await act({
    code: "123456",
    inspected: true,
    paid: true,
    scanMethod: "qr",
  });
  assert.equal(result.status, "received");
  assert.equal(result.history.find((x) => x.action === "scan").method, "qr");
  await assert.rejects(
    act({ code: "123456", inspected: true, paid: true, scanMethod: "qr" }),
  );
});
test("return codes are private, validated once, logged without secrets, and do not settle money", async () => {
  const { createDemoApi } = await import("./src/services/demoApi.js");
  const values = new Map();
  const storage = {
    getItem: (k) => values.get(k),
    setItem: (k, v) => values.set(k, v),
  };
  const api = createDemoApi(storage),
    id = "ORD-DEMO-0013";
  await api("/api/login", { role: "courier" });
  const act = (action, extra = {}) =>
    api(`/api/orders/${id}/action`, { action, ...extra });
  const started = await act("return_start");
  assert.equal(started.returnCode, undefined);
  await api("/api/login", { role: "merchant" });
  const order = (await api("/api/state")).orders.find((o) => o.id === id),
    code = order.returnCode;
  assert.match(code, /^\d{6}$/);
  await api("/api/login", { role: "courier" });
  await assert.rejects(
    act("return_arrive", { code: "bad", scanMethod: "qr" }),
    /رمز المرتجع/,
  );
  const arrived = await act("return_arrive", { code, scanMethod: "qr" });
  assert.equal(arrived.returnArrived, true);
  assert.equal(arrived.returnReceived, false);
  assert.equal(arrived.settled, false);
  const entries = arrived.history.filter((h) => h.action === "scan");
  assert.equal(entries.length, 1);
  assert.equal(entries[0].kind, "return");
  assert.equal(entries[0].method, "qr");
  assert.ok(!JSON.stringify(entries).includes(code));
  await assert.rejects(
    act("return_arrive", { code, scanMethod: "qr" }),
    /مسبقاً/,
  );
  await assert.rejects(act("settle_return", { confirmed: true, fees: 8000 }));
});
