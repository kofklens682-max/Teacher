'use strict';
/* Fees (user, 27 Oct 2026): the Teacher app is the "manager" of who paid; Budget keeps the money. No money totals here.
   - A group has a monthly fee per student, or (private students) a price per lesson: S.pay.plan[group] = { kind: 'group' | 'single', fee | rate }.
   - What a student pays is used for the oldest unpaid month first; anything extra is credit and covers the next month.
   - Discounts are for one month only: the whole group (I missed a week) S.pay.disc['group|YYYY-MM'] or one student S.pay.sdisc['student|YYYY-MM'].
   - Group students pay every month (also when absent); private students pay for the lessons they came to (from the registers).
   - Fees count from S.pay.start (the month the app started keeping fees) or the month the group / student was added.
   - A saved payment is handed to Budget (localStorage "teacher-to-budget", same site): Budget asks at the top of its screen
     whether to add it as income ("Add income", "Already counted", "Later"). Nothing here ever writes Budget's own data.
   Loaded before app.js; everything here is called from app.js at draw time. */

Object.assign(ICONS, {
  Wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  Check: '<path d="M20 6 9 17l-5-5"/>',
  Percent: '<line x1="19" x2="5" y1="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
});

/* ---------- money + months ---------- */
const dMoney = (n) => Math.round(n).toLocaleString('en-US').replace(/,/g, ' ');
const ymOf = (d) => iso(d).slice(0, 7);
const ymAdd = (ym, n) => { const [y, m] = ym.split('-').map(Number), d = new Date(y, m - 1 + n, 1); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
const ymName = (ym) => { const [y, m] = ym.split('-').map(Number); return MONTHS[m - 1] + ' ' + y; };
const dDate = (k) => { const d = fromIso(k); return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3); };
const numVal = (id) => +String((document.getElementById(id) || {}).value || '').replace(/\D/g, '') || 0;

/* ---------- the payment rules ---------- */
const planOf = (g) => S.pay.plan[g.id] || null;
const isSingle = (g) => (planOf(g) || {}).kind === 'single';
const hasFee = (g) => { const p = planOf(g); return !!p && (p.kind === 'single' ? p.rate > 0 : p.fee > 0); };
const feeGroups = () => S.groups.filter(hasFee);
function lessonsCame(g, s, ym) { return savedDates(g).filter((k) => k.startsWith(ym) && rec(g, fromIso(k)).get(s.id) !== 'absent').length; }
function chargeOf(g, s, ym) {
  const P = S.pay, p = planOf(g) || {};
  if (p.kind === 'single') return lessonsCame(g, s, ym) * (p.rate || 0);
  return Math.max(0, (P.stuFee[s.id] ?? p.fee ?? 0) - (P.disc[g.id + '|' + ym] || 0) - (P.sdisc[s.id + '|' + ym] || 0));
}
function firstMonth(g, s) { return [S.pay.start, ymOf(new Date(g.created || Date.now())), s.added ? ymOf(new Date(s.added)) : ''].sort().pop(); }
function ledger(g, s, ym) { // what was paid is used for the oldest month first; what is left over is credit
  const end = ymAdd(ym, 1) + '-01', mine = S.pay.pays.filter((p) => p.sid === s.id && p.date < end).sort((a, b) => a.date.localeCompare(b.date));
  let money = mine.reduce((a, p) => a + p.amount, 0);
  const rows = []; for (let m = firstMonth(g, s); m <= ym; m = ymAdd(m, 1)) { const charge = chargeOf(g, s, m), cov = Math.min(money, charge); money -= cov; rows.push({ m, charge, covered: cov }); }
  const c = rows.length ? rows[rows.length - 1] : { m: ym, charge: 0, covered: 0 };
  const debt = rows.reduce((a, r) => a + r.charge - r.covered, 0), older = debt - (c.charge - c.covered);
  const nextFee = isSingle(g) ? c.charge : chargeOf(g, s, ymAdd(ym, 1));
  let st;
  if (debt > 0) st = c.covered > 0 ? 'part' : 'unpaid';
  else if (money >= nextFee && money > 0) st = 'prepaid';
  else if (money > 0) st = 'credit';
  else st = c.charge === 0 ? 'free' : 'paid';
  const last = mine.filter((p) => p.date.slice(0, 7) === ym).pop();
  return { rows, cur: c, debt, older, credit: money, st, last, mine };
}
const payState = () => T.pay || (T.pay = { ym: ymOf(TODAY), f: 'all' });

const STC = { paid: '#12B76A', credit: '#3D5AFE', part: '#F79009', unpaid: '#F04438' };
function donut(parts, size, w, center, track) { // parts: [[value, colour]]; a ring cut into coloured pieces
  const r = (size - w) / 2, L = 2 * Math.PI * r, on = parts.filter((p) => p[0] > 0), tot = on.reduce((a, p) => a + p[0], 0) || 1; let off = 0;
  const segs = on.map(([v, c]) => { const len = (L * v) / tot, gap = on.length > 1 ? Math.min(4, len / 3) : 0, s = `<circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${c}" stroke-width="${w}" stroke-dasharray="${(len - gap).toFixed(1)} ${L.toFixed(1)}" style="--L:${L.toFixed(1)}px" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>`; off += len; return s; }).join('');
  return `<div class="dr-donut" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${track || 'rgba(14,19,37,.07)'}" stroke-width="${w}"/>${segs}</svg><div class="c">${center}</div></div>`;
}
const stack = (c) => { const t = c.paid + c.credit + c.part + c.unpaid || 1; return `<div class="dr-stack">${['paid', 'credit', 'part', 'unpaid'].map((k) => (c[k] ? `<i style="width:${(c[k] / t) * 100}%;background:${STC[k]}"></i>` : '')).join('')}</div>`; };
function statusCounts(ym) { // students by payment status, only in groups with a fee (no money totals: that is Budget's job)
  const out = { paid: 0, credit: 0, part: 0, unpaid: 0, per: {} };
  feeGroups().forEach((g) => { const c = out.per[g.id] = { paid: 0, credit: 0, part: 0, unpaid: 0, n: 0 };
    g.students.forEach((s) => { const st = ledger(g, s, ym).st; if (st === 'free') return; const k = st === 'prepaid' ? 'credit' : st; c[k]++; c.n++; out[k]++; }); }); // 'free' = nothing to pay this month (a private student with no lessons yet)
  out.n = out.paid + out.credit + out.part + out.unpaid; out.ok = out.paid + out.credit;
  return out;
}
const legend = (sc) => [['paid', 'Paid'], ['credit', 'Paid + credit'], ['part', 'Part paid'], ['unpaid', 'Not paid']].map(([k, t]) => `<div><i style="background:${STC[k]}"></i>${t}<b>${sc[k]}</b></div>`).join('');

/* ---------- Home: students, today, fees, groups ---------- */
function hwPct() {
  let tot = 0, done = 0;
  S.groups.forEach((g) => savedDates(g).slice(-6).forEach((k) => { const r = rec(g, fromIso(k)); g.students.forEach((s) => { if (r.get(s.id) === 'absent') return; tot++; if (r.hwOf(s.id)) done++; }); }));
  return tot ? Math.round((done / tot) * 100) : null;
}
function attAll() { const v = S.groups.map(attPct).filter((x) => x !== null); return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null; }
function pgHomeNew() {
  if (!S.groups.length) return pgHome(); // the first-time welcome
  const day = `${DAYS_LONG[wd(TODAY)]} ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]}`, ym = ymOf(TODAY);
  const head = `<div class="tp-hdr"><div><div class="tp-eyebrow">${day}</div><div class="tp-lt">Home</div></div>
    <div class="hdr-btns"><button class="tp-avatar" data-sheet="settings" aria-label="Profile and settings">${initials(profileGet().name) || ic('UserRound')}</button><button class="tp-roundbtn" data-sheet="group" aria-label="New group">${ic('Plus')}</button></div></div>`;
  const priv = S.groups.filter(isSingle), kids = S.groups.filter((g) => !priv.includes(g) && (g.lvl === 'own' || KIDLV.some((l) => l.id === g.lvl))), teens = S.groups.filter((g) => !kids.includes(g) && !priv.includes(g));
  const cnt = (a) => a.reduce((n, g) => n + g.students.length, 0), total = cnt(S.groups);
  const aud = [['Kids', kids, '#5EEAD4'], ['Teens', teens, '#FFFFFF'], ['Private', priv, '#FCD34D']].filter((x) => x[1].length);
  const hero = `<div class="dr-hero2">${donut(aud.map((x) => [cnt(x[1]), x[2]]), 124, 14, `<b>${total}</b><span>students</span>`, 'rgba(255,255,255,.18)')}
    <div class="dr-aud">${aud.map(([t, gs, c]) => `<div><i style="background:${c}"></i><span><b>${cnt(gs)}</b> ${t}</span><em>${t === 'Private' ? 'pay per lesson' : gs.length + (gs.length === 1 ? ' group' : ' groups')}</em></div>`).join('')}</div></div>`;
  const a = attAll(), h = hwPct(), sc = statusCounts(ym), paidP = sc.n ? sc.ok / sc.n : 0;
  const rings = `<div class="dr-rings">
    <button class="dr-rt" data-tab="2">${ring((a || 0) / 100, 62, 7, '#34C759', '#0FA37F', a === null ? '–' : a + '%')}<span>Attendance</span></button>
    <button class="dr-rt" data-tab="2">${ring((h || 0) / 100, 62, 7, '#A78BFA', '#7B3FE4', h === null ? '–' : h + '%')}<span>Homework</span></button>
    <button class="dr-rt" data-push="pay">${ring(paidP, 62, 7, '#5CC8FF', '#147EFB', sc.n ? `${sc.ok}/${sc.n}` : '–')}<span>Fees paid</span></button></div>`;
  const todays = S.groups.filter((g) => hasLesson(g, TODAY)).sort((x, y) => x.time.localeCompare(y.time));
  const nextId = (todays.find((g) => startMin(g) + 80 > nowMin() && !taughtOn(g, TODAY)) || {}).id;
  const rows = todays.map((g) => {
    const u = planned(g.lvl) ? weekOf(g.lvl, g.week) : null, done = taughtOn(g, TODAY) || (S.ownDone[g.id] || {})[iso(TODAY)];
    return `<div class="dr-row${g.id === nextId ? ' next' : ''}" style="${gvg(g)}"><button class="dr-main" ${openLessonAttr(g)}><span class="tmp">${esc(g.time)}</span><span class="tx"><b>${esc(g.name)}${g.id === nextId ? ' <em>Next</em>' : ''}</b><span>${u ? `Week ${g.week} · ${dayWord(g.lvl)} ${g.les}` : esc(LVNAME(g.lvl))}</span></span><span class="dr-cnt">${ic('Users')}${g.students.length}</span></button>
      ${done ? `<span class="dr-done">${ic('Check')}</span>` : `<button class="dr-reg" data-push="register" data-g="${g.id}" aria-label="Register">${ic('ClipboardCheck')}</button>`}</div>`;
  }).join('');
  const today = `<div class="tp-sec dr-sec"><h4>Today</h4><span class="dr-h4s">${todays.length} lesson${todays.length === 1 ? '' : 's'} · ${cnt(todays)} students</span></div>${todays.length ? `<div class="dr-list">${rows}</div>` : `<div class="tp-empty2">${ic('CalendarDays')}<b>No lessons today</b><span>Enjoy the day.</span></div>`}`;
  const pay = sc.n ? `<button class="dr-paycard" data-push="pay">${donut([[sc.paid, STC.paid], [sc.credit, STC.credit], [sc.part, STC.part], [sc.unpaid, STC.unpaid]], 96, 12, `<b>${sc.ok}</b><span>of ${sc.n}</span>`)}
    <div class="dr-pl"><b>Fees · ${MONTHS[TODAY.getMonth()]}</b>${legend(sc)}</div><span class="tp-chev">${ic('ChevronRight')}</span></button>`
    : `<div class="tp-card2"><div class="h" style="color:#12B76A">${ic('Wallet')}Fees</div><p>Set the monthly fee (or the price per lesson) in <b>Edit group</b>, and the app shows who paid.</p></div>`;
  const tiles = [...S.groups].sort((x, y) => x.name.localeCompare(y.name)).map((g) => {
    const c = sc.per[g.id], p = attPct(g);
    return `<button class="dr-gt" style="${gvg(g)}" ${openLessonAttr(g)}><div class="t">${groupTile(g)}<span class="n">${ic('Users')}${g.students.length}</span></div><b>${esc(g.name)}</b><span class="l">${esc(LVNAME(g.lvl))}</span>
      ${c ? stack(c) : '<div class="dr-stack"></div>'}<span class="f">${c ? `${c.paid + c.credit}/${c.n} paid` : 'No fee set'}${p === null ? '' : ` · ${p}% here`}</span></button>`;
  }).join('');
  return `${head}${hero}${rings}${today}<div class="tp-sec dr-sec"><h4>Fees</h4></div>${pay}<div class="tp-sec dr-sec"><h4>My groups</h4></div><div class="dr-gtiles">${tiles}<button class="dr-gt add" data-sheet="group">${ic('Plus')}<b>New group</b></button></div>`;
}

/* ---------- the Fees screen ---------- */
const PST = { paid: ['Paid', 'ok'], credit: ['Paid + credit', 'cr'], prepaid: ['Prepaid', 'cr'], part: ['Part paid', 'part'], unpaid: ['Not paid', 'owe'], free: ['No charge', 'ok'] };
function rowText(g, L) {
  const c = L.cur, o = L.older > 0 && L.rows.find((r) => r.charge - r.covered > 0), also = o ? ` · ${MONTHS[+o.m.slice(5) - 1]} too` : '', when = L.last ? ' · ' + dDate(L.last.date) : '';
  switch (L.st) {
    case 'paid': return `${dMoney(c.charge)}${when}`;
    case 'credit': return `${dMoney(c.charge)} + ${dMoney(L.credit)} for next month${when}`;
    case 'prepaid': return `Next month paid too${when}`;
    case 'part': return `${dMoney(c.covered)} of ${dMoney(c.charge)}${when}${also}`;
    case 'unpaid': return `${dMoney(c.charge)} due${also}`;
    default: return isSingle(g) ? 'No lessons this month yet' : 'No charge this month';
  }
}
function scPay() {
  const P = payState(), ym = P.ym, cur = ymOf(TODAY), sc = statusCounts(ym), gs = feeGroups();
  const bar = `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button><span></span></div>`;
  const head = `<div><div class="tp-eyebrow">Who paid</div><div class="tp-lt" style="font-size:28px">Fees</div></div>`;
  if (!gs.length) return `${bar}<div class="tp-inner">${head}<div class="tp-empty2">${ic('Wallet')}<b>No fees yet</b><span>Open a group, tap Edit group, and set the monthly fee (or the price per lesson for private students).</span></div></div>`;
  const nav = `<div class="rg-nav"><button class="tp-iconbtn" data-paymonth="-1" ${ym <= S.pay.start ? 'disabled' : ''} aria-label="Previous month">${ic('ChevronLeft')}</button><div><b>${ymName(ym)}</b><span>${ym === cur ? 'this month' : ym > cur ? 'coming month' : 'earlier month'}</span></div><button class="tp-iconbtn" data-paymonth="1" ${ym >= ymAdd(cur, 24) ? 'disabled' : ''} aria-label="Next month">${ic('ChevronRight')}</button></div>`;
  const over = `<div class="dr-over">${donut([[sc.paid, STC.paid], [sc.credit, STC.credit], [sc.part, STC.part], [sc.unpaid, STC.unpaid]], 132, 16, `<b>${sc.ok}/${sc.n}</b><span>paid</span>`)}<div class="dr-pl">${legend(sc)}</div></div>`;
  const byg = `<div class="dr-byg">${gs.map((g) => { const c = sc.per[g.id]; return `<div class="r"><span class="nm">${esc(g.name)}</span>${stack(c)}<b>${c.paid + c.credit}/${c.n}</b></div>`; }).join('')}</div>`;
  const F = P.f, flt = [['all', 'All', sc.n], ['owe', 'Owe', sc.part + sc.unpaid], ['credit', 'Credit', sc.credit], ['paid', 'Paid', sc.paid]];
  const chips = `<div class="tp-chips2 dr-flt">${flt.map(([k, t, n]) => `<button class="${F === k ? 'on' : ''}" data-payf="${k}">${t} <em>${n}</em></button>`).join('')}</div>`;
  const keep = (L) => F === 'all' || (F === 'owe' ? L.debt > 0 : F === 'credit' ? L.debt === 0 && L.credit > 0 : L.debt === 0 && L.credit === 0);
  const secs = gs.map((g) => {
    const rows = g.students.map((s) => ({ s, L: ledger(g, s, ym) })).filter((r) => keep(r.L)).sort((x, y) => (y.L.debt > 0) - (x.L.debt > 0) || y.L.debt - x.L.debt);
    if (!rows.length) return '';
    const d = S.pay.disc[g.id + '|' + ym] || 0, single = isSingle(g), p = planOf(g);
    const list = rows.map(({ s, L }) => { const [txt, cls] = PST[L.st];
      return `<button class="dr-stu" data-sheet="payrec" data-g="${g.id}" data-sid="${s.id}"><span class="dr-av st-${cls}" style="background:${avColor(s.name)}">${esc(s.name[0])}</span><span class="tx"><b>${esc(s.name)}</b><span>${esc(rowText(g, L))}${single ? ` · ${lessonsCame(g, s, ym)} lessons` : ''}</span></span><span class="dr-pill ${cls}">${txt}</span></button>`; }).join('');
    return `<div class="dr-gsec" style="${gvg(g)}"><div class="dr-gh"><span class="dot"></span><div><b>${esc(g.name)}</b><span>${single ? 'Per lesson · ' + dMoney(p.rate) : dMoney(p.fee) + ' a month'}${d ? ` · −${dMoney(d)} this month` : ''}</span></div>${single ? '' : `<button class="dr-disc" data-sheet="gdisc" data-g="${g.id}">${ic('Percent')}Discount</button>`}</div><div class="dr-sl">${list}</div></div>`;
  }).join('');
  return `${bar}<div class="tp-inner" style="--g1:#12B76A;--g2:#0F9D8F">${head}${nav}${over}<div class="tp-sec"><h4>By group</h4></div>${byg}${chips}${secs || `<div class="tp-empty2">${ic('Check')}<b>Nobody here</b><span>Nothing matches this filter.</span></div>`}</div>`;
}

/* ---------- sheets: record a payment, a group discount ---------- */
function sheetPayRec(s) {
  const g = gById(s.g), st = g && g.students.find((x) => x.id === s.sid); if (!st) return '<p class="tp-small">This student is not in the group any more.</p>';
  const ym = payState().ym, L = ledger(g, st, ym), c = L.cur, sd = S.pay.sdisc[st.id + '|' + ym] || 0, gd = S.pay.disc[g.id + '|' + ym] || 0;
  const want = L.debt > 0 ? L.debt : c.charge;
  const hist = L.mine.slice(-4).reverse().map((p) => `<div class="dr-hist"><span>${dDate(p.date)}</span><b>${dMoney(p.amount)}</b><button class="dr-del${s.del === p.id ? ' sure' : ''}" data-paydel="${p.id}" aria-label="Remove this payment">${s.del === p.id ? 'Tap again to remove' : ic('X')}</button></div>`).join('');
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>${esc(st.name)}</b><button class="tp-back strong" data-paygo="${st.id}|${g.id}">Save</button></div>
    <div class="dr-sum small"><div class="dr-s3"><div><span>${isSingle(g) ? lessonsCame(g, st, ym) + ' lessons' : 'Fee'} · ${MONTHS[+ym.slice(5) - 1]}</span><b>${dMoney(c.charge)}</b></div><div><span>Paid</span><b>${dMoney(c.covered)}</b></div><div><span>${L.debt > 0 ? 'Owes' : 'Credit'}</span><b>${dMoney(L.debt > 0 ? L.debt : L.credit)}</b></div></div>
    ${gd || sd ? `<div class="dr-s4">Discount this month: −${dMoney(gd + sd)}${gd ? ' (group)' : ''}</div>` : ''}${L.older > 0 ? `<div class="dr-s4">Includes an older month: ${dMoney(L.older)}</div>` : ''}</div>
    <label class="tp-f"><span>Amount received (so'm)</span><input id="f-payamt" inputmode="numeric" value="${want || ''}" placeholder="0" autocomplete="off"></label>
    <div class="tp-chips2 dr-fill">${c.charge ? `<button data-payfill="${c.charge}">Full month</button>` : ''}${L.debt > 0 && L.debt !== c.charge ? `<button data-payfill="${L.debt}">What is owed</button>` : ''}${c.charge ? `<button data-payfill="${c.charge * 2}">Two months</button>` : ''}<button data-payfill="0">Clear</button></div>
    ${isSingle(g) ? '' : `<label class="tp-f"><span>Discount for this student, this month only (optional)</span><input id="f-paydisc" inputmode="numeric" value="${sd || ''}" placeholder="0" autocomplete="off"></label>`}
    <p class="tp-small">If more than the fee is paid, the extra is kept as credit and covers next month. After you save, Budget asks whether to add the money ("Already counted" if it is in Budget already).</p>
    ${hist ? `<div class="tp-sec"><h4>Last payments</h4></div><div class="dr-hl">${hist}</div>` : ''}`;
}
function sheetGDisc(s) {
  const g = gById(s.g), ym = payState().ym, fee = (planOf(g) || {}).fee || 0, cur = S.pay.disc[g.id + '|' + ym] || 0;
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>Discount · ${esc(g.name)}</b><button class="tp-back strong" data-gdgo="${g.id}">Save</button></div>
    <div class="tp-card2"><div class="h">${ic('Percent')}${ymName(ym)}</div><p>Use this when you missed lessons. The discount is taken off every student's fee for this month only. Next month is the normal fee.</p></div>
    <div class="tp-chips2 dr-fill"><button data-gdfill="${Math.round(fee * 0.25)}">Missed 1 week · −25%</button><button data-gdfill="${Math.round(fee * 0.5)}">Missed 2 weeks · −50%</button><button data-gdfill="0">None</button></div>
    <label class="tp-f"><span>Discount per student (so'm)</span><input id="f-gdisc" inputmode="numeric" value="${cur || ''}" placeholder="0" autocomplete="off"></label>`;
}
// The fee part of the New / Edit group sheet
function feeForm(F) {
  const single = F.feeKind === 'single';
  return `<div class="tp-f"><span>Fee</span><div class="tp-chips2"><button class="${single ? '' : 'on'}" data-f-feekind="group">Monthly, per student</button><button class="${single ? 'on' : ''}" data-f-feekind="single">Per lesson (private)</button></div></div>
    <label class="tp-f"><span>${single ? 'Price per lesson' : 'Monthly fee per student'} (so'm)</span><input id="f-fee" inputmode="numeric" value="${F.fee || ''}" placeholder="0 = no fee" autocomplete="off"></label>`;
}

/* ---------- taps (called from app.js onClick; returns true when handled) ---------- */
function feesClick(b, d) {
  if (d.paymonth) { const P = payState(), n = ymAdd(P.ym, +d.paymonth); if (n >= S.pay.start && n <= ymOf(TODAY)) { P.ym = n; draw(); } return true; }
  if (d.payf) { payState().f = d.payf; draw(); return true; }
  if (d.payfill !== undefined) { const el = document.getElementById('f-payamt'); if (el) el.value = d.payfill === '0' ? '' : d.payfill; return true; }
  if (d.gdfill !== undefined) { const el = document.getElementById('f-gdisc'); if (el) el.value = d.gdfill === '0' ? '' : d.gdfill; return true; }
  if (d.fFeekind) { keepForm(); T.sheet.form.feeKind = d.fFeekind; draw(); return true; }
  if (d.paydel) {
    if (T.sheet.del !== d.paydel) { T.sheet.del = d.paydel; draw(); return true; }
    S.pay.pays = S.pay.pays.filter((p) => p.id !== d.paydel); T.sheet.del = null; save(); draw();
    let box = [], waiting = false; try { box = JSON.parse(localStorage.getItem('teacher-to-budget') || '[]'); waiting = box.some((x) => x.pay === d.paydel); if (waiting) localStorage.setItem('teacher-to-budget', JSON.stringify(box.filter((x) => x.pay !== d.paydel))); } catch (e) { /* fine */ }
    toast(waiting ? 'Payment removed (Budget will not ask about it)' : 'Payment removed. If you added it in Budget, remove it there too'); return true;
  }
  if (d.paygo) {
    const [sid, gid] = d.paygo.split('|'), g = gById(gid), st = g && g.students.find((x) => x.id === sid); if (!st) return true;
    const ym = payState().ym, amt = numVal('f-payamt'), k = sid + '|' + ym;
    if (document.getElementById('f-paydisc')) { const dsc = numVal('f-paydisc'); if (dsc) S.pay.sdisc[k] = dsc; else delete S.pay.sdisc[k]; }
    if (amt) {
      const pid = uid(); S.pay.pays.push({ id: pid, sid, date: iso(TODAY), amount: amt });
      let box = []; try { box = JSON.parse(localStorage.getItem('teacher-to-budget') || '[]'); if (!Array.isArray(box)) box = []; } catch (e) { box = []; }
      box.push({ id: uid(), pay: pid, amount: amt, person: st.name, group: g.name, ym, date: iso(TODAY) }); // Budget asks about it at the top of its screen
      try { localStorage.setItem('teacher-to-budget', JSON.stringify(box)); } catch (e) { /* full */ }
    }
    save(); closeSheetNow(); toast(amt ? 'Saved · Budget will ask you to add it' : 'Saved'); draw();
    return true;
  }
  if (d.gdgo) { const v = numVal('f-gdisc'), k = d.gdgo + '|' + payState().ym; if (v) S.pay.disc[k] = v; else delete S.pay.disc[k]; save(); closeSheetNow(); toast(v ? 'Discount saved for this month' : 'Discount removed'); return true; }
  return false;
}
