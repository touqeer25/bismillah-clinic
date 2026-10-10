'use strict';
// tests/kent_genm_homeoint_source.test.js — v187: تناسلی اعضاء (مرد) باب (صفحات 693–714) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/genitalia_male.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/genitalia_male.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_genm_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-genm-v1');
assert.strictEqual(srcEntries.length, 1052, 'ماخذی قطاریں: 1052 (جڑ GENITALIA MALE + 1051) — 10 دستاویزی clamps، 2 کتابی دہرائی merge');
assert.strictEqual(Object.keys(data).length, 1126, 'پرانی مقامی قطاریں فائل میں محفوظ (1126 کل = 1052 + 74)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_GENM_SOURCE_MARKER="homeoint-genm-v1",_REP_KENT_GENM_COUNT=1052;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentGenmSourceEntries') + grab('_repHasKentGenmSourceData') + grab('_repBuildKentGenmSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentGenmSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentGenmSourceData', ctx)(data), true, 'ماخذی ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 1052, 'درخت کے ربرک 1052');
assert.strictEqual(tree.order[0], 'GENITALIA MALE', 'باب کی جڑ GENITALIA MALE پہلی قطار');
assert.ok(tree.count === 100, 'جڑ کے بچے 100 (جڑ قطار + 99 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 6, 'زیادہ سے زیادہ گہرائی 6 (pseudo-root +1 — ماخذی d5: 8 قطاریں): ' + maxDepth(tree));
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 693 || p > 714) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 22, '22 صفحات (693–714، MEDI-T انتساب) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (p693): ABSCESS penis پہلا مین {bov, hippoz}
const abs = tree.children['ABSCESS penis'];
assert.ok(abs && abs.remedies['bov'] === 1 && abs.remedies['hippoz'] === 1, 'ABSCESS penis پہلا مین: Bov./hippoz. (p693 — باب کا پہلا ربرک)');
// ASLEEP, as if → ascending stairs, on (d1 — کتابی @92.7)
const asl = findNode(tree, 'ASLEEP, as if, ascending stairs, on');
assert.ok(asl && asl.remedies['form'] === 1, 'ASLEEP, as if, ascending stairs, on: Form. (p693)');
// ERECTIONS, troublesome — 65 ادویہ، وقت کی ذیلیاں daytime → … → night (F1 ترتیب)
const ere = tree.children['ERECTIONS, troublesome'];
assert.ok(ere && Object.keys(ere.remedies).length === 65 && ere.remedies['canth'] === 3, 'ERECTIONS, troublesome: 65 ادویہ (p694–696 — کتابی مین @56.6 d0)');
assert.ok(ere.order[0] === 'daytime' && ere.order.indexOf('night') > ere.order.indexOf('evening'), 'ERECTIONS, troublesome: daytime پہلی ذیلی، شام سے پہلے رات (کتابی ترتیب)');
// کتابی یتیم-indentation clamp (idx20): BUBBLING erection during d2→d1 (کتاب @128.7 d2 مگر d1 والدین نہیں — بھائی Scrotum @92.7)
const bub = findNode(tree, 'BUBBLING sensation penis, erection, during');
assert.ok(bub && bub.remedies['kali-c'] === 1, 'BUBBLING sensation penis, erection, during: Kali-c. (clamp d2→d1 — کتابی یتیم-indentation @128.7، p693)');
// خاندانی clamp (idx309): INDURATION in an old man + prepuce دونوں d1 (کتاب @128.7 orphan جوڑی)
const ind1 = findNode(tree, 'INDURATION, penis, in an old man');
const ind2 = findNode(tree, 'INDURATION, penis, prepuce');
assert.ok(ind1 && ind2 && ind1.remedies['berb'] === 2 && ind2.remedies['lach'] === 2, 'INDURATION: in-an-old-man Berb. + prepuce Lach. — دونوں d1 بھائی (خاندانی clamp، p699)');
// کتابی دہرائی merge #1: ITCHING, Scrotum, morning — union 4 ادویات (p701 کرونولوجیکل + الفبائی)
const itcm = findNode(tree, 'ITCHING, Scrotum, morning');
assert.ok(itcm && itcm.remedies['coc-c'] === 1 && itcm.remedies['carb-ac'] === 1 && itcm.remedies['cocc'] === 1 && itcm.remedies['gran'] === 1, 'ITCHING, Scrotum, morning: union 4 ادویہ (کتابی دہرائی merge — coc-c + carb-ac/cocc/gran، p701 PDF L548/L554)');
// کتابی دہرائی merge #2: ULCERS, Penis, painful — union {cor-r:2, sil:2} (p714)
const ulp = findNode(tree, 'ULCERS, Penis, painful');
assert.ok(ulp && ulp.remedies['cor-r'] === 2 && ulp.remedies['sil'] === 2, 'ULCERS, Penis, painful: union Cor-r.2/sil.2 (کتابی دہرائی merge، p714)');
// INFLAMMATION, Testes (p700 انڈیکس اندراج — kent0695 P700)
const inf = findNode(tree, 'INFLAMMATION, Testes');
assert.ok(inf && Object.keys(inf.remedies).length >= 30, 'INFLAMMATION, Testes: بڑا مین (p700 انڈیکس اندراج)');
// دستی J=1.00 جوڑا: ITCHING, scratching (OOREP لیبل scratching-agg غلط — ادویات {iris,tril} عین)
const its = findNode(tree, 'ITCHING, scratching');
assert.ok(its && its.remedies['iris'] === 1 && its.remedies['tril'] === 1, 'ITCHING, scratching: Iris./tril. (دستی جوڑا r381 — OOREP لیبل غلط تھا، p700)');
// نئے hN: PAIN, Testes, after (کتابی قطار جو ایپ میں تھی ہی — o38402 برتن legacy)
const pta = findNode(tree, 'PAIN, Testes, after');
assert.ok(pta && pta.remedies['mag-m'] === 1 && pta.remedies['ox-ac'] === 1 && pta.remedies['ph-ac'] === 2, 'PAIN, Testes, after: Mag-m./ox-ac./Ph-ac.2 (نئی hN — کتابی p702، OOREP برتن legacy)');
// See-ref مین بے-ادویات
assert.ok(tree.children['PRICKLING (See Tingling)'], 'PRICKLING (See Tingling) — See-ref مین (p708، نئی hN)');
assert.ok(findNode(tree, 'SWELLING, Testes, suppressed gonorrhœa, from (See Inflammation)'), 'SWELLING, Testes, suppressed gonorrhœa, from (See Inflammation) — See-ref (p713، نئی hN)');
// لیبل-ریپ قطار (PDF-side artifact کا ماخذی جواب): attempt to satisfy… (p711)
const ats = findNode(tree, 'SEXUAL PASSION diminished, increased, attempt to satisfy, it, by every, until it drives him to onanism, and madness');
assert.ok(ats && ats.remedies['anan'] === 1, 'attempt-to-satisfy پوری قطار: Anan. (p711 — PDF لیبل-ریپ گلا، ماخذی درخت کتابی عین @128.7 d2)');
// d5 ماخذی قطاریں (8): PAIN … glans, urination, before, during — کتابی @236.7
const d5 = findNode(tree, 'PAIN, burning, Penis, glans, urination, before, during');
assert.ok(d5 && d5.remedies['ars'] === 2 && d5.remedies['pareir'] === 2, 'PAIN, burning…urination, before, during: 4 ادویہ (ماخذی d5 — کتاب @236.7، p703)');
// اختتام (p714): WEAKNESS, coition, after, sensation of, stool, after {calc-p:2, calc:2} — GENITALIA FEMALE سے پہلے
const wea = findNode(tree, 'WEAKNESS, coition, after, sensation of, stool, after');
assert.ok(wea && wea.remedies['calc-p'] === 2 && wea.remedies['calc'] === 2, 'WEAKNESS…stool, after آخری قطار: Calc-p./calc. 2 (p714 — GENITALIA FEMALE باب سے بالکل پہلے)');
// GENITALIA FEMALE لیک نہیں
assert.ok(!findNode(tree, 'GENITALIA FEMALE'), 'GENITALIA FEMALE باب لیک نہیں (FEMALE اینکر کٹ — CONDYLOMATA, itching مرد باب کی جائز p693 قطار ہے)');
// ماخذی d5 کی 8 قطاریں — walk-depth = ماخذی depth + 1 (pseudo-root)
let d5c = 0; (function walk(n, d) { if (n.hasRubric) { d += 1; if (d === 6) d5c++; } for (const k of (n.order || [])) walk(n.children[k], d); })(tree, 0);
assert.strictEqual(d5c, 8, 'ماخذی d5 کی 8 قطاریں (گہری ماخذی ساخت): ' + d5c);

// 4) اردو فائل کی ساخت
assert.ok(Array.isArray(ur.locked) && ur.locked.length === 0, 'کوئی قفل نہیں');
assert.ok(Object.keys(ur.rubrics).length >= 1052, 'اردو فائل میں 1052+ فعال کلیدیں (393 غیر-درخت پرانی محفوظ): ' + Object.keys(ur.rubrics).length);

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «تناسلی اعضاء (مرد) — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('تناسلی اعضاء (مرد) — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «تناسلی اعضاء (مرد) — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto) && ur.meta.auto.length === 7, '7 خود-بنے (ہاتھ سے لکھے — meta.auto): ' + (ur.meta.auto || []).length);
// ہاتھ-لکھے جملے
assert.ok(ur.rubrics['pain, testes, after'] === 'تناسلی اعضاء (مرد) — درد، خصیے، کے بعد', 'ہاتھ-لکھا: pain, testes, after');
assert.ok(ur.rubrics['prickling'] === 'تناسلی اعضاء (مرد) — چبھن جیسی جلن', 'ہاتھ-لکھا: prickling (See Tingling)');
assert.ok(ur.rubrics['pain, sore, bruised, testes, evening, 6 to 11 p.m.'] === 'تناسلی اعضاء (مرد) — درد، دکھتا ہوا، خصیے، شام، 6 سے 11 بجے', 'ہاتھ-لکھا: 6 to 11 p.m.');
assert.ok(ur.rubrics['swelling, testes, suppressed gonorrhœa, from'] === 'تناسلی اعضاء (مرد) — سوجن، خصیے، دبا دیا گیا (بند کر دیا گیا) سوزاک (گنوریا) سے', 'ہاتھ-لکھا: suppressed gonorrhœa, from');
// پاتھ-ہم آہنگی: نئے راستے پر مکمل جملہ (والدین کے نیا جملہ + لیبل)
assert.ok(ur.rubrics['erections, troublesome, seldom'] === 'تناسلی اعضاء (مرد) — عضو کی سختی (انتشار)، تکلیف دہ، کبھی کبھار', 'نئے راستے کا جملہ: erections, troublesome, seldom (troublesome سیگمنٹ شامل — پاتھ-ہم آہنگی)');

// 6) مانی فیسٹ
assert.strictEqual(manifest.source_rows, 1052);
assert.strictEqual(manifest.matched_app_records, 1044);
assert.strictEqual(manifest.new_source_records, 8);
assert.strictEqual(manifest.legacy_local_records, 74);
assert.strictEqual(manifest.ambiguous_app_records, 15);

// 7) _index.json
const idxData = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/_index.json'), 'utf8'));
const pg = idxData.find(c => c.key === 'genitalia_male');
assert.ok(pg && pg.rubrics === 1126 && pg.name === 'GENITALIA MALE', '_index.json: genitalia_male 1126 / GENITALIA MALE');

// 8) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=191/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v187)');
assert(/CACHE_NAME='bhc-clinic-v191'/.test(swf), 'خدمت کار نسخہ 187');
assert(/v187: تناسلی اعضاء \(مرد\) باب/.test(code), 'rep-chapters.js میں GENITALIA MALE بلڈر درج');
// kent-tree-fix: genitalia_male.h = 74 legacy ids (تمام پرانی مقامی قطاریں — urine/urethra قاعدہ)
const tf = fs.readFileSync(path.join(ROOT, 'js/repertory/kent-tree-fix.js'), 'utf8');
assert(/"v":\s*"147"/.test(tf), 'kent-tree-fix نسخہ 147 (پچھلے بابوں کا قاعدہ)');
assert.ok(/"genitalia_male":\{"h":\[[^\]]*"r933"/.test(tf), 'kent-tree-fix genitalia_male.h میں r933 (74 legacy ids — SPOTS on penis twin ماخذی m38582 سے باہر)');

console.log('kent_genm_homeoint_source.test.js — تمام تصدیقیں پاس (1052 ماخذی قطاریں، 1126 کل، اردو 100%)');
