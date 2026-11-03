'use strict';
/* The three dots (3 Nov 2026) + the file viewer.
   Three small iPhone-style dots in a capsule: on Home, on every screen on top and inside an open file. What each dot does, and how the
   dots look (icons or plain colour dots), is set in Profile and settings → Three dots. Standard: blue = lesson files (you pick the
   group first), green = attendance, orange = the Budget app.
   Files (PDF) open inside the app (pdf.js, kept offline in media\pdfjs), so the dots stay on top of them. */
const BUDGET_URL = 'https://kofklens682-max.github.io/Budget/';
const PV = { el: null, ctx: null, doc: null, zoom: 1, lib: null, seq: 0 };

const DOT_KEY = 'teacher-dots';
const ACTIONS = { files: ['FileText', 'Lesson files (choose a group)'], att: ['ClipboardCheck', 'Attendance of this group'], atttab: ['ClipboardCheck', 'Attendance tab'], budget: ['Wallet', 'Budget app'],
  plan: ['BookOpen', 'Lesson plan of this group'], students: ['Users', 'Students of this group'], nextfile: ['ChevronRight', 'Next file of the lesson'], prevfile: ['ChevronLeft', 'Previous file of the lesson'],
  group: ['Plus', 'New group'], pay: ['Wallet', 'Mark who paid'], extra: ['Package', 'Extra charge'], units: ['BookOpen', 'Units tab'], home: ['House', 'Home tab'], books: ['Library', 'Books tab'],
  settings: ['UserRound', 'Profile and settings'], arrange: ['Sliders', 'Arrange Home'], share: ['Share2', 'Share this file'], top: ['ArrowUp', 'Scroll to the top'], close: ['X', 'Close / go back'] };
// 4 Nov 2026 (user): a dot means a JOB, not one file name. Each level calls its files differently (kids: Vocabulary and speaking /
// Grammar explained; teens: Reading / Lesson), so a dot opens the first file of its job that the lesson has.
const ROLE = { q: ['q', 'y', 'r'], y: ['y', 'q', 'r'], r: ['r', 'y', 'q'], e: ['e', 'l'], l: ['l', 'e'], z: ['z', 'x'], x: ['x', 'z'], m: ['m', 'x'] };
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
function pvEnsure(reuseStep) {
  if (PV.el) return;
  const el = document.createElement('div'); el.className = 'pv';
  el.innerHTML = `<div class="pv-bar"><button class="pv-x" data-pvclose aria-label="Close file">${ic('X')}</button><b class="pv-t"></b>${lightsHtml('file')}</div><div class="pv-scroll"><div class="pv-pages"></div></div><div class="pv-msg"></div>`;
  root.appendChild(el); PV.el = el; if (!reuseStep) stepIn(); void el.offsetHeight; requestAnimationFrame(() => { el.classList.add('show'); lightsPlay(el); });
  pvGestures(el.querySelector('.pv-scroll'), el.querySelector('.pv-pages'));
}
function pvMsg(t) { if (PV.el) { PV.el.querySelector('.pv-msg').textContent = t || ''; PV.el.classList.toggle('msg', !!t); } }
async function pvOpen(ref, title, gid) {
  const [key, kind] = ref.split('|'); if (!PACKS[key] || !PACKS[key][kind]) return;
  const seq = ++PV.seq, name = PACKS[key][kind][0];
  const hadSheet = !!T.sheet, hadViewer = !!PV.el; if (hadSheet) { T.sheet = null; draw(); } // the list closes; its history step is reused (or given back)
  if (hadSheet && hadViewer) { R.skipPop = (R.skipPop || 0) + 1; try { history.back(); } catch (e) { R.skipPop--; } }
  pvEnsure(hadSheet && !hadViewer); PV.ctx = { key, kind, gid: gid || (lightCtxBase() || {}).gid || null };
  PV.el.querySelector('.pv-t').textContent = title || 'File'; PV.zoom = 1; PV.el.querySelector('.pv-pages').innerHTML = ''; PV.el.querySelector('.pv-scroll').scrollTop = 0; pvMsg('Opening…');
  try {
    const lib = await pvLib(), blob = await packGet(name), doc = await lib.getDocument({ data: await blob.arrayBuffer() }).promise;
    if (seq !== PV.seq || !PV.el) return; PV.doc = doc; pvMsg(''); await pvLayout();
  } catch (e) { if (seq === PV.seq) pvMsg('Connect to the internet once to get this file'); }
}
function lightCtxBase() { const keep = PV.ctx; PV.ctx = null; const c = lightCtx(); PV.ctx = keep; return c; }
// Page sizes are remembered, so changing the zoom builds the boxes at once (no waiting).
async function pvLayout() {
  const doc = PV.doc; if (!PV.sizes || PV.sizes.doc !== doc) { const a = []; for (let i = 1; i <= doc.numPages; i++) { const pg = await doc.getPage(i), vp = pg.getViewport({ scale: 1 }); a.push({ pg, r: vp.height / vp.width }); } if (PV.doc !== doc) return; PV.sizes = { doc, a }; }
  pvBuild();
}
function pvBuild() {
  if (!PV.el || !PV.sizes) return;
  const wrap = PV.el.querySelector('.pv-pages'), sc = PV.el.querySelector('.pv-scroll'); wrap.innerHTML = '';
  const w = Math.max(280, (sc.clientWidth - 16) * PV.zoom), dpr = Math.min(window.devicePixelRatio || 1, 2, 2600 / w); // a page is never drawn wider than ~2600 pixels (memory)
  if (PV.io) PV.io.disconnect();
  PV.io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && !e.target._done) { e.target._done = 1; pvPage(e.target, dpr); } }), { root: sc, rootMargin: PV.zoom > 1.5 ? '40% 0px' : '120% 0px' });
  PV.sizes.a.forEach(({ pg, r }) => { const box = document.createElement('div'); box.className = 'pv-pg'; box.style.width = w + 'px'; box.style.height = Math.round(w * r) + 'px'; box._pg = pg; box._w = w; wrap.appendChild(box); PV.io.observe(box); });
}
function pvPage(box, dpr) {
  const vp0 = box._pg.getViewport({ scale: 1 }), s = (box._w / vp0.width) * dpr, vp = box._pg.getViewport({ scale: s }), c = document.createElement('canvas');
  c.width = Math.floor(vp.width); c.height = Math.floor(vp.height); c.style.width = box._w + 'px'; c.style.height = box.style.height;
  box._pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise.then(() => { if (!box.isConnected) return; box.appendChild(c); requestAnimationFrame(() => c.classList.add('on')); }).catch(() => {});
}
// Zoom with the fingers: the page follows the pinch smoothly (any size from fit-to-width up to 4x), and is drawn sharp when the fingers lift.
// One finger scrolls (with a little glide), a double tap zooms in or back out, Ctrl + wheel zooms on a computer.
const PV_MIN = 1, PV_MAX = 4;
function pvGestures(sc, wrap) {
  const P = new Map(); let g = null, pan = null, tapAt = 0, tapX = 0, tapY = 0, glide = 0;
  const clampZ = (z) => Math.max(PV_MIN, Math.min(PV_MAX, z));
  const mid = () => { const a = [...P.values()]; return { x: (a[0].x + a[1].x) / 2, y: (a[0].y + a[1].y) / 2, d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) || 1 }; };
  const commit = (r, fx, fy, ox, oy) => { // r = the zoom change, (fx, fy) = where the fingers are on screen, (ox, oy) = the same point inside the pages
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
  sc.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    cancelAnimationFrame(glide); P.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { sc.setPointerCapture(e.pointerId); } catch (x) { /* ok */ }
    if (P.size === 2) { const m = mid(), wr = wrap.getBoundingClientRect(); pan = null; g = { d0: m.d, ox: m.x - wr.left, oy: m.y - wr.top, r: 1, fx: m.x, fy: m.y }; wrap.style.transformOrigin = g.ox + 'px ' + g.oy + 'px'; wrap.style.willChange = 'transform'; wrap.style.transition = 'none'; }
    else if (P.size === 1) pan = { x: e.clientX, y: e.clientY, t: e.timeStamp, moved: 0, vx: 0, vy: 0, lt: e.timeStamp };
  });
  sc.addEventListener('pointermove', (e) => {
    const p = P.get(e.pointerId); if (!p) return; const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
    if (g && P.size >= 2) { // pinch: the zoom follows the distance between the fingers, and the point between them stays under them
      const m = mid(); g.r = clampZ(PV.zoom * m.d / g.d0) / PV.zoom; g.fx = m.x; g.fy = m.y;
      const wr0 = wrap._wr || (wrap._wr = wrap.getBoundingClientRect());
      wrap.style.transform = 'translate3d(' + (m.x - (wr0.left + g.ox)).toFixed(1) + 'px,' + (m.y - (wr0.top + g.oy)).toFixed(1) + 'px,0) scale(' + g.r.toFixed(4) + ')'; return;
    }
    if (pan) { pan.moved += Math.abs(dx) + Math.abs(dy); sc.scrollLeft -= dx; sc.scrollTop -= dy; const dt = Math.max(1, e.timeStamp - pan.lt); pan.vx = 0.8 * pan.vx + 0.2 * (-dx / dt); pan.vy = 0.8 * pan.vy + 0.2 * (-dy / dt); pan.lt = e.timeStamp; }
  });
  const up = (e) => {
    if (!P.has(e.pointerId)) return; P.delete(e.pointerId);
    if (g) { if (P.size < 2) { const gg = g; g = null; wrap._wr = null; commit(gg.r, gg.fx, gg.fy, gg.ox, gg.oy); const left = [...P.values()][0]; pan = left ? { x: left.x, y: left.y, t: e.timeStamp, moved: 99, vx: 0, vy: 0, lt: e.timeStamp } : null; } return; }
    if (!pan) return; const q = pan; pan = null;
    if (q.moved < 10 && e.timeStamp - q.t < 300) { // a tap: two taps close together zoom in (or back to fit)
      if (e.timeStamp - tapAt < 320 && Math.hypot(e.clientX - tapX, e.clientY - tapY) < 40) { tapAt = 0; zoomAt(e.clientX, e.clientY, PV.zoom > 1.2 ? 1 / PV.zoom : 2.2 / PV.zoom, 320); } else { tapAt = e.timeStamp; tapX = e.clientX; tapY = e.clientY; }
      return;
    }
    let vx = q.vx, vy = q.vy, last = performance.now(); // a little glide after the finger lifts
    const step = (t) => { const dt = Math.min(t - last, 40); last = t; sc.scrollLeft += vx * dt; sc.scrollTop += vy * dt; const f = Math.pow(0.0025, dt / 1000); vx *= f; vy *= f; if (Math.abs(vx) + Math.abs(vy) > 0.02) glide = requestAnimationFrame(step); };
    if (Math.abs(vx) + Math.abs(vy) > 0.1) glide = requestAnimationFrame(step);
  };
  sc.addEventListener('pointerup', up); sc.addEventListener('pointercancel', up);
  sc.addEventListener('wheel', (e) => { if (!e.ctrlKey) return; e.preventDefault(); zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01), 90); }, { passive: false });
}
function pvClose() {
  const el = PV.el; if (!el) return; PV.el = null; PV.ctx = null; PV.doc = null; PV.seq++; if (PV.io) PV.io.disconnect();
  el.classList.remove('show'); el.classList.add('out'); setTimeout(() => el.remove(), 480);
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
