// Bismillah Clinic — js/differentiation/04-diff-rubric-mode.js
// 🔬 تفریق / نکاسی — ربرک کی دواؤں کا تقابل (انجن + میز)
// (v83 میں js/08b-rep-differentiation.js کو آٹھ حصوں میں بانٹا گیا؛ ترتیب LOAD_ORDER.txt میں)

// ---------- ربرک موڈ: ربرک کی تمام ریمیڈیز کا ہم رشتہ ربرکس پر تقابل ----------
function _repDiffBaseTitle(t){ return String(t||'').replace(/\s*\((?:see|cmp\.?|comp\.?|cf\.?)[^)]*\)/gi,'').trim(); }
function _repDiffHead(t){ return _repDiffBaseTitle(String(t||'').split(',')[0]).toUpperCase(); }
// فیچر جھرمٹ: ذیلی ربرکس + «(See …)» کے اہداف (مع ان کے ذیلی ربرکس)
function repDiffClusterFor(ctx,bookData){
    var out=[]; if(!ctx||!bookData) return out;
    var d=bookData[ctx.ch]; if(!d){ var want=String(normalizeChapterKey(ctx.book,ctx.ch)).toLowerCase(); Object.keys(bookData).forEach(function(c){ if(String(normalizeChapterKey(ctx.book,c)).toLowerCase()===want) d=bookData[c]; }); }
    if(!d) return out;
    var main=d[ctx.rid]; var title=(main&&main.t)||ctx.full||''; var base=_repDiffBaseTitle(title);
    var S=(main&&main.r)||ctx.rems||{};
    var targets=repExtractSeeTargets(title).map(function(x){ return x.toUpperCase().replace(/\s+AND\s+/g,',').split(/[,;]/).map(function(s){return s.trim();}).filter(Boolean); });
    var tg=[]; targets.forEach(function(arr){ arr.forEach(function(s){ if(tg.indexOf(s)===-1)tg.push(s); }); });
    var seen={};
    Object.keys(d).forEach(function(rid){
        if(rid===ctx.rid) return;
        var v=d[rid]; if(!v||!v.r) return; var t=v.t||'';
        var kind='';
        if(t.indexOf(title+',')===0) kind='sub';
        else if(base&&t.indexOf(base+',')===0) kind='sub';
        else if(tg.length){ var head=_repDiffHead(t); for(var i=0;i<tg.length;i++){ if(head===tg[i]||head.indexOf(tg[i]+' ')===0){ kind='x'; break; } } }
        if(!kind) return;
        var shared=0; for(var a in v.r){ if(S[a])shared++; }
        if(!shared) return;
        var label=kind==='sub'?('⏱ '+t.substring(t.indexOf(',')+1).trim()):('↔ '+_repDiffBaseTitle(t));
        var key=kind+'|'+rid; if(seen[key])return; seen[key]=1;
        out.push({key:key,kind:kind,rid:rid,ch:ctx.ch,label:label,t:t,r:v.r,N:Object.keys(v.r).length,shared:shared});
    });
    out.sort(function(a,b){ return (a.shared-b.shared)||(a.N-b.N); });
    if(out.length>REP_DIFF_FEAT_CAP) out=out.slice(0,REP_DIFF_FEAT_CAP);
    return out;
}
function repDiffRubricMode(ctx,bookData,sizes){
    var feats=repDiffClusterFor(ctx,bookData);
    var d=bookData&&bookData[ctx.ch]; var main=d&&d[ctx.rid]; var S=(main&&main.r)||ctx.rems||{};
    var abbrs=Object.keys(S); var n=abbrs.length;
    var rareLimit=Math.max(2,Math.round(n*0.12));
    var rows=abbrs.map(function(a){
        var fs=[],score=0;
        feats.forEach(function(f){ var g=repDiffGrade(f.r[a]); if(!g)return; var spec=repDiffSpec(f.shared); score+=g*spec; fs.push({f:f,g:g,rare:f.shared<=rareLimit}); });
        var size=(sizes&&sizes[a])||0;
        return {abbr:a,g:repDiffGrade(S[a]),feats:fs,rawScore:score,score:score/repDiffNormSize(size),size:size,rare:fs.filter(function(x){return x.rare;})};
    });
    rows.sort(function(a,b){ return (b.g-a.g)||(b.score-a.score)||a.abbr.localeCompare(b.abbr); });
    return {feats:feats,rows:rows,n:n,rareLimit:rareLimit,title:(main&&main.t)||ctx.full||''};
}

function repDiffRubricTabHtml(last,inCase){
    var L=repLangText; if(!repDiffCtx) return '<div class="rep-tool-loading">'+L({ur:'ربرک کا سیاق نہیں — ربرک کے صفحے سے 🔬 کھولیں',en:'No rubric context — open 🔬 from a rubric page',roman:'Rubric context nahi'})+'</div>';
    var bookData=last.all[repDiffCtx.book]; if(!bookData) return '<div class="rep-tool-loading">—</div>';
    var rm=repDiffRubricMode(repDiffCtx,bookData,repDiffRemedySizes(repDiffCtx.book,bookData));
    var h='<p class="rep-tool-sub">'+L({ur:'ربرک کی ہر ریمیڈی کا اس کے ذیلی ربرکس اور «(See …)» والے ہم رشتہ ربرکس پر پروفائل۔ کالم نایاب سے عام کی طرف (بریکٹ = ربرک کی کتنی ریمیڈیز اس فیچر میں بھی ہیں)۔ ⭐ = نایاب فیچر (≤ '+rm.rareLimit+')۔ اسکور = Σ گریڈ × مخصوصیت ÷ ریمیڈی کا سائز۔ ☐ سے 2 تا 5 ریمیڈیز چن کر «خصوصی» ٹیب دیکھیں۔',en:'Profile of every remedy of this rubric over its sub-rubrics and "(See …)" related rubrics. Columns from rare to common (bracket = how many of the rubric\'s remedies share the feature). ⭐ = rare feature (≤ '+rm.rareLimit+'). Score = Σ grade × specificity ÷ remedy size. Tick ☐ to pick 2–5 remedies for the Exclusive tab.',roman:'Har remedy ka profile; ⭐ = nayab feature.'})+'</p>';
    if(!rm.feats.length) return h+'<div class="rep-tool-note">'+L({ur:'اس ربرک کے ذیلی یا ہم رشتہ ربرکس نہیں ملے — «خصوصی» ٹیب استعمال کریں۔',en:'No sub-rubrics or related rubrics found for this rubric — use the Exclusive tab.',roman:'Zeli/ham-rishta rubrics nahi mile.'})+'</div>';
    h+='<div class="rep-diff-sum"><span>'+L({ur:'ریمیڈیز:',en:'Remedies:',roman:'Remedies:'})+' <b>'+rm.n+'</b></span><span>'+L({ur:'فیچرز:',en:'Features:',roman:'Features:'})+' <b>'+rm.feats.length+'</b> ('+rm.feats.filter(function(f){return f.kind==='sub';}).length+' '+L({ur:'ذیلی',en:'sub',roman:'zeli'})+' + '+rm.feats.filter(function(f){return f.kind==='x';}).length+' ↔)</span>'
        +'<span>'+L({ur:'بغیر کسی فیچر کے:',en:'Without any feature:',roman:'Bila feature:'})+' <b>'+rm.rows.filter(function(r){return !r.feats.length;}).length+'</b> — '+L({ur:'ان کے لیے میٹیریا میڈیکا لازم',en:'materia medica needed for these',roman:'in ke liye MM lazim'})+'</span></div>';
    h+='<div class="rep-diff-tblwrap"><table class="rep-diff-tbl"><thead><tr><th class="st">☐</th><th class="st">'+L({ur:'ریمیڈی',en:'Remedy',roman:'Remedy'})+'</th><th title="'+L({ur:'اس ربرک میں گریڈ',en:'grade in this rubric',roman:'is rubric mein grade'})+'" class="gcol">G</th><th title="'+L({ur:'اسکور',en:'score',roman:'score'})+'">Σ</th><th>'+L({ur:'نایاب فیچرز',en:'Rare features',roman:'Nayab features'})+'</th>';
    rm.feats.forEach(function(f){ h+='<th class="ft" title="'+_repAttr(f.t+' — '+f.N+' remedies; shared '+f.shared)+'"><div class="rep-diff-fth" dir="ltr">'+escapeHtml(f.label.length>34?f.label.substring(0,33)+'…':f.label)+' <small>['+f.shared+']</small></div></th>'; });
    h+='</tr></thead><tbody>';
    rm.rows.forEach(function(r){
        var on=repDiffSel.indexOf(r.abbr)!==-1;
        h+='<tr class="'+(on?'sel':'')+'"><td class="st"><input type="checkbox" '+(on?'checked':'')+' onchange="repDiffToggleRem(\''+_repJs(r.abbr)+'\')"></td>'
            +'<td class="st rem"><b dir="ltr" title="'+_repAttr(repRemedyTitle(r.abbr))+'" onclick="repDiffOpenWithRemedies([\''+_repJs(r.abbr)+'\'],repDiffCtx)">'+escapeHtml(r.abbr)+'</b> <small>'+r.size.toLocaleString()+'</small></td>'
            +'<td class="gcol"><span class="rep-diff-dot d'+r.g+'">'+r.g+'</span></td><td class="sc">'+repDiffFmt(r.score)+'</td>'
            +'<td class="rare" dir="ltr">'+(r.rare.length?r.rare.map(function(x){ return '<span class="rep-diff-rare" title="'+_repAttr(x.f.t)+'">⭐ '+escapeHtml(x.f.label.replace(/^[⏱↔]\s*/,''))+' <small>['+x.f.shared+']</small></span>'; }).join(' '):'<span class="rep-diff-none">—</span>')+'</td>';
        var byKey={}; r.feats.forEach(function(x){ byKey[x.f.key]=x.g; });
        rm.feats.forEach(function(f){ var g=byKey[f.key]||0; h+='<td class="c">'+(g?'<i class="rep-gr-dot d'+g+'" title="'+_repAttr(r.abbr+' = '+g+' — '+f.t)+'"></i>':'')+'</td>'; });
        h+='</tr>';
    });
    h+='</tbody></table></div>';
    return h;
}
// کتابوں کی گواہی ٹیب