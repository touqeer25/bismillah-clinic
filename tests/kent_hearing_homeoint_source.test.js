'use strict';
// tests/kent_hearing_homeoint_source.test.js — v171: سماعت باب (صفحات 321–323) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/hearing.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/hearing.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_hearing_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-hearing-v1');
assert.strictEqual(srcEntries.length, 146, 'ماخذی قطاریں: 146 (145 + باب کی جڑ HEARING)');
assert.strictEqual(Object.keys(data).length, 166, 'پرانی مقامی قطاریں فائل میں محفوظ (166 کل)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_HEARING_SOURCE_MARKER="homeoint-hearing-v1",_REP_KENT_HEARING_COUNT=146;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentHearingSourceEntries') + grab('_repHasKentHearingSourceData') + grab('_repBuildKentHearingSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentHearingSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentHearingSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 146, 'درخت کے ربرک 146');
assert.strictEqual(tree.order[0], 'HEARING', 'باب کی جڑ HEARING پہلی قطار');
assert.ok(tree.count === 6, 'جڑ کے بچے 6 (HEARING جڑ قطار + ACUTE/DISTANT/ILLUSIONS/IMPAIRED/LOST): ' + tree.count);
assert.ok(maxDepth(tree) === 4, 'زیادہ سے زیادہ گہرائی 4 (synthetic جڑ + مین + ذیلی + ذیلی-ذیلی + seems very loud)');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 321 || p > 323) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 3, '3 صفحات (321–323) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + مستند درستیاں
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// ACUTE: ماخذی 76 ادویات (ایپ کے پرانے 105 نہیں — ذیلیوں کی ادویات والد میں گلی تھیں)
const acute = findNode(tree, 'ACUTE');
assert.ok(acute && Object.keys(acute.remedies).length === 76, 'ACUTE: ماخذی 76 ادویات');
// ماخذ کے 3 صفحات کے پہلے مین: ACUTE→DISTANT→ILLUSIONS→IMPAIRED→LOST
assert.deepStrictEqual(Array.from(tree.order).slice(1), ['ACUTE', 'DISTANT, sounds seem', 'ILLUSIONS', 'IMPAIRED', 'LOST'], 'مین ربرکس کتابی ترتیب');
// 16 run-on لفٹیں (OOREP دو-فارم ٹیسٹ) — بھائی فارم
assert.ok(findNode(tree, 'ACUTE, music, organ') && findNode(tree, 'ACUTE, music, during menses') && findNode(tree, 'ACUTE, music, amel.'), 'music-خاندان: بھائی فارم');
assert.ok(findNode(tree, 'ACUTE, noises, cause nausea') && findNode(tree, 'ACUTE, noises, perspiration, during') && findNode(tree, 'ACUTE, noises, scratching on linen and silk'), 'noises-خاندان: بھائی فارم');
assert.ok(findNode(tree, 'IMPAIRED, air, open, amel.') && findNode(tree, 'IMPAIRED, air, open, agg.'), 'air-خاندان: بھائی فارم');
assert.ok(findNode(tree, 'IMPAIRED, cough, amel.') && findNode(tree, 'IMPAIRED, cough, during'), 'cough-خاندان: بھائی فارم');
assert.ok(findNode(tree, 'IMPAIRED, menses, during') && findNode(tree, 'IMPAIRED, menses, before'), 'menses-خاندان: بھائی فارم');
assert.ok(findNode(tree, 'IMPAIRED, report, loud, followed by deafness') && findNode(tree, 'IMPAIRED, report, relieved after'), 'report-خاندان: بھائی فارم');
assert.ok(findNode(tree, 'IMPAIRED, swallowing, amel.') && findNode(tree, 'IMPAIRED, swallowing, on'), 'swallowing-خاندان: بھائی فارم');
assert.ok(findNode(tree, 'IMPAIRED, walking, in the wind') && findNode(tree, 'IMPAIRED, walking, while'), 'walking-خاندان: بھائی فارم');
assert.ok(findNode(tree, 'IMPAIRED, warm room, amel.') && findNode(tree, 'IMPAIRED, warm room agg.'), 'warm-room-خاندان: بھائی فارم');
// صاف nesting برقرار
assert.ok(findNode(tree, 'ACUTE, evening, bed, in') && findNode(tree, 'ACUTE, evening, on falling asleep'), 'evening-ذیلیاں nested');
assert.ok(findNode(tree, 'IMPAIRED, forenoon, 11 a.m.') && findNode(tree, 'IMPAIRED, forenoon, lasting till 8 p.m.'), 'forenoon-ذیلیاں nested');
assert.ok(findNode(tree, 'IMPAIRED, distance, when at a, amel.') && findNode(tree, 'IMPAIRED, distance, when at a, all sounds seem far off'), 'distance-خاندان nested (PDF: amel. + all sounds دونوں)');
assert.ok(findNode(tree, 'IMPAIRED, warm from walking, on becoming, amel.'), 'warm-from-walking: amel. nested');
// 3 گم شدہ ربرکس بحال — والد sounds of a hammer (کتاب + homeoint)
const hammer = findNode(tree, 'ACUTE, sounds of a hammer');
assert.ok(hammer && hammer.children['vehicles, tho\' deaf to voices'] && hammer.children['affect the teeth'] && hammer.children['long retained'], 'hammer کے 3 بحال شدہ ذیلی (OOREP id خلاء 44981–83)');
assert.ok(Object.keys(hammer.remedies).length === 1 && hammer.remedies.sang === 1, 'hammer: صرف Sang.');
assert.ok(findNode(tree, 'ACUTE, voices and talking, her own, seems very loud'), 'voices: d3 ذیلی کتابی ساخت');
// LOST: باب کا اختتام
const lost = findNode(tree, 'LOST');
assert.ok(lost && Object.keys(lost.remedies).length === 97, 'LOST: ماخذی 97 ادویات');
assert.ok(findNode(tree, 'LOST, waking, on'), 'LOST کا آخری ربرک (waking, on)');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «سماعت — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('سماعت — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «سماعت — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto), 'meta.auto فہرست (خود-بنے جملے نظرثانی کے لیے)');

// 6) مانی فیسٹ + تصدیق-ضروری CSV
assert.strictEqual(manifest.source_rows, 146);
assert.strictEqual(manifest.matched_app_records, 138);
assert.strictEqual(manifest.new_source_records, 8);
assert.strictEqual(manifest.legacy_local_records, 20);
const csvPath = path.join(ROOT, '..', 'download', 'kent-confirmation-needed.csv');
if (fs.existsSync(csvPath)) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  assert.ok(csv.indexOf('سماعت (HEARING)') !== -1, 'تصدیق-ضروری CSV میں سماعت کے اندراجات (ڈیلیوری ماحول میں)');
}

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=171/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v171)');
assert(/CACHE_NAME='bhc-clinic-v171'/.test(sw), 'خدمت کار نسخہ 171');
assert(/v171: سماعت باب/.test(code), 'rep-chapters.js میں سماعت بلڈر درج');

console.log('سماعت باب: ماخذی درخت 146 قطاریں (صفحات 321–323)، جڑ HEARING، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
