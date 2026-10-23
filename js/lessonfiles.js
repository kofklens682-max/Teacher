'use strict';
/* Lesson files (made by data\build_packs.py): for each lesson a LESSON file (landscape, explains today's topic: words, grammar,
   examples, speaking, answer key), an EXERCISES file (A4, to print), a HOMEWORK file (A4), the Baamboozle game and the book
   units. "Open" shows a file; "Share" sends the real file through the phone's share sheet (Telegram, Saved Messages, ...)
   without saving it on the phone. Files are fetched when the lesson opens (the service worker keeps them for offline), so a
   tap on Share can start the share sheet at once. */
const PK_KINDS = [['y', 'Vocabulary', 'English and Russian · A4'], ['f', 'Flashcards', 'Print on both sides · A4'], ['c', 'Translation check', '12 sentences · answers on page 2'], ['l', 'Lesson', "Explains today's topic · for the laptop"], ['t', 'Written test', 'To print · A4 · written part'], ['k', "Teacher's key and speaking test", 'For you · A4'], ['x', 'Exercises', 'To print · A4'], ['r', 'Reading', 'To print · A4 · a text to read'], ['w', 'Weekly review', 'To print · A4 · this week and the weeks before'], ['h', 'Homework', 'To print · A4']];
const packBlobs = {};
const packHas = (L, u, l) => (typeof PACKS !== 'undefined' && PACKS[`${L.id.toLowerCase()}-w${u.n}-l${l.n}`]) || null;
const packSize = (kb) => (kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB');
function packGet(name) {
  if (!packBlobs[name]) packBlobs[name] = fetch('media/packs/' + name).then((r) => { if (!r.ok) throw new Error('missing'); return r.blob(); }).catch((e) => { delete packBlobs[name]; throw e; });
  return packBlobs[name];
}
const packQueue = [];
function packLater(name) {
  if (packBlobs[name] || packQueue.includes(name)) return;
  packQueue.push(name);
  if (packQueue.length > 1) return;
  const next = () => { const n = packQueue[0]; if (!n) return; packGet(n).catch(() => {}).then(() => { packQueue.shift(); if (packQueue.length) idle(next); }); };
  idle(next);
}
const idle = (f) => ('requestIdleCallback' in window ? requestIdleCallback(f, { timeout: 4000 }) : setTimeout(f, 1500));
function packBlock(L, u, l) {
  const P = packHas(L, u, l); if (!P) return '';
  const key = `${L.id.toLowerCase()}-w${u.n}-l${l.n}`, title = `${LVNAME(L.id)} W${u.n} L${l.n} - ${l.subtopic}`;
  const rows = PK_KINDS.filter(([k]) => P[k]).map(([k, name, sub]) => {
    packLater(P[k][0]);
    const d = `data-pk="${key}|${k}" data-pt="${esc(title + ' - ' + name)}"`;
    return `<div class="pk-row"><div class="pk-t"><b>${name}</b><span>${sub} · ${packSize(P[k][1])}</span></div><a class="tp-pill" href="media/packs/${P[k][0]}" target="_blank" rel="noopener">Open</a><button class="tp-pill" data-packshare="${key}|${k}" ${d}>${ic('Share2')} Share</button></div>`;
  }).join('');
  const games = (P.g || []).map((g) => `<div class="pk-gr"><a class="tp-media" href="${esc(safeUrl(g[1]))}" target="_blank" rel="noopener"><span class="mi" style="background:#FF5A5F">${ic('Play')}</span><span class="tx"><b>${esc(g[0])}</b><span>${esc(g[2])}</span></span></a><button class="tp-pill pk-ic" data-sharelink="${esc(g[1])}" data-pt="${esc(g[0])}" aria-label="Share the link">${ic('Share2')}</button></div>`).join('');
  const vids = (P.v || []).map((g) => `<div class="pk-gr"><a class="tp-media" href="${esc(safeUrl(g[1]))}" target="_blank" rel="noopener"><span class="mi" style="background:#147EFB">${ic('CirclePlay')}</span><span class="tx"><b>${esc(g[0])}</b><span>${esc(g[2])}</span></span></a><button class="tp-pill pk-ic" data-sharelink="${esc(g[1])}" data-pt="${esc(g[0])}" aria-label="Share the link">${ic('Share2')}</button></div>`).join('');
  const all = PK_KINDS.filter(([k]) => P[k]).length > 1 ? `<button class="tp-cta pk-all" data-packshareall="${key}" data-pt="${esc(title)}">${ic('Share2')} Share all ${PK_KINDS.filter(([k]) => P[k]).length}</button>` : '';
  return `<div class="tp-card2"><div class="h" style="color:#3D5AFE">${ic('FileText')}Lesson files</div>${rows}${all}</div>`
    + (vids ? `<div class="tp-card2 pk-game"><div class="h" style="color:#147EFB">${ic('CirclePlay')}Watch and listen</div>${vids}</div>` : '')
    + (games ? `<div class="tp-card2 pk-game"><div class="h" style="color:#FF5A5F">${ic('Play')}Game · Baamboozle</div>${games}</div>` : '')
    + (P.b && P.b.length ? `<div class="tp-card2"><div class="h" style="color:#147EFB">${ic('BookOpen')}Books for this lesson</div>${P.b.map((b) => `<p>${esc(b)}</p>`).join('')}</div>` : '');
}
async function packFile(key, kind, title) {
  const name = PACKS[key][kind][0];
  return new File([await packGet(name)], title.replace(/[\\/:*?"<>|]/g, '') + '.pdf', { type: 'application/pdf' });
}
async function packShare(ref, title) {
  const [key, kind] = ref.split('|');
  let file; try { file = await packFile(key, kind, title); } catch (e) { return toast('Connect to the internet once to get this file'); }
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); } catch (e) { if (e && e.name === 'NotAllowedError') toast('Ready. Tap Share again'); }
    return;
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(file); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); // no file sharing here (a computer): save the file
  setTimeout(() => URL.revokeObjectURL(a.href), 60000); toast('Saved. Find it in your downloads');
}
// Share every file of the lesson in one go (Telegram takes them together); on a computer each file is saved
async function packShareAll(key, title) {
  const files = []; try { for (const [k, name] of PK_KINDS) if (PACKS[key][k]) files.push(await packFile(key, k, `${title} - ${name}`)); } catch (e) { return toast('Connect to the internet once to get these files'); }
  if (navigator.canShare && navigator.canShare({ files })) {
    try { await navigator.share({ files, title }); } catch (e) { if (e && e.name === 'NotAllowedError') toast('Ready. Tap Share again'); }
    return;
  }
  files.forEach((f, i) => setTimeout(() => { const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000); }, i * 400));
  toast('Saved. Find them in your downloads');
}
// Share just the game link (the phone's share sheet, else copy it)
async function shareLink(url, title) {
  if (navigator.share) { try { await navigator.share({ title, url }); } catch (e) { /* closed */ } return; }
  try { await navigator.clipboard.writeText(url); toast('Link copied'); } catch (e) { toast(url); }
}
