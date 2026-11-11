'use strict';
/* 8 Nov PREVIEW (last file): the charts card switches IN PLACE (the thumb glides, the chart slides and fades). */
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
}
