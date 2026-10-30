'use strict';
/* 31 Oct 2026: a student's profile (name, own fee, remove), a confirm on the month tiles, and individual students:
   their lessons as a calendar (done / canceled / postponed, and days you add yourself). Loaded after app.js. */

/* ---------- the student's profile ---------- */
function sheetStu(s) {
  const g = gById(s.g), st = g && g.students.find((x) => x.id === s.sid); if (!st) return '<p class="tp-small">This student is not in the group any more.</p>';
  const fee = hasFee(g) && !isSingle(g), own = S.pay.stuFee[st.id], gf = (planOf(g) || {}).fee || 0, pc = stuPct(g, st);
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>Student</b><button class="tp-back strong" data-stusave="${st.id}|${g.id}">Save</button></div>
    <div class="sp-top"><span class="sp-av" style="background:${avColor(st.name)}">${esc(st.name[0].toUpperCase())}</span><b>${esc(st.name)}</b><span>${esc(g.name)}${g.solo ? ' · individual' : ''} · ${pc === null ? 'no lessons yet' : pc + '% here'}</span></div>
    <label class="tp-f"><span>Name</span><input id="f-sname" value="${esc(st.name)}" autocomplete="off"></label>
    ${fee ? `<label class="tp-f"><span>Monthly fee (so'm)${own ? '' : ' · now the group fee'}</span><input id="f-sfee" inputmode="numeric" value="${dMoney(own ?? gf)}" autocomplete="off"></label>` : ''}
    ${hasFee(g) ? `<button class="tp-cta ghost" data-sheet="payrec" data-g="${g.id}" data-sid="${st.id}">${ic('Wallet')}Payments, month by month</button>` : ''}
    <button class="tp-danger" data-sturm="${st.id}|${g.id}">Remove ${esc(st.name.split(' ')[0])} from ${esc(g.name)}</button>
    <p class="tp-small">Removing keeps the past attendance and payments; the student only leaves this group. Undo is possible for 8 seconds.</p>`;
}

/* ---------- individual students: a calendar of lesson days ---------- */
// S.cal[group] = { st: { 'YYYY-MM-DD': 'done' | 'cancel' | 'moved' }, add: { date: true }, off: { date: true } }
const calOf = (g) => { S.cal = S.cal || {}; const c = S.cal[g.id] || (S.cal[g.id] = {}); c.st = c.st || {}; c.add = c.add || {}; c.off = c.off || {}; return c; };
const isLessonDay = (g, d) => { const c = calOf(g), k = iso(d); return !c.off[k] && (!!c.add[k] || hasLesson(g, d) || !!(S.saved[g.id] || {})[k]); };
const calSt = (g, k) => calOf(g).st[k] || ((S.saved[g.id] || {})[k] ? 'done' : '');
const CST = { done: ['Done', '#34C759', 'Check'], cancel: ['Canceled', '#FF3B30', 'X'], moved: ['Postponed', '#FF9500', 'Clock'] };
function soloCal(g, ym) { // the month of lesson days, with arrows, "Add a lesson" and the totals (the calendar screen and the group page)
  const cur = ymOf(TODAY); ym = ym || cur; const [y, m] = ym.split('-').map(Number), first = new Date(y, m - 1, 1), pad = wd(first);
  const days = []; for (let d = 1; d <= 31; d++) { const dt = new Date(y, m - 1, d); if (dt.getMonth() !== m - 1) break; days.push(dt); }
  const cnt = { done: 0, cancel: 0, moved: 0, open: 0 };
  const cells = days.filter((dt) => isLessonDay(g, dt)).map((dt) => { const k = iso(dt), s = calSt(g, k), past = k < iso(TODAY), today = k === iso(TODAY);
    if (s) cnt[s]++; else if (past) cnt.open++;
    const cls = s || (past ? 'miss' : 'soon'), lab = s ? CST[s][0] : today ? 'Today' : past ? 'Not marked' : 'Coming';
    return `<button class="sc-d ${cls}${today ? ' today' : ''}${calOf(g).add[k] ? ' added' : ''}" data-solod="${g.id}|${k}" aria-label="${DAYS_LONG[wd(dt)]} ${dt.getDate()} ${MONTHS[m - 1]}: ${lab}"><small>${DAYS[wd(dt)]}</small><b>${dt.getDate()}</b><em>${s ? ic(CST[s][2]) : ''}${lab}</em></button>`; }).join('');
  return `<div class="sc-cal"><div class="sc-nav"><button class="tp-iconbtn" data-solom="${g.id}|${ymAdd(ym, -1)}" aria-label="Previous month">${ic('ChevronLeft')}</button><b>${ymName(ym)}</b><button class="tp-iconbtn" data-solom="${g.id}|${ymAdd(ym, 1)}" aria-label="Next month">${ic('ChevronRight')}</button></div>
      ${cells ? `<div class="sc-grid sc-only">${cells}</div>` : `<p class="tp-small">No lesson days in ${ymName(ym)}.</p>`}
      <button class="tp-dashed sc-add" data-sheet="soloadd" data-g="${g.id}">${ic('Plus')} Add a lesson on another day</button></div>
    <div class="sc-sum"><span><i style="background:#34C759"></i>${cnt.done} done</span><span><i style="background:#FF3B30"></i>${cnt.cancel} canceled</span><span><i style="background:#FF9500"></i>${cnt.moved} postponed</span>${cnt.open ? `<span><i style="background:#C7C7CC"></i>${cnt.open} not marked</span>` : ''}</div>`;
}
function scSolo(f) {
  const g = gById(f.g); if (!g) return scGone();
  const st = g.students[0];
  const bar = `<div class="tp-pushbar"><button class="tp-back" data-pop>${ic('ChevronLeft')} Back</button><button class="tp-pill" data-sheet="group" data-g="${g.id}">${ic('Pencil')} Edit</button></div>`;
  return `${bar}<div class="tp-inner sc-wrap">
    <div><div class="tp-eyebrow">Individual · ${esc(timesText(g))}</div><div class="tp-lt" style="font-size:28px">${esc(st ? st.name : g.name)}</div></div>
    ${st ? `<button class="sc-prof" data-sheet="stu" data-g="${g.id}" data-sid="${st.id}"><span class="sp-av" style="background:${avColor(st.name)}">${esc(st.name[0].toUpperCase())}</span><span><b>${esc(st.name)}</b><small>${esc(LVNAME(g.lvl))}${planned(g.lvl) ? ` · Week ${g.week} · ${dayWord(g.lvl)} ${g.les}` : ''}</small></span>${ic('ChevronRight')}</button>` : ''}
    ${soloCal(g, f.ym)}
    <p class="tp-small" style="text-align:left">Only the days ${esc(st ? st.name.split(' ')[0] : 'the student')} comes are shown. Tap one to mark it done, canceled or postponed. Marking today's lesson done moves ${esc(st ? st.name.split(' ')[0] : 'the student')} to the next lesson.</p></div>`;
}
function sheetSoloDay(s) {
  const g = gById(s.g), k = s.key, d = fromIso(k), les = isLessonDay(g, d), cur = calSt(g, k), c = calOf(g), open = lessonOpen(g, d);
  const opt = (v, sub) => `<button class="sd-opt ${cur === v ? 'on' : ''}" style="--c:${CST[v][1]}" data-soloset="${g.id}|${k}|${v}" ${open ? '' : 'disabled'}><span class="sd-ic">${ic(CST[v][2])}</span><span><b>${CST[v][0]}</b><small>${sub}</small></span>${cur === v ? ic('Check') : ''}</button>`;
  return `<div class="tp-sh-h"><span></span><b>${DAYS_LONG[wd(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]}</b><button class="tp-back strong" data-closesheet>Done</button></div>
    ${les ? `${open ? '' : `<div class="tp-note2 sd-lock">${ic('Clock')}<span>This lesson hasn't started yet. You can mark it once it starts.</span></div>`}<div class="sd-list">${opt('done', 'The lesson happened: it counts, and the plan moves on')}${opt('cancel', 'No lesson, nothing is owed for it')}${opt('moved', 'Moved to another day: the same topic waits')}</div>
      ${cur ? `<button class="tp-cta ghost" data-soloset="${g.id}|${k}|">${ic('RotateCcw')}Clear the mark</button>` : ''}
      ${c.add[k] ? `<button class="tp-danger" data-soloadd="${g.id}|${k}|0">Remove this added day</button>` : hasLesson(g, d) ? `<button class="tp-danger" data-solooff="${g.id}|${k}">No lesson on this day</button>` : ''}`
      : `<p class="tp-small">${c.off[k] ? 'You took this lesson day away.' : 'This is not one of the lesson days.'}</p><button class="tp-cta" data-soloadd="${g.id}|${k}|1">${ic('Plus')}Add a lesson on this day</button>`}`;
}
function soloSet(g, k, v) {
  const c = calOf(g), was = calSt(g, k), st = g.students[0];
  if (v && !lessonOpen(g, fromIso(k))) return notOpenToast(g, fromIso(k)); // an upcoming lesson can't be marked yet
  if (v === 'done') { const r = rec(g, fromIso(k), true); if (st) { r.att[st.id] = 'here'; r.hw[st.id] = true; } (S.saved[g.id] = S.saved[g.id] || {})[k] = true; autoTaught(g, k); c.st[k] = 'done'; }
  else { if (was === 'done' && (S.saved[g.id] || {})[k]) { [S.rec, S.hw, S.saved].forEach((x) => { if (x[g.id]) delete x[g.id][k]; }); undoTaught(g, k); } if (v) c.st[k] = v; else delete c.st[k]; }
  save(); closeSheetNow(); toast(v ? `${fromIso(k).getDate()} ${MONTHS[fromIso(k).getMonth()]}: ${CST[v][0].toLowerCase()}` : 'Mark cleared');
}

/* ---------- registration: new sheets, the calendar instead of the register for individual students ---------- */
// IELTS Turbo: changing the week in the group form refreshes its list of lessons
document.addEventListener('change', (e) => { const F = T.sheet && T.sheet.form; if (e.target && e.target.id === 'f-week' && F && F.lvl === 'IT') { keepForm(); F.les = 1; draw(); } });
SHEETS.stu = (s) => sheetStu(s);
SHEETS.soloday = (s) => sheetSoloDay(s);
{ const _reg = PUSH.register; PUSH.register = (f) => ((gById(f.g) || {}).solo ? scSolo(f) : _reg(f)); }
// the group page of an individual student: the calendar instead of the attendance table
{ const _hg = histGrid; histGrid = (g, cur) => (g.solo ? `<div class="tp-card2"><div class="h">${ic('CalendarDays')}Lessons · calendar</div>${soloCal(g, (T.push[T.push.length - 1] || {}).ym)}</div>` : _hg(g, cur)); }

/* ---------- taps ---------- */
{
  const _h = home2Click;
  const disarmTiles = (keep) => root && root.querySelectorAll('.pm.pm-arm').forEach((t) => { if (t !== keep) { t.classList.remove('pm-arm'); if (t._h) t.innerHTML = t._h; } });
  home2Click = function (b, d) {
    if (d.paym && b.classList.contains('pm')) { // a month tile on the student's page: first tap asks, the second pays (like the tick)
      const [sid, gid, m] = d.paym.split('|'), g = gById(gid), st = g && g.students.find((x) => x.id === sid);
      if (st && !paidIn(sid, m) && chargeOf(g, st, m)) {
        if (!b.classList.contains('pm-arm')) { disarmTiles(b); b._h = b.innerHTML; b._t = Date.now(); b.classList.add('pm-arm'); b.innerHTML = `<b>${ymLabel(m)}</b><span>Yes, paid?</span><i>${ic('Check')}</i>`; return true; }
        if (Date.now() - b._t < 400) return true; // a double tap is not a yes
        b.classList.remove('pm-arm');
      }
    }
    if (d.stusave) {
      const [sid, gid] = d.stusave.split('|'), g = gById(gid), st = g && g.students.find((x) => x.id === sid); if (!st) return true;
      const nm = val('f-sname').slice(0, 60); if (!nm) { toast('Type the name first'); return true; }
      st.name = nm;
      if (document.getElementById('f-sfee')) { const v = numVal('f-sfee'), gf = (planOf(g) || {}).fee || 0; if (!v || v === gf) delete S.pay.stuFee[sid]; else S.pay.stuFee[sid] = v; }
      save(); closeSheetNow(); toast(`${nm} saved`); return true;
    }
    if (d.sturm) {
      if (!confirmTwice(b, 'Tap again to remove')) return true;
      const [sid, gid] = d.sturm.split('|'), g = gById(gid), i = g ? g.students.findIndex((x) => x.id === sid) : -1; if (i < 0) return true;
      const st = g.students[i]; g.students.splice(i, 1); g.gone = [...(g.gone || []), st]; save(); closeSheetNow();
      payToast(`${st.name} removed from ${g.name}`, () => { g.students.splice(i, 0, st); g.gone = (g.gone || []).filter((x) => x.id !== st.id); });
      return true;
    }
    if (d.solod) { const [gid, k] = d.solod.split('|'); openSheet({ s: 'soloday', g: gid, key: k }); return true; }
    if (d.solom) { const [, ym] = d.solom.split('|'), top = T.push[T.push.length - 1]; if (top) { top.ym = ym; if (R.screen) R.screen._swap = true; draw(); } return true; }
    if (d.soloset !== undefined) { const [gid, k, v] = d.soloset.split('|'), g = gById(gid); if (g) soloSet(g, k, v || ''); return true; }
    if (d.soloadd) { const [gid, k, on] = d.soloadd.split('|'), g = gById(gid), c = g && calOf(g); if (!c) return true; if (on === '1') { c.add[k] = true; delete c.off[k]; } else { delete c.add[k]; delete c.st[k]; } save(); closeSheetNow(); toast(on === '1' ? 'Lesson day added' : 'Day removed'); return true; }
    if (d.solooff) { const [gid, k] = d.solooff.split('|'), g = gById(gid), c = g && calOf(g); if (!c) return true; c.off[k] = true; delete c.st[k]; save(); closeSheetNow(); toast('No lesson on this day'); return true; }
    if (d.fSolo !== undefined) { keepForm(); T.sheet.form.solo = d.fSolo === '1'; draw(); return true; }
    return _h(b, d);
  };
  // a tap anywhere else puts a "Yes, paid?" tile back
  document.addEventListener('click', (e) => { if (!(e.target.closest && e.target.closest('.pm.pm-arm'))) disarmTiles(); }, true);
}

/* ---------- add a lesson on any date ---------- */
function sheetSoloAdd(s) {
  const g = gById(s.g); if (!g) return '';
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>Add a lesson</b><button class="tp-back strong" data-soloaddgo="${g.id}">Add</button></div>
    <label class="tp-f"><span>Which day?</span><input id="f-soladd" type="date" value="${iso(TODAY)}"></label>
    <p class="tp-small" style="text-align:left">An extra lesson for ${esc((g.students[0] || g).name)}, outside the usual days (${g.days.map((d) => DAYS[d]).join(', ') || 'none set'}).</p>`;
}
SHEETS.soloadd = (s) => sheetSoloAdd(s);
{
  const _h2 = home2Click;
  home2Click = function (b, d) {
    if (d.soloaddgo) { const g = gById(d.soloaddgo), k = val('f-soladd'); if (!g || !/^\d{4}-\d\d-\d\d$/.test(k)) { toast('Choose a day first'); return true; }
      const c = calOf(g); c.add[k] = true; delete c.off[k]; const top = T.push[T.push.length - 1]; if (top && top.s === 'register') { top.ym = k.slice(0, 7); if (R.screen) R.screen._swap = true; }
      save(); closeSheetNow(); toast(`Lesson added: ${DAYS_LONG[wd(fromIso(k))]} ${fromIso(k).getDate()} ${MONTHS[fromIso(k).getMonth()]}`); return true; }
    return _h2(b, d);
  };
}

/* ---------- money: 1.000.000 (a dot every three digits) in every money box, also while typing ---------- */
const dotMoney = (v) => { const n = String(v).replace(/\D/g, ''); return n ? (+n).toLocaleString('en-US').replace(/,/g, '.') : ''; };
const MONEY_IN = 'input[inputmode="numeric"]';
const fmtMoneyInputs = () => root && root.querySelectorAll(MONEY_IN).forEach((el) => { if (el !== document.activeElement && el.value) el.value = dotMoney(el.value); });
document.addEventListener('input', (e) => {
  const el = e.target; if (!el.matches || !el.matches(MONEY_IN)) return;
  const pos = el.selectionStart == null ? el.value.length : el.selectionStart, digits = el.value.slice(0, pos).replace(/\D/g, '').length;
  el.value = dotMoney(el.value);
  let i = 0, n = 0; while (i < el.value.length && n < digits) { if (/\d/.test(el.value[i])) n++; i++; } // the cursor stays after the same digit
  try { el.setSelectionRange(i, i); } catch (err) { /* some keyboards do not allow it */ }
}, true);
{ const _draw = draw; draw = function () { const r = _draw.apply(this, arguments); fmtMoneyInputs(); return r; }; }
