# -*- coding: utf-8 -*-
"""H. C. Allen — The Materia Medica of the Nosodes (1910), from the PDF text layer (Dr Nancy Malik's Drive copy).
Grades: 'II' → **bold**, 'I' → _italic_, θ kept.  usage: python3 allen_nosodes.py /tmp/allen_nosodes.pdf"""
import sys, re, os, json
sys.path.insert(0, '/home/user/mm_build')
from names import match
from ocr_books import save
import fitz
def build(pdf):
    d = fitz.open(pdf); txt = '\n'.join(p.get_text() for p in d)
    lines = [l.rstrip() for l in txt.split('\n')]
    book = {'id': 'allen_nosodes', 'title': 'The Materia Medica of the Nosodes', 'author': 'Henry Clay Allen', 'year': 1910,
            'source': 'PDF text layer (drnancymalik.wordpress.com collection) — public domain', 'license': 'public domain', 'remedies': {}, 'unmatched': []}
    cur = None; sec = None; buf = None; grade = ''
    def flush():
        nonlocal buf, grade
        if buf and sec is not None and cur is not None:
            t = re.sub(r'\s+', ' ', buf).strip()
            if len(t) > 2: sec['p'].append(('**' + t + '**') if grade == 'II' else (('_' + t + '_') if grade == 'I' else (('θ ' + t) if grade == 'θ' else t)))
        buf = None; grade = ''
    for l in lines:
        s = l.strip()
        if not s: continue
        if re.fullmatch(r'[A-Z][A-Z \-_]{3,40}\.?', s) and not re.fullmatch(r'(MIND|HEAD|GENERALITIES|SKIN|FEVER)\.?', s):   # remedy heading "MEDORRHINUM."
            flush(); title = s.rstrip('.').replace('_', ' ').title()
            abbr, how = match(title)
            cur = {'name': title, 'sections': []}; sec = None
            if abbr and abbr not in book['remedies']: book['remedies'][abbr] = cur
            elif abbr: book['unmatched'].append({'name': title, 'dup_of': abbr})
            else: book['unmatched'].append({'name': title})
            continue
        m = re.fullmatch(r'([A-Z][A-Za-z ,&\-]{2,40}) \(([A-Za-z][A-Za-z .\-]+)\)', s)   # section "Mind (Medorrhinum)"
        if m and cur is not None:
            flush(); sec = {'h': m.group(1).strip(), 'p': []}; cur['sections'].append(sec); continue
        if cur is None or sec is None: continue
        gm = re.match(r'^(II|I|θ|0|@)\s+(.*)$', s)
        if gm or re.match(r'^[A-Z"\(]', s) and buf and re.search(r'[.;:]$', buf.strip()):
            flush()
            if gm:
                g, rest = gm.group(1), gm.group(2)
                grade = 'II' if g == 'II' else ('I' if g == 'I' else 'θ'); buf = rest.strip()
            else: buf = s
        else:
            buf = (buf + ' ' + s) if buf else s
    flush()
    for a, e in list(book['remedies'].items()):
        e['sections'] = [x for x in e['sections'] if x['p']]
        if not e['sections']: del book['remedies'][a]
    return book
if __name__ == '__main__': save(build(sys.argv[1]))
