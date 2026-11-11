'use strict';
/* 9 Nov (Teacher 7.1): 1) the month button on Home (now ffMonthStrip in ffv72.js), 2) "Then" widget under the current lesson.
   Loaded last. 11 Nov: Home puts both in place itself (pgHomeNew in ffhome.js), no second pass over its HTML. */

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
  // 10 Nov 2026 (user): the month button and the paid counts are on Home only; Attendance does not repeat them
  const _c = home2Click;
  home2Click = function (b, d) {
    if (d.ffmon) { const P = payState(); if (P.ym !== d.ffmon) { P.ym = d.ffmon; draw(); } return true; }
    return _c(b, d);
  };
}
