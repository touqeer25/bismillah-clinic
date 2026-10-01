// tests/kent_tree_fix_v143.test.js — v143: کینٹ کا درخت کتاب کی اصل ساخت پر
// (homeoint.org + True-Original PDF سے موازنہ — kent-tree-fix.js)
// چلانے کا طریقہ: JSDOM_PATH=$PWD/node_modules/jsdom node tests/kent_tree_fix_v143.test.js
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const rd=f=>fs.readFileSync(path.join(ROOT,f),'utf8');

// ---- ایپ کا ماحول (repertory کی فائلیں jsdom میں) ----
const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'http://localhost/',runScripts:'outside-only'});
const w=dom.window;
w.escapeHtml=s=>String(s);
w.currentLang='ur'; w.repUrLabelsOn=()=>false;
w.REP_DATA_V='143';
// کم سے کم کتاب کی معلومات (rep-books.js کی جگہ — صرف کینٹ درکار)
w.REP_BOOK_INFO={kent:{abbr:'Kent',name:'Kent (English)',dataFile:'kent_repertory.json',chapDir:'kent_chapters/',tree:'prefix'}};
// ریپرٹری کے فنکشنز لوڈ کرو (ڈیٹا بوٹ کے بغیر)
for(const f of ['rep-chapters.js','rep-tree.js','rep-folders.js']){
  const code=fs.readFileSync(path.join(ROOT,'js/repertory',f),'utf8');
  try{ dom.runVMScript ? dom.runVMScript(new w.VMScript(code)) : w.eval(code); }
  catch(e){ w.eval(code); }
}
// فکس ڈیٹا
w.eval(fs.readFileSync(path.join(ROOT,'js/repertory/kent-tree-fix.js'),'utf8'));
ok(!!w.KENT_TREE_FIX&&!!w.KENT_TREE_FIX.ch,'A1 kent-tree-fix.js لوڈ ہوا');
ok(w.KENT_TREE_FIX.v==='143','A2 ورژن 143');

function buildFor(ch){
  w.repCurrentBook='kent'; w.repCurrentChapter=ch;
  const data=JSON.parse(fs.readFileSync(path.join(ROOT,'kent_chapters',ch+'.json'),'utf8'));
  return w.buildRubricTree(data);
}
function flat(tree){
  const rows=[]; w.repTreeFlatten(tree,[],'',0,rows,'');
  return rows;
}

// ---- B. ANGER (صارف کی مثال) ----
const mind=buildFor('mind');
const mrows=flat(mind);
const anger=mrows.find(r=>r.label==='ANGER, irascibility'&&r.depth===0);
ok(!!anger,'B1 «ANGER, irascibility» اب مین ربرک ہے (جڑ پر)');
const kds=mrows.filter(r=>r.parentKey==='anger, irascibility'||(r.labels.length>1&&r.labels[r.labels.length-2]==='ANGER, irascibility'));
const kidLabels=kds.map(r=>r.label);
ok(!kidLabels.includes('irascibility'),'B2 «irascibility» اب ذیلی ربرک نہیں');
ok(kidLabels[0]==='morning','B3 پہلا ذیلی ربرک «morning» ہے (کتابی ترتیب) — حاصل: '+kidLabels[0]);
// کتاب: «waking, on» صبح کے بعد آتا ہے — ایپ کا OOREP عنوان «ANGER, morning, waking, on» اُسے morning کے نیچے رکھتا ہے
// (OOREP کے راستے کتاب کے راستے سے ایک درجہ گہرے — دستاویز شدہ residual — KENT_ORDER_METHOD.md §7)
ok(mrows.some(r=>r.label==='waking, on'&&r.labels.includes('ANGER, irascibility')),'B4 «waking, on» ANGER کی ذیلی شجر میں موجود ہے');
// پرانا OOREP مین «ANGER» چھپا ہوا ہے — اُس کی ادویات مین میں موجود ہیں
ok(!mrows.some(r=>r.label==='ANGER'&&r.depth===0),'B5 OOREP کا مختصر مین «ANGER» چھپا ہوا ہے');
const angerRems=Object.keys(anger.node.remedies||{}).length;
ok(angerRems===137,'B6 مین کی ادویات = کتاب کے مطابق 137 — حاصل: '+angerRems);

// ---- C. گنتی: کچھ بھی گم نہیں ----
const FIX=w.KENT_TREE_FIX.ch;
let totBefore=0, totAfter=0, chChecked=0;
Object.keys(FIX).forEach(ch=>{
  const data=JSON.parse(fs.readFileSync(path.join(ROOT,'kent_chapters',ch+'.json'),'utf8'));
  const before=Object.keys(data).length;
  const after=flat(buildFor(ch)).filter(r=>r.node.hasRubric).length;
  totBefore+=before; totAfter+=after; chChecked++;
  if(after!==before-FIX[ch].h.length){ ok(false,'C گنتی '+ch+': '+before+' → '+after+' (توقع: '+(before-FIX[ch].h.length)+')'); }
});
// بغیر فکس والے باب بھی
const allCh=JSON.parse(fs.readFileSync(path.join(ROOT,'kent_chapters','_index.json'),'utf8')).map(c=>c.key);
allCh.forEach(ch=>{
  if(FIX[ch])return;
  const data=JSON.parse(fs.readFileSync(path.join(ROOT,'kent_chapters',ch+'.json'),'utf8'));
  const before=Object.keys(data).length;
  const after=flat(buildFor(ch)).filter(r=>r.node.hasRubric).length;
  totBefore+=before; totAfter+=after; chChecked++;
  if(after!==before){ ok(false,'C2 گنتی (بغیر فکس) '+ch+': '+before+' → '+after); }
});
ok(true,'C3 تمام '+chChecked+' ابواب کی گنتی درست (کل '+totBefore+' → '+totAfter+')');
ok(totBefore-totAfter===Object.keys(FIX).reduce((a,c)=>a+FIX[c].h.length,0),'C4 چھپائے گئے = منصوبے کے مطابق');

// ---- D. ادویات کا تحفظ (وجود): ہر چھپے ہوئے (remedy,grade) کے لیے باب میں کوئی زندہ اندراج ----
let remOk=true, remBad=0;
Object.keys(FIX).forEach(ch=>{
  const data=JSON.parse(fs.readFileSync(path.join(ROOT,'kent_chapters',ch+'.json'),'utf8'));
  const hide=new Set(FIX[ch].h);
  const best={};
  Object.keys(data).forEach(k2=>{
    if(hide.has(k2))return;
    const r=data[k2].r||{};
    Object.keys(r).forEach(a=>{ if(!best[a]||best[a]<r[a])best[a]=r[a]; });
  });
  FIX[ch].h.forEach(h=>{
    const r=(data[h]||{}).r||{};
    Object.keys(r).forEach(a=>{ if(!best[a]||best[a]<r[a]){ remOk=false; remBad++; } });
  });
});
ok(remOk,'D1 ہر چھپے ہوئے ربرک کی ہر ادویہ (گریڈ سمیت) باب میں کہیں نہ کہیں موجود ہے'+(remBad?' — '+remBad+' کمی':''));
// rehomed اور promoted ہر نوڈ ملے
let nodesOk=true, miss=0;
Object.keys(FIX).forEach(ch=>{
  const tree=buildFor(ch); const rows=flat(tree);
  const byFull={}; rows.forEach(r=>{ if(r.node.hasRubric&&r.node.rid) byFull[r.node.rid]=r; });
  FIX[ch].g.forEach(g=>{ if(!byFull[g[0]]){ nodesOk=false; miss++; } (g[1]||[]).forEach(p=>{ if(!byFull[p[0]]){ nodesOk=false; miss++; } }); });
  (FIX[ch].p||[]).forEach(id=>{ if(!byFull[id]){ nodesOk=false; miss++; } });
});
ok(nodesOk,'D2 ہر گروپ جڑ، ہر rehomed اور ہر promoted ربرک درخت میں موجود'+(miss?' — '+miss+' غائب':''));

// ---- E. SHOCKS / DREAMS / AMUSEMENT / DEEP نمونے ----
const head=buildFor('head'); const hrows=flat(head);
const shocks=hrows.find(r=>r.depth===0&&r.label==='SHOCKS, blows, jerks, etc. (See Jerking Pain, Pulsation, Plug, Nail)');
ok(!shocks,'E1 head: «SHOCKS, blows, jerks, etc.» اپنے (See …) کے ساتھ مین نہیں — ایپ کے عنوان میں (See …) نہیں');
const shocks2=hrows.find(r=>r.depth===0&&r.label.indexOf('SHOCKS, blows, jerks')===0);
ok(!!shocks2,'E2 head: «SHOCKS, blows, jerks, etc.» مین ربرک ہے');
ok(hrows.some(r=>r.depth===1&&r.label==='forehead'&&r.labels[r.labels.length-2].indexOf('SHOCKS, blows, jerks')===0),'E3 head: «forehead» اب SHOCKS, blows, jerks, etc. کے نیچے ہے');
ok(!hrows.some(r=>r.depth===0&&r.label==='SHOCKS'),'E4 head: synthetic «SHOCKS» مین نہیں');
const sleep=buildFor('sleep'); const srows=flat(sleep);
const dr=srows.find(r=>r.depth===0&&r.label==='DREAMS, absurd');
ok(!!dr,'E5 sleep: «DREAMS, absurd» مین ربرک ہے (کتاب صفحہ 695 سے مطابق)');
ok(!srows.some(r=>r.depth===0&&r.label==='DREAMS'),'E6 sleep: OOREP کا «DREAMS» رول اپ مین نہیں');
ok(srows.some(r=>r.depth===1&&r.label==='accidents'&&r.labels[r.labels.length-2]==='DREAMS, absurd'),'E7 sleep: «accidents» اب DREAMS, absurd کے نیچے');
const am=mrows.find(r=>r.depth===0&&r.label==='AMUSEMENT, averse to');
ok(!!am,'E8 mind: «AMUSEMENT, averse to» مین ہے اور «desire for» اُس کے نیچے');
ok(mrows.some(r=>r.depth===1&&r.label==='desire for'&&r.labels[r.labels.length-2]==='AMUSEMENT, averse to'),'E9 mind: desire for کی جگہ درست');
const cough=buildFor('cough'); const crows=flat(cough);
ok(crows.some(r=>r.depth===0&&r.label.indexOf('DEEP enough, sensation as though')===0),'E10 cough: «DEEP enough, sensation…» مین ربرک ہے (کتاب PDF1408)');

// ---- F. ترجمہ کلید: ہر rehomed/promoted کا full = اصل عنوان ----
let fOk=true, fDup=0;
Object.keys(FIX).forEach(ch=>{
  const tree=buildFor(ch); const rows=flat(tree);
  const data=JSON.parse(fs.readFileSync(path.join(ROOT,'kent_chapters',ch+'.json'),'utf8'));
  rows.forEach(r=>{
    const rid=r.node.rid;
    if(rid&&data[rid]){
      // [2] دوہرے لیبل والا نوڈ جائز استثنا (v72) — full میں [n] کا سابقہ ہوتا ہے
      if(r.full!==data[rid].t && !r.node.dup){ fOk=false; }
      if(r.full!==data[rid].t && r.node.dup){ fDup++; }
    }
  });
});
ok(fOk,'F1 ہر دکھائے گئے ربرک کی ترجمہ-کلید اصل انگریزی عنوان ہے (اردو ترجمے محفوظ)');
ok(true,'F2 [n] دوہرے نوڈ (v72 کا جائز طریقہ): '+fDup);

console.log(fails?('❌ '+fails+' ناکام'):'✅ kent_tree_fix_v143: تمام جانچیں کامیاب');
process.exit(fails?1:0);
