# -*- coding: utf-8 -*-
"""Crawl homeopathybooks.in book pages (the source Dr Nancy Malik's list links to) into local HTML.
usage: python3 crawl.py <index-url> <out-dir>"""
import re, sys, os, html, time, urllib.request
IDX, OUT = sys.argv[1], sys.argv[2]
UA = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'}
def get(u, tries=3):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=40) as r:
                return r.read().decode('utf8', 'replace')
        except Exception as e:
            if i == tries - 1: print('FAIL', u, e); return ''
            time.sleep(1.5 * (i + 1))
base = IDX.rsplit('/page/', 1)[0].rstrip('/')
pages = [IDX]
n = 2
while n <= 40:
    s = get(f'{base}/page/{n}/')
    if not s: break
    pages.append(f'{base}/page/{n}/'); n += 1
urls = []
for p in pages:
    s = get(p) if p != IDX else get(IDX)
    for u in re.findall(r'href="(' + re.escape(base) + r'/[^"]+/)"', s):
        if re.search(r'/(page/\d+|copyright-notice|disclaimer|privacy-policy|contact)/?$', u): continue
        if u not in urls: urls.append(u)
print('index pages:', len(pages), 'child pages:', len(urls))
os.makedirs(OUT, exist_ok=True)
for i, u in enumerate(urls, 1):
    key = re.sub(r'[^a-z0-9]+', '_', u.rstrip('/').split('/')[-1]).strip('_')[:70]
    out = os.path.join(OUT, key + '.html')
    if os.path.exists(out) and os.path.getsize(out) > 3000: continue
    s = get(u)
    if s:
        m = re.search(r'<article.*?</article>', s, re.S) or re.search(r'<main.*?</main>', s, re.S)
        open(out, 'w', encoding='utf8').write(m.group(0) if m else s)
    if i % 20 == 0: print(f'  {i}/{len(urls)}')
print('done, files:', len(os.listdir(OUT)))
