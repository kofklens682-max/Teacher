'use strict';
/* 17 Nov 2026 (user): "the lag when I open or close pages - deal with it once and forever" + "not just smooth: open the way the iPhone does".

   1) THE LAG (measured, Tests/teacher-openclose.js + teacher-paintwho.js, CPU x4): opening or closing a screen moved the WHOLE
      viewport 30% to the left (all five tab pages, about 1,650 elements) and faded a dark layer inside it. Moving that big box made
      the phone repaint every tab page at the first frame: 130-260 ms of painting = the hitch. Now only the page you see moves (it is
      already its own layer, so moving it costs nothing: 7-20 ms) and the darkening is a separate layer that only fades.
   2) iPHONE ZOOM: a screen opened by tapping a row or a card grows out of that row and shrinks back into it when closed (iOS 18
      "zoom" navigation). Only transform and opacity move (no layout, no repaint). Back to the row only if it is still on screen,
      otherwise the usual slide. Settings > Look > "Open like iPhone" turns it off (key "f20-zoom").
   3) iPHONE SHEETS: while a pop-up sheet is open the page behind sinks back a little (smaller, rounded), like iOS sheets. */
(function () {
  if (typeof syncScreen !== 'function' || typeof slideAway !== 'function') return;
  const KEY = 'f20-zoom';
  const zoomOn = () => { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } };
  /* 17 Nov, second version (user: "the animation is terrible: it stretches, the edges are not covered, at the end the corners fill
     white at once, closing just disappears; do it the way the iPhone does"). How the iPhone zoom works (WWDC24 "Enhance your UI
     animations and transitions"): the tapped cell MORPHS into the new screen on the system "smooth" spring (no bounce, ~0.5 s), and
     goes back into the same cell. Here:
     - the new screen is drawn at full size and only scaled evenly (never stretched); a rounded window (clip-path) starts exactly at
       the row's shape and grows to the whole screen while the corners round off to 0 together, so nothing is uncovered and nothing
       snaps at the end;
     - the row stays under it and the new screen fades in over it (a cross-fade, like iOS);
     - closing runs the same path backwards and lands exactly on the row, fading into it (it never just vanishes);
     - the timing is a real critically damped spring (response 0.5 s), written as a CSS linear() curve. */
  const spring = (resp, dur, n) => { const w = (2 * Math.PI) / resp, x = (t) => 1 - (1 + w * t) * Math.exp(-w * t), end = x(dur), pts = [];
    for (let i = 0; i <= n; i++) pts.push((x((dur * i) / n) / end).toFixed(4)); pts[0] = '0'; pts[n] = '1'; return `linear(${pts.join(',')})`; };
  let EASE = 'cubic-bezier(.32,.72,0,1)';
  try { if (CSS.supports('transition-timing-function', 'linear(0, 1)')) EASE = spring(0.5, 0.62, 40); } catch (e) { /* older browser: the bezier */ }
  const DUR = 620, DUR_BACK = 600;
  document.documentElement.style.setProperty('--f20-spring', EASE);

  // the darkening behind a screen: its own element, only its opacity changes
  let shade = null;
  const getShade = () => { if (!shade || !shade.isConnected) { shade = document.createElement('div'); shade.className = 'f20-shade'; } return shade; };

  // which row / card was tapped last (for the zoom)
  let src = null, srcT = 0;
  const SRC = '[data-nxpush],[data-push],.nx-row,.nx-card,.nx-gcard,.nx-wg,.nx-hcard,.tp-wrow,.tp-lesrow2,.lb-row,.nx-hero,button';
  document.addEventListener('pointerdown', (e) => {
    const t = e.target && e.target.closest && e.target.closest(SRC);
    if (!t || t.closest('.tp-tabs,.tp-pushbar,.tp-sheet,.tp-fab,.tp-lights,.tp-avatar')) { src = null; return; }
    // a whole row or card reads better than a small button inside it
    const s = t.closest('.nx-row,.nx-card,.nx-gcard,.nx-wg,.nx-hcard,.tp-wrow,.lb-row,.nx-hero') || t;
    if (!zoomOn()) { src = null; return; }
    // everything the zoom needs is measured NOW, while the page is untouched (measuring later, after the new screen was built and
    // classes were changed, forced the phone to lay the page out again in the middle of the tap: measured 70-80 ms on a slow phone)
    const k = s.closest('[data-nxpush],[data-push]') || s.querySelector('[data-nxpush],[data-push]');
    src = { s, r: s.getBoundingClientRect(), rad: radOf(s), B: box(), key: k ? ['nxpush', 'push', 'g', 'sid'].filter((a) => k.dataset[a] !== undefined).map((a) => `[data-${a}="${CSS.escape(k.dataset[a])}"]`).join('') : '' };
    srcT = performance.now();
  }, true);
  const takeSrc = () => { const x = src; src = null; if (!x || performance.now() - srcT > 900 || !x.s.isConnected) return null; return x.r.width > 40 && x.r.height > 20 ? x : null; };
  const onScreen = (el) => { if (!el || !el.isConnected) return null; const r = el.getBoundingClientRect(), H = innerHeight; return r.width > 40 && r.height > 20 && r.bottom > 40 && r.top < H - 40 ? r : null; };

  // what lies under the top screen: the screen below it, or the page of the current tab
  const below = () => (R.stack && R.stack.length > 1 ? R.stack[R.stack.length - 2] : R.pages[T.tab]);


  const _sync = syncScreen;
  syncScreen = function () {
    const before = R.stack ? R.stack.slice() : [];
    const r = _sync.apply(this, arguments);
    const stack = R.stack || [], top = stack[stack.length - 1];
    // a new screen opened from a tapped row: grow out of it (first, before anything else changes the page)
    if (top && !before.includes(top) && top.classList.contains('prep') && zoomOn()) { const s0 = takeSrc(); if (s0) zoomIn(top, s0); }
    // the current tab page carries the iPhone "parallax" instead of the whole viewport
    R.pages.forEach((p, i) => { const want = i === T.tab; if (p.classList.contains('f20-cur') !== want) p.classList.toggle('f20-cur', want); });
    // the darkening sits right under the top screen
    const sh = getShade();
    if (top) { if (sh.nextSibling !== top || sh.parentNode !== R.screens) R.screens.insertBefore(sh, top); requestAnimationFrame(() => sh.classList.add('on')); }
    else sh.classList.remove('on');
    if (!stack.some((x) => x.classList.contains('f20-z'))) { R.vp.classList.remove('f20-zv'); document.querySelectorAll('.f20-zb').forEach((x) => { if (!stack.includes(x) || x === top) x.classList.remove('f20-zb'); }); }
    return r;
  };

  function zoomIn(el, x) {
    const s = x.s;
    // measure first (the new screen's layout is fresh), change classes after
    const m = morph(el, x.B, x.r, x.rad, (t) => springAt(t, DUR), DUR, 0);
    el._f20src = s; el._f20key = x.key; // the key finds the same row again if the page underneath is redrawn meanwhile
    el.classList.add('f20-z', 'f20-zin');
    const b = below(); if (b) b.classList.add('f20-zb'); el._f20b = b;
    if (R.vp.classList.contains('under') || b === R.pages[T.tab]) R.vp.classList.add('f20-zv');
    const f = el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }); // solid quickly: no see-through window
    el._f20t0 = performance.now(); el._f20m = m; el._f20f = f;
    m.anims[0].onfinish = () => { el.classList.remove('prep'); void getComputedStyle(el).transform; el.classList.remove('f20-zin'); m.done(); f.cancel(); el._f20m = null; };
    // the page underneath is redrawn ~0.5 s after a screen opens: wait until the zoom has finished, so nothing else runs during it
    clearTimeout(R.lateDraw); R.lateDraw = setTimeout(() => draw(), DUR + 120);
  }
  /* The morph, done with transforms only (the phone's graphics chip moves them; nothing is repainted). A first version clipped the
     screen with clip-path: measured, it repainted the whole screen on every frame (300-450 ms of painting on a slow phone).
     - the screen's own box is the window: it is moved and scaled from the row's rectangle (x and y separately) to the full screen;
     - its content is scaled back on the y axis (scale correction), so the content is always scaled EVENLY by the window's width:
       nothing stretches;
     - the corner radius is given per axis, so the corners look round at every size and reach 0 at the end;
     - 24 keyframes are computed from the spring, so the window and its content stay exactly in step. */
  const springAt = (t, durMs) => { const w = (2 * Math.PI) / 0.5, x = (u) => 1 - (1 + w * u) * Math.exp(-w * u), end = x(durMs / 1000); return Math.min(1, x(t) / end); };
  const box = () => { const b = R.vp.getBoundingClientRect(); return { L: b.left, T: b.top, W: b.width || innerWidth, H: b.height || innerHeight }; };
  const radOf = (s) => { try { return Math.max(14, parseFloat(getComputedStyle(s).borderTopLeftRadius) || 0); } catch (e) { return 16; } };
  function frameAt(B, r, rad, p) { // p = 0: the row; p = 1: the whole screen
    const L = (r.left - B.L) * (1 - p), T0 = (r.top - B.T) * (1 - p), w = r.width + (B.W - r.width) * p, h = r.height + (B.H - r.height) * p;
    const sx = Math.max(0.02, w / B.W), sy = Math.max(0.02, h / B.H), R0 = rad * (1 - p);
    return { tf: `translate3d(${L.toFixed(2)}px,${T0.toFixed(2)}px,0px) scale(${sx.toFixed(5)},${sy.toFixed(5)})`, br: `${(R0 / sx).toFixed(2)}px / ${(R0 / sy).toFixed(2)}px`, inner: `scale(1,${(sx / sy).toFixed(5)})`, p };
  }
  function morph(el, B, r, rad, pOf, dur) {
    const N = 24, F = [];
    for (let i = 0; i <= N; i++) F.push(frameAt(B, r, rad, pOf((dur / 1000) * (i / N))));
    const O = F.map((f, i) => ({ transform: f.tf, offset: i / N })), I = F.map((f, i) => ({ transform: f.inner, offset: i / N }));
    const top = el.scrollTop, kids = [...el.children].map((k) => [k, k.offsetHeight > 0 ? k.offsetTop : -1]).filter((x) => x[1] >= 0); // all reads first
    kids.forEach(([k, y]) => { k.style.transformOrigin = `0px ${(top - y).toFixed(1)}px`; k.style.willChange = 'transform'; });
    const anims = [el.animate(O, { duration: dur, easing: 'linear', fill: 'both' })].concat(kids.map(([k]) => k.animate(I, { duration: dur, easing: 'linear', fill: 'both' })));
    // The rounded corners (the user: "keep the smooth edges everywhere"). The radius is the one part the graphics chip cannot move on
    // its own, so it is animated only while the window is under 90 % of the screen; above that the corners are 2-3 px and the
    // movement runs on the graphics chip alone.
    if (!window.__f20noRad) {
      const live = F.map((f, i) => [f, i]).filter(([f]) => f.p < 0.9), i0 = live.length ? live[0][1] : 0, i1 = live.length ? live[live.length - 1][1] : 0;
      if (live.length > 1) {
        const span = i1 - i0, R = F.slice(i0, i1 + 1).map((f, j) => ({ borderRadius: f.br, offset: j / span }));
        anims.push(el.animate(R, { duration: (dur * span) / N, delay: (dur * i0) / N, easing: 'linear', fill: 'both' }));
      }
    }
    return { anims, done: () => { anims.forEach((a) => { try { a.cancel(); } catch (e) { /* gone */ } }); kids.forEach(([k]) => { k.style.transformOrigin = ''; k.style.willChange = ''; }); } };
  }

  // closing: shrink back into the row if it is still on screen
  const _away = slideAway;
  slideAway = function (el) {
    let s = el._f20src; const b = el._f20b;
    if ((!s || !s.isConnected) && el._f20key) { const root = b || R.pages[T.tab], k = root && root.querySelector(el._f20key); if (k) s = k.closest('.nx-row,.nx-card,.nx-gcard,.nx-wg,.nx-hcard,.tp-wrow,.lb-row,.nx-hero') || k; }
    const zoomed = zoomOn() && el.classList.contains('f20-z');
    // you must SEE where the screen goes back to (user: "it disappears somewhere, like a wind"). A row near the bottom is behind the
    // glass tab bar (it would slide under it and vanish), and a row scrolled away is not on screen at all: in both cases the list
    // under the screen is scrolled first (hidden behind the screen) so the row sits in the clear middle, as iOS Photos does.
    let r = null;
    if (zoomed && s && s.isConnected) {
      const H = innerHeight, clear = (q) => q.width > 40 && q.height > 20 && q.top > 70 && q.bottom < H - 120;
      let q = s.getBoundingClientRect();
      if (!clear(q)) { const sc = s.closest('.tp-page,.tp-push'); if (sc) { sc.scrollTop += q.top + q.height / 2 - H * 0.42; q = s.getBoundingClientRect(); } }
      r = clear(q) || (q.width > 40 && q.bottom > 70 && q.top < H - 120) ? q : null;
    }
    const clean = () => { if (b) b.classList.remove('f20-zb'); if (!R.stack || !R.stack.some((x) => x.classList.contains('f20-z'))) R.vp.classList.remove('f20-zv'); };
    if (!zoomed) { clean(); return _away.apply(this, arguments); }
    // start from where the screen is right now (it may still be opening: p0 < 1), then stop the opening
    const p0 = el._f20m ? springAt((performance.now() - (el._f20t0 || 0)) / 1000, DUR) : 1, op0 = el._f20f && el._f20m ? Math.min(1, +getComputedStyle(el).opacity || 1) : 1;
    if (el._f20m) { el._f20m.done(); el._f20m = null; } if (el._f20f) { try { el._f20f.cancel(); } catch (e) { /* done */ } }
    el.inert = true; el.classList.remove('under'); el.classList.add('f20-out');
    const B = box();
    // back into the row on the same path as the opening; if the row is no longer on screen, into a slightly smaller screen (as iOS does)
    const tr = r || { left: B.L + B.W * 0.07, top: B.T + B.H * 0.07, width: B.W * 0.86, height: B.H * 0.86 }, rad = r ? radOf(s) : 34, dur = r ? DUR_BACK : 440;
    const m = morph(el, B, tr, rad, (t) => p0 * (1 - springAt(t, dur)), dur);
    // solid all the way until it sits ON the row (at 75% of the time the spring is 98.6% there), then it dissolves into the row
    const f = r ? el.animate([{ opacity: op0 }, { opacity: op0, offset: 0.74 }, { opacity: 0, offset: 0.96 }, { opacity: 0 }], { duration: dur, easing: 'linear', fill: 'forwards' })
      : el.animate([{ opacity: op0 }, { opacity: 0 }], { duration: 320, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'forwards' });
    const end = () => { if (el.isConnected) { m.done(); f.cancel(); el.remove(); } };
    m.anims[0].onfinish = end; setTimeout(end, dur + 400);
    clean();
  };

  /* Closing a screen used to rebuild the page underneath FIRST and only then start the closing animation (measured ~75 ms of
     script on a slow phone at the very first frame of the close). The page underneath has not changed while it was covered, so now
     the screen starts closing at once and the page is refreshed right after the animation has ended. */
  const _closeTop = closeTop;
  closeTop = function () {
    if (!T.sheet && !(typeof PV !== 'undefined' && PV.el) && T.push.length) {
      T.push.pop(); draw(true);
      clearTimeout(R.lateDraw); R.lateDraw = setTimeout(() => draw(), DUR_BACK + 120);
      return true;
    }
    return _closeTop.apply(this, arguments);
  };

  // sheets: the page (or screen) behind sinks back while a sheet is open
  const _sheet = syncSheet;
  syncSheet = function () {
    const r = _sheet.apply(this, arguments);
    const open = !!(R.sheet && !R.sheet.classList.contains('closing'));
    const back = R.screen || R.pages[T.tab];
    document.querySelectorAll('.f20-sink').forEach((x) => { if (!open || x !== back) x.classList.remove('f20-sink'); });
    if (open && back && !back.classList.contains('f20-sink')) requestAnimationFrame(() => { if (R.sheet && !R.sheet.classList.contains('closing')) back.classList.add('f20-sink'); });
    return r;
  };
  // a sheet pulled down and closed by the finger also lets the page come back
  const _close = typeof closeAnim === 'function' ? closeAnim : null;
  if (_close) closeAnim = function () { document.querySelectorAll('.f20-sink').forEach((x) => x.classList.remove('f20-sink')); return _close.apply(this, arguments); };

  // Settings > Look: the switch
  const row = () => `<button class="gb-live f20-row" data-f20zoom role="switch" aria-checked="${zoomOn()}"><span><b>Open like iPhone</b><small>Screens grow out of the row you tap and shrink back into it</small></span><i class="gb-sw${zoomOn() ? ' on' : ''}"></i></button>`;
  if (window.GlassBend && GlassBend.html) { const _h = GlassBend.html; GlassBend.html = function () { return _h.apply(this, arguments).replace(/<\/div>$/, row() + '</div>'); }; }
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-f20zoom]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    try { localStorage.setItem(KEY, zoomOn() ? '0' : '1'); } catch (x) { /* this visit only */ }
    b.setAttribute('aria-checked', zoomOn()); const i = b.querySelector('i'); if (i) i.classList.toggle('on', zoomOn()); }, true);
})();

/* 17 Nov 2026 (user): "I marked someone as paid and I cannot cancel it". After the 8-second Undo there was no way back: a paid row
   showed a plain green tick, and no page listed the payments. Now (both use the same two-tap rule as "Yes, paid"):
   - Payments: tap the green tick -> it turns red "Not paid?" -> tap again = that month's payment is removed (Undo 8 s).
   - The student's page: a "Payments" list, every payment with Remove -> "Sure?" -> removed (Undo 8 s). Budget is told (tbSend del). */
(function () {
  if (typeof delPays !== 'function' || typeof PUSH === 'undefined') return;
  const _pay = PAGES[4];
  PAGES[4] = function () {
    const h = _pay.apply(this, arguments);
    return h.replace(/data-nxpush="sprof" data-g="([^"]+)" data-sid="([^"]+)"((?:(?!nx-prow)[\s\S])*?)<span class="nx-tick done" aria-label="Paid">([\s\S]*?)<\/span>/g,
      (all, g, sid, mid, inner) => `data-nxpush="sprof" data-g="${g}" data-sid="${sid}"${mid}<button class="nx-tick done f20-un" data-f20untick="${g}|${sid}" aria-label="Paid. Tap to mark not paid">${inner}<span>Not paid?</span></button>`);
  };
  const payOf = (sids) => S.pay.pays.filter((p) => sids.includes(p.sid)).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.m || '').localeCompare(a.m || ''));
  const _sp = PUSH.sprof;
  PUSH.sprof = function (f) {
    let h = _sp.apply(this, arguments);
    try {
      const g = gById(f.g), st = g && stuOf(g, f.sid); if (!st) return h;
      const sids = classesOf(st).all.map((x) => x.st.id), list = payOf(sids); if (!list.length) return h;
      const more = !!f.f20all, show = more ? list : list.slice(0, 8);
      const rows = show.map((p) => `<div class="nx-row still f20-pay"><span class="nx-tx"><b>${p.m ? ymName(p.m) : 'Payment'}</b><small>${p.date ? dDate(p.date) : ''}${p.by ? ' · ' + (p.by === 'card' ? 'Card' : 'Cash') : ''}</small></span><em class="v pos">+${fmtSum(p.amount)}</em><button class="nx-mini red f20-rm" data-f20unpay="${p.id}" aria-label="Remove this payment">Remove</button></div>`).join('');
      const tail = list.length > 8 ? `<button class="nx-more" data-f20payall="${more ? 0 : 1}">${more ? 'Show less' : 'Show all ' + list.length}</button>` : '';
      // the page's own Payments list (at the bottom) gets a Remove on every payment: same look, same place
      h = h.replace(/<div class="nx-sec">Payments<\/div><div class="nx-list">[\s\S]*?(?=\s*<div class="nx-list"><button class="nx-row" data-(?:nxback|sheet="leave"))/, () => `<div class="nx-sec">Payments</div><div class="nx-list f20-pays">${rows}</div>${tail}`);
    } catch (e) { /* the page stays as it was */ }
    return h;
  };
  const arm = (b, txt) => { document.querySelectorAll('.f20-arm').forEach((x) => { if (x !== b) disarm(x); }); b.classList.add('f20-arm'); b._t = Date.now(); b._txt = b._txt || b.textContent; if (txt) b.textContent = txt; clearTimeout(b._u); b._u = setTimeout(() => disarm(b), 4000); };
  const disarm = (b) => { b.classList.remove('f20-arm'); if (b._txt && b.classList.contains('f20-rm')) b.textContent = b._txt; };
  const back = (gone) => () => { gone.forEach((q) => { const c = { ...q, id: uid() }; S.pay.pays.push(c); tbSend('add', c); }); };
  const _hc = home2Click;
  home2Click = function (b, d) {
    if (d.f20untick) {
      if (!b.classList.contains('f20-arm')) { arm(b); return true; }
      if (Date.now() - b._t < 350) return true; // a double tap is not a decision
      const [gid, sid] = d.f20untick.split('|'), g = gById(gid), st = g && stuOf(g, sid), m = payState().ym; if (!st) return true;
      const gone = delPays(sid, m);
      if (!gone.length) { disarm(b); toast(`${st.name}: ${MONTHS[+m.slice(5) - 1]} is paid from an earlier payment. Remove it on ${st.name}'s page.`); return true; }
      save(); draw(); payToast(`${st.name} · ${MONTHS[+m.slice(5) - 1]} · not paid`, back(gone)); return true;
    }
    if (d.f20unpay) {
      if (!b.classList.contains('f20-arm')) { arm(b, 'Sure?'); return true; }
      if (Date.now() - b._t < 350) return true;
      const p = S.pay.pays.find((x) => x.id === d.f20unpay); if (!p) return true;
      S.pay.pays = S.pay.pays.filter((x) => x !== p); tbSend('del', p); save(); draw();
      const who = (() => { for (const g of S.groups) { const s = (g.students || []).concat(g.left || []).find((x) => x.id === p.sid); if (s) return s.name; } return 'Payment'; })();
      payToast(`${who} · ${fmtSum(p.amount)} so'm for ${MONTHS[+p.m.slice(5) - 1]} removed`, back([p])); return true;
    }
    if (d.f20payall) { const top = T.push[T.push.length - 1]; if (top) { top.f20all = d.f20payall === '1'; draw(); } return true; }
    return _hc.apply(this, arguments);
  };
  // a tap anywhere else puts an armed button back
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest || e.target.closest('.f20-arm')) return; document.querySelectorAll('.f20-arm').forEach(disarm); }, true);
})();

/* 17 Nov 2026 (found in the audit, live too): the small glass title bar ("Home") stayed on after changing tab from a scrolled page,
   because ffhome.js hid it only on a CLICK on the tab bar, and the tab bar also switches by press-and-slide (no click). Now every tab
   change sets the bar from the page you land on: its title, shown only if that page is scrolled down. */
(function () {
  if (typeof goTab !== 'function') return;
  const _go = goTab;
  goTab = function () {
    const r = _go.apply(this, arguments);
    try {
      const bar = document.querySelector('.ffnav'), pg = R.pages[T.tab]; if (!bar || !pg) return r;
      const t = pg.querySelector('.tp-lt'), want = !!t && pg.scrollTop > 52 && !T.sheet && !T.push.length;
      if (t && bar.firstChild && bar.firstChild.textContent !== t.textContent) bar.firstChild.textContent = t.textContent;
      bar.classList.toggle('on', want);
      pg.dispatchEvent(new Event('scroll')); // ffhome.js re-reads the new page too, so its own "is it on" note stays right
    } catch (e) { /* the bar stays as it was */ }
    return r;
  };
})();

/* 17 Nov 2026: the very first screen opened after the app starts was the slowest (its code had never run). 3 s after the start, when
   the phone is idle, the student and group pages are built once in memory (not shown), so the first real tap is as quick as the rest. */
setTimeout(() => {
  const run = () => { try { const g = S.groups.find((x) => x.students && x.students.length); if (!g) return; const st = g.students[0];
    if (PUSH.sprof) PUSH.sprof({ s: 'sprof', g: g.id, sid: st.id }); if (PUSH.sgrp) PUSH.sgrp({ s: 'sgrp', g: g.id }); } catch (e) { /* only a warm-up */ } };
  if (typeof requestIdleCallback === 'function') requestIdleCallback(run, { timeout: 2000 }); else run();
}, 3000);
