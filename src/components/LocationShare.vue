<script setup>
import { computed, ref } from "vue";
const props = defineProps({ location: Object, name: String });
const status = ref("");
const pending = ref(false);
const url = computed(
  () =>
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(`${props.location.lat},${props.location.lng}`),
);
async function share() {
  if (pending.value) return;
  pending.value = true;
  status.value = "";
  try {
    if (navigator.share) {
      try {
        await navigator.share({
          title: props.name,
          text: `موقع ${props.name}`,
          url: url.value,
        });
        return;
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url.value);
      status.value = "تم نسخ رابط الموقع؛ شاركه بالتطبيق الذي تريده.";
    } catch {
      status.value = "انسخ رابط الموقع أدناه للمشاركة.";
    }
  } finally {
    pending.value = false;
  }
}
</script>
<template>
  <div class="location-share">
    <button
      type="button"
      class="secondary-button"
      :disabled="pending"
      @click.stop="share"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="m8.6 10.5 6.8-4M8.6 13.5l6.8 4" />
      </svg>
      مشاركة الموقع
    </button>
    <template v-if="status">
      <p role="status">{{ status }}</p>
      <input
        :value="url"
        readonly
        dir="ltr"
        aria-label="رابط الموقع للمشاركة"
        @click="$event.target.select()"
      />
    </template>
  </div>
</template>
<style scoped>
.location-share {
  min-width: 0;
  max-width: 100%;
}
.location-share button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  border-color: #f47d2f;
}
.location-share svg {
  width: 20px;
  height: 20px;
}
.location-share p {
  font-size: 13px;
}
.location-share input {
  width: 100%;
  min-height: 44px;
  border: 1px solid #8ca4b680;
  border-radius: 10px;
  padding: 8px;
  background: transparent;
  color: inherit;
}
</style>
