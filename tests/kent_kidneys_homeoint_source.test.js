'use strict';
// tests/kent_kidneys_homeoint_source.test.js — v183: گردے باب (صفحات 662–667) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/kidneys.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/kidneys.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_kidneys_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-kidneys-v1');
assert.strictEqual(srcEntries.length, 246, 'ماخذی قطاریں: 246 (247 خام − 1 کتابی دہرائی merge + جڑ KIDNEYS)');
assert.strictEqual(Object.keys(data).length, 280, 'پرانی مقامی قطاریں فائل میں محفوظ (280 کل = 246 + 34)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_KIDNEYS_SOURCE_MARKER="homeoint-kidneys-v1",_REP_KENT_KIDNEYS_COUNT=246;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentKidneysSourceEntries') + grab('_repHasKentKidneysSourceData') + grab('_repBuildKentKidneysSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentKidneysSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentKidneysSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 246, 'درخت کے ربرک 246');
assert.strictEqual(tree.order[0], 'KIDNEYS', 'باب کی جڑ KIDNEYS پہلی قطار');
assert.ok(tree.count === 21, 'جڑ کے بچے 21 (جڑ قطار + 20 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 5, 'زیادہ سے زیادہ گہرائی 5 (Ureters → extending → urethra, into → and seminal cords): ' + maxDepth(tree));
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 662 || p > 667) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 6, '6 صفحات (662–667، MEDI-T انتساب) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (p662): ABSCESS پہلا مین
assert.ok(tree.children['ABSCESS'] && Object.keys(tree.children['ABSCESS'].remedies).length === 5, 'ABSCESS: 5 ادویہ (کتابی ص 663 آغاز — Ars., hep., hippoz., merc., sil.)');
assert.ok(tree.children["ADDISON'S disease"] && Object.keys(tree.children["ADDISON'S disease"].remedies).length === 33, "ADDISON'S disease: 33 ادویہ");
assert.ok(tree.children['CALCULI (See Urine, Sediment)'] && Object.keys(tree.children['CALCULI (See Urine, Sediment)'].remedies).length === 0, 'CALCULI: خالی کراس-ریفرنس مین (See Urine, Sediment)');
// بڑے مین: PAIN 102، INFLAMMATION، SUPPRESSION of urine
assert.ok(Object.keys(tree.children['PAIN'].remedies).length === 102, 'PAIN main: 102 ادویہ');
assert.ok(Object.keys(tree.children['INFLAMMATION'].remedies).length === 80, 'INFLAMMATION main: 80 ادویہ (OOREP مجموعہ 86 سے کتابی عین — 6 union ادویہ legacy o45122 میں)');
assert.ok(Object.keys(tree.children['SUPPRESSION of urine'].remedies).length === 78, 'SUPPRESSION of urine: 78 ادویہ (OOREP مجموعہ 81 سے کتابی عین)');
// acute parenchymatous (See Albumen) — p663 مارکر skip کے بعد اصل قطار
const acu = findNode(tree, 'INFLAMMATION, acute parenchymatous (See Albumen)');
assert.ok(acu && Object.keys(acu.remedies).length === 13 && acu.remedies['apis'] === 3, 'acute parenchymatous: 13 ادویہ (Apis 3 — p663)');
// کتابی دہرائی merge: PAIN, pulsating = p663 Bufo + p665 Berb → union (ایپ r41 عین)
const puls = findNode(tree, 'PAIN, pulsating');
assert.ok(puls && puls.remedies['bufo'] === 1 && puls.remedies['berb'] === 1 && Object.keys(puls.remedies).length === 2, 'PAIN, pulsating: Bufo+Berb union (کتابی دہرائی p663+p665 merge — r41 عین)');
// stitching خاندان: کتابی ساخت — sticking کے نیچے وقت-ذیلیاں (d2) — OOREP نے «stitching» درمیانی خود بنایا تھا
const stick = findNode(tree, 'PAIN, stitching, stinging, sticking');
assert.ok(stick && Object.keys(stick.remedies).length === 58, 'stitching, stinging, sticking: 58 ادویہ (کتاب folio 1434)');
const morn = findNode(tree, 'PAIN, stitching, stinging, sticking, morning');
assert.ok(morn && morn.remedies['chel'] === 1 && Object.keys(morn.remedies).length === 1, 'sticking → morning: Chel. (کتاب p666 — MEDI-T <dir><dir> = کتاب x0-128 d2)');
const morn4 = findNode(tree, 'PAIN, stitching, stinging, sticking, morning, 4 a.m.');
assert.ok(morn4 && morn4.remedies['cinnb'] === 1, 'sticking → morning → 4 a.m.: Cinnb. (d3)');
const tear = findNode(tree, 'PAIN, tearing');
assert.ok(tear && Object.keys(tear.remedies).length === 9 && tear.order.length === 9, 'PAIN, tearing: 9 ادویہ + 9 ذیلیاں (p666-667 — کتابی عین)');
// shooting خاندان: کتابی ساخت — shooting (See Stitching) کے نیچے sore, bruised اور وقت/جگہ بھائی (d2)
const shoot = findNode(tree, 'PAIN, shooting (See Stitching)');
assert.ok(shoot && Object.keys(shoot.remedies).length === 0, 'shooting: خالی کراس-ریفرنس مین (See Stitching)');
const sore = findNode(tree, 'PAIN, shooting (See Stitching), sore, bruised');
assert.ok(sore && Object.keys(sore.remedies).length === 47, 'shooting → sore, bruised: 47 ادویہ (کتاب d2 — OOREP مجموعہ 59 سے کتابی عین، دستاویزی)');
// گہری d4 قطار: Ureters, right side → extending to penis and testes → urethra, into → and seminal cords
const deep = findNode(tree, 'PAIN, Ureters, right side, extending to penis and testes, urethra, into, and seminal cords');
assert.ok(deep && deep.remedies['clem'] === 1 && deep.remedies['dios'] === 1, 'گہری d4 قطار: and seminal cords (Clem., dios.)');
// اختتام (p667): WEARINESS, region of آخری (10 ادویہ)
assert.ok(tree.children['WEARINESS, region of'] && Object.keys(tree.children['WEARINESS, region of'].remedies).length === 10, 'WEARINESS, region of: 10 ادویہ (باب کا آخری ربرک p667)');
// باب-حد: PROSTATE/URETHRA باب کٹ
assert.ok(!findNode(tree, 'PROSTATE GLAND') && !findNode(tree, 'BALL, sensation of sitting on a'), 'PROSTATE باب کٹ (P667 اینکر حد)');
assert.ok(!findNode(tree, 'URINARY ORGANS'), 'URINARY ORGANS سرخی کٹ');
assert.ok(!findNode(tree, 'PAIN, stitching, morning') || !findNode(tree, 'PAIN, stitching, morning') , 'OOREP ساخت کا «PAIN, stitching, morning» راستہ درخت میں نہیں (کتابی راستہ sticking کے نیچے)');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «گردے — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('گردے — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «گردے — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto) && ur.meta.auto.length === 15, 'meta.auto فہرست (15 لغت سے خود-بنے)');

// 6) مانی فیسٹ
assert.strictEqual(manifest.source_rows, 246);
assert.strictEqual(manifest.matched_app_records, 230);
assert.strictEqual(manifest.new_source_records, 16);
assert.strictEqual(manifest.legacy_local_records, 34);
assert.strictEqual(manifest.ambiguous_app_records, 7);

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=191/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v183)');
assert(/CACHE_NAME='bhc-clinic-v191'/.test(swf), 'خدمت کار نسخہ 183');
assert(/v183: گردے باب/.test(code), 'rep-chapters.js میں گردے بلڈر درج');

console.log('kent_kidneys_homeoint_source.test.js — تمام تصدیقیں پاس (246 ماخذی قطاریں، 280 کل، اردو 100%)');
