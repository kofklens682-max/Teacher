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
/* the Units page: every week row uses ffWeekIcon, and the card above the weeks takes the level's own color.
   11 Nov (smooth): built in ONE pass over the text of pgUnits (app.js). Before, the page was parsed and written back as HTML
   three times per draw (ffunits3.js twice, then here) only to swap these icons; the screen shows exactly the same. */
const FF_ROW_ICON = /(<button class="un-row2[^"]*"[^>]*\sdata-w="(\d+)"[^>]*><span class="un-ic[^"]*">)<span class="tp-tile[^"]*"[^>]*>[\s\S]*?<\/span>/g;
PAGES[1] = function () {
  const kids = T.aud === 'kids' && KIDLV.length, L = lv(kids ? T.kidLvl : T.unitLvl), [c1, c2] = GRAD[L.id] || GRAD.own;
  return pgUnits().replace('<div class="hn-next un-hero"', `<div class="hn-next un-hero" style="--lc1:${c1};--lc2:${c2}"`)
    .replace(FF_ROW_ICON, (m, row, n) => (+n ? row + ffWeekIcon(L.id, +n) : m));
};
/* the week screen and the lesson screen: the big tile at the top uses the same picture (the final week's trophy too, as before).
   11 Nov (smooth): the tile is swapped in the text, the whole screen is no longer parsed and written back on every draw. */
const FF_HEAD_TILE = /(<div class="tp-whead">)<span class="tp-tile[^"]*"[^>]*>[\s\S]*?<\/span>/;
['week', 'lesson'].forEach((k) => {
  const o = PUSH[k];
  PUSH[k] = function (f) {
    const h = o(f); if (!f || !f.lvl || !f.w) return h;
    return h.replace(FF_HEAD_TILE, (m, head) => head + ffWeekIcon(f.lvl, +f.w, true));
  };
});
