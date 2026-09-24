# bismillah-clinic
Patient Management System for Homeopathic Clinic

## Repertories (Sep 2026 update)
| key | Book | Files |
|---|---|---|
| publicum | Repertorium Publicum | repertory-data.json, repertory_chapters/ |
| kent | Kent (English, homeoint-verified) | kent_repertory.json, kent_chapters/, **kent_rubric_notes.json** (Homeosetu meaning / patient version / when-to-use / clinical tags for 962 rubrics) |
| kent_de | Kent (German) | kent_de_chapters/ |
| synthesis91 | Synthesis 9.1 supplement | synthesis91_raw_* |
| allen_fever | Allen Fever Repertory (38 ch, 6,491 rubrics) | allen_fever_repertory.json, allen_fever_chapters/ |
| hs_clinical | Clinical Repertory — Clarke/Boericke/Allen/Hering/Hempel/Pulte (6 ch, 4,917 rubrics) | hs_clinical_repertory.json, hs_clinical_chapters/ |
| keynotes_cc | Repertory to Keynotes & Clinical Concordance (29 ch, 691 rubrics) | keynotes_cc_repertory.json, keynotes_cc_chapters/ |
| nosodes | Intercurrent Nosodes & Sarcodes (24 ch, 269 rubrics) | nosodes_repertory.json, nosodes_chapters/ |

`remedy_names.json` = abbreviation → full Latin name (788 remedies), shown as tooltip on remedy chips.
Book registry: `REP_BOOK_INFO` in `js/08-app-repertory.js` (color, chapDir, dataFile, keepOrder, notesFile).

## v54 — ☑ Compare Mode, analysis rules, Combine/Merge (HomeoSetu parity)

- **☑ Compare Mode** (toolbar button): every rubric card / list row / search result / sub-rubric card gets a checkbox; tick = added to the **active clipboard**, tick again = removed. Sidebar shows `N selected · total` + chips of the active clipboard (✕ removes), "🌐 search all books" and "⇄ compare clipboards". Detail page has a `+ Compare / ✓ Compared` toggle. Sidebar **Analyze** opens the Workbench **Grid** (all clipboards, weights, elimination).
- **Rules bar** (Workbench + Analysis Grid), persisted in `localStorage.bc_rep_ana_opts`:
  - Elimination: `every` (HomeoSetu — remedy must be in **every** rubric of an Elimination-Mode clipboard, default) or `any` (classic union).
  - Coverage: `count` (HomeoSetu — each rubric counts 1, weight affects only the score, default) or `weighted` (classic).
  - Grids now show a **Score (grade × weight)** row under Coverage.
- **⊕ Combine (n) / ⧉ Merge 2→1** per clipboard in the Workbench: tick ☑ rubrics, then combine into one rubric (union of remedies, higher grade kept). Combined items store their remedies (`remsObj`) and sources; **⊖ Uncombine** (⋮ menu) restores the originals. Opening a combined item opens its first source.

## v55 — 🔬 Remedy differentiation / extraction (`js/08b-rep-differentiation.js`)

RadarOpus-style "compare remedies": pick 1–5 remedies → rubrics where they differ, over the open chapter / whole book / all 8 books.
- **Exclusive** (only one of the chosen remedies present) · **grade difference** · **partial** · **common**; score = grade × specificity, specificity = 1/log2(2+N) (small rubric + high grade first); sort by score or grade-first; filters: rubric size ≤ 10/30/60/100/200/all, min grade.
- **Rubric mode** (from a rubric page): every remedy of the rubric profiled over its sub-rubrics and "(See …)" related rubrics; rare features ⭐; ranking normalised by remedy size (polychrest correction).
- **Single remedy** = keynote extraction. **Books witness** = same theme (auto words from title + cross-refs, editable) in the other books, only rows containing the chosen remedies.
- Rows: ☑ add to active clipboard, click = open rubric, 📋 marker if already in a clipboard. Entry points: rubric page «🔬 تفریق», Workbench/Analysis grid «🔬 top 3/5», Ask AI.
- Checklist: `DIFFERENTIATION_CHECKLIST.md`. Tests: `node tests/differentiation.jsdom.test.js`, `node tests/repertory_ui.jsdom.test.js` (jsdom).

## v56 — 📖 Materia medica (public domain) + 🤖 drafts + ✍ notes (`js/08c-rep-materia-medica.js`, `mm/`)

Four complete books, converted from homeoint.org (public domain) by `tools/mm_build/build_mm.py`:

| id | book | remedies | words | file |
|---|---|---|---|---|
| kent_lectures | Kent — Lectures on Homoeopathic Materia Medica (1905) | 180 | 440k | mm/kent_lectures.json (2.65 MB) |
| boericke | Boericke — Pocket Manual of Materia Medica (1927), sectioned (Mind, Head … Modalities, Relationship, Dose) | 617 | 164k | mm/boericke.json (1.36 MB) |
| allen_keynotes | H.C. Allen — Keynotes and Characteristics (1898) | 183 | 55k | mm/allen_keynotes.json (0.39 MB) |
| nash_leaders | Nash — Leaders in Homoeopathic Therapeutics (1913) | 216 | 119k | mm/nash_leaders.json (0.76 MB) |

629 remedies have text in at least one book (457 of the app's 633 Kent remedies have Boericke). Remedy names are mapped to the app's abbreviations (`tools/mm_build/names.py`; 71 Boericke entries without an app abbreviation are listed in the JSON `unmatched`). Text markers: `**bold**` = source emphasis (keynote), `_italic_` = characteristic emphasis.

- **📖 tab** in the differentiation window: per remedy the sentences matching the theme words (auto from rubric title + cross-refs + synonym table `REP_THEME_SYN`), each with a reference `[Book § Section]`; **🤖 auto draft** = extractive pick (≤4 sentences, ≤2 per book, unverified); **✍ note editor** per rubric × remedy (draft / ✔ approve / delete), stored in `localStorage.bc_rep_diff_notes`, 📤 export / 📥 import JSON.
- **📖 viewer** (rubric page → "📖 materia medica", or from the tab): full text per book with in-text theme search and highlighting.
- **Seed drafts** `mm/drafts_seed.json` (ABSENT-MINDED × nat-m, nux-m, apis, lach, sep; EN + UR with references) are merged once on first load, never overwriting existing notes.
- **LLM pipeline** (optional): `tools/mm_build/make_llm_batch.py kent mind r2 --remedies nat-m,ign` builds a batch (structural facts + excerpts) and the prompt `llm_draft_prompt.md`; with `OPENAI_API_KEY` it calls the API and writes `*.drafts.json` importable via 📥.
- Data is lazy-loaded (first use ~5 MB) and cached by the service worker at runtime; `mm/_index.json` and `mm/drafts_seed.json` are core assets.

## v57 — four more public-domain books + Qdrant tools

| id | book | remedies | words |
|---|---|---|---|
| lippe_keynotes | A. von Lippe — Keynotes of the Homoeopathic Materia Medica (1866) | 122 | 15k |
| hutchison_700 | J.W. Hutchison — Seven Hundred Red Line Symptoms (1900) | 140 | 11k |
| guernsey_keynotes | H.N. Guernsey — Key-notes to the Materia Medica (1887), sectioned | 192 | 59k |
| allen_primer | T.F. Allen — A Primer of Materia Medica (1892) | 266 | 117k |

8 books total, 642 remedies with text (mm/ = 6.4 MB, lazy-loaded per book). Builder: `tools/mm_build/build_mm.py lippe hutchison guernsey primer` (generic anchor-per-remedy and page-per-remedy parsers).
`tools/qdrant_export.py` — inspect / back up the clinic's Qdrant Cloud collection (`--list`, `--export backup.jsonl`, `--export-text dir/`); read-only, REST only. Keep exports private if the PDFs are copyrighted.

## v58 — 12 public-domain books + 🔒 private books (device-only)

New books (homeoint.org): Boger — Synoptic Key, Part 2 Synopsis (305 remedies; Region/Worse/Better/Synopsis sections) · Boenninghausen's Characteristics (138, sectioned) · Dewey — Essentials (274, Q&A) · Allen's Clinical Hints (327). **12 books, 658 remedies, mm/ = 8.4 MB.**

**🔒 Private books**: copyrighted PDFs (e.g. the clinic's Qdrant collection) are never put in this public repo. `tools/qdrant_to_private_books.py backup.jsonl.gz out/ --merge` converts the Qdrant backup into page-based JSON (`{id,title,author,year,private:true,format:'pages',pages:[{p,t}]}`); import it in the app (🔬 → 📖 tab → «🔒 نجی کتابیں» → 📥). Books are stored in the browser's IndexedDB (`bc_private_books`) on that device only, appear with a 🔒 badge in the 📖 tab, drafts and viewer; per-remedy matching = pages that mention the remedy name/abbreviation; the viewer has a "whole book" search for private books. Delete with ✕ in the panel.

## v59 — notes on the rubric page, shared notes, seed drafts v2

- Rubric page: new section **✍ تفریقی نوٹس** listing this rubric's notes (approved first, then drafts, each with status, source and references) and ✎/✔ marks on the remedy chips; «✎ ترمیم» opens the 📖 tab.
- **Shared notes**: commit the app's export as `mm/notes_shared.json` → every device merges it on start (an approved shared note overrides a local draft; a locally approved note is never overwritten by an older shared draft).
- Seed drafts v2 (`mm/drafts_seed.json`, 15 notes): ABSENT-MINDED, GRIEF ailments from, CONSOLATION agg. × 5 remedies each, EN + UR, every claim referenced to the 12 books or to repertory facts (`[Rep: …]`). Seeds merge once (version flag), never overwrite.

## v60 — Clarke's Dictionary + Farrington (archive.org OCR)

| id | book | remedies | words | notes |
|---|---|---|---|---|
| clarke_dictionary | J. H. Clarke — A Dictionary of Practical Materia Medica (1900–02), complete | 634 (501 of the app's Kent remedies) | 1.06 M | sections: Clinical / Characteristics / Relations / Causation + the 27 numbered symptom sections (Mind … Fever); source `archive.org/details/clarkes-a-dictionary-of-practical-materia-medica` (clean OCR); 7.6 MB |
| farrington_clinical | E. A. Farrington — A Clinical Materia Medica (lectures, 1887) | 75 remedy lectures | 0.2 M | comparative lectures ("Cina and Chamomilla") are attached to each remedy named; family/group lectures kept as essays; source `archive.org/details/clinicalmateriam00farr` |

Builder: `tools/mm_build/ocr_books.py clarke <djvu.txt>` / `… farrington <djvu.txt>` (OCR-aware: page headers, hyphenation, joined title lines, strict remedy-heading matching). **14 books, 752 remedies with text, mm/ = 18 MB** — books load lazily and progressively (the 📖 tab fills in as each book arrives; first use ~26 MB, then served from the service-worker cache).

## v61 — import fix, Hering Condensed, full-app smoke test

- **Fix**: the 📖 tab had two similar import buttons; choosing the private-books file in «📥 notes import» reported "0 notes". Both importers now detect the file type and route it (private-books file → 🔒 private import; notes file → notes import; anything else → clear warning). Labels renamed («📥 نوٹس امپورٹ», «📥 نجی کتابیں امپورٹ (JSON)» inside the 🔒 panel), progress toast while a big file is read.
- **Hering — Condensed Materia Medica (1877)**: 145 remedies (of 184), 48 numbered sections (Mind, Sensorium, Head Inner … Stages of Life), from archive.org OCR (`tools/mm_build/ocr_books.py hering`). **15 books.**
- `tests/app_smoke.jsdom.test.js`: loads the real `index.html` with every script from the local server, asserts no script errors, then walks the main flows (chapter → Compare Mode → rubric page → 🔬 window → 📖 tab). Run with `python3 -m http.server 8080` in the app folder.
- Note: `index.html` ends with a Cloudflare "challenge-platform" snippet (saved from a proxied page); it only 404s on GitHub Pages and can be removed.

## v62 — 📖 tab layout & draft quality

- Layout: remedy cards flow in **masonry columns** (2 columns ≥ 900 px, 1 below) instead of a rigid 4-column grid with gaps; card header = remedy + «📖 full text», then a compact availability line (books with matches first, counts as superscripts, `+n` for the rest); private-books panel is a compact 2-column scrollable list.
- Draft quality: **junk filter** (index/contents pages, sentences with many page numbers, ALL-CAPS lists, > 420 chars), **section relevance** (for a Mind rubric: Mind/Mental sections +3, generic sections +0.5, physical sections −2.5; for other chapters the matching section is boosted), de-duplication, private books ≤ 3 sentences and ≤ 1 in the draft, score threshold ≥ 2.
- Theme words: stems of ≥ 5-letter words keep 3 letters (sadness → sad); synonym entry for BROODING.

## v63 — 📖 tab redesigned: writing mode (Design E) + summary table + mobile stack

- **Left pane**: remedy chips (✎/✔ marks) → one remedy at a time: header + book badges with counts, 🤖 draft, all matching sentences per book, **📗 repertory facts** (this remedy's exclusive rubrics from the 🎯 tab) — every sentence/fact has **«＋ نوٹ میں»** which appends it, with its reference, to the note.
- **Right pane**: the note editor for (rubric × selected remedy), sticky while scrolling (save draft / ✔ approve / delete / adopt draft), plus the other notes of the same rubric (click = switch).
- **📊 سب کا خلاصہ**: Design-B table (remedy · first 2 draft sentences · sentence count · note status), rows switch the pane.
- ≤ 900 px: panes stack, the editor sticks to the bottom (Design C behaviour). Design board: `docs/mm_tab_layouts.html`.

## v64 — Hering's Guiding Symptoms (complete)

`hering_guiding`: **394 remedies** (383 of the app's Kent remedies), 1.9 M words, Hering's 48 sections per remedy (Mind … Relations), θ marks kept for cured clinical conditions; source `archive.org/details/herings-guiding-symptoms-of-our-materia-medica-1891_20240318` (single clean OCR of the 10 volumes), 12 MB JSON (≈2.5 MB gzipped over the wire). Builder: `tools/mm_build/ocr_books.py hering_gs <djvu.txt>`. **16 books, 758 remedies with text, mm/ = 31 MB** (lazy, progressive, cached).

## v65 — Allen's Materia Medica of the Nosodes (key-notes)

`allen_nosodes`: Medorrhinum, Psorinum, Secale, Syphilinum, Tuberculinum, Lac defloratum — symptom lines with Allen's grades (II → **bold**, I → _italic_, θ clinical), from the PDF text layer of the public-domain 1910 book (Dr Nancy Malik's collection). Builder `tools/mm_build/allen_nosodes.py <pdf>` (needs `pip install pymupdf`). **17 books.**

## v66 — Lippe Text-book + Kent New Remedies

- `lippe_textbook`: A. von Lippe — Text-book of Materia Medica (1866), 139 remedies, sectioned (Mind and Disposition, Head … Relations), archive.org OCR (`ocr_books.py lippe_tb`).
- `kent_new_remedies`: Kent — New Remedies (28 remedies: Alumina phos./sil., Aurum ars./iod./sulph., Calcarea iod./sil., Ferrum ars./iod., Kali ars./bi./mur./sil., Natrum sil./sulph., Vespa, Wyethia, Zincum phos. …), homeoint HTML (`ocr_books.py kent_new <dir>`). **19 books, 760 remedies.**
- Hering's Analytical Repertory of the Mind (1881, OCR readable) is next — as a *repertory* book (rubric → remedies) rather than MM text.

## v67 — 9th repertory: Hering's Analytical Repertory of the Symptoms of the Mind (1881)

Converted from the archive.org OCR (`63731360R.nlm.nih.gov`) by `tools/mm_build/hering_mind_repertory.py` into the app's repertory format: **56 chapters** (Part I "Ailments from emotions and exertions of the mind" + the body regions of Part II "Mental concomitants of bodily symptoms"), **10,018 rubrics, 13,914 remedy references, 313 remedies**. Rubric titles are `Section, phrase[, sub-phrase]` so the prefix tree nests them; grades from Hering's marks where the OCR kept them (II → 3, I → 2, else 1). Remedy abbreviations (Hering style: "Natr. mur.", "Laches.") mapped to the app's; ~91 % of tokens resolved, the rest listed by the script. Files: `hering_mind_repertory.json`, `hering_mind_chapters/`. Selectable in the book dropdown («🧠 Hering — Analytical Repertory of the Mind»), works with search, Compare Mode, clipboards, Workbench and 🔬 extraction like the other books.

## v68 — three small books from Dr. Nancy Malik's list (Boericke–Dewey · Allen's Therapeutics of Fevers · Boger's Times)

Sources: homeoint.org (Boger, Séror edition) and the homeopathybooks.in text mirrors of the same public-domain books
(the mirror Dr. Malik's page links to). Crawled with the new `tools/mm_build/crawl_wp_pages.py <index-url> <out-dir>`.

- 🕰️ **`boger_times` — 10th repertory**: C. M. Boger, *Times of Remedies and Moon Phases* (179 p.) →
  `tools/mm_build/boger_times_repertory.py`: **12 chapters, 2,606 rubrics, 12,354 remedy references, 354 remedies**.
  Boger's I/II marks survived in the Séror HTML as *colours* (maroon → grade 3, red → 2, plain → 1), so grades come from
  `COLOR=` spans, not from <b>/<i>. Chapter 12 is the Moon-Phases table (186 remedies × NL/PQ/PL/DQ counts → grade
  ≥10 = 3, ≥5 = 2). Abbreviations resolved against the app's own remedy keys first (Boger prints "Calc-c.", "Nat-m."),
  then `names.py`, then a 90-entry alias table; 126 of ~12.5k tokens stay unmatched (mostly words torn apart by the
  colour markup, e.g. "Fer-", "yc."). Files: `boger_times_repertory.json`, `boger_times_chapters/`.
- 🧂 **`tissues_bd` — 11th repertory**: Boericke & Dewey, *The Twelve Tissue Remedies of Schüssler* — the book's
  therapeutic part (Abscess → Yellow Fever) → **114 disease rubrics, 710 references, all 12 Schüssler salts**, the
  first salt named on a page graded 3 (Boericke's leading remedy) and the rest 2; each rubric keeps its indication
  text as `note` (shown under the card). `tools/mm_build/boericke_dewey_tissues.py`. Six pages of the mirror carry no
  salt list on the site (Dizziness, Enuresis, Marasmus, Mucous membranes, Scrofula/tuberculosis, Vaccination) — the
  book's own Repertory part (Part 4) is still to be added from the archive.org scan.
- 📖 **`allen_fevers` — 20th MM book**: H. C. Allen, *The Homoeopathic Therapeutics of Fevers* (1879) — the MM part,
  **131 remedies, 86,732 words**, with Allen's own stage structure kept as sections (Characteristic · Type · Time ·
  Cause · Prodrome · Chill · Concomitants of chill · Heat · Sweat · Tongue · Pulse · Apyrexia · Desires/Aversions ·
  Skin · Breathing · Relation · Clinical) so the 📖 tab and viewer read a fever remedy exactly as Allen wrote it.
  `tools/mm_build/allen_fevers_mm.py`. The mirror hosts 133 remedy pages of the book's 147 + 31 minor remedies.

Housekeeping: hard-coded `/home/user/bismillah-clinic` in `tools/mm_build/{names,ocr_books,hering_mind_repertory,make_llm_batch}.py`
→ `BHC_APP` env with the old path as default (scripts now run from any clone). Cloudflare's
`/cdn-cgi/challenge-platform/...` beacon that had been committed into `index.html` (since e4d7a5a) is removed — it was
the source of both `app_smoke` failures; the smoke test now also filters errors thrown from external <script>s and
the JS-dom stack slice was widened so that filter can see the frame. `index.html` script versions bumped,
`CACHE_NAME` → v76, both new repertories' index files added to CORE_ASSETS, tests cover 11 books / 20 MM books.

## v68.1 — making the new Allen MM book discoverable

`allen_fevers` was wired correctly but sat **last** in `repMMBookOrder`, and the 📖 Materia Medica row shows only the
7 badges with the most hits for the current theme — so on most remedies the new book was hidden behind the `+N`
overflow (it surfaced for 1 of 9 sampled remedies). Fix: it now follows `allen_keynotes` in the order (position 6 of
20) and surfaces for 9 of 9 sampled remedies; `mm/_index.json` and `mm/*.json` are fetched with `?v=2` and
`CACHE_NAME` → **v77** so a device holding the pre-v68 index re-reads it instead of showing 19 books.
`index.html` → `08c-rep-materia-medica.js?v=13`.
Note the two Allen fever books in the app are *different works*: 🌡️ `allen_fever` (10th slot in the repertory picker) is
Allen's fever **repertory** (rubrics → graded remedy lists), while 📖 `allen_fevers` is the **text/therapeutics** book
(prose under Allen's own stage heads) and lives in the Materia Medica layer only — it is deliberately not a repertory
entry, since that would duplicate the rubrics already in `allen_fever`.

## v68.2 — 🔒 private books: name the tab by the book, not by the author

Dr. Naveed's screenshot: the 📖 viewer's tab row carried twelve `🔒` tabs — `Kulkarni ×  Banerjea ×  Khulla ×  Julian ×
Vijayakar × Vijayakar × Vijayakar × Vijayakar × Sehgal × Vijayakar × Vithoulkas × Vijayakar ×`.
Those are the **private (copyrighted) books** imported through `tools/qdrant_to_private_books.py`: they live only in that
browser's IndexedDB and are never committed, so they wear a 🔒. The `✕` after a name was **not** a delete button —
`repMMRender` printed `' ✕'` for any tab where the *selected* remedy has nothing in that book (hence they all looked
disabled for `anac`). And the four/five identical `Vijayakar`s were real: `repMMShort()` labelled every private book with
the **last word of the author**, so Prafull Vijayakar's five books (Treasures, Predictive Homoeopathy I & II, its Charts,
Pediatric Acute Keynotes) and Preeti Vijayakar's one all printed the same surname.

Fix: private tabs now show the book's own title (26 chars, ellipsis); for a private book the `✕` became a real one-click
*remove from this device* (public books keep the plain `✕` marker, nothing new to press); `style.css` gained
`.rep-mm-tabx`/`.del`, `index.html` → `?v=14`, `CACHE_NAME` → **v78**. `materia_medica` test now covers both points
(distinct labels for one author; ✕ deletes that device-local book only).

If the imported set itself has duplicates (the same book imported under two ids from two PDFs, e.g. a book also sitting
inside `private_books_all.json`), they are separate IndexedDB records and cannot be told apart automatically — the new ✕
is there exactly so a redundant one can be dropped in a click.

## v68.3 — the 🔒 row can be silenced: «🔒 N چھپا دیں»

The private books are the copyrighted ones imported into this browser only (`tools/qdrant_to_private_books.py` →
IndexedDB), so they are never uploaded — that is what the 🔒 marks. Until now the 📖 viewer kept showing **every** one of
them with a `✕`, which reads as noise whenever the selected remedy has nothing in them (Dr. Naveed's two screenshots:
12 such tabs for `anac`, 12 for `hyos`, while the theme `abusive` matched 0 paragraphs in all of them).

One toggle fixes it: the row now ends with `🔒 N چھپا دیں` / `🔒 N دکھائیں`. Hiding affects **only that row** — the books
stay in IndexedDB, nothing is deleted, and the choice is remembered per device in `bc_rep_priv_prefs` (a private book
that *does* have something for the current remedy is never hidden). Deleting a redundant copy is still the `✕` inside the
private tab (v68.2). `index.html` → `?v=16`, `CACHE_NAME` → **v80**, `materia_medica` now asserts the toggle
(`23 → 21` tabs, label flips, tapping again restores).

## v68.4 — a 🔒 book that knows the remedy must not look dead

`repPrivRemedyRegex()` only accepted the remedy's **two-word** form ("Hyoscyamus niger"), so a book that writes plain
"Hyoscyamus" counted as knowing nothing — which is exactly what produced the walls of `✕` tabs in the two screenshots.
It now also matches the first word on its own (and the abbreviation, as before), so: the tab is **clickable** instead of
dead-looking, its remedy pages are found (`Absolute Homoeopathic Materia Medica` → 2 pages for Hyoscyamus in the test),
and the `🔒 N چھپا دیں` counter in v68.3 now counts only books that genuinely do not name the remedy. When the theme words
match nothing but the remedy *is* in the books, the note says so ("N کتابوں میں متن ہے — 📖 پورا متن دیکھیں") instead of
looking like an empty library. Covered by `/tmp/check_v684.js` in this session (10 checks); the four app suites and the
43 python tests pass.

## v68.5 — 🔒 private books now take part in the search (not just in the row)

v68.3/v68.4 made the private tabs *look* right; the doctor's actual ask was that they **count**. Three silent
handicaps were removed in `repMMMatches()` / `repMMDraft()`:
`if(priv&&plain.length>300) return` threw away every long private paragraph (it is now `>900`, i.e. only unreadable
wall-of-text is dropped — and note the cap is per *paragraph*, its individual sentences still compete);
the `-(priv?0.5:0)` penalty is gone (private pages now get `+0.15`, so one hit on a page they own is not outscored by a
public book's stray mention); and the per-book cap of `min(3,…)` for private books is gone — they get the same
`REP_MM_MAX_PER_BOOK` as the printed books. The 🤖 auto-draft no longer limits a private book to one sentence
(`cap=1` → `2`), and a new device preference `bc_rep_priv_prefs.inDraft` (default **on**) lets the doctor decide whether
private text may enter the auto-draft — the checkbox sits in the 🔒 panel. `tests/private_books_search.test.js` covers (with `tests/private_books_remedy_match.test.js` from v68.4)
all of it (10 checks). `index.html` → `?v=17`, `CACHE_NAME` → **v81**.

## v68.6 — v54/v55 audit fixes (clipboard migration, data cache-busting, Compare Mode persistence)

Checked the v54 (☑ Compare Mode, rules, Combine/Merge) and v55 (🔬 differentiation) layers against the code. Fixed:
- **`repClipsLoad()` lost saved clipboards**: the v39 migration padded stored boards up to 12 but assigned them only
  when the count was *exactly* 12, so a device that once ran a larger build (13+) came back with empty boards.
  It now truncates to 12 and warns about dropped items; `repClipsSave()` no longer swallows a failed write silently
  (quota-full was invisible — a doctor could lose a case's whole repertorisation).
- **data cache-busting was hard-coded and partial**: whole-book fetches carried `?v=14` in three places while
  `repChapDir()*_index.json` and the chapter index had **no** version at all, and `repCurrentBook` kept an
  hard-coded Kent index as an offline fallback. All book/chapter/index requests now share one constant
  `REP_DATA_V` (`v=15`) — bump it in one place.
- **Compare Mode was per-tab** (`sessionStorage`), so the checkbox toolbar turned itself off on every new tab/app
  restart; it is stored in `localStorage` now, reading the old key as a fallback.
Tests: `tests/rep_clipboards_versioning.test.js` (5 checks: 13→12 migration, round-trip, versioned fetches).
`index.html` → `08-app-repertory.js?v=63`, `CACHE_NAME` → **v82**. Not fixed here (needs a design decision, see
`homeopathy/v54-v55-audit.md`): the all-books scope materialises ~960k rubrics in one pass, and rows are capped
*before* sorting — both belong to the open P2.12 sharded-loading item.

## v68.7 — single-remedy extraction, and the size filter now runs *before* counting

Closed two of the three gaps found by comparing our v54/v55 layer with Radar Opus' remedy extraction (their
manual v3.1, pages 12/46/51, plus the company's own "How to do Remedy Extractions" tutorial):
- **`🧭 mode: extract one remedy`** in the differentiation head: pick one remedy → every rubric in scope that
  carries it, with grade and rubric size, plus two Radar-style extra filters — **single-remedy pages only** and
  **only where this remedy outranks the rest**. Counts shown: total / single-remedy / not-outranked / displayed
  (measured on Kent: `onos` = 255 rubrics whole-book, 16 single-remedy, 51 not outranked).
- **`📥 Take all into clipboard`**: the extracted list drops into the active clipboard (no duplicates), so
  Combine and the analysis work on an extracted page set exactly as on ticked rubrics.
- **filtering happens while collecting** (`repDiffRubricList(...,opts)`): the `📏 rubric size ≤` cap and
  "at least one selected remedy" are applied before objects are pushed, so large rubrics are never materialised,
  and the 271 empty *see-also* lines of Kent's MIND chapter are dropped too. A scan stop (`REP_DIFF_SCAN_STOP
  = 250000`) keeps the all-books scope from running away; when it bites, the result says so. Measured: whole
  Kent book (66,148 rubrics) filtered in 27 ms.
Not done, on purpose: the *source-grade* "repertory view" needs a small hand-made source table, not new book
data — plan and measurements in `homeopathy/book-data-plan.md`.
Tests: `tests/extraction_v687.test.js` (26 checks). `index.html` → `08b-rep-differentiation.js?v=4`,
`REP_DATA_V` → `v=16`, `CACHE_NAME` → **v83**.

## v70 — extraction parity: boolean search, Kent / Boenninghausen, print / CSV

- **Boolean rubric search**: space = AND · `OR` or `|` = alternative · `NOT word` or `-word` = exclude. Example: `fear dark OR anxiety night -company`.
- **Analysis method** (🧮 in the Rules bar, saved in `bc_rep_ana_opts.method`), in the Analysis Grid and the Workbench Grid:
  - `hs` Sum of Symptoms: coverage first, then score (default, same as before)
  - `kent` Kent, Sum of Degrees: total grade × weight first, then coverage
  - `boen` Boenninghausen + **Polarity**: for every `agg./amel.`, `worse/better` rubric the opposite rubric is looked up in the same chapter (Kent-style "X amel." ↔ "X" too). Polarity = grade − opposite grade. ⚠ = contraindication (higher grade in the opposite rubric); these remedies are ranked last.
- **🖨 Print / PDF** (landscape, up to 30 remedies) and **📥 CSV (Excel, UTF-8)** of the grid, including Coverage, Score and Polarity rows.
- Test: `node tests/extraction_v70.test.js`
