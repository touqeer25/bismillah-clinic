'use strict';
// tests/kent_back_homeoint_source.test.js — v194: پیٹھ باب (صفحات 884–951) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/back.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/back.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_back_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-back-v1');
assert.strictEqual(srcEntries.length, 3580, 'ماخذی قطاریں: 3580 (جڑ BACK + 3579) — 19 clamps (سب کتابی یتیم)، 11 کتابی دہرائیاں union');
assert.strictEqual(Object.keys(data).length, 3894, 'پرانی مقامی قطاریں فائل میں محفوظ (3894 کل = 3580 + 314)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_BACK_SOURCE_MARKER="homeoint-back-v1",_REP_KENT_BACK_COUNT=3580;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentBackSourceEntries') + grab('_repHasKentBackSourceData') + grab('_repBuildKentBackSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentBackSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentBackSourceData', ctx)(data), true, 'ماخذی ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
assert.strictEqual(count(tree), 3580, 'درخت کے ربرک 3580');
assert.strictEqual(tree.order[0], 'BACK', 'باب کی جڑ BACK پہلی قطار');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 884 || p > 951) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 68, '68 صفحات (884–951، MEDI-T انتساب) مکمل: ' + pages.size);
assert.strictEqual(tree.order[1], 'ABSCESS', 'ABSCESS پہلا مین (p884 — P884 nav-اینکر کے بعد slot-4)');

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
const cer = tree.children['ABSCESS'].children['Cervical region'];
assert.ok(cer && Object.keys(cer.remedies).length === 8 && cer.remedies['lach'] === 2 && cer.remedies['tarent-c'] === 2, 'ABSCESS, Cervical region: 8 ادویہ Lach.2/Tarent-c.2 (p884 — جڑ کا پہلا مین کی ذیلی)');
assert.ok(cer.children['old cicatrices'] && cer.children['old cicatrices'].remedies['sil'] === 1, 'ABSCESS, Cervical region, old cicatrices: Sil. (d2 ساخت)');
const pso = tree.children['ABSCESS'].children['psoas'];
assert.ok(pso && Object.keys(pso.remedies).length === 7 && pso.remedies['cupr'] === 2, 'ABSCESS, psoas: 7 ادویہ (p884)');
// clamp نمونے: idx155 (d2→d1 — PDF1958 x=128.7 کتابی یتیم) + idx996 (d6→d5 — سب سے گہرا clamp، PDF1995 x=272.7)
const crk = findNode(tree, 'CRACKING cervical region, rising from stooping, on');
assert.ok(crk && crk.remedies['nicc'] === 1, 'CRACKING cervical region, rising from stooping, on: Nicc. (clamp idx155 raw d2→d1 — PDF1958 x=128.7 کتابی یتیم)');
const dp6 = findNode(tree, 'PAIN, Dorsal region, scapulæ, between, bending forward, amel.');
assert.ok(dp6 && dp6.remedies['nat-a'] === 1, 'PAIN…scapulæ, between, bending forward, amel.: Nat-a. (clamp idx996 raw d6→d5 — اب تک کا سب سے گہرا clamp، PDF1995 x=272.7 کتابی یتیم)');
// WEAKNESS (tired feeling, in spine) — d0 اپنا مین (OOREP r3542 «WEAKNESS» 144-یونین برتن مسترد)
const wk = tree.children['WEAKNESS (tired feeling, in spine)'];
assert.ok(wk && Object.keys(wk.remedies).length === 70 && wk.remedies['abrot'] === 1, 'WEAKNESS (tired feeling, in spine): d0 اپنا مین 70 ادویہ (p950)');

// 4) گہرائی تقسیم (clamps کے بعد)
const depths = srcEntries.map(k => Number(data[k].source_depth));
const depthCounts = depths.reduce((a, d) => { a[d] = (a[d] || 0) + 1; return a; }, {});
assert.deepStrictEqual(depthCounts, { 0: 83, 1: 459, 2: 1056, 3: 1187, 4: 583, 5: 188, 6: 24 }, 'گہرائی分布 83/459/1056/1187/583/188/24 — 19 clamps + 11 union کے بعد (منفرد ریکارڈ)');

// 5) دستی J=1.00 نمائندے (105 میں سے): وقت-فارمیٹ + agg-لاحقہ + OOREP لیبل-خرابی + PAIN-amel گروپ
const tf = findNode(tree, 'HEAT, Cervical region, afternoon, 7 to 8 p.m.');
assert.ok(tf && tf.remedies['fl-ac'] === 1, 'HEAT…, 7 to 8 p.m.: Fl-ac. (دستی o3572 — OOREP «7 p.m. to 8 p.m.» وقت-فارمیٹ، p890)');
const lwh = findNode(tree, 'PAIN, aching, Lumbar region, lying, while');
assert.ok(lwh && Object.keys(lwh.remedies).length === 5 && lwh.remedies['nux-v'] === 2 && lwh.remedies['tab'] === 1, 'PAIN, aching, Lumbar region, lying, while: 5 ادویہ (دستی o3893 — OOREP agg-لاحقہ «lying, while agg.» genm-r381 اصول، p917)');
const dg = findNode(tree, 'PAIN, digging, Cervical region, on turning head');
assert.ok(dg && dg.remedies['calc'] === 1 && dg.remedies['lachn'] === 1, 'PAIN, digging, cervical region, on turning head: Calc./Lachn. (دستی o4550 — OOREP «dislocated, as if» والد کتاب digging PDF2013 ثابت، p924)');
const pam = tree.children['PAIN'].children['amel.'];
assert.ok(pam && Object.keys(pam.remedies).length === 36 && pam.remedies['arg-m'] === 3, 'PAIN, amel.: d1 اپنا مین 36 ادویہ (دستی o6410 — کتاب PDF1984 x=92.7 ثابت؛ OOREP نے walking میں جوڑا تھا)');

// 6) OOREP برتن legacy — ادویات نقصان صفر
const legacy = Object.keys(data).filter(k => !data[k].source_canonical);
assert.strictEqual(legacy.length, 314, 'legacy محفوظ: 314');
assert.ok(data['r2791'] && Object.keys(data['r2791'].r).length === 217 && !data['r2791'].source_canonical, 'r2791 PAIN, stitching 217-یونین برتن legacy');
assert.ok(data['r642'] && Object.keys(data['r642'].r).length === 107 && !data['r642'].source_canonical, 'r642 PAIN, motion 107-یونین برتن legacy');
assert.ok(data['r3542'] && data['r3542'].t === 'WEAKNESS' && Object.keys(data['r3542'].r).length === 144 && !data['r3542'].source_canonical, 'r3542 WEAKNESS 144-یونین برتن legacy (کتاب WEAKNESS (tired feeling, in spine) d0 الگ)');
assert.ok(data['o64646'] && Object.keys(data['o64646'].r).length === 12 && !data['o64646'].source_canonical, 'o64646 dislocated-والد 12-یونین برتن legacy (کتاب digging — PDF2013)');
assert.ok(data['o4556'] && Object.keys(data['o4556'].r).length === 3 && data['o4556'].r['calc-p'] === 2 && !data['o4556'].source_canonical, 'o4556 digging-sacrum 3-یونین برتن legacy (کتاب صرف {Agar., Nux-v.} — calc-p ذیلی o4557 میں محفوظ)');
const emptyM = legacy.filter(k => Object.keys(data[k].r).length === 0);
assert.ok(emptyM.length >= 8, 'خالی m-برتن legacy (16): ' + emptyM.length);
assert.ok(data['o64806'] && !data['o64806'].source_canonical, 'o64806 tearing-standing تصادم-ہار برتن legacy (o6356 جُڑا)');
assert.ok(data['o64573'] && !data['o64573'].source_canonical, 'o64573 heat-flushes تصادم-ہار برتن legacy (o3602 جُڑا)');

// 7) کتابی دہرائیاں union — 11 جوڑے
const eru = findNode(tree, 'ERUPTIONS, Cervical region');
assert.ok(eru && Object.keys(eru.remedies).length === 30 && eru.remedies['agar'] === 2 && eru.remedies['anac'] === 1, 'ERUPTIONS, Cervical region: union 30 ادویہ (p887 کتابی دہرائی 29+4 — پانچ اور Cervical-kاپیاں acne/boils/carbuncle/herpes/pimples ذیلیاں الگ راستے)');
assert.ok(findNode(tree, 'ERUPTIONS, boils, Cervical region') && Object.keys(findNode(tree, 'ERUPTIONS, boils, Cervical region').remedies).length === 22, 'ERUPTIONS, boils, Cervical region: 22 ادویہ (d2 — الگ راستہ، union نہیں)');
const cpl = findNode(tree, 'PAIN, compressing, Lumbar region');
assert.ok(cpl && Object.keys(cpl.remedies).length === 13 && cpl.remedies['bov'] === 1 && cpl.remedies['tanac'] === 1, 'PAIN, compressing, Lumbar region: union 13 ادویہ (p922 — 5+8، کتاب PDF2036 دو پرنٹس)');
const cpc = findNode(tree, 'PAIN, compressing, Cervical region');
assert.ok(cpc && Object.keys(cpc.remedies).length === 4 && cpc.remedies['ferr'] === 2 && cpc.remedies['glon'] === 2, 'PAIN, compressing, cervical region: union 4 ادویہ (کیس-مختلف دہرائی 2+2 — کتاب خود lowercase چھاپتی ہے PDF2036)');
const mb = findNode(tree, 'PAIN, sore, bruised, beaten, Sacral region, menses, before');
assert.ok(mb && Object.keys(mb.remedies).length === 1 && mb.remedies['spong'] === 2, 'sore-Sacral-menses-before: union 1 ادویہ Spong.2 (p934+935 عین ایک ادویہ — PDF2068 دو پرنٹس)');
const ro = findNode(tree, 'PAIN, stitching, shooting, Dorsal region, scapulæ, respiration, on');
assert.ok(ro && Object.keys(ro.remedies).length === 7 && ro.remedies['dulc'] === 1 && ro.remedies['guai'] === 1, 'stitching-respiration, on: union 7 ادویہ (p938 — PDF2075 دو پرنٹس 5+2)');

// 8) باب-اختتام (p951): WIND آخری مین — P952 EXTREMITIES اینکر سے پہلے
const wind = tree.children['WIND, as if blowing between shoulders'];
assert.ok(wind && wind.remedies['caust'] === 1 && wind.remedies['hep'] === 2 && wind.children['Lumbar region'] && wind.children['Lumbar region'].remedies['sumb'] === 2, 'WIND, as if blowing between shoulders: {Caust., hep., sulph.} + Lumbar region {Sumb.} (p951 — باب کی آخری قطاریں، P952 EXTREMITIES اینکر سے پہلے)');
const srcList = srcEntries.map(k => data[k]);
const maxOrder = srcList.reduce((a, r) => (Number(r.source_order) > Number(a.source_order) ? r : a), srcList[0]);
assert.strictEqual(maxOrder.source_path, 'WIND, as if blowing between shoulders, Lumbar region', 'source_order کی آخری قطار WIND…Lumbar region');

// 9) اگلا باب لیک نہیں — EXTREMITIES کی جڑ/پہلا مین موجود نہ ہو
const leak = srcList.filter(r => r.source_label === 'EXTREMITIES' || r.source_label === 'ABDUCTED');
assert.strictEqual(leak.length, 0, 'EXTREMITIES لیک نہیں (اختتامی کٹ P952 اینکر پر)');

// 10) اردو — 3580/3580 مکمل، جڑ-پیشوند، نمونے
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
assert.strictEqual(treeKeys.length, 3580, 'درخت کلیدیں 3580');
const treeRK = treeKeys.map(repRubKey);
const missing = treeRK.filter(k => !ur.rubrics[k]);
assert.strictEqual(missing.length, 0, 'اردو جملے غائب نہیں: ' + missing.slice(0, 3).join(' | '));
assert.strictEqual(ur.rubrics['back'], 'پیٹھ — پیٹھ', 'جڑ کا اردو «پیٹھ — پیٹھ»');
assert.ok(ur.rubrics['abscess'] === 'پیٹھ — پھوڑا', 'ABSCESS اردو (پرانا جملہ منتقل)');
assert.ok(ur.rubrics['heat, cervical region, afternoon, 7 to 8 p.m.'] === 'پیٹھ — گرمی، گردن کا حصہ، سہ پہر، 7 سے 8 بجے', 'وقت-فارمیٹ اردو «7 سے 8 بجے» (دستی جوڑا o3572 + refix ہم آہنگی)');
assert.ok(ur.rubrics['pain, aching, lumbar region, lying, while'] === 'پیٹھ — درد، مسلسل درد، کمر کا حصہ، لیٹنا جب کہ', 'grown-path refix — «مسلسل درد» سیگمنٹ درج (پرانی فائل کا aching محفوظ)');
assert.ok(ur.rubrics['weakness (tired feeling, in spine)'] === 'پیٹھ — کمزوری (ریڑھ کی ہڈی میں تھکن)', 'WEAKNESS parenthetical ہاتھ-لکھا (d0 — بچے «پیٹھ — کمزوری، …» روایت پر)');
assert.ok(ur.rubrics['pain, amel.'] === 'پیٹھ — درد، آرام', 'PAIN, amel. اردو (کتاب کا اپنا d1 مین)');
assert.ok(ur.rubrics['pain, digging, sacrum'] === 'پیٹھ — درد، کھودنے جیسا درد، تعلق کی ہڈی', 'digging-sacrum ہاتھ-لکھا (تعلق کی ہڈی — خاندان کی روایت، نئے h003)');
const seeRow = findNode(tree, 'DRAWING backward of muscles of neck (See Tension and Spasmodic Drawings)');
assert.ok(seeRow && Object.keys(seeRow.remedies).length === 0, 'DRAWING backward (See…): بے-ادویات See-ref (p887 — PDF گلو DISLOCATION میں دستاویز)');
assert.ok(ur.rubrics['drawing backward of muscles of neck'], 'See-ref کا اردو repRubKey-کلید پر موجود');
assert.ok(!treeRK.some(k => !String(ur.rubrics[k]).startsWith('پیٹھ — ')), 'ہر جملہ «پیٹھ — » سے');
const latinBad = treeRK.filter(k => {
  const s = String(ur.rubrics[k]).replace('پیٹھ — ', '');
  return /[A-Za-z]/.test(s.replace(/amel\.|agg\./g, ''));
});
assert.strictEqual(latinBad.length, 0, 'لاطینی صفر — ' + latinBad.slice(0, 3).join(' | '));

// 11) مانی فیسٹ + _index + tree-fix
assert.strictEqual(manifest.source_canonical, 'homeoint-back-v1', 'مانی فیسٹ marker');
assert.strictEqual(manifest.source_rows, 3580, 'مانی فیسٹ قطاریں 3580');
assert.ok(/884 – 951|884-951|884–951/.test(manifest.pages), 'مانی فیسٹ صفحات 884–951');
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/_index.json'), 'utf8'));
const ix = idx.find(x => x.key === 'back');
assert.ok(ix && ix.rubrics === 3894 && ix.name === 'BACK', '_index: back 3894/BACK');
const tf2 = fs.readFileSync(path.join(ROOT, 'js/repertory/kent-tree-fix.js'), 'utf8');
const m = tf2.match(/"back":\{"h":\[([^\]]*)\]/);
assert.ok(m, 'tree-fix میں back h فہرست');
const hIds = m[1] ? m[1].split(',').map(s => s.replace(/"/g, '')) : [];
assert.strictEqual(hIds.length, 314, 'tree-fix h = 314 legacy ids');
assert.ok(hIds.every(id => legacy.includes(id)), 'h فہرست کے تمام ids legacy ریکارڈ');

console.log('✓ kent_back_homeoint_source.test.js — BACK ماخذی درخت 3580/3580 (v194) سب پاس');
