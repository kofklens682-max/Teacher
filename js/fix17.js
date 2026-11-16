'use strict';
/* 17 Nov (Fable, after the user's feedback on the draft). Loaded after final.js.
   - Payments summary: a simple chart of the groups (a try; the old rings stay in next.js behind it)
   - yellow lesson goal box: dark text
   - "Group finished its level -> move them to the next level?" (Home + the group's page, Undo 8 s, history kept)
   - one automatic copy before the update, and a message when saved data was damaged */

/* ---------- Payments: simple chart ---------- */
function f17Sum(per, sc) {
  const SZ = 132, C0 = SZ / 2, r = 46, L = 2 * Math.PI * r, tot = per.reduce((a, x) => a + x.n, 0) || 1; let off = 0, arcs = '';
  per.forEach((x) => { const len = (L * x.n) / tot; arcs += `<circle cx="${C0}" cy="${C0}" r="${r}" fill="none" stroke="${x.G.col}" stroke-width="24" stroke-dasharray="${Math.max(0.1, len - 2).toFixed(1)} ${L.toFixed(1)}" stroke-dashoffset="${(-off).toFixed(1)}" transform="rotate(-90 ${C0} ${C0})"/>`; off += len; });
  const line = [[sc.ok, ST_COL.paid], [sc.part, ST_COL.part], [sc.unpaid, ST_COL.no]].filter(([v]) => v).map(([v, c]) => `<i style="flex:${v};background:${c}"></i>`).join('');
  return `<div class="nx-card nx-sum2" style="display:block"><div class="f17-pie"><div class="rg"><svg width="${SZ}" height="${SZ}" viewBox="0 0 ${SZ} ${SZ}">${arcs}</svg><div class="c"><b>${tot}</b><span>students</span></div></div>
    <div class="gl">${per.map((x) => `<div><i style="background:${x.G.col}"></i><span>${esc(x.G.name)} <em>${Math.round((x.n / tot) * 100)}%</em></span><b>${x.ok}/${x.n}</b></div>`).join('')}</div></div>
    <div class="f17-line">${line}</div>
    <div class="nx-leg c full"><span><i style="background:${ST_COL.paid}"></i>${sc.ok} paid</span><span><i style="background:${ST_COL.part}"></i>${sc.part} paid a part</span><span><i style="background:${ST_COL.no}"></i>${sc.unpaid} not paid</span></div></div>`;
}

/* ---------- Units / Library: jumping to a far level. The old card used to vanish at once and the new colour appeared in one step
   (user, 16 Nov: "an instant change from one colour to another"). Now the old level fades out over the new one while it glides in. ---------- */
(function () {
  const old = lvGo;
  lvGo = function (tab, i) { // eslint-disable-line no-global-assign
    const page = R.pages[tab], pane = page && page.querySelector('[data-lvpane]'), from = pane ? lvIndex(tab) : -1;
    let ghost = null, box = null;
    if (pane && !R.lvEnd) { box = { t: pane.offsetTop, l: pane.offsetLeft, w: pane.offsetWidth, h: pane.offsetHeight }; ghost = pane.cloneNode(true); }
    const out = old.apply(this, arguments);
    try {
      const p = page && page.querySelector('[data-lvpane]');
      if (ghost && p && !R.lvEnd && lvIndex(tab) !== from && p.parentElement && ghost.animate) { // the far jump: the page was redrawn in place
        ghost.removeAttribute('data-lvpane'); ghost.removeAttribute('style'); ghost.classList.add('f17-ghost'); ghost.inert = true; ghost.setAttribute('aria-hidden', 'true');
        ghost.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
        const par = p.parentElement; if (getComputedStyle(par).position === 'static') par.style.position = 'relative';
        Object.assign(ghost.style, { top: box.t + 'px', left: box.l + 'px', width: box.w + 'px', height: Math.min(box.h, 900) + 'px', overflow: 'hidden' });
        par.appendChild(ghost);
        const a = ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
        const bye = () => ghost.remove(); a.onfinish = bye; a.oncancel = bye; setTimeout(bye, 700);
      }
    } catch (e) { if (ghost) ghost.remove(); }
    return out;
  };
})();

/* ---------- Move to the next level ---------- */
const F17_TEENS = ['A1', 'A2', 'B1', 'B1+', 'B2', 'I1', 'I2']; // IELTS Turbo is its own short course: nothing comes after it
const f17Family = (id) => (F17_TEENS.includes(id) ? F17_TEENS : KIDLV.some((l) => l.id === id) ? KIDLV.map((l) => l.id) : []);
const f17Next = (id) => { const a = f17Family(id), i = a.indexOf(id); return i >= 0 && a[i + 1] ? a[i + 1] : null; };
function f17Done(g) {
  if (!g || g.solo || !planned(g.lvl) || !lv(g.lvl) || !lv(g.lvl).units) return false;
  const U = lv(g.lvl).units, cl = curLes(g), total = U.reduce((a, u) => a + u.lessons.length, 0), done = U.slice(0, cl.w - 1).reduce((a, u) => a + u.lessons.length, 0) + cl.l - 1;
  return done >= total;
}
const f17Later = () => { try { return JSON.parse(localStorage.getItem('lv-later') || '{}'); } catch (e) { return {}; } };
function f17Card(g) {
  const to = f17Next(g.lvl); if (!to || !f17Done(g) || (f17Later()[g.id] || 0) > Date.now()) return '';
  return `<div class="nx-card f17-move"><b>${esc(g.name)} finished ${esc(LVNAME(g.lvl))}</b><span>Move them to ${esc(LVNAME(to))}?</span><div><button data-f17move="${g.id}">Move</button><button class="soft" data-f17later="${g.id}">Not now</button></div></div>`;
}
(function () {
  const w = nxWidgets; nxWidgets = function () { return workGroups().map(f17Card).join('') + w.apply(this, arguments); }; // eslint-disable-line no-global-assign
  const p = PUSH.sgrp; PUSH.sgrp = function (f) { const h = p.apply(this, arguments), g = f && f.g !== 'solo' && gById(f.g), c = g ? f17Card(g) : '';
    return c && typeof h === 'string' && h.includes('<div class="tp-inner">') ? h.replace('<div class="tp-inner">', '<div class="tp-inner">' + c) : h; };
})();
SHEETS.f17move = (s) => { const g = gById(s.g); if (!g) return ''; const to = s.to || f17Next(g.lvl), fam = f17Family(g.lvl).filter((id) => id !== g.lvl);
  return `<div class="tp-sh-h"><span></span><b>Move ${esc(g.name)}</b><button class="tp-back strong" data-closesheet>Cancel</button></div>
    <div class="nx-card" style="padding:4px 14px">${fam.map((id) => `<button class="f17-opt${id === to ? ' on' : ''}" data-f17pick="${g.id}|${id}"><span>${esc(LVNAME(id))}</span>${id === to ? ic('Check') : ''}</button>`).join('')}</div>
    <p class="f17-note">They start at week 1, lesson 1. Their history is kept: payments and past lessons stay as they are.</p>
    <button class="f17-go" data-f17go="${g.id}|${to}">Move to ${esc(LVNAME(to))}</button>`; };

/* ---------- damaged data: tell first ---------- */
SHEETS.f17dmg = (s) => `<div class="tp-sh-h"><span></span><b>Saved data</b><span></span></div>
  <p class="f17-txt">${s.ok ? `Some saved data was damaged. I used your latest good copy${s.at ? ' from ' + esc(s.at) : ''}. Your other copies are in Settings, Backup.` : 'The saved data on this phone is damaged and I could not read it. Nothing was deleted. You can bring it back from a backup file or from an automatic copy.'}</p>
  ${s.ok ? '<button class="f17-go blue" data-closesheet>OK</button>' : '<button class="f17-go blue" data-nxpush="set2" data-closesheet>Open Settings, Backup</button><button class="f17-go soft" data-closesheet>Not now</button>'}`;
function f17Damaged(took) { // called from start() in app.js when the quick copy could not be read
  const ok = !!took && S.groups.length > 0;
  setTimeout(() => openSheet({ s: 'f17dmg', ok, at: ok ? new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '' }), 900);
}

/* ---------- one automatic copy before the update ---------- */
setTimeout(() => { try {
  const seen = localStorage.getItem('app-ver-seen'); if (seen === VERSION_LABEL) return;
  if (typeof hasData === 'function' && hasData()) makeCopy('before', 'Before update to ' + VERSION_LABEL.replace('Teacher ', ''));
  localStorage.setItem('app-ver-seen', VERSION_LABEL);
} catch (e) { /* the daily copy still exists */ } }, 3000);

/* ---------- taps ---------- */
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-f17move],[data-f17later],[data-f17pick],[data-f17go]'); if (!b) return;
  e.preventDefault(); e.stopPropagation(); const d = b.dataset;
  if (d.f17later) { const L = f17Later(); L[d.f17later] = Date.now() + 7 * 864e5; try { localStorage.setItem('lv-later', JSON.stringify(L)); } catch (x) { /* shows again */ } R.pages.forEach((p) => { if (p) p._html = null; }); draw(); return; }
  if (d.f17move) { openSheet({ s: 'f17move', g: d.f17move }); return; }
  if (d.f17pick) { const [g, to] = d.f17pick.split('|'); openSheet({ s: 'f17move', g, to }); return; }
  if (d.f17go) { const [gid, to] = d.f17go.split('|'), g = gById(gid); if (!g) return;
    const old = { lvl: g.lvl, week: g.week, les: g.les, book: g.book };
    closeSheetNow(); g.lvl = to; g.week = 1; g.les = 1; save(); draw();
    setTimeout(() => payToast(`${g.name} moved to ${LVNAME(to)}`, () => { Object.assign(g, old); save(); draw(); }), 350); }
}, true);

/* ---------- Kids levels (Units > Kids): the same soft change. The page is redrawn in place, so the old level fades out over the new one. ---------- */
document.addEventListener('click', (e) => {
  const b = e.target.closest && e.target.closest('[data-kidlvl]'); if (!b || b.classList.contains('on')) return;
  const page = b.closest('.tp-page'), pane = page && page.querySelector('.lv-pane'); if (!pane || !pane.animate) return;
  const box = { t: pane.offsetTop, l: pane.offsetLeft, w: pane.offsetWidth, h: pane.offsetHeight }, ghost = pane.cloneNode(true);
  setTimeout(() => { try {
    const p = page.querySelector('.lv-pane'); if (!p || !p.parentElement) return;
    ghost.removeAttribute('style'); ghost.classList.add('f17-ghost'); ghost.inert = true; ghost.setAttribute('aria-hidden', 'true'); ghost.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
    const par = p.parentElement; if (getComputedStyle(par).position === 'static') par.style.position = 'relative';
    Object.assign(ghost.style, { top: box.t + 'px', left: box.l + 'px', width: box.w + 'px', height: Math.min(box.h, 900) + 'px', overflow: 'hidden' });
    par.appendChild(ghost);
    p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'ease-out' });
    const a = ghost.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: 'ease-out', fill: 'forwards' });
    const bye = () => ghost.remove(); a.onfinish = bye; a.oncancel = bye; setTimeout(bye, 700);
  } catch (x) { ghost.remove(); } }, 0);
}, true);
