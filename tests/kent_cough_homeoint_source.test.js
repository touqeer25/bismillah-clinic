'use strict';
// tests/kent_cough_homeoint_source.test.js — v191: کھانسی باب (صفحات 778–811) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/cough.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/cough.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_cough_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-cough-v1');
assert.strictEqual(srcEntries.length, 1455, 'ماخذی قطاریں: 1455 (جڑ COUGH + 1454) — 8 کتابی یتیم clamps، کوئی کتابی دہرائی نہیں');
assert.strictEqual(Object.keys(data).length, 1696, 'پرانی مقامی قطاریں فائل میں محفوظ (1696 کل = 1455 + 241)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_COUGH_SOURCE_MARKER="homeoint-cough-v1",_REP_KENT_COUGH_COUNT=1455;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentCoughSourceEntries') + grab('_repHasKentCoughSourceData') + grab('_repBuildKentCoughSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentCoughSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentCoughSourceData', ctx)(data), true, 'ماخذی ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
assert.strictEqual(count(tree), 1455, 'درخت کے ربرک 1455');
assert.strictEqual(tree.order[0], 'COUGH', 'باب کی جڑ COUGH پہلی قطار');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 778 || p > 811) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 34, '34 صفحات (778–811، MEDI-T انتساب) مکمل: ' + pages.size);
assert.strictEqual(tree.order[1], 'DAYTIME', 'DAYTIME پہلا مین (p778 — P778 nav-اینکر کے بعد)');

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (p778): جڑ + DAYTIME {69} — nav-para اینکر (slot-1 nav + slot-2 سرخ COUGH) skip سے صاف آغاز
const dt = tree.children['DAYTIME'];
assert.ok(dt && dt.remedies['am-c'] === 3 && dt.remedies['euphr'] === 3 && Object.keys(dt.remedies).length === 69, 'DAYTIME: 69 ادویہ Am-c./Euphr.3 (p778 — جڑ کا پہلا مین)');
const mor = tree.children['MORNING'];
assert.ok(mor && Object.keys(mor.remedies).length === 147 && mor.remedies['alum'] === 3, 'MORNING: 147 ادویہ (p778 — مین مکمل، ذیلیاں p779 پر — صفحہ-سرخی «MORNING, 6 a.m.» آرٹیفیکٹ skip)');
const m67 = findNode(tree, 'MORNING, 6 to 7 a.m.');
assert.ok(m67 && m67.remedies['coc-c'] === 2 && Object.keys(m67.remedies).length === 4, 'MORNING, 6 to 7 a.m.: 4 ادویہ Coc-c.2 (p779 — دستی جوڑا o12044، OOREP «6 a.m. to 7 a.m.» وقت-فارمیٹ)');
const night = tree.children['NIGHT'];
assert.ok(night && Object.keys(night.remedies).length === 162 && night.remedies['acon'] === 3, 'NIGHT: 162 ادویہ (p780 — باب کا سب سے بڑا مین)');

// 4) clamps — 8 کتابی یتیم-indentation (x = خام سطح — cough_clamp_xcoords.json)
// idx111: NIGHT, midnight (d1) → before (raw d3→fixed d2، p781 @164.7)
const bef = findNode(tree, 'NIGHT, midnight, before');
assert.ok(bef && Object.keys(bef.remedies).length === 46 && bef.remedies['carb-v'] === 3, 'NIGHT, midnight, before: 46 ادویہ (clamp idx111 raw d3→d2 — @164.7 کتابی یتیم-indentation، p781)');
assert.ok(bef && findNode(tree, 'NIGHT, midnight') && findNode(tree, 'NIGHT, midnight').children['before'] === bef, 'clamp ساخت: before والد midnight کے نیچے (d2 — کتابی سطح @164.7 سے ثابت)');
// idx1079: SHORT, night, midnight, before → wakens (raw d4→fixed d3، p803 @200.7)
const wak = findNode(tree, 'SHORT, night, midnight, before, wakens');
assert.ok(wak && wak.remedies['rhus-t'] === 2, 'SHORT, night, midnight, before, wakens: Rhus-t.2 (clamp idx1079 raw d4→d3 — @200.7، p803)');

// 5) دستی J=1.00 جوڑے (OOREP لیبل-فرق، ادویات عین) — وقت-فارمیٹ + agg.-لاحقہ + لیبل-خرابی
const n101 = findNode(tree, 'NIGHT, midnight, 10 p.m., to 1 p.m.');
assert.ok(n101 && n101.remedies['ant-t'] === 2 && Object.keys(n101.remedies).length === 5, 'NIGHT, midnight, 10 p.m., to 1 p.m.: 5 ادویہ (دستی o12086 — OOREP «10 p.m. to 1 p.m.» + midnight-سیاق، p781)');
const mea = findNode(tree, 'DRY, measles, after, during, profuse sweat, with');
assert.ok(mea && mea.remedies['graph'] === 1, 'DRY, measles, after, during, profuse sweat, with: Graph. (دستی o11611 — OOREP menses لیبل-خرابی، PDF کتابی measles کی تصدیق، p789)');
const cold = findNode(tree, 'DRY, air, from cold, going from warm room to');
assert.ok(cold && cold.remedies['acon'] === 2 && cold.remedies['con'] === 2, 'DRY, air, from cold, going from warm room to: Acon./Con.2 (دستی o11543 — OOREP «open air» لیبل-خرابی، PDF کتابی from-cold کی تصدیق، p788)');
const sue = findNode(tree, 'SITTING, while, erect');
assert.ok(sue && sue.remedies['kali-c'] === 1 && Object.keys(sue.remedies).length === 3, 'SITTING, while, erect: 3 ادویہ (دستی o12377 — OOREP «erect agg.» + agg.-لاحقہ، p804)');
// راستے سے منفرد MULTI حل — ادویہ عین، والدینی سیاق سے فرق
const e610 = findNode(tree, 'EVENING, 6 to 10 p.m.');
const w610 = findNode(tree, 'WHOOPING, evening, 6 to 10 p.m.');
assert.ok(e610 && w610 && e610.remedies['hyper'] === 1 && w610.remedies['hyper'] === 1, 'EVENING/WHOOPING evening 6 to 10 p.m.: Hyper. ہر ایک (دستی o11693/o12671 — MULTI والدینی حل)');

// 6) IRRITATION in air passages, from (OOREP 189-یونین برتن legacy — کتابی مین 60 ادویہ)
const irr = tree.children['IRRITATION in air passages, from'];
assert.ok(irr && Object.keys(irr.remedies).length === 60 && irr.remedies['acon'] === 3, 'IRRITATION in air passages, from: 60 ادویہ — جڑ کا براہِ راست مین (d0) (p794 — OOREP 189-یونین legacy، کتابی درخت صاف)');

// 7) باب-اختتام (p811): YAWNING آخری مین — and coughing consecutively آخری ربرک
const yawn = findNode(tree, 'YAWNING, and coughing consecutively');
assert.ok(yawn && yawn.remedies['nat-m'] === 2 && yawn.remedies['ant-t'] === 1, 'YAWNING, and coughing consecutively: Nat-m.2/Ant-t. (p811 — باب کی آخری قطار، P812 EXPECTORATION اینکر سے پہلے)');
const srcList = srcEntries.map(k => data[k]);
const maxOrder = srcList.reduce((a, r) => (Number(r.source_order) > Number(a.source_order) ? r : a), srcList[0]);
assert.strictEqual(maxOrder.source_path, 'YAWNING, and coughing consecutively', 'source_order کی آخری قطار YAWNING, and coughing consecutively');

// 8) اگلا باب لیک نہیں — EXPECTORATION کی جڑ/پہلا مین (path-کم صفیں) موجود نہ ہوں
// (یاد رہے: 'EXPECTORATION amel.' جائز COUGH ربرک ہے — کھانسی کا بلغم سے آرام، p790)
const leak = srcList.filter(r => r.source_label === 'EXPECTORATION' || r.source_label === 'DAYTIME only' || r.source_label === 'RESPIRATION');
assert.strictEqual(leak.length, 0, 'EXPECTORATION/RESPIRATION لیک نہیں (اختتامی کٹ P812 اینکر پر)');

// 9) See-ref مینز (بے-ادویات) اپنی جگہ — 3 نئے hN See-refs
const coal = findNode(tree, 'COAL (See Carbon)');
const har = findNode(tree, 'HARASSING (See Teasing)');
const sha = findNode(tree, 'SHATTERING (See Racking)');
assert.ok(coal && Object.keys(coal.remedies).length === 0 && Number(coal.sourcePage) === 783, 'COAL (See Carbon): بے-ادویات See-ref مین (p783 — نئے hN)');
assert.ok(har && Object.keys(har.remedies).length === 0 && Number(har.sourcePage) === 792, 'HARASSING (See Teasing): بے-ادویات See-ref (p792)');
assert.ok(sha && Object.keys(sha.remedies).length === 0 && Number(sha.sourcePage) === 802, 'SHATTERING (See Racking): بے-ادویات See-ref (p802)');
// SPASMODIC (See Paroxysmal) — ادویات کے ساتھ (کتابی قطار)
const spa = findNode(tree, 'SPASMODIC (See Paroxysmal), daytime, only');
assert.ok(spa && spa.remedies['agar'] === 2 && Object.keys(spa.remedies).length === 2, 'SPASMODIC (See Paroxysmal), daytime, only: Agar.2/Staph. (دستی o12418، p805)');

// 10) اردو — 1455/1455 مکمل، جڑ-پیشوند، نمونے
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
assert.strictEqual(treeKeys.length, 1455, 'درخت کلیدیں 1455');
const treeRK = treeKeys.map(repRubKey);
const missing = treeRK.filter(k => !ur.rubrics[k]);
assert.strictEqual(missing.length, 0, 'اردو جملے غائب نہیں: ' + missing.slice(0, 3).join(' | '));
assert.strictEqual(ur.rubrics['cough'], 'کھانسی — کھانسی', 'جڑ کا اردو «کھانسی — کھانسی»');
assert.ok(ur.rubrics['daytime'] === 'کھانسی — دن کے وقت', 'DAYTIME کا اردو (پرانا جملہ منتقل)');
assert.ok(ur.rubrics['night, midnight, after, 3 to 4 a.m.'] === 'کھانسی — رات، آدھی رات کے بعد، 3 سے 4 بجے', 'وقت-فارمیٹ اردو «3 سے 4 بجے» (راستہ-بڑھا سیاق + منتقل وقت)');
assert.ok(ur.rubrics['night, midnight, after, 2 and 2-30 a.m.'] === 'کھانسی — رات، آدھی رات کے بعد، 2 بجے اور 2.30 بجے', 'وقت «2 بجے اور 2.30 بجے» (ہاتھ — پرانی فائل روایت)');
assert.ok(ur.rubrics['irritation in air passages, from'] === 'کھانسی — سانس کی نالیوں میں خراش، اُس سے', 'IRRITATION والدم «اُس سے» (ہاتھ — لاطینی from کی جگہ)');
assert.ok(!treeRK.some(k => !String(ur.rubrics[k]).startsWith('کھانسی — ')), 'ہر جملہ «کھانسی — » سے');
const latinBad = treeRK.filter(k => {
  const s = String(ur.rubrics[k]).replace('کھانسی — ', '');
  return /[A-Za-z]/.test(s.replace(/amel\.|agg\./g, ''));
});
assert.strictEqual(latinBad.length, 0, 'لاطینی صرف amel./agg. — ' + latinBad.slice(0, 3).join(' | '));

// 11) مانی فیسٹ + _index + tree-fix
assert.strictEqual(manifest.source_canonical, 'homeoint-cough-v1', 'مانی فیسٹ marker');
assert.strictEqual(manifest.source_rows, 1455, 'مانی فیسٹ قطاریں 1455');
assert.ok(/778 – 811|778-811|778–811/.test(manifest.pages), 'مانی فیسٹ صفحات 778–811');
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/_index.json'), 'utf8'));
const ix = idx.find(x => x.key === 'cough');
assert.ok(ix && ix.rubrics === 1696 && ix.name === 'COUGH', '_index: cough 1696/COUGH');
const tf = fs.readFileSync(path.join(ROOT, 'js/repertory/kent-tree-fix.js'), 'utf8');
const m = tf.match(/"cough":\{"h":\[([^\]]*)\]/);
assert.ok(m, 'tree-fix میں cough h فہرست');
const hIds = m[1] ? m[1].split(',').map(s => s.replace(/"/g, '')) : [];
assert.strictEqual(hIds.length, 241, 'tree-fix h = 241 legacy ids');
const legacy = Object.keys(data).filter(k => !data[k].source_canonical);
assert.ok(hIds.every(id => legacy.includes(id)), 'h فہرست کے تمام ids legacy ریکارڈ');

console.log('✓ kent_cough_homeoint_source.test.js — COUGH ماخذی درخت 1455/1455 (v191) سب پاس');
