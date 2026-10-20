'use strict';
/* The teacher app: Home (group tiles) · Units (the course) · Attendance ("everyone is here, tap who isn't") · Books.
   Built from the model the user approved in the Teen Course Plan page. C = the course (data/course.js), S = your data (store.js). */

const VERSION_LABEL = 'Teacher 1.0';
const GRAD = { A1: ['#34C759', '#0FA37F'], A2: ['#32ADE6', '#147EFB'], B1: ['#5E7BFF', '#3D5AFE'], 'B1+': ['#8B6CFF', '#5B3DF5'], B2: ['#C46BF5', '#8E3BD9'], I1: ['#FF6B9A', '#E0457B'], I2: ['#FF8A4C', '#E5484D'], own: ['#F5B300', '#E8770E'] };
const TOPIC = ['#34C759', '#0FA37F', '#FF9F0A', '#FF6B9A', '#32ADE6', '#147EFB', '#5E7BFF', '#3D5AFE', '#FF8A4C', '#E5484D', '#8B6CFF', '#5B3DF5', '#14B8A6', '#0F766E', '#38BDF8', '#0369A1', '#F5B300', '#E8770E'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], DAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const AVC = ['#FF6B9A', '#32ADE6', '#8B6CFF', '#34C759', '#FF8A4C', '#5E7BFF', '#C46BF5', '#0FA37F'];
const NEXT = { here: 'absent', absent: 'late', late: 'here' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const gv = (id) => `--g1:${(GRAD[id] || GRAD.own)[0]};--g2:${(GRAD[id] || GRAD.own)[1]}`;
const lv = (id) => C.levels.find((l) => l.id === id);
const LVNAME = (id) => (id === 'own' ? 'Own program' : id === 'I1' ? 'IELTS 5.5-6.5' : id === 'I2' ? 'IELTS 7+' : lv(id) ? lv(id).name : id);
const planned = (id) => ['A1', 'A2', 'B1', 'B1+', 'B2'].includes(id);
const avColor = (s) => AVC[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVC.length];
const gById = (id) => S.groups.find((g) => g.id === id);
const weekOf = (lid, n) => lv(lid).units[n - 1];

// ---------- dates (the real today; refreshed when the app comes back) ----------
const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
let TODAY = midnight(new Date());
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromIso = (k) => new Date(k + 'T00:00:00');
const wd = (d) => (d.getDay() + 6) % 7; // Monday = 0 … Sunday = 6
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const dayName = (d) => (iso(d) === iso(TODAY) ? 'Today' : iso(d) === iso(addDays(TODAY, -1)) ? 'Yesterday' : `${DAYS[wd(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]}`);

// ---------- groups ----------
const hasLesson = (g, d) => g.days.includes(wd(d));
const taughtOn = (g, d) => (S.taught[g.id] || {})[iso(d)];
function advance(g, n) {
  let w = g.week, l = g.les + n; const L = lv(g.lvl);
  while (l > 3) { l -= 3; w++; }
  while (l < 1) { l += 3; w--; }
  if (w < 1) { w = 1; l = 1; }
  if (w > L.units.length) { w = L.units.length; l = L.units[w - 1].lessons.length; }
  if (l > weekOf(g.lvl, w).lessons.length) l = weekOf(g.lvl, w).lessons.length; // the level test is one lesson
  return { w, l };
}
function nextOffset(g) { // days until the group's next lesson (0 = today, unless already taught)
  for (let i = 0; i < 7; i++) { const d = addDays(TODAY, i); if (hasLesson(g, d) && !(i === 0 && (taughtOn(g, d) || (S.ownDone[g.id] || {})[iso(d)]))) return i; }
  return 8;
}
function nextDayLabel(g) {
  for (let i = 0; i < 7; i++) { const d = addDays(TODAY, i); if (hasLesson(g, d) && !(i === 0 && (taughtOn(g, d) || (S.ownDone[g.id] || {})[iso(d)]))) return i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS_LONG[wd(d)]; }
  return g.days.length ? DAYS_LONG[g.days[0]] : 'No days set';
}
const groupLabel = (g) => `${esc(LVNAME(g.lvl))} · ${esc(g.name)}`;
const unitTile = (u, i, big) => `<span class="tp-tile${big ? ' big' : ''}" style="--t1:${TOPIC[(i * 2) % TOPIC.length]};--t2:${TOPIC[(i * 2 + 1) % TOPIC.length]}">${ic(u.icon || 'BookOpen')}</span>`;
const groupTile = (g) => (g.lvl === 'own' ? `<span class="tp-tile" style="${gv('own')};--t1:var(--g1);--t2:var(--g2)">${ic('Shapes')}</span>`
  : planned(g.lvl) ? unitTile(weekOf(g.lvl, g.week), g.week - 1) : `<span class="tp-tile" style="--t1:${GRAD[g.lvl][0]};--t2:${GRAD[g.lvl][1]}">${ic('GraduationCap')}</span>`);
const openLessonAttr = (g) => (g.lvl === 'own' ? `data-push="own" data-g="${g.id}"` : planned(g.lvl) ? `data-push="lesson" data-lvl="${g.lvl}" data-w="${g.week}" data-l="${g.les}" data-g="${g.id}"` : `data-push="register" data-g="${g.id}"`);
function ring(p, size, w, c1, c2, label) {
  const r = (size - w) / 2, L = 2 * Math.PI * r, id = 'rg' + Math.random().toString(36).slice(2, 7);
  return `<div class="tp-ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(14,19,37,.07)" stroke-width="${w}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#${id})" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${L.toFixed(1)}" stroke-dashoffset="${(L * (1 - p)).toFixed(1)}"/></svg><b>${label}</b></div>`;
}

// ---------- attendance records: S.rec[group][date][student] = here | absent | late; S.hw = homework done ----------
function rec(g, d, create) {
  const k = iso(d);
  let att = (S.rec[g.id] || {})[k], hw = (S.hw[g.id] || {})[k];
  if (create && !att) { att = (S.rec[g.id] = S.rec[g.id] || {})[k] = {}; hw = (S.hw[g.id] = S.hw[g.id] || {})[k] = {}; }
  att = att || {}; hw = hw || {};
  return { att, hw, get: (sid) => att[sid] || 'here', hwOf: (sid) => hw[sid] !== false, saved: !!(S.saved[g.id] || {})[k] };
}
function savedDates(g) { return Object.keys(S.saved[g.id] || {}).filter((k) => S.saved[g.id][k]).sort(); }
function attPct(g) { // the share of students present over this month's taken registers (or all of them early in a month)
  const all = savedDates(g), ym = iso(TODAY).slice(0, 7), month = all.filter((k) => k.startsWith(ym)), use = month.length ? month : all;
  let here = 0, total = 0;
  use.forEach((k) => { const r = rec(g, fromIso(k)); g.students.forEach((s) => { if (!(s.id in r.att) && !r.saved) return; total++; if (r.get(s.id) !== 'absent') here++; }); });
  return total ? Math.round((here / total) * 100) : null;
}
function lessonDay(g, from, dir) { // the group's lesson before (-1) / after (+1) a date, never after today; dates with a record count too
  let d = new Date(from); const born = midnight(new Date(g.created || 0));
  for (let i = 0; i < 70; i++) {
    d = addDays(d, dir); if (d > TODAY) return null;
    const has = (S.rec[g.id] || {})[iso(d)];
    if (has) return d;
    if (d < born) { if (dir < 0) return null; continue; } // no lessons before the group was added
    if (hasLesson(g, d)) return d;
  }
  return null;
}
function lastLesson(g) { return hasLesson(g, TODAY) || (S.rec[g.id] || {})[iso(TODAY)] ? new Date(TODAY) : lessonDay(g, TODAY, -1); }

// ---------- UI state ----------
const T = { tab: 0, push: [], sheet: null, unitLvl: 'A1', bookLvl: 0, bookSeg: 'books' };
try { const u = JSON.parse(localStorage.getItem('teacher-ui') || '{}'); if (u.unitLvl && lv(u.unitLvl)) T.unitLvl = u.unitLvl; if (u.bookLvl >= 0 && u.bookLvl < C.levels.length) T.bookLvl = u.bookLvl; } catch (e) { /* defaults */ }
const keepUi = () => { try { localStorage.setItem('teacher-ui', JSON.stringify({ unitLvl: T.unitLvl, bookLvl: T.bookLvl })); } catch (e) { /* not needed */ } };

/* ===================== Home: groups as tiles ===================== */
function pgHome() {
  const todayN = S.groups.filter((g) => hasLesson(g, TODAY)).length;
  const head = `<div class="tp-hdr"><div><div class="tp-eyebrow">${DAYS_LONG[wd(TODAY)]} ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]}${S.groups.length ? ` · ${todayN} lesson${todayN === 1 ? '' : 's'} today` : ''}</div><div class="tp-lt">My groups</div></div>
    <div class="hdr-btns"><button class="tp-iconbtn" data-sheet="settings" aria-label="Settings and backup">${ic('Ellipsis')}</button><button class="tp-roundbtn" data-sheet="group" aria-label="New group">${ic('Plus')}</button></div></div>`;
  if (!S.groups.length) return head + `<div class="tp-empty2 welcome">${ic('Users')}<b>Add your first group</b><span>Choose its level, the days and time, and the students. The app then shows each group's next lesson and opens the register with everyone marked here.</span><button class="tp-cta" data-sheet="group">${ic('Plus')} New group</button></div>`;
  const tiles = [...S.groups].sort((a, b) => nextOffset(a) - nextOffset(b) || a.time.localeCompare(b.time)).map((g) => {
    const p = attPct(g), u = planned(g.lvl) ? weekOf(g.lvl, g.week) : null, done = taughtOn(g, TODAY) || (S.ownDone[g.id] || {})[iso(TODAY)];
    return `<div class="ht-tile" style="${gv(g.lvl)}"><button class="ht-main" ${openLessonAttr(g)}>
      <div class="ht-top"><span class="ht-ico">${ic(u ? u.icon || 'BookOpen' : g.lvl === 'own' ? 'Shapes' : 'GraduationCap')}</span>${p === null ? '' : ring(p / 100, 40, 4, '#ffffff', '#ffffffcc', p + '%')}</div>
      <b>${esc(g.name)}</b><span class="lv">${esc(LVNAME(g.lvl))} · ${g.students.length} student${g.students.length === 1 ? '' : 's'}</span>
      <span class="nx">${done ? 'Taught today ✓' : `${nextDayLabel(g)} · ${esc(g.time)}`}</span>
      <span class="ls">${u ? `Week ${g.week} · Lesson ${g.les}: ${esc(u.lessons[g.les - 1].subtopic)}` : g.lvl === 'own' ? esc(g.book || 'Own book') : 'Plan coming'}</span></button>
      <button class="ht-reg" data-push="register" data-g="${g.id}">${ic('ClipboardCheck')} Register</button></div>`;
  }).join('');
  return head + `<div class="ht-grid">${tiles}<button class="ht-tile add" data-sheet="group">${ic('Plus')}<b>New group</b></button></div>`;
}

/* ===================== Units: level → weeks → lessons ===================== */
function pgUnits() {
  const L = lv(T.unitLvl), here = S.groups.filter((g) => g.lvl === L.id);
  const chips = C.levels.map((l) => `<button class="${l.id === T.unitLvl ? 'on' : ''}" style="${gv(l.id)}" data-unitlvl="${l.id}">${esc(LVNAME(l.id))}</button>`).join('');
  const body = !planned(L.id) ? `<div class="tp-empty2">${ic('Hammer')}<b>${esc(LVNAME(L.id))} comes next</b><span>The course is planned one level at a time; the IELTS levels are next.</span></div>`
    : `<div class="tp-list">${L.units.map((u, i) => { const grp = here.filter((g) => g.week === u.n).map((g) => g.name);
      return `<button class="tp-wrow" data-push="week" data-lvl="${L.id}" data-w="${u.n}">${u.final ? `<span class="tp-tile" style="--t1:#F5B300;--t2:#E8770E">${ic('Trophy')}</span>` : unitTile(u, i)}
        <span class="tx"><span class="k">${u.final ? 'One lesson' : 'Week ' + u.n}${grp.length ? ` · <em>${esc(grp.join(', '))} ${grp.length > 1 ? 'are' : 'is'} here</em>` : ''}</span><b>${esc(u.title)}</b><span>${u.lessons.map((l) => esc(l.subtopic)).join(' · ')}</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button>`; }).join('')}</div>`;
  return `<div class="tp-hdr"><div><div class="tp-eyebrow">Teen course</div><div class="tp-lt">Units</div></div></div>
    <div class="tp-segs" data-noswipe>${chips}</div>
    <div class="tp-lvlcard" style="${gv(L.id)}"><div><div class="k">${esc(L.cefr)} · ${L.weeks} weeks</div><b>${esc(LVNAME(L.id))}</b><span>${planned(L.id) ? esc(L.focus) : 'Planned next'}</span></div>${here.length ? `<span class="n">${here.length}<small>group${here.length > 1 ? 's' : ''}</small></span>` : ''}</div>
    ${body}`;
}
function scWeek(f) {
  const L = lv(f.lvl), u = weekOf(f.lvl, f.w), i = f.w - 1;
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Units</button></div>
    <div class="tp-inner" style="${gv(L.id)}">
      <div class="tp-whead">${u.final ? `<span class="tp-tile big" style="--t1:#F5B300;--t2:#E8770E">${ic('Trophy')}</span>` : unitTile(u, i, true)}<div><div class="tp-eyebrow">${esc(LVNAME(L.id))} · ${u.final ? 'One lesson' : 'Week ' + u.n}</div><div class="tp-lt" style="font-size:28px">${esc(u.title)}</div></div></div>
      <div class="tp-goal2">${ic('Target')}<div><small>${u.final ? 'When' : 'By the end of the week they can say'}</small>${u.final ? esc(u.goal) : `“${esc(u.goal)}”`}</div></div>
      <div class="tp-list">${u.lessons.map((l) => `<button class="tp-lesrow2" data-push="lesson" data-lvl="${L.id}" data-w="${u.n}" data-l="${l.n}"><span class="num">${l.n}</span><span class="tx"><b>${esc(l.subtopic)}</b><span>${esc(l.skill || l.grammarTopic || l.grammar)}</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button>`).join('')}</div>
      ${u.skill ? `<div class="tp-card2"><div class="h">${ic('MessageCircle')}Speaking</div><p>${esc(u.skill)}</p>${u.writing ? `<div class="h" style="margin-top:10px">${ic('PenLine')}Writing</div><p>${esc(u.writing)}</p>` : ''}${u.eew ? `<div class="h" style="margin-top:10px">${ic('BookA')}Word book</div><p>${esc(u.eew)}</p>` : ''}${u.reading ? `<div class="h" style="margin-top:10px">${ic('BookOpen')}Reader</div><p>${esc(u.reading)}</p>` : ''}</div>` : ''}
    </div>`;
}
const chips = (arr, cls) => `<div class="tp-words${cls ? ' ' + cls : ''}">${arr.map((w) => `<span>${esc(w)}</span>`).join('')}</div>`;
function scLesson(f) {
  const L = lv(f.lvl), u = weekOf(f.lvl, f.w), l = u.lessons[f.l - 1], key = `${L.id}-${u.n}-${l.n}`, ed = S.edits[key] || {};
  const g = f.g && gById(f.g), t = g && taughtOn(g, TODAY);
  const isTaught = t && t.w === f.w && t.l === f.l, isNext = g && g.week === f.w && g.les === f.l && !t;
  const books = l.vocabBook ? `<p class="sub" style="margin-top:8px">Practice: ${l.vocabBook.map((b) => esc(b.book + ', unit ' + b.unit + (b.title ? ' (' + b.title + ')' : ''))).join('; ')}</p>` : '';
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button><button class="tp-pill" data-sheet="lesson" data-key="${key}">${ic('Pencil')} Edit</button></div>
    <div class="tp-inner" style="${gv(L.id)}">
      <div class="tp-whead">${u.final ? `<span class="tp-tile big" style="--t1:#F5B300;--t2:#E8770E">${ic('Trophy')}</span>` : unitTile(u, f.w - 1, true)}<div><div class="tp-eyebrow">${g ? esc(g.name) + ' · ' : ''}${u.final ? '' : 'Week ' + u.n + ' · '}Lesson ${l.n} · ${esc(u.title)}</div><div class="tp-lt" style="font-size:26px">${esc(l.subtopic)}</div></div></div>
      ${ed.notes ? `<div class="tp-card2 note">${ic('StickyNote')}<p>${esc(ed.notes)}</p></div>` : ''}
      ${l.skill ? `<div class="tp-card2"><div class="h" style="color:#E5484D">${ic(/^Reading/.test(l.skill) ? 'BookOpenCheck' : /^Listening/.test(l.skill) ? 'Headphones' : 'PenLine')}Skill</div><p class="big">${esc(l.skill)}</p><p class="ex">${esc(l.how)}</p><p class="sub">Source: ${esc(l.source)}</p></div>` : ''}
      ${l.activity ? `<div class="tp-card2"><div class="h" style="color:#F5A000">${ic('PartyPopper')}Activity</div><p>${esc(l.activity)}</p></div>` : ''}
      ${l.grammarTopic || l.grammar ? `<div class="tp-card2"><div class="h" style="color:#7B61FF">${ic('Puzzle')}Grammar topic</div><p class="big">${esc(l.grammarTopic || l.grammar)}</p>${l.grammarTopic && l.grammar ? `<p class="ex">${esc(l.grammar)}</p>` : ''}${l.bgiu && l.bgiu.length ? `<p class="sub">${L.id === 'A1' ? "Teacher's reference" : 'Students practice in'}: ${esc(l.gbook || 'Basic Grammar in Use (American)')}, unit${l.bgiu.length > 1 ? 's' : ''} ${l.bgiu.join(', ')}</p>` : ''}${l.grammarExtra ? `<p class="sub">Also: ${esc(l.grammarExtra.book)}, unit${l.grammarExtra.units.length > 1 ? 's' : ''} ${l.grammarExtra.units.join(', ')}</p>` : ''}</div>` : ''}
      ${l.words.length ? `<div class="tp-card2"><div class="h" style="color:#147EFB">${ic('BookA')}Vocabulary topic</div><p class="big">${esc(l.vocabTopic || '')} · ${l.words.length}${l.revise ? ' new' : ''} words</p>${chips(l.words)}
        ${l.revise ? `<div class="h" style="color:#5C6378;margin-top:8px">${ic('RotateCcw')}Revision words</div>${chips(l.revise)}` : ''}
        ${l.collocations ? `<div class="h" style="color:#0FA37F;margin-top:8px">${ic('Link')}Collocations</div>${chips(l.collocations, 'col')}` : ''}
        ${l.phrasal && l.phrasal.length ? `<div class="h" style="color:#E8770E;margin-top:8px">${ic('ArrowUpRight')}Phrasal verbs</div>${chips(l.phrasal, 'pv')}` : ''}${books}</div>` : ''}
      ${l.watch ? `<div class="tp-card2"><div class="h" style="color:#FF5A5F">${ic('CirclePlay')}Watch & talk</div><p class="big">${esc(l.watch)}</p>${l.watchAlt ? `<p class="sub">${esc(l.watchAlt)}</p>` : ''}<p class="sub">Watch once for the main idea, then again with 3 questions; translate 5 lines; retell in pairs.</p></div>` : ''}
      ${l.review ? `<div class="tp-card2"><div class="h" style="color:#0FA37F">${ic('RotateCcw')}Review · 15 min</div><p>${esc(l.review)}</p></div>` : ''}
      ${l.use ? `<div class="tp-card2"><div class="h" style="color:#E8770E">${ic('Sparkles')}Use it in real life</div><p>${esc(l.use)}</p></div>` : ''}
      ${l.speaking ? `<div class="tp-card2"><div class="h" style="color:#12B76A">${ic('MessageCircle')}Speaking</div><p>${esc(l.speaking)}</p></div>` : ''}
      ${l.reader ? `<div class="tp-card2"><div class="h" style="color:#E8770E">${ic('BookOpen')}Graded reader</div><p>${esc(l.reader)}</p></div>` : ''}
      ${ed.link ? `<a class="tp-media" href="${esc(safeUrl(ed.link))}" target="_blank" rel="noopener"><span class="mi" style="background:#FF5A5F">${ic('CirclePlay')}</span><span class="tx"><b>Your link for this lesson</b><span>${esc(ed.link)}</span></span></a>` : ''}
      <div class="tp-card2"><div class="h" style="color:#5C6378">${ic('ListChecks')}Homework</div>${[...(l.homework || []), ...(ed.hw ? [ed.hw] : [])].map((h) => `<p class="hw">${ic('Square')}${esc(h)}</p>`).join('') || '<p>None</p>'}</div>
      ${l.check ? `<div class="tp-card2 warn">${ic('ClipboardList')}<p><b>Check today:</b> ${esc(l.check)}</p></div>` : ''}
      ${g && (isTaught || isNext) ? `<button class="tp-cta ${isTaught ? 'done' : ''}" data-taught="${g.id}" data-w="${f.w}" data-l="${f.l}">${isTaught ? 'Taught ✓ · tap to undo' : 'Mark as taught'}</button>
        <p class="tp-small">${isTaught ? `${esc(g.name)} is now on the next lesson.` : `Marking it taught moves ${esc(g.name)} to the next lesson. To repeat a lesson or jump ahead, use Edit group.`}</p>`
        : g ? `<p class="tp-small">${esc(g.name)} is on Week ${g.week} · Lesson ${g.les}.</p>` : ''}
    </div>`;
}
function scOwn(f) {
  const g = gById(f.g); if (!g) return scGone();
  const key = 'own-' + g.id, ed = S.edits[key] || {}, done = (S.ownDone[g.id] || {})[iso(TODAY)], n = Object.keys(S.ownDone[g.id] || {}).length;
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button><button class="tp-pill" data-sheet="lesson" data-key="${key}">${ic('Pencil')} Edit</button></div>
    <div class="tp-inner" style="${gv('own')}">
      <div class="tp-whead">${groupTile(g)}<div><div class="tp-eyebrow">${esc(g.book || 'Own book')} · ${esc(g.time)}</div><div class="tp-lt" style="font-size:26px">${esc(g.name)}</div></div></div>
      <div class="tp-card2 note">${ic('StickyNote')}<p>${ed.notes ? esc(ed.notes) : 'Own program: this group has its own book. Tap Edit to write your plan.'}</p></div>
      ${ed.hw ? `<div class="tp-card2"><div class="h" style="color:#5C6378">${ic('ListChecks')}Homework</div><p class="hw">${ic('Square')}${esc(ed.hw)}</p></div>` : ''}
      <p class="tp-small">${n} lesson${n === 1 ? '' : 's'} taught so far</p>
      <button class="tp-cta ${done ? 'done' : ''}" data-owndone="${g.id}">${done ? 'Taught ✓ · tap to undo' : 'Mark as taught'}</button>
    </div>`;
}
const scGone = () => `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button></div><div class="tp-inner"><div class="tp-empty2">${ic('Info')}<b>This group was removed</b></div></div>`;
const safeUrl = (u) => (/^https?:\/\//i.test(u) ? u : 'https://' + u.replace(/^[a-z]+:/i, ''));

/* ===================== Attendance: everyone is here, tap who isn't ===================== */
function stuRow(g, d, s, r) {
  const a = r.get(s.id), hw = r.hwOf(s.id);
  return `<div class="tl-st ${a}" data-sid="${s.id}"><button class="tl-main" data-tap="${s.id}"><span class="tp-av" style="background:${avColor(s.name)}">${esc(s.name[0].toUpperCase())}</span><span class="nm">${esc(s.name)}</span><span class="st">${a}</span></button>
    <button class="tl-hw ${hw ? 'on' : ''}" data-taphw="${s.id}" aria-label="Homework: ${esc(s.name)}"${a === 'absent' ? ' hidden' : ''}>${ic(hw ? 'BookCheck' : 'BookX')}</button></div>`;
}
function saveLabel(g, d) { const r = rec(g, d), here = g.students.filter((s) => r.get(s.id) !== 'absent').length; return `${r.saved ? 'Saved ✓ · ' : 'Save · '}${here} of ${g.students.length} here`; }
function tapList(g, d) {
  if (!g.students.length) return `<div class="tp-empty2">${ic('UserPlus')}<b>No students yet</b><span>Add them below or in Edit group.</span></div>`;
  const r = rec(g, d);
  return `<div class="tl-grid" data-g="${g.id}" data-date="${iso(d)}">${g.students.map((s) => stuRow(g, d, s, r)).join('')}</div>
    <p class="jr-key">Tap a name: once = absent, twice = late, three times = here again. The book = homework done or not.</p>
    <button class="tp-cta save-day ${r.saved ? 'done' : ''}" data-saveday="${g.id}" data-date="${iso(d)}">${saveLabel(g, d)}</button>`;
}
function pgAtt() {
  const today = S.groups.filter((g) => hasLesson(g, TODAY)).sort((a, b) => a.time.localeCompare(b.time)), others = S.groups.filter((g) => !hasLesson(g, TODAY));
  if (!S.groups.length) return `<div class="tp-hdr"><div><div class="tp-eyebrow">Today · ${DAYS_LONG[wd(TODAY)]} ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]}</div><div class="tp-lt">Attendance</div></div></div><div class="tp-empty2">${ic('ClipboardCheck')}<b>No groups yet</b><span>Add a group on Home; its register appears here on its lesson days.</span></div>`;
  return `<div class="tp-hdr"><div><div class="tp-eyebrow">Today · ${DAYS_LONG[wd(TODAY)]} ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]}</div><div class="tp-lt">Attendance</div></div><button class="tp-roundbtn" data-sheet="group" aria-label="New group">${ic('Plus')}</button></div>
    ${today.map((g) => `<div class="tl-sec" style="${gv(g.lvl)}"><div class="tl-h">${groupTile(g)}<div><b>${groupLabel(g)}</b><span>${esc(g.time)}</span></div><button class="tp-iconbtn" data-push="register" data-g="${g.id}" aria-label="History and other lessons">${ic('History')}</button></div>${tapList(g, TODAY)}</div>`).join('') || `<div class="tp-empty2">${ic('Coffee')}<b>No lessons today</b></div>`}
    ${others.length ? `<div class="tp-sec"><h4>Other groups</h4></div><div class="tp-list">${others.map((g) => `<button class="tp-lrow" data-push="register" data-g="${g.id}">${groupTile(g)}<span class="tx"><b>${groupLabel(g)}</b><span>${g.days.map((d) => DAYS[d]).join(', ') || 'No days set'} · ${esc(g.time)}</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button>`).join('')}</div>` : ''}`;
}
function histGrid(g) {
  const ds = savedDates(g).slice(-8);
  if (!ds.length) return '';
  return `<div class="tp-card2"><div class="h">${ic('History')}Last ${ds.length} lesson${ds.length > 1 ? 's' : ''}</div><div class="hist" style="grid-template-columns:76px repeat(${ds.length},1fr)">${g.students.map((s) => `<span class="n">${esc(s.name)}</span>${ds.map((k) => { const r = rec(g, fromIso(k)); if (!(s.id in r.att)) return '<i class="na"></i>'; const a = r.get(s.id); return `<i class="${a}${a !== 'absent' && !r.hwOf(s.id) ? ' nohw' : ''}" title="${k}"></i>`; }).join('')}`).join('')}</div>
    <p class="sub">Green here · amber late · red absent · a dot inside = homework not done</p></div>`;
}
function scRegister(f) {
  const g = gById(f.g); if (!g) return scGone();
  if (!f.date) { const d = lastLesson(g); f.date = d ? iso(d) : null; }
  const bar = `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button><button class="tp-pill" data-sheet="group" data-g="${g.id}">${ic('Pencil')} Edit group</button></div>`;
  const head = `<div><div class="tp-eyebrow">${g.days.map((d) => DAYS[d]).join(', ') || 'No days set'} · ${esc(g.time)}</div><div class="tp-lt" style="font-size:28px">${groupLabel(g)}</div></div>`;
  const add = `<div class="tp-addrow"><input id="tp-newstu" placeholder="Add a student" aria-label="New student's name" autocomplete="off"><button data-addstu="${g.id}" aria-label="Add student">${ic('UserPlus')}</button></div>`;
  if (!f.date) return `${bar}<div class="tp-inner" style="${gv(g.lvl)}">${head}<div class="tp-empty2">${ic('CalendarDays')}<b>No lessons yet</b><span>First lesson: ${nextDayLabel(g)}.</span><button class="tp-pill" data-regtoday>${ic('ClipboardCheck')} Take the register today</button></div>${add}</div>`;
  const d = fromIso(f.date), prev = lessonDay(g, d, -1), nxt = lessonDay(g, d, 1);
  return `${bar}<div class="tp-inner" style="${gv(g.lvl)}">${head}
    <div class="rg-nav"><button class="tp-iconbtn" ${prev ? `data-lessonday="${iso(prev)}"` : 'disabled'} aria-label="Previous lesson">${ic('ChevronLeft')}</button>
      <div><b>${dayName(d)}</b><span>${rec(g, d).saved ? 'taken' : 'not taken yet'}</span></div>
      <button class="tp-iconbtn" ${nxt ? `data-lessonday="${iso(nxt)}"` : 'disabled'} aria-label="Next lesson">${ic('ChevronRight')}</button></div>
    ${tapList(g, d)}${f.date !== iso(TODAY) && !hasLesson(g, TODAY) && !(S.rec[g.id] || {})[iso(TODAY)] ? `<button class="tp-link center" data-regtoday>${ic('ClipboardCheck')} Extra lesson today? Take the register</button>` : ''}
    ${histGrid(g)}${add}</div>`;
}

/* ===================== Books: your PDFs, audio and links per level ===================== */
function bookMeta(f) {
  const n = f.replace(/\.pdf$/i, ''); let m;
  if (/Essential Grammar in Use/.test(n)) return { pub: 'CAMBRIDGE', t: 'Essential Grammar in Use', mk: 'G', sub: 'Murphy · red', c: ['#F0524F', '#B42318'] };
  if (/English Grammar in Use/.test(n)) return { pub: 'CAMBRIDGE', t: 'English Grammar in Use', mk: 'G', sub: 'Murphy · blue', c: ['#3B82F6', '#1D4ED8'] };
  if (/Advanced Grammar in Use/.test(n)) return { pub: 'CAMBRIDGE', t: 'Advanced Grammar in Use', mk: 'G+', sub: '3rd ed', c: ['#22C55E', '#15803D'] };
  if (/Advanced Grammar for Speaking/.test(n)) return { pub: 'IELTS', t: 'Grammar for Speaking', mk: '“ ”', sub: 'advanced', c: ['#FB923C', '#EA580C'] };
  if (/Vocabulary in Use Elementary/.test(n)) return { pub: 'CAMBRIDGE', t: 'Vocabulary in Use', mk: 'Aa', sub: 'Elementary', c: ['#EC4899', '#BE185D'] };
  if (/Pre-Int/.test(n)) return { pub: 'CAMBRIDGE', t: 'Vocabulary in Use', mk: 'Aa', sub: 'Pre-Int & Int', c: ['#14B8A6', '#0F766E'] };
  if (/Upper-Int/.test(n)) return { pub: 'CAMBRIDGE', t: 'Vocabulary in Use', mk: 'Aa', sub: 'Upper-Int', c: ['#38BDF8', '#0369A1'] };
  if (/Vocabulary in Use Advanced/.test(n)) return { pub: 'CAMBRIDGE', t: 'Vocabulary in Use', mk: 'Aa', sub: 'Advanced', c: ['#A78BFA', '#6D28D9'] };
  if ((m = n.match(/4000 Essential English Words (\d)/))) return { pub: 'COMPASS', t: '4000 Essential English Words', mk: m[1], sub: 'Paul Nation', c: [['#4ADE80', '#16A34A'], ['#FB923C', '#C2410C'], ['#60A5FA', '#1D4ED8'], ['#F472B6', '#BE185D'], ['#2DD4BF', '#0F766E']][+m[1] - 1] };
  if ((m = n.match(/Cambridge IELTS (\d+)/))) return { pub: 'CAMBRIDGE', t: 'IELTS Academic', mk: m[1], sub: '4 tests', c: ['#334155', '#0F172A'], acc: '#EF4444' };
  if (/IELTS Trainer/.test(n)) return { pub: 'CAMBRIDGE', t: 'IELTS Trainer 2', mk: '6', sub: 'practice tests', c: ['#2563EB', '#1E3A8A'] };
  if (/Official Cambridge Guide/.test(n)) return { pub: 'CAMBRIDGE', t: 'Official Guide to IELTS', mk: '✓', sub: 'all skills', c: ['#7C3AED', '#4C1D95'] };
  if (/Basic IELTS Listening/.test(n)) return { pub: 'IELTS', t: 'Basic IELTS Listening', mk: '♪', sub: 'listening', c: ['#06B6D4', '#0E7490'] };
  if (/collocations/i.test(n)) return { pub: 'IELTS', t: '1000 Collocations', mk: '1000', sub: 'collocations', c: ['#F59E0B', '#B45309'] };
  if (/Stories for Reproduction/.test(n)) return { pub: 'OXFORD', t: 'Stories for Reproduction', mk: '1', sub: 'elementary', c: ['#0EA5E9', '#075985'] };
  return { pub: 'BOOK', t: n, mk: '', sub: '', c: ['#64748B', '#334155'] };
}
const bookCover = (f) => { const b = bookMeta(f); return `<div class="bk" style="--c1:${b.c[0]};--c2:${b.c[1]}${b.acc ? ';--acc:' + b.acc : ''}"><span class="pub">${esc(b.pub)}</span><span class="ttl">${esc(b.t)}</span><span class="mk">${esc(b.mk)}</span><span class="sub">${esc(b.sub)}</span></div>`; };
const LINKS = { A1: [], A2: [["VOA Let's Learn English", 'https://learningenglish.voanews.com', 'video course for learners'], ['Easy Stories in English', 'https://easystoriesinenglish.com', 'stories + scripts']],
  B1: [["VOA Let's Learn English", 'https://learningenglish.voanews.com', 'video course for learners'], ['Fable Cottage', 'https://www.thefablecottage.com', 'stories with audio'], ['LearnEnglish Teens', 'https://learnenglishteens.britishcouncil.org', 'videos with tasks']],
  'B1+': [['BBC Learning English', 'https://www.bbc.co.uk/learningenglish', 'videos and 6 Minute English'], ['LearnEnglish Teens', 'https://learnenglishteens.britishcouncil.org', 'videos with tasks'], ['Fable Cottage', 'https://www.thefablecottage.com', 'stories with audio'], ['Easy Stories in English', 'https://easystoriesinenglish.com', 'stories + scripts']],
  B2: [['TED-Ed', 'https://ed.ted.com', 'short animated lessons'], ['BBC 6 Minute English', 'https://www.bbc.co.uk/learningenglish/english/features/6-minute-english', 'short talks on one topic'], ['Breaking News English', 'https://breakingnewsenglish.com', 'news at 7 levels']],
  I1: [['TED Talks', 'https://www.ted.com/talks', 'talks with transcripts']], I2: [['TED Talks', 'https://www.ted.com/talks', 'talks with transcripts']] };
const fmtSize = (b) => (b > 1e6 ? (b / 1e6).toFixed(b > 1e7 ? 0 : 1) + ' MB' : Math.max(1, Math.round(b / 1e3)) + ' KB');
function pgBooks() {
  const L = C.levels[T.bookLvl], files = C.bookFiles[T.bookLvl] || [], links = [...(LINKS[L.id] || []).map((a) => ({ name: a[0], url: a[1], note: a[2] })), ...(S.links[L.id] || [])], audio = S.audio[L.id] || [];
  const levelChips = C.levels.map((l, i) => `<button class="${i === T.bookLvl ? 'on' : ''}" style="${gv(l.id)}" data-booklvl="${i}">${esc(LVNAME(l.id))}</button>`).join('');
  const seg = [['books', 'Books', files.length, 'Library'], ['audio', 'Audio', audio.length, 'Headphones'], ['video', 'Videos', links.length, 'CirclePlay']];
  let body;
  if (T.bookSeg === 'books') body = `<div class="tp-shelf">${files.map((f) => { const have = S.files[f[0]];
      return `<button class="tp-book" data-book="${esc(f[0])}">${bookCover(f[0])}<span>${esc(bookMeta(f[0]).t)}</span><small>${esc(bookMeta(f[0]).sub)}${have ? ' · on this phone' : ' · tap to add'}</small></button>`; }).join('')}</div>
    <p class="tp-small">Add each PDF from your phone once (from Telegram, Drive or Downloads); it then opens from here, even offline.</p>`;
  else if (T.bookSeg === 'audio') body = (L.id === 'A1' ? `<div class="tp-note2">Beginners don't use recordings.</div>` : '') + audio.map((a) => `<div class="tp-media"><button class="mi play" style="background:#0FA37F" data-play="${a.id}" aria-label="Play ${esc(a.name)}">${ic('Play')}</button><span class="tx"><b>${esc(a.name)}</b><span>${fmtSize(a.size || 0)}</span></span><button class="tp-iconbtn" data-rmaudio="${a.id}" aria-label="Remove ${esc(a.name)}">${ic('X')}</button></div>`).join('') + `<button class="tp-dashed" data-sheet="media" data-kind="audio">${ic('Plus')} Add audio</button>`;
  else body = (L.id === 'A1' ? `<div class="tp-note2">Beginners don't use recordings. Videos start at Elementary.</div>` : '') + links.map((a, i) => `<div class="tp-media"><a class="mi" style="background:#FF5A5F" href="${esc(safeUrl(a.url))}" target="_blank" rel="noopener">${ic('CirclePlay')}</a><a class="tx" href="${esc(safeUrl(a.url))}" target="_blank" rel="noopener"><b>${esc(a.name)}</b><span>${esc(a.note || a.url)}</span></a>${a.id ? `<button class="tp-iconbtn" data-rmlink="${a.id}" aria-label="Remove ${esc(a.name)}">${ic('X')}</button>` : `<span class="tp-chev">${ic('ExternalLink')}</span>`}</div>`).join('') + `<button class="tp-dashed" data-sheet="media" data-kind="video">${ic('Plus')} Add a link</button>`;
  return `<div class="tp-hdr"><div><div class="tp-eyebrow">Your files and links</div><div class="tp-lt">Books</div></div></div>
    <div class="tp-segs" data-noswipe>${levelChips}</div>
    <div class="tp-seg2" data-noswipe>${seg.map((k) => `<button class="${T.bookSeg === k[0] ? 'on' : ''}" data-bookseg="${k[0]}">${ic(k[3])} ${k[1]} <em>${k[2]}</em></button>`).join('')}</div>${body}`;
}

/* ===================== sheets ===================== */
function sheetGroup(s) {
  const g = s.g ? gById(s.g) : null;
  if (!s.form) s.form = g ? { name: g.name, lvl: g.lvl, book: g.book || '', days: [...g.days], time: g.time, week: g.week, les: g.les, students: g.students.map((x) => ({ ...x })) }
    : { name: '', lvl: 'A1', book: '', days: [0, 2, 4], time: '15:00', week: 1, les: 1, students: [] };
  const F = s.form, L = F.lvl !== 'own' ? lv(F.lvl) : null;
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>${g ? 'Edit group' : 'New group'}</b><button class="tp-back strong" data-savegroup>Save</button></div>
    <label class="tp-f"><span>Group name</span><input id="f-name" value="${esc(F.name)}" placeholder="e.g. Group D" autocomplete="off"></label>
    <div class="tp-f"><span>Program</span><div class="tp-chips2">${[...C.levels.map((l) => l.id), 'own'].map((id) => `<button class="${F.lvl === id ? 'on' : ''}" style="${gv(id)}" data-f-lvl="${id}">${esc(LVNAME(id))}</button>`).join('')}</div></div>
    ${F.lvl === 'own' ? `<label class="tp-f"><span>Their book</span><input id="f-book" value="${esc(F.book)}" placeholder="e.g. Family and Friends 2" autocomplete="off"></label><div class="tp-note2">Own program: for groups like kids who start from letters. Each lesson has your notes.</div>`
      : planned(F.lvl) ? `<div class="tp-f"><span>They are on</span><div class="tp-2col"><select id="f-week">${L.units.map((u) => `<option value="${u.n}" ${u.n === +F.week ? 'selected' : ''}>${u.final ? 'Level test' : 'Week ' + u.n + ' · ' + esc(u.title)}</option>`).join('')}</select><select id="f-les">${[1, 2, 3].map((n) => `<option value="${n}" ${n === +F.les ? 'selected' : ''}>Lesson ${n}</option>`).join('')}</select></div></div>`
      : `<div class="tp-note2">This level is planned next. You can add the group now.</div>`}
    <div class="tp-f"><span>Days</span><div class="tp-chips2 days">${DAYS.map((d, i) => `<button class="${F.days.includes(i) ? 'on' : ''}" data-f-day="${i}">${d}</button>`).join('')}</div></div>
    <label class="tp-f"><span>Time</span><input id="f-time" type="time" value="${esc(F.time)}"></label>
    <div class="tp-f"><span>Students · ${F.students.length}</span><div class="tp-stulist">${F.students.map((x, i) => `<span>${esc(x.name)}<button data-f-rm="${i}" aria-label="Remove ${esc(x.name)}">${ic('X')}</button></span>`).join('')}</div>
      <div class="tp-addrow"><input id="f-stu" placeholder="Student's name" autocomplete="off" enterkeyhint="done"><button data-f-add aria-label="Add student">${ic('UserPlus')}</button></div></div>
    ${g ? `<button class="tp-danger" data-delgroup="${g.id}">Remove this group</button>` : ''}`;
}
function sheetLesson(s) {
  const ed = S.edits[s.key] || {};
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>Edit lesson</b><button class="tp-back strong" data-savelesson="${esc(s.key)}">Save</button></div>
    <label class="tp-f"><span>Your notes</span><textarea id="f-notes" rows="4" placeholder="e.g. Bring the animal cards">${esc(ed.notes || '')}</textarea></label>
    <label class="tp-f"><span>Video or audio link</span><input id="f-link" value="${esc(ed.link || '')}" placeholder="https://…" inputmode="url" autocomplete="off"></label>
    <label class="tp-f"><span>Extra homework</span><input id="f-hw" value="${esc(ed.hw || '')}" placeholder="e.g. Learn the words for a quiz" autocomplete="off"></label>`;
}
function sheetMedia(s) {
  const L = C.levels[T.bookLvl];
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>${s.kind === 'audio' ? 'Add audio' : 'Add a link'} · ${esc(LVNAME(L.id))}</b><button class="tp-back strong" data-savemedia="${s.kind}">Add</button></div>
    <label class="tp-f"><span>Name</span><input id="f-mname" placeholder="${s.kind === 'audio' ? 'e.g. 4000 Essential Words 3, Unit 1' : 'e.g. Fable Cottage: Goldilocks'}" autocomplete="off"></label>
    ${s.kind === 'audio' ? `<label class="tp-f"><span>File</span><input id="f-mfile" type="file" accept="audio/*"></label>` : `<label class="tp-f"><span>Link</span><input id="f-murl" placeholder="https://…" inputmode="url" autocomplete="off"></label>`}`;
}
function sheetBook(s) {
  const f = s.book, b = bookMeta(f), have = S.files[f];
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Close</button><b>${esc(b.t)}</b><span></span></div>
    <div class="bk-sheet">${bookCover(f)}<div><b>${esc(b.t)}</b><span>${esc(b.sub)}</span><span>${have ? `On this phone · ${fmtSize(have.size)}` : 'Not on this phone yet'}</span></div></div>
    ${have ? `<button class="tp-cta" data-openbook="${esc(f)}">${ic('BookOpen')} Open</button>` : ''}
    <label class="tp-cta ${have ? 'ghost' : ''} filepick">${ic('FileUp')} ${have ? 'Replace the PDF' : 'Add the PDF from this phone'}<input type="file" accept="application/pdf,.pdf" data-pickbook="${esc(f)}" hidden></label>
    <p class="tp-small">Look for “${esc(f)}” in Telegram, Drive or Downloads. It is kept inside the app, so it opens offline.</p>
    ${have ? `<button class="tp-danger" data-rmbook="${esc(f)}">Remove it from the app</button>` : ''}`;
}
function sheetSettings(s) {
  const n = S.groups.reduce((a, g) => a + g.students.length, 0);
  return `<div class="tp-sh-h"><span></span><b>Settings</b><button class="tp-back strong" data-closesheet>Done</button></div>
    <div class="tp-card2"><div class="h">${ic('ShieldCheck')}Your data</div><p>${S.groups.length} group${S.groups.length === 1 ? '' : 's'} · ${n} student${n === 1 ? '' : 's'}. Everything stays on this phone, with a second copy and automatic daily copies.</p></div>
    <button class="tp-lrow" data-backup>${ic('Download')}<span class="tx"><b>Save a backup file</b><span>Send it to yourself in Telegram or Drive</span></span></button>
    <label class="tp-lrow">${ic('Upload')}<span class="tx"><b>Restore from a backup file</b><span>Replaces what is in the app now (a copy is kept first)</span></span><input type="file" accept=".json,application/json,text/plain" data-restore hidden></label>
    <button class="tp-lrow" data-sheet="copies">${ic('History')}<span class="tx"><b>Automatic copies</b><span>One a day for two weeks, then one a month</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button>
    <p class="tp-small">${VERSION_LABEL} · the course: Beginner to Upper-Intermediate</p>`;
}
function sheetCopies(s) {
  if (!s.list) { copyList().then((l) => { if (T.sheet === s) { s.list = l; draw(true); } }).catch(() => { s.list = []; draw(true); }); }
  const list = s.list;
  return `<div class="tp-sh-h"><button class="tp-back" data-sheet="settings">${ic('ChevronLeft')} Back</button><b>Automatic copies</b><span></span></div>
    ${!list ? '<p class="tp-small">Loading…</p>' : !list.length ? `<div class="tp-empty2">${ic('History')}<b>No copies yet</b><span>The first one is made today once you have a group.</span></div>`
      : list.map((c) => `<button class="tp-lrow" data-usecopy="${esc(c.key)}">${ic('History')}<span class="tx"><b>${esc(new Date(c.at).toLocaleString('en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }))}</b><span>${c.groups} groups · ${c.students} students${c.why === 'before' ? ' · before ' + esc(c.note || 'a restore') : ''}</span></span></button>`).join('')}
    <p class="tp-small">Tap a copy to bring it back. What is in the app now is kept as a copy first.</p>`;
}
const PAGES = [pgHome, pgUnits, pgAtt, pgBooks];
const PUSH = { week: scWeek, lesson: scLesson, own: scOwn, register: scRegister };
const SHEETS = { group: sheetGroup, lesson: sheetLesson, media: sheetMedia, book: sheetBook, settings: sheetSettings, copies: sheetCopies };

/* ===================== drawing, back button, swipe, tab slide ===================== */
let root;
function draw(keep) {
  const scr = keep ? [...root.querySelectorAll('.tp-page')].map((p) => p.scrollTop) : null;
  const ps0 = keep && root.querySelector('.tp-push') ? root.querySelector('.tp-push').scrollTop : 0;
  const ss0 = keep && root.querySelector('.tp-sheet .panel') ? root.querySelector('.tp-sheet .panel').scrollTop : 0;
  const top = T.push[T.push.length - 1];
  let html;
  try {
    html = `<div class="tp-viewport"><div class="tp-track" style="transform:translateX(${-T.tab * 25}%)">${PAGES.map((p) => `<section class="tp-page">${p()}</section>`).join('')}</div></div>
    ${top ? `<div class="tp-push" style="${top.shown ? 'animation:none' : ''}">${PUSH[top.s](top)}</div>` : ''}
    <nav class="tp-tabs"><span class="tp-ind" style="transform:translateX(${T.tab * 100}%)"></span>${[['House', 'Home'], ['BookOpen', 'Units'], ['ClipboardCheck', 'Attendance'], ['Library', 'Books']].map((t, i) => `<button data-tab="${i}" class="${i === T.tab ? 'on' : ''}">${ic(t[0])}<span>${t[1]}</span></button>`).join('')}</nav>
    ${T.sheet ? `<div class="tp-sheet ${T.sheet.shown ? 'still' : ''}"><div class="scrim" data-closesheet></div><div class="panel">${SHEETS[T.sheet.s](T.sheet)}</div></div>` : ''}`;
  } catch (e) {
    console.error(e);
    html = `<div class="tp-inner"><div class="tp-empty2">${ic('TriangleAlert')}<b>Something went wrong on this screen</b><span>Your data is safe. ${esc(e.message)}</span><button class="tp-cta" data-reset-ui>Back to Home</button></div></div>`;
  }
  root.innerHTML = html;
  if (top) top.shown = true; if (T.sheet) T.sheet.shown = true;
  if (scr) root.querySelectorAll('.tp-page').forEach((p, i) => { p.scrollTop = scr[i]; });
  const ps = root.querySelector('.tp-push'), sp = root.querySelector('.tp-sheet .panel');
  if (ps0 && ps) ps.scrollTop = ps0; if (ss0 && sp) sp.scrollTop = ss0;
  root.querySelectorAll('.tp-segs').forEach((s) => { const on = s.querySelector('.on'); if (on && (on.offsetLeft + on.offsetWidth > s.clientWidth || on.offsetLeft < s.scrollLeft)) s.scrollLeft = on.offsetLeft - 16; });
  bindSwipe(); bindTabSlide();
}
// The phone's Back button closes the sheet or the screen on top, like in other apps.
function stepIn() { try { history.pushState({ tp: (history.state && history.state.tp || 0) + 1 }, ''); } catch (e) { /* fine without */ } }
function goBack() { if (history.state && history.state.tp) history.back(); else closeTop(); }
// Close everything at once (after removing a group or restoring data): step back exactly as far as we stepped in.
function unwind() { const d = (history.state && history.state.tp) || 0; if (d > 0) { try { history.go(-d); } catch (e) { /* ignore */ } } }
window.addEventListener('popstate', () => closeTop());
function closeTop() {
  if (T.sheet) { const sh = root.querySelector('.tp-sheet'); if (sh) sh.classList.add('out'); const was = T.sheet; setTimeout(() => { if (T.sheet === was) { T.sheet = null; draw(true); } }, 220); return; }
  if (T.push.length) { const p = root.querySelector('.tp-push'); if (p) p.classList.add('out'); setTimeout(() => { T.push.pop(); draw(true); }, 230); }
}
function openSheet(sh) { const replacing = !!T.sheet; T.sheet = sh; if (!replacing) stepIn(); draw(true); }
function closeSheetNow() { if (T.sheet) goBack(); }
function pushScreen(sc) { T.push.push(sc); stepIn(); draw(true); }
function goTab(i) {
  if (i === T.tab && !T.push.length) { root.querySelectorAll('.tp-page')[i].scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const hadPush = T.push.length; T.tab = i; T.push = [];
  if (hadPush) unwind();
  const tr = root.querySelector('.tp-track'); tr.classList.add('settle'); tr.style.transform = `translateX(${-i * 25}%)`;
  root.querySelector('.tp-ind').style.transform = `translateX(${i * 100}%)`;
  root.querySelectorAll('.tp-tabs button').forEach((b, k) => b.classList.toggle('on', k === i));
  const p = root.querySelector('.tp-push'); if (p) { p.classList.add('out'); setTimeout(() => draw(true), 240); }
}
function bindSwipe() {
  const vp = root.querySelector('.tp-viewport'), tr = root.querySelector('.tp-track'); if (!vp) return; let st = null;
  vp.onpointerdown = (e) => { if (e.button > 0 || e.target.closest('[data-noswipe],input,textarea,select')) return; st = { x0: e.clientX, y0: e.clientY, on: false, id: e.pointerId, pts: [] }; };
  vp.onpointermove = (e) => {
    if (!st || e.pointerId !== st.id) return; const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
    if (!st.on) { if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; if (Math.abs(dx) < Math.abs(dy) * 1.2) { st = null; return; } st.on = true; st.W = vp.offsetWidth; tr.classList.remove('settle'); try { vp.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } }
    st.pts.push([e.timeStamp, e.clientX]); if (st.pts.length > 6) st.pts.shift();
    st.dx = (T.tab === 0 && dx > 0) || (T.tab === 3 && dx < 0) ? dx / 3 : dx;
    tr.style.transform = `translateX(calc(${-T.tab * 25}% + ${st.dx}px))`; root.querySelector('.tp-ind').style.transform = `translateX(${(T.tab - st.dx / st.W) * 100}%)`;
  };
  const end = (e) => {
    if (!st || e.pointerId !== st.id) return; const s = st; st = null; if (!s.on) return;
    const a = s.pts[0], b = s.pts[s.pts.length - 1], v = a && b && b[0] > a[0] ? (b[1] - a[1]) / (b[0] - a[0]) : 0;
    let i = T.tab; if ((s.dx < -s.W * 0.3 || v < -0.3) && T.tab < 3) i++; else if ((s.dx > s.W * 0.3 || v > 0.3) && T.tab > 0) i--;
    vp._moved = Date.now(); if (i !== T.tab) return goTab(i);
    tr.classList.add('settle'); tr.style.transform = `translateX(${-T.tab * 25}%)`; root.querySelector('.tp-ind').style.transform = `translateX(${T.tab * 100}%)`;
  };
  vp.onpointerup = end; vp.onpointercancel = end;
}
function bindTabSlide() {
  const bar = root.querySelector('.tp-tabs'), ind = bar.querySelector('.tp-ind'); let st = null;
  bar.onpointerdown = (e) => { st = { x0: e.clientX, on: false, id: e.pointerId, over: T.tab }; };
  bar.onpointermove = (e) => {
    if (!st || e.pointerId !== st.id) return;
    if (!st.on) { if (Math.abs(e.clientX - st.x0) < 8) return; st.on = true; bar.classList.add('sliding'); try { bar.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } }
    const r = bar.getBoundingClientRect(), w = (r.width - 10) / 4, x = Math.max(0, Math.min(w * 3, e.clientX - r.left - 5 - w / 2));
    ind.style.transform = `translateX(${x}px) scale(1.06)`; st.over = Math.round(x / w); bar.querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === st.over));
  };
  bar.onpointerup = bar.onpointercancel = (e) => { if (!st || e.pointerId !== st.id) return; const s = st; st = null; bar.classList.remove('sliding'); if (s.on) { bar._slid = Date.now(); goTab(s.over); } };
}
let toastT = 0;
function toast(msg) {
  if (!root) return;
  let el = root.querySelector('.tp-toast'); if (!el) { el = document.createElement('div'); el.className = 'tp-toast'; root.appendChild(el); }
  el.textContent = msg; el.classList.remove('hide'); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  clearTimeout(toastT); toastT = setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 300); }, 2600);
}
const val = (id) => { const el = root.querySelector('#' + id); return el ? el.value.trim() : ''; };
function keepForm() {
  const F = T.sheet && T.sheet.form; if (!F) return;
  [['f-name', 'name'], ['f-book', 'book'], ['f-time', 'time']].forEach(([id, k]) => { if (root.querySelector('#' + id)) F[k] = val(id) || (k === 'time' ? F.time : ''); });
  if (root.querySelector('#f-week')) F.week = +val('f-week'); if (root.querySelector('#f-les')) F.les = +val('f-les');
}

// ---------- attendance taps: updated in place (no redraw), saved at once ----------
function tapCtx(b) { const grid = b.closest('.tl-grid'); return grid ? { g: gById(grid.dataset.g), d: fromIso(grid.dataset.date), grid } : null; }
function refreshRow(grid, g, d, sid) {
  const s = g.students.find((x) => x.id === sid), row = grid.querySelector(`.tl-st[data-sid="${sid}"]`); if (!s || !row) return;
  const tmp = document.createElement('div'); tmp.innerHTML = stuRow(g, d, s, rec(g, d)); row.replaceWith(tmp.firstElementChild);
  const btn = grid.parentElement.querySelector(`[data-saveday="${g.id}"]`); if (btn) btn.textContent = saveLabel(g, d);
}

function onClick(e) {
  const b = e.target.closest('button,a,label'); if (!b || !root.contains(b)) return;
  if (b.tagName === 'A' || b.tagName === 'LABEL') return;
  const vp = root.querySelector('.tp-viewport'), bar = root.querySelector('.tp-tabs');
  if ((vp && vp._moved && Date.now() - vp._moved < 350) || (bar && bar._slid && Date.now() - bar._slid < 350)) return;
  const d = b.dataset, top = T.push[T.push.length - 1];
  if (d.tab !== undefined) return goTab(+d.tab);
  if (d.pop !== undefined) return goBack();
  if (d.resetUi !== undefined) { T.push = []; T.sheet = null; T.tab = 0; return draw(); }
  if (d.push) return pushScreen({ s: d.push, lvl: d.lvl, w: +d.w, l: +d.l, g: d.g, date: d.date });
  if (d.unitlvl) { T.unitLvl = d.unitlvl; keepUi(); return draw(true); }
  if (d.booklvl) { T.bookLvl = +d.booklvl; keepUi(); return draw(true); }
  if (d.bookseg) { T.bookSeg = d.bookseg; return draw(true); }
  if (d.tap !== undefined) { const c = tapCtx(b); if (!c) return; const r = rec(c.g, c.d, true); r.att[d.tap] = NEXT[r.get(d.tap)]; save(); return refreshRow(c.grid, c.g, c.d, d.tap); }
  if (d.taphw !== undefined) { const c = tapCtx(b); if (!c) return; const r = rec(c.g, c.d, true); r.hw[d.taphw] = !r.hwOf(d.taphw); save(); return refreshRow(c.grid, c.g, c.d, d.taphw); }
  if (d.saveday) {
    const g = gById(d.saveday), dt = fromIso(d.date), r = rec(g, dt, true);
    g.students.forEach((s) => { if (!(s.id in r.att)) r.att[s.id] = 'here'; if (!(s.id in r.hw)) r.hw[s.id] = true; });
    (S.saved[g.id] = S.saved[g.id] || {})[d.date] = true; save();
    const here = g.students.filter((s) => r.get(s.id) !== 'absent').length, hw = g.students.filter((s) => r.get(s.id) !== 'absent' && r.hwOf(s.id)).length;
    draw(true); return toast(`Saved: ${here} of ${g.students.length} here, ${hw} did the homework`);
  }
  if (d.lessonday) { top.date = d.lessonday; return draw(true); }
  if (d.regtoday !== undefined) { top.date = iso(TODAY); return draw(true); }
  if (d.addstu) { const n = val('tp-newstu'); if (!n) return toast('Type the name first'); gById(d.addstu).students.push({ id: uid(), name: n }); save(); draw(true); return toast(n + ' added'); }
  if (d.taught) {
    const g = gById(d.taught), k = iso(TODAY), t = taughtOn(g, TODAY);
    if (t) { g.week = t.w; g.les = t.l; delete S.taught[g.id][k]; save(); draw(true); return toast('Undone'); }
    (S.taught[g.id] = S.taught[g.id] || {})[k] = { w: g.week, l: g.les }; const p = advance(g, 1); g.week = p.w; g.les = p.l; save(); draw(true);
    return toast(`Taught. ${g.name} moves to the next lesson.`);
  }
  if (d.owndone) { const g = gById(d.owndone), k = iso(TODAY), m = (S.ownDone[g.id] = S.ownDone[g.id] || {}); if (m[k]) delete m[k]; else m[k] = true; save(); draw(true); return toast(m[k] ? 'Taught' : 'Undone'); }
  if (d.book) return openSheet({ s: 'book', book: d.book });
  if (d.openbook) return openBook(d.openbook);
  if (d.rmbook) { if (!confirmTwice(b, 'Tap again to remove it')) return; const f = d.rmbook; delete S.files[f]; save(); delFile('pdf:' + f).catch(() => {}); closeSheetNow(); return toast('Removed from the app'); }
  if (d.play) return playAudio(b, d.play);
  if (d.rmaudio) { if (!confirmTwice(b, '')) return; const id = C.levels[T.bookLvl].id; S.audio[id] = (S.audio[id] || []).filter((a) => a.id !== d.rmaudio); save(); delFile('audio:' + d.rmaudio).catch(() => {}); draw(true); return toast('Removed'); }
  if (d.rmlink) { if (!confirmTwice(b, '')) return; const id = C.levels[T.bookLvl].id; S.links[id] = (S.links[id] || []).filter((a) => a.id !== d.rmlink); save(); draw(true); return toast('Removed'); }
  if (d.sheet) return openSheet({ s: d.sheet, g: d.g, key: d.key, kind: d.kind });
  if (d.closesheet !== undefined) return closeSheetNow();
  if (d.fLvl) { keepForm(); Object.assign(T.sheet.form, { lvl: d.fLvl, week: 1, les: 1 }); return draw(true); }
  if (d.fDay !== undefined) { keepForm(); const ds = T.sheet.form.days, k = +d.fDay; T.sheet.form.days = ds.includes(k) ? ds.filter((x) => x !== k) : [...ds, k].sort(); return draw(true); }
  if (d.fAdd !== undefined) { keepForm(); addFormStudent(); return; }
  if (d.fRm !== undefined) { keepForm(); T.sheet.form.students.splice(+d.fRm, 1); return draw(true); }
  if (d.savegroup !== undefined) return saveGroup();
  if (d.delgroup) {
    if (!confirmTwice(b, 'Tap again to remove the group')) return;
    S.groups = S.groups.filter((g) => g.id !== d.delgroup); save(); T.sheet = null; T.push = [];
    unwind(); draw(true); return toast('Group removed');
  }
  if (d.savelesson) { const v = { notes: val('f-notes'), link: val('f-link'), hw: val('f-hw') }; if (v.notes || v.link || v.hw) S.edits[d.savelesson] = v; else delete S.edits[d.savelesson]; save(); closeSheetNow(); return toast('Lesson saved'); }
  if (d.savemedia) return saveMedia(d.savemedia);
  if (d.backup !== undefined) return backup();
  if (d.usecopy) return useCopy(d.usecopy);
}
function confirmTwice(b, msg) {
  if (b._armed && Date.now() - b._armed < 3000) return true;
  b._armed = Date.now(); const old = b.innerHTML; if (msg) b.textContent = msg; else b.classList.add('armed');
  setTimeout(() => { if (b.isConnected) { b.innerHTML = old; b.classList.remove('armed'); } b._armed = 0; }, 3000);
  if (!msg) toast('Tap again to remove');
  return false;
}
function addFormStudent() {
  const n = val('f-stu'); if (!n) return;
  T.sheet.form.students.push({ id: uid(), name: n }); draw(true);
  const inp = root.querySelector('#f-stu'); if (inp) inp.focus();
}
function saveGroup() {
  keepForm(); const F = T.sheet.form; if (!F.name) return toast('Give the group a name');
  const pending = val('f-stu'); if (pending) F.students.push({ id: uid(), name: pending });
  const old = T.sheet.g && gById(T.sheet.g);
  const g = Object.assign(old || { id: uid(), created: Date.now(), gone: [] }, { name: F.name, lvl: F.lvl, book: F.lvl === 'own' ? F.book || 'Own book' : '', days: F.days, time: F.time || '15:00', week: +F.week || 1, les: +F.les || 1 });
  if (old) { const keep = new Set(F.students.map((s) => s.id)); g.gone = [...(g.gone || []), ...old.students.filter((s) => !keep.has(s.id))]; }
  g.students = F.students;
  if (planned(g.lvl)) { const p = advance(g, 0); g.week = p.w; g.les = p.l; }
  if (!old) S.groups.push(g);
  save(); closeSheetNow(); toast(old ? 'Group saved' : `${g.name} added`);
}
async function saveMedia(kind) {
  const n = val('f-mname'), id = C.levels[T.bookLvl].id;
  if (kind === 'audio') {
    const inp = root.querySelector('#f-mfile'), file = inp && inp.files[0];
    if (!file) return toast('Choose an audio file');
    const a = { id: uid(), name: n || file.name.replace(/\.[^.]+$/, ''), size: file.size };
    try { await putFile('audio:' + a.id, file); } catch (e) { return toast('Could not keep the file: not enough space?'); }
    (S.audio[id] = S.audio[id] || []).push(a); T.bookSeg = 'audio';
  } else {
    const u = val('f-murl'); if (!n || !u) return toast('Add a name and a link');
    (S.links[id] = S.links[id] || []).push({ id: uid(), name: n, url: u }); T.bookSeg = 'video';
  }
  save(); closeSheetNow(); toast('Added');
}
let player = null, playing = null;
async function playAudio(btn, id) {
  if (playing === id && player) { player.pause(); player = null; playing = null; btn.innerHTML = ic('Play'); return; }
  if (player) { player.pause(); root.querySelectorAll('[data-play]').forEach((x) => { x.innerHTML = ic('Play'); }); }
  const blob = await getFile('audio:' + id).catch(() => null); if (!blob) return toast('The file is missing; add it again');
  player = new Audio(URL.createObjectURL(blob)); playing = id; btn.innerHTML = ic('Pause');
  player.onended = () => { btn.innerHTML = ic('Play'); playing = null; };
  player.play().catch(() => toast('Could not play this file'));
}
async function openBook(f) {
  const blob = await getFile('pdf:' + f).catch(() => null); if (!blob) return toast('The PDF is missing; add it again');
  const file = new File([blob], f, { type: 'application/pdf' });
  const url = URL.createObjectURL(file), w = window.open(url, '_blank');
  if (!w && navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: f }); } catch (e) { /* closed */ } }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
async function pickBook(input) {
  const f = input.dataset.pickbook, file = input.files[0]; if (!file) return;
  if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) return toast('Choose a PDF file');
  toast('Adding…');
  try { await putFile('pdf:' + f, file); } catch (e) { return toast('Could not keep the PDF: not enough space?'); }
  S.files[f] = { size: file.size, at: Date.now() }; save(); draw(true); toast('Added to the app');
}
async function backup() {
  const blob = new Blob([JSON.stringify({ app: 'teacher', v: 1, at: new Date().toISOString(), data: S }, null, 1)], { type: 'application/json' });
  const name = `teacher-backup-${iso(new Date())}.json`, file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: name }); return toast('Backup ready'); } catch (e) { if (e && e.name === 'AbortError') return; } }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000); toast('Backup saved to Downloads');
}
async function restore(input) {
  const file = input.files[0]; if (!file) return;
  try {
    const j = JSON.parse(await file.text()), data = j && j.app === 'teacher' ? j.data : j && Array.isArray(j.groups) ? j : null;
    if (!data) return toast('This is not a Teacher backup file');
    await replaceAll(data, 'a restore'); T.push = []; T.sheet = null; unwind();
    draw(); toast('Backup restored');
  } catch (e) { toast('Could not read this file'); }
}
async function useCopy(key) {
  try { const json = await copyJson(key); if (!json) return toast('This copy is missing'); await replaceAll(JSON.parse(json), 'going back to a copy'); T.sheet = null; T.push = []; unwind(); draw(); toast('Copy restored'); }
  catch (e) { toast('Could not open this copy'); }
}
function onChange(e) {
  const t = e.target;
  if (t.dataset.pickbook) return pickBook(t);
  if (t.dataset.restore !== undefined) return restore(t);
}
function onKey(e) {
  if (e.key !== 'Enter') return;
  if (e.target.id === 'f-stu') { e.preventDefault(); keepForm(); addFormStudent(); }
  if (e.target.id === 'tp-newstu') { e.preventDefault(); const b = root.querySelector('[data-addstu]'); if (b) b.click(); }
}

// ---------- start ----------
async function start() {
  root = document.getElementById('tp');
  try { history.replaceState({ tp: 0 }, ''); } catch (e) { /* fine without */ } // a fresh start has nothing open
  const hadQuick = loadQuick();
  draw();
  root.addEventListener('click', onClick); root.addEventListener('change', onChange); root.addEventListener('keydown', onKey);
  const took = await startSecond(hadQuick); if (took) draw(true);
  makeCopy('day');
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* the browser decides */ }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    const now = midnight(new Date()); if (iso(now) !== iso(TODAY)) { TODAY = now; makeCopy('day'); draw(true); }
  });
}
window.addEventListener('error', (e) => { try { toast('Something went wrong: ' + (e.message || 'error')); } catch (_) { /* ignore */ } });
start();
