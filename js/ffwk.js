'use strict';
/* 8 Nov PREVIEW: ONE place decides a week's picture, used everywhere (Units list, the week screen, the lesson screen).
   Gemini icons live in media/wk/<level>-<week>.png; FFWK lists which exist. Weeks without one fall back to an emoji.
   Also: the bright Home colors for every level (consistent with Home). Loaded last. */
const FFWK = { k3: 15, ru: 22, k2: 8, k4: 14, k5: 18, a1: 9, a2: 12, b1: 16, b1p: 13, b2: 13, i1: 13, i2: 13, it: 13 }; // level -> number of Gemini icons made (weeks 1..n)
const ffLvKey = (id) => String(id).toLowerCase().replace('+', 'p');
function ffWeekIcon(lvlId, n, big) {
  const k = ffLvKey(lvlId);
  if (FFWK[k] && n >= 1 && n <= FFWK[k]) return `<img class="gi${big ? ' big' : ''}" alt="" src="media/wk/${k}-${n}.png">`;
  const L = lv(lvlId), E = L && planned(lvlId) ? uniqueEmoji(L.units) : {};
  return `<span class="emo${big ? ' big' : ''}">${E[n] || '📘'}</span>`;
}
/* bright colors, the same family as Home (no dark navy, no purple or pink) */
Object.assign(GRAD, { A1: ['#4DEB8B', '#17BC52'], A2: ['#58D8FF', '#0A84FF'], B1: ['#3FE0C8', '#10B5A6'], 'B1+': ['#5AB4FF', '#0A6CFF'], B2: ['#8EA2FF', '#4A66F0'], I1: ['#FFCF4D', '#FF8A00'], I2: ['#FF8A80', '#FF3B30'], IT: ['#B3BDCC', '#6B7A90'],
  RU: ['#FF9A6B', '#F25C2C'], K2: ['#FFCF4D', '#FF9500'], K3: ['#5AB4FF', '#0A6CFF'], K4: ['#4DEB8B', '#17BC52'], K5: ['#8EA2FF', '#4A66F0'], own: ['#FFCF4D', '#FF9500'] });
/* the Units list: every week row uses ffWeekIcon */
{
  const base = PAGES[1];
  PAGES[1] = function () {
    const box = document.createElement('div'); box.innerHTML = base(); const kids = T.aud === 'kids' && KIDLV.length, L = lv(kids ? T.kidLvl : T.unitLvl);
    box.querySelectorAll('.un-row2').forEach((b) => { const old = b.querySelector('.un-ic .emo, .un-ic .gi, .un-ic .tp-tile'), n = +b.dataset.w; if (old && n) { const t = document.createElement('span'); t.innerHTML = ffWeekIcon(L.id, n); old.replaceWith(t.firstChild); } });
    return box.innerHTML;
  };
}
/* the week screen and the lesson screen: the big tile at the top uses the same picture */
['week', 'lesson'].forEach((k) => {
  const o = PUSH[k];
  PUSH[k] = function (f) {
    const h = o(f); if (!f || !f.lvl || !f.w) return h;
    const box = document.createElement('div'); box.innerHTML = h; const t = box.querySelector('.tp-whead .tp-tile');
    if (t && !t.querySelector('svg')?.innerHTML.includes('Trophy')) { const s = document.createElement('span'); s.innerHTML = ffWeekIcon(f.lvl, +f.w, true); t.replaceWith(s.firstChild); }
    return box.innerHTML;
  };
});
