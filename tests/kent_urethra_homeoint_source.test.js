'use strict';
// tests/kent_urethra_homeoint_source.test.js — v185: پیشاب کی نالی باب (صفحات 669–680) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/urethra.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/urethra.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_urethra_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-urethra-v1');
assert.strictEqual(srcEntries.length, 555, 'ماخذی قطاریں: 555 (جڑ URETHRA + 554) — 3 دستاویزی clamp، صفر دوہرا راستہ');
assert.strictEqual(Object.keys(data).length, 622, 'پرانی مقامی قطاریں فائل میں محفوظ (622 کل = 555 + 67)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_URETHRA_SOURCE_MARKER="homeoint-urethra-v1",_REP_KENT_URETHRA_COUNT=555;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentUrethraSourceEntries') + grab('_repHasKentUrethraSourceData') + grab('_repBuildKentUrethraSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentUrethraSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentUrethraSourceData', ctx)(data), true, 'ماخذی ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 555, 'درخت کے ربرک 555');
assert.strictEqual(tree.order[0], 'URETHRA', 'باب کی جڑ URETHRA پہلی قطار');
assert.ok(tree.count === 53, 'جڑ کے بچے 53 (جڑ قطار + 52 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 6, 'زیادہ سے زیادہ گہرائی 6 (pseudo-root +1 — ماخذی d5: 2 قطاریں): ' + maxDepth(tree));
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 669 || p > 680) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 12, '12 صفحات (669–680، MEDI-T انتساب) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (p669): AGGLUTINATION of meatus پہلا مین (16 ادویہ — thuj. 2)
const agg = tree.children['AGGLUTINATION of meatus'];
assert.ok(agg && Object.keys(agg.remedies).length === 16 && agg.remedies['thuj'] === 2, 'AGGLUTINATION of meatus: 16 ادویہ (thuj. 2 — p669 — sep/phos صبح ذیلی میں)');
// DISCHARGE, acrid d0 (9) — OOREP نے acrid کٹا تھا (phantom-سیگمنٹ — PDF x-coords سے ثابت)
const dac = tree.children['DISCHARGE, acrid'];
assert.ok(dac && Object.keys(dac.remedies).length === 9 && dac.remedies['arg-n'] === 3 && dac.remedies['merc-c'] === 3, 'DISCHARGE, acrid: 9 ادویہ (d0 — Arg-n./Merc-c. 3 — p669)');
// gleety 70 (OOREP مجموعہ 72 legacy r52) + صبح (4)
const gle = findNode(tree, 'DISCHARGE, acrid, gleety');
assert.ok(gle && Object.keys(gle.remedies).length === 70 && gle.remedies['agn'] === 3, 'gleety: 70 ادویہ (OOREP مجموعہ 72 legacy r52 — p669)');
const gmo = findNode(tree, 'DISCHARGE, acrid, gleety, morning');
assert.ok(gmo && Object.keys(gmo.remedies).length === 4 && gmo.remedies['sep'] === 3, 'gleety, morning: 4 ادویہ (Sep. 3 — p670)');
// gonorrhœal 77 (OOREP 87 legacy) + chronic (27)
const gon = findNode(tree, 'DISCHARGE, acrid, gonorrhœal');
assert.ok(gon && Object.keys(gon.remedies).length === 77, 'gonorrhœal: 77 ادویہ (OOREP مجموعہ 87 legacy — p670)');
// PAIN 23 — کتابی عین (OOREP مجموعہ 242 legacy r206 — سب سے بڑا فرق)
assert.ok(tree.children['PAIN'] && Object.keys(tree.children['PAIN'].remedies).length === 23 && tree.children['PAIN'].remedies['agar'] === 2, 'PAIN main: 23 ادویہ (OOREP مجموعہ 242 سے کتابی عین — p673)');
// PAIN, burning 124 (d1) + urination, before 29 + before, during 140 (d3)
const bur = findNode(tree, 'PAIN, burning');
assert.ok(bur && Object.keys(bur.remedies).length === 124 && bur.remedies['ars'] === 3, 'PAIN, burning: 124 ادویہ (p674)');
const ub = findNode(tree, 'PAIN, burning, urination, before');
assert.ok(ub && Object.keys(ub.remedies).length === 29, 'urination, before: 29 ادویہ (d2 — p674 — P675 خاندان اسی کے نیچے d3)');
const ud = findNode(tree, 'PAIN, burning, urination, before, during');
assert.ok(ud && Object.keys(ud.remedies).length === 140 && ud.remedies['arg-n'] === 3, 'urination, before, during: 140 ادویہ (d3 — p675 — OOREP راستہ «urination, during» 141 legacy r263)');
// ITCHING 55 (OOREP 80 legacy r162)
assert.ok(tree.children['ITCHING'] && Object.keys(tree.children['ITCHING'].remedies).length === 55 && tree.children['ITCHING'].remedies['sulph'] === 3, 'ITCHING: 55 ادویہ (OOREP مجموعہ 80 سے کتابی عین — p672)');
// گہری ماخذی d5 قطاریں (2) — walk-depth = ماخذی depth + 1 (pseudo-root)
let d5 = 0; (function walk(n, d) { if (n.hasRubric) { d += 1; if (d === 6) d5++; } for (const k of (n.order || [])) walk(n.children[k], d); })(tree, 0);
assert.strictEqual(d5, 2, 'ماخذی d5 کی 2 قطاریں (گہری ماخذی ساخت): ' + d5);
// اختتام (p680): VOLUPTUOUS sensation آخری مین (4) + urination, during (2) → after (1)
const vol = tree.children['VOLUPTUOUS sensation'];
assert.ok(vol && Object.keys(vol.remedies).length === 4, 'VOLUPTUOUS sensation آخری مین: 4 ادویہ (p680 — URINE باب سرخی سے پہلے)');
const vaf = findNode(tree, 'VOLUPTUOUS sensation, urination, during, after');
assert.ok(vaf && Object.keys(vaf.remedies).length === 1 && vaf.remedies['thuj'] === 1, 'urination, during → after: 1 ادویہ Thuj. (p680 — باب کا آخری ربرک)');
// TICKLING (See Itching) — See-ref محفوظ
assert.ok(tree.children['TICKLING (See Itching)'], 'TICKLING (See Itching) — See-ref مین (p680)');
// URINE, still flowing sensation of — URINE نام کے باوجود URETHRA کی قطار (p680)
const usf = findNode(tree, 'URINE, still flowing sensation of');
assert.ok(usf && Object.keys(usf.remedies).length === 2, 'URINE, still flowing sensation of: 2 ادویہ (URETHRA کی قطار — p680 — URINE باب سے پہلے)');

// 4) اردو فائل کی ساخت
assert.ok(Array.isArray(ur.locked) && ur.locked.length === 0, 'کوئی قفل نہیں');
assert.ok(Object.keys(ur.rubrics).length >= 555, 'اردو فائل میں 555+ فعال کلیدیں (256 غیر-درخت پرانی محفوظ): ' + Object.keys(ur.rubrics).length);

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «پیشاب کی نالی — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('پیشاب کی نالی — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «پیشاب کی نالی — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto) && ur.meta.auto.length === 10, '10 خود-بنے (ہاتھ سے لکھے — meta.auto): ' + (ur.meta.auto || []).length);
// phantom-ہم آہنگی: نئے راستے پر مکمل جملہ
assert.ok(ur.rubrics['discharge, acrid, gleety, morning'].indexOf('تیز و تند') > 0 || ur.rubrics['discharge, acrid, gleety, morning'].indexOf('اخراج') > 0, 'نئے راستے کا جملہ: discharge, acrid, gleety, morning');

// 6) مانی فیسٹ
assert.strictEqual(manifest.source_rows, 555);
assert.strictEqual(manifest.matched_app_records, 544);
assert.strictEqual(manifest.new_source_records, 11);
assert.strictEqual(manifest.legacy_local_records, 67);
assert.strictEqual(manifest.ambiguous_app_records, 9);

// 7) _index.json
const idxData = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/_index.json'), 'utf8'));
const pg = idxData.find(c => c.key === 'urethra');
assert.ok(pg && pg.rubrics === 622, '_index.json: urethra 622');

// 8) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=188/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v185)');
assert(/CACHE_NAME='bhc-clinic-v188'/.test(swf), 'خدمت کار نسخہ 185');
assert(/v185: پیشاب کی نالی باب/.test(code), 'rep-chapters.js میں URETHRA بلڈر درج');

console.log('kent_urethra_homeoint_source.test.js — تمام تصدیقیں پاس (555 ماخذی قطاریں، 622 کل، اردو 100%)');
