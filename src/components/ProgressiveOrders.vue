<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from "vue";
const props = defineProps({ orders: Array });
const limit = ref(20), showAll = ref(false), sentinel = ref(null);
const visible = computed(() => showAll.value ? props.orders : props.orders.slice(0, limit.value));
const more = computed(() => visible.value.length < props.orders.length);
let observer;
function loadMore() { limit.value += 20; }
function toggleAll() { showAll.value = !showAll.value; limit.value = 20; }
async function observe() {
  await nextTick();
  observer?.disconnect();
  if (sentinel.value && more.value) observer?.observe(sentinel.value);
}
onMounted(() => {
  if (typeof IntersectionObserver !== "undefined") {
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting) && more.value) {
        observer.disconnect();
        loadMore();
      }
    }, { rootMargin: "0px", threshold: 0.1 });
    observe();
  }
});
watch([() => visible.value.length, more], observe);
onBeforeUnmount(() => observer?.disconnect());
</script>
<template>
  <div class="registry-display-options">
    <p class="home-page-summary registry-order-count" role="status">عدد الطلبات<strong>{{ orders.length }}</strong></p>
    <button type="button" class="secondary-button" :aria-pressed="showAll" @click.stop="toggleAll">{{ showAll ? 'عرض تدريجي' : 'إظهار الكل' }}</button>
  </div>
  <slot :visible="visible" />
  <div v-if="more" ref="sentinel" class="orders-load-more">
    <button type="button" class="secondary-button" @click.stop="loadMore">عرض 20 طلب إضافي</button>
  </div>
</template>
<style scoped>
.registry-display-options .registry-order-count{margin:0;font-family:'Cairo',sans-serif;font-size:17px;font-weight:700;line-height:1.7;color:#00567a}
.registry-order-count strong{display:block;margin-top:2px;font-size:22px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1.4}
:global(html[data-theme=dark]) .registry-display-options .registry-order-count{color:#d7edf8}
.orders-load-more{display:flex;justify-content:center;padding:20px 0 32px}
</style>
