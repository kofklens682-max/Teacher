'use strict';
/* 8 Nov PREVIEW (last file): the charts card switches IN PLACE (the thumb glides, the chart slides and fades), and the Units wallpaper follows the level color. */
{
  const order = ['att', 'pay', 'crs'], _h = home2Click;
  home2Click = function (b, d) {
    if (d.ffins || d.ffgrp) {
      const card = document.querySelector('.ffc2'), body = card && card.querySelector('.ffc-body'); if (!body) return _h(b, d);
      const was = order.indexOf(T.ffi);
      if (d.ffins) { if (d.ffins === T.ffi) return true; T.ffi = d.ffins; } else T.ffg = d.ffgrp;
      const dir = d.ffins ? (order.indexOf(T.ffi) > was ? 1 : -1) : 0, tmp = document.createElement('div'); tmp.innerHTML = ffInsights2();
      const nb = tmp.querySelector('.ffc-body'), sw = card.querySelector('.ffsw'), now = order.indexOf(T.ffi);
      if (sw) { sw.style.setProperty('--i', now); sw.querySelectorAll('button').forEach((x, i) => x.classList.toggle('on', i === now)); }
      clearTimeout(body._t); body.style.setProperty('--dx', -dir * 22 + 'px'); body.classList.remove('in'); body.classList.add('out');
      body._t = setTimeout(() => { body.innerHTML = nb.innerHTML; body.style.setProperty('--dx', dir * 22 + 'px'); body.classList.remove('out'); body.classList.add('in'); setTimeout(() => body.classList.remove('in'), 560); }, 170);
      return true;
    }
    return _h(b, d);
  };
  const _d = draw;
  draw = function () {
    const r = _d.apply(this, arguments), tp = document.querySelector('.tp');
    // 9 Nov speed audit: the page color no longer changes per level (setting colors on the app's root made the phone restyle every element)
    if (tp && tp.style.getPropertyValue('--b1')) ['--b1', '--b2', '--b3', '--b4'].forEach((k) => tp.style.removeProperty(k));
    return r;
  };
}
/* the row of level cards keeps its place, and starts with the chosen level in view */
{
  document.addEventListener('scroll', (e) => { const r = e.target; if (r instanceof Element && r.classList.contains('lvc-row')) T.ffLvX = r.scrollLeft; }, true);
  const _d2 = draw;
  draw = function () {
    const r = _d2.apply(this, arguments), row = document.querySelector('.lvc-row');
    if (row) { const on = row.querySelector('.lvc.on'); if (T.ffLvX !== undefined) row.scrollLeft = T.ffLvX; else if (on) row.scrollLeft = Math.max(0, on.offsetLeft - 18); if (on && T.ffLvSel !== on.dataset.kidlvl + on.dataset.unitlvl) { T.ffLvSel = on.dataset.kidlvl + on.dataset.unitlvl; row.scrollTo({ left: Math.max(0, on.offsetLeft - 18), behavior: 'smooth' }); } }
    return r;
  };
}
