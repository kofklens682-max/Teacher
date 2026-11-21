'use strict';
/* 21 Nov 2026 (user): with dark mode on the phone, parts of the app went dark and the colors broke.
   The app is drawn for a light page; only a few bits (tab bar, small buttons) had dark versions, and the phone's
   own "dark mode for apps" painted over the rest. Now Settings > Look > "Always light" (ON by default):
   the app tells the phone it is light-only (color-scheme: only light) and the few dark bits stay light.
   OFF = the old behaviour (follows the phone). The early part runs in index.html <head> so the first frame is right. */
(() => {
  const K = 'teacher-theme', root = document.documentElement;
  const light = () => { try { return localStorage.getItem(K) !== 'auto'; } catch (e) { return true; } };
  const apply = () => {
    const l = light();
    if (l) root.setAttribute('data-theme', 'light'); else root.removeAttribute('data-theme');
    root.style.colorScheme = l ? 'only light' : '';
    let m = document.querySelector('meta[name="color-scheme"]');
    if (!m) { m = document.createElement('meta'); m.name = 'color-scheme'; document.head.appendChild(m); }
    m.content = l ? 'only light' : 'light dark';
  };
  apply();
  window.themeLight = light;
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-themelight]'); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    const v = !light(); try { localStorage.setItem(K, v ? 'light' : 'auto'); } catch (err) { /* private mode */ }
    apply();
    b.setAttribute('aria-checked', String(v)); b.querySelectorAll('.ts-sw').forEach((s) => s.classList.toggle('on', v));
  }, true);
  // Settings > Look: first row
  if (typeof PUSH !== 'undefined' && PUSH.set2) {
    const _s = PUSH.set2;
    PUSH.set2 = function () {
      const on = light();
      return _s.apply(this, arguments).replace('<div class="nx-sec">Look</div><div class="nx-list">', () => `<div class="nx-sec">Look</div><div class="nx-list"><button class="nx-row" data-themelight role="switch" aria-checked="${on}"><span class="nx-tile" style="--c:#FF9500">${(typeof ic === 'function' && (ic('Sun') || ic('Star'))) || ''}</span><span class="nx-tx"><b>Always light</b><small>Stays light when the phone is in dark mode</small></span><i class="ts-sw${on ? ' on' : ''}"></i></button>`);
    };
  }
})();
