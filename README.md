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
