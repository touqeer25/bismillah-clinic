# -*- coding: utf-8 -*-
"""Hahnemann → app.  Source: homeoint.org (Médi-T 2006 HTML, public-domain translations).
  library/organon6.json            Organon, 6th edition — §§ with a 5th/6th variant keep only the 6th
  library/chronic_diseases.json    Chronic Diseases — theoretical part (§§)
  mm/hahnemann_chronic.json        Chronic Diseases — the 48 remedy provings, remedy-keyed like every other mm/ book
usage: python3 hahnemann_books.py <dir with hahorgan/ and hahchrdi/ downloaded> <app root>"""
import re, os, sys, json, html
SRC, APP = sys.argv[1], sys.argv[2]
def rd(p): return open(p, 'rb').read().decode('cp1252', 'replace')
def clean(x):
    x = re.sub(r'<script.*?</script>|<style.*?</style>', '', x, flags=re.S | re.I)
    x = re.sub(r'<br\s*/?>', '\n', x, flags=re.I)
    x = re.sub(r'</p>|<p\b[^>]*>|</?blockquote[^>]*>|</?h\d[^>]*>|</?tr[^>]*>', '\n\n', x, flags=re.I)
    x = html.unescape(re.sub(r'<[^>]+>', '', x))
    paras = [re.sub(r'\s+', ' ', p).strip() for p in re.split(r'\n\s*\n', x)]
    return [p for p in paras if p and p != '\xa0' and not p.startswith('Copyright ©') and p not in ('Chronic Diseases', 'Organon')]
def by_anchor(files, head_fmt):
    secs = []
    for f in files:
        t = rd(f); t = t[t.lower().find('<body'):]
        parts = re.split(r'<a name="(P\d+(?:E5|E6)?)"\s*>', t, flags=re.I)
        if len(secs) == 0 and parts[0]:
            pre = clean(parts[0])[3:]
            if pre: secs.append({'h': 'Introduction', 'p': pre})
        for i in range(1, len(parts), 2):
            aid, body = parts[i], parts[i + 1]
            if aid.endswith('E5'): continue
            n = re.match(r'P(\d+)', aid).group(1)
            ps = clean(body)
            if ps and re.match(r'^§\s*\d+', ps[0]): ps[0] = re.sub(r'^§\s*\d+\s*(Sixth Edition)?\s*', '', ps[0])
            secs.append({'h': head_fmt % n + (' (6th ed.)' if aid.endswith('E6') else ''), 'p': [p for p in ps if p]})
    return secs
def book(id_, title, year, source, secs, note=''):
    return {'id': id_, 'title': title, 'author': 'Samuel Hahnemann', 'year': year, 'source': source, 'license': 'public domain',
            'note': note, 'sections': secs, 'words': sum(len(' '.join(s['p']).split()) for s in secs)}
os.makedirs(os.path.join(APP, 'library'), exist_ok=True)
O = os.path.join(SRC, 'hahorgan')
front = [{'h': h, 'p': clean(rd(os.path.join(O, f)))[2:]} for h, f in (('Preface', 'orgapref.htm'), ('Introduction', 'orgaintr.htm'))]
files = sorted(os.path.join(O, f) for f in os.listdir(O) if re.match(r'organ\d+\.htm', f))
org = book('organon6', 'Organon of Medicine — 6th edition', 1842, 'http://www.homeoint.org/books/hahorgan/', front + by_anchor(files, '§ %s'),
           'Where the source prints both a 5th and a 6th edition text of a §, only the 6th is kept.')
json.dump(org, open(os.path.join(APP, 'library', 'organon6.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
C = os.path.join(SRC, 'hahchrdi')
front = [{'h': 'Prefaces', 'p': clean(rd(os.path.join(C, 'prefaces.htm')))[2:]}]
files = sorted(os.path.join(C, f) for f in os.listdir(C) if re.match(r'hahchr\d+\.htm', f))
cd = book('chronic_diseases', 'The Chronic Diseases — theoretical part', 1835, 'http://www.homeoint.org/books/hahchrdi/', front + by_anchor(files, '§ %s'),
          'The remedy provings of the same book are in the materia medica (📖) as “Hahn. CD”.')
json.dump(cd, open(os.path.join(APP, 'library', 'chronic_diseases.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
ABBR = {'agar': 'agar', 'alum': 'alum', 'amm-c': 'am-c', 'amm-m': 'am-m', 'anac': 'anac', 'ant-c': 'ant-c', 'ars': 'ars', 'aur-m': 'aur-m', 'aur': 'aur',
        'bar-c': 'bar-c', 'bor': 'bor', 'calc-c': 'calc', 'carb-a': 'carb-an', 'carb-v': 'carb-v', 'caust': 'caust', 'clem': 'clem', 'coloc': 'coloc',
        'conium': 'con', 'cupr': 'cupr', 'dig': 'dig', 'dulc': 'dulc', 'euph': 'euph', 'graph': 'graph', 'gua': 'guai', 'hep': 'hep', 'iod': 'iod',
        'kali-c': 'kali-c', 'lyc': 'lyc', 'mag-c': 'mag-c', 'mag-m': 'mag-m', 'mang': 'mang', 'mez': 'mez', 'mur-ac': 'mur-ac', 'nat-c': 'nat-c',
        'nat-m': 'nat-m', 'nit-ac': 'nit-ac', 'nitrum': 'kali-n', 'petr': 'petr', 'pho-ac': 'ph-ac', 'phos': 'phos', 'plat': 'plat', 'sars': 'sars',
        'sep': 'sep', 'sil': 'sil', 'stan': 'stann', 'sulph-ac': 'sul-ac', 'sulph': 'sulph', 'zinc': 'zinc'}
rem = {}
for f, a in ABBR.items():
    ps = clean(rd(os.path.join(C, f + '.htm')))
    k = next((i for i, p in enumerate(ps) if re.match(r'^[A-Z][A-Z .,\-()]{3,}\.?$', p) and 'CHRONIC' not in p), 0)
    name = ps[k].strip(' .').title() if ps else f
    body = ps[k + 1:]
    j = next((i for i, p in enumerate(body) if p.lstrip().startswith('-')), len(body))
    secs = [{'h': 'Introduction', 'p': body[:j]}] if j else []
    if j < len(body): secs.append({'h': 'Symptoms', 'p': [re.sub(r'^-\s*', '', p) for p in body[j:]]})
    rem[a] = {'name': name, 'src': f + '.htm', 'sections': secs}
mm = {'id': 'hahnemann_chronic', 'title': 'The Chronic Diseases (remedy provings)', 'author': 'Samuel Hahnemann', 'year': 1835,
      'source': 'http://www.homeoint.org/books/hahchrdi/', 'license': 'public domain', 'remedies': rem, 'unmatched': []}
OUT = os.path.join(APP, 'mm'); p = os.path.join(OUT, mm['id'] + '.json')
json.dump(mm, open(p, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
ip = os.path.join(OUT, '_index.json'); ix = json.load(open(ip)) if os.path.exists(ip) else {'books': {}, 'avail': {}}
ix['books'][mm['id']] = {'title': mm['title'], 'author': mm['author'], 'year': mm['year'], 'file': 'mm/' + mm['id'] + '.json', 'remedies': len(rem),
                         'words': sum(len(' '.join(' '.join(s['p']) for s in r['sections']).split()) for r in rem.values()), 'bytes': os.path.getsize(p)}
avail = {}
for bid in ix['books']:
    try: bk = json.load(open(os.path.join(OUT, bid + '.json')))
    except Exception: continue
    for a in bk['remedies']: avail.setdefault(a, []).append(bid)
ix['avail'] = avail
json.dump(ix, open(ip, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
lib = [{'id': b['id'], 'title': b['title'], 'author': b['author'], 'year': b['year'], 'file': 'library/' + b['id'] + '.json',
        'sections': len(b['sections']), 'words': b['words'], 'source': b['source']} for b in (org, cd)]
json.dump({'books': lib}, open(os.path.join(APP, 'library', '_index.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print('organon6', len(org['sections']), '| chronic theory', len(cd['sections']), '| CD remedies', len(rem), '| mm books', len(ix['books']))
