'use strict';
/* NEXT (16 Nov, user: "the Teacher icons should be redesigned in the iPhone style").
   My own drawings in the iPhone (SF Symbols) manner: rounder shapes, a lighter line, firmer chevrons, and FILLED versions
   for the tab bar when a tab is chosen (like the iPhone apps). They are drawn as vectors (not pictures), so they stay sharp
   at any size and take the colour of the text. Loaded right after icons.js, so every screen uses them. */
(() => {
  const F = (d) => `<path class="sf-f" d="${d}" fill="currentColor" stroke="none"/>`; // the filled tab-bar version (shown only when the tab is chosen)
  const O = (s) => `<g class="sf-o">${s}</g>`;
  const dot = (x, y, r = 1.15) => `<circle cx="${x}" cy="${y}" r="${r}" fill="currentColor" stroke="none"/>`;
  const SF = {
    /* tab bar */
    House: O('<path d="M3.6 10.4 12 3.6l8.4 6.8"/><path d="M5.6 8.9V19a1.6 1.6 0 0 0 1.6 1.6h3.3v-5.4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v5.4h3.3a1.6 1.6 0 0 0 1.6-1.6V8.9"/>')
      + F('M12 2.9a1 1 0 0 1 .63.22l8.4 6.8a.9.9 0 1 1-1.13 1.4l-.7-.57V19a2.4 2.4 0 0 1-2.4 2.4h-3.5a.6.6 0 0 1-.6-.6v-5a.6.6 0 0 0-.6-.6h-.2a.6.6 0 0 0-.6.6v5a.6.6 0 0 1-.6.6H6.6A2.4 2.4 0 0 1 4.2 19v-8.25l-.7.57a.9.9 0 0 1-1.13-1.4l8.4-6.8A1 1 0 0 1 12 2.9z'),
    BookOpen: O('<path d="M12 6.6C10.3 5.2 7.7 4.6 3.6 4.9v13.3c4.1-.3 6.7.3 8.4 1.8 1.7-1.5 4.3-2.1 8.4-1.8V4.9c-4.1-.3-6.7.3-8.4 1.7z"/><path d="M12 6.6V19.8"/>')
      + F('M11.1 6.1C9.3 4.7 6.8 4.2 3.2 4.5a.8.8 0 0 0-.7.8v12.9c0 .45.38.8.83.77 3.3-.22 5.7.2 7.77 1.5zM12.9 6.1c1.8-1.4 4.3-1.9 7.9-1.6a.8.8 0 0 1 .7.8v12.9a.8.8 0 0 1-.83.77c-3.3-.22-5.7.2-7.77 1.5z'),
    Users: O('<circle cx="9" cy="7.8" r="3.6"/><path d="M2.6 19.6c.4-3.5 3-5.6 6.4-5.6s6 2.1 6.4 5.6z"/><path d="M15.6 4.6a3.4 3.4 0 0 1 0 6.5"/><path d="M17.4 14.3c2.3.5 3.8 2.3 4 5.3h-3"/>')
      + F('M9 3.8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM9 13.3c3.9 0 6.8 2.4 7.2 6.4a.8.8 0 0 1-.8.9H2.6a.8.8 0 0 1-.8-.9c.4-4 3.3-6.4 7.2-6.4zM15.8 4.1a4.1 4.1 0 0 1 0 7.9 5.6 5.6 0 0 0 0-7.9zM17.6 13.6c2.7.6 4.4 2.7 4.6 5.9a.8.8 0 0 1-.8.9h-3.5a8.4 8.4 0 0 0-1.9-6.6z'),
    Wallet: O('<rect x="2.8" y="5.2" width="18.4" height="14" rx="3.2"/><path d="M2.8 9.6h18.4"/><path d="M6.6 15.2h3.6"/>')
      + F('M6 4.4h12a4 4 0 0 1 4 4v.4H2v-.4a4 4 0 0 1 4-4zM2 10.6h20v5.6a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4zm4.6 3.6a1 1 0 0 0 0 2h3.6a1 1 0 0 0 0-2z'),
    Library: O('<rect x="3.2" y="4" width="4.4" height="16" rx="1.2"/><rect x="9.2" y="4" width="4.4" height="16" rx="1.2"/><path d="m15.3 5.6 3.9-1.05a.9.9 0 0 1 1.1.64l3.4 12.7"/><path d="m15.3 5.6 3.6 13.5"/><path d="M18.9 19.1l3.9-1.05"/>')
      + F('M4.2 3.4h2.4a1.6 1.6 0 0 1 1.6 1.6v14a1.6 1.6 0 0 1-1.6 1.6H4.2A1.6 1.6 0 0 1 2.6 19V5a1.6 1.6 0 0 1 1.6-1.6zM10.2 3.4h2.4A1.6 1.6 0 0 1 14.2 5v14a1.6 1.6 0 0 1-1.6 1.6h-2.4A1.6 1.6 0 0 1 8.6 19V5a1.6 1.6 0 0 1 1.6-1.6zM15.6 5.1l2.9-.8a1.6 1.6 0 0 1 1.96 1.13l3.3 12.3a1.6 1.6 0 0 1-1.13 1.96l-2.9.78a1.6 1.6 0 0 1-1.96-1.13L14.47 7.06A1.6 1.6 0 0 1 15.6 5.1z'),
    /* navigation */
    ChevronLeft: '<path d="M15 4.8 7.8 12l7.2 7.2" stroke-width="2.5"/>',
    ChevronRight: '<path d="m9 4.8 7.2 7.2L9 19.2" stroke-width="2.5"/>',
    ChevronDown: '<path d="M4.8 9 12 16.2 19.2 9" stroke-width="2.5"/>',
    Plus: '<path d="M12 4.5v15M4.5 12h15" stroke-width="2.3"/>',
    X: '<path d="M6 6l12 12M18 6 6 18" stroke-width="2.3"/>',
    Check: '<path d="M4.8 12.6 9.6 17.4 19.2 6.6" stroke-width="2.4"/>',
    Ellipsis: dot(5.5, 12, 1.7) + dot(12, 12, 1.7) + dot(18.5, 12, 1.7),
    Search: '<circle cx="10.6" cy="10.6" r="6.6"/><path d="m15.6 15.6 4.9 4.9" stroke-width="2.3"/>',
    /* everyday */
    Share2: '<path d="M12 3.2v11.6"/><path d="M8.2 7 12 3.2 15.8 7"/><path d="M8.6 10H7a1.8 1.8 0 0 0-1.8 1.8v7.4A1.8 1.8 0 0 0 7 21h10a1.8 1.8 0 0 0 1.8-1.8v-7.4A1.8 1.8 0 0 0 17 10h-1.6"/>',
    Pencil: '<path d="M15.9 4.1a2.3 2.3 0 0 1 3.3 3.3L8.4 18.2l-4.6 1.3 1.3-4.6z"/><path d="m14 6 3.3 3.3"/>',
    Trash2: '<path d="M3.8 6.4h16.4"/><path d="M9 6.4V4.9A1.4 1.4 0 0 1 10.4 3.5h3.2A1.4 1.4 0 0 1 15 4.9v1.5"/><path d="m5.8 6.4.95 12.8a1.9 1.9 0 0 0 1.9 1.8h6.7a1.9 1.9 0 0 0 1.9-1.8l.95-12.8"/><path d="M10 10.6v6.2M14 10.6v6.2"/>',
    CalendarDays: '<rect x="3" y="4.6" width="18" height="16.4" rx="3.4"/><path d="M3 9.6h18"/><path d="M7.8 2.8v3.4M16.2 2.8v3.4"/>' + dot(8, 13.4) + dot(12, 13.4) + dot(16, 13.4) + dot(8, 17.2) + dot(12, 17.2),
    CalendarX2: '<rect x="3" y="4.6" width="18" height="16.4" rx="3.4"/><path d="M3 9.6h18"/><path d="M7.8 2.8v3.4M16.2 2.8v3.4"/><path d="m9.6 12.6 4.8 4.8M14.4 12.6l-4.8 4.8"/>',
    Clock: '<circle cx="12" cy="12" r="9"/><path d="M12 6.8V12l3.4 2.2"/>',
    History: '<path d="M3.6 12a8.4 8.4 0 1 0 2.5-6"/><path d="M3.4 4.2v4.4h4.4"/><path d="M12 7.6V12l3 1.8"/>',
    RotateCcw: '<path d="M4.2 12a7.8 7.8 0 1 0 2.4-5.6"/><path d="M4 3.8v4.6h4.6"/>',
    FileText: '<path d="M13.8 3H7a2.2 2.2 0 0 0-2.2 2.2v13.6A2.2 2.2 0 0 0 7 21h10a2.2 2.2 0 0 0 2.2-2.2V8.4z"/><path d="M13.8 3v3.6a1.8 1.8 0 0 0 1.8 1.8h3.6"/><path d="M8.8 13h6.4M8.8 16.6h6.4"/>',
    Play: '<path d="M7.2 4.9v14.2a1.1 1.1 0 0 0 1.68.94l11.2-7.1a1.1 1.1 0 0 0 0-1.88L8.88 3.96A1.1 1.1 0 0 0 7.2 4.9z" fill="currentColor" stroke="none"/>',
    CirclePlay: '<circle cx="12" cy="12" r="9"/><path d="M10 8.4v7.2a.6.6 0 0 0 .9.5l5.6-3.6a.6.6 0 0 0 0-1L10.9 7.9a.6.6 0 0 0-.9.5z" fill="currentColor" stroke="none"/>',
    Pause: '<rect x="6.4" y="4.6" width="3.8" height="14.8" rx="1.3" fill="currentColor" stroke="none"/><rect x="13.8" y="4.6" width="3.8" height="14.8" rx="1.3" fill="currentColor" stroke="none"/>',
    Square: '<rect x="4" y="4" width="16" height="16" rx="4.4"/>',
    ListChecks: '<path d="m3.4 6.2 1.6 1.6 3-3.2"/><path d="m3.4 12.6 1.6 1.6 3-3.2"/>' + dot(5.2, 19, 1.3) + '<path d="M11.2 6.4h9.4M11.2 12.8h9.4M11.2 19h9.4"/>',
    UserRound: '<circle cx="12" cy="7.6" r="4.1"/><path d="M4 20.6c.5-4.1 3.8-6.6 8-6.6s7.5 2.5 8 6.6z"/>',
    UserPlus: '<circle cx="9.6" cy="7.6" r="3.9"/><path d="M2.6 20.4c.5-3.9 3.4-6.2 7-6.2 1.6 0 3 .4 4.2 1.2"/><path d="M18.4 13.2v7M14.9 16.7h7"/>',
    MessageCircle: '<path d="M12 3.6c5 0 9 3.4 9 7.6s-4 7.6-9 7.6c-1 0-2-.13-2.9-.4L4 20.4l1.3-3.8C4 15.2 3 13.3 3 11.2c0-4.2 4-7.6 9-7.6z"/>',
    Info: '<circle cx="12" cy="12" r="9"/><path d="M12 10.8v5.8"/>' + dot(12, 7.6, 1.25),
    TriangleAlert: '<path d="M10.4 4.2 2.9 17.6A1.8 1.8 0 0 0 4.5 20.3h15a1.8 1.8 0 0 0 1.6-2.7L13.6 4.2a1.8 1.8 0 0 0-3.2 0z"/><path d="M12 9.4v4.6"/>' + dot(12, 17, 1.2),
    Target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5.2"/>' + dot(12, 12, 1.7),
    Star: '<path d="m12 3.4 2.6 5.5 6 .74-4.4 4.1 1.15 5.95L12 16.8l-5.35 2.89L7.8 13.74l-4.4-4.1 6-.74z"/>',
    StickyNote: '<path d="M19.6 13.6V6.2a2.2 2.2 0 0 0-2.2-2.2H6.6a2.2 2.2 0 0 0-2.2 2.2v11.6A2.2 2.2 0 0 0 6.6 20h6.6z"/><path d="M13.2 20v-4.2a2.2 2.2 0 0 1 2.2-2.2h4.2"/><path d="M8.2 8.6h7.6M8.2 12.2h4"/>',
    Smartphone: '<rect x="6.4" y="2.4" width="11.2" height="19.2" rx="2.8"/><path d="M10.4 5.1h3.2"/>',
    ClipboardCheck: '<rect x="5" y="4.4" width="14" height="16.6" rx="2.6"/><path d="M9 4.4V3.6A1 1 0 0 1 10 2.6h4a1 1 0 0 1 1 1v.8"/><path d="m8.8 13 2.2 2.2 4.2-4.6"/>',
    BookA: '<path d="M5 19.4V5.6A2.6 2.6 0 0 1 7.6 3H19v14.2H7.6A2.6 2.6 0 0 0 5 19.8 2.2 2.2 0 0 0 7.2 22H19"/><path d="m10 13.4 2-6 2 6M10.7 11.4h2.6"/>',
    Sparkles: '<path d="M10.4 3.6c.5 3.6 2.2 5.4 5.8 5.9-3.6.5-5.3 2.3-5.8 5.9-.5-3.6-2.2-5.4-5.8-5.9 3.6-.5 5.3-2.3 5.8-5.9z" fill="currentColor" stroke="none"/><path d="M17.6 13.6c.3 1.9 1.1 2.8 3 3.1-1.9.3-2.7 1.2-3 3.1-.3-1.9-1.1-2.8-3-3.1 1.9-.3 2.7-1.2 3-3.1z" fill="currentColor" stroke="none"/>',
    Link: '<path d="M10.2 13.8a4 4 0 0 0 5.66 0l3.2-3.2a4 4 0 0 0-5.66-5.66l-1.1 1.1"/><path d="M13.8 10.2a4 4 0 0 0-5.66 0l-3.2 3.2a4 4 0 0 0 5.66 5.66l1.1-1.1"/>',
    ExternalLink: '<path d="M13.6 3.6h6.8v6.8"/><path d="m20.4 3.6-8.6 8.6"/><path d="M18.2 13.6v4.6a2.2 2.2 0 0 1-2.2 2.2H5.8a2.2 2.2 0 0 1-2.2-2.2V8a2.2 2.2 0 0 1 2.2-2.2h4.6"/>',
    Download: '<path d="M12 3.4v11.4"/><path d="m7.8 10.8 4.2 4.2 4.2-4.2"/><path d="M4.4 15.6v2.6a2.2 2.2 0 0 0 2.2 2.2h10.8a2.2 2.2 0 0 0 2.2-2.2v-2.6"/>',
    Upload: '<path d="M12 15V3.6"/><path d="M7.8 7.8 12 3.6l4.2 4.2"/><path d="M4.4 15.6v2.6a2.2 2.2 0 0 0 2.2 2.2h10.8a2.2 2.2 0 0 0 2.2-2.2v-2.6"/>',
    ShieldCheck: '<path d="M12 2.8 4.6 5.6v5.6c0 4.8 3.2 8.4 7.4 10 4.2-1.6 7.4-5.2 7.4-10V5.6z"/><path d="m8.6 12 2.4 2.4 4.4-4.6"/>',
    Globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.4 2.6 3.6 5.6 3.6 9s-1.2 6.4-3.6 9c-2.4-2.6-3.6-5.6-3.6-9S9.6 5.6 12 3z"/>',
    PenLine: '<path d="M12 20.4h8.4"/><path d="M15.9 4.1a2.3 2.3 0 0 1 3.3 3.3L8.4 18.2l-4.6 1.3 1.3-4.6z"/>',
    GraduationCap: '<path d="M12 4.2 2.4 9 12 13.8 21.6 9z"/><path d="M6.4 11v4.6c1.4 1.5 3.3 2.4 5.6 2.4s4.2-.9 5.6-2.4V11"/><path d="M21.6 9v5.4"/>',
    Trophy: '<path d="M7.4 3.6h9.2v5.6a4.6 4.6 0 0 1-9.2 0z"/><path d="M7.4 5.6H4.4v1.6a3.2 3.2 0 0 0 3.2 3.2M16.6 5.6h3v1.6a3.2 3.2 0 0 1-3.2 3.2"/><path d="M12 13.8v3.4M8.4 20.6h7.2l-.6-3.4H9z"/>',
    Fingerprint: '<path d="M6.2 6.4A8 8 0 0 1 20 11.6c0 1.4-.1 2.8-.4 4.1"/><path d="M4.2 10.2a8 8 0 0 0-.2 1.8c0 1.7-.4 3.2-1 4.4"/><path d="M8.4 11.8a3.6 3.6 0 0 1 7.2 0c0 3.2-.5 6.1-1.6 8.6"/><path d="M12 11.8c0 3.6-.8 6.6-2.6 9"/><path d="M5.8 18.6c1.4-1.9 2.3-4.2 2.6-6.8"/>',
    BookOpenCheck: '<path d="M12 6.6C10.3 5.2 7.7 4.6 3.6 4.9v13.3c4.1-.3 6.7.3 8.4 1.8 1.7-1.5 4.3-2.1 8.4-1.8V4.9c-4.1-.3-6.7.3-8.4 1.7z"/><path d="M12 6.6V19.8"/><path d="m14.6 12 1.6 1.6 3-3.2"/>',
    PartyPopper: '<path d="M4 20 8.6 7.6l7.8 7.8z"/><path d="M13.6 4.2c.4 1.2.2 2.2-.6 3M17.8 8.4c1-.6 2.1-.8 3.4-.4M19 3.6l-1 1.6M20.6 12.8l-1.4-.4"/>' + dot(15.6, 3.2, .9) + dot(21, 5.6, .9),
    Puzzle: '<path d="M9.6 4.6a2.2 2.2 0 1 1 4.4 0V6h3.4A1.6 1.6 0 0 1 19 7.6V11h-1.4a2.2 2.2 0 1 0 0 4.4H19v3.4a1.6 1.6 0 0 1-1.6 1.6H14v-1.4a2.2 2.2 0 1 0-4.4 0v1.4H6.2a1.6 1.6 0 0 1-1.6-1.6v-3.4H6a2.2 2.2 0 1 0 0-4.4H4.6V7.6A1.6 1.6 0 0 1 6.2 6h3.4z"/>',
    FileUp: '<path d="M13.8 3H7a2.2 2.2 0 0 0-2.2 2.2v13.6A2.2 2.2 0 0 0 7 21h10a2.2 2.2 0 0 0 2.2-2.2V8.4z"/><path d="M13.8 3v3.6a1.8 1.8 0 0 0 1.8 1.8h3.6"/><path d="M12 17.4v-6M9.4 13.8 12 11.2l2.6 2.6"/>',
  };
  Object.assign(ICONS, SF);
  // a slightly lighter line than before, like the iPhone's regular weight
  window.ic = function (name, cls) {
    const d = ICONS[name] || ICONS.Square;
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + d + '</svg>';
  };
})();
