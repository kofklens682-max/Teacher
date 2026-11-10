'use strict';
/* 8 Nov (PREVIEW): calmer Home. Hero, four mini widgets in one row, ONE compact Insights card with a switch, Tomorrow.
   Plus the iPhone title bar: the big title shrinks into a small glass bar when you scroll. Loaded last. */
T.ffi = T.ffi || 'att';
const ffMiniW = (cls, p, c, icon, big, label, attrs) => `<button class="ffm ${cls} h-in" ${attrs}><span class="ffring" style="--p:${Math.round(p)};--c:${c}"><i>${ic(icon)}</i></span><b>${big}</b><span>${label}</span></button>`;
function ffMini(g) {
  const D = TODAY, ym = payState().ym, sc = statusCounts(ym), r = g ? rec(g, D) : null, all = g ? g.students.length : 0, saved = !!(g && r && r.saved);
  const here = saved ? g.students.filter((s) => r.get(s.id) !== 'absent').length : 0, cl = g ? curLes(g) : null, wks = g ? lv(g.lvl).units.length : 0;
  const key = g ? `${String(g.lvl).toLowerCase()}-w${cl.w}-l${cl.l}` : '', P = g && PACKS[key] ? PACKS[key] : null, nf = P ? ['ffl', 'ffs', 'ffh', 'ffst'].filter((k) => P[k]).length : 0;
  return `<div class="ffm-row">
    ${g ? ffMiniW('wg', all ? (here / all) * 100 : 0, '#fff', 'ClipboardCheck', saved ? `${here}/${all}` : `${all}`, saved ? 'came' : 'Attendance', `data-push="register" data-g="${g.id}"`) : ''}
    ${sc.n ? ffMiniW('wo', (sc.ok / sc.n) * 100, '#fff', 'Wallet', `${sc.ok}/${sc.n}`, 'Paid', 'data-sheet="paypick"') : ''}
    ${g ? ffMiniW('wp', wks ? (cl.w / wks) * 100 : 0, '#fff', 'Target', `${cl.w}/${wks}`, 'Week', 'data-tab="1"') : ''}
    ${g && nf ? ffMiniW('wb', 100, '#fff', 'FileText', `${nf}`, 'Files', homeOpen(g)) : ''}
  </div>`;
}
function ffInsights2() {
  const gs = S.groups.filter((g) => g.students.length); if (!gs.length) return '';
  const g = gById(T.ffg) || ffNextGroup() || gs[0], tab = T.ffi, TABS = [['att', 'Attendance'], ['pay', 'Paid'], ['crs', 'Course']];
  const seg = `<div class="ffsw" style="--i:${TABS.findIndex((x) => x[0] === tab)}"><span class="th"></span>${TABS.map(([k, t]) => `<button class="${k === tab ? 'on' : ''}" data-ffins="${k}">${t}</button>`).join('')}</div>`;
  const chips = gs.length > 1 && tab !== 'pay' ? `<div class="ffc-chips s">${gs.map((x) => `<button class="${x === g ? 'on' : ''}" data-ffgrp="${x.id}"><i style="background:${hc(x)}"></i>${esc(x.name)}</button>`).join('')}</div>` : '';
  let head = '', body = '', foot = '';
  if (tab === 'att') {
    const pts = savedDates(g).slice(-8).map((k) => { const r = rec(g, fromIso(k)), n = g.students.length, here = g.students.filter((s) => r.get(s.id) !== 'absent').length, p = n ? Math.round((here / n) * 100) : 0; return { p, top: String(here), label: ffShort(k), col: ffCol(p) }; });
    const avg = pts.length ? Math.round(pts.reduce((a, b) => a + b.p, 0) / pts.length) : null;
    head = `<div><b>${esc(g.name)} · last ${pts.length || 0} lessons</b><span>students who came</span></div>${avg !== null ? `<div class="ffc-big" style="color:${ffCol(avg)}">${avg}<em>%</em></div>` : ''}`;
    body = pts.length ? ffBars(pts, { color: '#34C759', aria: 'Attendance of the last lessons', h: 112 }) : '<p class="ffc-empty">The chart appears after your first saved register.</p>';
  } else if (tab === 'pay') {
    const ym0 = ymOf(TODAY), cs = [-5, -4, -3, -2, -1, 0].map((k) => ymAdd(ym0, k)).map((ym) => ({ ym, c: statusCounts(ym) })), now = cs[cs.length - 1].c;
    const pp = cs.map(({ ym, c }) => { const on = c.n > 0 && ym >= S.pay.start; return { p: on ? Math.round((c.ok / c.n) * 100) : 0, top: on ? c.ok + '/' + c.n : '', label: SHORT(ym), col: ym === ym0 ? '#F0A92E' : '#FFCF66', cur: ym === ym0 }; });
    head = `<div><b>Who paid · all groups</b><span>students, not money</span></div><div class="ffc-big" style="color:#F0A92E">${now.ok}<em>/${now.n}</em></div>`;
    body = ffBars(pp, { color: '#F0A92E', aria: 'Students who paid, by month', h: 112 });
  } else {
    const L = lv(g.lvl), wks = L.units.length, cl = curLes(g), total = L.units.reduce((a, u) => a + u.lessons.length, 0), done = L.units.slice(0, cl.w - 1).reduce((a, u) => a + u.lessons.length, 0) + cl.l - 1;
    head = `<div><b>${esc(g.name)} · ${esc(LVNAME(g.lvl))}</b><span>${done} of ${total} lessons · ${wks - cl.w} weeks left</span></div><div class="ffc-big" style="color:#3B5BDB">${Math.round((done / total) * 100)}<em>%</em></div>`;
    body = `<div class="ffseg" style="--n:${wks}">${L.units.map((u, i) => `<i class="${i + 1 < cl.w ? 'd' : i + 1 === cl.w ? 'n' : ''}"><b>${i + 1}</b></i>`).join('')}</div>`;
  }
  return `<div class="ffc ffc2 h-in">${seg}<div class="ffc-body">${chips}<div class="ffc-h">${head}</div>${body}${foot}</div></div>`;
}
pgHomeNew = function () {
  if (!S.groups.length) return pgHome();
  const day = `${DAYS_LONG[wd(TODAY)]} ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]}`, g = ffNextGroup();
  const head = `<div class="tp-hdr"><div><div class="tp-eyebrow">${day}</div><div class="tp-lt">Home</div></div>
    <div class="hdr-btns"><button class="tp-avatar" data-sheet="settings" aria-label="Profile and settings">${initials(profileGet().name) || ic('UserRound')}</button>${lightsHtml('home')}</div></div>`;
  const now = iso(TODAY), cur = S.pauses.filter((p) => p.from <= now && p.to >= now);
  const brk = cur.map((p) => `<div class="tp-card2 warn h-in">${ic('CalendarX2')}<p><b>${esc(p.label || 'Break')}</b> · no lessons until ${dDate(p.to)}${p.gids.length ? ' (' + esc(brkWho(p)) + ')' : ''}</p></div>`).join('');
  const hero = g && !doneOn(g, TODAY) ? ffHero(g) : secTodayHero();
  const hol = `<button class="tp-dashed h-in" data-sheet="breaks">${ic('CalendarX2')} Holiday or break</button>`; // 10 Nov 2026 (user): the Holiday button is back on Home
  return head + brk + hero + ffMini(g) + ffInsights2() + (typeof SECS.tomorrow === 'function' ? SECS.tomorrow() : '') + hol;
};
{
  const _h = home2Click;
  home2Click = function (b, d) { if (d.ffins) { T.ffi = d.ffins; draw(); return true; } return _h(b, d); };
}
/* ---- the iPhone title bar: big title -> small glass bar when you scroll ---- */
(function () {
  const bar = document.createElement('div'); bar.className = 'ffnav'; bar.innerHTML = '<b></b>'; document.body.appendChild(bar);
  let busy = false, pg = null, on = false;
  document.addEventListener('scroll', (e) => {
    const p = e.target; if (!(p instanceof Element) || !p.classList.contains('tp-page') || busy) return;
    busy = true; pg = p;
    requestAnimationFrame(() => { busy = false; const t = pg.querySelector('.tp-lt'), want = !!t && pg.scrollTop > 52; if (t && bar.firstChild.textContent !== t.textContent) bar.firstChild.textContent = t.textContent; if (want !== on) { on = want; bar.classList.toggle('on', want); } });
  }, { capture: true, passive: true });
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('.tp-tabs,[data-push],[data-sheet]')) bar.classList.remove('on'); }, true);
})();
