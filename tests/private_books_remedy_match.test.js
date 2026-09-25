// v68.4: private-book remedy detection — short remedy names must still count (node tests/private_books_remedy_match.test.js) private books that write the remedy's short name must be recognised
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/home/user/jsd/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
const dom=new JSDOM('<!doctype html><html><body></body></html>',{runScripts:'dangerously',url:'http://localhost/'});const w=dom.window;
w.currentLang='ur';w.escapeHtml=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));w.toasts=[];w.showToast=m=>w.toasts.push(String(m));
w.fetch=u=>{const f=path.join(ROOT,String(u).split('?')[0]);return fs.existsSync(f)?Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(fs.readFileSync(f,'utf8')))}):Promise.reject(new Error('404'));};
w.eval(require('./_rep_src')());['js/08b-rep-differentiation.js','js/08c-rep-materia-medica.js'].forEach(f=>w.eval(fs.readFileSync(path.join(ROOT,f),'utf8')));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const books=[
 {id:'kulkarni',title:'Absolute Homoeopathic Materia Medica',author:'P. I. Tarkas & Ajit Kulkarni',private:true,format:'pages',pages:[
   {p:'412',t:'Hyoscyamus — jealous suspicion; attempts to bite; talks nonsense in fever; spasms of the face.'},
   {p:'413',t:'Hyoscyamus niger: mania with obscene gestures; worse at moonlight.'}]},
 {id:'vithoulkas',title:'Essence of Materia Medica',author:'George Vithoulkas',private:true,format:'pages',pages:[
   {p:'88',t:'Stramonium — fear of darkness, talks to imaginary persons.'}]},
 {id:'sehgal',title:'Rediscovery of Homoeopathy (ROH series)',author:'M. L. Sehgal',private:true,format:'pages',pages:[
   {p:'5',t:'Hyoscyamus is the second of the three S in the acute triad (Stramonium, Hyoscyamus, Belladonna).'}]}];
(async()=>{
 await new Promise(r=>w.repPrivImportText(JSON.stringify({books}),r));
 await new Promise(r=>w.repMMEnsureAll(r)); await new Promise(r=>w.ensureRemedyNames(r));
 w.repMMIndex=null; w.repPrivPrefLoad();   // index was built before the import — rebuild it like repMMEnsureAll would
 const re=w.repPrivRemedyRegex('hyos'); console.log('   regex:', re&&re.source);
 ok(/Hyoscyamus\\b/.test(re.source.replace(/\\/g,'\\')),'short name "Hyoscyamus" alone is now a pattern');
 ok(w.repPrivPagesFor('priv_kulkarni','hyos').length===2,'Kulkarni: both pages found (one says only "Hyoscyamus")');
 ok(w.repPrivPagesFor('priv_sehgal','hyos').length===1,'Sehgal: the sentence naming Hyoscyamus is found');
 ok(w.repPrivPagesFor('priv_vithoulkas','hyos').length===0,'Vithoulkas: no Hyoscyamus → still marked empty (correctly)');
 const av=w.repMMAvail('hyos');
 ok(av.indexOf('priv_kulkarni')!==-1&&av.indexOf('priv_sehgal')!==-1,'avail for hyos now lists the two books that carry it');
 ok(av.indexOf('priv_vithoulkas')===-1,'avail does not list the book without it');
 // the row: two enabled private tabs + one with the ✕, and the hide toggle only counts the empty one
 w.repMMOpen('hyos','abusive',['hyos','anac']); await new Promise(r=>setTimeout(r,400));
 const head=w.document.getElementById('repMMHead');
 const tabs=[...head.querySelectorAll('.rep-diff-ctl > .rep-diff-tabs button')].filter(b=>/🔒/.test(b.textContent));
 console.log('   private tabs -> '+tabs.map(b=>b.textContent.trim()).join(' | '));
 ok(tabs.length===3,'three private tabs in the row');
 ok(tabs.filter(b=>!b.disabled).length===2,'two of them are clickable (enabled) — before this fix all three looked dead');
 const tog=[...head.querySelectorAll('.rep-diff-ctl button')].find(b=>/🔒\s*\d+/.test(b.textContent));
 ok(!!tog&&/🔒 1/.test(tog.textContent),'the hide button counts only the one genuinely empty book: '+(tog?tog.textContent.trim():'none'));
 // the note when the theme finds nothing
 const body=w.document.getElementById('repMMBody'); w.repMMView.book='priv_kulkarni';
 w.repMMRender(); await new Promise(r=>setTimeout(r,200));
 ok(true,'render after switching to the private book did not throw');
 console.log(fails?('FAILURES: '+fails):'ALL SCRATCH CHECKS PASSED');
 process.exit(fails?1:0);
})();
