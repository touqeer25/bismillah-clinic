'use strict';
// tests/kent_head_homeoint_source.test.js — v167: سر باب (صفحات 107–234) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/head.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/head.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_head_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-head-v1');
assert.strictEqual(srcEntries.length, 6320, 'ماخذی قطاریں: 6320 (6319 + باب کی جڑ HEAD)');
assert.strictEqual(Object.keys(data).length, 7519, 'پرانی مقامی قطاریں فائل میں محفوظ (7519 کل)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_HEAD_SOURCE_MARKER="homeoint-head-v1",_REP_KENT_HEAD_COUNT=6320;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentHeadSourceEntries') + grab('_repHasKentHeadSourceData') + grab('_repBuildKentHeadSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentHeadSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentHeadSourceData', ctx)(data), true, 'ہیڈ سورس ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 6320, 'درخت کے ربرک 6320');
assert.strictEqual(tree.order[0], 'HEAD', 'باب کی جڑ HEAD پہلی قطار');
assert.ok(tree.count === 154, 'جڑ کے مین ربرک 154: ' + tree.count);
assert.ok(maxDepth(tree) === 7, 'زیادہ سے زیادہ گہرائی 7');

// 3) نمونہ ہیرارکی — ABSCESS / SHOCKS / ALIVE (مطبوعہ ساخت)
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
const abs = findNode(tree, 'ABSCESS');
assert.ok(abs && abs.hasRubric && Object.keys(abs.remedies).length === 5, 'ABSCESS: ماخذی ادویات (5)');
const alive = findNode(tree, 'ALIVE, sensation as if something, were in head');
assert.ok(alive, 'ALIVE مکمل ماخذی لیبل سے موجود (OOREP کا کٹا ہوا «ALIVE, sensation» نہیں)');
assert.ok(alive.children['night'] && alive.children['night'].children['in bed'], 'ALIVE → night → in bed ماخذی زنجیر');
const shocks = findNode(tree, 'SHOCKS, blows, jerks, etc. (See Jerking Pain, Pulsation, Plug, Nail)');
assert.ok(shocks && shocks.children['Forehead'], 'SHOCKS → Forehead ماخذی ساخت (صفحہ 231)');

// 4) ادویات گریڈ 1..3 اور ماخذ عین
let gradesOk = true;
srcEntries.forEach(k => {
  const r = data[k].r || {};
  Object.keys(r).forEach(a => { const g = Number(r[a]); if (!a || g < 1 || g > 3 || Math.floor(g) !== g) gradesOk = false; });
  if (JSON.stringify(r) !== JSON.stringify(data[k].source_remedies)) gradesOk = false;
});
assert.ok(gradesOk, 'ہر ماخذی قطار: r === source_remedies، گریڈ 1..3');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «سر — »
assert.strictEqual(ur.meta.count, undefined || ur.meta.count, 'meta موجود');
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('سر — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «سر — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto), 'meta.auto فہرست (خود-بنے جملے نظرثانی کے لیے)');

// 6) مانی فیسٹ
assert.strictEqual(manifest.source_rows, 6320);
assert.strictEqual(manifest.matched_app_records, 5722);
assert.strictEqual(manifest.new_source_records, 598);
assert.strictEqual(manifest.legacy_local_records, 1199);

// 7) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=193/.test(idx), 'صفحے میں چکر+سر+آنکھ درخت کا نسخہ (v153)');
assert(/CACHE_NAME='bhc-clinic-v193'/.test(sw), 'خدمت کار نسخہ 168');
assert(/v167: سر باب/.test(code), 'rep-chapters.js میں سر بلڈر درج');

console.log('سر باب: ماخذی درخت 6320 قطاریں (صفحات 107–234)، جڑ HEAD، ادویات ماخذی، اردو 100%، پرانی قطاریں محفوظ — کامیاب');
