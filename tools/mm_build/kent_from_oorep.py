# -*- coding: utf-8 -*-
"""Kent English repertory ← OOREP (www.oorep.com, public 'kent' repertory, 68,742 rubrics, ids aligned with kent-de).
Why: the old kent_chapters/ (66,148 rows) had whole runs of rubrics missing (EAR started at COLDNESS; ABSCESS, AIR,
BORING … were absent) and several wrong parent/child joins.
Step 1  harvest (network):  python3 kent_from_oorep.py harvest <workdir>
Step 2  build:              BHC_APP=<app> KENT_OLD=<old kent_chapters dir> python3 kent_from_oorep.py build <workdir>
        → kent_repertory.json + kent_chapters/*.json + kent_rubric_notes.json (notes re-keyed by rubric text)
Records keep the OLD rid ('r123') when the rubric existed before (clipboards / notes / history keep working);
new rubrics get 'o<oorep_id>', synthetic remedy-less main rubrics 'm<id>'.  Kent's pure "(See …)" cross-reference
rubrics (OOREP omits them) and the "(See …)" wording of main rubrics are restored from the old data."""
import json, os, re, sys, time, urllib.request, urllib.parse, collections
from concurrent.futures import ThreadPoolExecutor
MODE, WORK = sys.argv[1], sys.argv[2]
APP = os.environ.get('BHC_APP', '.')
WORDS = ["Abdomen", "Back", "Bladder", "Chest", "Chill", "Cough", "Ear", "Expectoration", "External", "Extremities", "Eye", "Face",
         "Fever", "Generalities", "Genitalia", "Head", "Hearing", "Kidneys", "Larynx", "Mind", "Mouth", "Nose", "Perspiration",
         "Prostate", "Rectum", "Respiration", "Skin", "Sleep", "Stomach", "Stool", "Teeth", "Throat", "Urethra", "Urine", "Vertigo", "Vision"]
if MODE == 'harvest':
    os.makedirs(WORK, exist_ok=True)
    def get(q, p):
        u = "https://www.oorep.com/api/lookup_rep?" + urllib.parse.urlencode(dict(symptom=q, repertory='kent', page=p, remedyString='', minWeight=0, getRemedies=1))
        for t in range(6):
            try: return json.load(urllib.request.urlopen(u, timeout=90))
            except Exception: time.sleep(5 + t * 5)
        raise RuntimeError('fail %s %d' % (q, p))
    def conv(d, out):
        for r in d['results']:
            for s in r['subRubrics']:
                ru = s['rubric']
                out[ru['id']] = {'id': ru['id'], 'ch': ru['chapterId'], 'p': ru['fullPath'], 'r': {w['remedy']['nameAbbrev']: w['weight'] for w in s['weightedRemedies']}}
    def one(q):
        f = os.path.join(WORK, q + '.json')
        if os.path.exists(f): return q, 'skip'
        out = {}; d = get(q, 0)[0]; conv(d, out)
        with ThreadPoolExecutor(4) as ex:
            for dd in ex.map(lambda p: get(q, p), range(1, d['totalNumberOfPages'])): conv(dd[0], out)
        json.dump(list(out.values()), open(f, 'w')); return q, len(out)
    with ThreadPoolExecutor(3) as ex:
        for r in ex.map(one, WORDS): print(*r, flush=True)
    sys.exit(0)

# ---------------- build ----------------
recs = {}
for f in os.listdir(WORK):
    if f.endswith('.json') and not f.startswith('_'):
        for x in json.load(open(os.path.join(WORK, f))): recs[x['id']] = x
OLD = os.environ.get('KENT_OLD', os.path.join(APP, 'kent_chapters'))
old_idx = json.load(open(os.path.join(OLD, '_index.json')))
NAME = {c['key']: c['name'] for c in old_idx}
def ch_key(fp): return fp.split(',')[0].strip().lower().replace(' ', '_')
by_ch = collections.OrderedDict((c['key'], []) for c in old_idx)
unknown = collections.Counter()
for x in sorted(recs.values(), key=lambda x: x['id']):
    k = ch_key(x['p'])
    if k in by_ch: by_ch[k].append(x)
    else: unknown[k] += 1
# OOREP abbreviation → the app's historical Kent key (other books, clipboards and remedy_names.json use these).
# Derived from co-occurrence on rubrics present in both the old and the new data, reviewed by hand.
TO_APP = {'alst-c': 'alst', 'alum-met': 'alum-m', 'amyg-am': 'amyg', 'anis': 'ill', 'ant-o': 'ant-ox', 'arg': 'arg-m', 'arg-m': 'arg-mur',
  'ars-met': 'ars-m', 'arund-d': 'arund', 'bism-ox': 'bism', 'both-l': 'both', 'cadm-s': 'cadm', 'calc-acet': 'calc-ac', 'carbn-h': 'carb-h',
  'carbn-o': 'carb-o', 'carbn-s': 'carb-s', 'casta-v': 'cast-v', 'cere-s': 'cer-s', 'chin-ar': 'chin-a', 'cit-a': 'cit-v', 'cocain': 'cocaine',
  'cocci-s': 'cocc-s', 'croto-t': 'crot-t', 'cupr-acet': 'cupr-ac', 'euph': 'eupho', 'ferr-acet': 'ferr-ac', 'helo': 'helod', 'ictod': 'poth',
  'irid': 'iridium', 'iris-fl': 'ir-f', 'iris-foe': 'ir-foe', 'kali-fcy': 'kali-fer', 'lac-ac': 'lact-ac', 'lava-h': 'hecla', 'lith-c': 'lith',
  'm-arct': 'mag-arct', 'm-aust': 'mag-aust', 'menth': 'ment', 'merc-pr-r': 'merc-p-r', 'merc-s': 'merc-sul', 'myrt-c': 'myrt',
  'nat-acet': 'nat-ac', 'nat-ar': 'nat-a', 'nat-hchls': 'nat-h', 'nitrob': 'benz-n', 'polyg': 'polyg-h', 'pop': 'pop-t', 'prun': 'prun-s',
  'sac-alb': 'sacc', 'salx-n': 'sal-n', 'solid': 'sol-v', 'stront-c': 'stront', 'uran-n': 'uran', 'zinc-acet': 'zinc-ac', 'zinc-o': 'zinc-ox',
  'ant-ar': 'ant-a', 'arg-cy': 'arg-c', 'aur-ar': 'aur-a', 'bals-p': 'bals', 'bar-acet': 'bar-ac', 'chr-o': 'chr-ox', 'convo-d': 'conv-d',
  'dubin': 'dub', 'frag': 'frag-v', 'ingluv': 'ing', 'juni-v': 'juni', 'kali-acet': 'kali-a', 'merc-acet': 'merc-ac', 'naphtin': 'naph',
  'paull-p': 'paull', 'rad-br': 'rad', 'sanguin-n': 'sang-n', 'lappa': 'lappa-a', 'ant-m': 'ant-chl'}
def abbr(a):
    a = a.strip().rstrip('.').lower()
    return TO_APP.get(a, a)
def up_first(t):                                   # Kent prints only the first word of a main rubric in capitals
    m = re.match(r"^([^\s,]+)(.*)$", t)
    return (m.group(1).upper() + m.group(2)) if m else t
def build_chapter(L):
    """Tree by existing comma prefixes (case-insensitive, first spelling wins), remedy-less main rubric where only
    sub-rubrics exist, written depth-first with each level ordered by the smallest OOREP id in the subtree."""
    nodes = {}; items = []
    for x in L:
        parts = x['p'].split(', ', 1)
        if len(parts) == 1: continue
        items.append((x['id'], parts[1].strip(), {abbr(a): g for a, g in x['r'].items()}))
    canon = {}
    for oid, t, r in items:
        segs = t.split(', ')
        for i in range(1, len(segs) + 1): canon.setdefault(', '.join(segs[:i]).lower(), ', '.join(segs[:i]))
    for oid, t, r in items:
        segs = t.split(', ')
        t = ', '.join(canon[', '.join(segs[:i]).lower()].split(', ')[-1] for i in range(1, len(segs) + 1))
        k = t.lower()
        if k in nodes and nodes[k]['real']: k = k + '\x00%d' % oid
        n = nodes.setdefault(k, {'t': t, 'r': {}, 'id': oid, 'kids': [], 'real': False})
        n.update(t=t, r=r, id=oid, real=True)
        main = segs[0].lower()
        if main not in nodes: nodes[main] = {'t': canon[main], 'r': {}, 'id': oid, 'kids': [], 'real': False}
    keys = set(nodes); root = []
    for k, n in nodes.items():
        segs = k.split('\x00')[0].split(', '); par = None
        for i in range(len(segs) - 1, 0, -1):
            pk = ', '.join(segs[:i])
            if pk in keys: par = pk; break
        (nodes[par]['kids'] if par else root).append(k)
    def minid(k):
        n = nodes[k]
        if 'mid' not in n: n['mid'] = min([n['id']] + [minid(c) for c in n['kids']])
        return n['mid']
    out = collections.OrderedDict()
    def walk(ks):
        for k in sorted(ks, key=minid):
            n = nodes[k]
            rid = ('o%d' % n['id']) if n['real'] else ('m%d' % n['id'])
            while rid in out: rid += 'b'
            rec = {'t': up_first(n['t']), 'r': n['r']}
            if n['real']: rec['oorep_id'] = n['id']
            out[rid] = rec
            walk(n['kids'])
    walk(root)
    return out
def norm(t):
    t = t.lower().replace('æ', 'ae').replace('œ', 'oe')
    return re.sub(r'\s+', ' ', re.sub(r'\([^)]*\)', '', t)).replace(' ,', ',').strip(' ,')
OLD_T = {}; SEE_REN = {}
def old_rids(ch):
    f = os.path.join(OLD, ch + '.json')
    if not os.path.exists(f): return {}
    d = json.load(open(f)); m = {}
    for rid, v in d.items():
        if re.match(r'^r\d+$', rid): m.setdefault(norm(v['t']), rid); OLD_T[(ch, rid)] = v['t']
    for rid, v in d.items():                        # old paths with a sibling's words glued in → also without one middle segment
        sg = norm(v['t']).split(', ')
        for i in range(1, len(sg) - 1): m.setdefault(', '.join(sg[:i] + sg[i + 1:]), rid)
    return m
def assign_old(data, om, ch):
    used = set(); new = collections.OrderedDict(); kept = 0
    for rid, v in data.items():
        o = om.get(norm(v['t']))
        if o and o not in used:
            used.add(o); kept += 1
            ot = OLD_T.get((ch, o), '')
            if '(See' in ot and norm(ot) == norm(v['t']) and ', ' not in v['t'] and ', ' not in ot.split('(See')[0]:
                SEE_REN[v['t']] = ot; v = dict(v, t=ot)
            new[o] = v
        else: new[rid] = v
    return new, kept
see_added = 0
def add_see_refs(data, ch):
    f = os.path.join(OLD, ch + '.json')
    if not os.path.exists(f): return data
    have = {norm(v['t']) for v in data.values()}
    adds = [(rid, v) for rid, v in json.load(open(f)).items() if '(See' in v['t'] and not v['r'] and norm(v['t']) not in have and rid not in data]
    if not adds: return data
    global see_added; see_added += len(adds)
    items = list(data.items())
    def mainkey(t): return re.sub(r'[^a-z ]', '', t.split(',')[0].split('(')[0].lower()).strip()
    for rid, v in adds:
        mk = mainkey(v['t']); pos = len(items)
        for i, (r2, v2) in enumerate(items):
            if ',' not in v2['t'] and mainkey(v2['t']) > mk: pos = i; break
        items.insert(pos, (rid, {'t': v['t'], 'r': {}}))
    return collections.OrderedDict(items)
kept_total = 0
out = collections.OrderedDict(); index = []; general = {}
for k, L in by_ch.items():
    for x in L:
        if ', ' not in x['p']: general[k] = {abbr(a): g for a, g in x['r'].items()}
    data = build_chapter(L)
    data, kept = assign_old(data, old_rids(k), k); kept_total += kept
    data = add_see_refs(data, k)
    if SEE_REN:
        for rid, v in data.items():
            head = v['t'].split(', ', 1)
            if len(head) == 2 and head[0] in SEE_REN: v['t'] = SEE_REN[head[0]] + ', ' + head[1]
        SEE_REN.clear()
    out[k] = data
    index.append({'key': k, 'name': NAME[k], 'rubrics': len(data)})
os.makedirs(os.path.join(APP, 'kent_chapters'), exist_ok=True)
for k, data in out.items():
    json.dump(data, open(os.path.join(APP, 'kent_chapters', k + '.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
json.dump(index, open(os.path.join(APP, 'kent_chapters', '_index.json'), 'w', encoding='utf8'), ensure_ascii=False)
json.dump(out, open(os.path.join(APP, 'kent_repertory.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
np_ = os.path.join(APP, 'kent_rubric_notes.json'); moved = lost = 0; lost_list = []
if os.path.exists(np_):
    notes = json.load(open(np_)); new = {}
    for ch, d in notes.items():
        idx = {norm(v['t']): rid for rid, v in out.get(ch, {}).items()}
        for rid, n in d.items():
            ot = norm(n.get('t', '')); nr = idx.get(ot)
            if not nr and ot.count(', ') >= 2:
                sg = ot.split(', ')
                for i in range(1, len(sg) - 1):
                    nr = idx.get(', '.join(sg[:i] + sg[i + 1:])) or (idx.get(', '.join(sg[:i] + sg[i + 2:])) if i + 2 < len(sg) else None)
                    if nr: break
            if nr: new.setdefault(ch, {})[nr] = dict(n, t=out[ch][nr]['t']); moved += 1
            else: lost += 1; lost_list.append(ch + ': ' + n.get('t', ''))
    json.dump(new, open(np_, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    os.makedirs(os.path.join(APP, 'docs'), exist_ok=True)
    open(os.path.join(APP, 'docs', 'kent_notes_unmatched.txt'), 'w').write('\n'.join(lost_list))
print('chapters', len(out), 'rubrics', sum(len(v) for v in out.values()), 'oorep records', len(recs), '| unknown', dict(unknown))
print('notes moved', moved, 'unmatched', lost, '| old rid kept', kept_total, '| see-also restored', see_added)
