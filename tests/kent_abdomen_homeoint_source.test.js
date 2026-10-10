'use strict';
// tests/kent_abdomen_homeoint_source.test.js — v179: شکم باب (صفحات 541–605) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/abdomen.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/abdomen.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_abdomen_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-abdomen-v1');
assert.strictEqual(srcEntries.length, 3269, 'ماخذی قطاریں: 3269 (3268 + باب کی جڑ ABDOMEN)');
assert.strictEqual(Object.keys(data).length, 3725, 'پرانی مقامی قطاریں فائل میں محفوظ (3725 کل = 3269 + 456)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_ABDOMEN_SOURCE_MARKER="homeoint-abdomen-v1",_REP_KENT_ABDOMEN_COUNT=3269;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentAbdomenSourceEntries') + grab('_repHasKentAbdomenSourceData') + grab('_repBuildKentAbdomenSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentAbdomenSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentAbdomenSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 3269, 'درخت کے ربرک 3269');
assert.strictEqual(tree.order[0], 'ABDOMEN', 'باب کی جڑ ABDOMEN پہلی قطار');
assert.ok(tree.count === 136, 'جڑ کے بچے 136 (جڑ قطار + 135 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 6, 'زیادہ سے زیادہ گہرائی 6');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 541 || p > 605) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 65, '65 صفحات (541–605) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + مستند درستیاں
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (ص 541): ABSCESS in walls 4 ادویہ
const abs = tree.children['ABSCESS in walls'];
assert.ok(abs && abs.rid === 'o1' && Object.keys(abs.remedies).length === 4 && abs.remedies['hep'] === 2 && abs.remedies['sulph'] === 1, 'ABSCESS in walls: 4 ادویہ، o1 (کتاب ص 541)');
const liv = findNode(tree, 'ABSCESS in walls, Liver');
assert.ok(liv && Object.keys(liv.remedies).length === 9, 'ABSCESS in walls, Liver: 9 ادویہ (ص 541)');
// ص 546: دستی جوڑا o213 — ہجے-تبدیلی ileo→کتابی Ilio-cæcal
const dist = findNode(tree, 'DISTENSION, Ilio-cæcal region');
assert.ok(dist && dist.rid === 'o213' && Object.keys(dist.remedies).length === 3 && dist.remedies['colch'] === 2, 'DISTENSION, Ilio-cæcal region: o213 (کتابی ہجے، ص 546)');
// ص 554: ŒDEMA (See Dropsy) — نئی h015 قطار، بے-ادویات See-ref
const oed = findNode(tree, 'ŒDEMA (See Dropsy)');
assert.ok(oed && oed.rid === 'h015' && Object.keys(oed.remedies).length === 0, 'ŒDEMA (See Dropsy): h015، 0 ادویہ (ص 554 — PDF تصدیق: حقیقی œdema ص546 پر)');
// ص 565: r1161 ↔ کتابی «PAIN, aching…(See…), Ilio-cæcal region» 22 ادویہ (raw-key + دستی ہم آہنگی)
const ilio = findNode(tree, 'PAIN, aching, dull pain (See Boring, Drawing, Distress, Digging, Gnawing, Pressing, etc.), Ilio-cæcal region');
assert.ok(ilio && ilio.rid === 'r1161' && Object.keys(ilio.remedies).length === 22, 'Ilio-cæcal region PAIN: r1161، 22 ادویہ (ص 565)');
// ص 602/603/604: TENSION دستی «agg.» جوڑے — کتابی لیبل (بغیر agg.)
const ts = findNode(tree, 'TENSION, stool, during');
assert.ok(ts && ts.rid === 'o3183' && Object.keys(ts.remedies).length === 2, 'TENSION, stool, during: o3183 (agg.-لاحقہ واپس کتابی فارم)');
const tw2 = findNode(tree, 'TENSION, walking, while');
assert.ok(tw2 && tw2.rid === 'o3190', 'TENSION, walking, while: o3190 (ص 603)');
const tiw = findNode(tree, 'TENSION, Inguinal region, walking, while');
assert.ok(tiw && tiw.rid === 'o3171' && Object.keys(tiw.remedies).length === 6, 'TENSION, Inguinal region, walking, while: o3171، 6 ادویہ (ص 604)');
// ص 602: RUMBLING Ilio-cæcal (o3015)
const rum = findNode(tree, 'RUMBLING, Ilio-cæcal region');
assert.ok(rum && rum.rid === 'o3015', 'RUMBLING, Ilio-cæcal region: o3015 (ص 602)');
// اختتام (ص 605): TUMORS — Con. (آخری مین) + TWITCHING and jerking 30
const tur = tree.children['TUMORS'];
assert.ok(tur && tur.rid === 'r3241' && tur.remedies['con'] === 2, 'TUMORS: آخری مین، Con. (ص 605)');
const twj = findNode(tree, 'TWITCHING and jerking');
assert.ok(twj && Object.keys(twj.remedies).length === 30 && twj.remedies['agar'] === 3 && twj.remedies['bry'] === 2, 'TWITCHING and jerking: 30 ادویہ، Agar. 3 (ص 605)');
// legacy پرانیاں — نمائندے (OOREP aggregates + مبہم)
['m259', 'm2919', 'r2679', 'o64310', 'r676', 'o1446', 'o64550', 'o2262'].forEach(k => {
  assert.ok(data[k] && !data[k].source_canonical, k + ' پرانیوں میں محفوظ (OOREP aggregate/مبہم)');
});
assert.ok(!findNode(tree, 'RECTUM') && !findNode(tree, 'RECTUM, ABSCESS'), 'RECTUM باب کٹ (P606 حد)');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «پیٹ — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('پیٹ — ') !== 0 && String(v).indexOf('پیٹ، ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «پیٹ — » سے شروع');
assert.strictEqual(ur.rubrics['abdomen'], 'پیٹ — پیٹ', 'جڑ ABDOMEN کا جملہ');

// 6) مانی فیسٹ + تصدیق-ضروری CSV
assert.strictEqual(manifest.source_rows, 3269);
assert.strictEqual(manifest.matched_app_records, 3136);
assert.strictEqual(manifest.new_source_records, 133);
assert.strictEqual(manifest.legacy_local_records, 456);
const csvPath = path.join(ROOT, '..', 'download', 'kent-confirmation-needed.csv');
if (fs.existsSync(csvPath)) {
  const csv = fs.readFileSync(csvPath, 'utf8');
  assert.ok(csv.indexOf('شکم (ABDOMEN)') !== -1, 'تصدیق-ضروری CSV میں شکم کے اندراجات (ڈیلیوری ماحول میں)');
}

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=194/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v179)');
assert(/CACHE_NAME='bhc-clinic-v194'/.test(swf), 'خدمت کار نسخہ 179');
assert(/v179: شکم باب/.test(code), 'rep-chapters.js میں شکم بلڈر درج');

console.log('شکم باب: ماخذی درخت 3269 قطاریں (صفحات 541–605)، جڑ ABDOMEN، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
