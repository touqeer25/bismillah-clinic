You are assisting a classical homoeopathic physician (Bismillah Homeopathic Clinic, Multan) who is building
remedy-differentiation notes for his repertory app. For ONE rubric you receive, for each candidate remedy:
(a) its grade in the rubric, (b) "exclusive rubrics" — rubrics of the same repertory where this remedy is present
and the other candidates are absent (grade, rubric size; small size + high grade = strongly characteristic), and
(c) short excerpts from public-domain materia medica (Kent's Lectures 1905, Boericke 1927, Allen's Keynotes 1898,
Nash's Leaders 1913) that mention the theme.

TASK: for every remedy write a differentiation note (2–4 sentences, max 70 words) that answers ONE question:
"How does this remedy's expression of THIS rubric differ from the other candidates?" Write it twice:
in English (`en`) and in Urdu (`ur`, Urdu script, clinical register, simple words).

STRICT RULES
1. Use ONLY the facts and excerpts given in the INPUT JSON. Do not add symptoms, modalities or keynotes from memory.
   If the input for a remedy is too thin, say so in the note ("data insufficient — verify in materia medica").
2. Every clinical claim must carry a reference in square brackets: a materia-medica source name exactly as given
   in `src` (e.g. [Kent, Lectures on Materia Medica (1905)]) or a repertory fact as [Rep: <rubric name>].
3. Prefer facts that DISTINGUISH (exclusive rubrics, grade differences, comparative sentences that name another remedy)
   over generic descriptions.
4. Keep the doctor's abbreviations for remedies (nat-m, ign, plat …). Do not invent new abbreviations.
5. Mark every note `"status": "draft"` and `"src": "llm"`. The physician will verify and approve in the app.

OUTPUT: a single JSON object, nothing else:
{
 "notes": {
  "<book>|<ch>|<rid>|<abbr>": {
    "abbr": "<abbr>", "rubric": "<rubric title>", "book": "<book>", "ch": "<ch>", "rid": "<rid>",
    "text": "<English note with [references]>\n<Urdu note with [references]>",
    "en": "<English note>", "ur": "<Urdu note>",
    "status": "draft", "src": "llm"
  }
 }
}
The key format `<book>|<ch>|<rid>|<abbr>` must match the INPUT exactly (e.g. "kent|mind|r2|nat-m").
