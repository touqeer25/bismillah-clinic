// jsdom tests: v68.7 — remedy extraction (Radar Opus style), size filter before counting, take-all
// run:  JSDOM_PATH=/path/to/node_modules/jsdom node tests/extraction_v687.test.js
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd2/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
const html=`<!doctype html><html><body><div id="page-repertoryBrowser"><div id="repDiffModal"><div id="repDiffHead"></div><div id="repDiffBody"></div></div><div id="repDockArea"></div></div></body></html>`;
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});const w=dom.window;
w.currentLang='ur';
w.escapeHtml=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
w.toasts=[];w.showToast=m=>w.toasts.push(String(m));
w.fetch=u=>{const f=path.join(ROOT,String(u).split('?')[0]);return fs.existsSync(f)?Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(fs.readFileSync(f,'utf8')))}):Promise.reject(new Error('404 '+u));};
w.eval(require('./_rep_src')());
w.eval(fs.readFileSync(path.join(ROOT,'js/08b-rep-differentiation.js'),'utf8'));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
(async()=>{
  const d=w.document; for(let i=0;i<w.REP_N_CLIPS;i++)w.repClipboards[i]=[];
  const kent=JSON.parse(fs.readFileSync(ROOT+'/kent_repertory.json','utf8'));
  const listMind=Object.keys(kent.mind).map(rid=>({book:'kent',ch:'mind',rid,t:kent.mind.r2&&kent.mind[rid]?kent.mind[rid].t:'',r:kent.mind[rid].r}));

  // ---------- A. repDiffExtract on real Kent data ----------
  const sizes=w.repDiffRemedySizes('kent',kent);
  let e=w.repDiffExtract('onos',listMind,{maxN:0,minG:1},sizes);
  const mindOnos=listMind.filter(x=>x.r.onos).length;
  ok(e.total===mindOnos&&e.total>0,'A1 extract counts every mind rubric with onos = '+e.total+' (in-scope), book-wide '+sizes['onos']);
  ok(e.rows.length===mindOnos,'A2 no filter → every one listed ('+e.rows.length+')');
  ok(e.rows.every(r=>r.x.r.onos),'A3 every row really carries the remedy');
  const e1=w.repDiffExtract('onos',listMind,{maxN:0,minG:1,onlySingle:1},sizes);
  ok(e1.rows.length===e1.single&&e1.rows.every(r=>r.N===1),'A4 "single-remedy pages only": '+e1.rows.length+' rows, all N=1 (single='+e1.single+')');
  const e2=w.repDiffExtract('onos',listMind,{maxN:0,minG:1,topOnly:1},sizes);
  ok(e2.rows.every(r=>{ for(var a in r.x.r){ if(a!=='onos'&&w.repDiffGrade(r.x.r[a])>r.g) return false; } return true; }),'A5 "not outranked" filter: '+e2.rows.length+' rows, none beaten by another remedy (top='+e2.top+')');
  const e3=w.repDiffExtract('onos',listMind,{maxN:5,minG:1},sizes);
  ok(e3.skipped===mindOnos-e3.rows.length&&e3.rows.every(r=>r.N<=5),'A6 size cap applied inside extraction: '+e3.rows.length+' kept, '+e3.skipped+' skipped (was: filter only in the compare lists)');
  const e4=w.repDiffExtract('ars',listMind,{maxN:0,minG:3},sizes);
  ok(e4.rows.every(r=>r.g===3),'A7 min grade 3 for a big remedy: '+e4.rows.length+' of '+e4.total+' rubrics are grade 3');
  ok(e4.rows.length<=w.REP_EXTR_CAP,'A8 row cap respected (REP_EXTR_CAP='+w.REP_EXTR_CAP+')');

  // ---------- B. size filter bites while collecting the list (perf fix) ----------
  const cap5=await new Promise(r=>w.repDiffRubricList('chapter','kent','mind',function(list){r(list);},{maxN:5,_rems:{onos:1},ars:0,_stop:true}));
  ok(typeof w.repDiffRubricList==='function'&&w.repDiffRubricList.length===5,'B1 repDiffRubricList now takes an options argument (arity 5)');
  const expSize5=listMind.filter(x=>x.r.onos&&Object.keys(x.r).length<=5).length;   // v79: OOREP ڈیٹا — اعداد ڈیٹا سے
  ok(cap5.length===expSize5&&cap5.every(x=>Object.keys(x.r).length<=5&&x.r.onos),'B2 collecting stage applies BOTH caps (size ≤5 AND remedy present): '+cap5.length+' of '+listMind.filter(x=>x.r.onos).length+' onos rubrics survived ('+expSize5+' expected; empty see-also rubrics out)');
  ok(cap5.scanned>cap5.length&&cap5.skipped>0,'B3 counters reported while scanning: scanned='+cap5.scanned+' skipped-for-size='+cap5.skipped);
  const big=await new Promise(r=>w.repDiffRubricList('book','kent',null,function(list){r(list);},{maxN:0,_stop:true}));
  var onosBook=Object.keys(kent).reduce(function(a,ch){return a+Object.keys(kent[ch]).filter(function(rid){var r=kent[ch][rid].r||{};return r.onos&&Object.keys(r).length>0;}).length;},0);
  ok(big.scanned>=20000&&big.length>0&&big.length<=w.REP_DIFF_SCAN_STOP,'B4 whole-book scan: kept '+big.length+' of '+big.scanned+' scanned, stop cap '+w.REP_DIFF_SCAN_STOP+' respected');
  ok(w.REP_DIFF_SCAN_STOP===250000&&w.REP_EXTR_CAP===600,'B5 caps are wired: scan stop 250000, extraction rows 600');
  const e0=w.repDiffExtract('onos',big.map(x=>x),{maxN:0,minG:1},sizes);
  ok(e0.total===onosBook,'B6 extraction over the scanned part of the book finds '+e0.total+' onos rubrics (whole-book total is '+onosBook+', single='+e0.single+', top='+e0.top+')');
  const uncapped=w.repDiffExtract('onos',listMind,{maxN:0,minG:1},sizes);
  ok(uncapped.rows.length===uncapped.total,'B7 with no size cap nothing is dropped (rows '+uncapped.rows.length+' = total '+uncapped.total+')');

  // ---------- C. UI: extract renderer + take all ----------
  w.repDiffSel=['onos']; w.repDiffOpts.mode='extract'; w.repDiffOpts.scope='chapter';
  w.repCurrentBook='kent'; w.repCurrentChapter='mind';
  w.repDiffLast={res:null,extract:e,list:listMind,all:{kent:kent},sizes:sizes,scopeBook:'kent',scope:'chapter',ms:12,n:listMind.length,skipped:0,scanned:listMind.length};
  w.repDiffTab='excl'; w.repDiffRenderHead(); w.repDiffRenderBody();
  const head=d.getElementById('repDiffHead').innerHTML, body=d.getElementById('repDiffBody').innerHTML;
  ok(/value="extract"/.test(head)&&/🧭/.test(head),'C1 mode picker (compare / extract) in the controls bar');
  ok(/🧲/.test(head),'C2 the tab is labelled as the extracted list while in extract mode');
  ok(/ONOS|onos/.test(body)&&/📥/.test(body),'C3 body lists the extracted rows with the take-all button');
  ok(/انوکھی/.test(body)&&/پہلے نمبر/.test(body),'C4 summary strip shows single-remedy and not-outranked counts');
  w.repDiffTakeAll();
  const clip=w.repClipboards[w.repActiveClip];
  ok(clip.length===e.rows.length&&clip[0].book==='kent','C5 take-all put '+clip.length+' rubrics into the active clipboard (list had '+e.rows.length+')');
  w.repDiffTakeAll();
  ok(clip.length===e.rows.length,'C6 take-all again adds nothing (no duplicates) — '+clip.length);
  ok(w.repClipboards[w.repActiveClip].every(it=>it.rid&&it.path),'C7 clipboard items are normal rubric entries (rid + path), so Combine/Analysis work on them');
  const saved=JSON.parse(w.localStorage.getItem('bc_rep_clipboards')||'null');
  ok(saved&&Array.isArray(saved)&&saved[w.repActiveClip]&&saved[w.repActiveClip].length===clip.length,'C8 extraction results were persisted to localStorage');
  // options persist
  w.repDiffSetOpt('onlySingle',1);
  ok(JSON.parse(w.localStorage.getItem('bc_rep_diff_opts')).onlySingle===1&&JSON.parse(w.localStorage.getItem('bc_rep_diff_opts')).mode==='extract','C9 mode and the two new extract filters persist in bc_rep_diff_opts');

  // ---------- D. cache-busting ----------
  const app=require('./_rep_src')();
  ok(/REP_DATA_V='v=16'/.test(app),"D1 data version bumped to v=16 for the changed behaviour ("+(app.match(/REP_DATA_V='[^']+'/)||[''])[0]+")");
  const idx=fs.readFileSync(ROOT+'/index.html','utf8');
  ok(/08b-rep-differentiation\.js\?v=\d+/.test(idx),'D2 index.html loads the differentiation module with a new ?v= (v4)');
  console.log(fails?'\nFAILURES: '+fails:'\nALL v68.7 EXTRACTION CHECKS PASSED');
  process.exit(fails?1:0);
})().catch(e=>{console.log('CRASH '+e.stack);process.exit(1);});
