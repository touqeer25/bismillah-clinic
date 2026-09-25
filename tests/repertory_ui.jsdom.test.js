// Regression: ☑ Compare Mode, detail page (Homeosetu notes only), analysis rules, Combine/Merge.
// Run: node tests/repertory_ui.jsdom.test.js   (needs jsdom: JSDOM_PATH env or /tmp/jsd/node_modules/jsdom)
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
const html=`<!doctype html><html><body><div id="page-repertoryBrowser"><select id="repBookSelect"><option value="kent" selected>K</option></select><select id="repScopeSelect"><option value="book" selected>b</option><option value="all">a</option></select><input id="repBrowserSearch"><button id="repCmpModeBtn" class="rep-cmp-btn"></button><div class="rep-side-tools" id="repSideTools"><span id="repSelCount"></span><div id="repCmpPanel" style="display:none"></div></div><aside id="repChapterList"></aside><span id="repCountInfo"></span><button id="repBtnBack"></button><button id="repBtnFwd"></button><button id="repBtnUp"></button><div id="repBreadcrumb"></div><button id="repViewGrid"></button><button id="repViewList"></button><div id="repRubricContent"></div><div id="repDockArea"></div><div id="repKebabMenu"></div></div></body></html>`;
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});const w=dom.window;
w.currentLang='ur';w.escapeHtml=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));w.toasts=[];w.showToast=m=>w.toasts.push(String(m));w.prompt=()=>'Combined Test';
w.fetch=u=>{const f=path.join(ROOT,String(u).split('?')[0]);return fs.existsSync(f)?Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(fs.readFileSync(f,'utf8')))}):Promise.reject(new Error('404 '+u));};
w.eval(require('./_rep_src')());
w.eval(fs.readFileSync(path.join(ROOT,'js/08b-rep-differentiation.js'),'utf8'));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const d=w.document; for(let i=0;i<w.REP_N_CLIPS;i++)w.repClipboards[i]=[]; w.repEnsureAllBooks=cb=>cb({});
  w.repCurrentBook='kent'; w.selectChapter('mind'); for(let i=0;i<100&&!d.getElementById('repCardsArea');i++)await sleep(50); await sleep(150);
  const mind=JSON.parse(fs.readFileSync(ROOT+'/kent_chapters/mind.json','utf8'));
  ok(d.querySelectorAll('.rtv-row').length>50&&d.querySelectorAll('.rpc-chk').length===0,'cards rendered, no ☐ while Compare Mode off');
  w.repCmpModeSet(true); await sleep(30);
  const chks=d.querySelectorAll('.rpc-chk'); ok(chks.length>50&&d.getElementById('repCmpModeBtn').classList.contains('on'),'Compare Mode ON → ☐ on cards');
  chks[1].click(); chks[2].click(); ok(w.repClipboards[0].length===2&&d.querySelectorAll('#repCmpPanel .rst-chip').length===2,'tick 2 cards → 2 in active clipboard + 2 chips');
  chks[1].click(); ok(w.repClipboards[0].length===1,'untick removes');
  d.querySelector('#repCmpPanel .rst-chip-x').click(); ok(w.repClipboards[0].length===0&&d.querySelectorAll('.rpc-chk.on').length===0,'chip ✕ removes + unticks');
  // detail page
  w.repOpenRubricDetail(mind.r2.t,'r2'); for(let i=0;i<60&&!d.getElementById('repDetailChev');i++)await sleep(50); await sleep(100);
  const chev=d.getElementById('repDetailChev'); ok(chev.textContent==='▸','chevron closed = ▸'); w.repToggleDetailInfo(); ok(chev.textContent==='▾'&&chev.classList.contains('open'),'chevron open = ▾ (no rotation)');
  const info=d.getElementById('repDetailInfo');
  ok(info.querySelector('.rpd-sec.meaning .rpd-note')&&info.querySelector('.rpd-sec.patient .rpd-note')&&info.querySelector('.rpd-sec.when .rpd-note'),'r2: Homeosetu MEANING/PATIENT/WHEN present');
  ok(!info.querySelector('.rpd-tok:not(.rpd-cc)')&&!info.textContent.includes('مریض عام زبان')&&!info.textContent.includes('باب میں آتی ہے'),'old app-generated texts absent');
  ok(d.getElementById('repDetailCmpBtn')&&d.querySelector('.rpd-diff'),'title row: + Compare and 🔬 buttons');
  w.repDetailCmpToggle(); ok(w.repClipboards[0].length===1&&d.getElementById('repDetailCmpBtn').classList.contains('on'),'detail + Compare toggle adds');
  w.repCmpModeSet(false); await sleep(30); ok(d.querySelectorAll('.rpc-chk').length===0,'Compare Mode OFF → no ☐');
  // rules
  const big=Object.keys(mind).filter(rid=>Object.keys(mind[rid].r).length>=40).slice(0,3); const [R1,R2,R3]=big;
  w.repClipboards[0]=[{book:'kent',ch:'mind',rid:R1,path:mind[R1].t,rems:1,ts:1,w:2},{book:'kent',ch:'mind',rid:R2,path:mind[R2].t,rems:1,ts:1,w:1},{book:'kent',ch:'mind',rid:R3,path:mind[R3].t,rems:1,ts:1,w:1}];
  w.repClipElims.fill(false); w.repAnaOpts.cov='count'; w.repAnaOpts.elim='every';
  const inAll=Object.keys(mind[R1].r).filter(a=>mind[R2].r[a]&&mind[R3].r[a]); const inAny=new Set([...Object.keys(mind[R1].r),...Object.keys(mind[R2].r),...Object.keys(mind[R3].r)]);
  let r=w._repWbGridCompute({}); const a0=inAll[0]; ok(r.denom===3&&r.col[a0].cov===3,'coverage rule count: denom 3, cov 3 (weight only in score)');
  w.repAnaOpts.cov='weighted'; r=w._repWbGridCompute({}); ok(r.denom===4&&r.col[a0].cov===4,'coverage rule weighted: denom 4'); w.repAnaOpts.cov='count';
  w.repClipElims[0]=true; r=w._repWbGridCompute({}); ok(r.abbrs.length===inAll.length,'elimination every → intersection '+r.abbrs.length);
  w.repAnaOpts.elim='any'; r=w._repWbGridCompute({}); ok(r.abbrs.length===inAny.size,'elimination any → union '+r.abbrs.length); w.repAnaOpts.elim='every'; w.repClipElims[0]=false;
  // combine / merge
  w.repClipboards[0][0].sel=true; w.repClipboards[0][1].sel=true; w.repOpenWorkbench(); await sleep(50);
  ok(d.querySelector('.rep-ana-rules')&&d.querySelector('.rep-wb-combrow'),'workbench: rules bar + combine row');
  const before=w.repClipboards[0].length; w.repClipCombine(0); await sleep(80); const comb=w.repClipboards[0].find(x=>x.combined);
  ok(comb&&w.repClipboards[0].length===before-1&&comb.sources.length===2&&Object.keys(comb.remsObj).length>0,'combine 2 → 1 with union remedies');
  w.repClipUncombine(0,w.repClipboards[0].indexOf(comb)); await sleep(30); ok(w.repClipboards[0].length===before&&!w.repClipboards[0].some(x=>x.combined),'uncombine restores');
  w.repClipboards[0].forEach(x=>x.sel=false); w.repClipboards[0][1].sel=true; w.repClipboards[0][2].sel=true; w.repClipMerge(0); await sleep(80);
  ok(w.repClipboards[0].some(x=>x.combined&&/ \+ /.test(x.path)),'merge 2→1 "A + B"');
  w.repWbSetTab('grid'); await sleep(80); ok(d.querySelectorAll('.rep-ana-table tfoot tr').length===2&&d.querySelectorAll('.rep-ana-diff').length>=1,'grid: coverage+score rows + 🔬 button');
  console.log(fails?'FAILURES: '+fails:'ALL TESTS PASSED'); process.exit(fails?1:0);
})().catch(e=>{console.error('CRASH',e);process.exit(2);});
