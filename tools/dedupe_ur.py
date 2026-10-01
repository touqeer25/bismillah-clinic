# -*- coding: utf-8 -*-
# پچھلے ابواب کے دہرائے ٹکڑے صاف کرنا — وہی منطق جو mkbatch_ur.py میں صارف نے منظور کی
# استعمال:  python3 w/cleanup_ur.py            (خشک دوڑ: صرف رپورٹ)
#           python3 w/cleanup_ur.py --write     (TSV لکھیں + merge چلائیں)
import io, os, json, glob, sys, subprocess

REPO = '/home/user/repo'
src = io.open('/home/user/w/mkbatch_ur.py', encoding='utf-8').read()
code = src[src.index('JOIN = ('):src.index('fixed = 0')]   # عین وہی JOIN / infl / dedupe


def make(root):
    ns = {'ROOT': root}
    exec(code, ns)
    return ns['dedupe']


WRITE = '--write' in sys.argv
SKIP = {'mind'}          # پرانا لیبل نظام — ربرک فائل نہیں
report = {}
for p in sorted(glob.glob(REPO + '/ur/rubrics/kent/*.json')):
    name = os.path.basename(p)[:-5]
    if name in SKIP:
        continue
    d = json.load(io.open(p, encoding='utf-8'))
    root = (d.get('meta') or {}).get('root')
    if not root:
        continue
    dedupe = make(root)
    ch = []
    for k, v in d['rubrics'].items():
        nd = dedupe(v)
        if nd != v:
            ch.append((k, v, nd))
    if ch:
        report[name] = (root, ch)

tot = sum(len(v[1]) for v in report.values())
print('متاثرہ ابواب:', len(report), '| کل جملے:', tot)
for n, (root, ch) in sorted(report.items(), key=lambda x: -len(x[1])):
    print('  %-24s %5d' % (n, len(ch)))

print('\n--- تین مثالیں ---')
shown = 0
for n, (root, ch) in sorted(report.items(), key=lambda x: -len(x[1])):
    for k, old, new in ch[:3]:
        print('  «%s»\n    پہلے: %s\n    بعد : %s' % (k, old, new))
        shown += 1
        if shown >= 3:
            break
    if shown >= 3:
        break

if WRITE:
    os.makedirs(REPO + '/ur/rubrics/kent/cleanup', exist_ok=True)
    for n, (root, ch) in report.items():
        tsv = REPO + '/ur/rubrics/kent/cleanup/%s_fix.tsv' % n
        with io.open(tsv, 'w', encoding='utf-8') as f:
            for k, old, new in ch:
                f.write('%s\t=%s\n' % (k, new))
        out = subprocess.run(
            ['node', 'tools/merge_rubrics_ur.js', 'kent', n,
             'ur/rubrics/kent/cleanup/%s_fix.tsv' % n, '--root', root],
            cwd=REPO, capture_output=True, text=True,
            env=dict(os.environ, JSDOM_PATH=REPO + '/node_modules/jsdom'))
        tail = [l for l in out.stdout.strip().split('\n') if l.strip()][-2:]
        print('%-24s %s' % (n, ' | '.join(tail) if out.returncode == 0 else 'خرابی: ' + out.stderr[:200]))
