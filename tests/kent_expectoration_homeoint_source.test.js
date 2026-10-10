'use strict';
// tests/kent_expectoration_homeoint_source.test.js — v192: بلغم باب (صفحات 812–821) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/expectoration.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/expectoration.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_expectoration_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-expectoration-v1');
assert.strictEqual(srcEntries.length, 340, 'ماخذی قطاریں: 340 (جڑ EXPECTORATION + 339) — صفر clamps، کوئی کتابی دہرائی نہیں');
assert.strictEqual(Object.keys(data).length, 380, 'پرانی مقامی قطاریں فائل میں محفوظ (380 کل = 340 + 40)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_EXPECTORATION_SOURCE_MARKER="homeoint-expectoration-v1",_REP_KENT_EXPECTORATION_COUNT=340;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentExpectorationSourceEntries') + grab('_repHasKentExpectorationSourceData') + grab('_repBuildKentExpectorationSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentExpectorationSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentExpectorationSourceData', ctx)(data), true, 'ماخذی ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
assert.strictEqual(count(tree), 340, 'درخت کے ربرک 340');
assert.strictEqual(tree.order[0], 'EXPECTORATION', 'باب کی جڑ EXPECTORATION پہلی قطار');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 812 || p > 821) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 10, '10 صفحات (812–821، MEDI-T انتساب) مکمل: ' + pages.size);
assert.strictEqual(tree.order[1], 'DAYTIME only', 'DAYTIME only پہلا مین (p812 — P812 nav-اینکر کے بعد)');

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (p812): جڑ + DAYTIME only {61} + MORNING {104} — nav-para اینکر (slot-1 nav + slot-2 سرخ EXPECTORATION) skip سے صاف آغاز
const dto = tree.children['DAYTIME only'];
assert.ok(dto && dto.remedies['ars'] === 3 && dto.remedies['cham'] === 3 && Object.keys(dto.remedies).length === 61, 'DAYTIME only: 61 ادویہ Ars./Cham.3 (p812 — جڑ کا پہلا مین)');
const mor = tree.children['MORNING'];
assert.ok(mor && Object.keys(mor.remedies).length === 104 && mor.remedies['bry'] === 3, 'MORNING: 104 ادویہ (p812 — ذیلیاں اسی صفحے پر، صفحہ-سرخی «EXPECTORATION» دہرائی آرٹیفیکٹ skip)');
// BLOODY خاندان: «spitting of blood (See Chest Hæmorrhage)» خود d0 مین کے لیبل کا حصہ (153 ادویہ)
const bld = tree.children['BLOODY, spitting of blood (See Chest Hæmorrhage)'];
assert.ok(bld && Object.keys(bld.remedies).length === 153 && bld.remedies['acon'] === 3, 'BLOODY, spitting of blood (See Chest Hæmorrhage): 153 ادویہ — d0 مین (p813، کتابی ٹائپوگرافی)');
const bldm = bld && bld.children['morning'];
assert.ok(bldm && Object.keys(bldm.remedies).length === 21, 'BLOODY…, morning: 21 ادویہ (d1 ذیلی)');
const bldmb = bldm && bldm.children['bed, in'];
assert.ok(bldmb && Object.keys(bldmb.remedies).length === 2, 'BLOODY…, morning, bed, in: 2 ادویہ (d2 — ساخت والد-بچہ چیک، صفر clamps کی جگہ)');
// TASTE of almonds, like — دوسرا بڑا مین
const tst = tree.children['TASTE of almonds, like'];
assert.ok(tst && Object.keys(tst.remedies).length === 2, 'TASTE of almonds, like: 2 ادویہ (p818 — مین، 48 ذیلیاں p818–819)');
const tstb = tst && tst.children['bitter'];
assert.ok(tstb && Object.keys(tstb.remedies).length === 32, 'TASTE of almonds, like, bitter: 32 ادویہ (d1)');
// COPIOUS
const cop = tree.children['COPIOUS'];
assert.ok(cop && Object.keys(cop.remedies).length === 96, 'COPIOUS: 96 ادویہ (p814)');

// 4) صفر clamps — گہرائی ماڈل d0/d1/d2 مکمل صاف (خاندانی shift = 0)
const depths = srcEntries.map(k => Number(data[k].source_depth));
const depthCounts = depths.reduce((a, d) => { a[d] = (a[d] || 0) + 1; return a; }, {});
assert.deepStrictEqual(depthCounts, { 0: 115, 1: 176, 2: 49 }, 'گہرائی分布 115/176/49 — صفر clamps (d0/d1/d2 صاف)');

// 5) دستی J=1.00 جوڑے (OOREP لیبل-فرق، ادویات عین) — وقت-فارمیٹ + ہائیفن-کیس
const m89 = findNode(tree, 'MORNING, 8 to 9 a.m.');
assert.ok(m89 && Object.keys(m89.remedies).length === 1 && m89.remedies['sil'] === 1, 'MORNING, 8 to 9 a.m.: Sil. (دستی o14730 — OOREP «8 a.m. to 9 a.m.» وقت-فارمیٹ، p812)');
const sc = findNode(tree, 'SLATE colored');
assert.ok(sc && Object.keys(sc.remedies).length === 2 && sc.remedies['kali-bi'] === 1, 'SLATE colored: 2 ادویہ (دستی o14795 — OOREP «SLATE-COLORED» ہائیفن-کیس، PDF کتابی SLATE colored کی تصدیق، p818)');
const yno = findNode(tree, 'YELLOW, afternoon, 12 to 3 p.m.');
assert.ok(yno && yno.remedies['calc-s'] === 1, 'YELLOW, afternoon, 12 to 3 p.m.: Calc-s. (دستی o14879 — OOREP «12 a.m. to 3 p.m.» وقت-فارمیٹ، p821)');

// 6) OOREP برتن legacy — کتابی مین سے الگ محفوظ (ادویات نقصان صفر)
const legacy = Object.keys(data).filter(k => !data[k].source_canonical);
assert.strictEqual(legacy.length, 40, 'legacy محفوظ: 40');
assert.ok(data['r76'] && Object.keys(data['r76'].r).length === 173 && !data['r76'].source_canonical, 'r76 BLOODY 173-یونین برتن legacy');
assert.ok(data['r268'] && Object.keys(data['r268'].r).length === 148 && !data['r268'].source_canonical, 'r268 TASTE 148-یونین برتن legacy');
assert.ok(data['o65421'] && Object.keys(data['o65421'].r).length === 79 && !data['o65421'].source_canonical, 'o65421 ODOR 79-یونین برتن legacy (مبہم)');
assert.ok(data['o65412'] && Object.keys(data['o65412'].r).length === 11 && !data['o65412'].source_canonical, 'o65412 AIR 11-یونین برتن legacy (مبہم)');
const emptyM = legacy.filter(k => Object.keys(data[k].r).length === 0);
assert.strictEqual(emptyM.length, 26, '26 خالی m-برتن legacy');

// 7) باب-اختتام (p821): YELLOW آخری مین — orange colored آخری ربرک
const oc = findNode(tree, 'YELLOW, orange colored');
assert.ok(oc && oc.remedies['kali-c'] === 2 && oc.remedies['phos'] === 1, 'YELLOW, orange colored: Kali-c.2/Phos. (p821 — باب کی آخری قطار، P822 CHEST اینکر سے پہلے)');
const srcList = srcEntries.map(k => data[k]);
const maxOrder = srcList.reduce((a, r) => (Number(r.source_order) > Number(a.source_order) ? r : a), srcList[0]);
assert.strictEqual(maxOrder.source_path, 'YELLOW, orange colored', 'source_order کی آخری قطار YELLOW, orange colored');

// 8) اگلا باب لیک نہیں — CHEST/COUGH کی جڑ/پہلا مین (path-کم صفیں) موجود نہ ہوں
const leak = srcList.filter(r => r.source_label === 'CHEST' || r.source_label === 'ABSCESS' || r.source_label === 'COUGH');
assert.strictEqual(leak.length, 0, 'CHEST/COUGH لیک نہیں (اختتامی کٹ P822 اینکر پر)');

// 9) See-ref مینز (بے-ادویات) اپنی جگہ — نئے hN جڑ سمیت
const alb = findNode(tree, 'ALBUMINOUS (See White)');
const cas = findNode(tree, 'CASTS (See Membrane)');
const cld = findNode(tree, 'COLD (See Cool)');
assert.ok(alb && Object.keys(alb.remedies).length === 0 && Number(alb.sourcePage) === 812, 'ALBUMINOUS (See White): بے-ادویات See-ref مین (p812)');
assert.ok(cas && Object.keys(cas.remedies).length === 0 && Number(cas.sourcePage) === 814, 'CASTS (See Membrane): بے-ادویات See-ref (p814)');
assert.ok(cld && Object.keys(cld.remedies).length === 0 && Number(cld.sourcePage) === 814, 'COLD (See Cool): بے-ادویات See-ref (p814)');

// 10) اردو — 340/340 مکمل، جڑ-پیشوند، نمونے
// runtime repRubKey (js/18-rubrics-ur.js) کی عین نقل — (See …) ہٹاتا ہے
function repRubKey(full) {
  let s = String(full || '').replace(/ \[\d+\]$/, '');
  s = s.replace(/\s*\(\s*see\b[^)]*\)/ig, '');
  s = s.replace(/\s+,/g, ',').replace(/,\s*,/g, ',');
  s = s.replace(/,\s*$/, '').replace(/^\s*,/, '');
  s = s.replace(/\s+/g, ' ');
  s = s.replace(/,(\S)/g, ', $1');
  return s.trim().toLowerCase();
}
const treeKeys = [];
(function walk(n) { for (const k of (n.order || [])) { treeKeys.push(n.children[k].pathTitle); walk(n.children[k]); } })(tree);
assert.strictEqual(treeKeys.length, 340, 'درخت کلیدیں 340');
const treeRK = treeKeys.map(repRubKey);
const missing = treeRK.filter(k => !ur.rubrics[k]);
assert.strictEqual(missing.length, 0, 'اردو جملے غائب نہیں: ' + missing.slice(0, 3).join(' | '));
assert.strictEqual(ur.rubrics['expectoration'], 'بلغم — بلغم', 'جڑ کا اردو «بلغم — بلغم»');
assert.ok(ur.rubrics['daytime only'] === 'بلغم — صرف دن کے وقت', 'DAYTIME only کا اردو (پرانا جملہ منتقل)');
assert.ok(ur.rubrics['bloody, spitting of blood, morning'] === 'بلغم — خون آلود، خون تھوکنے کے ساتھ، صبح', 'BLOODY راستہ-بڑھا: «خون تھوکنے کے ساتھ» درج (ہاتھ-اخذ — پرانے انداز سے)');
assert.ok(ur.rubrics['bloody, spitting of blood, menses, before, suppressed, during'] === 'بلغم — خون آلود، خون تھوکنے کے ساتھ، حیض سے پہلے، بند ہونے پر، دوران میں', 'menses استثنا ہاتھ-لکھا (before سیگمنٹ کے ساتھ پرانے انداز میں)');
assert.ok(ur.rubrics['morning, 8 to 9 a.m.'] === 'بلغم — صبح، 8 سے 9 بجے', 'وقت-فارمیٹ اردو «8 سے 9 بجے» (دستی جوڑا o14730)');
assert.ok(ur.rubrics['slate colored'] === 'بلغم — سلیٹی رنگ', 'SLATE colored اردو (دستی جوڑا o14795)');
assert.ok(ur.rubrics['taste of almonds, like, bad'] === 'بلغم — بادام جیسا، برا/خراب', 'TASTE خاندان refix — والد «بادام جیسا» سے ہم آہنگ');
assert.ok(ur.rubrics['balls, in shape of, little albuminous'] === 'بلغم — گیندیاں، شکل میں، چھوٹی البومنی', 'BALLS ہاتھ-اخذ «شکل میں» درج');
assert.ok(ur.rubrics['bed, in, sitting up in, on'] === 'بلغم — بستر میں، اٹھ کر بیٹھنے پر', 'BED ہاتھ-اخذ (پرانا اٹھ کر بیٹھنے پر برقرار)');
assert.ok(!treeRK.some(k => !String(ur.rubrics[k]).startsWith('بلغم — ')), 'ہر جملہ «بلغم — » سے');
const latinBad = treeRK.filter(k => {
  const s = String(ur.rubrics[k]).replace('بلغم — ', '');
  return /[A-Za-z]/.test(s.replace(/amel\.|agg\./g, ''));
});
assert.strictEqual(latinBad.length, 0, 'لاطینی صفر — ' + latinBad.slice(0, 3).join(' | '));

// 11) مانی فیسٹ + _index + tree-fix
assert.strictEqual(manifest.source_canonical, 'homeoint-expectoration-v1', 'مانی فیسٹ marker');
assert.strictEqual(manifest.source_rows, 340, 'مانی فیسٹ قطاریں 340');
assert.ok(/812 – 821|812-821|812–821/.test(manifest.pages), 'مانی فیسٹ صفحات 812–821');
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/_index.json'), 'utf8'));
const ix = idx.find(x => x.key === 'expectoration');
assert.ok(ix && ix.rubrics === 380 && ix.name === 'EXPECTORATION', '_index: expectoration 380/EXPECTORATION');
const tf = fs.readFileSync(path.join(ROOT, 'js/repertory/kent-tree-fix.js'), 'utf8');
const m = tf.match(/"expectoration":\{"h":\[([^\]]*)\]/);
assert.ok(m, 'tree-fix میں expectoration h فہرست');
const hIds = m[1] ? m[1].split(',').map(s => s.replace(/"/g, '')) : [];
assert.strictEqual(hIds.length, 40, 'tree-fix h = 40 legacy ids');
assert.ok(hIds.every(id => legacy.includes(id)), 'h فہرست کے تمام ids legacy ریکارڈ');

console.log('✓ kent_expectoration_homeoint_source.test.js — EXPECTORATION ماخذی درخت 340/340 (v192) سب پاس');
