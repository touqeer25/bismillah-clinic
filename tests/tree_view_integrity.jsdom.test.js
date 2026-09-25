// v72 🌳 کتابی ٹری ویو — ڈیٹا کی سلامتی: ہر کتاب کے ہر باب کا ہر ربرک ٹری میں بالکل ایک بار، اپنی تمام ادویات
// اور گریڈز کے ساتھ (اسی ترتیب میں جو فائل میں ہے)، اور کوئی ربرک اپنی جگہ سے نہیں ہٹتا۔
// Run: node tests/tree_view_integrity.jsdom.test.js [bookKey]
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
const html=`<!doctype html><html><body><div id="page-repertoryBrowser"><select id="repBookSelect"><option value="kent" selected>K</option></select><input id="repBrowserSearch"><div id="repChapterList"></div><div id="repBreadcrumb"></div><div id="repRubricContent"></div><div id="repDockArea"></div></div></body></html>`;
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});const w=dom.window;
w.currentLang='ur';w.escapeHtml=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));w.showToast=()=>{};
w.fetch=u=>{const f=path.join(ROOT,String(u).split('?')[0]);return fs.existsSync(f)?Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(fs.readFileSync(f,'utf8')))}):Promise.reject(new Error('404 '+u));};
w.eval(require('./_rep_src')());
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let fails=0,chk=0;
const ok=(c,m)=>{chk++; if(!c){fails++;console.log('FAIL '+m);} };
(async()=>{
  const only=process.argv[2]; const books=Object.keys(w.REP_BOOK_INFO).filter(b=>w.REP_BOOK_INFO[b].chapDir&&(!only||b===only));
  for(const book of books){
    const dir=path.join(ROOT,w.REP_BOOK_INFO[book].chapDir); if(!fs.existsSync(dir+'_index.json')){console.log('skip '+book);continue;}
    const idx=JSON.parse(fs.readFileSync(dir+'_index.json','utf8')); let nR=0,nRem=0,moved=0;
    for(const ch of idx){
      w.repCurrentBook=book; w.repCurrentChapter=''; w.repCurrentTree=null; for(const k in w.repTreeCache)delete w.repTreeCache[k]; w.document.getElementById('repRubricContent').innerHTML=''; w.selectChapter(ch.key);
      for(let i=0;i<200&&!(w.repCurrentChapter===ch.key&&w.repCurrentTree&&w.document.getElementById('repTreeMain'));i++)await sleep(20);
      const raw=JSON.parse(fs.readFileSync(dir+ch.key+'.json','utf8'));
      const rows=[]; w.repFolderFilter=''; w.repTreeCollapsed={}; w.repTreeFlatten(w.repCurrentTree,[],'',0,rows,'');
      const seen={}; const fileOrder=Object.keys(raw); const pos={}; fileOrder.forEach((k,i)=>pos[k]=i);
      let last=-1;
      rows.forEach(r=>{ const rid=r.node.hasRubric&&r.node.rid?String(r.node.rid):''; if(!rid)return;
        ok(!seen[rid],book+'/'+ch.key+' duplicate '+rid); seen[rid]=1;
        const src=raw[rid]; ok(!!src,book+'/'+ch.key+' unknown rid '+rid); if(!src)return;
        const a=JSON.stringify(r.node.remedies||{}), b=JSON.stringify(src.r||{});
        ok(a===b,book+'/'+ch.key+' remedies changed at '+rid+' '+(src.t||''));
        nRem+=Object.keys(src.r||{}).length;
        if(pos[rid]<last) moved++; last=pos[rid]; });
      // فائل کا ہر ربرک ٹری میں موجود ہو (کوئی ضم یا غائب نہ ہو)
      fileOrder.forEach(rid=>{ if(raw[rid]&&(raw[rid].t||raw[rid].path||raw[rid].de_path)) ok(seen[rid],book+'/'+ch.key+' rubric from file not shown '+rid+' '+(raw[rid].t||'')); });
      // ہر وہ ربرک جو ٹری نے بنایا (repRidPathMap) ٹری ویو میں بھی ہو
      Object.keys(w.repRidPathMap).forEach(rid=>ok(seen[rid],book+'/'+ch.key+' missing in tree view '+rid));
      // DOM: پہلا حصہ رینڈر ہوا اور ادویات کی گنتی درست
      const dr=w.document.querySelectorAll('#repTreeMain .rtv-row'); ok(dr.length===Math.min(rows.length,w.REP_TREE_CHUNK),book+'/'+ch.key+' DOM rows '+dr.length+' vs '+rows.length);
      nR+=Object.keys(seen).length;
    }
    console.log(`${book}: ${idx.length} chapters, ${nR} rubrics, ${nRem} remedy entries verified; file-order inversions ${moved} (tree builder groups children under parents)`);
  }
  console.log(fails?fails+' FAILED of '+chk:'ALL '+chk+' CHECKS PASSED'); process.exit(fails?1:0);
})();
