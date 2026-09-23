# -*- coding: utf-8 -*-
"""W. Boericke & W. A. Dewey — The Twelve Tissue Remedies of Schüssler (1888) → repertory book `tissues_bd`.
Input: the text version at homeopathybooks.in (the mirror Dr. Nancy Malik's list links to); the site carries
       the book's therapeutic part, one page per disease ("ABSCESS", "SCARLATINA", …), each page listing the
       indicated tissue salt as  Remedy name [Abbr.]  followed by its indication paragraph(s).
That is exactly a repertory: rubric = the disease, remedies = the seven/eight tissue salts (with the app's own
abbreviations already printed in the brackets).  Grades: the first salt named on a page is Boericke's leading
remedy → 3, the rest → 2.  Indication text is kept in the rubric note so the app can show *why*.
usage: BHC_APP=/path/to/app python3 boericke_dewey_tissues.py <pages-dir>"""
import re, os, sys, json, html, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
APP = os.environ.get('BHC_APP', '/home/user/bismillah-clinic')
from names import match

DIR = sys.argv[1] if len(sys.argv) > 1 else '/tmp/bd_pages'
SALTS = {'calc-f': 'Calcarea fluorica', 'calc-p': 'Calcarea phosphorica', 'calc-s': 'Calcarea sulphurica',
         'ferr-p': 'Ferrum phosphoricum', 'kali-m': 'Kali muriaticum', 'kali-p': 'Kali phosphoricum',
         'kali-s': 'Kali sulphuricum', 'mag-p': 'Magnesia phosphorica', 'nat-m': 'Natrum muriaticum',
         'nat-p': 'Natrum phosphoricum', 'nat-s': 'Natrum sulphuricum', 'sil': 'Silicea'}
def plain(x): return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', x))).strip()

HEAD = re.compile(r'^(?P<name>[A-Z][A-Za-z .\'’\-/&]{2,44}?)\s*\[(?P<abbr>[A-Za-z][A-Za-z.\-/ ]{1,12})\]\s*$')
SKIP_H = re.compile(r'^(Related posts|Books & Journals|ABSCESS CASES|.*CASES)$', re.I)

chapters = collections.OrderedDict()
files = sorted(f for f in os.listdir(DIR) if f.endswith('.html'))
for f in files:
    key = os.path.splitext(f)[0]
    s = open(os.path.join(DIR, f), encoding='utf8', errors='replace').read()
    m = re.search(r'<h1[^>]*>(.*?)</h1>(.*)', s, re.S)
    title = plain(m.group(1)) if m else key.replace('_', ' ').title()
    body = m.group(2) if m else s
    title = re.sub(r'\s+', ' ', title).strip()
    if len(title) < 3 or title.lower().startswith('twelve tissue'): continue
    def titlecase(x):     # keep words joined by an apostrophe intact (RAYNAUD'S DISEASE → Raynaud's Disease)
        return ' '.join(w[0].upper() + w[1:].lower() if w else '' for w in re.split(r'(?<=\S)\s+', x.strip()))
    # blocks: <p> paragraphs, but the site also runs remedy-name and text together — split on the [Abbr] marker
    html_txt = re.sub(r'<br\s*/?>', '\n', body, flags=re.I)
    paras = [re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', p))).strip()
             for p in re.split(r'</p>', html_txt)]
    paras = [p for p in paras if p]
    # join a paragraph tail back onto its remedy head when the site broke them apart
    rem = collections.OrderedDict()
    cur = None; note = []
    intro = []
    for p in paras:
        if p.lower().startswith('twelve tissue remedies') or p.lower().startswith('books & journals'): continue
        if 'related posts' in p.lower(): break
        for piece in re.split(r'(?=\s*[A-Z][A-Za-z .\'’\-/&]{2,44}\s*\[[A-Za-z][A-Za-z.\-/ ]{1,12}\]\s*)', p):
            piece = piece.strip()
            if not piece: continue
            mh = HEAD.match(piece.split('. ')[0][:80]) or HEAD.match(piece[:120])
            if mh:
                if cur and note: rem[cur[1]] = (rem[cur[1]][0] if cur[1] in rem else None) or ' '.join(note).strip()
                ab = re.sub(r'[^a-z]', '', mh.group('abbr').lower())
                a = ab if ab in SALTS else None
                if not a:
                    x, _ = match(mh.group('name').strip())
                    a = x if x in SALTS else None
                if a:
                    cur = (mh.group('name').strip(), a); note = [piece[mh.end():].strip('. ')[:1400]]
                else:
                    cur = None; intro.append(piece)
                continue
            if cur: note.append(piece[:1200])
            else: intro.append(piece)
        if cur and note:
            t = ' '.join(note).strip()
            if len(t) > 12: rem[cur[1]] = t
            note = []
    if not rem: continue
    rems = {a: (3 if i == 0 else 2) for i, a in enumerate(rem)}
    note = ' '.join(dict.fromkeys(intro))
    note = re.sub(r'^[A-Z][A-Z .&,\u2019\-/]*CASES\b\s*', '', note)          # the "ABSCESS CASES" banner
    note = re.sub(r'\[[^\]]{0,30}cases\]\s*', '', note, flags=re.I)          # its duplicate anchor label
    note = re.sub(r'\s*by (William Boericke|Willis A\.? Dewey|Boericke & Dewey)\b', '', note, flags=re.I)
    note = re.sub(r'How can you treat.{0,120}?Tissue Salts\?[^.]*\.?', '', note, flags=re.I)
    note = re.sub(r'Learn the complete Biochemic treatment of[^.]*\.?', '', note, flags=re.I)
    note = re.sub(r'\s+', ' ', note).strip(' .—…')[:600] or ' '.join(rem.values())[:600]
    note = re.sub(r'^(?:CASES|ES|S)\s+', '', note)   # caps tail left when the "… CASES" heading is split by markup
    chapters[key] = {'t': titlecase(title) if title.isupper() or "'" in title or '\u2019' in title else title,
                     'r': rems, 'note': note}

combined = {'tissue_therapeutics': collections.OrderedDict(
    ('r%d' % i, {'t': v['t'], 'r': v['r'], 'note': v['note']}) for i, v in enumerate(chapters.values()))}
idx = [{'key': 'tissue_therapeutics', 'name': 'Tissue-remedy therapeutics (diseases)', 'rubrics': len(combined['tissue_therapeutics'])}]
os.makedirs(os.path.join(APP, 'tissues_bd_chapters'), exist_ok=True)
json.dump(combined['tissue_therapeutics'], open(os.path.join(APP, 'tissues_bd_chapters', 'tissue_therapeutics.json'), 'w', encoding='utf8'),
          ensure_ascii=False, separators=(',', ':'))
json.dump(idx, open(os.path.join(APP, 'tissues_bd_chapters', '_index.json'), 'w', encoding='utf8'), ensure_ascii=False)
json.dump(combined, open(os.path.join(APP, 'tissues_bd_repertory.json'), 'w', encoding='utf8'),
          ensure_ascii=False, separators=(',', ':'))
refs = sum(len(v['r']) for v in combined['tissue_therapeutics'].values())
salts_used = sorted(set(a for v in combined['tissue_therapeutics'].values() for a in v['r']))
print(f"rubrics={len(combined['tissue_therapeutics'])} refs={refs} salts={len(salts_used)} from {len(files)} pages")
print("salts:", salts_used)
print("avg rubric size:", round(refs / max(1, len(combined['tissue_therapeutics'])), 2))
miss = [f for f in files if os.path.splitext(f)[0] not in chapters]
print("pages skipped:", len(miss), miss[:12])
