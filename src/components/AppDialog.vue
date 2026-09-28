<script setup>
import RenderContent from "./RenderContent.js";
defineProps({ title: String, content: [Object, Array, String], error: String });
defineEmits(["close"]);
</script>
<template>
  <dialog
    id="app-dialog"
    aria-labelledby="dialog-title"
    @cancel="$emit('close')"
  >
    <div class="dialog-head">
      <h2 id="dialog-title">{{ title }}</h2>
      <button
        type="button"
        id="close-dialog"
        aria-label="إغلاق"
        @click="$emit('close')"
      >
        <svg class="dialog-close-mark" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>
    <div id="dialog-content">
      <RenderContent :content="content" />
      <p v-if="error" class="inline-error" role="alert">{{ error }}</p>
    </div>
  </dialog>
</template>
