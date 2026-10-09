'use strict';
// tests/kent_extthroat_homeoint_source.test.js — v177: بیرونی گلا باب (صفحات 471–475) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/external_throat.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/external_throat.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_extthroat_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-extthroat-v1');
assert.strictEqual(srcEntries.length, 248, 'ماخذی قطاریں: 248 (247 + باب کی جڑ EXTERNAL THROAT)');
assert.strictEqual(Object.keys(data).length, 256, 'پرانی مقامی قطاریں فائل میں محفوظ (256 کل = 248 + 8)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_EXTTHROAT_SOURCE_MARKER="homeoint-extthroat-v1",_REP_KENT_EXTTHROAT_COUNT=248;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentExtThroatSourceEntries') + grab('_repHasKentExtThroatSourceData') + grab('_repBuildKentExtThroatSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentExtThroatSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentExtThroatSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 248, 'درخت کے ربرک 248');
assert.strictEqual(tree.order[0], 'EXTERNAL THROAT', 'باب کی جڑ EXTERNAL THROAT پہلی قطار');
assert.ok(tree.count === 35, 'جڑ کے بچے 35 (جڑ قطار + 34 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 5, 'زیادہ سے زیادہ گہرائی 5');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 471 || p > 475) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 5, '5 صفحات (471–475) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + مستند درستیاں
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (ص 471): ABSCESS 14 ادویہ (Hep./Merc./Sil. گریڈ 3) + AIR, sensitive to 8
const abs = tree.children['ABSCESS'];
assert.ok(abs && Object.keys(abs.remedies).length === 14 && abs.remedies['hep'] === 3 && abs.remedies['merc'] === 3 && abs.remedies['sil'] === 3, 'ABSCESS: 14 ادویہ، Hep./Merc./Sil. گریڈ 3 (کتاب ص 471)');
const air = tree.children['AIR, sensitive to'];
assert.ok(air && Object.keys(air.remedies).length === 8 && air.remedies['caust'] === 2 && air.remedies['hep'] === 2, 'AIR, sensitive to: 8 ادویہ');
// GOITRE مین 49 + exophthalmic 15 (ص 471–472)
const goit = tree.children['GOITRE'];
assert.ok(goit && Object.keys(goit.remedies).length === 49, 'GOITRE مین: 49 ادویہ');
const exo = findNode(tree, 'GOITRE, exophthalmic');
assert.ok(exo && Object.keys(exo.remedies).length === 15 && exo.remedies['aur-i'] === 2, 'GOITRE > exophthalmic: 15 ادویہ (ص 472)');
// ص 472 clamp: «PAIN, burning, sides, right» d2 (بلا-وسط بچہ — MEDI-T اضافی <dir>)
const right = findNode(tree, 'PAIN, burning, sides, right');
assert.ok(right && Object.keys(right.remedies).length === 4 && right.remedies['alum'] === 1, 'burning-sides-right: 4 ادویہ (clamp d2)');
assert.strictEqual(data[right.rid].source_depth, 2, 'right گہرائی 2 (d3→d2 clamp — burning, sides کا بلا-وسط بچہ)');
assert.ok(findNode(tree, 'PAIN, burning, sides, left'), 'burning-sides-left بھائی موجود');
// ص 473 clamp: «PAIN, pressing, sides, intermittent» d2
const inter = findNode(tree, 'PAIN, pressing, sides, intermittent');
assert.ok(inter && Object.keys(inter.remedies).length === 1 && inter.remedies['spong'] === 1, 'pressing-sides-intermittent: 1 ادویہ (clamp d2)');
// ص 474 دستی جوڑا: o15077 «PERSPIRATION, evening, 6 to 9 p.m.» (وقت-فارمیٹ، PDF 1055: Chel.)
const pers = findNode(tree, 'PERSPIRATION, evening, 6 to 9 p.m.');
assert.ok(pers && Object.keys(pers.remedies).length === 1 && pers.remedies['chel'] === 1 && pers.rid === 'o15077', '6 to 9 p.m.: 1 ادویہ Chel.، o15077 (کتابی فارمیٹ)');
assert.ok(findNode(tree, 'PERSPIRATION, evening') && findNode(tree, 'PERSPIRATION, midnight, on waking'), 'PERSPIRATION خاندان مکمل');
// ص 474: PULSATION, carotids 32 ادویہ — r195 عین-فارم
const puls = findNode(tree, 'PULSATION, carotids');
assert.ok(puls && Object.keys(puls.remedies).length === 32 && puls.remedies['bell'] === 3 && puls.rid === 'r195', 'PULSATION, carotids: 32 ادویہ، r195');
assert.ok(findNode(tree, 'PULSATION, carotids, Sides, evening'), 'carotids > Sides > evening ذیلی');
// ص 475 دستی جوڑے: o15122/25/26 «TORTICOLLIS, …» ↔ کتابی «TUMORS, side, …» (PDF 1058)
const tum = tree.children['TUMORS, side'];
assert.ok(tum && Object.keys(tum.remedies).length === 1 && tum.remedies['brom'] === 2, 'TUMORS, side مین: 1 ادویہ (Brom.)');
const cystic = findNode(tree, 'TUMORS, side, cystic');
assert.ok(cystic && cystic.remedies['brom'] === 2 && cystic.rid === 'o15122', 'TUMORS, side, cystic: o15122 (OOREP نام-تبدیل واپس)');
assert.ok(findNode(tree, 'TUMORS, side, fatty').rid === 'o15125' && findNode(tree, 'TUMORS, side, recurrent fibroid').rid === 'o15126', 'fatty/recurrent fibroid: o15125/o15126');
// اختتام (ص 475): UNCOVERING throat agg. 17 + WARTS 3 (آخری مین)
const unc = tree.children['UNCOVERING throat agg.'];
assert.ok(unc && Object.keys(unc.remedies).length === 17 && unc.remedies['hep'] === 3, 'UNCOVERING throat agg.: 17 ادویہ (کتاب ص 475)');
const warts = tree.children['WARTS'];
assert.ok(warts && Object.keys(warts.remedies).length === 3 && warts.remedies['nit-ac'] === 1 && warts.remedies['sil'] === 1 && warts.remedies['thuj'] === 1, 'WARTS: 3 ادویہ (آخری مین، ص 475)');
// legacy پرانیاں
['m14889', 'm14931', 'm15127', 'r106', 'o65427', 'o65428', 'o65429', 'o65430'].forEach(k => {
  assert.ok(!data[k].source_canonical, k + ' پرانیوں میں محفوظ');
});
assert.ok(!findNode(tree, 'STOMACH') && !findNode(tree, 'AIR, as if was forcing through nose'), 'STOMACH باب کٹ (P476 حد)');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «بیرونی گلا — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('بیرونی گلا — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «بیرونی گلا — » سے شروع');
assert.strictEqual(ur.rubrics['external throat'], 'بیرونی گلا — بیرونی گلا', 'جڑ EXTERNAL THROAT کا جملہ');
assert.ok(Array.isArray(ur.meta.auto) && ur.meta.auto.length === 0, 'meta.auto خالی (247 پرانے منتقل + جڑ)');

// 6) مانی فیسٹ + تصدیق-ضروری CSV
assert.strictEqual(manifest.source_rows, 248);
assert.strictEqual(manifest.matched_app_records, 247);
assert.strictEqual(manifest.new_source_records, 1);
assert.strictEqual(manifest.legacy_local_records, 8);
const csvPath = path.join(ROOT, '..', 'download', 'kent-confirmation-needed.csv');
if (fs.existsSync(csvPath)) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  assert.ok(csv.indexOf('بیرونی گلا (EXTERNAL THROAT)') !== -1, 'تصدیق-ضروری CSV میں بیرونی گلا کے اندراجات (ڈیلیوری ماحول میں)');
}

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=178/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v177)');
assert(/CACHE_NAME='bhc-clinic-v178'/.test(swf), 'خدمت کار نسخہ 177');
assert(/v177: بیرونی گلا باب/.test(code), 'rep-chapters.js میں بیرونی گلا بلڈر درج');

console.log('بیرونی گلا باب: ماخذی درخت 248 قطاریں (صفحات 471–475)، جڑ EXTERNAL THROAT، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
