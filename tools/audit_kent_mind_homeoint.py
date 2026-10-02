#!/usr/bin/env python3
"""Fetch and parse Kent's printed MIND pages from the user-approved Homeoint source.

Raw pages are written to a temporary output folder. The parsed source snapshot can
optionally be committed under kent_sources; repertory data is never modified here.
Requires only the Python standard library.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import urllib.request
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path

BASE_URL = "http://www.homeoint.org/books/kentrep/"
SOURCE_LIST_URL = BASE_URL + "kentmind.htm"
SOURCE_REMEDY_LIST_URL = BASE_URL + "kentreme.htm"
SEGMENTS = list(range(0, 95, 5))


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.dir_depth = 0
        self.page = None
        self.current = None
        self.font_colors: list[str] = []
        self.records: list[dict] = []

    def _finish(self) -> None:
        if self.current is None:
            return
        raw = "".join(text for text, _grade in self.current["parts"])
        text = re.sub(r"\s+", " ", raw).strip()
        page = self.current["page"]
        match = re.search(r"\bp\.\s*(\d+)\b", text, re.I)
        if match:
            page = int(match.group(1))
        if text:
            self.records.append({
                "page": page,
                "raw_depth": self.current["depth"],
                "raw": raw,
                "text": text,
                "parts": self.current["parts"],
            })
        self.current = None

    def handle_starttag(self, tag, attrs):
        tag = tag.lower()
        attrs = {str(key).lower(): value for key, value in attrs}
        if tag == "a" and re.fullmatch(r"P\d+", attrs.get("name", ""), re.I):
            self.page = int(attrs["name"][1:])
        if tag == "dir":
            self.dir_depth += 1
        elif tag == "p":
            if self.current is not None:
                self._finish()
            self.current = {
                "page": self.page,
                "depth": self.dir_depth,
                "parts": [],
            }
        elif tag == "font":
            self.font_colors.append((attrs.get("color") or "").lower())

    def handle_endtag(self, tag):
        tag = tag.lower()
        if tag == "p":
            self._finish()
        elif tag == "dir":
            self.dir_depth = max(0, self.dir_depth - 1)
        elif tag == "font" and self.font_colors:
            self.font_colors.pop()

    def handle_data(self, data):
        if self.current is None:
            return
        color = self.font_colors[-1] if self.font_colors else ""
        grade = 3 if color == "#ff0000" else 2 if color == "#0000ff" else 1
        self.current["parts"].append((data, grade))


def fetch(url: str, dest: Path) -> bytes:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; KentMindSourceAudit/1.0)"},
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        content = response.read()
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(content)
    return content


def parse_file(path: Path) -> list[dict]:
    raw_bytes = path.read_bytes()
    text = raw_bytes.decode("cp1252", errors="replace")
    parser = PageParser()
    parser.feed(text)
    parser.close()
    return parser.records


def normalize_remedy_code(value: str) -> str:
    value = str(value).lower().replace("æ", "ae").replace("œ", "oe")
    return re.sub(r"[^a-z0-9-]", "", value)


def parse_remedy_abbreviations(raw_bytes: bytes) -> dict[str, str]:
    """Parse Homeoint's Kent remedy/abbreviation index from its HTML source."""
    text = raw_bytes.decode("cp1252", errors="replace")
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.I)
    text = re.sub(r"<[^>]*>", "", text)
    text = html.unescape(text)
    text = text.replace("\x8c", "Œ").replace("\x9c", "œ")
    abbreviations = {}
    for line in text.splitlines():
        line = re.sub(r"\s+", " ", line).strip()
        match = re.fullmatch(r"(.+?)\s*-{4,}\s*(.+)", line)
        if not match:
            continue
        abbreviation, name = match.group(1).strip(), match.group(2).strip()
        key = normalize_remedy_code(abbreviation)
        if key:
            if key in abbreviations and abbreviations[key] != name:
                raise ValueError(f"Conflicting Homeoint remedy abbreviation: {abbreviation}")
            abbreviations[key] = name
    return abbreviations


def extract_rubrics(records: list[dict], page_low: int, page_high: int) -> list[dict]:
    by_page: dict[int, list[dict]] = {}
    for record in records:
        page = record["page"]
        if page is not None and page_low <= page <= page_high:
            by_page.setdefault(page, []).append(record)

    extracted = []
    for page in range(page_low, page_high + 1):
        page_records = by_page.get(page)
        if not page_records:
            raise ValueError(f"Printed page {page} was not found in its source segment")
        in_body = False
        for record in page_records:
            text = record["text"].strip()
            if not in_body:
                if re.fullmatch(r"[-\s—–]+", text) and len(text.replace(" ", "")) >= 4:
                    in_body = True
                continue
            if (
                text.upper() in {"KENT", "MIND", "VERTIGO"}
                or "Copyright" in text
                or re.fullmatch(r"p\.\s*\d+", text, re.I)
                or re.fullmatch(r"[-\s—–]+", text)
                or re.fullmatch(r"[-\s—–<>]+", text)
            ):
                continue

            raw = record["raw"]
            if ":" in raw:
                colon = raw.index(":")
                label = re.sub(r"\s+", " ", raw[:colon]).strip()
                remedy_text = raw[colon + 1 :]
                char_grades = []
                for part, grade in record["parts"]:
                    char_grades.extend([grade] * len(part))
                remedies = []
                position = 0
                for chunk in remedy_text.split(","):
                    token = chunk.strip()
                    if token:
                        start = remedy_text.find(chunk, position)
                        end = start + len(chunk)
                        grades = char_grades[colon + 1 + start : colon + 1 + end]
                        remedies.append({"name": token, "grade": max(grades or [1])})
                    position += len(chunk) + 1
            else:
                label = text
                remedies = []

            # Page 95 ends with a navigation arrow, not a rubric.
            if not label or re.fullmatch(r"[-\s—–<>]+", label):
                continue
            extracted.append({
                "page": page,
                "raw_depth": max(0, record["raw_depth"] - 2),
                "depth": max(0, record["raw_depth"] - 2),
                "label": label,
                "remedies": remedies,
                "source_text": text,
            })

    return extracted


def correct_unmarked_homeoint_children(entries: list[dict]) -> int:
    """Restore two child blocks that Homeoint leaves at their parent <dir> depth.

    The source HTML omits the opening <dir> before FRIGHTENED easily's "night"
    child and before LOQUACITY's daytime/forenoon/evening/night children. The
    surrounding source lines and the child <dir> below each "night" make these
    relationships explicit; require the exact source sequence so drift fails
    loudly instead of silently changing the tree.
    """
    def find_one(page: int, label: str) -> int:
        matches = [i for i, row in enumerate(entries)
                   if row["page"] == page and row["label"] == label]
        if len(matches) != 1:
            raise ValueError(f"Expected one source row {page}:{label!r}, found {len(matches)}")
        return matches[0]

    changed = 0
    # Page 49: the "night" row is a child of FRIGHTENED easily; its following
    # nested rows sit one HTML <dir> deeper than that row.
    frightened = find_one(49, "FRIGHTENED easily (See Starting)")
    night = frightened + 1
    if entries[night]["page"] != 49 or entries[night]["label"] != "night":
        raise ValueError("Homeoint page 49 FRIGHTENED/night source sequence changed")
    end = next((i for i in range(night + 1, len(entries))
                if entries[i]["raw_depth"] == 0 and entries[i]["label"] == "FRIVOLOUS"), None)
    if end is None:
        raise ValueError("Homeoint page 49 FRIVOLOUS boundary was not found")
    for i in range(night, end):
        entries[i]["depth"] += 1
        entries[i]["markup_depth_correction"] = "unmarked child block under FRIGHTENED easily"
        changed += 1

    # Page 63: four time rubrics continue LOQUACITY without an opening <dir>;
    # "night" then opens a <dir> for its own ten children.
    loquacity = find_one(63, "LOQUACITY (See Speech)")
    time_labels = ["daytime", "forenoon", "evening", "night"]
    for offset, label in enumerate(time_labels, 1):
        i = loquacity + offset
        if entries[i]["page"] != 63 or entries[i]["label"] != label:
            raise ValueError("Homeoint page 63 LOQUACITY time-rubric sequence changed")
        entries[i]["depth"] += 1
        entries[i]["markup_depth_correction"] = "unmarked child block under LOQUACITY"
        changed += 1
    loquacity_night = loquacity + len(time_labels)
    end = next((i for i in range(loquacity_night + 1, len(entries))
                if entries[i]["raw_depth"] == 0 and
                entries[i]["label"] == "LOVE, ailments, from disappointed"), None)
    if end is None:
        raise ValueError("Homeoint page 63 LOVE boundary was not found")
    for i in range(loquacity_night + 1, end):
        entries[i]["depth"] += 1
        entries[i]["markup_depth_correction"] = "nested child block under LOQUACITY/night"
        changed += 1
    return changed


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("/tmp/kentmind_homeoint"),
        help="temporary raw-page output directory (default: /tmp/kentmind_homeoint)",
    )
    parser.add_argument(
        "--save-snapshot",
        action="store_true",
        help="also save the parsed MIND source and abbreviation map under kent_sources/",
    )
    args = parser.parse_args()
    out_dir = args.out
    out_dir.mkdir(parents=True, exist_ok=True)

    fetch(SOURCE_LIST_URL, out_dir / "kentmind.htm")
    remedy_list_bytes = fetch(SOURCE_REMEDY_LIST_URL, out_dir / "kentreme.htm")
    source_remedy_abbreviations = parse_remedy_abbreviations(remedy_list_bytes)
    all_entries = []
    page_counts: Counter[int] = Counter()
    segment_manifest = []
    for start in SEGMENTS:
        filename = f"kent{start:04d}.htm"
        url = BASE_URL + filename
        raw = fetch(url, out_dir / filename)
        if start == 0:
            page_low, page_high = 1, 4
        elif start == 90:
            page_low, page_high = 90, 95
        else:
            page_low, page_high = start, start + 4
        extracted = extract_rubrics(parse_file(out_dir / filename), page_low, page_high)
        for entry in extracted:
            entry["source_order"] = len(all_entries)
            all_entries.append(entry)
        page_counts.update(entry["page"] for entry in extracted)
        segment_manifest.append({
            "file": filename,
            "url": url,
            "sha256": hashlib.sha256(raw).hexdigest(),
            "page_low": page_low,
            "page_high": page_high,
            "rubric_candidates": len(extracted),
        })

    expected_pages = set(range(1, 96))
    actual_pages = set(page_counts)
    if actual_pages != expected_pages:
        missing = sorted(expected_pages - actual_pages)
        extra = sorted(actual_pages - expected_pages)
        raise ValueError(f"Page coverage mismatch; missing={missing}, extra={extra}")

    # Restore the two documented source blocks whose first child level lacks
    # an opening <dir>; then collapse only any remaining empty wrapper levels.
    markup_depth_correction_count = correct_unmarked_homeoint_children(all_entries)
    depth_stack: list[dict] = []
    depth_adjustment_count = 0
    for entry in all_entries:
        proposed_depth = int(entry["depth"])
        effective_depth = min(proposed_depth, len(depth_stack))
        if effective_depth != proposed_depth:
            entry["depth_adjustment"] = proposed_depth - effective_depth
            depth_adjustment_count += 1
        entry["depth"] = effective_depth
        entry["parent_source_order"] = (
            depth_stack[effective_depth - 1]["source_order"] if effective_depth else None
        )
        entry["source_path_labels"] = [row["label"] for row in depth_stack[:effective_depth]] + [entry["label"]]
        depth_stack = depth_stack[:effective_depth]
        depth_stack.append(entry)

    grades = Counter(
        int(remedy["grade"])
        for entry in all_entries
        for remedy in entry["remedies"]
    )
    unlisted_source_tokens = {}
    for entry in all_entries:
        for remedy in entry["remedies"]:
            code = normalize_remedy_code(remedy["name"])
            if code not in source_remedy_abbreviations:
                unlisted_source_tokens.setdefault(code, remedy["name"])
    candidate_bytes = json.dumps(all_entries, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    abbreviation_text = json.dumps(dict(sorted(source_remedy_abbreviations.items())),
                                   ensure_ascii=False, indent=2) + "\n"
    abbreviation_bytes = abbreviation_text.encode("utf-8")
    summary = {
        "source": SOURCE_LIST_URL,
        "source_note": "Medi-T presentation; copyright 1998; edition number not displayed on inspected pages",
        "remedy_list_source": SOURCE_REMEDY_LIST_URL,
        "remedy_list_sha256": hashlib.sha256(remedy_list_bytes).hexdigest(),
        "remedy_abbreviation_count": len(source_remedy_abbreviations),
        "unlisted_source_medicine_tokens": [unlisted_source_tokens[k] for k in sorted(unlisted_source_tokens)],
        "segments": segment_manifest,
        "page_count": len(actual_pages),
        "candidate_count": len(all_entries),
        "page_counts": {str(page): page_counts[page] for page in sorted(page_counts)},
        "candidate_with_remedies": sum(bool(entry["remedies"]) for entry in all_entries),
        "candidate_empty": sum(not entry["remedies"] for entry in all_entries),
        "remedy_grade_counts": {str(grade): grades[grade] for grade in sorted(grades)},
        "raw_depth_counts": {
            str(depth): count
            for depth, count in sorted(Counter(entry["raw_depth"] for entry in all_entries).items())
        },
        "depth_adjustment_count": depth_adjustment_count,
        "markup_depth_correction_count": markup_depth_correction_count,
        "root_count": sum(entry["parent_source_order"] is None for entry in all_entries),
        "parent_link_count": sum(entry["parent_source_order"] is not None for entry in all_entries),
        "effective_depth_counts": {
            str(depth): count
            for depth, count in sorted(Counter(entry["depth"] for entry in all_entries).items())
        },
        "candidate_snapshot": "kent_sources/homeoint_mind_candidates.json",
        "candidate_snapshot_sha256": hashlib.sha256(candidate_bytes).hexdigest(),
        "remedy_abbreviations_snapshot": "kent_sources/homeoint_remedy_abbreviations.json",
        "remedy_abbreviations_snapshot_sha256": hashlib.sha256(abbreviation_bytes).hexdigest(),
    }
    manifest_text = json.dumps(summary, ensure_ascii=False, indent=2) + "\n"
    (out_dir / "mind_extracted_candidates.json").write_bytes(candidate_bytes)
    (out_dir / "remedy_abbreviations.json").write_bytes(abbreviation_bytes)
    (out_dir / "source_manifest.json").write_text(manifest_text, encoding="utf-8")
    if args.save_snapshot:
        snapshot_dir = Path(__file__).resolve().parents[1] / "kent_sources"
        snapshot_dir.mkdir(parents=True, exist_ok=True)
        (snapshot_dir / "homeoint_mind_candidates.json").write_bytes(candidate_bytes)
        (snapshot_dir / "homeoint_remedy_abbreviations.json").write_bytes(abbreviation_bytes)
        (snapshot_dir / "homeoint_mind_source_manifest.json").write_text(manifest_text, encoding="utf-8")
    print(manifest_text, end="")


if __name__ == "__main__":
    main()
