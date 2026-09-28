/* =====================================================================
   بطاقة المستحق 3D — السلوك (الإمالة بالإصبع/الماوس + عدّاد المبلغ)
   الاستعمال:  const stop = Bal3D.init(document.querySelector('.bal3d-wrap'), { amount: 335000 });
               stop();   // عند إزالة البطاقة (React/Vue) لإلغاء المستمعين
   ===================================================================== */
(function (global) {
  function countUp(el, to, ms, fmt) {
    var t0 = performance.now();
    var frame = 0;
    function step(now) {
      var k = Math.min(1, (now - t0) / ms);
      var e = 1 - Math.pow(1 - k, 3);                 // easeOutCubic
      el.textContent = fmt(Math.round(to * e));
      if (k < 1 && el.isConnected) frame = requestAnimationFrame(step);
    }
    frame = requestAnimationFrame(step);
    return function () { cancelAnimationFrame(frame); };
  }

  function init(wrap, opts) {
    opts = opts || {};
    if (!wrap) return function () {};
    var card = wrap.querySelector('.bal3d');
    var amt = wrap.querySelector('[data-bal3d-amount]');
    var fmt = opts.format || function (v) { return v.toLocaleString('en-US'); };
    var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var stopCount = function () {};

    // 1) عدّاد المبلغ (من 0 إلى القيمة)
    if (amt) {
      var to = opts.amount != null ? +opts.amount : +String(amt.textContent).replace(/[^\d.-]/g, '');
      if (!isNaN(to)) {
        if (reduced || opts.animate === false) amt.textContent = fmt(to);
        else stopCount = countUp(amt, to, opts.duration || 1100, fmt);
      }
    }
    if (!card || card.dataset.bal3dReady || reduced) return stopCount;
    card.dataset.bal3dReady = '1';

    // 2) الإمالة حسب موقع الإصبع/الماوس
    var MAX_Y = opts.tiltY || 22, MAX_X = opts.tiltX || 18, timer = 0;
    function move(x, y) {
      var r = card.getBoundingClientRect();
      var px = Math.min(1, Math.max(0, (x - r.left) / r.width));
      var py = Math.min(1, Math.max(0, (y - r.top) / r.height));
      card.style.setProperty('--ry', ((px - .5) * MAX_Y).toFixed(2) + 'deg');
      card.style.setProperty('--rx', ((.5 - py) * MAX_X).toFixed(2) + 'deg');
      card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    }
    function onMove(e) { clearTimeout(timer); card.classList.add('touching'); move(e.clientX, e.clientY); }
    function leave() { card.classList.remove('touching'); card.style.removeProperty('--rx'); card.style.removeProperty('--ry'); }
    function onUp() { timer = setTimeout(leave, 900); }

    card.addEventListener('pointerdown', onMove);
    card.addEventListener('pointermove', onMove);
    card.addEventListener('pointerleave', leave);
    card.addEventListener('pointerup', onUp);
    card.addEventListener('pointercancel', leave);

    return function destroy() {
      stopCount();
      clearTimeout(timer);
      card.removeEventListener('pointerdown', onMove);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerleave', leave);
      card.removeEventListener('pointerup', onUp);
      card.removeEventListener('pointercancel', leave);
      delete card.dataset.bal3dReady;
    };
  }

  global.Bal3D = { init: init, countUp: countUp };
})(window);
