"""English book profiles and *conservative* cross-checks for screen_parser.

This module never calls an OCR model or writes files. A clean parse of OCR text is
NOT evidence that the underlying pixels were transcribed correctly. OCR confidence,
a second reading and page/column coverage are checked separately in ocr.py/store.py.
No ambiguous remedy or grade is guessed into the clinic's data format.
"""
from __future__ import annotations

import difflib
import json
import re
from pathlib import Path
from typing import Any

PROFILES = ("repertory", "prescriber", "materia_medica")
SECTION_NAMES = {
    "mind", "head", "eyes", "ears", "nose", "face", "mouth", "throat", "stomach",
    "abdomen", "rectum", "stool", "stool and anus", "urinary organs", "kidneys",
    "sexual organs", "respiratory apparatus", "chest", "heart and pulse",
    "neck and back", "back", "upper extremities", "lower extremities",
    "extremities", "skin", "sleep and dreams", "fever", "chill", "sweat",
    "generalities", "modalities", "relationships", "dose", "authority", "description",
}
RUBRIC_WITH_COUNT = re.compile(r"^\s*(?P<label>.{2,130}?)\s*[:?]?\s*(?:[☿ⓘ@?])?\s*\((?P<count>\d{1,4})\)\s*(?P<tail>.*)$")
PAGE_MARK = re.compile(r"^(?:page\s*)?\d{1,5}\s*(?:of|/)\s*\d{1,5}$|^page\s+\d{1,5}$", re.I)
REM_TOKEN = re.compile(r"[A-Za-z][A-Za-z0-9.\-]{0,21}")
SEE_REF = re.compile(r"\bSee\s+[\"“'‘]([^\"”'’]+)[\"”'’]", re.I)


def issue(code: str, message: str, severity: str = "warning", line: int | None = None,
          detail: str = "") -> dict[str, Any]:
    return {"code": code, "message": message, "severity": severity,
            "line": line, "detail": detail, "resolution": None, "note": ""}


def normal(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", str(s).casefold())


def norm_abbr(s: str) -> str:
    return re.sub(r"[^a-z0-9\-]", "", s.casefold().strip().strip(".,;:()"))


def read_remedy_names(repo_root: str | Path) -> dict[str, str]:
    path = Path(repo_root) / "remedy_names.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    return {str(k).casefold(): str(v) for k, v in data.items()}


def remedy_aliases(names: dict[str, str]) -> dict[str, str]:
    aliases = {normal(ab): ab for ab in names}
    for ab, full in names.items():
        key = normal(full)
        if key not in aliases:  # a canonical abbreviation wins over a full-name alias
            aliases[key] = ab
    return aliases


def remedy_in_text(text: str, names: dict[str, str]) -> list[dict[str, str]]:
    """ONLY explicitly printed names/parenthesised abbreviations: never infer therapy."""
    found: dict[str, dict[str, str]] = {}
    for m in re.finditer(r"\(([A-Za-z][A-Za-z0-9.\-]{1,17})\)", text):
        ab = norm_abbr(m.group(1))
        if ab in names:
            found[ab] = {"abbr": ab, "name": names[ab], "evidence": m.group(0)}
    lower = text.casefold()
    for ab, name in names.items():
        if len(name) < 7 or ab in found:
            continue
        if re.search(r"(?<![a-z])" + re.escape(name.casefold()) + r"(?![a-z])", lower):
            found[ab] = {"abbr": ab, "name": name, "evidence": name}
    return list(found.values())


def text_lines(text: str, scanned_lines: list[dict] | None = None) -> list[dict]:
    """Attach OCR bounding boxes when editing has not changed the line count."""
    content = text.replace("\r", "").split("\n")
    match = scanned_lines is not None and len(content) == len(scanned_lines)
    return [{"text": line.strip(), "raw": line, "line": i + 1,
             "words": scanned_lines[i].get("words", []) if match else [],
             "bbox": scanned_lines[i].get("bbox") if match else None}
            for i, line in enumerate(content)]


def _skip(line: str, profile: str) -> bool:
    s = line.strip()
    if not s:
        return True
    if PAGE_MARK.fullmatch(s):
        return True
    if profile == "prescriber" and (s.casefold() == "quick bed-side prescriber" or
                                    re.fullmatch(r"[A-Z]", s)):
        return True
    if profile == "materia_medica" and (s.casefold().startswith(("allen t.f.", "allen timothy f.")) or
                                         re.fullmatch(r"\d+", s)):
        return True
    if profile == "repertory" and re.search(r"homeocare|world.class homeopathy|personal chapter", s, re.I):
        return True
    return False


def _prescriber_heading(line: str) -> tuple[str, str] | None:
    # A book entry is typographically a bold term — descriptive subterm — prose.
    s = re.sub(r"\s*--\s*", "—", line).replace("–", "—")
    pieces = [x.strip() for x in s.split("—")]
    if len(pieces) < 2 or not re.match(r"^[A-Z][a-zA-Z]{2,30}(?:\s+[a-zA-Z]+)?$", pieces[0]):
        return None
    if len(pieces) >= 3 and len(pieces[1]) <= 90:
        return "—".join(pieces[:2]), "—".join(pieces[2:]).strip()
    return pieces[0], "—".join(pieces[1:]).strip()


def _parse_prescriber(lines: list[dict], names: dict[str, str], context: dict) -> tuple[dict, list[dict]]:
    entries: list[dict] = []
    used = set()
    errors = []
    continuation: list[str] = []
    for row in lines:
        s, n = row["text"], row["line"]
        if _skip(s, "prescriber"):
            used.add(n)
            continue
        heading = _prescriber_heading(s)
        if heading:
            head, body = heading
            entries.append({"heading": head, "text": body, "remedy_refs": [],
                            "see_refs": [], "line": n})
            used.add(n)
        elif entries:
            entries[-1]["text"] += ("\n" if entries[-1]["text"] else "") + s
            used.add(n)
        elif context.get("last_heading"):
            continuation.append(s)
            used.add(n)
        else:
            errors.append(issue("orphan_text", "Entry heading not found; this text cannot be assigned to a symptom.",
                                "block", n, s))
    for entry in entries:
        entry["remedy_refs"] = remedy_in_text(entry["text"], names)
        entry["see_refs"] = list(dict.fromkeys(SEE_REF.findall(entry["text"])))
        for match in re.finditer(r"\(([A-Za-z][A-Za-z0-9.\-]{1,17})\)", entry["text"]):
            ab = norm_abbr(match.group(1))
            if ab not in names and not re.search(r"\d|\s", ab):
                errors.append(issue("unknown_remedy_reference", "Parenthesised abbreviation not in remedy list: "
                                    + match.group(0), "warning", entry["line"], entry["heading"]))
    return {"profile": "prescriber", "entries": entries,
            "continuation": "\n".join(continuation),
            "context_out": {"last_heading": entries[-1]["heading"] if entries else context.get("last_heading", "")},
            "accounted": sorted(used)}, errors


def _parse_mm(lines: list[dict], names: dict[str, str], context: dict) -> tuple[dict, list[dict]]:
    aliases = remedy_aliases(names)
    entries: list[dict] = []
    used: set[int] = set()
    errors: list[dict] = []
    current: dict | None = None
    intro: list[str] = []
    for row in lines:
        s, n = row["text"], row["line"]
        if _skip(s, "materia_medica"):
            used.add(n)
            continue
        ab = aliases.get(normal(s))
        if ab and len(s) > 4 and not s.endswith(('.', ':', ';')):
            current = {"abbr": ab, "name": s, "sections": [], "line": n}
            entries.append(current)
            used.add(n)
            continue
        if current is None and context.get("remedy_abbr") in names:
            ab = context["remedy_abbr"]
            current = {"abbr": ab, "name": names[ab], "sections": [],
                       "line": n, "continues_previous": True}
            entries.append(current)
        if current is None:
            # The book's title/byline/authority preceding the FIRST remedy can be kept
            # as source metadata without making up a medicine name.
            intro.append(s)
            used.add(n)
            continue
        if s.casefold().rstrip(":") in SECTION_NAMES and len(s) <= 35:
            current["sections"].append({"h": s.strip(":"), "p": []})
        else:
            if not current["sections"]:
                current["sections"].append({"h": context.get("section", "Introduction")
                                                 if current.get("continues_previous") else "Introduction", "p": []})
            current["sections"][-1]["p"].append(s)
        used.add(n)
    if intro and not entries:
        errors.append(issue("no_remedy_heading", "No remedy title was recognised on this page.",
                            "block", detail=" | ".join(intro[:4])))
    elif intro:
        errors.append(issue("preface_text", "Unclassified text before remedy heading: "
                            "check if it is source metadata, OCR noise or prior-page continuation.",
                            "warning", detail=" | ".join(intro[:5])))
    last = entries[-1] if entries else None
    return {"profile": "materia_medica", "entries": entries, "preface": "\n".join(intro),
            "context_out": {"remedy_abbr": last["abbr"] if last else context.get("remedy_abbr", ""),
                            "section": last["sections"][-1]["h"] if last and last["sections"] else context.get("section", "")},
            "accounted": sorted(used)}, errors


def _remedy_color(word: dict, palette: dict[str, int]) -> int | None:
    color = word.get("color", "unknown")
    return palette.get(color) or palette.get("dark" if color in ("gray", "black") else color)


def _extract_remedies(tail: str, words: list[dict], names: dict[str, str],
                      palette: dict[str, int]) -> tuple[dict[str, int | None], list[str]]:
    rem: dict[str, int | None] = {}
    unknown: list[str] = []
    parts = tail.replace(',', ' ').replace(';', ' ').split()
    for i, raw in enumerate(parts):
        key = norm_abbr(raw)
        if not key:
            continue
        if re.fullmatch(r"[1-4]", key) or key in ("see", "of", "and", "in", "at"):
            continue
        if key not in names:
            if re.fullmatch(r"[a-z][a-z0-9.\-]{1,18}", key):
                unknown.append(raw)
            continue
        grade = None
        if i + 1 < len(parts) and re.fullmatch(r"[1-4]", parts[i + 1]):
            grade = int(parts[i + 1])
        else:
            # OCR word boxes retain the original pixel colour, not just the text.
            for word in words:
                if norm_abbr(word.get("text", "")) == key:
                    grade = _remedy_color(word, palette)
                    break
        rem[key] = grade
    return rem, unknown


def _parse_rep(lines: list[dict], names: dict[str, str], context: dict,
               palette: dict[str, int]) -> tuple[dict, list[dict]]:
    chapter = context.get("chapter", "")
    parent = context.get("parent", "")
    entries: list[dict] = []
    used: set[int] = set()
    errors: list[dict] = []
    for row in lines:
        s, n = row["text"], row["line"]
        if _skip(s, "repertory"):
            used.add(n)
            continue
        bare = s.strip(" :")
        if chapter and bare.casefold() == chapter.casefold():
            # A chapter banner on a new screen is NOT an extra rubric (v80).
            used.add(n)
            continue
        if not chapter and re.fullmatch(r"[A-Z][A-Z &/]{2,35}", bare):
            chapter = bare
            used.add(n)
            continue
        if re.match(r"^\(?see\b", s, re.I):
            if entries:
                entries[-1].setdefault("see_refs", []).append(s)
                used.add(n)
            else:
                errors.append(issue("orphan_reference", "Cross-reference without its rubric.", "block", n, s))
            continue
        matched = RUBRIC_WITH_COUNT.match(s)
        if matched:
            label = matched.group("label").strip(" -:•.")
            tail = matched.group("tail")
            count = int(matched.group("count"))
            if not label:
                errors.append(issue("empty_rubric", "Rubric label is empty.", "block", n, s))
                continue
            nested = s.lstrip().startswith(('-', '•'))
            path = (parent + " - " + label) if nested and parent else label
            if not nested:
                parent = label
            elif not parent:
                errors.append(issue("missing_parent", "Subrubric without a parent: check hierarchy.", "block", n, s))
            rem, unknown = _extract_remedies(tail, row["words"], names, palette)
            entry = {"chapter": chapter, "path": path, "remedies": rem,
                     "expected_count": count, "unread_tokens": unknown,
                     "see_refs": [], "line": n}
            entries.append(entry)
            used.add(n)
            continue
        if entries and s and not s.startswith(('↗', '→')):
            # A continuation must look predominantly like remedy abbreviations.
            cont, unknown = _extract_remedies(s, row["words"], names, palette)
            tokens = REM_TOKEN.findall(s)
            if cont and len(cont) >= max(1, len(tokens) // 3):
                entries[-1]["remedies"].update(cont)
                entries[-1]["unread_tokens"].extend(unknown)
                used.add(n)
                continue
        if re.fullmatch(r"[A-Z][A-Z\- ;,]{2,60}", bare) and not s.startswith(('-', '•')):
            # Printed cross-reference rubrics sometimes have no remedy count.
            parent = bare
            entries.append({"chapter": chapter, "path": bare, "remedies": {},
                            "expected_count": None, "unread_tokens": [],
                            "see_refs": [], "line": n})
            used.add(n)
            continue
        errors.append(issue("unmapped_line", "This OCR line could not be assigned to a rubric or remedy.",
                            "block", n, s))
    if not chapter:
        errors.append(issue("unknown_chapter", "No chapter identified; choose one before export.", "block"))
    for e in entries:
        expected = e["expected_count"]
        if expected is not None and len(e["remedies"]) != expected:
            errors.append(issue("count_mismatch", "Printed count and detected remedies differ: "
                                f"{expected} vs {len(e['remedies'])}. Check OCR/continuation.",
                                "warning", e["line"], e["path"]))
        missing = sum(g is None for g in e["remedies"].values())
        if missing:
            errors.append(issue("unverified_grade", f"{missing} grades lack a verified numeric/style mapping.",
                                "block", e["line"], e["path"]))
        if e["unread_tokens"]:
            errors.append(issue("unknown_abbreviation", "Remedy-looking tokens not in remedy_names.json: " +
                                ", ".join(e["unread_tokens"][:8]), "warning", e["line"], e["path"]))
    return {"profile": "repertory", "chapter": chapter, "entries": entries,
            "context_out": {"chapter": chapter, "parent": parent},
            "accounted": sorted(used)}, errors


def parse_page(profile: str, text: str, names: dict[str, str],
               context: dict | None = None, scanned_lines: list[dict] | None = None,
               grade_palette: dict[str, int] | None = None) -> tuple[dict, list[dict]]:
    if profile not in PROFILES:
        raise ValueError(f"Unknown profile {profile!r}; choose from {PROFILES}")
    rows = text_lines(text, scanned_lines)
    context = context or {}
    if profile == "prescriber":
        parsed, issues = _parse_prescriber(rows, names, context)
    elif profile == "materia_medica":
        parsed, issues = _parse_mm(rows, names, context)
    else:
        parsed, issues = _parse_rep(rows, names, context, grade_palette or {})
    unmapped = [r["line"] for r in rows if r["text"] and r["line"] not in parsed["accounted"]]
    for n in unmapped:
        if not any(x.get("line") == n for x in issues):
            issues.append(issue("unaccounted", "OCR line not accounted for in parsed data.", "block", n))
    if not text.strip():
        issues.append(issue("empty_page", "No English text was detected.", "block"))
    if re.search(r"[\u0600-\u06ff]", text):
        issues.append(issue("unsupported_language", "Only English OCR is supported in this release.", "block"))
    return parsed, issues


def compare_readings(primary: str, second: str, threshold: float = .86) -> list[dict]:
    a = re.sub(r"\s+", " ", primary.casefold()).strip()
    b = re.sub(r"\s+", " ", second.casefold()).strip()
    if not a or not b:
        return [issue("ocr_missing_reading", "Independent OCR reading returned no text.", "warning")]
    # Align TOKENS rather than characters: a 1000-word page should not obscure
    # one critical drug abbreviation. Avoid quadratic long-character matching.
    ta = re.findall(r"[a-z0-9]+(?:-[a-z0-9]+)*", a)
    tb = re.findall(r"[a-z0-9]+(?:-[a-z0-9]+)*", b)
    comparison = difflib.SequenceMatcher(None, ta[:3000], tb[:3000], autojunk=True)
    ratio = comparison.ratio()
    problems = []
    local = []
    for tag, x0, x1, y0, y1 in comparison.get_opcodes():
        if tag != "replace" or x1-x0 > 3 or y1-y0 > 3:
            continue
        for word_a, word_b in zip(ta[x0:x1], tb[y0:y1]):
            if min(len(word_a), len(word_b)) >= 4 and word_a != word_b:
                if difflib.SequenceMatcher(None, word_a, word_b).ratio() >= .55:
                    local.append(word_a + " ↔ " + word_b)
    if local:
        problems.append(issue("ocr_local_disagreement", f"{len(local)} differing words despite good page-wide similarity.",
                              "warning", detail="; ".join(local[:9])))
    if ratio < threshold:
        problems.append(issue("ocr_disagreement", f"Two OCR passes disagree ({ratio:.0%} token similarity). Inspect the image.",
                              "warning", detail=f"first: {a[:120]}\nsecond: {b[:120]}"))
    # Important short parenthesised remedy tokens deserve scrutiny even on a
    # 750-word page whose global similarity would otherwise be 99.9%.
    refs = lambda text: [norm_abbr(x) for x in re.findall(r"\(([A-Za-z][A-Za-z0-9.\-]{1,17})\)", text)]
    if refs(a) != refs(b):
        problems.append(issue("ocr_token_disagreement", "Two readings disagree on a parenthesised abbreviation.",
                              "warning", detail=f"first={refs(a)[:12]} second={refs(b)[:12]}"))
    return problems


def check_page(profile: str, primary: str, second: str, names: dict[str, str],
               context: dict | None = None, scanned_lines: list[dict] | None = None,
               grade_palette: dict[str, int] | None = None, capture_issues: list[dict] | None = None,
               low_confidence: list[dict] | None = None) -> tuple[dict, list[dict]]:
    parsed, problems = parse_page(profile, primary, names, context, scanned_lines, grade_palette)
    problems = list(capture_issues or []) + problems + compare_readings(primary, second)
    if low_confidence:
        sample = "; ".join(x.get("text", "")[:60] for x in low_confidence[:3])
        problems.append(issue("ocr_low_confidence", f"{len(low_confidence)} low-confidence OCR lines.",
                              "warning", detail=sample))
    # A page can be auto-checked only when ALL checks pass. Human approval is a
    # separate auditable status; a green badge is NOT a claim of optical perfection.
    return parsed, problems
