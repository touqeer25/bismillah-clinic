# -*- coding: utf-8 -*-
"""Build materia-medica JSON for the app from homeoint.org HTML (public-domain books).
Output: /home/user/bismillah-clinic/mm/<book>.json + _index.json
Format per book: {id,title,author,year,source,license,remedies:{abbr:{name,common,src,sections:[{h,p:[...]}]}},unmatched:[...]}
Text markers: **bold** (keynote emphasis in the source), _italic_ (characteristic emphasis)."""
import re, os, json, html, sys
sys.path.insert(0, '/home/user/mm_build')
from names import match, full_name
RAW = '/tmp/mm'
OUT = '/home/user/bismillah-clinic/mm'
os.makedirs(OUT, exist_ok=True)

def read(p):
    b = open(p, 'rb').read()
    try: s = b.decode('cp1252')
    except UnicodeDecodeError: s = b.decode('latin-1')
    return s.replace('\r', '')

def body(s):
    i = s.lower().find('<body'); j = s.lower().rfind('</body>')
    return s[i:j if j > 0 else None]

def para_split(b):
    """split html into paragraph chunks on <p ...> boundaries (returns list of raw html chunks)"""
    b = re.sub(r'<!--.*?-->', '', b, flags=re.S)
    parts = re.split(r'<p\b[^>]*>', b, flags=re.I)
    return parts[1:] if len(parts) > 1 else parts

def clean(chunk):
    """html chunk → text with **/_ markers"""
    t = chunk
    t = re.sub(r'</p\s*>.*$', '', t, flags=re.I | re.S)          # anything after the paragraph close belongs to the next chunk's wrapper
    t = re.sub(r'(?:<(?:b|strong|i|em|font)\b[^>]*>\s*)+$', '', t, flags=re.I)   # dangling openers at the end (next section's label wrapper)
    t = re.sub(r'^(?:\s*</(?:b|strong|i|em|font)\s*>)+', '', t, flags=re.I)     # dangling closers at the start
    t = re.sub(r'<br\s*/?>', '\x03', t, flags=re.I)
    t = re.sub(r'\s+', ' ', t)                      # HTML source line-wraps → spaces (only <br> makes a newline)
    t = re.sub(r'<(b|strong)\b[^>]*>', '\x01', t, flags=re.I); t = re.sub(r'</(b|strong)\s*>', '\x01', t, flags=re.I)
    t = re.sub(r'<(i|em)\b[^>]*>', '\x02', t, flags=re.I); t = re.sub(r'</(i|em)\s*>', '\x02', t, flags=re.I)
    t = re.sub(r'<[^>]+>', '', t)
    t = html.unescape(t).replace('\xa0', ' ')
    # balance markers per paragraph
    for m, out in (('\x01', '**'), ('\x02', '_')):
        if t.count(m) % 2: t = t.replace(m, '')
        t = t.replace(m, out)
    t = t.replace('\x03', '\n')
    t = re.sub(r'[ \t]+', ' ', t)
    t = re.sub(r' ?\n ?', '\n', t)
    t = re.sub(r'\n{2,}', '\n', t).strip()
    # drop empty emphasis
    t = t.replace('****', '').replace('__', '')
    return t

def plain(t): return re.sub(r'\*\*|_', '', t)

def is_noise(t):
    p = plain(t).strip()
    if not p or p in ('* * * * *', '*****', '&nbsp;'): return True
    if re.match(r'^(Main|Home|Keynotes by H\.C\. Allen|Buy a copy)$', p): return True
    if re.search(r'Copyright ©|Mise en page|Médi-T \d{4}', p): return True
    if re.search(r'Presented by|LECTURES ON HOM|HOMOPATHIC MATERIA MEDICA|Leaders In Homoeopathic Therapeutics|by William BOERICKE|by JAMES TYLER KENT|by E\. B\. NASH', p): return True
    return False

def titlecase(s):
    s = s.strip().rstrip('.').strip()
    if s.isupper(): s = s.title()
    return re.sub(r'\s+', ' ', s)

# ---------------------------------------------------------------- Kent lectures
def build_kent():
    book = {'id': 'kent_lectures', 'title': 'Lectures on Homoeopathic Materia Medica', 'author': 'James Tyler Kent', 'year': 1905,
            'source': 'http://www.homeoint.org/books3/kentmm/', 'license': 'public domain', 'remedies': {}, 'unmatched': []}
    d = os.path.join(RAW, 'kentmm')
    for f in sorted(os.listdir(d)):
        if not f.endswith('.htm') or f in ('index.htm', 'intro.htm', 'preface.htm', 'conclusion.htm'): continue
        b = body(read(os.path.join(d, f)))
        chunks = para_split(b)
        title = None; paras = []
        for c in chunks:
            align = 'center' in c[:0]  # placeholder
        # title = first CENTER paragraph that is not the header
        for m in re.finditer(r'<p[^>]*align="?center"?[^>]*>(.*?)</p>', b, flags=re.I | re.S):
            t = plain(clean(m.group(1)))
            if 'LECTURES' in t.upper() or 'Presented' in t: continue
            title = t.strip(); break
        for c in chunks:
            t = clean(c)
            if is_noise(t): continue
            if title and plain(t).strip() == title: continue
            paras.append(t)
        if not title: title = f[:-4]
        abbr, how = match(title)
        entry = {'name': title, 'src': f, 'sections': [{'h': '', 'p': paras}]}
        if abbr and abbr in book['remedies']:
            book['unmatched'].append({'name': title, 'src': f, 'paras': len(paras), 'dup_of': abbr, 'first': book['remedies'][abbr]['src']})
        elif abbr: book['remedies'][abbr] = entry
        else: book['unmatched'].append({'name': title, 'src': f, 'paras': len(paras)})
    return book

# ---------------------------------------------------------------- Boericke
SEC_RE = re.compile(r'^(?:\*\*)?\s*([A-Z][A-Za-z ,&\-]{1,40}?)\.?\s*--\s*(?:\*\*)?\s*(.*)$', re.S)
def build_boericke():
    book = {'id': 'boericke', 'title': 'Pocket Manual of Homoeopathic Materia Medica', 'author': 'William Boericke', 'year': 1927,
            'source': 'http://www.homeoint.org/books/boericmm/', 'license': 'public domain', 'remedies': {}, 'unmatched': []}
    d = os.path.join(RAW, 'boericmm')
    for letter in sorted(os.listdir(d)):
        ld = os.path.join(d, letter)
        if not os.path.isdir(ld): continue
        for f in sorted(os.listdir(ld)):
            if not f.endswith('.htm'): continue
            b = body(read(os.path.join(ld, f)))
            m = re.search(r'<font size="5" color="#800000">(.*?)</font>(.*?)</b>', b, flags=re.S | re.I)
            title = titlecase(plain(clean(m.group(1)))) if m else f[:-4]
            common = plain(clean(m.group(2))).strip() if m else ''
            sections = []; cur = {'h': '', 'p': []}
            for c in para_split(b):
                t = clean(c)
                if is_noise(t): continue
                if plain(t).strip().upper() == title.upper() or plain(t).strip() == common: continue
                if title and plain(t).strip().startswith(title.upper()): continue
                sm = SEC_RE.match(t)
                if sm:
                    if cur['p']: sections.append(cur)
                    cur = {'h': sm.group(1).strip(), 'p': []}
                    rest = sm.group(2).strip()
                    if rest: cur['p'].append(rest)
                    continue
                cur['p'].append(t)
            if cur['p']: sections.append(cur)
            abbr, how = match(title)
            entry = {'name': title, 'common': common, 'src': letter + '/' + f, 'sections': sections}
            if abbr:
                if abbr in book['remedies']:   # duplicate mapping → keep first, report second
                    book['unmatched'].append({'name': title, 'src': letter + '/' + f, 'paras': sum(len(s['p']) for s in sections), 'dup_of': abbr}); continue
                book['remedies'][abbr] = entry
            else: book['unmatched'].append({'name': title, 'src': letter + '/' + f, 'paras': sum(len(s['p']) for s in sections)})
    return book

# ---------------------------------------------------------------- Allen keynotes
def build_allen():
    book = {'id': 'allen_keynotes', 'title': 'Keynotes and Characteristics with Comparisons', 'author': 'Henry Clay Allen', 'year': 1898,
            'source': 'http://www.homeoint.org/books/allkeyn/', 'license': 'public domain', 'remedies': {}, 'unmatched': []}
    d = os.path.join(RAW, 'allkeyn')
    for f in sorted(os.listdir(d)):
        if not f.startswith('allkey') or f in ('allkeypr.htm',) or not f.endswith('.htm'): continue
        b = body(read(os.path.join(d, f)))
        blocks = re.split(r'<a name="([^"]+)">', b)
        for i in range(1, len(blocks), 2):
            anchor, chunk = blocks[i], blocks[i + 1]
            m = re.search(r'<p[^>]*align="?center"?[^>]*>(.*?)</p>', chunk, flags=re.S | re.I)
            title, common = anchor, ''
            if m:
                lines = [x.strip() for x in plain(clean(m.group(1))).split('\n') if x.strip()]
                if lines: title = titlecase(lines[0])
                if len(lines) > 1: common = lines[1]
            sections = []; cur = {'h': '', 'p': []}
            for c in para_split(chunk):
                t = clean(c)
                if is_noise(t): continue
                pt = plain(t).strip()
                if pt.rstrip('.') == title or pt == common or pt.startswith(title + '.'): continue
                hm = re.match(r'^\*\*(Relations|Relationship|Aggravation|Amelioration|Compare|Antidote[s]?)\.?\*\*\s*[:\-—]?\s*(.*)$', t, flags=re.S | re.I)
                if hm:
                    if cur['p']: sections.append(cur)
                    cur = {'h': hm.group(1).capitalize(), 'p': []}
                    if hm.group(2).strip(): cur['p'].append(hm.group(2).strip())
                    continue
                cur['p'].append(t)
            if cur['p']: sections.append(cur)
            if not sections: continue
            abbr, how = match(title)
            entry = {'name': title, 'common': common, 'src': f + '#' + anchor, 'sections': sections}
            if abbr and abbr not in book['remedies']: book['remedies'][abbr] = entry
            else: book['unmatched'].append({'name': title, 'src': f + '#' + anchor, 'paras': sum(len(s['p']) for s in sections), 'dup_of': abbr})
    return book

# ---------------------------------------------------------------- Nash leaders
def build_nash():
    book = {'id': 'nash_leaders', 'title': 'Leaders in Homoeopathic Therapeutics', 'author': 'Eugene Beauharnais Nash', 'year': 1913,
            'source': 'http://www.homeoint.org/books2/nashtherap/', 'license': 'public domain', 'remedies': {}, 'unmatched': [], 'essays': []}
    d = os.path.join(RAW, 'nashtherap')
    for f in sorted(os.listdir(d)):
        if not re.match(r'mmh\d+\.htm$', f): continue
        b = body(read(os.path.join(d, f)))
        blocks = re.split(r'<a name="([^"]+)">', b)
        for i in range(1, len(blocks), 2):
            anchor, chunk = blocks[i], blocks[i + 1]
            m = re.search(r'<p[^>]*align="?center"?[^>]*>(.*?)</p>', chunk, flags=re.S | re.I)
            title = titlecase(plain(clean(m.group(1)))) if m else titlecase(anchor.replace('_', ' '))
            paras = []
            for c in para_split(chunk):
                t = clean(c)
                if is_noise(t): continue
                pt = plain(t).strip()
                if pt.rstrip('.').upper() == title.upper(): continue
                paras.append(t)
            if not paras: continue
            abbr, how = match(title)
            entry = {'name': title, 'src': f + '#' + anchor, 'sections': [{'h': '', 'p': paras}]}
            if abbr and abbr not in book['remedies']: book['remedies'][abbr] = entry
            elif abbr: book['remedies'][abbr]['sections'].append({'h': title, 'p': paras})   # second essay on same remedy
            else: book['essays'].append({'title': title, 'src': f + '#' + anchor, 'paras': paras})
    return book

if __name__ == '__main__':
    which = sys.argv[1:] or ['kent', 'boericke', 'allen', 'nash']
    index = {}
    if os.path.exists(os.path.join(OUT, '_index.json')):
        _old = json.load(open(os.path.join(OUT, '_index.json'))); index = _old.get('books', _old)
    for w in which:
        book = {'kent': build_kent, 'boericke': build_boericke, 'allen': build_allen, 'nash': build_nash}[w]()
        p = os.path.join(OUT, book['id'] + '.json')
        json.dump(book, open(p, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        n = len(book['remedies']); words = sum(len(plain(x).split()) for r in book['remedies'].values() for s in r['sections'] for x in s['p'])
        index[book['id']] = {'title': book['title'], 'author': book['author'], 'year': book['year'], 'file': 'mm/' + book['id'] + '.json', 'remedies': n, 'words': words, 'bytes': os.path.getsize(p)}
        print(f"{book['id']}: {n} remedies matched, {len(book['unmatched'])} unmatched, {words:,} words, {os.path.getsize(p)/1e6:.2f} MB" + (f", essays {len(book.get('essays',[]))}" if 'essays' in book else ''))
        for u in book['unmatched'][:60]: print('   UNMATCHED:', u)
    # availability map
    avail = {}
    for bid, meta in index.items():
        bk = json.load(open(os.path.join(OUT, bid + '.json')))
        for a in bk['remedies']: avail.setdefault(a, []).append(bid)
    json.dump({'books': index, 'avail': avail}, open(os.path.join(OUT, '_index.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print('index: books', list(index), '| remedies with any MM:', len(avail))
