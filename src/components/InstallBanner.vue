<template>
  <section id="install-banner" class="install-banner" aria-label="تثبيت واصل">
    <img :src="icon" width="48" height="48" alt="" />
    <div>
      <strong>واصل على تلفونك</strong
      ><span>أضفه للشاشة الرئيسية لفتحه بسهولة</span>
    </div>
    <button type="button" data-action="install" class="install-cta">
      تثبيت التطبيق
    </button>
  </section>
</template>
<script setup>
const icon = new URL("assets/icon-192.png", document.baseURI).href;
</script>
