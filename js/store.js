'use strict';
/* Saving. Everything stays on this phone; nothing is sent anywhere.
   - localStorage "teacher-app-v1" is the quick copy the app opens from.
   - IndexedDB "teacher-app" holds a second copy (written a moment after every change), automatic copies
     (one a day, kept two weeks, plus the first copy of each month for a year, plus one just before a
     backup is restored) and the files you attach (PDF books, audio).
   - Every save has a number (S.rev); at start the newer of the two copies wins.
   Budget and Notes live on the same site: they use "budget-…" / "notes-…" names, so nothing here touches them. */

const KEY = 'teacher-app-v1', DBN = 'teacher-app', COPY_DAYS = 14, COPY_MONTHS = 12;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const blank = () => ({ v: 1, rev: 0, groups: [], rec: {}, hw: {}, saved: {}, taught: {}, edits: {}, links: {}, audio: {}, files: {}, mats: {}, ownDone: {}, created: Date.now() });
let S = blank(), topRev = 0, quickFailed = false;

function normalize(d) {
  const out = Object.assign(blank(), d && typeof d === 'object' ? d : {});
  for (const k of ['rec', 'hw', 'saved', 'taught', 'edits', 'links', 'audio', 'files', 'mats', 'ownDone']) if (!out[k] || typeof out[k] !== 'object' || Array.isArray(out[k])) out[k] = {};
  if (!Array.isArray(out.groups)) out.groups = [];
  out.groups = out.groups.filter((g) => g && typeof g === 'object').map((g) => ({
    id: String(g.id || uid()), name: String(g.name || 'Group'), lvl: String(g.lvl || 'A1'), book: String(g.book || ''),
    days: Array.isArray(g.days) ? g.days.map(Number).filter((x) => x >= 0 && x <= 6) : [],
    time: /^\d\d:\d\d$/.test(g.time) ? g.time : '15:00', week: Math.max(1, +g.week || 1), les: Math.min(3, Math.max(1, +g.les || 1)),
    students: (Array.isArray(g.students) ? g.students : []).map((s) => (typeof s === 'string' ? { id: uid(), name: s } : { id: String(s.id || uid()), name: String(s.name || '') })).filter((s) => s.name),
    color: String(g.color || ''), gone: Array.isArray(g.gone) ? g.gone : [], created: g.created || Date.now(),
  }));
  out.rev = +out.rev || 0;
  return out;
}

// ---------- IndexedDB ----------
let dbP = null;
function db() {
  if (dbP) return dbP;
  dbP = new Promise((resolve, reject) => {
    let r;
    try { r = indexedDB.open(DBN, 1); } catch (e) { reject(e); return; }
    r.onupgradeneeded = () => { for (const s of ['data', 'copies', 'info', 'files']) if (!r.result.objectStoreNames.contains(s)) r.result.createObjectStore(s); };
    r.onsuccess = () => { const d = r.result; d.onversionchange = () => { d.close(); dbP = null; }; d.onclose = () => { dbP = null; }; resolve(d); };
    r.onerror = () => { dbP = null; reject(r.error); };
    r.onblocked = () => { dbP = null; reject(new Error('Storage is busy')); };
  });
  return dbP;
}
async function tx(names, mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction(names, mode), req = fn(names.map((n) => t.objectStore(n)));
    let out;
    if (req) req.onsuccess = () => { out = req.result; };
    t.oncomplete = () => resolve(out);
    t.onerror = t.onabort = () => reject(t.error || new Error('Storage error'));
  });
}
const idbGet = (store, key) => tx([store], 'readonly', ([s]) => s.get(key));
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);

// ---------- saving ----------
let gate = Promise.resolve(), next = null, timer = 0;
function save() {
  S.rev = topRev = Math.max(topRev, S.rev) + 1;
  const json = JSON.stringify(S);
  try { localStorage.setItem(KEY, json); quickFailed = false; } catch (e) { quickFailed = true; }
  next = { rev: S.rev, json };
  clearTimeout(timer);
  timer = setTimeout(writeSecond, quickFailed ? 0 : 400);
}
async function writeSecond() {
  clearTimeout(timer); timer = 0;
  await gate.catch(() => {});
  const k = next; if (!k) return; next = null;
  try {
    await tx(['data'], 'readwrite', ([s]) => s.put({ rev: k.rev, at: Date.now(), json: k.json }, 'main'));
    if (quickFailed) { try { localStorage.removeItem(KEY); } catch (e) { /* nothing to remove */ } }
  } catch (e) { if (quickFailed) toast('Could not save on this phone. Free up some space.'); }
}
// leaving the app: write the second copy at once
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && next) writeSecond(); });
window.addEventListener('pagehide', () => { if (next) writeSecond(); });

// ---------- start ----------
function loadQuick() {
  try { const raw = localStorage.getItem(KEY); if (raw) { S = normalize(JSON.parse(raw)); topRev = S.rev; return true; } } catch (e) { /* damaged: the second copy decides */ }
  return false;
}
// Resolves true when the second copy was newer and has been taken.
function startSecond(hadQuick) {
  let took = false;
  gate = (async () => {
    let main = null;
    try { main = await withTimeout(idbGet('data', 'main'), 4000); } catch (e) { return; }
    if (main && typeof main.json === 'string' && (+main.rev || 0) > S.rev) {
      try { S = normalize(JSON.parse(main.json)); S.rev = +main.rev; topRev = Math.max(topRev, S.rev); took = true; } catch (e) { /* keep the quick copy */ }
    } else if (!main && hadQuick) next = next || { rev: S.rev, json: JSON.stringify(S) };
  })();
  return gate.then(() => {
    if (took) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* the second copy still has it */ } }
    else if (next && !timer) timer = setTimeout(writeSecond, 400);
    return took;
  });
}

// ---------- automatic copies ----------
const isoNow = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const hasData = () => S.groups.length > 0 || Object.keys(S.edits).length > 0;
async function makeCopy(why, note = '') {
  if (!hasData()) return;
  const day = isoNow(), t = new Date(), key = why === 'day' ? day : `${day}T${String(t.getHours()).padStart(2, '0')}${String(t.getMinutes()).padStart(2, '0')}${String(t.getSeconds()).padStart(2, '0')}`;
  try {
    await gate;
    const info = { at: Date.now(), why, note, groups: S.groups.length, students: S.groups.reduce((a, g) => a + g.students.length, 0) }, json = JSON.stringify(S);
    await tx(['copies', 'info'], 'readwrite', ([c, i]) => {
      if (why === 'day') { const r = i.get(key); r.onsuccess = () => { if (!r.result) { c.put(json, key); i.put(info, key); } }; return null; }
      c.put(json, key); i.put(info, key); return null;
    });
    const keys = (await tx(['info'], 'readonly', ([s]) => s.getAllKeys())).map(String).sort();
    const recent = new Date(Date.now() - COPY_DAYS * 864e5).toISOString().slice(0, 10), d0 = new Date(); d0.setMonth(d0.getMonth() - COPY_MONTHS);
    const oldest = d0.toISOString().slice(0, 7), months = new Set(), drop = [];
    for (const k of keys) { if (k.slice(0, 10) >= recent) continue; const m = k.slice(0, 7); if (k.length === 10 && m >= oldest && !months.has(m)) { months.add(m); continue; } drop.push(k); }
    if (drop.length) await tx(['copies', 'info'], 'readwrite', ([c, i]) => { drop.forEach((k) => { c.delete(k); i.delete(k); }); return null; });
  } catch (e) { /* no IndexedDB: the quick copy and backup files still work */ }
}
async function copyList() {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction('info', 'readonly'), s = t.objectStore('info'); let keys = [], vals = [];
    s.getAllKeys().onsuccess = (e) => { keys = e.target.result; };
    s.getAll().onsuccess = (e) => { vals = e.target.result; };
    t.oncomplete = () => resolve(keys.map((k, i) => ({ key: String(k), ...vals[i] })).sort((a, b) => b.at - a.at));
    t.onerror = t.onabort = () => reject(t.error || new Error('Storage error'));
  });
}
const copyJson = (key) => idbGet('copies', key);

// Replace everything (a backup file or an automatic copy); a copy of what was there is kept first.
async function replaceAll(data, note) {
  const d = normalize(data);
  await makeCopy('before', note);
  d.rev = Math.max(topRev, S.rev) + 1;
  S = d; topRev = d.rev;
  save();
}

// ---------- attached files (PDF books, audio) ----------
const putFile = (key, blob) => tx(['files'], 'readwrite', ([s]) => s.put(blob, key));
const getFile = (key) => idbGet('files', key);
const delFile = (key) => tx(['files'], 'readwrite', ([s]) => s.delete(key));
