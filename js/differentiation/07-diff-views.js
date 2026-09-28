// Bismillah Clinic — js/differentiation/07-diff-views.js
// 🔬 تفریق / نکاسی — نتیجے کے نظارے — چاروں ٹوکریاں + کلپ بورڈ
// (v83 میں js/08b-rep-differentiation.js کو آٹھ حصوں میں بانٹا گیا؛ ترتیب LOAD_ORDER.txt میں)

// ---------- باڈی ----------
function repDiffInCaseSet(){ var s={}; for(var ci=0;ci<REP_N_CLIPS;ci++)(repClipboards[ci]||[]).forEach(function(it){ s[it.book+'|'+String(it.rid)]=ci+1; }); return s; }
function repDiffDots(vec,R){ var h=''; for(var i=0;i<vec.length;i++){ var g=vec[i]; h+='<span class="rep-diff-dot'+(g?' d'+g:' d0')+'" title="'+_repAttr(R[i]+' = '+(g||0))+'">'+(g||'·')+'</span>'; } return h; }
// 🔑 v92 (صارف): گریڈ کے گولوں کے **عین اوپر** دواؤں کے نام — چوڑائی گولوں کے برابر، اس لیے ٹھیک اوپر بیٹھتے ہیں
function repDiffVecHead(R){
    if(!R||R.length<2) return '';
    var h='<div class="rep-diff-vechead"><span class="sp"></span><span class="rep-diff-vec">';
    R.forEach(function(a){ h+='<span class="vh" title="'+_repAttr(repRemedyTitle(a))+'"><i dir="ltr">'+escapeHtml(a)+'</i></span>'; });
    return h+'</span><span class="sc"></span></div>';
}
function repDiffRowHtml(row,R,inCase,showBook){
    var x=row.x, key=x.book+'|'+x.rid, inC=inCase[key];
    var chName=getChapterDisplayName(x.book,x.ch)||x.ch;
    var h='<div class="rep-diff-row">'
        +'<button class="rpc-chk sr'+(repClipFind(repActiveClip,x.book,x.rid)!==-1?' on':'')+'" title="'+repLangText({ur:'فعال کلپ بورڈ میں شامل/خارج',en:'Add to / remove from active clipboard',roman:'Active clipboard mein shamil/kharij'})+'" onclick="repDiffClipToggle(this,\''+_repJs(x.book)+'\',\''+_repJs(x.ch)+'\',\''+_repJs(x.rid)+'\',\''+_repJs(x.t)+'\','+row.N+')">'+(repClipFind(repActiveClip,x.book,x.rid)!==-1?'✓':'')+'</button>'
        +(showBook?repBookBadgeHtml(x.book)+' ':'')
        +'<span class="rep-diff-ch">'+escapeHtml(chName)+' ›</span> '
        +'<span class="rep-diff-t" dir="ltr" onclick="repDiffGo(\''+_repJs(x.book)+'\',\''+_repJs(x.ch)+'\',\''+_repJs(x.rid)+'\')">'+escapeHtml(x.t)+'</span>'
        +(typeof repRubricUrHtml==='function'?repRubricUrHtml(x.t,'rep-diff-ur'):'')   // 🔑 v101: اردو جملہ (دائیں سے بائیں)
        +'<span class="rep-diff-n" title="'+repLangText({ur:'ربرک کی کل ریمیڈیز',en:'remedies in rubric',roman:'rubric ki kul remedies'})+'">'+row.N+'</span>'
        +'<span class="rep-diff-vec">'+repDiffDots(row.vec,R)+'</span>'
        +'<span class="rep-diff-score" title="'+repLangText({ur:'اسکور',en:'score',roman:'score'})+'">'+repDiffFmt(row.score)+'</span>'
        +(inC?'<span class="rep-diff-incase" title="'+repLangText({ur:'کیس میں موجود — کلپ بورڈ '+inC,en:'Already in case — clipboard '+inC,roman:'Case mein mojood — clipboard '+inC})+'">📋'+inC+'</span>':'')
        +'</div>';
    return h;
}
// 🔑 v91 (صارف): خلاصہ اب اکارڈین — بند حالت میں صرف اہم ترین اعداد ایک سطر میں
var repDiffSumOpen=false;
function repDiffSumToggle(){ repDiffSumOpen=!repDiffSumOpen; repDiffRenderBody(); }
function repDiffRenderBody(){
    var body=document.getElementById('repDiffBody'); if(!body)return;
    var L=repLangText, last=repDiffLast, R=repDiffSel.slice();
    if(repDiffTab==='mm'&&typeof repDiffMMTabHtml==='function'){ body.innerHTML=repDiffMMTabHtml(last); body.scrollTop=0; return; }
    if(last&&last.extract&&repDiffTab==='excl'){ repDiffRenderExtr(last); return; }
    if(!R.length&&repDiffTab!=='rubric'&&repDiffTab!=='books'){
        body.innerHTML='<div class="rep-tool-loading">'+L({ur:'اوپر 1 تا 5 ریمیڈیز چنیں — ایک ریمیڈی = اس کے کی نوٹس ربرکس؛ 2 تا 5 = آپس کا فرق',en:'Pick 1–5 remedies above — one remedy = its keynote rubrics; 2–5 = their differences',roman:'Ooper 1–5 remedies chunein'})+'</div>';
        return;
    }
    if(!last){ body.innerHTML='<div class="rep-tool-loading">⏳</div>'; return; }
    var res=last.res, inCase=repDiffInCaseSet(), showBook=(last.scope==='all'), h='';
    // خلاصہ پٹی — 🔑 v91: اکارڈین
    if(res){
        var _sn=(last.skipped?last.skipped.toLocaleString()+' '+L({ur:'بڑے چھوڑے',en:'large skipped',roman:'barhe chhore'}):'');
        h+='<button class="rep-diff-sumtog'+(repDiffSumOpen?' on':'')+'" onclick="repDiffSumToggle()">'
            +'<span class="ar">'+(repDiffSumOpen?'▾':'▸')+'</span> 📊 '+L({ur:'خلاصہ',en:'Summary',roman:'Khulasa'})
            +' <span class="qk">'+L({ur:'دائرہ',en:'scope',roman:'scope'})+' <b>'+last.n.toLocaleString()+'</b>'
            +(R.length>1?' · '+L({ur:'سب موجود',en:'all present',roman:'all present'})+' <b>'+res.allPresent.toLocaleString()+'</b>':'')
            +(_sn?' · '+_sn:'')+' · '+last.ms+' ms</span>'
            +'<span class="hint">'+(repDiffSumOpen?L({ur:'بند کریں',en:'hide',roman:'band'}):L({ur:'تفصیل',en:'details',roman:'tafseel'}))+'</span></button>';
        if(repDiffSumOpen){
    // خلاصہ پٹی
        h+='<div class="rep-diff-sum">';
        h+='<span>'+L({ur:'دائرہ:',en:'Scope:',roman:'Scope:'})+' <b>'+last.n.toLocaleString()+'</b> '+L({ur:'ربرکس',en:'rubrics',roman:'rubrics'})+'</span>';
        h+='<span>'+L({ur:'کسی ایک میں:',en:'Any present:',roman:'Any present:'})+' <b>'+res.any.toLocaleString()+'</b></span>';
        if(R.length>1) h+='<span>'+L({ur:'سب موجود:',en:'All present:',roman:'All present:'})+' <b>'+res.allPresent.toLocaleString()+'</b> ('+L({ur:'برابر گریڈ',en:'equal grades',roman:'barabar grade'})+' '+res.commonEqual.toLocaleString()+')</span>';
        R.forEach(function(a){ var p=res.perRem[a]; h+='<span class="rep-diff-remsum"><b dir="ltr">'+escapeHtml(a)+'</b> '+L({ur:'موجود',en:'in',roman:'in'})+' '+(((last.sizes&&last.sizes[a])||0)||p.inRubrics).toLocaleString()+(R.length>1?' · '+L({ur:'خصوصی',en:'exclusive',roman:'exclusive'})+' <b>'+p.excl.toLocaleString()+'</b>':'')+' · '+L({ur:'گریڈ 3',en:'grade 3',roman:'grade 3'})+' '+p.g3+' · '+L({ur:'سائز',en:'size',roman:'size'})+' '+((last.sizes&&last.sizes[a])||0).toLocaleString()+'</span>'; });
        h+='<span class="rep-diff-ms">'+last.ms+' ms</span>';
        h+='</div>';
        if(last.skipped) h+='<div class="rep-diff-note">'+L({ur:last.skipped.toLocaleString()+' بڑے ربرکس سائز کی حد سے باہر رکھے گئے (گنتیاں پوری کتاب سے ہیں)',en:last.skipped.toLocaleString()+' large rubrics skipped by the size cap (counts are book-wide)',roman:'barhe rubrics bahar'})+'</div>';
        if(R.length>1){
            h+='<div class="rep-diff-pairs">';
            Object.keys(res.pair).forEach(function(k){ var p=res.pair[k], ab=k.split('|'); h+='<span title="'+L({ur:'صرف پہلی / صرف دوسری / دونوں',en:'only first / only second / both',roman:'sirf pehli / sirf doosri / dono'})+'"><b dir="ltr">'+escapeHtml(ab[0])+'</b> ⇄ <b dir="ltr">'+escapeHtml(ab[1])+'</b>: '+p.onlyA+' / '+p.onlyB+' / '+p.both+'</span>'; });
            h+='</div>';
        }
        }
        if(res.cap) h+='<div class="rep-tool-note">⚠ '+L({ur:'فہرستیں بہت لمبی تھیں — سائز/گریڈ فلٹر سخت کریں',en:'Lists were very long — tighten size/grade filters',roman:'Lists lambi thin — filter sakht karein'})+'</div>';
    }
    var t=repDiffTab;
    if(t==='excl'&&res){
        if(R.length===1){
            var a0=R[0], L0=res.excl[a0];
            h+='<div class="rep-diff-sec"><div class="rep-diff-sechead">🔑 <b dir="ltr">'+escapeHtml(a0)+'</b> — '+escapeHtml(repRemedyTitle(a0))+' · '+L({ur:'ربرکس (فلٹر کے بعد)',en:'rubrics (after filters)',roman:'rubrics (filter ke baad)'})+' '+L0.length+'</div>';
            h+=L0.length?L0.map(function(r){ return repDiffRowHtml(r,R,inCase,showBook); }).join(''):'<div class="rep-tool-note">'+L({ur:'فلٹر میں کچھ نہیں — سائز بڑھائیں یا گریڈ کم کریں',en:'Nothing within filters — raise size or lower grade',roman:'Filter mein kuch nahi'})+'</div>';
            h+='</div>';
        } else {
            h+='<p class="rep-tool-sub">'+L({ur:'خصوصی = صرف یہی ریمیڈی موجود، باقی چنی ہوئی غائب۔ چھوٹا ربرک + اونچا گریڈ = مضبوط تفریق۔ ☑ سے ربرک کیس میں شامل، متن پر کلک = ربرک کھولیں۔',en:'Exclusive = only this remedy present, the other chosen ones absent. Small rubric + high grade = strong differentiation. ☑ adds the rubric to the case, click the text to open it.',roman:'Exclusive = sirf yehi remedy mojood. ☑ = case mein shamil.'})+'</p>';
            h+='<div class="rep-diff-cols">';
            R.forEach(function(a){
                var Lx=res.excl[a];
                h+='<div class="rep-diff-col"><div class="rep-diff-colhead"><b dir="ltr">'+escapeHtml(a)+'</b> <small>'+escapeHtml(repRemedyTitle(a).replace(/^.*= /,''))+'</small><span class="cnt">'+res.perRem[a].excl.toLocaleString()+' · '+L({ur:'دکھائے',en:'shown',roman:'shown'})+' '+Lx.length+'</span></div>';
                h+=Lx.length?Lx.map(function(r){ return repDiffRowHtml(r,R,inCase,showBook); }).join(''):'<div class="rep-tool-note">—</div>';
                h+='</div>';
            });
            h+='</div>';
        }
    } else if(t==='grade'&&res){
        h+='<p class="rep-tool-sub">'+L({ur:'سب چنی ہوئی ریمیڈیز موجود، مگر گریڈ الگ — شدت کا فرق۔ ترتیب: بڑا فرق + چھوٹا ربرک پہلے۔',en:'All chosen remedies present but with different grades — a difference of intensity. Larger gap + smaller rubric first.',roman:'Sab mojood, grade alag.'})+'</p>';
        h+=repDiffVecHead(R);
        h+=res.grade.length?res.grade.map(function(r){ return repDiffRowHtml(r,R,inCase,showBook); }).join(''):'<div class="rep-tool-note">—</div>';
    } else if(t==='partial'&&res){
        h+='<p class="rep-tool-sub">'+L({ur:'کچھ چنی ہوئی ریمیڈیز موجود، کچھ غائب (· = غائب)۔',en:'Some chosen remedies present, some absent (· = absent).',roman:'Kuch mojood, kuch ghaib.'})+'</p>';
        h+=repDiffVecHead(R);
        h+=res.partial.length?res.partial.map(function(r){ return repDiffRowHtml(r,R,inCase,showBook); }).join(''):'<div class="rep-tool-note">—</div>';
    } else if(t==='common'&&res){
        h+='<p class="rep-tool-sub">'+L({ur:'سب موجود، گریڈ برابر — فیصلے کے لیے بیکار، مگر یہ ان کا مشترکہ خاکہ ہے۔',en:'All present with equal grades — useless for deciding, but this is their shared picture.',roman:'Sab mojood, barabar grade.'})+'</p>';
        h+=repDiffVecHead(R);   // 🔑 v92 (صارف): یہاں نام غائب تھے
        h+=res.common.length?res.common.map(function(r){ return repDiffRowHtml(r,R,inCase,showBook); }).join(''):'<div class="rep-tool-note">—</div>';
    } else if(t==='rubric'){
        h+=repDiffRubricTabHtml(last,inCase);
    } else if(t==='books'){
        h+=repDiffBooksTabHtml(last,inCase);
    } else if(t==='mm'&&typeof repDiffMMTabHtml==='function'){
        h+=repDiffMMTabHtml(last);
    }
    body.innerHTML=h; body.scrollTop=0;
}
// ربرک موڈ ٹیب
// ---------- اعمال ----------
function repDiffClipToggle(btn,book,ch,rid,path,rems){
    var added=repClipToggle(repActiveClip,book,ch,rid,path,rems||0);
    if(btn){ btn.classList.toggle('on',added); btn.textContent=added?'✓':''; }
    if(typeof repCmpSyncChecks==='function') repCmpSyncChecks(book,rid,added);
    showToast((added?'☑ ':'☐ ')+repLangText({ur:added?repClipLabel(repActiveClip)+' میں شامل':repClipLabel(repActiveClip)+' سے ہٹا دیا',en:added?'Added to '+repClipLabel(repActiveClip):'Removed from '+repClipLabel(repActiveClip),roman:added?repClipLabel(repActiveClip)+' mein shamil':repClipLabel(repActiveClip)+' se hata diya'}));
    if(typeof repCmpPanelRender==='function') repCmpPanelRender();
}