import { capacityProblem } from "./reservationCapacity.js";
import { createDemoData, statuses, settings as defaults } from "./demoData.js";
import { rememberOrderPlaces } from "./addressBook.js";
import {
  BEFORE,
  orderVehicles,
  vehicleFits,
  unresolved,
  eligible,
  distance,
  supportedPhone,
  areaLocations,
} from "./orderPolicy.js";
export const DEMO_STORAGE_KEY = "wasel-vue-frontend-demo-v1";
const copy = (x) => structuredClone(x);
const fail = (message, status = 400) => {
  throw Object.assign(Error(message), { status });
};
const must = (ok, msg) => {
  if (!ok) fail(msg);
};
const money = (x) => Number.isFinite(Number(x)) && Number(x) >= 0;
const profileFields = [
  "name",
  "province",
  "area",
  "address",
  "phone2",
  "location",
];
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
  if (!data.expandedDemoCatalog) {
    const sample = createDemoData();
    if (data.users.some((u) => u.id === "MER-DEMO")) {
      for (const order of sample.orders) {
        const existing = data.orders.find((o) => o.id === order.id);
        if (!existing) data.orders.push(order);
        else if (existing.recipient?.name?.startsWith("مستلم تجريبي")) {
          existing.recipient = order.recipient;
          existing.notes = order.notes;
        }
      }
    }
    data.expandedDemoCatalog = true;
  }
  if (!data.expandedDemoCouriers) {
    for (const courier of createDemoData().users.filter((u) =>
      u.id.startsWith("COU-DEMO-"),
    )) {
      if (!data.users.some((u) => u.id === courier.id)) data.users.push(courier);
    }
    data.expandedDemoCouriers = true;
  }
  data.config = { ...defaults, ...data.config };
  data.tickets ??= [];
  data.audit ??= [];
  data.batches ??= [];
  data.outlets ??= [
    {
      id: "OUT-DEMO",
      name: "منفذ تجريبي — الكرادة",
      phone: "07700000003",
      location: { lat: 33.302, lng: 44.432 },
      address: "بغداد، الكرادة",
      balance: 1000000,
    },
  ];
  if (!data.expandedDemoOutlets) {
    const samples = [
      {
        id: "OUT-DEMO-MANSOUR",
        name: "منفذ المنصور — تجريبي",
        address: "بغداد، المنصور — قرب مول المنصور",
        phone: "07700000004",
        location: { lat: 33.314, lng: 44.354 },
        balance: 750000,
      },
      {
        id: "OUT-DEMO-ZAYOUNA",
        name: "منفذ زيونة — تجريبي",
        address: "بغداد، زيونة — شارع الربيعي",
        phone: "07700000005",
        location: { lat: 33.324, lng: 44.465 },
        balance: 500000,
      },
      {
        id: "OUT-DEMO-ADHAMIYA",
        name: "منفذ الأعظمية — تجريبي",
        address: "بغداد، الأعظمية — شارع الضباط",
        phone: "07700000006",
        location: { lat: 33.369, lng: 44.383 },
        balance: 1250000,
      },
    ];
    for (const outlet of samples) {
      if (!data.outlets.some((existing) => existing.id === outlet.id))
        data.outlets.push(outlet);
    }
    data.expandedDemoOutlets = true;
  }
  for (const u of data.users) {
    u.addresses ??= [];
    u.customers ??= [];
    u.cancellations ??= [];
    u.failures ??= [];
  }
  data.users.forEach((u) =>
    u.customers.forEach((c, i) => (c.id ??= u.id + "-CUS-" + i)),
  );
  for (const o of data.orders) {
    if (o.status === "returning" && !o.returnArrived && !o.returnCode)
      o.returnCode = String(Math.floor(100000 + Math.random() * 900000));
    if (o.id.startsWith("ORD-DEMO-") && o.status === "partial_pending")
      o.partialDelivered = true;
    if (o.id.startsWith("ORD-DEMO-") && o.service === "vip")
      o.fee = Math.max(o.fee, o.baseFee + data.config.vipSurcharge);
  }
  const feesActive = () =>
    !data.config.feesStartAt ||
    Date.parse(data.config.feesStartAt) <= Date.now();
  const id = (p) =>
    p +
    "-" +
    (
      globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2)
    ).slice(0, 10);
  const now = () => new Date().toISOString();
  const user = () =>
    data.users.find((u) => u.id === currentId) ||
    fail("اختر حساباً للمعاينة", 401);
  const online = () => globalThis.navigator?.onLine !== false;
  let lastSavedRaw;
  try {
    lastSavedRaw = storage?.getItem(DEMO_STORAGE_KEY);
  } catch {}
  const persist = () => {
    try {
      storage?.setItem(
        DEMO_STORAGE_KEY,
        JSON.stringify(data, (k, v) =>
          [
            "password",
            "confirmPassword",
            "documents",
            "photos",
            "photo",
          ].includes(k)
            ? undefined
            : v,
        ),
      );
      lastSavedRaw = storage?.getItem(DEMO_STORAGE_KEY);
    } catch {}
  };
  const notify = (owner, text, orderId) => {
    if (owner)
      data.notifications.unshift({
        id: id("N"),
        owner,
        text,
        orderId,
        at: now(),
      });
  };
  const change = (o, status, text) => {
    o.status = status;
    o.updatedAt = now();
    o.history ??= [];
    o.history.push({
      at: now(),
      actor: currentId || "SYSTEM",
      text: text || statuses[status],
      status,
    });
    for (const owner of new Set([o.merchant, o.courier].filter(Boolean)))
      notify(owner, o.id + " — " + (text || statuses[status]), o.id);
  };
  const audit = (text) =>
    data.audit.unshift({ id: id("AUD"), at: now(), actor: currentId, text });
  function release(o, text) {
    change(o, "published", text);
    o.courier = null;
    o.deadline = null;
    o.extensionRequest = null;
    o.editPending = false;
    o.publishedAt = now();
    o.offerRound = (o.offerRound || 0) + 1; o.waitNotified = false;
    o.courierInfo = null;
  }
  function sweep() {
    for (const o of data.orders) {
      if (
        ["arrived", "waiting"].includes(o.status) &&
        o.arrivedAt &&
        !o.waitAlerted &&
        Date.now() - Date.parse(o.arrivedAt) > data.config.waitMinutes * 60000
      ) {
        notify(
          o.merchant,
          "تجاوز تجهيز الطلب مهلة الانتظار؛ يرجى التواصل مع المندوب",
          o.id,
        );
        notify(
          o.courier,
          "يمكنك التواصل مع التاجر أو إلغاء الحجز مع توضيح تأخير التجهيز",
          o.id,
        );
        o.waitAlerted = true;
      }

      if (["reserved", "approaching"].includes(o.status) && o.deadline) {
        const remaining = Date.parse(o.deadline) - Date.now();
        if (remaining <= 0) release(o, "انتهت مهلة الوصول — أُلغي الحجز وأعيد نشر الطلب تلقائياً");
        else if (remaining <= 120000 && o.arrivalWarnedDeadline !== o.deadline) {
          notify(o.courier, "باقي دقيقتين أو أقل للوصول إلى الاستلام؛ يمكنك تمديد المهلة ضمن الحد المتاح", o.id);
          o.arrivalWarnedDeadline = o.deadline;
        }
      }
      if (
        o.status === "published" &&
        !o.waitNotified &&
        data.users.some((c) => c.role === "courier" && eligible(c, o, data.config) && !capacityProblem(c, o, data.orders, data.config)) &&
        Date.now() - Date.parse(o.publishedAt || o.createdAt) >
          data.config.offerAfterMinutes * 60000
      ) {
        notify(o.merchant, "طلبك لم يُحجز رغم وجود مناديب متاحين؛ فُتحت عروض أجور التوصيل", o.id);
        o.waitNotified = true;
      }
    }
  }
  function reserve(o, c) {
    must(o.status === "published", "الطلب لم يعد متاحاً");
    must(
      eligible(c, o, data.config),
      "الطلب لا يناسب الموقع أو المركبة أو الميزانية",
    );
    const problem = capacityProblem(c, o, data.orders, data.config);
    must(!problem, problem);
    must(
      !data.config.penaltiesEnabled ||
        !c.restrictedUntil ||
        Date.parse(c.restrictedUntil) < Date.now(),
      "الحجوزات الجديدة مقيّدة مؤقتاً",
    );
    o.courier = c.id;
    o.pickupDistanceKm = distance(c.location, o.sender.location);
    o.originalMinutes = Math.max(3, Math.ceil(o.pickupDistanceKm * 3 * (1 + data.config.arrivalBuffer / 100)));
    o.deadline = new Date(Date.now() + o.originalMinutes * 60000).toISOString();
    o.extensionMinutes = 0;
    o.extended = false;
    o.arrivalWarnedDeadline = null;
    o.extensionRequest = null;
    change(o, "reserved");
  }
  function cash(o, amount, reason, key) {
    if (data.cashLedger.some((r) => r.orderId === o.id && r.key === key))
      return;
    const c = data.users.find((u) => u.id === o.courier);
    must(c, "المندوب غير موجود");
    c.budget = Number(c.budget || 0) + amount;
    data.cashLedger.unshift({
      id: id("CASH"),
      key,
      owner: c.id,
      actor: currentId,
      orderId: o.id,
      amount,
      reason,
      at: now(),
    });
  }
  function fee(o) {
    if (!feesActive()) return;
    if (data.ledger.some((r) => r.orderId === o.id && r.kind === "commission"))
      return;
    const rate =
      o.service === "vip"
        ? data.config.vipCommission
        : o.kind === "free"
          ? data.config.freeCommission
          : data.config.commission;
    const base =
      o.fee +
      (data.config.returnCommission && o.returnReceived ? o.returnFee : 0);
    const amount =
      data.config.commissionMode === "percent"
        ? Math.round((base * rate) / 100)
        : rate;
    if (amount > 0)
      data.ledger.push({
        id: id("W"),
        owner: o.merchant,
        orderId: o.id,
        kind: "commission",
        amount: -amount,
        reason:
          "عمولة " +
          (o.service === "vip"
            ? "VIP"
            : o.kind === "free"
              ? "التوصيل الحر"
              : "الطلب"),
        at: now(),
      });
  }
  function canView(u, o) {
    return (
      u.id === o.merchant ||
      u.id === o.courier ||
      (u.role === "courier" &&
        online() &&
        o.status === "published" &&
        eligible(u, o, data.config))
    );
  }
  function visible(o, u) {
    const v = copy(o);
    const c = data.users.find((x) => x.id === o.courier);
    v.courierInfo = c
      ? {
          id: c.id,
          name: c.name,
          phone: c.phone,
          vehicle: c.vehicle,
          cooling: c.cooling,
          plate: c.plate,
          location: c.location,
        }
      : null;
    v.distanceKm = distance(
      o.sender.location,
      o.recipient.location || areaLocations[o.recipient.area],
    );
    v.distanceApproximate = !o.recipient.location;
    if (u.id !== o.merchant) {
      delete v.handoverCode;
      delete v.returnCode;
      delete v.batchCode;
      if (u.id !== o.courier) {
        v.sender = {
          province: o.sender.province,
          area: o.sender.area,
          location: o.sender.location,
          name: "موقع استلام",
          addressId: o.sender.addressId,
        };
        v.history = [];
        delete v.photo;
        delete v.notes;
      }
      if (!o.goodsPaid) {
        v.recipient = {
          province: o.recipient.province,
          area: o.recipient.area,
          name: "بيانات المستلم محجوبة حتى الاستلام",
        };
        delete v.notes;
      }
    }
    return v;
  }
  function view() {
    sweep();
    const u = user(),
      orders = data.orders
        .filter((o) => canView(u, o))
        .map((o) => visible(o, u));
    const ledger = data.ledger.filter((r) => r.owner === u.id);
    persist();
    return copy({
      user: u,
      orders,
      settings: data.config,
      statuses,
      ledger,
      balance: ledger.reduce((n, r) => n + r.amount, 0),
      cashLedger: data.cashLedger.filter((r) => r.owner === u.id),
      messages: data.messages.filter((r) =>
        orders.some(
          (o) =>
            o.id === r.orderId && (o.merchant === u.id || o.courier === u.id),
        ),
      ),
      ratings: data.ratings.filter(
        (r) => r.owner === u.id || r.target === u.id,
      ),
      offers: data.offers.filter((r) => orders.some((o) => o.id === r.orderId && o.status === "published" && (r.round || 0) === (o.offerRound || 0)) && (u.role === "merchant" || r.owner === u.id)),
      notifications: data.notifications.filter((r) => r.owner === u.id),
      couriers: data.users
        .filter(
          (c) =>
            c.role === "courier" &&
            c.available &&
            distance(c.location, u.location) <= 20,
        )
        .map((c) => ({
          id: c.id,
          name: c.name,
          vehicle: c.vehicle,
          cooling: c.cooling,
          location: c.location,
        })),
      profileLocked: data.orders.some(
        (o) => (o.merchant === u.id || o.courier === u.id) && unresolved(o),
      ),
      outlets: data.outlets,
      tickets: data.tickets.filter((t) => t.owner === u.id),
      batches: data.batches
        .filter((b) => b.merchant === u.id || b.courier === u.id)
        .map((b) => (u.role === "merchant" ? b : { ...b, code: undefined })),
    });
  }
  function validateOrder(p) {
    must(
      ["merchant", "free"].includes(p.kind) &&
        ["normal", "vip"].includes(p.service),
      "نوع الطلب غير صالح",
    );
    must(
      [p.weight, p.length, p.width, p.height].every((v) => Number(v) > 0),
      "الوزن والأبعاد يجب أن تكون أكبر من صفر",
    );
    must(
      p.recipient?.name && p.recipient?.address && p.recipient?.area,
      "أكمل بيانات المستلم",
    );
    must(
      supportedPhone(p.recipient.phone),
      "الهاتف يجب أن يبدأ بـ077 أو078 أو079 ويتكون من 11 رقماً",
    );
    if (p.recipient.phone2)
      must(supportedPhone(p.recipient.phone2), "الهاتف الإضافي غير مدعوم");
    for (const k of [
      "amount",
      "fee",
      "returnFee",
      "weight",
      "length",
      "width",
      "height",
      "count",
    ])
      must(money(p[k]), "قيمة غير صالحة: " + k);
    must(
      Number(p.count) >= 1 && Number.isInteger(Number(p.count)),
      "عدد القطع غير صالح",
    );
    must(p.returnFee <= p.fee, "أجرة الراجع لا تتجاوز التوصيل");
    must(
      p.nature !== "cold" || orderVehicles(p).every(v => v === "refrigerated"),
      "الشحنة المبردة تحتاج سيارة مبردة",
    );
    must(
      orderVehicles(p).length > 0 && orderVehicles(p).length <= 2 && orderVehicles(p).every(v => vehicleFits(v, p, data.config)),
      "حمولة الشحنة تتجاوز سعة المركبة",
    );
    must(
      p.recipient.province === user().province,
      "التوصيل داخل محافظة واحدة فقط",
    );
    if (p.service === "vip")
      must(
        p.fee >= Number(p.baseFee || 0) + data.config.vipSurcharge,
        "أجرة VIP يجب أن تتضمن الزيادة",
      );
    if (p.kind === "free") {
      must(supportedPhone(p.sender?.phone), "هاتف المرسل غير مدعوم");
      must(
        Number(p.amount) === 0 && p.collection !== "collect",
        "التوصيل الحر حالياً توصيل فقط بدون دفع أو تحصيل قيمة البضاعة",
      );
    }
  }
  function act(o, p) {
    const u = user(),
      own = o.merchant === u.id,
      assigned = o.courier === u.id,
      a = p.action;
    const requireState = (list) =>
      must(list.includes(o.status), "الإجراء لا يناسب حالة الطلب الحالية");
    const merchant = () => must(own, "هذا الإجراء للتاجر صاحب الطلب");
    const courier = () => must(assigned, "هذا الإجراء للمندوب المسؤول");
    if (a === "edit") {
      merchant();
      requireState(BEFORE);
      validateOrder({ ...o, ...p });
      const fields = [
        "amount",
        "count",
        "weight",
        "length",
        "width",
        "height",
        "nature",
        "vehicle",
        "vehicles",
        "baseFee",
        "fee",
        "returnFee",
        "feePayer",
        "service",
        "recipient",
        "sender",
        "notes",
        "photo",
      ];
      for (const k of fields) if (p[k] !== undefined) o[k] = copy(p[k]);
      rememberOrderPlaces(u, o, id);
      o.offerRound = (o.offerRound || 0) + 1; o.waitNotified = false;
      if (["reserved", "approaching"].includes(o.status)) o.editPending = true;
      change(
        o,
        o.status,
        "تم تعديل البيانات" +
          (o.editPending ? " — بانتظار موافقة المندوب" : ""),
      );
      return;
    }
    if (a === "keep_edit" || a === "decline_edit") {
      courier();
      must(o.editPending, "لا يوجد تعديل معلق");
      if (a === "decline_edit")
        release(o, "رفض التعديل — لا يحتسب إلغاء على المندوب");
      else {
        const problem = capacityProblem(u, o, data.orders, data.config);
        must(!problem, problem);
        o.editPending = false;
        change(o, o.status, "وافق المندوب على البيانات الجديدة");
      }
      return;
    }
    if (a === "delete") {
      merchant();
      requireState(["draft"]);
      data.orders = data.orders.filter((x) => x.id !== o.id);
      return;
    }
    if (a === "publish" || a === "unpublish" || a === "cancel") {
      merchant();
      requireState(
        a === "publish"
          ? ["draft"]
          : a === "unpublish"
            ? ["published"]
            : BEFORE.filter((s) => s !== "draft"),
      );
      if (a === "publish") o.exclusionPending = false;
      if (a === "cancel") o.settled = true;
      change(
        o,
        a === "publish"
          ? "published"
          : a === "unpublish"
            ? "draft"
            : "cancelled",
      );
      o.publishedAt = now();
      o.offerRound = (o.offerRound || 0) + 1; o.waitNotified = false;
      return;
    }
    if (a === "resolve_exclusion") {
      merchant(); requireState(["draft"]);
      must(o.exclusionPending, "لا يوجد طلب مستثنى بانتظار القرار");
      must(["published", "draft"].includes(p.resolution), "اختر إعادة النشر أو إبقاءه محفوظاً");
      o.exclusionPending = false; o.publishedAt = p.resolution === "published" ? now() : null;
      o.offerRound = (o.offerRound || 0) + 1; o.waitNotified = false;
      change(o, p.resolution, p.resolution === "published" ? "أعاد التاجر نشر الطلب المستثنى" : "أبقى التاجر الطلب المستثنى محفوظاً للتعديل");
      return;
    }
    if (a === "reserve") {
      must(u.role === "courier", "للمندوب فقط");
      reserve(o, u);
      return;
    }
    if (a === "offer") {
      must(
        u.role === "courier" && eligible(u, o, data.config),
        "الطلب لا يناسبك",
      );
      requireState(["published"]);
      must(
        Date.now() - Date.parse(o.publishedAt || o.createdAt) >=
          data.config.offerAfterMinutes * 60000,
        "لم تنته مهلة اقتراح الأجرة",
      );
      const problem = capacityProblem(u, o, data.orders, data.config);
      must(!problem, problem);
      must(money(p.fee) && Number(p.fee) > 0 && Number(p.fee) >= o.returnFee && (o.service !== "vip" || Number(p.fee) >= o.baseFee + data.config.vipSurcharge), "أجرة العرض لا تغطي أجور الراجع أو زيادة VIP");
      data.offers = data.offers.filter((v) => !(v.orderId === o.id && v.owner === u.id));
      data.offers.push({
        id: id("OFFER"),
        owner: u.id,
        name: u.name,
        orderId: o.id,
        round: o.offerRound || 0,
        vehicle: u.vehicle,
        fee: Number(p.fee),
        at: now(),
      });
      notify(o.merchant, "وصل عرض أجرة جديد", o.id);
      return;
    }
    if (a === "accept_offer") {
      merchant();
      const offer = data.offers.find(
        (v) => v.id === p.offer && v.orderId === o.id,
      );
      must(offer && (offer.round || 0) === (o.offerRound || 0), "العرض لم يعد متاحاً؛ اطلب عرضاً جديداً");
      must(offer.fee >= o.returnFee && (o.service !== "vip" || offer.fee >= o.baseFee + data.config.vipSurcharge), "العرض لا يغطي أجور الطلب");
      reserve(
        o,
        data.users.find((c) => c.id === offer.owner),
      );
      o.fee = offer.fee;
      change(o, o.status, "وافق التاجر على عرض " + offer.name + " بأجرة " + offer.fee + " د.ع وحُجز الطلب له");
      return;
    }
    if (a === "raise_fee") {
      merchant();
      requireState(["published"]);
      must(Number(p.fee) > o.fee, "الأجرة الجديدة يجب أن تكون أعلى");
      o.fee = Number(p.fee);
      o.offerRound = (o.offerRound || 0) + 1; o.waitNotified = false;
      change(o, o.status, "زيادة أجرة التوصيل");
      return;
    }
    if (a === "extend") {
      courier();
      requireState(["reserved", "approaching"]);
      must(Date.parse(o.deadline) > Date.now(), "انتهت مهلة الحجز");
      const used = o.extensionMinutes ?? (o.extended ? Math.ceil(o.originalMinutes / 2) : 0);
      const max = Math.ceil(o.originalMinutes / 2) - used;
      const minutes = Number(p.minutes);
      must(Number.isInteger(minutes) && minutes >= 1 && minutes <= max, "تجاوزت الحد المتبقي للتمديد");
      o.deadline = new Date(Date.parse(o.deadline) + minutes * 60000).toISOString();
      o.extensionMinutes = used + minutes;
      o.extended = true;
      o.extensionRequest = null;
      change(o, o.status, "مدد المندوب مهلة الوصول " + minutes + " دقيقة");
      return;
    }
    if (a === "approve_retry") {
      merchant();
      requireState(["retry"]);
      o.retryApproved = true;
      change(o, o.status, "وافق التاجر على إعادة المحاولة");
      return;
    }
    if (a === "partial_approve") {
      merchant();
      must(o.partial && !o.partial.approved, "لا يوجد اقتراح");
      o.partial.approved = true;
      change(o, o.status, "موافقة على التسليم الجزئي");
      return;
    }
    if (a === "receive_return") {
      merchant();
      requireState(["returning"]);
      must(o.returnArrived && p.inspected, "أكد فحص المرتجع بعد وصول المندوب");
      o.returnReceived = true;
      change(o, o.status, "التاجر استلم المرتجع");
      return;
    }
    if (a === "chat") {
      must(own || assigned, "محادثة أطراف الطلب فقط");
      must(o.courier && p.text?.trim(), "اكتب رسالة لطلب محجوز");
      data.messages.unshift({
        id: id("MSG"),
        owner: u.id,
        name: u.name,
        orderId: o.id,
        text: p.text.trim(),
        at: now(),
      });
      notify(own ? o.courier : o.merchant, "رسالة جديدة", o.id);
      return;
    }
    if (a === "rate") {
      must(
        (own || assigned) &&
          o.settled &&
          ["delivered", "returned", "completed"].includes(o.status),
        "التقييم بعد اكتمال التسوية",
      );
      must(
        !data.ratings.some((r) => r.owner === u.id && r.orderId === o.id),
        "تم تقييم الطلب",
      );
      must(
        Number.isInteger(Number(p.stars)) && p.stars >= 1 && p.stars <= 5,
        "التقييم من 1 إلى 5",
      );
      data.ratings.push({
        id: id("R"),
        owner: u.id,
        target: own ? o.courier : o.merchant,
        orderId: o.id,
        stars: Number(p.stars),
        text: p.text || "",
        at: now(),
      });
      return;
    }
    if (a === "return" && own) {
      requireState(["failed", "retry"]);
      change(o, "return_pending");
      return;
    }
    courier();
    if (a === "release") {
      requireState(["reserved", "approaching", "arrived", "waiting"]);
      must(p.reason, "حدد سبب الإلغاء");
      u.cancellations.push({ at: now(), reason: p.reason, orderId: o.id });
      if (data.config.penaltiesEnabled) {
        const n = u.cancellations.filter(
          (c) => c.at.slice(0, 10) === now().slice(0, 10),
        ).length;
        if (n >= 2)
          u.restrictedUntil = new Date(
            Date.now() +
              (n === 2
                ? data.config.cancelSecondMinutes
                : data.config.cancelThirdMinutes) *
                60000,
          ).toISOString();
      }
      release(o, p.reason);
      return;
    }
    if (a === "depart") {
      requireState(["reserved"]);
      change(o, "approaching");
      return;
    }
    if (a === "arrive") {
      requireState(["reserved", "approaching"]);
      must(!o.editPending, "وافق على التعديل أولاً");
      const point = p.location || u.location;
      must(point && Number.isFinite(point.lat) && Number.isFinite(point.lng), "تعذر تحديد الموقع؛ حدّث GPS");
      must(!p.accuracy || p.accuracy <= data.config.arrivalRadiusKm * 1000, "دقة GPS ضعيفة؛ أعد المحاولة");
      const near =
        distance(point, o.sender.location) <= data.config.arrivalRadiusKm;
      must(
        near,
        "لم تصل إلى نطاق الاستلام بعد؛ اقترب وحدّث GPS",
      );
      o.arrivedAt = now();
      o.waitAlerted = false;
      o.deadline = null;
      o.extensionRequest = null;
      o.arrivalNote = near ? "وصول ضمن النطاق" : "وصول يدوي: " + p.reason;
      change(o, "waiting", "تم التحقق من القرب — بانتظار الاستلام");
      return;
    }
    if (a === "wait") {
      requireState(["arrived", "waiting"]);
      change(o, "waiting");
      return;
    }
    if (a === "exclude_pickup") {
      requireState(["arrived", "waiting"]);
      must(p.reason?.trim(), "وضح مشكلة الطلب قبل استثنائه");
      o.exclusionReason = p.reason.trim().slice(0, 300);
      o.exclusionPending = true;
      change(o, "draft", "استثنى المندوب الطلب قبل الاستلام: " + o.exclusionReason);
      o.courier = null; o.courierInfo = null; o.deadline = null; o.publishedAt = null;
      o.offerRound = (o.offerRound || 0) + 1; o.waitNotified = false;
      for (const batch of data.batches.filter((b) => b.ids.includes(o.id))) batch.used = true;
      return;
    }
    if (a === "pickup") {
      requireState(["arrived", "waiting"]);
      must(!o.editPending, "وافق على التعديل أولاً");
      must(String(p.code) === String(o.handoverCode), "رمز الاستلام غير صحيح");
      must(p.inspected && p.paid, "أكد الفحص والدفع");
      const amount = o.kind === "free" ? 0 : o.amount;
      must(u.budget >= amount, "الميزانية لا تكفي");
      o.history.push({
        at: now(),
        actor: u.id,
        status: o.status,
        action: "scan",
        kind: "pickup",
        method: p.scanMethod === "qr" ? "qr" : "manual",
        text:
          p.scanMethod === "qr"
            ? "تم التحقق من QR الاستلام"
            : "تم التحقق من رمز الاستلام يدوياً",
      });
      cash(o, -amount, "دفع قيمة البضاعة للتاجر", "goods-paid");
      o.goodsPaid = true;
      change(o, "received");
      return;
    }
    if (a === "transit") {
      requireState(["received"]);
      change(o, "transit");
      return;
    }
    if (a === "customer_arrive") {
      requireState(["transit", "retry"]);
      must(o.status !== "retry" || o.retryApproved, "الموعد بانتظار الموافقة");
      change(o, "at_customer");
      return;
    }
    if (a === "deliver") {
      requireState(["at_customer"]);
      must(!o.partial?.approved, "أكمل التسليم الجزئي المعتمد");
      must(
        p.confirmed && p.proof?.trim().length >= 8,
        "أكد التسليم وأدخل إثباتاً",
      );
      o.proof = p.proof;
      cash(
        o,
        o.amount + (o.feePayer === "customer" ? o.fee : 0),
        "تحصيل من المستلم",
        "customer-paid",
      );
      change(o, "delivered");
      return;
    }
    if (a === "fail") {
      requireState(["transit", "at_customer", "retry"]);
      must(p.reason, "حدد سبب التعذر");
      o.attempts = (o.attempts || 0) + 1;
      u.failures.push({ at: now(), reason: p.reason, orderId: o.id });
      if (data.config.penaltiesEnabled) {
        const count = u.failures.filter(
          (f) => f.at.slice(0, 10) === now().slice(0, 10),
        ).length;
        if (count >= data.config.failureThreshold) {
          notify(
            u.id,
            "تكررت حالات التعذر؛ راجع الدعم لتحديد المسؤولية قبل أي تقييد",
          );
          u.failureReview = true;
        }
      }
      change(o, "failed", p.reason);
      return;
    }
    if (a === "defer") {
      requireState(["received", "transit", "at_customer"]);
      must(!o.partial?.approved, "أكمل الجزء المعتمد قبل التأجيل");
      must(p.reason?.trim() && Date.parse(p.when) > Date.now(), "حدد سبب التأجيل وموعداً مستقبلياً");
      o.retryAt = p.when;
      o.retryApproved = false;
      o.deferReason = p.reason.trim().slice(0, 300);
      change(o, "retry", "تأجيل بطلب الزبون: " + o.deferReason + " — بانتظار موافقة التاجر على الموعد");
      return;
    }
    if (a === "retry") {
      requireState(["failed"]);
      must(Date.parse(p.when) > Date.now(), "حدد موعداً مستقبلياً");
      o.retryAt = p.when;
      o.retryApproved = false;
      change(o, "retry");
      return;
    }
    if (a === "return") {
      requireState(["failed", "retry"]);
      change(o, "return_pending");
      return;
    }
    if (a === "partial_propose") {
      if (p.returnAmount !== undefined || p.returnCount !== undefined) {
        must(Number(p.returnAmount) > 0 && Number(p.returnAmount) < o.amount && Number.isInteger(Number(p.returnCount)) && Number(p.returnCount) > 0 && Number(p.returnCount) < o.count, "حدد قيمة وعدد القطع المرتجعة ضمن الطلب");
        p = { ...p, amount: o.amount - Number(p.returnAmount), count: o.count - Number(p.returnCount) };
      }
      must(data.config.partialEnabled, "التسليم الجزئي غير متاح");
      requireState(["at_customer"]);
      must(
        o.kind !== "free" &&
          p.count > 0 &&
          p.count < o.count &&
          Number.isInteger(Number(p.count)) &&
          p.amount > 0 &&
          p.amount < o.amount,
        "أدخل عدد وقيمة الجزء المسلم",
      );
      must(!o.partial?.approved, "يوجد تسليم جزئي معتمد");
      o.partial = {
        count: Number(p.count),
        amount: Number(p.amount),
        approved: false,
      };
      change(o, o.status, "اقتراح تسليم جزئي");
      return;
    }
    if (a === "partial_confirm") {
      requireState(["at_customer"]);
      must(o.partial?.approved && p.confirmed, "أكد تحصيل الجزء المعتمد");
      cash(
        o,
        o.partial.amount + (o.feePayer === "customer" ? o.fee : 0),
        "تحصيل الجزء المسلم",
        "customer-paid",
      );
      o.partialDelivered = true;
      change(o, "partial_pending");
      return;
    }
    if (a === "return_start") {
      requireState(["return_pending", "partial_pending"]);
      o.returnCode = String(Math.floor(100000 + Math.random() * 900000));
      change(o, "returning");
      return;
    }
    if (a === "return_arrive") {
      requireState(["returning"]);
      must(!o.returnArrived, "تم تأكيد وصول المرتجع مسبقاً");
      must(
        o.returnCode && String(p.code) === String(o.returnCode),
        "رمز المرتجع غير صحيح",
      );
      o.history.push({
        at: now(),
        actor: u.id,
        status: o.status,
        action: "scan",
        kind: "return",
        method: p.scanMethod === "qr" ? "qr" : "manual",
        text:
          p.scanMethod === "qr"
            ? "تم التحقق من QR المرتجع"
            : "تم التحقق من رمز المرتجع يدوياً",
      });
      o.returnArrived = true;
      change(o, o.status, "وصل المرتجع");
      return;
    }
    if (a === "settle_return") {
      requireState(["returning"]);
      must(
        o.returnReceived && p.confirmed,
        "أكد استرداد القيمة بعد فحص التاجر",
      );
      must(
        money(p.fees) &&
          Number(p.fees) <=
            Number(o.returnFee) +
              (o.partialDelivered && o.feePayer === "customer"
                ? 0
                : Number(o.fee)),
        "الأجور تتجاوز المستحق المتبقي بعد تحصيل الزبون",
      );
      const goods =
        o.kind === "free"
          ? 0
          : o.amount - (o.partialDelivered ? o.partial.amount : 0);
      cash(o, goods, "استرداد قيمة البضاعة المرتجعة", "goods-refund");
      must(
        money(p.fees) &&
          Number(p.fees) <=
            Number(o.returnFee) +
              (o.partialDelivered && o.feePayer === "customer"
                ? 0
                : Number(o.fee)),
        "الأجور تتجاوز المستحق المتبقي بعد تحصيل الزبون",
      );
      cash(
        o,
        Number(p.fees),
        "أجور الذهاب والراجع المتفق عليها",
        "return-fees",
      );
      o.settled = true;
      fee(o);
      change(o, "returned");
      return;
    }
    if (a === "settle_delivery") {
      requireState(["delivered"]);
      must(!o.settled, "تمت التسوية سابقاً");
      must(p.confirmed, "أكد التسوية");
      if (o.feePayer === "merchant")
        cash(o, o.fee, "أجرة التوصيل من التاجر", "merchant-fee");
      o.settled = true;
      fee(o);
      change(o, o.status, "اكتملت التسوية");
      return;
    }
    if (a === "complete") {
      requireState(["delivered", "returned"]);
      must(o.settled, "أكمل التسوية أولاً");
      o.result = o.status;
      change(o, "completed");
      return;
    }
    fail("الإجراء غير متاح");
  }
  return async function api(url, p = {}) {
    // Each tab keeps its selected role, but reads the latest local workspace before mutation.
    try {
      const raw = storage?.getItem(DEMO_STORAGE_KEY);
      if (raw && raw !== lastSavedRaw) {
        const latest = JSON.parse(raw);
        if (
          latest.version === 1 &&
          latest.config &&
          Array.isArray(latest.users) &&
          Array.isArray(latest.orders)
        ) {
          const photos = new Map(
            data.orders.filter((o) => o.photo).map((o) => [o.id, o.photo]),
          );
          data = latest;
          data.config = { ...defaults, ...data.config };
          for (const o of data.orders)
            if (photos.has(o.id)) o.photo = photos.get(o.id);
          lastSavedRaw = raw;
        }
      }
    } catch {}

    if (url === "/api/login") {
      must(["merchant", "courier"].includes(p.role), "اختر الحساب");
      // Public demo credentials select the seeded merchant, never a real account.
      if (p.phone === "iraq") {
        must(
          p.role === "merchant" && p.password === "iraq",
          "اسم المستخدم أو كلمة المرور غير صحيحة",
        );
        const demoMerchant = data.users.find((user) => user.id === "MER-DEMO");
        must(demoMerchant, "الحساب التجريبي غير متوفر");
        currentId = demoMerchant.id;
        data.lastByRole.merchant = demoMerchant.id;
        persist();
        return { user: copy(demoMerchant) };
      }
      const u =
        data.users.find((u) => u.role === p.role && u.phone === p.phone) ||
        data.users.find((u) => u.id === data.lastByRole[p.role]) ||
        data.users.find((u) => u.role === p.role);
      currentId = u.id;
      data.lastByRole[p.role] = u.id;
      persist();
      return { user: copy(u) };
    }
    if (url === "/api/logout") {
      currentId = null;
      return { ok: true };
    }
    if (url === "/api/register") {
      must(
        ["merchant", "courier"].includes(p.role) && p.name?.trim(),
        "أكمل البيانات",
      );
      must(supportedPhone(p.phone), "الهاتف 11 رقماً ويبدأ بـ077 أو078 أو079");
      must(
        !data.users.some((u) => u.phone === p.phone && u.role === p.role),
        "رقم الهاتف مسجل لهذا الدور",
      );
      must(
        p.role !== "courier" || p.password === p.confirmPassword,
        "كلمتا المرور غير متطابقتين",
      );
      must(p.activity !== "ecommerce", "التجارة الإلكترونية قريباً");
      const uid = id(p.role === "merchant" ? "MER" : "COU");
      const { password, confirmPassword, documents, photos, ...v } = p;
      const u = {
        ...v,
        id: uid,
        walletId: "W-" + uid,
        approved: true,
        demo: true,
        available: false,
        budget: 0,
        radius: 5,
        addresses: [],
        customers: [],
        cancellations: [],
        failures: [],
      };
      data.users.push(u);
      data.lastByRole[u.role] = uid;
      persist();
      return { user: copy(u) };
    }
    const u = user();
    sweep();
    if (url === "/api/state") return view();
    if (url === "/api/profile") {
      if (p.action === "location") {
        must(
          p.location &&
            Number.isFinite(p.location.lat) &&
            Number.isFinite(p.location.lng) &&
            Math.abs(p.location.lat) <= 90 &&
            Math.abs(p.location.lng) <= 180,
          "حدد موقعاً صحيحاً على الخريطة",
        );
        u.location = { lat: p.location.lat, lng: p.location.lng };
      } else if (p.action === "readiness") {
        must(
          money(p.budget) && p.radius >= 1 && p.radius <= 100,
          "الميزانية أو النطاق غير صالح",
        );
        Object.assign(u, {
          available: !!p.available,
          budget: Number(p.budget),
          radius: Number(p.radius),
          location: p.location,
        });
        audit("تحديث الميزانية والجاهزية");
      } else if (p.action === "profile") {
        must(
          !data.orders.some(
            (o) => (o.merchant === u.id || o.courier === u.id) && unresolved(o),
          ),
          "أكمل الطلبات والتسويات قبل التعديل",
        );
        if (p.phone2)
          must(supportedPhone(p.phone2), "الهاتف الإضافي غير مدعوم");
        u.pendingProfile = Object.fromEntries(
          profileFields.filter((k) => p[k] !== undefined).map((k) => [k, p[k]]),
        );
        notify(u.id, "طلب تعديل بياناتك قيد مراجعة الإدارة");
      }
      persist();
      return { user: copy(u) };
    }
    if (url === "/api/addresses" || url === "/api/customers") {
      const key = url.endsWith("addresses") ? "addresses" : "customers";
      if (p.action === "delete") u[key] = u[key].filter((x) => x.id !== p.id);
      else {
        must(p.name && p.address && p.area, "أكمل الاسم والمنطقة والعنوان");
        if (key === "customers")
          must(supportedPhone(p.phone), "الهاتف غير مدعوم");
        if (key === "addresses")
          must(
            p.location &&
              Number.isFinite(p.location.lat) &&
              Number.isFinite(p.location.lng),
            "حدد موقع عنوان الاستلام",
          );
        const v = { ...p, id: p.id || id(key === "addresses" ? "ADR" : "CUS") };
        delete v.action;
        const i = u[key].findIndex((x) => x.id === v.id);
        if (i < 0) u[key].push(v);
        else u[key][i] = v;
      }
      persist();
      return copy(u[key]);
    }
    if (url === "/api/support") {
      must(p.category && p.text?.trim(), "حدد المشكلة والتوضيح");
      const o = data.orders.find(
        (o) =>
          o.id === p.orderId && (o.merchant === u.id || o.courier === u.id),
      );
      data.tickets.unshift({
        id: id("T"),
        owner: u.id,
        category: p.category,
        topic: p.topic || "",
        text: p.text,
        orderId: o?.id,
        history: copy(o?.history || []),
        messages: copy(data.messages.filter((m) => m.orderId === o?.id)),
        status: "open",
        replies: [],
        at: now(),
      });
      persist();
      return { ok: true };
    }
    if (url === "/api/local-admin") {
      // Deliberately a local preview console, never a real administrative identity.
      if (p.action === "view")
        return copy({
          users: data.users.map((x) => ({
            id: x.id,
            name: x.name,
            walletId: x.walletId,
            pendingProfile: x.pendingProfile,
            failureReview: x.failureReview,
            cancellations: x.cancellations,
            failures: x.failures,
            restrictedUntil: x.restrictedUntil,
          })),
          tickets: data.tickets,
          settings: data.config,
          audit: data.audit,
          outlets: data.outlets,
        });
      if (p.action === "approve-profile" || p.action === "reject-profile") {
        const target = data.users.find((x) => x.id === p.id);
        must(target?.pendingProfile, "لا يوجد تعديل");
        if (p.action === "approve-profile") {
          must(
            !data.orders.some(
              (o) =>
                (o.merchant === target.id || o.courier === target.id) &&
                unresolved(o),
            ),
            "لا يمكن اعتماد التعديل أثناء وجود طلبات مفتوحة",
          );
          Object.assign(target, target.pendingProfile);
        }
        delete target.pendingProfile;
        notify(target.id, "تمت مراجعة طلب تعديل الملف");
      } else if (p.action === "settings") {
        for (const k of [
          "offerAfterMinutes",
          "arrivalBuffer",
          "extensionPercent",
          "arrivalRadiusKm",
          "commission",
          "freeCommission",
          "vipCommission",
          "subscription",
          "cancelSecondMinutes",
          "cancelThirdMinutes",
          "failureThreshold",
          "failureRestrictionMinutes",
          "waitMinutes",
          "maxCarried",
        ])
          if (p.values[k] !== undefined) {
            must(money(p.values[k]), "قيمة غير صالحة");
            data.config[k] = Number(p.values[k]);
          }
        if (p.values.feesStartAt !== undefined) {
          must(
            !p.values.feesStartAt ||
              Number.isFinite(Date.parse(p.values.feesStartAt)),
            "تاريخ التفعيل غير صالح",
          );
          data.config.feesStartAt = p.values.feesStartAt;
        }
        data.config.penaltiesEnabled = !!p.values.penaltiesEnabled;
        data.config.returnCommission = !!p.values.returnCommission;
        data.config.commissionMode =
          p.values.commissionMode === "percent" ? "percent" : "fixed";
        audit("تعديل الإعدادات: " + JSON.stringify(p.values));
      } else if (p.action === "reply") {
        const t = data.tickets.find((t) => t.id === p.id);
        must(t && p.text?.trim(), "التذكرة أو الرد غير صالح");
        t.replies.push({ text: p.text, at: now() });
        t.status = p.close ? "closed" : "open";
        notify(t.owner, "رد جديد على تذكرة الدعم");
      } else if (p.action === "topup") {
        const target = data.users.find(
          (x) => x.id === p.account || x.walletId === p.account,
        );
        const outlet = data.outlets.find((x) => x.id === p.outlet);
        must(
          target && outlet && money(p.amount) && Number(p.amount) > 0,
          "بيانات الشحن غير صحيحة",
        );
        must(outlet.balance >= Number(p.amount), "رصيد المنفذ لا يكفي");
        outlet.balance -= Number(p.amount);
        data.ledger.push({
          id: id("W"),
          owner: target.id,
          amount: Number(p.amount),
          reason: "شحن تجريبي من " + outlet.name,
          at: now(),
        });
        notify(target.id, "تم شحن المحفظة تجريبياً");
      } else if (p.action === "outlet") {
        must(p.name && supportedPhone(p.phone), "اسم المنفذ والهاتف مطلوبان");
        data.outlets.push({
          id: id("OUT"),
          name: p.name,
          phone: p.phone,
          address: p.address,
          location: p.location,
          balance: 0,
        });
      } else if (p.action === "review-failure") {
        const target = data.users.find((x) => x.id === p.id);
        must(target && p.reason?.trim(), "حدد الحساب وسبب القرار");
        if (p.restrict && data.config.penaltiesEnabled)
          target.restrictedUntil = new Date(
            Date.now() + data.config.failureRestrictionMinutes * 60000,
          ).toISOString();
        else target.restrictedUntil = null;
        target.failureReview = false;
        audit("مراجعة قيد " + target.id + ": " + p.reason);
        notify(target.id, "تمت مراجعة حالات التعذر: " + p.reason);
      } else if (p.action === "fund-outlet") {
        const target = data.outlets.find((x) => x.id === p.id);
        must(
          target && money(p.amount) && Number(p.amount) > 0,
          "المبلغ غير صالح",
        );
        target.balance += Number(p.amount);
      } else if (p.action === "subscription") {
        const period = new Date().toISOString().slice(0, 7);
        for (const target of data.users.filter((x) => x.role === "merchant"))
          if (
            !data.ledger.some(
              (r) =>
                r.owner === target.id &&
                r.period === period &&
                r.kind === "subscription",
            ) &&
            data.config.subscription > 0 &&
            feesActive()
          )
            data.ledger.push({
              id: id("W"),
              owner: target.id,
              amount: -data.config.subscription,
              reason: "اشتراك شهري تجريبي",
              period,
              kind: "subscription",
              at: now(),
            });
      }
      audit("إدارة محلية: " + p.action);
      persist();
      return { ok: true };
    }
    if (url === "/api/batch") {
      if (p.action === "create") {
        must(u.role === "merchant", "للتاجر فقط");
        const list = data.orders.filter((o) => p.ids.includes(o.id));
        must(
          list.length === new Set(p.ids).size && list.length > 0,
          "اختر الطلبات",
        );
        const first = list[0];
        must(
          list.every(
            (o) =>
              o.merchant === u.id &&
              o.courier === first.courier &&
              o.courier &&
              ["arrived", "waiting"].includes(o.status) &&
              (o.sender.addressId || o.sender.address) ===
                (first.sender.addressId || first.sender.address),
          ),
          "اختر طلبات وصلت لنفس المندوب والعنوان",
        );
        const code = String(Math.floor(100000 + Math.random() * 900000));
        data.batches.push({
          id: id("B"),
          merchant: u.id,
          courier: first.courier,
          ids: list.map((o) => o.id),
          code,
          used: false,
          at: now(),
        });
        persist();
        return { code };
      }
      const b = data.batches.find(
        (b) => b.courier === u.id && b.code === p.code && !b.used,
      );
      must(b, "رمز المجموعة غير صحيح");
      const list = b.ids.map((oid) => data.orders.find((o) => o.id === oid));
      must(
        list.every(
          (o) =>
            o &&
            o.courier === u.id &&
            ["arrived", "waiting"].includes(o.status) &&
            !o.editPending,
        ),
        "تغيرت حالة مجموعة الطلبات؛ اطلب رمزاً جديداً",
      );
      must(
        p.inspected &&
          p.paid &&
          u.budget >=
            list.reduce((n, o) => n + (o.kind === "free" ? 0 : o.amount), 0),
        "أكد الفحص والدفع وتوفر الميزانية",
      );
      for (const o of list)
        act(o, {
          action: "pickup",
          code: o.handoverCode,
          inspected: true,
          paid: true,
        });
      b.used = true;
      persist();
      return { ok: true };
    }
    if (url === "/api/order-places") {
      must(u.role === "merchant", "للتاجر فقط");
      validateOrder(p);
      rememberOrderPlaces(u, copy(p), id);
      persist();
      return { ok: true };
    }
    if (url === "/api/orders") {
      must(u.role === "merchant", "للتاجر فقط");
      must(!p.publish || online(), "احفظ مسودة أثناء انقطاع الإنترنت");
      validateOrder(p);
      const o = {
        ...copy(p),
        id: id("ORD"),
        merchant: u.id,
        courier: null,
        sender:
          p.kind === "free"
            ? p.sender
            : {
                name: u.name,
                phone: u.phone,
                phone2: u.phone2,
                province: u.province,
                area: p.sender?.area || u.area,
                address: p.sender?.address || u.address,
                location: p.sender?.location || u.location,
                addressId: p.sender?.addressId || u.id,
              },
        status: p.publish ? "published" : "draft",
        settled: false,
        goodsPaid: false,
        demo: true,
        history: [],
        createdAt: now(),
        publishedAt: p.publish ? now() : null,
        attempts: 0,
        handoverCode: String(Math.floor(100000 + Math.random() * 900000)),
      };
      data.orders.push(o);
      change(o, o.status, "إنشاء الطلب");
      rememberOrderPlaces(u, o, id);
      persist();
      return visible(o, u);
    }
    const match = url.match(/^\/api\/orders\/([^/]+)\/action$/);
    if (match) {
      const o = data.orders.find((o) => o.id === decodeURIComponent(match[1]));
      must(o, "الطلب غير موجود");
      must(canView(u, o), "الطلب غير متاح لهذا الحساب");
      must(
        online() || (p.action === "edit" && o.status === "draft"),
        "هذا الإجراء يحتاج اتصالاً؛ البيانات المحفوظة متاحة للقراءة",
      );
      act(o, p);
      persist();
      return visible(o, u);
    }
    fail("الصفحة غير موجودة", 404);
  };
}
