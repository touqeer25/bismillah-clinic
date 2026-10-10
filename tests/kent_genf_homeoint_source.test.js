'use strict';
// tests/kent_genf_homeoint_source.test.js — v188: تناسلی اعضاء (عورت) باب (صفحات 714–745) کا ماخذی درخت، ادویات، اردو
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/genitalia_female.json'), 'utf8'));
const ur = JSON.parse(fs.readFileSync(path.join(ROOT, 'ur/rubrics/kent/genitalia_female.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_sources/homeoint_genf_source_manifest.json'), 'utf8'));
const vm = require('vm');

// 1) ڈیٹا کی گنتی
const srcEntries = Object.keys(data).filter(k => data[k].source_canonical === 'homeoint-genf-v1');
assert.strictEqual(srcEntries.length, 1358, 'ماخذی قطاریں: 1358 (جڑ GENITALIA FEMALE + 1357) — 6 دستاویزی clamps، 1 کتابی دہرائی merge');
assert.strictEqual(Object.keys(data).length, 1493, 'پرانی مقامی قطاریں فائل میں محفوظ (1493 کل = 1358 + 135)');

// 2) ماخذی درخت — ایپ کے اصل بلڈر کے سخت جائزے کے ساتھ
const code = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-chapters.js'), 'utf8');
function grab(name) {
  const i = code.indexOf('function ' + name);
  let d = 0, j = code.indexOf('{', i);
  for (let k = j; k < code.length; k++) { if (code[k] === '{') d++; else if (code[k] === '}') { d--; if (!d) return code.slice(i, k + 1); } }
}
const pre = 'var _REP_KENT_GENF_SOURCE_MARKER="homeoint-genf-v1",_REP_KENT_GENF_COUNT=1358;';
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(pre + grab('_repKentGenfSourceEntries') + grab('_repHasKentGenfSourceData') + grab('_repBuildKentGenfSourceTree'), ctx);
const build = vm.runInContext('_repBuildKentGenfSourceTree', ctx);
assert.strictEqual(vm.runInContext('_repHasKentGenfSourceData', ctx)(data), true, 'ماخذی ڈیٹا پہچانا گیا');
const tree = build(data);
function count(n) { let c = n.hasRubric ? 1 : 0; for (const k of (n.order || [])) c += count(n.children[k]); return c; }
function maxDepth(n) { let m = 0; for (const k of (n.order || [])) m = Math.max(m, 1 + maxDepth(n.children[k])); return m; }
assert.strictEqual(count(tree), 1358, 'درخت کے ربرک 1358');
assert.strictEqual(tree.order[0], 'GENITALIA FEMALE', 'باب کی جڑ GENITALIA FEMALE پہلی قطار');
let pageOk = true; const pages = new Set();
srcEntries.forEach(k => { const p = Number(data[k].source_page); if (p < 714 || p > 745) pageOk = false; pages.add(p); });
assert.ok(pageOk && pages.size === 32, '32 صفحات (714–745، MEDI-T انتساب) مکمل: ' + pages.size);

// 3) نمونہ ہیراکی — ماخذی ساخت + باب-حد
function findNode(node, full) {
  for (const k of (node.order || [])) {
    const c = node.children[k];
    if (c.pathTitle === full) return c;
    const f = findNode(c, full); if (f) return f;
  }
  return null;
}
// باب-آغاز (p714): ABORTION پہلا مین {acon, bell, … 76 ادویہ}
const abo = tree.children['ABORTION'];
assert.ok(abo && abo.remedies['acon'] === 1 && abo.remedies['bell'] === 3 && Object.keys(abo.remedies).length === 76, 'ABORTION پہلا مین: 76 ادویہ (p714 — باب کا پہلا ربرک، FEMALE اینکر کے بعد)');
assert.ok(abo.order[0] === 'excitement' && abo.order.indexOf('fright, from') > 0, 'ABORTION: excitement پہلی ذیلی + fright, from (p715 انڈیکس اندراج)');
// p715 کی پہلی قطار (skip-سرحد پارسر فکس سے محفوظ)
const fr = findNode(tree, 'ABORTION, fright, from');
assert.ok(fr && fr.remedies['acon'] === 2 && fr.remedies['gels'] === 2 && fr.remedies['op'] === 2, 'ABORTION, fright, from: Acon./Gels./Op.2 (p715 — پارسر فکس سے بازیافت)');
// CONDYLOMATA itching (p716 انڈیکس اندراج — gلو فکس سے)
const cit = findNode(tree, 'CONDYLOMATA (See Excrescences), itching');
assert.ok(cit && cit.remedies['euphr'] === 1 && cit.remedies['sabin'] === 2, 'CONDYLOMATA, itching: Euphr./sabin.2 (p716 — <p>----------<dir> گلو فکس سے بازیافت)');
// DESIRE diminished (p716 — glued لیبل، app-legacy مطابق r98) + morning (clamp idx87)
const des = findNode(tree, 'DESIRE diminished');
assert.ok(des && Object.keys(des.remedies).length === 27 && des.remedies['agn'] === 2, 'DESIRE diminished: 27 ادویہ (p716 — glued لیبل کتابی عین @56.6، OOREP r98 بھی یہی)');
const desm = findNode(tree, 'DESIRE diminished, morning');
assert.ok(desm && desm.remedies['bell'] === 1, 'DESIRE diminished, morning: Bell. (clamp idx87 d2→d1 — @128.7، p716)');
// ENLARGED ovaries: right/left دونوں d1 بھائی (clamp idx121)
const enr = findNode(tree, 'ENLARGED ovaries (See Swollen), right');
const enl = findNode(tree, 'ENLARGED ovaries (See Swollen), left');
assert.ok(enr && enl && enr.remedies['lyc'] === 3 && enl.remedies['med'] === 2, 'ENLARGED ovaries: right Lyc.3 + left Med.2 — دونوں d1 بھائی (clamp idx121 — x=128.7=left)');
// MENSES, daytime only (p724 — کتاب میں bare MENSES نہیں)
const mdt = findNode(tree, 'MENSES, daytime only');
assert.ok(mdt && Object.keys(mdt.remedies).length === 6 && mdt.remedies['puls'] === 3, 'MENSES, daytime only: 6 ادویہ (p724 — bare MENSES کتاب میں نہیں، OOREP r430 یونین legacy)');
// کتابی دہرائی merge: PAIN, Ovaries, extending to abdomen — union (p732+p733)
const poa = findNode(tree, 'PAIN, Ovaries, extending to abdomen');
assert.ok(poa && poa.remedies['ham'] === 1 && poa.remedies['lil-t'] === 1 && poa.remedies['con'] === 1, 'PAIN, Ovaries, extending to abdomen: union {ham, lil-t, con} (کتابی دہرائی merge — p732+p733)');
// گہری ماخذی ساخت (d4 clamp idx650): PAIN, Ovaries, left → lying on left side agg. → amel.
const lam = findNode(tree, 'PAIN, Ovaries, left, lying on left side agg., amel.');
assert.ok(lam && lam.remedies['kali-p'] === 1, 'PAIN, Ovaries, left, lying on left side agg., amel.: Kali-p. (clamp idx650 d5→d4 — @236.7 کتابی یتیم، p732)');
// See-ref مینز بے-ادویات
assert.ok(tree.children['WARTS (See Condylomata)'], 'WARTS (See Condylomata) — See-ref مین (p745)');
assert.ok(findNode(tree, 'LEUCORRHŒA, excoriating (See Acrid)'), 'LEUCORRHŒA, excoriating (See Acrid) — See-ref (p722 انڈیکس اندراج، نئی hN)');
// PROLAPSUS (p743 — 91 ادویہ) + clamp idx1257
const pro = findNode(tree, 'PROLAPSUS uterus');
assert.ok(pro && Object.keys(pro.remedies).length === 91, 'PROLAPSUS uterus: 91 ادویہ (p743 — بڑا مین)');
const prm = findNode(tree, 'PROLAPSUS uterus, morning');
assert.ok(prm && prm.remedies['nat-m'] === 3 && prm.remedies['sep'] === 1, 'PROLAPSUS uterus, morning: Nat-m.3/Sep. (clamp idx1257 d2→d1 — x=128.7=afternoon، p743)');
// اختتام (p745): WEAKNESS, sensation of… — LARYNX AND TRACHEA سے بالکل پہلے
const wea = findNode(tree, 'WEAKNESS, sensation of, in region of uterus during passage of stool and urine');
assert.ok(wea && wea.remedies['calc-p'] === 2, 'WEAKNESS…stool and urine آخری قطار: Calc-p.2 (p745 — LARYNX AND TRACHEA باب سے بالکل پہلے)');
// LARYNX/GENITALIA MALE لیک نہیں
assert.ok(!findNode(tree, 'LARYNX AND TRACHEA'), 'LARYNX AND TRACHEA باب لیک نہیں (P746 کٹ)');
assert.ok(!findNode(tree, 'GENITALIA MALE'), 'GENITALIA MALE باب لیک نہیں (FEMALE اینکر کٹ)');

// 4) اردو فائل کی ساخت
assert.ok(Array.isArray(ur.locked) && ur.locked.length === 0, 'کوئی قفل نہیں');
assert.ok(Object.keys(ur.rubrics).length >= 1358, 'اردو فائل میں 1358+ فعال کلیدیں (684 غیر-درخت پرانی محفوظ): ' + Object.keys(ur.rubrics).length);

// 5) اردو: ہر فعال ربرک کا جملہ، جڑ «تناسلی اعضاء (عورت) — »
let miss = 0, badRoot = 0;
srcEntries.forEach(k => {
  const key = String(data[k].source_path).replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s*,\s*/g, ', ').replace(/\s+/g, ' ').trim().toLowerCase();
  const v = ur.rubrics[key];
  if (!v || !String(v).trim()) miss++;
  else if (String(v).indexOf('تناسلی اعضاء (عورت) — ') !== 0) badRoot++;
});
assert.strictEqual(miss, 0, 'ہر ماخذی ربرک کا اردو جملہ موجود');
assert.strictEqual(badRoot, 0, 'ہر جملہ «تناسلی اعضاء (عورت) — » سے شروع');
assert.ok(Array.isArray(ur.meta.auto) && ur.meta.auto.length === 21, '21 خود-بنے (ہاتھ سے لکھے — meta.auto): ' + (ur.meta.auto || []).length);
// ہاتھ-لکھے جملے
assert.ok(ur.rubrics['coition, aversion to, enjoyment absent, easy'] === 'تناسلی اعضاء (عورت) — جماع، نفرت، لذت (مزہ) غائب دھن، دل کی جوشی آسان', 'ہاتھ-لکھا: enjoyment absent, easy');
assert.ok(ur.rubrics['movements like a fœtus'] === 'تناسلی اعضاء (عورت) — جنین جیسی حرکات', 'ہاتھ-لکھا: movements like a fœtus');
assert.ok(ur.rubrics['pain, burning, uterus, as if something had burst'] === 'تناسلی اعضاء (عورت) — درد، جلتا ہوا، رحم، جیسے کچھ پھٹ گیا ہو', 'ہاتھ-لکھا: as if something had burst');
assert.ok(ur.rubrics['pain, ovaries, extending to abdomen, small of back'] === 'تناسلی اعضاء (عورت) — درد، بیضہ دانیاں، پیٹ تک پھیلتا ہوا، کمر کے نچلے حصے تک', 'ہاتھ-لکھا: small of back');
// پاتھ-ہم آہنگی: نئے راستے پر مکمل جملہ (والدین کے نیا جملہ + لیبل)
assert.ok(ur.rubrics['abortion, month, second, third'] === 'تناسلی اعضاء (عورت) — اسقاطِ حمل، مہینہ، دوسرا، تیسرا', 'نئے راستے کا جملہ: abortion, month, second, third (پاتھ-ہم آہنگی)');

// 6) مانی فیسٹ + _index
assert.strictEqual(manifest.source_canonical, 'homeoint-genf-v1');
assert.strictEqual(manifest.source_rows, 1358);
assert.strictEqual(manifest.matched_app_records, 1336);
assert.strictEqual(manifest.new_source_records, 22);
assert.strictEqual(manifest.legacy_local_records, 135);
const idx = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/_index.json'), 'utf8'));
const gfe = idx.find(x => x.key === 'genitalia_female');
assert.ok(gfe && gfe.name === 'GENITALIA FEMALE' && gfe.rubrics === 1493, '_index: GENITALIA FEMALE/1493');

console.log('kent_genf_homeoint_source.test.js: تمام جائزے کامیاب');
