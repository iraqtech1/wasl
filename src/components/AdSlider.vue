<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";

const slides = [
  {
    title: "من بابك… لكل وجهة",
    text: "شحنات متجرك تبدأ ويا واصل",
    action: "أنشئ شحنتك",
    event: "nav",
    screen: "new",
    icon: "box",
  },
  {
    title: "كابتن قريب، وشحنتك جاهزة",
    text: "شوف المناديب المتاحين بالقرب منك",
    action: "اكتشف المناديب",
    event: "nearby",
    icon: "pin",
  },
  {
    title: "مستعجل؟ اطلب كابتن",
    text: "توصيل حر لشحنتك بدون جدولة زمنية",
    action: "اطلب الآن",
    event: "new-free",
    icon: "send",
  },
];
const current = ref(0);
const hovered = ref(false);
const focused = ref(false);
const reduced = ref(false);
let timer, motion;
let touchX = null;
function move(step) {
  current.value = (current.value + step + slides.length) % slides.length;
}
function onMotion(event) {
  reduced.value = event.matches;
}
function touchEnd(event) {
  if (touchX !== null) {
    const delta = event.changedTouches[0].clientX - touchX;
    if (Math.abs(delta) > 45) move(delta > 0 ? 1 : -1);
  }
  touchX = null;
}
onMounted(() => {
  motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  reduced.value = motion.matches;
  motion.addEventListener("change", onMotion);
  timer = window.setInterval(() => {
    if (!hovered.value && !focused.value && !reduced.value && !document.hidden)
      move(1);
  }, 2000);
});
onBeforeUnmount(() => {
  window.clearInterval(timer);
  motion?.removeEventListener("change", onMotion);
});
</script>
<template>
  <section
    class="ad-slider"
    aria-label="إعلانات واصل"
    aria-roledescription="عارض شرائح"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    @focusin="focused = true"
    @focusout="focused = $event.currentTarget.contains($event.relatedTarget)"
    @touchstart.passive="touchX = $event.touches[0].clientX"
    @touchend.passive="touchEnd"
    @touchcancel="touchX = null"
  >
    <div
      class="ad-slide"
      role="group"
      aria-roledescription="شريحة"
      :aria-label="`${current + 1} من ${slides.length}`"
    >
      <div class="ad-copy">
        <span class="ad-eyebrow">مع واصل</span>
        <h2>{{ slides[current].title }}</h2>
        <p>{{ slides[current].text }}</p>
        <button
          type="button"
          class="ad-cta"
          :data-action="slides[current].event"
          :data-screen="slides[current].screen"
        >
          {{ slides[current].action }} <span aria-hidden="true">←</span>
        </button>
      </div>
      <div
        :key="slides[current].icon"
        class="ad-art"
        :class="`ad-art-${slides[current].icon}`"
        aria-hidden="true"
      >
        <svg viewBox="0 0 80 80" fill="none">
          <ellipse class="art-shadow" cx="40" cy="71" rx="24" ry="3" />
          <template v-if="slides[current].icon === 'box'">
            <path class="art-spark" d="M8 20v8m-4-4h8M68 8v8m-4-4h8" />
            <g class="art-float">
              <path
                class="art-parcel"
                d="m16 26 24-12 24 12v28L40 67 16 54V26Zm0 0 24 13 24-13M40 39v28M28 20l24 13v12"
              />
              <path class="art-label" d="m47 47 10-5v8l-10 5z" />
            </g>
          </template>
          <template v-else-if="slides[current].icon === 'pin'">
            <ellipse class="art-radar" cx="40" cy="65" rx="26" ry="9" />
            <g class="art-float">
              <path
                class="art-pin"
                d="M61 33c0 17-21 35-21 35S19 50 19 33a21 21 0 0 1 42 0Z"
              />
              <circle cx="40" cy="32" r="8" />
            </g>
          </template>
          <template v-else>
            <path class="art-speed" d="M4 31h12M2 41h10M5 51h9" />
            <g class="art-drive">
              <path class="art-parcel" d="M18 23h32v34H18z" />
              <path class="art-pin" d="M50 34h13l11 13v10H50z" />
              <path d="M56 39h5l7 8H56zM29 23v12l5-3 5 3V23" />
              <circle class="art-wheel" cx="29" cy="59" r="7" />
              <circle class="art-wheel" cx="63" cy="59" r="7" />
              <path d="M29 57v4m34-4v4" />
            </g>
          </template>
        </svg>
      </div>
    </div>
    <div class="ad-controls">
      <button type="button" @click="move(-1)" aria-label="الإعلان السابق">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m14 7-5 5 5 5" />
        </svg>
      </button>
      <div class="ad-dots">
        <button
          v-for="(_, index) in slides"
          :key="index"
          type="button"
          :aria-label="`عرض الإعلان ${index + 1}`"
          :aria-current="current === index ? 'true' : undefined"
          @click="current = index"
        ></button>
      </div>
      <button type="button" @click="move(1)" aria-label="الإعلان التالي">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m10 7 5 5-5 5" />
        </svg>
      </button>
    </div>
  </section>
</template>
