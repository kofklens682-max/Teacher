'use strict';
/* The teacher app: Home (group tiles) · Units (the course) · Attendance ("everyone is here, tap who isn't") · Books.
   Built from the model the user approved in the Teen Course Plan page. C = the course (data/course.js), S = your data (store.js). */

const VERSION_LABEL = 'Teacher 3.9';
const GRAD = { A1: ['#34C759', '#0FA37F'], A2: ['#32ADE6', '#147EFB'], B1: ['#5E7BFF', '#3D5AFE'], 'B1+': ['#8B6CFF', '#5B3DF5'], B2: ['#C46BF5', '#8E3BD9'], I1: ['#FF6B9A', '#E0457B'], I2: ['#FF8A4C', '#E5484D'], IT: ['#FF5A5F', '#C2185B'], K2: ['#FF9F0A', '#FF6B9A'], K3: ['#14B8A6', '#0F766E'], K4: ['#38BDF8', '#0369A1'], K5: ['#C46BF5', '#8E3BD9'], own: ['#F5B300', '#E8770E'] };
const TOPIC = ['#34C759', '#0FA37F', '#FF9F0A', '#FF6B9A', '#32ADE6', '#147EFB', '#5E7BFF', '#3D5AFE', '#FF8A4C', '#E5484D', '#8B6CFF', '#5B3DF5', '#14B8A6', '#0F766E', '#38BDF8', '#0369A1', '#F5B300', '#E8770E'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], DAYS_LONG = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const AVC = ['#FF6B9A', '#32ADE6', '#8B6CFF', '#34C759', '#FF8A4C', '#5E7BFF', '#C46BF5', '#0FA37F'];
const NEXT = { here: 'absent', absent: 'late', late: 'here' };

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const COLORS = { red: ['#FF6B6B', '#E5484D'], orange: ['#FFA24C', '#F26B1D'], yellow: ['#FFD23F', '#F5A300'], green: ['#4ADE80', '#16A34A'], teal: ['#2DD4BF', '#0F9D8F'], sky: ['#5CC8FF', '#147EFB'], blue: ['#6C8CFF', '#3D5AFE'], purple: ['#A78BFA', '#7B3FE4'], pink: ['#FF7AB6', '#E0457B'], slate: ['#94A3B8', '#475569'] };
const gv = (id) => `--g1:${(GRAD[id] || GRAD.own)[0]};--g2:${(GRAD[id] || GRAD.own)[1]}`;
const KIDLV = [...(typeof KIDS !== 'undefined' ? KIDS : []), ...(typeof KIDS3 !== 'undefined' ? KIDS3 : []), ...(typeof KIDS4 !== 'undefined' ? KIDS4 : []), ...(typeof KIDS5 !== 'undefined' ? KIDS5 : [])];
// Units shows the teen levels and then IELTS Turbo (js/turbo.js); Books keeps only the teen levels
const UNIT_LV = () => (typeof TURBO_LV !== 'undefined' ? [...C.levels, TURBO_LV] : C.levels);
const lvList = (tab) => (tab === 1 ? UNIT_LV() : C.levels);
const lv = (id) => UNIT_LV().find((l) => l.id === id) || KIDLV.find((l) => l.id === id);
const dayWord = (id) => (lv(id) && lv(id).kids ? 'Day' : 'Lesson');
const LVNAME = (id) => (id === 'own' ? 'Own program' : id === 'I1' ? 'IELTS 5.5-6.5' : id === 'I2' ? 'IELTS 7+' : lv(id) ? lv(id).name : id);
const planned = (id) => ['A1', 'A2', 'B1', 'B1+', 'B2', 'I1', 'I2', 'IT'].includes(id) || KIDLV.some((l) => l.id === id);
const avColor = (s) => AVC[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVC.length];
const gById = (id) => S.groups.find((g) => g.id === id);
const weekOf = (lid, n) => { const u = lv(lid).units; return u[Math.min(Math.max(1, Math.floor(+n) || 1), u.length) - 1]; }; // never past the level test

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
const gvg = (g) => (COLORS[g.color] ? `--g1:${COLORS[g.color][0]};--g2:${COLORS[g.color][1]}` : gv(g.lvl)); // a group's own colour, else its level's
const groupLabel = (g) => `${esc(LVNAME(g.lvl))} · ${esc(g.name)}`;
const unitTile = (u, i, big) => `<span class="tp-tile${big ? ' big' : ''}" style="--t1:${TOPIC[(i * 2) % TOPIC.length]};--t2:${TOPIC[(i * 2 + 1) % TOPIC.length]}">${ic(u.icon || 'BookOpen')}</span>`;
const groupTile = (g) => (COLORS[g.color] ? `<span class="tp-tile" style="--t1:${COLORS[g.color][0]};--t2:${COLORS[g.color][1]}">${ic(g.lvl === 'own' ? 'Shapes' : planned(g.lvl) ? weekOf(g.lvl, g.week).icon || 'BookOpen' : 'GraduationCap')}</span>` : g.lvl === 'own' ? `<span class="tp-tile" style="${gv('own')};--t1:var(--g1);--t2:var(--g2)">${ic('Shapes')}</span>`
  : planned(g.lvl) ? unitTile(weekOf(g.lvl, g.week), g.week - 1) : `<span class="tp-tile" style="--t1:${GRAD[g.lvl][0]};--t2:${GRAD[g.lvl][1]}">${ic('GraduationCap')}</span>`);
const openLessonAttr = (g) => (g.lvl === 'own' ? `data-push="own" data-g="${g.id}"` : planned(g.lvl) ? `data-push="lesson" data-lvl="${g.lvl}" data-w="${g.week}" data-l="${g.les}" data-g="${g.id}"` : `data-push="register" data-g="${g.id}"`);
function ring(p, size, w, c1, c2, label) {
  const r = (size - w) / 2, L = 2 * Math.PI * r, id = 'rg' + (c1 + c2).replace(/[^a-z0-9]/gi, ''); // the same for the same colours, so redrawing changes nothing
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
const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
const startMin = (g) => { const [h, m] = String(g.time || '15:00').split(':').map(Number); return h * 60 + (m || 0); };
const lessonOpen = (g, d) => iso(d) < iso(TODAY) || (iso(d) === iso(TODAY) && nowMin() >= startMin(g)); // the register opens when the lesson starts
const whenLabel = (g, d) => (iso(d) === iso(TODAY) ? 'today' : `${DAYS_LONG[wd(d)]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`) + ' at ' + g.time;
const notOpenToast = (g, d) => toast(`This lesson starts ${whenLabel(g, d)}. The register opens then.`);
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
    d = addDays(d, dir);
    const has = (S.rec[g.id] || {})[iso(d)];
    if (has) return d;
    if (d < born) { if (dir < 0) return null; continue; } // no lessons before the group was added
    if (hasLesson(g, d)) return d;
  }
  return null;
}
function lastLesson(g) { return hasLesson(g, TODAY) || (S.rec[g.id] || {})[iso(TODAY)] ? new Date(TODAY) : lessonDay(g, TODAY, -1) || lessonDay(g, TODAY, 1); } // else the first lesson coming

// ---------- UI state ----------
const T = { tab: 0, push: [], sheet: null, open: {}, unitLvl: 'A1', bookLvl: 0, bookSeg: 'books', aud: 'teens', kidLvl: KIDLV.length ? KIDLV[0].id : '', big: {} };
try { const u = JSON.parse(localStorage.getItem('teacher-ui') || '{}'); if (u.unitLvl && lv(u.unitLvl)) T.unitLvl = u.unitLvl; if (u.bookLvl >= 0 && u.bookLvl < C.levels.length) T.bookLvl = u.bookLvl; if (u.aud === 'kids' && KIDLV.length) T.aud = 'kids'; if (u.kidLvl && KIDLV.some((l) => l.id === u.kidLvl)) T.kidLvl = u.kidLvl; } catch (e) { /* defaults */ }
const keepUi = () => { try { localStorage.setItem('teacher-ui', JSON.stringify({ unitLvl: T.unitLvl, bookLvl: T.bookLvl, aud: T.aud, kidLvl: T.kidLvl })); } catch (e) { /* not needed */ } };


/* ===================== Profile (name and role on the Home screen; kept on this phone) ===================== */
const profileGet = () => { try { return JSON.parse(localStorage.getItem('teacher-profile') || '{}') || {}; } catch (e) { return {}; } };
const profileSet = (p) => { try { localStorage.setItem('teacher-profile', JSON.stringify(p)); } catch (e) { /* not needed */ } };
const lookGet = () => { try { return localStorage.getItem('teacher-look') === 'glass' ? 'glass' : 'normal'; } catch (e) { return 'normal'; } };
const lookApply = () => document.documentElement.classList.toggle('glass', lookGet() === 'glass');
lookApply();
const initials = (n) => String(n || '').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

/* ===================== Home: groups as tiles ===================== */
function pgHome() {
  const todayN = S.groups.filter((g) => hasLesson(g, TODAY)).length;
  const head = `<div class="tp-hdr"><div><div class="tp-eyebrow">${DAYS_LONG[wd(TODAY)]} ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]}${S.groups.length ? ` · ${todayN} lesson${todayN === 1 ? '' : 's'} today` : ''}</div><div class="tp-lt">My groups</div></div>
    <div class="hdr-btns"><button class="tp-avatar" data-sheet="settings" aria-label="Profile and settings">${initials(profileGet().name) || ic('UserRound')}</button><button class="tp-roundbtn" data-sheet="group" aria-label="New group">${ic('Plus')}</button></div></div>`;
  if (!S.groups.length) return head + `<div class="tp-empty2 welcome">${ic('Users')}<b>Add your first group</b><span>Choose its level, the days and time, and the students. The app then shows each group's next lesson and opens the register with everyone marked here.</span><button class="tp-cta" data-sheet="group">${ic('Plus')} New group</button></div>`;
  const tiles = [...S.groups].sort((a, b) => nextOffset(a) - nextOffset(b) || a.time.localeCompare(b.time)).map((g) => {
    const p = attPct(g), u = planned(g.lvl) ? weekOf(g.lvl, g.week) : null, done = taughtOn(g, TODAY) || (S.ownDone[g.id] || {})[iso(TODAY)];
    return `<div class="ht-tile" style="${gvg(g)}"><button class="ht-main" ${openLessonAttr(g)}>
      <div class="ht-top"><span class="ht-ico">${ic(u ? u.icon || 'BookOpen' : g.lvl === 'own' ? 'Shapes' : 'GraduationCap')}</span>${p === null ? '' : ring(p / 100, 40, 4, '#ffffff', '#ffffffcc', p + '%')}</div>
      <b>${esc(g.name)}</b><span class="lv">${esc(LVNAME(g.lvl))} · ${g.students.length} student${g.students.length === 1 ? '' : 's'}</span>
      <span class="nx">${done ? 'Taught today ✓' : `${nextDayLabel(g)} · ${esc(g.time)}`}</span>
      <span class="ls">${u ? `Week ${g.week} · ${dayWord(g.lvl)} ${g.les}: ${esc(u.lessons[g.les - 1].subtopic)}` : g.lvl === 'own' ? esc(g.book || 'Own book') : 'Plan coming'}</span></button>
      <button class="ht-reg" data-push="register" data-g="${g.id}">${ic('ClipboardCheck')} Register</button></div>`;
  }).join('');
  return head + `<div class="ht-grid">${tiles}<button class="ht-tile add" data-sheet="group">${ic('Plus')}<b>New group</b></button></div>`;
}

/* ===================== Units: level → weeks → lessons ===================== */
function pgUnits() {
  const kids = T.aud === 'kids' && KIDLV.length, L = lv(kids ? T.kidLvl : T.unitLvl), here = S.groups.filter((g) => g.lvl === L.id);
  const chips = kids ? KIDLV.map((l) => `<button class="${l.id === T.kidLvl ? 'on' : ''}" style="${gv(l.id)}" data-kidlvl="${l.id}">${esc(l.name)}</button>`).join('')
    : UNIT_LV().map((l) => `<button class="${l.id === T.unitLvl ? 'on' : ''}" style="${gv(l.id)}" data-unitlvl="${l.id}">${esc(LVNAME(l.id))}</button>`).join('');
  const aud = KIDLV.length ? `<div class="tp-seg2 slide" data-noswipe style="--n:2"><span class="seg-thumb" style="--i:${kids ? 1 : 0}"></span><button class="${kids ? '' : 'on'}" data-aud="teens">${ic('GraduationCap')} Teens</button><button class="${kids ? 'on' : ''}" data-aud="kids">${ic('Star')} Kids</button></div>` : '';
  const body = !planned(L.id) ? `<div class="tp-empty2">${ic('Hammer')}<b>${esc(LVNAME(L.id))} comes next</b><span>The course is planned one level at a time; the IELTS levels are next.</span></div>`
    : `<div class="tp-list">${L.units.map((u, i) => { const grp = here.filter((g) => g.week === u.n).map((g) => g.name);
      return `<button class="tp-wrow" data-push="week" data-lvl="${L.id}" data-w="${u.n}">${u.final ? `<span class="tp-tile" style="--t1:#F5B300;--t2:#E8770E">${ic('Trophy')}</span>` : unitTile(u, i)}
        <span class="tx"><span class="k">${u.final ? 'One lesson' : 'Week ' + u.n}${grp.length ? ` · <em>${esc(grp.join(', '))} ${grp.length > 1 ? 'are' : 'is'} here</em>` : ''}</span><b>${esc(kids ? u.lessons.map((l) => l.subtopic.split(' · ')[0]).join(' · ') : u.title)}</b><span>${kids ? u.lessons.map((l) => esc(l.subtopic.split(' · ')[1] || '')).filter(Boolean).join(' · ') : u.lessons.map((l) => esc(l.subtopic)).join(' · ')}</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button>`; }).join('')}</div>`;
  return `<div class="tp-hdr"><div><div class="tp-eyebrow">${kids ? 'Kids course' : 'Teen course'}</div><div class="tp-lt">Units</div></div></div>
    ${aud}<div class="tp-segs" data-noswipe>${chips}</div>
    <div class="lv-pane"${kids ? '' : ' data-lvpane'}><div class="tp-lvlcard" style="${gv(L.id)}"><div><div class="k">${esc(L.cefr)} · ${L.weeks} weeks</div><b>${esc(LVNAME(L.id))}</b><span>${planned(L.id) ? esc(L.focus) : 'Planned next'}</span></div>${here.length ? `<span class="n">${here.length}<small>group${here.length > 1 ? 's' : ''}</small></span>` : ''}</div>
    ${body}</div>`;
}
function scWeek(f) {
  const L = lv(f.lvl), u = weekOf(f.lvl, f.w), i = f.w - 1;
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Units</button></div>
    <div class="tp-inner" style="${gv(L.id)}">
      <div class="tp-whead">${u.final ? `<span class="tp-tile big" style="--t1:#F5B300;--t2:#E8770E">${ic('Trophy')}</span>` : unitTile(u, i, true)}<div><div class="tp-eyebrow">${esc(LVNAME(L.id))} · ${u.final ? 'One lesson' : 'Week ' + u.n}</div><div class="tp-lt" style="font-size:28px">${esc(u.title)}</div></div></div>
      <div class="tp-goal2">${ic('Target')}<div><small>${u.final ? 'When' : L.kids ? 'This week' : 'By the end of the week they can say'}</small>${u.final || L.kids ? esc(u.goal) : `“${esc(u.goal)}”`}</div></div>
      <div class="tp-list">${u.lessons.map((l) => `<button class="tp-lesrow2" data-push="lesson" data-lvl="${L.id}" data-w="${u.n}" data-l="${l.n}"><span class="num">${l.n}</span><span class="tx"><b>${esc(l.subtopic)}</b><span>${esc(l.skill || l.grammarTopic || l.grammar || (l.kd && l.kd.goal) || '')}</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button>`).join('')}</div>
      ${u.skill ? `<div class="tp-card2"><div class="h">${ic('MessageCircle')}Speaking</div><p>${esc(u.skill)}</p>${u.writing ? `<div class="h" style="margin-top:10px">${ic('PenLine')}Writing</div><p>${esc(u.writing)}</p>` : ''}${u.eew ? `<div class="h" style="margin-top:10px">${ic('BookA')}Word book</div><p>${esc(u.eew)}</p>` : ''}${u.reading ? `<div class="h" style="margin-top:10px">${ic('BookOpen')}Reader</div><p>${esc(u.reading)}</p>` : ''}${u.mock ? `<div class="h" style="margin-top:10px">${ic('ClipboardCheck')}Mock test</div><p>${esc(u.mock)}</p>` : ''}</div>` : ''}
    </div>`;
}
const chips = (arr, cls) => `<div class="tp-words${cls ? ' ' + cls : ''}">${arr.map((w) => `<span>${esc(w)}</span>`).join('')}</div>`;
function scLesson(f) {
  if (lv(f.lvl).kids) return scKids(f);
  const L = lv(f.lvl), u = weekOf(f.lvl, f.w), l = u.lessons[f.l - 1], key = `${L.id}-${u.n}-${l.n}`, ed = S.edits[key] || {};
  const g = f.g && gById(f.g), t = g && taughtOn(g, TODAY);
  const isTaught = t && t.w === f.w && t.l === f.l, isNext = g && g.week === f.w && g.les === f.l && !t;
  const hasPack = !!packHas(L, u, l);
  const books = l.vocabBook && !hasPack ? `<p class="sub" style="margin-top:8px">Practice: ${l.vocabBook.map((b) => esc(b.book + ', unit ' + b.unit + (b.title ? ' (' + b.title + ')' : ''))).join('; ')}</p>` : '';
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button><button class="tp-pill" data-sheet="lesson" data-key="${key}">${ic('Pencil')} Edit</button></div>
    <div class="tp-inner" style="${gv(L.id)}">
      <div class="tp-whead">${u.final ? `<span class="tp-tile big" style="--t1:#F5B300;--t2:#E8770E">${ic('Trophy')}</span>` : unitTile(u, f.w - 1, true)}<div><div class="tp-eyebrow">${g ? esc(g.name) + ' · ' : ''}${u.final ? '' : 'Week ' + u.n + ' · '}Lesson ${l.n} · ${esc(u.title)}</div><div class="tp-lt" style="font-size:26px">${esc(l.subtopic)}</div></div></div>
      ${ed.notes ? `<div class="tp-card2 note">${ic('StickyNote')}<p>${esc(ed.notes)}</p></div>` : ''}
      ${l.skill ? `<div class="tp-card2"><div class="h" style="color:#E5484D">${ic(/^Reading/.test(l.skill) ? 'BookOpenCheck' : /^Listening/.test(l.skill) ? 'Headphones' : 'PenLine')}Skill</div><p class="big">${esc(l.skill)}</p><p class="ex">${esc(l.how)}</p><p class="sub">Source: ${esc(l.source)}</p></div>` : ''}
      ${packBlock(L, u, l)}
      ${l.routine ? `<div class="tp-card2"><div class="h" style="color:#3D5AFE">${ic('Clock')}Lesson plan · ${l.routine.reduce((a, r) => a + r[0], 0)} min</div>${l.routine.map((r) => `<p class="rt-row"><b>${r[0]}′</b><span>${esc(r[1])}<small>${esc(r[2])}</small></span></p>`).join('')}<p class="sub">The minutes are a guide: every group moves at its own pace.</p></div>` : ''}
      ${l.real ? `<div class="tp-card2"><div class="h" style="color:#0FA37F">${ic('Globe')}Real English</div><p class="big">${esc(l.real)}</p><p class="sub">Main idea first, then 3 questions, then talk about it. The exam practice comes after.</p></div>` : ''}
      ${l.activity ? `<div class="tp-card2"><div class="h" style="color:#F5A000">${ic('PartyPopper')}Activity</div><p>${esc(l.activity)}</p></div>` : ''}
      ${l.exit ? `<div class="tp-card2"><div class="h" style="color:#E5484D">${ic('ListChecks')}Exit check · 3 min</div><p>${esc(l.exit)}</p></div>` : ''}
      ${l.grammarTopic || l.grammar ? `<div class="tp-card2"><div class="h" style="color:#7B61FF">${ic('Puzzle')}Grammar topic</div><p class="big">${esc(l.grammarTopic || l.grammar)}</p>${l.grammarTopic && l.grammar ? `<p class="ex">${esc(l.grammar)}</p>` : ''}${l.bgiu && l.bgiu.length && !hasPack ? `<p class="sub">${L.id === 'A1' ? "Teacher's reference" : 'Students practice in'}: ${esc(l.gbook || 'Basic Grammar in Use (American)')}, unit${l.bgiu.length > 1 ? 's' : ''} ${l.bgiu.join(', ')}</p>` : ''}${l.grammarExtra ? `<p class="sub">Also: ${esc(l.grammarExtra.book)}, unit${l.grammarExtra.units.length > 1 ? 's' : ''} ${l.grammarExtra.units.join(', ')}</p>` : ''}</div>` : ''}
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
      ${matsBlock(key)}
      <div class="tp-card2"><div class="h" style="color:#5C6378">${ic('ListChecks')}Homework</div>${[...(l.homework || []), ...(ed.hw ? [ed.hw] : [])].map((h) => `<p class="hw">${ic('Square')}${esc(h)}</p>`).join('') || '<p>None</p>'}</div>
      ${l.check ? `<div class="tp-card2 warn">${ic('ClipboardList')}<p><b>Check today:</b> ${esc(l.check)}</p></div>` : ''}
      ${g && (isTaught || isNext) ? `<button class="tp-cta ${isTaught ? 'done' : ''}" data-push="register" data-g="${g.id}">${ic('ClipboardCheck')}${isTaught ? 'Taught ✓ · see attendance' : 'Take attendance'}</button>
        <p class="tp-small">${isTaught ? `${esc(g.name)} is now on the next lesson.` : `Saving the attendance marks this lesson as taught and moves ${esc(g.name)} to the next one.`}</p>`
        : g ? `<p class="tp-small">${esc(g.name)} is on Week ${g.week} · Lesson ${g.les}.</p>` : ''}
    </div>`;
}
/* ===================== Kids: one day of the kids course (Family and Friends) ===================== */
function scKids(f) {
  const L = lv(f.lvl), u = weekOf(f.lvl, f.w), l = u.lessons[f.l - 1], k = l.kd, key = `${L.id}-${u.n}-${l.n}`, ed = S.edits[key] || {};
  const g = f.g && gById(f.g), t = g && taughtOn(g, TODAY), show = T.open['tr-' + key];
  const isTaught = t && t.w === f.w && t.l === f.l, isNext = g && g.week === f.w && g.les === f.l && !t;
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button><button class="tp-pill" data-sheet="lesson" data-key="${key}">${ic('Pencil')} Edit</button></div>
    <div class="tp-inner" style="${gv(L.id)}">
      <div class="tp-whead">${unitTile(u, f.w - 1, true)}<div><div class="tp-eyebrow">${g ? esc(g.name) + ' · ' : ''}Week ${u.n} · Day ${l.n}</div><div class="tp-lt" style="font-size:26px">${esc(k.label)}</div></div></div>
      ${ed.notes ? `<div class="tp-card2 note">${ic('StickyNote')}<p>${esc(ed.notes)}</p></div>` : ''}
      <div class="tp-goal2">${ic('Target')}<div><small>By the end they can say</small>“${esc(k.goal)}”</div></div>
      <div class="tp-card2">${k.cb.length ? `<div class="h" style="color:#147EFB">${ic('BookOpen')}Class Book today</div>${chips(k.cb.map(([p, x]) => `p. ${p} · ${x}`))}<div class="h" style="color:#5C6378;margin-top:10px">${ic('ListChecks')}Homework</div>` : `<div class="h" style="color:#5C6378">${ic('ListChecks')}Homework</div>`}<p class="hw">${ic('Square')}${esc(k.wb)}</p>${ed.hw ? `<p class="hw">${ic('Square')}${esc(ed.hw)}</p>` : ''}</div>
      ${k.murphy && k.murphy.length ? `<div class="tp-card2"><div class="h" style="color:#E5484D">${ic('BookOpen')}Murphy red · Essential Grammar in Use</div>${k.murphy.map((m) => `<div class="mu-row"><b>${m.u ? 'Unit ' + m.u + ' · ' : ''}${esc(m.title)}</b><span>${esc(m.pages)}</span>${m.cls ? `<p><em>In class:</em> ${esc(m.cls)}</p>` : ''}${m.hw ? `<p><em>Homework:</em> ${esc(m.hw)}</p>` : ''}</div>`).join('')}${k.note ? `<p class="sub">${esc(k.note)}</p>` : ''}<p class="sub">American English: skip “have got” and “shall”; say vacation, movie theater, store, Mom.</p></div>` : ''}
      ${packBlock(L, u, l)}
      ${k.rule ? `<div class="tp-card2"><div class="h" style="color:#7B61FF">${ic('Puzzle')}The rule · ${esc(k.rule.title)}</div>${k.rule.lines.map((x) => `<p>${esc(x)}</p>`).join('')}<p class="sub"><b>Signal words:</b> ${esc(k.rule.signal)}</p><p class="sub"><b>Russian and English:</b> ${esc(k.rule.ru)}</p><div class="h" style="color:#E5484D;margin-top:8px">${ic('TriangleAlert')}We often say</div>${k.rule.oops.map((x) => `<p><s>${esc(x.split(' → ')[0])}</s> → <b>${esc(x.split(' → ')[1] || '')}</b></p>`).join('')}</div>` : ''}
      ${k.big && k.big.length ? `<button class="tp-cta" data-push="big" data-lvl="${L.id}" data-w="${u.n}" data-l="${l.n}">${ic('Play')} Big screen · ${k.big.length} slides</button>` : ''}
      ${k.rwords && k.rwords.length ? `<div class="tp-card2"><div class="h" style="color:#147EFB">${ic('BookA')}Reading words</div>${chips(k.rwords)}${k.retell && k.retell.length ? `<div class="h" style="color:#0FA37F;margin-top:10px">${ic('MessageCircle')}Retell with</div>${chips(k.retell)}` : ''}</div>` : ''}
      ${(k.story || []).map((st) => `<div class="tp-card2 story"><div class="h" style="color:#C46BF5">${ic('BookOpen')}Story · ${esc(st.title)}</div><img class="st-pic" src="media/k/${st.pic}.jpg" alt="">${st.paras.map((p) => `<p class="st-p">${esc(p)}</p>`).join('')}<div class="h" style="color:#147EFB;margin-top:10px">${ic('BookA')}New words</div>${st.words.map((w) => `<p class="rt-row"><b>${esc(w[0])}</b><span>${esc(w[2])}<small>${esc(w[1] ? '[' + w[1] + '] ' : '')}${esc(w[3])}</small></span></p>`).join('')}${st.phrases.length ? `<div class="h" style="color:#0FA37F;margin-top:10px">${ic('Link')}Useful phrases</div>${st.phrases.map((p) => `<p><b>${esc(p[0])}</b> — ${esc(p[1])}</p>`).join('')}` : ''}<div class="h" style="color:#E8770E;margin-top:10px">${ic('MessageCircle')}Retell with</div>${chips(st.retell)}</div>`).join('')}
      <div class="tp-card2"><div class="h" style="color:#3D5AFE">${ic('ListChecks')}What we do today</div>${k.steps.map((s, i) => `<p class="rt-row"><b>${i + 1}</b><span>${esc(s)}</span></p>`).join('')}</div>
      ${k.copy.length ? `<div class="tp-card2"><div class="h" style="color:#0FA37F">${ic('PenLine')}Copybook words</div>${chips(k.copy)}</div>` : ''}
      ${k.us.length ? `<div class="tp-card2"><div class="h" style="color:#E8770E">${ic('Globe')}The book says → we say</div>${k.us.map(([a, b]) => `<p><s>${esc(a)}</s> → <b>${esc(b)}</b></p>`).join('')}</div>` : ''}
      ${k.tr.length ? `<div class="tp-card2"><div class="h" style="color:#E5484D">${ic('MessageCircle')}Translation check</div>${[...k.tr, ...k.ch].map(([ru, en], i) => `<p class="rt-row"><b>${i + 1}</b><span>${i >= k.tr.length ? '★ ' : ''}${esc(ru)}${show ? `<small>${esc(en)}</small>` : ''}</span></p>`).join('')}<button class="tp-pill" data-kshow="${key}">${show ? 'Hide answers' : 'Show answers'}</button></div>` : ''}
      ${matsBlock(key)}
      ${g && (isTaught || isNext) ? `<button class="tp-cta ${isTaught ? 'done' : ''}" data-push="register" data-g="${g.id}">${ic('ClipboardCheck')}${isTaught ? 'Taught ✓ · see attendance' : 'Take attendance'}</button>
        <p class="tp-small">${isTaught ? `${esc(g.name)} is now on the next day.` : `Saving the attendance marks this day as taught and moves ${esc(g.name)} to the next one.`}</p>`
        : g ? `<p class="tp-small">${esc(g.name)} is on Week ${g.week} · Day ${g.les}.</p>` : ''}
    </div>`;
}
/* ===================== Big screen: grammar games for the TV (one slide at a time) ===================== */
function bigKey(f) { return `${f.lvl}-${f.w}-${f.l}`; }
function scBig(f) {
  const L = lv(f.lvl), u = weekOf(f.lvl, f.w), l = u.lessons[f.l - 1], k = l.kd, S = k.big || [], key = bigKey(f);
  const st = T.big[key] || (T.big[key] = { i: 0, sel: -1, shown: false });
  const n = S.length; st.n = n; st.i = Math.max(0, Math.min(st.i, n - 1));
  const s = S[st.i] || [], pick = st.sel >= 0;
  const show = (ans, big) => (st.shown ? `<div class="bg-a${big ? ' big' : ''}">${esc(ans)}</div>` : `<button class="bg-show" data-bgshow="${key}">Show the answer</button>`);
  let body = '';
  if (s[0] === 'c') body = `<div class="bg-q">${esc(s[1])}</div><div class="bg-opts">${s[2].map((o, j) => `<button class="bg-opt${pick && j === s[3] ? ' ok' : pick && st.sel === j ? ' no' : ''}" data-bgpick="${key}|${j}">${esc(o)}</button>`).join('')}</div>${pick ? `<div class="bg-a ${st.sel === s[3] ? '' : 'bad'}">${st.sel === s[3] ? 'Yes! ' : 'Not this one. '}${esc(s[4])}</div>` : ''}`;
  else if (s[0] === 'r') body = `<div class="bg-q">${esc(s[1])}</div>${show(s[2], true)}`;
  else if (s[0] === 'p') body = `<img class="bg-img" src="media/k/${s[1]}.jpg" alt=""><div class="bg-q">${esc(s[2])}</div>${show(s[3], true)}`;
  else if (s[0] === 'v') body = `<div class="bg-two"><img src="media/k/${s[1]}.jpg" alt=""><img src="media/k/${s[2]}.jpg" alt=""></div><div class="bg-q">Compare them: <b>${esc(s[3])}</b></div>${show(s[4], true)}`;
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button><span class="bg-count">${st.i + 1} / ${n}</span></div>
    <div class="tp-inner bg-wrap" style="${gv(L.id)}"><div class="bg-bar"><span style="width:${Math.round(((st.i + 1) / n) * 100)}%"></span></div><div class="bg-card">${body}</div>
      <div class="bg-nav"><button data-bgnav="${key}|-1" ${st.i === 0 ? 'disabled' : ''}>${ic('ChevronLeft')} Back</button><button class="next" data-bgnav="${key}|1" ${st.i >= n - 1 ? 'disabled' : ''}>Next ${ic('ChevronRight')}</button></div></div>`;
}
function bigMove(key, dl) { const st = T.big[key]; if (!st) return; const i = Math.max(0, Math.min(st.n - 1, st.i + dl)); if (i === st.i) return; st.i = i; st.sel = -1; st.shown = false; draw(); }
function scOwn(f) {
  const g = gById(f.g); if (!g) return scGone();
  const key = 'own-' + g.id, ed = S.edits[key] || {}, done = (S.ownDone[g.id] || {})[iso(TODAY)], n = Object.keys(S.ownDone[g.id] || {}).length;
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button><button class="tp-pill" data-sheet="lesson" data-key="${key}">${ic('Pencil')} Edit</button></div>
    <div class="tp-inner" style="${gv('own')}">
      <div class="tp-whead">${groupTile(g)}<div><div class="tp-eyebrow">${esc(g.book || 'Own book')} · ${esc(g.time)}</div><div class="tp-lt" style="font-size:26px">${esc(g.name)}</div></div></div>
      <div class="tp-card2 note">${ic('StickyNote')}<p>${ed.notes ? esc(ed.notes) : 'Own program: this group has its own book. Tap Edit to write your plan.'}</p></div>
      ${ed.hw ? `<div class="tp-card2"><div class="h" style="color:#5C6378">${ic('ListChecks')}Homework</div><p class="hw">${ic('Square')}${esc(ed.hw)}</p></div>` : ''}
      ${matsBlock(key)}
      <p class="tp-small">${n} lesson${n === 1 ? '' : 's'} taught so far</p>
      <button class="tp-cta ${done ? 'done' : ''}" data-push="register" data-g="${g.id}">${ic('ClipboardCheck')}${done ? 'Taught ✓ · see attendance' : 'Take attendance'}</button>
      <p class="tp-small">Saving the attendance marks the day as taught.</p>
    </div>`;
}
// Your own files for one lesson (worksheets, pictures, slides, recordings): kept on this phone, listed in S.mats[key]
const matIc = (t) => (/^image\//.test(t) ? ['Palette', '#7B61FF'] : /pdf/.test(t) ? ['BookOpen', '#E5484D'] : /^audio\//.test(t) ? ['Headphones', '#0FA37F'] : /^video\//.test(t) ? ['CirclePlay', '#FF5A5F'] : ['FileDown', '#147EFB']);
const matsBlock = (key) => {
  const xs = S.mats[key] || [];
  return `${xs.length ? `<div class="tp-card2 tp-mats"><div class="h" style="color:#147EFB">${ic('FileUp')}My files</div>${xs.map((a) => { const [i, c] = matIc(a.type || ''); return `<div class="tp-media"><button class="mi" style="background:${c}" data-openmat="${a.id}" aria-label="Open ${esc(a.name)}">${ic(i)}</button><button class="tx" data-openmat="${a.id}"><b>${esc(a.name)}</b><span>${fmtSize(a.size || 0)}</span></button><button class="tp-iconbtn" data-rmmat="${a.id}" data-key="${key}" aria-label="Remove ${esc(a.name)}">${ic('X')}</button></div>`; }).join('')}` : ''}
    <label class="tp-dashed filepick${xs.length ? ' in' : ''}">${ic('Plus')} ${xs.length ? 'Add another file' : 'Add my own file'}<input type="file" multiple data-pickmat="${key}" hidden></label>${xs.length ? '</div>' : ''}`;
};
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
  const r = rec(g, d), open = lessonOpen(g, d);
  return `<div class="tl-lockable${open ? '' : ' locked'}" data-lock="${g.id}" data-dates="${iso(d)}" data-open="${open ? 1 : 0}"><p class="lock-note">${ic('Clock')} The register opens ${whenLabel(g, d)}</p>
    <div class="tl-grid" data-g="${g.id}" data-date="${iso(d)}">${g.students.map((s) => stuRow(g, d, s, r)).join('')}</div>
    <p class="jr-key">Tap a name: once = absent, twice = late, three times = here again. The book = homework done or not.</p>
    <button class="tp-cta save-day ${r.saved ? 'done' : ''}" data-saveday="${g.id}" data-date="${iso(d)}">${saveLabel(g, d)}</button></div>`;
}
function nextLessonText(g) { const n = lessonDay(g, TODAY, 1); return n ? ` · next ${DAYS[wd(n)]} ${n.getDate()} ${MONTHS[n.getMonth()].slice(0, 3)}` : ''; }
function pgAtt() {
  const today = S.groups.filter((g) => hasLesson(g, TODAY)).sort((a, b) => a.time.localeCompare(b.time)), others = S.groups.filter((g) => !hasLesson(g, TODAY));
  if (!S.groups.length) return `<div class="tp-hdr"><div><div class="tp-eyebrow">Today · ${DAYS_LONG[wd(TODAY)]} ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]}</div><div class="tp-lt">Attendance</div></div></div><div class="tp-empty2">${ic('ClipboardCheck')}<b>No groups yet</b><span>Add a group on Home; its register appears here on its lesson days.</span></div>`;
  return `<div class="tp-hdr"><div><div class="tp-eyebrow">Today · ${DAYS_LONG[wd(TODAY)]} ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]}</div><div class="tp-lt">Attendance</div></div><button class="tp-roundbtn" data-sheet="group" aria-label="New group">${ic('Plus')}</button></div>
    ${today.map((g) => { const r = rec(g, TODAY), n = g.students.length, open = !!T.open[g.id];
      return `<div class="tl-sec${open ? ' open' : ''}" data-gsec="${g.id}" style="${gvg(g)}"><div class="tl-h"><button class="tl-hb" data-opengrp="${g.id}" aria-expanded="${open}">${groupTile(g)}<span class="tx"><b>${groupLabel(g)}</b><span>${esc(g.time)} · ${n} student${n === 1 ? '' : 's'}${r.saved ? ' · taken ✓' : lessonOpen(g, TODAY) ? '' : ' · opens ' + esc(g.time)}</span></span><span class="tl-chev">${ic('ChevronDown')}</span></button><button class="tp-iconbtn" data-push="group" data-g="${g.id}" aria-label="Students, table and fees">${ic('Users')}</button></div><div class="tl-body"><div class="tl-in">${tapList(g, TODAY)}</div></div></div>`; }).join('') || `<div class="tp-empty2">${ic('Coffee')}<b>No lessons today</b></div>`}
    ${others.length ? `<div class="tp-sec"><h4>Other groups</h4></div><div class="tp-list">${others.map((g) => `<button class="tp-lrow" data-push="group" data-g="${g.id}">${groupTile(g)}<span class="tx"><b>${groupLabel(g)}</b><span>${g.days.map((d) => DAYS[d]).join(', ') || 'No days set'} · ${esc(g.time)}${nextLessonText(g)}</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button>`).join('')}</div>` : ''}`;
}
const GSYM = { here: '✓', late: 'L', absent: '✕' };
function tableDates(g) { // the last lessons taken, then the lessons still to come (today included)
  const past = savedDates(g).filter((k) => k < iso(TODAY)).slice(-3), now = [];
  for (let i = 0; i < 60 && now.length < 5; i++) { const d = addDays(TODAY, i); if (hasLesson(g, d) || (i === 0 && (S.rec[g.id] || {})[iso(d)])) now.push(iso(d)); }
  return [...new Set([...past, ...now])].sort();
}
const gridPct = (g, ds, sid) => { let n = 0, h = 0; ds.forEach((k) => { const r = rec(g, fromIso(k)); if (!(sid in r.att)) return; n++; if (r.get(sid) !== 'absent') h++; }); return n ? Math.round((h / n) * 100) : null; };
function histGrid(g, cur) { // the register as a table: names down, lesson dates across; tap a square to change it
  const ds = tableDates(g);
  if (!ds.length) return '';
  const cols = `grid-template-columns:96px 46px repeat(${ds.length},46px)`, open = ds.map((k) => (lessonOpen(g, fromIso(k)) ? 1 : 0)).join('');
  return `<div class="tp-card2"><div class="h">${ic('Table2')}Attendance table · ${g.students.length} student${g.students.length === 1 ? '' : 's'}</div><div class="gt-wrap" data-gtwrap data-cur="${cur}"><div class="gt" data-g="${g.id}" data-lock="${g.id}" data-dates="${ds.join(',')}" data-open="${open}" style="${cols}">
    <span class="gt-h gt-n"></span><span class="gt-h gt-p"><small>Here</small></span>${ds.map((k) => { const d = fromIso(k); return `<button class="gt-h gt-d${k === iso(TODAY) ? ' today' : ''}${k === cur ? ' cur' : ''}" data-lessonday="${k}"><small>${DAYS[wd(d)]}</small><b>${d.getDate()}</b><small>${MONTHS[d.getMonth()].slice(0, 3)}</small></button>`; }).join('')}
    ${g.students.map((s, si) => { const pc = gridPct(g, ds, s.id); return `<span class="gt-n" title="${esc(s.name)}"><i>${si + 1}</i>${esc(s.name)}</span><b class="gt-p" data-gpct="${s.id}">${pc === null ? '' : pc + '%'}</b>${ds.map((k) => { const r = rec(g, fromIso(k)), o = lessonOpen(g, fromIso(k)); if (!(s.id in r.att)) return `<button class="gc na${o ? '' : ' soon'}" data-gcell="${s.id}" data-gdate="${k}" aria-label="${esc(s.name)} ${k}"></button>`; const a = r.get(s.id); return `<button class="gc ${a}${a !== 'absent' && !r.hwOf(s.id) ? ' nohw' : ''}" data-gcell="${s.id}" data-gdate="${k}" aria-label="${esc(s.name)} ${k} ${a}">${GSYM[a]}</button>`; }).join('')}`; }).join('')}
  </div></div><p class="sub">✓ here · L late · ✕ absent · a dot = homework not done. Tap a square to change it. A lesson that hasn't started yet stays closed. Tap a date to open that lesson.</p></div>`;
}
function scRegister(f) {
  const g = gById(f.g); if (!g) return scGone();
  if (!f.date) { const d = lastLesson(g); f.date = d ? iso(d) : null; }
  const bar = `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button><button class="tp-pill" data-sheet="group" data-g="${g.id}">${ic('Pencil')} Edit group</button></div>`;
  const head = `<div><div class="tp-eyebrow">${g.days.map((d) => DAYS[d]).join(', ') || 'No days set'} · ${esc(g.time)}</div><div class="tp-lt" style="font-size:28px">${groupLabel(g)}</div></div>`;
  const add = `<div class="tp-addrow"><input id="tp-newstu" placeholder="Add a student" aria-label="New student's name" autocomplete="off"><button data-addstu="${g.id}" aria-label="Add student">${ic('UserPlus')}</button></div>`;
  if (!f.date) return `${bar}<div class="tp-inner" style="${gvg(g)}">${head}<div class="tp-empty2">${ic('CalendarDays')}<b>No lessons yet</b><span>First lesson: ${nextDayLabel(g)}.</span></div>${add}</div>`;
  const d = fromIso(f.date), prev = lessonDay(g, d, -1), nxt = lessonDay(g, d, 1);
  return `${bar}<div class="tp-inner" style="${gvg(g)}">${head}
    <div class="rg-nav"><button class="tp-iconbtn" ${prev ? `data-lessonday="${iso(prev)}"` : 'disabled'} aria-label="Previous lesson">${ic('ChevronLeft')}</button>
      <div><b>${dayName(d)}</b><span>${rec(g, d).saved ? 'taken' : lessonOpen(g, d) ? 'not taken yet' : 'coming up · ' + esc(g.time)}</span></div>
      <button class="tp-iconbtn" ${nxt ? `data-lessonday="${iso(nxt)}"` : 'disabled'} aria-label="Next lesson">${ic('ChevronRight')}</button></div>
    ${hasLesson(g, d) ? '' : `<div class="tp-card2 warn">${ic('CalendarX2')}<p><b>${DAYS_LONG[wd(d)]} is not a lesson day for this group.</b> Lessons are on ${g.days.map((x) => DAYS[x]).join(', ') || 'no days'}.</p><button class="tp-pill" data-rmreg="${iso(d)}" data-g="${g.id}">${ic('Trash2')} Remove this register</button></div>`}${tapList(g, d)}
    ${histGrid(g, f.date)}${add}</div>`;
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
    <div class="tp-seg2 slide" data-noswipe style="--n:${seg.length}"><span class="seg-thumb" style="--i:${seg.findIndex((k) => k[0] === T.bookSeg)}"></span>${seg.map((k) => `<button class="${T.bookSeg === k[0] ? 'on' : ''}" data-bookseg="${k[0]}">${ic(k[3])} ${k[1]} <em>${k[2]}</em></button>`).join('')}</div><div class="bk-body" data-lvpane>${body}</div>`; // one block below the switch, so the switch itself is kept
}

/* ===================== sheets ===================== */
function sheetGroup(s) {
  const g = s.g ? gById(s.g) : null;
  const pl = g && S.pay.plan[g.id];
  if (!s.form) s.form = g ? { name: g.name, lvl: g.lvl, book: g.book || '', days: [...g.days], time: g.time, color: g.color || '', week: g.week, les: g.les, students: g.students.map((x) => ({ ...x })), feeKind: pl ? pl.kind : 'group', fee: pl ? (pl.kind === 'single' ? pl.rate : pl.fee) : '' }
    : { name: '', lvl: 'A1', book: '', days: [0, 2, 4], time: '15:00', color: '', week: 1, les: 1, students: [], feeKind: 'group', fee: '' };
  const F = s.form, L = F.lvl !== 'own' ? lv(F.lvl) : null;
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>${g ? 'Edit group' : 'New group'}</b><button class="tp-back strong" data-savegroup>Save</button></div>
    <label class="tp-f"><span>Group name</span><input id="f-name" value="${esc(F.name)}" placeholder="e.g. Group D" autocomplete="off"></label>
    <div class="tp-f"><span>Program</span><div class="tp-chips2">${[...C.levels.map((l) => l.id), ...KIDLV.map((l) => l.id), ...(F.lvl === 'own' ? ['own'] : [])].map((id) => `<button class="${F.lvl === id ? 'on' : ''}" style="${gv(id)}" data-f-lvl="${id}">${esc(LVNAME(id))}</button>`).join('')}</div></div>
    <div class="tp-f"><span>Colour</span><div class="tp-swatches" id="f-colors"><button class="auto${F.color ? '' : ' on'}" data-f-color="" aria-label="Automatic colour">A</button>${Object.entries(COLORS).map(([k, c]) => `<button class="${F.color === k ? 'on' : ''}" style="--g1:${c[0]};--g2:${c[1]}" data-f-color="${k}" aria-label="${k}"></button>`).join('')}</div></div>
    <div class="f-prog">${F.lvl === 'own' ? `<label class="tp-f"><span>Their book</span><input id="f-book" value="${esc(F.book)}" placeholder="e.g. Family and Friends 2" autocomplete="off"></label><div class="tp-note2">Own program: for groups like kids who start from letters. Each lesson has your notes.</div>`
      : planned(F.lvl) ? `<div class="tp-f"><span>They are on</span><div class="tp-2col"><select id="f-week">${L.units.map((u) => `<option value="${u.n}" ${u.n === +F.week ? 'selected' : ''}>${u.final ? 'Level test' : 'Week ' + u.n + ' · ' + esc(u.title)}</option>`).join('')}</select><select id="f-les">${[1, 2, 3].map((n) => `<option value="${n}" ${n === +F.les ? 'selected' : ''}>${dayWord(F.lvl)} ${n}</option>`).join('')}</select></div></div>`
      : `<div class="tp-note2">This level is planned next. You can add the group now.</div>`}</div>
    <div class="tp-f"><span>Days</span><div class="tp-chips2 days">${DAYS.map((d, i) => `<button class="${F.days.includes(i) ? 'on' : ''}" data-f-day="${i}">${d}</button>`).join('')}</div></div>
    <label class="tp-f"><span>Time</span><input id="f-time" type="time" value="${esc(F.time)}"></label>
    <div class="tp-f"><span>Students · ${F.students.length}</span><div class="tp-stulist">${F.students.map((x, i) => `<span>${esc(x.name)}<button data-f-rm="${i}" aria-label="Remove ${esc(x.name)}">${ic('X')}</button></span>`).join('')}</div>
      <div class="tp-addrow"><input id="f-stu" placeholder="Student's name" autocomplete="off" enterkeyhint="done"><button data-f-add aria-label="Add student">${ic('UserPlus')}</button></div></div>
    ${feeForm(F)}
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
  const P = profileGet();
  return `<div class="tp-sh-h"><span></span><b>Profile and settings</b><button class="tp-back strong" data-closesheet>Done</button></div>
    <div class="tp-prof"><span class="tp-avatar big">${initials(P.name) || ic('UserRound')}</span><div><b>${esc(P.name || 'Your name')}</b><span>${esc(P.role || 'Teacher')}</span></div></div>
    <label class="tp-f"><span>Your name</span><input id="f-pname" value="${esc(P.name || '')}" placeholder="e.g. Aziz Karimov" autocomplete="off" data-profile></label>
    <label class="tp-f"><span>Your role</span><input id="f-prole" value="${esc(P.role || '')}" placeholder="e.g. English teacher" autocomplete="off" data-profile></label>
    <div class="tp-f"><span>Look</span><div class="tp-seg2 slide" id="look-seg" style="--n:2"><span class="seg-thumb" style="--i:${lookGet() === 'glass' ? 1 : 0}"></span><button class="${lookGet() === 'normal' ? 'on' : ''}" data-look="normal">Normal</button><button class="${lookGet() === 'glass' ? 'on' : ''}" data-look="glass">Glass</button></div></div>
    <div class="tp-card2"><div class="h">${ic('ShieldCheck')}Your data</div><p>${S.groups.length} group${S.groups.length === 1 ? '' : 's'} · ${n} student${n === 1 ? '' : 's'}. Everything stays on this phone, with a second copy and automatic daily copies.</p></div>
    <button class="tp-lrow" data-backup>${ic('Download')}<span class="tx"><b>Save a backup file</b><span>Send it to yourself in Telegram or Drive</span></span></button>
    <label class="tp-lrow">${ic('Upload')}<span class="tx"><b>Restore from a backup file</b><span>Replaces what is in the app now (a copy is kept first)</span></span><input type="file" accept=".json,application/json,text/plain" data-restore hidden></label>
    <button class="tp-lrow" data-sheet="copies">${ic('History')}<span class="tx"><b>Automatic copies</b><span>One a day for two weeks, then one a month</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button>
    <p class="tp-small">${VERSION_LABEL} · the course: Beginner to IELTS 7+</p>`;
}
function sheetCopies(s) {
  if (!s.list) { copyList().then((l) => { if (T.sheet === s) { s.list = l; draw(); } }).catch(() => { s.list = []; draw(); }); }
  const list = s.list;
  return `<div class="tp-sh-h"><button class="tp-back" data-sheet="settings">${ic('ChevronLeft')} Back</button><b>Automatic copies</b><span></span></div>
    ${!list ? '<p class="tp-small">Loading…</p>' : !list.length ? `<div class="tp-empty2">${ic('History')}<b>No copies yet</b><span>The first one is made today once you have a group.</span></div>`
      : list.map((c) => `<button class="tp-lrow" data-usecopy="${esc(c.key)}">${ic('History')}<span class="tx"><b>${esc(new Date(c.at).toLocaleString('en-GB', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }))}</b><span>${c.groups} groups · ${c.students} students${c.why === 'before' ? ' · before ' + esc(c.note || 'a restore') : ''}</span></span></button>`).join('')}
    <p class="tp-small">Tap a copy to bring it back. What is in the app now is kept as a copy first.</p>`;
}
const PAGES = [() => pgHomeNew(), pgUnits, pgAtt, pgBooks];
const PUSH = { group: (f) => scGroup(f), pay: (f) => scPay(f), week: (f) => (f.lvl === 'IT' ? turboWeek(f) : scWeek(f)), lesson: (f) => (f.lvl === 'IT' ? turboLesson(f) : scLesson(f)), own: scOwn, register: scRegister, big: scBig };
const SHEETS = { owegrp: (s) => sheetOweGrp(s), paypick: (s) => sheetPayPick(s), extra: (s) => sheetExtra(s), extradet: (s) => sheetExtraDet(s), xpay: (s) => sheetXPay(s), homecfg: (s) => sheetHomeCfg(s), payrec: (s) => sheetPayRec(s), gdisc: (s) => sheetGDisc(s), group: sheetGroup, lesson: sheetLesson, media: sheetMedia, book: sheetBook, settings: sheetSettings, copies: sheetCopies };

/* ===================== drawing, back button, swipe, tab slide =====================
   The app is drawn into a fixed frame (4 pages, a screen on top, the tab bar, a sheet). draw() rebuilds only the parts
   whose content changed, so nothing that stayed the same jumps, loses its scroll or restarts an animation:
   - a page or screen keeps its scroll; a chip strip keeps its sideways scroll and glides the chosen chip into view;
   - a new screen slides in over the old one; going back slides it away and shows the one below as it was;
   - a sheet slides up, follows the finger when pulled down (from anywhere, when its content is at the top), and closes
     with a pull, a flick, a tap outside, Cancel or the phone's Back button. */
let root, R = null;
const TABS = [['House', 'Home'], ['BookOpen', 'Units'], ['ClipboardCheck', 'Attendance'], ['Library', 'Books']];
function frame() {
  root.innerHTML = `<div class="tp-viewport"><div class="tp-track">${PAGES.map(() => '<section class="tp-page"></section>').join('')}</div></div>
    <div class="tp-screens"></div>
    <nav class="tp-tabs"><span class="tp-ind"></span>${TABS.map((t, i) => `<button data-tab="${i}">${ic(t[0])}<span>${t[1]}</span></button>`).join('')}</nav>
    <div class="tp-sheets"></div>`;
  R = { vp: root.querySelector('.tp-viewport'), track: root.querySelector('.tp-track'), pages: [...root.querySelectorAll('.tp-page')],
    screens: root.querySelector('.tp-screens'), tabs: root.querySelector('.tp-tabs'), ind: root.querySelector('.tp-ind'), sheets: root.querySelector('.tp-sheets'),
    screen: null, sheet: null, anim: -1 };
  bindSwipe(); bindTabSlide(); bindSegSlide();
}
// Chip strips: remember their sideways scroll across a redraw, then glide the chosen chip into view if it is hidden.
function stripsOf(el) { return [...el.querySelectorAll('.tp-segs')].map((s) => s.scrollLeft); }
function restoreStrips(el, xs) {
  el.querySelectorAll('.tp-segs').forEach((s, i) => {
    if (xs[i] !== undefined) s.scrollLeft = xs[i];
    const on = s.querySelector('.on'); if (!on) return;
    const a = s.getBoundingClientRect(), b = on.getBoundingClientRect();
    if (b.left < a.left + 8 || b.right > a.right - 8) s.scrollTo({ left: s.scrollLeft + (b.left - a.left) - (a.width - b.width) / 2, behavior: xs[i] === undefined ? 'auto' : 'smooth' });
  });
}
// Put new content into el, changing as little as possible: blocks that stayed the same are kept as they are, changed
// blocks are replaced (with a soft fade-in when swap is set), and chip strips / switches keep their element and only
// move the highlight, so it glides and the strip keeps its scroll.
const STRIPS = ['tp-segs', 'tp-seg2', 'tp-chips2'];
function sameStrip(o, n) {
  const k = STRIPS.find((c) => o.classList.contains(c)); if (!k || !n.classList.contains(k)) return false;
  const a = o.children, b = n.children; if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i].tagName !== b[i].tagName || a[i].dataset.unitlvl !== b[i].dataset.unitlvl || a[i].dataset.booklvl !== b[i].dataset.booklvl || a[i].dataset.bookseg !== b[i].dataset.bookseg || a[i].dataset.kidlvl !== b[i].dataset.kidlvl || a[i].dataset.aud !== b[i].dataset.aud) return false;
  return true;
}
function syncStrip(o, n) {
  [...n.children].forEach((b, i) => { const x = o.children[i]; if (x.className !== b.className) x.className = b.className; if (x.innerHTML !== b.innerHTML) x.innerHTML = b.innerHTML; if ((x.getAttribute('style') || '') !== (b.getAttribute('style') || '')) x.setAttribute('style', b.getAttribute('style') || ''); });
  if ((o.getAttribute('style') || '') !== (n.getAttribute('style') || '')) o.setAttribute('style', n.getAttribute('style') || '');
}
function setHTML(el, html, swap) {
  if (el._html === html) return false;
  const xs = stripsOf(el), tpl = document.createElement('template'); tpl.innerHTML = html;
  const neu = [...tpl.content.children], old = [...el.children];
  const textOnTop = [...tpl.content.childNodes].some((x) => x.nodeType === 3 && x.textContent.trim());
  if (el._html !== undefined && !textOnTop && neu.length === old.length && neu.every((x, i) => x.tagName === old[i].tagName)) {
    neu.forEach((x, i) => {
      const o = old[i];
      if (o.outerHTML === x.outerHTML) return;
      if (sameStrip(o, x)) { syncStrip(o, x); return; }
      o.replaceWith(x);
      if (swap) x.classList.add('swapin-el');
    });
  } else {
    el.replaceChildren(tpl.content);
    if (swap && el._html !== undefined) { el.classList.remove('swapin'); void el.offsetWidth; el.classList.add('swapin'); }
  }
  el._html = html;
  restoreStrips(el, xs);
  return true;
}
function safe(fn, arg) {
  try { return fn(arg); } catch (e) {
    console.error(e);
    return `<div class="tp-inner"><div class="tp-empty2">${ic('TriangleAlert')}<b>Something went wrong on this screen</b><span>Your data is safe. ${esc(e.message)}</span><button class="tp-cta" data-reset-ui>Back to Home</button></div></div>`;
  }
}
function fixTables() { // each attendance table opens scrolled to the lesson being looked at
  root.querySelectorAll('[data-gtwrap]').forEach((w) => {
    if (w._cur === w.dataset.cur) return; w._cur = w.dataset.cur;
    const h = w.querySelector('.gt-d.cur'); if (h) w.scrollLeft = Math.max(0, h.offsetLeft - 96 - 46 - 8);
  });
}
function checkLocks() { // a register opens by itself when its lesson starts
  let stale = false;
  root.querySelectorAll('[data-lock]').forEach((el) => {
    const g = gById(el.dataset.lock); if (!g) return;
    const sig = el.dataset.dates.split(',').map((k) => (lessonOpen(g, fromIso(k)) ? 1 : 0)).join('');
    if (sig !== el.dataset.open) stale = true;
  });
  if (stale) draw();
}
function draw() {
  if (!R) frame();
  R.drawnAt = performance.now();
  PAGES.forEach((p, i) => setHTML(R.pages[i], safe(p), R.anim === i));
  R.anim = -1;
  syncScreen(); syncSheet(); syncTabs(); fixTables();
  if ((T.tab === 1 || T.tab === 3) && !R.lvEnd) lvIdle(T.tab);
}
// ---------- screens on top (week, lesson, register…), kept as a stack like on an iPhone ----------
// Each open screen keeps its element: going back slides the top one away and the one below glides back, exactly as
// it was (same scroll), instead of being drawn again. Only the top screen is updated when something changes.
function syncScreen() {
  const want = T.push, stack = R.stack || (R.stack = []);
  let k = 0; while (k < want.length && k < stack.length && stack[k]._sc === want[k]) k++;
  const gone = stack.splice(k), adding = want.length - k;
  gone.forEach((el, n) => { el._sc._scroll = el.scrollTop; if (n === gone.length - 1 && !adding) slideAway(el); else el.remove(); });
  for (let n = k; n < want.length; n++) {
    const el = document.createElement('div'), slide = n === want.length - 1 && !gone.length;
    el.className = 'tp-push' + (slide ? ' prep' : '');
    el._sc = want[n];
    R.screens.appendChild(el);
    setHTML(el, safe(PUSH[want[n].s], want[n]));
    if (want[n]._scroll) el.scrollTop = want[n]._scroll;
    stack.push(el);
    if (slide) { void el.offsetHeight; afterPaint(() => el.classList.remove('prep')); } // drawn first, then it slides in whole
  }
  const top = stack[stack.length - 1];
  const set = (el, below) => { if (el.classList.contains('under') !== below) el.classList.toggle('under', below); if (el.inert !== below) el.inert = below; };
  stack.forEach((el) => set(el, el !== top));
  // the pages under a screen: only shifted and hidden from screen readers. Not inert: that restyles every page and
  // was the slowest part of opening and closing a screen; the screen covers them, so no tap can reach them anyway.
  const under = stack.length > 0;
  if (R.vp.classList.contains('under') !== under) { R.vp.classList.toggle('under', under); R.vp.toggleAttribute('aria-hidden', under); }
  R.screen = top || null;
  if (top && !adding) { setHTML(top, safe(PUSH[top._sc.s], top._sc), top._swap); top._swap = false; }
}
function slideAway(el) {
  el.inert = true; el.classList.remove('under'); el.classList.add('gone');
  setTimeout(() => el.remove(), 420);
}
// ---------- the sheet ----------
function syncSheet() {
  const cur = R.sheet, sh = T.sheet;
  if (cur && sh && cur._sh === sh) { setHTML(cur._panel, safe(SHEETS[sh.s], sh)); return; }
  if (cur && sh) { // another sheet in the same place (Settings → Automatic copies): a soft cross-fade
    cur._sh = sh; setHTML(cur._panel, safe(SHEETS[sh.s], sh), true); cur._panel.scrollTop = 0; return;
  }
  if (cur && !sh) { R.sheet = null; closeAnim(cur); return; }
  if (!sh) return;
  const el = document.createElement('div');
  el.className = 'tp-sheet';
  el.innerHTML = '<div class="scrim"></div><div class="panel" role="dialog" aria-modal="true"></div>';
  el._sh = sh; el._panel = el.querySelector('.panel'); el._scrim = el.querySelector('.scrim');
  setHTML(el._panel, safe(SHEETS[sh.s], sh));
  R.sheets.appendChild(el); R.sheet = el;
  bindSheetDrag(el);
  void el._panel.offsetHeight; afterPaint(() => el.classList.add('show')); // drawn below the screen first, then it slides up
}
// Run fn once the browser has drawn the new element (two frames), or after 120 ms if frames are paused.
function afterPaint(fn) { let done = false; const go = () => { if (!done) { done = true; fn(); } }; requestAnimationFrame(() => requestAnimationFrame(go)); setTimeout(go, 120); }
function closeAnim(el) {
  if (document.activeElement && el.contains(document.activeElement)) document.activeElement.blur();
  el.classList.remove('dragging'); el.classList.add('closing');
  el._panel.style.transform = ''; el._scrim.style.opacity = '';
  el.classList.remove('show');
  setTimeout(() => el.remove(), 420);
}
// Pull the sheet down to close it — from ANYWHERE inside it (fields, chips, the student list…). If its content is
// scrolled down, the same pull first scrolls it back to the top and then carries the sheet down (like iOS). A short
// quick flick is enough; a plain tap never closes it (it types, chooses, presses as usual).
function bindSheetDrag(el) {
  const p = el._panel, s = el._scrim; let st = null;
  const move = (y) => {
    const now = performance.now(); st.v = (y - st.last) / Math.max(1, now - st.lt); st.last = y; st.lt = now;
    st.dy = Math.max(0, y - st.y0);
    p.style.transform = `translateY(${st.dy}px)`;
    s.style.opacity = String(Math.max(0.1, 1 - st.dy / (p.offsetHeight || 600)));
  };
  // Closing by pulling down only counts when the finger LANDED on a sheet that was already at the top (or on its top bar), and not while
  // you are typing. Scrolling back up to reach Save can then never turn into "close the sheet" halfway through the same swipe.
  const start = (x, y, t) => {
    const ae = document.activeElement, typing = !!(ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && p.contains(ae));
    st = { x0: x, y0: y, mode: null, dy: 0, last: y, lt: performance.now(), v: 0, top0: p.scrollTop, head: !!(t && t.closest && t.closest('.tp-sh-h')), typing };
  };
  const follow = (x, y, e) => {
    if (!st) return;
    if (st.mode === null) {
      const ddx = x - st.x0, ddy = y - st.y0;
      if (Math.abs(ddx) < 6 && Math.abs(ddy) < 6) return;
      st.mode = Math.abs(ddx) > Math.abs(ddy) ? 'none' : 'wait'; // sideways moves belong to chips and fields
    }
    if (st.mode === 'none') return;
    if (st.mode === 'wait') {
      if (((st.top0 <= 0 && !st.typing) || st.head) && p.scrollTop <= 0 && y > st.last) { st.mode = 'drag'; st.y0 = st.last; el.classList.add('dragging'); if (document.activeElement && p.contains(document.activeElement)) document.activeElement.blur(); }
      else { st.last = y; st.lt = performance.now(); return; } // the content scrolls back up first
    }
    if (e && e.cancelable) e.preventDefault();
    move(y);
  };
  const release = () => {
    if (!st) return; const k = st; st = null;
    if (k.mode !== 'drag') return;
    el._dragged = Date.now(); el.classList.remove('dragging');
    if (k.dy > Math.min(110, p.offsetHeight * 0.2) || (k.v > 0.35 && k.dy > 16)) closeSheetNow();
    else { p.style.transform = ''; s.style.opacity = ''; }
  };
  p.addEventListener('touchstart', (e) => start(e.touches[0].clientX, e.touches[0].clientY, e.target), { passive: true });
  p.addEventListener('touchmove', (e) => follow(e.touches[0].clientX, e.touches[0].clientY, e), { passive: false });
  p.addEventListener('touchend', release); p.addEventListener('touchcancel', release);
  p.addEventListener('pointerdown', (e) => { // a mouse can pull the top bar
    if (e.pointerType !== 'mouse' || !e.target.closest('.tp-sh-h') || e.target.closest('button')) return;
    start(e.clientX, e.clientY, e.target);
    const mv = (ev) => follow(ev.clientX, ev.clientY, ev), up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); release(); };
    window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
  });
  s.addEventListener('click', () => closeSheetNow()); // a tap outside the sheet closes it
}
// A switch with a gliding highlight (Books | Audio | Videos): tap an option, or press and slide along it — the
// highlight follows the finger and the option under it is chosen when the finger lifts (like iOS).
function bindSegSlide() {
  let st = null;
  root.addEventListener('pointerdown', (e) => {
    const sw = e.target.closest('.tp-seg2.slide'); if (!sw) return;
    const btns = [...sw.querySelectorAll('button')], th = sw.querySelector('.seg-thumb');
    st = { sw, btns, th, x0: e.clientX, id: e.pointerId, on: false, i: btns.findIndex((b) => b.classList.contains('on')) };
  });
  root.addEventListener('pointermove', (e) => {
    if (!st || e.pointerId !== st.id) return;
    if (!st.on) { if (Math.abs(e.clientX - st.x0) < 6) return; st.on = true; st.sw.classList.add('sliding'); try { st.sw.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } }
    const r = st.sw.getBoundingClientRect(), w = (r.width - 6) / st.btns.length, x = Math.max(0, Math.min(w * (st.btns.length - 1), e.clientX - r.left - 3 - w / 2));
    st.th.style.transform = `translateX(${x}px)`; st.i = Math.round(x / w);
    st.btns.forEach((b, k) => b.classList.toggle('on', k === st.i));
  });
  const up = (e) => {
    if (!st || e.pointerId !== st.id) return; const k = st; st = null;
    if (!k.on) return;
    k.sw.classList.remove('sliding'); k.th.style.transform = ''; k.sw._slid = Date.now();
    const seg = k.btns[k.i].dataset.bookseg, au = k.btns[k.i].dataset.aud;
    if (au) { if (au !== T.aud) { T.aud = au; keepUi(); } return draw(); }
    if (seg && seg !== T.bookSeg) { T.bookSeg = seg; R.anim = 3; draw(); } else draw();
  };
  root.addEventListener('pointerup', up); root.addEventListener('pointercancel', up);
}
// ---------- the tab bar and the pages' position ----------
function syncTabs() {
  if (!R.sliding) {
    R.track.style.transform = `translateX(${-T.tab * 25}%)`;
    R.ind.style.transform = `translateX(${T.tab * 100}%)`;
  }
  R.tabs.querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === T.tab));
}
// The phone's Back button closes the sheet or the screen on top, like in other apps.
function stepIn() { try { history.pushState({ tp: ((history.state && history.state.tp) || 0) + 1 }, ''); } catch (e) { /* fine without */ } }
// Cancel / ← Back close at once; the history then steps back quietly (its popstate is skipped).
function goBack() { if (!closeTop()) return; if (history.state && history.state.tp) { R.skipPop = (R.skipPop || 0) + 1; history.back(); } }
// Close everything at once (after removing a group or restoring data): step back exactly as far as we stepped in.
function unwind() { const d = (history.state && history.state.tp) || 0; if (d > 0) { R.skipPop = (R.skipPop || 0) + 1; try { history.go(-d); } catch (e) { R.skipPop--; } } }
window.addEventListener('popstate', () => { if (R && R.skipPop > 0) { R.skipPop--; return; } closeTop(); }); // the phone's Back button
function closeTop() {
  if (T.sheet) { T.sheet = null; draw(); return true; }
  if (T.push.length) { T.push.pop(); draw(); return true; }
  return false;
}
function openSheet(sh) { const replacing = !!T.sheet; T.sheet = sh; if (!replacing) stepIn(); draw(); }
function closeSheetNow() { if (T.sheet) goBack(); }
function pushScreen(sc) { T.push.push(sc); stepIn(); draw(); }
function goTab(i) {
  if (i === T.tab && !T.push.length) { R.pages[i].scrollTo({ top: 0, behavior: 'smooth' }); return; }
  const hadPush = T.push.length; T.tab = i; T.push = [];
  if (hadPush) unwind();
  R.track.classList.add('settle');
  draw();
}
function bindSwipe() {
  const vp = R.vp, tr = R.track; let st = null;
  vp.addEventListener('pointerdown', (e) => { if (e.button > 0 || e.target.closest('[data-noswipe],input,textarea,select')) return; st = { x0: e.clientX, y0: e.clientY, on: false, id: e.pointerId, pts: [] }; });
  vp.addEventListener('pointermove', (e) => {
    if (!st || e.pointerId !== st.id) return; const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
    if (!st.on) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return; if (Math.abs(dx) < Math.abs(dy) * 1.2) { st = null; return; }
      st.on = true; st.W = vp.offsetWidth; R.sliding = true; try { vp.setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
      const page = R.pages[T.tab], pane = false && page.querySelector('[data-lvpane]') // user: a swipe only moves between the tabs; levels are chosen by tapping, cur = pane ? lvIndex(T.tab) : -1, n = cur + (dx < 0 ? 1 : -1);
      if (pane && n >= 0 && n < lvList(T.tab).length) { if (R.lvEnd) R.lvEnd(); clearTimeout(R.lvBackT); const p = page.querySelector('[data-lvpane]'); p.style.transition = 'none'; st.lv = { page, pane: p, cur: lvIndex(T.tab), dir: 0, peek: null, w: p.offsetWidth + LV_GAP }; }
      else tr.classList.remove('settle');
    }
    st.pts.push([e.timeStamp, e.clientX]); if (st.pts.length > 6) st.pts.shift();
    if (st.lv) { // paging through the levels: the pane follows the finger, the next level comes in beside it
      const L = st.lv, dir = dx < 0 ? 1 : -1, n = L.cur + dir, has = n >= 0 && n < lvList(T.tab).length;
      if (dir !== L.dir) { lvHide(L.peek); L.peek = has ? lvPeek(T.tab, dir) : null; if (L.peek) { L.at = lvPlace(L.page, L.pane, L.peek); L.peek.style.transition = 'none'; L.peek.classList.add('on'); } L.dir = dir; }
      st.dx = has ? dx : dx / 3;
      L.pane.style.transform = `translate3d(${st.dx}px,0,0)`; if (L.peek) lvMove(L.peek, L.at.x + st.dx + dir * L.w, L.at.y);
      return;
    }
    st.dx = (T.tab === 0 && dx > 0) || (T.tab === 3 && dx < 0) ? dx / 3 : dx;
    tr.style.transform = `translateX(calc(${-T.tab * 25}% + ${st.dx}px))`; R.ind.style.transform = `translateX(${(T.tab - st.dx / st.W) * 100}%)`;
  });
  const end = (e) => {
    if (!st || e.pointerId !== st.id) return; const s = st; st = null; if (!s.on) return;
    R.sliding = false;
    // finger speed over its last 120 ms only (a slow first frame must not hide a flick); held still = no flick
    const b = s.pts[s.pts.length - 1], a = b && (s.pts.find((p) => b[0] - p[0] <= 120) || b), a2 = a === b ? s.pts[s.pts.length - 2] : a;
    const v = b && a2 && b[0] > a2[0] && e.timeStamp - b[0] < 100 ? (b[1] - a2[1]) / (b[0] - a2[0]) : 0;
    if (s.lv) {
      const L = s.lv; vp._moved = Date.now();
      // a flick counts only when the finger really travelled that way (moving out and back, then letting go, stays)
      const go = L.peek && (L.dir > 0 ? s.dx < -L.w * 0.25 || (v < -0.3 && s.dx < -24) : s.dx > L.w * 0.25 || (v > 0.3 && s.dx > 24));
      if (go) return lvGo(T.tab, L.cur + L.dir, s.dx, v, { peek: L.peek, at: L.at });
      // not far enough: both glide back
      const ms = Math.round(Math.max(180, Math.min(360, Math.abs(s.dx) / Math.max(Math.abs(v), 0.9)))), ease = `transform ${ms}ms cubic-bezier(.15,.8,.3,1)`;
      L.pane.style.transition = ease; L.pane.style.transform = 'translate3d(0,0,0)';
      if (L.peek) { L.peek.style.transition = ease; lvMove(L.peek, L.at.x + L.dir * L.w, L.at.y); }
      clearTimeout(R.lvBackT); R.lvBackT = setTimeout(() => { if (L.pane.isConnected) L.pane.removeAttribute('style'); if (L.peek && !L.peek.classList.contains('live')) lvHide(L.peek); }, ms + 40);
      return;
    }
    let i = T.tab; if ((s.dx < -s.W * 0.3 || v < -0.3) && T.tab < 3) i++; else if ((s.dx > s.W * 0.3 || v > 0.3) && T.tab > 0) i--;
    // finish at the finger's speed: a quick flick glides fast, a slow drag settles gently (like iOS)
    const left = Math.abs((T.tab - i) * s.W + s.dx), ms = Math.round(Math.max(180, Math.min(420, left / Math.max(Math.abs(v), 0.9))));
    tr.style.transitionDuration = ms + 'ms'; tr.classList.add('settle', 'glide');
    clearTimeout(tr._t); tr._t = setTimeout(() => { tr.style.transitionDuration = ''; tr.classList.remove('glide'); }, ms + 40);
    vp._moved = Date.now();
    if (i !== T.tab) return goTab(i);
    syncTabs();
  };
  vp.addEventListener('pointerup', end); vp.addEventListener('pointercancel', end);
}
function bindTabSlide() {
  const bar = R.tabs, ind = R.ind; let st = null;
  bar.addEventListener('pointerdown', (e) => { st = { x0: e.clientX, on: false, id: e.pointerId, over: T.tab }; });
  bar.addEventListener('pointermove', (e) => {
    if (!st || e.pointerId !== st.id) return;
    if (!st.on) { if (Math.abs(e.clientX - st.x0) < 8) return; st.on = true; R.sliding = true; bar.classList.add('sliding'); try { bar.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } }
    const r = bar.getBoundingClientRect(), w = (r.width - 10) / 4, x = Math.max(0, Math.min(w * 3, e.clientX - r.left - 5 - w / 2));
    ind.style.transform = `translateX(${x}px)`; st.over = Math.round(x / w); bar.querySelectorAll('button').forEach((b, k) => b.classList.toggle('on', k === st.over));
  });
  const up = (e) => { if (!st || e.pointerId !== st.id) return; const s = st; st = null; bar.classList.remove('sliding'); R.sliding = false; if (s.on) { bar._slid = Date.now(); R.track.classList.add('settle'); if (s.over !== T.tab || T.push.length) goTab(s.over); else syncTabs(); } };
  bar.addEventListener('pointerup', up); bar.addEventListener('pointercancel', up);
}
// ---------- level pager (Units and Books) ----------
// A sideways swipe on Units or Books moves to the next or previous level: the level's page follows the finger and the
// neighbouring level slides in beside it, like turning a page. Only at the first or last level does the swipe move to
// the next tab. Tapping a level chip slides the pages the same way. The new level is chosen the moment the finger lifts
// (or the chip is tapped), so a quick next tap is never lost.
// For smoothness the two neighbouring levels are drawn ahead of time, out of sight, in a layer over the pages; a swipe
// then only moves pictures that are ready. The page itself is redrawn once the slide has finished.
const LV_GAP = 16;
const lvIndex = (tab) => (tab === 1 ? UNIT_LV().findIndex((l) => l.id === T.unitLvl) : T.bookLvl);
function lvSet(tab, i) { if (tab === 1) T.unitLvl = UNIT_LV()[i].id; else T.bookLvl = i; keepUi(); }
function lvLayer() { if (!R.lvLayer) { R.lvLayer = document.createElement('div'); R.lvLayer.className = 'lv-layer'; R.vp.appendChild(R.lvLayer); } return R.lvLayer; }
function lvBuild(tab, i, w, side) { // the pane of another level, drawn and parked just off the screen, ready to slide in
  const k = tab === 1 ? 'unitLvl' : 'bookLvl', was = T[k];
  T[k] = tab === 1 ? UNIT_LV()[i].id : i;
  let el;
  try { const t = document.createElement('template'); t.innerHTML = safe(PAGES[tab]); el = t.content.querySelector('[data-lvpane]'); } finally { T[k] = was; }
  el.removeAttribute('data-lvpane'); el.classList.add('lv-float'); el.setAttribute('aria-hidden', 'true'); el.inert = true; el.style.width = w + 'px';
  el._side = side || { x: -2 * w - 99, y: 0 }; lvMove(el, el._side.x, el._side.y);
  lvLayer().appendChild(el); return el;
}
function lvDrop(tab) { const c = R.lvc && R.lvc[tab]; if (c) { Object.values(c.els).forEach((e) => e.remove()); delete R.lvc[tab]; } }
// Draw the levels on both sides of the current one (only again when the page has changed). With one = true it draws at
// most one of them, so the work is done in small pieces while the phone is idle.
function lvSide(tab, dir) { // the drawn neighbour on one side, drawing it now if needed (build = false: only if ready)
  const page = R.pages[tab], pane = page.querySelector('[data-lvpane]'), n = lvIndex(tab) + dir;
  if (!pane || n < 0 || n >= lvList(tab).length) return null;
  const w = pane.offsetWidth, key = page._html + '|' + w; let c = (R.lvc || (R.lvc = {}))[tab];
  if (!c || c.key !== key) { lvDrop(tab); c = R.lvc[tab] = { key, els: {} }; }
  // parked well past the edge of the screen (shadows included). Measured on screen, not with offsetLeft: that counts
  // from the start of the row of pages, so Units' left neighbour once waited ON the screen, over every tab.
  if (!c.els[dir] && arguments[2] !== false) { const vr = R.vp.getBoundingClientRect(); c.els[dir] = lvBuild(tab, n, w, { x: dir > 0 ? vr.width + 60 : -w - 60, y: pane.getBoundingClientRect().top - vr.top }); }
  return c.els[dir] || null;
}
function lvPrep(tab, one) {
  if (R.lvEnd || !R.pages[tab].querySelector('[data-lvpane]')) return false;
  for (const dir of [1, -1]) {
    if (lvSide(tab, dir, false)) continue;
    const n = lvIndex(tab) + dir; if (n < 0 || n >= lvList(tab).length) continue;
    lvSide(tab, dir);
    if (one) return true; // more to do next time
  }
  return false;
}
function lvIdle(tab) { // only when nothing is moving: never in the middle of a slide, a sheet or a new screen
  if (lvIdle[tab]) return; lvIdle[tab] = true;
  const later = () => ('requestIdleCallback' in window ? requestIdleCallback(run, { timeout: 4000 }) : setTimeout(run, 300));
  const run = () => {
    if (R.sliding || R.lvEnd || performance.now() - (R.drawnAt || 0) < 450) { setTimeout(later, 200); return; }
    if (lvPrep(tab, true)) { setTimeout(later, 60); return; }
    lvIdle[tab] = false;
  };
  later();
}
const lvPeek = (tab, dir) => lvSide(tab, dir); // for a swipe: drawn now if it isn't ready yet
// Where the neighbour sits on screen: level with the current pane. If the neighbour is shorter and the page is scrolled
// far down, it sits where the page will end up after the swap, so nothing jumps at the end.
function lvPlace(page, pane, peek) {
  const pr = pane.getBoundingClientRect(), vr = R.vp.getBoundingClientRect(), sc = page.scrollTop;
  const sc2 = Math.min(sc, Math.max(0, page.scrollHeight - pane.offsetHeight + peek.offsetHeight - page.clientHeight));
  return { x: pr.left - vr.left, y: pr.top - vr.top + (sc - sc2), sc2 };
}
const lvMove = (el, x, y) => { el.style.transform = `translate3d(${x}px,${y}px,0)`; };
function lvHide(peek) { if (!peek) return; peek.classList.remove('on', 'live'); peek.style.transition = ''; lvMove(peek, peek._side.x, peek._side.y); peek.inert = true; peek.setAttribute('aria-hidden', 'true'); }
function lvChips(tab) { // the chosen chip lights up at once and glides into view
  const page = R.pages[tab];
  page.querySelectorAll('.tp-segs button').forEach((b) => b.classList.toggle('on', tab === 1 ? b.dataset.unitlvl === T.unitLvl : +b.dataset.booklvl === T.bookLvl));
  restoreStrips(page, stripsOf(page));
}
// Choose level i on this tab and slide: the old pane leaves to one side, the new one arrives from the other.
// d = where the finger left the pane (0 for a tap), v = finger speed (px/ms) so the glide finishes at that speed.
function lvGo(tab, i, d = 0, v = 0, ready) {
  if (R.lvEnd) R.lvEnd(); // a slide still running finishes at once
  clearTimeout(R.lvBackT);
  const page = R.pages[tab], pane = page.querySelector('[data-lvpane]'), from = lvIndex(tab);
  if (!pane || i === from || i < 0 || i >= lvList(tab).length) return;
  const dir = i > from ? 1 : -1, W = pane.offsetWidth + LV_GAP;
  const peek = (ready && ready.peek) || (Math.abs(i - from) === 1 ? lvSide(tab, dir, false) : null);
  if (!peek) { // a far level (or a neighbour not drawn yet): draw it in place; it glides in from the side it lies on
    lvSet(tab, i); draw();
    const p = page.querySelector('[data-lvpane]');
    if (p && p.animate) p.animate([{ transform: `translate3d(${dir * 56}px,0,0)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
    return;
  }
  peek.classList.add('on');
  const at = (ready && ready.at) || lvPlace(page, pane, peek);
  lvSet(tab, i); lvChips(tab);
  peek.classList.add('on', 'live'); peek.inert = false; peek.removeAttribute('aria-hidden'); // taps on the arriving level work at once
  pane.style.pointerEvents = 'none'; pane.style.transition = peek.style.transition = 'none';
  pane.style.transform = `translate3d(${d}px,0,0)`; lvMove(peek, at.x + d + dir * W, at.y);
  void peek.offsetWidth;
  const ms = v ? Math.round(Math.max(180, Math.min(420, Math.abs(d + dir * W) / Math.max(Math.abs(v), 0.9)))) : 340;
  pane.style.transition = peek.style.transition = `transform ${ms}ms cubic-bezier(.15,.8,.3,1)`;
  pane.style.transform = `translate3d(${-dir * W}px,0,0)`; lvMove(peek, at.x, at.y);
  const t = setTimeout(() => R.lvEnd && R.lvEnd(), ms + 30);
  R.lvEnd = () => { // the page now draws the new level exactly where the sliding picture is, then the picture goes
    R.lvEnd = null; clearTimeout(t);
    draw();
    const p = page.querySelector('[data-lvpane]'); if (p) p.removeAttribute('style');
    if (page.scrollTop !== at.sc2) page.scrollTop = at.sc2;
    peek.remove(); lvDrop(tab); lvIdle(tab);
  };
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
  if (root.querySelector('#f-fee')) F.fee = +String(val('f-fee')).replace(/\D/g, '') || '';
}

// ---------- attendance taps: updated in place (no redraw), saved at once ----------
function tapCtx(b) { const grid = b.closest('.tl-grid'); return grid ? { g: gById(grid.dataset.g), d: fromIso(grid.dataset.date), grid } : null; }
function refreshRow(grid, g, d, sid) {
  const s = g.students.find((x) => x.id === sid), row = grid.querySelector(`.tl-st[data-sid="${sid}"]`); if (!s || !row) return;
  const r = rec(g, d), a = r.get(sid), hw = r.hwOf(sid), hb = row.querySelector('.tl-hw'); // changed in place, so the colour glides
  row.className = 'tl-st ' + a; row.querySelector('.st').textContent = a;
  hb.hidden = a === 'absent'; hb.classList.toggle('on', hw); hb.innerHTML = ic(hw ? 'BookCheck' : 'BookX');
  const btn = grid.parentElement.querySelector(`[data-saveday="${g.id}"]`); if (btn) btn.textContent = saveLabel(g, d);
}

function onClick(e) {
  const b = e.target.closest('button,a,label'); if (!b || !root.contains(b)) return;
  if (b.tagName === 'A' || b.tagName === 'LABEL') return;
  if ((R.vp._moved && Date.now() - R.vp._moved < 350) || (R.tabs._slid && Date.now() - R.tabs._slid < 350)) return;
  if (R.sheet && R.sheet._dragged && Date.now() - R.sheet._dragged < 350) return; // the end of a pull isn't a tap
  const sw = b.closest('.tp-seg2'); if (sw && sw._slid && Date.now() - sw._slid < 350) return; // nor the end of a slide
  const d = b.dataset, top = T.push[T.push.length - 1];
  if (d.look !== undefined) {
    try { localStorage.setItem('teacher-look', d.look === 'glass' ? 'glass' : 'normal'); } catch (err) { /* not needed */ }
    lookApply(); const sg = root.querySelector('#look-seg');
    if (sg) { sg.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); sg.querySelector('.seg-thumb').style.setProperty('--i', d.look === 'glass' ? 1 : 0); }
    return;
  }
  if (d.tab !== undefined) return goTab(+d.tab);
  if (d.pop !== undefined) return goBack();
  if (d.resetUi !== undefined) { T.push = []; T.sheet = null; T.tab = 0; unwind(); return draw(); }
  if (home2Click(b, d)) return;
  if (feesClick(b, d)) return;
  if (d.push) return pushScreen({ s: d.push, lvl: d.lvl, w: +d.w, l: +d.l, g: d.g, date: d.date });
  if (d.unitlvl) { if (d.unitlvl === T.unitLvl) return; return lvGo(1, UNIT_LV().findIndex((l) => l.id === d.unitlvl)); }
  if (d.booklvl) { if (+d.booklvl === T.bookLvl) return; return lvGo(3, +d.booklvl); }
  if (d.bgshow) { const st = T.big[d.bgshow]; if (st) { st.shown = true; draw(); } return; }
  if (d.bgpick) { const [key, j] = d.bgpick.split('|'), st = T.big[key]; if (st && st.sel < 0) { st.sel = +j; draw(); } return; }
  if (d.bgnav) { const [key, dl] = d.bgnav.split('|'); bigMove(key, +dl); return; }
  if (d.aud) { if (d.aud === T.aud) return; T.aud = d.aud; keepUi(); return draw(); }
  if (d.kidlvl) { if (d.kidlvl === T.kidLvl) return; T.kidLvl = d.kidlvl; keepUi(); return draw(); }
  if (d.kshow) { T.open['tr-' + d.kshow] = !T.open['tr-' + d.kshow]; return draw(); }
  if (d.bookseg) { if (d.bookseg === T.bookSeg) return; T.bookSeg = d.bookseg; R.anim = 3; return draw(); }
  if (d.tap !== undefined) { const c = tapCtx(b); if (!c) return; if (!lessonOpen(c.g, c.d)) return notOpenToast(c.g, c.d); const r = rec(c.g, c.d, true); r.att[d.tap] = NEXT[r.get(d.tap)]; save(); return refreshRow(c.grid, c.g, c.d, d.tap); }
  if (d.gcell !== undefined) {
    const gt = b.closest('.gt'), g = gById(gt.dataset.g), dt = fromIso(d.gdate);
    if (!lessonOpen(g, dt)) return notOpenToast(g, dt);
    const r = rec(g, dt, true);
    r.att[d.gcell] = d.gcell in r.att ? NEXT[r.get(d.gcell)] : 'here'; save();
    const a = r.get(d.gcell); b.className = 'gc ' + a + (a !== 'absent' && !r.hwOf(d.gcell) ? ' nohw' : ''); b.textContent = GSYM[a];
    const pc = gridPct(g, tableDates(g), d.gcell), pe = gt.querySelector(`[data-gpct="${d.gcell}"]`); if (pe) pe.textContent = pc === null ? '' : pc + '%';
    const grid = root.querySelector(`.tl-grid[data-g="${g.id}"][data-date="${d.gdate}"]`); if (grid) refreshRow(grid, g, dt, d.gcell);
    return;
  }
  if (d.taphw !== undefined) { const c = tapCtx(b); if (!c) return; if (!lessonOpen(c.g, c.d)) return notOpenToast(c.g, c.d); const r = rec(c.g, c.d, true); r.hw[d.taphw] = !r.hwOf(d.taphw); save(); return refreshRow(c.grid, c.g, c.d, d.taphw); }
  if (d.saveday) {
    const g = gById(d.saveday), dt = fromIso(d.date);
    if (!lessonOpen(g, dt)) return notOpenToast(g, dt);
    const r = rec(g, dt, true);
    g.students.forEach((s) => { if (!(s.id in r.att)) r.att[s.id] = 'here'; if (!(s.id in r.hw)) r.hw[s.id] = true; });
    (S.saved[g.id] = S.saved[g.id] || {})[d.date] = true; autoTaught(g, d.date); save();
    const here = g.students.filter((s) => r.get(s.id) !== 'absent').length, hw = g.students.filter((s) => r.get(s.id) !== 'absent' && r.hwOf(s.id)).length;
    draw(); return toast(`Saved: ${here} of ${g.students.length} here, ${hw} did the homework`);
  }
  if (d.lessonday) { top.date = d.lessonday; if (R.screen) R.screen._swap = true; return draw(); }
  if (d.rmreg) {
    const g = gById(d.g); if (!g) return;
    [S.rec, S.hw, S.saved].forEach((m) => { if (m[g.id]) delete m[g.id][d.rmreg]; }); undoTaught(g, d.rmreg);
    save(); const p = lastLesson(g); top.date = p ? iso(p) : null; if (R.screen) R.screen._swap = true; toast('Register removed'); return draw();
  }
  if (d.regtoday !== undefined) { top.date = iso(TODAY); if (R.screen) R.screen._swap = true; return draw(); }
  if (d.addstu) { const n = val('tp-newstu'); if (!n) return toast('Type the name first'); gById(d.addstu).students.push({ id: uid(), name: n, added: Date.now() }); save(); draw(); return toast(n + ' added'); }
  if (d.taught) {
    const g = gById(d.taught), k = iso(TODAY), t = taughtOn(g, TODAY);
    if (t) { g.week = t.w; g.les = t.l; delete S.taught[g.id][k]; save(); draw(); return toast('Undone'); }
    (S.taught[g.id] = S.taught[g.id] || {})[k] = { w: g.week, l: g.les }; const p = advance(g, 1); g.week = p.w; g.les = p.l; save(); draw();
    return toast(`Taught. ${g.name} moves to the next lesson.`);
  }
  if (d.owndone) { const g = gById(d.owndone), k = iso(TODAY), m = (S.ownDone[g.id] = S.ownDone[g.id] || {}); if (m[k]) delete m[k]; else m[k] = true; save(); draw(); return toast(m[k] ? 'Taught' : 'Undone'); }
  if (d.packshare) return packShare(d.packshare, d.pt);
  if (d.packshareall) return packShareAll(d.packshareall, d.pt);
  if (d.sharelink) return shareLink(d.sharelink, d.pt);
  if (d.book) return openSheet({ s: 'book', book: d.book });
  if (d.openbook) return openBook(d.openbook);
  if (d.rmbook) { if (!confirmTwice(b, 'Tap again to remove it')) return; const f = d.rmbook; delete S.files[f]; save(); delFile('pdf:' + f).catch(() => {}); closeSheetNow(); return toast('Removed from the app'); }
  if (d.play) return playAudio(b, d.play);
  if (d.openmat) return openMat(d.openmat);
  if (d.rmmat) { if (!confirmTwice(b, '')) return; S.mats[d.key] = (S.mats[d.key] || []).filter((a) => a.id !== d.rmmat); if (!S.mats[d.key].length) delete S.mats[d.key]; save(); delFile('mat:' + d.rmmat).catch(() => {}); draw(); return toast('Removed'); }
  if (d.rmaudio) { if (!confirmTwice(b, '')) return; const id = C.levels[T.bookLvl].id; S.audio[id] = (S.audio[id] || []).filter((a) => a.id !== d.rmaudio); save(); delFile('audio:' + d.rmaudio).catch(() => {}); draw(); return toast('Removed'); }
  if (d.rmlink) { if (!confirmTwice(b, '')) return; const id = C.levels[T.bookLvl].id; S.links[id] = (S.links[id] || []).filter((a) => a.id !== d.rmlink); save(); draw(); return toast('Removed'); }
  if (d.sheet) return openSheet({ s: d.sheet, g: d.g, key: d.key, kind: d.kind, sid: d.sid });
  if (d.closesheet !== undefined) return closeSheetNow();
  if (d.fLvl) { keepForm(); Object.assign(T.sheet.form, { lvl: d.fLvl, week: 1, les: 1 }); return draw(); }
  if (d.fColor !== undefined) { keepForm(); T.sheet.form.color = d.fColor; b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); return; }
  if (d.opengrp) { const sec = b.closest('.tl-sec'), on = !sec.classList.contains('open'); T.open[d.opengrp] = on; sec.classList.toggle('open', on); b.setAttribute('aria-expanded', on); return; }
  if (d.fDay !== undefined) { keepForm(); const ds = T.sheet.form.days, k = +d.fDay; T.sheet.form.days = ds.includes(k) ? ds.filter((x) => x !== k) : [...ds, k].sort(); return draw(); }
  if (d.fAdd !== undefined) { keepForm(); addFormStudent(); return; }
  if (d.fRm !== undefined) { keepForm(); T.sheet.form.students.splice(+d.fRm, 1); return draw(); }
  if (d.savegroup !== undefined) return saveGroup();
  if (d.delgroup) {
    if (!confirmTwice(b, 'Tap again to remove the group')) return;
    S.groups = S.groups.filter((g) => g.id !== d.delgroup); save(); T.sheet = null; T.push = [];
    unwind(); draw(); return toast('Group removed');
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
  T.sheet.form.students.push({ id: uid(), name: n, added: Date.now() }); draw();
  const inp = root.querySelector('#f-stu'); if (inp) inp.focus();
}
function saveGroup() {
  keepForm(); const F = T.sheet.form; if (!F.name) return toast('Give the group a name');
  const pending = val('f-stu'); if (pending) F.students.push({ id: uid(), name: pending, added: Date.now() });
  const old = T.sheet.g && gById(T.sheet.g);
  const g = Object.assign(old || { id: uid(), created: Date.now(), gone: [] }, { name: F.name, lvl: F.lvl, book: F.lvl === 'own' ? F.book || 'Own book' : '', days: F.days, time: F.time || '15:00', color: F.color || '', week: +F.week || 1, les: +F.les || 1 });
  if (old) { const keep = new Set(F.students.map((s) => s.id)); g.gone = [...(g.gone || []), ...old.students.filter((s) => !keep.has(s.id))]; }
  g.students = F.students;
  if (planned(g.lvl)) { const p = advance(g, 0); g.week = p.w; g.les = p.l; }
  if (!old) S.groups.push(g);
  if (+F.fee > 0) S.pay.plan[g.id] = F.feeKind === 'single' ? { kind: 'single', rate: +F.fee } : { kind: 'group', fee: +F.fee }; else delete S.pay.plan[g.id];
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
  S.files[f] = { size: file.size, at: Date.now() }; save(); draw(); toast('Added to the app');
}
async function pickMat(input) {
  const key = input.dataset.pickmat, files = [...input.files]; if (!files.length) return;
  toast('Adding…'); const xs = S.mats[key] || [];
  for (const file of files) {
    const a = { id: uid(), name: file.name, size: file.size, type: file.type || '' };
    try { await putFile('mat:' + a.id, file); } catch (e) { toast('Could not keep the file: not enough space?'); break; }
    xs.push(a);
  }
  if (xs.length) S.mats[key] = xs; save(); draw(); toast(files.length > 1 ? 'Files added' : 'File added');
}
async function openMat(id) {
  const a = Object.values(S.mats).flat().find((x) => x.id === id), blob = await getFile('mat:' + id).catch(() => null);
  if (!a || !blob) return toast('The file is missing on this phone; add it again');
  const file = new File([blob], a.name, { type: a.type || blob.type }), url = URL.createObjectURL(file);
  // pictures, PDFs, recordings and videos open in the phone's viewer; Word, PowerPoint and others go to the app that opens them
  const shown = /^(image|audio|video|text)\//.test(file.type) || /pdf/.test(file.type);
  const w = shown ? window.open(url, '_blank') : null;
  if (!w) {
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file], title: a.name }); } catch (e) { /* closed */ } }
    else { const l = document.createElement('a'); l.href = url; l.download = a.name; document.body.appendChild(l); l.click(); l.remove(); }
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
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
  if (home2Change(t)) return;
  if (t.dataset.pickbook) return pickBook(t);
  if (t.dataset.pickmat) return pickMat(t);
  if (t.dataset.restore !== undefined) return restore(t);
  if (t.dataset.profile !== undefined) { const nm = root.querySelector('#f-pname'), ro = root.querySelector('#f-prole'); profileSet({ name: (nm ? nm.value : '').trim().slice(0, 40), role: (ro ? ro.value : '').trim().slice(0, 40) }); return draw(); }
}
function onKey(e) {
  const sc = R.screen && R.screen._sc;
  if (sc && sc.s === 'big' && (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === ' ')) { e.preventDefault(); const key = bigKey(sc), st = T.big[key]; if (e.key === ' ' && st && !st.shown) { st.shown = true; return draw(); } return bigMove(key, e.key === 'ArrowLeft' ? -1 : 1); }
  if (e.key !== 'Enter') return;
  if (e.target.id === 'f-stu') { e.preventDefault(); keepForm(); addFormStudent(); }
  if (e.target.id === 'tp-newstu') { e.preventDefault(); const b = root.querySelector('[data-addstu]'); if (b) b.click(); }
}

// The first lesson screen and sheet a phone draws are slow (fonts, shapes, styles drawn for the first time).
// Draw one of each invisibly when the app is idle, so the first real tap opens as fast as the next ones.
function prewarm() {
  const run = () => {
    if (T.sheet || T.push.length) return;
    const el = document.createElement('div'); el.className = 'tp-push still'; el.style.visibility = 'hidden'; el.setAttribute('aria-hidden', 'true');
    try { el.innerHTML = scWeek({ lvl: 'B2', w: 3 }) + scLesson({ lvl: 'B2', w: 8, l: 3 }) + scLesson({ lvl: 'A2', w: 1, l: 1 }) + scLesson({ lvl: 'I2', w: 1, l: 1 }) + `<div class="tp-sheet show"><div class="panel">${sheetGroup({})}</div></div>`; } catch (e) { return; }
    R.screens.appendChild(el); void el.offsetHeight;
    requestAnimationFrame(() => requestAnimationFrame(() => el.remove()));
  };
  if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 2000 }); else run();
  lvIdle(1); lvIdle(3); // the levels beside the current one on Units and Books, ready for a swipe
}

// ---------- start ----------
async function start() {
  root = document.getElementById('tp');
  try { history.replaceState({ tp: 0 }, ''); } catch (e) { /* fine without */ } // a fresh start has nothing open
  const hadQuick = loadQuick();
  draw();
  root.addEventListener('click', onClick); root.addEventListener('change', onChange); root.addEventListener('keydown', onKey);
  const took = await startSecond(hadQuick); if (took) draw();
  makeCopy('day');
  setTimeout(prewarm, 900);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* the browser decides */ }
  setInterval(checkLocks, 15000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    setTimeout(checkLocks, 300);
    const now = midnight(new Date()); if (iso(now) !== iso(TODAY)) { TODAY = now; makeCopy('day'); draw(); }
  });
}
window.addEventListener('error', (e) => { try { toast('Something went wrong: ' + (e.message || 'error')); } catch (_) { /* ignore */ } });
start();
