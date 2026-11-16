'use strict';
/* NEXT (16 Nov) — closer to Apple's Liquid Glass (iOS 26). What makes it "liquid" is not the blur: the picture behind the glass is BENT
   at the edges (refraction), it stays sharp in the middle, and a light rim catches the light. User: "it wobbles like a drop of rain".
   1) The lens is on ALL the time, also while you scroll (before, it switched to a plain blur while moving, then the lens came back
      only when you stopped: that was the "it only changes when I stop" effect).
   2) Less blur in the middle, the bend at the edge stays (the picture under the bar moves and bends as you scroll).
   3) Press the bar: the lens swells and settles with a spring, like a drop (feDisplacementMap "scale" animated).
   Chrome on Android and computers. Other browsers keep the plain frosted glass. */
(function () {
  const root = document.documentElement;
  // 1) never switch the lens off while moving
  const bar = () => document.querySelector('.tp-tabs');
  // 17 Nov: the lens is OFF again while the page moves (class "mv", set in liquid.js). On the phone the always-on lens drew as blue blocks.
  // 3) the drop: the bend grows when you press, then springs back
  let raf = 0;
  function wobble(peak) {
    const maps = document.querySelectorAll('#g2lens-tabs feDisplacementMap'); if (!maps.length) return;
    const base = maps[0]._base || (maps[0]._base = +maps[0].getAttribute('scale') || 42); cancelAnimationFrame(raf);
    const t0 = performance.now(), D = 900;
    const step = (now) => { const t = Math.min(1, (now - t0) / D), k = Math.exp(-5 * t) * Math.cos(9 * t); // a damped spring
      maps.forEach((m, i) => m.setAttribute('scale', (i === 0 ? base : +(m._base || (m._base = +m.getAttribute('scale') || 0))) + peak * k));
      if (t < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
  }
  document.addEventListener('pointerdown', (e) => { if (root.classList.contains('glass') && e.target.closest && e.target.closest('.tp-tabs, .tp-fab')) wobble(34); }, true);
})();
