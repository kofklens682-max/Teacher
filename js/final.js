'use strict';
/* NEXT, last round (16 Nov, user):
   1. Groups have NO attendance: every "Take attendance" / "Finish the lesson" button for a group is gone, everywhere.
      Group lessons count by themselves when they end (nxAutoTeach in next.js).
   2. Only INDIVIDUAL students have attendance: an iPhone-style month calendar (on their profile, their lesson page and
      their calendar page). Tap a day: Came / Canceled / Moved.
   3. The lesson page: files first, iPhone-style rows, no "More" button. "Not finished" and "Two lessons today" are two
      switches in one small card at the bottom. Loaded last. */

const isGrp = (id) => { const g = gById(id); return !!(g && !g.solo); };
// remove the attendance buttons of groups from any piece of HTML
const stripGrpAtt = (html) => (typeof html === 'string' && html.includes('data-push="register"')
  ? html.replace(/<button\b[^>]*\bdata-push="register"[^>]*>[\s\S]*?<\/button>/g, (m) => { const id = (m.match(/data-g="([^"]+)"/) || [])[1]; return id && isGrp(id) ? '' : m; })
  : html);

/* ---------- individual students: the iPhone-style month calendar (their attendance) ---------- */
CST.done[0] = 'Came'; CST.done[1] = '#34C759';
CST.cancel[0] = 'Canceled'; CST.cancel[1] = '#FF3B30';
CST.moved[0] = 'Moved'; CST.moved[1] = '#FF9500';
function soloCount(g, ym) {
  const [y, m] = ym.split('-').map(Number), cnt = { done: 0, cancel: 0, moved: 0, open: 0 }, tk = iso(TODAY);
  for (let d = 1; d <= 31; d++) { const dt = new Date(y, m - 1, d); if (dt.getMonth() !== m - 1) break; if (!isLessonDay(g, dt)) continue;
    const k = iso(dt), s = calSt(g, k); if (s) cnt[s]++; else if (k < tk) cnt.open++; }
  return cnt;
}
soloCal = function (g, ym) {
  ym = ym || ymOf(TODAY); const [y, m] = ym.split('-').map(Number), first = new Date(y, m - 1, 1), tk = iso(TODAY), cnt = soloCount(g, ym);
  let cells = '<i></i>'.repeat(wd(first));
  for (let d = 1; d <= 31; d++) {
    const dt = new Date(y, m - 1, d); if (dt.getMonth() !== m - 1) break;
    const k = iso(dt), les = isLessonDay(g, dt), s = les ? calSt(g, k) : '', cls = !les ? 'off' : s || (k < tk ? 'miss' : 'soon');
    const lab = !les ? 'no lesson' : s ? CST[s][0] : k < tk ? 'not marked' : k === tk ? 'today' : 'coming';
    cells += `<button class="ic-d ${cls}${k === tk ? ' today' : ''}" data-solod="${g.id}|${k}" aria-label="${DAYS_LONG[wd(dt)]} ${d} ${MONTHS[m - 1]}: ${lab}"><b>${d}</b></button>`;
  }
  const leg = [['done', cnt.done], ['cancel', cnt.cancel], ['moved', cnt.moved]].map(([k, n]) => `<span><i style="background:${CST[k][1]}"></i>${n} ${CST[k][0].toLowerCase()}</span>`).join('') + (cnt.open ? `<span><i class="ring"></i>${cnt.open} not marked</span>` : '');
  return `<div class="ic-cal"><div class="ic-h"><b>${MONTHS[m - 1]} <span>${y}</span></b><div><button data-solom="${g.id}|${ymAdd(ym, -1)}" aria-label="Previous month">${ic('ChevronLeft')}</button><button data-solom="${g.id}|${ymAdd(ym, 1)}" aria-label="Next month">${ic('ChevronRight')}</button></div></div>
    <div class="ic-w">${DAYS.map((x) => `<span>${x[0]}</span>`).join('')}</div><div class="ic-g">${cells}</div>
    <div class="ic-leg">${leg}</div></div>`;
};
// the calendar page of an individual student (also what "attendance" opens for them)
scSolo = function (f) {
  const g = gById(f.g); if (!g) return scGone();
  const st = g.students[0];
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button><button class="tp-pill" data-sheet="group" data-g="${g.id}">${ic('Pencil')} Edit</button></div>
    <div class="tp-inner">
      <div class="nx-title">${st ? nxAv(st) : ''}${esc(st ? st.name : g.name)}</div>
      <p class="nx-sub">Individual · ${esc(LVNAME(g.lvl))} · ${esc(timesText(g))}</p>
      ${!st && g.left && g.left.length ? `<div class="tp-card2 warn">${ic('CalendarX2')}<p><b>${esc(g.left[0].name)} stopped coming after ${ymName(g.left[0].until)}.</b> The lessons and payments up to then are kept.</p></div>` : ''}
      <div class="nx-sec">Attendance</div><div class="nx-card">${soloCal(g, f.ym)}</div>
      <p class="nx-foot">Tap a day to mark it: came, canceled or moved. Tap any other day to add a lesson.</p>
      ${st ? `<div class="nx-list"><button class="nx-row" data-nxpush="sprof" data-g="${g.id}" data-sid="${st.id}"><span class="nx-tile" style="--c:#007AFF">${ic('UserRound')}</span><span class="nx-tx"><b>Profile and payments</b></span>${chev()}</button></div>` : ''}</div>`;
};
// the day pop-up: short iPhone texts
{
  const _d = sheetSoloDay;
  sheetSoloDay = (s) => _d(s).replace('The lesson happened: it counts, and the plan moves on', 'The lesson happened. It counts, and the plan moves on.')
    .replace('No lesson, nothing is owed. The plan does not move: the same topic comes next lesson', 'No lesson, nothing to pay. The same topic comes next time.')
    .replace('Moved to another day: the same topic waits', 'Moved to another day. The same topic waits.');
  SHEETS.soloday = (s) => sheetSoloDay(s);
}

/* ---------- the lesson page ---------- */
const lpSw = (on) => `<i class="lp-sw${on ? ' on' : ''}"></i>`;
function lpClass(g, f) { // the card at the bottom of a group's lesson: how it counts + two switches
  const t = taughtOn(g, TODAY), c = curLes(g), isT = !!(t && t.w === +f.w && t.l === +f.l), isC = isT || (c.w === +f.w && c.l === +f.l);
  if (!isC) return '';
  const today = hasLesson(g, TODAY), ended = today && lessonEnded(g, TODAY), nd = nextLesDate(g);
  let status;
  if (isT && (ended || !today)) status = `Taught today ✓ · ${esc(g.name)} is now on Week ${c.w} · ${dayWord(g.lvl)} ${c.l}`;
  else if (today && !ended) status = `Counts by itself when the lesson ends at ${hm(endMin(g, TODAY))}`;
  else status = nd ? `Next class: ${DAYS_LONG[wd(nd)]} ${nd.getDate()} ${MONTHS[nd.getMonth()].slice(0, 3)} · ${esc(timeOn(g, nd))}` : 'No class planned';
  const can = g.lvl !== 'own' && planned(g.lvl) && (today || t || repOn(g, TODAY)), on = repOn(g, TODAY), two = dblOn(g, TODAY);
  const rows = can ? `${two ? '' : `<button class="lp-row" data-repeat="${g.id}"><span class="tx"><b>Not finished</b><small>Stay on this lesson next class</small></span>${lpSw(on)}</button>`}
      ${on ? '' : `<button class="lp-row" data-two="${g.id}"><span class="tx"><b>Two lessons today</b><small>The plan moves on by two</small></span>${lpSw(two)}</button>`}` : '';
  return `<div class="nx-sec">This class</div><div class="lp-card"><div class="lp-stat"><span class="lp-ic" style="--c:${isT ? '#34C759' : '#007AFF'}">${ic(isT ? 'Check' : 'Clock')}</span><span class="tx"><b>${esc(g.name)}</b><small>${status}</small></span></div>${rows}</div>`;
}
function lpSolo(g) { // an individual student's lesson: mark today right here
  const st = g.students[0], k = iso(TODAY), cnt = soloCount(g, ymOf(TODAY)), les = isLessonDay(g, TODAY), cur = les ? calSt(g, k) : '';
  const opt = (v) => `<button class="${cur === v ? 'on' : ''}" style="--c:${CST[v][1]}" data-soloset="${g.id}|${k}|${cur === v ? '' : v}">${ic(CST[v][2])}${CST[v][0]}</button>`;
  return `<div class="nx-sec">${les ? `Today with ${esc(st ? st.name.split(' ')[0] : g.name)}` : 'Attendance'}</div><div class="lp-card">
    ${les ? `<div class="lp-seg3">${opt('done')}${opt('cancel')}${opt('moved')}</div>` : ''}
    <button class="lp-row" data-push="register" data-g="${g.id}"><span class="tx"><b>Lesson calendar</b><small>${MONTHS[TODAY.getMonth()]}: ${cnt.done} came · ${cnt.cancel} canceled${cnt.moved ? ' · ' + cnt.moved + ' moved' : ''}</small></span>${chev()}</button></div>`;
}
function lpShape(html, f) {
  if (typeof html !== 'string' || !html.includes('tp-inner')) return html;
  const tpl = document.createElement('template'); tpl.innerHTML = html;
  const C = tpl.content, inner = C.querySelector('.tp-inner'), bar = C.querySelector('.tp-pushbar'); if (!inner) return html;
  inner.classList.add('lp');
  const g = f && f.g ? gById(f.g) : null;
  // 1. attendance buttons and their notes go (groups never have them; individuals get their own card below)
  C.querySelectorAll('[data-push="register"]').forEach((b) => { const n = b.nextElementSibling; if (n && n.matches('p.tp-small')) n.remove(); b.remove(); });
  C.querySelectorAll('[data-repeat],[data-two]').forEach((b) => { const n = b.nextElementSibling; if (n && n.matches('p.tp-small')) n.remove(); b.remove(); });
  // 2. no "More" button: Edit sits at the top right like on every other page
  C.querySelectorAll('.ff-morerow,.ff-moreb,.ff-dots').forEach((x) => x.remove());
  if (bar && !bar.querySelector('[data-sheet="lesson"]') && f && f.lvl && f.w) {
    const L = lv(f.lvl); if (L) bar.insertAdjacentHTML('beforeend', `<button class="tp-pill" data-sheet="lesson" data-key="${L.id}-${f.w}-${f.l}">${ic('Pencil')} Edit</button>`);
  }
  // 3. the files first, right under the title
  const files = [...inner.children].find((x) => x.querySelector && x.querySelector('.pk-row')), games = inner.querySelector(':scope > .pk-game');
  const heads = [...inner.children].filter((x) => x.matches('.tp-whead,.tp-card2.note,.tp-goal2,.ff-book')), anchor = heads[heads.length - 1];
  if (anchor && files) { anchor.after(files); if (games) files.after(games); }
  // 4. file rows like an iPhone list: the whole row opens the file, a small share button on the right
  C.querySelectorAll('.pk-row').forEach((r) => {
    r.insertAdjacentHTML('afterbegin', `<span class="lp-fic">${ic('FileText')}</span>`);
    const sh = r.querySelector('[data-packshare]'); if (sh) { sh.innerHTML = ic('Share2'); sh.setAttribute('aria-label', 'Share'); sh.classList.add('lp-share'); }
    const op = r.querySelector('a.tp-pill'); if (op) { op.setAttribute('aria-label', 'Open'); op.classList.add('lp-open'); op.innerHTML = ic('ChevronRight'); }
  });
  C.querySelectorAll('.pk-all').forEach((b) => b.classList.add('lp-all'));
  // 5. the class card at the bottom
  if (g) inner.insertAdjacentHTML('beforeend', g.solo ? lpSolo(g) : lpClass(g, f));
  return tpl.innerHTML;
}

/* ---------- wire it in ---------- */
{
  const _l = PUSH.lesson; PUSH.lesson = (f) => lpShape(_l(f), f);
  if (PUSH.own) { const _o = PUSH.own; PUSH.own = (f) => lpShape(_o(f), { g: f.g }); }
  const _r = PUSH.register; PUSH.register = (f) => (isGrp(f.g) ? scSGrp({ g: f.g }) : _r(f)); // old links: a group's "attendance" opens its students
  const _g = PUSH.group; PUSH.group = (f) => (isGrp(f.g) ? scSGrp(f) : _g(f));
  Object.keys(PUSH).forEach((k) => { const fn = PUSH[k]; PUSH[k] = (f) => stripGrpAtt(fn(f)); });
  Object.keys(SHEETS).forEach((k) => { const fn = SHEETS[k]; SHEETS[k] = (s) => stripGrpAtt(fn(s)); });
  PAGES.forEach((fn, i) => { PAGES[i] = (a) => stripGrpAtt(fn(a)); });
  if (typeof ACTIONS !== 'undefined' && ACTIONS.att) ACTIONS.att = ['Users', 'Students of this group'];
}

/* ---------- the file viewer, iPhone style: "Done", the title with "Page 2 of 6", a Share button, a page pill while scrolling ----------
   Only the bar and a small label change; the PDF drawing itself is untouched (PDF safety rules in lights.js). */
{
  const _e = pvEnsure;
  pvEnsure = function (reuse) {
    const had = !!PV.el; _e(reuse); const el = PV.el; if (had || !el || el._lp) return; el._lp = 1;
    const bar = el.querySelector('.pv-bar'), x = bar.querySelector('.pv-x'), t = bar.querySelector('.pv-t');
    if (x) { x.classList.add('pv-done'); x.textContent = 'Done'; }
    if (t) { const w = document.createElement('div'); w.className = 'pv-ttl'; t.before(w); w.appendChild(t); w.insertAdjacentHTML('beforeend', '<small class="pv-n"></small>'); w.insertAdjacentHTML('afterend', `<button class="pv-share" aria-label="Share">${ic('Share2')}</button>`); }
    el.insertAdjacentHTML('beforeend', '<div class="pv-pill"></div>');
    const sc = el.querySelector('.pv-scroll'); let raf = 0, hideT = 0;
    sc.addEventListener('scroll', () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; pvCount(true); clearTimeout(hideT); hideT = setTimeout(() => { const p = el.querySelector('.pv-pill'); if (p) p.classList.remove('on'); }, 1100); }); }, { passive: true });
  };
  window.pvCount = function (pill) {
    if (!PV.el) return; const sc = PV.el.querySelector('.pv-scroll'), pgs = PV.el.querySelectorAll('.pv-pg'), n = PV.sizes && PV.doc ? PV.sizes.a.length : 0, lab = PV.el.querySelector('.pv-n');
    if (!n) { if (lab) lab.textContent = ''; return; }
    const r = sc.getBoundingClientRect(), y = r.top + r.height * 0.4; let i = 0;
    pgs.forEach((b, k) => { if (b.getBoundingClientRect().top <= y) i = k; });
    if (lab) lab.textContent = `Page ${i + 1} of ${n}`;
    const p = PV.el.querySelector('.pv-pill'); if (p && pill && n > 1) { p.textContent = `${i + 1} of ${n}`; p.classList.add('on'); }
  };
  const _o = pvOpen;
  pvOpen = async function (ref, title, gid) {
    const r = _o(ref, title, gid);
    const sh = PV.el && PV.el.querySelector('.pv-share'); if (sh) { sh.setAttribute('data-packshare', ref); sh.setAttribute('data-pt', title || 'File'); }
    try { await r; } catch (e) { /* the viewer shows its own message */ }
    pvCount(false); return r;
  };
}

/* ---------- 16 Nov (user, last changes): Settings > Look = "Shrink the tab bar" switch (tabshrink.js); the glass look is always on,
   like Budget (the old Normal / Glass choice is gone in both apps) ---------- */
try { localStorage.setItem('teacher-look', 'glass'); } catch (e) { /* private mode */ }
document.documentElement.classList.add('glass');
{
  const _s = PUSH.set2;
  PUSH.set2 = (f) => _s(f).replace(/<div class="nx-sec">Look<\/div><div class="nx-list">[\s\S]*?<\/div><\/div><\/div>/, () => {
    const on = typeof tabShrinkOn === 'function' ? tabShrinkOn() : true;
    return `<div class="nx-sec">Look</div><div class="nx-list"><button class="nx-row" data-tabshrink role="switch" aria-checked="${on}"><span class="nx-tile" style="--c:#007AFF">${ic('Smartphone')}</span><span class="nx-tx"><b>Shrink the tab bar</b><small>Smaller while you scroll down</small></span><i class="ts-sw${on ? ' on' : ''}"></i></button>${window.GlassBend ? GlassBend.html() : ''}</div>`;
  });
}

/* 16 Nov (user): a tap ANYWHERE on a lesson file row opens the file (before, only the small arrow did: the glass style of the
   button kept its tap area inside the button). The share button keeps its own job. */
document.addEventListener('click', (e) => {
  const r = e.target.closest && e.target.closest('.lp .pk-row'); if (!r || e.target.closest('.lp-share,.lp-open')) return;
  const a = r.querySelector('.lp-open'); if (!a) return; e.preventDefault(); e.stopPropagation(); a.click();
}, true);
