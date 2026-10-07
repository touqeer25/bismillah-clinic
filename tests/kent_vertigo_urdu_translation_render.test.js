// چکر باب: صرف اسی باب کے ماخذی درخت، ادویات، اردو اور نسخہ جاتی نشان کی آزمائش
'use strict';
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const L=require('../tools/rubrics_ur_lib.js');
const ROOT=L.R;
const MARKER='homeoint-vertigo-v1';
const chapter=JSON.parse(fs.readFileSync(path.join(ROOT,'kent_chapters/vertigo.json'),'utf8'));
const translation=L.readUr('kent','vertigo');
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'kent_sources/homeoint_vertigo_source_manifest.json'),'utf8'));
const corrections=fs.readFileSync(path.join(ROOT,'kent_sources/vertigo_translation_corrections.tsv'),'utf8').trimEnd().split(/\r?\n/);
const w=L.appWindow();
w.currentLang='ur';
w.repCurrentBook='kent';
w.repCurrentChapter='vertigo';
w.repRubUrStore('kent','vertigo',translation);
const rows=L.chapterRows(w,'kent','vertigo');
const source=Object.entries(chapter)
  .filter(([,r])=>r&&r.source_canonical===MARKER)
  .map(([id,r])=>({id,r}))
  .sort((a,b)=>a.r.source_order-b.r.source_order);

assert.strictEqual(Object.keys(chapter).length,568,'تمام پرانی مقامی قطاریں محفوظ رہیں (568 = 567 + باب کی جڑ)');
assert.strictEqual(source.length,430,'ماخذی قطاروں کی درست تعداد (429 + باب کی جڑ VERTIGO)');
assert.strictEqual(Object.keys(chapter).length-source.length,138,'ماخذ سے نہ ملنے والی 138 پرانی قطاریں محفوظ رہیں');
assert.strictEqual(rows.length,430,'ایپ میں صرف اصل ماخذی درخت کی 430 قطاریں');
assert.strictEqual(manifest.source_crosswalk.source_rubric_rows,430);
assert.strictEqual(manifest.source_crosswalk.chapter_heading_rows_excluded,0);
assert.strictEqual(manifest.source_crosswalk.initial_crosswalk_rows,395);
assert.strictEqual(manifest.source_crosswalk.unique_exact_remedy_grade_rows,28);
assert.strictEqual(manifest.source_crosswalk.manually_reviewed_title_context_rows,6);
assert.strictEqual(manifest.source_crosswalk.new_source_rubrics_added,1);
assert.strictEqual(manifest.source_crosswalk.existing_local_rows_preserved_outside_source_tree,138);
assert.deepStrictEqual(manifest.source_crosswalk.source_path_based_depth_correction_orders,[146,270,271,272]);
assert.strictEqual(translation.meta.root,'چکر — ');
assert.strictEqual(translation.meta.count,430,'ترجمہ کلیدیں: 429 ماخذی + باب کی جڑ (v165)');
assert.strictEqual(translation.locked.length,0);
assert.strictEqual(rows[0].full,'VERTIGO','باب کی جڑ پہلی قطار ہو (ماخذ صفحہ 96)');
assert.strictEqual(source[0].id,'m63048','باب کی جڑ کا شناخت');
assert.strictEqual(Object.keys(source[0].r.r).length,283,'باب کی جڑ کی 283 ادویات (homeoint صفحہ 96)');
assert.strictEqual(source[0].r.source_page,96,'باب کی جڑ صفحہ 96 سے');

const sourceById=new Map(source.map(x=>[x.id,x.r]));
const activeKeys=new Set();
for(let i=0;i<source.length;i++){
  const {id,r}=source[i], row=rows[i];
  assert.strictEqual(r.source_order,i,'ماخذی ترتیب مسلسل رہے');
  assert(r.source_page>=96&&r.source_page<=106,'صفحہ مجاز حد میں ہو');
  assert.strictEqual(r.source_path_labels[r.source_path_labels.length-1],r.source_label,'آخری عنوان اور راستہ ملیں');
  assert.strictEqual(r.source_depth,r.source_path_labels.length-1,'درختی گہرائی مکمل راستے سے نکلے');
  assert.strictEqual(r.source_path,r.source_path_labels.join(', '),'ماخذی مکمل راستہ درست ہو');
  assert.strictEqual(row.full,r.source_path,'ایپ میں ماخذی عنوان اور راستہ دکھے');
  assert.strictEqual(row.label,r.source_label,'ایپ میں ماخذی آخری عنوان دکھے');
  assert.strictEqual(row.depth,r.source_depth,'ایپ میں ماخذی درختی گہرائی درست ہو');
  assert.strictEqual(row.translationFull,r.translation_title,'موجودہ ترجمہ کلید کا ربط برقرار ہو');
  assert.strictEqual(row.key,w.repRubKey(r.translation_title),'ترجمہ کلید صرف منظور شدہ کلید ساز سے بنے');
  assert.strictEqual(row.displayKey,w.repRubKey(r.source_path),'دکھایا ہوا ماخذی راستہ درست کلید دے');
  assert.strictEqual(row.rems,Object.keys(r.source_remedies).length,'ایپ میں ماخذی دوائیں دکھیں');
  assert(!activeKeys.has(row.key),'ہر فعال قطار کی ترجمہ کلید منفرد ہو');
  activeKeys.add(row.key);
  assert(translation.rubrics[row.key],'ہر فعال ماخذی قطار کا اردو ترجمہ موجود ہو: '+r.source_path);
  if(i===0){ assert.strictEqual(translation.rubrics[row.key],'چکر','باب کی جڑ کا جملہ خود «چکر» ہو'); }
  else{ assert(translation.rubrics[row.key].startsWith('چکر — '),'ہر جملہ باب کی جڑ سے شروع ہو'); }
  assert(!/[A-Za-z]{2,}/.test(translation.rubrics[row.key]),'اردو ترجمے میں انگریزی لفظ نہ ہو: '+r.source_path);
  assert(!/[۰-۹٠-٩]/.test(translation.rubrics[row.key]),'اردو ہندسے نہ ہوں: '+r.source_path);
  assert(!translation.rubrics[row.key].endsWith('۔'),'قدر کے آخر میں نقطہ نہ ہو');
  const parentId=r.source_parent_id;
  if(r.source_depth===0){
    assert.strictEqual(parentId,null,'جڑ کے اوپر والد نہ ہو');
  }else{
    const parent=sourceById.get(String(parentId));
    assert(parent,'ہر بچے کا ماخذی والد موجود ہو');
    assert(parent.source_order<i,'والد بچے سے پہلے آئے');
    assert.strictEqual(r.source_path,parent.source_path+', '+r.source_label,'والد اور بچہ ایک ہی راستہ بنائیں');
  }
  for(const [code,grade] of Object.entries(r.source_remedies)){
    assert(code.length>0&&[1,2,3].includes(Number(grade)),'دوا اور درجہ درست ہو: '+r.source_path);
  }
  assert(r.t&&r.r&&typeof r.t==='string'&&typeof r.r==='object','اصل مقامی عنوان اور دوا کا نقشہ محفوظ ہو');
}

function row(full){const found=rows.find(r=>r.full===full);assert(found,'درختی صف موجود ہو: '+full);return found;}
const warm=row('WARM bed amel.');
const warmRoom=row('WARM bed amel., room');
const warmEntering=row('WARM bed amel., room, entering, on');
const warmSoup=row('WARM bed amel., soup amel.');
assert.strictEqual(warmRoom.parentKey,w.repRubKey(warm.full));
assert.strictEqual(warmEntering.parentKey,w.repRubKey(warmRoom.full));
assert.strictEqual(warmSoup.parentKey,w.repRubKey(warm.full));
assert(rows.indexOf(warmRoom)<rows.indexOf(warmSoup),'ماخذی ترتیب میں کمرہ سوپ سے پہلے آئے');
assert.strictEqual(row('HOUSE, in, amel.').depth,1,'خالی ماخذی خانے کا سرکا ہوا درجہ درست ہو');
assert.strictEqual(row('READING, while, aloud').depth,1,'صفحہ 102 کا سرکا ہوا درجہ درست ہو');

const warmHtml=w.repRubUrRowHtml(warmRoom);
const enteringHtml=w.repRubUrRowHtml(warmEntering);
assert(/rub-base/.test(warmHtml)&&/rub-delta/.test(warmHtml),'گرم کمرے کی صف میں والد اور اضافہ درست جڑیں');
assert(/rub-base/.test(enteringHtml)&&/rub-delta/.test(enteringHtml),'کمرے میں داخل ہونے کی صف میں پورا راستہ درست جڑے');
assert(warmHtml.includes('گرم بستر سے آرام')&&warmHtml.includes('گرم کمرے میں'));

assert.strictEqual(corrections[0],'key\tur','درستیوں کی فہرست درست عنوان سے شروع ہو');
assert.strictEqual(corrections.length-1,112,'112 منظور شدہ عبارتیں ضم کرنے کے لیے درج ہوں');
for(const line of corrections.slice(1)){
  const [key,value]=line.split('\t');
  assert(activeKeys.has(key),'درستی کی کلید فعال ماخذی درخت میں ہو: '+key);
  assert(value&&value.startsWith('=چکر — '),'درستی پورا جملہ ہو اور باب کی جڑ سے شروع ہو');
  assert(!value.endsWith('۔'),'درستی کے آخر میں نقطہ نہ ہو');
}

const index=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const urJs=fs.readFileSync(path.join(ROOT,'js/18-rubrics-ur.js'),'utf8');
const sw=fs.readFileSync(path.join(ROOT,'service-worker.js'),'utf8');
const repertoryJs=fs.readFileSync(path.join(ROOT,'js/repertory/rep-chapters.js'),'utf8');
const sharedTest=fs.readFileSync(path.join(ROOT,'tests/rubrics_ur_v107.test.js'),'utf8');
assert(/js\/18-rubrics-ur\.js\?v=160/.test(index),'صفحے میں اردو مواد کا نیا نسخہ');
assert(/rep-chapters\.js\?v=152/.test(index),'صفحے میں چکر درخت کا نسخہ (v152)');
assert(/REP_RUBUR_V\s*=\s*'160'/.test(urJs),'اردو مواد کا نسخہ 160');
assert(/CACHE_NAME='bhc-clinic-v168'/.test(sw),'خدمت کار کا نیا محفوظ نسخہ');
assert(/v147: چکر باب/.test(repertoryJs),'چکر درخت کی تبدیلی درج ہو');
assert(sharedTest.includes("REP_RUBUR_V = '160'")&&sharedTest.includes('bhc-clinic-v168')&&sharedTest.includes('18-rubrics-ur.js?v=160'),'وسیع آزمائش کے نسخہ جاتی نشان تازہ ہوں');
assert(/16\\d/.test(sharedTest),'مشترک آزمائش کی محفوظ نسخہ جانچ 16x کو قبول کرے');

console.log('چکر باب کی ماخذی درخت، 430 ترجمہ ربط، دوا، نمونہ جاتی دکھائی، 112 درستیوں، باب کی جڑ کی بحالی، اور نسخہ جاتی آزمائشیں کامیاب');
