'use strict';
/* 18 Nov 2026 (user): "press and hold a student for a quick menu: Pay, Edit, Call".
   Like the iPhone's context menu: hold a student row for half a second -> a short buzz, the row lifts above a dimmed screen and a menu
   opens next to it: Pay (the Payment pop-up), Edit (the student's Edit), Call (the phone number; "Add a phone number" opens Edit when
   there is none). A tap outside or the phone's Back closes it. A normal tap still opens the student as before.
   Works on every student row of the app (Payments, Owe 2+, a group's list, Students, Birthdays): any row that names a student. */
(function () {
  if (typeof openSheet !== 'function' || typeof closeTop !== 'function') return;
  const SEL = '[data-sid][data-g],[data-nxpay]';
  const HOLD = 480;
  let st = null, menu = null, fired = 0; // fired = when the holding finger lifted (ms)

  const who = (el) => { const [g, sid] = el.dataset.nxpay ? el.dataset.nxpay.split('|') : [el.dataset.g, el.dataset.sid]; const G = gById(g), s = G && stuOf(G, sid); return s ? { g, sid, st: s } : null; };
  const phoneOf = (sid) => { try { const P = typeof prof === 'function' ? prof(sid) : null; return P && P.phone ? String(P.phone) : ''; } catch (e) { return ''; } };
  const icon = (...n) => { for (const x of n) { const s = typeof ic === 'function' ? ic(x) : ''; if (s) return s; } return ''; };

  document.addEventListener('pointerdown', (e) => {
    if (e.button || menu) return;
    const el = e.target.closest && e.target.closest(SEL); if (!el) return;
    if (el.closest('.tp-sheet,.f22-hold,.tp-tabs,.tp-pushbar') || e.target.closest('[data-nxtick],[data-f20untick],.nx-tick,input,textarea,select,a')) return;
    const w = who(el); if (!w) return;
    const row = el.closest('.nx-row,.nx-prow,.tp-lrow') || el;
    st = { row, w, x: e.clientX, y: e.clientY, t: setTimeout(() => { if (st) open(st); }, HOLD) };
  }, true);
  const cancel = () => { if (st) { clearTimeout(st.t); st = null; } };
  document.addEventListener('pointermove', (e) => { if (st && Math.hypot(e.clientX - st.x, e.clientY - st.y) > 8) cancel(); }, true);
  /* 18 Nov, his phone: "it takes me 2 times to press Pay, 2 times to close it". The finger that held the row lifts WITHOUT a click on
     Android (a long press gives no click), and the old code waited for "the click that ends the hold" to throw it away: it threw away
     his next real tap instead. Now only a click within 0.7 s of that lift is thrown away, and never a tap on the menu itself.
     Like the iPhone, you can also slide the holding finger onto Pay / Edit / Call and lift it there to choose. */
  const itemAt = (x, y) => { const t = document.elementFromPoint(x, y); return t && t.closest ? t.closest('.f22-menu [data-f22]') : null; };
  document.addEventListener('pointermove', (e) => { if (!menu || !menu.down) return; const b = itemAt(e.clientX, e.clientY); menu.wrap.querySelectorAll('.hov').forEach((x) => { if (x !== b) x.classList.remove('hov'); }); if (b) b.classList.add('hov'); }, true);
  document.addEventListener('pointerup', (e) => {
    cancel();
    if (menu && menu.down) { menu.down = false; fired = performance.now(); const b = itemAt(e.clientX, e.clientY); if (b) close(true, b.dataset.f22); }
  }, true);
  document.addEventListener('pointercancel', (e) => { cancel(); if (menu && menu.down) { menu.down = false; fired = performance.now(); } }, true);
  document.addEventListener('scroll', cancel, true);
  // while the held finger slides over the menu the page under it must not scroll (else the phone takes the finger away)
  document.addEventListener('touchmove', (e) => { if (menu && menu.down) { if (e.cancelable) e.preventDefault(); const t = e.touches[0]; if (t) { const b = itemAt(t.clientX, t.clientY); menu.wrap.querySelectorAll('.hov').forEach((x) => { if (x !== b) x.classList.remove('hov'); }); if (b) b.classList.add('hov'); } } }, { capture: true, passive: false });
  document.addEventListener('touchend', (e) => { if (!menu || !menu.down) return; menu.down = false; fired = performance.now(); const t = e.changedTouches[0], b = t && itemAt(t.clientX, t.clientY); if (b) close(true, b.dataset.f22); }, true);
  // only the click that belongs to the holding finger (if the phone sends one at all) is thrown away
  document.addEventListener('click', (e) => {
    if (fired && performance.now() - fired < 700 && !(menu && e.target.closest && e.target.closest('.f22-menu [data-f22]'))) { fired = 0; e.preventDefault(); e.stopPropagation(); return; }
    fired = 0; cancel(); // a finished tap also ends a hold that has not opened yet
  }, true);
  document.addEventListener('contextmenu', (e) => { if (menu || (e.target.closest && e.target.closest(SEL) && !e.target.closest('.tp-sheet'))) e.preventDefault(); }, true);

  function open(s) {
    st = null; fired = 0;
    try { navigator.vibrate && navigator.vibrate(12); } catch (x) { /* no buzz */ }
    const r = s.row.getBoundingClientRect(), H = innerHeight, W = innerWidth, ph = phoneOf(s.w.sid);
    const wrap = document.createElement('div'); wrap.className = 'f22-hold';
    const lift = s.row.cloneNode(true); lift.className += ' f22-lift'; lift.removeAttribute('data-nxpush'); lift.removeAttribute('data-nxpay');
    lift.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    const items = [
      ['pay', 'Pay', icon('Wallet', 'CreditCard'), ''],
      ['edit', 'Edit', icon('Pencil', 'PenLine'), ''],
      ph ? ['call', 'Call', icon('Phone', 'Smartphone'), esc(ph)] : ['addph', 'Add a phone number', icon('Phone', 'Smartphone'), ''],
    ];
    const m = document.createElement('div'); m.className = 'f22-menu'; m.setAttribute('role', 'menu');
    m.innerHTML = `<div class="f22-name">${esc(s.w.st.name)}</div>` + items.map(([k, label, svg, sub]) => `<button role="menuitem" data-f22="${k}"><span><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</span>${svg}</button>`).join('');
    wrap.appendChild(lift); wrap.appendChild(m); document.body.appendChild(wrap);
    // the menu goes under the row, or above it when there is no room below
    const mh = m.offsetHeight, below = r.bottom + 10 + mh < H - 20, top = below ? r.bottom + 10 : Math.max(20, r.top - 10 - mh);
    const left = Math.min(Math.max(12, r.left + 8), W - m.offsetWidth - 12);
    m.style.top = top + 'px'; m.style.left = left + 'px'; m.style.transformOrigin = `${Math.round(r.left + 40 - left)}px ${below ? 0 : mh}px`;
    s.row.classList.add('f22-src');
    menu = { wrap, row: s.row, w: s.w, ph, down: true }; // down: the finger that held is still on the screen
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.add('on')));
    stepIn(); // the phone's Back closes the menu
    wrap.addEventListener('click', (e) => {
      e.stopPropagation(); const b = e.target.closest('[data-f22]');
      const act = b ? b.dataset.f22 : null;
      close(true, act);
    });
  }
  // close the menu; then do what was chosen once the history has stepped back
  function close(viaTap, act) {
    if (!menu) return; const m = menu; menu = null;
    m.wrap.classList.remove('on'); m.wrap.classList.add('off');
    setTimeout(() => { m.wrap.remove(); m.row.classList.remove('f22-src'); }, 260);
    const run = () => {
      if (!act) return; const { g, sid } = m.w;
      if (act === 'pay') openSheet({ s: 'nxpay', g, sid, by: 'card' });
      else if (act === 'edit' || act === 'addph') openSheet({ s: 'nxedit', g, sid });
      else if (act === 'call') location.href = 'tel:' + m.ph.replace(/[^\d+]/g, '');
    };
    if (viaTap && history.state && history.state.tp) {
      R.skipPop = (R.skipPop || 0) + 1;
      let done = false; const go = () => { if (done) return; done = true; window.removeEventListener('popstate', go); setTimeout(run, 0); };
      window.addEventListener('popstate', go); history.back(); setTimeout(go, 450);
    } else run();
  }
  // the phone's Back while the menu is open: close the menu only
  const _ct = closeTop;
  closeTop = function () { if (menu) { close(false, null); return true; } return _ct.apply(this, arguments); };
})();
