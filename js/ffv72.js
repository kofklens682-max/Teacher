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
/* Four widgets, each with a real job and a tap that opens something (user, 9 Nov):
   PAID = rings, one per group; tap = Mark who paid.   FILES = the files of the lesson now / the next lesson; tap = open it.
   MISSED = students who missed their last 2 lessons in a row (to call); tap = the list.   HOMEWORK = students marked "no homework" at their group's last lesson; tap = the list. */
function ffMissed() {
  const out = [];
  S.groups.forEach((g) => { const ds = savedDates(g); if (ds.length < 2) return;
    g.students.forEach((s) => { let n = 0; for (let i = ds.length - 1; i >= 0 && rec(g, fromIso(ds[i])).get(s.id) === 'absent'; i--) n++; if (n >= 2) out.push({ g, s, n }); }); });
  return out;
}
function ffNoHw() {
  const out = [];
  S.groups.forEach((g) => { const ds = savedDates(g); if (!ds.length) return; const k = ds[ds.length - 1], r = rec(g, fromIso(k));
    g.students.forEach((s) => { if (r.get(s.id) !== 'absent' && !r.hwOf(s.id)) out.push({ g, s, k }); }); });
  return out;
}
function ffListSheet(title, list, sub, none) {
  const by = []; list.forEach((x) => { let b = by.find((y) => y.g === x.g); if (!b) by.push(b = { g: x.g, rows: [] }); b.rows.push(x); });
  const body = by.length ? by.map(({ g, rows }) => `<div class="pl-h"><span class="d" style="background:${hc(g)}"></span>${esc(g.name)}<em>${rows.length}</em></div><div class="pl-list">${rows.map((x, i) => `<div class="pl-row ok"><span class="pl-n">${i + 1}</span><button class="pl-main" data-sheet="stu" data-g="${g.id}" data-sid="${x.s.id}"><b>${esc(x.s.name)}</b><span>${sub(x)}</span></button></div>`).join('')}</div>`).join('')
    : `<p class="tp-small" style="text-align:left;margin-top:14px">${none}</p>`;
  return `<div class="tp-sh-h"><span></span><b>${title}</b><button class="tp-back strong" data-closesheet>Done</button></div>${body}`;
}
SHEETS.ffabs = () => ffListSheet('Missed 2 lessons in a row', ffMissed(), (x) => `missed the last ${x.n} lessons`, 'Nobody has missed two lessons in a row. 👍');
SHEETS.ffhw = () => ffListSheet('No homework last lesson', ffNoHw(), (x) => `last lesson · ${dDate(x.k)}`, 'Everybody did the homework at the last lesson. 👍');
ffMini = function (g) {
  const ym = payState().ym, sc = statusCounts(ym), total = S.groups.reduce((a, x) => a + x.students.length, 0) || 1;
  let w1 = ffMiniW('wo', sc.n ? (sc.ok / sc.n) * 100 : 0, '#fff', 'Wallet', sc.n ? sc.ok + '/' + sc.n : '–', 'Paid', 'data-sheet="paypick"');
  const rg = sc.n ? ffMiniRings(sc) : ''; if (rg) w1 = w1.replace(/<span class="ffring"[^>]*><i>.*?<\/i><\/span>/, rg);
  const ng = g || ffNextLessonGroup(), nf = ng ? ffFileCount(ng) : 0;
  const w2 = ng ? ffMiniW('wb', nf ? 100 : 0, '#fff', 'FileText', nf ? String(nf) : '–', g ? 'Files' : 'Next files', homeOpen(ng)) : ffMiniW('wb', 0, '#fff', 'FileText', '–', 'Files', 'data-tab="1"');
  const ms = ffMissed(), w3 = ffMiniW('wg', (ms.length / total) * 100, '#fff', 'UserRound', String(ms.length), 'Missed 2+', 'data-sheet="ffabs"');
  const hw = ffNoHw(), w4 = ffMiniW('wp', (hw.length / total) * 100, '#fff', 'Pencil', String(hw.length), 'No homework', 'data-sheet="ffhw"');
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
