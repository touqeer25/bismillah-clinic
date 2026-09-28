//#SPLIT ==================================================================
//#SPLIT 🔬 تفریق / نکاسی — ڈھانچہ: کھولنا/بند، ہیڈر، کنٹرولز، ٹیبز، چلانا
//#SPLIT اصل: js/08b-rep-differentiation.js — سطریں 197 تا 364
//#SPLIT ⚠ کوڈ میں ایک حرف بھی تبدیل نہیں — صرف کاٹ کر منتقل کیا گیا ہے۔
//#SPLIT ==================================================================
// ---------- کھولنا / بند کرنا ----------
function repDiffOpenForRubric(){
    var d=(typeof repCurrentDetail!=='undefined'&&repCurrentDetail)||{};
    var node=(typeof repDetailNode==='function')?repDetailNode():null;
    var rems=(node&&node.remedies)||{};
    if(!d.rid){ showToast(repLangText({ur:'یہ ربرک تفریق کے لیے دستیاب نہیں',en:'This rubric is not available for differentiation',roman:'Ye rubric tafreeq ke liye dastiyab nahi'})); return; }
    repDiffCtx={book:repCurrentBook,ch:repCurrentChapter,rid:String(d.rid),full:d.full||'',rems:rems};
    repDiffSel=[]; repDiffTheme=repDiffThemeWordsFor(repDiffCtx); repDiffLast=null;
    repDiffTab='rubric';
    repDiffShow(); repDiffRun();
}
function repDiffOpenWithRemedies(arr,ctx){
    var list=(arr||[]).map(function(a){ return String(a||'').trim().toLowerCase(); }).filter(Boolean).slice(0,REP_DIFF_MAX_REMS);
    if(ctx){ repDiffCtx=ctx; } else if(!repDiffCtx||repDiffCtx.book!==repCurrentBook){ repDiffCtx=null; }
    repDiffSel=list; repDiffLast=null; repDiffTheme=repDiffCtx?repDiffThemeWordsFor(repDiffCtx):'';
    repDiffTab=list.length===1?'excl':'excl';
    repDiffShow(); if(list.length) repDiffRun(); else repDiffRenderBody();
}
// 🔑 v85 (صارف): تفریق / نکاسی اب **پاپ اپ نہیں، ریپرٹری کے صفحے کا ٹیب** ہے۔
//   اگر صفحے میں #repDiffView موجود ہو تو سب کچھ اُسی کے اندر بنتا ہے (ماڈل بالکل نہیں بنتا)۔
//   اگر وہ خانہ نہ ملے (پرانا index.html) تو پرانا ماڈل والا راستہ جوں کا توں چلتا رہے گا۔
function repDiffHost(){ return document.getElementById('repDiffView'); }
function repDiffTabMode(){ return !!repDiffHost(); }
// ریپرٹری ↔ تفریق — صفحے کے اوپر والی دو بٹن والی پٹی
function repPageTab(which){
    var host=repDiffHost(); if(!host) return;
    var page=document.getElementById('page-repertoryBrowser'); if(!page) return;
    var diff=(which==='diff');
    // 🔑 v86: صرف ربرکس کا خانہ بدلتا ہے — ابواب کی سائیڈ بار، بریڈکرمب اپنی جگہ
    // 🔑 v87 (صارف): کلپ بورڈ کی پٹی (#repDockArea) اب دونوں ٹیبوں پر موجود رہتی ہے — چھپائی نہیں جاتی
    var cont=document.getElementById('repRubricContent');
    var tb=document.getElementById('repPageTabRep'), td=document.getElementById('repPageTabDiff');
    if(cont) cont.style.display=diff?'none':'';
    host.style.display=diff?'':'none';
    if(tb) tb.classList.toggle('on',!diff);
    if(td) td.classList.toggle('on',diff);
    if(diff){
        if(!document.getElementById('repDiffHead')) host.innerHTML='<div id="repDiffHead"></div><div id="repDiffBody" class="rep-diff-body"></div>';
        repDiffRenderHead(); if(!repDiffLast) repDiffRenderBody();
    }
}
// 🔑 v87 (صارف): تفریق کھلی ہو اور صارف بائیں سے کوئی باب، یا بریڈکرمب / ← → ↑ دبائے،
//   تو ریپرٹری خود بخود سامنے آ جائے (ورنہ نیا باب پیچھے کھلتا رہتا تھا اور نظر نہ آتا تھا)۔
function repDiffBackOnNav(){
    var ids=['repChapterList','repBreadcrumb','repBtnBack','repBtnFwd','repBtnUp'];
    ids.forEach(function(id){
        var el=document.getElementById(id); if(!el||el._repDiffNav) return; el._repDiffNav=1;
        el.addEventListener('click',function(){ if(repDiffIsOpen()) repPageTab('rep'); },true);
    });
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',repDiffBackOnNav); else repDiffBackOnNav();
function repDiffShow(){
    var host=repDiffHost();
    if(host){
        if(!document.getElementById('repDiffHead')) host.innerHTML='<div id="repDiffHead"></div><div id="repDiffBody" class="rep-diff-body"></div>';
        repPageTab('diff'); repDiffRenderHead(); return;
    }
    var m=document.getElementById('repDiffModal');
    if(!m){
        m=document.createElement('div'); m.id='repDiffModal'; m.className='rep-diff-modal';
        m.innerHTML='<div class="rep-diff-back" onclick="repDiffClose()"></div><div class="rep-diff-win" role="dialog" aria-modal="true"><div id="repDiffHead"></div><div id="repDiffBody" class="rep-diff-body"></div></div>';
        document.body.appendChild(m);
        document.addEventListener('keydown',function(ev){ if(ev.key==='Escape'){ var mm=document.getElementById('repDiffModal'); if(mm&&mm.style.display!=='none'&&mm.style.display!=='') repDiffClose(); } });
    }
    m.style.display='block'; document.body.classList.add('rep-diff-open');
    repDiffRenderHead();
}
function repDiffClose(){
    if(repDiffHost()){ repPageTab('rep'); return; }
    var m=document.getElementById('repDiffModal'); if(m)m.style.display='none'; document.body.classList.remove('rep-diff-open');
}
function repDiffIsOpen(){
    var host=repDiffHost(); if(host) return host.style.display!=='none';
    var m=document.getElementById('repDiffModal'); return !!(m&&m.style.display==='block');
}

// ---------- ہیڈر: سیاق + ریمیڈی پکر + کنٹرولز + ٹیبز ----------
function repDiffScopeBook(){ return (repDiffCtx&&repDiffCtx.book)||repCurrentBook; }
function repDiffScopeCh(){ return (repDiffCtx&&repDiffCtx.ch)||repCurrentChapter; }
// 🔑 v91 (صارف): صفحے کا اپنا گہرا ہیڈر ختم (نام ٹیب میں موجود ہے)؛ ربرک کی سطر پر ▸ سے
//   دواؤں کا ذخیرہ کھلتا/بند ہوتا ہے (بالکل ریپرٹری کی ربرک لائن کی طرح)، اور منتخب دوائیں
//   اسی سطر میں ربرک کے بعد دکھائی دیتی ہیں۔
var repDiffPoolOpen=false;
function repDiffPoolToggle(){ repDiffPoolOpen=!repDiffPoolOpen; repDiffRenderHead(); }
function repDiffRenderHead(){
    var el=document.getElementById('repDiffHead'); if(!el)return;
    var L=repLangText, bi=REP_BOOK_INFO[repDiffScopeBook()]||{abbr:'',name:''};
    var h='';
    // 🔑 v91: گہرا عنوانی بار صرف پرانے ماڈل والے راستے میں — ٹیب موڈ میں نام اوپر ٹیب پر ہے
    if(!repDiffTabMode()){
        h+='<div class="rep-diff-title"><b>🔬 '+L({ur:'تفریق / ایکسٹریکشن',en:'DIFFERENTIATION / EXTRACTION',roman:'TAFREEQ / EXTRACTION'})+'</b>'
            +'<span class="rep-diff-sub">'+L({ur:'ریمیڈیز چنیں → وہ ربرکس جہاں یہ آپس میں مختلف ہیں',en:'pick remedies → rubrics where they differ',roman:'remedies chunein → rubrics jahan ye mukhtalif hain'})+'</span>'
            +'<button class="rc-btn" onclick="repDiffClose()">✕ '+L({ur:'بند',en:'Close',roman:'Band'})+'</button></div>';
    }
    // ---- ایک ہی سطر: ربرک ▸ + منتخب دوائیں + اضافہ ----
    var poolN=(repDiffCtx&&repDiffCtx.rems)?Object.keys(repDiffCtx.rems).length:0;
    h+='<div class="rep-diff-ctx rep-diff-ctxline">';
    if(repDiffCtx){
        if(poolN) h+='<button class="rtv-a rep-diff-pooltog'+(repDiffPoolOpen?' on':'')+'" onclick="repDiffPoolToggle()" title="'+_repAttr(L({ur:'اس ربرک کی ادویات کھولیں / بند کریں',en:'Show / hide this rubric\u2019s remedies',roman:'Rubric ki remedies'}))+'">'+(repDiffPoolOpen?'▾':'▸')+'</button> ';
        h+=repBookBadgeHtml(repDiffCtx.book)+' <span>'+escapeHtml(getChapterDisplayName(repDiffCtx.book,repDiffCtx.ch)||repDiffCtx.ch)+'</span> › <b dir="ltr">'+escapeHtml(repDiffCtx.full||'')+'</b>'
            +' <span class="cnt">('+poolN+' '+L({ur:'ادویات',en:'remedies',roman:'remedies'})+')</span>'
            +' <button class="rst-link" onclick="repDiffClearCtx()" title="'+_repAttr(L({ur:'ربرک کا سیاق ہٹائیں (صرف ریمیڈیز کا موازنہ)',en:'Drop rubric context (remedy-only comparison)',roman:'Rubric context hataein'}))+'">✕</button>';
    } else {
        h+='<b>🔬 '+L({ur:'ریمیڈیز کا موازنہ',en:'Compare remedies',roman:'Muwazna'})+'</b> <span class="cnt">'+L({ur:'کوئی ربرک منتخب نہیں',en:'no rubric context',roman:'koi rubric nahi'})+'</span>';
    }
    // منتخب دوائیں — اسی سطر میں
    h+='<span class="rep-diff-selinline">';
    if(!repDiffSel.length) h+='<i class="rep-diff-hint">'+(poolN?L({ur:'▸ دبا کر دوائیں چنیں (زیادہ سے زیادہ 5)',en:'press ▸ to pick remedies (max 5)',roman:'▸ dabaen'}):L({ur:'مخفف لکھیں (زیادہ سے زیادہ 5)',en:'type an abbreviation (max 5)',roman:'abbr likhein'}))+'</i>';
    repDiffSel.forEach(function(a){ h+='<span class="rep-diff-chip on" title="'+_repAttr(repRemedyTitle(a))+'"><b dir="ltr">'+escapeHtml(a)+'</b><button onclick="repDiffToggleRem(\''+_repJs(a)+'\')">✕</button></span>'; });
    // 🔑 v92 (صارف): ＋ بٹن ختم — فہرست میں سے کسی دوا پر کلک (change) یا ٹائپ کر کے Enter، دونوں سے شامل
    h+='<span class="rep-diff-add"><input type="text" id="repDiffInput" list="repDiffRemList" placeholder="'+L({ur:'دوا تلاش کریں…',en:'search remedy…',roman:'dawa talash karein…'})+'" onkeydown="if(event.key===\'Enter\'){event.preventDefault();repDiffAddTyped();}" onchange="repDiffAddTyped()" dir="ltr"></span>';
    h+='<datalist id="repDiffRemList">'+repDiffDatalistHtml()+'</datalist>';
    h+='</span></div>';
    // ---- ذخیرہ: صرف کھلا ہو تو ----
    if(repDiffPoolOpen&&repDiffCtx&&repDiffCtx.rems){
        var rems=repDiffCtx.rems, abbrs=Object.keys(rems);   // 🔑 v75: ٹری جیسی ترتیب (فائل کی اصل ترتیب) اور ٹری جیسا انداز
        h+='<div class="rep-diff-pick"><div class="rep-diff-chips rtv-rems-box" dir="ltr">';
        abbrs.forEach(function(a){ var g=repDiffGrade(rems[a]); var on=repDiffSel.indexOf(a)!==-1; h+='<i class="rtv-r g'+g+(on?' sel':'')+'" title="'+_repAttr(repRemedyTitle(a))+'" onclick="repDiffToggleRem(\''+_repJs(a)+'\')">'+escapeHtml(g===3?a.toUpperCase():a)+'</i> '; });
        h+='</div></div>';
    }
    // کنٹرولز
    var o=repDiffOpts;
    h+='<div class="rep-diff-ctl">'
        +'<label title="'+L({ur:'موازنہ = دوائیں آپس میں مختلف جگہیں؛ نکالنا = ایک دوا کی اپنی مکمل فہرست',en:'compare = where the remedies differ; extract = the full page list of one remedy',roman:'muwazna / nikalna'})+'">🧭 '+L({ur:'طریقہ',en:'Mode',roman:'Tareeqa'})+' <select onchange="repDiffSetOpt(\'mode\',this.value)">'
        +'<option value="compare"'+(o.mode!=='extract'?' selected':'')+'>'+L({ur:'دوائوں کا موازنہ',en:'Compare remedies',roman:'Muwazna'})+'</option>'
        +'<option value="extract"'+(o.mode==='extract'?' selected':'')+'>'+L({ur:'ایک دوا کی فہرست نکالنا',en:'Extract one remedy',roman:'Ek dawa ki fehrist'})+'</option></select></label>'
        +'<label>📚 '+L({ur:'دائرہ',en:'Scope',roman:'Scope'})+' <select onchange="repDiffSetOpt(\'scope\',this.value)">'
        +'<option value="chapter"'+(o.scope==='chapter'?' selected':'')+'>'+L({ur:'کھلا باب',en:'Open chapter',roman:'Khula baab'})+' ('+escapeHtml(getChapterDisplayName(repDiffScopeBook(),repDiffScopeCh())||repDiffScopeCh()||'')+')</option>'
        +'<option value="book"'+(o.scope==='book'?' selected':'')+'>'+L({ur:'پوری کتاب',en:'Whole book',roman:'Poori kitab'})+' ('+escapeHtml(bi.abbr)+')</option>'
        +'<option value="all"'+(o.scope==='all'?' selected':'')+'>'+L({ur:'تمام کتابیں',en:'All books',roman:'Tamam kitabein'})+' ('+Object.keys(REP_BOOK_INFO).length+')</option></select></label>'
        +'<label title="'+L({ur:'اس سے بڑے ربرکس اسکین ہی نہیں ہوتے (یہی اصل رفتار کا فرق ہے)',en:'larger rubrics are never scanned — this is where the speed comes from',roman:'barhe rubrics scan hi nahi hote'})+'">📏 '+L({ur:'ربرک کا سائز ≤',en:'Rubric size ≤',roman:'Rubric size ≤'})+' <select onchange="repDiffSetOpt(\'maxN\',parseInt(this.value,10))">'
        +[10,20,30,60,100,200,0].map(function(n){ return '<option value="'+n+'"'+(o.maxN===n?' selected':'')+'>'+(n?n:L({ur:'سب',en:'all',roman:'sab'}))+'</option>'; }).join('')+'</select></label>'
        +'<label>⭐ '+L({ur:'کم از کم گریڈ',en:'Min grade',roman:'Min grade'})+' <select onchange="repDiffSetOpt(\'minG\',parseInt(this.value,10))">'
        +[1,2,3].map(function(g){ return '<option value="'+g+'"'+(o.minG===g?' selected':'')+'>'+g+'</option>'; }).join('')+'</select></label>'
        +'<label>↕ '+L({ur:'ترتیب',en:'Sort',roman:'Sort'})+' <select onchange="repDiffSetOpt(\'sort\',this.value)">'
        +'<option value="score"'+(o.sort==='score'?' selected':'')+'>'+L({ur:'اسکور (گریڈ × مخصوصیت)',en:'score (grade × specificity)',roman:'score'})+'</option>'
        +'<option value="grade"'+(o.sort==='grade'?' selected':'')+'>'+L({ur:'پہلے گریڈ، پھر چھوٹا ربرک',en:'grade first, then smallest rubric',roman:'grade pehle, phir chhota rubric'})+'</option></select></label>'
        +'<button class="rc-btn primary" onclick="repDiffRun()">▶ '+L({ur:'چلائیں',en:'Run',roman:'Chalayein'})+'</button>'
        +'<button class="rc-btn" onclick="repDiffCopy()" title="'+L({ur:'نتیجہ متن کی شکل میں کاپی',en:'Copy result as text',roman:'Nateeja copy'})+'">📋</button>'
        +(repDiffLast&&repDiffLast.extract?'<button class="rc-btn primary" onclick="repDiffTakeAll()" title="'+L({ur:'تمام قطاریں فعال کلپ بورڈ میں ڈال دیں',en:'Put every row into the active clipboard',roman:'Sab qatarein clipboard mein'})+'">📥 '+L({ur:'سب کلپ بورڈ میں',en:'Take all',roman:'Sab clipboard mein'})+'</button>':'')
        +'</div>';
    // ٹیبز
    var res=repDiffLast&&repDiffLast.res, k=repDiffSel.length, o=o||repDiffOpts;
    function tab(id,lab,n){ return '<button class="'+(repDiffTab===id?'on':'')+'" onclick="repDiffSetTab(\''+id+'\')">'+lab+(n!=null?' <span class="cnt">'+n+'</span>':'')+'</button>'; }
    // 🔑 v78: ٹیبز دو گروپس میں — «تجزیہ» (ربرک تقابل پہلے، پھر خصوصی/گریڈ/جزوی/مشترک) اور «ثبوت» (میٹیریا میڈیکا، کتابوں کی گواہی)
    h+='<div class="rep-diff-tabs rep-diff-tabs-v78">';
    h+='<span class="rep-diff-tabgrp">'+L({ur:'تجزیہ',en:'Analysis',roman:'Tajziya'})+'</span>';
    if(repDiffCtx) h+=tab('rubric','🧮 '+L({ur:'ربرک کی ریمیڈیز کا تقابل',en:'Rubric remedies compared',roman:'Rubric ki remedies ka taqabul'}),null);
    if(k===1&&o.mode==='extract') h+=tab('excl','🧲 '+L({ur:'نکالی ہوئی مکمل فہرست',en:'Extracted list',roman:'Extraction'}),repDiffLast&&repDiffLast.extract?repDiffLast.extract.rows.length:null);
    else if(k===1) h+=tab('excl','🔑 '+L({ur:'کی نوٹس (اس ریمیڈی کے ربرکس)',en:'Keynotes (rubrics of this remedy)',roman:'Keynotes'}),res?res.any:(repDiffLast&&repDiffLast.extract?repDiffLast.extract.k1:null));
    else { h+=tab('excl','🎯 '+L({ur:'خصوصی',en:'Exclusive',roman:'Khususi'}),res?Object.keys(res.excl).reduce(function(s,a){return s+res.perRem[a].excl;},0):null);
           h+=tab('grade','📶 '+L({ur:'گریڈ کا فرق',en:'Grade difference',roman:'Grade ka farq'}),res?res.grade.length:null);
           h+=tab('partial','◐ '+L({ur:'جزوی',en:'Partial',roman:'Juzvi'}),res?res.partial.length:null);
           h+=tab('common','≡ '+L({ur:'مشترک',en:'Common',roman:'Mushtarak'}),res?res.commonEqual:null); }
    h+='<span class="rep-diff-tabsep"></span><span class="rep-diff-tabgrp">'+L({ur:'ثبوت',en:'Evidence',roman:'Saboot'})+'</span>';
    if(typeof repDiffMMTabHtml==='function') h+=tab('mm','📖 '+L({ur:'میٹیریا میڈیکا',en:'Materia medica',roman:'Materia medica'}),null);
    h+=tab('books','📚 '+L({ur:'کتابوں کی گواہی',en:'Books witness',roman:'Kitabon ki gawahi'}),null);
    h+='</div>';
    el.innerHTML=h;
}
// 🔑 v92 (صارف کا سوال): یہ فہرست **پوری ریپرٹری** کی ہے (remedy_names.json — 788 مخففات)،
//   صرف اس ربرک کی نہیں۔ یہ جان بوجھ کر ہے: بغیر ربرک کے بھی دو دواؤں کا موازنہ ہو سکے۔
//   مگر اب اسی ربرک کی دوائیں **سب سے اوپر**، ⭐ اور گریڈ کے ساتھ — تاکہ فرق صاف رہے۔
function repDiffDatalistHtml(){
    var names=(typeof _repRemedyNames!=='undefined'&&_repRemedyNames)||null, out='', seen={};
    if(repDiffCtx&&repDiffCtx.rems){
        Object.keys(repDiffCtx.rems).forEach(function(a){
            var g=repDiffGrade(repDiffCtx.rems[a]); seen[a]=1;
            out+='<option value="'+_repAttr(a)+'">⭐ '+escapeHtml((names&&names[a])||a)+' — '+repLangText({ur:'اسی ربرک میں، گریڈ ',en:'in this rubric, grade ',roman:'is rubric mein, grade '})+g+'</option>';
        });
    }
    if(names) Object.keys(names).forEach(function(a){ if(!seen[a]) out+='<option value="'+_repAttr(a)+'">'+escapeHtml(names[a])+'</option>'; });
    return out;
}
function repDiffClearCtx(){ repDiffCtx=null; repDiffTheme=''; if(repDiffTab==='rubric')repDiffTab='excl'; repDiffLast=null; repDiffRenderHead(); if(repDiffSel.length)repDiffRun(); else repDiffRenderBody(); }
function repDiffToggleRem(a){
    a=String(a||'').toLowerCase(); if(!a)return;
    var i=repDiffSel.indexOf(a);
    if(i!==-1) repDiffSel.splice(i,1);
    else { if(repDiffSel.length>=REP_DIFF_MAX_REMS){ showToast(repLangText({ur:'زیادہ سے زیادہ '+REP_DIFF_MAX_REMS+' ریمیڈیز',en:'Maximum '+REP_DIFF_MAX_REMS+' remedies',roman:'Max '+REP_DIFF_MAX_REMS+' remedies'})); return; } repDiffSel.push(a); }
    if(repDiffTab==='rubric'&&repDiffSel.length) repDiffTab='excl';
    repDiffLast=null; repDiffRenderHead();
    if(repDiffSel.length) repDiffRun(); else repDiffRenderBody();
}
function repDiffAddTyped(){
    var inp=document.getElementById('repDiffInput'); if(!inp)return; var v=String(inp.value||'').trim().toLowerCase(); if(!v)return;
    inp.value=''; repDiffToggleRem(v);
}
function repDiffSetOpt(k,v){ var old=repDiffOpts[k]; repDiffOpts[k]=v; repDiffOptsSave(); repDiffLast=null; repDiffRenderHead();
    if(k==='mode'){ if(repDiffSel.length||repDiffTab==='rubric'||repDiffTab==='books') repDiffRun(); return; }
    if(repDiffSel.length||repDiffTab==='rubric'||repDiffTab==='books') repDiffRun(); }
function repDiffSetTab(t){
    repDiffTab=t; repDiffRenderHead();
    var loaded=repDiffLast?Object.keys(repDiffLast.all||{}).length:0;
    if(t==='mm'){ repDiffRenderBody(); return; }                 // میٹیریا میڈیکا: اپنا ڈیٹا خود لوڈ کرتا ہے
    if(t==='books'){ if(!repDiffLast) repDiffRun(); else repDiffRenderBody(); return; }   // 🔑 v84: خودکار ۵۶ MB نہیں — صارف «لوڈ کریں» دبائے گا
    if(!repDiffLast&&t==='rubric'){ repDiffRun(); return; }
    repDiffRenderBody();
}

// ---------- چلانا ----------
function repDiffRun(){
    var body=document.getElementById('repDiffBody'); if(!body)return;
    var L=repLangText;
    if(!repDiffSel.length&&repDiffTab!=='rubric'&&repDiffTab!=='books'&&repDiffTab!=='mm'){ repDiffRenderBody(); return; }
    if(_repDiffBusy) return; _repDiffBusy=true;
    body.innerHTML='<div class="rep-tool-loading">⏳ '+L({ur:'ڈیٹا لوڈ اور حساب ہو رہا ہے…',en:'Loading data and computing…',roman:'Data load aur hisaab…'})+'</div>';
    var scope=repDiffOpts.scope, book=repDiffScopeBook(), ch=repDiffScopeCh();
    var needAll=(scope==='all');   // 🔑 v84: «کتابوں کی گواہی» اب اپنی کتابیں خود (چن کر، ایک ایک کر کے) منگواتی ہے — یہاں ۵۶ MB والا راستہ بند
    var t0=Date.now();
    var opt=Object.assign({},repDiffOpts);
    if(repDiffSel.length){ var m={}; repDiffSel.forEach(function(a){ m[a]=1; }); opt._rems=m; }
    opt._stop=true;                              // ✅ v68.7: لمبی اسکین پر جلدی رکنا
    var go=function(list,all){
        var scopeData=all[book]||null;
        var sizes=repDiffRemedySizes(book,scopeData);
        var single=(repDiffOpts.mode==='extract'&&repDiffSel.length===1);
        var extr=single?repDiffExtract(repDiffSel[0],list,repDiffOpts,sizes):null;
        var res=(single||!repDiffSel.length)?null:repDiffCompute(repDiffSel,list,repDiffOpts);
        repDiffLast={res:res,extract:extr,list:list,all:all,sizes:sizes,scopeBook:book,scope:scope,ms:Date.now()-t0,n:list.length,skipped:list.skipped||0,scanned:list.scanned||0};
        _repDiffBusy=false;
        repDiffRenderHead(); repDiffRenderBody();
    };
    if(needAll){
        repEnsureAllBooks(function(all){
            all=all||{};
            if(scope==='all'){ repDiffRubricList('all',book,ch,function(list,a2){ go(list,all); },opt); }
            else { repDiffRubricList(scope,book,ch,function(list,a2){ Object.keys(a2||{}).forEach(function(bk){ if(!all[bk])all[bk]=a2[bk]; }); go(list,all); },opt); }
        });
    } else {
        repDiffRubricList(scope,book,ch,function(list,all){ go(list,all||{}); },opt);
    }
}
