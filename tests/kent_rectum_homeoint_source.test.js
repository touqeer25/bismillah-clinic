'use strict';
// tests/kent_rectum_homeoint_source.test.js — v180: مستقیم باب (صفحات 606–635) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/rectum.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/rectum.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_rectum_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-rectum-v1');
assert.strictEqual(srcEntries.length, 1200, 'ماخذی قطاریں: 1200 (1199 + باب کی جڑ RECTUM)');
assert.strictEqual(Object.keys(data).length, 1369, 'پرانی مقامی قطاریں فائل میں محفوظ (1369 کل = 1200 + 169)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_RECTUM_SOURCE_MARKER="homeoint-rectum-v1",_REP_KENT_RECTUM_COUNT=1200;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentRectumSourceEntries') + grab('_repHasKentRectumSourceData') + grab('_repBuildKentRectumSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentRectumSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentRectumSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 1200, 'درخت کے ربرک 1200');
assert.strictEqual(tree.order[0], 'RECTUM', 'باب کی جڑ RECTUM پہلی قطار');
assert.ok(tree.count === 84, 'جڑ کے بچے 84 (جڑ قطار + 83 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 5, 'زیادہ سے زیادہ گہرائی 5');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 606 || p > 635) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 30, '30 صفحات (606–635) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد درستی
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (ص 606): ABSCESS 7 ادویہ (r0)
const abs = tree.children['ABSCESS'];
assert.ok(abs && abs.rid === 'r0' && Object.keys(abs.remedies).length === 7 && abs.remedies['calc-s'] === 2 && abs.remedies['thuj'] === 1, 'ABSCESS: 7 ادویہ، r0 (کتاب ص 606)');
const aph = tree.children['APHTHOUS condition of anus'];
assert.ok(aph && aph.rid === 'r3' && Object.keys(aph.remedies).length === 10 && aph.remedies['sul-ac'] === 3, 'APHTHOUS condition of anus: 10 ادویہ، Sul-ac. 3 (ص 606)');
// ص 619: HÆMORRHAGE from anus 112 ادویہ (کتابی Æ لگیچر)
const hae = findNode(tree, 'HÆMORRHAGE from anus');
assert.ok(hae && hae.rid === 'r535' && Object.keys(hae.remedies).length === 112 && hae.remedies['mill'] === 2, 'HÆMORRHAGE from anus: r535، 112 ادویہ (ص 619)');
// خاندانی clamps — ص616 blotches، ص618 evening، ص632 black
const blo = findNode(tree, 'ERUPTION about anus, blotches');
assert.ok(blo, 'ERUPTION about anus, blotches: clamp ص616 کے بعد درست والد');
const eve = findNode(tree, 'FORMICATION in anus, evening');
assert.ok(eve, 'FORMICATION in anus, evening: clamp ص618 کے بعد درست والد');
// اختتام (ص 634/635): WORM گروپ آخری مین — tæniæ آخری قطار
const wor = tree.children['WORM, sensation of (See Crawling)'];
assert.ok(wor && wor.rid === 'r1201' && Object.keys(wor.remedies).length === 0, 'WORM, sensation of (See Crawling): آخری مین، بے-ادویہ (ص 634)');
const com = findNode(tree, 'WORM, sensation of (See Crawling), complaints');
assert.ok(com && Object.keys(com.remedies).length === 32 && com.remedies['cina'] === 3, 'WORM complaints: 32 ادویہ، Cina 3 (ص 634)');
const tae = findNode(tree, 'WORM, sensation of (See Crawling), tæniæ');
assert.ok(tae && tae.rid === 'r1206' && Object.keys(tae.remedies).length === 29 && tae.remedies['calc'] === 3, 'WORM tæniæ: آخری قطار r1206، 29 ادویہ، Calc. 3 (ص 635)');
// باب-حد: STOOL کا پہلا صفحہ (13 قطاریں) درخت میں نہیں
assert.ok(!findNode(tree, 'ACRID, corrosive, excoriating') && !findNode(tree, 'BLOODY') && !findNode(tree, 'BILIOUS') && !findNode(tree, 'BLACK, fecal'), 'STOOL باب کی 13 قطاریں کٹ (باب-حد worm/tæniæ — PDF+انڈیکس+STOOL باب ثبوت)');
// legacy پرانیاں — نمائندے (OOREP aggregates + مبہم + m-کنٹینرز)
['o67959', 'o67921', 'm53424', 'm54505', 'o67988', 'o68016', 'o67963'].forEach(k => {
  assert.ok(data[k] && !data[k].source_canonical, k + ' پرانیوں میں محفوظ (OOREP aggregate/مبہم)');
});

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «مقعد — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('مقعد — ') !== 0 && String(v).indexOf('مقعد، ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «مقعد — » سے شروع');
assert.strictEqual(ur.rubrics['rectum'], 'مقعد — مقعد', 'جڑ RECTUM کا جملہ');

// 6) مانی فیسٹ + تصدیق-ضروری CSV
assert.strictEqual(manifest.source_rows, 1200);
assert.strictEqual(manifest.matched_app_records, 1163);
assert.strictEqual(manifest.new_source_records, 37);
assert.strictEqual(manifest.legacy_local_records, 169);
const csvPath = path.join(ROOT, '..', 'download', 'kent-confirmation-needed.csv');
if (fs.existsSync(csvPath)) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  assert.ok(csv.indexOf('مستقیم (RECTUM)') !== -1, 'تصدیق-ضروری CSV میں مستقیم کے اندراجات (ڈیلیوری ماحول میں)');
}

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=186/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v180)');
assert(/CACHE_NAME='bhc-clinic-v186'/.test(swf), 'خدمت کار نسخہ 180');
assert(/v180: مستقیم باب/.test(code), 'rep-chapters.js میں مستقیم بلڈر درج');

console.log('مستقیم باب: ماخذی درخت 1200 قطاریں (صفحات 606–635)، جڑ RECTUM، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ، STOOL-حد کٹ — کامیاب');
