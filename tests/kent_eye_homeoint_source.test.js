'use strict';
// tests/kent_eye_homeoint_source.test.js — v170: کان باب (صفحات 235–270) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/eye.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/eye.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_eye_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-eye-v1');
assert.strictEqual(srcEntries.length, 1694, 'ماخذی قطاریں: 1694 (1693 + باب کی جڑ EYE)');
assert.strictEqual(Object.keys(data).length, 1856, 'پرانی مقامی قطاریں فائل میں محفوظ (1856 کل)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_EYE_SOURCE_MARKER="homeoint-eye-v1",_REP_KENT_EYE_COUNT=1694;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentEyeSourceEntries') + grab('_repHasKentEyeSourceData') + grab('_repBuildKentEyeSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentEyeSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentEyeSourceData', ctx)(data), true, 'آئی سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 1694, 'درخت کے ربرک 1694');
assert.strictEqual(tree.order[0], 'EYE', 'باب کی جڑ EYE پہلی قطار');
assert.ok(tree.count === 184, 'جڑ کے مین ربرک 184: ' + tree.count);
assert.ok(maxDepth(tree) === 6, 'زیادہ سے زیادہ گہرائی 6');
// تمام صفحات 235–270 پر موجود
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 235 || p > 270) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 36, '36 صفحات (235–270) مکمل: ' + pages.size);

// 3) نمونہ ہیرارکی — AGGLUTINATED / DRYNESS / SPOTS (مطبوعہ ساخت)
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
const aggl = findNode(tree, 'AGGLUTINATED');
assert.ok(aggl && aggl.hasRubric && Object.keys(aggl.remedies).length === 65, 'AGGLUTINATED: ماخذی ادویات (65)');
assert.ok(aggl.children['morning'] && aggl.children['evening'], 'AGGLUTINATED → morning/evening ماخذی زنجیر');
// مستند درستی: ص 238 دوسرا «evening : Nat-m.» = canthi کی ذیلی (مطبوعہ کتاب + OOREP o30465)
const canthiEv = findNode(tree, 'DRYNESS, canthi, evening');
assert.ok(canthiEv && canthiEv.hasRubric && canthiEv.remedies['nat-m'] === 1, 'DRYNESS, canthi, evening: درستی شدہ ماخذی زنجیر (nat-m)');
assert.ok(!findNode(tree, 'DRYNESS, evening').children['evening'], 'DRYNESS, evening کے نیچے دوسرا evening نہیں (دوہرا راستہ نہیں)');
const spots = findNode(tree, 'SPOTS specks, etc., on the cornea');
assert.ok(spots && Object.keys(spots.remedies).length === 41, 'SPOTS specks, etc., on the cornea: ماخذی لیبل + 41 ادویات');
const pain = findNode(tree, 'PAIN');
assert.ok(pain && pain.children['aching'] && pain.children['burning, smarting, biting'], 'PAIN → aching / burning, smarting, biting ماخذی ساخت');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «آنکھ — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('آنکھ — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «آنکھ — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto), 'meta.auto فہرست (خود-بنے جملے نظرثانی کے لیے)');

// 6) مانی فیسٹ
assert.strictEqual(manifest.source_rows, 1694);
assert.strictEqual(manifest.matched_app_records, 1642);
assert.strictEqual(manifest.new_source_records, 52);
assert.strictEqual(manifest.legacy_local_records, 162);

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=180/.test(idx), 'صفحے میں چکر+سر+آنکھ درخت کا نسخہ (v153)');
assert(/CACHE_NAME='bhc-clinic-v180'/.test(sw), 'خدمت کار نسخہ 168');
assert(/v170: کان باب/.test(code), 'rep-chapters.js میں آنکھ بلڈر درج');

console.log('آنکھ باب: ماخذی درخت 1694 قطاریں (صفحات 235–270)، جڑ EYE، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
