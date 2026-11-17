'use strict';
/* 17 Nov 2026 (user, chose option B): a Birthday tile on Home, under a smaller "Owe 2+ months" tile, both in the right column next
   to the tall Paid card. Owe 2+ keeps at least one name (+N more). The Birthday tile shows the nearest birthday in the next 30 days
   (or the nearest at all), how many days are left, whose and when; a tap opens the list of all birthdays. Birthdays = the student's
   Edit > Birthday (day and month only, S.prof[sid].bday = "MM-DD"). Styles: birthday.css. */
(function () {
  if (typeof PUSH === 'undefined' || typeof PAGES === 'undefined') return;
  const WDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON3 = (m) => MONTHS[m].slice(0, 3);
  const day0 = () => { const t = new Date(TODAY); t.setHours(0, 0, 0, 0); return t; };
  function nextOf(md) { // "MM-DD" -> the next date it falls on (today counts); 29 Feb -> 28 Feb in other years
    const t = day0(), [m, d] = String(md).split('-').map(Number); if (!m || !d) return null;
    const at = (y) => { const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; return new Date(y, m - 1, m === 2 && d === 29 && !leap ? 28 : d); };
    let x = at(t.getFullYear()); if (x < t) x = at(t.getFullYear() + 1); return x;
  }
  window.f20Birthdays = function () { // [{ st, g, date, days }] soonest first, one row per person (a merged student counts once)
    const seen = new Set(), out = []; let none = 0;
    S.groups.forEach((g) => (g.students || []).forEach((st) => {
      let key = st.id; try { const C = classesOf(st); if (C && C.all && C.all.length) key = C.all.map((x) => x.st.id).sort()[0]; } catch (e) { /* plain id */ }
      if (seen.has(key)) return; seen.add(key);
      const b = prof(st.id).bday, dt = b && nextOf(b); if (!dt) { none++; return; }
      out.push({ st, g, date: dt, days: Math.round((dt - day0()) / 864e5) });
    }));
    out.sort((a, b) => a.days - b.days || byName(a.st, b.st)); out.none = none; return out;
  };
  const when = (x) => `${WDAY[x.date.getDay()]} ${x.date.getDate()} ${MON3(x.date.getMonth())}`;
  const left = (n) => (n === 0 ? 'Today' : n === 1 ? 'Tomorrow' : `in ${n} days`);
  // A name is never cut or broken inside a word (user, 17 Nov). Beside the number there is room for about 10 letters of a word:
  // a longer word -> a smaller font; longer still -> the name gets its own full-width line above the number.
  const fit = (name) => { const L = Math.max(...String(name).split(/\s+/).map((w) => w.length)); return L <= 9 ? '' : L <= 11 ? ' f20-s12' : L <= 15 ? ' f20-stack' : ' f20-stack f20-s11'; };
  window.f20Fit = fit;
  function tile() {
    const L = f20Birthdays(), soon = L.filter((x) => x.days <= 30), x = L[0];
    if (!x) return `<button class="nx-card f20-bday" data-nxpush="bdays"><div class="nx-ch"><b>${ic('PartyPopper')} Birthday</b></div><span class="f20-none">Add birthdays in each student’s Edit</span></button>`;
    const mo = Math.round(x.days / 30.4); // far away: months, so the number stays narrow and the name fits beside it
    const big = x.days === 0 ? '<b class="big f20-today">Today</b>' : x.days > 99 ? `<b class="big f20-num">${mo}<small>${mo === 1 ? 'month' : 'months'}</small></b>` : `<b class="big f20-num">${x.days}<small>${x.days === 1 ? 'day' : 'days'}</small></b>`;
    const more = soon.length > 1 ? `<small class="f20-more">+${soon.length - 1} more</small>` : '';
    return `<button class="nx-card f20-bday${x.days === 0 ? ' on' : ''}" data-nxpush="bdays"><div class="nx-ch"><b>${ic('PartyPopper')} Birthday</b></div><div class="f20-orow${x.days === 0 ? ' f20-col2' : fit(x.st.name)}">${big}<span class="f20-on"><b>${esc(x.st.name)}</b><small>${when(x)}</small>${more}</span></div></button>`;
  }
  const _home = PAGES[0];
  PAGES[0] = function () {
    const h = _home.apply(this, arguments);
    if (!h.includes('nx-wowe')) return h;
    try {
      const t = document.createElement('template'); t.innerHTML = h; const o = t.content.querySelector('.nx-wowe'); if (!o) return h;
      // Owe 2+: the number and the first name side by side, then "+N more" (the other names are on its own page)
      const nms = [...o.querySelectorAll('.nm:not(.more)')], more = o.querySelector('.nm.more'), big = o.querySelector('.big');
      const extra = Math.max(0, nms.length - 1) + (more ? +((more.textContent.match(/\d+/) || [0])[0]) : 0);
      const row = document.createElement('div'); row.className = 'f20-orow';
      if (big) row.appendChild(big);
      const side = document.createElement('span'); side.className = 'f20-on';
      if (nms[0]) {
        const em = nms[0].querySelector('em'), nm = document.createElement('b'), sm = document.createElement('small');
        nm.textContent = nms[0].firstChild ? nms[0].firstChild.textContent.trim() : nms[0].textContent; sm.textContent = em ? em.textContent + ' unpaid' : ''; side.append(nm, sm);
        row.className += fit(nm.textContent);
      } else { const sm = document.createElement('small'); sm.className = 'ok'; sm.textContent = 'Nobody'; side.append(sm); }
      if (extra) { const m = document.createElement('small'); m.className = 'f20-more'; m.textContent = `+${extra} more`; side.append(m); }
      row.appendChild(side); nms.forEach((x) => x.remove()); if (more) more.remove(); o.appendChild(row); o.classList.add('f20-owe');
      const col = document.createElement('div'); col.className = 'f20-col'; o.replaceWith(col); col.appendChild(o);
      col.insertAdjacentHTML('beforeend', tile());
      return t.innerHTML;
    } catch (e) { return h; }
  };
  PUSH.bdays = function () {
    const L = f20Birthdays(), soon = L.filter((x) => x.days <= 30), later = L.filter((x) => x.days > 30);
    const row = (x) => `<button class="nx-row" data-nxpush="sprof" data-g="${x.g.id}" data-sid="${x.st.id}">${nxAv(x.st)}<span class="nx-tx"><b>${esc(x.st.name)}</b><small>${when(x)} · ${esc(x.g.solo ? 'Individual' : x.g.name)}</small></span><em class="f20-left${x.days === 0 ? ' on' : ''}">${left(x.days)}</em>${chev()}</button>`;
    const sec = (name, rows) => (rows.length ? `<div class="nx-sec">${name}</div><div class="nx-list">${rows.map(row).join('')}</div>` : '');
    return `${backBar('Back', '')}<div class="tp-inner">
      <div class="nx-title">Birthdays</div><p class="nx-sub">${soon.length ? `${soon.length} in the next 30 days` : L.length ? 'None in the next 30 days' : 'No birthdays saved yet'}</p>
      ${sec('Next 30 days', soon)}${sec('Later', later)}
      ${!L.length ? `<div class="tp-empty2">${ic('PartyPopper')}<b>No birthdays yet</b><span>Open a student, tap Edit and fill in Birthday.</span></div>` : ''}
      ${L.none ? `<p class="nx-foot">${L.none} student${L.none === 1 ? ' has' : 's have'} no birthday saved. Open the student, tap Edit, fill in Birthday.</p>` : ''}</div>`;
  };
})();
