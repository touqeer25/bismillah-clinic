// jsdom tests: 🔬 differentiation / extraction module (v55)
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const ROOT=require('path').resolve(__dirname,'..');
const html=`<!doctype html><html><body><div id="page-repertoryBrowser"><select id="repBookSelect"><option value="kent" selected>K</option></select><select id="repScopeSelect"><option value="book" selected>b</option><option value="all">a</option></select><input id="repBrowserSearch"><button id="repCmpModeBtn"></button><div id="repSideTools"><span id="repSelCount"></span><div id="repCmpPanel"></div></div><aside id="repChapterList"></aside><span id="repCountInfo"></span><button id="repBtnBack"></button><button id="repBtnFwd"></button><button id="repBtnUp"></button><div id="repBreadcrumb"></div><button id="repViewGrid"></button><button id="repViewList"></button><div id="repRubricContent"></div><div id="repDockArea"></div><div id="repKebabMenu"></div><div id="repAskMsgs"></div><div id="repAskChips"></div></div></body></html>`;
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});const w=dom.window;
w.currentLang='ur';w.escapeHtml=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));w.toasts=[];w.showToast=m=>w.toasts.push(String(m));
w.fetch=u=>{const f=path.join(ROOT,String(u).split('?')[0]);return fs.existsSync(f)?Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(fs.readFileSync(f,'utf8')))}):Promise.reject(new Error('404 '+u));};
w.eval(require('./_rep_src')());
w.eval(fs.readFileSync(path.join(ROOT,'js/08b-rep-differentiation.js'),'utf8'));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const d=w.document; for(let i=0;i<w.REP_N_CLIPS;i++)w.repClipboards[i]=[];
  // ---------- A. algorithm on real Kent data (pure functions) ----------
  const kent=JSON.parse(fs.readFileSync(ROOT+'/kent_repertory.json','utf8'));
  const listMind=Object.keys(kent.mind).map(rid=>({book:'kent',ch:'mind',rid,t:kent.mind[rid].t,r:kent.mind[rid].r}));
  const R=['nat-m','ign','plat'];
  let t0=Date.now(); let res=w.repDiffCompute(R,listMind,{maxN:0,minG:1,sort:'grade'}); let ms=Date.now()-t0;
  // v79: OOREP کینٹ ڈیٹا کے بعد — متوقع اقدار خود ڈیٹا سے (پرانے hardcoded اعداد نہیں)
  const anyExp=listMind.filter(x=>x.r&&(x.r['nat-m']||x.r.ign||x.r.plat)).length;
  const allExp=listMind.filter(x=>x.r&&x.r['nat-m']&&x.r.ign&&x.r.plat).length;
  const onlyExp=a=>listMind.filter(x=>x.r&&x.r[a]&&!R.some(o=>o!==a&&x.r[o])).length;
  ok(res.any===anyExp&&res.allPresent===allExp,'A2/A3 mind: any='+res.any+' ('+anyExp+') allPresent='+res.allPresent+' ('+allExp+')');
  ok(res.perRem['nat-m'].excl===onlyExp('nat-m')&&res.perRem['ign'].excl===onlyExp('ign')&&res.perRem['plat'].excl===onlyExp('plat'),'A3 exclusive counts nat-m/ign/plat = '+[res.perRem['nat-m'].excl,res.perRem['ign'].excl,res.perRem['plat'].excl].join('/')+' ('+[onlyExp('nat-m'),onlyExp('ign'),onlyExp('plat')].join('/')+')');
  const topN=res.excl['nat-m'][0]; let gdesc=true;
  res.excl['nat-m'].forEach((r,i,a)=>{ if(i&&r.g>a[i-1].g) gdesc=false; });
  ok(topN.g===3&&gdesc,'A5 sort=grade: nat-m top exclusive = "'+topN.x.t.substring(0,50)+'" g'+topN.g+' N'+topN.N+', list grade-descending');
  ok(res.excl['ign'].some(r=>/^BROODING/.test(r.x.t))&&res.excl['plat'].some(r=>/^EGOTISM/.test(r.x.t)),'A3 ign exclusive has BROODING, plat has EGOTISM');
  const gd=res.grade.find(r=>/^DESPAIR$/.test(r.x.t)); ok(gd&&gd.vec.join()==='2,3,1','A3 grade-difference DESPAIR = nat-m2/ign3/plat1');
  const commonSum=res.commonEqual+res.grade.length; ok(commonSum===res.allPresent&&res.commonEqual>0&&res.grade.length>0,'A3 allPresent('+res.allPresent+') = commonEqual('+res.commonEqual+') + gradeDiff('+res.grade.length+')');
  // pairwise
  const p=res.pair['nat-m|ign']; ok(p.both+p.onlyA+p.onlyB>0&&p.onlyA>p.onlyB,'A12 pairwise nat-m|ign: onlyA='+p.onlyA+' onlyB='+p.onlyB+' both='+p.both);
  // score sort monotonic + spec formula
  res=w.repDiffCompute(R,listMind,{maxN:0,minG:1,sort:'score'});
  const L0=res.excl['nat-m']; let mono=true; for(let i=1;i<L0.length;i++) if(L0[i].score>L0[i-1].score+1e-9) mono=false;
  ok(mono&&Math.abs(w.repDiffSpec(2)-0.5)<1e-9&&Math.abs(w.repDiffSpec(0)-1)<1e-9,'A4/A5 score sort monotonic; spec(2)=0.5, spec(0)=1');
  ok(Math.abs(L0[0].score-L0[0].g*w.repDiffSpec(L0[0].N))<1e-9,'A4 score = grade × spec ('+L0[0].g+' × spec('+L0[0].N+') = '+L0[0].score.toFixed(3)+')');
  // filters: maxN 10 / minG 3
  res=w.repDiffCompute(R,listMind,{maxN:10,minG:3,sort:'score'});
  ok(res.excl['nat-m'].every(r=>r.N<=10&&r.g===3)&&res.perRem['nat-m'].excl===onlyExp('nat-m'),'A6 filters apply to lists (N≤10, g=3: '+res.excl['nat-m'].length+' rows) but counts stay complete ('+onlyExp('nat-m')+')');
  // single remedy mode
  res=w.repDiffCompute(['onos'],listMind,{maxN:0,minG:1,sort:'score'});
  ok(res.any===res.perRem['onos'].inRubrics&&res.excl['onos'].length===res.any&&res.excl['onos'][0].g>=1,'A9 single-remedy mode: onos in '+res.any+' mind rubrics, all listed as keynotes; top: "'+res.excl['onos'][0].x.t.substring(0,40)+'" g'+res.excl['onos'][0].g+' N'+res.excl['onos'][0].N);
  // whole book perf
  const listAll=[]; Object.keys(kent).forEach(ch=>Object.keys(kent[ch]).forEach(rid=>listAll.push({book:'kent',ch,rid,t:kent[ch][rid].t,r:kent[ch][rid].r})));
  t0=Date.now(); res=w.repDiffCompute(['nat-m','ign','plat','sep','puls'],listAll,{maxN:60,minG:1,sort:'score'}); ms=Date.now()-t0;
  ok(ms<1500&&res.any>8000,'A14 whole Kent ('+listAll.length+' rubrics) × 5 remedies in '+ms+' ms; any='+res.any);
  // remedy sizes
  const sizes=w.repDiffRemedySizes('kent',kent);
  const bookCount=a=>{let n=0;Object.keys(kent).forEach(ch=>Object.keys(kent[ch]).forEach(rid=>{if((kent[ch][rid].r||{})[a])n++;}));return n;};
  ok(sizes['nat-m']===bookCount('nat-m')&&sizes['onos']===bookCount('onos')&&sizes['nat-m']>5000&&sizes['onos']>100,'A1 remedy sizes nat-m='+sizes['nat-m']+' onos='+sizes['onos']+' (book-wide counts)');
  // rubric mode on ABSENT-MINDED (r2)
  const ctx={book:'kent',ch:'mind',rid:'r2',full:kent.mind.r2.t,rems:kent.mind.r2.r};
  const feats=w.repDiffClusterFor(ctx,kent);
  const subN=feats.filter(f=>f.kind==='sub').length, xN=feats.filter(f=>f.kind==='x').length;
  const r2r=kent.mind.r2.r||{};
  const subRub=Object.keys(kent.mind).filter(rid=>rid!=='r2'&&kent.mind[rid].t.indexOf(kent.mind.r2.t+', ')===0);
  const subExp=subRub.filter(rid=>Object.keys(kent.mind[rid].r||{}).some(a=>r2r[a])).length;
  ok(subN===subExp&&subN>0&&xN>0,'A10 cluster for ABSENT-MINDED: '+subN+' sub-rubrics sharing remedies ('+subRub.length+' exist, '+subExp+' share) + '+xN+' FORGETFUL-related (total '+feats.length+', cap '+w.REP_DIFF_FEAT_CAP+')');
  const rm=w.repDiffRubricMode(ctx,kent,sizes);
  const nuxm=rm.rows.find(r=>r.abbr==='nux-m');
  ok(nuxm&&nuxm.rare.some(x=>/periodical attacks/.test(x.f.label)),'A10 nux-m rare feature "periodical attacks" flagged');
  ok(rm.rows[0].g===3&&rm.rows.every((r,i)=>i===0||rm.rows[i-1].g>r.g||(rm.rows[i-1].g===r.g&&rm.rows[i-1].score>=r.score)),'A7/A10 rows sorted by main grade then normalized score; top='+rm.rows[0].abbr+' ('+rm.rows[0].score.toFixed(2)+')');
  const onosRow=rm.rows.find(r=>r.abbr==='onos'); ok(onosRow&&onosRow.rawScore>0&&onosRow.score>onosRow.rawScore/3,'A7 polychrest correction: onos raw '+onosRow.rawScore.toFixed(2)+' → normalized '+onosRow.score.toFixed(2));
  // theme words + witness
  const words=w.repDiffThemeWordsFor(ctx); ok(/absent/.test(words)&&/forget/.test(words),'A11 theme words auto: "'+words+'"');
  const all={kent, allen_fever:JSON.parse(fs.readFileSync(ROOT+'/allen_fever_repertory.json','utf8')), keynotes_cc:JSON.parse(fs.readFileSync(ROOT+'/keynotes_cc_repertory.json','utf8'))};
  const wit=w.repDiffBooksWitness(['nat-m','nux-m','apis'],all,'kent',words);
  const af=wit.find(g=>g.book==='allen_fever'); ok(af&&af.rows.some(r=>/^Absent minded$/i.test(r.t)&&r.vec.join()==='1,2,3'),'A11 Allen Fever witness: "Absent minded" nat-m1/nux-m2/apis3');
  // ---------- B. UI flows ----------
  w.repCurrentBook='kent'; w.selectChapter('mind'); for(let i=0;i<100&&!d.getElementById('repCardsArea');i++)await sleep(50); await sleep(150);
  w.repOpenRubricDetail(kent.mind.r2.t,'r2'); for(let i=0;i<60&&!d.querySelector('.rpd-diff');i++)await sleep(50); await sleep(100);
  ok(d.querySelector('.rpd-diff')&&d.querySelector('.rpd-sec-head .rst-link'),'B1 detail page shows 🔬 تفریق button (title row + remedies header)');
  w.repDiffOpenForRubric(); await sleep(50);
  ok(w.repDiffIsOpen()&&d.getElementById('repDiffModal').style.display==='block','B1 modal opens');
  const r2Count=Object.keys(kent.mind.r2.r||{}).length;
  ok(d.querySelectorAll('.rep-diff-chips .rtv-r').length===r2Count,'B4 picker shows '+r2Count+' remedy chips');
  ok(w.repDiffTab==='rubric','B6 opens on rubric-remedies tab');
  for(let i=0;i<100&&!d.querySelector('.rep-diff-tbl');i++)await sleep(50);
  ok(d.querySelector('.rep-diff-tbl')&&d.querySelectorAll('.rep-diff-tbl tbody tr').length===r2Count,'B9 rubric table rendered: '+r2Count+' rows, '+d.querySelectorAll('.rep-diff-tbl th.ft').length+' feature columns');
  ok(d.querySelector('.rep-diff-tbl tbody tr td.rare .rep-diff-rare'),'B9 rare features shown ⭐');
  // pick 3 remedies via chips
  const chip=a=>Array.from(d.querySelectorAll('.rep-diff-chips .rtv-r')).find(e=>e.textContent.trim().toLowerCase()===a);
  chip('nat-m').click(); await sleep(30); chip('ign').click(); await sleep(30); chip('plat').click();
  for(let i=0;i<100&&!(w.repDiffLast&&w.repDiffLast.res);i++)await sleep(50); await sleep(50);
  ok(w.repDiffSel.join()==='nat-m,ign,plat'&&w.repDiffTab==='excl','B4 three chips picked → exclusive tab; sel='+w.repDiffSel.join());
  ok(d.querySelectorAll('.rep-diff-col').length===3,'B8 three exclusive columns rendered');
  ok(d.querySelector('.rep-diff-sum')&&d.querySelector('.rep-diff-pairs')&&d.querySelectorAll('.rep-diff-pairs span').length===3,'B7 summary strip + 3 pairwise entries');
  const rows=d.querySelectorAll('.rep-diff-col .rep-diff-row'); ok(rows.length>10,'B8 rows rendered: '+rows.length);
  // ☑ adds to active clipboard
  const n0=w.repClipboards[w.repActiveClip].length; rows[0].querySelector('.rpc-chk').click();
  ok(w.repClipboards[w.repActiveClip].length===n0+1&&rows[0].querySelector('.rpc-chk').classList.contains('on'),'B8 ☑ on a result row adds rubric to active clipboard');
  w.repDiffRenderBody(); ok(d.querySelector('.rep-diff-incase'),'A13/B8 in-case marker 📋 shown after adding');
  // grade tab / partial / common
  w.repDiffSetTab('grade'); await sleep(20); ok(d.querySelectorAll('#repDiffBody .rep-diff-row').length>0&&d.querySelector('.rep-diff-legend'),'B6 grade-difference tab renders with legend');
  w.repDiffSetTab('common'); await sleep(20); ok(d.querySelectorAll('#repDiffBody .rep-diff-row').length>0,'B6 common tab renders');
  // scope change to chapter + sort change persists
  w.repDiffSetOpt('scope','chapter'); for(let i=0;i<60&&!(w.repDiffLast&&w.repDiffLast.scope==='chapter');i++)await sleep(50);
  ok(w.repDiffLast.scope==='chapter'&&w.repDiffLast.scanned===Object.keys(kent.mind).length&&w.repDiffLast.n<=w.repDiffLast.scanned&&JSON.parse(w.localStorage.getItem('bc_rep_diff_opts')).scope==='chapter','B5 scope=chapter → scanned '+w.repDiffLast.scanned+', '+w.repDiffLast.n+' kept after the size cap (v68.7: filtering happens while collecting); persisted');
  w.repDiffSetOpt('scope','book'); for(let i=0;i<60&&!(w.repDiffLast&&w.repDiffLast.scope==='book');i++)await sleep(50);
  ok(w.repDiffLast.scanned===listAll.length&&w.repDiffLast.n<=listAll.length&&w.repDiffLast.n>0,'B5 scope=book → scanned '+w.repDiffLast.scanned+', kept '+w.repDiffLast.n+' (size cap '+w.repDiffOpts.maxN+')');
  // typed add + max 5 + toggle off
  const typed=async v=>{ const inp=d.getElementById('repDiffInput'); inp.value=v; w.repDiffAddTyped(); await sleep(30); };
  await typed('SEP'); ok(w.repDiffSel.indexOf('sep')!==-1,'B4 typed abbreviation (case-insensitive) added: '+w.repDiffSel.join());
  await typed('puls'); w.toasts.length=0; await typed('lyc'); ok(w.repDiffSel.length===5&&w.toasts.length===1&&w.repDiffSel.indexOf('lyc')===-1,'B4 max 5 enforced with toast (sel='+w.repDiffSel.join()+')');
  w.repDiffToggleRem('sep'); w.repDiffToggleRem('puls'); await sleep(20); ok(w.repDiffSel.join()==='nat-m,ign,plat','B4 toggling removes remedies');
  // books witness tab
  w.repDiffSetTab('books'); for(let i=0;i<200&&!d.querySelector('.rep-diff-sec .rep-book-badge');i++)await sleep(50);
  ok(d.getElementById('repDiffThemeInp')&&d.getElementById('repDiffThemeInp').value.includes('absent'),'B10 theme input prefilled: "'+(d.getElementById('repDiffThemeInp')||{}).value+'"');
  ok(d.querySelector('.rep-diff-sec'),'B10 witness groups rendered ('+d.querySelectorAll('.rep-diff-sec').length+' books)');
  d.getElementById('repDiffThemeInp').value='grief, sigh, consol'; w.repDiffThemeApply(); await sleep(50);
  ok(Array.from(d.querySelectorAll('#repDiffBody .rep-diff-t')).some(e=>/Grief|Sighing/i.test(e.textContent)),'B10 edited theme words → Grief/Sighing rows');
  // single remedy → keynotes tab label
  w.repDiffOpenWithRemedies(['onos'],ctx); for(let i=0;i<60&&!(w.repDiffLast&&w.repDiffLast.res&&w.repDiffSel.length===1);i++)await sleep(50); await sleep(30);
  ok(d.querySelector('.rep-diff-tabs button.on')&&/کی نوٹس|Keynotes/.test(d.querySelector('.rep-diff-tabs button.on').textContent),'A9/B6 single remedy → keynotes tab');
  // click rubric text navigates + closes
  let nav=null; w.navigateToRubric=(b,c,rid)=>{nav=[b,c,rid];}; const first=d.querySelector('#repDiffBody .rep-diff-t'); first.click();
  ok(nav&&nav[0]==='kent'&&!w.repDiffIsOpen(),'B8 clicking a rubric opens it and closes the modal ('+(nav&&nav.join('/'))+')');
  // grid buttons hook
  w.repClipboards[0]=[{book:'kent',ch:'mind',rid:'r2',path:kent.mind.r2.t,rems:111,ts:1,w:1},{book:'kent',ch:'mind',rid:'r2449',path:kent.mind.r2449.t,rems:32,ts:1,w:1}];
  w.repEnsureAllBooks=cb=>cb({kent}); w.repOpenWorkbench('grid'); await sleep(150);
  ok(d.querySelectorAll('.rep-ana-diff').length===2,'B2 Workbench Grid shows 🔬 top-3 / top-5 buttons');
  d.querySelector('.rep-ana-diff').click(); await sleep(30); ok(w.repDiffIsOpen()&&w.repDiffSel.length===3,'B2 grid button opens differentiation with top 3: '+w.repDiffSel.join());
  // Esc closes
  d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'})); ok(!w.repDiffIsOpen(),'B13 Esc closes modal');
  // Ask AI hook
  d.getElementById('repAskMsgs').innerHTML='<div id="repAskTyping">⏳</div>'; w.repAskAnswer('تفریق کیا ہے'); await sleep(20); ok(/🔬/.test(d.getElementById('repAskMsgs').innerHTML)&&/repDiffOpenWithRemedies/.test(d.getElementById('repAskMsgs').innerHTML),'B3 Ask AI answers on تفریق with open button');
  console.log(fails?'FAILURES: '+fails:'ALL TESTS PASSED'); process.exit(fails?1:0);
})().catch(e=>{console.error('CRASH',e);process.exit(2);});
