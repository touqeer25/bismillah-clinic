// Bismillah Clinic — js/repertory/rep-folders.js — فولڈر نیویگیشن (back/forward/up + breadcrumb)
// (v78: 08-app-repertory.js کو بغیر کسی کوڈ تبدیلی کے حصوں میں بانٹا گیا؛ لوڈ ترتیب index.html میں وہی رکھیں)
// ============================================================
// 🔑 HOMEOSETU-STYLE FOLDER NAVIGATION (layout clone)
// Chapter = root folder; each rubric with children = folder card;
// leaf rubric = document card. back/forward/up + breadcrumb.
// ============================================================
var repViewMode='tree';        // v72: صرف کتابی ٹری
var repFolderPath=[];          // labels from chapter root to current folder
var repHistBack=[];            // [{ch,path,page}]
var repHistFwd=[];
var repFolderFilter='';
var repSortAsc=true;
var repRidPathMap={};          // rid -> {path:[labels], fullPath, node}
var repPendingPath=null;       // path to open after chapter tree loads

function _repJoinSeg(parentFull,label){
    var joiner=(repCurrentBook==='synthesis91')?' - ':', ';
    return parentFull?parentFull+joiner+label:label;
}
function repFullPathOf(pathLabels){
    var full='';
    for(var i=0;i<pathLabels.length;i++) full=_repJoinSeg(full,pathLabels[i]);
    return full;
}
function buildRidPathMap(tree){
    repRidPathMap={};
    (function walk(node,pathLabels,fullPath){
        (node.order||Object.keys(node.children)).forEach(function(k){
            var c=node.children[k]; if(!c)return;
            var labels=pathLabels.concat([k]);
            var fp=_repJoinSeg(fullPath,k);
            if(c.hasRubric&&c.rid){ repRidPathMap[c.rid]={path:labels,fullPath:fp,node:c}; }
            var hc=(c.order&&c.order.length>0)||Object.keys(c.children||{}).length>0;
            if(hc) walk(c,labels,fp);
        });
    })(tree,[],'');
}
function repResolveNode(path){
    var n=repCurrentTree;
    for(var i=0;i<path.length;i++){ if(!n)return null; n=n.children[path[i]]; }
    return n||null;
}
var repCurrentDetail=null;     // 🔑 rubric detail page state: {full,rid,labels} | null
var repPendingDetail=null;     // 🔑 {rid} waiting for chapter tree to load
function repCurrentState(){ return {ch:repCurrentChapter,path:repFolderPath.slice(),page:repTreePage,clip:(repClipViewOpen?repActiveClip:-1),detail:repCurrentDetail?{full:repCurrentDetail.full,rid:repCurrentDetail.rid,labels:(repCurrentDetail.labels||[]).slice()}:null}; }
function repApplyState(st){
    if(!st)return;
    repClipViewOpen=false;repWorkbenchOpen=false;repCompareOpen=false;repAnalysisOpen=-1; repCurrentDetail=null; repPendingDetail=null;
    if(st.clip>=0){ repActiveClip=st.clip; repClipViewOpen=true; renderClipView(); return; }
    if(st.detail&&st.detail.rid){
        if(!st.ch||st.ch!==repCurrentChapter){
            repPendingDetail={rid:st.detail.rid};
            repPendingPath=st.path||[]; repTreePage=st.page||0;
            selectChapter(st.ch);
        } else {
            repFolderPath=(st.path||[]).slice();
            repTreePage=st.page||0; repFolderFilter='';
            repCurrentDetail=st.detail;
            renderRubricDetail();
        }
        return;
    }
    if(!st.ch||st.ch!==repCurrentChapter){
        repPendingPath=st.path||[]; repTreePage=st.page||0;
        selectChapter(st.ch);
    } else {
        repFolderPath=(st.path||[]).slice();
        repTreePage=st.page||0; repFolderFilter='';
        renderFolderView();
    }
}
function repGo(path,keepFwd){
    if(!keepFwd){ repHistBack.push(repCurrentState()); repHistFwd=[]; }
    repFolderPath=path.slice(); repTreePage=0; repFolderFilter='';
    repCurrentDetail=null; repClipViewOpen=false;repWorkbenchOpen=false;repCompareOpen=false;repAnalysisOpen=-1; repPendingDetail=null;
    renderFolderView();
}
function repBack(){
    if(!repHistBack.length)return;
    repHistFwd.push(repCurrentState());
    repApplyState(repHistBack.pop());
}
function repFwd(){
    if(!repHistFwd.length)return;
    repHistBack.push(repCurrentState());
    repApplyState(repHistFwd.pop());
}
function repUp(){
    if(repCurrentDetail||repClipViewOpen||repWorkbenchOpen||repCompareOpen||repAnalysisOpen>=0){ repGo(repFolderPath); return; }   // detail/clipboard/tools -> back to folder
    if(repFolderPath.length) repGo(repFolderPath.slice(0,-1));
}
function repOpenChapter(chKey){
    if(chKey===repCurrentChapter)return;
    repHistBack.push(repCurrentState()); repHistFwd=[];
    repCurrentDetail=null; repClipViewOpen=false;repWorkbenchOpen=false;repCompareOpen=false;repAnalysisOpen=-1; repPendingDetail=null;
    selectChapter(chKey);
}
// 🔑 v48 (صارف): ڈیٹیل ویو کا راستہ repCurrentDetail.labels میں ہوتا ہے (ون کلک فلو کے بعد
// repFolderPath پرانا رہ جاتا ہے) — اوورلیز بند ہوں تو ڈیٹیل کی پوری زنجیر استعمال کرو
function repActivePathLabels(){
    var overlay=repClipViewOpen||repWorkbenchOpen||repCompareOpen||(repAnalysisOpen!==undefined&&repAnalysisOpen!==-1);
    if(!overlay&&repCurrentDetail&&repCurrentDetail.labels&&repCurrentDetail.labels.length) return repCurrentDetail.labels.slice();
    return null;
}
function repBcGo(i){
    if(i<0){ return; }
    var dp=repActivePathLabels();
    var path=dp?dp:repFolderPath;
    // ڈیٹیل ویو سے زنجیر کے کسی نام پر کلک = اسی سطح کا فولڈر ویو (repGo ڈیٹیل بند کر دیتا ہے)
    repGo(path.slice(0,i+1));
}
function repUpdateNavButtons(){
    var b=document.getElementById('repBtnBack'),f=document.getElementById('repBtnFwd'),u=document.getElementById('repBtnUp');
    if(b)b.disabled=!repHistBack.length;
    if(f)f.disabled=!repHistFwd.length;
    if(u)u.disabled=!repFolderPath.length;
}
function repRenderBreadcrumb(){
    var bc=document.getElementById('repBreadcrumb'); if(!bc)return;
    var bookInfo=REP_BOOK_INFO[repCurrentBook]||{abbr:'?',name:repCurrentBook};
    var dp=repActivePathLabels();
    var path=dp?dp:repFolderPath.slice();
    var h='<span class="rep-bc-seg rep-bc-book" onclick="repOpenBookRoot()">📖 '+escapeHtml(bookInfo.name)+'</span>';
    if(repCurrentChapter){
        h+='<span class="rep-bc-sep">›</span><span class="rep-bc-seg'+(path.length?'':' active')+'" onclick="repGo([])">📁 '+escapeHtml(repCurrentChName)+'</span>';
        for(var i=0;i<path.length;i++){
            h+='<span class="rep-bc-sep">›</span><span class="rep-bc-seg'+(i===path.length-1?' active':'')+'" onclick="repBcGo('+i+')">'+escapeHtml(path[i])+'</span>';
        }
    } else {
        h+='<span class="rep-bc-sep">›</span><span class="rep-bc-dim">'+repLangText({ur:'باب منتخب کریں',en:'Select a chapter',roman:'Chapter select karein'})+'</span>';
    }
    bc.innerHTML=h;
}
function repOpenBookRoot(){
    repHistBack.push(repCurrentState()); repHistFwd=[];
    repCurrentChapter=''; repFolderPath=[]; repFolderFilter='';
    renderChapterList();
    repRenderEmptyState();
}

// 🔑 renders the whole folder view: header (name + count + < expander) + cards + dock
// مین ربرک فولڈر کے ہیڈر میں بھی < آئکن (ٹیکسٹ کے بعد) — کلک پر مطلب/مریض کا ورژن/
// صحیح استعمال/کراس ریفرنس ایکسپینڈ ہو کر دکھتا ہے، دوبارہ کلک پر چھپ جاتا ہے۔
function renderFolderView(){
    var cd=document.getElementById('repRubricContent'); if(!cd)return;
    repUpdateNavButtons(); repRenderBreadcrumb();
    var node=repResolveNode(repFolderPath);
    if(!node){ repFolderPath=[]; node=repCurrentTree; }
    if(repFolderPath.length&&!_repGlossary&&!_repGlossaryFailed){ ensureRepGlossary(function(){ renderFolderView(); }); return; }
    var nm=repFolderPath.length?repFolderPath[repFolderPath.length-1]:repCurrentChName;
    var h='';
    h+='<div class="rep-content-head">'
      +'<div class="rep-content-title"><span class="rep-content-folder">📁</span>'
      +'<b>'+escapeHtml(String(nm).toUpperCase())+'</b>'
      +'<span>('+String(node.order.length).toLocaleString()+')</span>'
      +(repFolderPath.length?'<button class="rpd-chev" id="repDetailChev" onclick="repToggleDetailInfo()" title="'+repLangText({ur:'مکمل تفصیل دیکھیں/چھپائیں',en:'Show/hide full details',roman:'Mukammal tafseel dekhein/chhupaein'})+'">&#9656;</button>':'')
      +'</div>'
      +'<input type="text" class="rep-folder-filter" id="repFolderFilterInput" value="'+escapeHtml(repFolderFilter)+'" oninput="repOnFolderFilter(this.value)" placeholder="'+escapeHtml(repLangText({ur:'اس فولڈر میں فلٹر کریں...',en:'Filter in current folder...',roman:'Is folder mein filter karein...'}))+'">'
      +'</div>';
    // 🔑 مین ربرک کی مکمل تفصیل (ایکسپینڈ ایبل — صرف اصل ربرک فولڈر میں، باب کے روٹ پر نہیں)
    if(repFolderPath.length){
        var fFull=repFullPathOf(repFolderPath);
        var fRid=(node.hasRubric&&node.rid)?String(node.rid):'';
        var fAbbrs=Object.keys(node.remedies||{});
        var fG3=fAbbrs.filter(function(a){ return (node.remedies[a]||1)>=3; });
        var fSeeT=repExtractSeeTargets(fFull);
        h+=repDetailInfoHtml({full:fFull,rid:fRid,kidsCount:node.order.length,abbrs:fAbbrs,g3:fG3,
            pureXref:(!fAbbrs.length&&fSeeT.length>0&&!node.order.length),
            seeT:fSeeT,parentLabels:repFolderPath.slice(0,-1),
            showRems:true,remsObj:(node.remedies||{})});
    }
    h+='<div id="repCardsArea"></div>';
    cd.innerHTML=h;
    if(repFolderPath.length&&fFull) repRenderXrefAppBody(fFull,fRid);
    renderFolderCards();
    cd.scrollTop=0;
}
function repOnFolderFilter(v){
    repFolderFilter=v; repTreePage=0;
    renderFolderCards();
}
function repSetView(m){ repViewMode='tree'; renderFolderCards(); }   // v72: کارڈ/لسٹ ختم — صرف ٹری


