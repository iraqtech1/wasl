// Lock the page behind any dialog or popover while preserving its scroll position.
export function initInteractions() {
  let saved = null;
  const openPanel = () =>
    document.querySelector("dialog[open], [popover]:popover-open");
  function sync() {
    if (openPanel() && !saved) {
      saved = {
        x: scrollX,
        y: scrollY,
        style: document.body.getAttribute("style"),
      };
      Object.assign(document.body.style, {
        position: "fixed",
        top: `-${saved.y}px`,
        left: `-${saved.x}px`,
        width: "100%",
      });
      document.documentElement.classList.add("panel-open");
    } else if (!openPanel() && saved) {
      const previous = saved;
      saved = null;
      if (previous.style === null) document.body.removeAttribute("style");
      else document.body.setAttribute("style", previous.style);
      document.documentElement.classList.remove("panel-open");
      window.scrollTo(previous.x, previous.y);
    }
  }
  const observer = new MutationObserver(sync);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["open"],
  });
  document.addEventListener("toggle", sync, true);
  const insidePanel = (target) =>
    target instanceof Element &&
    target.closest("dialog[open], [popover]:popover-open");
  document.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length > 1 || (saved && !insidePanel(event.target)))
        event.preventDefault();
    },
    { passive: false },
  );
  document.addEventListener(
    "wheel",
    (event) => {
      if (event.ctrlKey || (saved && !insidePanel(event.target)))
        event.preventDefault();
    },
    { passive: false },
  );
  document.addEventListener("gesturestart", (event) => event.preventDefault(), {
    passive: false,
  });
  document.addEventListener(
    "gesturechange",
    (event) => event.preventDefault(),
    { passive: false },
  );
}
