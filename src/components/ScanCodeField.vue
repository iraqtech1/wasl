<script setup>
import { ref, nextTick, onBeforeUnmount, onMounted } from "vue";
import { createQrScanner } from "../services/qrScanner.js";
defineProps({ label: { type: String, default: "رمز الاستلام من التاجر" } });
const code = ref(""),
  method = ref("manual"),
  active = ref(false),
  error = ref(""),
  video = ref(null),
  input = ref(null);
let scanner;
function stop() {
  scanner?.stop();
  active.value = false;
}
async function start() {
  stop();
  error.value = "";
  active.value = true;
  await nextTick();
  if (!active.value || !video.value) return;
  scanner = createQrScanner({
    video: video.value,
    onCode(value) {
      code.value = value;
      method.value = "qr";
      active.value = false;
      input.value?.focus();
    },
    onError(message) {
      error.value = message;
      active.value = false;
    },
  });
  await scanner.start();
}
function hidden() {
  if (document.hidden) stop();
}
onMounted(() => document.addEventListener("visibilitychange", hidden));
onBeforeUnmount(() => {
  stop();
  document.removeEventListener("visibilitychange", hidden);
});
</script>
<template>
  <div class="scan-code-field">
    <button
      v-if="!active"
      type="button"
      class="scan-code-button"
      @click="start"
    >
      مسح QR بالكاميرا
    </button>
    <template v-else>
      <video
        ref="video"
        autoplay
        muted
        playsinline
        aria-label="كاميرا مسح QR"
      />
      <p class="file-help">وجّه الكاميرا نحو رمز QR الخاص بالطلب.</p>
      <button type="button" @click="stop">إيقاف المسح والإدخال يدوياً</button>
    </template>
    <p v-if="error" class="inline-error" role="alert">{{ error }}</p>
    <p v-if="method === 'qr'" class="status-note" role="status">
      تمت قراءة الرمز. راجع التأكيدات ثم اضغط تأكيد لإتمام الإجراء.
    </p>
    <label
      >{{ label
      }}<input
        ref="input"
        v-model="code"
        name="code"
        required
        inputmode="numeric"
        pattern="[0-9]{6}"
        maxlength="6"
        dir="ltr"
        autocomplete="off"
        @input="
          stop();
          method = 'manual';
        "
    /></label>
    <input type="hidden" name="scanMethod" :value="method" />
  </div>
</template>
<style>
.scan-code-field {
  display: grid;
  gap: 10px;
}
.scan-code-field video {
  width: 100%;
  max-height: 280px;
  object-fit: cover;
  border-radius: 16px;
  background: #002d40;
}
.scan-code-field .scan-code-button {
  min-height: 46px;
  border: 1px solid #f47d2f70;
  border-radius: 12px;
  background: #fff0e3;
  color: #99501d;
  font: inherit;
  cursor: pointer;
}
</style>
