'use strict';
/* DRAFT (27 Oct 2026): the new Home you can arrange yourself, the group page, "Mark paid" with date and payer,
   extra charges (a book, a trip...), and past lessons for private students. Loaded after fees.js (it replaces a few of its functions). */

Object.assign(ICONS, {
  Sliders: '<line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/>',
  ArrowUp: '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  ArrowDown: '<path d="M12 5v14"/><path d="m19 12-7 7-7-7"/>',
  Eye: '<path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0"/><circle cx="12" cy="12" r="3"/>',
  EyeOff: '<path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c4.5 0 8.4 2.6 10 7a10.7 10.7 0 0 1-1.67 2.68"/><path d="M6.61 6.61A10.7 10.7 0 0 0 2 12c1.6 4.4 5.5 7 10 7a10.6 10.6 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/>',
  Package: '<path d="M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z"/><path d="M12 22V12"/><path d="m3.3 7 8.7 5 8.7-5"/>',
  Calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
});

const SHORT = (ym) => MONTHS[+ym.slice(5) - 1].slice(0, 3);
const PIE = ['#3D5AFE', '#12B76A', '#F79009', '#E5484D', '#8E3BD9', '#14B8A6', '#FF6B9A', '#32ADE6', '#C9A400', '#7B61FF', '#FF8A4C', '#0F766E'];
const MAXAHEAD = 24; // months into the future you can look at and pay for

/* ---------- small changes to the payment rules ---------- */
function firstMonth(g, s) { // private students pay per lesson, so every month since the start counts (an empty month costs nothing)
  if (isSingle(g)) return S.pay.start;
  return [S.pay.start, ymOf(new Date(g.created || Date.now())), s.added ? ymOf(new Date(s.added)) : ''].sort().pop();
}
const rateOf = (g) => (planOf(g) || {}).rate || 0;
const nLes = (n) => n + (n === 1 ? ' lesson' : ' lessons');
const owedLessons = (g, L) => Math.ceil(L.debt / (rateOf(g) || 1));
function rowTextSingle(g, L) { // private: the money counts lessons
  const last = L.mine[L.mine.length - 1], when = last ? ' · ' + dDate(last.date) + byText(last) : '', r = rateOf(g) || 1;
  if (L.debt > 0) return `${nLes(owedLessons(g, L))} owed · ${dMoney(L.debt)}${when}`;
  if (L.credit > 0) return `Paid ahead: ${nLes(Math.floor(L.credit / r))}${when}`;
  return L.cur.charge ? `${nLes(Math.round(L.cur.charge / r))} paid${when}` : 'No lessons this month yet';
}
function owesText(g, s, L) {
  const m = L.rows.filter((r) => r.charge - r.covered > 0);
  return isSingle(g) ? `${nLes(owedLessons(g, L))} owed · ${dMoney(L.debt)}` : `${m.map((r) => SHORT(r.m)).join(', ')} · ${dMoney(L.debt)}`;
}
const byText = (p) => (p && p.by ? ' · by ' + p.by.toLowerCase() : '');
function rowText(g, L) { // used by the Fees screen
  if (isSingle(g)) return rowTextSingle(g, L);
  const c = L.cur, m = L.rows.filter((r) => r.charge - r.covered > 0).map((r) => SHORT(r.m)).join(', '), last = L.mine[L.mine.length - 1], when = last ? ' · ' + dDate(last.date) + byText(last) : '';
  switch (L.st) {
    case 'paid': return `${dMoney(c.charge)}${when}`;
    case 'credit': return `${dMoney(c.charge)} + ${dMoney(L.credit)} for next month${when}`;
    case 'prepaid': return `Paid ahead${when}`;
    case 'part': return `${dMoney(L.debt)} still owed (${m})${when}`;
    case 'unpaid': return `${m} · ${dMoney(L.debt)} owed`;
    default: return isSingle(g) ? 'No lessons this month yet' : 'No charge this month';
  }
}

/* ---------- Home: you choose what you see, and in which order ---------- */
const HOME_SECS = [['paid', 'Who paid (pie)'], ['owe', 'Who has not paid (groups)'], ['extras', 'Extra charges'], ['groups', 'Students by group'], ['today', 'Today']];
function homeCfg() {
  const c = S.homeCfg || (S.homeCfg = {});
  if (!Array.isArray(c.order)) c.order = [];
  c.order = c.order.filter((id) => HOME_SECS.some((x) => x[0] === id)); HOME_SECS.forEach((x) => { if (!c.order.includes(x[0])) c.order.push(x[0]); });
  if (!Array.isArray(c.hide)) c.hide = [];
  return c;
}
const card = (title, right, body) => `<div class="tp-sec dr-sec"><h4>${title}</h4>${right ? `<span>${right}</span>` : ''}</div>${body}`;
const grpColor = (g) => PIE[S.groups.indexOf(g) % PIE.length];

const monthNav = () => { const ym = payState().ym, cur = ymOf(TODAY); return `<div class="h2-mn"><button class="tp-iconbtn" data-paymonth="-1" ${ym <= S.pay.start ? 'disabled' : ''} aria-label="Previous month">${ic('ChevronLeft')}</button><b>${ymName(ym)}</b><button class="tp-iconbtn" data-paymonth="1" ${ym >= ymAdd(cur, MAXAHEAD) ? 'disabled' : ''} aria-label="Next month">${ic('ChevronRight')}</button></div>`; };
function secPaid() { // the big picture: how many students, who paid, who did not
  const ym = payState().ym, gs = feeGroups();
  if (!gs.length) return card('Who paid', '', `<div class="tp-card2"><div class="h" style="color:#12B76A">${ic('Wallet')}Fees</div><p>Set the monthly fee (or the price per lesson) in <b>Edit group</b>, and the app shows who paid.</p></div>`);
  const sc = statusCounts(ym), no = sc.part + sc.unpaid, mn = MONTHS[+ym.slice(5) - 1];
  return card('Who paid', monthNav(), `<div class="h2-card h2-pie">${donut([[sc.ok, STC.paid], [no, STC.unpaid]], 150, 22, `<b>${sc.n}</b><span>students</span>`)}
    <div class="h2-key"><div><i style="background:${STC.paid}"></i><b>${sc.ok}</b><span><strong>Paid</strong>${mn} is paid</span></div><div><i style="background:${STC.unpaid}"></i><b>${no}</b><span><strong>Not paid</strong>still owe for ${mn} or before</span></div></div></div>`);
}
function oweRows(g, ym) { // students of one group who have not paid, longest overdue first
  const r = []; g.students.forEach((s) => { const L = ledger(g, s, ym); if (L.debt > 0) r.push({ g, s, L, m: L.rows.filter((x) => x.charge - x.covered > 0) }); });
  return r.sort((x, y) => y.m.length - x.m.length || y.L.debt - x.L.debt);
}
function secOwe() { // groups, not people: tap a group to see who has not paid
  const ym = payState().ym, mn = MONTHS[+ym.slice(5) - 1], sc = statusCounts(ym);
  const gs = feeGroups().map((g) => ({ g, rows: oweRows(g, ym), c: sc.per[g.id] })).filter((x) => x.c && x.c.n).sort((x, y) => y.rows.length - x.rows.length || y.rows.filter((r) => r.m.length > 1).length - x.rows.filter((r) => r.m.length > 1).length);
  if (!gs.length) return '';
  const tile = ({ g, rows, c }) => { const late = rows.filter((r) => r.m.length >= 2).length;
    return `<button class="h2-og ${rows.length ? '' : 'done'}" style="${gvg(g)}" data-sheet="owegrp" data-g="${g.id}"><span class="top">${groupTile(g)}${late ? `<em class="late">${late} overdue</em>` : ''}</span><b class="nm">${esc(g.name)}</b>
      ${rows.length ? `<span class="big"><b>${rows.length}</b> not paid</span>` : `<span class="big ok">${ic('Check')}All paid</span>`}${stack(c)}<span class="f">${c.paid + c.credit} of ${c.n} paid</span></button>`; };
  return card('Who has not paid', mn, `<div class="h2-ogs">${gs.map(tile).join('')}</div>`);
}
function sheetOweGrp(s) {
  const g = gById(s.g), ym = payState().ym, mn = MONTHS[+ym.slice(5) - 1]; if (!g) return '';
  const rows = oweRows(g, ym), late = rows.filter((r) => r.m.length >= 2), now = rows.filter((r) => r.m.length < 2);
  // the row opens the student's months; the tick records a payment in Budget with this student chosen
  const row = (r) => `<div class="h2-ow ${r.m.length >= 3 ? 'bad' : r.m.length === 2 ? 'late' : 'new'}"><button class="h2-owm" data-sheet="payrec" data-g="${r.g.id}" data-sid="${r.s.id}"><span class="bar"></span><span class="tx"><b>${esc(r.s.name)}</b><span class="mo">${r.m.map((x) => `<u>${SHORT(x.m)}</u>`).join('')}</span></span><span class="amt"><b>${dMoney(r.L.debt)}</b><em>so'm</em></span></button><button class="ok" data-bpopen="${r.s.id}|${r.g.id}" aria-label="Record ${esc(r.s.name)}'s payment in Budget">${ic('Check')}</button></div>`;
  return `<div class="tp-sh-h"><span></span><b>${esc(g.name)}</b><button class="tp-back strong" data-closesheet>Done</button></div>
    ${rows.length ? '' : `<div class="tp-empty2">${ic('Check')}<b>Everybody has paid</b><span>Nothing is owed in ${mn}.</span></div>`}
    ${late.length ? `<div class="h2-grp"><span class="d bad"></span>Overdue · 2 months or more<em>${late.length}</em></div><div class="h2-ows">${late.map(row).join('')}</div>` : ''}
    ${now.length ? `<div class="h2-grp"><span class="d"></span>Not paid for ${mn}<em>${now.length}</em></div><div class="h2-ows">${now.map(row).join('')}</div>` : ''}`;
}
function secToday() {
  const todays = S.groups.filter((g) => hasLesson(g, TODAY)).sort((x, y) => x.time.localeCompare(y.time));
  const nextId = (todays.find((g) => startMin(g) + 80 > nowMin() && !taughtOn(g, TODAY)) || {}).id;
  const cnt = todays.reduce((n, g) => n + g.students.length, 0);
  const rows = todays.map((g) => {
    const u = planned(g.lvl) ? weekOf(g.lvl, g.week) : null, done = taughtOn(g, TODAY) || (S.ownDone[g.id] || {})[iso(TODAY)];
    return `<div class="dr-row${g.id === nextId ? ' next' : ''}" style="${gvg(g)}"><button class="dr-main" ${openLessonAttr(g)}><span class="tmp">${esc(g.time)}</span><span class="tx"><b>${esc(g.name)}${g.id === nextId ? ' <em>Next</em>' : ''}</b><span>${u ? `Week ${g.week} · ${dayWord(g.lvl)} ${g.les}` : esc(LVNAME(g.lvl))}</span></span><span class="dr-cnt">${ic('Users')}${g.students.length}</span></button>
      ${done ? `<span class="dr-done" title="Taught">${ic("Check")}</span>` : `<button class="dr-reg" data-push="register" data-g="${g.id}" aria-label="Attendance">${ic("ClipboardCheck")}</button>`}</div>`;
  }).join('');
  return card('Today', `${todays.length} lesson${todays.length === 1 ? '' : 's'} · ${cnt} students`, todays.length ? `<div class="dr-list">${rows}</div>` : `<div class="tp-empty2">${ic('CalendarDays')}<b>No lessons today</b><span>Enjoy the day.</span></div>`);
}
const xStu = (x) => { const g = gById(x.gid); return g ? g.students.filter((s) => (x.sids || []).includes(s.id)) : []; };
const xPaidN = (x) => xStu(x).filter((s) => S.pay.xpaid[x.id + '|' + s.id]).length;
function secExtras() {
  const ex = S.pay.extras, rows = ex.map((x) => { const n = xStu(x).length, p = xPaidN(x), g = gById(x.gid);
    return `<button class="h2-ex" data-sheet="extradet" data-key="${x.id}"><span class="ico">${ic('Package')}</span><span class="tx"><b>${esc(x.name)}</b><span>${g ? esc(g.name) : ''} · ${dMoney(x.amount)} each · ${dDate(x.date)}</span></span><span class="r"><b>${p}/${n}</b><i><u style="width:${n ? (p / n) * 100 : 0}%"></u></i></span></button>`; }).join('');
  return card('Extra charges', '', `<div class="h2-exs">${rows}<button class="tp-dashed" style="margin-top:${ex.length ? 4 : 0}px" data-sheet="extra">${ic('Plus')} ${ex.length ? 'Add another charge' : 'Add an extra charge (a book, a trip, an exam...)'}</button></div>`);
}
function secGroups() {
  const gs = S.groups.filter((g) => g.students.length), total = gs.reduce((n, g) => n + g.students.length, 0);
  return card('Students by group', `${total} students`, `<div class="dr-over">${donut(gs.map((g) => [g.students.length, grpColor(g)]), 138, 18, `<b>${total}</b><span>students</span>`)}
    <div class="dr-pl h2-leg">${[...gs].sort((a, b) => b.students.length - a.students.length).map((g) => `<div><i style="background:${grpColor(g)}"></i>${esc(g.name)}<b>${g.students.length}</b></div>`).join('')}</div></div>`);
}
const SECS = { paid: secPaid, owe: secOwe, today: secToday, extras: secExtras, groups: secGroups };
function pgHomeNew() {
  if (!S.groups.length) return pgHome();
  const day = `${DAYS_LONG[wd(TODAY)]} ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]}`, cfg = homeCfg();
  const head = `<div class="tp-hdr"><div><div class="tp-eyebrow">${day}</div><div class="tp-lt">Home</div></div>
    <div class="hdr-btns"><button class="tp-avatar" data-sheet="settings" aria-label="Profile and settings">${initials(profileGet().name) || ic('UserRound')}</button><button class="tp-roundbtn" data-sheet="group" aria-label="New group">${ic('Plus')}</button></div></div>`;
  const quick = `<div class="h2-quick"><button data-bpopen="|">${ic('Wallet')}Record a payment</button><button data-sheet="extra">${ic('Package')}Extra charge</button><button data-sheet="homecfg">${ic('Sliders')}Arrange Home</button></div>`;
  return head + quick + cfg.order.filter((id) => !cfg.hide.includes(id)).map((id) => SECS[id]()).join('');
}
function sheetHomeCfg() {
  const cfg = homeCfg();
  return `<div class="tp-sh-h"><span></span><b>Arrange Home</b><button class="tp-back strong" data-closesheet>Done</button></div>
    <p class="tp-small">Switch parts on or off and move them up or down. Home changes right behind this window.</p>
    <div class="h2-cfg">${cfg.order.map((id, i) => { const off = cfg.hide.includes(id), name = HOME_SECS.find((x) => x[0] === id)[1];
      return `<div class="${off ? 'off' : ''}"><button class="eye" data-cfgeye="${id}" aria-label="${off ? 'Show' : 'Hide'} ${name}">${ic(off ? 'EyeOff' : 'Eye')}</button><b>${name}</b><button data-cfgup="${id}" ${i === 0 ? 'disabled' : ''} aria-label="Move up">${ic('ArrowUp')}</button><button data-cfgdown="${id}" ${i === cfg.order.length - 1 ? 'disabled' : ''} aria-label="Move down">${ic('ArrowDown')}</button></div>`; }).join('')}</div>
    <button class="tp-dashed" data-cfgreset>Back to the standard order</button>`;
}

/* ---------- Mark paid: how much, on which day, who paid ---------- */
const BYS = ['Student', 'Mother', 'Father', 'Someone else'];
function dateChips(sel) {
  const opts = [0, 1, 2, 3].map((n) => [iso(addDays(TODAY, -n)), n === 0 ? 'Today' : n === 1 ? 'Yesterday' : n + ' days ago']), known = opts.some((o) => o[0] === sel);
  return `<div class="tp-chips2 dr-fill">${opts.map(([k, t]) => `<button class="${sel === k ? 'on' : ''}" data-paydate="${k}">${t}</button>`).join('')}<button class="${known ? '' : 'on'}" data-paydate="pick">${ic('Calendar')}${known ? 'Another day' : dDate(sel)}</button></div>
    ${known ? '' : `<input id="f-paydt" class="h2-date" type="date" max="${iso(TODAY)}" value="${sel}">`}`;
}
function byChips(s) { return `<div class="tp-chips2 dr-fill">${BYS.map((b) => `<button class="${s.by === b ? 'on' : ''}" data-payby="${b}">${b}</button>`).join('')}</div>${s.by === 'Someone else' ? `<input id="f-payby" class="h2-date" placeholder="Who paid? (name)" value="${esc(s.byName || '')}" autocomplete="off">` : ''}`; }
const byValue = (s) => (s.by === 'Someone else' ? (s.byName || '').trim() || 'Someone else' : s.by || 'Student');
function coverMonths(g, st, amt) { // which months this payment would cover
  if (!amt) return [];
  const H = ymAdd(ymOf(TODAY), MAXAHEAD + 2), a = ledger(g, st, H).rows.map((r) => r.covered);
  S.pay.pays.push({ id: '_tmp', sid: st.id, date: iso(TODAY), amount: amt }); const b = ledger(g, st, H).rows; S.pay.pays.pop();
  return b.filter((r, i) => r.covered > a[i]).map((r) => r.m);
}
function coverLine(g, st, amt) {
  if (isSingle(g)) { const r = rateOf(g) || 1, n = Math.floor(amt / r), rest = amt - n * r; return amt ? `${ic('Check')}This pays for <b>${nLes(n)}</b>${rest ? ` and ${dMoney(rest)} towards the next one` : ''}` : '<span>Type how much was paid.</span>'; }
  const m = coverMonths(g, st, amt);
  return m.length ? `${ic('Check')}This pays for <b>${m.length > 3 ? SHORT(m[0]) + ' to ' + SHORT(m[m.length - 1]) : m.map(SHORT).join(', ')}</b>` : `<span>Type how much was paid.</span>`;
}
function keepPay() {
  const s = T.sheet; if (!s) return;
  const a = document.getElementById('f-payamt'), d = document.getElementById('f-paydisc'), b = document.getElementById('f-payby');
  if (a) s.amt = a.value; if (d) s.disc = d.value; if (b) s.byName = b.value;
}
function sheetPayRec(s) {
  const g = gById(s.g), st = g && g.students.find((x) => x.id === s.sid); if (!st) return '<p class="tp-small">This student is not in the group any more.</p>';
  const ym = payState().ym, L = ledger(g, st, ym), c = L.cur, sd = S.pay.sdisc[st.id + '|' + ym] || 0, gd = S.pay.disc[g.id + '|' + ym] || 0;
  s.date = s.date || iso(TODAY); s.by = s.by || 'Student';
  const want = L.debt > 0 ? L.debt : c.charge, amt = s.amt !== undefined ? s.amt : want || '';
  const hist = L.mine.slice(-4).reverse().map((p) => `<div class="dr-hist"><span>${dDate(p.date)}${byText(p)}</span><b>${dMoney(p.amount)}</b><button class="dr-del${s.del === p.id ? ' sure' : ''}" data-paydel="${p.id}" aria-label="Remove this payment">${s.del === p.id ? 'Tap again to remove' : ic('X')}</button></div>`).join('');
  const fill = [];
  if (L.debt > 0) fill.push([L.debt, 'What is owed']); if (!isSingle(g) && c.charge && !(L.debt > 0 && L.debt === c.charge)) fill.push([c.charge, 'One month']);
  if (isSingle(g)) { fill.push([rateOf(g) * 4, '4 lessons']); fill.push([rateOf(g) * 8, '8 lessons']); }
  else if (c.charge) { fill.push([c.charge * 2, 'Two months']); fill.push([c.charge * 3, 'Three months']); }
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>${esc(st.name)}</b><button class="tp-back strong" data-paygo="${st.id}|${g.id}">Save</button></div>
    <div class="dr-sum small"><div class="dr-s3"><div><span>${isSingle(g) ? lessonsCame(g, st, ym) + ' lessons' : 'Fee'} · ${SHORT(ym)}</span><b>${dMoney(c.charge)}</b></div><div><span>Paid</span><b>${dMoney(c.covered)}</b></div><div><span>${L.debt > 0 ? 'Owes' : 'Credit'}</span><b>${dMoney(L.debt > 0 ? L.debt : L.credit)}</b></div></div>
    ${L.debt > 0 ? `<div class="dr-s4">${isSingle(g) ? nLes(owedLessons(g, L)) + ' not paid yet' : 'Not paid yet: ' + L.rows.filter((r) => r.charge - r.covered > 0).map((r) => ymName(r.m)).join(', ')}</div>` : ''}${gd || sd ? `<div class="dr-s4">Discount in ${MONTHS[+ym.slice(5) - 1]}: −${dMoney(gd + sd)}${gd ? ' (group)' : ''}</div>` : ''}</div>
    <label class="tp-f"><span>Amount received (so'm)</span><input id="f-payamt" inputmode="numeric" value="${amt}" placeholder="0" autocomplete="off"></label>
    <div class="tp-chips2 dr-fill">${fill.map(([v, t]) => `<button data-payfill="${v}">${t}</button>`).join('')}<button data-payfill="0">Clear</button></div>
    <div class="h2-cov" id="h2-cov">${coverLine(g, st, +String(amt).replace(/\D/g, '') || 0)}</div>
    <div class="tp-f"><span>When was it paid?</span>${dateChips(s.date)}</div>
    <div class="tp-f"><span>Who paid?</span>${byChips(s)}</div>
    ${isSingle(g) ? '' : `<label class="tp-f"><span>Discount for this student, ${MONTHS[+ym.slice(5) - 1]} only (optional)</span><input id="f-paydisc" inputmode="numeric" value="${s.disc !== undefined ? s.disc : sd || ''}" placeholder="0" autocomplete="off"></label>`}
    <p class="tp-small">${isSingle(g) ? 'Private students pay for each lesson they come to (' + dMoney(rateOf(g)) + ' each). Money paid ahead is kept for the next lessons.' : 'More than one month is fine: it covers the oldest unpaid month first, then the next ones.'} After you save, Budget asks whether to add the money.</p>
    ${hist ? `<div class="tp-sec"><h4>Last payments</h4></div><div class="dr-hl">${hist}</div>` : ''}`;
}
function sheetPayPick(s) {
  const gs = feeGroups(), ym = payState().ym;
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>Who paid?</b><span></span></div>
    ${gs.map((g) => `<div class="dr-gsec" style="${gvg(g)}"><div class="dr-gh"><span class="dot"></span><div><b>${esc(g.name)}</b></div></div><div class="dr-sl">${g.students.map((st) => { const L = ledger(g, st, ym);
      return `<button class="dr-stu" data-sheet="payrec" data-g="${g.id}" data-sid="${st.id}"><span class="dr-av st-${PST[L.st][1]}" style="background:${avColor(st.name)}">${esc(st.name[0])}</span><span class="tx"><b>${esc(st.name)}</b><span>${esc(rowText(g, L))}</span></span><span class="dr-pill ${PST[L.st][1]}">${PST[L.st][0]}</span></button>`; }).join('')}</div></div>`).join('')}`;
}

/* ---------- Extra charges ---------- */
const X_IDEAS = ['Book', 'Workbook', 'Trip', 'Exam fee', 'Materials'];
function sheetExtra(s) {
  if (!s.form) { const x = s.key && S.pay.extras.find((e) => e.id === s.key), g0 = x ? gById(x.gid) : feeGroups()[0] || S.groups[0];
    s.form = x ? { name: x.name, amount: x.amount, gid: x.gid, sids: [...x.sids], date: x.date } : { name: '', amount: '', gid: g0.id, sids: g0.students.map((t) => t.id), date: iso(TODAY) }; }
  const F = s.form, g = gById(F.gid);
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>${s.key ? 'Edit charge' : 'Extra charge'}</b><button class="tp-back strong" data-xsave>Save</button></div>
    <label class="tp-f"><span>What is it for?</span><input id="f-xn" value="${esc(F.name)}" placeholder="e.g. Family and Friends 3 book" autocomplete="off"></label>
    <div class="tp-chips2 dr-fill">${X_IDEAS.map((t) => `<button data-xname="${t}">${t}</button>`).join('')}</div>
    <label class="tp-f"><span>Price for each student (so'm)</span><input id="f-xa" inputmode="numeric" value="${F.amount || ''}" placeholder="0" autocomplete="off"></label>
    <div class="tp-f"><span>Which group?</span><div class="tp-chips2">${S.groups.map((x) => `<button class="${F.gid === x.id ? 'on' : ''}" style="${gvg(x)}" data-xg="${x.id}">${esc(x.name)}</button>`).join('')}</div></div>
    <div class="tp-f"><span>Who must pay · ${F.sids.length} of ${g.students.length}</span><div class="tp-chips2">${g.students.map((t) => `<button class="${F.sids.includes(t.id) ? 'on' : ''}" data-xs="${t.id}">${esc(t.name)}</button>`).join('')}</div>
      <div class="tp-chips2 dr-fill"><button data-xall="1">Everyone</button><button data-xall="0">Nobody</button></div></div>
    <label class="tp-f"><span>Date</span><input id="f-xd" class="h2-date" type="date" value="${F.date}"></label>
    ${s.key ? `<button class="tp-danger" data-xdel="${s.key}">Remove this charge</button>` : ''}`;
}
function keepX() { const F = T.sheet && T.sheet.form; if (!F) return; const n = document.getElementById('f-xn'), a = document.getElementById('f-xa'), d = document.getElementById('f-xd'); if (n) F.name = n.value; if (a) F.amount = a.value; if (d && d.value) F.date = d.value; }
function sheetExtraDet(s) {
  const x = S.pay.extras.find((e) => e.id === s.key); if (!x) return '<p class="tp-small">This charge was removed.</p>';
  const g = gById(x.gid), sts = xStu(x), p = xPaidN(x);
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Close</button><b>${esc(x.name)}</b><button class="tp-back strong" data-sheet="extra" data-key="${x.id}">Edit</button></div>
    <div class="dr-sum small"><div class="dr-s3"><div><span>Each pays</span><b>${dMoney(x.amount)}</b></div><div><span>Paid</span><b>${p}/${sts.length}</b></div><div><span>${g ? esc(g.name) : ''}</span><b>${dDate(x.date)}</b></div></div></div>
    <div class="dr-sl">${sts.map((st) => { const pd = S.pay.xpaid[x.id + '|' + st.id];
      return `<button class="dr-stu" data-sheet="xpay" data-key="${x.id}" data-sid="${st.id}"><span class="dr-av st-${pd ? 'ok' : 'owe'}" style="background:${avColor(st.name)}">${esc(st.name[0])}</span><span class="tx"><b>${esc(st.name)}</b><span>${pd ? `Paid ${dDate(pd.date)}${byText(pd)}` : 'Not paid yet'}</span></span>${pd ? `<span class="dr-pill ok">Paid</span>` : `<span class="h2-pay">${ic('Check')}Paid</span>`}</button>`; }).join('')}</div>`;
}
function sheetXPay(s) {
  const x = S.pay.extras.find((e) => e.id === s.key), g = x && gById(x.gid), st = g && g.students.find((t) => t.id === s.sid); if (!st) return '<p class="tp-small">Not found.</p>';
  const pd = S.pay.xpaid[x.id + '|' + st.id]; s.date = s.date || (pd ? pd.date : iso(TODAY)); s.by = s.by || (pd ? pd.by : 'Student');
  return `<div class="tp-sh-h"><button class="tp-back" data-sheet="extradet" data-key="${x.id}">${ic('ChevronLeft')} Back</button><b>${esc(st.name)}</b><button class="tp-back strong" data-xpgo="1">Save</button></div>
    <div class="dr-sum small"><div class="dr-s3"><div><span>${esc(x.name)}</span><b>${dMoney(x.amount)}</b></div><div><span>Status</span><b>${pd ? 'Paid' : 'Not paid'}</b></div><div><span>Group</span><b>${esc(g.name)}</b></div></div></div>
    <div class="tp-f"><span>When was it paid?</span>${dateChips(s.date)}</div>
    <div class="tp-f"><span>Who paid?</span>${byChips(s)}</div>
    ${pd ? `<button class="tp-danger" data-xpundo="1">Mark as not paid</button>` : ''}`;
}

/* ---------- the group page ---------- */
function stuPct(g, s) { const ds = savedDates(g); let n = 0, h = 0; ds.forEach((k) => { const r = rec(g, fromIso(k)); n++; if (r.get(s.id) !== 'absent') h++; }); return n ? Math.round((h / n) * 100) : null; }
function scGroup(f) {
  const g = gById(f.g); if (!g) return scGone();
  const n = g.students.length, p = attPct(g), ym = payState().ym, fee = hasFee(g), sc = statusCounts(ym).per[g.id];
  const bar = `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button><button class="tp-pill" data-sheet="group" data-g="${g.id}">${ic('Pencil')} Edit group</button></div>`;
  const u = planned(g.lvl) ? weekOf(g.lvl, g.week) : null;
  const head = `<div><div class="tp-eyebrow">${g.days.map((d) => DAYS[d]).join(', ') || 'No days set'} · ${esc(g.time)}</div><div class="tp-lt" style="font-size:28px">${esc(g.name)}</div></div>`;
  const acts = `<div class="h2-acts"><button class="tp-cta" data-push="register" data-g="${g.id}">${ic('ClipboardCheck')}Attendance</button>${g.lvl === 'own' || planned(g.lvl) ? `<button class="tp-cta ghost" ${openLessonAttr(g)}>${ic('BookOpen')}Lesson plan</button>` : ''}</div>`;
  const stats = `<div class="dr-stats"><div><span>Students</span><b>${n}</b></div><div><span>Here</span><b>${p === null ? '–' : p + '%'}</b></div><div><span>${fee ? 'Paid' : 'Level'}</span><b>${fee ? (sc ? `${sc.paid + sc.credit}/${sc.n}` : '–') : esc(LVNAME(g.lvl)).split(' ')[0]}</b><small>${fee ? SHORT(ym) : ''}</small></div></div>`;
  const list = g.students.map((s, i) => { const L = fee ? ledger(g, s, ym) : null, pc = stuPct(g, s), row = `<span class="num">${i + 1}</span><span class="dr-av ${L ? 'st-' + PST[L.st][1] : ''}" style="background:${avColor(s.name)}">${esc(s.name[0])}</span><span class="tx"><b>${esc(s.name)}</b><span>${pc === null ? 'No lessons yet' : pc + '% here'}${L ? ' · ' + esc(rowText(g, L)) : ''}</span></span>${L ? `<span class="dr-pill ${PST[L.st][1]}">${PST[L.st][0]}</span>` : ''}`;
    return L ? `<button class="dr-stu" data-sheet="payrec" data-g="${g.id}" data-sid="${s.id}">${row}</button>` : `<div class="dr-stu">${row}</div>`; }).join('');
  const add = `<div class="tp-addrow"><input id="tp-newstu" placeholder="Add a student" aria-label="New student's name" autocomplete="off"><button data-addstu="${g.id}" aria-label="Add student">${ic('UserPlus')}</button></div>`;
  return `${bar}<div class="tp-inner" style="${gvg(g)}">${head}${u ? `<p class="tp-small" style="text-align:left">Now on Week ${g.week} · ${dayWord(g.lvl)} ${g.les}</p>` : ''}${acts}${stats}
    <div class="tp-sec"><h4>Students</h4><span>${n} in this group</span></div><div class="dr-sl h2-stu">${list || `<div class="tp-empty2">${ic('UserPlus')}<b>No students yet</b></div>`}</div>${add}
    ${n ? histGrid(g, iso(TODAY)) : ''}${isSingle(g) && n ? pastCard(g, f) : ''}</div>`;
}
function pastCard(g, f) { // lessons from before the app: only the days this student comes
  const cur = ymOf(TODAY), pm = f.pm || ymAdd(cur, -1), ms = []; for (let i = 0; i < 12; i++) ms.push(ymAdd(cur, -i)); // newest first
  const [y, m] = pm.split('-').map(Number), ds = [];
  for (let d = 1; d <= 31; d++) { const dt = new Date(y, m - 1, d); if (dt.getMonth() !== m - 1) break; if (dt <= TODAY && hasLesson(g, dt)) ds.push(iso(dt)); }
  const cols = `grid-template-columns:96px 54px repeat(${ds.length},46px)`, saved = S.saved[g.id] || {};
  const grid = ds.length ? `<div class="gt-wrap"><div class="gt" style="${cols}"><span class="gt-h gt-n"></span><span class="gt-h gt-p"><small>Lessons</small></span>${ds.map((k) => { const d = fromIso(k); return `<span class="gt-h gt-d"><small>${DAYS[wd(d)]}</small><b>${d.getDate()}</b></span>`; }).join('')}
    ${g.students.map((s, si) => { const came = ds.filter((k) => saved[k] && rec(g, fromIso(k)).get(s.id) !== 'absent').length;
      return `<span class="gt-n"><i>${si + 1}</i>${esc(s.name)}</span><b class="gt-p">${came}</b>${ds.map((k) => { const on = saved[k] && rec(g, fromIso(k)).get(s.id) !== 'absent'; return `<button class="gc ${on ? 'here' : 'na'}" data-pcell="${s.id}" data-gdate="${k}" aria-label="${esc(s.name)} ${k}">${on ? '✓' : ''}</button>`; }).join('')}`; }).join('')}</div></div>` : `<p class="tp-small">No lesson days in ${ymName(pm)}.</p>`;
  return `<div class="tp-card2"><div class="h">${ic('History')}Past lessons</div><p class="sub">For lessons before the app. Only the days this student comes (${g.days.map((d) => DAYS[d]).join(', ') || 'none set'}) can be marked. Tap a day = came.</p>
    <div class="tp-chips2 dr-flt">${ms.map((x) => `<button class="${pm === x ? 'on' : ''}" data-pastm="${x}">${SHORT(x)}${x.slice(0, 4) !== cur.slice(0, 4) ? " " + x.slice(2, 4) : ""}</button>`).join('')}</div>
    ${pm < S.pay.start ? `<div class="tp-card2 warn">${ic('CalendarX2')}<p>${ymName(pm)} is before fees start (${ymName(S.pay.start)}). It is kept for the record and adds no charge.</p></div>` : ''}${grid}</div>`;
}
function pastToggle(g, sid, k) {
  const dt = fromIso(k); if (!lessonOpen(g, dt)) return notOpenToast(g, dt);
  const r = rec(g, dt, true), had = !!(S.saved[g.id] || {})[k], was = had && r.get(sid) !== 'absent';
  if (!had) { g.students.forEach((s) => { r.att[s.id] = 'absent'; r.hw[s.id] = true; }); (S.saved[g.id] = S.saved[g.id] || {})[k] = true; }
  r.att[sid] = was ? 'absent' : 'here';
  if (g.students.every((s) => r.att[s.id] === 'absent')) [S.rec, S.hw, S.saved].forEach((m) => { if (m[g.id]) delete m[g.id][k]; }); // nobody came: no register
  save(); draw();
}

/* ---------- taught = the attendance was saved ---------- */
function autoTaught(g, k) {
  if (k !== iso(TODAY)) return;
  if (g.lvl === 'own') { (S.ownDone[g.id] = S.ownDone[g.id] || {})[k] = true; return; }
  if (!planned(g.lvl) || taughtOn(g, TODAY)) return;
  (S.taught[g.id] = S.taught[g.id] || {})[k] = { w: g.week, l: g.les }; const p = advance(g, 1); g.week = p.w; g.les = p.l;
}
function undoTaught(g, k) {
  if (g.lvl === 'own') { if ((S.ownDone[g.id] || {})[k]) delete S.ownDone[g.id][k]; return; }
  const t = (S.taught[g.id] || {})[k]; if (t) { g.week = t.w; g.les = t.l; delete S.taught[g.id][k]; }
}

/* ---------- taps and typing ---------- */
const pickDate = (k) => { keepPay(); keepX(); T.sheet.date = k; draw(); };
function covRefresh() {
  const s = T.sheet, g = s && gById(s.g), st = g && g.students.find((x) => x.id === s.sid), el = document.getElementById('h2-cov'); if (el && st) el.innerHTML = coverLine(g, st, numVal('f-payamt'));
}
function home2Change(t) {
  if (t.id === 'f-payamt') { covRefresh(); return true; }
  if (t.id === 'f-paydt' && T.sheet) { if (t.value) T.sheet.date = t.value > iso(TODAY) ? iso(TODAY) : t.value; keepPay(); draw(); return true; }
  return false;
}
function home2Click(b, d) {
  if (d.hp) { payState().hp = d.hp; draw(); return true; }
  if (d.hpall) { payState().f = d.hpall === 'owe' ? 'owe' : 'paid'; pushScreen({ s: 'pay' }); return true; }
  if (d.trtab) { T.trend = d.trtab; draw(); return true; }
  if (d.paymonth) { const P = payState(), n = ymAdd(P.ym, +d.paymonth); if (n >= S.pay.start && n <= ymAdd(ymOf(TODAY), MAXAHEAD)) { P.ym = n; draw(); } return true; }
  if (d.cfgeye) { const c = homeCfg(); c.hide = c.hide.includes(d.cfgeye) ? c.hide.filter((x) => x !== d.cfgeye) : [...c.hide, d.cfgeye]; save(); draw(); return true; }
  if (d.cfgup || d.cfgdown) { const c = homeCfg(), id = d.cfgup || d.cfgdown, i = c.order.indexOf(id), j = i + (d.cfgup ? -1 : 1); if (j >= 0 && j < c.order.length) { c.order.splice(i, 1); c.order.splice(j, 0, id); save(); draw(); } return true; }
  if (d.cfgreset !== undefined) { S.homeCfg = {}; save(); draw(); return true; }
  if (d.paydate) { if (d.paydate === 'pick') { keepPay(); T.sheet.date = iso(addDays(TODAY, -4)); draw(); return true; } pickDate(d.paydate); return true; }
  if (d.payby) { keepPay(); keepX(); T.sheet.by = d.payby; draw(); return true; }
  if (d.payfill !== undefined) { const el = document.getElementById('f-payamt'); if (el) { el.value = d.payfill === '0' ? '' : d.payfill; covRefresh(); } return true; }
  if (d.paygo) {
    const [sid, gid] = d.paygo.split('|'), g = gById(gid), st = g && g.students.find((x) => x.id === sid); if (!st) return true;
    const s = T.sheet, ym = payState().ym, amt = numVal('f-payamt'), k = sid + '|' + ym, date = s.date && s.date <= iso(TODAY) ? s.date : iso(TODAY), by = byValue(s);
    if (document.getElementById('f-paydisc')) { const dsc = numVal('f-paydisc'); if (dsc) S.pay.sdisc[k] = dsc; else delete S.pay.sdisc[k]; }
    if (amt) {
      const pid = uid(); S.pay.pays.push({ id: pid, sid, date, amount: amt, by });
      let box = []; try { box = JSON.parse(localStorage.getItem('teacher-to-budget') || '[]'); if (!Array.isArray(box)) box = []; } catch (e) { box = []; }
      box.push({ id: uid(), pay: pid, amount: amt, person: st.name, group: g.name, ym, date, by });
      try { localStorage.setItem('teacher-to-budget', JSON.stringify(box)); } catch (e) { /* full */ }
    }
    save(); closeSheetNow(); toast(amt ? `Saved · ${dDate(date)} · by ${by.toLowerCase()}` : 'Saved'); draw();
    return true;
  }
  if (d.xname) { keepX(); T.sheet.form.name = d.xname; draw(); return true; }
  if (d.xg) { keepX(); const F = T.sheet.form, g = gById(d.xg); F.gid = g.id; F.sids = g.students.map((t) => t.id); draw(); return true; }
  if (d.xs) { keepX(); const F = T.sheet.form; F.sids = F.sids.includes(d.xs) ? F.sids.filter((x) => x !== d.xs) : [...F.sids, d.xs]; draw(); return true; }
  if (d.xall !== undefined) { keepX(); const F = T.sheet.form; F.sids = d.xall === '1' ? gById(F.gid).students.map((t) => t.id) : []; draw(); return true; }
  if (d.xsave !== undefined) {
    keepX(); const s = T.sheet, F = s.form, amount = +String(F.amount).replace(/\D/g, '') || 0;
    if (!F.name.trim()) { toast('Write what it is for'); return true; } if (!amount) { toast('Write the price'); return true; } if (!F.sids.length) { toast('Choose who must pay'); return true; }
    const x = { id: s.key || uid(), name: F.name.trim(), amount, gid: F.gid, sids: [...F.sids], date: F.date || iso(TODAY) };
    const i = S.pay.extras.findIndex((e) => e.id === x.id); if (i >= 0) S.pay.extras[i] = x; else S.pay.extras.push(x);
    save(); closeSheetNow(); toast('Saved'); draw(); return true;
  }
  if (d.xdel) { if (!confirmTwice(b, 'Tap again to remove')) return true; S.pay.extras = S.pay.extras.filter((e) => e.id !== d.xdel); Object.keys(S.pay.xpaid).forEach((k) => { if (k.startsWith(d.xdel + '|')) delete S.pay.xpaid[k]; }); save(); closeSheetNow(); toast('Charge removed'); draw(); return true; }
  if (d.xpgo !== undefined) { const s = T.sheet; S.pay.xpaid[s.key + '|' + s.sid] = { date: s.date && s.date <= iso(TODAY) ? s.date : iso(TODAY), by: byValue(s) }; save(); toast('Saved'); openSheet({ s: 'extradet', key: s.key }); return true; }
  if (d.xpundo !== undefined) { const s = T.sheet; delete S.pay.xpaid[s.key + '|' + s.sid]; save(); toast('Marked as not paid'); openSheet({ s: 'extradet', key: s.key }); return true; }
  if (d.pastm) { T.push[T.push.length - 1].pm = d.pastm; draw(); return true; }
  if (d.pcell !== undefined) { const g = gById(T.push[T.push.length - 1].g); if (g) pastToggle(g, d.pcell, d.gdate); return true; }
  return false;
}
