'use strict';
/* 3 Nov 2026 (user): four things in one place. Loaded after people.js.
   1. A lesson is "taught" only when it has ended (a register saved while the lesson is still going waits: S.pend).
   2. "Not finished: stay on this lesson": the lesson was held, the plan does not move (S.rep[group][date]).
   3. A student who stops coming leaves FROM a month (s.until); his old months stay on the books (see fees.js: stuAll, feeStu).
   4. Breaks (holidays, trips): S.pauses = [{ id, from, to, label, gids }]; no lessons on those days (hasLesson in app.js). */

/* ---------- 1. settle what changed with the clock ---------- */
function settleTaught() { // saved registers whose lesson has now ended become "taught" (the plan moves once)
  let ch = false;
  S.groups.forEach((g) => Object.keys(S.pend[g.id] || {}).forEach((k) => {
    if (!S.pend[g.id][k]) return;
    if (!(S.saved[g.id] || {})[k] || (S.rep[g.id] || {})[k]) { delete S.pend[g.id][k]; ch = true; return; } // register removed, or "stay on this lesson"
    if (!lessonEnded(g, fromIso(k))) return;
    delete S.pend[g.id][k]; autoTaught(g, k); ch = true;
  }));
  return ch;
}
function settleLeft() { // a student whose last month is over leaves the group's list (kept in g.left for the money)
  let ch = false; const cur = ymOf(TODAY);
  S.groups.forEach((g) => { const gone = g.students.filter((s) => s.until && s.until < cur); if (!gone.length) return;
    g.students = g.students.filter((s) => !gone.includes(s)); g.left = [...(g.left || []), ...gone.map((s) => ({ id: s.id, name: s.name, until: s.until, ...(s.added ? { added: s.added } : {}) }))]; ch = true; });
  return ch;
}
const clockSig = () => S.groups.map((g) => `${g.id}${hasLesson(g, TODAY) ? 1 : 0}${doneOn(g, TODAY) ? 1 : 0}${lessonEnded(g, TODAY) ? 1 : 0}${startMin(g, TODAY) <= nowMin() ? 1 : 0}`).join('|') + '|' + iso(TODAY);
let lastSig = '';
function clockTick(first) {
  publishBreaks(); let ch = settleTaught(); ch = settleLeft() || ch;
  if (ch) save();
  const sig = clockSig(); if ((ch || (lastSig && sig !== lastSig)) && !first) draw(); lastSig = sig;
}
setInterval(() => clockTick(false), 20000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') setTimeout(() => clockTick(false), 400); });
{ let tries = 0; const t = setInterval(() => { if (S.groups.length || ++tries > 20) { clearInterval(t); clockTick(true); draw(); } }, 500); } // once the saved data has loaded

/* ---------- 2. stay on this lesson ---------- */
function repeatBlock(g) {
  if (!g || g.lvl === 'own' || !planned(g.lvl) || !(hasLesson(g, TODAY) || taughtOn(g, TODAY) || repOn(g, TODAY))) return '';
  const on = repOn(g, TODAY);
  return `<button class="tp-cta ghost" data-repeat="${g.id}">${ic('RotateCcw')}${on ? 'Staying on this lesson ✓ · undo' : 'Not finished: stay on this lesson'}</button>
    <p class="tp-small">${on ? `${esc(g.name)} gets this same lesson again at the next class.` : 'For a lesson that was too hard or too long. It counts as held, but the plan does not move on.'}</p>`;
}
function toggleRepeat(g) {
  const k = iso(TODAY), m = (S.rep[g.id] = S.rep[g.id] || {});
  if (m[k]) {
    delete m[k];
    if ((S.saved[g.id] || {})[k]) { if (lessonEnded(g, TODAY)) autoTaught(g, k); else (S.pend[g.id] = S.pend[g.id] || {})[k] = true; }
    save(); draw(); return toast('Undone');
  }
  m[k] = true; if (taughtOn(g, TODAY)) soloUntaught(g, k); // already moved on: take the plan one lesson back
  if (S.pend[g.id]) delete S.pend[g.id][k];
  save(); draw(); toast(`${g.name} stays on this lesson`);
}

/* ---------- 3. a student stops coming ---------- */
function sheetLeave(s) {
  const g = gById(s.g), st = g && g.students.find((x) => x.id === s.sid); if (!st) return '<p class="tp-small">This student is not in the group any more.</p>';
  const cur = ymOf(TODAY), from = s.from || cur, first = st.name.split(' ')[0], opts = [-1, 0, 1, 2, 3].map((n) => ymAdd(cur, n)).filter((m) => m > ymAdd(firstMonth(g, st), -1));
  const L = ledger(g, st, ymAdd(from, -1)), owe = hasFee(g) && L.debt > 0 ? L.debt : 0;
  return `<div class="tp-sh-h"><button class="tp-back" data-sheet="stu" data-g="${g.id}" data-sid="${st.id}">${ic('ChevronLeft')} Back</button><b>${esc(first)} stops coming</b><button class="tp-back strong" data-leavego="${st.id}|${g.id}|${from}">Save</button></div>
    <div class="tp-f"><span>From which month does ${esc(first)} not come any more?</span><div class="tp-chips2 dr-fill">${opts.map((m) => `<button class="${m === from ? 'on' : ''}" data-leavem="${m}">${ymName(m)}</button>`).join('')}</div></div>
    <div class="tp-card2"><div class="h">${ic('Check')}What happens</div>
      <p>${esc(first)} stays in ${esc(g.name)} and in the lists up to and including <b>${ymName(ymAdd(from, -1))}</b>.</p>
      <p>From <b>${ymName(from)}</b> ${esc(first)} is not in the group, the registers, the counts or the fees.</p>
      <p>The months before stay on the books${owe ? `: <b>${dMoney(owe)} so'm is still not paid</b> and stays on "Who still owes" (marked "left") until it is paid` : ''}. Nothing is deleted.</p></div>`;
}
function leaveStudent(g, st, from) {
  const until = ymAdd(from, -1), old = st.until; st.until = until;
  const moved = settleLeft(); save(); closeSheetNow();
  payToast(`${st.name} stops coming from ${ymName(from)}`, () => {
    const i = (g.left || []).findIndex((x) => x.id === st.id), back = i >= 0 ? g.left.splice(i, 1)[0] : st;
    if (i >= 0) g.students.push({ id: back.id, name: back.name, ...(back.added ? { added: back.added } : {}) });
    const s2 = g.students.find((x) => x.id === st.id); if (s2) { if (old) s2.until = old; else delete s2.until; }
  });
  return moved;
}
function cancelLeaving(g, st) { delete st.until; save(); closeSheetNow(); toast(`${st.name} stays`); }
// the student's page: "Stopped coming" next to Remove, and the note when a leaving month is already set
{
  const _s = sheetStu;
  sheetStu = function (s) {
    let h = _s(s); const g = gById(s.g), st = g && g.students.find((x) => x.id === s.sid); if (!st) return h;
    const owe = hasFee(g) ? ledger(g, st, ymOf(TODAY)).debt : 0;
    const add = st.until
      ? `<div class="tp-card2 warn">${ic('CalendarX2')}<p><b>${esc(st.name.split(' ')[0])} stops coming from ${ymName(ymAdd(st.until, 1))}.</b> The older months stay on the books.</p></div><button class="tp-cta ghost" data-leaveno="${st.id}|${g.id}">${ic('RotateCcw')}He stays after all</button>`
      : `<button class="tp-cta ghost" data-sheet="leave" data-g="${g.id}" data-sid="${st.id}">${ic('CalendarX2')}Stopped coming (from a month)</button>`;
    h = h.replace(/<button class="tp-danger" data-sturm=/, add + '<button class="tp-danger" data-sturm=');
    return h.replace(/<p class="tp-small">Removing keeps[^<]*<\/p>/, `<p class="tp-small">Remove = gone from every month, as if ${esc(st.name.split(' ')[0])} was never here${owe ? ` (and the ${dMoney(owe)} so'm owed disappears from the lists)` : ''}. If the student only stopped coming, use <b>Stopped coming</b>: the months before stay as they were. Undo is possible for 8 seconds.</p>`);
  };
}
SHEETS.leave = (s) => sheetLeave(s);

/* ---------- 4. breaks ---------- */
const brkText = (p) => `${dDate(p.from)}${p.to !== p.from ? ' – ' + dDate(p.to) : ''}`;
const brkWho = (p) => (p.gids.length ? p.gids.map((id) => (gById(id) || {}).name).filter(Boolean).join(', ') || 'removed groups' : 'All groups');
// the discount a break could give: per monthly-fee group and month, from the lessons that fall inside the break
function brkRows(s) {
  const out = [], ids = s.gids.length ? s.gids : S.groups.map((g) => g.id);
  ids.map(gById).filter((g) => g && hasFee(g) && !isSingle(g) && !g.solo).forEach((g) => {
    for (let m = s.from.slice(0, 7); m <= s.to.slice(0, 7); m = ymAdd(m, 1)) {
      const [y, mo] = m.split('-').map(Number); let missed = 0, total = 0;
      for (let d = 1; d <= 31; d++) { const dt = new Date(y, mo - 1, d); if (dt.getMonth() !== mo - 1) break; if (!onWeekday(g, dt)) continue; total++; if (iso(dt) >= s.from && iso(dt) <= s.to) missed++; }
      if (missed && total) out.push({ g, ym: m, missed, total, sug: Math.round(((planOf(g).fee || 0) * missed) / total / 1000) * 1000 });
    }
  });
  return out;
}
const privIn = (s) => (s.gids.length ? s.gids.map(gById) : S.groups).filter((g) => g && (isSingle(g) || g.solo) && hasFee(g));
function publishBreaks() { try { const j = JSON.stringify(S.pauses.map((p) => ({ from: p.from, to: p.to, label: p.label, gids: p.gids }))); if (j !== localStorage.getItem('teacher-breaks')) localStorage.setItem('teacher-breaks', j); } catch (e) { /* Budget just keeps the last list */ } }
function keepBrk() {
  const s = T.sheet; if (!s) return;
  s.dv = s.dv || {}; document.querySelectorAll('[data-brkd]').forEach((el) => { s.dv[el.dataset.brkd] = numVal(el.id); });
  const a = document.getElementById('f-brkl'), f = document.getElementById('f-brkf'), t = document.getElementById('f-brkt');
  if (a) s.label = a.value; if (f && f.value) s.from = f.value; if (t && t.value) s.to = t.value;
}
function sheetBreaks(s) {
  s.from = s.from || iso(TODAY); s.to = s.to || s.from; s.gids = s.gids || [];
  const list = [...S.pauses].sort((a, b) => a.from.localeCompare(b.from)), now = iso(TODAY);
  return `<div class="tp-sh-h"><button class="tp-back" data-sheet="settings">${ic('ChevronLeft')} Back</button><b>Breaks and holidays</b><span></span></div>
    <p class="tp-small" style="text-align:left">On the days of a break there are no lessons: Home and Attendance show nothing, and the plan waits, so every group continues with the lesson it stopped at. Fees do not change by themselves; for a missed week use the group discount.</p>
    ${list.length ? `<div class="tp-sec"><h4>Your breaks</h4></div>${list.map((p) => `<div class="tp-lrow">${ic('CalendarX2')}<span class="tx"><b>${esc(p.label || 'Break')} · ${brkText(p)}</b><span>${esc(brkWho(p))}${p.disc.length ? ' · discount given' : ''}${p.to < now ? ' · over' : p.from <= now ? ' · now' : ''}</span></span><button class="tp-pill" data-brkdel="${p.id}">Remove</button></div>`).join('')}` : ''}
    <div class="tp-sec"><h4>New break</h4></div>
    <label class="tp-f"><span>Name (optional)</span><input id="f-brkl" value="${esc(s.label || '')}" placeholder="e.g. Holiday, Trip, Exams" autocomplete="off"></label>
    <div class="tp-f"><span>No lessons from</span><input id="f-brkf" class="h2-date" type="date" value="${s.from}"></div>
    <div class="tp-f"><span>until (the last day, included)</span><input id="f-brkt" class="h2-date" type="date" value="${s.to}" min="${s.from}"></div>
    <div class="tp-f"><span>Which groups?</span><div class="tp-chips2"><button class="${s.gids.length ? '' : 'on'}" data-brkg="all">All groups</button>${S.groups.map((g) => `<button class="${s.gids.includes(g.id) ? 'on' : ''}" data-brkg="${g.id}">${esc(g.name)}</button>`).join('')}</div></div>
    ${brkFeeHtml(s)}
    <button class="tp-cta" data-brkadd>${ic('Plus')}Add the break</button>`;
}
function brkFeeHtml(s) {
  const rows = brkRows(s), pr = privIn(s); s.fee = s.fee || 'keep'; s.dv = s.dv || {};
  if (!rows.length && !pr.length) return '';
  return `<div class="tp-f"><span>Fees for the missed lessons</span><div class="tp-chips2"><button class="${s.fee === 'keep' ? 'on' : ''}" data-brkfee="keep">No discount (the holiday is included)</button><button class="${s.fee === 'disc' ? 'on' : ''}" data-brkfee="disc">Give a discount</button></div></div>
    ${s.fee === 'disc' && rows.length ? `<div class="tp-card2"><div class="h">${ic('Percent')}Discount for each student</div>${rows.map((r) => { const key = r.g.id + '|' + r.ym, v = s.dv[key] !== undefined ? s.dv[key] : r.sug;
      return `<label class="tp-f"><span>${esc(r.g.name)} · ${ymName(r.ym)} · ${r.missed} of ${r.total} lessons missed</span><input id="f-brkd-${r.g.id}-${r.ym}" data-brkd="${key}" inputmode="numeric" value="${v ? dMoney(v) : ''}" placeholder="0" autocomplete="off"></label>`; }).join('')}
      <p class="tp-small" style="text-align:left">Taken off each student's fee for that month only (the usual group discount). Change the amount if you like.</p></div>` : ''}
    ${pr.length ? `<p class="tp-small" style="text-align:left">${pr.map((g) => esc(g.name)).join(', ')}: private students pay only for the lessons that happen, so nothing to change.</p>` : ''}`;
}
SHEETS.breaks = (s) => sheetBreaks(s);
{
  const _p = pgHomeNew;
  pgHomeNew = function () {
    let h = _p.apply(this, arguments); const now = iso(TODAY), cur = S.pauses.filter((p) => p.from <= now && p.to >= now);
    h = h.replace(/(<div class="h2-quick">[\s\S]*?)(<\/div>)/, `$1<button data-sheet="breaks">${ic('CalendarX2')}Holiday</button>$2`); // one tap from Home (also in Settings)
    if (!cur.length) return h;
    const note = cur.map((p) => `<div class="tp-card2 warn h-in">${ic('CalendarX2')}<p><b>${esc(p.label || 'Break')}</b> · no lessons until ${dDate(p.to)}${p.gids.length ? ' (' + esc(brkWho(p)) + ')' : ''}</p></div>`).join('');
    return h.replace(/(<div class="h2-quick">[\s\S]*?<\/div>)/, '$1' + note);
  };
}
{
  const _s = sheetSettings;
  sheetSettings = function (s) {
    const n = S.pauses.filter((p) => p.to >= iso(TODAY)).length;
    return _s(s).replace('<button class="tp-lrow" data-sheet="copies">', `<button class="tp-lrow" data-sheet="breaks">${ic('CalendarX2')}<span class="tx"><b>Breaks and holidays</b><span>${n ? n + ' coming or now' : 'Stop lessons for some days'}</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button><button class="tp-lrow" data-sheet="copies">`);
  };
}

/* ---------- taps ---------- */
{
  const _h = home2Click;
  home2Click = function (b, d) {
    if (d.repeat) { const g = gById(d.repeat); if (g) toggleRepeat(g); return true; }
    if (d.leavem) { T.sheet.from = d.leavem; draw(); return true; }
    if (d.leavego) { const [sid, gid, from] = d.leavego.split('|'), g = gById(gid), st = g && g.students.find((x) => x.id === sid); if (st) leaveStudent(g, st, from); return true; }
    if (d.leaveno) { const [sid, gid] = d.leaveno.split('|'), g = gById(gid), st = g && g.students.find((x) => x.id === sid); if (st) cancelLeaving(g, st); return true; }
    if (d.brkfee) { keepBrk(); T.sheet.fee = d.brkfee; draw(); return true; }
    if (d.brkg) { keepBrk(); const s = T.sheet; if (d.brkg === 'all') s.gids = []; else s.gids = s.gids.includes(d.brkg) ? s.gids.filter((x) => x !== d.brkg) : [...s.gids, d.brkg]; draw(); return true; }
    if (d.brkadd !== undefined) {
      keepBrk(); const s = T.sheet; if (!s.from || !s.to) { toast('Choose the days first'); return true; } if (s.to < s.from) { toast('The last day is before the first day'); return true; }
      const disc = []; if (s.fee === 'disc') brkRows(s).forEach((r) => { const v = s.dv && s.dv[r.g.id + '|' + r.ym] !== undefined ? s.dv[r.g.id + '|' + r.ym] : r.sug; if (v > 0) { const k = r.g.id + '|' + r.ym; S.pay.disc[k] = (S.pay.disc[k] || 0) + v; disc.push({ gid: r.g.id, ym: r.ym, amount: v }); } });
      S.pauses.push({ id: uid(), from: s.from, to: s.to, label: (s.label || '').trim().slice(0, 40), gids: [...s.gids], disc });
      T.sheet = { s: 'breaks' }; save(); publishBreaks(); draw(); toast(disc.length ? 'Break added, discount given' : 'Break added'); return true;
    }
    if (d.brkdel) { if (!confirmTwice(b, 'Tap again')) return true; const gone = S.pauses.find((p) => p.id === d.brkdel); (gone ? gone.disc : []).forEach((x) => { const k = x.gid + '|' + x.ym, v = (S.pay.disc[k] || 0) - x.amount; if (v > 0) S.pay.disc[k] = v; else delete S.pay.disc[k]; }); S.pauses = S.pauses.filter((p) => p.id !== d.brkdel); save(); publishBreaks(); draw(); toast(gone && gone.disc.length ? 'Break and its discount removed' : 'Break removed'); return true; }
    return _h(b, d);
  };
  const _c = home2Change;
  home2Change = function (t) {
    if ((t.id === 'f-brkf' || t.id === 'f-brkt') && T.sheet && T.sheet.s === 'breaks') { keepBrk(); if (T.sheet.to < T.sheet.from) T.sheet.to = T.sheet.from; draw(); return true; }
    return _c(t);
  };
}

/* ---------- Home: tomorrow's lessons (3 Nov 2026, the user asked for it) ---------- */
SECS.tomorrow = function () {
  const D = addDays(TODAY, 1), list = S.groups.filter((g) => hasLesson(g, D)).sort((a, b) => startMin(a, D) - startMin(b, D));
  const stu = (n) => `${n} student${n === 1 ? '' : 's'}`, brk = S.pauses.find((p) => iso(D) >= p.from && iso(D) <= p.to && !p.gids.length);
  const rows = list.map((g) => `<button class="tp-lrow at-other" style="--c:${hc(g)}" ${homeOpen(g)}><span class="at-dot"></span><span class="tx"><b>${esc(g.name)}</b><span>${esc(timeOn(g, D))}–${hm(endMin(g, D))} · ${stu(g.students.length)}</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button>`).join('');
  return card('Tomorrow', `${DAYS_LONG[wd(D)]} ${D.getDate()} ${MONTHS[D.getMonth()]}`, list.length ? `<div class="at-list h-in">${rows}</div>` : `<div class="tp-empty2 h-in">${ic('CalendarDays')}<b>${brk ? esc(brk.label || 'Break') : 'No lessons tomorrow'}</b><span>${brk ? 'No lessons tomorrow.' : 'A free day.'}</span></div>`);
};

/* ---------- discounts for private (per-lesson) students (3 Nov 2026) ----------
   Own price per lesson (all months), and for one month: the first N lessons free, the whole month free, or an amount off. */
{
  const _s = sheetStu;
  sheetStu = function (s) {
    const h = _s(s), g = gById(s.g), st = g && g.students.find((x) => x.id === s.sid); if (!st || !isSingle(g) || !hasFee(g)) return h;
    const own = S.pay.stuFee[st.id], gr = (planOf(g) || {}).rate || 0;
    return h.replace('<button class="tp-cta ghost" data-sheet="payrec"', `<label class="tp-f"><span>Price for one lesson (so'm)${own ? '' : ' · now the usual price'}</span><input id="f-srate" inputmode="numeric" value="${dMoney(own ?? gr)}" autocomplete="off"></label>
      <button class="tp-cta ghost" data-sheet="payrec"`);
  };
  const _e = editPanel;
  editPanel = function (g, st, m) {
    const h = _e(g, st, m); if (!isSingle(g)) return h;
    const k = st.id + '|' + m, fr = (S.pay.sfree || {})[k], sd = S.pay.sdisc[k] || 0, rate = S.pay.stuFee[st.id] ?? (planOf(g) || {}).rate ?? 0, came = lessonsCame(g, st, m);
    const box = `<div class="pm-fee2"><p class="tp-small" style="text-align:left">${came} lesson${came === 1 ? '' : 's'} in ${ymName(m)} × ${dMoney(rate)} so'm${fr ? (fr === 'all' ? ' · the whole month is free' : ` · ${fr} free`) : ''}${sd ? ` · −${dMoney(sd)} discount` : ''}</p>
      <label class="tp-f"><span>Free lessons in ${ymName(m)} (the first ones)</span><input id="f-pmfree" inputmode="numeric" value="${fr && fr !== 'all' ? fr : ''}" placeholder="0" autocomplete="off"></label>
      <label class="tp-f"><span>Discount in ${ymName(m)} (so'm)</span><input id="f-pmsd" inputmode="numeric" value="${sd ? dMoney(sd) : ''}" placeholder="0" autocomplete="off"></label>
      <div class="pm-fee2b"><button class="tp-pill" data-pmfreeall="${st.id}|${g.id}|${m}">${ic('Percent')} Whole month free</button><button class="tp-pill strong" data-pmsdsave="${st.id}|${g.id}|${m}">Save</button></div></div>`;
    return h.replace('<div class="pm-btns">', box + '<div class="pm-btns">');
  };
  const _p = sheetPayRec;
  sheetPayRec = function (s) {
    const h = _p(s), g = gById(s.g), st = g && stuOf(g, s.sid); if (!st || !isSingle(g) || h.includes('pm-chg')) return h;
    const rows = ledger(g, st, ymOf(TODAY)).rows.slice(-4);
    return h.replace('<label class="tp-f pm-from">', `<div class="pm-chg"><span>Free lessons or a discount for</span>${rows.map((r) => `<button class="${s.open === r.m ? 'on' : ''}" data-pmedit="${st.id}|${g.id}|${r.m}">${ymLabel(r.m)}</button>`).join('')}</div><label class="tp-f pm-from">`);
  };
  const _h = home2Click;
  home2Click = function (b, d) {
    if (d.pmsdsave || d.pmfreeall) {
      const [sid, gid, m] = (d.pmsdsave || d.pmfreeall).split('|'), g = gById(gid), st = g && stuOf(g, sid); if (!st) return true;
      const k = sid + '|' + m; S.pay.sfree = S.pay.sfree || {};
      if (d.pmfreeall) { S.pay.sfree[k] = 'all'; delete S.pay.sdisc[k]; }
      else { const n = Math.max(0, Math.floor(numVal('f-pmfree'))), v = numVal('f-pmsd'); if (n) S.pay.sfree[k] = n; else delete S.pay.sfree[k]; if (v) S.pay.sdisc[k] = v; else delete S.pay.sdisc[k]; }
      save(); draw(); toast(d.pmfreeall ? `${st.name.split(' ')[0]}: ${ymName(m)} is free` : 'Saved'); return true;
    }
    return _h(b, d);
  };
}
