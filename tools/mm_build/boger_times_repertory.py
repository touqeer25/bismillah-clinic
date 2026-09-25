# -*- coding: utf-8 -*-
"""C. M. Boger — Times of the Remedies and Moon Phases → repertory book `boger_times`.
Input: homeoint.org HTML (http://homeoint.org/seror/boger/moon.htm — cp1252, Séror edition: French
       presentation + the whole English book).  Output (app root): boger_times_repertory.json, boger_times_chapters/
Book = 11 chapters (334 remedies) + the Moon-Phases table (186 remedies); each chapter is introduced by a
heading on its own <p> with no ':': GENERAL AGGRAVATION AT / SEASONAL / FEVER / PERIODICITY / DAYTIME /
MORNING / FORENOON / NOON / AFTERNOON / EVENING / NIGHT REMEDIES.
rubric  = one paragraph "1 A. M. to 2 A. M. : Aloe. Ars. …" (Boger prints one rubric per paragraph)
grade   = Séror kept Boger's I/II marks as colours: maroon #800000 → 3, red #ff0000 → 2, plain/blue → 1
abbr    = resolved against the app's own remedy keys (longest unique prefix), then tools/mm_build/names.py,
          then the small BOGER_ALIAS table below; everything unresolved is printed as `unmatched`.
usage: BHC_APP=/path/to/app python3 boger_times_repertory.py <moon.htm> [--dump]"""
import re, os, sys, json, html, collections, difflib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
APP = os.environ.get('BHC_APP', '/home/user/bismillah-clinic')
from names import match

SRC = next((a for a in sys.argv[1:] if not a.startswith('--')), '/tmp/arch/boger_moon.htm')
DUMP = '--dump' in sys.argv

# ---------- read ----------
raw = open(SRC, 'rb').read()
t = None
for enc in ('cp1252', 'latin-1', 'utf-8'):
    try:
        s = raw.decode(enc)
        if 'TIMES OF THE REMEDIES' in s.upper(): t = s; break
    except Exception:
        continue
if t is None: sys.exit('input does not look like Boger moon.htm (Séror edition)')
t = re.sub(r'<a\b[^>]*>|</a>', ' ', t, flags=re.I)
t = re.sub(r'<!--.*?-->', '', t, flags=re.S)

# ---------- chapters ----------
HEADS = [('general_hour', 'GENERAL AGGRAVATION AT', 'Aggravation by the hour (general)'),
         ('seasons', 'SEASONAL REMEDIES', 'Seasons'),
         ('fever_times', 'FEVER REMEDIES', 'Fever times (chill, heat, sweat)'),
         ('periodicity', 'PERIODICITY', 'Periodicity'),
         ('day', 'DAYTIME REMEDIES', 'Day (4 a.m. – 6 p.m.)'),
         ('morning', 'MORNING REMEDIES', 'Morning (4 – 9 a.m.)'),
         ('forenoon', 'FORENOON REMEDIES', 'Forenoon (9 a.m. – noon)'),
         ('noon', 'NOON REMEDIES', 'Noon'),
         ('afternoon', 'AFTERNOON REMEDIES', 'Afternoon (noon – 6 p.m.)'),
         ('evening', 'EVENING REMEDIES', 'Evening (6 – 9 p.m.)'),
         ('night', 'NIGHT REMEDIES', 'Night (9 p.m. – 4 a.m.)'),
         ('moon_phases', 'MOON PHASES', 'Moon phases (successful prescriptions)')]
HEAD_TXT = {n: k for k, n, _ in HEADS}
HEAD_PREFIX = [(n, k) for k, n, _ in HEADS]

# ---------- remedy-name resolution ----------
try: _RN = json.load(open(os.path.join(APP, 'remedy_names.json')))
except Exception: _RN = {}
try:                                    # the app's remedy universe = Kent's own keys
    _KENT = json.load(open(os.path.join(APP, 'kent_repertory.json')))
    APPKEYS = sorted(set(a for ch in _KENT.values() for v in ch.values() for a in v['r']))
except Exception:
    APPKEYS = sorted(set(_RN))
def _sq(x): return re.sub(r'[^a-z0-9]', '', x.lower())
_AK = {_sq(k): k for k in APPKEYS}
# Boger's printed forms the prefix pass cannot settle (his books print both Latin and app-style forms)
BOGER_ALIAS = {
 'calad': 'calad', 'calc-c': 'calc', 'calc-ostr': 'calc', 'coc-c': 'cocc', 'coccus cacti': 'coc-c',
 'am-c': 'am-c', 'am-m': 'am-m', 'am-n': 'am-n', 'mag-c': 'mag-c', 'mag-m': 'mag-m', 'mag-p': 'mag-p',
 'nat-c': 'nat-c', 'nat-m': 'nat-m', 'nat-p': 'nat-p', 'nat-s': 'nat-s', 'chin-s': 'chin-s',
 'sulph-ac': 'sul-ac', 'phos-ac': 'ph-ac', 'ph-ac': 'ph-ac', 'hydr': 'hydr-ac', 'acid-ac': 'acet-ac',
 'fer': 'ferr', 'cup': 'cupr', 'eup-p': 'eup-pur', 'eup-per': 'eup-per', 'eup-pur': 'eup-pur',
 'euph': 'euph', 'euphr': 'euphr', 'kobalt': 'cob', 'mar': 'sabal', 'thromb': 'thromb',
 'lith-c': 'lith', 'saf': 'sabad', 'rot-h': 'crot-h', 'bap-p': 'bapt', 'merc-sulph': 'merc-sul',
 'fer-p': 'fer-p', 'fer-i': 'fer-i', 'fer-m': 'fer-m', 'thromb': 'thromb',
 'hel': 'helon', 'paon': 'paeon', 'ran-sc': 'ran-s', 'pod': 'podo', 'spon': 'spong',
 'arb-s': 'stram', 'scil': 'squil', 'tel': 'tel', 'tere': 'tereb', 'xal': 'xal', 'zyn': 'zyn',
 'ac': 'acet-ac', 'op': 'op', 'iris-f': 'ir-foe', 'can-s': 'canth', 'ant-c': 'ant-c', 'ant-t': 'ant-t', 'mur-ac': 'mur-ac', 'nit-ac': 'nit-ac',
 'nit-mur': 'nit-m-ac', 'ip': 'ip', 'jal': 'jal', 'nuc-v': 'nux-v', 'nux-v': 'nux-v', 'nu-mos': 'nux-m',
 'rhu-tox': 'rhus-t', 'sarr': 'sarr', 'men': 'meny', 'cact': 'cact', 'amyg': 'amyg', 'lyc': 'lyc',
}
APPKEY_SET = set(APPKEYS)
def resolve(tok):
    k = re.sub(r"[ .'\u2019\-]+", ' ', tok).strip().lower()
    ka = re.sub(r'[^a-z0-9]', '', k)
    if len(ka) < 2: return None, 'too-short'
    if k in BOGER_ALIAS:
        a = BOGER_ALIAS[k]
        return (a, 'boger') if a in APPKEY_SET else (None, 'bad-alias:' + a)
    if ka in _AK: return _AK[ka], 'key'
    c = sorted(v for kk, v in _AK.items() if kk.startswith(ka))
    if len(c) == 1: return c[0], 'key-prefix'
    if c: return sorted(c, key=lambda a: ('-' in a, len(a)))[0], 'key-prefix-amb'
    a, how = match(tok)
    return (a, 'names:' + how) if a else (None, 'unmatched')

# ---------- text + colour ----------
def visible(frag):
    """(plain text with collapsed whitespace, [source offset per char])"""
    txt = []; idx = []
    for m in re.finditer(r'<[^>]+>|[^<]+', frag):
        if m.group(0).startswith('<'): continue
        y = html.unescape(m.group(0)); pos = m.start()
        for ch in re.sub(r'\s+', ' ', y):
            if ch == ' ' and (not txt or txt[-1] == ' '): pos += 1; continue
            txt.append(ch); idx.append(pos); pos += 1
    return ''.join(txt), idx

COLOR_GRADE = {'#800000': 3, '#ff0000': 2}      # maroon = Boger's "I" (top), red = "II", plain/blue = 1
def color_marks(frag):
    spans = []
    for m in re.finditer(r'<font\b([^>]*)>((?:(?!</font>).)*?)</font>', frag, re.S | re.I):
        c = re.search(r'COLOR="?(#[0-9a-f]{6})"?', m.group(1), re.I)
        if not c: continue
        g = COLOR_GRADE.get(c.group(1).lower())
        if g and m.group(2).strip(): spans.append((m.start(2), m.end(2), g))
    return spans
def grade_of(frag, src, ln, marks):
    hit = []
    for a, b, g in marks:
        o = min(src + ln, b) - max(src, a)
        if o > 0: hit += [g] * o
    if not hit: return 1
    return max(collections.Counter(hit).items(), key=lambda kv: (kv[1], kv[0]))[1]

tok_stats = collections.Counter(); unmatched = collections.Counter(); known = []
SKIP = {'etc', 'viz', 'see', 'vide', 'no', 'and', 'or', 'the', 'of', 'a', 'b', 'c', 'amp', 'm', 'p', 't', 'boger'}
TOKRE = re.compile(r"[A-Za-z][A-Za-z.'\u2019&/\-]*\.?")
# colour markup sometimes cuts a remedy mid-word ("Fer-", "yc.") → merge when the piece has no final '.'
# and the next piece starts lowercase.
def merge_pieces(pieces):
    out = []
    for tok, span in pieces:
        if out and not out[-1][0].endswith('.') and re.match(r'^[a-z]', tok):
            out[-1] = (out[-1][0] + tok, (out[-1][1][0], span[1]))
        else:
            out.append((tok, span))
    return out

def parse_run(frag, start=0):
    """the remedy run of a paragraph (source offsets valid for the whole paragraph) → {abbr: grade}"""
    text, idx = visible(frag)
    marks = color_marks(frag)
    pieces = [(m.group(0), (m.start(), m.end())) for m in TOKRE.finditer(text, start)]
    out = {}
    for raw_tok, (ms, me) in merge_pieces(pieces):
        tok = raw_tok.strip(" .[]\u2019-").lower()
        tok = re.sub(r"[\u2019']", '', tok).strip()
        if len(tok) < 2 or tok in SKIP: continue
        a, how = resolve(tok)
        if not a and known:
            c = difflib.get_close_matches(tok, known, n=1, cutoff=0.9)
            if c: a, how = match(c[0])[0], 'fuzzy'
        if a:
            src = idx[ms] if ms < len(idx) else 0
            g = min(3, grade_of(frag, src, me - ms, marks))
            out[a] = max(out.get(a, 0), g)
            tok_stats[how] += 1
            if a not in known: known.append(a)
        else:
            tok_stats['unmatched'] += 1; unmatched[tok] += 1
    return out

# ---------- paragraphs → rubrics (v77: hierarchy = <blockquote> depth + "heur" heuristic) ----------
# Séror's HTML only partly encodes Boger's indentation through <blockquote> nesting.  Rules:
#  * colon-less short paragraph inside a chapter (Mind, Head, Eyes …) = SECTION → a remedy-less rubric
#  * blockquote depth d>0 → child of the nearest preceding rubric with smaller depth         (source = 'bq')
#  * depth 0 and the title is a time / modality modifier ("3 A. M.", "Awaking, on", "Amel." …)
#      → child of the last SYMPTOM rubric of the current section                              (source = 'heur')
#  * bare "After"/"during" → same stem as a preceding "…, before" or child of the previous line;
#    "And …" / lowercase start → child of the previous line                                   (source = 'heur-prev')
# Every 'heur*' placement is written to docs/boger_times_placement_report.md for manual checking against the book.
paras = []
_depth = 0
for m in re.finditer(r'<blockquote[^>]*>|</blockquote>|<p\b[^>]*>(.*?)</p>', t, re.S | re.I):
    g = m.group(0)[:12].lower()
    if g.startswith('<blockquote'): _depth += 1; continue
    if g.startswith('</blockquote'): _depth = max(0, _depth - 1); continue
    frag = m.group(1)
    txt = re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', frag))).strip()
    if txt: paras.append((txt, frag, _depth))

MOD_RE = re.compile(r"""^(\d|S\s?A\.|Noon|Mid-?night|Mid-?day|Morning|Forenoon|After-?\s?noon|Evening|Night|Day-?break|Day\b|Sun|
    At\b|In\b|On\b|Every|After|Before|During|Until|Till|To\b|From|Beginning|Begins|Amel|Agg|Worse|Better|Aw[a]?k|Waking|Rising|Bed\b|
    Break-?\s?fast|Dinner|Supper|Eating|Stool|Menses|Sleep|Lying|Walking|Sitting|Stooping|Motion|Increas|Decreas|Ceases|Returning|
    Same\b|Periodic|Alternate|Alternating|Daily|Towards|Lasting|Continu|With\b|Generally|Frequently|Opening)""", re.X | re.I)
PREV_RE = re.compile(r'^(And|Or)\s|^[a-z]')
BARE_RE = re.compile(r'^(after|before|during|until|till|then|amel|agg)\.?$', re.I)

def is_section(txt):
    return ':' not in txt and len(txt) <= 40 and not re.search(r'\d', txt) and not txt.upper().startswith('FOR SYMPTOMS')

rubrics = collections.OrderedDict((k, []) for k, _, _ in HEADS)
placements = []
cur = None; heads_hit = 0
stack = []
section = None; last_symptom = None; prev_path = None; prev_parent = None; prev_main = None
def _join(parent, title): return (parent + ', ' + title) if parent else title
for txt, frag, dep in paras:
    up = txt.upper().rstrip(' .')
    key = HEAD_TXT.get(up)
    if not key and ':' not in up and len(up) < 200:
        for n, k in HEAD_PREFIX:
            if up.startswith(n): key = k; break
    if key:
        cur = key; heads_hit += 1; section = None; last_symptom = None; prev_path = None; prev_main = None; stack = []; continue
    if cur is None or cur == 'moon_phases': continue
    mfix = re.match(r'^(\d[\d\s\-]*[AP]\.\s?M\.)\s+(?=[A-Z][a-z]+[-.])', txt)
    if ':' not in txt and mfix:            # "6 - 30 P. M. Aeth. Canth." — colon missing in the HTML
        txt = mfix.group(1) + ' :' + txt[mfix.end(1):]
    if ':' not in txt:
        if is_section(txt) and dep == 0:
            section = txt.strip(' .'); rubrics[cur].append((section, {})); last_symptom = None; prev_path = None; prev_main = None
            stack = [(-1, section)]
        continue
    title = re.sub(r'\s+', ' ', txt.split(':', 1)[0]).strip(' .,;-—–').strip()
    if not (1 <= len(title) <= 120): continue
    d = parse_run(frag, txt.find(':') + 1)
    if not d: continue
    base = section or ''
    if prev_path and BARE_RE.match(title):
        pp = prev_main or prev_path
        mrel = re.search(r'\b(before|during|after|until|till)$', pp, re.I)
        if mrel:
            stem = pp[:mrel.start(1)].rstrip(', ').rstrip()
            parent = stem.rsplit(', ', 1)[0] if ', ' in stem else stem
            title = (stem.rsplit(', ', 1)[-1] + ', ' + title.lower()) if ', ' in stem else title.lower()
            if parent == stem: parent = base
        else:
            parent = pp
        src = 'heur-prev'
    elif dep > 0:
        while stack and stack[-1][0] >= dep: stack.pop()
        parent = stack[-1][1] if stack else base; src = 'bq'
    elif prev_path and PREV_RE.match(title):
        parent = prev_path; src = 'heur-prev'
    elif cur != 'general_hour' and last_symptom and MOD_RE.match(title) and title.lower() != 'in general':
        parent = last_symptom; src = 'heur'
    else:
        parent = base; src = 'top'
    path = _join(parent, title)
    if dep == 0:
        stack = [(-1, section)] if section else []
        if src == 'top' and title.lower() != 'in general' and not MOD_RE.match(title): last_symptom = path
        stack.append((0.5, path))
    else:
        stack.append((dep, path))
    rubrics[cur].append((path, d)); prev_path = path; prev_parent = parent
    if not re.match(r'^(And|Or)\s', title): prev_main = path
    if src.startswith('heur'): placements.append((cur, src, dep, title, path))

def _write_report():
    rp = os.path.join(APP, 'docs', 'boger_times_placement_report.md'); os.makedirs(os.path.dirname(rp), exist_ok=True)
    with open(rp, 'w', encoding='utf8') as f:
        f.write('# Boger Times — inferred placements (verify against the book)\n\n')
        f.write('`heur` = time/modality line nested under the last symptom rubric; `heur-prev` = "After"/"during"/"And…"/lowercase line nested under the previous line.\n')
        f.write('Blockquote-derived (`bq`) and top-level lines are NOT listed.  Total: %d\n\n' % len(placements))
        f.write('| # | chapter | rule | line in source | placed as |\n|---|---|---|---|---|\n')
        for i, (c, sr, dp, ti, pa) in enumerate(placements, 1):
            f.write('| %d | %s | %s | %s | %s |\n' % (i, c, sr, ti.replace('|', '/'), pa.replace('|', '/')))
# ---------- moon-phases table (one <table>: remedy × "3 PQ" counts) ----------
PHASE = {'NL': 'New moon', 'PQ': 'First quarter', 'PL': 'Full moon', 'DQ': 'Last quarter',
         'NOUVELLE LUNE': 'New moon', 'PREMIER QUARTIER': 'First quarter',
         'PLEINE LUNE': 'Full moon', 'DERNIER QUARTIER': 'Last quarter'}
mt = re.search(r'<table.*?</table>', t, re.S | re.I)
agg = {}
if mt:
    for tr in re.finditer(r'<tr\b[^>]*>(.*?)</tr>', mt.group(0), re.S | re.I):
        cells = [re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', ' ', c))).strip()
                 for c in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', tr.group(1), re.S | re.I)]
        if len(cells) < 3 or not cells[0]: continue
        name = cells[0].strip('. ')
        if not re.match(r"^[A-Za-z][A-Za-z .'\u2019\-/]{2,40}$", name): continue
        abbr, how = resolve(name)
        if not abbr: continue
        for c in cells[1:]:
            mm = re.match(r'(\d+)\s*([A-Z]{2})', c.upper().replace(' ', ' '))
            if not mm: continue
            n, ph = int(mm.group(1)), PHASE.get(mm.group(2))
            if not ph or n <= 0: continue
            g = 3 if n >= 10 else (2 if n >= 5 else 1)
            key = ph + ', successful prescriptions'
            agg[key] = dict(agg.get(key, {})); agg[key][abbr] = max(agg[key].get(abbr, 0), g)
for title, d in agg.items(): rubrics['moon_phases'].append((title, d))

if DUMP:
    print('paras:', len(paras), '| headings hit:', heads_hit)
    for k, v in rubrics.items(): print(f'  {k:14s} {len(v):4d} rubrics |', [x[0][:34] for x in v[:3]])
    print('resolve how:', dict(tok_stats))
    print('unmatched top:', unmatched.most_common(25))
    sys.exit(0)

# ---------- write ----------
combined = collections.OrderedDict(); index = []
os.makedirs(os.path.join(APP, 'boger_times_chapters'), exist_ok=True)
for key, L in rubrics.items():
    if not L: continue
    data = collections.OrderedDict()
    for i, (title, rems) in enumerate(L): data['r%d' % i] = {'t': title, 'r': rems}
    combined[key] = data
    json.dump(data, open(os.path.join(APP, 'boger_times_chapters', key + '.json'), 'w', encoding='utf8'),
              ensure_ascii=False, separators=(',', ':'))
    index.append({'key': key, 'name': dict((k, n) for k, _, n in HEADS)[key], 'rubrics': len(data)})
_write_report()
json.dump(index, open(os.path.join(APP, 'boger_times_chapters', '_index.json'), 'w', encoding='utf8'), ensure_ascii=False)
json.dump(combined, open(os.path.join(APP, 'boger_times_repertory.json'), 'w', encoding='utf8'),
          ensure_ascii=False, separators=(',', ':'))
nr = sum(len(v) for v in combined.values())
refs = sum(len(x['r']) for v in combined.values() for x in v.values())
rems_all = sorted(set(a for v in combined.values() for x in v.values() for a in x['r']))
print(f'chapters={len(combined)} rubrics={nr} refs={refs} remedies={len(rems_all)}')
print('grades:', dict(sorted(collections.Counter(g for v in combined.values() for x in v.values() for g in x['r'].values()).items())))
print('resolve how:', dict(tok_stats), '| unmatched tokens:', sum(unmatched.values()))
print('top unmatched:', unmatched.most_common(20))
print('remedies missing from remedy_names.json:', sorted(a for a in rems_all if a not in _RN))
