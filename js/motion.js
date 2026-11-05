'use strict';
/* Motion (user, 4 Nov 2026: "everything animated, iPhone style, smooth, without rushes").
   1. Reveal on view: a card that is drawn below the screen waits, and plays its entrance (fade-up, the ring drawing, the bar
      growing) when it scrolls into view, so the student pie chart draws itself when you reach it, not unseen.
   2. Cards of a newly opened screen come in one after another (a short stagger).
   3. Big numbers count up from 0 when they appear (the students total, "12 of 27 paid").
   Plain redraws (a tap, a tick: class "nin") stay still, as before. Loaded last. */
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  const CARD = '.h-in, .tp-card2, .hv-card, .io-card, .dn-card, .dr-donut, .tp-list, .tl-sec, .pk-row, .tp-lesrow2, .ds-prev';
  const NUM = '.dr-donut .c b, .hv-big b';
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return; io.unobserve(e.target); const el = e.target;
    el.classList.remove('rv'); el.classList.add('rv-go'); countUp(el);
  }), { rootMargin: '0px 0px -6% 0px', threshold: 0.12 }) : null;

  function countUp(root) {
    if (RM.matches) return;
    root.querySelectorAll && [root, ...root.querySelectorAll(NUM)].forEach((b) => {
      if (!b.matches || !b.matches(NUM) || b.dataset.cu) return;
      const t = b.textContent.trim(); if (!/^\d{1,4}$/.test(t) || +t < 2) return;
      b.dataset.cu = 1; const to = +t, t0 = performance.now(), dur = Math.min(900, 420 + to * 25);
      const step = (now) => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); b.textContent = String(Math.round(to * e)); if (k < 1) requestAnimationFrame(step); else b.textContent = t; };
      b.textContent = '0'; requestAnimationFrame(step);
    });
  }
  function fresh(node) { // an element that was just put on the page with its entrance (not a quiet redraw)
    return !(node.closest && node.closest('.nin'));
  }
  function handle(node) {
    if (node.nodeType !== 1 || !fresh(node) || RM.matches) return;
    const list = [...(node.matches(CARD) ? [node] : []), ...node.querySelectorAll(CARD)];
    const vh = innerHeight; let n = 0;
    list.forEach((el) => {
      if (el.parentElement && el.parentElement.closest('.rv')) return; // its parent waits already
      if (el.closest('.tp-sheet, .pv')) return; // 5 Nov: pop-ups and files have their own zoom (js/morph.js); a second entrance on top made them look like they loaded twice
      const r = el.getBoundingClientRect(); if (!r.height) return;
      const inPush = el.closest('.tp-push, .panel');
      if (r.top > vh - 10 && io) { el.classList.add('rv'); if (!el.classList.contains('h-in') && !el.matches('.dr-donut')) el.classList.add('mo-in'); io.observe(el); return; }
      if (inPush && !el.classList.contains('h-in') && el.matches('.tp-card2, .tp-list, .tl-sec, .tp-lesrow2, .pk-row') && n < 9) { el.style.setProperty('--mi', n++); el.classList.add('mo-in'); }
      countUp(el);
    });
  }
  const mo = new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(handle)));
  const start = () => { mo.observe(document.body, { childList: true, subtree: true }); handle(document.body); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
