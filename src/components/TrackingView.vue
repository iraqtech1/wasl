<script setup>
import { readTracking } from "../services/tracking.js";
import { statuses } from "../services/demoData.js";
const data = readTracking(location.hash);
const date = (x) =>
  Number.isFinite(Date.parse(x)) ? new Date(x).toLocaleString("en-GB") : "";
</script>
<template>
  <main class="tracking-page">
    <span class="brand-logo" role="img" aria-label="واصل"></span>
    <h1>متابعة الطلب</h1>
    <template v-if="data"
      ><h2>{{ data.id }}</h2>
      <p class="status-note">{{ statuses[data.status] || "غير معروف" }}</p>
      <p>
        نسخة حالة مشارَكة بتاريخ {{ date(data.at) }}. ليست تتبعاً مباشراً؛ اطلب
        رابطاً محدثاً من المرسل.
      </p>
      <ol class="timeline">
        <li v-for="(e, i) in data.events" :key="i">
          {{ statuses[e.status] || "تحديث الطلب" }} — {{ date(e.at) }}
        </li>
      </ol></template
    >
    <p v-else>رابط المتابعة غير صالح.</p>
    <a href="./">فتح واصل</a>
  </main>
</template>
<style>
.tracking-page {
  max-width: 580px;
  margin: 5vh auto;
  padding: 24px;
  min-height: 80vh;
}
.tracking-page .brand-logo {
  display: block;
  width: 110px;
  height: 64px;
}
.tracking-page h1 {
  color: #00567a;
}
.tracking-page li {
  margin: 16px 0;
}
</style>
