'use strict';
// tests/kent_stool_homeoint_source.test.js — v181: سٹول باب (صفحات 635–644) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/stool.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/stool.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_stool_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-stool-v1');
assert.strictEqual(srcEntries.length, 238, 'ماخذی قطاریں: 238 (237 + باب کی جڑ STOOL)');
assert.strictEqual(Object.keys(data).length, 259, 'پرانی مقامی قطاریں فائل میں محفوظ (259 کل = 238 + 21)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_STOOL_SOURCE_MARKER="homeoint-stool-v1",_REP_KENT_STOOL_COUNT=238;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentStoolSourceEntries') + grab('_repHasKentStoolSourceData') + grab('_repBuildKentStoolSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentStoolSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentStoolSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 238, 'درخت کے ربرک 238');
assert.strictEqual(tree.order[0], 'STOOL', 'باب کی جڑ STOOL پہلی قطار');
assert.ok(tree.count === 85, 'جڑ کے بچے 85 (جڑ قطار + 84 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 3, 'زیادہ سے زیادہ گہرائی 3');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 635 || p > 644) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 10, '10 صفحات (635–644، MEDI-T انتساب) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (MEDI-T P635 سیکشن کا آخر — v180 باب-حد سے واپس آنے والا بلاک): ACRID (56 ادویات)
const ac = tree.children['ACRID, corrosive, excoriating'];
assert.ok(ac && Object.keys(ac.remedies).length === 56, 'ACRID: 56 ادویات (کتاب folio 1372/PDF 1407)');
assert.ok(ac.remedies['ars'] === 3 && ac.remedies['merc'] === 3 && ac.remedies['nat-m'] === 3 && ac.remedies['puls'] === 3 && ac.remedies['verat'] === 3, 'ACRID: گریڈ Ars./Merc./Nat-m./Puls./Verat.');
assert.ok(findNode(tree, 'ALBUMINOUS (See Mucous), coagulated') && Object.keys(findNode(tree, 'ALBUMINOUS (See Mucous), coagulated').remedies).length === 2, 'ALBUMINOUS > coagulated ذیلی (Carb-an., Merc-c.)');
assert.ok(tree.children['ASH-COLORED (See Gray)'] && Object.keys(tree.children['ASH-COLORED (See Gray)'].remedies).length === 0, 'ASH-COLORED: خالی کراس-ریفرنس مین (نئی hN قطار)');
// BALLS, like (See Sheep Dung) — مین + ذیلیاں
const bl = tree.children['BALLS, like (See Sheep Dung)'];
assert.ok(bl && Object.keys(bl.remedies).length === 28 && findNode(tree, 'BALLS, like (See Sheep Dung), black'), 'BALLS: 28 ادویہ + black ذیلی');
// بڑے مین: SOFT 203، WATERY 169، SCANTY 136، PASTY papescent 139، MUCOUS slimy 105
assert.ok(Object.keys(tree.children['SOFT'].remedies).length === 203, 'SOFT: 203 ادویہ (کتاب ص 641/642)');
const wat = tree.children['WATERY'];
assert.ok(wat && Object.keys(wat.remedies).length === 169 && wat.order.length === 17, 'WATERY: 169 ادویہ + 17 ذیلیاں (morning/afternoon/night…)');
assert.ok(Object.keys(tree.children['SCANTY'].remedies).length === 136, 'SCANTY: 136 ادویہ');
assert.ok(Object.keys(tree.children['PASTY, papescent'].remedies).length === 139, 'PASTY papescent: 139 ادویہ');
assert.ok(Object.keys(tree.children['MUCOUS, slimy'].remedies).length === 105, 'MUCOUS slimy: 105 ادویہ (کتابی مین — OOREP کا «MUCOUS» برتن legacy)');
// DIARRHŒA/CONSTIPATION مستقیم باب میں (v180) — سٹول کے حقیقی اختتامی مین: THIN/WHITISH/YELLOW
assert.ok(tree.children['THIN, liquid'] && tree.children['TARRY-LOOKING'] && tree.children['YELLOW'], 'THIN liquid + TARRY-LOOKING + YELLOW مین موجود (اختتامی مین)');
// اختتام (ص 644): YELLOW خاندان — YELLOW, whitish آخری (12 ادویہ)
const yw = findNode(tree, 'YELLOW, whitish');
assert.ok(yw && Object.keys(yw.remedies).length === 12, 'YELLOW whitish: 12 ادویہ (باب کا اختتامی ذیلی)');
assert.ok(!findNode(tree, 'AIR passes (See Gas)') && !findNode(tree, 'BAND (See Constriction)'), 'BLADDER باب کٹ (P645 حد — r226/r230 باب-حد مستثنیٰ)');
assert.ok(!findNode(tree, 'URINARY ORGANS'), 'URINARY ORGANS سرخی کٹ');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «پاخانہ — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('پاخانہ — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «پاخانہ — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto) && ur.meta.auto.length === 2, 'meta.auto فہرست (2 کراس-ریفرنس سرخیاں)');

// 6) مانی فیسٹ
assert.strictEqual(manifest.source_rows, 238);
assert.strictEqual(manifest.matched_app_records, 235);
assert.strictEqual(manifest.new_source_records, 3);
assert.strictEqual(manifest.legacy_local_records, 21);

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=191/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v181)');
assert(/CACHE_NAME='bhc-clinic-v191'/.test(swf), 'خدمت کار نسخہ 181');
assert(/v181: سٹول باب/.test(code), 'rep-chapters.js میں سٹول بلڈر درج');

console.log('سٹول باب: ماخذی درخت 238 قطاریں (صفحات 635–644)، جڑ STOOL، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
