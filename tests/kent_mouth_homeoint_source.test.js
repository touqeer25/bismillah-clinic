'use strict';
// tests/kent_mouth_homeoint_source.test.js — v174: منہ باب (صفحات 397–430) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/mouth.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/mouth.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_mouth_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-mouth-v1');
assert.strictEqual(srcEntries.length, 1516, 'ماخذی قطاریں: 1516 (1515 + باب کی جڑ MOUTH)');
assert.strictEqual(Object.keys(data).length, 1645, 'پرانی مقامی قطاریں فائل میں محفوظ (1645 کل)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_MOUTH_SOURCE_MARKER="homeoint-mouth-v1",_REP_KENT_MOUTH_COUNT=1516;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentMouthSourceEntries') + grab('_repHasKentMouthSourceData') + grab('_repBuildKentMouthSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentMouthSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentMouthSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 1516, 'درخت کے ربرک 1516');
assert.strictEqual(tree.order[0], 'MOUTH', 'باب کی جڑ MOUTH پہلی قطار');
assert.ok(tree.count === 166, 'جڑ کے بچے 166 (جڑ قطار + 165 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 6, 'زیادہ سے زیادہ گہرائی 6');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 397 || p > 430) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 34, '34 صفحات (397–430) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + مستند درستیاں
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// ABSCESS, Gums — پہلا مین (ص 397): frequent/sensation ذیلیاں
const ab = tree.children['ABSCESS, Gums (See Fistula, Boils, Ulcers, Pustules, Suppuration)'];
assert.ok(ab && ab.remedies['alum'] === 1 && ab.remedies['sil'] === 2, 'ABSCESS-Gums: ماخذی ادویات');
assert.ok(findNode(tree, 'ABSCESS, Gums (See Fistula, Boils, Ulcers, Pustules, Suppuration), frequently recurring'), 'frequently-recurring ذیلی');
// DISCOLORATION > blueness > Palate, bluish > red — ص 400 کی حقیقی کتابی دہرائی ضم (33 ادویات) + velum ذیلی
const red = findNode(tree, 'DISCOLORATION, blueness, Palate, bluish, red');
assert.ok(red && Object.keys(red.remedies).length === 33 && red.remedies['phos'] === 1 && red.remedies['acon'] === 3, 'red: max-گریڈ ضم (phos+acon… 33 ادویات، PDF ص 904)');
assert.ok(findNode(tree, 'DISCOLORATION, blueness, Palate, bluish, red, velum'), 'velum: red کی ذیلی (کتاب col-23 → normalize)');
// Gums, black (ص 400) — MEDI-T «Gums, black» ایک لیبل، o50268 جوڑا
const gb = findNode(tree, 'DISCOLORATION, blueness, Gums, black');
assert.ok(gb && gb.remedies['merc'] === 2 && gb.remedies['plb'] === 1, 'Gums-black: {Merc., Plb.} (کتاب ص 868)');
assert.ok(findNode(tree, 'DISCOLORATION, blueness, Gums, black, bluish-red'), 'Gums-black > bluish-red ذیلی');
// PAIN > aching, Gums (ص 410): Palate/Tongue حقیقی دہرائے ضم — چڑھوے (chewing/yawning) اور peppery ذیلی درست جگہ
const pa = findNode(tree, 'PAIN, aching, Gums, Palate');
assert.ok(pa && Object.keys(pa.remedies).length === 19, 'aching-Gums Palate: ضم 19 ادویات (PDF 924/925)');
const pt = findNode(tree, 'PAIN, aching, Gums, Tongue');
assert.ok(pt && Object.keys(pt.remedies).length === 16 && findNode(tree, 'PAIN, aching, Gums, Tongue, peppery'), 'aching-Gums Tongue: ضم 16 ادویات + peppery ذیلی (Tongue-2 کی)');
// SPEECH, broken (See Mind) (ص 419) — OOREP «difficult» لیبل کا درست فارم
assert.ok(findNode(tree, 'SPEECH, broken (See Mind), typhoid, in'), 'SPEECH-broken > typhoid (o51094 جوڑا)');
assert.ok(findNode(tree, 'SPEECH, broken (See Mind), words, can utter single, with great exertion, certain'), 'words > certain (o51101 جوڑا)');
// TASTE, acid (See Sour) > bitter-sweet (ص 423) — OOREP نے غلطی سے «bloody» لکھا تھا
const bs = findNode(tree, 'TASTE, acid (See Sour), bitter-sweet, coughing, before, when');
assert.ok(bs && Object.keys(bs.remedies).length === 6, 'bitter-sweet coughing-when: 6 ادویات (o51263 جوڑا — OOREP «bloody» درست)');
// OSCILLATING tongue (ص 409) — کتاب میں خالی سرخی (صرف کراس-ریفرنس)
const osc = tree.children['OSCILLATING tongue (See Protruded)'];
assert.ok(osc && Object.keys(osc.remedies).length === 0, 'OSCILLATING: خالی سرخی (MEDI-T + PDF دونوں سے تصدیق)');
// TEETH باب-آغاز کٹ — درخت میں بالکل نہیں
assert.ok(!tree.children['TEETH'], 'TEETH سرخی درخت میں نہیں (باب حد ثابت)');
assert.ok(!findNode(tree, 'ABSCESS of roots') && !findNode(tree, 'ADHERE together'), 'TEETH باب کے اندراج کٹ (16 قطاریں — PDF ص 930/931 حد)');
// اختتام: WRINKLED Palate (ص 430) — MOUTH کی آخری قطاریں
assert.ok(findNode(tree, 'WRINKLED Palate, Tongue, morning'), 'WRINKLED > morning: باب کا اختتام (PDF ص 930)');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «منہ — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('منہ — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «منہ — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto), 'meta.auto فہرست (خود-بنے جملے نظرثانی کے لیے)');

// 6) مانی فیسٹ + تصدیق-ضروری CSV
assert.strictEqual(manifest.source_rows, 1516);
assert.strictEqual(manifest.matched_app_records, 1514);
assert.strictEqual(manifest.new_source_records, 2);
assert.strictEqual(manifest.legacy_local_records, 129);
const csvPath = path.join(ROOT, '..', 'download', 'kent-confirmation-needed.csv');
if (fs.existsSync(csvPath)) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  assert.ok(csv.indexOf('منہ (MOUTH)') !== -1, 'تصدیق-ضروری CSV میں منہ کے اندراجات (ڈیلیوری ماحول میں)');
}

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=192/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v174)');
assert(/CACHE_NAME='bhc-clinic-v192'/.test(swf), 'خدمت کار نسخہ 174');
assert(/v174: منہ باب/.test(code), 'rep-chapters.js میں منہ بلڈر درج');

console.log('منہ باب: ماخذی درخت 1516 قطاریں (صفحات 397–430)، جڑ MOUTH، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
