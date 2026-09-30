import { defineComponent, h, ref, onMounted, onBeforeUnmount } from "vue";
export default defineComponent({
  props: { order: Object },
  setup(props) {
    const now = ref(Date.now());
    let timer;
    onMounted(() => { timer = setInterval(() => { now.value = Date.now(); }, 1000); });
    onBeforeUnmount(() => clearInterval(timer));
    return () => {
      const o = props.order;
      if (!o.deadline || !["reserved", "approaching"].includes(o.status)) return null;
      const seconds = Math.max(0, Math.ceil((Date.parse(o.deadline) - now.value) / 1000));
      return h("div", { class: "status-note" }, [
        h("strong", {}, `مهلة الاستلام: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`),
        h("p", {}, `المدة الأصلية تقريباً ${o.originalMinutes} دقيقة${Number.isFinite(o.pickupDistanceKm) ? ` — ${o.pickupDistanceKm.toFixed(1)} كم إلى التاجر` : ""}`),
        h("small", {}, "تقدير حسب المسافة المباشرة مع هامش للتأخير؛ حركة المرور غير محسوبة."),
        seconds <= 120 ? h("p", { role: "status" }, seconds ? "الوقت قرب ينتهي؛ أكّد الوصول أو اختر تمديد المهلة ضمن الحد المتاح." : "انتهت مهلة الوصول؛ جارٍ تحديث حالة الحجز.") : null,
      ]);
    };
  },
});
