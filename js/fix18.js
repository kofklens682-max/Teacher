'use strict';
/* 17 Nov (Fable): fixes after the user's first phone test of Teacher 9.0. Loaded after fix17.js.
   - Edit a student: NAME and PRICE are here now (before: only in the group form), and "Same person as..." joins two entries by hand
   - Home class card: swipe down shows the last 3 lessons that already passed
   - Students tab: every individual student is a row of its own
   - Payments: a tap on a group's top line opens / closes its list */

/* ---------- Edit a student: name, price, same person ---------- */
const f18Money = (v) => +String(v || '').replace(/[^\d]/g, '') || 0;
function f18Price(g, st) { const p = planOf(g) || {}, single = isSingle(g); return { single, base: single ? (p.rate || 0) : (p.fee || 0), cur: S.pay.stuFee[st.id] ?? (single ? p.rate : p.fee) ?? 0 }; }
SHEETS.nxedit = function (s) {
  const g = gById(s.g), st = g && stuOf(g, s.sid); if (!st) return '';
  const P = prof(st.id), gg = P.g || guessG(st.name), bd = P.bday ? `2000-${P.bday}` : '', pr = f18Price(g, st), C = classesOf(st);
  const joined = C.all.filter((x) => x.st.id !== st.id);
  const where = (x) => (x.g.solo ? 'Individual lessons' : x.g.name);
  return `<div class="tp-sh-h"><button class="tp-back" data-closesheet>Cancel</button><b>Edit student</b><button class="tp-back strong" data-f18save="${g.id}|${st.id}">Save</button></div>
    <label class="tp-f"><span>Name</span><input id="f18-name" value="${esc(st.name)}" autocomplete="off" autocapitalize="words"></label>
    <div class="tp-f"><span>Boy or girl</span><div class="nx-seg" id="nx-g"><button class="${gg === 'm' ? 'on' : ''}" data-nxg="m">Boy</button><button class="${gg === 'f' ? 'on' : ''}" data-nxg="f">Girl</button></div></div>
    ${planOf(g) ? `<label class="tp-f"><span>${pr.single ? 'Price for one lesson' : 'Price for a month'} (so'm)</span><input id="f18-price" inputmode="numeric" value="${pr.cur ? fmtSum(pr.cur) : ''}" placeholder="${pr.base ? fmtSum(pr.base) : '0'}" autocomplete="off"></label>
    <p class="tp-small" style="margin-top:-4px">${pr.single ? 'Counts for the lessons from now on.' : 'Counts from this month on. Months before stay as they were.'}</p>` : ''}
    <label class="tp-f"><span>Phone</span><input id="nx-phone" inputmode="tel" value="${esc(P.phone || '')}" placeholder="+998 90 123 45 67" autocomplete="off"></label>
    <label class="tp-f"><span>Parent’s phone</span><input id="nx-parent" inputmode="tel" value="${esc(P.parent || '')}" placeholder="+998 …" autocomplete="off"></label>
    <label class="tp-f"><span>Birthday</span><input id="nx-bday" type="date" value="${bd}"></label>
    <label class="tp-f"><span>Notes</span><input id="nx-note" value="${esc(P.note || '')}" placeholder="Anything to remember" autocomplete="off"></label>
    <div class="nx-sec" style="margin-top:14px">One person, two classes</div>
    <div class="nx-list">${joined.length
      ? `<div class="nx-row still"><span class="nx-tile" style="--c:#34C759">${ic('Check')}</span><span class="nx-tx"><b>Joined with ${esc(joined.map(where).join(', '))}</b><small>Counted as one person</small></span></div><button class="nx-row" data-f18split="${g.id}|${st.id}"><span class="nx-tx"><b style="color:#FF3B30">Separate them</b></span></button>`
      : `<button class="nx-row" data-f18merge="${g.id}|${st.id}"><span class="nx-tile" style="--c:#007AFF">${ic('Users')}</span><span class="nx-tx"><b>Same person as…</b><small>Join with the same student in another class</small></span>${chev()}</button>`}</div>`;
};
SHEETS.f18merge = function (s) {
  const g = gById(s.g), st = g && stuOf(g, s.sid); if (!st) return '';
  const where = (x) => (x.solo ? 'Individual lessons' : x.name);
  if (s.to) { const [g2id, s2id] = s.to.split('|'), g2 = gById(g2id), o = g2 && stuOf(g2, s2id); if (!o) return '';
    return `<div class="tp-sh-h"><button class="tp-back" data-f18merge="${g.id}|${st.id}">Back</button><b>One person?</b><span></span></div>
      <p class="f17-txt"><b>${esc(st.name)}</b> (${esc(where(g))}) and <b>${esc(o.name)}</b> (${esc(where(g2))}) become one person.${keyOf(st.name) !== keyOf(o.name) ? ` This entry will be named “${esc(o.name)}”.` : ''} Payments and lessons of both classes are kept.</p>
      <button class="f17-go blue" data-f18join="${g.id}|${st.id}|${g2.id}|${o.id}">Yes, one person</button><button class="f17-go soft" data-closesheet>Cancel</button>`; }
  const rows = []; S.groups.forEach((x) => { if (x.id === g.id) return; x.students.forEach((o) => rows.push({ g: x, st: o })); });
  rows.sort((a, b) => byName(a.st, b.st));
  return `<div class="tp-sh-h"><button class="tp-back" data-sheet="nxedit" data-g="${g.id}" data-sid="${st.id}">Back</button><b>Same person as…</b><span></span></div>
    <p class="tp-small" style="margin:0 4px 10px">Choose the other entry of ${esc(st.name)}.</p>
    <div class="nx-list">${rows.map((x) => `<button class="nx-row" data-f18pick="${g.id}|${st.id}|${x.g.id}|${x.st.id}">${nxAv(x.st)}<span class="nx-tx"><b>${esc(x.st.name)}</b><small>${esc(where(x.g))}</small></span>${chev()}</button>`).join('') || '<p class="nx-empty">No students in other classes</p>'}</div>`;
};
function f18Rename(st, name) { // the "one person" answer is kept by name: move it with the name
  const k0 = keyOf(st.name), k1 = keyOf(name); if (st.name === name) return; const was = (S.same || {})[k0];
  st.name = name;
  if (k0 !== k1 && S.same) { const still = S.groups.some((x) => stuAll(x).some((o) => keyOf(o.name) === k0)); if (!still) delete S.same[k0]; if (was === 1 && S.groups.reduce((a, x) => a + stuAll(x).filter((o) => keyOf(o.name) === k1).length, 0) > 1) S.same[k1] = 1; }
}
function f18SetPrice(g, st, v) {
  const pr = f18Price(g, st); if (v === pr.cur) return;
  if (!pr.single && S.pay.start) { // months before this one keep the price they had
    const now = ymOf(TODAY); S.pay.sfee = S.pay.sfee || {};
    for (let m = S.pay.start; m < now; m = ymAdd(m, 1)) { const k = st.id + '|' + m; if (S.pay.sfee[k] == null) { const c = chargeOf(g, st, m); if (c > 0) S.pay.sfee[k] = c; } }
  }
  if (!v || v === pr.base) delete S.pay.stuFee[st.id]; else S.pay.stuFee[st.id] = v;
}
document.addEventListener('input', (e) => { const t = e.target; if (t && t.id === 'f18-price') { const n = f18Money(t.value); t.value = n ? fmtSum(n) : ''; } });
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-f18save],[data-f18merge],[data-f18pick],[data-f18join],[data-f18split]'); if (!b) return;
  e.preventDefault(); e.stopPropagation(); const d = b.dataset;
  if (d.f18save) { const [gid, sid] = d.f18save.split('|'), g = gById(gid), st = g && stuOf(g, sid); if (!st) return;
    const val = (id) => ((document.getElementById(id) || {}).value || '').trim(), name = val('f18-name').replace(/\s+/g, ' ');
    if (!name) { toast('Type a name'); return; }
    const gEl = document.querySelector('#nx-g .on'), bd = val('nx-bday');
    f18Rename(st, name);
    if (document.getElementById('f18-price')) f18SetPrice(g, st, f18Money(val('f18-price')));
    profSet(sid, { g: gEl ? gEl.dataset.nxg : '', phone: val('nx-phone'), parent: val('nx-parent'), bday: bd ? bd.slice(5) : '', note: val('nx-note') });
    save(); closeSheetNow(); draw(); toast('Saved'); return; }
  if (d.f18merge) { const [g, sid] = d.f18merge.split('|'); openSheet({ s: 'f18merge', g, sid }); return; }
  if (d.f18pick) { const [g, sid, g2, s2] = d.f18pick.split('|'); openSheet({ s: 'f18merge', g, sid, to: g2 + '|' + s2 }); return; }
  if (d.f18join) { const [gid, sid, g2id, s2id] = d.f18join.split('|'), g = gById(gid), st = g && stuOf(g, sid), g2 = gById(g2id), o = g2 && stuOf(g2, s2id); if (!st || !o) return;
    const oldName = st.name, k = keyOf(o.name), oldSame = (S.same || {})[k];
    f18Rename(st, o.name); S.same = S.same || {}; S.same[k] = 1; save(); closeSheetNow(); draw();
    setTimeout(() => payToast(`${o.name}: one person, two classes`, () => { st.name = oldName; if (oldSame === undefined) delete S.same[k]; else S.same[k] = oldSame; save(); draw(); }), 350); return; }
  if (d.f18split) { const [gid, sid] = d.f18split.split('|'), g = gById(gid), st = g && stuOf(g, sid); if (!st) return;
    S.same = S.same || {}; S.same[keyOf(st.name)] = 0; save(); closeSheetNow(); draw(); toast('Kept as two people'); }
}, true);

/* ---------- Home class card: the last 3 lessons that passed are above the first card (swipe down) ---------- */
(function () {
  const base = heroList;
  heroList = function () { // eslint-disable-line no-global-assign
    const L = base.apply(this, arguments), todayShown = L.some((x) => x.i === 0), past = [];
    const gs = S.groups.filter((g) => g.students.length);
    for (let i = todayShown ? 1 : 0; i < 22 && past.length < 3; i++) {
      const d = addDays(TODAY, -i);
      gs.filter((g) => hasLesson(g, d)).sort((a, b) => startMin(b, d) - startMin(a, d)).forEach((g) => { if (past.length < 3) past.push({ g, d, i: -i, past: true }); });
    }
    return past.reverse().concat(L);
  };
  const card = heroCard;
  heroCard = function (x, k, cur) { // eslint-disable-line no-global-assign
    if (!x.past) return card.apply(this, arguments);
    const { g, d } = x, s = startMin(g, d), e = endMin(g, d), t = taughtOn(g, d), W = t && planned(g.lvl) && weekOf(g.lvl, t.w), les = W && (W.lessons[t.l - 1] || W.lessons[0]);
    const when = iso(d) === iso(TODAY) ? 'Earlier today' : iso(d) === iso(addDays(TODAY, -1)) ? 'Yesterday' : `${DAYS_LONG[wd(d)]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
    const open = t && planned(g.lvl) ? `data-push="lesson" data-lvl="${g.lvl}" data-w="${t.w}" data-l="${t.l}" data-g="${g.id}"` : openLessonAttr(g);
    return `<button class="nx-hcard past${k === cur ? ' cur' : ''}" data-hk="${k}" style="--c:${gColor(g)};--off:${k - cur}" ${open}>
      <span class="k">${when} · ${hhmm(s)}–${hhmm(e)}</span><b class="t">${esc(g.solo ? g.students[0].name + ' · Individual' : g.name)}</b>
      <span class="s">${t ? `Week ${t.w} · ${dayWord(g.lvl)} ${t.l}${les && les.subtopic ? ' · ' + esc(String(les.subtopic).replace(/^(Day|Lesson) \d+ · /, '')) : ''}` : esc(LVNAME(g.lvl))}</span>
      <span class="f"><span class="cd">${ic('Check')} ${doneOn(g, d) || t ? 'Taught' : 'Passed'}</span><span class="go">${ic('BookOpen')} Open</span></span></button>`;
  };
  const hero = nxHero;
  nxHero = function () { // the card you see first is still the next class, not a passed one  // eslint-disable-line no-global-assign
    const L = heroList();
    if (L.length && (NX.hero == null || NX.hero >= L.length)) {
      let k = L.findIndex((x) => !x.past && (x.i > 0 || !(doneOn(x.g, x.d) || nowMin() >= endMin(x.g, x.d))));
      if (k < 0) k = L.findIndex((x) => !x.past); NX.hero = k < 0 ? L.length - 1 : k;
    }
    return hero.apply(this, arguments);
  };
})();

/* ---------- Students tab: a small search, groups, then every individual student as a row ---------- */
pgStudents = function () { // eslint-disable-line no-global-assign
  const n = S.groups.reduce((a, g) => a + g.students.length, 0), left = S.groups.reduce((a, g) => a + (g.left || []).length, 0);
  const solos = soloGroups().flatMap((g) => g.students.map((st) => ({ g, st }))).sort((a, b) => byName(a.st, b.st));
  const grow = (g) => `<button class="nx-row" data-nxpush="sgrp" data-g="${g.id}"><span class="nx-tile" style="--c:${gColor(g)}">${ic('Users')}</span><span class="nx-tx"><b>${esc(g.name)}</b><small>${esc(LVNAME(g.lvl))} · ${g.days.map((d) => DAYS[d]).join(' ')} · ${g.time}</small></span><em>${g.students.length}</em>${chev()}</button>`;
  const srow = ({ g, st }) => `<button class="nx-row" data-nxpush="sprof" data-g="${g.id}" data-sid="${st.id}">${nxAv(st)}<span class="nx-tx"><b>${esc(st.name)}</b><small>${esc(LVNAME(g.lvl))} · ${g.days.map((d) => DAYS[d]).join(' ')} · ${g.time}</small></span>${chev()}</button>`;
  return `${nxHead('Students', `${n} students`)}
    <label class="nx-search f18"><span>${ic('Search')}</span><input id="nx-q" placeholder="Search" autocomplete="off" data-noswipe></label>
    <div class="nx-hits" id="nx-hits" hidden></div>
    <div id="nx-lists"><div class="nx-sec">Groups</div><div class="nx-list">${workGroups().map(grow).join('') || '<p class="nx-empty">No groups yet</p>'}</div>
    ${solos.length ? `<div class="nx-sec">Individual students</div><div class="nx-list">${solos.map(srow).join('')}</div>` : ''}
    <div class="f18-foot"><button class="nx-btn soft" data-sheet="group">${ic('Plus')} New group</button><button class="f18-arch" data-nxpush="sarch">${ic('History')} Archived${left ? ' · ' + left : ''}</button></div></div>`;
};

/* ---------- Payments: a tap on the group's top line (name, "5/10 paid", the coloured line) opens or closes its list ---------- */
document.addEventListener('click', (e) => {
  const h = e.target.closest && e.target.closest('.nx-pg > .nx-ch, .nx-pg > .nx-pbar'); if (!h) return;
  const more = h.parentElement.querySelector('.nx-more'); if (more) more.click();
});
