'use strict';
// tests/kent_nose_homeoint_source.test.js — v172: ناک باب (صفحات 324–354) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/nose.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/nose.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_nose_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-nose-v1');
assert.strictEqual(srcEntries.length, 1428, 'ماخذی قطاریں: 1428 (1427 + باب کی جڑ NOSE)');
assert.strictEqual(Object.keys(data).length, 1518, 'پرانی مقامی قطاریں فائل میں محفوظ (1518 کل)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_NOSE_SOURCE_MARKER="homeoint-nose-v1",_REP_KENT_NOSE_COUNT=1428;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentNoseSourceEntries') + grab('_repHasKentNoseSourceData') + grab('_repBuildKentNoseSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentNoseSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentNoseSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 1428, 'درخت کے ربرک 1428');
assert.strictEqual(tree.order[0], 'NOSE', 'باب کی جڑ NOSE پہلی قطار');
assert.ok(tree.count === 126, 'جڑ کے بچے 126 (جڑ قطار + 125 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 5, 'زیادہ سے زیادہ گہرائی 5');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 324 || p > 354) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 31, '31 صفحات (324–354) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + مستند درستیاں
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// CATARRH: کتابی 171 ادویات (OOREP والد میں ذیلیوں کی ادویات گلی تھیں)
const catarrh = tree.children['CATARRH'];
assert.ok(catarrh && Object.keys(catarrh.remedies).length === 171, 'CATARRH: ماخذی 171 ادویات');
assert.ok(Object.keys(catarrh.children).length === 18, 'CATARRH کے 18 ذیلی (right/left/dry-chronic/measles…)');
// خاندانی گہرائی-درستیاں (MEDI-T دوہرے <dir> — کتاب + OOREP سے اتفاق)
assert.ok(findNode(tree, 'CRACKS in nostrils, corners') && findNode(tree, 'CRACKS in nostrils, septum') && findNode(tree, 'CRACKS in nostrils, tip'), 'CRACKS: corners/septum/tip بھائی (d1)');
assert.ok(findNode(tree, 'CRACKS in nostrils, tip, menses, during'), 'CRACKS tip کی ذیلی nested');
assert.ok(findNode(tree, 'DRYNESS, inside, right') && findNode(tree, 'DRYNESS, inside, left') && findNode(tree, 'DRYNESS, inside, morning'), 'DRYNESS: right/left/morning بھائی (d1)');
assert.ok(findNode(tree, 'DRYNESS, inside, morning, bed, in') && findNode(tree, 'DRYNESS, inside, morning, waking, on'), 'DRYNESS morning کی ذیلیاں nested');
assert.ok(findNode(tree, 'PAIN, in, sore, bruised, externally, evening') && findNode(tree, 'PAIN, in, sore, bruised, externally, blowing, on') && findNode(tree, 'PAIN, in, sore, bruised, externally, touch'), 'sore-bruised: پورا خاندان d2 بھائی (evening کے بچے نہیں)');
assert.ok(findNode(tree, 'PICKING nose, until it bleeds') && findNode(tree, 'PICKING nose, constant desire'), 'PICKING: دونوں d1 بھائی');
assert.ok(findNode(tree, 'SMELL, acute, headache, during') && findNode(tree, 'SMELL, acute, sensitive to the odor of broth'), 'SMELL: خاندان d1 بھائی');
assert.ok(findNode(tree, 'SMELL, acute, sensitive to the odor of broth, coffee'), 'SMELL broth کی ذیلی nested');
assert.ok(findNode(tree, 'CORYZA, menses, before, with cough and hoarseness') && findNode(tree, 'CORYZA, menses, before, during'), 'menses: with-cough بھائی (itim نہیں)');
assert.ok(findNode(tree, 'CORYZA, air, from a draft of, open, amel.') && findNode(tree, 'CORYZA, air, from a draft of, open, dry, cold'), 'air-draft-open: کتابی nesting (OOREP نے فلیٹ کیا تھا)');
// 2 دہرائے کتابی ربرکس ضم (max گریڈ)
const sm = findNode(tree, 'PAIN, in, burning, smarting, morning');
assert.ok(sm && sm.remedies['mag-m'] === 1 && sm.remedies['sulph'] === 2, 'smarting-morning: دہرائے گئے کتابی ربرک ضم (mag-m + sulph)');
assert.ok(findNode(tree, 'PAIN, in, burning, smarting, morning, touch, on'), 'smarting-morning کی ذیلی touch-on محفوظ');
const sl = findNode(tree, 'SWELLING of, left');
assert.ok(sl && Object.keys(sl.remedies).length === 12 && sl.remedies['aur-m'] === 2, 'SWELLING left: دہرائے گئے ربرک ضم (12 ادویات، Aur-m سمیت)');
// 4 گم شدہ ربرکس بحال
const puls = tree.children['PULSATION'];
assert.ok(puls && Object.keys(puls.remedies).length === 10, 'PULSATION بحال: 10 ادویات');
assert.deepStrictEqual(Array.from(puls.order), ['left', 'root', 'tip'], 'PULSATION کی 3 ذیلی بحال');
assert.ok(puls.children['root'].remedies['kali-bi'] === 3 && puls.children['root'].remedies['sarr'] === 1, 'PULSATION root: OOREP کے POLYPUS-root والی ادویات (ادویہ-ثابت)');
assert.ok(puls.children['tip'].remedies['ph-ac'] === 1, 'PULSATION tip: Ph-ac');
assert.ok(tree.children['YELLOW (See Discoloration and Spots)'], 'YELLOW بحال (bare کتابی ربرک)');
// DISCHARGE right: کتابی 61 ذیلی — OOREP نے سطح گم کر دی تھی
const dis = tree.children['DISCHARGE, right'];
assert.ok(dis && Object.keys(dis.children).length === 61 && findNode(tree, 'DISCHARGE, right, left'), 'DISCHARGE right: 61 ذیلی + left بحال');
// صفحہ-مارکر کٹ: «sides, sides» موجود نہیں
assert.ok(!findNode(tree, 'DRYNESS, inside, alternating with discharge (See Coryza), sides, sides'), 'صفحہ-مارکر «sides» قطار حذف');
assert.ok(findNode(tree, 'DRYNESS, inside, alternating with discharge (See Coryza), sides'), 'alternating-sides: کتابی مرکب لیبل برقرار');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «ناک — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('ناک — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «ناک — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto), 'meta.auto فہرست (خود-بنے جملے نظرثانی کے لیے)');

// 6) مانی فیسٹ + تصدیق-ضروری CSV
assert.strictEqual(manifest.source_rows, 1428);
assert.strictEqual(manifest.matched_app_records, 1424);
assert.strictEqual(manifest.new_source_records, 4);
assert.strictEqual(manifest.legacy_local_records, 90);
const csvPath = path.join(ROOT, '..', 'download', 'kent-confirmation-needed.csv');
if (fs.existsSync(csvPath)) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  assert.ok(csv.indexOf('ناک (NOSE)') !== -1, 'تصدیق-ضروری CSV میں ناک کے اندراجات (ڈیلیوری ماحول میں)');
}

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=177/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v172)');
assert(/CACHE_NAME='bhc-clinic-v177'/.test(sw), 'خدمت کار نسخہ 172');
assert(/v172: ناک باب/.test(code), 'rep-chapters.js میں ناک بلڈر درج');

console.log('ناک باب: ماخذی درخت 1428 قطاریں (صفحات 324–354)، جڑ NOSE، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
