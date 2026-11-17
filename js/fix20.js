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
  const EASE = 'cubic-bezier(.32,.72,0,1)', DUR = 470;

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
    src = t.closest('.nx-row,.nx-card,.nx-gcard,.nx-wg,.nx-hcard,.tp-wrow,.lb-row,.nx-hero') || t; srcT = performance.now();
  }, true);
  const takeSrc = () => { const s = src; src = null; if (!s || performance.now() - srcT > 900 || !s.isConnected) return null; const r = s.getBoundingClientRect(); return r.width > 40 && r.height > 20 ? s : null; };
  const onScreen = (el) => { if (!el || !el.isConnected) return null; const r = el.getBoundingClientRect(), H = innerHeight; return r.width > 40 && r.height > 20 && r.bottom > 40 && r.top < H - 40 ? r : null; };
  const startOf = (r) => { const W = innerWidth, s = r.width / W; return `translate3d(${r.left.toFixed(1)}px,${r.top.toFixed(1)}px,0) scale(${s.toFixed(4)})`; };

  // what lies under the top screen: the screen below it, or the page of the current tab
  const below = () => (R.stack && R.stack.length > 1 ? R.stack[R.stack.length - 2] : R.pages[T.tab]);


  const _sync = syncScreen;
  syncScreen = function () {
    const before = R.stack ? R.stack.slice() : [];
    const r = _sync.apply(this, arguments);
    const stack = R.stack || [], top = stack[stack.length - 1];
    // the current tab page carries the iPhone "parallax" instead of the whole viewport
    R.pages.forEach((p, i) => { const want = i === T.tab; if (p.classList.contains('f20-cur') !== want) p.classList.toggle('f20-cur', want); });
    // a new screen opened from a tapped row: grow out of it
    if (top && !before.includes(top) && top.classList.contains('prep') && zoomOn()) { const s0 = takeSrc(); if (s0) zoomIn(top, s0); }
    // the darkening sits right under the top screen
    const sh = getShade();
    if (top) { if (sh.nextSibling !== top || sh.parentNode !== R.screens) R.screens.insertBefore(sh, top); requestAnimationFrame(() => sh.classList.add('on')); }
    else sh.classList.remove('on');
    if (!stack.some((x) => x.classList.contains('f20-z'))) { R.vp.classList.remove('f20-zv'); document.querySelectorAll('.f20-zb').forEach((x) => { if (!stack.includes(x) || x === top) x.classList.remove('f20-zb'); }); }
    return r;
  };

  function zoomIn(el, s) {
    const r = s.getBoundingClientRect();
    el._f20src = s; el.classList.add('f20-z', 'f20-zin');
    // a key to find the same row again if the page underneath is redrawn while this screen is open
    const k = s.closest('[data-nxpush],[data-push]') || s.querySelector('[data-nxpush],[data-push]');
    el._f20key = k ? ['nxpush', 'push', 'g', 'sid'].filter((a) => k.dataset[a] !== undefined).map((a) => `[data-${a}="${CSS.escape(k.dataset[a])}"]`).join('') : '';
    const b = below(); if (b) b.classList.add('f20-zb'); el._f20b = b;
    if (R.vp.classList.contains('under') || b === R.pages[T.tab]) R.vp.classList.add('f20-zv');
    s.classList.add('f20-hide');
    const a = el.animate([
      { transform: startOf(r), opacity: 0 },
      { opacity: 1, offset: 0.28 },
      { transform: 'translate3d(0,0,0) scale(1)', opacity: 1 },
    ], { duration: DUR, easing: EASE, fill: 'both' });
    const done = () => { el.classList.remove('prep'); el.classList.remove('f20-zin'); a.cancel(); s.classList.remove('f20-hide'); };
    a.onfinish = done; a.oncancel = () => s.classList.remove('f20-hide');
    el._f20a = a;
  }

  // closing: shrink back into the row if it is still on screen
  const _away = slideAway;
  slideAway = function (el) {
    let s = el._f20src; const b = el._f20b;
    if ((!s || !s.isConnected) && el._f20key) { const root = b || R.pages[T.tab], k = root && root.querySelector(el._f20key); if (k) s = k.closest('.nx-row,.nx-card,.nx-gcard,.nx-wg,.nx-hcard,.tp-wrow,.lb-row,.nx-hero') || k; }
    const r = zoomOn() && el.classList.contains('f20-z') ? onScreen(s) : null;
    const clean = () => { if (b) b.classList.remove('f20-zb'); if (!R.stack || !R.stack.some((x) => x.classList.contains('f20-z'))) R.vp.classList.remove('f20-zv'); };
    if (!r) { clean(); return _away.apply(this, arguments); }
    if (el._f20a) { try { el._f20a.cancel(); } catch (e) { /* done */ } }
    el.inert = true; el.classList.remove('under'); el.classList.add('f20-out');
    s.classList.add('f20-hide');
    const a = el.animate([
      { transform: getComputedStyle(el).transform === 'none' ? 'translate3d(0,0,0) scale(1)' : getComputedStyle(el).transform, opacity: 1 },
      { opacity: 1, offset: 0.62 },
      { transform: startOf(r), opacity: 0 },
    ], { duration: 420, easing: EASE, fill: 'forwards' });
    const end = () => { s.classList.remove('f20-hide'); el.remove(); };
    a.onfinish = end; setTimeout(() => { if (el.isConnected) end(); }, 700);
    clean();
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
