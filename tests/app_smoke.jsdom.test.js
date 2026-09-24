// Smoke test: load the real index.html with ALL scripts in jsdom and make sure nothing throws at load time,
// the repertory page initialises, and the new modules are wired. Run: node tests/app_smoke.jsdom.test.js
const fs=require('fs'),path=require('path');const {JSDOM,VirtualConsole}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
const errors=[]; const vc=new VirtualConsole(); vc.on('jsdomError',e=>{ const st=(e&&e.detail&&e.detail.stack)||(e&&e.stack)||''; if(/https?:\/\/(cdn\.|.*heapanalytics|.*cloudflare|.*jsdelivr)/i.test(st)) return; errors.push(String(e&&e.message||e)+' '+st.split('\n').slice(1,9).join(' ')); }); vc.on('error',(...a)=>errors.push(a.join(' ')));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  // needs the local static server (python3 -m http.server 8080 in the app folder) for a real origin (localStorage etc.)
  const BASE=process.env.APP_URL||'http://localhost:8080/';
  const dom=await JSDOM.fromURL(BASE+'index.html',{runScripts:'dangerously',resources:'usable',pretendToBeVisual:true,virtualConsole:vc});
  const w=dom.window,d=w.document;
  // data fetches: serve local files
  w.fetch=u=>{const f=path.join(ROOT,String(u).replace(/^\.\//,'').split('?')[0]);return fs.existsSync(f)?Promise.resolve({ok:true,status:200,json:()=>Promise.resolve(JSON.parse(fs.readFileSync(f,'utf8'))),text:()=>Promise.resolve(fs.readFileSync(f,'utf8'))}):Promise.resolve({ok:false,status:404,json:()=>Promise.reject(new Error('404')),text:()=>Promise.resolve('')});};
  for(let i=0;i<100&&typeof w.initRepertoryBrowser!=='function';i++)await sleep(100);
  await sleep(500);
  // external CDN scripts (supabase/jsdelivr) cannot run inside jsdom — their own errors are not ours
  const loadErrs=errors.filter(e=>!/(Uncaught \[TypeError: Cannot read properties of undefined (reading 'slice')\][\s\S]*?HTMLScriptElement|Could not load (img|script)|Not implemented: HTMLCanvasElement|navigation|localStorage|serviceWorker|Not implemented: window\.(scrollTo|alert)|indexedDB|fetch|net::|ENOENT.*(png|jpg|ico|woff)|cdn-cgi|onLoadExternalScript)/i.test(e));
  ok(typeof w.initRepertoryBrowser==='function'&&typeof w.repDiffOpenForRubric==='function'&&typeof w.repMMOpen==='function'&&typeof w.repPrivImportText==='function'&&typeof w.repCmpModeToggle==='function','all repertory modules loaded (08, 08b, 08c)');
  ok(loadErrs.length===0,'no script errors at load'+(loadErrs.length?': '+loadErrs.slice(0,3).join(' | ').substring(0,300):''));
  ok(d.getElementById('repCmpModeBtn')&&d.getElementById('repCmpPanel')&&d.getElementById('repBookSelect')&&d.getElementById('repBookSelect').options.length===11,'repertory toolbar present with 11 books');
  // open repertory page: kent/mind auto-open
  errors.length=0; w.repCurrentBook='kent'; w.initRepertoryBrowser(); for(let i=0;i<100&&!d.getElementById('repCardsArea');i++)await sleep(100); await sleep(300);
  ok(d.querySelectorAll('#repChapterList .rep-chapter-item, #repChapterList [onclick*="repOpenChapter"]').length>=30||d.getElementById('repChapterList').textContent.length>200,'chapter list rendered');
  ok(d.querySelectorAll('.rtv-row').length>100,'Mind chapter auto-opened with cards ('+d.querySelectorAll('.rtv-row').length+')');
  w.repCmpModeSet(true); await sleep(50); ok(d.querySelectorAll('.rpc-chk').length>100,'Compare Mode works in the full app'); w.repCmpModeSet(false);
  const mind=JSON.parse(fs.readFileSync(ROOT+'/kent_chapters/mind.json','utf8')); w.repOpenRubricDetail(mind.r2.t,'r2'); for(let i=0;i<60&&!d.querySelector('.rpd-diff');i++)await sleep(100); await sleep(200);
  ok(d.querySelector('.rpd-diff')&&d.querySelector('#repDetailCmpBtn'),'rubric page: 🔬 + Compare buttons');
  w.repDiffOpenForRubric(); await sleep(100); for(let i=0;i<100&&!d.querySelector('.rep-diff-tbl');i++)await sleep(100);
  ok(w.repDiffIsOpen()&&d.querySelector('.rep-diff-tbl'),'differentiation window opens with rubric table');
  w.repDiffToggleRem('nat-m'); await sleep(50); for(let i=0;i<60&&!(w.repDiffLast&&w.repDiffLast.res);i++)await sleep(100);
  w.repDiffSetTab('mm'); for(let i=0;i<300&&!d.querySelector('.rep-mm-e-left .rep-mm-draft');i++)await sleep(100);
  ok(d.querySelector('.rep-mm-e-left')&&d.querySelector('.rep-mm-e-right textarea')&&d.querySelector('.rep-mm-draft'),'📖 tab (writing mode) renders with a draft + sticky editor (progressive load ok)');
  // new repertory book: Hering Analytical (Mind) opens with its first chapter
  w.repDiffClose&&w.repDiffClose(); w.repCurrentBook='hering_mind'; w.repCurrentChapter=''; w.initRepertoryBrowser(); for(let i=0;i<100&&!(w.repCurrentBook==='hering_mind'&&d.querySelectorAll('.rtv-row').length>20);i++)await sleep(100);
  ok(w.repCurrentChapter==='ailments_from_emotions_and_exertions_of_the_mind'&&d.querySelectorAll('.rtv-row').length>20,'Hering Analytical Repertory (Mind) book opens: chapter '+w.repCurrentChapter+', '+d.querySelectorAll('.rtv-row').length+' cards');
  // v68: Boger Times book opens on its hour chapter
  w.repCurrentBook='boger_times'; w.repCurrentChapter=''; w.initRepertoryBrowser(); for(let i=0;i<100&&!(w.repCurrentBook==='boger_times'&&d.querySelectorAll('.rtv-row').length>20);i++)await sleep(100);
  ok(w.repCurrentChapter==='general_hour'&&d.querySelectorAll('.rtv-row').length>20,'Boger Times of Remedies book opens: chapter '+w.repCurrentChapter+', '+d.querySelectorAll('.rtv-row').length+' cards');
  // v68: Boericke & Dewey tissue-remedy therapeutics opens
  w.repCurrentBook='tissues_bd'; w.repCurrentChapter=''; w.initRepertoryBrowser(); for(let i=0;i<100&&!(w.repCurrentBook==='tissues_bd'&&d.querySelectorAll('.rtv-row').length>10);i++)await sleep(100);
  ok(w.repCurrentChapter==='tissue_therapeutics'&&d.querySelectorAll('.rtv-row').length>10,'Boericke-Dewey Tissue Remedies book opens: '+d.querySelectorAll('.rtv-row').length+' disease rubrics');
    const late=errors.filter(e=>!/Could not load (img|script)|Not implemented|net::|ENOENT|data load fail|404|onLoadExternalScript/i.test(e));
  console.log(fails?'FAILURES: '+fails:'ALL TESTS PASSED'); w.close(); process.exit(fails?1:0);
})().catch(e=>{console.error('CRASH',e);process.exit(2);});
