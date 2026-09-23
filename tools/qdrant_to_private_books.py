# -*- coding: utf-8 -*-
"""Convert the Qdrant backup (payload JSONL from tools/qdrant_export.py, plain or .gz) into PRIVATE book files
for the app's «📥 نجی کتابیں امپورٹ» (stored only in the browser's IndexedDB — never commit these files).

usage: python3 tools/qdrant_to_private_books.py backup.jsonl.gz out_dir/ [--skip "Kent"] [--merge]
Output: one JSON per book  {id, title, author, year, private:true, format:'pages', pages:[{p:<page>, t:<text>}], chunks:N}
        and (with --merge) private_books_all.json = {books:[...]} for a single import."""
import sys, os, re, json, gzip, argparse, collections

def open_any(p): return gzip.open(p, 'rt', encoding='utf-8') if p.endswith('.gz') else open(p, encoding='utf-8')

# nicer titles / authors for the known PDFs (fallback: file name)
KNOWN = {
 'Repertory of the Homeopathic Materia Medica': ('Kent — Repertory (PDF)', 'J. T. Kent', 1905),
 'Absolute Materia Medica': ('Absolute Homoeopathic Materia Medica', 'P. I. Tarkas & Ajit Kulkarni', 2023),
 'ROH Series': ('Rediscovery of Homoeopathy (ROH series)', 'M. L. Sehgal', 2000),
 'Instant Prescriber': ('Homoeopathic & Biochemic Instant Prescriber', 'R. L. Khullar', 1962),
 'Rapid Classial Prescribing': ('Classical Homoeopathy — Rapid Classical Prescribing', 'S. K. Banerjea', 2010),
 "Julian's Materia Medica of Nosodes": ('Materia Medica of Nosodes with Repertory', 'O. A. Julian', 1980),
 'End of Myasmation': ('The End of Myasmation of Miasms', 'Preeti Vijayakar', 2008),
 'essence_of_materia_medica': ('The Essence of Materia Medica', 'George Vithoulkas', 1988),
 'Part II-Theory of acutes': ('Predictive Homoeopathy Part II — Theory of Acutes', 'Prafull Vijayakar', 2023),
 'Treasures of the Dr. Prafull Vijayakar': ('Treasures — Charts & Rubrics', 'Prafull Vijayakar', 2023),
 'Predictive-Homoepathy-02 Charts': ('Predictive Homoeopathy — Charts & Rubrics', 'Prafull Vijayakar', 2023),
 'Pediatric Acute Remedy Keynotes': ('Pediatric Acute Remedy Keynotes', 'Prafull Vijayakar', 2023),
 'Part-1 Theory of Supression': ('Predictive Homoeopathy Part I — Theory of Suppression', 'Prafull Vijayakar', 2023),
}
def meta_for(book):
    for k, v in KNOWN.items():
        if k.lower() in book.lower(): return v
    t = re.sub(r'\.(pdf)$', '', book, flags=re.I); return (t[:80], '', 0)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out'); ap.add_argument('--skip', action='append', default=[]); ap.add_argument('--merge', action='store_true')
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
    by = collections.defaultdict(list)
    with open_any(a.src) as f:
        for line in f:
            if not line.strip(): continue
            r = json.loads(line); b = r.get('book') or (r.get('payload') or {}).get('book_name') or '?'
            if any(s.lower() in b.lower() for s in a.skip): continue
            pl = r.get('payload') or r; t = r.get('text') or pl.get('text') or ''; pg = r.get('page') if 'page' in r else pl.get('page_number')
            if t.strip(): by[b].append((pg, t))
    allbooks = []
    for b, items in by.items():
        title, author, year = meta_for(b)
        # merge chunks of the same page, in page order; dedupe identical chunks
        pages = collections.OrderedDict(); seen = set()
        for pg, t in sorted(items, key=lambda x: (int(x[0]) if str(x[0]).isdigit() else 10**9, str(x[0]))):
            key = (str(pg), t[:200])
            if key in seen: continue
            seen.add(key); pages.setdefault(str(pg), []).append(re.sub(r'\s+', ' ', t).strip())
        book = {'id': 'priv_' + re.sub(r'[^a-z0-9]+', '_', title.lower())[:40].strip('_'), 'title': title, 'author': author, 'year': year, 'private': True,
                'format': 'pages', 'source': b, 'chunks': len(items), 'pages': [{'p': p, 't': ' '.join(ts)} for p, ts in pages.items()]}
        fn = os.path.join(a.out, book['id'] + '.json'); json.dump(book, open(fn, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        allbooks.append(book); print(f"{len(book['pages']):5d} pages {os.path.getsize(fn)/1e6:5.2f} MB  {book['id']}  ← {b[:60]}")
    if a.merge:
        fn = os.path.join(a.out, 'private_books_all.json'); json.dump({'books': allbooks}, open(fn, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print('merged:', fn, os.path.getsize(fn) / 1e6, 'MB')
    print('\nKeep these files PRIVATE (copyrighted books). Import in the app: 🔬 → 📖 tab → 📥 نجی کتابیں.')

if __name__ == '__main__': main()
