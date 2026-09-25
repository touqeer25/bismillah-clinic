// Bismillah Clinic — js/repertory/rep-search.js — تلاش (scope / type / AND OR NOT)
// (v78: 08-app-repertory.js کو بغیر کسی کوڈ تبدیلی کے حصوں میں بانٹا گیا؛ لوڈ ترتیب index.html میں وہی رکھیں)
var _repSearchBeforeContext = null; // where to return when the search box is cleared
var _repSearchSeq = 0;              // cancels old async searches when user clears/changes text

function repLangText(map){ return (map && (map[currentLang] || map.en || map.ur || map.roman)) || ''; }

function rememberRepSearchContext(){
    if(_repSearchBeforeContext) return;
    _repSearchBeforeContext = {
        book: repCurrentBook,
        chapter: repCurrentChapter,
        page: repTreePage || 0,
        pageSize: repTreePageSize || 50
    };
}

function restoreRepSearchContext(){
    _repSearchSeq++;
    _repSearchCache=''; _repSearchResults=null; _repSearchMode='';
    repSearchAllBooks=false;
    repLastSearchView=null;
    repCurrentDetail=null; repClipViewOpen=false;repWorkbenchOpen=false;repCompareOpen=false;repAnalysisOpen=-1;
    var ctx = _repSearchBeforeContext;
    _repSearchBeforeContext = null;

    function showCurrentOrEmpty(){
        if(repCurrentChapter){
            if(repCurrentTree && repCurrentChKey===repCurrentChapter){
                renderFolderView();
            } else {
                var nm=repCurrentChapter; repChapterNames.forEach(function(c){ if(c.key===repCurrentChapter) nm=c.name; });
                if(repTreeCache[repCurrentChapter]) renderTree(repCurrentChapter, nm, repTreeCache[repCurrentChapter]);
                else selectChapter(repCurrentChapter);
            }
        } else {
            repRenderEmptyState();
        }
    }

    if(ctx && ctx.book && ctx.book !== repCurrentBook){
        var sel=document.getElementById('repBookSelect');
        if(sel) sel.value = ctx.book;
        repCurrentBook = ctx.book;
        repCurrentChapter = '';
        repTreeCache = {};
        _repFullData = null;
        repRidToFlatIndex = {};
        repCurrentFlatTree = [];
        if(typeof initRepertoryBrowser === 'function') initRepertoryBrowser(true);   // 🔑 v45: آٹو-مائنڈ نہیں — سرچ کے بعد پرانی منزل بحال ہوتی ہے
        if(ctx.chapter){
            setTimeout(function(){ selectChapter(ctx.chapter); }, 700);
        }
        return;
    }

    if(ctx && ctx.chapter){
        repTreePageSize = ctx.pageSize || repTreePageSize;
        if(repCurrentChapter===ctx.chapter && repCurrentTree && repCurrentChKey===ctx.chapter){
            // 🔑 folder state was never touched by the search — just re-render it
            renderFolderView();
        } else {
            selectChapter(ctx.chapter);
        }
    } else {
        showCurrentOrEmpty();
    }
}

function toggleRepSearchMode(){
    // 🔑 legacy helper: cycles through the 4 HomeoSetu search types
    var idx = REP_SEARCH_TYPES.indexOf(repSearchMode);
    repSearchMode = REP_SEARCH_TYPES[(idx+1) % REP_SEARCH_TYPES.length];
    updateRepSearchModeUI();
    _repSearchSeq++;
    _repSearchCache=''; _repSearchResults=null;
    var inp=document.getElementById('repBrowserSearch');
    if(inp && inp.value.trim().length>=2){ searchRepertoryBrowser(); }
    else { restoreRepSearchContext(); }
    showToast(repLangText(REP_TYPE_LABELS[repSearchMode] || REP_TYPE_LABELS.rubric));
}
function updateRepSearchModeUI(){
    // 🔑 v40: TWO toolbar dropdowns — TYPE (Rubric/Subrubric | Remedy | Rubric+Remedy | Clinical) + restored SCOPE (chapter/book/all)
    var tsel=document.getElementById('repTypeSelect');
    if(tsel&&tsel.value!==repSearchMode) tsel.value=repSearchMode;
    var ssel=document.getElementById('repScopeSelect');
    if(ssel&&ssel.value!==repSearchScope) ssel.value=repSearchScope;
    // 🔑 v42: placeholder میں 🔍 ہٹا دیا — ڈپلیکیٹ آئکن ختم؛ ایک ہی styled .rep-search-ico span رہتا ہے
    var placeholders = {
        rubric:       {ur:'ربرک / سب ربرک تلاش کریں... (مثلاً fear، headache)', en:'Search rubric / subrubric... (e.g. fear, headache)', roman:'Rubric / subrubric talash karein... (e.g. fear, headache)'},
        remedy:       {ur:'ادویہ تلاش کریں... (مثلاً nux vom، arsen)', en:'Search a remedy... (e.g. nux vom, arsen)', roman:'Adwiyeh talash karein... (e.g. nux vom, arsen)'},
        rubric_remedy:{ur:'ربرک اور ادویہ دونوں میں تلاش...', en:'Search rubrics and remedies both...', roman:'Rubric aur adwiyeh dono mein talash...'},
        clinical:     {ur:'کلینیکل حالت / اردو علامت... (مثلاً بخار، headache)', en:'Clinical condition / Urdu symptom... (e.g. بخار, headache)', roman:'Clinical condition / Urdu alaamat... (e.g. bukhar, headache)'}
    };
    var inp=document.getElementById('repBrowserSearch');
    if(inp){
        inp.placeholder = repLangText(placeholders[repSearchMode] || placeholders.rubric);
    }
}
// 🔑 search TYPE changed from the toolbar dropdown (HomeoSetu "Rubric / Subrubric" style)
function setRepSearchType(v){
    if(REP_SEARCH_TYPES.indexOf(v)===-1) return;
    if(v===repSearchMode && !repSearchAllBooks) return;
    repSearchMode=v; repSearchAllBooks=false;
    _repSearchSeq++;
    _repSearchCache=''; _repSearchResults=null;
    updateRepSearchModeUI();
    var inp=document.getElementById('repBrowserSearch');
    if(inp&&inp.value.trim().length>=2){ searchRepertoryBrowser(); }
    else { restoreRepSearchContext(); }
}
// 🔑 v40 RESTORED: search SCOPE changed from the toolbar dropdown — Search in Open Chapter / Open Repertory / All Repertories
function setRepSearchScope(v){
    if(REP_SCOPE_ORDER.indexOf(v)===-1) return;
    if(v===repSearchScope && !repSearchAllBooks) return;
    repSearchScope=v;
    _repSearchSeq++;
    _repSearchCache=''; _repSearchResults=null;
    updateRepSearchModeUI();
    var inp=document.getElementById('repBrowserSearch');
    if(inp&&inp.value.trim().length>=2){ searchRepertoryBrowser(); }
    else { restoreRepSearchContext(); }
}
function showRepSearchPlaceholder(){
    var cd=document.getElementById('repRubricContent');
    if(!cd)return;
    // 🔑 chapter scope needs an open chapter
    if(repSearchScope==='chapter' && !repSearchAllBooks && !repCurrentChapter){
        cd.innerHTML='<div class="empty-state"><div class="icon">📖</div><p>'+repLangText({ur:'پہلے کوئی چیکٹر کھولیں، پھر سرچ کریں',en:'Open a chapter first, then search',roman:'Pehle koi chapter kholen, phir search karein'})+'</p></div>';
        return;
    }
    cd.innerHTML='<div class="empty-state"><div class="icon">📖</div><p>'+repLangText({ur:'سرچ کے لیے کم از کم 2 حرف لکھیں',en:'Type 2+ characters to search',roman:'Search ke liye kam az kam 2 harf likhein'})+'</p></div>';
}

// 🔑 book/chapter name helpers (chapter keys can be uppercase for kent, lowercase for others)
function getBookAbbr(bookKey){
    var info = REP_BOOK_INFO[bookKey];
    return info ? info.abbr : (bookKey||'?').substring(0,4);
}
function getChapterDisplayName(bookKey, chKey){
    // current book -> use repChapterNames
    if(bookKey===repCurrentBook){
        for(var i=0;i<repChapterNames.length;i++){
            if(String(repChapterNames[i].key).toLowerCase()===String(chKey).toLowerCase()) return repChapterNames[i].name;
        }
    }
    // any book -> use _allBookChapters cache
    var chs = _allBookChapters[bookKey];
    if(chs){
        for(var j=0;j<chs.length;j++){
            if(String(chs[j].key).toLowerCase()===String(chKey).toLowerCase()) return chs[j].name;
        }
    }
    // fallback: capitalize
    var s=String(chKey||'');
    return s.charAt(0).toUpperCase()+s.slice(1);
}
function normalizeChapterKey(bookKey, chKey){
    // return canonical lowercase-ish key matching the chapter FILE name
    if(bookKey===repCurrentBook){
        for(var i=0;i<repChapterNames.length;i++){
            if(String(repChapterNames[i].key).toLowerCase()===String(chKey).toLowerCase()) return repChapterNames[i].key;
        }
    }
    var chs = _allBookChapters[bookKey];
    if(chs){
        for(var j=0;j<chs.length;j++){
            if(String(chs[j].key).toLowerCase()===String(chKey).toLowerCase()) return chs[j].key;
        }
    }
    return String(chKey||'').toLowerCase();
}

// 🔑 Clinical Condition synonyms (English keyword groups — HomeoSetu "Clinical Condition" search mode)
var REP_CLINICAL_SYN={
    headache:['head','pain','cephalalgia'], migraine:['head','pain','hemicrania'],
    fever:['fever','heat','pyrexia','febrile'], cough:['cough','expectoration'],
    cold:['coryza','sneezing','nose','catarrh'], anxiety:['anxious','fear','apprehension','restless'],
    depression:['sadness','sad','despair','gloom','melancholy'], insomnia:['sleeplessness','sleep','sleepless','wakeful'],
    constipation:['constipation','stool','hard','inactive'], diarrhea:['diarrhoea','diarrhea','stool','loose','watery'],
    vomiting:['vomit','nausea','sickness'], nausea:['nausea','sickness','stomach'],
    vertigo:['vertigo','dizziness','giddiness'], weakness:['weak','exhaustion','prostration','fatigue'],
    pain:['pain','aching','sore','pains'], swelling:['swollen','swelling','edema','oedema','inflammation'],
    rash:['eruption','rash','skin','itching'], itching:['itch','itching','skin'],
    bleeding:['bleeding','hemorrhage','haemorrhage','blood'], acidity:['acidity','heartburn','eructation','stomach'],
    gas:['flatulence','distension','abdomen','eructation'], cramping:['cramp','colic','griping','pain'],
    burning:['burning','smarting','scalding'], thirst:['thirst','thirstless','drinks'],
    appetite:['appetite','hunger','craving','aversion'], backache:['back','pain','lumbago'],
    jointpain:['joints','pain','arthritic','stiffness'], earache:['ear','pain','otitis'],
    sorethroat:['throat','pain','swallowing','tonsils'], breathless:['respiration','breathing','dyspnoea','dyspnea','asthma']
};

var _repSearchCache='',_repSearchResults=null,_repSearchMode='';
function searchRepertoryBrowser(){
    var inp=document.getElementById('repBrowserSearch');
    var qRaw=inp?(inp.value||''):'';
    var q=qRaw.trim();
    if(q.length<2){
        _repSearchSeq++;
        _repSearchCache=''; _repSearchResults=null; _repSearchMode='';
        if(q.length===0) restoreRepSearchContext();
        else showRepSearchPlaceholder();
        return;
    }
    rememberRepSearchContext();
    repCurrentDetail=null; repClipViewOpen=false;repWorkbenchOpen=false;repCompareOpen=false;repAnalysisOpen=-1;   // new search leaves detail/clipboard view
    var searchSeq = ++_repSearchSeq;
    var cd=document.getElementById('repRubricContent');
    cd.innerHTML='<div style="text-align:center;padding:20px;">🔍 '+repLangText({ur:'تلاش جاری ہے...',en:'Searching...',roman:'Search ho raha hai...'})+((repSearchAllBooks||repSearchScope==='all')?' <br><small style="font-size:10px;">('+repLangText({ur:'تمام ریپرٹریز لوڈ ہو رہی ہیں — تھوڑا وقفہ',en:'loading all repertories — one moment',roman:'tamam repertories load ho rahi hain — ek lamha'})+')</small>':'')+'</div>';

    // legacy @chapter filter
    var chF=null,ai=q.indexOf('@');
    if(ai!==-1){
        var aa=q.substring(ai+1).split(/\s+/)[0],cf=aa.toLowerCase();
        repChapterNames.forEach(function(c){if(c.name.toLowerCase().indexOf(cf)!==-1)chF=c.key;});
        q=(q.substring(0,ai)+q.substring(ai+1+aa.length)).trim();
        if(q.length<2){ showRepSearchPlaceholder(); return; }
    }

    var cacheKey=q+'|'+(chF||'')+'|'+repSearchMode+'|'+repSearchScope+'|'+(repSearchAllBooks?'sb':'')+'|'+repCurrentChapter+'|'+repCurrentBook;
    if(cacheKey===_repSearchCache && _repSearchResults!==null && !repSearchAllBooks && repSearchScope!=='all'){
        displaySearchResults(_repSearchResults.results,_repSearchResults.info);
        return;
    }
    _repSearchCache=cacheKey; _repSearchMode=repSearchMode;
    q=q.toLowerCase();
    // 🔑 v70: بولین سرچ — خالی جگہ = AND، «OR» یا «|» = متبادل، «NOT لفظ» یا «-لفظ» = خارج
    var _qb=repParseBoolQuery(q);
    var qw=_qb.pos;

    function searchStillActive(){
        var activeInp=document.getElementById('repBrowserSearch');
        return searchSeq===_repSearchSeq && activeInp && activeInp.value.trim().length>=2;
    }
    function matchesText(text){
        if(!text) return false;
        return repBoolMatch(_qb,text);
    }
    // 🔑 Remedy-type matching: normalized bidirectional containment ("nux vom" → nux-v, "arsen" → arsenicum)
    function normRem(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''); }
    var _remQ=null;
    function remQ(){ if(!_remQ)_remQ=qw.map(normRem).filter(function(s){return s.length>=2;}); return _remQ; }
    function matchedRemedyMap(rub){
        var rq=remQ(); if(!rq.length) return null;
        var out=null, rems=rub&&rub.r?Object.keys(rub.r):[];
        for(var i=0;i<rems.length;i++){
            var na=normRem(rems[i]); if(!na)continue;
            for(var j=0;j<rq.length;j++){
                if(na.indexOf(rq[j])!==-1||rq[j].indexOf(na)!==-1){ if(!out)out={}; out[rems[i]]=1; break; }
            }
        }
        return out;
    }
    function remedyMatchRubric(rub){ return !!matchedRemedyMap(rub); }
    // 🔑 Clinical Condition matching: synonym groups + Urdu→English reverse glossary
    var _clinGroups=null;
    function clinicalMatchText(text){
        if(!_clinGroups) return matchesText(text);
        var lt=String(text||'').toLowerCase(); if(!lt)return false;
        for(var i=0;i<_clinGroups.length;i++){
            var g=_clinGroups[i],ok=false;
            for(var j=0;j<g.length;j++){ if(lt.indexOf(g[j])!==-1){ok=true;break;} }
            if(!ok)return false;
        }
        return true;
    }
    function buildClinicalGroups(cb){
        ensureRepGlossary(function(){
            var groups=[];
            var W=(_repGlossary&&_repGlossary.words)||{};
            qw.forEach(function(w){
                var set={}; if(w.length>=2)set[w]=1;
                (REP_CLINICAL_SYN[w]||[]).forEach(function(s){ if(s.length>=2)set[s]=1; });
                if(/[^\x00-\x7F]/.test(w)){   // Urdu query → English keys whose translation contains it
                    var n=0;
                    for(var ek in W){ if(n>=12)break; var e=W[ek]; if(e&&e.ur&&String(e.ur).indexOf(w)!==-1){ set[ek]=1; n++; } }
                }
                var arr=Object.keys(set); if(arr.length)groups.push(arr);
            });
            _clinGroups=groups.length?groups:null;
            cb();
        });
    }
    function matchRubric(rub,t){
        if(repSearchMode==='remedy') return remedyMatchRubric(rub);
        if(repSearchMode==='rubric_remedy') return matchesText(t)||remedyMatchRubric(rub);
        if(repSearchMode==='clinical') return clinicalMatchText(t);
        return matchesText(t);
    }
    function scanData(sd, bookKey, chFilter){
        var out=[];
        var chs = chFilter ? [chFilter] : Object.keys(sd);
        chs.forEach(function(ck){
            var rubs=sd[ck]; if(!rubs)return;
            Object.keys(rubs).forEach(function(rid){
                var rub=rubs[rid]; if(!rub)return;
                var t=rub.path||rub.de_path||rub.t||'';
                if(matchRubric(rub,t)){
                    var o={text:t, remedies:rub.r||{}, chapter:ck, rid:rid, book:bookKey};
                    if(repSearchMode==='remedy'||repSearchMode==='rubric_remedy'){ var m=matchedRemedyMap(rub); if(m)o.matched=m; }
                    out.push(o);
                }
            });
        });
        return out;
    }
    function finalize(r){
        if(!searchStillActive()) return;
        // sort: book abbr -> chapter name -> text
        r.sort(function(a,b){
            var ba=getBookAbbr(a.book), bb=getBookAbbr(b.book);
            if(ba!==bb) return ba.localeCompare(bb);
            var ca=getChapterDisplayName(a.book,a.chapter).toLowerCase();
            var cb=getChapterDisplayName(b.book,b.chapter).toLowerCase();
            if(ca!==cb) return ca.localeCompare(cb);
            return a.text.localeCompare(b.text);
        });
        var total=r.length;
        var perBookCount={};
        for(var i=0;i<r.length;i++){
            var bk=r[i].book;
            perBookCount[bk]=(perBookCount[bk]||0)+1;
        }
        var info = buildSearchInfo(total, perBookCount);
        _repSearchResults={results:r, info:info, total:total};
        displaySearchResults(r, info);
    }
    function buildSearchInfo(total, perBookCount){
        var typeLabel = repLangText(REP_TYPE_LABELS[repSearchMode] || REP_TYPE_LABELS.rubric);
        // 🔑 v40: scope label from the restored SCOPE dropdown (chapter | book | all) or sidebar all-books
        var scopeLabel;
        if(repSearchAllBooks || repSearchScope==='all'){
            scopeLabel = repLangText({ur:'🌐 تمام ریپرٹریز',en:'🌐 ALL repertories',roman:'🌐 Tamam repertories'});
        } else if(repSearchScope==='chapter'){
            scopeLabel = repLangText({ur:'📖 کھلے چیکٹر میں',en:'📖 in open chapter',roman:'📖 khule chapter mein'});
        } else {
            scopeLabel = repLangText({ur:'📚 اس ریپرٹری میں',en:'📚 in this repertory',roman:'📚 is repertory mein'});
        }
        var info='🔍 '+typeLabel+' &nbsp;"'+escapeHtml(qw.join(' '))+'" '+scopeLabel;
        if(chF){ info+=' '+repLangText({ur:'میں',en:'in',roman:'mein'})+' <b>'+escapeHtml(getChapterDisplayName(repCurrentBook,chF))+'</b>'; }
        info+=' → <b>'+total.toLocaleString()+'</b> '+repLangText({ur:'ربرکس',en:'rubrics',roman:'rubrics'});
        // show per-book breakdown in all-books mode; no cap, all matching rubrics are displayed.
        if(repSearchAllBooks && perBookCount){
            var parts=[];
            Object.keys(perBookCount).forEach(function(bk){
                var bi=REP_BOOK_INFO[bk]; if(!bi)return;
                parts.push(bi.abbr+':'+perBookCount[bk].toLocaleString());
            });
            if(parts.length>1) info+=' <small style="color:#555;">('+parts.join(' · ')+')</small>';
        }
        return info;
    }

    function runIncrementalAllSearch(){
        if(!searchStillActive()) return;
        var books = [repCurrentBook];
        Object.keys(REP_BOOK_INFO).forEach(function(bk){ if(bk!==repCurrentBook) books.push(bk); });
        var allResults=[];
        var perBookCount={};
        var total=0;
        var completed=0;
        var rc=document.getElementById('repRubricContent');
        if(!rc) return;
        var statusText = repLangText({ur:'شروع ہو رہا ہے...',en:'Starting...',roman:'Start ho raha hai...'});
        function countsText(){
            var parts=[];
            Object.keys(perBookCount).forEach(function(bk){
                var bi=REP_BOOK_INFO[bk]; if(bi) parts.push(bi.abbr+':'+perBookCount[bk].toLocaleString());
            });
            return parts.length ? ' <small style="color:#555;">('+parts.join(' · ')+')</small>' : '';
        }
        function currentInfoHtml(){
            var typeLabel = repLangText(REP_TYPE_LABELS[repSearchMode] || REP_TYPE_LABELS.rubric);
            return '🔍 '+typeLabel+' — '+repLangText({ur:'🌐 تمام ریپرٹریز کے تمام چیپٹرز',en:'🌐 ALL repertories — all chapters',roman:'🌐 Tamam repertories ke tamam chapters'})+' &nbsp;"'+escapeHtml(qw.join(' '))+'" → <b>'+total.toLocaleString()+'</b> '+repLangText({ur:'ربرکس',en:'rubrics',roman:'rubrics'})+countsText();
        }
        function updateHeader(msg){
            var infoEl=document.getElementById('repAllSearchInfo');
            var statusEl=document.getElementById('repAllSearchStatus');
            if(infoEl) infoEl.innerHTML=currentInfoHtml();
            if(statusEl) statusEl.innerHTML=msg || statusText;
        }
        rc.innerHTML='<div id="repAllSearchInfo" style="margin-bottom:8px;padding:8px 12px;background:#e8f4f8;border-radius:6px;font-size:13px;">'+currentInfoHtml()+'</div>'+
            '<div id="repAllSearchStatus" style="margin-bottom:10px;padding:6px 10px;background:#fff7e6;border:1px solid #f5c16c;border-radius:5px;font-size:11px;color:#7d6608;">'+statusText+'</div>'+
            '<div style="margin-bottom:10px;font-size:11px;color:#7f8c8d;">'+repLangText({ur:'پہلے موجودہ ریپرٹری کے نتائج آ رہے ہیں، پھر باقی ریپرٹریز ایک ایک کر کے شامل ہوں گی۔',en:'Current repertory results appear first; the remaining repertories are added one by one.',roman:'Pehle current repertory ke results, phir baqi repertories aik aik kar ke add hongi.'})+'</div>'+
            '<div id="repAllSearchResults"></div>';
        function truncateTitle(t){return String(t||'').length>180?String(t).substring(0,177)+'...':String(t||'');}
        function highlightMatches(escapedHtml, queryWords){
            var res=escapedHtml;
            queryWords.forEach(function(w){
                if(w.length<2) return;
                var re=new RegExp('('+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
                res=res.replace(re,'<mark style="background:#ffeb3b;color:#000;padding:0 2px;border-radius:2px;">$1</mark>');
            });
            return res;
        }
        function itemHtml(r, state){
            var h='';
            var bookInfo = REP_BOOK_INFO[r.book] || {abbr:'?', name:r.book};
            var chName = getChapterDisplayName(r.book, r.chapter);
            var groupKey = r.book+'|'+r.chapter;
            if(groupKey !== state.lastGroup){
                var isCur = (r.book===repCurrentBook && String(r.chapter).toLowerCase()===String(repCurrentChapter).toLowerCase());
                var badgeColor = repBookColor(r.book);
                h+='<div style="margin:10px 0 4px 0;padding:6px 10px;background:'+(isCur?'#eafaf1':'#f4f6f8')+';border-right:4px solid '+(isCur?'#27ae60':badgeColor)+';border-radius:4px;font-weight:bold;font-size:12px;color:#1a5276;font-family:Segoe UI,sans-serif;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">';
                h+='<span style="background:'+badgeColor+';color:white;padding:1px 7px;border-radius:8px;font-size:10px;">'+bookInfo.abbr+'</span>';
                h+=(isCur?'📍':'📂')+' '+escapeHtml(chName);
                h+='<span style="font-size:10px;color:#7f8c8d;font-weight:normal;">'+escapeHtml(bookInfo.name)+'</span>';
                if(isCur) h+='<span style="font-size:10px;color:#27ae60;font-weight:normal;">'+repLangText({ur:'(کھلا ہوا)',en:'(open)',roman:'(open)'})+'</span>';
                h+='</div>';
                state.lastGroup = groupKey;
            }
            var highlighted = highlightMatches(escapeHtml(truncateTitle(r.text)), qw);
            var safeBook = escapeHtml(r.book);
            var safeChapter = escapeHtml(normalizeChapterKey(r.book, r.chapter));
            var safeRid = escapeHtml(String(r.rid||''));
            var badge = repBookColor(r.book);
            h+='<div class="rep-rubric-item" style="cursor:pointer;border-radius:6px;margin:2px 0;padding:8px 10px;background:#fff;border:1px solid #eef2f5;" onclick="navigateToRubric(\''+safeBook+'\',\''+safeChapter+'\',\''+safeRid+'\')" onmouseover="this.style.background=\'#f0f8ff\'" onmouseout="this.style.background=\'#fff\'">';
            h+='<div class="rep-rubric-header" style="font-size:13px;line-height:1.5;">'+repCmpChkHtml(r.book,normalizeChapterKey(r.book,r.chapter),String(r.rid||''),String(r.text||''),Object.keys(r.remedies||{}).length,'sr')+'<span style="display:inline-block;background:'+badge+';color:white;padding:1px 6px;border-radius:5px;font-size:9px;font-weight:bold;margin-left:4px;vertical-align:middle;">'+bookInfo.abbr+'</span> '+highlighted+'</div>';
            h+='<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:2px;">';
            var rems=Object.keys(r.remedies||{});
            rems.sort(function(a,b){return(r.remedies[b]||1)-(r.remedies[a]||1)||a.localeCompare(b);});
            rems.slice(0,40).forEach(function(abbr){var g=r.remedies[abbr]||1;h+='<span class="rep-remedy-tag g'+g+((r.matched&&r.matched[abbr])?' rem-hl':'')+'" onclick="event.stopPropagation();copyRemedyToPrescription(\''+escapeHtml(abbr)+'\')">'+escapeHtml(abbr)+'</span>';});
            if(rems.length>40) h+='<span style="font-size:10px;color:#7f8c8d;align-self:center;">+'+(rems.length-40)+' more</span>';
            h+='</div><div style="margin-top:4px;font-size:10px;color:#2980b9;font-weight:bold;">'+repLangText({ur:'↩ یہاں کھولیں',en:'↩ open here',roman:'↩ yahan kholen'})+'</div></div>';
            return h;
        }
        function appendBookResults(bookKey, results, done){
            if(!searchStillActive()) return;
            var container=document.getElementById('repAllSearchResults');
            if(!container) return;
            var bookInfo=REP_BOOK_INFO[bookKey] || {abbr:'?', name:bookKey};
            var color = repBookColor(bookKey);
            container.insertAdjacentHTML('beforeend','<div style="margin:12px 0 6px 0;padding:8px 10px;background:#eef7fb;border-left:4px solid '+color+';border-radius:6px;font-weight:bold;color:#1a5276;"><span style="background:'+color+';color:white;padding:2px 8px;border-radius:10px;font-size:10px;margin-right:5px;">'+bookInfo.abbr+'</span> '+escapeHtml(bookInfo.name)+' — '+results.length.toLocaleString()+' '+repLangText({ur:'نتائج',en:'results',roman:'results'})+'</div>');
            if(results.length===0){
                container.insertAdjacentHTML('beforeend','<div style="padding:8px 12px;color:#95a5a6;font-size:12px;">'+repLangText({ur:'اس ریپرٹری میں کوئی نتیجہ نہیں ملا',en:'No result in this repertory',roman:'Is repertory mein koi result nahi'})+'</div>');
                if(done) setTimeout(done,0);
                return;
            }
            var idx=0, chunk=80, state={lastGroup:null};
            function addChunk(){
                if(!searchStillActive()) return;
                var html='';
                var end=Math.min(idx+chunk, results.length);
                for(var i=idx;i<end;i++) html += itemHtml(results[i], state);
                container.insertAdjacentHTML('beforeend', html);
                idx=end;
                updateHeader(repLangText({ur:'نتائج شامل ہو رہے ہیں...',en:'Adding results...',roman:'Results add ho rahe hain...'})+' '+bookInfo.abbr+' '+idx.toLocaleString()+'/'+results.length.toLocaleString());
                if(idx<results.length) setTimeout(addChunk, 0);
                else if(done) setTimeout(done, 0);
            }
            addChunk();
        }
        function processBook(pos){
            if(!searchStillActive()) return;
            if(pos>=books.length){
                updateHeader(repLangText({ur:'✅ تمام ریپرٹریز مکمل ہو گئیں',en:'✅ All repertories loaded',roman:'✅ Tamam repertories complete'}));
                if(total===0){
                    var cont=document.getElementById('repAllSearchResults');
                    if(cont) cont.innerHTML='<div class="empty-state"><div class="icon">🔍</div><p>'+repLangText({ur:'کوئی ربرک نہیں ملی',en:'No rubrics found',roman:'Koi rubric nahi mili'})+'</p></div>';
                }
                return;
            }
            var bk=books[pos];
            var bi=REP_BOOK_INFO[bk] || {abbr:bk, name:bk};
            updateHeader(repLangText({ur:'لوڈ ہو رہی ہے:',en:'Loading:',roman:'Load ho rahi hai:'})+' <b>'+escapeHtml(bi.name)+'</b> ('+(pos+1)+'/'+books.length+')');
            loadSingleBookData(bk, function(sd){
                if(!searchStillActive()) return;
                ensureSingleBookIndex(bk, sd, function(){
                    if(!searchStillActive()) return;
                    var results = sd ? scanData(sd, bk, null) : [];
                    results.sort(function(a,b){
                        var ca=getChapterDisplayName(a.book,a.chapter).toLowerCase();
                        var cb=getChapterDisplayName(b.book,b.chapter).toLowerCase();
                        if(ca!==cb) return ca.localeCompare(cb);
                        return a.text.localeCompare(b.text);
                    });
                    perBookCount[bk]=results.length;
                    total += results.length;
                    completed++;
                    allResults = allResults.concat(results);
                    var info=currentInfoHtml();
                    _repSearchResults={results:allResults.slice(), info:info, total:total, incremental:true};
                    repLastSearchView={results:allResults.slice(), info:info, incremental:true};
                    updateHeader(repLangText({ur:'مل گئے:',en:'Found:',roman:'Mil gaye:'})+' <b>'+results.length.toLocaleString()+'</b> '+bi.abbr+' — '+completed+'/'+books.length);
                    appendBookResults(bk, results, function(){ processBook(pos+1); });
                });
            });
        }
        processBook(0);
    }

    // ---------- mode routing ----------
    // 🔑 v40: search TYPE (rubric | remedy | rubric_remedy | clinical) × restored SCOPE (chapter | book | all)
    // sidebar all-books flag also routes to the all-repertories engine
    var scopeAll = repSearchAllBooks || repSearchScope==='all';
    var scopeChapter = (!scopeAll && repSearchScope==='chapter');
    if(scopeChapter && !repCurrentChapter){
        // open-chapter scope without an open chapter — ask the user to open one first
        cd.innerHTML='<div class="empty-state"><div class="icon">📖</div><p>'+repLangText({ur:'پہلے کوئی چیکٹر کھولیں، پھر سرچ کریں',en:'Open a chapter first, then search',roman:'Pehle koi chapter kholen, phir search karein'})+'</p></div>';
        return;
    }
    // effective single-chapter filter: chapter-scope wins over the legacy @chapter filter
    var scopeChFilter = scopeChapter ? normalizeChapterKey(repCurrentBook, repCurrentChapter) : chF;
    if(repSearchMode==='clinical'){
        // clinical matching needs the glossary (Urdu→English reverse lookup) → build synonym groups first
        cd.innerHTML='<div style="text-align:center;padding:20px;">🏥 '+repLangText({ur:'کلینیکل ہم معنی تیار ہو رہے ہیں (لغت لوڈ ہو رہی ہے)...',en:'Preparing clinical synonyms (loading glossary)...',roman:'Clinical hum-maani tayyar ho rahe hain...'})+'</div>';
        buildClinicalGroups(function(){
            if(!searchStillActive()) return;
            if(scopeAll){ setTimeout(runIncrementalAllSearch,10); return; }
            setTimeout(function(){
                if(!searchStillActive()) return;
                function ds(sd){ finalize(scanData(sd, repCurrentBook, scopeChFilter)); }
                if(_repFullData!==null){ ds(_repFullData); } else { loadRepData(function(d){ ds(d); }); }
            },10);
        });
        return;
    }
    if(scopeAll){
        // 🌐 All Repertories scope — incremental search over ALL repertories with the chosen type
        setTimeout(function(){
            if(!searchStillActive()) return;
            runIncrementalAllSearch();
        },10);
        return;
    }
    // 📖 chapter scope (single chapter) / 📚 current-book search (all chapters, optional @chapter filter) — HomeoSetu style
    setTimeout(function(){
        if(!searchStillActive()) return;
        function ds(sd){ finalize(scanData(sd, repCurrentBook, scopeChFilter)); }
        if(_repFullData!==null){ ds(_repFullData); } else { loadRepData(function(d){ ds(d); }); }
    },10);
}

function loadRepData(cb){
    if(_repFullData!==null){ cb(_repFullData); return; }
    var info = REP_BOOK_INFO[repCurrentBook];
    fetch(info.dataFile + '?'+REP_DATA_V).then(function(r){return r.json();}).then(function(d){
        _repFullData=d; cb(d);
    }).catch(function(e){ console.error(e); });
}

// 🔑 load ALL books' data + their _index.json (for chapter names) — used by 'all' search mode
function loadAllBooksData(cb){
    var books = Object.keys(REP_BOOK_INFO);
    var needData = (_allBooksData===null);
    var needIdx = Object.keys(_allBookChapters).length < books.length;
    if(!needData && !needIdx){ cb(_allBooksData); return; }
    var dataResult = needData ? {} : _allBooksData;
    var pending = 0;
    if(needData) pending += books.length;
    if(needIdx) pending += books.length;
    function done(){ if(pending<=0){ _allBooksData=dataResult; cb(dataResult); } }
    books.forEach(function(bk){
        var info = REP_BOOK_INFO[bk];
        if(needData){
            fetch(info.dataFile + '?'+REP_DATA_V).then(function(r){return r.json();}).then(function(d){
                dataResult[bk]=d; pending--; done();
            }).catch(function(e){ console.error('data load fail',bk,e); pending--; done(); });
        }
        if(needIdx){
            fetch(info.chapDir+'_index.json?'+REP_DATA_V).then(function(r){return r.json();}).then(function(d){
                _allBookChapters[bk]=d; pending--; done();
            }).catch(function(e){
                // 🔑 fallback: build index from the data file's chapter keys (e.g. kent_de has no _index.json)
                console.warn('index missing for',bk,'— building from data');
                var src = dataResult[bk] || (needData ? null : (_allBooksData[bk]||null));
                if(src){
                    _allBookChapters[bk] = Object.keys(src).map(function(k){
                        return {key:k, name:k.replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}), rubrics:Object.keys(src[k]||{}).length};
                    });
                } else {
                    _allBookChapters[bk]=[];
                }
                pending--; done();
            });
        }
    });
}



function displaySearchResults(results, info){
    var rc=document.getElementById('repRubricContent'); if(!rc)return;
    if(results.length===0){
        rc.innerHTML='<div class="empty-state"><div class="icon">🔍</div><p>'+(currentLang==='ur'?'کوئی ربرک نہیں ملی':'No rubrics found')+'</p></div>';
        repRenderDock();
        return;
    }
    function truncateTitle(t){return t.length>180?t.substring(0,177)+'...':t;}
    function highlightMatches(escapedHtml, queryWords){
        var res=escapedHtml;
        queryWords.forEach(function(w){
            if(w.length<2) return;
            var re=new RegExp('('+w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
            res=res.replace(re,'<mark style="background:#ffeb3b;color:#000;padding:0 2px;border-radius:2px;">$1</mark>');
        });
        return res;
    }
    var qw=repParseBoolQuery((_repSearchCache.split('|')[0]||'').toLowerCase()).pos;
    var curCh=repCurrentChapter;
    var curBook=repCurrentBook;
    // 🔑 save this search view so the "back to results" button can restore it
    repLastSearchView = {results: results.slice(), info: info};

    var h='<div style="margin-bottom:8px;padding:8px 12px;background:#e8f4f8;border-radius:6px;font-size:13px;">'+info+'</div>';
    h+='<div style="margin-bottom:10px;font-size:11px;color:#7f8c8d;">'+(currentLang==='ur'?'کسی بھی ربرک پر کلک کریں → وہ چیکٹر کھل کر اس ربرک پر اسکرول ہو گا | مخفف: Pub=Publicum, Kent, K-DE=Kent German, Syn=Synthesis':'Click any rubric → opens its chapter & scrolls to it | Abbreviations: Pub, Kent, K-DE, Syn')+'</div>';

    var lastGroup=null;
    results.forEach(function(r){
        var bookInfo = REP_BOOK_INFO[r.book] || {abbr:'?', name:r.book};
        var chName = getChapterDisplayName(r.book, r.chapter);
        var groupKey = r.book+'|'+r.chapter;
        // 🔑 group header whenever book OR chapter changes — keeps results clean & tells you the source
        if(groupKey !== lastGroup){
            var isCur = (r.book===curBook && String(r.chapter).toLowerCase()===String(curCh).toLowerCase());
            var badgeColor = repBookColor(r.book);
            h+='<div style="margin:10px 0 4px 0;padding:6px 10px;background:'+(isCur?'#eafaf1':'#f4f6f8')+';border-right:4px solid '+(isCur?'#27ae60':badgeColor)+';border-radius:4px;font-weight:bold;font-size:12px;color:#1a5276;font-family:Segoe UI,sans-serif;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">';
            h+='<span style="background:'+badgeColor+';color:white;padding:1px 7px;border-radius:8px;font-size:10px;">'+bookInfo.abbr+'</span>';
            h+=(isCur?'📍':'📂')+' '+escapeHtml(chName);
            h+='<span style="font-size:10px;color:#7f8c8d;font-weight:normal;">'+escapeHtml(bookInfo.name)+'</span>';
            if(isCur) h+='<span style="font-size:10px;color:#27ae60;font-weight:normal;">'+(currentLang==='ur'?'(کھلا ہوا)':'(open)')+'</span>';
            h+='</div>';
            lastGroup = groupKey;
        }
        var displayText = truncateTitle(r.text);
        var highlighted = highlightMatches(escapeHtml(displayText), qw);
        var safeBook = escapeHtml(r.book);
        var safeChapter = escapeHtml(normalizeChapterKey(r.book, r.chapter));
        var safeRid = escapeHtml(String(r.rid||''));
        h+='<div class="rep-rubric-item" style="cursor:pointer;border-radius:6px;margin:2px 0;padding:8px 10px;background:#fff;border:1px solid #eef2f5;" onclick="navigateToRubric(\''+safeBook+'\',\''+safeChapter+'\',\''+safeRid+'\')" onmouseover="this.style.background=\'#f0f8ff\'" onmouseout="this.style.background=\'#fff\'">';
        // 🔑 [BookAbbr] instead of #rid (reference number hidden, repertory abbreviation shown)
        h+='<div class="rep-rubric-header" style="font-size:13px;line-height:1.5;">'+repCmpChkHtml(r.book,normalizeChapterKey(r.book,r.chapter),String(r.rid||''),String(r.text||''),Object.keys(r.remedies||{}).length,'sr')+'<span style="display:inline-block;background:'+repBookColor(r.book)+';color:white;padding:1px 6px;border-radius:5px;font-size:9px;font-weight:bold;margin-left:4px;vertical-align:middle;">'+bookInfo.abbr+'</span> '+highlighted+'</div>';
        h+='<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:2px;">';
        var rems=Object.keys(r.remedies);
        rems.sort(function(a,b){return(r.remedies[b]||1)-(r.remedies[a]||1)||a.localeCompare(b);});
        var remsShown=rems.slice(0,40);
        remsShown.forEach(function(abbr){var g=r.remedies[abbr]||1;h+='<span class="rep-remedy-tag g'+g+((r.matched&&r.matched[abbr])?' rem-hl':'')+'" onclick="event.stopPropagation();copyRemedyToPrescription(\''+escapeHtml(abbr)+'\')">'+escapeHtml(abbr)+'</span>';});
        if(rems.length>40) h+='<span style="font-size:10px;color:#7f8c8d;align-self:center;">+'+(rems.length-40)+' more</span>';
        h+='</div>';
        h+='<div style="margin-top:4px;font-size:10px;color:#2980b9;font-weight:bold;">'+(currentLang==='ur'?'↩ یہاں کھولیں':'↩ open here')+'</div>';
        h+='</div>';
    });
    rc.innerHTML=h;
    rc.scrollTop=0;
    repRenderDock();
}

// 🔑 PRECISE navigation: open the chapter (in the right book) and scroll/flash the exact rubric (by ID)
function navigateToRubric(bookKey, chKey, rid, openDetail){
    if(!chKey){ return; }
    rid = String(rid||'');
    bookKey = bookKey || repCurrentBook;
    chKey = normalizeChapterKey(bookKey, chKey);
    repWorkbenchOpen=false; repCompareOpen=false; repAnalysisOpen=-1;   // tool views close on navigation

    // 🔑 different book -> switch book first, then load chapter with nav
    if(bookKey !== repCurrentBook){
        var sel = document.getElementById('repBookSelect');
        if(sel) sel.value = bookKey;
        repCurrentBook = bookKey;
        repCurrentChapter = '';
        repTreeCache = {};
        _repFullData = null;
        repRidToFlatIndex = {};
        repCurrentFlatTree = [];
        repCurrentDetail = null; repClipViewOpen = false;
        if(typeof initRepertoryBrowser === 'function') initRepertoryBrowser(true);   // 🔑 v45: آٹو-مائنڈ نہیں — منزل نیچے setTimeout میں ہے
        showToast((currentLang==='ur'?'🔄 ریپرٹری بدلی: ':'🔄 Switched to ')+ (REP_BOOK_INFO[bookKey]?REP_BOOK_INFO[bookKey].name:bookKey));
        if(openDetail) repPendingDetail={rid:rid};
        setTimeout(function(){ selectChapter(chKey, rid); }, 700);
        return;
    }

    // 🔑 same book, same chapter already rendered -> jump+flash (folder view)
    if(repCurrentChapter===chKey && repCurrentTree){
        var entry = repRidPathMap ? repRidPathMap[rid] : null;
        if(entry){
            if(openDetail){
                repHistBack.push(repCurrentState()); repHistFwd=[];
                repFolderPath = entry.path.slice(0,-1);
                repCurrentDetail = {full:entry.fullPath, rid:rid, labels:entry.path.slice()};
                renderChapterList();
                renderRubricDetail();
                return;
            }
            repFolderPath = entry.path.slice(0,-1);   // parent folder of the target rubric
            repFolderFilter = '';
            repTreePage = 0;
            repPendingNavRid = rid;                   // renderFolderCards will flash it
            renderFolderView();
            return;
        }
    }
    // load chapter; renderTree will pick up the pending rid
    if(openDetail) repPendingDetail={rid:rid};
    selectChapter(chKey, rid);
}

// 🔑 "back to search results" — restores the last search view
function backToSearchResults(){
    if(repLastSearchView){
        displaySearchResults(repLastSearchView.results, repLastSearchView.info);
        showToast(currentLang==='ur'?'↩ سرچ رزلٹس پر واپس':'↩ Back to search results');
    }
}
// 🔑 flash + scroll the row carrying data-rid="rid"
function flashRubricRow(rid){
    var cd=document.getElementById('repRubricContent');
    if(!cd) return;
    var row=null;
    if(window.CSS && window.CSS.escape){ row=cd.querySelector('[data-rid="'+window.CSS.escape(rid)+'"]'); }
    if(!row){
        var all=cd.querySelectorAll('[data-rid]');
        for(var i=0;i<all.length;i++){ if(all[i].getAttribute('data-rid')===rid){ row=all[i]; break; } }
    }
    if(!row) return;
    row.scrollIntoView({behavior:'smooth', block:'center'});
    row.style.transition='background 0.4s';
    row.style.background='#fff3cd';
    row.style.boxShadow='0 0 0 3px #f39c12';
    var ring=row.querySelector('.rep-rubric-main, .rep-rubric-name, .rpc-title, .rpl-name');
    if(ring){ ring.style.color='#d68910'; }
    setTimeout(function(){
        row.style.background='';
        row.style.boxShadow='';
        if(ring) ring.style.color='';
    }, 3500);
}

function copyRemedyToPrescription(abbr){if(navigator.clipboard){navigator.clipboard.writeText(abbr).then(function(){if(typeof showToast==='function')showToast('✅ Copied: '+abbr);});}}

// 🔑 load persisted clipboards + first dock render
repClipsLoad();
if(typeof document!=='undefined'){
    (function(){
        var f=function(){ repRenderDock(); repCmpSyncUI(); };
        if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',f);
        else f();
    })();
}

function closeRepertoryChart(){document.getElementById('repChartOverlay').classList.remove('active');}

