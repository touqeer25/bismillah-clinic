# -*- coding: utf-8 -*-
"""H. C. Allen — The Homoeopathic Therapeutics of Fevers (1879) → materia-medica book `allen_fevers`.
Input: the text version at homeopathybooks.in (the mirror Dr. Nancy Malik's book list links to), saved page
       per remedy: <out-dir>/*_fever_symptoms.html (one page = one remedy of Allen's MM part, 147 remedies).
       Crawl them with tools/mm_build/crawl_wp_pages.py <index-url> <out-dir>.
The remedy pages carry Allen's stage structure as plain paragraphs: a section name on its own line
(Characteristic / Type / Time / Cause / Prodrome / Chill / Heat / Sweat / Tongue / Pulse / Thirst …) followed by
its text, plus "Label: text" lines.  Sections are kept as they are → the 📖 tab and viewer read them directly.
Markers: sentences the source printed inside <b> stay **bold**, <i> stays _italic_ (app convention).
usage: BHC_APP=/path/to/app python3 allen_fevers_mm.py <pages-dir>"""
import re, os, sys, json, html, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
APP = os.environ.get('BHC_APP', '/home/user/bismillah-clinic')
from names import match, full_name

DIR = sys.argv[1] if len(sys.argv) > 1 else '/tmp/allen_pages'
LABELS = ['Characteristic', 'Characteristics', 'Type', 'Time', 'Cause', 'Prodrome', 'Chill', 'Heat', 'Sweat',
          'Apyrexia', 'Tongue', 'Thirst', 'Appetite', 'Desires', 'Aversions', 'Stomach', 'Abdomen', 'Stool',
          'Urine', 'Skin', 'Breathing', 'Cough', 'Pulse', 'Sleep', 'Sleepiness', 'Mind', 'Head', 'Face', 'Tips',
          'Relation', 'Relationship', 'Clinical', 'Cases', 'Concomitants of chill', 'Concomitants of heat',
          'Concomitants of sweat', 'Nursing', 'Dose', 'Follows', 'Complementary', 'Antidoted by', 'Not suited']
LAB = {l.lower(): l for l in LABELS}
# file names that are not remedy pages, or whose wording names.py cannot settle
ALIAS = {'ignatia strychnos': 'ign', 'ignatia amara': 'ign'}
NOT_REMEDY = {'feed', 'related posts', 'about', 'contact'}

def plain(x):
    return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]+>', '', x))).strip()

def to_text(x):
    t = x
    t = re.sub(r'<(?:b|strong)\b[^>]*>', '\x01', t, flags=re.I); t = re.sub(r'</(?:b|strong)\s*>', '\x01', t, flags=re.I)
    t = re.sub(r'<(?:i|em)\b[^>]*>', '\x02', t, flags=re.I); t = re.sub(r'</(?:i|em)\s*>', '\x02', t, flags=re.I)
    t = re.sub(r'<br\s*/?>', '\n', t, flags=re.I)
    t = re.sub(r'<[^>]+>', ' ', t)
    t = html.unescape(t).replace('\xa0', ' ')
    for m, o in (('\x01', '**'), ('\x02', '_')):
        if t.count(m) % 2: t = t.replace(m, '')
        t = t.replace(m, o)
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r' ?\n ?', '\n', t)
    t = re.sub(r'\n{2,}', '\n', t)
    return t.strip().replace('****', '').replace('__', '')

def remedy_name(fname):
    s = re.sub(r'_?fever_?symptoms$', '', os.path.splitext(fname)[0])
    return s.replace('_', ' ').strip()

book = {'id': 'allen_fevers', 'title': 'The Homoeopathic Therapeutics of Fevers',
        'author': 'Henry Clay Allen', 'year': 1879,
        'source': 'homeopathybooks.in text version of the 1879 book (Continued, Bilious, Intermittent, '
                  'Malarial, Remittent, Pernicious, Typhoid, Typhus, Septic, Yellow, Zymotic fevers)',
        'license': 'public domain', 'remedies': collections.OrderedDict(), 'unmatched': []}
unmatched = set(); nosub = []
for f in sorted(os.listdir(DIR)):
    if not f.endswith('.html'): continue
    nm = remedy_name(f)
    if len(nm) < 3 or nm.lower() in NOT_REMEDY: continue
    abbr, how = match(nm)
    if not abbr:
        abbr, how = match(re.sub(r'\bfever\b', '', nm).strip())
    if not abbr and nm.lower() in ALIAS: abbr = ALIAS[nm.lower()]
    if not abbr:
        unmatched.add(nm); continue
    s = open(os.path.join(DIR, f), encoding='utf8', errors='replace').read()
    m = re.search(r'<h1[^>]*>.*?</h1>(.*)', s, re.S)
    body = m.group(1) if m else s
    paras = [to_text(x) for x in re.findall(r'<p\b[^>]*>(.*?)</p>', body, re.S | re.I)]
    paras = [p.strip() for p in paras if p and len(p.strip()) > 8]
    paras = [p for p in paras if not p.lower().startswith('allen gives the therapeutic')
             and 'related posts' not in p.lower() and not p.lower().startswith('books & journals')]
    sections = collections.OrderedDict(); cur = 'General'
    def push(label, text):
        if not text: return
        if re.fullmatch(r'[*_ ]+', text): return          # nothing but markers
        if re.fullmatch(r'\*\*\s*[^*]{1,28}\s*\*\*', re.sub(r'\s+',' ',text).strip()):
            return                                         # the site's own section banner ("** Fever **", "** Arsenicum **")
        sections.setdefault(label, []).append(re.sub(r'\s+', ' ', text).strip())
    for p in paras:
        one_line = re.sub(r'\s+', ' ', p).strip()
        key = LAB.get(one_line.lower().strip(' .:'))
        if key:                                    # a section name printed on its own line
            cur = key; continue
        mi = re.match(r'^([A-Z][A-Za-z ]{2,26}):\s*(.*)$', one_line)
        if mi and mi.group(1).lower() in LAB and len(one_line) - len(mi.group(2)) < 30:
            cur = LAB[mi.group(1).lower()]
            push(cur, mi.group(2)); continue
        push(cur, one_line)
    if not sections: nosub.append(nm); continue
    secs = [{'h': h, 'p': ps} for h, ps in sections.items()]
    book['remedies'][abbr] = {'name': full_name(abbr), 'common': nm, 'sections': secs}
book['unmatched'] = sorted(unmatched)

OUT = os.path.join(APP, 'mm'); os.makedirs(OUT, exist_ok=True)
p = os.path.join(OUT, book['id'] + '.json')
json.dump(book, open(p, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
words = sum(len(re.sub(r'\*\*|_', '', x).split()) for r in book['remedies'].values() for sg in r['sections'] for x in sg['p'])
print(f"{book['id']}: {len(book['remedies'])} remedies, {words:,} words, {os.path.getsize(p)/1e6:.2f} MB")
print("unmatched remedy names:", book['unmatched'][:20])
print("pages without usable sections:", nosub[:10])

# index refresh (same rule as ocr_books.save)
ip = os.path.join(OUT, '_index.json'); ix = json.load(open(ip)) if os.path.exists(ip) else {'books': {}, 'avail': {}}
ix['books'][book['id']] = {'title': book['title'], 'author': book['author'], 'year': book['year'],
                           'file': 'mm/' + book['id'] + '.json', 'remedies': len(book['remedies']),
                           'words': words, 'bytes': os.path.getsize(p)}
avail = {}
for bid in ix['books']:
    try: bk = json.load(open(os.path.join(OUT, bid + '.json')))
    except Exception: continue
    for a in bk['remedies']: avail.setdefault(a, []).append(bid)
ix['avail'] = avail
json.dump(ix, open(ip, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print('index:', len(ix['books']), 'books | remedies with any MM:', len(avail))
