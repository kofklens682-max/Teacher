'use strict';
/* 8 Nov PREVIEW (questionnaire): Units = the LIVE app's own screen (chips, blue card, list of weeks), polished like Home.
   Each week shows an Apple emoji in a soft rounded square (no emoji repeats inside a level). Loaded last. */
const EMO_FALLBACK = ['📘', '⭐', '🎈', '🧩', '🎨', '🎵', '🌟', '🧠', '💡', '🎯', '🗂️', '📝', '🔤', '🌈', '🪁'];
function uniqueEmoji(units) {
  const used = new Set(), out = {};
  units.forEach((u) => {
    if (u.final) { out[u.n] = '🏆'; used.add('🏆'); return; }
    const real = u.lessons.filter((l) => !/^(Review|Reading|Culture|Final)/i.test(l.subtopic)), cands = [];
    [...real.map((l) => l.subtopic), u.title + ' ' + u.lessons.map((l) => l.subtopic).join(' ')].forEach((t) => TOPIC_EMO.forEach(([re, e]) => { if (re.test(t) && !cands.includes(e)) cands.push(e); }));
    if (ICON_EMO[u.icon]) cands.push(ICON_EMO[u.icon]);
    const pick = cands.find((e) => !used.has(e)) || EMO_FALLBACK.find((e) => !used.has(e)) || '📘';
    used.add(pick); out[u.n] = pick;
  });
  return out;
}
PAGES[1] = function () {
  const html = pgUnits(), kids = T.aud === 'kids' && KIDLV.length, L = lv(kids ? T.kidLvl : T.unitLvl), [c1, c2] = GRAD[L.id] || GRAD.own;
  const box = document.createElement('div'); box.innerHTML = html;
  const E = planned(L.id) ? uniqueEmoji(L.units) : {};
  box.querySelectorAll('.un-row2').forEach((b) => { const t = b.querySelector('.un-ic .tp-tile'), n = +b.dataset.w; if (t && E[n]) { const s = document.createElement('span'); s.className = 'emo'; s.textContent = E[n]; t.replaceWith(s); } });
  const hero = box.querySelector('.un-hero'); if (hero) hero.style.cssText += `;--lc1:${c1};--lc2:${c2}`;
  return box.innerHTML;
};
/* the levels sit in ONE fixed card (no sideways scrolling): a short code big, the name small; the chosen one fills with its color */
const LVCODE = { RU: ['RU', 'Round-Up'], K2: ['FF 2', 'Book 2'], K3: ['FF 3', 'Book 3'], K4: ['FF 4', 'Book 4'], K5: ['FF 5', 'Book 5'],
  A1: ['A1', 'Beginner'], A2: ['A2', 'Elementary'], B1: ['B1', 'Pre-Int'], 'B1+': ['B1+', 'Pre-Int+'], B2: ['B2', 'Upper-Int'], I1: ['6.5', 'IELTS'], I2: ['7+', 'IELTS'], IT: ['⚡', 'Turbo'] };
{
  const _p = PAGES[1];
  PAGES[1] = function () {
    const box = document.createElement('div'); box.innerHTML = _p(); return box.innerHTML; // user: keep the original long chips, only put them in a cage (see .tp-segs in ffunits3.css)
    const kids = T.aud === 'kids' && KIDLV.length, list = kids ? KIDLV : UNIT_LV(), cur = kids ? T.kidLvl : T.unitLvl;
    const cage = document.createElement('div'); cage.className = 'lvcage'; cage.setAttribute('data-noswipe', ''); cage.style.setProperty('--n', kids ? list.length : 4);
    cage.innerHTML = list.map((l) => { const [a, b] = GRAD[l.id] || GRAD.own, [code, name] = LVCODE[l.id] || [l.id, LVNAME(l.id)], gs = S.groups.filter((g) => g.lvl === l.id).length, gn = S.groups.filter((g) => g.lvl === l.id).map((g) => g.name).join(' · ');
      return `<button class="${l.id === cur ? 'on' : ''}" style="--c1:${a};--c2:${b}" ${kids ? `data-kidlvl="${l.id}"` : `data-unitlvl="${l.id}"`}><b>${esc(code)}</b><span>${esc(gn || name)}</span>${gs ? '<i></i>' : ''}</button>`; }).join('');
    segs.replaceWith(cage); return box.innerHTML;
  };
}
