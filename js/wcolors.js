'use strict';
/* Settings > Look > Widget colors (17 Nov 2026).
   First version: 26 colour dots in a long sideways strip per group. The user: "terribly chosen, terribly organized, hard to choose,
   not the best colours; use only the colours iPhone uses". Now:
   - ONLY Apple's 12 system colours, in Apple's own order (Red, Orange, Yellow, Green, Mint, Teal, Cyan, Blue, Indigo, Purple, Pink,
     Brown), in their vivid form (the one iOS uses on bright widgets and in dark mode);
   - the page is a short list: each group, Individual, Birthday, with its colour; a tap opens a sheet with a 4 x 3 grid of big glossy
     circles with their names, a live preview, a tick on the current one, and the name of the group that already uses a colour;
   - a group's colour has ONE owner: hc(g) = IOS[g.ci] (Paid circles, Payments pie, legend dots, group tiles all read it). The colours
     sit at the end of IOS (from index 200; the 10 old colours repeat up to 199, so a group that never chose keeps its colour).
     The old number is kept in S.wcol.orig[gid] for "Original color". Individual: S.wcol.solo; Birthday: S.wcol.bday. */
(function () {
  if (typeof IOS === 'undefined' || typeof PUSH === 'undefined') return;
  // The IOS slots from 200 keep the order of the first version (so a colour chosen in 9.8 stays the same); new ones are appended.
  const SLOTS = ['#FF375F', '#FF2D92', '#FF453A', '#FF6B35', '#FF9F0A', '#FFD60A', '#A3E635', '#30D158', '#00C7BE', '#40C8E0', '#64D2FF', '#0A84FF', '#5E5CE6', '#BF5AF2',
    '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#63E6E2', '#30B0C7', '#32ADE6', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E', '#AC8E68'];
  // what is offered: Apple's system colours (vivid), Apple's order
  const APPLE = [['#FF453A', 'Red'], ['#FF9F0A', 'Orange'], ['#FFD60A', 'Yellow'], ['#30D158', 'Green'], ['#63E6E2', 'Mint'], ['#40C8E0', 'Teal'],
    ['#64D2FF', 'Cyan'], ['#0A84FF', 'Blue'], ['#5E5CE6', 'Indigo'], ['#BF5AF2', 'Purple'], ['#FF375F', 'Pink'], ['#AC8E68', 'Brown']];
  const BASE = IOS.slice(0, 10), AT = 200;
  while (IOS.length < AT) IOS.push(BASE[IOS.length % BASE.length]);
  SLOTS.forEach((c) => IOS.push(c));
  const slotOf = (c) => AT + SLOTS.indexOf(c);
  const nameOf = (c) => { const x = APPLE.find(([h]) => h.toUpperCase() === String(c).toUpperCase()); return x ? x[1] : 'Original'; };
  const W = () => (S.wcol = S.wcol && typeof S.wcol === 'object' ? S.wcol : {});
  const SOLO0 = '#AC8E68', BDAY0 = '#FF375F';
  window.f20BdayCol = () => W().bday || BDAY0;
  const soloCol = () => W().solo || SOLO0;
  // the one-to-one students' colour is written as a fixed '#AC8E68' in a few pages: swap it for the chosen one
  const swapSolo = (h) => (W().solo && typeof h === 'string' ? h.split(SOLO0).join(W().solo) : h);
  [0, 4].forEach((i) => { const f = PAGES[i]; PAGES[i] = function () { return swapSolo(f.apply(this, arguments)); }; });
  ['owe2', 'sprof'].forEach((k) => { const f = PUSH[k]; if (f) PUSH[k] = function () { return swapSolo(f.apply(this, arguments)); }; });

  const groupsHere = () => S.groups.filter((g) => !g.solo && g.students && g.students.length);
  const hasSolo = () => S.groups.some((g) => g.solo && g.students && g.students.length);
  // the things that have a colour: key, name, current colour, original colour
  function items() {
    const w = W(), out = groupsHere().map((g) => ({ k: 'g:' + g.id, name: g.name, col: hc(g), orig: IOS[(w.orig && g.id in w.orig ? w.orig[g.id] : g.ci) % IOS.length], own: !!(w.orig && g.id in w.orig), sub: 'Paid circles and Payments pie' }));
    if (hasSolo()) out.push({ k: 'solo', name: 'Individual', col: soloCol(), orig: SOLO0, own: !!w.solo, sub: 'One-to-one students in Payments' });
    out.push({ k: 'bday', name: 'Birthday', col: f20BdayCol(), orig: BDAY0, own: !!w.bday, sub: 'The Birthday tile on Home' });
    return out;
  }
  function preview() {
    const ym = typeof payState === 'function' ? payState().ym : ymOf(TODAY), sc = statusCounts(ym), rings = typeof ffMiniRings === 'function' ? ffMiniRings(sc) : '';
    const legend = groupsHere().map((g) => `<span><i style="background:${hc(g)}"></i>${esc(g.name)}</span>`).join('');
    return `<div class="wc-prev"><div class="nx-card wc-p1"><div class="nx-ch"><b>${ic('Wallet')} Paid</b></div><div class="wc-p1r">${rings}<div class="wc-leg">${legend}</div></div></div>
      <div class="nx-card f20-bday wc-p2" style="--bc:${f20BdayCol()}"><div class="nx-ch"><b>${ic('PartyPopper')} Birthday</b></div><div class="f20-orow"><b class="big f20-num">6<small>days</small></b></div></div></div>`;
  }
  const dotHTML = (c) => `<span class="wc-cur" style="--c:${c}"></span>`;

  PUSH.wcolors = function () {
    const rows = items().map((x) => `<button class="nx-row wc-item" data-wcopen="${x.k}">${dotHTML(x.col)}<span class="nx-tx"><b>${esc(x.name)}</b><small>${nameOf(x.col) !== 'Original' ? nameOf(x.col) : 'Original color'}</small></span>${chev()}</button>`);
    const n = groupsHere().length;
    return `${backBar('Back', '')}<div class="tp-inner">
      <div class="nx-title">Widget colors</div><p class="nx-sub">Tap a row to choose its color.</p>
      ${preview()}
      <div class="nx-sec">Groups · Paid circles and Payments pie</div><div class="nx-list">${rows.slice(0, n).join('')}</div>
      <div class="nx-sec">Individual students and Birthday tile</div><div class="nx-list">${rows.slice(n).join('')}</div></div>`;
  };

  // the colour sheet: a 4 x 3 grid of Apple's colours
  SHEETS.wcpick = function (sh) {
    const all = items(), x = all.find((i) => i.k === sh.k); if (!x) return '';
    const cur = String(x.col).toUpperCase();
    const usedBy = (c) => all.filter((i) => i.k !== x.k && i.k !== 'bday' && String(i.col).toUpperCase() === c.toUpperCase()).map((i) => i.name);
    const grid = APPLE.map(([c, n]) => { const on = x.own && cur === c.toUpperCase(), u = x.k === 'bday' ? [] : usedBy(c);
      return `<button class="wc-sw${on ? ' on' : ''}" data-wcset="${x.k}|${c}" style="--c:${c}" aria-label="${n}${u.length ? ', used by ' + esc(u.join(', ')) : ''}"><span class="wc-ball">${on ? ic('Check') : ''}</span><b>${n}</b>${u.length ? `<em>${esc(u.join(', '))}</em>` : ''}</button>`; }).join('');
    return `<div class="tp-sh-h"><span></span><b>${esc(x.name)}</b><button class="tp-back strong" data-closesheet>Done</button></div>
      ${preview()}
      <div class="wc-grid" data-noswipe>${grid}</div>
      <button class="nx-row wc-orig${x.own ? '' : ' on'}" data-wcset="${x.k}|">${dotHTML(x.orig)}<span class="nx-tx"><b>Original color</b><small>The color it had before</small></span>${x.own ? '' : `<span class="wc-tick">${ic('Check')}</span>`}</button>`;
  };

  function setColor(k, c) {
    const w = W();
    if (k.startsWith('g:')) {
      const gid = k.slice(2), g = gById(gid); if (!g) return; w.orig = w.orig || {};
      if (!c) { if (gid in w.orig) { g.ci = w.orig[gid]; delete w.orig[gid]; } }
      else { if (!(gid in w.orig)) w.orig[gid] = g.ci; g.ci = slotOf(c); }
    } else if (k === 'solo') { if (c) w.solo = c; else delete w.solo; }
    else if (k === 'bday') { if (c) w.bday = c; else delete w.bday; }
    save(); draw();
  }
  const _hc = home2Click;
  home2Click = function (b, d) {
    if (d.wcopen) { openSheet({ s: 'wcpick', k: d.wcopen }); return true; }
    if (d.wcset !== undefined) { const i = d.wcset.indexOf('|'); setColor(d.wcset.slice(0, i), d.wcset.slice(i + 1)); return true; }
    return _hc.apply(this, arguments);
  };

  // Settings > Look: the row that opens it (first in the list)
  const _s = PUSH.set2;
  PUSH.set2 = function () {
    return _s.apply(this, arguments).replace('<div class="nx-sec">Look</div><div class="nx-list">', () => `<div class="nx-sec">Look</div><div class="nx-list"><button class="nx-row" data-nxpush="wcolors"><span class="nx-tile wc-tile">${ic('Palette') || ic('Star')}</span><span class="nx-tx"><b>Widget colors</b><small>Paid circles, Payments pie, Birthday</small></span>${chev()}</button>`);
  };
})();
