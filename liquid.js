'use strict';
/* Liquid glass tab bar (draft). One picture only: the real icon stays where it is and simply grows while you press the bar or slide
   along it. The glass bubble sits behind it. This file only switches the class "press" on the bar; the look is all in liquid.css. */
(function () {
  // Every control with a sliding highlight: the tab bars, segmented controls (Entries / Calendar / Groups...) and the week strip.
  const SLIDERS = '.tp-tabs, .tabs, .seg, .tp-seg2.slide, .wstrip';
  let held = [];
  const release = () => { held.forEach((el) => el.classList.remove('press')); held = []; };
  document.addEventListener('pointerdown', (e) => {
    release();
    const el = e.target.closest && e.target.closest(SLIDERS);
    if (el) { el.classList.add('press'); held.push(el); }
  }, { passive: true, capture: true });
  ['pointerup', 'pointercancel'].forEach((t) => window.addEventListener(t, release, { passive: true, capture: true }));
  window.addEventListener('blur', release);
})();
/* While a sheet or a whole screen slides, html gets the class "moving": the glass bar stops re-blurring what moves under it
   (the main cause of lag on the phone). Small things (a chip, a toggle) do not count. */
(function () {
  let n = 0, t = 0;
  const big = (el) => el instanceof Element && el.matches('.tp-push, .tp-sheet .panel, .tp-viewport, .tp-track, .pv, .tp-page') && !el.closest('.tp-tabs, .tabs');
  const off = () => { n = 0; document.documentElement.classList.remove('moving'); };
  const on = (e) => { if (e.propertyName !== 'transform' || !big(e.target)) return; n++; document.documentElement.classList.add('moving'); clearTimeout(t); t = setTimeout(off, 900); };
  const end = (e) => { if (e.propertyName !== 'transform' || !big(e.target)) return; if (--n <= 0) { clearTimeout(t); t = setTimeout(off, 60); } };
  // 9 Nov speed audit: switched OFF in Teacher (each flip restyled the whole app; nothing blurs under moving screens any more)
  if (false) { document.addEventListener('transitionrun', on, true); document.addEventListener('transitionend', end, true); document.addEventListener('transitioncancel', end, true); } // eslint-disable-line no-constant-condition
})();

/* 10 Nov 2026: the Glass look (html.glass) — soft top and bottom edges, the tab bar that gets smaller while the page goes down,
   and the lens that bends the picture at the edge of the tab bar (Chrome; other browsers keep the plain glass). Styles: glass.css. */
(function () {
  var root = document.documentElement, tp = document.querySelector('.tp');
  if (!tp || tp.querySelector('.g2-edge')) return;
  // soft edges (top and bottom) instead of bars
  ['t', 'b'].forEach(function (k) { var e = document.createElement('div'); e.className = 'g2-edge ' + k; tp.appendChild(e); });
  // scroll: show the top edge once the page moved; shrink the tab bar while going down
  var last = new WeakMap();
  document.addEventListener('scroll', function (ev) {
    var el = ev.target; if (!el || el.nodeType !== 1 || el.closest('.tp-sheet')) return;
    var y = el.scrollTop, was = last.get(el) || 0; last.set(el, y);
    root.classList.toggle('g2-scrolled', y > 24);
    if (Math.abs(y - was) < 4) return;
    root.classList.toggle('g2-down', y > was && y > 60);
  }, true);
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.tp-tabs')) root.classList.remove('g2-down', 'g2-scrolled'); }, true);

  // the lens: the picture bends near the edge of the tab bar (Chrome on Android and computers; other browsers keep plain blur)
  function lens() {
    var tabs = document.querySelector('.tp-tabs'); if (!tabs) return;
    var w = Math.round(tabs.offsetWidth), h = Math.round(tabs.offsetHeight), r = Math.min(h / 2, 36), band = 14;
    if (!w || !h) return;
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    var x = c.getContext('2d'), img = x.createImageData(w, h), d = img.data;
    for (var py = 0; py < h; py++) for (var px = 0; px < w; px++) {
      // distance to the edge of the rounded shape, and the direction pointing inside
      var cx = Math.min(Math.max(px + .5, r), w - r), cy = Math.min(Math.max(py + .5, r), h - r);
      var vx = px + .5 - cx, vy = py + .5 - cy, len = Math.sqrt(vx * vx + vy * vy), dist, nx = 0, ny = 0;
      if (len > 0) { dist = r - len; nx = -vx / len; ny = -vy / len; }
      else { var dl = px + .5, dr = w - px - .5, dt = py + .5, db = h - py - .5; dist = Math.min(dl, dr, dt, db); if (dist === dl) nx = 1; else if (dist === dr) nx = -1; else if (dist === dt) ny = 1; else ny = -1; }
      var k = dist < band ? Math.pow(1 - Math.max(dist, 0) / band, 2) : 0, i = (py * w + px) * 4;
      d[i] = 128 + nx * k * 127; d[i + 1] = 128 + ny * k * 127; d[i + 2] = 128; d[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    var old = document.getElementById('g2-svg'); if (old) old.remove();
    var ns = 'http://www.w3.org/2000/svg', svg = document.createElementNS(ns, 'svg');
    svg.id = 'g2-svg'; svg.setAttribute('width', 0); svg.setAttribute('height', 0); svg.style.position = 'absolute';
    svg.innerHTML = '<filter id="g2lens-tabs" x="0" y="0" width="' + w + '" height="' + h + '" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">'
      + '<feImage href="' + c.toDataURL() + '" x="0" y="0" width="' + w + '" height="' + h + '" result="m"/>'
      + '<feDisplacementMap in="SourceGraphic" in2="m" scale="42" xChannelSelector="R" yChannelSelector="G" result="dr"/><feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cr"/><feDisplacementMap in="SourceGraphic" in2="m" scale="38" xChannelSelector="R" yChannelSelector="G" result="dg"/><feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="cg"/><feDisplacementMap in="SourceGraphic" in2="m" scale="34" xChannelSelector="R" yChannelSelector="G" result="db"/><feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="cb"/><feBlend in="cr" in2="cg" mode="screen" result="rg"/><feBlend in="rg" in2="cb" mode="screen"/></filter>';
    document.body.appendChild(svg);
    var ok = window.CSS && CSS.supports && CSS.supports('backdrop-filter', 'url(#a) blur(2px)') && /Chrome\//.test(navigator.userAgent);
    root.classList.toggle('g2-lens', !!ok);
  }
  setTimeout(lens, 600);
  window.addEventListener('resize', function () { setTimeout(lens, 200); });
})();
