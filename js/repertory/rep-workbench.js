// Bismillah Clinic — js/repertory/rep-workbench.js — ڈاک، ورک بینچ، Combine/Merge
// (v78: 08-app-repertory.js کو بغیر کسی کوڈ تبدیلی کے حصوں میں بانٹا گیا؛ لوڈ ترتیب index.html میں وہی رکھیں)
// ============================================================
// 🔑 HOMEOSETU LAYOUT CLONE — v37 TOOL VIEWS + ASK AI
// 1) فلوٹنگ ڈاک (index.html میں repDockArea ہمیشہ نظر آنے والے حصے کے نیچے)
// 2) ⚙ Clipboard Workbench — بارہ کلپ بورڈز ایک جگہ
// 3) 📊 Case Analysis Grid — ریپرٹورائزیشن چارٹ (ربرک × ادویہ، گریڈ ڈاٹس)
// 4) ⇄ Compare — کلپ بورڈز کا موازنہ + مشترکہ ادویات
// 5) 🤖 Ask AI — فلوٹنگ اسسٹنٹ (علامت → میچنگ ربرکس + استعمال کی مدد)
// 6) سائیڈبار ٹولز — N selected / Clear / Analyze
// ============================================================
var repWorkbenchOpen=false, repCompareOpen=false, repAnalysisOpen=-1;
var repCompareSel=[false,false,false,false,false,false,false,false];

function _repTruncPath(s,n){ s=String(s==null?'':s); return s.length>n?s.substring(0,n-1)+'…':s; }
function repCloseToolView(){ repGo(repFolderPath); }

// ---------- shared data loading for tool views ----------
function repEnsureAllBooks(cb){
    if(_allBooksData&&Object.keys(_allBooksData).length>=Object.keys(REP_BOOK_INFO).length){ cb(_allBooksData); return; }
    loadAllBooksData(function(all){ cb(all||{}); });
}
function repClipItemRemedies(it,all){
    if(it&&it.combined&&it.remsObj) return it.remsObj;            // ⊕ مشترکہ ربرک: ادویہ ساتھ محفوظ ہیں
    if(it.book===repCurrentBook&&repRidPathMap&&repRidPathMap[String(it.rid)]) return repRidPathMap[String(it.rid)].node.remedies||{};
    var sd=all?all[it.book]:null; if(!sd)return {};
    var ch=sd[it.ch]||sd[normalizeChapterKey(it.book,it.ch)]||null; if(!ch)return {};
    var r=ch[String(it.rid)]||null;
    return (r&&r.r)?r.r:{};
}
// 🔑 v54 اصول: کوریج یونٹ — 'count' (HomeoSetu: ہر ربرک = 1، ویٹ صرف اسکور پر) | 'weighted' (پرانا: ویٹ کوریج میں بھی)
function _repCovUnit(w){ return (repAnaOpts.cov==='weighted')?w:1; }
function _repAnaAccum(col,rems,w){
    Object.keys(rems).forEach(function(a){
        var g=rems[a]||1; g=g>=3?3:(g===2?2:1);
        var e=col[a]; if(!e)e=col[a]={cov:0,total:0,n:0};
        if(w>0){ e.cov+=_repCovUnit(w); e.total+=g*w; e.n++; }
        else   { e.cov-=1; e.total-=g*Math.abs(w); }      // -1x: منفی ربرک — کوریج بھی گھٹتی ہے، اسکور بھی
    });
}
// 🔑 v55: گرڈ کی سرِفہرست ریمیڈیز → 🔬 تفریق (ٹاپ 3 / ٹاپ 5)
function repAnaDiffBtnsHtml(abbrs){
    if(typeof repDiffOpenWithRemedies!=='function'||!abbrs||abbrs.length<2) return '';
    var h='';
    [3,5].forEach(function(n){ if(abbrs.length>=n||(n===3&&abbrs.length>=2)){ var top=abbrs.slice(0,n); h+='<button class="rc-btn rep-ana-diff" data-r="'+_repAttr(top.join(','))+'" onclick="repDiffOpenWithRemedies(this.getAttribute(\'data-r\').split(\',\'))" title="'+_repAttr(top.join(' vs '))+'">🔬 '+repLangText({ur:'ٹاپ '+top.length+' کا فرق',en:'differentiate top '+top.length,roman:'top '+top.length+' ka farq'})+'</button>'; } });
    return h;
}
function repFmtScore(t){ t=Math.round(t*10)/10; return (Math.abs(t-Math.round(t))<0.001)?String(Math.round(t)):t.toFixed(1); }
function repElimRuleDesc(){ return repAnaOpts.elim==='every'
    ? repLangText({ur:'گرڈ میں صرف وہی ادویات رہیں گی جو اس کلپ بورڈ کے ہر ایک ربرک میں موجود ہوں (ہومیوسیتو اصول)',en:'Grid keeps only remedies present in EVERY rubric of this clipboard (HomeoSetu rule)',roman:'Sirf wohi adwiyat jo is clipboard ke HAR rubric mein hon (HomeoSetu)'})
    : repLangText({ur:'گرڈ میں صرف وہی ادویات رہیں گی جو اس کلپ بورڈ کے کسی ایک ربرک میں بھی موجود ہوں (پرانا اصول)',en:'Grid keeps only remedies present in at least ONE rubric of this clipboard (classic rule)',roman:'Jo kisi aik rubric mein bhi hon (classic)'}); }
function repAnaRulesHtml(){
    var e=repAnaOpts.elim, c=repAnaOpts.cov;
    var anyElim=false; if(repWorkbenchOpen){ for(var q=0;q<REP_N_CLIPS;q++) if(repClipElims[q]&&(repClipboards[q]||[]).length) anyElim=true; }
    else if(repAnalysisOpen>=0) anyElim=!!repClipElims[repAnalysisOpen];
    var sw=(!repWorkbenchOpen&&repAnalysisOpen>=0)
        ? '<label class="rar-sw"><input type="checkbox" '+(repClipElims[repAnalysisOpen]?'checked':'')+' onchange="repClipElimToggle('+repAnalysisOpen+',this.checked)"> 🚫 '+repLangText({ur:'اس کلپ بورڈ پر ایلی منیشن موڈ',en:'Elimination Mode on this clipboard',roman:'Elimination Mode'})+'</label>' : '';
    var hint=anyElim?'':'<span class="rar-hint" style="font-size:11px;color:#b9770e;">ⓘ '+repLangText({ur:'کوئی کلپ بورڈ ایلی منیشن موڈ میں نہیں، اس لیے «ایلی منیشن» رول ابھی بے اثر ہے',en:'No clipboard is in Elimination Mode, so the Elimination rule has no effect yet',roman:'Elimination rule abhi be-asar hai'})+'</span>';
    return '<div class="rep-ana-rules">'+sw
        +'<span class="rar-lab">⚙ '+repLangText({ur:'اصول:',en:'Rules:',roman:'Rules:'})+'</span>'
        +'<label title="'+repLangText({ur:'ایلی منیشن موڈ والے کلپ بورڈ کی شرط',en:'Condition applied by an Elimination-Mode clipboard',roman:'Elimination clipboard ki shart'})+'">🚫 '+repLangText({ur:'ایلی منیشن',en:'Elimination',roman:'Elimination'})+' <select onchange="repAnaSetOpt(\'elim\',this.value)">'
        +'<option value="every"'+(e==='every'?' selected':'')+'>'+repLangText({ur:'ہر ربرک میں موجود ہو (ہومیوسیتو)',en:'in EVERY rubric (HomeoSetu)',roman:'har rubric mein (HomeoSetu)'})+'</option>'
        +'<option value="any"'+(e==='any'?' selected':'')+'>'+repLangText({ur:'کسی ایک ربرک میں (پرانا)',en:'in ANY rubric (classic)',roman:'kisi aik rubric mein (classic)'})+'</option></select></label>'
        +'<label title="'+repLangText({ur:'کوریج = دوا کتنے ربرکس میں ہے؛ ویٹ اسکور کو ہمیشہ گنا کرتا ہے',en:'Coverage = in how many rubrics the remedy appears; weight always multiplies the score',roman:'Coverage = kitne rubrics mein; weight score ko guna karta hai'})+'">📈 '+repLangText({ur:'کوریج',en:'Coverage',roman:'Coverage'})+' <select onchange="repAnaSetOpt(\'cov\',this.value)">'
        +'<option value="count"'+(c==='count'?' selected':'')+'>'+repLangText({ur:'ہر ربرک = 1 (ہومیوسیتو)',en:'each rubric = 1 (HomeoSetu)',roman:'har rubric = 1 (HomeoSetu)'})+'</option>'
        +'<option value="weighted"'+(c==='weighted'?' selected':'')+'>'+repLangText({ur:'ویٹ کے ساتھ (پرانا)',en:'weighted (classic)',roman:'weighted (classic)'})+'</option></select></label>'
        +'<label title="'+repLangText({ur:'نتائج کی ترتیب کا طریقہ',en:'Ranking method',roman:'Tarteeb ka tareeqa'})+'">🧮 '+repLangText({ur:'طریقہ',en:'Method',roman:'Method'})+' <select onchange="repAnaSetOpt(\'method\',this.value)">'
        +'<option value="hs"'+(repAnaOpts.method==='hs'?' selected':'')+'>'+repLangText({ur:'Sum of Symptoms (کوریج پہلے)',en:'Sum of Symptoms (coverage first)',roman:'Sum of Symptoms'})+'</option>'
        +'<option value="kent"'+(repAnaOpts.method==='kent'?' selected':'')+'>'+repLangText({ur:'Kent — Sum of Degrees (گریڈز کا مجموعہ پہلے)',en:'Kent — Sum of Degrees first',roman:'Kent — Sum of Degrees'})+'</option>'
        +'<option value="boen"'+(repAnaOpts.method==='boen'?' selected':'')+'>'+repLangText({ur:'Boenninghausen + Polarity',en:'Boenninghausen + Polarity',roman:'Boenninghausen + Polarity'})+'</option></select></label>'
        +hint+'</div>';
}
// 🔑 v71: ایلی منیشن فلٹر (مشترکہ) — items = ایلی منیشن کلپ بورڈ کے ربرکس؛ رول 'every' = انٹرسیکشن، 'any' = یونین
function repElimKeepSet(items,all){
    var keep={}, first=true;
    items.forEach(function(it){
        if(typeof it.w==='number'&&it.w<0) return;               // منفی (-1x) ربرک شرط نہیں بنتا
        var rems=repClipItemRemedies(it,all)||{};
        if(repAnaOpts.elim==='every'){
            if(first){ Object.keys(rems).forEach(function(a){keep[a]=1;}); first=false; }
            else Object.keys(keep).forEach(function(a){ if(!rems[a])delete keep[a]; });
        } else Object.keys(rems).forEach(function(a){keep[a]=1;});
    });
    return keep;
}
function _repAnaCompute(items,all,ci){
    // 🔑 v38 weighted scoring: item.w = 0.5x | 1x | 2x | 4x | -1x (negative = subtract / eliminate)
    var rows=[],col={},denom=0;
    items.forEach(function(it){
        var w=(typeof it.w==='number')?it.w:1;
        var rems=repClipItemRemedies(it,all)||{};
        rows.push({it:it,rems:rems,w:w});
        if(w>0)denom+=_repCovUnit(w);
        _repAnaAccum(col,rems,w);
    });
    if(denom<=0)denom=1;
    var elimNotes=[];
    if(typeof ci==='number'&&repClipElims[ci]&&items.length){
        var keep=repElimKeepSet(items,all), removed=0;
        Object.keys(col).forEach(function(a){ if(!keep[a]){ removed++; delete col[a]; } });
        elimNotes.push({clip:ci,removed:removed});
    }
    return repAnaApplyMethod({rows:rows,col:col,abbrs:Object.keys(col),denom:denom,elimNotes:elimNotes},all);
}
// 🔑 v70: تجزیے کا طریقہ — Kent / Boenninghausen (پولیریٹی) + ترتیب
function repOppositePath(path){
    var p=String(path||''), pairs=[['agg.','amel.'],['aggravation','amelioration'],['worse','better']], out=null;
    pairs.forEach(function(pr){ if(out)return;
        var lo=p.toLowerCase(), i=lo.indexOf(pr[0]), j=lo.indexOf(pr[1]);
        if(i!==-1) out=p.substring(0,i)+pr[1]+p.substring(i+pr[0].length);
        else if(j!==-1) out=p.substring(0,j)+pr[0]+p.substring(j+pr[1].length);
    });
    return out;
}
var _repPathIdx={};
function repFindRubricByPath(all,book,ch,path){
    var sd=all?all[book]:null; if(!sd||!path)return null;
    var ck=sd[ch]?ch:normalizeChapterKey(book,ch), chd=sd[ck]; if(!chd)return null;
    var key=book+'|'+ck, idx=_repPathIdx[key];
    if(!idx){ idx={}; Object.keys(chd).forEach(function(rid){ var r=chd[rid]; if(!r)return; var t=r.t||r.path; if(t)idx[repNormRubText(t)]=r; }); _repPathIdx[key]=idx; }
    return idx[repNormRubText(path)]||null;
}
function repNormRubText(t){ return String(t||'').toLowerCase().replace(/\s*[,>›]\s*/g,', ').replace(/\s+/g,' ').trim(); }
// ربرک کا اصل متن (ڈیٹا کا t) — کلپ بورڈ کا path کبھی باب کے نام سمیت ہوتا ہے
function repRubTextOf(all,it){
    var sd=all?all[it.book]:null, chd=sd?(sd[it.ch]||sd[normalizeChapterKey(it.book,it.ch)]):null, r=chd?chd[String(it.rid)]:null;
    return (r&&(r.t||r.path))||it.path||'';
}
function repAnaApplyMethod(res,all){
    var m=repAnaOpts.method||'hs', col=res.col;
    res.method=m; res.pol=null; res.polPairs=0;
    if(m==='boen'){
        var pol={}, contra={};
        res.rows.forEach(function(r){
            var it=r.it; if(!it||it.combined||!(r.w>0))return;
            var txt=repRubTextOf(all,it), op=repOppositePath(txt); if(!op)return;
            var orub=repFindRubricByPath(all,it.book,it.ch,op);
            // کینٹ میں اکثر «agg.» لکھا ہی نہیں ہوتا: "X amel." کا مخالف سادہ "X" ہے
            if(!orub&&/\bamel(\.|ioration)?\s*$/i.test(txt)) orub=repFindRubricByPath(all,it.book,it.ch,txt.replace(/[,\s]*\bamel(\.|ioration)?\s*$/i,''));
            if(!orub||!orub.r)return;
            r.opp={path:orub.t||orub.path,rems:orub.r}; res.polPairs++;
            Object.keys(col).forEach(function(a){
                var g=r.rems[a]||0, og=orub.r[a]||0; if(!g&&!og)return;
                pol[a]=(pol[a]||0)+(g-og);
                if(g&&og>g) contra[a]=1;         // مخالف ربرک میں زیادہ گریڈ = کانٹرا انڈیکیشن
            });
        });
        res.pol=pol; res.contra=contra;
    }
    res.abbrs=Object.keys(col).sort(function(a,b){
        var A=col[a],B=col[b],d;
        if(m==='kent'){ d=B.total-A.total; if(d)return d; d=B.cov-A.cov; if(d)return d; }
        else if(m==='boen'){
            var ca=res.contra&&res.contra[a]?1:0, cb=res.contra&&res.contra[b]?1:0; d=ca-cb; if(d)return d;
            d=B.cov-A.cov; if(d)return d;
            d=(B.total+((res.pol&&res.pol[b])||0))-(A.total+((res.pol&&res.pol[a])||0)); if(d)return d;
        } else { d=B.cov-A.cov; if(d)return d; d=B.total-A.total; if(d)return d; }
        return a.localeCompare(b);
    });
    window._repAnaLast=res;
    return res;
}
function repAnaMethodLabel(m){ return m==='kent'?'Kent — Sum of Degrees':(m==='boen'?'Boenninghausen + Polarity':'Sum of Symptoms'); }
// 🔑 v70: پرنٹ / CSV ایکسپورٹ
function repAnaExportBtnsHtml(){
    return '<button class="rc-btn" onclick="repAnaPrint()">🖨 '+repLangText({ur:'پرنٹ / PDF',en:'Print / PDF',roman:'Print / PDF'})+'</button>'
        +'<button class="rc-btn" onclick="repAnaCsv()">📥 CSV (Excel)</button>';
}
function _repAnaTable(res,maxCols){
    var abbrs=res.abbrs.slice(0,maxCols||res.abbrs.length);
    var head=['Rubric','Weight'].concat(abbrs), rows=[];
    res.rows.forEach(function(r){ rows.push([String(r.it.book||'')+': '+String(r.it.path||''),(r.w||1)+'x'].concat(abbrs.map(function(a){ return r.rems[a]||''; }))); });
    rows.push(['Coverage',''].concat(abbrs.map(function(a){ return repFmtCov(res.col[a].cov,res.denom); })));
    rows.push(['Score (grade x weight)',''].concat(abbrs.map(function(a){ return repFmtScore(res.col[a].total); })));
    if(res.pol) rows.push(['Polarity',''].concat(abbrs.map(function(a){ return (res.contra&&res.contra[a]?'CI ':'')+(res.pol[a]||0); })));
    return {head:head,rows:rows};
}
function repAnaCsv(){
    var res=window._repAnaLast; if(!res){ showToast('—'); return; }
    var t=_repAnaTable(res), esc=function(v){ v=String(v==null?'':v); return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
    var csv='\ufeff'+['Method: '+repAnaMethodLabel(res.method)].concat([t.head].concat(t.rows).map(function(r){ return r.map(esc).join(','); })).join('\r\n');
    var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    a.download='repertorisation_'+new Date().toISOString().slice(0,10)+'.csv'; document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },500);
}
function repAnaPrint(){
    var res=window._repAnaLast; if(!res){ showToast('—'); return; }
    var t=_repAnaTable(res,30), e=escapeHtml;
    var html='<!doctype html><html><head><meta charset="utf-8"><title>Repertorisation</title><style>body{font-family:Arial,sans-serif;font-size:11px;margin:12px}h2{margin:0 0 4px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:2px 4px;text-align:center}td:first-child{text-align:left;max-width:320px}th{background:#eee}tr.t td{font-weight:bold;background:#f6f6f6}@page{size:landscape;margin:10mm}</style></head><body>'
        +'<h2>Bismillah Clinic — Repertorisation</h2><div>'+e(new Date().toLocaleString())+' · Method: '+e(repAnaMethodLabel(res.method))+' · Rubrics: '+res.rows.length+'</div><br><table><thead><tr>'
        +t.head.map(function(h){return '<th>'+e(String(h))+'</th>';}).join('')+'</tr></thead><tbody>'
        +t.rows.map(function(r,i){ return '<tr'+(i>=res.rows.length?' class="t"':'')+'>'+r.map(function(c){return '<td>'+e(String(c))+'</td>';}).join('')+'</tr>'; }).join('')
        +'</tbody></table><script>window.onload=function(){window.print();}<\/script></body></html>';
    var w=window.open('','_blank');
    if(!w){ showToast(repLangText({ur:'پاپ اپ بلاک ہے — براؤزر میں اجازت دیں',en:'Popup blocked — allow popups',roman:'Popup block hai'})); return; }
    w.document.open(); w.document.write(html); w.document.close();
}
// 🔑 weighted coverage display: integer cov shows "cov/denom", fractional shows "%"
function repFmtCov(cov,denom){
    cov=Math.max(0,cov); denom=denom||1;
    if(Math.abs(cov-Math.round(cov))<0.001 && cov<=denom+0.001){ return Math.round(cov)+'/'+Math.round(denom); }
    return Math.round(cov*100/denom)+'%';
}

// ==================== ⚙ CLIPBOARD WORKBENCH (HomeoSetu "Case Repertorisation" style) ====================
// image 2026-09-19_01-17-32: tabs Clipboards|Grid، ہر کلپ بورڈ پر Elimination Mode + ✏ rename،
// ہر ربرک پر ☑ + ⋮ مینو (Order / Multiplier Weight / Move to Clipboard / Delete Rubric)، نیچے اسٹیٹس بار
var repWbTab='clips';   // 'clips' | 'grid'
function repOpenWorkbench(tab){
    repKebabHide(); repWbMenuHide();
    repHistBack.push(repCurrentState()); repHistFwd=[];
    repWorkbenchOpen=true; repCompareOpen=false; repAnalysisOpen=-1; repCurrentDetail=null; repClipViewOpen=false;
    repWbTab=(tab==='grid')?'grid':'clips';
    renderWorkbench();
}
function repClipLabel(ci){
    var custom=repClipNames[ci];
    if(custom) return custom;
    return repLangText({ur:'کلپ بورڈ',en:'Clipboard',roman:'Clipboard'})+' '+(ci+1);
}
function repWChip(w){
    if(w==null||w===1) return '';
    var cls=w<0?'w-neg':(w<1?'w-half':(w>=4?'w-max':'w-plus'));
    var label=(w<0?'-':'')+w+'x';
    return '<span class="w-chip '+cls+'" title="'+repLangText({ur:'ملٹی پلائر ویٹ',en:'Multiplier weight',roman:'Multiplier weight'})+': '+label+'">'+label+'</span>';
}
function repClipMove(ci,idx,dir){
    var l=repClipboards[ci]||[];
    var j=idx+dir;
    if(idx<0||idx>=l.length||j<0||j>=l.length)return;
    var t=l[idx]; l[idx]=l[j]; l[j]=t;
    repClipsSave();
    if(repWorkbenchOpen)renderWorkbench(); else if(repClipViewOpen&&ci===repActiveClip)renderClipView(); else repRenderDock();
}
function repClipRemoveAt(ci,idx){
    var l=repClipboards[ci]||[];
    if(idx<0||idx>=l.length)return;
    l.splice(idx,1); repClipsSave();
    if(repWorkbenchOpen)renderWorkbench();
    else if(repClipViewOpen&&ci===repActiveClip)renderClipView();
    else repRenderDock();
    repUpdateSelCount();
}
function repClipOpenIdx(ci,i){
    var it=(repClipboards[ci]||[])[i]; if(!it)return;
    repWorkbenchOpen=false; repCompareOpen=false; repAnalysisOpen=-1;
    repActiveClip=ci;
    repClipGoto(it.book,it.ch,it.rid);
}
function repSetClipActive(ci){
    repActiveClip=ci; repRenderDock();
    if(repWorkbenchOpen)renderWorkbench();
    showToast(repLangText({ur:'🎯 '+repClipLabel(ci)+' فعال',en:'🎯 '+repClipLabel(ci)+' is now active',roman:'🎯 '+repClipLabel(ci)+' faal'}));
}
var _repWbArm=-1;
function repWorkbenchClear(ci){
    if(_repWbArm!==ci){ _repWbArm=ci; showToast(repLangText({ur:'دوبارہ دبائیں — '+repClipLabel(ci)+' خالی ہوگا',en:'Press again — '+repClipLabel(ci)+' will be cleared',roman:'Dobara dabaein — '+repClipLabel(ci)+' khali hoga'})); return; }
    _repWbArm=-1;
    repClipboards[ci]=[]; repClipsSave();
    if(repWorkbenchOpen)renderWorkbench(); else repRenderDock();
    repUpdateSelCount();
}
// 🔑 workbench 3-dots menu actions
function repClipSetWeight(ci,i,w){
    var it=(repClipboards[ci]||[])[i]; if(!it)return;
    it.w=w; repClipsSave();
    showToast(repLangText({ur:'⚖ ویٹ '+w+'x — '+repClipLabel(ci),en:'⚖ Weight '+w+'x — '+repClipLabel(ci),roman:'⚖ Weight '+w+'x — '+repClipLabel(ci)}));
    if(repWorkbenchOpen)renderWorkbench(); else repRenderDock();
}
function repClipMoveTo(ci,i,target){
    if(target===ci)return;
    var l=repClipboards[ci]||[]; var it=l[i]; if(!it)return;
    l.splice(i,1); it.sel=false;
    (repClipboards[target]=repClipboards[target]||[]).push(it);
    repClipsSave();
    showToast('📋 '+repClipLabel(ci)+' → '+repClipLabel(target));
    if(repWorkbenchOpen)renderWorkbench(); else repRenderDock();
}
function repClipDelete(ci,i){ repClipRemoveAt(ci,i); }
// ==================== ⊕ COMBINE / ⧉ MERGE (HomeoSetu کلون) ====================
// ☑ منتخب ربرکس → ایک مشترکہ ربرک: ادویہ کا یونین، ایک دوا کئی ربرکس میں ہو تو سب سے زیادہ گریڈ رکھا جاتا ہے۔
// مشترکہ آئٹم اپنی ادویہ (remsObj) اور اصل ربرکس (sources) ساتھ رکھتا ہے — ⊖ سے دوبارہ الگ ہو سکتا ہے۔
function repClipSelIdx(ci){ var out=[]; (repClipboards[ci]||[]).forEach(function(it,i){ if(it.sel)out.push(i); }); return out; }
function _repRemsUnion(items,all){
    var u={};
    items.forEach(function(it){ var rems=repClipItemRemedies(it,all)||{}; Object.keys(rems).forEach(function(a){ var g=rems[a]||1; g=g>=3?3:(g===2?2:1); if(!u[a]||u[a]<g)u[a]=g; }); });
    return u;
}
function repCombDesc(it){ var s=(it.sources||[]).map(function(x){ return (REP_BOOK_INFO[x.book]?REP_BOOK_INFO[x.book].abbr+': ':'')+(x.path||''); }); return repLangText({ur:'مشترکہ ربرک — ',en:'Combined rubric — ',roman:'Combined rubric — '})+s.join(' | '); }
function repCombBadge(it){ return it&&it.combined?'<span class="wb-comb-badge" title="'+_repAttr(repCombDesc(it))+'">⊕ '+((it.sources||[]).length)+'</span>':''; }
function repClipCombine(ci,autoName){
    var idx=repClipSelIdx(ci);
    if(idx.length<2){ showToast(repLangText({ur:'☑ پہلے اس کلپ بورڈ میں کم از کم 2 ربرکس منتخب کریں',en:'☑ Select at least 2 rubrics in this clipboard first',roman:'Pehle is clipboard mein kam az kam 2 rubrics select karein'})); return; }
    var name=autoName;
    if(!name){
        var def=repLangText({ur:'مشترکہ ربرک',en:'Combined Rubric',roman:'Combined Rubric'});
        name=prompt(repLangText({ur:'مشترکہ ربرک کا نام:',en:'Name for the combined rubric:',roman:'Combined rubric ka naam:'}),def);
        if(name===null) return;
        name=String(name).trim()||def;
    }
    repEnsureAllBooks(function(all){
        var l=repClipboards[ci]||[]; var items=idx.map(function(i){ return l[i]; }).filter(Boolean);
        if(items.length<2) return;
        var u=_repRemsUnion(items,all);
        var comb={book:items[0].book,ch:items[0].ch,rid:'combined_'+Date.now()+'_'+Math.floor(Math.random()*1e6),path:name,rems:Object.keys(u).length,ts:Date.now(),w:1,sel:false,combined:true,remsObj:u,
            sources:items.map(function(it){ var c=JSON.parse(JSON.stringify(it)); c.sel=false; return c; })};
        var rest=[]; l.forEach(function(it,i){ if(idx.indexOf(i)===-1)rest.push(it); });
        rest.splice(Math.min(idx[0],rest.length),0,comb);
        repClipboards[ci]=rest; repClipsSave();
        showToast('⊕ '+items.length+' '+repLangText({ur:'ربرکس → «'+name+'» ('+comb.rems+' ادویات)',en:'rubrics → "'+name+'" ('+comb.rems+' remedies)',roman:'rubrics → "'+name+'" ('+comb.rems+' remedies)'}));
        if(repWorkbenchOpen)renderWorkbench(); else if(repClipViewOpen)renderClipView(); else repRenderDock();
        repUpdateSelCount(); repCmpPanelRender();
    });
}
function repClipMerge(ci){
    var idx=repClipSelIdx(ci);
    if(idx.length!==2){ showToast(repLangText({ur:'⧉ مرج کے لیے بالکل 2 ربرکس منتخب کریں',en:'⧉ Select exactly 2 rubrics to merge',roman:'Merge ke liye bilkul 2 rubrics select karein'})); return; }
    var l=repClipboards[ci]||[];
    repClipCombine(ci,_repTruncPath(l[idx[0]].path||'',60)+' + '+_repTruncPath(l[idx[1]].path||'',60));
}
function repClipUncombine(ci,i){
    var l=repClipboards[ci]||[]; var it=l[i]; if(!it||!it.combined||!it.sources||!it.sources.length)return;
    var src=it.sources.map(function(x){ var c=JSON.parse(JSON.stringify(x)); c.sel=false; if(typeof c.w!=='number')c.w=1; return c; });
    Array.prototype.splice.apply(l,[i,1].concat(src));
    repClipsSave();
    showToast('⊖ '+repLangText({ur:src.length+' اصل ربرکس واپس آ گئے',en:src.length+' original rubrics restored',roman:src.length+' asal rubrics wapas aa gaye'}));
    if(repWorkbenchOpen)renderWorkbench(); else if(repClipViewOpen)renderClipView(); else repRenderDock();
    repUpdateSelCount(); repCmpPanelRender();
}
function repClipFindByRid(rid){ for(var ci=0;ci<REP_N_CLIPS;ci++){ var l=repClipboards[ci]||[]; for(var i=0;i<l.length;i++){ if(String(l[i].rid)===String(rid))return l[i]; } } return null; }
// کلپ بورڈ آئٹم کھولنا — مشترکہ ربرک ہو تو اس کا پہلا اصل ربرک کھلتا ہے
function repClipGoto(book,ch,rid){
    if(String(rid).indexOf('combined_')===0){
        var it=repClipFindByRid(rid);
        if(it&&it.sources&&it.sources.length){ var s0=it.sources[0]; showToast('⊕ '+repLangText({ur:'مشترکہ ربرک — پہلا اصل ربرک کھول رہا ہوں',en:'Combined rubric — opening its first source',roman:'Combined rubric — pehla asal rubric khol raha hoon'})); repClipGoto(s0.book,s0.ch,s0.rid); }
        return;
    }
    navigateToRubric(book,ch,rid,true);
}
function repClipSelToggle(ci,i){
    var it=(repClipboards[ci]||[])[i]; if(!it)return;
    it.sel=!it.sel; repClipsSave();
    if(repWorkbenchOpen){
        var box=document.querySelector('[data-wbsel="'+ci+'-'+i+'"]');
        if(box)box.classList.toggle('sel',!!it.sel);
        var cb=document.querySelector('[data-wbchk="'+ci+'-'+i+'"]'); if(cb)cb.checked=!!it.sel;
        repWbUpdateCounts();
    }
    repUpdateSelCount();
}
function repClipElimToggle(ci,on){
    repClipElims[ci]=!!on; repClipOptsSave();
    showToast(repLangText(
        on? {ur:'🚫 '+repClipLabel(ci)+' — ایلی منیشن موڈ آن (گرڈ میں اس کے بغیر ادویات ہٹ جائیں گی)',en:'🚫 '+repClipLabel(ci)+' — Elimination Mode ON (grid keeps only remedies covered by it)',roman:'🚫 Elimination Mode ON — '+repClipLabel(ci)}
          : {ur:'✅ '+repClipLabel(ci)+' — ایلی منیشن موڈ آف',en:'✅ '+repClipLabel(ci)+' — Elimination Mode OFF',roman:'✅ Elimination Mode OFF — '+repClipLabel(ci)}));
    if(repWorkbenchOpen)renderWorkbench(); else if(repAnalysisOpen>=0)renderAnalysis();
}
function repClipRename(ci){
    var cur=repClipNames[ci]||('Clipboard '+(ci+1));
    var n=prompt(repLangText({ur:'کلپ بورڈ کا نام:',en:'Clipboard name:',roman:'Clipboard ka naam:'}),cur);
    if(n===null)return;
    repClipNames[ci]=String(n).trim().substring(0,30); repClipOptsSave();
    if(repWorkbenchOpen)renderWorkbench(); else repRenderDock();
}
function repWbSetTab(t){ repWbTab=(t==='grid')?'grid':'clips'; renderWorkbench(); }
// 🔑 selection helpers + status bar counts
function repWbSelCount(){ var n=0; for(var i=0;i<REP_N_CLIPS;i++)(repClipboards[i]||[]).forEach(function(it){ if(it.sel)n++; }); return n; }
function repWbIncludedItems(){
    var any=repWbSelCount()>0,out=[];
    for(var ci=0;ci<REP_N_CLIPS;ci++)(repClipboards[ci]||[]).forEach(function(it){ if(!any||it.sel)out.push({it:it,ci:ci}); });
    return out;
}
function repWbUpdateCounts(){
    var sel=document.getElementById('repWbSelN'), rem=document.getElementById('repWbRemN'), gc=document.getElementById('repWbGridN');
    if(sel)sel.textContent=String(repWbSelCount());
    if(!rem&&!gc)return;
    repEnsureAllBooks(function(all){
        var set={};
        repWbIncludedItems().forEach(function(r){ var rems=repClipItemRemedies(r.it,all)||{}; Object.keys(rems).forEach(function(a){set[a]=1;}); });
        var n=Object.keys(set).length;
        if(rem)rem.textContent=n.toLocaleString();
        if(gc)gc.textContent='('+n.toLocaleString()+')';
    });
}
// 🔑 3-dots options menu (image 2: OPTIONS / Order / Multiplier Weight / Move to Clipboard / Delete Rubric)
function repWbMenuHide(){ var m=document.getElementById('repWbMenu'); if(m)m.style.display='none'; }
function repWbMenuShow(ev,btn,ci,i){
    ev.stopPropagation(); repWbMenuHide(); repKebabHide();
    var m=document.getElementById('repWbMenu');
    if(!m){ m=document.createElement('div'); m.id='repWbMenu'; m.className='rep-wb-menu'; document.body.appendChild(m); }
    m.innerHTML=repWbMenuHtml(ci,i);
    m.style.display='block';
    var r=btn.getBoundingClientRect();
    var mw=m.offsetWidth||230, mh=m.offsetHeight||300;
    var vw=(document.documentElement&&document.documentElement.clientWidth)||window.innerWidth||1024;
    var top=r.bottom+window.scrollY+4;
    // 🔑 flip above when the menu would be cut off by the viewport bottom
    if(r.bottom+mh+10>window.innerHeight && r.top-mh-4>0){ top=r.top+window.scrollY-mh-4; }
    var left=Math.max(8,r.right+window.scrollX-mw);
    if(left+mw>window.scrollX+vw-8){ left=window.scrollX+vw-mw-8; }
    m.style.top=top+'px'; m.style.left=left+'px';
}
function repWbMenuHtml(ci,i){
    var it=(repClipboards[ci]||[])[i]; if(!it)return '';
    var w=(typeof it.w==='number')?it.w:1;
    var h='<div class="wbm-head">'+repLangText({ur:'اختیارات',en:'OPTIONS',roman:'OPTIONS'})+'</div>';
    h+='<div class="wbm-label">'+repLangText({ur:'ترتیب',en:'Order',roman:'Order'})+'</div>';
    h+='<button onclick="repWbMenuHide();repClipMove('+ci+','+i+',-1)">↑ '+repLangText({ur:'اوپر لے جائیں',en:'Move Up',roman:'Move Up'})+'</button>';
    h+='<button onclick="repWbMenuHide();repClipMove('+ci+','+i+',1)">↓ '+repLangText({ur:'نیچے لے جائیں',en:'Move Down',roman:'Move Down'})+'</button>';
    h+='<div class="wbm-label">'+repLangText({ur:'ملٹی پلائر ویٹ',en:'Multiplier Weight',roman:'Multiplier Weight'})+'</div>';
    [[0.5,'0.5x'],[1,'1x'],[2,'2x'],[4,'4x'],[-1,'-1x']].forEach(function(p){
        h+='<button class="wbm-w'+(w===p[0]?' on':'')+'" onclick="repWbMenuHide();repClipSetWeight('+ci+','+i+','+p[0]+')">'+p[1]+(w===p[0]?' ✓':'')+(p[0]===-1?' 🚫':'')+'</button>';
    });
    h+='<div class="wbm-label">'+repLangText({ur:'کلپ بورڈ میں منتقل کریں',en:'Move to Clipboard',roman:'Move to Clipboard'})+'</div>';
    for(var t=0;t<REP_N_CLIPS;t++){ if(t===ci)continue; h+='<button onclick="repWbMenuHide();repClipMoveTo('+ci+','+i+','+t+')">📋 '+escapeHtml(repClipLabel(t))+'</button>'; }
    if(it.combined&&it.sources&&it.sources.length) h+='<button onclick="repWbMenuHide();repClipUncombine('+ci+','+i+')">⊖ '+repLangText({ur:'الگ کریں — اصل '+it.sources.length+' ربرکس واپس',en:'Uncombine — restore '+it.sources.length+' original rubrics',roman:'Alag karein — asal '+it.sources.length+' rubrics wapas'})+'</button>';
    h+='<button class="danger" onclick="repWbMenuHide();repClipDelete('+ci+','+i+')">🗑 '+repLangText({ur:'ربرک ڈیلیٹ کریں',en:'Delete Rubric',roman:'Delete Rubric'})+'</button>';
    return h;
}
function renderWorkbench(){
    var cd=document.getElementById('repRubricContent'); if(!cd)return;
    repUpdateNavButtons(); repRenderBreadcrumb();
    var h='<div class="rep-tool-head"><div class="rep-content-title"><span>⚙</span><b>'+repLangText({ur:'کیس ریپرٹورائزیشن — ورک بینچ',en:'CASE REPERTORISATION — WORKBENCH',roman:'CASE REPERTORISATION — WORKBENCH'})+'</b></div>'
        +'<div style="display:flex;gap:6px;flex-wrap:wrap;"><button class="rc-btn" onclick="repOpenCompare()" title="'+repLangText({ur:'کلپ بورڈز آمنے سامنے + مشترکہ ادویات (کلاسک موازنہ ویو)',en:'Clipboards side by side + common remedies (classic compare view)',roman:'Clipboards aamne saamne (classic compare)'})+'">⇄ '+repLangText({ur:'کلپ بورڈز کا موازنہ',en:'Compare clipboards',roman:'Clipboards ka moazna'})+'</button>'
        +'<button class="rc-btn" onclick="repCloseToolView()">✕ '+repLangText({ur:'بند کریں',en:'Close',roman:'Band karein'})+'</button></div></div>';
    // tabs: Clipboards | Grid (N remedies) — HomeoSetu style
    h+='<div class="rep-wb-tabs">'
        +'<button class="'+(repWbTab!=='grid'?'on':'')+'" onclick="repWbSetTab(\'clips\')">📋 '+repLangText({ur:'کلپ بورڈز',en:'Clipboards',roman:'Clipboards'})+'</button>'
        +'<button class="'+(repWbTab==='grid'?'on':'')+'" onclick="repWbSetTab(\'grid\')">📊 '+repLangText({ur:'گرڈ',en:'Grid',roman:'Grid'})+' <span id="repWbGridN" class="cnt">…</span></button>'
        +'</div>';
    h+=repAnaRulesHtml();
    h+='<div id="repWbBody"></div>';
    // bottom status bar (image 2: Active Clipboard | Rubrics Selected • Remedies found)
    h+='<div class="rep-wb-status">'
        +'<span>'+repLangText({ur:'فعال کلپ بورڈ:',en:'Active Clipboard:',roman:'Active Clipboard:'})+' <b class="on">'+escapeHtml(repClipLabel(repActiveClip))+'</b></span>'
        +'<span class="sp">•</span><span>'+repLangText({ur:'منتخب ربرکس:',en:'Rubrics Selected:',roman:'Rubrics Selected:'})+' <b id="repWbSelN">'+repWbSelCount()+'</b></span>'
        +'<span class="sp">•</span><span>'+repLangText({ur:'ملی ادویات:',en:'Remedies found:',roman:'Remedies found:'})+' <b id="repWbRemN">…</b></span>'
        +'</div>';
    cd.innerHTML=h; cd.scrollTop=0;
    if(repWbTab==='grid') renderWbGrid(); else renderWbClips();
    repRenderDock();
    repWbUpdateCounts();
}
function renderWbClips(){
    var body=document.getElementById('repWbBody'); if(!body)return;
    var h='<p class="rep-tool-sub">'+repLangText({ur:'بارہ کلپ بورڈز ایک جگہ — ہر ربرک پر ⋮ مینو (ترتیب، ویٹ، منتقلی، ڈیلیٹ)۔ ☑ لگا کر ⊕ کمبائن / ⧉ مرج (ادویہ کا یونین، زیادہ گریڈ)۔ ایلی منیشن موڈ والے کلپ بورڈ کی شرط پوری نہ کرنے والی ادویات گرڈ سے ہٹ جاتی ہیں۔',en:'All 12 clipboards in one place — every rubric has a ⋮ menu (order, weight, move, delete). Tick ☑ then ⊕ Combine / ⧉ Merge (union of remedies, higher grade). Remedies failing an Elimination-Mode clipboard are removed from the Grid.',roman:'Barah clipboards aik jagah — ⋮ menu; ☑ laga kar ⊕ Combine / ⧉ Merge.'})+'</p>';
    h+='<div class="rep-wb-grid">';
    for(var ci=0;ci<REP_N_CLIPS;ci++){
        var l=repClipboards[ci]||[], nsel=repClipSelIdx(ci).length;
        h+='<div class="rep-wb-panel'+(repActiveClip===ci?' active':'')+(repClipElims[ci]?' elim':'')+'">';
        h+='<div class="rep-wb-head"><button class="rep-wb-title" onclick="repToggleClipView('+ci+')" title="'+repLangText({ur:'لسٹ ویو میں کھولیں',en:'Open in list view',roman:'List view mein kholen'})+'">📋 '+escapeHtml(repClipLabel(ci))+' <span class="cnt">('+l.length+')</span></button>'
            +'<div class="rep-wb-actions">'
            +'<button class="rc-btn" onclick="repClipRename('+ci+')" title="'+repLangText({ur:'نام بدلیں',en:'Rename',roman:'Rename'})+'">✏</button>'
            +'<button class="rc-btn" onclick="repSetClipActive('+ci+')" title="'+repLangText({ur:'فعال بنائیں',en:'Make active',roman:'Faal banayein'})+'">🎯</button>'
            +'<button class="rc-btn" onclick="repOpenAnalysis('+ci+')" title="'+repLangText({ur:'اس کلپ بورڈ کا گرڈ',en:'This clipboard\'s grid',roman:'Is clipboard ka grid'})+'">📊</button>'
            +'<button class="rc-btn danger" onclick="repWorkbenchClear('+ci+')" title="'+repLangText({ur:'خالی کریں (دو بار دبائیں)',en:'Clear (press twice)',roman:'Khali karein (do bar dabaein)'})+'">🗑</button>'
            +'</div></div>';
        // ⊕ کمبائن / ⧉ مرج (HomeoSetu): اس کلپ بورڈ کے ☑ منتخب ربرکس پر
        h+='<div class="rep-wb-combrow">'
            +'<button class="rc-btn'+(nsel>=2?'':' dis')+'" onclick="repClipCombine('+ci+')" title="'+repLangText({ur:'☑ منتخب ربرکس کو ایک مشترکہ ربرک بنائیں — ادویہ کا یونین، ایک دوا کئی میں ہو تو زیادہ گریڈ',en:'Combine the ☑ selected rubrics into one — union of remedies, higher grade kept',roman:'Selected rubrics ko aik mushtarka rubric banayein (union, higher grade)'})+'">⊕ '+repLangText({ur:'کمبائن',en:'Combine',roman:'Combine'})+' ('+nsel+')</button>'
            +'<button class="rc-btn'+(nsel===2?'':' dis')+'" onclick="repClipMerge('+ci+')" title="'+repLangText({ur:'بالکل 2 منتخب ربرکس → ایک (نام: پہلا + دوسرا)',en:'Exactly 2 selected rubrics → one (name: first + second)',roman:'Bilkul 2 selected → aik (A + B)'})+'">⧉ '+repLangText({ur:'مرج 2→1',en:'Merge 2→1',roman:'Merge 2→1'})+'</button>'
            +'</div>';
        h+='<label class="rep-wb-elim" title="'+_repAttr(repElimRuleDesc())+'">'
            +'<input type="checkbox" '+(repClipElims[ci]?'checked':'')+' onchange="repClipElimToggle('+ci+',this.checked)"> '
            +repLangText({ur:'ایلی منیشن موڈ',en:'Elimination Mode',roman:'Elimination Mode'})+'</label>';
        if(!l.length){
            h+='<div class="rep-wb-empty">'+repLangText({ur:'خالی — کسی ربرک کارڈ کے ⋮ مینو سے شامل کریں',en:'Empty — use the ⋮ menu on any rubric card',roman:'Khali — kisi rubric card ke ⋮ menu se shamil karein'})+'</div>';
        } else {
            l.forEach(function(it,i){
                h+='<div class="rep-wb-item'+(it.sel?' sel':'')+'" data-wbsel="'+ci+'-'+i+'">'
                    +'<input type="checkbox" class="rep-wb-check" data-wbchk="'+ci+'-'+i+'" '+(it.sel?'checked':'')+' onchange="repClipSelToggle('+ci+','+i+')" title="'+repLangText({ur:'گرڈ کے لیے منتخب کریں',en:'Select for the Grid',roman:'Grid ke liye select karein'})+'">'
                    +repBookBadgeHtml(it.book)
                    +'<span class="rc-path" dir="ltr" onclick="repClipOpenIdx('+ci+','+i+')" title="'+_repAttr(it.path||'')+'">'+escapeHtml(_repTruncPath(it.path||'—',48))+'</span>'
                    +repCombBadge(it)+repWChip(it.w)
                    +(it.rems?'<span class="rpc-badge rems">⚡ '+it.rems+'</span>':'')
                    +'<span class="rep-wb-ops">'
                    +'<button class="rwb-btn" onclick="repClipMove('+ci+','+i+',-1)" title="'+repLangText({ur:'اوپر',en:'Move up',roman:'Ooper'})+'">↑</button>'
                    +'<button class="rwb-btn" onclick="repClipMove('+ci+','+i+',1)" title="'+repLangText({ur:'نیچے',en:'Move down',roman:'Neeche'})+'">↓</button>'
                    +'<button class="rwb-btn" onclick="repWbMenuShow(event,this,'+ci+','+i+')" title="'+repLangText({ur:'مزید فنکشنز',en:'More options',roman:'Mazeed functions'})+'">⋮</button>'
                    +'</span></div>';
            });
        }
        h+='</div>';
    }
    h+='</div>';
    body.innerHTML=h;
}
// 🔑 combined Grid tab: selected rubrics of ALL clipboards, weighted, with elimination filtering
function _repWbGridCompute(all){
    var included=repWbIncludedItems();
    var rows=[],col={},denom=0;
    included.forEach(function(r){
        var it=r.it, w=(typeof it.w==='number')?it.w:1;
        var rems=repClipItemRemedies(it,all)||{};
        rows.push({it:it,elim:repClipElims[r.ci],rems:rems,w:w});
        if(w>0)denom+=_repCovUnit(w);
        _repAnaAccum(col,rems,w);
    });
    if(denom<=0)denom=1;
    // Elimination Mode: a clipboard marked as elimination keeps ONLY remedies covered by its rubrics
    var elimNotes=[];
    for(var ci=0;ci<REP_N_CLIPS;ci++){
        if(!repClipElims[ci])continue;
        var items=(repClipboards[ci]||[]).filter(function(it){ return repWbSelCount()===0||it.sel; });
        if(!items.length)continue;
        var keep=repElimKeepSet(items,all);   // 'every' = ہر ربرک میں (انٹرسیکشن) · 'any' = کسی ایک میں (یونین)
        var removed=0;
        Object.keys(col).forEach(function(a){ if(!keep[a]){ removed++; delete col[a]; } });
        if(removed||Object.keys(keep).length) elimNotes.push({clip:ci,removed:removed});
    }
    var abbrs=Object.keys(col).sort(function(a,b){
        var d=col[b].cov-col[a].cov; if(d)return d;
        d=col[b].total-col[a].total; if(d)return d;
        return a.localeCompare(b);
    });
    return repAnaApplyMethod({rows:rows,col:col,abbrs:abbrs,denom:denom,elimNotes:elimNotes},all);
}
function renderWbGrid(){
    var body=document.getElementById('repWbBody'); if(!body)return;
    var total=0; for(var ci=0;ci<REP_N_CLIPS;ci++)total+=(repClipboards[ci]||[]).length;
    if(!total){ body.innerHTML='<div class="rep-tool-loading">'+repLangText({ur:'بارہ کلپ بورڈز خالی ہیں — پہلے ربرکس شامل کریں',en:'All 12 clipboards are empty — add rubrics first',roman:'Barah clipboards khali hain — pehle rubrics shamil karein'})+'</div>'; return; }
    body.innerHTML='<div class="rep-tool-loading">⏳ '+repLangText({ur:'ریپرٹری ڈیٹا لوڈ ہو رہا ہے...',en:'Loading repertory data...',roman:'Repertory data load ho raha hai...'})+'</div>';
    repEnsureAllBooks(function(all){
        var body2=document.getElementById('repWbBody'); if(!body2)return;
        var res=_repWbGridCompute(all);
        if(!res.rows.length){ body2.innerHTML='<div class="rep-tool-loading">'+repLangText({ur:'کوئی ربرک شامل/منتخب نہیں',en:'No rubrics included/selected',roman:'Koi rubric shamil/muntakhib nahi'})+'</div>'; return; }
        if(!res.abbrs.length){ body2.innerHTML='<div class="rep-tool-loading">'+repLangText({ur:'ان ربرکس پر کوئی ادویہ درج نہیں',en:'No remedies recorded on these rubrics',roman:'In rubrics par koi adwiyeh darj nahi'})+'</div>'; return; }
        var COLS=20, abbrs=res.abbrs.slice(0,COLS);
        var winner=abbrs[0], wcol=res.col[winner];
        var pct=Math.max(0,Math.round(wcol.cov*100/res.denom));
        var hh='<div class="rep-ana-sum">'
            +'<span class="rep-ana-winner">🏆 '+repLangText({ur:'سب سے زیادہ کور:',en:'Top coverage:',roman:'Sab se ziyada koor:'})+' <b dir="ltr">'+escapeHtml(winner)+'</b> — '+pct+'% <small>('+repFmtCov(wcol.cov,res.denom)+')</small></span>'
            +res.elimNotes.map(function(n){ return '<span class="rep-ana-elim">🚫 '+escapeHtml(repClipLabel(n.clip))+': -'+n.removed+'</span>'; }).join('')
            +(res.abbrs.length>COLS?'<span class="rep-ana-more">+'+(res.abbrs.length-COLS)+' '+repLangText({ur:'مزید ادویات',en:'more remedies',roman:'mazeed adwiyeh'})+'</span>':'')
            +repAnaDiffBtnsHtml(res.abbrs)+repAnaExportBtnsHtml()
            +'<span class="rep-ana-more">🧮 '+escapeHtml(repAnaMethodLabel(res.method))+(res.method==='boen'?' · '+repLangText({ur:'پولیریٹی جوڑے: ',en:'polarity pairs: ',roman:'polarity pairs: '})+res.polPairs:'')+'</span>'
            +'</div>';
        hh+='<div class="rep-ana-wrap"><table class="rep-ana-table"><thead><tr><th class="ana-rub">'+repLangText({ur:'ربرک',en:'Rubric',roman:'Rubric'})+'</th>';
        abbrs.forEach(function(a){ hh+='<th class="ana-rem'+(a===winner?' win':'')+'" dir="ltr" onclick="copyRemedyToPrescription(\''+escapeHtml(a)+'\')" title="'+escapeHtml(a)+' — '+res.col[a].cov+' / w'+res.col[a].total+'">'+escapeHtml(a.length>10?a.substring(0,9)+'…':a)+'</th>'; });
        hh+='</tr></thead><tbody>';
        res.rows.forEach(function(r){
            var it=r.it;
            hh+='<tr><td class="ana-rub" onclick="repClipGoto(\''+_repJs(it.book)+'\',\''+_repJs(it.ch)+'\',\''+_repJs(String(it.rid))+'\')">'
                +repBookBadgeHtml(it.book)+' <span dir="ltr">'+escapeHtml(_repTruncPath(it.path||'—',44))+'</span>'
                +repWChip(it.w)+(r.elim?'<span class="wb-elim-badge" title="Elimination">🚫</span>':'')+'</td>';
            abbrs.forEach(function(a){
                var g=r.rems[a]||0;
                hh+='<td class="ana-cell">'+(g?'<i class="rep-gr-dot d'+(g>=3?3:(g===2?2:1))+'" title="'+escapeHtml(a)+' = '+g+'"></i>':'')+'</td>';
            });
            hh+='</tr>';
        });
        hh+='</tbody><tfoot><tr><td class="ana-rub">'+repLangText({ur:'کوریج',en:'Coverage',roman:'Koor'})+'</td>';
        abbrs.forEach(function(a){ var e=res.col[a]; hh+='<td class="ana-total'+(a===winner?' win':'')+'">'+repFmtCov(e.cov,res.denom)+'</td>'; });
        hh+='</tr><tr><td class="ana-rub">'+repLangText({ur:'اسکور (گریڈ × ویٹ)',en:'Score (grade × weight)',roman:'Score (grade × weight)'})+'</td>';
        abbrs.forEach(function(a){ var e=res.col[a]; hh+='<td class="ana-total score'+(a===winner?' win':'')+'" title="'+repLangText({ur:'مجموعی اسکور',en:'total score',roman:'total score'})+'">'+repFmtScore(e.total)+'</td>'; });
        if(res.pol){ hh+='</tr><tr><td class="ana-rub" title="'+repLangText({ur:'پولیریٹی = ربرک کا گریڈ منفی مخالف ربرک (agg/amel) کا گریڈ۔ ⚠ = کانٹرا انڈیکیشن',en:'Polarity = grade in rubric minus grade in opposite (agg/amel) rubric. ⚠ = contraindication',roman:'Polarity'})+'">'+repLangText({ur:'پولیریٹی',en:'Polarity',roman:'Polarity'})+'</td>';
            abbrs.forEach(function(a){ var pv=res.pol[a]||0, ci=res.contra&&res.contra[a]; hh+='<td class="ana-total" style="'+(ci?'color:#c0392b;font-weight:bold;':'')+'">'+(ci?'⚠':'')+(pv>0?'+':'')+pv+'</td>'; }); }
        hh+='</tr></tfoot></table></div>';
        hh+='<p class="rep-tool-note">'+repLangText({ur:'گرڈ = بارہ کلپ بورڈز کے منتخب ربرکس (بغیر سلیکشن سب شامل)۔ ویٹ (0.5x–4x) اسکور کو گنا دیتا ہے، ‎-1x منہا ہے۔ ایلی منیشن موڈ والے کلپ بورڈ کے بغیر ادویات نکل جاتی ہیں۔ ڈاٹ = گریڈ، ربرک پر کلک = کھولیں۔',en:'Grid = selected rubrics of ALL clipboards (everything if none selected). Weights (0.5x–4x) multiply the score, -1x subtracts. Remedies not covered by an Elimination-Mode clipboard are removed. Dot = grade, click a rubric to open it.',roman:'Grid = tamam clipboards ke muntakhib rubrics. Weight score ko guna deta hai, -1x manfi hai.'})+'</p>';
        body2.innerHTML=hh;
    });
}

