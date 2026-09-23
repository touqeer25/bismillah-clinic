# 🔬 Remedy Differentiation / Extraction — Checklist (v55)

Order = the order proposed in the discussion. `[x]` done · `[ ]` pending · `[~]` partial.

## A. Algorithm & data (no new data files)
- [x] A1 Remedy size index per book (rubrics containing each remedy) — computed once per book, cached in memory (`_repRemSizeCache`)
- [x] A2 Rubric vector per remedy set R (grade 0–3 per remedy) over the chosen scope
- [x] A3 Classification: **exclusive** (only one of R present) · **partial** (some present) · **grade difference** (all present, grades differ) · **common** (all present, equal grades)
- [x] A4 Specificity score `1 / log2(2 + N)` (N = rubric size); exclusive = grade × spec; grade-diff = (max−min) × spec; partial = Σgrades × spec
- [x] A5 Sort modes: `score` (default) / `grade` (grade first, then smallest rubric)
- [x] A6 Filters: max rubric size (10/30/60/100/all), min grade (1/2/3) — counts are always unfiltered, lists are filtered
- [x] A7 Polychrest correction for remedy ranking: `score / log10(size + 10)` (rubric mode)
- [x] A8 Scope: open chapter / whole book / all 8 books (uses existing loaders: `loadSingleBookData`, `repEnsureAllBooks`)
- [x] A9 Single-remedy mode (R = 1) = keynote extraction (same code path)
- [x] A10 Rubric mode (all remedies of the rubric vs. related cluster): sub-rubrics + "(See …)" targets + their sub-rubrics; feature rarity = 1/log2(2 + shared); rare features flagged
- [x] A11 Four-book witness: theme words auto-derived from rubric title + cross-reference targets (editable), searched in every other book; rows only where a compared remedy is present
- [x] A12 Pairwise summary (A vs B: only-A / only-B / both)
- [x] A13 "Already in case" marker (rubric present in any clipboard)
- [x] A14 Performance: whole Kent (65k rubrics) × 5 remedies < 100 ms; data cached after first run; long lists capped (400 rows/section, 60 features)

## B. UI ("🔬 تفریق" modal — independent of navigation history/flags)
- [x] B1 Entry: rubric detail page title-row button "🔬 تفریق" (opens in rubric mode with the rubric's remedies as picker chips)
- [x] B2 Entry: Workbench Grid summary button "🔬 ٹاپ 3 / ٹاپ 5 کا موازنہ" (top remedies of the grid)
- [x] B3 Entry: Ask AI keyword (تفریق / extraction / differentiate) → explanation + open button
- [x] B4 Remedy picker: rubric remedy chips (grade-sorted, toggle, max 5) + typed abbreviation with autocomplete from remedy_names.json
- [x] B5 Scope / max size / min grade / sort controls; settings persisted (`bc_rep_diff_opts`)
- [x] B6 Tabs: exclusive · grade difference · partial · common · rubric-remedies comparison · books witness · (single-remedy keynotes when R = 1)
- [x] B7 Summary strip: rubrics with any / all present / per-remedy exclusive counts / remedy sizes + pairwise matrix
- [x] B8 Result rows: ☑ add to active clipboard · book badge (all-books scope) · chapter › rubric (click = open rubric, modal closes) · N · grade dots · 📋 in-case marker
- [x] B9 Rubric mode table: rows = remedies (main grade desc, distinctiveness desc), columns = cluster features (rarest first), rare features listed per remedy; ☐ per row to pick 2–5 remedies → multi mode
- [x] B10 Books witness: grouped by book, rubric rows with grades of compared remedies, theme words input + re-run
- [x] B11 Copy result as text (📋)
- [x] B12 Urdu / English / Roman labels via `repLangText`; RTL-safe; rubric text `dir="ltr"`
- [x] B13 Keyboard: Esc closes modal; Enter in remedy input adds remedy
- [x] B14 Mobile: modal full-screen, controls wrap, tables scroll horizontally

## C. Integration & housekeeping
- [x] C1 New file `js/08b-rep-differentiation.js` (loaded after 08) — no edits to Kent data; 3 small hooks in 08 (detail button, grid button, Ask AI)
- [x] C2 CSS block appended to `css/style.css`
- [x] C3 `index.html` script tag + cache-busting versions; `service-worker.js` asset list + CACHE_NAME bump
- [x] C4 README section
- [x] C5 Regression: existing jsdom tests (Compare Mode, detail page cleanup) still pass
- [x] C6 New jsdom tests (`tests/differentiation.jsdom.test.js`, 47 checks; regression `tests/repertory_ui.jsdom.test.js`, 21 checks): algorithm counts on real Kent data (nat-m/ign/plat in Mind: any 780, all-present 101, exclusive 230/135/170), sort/filter behaviour, single mode, rubric mode (ABSENT-MINDED: nux-m rare "periodical attacks"), witness (Allen Fever "Absent minded"), UI flows (open, pick, run, ☑, close)
- [x] C7 Deliverable zip + patch against GitHub HEAD; Urdu summary with this checklist

## Phase 2 — Materia medica (v56)
- [x] P2.1 Download + parse 4 public-domain books from homeoint.org (Kent Lectures 180, Boericke 617, Allen Keynotes 183, Nash Leaders 216 remedies) — full books, not only Mind
- [x] P2.2 Remedy-name → app abbreviation mapping (aliases + token matching + modern→classic); unmatched listed in JSON
- [x] P2.3 Emphasis preserved (**keynote**, _characteristic_); Boericke sections; footers/noise stripped; no wrapped-line artefacts
- [x] P2.4 Theme lexicon: rubric title + "(See …)" + synonym table (`REP_THEME_SYN`, shared with books witness) + stop-words
- [x] P2.5 📖 tab: matching sentences per remedy with [Book § Section] references, ≤6 per book, highlighted
- [x] P2.6 📖 viewer: full text per book, remedy list of the rubric, in-text search + highlight, copy, Esc
- [x] P2.7 Lazy loading (~5 MB first use), SW runtime cache; `mm/_index.json` + seed in core assets
- [x] P2.8 Tests `tests/materia_medica.jsdom.test.js` (33 checks)
- [x] P2.9a v57: Lippe Keynotes, Hutchison 700 Red Line, Guernsey Key-notes, T.F. Allen Primer (homeoint.org) — 8 books, 642 remedies
- [x] P2.9b v58: Boger Synoptic Key (Synopsis), Boenninghausen Characteristics, Dewey Essentials, Allen's Clinical Hints — 12 books, 658 remedies
- [x] P2.9c v60: Clarke's Dictionary (complete, 634 remedies, sectioned) + Farrington Clinical MM (75 lectures) from archive.org OCR via `tools/mm_build/ocr_books.py`; 14 books, 752 remedies
- [x] P2.9d v61: Hering Condensed MM (145/184 remedies, 48 sections) — 15 books
- [x] P2.9e v64: Hering Guiding Symptoms complete (394 remedies, 48 sections) — 16 books
- [ ] P2.9f Next sources: Allen's Encyclopaedia of Pure MM (10 vols + index; archive.org volumes to locate), Hahnemann MM Pura (Dudgeon, 2 vols) + Chronic Diseases (Tafel), Cowperthwaite Text-book, Kent New Remedies, Paterson Bowel Nosodes, Nash Regional Leaders (homeoint); repertories as separate books: Boericke, Boger (Part 1), Boenninghausen TPB, Knerr's Repertory of Hering
- [ ] P2.12 Sharded loading for very large books (per-letter files) to cut first-use download on mobile
- [ ] P4 Symptom-level index across books (remedy × section × symptom, grade) → per-rubric comparison table "remedy × book" so the difference shows at once
- [x] QA v61: import routing fix (private-books file in notes importer → 0 notes) + `tests/app_smoke.jsdom.test.js` (real index.html, all scripts, main flows)
- [x] P2.10 Qdrant Cloud inspected (13 PDFs, 29,139 chunks): only Kent is public domain (already structured in the app); 12 copyrighted → private backup (jsonl.gz) + 🔒 device-only import (IndexedDB), never in the repo; Qdrant kept for the AI assistant's semantic search
- [x] P2.11 🔒 Private books module: import/delete panel, remedy-page detection, 📖 tab + drafts + viewer (whole-book search), tests

## Phase 3 — Drafts & doctor's notes (started in v56)
- [x] P3.1 🤖 extractive auto draft per rubric × remedy (≤4 sentences, ≤2 per book, references) — marked unverified
- [x] P3.2 ✍ note editor per rubric × remedy: adopt draft / save draft / ✔ approve / delete; status badge; counts
- [x] P3.3 Store `localStorage.bc_rep_diff_notes`; 📤 export JSON (differentiation_notes.json) / 📥 import
- [x] P3.4 Seed AI drafts with references (EN + UR): ABSENT-MINDED × nat-m, nux-m, apis, lach, sep — merged once, never overwrite
- [x] P3.5 LLM batch pipeline: `make_llm_batch.py` (facts + excerpts + prompt), `llm_draft_prompt.md` (strict: only given facts, every claim referenced), optional API call, import via 📥
- [x] P3.9 v63: 📖 tab writing mode (Design E): sticky editor, «＋ to note» on every sentence/fact, summary table, mobile stack; design board docs/mm_tab_layouts.html
- [~] P3.6 Seed drafts v2: 15 notes (3 rubrics × 5) written from batch data with references; bulk drafting for more rubrics pending (API key or batch-by-batch)
- [x] P3.7 v59: rubric page section «✍ تفریقی نوٹس» + ✎/✔ chip marks (drafts shown as unverified)
- [x] P3.8 v59: shared notes file `mm/notes_shared.json` (export → commit) merged on every device at start; conflict rule: approved > draft, newer > older
