<script setup>
import { computed, ref } from "vue";
import { api } from "../services/api.js";
import { readDeviceDrafts } from "../services/sampleDrafts.js";
const props = defineProps({ user: Object, draftId: String, offline: Boolean });
const emit = defineEmits(["back", "done"]);
const draft = computed(() => readDeviceDrafts(props.user).find(d => d.localDraftId === props.draftId));
const busy = ref(false), error = ref("");
const vehicles = { motorcycle: "دراجة", sedan: "سيارة صالون", truck: "شاحنة", refrigerated: "سيارة مبردة" };
const money = value => Number(value || 0).toLocaleString("en-US") + " د.ع";
async function act(action) {
  if (busy.value || !draft.value) return;
  busy.value = true; error.value = "";
  try {
    if (action !== "delete") {
      if (props.offline || navigator.onLine === false) throw Error("اتصل بالإنترنت لحفظ أو نشر الطلب");
      const { localDraftId, ...data } = draft.value;
      await api("/api/orders", { ...data, publish: action === "publish" });
    }
    const remaining = readDeviceDrafts(props.user).filter(d => d.localDraftId !== props.draftId);
    localStorage.setItem("wasel-offline-" + props.user.id, JSON.stringify(remaining));
    emit("done", action === "delete" ? "تم حذف المسودة" : action === "publish" ? "تم نشر الطلب" : "تم حفظ الطلب");
  } catch (e) { error.value = e.message; }
  finally { busy.value = false; }
}
</script>
<template>
  <section class="surface device-draft-page">
    <button type="button" class="secondary-button" :disabled="busy" @click="emit('back')">الرجوع إلى المسودات</button>
    <h2>تفاصيل الطلب — مسودة</h2>
    <template v-if="draft">
      <h3>المستلم</h3>
      <dl>
        <div><dt>الاسم</dt><dd>{{ draft.recipient?.name }}</dd></div>
        <div><dt>الهاتف</dt><dd dir="ltr">{{ draft.recipient?.phone }}</dd></div>
        <div v-if="draft.recipient?.phone2"><dt>رقم إضافي</dt><dd dir="ltr">{{ draft.recipient.phone2 }}</dd></div>
        <div><dt>الموقع</dt><dd>{{ [draft.recipient?.province, draft.recipient?.area, draft.recipient?.address].filter(Boolean).join('، ') }}</dd></div>
        <div v-if="draft.recipient?.landmark"><dt>نقطة دالة</dt><dd>{{ draft.recipient.landmark }}</dd></div>
      </dl>
      <h3>المرسل</h3>
      <dl><div><dt>اسم المتجر</dt><dd>{{ draft.sender?.name || user.name }}</dd></div><div><dt>مكان الاستلام</dt><dd>{{ [draft.sender?.area, draft.sender?.address].filter(Boolean).join('، ') }}</dd></div></dl>
      <h3>الشحنة والأجور</h3>
      <dl>
        <div><dt>وسيلة النقل</dt><dd>{{ (draft.vehicles || [draft.vehicle]).map(v => vehicles[v] || v).join(' أو ') }}</dd></div>
        <div><dt>نوع الخدمة</dt><dd>{{ draft.service === 'vip' ? 'VIP' : 'عادي' }}</dd></div>
        <div><dt>الشحنة</dt><dd>{{ draft.count }} قطع · {{ draft.weight }} كغم</dd></div>
        <div><dt>الأبعاد</dt><dd>{{ draft.length }} × {{ draft.width }} × {{ draft.height }} سم</dd></div>
        <div><dt>كلفة البضاعة</dt><dd>{{ money(draft.amount) }}</dd></div>
        <div><dt>أجرة التوصيل</dt><dd>{{ money(draft.fee) }}</dd></div>
        <div><dt>أجرة الراجع</dt><dd>{{ money(draft.returnFee) }}</dd></div>
        <div><dt>الأجرة على</dt><dd>{{ draft.feePayer === 'merchant' ? 'التاجر' : 'الزبون' }}</dd></div>
      </dl>
      <p v-if="draft.notes">{{ draft.notes }}</p>
      <p v-if="offline" class="status-note">الحفظ والنشر متاحان عند الاتصال بالإنترنت.</p>
      <p v-if="error" role="alert" class="inline-error">{{ error }}</p>
      <div class="order-actions">
        <button type="button" class="primary-button" :disabled="busy || offline" @click="act('publish')">نشر الطلب</button>
        <button type="button" class="secondary-button" :disabled="busy || offline" @click="act('save')">حفظ الطلب</button>
        <button type="button" class="secondary-button danger" :disabled="busy" @click="act('delete')">حذف المسودة</button>
      </div>
    </template>
    <p v-else>هذه المسودة حُذفت أو تم حفظها أو نشرها.</p>
  </section>
</template>
<style scoped>
dl{margin:0}dl>div{display:flex;justify-content:space-between;gap:16px;padding:10px 0;border-bottom:1px solid #8ca4b630}dt{color:inherit;opacity:.8}dd{margin:0;text-align:end;font-weight:700;overflow-wrap:anywhere;min-width:0}.order-actions{margin-top:20px}h3{margin-top:24px}
</style>
