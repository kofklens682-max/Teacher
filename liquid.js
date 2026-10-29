'use strict';
/* Liquid glass tab bar (draft). One picture only: the real icon stays where it is and simply grows while you press the bar or slide
   along it. The glass bubble sits behind it. This file only switches the class "press" on the bar; the look is all in liquid.css. */
(function () {
  // Every control with a sliding highlight: the tab bars, segmented controls (Entries / Calendar / Groups...) and the week strip.
  const SLIDERS = '.tp-tabs, .tabs, .seg, .tp-seg2.slide, .wstrip';
  let held = [];
  const release = () => { held.forEach((el) => el.classList.remove('press')); held = []; };
  document.addEventListener('pointerdown', (e) => {
    release();
    const el = e.target.closest && e.target.closest(SLIDERS);
    if (el) { el.classList.add('press'); held.push(el); }
  }, { passive: true, capture: true });
  ['pointerup', 'pointercancel'].forEach((t) => window.addEventListener(t, release, { passive: true, capture: true }));
  window.addEventListener('blur', release);
})();
/* While a sheet or a whole screen slides, html gets the class "moving": the glass bar stops re-blurring what moves under it
   (the main cause of lag on the phone). Small things (a chip, a toggle) do not count. */
(function () {
  let n = 0, t = 0;
  const big = (el) => el instanceof Element && el.offsetHeight > 300 && !el.closest('.tp-tabs, .tabs');
  const off = () => { n = 0; document.documentElement.classList.remove('moving'); };
  const on = (e) => { if (e.propertyName !== 'transform' || !big(e.target)) return; n++; document.documentElement.classList.add('moving'); clearTimeout(t); t = setTimeout(off, 900); };
  const end = (e) => { if (e.propertyName !== 'transform' || !big(e.target)) return; if (--n <= 0) { clearTimeout(t); t = setTimeout(off, 60); } };
  document.addEventListener('transitionrun', on, true);
  document.addEventListener('transitionend', end, true);
  document.addEventListener('transitioncancel', end, true);
})();
