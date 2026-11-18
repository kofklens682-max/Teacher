'use strict';
/* 18 Nov 2026 (user, three phone screenshots):
   1) "When I press someone to pay, the page behind is squeezing and a third page can be seen (Home)": the screen behind a pop-up shrank,
      and Home (the tab page under that screen, moved 30% to the left) showed around it. Now only ONE page sinks, and the space around it
      is filled with that page's own color (his choice: no black, no gray). Settings > Look > "Sink behind pop-ups" turns it off.
   2) "The z-axis motion lags": the sink also animated the rounded corners, and that repaints the whole page on every frame (the Library
      with its covers was the heaviest). Now only the size moves (graphics chip). And closing a pop-up rebuilt the pages underneath at
      its first frame: now the pop-up starts closing at once and the pages are refreshed after it has gone.
   3) "Week 3 · Lesson 2 · Mock: Listening and Reading": the second line hid under the countdown (the card had a fixed height and the text
      a two-line cut). The card now grows to its longest text; the "Swipe the card up or down" line is gone (his yes). */
(function () {
  if (typeof syncSheet !== 'function' || typeof draw !== 'function') return;
  const KEY = 'f21-sink';
  const sinkOn = () => { try { return localStorage.getItem(KEY) !== '0'; } catch (e) { return true; } };
  const setFlag = () => document.documentElement.classList.toggle('f21-nosink', !sinkOn());
  setFlag();

  // ---- 1) one page behind a pop-up, its own color around it ----
  let under = null;
  const getUnder = () => { if (!under) { under = document.createElement('div'); under.className = 'f21-under'; } return under; };
  const placeUnder = () => {
    const sinking = document.querySelector('.tp-push.f20-sink');
    const u = getUnder();
    if (sinking && sinkOn()) { if (u.nextSibling !== sinking || u.parentNode !== sinking.parentNode) sinking.parentNode.insertBefore(u, sinking); }
    else if (u.isConnected && !document.querySelector('.tp-push.f20-sink')) u.remove();
  };
  // the glass of a pop-up only while it stands still (fix21.css 4): "moving" from its first frame until its slide has ended
  const watch = (el) => {
    if (!el || el._f21) return; el._f21 = true; el.classList.add('f21-mv');
    const p = el._panel || el.querySelector('.panel'); if (!p) return;
    p.addEventListener('transitionrun', (e) => { if (e.target === p && e.propertyName === 'transform') el.classList.add('f21-mv'); });
    const still = (e) => { if (e.target === p && e.propertyName === 'transform') el.classList.remove('f21-mv'); };
    p.addEventListener('transitionend', still); p.addEventListener('transitioncancel', still);
    setTimeout(() => { if (el.isConnected && el.classList.contains('show') && !el.classList.contains('dragging')) el.classList.remove('f21-mv'); }, 900); // never stuck
  };
  const _sheet = syncSheet;
  syncSheet = function () {
    const r = _sheet.apply(this, arguments);
    if (R.sheet) watch(R.sheet);
    document.documentElement.classList.toggle('f21-sh', !!document.querySelector('.tp-sheet'));
    if (!R.sheet) setTimeout(() => document.documentElement.classList.toggle('f21-sh', !!document.querySelector('.tp-sheet')), 450);
    // fix20 adds the sink class one frame later: place the cover in the same frame, right under the sinking screen
    requestAnimationFrame(placeUnder);
    if (!R.sheet || R.sheet.classList.contains('closing')) setTimeout(placeUnder, 520); // after the page has grown back
    return r;
  };

  // ---- 2) closing a pop-up: start the animation at once, refresh the pages after it ----
  // Only when nothing else changes in the same step (same tab, same screens): then the pages underneath are exactly as they were.
  const _draw = draw;
  draw = function (lite) {
    if (!lite && R && R.sheet && !T.sheet && !R.sheet.classList.contains('closing')) {
      const stack = R.stack || [], same = stack.length === T.push.length && stack.every((el, i) => el._sc === T.push[i]) && !R.f21tab;
      if (same) {
        syncSheet(); syncTabs();
        clearTimeout(R.lateDraw); R.lateDraw = setTimeout(() => draw(), 480);
        return;
      }
    }
    return _draw.apply(this, arguments);
  };
  if (typeof goTab === 'function') { const _go = goTab; goTab = function () { R.f21tab = true; try { return _go.apply(this, arguments); } finally { R.f21tab = false; } }; }

  // ---- 3) the class card fits its text ----
  function fitHero() {
    const hero = R && R.pages[0] && R.pages[0].querySelector('.nx-hero:not(.empty)'); if (!hero) return;
    let need = 0;
    hero.querySelectorAll('.nx-hcard').forEach((c) => {
      const cs = getComputedStyle(c), pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom), gap = parseFloat(cs.rowGap) || 0;
      const kids = [...c.children].filter((k) => getComputedStyle(k).position !== 'absolute');
      // heights only: the bottom row's margin is "auto" (it fills what is left), so margins are not added; the title's 2 px are
      const h = kids.reduce((a, k) => a + k.offsetHeight, 0) + gap * Math.max(0, kids.length - 1) + 2;
      need = Math.max(need, Math.ceil(h + pad));
    });
    if (need > 60) { const want = Math.max(150, need) + 'px'; if (hero.style.height !== want) hero.style.setProperty('height', want, 'important'); }
  }
  if (typeof PAGES !== 'undefined' && PAGES[0]) {
    const _home = PAGES[0];
    PAGES[0] = function () {
      return _home.apply(this, arguments).replace(/<p class="nx-hint">Swipe the card up or down<\/p>/, '<div class="f21-gap"></div>').replace('</div><div style="height:12px"></div>', '</div><div class="f21-gap"></div>');
    };
  }
  // the small Home tiles' titles ("OWE 2+ MONTHS") on a narrow phone: closer letters, then a smaller font, never cut
  function fitTitles() {
    R.pages[0].querySelectorAll('.nx-w2 .nx-ch b').forEach((b) => {
      b.style.letterSpacing = ''; b.style.fontSize = '';
      if (b.scrollWidth <= b.clientWidth + 1) return;
      b.style.letterSpacing = '0';
      let f = parseFloat(getComputedStyle(b).fontSize);
      while (b.scrollWidth > b.clientWidth + 1 && f > 9.5) { f -= 0.5; b.style.fontSize = f + 'px'; }
    });
  }
  const _fit = fitHero;
  fitHero = function () { _fit(); try { fitTitles(); } catch (e) { /* stays as it is */ } };
  window.f21FitHero = fitHero;
  if (typeof renderPage === 'function') { const _rp = renderPage; renderPage = function (i) { const r = _rp.apply(this, arguments); if (i === 0) fitHero(); return r; }; }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { try { fitHero(); } catch (e) { /* later */ } });
  window.addEventListener('resize', () => { try { fitHero(); } catch (e) { /* later */ } });

  // ---- Settings > Look: the switch ----
  const row = () => `<button class="gb-live f21-row" data-f21sink role="switch" aria-checked="${sinkOn()}"><span><b>Sink behind pop-ups</b><small>The page moves back a little while a pop-up is open</small></span><i class="gb-sw${sinkOn() ? ' on' : ''}"></i></button>`;
  if (window.GlassBend && GlassBend.html) { const _h = GlassBend.html; GlassBend.html = function () { return _h.apply(this, arguments).replace(/<\/div>$/, row() + '</div>'); }; }
  document.addEventListener('click', (e) => { const b = e.target.closest && e.target.closest('[data-f21sink]'); if (!b) return; e.preventDefault(); e.stopPropagation();
    try { localStorage.setItem(KEY, sinkOn() ? '0' : '1'); } catch (x) { /* this visit only */ }
    setFlag(); b.setAttribute('aria-checked', sinkOn()); const i = b.querySelector('i'); if (i) i.classList.toggle('on', sinkOn()); }, true);
})();
