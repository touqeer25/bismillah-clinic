// بیرونی ریپرٹری خول کے ٹیب، میزبان اور نیویگیشن کی آزمائش
const assert=require('assert');
const fs=require('fs');
const path=require('path');
const {JSDOM}=require('jsdom');

const root=path.resolve(__dirname,'..');
const html=`<!doctype html><html lang="ur" dir="rtl"><body>
<div id="page-repertoryBrowser"><div class="content">
  <div class="rep-toolbar">
    <select id="repBookSelect" class="rep-book-select"><option value="kent">Kent</option><option value="kent_de">Kent German</option></select>
    <button class="rep-cmp-btn rep-lib-btn">📚</button>
    <select id="repScopeSelect"><option value="chapter">باب</option><option value="book">کتاب</option><option value="all">سب</option></select>
    <select id="repTypeSelect"><option value="rubric">ربرک</option></select>
    <div class="rep-search-wrap"><input id="repBrowserSearch"></div>
    <button id="repCmpModeBtn" class="rep-cmp-btn">☑ <span>کمپیئر</span></button>
    <button id="repUrModeBtn" class="rep-cmp-btn">📖 <span>اردو</span></button>
  </div>
  <div class="rep-layout"><div class="rep-side-col">
    <div id="repSideTools"><div class="rst-row"><span id="repSelCount">0</span><button>Clear</button></div><div id="repCmpPanel"></div></div>
    <aside id="repChapterList">باب</aside>
  </div><div class="rep-main">
    <div id="repNavbar" class="rep-navbar"><button id="repBtnBack" class="rep-navbtn">←</button><button id="repBtnFwd" class="rep-navbtn">→</button><button id="repBtnUp" class="rep-navbtn">↑</button><div id="repBreadcrumb"></div><div class="rep-gradation"><button class="rep-grad-item">1</button><button class="rep-grad-item">2</button><button class="rep-grad-item">3</button></div><div class="rep-viewtoggle"><button class="rep-viewbtn">▦</button><button class="rep-viewbtn">☰</button></div></div>
    <div id="repPageTabs"><button id="repPageTabRep"></button><button id="repPageTabDiff"></button><button id="repPageTabSearch"></button><span id="repSearchTabCount"></span></div>
    <div id="repDiffView" style="display:none"></div><div id="repSearchView" style="display:none"></div><div id="repRubricContent">اصل ریپرٹری مواد</div><div id="repDockArea"></div>
  </div></div>
</div></div>
</body></html>`;
const dom=new JSDOM(html,{url:'https://clinic.test/',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document;

w.REP_BOOK_INFO={kent:{name:'Kent English',abbr:'Kent'},kent_de:{name:'Kent German',abbr:'Kent DE'}};
w.REP_N_CLIPS=12;w.repClipNames=Array(12).fill('');w.repClipboards=Array.from({length:12},()=>[]);
w.repCurrentBook='kent';w.repCurrentChapter='mind';w.repChapterNames=[{key:'mind',name:'MIND',rubrics:527}];
w.repTreeCache={};w._repFullData=null;w.repCurrentChKey='mind';w.repCurrentChName='MIND';w.repCurrentFlatTree=[];w.repCurrentTree={};
w.repTreePage=0;w.repTreePageSize=50;w.repRidToFlatIndex={};w.repPendingNavRid=null;
w.repFolderPath=[];w.repHistBack=[];w.repHistFwd=[];w.repFolderFilter='';w.repSortAsc=true;w.repRidPathMap={};
w.repPendingPath=null;w.repCurrentDetail=null;w.repPendingDetail=null;
w.repClipViewOpen=false;w.repWorkbenchOpen=false;w.repCompareOpen=false;w.repAnalysisOpen=-1;w.repCompareSel=Array(8).fill(false);w.repActiveClip=0;
w.repLastSearchView=null;w._repSearchBeforeContext=null;w._repSearchCache='';w._repSearchResults=null;w._repSearchMode='';w.repSearchMode='rubric';w.repSearchScope='chapter';w.repSearchAllBooks=false;
w.repTreeCollapsed={};w.repTreeViews={};w.repGradeMin=0;w.repWbTab='clips';w._repWbArm=-1;w.repAskOpen=false;w.repActivePageTab='rep';
w.repDiffCtx=null;w.repDiffSel=[];w.repDiffTab='excl';w.repDiffLast=null;w.repDiffTheme='';w.repDiffPoolOpen=false;w.repDiffOpts={scope:'book',mode:'compare'};
w.repLangText=o=>o.ur||o.en||'';w.showToast=()=>{};w.repSyncDockTop=()=>{};
w.repRenderBreadcrumb=()=>{};w.repUpdateNavButtons=()=>{};w.repRenderDock=()=>{};w.repCmpSyncUI=()=>{};w.repTreeSyncBtns=()=>{};w.repGradeSyncBtns=()=>{};
w.renderChapterList=function(){d.getElementById('repChapterList').textContent='باب '+w.repCurrentBook;};
w.initRepertoryBrowser=function(){w.repChapterNames=[{key:'mind',name:'MIND',rubrics:527}];w.renderChapterList();};
w.switchRepertoryBook=function(){w.repCurrentBook=d.getElementById('repBookSelect').value;w.initRepertoryBrowser();};
w.repPageTab=function(which){
  w.repActivePageTab=which==='diff'?'diff':which==='search'?'search':'rep';
  d.getElementById('repDiffView').style.display=w.repActivePageTab==='diff'?'':'none';
  d.getElementById('repSearchView').style.display=w.repActivePageTab==='search'?'':'none';
  d.getElementById('repRubricContent').style.display=w.repActivePageTab==='rep'?'':'none';
};
w.repOpenChapter=function(ch){w.repCurrentChapter=ch;d.getElementById('repRubricContent').textContent='باب '+ch;};
w.navigateToRubric=function(book,ch,rid){w.repCurrentBook=book;w.repCurrentChapter=ch;d.getElementById('repRubricContent').textContent='ربرک '+rid;};
w.repToggleClipView=function(i){w.repActiveClip=i;w.repClipViewOpen=true;d.getElementById('repRubricContent').textContent='کلپ بورڈ '+(i+1);};
w.repCloseClipView=function(){w.repClipViewOpen=false;};
w.renderClipView=function(){d.getElementById('repRubricContent').textContent='کلپ بورڈ '+(w.repActiveClip+1);};
w.repOpenCompare=function(){w.repCompareOpen=true;d.getElementById('repRubricContent').textContent='موازنہ';};
w.repCloseToolView=function(){};
w.repDiffShow=function(){w.repPageTab('diff');};w.repDiffRun=function(){w._repDiffBusy=false;};w.repDiffRenderBody=()=>{};
w.repDiffOpenForRubric=function(){w.repDiffShow();};w.repDiffOpenWithRemedies=function(){};
w.repEnsureAllBooks=function(cb){cb({kent:{},kent_de:{}});};
w.repOpenWorkbench=function(){};w.repOpenAnalysis=function(){};w.repCompareToggle=function(){};
w.searchRepertoryBrowser=function(){
  const q=d.getElementById('repBrowserSearch').value.trim();
  if(q.length<2){w.repPageTab('rep');return;}
  w.repPageTab('search');w.displaySearchResults([{rid:'1'}],'نتیجہ');
};
w.displaySearchResults=function(results,info){w.repLastSearchView={results:results,info:info};d.getElementById('repSearchView').textContent=info;};
w.repSearchTabCount=function(){};w.applyLanguage=function(){};

w.eval(fs.readFileSync(path.join(root,'js/repertory/rep-tabs.js'),'utf8'));
d.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));

const tab=id=>d.querySelector('[data-tab-id="'+id+'"]');
assert(tab('rep:kent'),'ابتدائی ریپرٹری ٹیب موجود ہے');
assert(d.getElementById('repWorkspaceTabs'),'بیرونی ٹیب پٹی لگ گئی');
assert(d.querySelector('#repShellHostRoot #repRubricContent').textContent==='اصل ریپرٹری مواد','اصل میزبان مواد جوں کا توں منتقل ہوا');
const toolbar=d.querySelector('.rep-toolbar');
assert(!d.querySelector('.rep-navbar'),'اضافی بریڈکرمب قطار ختم ہوئی');
const stripNav=d.querySelector('.rep-shell-strip-nav');
assert(stripNav&&stripNav.contains(d.getElementById('repBtnBack'))&&stripNav.contains(d.getElementById('repBtnFwd'))&&stripNav.contains(d.getElementById('repBtnUp')),'نیویگیشن کے تیر نچلی پٹی میں ہیں');
assert(!toolbar.contains(d.getElementById('repBreadcrumb'))&&d.getElementById('repShellHiddenBreadcrumb').contains(d.getElementById('repBreadcrumb')),'کتاب اور باب کا breadcrumb اوپری ٹول بار میں نہیں');
assert(toolbar.contains(d.querySelector('.rep-gradation'))&&toolbar.contains(d.querySelector('.rep-viewtoggle')),'گریڈ اور منظر کے بٹن اوپر کی ٹول بار میں برقرار ہیں');
assert(toolbar.contains(d.getElementById('repShellDiffBtn'))&&toolbar.contains(d.getElementById('repShellCompareBtn')),'تفریق اور موازنہ کے بٹن ٹول بار میں ہیں');
const before=(a,b)=>!!(a.compareDocumentPosition(b)&w.Node.DOCUMENT_POSITION_FOLLOWING);
assert(before(d.getElementById('repBrowserSearch'),d.getElementById('repShellDiffBtn'))&&before(d.getElementById('repShellDiffBtn'),d.getElementById('repShellCompareBtn')),'تلاش کے بعد تفریق، پھر موازنہ آتا ہے');
assert(d.getElementById('repShellCompareTools').contains(d.getElementById('repSideTools')),'سائیڈ ٹولز الگ موازنہ صفحے کے لیے محفوظ ہوئے');
assert(!d.querySelector('.rep-side-col #repSideTools'),'موازنہ سیکشن بابوں کی فہرست کے اوپر نہیں رہا');
assert(d.querySelector('.rep-side-col').firstElementChild.id==='repShellSideToolsRow','بابوں کی فہرست بائیں سائیڈ بار کے اپنے عنوان سے شروع ہوتی ہے');
w.RepWorkspaceTabs.toggleSidebar();
assert(d.querySelector('.rep-side-col').classList.contains('rep-shell-collapsed')&&stripNav.contains(d.getElementById('repShellHideSideBtn')),'سائیڈ بار چھپنے پر چھوٹا بٹن نچلی پٹی میں رہتا ہے');
w.RepWorkspaceTabs.toggleSidebar();
assert(!d.querySelector('.rep-side-col').classList.contains('rep-shell-collapsed'),'سائیڈ بار دوبارہ کھلتی ہے');
const shellCSS=fs.readFileSync(path.join(root,'css/repertory-tabs.css'),'utf8');
assert(/\.rep-toolbar\s*\{[^}]*direction:ltr!important/s.test(shellCSS),'ٹول بار زبان سے قطع نظر بائیں سے دائیں ترتیب میں ہے');
assert(/\.rep-layout\{flex-direction:row;padding-left:60px\}/.test(shellCSS),'ڈیسک ٹاپ پر بابوں کی سائیڈ بار بائیں طرف رکھی گئی');
d.getElementById('page-repertoryBrowser').getBoundingClientRect=()=>({width:1500,height:800});
d.querySelector('.rep-side-col').getBoundingClientRect=()=>({top:218});
w.repSyncDockTop();
assert.strictEqual(d.getElementById('repDockArea').style.top,'218px','کلپ بورڈ پٹی ورک اسپیس کے اوپری کنارے سے منسلک ہوئی');

w.RepWorkspaceTabs.openRepertory('kent_de');
assert.strictEqual(w.repCurrentBook,'kent_de','کتاب کھولنے سے نیا ریپرٹری سیاق بنا');
assert(tab('rep:kent_de'),'نئی کتاب کا الگ بند ہونے والا ٹیب بنا');
assert.strictEqual(d.querySelectorAll('#repRubricContent').length,1,'ایک وقت میں ایک ریپرٹری میزبان ہی دستاویز میں ہے');

tab('rep:kent').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
assert.strictEqual(w.repCurrentBook,'kent','پرانا ریپرٹری ٹیب اپنی حالت واپس لاتا ہے');
assert.strictEqual(d.getElementById('repRubricContent').textContent,'اصل ریپرٹری مواد','اصل ریپرٹری رینڈرنگ محفوظ رہی');

w.repToggleClipView(0);
assert(tab('clip:0'),'کلپ بورڈ کا الگ ٹیب بنا');
assert.strictEqual(d.getElementById('repRubricContent').textContent,'کلپ بورڈ 1','کلپ بورڈ اصل میزبان میں کھلا');
assert.strictEqual(w.repActiveClip,0,'متعلقہ کلپ بورڈ منتخب ہوا');
w.RepWorkspaceTabs.closeTab('clip:0');
assert.strictEqual(w.repCurrentBook,'kent','کلپ بورڈ بند ہونے پر ریپرٹری واپس فعال ہوئی');

const input=d.getElementById('repBrowserSearch');input.value='fear';w.searchRepertoryBrowser();
assert(tab('search'),'تلاش کا الگ ٹیب بنا');
assert.strictEqual(d.getElementById('repSearchView').textContent,'نتیجہ','تلاش کا نتیجہ الگ میزبان میں آیا');
w.navigateToRubric('kent','mind','1',false);
assert.strictEqual(w.repCurrentBook,'kent','تلاش کے نتیجے سے اصل کتاب کھلی');
tab('search').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));
assert.strictEqual(d.getElementById('repSearchView').textContent,'نتیجہ','تلاش کا محفوظ ٹیب دوبارہ فعال ہوا');

w.repOpenCompare();assert(tab('compare'),'موازنہ الگ ٹیب میں کھلا');
assert.strictEqual(d.getElementById('repShellCompareTools').style.display,'','موازنہ صفحے پر منتقل شدہ کلپ بورڈ اوزار دکھتے ہیں');
w.RepWorkspaceTabs.closeTab('compare');
assert.strictEqual(d.getElementById('repShellCompareTools').style.display,'none','موازنہ ٹیب بند ہونے پر سیکشن چھپ گیا');
assert.strictEqual(w.repCurrentBook,'kent','موازنہ بند ہونے پر کتابی حالت محفوظ رہی');

w.RepWorkspaceTabs.openDiff();assert(tab('diff'),'تفریق الگ ٹیب میں کھلی');
w.RepWorkspaceTabs.activate('rep:kent');
assert.strictEqual(d.getElementById('repRubricContent').textContent,'ربرک 1','تفریق سے واپسی پر موجودہ ریپرٹری میزبان بحال ہوا');

assert.strictEqual(d.querySelectorAll('#repShellHostRoot #repRubricContent').length,1,'میزبان شناخت منفرد رہی');
console.log('تمام بیرونی ٹیب آزمائشیں کامیاب');
dom.window.close();
