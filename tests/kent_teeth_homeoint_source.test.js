'use strict';
// tests/kent_teeth_homeoint_source.test.js — v175: دانت باب (صفحات 430 نصف – 447) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/teeth.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/teeth.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_teeth_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-teeth-v1');
assert.strictEqual(srcEntries.length, 767, 'ماخذی قطاریں: 767 (766 + باب کی جڑ TEETH)');
assert.strictEqual(Object.keys(data).length, 865, 'پرانی مقامی قطاریں فائل میں محفوظ (865 کل = 767 + 98)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_TEETH_SOURCE_MARKER="homeoint-teeth-v1",_REP_KENT_TEETH_COUNT=767;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentTeethSourceEntries') + grab('_repHasKentTeethSourceData') + grab('_repBuildKentTeethSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentTeethSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentTeethSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 767, 'درخت کے ربرک 767');
assert.strictEqual(tree.order[0], 'TEETH', 'باب کی جڑ TEETH پہلی قطار');
assert.ok(tree.count === 74, 'جڑ کے بچے 74 (جڑ قطار + 73 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 6, 'زیادہ سے زیادہ گہرائی 6');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 430 || p > 447) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 18, '18 صفحات (430–447) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + مستند درستیاں
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (ص 430 نصف) — MOUTH (v174) سے واپس آنے والا بلاک: ABSCESS of roots (16 ادویات)
const ab = tree.children['ABSCESS of roots'];
assert.ok(ab && Object.keys(ab.remedies).length === 16, 'ABSCESS of roots: 16 ادویات (کتاب ص 931)');
assert.ok(ab.remedies['hep'] === 3 && ab.remedies['sil'] === 3 && ab.remedies['bar-c'] === 2, 'ABSCESS: گریڈ Hep./Sil./Bar-c.');
assert.ok(findNode(tree, 'ADHERE together') && findNode(tree, 'BREAKING off'), 'ADHERE/BREAKING: TEETH-آغاز بلاک واپس');
assert.ok(!tree.children['TEETH'] === false && tree.children['TEETH'] && Object.keys(tree.children['TEETH'].remedies).length === 0, 'جڑ TEETH خالی سرخی');
// AIR, sensation as… (ص 430): مین + دو ذیلیاں — عین ماخذی
const air = findNode(tree, 'AIR, sensation as from cold air blowing on');
assert.ok(air && air.remedies['coc-c'] === 1 && findNode(tree, 'AIR, sensation as from cold air blowing on, if forced into them'), 'AIR-مین + ذیلیاں');
// BITE, together, desire to (See Clinch) — خالی کراس-ریفرنس مین، 5 ذیلیاں نیچے
const bite = tree.children['BITE, together, desire to (See Clinch)'];
assert.ok(bite && Object.keys(bite.remedies).length === 0, 'BITE: خالی سرخی (کتاب ص 931 — بصری تصدیق)');
assert.ok(findNode(tree, 'BITE, together, desire to (See Clinch), sends a shock through head, ear and nose'), 'BITE > sends-a-shock ذیلی (Am-c.)');
// PAIN, toothache in general (ص 433) — 159 ادویہ مین + air-cold 41 (o60539 عین-فارم جوڑا)
const pain = tree.children['PAIN, toothache in general'];
assert.ok(pain && Object.keys(pain.remedies).length === 159, 'PAIN مین: 159 ادویہ (کتاب ص 933)');
const aircold = findNode(tree, 'PAIN, toothache in general, air, cold');
assert.ok(aircold && Object.keys(aircold.remedies).length === 41 && aircold.rid === 'o60539', 'air-cold: 41 ادویہ، o60539 (r145 aggregate واپس)');
// ص 435 خاندانی لفٹ: biting teeth together, when — PAIN کا براہِ راست بچہ (44 ادویات، o60574)
const bt = findNode(tree, 'PAIN, toothache in general, biting teeth together, when');
assert.ok(bt && Object.keys(bt.remedies).length === 44 && bt.sourceOrder !== undefined, 'biting-teeth لفٹ: 44 ادویات');
assert.strictEqual(data['o60574'].source_depth, 1, 'o60574 گہرائی 1 (d2→d1 لفٹ — OOREP بھائی-فارم ثبوت)');
assert.strictEqual(data['o60574'].source_parent_id, 'r98', 'o60574 والد = PAIN مین (r98)');
// ص 444 (مطبوعہ 953): evening in bed + now-in-upper ذیلی — PDF text-layer فرق کے باوجود ماخذ درست
const eib = findNode(tree, 'PAIN, toothache in general, jerking, evening in bed');
assert.ok(eib && eib.remedies['bry'] === 2 && eib.remedies['zinc'] === 1, 'evening-in-bed: {Bry., Zinc.} (کتاب ص 953)');
assert.ok(findNode(tree, 'PAIN, toothache in general, jerking, evening in bed, now in upper, now in lower molars, when in upper and they are pressed by tip of finger, suddenly changes to lower'), 'now-in-upper ذیلی موجود');
// ص 445 (مطبوعہ 948+949): stitching, stinging, left — کتابی دہرایا max-گریڈ ضم (8+1=9)
const left = findNode(tree, 'PAIN, toothache in general, stitching, stinging, left');
assert.ok(left && Object.keys(left.remedies).length === 9 && left.remedies['ail'] === 1 && left.remedies['alum'] === 1 && left.remedies['sulph'] === 2, 'left: ضم 9 ادویات (Ail.…+Alum.)');
assert.ok(findNode(tree, 'PAIN, toothache in general, stitching, stinging, left, upper and lower, worse lying down, compelling him to walk, better from external pressure'), 'left > upper-and-lower ذیلی (Ail.)');
// pressure (ص 438): 13 ادویہ — o60908 عین-فارم (r287 aggregate واپس)
const pr = findNode(tree, 'PAIN, toothache in general, pressure');
assert.ok(pr && Object.keys(pr.remedies).length === 13 && pr.rid === 'o60908', 'pressure: 13 ادویہ، o60908');
// menses خاندان (ص 437): before/during/after — دستی جوڑے
assert.ok(findNode(tree, 'PAIN, toothache in general, before') && findNode(tree, 'PAIN, toothache in general, before, during, menorrhagia'), 'menses-خاندان: before/during/menorrhagia');
// مینوں کا انتخاب: CARIES 87، GRINDING 48، ELONGATION 82، LOOSENESS 76، SENSITIVE 40
assert.ok(Object.keys(tree.children['CARIES, decayed, hollow'].remedies).length === 87, 'CARIES: 87 ادویہ');
assert.ok(Object.keys(tree.children['GRINDING'].remedies).length === 48, 'GRINDING: 48 ادویہ');
assert.ok(Object.keys(tree.children['ELONGATION, sensation of'].remedies).length === 82, 'ELONGATION: 82 ادویہ');
// اختتام (ص 447): WISDOM 4 ادویہ + YELLOW خالی کراس-ریفرنس
const wis = findNode(tree, 'WISDOM teeth, ailments from eruption of');
assert.ok(wis && Object.keys(wis.remedies).length === 4, 'WISDOM: 4 ادویہ (باب کا اختتامی مین)');
const yel = tree.children['YELLOW (See Discoloration)'];
assert.ok(yel && Object.keys(yel.remedies).length === 0, 'YELLOW: خالی کراس-ریفرنس (آخری قطار)');
assert.ok(!findNode(tree, 'THROAT') && !findNode(tree, 'Internal throat'), 'THROAT باب کٹ (P448 حد)');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «دانت — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('دانت — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «دانت — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto) && ur.meta.auto.length === 3, 'meta.auto فہرست (3 کراس-ریفرنس سرخیاں)');

// 6) مانی فیسٹ + تصدیق-ضروری CSV
assert.strictEqual(manifest.source_rows, 767);
assert.strictEqual(manifest.matched_app_records, 763);
assert.strictEqual(manifest.new_source_records, 4);
assert.strictEqual(manifest.legacy_local_records, 98);
const csvPath = path.join(ROOT, '..', 'download', 'kent-confirmation-needed.csv');
if (fs.existsSync(csvPath)) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  assert.ok(csv.indexOf('دانت (TEETH)') !== -1, 'تصدیق-ضروری CSV میں دانت کے اندراجات (ڈیلیوری ماحول میں)');
}

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=182/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v175)');
assert(/CACHE_NAME='bhc-clinic-v182'/.test(swf), 'خدمت کار نسخہ 176');
assert(/v175: دانت باب/.test(code), 'rep-chapters.js میں دانت بلڈر درج');

console.log('دنت باب: ماخذی درخت 767 قطاریں (صفحات 430 نصف – 447)، جڑ TEETH، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
