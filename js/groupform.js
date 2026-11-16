'use strict';
/* NEXT (16 Nov, user: the Edit group pop-up has too much information): only what you need, iPhone style.
   - Program: one row showing the chosen program; tap it to see all of them (and pick another).
   - "They are on": one row "Week 7 · Day 2"; tap it for an iPhone-style list of the weeks and the days (no phone drop-down lists).
   - Time: one time for all days; "Different time on some days" opens the times per day.
   - The long notes are gone. Saving works exactly as before (the hidden fields keep the values). */
{
  const _g = SHEETS.group;
  SHEETS.group = (s) => {
    let h = _g(s); const F = s.form || {}, open = s.nxOpen || '';
    const row = (k, label, value) => `<button class="nx-gfrow${open === k ? ' on' : ''}" data-nxgf="${k}"><span>${label}</span><b>${value}</b>${ic(open === k ? 'ChevronDown' : 'ChevronRight')}</button>`;
    // Program
    h = h.replace(/<div class="tp-f"><span>Program<\/span>(<div class="tp-chips2">[\s\S]*?<\/div>)<\/div>/, (m, chips) => `<div class="nx-gf">${row('prog', 'Program', esc(LVNAME(F.lvl)))}${open === 'prog' ? `<div class="nx-gfin">${chips}</div>` : ''}</div>`);
    // Week and day
    h = h.replace(/<div class="tp-f"><span>They are on<\/span><div class="tp-2col">([\s\S]*?<\/select>[\s\S]*?<\/select>)<\/div><\/div>/, (m, sels) => {
      const L = lv(F.lvl); if (!L || !L.units) return m;
      const u = L.units.find((x) => x.n === +F.week) || L.units[L.units.length - 1], les = F.lvl === 'IT' ? weekOf('IT', F.week).lessons.map((x) => x.n) : [1, 2, 3];
      const val = `${u.final ? 'Level test' : 'Week ' + u.n} · ${dayWord(F.lvl)} ${F.les}`;
      // kids weeks have no title of their own ("Week 1"): show what the week teaches instead
      const wt = (x) => { const t = String(x.title || ''); return /^week \d+$/i.test(t.trim()) || !t ? (x.lessons || []).map((l) => String(l.subtopic || '').replace(/^(Day|Lesson) \d+ · /, '').split(' · ')[0]).filter(Boolean).slice(0, 2).join(' · ') : t; };
      const list = open === 'week' ? `<div class="nx-gfin"><div class="nx-wlist">${L.units.map((x) => `<button class="${x.n === +F.week ? 'on' : ''}" data-nxwk="${x.n}"><span>${x.final ? 'Level test' : 'Week ' + x.n}</span><small>${esc(wt(x))}</small>${x.n === +F.week ? ic('Check') : ''}</button>`).join('')}</div>
        <div class="nx-seg" data-noswipe>${les.map((n) => `<button class="${n === +F.les ? 'on' : ''}" data-nxls="${n}">${dayWord(F.lvl)} ${n}</button>`).join('')}</div></div>` : '';
      return `<div class="nx-gf">${row('week', 'They are on', val)}${list}<div class="nx-hide">${sels}</div></div>`;
    });
    // one time for every day
    // the time: an iPhone-style picker (hours and minutes you tap), not the phone's own clock
    const tm = String(F.time || '15:00'), H = +tm.slice(0, 2), M = +tm.slice(3, 5), p2 = (n) => String(n).padStart(2, '0');
    const wheel = (k, list, cur) => `<div class="nx-wheel">${list.map((v) => `<button class="${v === cur ? 'on' : ''}" data-nxtm="${k}|${v}">${p2(v)}</button>`).join('')}</div>`;
    // 16 Nov: the same iPhone time picker as everywhere else (datepick.js turns this field into a pill with hour/minute wheels)
    h = h.replace('<span>Time · each day can have its own</span><div class="f-times">', `<div class="nx-gf"><label class="nx-gfrow nx-gft"><span>Time</span><input id="nx-tall" type="time" value="${esc(tm)}"></label></div><details class="nx-more2"><summary>Different time on some days</summary><div class="f-times">`);
    h = h.replace(/(<div class="f-times">[\s\S]*?<\/div>)(<\/div>\s*<label class="tp-f"><span>Lesson length)/, '$1</details>$2');
    // no long notes
    h = h.replace(/<div class="tp-note2">Groups, days and times are one list[\s\S]*?<\/div>/, '').replace(/<div class="tp-note2">One student\.[\s\S]*?<\/div>/, '').replace(/<div class="tp-note2">Own program:[\s\S]*?<\/div>/, '');
    return h;
  };
  const _h = home2Click;
  home2Click = function (b, d) {
    if (!T.sheet || T.sheet.s !== 'group') return _h(b, d);
    if (d.nxgf) { keepForm(); T.sheet.nxOpen = T.sheet.nxOpen === d.nxgf ? '' : d.nxgf; draw();
      requestAnimationFrame(() => { const l = document.querySelector('.nx-wlist'), on = l && l.querySelector('.on'); if (on) l.scrollTop = on.offsetTop - l.clientHeight / 2 + on.offsetHeight / 2; // the list opens at the current week
        const wh = document.querySelectorAll('.nx-wheel'); wh.forEach((w) => { const o = w.querySelector('.on'); if (o) w.scrollTop = o.offsetTop - w.clientHeight / 2 + o.offsetHeight / 2; }); });
      return true; }
    if (d.nxwk) { keepForm(); const F = T.sheet.form; F.week = +d.nxwk; const max = F.lvl === 'IT' ? weekOf('IT', F.week).lessons.length : 3; if (+F.les > max) F.les = 1; draw(); return true; }
    if (d.nxls) { keepForm(); T.sheet.form.les = +d.nxls; draw(); return true; }
    if (d.nxtm) { const F = T.sheet.form, [k, v] = d.nxtm.split('|'), cur = String(F.time || '15:00'), t = k === 'h' ? String(v).padStart(2, '0') + cur.slice(2) : cur.slice(0, 3) + String(v).padStart(2, '0');
      document.querySelectorAll('input[id^="f-time-"]').forEach((x) => { x.value = t; }); keepForm(); F.time = t; draw();
      requestAnimationFrame(() => document.querySelectorAll('.nx-wheel').forEach((w) => { const o = w.querySelector('.on'); if (o) w.scrollTop = o.offsetTop - w.clientHeight / 2 + o.offsetHeight / 2; }));
      return true; } // every day gets the new time
    if (d.fLvl) T.sheet.nxOpen = ''; // a program was chosen: the list folds again
    return _h(b, d);
  };
  document.addEventListener('input', (e) => { if (e.target.id !== 'nx-tall') return; document.querySelectorAll('input[id^="f-time-"]').forEach((x) => { x.value = e.target.value; if (x._dpb) x._dpb.textContent = e.target.value; }); if (T.sheet && T.sheet.form) T.sheet.form.time = e.target.value; }, true);
}
