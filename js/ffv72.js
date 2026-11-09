'use strict';
/* 9 Nov (Teacher 7.2): Home.
   1) The Paid widget (one of the four small ones) draws Apple-Watch-style activity rings: one thin ring for each group.
   2) The four mini widgets are ALWAYS there. With no lesson today they show something useful instead of vanishing:
      Attendance = this month's %, Week = lessons taught this week, Files = the files of the next lesson. Loaded last. */

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

/* ---------- the four widgets, always ---------- */
function ffWeekLessons() {
  const mon = addDays(TODAY, -wd(TODAY)); let tot = 0, done = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(mon, i); S.groups.forEach((g) => { if (!g.students.length) return; if (hasLesson(g, d) || kept(g, d)) { tot++; if (doneOn(g, d)) done++; } }); }
  return { tot, done };
}
function ffMonthCame() {
  const ym = iso(TODAY).slice(0, 7); let here = 0, total = 0;
  S.groups.forEach((g) => savedDates(g).filter((x) => x.startsWith(ym)).forEach((x) => { const r = rec(g, fromIso(x)); g.students.forEach((s) => { total++; if (r.get(s.id) !== 'absent') here++; }); }));
  return total ? Math.round((here / total) * 100) : null;
}
function ffNextLessonGroup() { // the group whose next lesson comes first (when nothing is left today)
  let best = null, when = null;
  S.groups.forEach((g) => { if (!g.students.length) return; const d = lessonDay(g, TODAY, 1); if (d && (!when || d < when)) { best = g; when = d; } });
  return best;
}
const ffFileCount = (g) => { const cl = curLes(g), P = PACKS[`${String(g.lvl).toLowerCase()}-w${cl.w}-l${cl.l}`]; return P ? PK_KINDS.filter(([k]) => P[k]).length : 0; };
ffMini = function (g) {
  const D = TODAY, ym = payState().ym, sc = statusCounts(ym), r = g ? rec(g, D) : null, all = g ? g.students.length : 0, saved = !!(g && r && r.saved);
  const here = saved ? g.students.filter((s) => r.get(s.id) !== 'absent').length : 0, cl = g ? curLes(g) : null, wks = g ? lv(g.lvl).units.length : 0;
  // 1. Attendance: today's register, or this month's % when there is no lesson now
  const mc = ffMonthCame();
  const w1 = g ? ffMiniW('wg', all ? (here / all) * 100 : 0, '#fff', 'ClipboardCheck', saved ? `${here}/${all}` : `${all}`, saved ? 'came' : 'Attendance', `data-push="register" data-g="${g.id}"`)
    : ffMiniW('wg', mc || 0, '#fff', 'ClipboardCheck', mc === null ? '–' : mc + '%', 'Came · ' + MONTHS[D.getMonth()].slice(0, 3), 'data-tab="2"');
  // 2. Paid: always
  let w2 = ffMiniW('wo', sc.n ? (sc.ok / sc.n) * 100 : 0, '#fff', 'Wallet', sc.n ? `${sc.ok}/${sc.n}` : '–', 'Paid', 'data-sheet="paypick"');
  const rg = sc.n ? ffMiniRings(sc) : ''; if (rg) w2 = w2.replace(/<span class="ffring"[^>]*><i>.*?<\/i><\/span>/, rg); // one ring per group instead of the single ring
  // 3. Week: the course week of this group, or the lessons of this week
  const wl = ffWeekLessons();
  const w3 = g ? ffMiniW('wp', wks ? (cl.w / wks) * 100 : 0, '#fff', 'Target', `${cl.w}/${wks}`, 'Week', 'data-tab="1"')
    : ffMiniW('wp', wl.tot ? (wl.done / wl.tot) * 100 : 0, '#fff', 'CalendarDays', wl.tot ? `${wl.done}/${wl.tot}` : '–', 'This week', 'data-tab="2"');
  // 4. Files: of this lesson, or of the next lesson
  const ng = g || ffNextLessonGroup(), nf = ng ? ffFileCount(ng) : 0;
  const w4 = ng && nf ? ffMiniW('wb', 100, '#fff', 'FileText', `${nf}`, g ? 'Files' : 'Next files', homeOpen(ng)) : ffMiniW('wb', 0, '#fff', 'FileText', '–', 'Files', 'data-tab="1"');
  return `<div class="ffm-row">${w1}${w2}${w3}${w4}</div>`;
};
