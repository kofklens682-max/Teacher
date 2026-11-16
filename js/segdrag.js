'use strict';
/* fix19: every two / three-option switch (.nx-seg: Month | Year, Cash | Card, Full | Discount | Part ...) can be grabbed and slid,
   and a tap makes the white pill glide to the new place instead of jumping. The switch itself still does its work by a normal tap. */
(function () {
  const SEL = '.nx-seg';
  const css = document.createElement('style');
  css.textContent = `.nx-seg{touch-action:pan-y;position:relative}
.sd-thumb{position:absolute;pointer-events:none;z-index:0;will-change:transform;transition:transform .22s cubic-bezier(.3,.9,.3,1)}
.sd-drag>.sd-thumb{transition:none}
.sd-on>button{position:relative;z-index:1}
.sd-on>button.on{background:transparent !important;box-shadow:none !important}`;
  document.head.appendChild(css);
  let st = null, pass = false, dragAt = 0;
  const btnsOf = (seg) => [...seg.children].filter((b) => b.tagName === 'BUTTON');
  function lift(seg, btns, from) { // put a pill exactly where the chosen button's white background is
    const b = btns[from], cs = getComputedStyle(b), th = document.createElement('span'); th.className = 'sd-thumb';
    Object.assign(th.style, { left: b.offsetLeft + 'px', top: b.offsetTop + 'px', width: b.offsetWidth + 'px', height: b.offsetHeight + 'px', background: cs.backgroundColor, borderRadius: cs.borderRadius, boxShadow: cs.boxShadow });
    seg.insertBefore(th, seg.firstChild); seg.classList.add('sd-on'); return th;
  }
  function done(seg, btns, th, from, to) { th.remove(); seg.classList.remove('sd-on', 'sd-drag'); btns.forEach((b, k) => b.classList.toggle('on', k === from)); if (to !== from && btns[to].isConnected) { pass = true; try { btns[to].click(); } finally { pass = false; } } }
  document.addEventListener('pointerdown', (e) => {
    const seg = e.target.closest && e.target.closest(SEL); if (!seg || seg.classList.contains('sd-on')) return;
    const btns = btnsOf(seg), from = btns.findIndex((b) => b.classList.contains('on')); if (btns.length < 2 || from < 0) return;
    seg.setAttribute('data-noswipe', ''); // the tab swipe leaves this finger alone
    st = { seg, btns, from, i: from, x0: e.clientX, y0: e.clientY, id: e.pointerId, on: false, th: null };
  }, true);
  document.addEventListener('pointermove', (e) => {
    if (!st || e.pointerId !== st.id) return; const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
    if (!st.on) { if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) { st = null; return; } if (Math.abs(dx) < 8) return;
      st.on = true; st.th = lift(st.seg, st.btns, st.from); st.seg.classList.add('sd-drag'); try { st.seg.setPointerCapture(e.pointerId); } catch (_) { /* ok */ } }
    const a = st.btns[st.from].offsetLeft, lo = st.btns[0].offsetLeft, hi = st.btns[st.btns.length - 1].offsetLeft, x = Math.max(lo, Math.min(hi, a + dx));
    st.th.style.transform = `translateX(${x - a}px)`;
    let best = 0, bd = 1e9; st.btns.forEach((b, k) => { const d = Math.abs(b.offsetLeft - x); if (d < bd) { bd = d; best = k; } });
    if (best !== st.i) { st.i = best; st.btns.forEach((b, k) => b.classList.toggle('on', k === best)); }
  }, true);
  const end = (e) => { if (!st || e.pointerId !== st.id) return; const s = st; st = null; if (!s.on) return; dragAt = Date.now();
    s.seg.classList.remove('sd-drag'); s.th.style.transform = `translateX(${s.btns[s.i].offsetLeft - s.btns[s.from].offsetLeft}px)`;
    setTimeout(() => done(s.seg, s.btns, s.th, s.from, s.i), 200); };
  document.addEventListener('pointerup', end, true); document.addEventListener('pointercancel', end, true);
  document.addEventListener('click', (e) => {
    if (pass) return; const b = e.target.closest && e.target.closest(SEL + ' > button'); if (!b) return;
    if (Date.now() - dragAt < 350) { e.preventDefault(); e.stopImmediatePropagation(); return; } // the tap that ends a slide
    const seg = b.parentElement, btns = btnsOf(seg), from = btns.findIndex((x) => x.classList.contains('on')), to = btns.indexOf(b);
    if (seg.classList.contains('sd-on')) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    if (from < 0 || to < 0 || from === to || b.disabled) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const th = lift(seg, btns, from); void th.offsetWidth;
    th.style.transform = `translateX(${b.offsetLeft - btns[from].offsetLeft}px)`; btns.forEach((x, k) => x.classList.toggle('on', k === to));
    setTimeout(() => done(seg, btns, th, from, to), 190);
  }, true);
})();
