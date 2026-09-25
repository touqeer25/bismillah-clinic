// Bismillah Clinic — js/repertory/rep-clipboards.js — 12 کلپ بورڈز
// (v78: 08-app-repertory.js کو بغیر کسی کوڈ تبدیلی کے حصوں میں بانٹا گیا؛ لوڈ ترتیب index.html میں وہی رکھیں)
// ==================== 12 CLIPBOARDS (floating, persisted) — v45: 8 سے 12 (صارف درخواست) ====================
// HomeoSetu فنکشن کلون: فلوٹنگ ڈاک میں 12 کلپ بورڈز — ہر کلپ بورڈ ایک
// محفوظ ورکنگ لسٹ ہے (ربرکس جو آپ ریپرٹورائزیشن کے لیے اکٹھا کر رہے ہیں)۔
// ربرک کارڈ کے ⋮ مینو سے شامل/ہٹائیں؛ ڈاک کے نمبر پر کلک سے لسٹ کھلتی ہے۔
var REP_N_CLIPS=12;
var repClipboards=[[],[],[],[],[],[],[],[],[],[],[],[]];   // each item: {book,ch,rid,path,rems,ts,w,sel}
var repActiveClip=0;               // 0..11 (displayed 1..12)
var repClipElims=[false,false,false,false,false,false,false,false,false,false,false,false];  // 🔑 Elimination Mode per clipboard (workbench)
var repClipNames=['','','','','','','','','','','',''];    // 🔑 custom clipboard names (workbench ✏ rename)
// 🔑 v54: ☑ کمپیئر موڈ (HomeoSetu) + تجزیے کے اصول (ایلی منیشن / کوریج) — محفوظ رہتے ہیں
var repCompareMode=false;                       // ☑ کمپیئر موڈ: کارڈز پر چیک باکس، ٹک = فعال کلپ بورڈ میں شامل
try{ var x=localStorage.getItem('bc_rep_cmp_mode'); if(x===null)x=(sessionStorage.getItem('bc_rep_cmp_mode')==='1')?'1':'0'; repCompareMode=(x==='1'); }catch(e){}   // 🔑 v68.6: پہلے session میں تھا — نئی ٹیب میں کمپیئر موڈ خود بخود بند ہو جاتا تھا
// 🔑 v70: بولین سرچ پارسر — "fear dark" (AND) · "fear OR anxiety" · "fear NOT night" · "fear -night"
function repParseBoolQuery(q){
    var toks=String(q||'').toLowerCase().replace(/\|/g,' or ').split(/\s+/).filter(Boolean);
    var groups=[[]], neg=[], pos=[], notNext=false;
    toks.forEach(function(t){
        if(t==='or'){ if(groups[groups.length-1].length)groups.push([]); return; }
        if(t==='and') return;
        if(t==='not'){ notNext=true; return; }
        if(t.charAt(0)==='-'&&t.length>1){ neg.push(t.substring(1)); return; }
        if(notNext){ neg.push(t); notNext=false; return; }
        groups[groups.length-1].push(t); pos.push(t);
    });
    groups=groups.filter(function(g){return g.length;});
    return {groups:groups,neg:neg,pos:pos};
}
function repBoolMatch(qb,text){
    var lt=String(text||'').toLowerCase();
    for(var n=0;n<qb.neg.length;n++){ if(lt.indexOf(qb.neg[n])!==-1) return false; }
    if(!qb.groups.length) return qb.neg.length>0;
    for(var i=0;i<qb.groups.length;i++){
        var g=qb.groups[i], ok=true;
        for(var j=0;j<g.length;j++){ if(lt.indexOf(g[j])===-1){ ok=false; break; } }
        if(ok) return true;
    }
    return false;
}
var repAnaOpts={elim:'every',cov:'count',method:'hs'};   // method: 'hs' (کوریج پہلے) | 'kent' (گریڈز کا مجموعہ پہلے) | 'boen' (بوننگھاؤسن + پولیریٹی)      // elim: 'every' (HomeoSetu: ہر ربرک میں) | 'any' (پرانا: کسی ایک میں) — cov: 'count' (ہر ربرک = 1) | 'weighted' (ویٹ کوریج میں بھی)
function repAnaOptsLoad(){ try{ var d=JSON.parse(localStorage.getItem('bc_rep_ana_opts')||'{}'); if(d.elim==='any'||d.elim==='every')repAnaOpts.elim=d.elim; if(d.cov==='count'||d.cov==='weighted')repAnaOpts.cov=d.cov; if(d.method==='hs'||d.method==='kent'||d.method==='boen')repAnaOpts.method=d.method; }catch(e){} }
function repAnaOptsSave(){ try{ localStorage.setItem('bc_rep_ana_opts',JSON.stringify(repAnaOpts)); }catch(e){} }
function repAnaSetOpt(k,v){
    if(k==='elim'&&(v==='every'||v==='any'))repAnaOpts.elim=v;
    if(k==='cov'&&(v==='count'||v==='weighted'))repAnaOpts.cov=v;
    if(k==='method'&&(v==='hs'||v==='kent'||v==='boen'))repAnaOpts.method=v;
    repAnaOptsSave();
    if(repWorkbenchOpen)renderWorkbench(); else if(repAnalysisOpen>=0)renderAnalysis();
}
function repClipOptsLoad(){
    try{ var d=JSON.parse(localStorage.getItem('bc_rep_clip_opts')||'{}');
        if(d){ if(d.elims)for(var i=0;i<REP_N_CLIPS;i++)repClipElims[i]=!!d.elims[i]; if(d.names)for(var j=0;j<REP_N_CLIPS;j++)repClipNames[j]=String(d.names[j]||''); }
    }catch(e){}
}
function repClipOptsSave(){ try{ localStorage.setItem('bc_rep_clip_opts',JSON.stringify({elims:repClipElims,names:repClipNames})); }catch(e){} }
var repClipViewOpen=false;repWorkbenchOpen=false;repCompareOpen=false;repAnalysisOpen=-1;         // clipboard list view currently shown?
var repDockTrashArm=0;             // 🗑 double-click arm (confirm)
function repClipsLoad(){
    try{ var s=localStorage.getItem('bc_rep_clipboards'); if(s){ var d=JSON.parse(s); if(d&&d.length){ // 🔑 v39 migration: پرانا 4-کلپ بورڈ ڈیٹا محفوظ رہتے ہوئے 8 تک بڑھایا جاتا ہے
        while(d.length<REP_N_CLIPS)d.push([]);
        if(d.length>REP_N_CLIPS){ var dropped=d.slice(REP_N_CLIPS).reduce(function(a,x){ return a+((x&&x.length)||0); },0); d=d.slice(0,REP_N_CLIPS); if(dropped)console.warn('rep clips: '+dropped+' rubric(s) in boards beyond '+REP_N_CLIPS+' were dropped'); }
        repClipboards=d; } } }catch(e){ console.warn('rep clips load failed',e); }   // 🔑 v68.6: پہلے 12 کے علاوہ ہر گنتی چپکے سے ضائع ہو جاتی تھی
    // 🔑 v38 migration: every item gets a multiplier weight (default 1x)
    for(var i=0;i<REP_N_CLIPS;i++)(repClipboards[i]||[]).forEach(function(it){ if(typeof it.w!=='number')it.w=1; });
    repClipOptsLoad(); repAnaOptsLoad();
}
function repClipsSave(){ try{ localStorage.setItem('bc_rep_clipboards', JSON.stringify(repClipboards)); }catch(e){ if(typeof showToast==='function')showToast(repLangText({ur:'⚠ کلپ بورڈ محفوظ نہ ہو سکے (جگہ ختم)',en:'⚠ clipboard not saved (storage full)',roman:'⚠ clip board save na hua'})); } }   // 🔑 v68.6: خاموش ناکامی کی جگہ خبر
function repClipFind(ci,book,rid){
    var l=repClipboards[ci]||[];
    for(var i=0;i<l.length;i++){ if(l[i].book===book&&String(l[i].rid)===String(rid)) return i; }
    return -1;
}
function repClipToggle(ci,book,ch,rid,path,rems){
    if(!rid) return false;
    var idx=repClipFind(ci,book,rid);
    var added=false;
    if(idx!==-1){ repClipboards[ci].splice(idx,1); }
    else { repClipboards[ci].unshift({book:book,ch:ch,rid:String(rid),path:path,rems:rems||0,ts:Date.now()}); added=true; }
    repClipsSave(); repRenderDock();
    return added;
}
function repClipTrash(){
    var l=repClipboards[repActiveClip]||[];
    if(!l.length) return;
    if(!repDockTrashArm){ repDockTrashArm=1; if(repClipViewOpen)renderClipView(); else repRenderDock(); setTimeout(function(){ repDockTrashArm=0; if(repClipViewOpen)renderClipView(); else repRenderDock(); },2600); return; }
    repDockTrashArm=0;
    repClipboards[repActiveClip]=[]; repClipsSave();
    showToast(repLangText({ur:'🗑 کلپ بورڈ '+(repActiveClip+1)+' خالی کر دیا',en:'🗑 Clipboard '+(repActiveClip+1)+' cleared',roman:'🗑 Clipboard '+(repActiveClip+1)+' khali kar diya'}));
    if(repClipViewOpen) renderClipView(); else repRenderDock();
}
function repClipCopyAll(){
    var l=repClipboards[repActiveClip]||[];
    if(!l.length){ showToast(repLangText({ur:'کلپ بورڈ خالی ہے',en:'Clipboard is empty',roman:'Clipboard khali hai'})); return; }
    var txt=l.map(function(it){ return (REP_BOOK_INFO[it.book]?REP_BOOK_INFO[it.book].abbr+': ':'')+it.path; }).join('\n');
    if(navigator.clipboard){ navigator.clipboard.writeText(txt).then(function(){ showToast('📋 '+repLangText({ur:l.length+' ربرکس کاپی ہو گئے',en:l.length+' rubrics copied',roman:l.length+' rubrics copy ho gaye'})); }); }
}
function repToggleClipView(i){
    if(repClipViewOpen&&repActiveClip===i){ repCloseClipView(); return; }
    repHistBack.push(repCurrentState()); repHistFwd=[];
    repActiveClip=i; repClipViewOpen=true; repCurrentDetail=null; repDockTrashArm=0;
    repWorkbenchOpen=false; repCompareOpen=false; repAnalysisOpen=-1;
    renderClipView();
}
function repCloseClipView(){ repGo(repFolderPath); }

