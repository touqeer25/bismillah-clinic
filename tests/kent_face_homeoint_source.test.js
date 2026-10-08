'use strict';
// tests/kent_face_homeoint_source.test.js — v173: چہرہ باب (صفحات 355–396) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/face.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/face.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_face_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-face-v1');
assert.strictEqual(srcEntries.length, 1988, 'ماخذی قطاریں: 1988 (1987 + باب کی جڑ FACE)');
assert.strictEqual(Object.keys(data).length, 2128, 'پرانی مقامی قطاریں فائل میں محفوظ (2128 کل)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_FACE_SOURCE_MARKER="homeoint-face-v1",_REP_KENT_FACE_COUNT=1988;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentFaceSourceEntries') + grab('_repHasKentFaceSourceData') + grab('_repBuildKentFaceSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentFaceSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentFaceSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 1988, 'درخت کے ربرک 1988');
assert.strictEqual(tree.order[0], 'FACE', 'باب کی جڑ FACE پہلی قطار');
assert.ok(tree.count === 132, 'جڑ کے بچے 132 (جڑ قطار + 131 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 6, 'زیادہ سے زیادہ گہرائی 6');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 355 || p > 396) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 42, '42 صفحات (355–396) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + مستند درستیاں (ہر ایک کتاب کے bbox x-координات سے تصدیق شدہ)
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// ENLARGED parotid gland (ص 365 — کتاب x=128.7 right/left ہم سطح، jaw/submaxillary x=92.7):
const en = tree.children['ENLARGED parotid gland'];
assert.ok(en && Array.from(en.order).join(',') === 'right,left,jaw,submaxillary', 'ENLARGED: right/left/jaw/submaxillary کتابی ترتیب');
// EXPRESSION, anxious (ص 374-375): cradle/downward d1 بھائی (کتاب x=128.7 quirk)، alphabetical ذیلیاں
const exp = findNode(tree, 'EXPRESSION, anxious, cradle, when child is lifted from');
assert.ok(exp && exp.remedies['calc'] === 1, 'cradle: EXPRESSION-anxious کی d1 ذیلی (Calc.)');
assert.ok(findNode(tree, 'EXPRESSION, anxious, downward motion, during'), 'downward-motion: d1 بھائی');
assert.ok(findNode(tree, 'EXPRESSION, anxious, suffering') && Object.keys(findNode(tree, 'EXPRESSION, anxious, suffering').remedies).length === 50, 'suffering: 50 ادویات (ص 375)');
// PAIN > stitching > jaws, lower (ص 388): morning/evening/night/walking d3 بھائی؛ joints of d3 (کتاب x=164.7)
const jl = findNode(tree, 'PAIN (aching, prosopalgia, etc.), stitching, jaws, lower');
assert.ok(jl && Array.from(jl.order).join(',') === 'morning,evening,night,walking, while,joints of,upper', 'jaws-lower: time-بھائی + joints of + upper (کتابی ترتیب)');
assert.ok(findNode(tree, 'PAIN (aching, prosopalgia, etc.), stitching, jaws, lower, joints of, motion, on'), 'joints-of > motion-on (d4)');
assert.ok(findNode(tree, 'PAIN (aching, prosopalgia, etc.), stitching, jaws, lower, joints of, extending to ear, neck'), 'extending > neck (d5 — کتاب x=236.7)');
// PAIN > tearing > jaw, lower (ص 390): evening/night/extending d3؛ to-ear d4؛ upper d3؛ morning/evening/angle-of d4
const te = findNode(tree, 'PAIN (aching, prosopalgia, etc.), tearing, jaw, lower');
assert.ok(te && Array.from(te.order).join(',') === 'evening,night, during menses,extending to chin,upper', 'tearing jaw-lower: کتابی ترتیب (evening x=200.7 quirk → d3؛ upper x=164.7 → d3)');
assert.ok(findNode(tree, 'PAIN (aching, prosopalgia, etc.), tearing, jaw, lower, extending to chin, to ear'), 'to-ear d4 (کتاب x=236.7)');
assert.ok(findNode(tree, 'PAIN (aching, prosopalgia, etc.), tearing, jaw, lower, upper, angle of'), 'upper > angle-of (d4)');
// PAIN > cold applications agg. > amel. (ص 825-826 — کتاب x=164.7 quirk → d2 سیمینٹکس)
assert.ok(findNode(tree, 'PAIN (aching, prosopalgia, etc.), cold applications agg., amel.') && Object.keys(findNode(tree, 'PAIN (aching, prosopalgia, etc.), cold applications agg., amel.').remedies).length === 17, 'cold-applications > amel. (16 ادویات، صفحہ-سرحد کے بعد جاری)');
// DISCOLORATION کی کتابی ذیلیاں (ص 358-364)
assert.ok(findNode(tree, 'DISCOLORATION, ashy, black') && findNode(tree, 'DISCOLORATION, ashy, bluish') && findNode(tree, 'DISCOLORATION, ashy, pale') && findNode(tree, 'DISCOLORATION, ashy, red') && findNode(tree, 'DISCOLORATION, ashy, yellow'), 'DISCOLORATION-ashy (کتابی مین، ص 776): black/bluish/pale/red/yellow');
// دستی جوڑیاں (Jaccard = 1.000، کتابی تصدیق شدہ)
const lg = tree.children['LARGE, sensation of being'];
assert.ok(lg && lg.remedies['acon'] === 3 && lg.children['after dinner'], 'LARGE: col-0 کتابی مین (ص 820) + after-dinner ذیلی — m32972 کی چوری واپس');
const mb = findNode(tree, 'PAIN (aching, prosopalgia, etc.), menses, before, after');
assert.ok(mb && mb.remedies['spig'] === 1 && findNode(tree, 'PAIN (aching, prosopalgia, etc.), menses, before, during'), 'menses: during+after بھائی (کتاب ص 827) — OOREP فلیٹ درست');
const spl = findNode(tree, 'PAIN (aching, prosopalgia, etc.), splinter, as from a');
assert.ok(spl && spl.remedies['agar'] === 1 && findNode(tree, 'PAIN (aching, prosopalgia, etc.), splinter, as from a, lips'), 'splinter: {Agar.} + lips ذیلی (ص 842) — lips-splinter (ص 383) سے الگ');
const sw = findNode(tree, 'SWELLING, on waking');
assert.ok(sw && sw.remedies['spig'] === 1 && sw.remedies['hura'] === 1, 'SWELLING on-waking: OOREP لیبل-فرق جوڑ (ص 852)');
const exc = findNode(tree, 'PAIN (aching, prosopalgia, etc.), excitement');
assert.ok(exc && exc.remedies['staph'] === 2, 'PAIN excitement: OOREP کا «agg.» پسلیقہ ہٹا (کتاب ص 826)');
assert.ok(findNode(tree, 'HEAT, walking, while'), 'HEAT walking-while جوڑ');
// بحالیاں (30 hN میں سے نمونے)
assert.ok(tree.children['ŒDEMA (See Swelling)'] || tree.children['ŒDEMA'], 'ŒDEMA بحال (ص 821)');
assert.ok(tree.children['SHRIVELED (See Wrinkled)'], 'SHRIVELED بحال (ص 850)');
assert.ok(findNode(tree, 'SHRIVELED (See Wrinkled), lips'), 'SHRIVELED lips بحال');
assert.ok(findNode(tree, 'HEAT, flashes, alternating with chills'), 'HEAT flashes-خاندان بحال');
assert.ok(findNode(tree, 'PAIN (aching, prosopalgia, etc.), drawing, upper jaw, masseter'), 'drawing upper-jaw خاندان بحال');
assert.ok(findNode(tree, 'TENSION of skin, night, 1 to 4 a.m.'), 'TENSION night 1-4a.m. بحال');
assert.ok(findNode(tree, 'DISCOLORATION, ashy, ghastly (see pale)'), 'ashy ghastly بحال');
// TENSION > morning, on waking (کتاب ص 856 — SWELLING کی نہیں!)
const tow = findNode(tree, 'TENSION of skin, morning, on waking');
assert.ok(tow && tow.remedies['am-c'] === 1, 'TENSION morning-on-waking {Am-c.} — کتابی جگہ درست');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «چہرہ — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('چہرہ — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «چہرہ — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto), 'meta.auto فہرست (خود-بنے جملے نظرثانی کے لیے)');

// 6) مانی فیسٹ + تصدیق-ضروری CSV
assert.strictEqual(manifest.source_rows, 1988);
assert.strictEqual(manifest.matched_app_records, 1958);
assert.strictEqual(manifest.new_source_records, 30);
assert.strictEqual(manifest.legacy_local_records, 140);
const csvPath = path.join(ROOT, '..', 'download', 'kent-confirmation-needed.csv');
if (fs.existsSync(csvPath)) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  assert.ok(csv.indexOf('چہرہ (FACE)') !== -1, 'تصدیق-ضروری CSV میں چہرہ کے اندراجات (ڈیلیوری ماحول میں)');
}

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=175/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v174)');
assert(/CACHE_NAME='bhc-clinic-v175'/.test(swf), 'خدمت کار نسخہ 174');
assert(/v173: چہرہ باب/.test(code), 'rep-chapters.js میں چہرہ بلڈر درج');

console.log('چہرہ باب: ماخذی درخت 1988 قطاریں (صفحات 355–396)، جڑ FACE، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
