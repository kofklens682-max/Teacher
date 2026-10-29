'use strict';
/* PAYMENTS (user, 29 Oct 2026, second version). The user found "Budget owns the payments" confusing, so:
     Teacher owns groups, students, fees AND who paid. You mark payments here, month by month: tap a month = paid in full,
     tap a paid month = part payment or not paid. Nothing is guessed: every payment says which month it is for (p.m).
     Budget only gets the money: each payment you mark waits in localStorage "teacher-to-budget"; when you open Budget it
     pops up "Nikolay paid 200 000 for October" with Add to my balance / Already counted. Removing a payment here asks
     Budget to take it out again (or simply drops it if Budget has not added it yet).
   Teacher still publishes "teacher-roster" (groups, students, monthly charges) so Budget knows the names.
   Fresh start (user's choice): once, the old payment marks are cleared (an automatic copy is kept first); groups,
   students, fees and discounts stay. Loaded after home2.js: it replaces ledger() and the payment sheets. */

const RS_KEY = 'teacher-roster', TB_KEY = 'teacher-to-budget';
const FUTURE = 24; // months ahead you can look at

/* ---------- the first month a student owes ----------
   Everybody owes from the month the app started counting fees (September 2026). Only a student added after 1 Nov 2026
   starts in the month they joined. You can change it on the student's page ("Starts paying from"). */
const NEW_RULE = Date.parse('2026-11-01');
function firstMonth(g, s) {
  const f = S.pay.from && S.pay.from[s.id]; if (/^\d{4}-\d\d$/.test(f || '')) return f;
  const joined = s.added && s.added >= NEW_RULE ? ymOf(new Date(s.added)) : '';
  return [S.pay.start, joined].sort().pop();
}

/* ---------- the payments of one student ---------- */
const YM = /^\d{4}-\d\d$/;
function payRows(sid) {
  return S.pay.pays.filter((p) => p.sid === sid).map((p) => ({ ...p, alloc: YM.test(p.m || '') ? [{ m: p.m, amount: +p.amount }] : null }))
    .sort((a, b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id)));
}
const paidIn = (sid, m) => S.pay.pays.filter((p) => p.sid === sid && p.m === m).reduce((a, p) => a + +p.amount, 0);

/* ---------- the rule: what covers what ----------
   A payment pays the month it was marked for. More than that month's fee is credit (it is used for the oldest unpaid month). */
function ledger(g, s, ym) {
  const all = payRows(s.id), end = ymAdd(ym, 1) + '-01', first = firstMonth(g, s);
  const cov = {}; let money = 0, future = 0;
  all.forEach((p) => {
    if (p.alloc) p.alloc.forEach((a) => { if (a.m > ym) future += a.amount; else if (a.m < first) money += a.amount; else cov[a.m] = (cov[a.m] || 0) + a.amount; });
    else money += p.amount;
  });
  const rows = [];
  for (let m = first; m <= ym; m = ymAdd(m, 1)) {
    const charge = chargeOf(g, s, m), have = cov[m] || 0;
    let covered = Math.min(have, charge); money += have - covered;
    rows.push({ m, charge, covered });
  }
  rows.forEach((r) => { const use = Math.min(money, r.charge - r.covered); money -= use; r.covered += use; }); // credit pays the oldest month first
  const c = rows.length ? rows[rows.length - 1] : { m: ym, charge: 0, covered: 0 };
  const debt = rows.reduce((a, r) => a + r.charge - r.covered, 0), older = debt - (c.charge - c.covered);
  const credit = money + future, nextFee = isSingle(g) ? c.charge : chargeOf(g, s, ymAdd(ym, 1));
  let st;
  if (debt > 0) st = c.covered > 0 ? 'part' : 'unpaid';
  else if (credit >= nextFee && credit > 0) st = 'prepaid';
  else if (credit > 0) st = 'credit';
  else st = c.charge === 0 ? 'free' : 'paid';
  const mine = all.filter((p) => p.date < end || (p.alloc && p.alloc.some((a) => a.m <= ym)));
  const last = mine.filter((p) => p.date.slice(0, 7) === ym).pop();
  return { rows, cur: c, debt, older, credit, st, last, mine };
}

/* ---------- Teacher -> Budget ---------- */
function publishRoster() {
  try {
    const to = ymAdd(ymOf(TODAY), FUTURE), groups = [], charges = {};
    S.groups.forEach((g) => {
      const p = planOf(g) || {};
      groups.push({ id: g.id, name: g.name, color: grpColor(g), kind: p.kind === 'single' ? 'single' : 'group', fee: p.kind === 'single' ? 0 : p.fee || 0, rate: p.kind === 'single' ? p.rate || 0 : 0, students: g.students.map((s) => ({ id: s.id, name: s.name })) });
      if (!hasFee(g)) return;
      g.students.forEach((s) => { const o = charges[s.id] = {}; for (let m = firstMonth(g, s); m <= to; m = ymAdd(m, 1)) o[m] = chargeOf(g, s, m); });
    });
    const json = JSON.stringify({ v: 1, at: Date.now(), start: S.pay.start, groups, charges });
    if (json !== localStorage.getItem(RS_KEY)) localStorage.setItem(RS_KEY, json);
  } catch (e) { /* the app still works; Budget keeps the last list */ }
}
// The list Budget pops up: { op: 'add' | 'del', id, person, group, gid, sid, m, amount, date }
const tbRead = () => { try { const l = JSON.parse(localStorage.getItem(TB_KEY) || '[]'); return Array.isArray(l) ? l.filter((x) => x && x.op) : []; } catch (e) { return []; } };
function tbSend(op, p) {
  const g = S.groups.find((x) => x.students.some((t) => t.id === p.sid)), st = g && g.students.find((t) => t.id === p.sid);
  let l = tbRead();
  if (op === 'del' && l.some((x) => x.op === 'add' && x.id === p.id)) l = l.filter((x) => x.id !== p.id); // Budget never saw it: just drop it
  else l.push({ op, id: p.id, person: st ? st.name : '', group: g ? g.name : '', gid: g ? g.id : '', sid: p.sid, m: p.m, amount: +p.amount, date: p.date, at: Date.now() });
  try { if (l.length) localStorage.setItem(TB_KEY, JSON.stringify(l)); else localStorage.removeItem(TB_KEY); } catch (e) { toast('Could not tell Budget. Add it there by hand.'); }
}
function addPay(sid, m, amount) { const p = { id: uid(), sid, m, amount: Math.round(amount), date: iso(TODAY) }; S.pay.pays.push(p); tbSend('add', p); return p; }
function delPays(sid, m) { const gone = S.pay.pays.filter((p) => p.sid === sid && p.m === m); S.pay.pays = S.pay.pays.filter((p) => !gone.includes(p)); gone.forEach((p) => tbSend('del', p)); return gone; }

{ const _save = save; save = function () { _save(); publishRoster(); }; }
{ let tries = 0; const t = setInterval(() => { if (S.groups.length || ++tries > 20) { clearInterval(t); freshStart(); publishRoster(); } }, 500); } // once, when the app has opened
document.addEventListener('visibilitychange', () => { if (!document.hidden) publishRoster(); });

// The fresh start the user asked for (30 Oct 2026): the payment marks made with the old ways are cleared once, after a copy.
async function freshStart() {
  if (S.pay.fresh1) return;
  const n = S.pay.pays.length;
  if (n) { try { await makeCopy('before', 'the fresh start of payments'); } catch (e) { /* the daily copy and the second copy still exist */ } }
  S.pay.pays = []; S.pay.fresh1 = Date.now();
  try { localStorage.removeItem(TB_KEY); localStorage.removeItem('budget-payments'); } catch (e) { /* nothing waiting */ }
  save(); if (typeof draw === 'function') draw();
  if (n) toast('Fresh start: mark who paid again. A copy of the old marks is kept in Automatic copies.');
}

/* ---------- a small "Undo" next to the message ---------- */
let undoFn = null, undoT = 0;
function payToast(msg, fn) {
  toast(msg); undoFn = fn;
  const el = root && root.querySelector('.tp-toast'); if (!el) return;
  el.innerHTML = `<span>${esc(msg)}</span><button class="tp-undo" data-payundo>Undo</button>`;
  clearTimeout(undoT); undoT = setTimeout(() => { undoFn = null; }, 4000);
}

/* ---------- the student's page: the months, tap to mark ---------- */
function monthsOf(g, st) { // from the first month to two months ahead, and further if something was paid ahead
  const cur = ymOf(TODAY); let top = ymAdd(cur, 2);
  S.pay.pays.forEach((p) => { if (p.sid === st.id && YM.test(p.m || '') && p.m > top) top = p.m; });
  const out = []; for (let m = firstMonth(g, st); m <= top; m = ymAdd(m, 1)) out.push(m);
  return out;
}
const ymLabel = (m) => SHORT(m) + (m.slice(0, 4) !== ymOf(TODAY).slice(0, 4) ? ' ' + m.slice(2, 4) : '');
function monthGrid(g, st, open) {
  const L = ledger(g, st, monthsOf(g, st).slice(-1)[0]), cur = ymOf(TODAY);
  return `<div class="pm-grid">${L.rows.map((r) => {
    const left = r.charge - r.covered, fut = r.m > cur;
    const cls = r.charge === 0 && !r.covered ? 'free' : left <= 0 ? 'ok' : r.covered > 0 ? 'part' : fut ? 'fut' : 'owe';
    const sub = r.charge === 0 && !r.covered ? 'No charge' : left <= 0 ? 'Paid' : r.covered > 0 ? `${dMoney(left)} left` : fut ? dMoney(r.charge) : 'Not paid';
    return `<button class="pm ${cls}${open === r.m ? ' sel' : ''}" data-paym="${st.id}|${g.id}|${r.m}"><b>${ymLabel(r.m)}</b><span>${sub}</span>${left <= 0 && r.charge ? `<i>${ic('Check')}</i>` : ''}</button>`;
  }).join('')}</div>`;
}
function editPanel(g, st, m) { // a paid or part-paid month: change it
  const charge = chargeOf(g, st, m), paid = paidIn(st.id, m), ps = S.pay.pays.filter((p) => p.sid === st.id && p.m === m);
  return `<div class="pm-edit"><b>${ymName(m)}</b><p>${paid ? `${dMoney(paid)} of ${dMoney(charge)} so'm paid${ps.length ? ' · ' + ps.map((p) => dDate(p.date)).join(', ') : ''}` : `${dMoney(charge)} so'm to pay`}</p>
    <label class="tp-f"><span>How much was paid for ${ymName(m)} (so'm)</span><input id="f-pmamt" inputmode="numeric" value="${paid || charge || ''}" autocomplete="off"></label>
    <div class="pm-btns"><button class="tp-cta" data-pmsave="${st.id}|${g.id}|${m}">Save</button>${paid ? `<button class="tp-cta ghost" data-pmnone="${st.id}|${g.id}|${m}">Not paid</button>` : ''}</div></div>`;
}
function sheetPayRec(s) {
  const g = gById(s.g), st = g && g.students.find((x) => x.id === s.sid); if (!st) return '<p class="tp-small">This student is not in the group any more.</p>';
  const ym = ymOf(TODAY), L = ledger(g, st, ym), single = isSingle(g), own = S.pay.stuFee[st.id];
  const owe = L.rows.filter((r) => r.charge - r.covered > 0);
  const firsts = []; for (let m = S.pay.start; m <= ymAdd(ym, 3); m = ymAdd(m, 1)) firsts.push(m);
  return `<div class="tp-sh-h"><span></span><b>${esc(st.name)}</b><button class="tp-back strong" data-closesheet>Done</button></div>
    <div class="pm-top ${L.debt > 0 ? 'owe' : 'ok'}"><span>${L.debt > 0 ? 'Owes' : L.credit > 0 ? 'Paid ahead' : 'All paid'}</span><b>${dMoney(L.debt > 0 ? L.debt : L.credit)} so'm</b><em>${L.debt > 0 ? owe.map((r) => ymLabel(r.m)).join(', ') : single ? lessonsCame(g, st, ym) + ' lessons this month' : dMoney(chargeOf(g, st, ym)) + ' a month'}</em></div>
    <p class="tp-small pm-how">Tap a month = paid in full. Tap a paid month to change it (part payment or not paid). Budget asks you to add the money.</p>
    ${monthGrid(g, st, s.open)}
    ${s.open ? editPanel(g, st, s.open) : ''}
    ${single ? '' : `<div class="pm-fee"><label class="tp-f"><span>${esc(st.name.split(' ')[0])}'s monthly fee (so'm)${own ? '' : ' · the group fee'}</span><input id="f-ownfee" inputmode="numeric" value="${dMoney(own ?? (planOf(g) || {}).fee ?? 0)}" autocomplete="off"></label><button class="tp-pill" data-ownfee="${st.id}|${g.id}">Save fee</button></div>`}
    <label class="tp-f pm-from"><span>Starts paying from</span><select data-payfromsel="${st.id}">${firsts.map((m) => `<option value="${m}" ${m === firstMonth(g, st) ? 'selected' : ''}>${ymName(m)}</option>`).join('')}</select></label>`;
}

/* ---------- the group's page: numbered lists, who has not paid and who paid ---------- */
function sheetOweGrp(s) {
  const g = gById(s.g), ym = payState().ym, mn = MONTHS[+ym.slice(5) - 1]; if (!g) return '';
  const all = g.students.map((st) => ({ st, L: ledger(g, st, ym) })).filter((x) => x.L.st !== 'free');
  const owe = all.filter((x) => x.L.debt > 0).sort((a, b) => b.L.rows.filter((r) => r.charge > r.covered).length - a.L.rows.filter((r) => r.charge > r.covered).length || b.L.debt - a.L.debt);
  const paid = all.filter((x) => !(x.L.debt > 0));
  const oweRow = ({ st, L }, i) => { const ms = L.rows.filter((r) => r.charge - r.covered > 0);
    return `<div class="pl-row"><span class="pl-n">${i + 1}</span><button class="pl-main" data-sheet="payrec" data-g="${g.id}" data-sid="${st.id}"><b>${esc(st.name)}</b><span class="pl-mo">${ms.map((r) => `<u class="${r.covered ? 'pt' : ''}">${ymLabel(r.m)}</u>`).join('')}</span></button><span class="pl-amt">${dMoney(L.debt)}</span><button class="pl-tick" data-paym="${st.id}|${g.id}|${ms[0].m}" aria-label="${esc(st.name)} paid ${ymName(ms[0].m)}">${ic('Check')}</button></div>`; };
  const paidRow = ({ st, L }, i) => `<div class="pl-row ok"><span class="pl-n">${i + 1}</span><button class="pl-main" data-sheet="payrec" data-g="${g.id}" data-sid="${st.id}"><b>${esc(st.name)}</b><span>${L.credit > 0 ? 'Paid ahead' : 'Paid'}${L.last ? ' · ' + dDate(L.last.date) : ''}</span></button><span class="pl-done">${ic('Check')}</span></div>`;
  return `<div class="tp-sh-h"><span></span><b>${esc(g.name)} · ${mn}</b><button class="tp-back strong" data-closesheet>Done</button></div>
    <p class="tp-small pm-how">The tick = paid for the first month shown. Tap a name to see every month.</p>
    <div class="pl-h"><span class="d no"></span>Not paid<em>${owe.length}</em></div>${owe.length ? `<div class="pl-list">${owe.map(oweRow).join('')}</div>` : `<p class="tp-small" style="text-align:left">Everybody has paid for ${mn}.</p>`}
    <div class="pl-h"><span class="d ok"></span>Paid<em>${paid.length}</em></div>${paid.length ? `<div class="pl-list">${paid.map(paidRow).join('')}</div>` : `<p class="tp-small" style="text-align:left">Nobody yet.</p>`}`;
}

/* ---------- "Mark who paid" on Home: every group, numbered ---------- */
function sheetPayPick(s) {
  const gs = feeGroups(), ym = ymOf(TODAY);
  return `<div class="tp-sh-h"><span></span><b>Mark who paid</b><button class="tp-back strong" data-closesheet>Done</button></div>
    ${gs.map((g) => `<div class="pl-h"><span class="d" style="background:${grpColor(g)}"></span>${esc(g.name)}<em>${g.students.length}</em></div><div class="pl-list">${g.students.map((st, i) => { const L = ledger(g, st, ym), ms = L.rows.filter((r) => r.charge - r.covered > 0);
      return `<div class="pl-row${ms.length ? '' : ' ok'}"><span class="pl-n">${i + 1}</span><button class="pl-main" data-sheet="payrec" data-g="${g.id}" data-sid="${st.id}"><b>${esc(st.name)}</b>${ms.length ? `<span class="pl-mo">${ms.map((r) => `<u class="${r.covered ? 'pt' : ''}">${ymLabel(r.m)}</u>`).join('')}</span>` : '<span>Paid</span>'}</button>${ms.length ? `<span class="pl-amt">${dMoney(L.debt)}</span><button class="pl-tick" data-paym="${st.id}|${g.id}|${ms[0].m}" aria-label="${esc(st.name)} paid ${ymName(ms[0].m)}">${ic('Check')}</button>` : `<span class="pl-done">${ic('Check')}</span>`}</div>`; }).join('')}</div>`).join('')}`;
}

/* ---------- taps ---------- */
{
  const _h = home2Click, _f = feesClick;
  const mine = (b, d) => {
    if (d.payundo !== undefined) { if (undoFn) { const f = undoFn; undoFn = null; f(); save(); draw(); toast('Undone'); } return true; }
    if (d.paym) {
      const [sid, gid, m] = d.paym.split('|'), g = gById(gid), st = g && g.students.find((x) => x.id === sid); if (!st) return true;
      const charge = chargeOf(g, st, m), paid = paidIn(sid, m);
      if (paid || !charge) { if (T.sheet && T.sheet.s === 'payrec' && T.sheet.sid === sid) { T.sheet.open = T.sheet.open === m ? null : m; draw(); } else { T.sheet = { s: 'payrec', g: gid, sid, open: m }; draw(); } return true; }
      const p = addPay(sid, m, charge - Math.min(charge, ledger(g, st, m).rows.find((r) => r.m === m).covered)); save(); draw();
      payToast(`${st.name} · ${ymName(m)} · ${dMoney(p.amount)} so'm paid`, () => { S.pay.pays = S.pay.pays.filter((x) => x !== p); tbSend('del', p); });
      return true;
    }
    if (d.pmsave) {
      const [sid, gid, m] = d.pmsave.split('|'), g = gById(gid), st = g && g.students.find((x) => x.id === sid), v = numVal('f-pmamt'); if (!st) return true;
      const old = delPays(sid, m); if (v > 0) addPay(sid, m, v);
      if (T.sheet) T.sheet.open = null; save(); draw();
      toast(v > 0 ? `${st.name} · ${ymName(m)} · ${dMoney(v)} so'm${v < chargeOf(g, st, m) ? ' (part)' : ''}` : `${st.name} · ${ymName(m)} · not paid`);
      return true;
    }
    if (d.pmnone) {
      const [sid, gid, m] = d.pmnone.split('|'), g = gById(gid), st = g && g.students.find((x) => x.id === sid); if (!st) return true;
      const gone = delPays(sid, m); if (T.sheet) T.sheet.open = null; save(); draw();
      payToast(`${st.name} · ${ymName(m)} · not paid`, () => { gone.forEach((p) => { const q = { ...p, id: uid() }; S.pay.pays.push(q); tbSend('add', q); }); });
      return true;
    }
    if (d.ownfee) { // a student who pays less (or more) than the group
      const [sid, gid] = d.ownfee.split('|'), g = gById(gid), v = numVal('f-ownfee'), gf = (planOf(g) || {}).fee || 0;
      if (!v || v === gf) delete S.pay.stuFee[sid]; else S.pay.stuFee[sid] = v;
      save(); draw(); toast(!v || v === gf ? 'Back to the group fee' : `Own fee saved: ${dMoney(v)} so'm a month`); return true;
    }
    if (d.paygo) return true; // the old "Save" of Mark paid is gone
    return false;
  };
  home2Click = function (b, d) { return mine(b, d) || _h(b, d); };
  feesClick = function (b, d) { return mine(b, d) || _f(b, d); };
  // "Starts paying from" is a list, chosen in place
  document.addEventListener('change', (e) => { const el = e.target.closest && e.target.closest('[data-payfromsel]'); if (!el) return; S.pay.from[el.dataset.payfromsel] = el.value; save(); draw(); toast('Starts paying from ' + ymName(el.value)); });
}
