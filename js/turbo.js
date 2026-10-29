'use strict';
/* IELTS Turbo in Units (user, 29 Oct 2026): a level after IELTS 7+, for one student (computer-delivered IELTS, end of January 2027).
   The course itself is data/turbo.js (made by tools\turbo_to_app.py from ielts-turbo\build.py). Each week has its lessons
   (Saturday, Sunday, Wednesday, Friday; week 1 starts with lesson 0 on Friday 30 October), each lesson says what we do, what he
   knows at the end and tips, with the vocabulary, grammar and word-check PDFs to open or share. Loaded before app.js. */
const TURBO_DAYS = { Saturday: 'Sat', Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed', Thursday: 'Thu', Friday: 'Fri' };
const TURBO_ICON = { Education: 'GraduationCap', Technology: 'Smartphone', Environment: 'Leaf', Health: 'HeartPulse', Work: 'Briefcase', Crime: 'ShieldCheck', Government: 'Landmark', Media: 'Newspaper', Globalization: 'Globe', Cities: 'Building2', Family: 'Users', Money: 'ShoppingBag' };
const TURBO_LV = (typeof TURBO === 'undefined') ? undefined : {
  id: 'IT', name: 'IELTS Turbo', cefr: 'Band 7.5', weeks: TURBO.length, minutes: 120, turbo: true,
  focus: 'One student · computer IELTS, end of January · targets: Listening 8.5, Reading 8, Writing 6.5, Speaking 6.5-7',
  units: TURBO.map((w) => ({
    n: w.n, title: `${w.topic} · ${w.phase}`, icon: TURBO_ICON[w.topic] || 'Rocket', goal: w.phase_note, w,
    lessons: [...(w.pre ? [w.pre] : []), ...w.lessons].map((l, i) => ({ ...l, n: i + 1, subtopic: l.title })),
  })),
};
if (TURBO_LV) {
  TURBO_LV.units.forEach((u) => u.lessons.forEach((l) => { // the PDFs, so Share works like every other lesson file
    const P = {}; if (l.vocab) P.y = l.vocab; if (l.grammar) P.e = l.grammar; if (l.wordcheck) P.c = l.wordcheck;
    if (Object.keys(P).length && typeof PACKS !== 'undefined') PACKS[`it-w${u.n}-l${l.n}`] = P;
  }));
}
const tDate = (s) => { const d = new Date(s + 'T12:00'); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; };
const tList = (arr) => (arr || []).map((x, i) => `<p class="rt-row"><b>${i + 1}</b><span>${esc(x)}</span></p>`).join('');
function turboWeek(f) {
  const u = weekOf('IT', f.w), w = u.w, F = w.focus || {};
  const focus = [['Listening', F.L], ['Reading', F.R], ['Writing', F.W], ['Speaking', F.S]].filter((x) => x[1]).map(([k, v]) => `<p><b>${k}:</b> ${esc([].concat(v).join(' · '))}</p>`).join('');
  const hw = (w.homework || []).map((d) => `<div class="tp-card2"><div class="h" style="color:#5C6378">${ic('ListChecks')}Homework · ${esc(d.day)} · ${d.tasks.reduce((a, t) => a + t.min, 0) / 60} h</div>${d.tasks.map((t) => `<p class="hw">${ic('Square')}<span><b>${esc(t.skill)} · ${t.min} min.</b> ${esc(t.task)}</span></p>`).join('')}</div>`).join('');
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Units</button></div>
    <div class="tp-inner" style="${gv('IT')}">
      <div class="tp-whead">${unitTile(u, f.w - 1, true)}<div><div class="tp-eyebrow">IELTS Turbo · Week ${u.n} · ${tDate(w.start)} – ${tDate(w.end)}</div><div class="tp-lt" style="font-size:28px">${esc(w.topic)}</div></div></div>
      <div class="tp-goal2">${ic('Target')}<div><small>${esc(w.phase)} · Sunday mock target ${w.target ? `Listening ${w.target[0]}/40 · Reading ${w.target[1]}/40` : ''}</small>${esc(w.phase_note)}</div></div>
      <div class="tp-list">${u.lessons.map((l) => `<button class="tp-lesrow2" data-push="lesson" data-lvl="IT" data-w="${u.n}" data-l="${l.n}"><span class="num">${l.n}</span><span class="tx"><b>${esc(l.title)}</b><span>${esc(l.day)} ${tDate(l.date)} · ${esc(l.focus)}</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button>`).join('')}</div>
      ${focus ? `<div class="tp-card2"><div class="h" style="color:#E5484D">${ic('Target')}This week's question types</div>${focus}</div>` : ''}
      ${hw}
    </div>`;
}
function turboLesson(f) {
  const u = weekOf('IT', f.w), l = u.lessons[f.l - 1], key = `it-w${u.n}-l${l.n}`, title = `IELTS Turbo W${u.n} - ${l.title}`;
  const file = (k, name, sub) => { const p = l[{ y: 'vocab', e: 'grammar', c: 'wordcheck' }[k]]; if (!p) return '';
    packLater(p[0]);
    return `<div class="pk-row"><div class="pk-t"><b>${name}</b><span>${esc(sub)} · ${packSize(p[1])}</span></div><a class="tp-pill" href="media/packs/${p[0]}" target="_blank" rel="noopener">Open</a><button class="tp-pill" data-packshare="${key}|${k}" data-pt="${esc(title + ' - ' + name)}">${ic('Share2')} Share</button></div>`; };
  const files = file('y', 'Vocabulary', l.vocab_title || 'Article and new words') + file('e', 'Grammar', l.grammar_title || 'Explanation and exercises') + file('c', 'Weekly word check', 'This week\'s words');
  const hw = (u.w.homework || []).find((d) => d.day === TURBO_DAYS[l.day]);
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button></div>
    <div class="tp-inner" style="${gv('IT')}">
      <div><div class="tp-eyebrow">IELTS Turbo · Week ${u.n} · ${esc(l.day)} ${tDate(l.date)}</div><div class="tp-lt" style="font-size:26px">${esc(l.title)}</div></div>
      <div class="tp-goal2">${ic('Target')}<div><small>Today's aim</small>${esc(l.focus)}</div></div>
      <div class="tp-card2"><div class="h" style="color:#3D5AFE">${ic('ListChecks')}What we do</div>${tList(l.do)}</div>
      <div class="tp-card2"><div class="h" style="color:#12B76A">${ic('Award')}What he knows at the end</div>${tList(l.know)}</div>
      ${l.tips && l.tips.length ? `<div class="tp-card2"><div class="h" style="color:#F79009">${ic('Sparkles')}Tips</div>${tList(l.tips)}</div>` : ''}
      ${files ? `<div class="tp-card2"><div class="h" style="color:#3D5AFE">${ic('FileText')}Files</div>${files}</div>` : ''}
      ${hw ? `<div class="tp-card2"><div class="h" style="color:#5C6378">${ic('ListChecks')}Homework after this lesson · ${hw.tasks.reduce((a, t) => a + t.min, 0) / 60} h</div>${hw.tasks.map((t) => `<p class="hw">${ic('Square')}<span><b>${esc(t.skill)} · ${t.min} min.</b> ${esc(t.task)}</span></p>`).join('')}</div>` : ''}
    </div>`;
}
