'use strict';
/* 9 Nov (Teacher 7.2 / 7.3): Home. Loaded last.
   1) The Paid widget draws Apple-Watch-style activity rings: one thin ring for each group.
   2) Four widgets, each with a clear job (see ffMini).
   3) The month is ONE small button; tap it for the other months.
   4) The Attendance | Paid | Course switch: tap, hold and slide, or swipe the card. */

/* ---------- small activity rings for the Paid widget ---------- */
function ffMiniRings(sc) {
  const gs = feeGroups().filter((g) => sc.per[g.id] && sc.per[g.id].n); if (!gs.length) return '';
  const N = gs.length, R0 = 23, t = Math.max(2, Math.min(5, (R0 - 5) / N - 0.9)), gap = 0.9; let s = '';
  gs.forEach((g, i) => {
    const c = sc.per[g.id], p = c.n ? (c.paid + c.credit) / c.n : 0, r = R0 - t / 2 - i * (t + gap), C = 2 * Math.PI * r, col = hc(g);
    s += `<circle cx="25" cy="25" r="${r.toFixed(2)}" fill="none" stroke="${col}" stroke-opacity=".28" stroke-width="${t}"/>`
      + `<circle class="ffr-p" cx="25" cy="25" r="${r.toFixed(2)}" fill="none" stroke="${col}" stroke-width="${t}" stroke-linecap="round" transform="rotate(-90 25 25)" style="--C:${C.toFixed(1)};--d:${i * 90}ms;stroke-dasharray:${Math.max(0.01, C * p).toFixed(1)} ${C.toFixed(1)}"/>`;
  });
  return `<span class="ffrg" aria-hidden="true"><svg viewBox="0 0 50 50">${s}</svg></span>`;
}

/* ---------- the four widgets ---------- */
function ffNextLessonGroup() { // the group whose next lesson comes first (when nothing is left today)
  let best = null, when = null;
  S.groups.forEach((g) => { if (!g.students.length) return; const d = lessonDay(g, TODAY, 1); if (d && (!when || d < when)) { best = g; when = d; } });
  return best;
}
const ffFileCount = (g) => { const cl = curLes(g), P = PACKS[`${String(g.lvl).toLowerCase()}-w${cl.w}-l${cl.l}`]; return P ? PK_KINDS.filter(([k]) => P[k]).length : 0; };
/* Four glanceable widgets, like the iPhone's: each shows ONE number about a different part of your work, and none repeats a button
   that is already on the screen (user, 9 Nov).
   PAID = this month, rings (one per group)    OWE 2+ = students who owe for two months or more
   CAME = this month's attendance %             WEEK = lessons taught this week out of all planned this week */
function ffOverdue() { // students who owe for 2 months or more (up to this month)
  const cur = ymOf(TODAY); let n = 0, all = 0;
  feeGroups().forEach((g) => feeStu(g, cur, true).forEach((st) => { all++; if (ledger(g, st, cur).rows.filter((r) => r.charge - r.covered > 0).length >= 2) n++; }));
  return { n, all };
}
function ffMonthCame() {
  const ym = iso(TODAY).slice(0, 7); let here = 0, total = 0;
  S.groups.forEach((g) => savedDates(g).filter((x) => x.startsWith(ym)).forEach((x) => { const r = rec(g, fromIso(x)); g.students.forEach((s) => { total++; if (r.get(s.id) !== 'absent') here++; }); }));
  return total ? Math.round((here / total) * 100) : null;
}
function ffWeekLessons() {
  const mon = addDays(TODAY, -wd(TODAY)); let tot = 0, done = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(mon, i); S.groups.forEach((g) => { if (!g.students.length) return; if (hasLesson(g, d) || kept(g, d)) { tot++; if (doneOn(g, d)) done++; } }); }
  return { tot, done };
}
ffMini = function () {
  const ym = payState().ym, sc = statusCounts(ym);
  let w1 = ffMiniW('wo', sc.n ? (sc.ok / sc.n) * 100 : 0, '', 'Wallet', sc.n ? sc.ok + '/' + sc.n : '–', 'Paid · ' + MONTHS[+ym.slice(5) - 1].slice(0, 3), 'data-sheet="paypick"');
  const rg = sc.n ? ffMiniRings(sc) : ''; if (rg) w1 = w1.replace(/<span class="ffring"[^>]*><i>.*?<\/i><\/span>/, rg);
  const od = ffOverdue(), w2 = ffMiniW('od', od.all ? (od.n / od.all) * 100 : 0, '', 'CalendarX2', String(od.n), 'Owe 2+ mo', 'data-sheet="paypick"');
  const mc = ffMonthCame(), w3 = ffMiniW('wg', mc || 0, '', 'ClipboardCheck', mc === null ? '–' : mc + '%', 'Came · ' + MONTHS[TODAY.getMonth()].slice(0, 3), 'data-tab="2"');
  const wl = ffWeekLessons(), w4 = ffMiniW('wp', wl.tot ? (wl.done / wl.tot) * 100 : 0, '', 'CalendarDays', wl.tot ? wl.done + '/' + wl.tot : '–', 'This week', 'data-tab="2"');
  return '<div class="ffm-row">' + w1 + w2 + w3 + w4 + '</div>';
};

/* ---------- the month: ONE small button, tap = the other months ---------- */
ffMonthStrip = function () {
  if (!S.pay || !feeGroups().length) return '';
  const cur = ymOf(TODAY), sel = payState().ym, from = S.pay.start && S.pay.start <= cur ? S.pay.start : cur, list = [];
  for (let m = cur, i = 0; m >= from && i < 18; m = ymAdd(m, -1), i++) list.push(m);
  const sc = statusCounts(sel);
  return `<div class="ffmp h-in" data-noswipe><div class="ffmp-bar"><button class="ffmp-btn" data-ffmonopen aria-haspopup="true">${ic('CalendarDays')}<b>${esc(ymName(sel))}</b>${ic('ChevronDown')}</button>
    <span class="ffmp-sum">${sc.n ? `<i class="ok"></i>${sc.ok} paid<i class="no"></i>${sc.n - sc.ok} not paid` : 'no fees yet'}</span></div>
    <div class="ffmp-menu" role="menu"><div>${list.map((m) => `<button class="${m === sel ? 'on' : ''}" data-ffmon="${m}"><span>${esc(ymName(m))}</span>${m === sel ? ic('Check') : ''}</button>`).join('')}</div></div></div>`;
};
{
  const _c = home2Click;
  home2Click = function (b, d) {
    if (d.ffmonopen !== undefined) { const m = b.closest('.ffmp'); if (m) m.classList.toggle('open'); return true; }
    return _c(b, d);
  };
  document.addEventListener('click', (e) => { document.querySelectorAll('.ffmp.open').forEach((m) => { if (!m.contains(e.target)) m.classList.remove('open'); }); }, true);
}

/* ---------- the Attendance | Paid | Course switch: tap, or hold and slide, or swipe the card ---------- */
{
  const _i = ffInsights2;
  ffInsights2 = function () { return _i.apply(this, arguments).replace('class="ffc ffc2 h-in"', 'class="ffc ffc2 h-in" data-noswipe'); };
  const ORDER = ['att', 'pay', 'crs'];
  let st = null, sup = 0;
  const goTo = (k) => { const b = document.querySelector(`.ffsw [data-ffins="${k}"]`); if (b) b.click(); };
  document.addEventListener('pointerdown', (e) => {
    const card = e.target.closest && e.target.closest('.ffc2'); if (!card || e.target.closest('.ffc-chips,.ffr-leg')) return;
    st = { x0: e.clientX, y0: e.clientY, id: e.pointerId, sw: e.target.closest('.ffsw'), i0: Math.max(0, ORDER.indexOf(T.ffi)), on: false, f: 0 };
  }, true);
  document.addEventListener('pointermove', (e) => {
    if (!st || e.pointerId !== st.id) return; const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
    if (!st.on) {
      if (Math.abs(dx) < 8) return; if (Math.abs(dx) < Math.abs(dy) * 1.2) { st = null; return; }
      st.on = true; if (st.sw) { st.sw.classList.add('drag'); try { st.sw.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } }
    }
    if (st.sw) { st.f = Math.max(0, Math.min(2, st.i0 + dx / (st.sw.clientWidth / 3))); st.sw.style.setProperty('--i', st.f); }
  }, true);
  const end = (e) => {
    if (!st || e.pointerId !== st.id) return; const s0 = st; st = null; if (!s0.on) return;
    const dx = e.clientX - s0.x0; let to = s0.i0;
    if (s0.sw) { s0.sw.classList.remove('drag'); to = Math.round(s0.f); } else if (Math.abs(dx) > 44) to = Math.max(0, Math.min(2, s0.i0 + (dx < 0 ? 1 : -1)));
    if (s0.sw) s0.sw.style.setProperty('--i', to);
    if (to !== s0.i0) goTo(ORDER[to]);
    sup = Date.now();
  };
  document.addEventListener('pointerup', end, true); document.addEventListener('pointercancel', end, true);
  document.addEventListener('click', (e) => { if (Date.now() - sup < 350 && e.target.closest && e.target.closest('.ffc2')) { e.stopPropagation(); e.preventDefault(); } }, true);
}

/* ---------- the first Register screen drawn ahead of time, out of sight (its first draw was the slowest tap) ---------- */
setTimeout(() => {
  const run = () => {
    if (T.sheet || T.push.length || !S.groups.length || !PUSH.register) return;
    const el = document.createElement('div'); el.className = 'tp-push still'; el.style.visibility = 'hidden'; el.setAttribute('aria-hidden', 'true');
    try { el.innerHTML = PUSH.register({ g: S.groups[0].id }); } catch (e) { return; }
    R.screens.appendChild(el); void el.offsetHeight; requestAnimationFrame(() => requestAnimationFrame(() => el.remove()));
  };
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 3000 }); else run();
}, 2200);

/* ---------- 7.9: level switch on Units / Books - the card above the weeks changes AT ONCE with the chips ----------
   (it sat outside the sliding part, so it kept the old level's color and name until the page was redrawn ~1 s later) */
{
  const _g = lvGo;
  lvGo = function (tab) {
    const r = _g.apply(this, arguments);
    try {
      const page = R.pages[tab], t = document.createElement('template'); t.innerHTML = safe(PAGES[tab]);
      const fresh = [...t.content.querySelectorAll('.hn-next, .tp-hdr')].filter((x) => !x.closest('[data-lvpane]'));
      const old = [...page.querySelectorAll('.hn-next, .tp-hdr')].filter((x) => !x.closest('[data-lvpane]') && !x.closest('.lv-float'));
      fresh.forEach((n, k) => { const o = old[k]; if (o && o.outerHTML !== n.outerHTML) { n.classList.add('nin'); o.replaceWith(n); } });
    } catch (e) { /* the redraw after the slide still fixes it */ }
    return r;
  };
}

/* ---------- 7.9: the Attendance | Paid | Course card keeps ONE size (the tallest of the three), like an iPhone widget ---------- */
function ffEqualizeIns() {
  const card = document.querySelector('.ffc2'), body = card && card.querySelector('.ffc-body'); if (!body || !card.offsetWidth) return;
  const key = card.offsetWidth + '|' + S.rev + '|' + (T.ffg || '') + '|' + payState().ym; if (card._eqk === key) return; card._eqk = key;
  const probe = document.createElement('div'); probe.style.cssText = `position:absolute;visibility:hidden;pointer-events:none;left:-9999px;top:0;width:${card.offsetWidth}px`;
  card.parentNode.appendChild(probe);
  const keep = T.ffi; let mx = 0;
  try { for (const k of ['att', 'pay', 'crs']) { T.ffi = k; probe.innerHTML = ffInsights2(); const b = probe.querySelector('.ffc-body'); if (b) mx = Math.max(mx, b.offsetHeight); } } finally { T.ffi = keep; probe.remove(); }
  if (mx) body.style.minHeight = mx + 'px';
}
{
  const _d = draw;
  draw = function () { const r = _d.apply(this, arguments); try { ffEqualizeIns(); } catch (e) { /* none */ } return r; };
  const _c = home2Click;
  home2Click = function (b, d) { const r = _c(b, d); if (d.ffgrp) setTimeout(() => { const c = document.querySelector('.ffc2'); if (c) c._eqk = ''; ffEqualizeIns(); }, 260); return r; };
}
