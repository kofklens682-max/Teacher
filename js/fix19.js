'use strict';
/* fix19 (the "last changes" round, Fable). Loaded after fix18.js.
   - Home: the Paid widget lists groups from the most students to the fewest, all individual students as ONE row;
           "Owe 2+ months" opens its own page (by group, then individual, then students who left)
   - Students / Payments / group pages: small red squares under a name show WHICH months are owed (Oct, Nov; 4+ = Aug–Nov)
   - Edit student: every student can pay by the month or by the lesson, with their own price (months before keep what they were)
   - Pay by the lesson: the money covers the oldest lesson days first; a covered day says "Paid"
   - Payments: an open group keeps its top line on screen (tap = close) and has a strip on the right (tap = close)
   - Units / Library: changing the level fades the old page into the new one (no sliding, no colour jump)
   - Budget is told the student's name for a one-student class */

const f19Cur = () => ymOf(TODAY);
const f19Mon = (m) => MONTHS[+m.slice(5) - 1].slice(0, 3);

/* ---------- by the month or by the lesson, for one student ---------- */
const f19GK = (g) => ((planOf(g) || {}).kind === 'single' ? 'single' : 'group');
// S.pay.shist[student] = [{ from: 'YYYY-MM', mode: 'group' | 'single', price }] oldest first; the last one is "now" (its price is S.pay.stuFee)
function f19At(s, ym) { const h = (S.pay.shist || {})[s.id]; if (!h || !h.length) return null; let e = h[0], last = true; for (let i = 0; i < h.length; i++) if (h[i].from <= ym) e = h[i]; last = e === h[h.length - 1]; return { mode: e.mode, price: e.price, last }; }
const f19Mode = (g, st, ym) => { const e = f19At(st, ym || f19Cur()); return e ? e.mode : f19GK(g); };
const f19Price = (g, st) => { const p = planOf(g) || {}, m = f19Mode(g, st); return S.pay.stuFee[st.id] ?? (m === f19GK(g) ? (m === 'single' ? p.rate : p.fee) : 0) ?? 0; };
{
  const base = chargeOf;
  chargeOf = function (g, s, ym) { // eslint-disable-line no-global-assign
    const e = f19At(s, ym); if (!e) return base(g, s, ym);
    const P = S.pay, p = planOf(g) || {}, k = s.id + '|' + ym; if (s.until && ym > s.until) return 0;
    const price = e.last ? P.stuFee[s.id] : e.price, dflt = e.mode === f19GK(g) ? (e.mode === 'single' ? p.rate : p.fee) : 0;
    if (e.mode === 'single') {
      const came = lessonsCame(g, s, ym), fr = P.sfree && P.sfree[k], free = fr === 'all' ? came : Math.min(came, +fr || 0);
      return Math.max(0, (came - free) * (price ?? dflt ?? 0) - ((P.sdisc && P.sdisc[k]) || 0));
    }
    const own = P.sfee && P.sfee[k]; if (own != null) return Math.max(0, own);
    const skip = P.dex && (P.dex[g.id + '|' + ym] || []).includes(s.id);
    return Math.max(0, (price ?? dflt ?? 0) - (skip ? 0 : (P.disc || {})[g.id + '|' + ym] || 0) - ((P.sdisc || {})[k] || 0));
  };
}
function f19SetPay(g, st, mode, price) { // returns an undo function when something changed
  const P = S.pay, was = f19Mode(g, st), gk = f19GK(g), p = planOf(g) || {}, base = mode === gk ? ((gk === 'single' ? p.rate : p.fee) || 0) : 0;
  const curPrice = f19Price(g, st), newPrice = price || base;
  if (mode === was && newPrice === curPrice) return null;
  const snap = JSON.stringify([P.shist && P.shist[st.id], P.stuFee[st.id]]), now = f19Cur();
  P.shist = P.shist || {};
  let h = P.shist[st.id] || [{ from: '0000-00', mode: was, price: P.stuFee[st.id] ?? null }];
  h[h.length - 1].price = P.stuFee[st.id] ?? null; // what "now" was, kept for the months before
  h = h.filter((x) => x.from < now); h.push({ from: now, mode, price: null }); P.shist[st.id] = h;
  if (!price || (mode === gk && price === base)) delete P.stuFee[st.id]; else P.stuFee[st.id] = price;
  return () => { const [hh, f] = JSON.parse(snap); if (hh) P.shist[st.id] = hh; else { delete P.shist[st.id]; if (!Object.keys(P.shist).length) delete P.shist; } if (f == null) delete P.stuFee[st.id]; else P.stuFee[st.id] = f; };
}
// every lesson he came to, oldest first, and whether the money paid so far covers it
function f19Days(g, st) {
  const cur = f19Cur(), out = []; let money = S.pay.pays.filter((p) => p.sid === st.id).reduce((a, p) => a + p.amount, 0);
  const all = savedDates(g).slice().sort();
  for (let m = firstMonth(g, st); m <= cur; m = ymAdd(m, 1)) {
    const charge = chargeOf(g, st, m), days = all.filter((k) => k.startsWith(m) && rec(g, fromIso(k)).get(st.id) !== 'absent');
    if (!days.length) { money -= Math.min(money, charge); continue; }
    const per = charge / days.length;
    days.forEach((k) => { const got = Math.min(money, per); money -= got; out.push({ k, m, need: per, rem: per - got, st: per <= 0 ? 'free' : got >= per - 0.5 ? 'paid' : got > 0 ? 'part' : 'no' }); });
  }
  return out;
}

/* ---------- which months are owed: the small squares ---------- */
function f19Owed(g, st, ym) { try { return ledger(g, st, ym || f19Cur()).rows.filter((r) => r.charge - r.covered > 0).map((r) => r.m); } catch (e) { return []; } }
function f19Chips(ms) {
  if (!ms.length) return '';
  return `<span class="f19-ms">${ms.length >= 4 ? `<i>${f19Mon(ms[0])}–${f19Mon(ms[ms.length - 1])}</i>` : ms.map((m) => `<i>${f19Mon(m)}</i>`).join('')}</span>`;
}
function f19AddChips(html, ym) {
  return html.replace(/data-nxpush="sprof" data-g="([^"]+)" data-sid="([^"]+)">(?:(?!<\/button>)[\s\S])*?<\/small>/g, (all, gid, sid) => {
    const g = gById(gid), st = g && stuOf(g, sid); if (!st || !hasFee(g)) return all; return all + f19Chips(f19Owed(g, st, ym)); });
}
{
  const ps = pgStudents; pgStudents = function () { return f19AddChips(ps.apply(this, arguments)); }; // eslint-disable-line no-global-assign
  const sg = PUSH.sgrp; PUSH.sgrp = function () { return f19AddChips(sg.apply(this, arguments)); };
  const pm = payMonth;
  payMonth = function (ym) { // eslint-disable-line no-global-assign
    const h = pm.apply(this, arguments).replace(/<div class="nx-card nx-pg">/g, '<div class="nx-card nx-pg"><button class="f19-strip" aria-label="Close this list"><i></i></button>');
    return f19AddChips(h, ym);
  };
}

/* ---------- Home: the Paid widget in order, and the Owe 2+ card opens its own page ---------- */
function f19PaidRows() {
  const ym = payState().ym, sc = statusCounts(ym), rows = [];
  workGroups().filter(hasFee).forEach((g) => { const c = sc.per[g.id]; if (c && c.n) rows.push({ name: g.name, col: gColor(g), ok: c.paid + c.credit, n: c.n }); });
  rows.sort((a, b) => b.n - a.n || a.name.localeCompare(b.name));
  const solo = { name: 'Individual', col: '#AC8E68', ok: 0, n: 0 };
  soloGroups().filter(hasFee).forEach((g) => { const c = sc.per[g.id]; if (c) { solo.ok += c.paid + c.credit; solo.n += c.n; } });
  if (solo.n) rows.push(solo);
  return rows;
}
function f19Rings(rows) {
  if (!rows.length) return '';
  const N = rows.length, R0 = 23, t = Math.max(2, Math.min(5, (R0 - 5) / N - 0.9)), gap = 0.9; let s = '';
  rows.forEach((x, i) => { const p = x.n ? x.ok / x.n : 0, r = R0 - t / 2 - i * (t + gap), C = 2 * Math.PI * r;
    s += `<circle cx="25" cy="25" r="${r.toFixed(2)}" fill="none" stroke="${x.col}" stroke-opacity=".28" stroke-width="${t}"/>`
      + `<circle class="ffr-p" cx="25" cy="25" r="${r.toFixed(2)}" fill="none" stroke="${x.col}" stroke-width="${t}" stroke-linecap="round" transform="rotate(-90 25 25)" style="--C:${C.toFixed(1)};--d:${i * 90}ms;stroke-dasharray:${Math.max(0.01, C * p).toFixed(1)} ${C.toFixed(1)}"/>`; });
  return `<span class="ffrg" aria-hidden="true"><svg viewBox="0 0 50 50">${s}</svg></span>`;
}
{
  const w = nxWidgets;
  nxWidgets = function () { // eslint-disable-line no-global-assign
    let h = w.apply(this, arguments);
    try {
      const rows = f19PaidRows();
      if (rows.length) {
        h = h.replace(/<span class="ffrg"[\s\S]*?<\/svg><\/span>/, () => f19Rings(rows));
        h = h.replace(/<div class="nx-gl">[\s\S]*?<\/div>/, () => `<div class="nx-gl">${rows.map((x) => `<span><i style="background:${x.col}"></i>${esc(x.name)} <b>${x.ok}/${x.n}</b></span>`).join('')}</div>`);
      }
      h = h.replace('class="nx-card nx-wowe" data-tab="4"', 'class="nx-card nx-wowe" data-nxpush="owe2"');
    } catch (e) { /* the widget stays as it was */ }
    return h;
  };
}
PUSH.owe2 = function () {
  const cur = f19Cur(), secs = [], gone = [], solo = { name: 'Individual', col: '#AC8E68', rows: [] };
  feeGroups().forEach((g) => {
    const rows = [];
    feeStu(g, cur, true).forEach((v) => { const st = stuOf(g, v.id); if (!st) return; const L = ledger(g, st, cur), ms = L.rows.filter((r) => r.charge - r.covered > 0).map((r) => r.m); if (ms.length < 2) return;
      (activeIn(st, cur) ? rows : gone).push({ g, st, ms, debt: L.debt }); });
    if (g.solo) solo.rows.push(...rows); else if (rows.length) secs.push({ name: g.name, col: gColor(g), rows });
  });
  secs.sort((a, b) => b.rows.length - a.rows.length || a.name.localeCompare(b.name));
  if (solo.rows.length) secs.push(solo);
  if (gone.length) secs.push({ name: 'Left, still owe', col: '#8E8E93', rows: gone, left: true });
  const n = secs.reduce((a, s) => a + s.rows.length, 0), total = secs.reduce((a, s) => a + s.rows.reduce((b, x) => b + x.debt, 0), 0);
  const row = (x, left) => `<button class="nx-row" data-nxpay="${x.g.id}|${x.st.id}">${nxAv(x.st)}<span class="nx-tx"><b>${esc(x.st.name)}</b><small class="no">${left ? esc(x.g.solo ? 'Individual' : x.g.name) + ' · ' : ''}Owes ${fmtSum(x.debt)} so'm</small>${f19Chips(x.ms)}</span><em>${x.ms.length} mo</em>${chev()}</button>`;
  return `${backBar('Back', '')}<div class="tp-inner">
    <div class="nx-title">Owe 2+ months</div><p class="nx-sub">${n ? `${n} student${n === 1 ? '' : 's'} · ${fmtSum(total)} so'm in all` : 'Up to ' + ymName(cur)}</p>
    ${secs.map((s) => `<div class="nx-sec f19-sec"><i style="background:${s.col}"></i>${esc(s.name)}<span>${s.rows.length}</span></div><div class="nx-list">${s.rows.sort((a, b) => b.ms.length - a.ms.length || byName(a.st, b.st)).map((x) => row(x, s.left)).join('')}</div>`).join('') || `<div class="tp-empty2">${ic('Check')}<b>Nobody owes for 2 months</b><span>Everyone is up to date, or owes only for this month.</span></div>`}
    ${n ? '<p class="nx-foot">Tap a student to mark a payment.</p>' : ''}</div>`;
};

/* ---------- Edit student: by the month / by the lesson + the price ---------- */
{
  const ed = SHEETS.nxedit;
  SHEETS.nxedit = function (s) {
    let h = ed.apply(this, arguments); const g = gById(s.g), st = g && stuOf(g, s.sid); if (!st) return h;
    h = h.replace('data-f18save=', 'data-f19save=');
    if (!planOf(g)) return h;
    const mode = f19Mode(g, st), price = f19Price(g, st);
    const lab = (m) => (m === 'single' ? 'Price for one lesson (so\'m)' : 'Price for a month (so\'m)'), note = (m) => (m === 'single' ? 'He pays for the lessons he came to. Months before stay as they were.' : 'Counts from this month on. Months before stay as they were.');
    const block = `<div class="tp-f"><span>Pays</span><div class="nx-seg" id="f19-mode" data-noswipe><button class="${mode === 'group' ? 'on' : ''}" data-f19mode="group">By the month</button><button class="${mode === 'single' ? 'on' : ''}" data-f19mode="single">By the lesson</button></div></div>
    <label class="tp-f"><span id="f19-pl">${lab(mode)}</span><input id="f18-price" inputmode="numeric" value="${price ? fmtSum(price) : ''}" placeholder="0" autocomplete="off"></label>
    <p class="tp-small" id="f19-pn" style="margin-top:-4px">${note(mode)}</p>`;
    const re = /<label class="tp-f"><span>Price for[\s\S]*?<\/label>\s*<p class="tp-small"[^>]*>[\s\S]*?<\/p>/;
    return re.test(h) ? h.replace(re, () => block) : h;
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-f19mode],[data-f19save]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    if (b.dataset.f19mode) { const m = b.dataset.f19mode; b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
      const l = document.getElementById('f19-pl'), n = document.getElementById('f19-pn'); if (l) l.textContent = m === 'single' ? 'Price for one lesson (so\'m)' : 'Price for a month (so\'m)';
      if (n) n.textContent = m === 'single' ? 'He pays for the lessons he came to. Months before stay as they were.' : 'Counts from this month on. Months before stay as they were.'; return; }
    const [gid, sid] = b.dataset.f19save.split('|'), g = gById(gid), st = g && stuOf(g, sid); if (!st) return;
    const val = (id) => ((document.getElementById(id) || {}).value || '').trim(), name = val('f18-name').replace(/\s+/g, ' ');
    if (!name) { toast('Type a name'); return; }
    const mEl = document.querySelector('#f19-mode .on'), mode = mEl ? mEl.dataset.f19mode : null, price = f18Money(val('f18-price'));
    if (mode && mode !== f19GK(g) && !price) { toast('Type the price'); return; }
    const gEl = document.querySelector('#nx-g .on'), bd = val('nx-bday');
    f18Rename(st, name);
    const undo = mode ? f19SetPay(g, st, mode, price) : null;
    profSet(sid, { g: gEl ? gEl.dataset.nxg : '', phone: val('nx-phone'), parent: val('nx-parent'), bday: bd ? bd.slice(5) : '', note: val('nx-note') });
    save(); closeSheetNow(); draw();
    if (undo) setTimeout(() => payToast(`${st.name}: ${mode === 'single' ? 'pays by the lesson' : 'pays by the month'} · ${fmtSum(f19Price(g, st))} so'm`, () => { undo(); save(); draw(); }), 350); else toast('Saved');
  }, true);
}

/* ---------- pay by the lesson: which days the money covers ---------- */
{
  const dayLab = (k) => `${+k.slice(8)} ${f19Mon(k.slice(0, 7))}`;
  // the calendar of an individual student: a covered lesson day says "Paid"
  const cal = soloCal;
  soloCal = function (g, ym) { // eslint-disable-line no-global-assign
    let h = cal.apply(this, arguments);
    try { const st = g.students[0]; if (st && hasFee(g) && f19Mode(g, st) === 'single') { const D = new Map(f19Days(g, st).map((x) => [x.k, x.st]));
      h = h.replace(/(class="ic-d [^"]*)(" data-solod="[^|"]+\|(\d{4}-\d\d-\d\d)"[^>]*><b>\d+<\/b>)/g, (all, a, b, k) => (D.get(k) === 'paid' ? `${a} f19-pd${b}<small>Paid</small>` : all)); } } catch (e) { /* plain calendar */ }
    return h;
  };
  // the student's page: a per-lesson student in a group gets the row of lesson days (the group has no calendar of its own)
  const sp = PUSH.sprof;
  PUSH.sprof = function (f) {
    let h = sp.apply(this, arguments);
    try {
      const g = gById(f.g), st = g && stuOf(g, f.sid); if (!st) return h;
      const cur = f19Cur(); let extra = '';
      classesOf(st).all.forEach(({ g: x, st: s }) => {
        if (!hasFee(x) || f19Mode(x, s) !== 'single') return;
        const price = f19Price(x, s);
        if (f19GK(x) !== 'single') h = h.replace(`<span>${fmtSum(price)} a month</span>`, `<span>${fmtSum(price)} a lesson</span>`);
        else h = h.replace(`<span>${fmtSum((planOf(x) || {}).rate || 0)} a lesson</span>`, `<span>${fmtSum(price)} a lesson</span>`);
        if (x.solo) return;
        const days = f19Days(x, s).filter((d) => d.m === cur || d.st !== 'paid').slice(-14), paid = days.filter((d) => d.st === 'paid').length;
        extra += `<div class="nx-card"><div class="nx-ch"><b><i style="background:${gColor(x)}"></i>Lessons · ${esc(x.name)}</b><span>${paid}/${days.length} paid</span></div>
          <div class="f19-days">${days.map((d) => `<span class="${d.st}"><b>${dayLab(d.k)}</b><small>${d.st === 'paid' ? 'Paid' : d.st === 'part' ? 'Part' : d.st === 'free' ? 'Free' : 'Owes'}</small></span>`).join('') || '<p class="nx-note">No lessons marked yet.</p>'}</div></div>`;
      });
      if (extra) h = h.replace('<div class="nx-sec">Details</div>', () => `<div class="nx-sec">Lesson days</div>${extra}<div class="nx-sec">Details</div>`);
    } catch (e) { /* the page stays as it was */ }
    return h;
  };
  // the Pay pop-up: the lesson days this money pays for (oldest first); tap a day = pay up to that day
  const pay = SHEETS.nxpay;
  SHEETS.nxpay = function (s) {
    let h = pay.apply(this, arguments);
    try {
      const g = gById(s.g), st = g && stuOf(g, s.sid); if (!st || f19Mode(g, st) !== 'single') return h;
      h = h.replace(/(<div class="nx-payh2"[\s\S]*?<span>[^<]*? · )[^<]*(<\/span>)/, (all, a, b) => `${a}${fmtSum(f19Price(g, st))} a lesson${b}`);
      const left = f19Days(g, st).filter((d) => d.st === 'part' || d.st === 'no'); if (!left.length) return h;
      const amt = +((h.match(/id="nx-amt"[^>]*value="([^"]*)"/) || [])[1] || '').replace(/\D/g, '') || 0; let cum = 0;
      const chips = left.slice(0, 12).map((d) => { cum += d.rem; const c = Math.round(cum); return `<button class="${c <= amt + 1 ? 'will' : ''}" data-f19day="${c}"><b>${dayLab(d.k)}</b><small>${c <= amt + 1 ? 'Paid by this' : 'Not yet'}</small></button>`; }).join('');
      const block = `<div class="nx-lab">Lesson days this pays for</div><div class="f19-days pay" data-noswipe>${chips}</div>`;
      return h.replace('<div class="nx-seg" data-noswipe><button class="', () => block + '<div class="nx-seg" data-noswipe><button class="');
    } catch (e) { return h; }
  };
  const paint = () => { const i = document.getElementById('nx-amt'); if (!i) return; const amt = +String(i.value).replace(/\D/g, '') || 0;
    document.querySelectorAll('.f19-days.pay [data-f19day]').forEach((b) => { const on = +b.dataset.f19day <= amt + 1; b.classList.toggle('will', on); const sm = b.querySelector('small'); if (sm) sm.textContent = on ? 'Paid by this' : 'Not yet'; }); };
  document.addEventListener('input', (e) => { if (e.target && e.target.id === 'nx-amt') paint(); });
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-f19day]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    const i = document.getElementById('nx-amt'); if (!i) return; i.value = fmtSum(+b.dataset.f19day); if (T.sheet) T.sheet.amt = +b.dataset.f19day; paint(); }, true);
}

/* ---------- Payments: an open group can be closed from anywhere in its list ---------- */
document.addEventListener('click', (e) => {
  const strip = e.target.closest && e.target.closest('.f19-strip'), card = e.target.closest && e.target.closest('.nx-pg'); if (!card) return;
  if (strip) { const more = card.querySelector('.nx-more'); if (more) more.click(); return; }
  if (!e.target.closest('.nx-more, .nx-pg > .nx-ch, .nx-pg > .nx-pbar')) return;
  const fold = card.querySelector('.nx-fold'), page = card.closest('.tp-page'); if (!fold || !page || fold.classList.contains('open')) return;
  const top = card.getBoundingClientRect().top - page.getBoundingClientRect().top; // closed while its top was scrolled away: bring the group back into view
  if (top < 60) page.scrollTo({ top: Math.max(0, page.scrollTop + top - 70), behavior: 'smooth' });
});

/* ---------- Units / Library: the level changes with a fade (user: no sliding over each other, no colour jump) ---------- */
lvGo = function (tab, i) { // eslint-disable-line no-global-assign
  if (R.lvEnd) R.lvEnd(); clearTimeout(R.lvBackT);
  const page = R.pages[tab], pane = page && page.querySelector('[data-lvpane]'), from = lvIndex(tab);
  if (!pane || i === from || i < 0 || i >= lvList(tab).length) return;
  let ghost = null;
  try { // a picture of the page as it is now stays on top and fades away over the new level
    page.querySelectorAll(':scope > .f19-ghost').forEach((x) => x.remove());
    ghost = document.createElement('div'); ghost.className = 'f19-ghost'; ghost.inert = true; ghost.setAttribute('aria-hidden', 'true');
    ghost.style.height = page.scrollHeight + 'px'; ghost.style.background = getComputedStyle(page).backgroundColor;
    [...page.children].forEach((c) => ghost.appendChild(c.cloneNode(true))); ghost.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  } catch (e) { ghost = null; }
  lvSet(tab, i); draw();
  if (!ghost || !ghost.animate) return;
  const stat = getComputedStyle(page).position === 'static'; if (stat) page.style.position = 'relative';
  page.appendChild(ghost);
  const a = ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-in-out', fill: 'forwards' }), bye = () => { ghost.remove(); if (stat) page.style.position = ''; };
  a.onfinish = bye; a.oncancel = bye; setTimeout(bye, 600);
};

/* ---------- Budget: the name to show for a class of one student ---------- */
function f19Label(g) {
  try {
    if (g.solo) { const s = g.students[0] || (g.left || [])[0]; return s ? s.name : g.name; }
    const one = g.students.length === 1 ? g.students[0] : null;
    if (one && (S.same || {})[keyOf(one.name)] === 1 && classesOf(one).all.length > 1) return one.name; // joined with the same person in a real group: this class is his own lessons
  } catch (e) { /* the group name */ }
  return g.name;
}
try { if (typeof publishRoster === 'function') publishRoster(); } catch (e) { /* next save */ }
