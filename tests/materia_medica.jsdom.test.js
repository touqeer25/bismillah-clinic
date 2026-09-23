// jsdom tests: 📖 materia medica module (v56) — data, sentence matching, drafts, notes, UI
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
const html=`<!doctype html><html><body><div id="page-repertoryBrowser"><select id="repBookSelect"><option value="kent" selected>K</option></select><select id="repScopeSelect"><option value="book" selected>b</option><option value="all">a</option></select><input id="repBrowserSearch"><button id="repCmpModeBtn"></button><div id="repSideTools"><span id="repSelCount"></span><div id="repCmpPanel"></div></div><aside id="repChapterList"></aside><span id="repCountInfo"></span><button id="repBtnBack"></button><button id="repBtnFwd"></button><button id="repBtnUp"></button><div id="repBreadcrumb"></div><button id="repViewGrid"></button><button id="repViewList"></button><div id="repRubricContent"></div><div id="repDockArea"></div><div id="repKebabMenu"></div><div id="repAskMsgs"></div></div></body></html>`;
const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'http://localhost/'});const w=dom.window;
w.currentLang='ur';w.escapeHtml=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));w.toasts=[];w.showToast=m=>w.toasts.push(String(m));
w.fetch=u=>{const f=path.join(ROOT,String(u).split('?')[0]);return fs.existsSync(f)?Promise.resolve({ok:true,json:()=>Promise.resolve(JSON.parse(fs.readFileSync(f,'utf8')))}):Promise.reject(new Error('404 '+u));};
['js/08-app-repertory.js','js/08b-rep-differentiation.js','js/08c-rep-materia-medica.js'].forEach(f=>w.eval(fs.readFileSync(path.join(ROOT,f),'utf8')));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  const d=w.document; for(let i=0;i<w.REP_N_CLIPS;i++)w.repClipboards[i]=[]; w.localStorage.clear();
  // ---- data ----
  await new Promise(r=>w.repMMEnsureAll(r));
  const ids=w.repMMBookIds(); ok(ids.length>=15&&w.repMMLoaded(),'MM books loaded ('+ids.length+'): '+ids.join(', '));
  ok(w.repMMEntry('clarke_dictionary','nat-m')&&w.repMMEntry('clarke_dictionary','nat-m').sections.some(s=>s.h==='Characteristics')&&w.repMMEntry('farrington_clinical','nat-m'),'Clarke (sectioned) + Farrington have Natrum mur');
  ok(w.repMMEntry('hering_condensed','nat-m')&&w.repMMEntry('hering_condensed','nat-m').sections[0].h==='Mind','Hering Condensed nat-m starts with Mind section');
  const ix=JSON.parse(fs.readFileSync(ROOT+'/mm/_index.json','utf8'));
  ok(Object.values(ix.books).every(b=>b.remedies>60),'each book has >60 remedies: '+Object.entries(ix.books).map(([k,v])=>k+'='+v.remedies).join(' '));
  const av=w.repMMAvail('nat-m'); ok(av.indexOf('kent_lectures')!==-1&&av.indexOf('allen_keynotes')!==-1&&av.indexOf('nash_leaders')!==-1,'nat-m available in Kent/Allen/Nash ('+av.join(',')+')');
  const e=w.repMMEntry('kent_lectures','nat-m'); ok(e&&/Natrum/i.test(e.name)&&e.sections[0].p.length>40,'Kent lecture Natrum mur: '+(e&&e.sections[0].p.length)+' paragraphs');
  const eb=w.repMMEntry('boericke','nat-m'); if(eb) ok(eb.sections.some(s=>s.h==='Mind')&&eb.sections.some(s=>/Modalities|Relationship/.test(s.h)),'Boericke nat-m sections: '+eb.sections.map(s=>s.h||'(intro)').join(', '));
  // ---- text helpers ----
  ok(w.repMMFmt('a **bold** and _ital_ x')==='a <b>bold</b> and <i>ital</i> x','markers → html');
  ok(w.repMMFmt('<x>')==='&lt;x&gt;','html escaped');
  const sents=w.repMMSentences('First one. Second; third? Fourth!'); ok(sents.length===4,'sentence split: '+JSON.stringify(sents));
  const re=w.repDiffThemeRegex('grief, consol, weep');
  const ms=w.repMMMatches('nat-m',re); ok(ms.length>3&&ms.every(m=>re.test(w.repMMPlain(m.text))),'nat-m matches for grief/consol/weep: '+ms.length+' sentences; e.g. "'+w.repMMPlain(ms[0].text).substring(0,70)+'…" '+w.repMMRef(ms[0]));
  const perBook={}; ms.forEach(m=>perBook[m.book]=(perBook[m.book]||0)+1); ok(Object.values(perBook).every(n=>n<=w.REP_MM_MAX_PER_BOOK),'≤ '+w.REP_MM_MAX_PER_BOOK+' sentences per book: '+JSON.stringify(perBook));
  const dr=w.repMMDraft('nat-m',re); ok(dr.length>=2&&dr.length<=4&&Object.values(dr.reduce((o,m)=>(o[m.book]=(o[m.book]||0)+1,o),{})).every(n=>n<=2),'draft: '+dr.length+' sentences, ≤2 per book');
  const dt=w.repMMDraftText('nat-m',re); ok(/\[Kent|\[Allen|\[Nash|\[Boericke/.test(dt)&&dt.split('\n').length===dr.length,'draft text carries references:\n   '+dt.split('\n')[0].substring(0,120));
  const ign=w.repMMDraftText('ign',w.repDiffThemeRegex('sigh, grief')); ok(/sigh|grief/i.test(ign),'ign draft on sigh/grief: "'+ign.split('\n')[0].substring(0,100)+'"');
  // ---- notes store ----
  const ctx={book:'kent',ch:'mind',rid:'r9999',full:'TEST RUBRIC',rems:{}};
  const base=w.repNotesCount().total; w.repNoteSet(ctx,'nat-m','test note','draft'); ok(w.repNoteGet(ctx,'nat-m').status==='draft'&&JSON.parse(w.localStorage.getItem('bc_rep_diff_notes'))['kent|mind|r9999|nat-m'].text==='test note','note saved (draft) in localStorage');
  w.repNoteSet(ctx,'nat-m','test note 2','approved'); ok(w.repNotesCount().approved===1&&w.repNoteGet(ctx,'nat-m').text==='test note 2','note approved + counted');
  w.repNoteSet(ctx,'nat-m','',''); ok(w.repNotesCount().total===base,'empty text deletes note (back to '+base+')');
  ok(w.repNotesImportText(JSON.stringify({notes:{'kent|mind|r2|ign':{text:'x',status:'draft',abbr:'ign'}}}))===1&&w.repNotesCount().total===base+1,'import JSON notes');
  // ---- UI: differentiation window → 📖 tab ----
  w.repCurrentBook='kent'; w.selectChapter('mind'); for(let i=0;i<100&&!d.getElementById('repCardsArea');i++)await sleep(50); await sleep(150);
  const mind=JSON.parse(fs.readFileSync(ROOT+'/kent_chapters/mind.json','utf8'));
  w.repOpenRubricDetail(mind.r2.t,'r2'); for(let i=0;i<60&&!d.querySelector('.rpd-diff');i++)await sleep(50); await sleep(50);
  ok(Array.from(d.querySelectorAll('.rpd-sec-head .rst-link')).some(b=>/میٹیریا/.test(b.textContent)),'detail page REMEDIES header has 📖 materia medica button');
  w.repDiffOpenForRubric(); await sleep(50); for(let i=0;i<100&&!d.querySelector('.rep-diff-tbl');i++)await sleep(50);
  ok(Array.from(d.querySelectorAll('.rep-diff-tabs button')).some(b=>/میٹیریا/.test(b.textContent)),'differentiation window has 📖 tab');
  w.repDiffToggleRem('nat-m'); await sleep(30); w.repDiffToggleRem('ign'); await sleep(30);
  for(let i=0;i<60&&!(w.repDiffLast&&w.repDiffLast.res);i++)await sleep(50);
  w.repDiffSetTab('mm'); await sleep(80);
  const cards=d.querySelectorAll('.rep-mm-card'); ok(cards.length===2,'📖 tab: one card per selected remedy ('+cards.length+')');
  ok(d.querySelector('.rep-mm-draft')&&d.querySelectorAll('.rep-mm-draftline').length>=1&&d.querySelector('.rep-mm-ref'),'auto draft shown with references ('+d.querySelectorAll('.rep-mm-draftline').length+' lines, theme='+w.repDiffTheme+')');
  ok(d.querySelector('.rep-mm-more .rep-mm-sent mark'),'matching sentences highlight theme words');
  ok(d.querySelectorAll('.rep-mm-note textarea').length===2,'note editor per remedy');
  // adopt draft → approve
  const ta=d.querySelector('.rep-mm-note textarea'); const id=ta.id; const abbr=id.replace('repNote_','').replace(/_/g,'-');
  w.repNoteAdoptDraft(abbr,id); ok(d.getElementById(id).value.length>20,'adopt draft fills editor for '+abbr);
  w.repNoteSaveFrom(abbr,id,'approved'); await sleep(30);
  ok(w.repNoteGet(w.repDiffCtx,abbr)&&w.repNoteGet(w.repDiffCtx,abbr).status==='approved'&&d.querySelector('.rep-mm-note.ok .rep-mm-status.approved'),'approved note shows ✔ and persists (key '+w.repNoteKey(w.repDiffCtx,abbr)+')');
  // theme change in mm tab
  d.getElementById('repDiffThemeInp').value='sigh'; w.repDiffThemeApplyMM(); await sleep(30);
  ok(w.repDiffTheme==='sigh'&&Array.from(d.querySelectorAll('.rep-mm-draftline')).some(e=>/sigh/i.test(e.textContent)),'theme words edited → drafts follow (sigh)');
  // ---- MM viewer ----
  w.repDiffClose(); w.repMMOpenForRubric(); await sleep(100);
  ok(d.getElementById('repMMModal').style.display==='block'&&d.querySelectorAll('.rep-mm-rembtn').length>50,'MM viewer opens with rubric remedy list ('+d.querySelectorAll('.rep-mm-rembtn').length+')');
  w.repMMSetRem('nat-m'); await sleep(30);
  ok(d.querySelector('.rep-mm-section .rep-mm-p')&&/Natrum/i.test(d.querySelector('.rep-mm-src').textContent),'viewer shows Natrum text with source line');
  const tabs=d.querySelectorAll('#repMMHead .rep-diff-tabs button'); ok(tabs.length>=3&&Array.from(tabs).some(b=>b.classList.contains('on')),'book tabs rendered ('+tabs.length+')');
  d.getElementById('repMMQ').value='consolation'; w.repMMSearch(); await sleep(20);
  ok(d.querySelectorAll('.rep-mm-p.hit').length>0&&d.querySelector('.rep-mm-p mark'),'in-text search highlights "consolation": '+d.querySelectorAll('.rep-mm-p.hit').length+' paragraphs');
  const nash=Array.from(tabs).find(b=>/Nash/.test(b.textContent)); if(nash&&!nash.disabled){ nash.click(); await sleep(20); ok(/Nash/.test(d.querySelector('.rep-mm-src').textContent),'switch to Nash tab'); }
  d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape'})); ok(d.getElementById('repMMModal').style.display==='none','Esc closes viewer');
  // ---- 🔒 private books (memory fallback in jsdom: no IndexedDB) ----
  const priv={books:[{id:'priv_test_mm',title:'Test Private MM',author:'Dr. Tester',year:2020,private:true,format:'pages',pages:[{p:1,t:'Natrum muriaticum: silent grief, cannot weep before others; consolation aggravates. Absent-minded while reading.'},{p:2,t:'Ignatia amara: sighing, changeable mood after grief.'},{p:3,t:'Unrelated page about potency.'}]}]};
  await new Promise(r=>w.repPrivImportText(JSON.stringify(priv),r));
  ok(w.repPrivIds().indexOf('priv_test_mm')!==-1&&w.repMMBookIds().indexOf('priv_test_mm')!==-1,'private book imported and listed after public books');
  ok(w.repMMAvail('nat-m').indexOf('priv_test_mm')!==-1&&w.repMMAvail('ign').indexOf('priv_test_mm')!==-1&&w.repMMAvail('apis').indexOf('priv_test_mm')===-1,'private availability by remedy-name detection (nat-m, ign yes; apis no)');
  const pe=w.repMMEntry('priv_test_mm','nat-m'); ok(pe&&pe.sections.length===1&&pe.sections[0].h==='p. 1','private entry = pages mentioning the remedy (p. 1)');
  const pm=w.repMMMatches('nat-m',w.repDiffThemeRegex('grief, consol')); ok(pm.some(m=>m.book==='priv_test_mm'&&/grief|consol/i.test(m.text)),'theme sentences found in private book with reference '+w.repMMRef(pm.find(m=>m.book==='priv_test_mm')||{book:'?'}));
  ok(/🔒/.test(w.repMMBadge('priv_test_mm'))&&/Tester/.test(w.repMMShort('priv_test_mm')),'private badge 🔒 + short name from author');
  w.repDiffOpenForRubric(); await sleep(50); w.repDiffToggleRem('nat-m'); await sleep(30); for(let i=0;i<60&&!(w.repDiffLast&&w.repDiffLast.res);i++)await sleep(50); w.repDiffSetTab('mm'); await sleep(80);
  ok(Array.from(d.querySelectorAll('.rep-mm-av .rep-mm-badge')).some(b=>/🔒/.test(b.textContent)),'📖 tab card shows private badge for nat-m');
  w.repPrivPanelToggle(); await sleep(30); ok(d.querySelector('.rep-mm-priv')&&d.querySelectorAll('.rep-mm-privrow').length===1,'private panel lists the imported book');
  w.repDiffClose(); w.repMMOpen('nat-m','grief',['nat-m']); await sleep(80); w.repMMSetBook('priv_test_mm'); await sleep(30);
  ok(/نجی|private/.test(d.querySelector('.rep-mm-src').textContent)&&d.querySelector('.rep-mm-section .rep-mm-h').textContent==='p. 1','viewer shows private book pages');
  w.repMMView.q='potency'; w.repMMWholeToggle(true); await sleep(30); ok(d.querySelector('.rep-mm-section .rep-mm-h').textContent==='p. 3','whole-book search finds page 3 (not a remedy page)');
  w.repMMClose(); w.repPrivDelete('priv_test_mm'); ok(w.repPrivIds().length===0&&w.repMMAvail('nat-m').indexOf('priv_test_mm')===-1,'private book removed');
  // ---- import routing: wrong button still works ----
  const privFile=JSON.stringify({books:[{id:'priv_route_test',title:'Route Test',author:'X',pages:[{p:1,t:'Ignatia amara sighing grief.'}]}]});
  w.toasts.length=0; const rn=w.repNotesImportText(privFile); await sleep(80);
  ok(rn===-1&&w.repPrivIds().indexOf('priv_route_test')!==-1&&w.toasts.some(t=>/🔒/.test(t)),'notes importer given a private-books file → routed to private import');
  w.repPrivDelete('priv_route_test');
  const notesFile=JSON.stringify({notes:{'kent|mind|r9999|ign':{abbr:'ign',text:'routed note',status:'draft'}}});
  w.toasts.length=0; await new Promise(r=>w.repPrivImportText(notesFile,r));
  ok(w.repNoteGet({book:'kent',ch:'mind',rid:'r9999'},'ign')&&w.repNoteGet({book:'kent',ch:'mind',rid:'r9999'},'ign').text==='routed note'&&w.toasts.some(t=>/✍/.test(t)),'private importer given a notes file → routed to notes import');
  w.toasts.length=0; ok(w.repNotesImportText('{"foo":1}')===0&&w.toasts.some(t=>/⚠/.test(t)),'unknown JSON → clear warning, nothing imported');
  // seed drafts merged on first load
  w.localStorage.removeItem('bc_rep_notes_seed_v'); await new Promise(r=>w.repNotesSeed(r)); ok(w.repNoteGet({book:'kent',ch:'mind',rid:'r2'},'nux-m')&&w.repNoteGet({book:'kent',ch:'mind',rid:'r2'},'nux-m').src==='llm-seed'&&w.repNoteGet(w.repDiffCtx||{book:'kent',ch:'mind',rid:'r2'},'nat-m').status==='approved','seed drafts merged without overwriting the approved nat-m note');
  // ---- v59: notes on the rubric page + shared notes file ----
  w.localStorage.removeItem('bc_rep_notes_seed_v'); await new Promise(r=>w.repNotesSeed(r));
  ok(w.repNotesCount().total>=15,'seed v2 merged: '+w.repNotesCount().total+' notes (ABSENT-MINDED, GRIEF, CONSOLATION)');
  w.repOpenRubricDetail(mind.r2449.t,'r2449'); for(let i=0;i<60&&!d.querySelector('.rep-notes-list');i++)await sleep(50); await sleep(50);
  ok(d.querySelectorAll('.rep-note-card').length===5,'GRIEF page shows 5 seed notes ('+d.querySelectorAll('.rep-note-card').length+')');
  ok(d.querySelectorAll('.rpd-chips .rep-remedy-tag.noted').length===5&&d.querySelector('.rep-note-sup'),'remedy chips carry ✎ marks for noted remedies');
  ok(/\[Rep:|\[Allen|\[Kent|\[Guernsey/.test(d.querySelector('.rep-note-text').textContent),'note text shows references');
  // approve one → card turns ✔ and chip mark becomes ✔
  w.repNoteSet({book:'kent',ch:'mind',rid:'r2449',full:mind.r2449.t},'staph',w.repNoteGet({book:'kent',ch:'mind',rid:'r2449'},'staph').text,'approved');
  w.repOpenRubricDetail(mind.r2449.t,'r2449'); await sleep(80);
  ok(d.querySelector('.rep-note-card.ok')&&d.querySelector('.rep-note-card').querySelector('.rep-remedy-tag').textContent==='staph'&&Array.from(d.querySelectorAll('.rep-note-sup')).some(e=>e.textContent==='✔'),'approved note listed first with ✔');
  // shared notes file merge (repo-committed notes)
  const sharedPath=ROOT+'/mm/notes_shared.json'; const hadShared=fs.existsSync(sharedPath);
  fs.writeFileSync(sharedPath,JSON.stringify({notes:{'kent|mind|r2449|aur':{abbr:'aur',text:'SHARED APPROVED NOTE',status:'approved',ts:Date.now()+1000,src:'doctor'},'kent|mind|r2449|staph':{abbr:'staph',text:'older shared',status:'draft',ts:1}}}));
  w._repNotesSharedDone=false; await new Promise(r=>w.repNotesShared(r));
  if(!hadShared) fs.unlinkSync(sharedPath);
  ok(w.repNoteGet({book:'kent',ch:'mind',rid:'r2449'},'aur').text==='SHARED APPROVED NOTE','shared approved note overrides local draft');
  ok(w.repNoteGet({book:'kent',ch:'mind',rid:'r2449'},'staph').status==='approved'&&w.repNoteGet({book:'kent',ch:'mind',rid:'r2449'},'staph').text!=='older shared','locally approved note is NOT overwritten by an older shared draft');
  // Ask AI
  d.getElementById('repAskMsgs').innerHTML='<div id="repAskTyping">⏳</div>'; w.repAskAnswer('بورک کی کتاب'); await sleep(20); ok(/📖/.test(d.getElementById('repAskMsgs').innerHTML),'Ask AI answers on materia medica');
  console.log(fails?'FAILURES: '+fails:'ALL TESTS PASSED'); process.exit(fails?1:0);
})().catch(e=>{console.error('CRASH',e);process.exit(2);});
