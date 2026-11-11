'use strict';
/* 8 Nov PREVIEW (questionnaire): each week has its own picture, no picture repeats inside a level (used by ffWeekIcon in ffwk.js).
   11 Nov: the topic lists moved here from ffunits.js (the rest of that file was never shown); the Units page is built once in ffwk.js. */
const TOPIC_EMO = [[/starter|my family|^family|family$/i, '👨‍👩‍👧'], [/australia|where.*from|countr/i, '🌏'], [/weekend/i, '🚴'], [/my things|new things|backpack/i, '🎒'], [/beach|fun at/i, '🏖️'], [/monkey|naughty/i, '🐒'],
  [/jim.s day|daily|routine|habit|what time/i, '⏰'], [/places to go|places|town|city/i, '🗺️'], [/melon|like a|food|milkshake|restaurant|cook/i, '🍉'], [/fastest|animal|zoo|pet/i, '🐆'], [/park|garden|nature/i, '🌳'], [/museum|history/i, '🏛️'],
  [/clever baby|baby|grew|young/i, '👶'], [/egypt/i, '🏺'], [/good day|feel|health|body|lifestyle/i, '😊'], [/holiday|travel|trip|plane|tourism|flight/i, '✈️'], [/united kingdom|culture|britain|london/i, '🇬🇧'], [/transport|bus|train|car/i, '🚌'],
  [/school|class|study|education|university|learn/i, '🏫'], [/fiction|story|fairy|trojan/i, '📖'], [/concert|music|song|band/i, '🎤'], [/dinosaur|fossil/i, '🦖'], [/jacket|wearing|clothes|fashion/i, '🧥'], [/roundabout|direction|road/i, '🚦'], [/bed|sleep|home|house/i, '🛏️'],
  [/will it|future|predict|plan/i, '🔮'], [/sport|play after|game|football/i, '⚽'], [/present|buy|shop|money|gift/i, '🎁'], [/work|job|career|office/i, '💼'], [/hot today|weather|season|sun/i, '☀️'], [/happy|angry|emotion/i, '😄'], [/bike|ride/i, '🚲'],
  [/english|speaking|talk|fluency|conversation/i, '🗣️'], [/carnival|festival|party|celebrat/i, '🎭'], [/murphy|grammar/i, '📘'], [/book day|reading|article|extensive/i, '📚'], [/tech|computer|phone|internet|digital/i, '💻'], [/environment|green|climate/i, '🌱'], [/science|experiment/i, '🔬'],
  [/art|paint|design|creative/i, '🎨'], [/friend|people|relationship|social/i, '👫'], [/listening|podcast/i, '🎧'], [/writing|essay|letter/i, '✍️'], [/ielts|exam|test|mock|final/i, '🎯']];
const ICON_EMO = { Globe: '🌍', Gamepad2: '🎮', Smartphone: '📱', Sun: '☀️', PawPrint: '🐾', Clock: '⏰', Map: '🗺️', ShoppingBag: '🛍️', Mountain: '⛰️', Leaf: '🍃', Landmark: '🏛️', Users: '👨‍👩‍👧', BookOpen: '📖', School: '🏫', Plane: '✈️', Trophy: '🏆',
  UtensilsCrossed: '🍽️', PartyPopper: '🎉', Hammer: '🔨', Clapperboard: '🎬', Recycle: '♻️', HeartPulse: '❤️', CalendarClock: '📅', GraduationCap: '🎓' };
const EMO_FALLBACK = ['📘', '⭐', '🎈', '🧩', '🎨', '🎵', '🌟', '🧠', '💡', '🎯', '🗂️', '📝', '🔤', '🌈', '🪁'];
function uniqueEmoji(units) {
  const used = new Set(), out = {};
  units.forEach((u) => {
    if (u.final) { out[u.n] = '🏆'; used.add('🏆'); return; }
    const real = u.lessons.filter((l) => !/^(Review|Reading|Culture|Final)/i.test(l.subtopic)), cands = [];
    [...real.map((l) => l.subtopic), u.title + ' ' + u.lessons.map((l) => l.subtopic).join(' ')].forEach((t) => TOPIC_EMO.forEach(([re, e]) => { if (re.test(t) && !cands.includes(e)) cands.push(e); }));
    if (ICON_EMO[u.icon]) cands.push(ICON_EMO[u.icon]);
    const pick = cands.find((e) => !used.has(e)) || EMO_FALLBACK.find((e) => !used.has(e)) || '📘';
    used.add(pick); out[u.n] = pick;
  });
  return out;
}
