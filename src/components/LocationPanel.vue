<script setup>
import { computed, ref, watch } from "vue";
import LocationMap from "./LocationMap.js";
import LocationShare from "./LocationShare.vue";
import { nearestArea } from "../services/orderPolicy.js";
const props = defineProps({
  location: Object,
  editable: Boolean,
  required: Boolean,
  name: { type: String, default: "الموقع" },
});
const emit = defineEmits(["update:location"]);
const point = ref(props.location || null);
const root = ref(null),
  busy = ref(false),
  error = ref("");
watch(
  () => props.location,
  (value) => {
    point.value = value || null;
  },
  { deep: true },
);
const url = computed(() =>
  point.value
    ? `https://www.google.com/maps/search/?api=1&query=${point.value.lat},${point.value.lng}`
    : "",
);
function choose(value) {
  point.value = value;
  error.value = "";
  emit("update:location", value);
  const form = root.value?.closest("form");
  if (form?.elements.area) {
    const area = nearestArea(value);
    if (area) {
      const field = form.elements.area;
      if (
        field.tagName === "SELECT" &&
        ![...field.options].some((o) => o.value === area)
      ) {
        field.value = "other";
        if (form.elements.otherArea) form.elements.otherArea.value = area;
      } else field.value = area;
      field.dispatchEvent(new Event("input", { bubbles: true }));
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}
function gps() {
  if (!navigator.geolocation) {
    error.value = "حدد الموقع بالضغط على الخريطة.";
    return;
  }
  busy.value = true;
  navigator.geolocation.getCurrentPosition(
    (p) => {
      choose({ lat: p.coords.latitude, lng: p.coords.longitude });
      busy.value = false;
    },
    () => {
      error.value = "تعذر تحديد موقعك؛ اختره بالضغط على الخريطة.";
      busy.value = false;
    },
    { enableHighAccuracy: true, timeout: 15000 },
  );
}
</script>
<template>
  <section ref="root" class="location-panel">
    <h3 v-if="name !== 'الموقع'" class="location-panel-title">{{ name }}</h3>
    <LocationMap
      :key="editable ? 'picker' : `${point?.lat},${point?.lng}`"
      v-if="editable || point"
      :groups="editable ? [] : [{ id: name, name, location: point, count: 1 }]"
      :movable-location="editable ? point || { lat: 33.3, lng: 44.43 } : null"
      @location-change="choose"
    />
    <p v-else class="file-help">لم يتم تحديد الموقع بعد.</p>
    <template v-if="editable">
      <input type="hidden" name="lat" :value="point?.lat ?? ''" />
      <input type="hidden" name="lng" :value="point?.lng ?? ''" />
      <input
        v-if="required"
        class="location-validation"
        tabindex="-1"
        :required="required"
        :value="point ? 'محدد' : ''"
        aria-label="حدد الموقع من الخريطة"
        @invalid="error = 'حدد الموقع على الخريطة أولاً.'"
      />
      <p class="file-help">
        {{
          point
            ? "تم تحديد الموقع. اسحب العلامة لتعديله."
            : "اضغط على الخريطة لتحديد الموقع أو استخدم موقعك الحالي."
        }}
      </p>
    </template>
    <div class="location-panel-actions">
      <a v-if="point" :href="url" target="_blank" rel="noopener noreferrer"
        >فتح الخريطة</a
      >
      <LocationShare v-if="point" :location="point" :name="name" />
      <button
        v-if="editable"
        type="button"
        class="location-gps"
        :disabled="busy"
        @click.stop="gps"
      >
        {{ busy ? "جارٍ تحديد الموقع…" : "تحديد موقعي الحالي" }}
      </button>
    </div>
    <p v-if="error" class="inline-error" role="alert">{{ error }}</p>
  </section>
</template>
