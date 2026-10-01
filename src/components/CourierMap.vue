<script setup>
import { computed, ref } from "vue";
import LocationMap from "./LocationMap.js";
const props = defineProps({ groups: Array });
const selectedId = ref(null);
const selected = computed(() =>
  props.groups.find((c) => c.id === selectedId.value),
);
</script>
<template>
  <LocationMap :groups="groups" @courier-select="selectedId = $event" />
  <section
    v-if="selected"
    class="courier-map-details"
    aria-live="polite"
    aria-atomic="true"
  >
    <h3>{{ selected.name }}</h3>
    <dl>
      <div>
        <dt>وسيلة النقل</dt>
        <dd>{{ selected.vehicleLabel || "غير محددة" }}</dd>
      </div>
      <div>
        <dt>رقم وسيلة النقل</dt>
        <dd>{{ selected.plate || "غير مسجل" }}</dd>
      </div>
      <div>
        <dt>رقم الهاتف</dt>
        <dd>
          <a v-if="selected.phone" :href="'tel:' + selected.phone" dir="ltr">{{
            selected.phone
          }}</a
          ><span v-else>غير مسجل</span>
        </dd>
      </div>
    </dl>
  </section>
  <p v-else class="muted">اضغط على أيقونة وسيلة النقل لعرض تفاصيل المندوب.</p>
</template>
<style scoped>
.courier-map-details {
  margin-top: 14px;
  padding: 16px;
  border: 1px solid #8ca4b640;
  border-radius: 16px;
  background: var(--surface, #fff);
  color: inherit;
}
h3 {
  margin: 0 0 12px;
  color: inherit;
}
dl {
  margin: 0;
  display: grid;
  gap: 10px;
}
dl > div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}
dt {
  font-size: 13px;
}
dd {
  margin: 0;
  font-weight: 700;
  text-align: end;
}
a {
  color: inherit;
  text-decoration: underline;
}
:global(html[data-theme="dark"]) .courier-map-details {
  background: #193444;
}
</style>
