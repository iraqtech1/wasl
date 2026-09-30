const awaiting = ["reserved", "approaching", "arrived", "waiting"];
const active = (o) => !["cancelled", "completed"].includes(o.status) && !(o.settled && ["delivered", "returned"].includes(o.status));
export function capacityProblem(courier, order, orders, settings) {
  const held = orders.filter((o) => o.id !== order.id && o.courier === courier.id && active(o));
  if (held.some((o) => o.service === "vip") || (order.service === "vip" && held.length))
    return "يجب التفرغ لطلب VIP حتى إكماله وتسويته";
  const limit = settings.maxCarried || settings.maxLoads?.[courier.vehicle] || 0;
  if (limit && held.length >= limit) return "بلغت حد الطلبات المحمولة";
  const committed = held.filter((o) => awaiting.includes(o.status) && !o.goodsPaid)
    .reduce((sum, o) => sum + (o.kind === "free" ? 0 : Number(o.amount)), 0);
  if (committed + (order.kind === "free" ? 0 : Number(order.amount)) > Number(courier.budget))
    return "الميزانية المتبقية بعد الحجوزات لا تكفي لهذا الطلب";
  const load = held.filter((o) => !["delivered", "returned"].includes(o.status))
    .reduce((sum, o) => sum + Number(o.weight), 0);
  if (load + Number(order.weight) > settings.vehicleKg[courier.vehicle])
    return "مجموع أوزان الطلبات يتجاوز سعة المركبة";
  return "";
}
