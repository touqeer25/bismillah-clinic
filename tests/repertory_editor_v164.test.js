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

// حوالہ جاتی عبارت دکھائی جانے والی مکمل راہ سے نکلے، مگر کھولتے وقت فائل خود نہ بدلے
const referenceDoc = {
  p0:{t:'ABSENT-MINDED (See Forgetful)',source_label:'ABSENT-MINDED (See Forgetful)',source_parent_id:null,source_order:0,r:{AAA:3},extra:'محفوظ'},
  p1:{t:'ABSENT-MINDED (See Forgetful), morning (See daybreak)',source_label:'morning (See daybreak)',source_parent_id:'p0',source_order:1,r:{BBB:2}},
  p2:{t:'ABSENT-MINDED (See Forgetful), morning (See daybreak), while reading (See Reading)',source_label:'while reading (See Reading)',source_parent_id:'p1',source_order:2,r:{CCC:1}}
};
const referenceBefore = core.clone(referenceDoc);
const referenceModel = core.analyzeChapter(referenceDoc, core.keyFallback);
assert.strictEqual(referenceModel.byId.p0.fullPath, 'ABSENT-MINDED');
assert.strictEqual(referenceModel.byId.p1.fullPath, 'ABSENT-MINDED, morning');
assert.strictEqual(referenceModel.byId.p2.fullPath, 'ABSENT-MINDED, morning, while reading');
assert.strictEqual(core.canSetParent(referenceModel, 'p2', null), true, 'جڑ جائز والد ہے');
assert.strictEqual(core.canSetParent(referenceModel, 'p2', 'p0'), true, 'جائز بزرگ والد منتخب ہو سکتا ہے');
assert.strictEqual(core.canSetParent(referenceModel, 'p0', 'p0'), false, 'ربرک خود اپنا والد نہیں');
assert.strictEqual(core.canSetParent(referenceModel, 'p0', 'p2'), false, 'اولاد اپنا والد نہیں بن سکتی');
assert.strictEqual(core.canSetParent(referenceModel, 'p0', 'missing'), false, 'ناموجود شناخت جائز والد نہیں');
assert.deepStrictEqual(referenceDoc, referenceBefore, 'صرف پڑھنے پر اصل حوالہ جاتی متن برقرار ہے');
assert.deepStrictEqual(core.splitFullPath('ABSENT-MINDED (See Forgetful), morning (See daybreak)', 'ABSENT-MINDED (See Forgetful)'), {label:'morning',separator:', '});
assert.strictEqual(core.splitFullPath('OTHER, morning', 'ABSENT-MINDED'), null, 'غلط والد والے راستے کو مسترد کیا');
core.refreshPaths(referenceModel, referenceDoc);
assert.strictEqual(referenceDoc.p0.t, 'ABSENT-MINDED');
assert.strictEqual(referenceDoc.p2.t, 'ABSENT-MINDED, morning, while reading');
assert.strictEqual(referenceDoc.p1.source_label, 'morning (See daybreak)', 'حوالہ جاتی اصل لیبل محفوظ ہے مگر مکمل راستے میں نہیں');
assert.strictEqual(referenceDoc.p0.extra, referenceBefore.p0.extra);
assert.deepStrictEqual(referenceDoc.p0.r, referenceBefore.p0.r);
pass(true, 'مکمل راستے حوالہ جاتی عبارت سے پاک؛ اصل فائل صرف ساختی محفوظ کاری پر بدلی');

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
pass(/function mountToolbarControls\([\s\S]*?rpe-tree-actions','rpeToolActions'[\s\S]*?rpe-parent-field','rpeToolHierarchy'[\s\S]*?rpe-remedy-add/.test(editor), 'موجودہ اوزار نئی الگ سطح بنائے بغیر منتخب ربرک کی پٹی میں جمع ہیں');
pass(/id="rpeFullPath" class="rpe-fullpath"[^>]*disabled/.test(read('index.html')) && /function changeFullPath\([\s\S]*?pathWithoutReferences[\s\S]*?splitFullPath/.test(editor), 'مکمل راستہ قابلِ تدوین ہے اور حوالہ جاتی عبارت خارج ہوتی ہے');
pass(/id="rpeMoveParent" data-rpe-action="move-parent"/.test(read('index.html')) && /id="rpeMoveUnder" data-rpe-action="move-under-parent"/.test(read('index.html')) && /function moveOneParentUp\([\s\S]*?oldParent\.parentId[\s\S]*?node\.parentId=grandParentId/.test(editor), 'ایک درجہ اوپر اور منتخب والد کے نیچے بنانے کے الگ اختیار موجود ہیں');
pass(/function renderParentOptions\([\s\S]*?core\.canSetParent\(state\.chapter\.model,node\.id,id\)/.test(editor) && /function changeParent\([\s\S]*?core\.canSetParent\(state\.chapter\.model,id,parentId\)/.test(editor), 'اپنی اولاد کو والد بنانے سے پہلے اور عمل کے وقت چکر روکا جاتا ہے');
pass(/display:rec\.display/.test(chapters) && /n\.display ?= ?e\.rec\.display/.test(chapters), 'باب کے ظاہری خواص درخت تک پہنچتے ہیں');
pass(/data-rpe-weight/.test(tree) && /data-rpe-size/.test(tree), 'درخت میں وزن اور حجم دکھانے کی نشانیاں ہیں');
pass(/display:rub\.display/.test(search) && /repSearchDisplayStyleAttrs/.test(search), 'تلاش کے نتائج میں ظاہری انداز دکھتا ہے');
pass(/repDetailStyleAttrs\(node\)/.test(detail), 'ربرک کی تفصیل میں ظاہری انداز دکھتا ہے');
pass(/repXrefUrHtml/.test(read('js/18-rubrics-ur.js')) && /_xref_ur\.json/.test(read('js/18-rubrics-ur.js')) && /rep-xref-ur/.test(read('css/rubric-ur.css')), 'تازہ مخزن کا اردو حوالہ جاتی اشارہ اور اس کا انداز برقرار ہے');
pass(/REP_RUBUR_V = '165'/.test(read('js/18-rubrics-ur.js')) && /REP_DATA_V='v=19'/.test(read('js/repertory/rep-books.js')), 'تازہ مخزن کے اردو اور بابی مواد کے نسخے برقرار ہیں');

// بدلی فائلوں کے نسخے، خدمت کار اثاثے اور آزمائشی پن ایک دوسرے سے ملتے ہیں
const html = read('index.html');
const worker = read('service-worker.js');
const oldTest = read('tests/rubrics_ur_v107.test.js');
for (const [file, version] of [
  ['repertory-editor.css',166],
  ['rubric-ur.css',103],
  ['repertory-tabs.css',173],
  ['rep-editor.js',166],
  ['18-rubrics-ur.js',165],
  ['rep-books.js',81],
  ['rep-tabs.js',173],
  ['rep-chapters.js',173],
  ['rep-tree.js',149],
  ['rep-search.js',153],
  ['rep-rubric-detail.js',105]
]) pass(new RegExp(file.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')+'\\?v='+version).test(html), file+' کا نسخہ');
pass(/CACHE_NAME='bhc-clinic-v173'/.test(worker), 'خدمت کار کا نسخہ 164');
pass(worker.includes("'./css/repertory-editor.css'") && worker.includes("'./js/repertory/rep-editor.js'"), 'ترمیم کار کے دونوں اثاثے خدمت کار میں');
pass(/rep-chapters\\\.js\\\?v=173/.test(oldTest) && /rep-tree\\\.js\\\?v=149/.test(oldTest) && /rep-search\\\.js\\\?v=153/.test(oldTest) && /rep-rubric-detail\\\.js\\\?v=105/.test(oldTest), 'پرانے آزمائشی مجموعے کے نسخہ پن تازہ ہیں');
pass(oldTest.includes("CACHE_NAME='bhc-clinic-v173'") && oldTest.includes('rubric-ur\\.css\\?v=103') && oldTest.includes('repertory-tabs\\.css\\?v=173') && oldTest.includes('repertory-editor\\.css\\?v=166') && oldTest.includes('18-rubrics-ur\\.js\\?v=165') && oldTest.includes('rep-books\\.js\\?v=81') && oldTest.includes('rep-tabs\\.js\\?v=173') && oldTest.includes('rep-editor\\.js\\?v=166'), 'اردو آزمائش میں تازہ مخزن اور موجودہ اطلاق کے نسخہ پن تازہ ہیں');

console.log('ریپرٹری ترمیم کار کی مخصوص جانچ کامیاب');
