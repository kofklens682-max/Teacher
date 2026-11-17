'use strict';
/* 17 Nov 2026 (user): "in Settings I should choose the colour of the widgets: the Birthday tile, the circles in the Paid widget,
   the pie chart in Payments. Give me bright, shiny colours." Settings > Look > Widget colours (screen "wcolors").
   - A group's colour has ONE owner: hc(g) = IOS[g.ci]. The Paid circles, the Payments pie, the legend dots and the group tiles all
     read it, so choosing a colour here changes all of them together. Bright colours are added at the end of IOS (from index 200;
     the 10 old colours are repeated up to 199 so every group that never chose keeps exactly the colour it had).
   - The group's old number is kept in S.wcol.orig[gid], so "Auto" gives the old colour back.
   - "Individual" (all one-to-one students together in the Payments pie): S.wcol.solo. The Birthday tile: S.wcol.bday. */
(function () {
  if (typeof IOS === 'undefined' || typeof PUSH === 'undefined') return;
  const BRIGHT = [
    ['#FF375F', 'Pink'], ['#FF2D92', 'Magenta'], ['#FF453A', 'Red'], ['#FF6B35', 'Coral'], ['#FF9F0A', 'Orange'], ['#FFD60A', 'Yellow'], ['#A3E635', 'Lime'],
    ['#30D158', 'Green'], ['#00C7BE', 'Mint'], ['#40C8E0', 'Teal'], ['#64D2FF', 'Sky'], ['#0A84FF', 'Blue'], ['#5E5CE6', 'Indigo'], ['#BF5AF2', 'Purple'],
    // 17 Nov (user): "add the shiny iPhone colors too": Apple's system colors (iOS light look), added at the END so saved picks keep their number
    ['#FF3B30', 'iPhone red'], ['#FF9500', 'iPhone orange'], ['#FFCC00', 'iPhone yellow'], ['#34C759', 'iPhone green'], ['#63E6E2', 'iPhone mint'], ['#30B0C7', 'iPhone teal'],
    ['#32ADE6', 'iPhone cyan'], ['#007AFF', 'iPhone blue'], ['#5856D6', 'iPhone indigo'], ['#AF52DE', 'iPhone purple'], ['#FF2D55', 'iPhone pink'], ['#A2845E', 'iPhone brown'],
  ];
  // the order on screen: the iPhone colors first (red to brown), then the extra bright ones
  const SHOWN = BRIGHT.slice(14).concat(BRIGHT.slice(0, 14));
  const BASE = IOS.slice(0, 10), AT = 200;
  while (IOS.length < AT) IOS.push(BASE[IOS.length % BASE.length]);
  BRIGHT.forEach(([c]) => IOS.push(c));
  const W = () => (S.wcol = S.wcol && typeof S.wcol === 'object' ? S.wcol : {});
  const SOLO0 = '#AC8E68', BDAY0 = '#FF375F';
  window.f20BdayCol = () => W().bday || BDAY0;
  const soloCol = () => W().solo || SOLO0;
  // the one-to-one students' colour is written as a fixed '#AC8E68' in a few pages: swap it for the chosen one
  const swapSolo = (h) => (W().solo && typeof h === 'string' ? h.split(SOLO0).join(W().solo) : h);
  [0, 4].forEach((i) => { const f = PAGES[i]; PAGES[i] = function () { return swapSolo(f.apply(this, arguments)); }; });
  ['owe2', 'sprof'].forEach((k) => { const f = PUSH[k]; if (f) PUSH[k] = function () { return swapSolo(f.apply(this, arguments)); }; });

  const groupsHere = () => S.groups.filter((g) => !g.solo && g.students && g.students.length);
  const curOf = (g) => hc(g).toUpperCase();
  const dot = (c, on, attr, label) => `<button class="wc-dot${on ? ' on' : ''}" style="--c:${c}" ${attr} aria-label="${label}"></button>`;
  const strip = (cur, attrOf, autoOn, autoCol) => `<div class="wc-strip" data-noswipe>${dot(autoCol, autoOn, attrOf(''), 'Automatic')}${SHOWN.map(([c, n], i) => (i === 12 ? '<span class="wc-sep" aria-hidden="true"></span>' : '') + dot(c, !autoOn && cur === c.toUpperCase(), attrOf(c), n)).join('')}</div>`;

  PUSH.wcolors = function () {
    const w = W(), ym = typeof payState === 'function' ? payState().ym : ymOf(TODAY), sc = statusCounts(ym);
    const rings = typeof ffMiniRings === 'function' ? ffMiniRings(sc) : '';
    const bc = f20BdayCol();
    const preview = `<div class="wc-prev"><div class="nx-card wc-p1"><div class="nx-ch"><b>${ic('Wallet')} Paid</b></div><div class="wc-p1r">${rings || ''}<b class="big">${sc.ok}<small>/${sc.n}</small></b></div></div>
      <div class="nx-card f20-bday wc-p2" style="--bc:${bc}"><div class="nx-ch"><b>${ic('PartyPopper')} Birthday</b></div><div class="f20-orow"><b class="big f20-num">6<small>days</small></b></div></div></div>`;
    const gRows = groupsHere().map((g) => { const auto = !(w.orig && g.id in w.orig), base = IOS[(w.orig && g.id in w.orig ? w.orig[g.id] : g.ci) % IOS.length];
      return `<div class="wc-row"><div class="wc-name"><i style="background:${hc(g)}"></i><b>${esc(g.name)}</b></div>${strip(curOf(g), (c) => `data-wcg="${g.id}|${c}"`, auto, base)}</div>`; }).join('');
    const solo = S.groups.some((g) => g.solo && g.students && g.students.length) ? `<div class="wc-row"><div class="wc-name"><i style="background:${soloCol()}"></i><b>Individual</b></div>${strip(soloCol().toUpperCase(), (c) => `data-wcs="${c}"`, !w.solo, SOLO0)}</div>` : '';
    return `${backBar('Back', '')}<div class="tp-inner">
      <div class="nx-title">Widget colors</div><p class="nx-sub">Tap a color. Home and Payments change at once.</p>
      ${preview}
      <div class="nx-sec">Groups · Paid circles and Payments pie</div><div class="nx-list wc-list">${gRows}${solo}</div>
      <div class="nx-sec">Birthday tile</div><div class="nx-list wc-list"><div class="wc-row">${strip(bc.toUpperCase(), (c) => `data-wcb="${c}"`, !w.bday, BDAY0)}</div></div>
      <p class="nx-foot">The first dot in each row is the color it had before.</p></div>`;
  };

  const _hc = home2Click;
  home2Click = function (b, d) {
    if (d.wcg !== undefined) {
      const [gid, c] = d.wcg.split('|'), g = gById(gid); if (!g) return true; const w = W(); w.orig = w.orig || {};
      if (!c) { if (gid in w.orig) { g.ci = w.orig[gid]; delete w.orig[gid]; } }
      else { if (!(gid in w.orig)) w.orig[gid] = g.ci; g.ci = AT + BRIGHT.findIndex(([x]) => x === c); }
      save(); draw(); return true;
    }
    if (d.wcs !== undefined) { const w = W(); if (d.wcs) w.solo = d.wcs; else delete w.solo; save(); draw(); return true; }
    if (d.wcb !== undefined) { const w = W(); if (d.wcb) w.bday = d.wcb; else delete w.bday; save(); draw(); return true; }
    return _hc.apply(this, arguments);
  };

  // Settings > Look: the row that opens it (first in the list)
  const _s = PUSH.set2;
  PUSH.set2 = function () {
    return _s.apply(this, arguments).replace('<div class="nx-sec">Look</div><div class="nx-list">', () => `<div class="nx-sec">Look</div><div class="nx-list"><button class="nx-row" data-nxpush="wcolors"><span class="nx-tile wc-tile">${ic('Palette') || ic('Star')}</span><span class="nx-tx"><b>Widget colors</b><small>Paid circles, Payments pie, Birthday</small></span>${chev()}</button>`);
  };
})();
