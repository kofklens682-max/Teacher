'use strict';
/* 9 Nov (Teacher 7.1): 1) month strip is back at the top (scroll sideways, tap a month: who paid / who did not),
   2) "Then" widget under the current lesson, 3) lighter scrolling. Loaded last. */

/* ---- 1. month strip ---- */
function ffMonthStrip() {
  if (!S.pay || !feeGroups().length) return '';
  const cur = ymOf(TODAY), sel = payState().ym, from = S.pay.start && S.pay.start <= cur ? S.pay.start : cur, list = [];
  for (let m = cur, i = 0; m >= from && i < 18; m = ymAdd(m, -1), i++) list.unshift(m);
  const sc = statusCounts(sel), yr = (m) => (m.slice(0, 4) !== cur.slice(0, 4) ? ` ’${m.slice(2, 4)}` : '');
  return `<div class="ffmon h-in" data-noswipe><div class="ffmon-row" data-ffmonrow>${list.map((m) => `<button class="${m === sel ? 'on' : ''}" data-ffmon="${m}">${esc(SHORT(m))}${yr(m)}</button>`).join('')}</div>
    <div class="ffmon-sum"><b>${ymName(sel)}</b><span>${sc.n ? `<i class="ok"></i>${sc.ok} paid <i class="no"></i>${sc.n - sc.ok} not paid` : 'no fees yet'}</span></div></div>`;
}
function ffAfterHdr(html) {
  const strip = ffMonthStrip(); if (!strip) return html;
  const box = document.createElement('div'); box.innerHTML = html; const h = box.querySelector('.tp-hdr');
  if (h) h.insertAdjacentHTML('afterend', strip); else box.insertAdjacentHTML('afterbegin', strip);
  return box.innerHTML;
}

/* ---- 2. what comes after the current lesson ---- */
function ffThen() {
  const D = TODAY, g = ffNextGroup(); if (!g || doneOn(g, D)) return '';
  const s0 = startMin(g, D), more = S.groups.filter((x) => x !== g && (hasLesson(x, D) || kept(x, D)) && !doneOn(x, D) && !lessonEnded(x, D) && startMin(x, D) >= s0)
    .sort((a, b) => startMin(a, D) - startMin(b, D));
  if (!more.length) return '';
  const row = (x) => { const cl = curLes(x); return `<button class="ffnx-r" ${homeOpen(x)}><span class="ffnx-dot" style="background:${hc(x)}"></span><span class="tx"><b>${esc(x.name)}</b><span>${esc(LVNAME(x.lvl))} · Week ${cl.w} · Day ${cl.l} · ${x.students.length} students</span></span><span class="ffnx-time">${esc(timeOn(x, D))}</span></button>`; };
  return `<div class="ffnx h-in"><div class="ffnx-h">Then · after ${esc(g.name)}</div>${more.slice(0, 3).map(row).join('')}</div>`;
}
{
  const _home = pgHomeNew;
  pgHomeNew = function () {
    const html = _home.apply(this, arguments); if (!S.groups.length) return html;
    const box = document.createElement('div'); box.innerHTML = html;
    const hero = box.querySelector('.ffh'), t = ffThen(); if (hero && t) hero.insertAdjacentHTML('afterend', t);
    return ffAfterHdr(box.innerHTML);
  };
  const _att = PAGES[2];
  PAGES[2] = function () { return ffAfterHdr(_att.apply(this, arguments)); };
  const _c = home2Click;
  home2Click = function (b, d) {
    if (d.ffmon) { const P = payState(); if (P.ym !== d.ffmon) { P.ym = d.ffmon; T.ffMonX = document.querySelector('[data-ffmonrow]')?.scrollLeft; draw(); } return true; }
    return _c(b, d);
  };
  const _d = draw;
  draw = function () {
    const r = _d.apply(this, arguments);
    document.querySelectorAll('[data-ffmonrow]').forEach((row) => { const on = row.querySelector('.on'); if (on) row.scrollLeft = T.ffMonX !== undefined ? T.ffMonX : on.offsetLeft - row.clientWidth + on.offsetWidth + 20; });
    return r;
  };
  document.addEventListener('scroll', (e) => { const r = e.target; if (r instanceof Element && r.dataset && r.dataset.ffmonrow !== undefined) T.ffMonX = r.scrollLeft; }, true);
}
