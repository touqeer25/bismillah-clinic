// v107: ربرک-سطح کے اردو اوزاروں کا مشترکہ حصہ — ایپ کا اصل کوڈ jsdom میں چلا کر باب کی صفیں نکالتا ہے
// (کلید بنانے کا فنکشن بھی ایپ ہی کا repRubKey ہے — یہاں دوبارہ نہیں لکھا، تاکہ کبھی فرق نہ آئے)
const fs=require('fs'),path=require('path');
const R=path.resolve(__dirname,'..');
function jsdom(){ return require(process.env.JSDOM_PATH||path.join(R,'node_modules/jsdom')); }
function appWindow(){
  const {JSDOM}=jsdom();
  const w=new JSDOM('<div id="repRubricContent"></div>',{runScripts:'dangerously',url:'http://localhost/'}).window;
  w.escapeHtml=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  w._repAttr=s=>String(s||'').replace(/"/g,'&quot;');
  w.eval(fs.readFileSync(R+'/js/repertory/LOAD_ORDER.txt','utf8').split(/\s+/).filter(Boolean).map(f=>fs.readFileSync(R+'/js/repertory/'+f,'utf8')).join('\n'));
  w.eval(fs.readFileSync(R+'/js/17-rubric-ur.js','utf8'));
  w.eval(fs.readFileSync(R+'/js/18-rubrics-ur.js','utf8'));
  return w;
}
// باب کی صفیں (ٹری کی ترتیب میں): {key, parentKey, depth, full, label, labels, rems}
function chapterRows(w,book,chapter){
  w.repCurrentBook=book;
  w.repCurrentChapter=chapter;   // v143: sahi bab ka fix (kent-tree-fix)
  const dir=R+'/'+w.REP_BOOK_INFO[book].chapDir;
  const t=w.buildRubricTree(JSON.parse(fs.readFileSync(dir+chapter+'.json','utf8')));
  const rows=[]; w.repTreeFlatten(t,[],'',0,rows,'');
  // Only source-backed rubric records belong in translation counts; virtual display folders (e.g. MIND's "sleep") are not rubrics.
  return rows.filter(r=>r.node&&r.node.hasRubric===true).map(r=>{
    const translationFull=r.translationFull||r.full, displayKey=w.repRubKey(r.full);
    return {key:w.repRubKey(translationFull),displayKey,translationFull,
      parentKey:r.labels.length>1?w.repRubKey(r.labels.slice(0,-1).join(', ')):'',
      depth:r.depth,full:r.full,label:r.label,labels:r.labels,rems:Object.keys(r.node.remedies||{}).length};
  });
}
function chapters(w,book){ w.repCurrentBook=book; const dir=R+'/'+w.REP_BOOK_INFO[book].chapDir; return JSON.parse(fs.readFileSync(dir+'_index.json','utf8')).map(c=>c.key); }
function urFile(book,chapter){ return path.join(R,'ur','rubrics',book,chapter+'.json'); }
function readUr(book,chapter){ const f=urFile(book,chapter); if(!fs.existsSync(f)) return {meta:{},rubrics:{},locked:[]}; const d=JSON.parse(fs.readFileSync(f,'utf8')); d.rubrics=d.rubrics||{}; d.locked=d.locked||[]; return d; }
function writeUr(book,chapter,d){ const f=urFile(book,chapter); fs.mkdirSync(path.dirname(f),{recursive:true}); fs.writeFileSync(f,JSON.stringify(d,null,1),'utf8'); return f; }
// پرانا نظام صف پر کیا دکھاتا (موازنے کے لیے)
function legacyRow(w,r){ if(!w._repUrLabels){ const D=JSON.parse(fs.readFileSync(R+'/ur/rubric_labels_ur.json','utf8')); w._repUrLabels=D.labels; w._repUrCtx=D.ctx||{}; }
  const o=w.repUrLabelObj(r.label,r.labels); return o?(o.t+(o.auto?' ⟨لفظی⟩':'')):''; }
module.exports={R,appWindow,chapterRows,chapters,urFile,readUr,writeUr,legacyRow};
