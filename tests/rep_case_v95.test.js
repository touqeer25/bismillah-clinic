// v95: (A) 📋 repertory case attached to a patient visit   (B) 📝 exportForGitHub now writes data/diagnosis.json
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const rd=f=>fs.readFileSync(path.join(ROOT,f),'utf8');

const dom=new JSDOM('<!doctype html><html><body><div id="x"></div></body></html>',{runScripts:'dangerously',url:'http://localhost/'});
const w=dom.window;
w.escapeHtml=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
w.toasts=[];w.showToast=m=>w.toasts.push(String(m));w.confirm=()=>true;w.currentLang='ur';
w.repLangText=o=>o[w.currentLang]||o.ur||o.en;
// minimal repertory state
w.repClipboards=[[],[],[]];w.repActiveClip=0;w.repCurrentBook='kent';
w.repClipLabel=i=>'کلپ بورڈ '+(i+1);
w.repClipsSave=()=>{w.__saved=(w.__saved||0)+1;};
w.cachedPatients=[{id:'P1',name:'Ali Khan',refNo:'BHC-1'},{id:'P2',name:'Sara',refNo:'BHC-2'}];
w.cachedVisits=[{id:'V1',patientId:'P1',date:'2026-09-20',visitRef:'R-1'},{id:'V2',patientId:'P1',date:'2026-09-27',visitRef:'R-2'}];
w.eval(rd('js/16-rep-case.js'));

// ---------- A. snapshot ----------
ok(w.repCaseSnapshot()===null,'A1 empty clipboard → no snapshot (nothing to attach)');
w.repClipboards[0]=[{book:'kent',ch:'mind',rid:'r1',t:'MIND - GRIEF, silent',w:2},{book:'kent',ch:'mind',rid:'r2',t:'MIND - ANGER'}];
w.repClipboards[1]=[{book:'kent',ch:'head',rid:'r3',t:'HEAD - PAIN, eating after'}];
w._repAnaLast={method:'kent',abbrs:['nat-m','staph','ign'],col:{'nat-m':{cov:3,total:7.5},'staph':{cov:2,total:5},'ign':{cov:2,total:4}}};
const snap=w.repCaseSnapshot();
ok(snap&&snap.items===3&&snap.clips.length===2,'A2 snapshot: '+snap.items+' rubrics from '+snap.clips.length+' boards');
ok(snap.clips[0].items[0].w===2,'A3 rubric weights are preserved');
ok(snap.top.length===3&&snap.top[0].abbr==='nat-m'&&snap.top[0].cov===3,'A4 top remedies from the last analysis: '+snap.top.map(t=>t.abbr).join(','));

// ---------- A. attach / read / restore ----------
ok(w.repCaseAttach('V2')===true&&!!w.repCaseGet('V2'),'A5 attached to visit V2');
ok(w.repCaseGet('V1')===null,'A6 other visits untouched');
const store=JSON.parse(w.localStorage.getItem('bc_visit_cases_v1'));
ok(store&&store.V2&&store.V2.items===3,'A7 stored in localStorage under the visit id');
const html=w.repCaseSummaryHtml('V2','P1');
ok(/repCaseRestore\('V2'\)/.test(html)&&/nat-m/.test(html)&&/3 ربرکس/.test(html),'A8 visit card summary shows count, top remedies and a Restore button');
ok(/repCaseAttachFromVisit\('V1','P1'\)/.test(w.repCaseSummaryHtml('V1','P1')),'A9 a visit without a case offers "attach current clipboard"');
w.repClipboards=[[],[],[]];
w.showPage=()=>{w.__page='repertoryBrowser';};
w.repCaseRestore('V2');
ok(w.repClipboards[0].length===2&&w.repClipboards[1].length===1,'A10 restore puts every rubric back on its own board');
ok(w.repClipboards[0][0].t==='MIND - GRIEF, silent'&&w.repClipboards[0][0].w===2,'A11 restored rubric keeps title and weight');
ok(w.__page==='repertoryBrowser'&&w.__saved>0,'A12 restore switches to the repertory page and saves');
// picker + backup + detach
w.repCaseSaveDialog();
const ovHtml=w.document.getElementById('repCasePickOv').innerHTML;
ok(/Ali Khan/.test(ovHtml)&&/repCasePickDo\('V1','P1'\)/.test(ovHtml),'A13 picker lists patients and their visits');
ok(Object.keys(w.repCaseExportAll().cases).length===1,'A14 backup export carries the cases');
w.repCaseDetach('V2'); ok(w.repCaseGet('V2')===null,'A15 detach removes it');

// ---------- B. exportForGitHub ----------
const dc=fs.readFileSync(path.join(ROOT,'diagnosis-custom.js'),'utf8');
ok(!/diagnosis-data\.js/.test(dc.slice(dc.indexOf('window.exportForGitHub'),dc.indexOf('window.exportForGitHub')+3000)),'B1 exportForGitHub no longer mentions the deleted diagnosis-data.js');
ok(/fetch\('data\/diagnosis\.json/.test(dc),'B2 it reads the current data/diagnosis.json as the base');
ok(/a\.download = 'diagnosis\.json'/.test(dc),'B3 it downloads a file named diagnosis.json (drop-in replacement)');
ok(/SYMPTOMS_DB:\s*Object\.assign/.test(dc)&&/DISEASES_DB:\s*\(base\.DISEASES_DB/.test(dc)&&/CATEGORIES_DB:\s*Object\.assign/.test(dc),'B4 the export merges all three sections, base first');
ok(/_cleanCat|_cleanSym|_cleanDis/.test(dc),'B5 custom-only fields (promoted/created_at) are stripped before export');
const idx=rd('index.html');
ok(!/Ready-to-paste for diagnosis-data\.js/.test(idx),'B6 the button tooltip was updated too');
ok(/js\/16-rep-case\.js\?v=\d+/.test(idx)&&/css\/rep-case\.css\?v=\d+/.test(idx),'B7 index.html loads the new case module + css');
ok(/repCaseSaveDialog\(\)/.test(idx),'B8 repertory sidebar has the "save case to visit" button');
ok(/repCaseSummaryHtml\(v\.id, patient\.id\)/.test(rd('js/03-app-patients.js')),'B9 patient detail renders the case summary per visit');
const sw=rd('service-worker.js');
ok(sw.includes('./js/16-rep-case.js')&&sw.includes('./css/rep-case.css'),'B10 service worker caches the new files');

console.log(fails?'\nFAILURES: '+fails:'\nALL v95 CASE + EXPORT CHECKS PASSED');
process.exit(fails?1:0);
