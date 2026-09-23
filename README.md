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
