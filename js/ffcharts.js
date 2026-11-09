'use strict';
/* B+ infographics (charts) for Home. Counts only: money stays in the Budget app. Loaded after ffsys.js. */
const ffShort = (k) => { const d = fromIso(k); return d.getDate() + '/' + (d.getMonth() + 1); };
const ffCol = (p) => (p >= 85 ? '#1FD65F' : p >= 65 ? '#FFAB00' : '#FF3B5C');
function ffBars(pts, o) { // pts: [{p, top, label, col, cur}]  p = 0..100; a quiet bar chart in SVG
  const W = 320, H = o.h || 150, top = 20, bot = 24, hh = H - top - bot, n = pts.length, slot = (W - 8) / n, bw = Math.min(30, slot * 0.62);
  const grid = [0, 50, 100].map((v) => { const y = top + hh - (v / 100) * hh; return `<line x1="4" x2="${W - 4}" y1="${y}" y2="${y}" class="gl${v ? '' : ' base'}"/>${v && !o.h ? `<text x="${W - 4}" y="${y - 3}" text-anchor="end" class="gt">${v}%</text>` : ''}`; }).join('');
  const bars = pts.map((q, i) => { const x = 4 + i * slot + (slot - bw) / 2, h = Math.max(q.p > 0 ? 4 : 0, (q.p / 100) * hh), y = top + hh - h;
    return `<g><rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="7" fill="${q.col || o.color}" class="bar"/><text x="${x + bw / 2}" y="${y - 5}" text-anchor="middle" class="bv">${q.top}</text><text x="${x + bw / 2}" y="${H - 7}" text-anchor="middle" class="bl${q.cur ? ' cur' : ''}">${q.label}</text></g>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="ffsvg" role="img" aria-label="${esc(o.aria)}">${grid}${bars}</svg>`;
}
function ffInsights() {
  const gs = S.groups.filter((g) => g.students.length); if (!gs.length) return '';
  const g = gById(T.ffg) || ffNextGroup() || gs[0];
  const chips = gs.length > 1 ? `<div class="ffc-chips">${gs.map((x) => `<button class="${x === g ? 'on' : ''}" data-ffgrp="${x.id}"><i style="background:${hc(x)}"></i>${esc(x.name)}</button>`).join('')}</div>` : '';
  // 1. attendance of the last 8 saved lessons
  const pts = savedDates(g).slice(-8).map((k) => { const r = rec(g, fromIso(k)), n = g.students.length, here = g.students.filter((s) => r.get(s.id) !== 'absent').length, p = n ? Math.round((here / n) * 100) : 0; return { p, top: String(here), label: ffShort(k), col: ffCol(p) }; });
  const avg = pts.length ? Math.round(pts.reduce((a, b) => a + b.p, 0) / pts.length) : null;
  const att = `<div class="ffc h-in"><div class="ffc-h"><div><b>Attendance</b><span>${pts.length ? `last ${pts.length} lessons · ${esc(g.name)}` : esc(g.name)}</span></div>${avg !== null ? `<div class="ffc-big" style="color:${ffCol(avg)}">${avg}<em>%</em><small>on average</small></div>` : ''}</div>
    ${pts.length ? ffBars(pts, { color: '#1FD65F', aria: 'Attendance of the last lessons' }) : '<p class="ffc-empty">The chart appears after your first saved register.</p>'}${pts.length ? '<div class="ffc-k"><span><i style="background:#1FD65F"></i>85% and more</span><span><i style="background:#FFAB00"></i>65–84%</span><span><i style="background:#FF3B5C"></i>below 65%</span><em>The number on a bar is how many students came.</em></div>' : ''}</div>`;
  // 2. who paid, month by month (all groups, counts only)
  const ym0 = ymOf(TODAY), ms = [-5, -4, -3, -2, -1, 0].map((k) => ymAdd(ym0, k)), cs = ms.map((ym) => ({ ym, c: statusCounts(ym) }));
  const pp = cs.map(({ ym, c }) => { const on = c.n > 0 && ym >= S.pay.start; return { p: on ? Math.round((c.ok / c.n) * 100) : 0, top: on ? c.ok + '/' + c.n : '', label: SHORT(ym), col: ym === ym0 ? '#FF8A00' : '#FFCF66', cur: ym === ym0 }; }); // months before the first month of payments stay empty
  const now = cs[cs.length - 1].c;
  const pay = `<div class="ffc h-in"><div class="ffc-h"><div><b>Who paid</b><span>last 6 months · all groups</span></div><div class="ffc-big" style="color:#FF8A00">${now.ok}<em>/${now.n}</em><small>${MONTHS[+ym0.slice(5) - 1]}</small></div></div>${ffBars(pp, { color: '#FF9500', aria: 'Students who paid, by month' })}<div class="ffc-k"><em>The number on a bar is students paid of all students. The money itself is in Budget.</em></div></div>`;
  // 3. the course: one segment per week
  const L = lv(g.lvl), wks = L.units.length, cl = curLes(g), total = L.units.reduce((a, u) => a + u.lessons.length, 0), done = L.units.slice(0, cl.w - 1).reduce((a, u) => a + u.lessons.length, 0) + cl.l - 1;
  const seg = L.units.map((u, i) => `<i class="${i + 1 < cl.w ? 'd' : i + 1 === cl.w ? 'n' : ''}"><b>${i + 1}</b></i>`).join('');
  const crs = `<div class="ffc h-in"><div class="ffc-h"><div><b>Course</b><span>${esc(LVNAME(g.lvl))} · ${esc(g.name)}</span></div><div class="ffc-big" style="color:#3B5BDB">${Math.round((done / total) * 100)}<em>%</em><small>${done} of ${total} lessons</small></div></div>
    <div class="ffseg" style="--n:${wks}">${seg}</div><div class="ffc-k"><span><i style="background:#3B5BDB"></i>done</span><span><i style="background:#0A84FF"></i>this week</span><span><i style="background:#D1D1D6"></i>to come</span><em>${wks - cl.w} weeks left.</em></div></div>`;
  return `<div class="tp-sec dr-sec"><h4>Insights</h4></div>${chips}${att}${pay}${crs}`;
}
{
  const _h = home2Click;
  home2Click = function (b, d) { if (d.ffgrp) { T.ffg = d.ffgrp; draw(); return true; } return _h(b, d); };
}
