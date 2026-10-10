'use strict';
// tests/kent_chest_homeoint_source.test.js — v193: سینہ باب (صفحات 822–883) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/chest.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/chest.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_chest_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-chest-v1');
assert.strictEqual(srcEntries.length, 3157, 'ماخذی قطاریں: 3157 (جڑ CHEST + 3156) — 9 clamps (سب کتابی یتیم)، 6 کتابی دہرائیاں union');
assert.strictEqual(Object.keys(data).length, 3437, 'پرانی مقامی قطاریں فائل میں محفوظ (3437 کل = 3157 + 280)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_CHEST_SOURCE_MARKER="homeoint-chest-v1",_REP_KENT_CHEST_COUNT=3157;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentChestSourceEntries') + grab('_repHasKentChestSourceData') + grab('_repBuildKentChestSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentChestSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentChestSourceData', ctx)(data), true, 'ماخذی ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
assert.strictEqual(count(tree), 3157, 'درخت کے ربرک 3157');
assert.strictEqual(tree.order[0], 'CHEST', 'باب کی جڑ CHEST پہلی قطار');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 822 || p > 883) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 62, '62 صفحات (822–883، MEDI-T انتساب) مکمل: ' + pages.size);
assert.strictEqual(tree.order[1], 'ABSCESS', 'ABSCESS پہلا مین (p822 — P822 nav-اینکر کے بعد slot-4)');

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
const axi = tree.children['ABSCESS'].children['Axilla'];
assert.ok(axi && Object.keys(axi.remedies).length === 28 && axi.remedies['hep'] === 3 && axi.remedies['merc'] === 3, 'ABSCESS, Axilla: 28 ادویہ Hep.3/Merc.3 (p822 — جڑ کا پہلا مین کی ذیلی)');
const lng = tree.children['ABSCESS'].children['Lungs'];
assert.ok(lng && Object.keys(lng.remedies).length === 21 && lng.children['left'] && Object.keys(lng.children['left'].remedies).length === 1, 'ABSCESS, Lungs: 21 ادویہ + left ذیلی (d2 ساخت)');
// CONSTRICTION tension tightness خاندان (p826–828 — clamps idx217 amel. + idx327 on-motion)
const con = findNode(tree, 'CONSTRICTION, tension, tightness');
assert.ok(con && con.children['bending backwards'] && Object.keys(con.children['bending backwards'].remedies).length === 1 && con.children['bending backwards'].remedies['nit-ac'] === 1, 'CONSTRICTION…, bending backwards: Nit-ac. (p826 — clamp idx217 اسی خاندان میں raw d3→d2 — PDF1823 x=164.7 کتابی یتیم)');
assert.ok(con.children['bending backwards'].children['amel.'] && con.children['bending backwards'].children['amel.'].remedies['caust'] === 1, 'CONSTRICTION…, bending backwards, amel.: Caust. (clamp idx217 raw d3→d2 — PDF1823 x=164.7 کتابی یتیم)');
const crk = findNode(tree, 'CRACKING in sternum on bending chest backwards');
assert.ok(crk && crk.children['on motion'] && Object.keys(crk.children['on motion'].remedies).length === 2 && crk.children['on motion'].remedies['nat-m'] === 1, 'CRACKING…, on motion: 2 ادویہ (clamp idx327 raw d2→d1 — PDF1828 x=128.7 کتابی یتیم)');
// کتابی flat d2: PAIN, Sternum, behind — OOREP کا behind-والد استنباط تھا (PDF1875 x=128.7 سب)
const bhd = findNode(tree, 'PAIN, Sternum, behind');
assert.ok(bhd && Object.keys(bhd.remedies).length === 16 && Object.keys(bhd.children).length === 0, 'PAIN, Sternum, behind: 16 ادویہ، یکتا پتہ (کتاب flat d2 — OOREP grouping مسترد، PDF1875 x=128.7 سب siblings)');
assert.ok(findNode(tree, 'PAIN, Sternum').children['coughing, when'] && Object.keys(findNode(tree, 'PAIN, Sternum').children['coughing, when'].remedies).length === 25, 'coughing, when behind کا بھائی (d2 sibling — union 25 ادویہ)');
const cw = findNode(tree, 'PAIN, Sternum, coughing, when');
assert.ok(cw && Object.keys(cw.remedies).length === 25 && cw.remedies['bry'] === 3 && cw.remedies['caust'] === 3, 'PAIN, Sternum, coughing, when: 25 ادویہ (کتابی دہرائی union 20+14 — p849 دو واقعے)');
// PURPURA — OOREP نے PULSATION میں ڈالا تھا، کتاب d0 اپنا مین
const pur = tree.children['PURPURA'];
assert.ok(pur && Object.keys(pur.remedies).length === 2 && pur.remedies['kali-i'] === 1 && pur.remedies['phos'] === 1, 'PURPURA: d0 اپنا مین 2 ادویہ Kali-i./Phos. (دستی o10457 — OOREP «PULSATION, purpura» مسترد)');

// 4) گہرائی تقسیم (clamps کے بعد)
const depths = srcEntries.map(k => Number(data[k].source_depth));
const depthCounts = depths.reduce((a, d) => { a[d] = (a[d] || 0) + 1; return a; }, {});
assert.deepStrictEqual(depthCounts, { 0: 162, 1: 813, 2: 1115, 3: 742, 4: 257, 5: 55, 6: 13 }, 'گہرائی分布 162/813/1115/742/257/55/13 — 9 clamps کے بعد');

// 5) دستی J=1.00 نمائندے (82 میں سے): وقت-فارمیٹ + agg-لاحقہ + inserted-segment
const m45 = findNode(tree, 'ANXIETY, in, Heart, region of, morning, 4 to 5 a.m.');
assert.ok(m45 && Object.keys(m45.remedies).length === 1 && m45.remedies['alum'] === 2, 'ANXIETY…, 4 to 5 a.m.: Alum.2 (دستی o7555 — OOREP «4 a.m. to 5 a.m.» وقت-فارمیٹ، p823)');
const lwh = findNode(tree, 'CONSTRICTION, tension, tightness, lying, while');
assert.ok(lwh && Object.keys(lwh.remedies).length === 4 && lwh.remedies['aral'] === 1 && lwh.remedies['nux-v'] === 1, 'CONSTRICTION…, lying, while: 4 ادویہ Aral./Nux-v. (دستی o7757 — OOREP agg-لاحقہ «lying, while agg.» genm-r381 اصول، p827)');
const elb = findNode(tree, 'PAIN, drawing, Axilla, elbow');
assert.ok(elb && elb.remedies['thuj'] === 1, 'PAIN, drawing, Axilla, elbow: Thuj. (دستی o8872 — OOREP inserted «extending»، p857)');

// 6) OOREP برتن legacy — ادویات نقصان صفر (r2517 lifting شامل)
const legacy = Object.keys(data).filter(k => !data[k].source_canonical);
assert.strictEqual(legacy.length, 280, 'legacy محفوظ: 280');
assert.ok(data['r30'] && Object.keys(data['r30'].r).length === 152 && !data['r30'].source_canonical, 'r30 ANXIETY 152-یونین برتن legacy');
assert.ok(data['r239'] && Object.keys(data['r239'].r).length === 219 && !data['r239'].source_canonical, 'r239 CONSTRICTION 219-یونین برتن legacy');
assert.ok(data['o64924'] && Object.keys(data['o64924'].r).length === 63 && !data['o64924'].source_canonical, 'o64924 DISCOLORATION 63-یونین برتن legacy');
assert.ok(data['o65050'] && Object.keys(data['o65050'].r).length === 61 && !data['o65050'].source_canonical, 'o65050 PAIN-stitching-extending 61-یونین برتن legacy (مبہم cut-path)');
assert.ok(data['r2517'] && Object.keys(data['r2517'].r).length === 2 && data['r2517'].t === 'PAIN, stitching, sides, lifting' && !data['r2517'].source_canonical, 'r2517 lifting — کتاب میں ناموجود row (PDF1923 حرف-سطح ثابت) legacy محفوظ');
const emptyM = legacy.filter(k => Object.keys(data[k].r).length === 0);
assert.ok(emptyM.length >= 8, 'خالی m-برتن legacy (8): ' + emptyM.length);

// 7) کتابی دہرائیاں union — livid {ars, plb} ایک نوڈ
const liv = findNode(tree, 'DISCOLORATION, blueness clavicle, near, livid');
assert.ok(liv && Object.keys(liv.remedies).length === 2 && liv.remedies['ars'] === 1 && liv.remedies['plb'] === 1, 'livid: union {Ars., Plb.} (p829 کتابی دہرائی — دو واقعے merge)');
const red = findNode(tree, 'DISCOLORATION, blueness clavicle, near, Redness');
assert.ok(red && Object.keys(red.remedies).length === 18 && red.children['spots'], 'Redness: union 18 ادویہ (Redness/redness کیس-مختلف دہرائی) + spots ذیلی');

// 8) باب-اختتام (p883): WINE, agg. آخری مین — P884 BACK اینکر سے پہلے
const wine = tree.children['WINE, agg.'];
assert.ok(wine && wine.remedies['bor'] === 1, 'WINE, agg.: Bor. (p883 — باب کی آخری قطار، P884 BACK اینکر سے پہلے)');
const wt = findNode(tree, 'WEIGHT (See Oppression)');
assert.ok(wt && Object.keys(wt.remedies).length === 0 && wt.children['weight seems to fall from pit of chest to abdomen'], 'WEIGHT (See Oppression): بے-ادویات See-ref + ذیلی (p883)');
const srcList = srcEntries.map(k => data[k]);
const maxOrder = srcList.reduce((a, r) => (Number(r.source_order) > Number(a.source_order) ? r : a), srcList[0]);
assert.strictEqual(maxOrder.source_path, 'WINE, agg.', 'source_order کی آخری قطار WINE, agg.');

// 9) اگلا باب لیک نہیں — BACK کی جڑ/پہلا مین موجود نہ ہو + lifting خارج
const leak = srcList.filter(r => r.source_label === 'BACK' || r.source_label === 'AIR, cannot bear a draft of, on nape');
assert.strictEqual(leak.length, 0, 'BACK لیک نہیں (اختتامی کٹ P884 اینکر پر)');
const liftRows = srcList.filter(r => r.source_path === 'PAIN, stitching, Sides, lifting');
assert.strictEqual(liftRows.length, 0, 'lifting ماخذی درخت میں نہیں (کتاب میں ناموجود — دستاویزی خارج)');

// 10) اردو — 3157/3157 مکمل، جڑ-پیشوند، نمونے
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
assert.strictEqual(treeKeys.length, 3157, 'درخت کلیدیں 3157');
const treeRK = treeKeys.map(repRubKey);
const missing = treeRK.filter(k => !ur.rubrics[k]);
assert.strictEqual(missing.length, 0, 'اردو جملے غائب نہیں: ' + missing.slice(0, 3).join(' | '));
assert.strictEqual(ur.rubrics['chest'], 'سینہ — سینہ', 'جڑ کا اردو «سینہ — سینہ»');
assert.ok(ur.rubrics['abscess'] === 'سینہ — پھوڑا', 'ABSCESS اردو (پرانا جملہ منتقل)');
assert.ok(ur.rubrics['anxiety, in, heart, region of, morning, 4 to 5 a.m.'] === 'سینہ — بے چینی، اندر، دل علاقہ کا، صبح، 4 سے 5 بجے', 'وقت-فارمیٹ اردو «4 سے 5 بجے» (دستی جوڑا o7555 + refix ہم آہنگی)');
assert.ok(ur.rubrics['constriction, tension, tightness, lying, while'] === 'سینہ — جکڑن، کھنچاؤ، تنگی، لیٹنا جب کہ', 'CONSTRICTION grown-path refix — «جکڑن، کھنچاؤ، تنگی» سیگمنٹ درج (پرانی فائل کا «جکڑن» محفوظ)');
assert.ok(ur.rubrics['purpura'] === 'سینہ — خونی دھبے (پرپورا)', 'PURPURA ہاتھ-لکھا (d0 — OOREP پلساٹن-گروپ مسترد)');
assert.ok(ur.rubrics['galactorrhœa'] === 'سینہ — دودھ کا بہاؤ', 'GALACTORRHŒA ہاتھ-لکھا (entity-کلید سے بازیافت)');
assert.ok(ur.rubrics['inflammation bronchial tubes (bronchitis)'] === 'سینہ — سوزش، سانس کی نالیوں کی (برونکائٹس)', 'INFLAMMATION خاندان ہاتھ-لکھا (پرانا قدرتی جملہ برقرار)');
assert.ok(ur.rubrics['pain, sternum, food had lodged, as if'] === 'سینہ — درد، سینے کی ہڈی میں، خوراک تھا رکا ہوا (جگہ جما)', 'food had lodged (کتاب flat d2 — پرانا جملہ منتقل، OOREP behind-والد مسترد)');
assert.ok(!treeRK.some(k => !String(ur.rubrics[k]).startsWith('سینہ — ')), 'ہر جملہ «سینہ — » سے');
const latinBad = treeRK.filter(k => {
  const s = String(ur.rubrics[k]).replace('سینہ — ', '');
  return /[A-Za-z]/.test(s.replace(/amel\.|agg\./g, ''));
});
assert.strictEqual(latinBad.length, 0, 'لاطینی صفر — ' + latinBad.slice(0, 3).join(' | '));

// 11) مانی فیسٹ + _index + tree-fix
assert.strictEqual(manifest.source_canonical, 'homeoint-chest-v1', 'مانی فیسٹ marker');
assert.strictEqual(manifest.source_rows, 3157, 'مانی فیسٹ قطاریں 3157');
assert.ok(/822 – 883|822-883|822–883/.test(manifest.pages), 'مانی فیسٹ صفحات 822–883');
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/_index.json'), 'utf8'));
const ix = idx.find(x => x.key === 'chest');
assert.ok(ix && ix.rubrics === 3437 && ix.name === 'CHEST', '_index: chest 3437/CHEST');
const tf = fs.readFileSync(path.join(ROOT, 'js/repertory/kent-tree-fix.js'), 'utf8');
const m = tf.match(/"chest":\{"h":\[([^\]]*)\]/);
assert.ok(m, 'tree-fix میں chest h فہرست');
const hIds = m[1] ? m[1].split(',').map(s => s.replace(/"/g, '')) : [];
assert.strictEqual(hIds.length, 280, 'tree-fix h = 280 legacy ids');
assert.ok(hIds.every(id => legacy.includes(id)), 'h فہرست کے تمام ids legacy ریکارڈ');

console.log('✓ kent_chest_homeoint_source.test.js — CHEST ماخذی درخت 3157/3157 (v193) سب پاس');
