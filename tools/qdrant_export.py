# -*- coding: utf-8 -*-
"""Inspect / back up the clinic's Qdrant Cloud collection (PDF books data) WITHOUT changing anything.

usage:
  export QDRANT_URL="https://xxxx.cloud.qdrant.io:6333"   (from cloud.qdrant.io → cluster → endpoint)
  export QDRANT_API_KEY="..."                              (cluster API key)
  python3 tools/qdrant_export.py --list                    # collections + point counts + payload keys + book list
  python3 tools/qdrant_export.py --export backup.jsonl     # full backup: every point (id, payload, vector) as JSON lines
  python3 tools/qdrant_export.py --export-text books_text/ # payload text grouped per book (one JSON per book, no vectors)

Only the REST API + urllib are used (no extra packages). Nothing is deleted or modified.
The backup should be kept PRIVATE if the PDFs are copyrighted (never in the public GitHub repo)."""
import os, sys, json, argparse, urllib.request, collections, re

URL = os.environ.get('QDRANT_URL', '').rstrip('/')
KEY = os.environ.get('QDRANT_API_KEY', '')
COLL = os.environ.get('COLLECTION_NAME', 'homeopathy_knowledge')

def call(path, body=None, method=None):
    if not URL: sys.exit('set QDRANT_URL (and QDRANT_API_KEY)')
    req = urllib.request.Request(URL + path, data=(json.dumps(body).encode() if body is not None else None),
                                 headers={'api-key': KEY, 'Content-Type': 'application/json'}, method=method or ('POST' if body is not None else 'GET'))
    with urllib.request.urlopen(req, timeout=120) as r: return json.loads(r.read().decode('utf-8'))

def scroll(collection, with_vectors=False, page=256):
    nxt = None
    while True:
        body = {'limit': page, 'with_payload': True, 'with_vector': with_vectors}
        if nxt is not None: body['offset'] = nxt
        res = call(f'/collections/{collection}/points/scroll', body)['result']
        for p in res.get('points', []): yield p
        nxt = res.get('next_page_offset')
        if nxt is None: break

def guess_book(payload):
    for k in ('book_name', 'book', 'source', 'title', 'file', 'filename', 'document'):
        if payload.get(k): return str(payload[k])
    return '?'

def guess_text(payload):
    for k in ('text', 'content', 'page_content', 'chunk', 'body'):
        if payload.get(k): return str(payload[k])
    return ''

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--list', action='store_true'); ap.add_argument('--export'); ap.add_argument('--export-text')
    ap.add_argument('--collection', default=COLL); ap.add_argument('--sample', type=int, default=2000)
    a = ap.parse_args()
    if a.list or not (a.export or a.export_text):
        cols = call('/collections')['result']['collections']
        print('collections:', [c['name'] for c in cols])
        for c in cols:
            info = call(f"/collections/{c['name']}")['result']
            vec = info.get('config', {}).get('params', {}).get('vectors', {})
            print(f"\n== {c['name']}: points={info.get('points_count')} status={info.get('status')} vectors={vec}")
            books = collections.Counter(); keys = collections.Counter(); chars = 0; n = 0
            for p in scroll(c['name']):
                pl = p.get('payload') or {}; books[guess_book(pl)] += 1; chars += len(guess_text(pl)); n += 1
                for k in pl: keys[k] += 1
                if n >= a.sample: break
            print('   payload keys (sample):', dict(keys))
            print(f'   sample {n} points, avg text {chars // max(1, n)} chars')
            print('   books (sample counts):'); [print(f'     {v:5d}  {b[:90]}') for b, v in books.most_common(60)]
        return
    if a.export:
        n = 0
        with open(a.export, 'w', encoding='utf-8') as f:
            for p in scroll(a.collection, with_vectors=True):
                f.write(json.dumps(p, ensure_ascii=False) + '\n'); n += 1
                if n % 1000 == 0: print(n, 'points…')
        print('backup written:', a.export, n, 'points')
    if a.export_text:
        os.makedirs(a.export_text, exist_ok=True); by = collections.defaultdict(list); n = 0
        for p in scroll(a.collection):
            pl = p.get('payload') or {}; by[guess_book(pl)].append({'id': p.get('id'), 'page': pl.get('page_number', pl.get('page')), 'text': guess_text(pl)}); n += 1
        for b, items in by.items():
            items.sort(key=lambda x: (str(x.get('page') or ''), str(x['id'])))
            fn = re.sub(r'[^A-Za-z0-9._-]+', '_', b)[:80] or 'book'
            json.dump({'book': b, 'chunks': items}, open(os.path.join(a.export_text, fn + '.json'), 'w', encoding='utf-8'), ensure_ascii=False)
            print(f'{len(items):6d} chunks → {fn}.json')
        print('total', n, 'points in', len(by), 'books')

if __name__ == '__main__': main()
