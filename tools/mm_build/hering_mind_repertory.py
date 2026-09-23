# -*- coding: utf-8 -*-
"""Hering — Analytical Repertory of the Symptoms of the Mind (1881) → app repertory book `hering_mind`.
Input: archive.org OCR (63731360R_djvu.txt). Output (app root): hering_mind_repertory.json, hering_mind_chapters/_index.json + <key>.json
Rubric = "<Section>, <phrase>[, <sub-phrase>]"; remedies = Hering abbreviations mapped to app abbreviations; grades: 'II'→3, 'I'→2, none→1."""
import re, os, sys, json, collections, difflib
sys.path.insert(0, '/home/user/mm_build')
from names import match, norm
APP = os.environ.get('BHC_APP', '/home/user/bismillah-clinic')
SRC = sys.argv[1] if len(sys.argv) > 1 else '/tmp/arch/hering_analytical.txt'

t = open(SRC, encoding='utf-8', errors='replace').read().replace('\r', '')
t = t.replace('\u00ac\n', '').replace('¬\n', '')                       # OCR hyphen sign
t = re.sub(r'(\w)-\n(?=[a-z])', r'\1', t)

# ---------- contents: chapters (CAPS entries) and sections (Title Case entries) ----------
ci = t.find('CHAPTER I. MIND AND DISPOSITION'); ce = t.find('INTRODUCTION', ci + 100)
contents = t[ci:ce] if ci > 0 and ce > ci else ''
chapters, sections = [], []
for line in contents.split('\n'):
    s = re.sub(r'[,.\s]+$', '', line.strip()); s = re.sub(r'\s*\.\s*(\.\s*)+$', '', s).strip()
    if not s or re.fullmatch(r'\d+|[A-Z]?\d+|Page|CONTEXTS|CONTENTS', s): continue
    s = re.sub(r'^(I|II|III|IV|V)\.\s+', '', s); s = re.sub(r'^\d+\.\s+', '', s)
    if re.fullmatch(r'[A-Z][A-Z ,\'\-]{3,60}', s): chapters.append(s.title())
    elif re.match(r'[A-Z][a-z]', s) and len(s) <= 90: sections.append(re.sub(r'\s+', ' ', s))
chapters = list(dict.fromkeys(chapters)); sections = list(dict.fromkeys(sections))
FIRST_CHAPTER = 'Ailments From Emotions And Exertions Of The Mind'
print('contents:', len(chapters), 'chapters,', len(sections), 'sections')

# ---------- body ----------
bi = t.find('\nHAPPY SURPRISE'); 
if bi < 0: bi = t.find('HAPPY SURPRISE')
body = t[bi:]
lines = body.split('\n')
SKIP_HEAD = re.compile(r'^(MODEL CURES?\.?|INDEX\.?|THE ARRANGEMENT\.?|INTRODUCTION\.?|CONCLUSION\.?|II I I|I II I)$')
def is_caps_heading(s):
    s2 = re.sub(r'^\d{1,3}\s+|\s+\d{1,3}$', '', s.strip())
    return (4 <= len(s2) <= 75 and re.fullmatch(r"[A-Z][A-Z ,.'’\-]+\.?", s2)) and s2 or None

# OCR fixes for remedy tokens
FIX = {'aeon': 'acon', 'pints tox': 'rhus tox', 'savibuc': 'sambuc', 'curb veg': 'carb veg', 'nutr mur': 'natr mur', 'lycop': 'lycop', 'hepar s c': 'hepar sulph', 'calc ostr': 'calc carb', 'anac': 'anac', 'plumb': 'plumb', 'stramon': 'stramon', 'laches': 'laches', 'natr carb': 'natr carb'}
EXTRA_ALIAS = {'cinch off': 'chin', 'cinch': 'chin', 'mar ver': 'teucr', 'calc ac': 'calc-acet', 'curb an': 'carb-an', 'carb anim': 'carb-an', 'carbo anim': 'carb-an', 'anim': 'carb-an', 'vip red': 'vip', 'vip torv': 'vip', 'viper': 'vip', 'kali hydr': 'kali-i', 'pliosph ac': 'ph-ac', 'pliospli ac': 'ph-ac', 'phospli ac': 'ph-ac', 'ars met': 'ars-m', 'zineum': 'zinc', 'merc subl': 'merc-c', 'gina': 'cina', 'sidphur': 'sulph', 'sulphnr': 'sulph', 'turpeth': 'merc-sul', 'ini tigr': 'lil-t', 'lil tig': 'lil-t', 'sarnbuc': 'samb', 'cojfea': 'coff', 'coffea': 'coff', 'pidsat': 'puls', 'cliamom': 'cham', 'ilelleb': 'hell', 'helleb': 'hell', 'ilyosc': 'hyos', 'ilepar s c': 'hep', 'ipecac': 'ip', 'colchic': 'colch', 'lact vir': 'lac-d', 'nuc v': 'nux-v', 'calc ostr': 'calc', 'calc carb': 'calc', 'hepar sulph': 'hep', 'hepar s c': 'hep', 'natr mur': 'nat-m', 'natr carb': 'nat-c', 'natr sulph': 'nat-s', 'stramon': 'stram', 'laches': 'lach', 'lycop': 'lyc', 'phosphor': 'phos', 'sulphur': 'sulph', 'mercur': 'merc', 'chamom': 'cham', 'bellad': 'bell', 'bryon': 'bry', 'pulsat': 'puls', 'graphit': 'graph', 'ignat': 'ign', 'arsen': 'ars', 'coccul': 'cocc', 'veratr': 'verat', 'nux vom': 'nux-v', 'nux mosch': 'nux-m', 'rhus tox': 'rhus-t', 'kali carb': 'kali-c', 'magn carb': 'mag-c', 'magn mur': 'mag-m', 'baryt carb': 'bar-c', 'phosph ac': 'ph-ac', 'nitr ac': 'nit-ac', 'sulph ac': 'sul-ac', 'mur ac': 'mur-ac', 'hydr ac': 'hydr-ac', 'fluor ac': 'fl-ac', 'carb veg': 'carb-v', 'carb an': 'carb-an', 'arg nitr': 'arg-n', 'argent': 'arg-m', 'aurum': 'aur', 'cuprum': 'cupr', 'ferrum': 'ferr', 'plumb': 'plb', 'zincum': 'zinc', 'thuya': 'thuj', 'silic': 'sil', 'sepia': 'sep', 'staphis': 'staph', 'spigel': 'spig', 'spong': 'spong', 'petrol': 'petr', 'platin': 'plat', 'caustic': 'caust', 'canthar': 'canth', 'crotal': 'crot-h', 'agn cast': 'agn', 'viol od': 'viol-o', 'viol tric': 'viol-t', 'amm carb': 'am-c', 'amm mur': 'am-m', 'amm gum': 'ammc', 'cinnab': 'cinnb', 'colchic': 'colch', 'ran scel': 'ran-s', 'ran seel': 'ran-s', 'ran bulb': 'ran-b', 'selen': 'sel', 'oleand': 'olnd', 'rhodod': 'rhod', 'gran cort': 'gran', 'branc urs': 'brach', 'gratiol': 'grat', 'august': 'ang', 'angust': 'ang', 'aster': 'aster', 'evon': 'evon', 'mezer': 'mez', 'hyosc': 'hyos', 'stann': 'stann', 'sambuc': 'samb', 'guaiac': 'guai', 'chelid': 'chel', 'cicut': 'cic', 'kali nitr': 'kali-n', 'kali bichr': 'kali-bi', 'kali iod': 'kali-i', 'kali brom': 'kali-br', 'calc phosph': 'calc-p', 'calc phos': 'calc-p', 'ferr mur': 'ferr-m', 'ferr ac': 'ferr-acet', 'natr ars': 'nat-a', 'apis': 'apis', 'conium': 'con', 'digit': 'dig', 'dulcam': 'dulc', 'euphr': 'euphr', 'gelsem': 'gels', 'glonoin': 'glon', 'hepar': 'hep', 'iodum': 'iod', 'kreos': 'kreos', 'lil tigr': 'lil-t', 'lyc': 'lyc', 'nitr': 'kali-n', 'opium': 'op', 'psorin': 'psor', 'rhus': 'rhus-t', 'sabad': 'sabad', 'sabin': 'sabin', 'secale': 'sec', 'seneg': 'seneg', 'stront': 'stront', 'tarant': 'tarent', 'tereb': 'ter', 'valer': 'valer', 'verb': 'verb', 'zinc': 'zinc', 'ambra': 'ambr', 'anacard': 'anac', 'antim crud': 'ant-c', 'antim tart': 'ant-t', 'tart emet': 'ant-t', 'asa foet': 'asaf', 'asar': 'asar', 'bar carb': 'bar-c', 'bov': 'bov', 'bufo': 'bufo', 'cact': 'cact', 'calad': 'calad', 'camph': 'camph', 'cann ind': 'cann-i', 'cann sat': 'cann-s', 'caps': 'caps', 'cast': 'cast', 'chin': 'chin', 'china': 'chin', 'cina': 'cina', 'clem': 'clem', 'coff': 'coff', 'coloc': 'coloc', 'croc': 'croc', 'cycl': 'cycl', 'dros': 'dros', 'elaps': 'elaps', 'helleb': 'hell', 'hyper': 'hyper', 'ipec': 'ip', 'lach': 'lach', 'led': 'led', 'lyss': 'lyss', 'mosch': 'mosch', 'murex': 'murx', 'naja': 'naja', 'nicc': 'nicc', 'nux v': 'nux-v', 'nux m': 'nux-m', 'par': 'par', 'phyt': 'phyt', 'plat': 'plat', 'podoph': 'podo', 'ruta': 'ruta', 'sang': 'sang', 'sars': 'sars', 'sil': 'sil', 'sulph': 'sulph', 'tabac': 'tab', 'tarax': 'tarax', 'therid': 'ther', 'ustil': 'ust', 'verat vir': 'verat-v', 'verat alb': 'verat', 'agar': 'agar', 'aloe': 'aloe', 'alum': 'alum', 'amyl nitr': 'aml-n', 'ars iod': 'ars-i', 'aur mur': 'aur-m', 'bapt': 'bapt', 'benz ac': 'benz-ac', 'berber': 'berb', 'borax': 'bor', 'brom': 'brom', 'carbol ac': 'carb-ac', 'cham': 'cham', 'chlor': 'chlor', 'cimicif': 'cimic', 'act rac': 'cimic', 'cocc': 'cocc', 'con': 'con', 'cupr': 'cupr', 'daphne': 'mez', 'gels': 'gels', 'hell': 'hell', 'hyos': 'hyos', 'iod': 'iod', 'kalm': 'kalm', 'lact ac': 'lact-ac', 'laur': 'laur', 'mang': 'mang', 'meny': 'meny', 'merc': 'merc', 'merc cor': 'merc-c', 'merc sol': 'merc', 'nat mur': 'nat-m', 'natr phos': 'nat-p', 'nit ac': 'nit-ac', 'olnd': 'olnd', 'ox ac': 'ox-ac', 'oxal ac': 'ox-ac', 'phos': 'phos', 'picr ac': 'pic-ac', 'plb': 'plb', 'ph ac': 'ph-ac', 'sec': 'sec', 'sep': 'sep', 'stram': 'stram', 'sulf': 'sulph', 'thuj': 'thuj', 'verat': 'verat', 'viol': 'viol-o'}
tok_stats = collections.Counter(); unmatched = collections.Counter()
def map_token(tok):
    raw = tok
    tok = re.sub(r'[^A-Za-z .\-]', ' ', tok).strip()
    tok = re.sub(r'\.', ' ', tok); tok = re.sub(r'\s+', ' ', tok).strip().lower()
    if not tok or len(tok) < 3: return None
    tok = FIX.get(tok, tok)
    if tok in EXTRA_ALIAS: return EXTRA_ALIAS[tok]
    a, how = match(tok)
    if a and not how.startswith('single→best'): return a
    # 2-token fuzzy against alias keys
    if ' ' in tok:
        c = difflib.get_close_matches(tok, list(EXTRA_ALIAS.keys()), n=1, cutoff=0.86)
        if c: return EXTRA_ALIAS[c[0]]
    if a: return a
    unmatched[tok] += 1; return None

def parse_remedies(seg):
    """'II Lycop., Natr. mur., lNux mosch. (Borax)' → {abbr: grade}"""
    seg = re.sub(r'\([^)]*\)', '', seg)
    out = {}
    parts = [p.strip() for p in re.split(r',(?![a-z])|,\s+(?=[A-Z]|I{1,2}\s)', seg) if p.strip()]
    # rejoin OCR "Calc, ostr." splits: piece followed by a lowercase piece
    merged = []
    for p in parts:
        if merged and re.match(r'^[a-z]', p) and not re.match(r'^(and|or|with|when|in|after|from|on|at|the)\b', p): merged[-1] = merged[-1] + ' ' + p
        else: merged.append(p)
    for p in merged:
        g = 1
        m = re.match(r'^(II|II\.|ii|il|ll|I|i|l|1)\s+(.*)$', p)
        if m: g = 3 if m.group(1).lower().replace('.', '') in ('ii', 'il', 'll') else 2; p = m.group(2)
        elif re.match(r'^(ll|il)[A-Z]', p): g = 3; p = p[2:]
        elif re.match(r'^l[A-Z]', p): g = 2; p = p[1:]
        p = p.strip().rstrip('.;:')
        a = map_token(p)
        if a: out[a] = max(out.get(a, 0), g); tok_stats['ok'] += 1
        else: tok_stats['bad'] += 1
    return out

SUBSTART = re.compile(r'^(when|with|while|after|before|during|from|in|on|at|as|if|better|worse|especially|particularly|and|or|but|the|his|her|he|she|they|even|only|also|toward|towards|until|since|for|of|to|by|about|over|under|without|within|following|accompanied|alternating|then|then)\b', re.I)
def clean_phrase(s):
    s = re.sub(r'\s+', ' ', s).strip(' ;,:.-—–')
    s = s[0].upper() + s[1:] if s else s
    return s

# ---------- walk ----------
chapter = FIRST_CHAPTER; section = None; last_top = None
rubrics = collections.OrderedDict()   # chapter -> list of (title, remedies)
def add(chap, title, rems):
    if not rems or not title: return
    L = rubrics.setdefault(chap, [])
    for i, (tt, rr) in enumerate(L):
        if tt == title:
            for a, g in rems.items(): rr[a] = max(rr.get(a, 0), g)
            return
    L.append((title, dict(rems)))

para = []
def flush_para():
    global last_top
    if not para: return
    p = re.sub(r'\s+', ' ', ' '.join(para)).strip(); para.clear()
    if ':' not in p or len(p) < 6: return
    # split into clauses on ';' ; each clause may be 'phrase: remedies'
    clauses = [c.strip() for c in re.split(r';\s*', p) if c.strip()]
    for c in clauses:
        if ':' not in c: continue
        phrase, rems_txt = c.split(':', 1)
        phrase = clean_phrase(phrase); rems = parse_remedies(rems_txt)
        if not rems or len(phrase) > 140 or len(phrase) < 2: continue
        if SUBSTART.match(phrase) or (phrase and phrase[0].islower()):
            title = (last_top + ', ' + phrase[0].lower() + phrase[1:]) if last_top else phrase
        else:
            last_top = phrase; title = phrase
        full = (section + ', ' + title[0].lower() + title[1:]) if section else title
        add(chapter, full, rems)

for raw in lines:
    s = raw.strip()
    if not s: flush_para(); continue
    h = is_caps_heading(s)
    if h:
        flush_para()
        h2 = h.rstrip('.').strip()
        if SKIP_HEAD.match(h2) or re.fullmatch(r'[A-Z]{1,3}( [A-Z]{1,3})*', h2): continue
        tc = h2.title()
        if tc in chapters: chapter = tc; section = None; last_top = None; continue
        cand = difflib.get_close_matches(tc, sections, n=1, cutoff=0.8)
        if cand: section = cand[0]; last_top = None; continue
        # unknown caps line (page header variant) → treat as section too
        section = tc; last_top = None; continue
    para.append(s)
flush_para()

# ---------- write app files ----------
def slug(x): return re.sub(r'[^a-z0-9]+', '_', x.lower()).strip('_')[:50]
combined = collections.OrderedDict(); index = []
os.makedirs(os.path.join(APP, 'hering_mind_chapters'), exist_ok=True)
for chap, L in rubrics.items():
    key = slug(chap)
    data = collections.OrderedDict()
    for i, (title, rems) in enumerate(L): data['r%d' % i] = {'t': title, 'r': rems}
    if not data: continue
    combined[key] = data
    json.dump(data, open(os.path.join(APP, 'hering_mind_chapters', key + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    index.append({'key': key, 'name': chap, 'rubrics': len(data)})
json.dump(index, open(os.path.join(APP, 'hering_mind_chapters', '_index.json'), 'w', encoding='utf-8'), ensure_ascii=False)
json.dump(combined, open(os.path.join(APP, 'hering_mind_repertory.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
nr = sum(len(v) for v in combined.values()); refs = sum(len(x['r']) for v in combined.values() for x in v.values())
rems_all = set(a for v in combined.values() for x in v.values() for a in x['r'])
print(f'chapters={len(combined)} rubrics={nr} refs={refs} remedies={len(rems_all)} | tokens ok={tok_stats["ok"]} bad={tok_stats["bad"]}')
print('top unmatched tokens:', unmatched.most_common(40))
print('chapters:', [(c['name'][:40], c['rubrics']) for c in index][:40])
