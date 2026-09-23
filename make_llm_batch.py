# -*- coding: utf-8 -*-
"""Build an LLM drafting batch for one rubric: structural facts (from the repertory) + materia-medica excerpts
(from mm/*.json) per remedy, plus the prompt. Output: batches/<book>_<ch>_<rid>.json and .prompt.txt

usage: python3 make_llm_batch.py kent mind r2 [--top 5] [--theme "absent, forget, memory"] [--remedies nat-m,ign]
Optional direct call: set OPENAI_API_KEY (model gpt-4o-mini by default) → drafts are written to batches/<...>.drafts.json,
importable in the app via 📖 tab → 📥 (or merged with import_llm_drafts.py)."""
import json, os, re, sys, math, argparse, urllib.request
APP = '/home/user/bismillah-clinic'
sys.path.insert(0, os.path.dirname(__file__))

def load(p): return json.load(open(p, encoding='utf-8'))
def spec(N): return 1 / (math.log(2 + N) / math.log(2))
def plain(t): return re.sub(r'\*\*', '', re.sub(r'(^|[^A-Za-z0-9])_([^_\n]{1,240}?)_(?=[^A-Za-z0-9]|$)', r'\1\2', t))
def sentences(t):
    return [x.strip() for x in re.findall(r'[^.;!?]+(?:[.;!?]+["”\')\]]*|$)', t) if len(x.strip()) > 2]
def theme_words(title):
    base = re.sub(r'\s*\((?:see|cmp\.?|comp\.?|cf\.?)[^)]*\)', '', title, flags=re.I).split(',')[0]
    words = [w for w in re.split(r'[^A-Za-z]+', base) if len(w) >= 4]
    for m in re.finditer(r'\(\s*(?:see|cmp\.?|comp\.?|cf\.?)\s+([^)]+)\)', title, flags=re.I):
        for w in re.split(r'[,;]|\band\b', m.group(1)):
            if len(w.strip()) >= 4: words.append(w.strip())
    out = []; STOP = {'mind','general','generals','symptom','symptoms','part','parts','side','with','from','during','after','before','while','when','which','than','that','this','etc','other','things'}
    for w in words:
        w = re.sub(r'(ness|ing|ed|es|s)$', '', w.lower())
        if len(w) >= 4 and w not in out and w not in STOP: out.append(w)
    return ', '.join(out)
def theme_re(words):
    parts = [w.strip().lower() for w in re.split(r'[,،]', words) if len(w.strip()) >= 3]
    return re.compile('|'.join(re.escape(p) for p in parts), re.I) if parts else None

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('book'); ap.add_argument('ch'); ap.add_argument('rid')
    ap.add_argument('--top', type=int, default=5); ap.add_argument('--theme', default=''); ap.add_argument('--remedies', default='')
    ap.add_argument('--per-book', type=int, default=4); ap.add_argument('--excl', type=int, default=8)
    a = ap.parse_args()
    info = {'kent': 'kent_repertory.json', 'publicum': 'repertory-data.json', 'synthesis91': 'synthesis91_raw_repertory_by_key.json',
            'allen_fever': 'allen_fever_repertory.json', 'hs_clinical': 'hs_clinical_repertory.json', 'keynotes_cc': 'keynotes_cc_repertory.json', 'nosodes': 'nosodes_repertory.json'}
    data = load(os.path.join(APP, info[a.book]))
    ch = data[a.ch]; main_r = ch[a.rid]; title = main_r['t']; S = main_r['r']
    R = [x.strip() for x in a.remedies.split(',') if x.strip()] or sorted(S, key=lambda x: (-min(S[x], 3), x))[:a.top]
    theme = a.theme or theme_words(title); tre = theme_re(theme)
    names = load(os.path.join(APP, 'remedy_names.json'))
    # --- structural facts: exclusive rubrics of each remedy vs the others (whole book), grade differences
    excl = {r: [] for r in R}; excl_book = {r: [] for r in R}; gradediff = []
    for c, cd in data.items():
        for rid, v in cd.items():
            vec = [min(v['r'].get(r, 0), 3) for r in R]; present = [i for i, g in enumerate(vec) if g]
            if not present: continue
            N = len(v['r']); sc = spec(N)
            if len(present) == 1:
                i = present[0]; (excl if c == a.ch else excl_book)[R[i]].append((vec[i] * sc, vec[i], N, c, v['t']))
            elif len(present) == len(R) and max(vec) > min(vec) and c == a.ch:
                gradediff.append(((max(vec) - min(vec)) * sc, vec, N, c, v['t']))
    for r in R:   # same chapter first (most relevant to the rubric's theme), then a few from the whole book
        excl[r].sort(key=lambda x: (-x[0], x[2])); excl_book[r].sort(key=lambda x: (-x[0], x[2]))
        excl[r] = excl[r][:a.excl] + excl_book[r][:max(2, a.excl // 3)]
    gradediff.sort(key=lambda x: -x[0]); gradediff = gradediff[:10]
    # --- MM excerpts
    mm_index = load(os.path.join(APP, 'mm/_index.json'))
    books = {bid: load(os.path.join(APP, meta['file'])) for bid, meta in mm_index['books'].items()}
    short = {'kent_lectures': 'Kent, Lectures on Materia Medica (1905)', 'boericke': 'Boericke, Materia Medica (1927)', 'allen_keynotes': 'Allen, Keynotes (1898)', 'nash_leaders': 'Nash, Leaders (1913)'}
    excerpts = {}
    for r in R:
        ex = []
        for bid, bk in books.items():
            e = bk['remedies'].get(r)
            if not e or not tre: continue
            found = []
            for sec in e['sections']:
                for pi, p in enumerate(sec['p']):
                    for sn in sentences(p):
                        pl = plain(sn); hits = len(tre.findall(pl))
                        if not hits: continue
                        score = hits * 2 + sn.count('**') + sn.count('_') * 0.5 + (1 if (sec['h'] or '').lower() == 'mind' else 0)
                        found.append((score, pi, pl.strip(), sec['h']))
            found.sort(key=lambda x: (-x[0], x[1]))
            for sc, pi, txt, h in found[:a.per_book]: ex.append({'src': short.get(bid, bid), 'section': h, 'text': txt})
        excerpts[r] = ex
    batch = {'rubric': {'book': a.book, 'ch': a.ch, 'rid': a.rid, 'title': title, 'remedies_total': len(S)}, 'theme': theme,
             'remedies': [{'abbr': r, 'name': names.get(r, r), 'grade': min(S[r], 3),
                           'exclusive_rubrics': [{'grade': g, 'size': N, 'chapter': c, 'rubric': t} for sc, g, N, c, t in excl[r]],
                           'mm_excerpts': excerpts[r]} for r in R],
             'grade_differences': [{'grades': dict(zip(R, vec)), 'size': N, 'chapter': c, 'rubric': t} for sc, vec, N, c, t in gradediff]}
    os.makedirs('batches', exist_ok=True)
    base = f"batches/{a.book}_{a.ch}_{a.rid}"
    json.dump(batch, open(base + '.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    prompt = open(os.path.join(os.path.dirname(__file__), 'llm_draft_prompt.md'), encoding='utf-8').read()
    full = prompt + '\n\n---\nINPUT JSON:\n' + json.dumps(batch, ensure_ascii=False, indent=1)
    open(base + '.prompt.txt', 'w', encoding='utf-8').write(full)
    print('batch written:', base + '.json', '| remedies:', R, '| theme:', theme, '| prompt chars:', len(full))
    key = os.environ.get('OPENAI_API_KEY')
    if key:
        body = json.dumps({'model': os.environ.get('OPENAI_MODEL', 'gpt-4o-mini'), 'temperature': 0.2,
                           'messages': [{'role': 'system', 'content': prompt}, {'role': 'user', 'content': 'INPUT JSON:\n' + json.dumps(batch, ensure_ascii=False)}]}).encode()
        req = urllib.request.Request('https://api.openai.com/v1/chat/completions', data=body, headers={'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json'})
        out = json.loads(urllib.request.urlopen(req, timeout=180).read())['choices'][0]['message']['content']
        m = re.search(r'\{.*\}', out, re.S); drafts = json.loads(m.group(0)) if m else {}
        json.dump(drafts, open(base + '.drafts.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print('LLM drafts written:', base + '.drafts.json', len(drafts.get('notes', drafts)), 'notes')

if __name__ == '__main__': main()
