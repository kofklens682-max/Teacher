'use strict';
/* 22 Nov 2026 (user): "every single button should have its own animation, but everything fast and without lag".
   1. Press: whatever you touch answers at once - a button sinks a little (to 96%), a row or a card a little less (98%) and dims,
      and springs back when you let go. Only "scale" and "opacity" move (the phone's graphics chip does them; nothing is redrawn).
      A finger that starts to scroll cancels it. Things with their own press look (tab bar, dots, + button, switches) keep theirs.
   2. Paid: the second tap on "Yes, paid" - the pill bounces, the tick draws itself, the phone gives a tiny tap; after the list
      is redrawn the new green tick pops in. */
(function () {
  const SKIP = '.tp-tabs,.tp-tabbar,.tp-lights,.tp-fab,.tp-seg2,.seg,.ts-sw,.gb-sw,input,textarea,select,label.nx-row,[disabled],.f22-nopress';
  const BTN = 'button,[role="button"],[data-nxpush],[data-push],[data-sheet],[data-tab]';
  const ROW = '.nx-row,.tp-lrow,.nx-card,.nx-gcard,.nx-wg,.nx-hcard,.tp-wrow,.lb-row,.nx-orow,.bk,.tp-card2';
  let cur = null, x0 = 0, y0 = 0, down = null;
  const anim = (el, to, ms, ease) => { try { el.animate([{ scale: getComputedStyle(el).scale === 'none' ? '1' : getComputedStyle(el).scale, opacity: getComputedStyle(el).opacity }, to], { duration: ms, easing: ease, fill: 'forwards' }); } catch (e) { /* old browser: no press look */ } };
  const release = () => {
    const el = cur; cur = null; clearTimeout(down); if (!el) return;
    anim(el, { scale: '1', opacity: '1' }, 320, 'cubic-bezier(.32,1.25,.5,1)'); // a small spring back
    setTimeout(() => { try { el.getAnimations().forEach((a) => { if (a.effect && a.effect.getKeyframes().some((k) => 'scale' in k)) a.cancel(); }); } catch (e) { /* fine */ } }, 360);
  };
  document.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    const t = e.target.closest && e.target.closest(BTN); if (!t || t.closest(SKIP)) return;
    const big = t.matches(ROW) || t.closest(ROW) === t, r = t.getBoundingClientRect();
    if (r.height > innerHeight * 0.6) return; // a whole page is not a button
    x0 = e.clientX; y0 = e.clientY; cur = t;
    // a short wait: a finger that is starting to scroll never presses anything
    down = setTimeout(() => { if (cur === t) anim(t, big ? { scale: '0.98', opacity: '0.82' } : { scale: '0.96', opacity: '0.9' }, 110, 'ease-out'); }, 45);
  }, { passive: true, capture: true });
  document.addEventListener('pointermove', (e) => { if (cur && Math.hypot(e.clientX - x0, e.clientY - y0) > 8) release(); }, { passive: true, capture: true });
  ['pointerup', 'pointercancel', 'scroll'].forEach((k) => document.addEventListener(k, release, { passive: true, capture: true }));

  // ---- 2. Paid ----
  let justPaid = null;
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('.nx-tick.arm[data-nxtick]'); if (!b || Date.now() - (b._t || 0) < 350) return;
    justPaid = b.dataset.nxtick.split('|')[1];
    b.classList.add('f22-paid');
    try { if (navigator.vibrate) navigator.vibrate(12); } catch (err) { /* no vibration */ }
    setTimeout(() => { justPaid = null; }, 2500);
  }, true);
  if (typeof draw === 'function') {
    const _d = draw;
    draw = function () {
      const r = _d.apply(this, arguments);
      if (justPaid) { const sid = justPaid; requestAnimationFrame(() => document.querySelectorAll(`[data-sid="${CSS.escape(sid)}"]`).forEach((n) => { const row = n.closest('.nx-prow,.nx-row'); const x = row && row.querySelector('.nx-tick.done'); if (x) x.classList.add('f22-pop'); })); }
      return r;
    };
  }
})();
