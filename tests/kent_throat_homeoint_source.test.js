'use strict';
// tests/kent_throat_homeoint_source.test.js — v176: گلا باب (صفحات 448–470) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/throat.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/throat.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_throat_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-throat-v1');
assert.strictEqual(srcEntries.length, 982, 'ماخذی قطاریں: 982 (981 + باب کی جڑ THROAT)');
assert.strictEqual(Object.keys(data).length, 1051, 'پرانی مقامی قطاریں فائل میں محفوظ (1051 کل = 982 + 69)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_THROAT_SOURCE_MARKER="homeoint-throat-v1",_REP_KENT_THROAT_COUNT=982;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentThroatSourceEntries') + grab('_repHasKentThroatSourceData') + grab('_repBuildKentThroatSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentThroatSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentThroatSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 982, 'درخت کے ربرک 982');
assert.strictEqual(tree.order[0], 'THROAT', 'باب کی جڑ THROAT پہلی قطار');
assert.ok(tree.count === 108, 'جڑ کے بچے 108 (جڑ قطار + 107 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 5, 'زیادہ سے زیادہ گہرائی 5');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 448 || p > 470) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 23, '23 صفحات (448–470) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + مستند درستیاں
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (ص 448): ABSCESS خالی کراس-ریفرنس + ANÆSTHESIA 9 ادویات (گریڈ Gels./Kali-br. 2)
const abs = tree.children['ABSCESS (See Suppuration)'];
assert.ok(abs && Object.keys(abs.remedies).length === 0, 'ABSCESS: خالی کراس-ریفرنس سرخی (کتاب ص 448)');
const anæ = tree.children['ANÆSTHESIA'];
assert.ok(anæ && Object.keys(anæ.remedies).length === 9 && anæ.remedies['gels'] === 2 && anæ.remedies['kali-br'] === 2 && anæ.remedies['acon'] === 2, 'ANÆSTHESIA: 9 ادویہ، گریڈ Acon./Gels./Kali-br.');
// APHTHÆ مین + Tonsils ذیلی (ص 448) — Ign. گریڈ 3
const aph = tree.children['APHTHÆ'];
assert.ok(aph && aph.remedies['ign'] === 3 && aph.remedies['aeth'] === 2, 'APHTHÆ: 11 ادویہ، Ign. گریڈ 3');
const aphot = findNode(tree, 'APHTHÆ, Tonsils, on');
assert.ok(aphot && Object.keys(aphot.remedies).length === 3 && aphot.remedies['bell'] === 2, 'APHTHÆ > Tonsils, on: 3 ادویہ (Bell.)');
// ص 450 کتابی دہرایا «redness, dark red» max-گریڈ ضم (20+6 → 23 یونین؛ PDF 1007 ثابت)
const darkred = findNode(tree, 'DISCOLORATION, black (See Gangrenous), redness, dark red');
assert.ok(darkred && Object.keys(darkred.remedies).length === 23, 'dark red: ضم 23 ادویات (20+6، arg-n/bapt/lach مشترک)');
assert.ok(darkred.remedies['arg-n'] === 3 && darkred.remedies['calc'] === 2 && darkred.remedies['cupr-ac'] === 1 && darkred.remedies['lach'] === 2, 'dark red: max-گریڈ Arg-n. 3، calc/cupr-ac دوسرے واقعے سے');
assert.ok(darkred.rid === 'r120', 'dark red: پہلا واقعہ برقرار (r120)');
// ص 458 مستند: کتابی «on becoming» (12 ادویہ) — r733 دستی جوڑا (OOREP نے cold سگمنٹ بدلا تھا، PDF 1022 ثابت)
const onbec = findNode(tree, 'PAIN, on becoming');
assert.ok(onbec && Object.keys(onbec.remedies).length === 12 && onbec.remedies['hep'] === 3 && onbec.rid === 'r733', 'on becoming: 12 ادویہ، r733 (کتابی لیبل)');
assert.strictEqual(data['r733'].source_parent_id, 'r428', 'r733 والد = PAIN مین (r428)');
// ص 458: «PAIN, air, cold» 9 ادویہ — o61583 عین-فارم (r438 aggregate واپس)
const aircold = findNode(tree, 'PAIN, air, cold');
assert.ok(aircold && Object.keys(aircold.remedies).length === 9 && aircold.rid === 'o61583', 'air-cold: 9 ادویہ، o61583 (r438 aggregate واپس)');
assert.ok(!data['r438'].source_canonical, 'r438 «PAIN, cold» (28 union) پرانیاں میں');
// ص 459: «PAIN, warm bed, drinks» 7 ادویہ — o61914 دستی جوڑا (PDF 1025: warm bed → drinks)
const wbd = findNode(tree, 'PAIN, warm bed, drinks');
assert.ok(wbd && Object.keys(wbd.remedies).length === 7 && wbd.remedies['lach'] === 3 && wbd.remedies['phyt'] === 3 && wbd.rid === 'o61914', 'warm bed, drinks: 7 ادویہ، o61914');
assert.ok(findNode(tree, 'PAIN, warm bed, drinks, amel.') && findNode(tree, 'PAIN, warm bed, room, amel.'), 'warm bed خاندان: drinks/room + amel. ذیلیاں');
// ص 464: «PAIN, stitching, swallowing, on» 48 ادویہ — o61868 عین-فارم (r745 aggregate واپس)
const stsw = findNode(tree, 'PAIN, stitching, swallowing, on');
assert.ok(stsw && Object.keys(stsw.remedies).length === 48 && stsw.rid === 'o61868', 'stitching-swallowing: 48 ادویہ، o61868');
assert.ok(!data['r745'].source_canonical, 'r745 «PAIN, stitching, swallowing» (53 union) پرانیاں میں');
// ص 467–468: SWALLOWING, difficult — 149 ادویہ مین + وقت-خاندان d1 (ص 468 clamp: morning d2→d1)
const swd = tree.children['SWALLOWING, difficult'];
assert.ok(swd && Object.keys(swd.remedies).length === 149, 'SWALLOWING, difficult مین: 149 ادویہ');
const morn = findNode(tree, 'SWALLOWING, difficult, morning');
assert.ok(morn && Object.keys(morn.remedies).length === 4 && morn.remedies['am-c'] === 1, 'SWALLOWING > morning: 4 ادویہ (clamp d1)');
assert.strictEqual(data['r882'].source_depth, 1, 'r882 گہرائی 1 (d2→d1 clamp — وقت-خاندان بھائی forenoon/noon/evening)');
assert.ok(findNode(tree, 'SWALLOWING, difficult, forenoon') && findNode(tree, 'SWALLOWING, difficult, noon') && findNode(tree, 'SWALLOWING, difficult, evening'), 'وقت-خاندان مکمل');
// ص 460: h002 «PAIN, Pharynx, swallowing (See Pain in general)» — خالی ماخذ-اکیلا سرخی
const phsw = findNode(tree, 'PAIN, Pharynx, swallowing (See Pain in general)');
assert.ok(phsw && Object.keys(phsw.remedies).length === 0 && phsw.rid === 'h002', 'h002: Pharynx-swallowing خالی سرخی');
// اختتام (ص 470): VESICLES 5 ادویہ + WART خالی کراس-ریفرنس (آخری قطار)
const ves = tree.children['VESICLES'];
assert.ok(ves && Object.keys(ves.remedies).length === 5 && ves.remedies['rhus-t'] === 2, 'VESICLES: 5 ادویہ (Rhus-t. گریڈ 2)');
assert.ok(findNode(tree, 'VESICLES, Pharynx') && findNode(tree, 'VESICLES, Tonsils'), 'VESICLES > Pharynx/Tonsils ذیلیاں');
const wart = findNode(tree, 'VESICLES, WART like excrescences (See Condylomata)');
assert.ok(wart && Object.keys(wart.remedies).length === 0, 'WART: خالی کراس-ریفرنس (آخری قطار)');
assert.ok(!findNode(tree, 'EXTERNAL throat') && !findNode(tree, 'EXTERNAL THROAT'), 'EXTERNAL THROAT باب کٹ (P471 حد)');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «گلا — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('گلا — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «گلا — » سے شروع');
assert.strictEqual(ur.rubrics['throat'], 'گلا — گلا', 'جڑ THROAT کا جملہ');
assert.ok(Array.isArray(ur.meta.auto) && ur.meta.auto.length === 1 && ur.meta.auto[0] === 'pain, pharynx, swallowing', 'meta.auto فہرست (h002)');

// 6) مانی فیسٹ + تصدیق-ضروری CSV
assert.strictEqual(manifest.source_rows, 982);
assert.strictEqual(manifest.matched_app_records, 980);
assert.strictEqual(manifest.new_source_records, 2);
assert.strictEqual(manifest.legacy_local_records, 69);
const csvPath = path.join(ROOT, '..', 'download', 'kent-confirmation-needed.csv');
if (fs.existsSync(csvPath)) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  assert.ok(csv.indexOf('گلا (THROAT)') !== -1, 'تصدیق-ضروری CSV میں گلا کے اندراجات (ڈیلیوری ماحول میں)');
}

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=193/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v176)');
assert(/CACHE_NAME='bhc-clinic-v193'/.test(swf), 'خدمت کار نسخہ 176');
assert(/v176: گلا باب/.test(code), 'rep-chapters.js میں گلا بلڈر درج');

console.log('گلا باب: ماخذی درخت 982 قطاریں (صفحات 448–470)، جڑ THROAT، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
