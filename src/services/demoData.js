// Synthetic, browser-only data for designing and testing the Vue interface.
export const statuses = {
  draft: "محفوظ",
  published: "منشور",
  reserved: "بانتظار المندوب",
  approaching: "المندوب في الطريق إلى التاجر",
  arrived: "المندوب وصل",
  waiting: "بانتظار الاستلام",
  received: "تم الاستلام",
  transit: "قيد التوصيل",
  at_customer: "وصل إلى الزبون",
  delivered: "تم التسليم",
  failed: "تعذر التسليم",
  retry: "إعادة محاولة التوصيل",
  return_pending: "بانتظار الإرجاع",
  returning: "قيد الإرجاع",
  partial_pending: "تسليم جزئي — بانتظار إرجاع المتبقي",
  returned: "تم الإرجاع",
  cancelled: "ملغي",
};
export function createDemoData() {
  const location = { lat: 33.3, lng: 44.43 };
  const merchant = {
    id: "MER-DEMO",
    role: "merchant",
    name: "متجر الأناقة للملابس",
    phone: "07700000001",
    province: "بغداد",
    area: "الكرادة",
    address: "الكرادة داخل — قرب المسرح الوطني",
    location,
    approved: true,
    demo: true,
    walletId: "W-MER-DEMO",
    customers: [],
    motivational: true,
  };
  const courier = {
    ...merchant,
    id: "COU-DEMO",
    role: "courier",
    name: "حيدر جاسم",
    phone: "07700000002",
    walletId: "W-COU-DEMO",
    vehicle: "sedan",
    plate: "بغداد 12345",
    available: true,
    budget: 500000,
    radius: 5,
  };
  const at = new Date().toISOString();
  const orders = Object.keys(statuses).map((status, index) => ({
    id: "ORD-DEMO-" + String(index + 1).padStart(4, "0"),
    merchant: merchant.id,
    courier: ["draft", "published", "cancelled"].includes(status)
      ? null
      : courier.id,
    status,
    kind: "merchant",
    service: index === 2 ? "vip" : "normal",
    collection: "none",
    nature: "normal",
    vehicle: "sedan",
    amount: 20000 + index * 2500,
    count: 3,
    weight: 2,
    length: 20,
    width: 20,
    height: 20,
    baseFee: 5000,
    fee: 5000,
    returnFee: 3000,
    feePayer: "customer",
    sender: { ...merchant },
    recipient: {
      name: "مستلم تجريبي " + (index + 1),
      phone: "0778800" + String(index + 1).padStart(4, "0"),
      province: "بغداد",
      area: ["المنصور", "زيونة", "الجادرية"][index % 3],
      address: "عنوان تجريبي " + (index + 1),
      location: { lat: 33.31, lng: 44.44 },
    },
    notes: "طلب تجريبي لتصميم وفحص الواجهة",
    demo: true,
    createdAt: at,
    updatedAt: at,
    settled: ["delivered", "returned", "cancelled"].includes(status),
    goodsPaid: ![
      "draft",
      "published",
      "reserved",
      "approaching",
      "arrived",
      "waiting",
      "cancelled",
    ].includes(status),
    handoverCode: "123456",
    attempts: 1,
    retryAt:
      status === "retry" ? new Date(Date.now() + 86400000).toISOString() : null,
    retryApproved: false,
    partial:
      status === "partial_pending"
        ? { count: 1, amount: 5000, approved: true }
        : null,
    returnArrived: status === "returning",
    returnReceived: false,
    history: [
      {
        at,
        actor: "DEMO",
        text: "بيانات تجريبية — " + statuses[status],
        status,
      },
    ],
  }));
  merchant.customers = orders.slice(0, 3).map((o) => o.recipient);
  const ledger = [
    {
      id: "W1",
      owner: merchant.id,
      amount: 175000,
      reason: "إضافة تجريبية",
      at,
    },
    { id: "W2", owner: merchant.id, amount: -12500, reason: "خصم تجريبي", at },
    {
      id: "W3",
      owner: courier.id,
      amount: 110000,
      reason: "إضافة تجريبية",
      at,
    },
    { id: "W4", owner: courier.id, amount: -8500, reason: "خصم تجريبي", at },
  ];
  return {
    version: 1,
    users: [merchant, courier],
    orders,
    ledger,
    cashLedger: [],
    messages: [],
    ratings: [],
    offers: [],
    notifications: [
      {
        id: "N1",
        owner: merchant.id,
        text: "أهلاً بك في حساب التاجر التجريبي",
        at,
      },
      {
        id: "N2",
        owner: courier.id,
        text: "أهلاً بك في حساب المندوب التجريبي",
        at,
      },
    ],
    lastByRole: { merchant: merchant.id, courier: courier.id },
  };
}
export const settings = {
  freeService: true,
  commission: 0,
  subscription: 0,
  vipSurcharge: 3000,
  partialEnabled: true,
  maxAttempts: 3,
  extensionPercent: 50,
  vehicleKg: { motorcycle: 20, sedan: 100, truck: 2000, refrigerated: 1000 },
  vehicleCm: { motorcycle: 80, sedan: 150, truck: 500, refrigerated: 400 },
};
