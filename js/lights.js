'use strict';
/* The three dots (3 Nov 2026) + the file viewer.
   Three small iPhone-style dots in a capsule: on Home, on every screen on top and inside an open file. What each dot does, and how the
   dots look (icons or plain colour dots), is set in Profile and settings → Three dots. Standard: blue = lesson files (you pick the
   group first), green = attendance, orange = the Budget app.
   Files (PDF) open inside the app (pdf.js, kept offline in media\pdfjs), so the dots stay on top of them. */
const BUDGET_URL = 'https://kofklens682-max.github.io/Budget/';
const PV = { el: null, ctx: null, doc: null, zoom: 1, lib: null, seq: 0, thumbs: {} };

const DOT_KEY = 'teacher-dots';
const ACTIONS = { files: ['FileText', 'Lesson files (choose a group)'], att: ['ClipboardCheck', 'Attendance of this group'], atttab: ['ClipboardCheck', 'Attendance tab'], budget: ['Wallet', 'Budget app'],
  plan: ['BookOpen', 'Lesson plan of this group'], students: ['Users', 'Students of this group'], nextfile: ['ChevronRight', 'Next file of the lesson'], prevfile: ['ChevronLeft', 'Previous file of the lesson'],
  group: ['Plus', 'New group'], pay: ['Wallet', 'Mark who paid'], extra: ['Package', 'Extra charge'], units: ['BookOpen', 'Units tab'], home: ['House', 'Home tab'], books: ['Library', 'Books tab'],
  settings: ['UserRound', 'Profile and settings'], arrange: ['Sliders', 'Arrange Home'], share: ['Share2', 'Share this file'], top: ['ArrowUp', 'Scroll to the top'], close: ['X', 'Close / go back'] };
// 4 Nov 2026 (user): a dot means a JOB, not one file name. Each level calls its files differently (kids: Vocabulary and speaking /
// Grammar explained; teens: Reading / Lesson), so a dot opens the first file of its job that the lesson has.
const ROLE = { q: ['q', 'y', 'r'], y: ['y', 'q', 'r'], r: ['r', 'y', 'q'], e: ['e', 'l'], l: ['l', 'e'], z: ['z', 'x', 'is', 'iw'], x: ['x', 'z', 'is', 'iw'], m: ['m', 'x'] };
const ROLE_NAME = { q: 'Vocabulary (words and reading)', y: 'Vocabulary (words and reading)', r: 'Reading / vocabulary', e: 'Lesson (grammar explained)', l: 'Lesson (grammar explained)', z: 'Big screen slides, else Exercises', x: 'Exercises', m: 'Murphy explained, else Exercises' };
PK_KINDS.forEach(([k, name]) => { ACTIONS['k:' + k] = ['FileText', 'File: ' + (ROLE_NAME[k] || name)]; }); // one action per kind of file: Vocabulary and speaking, Grammar explained, Murphy explained, Big screen slides ...
ACTIONS.none = ['X', 'Nothing (hide this dot)'];
const DOT_DEFAULT = { blurAmt: 30, style: 'icons', budget: 'app', home: ['files', 'atttab', 'budget'], tabs: ['files', 'atttab', 'budget'], inside: ['files', 'att', 'budget'], file: ['k:q', 'k:e', 'k:z'] };
const DOT_WHERE = [['home', 'On Home'], ['tabs', 'On Units, Attendance and Books'], ['inside', 'Inside a lesson or a group'], ['file', 'Inside a file']];
const DOT_CLS = ['blue', 'grn', 'org'], DOT_NAMES = ['Blue', 'Green', 'Orange'];
function dotsGet() {
  let v = {}; try { v = JSON.parse(localStorage.getItem(DOT_KEY) || '{}') || {}; } catch (e) { /* standard */ }
  const ok = (a, d) => (Array.isArray(a) && a.length === 3 && a.every((x) => ACTIONS[x]) ? a : d);
  return { blurAmt: v.blur === false ? 0 : Number.isFinite(v.blurAmt) ? Math.max(0, Math.min(100, v.blurAmt)) : DOT_DEFAULT.blurAmt, style: v.style === 'plain' ? 'plain' : 'icons', budget: v.budget === 'web' ? 'web' : 'app', home: ok(v.home, DOT_DEFAULT.home), tabs: ok(v.tabs, DOT_DEFAULT.tabs), inside: ok(v.inside, DOT_DEFAULT.inside), file: ok(v.file, DOT_DEFAULT.file) };
}
const dotsSet = (c) => { try { localStorage.setItem(DOT_KEY, JSON.stringify(c)); } catch (e) { /* not saved */ } };
const lightsHtml = (where = 'home') => {
  const c = dotsGet(), b = c[where].map((a, i) => (a === 'none' ? '' : `<button class="lt ${DOT_CLS[i]}" data-light="${a}" aria-label="${ACTIONS[a][1]}">${c.style === 'icons' ? ic(ACTIONS[a][0]) : ''}</button>`)).join('');
  return b ? `<div class="tp-lights ${c.style}" role="group" aria-label="Shortcuts">${b}</div>` : '';
};
// every screen on top gets the dots in its bar (between Back and Edit)
const withLights = (html) => html.replace(/(<div class="tp-pushbar">(?:(?!<\/div>)[\s\S])*?)(<\/div>)/, '$1' + lightsHtml('inside') + '$2');
function dotsSettingsHtml() {
  const c = dotsGet(), opts = (cur) => Object.keys(ACTIONS).map((k) => `<option value="${k}"${k === cur ? ' selected' : ''}>${ACTIONS[k][1]}</option>`).join('');
  const rows = (where, label) => `<div class="tp-f"><span>${label}</span>${c[where].map((a, i) => `<label class="dt-row"><i class="dt-sw ${DOT_CLS[i]}"></i><select data-dotsel="${where}|${i}" aria-label="${label}: ${DOT_NAMES[i]} dot">${opts(a)}</select></label>`).join('')}</div>`;
  return `<div class="tp-card2"><div class="h">${ic('Sliders')}Three dots</div>
    <div class="tp-f"><span>Look</span><div class="tp-chips2 dr-fill"><button class="${c.style === 'icons' ? 'on' : ''}" data-dotstyle="icons">With icons</button><button class="${c.style === 'plain' ? 'on' : ''}" data-dotstyle="plain">Plain dots</button></div></div>
    ${DOT_WHERE.map(([w, l]) => rows(w, l)).join('')}
    <div class="tp-f"><span>Budget</span><div class="tp-chips2 dr-fill"><button class="${c.budget === 'app' ? 'on' : ''}" data-dotbud="app">Open the app</button><button class="${c.budget === 'web' ? 'on' : ''}" data-dotbud="web">Open in browser</button></div></div>
    <div class="tp-f"><span>Swipe effect between tabs: <b data-dotamtv>${c.blurAmt ? c.blurAmt + '%' : 'Off'}</b></span><input class="dt-range" type="range" min="0" max="100" step="5" value="${c.blurAmt}" data-dotamt aria-label="Swipe effect strength"><div class="dt-scale"><span>Off</span><span>Soft</span><span>Strong</span></div></div>
    <button class="tp-dashed" data-dotreset>Back to the standard dots</button></div>`;
}

const packKeyOf = (g) => (g && PACKS[`${String(g.lvl).toLowerCase()}-w${g.week}-l${g.les}`] ? `${String(g.lvl).toLowerCase()}-w${g.week}-l${g.les}` : null);
function lightCtx() { // the group the dots are about right now (on a screen or in a file); on Home there is none
  if (PV.el && PV.ctx) return PV.ctx;
  const top = T.push[T.push.length - 1], g = top && top.g && gById(top.g);
  return { gid: g ? g.id : null, key: top && top.s === 'lesson' && top.lvl ? `${String(top.lvl).toLowerCase()}-w${top.w}-l${top.l}` : packKeyOf(g) };
}
const lessonTitle = (key) => { const m = /^(\w+)-w(\d+)-l(\d+)$/.exec(key || ''); if (!m) return 'Lesson files'; try { const id = m[1].toUpperCase(), u = weekOf(id, +m[2]), l = u.lessons[+m[3] - 1]; return `${LVNAME(id)} · W${m[2]} L${m[3]} · ${l.subtopic}`; } catch (e) { return 'Lesson files'; } };
const fileKinds = (key) => (PACKS[key] ? PK_KINDS.filter(([k]) => PACKS[key][k]) : []);
const planScreen = (g) => (g.lvl === 'own' ? { s: 'own', g: g.id } : planned(g.lvl) ? { s: 'lesson', lvl: g.lvl, w: g.week, l: g.les, g: g.id } : { s: 'register', g: g.id });

// step 1: which group? (the group you are in comes first, then today's groups in time order, then the others)
function sheetPkGroups(s = {}) {
  const cur = lightCtx().gid, today = (g) => hasLesson(g, TODAY), kn = s.kind && PK_KINDS.find((x) => x[0] === s.kind);
  const order = [...S.groups].sort((a, b) => (b.id === cur) - (a.id === cur) || today(b) - today(a) || startMin(a, TODAY) - startMin(b, TODAY) || a.name.localeCompare(b.name));
  const rows = order.map((g) => { const key = packKeyOf(g), n = fileKinds(key).length;
    return `<button class="tp-lrow pv-row" data-pkgroup="${g.id}"><span class="pv-ic" style="background:${hc(g)}22;color:${hc(g)}">${ic('Users')}</span><span class="tx"><b>${esc(g.name)}${g.id === cur ? ' <em class="pv-now">here</em>' : ''}</b><span>${today(g) ? esc(timeOn(g, TODAY)) + ' · ' : ''}${planned(g.lvl) ? `Week ${g.week} · ${dayWord(g.lvl)} ${g.les}` : esc(LVNAME(g.lvl))}${n ? ` · ${n} file${n === 1 ? '' : 's'}` : ''}</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button>`; }).join('');
  return `<div class="tp-sh-h"><span></span><b>Which group?</b><button class="tp-back strong" data-closesheet>Done</button></div><p class="tp-small" style="text-align:left">${kn ? 'Choose a group: its ' + esc(kn[1]) + ' opens.' : 'Choose a group to see the files of its current lesson.'}</p>${rows || '<p class="tp-small">No groups yet.</p>'}`;
}
// step 2: that group's lesson: the lesson plan and its files
function sheetPkFiles(s) {
  const key = s.key, g = s.gid && gById(s.gid), P = PACKS[key] || {}, rows = fileKinds(key).map(([k, name, sub]) => {
    const pdf = !/\.html$/.test(P[k][0]), cur = PV.el && PV.ctx && PV.ctx.key === key && PV.ctx.kind === k;
    return pdf ? `<button class="tp-lrow pv-row${cur ? ' cur' : ''}" data-pvopen="${key}|${k}" data-pvg="${s.gid || ''}"><span class="pv-ic">${ic('FileText')}</span><span class="tx"><b>${name}</b><span>${sub} · ${packSize(P[k][1])}</span></span><span class="tp-chev">${ic(cur ? 'Check' : 'ChevronRight')}</span></button>`
      : `<a class="tp-lrow pv-row" href="media/packs/${P[k][0]}" target="_blank" rel="noopener"><span class="pv-ic">${ic('FileText')}</span><span class="tx"><b>${name}</b><span>${sub} · ${packSize(P[k][1])}</span></span><span class="tp-chev">${ic('ChevronRight')}</span></a>`;
  }).join('');
  const plan = g ? `<button class="tp-lrow pv-row" data-pkplan="${g.id}"><span class="pv-ic">${ic('BookOpen')}</span><span class="tx"><b>Open the lesson plan</b><span>${esc(g.name)} · today's lesson</span></span><span class="tp-chev">${ic('ChevronRight')}</span></button>` : '';
  return `<div class="tp-sh-h">${g ? `<button class="tp-back" data-pkback>${ic('ChevronLeft')} Groups</button>` : '<span></span>'}<b>${g ? esc(g.name) : 'Lesson files'}</b><button class="tp-back strong" data-closesheet>Done</button></div><p class="tp-small" style="text-align:left">${esc(lessonTitle(key))}</p>${plan}${rows || '<p class="tp-small">No files for this lesson.</p>'}`;
}

function openBudget() { // Android: an "intent" link asks the phone to open the address with the app that owns it (the installed Budget app); the browser address is the fallback
  const web = dotsGet().budget === 'web', u = new URL(BUDGET_URL);
  if (!web && /Android/i.test(navigator.userAgent)) { location.href = `intent://${u.host}${u.pathname}#Intent;scheme=https;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(BUDGET_URL)};end`; return; }
  window.open(BUDGET_URL, '_blank', 'noopener');
}
function leaveViewer() { const had = T.push.length; if (PV.el) { pvClose(); if (!had) unwind(); } } // the file's history step goes with it
const tabGo = (i) => { leaveViewer(); goTab(i); };
function fileGo(kind, c) { // open one kind of file of the lesson the dots are about; no group on this screen: ask which group
  const P0 = c.key && PACKS[c.key]; if (P0 && !P0[kind]) kind = (ROLE[kind] || []).find((k) => P0[k]) || kind; // the same job under this level's name
  const P = c.key && PACKS[c.key], kn = PK_KINDS.find((x) => x[0] === kind);
  if (!c.key) return c.gid ? toast('No files for this lesson') : S.groups.length === 1 ? fileGo(kind, { gid: S.groups[0].id, key: packKeyOf(S.groups[0]) }) : openSheet({ s: 'pkgroups', kind });
  if (!P || !P[kind]) return toast('No ' + kn[1].toLowerCase() + ' for this lesson');
  if (/\.html$/.test(P[kind][0])) return void window.open('media/packs/' + P[kind][0], '_blank');
  pvOpen(c.key + '|' + kind, kn[1] + ' · ' + lessonTitle(c.key), c.gid);
}
function stepFile(dir) {
  const c = lightCtx(); if (!c.key) return openSheet({ s: 'pkgroups' });
  const ks = fileKinds(c.key).map((x) => x[0]).filter((k) => !/\.html$/.test(PACKS[c.key][k][0])); if (!ks.length) return toast('No files for this lesson');
  const at = ks.indexOf(c.kind); fileGo(ks[(at < 0 ? (dir > 0 ? 0 : ks.length - 1) : (at + dir + ks.length) % ks.length)], c);
}
function lightGo(what) {
  const c = lightCtx();
  if (what.startsWith('k:')) return fileGo(what.slice(2), c);
  switch (what) {
    case 'files': if (S.groups.length === 1) { const g = S.groups[0]; return openSheet({ s: 'pkfiles', key: packKeyOf(g), gid: g.id }); } return openSheet({ s: 'pkgroups' });
    case 'nextfile': return stepFile(1);
    case 'prevfile': return stepFile(-1);
    case 'budget': return openBudget();
    case 'att': case 'plan': case 'students': {
      const g = c.gid && gById(c.gid), inViewer = !!PV.el; if (!g) return what === 'att' ? tabGo(2) : openSheet({ s: 'pkgroups' });
      const sc = what === 'att' ? { s: 'register', g: g.id, date: hasLesson(g, TODAY) ? iso(TODAY) : undefined } : what === 'plan' ? planScreen(g) : { s: 'group', g: g.id };
      if (inViewer) { pvClose(); T.push.push(sc); return draw(true); } // the file's own history step now belongs to that screen
      return pushScreen(sc);
    }
    case 'atttab': return tabGo(2);
    case 'units': return tabGo(1);
    case 'home': return tabGo(0);
    case 'books': return tabGo(3);
    case 'group': return openSheet({ s: 'group' });
    case 'pay': return openSheet({ s: 'paypick' });
    case 'extra': return openSheet({ s: 'extra' });
    case 'settings': return openSheet({ s: 'settings' });
    case 'arrange': return openSheet({ s: 'homecfg' });
    case 'share': if (PV.ctx && PV.ctx.kind) return packShare(PV.ctx.key + '|' + PV.ctx.kind, PV.el.querySelector('.pv-t').textContent); return toast('Open a file first');
    case 'top': if (PV.el) { PV.el.querySelector('.pv-scroll').scrollTo({ top: 0, behavior: 'smooth' }); return; } return void R.pages[T.tab].scrollTo({ top: 0, behavior: 'smooth' });
    case 'close': return goBack();
  }
}

/* ---------- the file viewer ---------- */
function pvLib() {
  if (PV.lib) return PV.lib;
  return (PV.lib = new Promise((ok, no) => {
    const s = document.createElement('script'); s.src = 'media/pdfjs/pdf.min.js';
    s.onload = () => { pdfjsLib.GlobalWorkerOptions.workerSrc = 'media/pdfjs/pdf.worker.min.js'; ok(pdfjsLib); };
    s.onerror = () => { PV.lib = null; no(new Error('lib')); }; document.head.appendChild(s);
  }));
}
/* 7 Nov 2026 (user: black screen after opening files a few times, only a phone restart fixes it). ROOT CAUSE: every opened file made a new PDF reader
   thread (Worker) + parsed file + fonts and NEVER let them go, so after a few files the phone ran out of memory. Rules now (Tests\pdf-viewer-repeat.js checks them):
   - ONE reader thread (PV.worker), shared by all files; it is stopped 20 s after the last file closes (pvWorkerStop), so memory goes fully back.
   - every opened file keeps its loading task (PV.task) and pvRelease() destroys it when the file closes, when another file replaces it, or when an opening is abandoned.
   - the small first-page copies (PV.thumbs) are tiny (about 0.7 MB) and at most 10 are kept. */
/* 7 Nov 2026, second round (user: still a black screen, even Chrome's own pages went black until a phone restart; pictures in PDFs lag).
   ROOT CAUSE 2: the PDF reader (pdf.js 3.11) drew every picture and every see-through layer of a page on its OWN temporary drawing surfaces,
   and those were graphics-card surfaces (26 of 29 while one file was open), made and thrown away on every page draw; its reader thread also
   turned pictures into graphics-card bitmaps. That churn is what corrupts the phone's graphics memory (neon-green blocks, then black everywhere).
   Now: EVERY surface the reader makes comes from PvCanvasFactory = ordinary memory (willReadFrequently), the reader thread never makes
   graphics-card bitmaps (isOffscreenCanvasSupported: false), and a picture can never be huge (maxImageSize). Tests\pdf-viewer-repeat.js counts them. */
class PvCanvasFactory {
  create(w, h) { if (w <= 0 || h <= 0) throw new Error('Invalid canvas size'); const c = document.createElement('canvas'); c.width = w; c.height = h; return { canvas: c, context: c.getContext('2d', { willReadFrequently: true }) }; }
  reset(cc, w, h) { if (!cc.canvas) throw new Error('Canvas is not specified'); if (w <= 0 || h <= 0) throw new Error('Invalid canvas size'); cc.canvas.width = w; cc.canvas.height = h; }
  destroy(cc) { if (!cc.canvas) throw new Error('Canvas is not specified'); cc.canvas.width = 0; cc.canvas.height = 0; cc.canvas = null; cc.context = null; }
}
function pvWorker(lib) {
  clearTimeout(PV.wT); if (!PV.worker || PV.worker.destroyed) PV.worker = new lib.PDFWorker({ name: 'viewer' }); return PV.worker;
}
function pvWorkerStop() { clearTimeout(PV.wT); PV.wT = setTimeout(() => { if (PV.el || PV.task) return; try { if (PV.worker) PV.worker.destroy(); } catch (e) { /* gone */ } PV.worker = null; }, 20000); }
function pvRelease() { // let go of the open file: its pages, fonts and parsed data in the reader thread
  const task = PV.task, sz = PV.sizes; PV.task = null; PV.doc = null;
  if (sz) sz.a.forEach(({ pg }) => { try { pg.cleanup(); } catch (e) { /* in use */ } });
  if (task) { try { task.destroy(); } catch (e) { /* done */ } }
}
/* Safe mode (7 Nov 2026): while a file is open the app writes a mark (tp-pv); a clean close removes it. If the mark is still there when the app
   starts, the app died while a file was open (the phone ran out of memory, or the app was swiped away), so the next 5 files open in LITE mode:
   smaller page pictures and zoom up to 2x. Lite mode counts itself down and switches off. Nothing else changes, nothing to tap. */
const pvLite = (() => { try { if (localStorage.getItem('tp-pv')) { localStorage.removeItem('tp-pv'); localStorage.setItem('tp-pvlite', '5'); } return +localStorage.getItem('tp-pvlite') > 0; } catch (e) { return false; } })();
function pvMark(on) { try { if (on) localStorage.setItem('tp-pv', String(Date.now())); else { localStorage.removeItem('tp-pv'); const n = +localStorage.getItem('tp-pvlite') || 0; if (n > 0) localStorage.setItem('tp-pvlite', String(n - 1)); } } catch (e) { /* no storage */ } }
const pvLimitPx = () => (pvLite && +localStorage.getItem('tp-pvlite') > 0 ? Math.min(PV_MAXPX, 2e6) : PV_MAXPX), pvLimitZoom = () => (pvLite && +localStorage.getItem('tp-pvlite') > 0 ? 2 : PV_MAX);
// leaving the app: let go of every page picture (graphics memory) at once; they are drawn again when you come back
document.addEventListener('visibilitychange', () => {
  if (!PV.el) return;
  if (document.hidden) { pvStopDrawing(); if (PV.pending) PV.pending.clear(); PV.busy = false; PV.el.querySelectorAll('.pv-pg').forEach(pvFree); }
  else { PV.hold = 0; setTimeout(pvSweep, 120); }
});
function pvEnsure(reuseStep) {
  if (PV.el) return;
  const el = document.createElement('div'); el.className = 'pv'; document.documentElement.classList.add('pvopen'); pvMark(true);
  el.innerHTML = `<div class="pv-bar"><button class="pv-x" data-pvclose aria-label="Close file">${ic('X')}</button><b class="pv-t"></b>${lightsHtml('file')}</div><div class="pv-scroll"><div class="pv-pages"></div></div><div class="pv-msg"></div>`;
  root.appendChild(el); PV.el = el; pvTurn(true); if (!reuseStep) stepIn(); void el.offsetHeight; requestAnimationFrame(() => { el.classList.add('show'); lightsPlay(el); });
  clearTimeout(PV.coverT); PV.coverT = setTimeout(() => { if (PV.el === el) document.documentElement.classList.add('pvcover'); }, 560); // once the file covers the screen, the screens under it stop being drawn (style.css html.pvcover)
  pvGestures(el.querySelector('.pv-scroll'), el.querySelector('.pv-pages'));
}
function pvMsg(t) { if (PV.el) { PV.el.querySelector('.pv-msg').textContent = t || ''; PV.el.classList.toggle('msg', !!t); } }
async function pvOpen(ref, title, gid) {
  const [key, kind] = ref.split('|'); if (!PACKS[key] || !PACKS[key][kind]) return;
  const seq = ++PV.seq, name = PACKS[key][kind][0];
  const hadSheet = !!T.sheet, hadViewer = !!PV.el; if (hadSheet) { T.sheet = null; draw(); } // the list closes; its history step is reused (or given back)
  if (hadSheet && hadViewer) { R.skipPop = (R.skipPop || 0) + 1; try { history.back(); } catch (e) { R.skipPop--; } }
  pvRelease(); PV.sizes = null; if (PV.pending) PV.pending.clear(); PV.busy = false; // the file that was open before is let go first
  pvEnsure(hadSheet && !hadViewer); PV.ctx = { key, kind, gid: gid || (lightCtxBase() || {}).gid || null };
  PV.el.querySelector('.pv-t').textContent = title || 'File'; PV.zoom = 1; PV.el.querySelector('.pv-scroll').scrollTop = 0; PV.name = name; pvPlaceholder(name);
  const slow = setTimeout(() => { if (seq === PV.seq && !PV.doc) pvMsg('Opening…'); }, 900); // only when it is really slow
  try {
    const lib = await pvLib(), blob = await packGet(name); if (seq !== PV.seq || !PV.el) { clearTimeout(slow); return; }
    const task = lib.getDocument({ data: await blob.arrayBuffer(), worker: pvWorker(lib), isEvalSupported: false, isOffscreenCanvasSupported: false, canvasFactory: new PvCanvasFactory(), maxImageSize: 16777216 }); PV.task = task;
    const doc = await task.promise;
    clearTimeout(slow); if (seq !== PV.seq || !PV.el) { try { task.destroy(); } catch (e) { /* done */ } if (PV.task === task) PV.task = null; return; } PV.doc = doc; pvMsg(''); await pvLayout();
  } catch (e) { clearTimeout(slow); if (seq === PV.seq) { pvRelease(); pvMsg('Connect to the internet once to get this file'); } }
}
// 6 Nov 2026 (user: "the last frames are reconstructing"): the file used to grow as an empty grey screen and the pages
// appeared only after the zoom. Now the first page is already there while it grows: a white page of the right shape, and
// for a file opened before, a picture of its first page (kept from the last time). The sharp page then simply lies on top.
function pvPlaceholder(name) {
  const wrap = PV.el.querySelector('.pv-pages'), sc = PV.el.querySelector('.pv-scroll'); PV.doc = null;
  const t = PV.thumbs[name], w = Math.max(280, (sc.clientWidth || innerWidth) - 16), r = t ? t.r : 1.4142;
  wrap.querySelectorAll('canvas').forEach((c) => { c.width = c.height = 0; }); wrap.innerHTML = ''; const box = document.createElement('div'); box.className = 'pv-pg'; box.style.width = w + 'px'; box.style.height = Math.round(w * r) + 'px';
  if (t) { const c = document.createElement('canvas'); c.width = t.c.width; c.height = t.c.height; c.getContext('2d', { willReadFrequently: true }).drawImage(t.c, 0, 0); c.className = 'on pv-under'; box.appendChild(c); }
  wrap.appendChild(box);
}
function lightCtxBase() { const keep = PV.ctx; PV.ctx = null; const c = lightCtx(); PV.ctx = keep; return c; }
// Page sizes are remembered, so changing the zoom builds the boxes at once (no waiting).
async function pvLayout() {
  const doc = PV.doc; if (!PV.sizes || PV.sizes.doc !== doc) { const pgs = await Promise.all(Array.from({ length: doc.numPages }, (_, i) => doc.getPage(i + 1))); if (PV.doc !== doc) return; PV.sizes = { doc, a: pgs.map((pg) => { const vp = pg.getViewport({ scale: 1 }); return { pg, r: vp.height / vp.width }; }) }; }
  pvBuild();
}
/* 6 Nov 2026 (user: the PDFs lag, zoom by themselves, and sometimes the screen goes black). Causes found: (1) every page drawn at zoom stayed in
   memory for ever (4x zoom = 36 MB a page, 650 MB for a long file) -> now a page far from the screen is let go and a page never has more than
   PV_MAXPX pixels; (2) all pages were drawn at once on the main thread -> now one at a time, the one nearest the screen first; (3) one finger
   scrolled with our own code (jerky whenever a page was drawing) -> now the phone scrolls natively; (4) a second finger touching the screen
   or a tap that only stopped the glide counted as a pinch / double tap -> now both need a clear gesture. */
/* FILE VIEWER SAFETY RULES (6 Nov 2026): the phone went neon-green and then black when these were broken. Keep them, and run
   Tests\pdf-viewer-guard.js (node pdf-viewer-guard.js http://localhost:5199/) after ANY change here; it must say ALL PASSED before a release.
   1. A page picture is never bigger than PV_MAXPX pixels; zoom never above PV_MAX (3). Pages far from the screen are let go (pvFree, pvSweep).
   2. Page pictures are drawn with willReadFrequently (ordinary memory), never as graphics-card canvases.
   3. One finger scrolls NATIVELY (.pv-scroll touch-action: pan-x pan-y). No own scrolling code, no blocking (non-passive) touchmove listener.
   4. Nothing is drawn while the fingers pinch (PV.pinching) or for a moment after (PV.hold); one page at a time (pvPump).
   5. No overflow:hidden / big border-radius on .pv-pg (a masked layer per page), no permanent will-change on the pages.
   6. A pinch needs a clear change (8%), two taps in one place make a double tap, a tap that only stops a glide does not count. */
const PV_MAXPX = 3.5e6; // 14 MB a page: the phone's graphics memory ran out above this (neon-green blocks, then a black screen)
function pvFree(box) { // let go of a page that is far from the screen (it is drawn again when it comes back)
  if (box._task) { try { box._task.cancel(); } catch (e) { /* done */ } box._task = null; }
  if (PV.pending) PV.pending.delete(box);
  box.querySelectorAll('canvas').forEach((c) => { c.width = c.height = 0; c.remove(); });
  box._done = 0;
  try { if (box._pg) box._pg.cleanup(); } catch (e) { /* in use */ }
}
function pvStopDrawing() { // a pinch needs the main thread: stop the page that is being drawn (it is drawn again after the zoom)
  if (PV.pending) PV.pending.clear(); PV.busy = false;
  if (PV.el) PV.el.querySelectorAll('.pv-pg').forEach((b) => { if (b._task) { try { b._task.cancel(); } catch (e) { /* done */ } b._task = null; } if (!b.querySelector('canvas')) b._done = 0; });
}
function pvSweep() { // after a scroll: pages near the screen get their picture, far ones let go (a backstop in case the observer missed one)
  if (!PV.el || !PV.pending || PV.pinching) return; const sc = PV.el.querySelector('.pv-scroll'), r = sc.getBoundingClientRect(), m = r.height * (PV.zoom > 1.5 ? 0.25 : 1);
  PV.el.querySelectorAll('.pv-pg').forEach((b) => { const q = b.getBoundingClientRect(), near = q.bottom > r.top - m && q.top < r.bottom + m;
    if (near && !b._done) { b._done = 1; PV.pending.add(b); } else if (!near && (b._done || b.querySelector('canvas'))) pvFree(b); });
  pvPump();
}
function pvPump() { // draw the waiting page that is nearest to the middle of the screen, one at a time
  if (PV.busy || PV.pinching || !PV.el || !PV.pending || !PV.pending.size) return;
  const wait = (PV.hold || 0) - performance.now(); if (wait > 0) { clearTimeout(PV.holdT); PV.holdT = setTimeout(pvPump, wait + 10); return; } // quick zooming: draw only when it has settled
  const sc = PV.el.querySelector('.pv-scroll'), r = sc.getBoundingClientRect(), mid = (r.top + r.bottom) / 2; let best = null, bd = 1e9;
  PV.pending.forEach((b) => { if (!b.isConnected) { PV.pending.delete(b); return; } const q = b.getBoundingClientRect(), d = Math.abs((q.top + q.bottom) / 2 - mid); if (d < bd) { bd = d; best = b; } });
  if (!best) return; PV.pending.delete(best); PV.busy = true; pvPage(best);
}
function pvBuild() {
  if (!PV.el || !PV.sizes) return;
  const wrap = PV.el.querySelector('.pv-pages'), sc = PV.el.querySelector('.pv-scroll');
  const w = Math.max(280, (sc.clientWidth - 16) * PV.zoom);
  if (PV.io) PV.io.disconnect();
  if (PV.pending) PV.pending.clear(); PV.pending = new Set();
  PV.io = new IntersectionObserver((es) => { es.forEach((e) => {
    const b = e.target;
    if (e.isIntersecting) { if (!b._done) { b._done = 1; PV.pending.add(b); } } else if (b._done || b.querySelector('canvas')) pvFree(b);
  }); pvPump(); }, { root: sc, rootMargin: PV.zoom > 1.5 ? '25% 0px' : '100% 0px' });
  // 6 Nov 2026 (user: "when I zoom in the PDF it reloads every time"): the pages used to be thrown away and drawn again from
  // white on every zoom. Now the same pages stay: they get the new size at once (the picture already there is stretched to
  // it, a little soft for a moment), and the sharp picture is laid on top when it is ready. Nothing goes white.
  const boxes = [...wrap.children];
  if (boxes.length === PV.sizes.a.length && boxes.every((b, i) => b._pg === PV.sizes.a[i].pg)) {
    boxes.forEach((box, i) => { if (box._task) { try { box._task.cancel(); } catch (e) { /* done */ } box._task = null; } box.style.width = w + 'px'; box.style.height = Math.round(w * PV.sizes.a[i].r) + 'px'; box._w = w; box._done = 0;
      box.querySelectorAll('canvas').forEach((c) => { c.classList.add('on', 'pv-under'); c.classList.remove('pv-top'); c.style.width = ''; c.style.height = ''; }); PV.io.observe(box); });
    return;
  }
  const under = wrap.querySelector('.pv-under'); wrap.innerHTML = '';
  PV.sizes.a.forEach(({ pg, r }, i) => { const box = document.createElement('div'); box.className = 'pv-pg'; box.style.width = w + 'px'; box.style.height = Math.round(w * r) + 'px'; box._pg = pg; box._w = w; if (!i && under && PV.zoom === 1) box.appendChild(under); box._i = i; wrap.appendChild(box); PV.io.observe(box); });
}
function pvPage(box) {
  const vp0 = box._pg.getViewport({ scale: 1 }), cssH = parseFloat(box.style.height) || box._w * 1.4142;
  const dpr = Math.min(window.devicePixelRatio || 1, 3, Math.sqrt(pvLimitPx() / (box._w * cssH))); // never more than PV_MAXPX pixels a page
  const s = (box._w / vp0.width) * dpr, vp = box._pg.getViewport({ scale: s }), c = document.createElement('canvas');
  c.width = Math.floor(vp.width); c.height = Math.floor(vp.height); c.style.width = box._w + 'px'; c.style.height = box.style.height;
  const w0 = box._w, drop = () => { c.width = c.height = 0; };
  const task = box._pg.render({ canvasContext: c.getContext('2d', { willReadFrequently: true }), viewport: vp }); box._task = task;
  task.promise.then(() => { box._task = null; PV.busy = false;
    if (!box.isConnected || box._w !== w0 || !box._done) { drop(); return pvPump(); } // zoomed again or scrolled far away meanwhile: not needed
    const u = [...box.querySelectorAll('.pv-under')]; box.appendChild(c);
    if (u.length) { c.classList.add('pv-top'); requestAnimationFrame(() => requestAnimationFrame(() => c.classList.add('on'))); // the sharp picture fades in over the stretched one: no flash, it just sharpens
      setTimeout(() => { if (c.isConnected) { u.forEach((x) => { x.width = x.height = 0; x.remove(); }); c.classList.remove('pv-top'); } }, 300); } else requestAnimationFrame(() => c.classList.add('on'));
    if (!box._i && PV.zoom === 1 && PV.name) { const k = Math.min(1, 360 / c.width), t = document.createElement('canvas'); t.width = Math.max(1, Math.round(c.width * k)); t.height = Math.max(1, Math.round(c.height * k)); t.getContext('2d', { willReadFrequently: true }).drawImage(c, 0, 0, t.width, t.height);
      const old = PV.thumbs[PV.name]; if (old) old.c.width = old.c.height = 0; PV.thumbs[PV.name] = { c: t, r: c.height / c.width };
      const ks = Object.keys(PV.thumbs); while (ks.length > 10) { const k0 = ks.shift(), o = PV.thumbs[k0]; if (o) o.c.width = o.c.height = 0; delete PV.thumbs[k0]; } } // a SMALL copy (the page itself is let go later); at most 10 are kept
    pvPump(); }).catch(() => { box._task = null; PV.busy = false; drop(); pvPump(); });
}
// Zoom with the fingers: the page follows the pinch smoothly (any size from fit-to-width up to 4x), and is drawn sharp when the fingers lift.
// ONE FINGER SCROLLS NATIVELY (the phone's own smooth scrolling, also while a page is being drawn); only the pinch and the double tap are ours.
// A pinch needs two fingers that really move apart / together (a resting thumb or a palm on the edge does nothing); a double tap needs two quick
// taps in the same place, and a tap that only stopped a gliding page does not count. Ctrl + wheel zooms on a computer.
const PV_MIN = 1, PV_MAX = 3;
function pvGestures(sc, wrap) {
  let g = null, t0 = null, tapAt = 0, tapX = 0, tapY = 0, tapTop = 0, lastScroll = 0;
  const clampZ = (z) => Math.max(PV_MIN, Math.min(PV_MAX, pvLimitZoom(), z));
  const mid = (ts) => ({ x: (ts[0].clientX + ts[1].clientX) / 2, y: (ts[0].clientY + ts[1].clientY) / 2, d: Math.hypot(ts[0].clientX - ts[1].clientX, ts[0].clientY - ts[1].clientY) || 1 });
  const edge = (t) => t.clientX < 14 || t.clientX > innerWidth - 14; // a palm on the screen edge is not a finger
  const commit = (r, fx, fy, ox, oy) => { // r = the zoom change, (fx, fy) = where the fingers are on screen, (ox, oy) = the same point inside the pages
    sc.style.overflow = ''; PV.pinching = false; PV.hold = performance.now() + 140;
    let z = clampZ(PV.zoom * r); if (Math.abs(z - 1) < 0.07) z = 1; const R = z / PV.zoom; PV.zoom = z;
    wrap.style.transition = 'none'; wrap.style.transform = ''; wrap.style.willChange = '';
    pvBuild(); const sr = sc.getBoundingClientRect();
    sc.scrollLeft = 8 + ox * R - (fx - sr.left); sc.scrollTop = 10 + oy * R - (fy - sr.top);
    PV.el.classList.toggle('zoomed', z > 1);
  };
  const zoomAt = (x, y, r, ms) => { // a smooth zoom step (double tap, wheel): the pages scale first, then they are drawn sharp
    const wr = wrap.getBoundingClientRect(), ox = x - wr.left, oy = y - wr.top, z = clampZ(PV.zoom * r), rr = z / PV.zoom;
    wrap.style.transformOrigin = ox + 'px ' + oy + 'px'; wrap.style.willChange = 'transform'; wrap.style.transition = 'transform ' + ms + 'ms cubic-bezier(.32,.72,0,1)'; wrap.style.transform = 'scale(' + rr + ')';
    clearTimeout(wrap._t); wrap._t = setTimeout(() => commit(r, x, y, ox, oy), ms + 20);
  };
  sc.addEventListener('scroll', () => { lastScroll = performance.now(); clearTimeout(sc._sw); sc._sw = setTimeout(pvSweep, 140); }, { passive: true });
  sc.addEventListener('touchstart', (e) => {
    const n = e.touches.length;
    if (n === 1) { const t = e.touches[0]; t0 = { x: t.clientX, y: t.clientY, at: e.timeStamp, moved: 0, gliding: performance.now() - lastScroll < 150 }; g = null; return; }
    t0 = null;
    if (n === 2 && !g && !edge(e.touches[0]) && !edge(e.touches[1])) { const m = mid(e.touches); g = { d0: m.d, on: false, r: 1, fx: m.x, fy: m.y, ox: 0, oy: 0 }; }
  }, { passive: true });
  sc.addEventListener('touchmove', (e) => {
    if (t0 && e.touches.length === 1) { const t = e.touches[0]; t0.moved = Math.max(t0.moved, Math.hypot(t.clientX - t0.x, t.clientY - t0.y)); return; }
    if (!g || e.touches.length < 2) return;
    const m = mid(e.touches);
    if (!g.on) { // wait for a clear pinch (8% change) before taking over; then freeze the native scroll and start from here (no jump)
      if (Math.abs(m.d / g.d0 - 1) < 0.08) return;
      pvStopDrawing(); const wr = wrap.getBoundingClientRect(); g.on = true; PV.pinching = true; g.d0 = m.d; g.ox = m.x - wr.left; g.oy = m.y - wr.top; g.wr = wr;
      sc.style.overflow = 'hidden'; wrap.style.transformOrigin = g.ox + 'px ' + g.oy + 'px'; wrap.style.willChange = 'transform'; wrap.style.transition = 'none';
    }
    g.r = clampZ(PV.zoom * m.d / g.d0) / PV.zoom; g.fx = m.x; g.fy = m.y;
    wrap.style.transform = 'translate3d(' + (m.x - (g.wr.left + g.ox)).toFixed(1) + 'px,' + (m.y - (g.wr.top + g.oy)).toFixed(1) + 'px,0) scale(' + g.r.toFixed(4) + ')';
  }, { passive: true }); // PASSIVE: the phone scrolls without waiting for this code (a blocking touchmove listener makes scrolling lag whenever a page is drawing)
  const end = (e) => {
    if (g) { if (e.touches.length < 2) { const gg = g; g = null; if (gg.on) commit(gg.r, gg.fx, gg.fy, gg.ox, gg.oy); } return; }
    const q = t0; if (e.touches.length) return; t0 = null;
    if (!q || e.type !== 'touchend' || !e.changedTouches.length) return;
    const t = e.changedTouches[0];
    if (q.moved > 10 || e.timeStamp - q.at > 250 || q.gliding) { tapAt = 0; return; } // a drag, a long press, or the tap that stopped a gliding page
    if (tapAt && e.timeStamp - tapAt < 320 && Math.hypot(t.clientX - tapX, t.clientY - tapY) < 40 && Math.abs(sc.scrollTop - tapTop) < 4) { tapAt = 0; zoomAt(t.clientX, t.clientY, PV.zoom > 1.2 ? 1 / PV.zoom : 2.2 / PV.zoom, 320); }
    else { tapAt = e.timeStamp; tapX = t.clientX; tapY = t.clientY; tapTop = sc.scrollTop; }
  };
  sc.addEventListener('touchend', end, { passive: true }); sc.addEventListener('touchcancel', (e) => { if (g && g.on) end(e); else { g = null; t0 = null; sc.style.overflow = ''; } }, { passive: true });
  sc.addEventListener('wheel', (e) => { if (!e.ctrlKey) return; e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01), 90); }, { passive: false });
}
// 6 Nov 2026 (user: "I want to open it horizontally and vertically"): the app stays upright, but while a file is open the phone
// may be turned sideways; the pages then fit the new width (kept on screen, no reload), and closing the file turns it upright.
function pvTurn(free) { try { const o = screen.orientation; if (o && o.lock) o.lock(free ? 'any' : 'portrait-primary').catch(() => {}); } catch (e) { /* this phone cannot */ } }
let pvTurnT = 0, pvLastW = 0;
window.addEventListener('resize', () => { clearTimeout(pvTurnT); pvTurnT = setTimeout(() => { if (!PV.el || !PV.sizes || !PV.doc) return; const sc = PV.el.querySelector('.pv-scroll'); if (sc.clientWidth === pvLastW) return; pvLastW = sc.clientWidth; const top = sc.scrollTop / Math.max(1, sc.scrollHeight); pvBuild(); sc.scrollTop = top * sc.scrollHeight; }, 160); });
function pvClose() {
  const el = PV.el; if (!el) return; PV.el = null; PV.ctx = null; PV.seq++; if (PV.io) PV.io.disconnect(); pvTurn(false); clearTimeout(PV.coverT); document.documentElement.classList.remove('pvopen', 'pvcover'); pvMark(false);
  if (PV.pending) PV.pending.clear(); PV.busy = false; PV.pinching = false;
  el.querySelectorAll('.pv-pg').forEach((b) => { if (b._task) { try { b._task.cancel(); } catch (e) { /* done */ } b._task = null; } b._pg = null; }); // stop drawing; the pictures go when the file slides away
  pvRelease(); PV.sizes = null; pvWorkerStop(); // the file, its fonts and its memory are given back NOW, not kept
  el.classList.remove('show'); el.classList.add('out'); setTimeout(() => { el.querySelectorAll('canvas').forEach((c) => { c.width = c.height = 0; }); el.remove(); }, 480);
}
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[data-pvopen]'); if (a) { e.preventDefault(); return pvOpen(a.dataset.pvopen, a.dataset.pt, a.dataset.pvg); }
  const b = e.target.closest && e.target.closest('button[data-pvopen]'); if (b) { const [k, kind] = b.dataset.pvopen.split('|'); return pvOpen(b.dataset.pvopen, `${PK_KINDS.find((x) => x[0] === kind)[1]} · ${lessonTitle(k)}`, b.dataset.pvg); }
  const c = e.target.closest && e.target.closest('[data-pvclose]'); if (c) return goBack();
  const gp = e.target.closest && e.target.closest('[data-pkgroup]'); if (gp) { const g = gById(gp.dataset.pkgroup), kind = T.sheet && T.sheet.kind; if (kind) { T.sheet = null; draw(); return fileGo(kind, { key: packKeyOf(g), gid: g.id }); } return openSheet({ s: 'pkfiles', key: packKeyOf(g), gid: g.id }); }
  if (e.target.closest && e.target.closest('[data-pkback]')) return openSheet({ s: 'pkgroups' });
  const pl = e.target.closest && e.target.closest('[data-pkplan]'); if (pl) { const g = gById(pl.dataset.pkplan); T.sheet = null; if (PV.el) pvClose(); T.push.push(planScreen(g)); draw(true); return; } // the sheet's (or the file's) history step now belongs to that screen
  const ds = e.target.closest && e.target.closest('[data-dotstyle],[data-dotbud],[data-dotreset]');
  if (ds) { const c = dotsGet(); if (ds.dataset.dotstyle) c.style = ds.dataset.dotstyle; else if (ds.dataset.dotbud) c.budget = ds.dataset.dotbud; else { DOT_WHERE.forEach(([w]) => { c[w] = DOT_DEFAULT[w]; }); c.style = 'icons'; c.budget = 'app'; c.blurAmt = 30; } dotsSet(c); return draw(); }
  const l = e.target.closest && e.target.closest('[data-light]'); if (l) { l.classList.remove('pop'); void l.offsetWidth; l.classList.add('pop'); lightGo(l.dataset.light); }
}, true);
// the files are fetched once and kept: the PDF reader too, so files open without internet
setTimeout(() => idle(() => { fetch('media/pdfjs/pdf.min.js').catch(() => {}); fetch('media/pdfjs/pdf.worker.min.js').catch(() => {}); }), 6000);
document.addEventListener('change', (e) => { const s = e.target.closest && e.target.closest('select[data-dotsel]'); if (!s) return; const [w, i] = s.dataset.dotsel.split('|'), c = dotsGet(); c[w][+i] = s.value; dotsSet(c); draw(); });

/* ---------- the dots appear: the orange one pops, then the capsule stretches to the left and the other dots come out of it together (no bounce) ---------- */
function lightsPlay(el) {
  const d = el && el.querySelector && el.querySelector('.tp-lights'); if (!d) return;
  d.classList.remove('play'); void d.offsetWidth; d.classList.add('play'); clearTimeout(d._t); d._t = setTimeout(() => d.classList.remove('play'), 1100);
}
/* ---------- blur while a finger swipes between the tabs ---------- */
function tabFx(p) { // p = the tab position as a fraction (1.4 = 40% of the way from Units to Attendance); the page you leave softens and slides a little slower, the next one arrives from a blur. Strength 0-100 (Profile and settings): 50 = the standard look
  const amt = dotsGet().blurAmt, k = amt / 50, W = R.vp.offsetWidth;
  R.pages.forEach((pg, i) => {
    const s = i - p, d = Math.min(Math.abs(s), 1), e = d * d * (3 - 2 * d);
    if (!amt || d < 0.002 || d >= 1) { if (pg._fx) { pg.style.filter = ''; pg.style.transform = ''; pg.style.opacity = ''; pg._fx = 0; } return; }
    pg._fx = 1; pg.style.filter = `blur(${(e * 10 * k).toFixed(1)}px)`; pg.style.transform = `translate3d(${((s > 0 ? -1 : 1) * e * W * Math.min(0.2 * k, 0.36)).toFixed(1)}px,0,0) scale(${(1 - e * 0.07 * Math.min(k, 1.6)).toFixed(3)})`; pg.style.opacity = Math.max(0.25, 1 - e * 0.55 * Math.min(k, 1.5)).toFixed(2);
  });
}
function tabFxTo(from, to, ms) { // the same effect while the page settles after the finger lets go
  cancelAnimationFrame(tabFxTo.raf); if (!dotsGet().blurAmt) return tabFx(to);
  const t0 = performance.now(), step = (t) => { const k = Math.min((t - t0) / ms, 1); tabFx(from + (to - from) * (1 - Math.pow(1 - k, 3.5))); if (k < 1) tabFxTo.raf = requestAnimationFrame(step); }; tabFxTo.raf = requestAnimationFrame(step);
}
document.addEventListener('input', (e) => { const s = e.target.closest && e.target.closest('input[data-dotamt]'); if (!s) return; const c = dotsGet(); c.blurAmt = +s.value; dotsSet(c); const v = document.querySelector('[data-dotamtv]'); if (v) v.textContent = c.blurAmt ? c.blurAmt + '%' : 'Off'; });

/* speed: while a page swipes or scrolls, the glass tab bar stops blurring what moves under it (the blur is recomputed every frame) */
let movingT = 0;
function movingFor(ms) { const h = document.documentElement; h.classList.add('moving'); clearTimeout(movingT); movingT = setTimeout(() => h.classList.remove('moving'), ms); }
document.addEventListener('scroll', () => movingFor(160), { capture: true, passive: true });
