const cleanups = new WeakMap();
function mount(card, binding) {
  cleanups.get(card)?.();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
    wrap = card.parentElement;
  const amount = card.querySelector(".orbit-balance strong"),
    target = Number(binding.value || 0);
  const money = (n) => new Intl.NumberFormat("en-US").format(n);
  let frame = 0,
    timer = 0;
  const start = performance.now();
  amount.setAttribute("aria-label", money(target));
  const count = (now) => {
    const progress = Math.min(1, (now - start) / 850);
    amount.textContent = money(
      Math.round(target * (1 - Math.pow(1 - progress, 3))),
    );
    if (progress < 1) frame = requestAnimationFrame(count);
  };
  if (!reduced.matches) frame = requestAnimationFrame(count);
  const reset = () => {
    clearTimeout(timer);
    card.classList.remove("is-tilting");
    card.style.setProperty("--wallet-x", "0deg");
    card.style.setProperty("--wallet-y", "0deg");
  };
  const move = (event) => {
    if (reduced.matches || event.target.closest("button")) return;
    clearTimeout(timer);
    const r = wrap.getBoundingClientRect(),
      x = Math.max(0, Math.min(1, (event.clientX - r.left) / r.width)),
      y = Math.max(0, Math.min(1, (event.clientY - r.top) / r.height));
    card.classList.add("is-tilting");
    for (const [name, value] of Object.entries({
      "--wallet-x": (0.5 - y) * 8 + "deg",
      "--wallet-y": (x - 0.5) * 10 + "deg",
      "--wallet-light-x": x * 100 + "%",
      "--wallet-light-y": y * 100 + "%",
    }))
      card.style.setProperty(name, value);
  };
  const up = () => {
      timer = setTimeout(reset, 450);
    },
    visibility = () => {
      if (document.hidden) reset();
    },
    changed = () => {
      reset();
      cancelAnimationFrame(frame);
      amount.textContent = money(target);
    };
  const listeners = [
    [wrap, "pointerdown", move],
    [wrap, "pointermove", move],
    [wrap, "pointerleave", reset],
    [wrap, "pointercancel", reset],
    [wrap, "pointerup", up],
    [document, "visibilitychange", visibility],
    [reduced, "change", changed],
  ];
  listeners.forEach(([el, type, fn]) => el.addEventListener(type, fn));
  cleanups.set(card, () => {
    cancelAnimationFrame(frame);
    clearTimeout(timer);
    listeners.forEach(([el, type, fn]) => el.removeEventListener(type, fn));
  });
}
export const walletMotion = {
  mounted: mount,
  updated(card, binding) {
    if (binding.value !== binding.oldValue) mount(card, binding);
  },
  beforeUnmount(card) {
    cleanups.get(card)?.();
    cleanups.delete(card);
  },
};
