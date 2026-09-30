<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import LocationMap from "./LocationMap.js";
import { phoneDigits } from "../renderers/helpers.js";
import { api } from "../services/api.js";
import { areas, nearestArea, distance } from "../services/orderPolicy.js";
const props = defineProps({ snapshot: Object, portal: String });
onMounted(() => {
  if (props.portal) open("admin");
});
const emit = defineEmits(["refresh"]);
const panel = ref(),
  page = ref(""),
  error = ref(""),
  message = ref(""),
  busy = ref(false),
  admin = ref(null);
const form = reactive({});
const selected = ref([]);
const query = ref("");
const u = computed(() => props.snapshot.user);
const labels = {
  addresses: "عناويني",
  customers: "زبائني",
  batch: "الاستلام الجماعي",
  support: "المساعدة والدعم",
  outlets: "منافذ الشحن",
  admin: "معاينة الإدارة المحلية",
};
const nearbyOutlets = computed(() =>
  props.snapshot.outlets
    .slice()
    .sort(
      (a, b) =>
        distance(u.value.location, a.location) -
        distance(u.value.location, b.location),
    ),
);
const topics = computed(() =>
  form.category === "تسوية مالية"
    ? ["عدم استرداد قيمة المرتجع", "أجرة التوصيل أو الراجع", "رصيد المحفظة"]
    : form.category === "مشكلة في الطلب"
      ? [
          "تأخير الاستلام",
          "اختلاف بيانات الشحنة",
          "تعذر الوصول للمستلم",
          "الإرجاع",
        ]
      : ["طلب مساعدة", "تعذر التحقق", "أخرى"],
);
const items = computed(() =>
  (u.value[page.value] || []).filter((x) =>
    JSON.stringify(x).includes(query.value),
  ),
);
const batchOrders = computed(() =>
  props.snapshot.orders.filter(
    (o) => ["arrived", "waiting"].includes(o.status) && o.courier,
  ),
);
function reset() {
  for (const k of Object.keys(form)) delete form[k];
  Object.assign(form, {
    name: "",
    phone: "",
    area: "",
    address: "",
    lat: "",
    lng: "",
    province: u.value.province,
    category: "مشكلة في الطلب",
    topic: "",
    text: "",
    orderId: "",
    amount: 0,
    account: "",
    outlet: props.snapshot.outlets?.[0]?.id,
    code: "",
    inspected: false,
    paid: false,
  });
  selected.value = [];
  error.value = "";
  message.value = "";
}
async function open(p) {
  page.value = p;
  reset();
  query.value = "";
  panel.value.showModal();
  if (p === "admin")
    await run(async () => {
      admin.value = await api("/api/local-admin", { action: "view" });
      Object.assign(form, admin.value.settings);
    });
}
async function run(fn) {
  if (busy.value) return;
  busy.value = true;
  error.value = "";
  try {
    await fn();
    emit("refresh");
  } catch (e) {
    error.value = e.message;
  } finally {
    busy.value = false;
  }
}
function edit(x) {
  reset();
  Object.assign(form, x, {
    lat: x.location?.lat ?? "",
    lng: x.location?.lng ?? "",
  });
}
function location() {
  return form.lat !== "" && form.lng !== ""
    ? { lat: Number(form.lat), lng: Number(form.lng) }
    : null;
}
async function gps() {
  await run(
    () =>
      new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(
          (p) => {
            form.lat = p.coords.latitude;
            form.lng = p.coords.longitude;
            form.area = nearestArea(location()) || form.area;
            resolve();
          },
          () => reject(Error("تعذر تحديد الموقع؛ أدخل الإحداثيات يدوياً.")),
          { timeout: 12000 },
        ),
      ),
  );
}
async function save() {
  await run(async () => {
    if (["addresses", "customers"].includes(page.value)) {
      await api("/api/" + page.value, {
        ...form,
        province: u.value.province,
        location: location(),
      });
      reset();
      message.value = "تم الحفظ";
    }
    if (page.value === "support") {
      await api("/api/support", form);
      reset();
      message.value = "تم فتح التذكرة محلياً؛ الرد متاح من معاينة الإدارة.";
    }
    if (page.value === "batch") {
      const result = await api(
        "/api/batch",
        u.value.role === "merchant"
          ? { action: "create", ids: selected.value }
          : {
              action: "pickup",
              code: form.code,
              inspected: form.inspected,
              paid: form.paid,
            },
      );
      message.value = result.code
        ? "رمز الاستلام: " + result.code
        : "تم الاستلام وتحديث الميزانية";
    }
    if (page.value === "admin") {
      await api("/api/local-admin", {
        action: "settings",
        values: { ...form },
      });
      message.value = "تم حفظ إعدادات التجربة المحلية";
    }
  });
}
async function remove(x) {
  await run(() => api("/api/" + page.value, { action: "delete", id: x.id }));
}
async function adminAction(action, extra = {}) {
  await run(async () => {
    await api("/api/local-admin", { action, ...extra });
    admin.value = await api("/api/local-admin", { action: "view" });
    message.value = "تم تنفيذ الإجراء محلياً";
  });
}
const settingsLabels = {
  offerAfterMinutes: "مهلة اقتراح الأجرة (دقيقة)",
  arrivalBuffer: "هامش الوصول (%)",
  extensionPercent: "نسبة التمديد (%)",
  arrivalRadiusKm: "نطاق تأكيد الوصول (كم)",
  commission: "عمولة الطلب العادي",
  freeCommission: "عمولة التوصيل الحر",
  vipCommission: "عمولة VIP",
  subscription: "الاشتراك الشهري",
  cancelSecondMinutes: "تقييد الإلغاء الثاني (دقيقة)",
  cancelThirdMinutes: "تقييد الإلغاء الثالث (دقيقة)",
  failureThreshold: "حد التعذر قبل المراجعة",
  failureRestrictionMinutes: "مدة تقييد التعذر بعد المراجعة",
  waitMinutes: "تنبيه تأخير التجهيز (دقيقة)",
  maxCarried: "حد الطلبات المحمولة (0 بدون حد)",
};
</script>
<template>
  <section
    v-if="!portal"
    class="account-options workspace-tools"
    aria-label="خدمات الحساب"
  >
    <button
      v-for="(label, key) in labels"
      v-show="
        !['addresses', 'customers'].includes(key) || u.role === 'merchant'
      "
      :key="key"
      type="button"
      class="account-option"
      @click.stop="open(key)"
    >
      <span class="option-icon"
        ><svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            :d="
              key === 'addresses'
                ? 'M12 21s7-7 7-12A7 7 0 0 0 5 9c0 5 7 12 7 12ZM12 6v6M9 9h6'
                : key === 'support'
                  ? 'M4 14V9a8 8 0 0 1 16 0v5M4 10H2v6h4v-6ZM20 10h2v6h-4v-6ZM20 16c0 4-3 5-8 5'
                  : 'M5 4h14v16H5ZM8 8h8M8 12h8M8 16h5'
            "
          /></svg></span
      ><strong>{{ label }}</strong
      ><span class="option-chevron">‹</span>
    </button>
  </section>
  <dialog
    ref="panel"
    class="workspace-dialog"
    @click.stop
    @submit.stop
    @change.stop
    @input.stop
  >
    <div class="workspace-dialog-head">
      <h2>{{ portal === "outlet" ? "واجهة منفذ الشحن" : labels[page] }}</h2>
      <button
        type="button"
        class="workspace-close"
        aria-label="إغلاق"
        @click="panel.close()"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
    <p v-if="error" role="alert" class="inline-error">{{ error }}</p>
    <p v-if="message" role="status" class="status-note">{{ message }}</p>
    <template v-if="['addresses', 'customers'].includes(page)">
      <label
        >بحث بالاسم أو الهاتف أو العنوان<input v-model="query" type="search"
      /></label>
      <div class="workspace-list">
        <article v-for="x in items" :key="x.id">
          <strong>{{ x.name }}</strong>
          <p>{{ x.phone }} · {{ x.area }} · {{ x.address }}</p>
          <button type="button" @click="edit(x)">تعديل</button>
          <button type="button" @click="remove(x)" :disabled="busy">حذف</button>
        </article>
        <p v-if="!items.length">لا توجد بيانات مطابقة.</p>
      </div>
      <form @submit.prevent="save" class="form-stack">
        <h3>
          {{ form.id ? "تعديل" : "إضافة" }}
          {{ page === "addresses" ? "عنوان" : "مستلم" }}
        </h3>
        <label
          >الاسم<input
            v-model.trim="form.name"
            required
            maxlength="80" /></label
        ><label v-if="page === 'customers'"
          >الهاتف<input
            v-model="form.phone"
            @input="form.phone = phoneDigits($event.target.value)"
            inputmode="numeric"
            pattern="07[789][0-9]{8}"
            maxlength="11"
            required
            dir="ltr" /></label
        ><label
          >المنطقة<input
            v-model.trim="form.area"
            list="workspace-areas"
            required /></label
        ><datalist id="workspace-areas">
          <option
            v-for="a in areas[u.province] || []"
            :key="a"
            :value="a"
          /></datalist
        ><label
          >العنوان<input v-model.trim="form.address" required maxlength="200"
        /></label>
        <div class="form-grid">
          <label
            >خط العرض<input
              v-model="form.lat"
              type="number"
              step="any"
              min="-90"
              max="90" /></label
          ><label
            >خط الطول<input
              v-model="form.lng"
              type="number"
              step="any"
              min="-180"
              max="180"
          /></label>
        </div>
        <button type="button" @click="gps" :disabled="busy">
          تحديد موقعي واقتراح المنطقة</button
        ><button class="primary-button" :disabled="busy">حفظ</button
        ><button type="button" @click="reset">إضافة جديدة</button>
      </form>
    </template>
    <template v-if="page === 'batch'"
      ><p>
        مجموعة لنفس المندوب ونفس عنوان الاستلام. اختر فقط الشحنات الجاهزة؛
        الباقي يبقى مستقلاً.
      </p>
      <form class="form-stack" @submit.prevent="save">
        <template v-if="u.role === 'merchant'"
          ><label v-for="o in batchOrders" :key="o.id" class="checkbox"
            ><input v-model="selected" type="checkbox" :value="o.id" />{{
              o.id
            }}
            · {{ o.courierInfo?.name }} · {{ o.sender.address }} ·
            {{ o.kind === "free" ? 0 : o.amount }} د.ع</label
          >
          <p>
            مجموع قيمة الشحنات المختارة:
            {{
              snapshot.orders
                .filter((o) => selected.includes(o.id))
                .reduce(
                  (n, o) => n + (o.kind === "free" ? 0 : Number(o.amount)),
                  0,
                )
            }}
            د.ع
          </p>
          <p v-if="!batchOrders.length">
            لا توجد طلبات وصلت للاستلام.
          </p></template
        ><template v-else
          ><label
            >رمز المجموعة من التاجر<input
              v-model="form.code"
              pattern="[0-9]{6}"
              maxlength="6"
              inputmode="numeric"
              required /></label
          ><label class="checkbox"
            ><input v-model="form.inspected" type="checkbox" required />فحصت
            جميع الشحنات المختارة</label
          ><label class="checkbox"
            ><input v-model="form.paid" type="checkbox" required />دفعت مجموع
            قيمة البضاعة واستلمت الشحنات</label
          ></template
        ><button class="primary-button" :disabled="busy">
          {{
            u.role === "merchant"
              ? "إنشاء رمز المجموعة"
              : "تأكيد استلام المجموعة"
          }}
        </button>
      </form>
      <article v-for="b in snapshot.batches" :key="b.id">
        <p>
          {{ b.ids.join("، ") }} —
          {{ b.used ? "تم الاستلام" : "بانتظار الاستلام" }}
          <strong v-if="u.role === 'merchant' && !b.used">{{ b.code }}</strong>
        </p>
      </article></template
    >
    <template v-if="page === 'support'"
      ><form class="form-stack" @submit.prevent="save">
        <label
          >ما نوع المشكلة؟<select v-model="form.category">
            <option>مشكلة في الطلب</option>
            <option>تسوية مالية</option>
            <option>التحقق من التسليم</option>
            <option>مشكلة في الحساب</option>
            <option>أخرى</option>
          </select></label
        ><label
          >الطلب المرتبط<select v-model="form.orderId">
            <option value="">بدون طلب</option>
            <option
              v-for="o in snapshot.orders.filter(
                (o) => o.merchant === u.id || o.courier === u.id,
              )"
              :key="o.id"
            >
              {{ o.id }}
            </option>
          </select></label
        ><label
          >تفصيل المشكلة<select v-model="form.topic" required>
            <option value="">اختر التفصيل</option>
            <option v-for="t in topics" :key="t">{{ t }}</option>
          </select></label
        ><label
          >ما الذي حصل؟ وما النتيجة المطلوبة؟<textarea
            v-model.trim="form.text"
            required
            minlength="8"
            maxlength="2000"
          />
        </label>
        <p>يرفق سجل الطلب تلقائياً. هذه تذاكر محلية على جهازك حالياً.</p>
        <button class="primary-button" :disabled="busy">
          إرسال طلب المساعدة
        </button>
      </form>
      <article v-for="t in snapshot.tickets" :key="t.id">
        <h3>
          {{ t.category }} · {{ t.topic }} ·
          {{ t.status === "closed" ? "مغلقة" : "مفتوحة" }}
        </h3>
        <p>{{ t.text }}</p>
        <p v-for="(r, i) in t.replies" :key="i">رد الدعم: {{ r.text }}</p>
      </article></template
    >
    <template v-if="page === 'outlets'"
      ><LocationMap :groups="nearbyOutlets.map((o) => ({ ...o, count: 1 }))" />
      <p>منافذ تجريبية للمعاينة؛ لا تنفذ دفعاً أو شحناً حقيقياً.</p>
      <article v-for="o in nearbyOutlets" :key="o.id">
        <h3>{{ o.name }}</h3>
        <p>{{ o.address }}</p>
        <p v-if="Number.isFinite(distance(u.location, o.location))">
          {{ distance(u.location, o.location).toFixed(1) }} كم تقريباً
        </p>
        <a :href="'tel:' + o.phone">{{ o.phone }}</a> ·
        <a
          v-if="o.location"
          :href="
            'https://www.google.com/maps/dir/?api=1&destination=' +
            o.location.lat +
            ',' +
            o.location.lng
          "
          target="_blank"
          rel="noopener"
          >الاتجاهات</a
        >
      </article></template
    >
    <template v-if="page === 'admin' && admin"
      ><p class="status-note">
        لوحة تجربة محلية على هذا الجهاز، لا تمثل صلاحيات إدارة حقيقية.
      </p>
      <details v-if="portal !== 'outlet'">
        <summary>ضبط الخدمات والعمولات</summary>
        <form class="form-stack" @submit.prevent="save">
          <label v-for="(label, key) in settingsLabels" :key="key"
            >{{ label
            }}<input
              v-model.number="form[key]"
              type="number"
              min="0"
              step="any"
              required /></label
          ><label
            >تاريخ بدء الأجور (فارغ للتفعيل الآن)<input
              v-model="form.feesStartAt"
              type="date" /></label
          ><label
            >نوع العمولة<select v-model="form.commissionMode">
              <option value="fixed">مبلغ ثابت</option>
              <option value="percent">نسبة مئوية</option>
            </select></label
          ><label class="checkbox"
            ><input v-model="form.returnCommission" type="checkbox" />إدراج أجرة
            الراجع في حساب العمولة</label
          ><label class="checkbox"
            ><input v-model="form.penaltiesEnabled" type="checkbox" />تفعيل
            القيود (متوقفة افتراضياً أثناء التجربة)</label
          ><button class="primary-button" :disabled="busy">
            حفظ الإعدادات
          </button>
        </form>
        <button
          type="button"
          @click="adminAction('subscription')"
          :disabled="busy"
        >
          تطبيق اشتراك الشهر مرة واحدة
        </button>
      </details>
      <details v-if="portal !== 'outlet'">
        <summary>مراجعة تعديلات الحسابات</summary>
        <article
          v-for="x in admin.users.filter((x) => x.pendingProfile)"
          :key="x.id"
        >
          <h3>{{ x.name }} · {{ x.id }}</h3>
          <p v-for="(v, k) in x.pendingProfile" :key="k">{{ k }}: {{ v }}</p>
          <button
            type="button"
            @click="adminAction('approve-profile', { id: x.id })"
          >
            موافقة
          </button>
          <button
            type="button"
            @click="adminAction('reject-profile', { id: x.id })"
          >
            رفض
          </button>
        </article>
      </details>
      <details>
        <summary>منفذ الشحن — محاكاة</summary>
        <form
          @submit.prevent="
            adminAction('topup', {
              account: form.account,
              amount: form.amount,
              outlet: form.outlet,
            })
          "
          class="form-stack"
        >
          <label
            >المنفذ<select v-model="form.outlet">
              <option v-for="o in admin.outlets" :key="o.id" :value="o.id">
                {{ o.name }} · رصيد {{ o.balance }}
              </option>
            </select></label
          ><label
            >رقم الحساب أو المحفظة<input
              v-model="form.account"
              list="account-ids"
              required
              dir="ltr" /></label
          ><datalist id="account-ids">
            <option v-for="x in admin.users" :key="x.id" :value="x.id">
              {{ x.name }}
            </option></datalist
          ><label
            >المبلغ<input
              v-model.number="form.amount"
              type="number"
              min="1"
              required /></label
          ><button class="primary-button" :disabled="busy">شحن تجريبي</button>
        </form>
      </details>
      <details v-if="portal !== 'outlet'">
        <summary>تذاكر الدعم</summary>
        <article v-for="t in admin.tickets" :key="t.id">
          <h3>{{ t.id }} · {{ t.category }}</h3>
          <p>{{ t.text }}</p>
          <details>
            <summary>سجل الطلب</summary>
            <p v-for="(h, i) in t.history" :key="i">
              {{ h.at }} — {{ h.text }}
            </p>
          </details>
          <p v-for="m in t.messages" :key="m.id">{{ m.name }}: {{ m.text }}</p>
          <form
            @submit.prevent="
              adminAction('reply', {
                id: t.id,
                text: t.draftReply,
                close: true,
              })
            "
          >
            <label>الرد<textarea v-model="t.draftReply" required /></label
            ><button :disabled="busy">إرسال وإغلاق</button>
          </form>
        </article>
      </details>
      <details v-if="portal !== 'outlet'">
        <summary>مراجعة الإلغاءات والتعذر</summary>
        <article
          v-for="x in admin.users.filter(
            (x) => x.failures?.length || x.cancellations?.length,
          )"
          :key="x.id"
        >
          <h3>{{ x.name }}</h3>
          <p>
            إلغاء الحجز: {{ x.cancellations.length }} · تعذر التسليم:
            {{ x.failures.length }}
          </p>
          <p v-for="(f, i) in x.failures" :key="i">
            {{ f.at }} — {{ f.reason }}
          </p>
          <form
            @submit.prevent="
              adminAction('review-failure', {
                id: x.id,
                reason: x.reviewReason,
                restrict: !!x.restrict,
              })
            "
          >
            <label>سبب القرار<input v-model="x.reviewReason" required /></label
            ><label class="checkbox"
              ><input v-model="x.restrict" type="checkbox" />تقييد الحجوزات
              الجديدة (إذا فُعلت القيود)</label
            ><button :disabled="busy">اعتماد المراجعة</button>
          </form>
        </article>
      </details>
      <details v-if="portal !== 'outlet'">
        <summary>إضافة وتمويل منفذ</summary>
        <form
          class="form-stack"
          @submit.prevent="
            adminAction('outlet', {
              name: form.name,
              phone: form.phone,
              address: form.address,
              location: location(),
            })
          "
        >
          <label>اسم المنفذ<input v-model="form.name" required /></label
          ><label
            >الهاتف<input
              v-model="form.phone"
              @input="form.phone = phoneDigits($event.target.value)"
              pattern="07[789][0-9]{8}"
              required /></label
          ><label>العنوان<input v-model="form.address" required /></label
          ><label
            >خط العرض<input
              v-model="form.lat"
              type="number"
              step="any"
              required /></label
          ><label
            >خط الطول<input
              v-model="form.lng"
              type="number"
              step="any"
              required /></label
          ><button :disabled="busy">إضافة المنفذ محلياً</button>
        </form>
        <article v-for="o in admin.outlets" :key="o.id">
          <strong>{{ o.name }}</strong>
          <form
            @submit.prevent="
              adminAction('fund-outlet', { id: o.id, amount: o.fund })
            "
          >
            <label
              >تمويل المنفذ<input
                v-model="o.fund"
                type="number"
                min="1"
                required /></label
            ><button :disabled="busy">إضافة رصيد تجريبي</button>
          </form>
        </article>
        <a href="?portal=outlet" target="_blank" rel="noopener"
          >فتح واجهة المنفذ المستقلة</a
        >
      </details>
      <details v-if="portal !== 'outlet'">
        <summary>سجل العمليات</summary>
        <p v-for="a in admin.audit" :key="a.id">{{ a.at }} — {{ a.text }}</p>
      </details></template
    >
  </dialog>
</template>
<style>
.workspace-dialog {
  width: min(94vw, 680px);
  max-height: 88dvh;
  overflow: auto;
  background: var(--surface, #fff);
  color: var(--text, #00567a);
  border: 1px solid #7d9fac40;
  border-radius: 24px;
  padding: 24px;
}
.workspace-dialog::backdrop {
  background: #001d2bb3;
}
.workspace-dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}
.workspace-dialog-head h2 {
  margin: 0;
}
.workspace-close {
  border: 1px solid #f47d2f !important;
  color: #f47d2f !important;
  background: #f47d2f15 !important;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  display: grid;
  place-items: center;
  line-height: 1;
  flex-shrink: 0;
}
.workspace-close svg {
  display: block;
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  pointer-events: none;
}
.geographic-map {
  touch-action: none;
  overscroll-behavior: contain;
}
.workspace-dialog article {
  border: 1px solid #8ca4b640;
  border-radius: 16px;
  padding: 16px;
  margin: 12px 0;
}
.workspace-dialog label {
  display: grid;
  gap: 6px;
}
.workspace-dialog .checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
}
.workspace-dialog input:not([type="checkbox"]),
.workspace-dialog select,
.workspace-dialog textarea {
  width: 100%;
  min-height: 44px;
}
.workspace-dialog details {
  padding: 12px 0;
  border-bottom: 1px solid #8ca4b640;
}
.workspace-dialog summary {
  cursor: pointer;
  font-weight: 700;
}
.workspace-list {
  max-height: 260px;
  overflow: auto;
}
.workspace-dialog p {
  overflow-wrap: anywhere;
}
.dark-mode .workspace-dialog,
[data-theme="dark"] .workspace-dialog {
  background: #193444;
  color: #e0edf2;
}
</style>
