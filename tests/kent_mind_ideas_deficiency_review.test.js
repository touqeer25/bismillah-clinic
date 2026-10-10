'use strict';

// صرف ذہنی باب کی خیالات کی کمی والی نظرثانی: درخت، ماخذی ربط، اردو اور نسخہ
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const ROOT=path.resolve(__dirname,'..');
const readJson=file=>JSON.parse(fs.readFileSync(path.join(ROOT,file),'utf8'));
const mind=readJson('kent_chapters/mind.json');
const ur=readJson('ur/rubrics/kent/mind.json');
const paths=readJson('kent_search_paths/mind.json');
const override=readJson('kent_sources/kent_mind_ideas_deficiency_tree_override.json');
const manifest=readJson('kent_sources/homeoint_mind_source_manifest.json');
const candidates=readJson('kent_sources/homeoint_mind_candidates.json');
const candidateByOrder=new Map(candidates.map(row=>[row.source_order,row]));
const localByOrder=new Map(Object.entries(mind).map(([id,row])=>[row.source_order,{id,row}]));

assert.strictEqual(Object.keys(mind).length,4358,'ذہنی باب کی قطاریں: ماخذ 4356 + 2 سرخی-ربرکس (v157)');
assert.strictEqual(ur.meta.count,4358,'فعال اردو کلیدیں: نئے ربرکس سمیت (v157)');
assert.strictEqual(Object.keys(ur.rubrics).length,4358,'درست راستے، اضافی یا غائب کلید نہیں (v157)');
assert.strictEqual(ur.meta.untranslated_count,0);
assert.strictEqual(ur.locked.length,0);
assert.strictEqual(override.review_id,'mind-ideas-deficiency-2026-10-05');
assert.strictEqual(override.rows.length,4);
assert.strictEqual(manifest.user_reviewed_tree_overrides.review_id,override.review_id);
assert.strictEqual(manifest.user_reviewed_tree_overrides.source_candidate_snapshot_unchanged,true);
assert.strictEqual(paths.tree_fix_version,'147');
assert.strictEqual(paths.display_tree_override_count,2);

const expected=[
  {order:2528,id:'h2528',title:'IDEAS, deficiency of',path:['IDEAS','deficiency of'],parent:null,ur:'خیالات کی کمی'},
  {order:2529,id:'o48406',title:'IDEAS, deficiency of, extra exertion, on',path:['IDEAS','deficiency of','extra exertion, on'],parent:'h2528',ur:'خیالات کی کمی — زیادہ محنت پر'},
  {order:2530,id:'o48407',title:'IDEAS, deficiency of, interruption, from any',path:['IDEAS','deficiency of','interruption, from any'],parent:'h2528',ur:'خیالات کی کمی — کسی بھی رکاوٹ کی وجہ سے'},
  {order:2531,id:'o48408',title:'IDEAS, deficiency of, vomiting amel.',path:['IDEAS','deficiency of','vomiting amel.'],parent:'h2528',ur:'خیالات کی کمی — قے آنے سے بہتری'}
];
for(const item of expected){
  const {id,row}=localByOrder.get(item.order);
  const source=candidateByOrder.get(item.order);
  assert.strictEqual(id,item.id,'پہچان محفوظ رہے');
  assert.strictEqual(row.t,item.title,'درست مکمل راستہ');
  assert.strictEqual(row.source_order,item.order,'اصل مطبوعہ ترتیب محفوظ');
  assert.strictEqual(row.source_parent_id,item.parent,'درست والد');
  assert.strictEqual(row.tree_override_id,override.review_id,'منظور شدہ استثنا صاف درج ہو');
  assert.deepStrictEqual(paths.entries[id].path,item.path,'تلاش اور دکھائی کا راستہ');
  assert.strictEqual(paths.entries[id].order,item.order+1,'تلاش کی اصل کتابی ترتیب');
  assert.strictEqual(ur.rubrics[item.title.toLowerCase()],item.ur,'منظور شدہ اردو عبارت');
  const remedies={};
  for(const remedy of source.remedies){
    const code=String(remedy.name).toLowerCase().replace(/æ/g,'ae').replace(/œ/g,'oe').replace(/[^a-z0-9-]/g,'');
    remedies[code]=remedy.grade;
  }
  assert.deepStrictEqual(row.r,remedies,'دوائیں اور درجے اصل امیدوار عکس جیسے ہی رہیں');
}

const superseded=[
  'ideas abundant, clearness of mind, deficiency of',
  'ideas abundant, clearness of mind, deficiency of, extra exertion, on',
  'ideas abundant, clearness of mind, deficiency of, interruption, from any',
  'ideas abundant, clearness of mind, deficiency of, vomiting amel.'
];
for(const key of superseded) assert(!Object.prototype.hasOwnProperty.call(ur.rubrics,key),'پرانا غلط راستہ دوبارہ فعال نہ ہو');

const context={
  window:{},console:console,localStorage:{getItem:()=>null,setItem:()=>{}},
  escapeHtml:value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])),
  REP_BOOK_INFO:{kent:{tree:'prefix',chapDir:'kent_chapters/'}},repCurrentBook:'kent',repCurrentChapter:'mind',currentLang:'ur'
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT,'js/repertory/kent-tree-fix.js'),'utf8'),context,{filename:'kent-tree-fix.js'});
vm.runInContext(fs.readFileSync(path.join(ROOT,'js/repertory/rep-chapters.js'),'utf8'),context,{filename:'rep-chapters.js'});
vm.runInContext(fs.readFileSync(path.join(ROOT,'js/repertory/rep-tree.js'),'utf8'),context,{filename:'rep-tree.js'});
const tree=context.buildRubricTree(mind);
const flat=[];
context.repTreeFlatten(tree,[],'',0,flat,'');
const visible=new Map(flat.filter(row=>row.node&&row.node.rid).map(row=>[String(row.node.rid),row]));
for(const item of expected) assert(visible.has(item.id),'درخت میں ربرک دکھائی دے');
assert.deepStrictEqual(visible.get('h2528').labels,['IDEAS','deficiency of']);
assert.deepStrictEqual(visible.get('o48406').labels,expected[1].path);
assert.deepStrictEqual(visible.get('o48407').labels,expected[2].path);
assert.deepStrictEqual(visible.get('o48408').labels,expected[3].path);
assert(flat.some(row=>row.node&&row.node.syntheticMindPath&&row.node.sourceLabel==='IDEAS'),'غیر شمار شدہ مصنوعی والد دکھائی دے');

vm.runInContext(fs.readFileSync(path.join(ROOT,'js/18-rubrics-ur.js'),'utf8'),context,{filename:'18-rubrics-ur.js'});
context.repRubUrStore('kent','mind',ur);
for(const item of expected){
  const html=context.repRubUrRowHtml(visible.get(item.id));
  assert(html.includes(item.ur),'پروگرام اردو جملہ دکھائے: '+item.id);
}
const firstChildHtml=context.repRubUrRowHtml(visible.get('o48406'));
assert(/rub-base/.test(firstChildHtml)&&/rub-delta/.test(firstChildHtml),'والد اور بچے کا اضافہ الگ دکھے');

const index=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const urJs=fs.readFileSync(path.join(ROOT,'js/18-rubrics-ur.js'),'utf8');
const sw=fs.readFileSync(path.join(ROOT,'service-worker.js'),'utf8');
const sharedTest=fs.readFileSync(path.join(ROOT,'tests/rubrics_ur_v107.test.js'),'utf8');
assert(/kent-tree-fix\.js\?v=190/.test(index));
assert(/rep-chapters\.js\?v=190/.test(index));
assert(/18-rubrics-ur\.js\?v=182/.test(index));
assert(/REP_RUBUR_V\s*=\s*'182'/.test(urJs));
assert(/CACHE_NAME='bhc-clinic-v190'/.test(sw));
assert(sharedTest.includes("REP_RUBUR_V = '182'")&&sharedTest.includes('bhc-clinic-v190'));

console.log('ذہنی باب کی کمیِ خیالات والی الگ شاخ، 3 اردو عبارتیں، دوائیں، والدین، تلاش اور نسخہ کامیاب');
