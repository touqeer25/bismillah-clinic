'use strict';
// tests/kent_stomach_homeoint_source.test.js — v178: معدہ باب (صفحات 476–540) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/stomach.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/stomach.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_stomach_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-stomach-v1');
assert.strictEqual(srcEntries.length, 2940, 'ماخذی قطاریں: 2940 (2939 + باب کی جڑ STOMACH)');
assert.strictEqual(Object.keys(data).length, 3222, 'پرانی مقامی قطاریں فائل میں محفوظ (3222 کل = 2940 + 282)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_STOMACH_SOURCE_MARKER="homeoint-stomach-v1",_REP_KENT_STOMACH_COUNT=2940;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentStomachSourceEntries') + grab('_repHasKentStomachSourceData') + grab('_repBuildKentStomachSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentStomachSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentStomachSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 2940, 'درخت کے ربرک 2940');
assert.strictEqual(tree.order[0], 'STOMACH', 'باب کی جڑ STOMACH پہلی قطار');
assert.ok(tree.count === 102, 'جڑ کے بچے 102 (جڑ قطار + 101 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 6, 'زیادہ سے زیادہ گہرائی 6');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 476 || p > 540) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 65, '65 صفحات (476–540) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + مستند درستیاں
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (ص 476): ANXIETY 65 ادویہ
const anx = tree.children['ANXIETY'];
assert.ok(anx && Object.keys(anx.remedies).length === 65 && anx.remedies['ars'] === 3 && anx.remedies['acon'] === 2, 'ANXIETY: 65 ادویہ، Ars./Tarent. گریڈ 3، Acon. 2 (کتاب ص 476)');
// ص 480: AVERSION to acids 10 ادویہ — کتابی مین (AVERSION کے اگلے بچے الگ)
const av = tree.children['AVERSION to acids'];
assert.ok(av && Object.keys(av.remedies).length === 10 && av.remedies['abies-c'] === 1, 'AVERSION to acids: 10 ادویہ (کتاب ص 480)');
// ص 484/485: milk (See Milk) ref-قطار الگ (h002) + اصلی milk 27 (r364) — raw-key اسکیم
const milkRef = findNode(tree, 'DESIRES alcoholic drinks, milk (See Milk)');
assert.ok(milkRef && milkRef.rid === 'h002' && Object.keys(milkRef.remedies).length === 0, 'milk (See Milk): h002 — See-ref علیحدہ (raw-key اسکیم)');
const milk = findNode(tree, 'DESIRES alcoholic drinks, milk');
assert.ok(milk && milk.rid === 'r364' && Object.keys(milk.remedies).length === 27 && milk.remedies['rhus-t'] === 3, 'DESIRES alcoholic drinks, milk: 27 ادویہ، r364 (ص 485)');
// ص 484 clamp: menses, before d1 (d2→d1 خاندانی shift)
const mb = findNode(tree, 'DESIRES alcoholic drinks, menses, before');
assert.ok(mb && mb.rid === 'r326' && mb.remedies['sel'] === 3 && data['r326'].source_depth === 1, 'menses, before: r326، Sel. گریڈ 3، d1 (clamp، ص 484)');
// ص 514: PAIN, pressure 26 — o59389 (مبہم سے دستی جوڑا J=1.000)
const pp = findNode(tree, 'PAIN, pressure');
assert.ok(pp && pp.rid === 'o59389' && Object.keys(pp.remedies).length === 26 && pp.remedies['calc'] === 2 && pp.remedies['agar'] === 1, 'PAIN, pressure: 26 ادویہ، o59389 (ص 514)');
// ص 521 دستی جوڑا: o59335 «PAIN, pressing, lying, while, on back» (OOREP agg.-لاحقہ واپس)
const pback = findNode(tree, 'PAIN, pressing, lying, while, on back');
assert.ok(pback && pback.rid === 'o59335' && pback.remedies['caust'] === 1, 'pressing-lying-while-on-back: o59335، Caust. (کتابی فارمیٹ)');
// ص 502 دستی جوڑا: o58512 «HICCOUGH, morning, 11 a.m.» (OOREP forenoon ↔ کتابی morning)
const hic = findNode(tree, 'HICCOUGH, morning, 11 a.m.');
assert.ok(hic && hic.rid === 'o58512' && hic.remedies['ox-ac'] === 1, 'HICCOUGH, morning, 11 a.m.: o58512 (کتابی وقت-نام)');
// ص 535 ماخذ ترمیم: «VOMITING, wine, amel.» (MEDI-T flat ← کتابی ساخت) — o60206
const wine = findNode(tree, 'VOMITING, wine, amel.');
assert.ok(wine && wine.rid === 'o60206' && wine.remedies['kalm'] === 1, 'VOMITING, wine, amel.: o60206، Kalm. (mauxz ترمیم)');
assert.ok(findNode(tree, 'VOMITING, wine agg.') && findNode(tree, 'VOMITING, wine agg.').remedies['ant-c'] === 2, 'VOMITING, wine agg.: Ant-c. — کتابی جوڑا');
// ص 524 نئی قطار: PERSPIRATION on pit of (h009)
const per = findNode(tree, 'PERSPIRATION on pit of');
assert.ok(per && per.rid === 'h009' && Object.keys(per.remedies).length === 3, 'PERSPIRATION on pit of: h009، 3 ادویہ (ص 524)');
// اختتام (ص 540): WATERBRASH (See Eructations) 0 + WINE, unable to bear any 1 (آخری مین)
const wb = tree.children['WATERBRASH (See Eructations)'];
assert.ok(wb && Object.keys(wb.remedies).length === 0, 'WATERBRASH (See Eructations): 0 ادویہ (آخری صفحہ)');
const wineLast = tree.children['WINE, unable to bear any'];
assert.ok(wineLast && wineLast.remedies['ars'] === 1, 'WINE, unable to bear any: آخری مین (ص 540)');
// legacy پرانیاں — نمائندے
['r28', 'r184', 'r507', 'r1908', 'r387', 'o68289', 'm57331', 'm58572'].forEach(k => {
  assert.ok(data[k] && !data[k].source_canonical, k + ' پرانیوں میں محفوظ');
});
assert.ok(!findNode(tree, 'ABDOMEN') && !findNode(tree, 'ABDOMEN, ABSCESS in walls'), 'ABDOMEN باب کٹ (P541 حد)');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «معدہ — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('معدہ — ') !== 0 && String(v).indexOf('معدہ، ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «معدہ — » سے شروع');
assert.strictEqual(ur.rubrics['stomach'], 'معدہ — معدہ', 'جڑ STOMACH کا جملہ');

// 6) مانی فیسٹ + تصدیق-ضروری CSV
assert.strictEqual(manifest.source_rows, 2940);
assert.strictEqual(manifest.matched_app_records, 2931);
assert.strictEqual(manifest.new_source_records, 9);
assert.strictEqual(manifest.legacy_local_records, 282);
const csvPath = path.join(ROOT, '..', 'download', 'kent-confirmation-needed.csv');
if (fs.existsSync(csvPath)) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  assert.ok(csv.indexOf('معدہ (STOMACH)') !== -1, 'تصدیق-ضروری CSV میں معدہ کے اندراجات (ڈیلیوری ماحول میں)');
}

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=194/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v178)');
assert(/CACHE_NAME='bhc-clinic-v194'/.test(swf), 'خدمت کار نسخہ 178');
assert(/v178: معدہ باب/.test(code), 'rep-chapters.js میں معدہ بلڈر درج');

console.log('معدہ باب: ماخذی درخت 2940 قطاریں (صفحات 476–540)، جڑ STOMACH، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
