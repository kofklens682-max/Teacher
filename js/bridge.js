'use strict';
/* THE BRIDGE (draft, 29 Oct 2026). One owner for every fact; the other app only reads it.
     Teacher owns: groups, students, fees, discounts          -> publishes localStorage "teacher-roster"   (Budget reads it)
     Budget owns:  payments (amount, date, cash/card, months)  -> publishes localStorage "budget-payments" (Teacher reads it)
   Payments are NEVER typed in the Teacher app any more. "Record a payment" opens Budget with the student already chosen.
   A payment tells exactly which months it pays for (alloc: [{m: '2026-09', amount}]), so the Teacher app no longer guesses.
   Payments saved in the Teacher app before this version ("old") still count; they are shown with an "old" tag.
   Loaded after home2.js: it replaces ledger() and the payment sheet. */

const RS_KEY = 'teacher-roster', BP_KEY = 'budget-payments', OPEN_KEY = 'teacher-open-budget';
const BUDGET_URL = (() => { const m = location.pathname.match(/^(.*\/)Teacher(\d*)\//); return m ? m[1] + 'Budget' + m[2] + '/' : '../Budget/'; })();
const FUTURE = 24; // months ahead you can look at (was 6)

/* ---------- the first month a student owes ----------
   Everybody owes from the month the app started counting fees (September 2026), so September is always there to look at.
   The day a group or student was typed into the app no longer matters (that hid September for groups added in October).
   Only a student added after 1 Nov 2026 starts in the month they joined. You can change it for anyone: "Pays from" on the student. */
const NEW_RULE = Date.parse('2026-11-01');
function firstMonth(g, s) {
  const f = S.pay.from && S.pay.from[s.id]; if (/^\d{4}-\d\d$/.test(f || '')) return f;
  const joined = s.added && s.added >= NEW_RULE ? ymOf(new Date(s.added)) : '';
  return [S.pay.start, joined].sort().pop();
}

/* ---------- reading Budget's payments ---------- */
function bpAll() {
  try {
    const d = JSON.parse(localStorage.getItem(BP_KEY) || 'null');
    return d && Array.isArray(d.pays) ? d.pays.filter((p) => p && p.sid && +p.amount > 0 && /^\d{4}-\d\d-\d\d$/.test(p.date || '')) : [];
  } catch (e) { return []; }
}
// An old Teacher payment that was also added in Budget (through the old "Add income" popup) must not count twice:
// it is matched to a Budget payment of the same student with the same amount, made within 7 days. Each Budget payment absorbs one.
function oldMoved(sid) {
  const bp = bpAll().filter((p) => p.sid === sid), used = new Set(), moved = new Set();
  const days = (a, b) => Math.abs(Date.parse(a) - Date.parse(b)) / 864e5;
  S.pay.pays.filter((p) => p.sid === sid).sort((a, b) => a.date.localeCompare(b.date)).forEach((o) => {
    const m = bp.filter((p) => !used.has(p.id) && +p.amount === +o.amount && days(p.date, o.date) <= 7).sort((a, b) => days(a.date, o.date) - days(b.date, o.date))[0];
    if (m) { used.add(m.id); moved.add(o.id); }
  });
  return moved;
}
const oldLeft = () => S.pay.pays.filter((p) => !oldMoved(p.sid).has(p.id));
function payRows(sid) { // every payment of one student, from both places, oldest first
  const out = [], moved = oldMoved(sid);
  bpAll().forEach((p) => { if (p.sid === sid) out.push({ id: p.id, sid, date: p.date, amount: +p.amount, by: p.by || '', alloc: Array.isArray(p.alloc) && p.alloc.length ? p.alloc.map((a) => ({ m: a.m, amount: +a.amount })) : [{ m: p.date.slice(0, 7), amount: +p.amount }], src: 'budget', batch: p.batch || '', acc: p.acc || '' }); });
  S.pay.pays.forEach((p) => { if (p.sid === sid && !moved.has(p.id)) out.push({ ...p, src: 'old', alloc: null }); });
  return out.sort((a, b) => a.date.localeCompare(b.date) || String(a.id).localeCompare(String(b.id)));
}

/* ---------- the rule: what covers what ---------- */
// A Budget payment says which months it pays for. An old Teacher payment has no months: it goes to the oldest unpaid month first.
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
    let covered = Math.min(have, charge); money += have - covered; // more than the fee for that month = credit
    const use = Math.min(money, charge - covered); money -= use; covered += use;
    rows.push({ m, charge, covered });
  }
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

/* ---------- publishing the roster for Budget ---------- */
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
{ const _save = save; save = function () { _save(); publishRoster(); }; }
{ let tries = 0; const t = setInterval(() => { if (S.groups.length || ++tries > 20) { clearInterval(t); publishRoster(); } }, 500); } // once, when the app has opened
window.addEventListener('storage', (e) => { if (e.key === BP_KEY && typeof draw === 'function') draw(); }); // Budget saved a payment: redraw
document.addEventListener('visibilitychange', () => { if (!document.hidden && typeof draw === 'function') { publishRoster(); draw(); } });

/* ---------- the payment sheet: a clear picture, no typing ---------- */
const owedNow = (L) => L.debt;
function monthLines(g, st, ym) {
  // from the first month to next month, and further only as far as money has been paid ahead
  const cur = ymOf(TODAY); let top = ymAdd(cur, 1); if (ym > top) top = ym;
  bpAll().forEach((p) => { if (p.sid === st.id) (p.alloc || []).forEach((a) => { if (a.m > top) top = a.m; }); });
  const L = ledger(g, st, top), single = isSingle(g);
  return L.rows.filter((r) => single ? r.charge || r.covered : true).map((r) => {
    const left = r.charge - r.covered, future = r.m > cur;
    const cls = r.charge === 0 ? 'free' : left <= 0 ? 'ok' : r.covered > 0 ? 'part' : future ? 'fut' : 'owe';
    const txt = r.charge === 0 ? 'No charge' : left <= 0 ? (future ? 'Paid ahead' : 'Paid') : r.covered > 0 ? `${dMoney(r.covered)} of ${dMoney(r.charge)}` : (future ? 'Not due yet' : 'Not paid');
    return `<div class="bp-m bp-${cls}"><span class="d"></span><b>${SHORT(r.m)} ${r.m.slice(0, 4)}</b><span class="t">${txt}</span><em>${r.charge ? (left > 0 ? (future ? dMoney(r.charge) : dMoney(left) + ' left') : dMoney(r.charge)) : ''}</em></div>`;
  }).join('');
}
function fromChips(st, ym) {
  const g = S.groups.find((x) => x.students.some((t) => t.id === st.id)), cur = firstMonth(g, st), out = [];
  for (let m = S.pay.start; m <= ymAdd(ymOf(TODAY), 3); m = ymAdd(m, 1)) out.push(`<button class="${m === cur ? 'on' : ''}" data-payfrom="${st.id}|${m}">${SHORT(m)}${m.slice(0, 4) !== ymOf(TODAY).slice(0, 4) ? ' ' + m.slice(2, 4) : ''}</button>`);
  return out.join('');
}
function payHistory(L) {
  if (!L.mine.length) return '<p class="tp-small" style="text-align:left">No payments yet.</p>';
  return L.mine.slice().reverse().slice(0, 12).map((p) => {
    const months = p.alloc ? p.alloc.map((a) => SHORT(a.m) + (p.alloc.length > 1 ? ' ' + dMoney(a.amount) : '')).join(' · ') : 'oldest month first';
    return `<div class="bp-h"><span>${dDate(p.date)}</span><span class="m">${months}${p.by ? ' · by ' + esc(String(p.by).toLowerCase()) : ''}${p.batch ? ' · with sibling' : ''}${p.src === 'old' ? ' · <u>old</u>' : ''}</span><b>${dMoney(p.amount)}</b></div>`;
  }).join('');
}
function sheetPayRec(s) {
  const g = gById(s.g), st = g && g.students.find((x) => x.id === s.sid); if (!st) return '<p class="tp-small">This student is not in the group any more.</p>';
  const ym = payState().ym, L = ledger(g, st, ym), c = L.cur, sd = S.pay.sdisc[st.id + '|' + ym] || 0, gd = S.pay.disc[g.id + '|' + ym] || 0;
  const single = isSingle(g), own = S.pay.stuFee[st.id];
  const left = L.debt > 0 ? L.debt : 0;
  return `<div class="tp-sh-h"><span></span><b>${esc(st.name)}</b><button class="tp-back strong" data-closesheet>Done</button></div>
    <div class="dr-sum small"><div class="dr-s3"><div><span>${single ? lessonsCame(g, st, ym) + ' lessons' : 'Fee'} · ${SHORT(ym)}</span><b>${dMoney(c.charge)}</b></div><div><span>Paid</span><b>${dMoney(c.covered)}</b></div><div><span>${left ? 'Owes' : 'Credit'}</span><b>${dMoney(left || L.credit)}</b></div></div>
    ${own && !single ? `<div class="dr-s4">${esc(st.name)} has their own fee: ${dMoney(own)} a month</div>` : ''}${gd || sd ? `<div class="dr-s4">Discount in ${SHORT(ym)}: −${dMoney(gd + sd)}${gd ? ' (group)' : ''}</div>` : ''}</div>
    <button class="tp-cta" data-bpopen="${st.id}|${g.id}" style="width:100%;margin:12px 0 4px">${ic('Wallet')}Record a payment in Budget</button>
    <p class="tp-small" style="margin:0 0 6px">Payments are typed in Budget only, so the money is counted once. ${st.name} is already chosen there.</p>
    <div class="tp-sec"><h4>Month by month</h4></div><div class="bp-ms">${monthLines(g, st, ym)}</div>
    <div class="tp-f" style="margin-top:12px"><span>Pays from (the first month ${esc(st.name.split(' ')[0])} owes)</span><div class="tp-chips2 dr-flt">${fromChips(st, ym)}</div></div>
    <div class="tp-sec"><h4>Payments</h4></div><div class="bp-hs">${payHistory(L)}</div>
    ${L.mine.some((p) => p.src === 'old') ? `<p class="tp-small" style="text-align:left">"Old" = saved in the Teacher app before Budget took over. They still count. To fix one, remove it here and add it in Budget.</p>${L.mine.filter((p) => p.src === 'old').map((p) => `<div class="dr-hist"><span>${dDate(p.date)} · old</span><b>${dMoney(p.amount)}</b><button class="dr-del${s.del === p.id ? ' sure' : ''}" data-paydel="${p.id}" aria-label="Remove this old payment">${s.del === p.id ? 'Tap again to remove' : ic('X')}</button></div>`).join('')}` : ''}
    ${single ? '' : `<div class="tp-sec"><h4>Discount for ${SHORT(ym)}</h4></div><label class="tp-f"><span>This student, this month only (so'm)</span><input id="f-paydisc" inputmode="numeric" value="${sd || ''}" placeholder="0" autocomplete="off"></label><button class="tp-pill" data-discgo="${st.id}|${g.id}" style="margin:4px 0 10px">Save discount</button>`}`;
}
function openBudgetFor(sid, gid) {
  const ym = payState().ym;
  try { localStorage.setItem(OPEN_KEY, JSON.stringify({ sid, gid, ym, at: Date.now() })); } catch (e) { toast('Could not hand over to Budget'); return; }
  publishRoster();
  const w = window.open(BUDGET_URL, '_blank'); if (!w) location.href = BUDGET_URL;
}

/* ---------- "Needs attention" on Home: nothing is left unexplained ---------- */
function attentionCard() {
  let loose = 0; try { loose = +(JSON.parse(localStorage.getItem(BP_KEY) || '{}').loose) || 0; } catch (e) { /* none */ }
  const old = oldLeft().length, bits = [];
  if (loose) bits.push(`<p><b>${loose} payment${loose === 1 ? '' : 's'} in Budget ${loose === 1 ? 'has' : 'have'} no student.</b> They are not counted here. In Budget, tap the payment and choose the student.</p>`);
  if (old) bits.push(`<p><b>${old} old payment${old === 1 ? '' : 's'} saved in this app.</b> They still count. Open the student, and move each one to Budget when you have time.</p>`);
  return bits.length ? `<div class="tp-card2 warn" style="margin-bottom:12px"><div class="h">${ic('CalendarX2')}Needs attention</div>${bits.join('')}</div>` : '';
}
{ const _home = pgHomeNew; pgHomeNew = function () { const h = _home(), at = attentionCard(); return at ? h.replace('<div class="h2-quick">', at + '<div class="h2-quick">') : h; }; }

/* ---------- taps ---------- */
{
  const _h = home2Click, _f = feesClick;
  const mine = (b, d) => {
    if (d.bpopen) { const [sid, gid] = d.bpopen.split('|'); openBudgetFor(sid, gid); return true; }
    if (d.discgo) { const [sid] = d.discgo.split('|'), k = sid + '|' + payState().ym, v = numVal('f-paydisc'); if (v) S.pay.sdisc[k] = v; else delete S.pay.sdisc[k]; save(); toast(v ? 'Discount saved' : 'Discount removed'); draw(); return true; }
    if (d.payfrom) { const [sid, m] = d.payfrom.split('|'); S.pay.from[sid] = m; save(); draw(); return true; }
    if (d.paygo) return true; // typing payments here is gone: they are recorded in Budget
    if (d.paydel) { // only old Teacher payments can be removed here
      if (T.sheet.del !== d.paydel) { T.sheet.del = d.paydel; draw(); return true; }
      S.pay.pays = S.pay.pays.filter((p) => p.id !== d.paydel); T.sheet.del = null; save(); draw(); toast('Old payment removed'); return true;
    }
    return false;
  };
  home2Click = function (b, d) { return mine(b, d) || _h(b, d); };
  feesClick = function (b, d) { return mine(b, d) || _f(b, d); };
}
