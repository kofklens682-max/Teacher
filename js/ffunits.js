'use strict';
/* 8 Nov PREVIEW: Units redesigned. Every level has its own color; a swipeable row of level cards; a "where you are" card in the level's color;
   the weeks as a roadmap with topic pictures that move gently. Loaded after ffpolish.js. */
const LVC = { A1: ['#2FB45A', '#0E8F55'], A2: ['#2FA8F0', '#0A6FE0'], B1: ['#14B8A6', '#0B7F8E'], 'B1+': ['#2F7DE1', '#1B4FB8'], B2: ['#4C5FD5', '#1E2A78'], I1: ['#FF8A1F', '#D9480F'], I2: ['#E5484D', '#A61E2B'], IT: ['#4B5563', '#111827'],
  RU: ['#EF5B3C', '#B8321A'], K2: ['#FFB020', '#E8770E'], K3: ['#2D8CFF', '#0A58CA'], K4: ['#2FBF71', '#0E8F4F'], K5: ['#5B6CE0', '#2B2F9E'], own: ['#F5B300', '#E8770E'] };
Object.assign(GRAD, LVC); // the whole app now takes its level colors from here: no pink, no lilac
const LVE = { A1: '🌱', A2: '🍀', B1: '🧭', 'B1+': '🚀', B2: '🏔️', I1: '🎯', I2: '🏆', IT: '⚡', RU: '🎈', K2: '🐣', K3: '🦊', K4: '🦖', K5: '🚀', own: '📘' };
const shortLv = (l) => String(l.name).replace('Family and Friends', 'FF').replace('Pre-Intermediate', 'Pre-Int').replace('Upper-Intermediate', 'Upper-Int').replace('Intermediate', 'Inter');
/* what a week is about: a picture people understand at once */
const TOPIC_EMO = [[/starter|my family|^family|family$/i, '👨‍👩‍👧'], [/australia|where.*from|countr/i, '🌏'], [/weekend/i, '🚴'], [/my things|new things|backpack/i, '🎒'], [/beach|fun at/i, '🏖️'], [/monkey|naughty/i, '🐒'],
  [/jim.s day|daily|routine|habit|what time/i, '⏰'], [/places to go|places|town|city/i, '🗺️'], [/melon|like a|food|milkshake|restaurant|cook/i, '🍉'], [/fastest|animal|zoo|pet/i, '🐆'], [/park|garden|nature/i, '🌳'], [/museum|history/i, '🏛️'],
  [/clever baby|baby|grew|young/i, '👶'], [/egypt/i, '🏺'], [/good day|feel|health|body|lifestyle/i, '😊'], [/holiday|travel|trip|plane|tourism|flight/i, '✈️'], [/united kingdom|culture|britain|london/i, '🇬🇧'], [/transport|bus|train|car/i, '🚌'],
  [/school|class|study|education|university|learn/i, '🏫'], [/fiction|story|fairy|trojan/i, '📖'], [/concert|music|song|band/i, '🎤'], [/dinosaur|fossil/i, '🦖'], [/jacket|wearing|clothes|fashion/i, '🧥'], [/roundabout|direction|road/i, '🚦'], [/bed|sleep|home|house/i, '🛏️'],
  [/will it|future|predict|plan/i, '🔮'], [/sport|play after|game|football/i, '⚽'], [/present|buy|shop|money|gift/i, '🎁'], [/work|job|career|office/i, '💼'], [/hot today|weather|season|sun/i, '☀️'], [/happy|angry|emotion/i, '😄'], [/bike|ride/i, '🚲'],
  [/english|speaking|talk|fluency|conversation/i, '🗣️'], [/carnival|festival|party|celebrat/i, '🎭'], [/murphy|grammar/i, '📘'], [/book day|reading|article|extensive/i, '📚'], [/tech|computer|phone|internet|digital/i, '💻'], [/environment|green|climate/i, '🌱'], [/science|experiment/i, '🔬'],
  [/art|paint|design|creative/i, '🎨'], [/friend|people|relationship|social/i, '👫'], [/listening|podcast/i, '🎧'], [/writing|essay|letter/i, '✍️'], [/ielts|exam|test|mock|final/i, '🎯']];
const ICON_EMO = { Globe: '🌍', Gamepad2: '🎮', Smartphone: '📱', Sun: '☀️', PawPrint: '🐾', Clock: '⏰', Map: '🗺️', ShoppingBag: '🛍️', Mountain: '⛰️', Leaf: '🍃', Landmark: '🏛️', Users: '👨‍👩‍👧', BookOpen: '📖', School: '🏫', Plane: '✈️', Trophy: '🏆',
  UtensilsCrossed: '🍽️', PartyPopper: '🎉', Hammer: '🔨', Clapperboard: '🎬', Recycle: '♻️', HeartPulse: '❤️', CalendarClock: '📅', GraduationCap: '🎓' };
function weekEmoji(u) {
  const real = u.lessons.filter((l) => !/^(Review|Reading|Culture|Final)/i.test(l.subtopic));
  for (const l of real) { const t = l.subtopic.replace(/^(Unit \d+[AB]?|Starter) · /i, '$1 · '); for (const [re, e] of TOPIC_EMO) if (re.test(t)) return e; }
  const all = u.title + ' ' + u.lessons.map((l) => l.subtopic).join(' ');
  for (const [re, e] of TOPIC_EMO) if (re.test(all)) return e;
  return ICON_EMO[u.icon] || '📘';
}
function ffUnits() {
  const kids = T.aud === 'kids' && KIDLV.length, L = lv(kids ? T.kidLvl : T.unitLvl), here = S.groups.filter((g) => g.lvl === L.id), list = kids ? KIDLV : UNIT_LV(), [c1, c2] = GRAD[L.id] || GRAD.own;
  const aud = KIDLV.length ? `<div class="tp-seg2 slide" data-noswipe style="--n:2"><span class="seg-thumb" style="--i:${kids ? 1 : 0}"></span><button class="${kids ? '' : 'on'}" data-aud="teens">${ic('GraduationCap')} Teens</button><button class="${kids ? 'on' : ''}" data-aud="kids">${ic('Star')} Kids</button></div>` : '';
  const cards = list.map((l) => { const gs = S.groups.filter((g) => g.lvl === l.id), [a, b] = GRAD[l.id] || GRAD.own, attr = kids ? `data-kidlvl="${l.id}"` : `data-unitlvl="${l.id}"`;
    return `<button class="lvc ${l.id === L.id ? 'on' : ''}" style="--c1:${a};--c2:${b}" ${attr}><span class="lvc-e">${LVE[l.id] || '📘'}</span><b>${esc(shortLv(l))}</b><span>${gs.length ? esc(gs.map((g) => g.name).join(' · ')) : planned(l.id) ? 'no group yet' : 'planned'}</span></button>`; }).join('');
  const g0 = [...here].sort((a, b) => a.name.localeCompare(b.name))[0], cur = g0 && planned(L.id) ? weekOf(L.id, g0.week) : null;
  const wkN = planned(L.id) ? L.units.filter((u) => !u.final).length : 0, doneW = g0 ? Math.min(wkN, g0.week - 1) : 0, RAD = 26, RL = 2 * Math.PI * RAD;
  const hero = `<div class="lvh h-in" style="--c1:${c1};--c2:${c2}"><div class="lvh-top"><span>${esc(L.cefr || '')}${L.cefr ? ' · ' : ''}${L.weeks} weeks</span>${here.length ? `<em>${esc(here.map((g) => g.name).join(', '))}</em>` : ''}</div>
    ${cur ? `<div class="lvh-main"><div><b>${esc(shortLv(L))} · Week ${g0.week}</b><span>${here.length > 1 ? esc(g0.name) + ' · ' : ''}Next: ${dayWord(L.id)} ${g0.les} · ${esc((cur.lessons[g0.les - 1] || cur.lessons[0]).subtopic.replace(/^(Unit \d+[AB]?|Starter|Review \d|Reading \d) · /i, ''))}</span></div>
      <div class="lvh-ring"><svg viewBox="0 0 60 60"><circle class="bg" cx="30" cy="30" r="${RAD}"/><circle class="fg" cx="30" cy="30" r="${RAD}" style="stroke-dasharray:${RL.toFixed(1)};stroke-dashoffset:${(RL * (1 - (wkN ? doneW / wkN : 0))).toFixed(1)}"/></svg><b>${doneW}/${wkN}</b></div></div>
      <div class="hn-btns"><button ${openLessonAttr(g0)}>${ic('BookOpen')}Continue</button><button data-push="register" data-g="${g0.id}">${ic('ClipboardCheck')}Attendance</button></div>`
      : `<div class="lvh-main"><div><b>${esc(LVNAME(L.id))}</b><span>${planned(L.id) ? esc(L.focus || '') + (planned(L.id) ? ' · no group at this level yet' : '') : 'Planned next'}</span></div><span class="lvh-big">${LVE[L.id] || '📘'}</span></div>`}</div>`;
  const state = (u) => (!g0 || u.final ? '' : u.n < g0.week ? 'done' : u.n === g0.week ? 'now' : '');
  const road = !planned(L.id) ? `<div class="tp-empty2">${ic('Hammer')}<b>${esc(LVNAME(L.id))} comes next</b><span>The course is planned one level at a time; the IELTS levels are next.</span></div>`
    : `<div class="tp-sec"><h4>Roadmap</h4><span>${wkN} weeks</span></div><div class="rm-list" style="--c1:${c1};--c2:${c2}">${L.units.map((u, i) => { const st = state(u), grp = here.filter((g) => g.week === u.n).map((g) => g.name), codes = u.lessons.map((l) => l.subtopic.split(' · ')[0]).join(' · ');
      const topicOf = (l) => { const p = l.subtopic.split(' · '); return /^Review/i.test(p[0]) ? p[0] : /^Reading/i.test(p[0]) ? 'Reading: ' + (p[1] || '') : p.length > 1 ? p.slice(1).join(' · ') : p[0]; };
      const topics = [...new Set(u.lessons.map(topicOf).filter(Boolean))].join(' · '), title = kids && !L.weekTitles ? (topics || u.title) : u.title, sub = kids && !L.weekTitles ? codes : u.lessons.map((l) => esc(l.subtopic)).join(' · ');
      const dots = st === 'now' ? `<span class="rm-d">${u.lessons.map((l) => `<i class="${l.n < g0.les ? 'd' : l.n === g0.les ? 'n' : ''}"><b>${dayWord(L.id)} ${l.n}</b></i>`).join('')}</span>` : '';
      return `<div class="rm ${st}" style="--i:${i}"><span class="rm-n"><i>${st === 'done' ? ic('Check') : u.final ? ic('Trophy') : u.n}</i></span>
        <button class="rm-c" data-push="week" data-lvl="${L.id}" data-w="${u.n}"><span class="rm-e" style="--k:${(i * 0.37).toFixed(2)}s">${u.final ? '🏆' : weekEmoji(u)}</span><span class="tx"><span class="k">${u.final ? 'One lesson' : 'Week ' + u.n}${st === 'done' ? ' · done' : st === 'now' ? ' · now' : ''}</span><b>${esc(title)}${grp.length ? `<em class="rm-here">${esc(grp.join(', '))}</em>` : ''}</b><span>${sub}</span>${dots}</span><span class="rm-ch">${ic('ChevronRight')}</span></button></div>`; }).join('')}</div>`;
  return `<div class="tp-hdr"><div><div class="tp-eyebrow">${kids ? 'Kids course' : 'Teen course'}</div><div class="tp-lt">Units</div></div><div class="hdr-btns">${lightsHtml('tabs')}</div></div>
    ${aud}<div class="lvc-row" data-noswipe>${cards}</div>${hero}${road}`;
}
PAGES[1] = ffUnits;
