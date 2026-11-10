'use strict';
/* 8 Nov PREVIEW: the background color follows the tab; Units title fix. Loaded last. */
{
  const _d = draw;
  draw = function () {
    const r = _d.apply(this, arguments), tp = document.querySelector('.tp');
    if (tp && tp.dataset.tab !== String(T.tab)) tp.dataset.tab = String(T.tab);
    return r;
  };
  const _u = pgUnits;
  pgUnits = function () { return _u.apply(this, arguments).replace(/Week (\d+) · Week \1\b/g, 'Week $1'); }; // "Week 12 · Week 12" -> "Week 12"
  PAGES[1] = pgUnits; // the tab list kept the old function, point it at the fixed one
  const _g = goTab;
  goTab = function (i) { const tp = document.querySelector('.tp'); if (tp) tp.dataset.tab = String(i); return _g.apply(this, arguments); }; // the color starts changing at the tap, not after the page moved
  const tp0 = document.querySelector('.tp'); if (tp0) tp0.dataset.tab = String(T.tab);
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
