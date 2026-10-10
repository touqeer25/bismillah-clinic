'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const core = require('../js/repertory/rep-editor.js');
function read(rel){ return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
function pass(condition, message){ assert.ok(condition, message); }

// صرف مجاز ذہنی باب پڑھا گیا؛ باب کو کسی صورت نہیں لکھا جاتا
const sourceText = read('kent_chapters/mind.json');
const mind = JSON.parse(sourceText);
const sourceBefore = JSON.stringify(mind);
const model = core.analyzeChapter(mind, core.keyFallback);
const checked = core.validateModel(model, core.keyFallback);
assert.strictEqual(model.kind, 'record-map');
assert.strictEqual(model.nodes.length, 4358);
assert.deepStrictEqual(model.fields, {parent:'source_parent_id',label:'source_label',order:'source_order',remedies:'r'});
assert.deepStrictEqual(checked.errors, []);
assert.deepStrictEqual(checked.warnings, []);
assert.strictEqual(JSON.stringify(mind), sourceBefore, 'باب کی اصل نقل بدلی نہیں');
pass(true, 'مجاز ذہنی باب کی ساخت اور صرف مطالعہ جانچ کامیاب');

// چھوٹے نمونے میں عنوان بدلنے سے پورا راستہ تازہ ہو، مگر نامعلوم خواص محفوظ رہیں
const sample = {
  r1:{t:'ROOT',source_label:'ROOT',source_parent_id:null,source_order:0,r:{AAA:3},extra:{keep:true}},
  r2:{t:'ROOT, child',source_label:'child',source_parent_id:'r1',source_order:1,r:{BBB:2},extra:'محفوظ'}
};
const sampleBefore = core.clone(sample);
const sm = core.analyzeChapter(sample, core.keyFallback);
sm.byId.r1.label = 'NEW ROOT';
sample.r1.source_label = 'NEW ROOT';
core.refreshPaths(sm, sample);
assert.strictEqual(sample.r1.t, 'NEW ROOT');
assert.strictEqual(sample.r2.t, 'NEW ROOT, child');
assert.deepStrictEqual(sample.r1.extra, sampleBefore.r1.extra);
assert.strictEqual(sample.r2.extra, sampleBefore.r2.extra);
assert.deepStrictEqual(sample.r2.r, sampleBefore.r2.r);
pass(true, 'راستہ تازہ کرنے پر نامعلوم خواص اور ادویہ محفوظ');

// اردو عبارت بدلنے کا نمونہ تعارف، قفل فہرست اور نامعلوم خواص کو جوں کا توں رکھتا ہے
const translation = {
  introduction:{source:'test',note:'محفوظ تعارف'},
  locked:['root'],
  rubrics:{root:'پرانا جملہ',child:'بچوں کا جملہ'},
  unknown:{retain:7}
};
const trBefore = core.clone(translation);
const trModel = core.analyzeTranslation(translation);
assert.strictEqual(trModel.kind, 'rubric-map');
trModel.rubrics.child = 'نیا جملہ';
assert.strictEqual(translation.rubrics.child, 'نیا جملہ');
assert.strictEqual(translation.rubrics.root, trBefore.rubrics.root);
assert.deepStrictEqual(translation.introduction, trBefore.introduction);
assert.deepStrictEqual(translation.locked, trBefore.locked);
assert.deepStrictEqual(translation.unknown, trBefore.unknown);
pass(true, 'ترجمہ بدلنے سے تعارف، قفل فہرست اور نامعلوم خواص محفوظ');

// نامعلوم ترجمہ متن صرف مطالعے کے لیے ہے اور اس پر خام تبدیلی بند ہے
const editor = read('js/repertory/rep-editor.js');
const chapters = read('js/repertory/rep-chapters.js');
const tree = read('js/repertory/rep-tree.js');
const search = read('js/repertory/rep-search.js');
const detail = read('js/repertory/rep-rubric-detail.js');
pass(/translationArea\.readOnly=true/.test(editor), 'ترجمہ خام خانہ صرف مطالعہ ہے');
pass(/if\(kind==='translation'\)\{notify\([\s\S]*?return;\}/.test(editor), 'خام ترجمہ لاگو کرنے کا راستہ بند ہے');
pass(/translationRawUnknown/.test(editor), 'ناواقف ترجمہ ساخت صرف مطالعے کے طور پر واضح ہے');
pass(/beforeunload/.test(editor), 'غیر محفوظ مسودے پر صفحہ بند کرنے کی تنبیہ ہے');
pass(/typeof root\.repRubKey==='function'\?root\.repRubKey:null/.test(editor), 'ترجمہ کلید منظور شدہ کلید ساز سے بنتی ہے');
pass(/display:rec\.display/.test(chapters) && /n\.display ?= ?e\.rec\.display/.test(chapters), 'باب کے ظاہری خواص درخت تک پہنچتے ہیں');
pass(/data-rpe-weight/.test(tree) && /data-rpe-size/.test(tree), 'درخت میں وزن اور حجم دکھانے کی نشانیاں ہیں');
pass(/display:rub\.display/.test(search) && /repSearchDisplayStyleAttrs/.test(search), 'تلاش کے نتائج میں ظاہری انداز دکھتا ہے');
pass(/repDetailStyleAttrs\(node\)/.test(detail), 'ربرک کی تفصیل میں ظاہری انداز دکھتا ہے');

// بدلی فائلوں کے نسخے، خدمت کار اثاثے اور آزمائشی پن ایک دوسرے سے ملتے ہیں
const html = read('index.html');
const worker = read('service-worker.js');
const oldTest = read('tests/rubrics_ur_v107.test.js');
for (const [file, version] of [
  ['repertory-editor.css',166],
  ['rep-editor.js',166],
  ['rep-chapters.js',192],
  ['rep-tree.js',149],
  ['rep-search.js',153],
  ['rep-rubric-detail.js',105]
]) pass(new RegExp(file.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'\\?v='+version).test(html), file+' کا نسخہ');
pass(/CACHE_NAME='bhc-clinic-v192'/.test(worker), 'خدمت کار کا نسخہ 163');
pass(worker.includes("'./css/repertory-editor.css'") && worker.includes("'./js/repertory/rep-editor.js'"), 'ترمیم کار کے دونوں اثاثے خدمت کار میں');
pass(/rep-chapters\\\.js\\\?v=192/.test(oldTest) && /rep-tree\\\.js\\\?v=149/.test(oldTest) && /rep-search\\\.js\\\?v=153/.test(oldTest) && /rep-rubric-detail\\\.js\\\?v=105/.test(oldTest), 'پرانے آزمائشی مجموعے کے نسخہ پن تازہ ہیں');

console.log('ریپرٹری ترمیم کار کی مخصوص جانچ کامیاب');
