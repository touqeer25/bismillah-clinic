// Bismillah Clinic — js/repertory/rep-compare-mode.js — ☑ Compare mode
// (v78: 08-app-repertory.js کو بغیر کسی کوڈ تبدیلی کے حصوں میں بانٹا گیا؛ لوڈ ترتیب index.html میں وہی رکھیں)
// ==================== ☑ COMPARE MODE (HomeoSetu "Compare" بٹن کا کلون) ====================
// موڈ آن: ہر ربرک کارڈ / قطار / سرچ نتیجے پر چیک باکس — ٹک = فعال کلپ بورڈ میں شامل، دوبارہ ٹک = ہٹانا۔
// سائیڈ بار پینل: "N منتخب / کلیئر / اینالائز" + منتخب ربرکس کی چپس۔ کلپ بورڈ وہی 12 ہیں (الگ لسٹ نہیں)۔
function repCmpModeToggle(){ repCmpModeSet(!repCompareMode); }
function repCmpModeSet(on){
    repCompareMode=!!on;
    try{ localStorage.setItem('bc_rep_cmp_mode',repCompareMode?'1':'0'); }catch(e){}
    repCmpSyncUI();
    showToast(repCompareMode
        ? repLangText({ur:'☑ کمپیئر موڈ آن — کارڈز پر ٹک لگائیں، ربرک '+repClipLabel(repActiveClip)+' میں جمع ہوں گے',en:'☑ Compare Mode ON — tick rubric cards to collect them in '+repClipLabel(repActiveClip),roman:'☑ Compare Mode ON — cards par tick lagaein'})
        : repLangText({ur:'☐ کمپیئر موڈ آف',en:'☐ Compare Mode OFF',roman:'☐ Compare Mode OFF'}));
    repCmpRerender();
}
function repCmpSyncUI(){
    var b=document.getElementById('repCmpModeBtn');
    if(b){ b.classList.toggle('on',repCompareMode); b.title=repLangText({ur:'کمپیئر موڈ: کارڈز پر ٹک لگا کر ربرکس فعال کلپ بورڈ میں جمع کریں، پھر اینالائز',en:'Compare Mode: tick rubric cards to collect them into the active clipboard, then Analyze',roman:'Compare Mode: cards par tick, phir Analyze'}); }
    var tools=document.getElementById('repSideTools'); if(tools)tools.classList.toggle('cmp',repCompareMode);
    repCmpPanelRender();
}
function repIsSearchView(){ var rc=document.getElementById('repRubricContent'); return !!(rc&&repLastSearchView&&rc.querySelector('.rep-rubric-item')); }
function repCmpRerender(){
    if(repClipViewOpen||repWorkbenchOpen||repCompareOpen||repAnalysisOpen>=0) return;
    if(repCurrentDetail){ renderRubricDetail(); return; }
    if(repIsSearchView()){ displaySearchResults(repLastSearchView.results, repLastSearchView.info); return; }
    if(repCurrentChapter) renderFolderCards();
}
function repCmpChkHtml(book,ch,rid,full,rems,extra){
    if(!repCompareMode||!rid) return '';
    var on=repClipFind(repActiveClip,book,rid)!==-1;
    return '<button type="button" class="rpc-chk'+(on?' on':'')+(extra?' '+extra:'')+'" data-book="'+_repAttr(book)+'" data-ch="'+_repAttr(ch)+'" data-rid="'+_repAttr(rid)+'" data-full="'+_repAttr(full)+'" data-rems="'+(parseInt(rems,10)||0)+'" onclick="event.stopPropagation();repCmpChkClick(this)" title="'+repLangText({ur:'موازنے کے لیے منتخب کریں → '+repClipLabel(repActiveClip),en:'Select for comparison → '+repClipLabel(repActiveClip),roman:'Compare ke liye select karein → '+repClipLabel(repActiveClip)})+'">'+(on?'✓':'')+'</button>';
}
function repCmpChkClick(btn){
    var book=btn.getAttribute('data-book')||repCurrentBook, ch=btn.getAttribute('data-ch')||repCurrentChapter, rid=btn.getAttribute('data-rid')||'';
    var full=btn.getAttribute('data-full')||'', rems=parseInt(btn.getAttribute('data-rems')||'0',10)||0;
    if(!rid) return;
    var added=repClipToggle(repActiveClip,book,ch,rid,full,rems);
    repCmpSyncChecks(book,rid,added);
    showToast((added?'☑ ':'☐ ')+repLangText({ur:added?repClipLabel(repActiveClip)+' میں شامل':repClipLabel(repActiveClip)+' سے ہٹا دیا',en:added?'Added to '+repClipLabel(repActiveClip):'Removed from '+repClipLabel(repActiveClip),roman:added?repClipLabel(repActiveClip)+' mein shamil':repClipLabel(repActiveClip)+' se hata diya'}));
    repCmpPanelRender();
}
function repCmpSyncChecks(book,rid,on){
    var list=document.querySelectorAll('.rpc-chk');
    for(var i=0;i<list.length;i++){ var b=list[i]; if(b.getAttribute('data-book')===book&&b.getAttribute('data-rid')===String(rid)){ b.classList.toggle('on',!!on); b.textContent=on?'✓':''; } }
    var db=document.getElementById('repDetailCmpBtn'); if(db&&repCurrentDetail&&String(repCurrentDetail.rid)===String(rid)&&repCurrentBook===book){ db.outerHTML=repDetailCmpBtnHtml(); }
}
// سائیڈ بار کا کمپیئر پینل ("N منتخب / کلیئر / اینالائز" کے نیچے)
function repCmpPanelRender(){
    var p=document.getElementById('repCmpPanel'); if(!p)return;
    if(!repCompareMode){ p.style.display='none'; p.innerHTML=''; return; }
    var l=repClipboards[repActiveClip]||[];
    var h='<div class="rst-cmp-head">☑ '+repLangText({ur:'کمپیئر موڈ',en:'Compare Mode',roman:'Compare Mode'})+' → <b>'+escapeHtml(repClipLabel(repActiveClip))+'</b>'
        +'<button class="rst-x" onclick="repCmpModeSet(false)" title="'+repLangText({ur:'کمپیئر موڈ بند کریں',en:'Turn Compare Mode off',roman:'Compare Mode band karein'})+'">✕</button></div>';
    if(!l.length){
        h+='<div class="rst-cmp-hint">'+repLangText({ur:'کارڈز پر ☐ ٹک لگائیں — ربرک یہاں جمع ہوں گے',en:'Tick ☐ on rubric cards — they collect here',roman:'Cards par ☐ tick lagaein'})+'</div>';
    } else {
        h+='<div class="rst-chips">';
        l.forEach(function(it,i){
            h+='<span class="rst-chip'+(it.combined?' comb':'')+'" title="'+_repAttr((REP_BOOK_INFO[it.book]?REP_BOOK_INFO[it.book].abbr+': ':'')+(it.path||''))+'">'
                +'<span class="rst-chip-t" dir="ltr" onclick="repClipOpenIdx('+repActiveClip+','+i+')">'+(it.combined?'⊕ ':'')+escapeHtml(_repTruncPath(it.path||'—',26))+'</span>'
                +'<button class="rst-chip-x" onclick="repCmpChipRemove('+i+')" title="'+repLangText({ur:'ہٹائیں',en:'Remove',roman:'Hataein'})+'">✕</button></span>';
        });
        h+='</div>';
    }
    h+='<div class="rst-cmp-links">'
        +'<button class="rst-link" onclick="repCmpAllSearch()" title="'+repLangText({ur:'سرچ سکوپ = سب ریپرٹریز، پھر اوپر سرچ باکس میں لکھیں — نتائج پر بھی ☐ ملے گا',en:'Search scope = all repertories; results also get ☐',roman:'Scope = sab repertories'})+'">🌐 '+repLangText({ur:'سب کتابوں میں تلاش',en:'Search all books',roman:'Sab kitabon mein talash'})+'</button>'
        +'<button class="rst-link" onclick="repOpenCompare()" title="'+repLangText({ur:'کلپ بورڈز آمنے سامنے (کلاسک موازنہ ویو)',en:'Clipboards side by side (classic compare view)',roman:'Clipboards aamne saamne'})+'">⇄ '+repLangText({ur:'کلپ بورڈز کا موازنہ',en:'Compare clipboards',roman:'Clipboards ka moazna'})+'</button>'
        +'</div>';
    p.innerHTML=h; p.style.display='';
}
function repCmpChipRemove(i){
    var l=repClipboards[repActiveClip]||[]; var it=l[i]; if(!it)return;
    l.splice(i,1); repClipsSave(); repRenderDock();
    repCmpSyncChecks(it.book,it.rid,false);
    repCmpPanelRender();
    if(repClipViewOpen)renderClipView(); else if(repWorkbenchOpen)renderWorkbench();
}
function repCmpAllSearch(){
    var sel=document.getElementById('repScopeSelect'); if(sel)sel.value='all';
    setRepSearchScope('all');
    var inp=document.getElementById('repBrowserSearch'); if(inp){ inp.focus(); if(inp.value.trim().length>=2)searchRepertoryBrowser(); }
}
// سائیڈ بار "اینالائز" = HomeoSetu: تمام کلپ بورڈز → ورک بینچ گرڈ (ویٹ + ایلی منیشن)
function repSideAnalyze(){
    var total=0; for(var i=0;i<REP_N_CLIPS;i++)total+=(repClipboards[i]||[]).length;
    if(!total){ showToast(repLangText({ur:'کلپ بورڈز خالی ہیں — پہلے ربرکس منتخب کریں (☑ کمپیئر موڈ یا ⋮ مینو)',en:'Clipboards are empty — select rubrics first (☑ Compare Mode or ⋮ menu)',roman:'Clipboards khali hain — pehle rubrics select karein'})); return; }
    repOpenWorkbench('grid');
}

// 🔑 dock renderer — v45: 12 کلپ بورڈ چپس (+ ✕ واپس جب لسٹ کھلی ہو)؛ CLIPBOARDS ہیڈنگ ختم (صارف درخواست)؛
// پیجینشن گروپ (صفحات/ترتیب/صفحہ سائز) مکمل ہٹا دیا گیا — ڈیسک ٹاپ پر یہ ڈاک بائیں خالی پٹی میں عمودی ہے
// 🔑 v46: ڈاک اوپر والی ٹول بار/بریڈکمب بار پر نہ چڑھے — 12 چپس کی بلندی پر سینٹرنگ اوپر бар سے ٹکراتی تھی؛
// اب ڈاک کی اوپری حد سائیڈبار/کنٹینٹ کے ٹاپ سے ہم قالب (ڈائنامک — ٹول بار لپیٹنے پر بھی درست رہتا ہے)۔
function repSyncDockTop(){
    var a=document.getElementById('repDockArea'); if(!a)return;
    // 🔑 v49: موبائل (≤820px) پر افقی ڈاک نیچے ہی ہے — کوئی top قید نہیں؛
    // ڈیسک ٹاپ سے resize ہو کر موبائل آئے تو پرانا inline top صاف بھی کرو
    if(window.innerWidth<=820){ a.style.top=''; return; }
    // 🔑 v49 (صارف): ڈاک کے چپس چیپٹر لسٹ (.rep-sidebar) کے اوپری کنارے کے عین برابر شروع ہوں —
    // پہلے .rep-side-col (اینالائز بار سمیت پورا کالم) اور justify-content:center تھا جس سے
    // چپس لسٹ سے اوپر/نیچے تیرتے تھے؛ اب لسٹ ٹاپ = پینل ٹاپ، چپس نیچے کی جانب بڑھتے ہیں
    var col=document.querySelector('#page-repertoryBrowser .rep-sidebar');
    if(!col)return;
    var t=Math.round(col.getBoundingClientRect().top);
    if(t>120) a.style.top=t+'px';
}
window.addEventListener('resize',repSyncDockTop);
// 🔑 v47 (آڈٹ فکس): فونٹ لوڈ ہونے/دیر سے لے آؤٹ شفٹ ہونے پر سائیڈبار ٹاپ ~10px نیچے کھسک جاتا ہے —
// repSyncDockTop پرانا ویلیو یاد رکھتی تھی (ڈاک 10.4px ڈرفٹ)۔ load + fonts.ready + دیر سے دوبارہ ہم قالب کرو۔
if(document.fonts && document.fonts.ready && document.fonts.ready.then){ document.fonts.ready.then(function(){ repSyncDockTop(); }); }
// 🔑 v47: RTL/اردو فونٹ bunch میں دیر سے لوڈ ہوتے ہیں — loadingdone ہر batch کے بعد فائر ہوتا ہے (آڈٹ: RTL ڈرفٹ)
if(document.fonts && document.fonts.addEventListener){ try{ document.fonts.addEventListener('loadingdone', repSyncDockTop); }catch(e){} }
window.addEventListener('load',repSyncDockTop);
setTimeout(repSyncDockTop,600); setTimeout(repSyncDockTop,1500); setTimeout(repSyncDockTop,2500);
function repRenderDock(){
    var d=document.getElementById('repDockArea'); if(!d)return;
    var h='<div class="rep-dock">';
    for(var i=0;i<REP_N_CLIPS;i++){
        var n=(repClipboards[i]||[]).length;
        h+='<button class="rep-dock-clip'+((repClipViewOpen&&repActiveClip===i)?' active':'')+'" onclick="repToggleClipView('+i+')" title="'+repLangText({ur:'کلپ بورڈ '+(i+1),en:'Clipboard '+(i+1),roman:'Clipboard '+(i+1)})+'">'+(i+1)+(n?'<i class="rep-clip-n">'+n+'</i>':'')+'</button>';
    }
    // 🔑 صارف درخواست (v39): ڈاک سے ورک بینچ/اینالیسس گرڈ/کاپی/کلیئر بٹن ہٹا دیے —
    // یہ چار بٹن اب کلپ بورڈ لسٹ ویو کے ہیڈر میں ہیں۔ ڈاک 12 کلپ بورڈز دکھاتا ہے۔
    if(repClipViewOpen) h+='<button class="rep-dock-ico" onclick="repCloseClipView()" title="'+repLangText({ur:'واپس',en:'Back',roman:'Wapas'})+'">✕</button>';
    h+='</div>';
    d.innerHTML=h;
    repSyncDockTop();
    repUpdateSelCount();
}
// 🔑 v42: repGoPage/repToggleSort/repCyclePageSize/renderFolderDock/repDockNoFolder ہٹا دیے — پیجینشن ختم

// 🔑 clipboard contents view (main area)
function renderClipView(){
    var cd=document.getElementById('repRubricContent'); if(!cd)return;
    repUpdateNavButtons(); repRenderBreadcrumb();
    var l=repClipboards[repActiveClip]||[];
    var h='<div class="rep-clip-head"><div class="rep-content-title"><span>📋</span><span>'+repLangText({ur:'کلپ بورڈ',en:'CLIPBOARD',roman:'CLIPBOARD'})+'</span><b>'+(repActiveClip+1)+'</b><span class="cnt">('+l.length+')</span></div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap;">'
        +'<button class="rc-btn" onclick="repClipCopyAll()">📄 '+repLangText({ur:'کاپی',en:'Copy',roman:'Copy'})+'</button>'
        +'<button class="rc-btn danger'+(repDockTrashArm?' armed':'')+'" onclick="repClipTrash()">🗑 '+(repDockTrashArm?repLangText({ur:'یقینی بنائیں؟',en:'Sure?',roman:'Yaqeeni banain?'}):repLangText({ur:'خالی کریں',en:'Clear',roman:'Khali karein'}))+'</button>'
        +'<button class="rc-btn" onclick="repOpenWorkbench()">⚙ '+repLangText({ur:'ورک بینچ',en:'Workbench',roman:'Workbench'})+'</button>'
        +'<button class="rc-btn" onclick="repOpenAnalysis('+repActiveClip+')">📊 '+repLangText({ur:'تجزیہ گرڈ',en:'Analysis Grid',roman:'Tajzia Grid'})+'</button>'
        +'</div></div>';
    if(!l.length){
        h+='<div class="rep-empty-state"><div class="res-icon">📋</div><p class="res-title">'+repLangText({ur:'کلپ بورڈ '+(repActiveClip+1)+' خالی ہے',en:'Clipboard '+(repActiveClip+1)+' is empty',roman:'Clipboard '+(repActiveClip+1)+' khali hai'})+'</p><p class="res-sub">'+repLangText({ur:'کسی بھی ربرک کارڈ کے ⋮ مینو سے اسے شامل کریں',en:'Use the ⋮ menu on any rubric card to add it',roman:'Kisi bhi rubric card ke ⋮ menu se isay shamil karein'})+'</p></div>';
    } else {
        l.forEach(function(it,i){
            var bi=REP_BOOK_INFO[it.book]||{abbr:it.book,name:it.book};
            h+='<div class="rep-clip-row" onclick="repClipOpenItem('+i+')">'
                +'<span class="rep-book-badge" style="background:'+repBookColor(it.book)+'">'+escapeHtml(bi.abbr)+'</span>'
                +'<span class="rc-path" dir="ltr">'+escapeHtml(it.path||'—')+'</span>'
                +repCombBadge(it)+repWChip(it.w)
                +(it.rems?'<span class="rpc-badge rems">⚡ '+it.rems+'</span>':'')
                +'<button class="rc-btn" onclick="event.stopPropagation();repClipOpenItem('+i+')">↩ '+repLangText({ur:'کھولیں',en:'Open',roman:'Kholen'})+'</button>'
                +'<button class="rc-btn" onclick="event.stopPropagation();repWbMenuShow(event,this,'+repActiveClip+','+i+')" title="'+repLangText({ur:'مزید فنکشنز',en:'More options',roman:'Mazeed functions'})+'">⋮</button>'
                +'<button class="rc-btn danger" onclick="event.stopPropagation();repClipRemoveItem('+i+')">🗑</button>'
                +'</div>';
        });
    }
    cd.innerHTML=h;
    cd.scrollTop=0;
    repRenderDock();
}
function repClipRemoveItem(i){
    var l=repClipboards[repActiveClip]||[];
    if(i<0||i>=l.length)return;
    l.splice(i,1); repClipsSave(); renderClipView();
}
function repClipOpenItem(i){
    var it=(repClipboards[repActiveClip]||[])[i]; if(!it)return;
    repClipViewOpen=false;repWorkbenchOpen=false;repCompareOpen=false;repAnalysisOpen=-1;
    repClipGoto(it.book,it.ch,it.rid);
}

// 🔑 empty state (no chapter selected) — HomeoSetu-style dashed box
function repRenderEmptyState(){
    var cd=document.getElementById('repRubricContent'); if(!cd)return;
    cd.innerHTML='<div class="rep-empty-state"><div class="res-icon">📁</div>'
        +'<p class="res-title">'+repLangText({ur:'بائیں مینو سے کوئی باب منتخب کریں',en:'Select a chapter from the left menu',roman:'Bayen menu se koi chapter select karein'})+'</p>'
        +'<p class="res-sub">'+repLangText({ur:'ربرکس اور ادویات دیکھیں',en:'Browse rubrics and remedies',roman:'Rubrics aur remedies dekhein'})+'</p></div>';
    repRenderBreadcrumb(); repUpdateNavButtons(); repRenderDock();
}

// 🔑 kebab (⋮) popup menu — copy + detail + ADD/REMOVE in 12 clipboards
var _repKebabTarget=null;
function repKebabShow(ev,btn){
    ev.stopPropagation(); repKebabHide();
    _repKebabTarget={full:btn.getAttribute('data-full')||'',rid:btn.getAttribute('data-rid')||''};
    repKebabRenderMenu();
    var r=btn.getBoundingClientRect();
    var m=document.getElementById('repKebabMenu'); if(!m)return;
    m.style.display='block';
    m.style.top=(r.bottom+window.scrollY+4)+'px';
    m.style.left=Math.max(8,r.right+window.scrollX-230)+'px';
}
function repKebabRenderMenu(){
    var m=document.getElementById('repKebabMenu'); if(!m)return;
    var t=_repKebabTarget||{full:'',rid:''};
    var h='<button onclick="repKebabCopy()">📋 '+repLangText({ur:'پورا ربرک کاپی کریں',en:'Copy full rubric',roman:'Poora rubric copy karein'})+'</button>';
    h+='<button onclick="repKebabDetail()">📖 '+repLangText({ur:'معنی اور ادویات کھولیں',en:'Open meaning & remedies',roman:'Meani aur adwiyat kholen'})+'</button>';
    if(t.rid){
        h+='<div class="rep-kebab-sep">'+repLangText({ur:'کلپ بورڈ',en:'CLIPBOARDS',roman:'CLIPBOARDS'})+'</div>';
        for(var i=0;i<REP_N_CLIPS;i++){
            var inside=repClipFind(i,repCurrentBook,t.rid)!==-1;
            h+='<button class="'+(inside?'kb-in':'')+'" onclick="repKebabClipToggle('+i+')">'+(inside?'✅':'➕')+' '+repLangText({ur:'کلپ بورڈ',en:'Clipboard',roman:'Clipboard'})+' '+(i+1)+' — '+(inside?repLangText({ur:'ہٹائیں',en:'remove',roman:'hataein'}):repLangText({ur:'شامل کریں',en:'add',roman:'shamil karein'}))+'</button>';
        }
    }
    m.innerHTML=h;
}
function repKebabClipToggle(ci){
    var t=_repKebabTarget||{}; if(!t.rid)return;
    var added=repClipToggle(ci,repCurrentBook,repCurrentChapter,t.rid,t.full,0);
    var remsCount=0;
    var e=(t.rid&&repRidPathMap[t.rid])?repRidPathMap[t.rid]:null;
    if(e) remsCount=Object.keys(e.node.remedies||{}).length;
    if(added){
        // store the remedy count on the just-added item (first entry)
        var l=repClipboards[ci];
        for(var i=0;i<l.length;i++){ if(String(l[i].rid)===String(t.rid)&&l[i].book===repCurrentBook){ l[i].rems=remsCount; break; } }
        repClipsSave();
    }
    showToast((added?'➕ ':'🗑 ')+repLangText({ur:'کلپ بورڈ '+(ci+1),en:'Clipboard '+(ci+1),roman:'Clipboard '+(ci+1)}));
    if(repClipViewOpen) renderClipView();
    repKebabRenderMenu();
}
function repKebabHide(){ var m=document.getElementById('repKebabMenu'); if(m)m.style.display='none'; }
function repKebabCopy(){
    var t=(_repKebabTarget&&_repKebabTarget.full)||'';
    if(t&&navigator.clipboard){ navigator.clipboard.writeText(t).then(function(){ if(typeof showToast==='function')showToast('✅ '+t); }); }
    repKebabHide();
}
function repKebabDetail(){
    var t=_repKebabTarget||{};
    repOpenRubricDetail(t.full,t.rid);
    repKebabHide();
}
if(typeof document!=='undefined'){
    document.addEventListener('click',function(ev){
        var m=document.getElementById('repKebabMenu');
        if(m&&m.style.display==='block'&&!m.contains(ev.target)) repKebabHide();
        var wb=document.getElementById('repWbMenu');
        if(wb&&wb.style.display==='block'&&!wb.contains(ev.target)) repWbMenuHide();
    });
}

// 🔑 Urdu glossary (lazy load) for word-by-word meaning
var _repGlossary=null,_repGlossaryLoading=false,_repGlossaryFailed=false;
function ensureRepGlossary(cb){
    if(_repGlossary){ cb(); return; }
    if(_repGlossaryFailed){ cb(); return; }   // فیل ہو چکی — دوبارہ لوپ نہیں
    if(_repGlossaryLoading){ setTimeout(function(){ ensureRepGlossary(cb); },300); return; }
    _repGlossaryLoading=true;
    fetch('glossary_en_ur.json?v=4').then(function(r){ return r.json(); }).then(function(d){
        _repGlossary=d; _repGlossaryLoading=false; cb();
    }).catch(function(e){ console.error('glossary load fail',e); _repGlossaryLoading=false; _repGlossaryFailed=true; cb(); });
}
function repUrduMeaning(text){
    if(!_repGlossary||!text)return'';
    var W=_repGlossary.words||{},A=_repGlossary.aliases||{};
    var toks=String(text).toLowerCase().match(/[a-z]+/g)||[];
    var out=[],seen={};
    for(var i=0;i<toks.length&&out.length<14;i++){
        var t=toks[i]; if(seen[t])continue; seen[t]=1;
        var e=W[t]||(A[t]?W[A[t]]:null);
        if(e&&e.ur) out.push(e.ur);
    }
    return out.join(' ، ');
}

// 🔑 Remedy Details slide-in panel (HomeoSetu style)
function repOpenRubricPanel(fullPath,rid){
    var entry=(rid&&repRidPathMap[rid])?repRidPathMap[rid]:null;
    var node=entry?entry.node:null;
    var fp=fullPath||(entry?entry.fullPath:'');
    ensureRepGlossary(function(){ repRenderRemedyPanel(fp,rid,node); });
}
function repRenderRemedyPanel(fullPath,rid,node){
    var body=document.getElementById('repRemedyPanelBody'); if(!body)return;
    var title=document.getElementById('repPanelTitle');
    if(title) title.textContent=repLangText({ur:'💊 ربرک کی ادویات',en:'💊 Remedy Details',roman:'💊 Rubric ki adwiyat'});
    var rems=(node&&node.remedies)||{};
    var abbrs=Object.keys(rems);
    abbrs.sort(function(a,b){ return (rems[b]||1)-(rems[a]||1)||a.localeCompare(b); });
    var g3=[],g2=[],g1=[];
    abbrs.forEach(function(a){ var g=rems[a]||1; if(g>=3)g3.push(a); else if(g===2)g2.push(a); else g1.push(a); });
    var meaning=repUrduMeaning(fullPath||'');
    var h='';
    h+='<div class="rrp-name" dir="ltr">'+escapeHtml(fullPath||'—')+'</div>';
    h+='<div class="rrp-path">'+(rid?repLangText({ur:'ربرک #: ',en:'Rubric #: ',roman:'Rubric #: '})+escapeHtml(rid):'')+'</div>';
    if(meaning) h+='<div class="rrp-meaning"><div class="rrp-meaning-label">📖 '+repLangText({ur:'اردو معنی (لفظ بہ لفظ)',en:'URDU MEANING (word by word)',roman:'Urdu matlab (lafz ba lafz)'})+'</div>'+escapeHtml(meaning)+'</div>';
    if(!abbrs.length){
        h+='<div class="rrp-norems">'+repLangText({ur:'اس ربرک میں کوئی ادویات محفوظ نہیں',en:'No remedies recorded under this rubric',roman:'Is rubric mein koi adwiyat mehfooz nahi'})+'</div>';
    } else {
        h+='<div style="font-size:12px;color:#5d6d7e;margin-bottom:4px;">'+abbrs.length.toLocaleString()+' '+repLangText({ur:'ادویات — کلک سے پریسکرپشن میں کاپی ہوگی',en:'remedies — click to copy',roman:'adwiyat — click se copy'})+'</div>';
        [[g3,'3',repLangText({ur:'درجہ 3 — مضبوط',en:'Grade 3 — strong',roman:'Darja 3 — mazboot'})],
         [g2,'2',repLangText({ur:'درجہ 2 — درمیانہ',en:'Grade 2 — medium',roman:'Darja 2 — darmiyana'})],
         [g1,'1',repLangText({ur:'درجہ 1 — معمولی',en:'Grade 1 — light',roman:'Darja 1 — mamooli'})]].forEach(function(gr){
            if(!gr[0].length)return;
            h+='<div class="rrp-grade-head"><span class="rep-gr-dot d'+gr[1]+'"></span>'+gr[2]+' ('+gr[0].length+')</div><div class="rrp-chips">';
            gr[0].forEach(function(a){ h+='<span class="rep-remedy-tag g'+gr[1]+'" title="'+_repAttr(repRemedyTitle(a))+'" onclick="copyRemedyToPrescription(\''+escapeHtml(a)+'\')">'+escapeHtml(a)+'</span>'; });
            h+='</div>';
        });
    }
    body.innerHTML=h;
    repShowRemedyPanel();
}
function repShowRemedyPanel(){
    var p=document.getElementById('repRemedyPanel'),o=document.getElementById('repPanelOverlay');
    if(p)p.classList.add('open');
    if(o)o.classList.add('show');
}
function repCloseRemedyPanel(){
    var p=document.getElementById('repRemedyPanel'),o=document.getElementById('repPanelOverlay');
    if(p)p.classList.remove('open');
    if(o)o.classList.remove('show');
}

