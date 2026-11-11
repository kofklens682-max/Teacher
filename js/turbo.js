'use strict';
/* IELTS Turbo in Units (user, 29 Oct 2026): a level after IELTS 7+, for one student (computer-delivered IELTS, end of January 2027).
   The course itself is data/turbo.js (made by tools\turbo_to_app.py from ielts-turbo\build.py). Each week has its lessons
   (Saturday, Sunday, Wednesday, Friday; week 1 starts with lesson 0 on Friday 30 October), each lesson says what we do, what he
   knows at the end and tips, with the vocabulary, grammar and word-check PDFs to open or share. Loaded before app.js. */
const TURBO_DAYS = { Saturday: 'Sat', Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri' };
// 11 Nov 2026 (user): every lesson has a length. The course data does not store it, so it is read from the lesson here, in ONE
// place that is easy to correct: a title with "(1 hour" or a Friday lesson (Friday is the 1-hour day) = 60 minutes, else 120.
const turboMins = (l) => (/\(1 hour/i.test(l.title || '') || l.key === 'fri' || l.day === 'Friday' ? 60 : 120);
const TURBO_ICON = { Education: 'GraduationCap', Technology: 'Smartphone', Environment: 'Leaf', Health: 'HeartPulse', Work: 'Briefcase', Crime: 'ShieldCheck', Government: 'Landmark', Media: 'Newspaper', Globalization: 'Globe', Cities: 'Building2', Family: 'Users', Money: 'ShoppingBag' };
const TURBO_LV = (typeof TURBO === 'undefined') ? undefined : {
  id: 'IT', name: 'IELTS Turbo', cefr: 'Band 7.5', weeks: TURBO.length, minutes: 120, turbo: true,
  focus: 'One student · computer IELTS, end of January · targets: Listening 8.5, Reading 8, Writing 6.5, Speaking 6.5-7',
  units: TURBO.map((w) => ({
    n: w.n, title: `${w.topic} · ${w.phase}`, icon: TURBO_ICON[w.topic] || 'Rocket', goal: w.phase_note, w,
    lessons: [...(w.pre ? [w.pre] : []), ...w.lessons].map((l, i) => ({ ...l, n: i + 1, subtopic: l.title, mins: turboMins(l) })),
  })),
};
if (TURBO_LV) {
  TURBO_LV.units.forEach((u) => u.lessons.forEach((l) => { // the PDFs, so Share works like every other lesson file
    const P = {}; if (l.writing) P.iw = l.writing; if (l.speaking) P.is = l.speaking; if (l.vocab) P.y = l.vocab; if (l.grammar) P.e = l.grammar; if (l.wordcheck) P.ic = l.wordcheck;
    if (Object.keys(P).length && typeof PACKS !== 'undefined') PACKS[`it-w${u.n}-l${l.n}`] = P;
  }));
}
const tDate = (s) => { const d = new Date(s + 'T12:00'); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };
// 11 Nov (user): with a group, a waiting lesson shows the date it is now expected (calculated, see projWhen in app.js); "planned" = the course's own date
const tWhen = (g, u, l) => { const k = g && projWhen(g)[`${u.n}-${l.n}`]; if (!k) return `${esc(l.day)} ${tDate(l.date)}`; return k === l.date ? shortDay(k) : `${shortDay(k)} · planned ${esc(l.day.slice(0, 3))} ${tDate(l.date)}`; };
const tList = (arr) => (arr || []).map((x, i) => `<p class="rt-row"><b>${i + 1}</b><span>${esc(x)}</span></p>`).join('');
function turboWeek(f) {
  const u = weekOf('IT', f.w), w = u.w, F = w.focus || {}, g = f.g && gById(f.g);
  const focus = [['Listening', F.L], ['Reading', F.R], ['Writing', F.W], ['Speaking', F.S]].filter((x) => x[1]).map(([k, v]) => `<p><b>${k}:</b> ${esc([].concat(v).join(' · '))}</p>`).join('');
  const hw = (w.homework || []).map((d) => `<div class="tp-card2"><div class="h" style="color:#5C6378">${ic('ListChecks')}Homework · ${esc(d.day)} · ${d.tasks.reduce((a, t) => a + t.min, 0) / 60} h</div>${d.tasks.map((t) => `<p class="hw">${ic('Square')}<span><b>${esc(t.skill)} · ${t.min} min.</b> ${esc(t.task)}</span></p>`).join('')}</div>`).join('');
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Units</button></div>
    <div class="tp-inner" style="${gv('IT')}">
      <div class="tp-whead">${unitTile(u, f.w - 1, true)}<div><div class="tp-eyebrow">IELTS Turbo · Week ${u.n} · ${tDate(w.start)} – ${tDate(w.end)}</div><div class="tp-lt" style="font-size:28px">${esc(w.topic)}</div></div></div>
      <div class="tp-goal2">${ic('Target')}<div><small>${esc(w.phase)} · Sunday mock target ${w.target ? `Listening ${w.target[0]}/40 · Reading ${w.target[1]}/40` : ''}</small>${esc(w.phase_note)}</div></div>
      <div class="tp-list">${u.lessons.map((l) => `<button class="tp-lesrow2" data-push="lesson" data-lvl="IT" data-w="${u.n}" data-l="${l.n}"${g ? ` data-g="${g.id}"` : ''}><span class="num">${l.n}</span><span class="tx"><b>${esc(l.title)}</b><span>${tWhen(g, u, l)} · ${esc(l.focus)}</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button>`).join('')}</div>
      ${focus ? `<div class="tp-card2"><div class="h" style="color:#E5484D">${ic('Target')}This week's question types</div>${focus}</div>` : ''}
      ${hw}
    </div>`;
}
function turboLesson(f) {
  const u = weekOf('IT', f.w), l = u.lessons[f.l - 1], key = `it-w${u.n}-l${l.n}`, title = `IELTS Turbo W${u.n} - ${l.title}`;
  // 4 Nov 2026 (user): the files open inside the app (so the three dots are there) and "Share all" sends them together
  const P = PACKS[key] || {}, sub = { y: l.vocab_title || 'Article and new words', e: l.grammar_title || 'Explanation and exercises' };
  const kinds = PK_KINDS.filter(([k]) => P[k]);
  const files = kinds.map(([k, name, s0]) => { packLater(P[k][0]);
    return `<div class="pk-row"><div class="pk-t"><b>${name}</b><span>${esc(sub[k] || s0)} · ${packSize(P[k][1])}</span></div><a class="tp-pill" href="media/packs/${P[k][0]}" target="_blank" rel="noopener" data-pvopen="${key}|${k}" data-pt="${esc(name + ' · ' + title)}">Open</a><button class="tp-pill" data-packshare="${key}|${k}" data-pt="${esc(title + ' - ' + name)}">${ic('Share2')} Share</button></div>`; }).join('')
    + (kinds.length > 1 ? `<button class="tp-cta pk-all" data-packshareall="${key}" data-pt="${esc(title)}">${ic('Share2')} Share all ${kinds.length}</button>` : '');
  const hw = (u.w.homework || []).find((d) => d.day === TURBO_DAYS[l.day]);
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button></div>
    <div class="tp-inner" style="${gv('IT')}">
      <div><div class="tp-eyebrow">IELTS Turbo · Week ${u.n} · ${tWhen(f.g && gById(f.g), u, l)}</div><div class="tp-lt" style="font-size:26px">${esc(l.title)}</div></div>
      <div class="tp-goal2">${ic('Target')}<div><small>Today's aim</small>${esc(l.focus)}</div></div>
      <div class="tp-card2"><div class="h" style="color:#3D5AFE">${ic('ListChecks')}What we do</div>${tList(l.do)}</div>
      <div class="tp-card2"><div class="h" style="color:#34C759">${ic('Award')}What he knows at the end</div>${tList(l.know)}</div>
      ${l.tips && l.tips.length ? `<div class="tp-card2"><div class="h" style="color:#FF9500">${ic('Sparkles')}Tips</div>${tList(l.tips)}</div>` : ''}
      ${files ? `<div class="tp-card2"><div class="h" style="color:#3D5AFE">${ic('FileText')}Files</div>${files}</div>` : ''}
      ${hw ? `<div class="tp-card2"><div class="h" style="color:#5C6378">${ic('ListChecks')}Homework after this lesson · ${hw.tasks.reduce((a, t) => a + t.min, 0) / 60} h</div>${hw.tasks.map((t) => `<p class="hw">${ic('Square')}<span><b>${esc(t.skill)} · ${t.min} min.</b> ${esc(t.task)}</span></p>`).join('')}</div>` : ''}
      ${f.g && gById(f.g) ? attMain(gById(f.g), f, 'lesson') : ''}
    </div>`;
}
