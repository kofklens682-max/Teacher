'use strict';
/* NEXT (16 Nov, user: "I love the bounce of the class card — copy it throughout the app").
   1) Lists and pages: pull past the top or the bottom and the page gives a little, then springs back (like iPhone).
   2) Cards, rows and buttons: pressed = a little smaller, let go = springs back with a small overshoot (CSS, bounce.css).
   3) Pop-ups rise with the same spring. Shared by Teacher and Budget: the scroll areas are listed in BOUNCE_AREAS. */
(function () {
  const AREAS = window.BOUNCE_AREAS || '.tp-page, .tp-push'; // 17 Nov: not the pop-ups (they lifted off the bottom edge)
  const moved = (el) => (el.classList.contains('tp-push') ? el.querySelector(':scope > .tp-inner') : el); // a pushed page: the bar on top stays, only the part under it gives
  let st = null;
  const atTop = (el) => el.scrollTop <= 0, atEnd = (el) => el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
  document.addEventListener('touchstart', (e) => {
    const el = e.target.closest && e.target.closest(AREAS); if (!el || e.touches.length > 1) return;
    if (e.target.closest('[data-noswipe], .nx-hero, input, textarea, select')) return;
    const mv = moved(el); if (!mv) return;
    st = { el, mv, y0: e.touches[0].clientY, x0: e.touches[0].clientX, on: false, dir: 0 };
  }, { passive: true, capture: true });
  document.addEventListener('touchmove', (e) => {
    if (!st) return; const y = e.touches[0].clientY, dy = y - st.y0, dx = e.touches[0].clientX - st.x0;
    if (!st.on) {
      if (Math.abs(dy) < 6) return; if (Math.abs(dx) > Math.abs(dy)) { st = null; return; }
      if (dy > 0 && atTop(st.el)) st.dir = 1; else if (dy < 0 && atEnd(st.el)) st.dir = -1; else { st = null; return; }
      st.on = true; st.y0 = y; st.mv.style.transition = 'none'; st.mv.style.willChange = 'transform';
    }
    const d = (y - st.y0) * st.dir; if (d <= 0) { st.mv.style.transform = ''; return; }
    const pull = st.dir * Math.min(110, 110 * (1 - Math.exp(-d / 220))); // gives less and less the further you pull
    st.mv.style.transform = `translate3d(0,${pull.toFixed(1)}px,0)`;
  }, { passive: true, capture: true });
  const end = () => { if (!st) return; const el = st.mv, on = st.on; st = null; if (!on) return;
    el.style.transition = 'transform .55s cubic-bezier(.3,1.45,.5,1)'; el.style.transform = '';
    setTimeout(() => { el.style.transition = ''; el.style.willChange = ''; }, 600); };
  document.addEventListener('touchend', end, true); document.addEventListener('touchcancel', end, true);
})();
