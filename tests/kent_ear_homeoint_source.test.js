'use strict';
// tests/kent_ear_homeoint_source.test.js — v170: کان باب (صفحات 285–320) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/ear.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/ear.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_ear_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-ear-v1');
assert.strictEqual(srcEntries.length, 1902, 'ماخذی قطاریں: 1902 (1901 + باب کی جڑ EAR)');
assert.strictEqual(Object.keys(data).length, 2075, 'پرانی مقامی قطاریں فائل میں محفوظ (2075 کل)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_EAR_SOURCE_MARKER="homeoint-ear-v1",_REP_KENT_EAR_COUNT=1902;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentEarSourceEntries') + grab('_repHasKentEarSourceData') + grab('_repBuildKentEarSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentEarSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentEarSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 1902, 'درخت کے ربرک 1902');
assert.strictEqual(tree.order[0], 'EAR', 'باب کی جڑ EAR پہلی قطار');
assert.ok(tree.count === 91, 'جڑ کے مین ربرک 91: ' + tree.count);
assert.ok(maxDepth(tree) === 5, 'زیادہ سے زیادہ گہرائی 5');
// تمام صفحات 285–320 پر موجود
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 285 || p > 320) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 36, '36 صفحات (285–320) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — مستند درستیاں اور ماخذی ساخت
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// مستند درستی: ص 292 «NOISES» سرخی بحال — NOISES in (212) leaf، تمام subs NOISES کے نیچے
const noisesIn = findNode(tree, 'NOISES in');
assert.ok(noisesIn && noisesIn.hasRubric && Object.keys(noisesIn.remedies).length === 212, 'NOISES in: ماخذی 212 ادویات');
assert.ok(!Object.keys(noisesIn.children).length, 'NOISES in: بے-بچہ leaf (کتاب کے مطابق)');
const noises = findNode(tree, 'NOISES');
assert.ok(noises && noises.hasRubric && Object.keys(noises.remedies).length === 0, 'NOISES: بحال شدہ bare سرخی (صفر ادویات)');
assert.ok(noises.children['buzzing'] && noises.children['ringing'] && noises.children['menses, before'], 'NOISES کے نیچے buzzing/ringing/menses-خاندان');
assert.ok(findNode(tree, 'NOISES, menses, during') && findNode(tree, 'NOISES, menses, suppressed'), 'menses-خاندان d1 بھائی (run-on درستی)');
// مستند درستی: ص 285 AIR اضافی <dir> — cold سے streaming into تک AIR-sensation کی d1 ذیلی
const air = findNode(tree, 'AIR, sensation of in (See Wind)');
assert.ok(air && air.children['bubble of air'] && air.children['cold'] && air.children['streaming into, on drawing jaw to other side'], 'AIR: پوری a-z فہرست ایک سطح پر');
assert.ok(findNode(tree, 'AIR, sensation of in (See Wind), forced into, when blowing nose, eructations, during'), 'AIR: run-on ذیلی زنجیر برقرار');
// مستند درستی: ص 300 سٹرے yawning غائب
let strayFound = false;
(function walk(n){ for (const k of (n.order||[])) { const c=n.children[k]; if (c.pathTitle === 'NOISES, yawning, when' && Object.keys(c.remedies).length===1 && c.remedies.verat===1) strayFound=true; walk(c);} })(tree);
assert.ok(!strayFound, 'ص 300 کی سٹرے «yawning, when : Verat.» قطار درخت میں نہیں (میدی-ٹی آرٹفیکٹ)');
const yaw = findNode(tree, 'NOISES, yawning, when');
assert.ok(yaw && Object.keys(yaw.remedies).length === 5, 'NOISES, yawning, when: ص 294 والی اصل قطار (5 ادویات)');
// run-on نمونے — OOREP دو-فارم ٹیسٹ سے
assert.ok(findNode(tree, 'NOISES, lying, amel.') && findNode(tree, 'NOISES, lying, upon the ear'), 'lying-خاندان: بھائی فارم (OOREP r384/r385)');
assert.ok(findNode(tree, 'NOISES, roaring, coition, after'), 'roaring coition, after: بھائی فارم');
assert.ok(findNode(tree, 'PAIN, sitting, after long'), 'PAIN, sitting, after long: بھائی فارم');
assert.ok(findNode(tree, 'NOISES, cracking, morning, bed, in'), 'صاف nesting برقرار: cracking, morning, bed, in');
const worms = findNode(tree, 'WORMS, sensation of');
assert.ok(worms && Object.keys(worms.remedies).length === 9, 'WORMS, sensation of: باب کا اختتام (9 ادویات)');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «کان — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('کان — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «کان — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto), 'meta.auto فہرست (خود-بنے جملے نظرثانی کے لیے)');

// 6) مانی فیسٹ
assert.strictEqual(manifest.source_rows, 1902);
assert.strictEqual(manifest.matched_app_records, 1842);
assert.strictEqual(manifest.new_source_records, 60);
assert.strictEqual(manifest.legacy_local_records, 173);

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=173/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v170)');
assert(/CACHE_NAME='bhc-clinic-v173'/.test(sw), 'خدمت کار نسخہ 170');
assert(/v170: کان باب/.test(code), 'rep-chapters.js میں کان بلڈر درج');

console.log('کان باب: ماخذی درخت 1902 قطاریں (صفحات 285–320)، جڑ EAR، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
