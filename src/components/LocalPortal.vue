<script setup>
import { ref, onMounted } from "vue";
import WorkspaceTools from "./WorkspaceTools.vue";
import { api } from "../services/api.js";
function reopen() {
  window.location.reload();
}
const snapshot = ref(),
  error = ref("");
const portal = new URLSearchParams(location.search).get("portal");
async function refresh() {
  try {
    snapshot.value = await api("/api/state");
  } catch (e) {
    error.value = e.message;
  }
}
onMounted(async () => {
  await api("/api/login", { role: "merchant" });
  await refresh();
});
</script>
<template>
  <main class="tracking-page">
    <h1>واصل — {{ portal === "outlet" ? "منفذ الشحن" : "الإدارة" }}</h1>
    <p>واجهة محاكاة محلية. لا تنفذ تحويلات مالية حقيقية.</p>
    <p v-if="error" role="alert">{{ error }}</p>
    <WorkspaceTools
      v-if="snapshot"
      :snapshot="snapshot"
      :portal="portal"
      @refresh="refresh"
    /><a href="./#/choose">الرجوع إلى التطبيق</a
    ><button type="button" @click="reopen">فتح اللوحة</button>
  </main>
</template>
