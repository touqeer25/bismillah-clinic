// Bismillah Clinic — js/differentiation/08-diff-extract.js
// 🔬 تفریق / نکاسی — ایک دوا کی مکمل فہرست نکالنا + کاپی + نیویگیشن
// (v83 میں js/08b-rep-differentiation.js کو آٹھ حصوں میں بانٹا گیا؛ ترتیب LOAD_ORDER.txt میں)

// ==================== ✅ v68.7: «ایک دوا کی فہرست نکالنا» (remedy extraction) ====================
// ریڈار اوپس جیسا: ایک دوا چنیں، اور اُس کی وہ ساری جگہیں نکالیں جن میں وہ دوا ہے —
//   شرط کے ساتھ: ربرک کا سائز ≤، کم از کم گریڈ، صرف انوکھی جگہیں (جن میں اور کوئی نہ ہو)،
//   اور صرف پہلے نمبر کی جگہیں (outranking)۔ یہ سب فہرست بھرتے ہوئے چھانتا ہے، بعد میں نہیں۔
function repDiffExtract(abbr,list,opts,sizes){
    var out={abbr:abbr,total:0,top:0,single:0,rows:[],cap:false,skipped:0};
    if(!abbr||!list||!list.length) return out;
    var minG=opts.minG||1, maxN=(opts.maxN&&opts.maxN>0)?opts.maxN:Infinity, onlyOnly=!!opts.onlySingle, topOnly=!!opts.topOnly;
    for(var i=0;i<list.length;i++){
        var x=list[i], r=x.r||{};
        var g=repDiffGrade(r[abbr]); if(g<minG) continue;
        var n=0,best=0,bestA=null;
        for(var a in r){ var gg=repDiffGrade(r[a]); n++; if(gg>best){best=gg;bestA=a;} else if(gg===best&&bestA&&a<bestA)bestA=a; }
        out.total++;
        var isSingle=(n===1), isTop=(g>=best);
        if(isSingle) out.single++;
        if(isTop) out.top++;
        if(onlyOnly&&!isSingle) continue;
        if(topOnly&&!isTop) continue;
        if(n>maxN){ out.skipped++; continue; }
        out.rows.push({x:x,N:n,g:g,score:g*repDiffSpec(n),peer:isSingle?'':bestA,pg:best});
    }
    out.rows.sort(function(a,b){ return (b.g-a.g)||(a.N-b.N)||(b.score-a.score); });
    if(out.rows.length>REP_EXTR_CAP){ out.rows.length=REP_EXTR_CAP; out.cap=true; }
    out.k1=out.total;
    return out;
}
function repDiffExtrRowHtml(row,abbr){
    var x=row.x, inC=repDiffInCaseSet()[x.book+'|'+String(x.rid)];
    var peer=row.peer&&row.pg>row.g?(' <span class="rep-diff-hint">'+abbr+' → '+row.g+' · '+escapeHtml(row.peer)+' → '+row.pg+'</span>'):'';
    return '<div class="rep-diff-row">'
        +'<button class="rpc-chk sr'+(repClipFind(repActiveClip,x.book,x.rid)!==-1?' on':'')+'" title="'+repLangText({ur:'فعال کلپ بورڈ میں شامل/خارج',en:'Add to / remove from active clipboard',roman:'Active clipboard mein shamil/kharij'})+'" onclick="repDiffClipToggle(this,\''+_repJs(x.book)+'\',\''+_repJs(x.ch)+'\',\''+_repJs(x.rid)+'\',\''+_repJs(x.t)+'\','+row.N+')">'+(repClipFind(repActiveClip,x.book,x.rid)!==-1?'✓':'')+'</button>'
        +'<span class="rep-diff-ch">'+escapeHtml(getChapterDisplayName(x.book,x.ch)||x.ch)+' ›</span> '
        +'<span class="rep-diff-t" dir="ltr" onclick="repDiffGo(\''+_repJs(x.book)+'\',\''+_repJs(x.ch)+'\',\''+_repJs(x.rid)+'\')">'+escapeHtml(x.t)+'</span>'+peer
        +'<span class="rep-diff-n" title="'+repLangText({ur:'ربرک کی کل ریمیڈیز',en:'remedies in rubric',roman:'rubric ki kul remedies'})+'">'+row.N+'</span>'
        +'<span class="rep-diff-vec"><span class="rep-diff-dot d'+row.g+'">'+row.g+'</span></span>'
        +'<span class="rep-diff-score">'+repDiffFmt(row.score)+'</span>'
        +(inC?'<span class="rep-diff-incase">📋'+inC+'</span>':'')
        +'</div>';
}
function repDiffRenderExtr(last){
    var L=repLangText, e=last.extract, body=document.getElementById('repDiffBody'); if(!body||!e)return;
    var h='<div class="rep-diff-sum">'
        +'<span class="rep-diff-chip on"><b dir="ltr">'+escapeHtml(e.abbr)+'</b> <button onclick="repDiffToggleRem(\''+_repJs(e.abbr)+'\')">✕</button></span> '
        +'<span>'+L({ur:'اس کتاب میں کل جگہیں',en:'rubrics in scope',roman:'kul jagahain'})+': <b>'+e.total+'</b></span>'
        +'<span>'+L({ur:'انوکھی',en:'single-remedy',roman:'anokhi'})+': <b>'+e.single+'</b></span>'
        +'<span>'+L({ur:'پہلے نمبر پر',en:'not outranked',roman:'pehle number par'})+': <b>'+e.top+'</b></span>'
        +'<span>'+L({ur:'دکھائی جا رہی',en:'shown',roman:'dikhai ja rahi'})+': <b>'+e.rows.length+'</b>'+L({ur:' (اوپر والی شرط کے بعد)',en:' (after filters)',roman:' (shart ke baad)'})+'</span>'
        +'</div>';
    if(e.cap) h+='<div class="rep-diff-note">ℹ '+L({ur:'فہرست لمبی تھی، '+REP_EXTR_CAP+' بہترین قطاریں دکھائی گئیں۔ چھانٹنی لگائیں تو سب نظر آئیں گی۔',en:'Long list — top '+REP_EXTR_CAP+' rows shown; add filters to see the rest.',roman:'Lambi fehrist'})+'</div>';
    if(last.scanned>REP_DIFF_SCAN_STOP) h+='<div class="rep-diff-note">⚠ '+L({ur:'اسکین چھوٹی رکھی گئی: '+last.scanned+' ربرکس چھانٹے گئے، مقررہ حد تک۔ دائرہ چھوٹا (باب یا کتاب) رکھیں تو سب کچھ دیکھا جائے گا۔',en:'Scan capped at '+last.scanned+' rubrics. Narrow the scope (chapter or book) to be exhaustive.',roman:'Scan chhoti rakhi'})+'</div>';
    if(e.skipped) h+='<div class="rep-diff-note">'+L({ur:e.skipped+' بڑی جگہیں سائز کی شرط سے باہر رہیں',en:e.skipped+' large rubrics filtered out by the size cap',roman:e.skipped+' barhi jagahain bahar'})+'</div>';
    var o=repDiffOpts;
    h+='<div class="rep-diff-ctl">'
        +'<label><input type="checkbox" '+(o.onlySingle?'checked':'')+' onchange="repDiffSetOpt(\'onlySingle\',this.checked?1:0)"> '+L({ur:'صرف انوکھی جگہیں (اکیلے یہی دوا)',en:'single-remedy pages only',roman:'anokhi'})+'</label>'
        +'<label><input type="checkbox" '+(o.topOnly?'checked':'')+' onchange="repDiffSetOpt(\'topOnly\',this.checked?1:0)"> '+L({ur:'صرف جہاں یہ دوا سب سے اوپر ہے',en:'where this remedy outranks the rest',roman:'sab se ooper'})+'</label>'
        +'<button class="rc-btn primary" onclick="repDiffTakeAll()">📥 '+L({ur:'سب کلپ بورڈ میں',en:'Take all into clipboard',roman:'Sab clipboard mein'})+'</button>'
        +'<button class="rc-btn" onclick="repDiffCopy()">📋</button>'
        +'</div>';
    if(!e.rows.length) h+='<div class="rep-tool-loading">'+L({ur:'اس دائرے اور ان شرائط کے تحت کوئی جگہ نہیں ملی۔',en:'Nothing in this scope with these filters.',roman:'Koi jagah nahi mili'})+'</div>';
    else { h+='<div class="rep-diff-rows" dir="ltr">'; for(var i=0;i<e.rows.length;i++) h+=repDiffExtrRowHtml(e.rows[i],e.abbr); h+='</div>'; }
    body.innerHTML=h; body.scrollTop=0;
}
// نکالی ہوئی پوری فہرست ایک ساتھ فعال کلپ بورڈ میں
function repDiffTakeAll(){
    var last=repDiffLast, e=last&&last.extract;
    var rows=e?e.rows:(last&&last.res?[]:[]);
    if(!rows.length){ showToast(repLangText({ur:'پہلے چلائیں',en:'Run first',roman:'Pehle chalayein'})); return; }
    var added=0;
    for(var i=rows.length-1;i>=0;i--){ var x=rows[i].x;
        if(repClipFind(repActiveClip,x.book,x.rid)===-1){ repClipboards[repActiveClip].unshift({book:x.book,ch:x.ch,rid:String(x.rid),path:x.t,rems:rows[i].N,ts:Date.now()}); added++; }
    }
    if(added){ repClipsSave(); repRenderDock(); if(typeof repCmpPanelRender==='function')repCmpPanelRender(); repDiffRenderExtr(last); repDiffRenderHead(); }
    showToast('📥 '+(added?repLangText({ur:added+' جگہیں '+repClipLabel(repActiveClip)+' میں ڈال دیں',en:added+' rubrics added to '+repClipLabel(repActiveClip),roman:added+' jagahain clipboard mein'}):repLangText({ur:'سب پہلے سے موجود تھیں',en:'already there',roman:'sab mojood thin'})));
}
function repDiffGo(book,ch,rid){ repDiffClose(); navigateToRubric(book,ch,rid,true); }
function repDiffCopy(){
    var last=repDiffLast; if(!last||!last.res){ showToast(repLangText({ur:'پہلے چلائیں',en:'Run first',roman:'Pehle chalayein'})); return; }
    var R=repDiffSel, res=last.res, lines=[];
    if(last.extract&&!res){ var e=last.extract; lines.push('EXTRACT — '+e.abbr+' — scope: '+last.scope+' ('+last.n+' rubrics scanned)');
        lines.push('total='+e.total+' single-remedy='+e.single+' not-outranked='+e.top+' shown='+e.rows.length);
        e.rows.forEach(function(r){ lines.push('  ['+r.g+'] ('+r.N+') '+(getChapterDisplayName(r.x.book,r.x.ch)||r.x.ch)+' › '+r.x.t); });
        var tx=lines.join('\n'); if(navigator.clipboard) navigator.clipboard.writeText(tx).then(function(){ showToast('📋 '+repLangText({ur:'فہرست کاپی ہو گئی',en:'List copied',roman:'Fehrist copy ho gayi'})); }); return; }
    lines.push('DIFFERENTIATION — '+R.join(' vs ')+' — scope: '+last.scope+' ('+last.n+' rubrics)'+(repDiffCtx?(' — rubric: '+repDiffCtx.full):''));
    lines.push('any='+res.any+' allPresent='+res.allPresent+' commonEqual='+res.commonEqual);
    R.forEach(function(a){ lines.push(''); lines.push('== '+a+' ('+repRemedyTitle(a)+') exclusive '+res.perRem[a].excl+' =='); res.excl[a].slice(0,40).forEach(function(r){ lines.push('  ['+r.g+'] ('+r.N+') '+(getChapterDisplayName(r.x.book,r.x.ch)||r.x.ch)+' › '+r.x.t); }); });
    if(res.grade.length){ lines.push(''); lines.push('== grade differences =='); res.grade.slice(0,40).forEach(function(r){ lines.push('  '+r.vec.join('/')+' ('+r.N+') '+r.x.t); }); }
    var txt=lines.join('\n');
    if(navigator.clipboard){ navigator.clipboard.writeText(txt).then(function(){ showToast('📋 '+repLangText({ur:'نتیجہ کاپی ہو گیا',en:'Result copied',roman:'Nateeja copy ho gaya'})); }); }
}
