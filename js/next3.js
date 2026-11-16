'use strict';
/* NEXT part 3 (15 Nov): the Teacher lock — a 4-digit passcode, and the phone's fingerprint or face on top of it.
   Asks when the app opens and when you come back after more than a minute away. Settings → Passcode and fingerprint. */
const TBIO = BIO.make('teacher'), PIN_K = 'teacher-pin';
const pinGet = () => { try { return JSON.parse(localStorage.getItem(PIN_K) || 'null'); } catch (e) { return null; } };
async function pinHash(code, salt) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(salt + ':' + code)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join(''); }
let tLocked = false;
function padHtml(title, sub, bio) {
  return `<div class="nx-lock"><div class="in"><span class="lk">${ic('ShieldCheck')}</span><b id="nxl-t">${esc(title)}</b><span id="nxl-s">${esc(sub || '')}</span>
    <div class="dots" id="nxl-d"><i></i><i></i><i></i><i></i></div>
    <div class="pad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-nk="${n}">${n}</button>`).join('')}<button data-nk="bio" class="g ${bio ? '' : 'hide'}" aria-label="Fingerprint or face">${ic('Fingerprint')}</button><button data-nk="0">0</button><button data-nk="del" class="g" aria-label="Delete">${ic('ChevronLeft')}</button></div>
    <button class="cx" data-nk="cancel" hidden>Cancel</button></div></div>`;
}
function openPad({ title, sub, bio, cancel, done }) {
  const el = document.createElement('div'); el.innerHTML = padHtml(title, sub, bio); const box = el.firstChild; document.body.appendChild(box);
  if (cancel) box.querySelector('.cx').hidden = false;
  let code = '';
  const paint = () => box.querySelectorAll('#nxl-d i').forEach((d, i) => d.classList.toggle('on', i < code.length));
  const ctl = { close: () => { box.classList.add('out'); setTimeout(() => box.remove(), 260); }, reset: (msg, shake) => { code = ''; paint(); if (msg) box.querySelector('#nxl-s').textContent = msg; if (shake) { const d = box.querySelector('#nxl-d'); d.classList.remove('shake'); void d.offsetWidth; d.classList.add('shake'); } }, title: (t, s) => { box.querySelector('#nxl-t').textContent = t; box.querySelector('#nxl-s').textContent = s || ''; } };
  box.addEventListener('click', async (e) => { const b = e.target.closest('[data-nk]'); if (!b) return; const k = b.dataset.nk;
    if (k === 'del') { code = code.slice(0, -1); paint(); return; }
    if (k === 'cancel') { ctl.close(); cancel && cancel(); return; }
    if (k === 'bio') { if (await TBIO.check()) { ctl.close(); done(null, ctl, true); } return; }
    if (code.length >= 4) return; code += k; paint(); if (code.length === 4) setTimeout(() => done(code, ctl), 120); });
  return ctl;
}
function tLock() {
  const p = pinGet(); if (!p || tLocked) return; tLocked = true;
  const bio = TBIO.on();
  const c = openPad({ title: 'Teacher', sub: bio ? 'Use your fingerprint or face, or the passcode' : 'Enter your passcode', bio, done: async (code, ctl, viaBio) => {
    if (viaBio || (await pinHash(code, p.salt)) === p.hash) { tLocked = false; ctl.close(); } else ctl.reset('Wrong passcode', true); } });
  if (bio) setTimeout(async () => { if (tLocked && await TBIO.check()) { tLocked = false; c.close(); } }, 350);
}
function setPin(after) {
  let first = null;
  openPad({ title: 'Create a passcode', sub: 'Enter 4 digits', cancel: () => after(false), done: async (code, ctl) => {
    if (!first) { first = code; ctl.title('Repeat the passcode', 'The same 4 digits again'); ctl.reset(); return; }
    if (code !== first) { first = null; ctl.title('Create a passcode', 'They did not match. Try again'); ctl.reset(null, true); return; }
    const salt = uid(); localStorage.setItem(PIN_K, JSON.stringify({ salt, hash: await pinHash(code, salt) })); ctl.close(); after(true); } });
}
// the settings page for it
const scSetLock = () => { const p = pinGet();
  return `${backBar('Settings')}<div class="tp-inner"><div class="nx-title">Passcode and fingerprint</div>
    <p class="nx-sub">The app asks when it opens and when you come back after a minute away.</p>
    <div class="nx-list"><div class="nx-row still"><span class="nx-tile" style="--c:#5E5CE6">${ic('ShieldCheck')}</span><span class="nx-tx"><b>Passcode</b><small>${p ? 'On · 4 digits' : 'Off'}</small></span><button class="nx-mini${p ? ' red' : ''}" data-nxpin="${p ? 'off' : 'on'}">${p ? 'Turn off' : 'Turn on'}</button></div>
      <div class="nx-row still"><span class="nx-tile" style="--c:#FF375F">${ic('Fingerprint')}</span><span class="nx-tx"><b>Fingerprint or face</b><small>${TBIO.on() ? 'On' : p ? 'Off' : 'Turn the passcode on first'}</small></span>${p ? `<button class="nx-mini${TBIO.on() ? ' red' : ''}" data-nxbio="${TBIO.on() ? 'off' : 'on'}">${TBIO.on() ? 'Turn off' : 'Turn on'}</button>` : ''}</div></div>
    ${p ? '<button class="nx-btn soft" data-nxpin="change">Change passcode</button>' : ''}
    <p class="nx-note">Forgot the passcode? Your fingerprint still opens the app. Without both, the only way in is to restore a backup.</p></div>`; };
PUSH.setlock = scSetLock;
{
  const _h = home2Click;
  home2Click = function (b, d) {
    if (d.nxsoon && /Passcode/.test(d.nxsoon)) { T.push.push({ s: 'setlock' }); stepIn(); draw(true); return true; }
    if (d.nxpin === 'on' || d.nxpin === 'change') { setPin((ok) => { draw(); if (ok) toast('Passcode saved'); }); return true; }
    if (d.nxpin === 'off') { localStorage.removeItem(PIN_K); TBIO.off(); draw(); toast('Passcode off'); return true; }
    if (d.nxbio === 'on') { TBIO.setup().then(() => { draw(); toast('Fingerprint or face is on'); }).catch(() => toast('This phone could not set it up')); return true; }
    if (d.nxbio === 'off') { TBIO.off(); draw(); toast('Fingerprint or face is off'); return true; }
    return _h(b, d);
  };
}
// the Settings row opens this page now (it said "Soon")
{ const _s = PUSH.set2; PUSH.set2 = (f) => _s(f).replace(/data-nxsoon="Passcode and fingerprint come in the real build"([\s\S]*?)<em>Soon<\/em>/, `data-nxsoon="Passcode"$1<em>${pinGet() ? (TBIO.on() ? 'On + finger' : 'On') : 'Off'}</em>`); }
// lock when the app opens and after a minute away
tLock();
{ let away = 0; document.addEventListener('visibilitychange', () => { if (document.hidden) away = Date.now(); else if (away && Date.now() - away > 60000) tLock(); }); }
