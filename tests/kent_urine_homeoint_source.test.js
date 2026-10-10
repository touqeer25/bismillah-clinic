'use strict';
// tests/kent_urine_homeoint_source.test.js — v186: پیشاب (URINE) باب (صفحات 680–692) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/urine.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/urine.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_urine_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-urine-v1');
assert.strictEqual(srcEntries.length, 390, 'ماخذی قطاریں: 390 (جڑ URINE + 389) — 1 دستاویزی clamp، صفر دوہرا راستہ');
assert.strictEqual(Object.keys(data).length, 412, 'پرانی مقامی قطاریں فائل میں محفوظ (412 کل = 390 + 22)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_URINE_SOURCE_MARKER="homeoint-urine-v1",_REP_KENT_URINE_COUNT=390;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentUrineSourceEntries') + grab('_repHasKentUrineSourceData') + grab('_repBuildKentUrineSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentUrineSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentUrineSourceData', ctx)(data), true, 'ماخذی ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 390, 'درخت کے ربرک 390');
assert.strictEqual(tree.order[0], 'URINE', 'باب کی جڑ URINE پہلی قطار');
assert.ok(tree.count === 41, 'جڑ کے بچے 41 (جڑ قطار + 40 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 4, 'زیادہ سے زیادہ گہرائی 4 (pseudo-root +1 — ماخذی d3: 10 قطاریں): ' + maxDepth(tree));
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 680 || p > 692) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 13, '13 صفحات (680–692، MEDI-T انتساب) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (p680 دم): ACRID پہلا مین (61 ادویہ — کتابی ص 680 کا آخری ربرک)
const acr = tree.children['ACRID'];
assert.ok(acr && Object.keys(acr.remedies).length === 61 && acr.remedies['arn'] === 3, 'ACRID: 61 ادویہ (Arn. 3 — p680 دم — GENITALIA سے پہلے URINE کا پہلا ربرک)');
const amd = findNode(tree, 'ACRID, menses, during');
assert.ok(amd && Object.keys(amd.remedies).length === 3, 'ACRID, menses, during: 3 ادویہ (p680 دم)');
// ALBUMINOUS 109 (p680 دم مین — p681 کی ذیلیاں اسی کے نیچے)
const alb = tree.children['ALBUMINOUS'];
assert.ok(alb && Object.keys(alb.remedies).length === 109 && alb.remedies['apis'] === 3, 'ALBUMINOUS: 109 ادویہ (p680 دم — صفحہ-سرخی MEDI-T پاتھ سمٹے کے برعکس ماخذی والدین)');
const ald = findNode(tree, 'ALBUMINOUS, diphtheria, after');
assert.ok(ald && Object.keys(ald.remedies).length === 11 && ald.remedies['merc-c'] === 2, 'ALBUMINOUS, diphtheria, after: 11 ادویہ (p681 — kenturin انڈیکس کا پہلا اندراج)');
// BURNING (includes Hot) 156 (p681) + acid, as from ذیلی (p682 انڈیکس اندراج)
const bur = tree.children['BURNING (includes Hot)'];
assert.ok(bur && Object.keys(bur.remedies).length === 156, 'BURNING (includes Hot): 156 ادویہ (p681)');
const baf = findNode(tree, 'BURNING (includes Hot), acid, as from');
assert.ok(baf && Object.keys(baf.remedies).length === 1 && baf.remedies['ox-ac'] === 1, 'BURNING, acid, as from: Ox-ac. (p682 انڈیکس اندراج ماخذی والدین کے ساتھ)');
// COLOR, black 22 + clamp قطار ink, like (d2→d1 — کتابی یتیم-indentation، x-coord ثابت)
const cob = tree.children['COLOR, black'];
assert.ok(cob && Object.keys(cob.remedies).length === 22 && cob.remedies['carb-ac'] === 3, 'COLOR, black: 22 ادویہ (p683 — کتابی عین @56.6 d0)');
const ink = findNode(tree, 'COLOR, black, ink, like');
assert.ok(ink && Object.keys(ink.remedies).length === 2 && ink.remedies['colch'] === 3, 'ink, like: 2 ادویہ (clamp d2→d1 — کتاب @128.7 یتیم — بھائی رنگ @92.7 — p683)');
// COLOR, black, pale, fever, during — kenturin «color, pale, fever, during» کا کتابی پورا راستہ
const pfd = findNode(tree, 'COLOR, black, pale, fever, during');
assert.ok(pfd && Object.keys(pfd.remedies).length === 2 && pfd.remedies['cedr'] === 1, 'COLOR, black, pale, fever, during: 2 ادویہ (p684 — OOREP نے black چھوڑا تھا)');
// COLOR, black, yellow, light, dark — p685 انڈیکس کا کتابی پورا راستہ
const yld = findNode(tree, 'COLOR, black, yellow, light, dark');
assert.ok(yld && Object.keys(yld.remedies).length === 13, 'COLOR, black, yellow, light, dark: 13 ادویہ (p685 — x-coords: yellow,light @92.7 d1 ← dark @128.7 d2)');
// COPIOUS (increased) 230 (سب سے بڑا مین) + amenorrhœa ذیلی (p686 انڈیکس)
const cop = tree.children['COPIOUS (increased)'];
assert.ok(cop && Object.keys(cop.remedies).length === 230, 'COPIOUS (increased): 230 ادویہ (p685-686)');
const cam = findNode(tree, 'COPIOUS (increased), amenorrhœa, with');
assert.ok(cam && Object.keys(cam.remedies).length === 7 && cam.remedies['cham'] === 2, 'COPIOUS, amenorrhœa, with: 7 ادویہ (p686 انڈیکس اندراج)');
// SPECIFIC gravity increased 39 → decreased 21 (کتابی عین — decreased @92.7 d1 increased کے نیچے)
const sgi = tree.children['SPECIFIC gravity increased'];
assert.ok(sgi && Object.keys(sgi.remedies).length === 39 && sgi.remedies['arn'] === 3, 'SPECIFIC gravity increased: 39 ادویہ (p691 — کتابی عین @56.6)');
const sgd = findNode(tree, 'SPECIFIC gravity increased, decreased');
assert.ok(sgd && Object.keys(sgd.remedies).length === 21, 'SPECIFIC gravity increased, decreased: 21 ادویہ (p691 — OOREP نے increased چھوڑا تھا)');
// MILKY during/after (auto ہاتھ-لکھے اردو والی قطاریں)
const mid = findNode(tree, 'MILKY, during');
assert.ok(mid && Object.keys(mid.remedies).length === 2 && mid.remedies['nat-m'] === 1, 'MILKY, during: 2 ادویہ (p687 — menses run-on سیاق)');
const mia = findNode(tree, 'MILKY, during, after');
assert.ok(mia && mia.remedies['nat-m'] === 2, 'MILKY, during, after: Nat-m. 2 (d2 — p687)');
// اختتام (p692): YEAST-LIKE آخری مین {caust:2, raph:2} — GENITALIA MALE سے پہلے
const yea = tree.children['YEAST-LIKE'];
assert.ok(yea && yea.remedies['caust'] === 2 && yea.remedies['raph'] === 2, 'YEAST-LIKE آخری مین: Caust./raph. 2 (p692 — GENITALIA MALE باب سے بالکل پہلے)');
// WATERY, clear as water, inodorous... — p692 انڈیکس اندراج
const wat = findNode(tree, 'WATERY, clear as water, inodorous, with fetid mucous stool');
assert.ok(wat && Object.keys(wat.remedies).length === 1 && wat.remedies['dros'] === 1, 'WATERY, inodorous, with fetid mucous stool: Dros. (p692 انڈیکس اندراج)');
// BRICK-DUST (See Sediment) — See-ref محفوظ (بے-ادویات)
assert.ok(tree.children['BRICK-DUST (See Sediment)'], 'BRICK-DUST (See Sediment) — See-ref مین (p681)');
// گہری ماخذی d3 قطاریں (10) — walk-depth = ماخذی depth + 1 (pseudo-root)
let d3 = 0; (function walk(n, d) { if (n.hasRubric) { d += 1; if (d === 4) d3++; } for (const k of (n.order || [])) walk(n.children[k], d); })(tree, 0);
assert.strictEqual(d3, 10, 'ماخذی d3 کی 10 قطاریں (گہری ماخذی ساخت): ' + d3);

// 4) اردو فائل کی ساخت
assert.ok(Array.isArray(ur.locked) && ur.locked.length === 0, 'کوئی قفل نہیں');
assert.ok(Object.keys(ur.rubrics).length >= 390, 'اردو فائل میں 390+ فعال کلیدیں (130 غیر-درخت پرانی محفوظ): ' + Object.keys(ur.rubrics).length);

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «پیشاب — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('پیشاب — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «پیشاب — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto) && ur.meta.auto.length === 3, '3 خود-بنے (ہاتھ سے لکھے — meta.auto): ' + (ur.meta.auto || []).length);
// پاتھ-ہم آہنگی: نئے راستے پر مکمل جملہ (والدین کے نیا جملہ + لیبل)
assert.ok(ur.rubrics['color, black, brown, chestnut'].indexOf('سیاہ') > 0, 'نئے راستے کا جملہ: color, black, brown, chestnut (black سیگمنٹ شامل)');

// 6) مانی فیسٹ
assert.strictEqual(manifest.source_rows, 390);
assert.strictEqual(manifest.matched_app_records, 386);
assert.strictEqual(manifest.new_source_records, 4);
assert.strictEqual(manifest.legacy_local_records, 22);
assert.strictEqual(manifest.ambiguous_app_records, 2);

// 7) _index.json
const idxData = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/_index.json'), 'utf8'));
const pg = idxData.find(c => c.key === 'urine');
assert.ok(pg && pg.rubrics === 412, '_index.json: urine 412');

// 8) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=190/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v186)');
assert(/CACHE_NAME='bhc-clinic-v190'/.test(swf), 'خدمت کار نسخہ 186');
assert(/v186: پیشاب \(URINE\) باب/.test(code), 'rep-chapters.js میں URINE بلڈر درج');

console.log('kent_urine_homeoint_source.test.js — تمام تصدیقیں پاس (390 ماخذی قطاریں، 412 کل، اردو 100%)');
