import { computed, ref, watch, onBeforeUnmount } from "vue";
export function useNotificationBadge(state) {
  const readIds = ref([]),
    pulse = ref(false);
  let owner = null,
    known = new Set(),
    timer;
  const notifications = computed(() => state.S?.notifications || []);
  const unread = computed(
    () =>
      notifications.value.filter((n) => !readIds.value.includes(n.id)).length,
  );
  watch(
    () => [state.S?.user.id, notifications.value],
    ([id, items]) => {
      if (!id) {
        owner = null;
        known = new Set();
        readIds.value = [];
        pulse.value = false;
        clearTimeout(timer);
        return;
      }
      if (owner !== id) {
        clearTimeout(timer);
        pulse.value = false;
        owner = id;
        known = new Set();
        try {
          const saved = JSON.parse(
            localStorage.getItem("wasel-notifications-read-" + id) || "[]",
          );
          readIds.value = Array.isArray(saved) ? saved : [];
        } catch {
          readIds.value = [];
        }
      }
      const incoming = items.some(
        (n) => !known.has(n.id) && !readIds.value.includes(n.id),
      );
      known = new Set(items.map((n) => n.id));
      if (incoming) {
        clearTimeout(timer);
        pulse.value = true;
        timer = setTimeout(() => (pulse.value = false), 3600);
      }
    },
    { immediate: true },
  );
  function markRead() {
    readIds.value = notifications.value.map((n) => n.id);
    pulse.value = false;
    clearTimeout(timer);
    try {
      localStorage.setItem(
        "wasel-notifications-read-" + owner,
        JSON.stringify(readIds.value),
      );
    } catch {}
  }
  onBeforeUnmount(() => clearTimeout(timer));
  return { unread, pulse, markRead };
}
