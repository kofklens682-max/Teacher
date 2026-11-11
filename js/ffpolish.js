'use strict';
/* 8 Nov PREVIEW: Units title fix. Loaded last.
   11 Nov (smooth): the old wallpaper that changed color per tab is gone (nothing showed it any more), so the app's root
   no longer gets a data-tab attribute on every draw and every tab tap. */
{
  const _u = pgUnits;
  pgUnits = function () { return _u.apply(this, arguments).replace(/Week (\d+) · Week \1\b/g, 'Week $1'); }; // "Week 12 · Week 12" -> "Week 12"
}
/* ---- 11 Nov (smooth): the tab pages are GPU layers only while a finger swipes between the tabs ----
   (style.css: .tp-viewport.ff-live). Permanent layers on all four full-screen pages held graphics memory all the time; now the
   layers are made when a sideways swipe starts and given back after the page has settled. Same start rule as bindSwipe in app.js. */
{
  let sw = null, offT = 0;
  const vp = () => document.querySelector('.tp-viewport');
  const off = () => { const v = vp(); if (v) v.classList.remove('ff-live'); };
  document.addEventListener('pointerdown', (e) => {
    const v = vp(); sw = null; if (!v || e.button > 0 || !v.contains(e.target) || e.target.closest('[data-noswipe],input,textarea,select')) return;
    sw = { x: e.clientX, y: e.clientY, id: e.pointerId };
  }, { capture: true, passive: true });
  document.addEventListener('pointermove', (e) => {
    if (!sw || e.pointerId !== sw.id) return; const dx = Math.abs(e.clientX - sw.x), dy = Math.abs(e.clientY - sw.y);
    if (dx < 10 && dy < 10) return;
    if (dx >= dy * 1.2) { clearTimeout(offT); const v = vp(); if (v) v.classList.add('ff-live'); }
    sw = null;
  }, { capture: true, passive: true });
  // after the finger lets go the page glides for at most 420 ms (app.js bindSwipe), then the layers go
  const up = (e) => { if (sw && e.pointerId === sw.id) sw = null; const v = vp(); if (v && v.classList.contains('ff-live')) { clearTimeout(offT); offT = setTimeout(off, 700); } };
  document.addEventListener('pointerup', up, { capture: true, passive: true });
  document.addEventListener('pointercancel', up, { capture: true, passive: true });
}

/* ---- Attendance: a hero for the next register and two bright numbers above the group lists ---- */
function ffAtt() {
  const base = pgAtt(), at = base.indexOf('<div class="tp-sec">'); if (at < 0 || !S.groups.length) return base;
  const D = TODAY, k = iso(D), stu = (n) => `${n} student${n === 1 ? '' : 's'}`, list = S.groups.filter((g) => hasLesson(g, D) || kept(g, D)).sort((a, b) => startMin(a, D) - startMin(b, D)), next = list.find((g) => !rec(g, D).saved);
  const hero = next ? `<div class="hn-next at-hero h-in"><div class="hn-top"><span class="hn-tag">Next to mark</span><span class="hn-when">${lessonOpen(next, D) ? 'open now' : 'opens ' + esc(timeOn(next, D))}</span></div>
      <b class="hn-name">${esc(next.name)}</b><span class="hn-sub">${esc(LVNAME(next.lvl))} · ${esc(timeOn(next, D))} · ${stu(next.students.length)}</span>
      <div class="hn-btns"><button data-push="register" data-g="${next.id}" data-date="${k}">${ic('ClipboardCheck')}Mark now</button></div></div>` : (list.length ? doneCard(list, D) : '');
  const ym = k.slice(0, 7); let here = 0, total = 0, taken = 0;
  S.groups.forEach((g) => savedDates(g).filter((x) => x.startsWith(ym)).forEach((x) => { taken++; const r = rec(g, fromIso(x)); g.students.forEach((s) => { total++; if (r.get(s.id) !== 'absent') here++; }); }));
  const pc = total ? Math.round((here / total) * 100) : null;
  const minis = `<div class="at-two"><div class="at-mini h-in"><span class="h">${MONTHS[D.getMonth()]}</span><b>${pc === null ? '–' : pc}<small>${pc === null ? '' : '%'}</small></b><span class="s">came to lessons</span><span class="ho-bar"><i style="--w:${pc || 0}%"></i></span></div>
    <div class="at-mini h-in"><span class="h">Registers</span><b>${taken}</b><span class="s">taken this month</span></div></div>`;
  return base.slice(0, at) + hero + minis + base.slice(at);
}
PAGES[2] = ffAtt;
