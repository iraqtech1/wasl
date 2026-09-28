<script setup>
import { watch, onBeforeUnmount } from "vue";
import { useWasel } from "./composables/useWasel.js";
import InstallBanner from "./components/InstallBanner.vue";
import AppDialog from "./components/AppDialog.vue";
import RenderContent from "./components/RenderContent.js";
const {
  ui,
  state,
  currentView,
  Navigation,
  SplashArt,
  title,
  roleNames,
  dispatch,
  closeModal,
  cameraClosed,
} = useWasel();
watch(
  () => ui.auth,
  (value) => document.body.classList.toggle("auth-mode", value),
  { immediate: true },
);
onBeforeUnmount(() => document.body.classList.remove("auth-mode"));
</script>
<template>
  <div
    class="wasel-app"
    @click="dispatch('click', $event)"
    @submit.prevent="dispatch('submit', $event)"
    @change="dispatch('change', $event)"
    @input="dispatch('input', $event)"
    @keydown="dispatch('keydown', $event)"
  >
    <InstallBanner v-if="ui.installVisible && !ui.splash && !ui.installed" />
    <header v-if="!ui.auth" class="platform-header">
      <div class="header-inner">
        <div class="brand">
          <span class="brand-logo" role="img" aria-label="شعار واصل"></span>
          <div>
            <strong>واصل</strong
            ><span id="role-badge">{{
              roleNames[state.S?.user.role] || "منظومة التوصيل"
            }}</span>
          </div>
        </div>
        <h1 id="page-title">{{ title }}</h1>
        <div id="header-actions" v-if="state.S">
          <button
            type="button"
            data-action="notifications"
            aria-label="الإشعارات"
            class="icon-button"
          >
            <span class="material-symbols-outlined" aria-hidden="true"
              >notifications</span
            ></button
          ><button
            type="button"
            data-action="logout"
            aria-label="تسجيل الخروج"
            class="icon-button"
          >
            <span class="material-symbols-outlined" aria-hidden="true"
              >logout</span
            >
          </button>
        </div>
      </div>
    </header>
    <main id="app" v-show="!ui.splash">
      <template v-if="state.S && !ui.auth && !state.registration"
        ><div class="demo-notice">
          <span
            >حساب تجريبي • {{ state.S.user.id }} •
            {{ state.S.user.approved ? "حساب معتمد" : "الحساب غير نشط" }}</span
          ><button
            v-if="!ui.installed"
            type="button"
            data-action="install"
            class="secondary-button"
          >
            تثبيت التطبيق
          </button>
        </div>
        <p v-if="state.offline" class="status-note">
          الخادم غير متاح — المعروض آخر نسخة محفوظة. الإجراءات المشتركة تحتاج
          الاتصال.
        </p></template
      >
      <component
        :is="currentView"
        :key="ui.page + (state.wizard?.step ?? '') + ui.formRevision"
      />
    </main>
    <nav
      id="bottom-nav"
      aria-label="التنقل الرئيسي"
      :hidden="!state.S || ui.auth"
    >
      <Navigation />
    </nav>
    <AppDialog
      :title="ui.dialogTitle"
      :content="ui.dialogContent"
      :error="ui.formError"
      @close="closeModal"
    />
    <dialog
      id="document-camera-dialog"
      class="document-camera-dialog"
      aria-labelledby="document-camera-title"
      @close="cameraClosed"
    >
      <RenderContent :content="ui.cameraContent" />
      <p v-if="ui.cameraError" class="camera-error" role="alert">
        {{ ui.cameraError }}
      </p>
    </dialog>
    <div id="toast" role="status" :hidden="!ui.toast">{{ ui.toast }}</div>
    <div
      v-if="ui.splash"
      class="welcome-splash glass-splash"
      role="status"
      aria-label="مرحباً بك في واصل"
    >
      <SplashArt />
    </div>
  </div>
</template>
<style>
.welcome-splash > div {
  display: contents;
}
</style>
