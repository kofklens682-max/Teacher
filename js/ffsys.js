'use strict';
/* 8 Nov 2026 (PREVIEW): the cleaned Home + the new Family and Friends lesson card (iPhone Settings-style list).
   Loaded after leave.js. Needs data/ffsys.js (PACKS for the new files, FFSYS = labels and book pages). */
PK_KINDS.unshift(['ffl', 'Lesson', 'Board, words, drills, answer key · for you'], ['ffs', 'Speaking', 'Sets with sample answers · for you'], ['ffh', 'Homework', 'Print for the students'], ['ffst', 'Story', 'Print for every student']);

/* ---------- Home: which group is next (Home itself is pgHomeNew in ffhome.js) ---------- */
function ffNextGroup() {
  const D = TODAY, list = S.groups.filter((g) => hasLesson(g, D) || kept(g, D)).sort((a, b) => startMin(a, D) - startMin(b, D)), left = list.filter((g) => !doneOn(g, D)), now = nowMin();
  const going = list.find((g) => startMin(g, D) <= now && !lessonEnded(g, D) && hasLesson(g, D));
  return going || left.find((g) => !lessonEnded(g, D)) || left[0] || null;
}

/* ---------- the lesson card for a day of the new Family and Friends system ---------- */
function ffPage(f) {
  const L = lv(f.lvl), u = weekOf(f.lvl, f.w), l = u.lessons[f.l - 1], key = `${L.id}-${u.n}-${l.n}`, pk = `${L.id.toLowerCase()}-w${u.n}-l${l.n}`, P = PACKS[pk], M = FFSYS[pk];
  if (!P || !M || !(P.ffs || P.ffl)) return '';
  const g = f.g && gById(f.g), t = g && taughtOn(g, TODAY), open = !!T.open['ffm-' + key];
  const isTaught = t && t.w === f.w && t.l === f.l, isNext = g && g.week === f.w && g.les === f.l && !t, ed = S.edits[key] || {};
  const title = (n) => `${n} · ${M.label}`, rev = M.kind === 'review' || M.kind === 'final';
  const KS = [['ffl', 'Lesson', 'For me: board, words, drills, answer key'], ['ffs', rev ? 'Speaking test' : 'Speaking', rev ? 'For me: recap, the book page, 12 cards' : 'For me: sets with sample answers'], ['ffh', 'Homework', 'To print for the students'], ['ffst', 'Story', 'To print for every student']].filter(([k]) => P[k]);
  const rows = KS.map(([k, name, sub]) => { packLater(P[k][0]); const d = `data-pt="${esc(title(name))}"`;
    return `<div class="pk-row"><div class="pk-t"><b>${name}</b><span>${sub} · ${packSize(P[k][1])}</span></div><a class="tp-pill" href="media/packs/${P[k][0]}" target="_blank" rel="noopener" data-pvopen="${pk}|${k}" ${d}>Open</a><button class="tp-pill" data-packshare="${pk}|${k}" ${d}>${ic('Share2')} Share</button></div>`; }).join('');
  const filesCard = `<div class="tp-card2"><div class="h" style="color:#3D5AFE">${ic('FileText')}Lesson files</div>${rows}${KS.length > 1 ? `<button class="tp-cta pk-all" data-packshareall="${pk}" data-pt="${esc(M.label)}">${ic('Share2')} Share all ${KS.length}</button>` : ''}</div>`;
  const gameRow = (x, i) => `<div class="pk-gr"><a class="tp-media" href="${esc(safeUrl(x[1]))}" target="_blank" rel="noopener"><span class="mi" style="background:${i ? '#BF5AF2' : '#FF5A5F'}">${ic('Play')}</span><span class="tx"><b>${i ? 'Backup game' : 'Game'}</b><span>${esc(x[0].replace(/^(Backup game|Game) · /, ''))}</span></span></a><button class="tp-pill pk-ic" data-sharelink="${esc(x[1])}" data-pt="${esc(x[0])}" aria-label="Share the link">${ic('Share2')}</button></div>`;
  const gamesCard = (P.g || []).length ? `<div class="tp-card2 pk-game"><div class="h" style="color:#FF5A5F">${ic('Play')}Games · Baamboozle</div>${P.g.map(gameRow).join('')}</div>` : '';
  const moreBody = open ? `<div class="ff-moreb">${g && (isTaught || isNext || repOn(g, TODAY)) ? repeatBlock(g) : ''}${matsBlock(key)}<button class="tp-pill" data-sheet="lesson" data-key="${key}">${ic('Pencil')} Edit this lesson</button>${M.murphy ? `<p class="tp-small" style="text-align:left">Murphy red · ${esc(M.murphy)}</p>` : ''}</div>` : '';
  return `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button><button class="tp-pill ff-dots" data-ffmore="${key}" aria-label="More">${ic('Ellipsis')}</button></div>
    <div class="tp-inner" style="${gv(L.id)}">
      <div class="tp-whead">${unitTile(u, f.w - 1, true)}<div><div class="tp-eyebrow">${g ? esc(g.name) + ' · ' : ''}Week ${u.n} · Day ${l.n}</div><div class="tp-lt" style="font-size:26px">${esc(M.label)}</div></div></div>
      ${ed.notes ? `<div class="tp-card2 note">${ic('StickyNote')}<p>${esc(ed.notes)}</p></div>` : ''}
      ${M.book ? `<p class="ff-book">${ic('BookOpen')}${esc(M.book)}</p>` : ''}
      ${filesCard}
      ${gamesCard}
      ${g && (isTaught || isNext) ? `<button class="tp-cta ${isTaught ? 'done' : ''}" data-push="register" data-g="${g.id}">${ic('ClipboardCheck')}${isTaught ? 'Taught ✓ · see attendance' : 'Take attendance and finish the lesson'}</button>
        <p class="tp-small">${isTaught ? `${esc(g.name)} is now on the next day.` : `When the lesson ends, it counts as taught and ${esc(g.name)} moves to the next day.`}</p>`
        : g ? `<p class="tp-small">${esc(g.name)} is on Week ${g.week} · Day ${g.les}.</p>${attAlt(g)}` : ''}
      <button class="tp-lrow ff-morerow" data-ffmore="${key}"><span class="ff-ic" style="background:#8E8E93">${ic('Ellipsis')}</span><span class="tx"><b>More</b><span>stay on lesson, two lessons, my files, edit</span></span><span class="tp-chev">${ic(open ? 'ChevronDown' : 'ChevronRight')}</span></button>
      ${moreBody}
    </div>`;
}
{
  const _k = scKids;
  scKids = function (f) { return ffPage(f) || _k(f); };
  const _h = home2Click;
  home2Click = function (b, d) {
    if (d.ffmore !== undefined) { const k = d.ffmore === 'home' ? 'ffmore' : 'ffm-' + d.ffmore; T.open[k] = !T.open[k]; draw(); return true; }
    return _h(b, d);
  };
}

{
  const _s = sheetSettings;
  sheetSettings = function (s) {
    return _s(s).replace('<button class="tp-lrow" data-sheet="copies">', `<button class="tp-lrow" data-sheet="extra">${ic('Package')}<span class="tx"><b>Extra charge</b><span>A book, a trip, an exam fee</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button><button class="tp-lrow" data-sheet="copies">`);
  };
}

/* ======================= B+ : Home with widgets (rings and numbers at a glance) ======================= */
const ffRing = (p, c, inner) => `<span class="ffring" style="--p:${Math.max(0, Math.min(100, Math.round(p)))};--c:${c}"><i>${inner}</i></span>`;
/* 11 Nov 2026 (user: "the widget does not say that the lesson is in about 1 hour, or in 30 hours and 30 minutes"):
   how long until a lesson starts. The Home lesson card shows it at the top right; on a day with no lesson left, ffUpNext shows
   the next lesson of any group with the same countdown. Home is redrawn every minute (clockRefresh), so it counts down by itself. */
const ffIn = (m) => (m < 60 ? `${Math.max(1, m)} min` : m < 2880 ? `${Math.floor(m / 60)} h${m % 60 ? ' ' + (m % 60) + ' min' : ''}` : `${Math.round(m / 1440)} days`);
function ffUpNext() {
  const now = nowMin(); let best = null;
  S.groups.forEach((g) => { if (!g.students.length && !g.solo) return;
    for (let i = 0; i < 60; i++) { const d = addDays(TODAY, i); if (!hasLesson(g, d)) continue; const m = i * 1440 + startMin(g, d) - now; if (m <= 0) continue; if (!best || m < best.m) best = { g, d, m, i }; break; } });
  if (!best) return '';
  const { g, d, m, i } = best, day = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${DAYS_LONG[wd(d)]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  return `<button class="ffup h-in" ${homeOpen(g)}><span class="ffup-ic" style="background:${hc(g)}">${ic('Clock')}</span><span class="tx"><b>Next lesson · ${esc(g.name)}</b><span>${day} · ${esc(timeOn(g, d))} – ${hm(endMin(g, d))}</span></span><span class="ffup-in">in ${ffIn(m)}</span></button>`;
}
function ffHero(g) {
  const D = TODAY, now = nowMin(), s = startMin(g, D), e = endMin(g, D), on = s <= now && !lessonEnded(g, D), cl = curLes(g), M = FFSYS[`${String(g.lvl).toLowerCase()}-w${cl.w}-l${cl.l}`];
  const pct = on ? ((now - s) / (e - s)) * 100 : 0, left = on ? e - now : 0, st = g.students.length;
  const unit = M ? M.label : lessonLine(g), book = M && M.book ? M.book.split(' · ')[0] : '';
  return `<div class="ffh h-in"><div class="ffh-top"><span class="ffh-tag">${on ? '<i class="live"></i>Now' : 'Next lesson'}</span><span class="ffh-when">${on ? 'ends in ' + inMin(left) : s > now ? 'in ' + ffIn(s - now) : esc(timeOn(g, D)) + ' – ' + hm(e)}</span></div>
    <div class="ffh-main"><div><b class="ffh-name">${esc(g.name)}</b><span class="ffh-sub">Week ${cl.w} · Day ${cl.l}${!on && s > now ? ' · ' + hm(s) + ' – ' + hm(e) : ''}</span></div>${ffRing(pct, '#fff', `<b>${on ? Math.round(pct) + '%' : hm(s)}</b>`)}</div>
    <div class="ffh-unit">${esc(unit)}</div>
    <div class="ffh-chips"><span>${ic('Users')}${st} students</span>${book ? `<span>${ic('BookOpen')}${esc(book)}</span>` : ''}</div>
    <button class="ffh-go" ${homeOpen(g)}>${ic('BookOpen')}Open lesson</button></div>`;
}

/* ======================= 12 Nov 2026 (user): today's lessons are a STACK of cards, like the iPhone widget stack =======================
   "When the first class is over I move on to the next group; to take the first class's attendance I had to go to Attendance."
   Now every lesson of today is a card in one stack on Home. The card on show is the lesson that is going (or next).
   Swipe UP on the card = the earlier class, swipe DOWN = the later one (his words). A class that is over has "Take attendance" on its card.
   All cards lie in one grid cell (so the stack has one height and nothing jumps); only "--i" (which card is on show) changes. */
function ffTodayList() { const D = TODAY; return S.groups.filter((g) => (g.students.length || g.solo) && (hasLesson(g, D) || kept(g, D))).sort((a, b) => startMin(a, D) - startMin(b, D)); }
function ffSideCard(g) { // a lesson of today that is not the one going: over (take its attendance) or later today
  const D = TODAY, now = nowMin(), s = startMin(g, D), e = endMin(g, D), over = lessonEnded(g, D), cl = curLes(g), saved = rec(g, D).saved, st = g.students.length;
  const reg = `data-push="register" data-g="${g.id}" data-date="${iso(D)}"`;
  return `<div class="ffh ${over ? 'past' : 'later'}"><div class="ffh-top"><span class="ffh-tag">${over ? 'Earlier today' : 'Later today'}</span><span class="ffh-when">${over ? hm(s) + ' – ' + hm(e) : 'in ' + ffIn(s - now)}</span></div>
    <div class="ffh-main"><div><b class="ffh-name">${esc(g.name)}</b><span class="ffh-sub">Week ${cl.w} · Day ${cl.l}${over ? '' : ' · ' + hm(s) + ' – ' + hm(e)}</span></div>${ffRing(over ? 100 : 0, '#fff', `<b>${over ? (saved ? '✓' : '!') : hm(s)}</b>`)}</div>
    <div class="ffh-unit">${over ? (saved ? `Attendance saved · ${regCount(g, D)} of ${st} here` : 'Attendance not taken yet') : esc(lessonLine(g))}</div>
    <div class="ffh-chips"><span>${ic('Users')}${st} students</span></div>
    ${over ? `<button class="ffh-go" ${reg}>${ic('ClipboardCheck')}${saved ? 'Open attendance' : 'Take attendance'}</button>` : `<button class="ffh-go" ${homeOpen(g)}>${ic('BookOpen')}Open lesson</button>`}</div>`;
}
function ffStack() {
  const L = ffTodayList(); if (!L.length) return '';
  const cur = ffNextGroup(), live = cur && !doneOn(cur, TODAY) ? L.indexOf(cur) : -1, def = live >= 0 ? live : L.length - 1, key = iso(TODAY) + '|' + (cur ? cur.id : '') + '|' + L.length;
  if (!T.ffst || T.ffst.key !== key) T.ffst = { key, i: def }; // a new lesson started (or the day changed): back to the lesson that is going
  const i = T.ffst.i = Math.max(0, Math.min(L.length - 1, T.ffst.i));
  if (L.length === 1) return `<div class="ffst one h-in">${live === 0 ? ffHero(L[0]) : ffSideCard(L[0])}</div>`;
  return `<div class="ffst h-in" data-ffst="${L.length}" style="--i:${i}"><div class="ffst-vp">${L.map((g, k) => `<div class="ffst-c" style="--k:${k}"${k === i ? '' : ' inert'}>${k === live ? ffHero(g) : ffSideCard(g)}</div>`).join('')}</div>
    <div class="ffst-dots" aria-hidden="true">${L.map((g, k) => `<i${k === i ? ' class="on"' : ''}></i>`).reverse().join('')}</div></div>`;
}
{ // the finger: the cards follow it; let go = the nearest card glides into place
  let st = null, sup = 0;
  const show = (el, i) => { el.style.setProperty('--i', i); [...el.querySelectorAll('.ffst-c')].forEach((c, k) => { if (k === i) c.removeAttribute('inert'); else c.setAttribute('inert', ''); }); const ds = [...el.querySelectorAll('.ffst-dots i')].reverse(); ds.forEach((d, k) => { if (k === i) d.className = 'on'; else d.removeAttribute('class'); }); };
  document.addEventListener('pointerdown', (e) => { const el = e.target.closest && e.target.closest('[data-ffst]'); if (!el || e.button > 0) return; st = { el, id: e.pointerId, x0: e.clientX, y0: e.clientY, n: +el.dataset.ffst, i0: T.ffst ? T.ffst.i : 0, on: false, h: el.querySelector('.ffst-c').offsetHeight + 30, pts: [] }; }, true);
  document.addEventListener('pointermove', (e) => {
    if (!st || e.pointerId !== st.id) return; const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
    if (!st.on) { if (Math.abs(dy) < 8) return; if (Math.abs(dy) < Math.abs(dx) * 1.2) { st = null; return; } st.on = true; st.el.classList.add('drag'); try { st.el.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } }
    let f = st.i0 + dy / st.h; if (f < 0) f = f / 3; if (f > st.n - 1) f = st.n - 1 + (f - (st.n - 1)) / 3; // past the first or last card: it only gives a little
    st.f = f; st.pts.push([e.timeStamp, e.clientY]); if (st.pts.length > 5) st.pts.shift();
    st.el.style.setProperty('--i', f.toFixed(4));
  }, true);
  const end = (e) => {
    if (!st || e.pointerId !== st.id) return; const s0 = st; st = null; if (!s0.on) return;
    s0.el.classList.remove('drag'); sup = Date.now();
    const a = s0.pts[0], b = s0.pts[s0.pts.length - 1], v = a && b && b[0] > a[0] ? (b[1] - a[1]) / (b[0] - a[0]) : 0; // finger speed, px per ms
    let to = Math.round(s0.f); if (Math.abs(v) > 0.35 && to === s0.i0) to = s0.i0 + (v > 0 ? 1 : -1); // a quick flick moves one card
    to = Math.max(0, Math.min(s0.n - 1, to));
    if (T.ffst) T.ffst.i = to; show(s0.el, to);
  };
  document.addEventListener('pointerup', end, true); document.addEventListener('pointercancel', end, true);
  document.addEventListener('click', (e) => { if (Date.now() - sup < 350 && e.target.closest && e.target.closest('[data-ffst]')) { e.stopPropagation(); e.preventDefault(); } }, true);
}
