<script setup>
import CloseIcon from "./CloseIcon.js";
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
        class="wasel-close"
        aria-label="إغلاق"
        @click="$emit('close')"
      >
        <CloseIcon />
      </button>
    </div>
    <div id="dialog-content">
      <RenderContent :content="content" />
      <p v-if="error" class="inline-error" role="alert">{{ error }}</p>
    </div>
  </dialog>
</template>
