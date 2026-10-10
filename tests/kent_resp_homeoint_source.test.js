'use strict';
// tests/kent_resp_homeoint_source.test.js — v190: سانس باب (صفحات 762–777) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/respiration.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/respiration.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_resp_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-resp-v1');
assert.strictEqual(srcEntries.length, 698, 'ماخذی قطاریں: 698 (جڑ RESPIRATION + 697) — 1 دستاویزی clamp، کوئی کتابی دہرائی نہیں');
assert.strictEqual(Object.keys(data).length, 762, 'پرانی مقامی قطاریں فائل میں محفوظ (762 کل = 698 + 64)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_RESP_SOURCE_MARKER="homeoint-resp-v1",_REP_KENT_RESP_COUNT=698;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentRespSourceEntries') + grab('_repHasKentRespSourceData') + grab('_repBuildKentRespSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentRespSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentRespSourceData', ctx)(data), true, 'ماخذی ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
assert.strictEqual(count(tree), 698, 'درخت کے ربرک 698');
assert.strictEqual(tree.order[0], 'RESPIRATION', 'باب کی جڑ RESPIRATION پہلی قطار');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 762 || p > 777) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 16, '16 صفحات (762–777، MEDI-T انتساب) مکمل: ' + pages.size);
assert.strictEqual(tree.order[1], 'ABDOMINAL', 'ABDOMINAL پہلا مین (p762 — RESPIRATION سرخی-اینکر کے فوراً بعد)');

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (p762): جڑ + ABDOMINAL {12} — سرخی-para skip (drop_cut_para) سے صاف آغاز
const abd = tree.children['ABDOMINAL'];
assert.ok(abd && abd.remedies['am-m'] === 1 && abd.remedies['ant-t'] === 3 && Object.keys(abd.remedies).length === 12, 'ABDOMINAL: 12 ادویہ Am-m./Ant-t.3 (p762 — جڑ کا پہلا مین)');
const acc = tree.children['ACCELERATED'];
assert.ok(acc && Object.keys(acc.remedies).length === 120 && acc.remedies['acon'] === 3 && acc.remedies['ant-t'] === 3, 'ACCELERATED: 120 ادویہ (p762 — مکمل فہرست، P763 nav سے پہلے)');
const anx = tree.children['ANXIOUS'];
assert.ok(anx && Object.keys(anx.remedies).length === 82 && anx.remedies['acon'] === 3, 'ANXIOUS: 82 ادویہ (p762 — مین مکمل، p763 پر ذیلیاں)');
const anm = findNode(tree, 'ANXIOUS, morning');
assert.ok(anm && anm.remedies['phos'] === 2 && Number(anm.sourcePage) === 763, 'ANXIOUS, morning: Phos.2 (p763 — MEDI-T صفحہ-سرخی «ANXIOUS, morning» آرٹیفیکٹ skip، اصل ذیلی محفوظ)');
const dif = findNode(tree, 'DIFFICULT');
assert.ok(dif && Object.keys(dif.remedies).length === 259, 'DIFFICULT: 259 ادویہ (p766 — باب کا سب سے بڑا مین)');

// 4) clamp — 1 کتابی یتیم-indentation (x-coords ثابت: @200.7 = خام سطح)
// idx357: DIFFICULT lying while on the side → amel. (raw d4→fixed d3، p770)
const clam = findNode(tree, 'DIFFICULT, lying, while, on the side, amel.');
assert.ok(clam && clam.remedies['alum'] === 1 && clam.pathTitle === 'DIFFICULT, lying, while, on the side, amel.', 'DIFFICULT, lying, while, on the side, amel.: Alum. (clamp idx357 raw d4→d3 — @200.7 کتابی یتیم-indentation، p770)');
assert.ok(clam && findNode(tree, 'DIFFICULT, lying, while, on the side') && findNode(tree, 'DIFFICULT, lying, while, on the side').children['amel.'] === clam, 'clamp ساخت: amel. والد on-the-side کے نیچے (d3 — کتابی سطح @200.7 سے ثابت)');

// 5) دستی J=1.00 جوڑے (OOREP لیبل-فرق، ادویات عین) — وقت-فارمیٹ + during-سیگمنٹ + agg.-لاحقہ
const f1011 = findNode(tree, 'ASTHMATIC, forenoon, 10 to 11 a.m.');
assert.ok(f1011 && f1011.remedies['ferr'] === 2, 'ASTHMATIC, forenoon, 10 to 11 a.m.: Ferr.2 (دستی جوڑا o54699 — OOREP «10 a.m. to 11 a.m.» وقت-فارمیٹ، p764)');
const n12 = findNode(tree, 'DIFFICULT, night, during, 1 to 2 a.m.');
assert.ok(n12 && n12.remedies['spong'] === 2, 'DIFFICULT, night, during, 1 to 2 a.m.: Spong.2 (دستی جوڑا o54942 — OOREP «1 a.m. to 2 a.m.» + during-سیگمنٹ، p768)');
const slp = findNode(tree, 'SLOW, during sleep');
assert.ok(slp && slp.remedies['chin'] === 1 && slp.remedies['ign'] === 1, 'SLOW, during sleep: Chin./Ign. (دستی جوڑا o55205 — OOREP «expiration, during sleep» کتاب میں صرف during-sleep، p775)');
const alw = findNode(tree, 'ARRESTED, lying, while');
assert.ok(alw && alw.remedies['apis'] === 1 && alw.remedies['bor'] === 2 && alw.remedies['puls'] === 2, 'ARRESTED, lying, while: 4 ادویہ (دستی جوڑا o54634 — OOREP agg.-لاحقہ، کتابی قطار bare، p763)');

// 6) IMPEDED, obstructed (OOREP نے bare IMPEDED برتن رکھا — کتابی مین obstructed d0)
const imp = tree.children['IMPEDED, obstructed'];
assert.ok(imp && Object.keys(imp.remedies).length === 82 && imp.remedies['abrot'] === 2, 'IMPEDED, obstructed: 82 ادویہ — جڑ کا براہِ راست مین (d0) (p773 — OOREP IMPEDED 112-یونین legacy، کتابی درخت صاف)');

// 7) باب-اختتام (p777): WHISTLING آخری مین — whooping cough, in آخری ربرک
const whis = findNode(tree, 'WHISTLING, whooping cough, in');
assert.ok(whis && whis.remedies['brom'] === 2 && whis.remedies['spong'] === 1 && Object.keys(whis.remedies).length === 6, 'WHISTLING, whooping cough, in: 6 ادویہ (p777 — باب کی آخری قطار، P778 COUGH اینکر سے پہلے)');
const srcList = srcEntries.map(k => data[k]);
const maxOrder = srcList.reduce((a, r) => (Number(r.source_order) > Number(a.source_order) ? r : a), srcList[0]);
assert.strictEqual(maxOrder.source_path, 'WHISTLING, whooping cough, in', 'source_order کی آخری قطار WHISTLING, whooping cough, in');

// 8) اگلا باب لیک نہیں
const leak = srcList.filter(r => /^COUGH/.test(r.source_path) || r.source_label === 'DAYTIME' || /^LARYNX/.test(r.source_path));
assert.strictEqual(leak.length, 0, 'COUGH/LARYNX لیک نہیں (اختتامی کٹ P778 اینکر پر)');

// 9) See-ref مینز (بے-ادویات) اپنی جگہ
const sc = findNode(tree, 'CONVULSIVE (See Paroxysmal)');
assert.ok(sc && Object.keys(sc.remedies).length === 0 && Number(sc.sourcePage) === 766, 'CONVULSIVE (See Paroxysmal): بے-ادویات See-ref مین (p766)');

// 10) اردو — 698/698 مکمل، جڑ-پیشوند، نمونے
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
assert.strictEqual(treeKeys.length, 698, 'درخت کلیدیں 698');
const treeRK = treeKeys.map(repRubKey);
const missing = treeRK.filter(k => !ur.rubrics[k]);
assert.strictEqual(missing.length, 0, 'اردو جملے غائب نہیں: ' + missing.slice(0, 3).join(' | '));
assert.strictEqual(ur.rubrics['respiration'], 'سانس — سانس', 'جڑ کا اردو «سانس — سانس»');
assert.ok(ur.rubrics['abdominal'] === 'سانس — پیٹ کے ذریعے (پیٹ سے)', 'ABDOMINAL کا اردو (پرانا جملہ منتقل)');
assert.ok(ur.rubrics['asthmatic, forenoon, 10 to 11 a.m.'] === 'سانس — دمے والا، دوپہر سے پہلے، 10 سے 11 بجے', 'وقت-فارمیٹ اردو «10 سے 11 بجے» (دستی جوڑا o54699 کا پرانا جملہ منتقل)');
assert.ok(!treeRK.some(k => !String(ur.rubrics[k]).startsWith('سانس — ')), 'ہر جملہ «سانس — » سے');
const latinBad = treeRK.filter(k => {
  const s = String(ur.rubrics[k]).replace('سانس — ', '');
  return /[A-Za-z]/.test(s.replace(/amel\.|agg\./g, ''));
});
assert.strictEqual(latinBad.length, 0, 'لاطینی صرف amel./agg. — ' + latinBad.slice(0, 3).join(' | '));

// 11) مانی فیسٹ + _index + tree-fix
assert.strictEqual(manifest.source_canonical, 'homeoint-resp-v1', 'مانی فیسٹ marker');
assert.strictEqual(manifest.source_rows, 698, 'مانی فیسٹ قطاریں 698');
assert.ok(/762 – 777|762-777|762–777/.test(manifest.pages), 'مانی فیسٹ صفحات 762–777');
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/_index.json'), 'utf8'));
const ix = idx.find(x => x.key === 'respiration');
assert.ok(ix && ix.rubrics === 762 && ix.name === 'RESPIRATION', '_index: respiration 762/RESPIRATION');
const tf = fs.readFileSync(path.join(ROOT, 'js/repertory/kent-tree-fix.js'), 'utf8');
const m = tf.match(/"respiration":\{"h":\[([^\]]*)\]/);
assert.ok(m, 'tree-fix میں respiration h فہرست');
const hIds = m[1] ? m[1].split(',').map(s => s.replace(/"/g, '')) : [];
assert.strictEqual(hIds.length, 64, 'tree-fix h = 64 legacy ids');
const legacy = Object.keys(data).filter(k => !data[k].source_canonical);
assert.ok(hIds.every(id => legacy.includes(id)), 'h فہرست کے تمام ids legacy ریکارڈ');

console.log('✓ kent_resp_homeoint_source.test.js — RESPIRATION ماخذی درخت 698/698 (v190) سب پاس');
