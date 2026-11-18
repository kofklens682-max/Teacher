'use strict';
/* NEXT (16 Nov, user): Teacher joins the online account of Budget and Notes (account.js, the same file in all three apps).
   - One sign-in for Teacher, Budget and Notes. They live on the same site, so signing in in one signs in the others.
   - Teacher's data (groups, students, payments, plans, notes) is locked on the phone and saved online a few seconds after every
     change, plus one copy a day kept for 7 days (Settings → Account → Last 7 days).
   - Your own added lesson files (PDFs, pictures) stay on this phone: the online copy is the data only.
   Loaded after store.js / app.js / next.js; final.js puts the Account row into Settings. */

// ---------- what Teacher saves online, and putting a copy back ----------
const acTeacherSum = (d) => { const gs = (d && d.groups) || []; const n = gs.reduce((a, g) => a + ((g.students || []).length), 0); return `${gs.length} group${gs.length === 1 ? '' : 's'}, ${n} student${n === 1 ? '' : 's'}`; };
let acWhich = null; // the "which copy stays?" question waits here
const acWhen = (ms) => { const d = new Date(ms); return `${DAYS_LONG[wd(d)]} ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
Acct.use({
  key: 'teacher',
  wait: 3000,
  collect: async () => { const d = JSON.parse(JSON.stringify(S)); delete d.rev; return { v: 1, data: d }; },
  isEmpty: () => !S.groups.length,
  summary: (o) => acTeacherSum(o && o.data),
  localSummary: () => acTeacherSum(S),
  askWhich: ({ onlineAt, online, phone }) => new Promise((resolve) => { acWhich = resolve; openSheet({ s: 'acct', mode: 'which', onlineAt, online, phone }); }),
  async apply(obj, why) {
    await replaceAll(obj.data, why === 'day' ? 'Before bringing back a daily copy' : why === 'newer' ? 'Before the copy from your other phone' : 'Before bringing back the online copy');
    if (T.sheet && T.sheet.s === 'acct') closeSheetNow();
    draw();
    toast(why === 'newer' ? 'Brought in the newer copy from your other phone' : why === 'day' ? 'That day is back ✓' : why === 'chosen' ? 'Using the online copy' : 'Everything is back ✓');
  },
  onStatus: () => { document.querySelectorAll('.ac-status').forEach((el) => { el.innerHTML = acStatus(); }); },
  onSignedOut: () => { toast('You were signed out of your account'); if (T.sheet && T.sheet.s === 'acct') draw(); },
});
// every change on this phone goes online a few seconds later
{ const _save = save; save = function () { const r = _save.apply(this, arguments); try { Acct.changed(); } catch (e) { /* not signed in */ } return r; }; }
// a phone that is already signed in (in Budget, or before) checks for a newer copy when the app opens
setTimeout(() => { if (Acct.signedIn()) Acct.sync(); }, 1500);

function acAgo(ms) { const m = Math.round((Date.now() - ms) / 60e3); return m < 1 ? 'just now' : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} days ago`; }
function acStatus() {
  const s = Acct.status();
  if (s.status === 'busy') return 'Saving…';
  if (s.status === 'down') return esc(s.msg || 'Bringing your data back…');
  if (s.status === 'offline') return 'Waiting for internet · it saves by itself';
  if (s.status === 'error') return `<span style="color:#FF3B30">Not saved: ${esc(s.msg)}</span>`;
  if (s.dirty) return 'Saving in a moment…';
  if (s.status === 'ok') return `<span style="color:#248A3D">✓ Saved online · ${acAgo(s.at)}</span>`;
  return 'Checking…';
}
// the Settings row (final.js puts it in "Account and safety")
const acRow = () => Acct.signedIn()
  ? `<button class="nx-row" data-sheet="acct"><span class="nx-tile" style="--c:#34C759">${ic('ShieldCheck')}</span><span class="nx-tx"><b>${esc(Acct.user())}</b><small class="ac-status">${acStatus()}</small></span>${chev()}</button>`
  : `<button class="nx-row" data-sheet="acct" data-mode="new"><span class="nx-tile" style="--c:#007AFF">${ic('ShieldCheck')}</span><span class="nx-tx"><b>Save online</b><small>One sign-in for Teacher, Budget and Notes</small></span>${chev()}</button>`;

// ---------- the account pop-up ----------
const acField = (id, label, type, value, ph) => `<label class="tp-f"><span>${label}</span><input id="${id}" type="${type || 'text'}" value="${esc(value || '')}" placeholder="${esc(ph || '')}" autocomplete="off" autocapitalize="none" spellcheck="false"></label>`;
function sheetAcct(s) {
  const m = s.mode || (Acct.signedIn() ? 'home' : 'new');
  const head = (t, left) => `<div class="tp-sh-h">${left || '<button class="tp-back" data-closesheet>Cancel</button>'}<b>${t}</b><span></span></div>`;
  const err = `<p class="ac-err">${esc(s.err || '')}</p>`;
  const go = (label) => `<button class="tp-cta" data-acgo ${s.busy ? 'disabled' : ''}>${s.busy ? 'Please wait…' : label}</button>`;
  if (m === 'which') return `${head('Which copy stays?', '<span></span>')}
    <p class="tp-small" style="text-align:left">This phone already has Teacher data, and there is an online copy too.</p>
    <div class="nx-list"><button class="nx-row" data-acwhich="online"><span class="nx-tile" style="--c:#34C759">${ic('Download')}</span><span class="nx-tx"><b>Use the online copy</b><small>Saved ${acWhen(s.onlineAt)} · ${esc(s.online)}</small></span></button>
      <button class="nx-row" data-acwhich="phone"><span class="nx-tile" style="--c:#007AFF">${ic('Smartphone')}</span><span class="nx-tx"><b>Keep this phone’s</b><small>${esc(s.phone)}</small></span></button></div>
    <p class="tp-small" style="text-align:left">The other one is kept in Settings → Backup → Automatic copies.</p>`;
  if (m === 'code') return `${head('Your recovery code', '<span></span>')}
    <div class="ac-hero">${ic('ShieldCheck')}<p>If you ever forget your password, this code is the only way back in. Keep it somewhere safe, for example in Telegram “Saved Messages”.</p></div>
    <div class="ac-code">${esc(s.code || '')}</div>
    <button class="tp-cta" data-accopy>${ic('Share2')} Send it to Telegram…</button><button class="tp-cta ghost" data-acdone>I’ve saved it</button>`;
  if (m === 'home') {
    return `${head(esc(Acct.user()), '<button class="tp-back" data-closesheet>Done</button>')}
      <div class="nx-list"><div class="nx-row still"><span class="nx-tile" style="--c:#34C759">${ic('ShieldCheck')}</span><span class="nx-tx"><b>Online copy</b><small class="ac-status">${acStatus()}</small></span></div>
        <button class="nx-row" data-acnow><span class="nx-tile" style="--c:#34C759">${ic('RotateCcw')}</span><span class="nx-tx"><b>Save now</b></span></button>
        <button class="nx-row" data-acdays><span class="nx-tile" style="--c:#007AFF">${ic('CalendarDays')}</span><span class="nx-tx"><b>Last 7 days</b><small>One copy a day · bring back any day</small></span>${chev()}</button></div>
      <p class="tp-small" style="text-align:left">Teacher, Budget and Notes use this account. Everything is locked on the phone before it is sent, so nobody can read it online. Your own lesson files stay on this phone.</p>
      <div class="nx-list"><button class="nx-row" data-acout><span class="nx-tx"><b class="red">Sign out on this phone</b><small>Your data stays on the phone and online</small></span></button></div>`;
  }
  if (m === 'days') {
    const list = s.list;
    return `${head('Last 7 days', '<button class="tp-back" data-acmode="home">' + ic('ChevronLeft') + ' Back</button>')}
      <p class="tp-small" style="text-align:left">One copy is saved online each day. Tap a day to bring Teacher back to how it was then. What is on the phone now is kept first.</p>
      ${!list ? '<p class="tp-small">Loading…</p>' : list.err ? '<p class="tp-small" style="color:#FF3B30">Could not load them. Check the internet and try again.</p>'
        : list.length ? `<div class="nx-list">${list.map((d) => `<button class="nx-row" data-acday="${d.slot}"><span class="nx-tile" style="--c:#007AFF">${ic('CalendarDays')}</span><span class="nx-tx"><b>${acWhen(d.at).split(',')[0]}</b><small>Saved at ${acWhen(d.at).split(', ')[1]}</small></span>${s.pick === d.slot ? '<em class="ac-ask">Tap again to bring it back</em>' : chev()}</button>`).join('')}</div>`
        : '<p class="tp-small">No daily copies yet. The first one is saved today.</p>'}`;
  }
  if (m === 'recover') return `${head('Forgot password', '<button class="tp-back" data-acmode="signin">' + ic('ChevronLeft') + ' Back</button>')}
    <p class="tp-small" style="text-align:left">Type your name and the recovery code you saved when you made the account, then choose a new password.</p>
    ${acField('ac-user', 'Name', 'text', s.user || '', 'e.g. kofklens')}${acField('ac-code', 'Recovery code', 'text', '', 'XXXX-XXXX-…')}${acField('ac-pw', 'New password', 'password')}${acField('ac-pw2', 'New password again', 'password')}${err}${go('Open my account')}`;
  const isNew = m === 'new';
  return `${head(isNew ? 'Save online' : 'Sign in')}
    <div class="ac-hero">${ic('ShieldCheck')}<p>${isNew ? 'One account for Teacher, Budget and Notes. A new phone gets everything back.' : 'Welcome back. Sign in with the name and password you use in Budget.'}</p></div>
    <div class="nx-seg"><button class="${isNew ? 'on' : ''}" data-acmode="new">Create account</button><button class="${isNew ? '' : 'on'}" data-acmode="signin">I have one</button></div>
    ${acField('ac-user', 'Name', 'text', s.user || '', 'e.g. kofklens')}${acField('ac-pw', 'Password', 'password')}${isNew ? acField('ac-pw2', 'Password again', 'password') : ''}${err}
    ${go(isNew ? 'Create account' : 'Sign in')}
    ${isNew ? '<p class="tp-small" style="text-align:left">Your data is locked with this password on the phone before it is sent. At least 8 characters.</p>' : '<button class="tp-cta ghost" data-acmode="recover">Forgot password?</button>'}`;
}
SHEETS.acct = (s) => sheetAcct(s);

// ---------- taps ----------
{
  const _h = home2Click;
  const val = (id) => { const i = document.getElementById(id); return i ? i.value : ''; };
  const keepUser = () => { const u = document.getElementById('ac-user'); if (u && T.sheet) T.sheet.user = u.value; };
  async function loadDays() { const sh = T.sheet; try { sh.list = await Acct.days(); } catch (e) { sh.list = { err: 1 }; } if (T.sheet === sh) draw(); }
  home2Click = function (b, d) {
    if (!T.sheet || T.sheet.s !== 'acct') {
      if (d.sheet === 'acct' && d.mode) { openSheet({ s: 'acct', mode: d.mode }); return true; }
      return _h(b, d);
    }
    const s = T.sheet;
    if (d.acmode) { keepUser(); s.mode = d.acmode; s.err = ''; s.pick = null; if (d.acmode === 'days') { s.list = null; loadDays(); } draw(); return true; }
    if (d.acdays !== undefined) { s.mode = 'days'; s.list = null; draw(); loadDays(); return true; }
    if (d.acnow !== undefined) { Acct.sync(); toast('Saving online…'); return true; }
    if (d.acout !== undefined) { if (!confirmTwice(b, 'Tap again to sign out')) return true; Acct.signOut().then(() => { closeSheetNow(); draw(); toast('Signed out on this phone'); }); return true; }
    if (d.acwhich) { const r = acWhich; acWhich = null; closeSheetNow(); if (r) r(d.acwhich); return true; }
    if (d.acday !== undefined) {
      if (s.pick !== +d.acday) { s.pick = +d.acday; draw(); return true; } // the first tap asks, the second brings it back
      s.pick = null; toast('Bringing that day back…'); Acct.restoreDay(+d.acday).catch((e) => toast(e.message || 'That didn’t work. Try again.')); return true;
    }
    if (d.acdone !== undefined) { closeSheetNow(); toast('Saved online ✓'); return true; }
    if (d.accopy !== undefined) { const t = `My recovery code for Teacher, Budget and Notes: ${s.code}`; if (navigator.share) navigator.share({ text: t }).catch(() => {}); else if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('Copied')); return true; }
    if (d.acgo !== undefined) {
      if (s.busy) return true;
      const m = s.mode || (Acct.signedIn() ? 'home' : 'new'), user = val('ac-user'), pw = val('ac-pw'), pw2 = val('ac-pw2');
      s.user = user;
      if ((m === 'new' || m === 'recover') && pw !== pw2) { s.err = 'The two passwords are different.'; draw(); return true; }
      s.busy = true; s.err = ''; draw();
      const done = (e) => { s.busy = false; if (e) s.err = e.message || 'That didn’t work. Try again.'; if (T.sheet === s) draw(); };
      (async () => {
        try {
          if (m === 'new') { s.code = await Acct.signUp(user, pw); s.mode = 'code'; done(); Acct.sync(); }
          else if (m === 'signin') { await Acct.signIn(user, pw); done(); closeSheetNow(); toast('Signed in · bringing your data…'); Acct.sync(); }
          else if (m === 'recover') { await Acct.recover(user, val('ac-code'), pw); done(); closeSheetNow(); toast('You’re back in · new password saved'); Acct.sync(); }
        } catch (e) { done(e); }
      })();
      return true;
    }
    return _h(b, d);
  };
}

// Settings → "Account and safety": the real Account row instead of "Soon"
{ const _s = PUSH.set2; PUSH.set2 = (f) => _s(f).replace(/<button class="nx-row" data-nxsoon="Signing in comes with the online copy">[\s\S]*?<\/button>/, () => acRow()); }

// Settings → Backup: the "Daily online copy … Soon" row opens the account pop-up (signed in: the Last 7 days list; not yet: create/sign in)
{ const _s2 = PUSH.set2; PUSH.set2 = (f) => _s2(f).replace(/<button class="nx-row" data-nxsoon="The daily online copy comes with the account">[\s\S]*?<\/button>/, () => `<button class="nx-row" data-sheet="acct"${Acct.signedIn() ? '' : ' data-mode="new"'}><span class="nx-tile" style="--c:#30B0C7">${ic('ShieldCheck')}</span><span class="nx-tx"><b>Daily online copy</b><small>${Acct.signedIn() ? 'Last 7 days · tap to open' : 'Back on a new phone with one sign-in'}</small></span>${chev()}</button>`); }
