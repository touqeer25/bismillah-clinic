'use strict';
// tests/kent_lary_homeoint_source.test.js — v189: حلقوم اور سانس کی نالی باب (صفحات 746–762) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/larynx_and_trachea.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/larynx_and_trachea.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_lary_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-lary-v1');
assert.strictEqual(srcEntries.length, 668, 'ماخذی قطاریں: 668 (جڑ LARYNX AND TRACHEA + 667) — 11 دستاویزی clamps، کوئی کتابی دہرائی نہیں');
assert.strictEqual(Object.keys(data).length, 739, 'پرانی مقامی قطاریں فائل میں محفوظ (739 کل = 668 + 71)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_LARY_SOURCE_MARKER="homeoint-lary-v1",_REP_KENT_LARY_COUNT=668;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentLarySourceEntries') + grab('_repHasKentLarySourceData') + grab('_repBuildKentLarySourceTree'), ctx);
const build = vm.runInContext('_repBuildKentLarySourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentLarySourceData', ctx)(data), true, 'ماخذی ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 668, 'درخت کے ربرک 668');
assert.strictEqual(tree.order[0], 'LARYNX AND TRACHEA', 'باب کی جڑ LARYNX AND TRACHEA پہلی قطار');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 746 || p > 762) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 17, '17 صفحات (746–762، MEDI-T انتساب) مکمل: ' + pages.size);
assert.strictEqual(tree.order[1], 'ANÆSTHESIA, larynx', 'ANÆSTHESIA, larynx پہلا مین (p746)');

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (p746): ANÆSTHESIA, larynx {Kali-br.} — nav-text + separator slot-1/2 سے محفوظ جڑ
const ana = tree.children['ANÆSTHESIA, larynx'];
assert.ok(ana && ana.remedies['kali-br'] === 1 && Object.keys(ana.remedies).length === 1, 'ANÆSTHESIA, larynx: صرف Kali-br. (p746 — باب کا پہلا مین، P746 اینکر کے بعد)');
const can = findNode(tree, 'CANCER, larynx');
assert.ok(can && can.remedies['ars'] === 1 && can.remedies['thuj'] === 1 && Object.keys(can.remedies).length === 5, 'CANCER, larynx: 5 ادویہ (p746)');
const cat = findNode(tree, 'CATARRH');
assert.ok(cat && Object.keys(cat.remedies).length === 74 && cat.remedies['ant-t'] === 3, 'CATARRH: 74 ادویہ (p746 — باب کا سب سے بڑا ابتدائی مین)');
assert.ok(cat.order[0] === 'morning' && cat.order[1] === 'evening' && cat.children['morning'].remedies['nux-v'] === 1, 'CATARRH: morning (Nux-v.) پہلی ذیلی + evening (p746 — پہلا <dir> P746 سے 2372 bytes)');

// 4) clamps — 9 کتابی یتیم + 2 MEDI-T اضافی <dir> (x-coords ثابت)
// idx60: CRAWLING, larynx → morning (کتابی یتیم @128.7، p747)
const crm = findNode(tree, 'CRAWLING, larynx, morning');
assert.ok(crm && crm.remedies['iod'] === 1, 'CRAWLING, larynx, morning: Iod. (clamp idx60 d2→d1 — @128.7 کتابی یتیم، p747)');
const cre = findNode(tree, 'CRAWLING, larynx, evening');
assert.ok(cre && cre.remedies['carb-v'] === 1 && cre.order[0] === 'lying, after', 'CRAWLING, larynx, evening: Carb-v. + lying, after ذیلی (d3 @164.7 — p747)');
// idx426: SENSITIVE larynx → morning (MEDI-T اضافی <dir> @92.7=fixed، p756)
const sm = findNode(tree, 'SENSITIVE larynx, morning');
assert.ok(sm && sm.remedies['kali-bi'] === 1, 'SENSITIVE larynx, morning: Kali-bi. (clamp idx426 d2→d1 — @92.7 MEDI-T اضافی <dir>، p756)');
// idx368: PAIN stitching → swallowing, when (MEDI-T اضافی <dir> @164.7=fixed، p755)
const sw = findNode(tree, 'PAIN, larynx, stitching, larynx, swallowing, when');
assert.ok(sw && sw.remedies['brom'] === 2 && sw.remedies['mang'] === 3, 'PAIN, larynx, stitching, swallowing, when: Brom.2/Mang.3 (clamp idx368 d5→d3 — @164.7 MEDI-T اضافی <dir>، p755)');

// 5) دستی J=1.00 جوڑے (OOREP لیبل-فرق، ادویات عین)
const d23 = findNode(tree, 'DRYNESS, Larynx, night, 2 to 3 p.m.');
assert.ok(d23 && d23.remedies['kali-c'] === 2, 'DRYNESS, night, 2 to 3 p.m.: Kali-c.2 (دستی جوڑا o45443 — OOREP «2 p.m. to 3 p.m.» وقت-فارمیٹ، p748)');
const psv = findNode(tree, 'PAIN, larynx, stitching, larynx, vertex');
assert.ok(psv && psv.remedies['arg-m'] === 1, 'PAIN, stitching, vertex: Arg-m. (دستی جوڑا o45690 — OOREP «extending» سیگمنٹ کتاب میں نہیں، p755)');
const vco = findNode(tree, 'VOICE, barking, hoarseness, air, cold, open, in');
assert.ok(vco && vco.remedies['bry'] === 1 && vco.remedies['mang'] === 3 && vco.remedies['nux-m'] === 2, 'VOICE, hoarseness, air, cold, open, in: Bry./Mang.3/Nux-m.2 (دستی جوڑا o45859 — OOREP barking/cold حذف + agg.، p759)');
const vwk = findNode(tree, 'VOICE, barking, hoarseness, walking in open air');
assert.ok(vwk && vwk.remedies['osm'] === 1 && vwk.remedies['nux-m'] === 2 && Object.keys(vwk.remedies).length === 5, 'VOICE, hoarseness, walking in open air: 5 ادویہ (دستی جوڑا o45910 — OOREP agg.-لاحقہ، p760)');

// 6) MUCUS (p751 صفحہ-سرخی آرٹیفیکٹ 'MUCUS, larynx' skip — اصل مین 'MUCUS in the air passages')
const muc = findNode(tree, 'MUCUS in the air passages');
assert.ok(muc && Object.keys(muc.remedies).length === 73 && muc.remedies['ant-t'] === 1 && muc.remedies['alum'] === 2, 'MUCUS in the air passages: 73 ادویہ (p750 — MEDI-T صفحہ-سرخی «MUCUS, larynx» آرٹیفیکٹ skip)');
const mucl = muc && muc.children['Larynx'];
assert.ok(mucl && mucl.remedies['acon'] === 1 && Object.keys(mucl.remedies).length === 99, 'MUCUS in the air passages, Larynx: 99 ادویہ (p751 — consistency ذیلی See Expectoration)');

// 7) باب-اختتام (p762): WHISTLING آخری مین — lying on left side آخری ربرک
const whis = findNode(tree, 'WHISTLING, lying on left side');
assert.ok(whis && whis.remedies['arg-n'] === 1, 'WHISTLING, lying on left side: Arg-n. (p762 — باب کی آخری قطار، RESPIRATION اینکر سے پہلے)');
const srcList = srcEntries.map(k => data[k]);
const maxOrder = srcList.reduce((a, r) => (Number(r.source_order) > Number(a.source_order) ? r : a), srcList[0]);
assert.strictEqual(maxOrder.source_path, 'WHISTLING, lying on left side', 'source_order کی آخری قطار WHISTLING, lying on left side');

// 8) اگلا باب لیک نہیں
const leak = srcList.filter(r => /^RESPIRATION/.test(r.source_path) || r.source_label === 'ABDOMINAL' || /^GENITALIA/.test(r.source_path));
assert.strictEqual(leak.length, 0, 'RESPIRATION/GENITALIA لیک نہیں (اختتامی کٹ RESPIRATION اینکر پر)');

// 9) See-ref مینز (بے-ادویات) اپنی جگہ
const sc = findNode(tree, 'COATED, seems (See Velvety)');
assert.ok(sc && Object.keys(sc.remedies).length === 0, 'COATED, seems (See Velvety): بے-ادویات See-ref مین (p747)');

// 10) اردو — 668/668 مکمل، جڑ-پیشوند، نمونے
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
assert.strictEqual(treeKeys.length, 668, 'درخت کلیدیں 668');
const treeRK = treeKeys.map(repRubKey);
const missing = treeRK.filter(k => !ur.rubrics[k]);
assert.strictEqual(missing.length, 0, 'اردو جملے غائب نہیں: ' + missing.slice(0, 3).join(' | '));
assert.strictEqual(ur.rubrics['larynx and trachea'], 'حلقوم — حلقوم', 'جڑ کا اردو «حلقوم — حلقوم»');
assert.ok(ur.rubrics['anæsthesia, larynx'] === 'حلقوم — بے حسی، حلقوم', 'ANÆSTHESIA, larynx کا اردو (پرانا جملہ منتقل)');
assert.ok(!treeRK.some(k => !String(ur.rubrics[k]).startsWith('حلقوم — ')), 'ہر جملہ «حلقوم — » سے');
const latinBad = treeRK.filter(k => {
  const s = String(ur.rubrics[k]).replace('حلقوم — ', '');
  return /[A-Za-z]/.test(s.replace(/amel\.|agg\./g, ''));
});
assert.strictEqual(latinBad.length, 0, 'لاطینی صرف amel./agg. — ' + latinBad.slice(0, 3).join(' | '));

// 11) مانی فیسٹ + _index + tree-fix
assert.strictEqual(manifest.source_canonical, 'homeoint-lary-v1', 'مانی فیسٹ marker');
assert.strictEqual(manifest.source_rows, 668, 'مانی فیسٹ قطاریں 668');
assert.ok(/746 – 762|746-762|746–762/.test(manifest.pages), 'مانی فیسٹ صفحات 746–762');
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/_index.json'), 'utf8'));
const ix = idx.find(x => x.key === 'larynx_and_trachea');
assert.ok(ix && ix.rubrics === 739 && ix.name === 'LARYNX AND TRACHEA', '_index: larynx_and_trachea 739/LARYNX AND TRACHEA');
const tf = fs.readFileSync(path.join(ROOT, 'js/repertory/kent-tree-fix.js'), 'utf8');
const m = tf.match(/"larynx_and_trachea":\{"h":\[([^\]]*)\]/);
assert.ok(m, 'tree-fix میں larynx h فہرست');
const hIds = m[1] ? m[1].split(',').map(s => s.replace(/"/g, '')) : [];
assert.strictEqual(hIds.length, 71, 'tree-fix h = 71 legacy ids');
const legacy = Object.keys(data).filter(k => !data[k].source_canonical);
assert.ok(hIds.every(id => legacy.includes(id)), 'h فہرست کے تمام ids legacy ریکارڈ');

console.log('✓ kent_lary_homeoint_source.test.js — LARYNX AND TRACHEA ماخذی درخت 668/668 (v189) سب پاس');
