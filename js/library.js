'use strict';
/* NEXT part 5 (16 Nov) — the Library as a bookshelf (TRY; user: "not too difficult to access").
   Teens | Kids at the top, a search box, "Your groups use" first (the books your groups need now), then one shelf per level.
   Every book is one tap away (no level buttons to choose first). Tap a book = the same pop-up as before (Open / Add / Replace / Remove). */
T.libAud = T.libAud || 'teens';
const LB_KIDBOOKS = (l) => [`${l.name} Class Book.pdf`, `${l.name} Workbook.pdf`];
{ // kids books get their own covers, in the level's colour
  const _bm = bookMeta;
  bookMeta = function (f) {
    const k = KIDLV.find((l) => f.startsWith(l.name + ' '));
    if (k) { const wb = /Workbook/.test(f); return { pub: /Round-Up/i.test(k.name) ? 'PEARSON' : 'OXFORD', t: k.name, mk: wb ? 'WB' : 'CB', sub: wb ? 'Workbook' : 'Class Book', c: [(GRAD[k.id] || GRAD.own)[0], (GRAD[k.id] || GRAD.own)[1]] }; }
    return _bm(f);
  };
}
function lbShelves(kids) { // [{ id, name, books: [file] }]
  return kids ? KIDLV.map((l) => ({ id: l.id, name: l.name, books: LB_KIDBOOKS(l) })) : C.levels.map((l, i) => ({ id: l.id, name: LVNAME(l.id), books: (C.bookFiles[i] || []).map((f) => f[0]) }));
}
function lbBook(f) { const m = bookMeta(f), have = S.files[f]; return `<button class="lb-book${have ? '' : ' dim'}" data-book="${esc(f)}">${bookCover(f)}<b>${esc(m.t)}</b><small class="${have ? 'on' : ''}">${have ? 'On this phone' : esc(m.sub || 'Tap to add')}</small></button>`; }
function pgLibrary() {
  const kids = T.libAud === 'kids' && KIDLV.length, q = (T.libQ || '').trim().toLowerCase();
  const shelves = lbShelves(kids).map((s) => ({ ...s, books: s.books.filter((f) => !q || (bookMeta(f).t + ' ' + bookMeta(f).sub + ' ' + s.name).toLowerCase().includes(q)) })).filter((s) => s.books.length);
  const mine = [...new Set(S.groups.filter((g) => g.students.length).map((g) => g.lvl))];
  const yours = shelves.filter((s) => mine.includes(s.id)).flatMap((s) => s.books.map((f) => ({ f, s })));
  const users = (id) => S.groups.filter((g) => g.lvl === id && g.students.length).map((g) => (g.solo ? g.students[0].name : g.name));
  const shelf = (s) => `<div class="lb-shelf"><div class="lb-sh"><b><i style="background:${(GRAD[s.id] || GRAD.own)[1]}"></i>${esc(s.name)}</b><small>${users(s.id).length ? esc(users(s.id).join(', ')) : s.books.length + ' book' + (s.books.length === 1 ? '' : 's')}</small></div>
    <div class="lb-row" data-noswipe>${s.books.map(lbBook).join('')}</div><div class="lb-plank"></div></div>`;
  return `${nxHead('Library', kids ? 'Kids library' : 'Teens library')}
    <div class="lb-top"><div class="nx-seg big" data-noswipe><button class="${kids ? '' : 'on'}" data-nxlib="teens">${ic('GraduationCap')} Teens</button><button class="${kids ? 'on' : ''}" data-nxlib="kids">${ic('Star')} Kids</button></div></div>
    <label class="lb-search">${ic('Search')}<input id="lb-q" placeholder="Search books" value="${esc(T.libQ || '')}" autocomplete="off" data-noswipe></label>
    ${yours.length && !q ? `<div class="lb-yours"><div class="lb-sh"><b>${ic('Users')} Your groups use</b><small>${yours.length} book${yours.length === 1 ? '' : 's'}</small></div><div class="lb-row" data-noswipe>${yours.map((x) => lbBook(x.f)).join('')}</div></div>` : ''}
    ${shelves.map(shelf).join('') || '<p class="lb-empty">No book with that name.</p>'}
    <p class="nx-note c">Tap a book to open it. Add each PDF from your phone once; then it opens here, even offline.</p>`;
}
PAGES[3] = () => pgLibrary();
{
  const _h = home2Click;
  home2Click = function (b, d) { if (d.nxlib) { T.libAud = d.nxlib; T.libQ = ''; draw(); return true; } return _h(b, d); };
}
document.addEventListener('input', (e) => { if (e.target.id !== 'lb-q') return; T.libQ = e.target.value; const pos = e.target.selectionStart; draw(); const el = document.getElementById('lb-q'); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (err) { /* fine */ } } }, true);
