'use strict';
/* NEXT — the 15 Nov 2026 redesign (DRAFT in Apps/next, not the live app). Loaded last.
   Decisions: see memory "round-15nov-whole-system-redesign".
   - 5 tabs: Home · Units · Students · Payments · Library, plus the + button (quick actions). No group attendance.
   - Students: groups → students (A–Z) → profile (gender avatar, classes, payments, details).
   - Payments: Month | Year, groups folded to their first students A–Z, the Pay pop-up (Full / Discount / Part, months, Cash / Card).
   - Home: the class card (swipe up / down), Paid rings, Owe 2+ months, course progress, pop-up for birthdays and breaks.
   - Settings: one page with sections. Group lessons count by themselves when they end (cancelled ones do not); the plan waits. */

/* ---------- people: gender, profile details, one person in two classes ---------- */
const NX = { pv: 'm', open: {}, hero: null };
const prof = (sid) => ((S.prof = S.prof || {})[sid] || {});
const profSet = (sid, o) => { S.prof = S.prof || {}; S.prof[sid] = { ...(S.prof[sid] || {}), ...o }; Object.keys(S.prof[sid]).forEach((k) => { if (S.prof[sid][k] === '' || S.prof[sid][k] == null) delete S.prof[sid][k]; }); };
const guessG = (name) => (/(a|ya|oy|xon|gul|niso)$/i.test(String(name).trim().split(/\s+/)[0]) ? 'f' : 'm'); // a first guess from the name; confirmed on the profile
const genderOf = (st) => prof(st.id).g || guessG(st.name);
const AV_M = '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4.6"/><path d="M2.6 24c.6-6.1 4.4-9.5 9.4-9.5s8.8 3.4 9.4 9.5z"/></svg>';
const AV_F = '<svg viewBox="0 0 24 24"><path d="M12 2.6c-3.3 0-5.6 2.5-5.6 5.8 0 2.7-.9 4.6-2 6 1.6.7 3.8 1 5.1.6a5.3 5.3 0 0 0 5 0c1.3.4 3.5.1 5.1-.6-1.1-1.4-2-3.3-2-6 0-3.3-2.3-5.8-5.6-5.8z"/><path d="M2.6 24c.7-5.6 4.5-8.5 9.4-8.5s8.7 2.9 9.4 8.5z"/></svg>';
const nxAv = (st, cls = '') => `<span class="nx-av ${genderOf(st)} ${cls}">${genderOf(st) === 'f' ? AV_F : AV_M}</span>`;
const byName = (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
const keyOf = (n) => String(n).trim().toLowerCase();
// every class a person is in: the same name in two places counts as one person once you say yes (S.same[name] = 1 / 0)
function classesOf(st) {
  const k = keyOf(st.name), all = []; S.groups.forEach((g) => stuAll(g).forEach((x) => { if (keyOf(x.name) === k) all.push({ g, st: x }); }));
  const same = (S.same || {})[k];
  return { all: same === 1 ? all : all.filter((x) => x.st.id === st.id), twins: all.length > 1 ? all : [], ask: all.length > 1 && same === undefined };
}
const soloGroups = () => S.groups.filter((g) => g.solo);
const workGroups = () => S.groups.filter((g) => !g.solo).sort(byName);
const gColor = (g) => (typeof hc === 'function' ? hc(g) : '#007AFF');
const fmtSum = (n) => Math.round(n).toLocaleString('en-US').replace(/,/g, ' ');
const round5 = (n) => Math.floor(n / 5000) * 5000; // user, 15 Nov: always round DOWN (17 000 → 15 000, 153 000 → 150 000)

/* ---------- payment status of one student in one month ---------- */
function nxSt(g, st, ym) {
  if (!hasFee(g)) return { k: 'free', t: 'No fee', p: 0 };
  const L = ledger(g, st, ym), c = L.cur, left = c.charge - c.covered;
  const owedMonths = L.rows.filter((r) => r.charge - r.covered > 0).length;
  if (L.st === 'free') return { k: 'free', t: 'Nothing to pay', p: 1, L };
  if (L.debt <= 0) return { k: 'paid', t: L.credit > 0 ? 'Paid ahead' : 'Paid', p: 1, L };
  if (owedMonths >= 2) return { k: 'no', t: `Owes ${owedMonths} months`, p: c.charge ? c.covered / c.charge : 0, L, many: true };
  if (c.covered > 0 && left > 0) return { k: 'part', t: `${fmtSum(c.covered)} of ${fmtSum(c.charge)}`, p: c.covered / c.charge, L };
  return { k: 'no', t: 'Not paid', p: 0, L };
}
const ST_COL = { paid: '#34C759', part: '#FF9500', no: '#FF3B30', free: '#C7C7CC' };
function miniRing(p, col, size = 30, w = 4.5) {
  const r = (size - w) / 2, C = 2 * Math.PI * r;
  return `<svg class="nx-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-opacity=".18" stroke-width="${w}"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="${Math.max(0.001, C * Math.min(1, p)).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 ${size / 2} ${size / 2})"/></svg>`;
}
const chev = () => `<span class="nx-chev">${ic('ChevronRight')}</span>`;
const nxHead = (title, eyebrow, extra = '') => `<div class="tp-hdr"><div>${eyebrow ? `<div class="tp-eyebrow">${eyebrow}</div>` : ''}<div class="tp-lt">${title}</div></div><div class="hdr-btns">${extra}<button class="tp-avatar" data-nxset aria-label="Settings">${initials(profileGet().name) || ic('UserRound')}</button>${lightsHtml(title === 'Home' ? 'home' : 'tabs')}</div></div>`;
const backBar = (label = 'Back', right = '') => `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} ${label}</button>${right}</div>`;

/* ================= STUDENTS ================= */
// TRY (user, 16 Nov): two widgets on top — A) who paid this month, a ring per group; E) who owes the most
function stuWidgets() {
  const ym = ymOf(TODAY), gs = payGroups().map((G) => { const r = G.items.map(({ g, st }) => nxSt(g, st, ym)).filter((s) => s.k !== 'free'); return { G, n: r.length, ok: r.filter((s) => s.k === 'paid').length, part: r.filter((s) => s.k === 'part').length }; }).filter((x) => x.n);
  const rings = gs.map((x) => `<button class="nx-wg" data-tab="4" style="--c:${x.G.col}">${donut([[x.ok, ST_COL.paid], [x.part, ST_COL.part], [x.n - x.ok - x.part, ST_COL.no]], 54, 7, `<b>${x.ok}</b><span>/${x.n}</span>`)}<span class="nm"><i></i>${esc(x.G.name)}</span></button>`).join('');
  const owe = []; S.groups.forEach((g) => { if (!hasFee(g)) return; feeStu(g, ym, true).forEach((st) => { const L = ledger(g, st, ym); if (L.debt > 0) owe.push({ g, st, debt: L.debt, n: L.rows.filter((r) => r.charge - r.covered > 0).length }); }); });
  owe.sort((a, b) => b.debt - a.debt || byName(a.st, b.st));
  const top = owe.slice(0, 3), max = top.length ? top[0].debt : 1;
  return `${gs.length ? `<div class="nx-sec">Paid in ${MONTHS[TODAY.getMonth()]} <span class="nx-try">Try</span></div><div class="nx-wgs" data-noswipe>${rings}</div>` : ''}
    ${top.length ? `<div class="nx-sec">Owes the most <span class="nx-try">Try</span></div><div class="nx-card nx-owem">${top.map((x, i) => `<button class="nx-orow" data-nxpush="sprof" data-g="${x.g.id}" data-sid="${x.st.id}"><span class="rk">${i + 1}</span>${nxAv(x.st)}<span class="nx-tx"><b>${esc(x.st.name)}</b><small>${esc(x.g.solo ? 'Individual' : x.g.name)} · ${x.n} month${x.n === 1 ? '' : 's'}</small><span class="bar"><i style="width:${((x.debt / max) * 100).toFixed(0)}%"></i></span></span><em>${fmtSum(x.debt)}</em></button>`).join('')}</div>` : ''}`;
}
function pgStudents() {
  const n = S.groups.reduce((a, g) => a + g.students.length, 0), solos = soloGroups().filter((g) => g.students.length), left = S.groups.reduce((a, g) => a + (g.left || []).length, 0);
  const grow = (g) => `<button class="nx-row" data-nxpush="sgrp" data-g="${g.id}"><span class="nx-tile" style="--c:${gColor(g)}">${ic('Users')}</span><span class="nx-tx"><b>${esc(g.name)}</b><small>${esc(LVNAME(g.lvl))} · ${g.days.map((d) => DAYS[d]).join(' ')} · ${g.time}</small></span><em>${g.students.length}</em>${chev()}</button>`;
  return `${nxHead('Students', `${n} students`)}
    <label class="nx-search">${ic('Search')}<input id="nx-q" placeholder="Search students" autocomplete="off" data-noswipe></label>
    <div class="nx-hits" id="nx-hits" hidden></div>
    <div id="nx-lists"><div class="nx-sec">Groups</div><div class="nx-list">${workGroups().map(grow).join('') || '<p class="nx-empty">No groups yet</p>'}</div>
    ${solos.length ? `<div class="nx-sec">One to one</div><div class="nx-list"><button class="nx-row" data-nxpush="sgrp" data-g="solo"><span class="nx-tile" style="--c:#A2845E">${ic('UserRound')}</span><span class="nx-tx"><b>Individual students</b><small>${esc(solos.map((g) => g.students[0].name).sort().join(' · '))}</small></span><em>${solos.length}</em>${chev()}</button></div>` : ''}
    <div class="nx-list"><button class="nx-row" data-nxpush="sarch"><span class="nx-tile" style="--c:#8E8E93">${ic('History')}</span><span class="nx-tx"><b>Archived</b><small>Students who left · their history is kept</small></span><em>${left}</em>${chev()}</button></div>
    <button class="nx-btn soft" data-sheet="group">${ic('Plus')} New group</button></div>`;
}
function scSGrp(f) {
  const solo = f.g === 'solo', g = solo ? null : gById(f.g); if (!solo && !g) return scGone();
  const list = solo ? soloGroups().flatMap((x) => x.students.map((st) => ({ g: x, st }))) : g.students.map((st) => ({ g, st }));
  list.sort((a, b) => byName(a.st, b.st));
  const ym = ymOf(TODAY), p = g && planOf(g), cl = g && planned(g.lvl) ? curLes(g) : null;
  const rows = list.map(({ g: x, st }) => { const s = nxSt(x, st, ym), two = classesOf(st).twins.length > 1;
    return `<button class="nx-row" data-nxpush="sprof" data-g="${x.id}" data-sid="${st.id}">${nxAv(st)}<span class="nx-tx"><b>${esc(st.name)}</b><small>${solo ? esc(LVNAME(x.lvl)) + ' · ' : ''}${two ? 'Also in another class' : ''}</small></span><span class="nx-st ${s.k}">${esc(s.t)}</span>${chev()}</button>`; }).join('');
  return `${backBar('Students', solo ? '' : `<button class="tp-pill" data-sheet="group" data-g="${g.id}">${ic('Pencil')} Edit</button>`)}<div class="tp-inner">
    <div class="nx-title"><span class="nx-dot" style="background:${solo ? '#A2845E' : gColor(g)}"></span>${solo ? 'Individual students' : esc(g.name)}</div>
    <p class="nx-sub">${solo ? 'One-to-one lessons' : `${esc(LVNAME(g.lvl))} · ${g.days.map((d) => DAYS[d]).join(', ')} · ${g.time}`}</p>
    ${solo ? '' : `<div class="nx-tiles"><div><span>Price</span><b>${p && p.fee ? fmtSum(p.fee) : '—'}</b><small>a month</small></div><div><span>Now teaching</span><b>${cl ? `Week ${cl.w} · ${dayWord(g.lvl)} ${cl.l}` : '—'}</b><small>${cl ? esc((weekOf(g.lvl, cl.w).lessons[cl.l - 1] || {}).subtopic || '') : ''}</small></div></div>`}
    <div class="nx-sec">Students · A–Z</div><div class="nx-list">${rows || '<p class="nx-empty">No students yet</p>'}</div>
    ${solo ? '<button class="nx-btn soft" data-sheet="group">' + ic('Plus') + ' New individual student</button>' : `<button class="nx-btn soft" data-sheet="group" data-g="${g.id}">${ic('UserPlus')} Add a student to ${esc(g.name)}</button>`}</div>`;
}
function scSArch() {
  const rows = []; S.groups.forEach((g) => (g.left || []).forEach((st) => rows.push({ g, st })));
  rows.sort((a, b) => byName(a.st, b.st));
  return `${backBar('Students')}<div class="tp-inner"><div class="nx-title">Archived</div><p class="nx-sub">Everything they did and paid is kept. Bring someone back from their profile.</p>
    <div class="nx-list">${rows.map(({ g, st }) => `<button class="nx-row" data-nxpush="sprof" data-g="${g.id}" data-sid="${st.id}">${nxAv(st)}<span class="nx-tx"><b>${esc(st.name)}</b><small>${esc(g.name)} · left after ${ymName(st.until)}</small></span>${chev()}</button>`).join('') || '<p class="nx-empty">Nobody has left.</p>'}</div></div>`;
}
// what this student paid, with what (from the Pay pop-up), and on which days
function payFacts(sids) {
  const ps = S.pay.pays.filter((p) => sids.includes(p.sid)), total = ps.reduce((a, p) => a + p.amount, 0);
  const days = ps.map((p) => +p.date.slice(8, 10)).filter(Boolean), avg = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;
  const card = ps.filter((p) => p.by === 'card').length, cash = ps.filter((p) => p.by === 'cash').length;
  return { ps, total, avg, how: card + cash ? (card >= cash ? 'by card' : 'in cash') : '—' };
}
const ordinal = (n) => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
function monthsWith(st, g) { const a = new Date(st.added || g.created || Date.now()); return Math.max(1, (TODAY.getFullYear() - a.getFullYear()) * 12 + TODAY.getMonth() - a.getMonth() + 1); }
function scSProf(f) {
  const g = gById(f.g), st = g && stuOf(g, f.sid); if (!st) return scGone();
  const C = classesOf(st), sids = C.all.map((x) => x.st.id), P = prof(st.id), facts = payFacts(sids), left = st.until && st.until < ymOf(TODAY);
  const ask = C.ask ? `<div class="nx-ask"><b>Is ${esc(st.name)} one person?</b><p>${C.twins.map((x) => esc(x.g.solo ? 'Individual lessons' : x.g.name)).join(' and ')} both have “${esc(st.name)}”.</p><div><button class="nx-btn" data-nxsame="${esc(keyOf(st.name))}|1">Yes, one person</button><button class="nx-btn soft" data-nxsame="${esc(keyOf(st.name))}|0">No, two people</button></div></div>` : '';
  const ym = ymOf(TODAY), mon = [-5, -4, -3, -2, -1, 0].map((k) => ymAdd(ym, k));
  const cls = C.all.map(({ g: x, st: s }) => {
    const single = isSingle(x), p = planOf(x) || {}, price = single ? (S.pay.stuFee[s.id] ?? p.rate ?? 0) : (S.pay.stuFee[s.id] ?? p.fee ?? 0), cur = hasFee(x) ? ledger(x, s, ym) : null;
    let body = '';
    // 16 Nov (user): attendance only for individual students: their calendar sits right here (paid per lesson or by the month)
    const sym = f.ym || ym, sc = x.solo && typeof soloCount === 'function' ? soloCount(x, sym) : null, att = sc ? soloCal(x, sym) : '';
    if (single) {
      const n = sc ? sc.done : 0;
      body = `${att}<p class="nx-note">${MONTHS[+sym.slice(5) - 1]}: ${n} lesson${n === 1 ? '' : 's'} × ${fmtSum(price)} = <b>${fmtSum(sym === ym && cur ? cur.cur.charge : n * price)} so'm</b></p>`;
    } else if (cur) {
      const rows = ledger(x, s, ym).rows, at = (m) => rows.find((r) => r.m === m);
      body = `${att}<div class="nx-months">${mon.map((m) => { const r = at(m); if (!r || !r.charge) return `<div class="off">${miniRing(0, '#C7C7CC', 38, 5)}<span>${SHORT(m)}</span></div>`; const p = r.covered / r.charge, col = p >= 1 ? ST_COL.paid : p > 0 ? ST_COL.part : m < ym ? ST_COL.no : '#FF3B30'; return `<div>${miniRing(p, col, 38, 5)}<span>${SHORT(m)}</span></div>`; }).join('')}</div>
        ${cur.debt > 0 ? `<p class="nx-owe">Owes ${fmtSum(cur.debt)} so'm · ${cur.rows.filter((r) => r.charge - r.covered > 0).map((r) => SHORT(r.m)).join(', ')}</p>` : '<p class="nx-ok">Nothing owed</p>'}`;
    }
    return `<div class="nx-card"><div class="nx-ch"><b><i style="background:${x.solo ? '#A2845E' : gColor(x)}"></i>${esc(x.solo ? 'Individual · ' + LVNAME(x.lvl) : x.name)}</b><span>${hasFee(x) ? fmtSum(price) + (single ? ' a lesson' : ' a month') : 'No fee'}</span></div>${body}
      ${hasFee(x) ? `<button class="nx-btn" data-nxpay="${x.id}|${s.id}">${ic('Wallet')} Pay</button>` : ''}</div>`;
  }).join('');
  const det = [['Boy or girl', P.g ? (P.g === 'f' ? 'Girl' : 'Boy') : (guessG(st.name) === 'f' ? 'Girl?' : 'Boy?')], ['Phone', P.phone || '—'], ['Parent’s phone', P.parent || '—'], ['Birthday', P.bday ? (() => { const [m, d] = P.bday.split('-'); return `${+d} ${MONTHS[+m - 1]}`; })() : '—'], ['Started', ymName(ymOf(new Date(st.added || g.created || Date.now())))], ['Notes', P.note || '—']];
  return `${backBar('Back', `<button class="tp-pill" data-sheet="nxedit" data-g="${g.id}" data-sid="${st.id}">${ic('Pencil')} Edit</button>`)}<div class="tp-inner">
    <div class="nx-phead">${nxAv(st, 'xl')}<h2>${esc(st.name)}</h2><p>${C.all.map((x) => esc(x.g.solo ? 'Individual' : x.g.name)).join(' + ')}${left ? ' · archived' : ''}</p>
      <div class="nx-pacts">${P.phone ? `<a href="tel:${esc(P.phone.replace(/\s/g, ''))}">${ic('Smartphone')}Call</a><a href="https://t.me/${esc(P.phone.replace(/\D/g, '').replace(/^/, '+'))}" target="_blank" rel="noopener">${ic('MessageCircle')}Telegram</a>` : `<button data-sheet="nxedit" data-g="${g.id}" data-sid="${st.id}">${ic('Smartphone')}Add phone</button>`}${hasFee(g) ? `<button data-nxpay="${g.id}|${st.id}">${ic('Wallet')}Pay</button>` : ''}</div></div>
    ${ask}
    <div class="nx-tiles four"><div><span>With you</span><b>${monthsWith(st, g)} month${monthsWith(st, g) === 1 ? '' : 's'}</b></div><div><span>Paid in total</span><b>${fmtSum(facts.total)}</b></div><div><span>Usually pays</span><b>${facts.avg ? 'around the ' + ordinal(facts.avg) : '—'}</b></div><div><span>Mostly pays</span><b>${facts.how}</b></div></div>
    <div class="nx-sec">Classes</div>${cls}
    <div class="nx-sec">Details</div><div class="nx-list">${det.map(([a, b]) => `<div class="nx-row still"><span class="nx-tx"><b>${a}</b></span><em class="v">${esc(b)}</em></div>`).join('')}</div>
    <div class="nx-sec">Payments</div><div class="nx-list">${facts.ps.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8).map((p) => `<div class="nx-row still"><span class="nx-tx"><b>${p.m ? ymName(p.m) : 'Payment'}</b><small>${dDate(p.date)}${p.by ? ' · ' + (p.by === 'card' ? 'Card' : 'Cash') : ''}</small></span><em class="v pos">+${fmtSum(p.amount)}</em></div>`).join('') || '<p class="nx-empty">No payments yet</p>'}</div>
    <div class="nx-list">${left ? `<button class="nx-row" data-nxback="${g.id}|${st.id}"><span class="nx-tx"><b class="blue">Bring ${esc(st.name.split(' ')[0])} back</b></span></button>` : `<button class="nx-row" data-sheet="leave" data-g="${g.id}" data-sid="${st.id}"><span class="nx-tx"><b class="red">Move to archive</b><small>Stops coming · history is kept</small></span></button>`}</div></div>`;
}
// Edit a student's details (name and price stay in the group's own form)
function sheetNxEdit(s) {
  const g = gById(s.g), st = g && stuOf(g, s.sid); if (!st) return '';
  const P = prof(st.id), gg = P.g || guessG(st.name), bd = P.bday ? `2000-${P.bday}` : '';
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>${esc(st.name)}</b><button class="tp-back strong" data-nxsave="${st.id}">Save</button></div>
    <div class="tp-f"><span>Boy or girl</span><div class="nx-seg" id="nx-g"><button class="${gg === 'm' ? 'on' : ''}" data-nxg="m">Boy</button><button class="${gg === 'f' ? 'on' : ''}" data-nxg="f">Girl</button></div></div>
    <label class="tp-f"><span>Phone</span><input id="nx-phone" inputmode="tel" value="${esc(P.phone || '')}" placeholder="+998 90 123 45 67" autocomplete="off"></label>
    <label class="tp-f"><span>Parent’s phone</span><input id="nx-parent" inputmode="tel" value="${esc(P.parent || '')}" placeholder="+998 …" autocomplete="off"></label>
    <label class="tp-f"><span>Birthday</span><input id="nx-bday" type="date" value="${bd}"></label>
    <label class="tp-f"><span>Notes</span><input id="nx-note" value="${esc(P.note || '')}" placeholder="Anything to remember" autocomplete="off"></label>
    <p class="tp-small">Name and price: change them in the group (Edit on the group page).</p>`;
}

/* ================= PAYMENTS ================= */
function pgPayments() {
  const v = NX.pv, ym = payState().ym;
  const seg = `<div class="nx-seg big" data-noswipe><button class="${v === 'm' ? 'on' : ''}" data-nxpv="m">Month</button><button class="${v === 'y' ? 'on' : ''}" data-nxpv="y">Year</button></div>`;
  return nxHead('Payments', v === 'm' ? ymName(ym) : ym.slice(0, 4)) + seg + (v === 'm' ? payMonth(ym) : payYear(ym.slice(0, 4)));
}
const payGroups = () => { const out = workGroups().filter(hasFee).map((g) => ({ id: g.id, name: g.name, col: gColor(g), items: feeStu(g, payState().ym, true).map((st) => ({ g, st })) }));
  const solos = soloGroups().filter(hasFee); if (solos.length) out.push({ id: 'solo', name: 'Individual', col: '#A2845E', items: solos.flatMap((g) => feeStu(g, payState().ym, true).map((st) => ({ g, st }))) });
  out.forEach((x) => x.items.sort((a, b) => byName(a.st, b.st))); return out; };
function payMonth(ym) {
  const sc = statusCounts(ym), gs = payGroups(), FOLD = 2; // user, 16 Nov: 2 people, then "Show all"
  const nav = `<div class="nx-mon" data-noswipe><button data-nxmon="-1" aria-label="Previous month">${ic('ChevronLeft')}</button><b>${ymName(ym)}</b><button data-nxmon="1" aria-label="Next month">${ic('ChevronRight')}</button></div>`;
  // the summary: an outer ring cut into paid / part / not paid, and inside it one ring per group (like the Apple Watch)
  const per = gs.map((G) => { const r = G.items.map(({ g, st }) => nxSt(g, st, ym)).filter((s) => s.k !== 'free'); return { G, n: r.length, ok: r.filter((s) => s.k === 'paid').length, part: r.filter((s) => s.k === 'part').length }; }).filter((x) => x.n);
  const SZ = 164, C0 = SZ / 2; let rings = '';
  { const r = C0 - 7, L = 2 * Math.PI * r, tot = sc.n || 1; let off = 0;
    [[sc.ok, ST_COL.paid], [sc.part, ST_COL.part], [sc.unpaid, ST_COL.no]].forEach(([v, c]) => { if (!v) return; const len = (L * v) / tot, gap = 3; rings += `<circle cx="${C0}" cy="${C0}" r="${r}" fill="none" stroke="${c}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${Math.max(0.1, len - gap).toFixed(1)} ${L.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 ${C0} ${C0})"/>`; off += len; }); }
  per.forEach((x, i) => { const r = C0 - 22 - i * 13, L = 2 * Math.PI * r, p = (x.ok + x.part * 0.5) / x.n; if (r < 22) return;
    rings += `<circle cx="${C0}" cy="${C0}" r="${r}" fill="none" stroke="${x.G.col}" stroke-opacity=".16" stroke-width="9"/><circle cx="${C0}" cy="${C0}" r="${r}" fill="none" stroke="${x.G.col}" stroke-width="9" stroke-linecap="round" stroke-dasharray="${Math.max(0.1, L * p).toFixed(1)} ${L.toFixed(1)}" transform="rotate(-90 ${C0} ${C0})"/>`; });
  const sum = typeof f17Sum === 'function' ? f17Sum(per, sc) : `<div class="nx-card nx-sum2"><div class="rg"><svg class="nx-ring" width="${SZ}" height="${SZ}" viewBox="0 0 ${SZ} ${SZ}">${rings}</svg><div class="c"><b>${sc.ok}</b><span>of ${sc.n} paid</span></div></div>
    <div class="gl">${per.map((x) => `<div><span><i style="background:${x.G.col}"></i>${esc(x.G.name)}</span><b>${x.ok}/${x.n}</b><span class="bar"><i style="width:${((x.ok / x.n) * 100).toFixed(0)}%;background:${x.G.col}"></i></span></div>`).join('')}</div>
    <div class="nx-leg c full"><span><i style="background:${ST_COL.paid}"></i>${sc.ok} paid</span><span><i style="background:${ST_COL.part}"></i>${sc.part} part</span><span><i style="background:${ST_COL.no}"></i>${sc.unpaid} not paid</span></div></div>`;
  const card = (G) => { const open = !!NX.open[G.id], rows = G.items.map(({ g, st }) => ({ g, st, s: nxSt(g, st, ym) })).filter((x) => x.s.k !== 'free' || x.s.L), paid = rows.filter((x) => x.s.k === 'paid').length;
    const show = open ? rows : rows.slice(0, FOLD);
    // a row: the name opens the student (the months); the tick on the right: first tap = "Yes, paid", second tap = this month is paid
    const row = ({ g, st, s }) => `<div class="nx-prow"><button class="nx-pname" data-nxpush="sprof" data-g="${g.id}" data-sid="${st.id}">${nxAv(st)}<span class="nx-tx"><b>${esc(st.name)}</b><small class="${s.k}">${esc(s.t)}</small></span></button>
      ${s.k === 'paid' ? `<span class="nx-tick done" aria-label="Paid">${ic('Check')}</span>` : `<button class="nx-tick" data-nxtick="${g.id}|${st.id}" aria-label="${esc(st.name)} paid">${ic('Check')}<span>Yes, paid</span></button>`}</div>`;
    return `<div class="nx-card nx-pg"><div class="nx-ch"><b><i style="background:${G.col}"></i>${esc(G.name)}</b><span>${paid}/${rows.length} paid</span></div>
      <div class="nx-pbar">${rows.map((x) => `<i style="background:${ST_COL[x.s.k]}"></i>`).join('')}</div>
      ${rows.slice(0, FOLD).map(row).join('')}${rows.length > FOLD ? `<div class="nx-fold${open ? ' open' : ''}"><div>${rows.slice(FOLD).map(row).join('')}</div></div>` : ''}
      ${rows.length > FOLD ? `<button class="nx-more" data-nxopen="${G.id}" data-n="${rows.length}">${open ? 'Show less' : `Show all ${rows.length}`}${ic(open ? 'ArrowUp' : 'ChevronDown')}</button>` : ''}</div>`; };
  return nav + sum + gs.map(card).join('') + '<p class="nx-note c">Money totals are in Budget. Here: only who paid.</p>';
}
function payYear(y) {
  const M = Array.from({ length: 12 }, (_, i) => `${y}-${String(i + 1).padStart(2, '0')}`), cur = ymOf(TODAY);
  const nav = `<div class="nx-mon" data-noswipe><button data-nxyear="-1">${ic('ChevronLeft')}</button><b>${y}</b><button data-nxyear="1">${ic('ChevronRight')}</button></div>`;
  const card = (G) => { const rows = G.items.map(({ g, st }) => { const L = hasFee(g) ? ledger(g, st, M[11] < cur ? M[11] : cur) : null, at = (m) => L && L.rows.find((r) => r.m === m);
      return `<div class="nx-yr"><span class="n">${esc(st.name)}</span>${M.map((m) => { const r = at(m); if (!r || !r.charge || m > cur) return '<i class="e"></i>'; const p = r.covered / r.charge; return `<i style="background:${p >= 1 ? ST_COL.paid : p > 0 ? ST_COL.part : ST_COL.no}"></i>`; }).join('')}</div>`; }).join('');
    return `<div class="nx-card"><div class="nx-ch"><b><i style="background:${G.col}"></i>${esc(G.name)}</b></div><div class="nx-yr h"><span class="n"></span>${M.map((m) => `<b>${MONTHS[+m.slice(5) - 1][0]}</b>`).join('')}</div>${rows}</div>`; };
  return nav + payGroups().map(card).join('') + `<div class="nx-leg c"><span><i style="background:${ST_COL.paid}"></i>Paid</span><span><i style="background:${ST_COL.part}"></i>Part</span><span><i style="background:${ST_COL.no}"></i>Not paid</span><span><i style="background:#E5E5EA"></i>Not yet</span></div>`;
}

/* ---------- the Pay pop-up ---------- */
function payMonthsOf(g, st) { // owed months first, then this month and the next one
  const cur = ymOf(TODAY), L = ledger(g, st, ymAdd(cur, 1)), out = [];
  L.rows.forEach((r) => { if (r.charge - r.covered > 0 && (r.m <= cur || out.length < 4)) out.push({ m: r.m, left: r.charge - r.covered, charge: r.charge }); });
  return out.slice(0, 5);
}
function joinShare(g, st, m) { // a student who came in the middle of a month: fee ÷ lessons in the month × lessons since they came, rounded DOWN
  if (!st.added || isSingle(g) || ymOf(new Date(st.added)) !== m) return null;
  const [y, mo] = m.split('-').map(Number), from = iso(new Date(st.added)); let total = 0, had = 0;
  for (let d = 1; d <= 31; d++) { const dt = new Date(y, mo - 1, d); if (dt.getMonth() !== mo - 1) break; if (hasLesson(g, dt)) { total++; if (iso(dt) >= from) had++; } }
  const fee = S.pay.stuFee[st.id] ?? (planOf(g) || {}).fee ?? 0; if (!total || had >= total) return null;
  return { total, had, exact: (fee * had) / total, amount: round5((fee * had) / total) };
}
function sheetNxPay(s) {
  const g = gById(s.g), st = g && stuOf(g, s.sid); if (!st) return '';
  const ms = payMonthsOf(g, st); if (!s.months) s.months = ms.length ? [ms[0].m] : [];
  const sel = ms.filter((x) => s.months.includes(x.m)), owed = sel.reduce((a, x) => a + x.left, 0), mode = s.mode || 'full';
  const amt = s.amt != null ? s.amt : mode === 'part' ? round5(owed / 2) : mode === 'disc' ? Math.max(0, owed - (s.disc || 0)) : owed;
  const js = sel.length === 1 && joinShare(g, st, sel[0].m);
  return `<div class="tp-sh-h nx-sh3"><button class="tp-back" data-closesheet>Cancel</button><b>Payment</b><span class="sp"></span></div>
    <div class="nx-payh2" style="--c:${gColor(g)}">${nxAv(st, 'lg')}<b>${esc(st.name)}</b><span>${esc(g.solo ? 'Individual' : g.name)} · ${isSingle(g) ? fmtSum((planOf(g) || {}).rate || 0) + ' a lesson' : fmtSum(S.pay.stuFee[st.id] ?? (planOf(g) || {}).fee ?? 0) + ' a month'}</span></div>
    ${ms.length ? `<div class="nx-lab">Months <span class="nx-try">Tryout</span></div><div class="nx-chips" data-noswipe>${ms.map((x) => `<button class="${s.months.includes(x.m) ? 'on' : ''}" data-nxpm="${x.m}">${SHORT(x.m)}${x.m < ymOf(TODAY) ? ' · owes' : ''}<em>${fmtSum(x.left)}</em></button>`).join('')}</div>` : '<p class="nx-note">Nothing to pay right now.</p>'}
    <div class="nx-seg" data-noswipe><button class="${mode === 'full' ? 'on' : ''}" data-nxmode="full">Full</button><button class="${mode === 'disc' ? 'on' : ''}" data-nxmode="disc">Discount</button><button class="${mode === 'part' ? 'on' : ''}" data-nxmode="part">Part</button></div>
    ${mode === 'disc' ? `<div class="nx-disc"><label><span>Take off</span><input id="nx-disc" inputmode="numeric" value="${s.dv ? fmtSum(s.dv) : ''}" placeholder="0" data-nxnum autocomplete="off"></label>
      <div class="nx-seg sm" data-noswipe><button class="${s.dk !== 'pct' ? 'on' : ''}" data-nxdk="sum">so'm</button><button class="${s.dk === 'pct' ? 'on' : ''}" data-nxdk="pct">%</button></div></div>
      <p class="nx-note">${s.dk === 'pct' && s.dv ? `${s.dv}% of ${fmtSum(owed)} = ${fmtSum(s.disc || 0)} so'm off` : 'How much to take off: in so\'m or in %.'}</p>` : ''}
    <div class="nx-seg" data-noswipe><button class="${s.by === 'cash' ? 'on' : ''}" data-nxby="cash">Cash</button><button class="${s.by !== 'cash' ? 'on' : ''}" data-nxby="card">Card</button></div>
    <label class="nx-amt"><input id="nx-amt" inputmode="numeric" value="${fmtSum(amt)}" data-nxnum autocomplete="off"><span>so'm</span></label>
    <p class="nx-note c">${mode === 'part' ? 'The rest stays as debt.' : mode === 'disc' ? 'The discount is saved on the month.' : 'Tap the amount to change it.'}</p>
    ${js ? `<div class="nx-ask"><b>Came in the middle of ${MONTHS[+sel[0].m.slice(5) - 1]}</b><p>${js.had} of ${js.total} lessons · ${fmtSum(Math.round(js.exact))} → rounded down to <b>${fmtSum(js.amount)}</b></p><div><button class="nx-btn soft" data-nxjoin="${js.amount}">Use ${fmtSum(js.amount)}</button></div></div>` : ''}
    <button class="nx-btn big" data-nxapprove ${sel.length ? '' : 'disabled'}>${ic('Check')} Approve</button>`;
}
function approvePay() {
  const s = T.sheet, g = gById(s.g), st = g && stuOf(g, s.sid); if (!st) return;
  const amt = numOf('nx-amt'), sel = payMonthsOf(g, st).filter((x) => s.months.includes(x.m)); if (!sel.length || amt <= 0) return toast('Type the amount first');
  const undo = [], made = [];
  if (s.join) { const m = sel[0].m, was = S.pay.sfee[st.id + '|' + m]; applyFee(g, st, m, s.join, false); undo.push(() => { if (was == null) delete S.pay.sfee[st.id + '|' + m]; else S.pay.sfee[st.id + '|' + m] = was; }); }
  if (s.mode === 'disc' && s.disc > 0) { const k = st.id + '|' + sel[0].m, was = S.pay.sdisc[k]; S.pay.sdisc[k] = (was || 0) + s.disc; undo.push(() => { if (was == null) delete S.pay.sdisc[k]; else S.pay.sdisc[k] = was; }); }
  let rest = amt; // each chosen month gets what it still needs; anything left goes on the last one
  sel.forEach((x, i) => { const need = Math.max(0, chargeOf(g, st, x.m) - paidIn(st.id, x.m)), put = i === sel.length - 1 ? rest : Math.min(rest, need); if (put > 0) { const p = addPay(st.id, x.m, put); p.by = s.by === 'cash' ? 'cash' : 'card'; made.push(p); rest -= put; } });
  try { const l = tbRead(); l.forEach((e) => { const p = made.find((q) => q.id === e.id); if (p) e.by = p.by; }); localStorage.setItem(TB_KEY, JSON.stringify(l)); } catch (e) { /* Budget asks anyway */ } // Budget sees cash or card
  save(); closeSheetNow();
  payToast(`${st.name} · ${sel.map((x) => SHORT(x.m)).join(' + ')} · ${fmtSum(amt)} so'm`, () => { S.pay.pays = S.pay.pays.filter((x) => !made.includes(x)); made.forEach((p) => tbSend('del', p)); undo.forEach((f) => f()); });
}
const numOf = (id) => +String((document.getElementById(id) || {}).value || '').replace(/\D/g, '') || 0;

/* ---------- + : quick actions ---------- */
function sheetQuick() {
  const row = (attr, icon, col, t, sub) => `<button class="nx-row" ${attr}><span class="nx-tile" style="--c:${col}">${ic(icon)}</span><span class="nx-tx"><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</span>${chev()}</button>`;
  return `<div class="tp-sh-h"><span></span><b>Quick actions</b><button class="tp-back strong" data-closesheet>Done</button></div>
    <div class="nx-list">${row('data-sheet="nxwho"', 'Wallet', '#34C759', 'Pay', 'Mark a payment')}${row('data-sheet="nxadd"', 'UserPlus', '#007AFF', 'Add a student', 'To a group, or one to one')}${row('data-sheet="group"', 'Users', '#5856D6', 'New group', '')}</div>
    <div class="nx-list">${row('data-sheet="nxless" data-kind="cancel"', 'CalendarX2', '#FF3B30', 'Cancel a lesson', 'The plan waits')}${row('data-sheet="nxless" data-kind="move"', 'Clock', '#FF9500', 'Move a lesson', 'Another day')}${row('data-sheet="nxless" data-kind="extra"', 'Plus', '#AF52DE', 'Extra lesson', 'An added day')}${row('data-sheet="breaks"', 'Sun', '#FFCC00', 'Break or holiday', '')}</div>`;
}
function sheetNxWho(s) {
  const gs = payGroups();
  return `<div class="tp-sh-h"><button class="tp-back" data-sheet="quick">${ic('ChevronLeft')} Back</button><b>Who paid?</b><span></span></div>
    ${gs.map((G) => `<div class="nx-sec">${esc(G.name)}</div><div class="nx-list">${G.items.map(({ g, st }) => { const s2 = nxSt(g, st, ymOf(TODAY)); return `<button class="nx-row" data-nxpay="${g.id}|${st.id}">${nxAv(st)}<span class="nx-tx"><b>${esc(st.name)}</b><small class="${s2.k}">${esc(s2.t)}</small></span>${chev()}</button>`; }).join('')}</div>`).join('')}`;
}
function sheetNxAdd() {
  return `<div class="tp-sh-h"><button class="tp-back" data-sheet="quick">${ic('ChevronLeft')} Back</button><b>Add a student</b><span></span></div>
    <div class="nx-list">${workGroups().map((g) => `<button class="nx-row" data-sheet="group" data-g="${g.id}"><span class="nx-tile" style="--c:${gColor(g)}">${ic('Users')}</span><span class="nx-tx"><b>${esc(g.name)}</b><small>${g.students.length} students</small></span>${chev()}</button>`).join('')}
    <button class="nx-row" data-sheet="group"><span class="nx-tile" style="--c:#A2845E">${ic('UserRound')}</span><span class="nx-tx"><b>One-to-one student</b><small>Their own lessons and price</small></span>${chev()}</button></div>`;
}
function nextDays(g, n) { const out = []; for (let i = 0; i < 21 && out.length < n; i++) { const d = addDays(TODAY, i); if (hasLesson(g, d) && !(i === 0 && doneOn(g, d))) out.push(iso(d)); } return out; }
function sheetNxLess(s) {
  const kind = s.kind || 'cancel', T2 = { cancel: 'Cancel a lesson', move: 'Move a lesson', extra: 'Extra lesson' }[kind];
  const gs = S.groups.filter((g) => g.students.length).sort(byName);
  let body = '';
  if (kind === 'extra') body = `<label class="tp-f"><span>Day</span><input id="nx-day" type="date" value="${iso(addDays(TODAY, 1))}"></label>${gs.map((g) => `<button class="nx-row" data-nxextra="${g.id}"><span class="nx-tile" style="--c:${gColor(g)}">${ic('Plus')}</span><span class="nx-tx"><b>${esc(g.name)}</b><small>${g.time}</small></span></button>`).join('')}`;
  else body = gs.map((g) => { const ds = nextDays(g, 3); return ds.length ? `<div class="nx-sec">${esc(g.name)}</div><div class="nx-list">${ds.map((k) => `<div class="nx-row still"><span class="nx-tx"><b>${shortDay(k)}</b><small>${timeOn(g, fromIso(k))}</small></span>${kind === 'cancel' ? `<button class="nx-mini red" data-gcancel="${g.id}|${k}">Cancel</button>` : `<button class="nx-mini" data-nxmove="${g.id}|${k}">Move</button>`}</div>`).join('')}</div>` : ''; }).join('');
  return `<div class="tp-sh-h"><button class="tp-back" data-sheet="quick">${ic('ChevronLeft')} Back</button><b>${T2}</b><span></span></div>
    ${kind === 'move' ? `<label class="tp-f"><span>Move to</span><input id="nx-day" type="date" value="${iso(addDays(TODAY, 1))}"></label>` : ''}${body}`;
}

/* ================= HOME ================= */
// User, 15 Nov: the big card shows TODAY's lessons only (never earlier days). When today's lessons are over (or there are none),
// it shows the next lesson day instead (usually tomorrow).
function heroList() {
  const gs = S.groups.filter((g) => g.students.length), on = (d) => gs.filter((g) => hasLesson(g, d)).sort((a, b) => startMin(a, d) - startMin(b, d));
  const today = on(TODAY), over = today.length && today.every((g) => doneOn(g, TODAY) || nowMin() >= endMin(g, TODAY));
  if (today.length && !over) return today.map((g) => ({ g, d: TODAY, i: 0 }));
  for (let i = 1; i < 15; i++) { const d = addDays(TODAY, i), l = on(d); if (l.length) return l.map((g) => ({ g, d, i, after: !!today.length })); }
  return [];
}
function coursePct(g) {
  const L0 = lv(g.lvl); if (!planned(g.lvl) || !L0 || !L0.units) return null;
  const cl = curLes(g), total = L0.units.reduce((a, u) => a + u.lessons.length, 0), done = L0.units.slice(0, cl.w - 1).reduce((a, u) => a + u.lessons.length, 0) + cl.l - 1;
  return { p: total ? done / total : 0, done, total, weeks: L0.units.length, w: cl.w };
}
function heroCard(x, k, cur) {
  const { g, d, i } = x, s = startMin(g, d), e = endMin(g, d), today = i === 0, done = today && (doneOn(g, d) || nowMin() >= e), now = today && !done && nowMin() >= s;
  const t = (today && done ? taughtOn(g, d) : null) || (planned(g.lvl) ? curLes(g) : null), W = t && weekOf(g.lvl, t.w), les = W && (W.lessons[t.l - 1] || W.lessons[0]);
  const when = today ? (done ? 'Done today' : now ? 'Now' : 'Next · today') : i === 1 ? 'Tomorrow' : `${DAYS_LONG[wd(d)]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
  const mins = now ? e - nowMin() : today && !done ? s - nowMin() : 0, cd = mins > 0 ? (mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`) : '';
  return `<button class="nx-hcard${done ? ' done' : ''}${k === cur ? ' cur' : ''}" data-hk="${k}" style="--c:${gColor(g)};--off:${k - cur}" ${openLessonAttr(g)}>
    <span class="k">${when} · ${hhmm(s)}–${hhmm(e)}</span><b class="t">${esc(g.solo ? g.students[0].name + ' · Individual' : g.name)}</b>
    <span class="s">${t ? `Week ${t.w} · ${dayWord(g.lvl)} ${t.l}${les && les.subtopic ? ' · ' + esc(String(les.subtopic).replace(/^(Day|Lesson) \d+ · /, '')) : ''}` : esc(LVNAME(g.lvl))}</span>
    <span class="f"><span class="cd">${done ? ic('Check') + ' Taught' : cd ? `<small>${now ? 'Ends in' : 'Starts in'}</small>${cd}` : `<small>${esc(LVNAME(g.lvl))}</small>`}</span><span class="go">${ic('BookOpen')} Open</span></span></button>`;
}
function nxHero() {
  const L = heroList(); if (!L.length) return `<div class="nx-hero empty"><b>No lessons in the next two weeks</b><span>Enjoy the break.</span></div>`;
  if (NX.hero == null || NX.hero >= L.length) { const k = L.findIndex((x) => x.i > 0 || !(doneOn(x.g, x.d) || nowMin() >= endMin(x.g, x.d))); NX.hero = k < 0 ? 0 : k; }
  return `<div class="nx-hero" data-noswipe>${L.map((x, k) => heroCard(x, k, NX.hero)).join('')}${L.length > 1 ? `<span class="nx-pips">${L.map((_, k) => `<i class="${k === NX.hero ? 'on' : ''}"></i>`).join('')}</span>` : ''}</div>${L.length > 1 ? '<p class="nx-hint">Swipe the card up or down</p>' : '<div style="height:12px"></div>'}`;
}
function nxWidgets() {
  const ym = payState().ym, sc = statusCounts(ym), od = ffOverdue(), gs = feeGroups().filter((g) => sc.per[g.id] && sc.per[g.id].n);
  const legend = gs.map((g) => { const c = sc.per[g.id]; return `<span><i style="background:${gColor(g)}"></i>${esc(g.name)} <b>${c.paid + c.credit}/${c.n}</b></span>`; }).join('');
  const oweNames = []; feeGroups().forEach((g) => feeStu(g, ymOf(TODAY), true).forEach((st) => { const L = ledger(g, st, ymOf(TODAY)); const n = L.rows.filter((r) => r.charge - r.covered > 0).length; if (n >= 2) oweNames.push({ st, g, n, debt: L.debt }); }));
  oweNames.sort((a, b) => b.n - a.n || byName(a.st, b.st));
  return `<div class="nx-w2">
    <button class="nx-card nx-wpay" data-tab="4"><div class="nx-ch"><b>${ic('Wallet')} Paid · ${SHORT(ym)}</b></div><div class="r">${ffMiniRings(sc) || miniRing(0, '#ccc', 50, 6)}<div><b class="big">${sc.ok}<small>/${sc.n}</small></b><span>${sc.part} paid a part · ${sc.unpaid} not paid</span></div></div><div class="nx-gl">${legend}</div></button>
    <button class="nx-card nx-wowe" data-tab="4"><div class="nx-ch"><b>${ic('CalendarX2')} Owe 2+ months</b></div><b class="big red">${od.n}</b>${oweNames.slice(0, 3).map((x) => `<span class="nm">${esc(x.st.name)} <em>${x.n} mo</em></span>`).join('')}${oweNames.length > 3 ? `<span class="nm more">+${oweNames.length - 3} more</span>` : ''}</button></div>`;
}
function nxCourse() {
  const gs = S.groups.filter((g) => g.students.length && planned(g.lvl)); if (!gs.length) return '';
  const g = gById(T.ffg) && gs.includes(gById(T.ffg)) ? gById(T.ffg) : gs[0];
  const body = ffInsBody('crs', g, gs).replace(/(<button class="[^"]*" data-ffgrp="[^"]*")><i style="background:([^"]+)">/g, '$1 style="--gc:$2"><i style="background:$2">'); // every group button the same style, in its own colour
  return `<div class="ffc ffc2 nx-course h-in" data-noswipe><div class="nx-ch"><b>${ic('BookOpen')} Course progress</b></div>${body}</div>`;
}
pgHomeNew = function () {
  if (!S.groups.length) return pgHome();
  const day = `${DAYS_LONG[wd(TODAY)]} ${TODAY.getDate()} ${MONTHS[TODAY.getMonth()]}`, now = iso(TODAY), cur = S.pauses.filter((p) => p.from <= now && p.to >= now);
  const brk = cur.map((p) => `<div class="tp-card2 warn h-in">${ic('CalendarX2')}<p><b>${esc(p.label || 'Break')}</b> · no lessons until ${dDate(p.to)}</p></div>`).join('');
  return nxHead('Home', day) + ffMonthStrip() + brk + nxHero() + nxWidgets() + nxCourse(); // the month button is back (user, 16 Nov)
};

/* ---------- birthdays and breaks: a pop-up the day before and on the day ---------- */
function popItems() {
  const out = [], t0 = iso(TODAY), t1 = iso(addDays(TODAY, 1)), md = (k) => k.slice(5);
  S.groups.forEach((g) => g.students.forEach((st) => { const b = prof(st.id).bday; if (!b) return; if (b === md(t0)) out.push(['PartyPopper', '#FF2D55', `${st.name}’s birthday is today`, g.solo ? 'Individual' : g.name]); else if (b === md(t1)) out.push(['PartyPopper', '#FF2D55', `${st.name}’s birthday is tomorrow`, g.solo ? 'Individual' : g.name]); }));
  S.pauses.forEach((p) => { if (p.from === t0) out.push(['Sun', '#FF9500', `${p.label || 'A break'} starts today`, `No lessons until ${dDate(p.to)}`]); else if (p.from === t1) out.push(['Sun', '#FF9500', `${p.label || 'A break'} starts tomorrow`, `No lessons until ${dDate(p.to)}`]); });
  return out;
}
function sheetNxPop() {
  return `<div class="tp-sh-h"><span></span><b>Today</b><button class="tp-back strong" data-closesheet>OK</button></div>${popItems().map(([icn, col, t, sub]) => `<div class="nx-pop"><span class="nx-tile big" style="--c:${col}">${ic(icn)}</span><div><b>${esc(t)}</b><span>${esc(sub)}</span></div></div>`).join('')}`;
}

/* ================= SETTINGS: one page, in sections ================= */
function scSet2() {
  const P = profileGet(), n = S.groups.reduce((a, g) => a + g.students.length, 0);
  const row = (attr, icon, col, t, sub, right = '') => `<button class="nx-row" ${attr}><span class="nx-tile" style="--c:${col}">${ic(icon)}</span><span class="nx-tx"><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</span>${right ? `<em>${right}</em>` : ''}${chev()}</button>`;
  return `${backBar('Home')}<div class="tp-inner"><div class="nx-title">Settings</div>
    <div class="nx-list"><div class="nx-row still prof"><span class="tp-avatar big">${initials(P.name) || ic('UserRound')}</span><span class="nx-tx"><b>${esc(P.name || 'Your name')}</b><small>${esc(P.role || 'Teacher')}</small></span></div>
      <label class="nx-row still"><span class="nx-tx"><small>Your name</small><input id="f-pname" value="${esc(P.name || '')}" placeholder="Your name" autocomplete="off" data-profile></span></label>
      <label class="nx-row still"><span class="nx-tx"><small>Your role</small><input id="f-prole" value="${esc(P.role || '')}" placeholder="English teacher" autocomplete="off" data-profile></span></label></div>
    <div class="nx-sec">Account and safety</div><div class="nx-list">${row('data-nxsoon="Signing in comes with the online copy"', 'ShieldCheck', '#007AFF', 'Account', 'One sign-in for Teacher and Budget', 'Soon')}${row('data-nxsoon="Passcode and fingerprint come in the real build"', 'Fingerprint', '#5856D6', 'Passcode and fingerprint', 'Open the app with your face or finger', 'Soon')}</div>
    <div class="nx-sec">Teaching</div><div class="nx-list">${row('data-tab="2"', 'Users', '#5856D6', 'Groups and students', `${S.groups.length} groups · ${n} students`)}${row('data-sheet="group"', 'Plus', '#34C759', 'New group', '')}${row('data-sheet="breaks"', 'Sun', '#FF9500', 'Breaks and holidays', `${S.pauses.length} saved`)}</div>
    <div class="nx-sec">Payments</div><div class="nx-list">${row('data-sheet="extra"', 'Package', '#34C759', 'Extra charges', 'A book, a trip…')}<div class="nx-row still"><span class="nx-tile" style="--c:#8E8E93">${ic('Percent')}</span><span class="nx-tx"><b>Rounding</b><small>Part months round DOWN to 5 000 · you can change each one</small></span></div></div>
    <div class="nx-sec">Three dots</div><div class="nx-list">${row('data-nxpush="setdots"', 'Sliders', '#FF3B30', 'What each dot opens', 'Red · Yellow · Green, for every place')}</div>
    <div class="nx-sec">Look</div><div class="nx-list"><div class="nx-row still"><span class="nx-tx"><b>Style</b></span><div class="tp-seg2 slide" id="look-seg" style="--n:2;width:180px"><span class="seg-thumb" style="--i:${lookGet() === 'glass' ? 1 : 0}"></span><button class="${lookGet() === 'normal' ? 'on' : ''}" data-look="normal">Normal</button><button class="${lookGet() === 'glass' ? 'on' : ''}" data-look="glass">Glass</button></div></div></div>
    <div class="nx-sec">Backup</div><div class="nx-list">${row('data-backup', 'Download', '#30B0C7', 'Save a backup file', 'Send it to yourself in Telegram')}<label class="nx-row"><span class="nx-tile" style="--c:#30B0C7">${ic('Upload')}</span><span class="nx-tx"><b>Restore from a backup file</b><small>A copy is kept first</small></span>${chev()}<input type="file" accept=".json,application/json,text/plain" data-restore hidden></label>${row('data-sheet="copies"', 'History', '#30B0C7', 'Automatic copies', 'One a day, kept two weeks')}${row('data-nxsoon="The daily online copy comes with the account"', 'ShieldCheck', '#30B0C7', 'Daily online copy', 'Back on a new phone with one sign-in', 'Soon')}</div>
    <div class="nx-sec">Update</div><div class="nx-list">${row('data-appupdate', 'Download', '#007AFF', 'Update the app', 'Get the newest version now, without closing the app')}</div><div class="nx-sec">About</div><div class="nx-list"><div class="nx-row still"><span class="nx-tile" style="--c:#8E8E93">${ic('Info')}</span><span class="nx-tx"><b>${VERSION_LABEL}</b><small>Updated 23 Nov 2026</small></span></div></div></div>`;
}
const scSetDots = () => `${backBar('Settings')}<div class="tp-inner"><div class="nx-title">Three dots</div>${dotsSettingsHtml()}</div>`;

/* ---------- plug everything in ---------- */
Object.assign(PUSH, { sgrp: scSGrp, sarch: scSArch, sprof: scSProf, set2: scSet2, setdots: scSetDots });
Object.assign(SHEETS, { quick: sheetQuick, nxpay: sheetNxPay, nxwho: sheetNxWho, nxadd: sheetNxAdd, nxless: sheetNxLess, nxedit: sheetNxEdit, nxpop: sheetNxPop });
PAGES[2] = () => pgStudents(); PAGES[4] = () => pgPayments(); // ffpolish.js put the old Attendance page here
// Units: no attendance button any more (groups have no attendance)
{ const _u = PAGES[1]; PAGES[1] = () => _u().replace(/<button data-push="register"[^>]*>[\s\S]*?<\/button>/g, ''); }
// Library: Books and Audio only (Videos removed)
{ const _b = PAGES[3]; PAGES[3] = () => { if (T.bookSeg === 'video') T.bookSeg = 'books'; return _b().replace(/<button class="[^"]*" data-bookseg="video">[\s\S]*?<\/button>/, '').replace(/style="--n:3"><span class="seg-thumb"/, 'style="--n:2"><span class="seg-thumb"').replace('<div class="tp-lt">Books</div>', '<div class="tp-lt">Library</div>'); }; }

{
  const _h = home2Click;
  home2Click = function (b, d) {
    if (d.nxset !== undefined || (d.sheet === 'settings')) { T.sheet = null; pushScreen({ s: 'set2' }); return true; }
    if (d.nxpush) { if (T.sheet) { T.sheet = null; draw(); } T.push.push({ s: d.nxpush, g: d.g, sid: d.sid }); stepIn(); draw(true); return true; }
    if (d.nxpay) { const [g, sid] = d.nxpay.split('|'); const sh = { s: 'nxpay', g, sid, by: 'card' }; if (T.sheet) { T.sheet = sh; draw(); } else openSheet(sh); return true; }
    if (d.nxpm) { const s = T.sheet, L = s.months; if (L.includes(d.nxpm)) { if (L.length > 1) L.splice(L.indexOf(d.nxpm), 1); } else L.push(d.nxpm); L.sort(); s.amt = null; s.join = 0; draw(); return true; }
    if (d.nxmode) { T.sheet.mode = d.nxmode; T.sheet.amt = null; draw(); return true; }
    if (d.nxby) { T.sheet.by = d.nxby; T.sheet.amt = numOf('nx-amt') || null; draw(); return true; }
    if (d.nxjoin) { T.sheet.join = +d.nxjoin; T.sheet.amt = +d.nxjoin; draw(); return true; }
    if (d.nxapprove !== undefined) { approvePay(); return true; }
    if (d.nxdk) { const s = T.sheet; s.dk = d.nxdk; s.dv = 0; s.disc = 0; s.amt = null; draw(); return true; }
    if (d.nxtick) { // first tap: "Yes, paid" comes out; second tap within 4 s: this month is paid
      if (!b.classList.contains('arm')) { document.querySelectorAll('.nx-tick.arm').forEach((x) => x.classList.remove('arm')); b.classList.add('arm'); b._t = Date.now(); clearTimeout(b._u); b._u = setTimeout(() => b.classList.remove('arm'), 4000); return true; }
      if (Date.now() - b._t < 350) return true; // a double tap is not a decision
      const [gid, sid] = d.nxtick.split('|'), g = gById(gid), st = g && stuOf(g, sid), m = payState().ym; if (!st) return true;
      const left = Math.max(0, chargeOf(g, st, m) - paidIn(sid, m)); if (!left) { toast('Nothing to pay for ' + MONTHS[+m.slice(5) - 1]); return true; }
      b.classList.add('ok'); const p = addPay(sid, m, left); save();
      setTimeout(() => { draw(); payToast(`${st.name} · ${MONTHS[+m.slice(5) - 1]} · ${fmtSum(left)} so'm paid`, () => { S.pay.pays = S.pay.pays.filter((x) => x !== p); tbSend('del', p); }); }, 420);
      return true; }
    if (d.nxpv) { NX.pv = d.nxpv; draw(); return true; }
    if (d.nxopen) { NX.open[d.nxopen] = !NX.open[d.nxopen]; const on = NX.open[d.nxopen], fold = b.closest('.nx-pg') && b.closest('.nx-pg').querySelector('.nx-fold');
      if (!fold) { draw(); return true; } // 16 Nov (user): the button bounces, the rest of the group slides open smoothly
      fold.classList.toggle('open', on); b.innerHTML = (on ? 'Show less' : `Show all ${b.dataset.n}`) + ic(on ? 'ArrowUp' : 'ChevronDown');
      b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); return true; }
    if (d.nxmon) { const p = payState(); p.ym = ymAdd(p.ym, +d.nxmon); draw(); return true; }
    if (d.nxym) { payState().ym = d.nxym; NX.pv = 'm'; draw(); return true; }
    if (d.nxyear) { const p = payState(); p.ym = ymAdd(p.ym, 12 * +d.nxyear); draw(); return true; }
    if (d.nxsame) { const [k, v] = d.nxsame.split('|'); S.same = S.same || {}; S.same[k] = +v; save(); draw(); toast(+v ? 'Joined: one person, two classes' : 'Kept as two people'); return true; }
    if (d.nxg) { b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); return true; }
    if (d.nxsave) { const sid = d.nxsave, gEl = document.querySelector('#nx-g .on'), bd = (document.getElementById('nx-bday') || {}).value || '';
      profSet(sid, { g: gEl ? gEl.dataset.nxg : '', phone: (document.getElementById('nx-phone') || {}).value.trim(), parent: (document.getElementById('nx-parent') || {}).value.trim(), bday: bd ? bd.slice(5) : '', note: (document.getElementById('nx-note') || {}).value.trim() });
      save(); closeSheetNow(); toast('Saved'); return true; }
    if (d.nxextra) { const g = gById(d.nxextra), k = (document.getElementById('nx-day') || {}).value; if (!g || !k) return true; calOf(g).add[k] = true; if (calOf(g).st[k] === 'cancel') delete calOf(g).st[k]; save(); closeSheetNow(); payToast(`${g.name}: extra lesson on ${shortDay(k)}`, () => { delete calOf(g).add[k]; }); return true; }
    if (d.nxmove) { const [gid, k] = d.nxmove.split('|'), g = gById(gid), to = (document.getElementById('nx-day') || {}).value; if (!g || !to) return true; if (to === k) return toast('Pick another day'), true;
      const c = calOf(g); c.st[k] = 'moved'; c.add[to] = true; save(); closeSheetNow(); payToast(`${g.name}: ${shortDay(k)} → ${shortDay(to)}`, () => { delete c.st[k]; delete c.add[to]; }); return true; }
    if (d.nxback) { const [gid, sid] = d.nxback.split('|'), g = gById(gid), i = g ? (g.left || []).findIndex((x) => x.id === sid) : -1; if (i < 0) return true; const st = g.left.splice(i, 1)[0]; delete st.until; g.students.push(st); save(); draw(); toast(`${st.name} is back in ${g.solo ? 'their lessons' : g.name}`); return true; }
    if (d.nxsoon) { toast(d.nxsoon); return true; }
    return _h(b, d);
  };
}
// amounts show spaces while you type (1 500 000); the Students search filters as you type
document.addEventListener('input', (e) => {
  const t = e.target;
  if (t.dataset && t.dataset.nxnum !== undefined) { const v = +t.value.replace(/\D/g, '') || 0; t.value = v ? fmtSum(v) : ''; if (T.sheet && T.sheet.s === 'nxpay') { if (t.id === 'nx-amt') T.sheet.amt = v; if (t.id === 'nx-disc') { const s = T.sheet, g = gById(s.g), st = stuOf(g, s.sid), owed = payMonthsOf(g, st).filter((x) => s.months.includes(x.m)).reduce((q, x) => q + x.left, 0);
      s.dv = s.dk === 'pct' ? Math.min(100, v) : v; if (s.dk === 'pct') t.value = s.dv ? String(s.dv) : ''; s.disc = s.dk === 'pct' ? Math.round((owed * s.dv) / 100) : v; s.amt = null;
      const a = document.getElementById('nx-amt'); if (a) a.value = fmtSum(Math.max(0, owed - s.disc)); } } }
  if (t.id === 'nx-q') {
    const q = t.value.trim().toLowerCase(), hits = document.getElementById('nx-hits'), lists = document.getElementById('nx-lists'); if (!hits) return;
    if (!q) { hits.hidden = true; lists.hidden = false; return; }
    const res = []; S.groups.forEach((g) => stuAll(g).forEach((st) => { if (st.name.toLowerCase().includes(q)) res.push({ g, st }); }));
    res.sort((a, b) => byName(a.st, b.st));
    hits.innerHTML = `<div class="nx-list">${res.map(({ g, st }) => `<button class="nx-row" data-nxpush="sprof" data-g="${g.id}" data-sid="${st.id}">${nxAv(st)}<span class="nx-tx"><b>${esc(st.name)}</b><small>${esc(g.solo ? 'Individual' : g.name)}${st.until && st.until < ymOf(TODAY) ? ' · archived' : ''}</small></span>${chev()}</button>`).join('') || '<p class="nx-empty">Nobody with that name</p>'}</div>`;
    hits.hidden = false; lists.hidden = true;
  }
}, true);

/* ---------- the class card: swipe up / down ---------- */
{
  let st = null;
  // iPhone widget stack (user, 15 Nov): the card slides out, the next one rises from behind; at the first or last card it bounces
  const bounce = (h, dir) => { h.classList.remove('bump-up', 'bump-down'); void h.offsetWidth; h.classList.add(dir > 0 ? 'bump-up' : 'bump-down'); setTimeout(() => h.classList.remove('bump-up', 'bump-down'), 450); };
  const set = (k) => { const h = document.querySelector('.tp-page .nx-hero'); if (!h) return; const cards = h.querySelectorAll('.nx-hcard'); const want = k; k = Math.max(0, Math.min(cards.length - 1, k)); /* no bump */ NX.hero = k;
    cards.forEach((c) => { c.style.setProperty('--off', +c.dataset.hk - k); c.style.removeProperty('--drag'); c.classList.toggle('cur', +c.dataset.hk === k); }); h.querySelectorAll('.nx-pips i').forEach((p, j) => p.classList.toggle('on', j === k)); R.pages[0]._html = null; };
  document.addEventListener('pointerdown', (e) => { const h = e.target.closest && e.target.closest('.nx-hero'); if (!h || h.classList.contains('empty')) return; st = { y0: e.clientY, x0: e.clientX, id: e.pointerId, on: false, h }; }, true);
  document.addEventListener('pointermove', (e) => { if (!st || e.pointerId !== st.id) return; let dy = e.clientY - st.y0;
    const cs = [...st.h.querySelectorAll('.nx-hcard')], n = cs.length, at = Math.max(0, cs.findIndex((c) => c.classList.contains('cur'))); if (at !== NX.hero) NX.hero = at; if ((at === 0 && dy > 0) || (at === n - 1 && dy < 0)) dy /= 3; // pulling past the end: it gives a little, like iPhone
    if (!st.on) { if (Math.abs(dy) < 8) return; if (Math.abs(e.clientX - st.x0) > Math.abs(dy)) { st = null; return; } st.on = true; st.h.classList.add('drag'); }
    st.h.querySelectorAll('.nx-hcard').forEach((c) => c.style.setProperty('--drag', dy + 'px')); }, true);
  const end = (e) => { if (!st || e.pointerId !== st.id) return; const s = st; st = null; s.h.classList.remove('drag'); if (!s.on) return; const dy = e.clientY - s.y0; NX.sup = Date.now(); set(NX.hero + (dy < -40 ? 1 : dy > 40 ? -1 : 0)); };
  document.addEventListener('pointerup', end, true); document.addEventListener('pointercancel', end, true);
  document.addEventListener('click', (e) => { if (NX.sup && Date.now() - NX.sup < 350 && e.target.closest && e.target.closest('.nx-hero')) { e.stopPropagation(); e.preventDefault(); } }, true);
  document.addEventListener('wheel', (e) => { const h = e.target.closest && e.target.closest('.nx-hero'); if (!h) return; e.preventDefault();
    // one swipe = one card: a touchpad sends many wheel events (with momentum); the card moves once and waits until they stop
    clearTimeout(NX.wt); NX.wt = setTimeout(() => { NX.wl = 0; }, 280);
    if (NX.wl || Math.abs(e.deltaY) < 8) return; NX.wl = 1; set(NX.hero + (e.deltaY > 0 ? 1 : -1)); }, { passive: false, capture: true });
}

/* ---------- group lessons count by themselves (no attendance): a lesson that has ended moves the plan; a cancelled one does not ---------- */
function nxAutoTeach() {
  if (!S.groups.length) return false;
  if (!S.autoFrom) { S.autoFrom = iso(addDays(TODAY, -1)); }
  let ch = false; const from = fromIso(S.autoFrom);
  S.groups.forEach((g) => { if (g.solo || !planned(g.lvl) || !g.students.length) return;
    for (let d = new Date(Math.max(from, midnight(new Date(g.created || 0)))); d <= TODAY; d = addDays(d, 1)) {
      const k = iso(d); if (!hasLesson(g, d) || !lessonEnded(g, d) || doneOn(g, d) || canceledOn(g, k)) continue;
      (S.saved[g.id] = S.saved[g.id] || {})[k] = true; autoTaught(g, k); ch = true; } });
  if (ch) save(); return ch;
}
setTimeout(() => { try { if (nxAutoTeach()) draw(); } catch (e) { console.error(e); } }, 900);
setInterval(() => { try { if (nxAutoTeach()) draw(); } catch (e) { /* next minute */ } }, 60000);
// the pop-up for birthdays and breaks, once a day
setTimeout(() => { try { const k = 'nx-pop'; if (localStorage.getItem(k) === iso(TODAY) || !popItems().length || T.sheet) return; localStorage.setItem(k, iso(TODAY)); openSheet({ s: 'nxpop' }); } catch (e) { /* none */ } }, 1400);

/* ---------- opening animations: replay when a tab is opened ---------- */
{
  const play = (i) => { const p = R && R.pages[i]; if (!p) return; p.classList.remove('nx-play'); p.querySelectorAll('.nin').forEach((x) => x.classList.remove('nin')); void p.offsetWidth; p.classList.add('nx-play'); };
  const _go = goTab;
  goTab = function (i) { const r = _go.apply(this, arguments); requestAnimationFrame(() => play(i)); return r; };
  setTimeout(() => play(T.tab), 60);
}

/* group colours: the iPhone colours, a little brighter (user, 15 Nov) */
IOS.splice(0, IOS.length, '#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF2D55', '#FF3B30', '#FFCC00');
PIE.splice(0, PIE.length, ...IOS);
