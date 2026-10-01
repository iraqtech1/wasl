<script setup>
import { ref, computed, watch } from "vue";
import { api } from "../services/api.js";
const props = defineProps({ orders: Array, visibleOrders: Array, action: String });
const emit = defineEmits(["published"]);
const selected = ref([]),
  busy = ref(false),
  message = ref("");
const all = computed(
  () =>
    props.orders.length > 0 && selected.value.length === props.orders.length,
);
function toggle(id, checked) {
  selected.value = checked ? [...new Set([...selected.value, id])] : selected.value.filter(x => x !== id);
}
watch(
  () => props.orders.map((o) => o.id).join(","),
  () => {
    selected.value = selected.value.filter((id) =>
      props.orders.some((o) => o.id === id),
    );
  },
);
async function publish() {
  if (busy.value || !selected.value.length) return;
  busy.value = true;
  let done = 0;
  const errors = [];
  for (const id of [...selected.value]) {
    try {
      await api(`/api/orders/${id}/action`, { action: props.action });
      done++;
      selected.value = selected.value.filter((x) => x !== id);
    } catch (error) {
      errors.push(`${id}: ${error.message}`);
    }
  }
  message.value =
    `${props.action === "publish" ? "تم نشر" : "تم إرجاع إلى محفوظ:"} ${done} طلب` +
    (errors.length ? ` — ${errors.join("؛ ")}` : "");
  busy.value = false;
  emit("published");
}
</script>
<template>
  <section class="draft-bulk">
    <div class="draft-bulk-actions">
      <label
        ><input
          type="checkbox"
          :checked="all"
          :disabled="busy || !orders.length"
          @change="
            selected = $event.target.checked ? orders.map((o) => o.id) : []
          "
        />
        تحديد الكل ({{ orders.length }})</label
      >
      <button
        type="button"
        class="primary-button"
        :disabled="busy || !selected.length"
        @click.stop="publish"
      >
        {{
          busy
            ? "جارٍ تحديث الطلبات…"
            : `${action === "publish" ? "نشر المحدد" : "إرجاع المحدد إلى محفوظ"} (${selected.length})`
        }}
      </button>
    </div>
    <p v-if="message" role="status">{{ message }}</p>
    <p v-if="!orders.length" class="muted">لا توجد طلبات بهذه الحالة.</p>
    <template v-for="order in visibleOrders" :key="order.id">
      <slot :order="order" :checked="selected.includes(order.id)" :busy="busy" :toggle="toggle" />
    </template>
  </section>
</template>
<style scoped>
.draft-bulk-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px;
  border: 1px solid #f47d2f66;
  border-radius: 14px;
  margin-bottom: 16px;
}
label {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
}
.draft-order-select {
  padding: 6px 12px;
}
input {
  width: 20px;
  height: 20px;
  accent-color: #f47d2f;
}
button {
  font: inherit;
}
</style>
