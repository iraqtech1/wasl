<script setup>
import { ref } from "vue";
import { darkMode, toggleTheme } from "../services/theme.js";
defineProps({ signedIn: Boolean, guest: Boolean });
const panel = ref(null);
const page = ref("menu");
function open(value) {
  page.value = value;
  if (!panel.value.open) panel.value.showModal();
}
function close() {
  panel.value.close();
}
const icons = {
  logout: "M10 17l5-5-5-5M15 12H3M13 3h7v18h-7",
  privacy: "M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6zM8 12l3 3 5-6",
  about: "M12 11v6M12 7v.01",
  moon: "M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z",
  settings: "M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4",
};
</script>
<template>
  <button
    v-if="guest"
    class="guest-settings"
    type="button"
    @click="open('menu')"
    aria-label="حسابي والإعدادات"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path :d="icons.settings" /></svg
    ><span>الإعدادات</span>
  </button>
  <section v-else class="account-options" aria-label="إعدادات الحساب">
    <button class="account-option" data-action="logout" type="button">
      <span class="option-icon"
        ><svg viewBox="0 0 24 24" aria-hidden="true"><path :d="icons.logout" /></svg></span
      ><strong>تسجيل الخروج</strong><span class="option-chevron">‹</span>
    </button>
    <button class="account-option" type="button" @click="open('privacy')">
      <span class="option-icon"
        ><svg viewBox="0 0 24 24" aria-hidden="true"><path :d="icons.privacy" /></svg></span
      ><strong>الخصوصية والشروط</strong><span class="option-chevron">‹</span>
    </button>
    <button class="account-option" type="button" @click="open('about')">
      <span class="option-icon"
        ><svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path :d="icons.about" /></svg></span
      ><strong>حول التطبيق</strong><span class="option-chevron">‹</span>
    </button>
    <button
      class="account-option"
      type="button"
      role="switch"
      :aria-checked="darkMode"
      @click="toggleTheme"
    >
      <span class="option-icon"
        ><svg viewBox="0 0 24 24" aria-hidden="true"><path :d="icons.moon" /></svg></span
      ><strong>الوضع الليلي</strong
      ><span
        class="theme-switch"
        :class="{ on: darkMode }"
        aria-hidden="true"
      ></span>
    </button>
  </section>
  <dialog
    ref="panel"
    class="settings-dialog"
    aria-labelledby="settings-title"
    @click="
      (e) => {
        if (e.target === panel) close();
      }
    "
  >
    <div class="dialog-head">
      <h2 id="settings-title">
        {{
          page === "privacy"
            ? "الخصوصية والشروط"
            : page === "about"
              ? "حول التطبيق"
              : "حسابي والإعدادات"
        }}
      </h2>
      <button
        type="button"
        class="settings-close"
        aria-label="إغلاق"
        @click="close"
      >
        ×
      </button>
    </div>
    <div v-if="page === 'menu'" class="account-options">
      <button
        type="button"
        class="account-option"
        :data-action="signedIn ? 'logout' : 'login-page'"
        @click="close"
      >
        <span class="option-icon"
          ><svg viewBox="0 0 24 24" aria-hidden="true"><path :d="icons.logout" /></svg></span
        ><strong>{{ signedIn ? "تسجيل الخروج" : "تسجيل الدخول" }}</strong
        ><span class="option-chevron">‹</span>
      </button>
      <button type="button" class="account-option" @click="open('privacy')">
        <span class="option-icon"
          ><svg viewBox="0 0 24 24" aria-hidden="true"><path :d="icons.privacy" /></svg></span
        ><strong>الخصوصية والشروط</strong><span class="option-chevron">‹</span>
      </button>
      <button type="button" class="account-option" @click="open('about')">
        <span class="option-icon"
          ><svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path :d="icons.about" /></svg></span
        ><strong>حول التطبيق</strong><span class="option-chevron">‹</span>
      </button>
      <button
        type="button"
        class="account-option"
        role="switch"
        :aria-checked="darkMode"
        @click="toggleTheme"
      >
        <span class="option-icon"
          ><svg viewBox="0 0 24 24" aria-hidden="true"><path :d="icons.moon" /></svg></span
        ><strong>الوضع الليلي</strong
        ><span
          class="theme-switch"
          :class="{ on: darkMode }"
          aria-hidden="true"
        ></span>
      </button>
    </div>
    <div v-else-if="page === 'privacy'" class="policy-copy">
      <h3>خصوصية النسخة الحالية</h3>
      <p>
        واصل حاليًا واجهة تجريبية. تُحفظ بيانات الحساب والطلبات التجريبية
        وإعدادات المظهر وحالة قراءة الإشعارات داخل متصفحك على هذا الجهاز. لا
        تُزامن هذه البيانات مع أجهزة أخرى.
      </p>
      <h3>الصور والموقع</h3>
      <p>
        اختيار الصور أو استخدام الكاميرا والموقع يتم بطلب منك وبإذن الجهاز. لا
        تُحفظ كلمات المرور أو صور المستمسكات ضمن سجل البيانات التجريبية. روابط
        الخرائط الخارجية تخضع لسياسة مزوّدها.
      </p>
      <h3>التحكم ببياناتك</h3>
      <p>
        يمكن حذف البيانات المحلية من إعدادات موقع واصل في المتصفح. تسجيل الخروج
        ينهي الدخول الحالي ولا يمسح البيانات المحفوظة. تجنّب إدخال معلومات أو
        مستمسكات حقيقية في هذه النسخة.
      </p>
      <h3>شروط الاستخدام</h3>
      <p>
        الطلبات والأرصدة والإجراءات الحالية مخصّصة لتجربة الواجهة ولا تنفذ
        توصيلًا أو دفعًا ماليًا فعليًا. استخدم التطبيق بصورة مشروعة ولا تُدخل
        بيانات أشخاص آخرين دون إذنهم.
      </p>
      <p>
        سيُحدّث هذا النص عند ربط الخدمات الفعلية بالخادم، قبل جمع أو معالجة
        بيانات التشغيل.
      </p>
    </div>
    <div v-else class="about-copy">
      <span class="about-mark">واصل</span>
      <p>WASIL · FOR DELIVERY</p>
      <h3>شركة عراق تكنو للحلول البرمجية</h3>
      <p>الشركة المطوّرة لمشروع واصل.</p>
      <p>منظومة تربط واجهات التاجر والمندوب لتنظيم الطلبات ومتابعة التوصيل.</p>
      <span class="about-version">الإصدار 3.0 · واجهة تجريبية</span>
    </div>
  </dialog>
</template>
