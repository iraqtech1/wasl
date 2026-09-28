import { createDemoData, statuses, settings } from "./demoData.js";
export const DEMO_STORAGE_KEY = "wasel-vue-frontend-demo-v1";
const copy = (value) => structuredClone(value);
const fail = (message, status = 400) => {
  throw Object.assign(Error(message), { status });
};
// This adapter simulates UI interactions only; it is not authentication or server validation.
export function createDemoApi(storage = globalThis.localStorage) {
  let data = createDemoData(),
    currentId = null;
  try {
    const saved = JSON.parse(storage?.getItem(DEMO_STORAGE_KEY) || "null");
    if (
      saved?.version === 1 &&
      Array.isArray(saved.users) &&
      Array.isArray(saved.orders)
    )
      data = saved;
  } catch {}
  const id = (prefix) =>
    prefix +
    "-" +
    (
      globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
    ).slice(0, 10);
  const now = () => new Date().toISOString();
  function persist() {
    try {
      storage?.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify(data, (key, value) =>
          [
            "password",
            "confirmPassword",
            "documents",
            "photos",
            "photo",
          ].includes(key)
            ? undefined
            : value,
        ),
      );
    } catch {
      /* A full or unavailable browser store must not block preview navigation. */
    }
  }
  function user() {
    return (
      data.users.find((u) => u.id === currentId) ||
      fail("اختر حساباً للمعاينة", 401)
    );
  }
  function view() {
    const u = user(),
      orders = data.orders
        .filter((o) =>
          u.role === "merchant"
            ? o.merchant === u.id
            : o.status === "published" || o.courier === u.id,
        )
        .map((o) => ({
          ...o,
          courierInfo: data.users.find((p) => p.id === o.courier),
        }));
    const ledger = data.ledger.filter((r) => r.owner === u.id);
    return copy({
      user: u,
      orders,
      settings,
      statuses,
      ledger,
      balance: ledger.reduce((n, r) => n + r.amount, 0),
      cashLedger: data.cashLedger.filter((r) => r.owner === u.id),
      messages: data.messages.filter((r) =>
        orders.some((o) => o.id === r.orderId),
      ),
      ratings: data.ratings.filter(
        (r) => r.owner === u.id || r.target === u.id,
      ),
      offers: data.offers.filter((r) => orders.some((o) => o.id === r.orderId)),
      notifications: data.notifications.filter((r) => r.owner === u.id),
      couriers: data.users.filter((p) => p.role === "courier" && p.available),
      profileLocked: false,
    });
  }
  function change(o, status, text) {
    o.status = status;
    o.updatedAt = now();
    o.history.push({
      at: now(),
      actor: user().id,
      text: text || statuses[status],
      status,
    });
  }
  function orderAction(o, p) {
    const u = user();
    if (p.action === "edit") {
      const { id: ignored, merchant, courier, history, status, ...values } = p;
      Object.assign(o, values);
      change(o, o.status === "draft" ? "draft" : "published", "تعديل تجريبي");
      o.courier = null;
      return;
    }
    if (p.action === "delete") {
      data.orders = data.orders.filter((x) => x.id !== o.id);
      return;
    }
    if (p.action === "chat") {
      if (!p.text?.trim()) fail("اكتب رسالة");
      data.messages.unshift({
        id: id("MSG"),
        owner: u.id,
        name: u.name,
        orderId: o.id,
        text: p.text,
        at: now(),
      });
      return;
    }
    if (p.action === "rate") {
      if (data.ratings.some((r) => r.owner === u.id && r.orderId === o.id))
        fail("تم تقييم هذا الطلب");
      data.ratings.unshift({
        id: id("RATE"),
        owner: u.id,
        target: u.role === "merchant" ? o.courier : o.merchant,
        orderId: o.id,
        stars: Number(p.stars),
        text: p.text || "",
        at: now(),
      });
      return;
    }
    if (p.action === "offer") {
      data.offers.unshift({
        id: id("OFFER"),
        owner: u.id,
        name: u.name,
        orderId: o.id,
        fee: Number(p.fee),
        at: now(),
      });
      return;
    }
    if (p.action === "accept_offer") {
      const offer = data.offers.find((v) => v.id === p.offer);
      if (!offer) fail("العرض غير موجود");
      o.fee = offer.fee;
      o.courier = offer.owner;
      change(o, "reserved");
      return;
    }
    if (p.action === "raise_fee") {
      o.fee = Number(p.fee);
      return;
    }
    if (p.action === "extend") {
      o.extended = true;
      o.deadline = new Date(Date.now() + 3600000).toISOString();
      return;
    }
    if (p.action === "approve_retry") {
      o.retryApproved = true;
      return;
    }
    if (p.action === "partial_propose") {
      o.partial = {
        count: Number(p.count),
        amount: Number(p.amount),
        approved: false,
      };
      return;
    }
    if (p.action === "partial_approve") {
      if (!o.partial) fail("لا يوجد اقتراح");
      o.partial.approved = true;
      return;
    }
    if (p.action === "receive_return") {
      o.returnReceived = true;
      return;
    }
    if (p.action === "return_arrive") {
      o.returnArrived = true;
      return;
    }
    if (p.action === "settle_return") {
      o.settled = true;
      change(o, "returned");
      return;
    }
    if (p.action === "settle_delivery") {
      o.settled = true;
      return;
    }
    const transitions = {
      publish: "published",
      unpublish: "draft",
      cancel: "cancelled",
      reserve: "reserved",
      depart: "approaching",
      arrive: "arrived",
      wait: "waiting",
      release: "published",
      pickup: "received",
      transit: "transit",
      customer_arrive: "at_customer",
      deliver: "delivered",
      fail: "failed",
      retry: "retry",
      return: "return_pending",
      return_start: "returning",
      partial_confirm: "partial_pending",
    };
    if (!transitions[p.action]) fail("هذا الإجراء غير متاح في المعاينة");
    if (p.action === "reserve") {
      o.courier = u.id;
      o.deadline = new Date(Date.now() + 3600000).toISOString();
    }
    if (p.action === "release") {
      o.courier = null;
      o.deadline = null;
    }
    if (p.action === "pickup") o.goodsPaid = true;
    if (p.action === "deliver") o.proof = p.proof;
    if (p.action === "retry") {
      o.retryAt = p.when;
      o.retryApproved = false;
    }
    if (p.action === "cancel") o.settled = true;
    change(
      o,
      transitions[p.action],
      p.reason || statuses[transitions[p.action]],
    );
  }
  return async function api(url, p = {}) {
    if (url === "/api/login") {
      if (!["merchant", "courier"].includes(p.role)) fail("اختر نوع الحساب");
      const selected =
        data.users.find((u) => u.role === p.role && u.phone === p.phone) ||
        data.users.find((u) => u.id === data.lastByRole[p.role]) ||
        data.users.find((u) => u.role === p.role);
      currentId = selected.id;
      data.lastByRole[p.role] = currentId;
      persist();
      return { user: copy(selected) };
    }
    if (url === "/api/logout") {
      currentId = null;
      return { ok: true };
    }
    if (url === "/api/register") {
      if (
        !["merchant", "courier"].includes(p.role) ||
        !p.name?.trim() ||
        !p.phone?.trim()
      )
        fail("أكمل بيانات الحساب");
      if (p.role === "courier" && p.password !== p.confirmPassword)
        fail("كلمة المرور وتأكيدها غير متطابقين");
      const uid = id(p.role === "merchant" ? "MER" : "COU");
      const { password, confirmPassword, documents, photos, ...profile } = p;
      const account = {
        ...profile,
        id: uid,
        walletId: "W-" + uid,
        approved: true,
        demo: true,
        available: true,
        budget: 500000,
        radius: 5,
        customers: [],
      };
      data.users.push(account);
      data.lastByRole[p.role] = uid;
      persist();
      return { user: copy(account) };
    }
    const u = user();
    if (url === "/api/state") return view();
    if (url === "/api/profile") {
      if (p.action === "preferences") u.motivational = !!p.motivational;
      else if (p.action === "location") u.location = p.location;
      else if (p.action === "readiness")
        Object.assign(u, {
          available: !!p.available,
          budget: Number(p.budget),
          radius: Number(p.radius),
          location: p.location,
        });
      else if (p.action === "profile")
        for (const field of [
          "name",
          "province",
          "area",
          "address",
          "phone2",
          "location",
        ])
          if (p[field] !== undefined) u[field] = p[field];
      persist();
      return { user: copy(u) };
    }
    if (url === "/api/orders") {
      if (!p.recipient?.name || !p.recipient?.address || !p.recipient?.area)
        fail("أكمل بيانات المستلم");
      const oid = id("ORD"),
        o = {
          ...copy(p),
          id: oid,
          merchant: u.id,
          courier: null,
          sender: p.kind === "free" ? p.sender : copy(u),
          status: p.publish ? "published" : "draft",
          settled: false,
          goodsPaid: false,
          demo: true,
          history: [],
          createdAt: now(),
          attempts: 0,
          handoverCode: "123456",
        };
      change(o, o.status, "إنشاء طلب تجريبي");
      data.orders.push(o);
      u.customers ??= [];
      u.customers.unshift(copy(o.recipient));
      persist();
      return copy(o);
    }
    const match = url.match(/^\/api\/orders\/([^/]+)\/action$/);
    if (match) {
      const o = data.orders.find((o) => o.id === decodeURIComponent(match[1]));
      if (!o) fail("الطلب غير موجود", 404);
      orderAction(o, p);
      persist();
      return copy(o);
    }
    fail("الصفحة غير موجودة", 404);
  };
}
