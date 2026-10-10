'use strict';
// tests/kent_bladder_homeoint_source.test.js — v182: مثانہ باب (صفحات 645–662) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/bladder.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/bladder.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_bladder_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-bladder-v1');
assert.strictEqual(srcEntries.length, 711, 'ماخذی قطاریں: 711 (715 خام − 4 کتابی دہرائیں merge + جڑ BLADDER)');
assert.strictEqual(Object.keys(data).length, 807, 'پرانی مقامی قطاریں فائل میں محفوظ (807 کل = 711 + 96)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_BLADDER_SOURCE_MARKER="homeoint-bladder-v1",_REP_KENT_BLADDER_COUNT=711;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentBladderSourceEntries') + grab('_repHasKentBladderSourceData') + grab('_repBuildKentBladderSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentBladderSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentBladderSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 711, 'درخت کے ربرک 711');
assert.strictEqual(tree.order[0], 'BLADDER', 'باب کی جڑ BLADDER پہلی قطار');
assert.ok(tree.count === 60, 'جڑ کے بچے 60 (جڑ قطار + 59 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 5, 'زیادہ سے زیادہ گہرائی 5 (busily-occupied وقت-درجہ): ' + maxDepth(tree));
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 645 || p > 662) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 18, '18 صفحات (645–662، MEDI-T انتساب) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (stool v181 کی باب-حد سے واپس آنے والے پہلے ربرکس): AIR passes/BAND خالی See-مین
assert.ok(tree.children['AIR passes (See Gas)'] && Object.keys(tree.children['AIR passes (See Gas)'].remedies).length === 0, 'AIR passes: خالی کراس-ریفرنس مین (کتاب p645 آغاز)');
assert.ok(tree.children['BAND (See Constriction)'] && Object.keys(tree.children['BAND (See Constriction)'].remedies).length === 0, 'BAND: خالی کراس-ریفرنس مین');
assert.ok(tree.children['APPREHENSION in region of'] && tree.children['APPREHENSION in region of'].remedies['merc-c'] === 1, 'APPREHENSION: Merc-c. (کتاب folio 1389)');
// بڑے مین: URGING 152، RETENTION 115، dribbling 89، CALCULI 35، FULLNESS 41
assert.ok(Object.keys(tree.children['URGING to urinate (morbid desire)'].remedies).length === 152, 'URGING main: 152 ادویہ');
assert.ok(Object.keys(tree.children['RETENTION of urine (See Urination Retarded)'].remedies).length === 115, 'RETENTION of urine: 115 ادویہ');
assert.ok(Object.keys(tree.children['URINATION, dribbling (by drops)'].remedies).length === 89, 'URINATION dribbling main: 89 ادویہ (کتاب folio 1412)');
assert.ok(Object.keys(tree.children['CALCULI'].remedies).length === 35, 'CALCULI: 35 ادویہ');
assert.ok(Object.keys(tree.children['FULLNESS, sensation of'].remedies).length === 41, 'FULLNESS, sensation of: 41 ادویہ (ماخذ = کتاب)');
// involuntary union (کتابی دہرائی p656 37 + p659 129 → union 137) + 41 ذیلیاں
const inv = findNode(tree, 'URINATION, dribbling (by drops), involuntary');
assert.ok(inv && Object.keys(inv.remedies).length === 137 && inv.order.length === 41, 'involuntary: 137 ادویہ union + 41 ذیلیاں (کتابی دہرائی merge)');
// گہرا وقت-درجہ: busily occupied → must run and pass a little urine → fever, during → drinking, after (d4)
const deep = findNode(tree, 'URINATION, dribbling (by drops), busily occupied, when, must run and pass a little urine, fever, during, drinking, after');
assert.ok(deep && Object.keys(deep.remedies).length === 2, 'گہری d4 قطار: fever, during, drinking, after (2 ادویہ)');
// اختتام (p662): WEAKNESS خاندان + WORM in, sensation of آخری (2 ادویہ)
assert.ok(tree.children['WEAKNESS'] && Object.keys(tree.children['WEAKNESS'].remedies).length === 38, 'WEAKNESS: 38 ادویہ (p662)');
const worm = findNode(tree, 'WORM in, sensation of');
assert.ok(worm && worm.remedies['bell'] === 1 && worm.remedies['sep'] === 1, 'WORM in: Bell., sep. (باب کا آخری ربرک)');
// clamp تصدیقیں: morning (p656) dribbling main کی ذیلی
const morning = findNode(tree, 'URINATION, dribbling (by drops), morning');
assert.ok(morning && Object.keys(morning.remedies).length === 1 && morning.remedies['coff'] === 1, 'morning: Coff. (clamp d2→d1 — کتاب folio 1412 تصدیق)');
// باب-حد: KIDNEYS باب کٹ
assert.ok(!findNode(tree, 'KIDNEYS') && !findNode(tree, 'ABSCESS') && !findNode(tree, "ADDISON'S disease"), 'KIDNEYS باب کٹ (P662 درمیانی اینکر حد)');
assert.ok(!findNode(tree, 'URINARY ORGANS'), 'URINARY ORGANS سرخی کٹ');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «مثانہ — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('مثانہ — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «مثانہ — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto) && ur.meta.auto.length === 25, 'meta.auto فہرست (25 لغت سے خود-بنے)');

// 6) مانی فیسٹ
assert.strictEqual(manifest.source_rows, 711);
assert.strictEqual(manifest.matched_app_records, 685);
assert.strictEqual(manifest.new_source_records, 26);
assert.strictEqual(manifest.legacy_local_records, 96);
assert.strictEqual(manifest.ambiguous_app_records, 10);

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=192/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v182)');
assert(/CACHE_NAME='bhc-clinic-v192'/.test(swf), 'خدمت کار نسخہ 182');
assert(/v182: مثانہ باب/.test(code), 'rep-chapters.js میں مثانہ بلڈر درج');

console.log('مثانہ باب: ماخذی درخت 711 قطاریں (صفحات 645–662)، جڑ BLADDER، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
