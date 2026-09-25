// v68.5: 🔒 private books must take part in the theme search and in the auto draft
// run: JSDOM_PATH=/home/user/test-deps/node_modules/jsdom node tests/private_books_search.test.js
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/home/user/test-deps/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
const dom=new JSDOM('<!doctype html><html><body></body></html>',{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});const w=dom.window;
w.currentLang='ur';w.escapeHtml=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
w.toasts=[];w.showToast=m=>w.toasts.push(String(m));
w.fetch=u=>{const f=path.join(ROOT,String(u).split('?')[0]);return fs.existsSync(f)?Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(fs.readFileSync(f,'utf8')))}):Promise.reject(new Error('404 '+u));};
w.eval(require('./_rep_src')());['js/08b-rep-differentiation.js','js/08c-rep-materia-medica.js'].forEach(f=>w.eval(fs.readFileSync(path.join(ROOT,f),'utf8')));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const long='Hyoscyamus: '+'abusive jealousy and suspicion with gnashing of teeth, '.repeat(6);        // ~2.2k chars → dropped
const mid ='Hyoscyamus niger: '+('abusive gestures, naked in bed, laughs at serious matters; suspicion that neighbours are plotting. ').repeat(3);  // ~500 chars → kept
const books={books:[
  {id:'priv_kul',title:'Absolute Homoeopathic Materia Medica',author:'P. I. Tarkas & Ajit Kulkarni',private:true,format:'pages',pages:[{p:'412',t:mid},{p:'413',t:long}]},
  {id:'priv_vit',title:'Essence of Materia Medica',author:'George Vithoulkas',private:true,format:'pages',pages:[{p:'9',t:'Hyoscyamus — abusive suspicion, spasms; nothing else here.'}]}
]};
(async()=>{
  await new Promise(r=>w.repPrivImportText(JSON.stringify(books),r));
  await new Promise(r=>w.repMMEnsureAll(r)); await new Promise(r=>w.ensureRemedyNames(r));
  w.repMMIndex=null; w.repPrivPrefLoad();
  const re=w.repDiffThemeRegex('abusive, suspicion');
  ok(!!re,'theme regex built');
  const ms=w.repMMMatches('hyos',re);
  const fromPriv=ms.filter(m=>w.repPrivIs(m.book));
  ok(fromPriv.length>=2,'private books contribute to the theme search: '+fromPriv.length+' sentences of '+ms.length);
  ok(fromPriv.every(m=>m.text.length<=900*2),'the 2k-character paragraph is not pushed into the note (only the readable ones): '+fromPriv.map(m=>m.text.length).join(','));
  ok(fromPriv.some(m=>/Kulkarni|Absolute/.test(w.repMMShort(m.book))),'a Kulkarni sentence is among them');
  const dr=w.repMMDraft('hyos',re);
  ok(dr.length>0&&dr.some(m=>w.repPrivIs(m.book)),'the 🤖 auto draft can cite a private book: '+(dr[0]?w.repMMRef(dr[0]):'-'));
  ok(dr.every(m=>m.book), 'draft references: '+dr.map(m=>w.repMMRef(m)).join(' '));
  w._repPrivPrefs.inDraft=false; w.repPrivPrefSave();
  const dr2=w.repMMDraft('hyos',re);
  ok(!dr2.some(m=>w.repPrivIs(m.book)),'with the 🤖 switch off, the draft stays on public books ('+dr2.length+')');
  const ms2=w.repMMMatches('hyos',re);
  ok(ms2.some(m=>w.repPrivIs(m.book)),'…but the theme search itself still includes the private books ('+ms2.length+' sentences)');
  w._repPrivPrefs.inDraft=true;
  // the viewer: the whole-book search toggle still works for a private book
  w.repMMOpen('hyos','abusive',['hyos']); await sleep(120);
  w.repMMSetBook('priv_vit'); await sleep(80);
  ok(/Essence of Materia Medica/.test(w.document.getElementById('repMMBody').innerHTML),'private book text renders in the viewer');
  w.repMMView.whole=true; w.repMMRenderBody(); await sleep(80);
  ok(w.document.getElementById('repMMBody').querySelectorAll('.rep-mm-section').length>=1,'whole-book search returns page blocks for the private book');
  console.log(fails?('FAILURES: '+fails):'ALL TESTS PASSED');
  process.exit(fails?1:0);
})();
