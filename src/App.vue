<script setup>
import { watch, onBeforeUnmount } from "vue";
import { useWasel } from "./composables/useWasel.js";
import InstallBanner from "./components/InstallBanner.vue";
import AppDialog from "./components/AppDialog.vue";
import RenderContent from "./components/RenderContent.js";
import WorkspaceTools from "./components/WorkspaceTools.vue";
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
  refresh,
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
        <h1 v-if="state.S?.user.role !== 'merchant'" id="page-title">
          {{ title }}
        </h1>
        <div id="header-actions" v-if="state.S">
          <template v-if="state.S.user.role === 'merchant'">
            <button
              type="button"
              data-action="nearby"
              class="icon-button header-shortcut nearby-shortcut"
              aria-label="المناديب المتاحون بالقرب منك"
              title="المناديب المتاحون بالقرب منك"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="2.5" />
                <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
              </svg>
              <span
                v-if="state.S.couriers.length"
                class="shortcut-dot"
                aria-hidden="true"
              ></span>
            </button>
            <button
              type="button"
              data-action="new-free"
              class="icon-button header-shortcut captain-shortcut"
              aria-label="طلب كابتن حر وسريع"
              title="طلب كابتن حر وسريع"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6h11v11H3V6Zm11 4h4l3 4v3h-7M17 10v4h4M5 3h5" />
                <circle cx="7" cy="18" r="2" />
                <circle cx="17" cy="18" r="2" />
              </svg>
              <span class="captain-fast-badge" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M14 2 5 13h6l-1 9 9-12h-6l1-8Z" />
                </svg>
              </span>
            </button>
          </template>
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
      <WorkspaceTools
        v-if="
          state.S &&
          !ui.auth &&
          state.screen === 'account' &&
          !state.registration
        "
        :snapshot="state.S"
        @refresh="refresh()"
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
