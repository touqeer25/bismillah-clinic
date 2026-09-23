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
