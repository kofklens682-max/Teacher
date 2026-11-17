'use strict';
/* 17 Nov 2026 (user): "the Library: real covers (search the original cover, e.g. 4000 Essential Words) and books organized by name:
   a series one after another, not divided by Beginner, Elementary... Same for the kids' books."
   - Covers: media/covers/*.jpg (the publishers' real covers, 300 px wide, found by ISBN). bookCover() in app.js is a constant, so the
     picture goes in through bookMeta(): its first colour carries the background picture, and fix20.css hides the drawn title on it.
     Books with no real cover found (1000 Collocations, Grammar for Speaking, Basic IELTS Listening) keep the drawn cover.
   - Shelves = series (4000 Essential English Words 1-5, Grammar in Use, Vocabulary in Use, Cambridge IELTS...), each book once,
     in its natural order; under each book: which levels use it. "Your groups use" stays on top. */
(function () {
  if (typeof pgLibrary !== 'function') return;
  const COV = (f) => { const n = f.replace(/\.pdf$/i, ''); let m;
    if ((m = n.match(/4000 Essential English Words (\d)/))) return 'eew' + m[1];
    if (/Essential Grammar in Use/.test(n)) return 'essgiu4';
    if (/English Grammar in Use/.test(n)) return 'egu5';
    if (/Advanced Grammar in Use/.test(n)) return 'agiu3';
    if (/Vocabulary in Use Elementary/.test(n)) return 'evu-el';
    if (/Vocabulary in Use Pre-Int/.test(n)) return 'evu-pi';
    if (/Vocabulary in Use Upper-Int/.test(n)) return 'evu-ui';
    if (/Vocabulary in Use Advanced/.test(n)) return 'evu-adv';
    if ((m = n.match(/Cambridge IELTS (\d+)/)) && ['12', '14', '16', '17', '18', '19', '21'].includes(m[1])) return 'ielts' + m[1];
    if (/IELTS Trainer 2/.test(n)) return 'trainer2';
    if (/Official Cambridge Guide/.test(n)) return 'ocgi';
    if (/Stories for Reproduction 1/.test(n)) return 'sfr1';
    if ((m = n.match(/^Family and Friends ([2-5]) (Class Book|Workbook)/))) return (m[2] === 'Workbook' ? 'ffwb' : 'ffcb') + m[1];
    if (/^Round-Up Starter/.test(n)) return 'ru';
    return null; };
  const _bm = bookMeta;
  bookMeta = function (f) {
    const b = _bm.apply(this, arguments), k = COV(f); if (!k) return b;
    return { ...b, cover: k, c: [`${b.c[0]};background:#E5E5EA url(media/covers/${k}.jpg) center/cover no-repeat`, b.c[1]] };
  };

  // the series: [name, test, order of a book inside the series, short name of the book]
  const SERIES = [
    ['4000 Essential English Words', /4000 Essential English Words/, (n) => +n.match(/(\d)\s*$/)[1], (n) => 'Book ' + n.match(/(\d)\s*$/)[1]],
    ['Grammar in Use · Murphy', /Grammar in Use/, (n) => (/Essential/.test(n) ? 1 : /^English/.test(n) ? 2 : 3), (n) => (/Essential/.test(n) ? 'Essential · red' : /^English/.test(n) ? 'English · blue' : 'Advanced')],
    ['Vocabulary in Use', /Vocabulary in Use/, (n) => (/Elementary/.test(n) ? 1 : /Pre-Int/.test(n) ? 2 : /Upper-Int/.test(n) ? 3 : 4), (n) => (/Elementary/.test(n) ? 'Elementary' : /Pre-Int/.test(n) ? 'Pre-Int & Int' : /Upper-Int/.test(n) ? 'Upper-Int' : 'Advanced')],
    ['Cambridge IELTS', /Cambridge IELTS|IELTS Trainer|Official Cambridge Guide/, (n) => { const m = n.match(/Cambridge IELTS (\d+)/); return m ? +m[1] : /Trainer/.test(n) ? 100 : 101; }, (n) => { const m = n.match(/Cambridge IELTS (\d+)/); return m ? 'IELTS ' + m[1] : /Trainer/.test(n) ? 'IELTS Trainer 2' : 'Official Guide'; }],
    ['IELTS skills', /Grammar for Speaking|Basic IELTS Listening|collocations/i, (n) => (/Speaking/.test(n) ? 1 : /Listening/.test(n) ? 2 : 3), (n) => (/Speaking/.test(n) ? 'Grammar for Speaking' : /Listening/.test(n) ? 'Basic Listening' : '1000 Collocations')],
    ['Reading', /Stories for Reproduction/, () => 1, () => 'Stories for Reproduction 1'],
    ['Family and Friends', /^Family and Friends/, (n) => +n.match(/Friends (\d)/)[1] * 2 + (/Workbook/.test(n) ? 1 : 0), (n) => 'Level ' + n.match(/Friends (\d)/)[1] + ' · ' + (/Workbook/.test(n) ? 'Workbook' : 'Class Book')],
    ['Round-Up', /^Round-Up/, (n) => (/Workbook/.test(n) ? 2 : 1), (n) => 'Starter · ' + (/Workbook/.test(n) ? 'Workbook' : 'Class Book')],
  ];
  const SHORT_LV = { A1: 'Beginner', A2: 'Elementary', B1: 'Pre-Int', 'B1+': 'Int', B2: 'Upper-Int', I1: 'IELTS 5.5', I2: 'IELTS 7+' };
  const COLS = ['#30D158', '#0A84FF', '#FF9F0A', '#FF453A', '#BF5AF2', '#FF375F', '#FFD60A'];
  function seriesOf(kids) { // [{ name, col, books: [{ f, vol, lv: [level ids] }] }]
    const lv = {}; lbShelves(kids).forEach((s) => s.books.forEach((f) => { (lv[f] = lv[f] || []).includes(s.id) || lv[f].push(s.id); }));
    const out = SERIES.map(([name], i) => ({ name, col: COLS[i % COLS.length], books: [] })), other = { name: 'Other books', col: '#8E8E93', books: [] };
    Object.keys(lv).forEach((f) => { const n = f.replace(/\.pdf$/i, ''), i = SERIES.findIndex((s) => s[1].test(n));
      const b = { f, lv: lv[f], vol: i >= 0 ? SERIES[i][3](n) : bookMeta(f).t, o: i >= 0 ? SERIES[i][2](n) : 0 }; (i >= 0 ? out[i] : other).books.push(b); });
    out.forEach((s) => s.books.sort((a, b) => a.o - b.o)); other.books.sort((a, b) => a.vol.localeCompare(b.vol));
    return out.concat(other).filter((s) => s.books.length);
  }
  const lvText = (ids, kids) => (kids ? '' : ids.map((id) => SHORT_LV[id] || LVNAME(id)).join(' · '));
  function card(b, kids) {
    const have = S.files[b.f];
    const [v1, v2] = kids && b.vol.includes(' · ') ? b.vol.split(' · ') : [b.vol, lvText(b.lv, kids)];
    return `<button class="lb-book${have ? '' : ' dim'}" data-book="${esc(b.f)}">${bookCover(b.f)}<b>${esc(v1)}</b>${v2 ? `<small>${esc(v2)}</small>` : ''}${have ? '<small class="on">On this phone</small>' : ''}</button>`;
  }
  pgLibrary = function () {
    const kids = T.libAud === 'kids' && KIDLV.length, q = (T.libQ || '').trim().toLowerCase();
    const all = seriesOf(kids);
    const series = all.map((s) => ({ ...s, books: s.books.filter((b) => !q || (s.name + ' ' + b.vol + ' ' + bookMeta(b.f).t + ' ' + lvText(b.lv, false)).toLowerCase().includes(q)) })).filter((s) => s.books.length);
    const mine = [...new Set(S.groups.filter((g) => g.students.length).map((g) => g.lvl))];
    const yours = all.flatMap((s) => s.books).filter((b) => b.lv.some((id) => mine.includes(id)));
    const shelf = (s) => `<div class="lb-shelf"><div class="lb-sh"><b><i style="background:${s.col}"></i>${esc(s.name)}</b><small>${s.books.length} book${s.books.length === 1 ? '' : 's'}</small></div>
      <div class="lb-row" data-noswipe>${s.books.map((b) => card(b, kids)).join('')}</div><div class="lb-plank"></div></div>`;
    return `${nxHead('Library', kids ? 'Kids library' : 'Teens library')}
      <div class="lb-top"><div class="nx-seg big" data-noswipe><button class="${kids ? '' : 'on'}" data-nxlib="teens">${ic('GraduationCap')} Teens</button><button class="${kids ? 'on' : ''}" data-nxlib="kids">${ic('Star')} Kids</button></div></div>
      <label class="lb-search">${ic('Search')}<input id="lb-q" placeholder="Search books" value="${esc(T.libQ || '')}" autocomplete="off" data-noswipe></label>
      ${yours.length && !q ? `<div class="lb-yours"><div class="lb-sh"><b>${ic('Users')} Your groups use</b><small>${yours.length} book${yours.length === 1 ? '' : 's'}</small></div><div class="lb-row" data-noswipe>${yours.map((b) => card(b, kids)).join('')}</div></div>` : ''}
      ${series.map(shelf).join('') || '<p class="lb-empty">No book with that name.</p>'}
      <p class="nx-note c">Tap a book to open it. Add each PDF from your phone once; then it opens here, even offline.</p>`;
  };
})();
