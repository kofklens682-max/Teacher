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
  const SLOTS = ['#FF2D55', '#FF2D55', '#FF3B30', '#FF9500', '#FF9500', '#FFCC00', '#34C759', '#34C759', '#00C7BE', '#30B0C7', '#32ADE6', '#007AFF', '#5856D6', '#AF52DE',
    '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE', '#30B0C7', '#32ADE6', '#007AFF', '#5856D6', '#AF52DE', '#FF2D55', '#A2845E', '#A2845E'];
  /* 18 Nov 2026 (user): "strict Apple colors, and let me choose a bit darker, dark, the actual color, bright, a bit brighter".
     Each of Apple's 12 colors in 5 shades, all Apple's own values: Darker = Apple's high-contrast color, Actual = the standard system
     color, Bright = the dark-mode color, Brighter = the high-contrast dark-mode color; Dark = halfway between Darker and Actual.
     (Apps/next/applecolors.js skips this file: these values are chosen on purpose.) */
  const SHADE = ['Darker', 'Dark', 'Actual', 'Bright', 'Brighter'];
  const half = (a, b) => '#' + [1, 3, 5].map((i) => Math.round((parseInt(a.substr(i, 2), 16) + parseInt(b.substr(i, 2), 16)) / 2).toString(16).padStart(2, '0')).join('').toUpperCase();
  const FAM = [['Red', '#D70015', '#FF3B30', '#FF453A', '#FF6961'], ['Orange', '#C93400', '#FF9500', '#FF9F0A', '#FFB340'], ['Yellow', '#B25000', '#FFCC00', '#FFD60A', '#FFD426'],
    ['Green', '#248A3D', '#34C759', '#30D158', '#30DB5B'], ['Mint', '#0C817B', '#00C7BE', '#63E6E2', '#66D4CF'], ['Teal', '#008299', '#30B0C7', '#40C8E0', '#5DE6FF'],
    ['Cyan', '#0071A4', '#32ADE6', '#64D2FF', '#70D7FF'], ['Blue', '#0040DD', '#007AFF', '#0A84FF', '#409CFF'], ['Indigo', '#3634A3', '#5856D6', '#5E5CE6', '#7D7AFF'],
    ['Purple', '#8944AB', '#AF52DE', '#BF5AF2', '#DA8FFF'], ['Pink', '#D30F45', '#FF2D55', '#FF375F', '#FF6482'], ['Brown', '#7F6545', '#A2845E', '#AC8E68', '#B59469']]
    .map(([n, d, a, b, bb]) => ({ n, s: [d, half(d, a), a, b, bb] }));
  // what is offered in the grid: each color in its Actual shade
  const APPLE = FAM.map((f) => [f.s[2], f.n]);
  FAM.forEach((f) => f.s.forEach((c) => SLOTS.push(c))); // the 60 shades get their own slots after the old ones (old picks keep theirs)
  const BASE = IOS.slice(0, 10), AT = 200;
  while (IOS.length < AT) IOS.push(BASE[IOS.length % BASE.length]);
  SLOTS.forEach((c) => IOS.push(c));
  const slotOf = (c) => AT + SLOTS.indexOf(c);
  const findC = (c) => { const u = String(c).toUpperCase(); for (let i = 0; i < FAM.length; i++) { const j = FAM[i].s.indexOf(u); if (j >= 0) return { f: i, s: j }; } return null; };
  const nameOf = (c) => { const x = findC(c); return x ? FAM[x.f].n + (x.s !== 2 ? ' · ' + SHADE[x.s] : '') : 'Original'; };
  const W = () => (S.wcol = S.wcol && typeof S.wcol === 'object' ? S.wcol : {});
  const SOLO0 = '#A2845E', BDAY0 = '#FF2D55';
  window.f20BdayCol = () => W().bday || BDAY0;
  const soloCol = () => W().solo || SOLO0;
  // the one-to-one students' colour is written as a fixed '#A2845E' in a few pages: swap it for the chosen one
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
    // "used by" = another group has the same color (any shade of it)
    const me = x.own ? findC(cur) : null, si = me ? me.s : 2;
    const usedBy = (fi) => all.filter((i) => i.k !== x.k && i.k !== 'bday' && (findC(i.col) || {}).f === fi).map((i) => i.name);
    const grid = FAM.map((f, fi) => { const c = f.s[si], on = !!me && me.f === fi, u = x.k === 'bday' ? [] : usedBy(fi);
      return `<button class="wc-sw${on ? ' on' : ''}" data-wcset="${x.k}|${c}" style="--c:${c}" aria-label="${f.n}${u.length ? ', used by ' + esc(u.join(', ')) : ''}"><span class="wc-ball">${on ? ic('Check') : ''}</span><b>${f.n}</b>${u.length ? `<em>${esc(u.join(', '))}</em>` : ''}</button>`; }).join('');
    // the 5 shades of the chosen color (shown once a color is chosen)
    const shades = me ? `<div class="nx-sec">Shade of ${FAM[me.f].n.toLowerCase()}</div><div class="wc-shades" data-noswipe>${FAM[me.f].s.map((c, j) => `<button class="wc-sh${j === me.s ? ' on' : ''}" data-wcset="${x.k}|${c}" style="--c:${c}" aria-label="${SHADE[j]}"><span class="wc-dot">${j === me.s ? ic('Check') : ''}</span><b>${SHADE[j]}</b></button>`).join('')}</div>`
      : `<p class="nx-note c">Choose a color, then its shade: darker, dark, actual, bright or brighter.</p>`;
    return `<div class="tp-sh-h"><span></span><b>${esc(x.name)}</b><button class="tp-back strong" data-closesheet>Done</button></div>
      ${preview()}
      <div class="wc-grid" data-noswipe>${grid}</div>
      ${shades}
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
