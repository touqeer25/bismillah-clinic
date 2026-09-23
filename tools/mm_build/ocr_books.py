# -*- coding: utf-8 -*-
"""OCR (archive.org djvu.txt) → app materia-medica JSON: Clarke's Dictionary (2 vols, 1900) and Farrington's Clinical MM (1887).
usage: python3 ocr_books.py clarke /tmp/arch/adictionaryprac01clargoog.txt /tmp/arch/adictionaryprac01unkngoog.txt
       python3 ocr_books.py farrington /tmp/arch/clinicalmateriam00farr.txt
Output: /home/user/bismillah-clinic/mm/<id>.json (same format as build_mm.py) and index refresh."""
import re, os, sys, json, difflib
sys.path.insert(0, '/home/user/mm_build')
from names import match, _names, norm, _by_norm, ALIASES
OUT = '/home/user/bismillah-clinic/mm'
DASH = r'[—–\-]{1,2}'

def load_text(path):
    t = open(path, encoding='utf-8', errors='replace').read().replace('\r', '')
    t = t.replace('\ufeff', '').replace('\x0c', '\n')
    t = re.sub(r'(\w)-\s*\n\s*\n?(?=[a-z])', r'\1', t)      # hyphenation at line end (also across an OCR blank line)
    t = re.sub(r'[ \t]+\n', '\n', t)
    return t

def is_running_header(line, book_words):
    s = re.sub(r'\s+', ' ', line.strip())
    if not s: return False
    if re.fullmatch(r'(\d{1,4}\s+)?[A-Z][A-Z .,\'\-]{3,50}(\s+\d{1,4})?', s) and any(w in s for w in book_words): return True
    if re.fullmatch(r'\d{1,4}', s): return True                              # page number
    if re.fullmatch(r'(\d{1,4}\s+)?[A-Z][A-Z .,\'\-]{3,50}(\s+\d{1,4})?', s):   # "ACONITUM CAMMARUM 11" / "2 ABIES NIGRA"
        core = re.sub(r'\d', '', s).strip()
        if any(w in core for w in book_words): return True
        if re.search(r'\d', s): return True                                    # caps + page number = header
    if re.fullmatch(r'VOL\.?\s*I{1,3}\.?\s*\d*', s): return True
    return False

def paragraphs(t, book_words):
    lines = [l for l in t.split('\n') if not is_running_header(l, book_words)]
    paras, cur = [], []
    for l in lines:
        if l.strip(): cur.append(l.strip())
        elif cur: paras.append(' '.join(cur)); cur = []
    if cur: paras.append(' '.join(cur))
    return [re.sub(r'\s+', ' ', p).strip() for p in paras]

_name_keys = None
NOT_REMEDY = re.compile(r'(ace[aj]e?\b|acej|aceje|\bindex\b|kingdom|group|preparations|\bacids\b|halogens|introductory|lecture|therapeutic|vaccination|nosodes|\bthe\b|salts|ophidia|arachnida|umbellifer|composit|solanace|rubiace|cucurbit|menisperm|carbon group|\\bcancer\\b|collapse)', re.I)
def fuzzy_match(title):
    """strict for OCR headings: names.match without the risky single-token fallback; difflib (≥0.85) only for 2+ tokens"""
    if NOT_REMEDY.search(title): return None, 'not-remedy'
    n = norm(title); toks = n.split()
    abbr, how = match(title)
    if abbr and len(toks) == 1 and n not in _by_norm and n not in ALIASES and how != 'single→only': abbr, how = None, 'unmatched'   # single word: exact/alias/unique-prefix only
    if abbr: return abbr, how
    if len(toks) >= 2:
        global _name_keys
        if _name_keys is None: _name_keys = {norm(v): k for k, v in _names.items()}
        cands = difflib.get_close_matches(n, list(_name_keys.keys()), n=1, cutoff=0.85)
        if cands: return _name_keys[cands[0]], 'fuzzy'
    return None, 'unmatched'

# ------------------------------------------------------------------ Clarke
CL_SEC = re.compile(r'^(Clinical|Characteristics|Relations|Causation)\.?\s*' + DASH + r'\s*(.*)$', re.S)
CL_NUM = re.compile(r'^(\d{1,2})\.?\s*([A-Z][A-Za-z ,&]{2,40}?)[\.,]?\s*' + DASH + r'\s*(.*)$', re.S)
def build_clarke(paths):
    book = {'id': 'clarke_dictionary', 'title': 'A Dictionary of Practical Materia Medica', 'author': 'John Henry Clarke', 'year': 1900,
            'source': 'https://archive.org/details/clarkes-a-dictionary-of-practical-materia-medica (complete, OCR)', 'license': 'public domain', 'remedies': {}, 'unmatched': []}
    words = ['DICTIONARY OF PRACTICAL', 'MATERIA MEDICA']
    for path in paths:
        paras0 = paragraphs(load_text(path), words)
        # OCR often joins the title line with the synonym line ("Natrum Muriaticum. Sodium chloride. … Trituration.") → split
        paras = []
        for p in paras0:
            m = re.match(r"^([A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z\-']+){0,4})\.\s+(.+)$", p)   # every word capitalised = title; "Pinus canadensis" (synonym) is not
            prev_is_title = bool(paras) and len(paras[-1]) <= 45 and re.fullmatch(r"[A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z\-']+){0,4}\.", paras[-1] or '')
            if m and not prev_is_title and len(m.group(1)) <= 45 and (re.search(r'\b(Trituration|Tincture|Solution|Dilution|Attenuation|N\. ?O\.|Nat\. ?[Oo]rd)', m.group(2)[:400]) or re.match(r'\(\d\)\s*[A-Z]', m.group(2))) and fuzzy_match(m.group(1))[0]:
                paras.append(m.group(1) + '.'); paras.append(m.group(2))
            else: paras.append(p)
        # skip front matter: start at first title followed by Clinical/Characteristics within 8 paras
        PREP = r'\b(Trituration|Tincture|Solution|Dilution|Attenuation|N\. ?O\.|Nat\. ?[Oo]rd)'
        def is_title(i):
            p = paras[i]
            if not (3 <= len(p) <= 45) or not p.endswith('.'): return False
            if not re.fullmatch(r"[A-Z][a-zA-Z]+(?: [A-Z][a-zA-Z\-']+){0,4}\.", p): return False   # every word capitalised
            if p.rstrip('.').upper() in ('SYMPTOMS', 'CONTENTS', 'PREFACE', 'INTRODUCTION'): return False
            if re.search(PREP, p): return False
            nxt = paras[i + 1] if i + 1 < len(paras) else ''
            return bool(re.search(PREP, nxt[:500])) or bool(re.match(r'(Clinical|Characteristics)\.?\s*' + DASH, nxt)) or bool(re.match(r'\(\d\)\s*[A-Z]', nxt))
        i = 0; n = len(paras); cur = None
        while i < n:
            if is_title(i):
                title = paras[i].rstrip('.').strip()
                abbr, how = fuzzy_match(title)
                if abbr and cur is not None and cur.get('abbr') == abbr: i += 1; continue   # same remedy repeated (synonym line split) → keep current entry
                cur = {'name': title, 'abbr': abbr, 'how': how, 'sections': [{'h': '', 'p': []}], 'src': os.path.basename(path)}
                if abbr and abbr not in book['remedies']: book['remedies'][abbr] = cur
                elif abbr: book['unmatched'].append({'name': title, 'dup_of': abbr, 'src': os.path.basename(path)}); cur = {'name': title, 'sections': [{'h': '', 'p': []}]}
                else: book['unmatched'].append({'name': title, 'src': os.path.basename(path)}); cur = {'name': title, 'sections': [{'h': '', 'p': []}]}
                i += 1; continue
            if cur is not None:
                p = paras[i]
                if p in ('SYMPTOMS.', 'SYMPTOMS'): i += 1; continue
                m = CL_SEC.match(p)
                m2 = CL_NUM.match(p) if not m else None
                if m:
                    cur['sections'].append({'h': m.group(1), 'p': [m.group(2).strip()] if m.group(2).strip() else []})
                elif m2 and int(m2.group(1)) <= 27:
                    cur['sections'].append({'h': m2.group(2).strip(), 'p': [m2.group(3).strip()] if m2.group(3).strip() else []})
                else:
                    cur['sections'][-1]['p'].append(p)
            i += 1
    # clean: drop empty sections, remove helper keys
    for a, e in list(book['remedies'].items()):
        e['sections'] = [s for s in e['sections'] if s['p']]
        e.pop('abbr', None); e.pop('how', None)
        if not e['sections']: del book['remedies'][a]
    return book

# ------------------------------------------------------------------ Farrington
def build_farrington(path):
    book = {'id': 'farrington_clinical', 'title': 'A Clinical Materia Medica (lectures)', 'author': 'Ernest Albert Farrington', 'year': 1887,
            'source': 'https://archive.org/details/clinicalmateriam00farr — OCR', 'license': 'public domain', 'remedies': {}, 'unmatched': [], 'essays': []}
    words = ['CLINICAL MATERIA MEDICA']
    paras = paragraphs(load_text(path), words)
    cur = None; started = False
    for p in paras:
        if re.fullmatch(r'LECT[UEKR]{2,3}E?\s+[IVXL0-9]+\.?', p): started = True; continue
        if started and 3 <= len(p) <= 45 and re.fullmatch(r"[A-Z][A-Z .,'\-]+\.?,?", p):
            title = re.sub(r'\s+', ' ', p.rstrip('.,')).title()
            if ' And ' in title or ',' in title:   # "CINA AND CHAMOMILLA" / "PLATINA, PALLADIUM, AND ALUMINA" — comparative lecture → text goes to EACH remedy
                parts = [x.strip() for x in re.split(r',|\sAnd\s', title) if x.strip()]
                targets = [fuzzy_match(x)[0] for x in parts]; targets = [x for x in targets if x]
                if targets:
                    shared = {'h': title, 'p': []}
                    for ab in targets:
                        if ab not in book['remedies']: book['remedies'][ab] = {'name': title, 'sections': []}
                        book['remedies'][ab]['sections'].append(shared)
                    cur = {'name': title, 'sections': [shared]}; continue
                cur = {'name': title, 'sections': [{'h': '', 'p': []}], 'essay': True}; book['essays'].append(cur); continue
            abbr, how = fuzzy_match(title)
            if abbr and abbr not in book['remedies']:
                cur = {'name': title, 'sections': [{'h': '', 'p': []}]}; book['remedies'][abbr] = cur
            elif abbr:
                cur = book['remedies'][abbr]; cur['sections'].append({'h': title, 'p': []})
            else:
                cur = {'name': title, 'sections': [{'h': '', 'p': []}], 'essay': True}; book['essays'].append(cur); book['unmatched'].append({'name': title})
            continue
        if cur is not None and started:
            if len(p) < 3: continue
            cur['sections'][-1]['p'].append(p)
    for a, e in list(book['remedies'].items()):
        e['sections'] = [s for s in e['sections'] if s['p']]
        if not e['sections']: del book['remedies'][a]
    book['essays'] = [{'title': e['name'], 'paras': e['sections'][0]['p']} for e in book['essays'] if e['sections'][0]['p']]
    return book


# ------------------------------------------------------------------ Hering, Condensed Materia Medica (1877)
HER_SEC = re.compile(r'^(\d{1,2})\s+([A-Z][A-Za-z ,&\-]{2,40}?)\s*[\.,:;]\s*(.*)$', re.S)
HER_NAMES = ['Mind','Sensorium','Head, Inner','Head, Outer','Sight and Eyes','Hearing and Ears','Smell and Nose','Face','Lower Face','Teeth and Gums','Taste and Tongue','Inner Mouth','Throat','Appetite, Thirst','Eating and Drinking','Hiccough, Belching, Nausea','Scrobiculum and Stomach','Hypochondria','Abdomen','Stool and Rectum','Urinary Organs','Male Sexual Organs','Female Sexual Organs','Pregnancy','Voice and Larynx','Respiration','Cough','Inner Chest and Lungs','Heart, Pulse','Outer Chest','Neck and Back','Upper Limbs','Lower Limbs','Limbs in General','Rest, Position, Motion','Nerves','Sleep','Time','Temperature and Weather','Chill, Fever, Sweat','Attacks, Periodicity','Locality and Direction','Sensations','Tissues','Touch, Passive Motion, Injuries','Skin','Stages of Life, Constitution','Relations']
def build_hering_condensed(path):
    book = {'id': 'hering_condensed', 'title': 'Condensed Materia Medica', 'author': 'Constantine Hering', 'year': 1877,
            'source': 'https://archive.org/details/condensedmateri00heri — OCR', 'license': 'public domain', 'remedies': {}, 'unmatched': []}
    words = ['CONDENSED MATERIA MEDICA']
    paras = paragraphs(load_text(path), words)
    cur = None; last_title = None
    for i, p in enumerate(paras):
        if 3 <= len(p) <= 40 and re.fullmatch(r"[A-Z][A-Z .\-']+\.", p):
            title = p.rstrip('.').strip()
            if title == last_title: continue                       # heading printed twice
            win = ' '.join(paras[i + 1:i + 4])
            if not re.match(r'\s*1\s+Mind', win) and not re.search(r'\b1\s+Mind\b', win[:200]): continue
            abbr, how = fuzzy_match(title.title())
            last_title = title
            cur = {'name': title.title(), 'sections': [{'h': '', 'p': []}]}
            if abbr and abbr not in book['remedies']: book['remedies'][abbr] = cur
            elif abbr: book['unmatched'].append({'name': title, 'dup_of': abbr})
            else: book['unmatched'].append({'name': title})
            continue
        if cur is None: continue
        m = HER_SEC.match(p)
        if m and 1 <= int(m.group(1)) <= 48:
            name = m.group(2).strip()
            # snap OCR'd section names to the canonical 48 (prefix match)
            canon = next((c for c in HER_NAMES if c.lower().startswith(name.lower()[:6])), name)
            cur['sections'].append({'h': canon, 'p': [m.group(3).strip()] if m.group(3).strip() else []})
        else:
            cur['sections'][-1]['p'].append(p)
    for a, e in list(book['remedies'].items()):
        e['sections'] = [s for s in e['sections'] if s['p']]
        if not e['sections']: del book['remedies'][a]
    return book

def plain(t): return re.sub(r'\*\*|_', '', t)
def save(book):
    p = os.path.join(OUT, book['id'] + '.json')
    json.dump(book, open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    words = sum(len(plain(x).split()) for r in book['remedies'].values() for s in r['sections'] for x in s['p'])
    print(f"{book['id']}: {len(book['remedies'])} remedies, {len(book['unmatched'])} unmatched, {words:,} words, {os.path.getsize(p)/1e6:.2f} MB")
    for u in book['unmatched'][:40]: print('   UNMATCHED:', u)
    # refresh index
    ip = os.path.join(OUT, '_index.json'); ix = json.load(open(ip)) if os.path.exists(ip) else {'books': {}, 'avail': {}}
    ix['books'][book['id']] = {'title': book['title'], 'author': book['author'], 'year': book['year'], 'file': 'mm/' + book['id'] + '.json', 'remedies': len(book['remedies']), 'words': words, 'bytes': os.path.getsize(p)}
    avail = {}
    for bid, meta in ix['books'].items():
        bk = json.load(open(os.path.join(OUT, bid + '.json')))
        for a in bk['remedies']: avail.setdefault(a, []).append(bid)
    ix['avail'] = avail; json.dump(ix, open(ip, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('index:', len(ix['books']), 'books | remedies with any MM:', len(avail))

if __name__ == '__main__':
    which = sys.argv[1]; paths = sys.argv[2:]
    if which == 'clarke': save(build_clarke(paths))
    elif which == 'farrington': save(build_farrington(paths[0]))
    elif which == 'hering': save(build_hering_condensed(paths[0]))
