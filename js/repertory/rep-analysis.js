// Bismillah Clinic — js/repertory/rep-analysis.js — Analysis grid، clipboards compare، Ask AI، sidebar
// (v78: 08-app-repertory.js کو بغیر کسی کوڈ تبدیلی کے حصوں میں بانٹا گیا؛ لوڈ ترتیب index.html میں وہی رکھیں)
// ==================== 📊 CASE ANALYSIS GRID ====================
function repOpenAnalysis(ci){
    var c=(typeof ci==='number')?ci:repActiveClip;
    var l=repClipboards[c]||[];
    if(!l.length){ showToast(repLangText({ur:'کلپ بورڈ '+(c+1)+' خالی ہے — پہلے ⋮ مینو سے ربرکس شامل کریں',en:'Clipboard '+(c+1)+' is empty — add rubrics via the ⋮ menu first',roman:'Clipboard '+(c+1)+' khali hai — pehle ⋮ menu se rubrics shamil karein'})); return; }
    repKebabHide();
    repHistBack.push(repCurrentState()); repHistFwd=[];
    repAnalysisOpen=c; repWorkbenchOpen=false; repCompareOpen=false; repCurrentDetail=null; repClipViewOpen=false;
    repActiveClip=c;
    renderAnalysis();
}
function renderAnalysis(){
    var cd=document.getElementById('repRubricContent'); if(!cd)return;
    repUpdateNavButtons(); repRenderBreadcrumb();
    var c=repAnalysisOpen, l=repClipboards[c]||[];
    var h='<div class="rep-tool-head"><div class="rep-content-title"><span>📊</span><b>'+repLangText({ur:'کیس اینالیسس گرڈ',en:'CASE ANALYSIS GRID',roman:'CASE ANALYSIS GRID'})+'</b><span class="cnt">'+repLangText({ur:'کلپ بورڈ',en:'Clipboard',roman:'Clipboard'})+' '+(c+1)+' ('+l.length+')</span></div>'
        +'<button class="rc-btn" onclick="repCloseToolView()">✕ '+repLangText({ur:'بند کریں',en:'Close',roman:'Band karein'})+'</button></div>';
    h+=repAnaRulesHtml();
    h+='<div id="repAnaBody"><div class="rep-tool-loading">⏳ '+repLangText({ur:'ریپرٹری ڈیٹا لوڈ ہو رہا ہے...',en:'Loading repertory data...',roman:'Repertory data load ho raha hai...'})+'</div></div>';
    cd.innerHTML=h; cd.scrollTop=0;
    repRenderDock();
    repEnsureAllBooks(function(all){
        var body=document.getElementById('repAnaBody'); if(!body)return;
        var res=_repAnaCompute(l,all,c);
        if(!res.abbrs.length){ body.innerHTML='<div class="rep-tool-loading">'+repLangText({ur:'ان ربرکس پر کوئی ادویہ درج نہیں',en:'No remedies recorded on these rubrics',roman:'In rubrics par koi adwiyeh darj nahi'})+'</div>'; return; }
        var COLS=20, abbrs=res.abbrs.slice(0,COLS);
        var winner=abbrs[0], wcol=res.col[winner];
        var hh='<div class="rep-ana-sum">'
            +'<span class="rep-ana-winner">🏆 '+repLangText({ur:'سب سے زیادہ کور:',en:'Top coverage:',roman:'Sab se ziyada koor:'})+' <b dir="ltr">'+escapeHtml(winner)+'</b> — '+repFmtCov(wcol.cov,res.denom)+' ('+Math.max(0,Math.round(wcol.cov*100/res.denom))+'%)</span>'
            +(res.abbrs.length>COLS?'<span class="rep-ana-more">+'+(res.abbrs.length-COLS)+' '+repLangText({ur:'مزید ادویات',en:'more remedies',roman:'mazeed adwiyeh'})+'</span>':'')
            +(res.elimNotes||[]).map(function(n){ return '<span class="rep-ana-elim">🚫 '+escapeHtml(repClipLabel(n.clip))+': -'+n.removed+'</span>'; }).join('')+repAnaDiffBtnsHtml(res.abbrs)+repAnaExportBtnsHtml()
            +'<span class="rep-ana-more">🧮 '+escapeHtml(repAnaMethodLabel(res.method))+(res.method==='boen'?' · '+repLangText({ur:'پولیریٹی جوڑے: ',en:'polarity pairs: ',roman:'polarity pairs: '})+res.polPairs:'')+'</span>'
            +'</div>';
        hh+='<div class="rep-ana-wrap"><table class="rep-ana-table"><thead><tr><th class="ana-rub">'+repLangText({ur:'ربرک',en:'Rubric',roman:'Rubric'})+'</th>';
        abbrs.forEach(function(a){ hh+='<th class="ana-rem'+(a===winner?' win':'')+'" dir="ltr" onclick="copyRemedyToPrescription(\''+escapeHtml(a)+'\')" title="'+escapeHtml(a)+' — '+res.col[a].cov+'/'+res.rows.length+'">'+escapeHtml(a.length>10?a.substring(0,9)+'…':a)+'</th>'; });
        hh+='</tr></thead><tbody>';
        res.rows.forEach(function(r){
            var it=r.it;
            hh+='<tr><td class="ana-rub" onclick="repClipGoto(\''+_repJs(it.book)+'\',\''+_repJs(it.ch)+'\',\''+_repJs(String(it.rid))+'\')">'
                +repBookBadgeHtml(it.book)+' <span dir="ltr">'+escapeHtml(_repTruncPath(it.path||'—',52))+'</span></td>';
            abbrs.forEach(function(a){
                var g=r.rems[a]||0;
                hh+='<td class="ana-cell">'+(g?'<i class="rep-gr-dot d'+(g>=3?3:(g===2?2:1))+'" title="'+escapeHtml(a)+' = '+g+'"></i>':'')+'</td>';
            });
            hh+='</tr>';
        });
        hh+='</tbody><tfoot><tr><td class="ana-rub">'+repLangText({ur:'کوریج',en:'Coverage',roman:'Korage'})+'</td>';
        abbrs.forEach(function(a){ var e=res.col[a]; hh+='<td class="ana-total'+(a===winner?' win':'')+'">'+repFmtCov(e.cov,res.denom)+'</td>'; });
        hh+='</tr><tr><td class="ana-rub">'+repLangText({ur:'اسکور (گریڈ × ویٹ)',en:'Score (grade × weight)',roman:'Score (grade × weight)'})+'</td>';
        abbrs.forEach(function(a){ var e=res.col[a]; hh+='<td class="ana-total score'+(a===winner?' win':'')+'" title="'+repLangText({ur:'مجموعی اسکور',en:'total score',roman:'total score'})+'">'+repFmtScore(e.total)+'</td>'; });
        if(res.pol){ hh+='</tr><tr><td class="ana-rub" title="'+repLangText({ur:'پولیریٹی = ربرک کا گریڈ منفی مخالف ربرک (agg/amel) کا گریڈ۔ ⚠ = کانٹرا انڈیکیشن',en:'Polarity = grade in rubric minus grade in opposite (agg/amel) rubric. ⚠ = contraindication',roman:'Polarity'})+'">'+repLangText({ur:'پولیریٹی',en:'Polarity',roman:'Polarity'})+'</td>';
            abbrs.forEach(function(a){ var pv=res.pol[a]||0, ci=res.contra&&res.contra[a]; hh+='<td class="ana-total" style="'+(ci?'color:#c0392b;font-weight:bold;':'')+'">'+(ci?'⚠':'')+(pv>0?'+':'')+pv+'</td>'; }); }
        hh+='</tr></tfoot></table></div>';
        hh+='<p class="rep-tool-note">'+repLangText({ur:'ڈاٹ کا رنگ گریڈ دکھاتا ہے (1 ہلکا → 3 گہرا)۔ ربرک پر کلک = کھولیں، ادویہ کے نام پر کلک = کاپی۔ ویٹ ⋮ مینو سے بدلیں (ورک بینچ)۔',en:'Dot shade = grade (1 light → 3 dark). Click a rubric to open it, a remedy name to copy. Change weights from the ⋮ menu (Workbench).',roman:'Dot ka rang grade dikhaata hai. Weight ⋮ menu se badlein (Workbench).'})+'</p>';
        body.innerHTML=hh;
    });
}

// ==================== ⇄ COMPARE (clipboards side by side) ====================
function repOpenCompare(){
    repKebabHide();
    repHistBack.push(repCurrentState()); repHistFwd=[];
    repCompareOpen=true; repWorkbenchOpen=false; repAnalysisOpen=-1; repCurrentDetail=null; repClipViewOpen=false;
    for(var i=0;i<REP_N_CLIPS;i++) repCompareSel[i]=(repClipboards[i]||[]).length>0;
    var any=false; repCompareSel.forEach(function(x){ if(x)any=true; });
    if(!any) repCompareSel[repActiveClip]=true;
    renderCompare();
}
function repCompareToggle(i){ repCompareSel[i]=!repCompareSel[i]; renderCompare(); }
function _repCmpCompute(sel,all){
    var map={},order=[],unions={};
    sel.forEach(function(ci){
        unions[ci]={};
        (repClipboards[ci]||[]).forEach(function(it){
            var key=it.book+'|'+String(it.rid);
            if(!map[key]){ map[key]={it:it,inClips:[]}; order.push(key); }
            if(map[key].inClips.indexOf(ci)===-1) map[key].inClips.push(ci);
            var rems=repClipItemRemedies(it,all)||{};
            Object.keys(rems).forEach(function(a){
                var g=rems[a]||1; g=g>=3?3:(g===2?2:1);
                if(!unions[ci][a]||unions[ci][a]<g) unions[ci][a]=g;
            });
        });
    });
    var common=[];
    if(sel.length){
        Object.keys(unions[sel[0]]).forEach(function(a){
            var ok=true;
            for(var s=1;s<sel.length;s++){ if(!unions[sel[s]][a]){ ok=false; break; } }
            if(ok){
                var per={},total=0,max=0;
                sel.forEach(function(ci){ var g=unions[ci][a]||0; per[ci]=g; total+=g; if(g>max)max=g; });
                common.push({abbr:a,per:per,total:total,max:max});
            }
        });
        common.sort(function(x,y){ return y.total-x.total||x.abbr.localeCompare(y.abbr); });
    }
    var union=order.map(function(k){ return map[k]; });
    return {union:union,common:common};
}
function renderCompare(){
    var cd=document.getElementById('repRubricContent'); if(!cd)return;
    repUpdateNavButtons(); repRenderBreadcrumb();
    var sel=[]; for(var i=0;i<REP_N_CLIPS;i++) if(repCompareSel[i]&&(repClipboards[i]||[]).length) sel.push(i);
    var h='<div class="rep-tool-head"><div class="rep-content-title"><span>⇄</span><b>'+repLangText({ur:'موازنہ (COMPARE)',en:'COMPARE',roman:'COMPARE'})+'</b></div>'
        +'<button class="rc-btn" onclick="repCloseToolView()">✕ '+repLangText({ur:'بند کریں',en:'Close',roman:'Band karein'})+'</button></div>';
    h+='<div class="rep-cmp-chips">';
    for(var ci=0;ci<REP_N_CLIPS;ci++){
        var n=(repClipboards[ci]||[]).length;
        h+='<button class="rep-cmp-chip'+(repCompareSel[ci]?' on':'')+(n?'':' dis')+'"'+(n?' onclick="repCompareToggle('+ci+')"':' disabled')+'>📋'+(ci+1)+' — '+n+' '+repLangText({ur:'ربرکس',en:'rubrics',roman:'rubrics'})+'</button>';
    }
    h+='</div>';
    if(sel.length<2){
        h+='<div class="rep-tool-loading">'+repLangText({ur:'موازنے کے لیے کم از کم 2 غیر خالی کلپ بورڈز منتخب کریں — اوپر چپس سے منتخب کریں۔',en:'Select at least 2 non-empty clipboards above to compare.',roman:'Moazne ke liye kam az kam 2 ghair khali clipboards muntakhib karein.'})+'</div>';
        cd.innerHTML=h; cd.scrollTop=0; repRenderDock(); return;
    }
    h+='<div id="repCmpBody"><div class="rep-tool-loading">⏳ '+repLangText({ur:'ریپرٹری ڈیٹا لوڈ ہو رہا ہے...',en:'Loading repertory data...',roman:'Repertory data load ho raha hai...'})+'</div></div>';
    cd.innerHTML=h; cd.scrollTop=0; repRenderDock();
    repEnsureAllBooks(function(all){
        var body=document.getElementById('repCmpBody'); if(!body)return;
        var res=_repCmpCompute(sel,all);
        var hh='';
        hh+='<div class="rpd-sec-head">📁 '+repLangText({ur:'ربرکس کا موازنہ',en:'RUBRICS SIDE BY SIDE',roman:'RUBRICS ka moazna'})+' <span class="cnt">('+res.union.length+')</span></div>';
        if(!res.union.length){
            hh+='<div class="rep-tool-loading">'+repLangText({ur:'منتخب کلپ بورڈز خالی ہیں',en:'Selected clipboards are empty',roman:'Muntakhib clipboards khali hain'})+'</div>';
        } else {
            hh+='<div class="rep-ana-wrap"><table class="rep-ana-table cmp"><thead><tr><th class="ana-rub">'+repLangText({ur:'ربرک',en:'Rubric',roman:'Rubric'})+'</th>';
            sel.forEach(function(ci){ hh+='<th>📋'+(ci+1)+'</th>'; });
            hh+='</tr></thead><tbody>';
            res.union.forEach(function(u){
                hh+='<tr><td class="ana-rub">'+repBookBadgeHtml(u.it.book)+' <span dir="ltr" style="cursor:pointer;" onclick="repClipGoto(\''+_repJs(u.it.book)+'\',\''+_repJs(u.it.ch)+'\',\''+_repJs(String(u.it.rid))+'\')">'+escapeHtml(_repTruncPath(u.it.path||'—',52))+'</span></td>';
                sel.forEach(function(ci){ hh+='<td class="ana-cell">'+(u.inClips.indexOf(ci)!==-1?'<span class="cmp-yes">✓</span>':'')+'</td>'; });
                hh+='</tr>';
            });
            hh+='</tbody></table></div>';
        }
        hh+='<div class="rpd-sec-head">💊 '+repLangText({ur:'مشترکہ ادویات — ہر منتخب کلپ بورڈ میں موجود',en:'COMMON REMEDIES — present in EVERY selected clipboard',roman:'Mushtarka adwiyeh — har muntakhib clipboard mein mojood'})+' <span class="cnt">('+res.common.length+')</span></div>';
        if(!res.common.length){
            hh+='<div class="rep-tool-note">'+repLangText({ur:'کوئی ادویہ ایسی نہیں جو ہر منتخب کلپ بورڈ کی کم از کم ایک ربرک میں موجود ہو۔',en:'No remedy appears in at least one rubric of every selected clipboard.',roman:'Koi adwiyeh nahi jo har muntakhib clipboard ki kam az kam aik rubric mein ho.'})+'</div>';
        } else {
            hh+='<div class="rep-cmp-common">';
            res.common.forEach(function(cr){
                var dots='';
                sel.forEach(function(ci){ var g=cr.per[ci]||0; dots+=g?'<i class="rep-gr-dot d'+(g>=3?3:(g===2?2:1))+'"></i>':'<i class="rep-gr-dot off"></i>'; });
                hh+='<span class="rep-remedy-tag g'+(cr.max>=3?3:(cr.max===2?2:1))+' cmp" onclick="copyRemedyToPrescription(\''+escapeHtml(cr.abbr)+'\')" title="'+escapeHtml(cr.abbr)+' — Σ '+cr.total+'"><b dir="ltr">'+escapeHtml(cr.abbr)+'</b><span class="cmp-dots">'+dots+'</span><span class="cmp-sum">Σ '+cr.total+'</span></span>';
            });
            hh+='</div>';
            hh+='<p class="rep-tool-note">'+repLangText({ur:'یہ ادویہ ہر منتخب کلپ بورڈ کی کم از کم ایک ربرک میں موجود ہیں — ڈاٹس بتاتے ہیں کس کلپ بورڈ میں کتنے گریڈ پر، اور Σ مجموعہ بڑا = زیادہ کور۔',en:'These remedies appear in at least one rubric of every selected clipboard — dots show which clipboard and at what grade; higher Σ = more coverage.',roman:'Ye adwiyeh har muntakhib clipboard ki kam az kam aik rubric mein hain — Σ barha = ziyada koor.'})+'</p>';
        }
        body.innerHTML=hh;
    });
}

// ==================== 🤖 ASK AI (floating assistant) ====================
var repAskOpen=false;
function repAskToggle(){
    repAskOpen=!repAskOpen;
    var p=document.getElementById('repAskPanel'); if(!p)return;
    if(repAskOpen) p.classList.add('open'); else p.classList.remove('open');
    if(repAskOpen){
        var m=document.getElementById('repAskMsgs');
        if(m&&!m.childElementCount){
            m.innerHTML='<div class="rep-ask-msg bot">'+repLangText({
                ur:'السلام علیکم! میں کلینک اسسٹنٹ ہوں۔ علامت لکھیں تو میں میچنگ ربرکس ڈھونڈ دوں گا، یا پوچھیں: کلپ بورڈ، ورک بینچ، تجزیہ گرڈ، Compare، گریڈ یا سرچ کیسے؟',
                en:'Hello! I am the clinic assistant. Type a symptom and I will find matching rubrics, or ask me about clipboards, workbench, the analysis grid, Compare, grades or search.',
                roman:'Assalam-o-alaikum! Main clinic assistant hoon. Alaamat likhein ya poochein: clipboards, workbench, grid, Compare, grade ya search?'})+'</div>';
        }
        repAskRenderChips();
        var inp=document.getElementById('repAskInput'); if(inp)inp.focus();
    }
}
function repAskRenderChips(){
    var c=document.getElementById('repAskChips'); if(!c)return;
    var chips=[
        repLangText({ur:'کلپ بورڈ کیسے استعمال کروں؟',en:'How do clipboards work?',roman:'Clipboard kaise istemal karoon?'}),
        repLangText({ur:'تجزیہ گرڈ سمجھائیں',en:'Explain the analysis grid',roman:'Tajzia grid samjhaein'}),
        repLangText({ur:'Compare کیا ہے؟',en:'What is Compare?',roman:'Compare kya hai?'}),
        repLangText({ur:'گریڈ کا مطلب؟',en:'What do grades mean?',roman:'Grade ka matlab?'})
    ];
    var h='';
    chips.forEach(function(t){ h+='<button class="rep-ask-chip" onclick="repAskChipGo(this)">'+escapeHtml(t)+'</button>'; });
    c.innerHTML=h;
}
function repAskChipGo(btn){ var inp=document.getElementById('repAskInput'); if(inp){ inp.value=btn.textContent; repAskSend(); } }
function repAskPushUser(t){
    var m=document.getElementById('repAskMsgs'); if(!m)return;
    m.insertAdjacentHTML('beforeend','<div class="rep-ask-msg user">'+escapeHtml(t)+'</div>');
    m.scrollTop=m.scrollHeight;
}
function repAskSend(){
    var inp=document.getElementById('repAskInput'); if(!inp)return;
    var v=inp.value.trim(); if(!v)return;
    inp.value='';
    repAskPushUser(v);
    var m=document.getElementById('repAskMsgs');
    if(m){ m.insertAdjacentHTML('beforeend','<div class="rep-ask-msg bot" id="repAskTyping">⏳</div>'); m.scrollTop=m.scrollHeight; }
    setTimeout(function(){ repAskAnswer(v); },300);
}
function repAskFinish(html){
    var t=document.getElementById('repAskTyping');
    if(t){ var d=document.createElement('div'); d.className='rep-ask-msg bot'; d.innerHTML=html; t.parentNode.replaceChild(d,t); }
    var m=document.getElementById('repAskMsgs'); if(m)m.scrollTop=m.scrollHeight;
}
function repAskActs(entries){
    var h='<div class="rep-ask-acts">';
    entries.forEach(function(e){ h+='<button class="rc-btn primary" onclick="'+e.fn+'">'+e.lab+'</button>'; });
    return h+'</div>';
}
function repAskSearch(q,cb){
    var words=String(q).toLowerCase().split(/\s+/).filter(Boolean);
    function scan(sd,bookKey){
        var out=[];
        if(!sd)return out;
        Object.keys(sd).forEach(function(ck){
            var rubs=sd[ck]; if(!rubs)return;
            Object.keys(rubs).forEach(function(rid){
                var r=rubs[rid]; if(!r)return;
                var t=r.path||r.de_path||r.t||''; if(!t)return;
                var lt=t.toLowerCase();
                for(var i=0;i<words.length;i++){ if(lt.indexOf(words[i])===-1)return; }
                out.push({book:bookKey,ch:ck,rid:rid,text:t,rems:r.r||{}});
            });
        });
        return out;
    }
    var meaning=repUrduMeaning(q);
    function done(cur){
        if(cur.length){ cb(cur.slice(0,6),meaning); return; }
        repEnsureAllBooks(function(all){
            var more=[];
            Object.keys(REP_BOOK_INFO).forEach(function(bk){ if(bk===repCurrentBook)return; more=more.concat(scan(all[bk],bk)); });
            cb(more.slice(0,6),meaning);
        });
    }
    function runCur(d){ done(scan(d,repCurrentBook)); }
    if(_repFullData) runCur(_repFullData); else loadRepData(runCur);
}
function repAskAnswer(q){
    var lq=String(q).toLowerCase();
    function B(inner){ repAskFinish(inner); }
    if(/(ورک ?بینچ|workbench)/.test(lq)){
        return B(repLangText({ur:'<b>⚙ ورک بینچ (کیس ریپرٹورائزیشن)</b> — بارہ کلپ بورڈز ایک ساتھ: ہر ربرک پر <b>⋮</b> مینو (ترتیب، ملٹی پلائر ویٹ، منتقلی، ڈیلیٹ)، ✏ سے نام، 🚫 ایلی منیشن موڈ، اور <b>📊 گرڈ</b> ٹیب پر مشترکہ تجزیہ۔',en:'<b>⚙ Workbench (Case Repertorisation)</b> — all 12 clipboards together: every rubric has a <b>⋮</b> menu (order, multiplier weight, move, delete), ✏ renames, 🚫 Elimination Mode, and the <b>📊 Grid</b> tab analyzes them combined.',roman:'Workbench — har rubric ka ⋮ menu, ✏ rename, 🚫 elimination, 📊 Grid tab.'})+repAskActs([{fn:'repOpenWorkbench()',lab:'⚙ '+repLangText({ur:'ورک بینچ کھولیں',en:'Open Workbench',roman:'Workbench kholen'})}]));
    }
    if(/(ویٹ|weight|0\.5|ملٹی ?پلائر|multiplier)/.test(lq)){
        return B(repLangText({ur:'<b>⚖ ملٹی پلائر ویٹ</b> — ورک بینچ میں ہر ربرک کے ⋮ مینو سے: <b>0.5x</b> نصف اثر، <b>1x</b> عام، <b>2x/4x</b> زیادہ اثر (اہم ربرک)، <b>-1x 🚫</b> منہا (اس ربرک کی ادویات اسکور سے کٹ جاتی ہیں)۔ گرڈ کی کوریج اسی سے بڑھتی/گھٹتی ہے۔',en:'<b>⚖ Multiplier Weight</b> — in the Workbench, open a rubric\'s ⋮ menu: <b>0.5x</b> half effect, <b>1x</b> normal, <b>2x/4x</b> stronger (key rubrics), <b>-1x 🚫</b> negative (its remedies are subtracted from the score). The Grid coverage follows these weights.',roman:'Multiplier Weight — ⋮ menu se: 0.5x/1x/2x/4x/-1x; grid coverage mutabiq.'})+repAskActs([{fn:'repOpenWorkbench()',lab:'⚙ '+repLangText({ur:'ورک بینچ کھولیں',en:'Open Workbench',roman:'Workbench kholen'})}]));
    }
    if(/(ایلی ?منیشن|elimination|eliminate|خارج)/.test(lq)){
        return B(repLangText({ur:'<b>🚫 ایلی منیشن موڈ</b> — ورک بینچ میں کسی کلپ بورڈ پر یہ باکس چیک کریں: <b>📊 گرڈ</b> ٹیب میں پھر صرف وہی ادویات رہیں گی جو اسی کلپ بورڈ کے ربرکس میں موجود ہوں — باقی سب خارج (eliminate) ہو جائیں گی۔ یہ کلاسک ہومیوپیتھک elimination ہے۔',en:'<b>🚫 Elimination Mode</b> — check it on a clipboard in the Workbench: the <b>📊 Grid</b> tab then keeps ONLY the remedies covered by that clipboard\'s rubrics — everything else is eliminated. Classic homeopathic elimination.',roman:'Elimination Mode — check karne par Grid mein sirf usi clipboard ki adwiyat rehti hain.'})+repAskActs([{fn:'repOpenWorkbench()',lab:'⚙ '+repLangText({ur:'ورک بینچ کھولیں',en:'Open Workbench',roman:'Workbench kholen'})}]));
    }
    if(/(گرڈ|grid|اینالیسس|analysis|تجزیہ|repertoriz|ریپرٹورائز)/.test(lq)){
        return B(repLangText({ur:'<b>📊 کیس اینالیسس گرڈ</b> — فعال کلپ بورڈ کی ربرکس قطاروں میں، ادویات کالموں میں؛ ہر ڈاٹ کا رنگ گریڈ (1 ہلکا → 3 گہرا)، نیچے کوریج۔ سب سے اوپر 🏆 سب سے زیادہ کور والی ادویہ۔',en:'<b>📊 Case Analysis Grid</b> — rubrics of the active clipboard as rows, remedies as columns; each dot is a grade (1 light → 3 dark), totals at the bottom. 🏆 marks the top-coverage remedy.',roman:'Case Analysis Grid — rubrics rows, remedies columns; dot = grade, neeche korage; 🏆 top remedy.'})+repAskActs([{fn:'repOpenAnalysis()',lab:'📊 '+repLangText({ur:'گرڈ کھولیں',en:'Open Grid',roman:'Grid kholen'})}]));
    }
    if(/(میٹیریا|materia|کتاب کا متن|boericke|بورک|kent lecture|نیش|nash|allen key|ایلن)/.test(lq)){
        return B(repLangText({ur:'<b>📖 میٹیریا میڈیکا</b> — چار پبلک ڈومین کتابیں ایپ میں ہیں: کینٹ لیکچرز، بورک، ایلن کی نوٹس، نیش لیڈرز۔ ربرک کے صفحے پر «📖 میٹیریا میڈیکا» = ربرک کی ادویات کا پورا متن، موضوع کے الفاظ نمایاں؛ تفریق ونڈو کا «📖» ٹیب = ہر ریمیڈی کے متعلقہ جملے مع حوالہ + 🤖 خودکار مسودہ + ✍ آپ کا نوٹ (منظور/ایکسپورٹ)۔',en:'<b>📖 Materia medica</b> — four public-domain books are in the app: Kent Lectures, Boericke, Allen Keynotes, Nash Leaders. On a rubric page «📖» shows the full text of its remedies with theme words highlighted; the «📖» tab of the differentiation window gives each remedy\'s matching sentences with references + 🤖 auto draft + ✍ your own note (approve/export).',roman:'Materia medica — Kent, Boericke, Allen, Nash; rubric page par 📖; tafreeq window ka 📖 tab.'})+repAskActs([{fn:'repMMOpenForRubric()',lab:'📖 '+repLangText({ur:'کھولیں',en:'Open',roman:'Kholen'})}]));
    }
    if(/(تفریق|extract|differen|فرق|ایکسٹریکشن)/.test(lq)){
        return B(repLangText({ur:'<b>🔬 تفریق / ایکسٹریکشن</b> — ربرک کے صفحے پر «🔬 تفریق» دبائیں: (1) ربرک کی تمام ریمیڈیز کا ذیلی/ہم رشتہ ربرکس پر پروفائل، (2) 2 تا 5 ریمیڈیز چن کر <b>خصوصی</b> ربرکس (صرف ایک موجود)، گریڈ کا فرق، جزوی، مشترک — چھوٹا ربرک + اونچا گریڈ اوپر، (3) ایک ریمیڈی = کی نوٹس، (4) کتابوں کی گواہی۔ گرڈ کے اوپر «🔬 ٹاپ 3» بھی ہے۔',en:'<b>🔬 Differentiation / Extraction</b> — press «🔬» on a rubric page: (1) profile of all its remedies over sub/related rubrics, (2) pick 2–5 remedies → <b>exclusive</b> rubrics (only one present), grade differences, partial, common — small rubric + high grade first, (3) one remedy = keynotes, (4) books witness. The grid also has «🔬 top 3».',roman:'Tafreeq / Extraction — rubric page par 🔬; 2–5 remedies → exclusive rubrics.'})+repAskActs([{fn:'repDiffOpenWithRemedies([])',lab:'🔬 '+repLangText({ur:'کھولیں',en:'Open',roman:'Kholen'})}]));
    }
    if(/(compare|کمپئیر|موازنہ)/.test(lq)){
        return B(repLangText({ur:'<b>☑ کمپیئر موڈ (Compare)</b> — ٹول بار کا Compare بٹن دبائیں: ہر ربرک کارڈ پر ☐ آ جاتا ہے، ٹک = فعال کلپ بورڈ میں شامل؛ سائیڈ بار میں N منتخب / کلیئر / اینالائز۔ اینالائز = ورک بینچ گرڈ (تمام کلپ بورڈز، ویٹ، ایلی منیشن)۔ کلپ بورڈز آمنے سامنے دیکھنے کے لیے <b>⇄ کلپ بورڈز کا موازنہ</b> (ورک بینچ)۔',en:'<b>☑ Compare Mode</b> — press the toolbar Compare button: every rubric card gets a ☐, tick = added to the active clipboard; sidebar shows N selected / Clear / Analyze. Analyze = Workbench Grid (all clipboards, weights, elimination). For clipboards side by side use <b>⇄ Compare clipboards</b> (Workbench).',roman:'Compare Mode — toolbar button; cards par ☐, tick = active clipboard; Analyze = Workbench Grid.'})+repAskActs([{fn:'repCmpModeToggle()',lab:'☑ Compare'},{fn:'repOpenCompare()',lab:'⇄ '+repLangText({ur:'کلپ بورڈز کا موازنہ',en:'Compare clipboards',roman:'Compare clipboards'})}]));
    }
    if(/(کلپ|clip)/.test(lq)){
        return B(repLangText({ur:'<b>📋 کلپ بورڈز (1–12)</b> — یہ آپ کی ریپرٹورائزیشن ورکنگ لسٹیں ہیں: کسی ربرک کارڈ کے <b>⋮</b> مینو سے شامل/ہٹائیں، نیچے ڈاک کے نمبر پر کلک سے لسٹ کھولیں۔ یہ localStorage میں محفوظ رہتے ہیں۔',en:'<b>📋 Clipboards (1–12)</b> — your repertorisation working lists: add/remove via the <b>⋮</b> menu on any rubric card, click a dock number to view the list. They persist in localStorage.',roman:'Clipboards 1-12 — ⋮ menu se add/remove, dock number par click se list; localStorage mein mehfooz.'})+repAskActs([{fn:'repOpenWorkbench()',lab:'⚙ '+repLangText({ur:'ورک بینچ کھولیں',en:'Open Workbench',roman:'Workbench kholen'})}]));
    }
    if(/(گریڈ|grade|gradation|درجہ)/.test(lq)){
        return B(repLangText({ur:'<b>گریڈ (GRADATION)</b> — ریپرٹری میں ادویہ کی طاقت: <span class="rep-gr-dot d3"></span> 3 = مضبوط (سب سے پہلے غور), <span class="rep-gr-dot d2"></span> 2 = درمیانہ, <span class="rep-gr-dot d1"></span> 1 = معمولی۔ تجزیہ گرڈ میں ڈاٹ کا رنگ اسی سے بنتا ہے۔',en:'<b>GRADATION</b> — remedy strength in the repertory: <span class="rep-gr-dot d3"></span> 3 = strong (consider first), <span class="rep-gr-dot d2"></span> 2 = medium, <span class="rep-gr-dot d1"></span> 1 = light. The analysis grid dot colours follow this.',roman:'Grade — adwiyeh ki taaqat: 3 mazboot, 2 darmiyana, 1 mamooli.'}));
    }
    if(/(سرچ|search|تلاش|dhundh|find)/.test(lq)){
        return B(repLangText({ur:'<b>🔍 سرچ ٹپس</b> — پہلا ڈراپ ڈاؤن <b>سکوپ</b> چنیں: <b>سرچ ان اوپن چیپٹر</b> (صرف کھلا باب)، <b>سرچ ان اوپن ریپرٹری</b> (پوری کتاب)، <b>سرچ ان آل ریپرٹریز</b> (چاروں کتابیں)۔ دوسرا ڈراپ ڈاؤن <b>ٹائپ</b> چنیں: <b>ربرک / سب ربرک</b> (عام)، <b>ادویہ</b> (مثلاً nux vom)، <b>ربرک + ادویہ</b> (دونوں)، <b>کلینیکل حالت</b> (مثلاً headache یا اردو میں «بخار» — لغت خود ہم معنی ڈھونڈتی ہے)۔ <code>@mind</code> لگائیں تو صرف اسی باب میں۔',en:'<b>🔍 Search tips</b> — first dropdown picks the SCOPE: <b>Search in Open Chapter</b> (open chapter only), <b>Search in Open Repertory</b> (whole book), <b>Search in All Repertories</b> (all four books). Second dropdown picks the TYPE: <b>Rubric / Subrubric</b> (normal), <b>Remedy</b> (e.g. nux vom), <b>Rubric + Remedy</b> (both), <b>Clinical Condition</b> (e.g. headache or Urdu «بخار» — the glossary finds synonyms for you). Add <code>@mind</code> to restrict to one chapter.',roman:'Search tips — scope dropdown: Open Chapter / Open Repertory / All Repertories; type dropdown: Rubric/Subrubric, Remedy, Rubric+Remedy, Clinical Condition; @chapter filter.'}));
    }
    if(/(معنی|matlab|مطلب|meaning|مریض کا ورژن)/.test(lq)){
        return B(repLangText({ur:'<b>📖 ربرک کا مطلب</b> — ربرک کھولیں (کارڈ یا ڈیٹیل پیج) اور عنوان کے بعد <b>&lt;</b> آئکن دبائیں: مطلب (لغت سے)، مریض کا ورژن، صحیح استعمال اور کراس ریفرنس ایکسپینڈ ہو کر آئیں گے۔',en:'<b>📖 Rubric meaning</b> — open a rubric (card or detail page) and press the <b>&lt;</b> icon after the title: meaning (from the glossary), patient version, when to use and cross-references expand.',roman:'Rubric kholen aur < icon dabaein — matlab, mareez ka version, istemal, xref.'}));
    }
    if(/^(سلام|اسلام|hi|hello|hey|assalam)/.test(lq)){
        return B(repLangText({ur:'وعلیکم السلام! 👋 علامت لکھیں (مثلاً <i>headache morning</i>) یا مجھ سے کوئی فیچر پوچھیں۔',en:'Hello! 👋 Type a symptom (e.g. <i>headache morning</i>) or ask me about any feature.',roman:'Walaikum assalam! Alaamat likhein ya feature poochein.'}));
    }
    if(String(q).trim().length>=2){
        repAskSearch(q,function(found,meaning){
            if(!found.length){
                B(repLangText({ur:'«'+escapeHtml(q)+'» کے لیے کوئی ربرک نہیں ملی — کوئی اور لفظ آزمائیں یا بتائیں کہ مریض اپنی شکایت کیسے بیان کرتا ہے۔',en:'No rubric found for «'+escapeHtml(q)+'» — try another word, or tell me how the patient describes the complaint.',roman:'«'+escapeHtml(q)+'» ke liye rubric nahi mili — dosra lafz azmaein.'}));
                return;
            }
            var h2=repLangText({ur:'میں نے <b>'+found.length+'</b> میچنگ ربرکس پائیں — کلک کریں تو کھل جائیں گی:',en:'I found <b>'+found.length+'</b> matching rubrics — click to open:',roman:'Mujhe '+found.length+' matching rubrics milin — click kar ke kholen:'});
            if(meaning) h2+='<div class="rep-ask-mean">📖 '+escapeHtml(meaning)+'</div>';
            h2+='<div class="rep-ask-found">';
            found.forEach(function(f){
                h2+='<div class="rep-ask-found-row" onclick="navigateToRubric(\''+_repJs(f.book)+'\',\''+_repJs(f.ch)+'\',\''+_repJs(String(f.rid))+'\',true)">'+repBookBadgeHtml(f.book)+'<span dir="ltr">'+escapeHtml(_repTruncPath(f.text,64))+'</span><i>⚡ '+Object.keys(f.rems||{}).length+'</i></div>';
            });
            h2+='</div>'+repLangText({ur:'پسند آئے تو کارڈ کے ⋮ مینو سے کلپ بورڈ میں شامل کریں۔',en:'Like one? Add it to a clipboard via the card\'s ⋮ menu.',roman:'Pasand aaye to ⋮ menu se clipboard mein shamil karein.'});
            B(h2);
        });
        return;
    }
    B(repLangText({ur:'میں ربرکس تلاش کرنے اور کلپ بورڈز، ورک بینچ، تجزیہ گرڈ، Compare، گریڈ و سرچ سمجھانے میں مدد کر سکتا ہوں — علامت لکھ کر دیکھیں!',en:'I can find rubrics and explain clipboards, workbench, the analysis grid, Compare, grades and search — try typing a symptom!',roman:'Main rubrics talash aur features samjha sakta hoon — alaamat likhein!'}));
}

// ==================== SIDEBAR TOOLS (N selected / Clear / Analyze) ====================
function repUpdateSelCount(){
    var el=document.getElementById('repSelCount'); if(!el)return;
    var n=0; for(var i=0;i<REP_N_CLIPS;i++) n+=(repClipboards[i]||[]).length;
    var na=(repClipboards[repActiveClip]||[]).length;
    el.textContent=repLangText({ur:na+' منتخب'+(n!==na?' · کل '+n:''),en:na+' selected'+(n!==na?' · total '+n:''),roman:na+' selected'+(n!==na?' · total '+n:'')});
    el.title=repLangText({ur:'فعال: '+repClipLabel(repActiveClip)+' ('+na+') — تمام کلپ بورڈز: '+n,en:'Active: '+repClipLabel(repActiveClip)+' ('+na+') — all clipboards: '+n,roman:'Active: '+repClipLabel(repActiveClip)+' ('+na+') — total: '+n});
    repCmpPanelRender();
}

