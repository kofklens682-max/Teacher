'use strict';
/* Lesson files (made by data\build_packs.py): for each lesson a LESSON file (landscape, explains today's topic: words, grammar,
   examples, speaking, answer key), an EXERCISES file (A4, to print), a HOMEWORK file (A4), the Baamboozle game and the book
   units. "Open" shows a file; "Share" sends the real file through the phone's share sheet (Telegram, Saved Messages, ...)
   without saving it on the phone. Files are fetched when the lesson opens (the service worker keeps them for offline), so a
   tap on Share can start the share sheet at once. */
const PK_KINDS = [['l', 'Lesson', "Explains today's topic · for the laptop"], ['x', 'Exercises', 'To print · A4'], ['h', 'Homework', 'To print · A4']];
const packBlobs = {};
const packHas = (L, u, l) => (typeof PACKS !== 'undefined' && PACKS[`${L.id.toLowerCase()}-w${u.n}-l${l.n}`]) || null;
const packSize = (kb) => (kb >= 1024 ? (kb / 1024).toFixed(1) + ' MB' : kb + ' KB');
function packGet(name) {
  if (!packBlobs[name]) packBlobs[name] = fetch('media/packs/' + name).then((r) => { if (!r.ok) throw new Error('missing'); return r.blob(); }).catch((e) => { delete packBlobs[name]; throw e; });
  return packBlobs[name];
}
function packBlock(L, u, l) {
  const P = packHas(L, u, l); if (!P) return '';
  const key = `${L.id.toLowerCase()}-w${u.n}-l${l.n}`, title = `${LVNAME(L.id)} W${u.n} L${l.n} - ${l.subtopic}`;
  const rows = PK_KINDS.filter(([k]) => P[k]).map(([k, name, sub]) => {
    packGet(P[k][0]).catch(() => {});
    const d = `data-pk="${key}|${k}" data-pt="${esc(title + ' - ' + name)}"`;
    return `<div class="pk-row"><div class="pk-t"><b>${name}</b><span>${sub} · ${packSize(P[k][1])}</span></div><button class="tp-pill" data-packopen="${key}|${k}" ${d}>Open</button><button class="tp-pill" data-packshare="${key}|${k}" ${d}>${ic('Share2')} Share</button></div>`;
  }).join('');
  const games = (P.g || []).map((g) => `<a class="tp-media" href="${esc(safeUrl(g[1]))}" target="_blank" rel="noopener"><span class="mi" style="background:#FF5A5F">${ic('Play')}</span><span class="tx"><b>${esc(g[0])}</b><span>${esc(g[2])}</span></span></a>`).join('');
  return `<div class="tp-card2"><div class="h" style="color:#3D5AFE">${ic('FileText')}Lesson files</div>${rows}</div>`
    + (games ? `<div class="tp-card2 pk-game"><div class="h" style="color:#FF5A5F">${ic('Play')}Game · Baamboozle</div>${games}</div>` : '')
    + (P.b && P.b.length ? `<div class="tp-card2"><div class="h" style="color:#147EFB">${ic('BookOpen')}Books for this lesson</div>${P.b.map((b) => `<p>${esc(b)}</p>`).join('')}</div>` : '');
}
async function packFile(key, kind, title) {
  const name = PACKS[key][kind][0];
  return new File([await packGet(name)], title.replace(/[\\/:*?"<>|]/g, '') + '.pdf', { type: 'application/pdf' });
}
async function packOpen(ref, title) {
  const [key, kind] = ref.split('|');
  let file; try { file = await packFile(key, kind, title); } catch (e) { return toast('Connect to the internet once to get this file'); }
  const url = URL.createObjectURL(file), w = window.open(url, '_blank');
  if (!w) return packShare(ref, title);
  setTimeout(() => URL.revokeObjectURL(url), 60000);
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
