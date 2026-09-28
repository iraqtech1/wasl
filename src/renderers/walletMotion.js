// Degrees of hand movement that push the card to its full deflection.
const TILT_LIMIT = 22;
const TILT_X = 7;
const TILT_Y = 9;
const VARS = [
  "--wallet-x",
  "--wallet-y",
  "--wallet-light-x",
  "--wallet-light-y",
];
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const cleanups = new WeakMap();
function mount(card, binding) {
  cleanups.get(card)?.();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)"),
    wrap = card.parentElement;
  const amount = card.querySelector(".orbit-balance strong"),
    target = Number(binding.value || 0);
  const money = (n) => new Intl.NumberFormat("en-US").format(n);
  let frame = 0,
    timer = 0,
    gyroFrame = 0,
    gyroTimer = 0,
    gyroOn = false,
    asked = false,
    // While the sensors report, they own the card and pointers stay out.
    sensors = false,
    base = null,
    pending = null;
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
  const set = (values) => {
    card.classList.add("is-tilting");
    for (const [name, value] of Object.entries(values))
      card.style.setProperty(name, value);
  };
  const reset = () => {
    clearTimeout(timer);
    clearTimeout(gyroTimer);
    sensors = false;
    card.classList.remove("is-tilting");
    for (const name of VARS) card.style.removeProperty(name);
  };
  const release = () => {
    if (!sensors) reset();
  };
  const move = (event) => {
    if (reduced.matches || sensors || event.target.closest("button")) return;
    clearTimeout(timer);
    const r = wrap.getBoundingClientRect(),
      x = clamp((event.clientX - r.left) / r.width, 0, 1),
      y = clamp((event.clientY - r.top) / r.height, 0, 1);
    set({
      "--wallet-x": (0.5 - y) * 8 + "deg",
      "--wallet-y": (x - 0.5) * 10 + "deg",
      "--wallet-light-x": x * 100 + "%",
      "--wallet-light-y": y * 100 + "%",
    });
  };
  const up = () => {
    if (!sensors) timer = setTimeout(reset, 450);
  };
  // The gyroscope turns the phone, so the card counter-rotates a fraction of
  // that: it reads as an object sitting behind the glass. The first reading is
  // the rest pose, which keeps the card neutral whatever grip it is held in.
  const orient = (event) => {
    if (reduced.matches) return;
    if (typeof event.beta !== "number" || typeof event.gamma !== "number")
      return;
    if (!base) base = [event.beta, event.gamma];
    pending = [event.beta, event.gamma];
    sensors = true;
    clearTimeout(gyroTimer);
    if (!gyroFrame)
      gyroFrame = requestAnimationFrame(() => {
        gyroFrame = 0;
        if (!pending || !base) return;
        const x = clamp((pending[0] - base[0]) / TILT_LIMIT, -1, 1),
          y = clamp((pending[1] - base[1]) / TILT_LIMIT, -1, 1);
        set({
          "--wallet-x": -x * TILT_X + "deg",
          "--wallet-y": y * TILT_Y + "deg",
          "--wallet-light-x": (0.5 + y * 0.4) * 100 + "%",
          "--wallet-light-y": (0.5 - x * 0.4) * 100 + "%",
        });
      });
    // Let the card float again once the phone is held still.
    gyroTimer = setTimeout(reset, 900);
  };
  const startGyro = () => {
    if (gyroOn) return;
    gyroOn = true;
    window.addEventListener("deviceorientation", orient);
  };
  const askGyro = () => {
    // iOS keeps the sensor behind a prompt that a gesture has to open. The
    // listener is already in place, so granting is all that is left to do.
    if (asked || typeof DeviceOrientationEvent === "undefined") return;
    if (typeof DeviceOrientationEvent.requestPermission !== "function") return;
    asked = true;
    try {
      DeviceOrientationEvent.requestPermission()
        .then((state) => state === "granted" && startGyro())
        .catch(() => {});
    } catch {
      asked = false;
    }
  };
  const visibility = () => {
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
    [wrap, "pointerleave", release],
    [wrap, "pointercancel", release],
    [wrap, "pointerup", up],
    [document, "visibilitychange", visibility],
    [reduced, "change", changed],
  ];
  // The listener goes on straight away — sensors that need no consent (Android)
  // start driving the card at once, and iOS only delivers events after its
  // consent prompt, which a gesture has to open.
  if (typeof DeviceOrientationEvent !== "undefined") {
    startGyro();
    if (typeof DeviceOrientationEvent.requestPermission === "function")
      listeners.push([document, "pointerdown", askGyro, { once: true }]);
  }
  listeners.forEach(([el, type, fn, options]) =>
    el.addEventListener(type, fn, options),
  );
  cleanups.set(card, () => {
    cancelAnimationFrame(frame);
    cancelAnimationFrame(gyroFrame);
    clearTimeout(timer);
    clearTimeout(gyroTimer);
    if (gyroOn) {
      gyroOn = false;
      window.removeEventListener("deviceorientation", orient);
    }
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
