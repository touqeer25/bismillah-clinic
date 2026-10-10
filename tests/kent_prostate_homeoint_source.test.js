'use strict';
// tests/kent_prostate_homeoint_source.test.js — v184: پروسٹیٹ غدود باب (صفحات 667–668) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/prostate_gland.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/prostate_gland.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_prostate_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-prostate-v1');
assert.strictEqual(srcEntries.length, 92, 'ماخذی قطاریں: 92 (جڑ PROSTATE GLAND + 91) — صفر دہرائی، صفر clamp');
assert.strictEqual(Object.keys(data).length, 102, 'پرانی مقامی قطاریں فائل میں محفوظ (102 کل = 92 + 10)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_PROSTATE_SOURCE_MARKER="homeoint-prostate-v1",_REP_KENT_PROSTATE_COUNT=92;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentProstateSourceEntries') + grab('_repHasKentProstateSourceData') + grab('_repBuildKentProstateSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentProstateSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentProstateSourceData', ctx)(data), true, 'ماخذی ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 92, 'درخت کے ربرک 92');
assert.strictEqual(tree.order[0], 'PROSTATE GLAND', 'باب کی جڑ PROSTATE GLAND پہلی قطار');
assert.ok(tree.count === 22, 'جڑ کے بچے 22 (جڑ قطار + 21 مین ربرکس): ' + tree.count);
assert.ok(maxDepth(tree) === 4, 'زیادہ سے زیادہ گہرائی 4 (PAIN → pressing → urination, during → after): ' + maxDepth(tree));
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 667 || p > 668) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 2, '2 صفحات (667–668، MEDI-T انتساب) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (p667): BALL, sensation of sitting on a پہلا مین
const ball = tree.children['BALL, sensation of sitting on a'];
assert.ok(ball && Object.keys(ball.remedies).length === 4 && ball.remedies['sep'] === 3, 'BALL: 4 ادویہ (Cann-i., chim., Sep. 3, sil. — p667)');
// بڑا مین: EMISSION prostatic fluid 47 (Ph-ac./Sel./Sep./Staph. 3)
const em = tree.children['EMISSION prostatic fluid'];
assert.ok(em && Object.keys(em.remedies).length === 47 && em.remedies['ph-ac'] === 3 && em.remedies['sel'] === 3, 'EMISSION prostatic fluid: 47 ادویہ (p667)');
// erections, during (3) → without (11) — کتابی d2 ساخت (OOREP برتن 14 legacy میں)
const erec = findNode(tree, 'EMISSION prostatic fluid, erections, during');
assert.ok(erec && Object.keys(erec.remedies).length === 3 && erec.remedies['ph-ac'] === 3, 'erections, during: 3 ادویہ');
const wout = findNode(tree, 'EMISSION prostatic fluid, erections, during, without');
assert.ok(wout && Object.keys(wout.remedies).length === 11 && wout.remedies['sel'] === 3, 'erections, during → without: 11 ادویہ (کتابی d2 — OOREP مجموعہ 14 legacy o67900)');
// stool, with (32) → difficult, with (20) + after (17)
const stool = findNode(tree, 'EMISSION prostatic fluid, stool, with');
assert.ok(stool && Object.keys(stool.remedies).length === 32 && stool.remedies['con'] === 3, 'stool, with: 32 ادویہ');
const diff = findNode(tree, 'EMISSION prostatic fluid, stool, with, difficult, with');
assert.ok(diff && Object.keys(diff.remedies).length === 20 && diff.remedies['sil'] === 3, 'stool, with → difficult: 20 ادویہ (d2)');
const after = findNode(tree, 'EMISSION prostatic fluid, stool, with, after');
assert.ok(after && Object.keys(after.remedies).length === 17, 'stool, with → after: 17 ادویہ (OOREP برتن 39 legacy o67901)');
// INFLAMMATION 45 — p668 مارکر skip کے بعد اصل قطار (OOREP مجموعہ 47 سے کتابی عین)
const infl = tree.children['INFLAMMATION'];
assert.ok(infl && Object.keys(infl.remedies).length === 45 && infl.remedies['apis'] === 3 && infl.remedies['chim'] === 3, 'INFLAMMATION: 45 ادویہ (p668 — OOREP مجموعہ 47 سے کتابی عین، 2 اضافی legacy r0 کو متعلق اصل)');
// PAIN 39 — OOREP مجموعہ 57 سے کتابی عین
assert.ok(tree.children['PAIN'] && Object.keys(tree.children['PAIN'].remedies).length === 39, 'PAIN main: 39 ادویہ (OOREP مجموعہ 57 سے کتابی عین)');
// HEAVINESS: 8 ادویہ — گریڈ درستی graphites 2→1 (کتابی سچ)
const heav = tree.children['HEAVINESS'];
assert.ok(heav && Object.keys(heav.remedies).length === 8 && heav.remedies['graph'] === 1, 'HEAVINESS: 8 ادویہ (graphites گریڈ 1 — کتابی درستی)');
// گہری d3 قطار: PAIN → pressing → urination, during → after
const deep = findNode(tree, 'PAIN, pressing, urination, during, after');
assert.ok(deep, 'گہری d3 قطار: PAIN, pressing, urination, during, after');
// گریڈ درستی: PAIN, pressing میں Puls. 3→2
const press = findNode(tree, 'PAIN, pressing');
assert.ok(press && press.remedies['puls'] === 2, 'PAIN, pressing: Puls. گریڈ 2 (کتابی درستی 3→2)');
// اختتام (p668): UNEASINESS آخری (1 ادویہ Ptel.)
const last = tree.order[tree.order.length - 1];
assert.ok(last === 'UNEASINESS' && Object.keys(tree.children['UNEASINESS'].remedies).length === 1 && tree.children['UNEASINESS'].remedies['ptel'] === 1, 'UNEASINESS آخری مین: 1 ادویہ Ptel. (p668 — URETHRA مارکر سے پہلے)');
// ONANISM / QUIVERING — مکمل قطاریں
assert.ok(tree.children['ONANISM, complaints after'] && tree.children['ONANISM, complaints after'].remedies['tarent'] === 1, 'ONANISM, complaints after: Tarent. (p668)');
assert.ok(tree.children['QUIVERING, nervous'] && tree.children['QUIVERING, nervous'].remedies['form'] === 1, 'QUIVERING, nervous: Form. (p668)');

// 4) اردو فائل کی ساخت
assert.ok(Array.isArray(ur.locked) && ur.locked.length === 0, 'کوئی قفل نہیں');
assert.strictEqual(Object.keys(ur.rubrics).length, 92, 'اردو فائل میں 92 فعال کلیدیں');

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «پروسٹیٹ غدود — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('پروسٹیٹ غدود — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «پروسٹیٹ غدود — » سے شروع');
assert.ok(!ur.meta.auto || (Array.isArray(ur.meta.auto) && ur.meta.auto.length === 0), 'صفر لغت سے خود-بنے (تمام پرانی منظور شدہ جملوں سے)');
// EMISSION خاندان ہم آہنگ: والد «پروسٹیٹ سیال کا اخراج»، بچے بھی اسی سے
assert.ok(ur.rubrics['emission prostatic fluid'].indexOf('پروسٹیٹ سیال کا اخراج') > 0, 'والد: پروسٹیٹ سیال کا اخراج');
assert.ok(ur.rubrics['emission prostatic fluid, dribbling'].indexOf('پروسٹیٹ سیال کا اخراج') > 0, 'بچہ بھی والد کے جملے سے (19 ہم آہنگ شدہ)');

// 6) مانی فیسٹ
assert.strictEqual(manifest.source_rows, 92);
assert.strictEqual(manifest.matched_app_records, 91);
assert.strictEqual(manifest.new_source_records, 1);
assert.strictEqual(manifest.legacy_local_records, 10);
assert.strictEqual(manifest.ambiguous_app_records, 1);

// 7) _index.json
const idxData = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/_index.json'), 'utf8'));
const pg = idxData.find(c => c.key === 'prostate_gland');
assert.ok(pg && pg.rubrics === 102, '_index.json: prostate_gland 102');

// 8) نسخہ جاتی نشان
const idx = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const swf = fs.readFileSync(path.join(ROOT, 'service-worker.js'), 'utf8');
assert(/rep-chapters\.js\?v=191/.test(idx), 'صفحے میں مکمل ماخذی درخت سلسلے کا نسخہ (v184)');
assert(/CACHE_NAME='bhc-clinic-v191'/.test(swf), 'خدمت کار نسخہ 184');
assert(/v184: پروسٹیٹ غدود باب/.test(code), 'rep-chapters.js میں پروسٹیٹ بلڈر درج');

console.log('kent_prostate_homeoint_source.test.js — تمام تصدیقیں پاس (92 ماخذی قطاریں، 102 کل، اردو 100%)');
