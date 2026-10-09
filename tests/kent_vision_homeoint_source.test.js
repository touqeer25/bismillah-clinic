'use strict';
// tests/kent_vision_homeoint_source.test.js — v170: وژن باب (صفحات 271–285) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/vision.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/vision.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_vision_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-vision-v1');
assert.strictEqual(srcEntries.length, 827, 'ماخذی قطاریں: 827 (826 + باب کی جڑ VISION)');
assert.strictEqual(Object.keys(data).length, 901, 'پرانی مقامی قطاریں فائل میں محفوظ (901 کل)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_VISION_SOURCE_MARKER="homeoint-vision-v1",_REP_KENT_VISION_COUNT=827;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentVisionSourceEntries') + grab('_repHasKentVisionSourceData') + grab('_repBuildKentVisionSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentVisionSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentVisionSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 827, 'درخت کے ربرک 827');
assert.strictEqual(tree.order[0], 'VISION', 'باب کی جڑ VISION پہلی قطار');
assert.ok(tree.count === 91, 'جڑ کے مین ربرک 91: ' + tree.count);
assert.ok(maxDepth(tree) === 5, 'زیادہ سے زیادہ گہرائی 5');
// تمام صفحات 271–285 پر موجود
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 271 || p > 285) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 15, '15 صفحات (271–285) مکمل: ' + pages.size);

// 3) نمونہ ہیرارکی — مستند درستیاں اور ماخذی ساخت
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// مستند درستی: ص 281 «noon : Dig.» سے <dir> چوک = LIGHTNINGS کی ذیلی (مطبوعہ کتاب + OOREP o64045)
const noon = findNode(tree, 'LIGHTNINGS, noon');
assert.ok(noon && noon.hasRubric && noon.remedies['dig'] === 1, 'LIGHTNINGS, noon: درستی شدہ ماخذی زنجیر (dig)');
assert.ok(findNode(tree, 'LIGHTNINGS, night, distant, sheet lightning in dark, 11 p.m.'), 'LIGHTNINGS کی وقت-خاندان ایک سطح پر');
// مستند درستی: ص 283 <dir><dir> دوہرا — RUN together, letters کے وقت-ذیلی (OOREP r726/r727/r728)
const run = findNode(tree, 'RUN together, letters');
assert.ok(run && Object.keys(run.remedies).length === 37, 'RUN together, letters: ماخذی ادویات (37)');
assert.ok(run.children['morning'] && run.children['evening'] && run.children['writing, while'], 'RUN together, letters → morning/evening/writing بھائی (d1)');
const read = findNode(tree, 'RUN together, letters, evening, reading in bed, while');
assert.ok(read && read.hasRubric && read.remedies['bell'] === 1, 'RUN together, letters, evening, reading in bed, while: ذیلی (bell)');
assert.ok(!run.children['evening'].children['morning'], 'evening کے نیچے morning نہیں (دوہرا راستہ نہیں)');
// exertion خاندان — MEDI-T کی مٹی ہوئی لائن کی مطابق ساخت
assert.ok(findNode(tree, 'DIM, exertion of eyes, after, on fine work'), 'DIM, exertion of eyes, after, on fine work: ماخذی زنجیر');
assert.ok(findNode(tree, 'DIM, exertion of eyes, after, body'), 'DIM, exertion of eyes, after, body: ماخذی زنجیر');
const acc = findNode(tree, 'ACCOMMODATION defective');
assert.ok(acc && Object.keys(acc.remedies).length === 11 && acc.children['action too great'] && acc.children['diminished'], 'ACCOMMODATION defective: 11 ادویات + ماخذی ذیلی');
assert.ok(findNode(tree, 'WEAK (See Eyes, weak), bring light agg.'), 'WEAK, bring light agg.: نئی بحال شدہ قطار (bell, sol-n)');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «نظر — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('نظر — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «نظر — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto), 'meta.auto فہرست (خود-بنے جملے نظرثانی کے لیے)');

// 6) مانی فیسٹ
assert.strictEqual(manifest.source_rows, 827);
assert.strictEqual(manifest.matched_app_records, 811);
assert.strictEqual(manifest.new_source_records, 16);
assert.strictEqual(manifest.legacy_local_records, 74);

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=178/.test(idx), 'صفحے میں چکر+سر+آنکھ+وژن درخت کا نسخہ (v153)');
assert(/CACHE_NAME='bhc-clinic-v178'/.test(sw), 'خدمت کار نسخہ 169');
assert(/v169: وژن باب/.test(code), 'rep-chapters.js میں وژن بلڈر درج');

console.log('وژن باب: ماخذی درخت 827 قطاریں (صفحات 271–285)، جڑ VISION، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
