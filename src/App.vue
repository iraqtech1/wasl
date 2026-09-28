<script setup>
import { watch, onBeforeUnmount } from "vue";
import { useWasel } from "./composables/useWasel.js";
import InstallBanner from "./components/InstallBanner.vue";
import AppDialog from "./components/AppDialog.vue";
import RenderContent from "./components/RenderContent.js";
import AccountOptions from "./components/AccountOptions.vue";
import { useNotificationBadge } from "./composables/useNotificationBadge.js";
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
const { unread, pulse, markRead } = useNotificationBadge(state);
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
    :class="{
      'is-login-screen': ui.auth && ui.page === 'AuthView' && !!state.authRole,
      'is-role-choice': ui.auth && ui.page === 'AuthView' && !state.authRole,
    }"
    @click="dispatch('click', $event)"
    @submit.prevent="dispatch('submit', $event)"
    @change="dispatch('change', $event)"
    @input="dispatch('input', $event)"
    @keydown="dispatch('keydown', $event)"
  >
    <InstallBanner v-if="ui.installVisible && !ui.splash && !ui.installed" />
    <header
      v-if="!ui.auth && state.screen === 'home' && !state.registration"
      class="platform-header"
    >
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
            :aria-label="
              unread ? 'الإشعارات، ' + unread + ' غير مقروءة' : 'الإشعارات'
            "
            class="icon-button notification-bell"
            :class="{ 'has-new-notification': pulse }"
            @click="markRead"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M12 2V1"
              />
            </svg>
            <span v-if="unread" class="notification-count" aria-hidden="true">{{
              unread > 99 ? "99+" : unread
            }}</span>
          </button>
        </div>
      </div>
    </header>
    <main id="app" v-show="!ui.splash">
      <component
        :is="currentView"
        :key="ui.page + (state.wizard?.step ?? '') + ui.formRevision"
      />
      <AccountOptions
        v-if="
          state.S &&
          !ui.auth &&
          state.screen === 'account' &&
          !state.registration
        "
        :signed-in="true"
      />
    </main>
    <AccountOptions v-if="ui.auth && !ui.splash" :signed-in="!!state.S" guest />
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
