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
function ffHero(g) {
  const D = TODAY, now = nowMin(), s = startMin(g, D), e = endMin(g, D), on = s <= now && !lessonEnded(g, D), cl = curLes(g), M = FFSYS[`${String(g.lvl).toLowerCase()}-w${cl.w}-l${cl.l}`];
  const pct = on ? ((now - s) / (e - s)) * 100 : 0, left = on ? e - now : 0, st = g.students.length;
  const unit = M ? M.label : lessonLine(g), book = M && M.book ? M.book.split(' · ')[0] : '';
  return `<div class="ffh h-in"><div class="ffh-top"><span class="ffh-tag">${on ? '<i class="live"></i>Now' : 'Next lesson'}</span><span class="ffh-when">${on ? 'ends in ' + inMin(left) : esc(timeOn(g, D)) + ' – ' + hm(e)}</span></div>
    <div class="ffh-main"><div><b class="ffh-name">${esc(g.name)}</b><span class="ffh-sub">Week ${cl.w} · Day ${cl.l}</span></div>${ffRing(pct, '#fff', `<b>${on ? Math.round(pct) + '%' : hm(s)}</b>`)}</div>
    <div class="ffh-unit">${esc(unit)}</div>
    <div class="ffh-chips"><span>${ic('Users')}${st} students</span>${book ? `<span>${ic('BookOpen')}${esc(book)}</span>` : ''}</div>
    <button class="ffh-go" ${homeOpen(g)}>${ic('BookOpen')}Open lesson</button></div>`;
}
