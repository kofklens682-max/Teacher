# Teacher app + Teen course: HANDOFF (read this first in a new chat)

Saved 19 October 2026 (Monday) at the end of a very long chat. Everything needed to continue is in this file and in
the files it points to. Nothing was lost. Read it all before doing anything.

**Update 20 October 2026 (end of the third chat): Beginner to Upper-Intermediate are FINAL. The real app is live
(teacher-v5 = level-by-level swipe). Page version 15 has the IELTS v1 drafts + a Research tab. The user then gave NEW
DECISIONS and a NEW DESIGN for both IELTS levels (§3, "IELTS REBUILD BRIEF"), so the v1 drafts must be rebuilt.
NEXT CHAT = rebuild IELTS 5.5–6.5 first, then IELTS 7+. The user's exact words are in `NEXT-CHAT-PROMPT.md`.**

**DECKS — PIECE 1 DONE (21 Oct 2026): APP LIVE = teacher-v8 / "Teacher 1.6" (commit 789b9ac).** User's decisions on
research round 2: decks in the app + PDF; a QR student page; Russian translation up to Pre-Intermediate only (none from
Intermediate on); build the pieces "one by one". Built: `app\js\deck.js` (Present · 10 min + PDF buttons on a lesson
screen; slide types say, pattern, qa, quiz, scale, row, street, watch, turn, words, exit; automatic title + word cards
with RU on the back + voices), deck data for all 25 Beginner lessons in `data\decks_a1.py` (G = 279 Gemini picture
prompts), media in `app\media\p` (pictures) + `app\media\v` (voices) kept in the "teacher-media" cache across updates and
pre-downloaded when idle. Pictures: Gemini in the user's Chrome makes sheets of 6 (`tools\gemini_sheets.py` →
`tools\a1_sheets.json`), `tools\take_sheet.py a1 <n>` cuts sheet n (`tools\cut_sheet.py`). Sheets 1-26 done; **27-43
(102 pictures, prompts in `media-src\rest.json`) NOT made: Gemini's daily image limit**. Until then build_app_data.py
leaves those pictures out (no broken images; picture-quiz cards dropped). To finish: make the sheets, run take_sheet for
27-43, rebuild (build_course.py + build_app_data.py → no "PICTURES NOT READY"), bump sw VERSION, push.
PIECE 2 LIVE (21 Oct): teacher-v9 "Teacher 1.7" = "Add my own file" on every lesson + own-program screen (S.mats[key], blobs "mat:<id>" in IndexedDB; backups keep the list, not the files). NEXT PIECES, one by one: QR student page → decks + RU for
Elementary / Pre-Int, decks for higher levels (no RU) → tests + print center → checked video links + Telegram homework.
Also fix the research page: backups save the file list, not the PDF files.

**22 Oct 2026, Week 4 LIVE as teacher-v15 / "Teacher 2.2" (commit 0bb362f): food and shopping (Food I like, At the café, At the store); `data\packs_a1_w4.py`. NEW: WEEKLY REVIEW sheet (A4, file key `w`) on Lesson 3 of each week, `review=dict(ex=[...with part labels], ask=[...], cando=[...])`: this week + earlier weeks + RU→EN + partner questions + "I can" ticks; its answer key is the last lesson page. Weeks 1-3 have no review sheet yet (offer it). Games W4: Baamboozle 164304 + 899081 (L1), 1572995 (L2), 1056867 (L3). RULE (user): ALWAYS make new pictures with Gemini in the Chrome extension (memory gemini-pictures). TESTS NEED THE LOCAL SERVERS: start launch configs teacher-app (5194) and teacher-packs (5195) BEFORE running Tests	eacher-*.js (I once pushed before noticing the tests had not connected; rerun passed). OPEN QUESTION asked of the user: Weeks 7-8 (present continuous, comparatives, past) = Elementary; my recommendation: Beginner W5-8 become topic weeks with chunks only (propose each before building).**

**22 Oct 2026, Week 3 LIVE as teacher-v14 / "Teacher 2.1" (commit d0e3260). USER'S GRAMMAR RULE FOR BEGINNER (strong): NO he / she / it -s rule and no does / doesn't; Beginner speaks with words and chunks (I / you / we / they + verb, be, can, have / has, like). Present simple rule, present continuous = Elementary; past, future etc. later. Week 3 was rebuilt this way: L2 "My friend's day" became "Our day" (we / they + always / usually / never), L3 uses Do you / Do they only (beginner.py, activities.py, book_map.py, decks_a1.py renamed). STILL TO REVISIT when we reach them: Week 5 (there is / are), Week 6 (going to), Week 7 (Where does he work?, present continuous, comparatives), Week 8 (was / were, could, past simple) — propose chunk-only versions to the user first. NEW FILE per lesson from Week 3: READING (A4 passage, first person or we / they only, today's words highlighted + Russian word help; `read=dict(title, pic, text, gloss)` in packs_a1_wN.py). Week 3 games: Baamboozle 962124, 440618, 1952211. Ideas offered to the user (not built): weekly review sheet, cut-out flashcards.**

**22 Oct 2026 later: Beginner WEEK 2 LIVE as teacher-v13 / "Teacher 2.0" (commit 5cfc7a9): content in `data\packs_a1_w2.py` (one file per week: copy it for the next week and import it in build_packs.py). Games W2: Baamboozle 3238793 (L1), 1731415 (L2), 187548 + 1024154 (L3). Flags (emoji) show as country codes in the PDFs (Windows has no flag glyphs). NEXT: Week 3 (Daily life: present simple, My day / My friend's day / School and weekends), then 4-8; find + OPEN-AND-READ Baamboozle games each time.**

**23 Oct 2026 (later): teacher-v19 / "Teacher 1.9" LIVE: Look switch (Normal / Glass) in Profile and settings, saved in localStorage `teacher-look`; Glass CSS at the end of app/style.css (html.glass rules). Normal is the default. Checked: Home and settings sheet only; lesson screens in Glass not yet checked. The demo page glass-demo.html was removed. Elementary PDFs checked by script only; level test questions not yet read back. NEXT: Pre-Intermediate (propose the 11-week map first).**

**23 Oct 2026: ELEMENTARY IS COMPLETE AND LIVE (teacher-v18 / "Teacher 1.8", commit 5550e5b).** 33 lessons (11 weeks x 3) + level test (unit 12). Per lesson: Lesson PDF (~18 pages: cover, Beginner warm-up, 20 core + 20 extra words with Russian, grammar pages, 8 example sentences, 5 collocations + 2 phrasal verbs, speaking, "Watch and listen" links, exit check, 8 speaking questions, answer keys), Exercises (6, A4), Reading (own text W1-3; the user's 3B stories W4-11, one panel per lesson, `STORY_FILES` in pack_a2.py), Weekly review on Lesson 3 (this week + earlier weeks + a Beginner part + RU->EN), Homework (copybook, 10 own sentences, 10 RU->EN, Murphy red pages). BUILD: `data\pack_a2.py` (all, or `pack_a2.py <week> <lesson>`), content in `data\packs_a2_w1..w11.py` (schema = `pack(sub, can, warm, pages, sent, ex[6], speak, recap, speakq[8], hw[10], read, review)`), words `words_a2*.py`, listening `watch_a2.py` (82 verified VOA / Easy Stories links, `check_watch_a2.py`), games `games_a2.py` (only games opened and read; lessons without a good game have none: Do you/does she, School life, Free time, State verbs, Enough, Too much, Not as big as, W4, W9L1/L3, W11), test `level_test_a2.py` (50 pts + speaking 20). Checks: `check_pages_a2.py` (lesson pages = html sections) and an overflow script over the lesson HTML (none found). storyB02.json holds a sandbox path: the builder falls back to `panels\B2-panelN.png`. FONT FIX: static Segoe UI in packs.css / sheets.css (PDFs open fast, 2-6 fonts instead of 189); all 25 Beginner PDFs were rebuilt too. APP: "Watch and listen" card (`P.v`), Settings button replaced by a PROFILE avatar (initials) on Home -> "Profile and settings" sheet (name + role, saved in localStorage `teacher-profile`). The Liquid Glass look was only SHOWN as a mockup (before / after screenshot); NOT added: wait for the user's OK (CSS used: `scratchpad\glass.css` idea = translucent blurred tab bar, glass tiles, highlight edges). Tests all passed (all-lessons 330 screens, width, flows, sheets, stable, stack, levels) and the live site + offline test passed (242 PDFs = 200). NEXT: Pre-Intermediate (past simple, past continuous, present perfect...; 4000 Essential English Words), same method, discuss the week map first.**
**22-23 Oct 2026: BEGINNER IS COMPLETE AND LIVE (teacher-v17 / "Teacher 2.4", commit c752205): all 8 weeks + the level test, 25 lessons, each with Lesson, Exercises, Reading (from W3), Weekly review (Lesson 3 from W4), Homework, Baamboozle games (W7L2 has none), no book units. Weeks 5-8 were REDESIGNED with the user (no past, no going to, no present continuous, no comparatives; he/she -s only in Elementary): W5 Home and town (My home / My town / Finding the way), W6 Free time (Hobbies and sports / What I'm good at / Making plans), W7 Jobs (Jobs people do / What jobs do / My dream job), W8 Vacations (Weather and seasons / Where I go / Packing and a dream trip). Content: `data\packs_a1_w5..w8.py`, words + Russian + pictures: `data\words_a1_w58.py`, level test: `data\level_test_a1.py` (written test 40 pts + teacher key + speaking test 20 pts, files t / k). 71 new pictures were made with Gemini in the user's Chrome (sheets of 12 WORK; tools: `tools\gemini_sheets.py a1 --todo > a1_sheets.json`, then `take_sheet.py a1 n` (sheets with white gaps) or `take_sheet2.py a1 n` (sheets whose pictures touch: even grid + margin trim); Gemini recipe: new chat, click the box, type the prompt starting "Create one image:", Enter, wait ~2 min, click the picture, click the download icon (top, x=521 y=32); do ONE chat per tab, parallel tabs work if each is a fresh chat). `build_packs.py` copies Spin & Say photos into `pack-pics` on first use. NEXT: ELEMENTARY, one week at a time (see below). Elementary decisions of the user (23 Oct): books = Murphy red only (Books Elementary\Essential Grammar in Use 4th ed (red).pdf, British, 115 units), NO vocabulary book at Elementary; grammar = present simple, present continuous, comparatives + superlatives, future (going to + will), NO past (Pre-Intermediate = past simple, past continuous, present perfect…); 11 weeks + level test; reading = the user's stories in Desktop\Kids\StoriesB class (10 stories B1-B4, B6-B10 (B5 missing), present tense with he/she -s and present continuous in every story, ~170-250 words, 3 panels each, words with IPA + Russian); Pre-Int upward = 4000 Essential English Words. Elementary needs the same discuss-first approach: propose the 11-week map, wait for approval, then build W1 (Lifestyles) and wait for approval each week.**

**22 Oct 2026: teacher-v12 LIVE (Share all files + Share game link). BOOK POLICY: Beginner = NO book (our files are the course book); books from Elementary / Pre-Int at their own level; reading only from the user's "English for Kids" (file not found, ask). `BOOKS_ON=False` in build_packs.py.**

**PIECE 3 = LESSON FILES — LIVE 21 Oct 2026 as teacher-v11 / "Teacher 1.8" (commit 0eb32b2), Beginner Week 1 only; user checks it on
the phone, then we do Weeks 2-8 one week at a time (propose the 3 days → OK → build).** User's decisions (sixth chat): the slide
decks are GONE (removed from the app, deck.js deleted, no deck data in course.js, old media cache cleaned by sw.js); per lesson
the app shows only: LESSON file (landscape 16:9 PDF: cover, warm-up, WORDS table first, then grammar "how it works" + how to
make sentences, then pictured examples, speaking, game, exit check, teacher answer key), EXERCISES file (A4 to print, no
answers), HOMEWORK file (A4: copybook + 10 RU→EN + book units; only where it makes sense, otherwise just the book units),
each with Open + Share (navigator.share of the real file → Telegram; saves the file on a computer); the Baamboozle game(s)
(Baamboozle ONLY, skip a lesson if there is no good game; every link opened and read; Play works without login) shown as a
card with the link; "Books for this lesson" (Basic Grammar in Use unit + title, Vocabulary in Use unit; no page numbers in our
contents lists). Files: `data\packs_a1.py` (content per lesson), `datauild_packs.py` + `packs.css` (landscape) + `sheets.css`
(A4): `py -X utf8 -W ignore build_packs.py [week lesson]` → `packs\*.html` (preview, launch config teacher-packs port 5195),
`app\media\packs\<key>-lesson|exercises|homework.<hash>.pdf` (hash in the name), `app\data\packs.js` (+ `data\packs.json` cache).
Pictures for the packs: `pack-pics\` (moved out of the app; Spin & Say photos + Gemini cuts). App code: `app\js\lessonfiles.js`.
After editing data: build_packs.py → git add/commit/push in `app\` (sw VERSION bump). Tests passed (width, all-lessons, flows,
sheets, stable, stack, levels, live offline). Games W1: Baamboozle 2801101 (L1), 2105998 + 283266 (L2), 3406522 (L3).
NOTE: slide-deck sources `data\decks_a1.py` still feed the words / Russian / pictures of the packs; the deck Gemini sheets
27-43 (102 pictures) are only needed for the packs of later weeks (Gemini limit; sheets of 12).

**RESEARCH ROUND 2 (20 Oct 2026, late; page version 21, Research tab, opens there once):** the user asked for deep
research on materials, presentations (10-minute, iPhone-style, per topic and for revision), word cards with pictures,
vocabulary that sticks, testing, students from other schools, band 7+, homework, printing, exact video links, where to
keep materials, and an APK. Published: 9 cards + "ten best ideas" + "what we missed" + a working SAMPLE DECK (Beginner
W1L1 can / can't, 10 slides, Spin & Say photos + real voices embedded by build_page.py from `plan\deck-sample.js` +
`plan\deck.css`; no two slides ever visible together; no slide overflows at 343 / 920 / 1400 px). Key facts: Chrome
already installs our PWA as a real APK (WebAPK) → advice: no separate APK; word meetings 6-20 (10-15 recognition) → plan
of ~12 meetings; links checked (TED talks, BBC 6 Minute English, VOA L1 Lesson 1 = learningenglish.voanews.com/a/
lets-learn-english-lesson-one/3111026.html); YouTube oEmbed = automatic link check. NOTHING built in the app yet:
waiting for the user's decisions (questionnaire in that turn).

**END OF FOURTH CHAT (20 Oct 2026): ALL 7 LEVELS FINAL (user: "everything seems to be okay"). Page version 19 (both
IELTS levels "final"). APP LIVE = teacher-v7 / "Teacher 1.5" (commits abb175b + 0e0f6fc pushed; live tests passed:
install + offline, all 330 week/lesson screens, level swipes). Final lag sweep at 4x CPU: every step of a typical session
at the meter's 25 ms floor, first lesson open 25-50 ms (prewarm draws a week + an IELTS lesson too). New tests:
Tests\teacher-all-lessons.js (every week and lesson screen of every level, 360 px, IELTS plans add up), teacher-jank.js.
The user said they'll come back with "future improvements" — ask what they want; nothing is pending.**

**Update 20 October 2026, fourth chat:**
- APP FIXES (local, not pushed yet): the overlapping "IELTS 5.5-6.5" card on every tab (user's screenshots) = the
  level pager parked Units' left neighbour with `offsetLeft` (counted from the start of the 4-page track) → it sat at
  x = 32 px over all tabs. Now parked by screen position, 60 px past the edge (`lvSide`). Also: flick speed from the last
  120 ms only + needs 24 px of travel (a slow first frame hid flicks; out-and-back counted as a flick); neighbours drawn
  after 450 ms idle (was 1500); the pages under a screen are no longer `inert` (that restyled every page: 13 ms of 20 on
  a fast PC, the slowest part of opening / closing a screen) → only class `under` + aria-hidden; prewarm draws a week
  screen too (first week open 203 → 56 ms at 4x CPU). New tests: `Tests\teacher-jank.js` (a typical session, worst
  frame + long tasks per step), level check "no waiting level picture on any tab" in teacher-levels.js.
- IELTS 5.5-6.5 v2 BUILT (`data\ielts1.py`) from the user's answers: Lesson 3 = Speaking AND Writing every week; real
  English (podcast / TED / article) in both IELTS levels; Task 2 = one agree / disagree essay built step by step (other
  types in 7+); words = 20 new + 10 revision + 5 collocations + 2 phrasal verbs, 4000 EEW 2 units a week (Book 3 U25-30 +
  Book 4 U1-18). 12 weeks: Education, Technology, Environment, Health, Work and careers, Cities and housing (Sunday mock
  1), Travel and tourism, Food and farming, Media and advertising, Sport and leisure, Animals and nature, Family and
  generations (final mock = level test). L1 = Listening day, L2 = Reading day, L3 = Speaking part + Task 2 skill + one
  AGU grammar point. Routines in build_course.py `ROUTINE_I` (L: 10 word check, 15 words, 20 real listening, 45 question
  type, 15 met again, 15 talk + game; R: + 5 speed read, 40 question type; SW: 15 words, 40 speaking, 15 grammar, 40
  writing, 10 game). Lesson fields `routine`, `real`; app shows "Lesson plan · 120 min" + "Real English" cards.
  Book refs checked in the PDFs (C12 = Tests 5-8, text; IELTS Trainer 2 = text; C16, Official Guide, Basic IELTS
  Listening = scans). check_level.py: `NEW_WORDS` (20). Waiting for the user's "final" on IELTS 5.5-6.5, then IELTS 7+
  (data\ielts2.py still v1: 8 weeks, Book 4 U11-26 overlaps → must move on from Book 4 U19).

- LATER SAME CHAT: user: IELTS 5.5-6.5 uses ONLY the Official Cambridge Guide (skills units by page + Practice Tests
  1-8) and IELTS Trainer 2 (Tests 1-2 training, 3-6 timed) + our own tasks where they have none → SKILL/REVIEW re-pointed
  (69 distinct book parts, none used twice; mocks = Guide Practice Tests 2 and 3; W12 full tests = Practice Test 1).
- IELTS 7+ v2 BUILT (`data\ielts2.py`, page v18 "v2 for review"): L1 Speaking day (TED / podcast for ideas, one skill,
  Part 3 discussion), L2 Writing day, L3 = L/R recap (one timed Cambridge part + passage, 60 min) + a writing hour
  (user's choice); 3-minute EXIT check every lesson (user picked only this research idea). The 20 most common topics
  (IELTS Liz list) = one topic a lesson in weeks 1-7, mixed revisits weeks 8-12 (user: "1 topic a lesson"). Writing:
  Task 2 types weeks 1-3, then Task 1: "change charts" (anything over time, even 2 pies of 2 years) 4 lessons, "compare
  charts" (one time) 4, processes 2, maps 2, mixed 2 (user's terms); a Task 2 essay every week as homework. Books:
  Cambridge IELTS 17 + 21 (text, every question set and Writing task mapped) for recap + writing, 18 + 19 (scans) for
  mocks; Official Guide Writing / Speaking units. EEW Book 4 U19-30 + Book 5 U1-12. Routines `ROUTINE_I` S / W / LRW,
  fields `exit`, `recap`. Both IELTS levels wait for the user's "final"; then push the app (sw VERSION teacher-v6).

**Update 19 October 2026 (second chat): Pre-Intermediate is FINAL (version 10 of the page).** Next is Intermediate.

The live page (the course plan and the app model) is here: https://claude.ai/artifact/2RPUq1VzhaPgofcBEFajX9 (version 15).
To update it, publish the same file again (`plan\Course-plan.html`) with that URL.
In a new chat, **read the artifact first** (Artifact tool, action "read", with the URL), then publish to it.

---

## 1. What we are building

1. **A course for teenagers aged 15–18, from Beginner to IELTS 7+**, built one level at a time. The user teaches it in
   Uzbekistan. Students speak Russian and Uzbek. There are 3 lessons a week, about 80 minutes each.
2. **A third app for the teacher**, alongside the Budget and Notes apps. It is a phone app (PWA), Apple-style, with 4 tabs:
   **Home · Units · Attendance · Books**. It holds groups, students, attendance and homework, the full program (levels →
   weeks → lessons), and the PDF books, audio and video links. So far it is **only a working model inside the plan page.
   The real app is not built yet.** Build it only after the user says "do it".

The user is a teacher and a student at Westminster University. They are **not technical**: explain in plain words and do
the work yourself. This is their most important project, and they will use it for years. **Mistakes are not allowed.
Check everything more than once.**

## 2. The user's rules (all of these came from their feedback, so follow every one)

**How to work with them**
- Go **one level at a time**: present the level, ask **specific questions only** (no general ones), apply their
  answers, give the final version, and wait for "final" before moving to the next level. Use the questionnaire tool
  (AskUserQuestion) with previews. Discuss and push back; offer better options instead of just agreeing.
- **Review your own work before you send it.** Would I like it? Does it work? Is it what they asked for? Does it match
  Cambridge? They explicitly asked for this self-review.
- Presentation must be **short and easy to read**. For each week: Topic, its 3 subtopics (one per lesson), and for each
  lesson the **Grammar topic** and **Vocabulary topic** by name (for example "Present Simple: negatives and questions"),
  then the examples. **No minute-by-minute agendas**: every group moves at its own pace.
- Design and redesign rules: for new looks, show pictures or models first and change nothing in their apps until they
  approve (see memory notes approval-before-changes and smooth-and-reliable). Keep it smooth (animations, no glitches)
  and minimal.

**Course content**
- **One big topic a week with 3 subtopics, one per lesson.** Each lesson has one grammar topic, **20 topic words**, a
  speaking task, and homework. There is a writing task every week.
- Vocabulary is **topic-based up to Intermediate**. From Intermediate on, the course becomes more speaking-based,
  academic and complex.
- **From Elementary on, every lesson also has 5 collocations and 2 phrasal verbs.**
- **Each level ends with ONE test lesson** (for example on a Sunday), never a test week.
- **The grammar order follows a "master it first" rule.** Each tense is practised in positives, negatives and questions
  until it is automatic, before the next one starts. Don't overload early levels with grammar.
- **American English.** Grammar is American only ("I have", never "I've got"; "vacation", not "holiday"; "Did you
  ever…?" is fine). Where the vocabulary differs, give both words (apartment / flat, check / bill). There is one
  5-minute note on varieties in Beginner. Use American spelling everywhere (favorite, color, center).
- **Beginners get no recordings**, only the teacher's voice. They make sentences and speak from day 1, at a fast pace
  (60 words a week). Cut topics students pick up anyway (countries as a topic, colors, numbers, the alphabet).
- Beginner learns some grammar **only as words or phrases by heart, with translation** (Week 7: "she's working",
  "faster, the best"). The **rule comes in Elementary**.
- **The level is checked against Cambridge**, using the British Council / EAQUALS **Core Inventory for General
  English**: `data\sources\core-inventory.pdf` and `.txt`. The A1–C1 grammar lists are on page 6 of the PDF
  (`d[5]` in PyMuPDF). Each level file has a `*_CHECK` list of each grammar point and the weeks that teach it.
- **No book decides the order; the logic does.** Books are for practice. Students practise grammar in **Basic Grammar
  in Use (American, ISBN 9781316646748)** (the user still needs to buy it). Its unit numbers are in each lesson (`bgiu`).
- **Listening:** "Watch & talk" (watch for the main idea, watch again with 3 questions, translate 5 lines, retell).
  **VOA Let's Learn English in order**: Elementary uses Level 1 Lessons 1–33, and Pre-Intermediate uses Level 1
  Lessons 34–52, then Level 2 Lessons 1–11. In Pre-Intermediate, Lesson 3 of every 2nd week is a **Fable Cottage story**
  to retell instead of VOA (6 stories). The user wants it as "a rest from formal English", and wants the other stories
  kept for Intermediate. Dictation books were **dropped** (the user said they only train spelling).
  Cartoons and Fable Cottage are limited (~20 videos), so the main sources must be long series.
- **From Pre-Intermediate on:** **4000 Essential English Words**, ONE unit a week as checked homework (Pre-Int = Book 1,
  Units 1–12; carry on from Book 1 Unit 13). **One graded reader a month** (Oxford Bookworms Stage 3 at Pre-Int; the user
  must buy them), with a 5-minute book chat in Lesson 3 of weeks 4, 8 and 12.
- **REPETITION IS THE RULE (user, 19 Oct 2026, strong): "Repetition is key to success."** The old "no repeats" rule
  was a mistake. Repeating and revising is wanted. If 15 minutes of a lesson can go to an exercise that repeats or
  revises something, that is better than teaching something completely new. So: plan review into lessons, recycle
  earlier grammar and words, and never remove something just because it was taught before. Only the *new* word list of
  a lesson should hold words that are really new (recycled words go in a separate revision list).
- **Intermediate is a BRIDGE (user, 19 Oct 2026):** the first 1–2 weeks are about 20% new and 80% *using* everything
  learned so far in real life: speaking (fluency, giving opinions, not just translating), reading, listening, and
  writing stories. New grammar comes after that.

## 3. Course status

| Level | Status | File | Shape |
|---|---|---|---|
| Beginner (A1) | **FINAL** | `data\beginner.py` | 8 topic weeks + 1 test lesson = 25 lessons, 480 words |
| Elementary (A2) | **FINAL** | `data\elementary.py` | 11 weeks + 1 test lesson = 34 lessons; 660 words + 165 collocations + 64 phrasal verbs |
| Pre-Intermediate (B1) | **FINAL** (19 Oct 2026, second chat) | `data\preintermediate.py` | 12 weeks + 1 test lesson = 37 lessons; 720 words + 180 collocations + 72 phrasal verbs; + 4000 EEW Book 1 U1–12, 3 readers, 6 Fable Cottage stories |
| Intermediate (B1+) | **FINAL** (20 Oct 2026; page version 12; user still to confirm "final") | `data\intermediate.py` | 2 bridge weeks (10 new + 10 revision words a lesson, USE tasks) + 10 grammar weeks + 1 test lesson = 37 lessons; 660 new words; 15-min REVIEW in every lesson; Murphy blue units; VOA L2 12–23 / BBC 6 Minute English / stories (Fable Cottage 7–12); 4000 EEW Book 1 U13–24; Bookworms Stage 4 |
| Upper-Intermediate (B2) | **FINAL** (20 Oct 2026, page version 14). Answers: 1 skill per lesson; 20 + 5 + 2 words; 4000 EEW = jump to Book 3, "give the one text almost every lesson" → one unit in L1 and one in L2 with its reading text (Book 3 U1–24, `EEW_PER_WEEK = 2`); activities added to ALL earlier lessons (`data\activities.py`, 129) | `data\upperintermediate.py` | SKILLS level (user, 20 Oct): L1 Reading (speed read + IELTS reading skill), L2 Listening + speaking, L3 Writing + one B2/C1 grammar point (cleft, inversion…); SKILL/HOW/ACTIVITY/REVIEW per lesson; Advanced Grammar in Use units; 12 weeks + test |
| IELTS 5.5–6.5 (B2) | **v1 draft (page v15) — TO BE REBUILT per the IELTS REBUILD BRIEF below** | `data\ielts1.py` | Same lesson shape as Upper-Int: L1 Reading (speed read + one question type), L2 Listening part + Speaking part, L3 Writing task + grammar (Advanced Grammar in Use). 8 weeks (Education, Technology, Environment, Health, Work and money, Cities and transport, Society and culture, Ready for the test) + level test = final mock. Diagnostic in W1L1; mock 1 in week 4 (Sunday, ~3 h). `SPLIT = True`: every lesson 10 new + 10 revision words (REVISE) + 5 collocations + 2 phrasal verbs; SKILL/HOW/ACTIVITY/REVIEW; IELTS homework lines (`HOMEWORK`); 4000 EEW Book 3 U25–30 + Book 4 U1–10; `I1_CHECK` = every part/question/task type |
| IELTS 7+ (C1) | **v1 draft (page v15) — TO BE REBUILT per the IELTS REBUILD BRIEF below** | `data\ielts2.py` | Band 7–8 (descriptor features: clear position, developed ideas, precise less common words, error-free complex sentences); 8 weeks (Science and research, Globalization, Media and communication, Environment and policy + mock 1 (Cambridge IELTS 18), Psychology and behavior, Economy and business, Arts and heritage, Ready for band 7+) + final mock (Cambridge IELTS 21) = level test; grammar: nominalization, approximation, hedging, passives, cleft/inversion, referencing, participle clauses; 10 + 10 words; 4000 EEW Book 4 U11–26 |

**IELTS REBUILD BRIEF (user, 20 Oct 2026, end of the third chat; their exact words are in `NEXT-CHAT-PROMPT.md`):**
- **Decided:** **12 weeks** per IELTS level (not 8: "safer", students are lazier now). **Full mock test on Sundays**
  (~3 h; middle + end, final mock = level test). **20 new words + 10 revision words every lesson** (revision always).
- **IELTS lessons are 120 minutes** (both IELTS levels), not 80. Still 3 lessons a week. (Build/page/app show
  "80 min" via `lessonMinutes`: make it per level.)
- **IELTS 5.5–6.5 = question-based, Listening + Reading mastered (aim ~7.5–8 there):** a separate day for Listening, a
  separate day for Reading, and a third day that mixes Speaking or Writing. Cover EVERY question type:
  - Listening: multiple choice; matching; plan / map / diagram labeling; form / note / table / flow-chart / summary /
    sentence completion; short-answer questions.
  - Reading: matching headings; matching paragraph information; matching features; matching sentence endings; True /
    False / Not Given; Yes / No / Not Given; multiple choice; list of options; short answer; sentence / summary / table /
    flow-chart completion; diagram labeling.
  - Speaking: know the format. Writing: how to write a Task 2 essay academically (basics). **NO Task 1 at this level.**
  - The most common IELTS topics, so students get ideas to speak and write about.
- **IELTS 7+ = Writing + Speaking mastered:** one dedicated day for Speaking, one dedicated day for Writing (Task 1 or
  Task 2), one day for a Listening + Reading recap. Task 2 question types first (agree / disagree, advantages /
  disadvantages, and the other types), then Task 1 (the user said "chain charts" = probably line charts / change over
  time; ASK), compare charts, maps, processes, mixed charts. Strengthen general English: fluency (producing sentences,
  giving ideas), academic vocabulary.
- **General English inside IELTS:** articles, podcasts, TED Talks for real reading / listening, then practice with the
  Official Guide to IELTS and mock tests the user makes themselves ("you just need to write what"). NOTE: their
  message puts the general-English / fluency / articles-podcasts-TED part between the two levels; ask which level(s) it
  belongs to (probably both).
- **Still open:** which Research-tab ideas to add to all levels (watch-out mistakes + exit check; 4-3-2 fluency;
  placement check + parent report; catch-up week, error log + codes, project). Our class time to the end of B2 is
  ~220 h vs Cambridge's ~500–600 guided hours (told the user, in the Research tab).
- **How to proceed:** design the 120-minute routine for each lesson type (a fixed routine students know), build
  `data\ielts1.py` again (12 weeks, 3 lessons, 20 + 10 words, `I1_CHECK` listing every question type and its weeks,
  each type taught and met again), show it in SHORT format, ask specific questions (AskUserQuestion with previews),
  then IELTS 7+. Then rebuild course.json / course.js / page, run the tests, push the app (sw VERSION teacher-v6).
  build_course.py already supports SPLIT/REVISE, HOMEWORK, MOCKS and I1/I2_CHECK; check_level.py `need = 10` for SPLIT
  must become 20 new words (+ 10 REVISE).

**teacher-v5 LIVE (20 Oct 2026; live tests passed: offline + teacher-levels.js on github.io; user: "when I swipe between upper intermediate and intermediate it goes to Home… make it go
level by level, not like a tab"):** level pager on Units and Books. The level part of the page is one block
`[data-lvpane]` (Units: `.lv-pane` = level card + list; Books: `.bk-body`). A sideways swipe moves it with the finger and
the neighbouring level slides in beside it; only at the first / last level does the swipe go to the next tab. Chip taps
slide the same way. The neighbours are drawn ahead of time (`lvPrep`, on idle after draws and in prewarm) and parked
just off-screen in `.lv-layer` (inside the viewport), so a swipe only moves ready pictures (first move < 16 ms at 4x
CPU). The new level is chosen when the finger lifts (`lvSet` + `lvChips`), the arriving picture is tappable at once
(`.live`), and the page is redrawn when the slide ends (`R.lvEnd`). IELTS levels are now `planned()`; week cards show
`u.mock`; `weekOf` clamps to the level's weeks. Test: `Tests\teacher-levels.js` (21 checks, real pointer events).

**teacher-v4 LIVE (20 Oct 2026, user: can't slide Books|Audio|Videos; pull-down only works from the top):**
bindSheetDrag works from anywhere (fields too): a vertical move waits while the panel is scrolled, then carries the
sheet down from the top (closes at > min(110 px, 20%) or a flick > 0.35 px/ms over 16 px). .tp-seg2.slide has a
.seg-thumb (--i/--n) that glides; bindSegSlide = press and slide. Keep a page's / sheet's top-level block count stable
(Books body wrapped in .bk-body, the form's program part in .f-prog) so setHTML keeps strips and switches.
Tests	eacher-gestures.js (real touch events). Note: from this computer github.io was very slow on 20 Oct (course.js
took 59 s), so live tests wait 45 s for the first load.
**teacher-v3 LIVE (20 Oct 2026, user: lags, "sometimes it takes two taps", Settings sheet cut off, "smooth like iPhones"):**
ring() used Math.random() gradient ids, so Home was rebuilt on every draw (lag + buttons replaced under the finger =
lost taps) → stable ids; Tests	eacher-stable.js proves a redraw with no change makes 0 DOM changes. Sheet panels and
.tp-list are grids → minmax(0,1fr) + min-width:0 so nothing is wider than the phone (teacher-sheets.js, teacher-width.js).
Screens are a stack (R.stack): Back slides the top away and the one below (class "under", shifted -24%) glides back
with its scroll; the pages shift too (R.vp.under) and are inert under a screen. Tab swipes finish at finger speed.
goBack() closes at once and skips its own popstate (R.skipPop). 4x CPU: worst frame gaps 25-50 ms. teacher-stack.js.
**teacher-v2 LIVE (20 Oct 2026, user: "make everything run smooth", Redmi Note 17):** new drawing engine in js/app.js
(frame() once; draw() → setHTML() replaces only changed top-level blocks; chip strips (.tp-segs/.tp-seg2/.tp-chips2)
keep their element, only classes change, and the chosen chip glides into view; screens are built with class "prep"
then slide in (afterPaint = 2 frames or 120 ms); sheets slide via a CSS transition, pull-down/flick/scrim-tap close
(bindSheetDrag, copied from Budget); unwind() ignores its own popstate). Bugs fixed: chip strips jumped (whole page was
rebuilt + offsetLeft measured from the wrong parent → Books slid to IELTS); sheets showed without the slide (the whole
app was rebuilt in the same frame); no pull-down / scrim tap; week screens were wider than the phone (.tp-list grid
items had min-width:auto with one-line subtitles) so they slid sideways (user's screenshot). Also: no backdrop blur on
the tab bar, prewarm() draws a lesson + sheet invisibly when idle. Tests in Tests\: teacher-flows.js (23 checks),
teacher-motion.js (frame-by-frame paths, 4x CPU), teacher-width.js (every screen at 360/393 px), teacher-offline.js
(live install + offline), teacher-shots.js (screenshots). Run them all before every push.
**REAL APP: LIVE since 20 Oct 2026 (teacher-v1) at https://kofklens682-max.github.io/Teacher/** (repo kofklens682-max/Teacher, Pages from main / root, switched on through the GitHub API with the user's OK; the user also made an unused empty repo "Teacher-"). Live test: `node Tests	eacher-offline.js` (installs, keeps data, opens offline) passed. Earlier notes: Folder `Apps	eacher-apppp\` = a git repo
(branch main, author = GitHub noreply, remote origin = https://github.com/kofklens682-max/Teacher.git, one local commit,
NOT pushed: the user must first create the empty public repo "Teacher" on GitHub, then Settings → Pages → main / root).
Site will be https://kofklens682-max.github.io/Teacher/ — NEVER change it (data is per site). Same origin as Budget and
Notes: storage names "teacher-app-v1" (localStorage), "teacher-app" (IndexedDB), caches "teacher-…" only.
Files: index.html, style.css (= planpp.css + app-v4.css + app5.css + app6.css + a full-screen part at the end),
js/icons.js (tools\make_icons.js: `node tools/make_icons.js <lucide 0.469.0 umd> app`), data/course.js
(`py datauild_app_data.py` after build_course.py), js/store.js (saving, second copy, daily copies, files),
js/app.js (all screens), sw.js (VERSION teacher-v1: bump it on every update), manifest, icons/ (icon.svg rendered with
PyMuPDF; MuPDF ignores SVG gradients, so the icon is solid #5468FF).
Updating the course in the app: edit data\*.py → `py build_course.py` → `py build_app_data.py` → bump VERSION in
app\sw.js → commit → push. Local preview: launch config "teacher-app" (port 5194). Test: `node Tests	eacher-shots.js`
(fresh headless phone, sample groups, screenshots in Tests\out	eacher, timings).
Tested 20 Oct: create group (form keeps typing, Enter adds students), register taps in place (0.45 ms), Save + toast,
taught/undo, phone Back button (sheet first, then screen), attendance ring, last-8 history, edit group (removed students
keep their records), own program, remove group (two taps), Books PDF/audio/link (two-tap remove), backup → restore
identical, automatic copies, losing the quick copy (comes back from IndexedDB), all 170 lesson screens, no overflow at
375 px, tab switch 43 ms at 4x CPU. Bugs found and fixed while testing: a function named history() hid window.history;
history.go(0) reloaded the page on restore (now unwind()); [hidden] needed a CSS rule; chip strips 2 px too wide.
Not built yet (from section 5): printable lesson sheets, tests with answer keys, exact video links per lesson.

**Books record (user, 20 Oct: "keep the record of the books"):** `data\book_map.py` gives every lesson its Vocabulary
in Use unit(s) (126 of 129 lessons in Beginner–Intermediate have one; the gaps are "Things I want to do", "What would you
do?" and "Marie Curie, who…") and extra grammar units where the main grammar book has none (Elementary W11 L3 =
Basic Grammar in Use 112–113; Pre-Int W10 L1 / W10 L3 / W12 L2 = Murphy blue 98 / 102 / 24; Upper-Int W11 L3 = Murphy
blue 39, 41, 59, 35). The app shows "Practice: …" on each lesson. Advanced Grammar in Use 3rd ed contents (units 1–100)
were read from the scan: 7 = past perfect continuous, 11 = future continuous / future perfect (continuous), 18–19 =
must / needn't, 21 = linking verbs (seem, appear), 25 = it is said that, 58–59 = participle clauses, 78 = viewpoint
adverbs, 82 = contrasts, 84 = If 2, 87 = connecting ideas, 98 = it- and what-clauses (cleft), 99–100 = inversion.
**The user wants every lesson to be ENJOYABLE, with its own activity** (for example: describe the animal in the picture;
the student finds a person from a relative-clause description). **After Upper-Int is final: build the REAL APP**, like
the Budget and Notes apps, installed on the user's phone.

**Beginner weeks:**
1. Animals: can / have / like
2. People and family: be, possessives
3. Daily life: present simple
4. Food and shopping: some / any, I'd like, this / these
5. Home and town: there is / are, prepositions, imperatives
6. Free time: like + -ing, can, going to
7. Jobs: present simple for jobs; present continuous and comparatives only as ready phrases learned by heart
8. Vacations: was / were, could, past simple

**Elementary weeks**
- **Present:**
  1. Lifestyles: present simple (+, then − and ?, then frequency)
  2. Life online: present continuous rule; simple vs continuous
  3. School and work: present tenses; have to; can / could
- **Future:**
  4. Plans: going to (+, then − and ?, then invitations)
  5. The future world: will; will vs going to
- **Past:**
  6. Famous lives: past simple (+, then − and ?, then Wh- and time phrases)
  7. Mysteries: past simple in stories; was / were + feelings; adverbs
  8. Experiences: "Did you ever…?"; superlatives; "How was it?"
- **Modals and comparing:**
  9. Health: imperatives, should, must / mustn't / don't have to
  10. Shopping: much / many; comparatives rule; review + too / enough
  11. Free time and tech: like / enjoy + -ing, would like to, phrasal verbs
- The user **moved these A2 points to Pre-Intermediate**: present perfect, past continuous, zero / first conditional,
  present continuous for arrangements.

**Pre-Intermediate weeks (FINAL):**
1. Accidents: past continuous (+, then − and ?, then when / while)
2. Books and stories: narrative tenses, used to, **relative clauses who / which / that / where** (linking words moved
   into the weekly writing, starting with the Week 2 book review)
3. Travel adventures: present perfect (+, then ever / never, then been / gone + superlatives)
4. News and media: just / already / yet (+ note: Americans also say "I just ate. Did you eat yet?"); for / since;
   present perfect vs past simple
5. Events: present continuous for the future; will / going to predictions (a review, user kept it); may / might
6. Environment: zero conditional, first conditional + unless, when / as soon as
7. Dreams and wishes: second conditional (+, then − and ?, then 1st vs 2nd)
8. Rules and the law: **had to / will have to (+ have to vs must), make / let / be allowed to, be supposed to /
   should / had better** (replaced must / mustn't / don't have to, which Elementary already taught)
9. Science and inventions: passive (present, then past, then questions)
10. Movies and TV: -ed / -ing adjectives, too / enough + intensifiers (a review, user kept it), so / such
11. Communication: question tags, indirect questions, reported speech (first step)
12. Careers: must / might / can't (deduction), future continuous, tense review

How the user answered the Pre-Int questions: 4000 EEW = yes, 1 unit a week; Fable Cottage = "1 time in 2 weeks, so to
have rest of formal English but not watch all the videos before Intermediate"; graded readers = 1 book a month; my
fixes: kept Week 8 and the relative clauses, and turned down the W5 L2 / W10 L2 replacements and the W4 L2 "trends"
word list. Small fixes also made: Basic Grammar in Use units (W9 L3 = 20, 22; W10 L1 = none; W11 L1 = 39; W12 L1 = 27),
"national holiday", "departure board", "practice" (American) in the app, and "unit 13" instead of "units 13".
In the data file: `EEW`, `FABLE_WEEKS`, `READERS`. build_course.py turns them into homework lines, a `reader` field
(the book chat) and the `eew` / `reading` rows on the week cards; the page's `watchRow()` shows VOA and Fable Cottage
together.

**Left for Intermediate** (`B1_LATER`): 3rd conditional, past perfect, present perfect continuous, reported speech in all
tenses, should have / might have, past tense responses.

**Next step: Intermediate (B1+)**, built the same way (short format → specific questions → final). Use the Core
Inventory B1 rest (`B1_LATER`) and the start of B2, with more speaking and academic language (the user's rule: from
Intermediate on, more speaking-based, academic and complex). Carry on: VOA Level 2 from Lesson 12 (or decide with the
user), Fable Cottage from story 7, 4000 EEW from Book 1 Unit 13, readers (Bookworms Stage 4?). Ask about these
specifically. Then Upper-Intermediate and the IELTS levels.

**Intermediate (FINAL v2, 20 Oct 2026):** see `data\intermediate.py` (WEEKS with `bridge=True` for weeks 1–2, REVISE,
USE, REVIEW, TOPICS, EXTRA, B1P_CHECK, B1P_LATER). The user's answers: bridge = 2 weeks; bridge words = 10 new + 10
revision; the named 15-minute review slot is for Intermediate ONWARD ONLY (Beginner, Elementary and Pre-Int stay as
they are); watching = "90% for BBC and others, but sometimes if needed we can use VOA". So L1 = a BBC Learning English /
LearnEnglish Teens video, L2 = BBC 6 Minute English, L3 = a story (Fable Cottage 7–12 / Easy Stories), and VOA Level 2
L12–23 is only an "easier option" (`watchAlt`). The grammar book is Murphy blue (British-only parts skipped). Left
for Upper-Int (`B1P_LATER`): mixed conditionals, past perfect continuous in depth, future perfect continuous, needn't
have, "it is said that…", in spite of / despite.
**Next: Upper-Intermediate (B2)**, the same way. The user's earlier plan for B2 = vocabulary + skills (note-taking,
finding information, summarising, retelling) + a short "fix my mistakes" grammar slot, plus TED-Ed. Keep the review
slot and the repetition rule. The old B2 data in build_course.py is to be rebuilt.

**Checks to run on every new level:** `py check_level.py <levelfile>` in `data\` (add the new file to `ORDER` in it
first). It checks counts, repeats inside the level and with earlier levels, and British-looking spellings. Also check by
hand: the Basic Grammar in Use unit numbers (contents list in `data\books\am-9781316646748-frontmatter.pdf`), and that no
whole lesson re-teaches grammar from the level before.
The repeats the script found in Beginner and Elementary are FINE (user: repetition is key), so they stay as they are.
The rules:
- every lesson has exactly 20 words (Intermediate bridge lessons: see intermediate.py), 5 collocations and 2 phrasal verbs
- repeats are welcome as REVISION; the script lists them only so the new-word list really holds new words
- every subtopic has an entry in TOPICS and EXTRA
- all grammar on the level's Core Inventory list is mapped
- American spelling throughout

## 4. Files and how to build

All files are under `C:\Users\Hp\Desktop\Claude code\Apps\teacher-app\`:

- **`data\`**
  - `build_course.py`: run `py build_course.py`, which writes `course.json`. `PLANNED = {A1: beginner, A2: elementary,
    B1: preintermediate}`. Each planned level is built from its module's `WEEKS`, `TOPICS` and `EXTRA`, plus one
    "Level test" unit (one lesson). The VOA numbering is set here too. Levels not yet planned still use the old data
    in this file.
  - Day tuple in WEEKS: `(subtopic, grammar examples, [20 words], [bgiu units], speaking task)`.
    `TOPICS[subtopic] = (vocabulary topic, grammar topic)`. `EXTRA[subtopic] = ([5 collocations], [2 phrasal verbs])`.
  - `books\`: official contents lists (Murphy red and blue, Vocabulary in Use Elementary 2e / Pre-Int & Int 4e /
    Upper-Int 4e, Basic Grammar in Use frontmatter, 4000 EEW word pages).
  - `sources\core-inventory.pdf` and `.txt`: the Cambridge-aligned level lists.
- **`plan\`** (the page with Course · App · Books tabs)
  - `template2.html`: the page itself. Its course tab code holds `STATUS` and `NOTES` per level, and `courseLvl` is
    the level shown.
  - `app5.js`: the teacher app model. `app-home.js` and `app-att.js` are the sources of the Home and Attendance parts,
    already spliced into `app5.js`, so edit them **in `app5.js`**.
  - Styles: `app.css`, `app-v4.css`, `app5.css`, `app6.css`.
  - `build_page.py`: run `py build_page.py`, which writes **`Course-plan.html`** (publish this file).
    `make_assets.py` writes `assets.json` (unit photos; not used by v5+, which uses icons).
  - Old files you can ignore: `template.html`, `app-block.js`.
  - Icons: **Lucide** from `https://unpkg.com/lucide@0.469.0/dist/umd/lucide.min.js`, through `ic("Name")`. Check
    that new icon names exist in `lucide.icons`.
- **Local preview:** launch config `teacher-plan` (port 5193) in `C:\Users\Hp\.claude\.claude\launch.json`. Open
  `http://localhost:5193/Course-plan.html#app`. Test by clicking with javascript_tool, and check that the phone pages
  have `scrollWidth == clientWidth` (no overflow).

## 5. The app model as it stands (the user approved these choices)

- **4 tabs: Home · Units · Attendance · Books.** You can swipe between them and press-and-slide along the floating tab
  bar, like the Budget app. Font: Inter. iPhone-style gradient icon tiles (Lucide), **no photos of people**. Book
  covers are **drawn** (series color, title, a big mark); the user found real cover photos weird.
- **Home = version C, group tiles.** Each tile shows the group name, level, number of students, next day and time,
  "Week n · Lesson n: subtopic" and an attendance ring. Tap the tile to open the lesson; each tile has its own
  **Register** button. There is "+ New group".
  - Versions A (schedule) and B (at a glance) are still in the code but not shown (`T.homeV = 2`).
- **Attendance = version B, "everyone is here, tap who isn't".**
  - Today's groups open with every student marked present. Tap a name: once = absent, twice = late, three times =
    here again. The book icon marks homework done or not. **Save** shows "X of Y here, Z did the homework".
  - Absent students have no homework.
  - The register screen has ‹ › to move between lessons and fix old ones, a "Last 8 lessons" grid (green / amber /
    red, and a dot when homework wasn't done), "Add a student", and "Edit group".
  - The journal and calendar versions are still in the code (`T.attV = 1`).
- **Units:** level chips → weeks (icon tile, subtopics) → week (goal sentence, 3 lessons) → lesson. The lesson screen
  shows:
  - the **Grammar topic** with its examples, and the Basic Grammar in Use units
  - the **Vocabulary topic** with 20 word chips, **Collocations** and **Phrasal verbs**
  - Watch & talk (VOA lesson), speaking, homework checklist
  - **Edit** (your notes, a video link, extra homework) and **Mark as taught** (moves the group on one lesson)
  - Levels not yet planned show "planned next".
- **Groups:** + New / Edit group sheet with:
  - name
  - program: any level, or **"Own program"** with its own book (for kids who start from letters, for example
    "Kids 3B · Family and Friends 3")
  - "They are on Week / Lesson" (to repeat a lesson or jump ahead)
  - days, time, students (add / remove), and remove group
- **Books:** level chips, then a **Books | Audio | Videos** switch. Books shows drawn covers of the real PDFs (tap opens
  the PDF), with "+ Add audio" and "+ Add a link". Video links per level are real sites: VOA, Fable Cottage, Easy
  Stories in English, LearnEnglish Teens, BBC 6 Minute English, TED-Ed, TED.
- **Sample data:** today is **Monday 19 October 2026** (an earlier version wrongly showed the 20th).
  - Group A: Beginner, Mon/Wed/Fri 14:00
  - Group B: Elementary, Mon/Wed/Fri 16:00
  - Kids 3B: own program, Tue/Thu 10:00
  - Group C: Beginner, Tue/Thu/Sat 15:00
  - Group 1: IELTS 5.5–6.5, Mon/Thu 18:00
- **Still to do for the REAL app (after the user says "do it")**, using the same patterns as the Budget and Notes PWAs:
  - make it a real offline PWA with storage that persists, backups, and safety copies
  - real PDF opening, real audio files
  - exact checked video links per lesson
  - a printable lesson sheet per lesson (words, sentence tasks, Russian → English sentences)
  - the kids' programs
  - tests with answer keys

## 6. Books folder

`Desktop\Claude code\Books\` has **7 level folders**, from `1 Beginner (A1)` to `7 IELTS 7+`. The files are **NTFS hard
links**: a book used in two levels is one file on disk.

Contents:
- **Beginner:** VIU Elementary 2e
- **Elementary:** Murphy red, VIU Elementary 2e, Oxford Stories for Reproduction 1
- **Pre-Int:** Murphy red, VIU Pre-Int & Int **2nd ed**, 4000 EEW 1 and 2
- **Intermediate:** Murphy blue 5e, VIU Pre-Int & Int 2e, 4000 EEW 2 and 3
- **Upper-Int:** Murphy blue, VIU Upper-Int 4e, 4000 EEW 3 and 4
- **IELTS 5.5–6.5:**
  - Official Cambridge Guide, IELTS Trainer 2, Basic IELTS Listening
  - Cambridge IELTS 12, 14 (this copy is incomplete: 95 pages), 16
  - 4000 EEW 4, VIU Advanced 3e, Advanced Grammar in Use 3e
  - 1000 Collocations, Advanced Grammar for Speaking
- **IELTS 7+:** Cambridge IELTS 17, 18, 19, 21, the Official Guide, 4000 EEW 5, VIU Advanced, Advanced Grammar in Use,
  1000 Collocations, Advanced Grammar for Speaking

Originals are in Downloads, Downloads\Telegram Desktop and Desktop\IELTS PREP.

Also in `Desktop\Claude code\`:
- `Apps` (budget-app, notes-app, apps-sync, notes-ai, notes-push, teacher-app)
- `IELTS writing checker` (the Notes app's essay-checker calibration)
- `Spin and Say` (games + photos, sounds, voices, build-tools)
- `Tests` (test kit)

The user deleted the old "to delete" folder.

## 7. Mistakes I made before (don't repeat them)

- I went too slow and stretched the course. I built weeks around grammar instead of topics. I used trivial topics.
  I used British forms. I wrote minute-by-minute agendas.
- I didn't name the grammar topic, and I used photos of people.
- I showed the wrong date (today is Monday 19 October 2026). Week numbers counted across levels instead of restarting.
- Wide tables pushed the phone screen wider than the phone. Always check page width.
- I leaned too much on book order instead of logic.
