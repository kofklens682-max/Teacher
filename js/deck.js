'use strict';
/* Lesson presentations ("decks"): about 10 minutes, one idea per slide, pictures, tap to reveal step by step, real
   voices on the word cards, 16:9 for the classroom TV. Made from the course data: a title, the lesson's own teaching
   slides (l.deck, written per lesson), the word cards (the lesson's words with pictures, Russian up to Pre-Int, voices)
   and its exit check. "Save as PDF" prints every slide on its own page with every step shown.
   Pictures: a file name (media/p/<name>.jpg: Spin & Say photos, Gemini drawings) or an emoji. */
const DK_OK = '<span class="dk-mark ok">✓</span>', DK_NO = '<span class="dk-mark no">✗</span>';
const dkMark = (m) => (m === 'ok' ? DK_OK : m === 'no' ? DK_NO : '');
// **can** = the form (blue), !!can't!! = the negative / the mistake (red)
const dkText = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<b class="hl">$1</b>').replace(/!!(.+?)!!/g, '<b class="hl no">$1</b>');
const dkIsFile = (p) => /^[a-z0-9][a-z0-9_-]*$/.test(p || '');
const dkPic = (p, cls = '') => (!p ? '' : dkIsFile(p) ? `<img class="dk-ph ${cls}" src="media/p/${p}.jpg" alt="" draggable="false">` : `<span class="dk-emo ${cls}">${esc(p)}</span>`);
const dkStep = (on) => (on ? ' data-step' : '');

function dkSlides(L, u, l) {
  const S = [], d = l.deck || [], pics = l.pics || {}, ru = l.ru || {};
  const withPic = l.words.filter((w) => dkIsFile(pics[w]));
  const cover = (l.cover || withPic.slice(0, 4).map((w) => pics[w])).slice(0, 4);
  S.push(`<div class="dk-title"><div class="dk-eyebrow">${esc(LVNAME(L.id))} · Week ${u.n} · Lesson ${l.n}</div><h2>${esc(l.subtopic)}</h2>
    <div class="dk-chips">${l.grammarTopic ? `<span class="dk-chip g">${esc(l.grammarTopic)}</span>` : ''}<span class="dk-chip v">${esc(l.vocabTopic || 'Words')} · ${l.words.length} words</span></div></div>
    ${cover.length ? `<div class="dk-collage n${cover.length}">${cover.map((p) => dkPic(p, 'round')).join('')}</div>` : ''}`);
  for (const [type, x] of d) {
    if (type === 'say') S.push(`<div class="dk-split${x.pic ? '' : ' nopic'}${x.lines.reduce((n, a) => n + a[0].length, 0) > 100 ? ' long' : ''}">${x.pic ? dkPic(x.pic, 'big') : ''}<div>${x.eb ? `<div class="dk-eyebrow">${esc(x.eb)}</div>` : ''}
      ${x.lines.map(([t, m, st]) => `<p class="dk-say"${dkStep(st)}>${dkText(t)} ${dkMark(m)}</p>`).join('')}${x.tr ? `<p class="dk-tr" data-step>${esc(x.tr)}</p>` : ''}</div></div>`);
    else if (type === 'pattern') S.push(`<div class="dk-eyebrow c">${esc(x.eb || 'The pattern')}</div><div class="dk-pattern">${x.cols.map((c) => `<div class="col${c[0] === '*' ? ' hlbox' : ''}">${c.slice(c[0] === '*' ? 1 : 0).map(dkText).join('<br>')}</div>`).join('')}</div>
      ${(x.rules || []).map((r) => `<p class="dk-rule" data-step>${dkText(r)}</p>`).join('')}`);
    else if (type === 'qa') S.push(`<div class="dk-split${x.pic ? '' : ' nopic'}">${x.pic ? dkPic(x.pic, 'big') : ''}<div><div class="dk-eyebrow">${esc(x.eb || 'Questions')}</div>
      ${x.items.map(([q, a, m]) => `<p class="dk-say">${dkText(q)}</p><p class="dk-say ans" data-step>${dkText(a)} ${dkMark(m)}</p>`).join('')}</div></div>`);
    else if (type === 'quiz') S.push(`<div class="dk-eyebrow c">${esc(x.eb || 'Tap each picture')}</div><div class="dk-quiz n${x.cards.length}">${x.cards.map(([p, q, a, m]) =>
      `<button class="dk-card" data-flip>${dkPic(p)}<span class="q">${dkText(q)}</span><span class="a ${m === 'no' ? 'no' : 'ok'}">${dkText(a)}</span></button>`).join('')}</div>`);
    else if (type === 'scale') S.push(`<div class="dk-eyebrow c">${esc(x.eb || 'How often?')}</div><div class="dk-scale">${x.items.map(([w, pc], i) =>
      `<div class="row"${dkStep(i > 0)}><b>${dkText(w)}</b><span class="bar"><i style="width:${pc}%"></i></span><em>${pc}%</em></div>`).join('')}</div>`);
    else if (type === 'watch') S.push(`<div class="dk-eyebrow c">Watch out! (Russian and Uzbek speakers)</div><div class="dk-watch">${x.items.map(([bad, good], i) =>
      `<p${dkStep(i > 0)}><s>${esc(bad)}</s> → <b>${esc(good)}</b></p>`).join('')}${x.tip ? `<p class="dk-rule" data-step>${dkText(x.tip)}</p>` : ''}</div>`);
    else if (type === 'turn') S.push(`<div class="dk-title"><div class="dk-eyebrow">Your turn${x.timer ? ' · ' + Math.round(x.timer / 60) + ' minutes' : ''}</div><h2 class="mid">${dkText(x.h)}</h2>
      <ul class="dk-list">${x.items.map((t, i) => `<li${dkStep(i > 0)}>${dkText(t)}</li>`).join('')}</ul>${x.timer ? `<button class="dk-timer" data-timer="${x.timer}">Start ${Math.floor(x.timer / 60)}:${String(x.timer % 60).padStart(2, '0')}</button>` : ''}</div>`);
    else if (type === 'row' || type === 'street') { // places in a row (next to, between) or across a street (across from)
      const blocks = (arr) => `<div class="dk-blocks">${arr.map(([e, t]) => `<span><b>${esc(e)}</b>${esc(t)}</span>`).join('')}</div>`;
      S.push(`<div class="dk-eyebrow c">${esc(x.eb || '')}</div><div class="dk-row">${type === 'row' ? blocks(x.items) : blocks(x.top) + '<div class="dk-road"></div>' + blocks(x.bottom)}
        ${x.lines.map((t, i) => `<p class="dk-say"${dkStep(i >= 0)}>${dkText(t)}</p>`).join('')}</div>`);
    }
    else if (type === 'words') { /* placeholder: the word cards go where the deck says */ S.push('WORDS'); }
    else if (type === 'exit') S.push(`<div class="dk-eyebrow c">Exit check · 3 minutes</div><div class="dk-exit">${x.items.map(([q, a], i) =>
      `<p>${i + 1}. ${dkText(q)} <span data-step class="ans">${dkText(a)}</span></p>`).join('')}</div>`);
  }
  // the word cards: 10 a slide (picture on the front; word, Russian, voice on the back)
  const cards = [];
  for (let i = 0; i < l.words.length; i += 10) {
    const part = l.words.slice(i, i + 10);
    cards.push(`<div class="dk-eyebrow c">Word cards ${l.words.length > 10 ? (i / 10 + 1) + ' / ' + Math.ceil(l.words.length / 10) : ''} · tap to turn · 🔊 to hear</div><div class="dk-flash">${part.map((w) => {
      const p = pics[w], word = w.replace(/\s*\(.*?\)/, '');
      return `<button class="dk-fc${p ? '' : ' nopic'}" data-flip>${p ? dkPic(p) : `<span class="dk-word">${esc(word)}</span>`}<span class="back"><b>${esc(w)}</b>${ru[w] ? `<small>${esc(ru[w])}</small>` : ''}<span class="dk-say-btn" data-say="${esc(word)}">🔊</span></span></button>`;
    }).join('')}</div>`);
  }
  const at = S.indexOf('WORDS');
  if (at >= 0) S.splice(at, 1, ...cards); else { const ex = d.findIndex((s) => s[0] === 'exit'); S.splice(ex >= 0 ? S.length - 1 : S.length, 0, ...cards); }
  return S;
}

let DK = null; // the open presentation
function openDeck(f) {
  const L = lv(f.lvl), u = weekOf(f.lvl, f.w), l = u.lessons[f.l - 1];
  if (DK) closeDeck(true);
  const S = dkSlides(L, u, l), el = document.createElement('div');
  el.className = 'dk-over'; el.style.cssText = gv(L.id);
  el.innerHTML = `<div class="dk" tabindex="0"><div class="dk-stage">${S.map((s, i) => `<section class="dk-slide" data-i="${i}">${s}</section>`).join('')}</div>
    <div class="dk-bar"><button class="dk-nav" data-dkclose aria-label="Close">✕</button><button class="dk-nav" data-go="-1" aria-label="Back">‹</button>
    <div class="dk-dots">${S.map((_, i) => `<i data-dot="${i}"></i>`).join('')}</div><span class="dk-count"></span><button class="dk-nav" data-go="1" aria-label="Next">›</button>
    <button class="dk-nav" data-dkfull aria-label="Full screen">⤢</button></div></div>`;
  document.body.appendChild(el);
  DK = { el, cur: 0, step: 0, slides: [...el.querySelectorAll('.dk-slide')] };
  dkShow(); el.querySelector('.dk').focus({ preventScroll: true });
  el.addEventListener('click', dkClick); el.addEventListener('keydown', dkKey);
  let sx = null;
  el.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  el.addEventListener('touchend', (e) => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(dx) > 50) { el._swiped = Date.now(); dkGo(dx < 0 ? 1 : -1); } });
  requestAnimationFrame(() => el.classList.add('show'));
  stepIn(); // the phone's Back button closes the presentation first
}
function closeDeck(now) {
  if (!DK) return false; const el = DK.el; DK = null;
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) { /* fine */ }
  try { speechSynthesis.cancel(); } catch (e) { /* fine */ }
  if (now) el.remove(); else { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }
  return true;
}
const dkSteps = (i) => [...DK.slides[i].querySelectorAll('[data-step]')];
function dkShow() {
  const { el, slides, cur, step } = DK;
  slides.forEach((s, i) => s.classList.toggle('on', i === cur));
  dkSteps(cur).forEach((e, k) => e.classList.toggle('shown', k < step));
  el.querySelectorAll('[data-dot]').forEach((d, i) => d.classList.toggle('on', i === cur));
  el.querySelector('.dk-count').textContent = `${cur + 1} / ${slides.length}`;
}
function dkGo(d) {
  if (!DK) return;
  if (d > 0) { if (DK.step < dkSteps(DK.cur).length) DK.step++; else if (DK.cur < DK.slides.length - 1) { DK.cur++; DK.step = 0; } }
  else if (DK.step > 0) DK.step--; else if (DK.cur > 0) { DK.cur--; DK.step = dkSteps(DK.cur).length; }
  dkShow();
}
function dkVoice(w) {
  const k = w.toLowerCase().replace(/[^a-z0-9]/g, '');
  if ((C.voices || []).includes(k)) { new Audio(`media/v/${k}.mp3`).play().catch(() => dkSpeak(w)); return; }
  dkSpeak(w);
}
function dkSpeak(w) { try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(w); u.lang = 'en-US'; u.rate = 0.9; speechSynthesis.speak(u); } catch (e) { /* no voice on this phone */ } }
function dkClick(e) {
  if (!DK) return; const t = e.target;
  if (DK.el._swiped && Date.now() - DK.el._swiped < 400) return;
  const say = t.closest('[data-say]'); if (say) { e.stopPropagation(); return dkVoice(say.dataset.say); }
  const flip = t.closest('[data-flip]'); if (flip) return flip.classList.toggle('flipped');
  const tm = t.closest('[data-timer]'); if (tm) { let s = +tm.dataset.timer; clearInterval(tm._i); tm._i = setInterval(() => { s--; tm.textContent = s > 0 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : 'Time!'; if (s <= 0 || !tm.isConnected) clearInterval(tm._i); }, 1000); return; }
  if (t.closest('[data-dkclose]')) return goBack();
  if (t.closest('[data-dkfull]')) { const el = DK.el; try { if (document.fullscreenElement) document.exitFullscreen(); else { const p = (el.requestFullscreen || el.webkitRequestFullscreen).call(el); if (p && p.then) p.then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (x) { /* not on this phone */ } }).catch(() => {}); } } catch (x) { /* not supported */ } return; }
  const nav = t.closest('[data-go]'); if (nav) return dkGo(+nav.dataset.go);
  const dot = t.closest('[data-dot]'); if (dot) { DK.cur = +dot.dataset.dot; DK.step = 0; return dkShow(); }
  if (t.closest('.dk-stage')) { const r = DK.el.querySelector('.dk-stage').getBoundingClientRect(); dkGo(e.clientX - r.left < r.width * 0.3 ? -1 : 1); }
}
function dkKey(e) {
  if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); dkGo(1); }
  else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); dkGo(-1); }
  else if (e.key === 'Escape') goBack();
}
// Save as PDF: every slide on its own landscape page, every step and every card answer shown
function printDeck(f) {
  const L = lv(f.lvl), u = weekOf(f.lvl, f.w), l = u.lessons[f.l - 1];
  const box = document.createElement('div'); box.className = 'dk-print'; box.style.cssText = gv(L.id);
  box.innerHTML = dkSlides(L, u, l).map((s) => `<div class="dk-page"><div class="dk static"><div class="dk-stage"><section class="dk-slide on">${s}</section></div></div></div>`).join('');
  document.body.appendChild(box);
  const title = document.title; document.title = `${LVNAME(L.id)} W${u.n} L${l.n} - ${l.subtopic}`;
  const done = () => { box.remove(); document.title = title; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  const imgs = [...box.querySelectorAll('img')];
  Promise.all(imgs.map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))).then(() => setTimeout(() => window.print(), 50));
}
// Pictures and voices for offline lessons: fetched quietly once when the phone is idle (the service worker keeps them)
function dkFetchMedia() {
  const list = C.media || []; if (!list.length || !('caches' in window)) return;
  const k = 'teacher-media-v' + list.length; try { if (localStorage.getItem(k)) return; } catch (e) { return; }
  let i = 0; const next = () => {
    if (i >= list.length) { try { localStorage.setItem(k, '1'); } catch (e) { /* fine */ } return; }
    const batch = list.slice(i, i + 6); i += 6;
    Promise.all(batch.map((u) => fetch(u).catch(() => null))).then(() => ('requestIdleCallback' in window ? requestIdleCallback(next, { timeout: 3000 }) : setTimeout(next, 200)));
  };
  next();
}
