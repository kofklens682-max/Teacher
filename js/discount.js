'use strict';
/* Discounts (user, 4 Nov 2026): for a whole group or one student, for the months you choose only (for example only December),
   as a percent or a sum. For private students (price per lesson) the discount is on every lesson of those months:
   $10 a lesson, 50% in December = $5 a lesson in December, $10 again from January.
   S.pay.dsc = [{ id, gid, sid (null = the whole group), months: ['2026-12', ...], kind: 'pct' | 'sum', v }]
   chargeOf() takes the discount off, so the payment lists, Who still owes and Budget (it reads the charges from Teacher)
   all expect the lower amount for those months only. Loaded after people.js. */
const dscAll = () => (Array.isArray(S.pay.dsc) ? S.pay.dsc : (S.pay.dsc = []));
const dscFor = (g, s, ym) => dscAll().filter((d) => d.gid === g.id && (!d.sid || d.sid === s.id) && d.months.includes(ym));
const dscApply = (x, ds) => ds.reduce((a, d) => Math.max(0, d.kind === 'pct' ? Math.round((a * (100 - d.v)) / 100 / 1000) * 1000 : a - d.v), x);
const dscText = (d, single) => (d.kind === 'pct' ? `−${d.v}%` : `−${dMoney(d.v)} so'm`) + (single ? ' a lesson' : '');
const _chargeOf0 = chargeOf;
chargeOf = function (g, s, ym) { // eslint-disable-line no-global-assign
  const base = _chargeOf0(g, s, ym); if (!base) return base;
  const ds = dscFor(g, s, ym); if (!ds.length) return base;
  const P = S.pay, p = planOf(g) || {};
  if (p.kind === 'single') { // the discount is on the price of each lesson
    const came = lessonsCame(g, s, ym), fr = P.sfree && P.sfree[s.id + '|' + ym], free = fr === 'all' ? came : Math.min(came, +fr || 0), rate = P.stuFee[s.id] ?? p.rate ?? 0;
    return Math.max(0, (came - free) * dscApply(rate, ds) - ((P.sdisc && P.sdisc[s.id + '|' + ym]) || 0));
  }
  if (P.sfee && P.sfee[s.id + '|' + ym] != null) return base; // an own price typed for that month wins
  return dscApply(base, ds);
};
const dscExtra = (g, st, m) => (dscAll().length ? Math.max(0, _chargeOf0(g, st, m) - chargeOf(g, st, m)) : 0); // the month tiles show this discount too (bridge.js discOf)

/* ---------- the Discount sheet ---------- */
function sheetDisc(s) {
  const g = gById(s.g); if (!g) return '<p class="tp-small">This group is not here any more.</p>';
  const single = isSingle(g), p = planOf(g) || {}, F = s.f || (s.f = { sid: s.sid || null, months: [ymOf(TODAY)], kind: 'pct', v: 50 });
  const cur = ymOf(TODAY), months = []; for (let i = -1; i <= 6; i++) months.push(ymAdd(cur, i));
  const who = g.solo || g.students.length < 2 ? '' : `<div class="tp-f"><span>Who</span><div class="tp-chips2 dr-fill"><button class="${F.sid ? '' : 'on'}" data-dsw="">Whole group</button><button class="${F.sid ? 'on' : ''}" data-dsw="${esc((F.sid || g.students[0].id))}">One student</button></div>
    ${F.sid ? `<div class="ds-stu">${abc(g.students).map((st) => `<button class="${F.sid === st.id ? 'on' : ''}" data-dsw="${st.id}">${esc(st.name)}</button>`).join('')}</div>` : ''}</div>`;
  const st = F.sid ? stuOf(g, F.sid) : (g.solo || g.students.length === 1 ? g.students[0] : null);
  const normal = single ? (st ? S.pay.stuFee[st.id] ?? p.rate : p.rate) || 0 : (st ? baseFee(g, st) : p.fee) || 0;
  const after = dscApply(normal, F.v > 0 ? [{ kind: F.kind, v: F.v }] : []);
  const mlist = F.months.slice().sort().map(SHORT).join(', ') || 'no month chosen';
  const preview = `<div class="ds-prev h-in"><div><span>Normal${single ? ' · a lesson' : ''}</span><b>${dMoney(normal)}</b></div><i>${ic('ChevronRight')}</i><div class="on"><span>${esc(mlist)}</span><b>${dMoney(after)}</b></div></div>`;
  const list = dscAll().filter((d) => d.gid === g.id).map((d) => { const sn = d.sid ? (stuOf(g, d.sid) || {}).name || 'a student' : 'Whole group';
    return `<div class="ds-row"><span class="ds-badge">${esc(dscText(d, single))}</span><span class="tx"><b>${esc(sn)}</b><span>${d.months.slice().sort().map(ymLabel).join(', ')}</span></span><button class="tp-pill" data-dsrm="${d.id}">Remove</button></div>`; }).join('');
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>Discount · ${esc(g.name)}</b><button class="tp-back strong" data-dssave="${g.id}">Save</button></div>
    ${who}
    <div class="tp-f"><span>Months <small>(only these months are cheaper)</small></span><div class="ds-months">${months.map((m) => `<button class="${F.months.includes(m) ? 'on' : ''}" data-dsm="${m}"><b>${SHORT(m)}</b><small>${m.slice(0, 4)}</small></button>`).join('')}</div></div>
    <div class="tp-f"><span>How much${single ? ' off each lesson' : ''}</span><div class="tp-chips2 dr-fill"><button class="${F.kind === 'pct' ? 'on' : ''}" data-dsk="pct">Percent</button><button class="${F.kind === 'sum' ? 'on' : ''}" data-dsk="sum">Sum (so'm)</button></div>
    ${F.kind === 'pct' ? `<div class="tp-chips2 dr-fill ds-q">${[10, 25, 50, 100].map((v) => `<button class="${F.v === v ? 'on' : ''}" data-dsv="${v}">${v === 100 ? 'Free' : v + '%'}</button>`).join('')}</div>` : ''}
    <input id="f-dsv" class="ds-in" inputmode="numeric" value="${F.v ? (F.kind === 'pct' ? F.v : dMoney(F.v)) : ''}" placeholder="${F.kind === 'pct' ? '%' : "so'm"}" autocomplete="off" data-dsinput></div>
    ${preview}
    ${list ? `<div class="tp-f"><span>Discounts of ${esc(g.name)}</span><div class="ds-list">${list}</div></div>` : ''}
    <p class="tp-small">Budget expects the lower amount for these months only. The month after, the normal ${single ? 'price' : 'fee'} comes back by itself.</p>`;
}
SHEETS.disc = sheetDisc;
SHEETS.gdisc = (s) => sheetDisc(s); // the old "Discount" buttons open the new sheet

function discRead() { const F = T.sheet && T.sheet.f, el = document.getElementById('f-dsv'); if (F && el) F.v = Math.min(F.kind === 'pct' ? 100 : 1e9, +String(el.value).replace(/\D/g, '') || 0); return F; }
function discClick(b, d) {
  if (!T.sheet || (T.sheet.s !== 'disc' && T.sheet.s !== 'gdisc')) { if (d.dsrm === undefined) return false; }
  const F = T.sheet && T.sheet.f;
  if (d.dsw !== undefined) { discRead(); F.sid = d.dsw || null; draw(); return true; }
  if (d.dsm) { discRead(); const i = F.months.indexOf(d.dsm); if (i >= 0) F.months.splice(i, 1); else F.months.push(d.dsm); draw(); return true; }
  if (d.dsk) { discRead(); if (F.kind !== d.dsk) { F.kind = d.dsk; F.v = d.dsk === 'pct' ? 50 : 0; } draw(); return true; }
  if (d.dsv) { F.v = +d.dsv; draw(); return true; }
  if (d.dsrm) { const L = dscAll(), i = L.findIndex((x) => x.id === d.dsrm); if (i >= 0) { const [gone] = L.splice(i, 1); save(); draw(); toast('Discount removed'); T.undoDsc = gone; } return true; }
  if (d.dssave) {
    discRead(); const g = gById(d.dssave);
    if (!F.months.length) { toast('Choose at least one month'); return true; }
    if (!F.v) { toast(F.kind === 'pct' ? 'Type the percent' : 'Type the sum'); return true; }
    dscAll().push({ id: uid(), gid: g.id, sid: F.sid || (g.solo && g.students[0] ? g.students[0].id : null), months: F.months.slice().sort(), kind: F.kind, v: F.v });
    save(); closeSheetNow(); draw(); toast(`${F.kind === 'pct' ? F.v + '%' : dMoney(F.v) + " so'm"} off · ${F.months.slice().sort().map(SHORT).join(', ')}`); return true;
  }
  return false;
}
document.addEventListener('input', (e) => { if (e.target && e.target.dataset && e.target.dataset.dsinput !== undefined && T.sheet && T.sheet.f) { // live preview while typing
  const F = T.sheet.f, raw = +String(e.target.value).replace(/\D/g, '') || 0; F.v = Math.min(F.kind === 'pct' ? 100 : 1e9, raw);
  if (F.kind === 'sum') e.target.value = raw ? dMoney(raw) : '';
  const box = document.querySelector('.ds-prev .on b'); if (box) { const g = gById(T.sheet.g), single = isSingle(g), p = planOf(g) || {}, st = F.sid ? stuOf(g, F.sid) : (g.students.length === 1 ? g.students[0] : null);
    const normal = single ? (st ? S.pay.stuFee[st.id] ?? p.rate : p.rate) || 0 : (st ? baseFee(g, st) : p.fee) || 0; box.textContent = dMoney(dscApply(normal, F.v ? [{ kind: F.kind, v: F.v }] : [])); }
} });
{ const _fc = feesClick; feesClick = function (b, d) { return discClick(b, d) || _fc(b, d); }; } // eslint-disable-line no-global-assign
