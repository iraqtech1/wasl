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
  completed: "منتهي",
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
  const extraCouriers = [
    ["علي كريم", "sedan", null, "الكرادة", 33.305, 44.425],
    ["مصطفى سالم", "sedan", null, "المنصور", 33.32, 44.35],
    ["أحمد فاضل", "sedan", null, "زيونة", 33.33, 44.465],
    ["حسن ناظم", "motorcycle", null, "الجادرية", 33.28, 44.395],
    ["عمر سجاد", "motorcycle", null, "الكرادة", 33.31, 44.435],
    ["محمد رائد", "motorcycle", null, "بغداد الجديدة", 33.315, 44.49],
    ["حسين عادل", "refrigerated", "chilled", "الأعظمية", 33.365, 44.375],
    ["عباس مهند", "refrigerated", "chilled", "المنصور", 33.325, 44.355],
    ["سجاد قاسم", "refrigerated", "frozen", "الدورة", 33.25, 44.4],
    ["كرار ماجد", "refrigerated", "frozen", "زيونة", 33.335, 44.46],
  ].map(([name, vehicle, cooling, area, lat, lng], index) => {
    const id = "COU-DEMO-" + String(index + 1).padStart(2, "0");
    return {
      ...structuredClone(courier),
      id,
      name,
      phone: "077000001" + String(index + 1).padStart(2, "0"),
      walletId: "W-" + id,
      vehicle,
      cooling,
      area,
      address: "بغداد، " + area + " — عنوان تجريبي",
      location: { lat, lng },
      plate: "بغداد " + (20001 + index),
    };
  });
  const at = new Date().toISOString();
  const sampleRecipients = [
    [
      "أحمد سامر",
      "المنصور",
      "شارع الرواد — بناية الربيع، الطابق الثاني",
      33.32,
      44.35,
    ],
    [
      "زينب علي",
      "زيونة",
      "شارع الربيعي — قرب مجمع المحلات، دار 12",
      33.33,
      44.46,
    ],
    ["مصطفى كريم", "الجادرية", "شارع الجامعة — محلة 21، زقاق 8", 33.28, 44.4],
    [
      "نور حسين",
      "الكرادة",
      "الكرادة داخل — قرب مكتبة الندى، دار 7",
      33.3,
      44.43,
    ],
    ["حسن ماجد", "المنصور", "شارع 14 رمضان — مجمع النخيل، محل 4", 33.33, 44.36],
    [
      "مريم عادل",
      "زيونة",
      "شارع فلسطين — قرب حديقة الحي، دار 25",
      33.34,
      44.45,
    ],
    [
      "علي سجاد",
      "الجادرية",
      "شارع الوزراء — بناية الياسمين، شقة 3",
      33.29,
      44.41,
    ],
    [
      "فاطمة رائد",
      "الكرادة",
      "الكرادة خارج — شارع العطار، دار 18",
      33.31,
      44.42,
    ],
    ["عمر قاسم", "المنصور", "حي دراغ — شارع الزيتون، دار 9", 33.32, 44.34],
    ["سارة مهند", "زيونة", "شارع الربيعي — مجمع الزهور، شقة 6", 33.32, 44.45],
    ["يوسف حازم", "الجادرية", "قرب جسر الجادرية — زقاق 5، دار 14", 33.27, 44.4],
    [
      "رقية وسام",
      "الكرادة",
      "شارع الصناعة — بناية دجلة، الطابق الأول",
      33.31,
      44.44,
    ],
  ];
  const orders = Array.from(
    { length: 54 },
    (_, index) => Object.keys(statuses)[index % 18],
  ).map((status, index) => ({
    id: "ORD-DEMO-" + String(index + 1).padStart(4, "0"),
    merchant: merchant.id,
    courier: ["draft", "published", "cancelled"].includes(status)
      ? null
      : courier.id,
    status,
    kind: "merchant",
    service: index % 3 === 2 ? "vip" : "normal",
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
      name: sampleRecipients[index % sampleRecipients.length][0],
      phone: "0778800" + String(index + 1).padStart(4, "0"),
      province: "بغداد",
      area: sampleRecipients[index % sampleRecipients.length][1],
      address: sampleRecipients[index % sampleRecipients.length][2],
      location: {
        lat: sampleRecipients[index % sampleRecipients.length][3],
        lng: sampleRecipients[index % sampleRecipients.length][4],
      },
    },
    notes:
      [
        "ملابس جاهزة — الاتصال قبل الوصول",
        "عناية بالبشرة — يرجى إبقاء العبوة مستقيمة",
        "أحذية — التسليم بعد الساعة الرابعة",
        "هدايا مغلفة — التعامل بحذر",
      ][index % 4] + " (بيانات وهمية للفحص)",
    demo: true,
    createdAt: at,
    updatedAt: at,
    settled: ["delivered", "returned", "cancelled", "completed"].includes(
      status,
    ),
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
  const vehicles = ["motorcycle", "sedan", "refrigerated"];
  const additions = Object.keys(statuses).flatMap((status, stateIndex) =>
    Array.from({ length: 20 }, (_, index) => {
      const order = structuredClone(orders.find(o => o.status === status));
      const number = stateIndex * 20 + index + 1;
      const vehicle = vehicles[index % vehicles.length];
      const person = sampleRecipients[(index + stateIndex) % sampleRecipients.length];
      const driver = [courier, ...extraCouriers].find(c => c.vehicle === vehicle);
      const date = new Date(Date.now() - (index * 3 + stateIndex) * 3600000).toISOString();
      return {
        ...order,
        id: `ORD-SAMPLE-OCT-${String(number).padStart(4, "0")}`,
        vehicle, vehicles: [vehicle],
        courier: order.courier ? driver.id : null,
        nature: vehicle === "refrigerated" ? "cold" : "normal",
        service: "normal", amount: 10000 + number * 500,
        count: 2 + index % 5, weight: 1 + index % 4,
        length: 15 + index % 6, width: 12 + index % 5, height: 10 + index % 4,
        baseFee: 4000 + (index % 4) * 1000, fee: 4000 + (index % 4) * 1000,
        feePayer: index % 2 ? "merchant" : "customer",
        recipient: {
          name: person[0], phone: "0779900" + String(number).padStart(4, "0"),
          province: "بغداد", area: person[1], address: `${person[2]} — وحدة ${index + 1}`,
          landmark: ["قرب المدرسة", "مقابل الصيدلية", "بجانب السوق", "قرب الجامع"][index % 4],
          location: { lat: person[3] + index * 0.0001, lng: person[4] + index * 0.0001 },
        },
        notes: `${vehicle === "refrigerated" ? "مواد غذائية مبردة" : ["ملابس", "كتب", "إكسسوارات", "هدايا"][index % 4]} — بيانات تجريبية ${number}`,
        createdAt: date, updatedAt: date, publishedAt: date,
        history: [{ at: date, actor: "DEMO", text: "طلب تجريبي — " + statuses[status], status }],
      };
    }),
  );
  orders.push(...additions);
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
    expandedDemoCatalog: true,
    expandedOctoberOrders: true,
    expandedDemoCouriers: true,
    users: [merchant, courier, ...extraCouriers],
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
  offerAfterMinutes: 10,
  arrivalBuffer: 30,
  arrivalRadiusKm: 0.3,
  penaltiesEnabled: false,
  cancelSecondMinutes: 60,
  failureThreshold: 3,
  failureRestrictionMinutes: 180,
  waitMinutes: 15,
  feesStartAt: "",
  maxCarried: 0,
  cancelThirdMinutes: 180,
  commissionMode: "fixed",
  freeCommission: 0,
  vipCommission: 0,
  returnCommission: false,
  extensionPercent: 50,
  vehicleKg: { motorcycle: 20, sedan: 100, truck: 2000, refrigerated: 1000 },
  vehicleCm: { motorcycle: 80, sedan: 150, truck: 500, refrigerated: 400 },
};
