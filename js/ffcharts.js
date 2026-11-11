'use strict';
/* B+ infographics (charts) for Home. Counts only: money stays in the Budget app. Loaded after ffsys.js. */
const ffShort = (k) => { const d = fromIso(k); return d.getDate() + '/' + (d.getMonth() + 1); };
const ffCol = (p) => (p >= 85 ? '#34C759' : p >= 65 ? '#F0A92E' : '#F0614F');
function ffBars(pts, o) { // pts: [{p, top, label, col, cur}]  p = 0..100; a quiet bar chart in SVG
  const W = 320, H = o.h || 150, top = 20, bot = 24, hh = H - top - bot, n = pts.length, slot = (W - 8) / n, bw = Math.min(30, slot * 0.62);
  const grid = [0, 50, 100].map((v) => { const y = top + hh - (v / 100) * hh; return `<line x1="4" x2="${W - 4}" y1="${y}" y2="${y}" class="gl${v ? '' : ' base'}"/>${v && !o.h ? `<text x="${W - 4}" y="${y - 3}" text-anchor="end" class="gt">${v}%</text>` : ''}`; }).join('');
  const bars = pts.map((q, i) => { const x = 4 + i * slot + (slot - bw) / 2, h = Math.max(q.p > 0 ? 4 : 0, (q.p / 100) * hh), y = top + hh - h;
    return `<g><rect x="${x}" y="${y}" width="${bw}" height="${h}" rx="7" fill="${q.col || o.color}" class="bar"/><text x="${x + bw / 2}" y="${y - 5}" text-anchor="middle" class="bv">${q.top}</text><text x="${x + bw / 2}" y="${H - 7}" text-anchor="middle" class="bl${q.cur ? ' cur' : ''}">${q.label}</text></g>`; }).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="ffsvg" role="img" aria-label="${esc(o.aria)}">${grid}${bars}</svg>`;
}
{
  const _h = home2Click;
  home2Click = function (b, d) { if (d.ffgrp) { T.ffg = d.ffgrp; draw(); return true; } return _h(b, d); };
}
