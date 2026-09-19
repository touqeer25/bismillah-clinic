// ============================================================
// Bismillah Clinic — js/08-app-repertory.js
// REPERTORY BROWSER (books, chapters, tree, search)
// NOTE: Ye index.html ke inline script ka hissa hai (sirf jagah badli hai).
// WARNING: In files ka LOAD ORDER kabhi na badlein!
// ============================================================

// ==================== REPERTORY BROWSER ====================
// 🔑 per-book metadata so we can (a) load data/index files, (b) show abbreviations
var REP_BOOK_INFO = {
    publicum:    { abbr: 'Pub',  name: 'Repertorium Publicum', dataFile: 'repertory-data.json',                 chapDir: 'repertory_chapters/' },
    kent:        { abbr: 'Kent', name: 'Kent (English)',       dataFile: 'kent_repertory.json',                  chapDir: 'kent_chapters/' },
    kent_de:     { abbr: 'K-DE', name: 'Kent (German)',        dataFile: 'kent_de_repertory_by_key.json',        chapDir: 'kent_de_chapters/' },
    synthesis91: { abbr: 'Syn',  name: 'Syn 9.1 (Supplement)',  dataFile: 'synthesis91_raw_repertory_by_key.json', chapDir: 'synthesis91_raw_chapters/' }
};
var _allBooksData = null;       // {publicum:{...}, kent:{...}, ...} cache for all-books mode
var _allBookChapters = {};      // {publicum:[{key,name,rubrics}], ...} per-book chapter index (for name lookup)
var repLastSearchView = null;   // {results, info} saved for the "back to results" button
var repCurrentBook = 'publicum';
var repChapterNames = [];
var repCurrentChapter = '';
var repTreeCache = {};
var _repFullData = null;
var repCurrentChKey = '', repCurrentChName = '', repCurrentFlatTree = [];

/* ============================================================
   ابواب کی کلاسیکل ترتیب (Kent کی اصل ترتیب — سر سے پاؤں تک)
   کینٹ کی ریپرٹری اصل میں اسی ترتیب سے چھپی ہے: ذہن → چکر → سر → ...
   → جلد → عمومیات۔ پہلے یہ فہرست ہر بار الف بائی (A-Z) کر دی جاتی تھی
   جس سے کتاب کا اصل نظم ٹوٹ جاتا تھا۔ اب: کینٹ (انگریزی و جرمن) اسی
   کلاسیکل ترتیب میں، باقی کتابیں حسبِ سابق الف بائی۔
   ============================================================ */
var REP_KENT_CLASSICAL_ORDER = [
    'mind','vertigo','head','eye','vision','ear','hearing','nose','face','mouth',
    'teeth','throat','external_throat','stomach','abdomen','rectum','stool','bladder',
    'kidneys','prostate_gland','urethra','urine','genitalia_male','genitalia_female',
    'larynx_and_trachea','respiration','cough','expectoration','chest','back',
    'extremities','sleep','chill','fever','perspiration','skin','generalities'
];

/* جرمن کینٹ وہی کتاب ہے — یہ نقشہ جرمن ابواب کو اسی کلاسیکل ترتیب پر رکھتا ہے */
var REP_KENT_DE_ORDER = [
    'gemuet','schwindel','kopf','auge','sehen','ohr','gehoer','nase','gesicht','mund',
    'zaehne','hals','hals_aussenseite','magen','bauch','mastdarm','stuhl','blase',
    'nieren','prostata','harnroehre','urin','geschlechtsorgane_maennlich','geschlechtsorgane_weiblich',
    'kehlkopf_und_luftroehre','atmung','husten','auswurf','brust','ruecken',
    'extremitaeten','schlaf','frost','fieber','schweiss','haut','allgemeines'
];

/* کتاب کے مطابق ابواب کی ترتیب — نہ کہ ہر بار الف بائی */
function sortChaptersForBook(book, arr) {
    var order = book === 'kent' ? REP_KENT_CLASSICAL_ORDER
              : book === 'kent_de' ? REP_KENT_DE_ORDER
              : null;
    if (!order) {
        return arr.slice().sort(function(a, b) { return a.name.localeCompare(b.name); });
    }
    var pos = {};
    order.forEach(function(k, i) { pos[k] = i; });
    return arr.slice().sort(function(a, b) {
        var ia = (a.key in pos) ? pos[a.key] : 9999;
        var ib = (b.key in pos) ? pos[b.key] : 9999;
        if (ia !== ib) return ia - ib;
        return a.name.localeCompare(b.name);
    });
}

function switchRepertoryBook() {
    var sel = document.getElementById('repBookSelect');
    if (sel) repCurrentBook = sel.value;
    repCurrentChapter = ''; repTreeCache = {}; _repFullData = null;
    repHistBack = []; repHistFwd = []; repFolderPath = []; repFolderFilter = '';
    repPendingPath = null; repPendingNavRid = null;
    repCurrentDetail = null; repPendingDetail = null; repClipViewOpen = false;
    document.getElementById('repChapterList').innerHTML = '<div class="empty-state"><p>Loading...</p></div>';
    repRenderEmptyState();
    initRepertoryBrowser();
}


function initRepertoryBrowser() {
    var infoEl = document.getElementById('repCountInfo');
    if (infoEl) infoEl.textContent = 'Loading chapters...';
    
    function loadChaptersAndRender() {
        var basePath = repCurrentBook==='kent'?'kent_chapters/':(repCurrentBook==='kent_de'?'kent_de_chapters/':(repCurrentBook==='synthesis91'?'synthesis91_raw_chapters/':'repertory_chapters/'));
        var indexFile = basePath + '_index.json';
        fetch(indexFile).then(function(r){return r.json();}).then(function(data){
            // data is array of {key, name, rubrics}
            repChapterNames = sortChaptersForBook(repCurrentBook, data);
            var t=0; repChapterNames.forEach(function(c){t+=c.rubrics;});
            renderChapterList();
        }).catch(function(e){
            console.error('Failed to load index', e);
            // Fallback to hardcoded for kent
            if (repCurrentBook === 'kent') {
                repChapterNames = [{"key":"mind","name":"MIND","rubrics":4212},{"key":"vertigo","name":"VERTIGO","rubrics":523},{"key":"head","name":"HEAD","rubrics":6266},{"key":"eye","name":"EYE","rubrics":1723},{"key":"vision","name":"VISION","rubrics":933},{"key":"ear","name":"EAR","rubrics":1910},{"key":"hearing","name":"HEARING","rubrics":201},{"key":"nose","name":"NOSE","rubrics":1455},{"key":"face","name":"FACE","rubrics":2053},{"key":"mouth","name":"MOUTH","rubrics":1536},{"key":"teeth","name":"TEETH","rubrics":806},{"key":"throat","name":"THROAT INTERNAL","rubrics":1042},{"key":"external_throat","name":"EXTERNAL THROAT","rubrics":305},{"key":"stomach","name":"STOMACH","rubrics":2999},{"key":"abdomen","name":"ABDOMEN","rubrics":3200},{"key":"rectum","name":"RECTUM","rubrics":1209},{"key":"stool","name":"STOOL","rubrics":283},{"key":"bladder","name":"BLADDER","rubrics":820},{"key":"kidneys","name":"KIDNEYS","rubrics":355},{"key":"prostate_gland","name":"PROSTATE GLAND","rubrics":143},{"key":"urethra","name":"URETHRA","rubrics":607},{"key":"urine","name":"URINE","rubrics":465},{"key":"genitalia_male","name":"MALE GENITALIA","rubrics":1126},{"key":"genitalia_female","name":"FEMALE GENITALIA","rubrics":1400},{"key":"larynx_and_trachea","name":"LARYNX AND TRACHEA","rubrics":796},{"key":"respiration","name":"RESPIRATION","rubrics":719},{"key":"cough","name":"COUGH","rubrics":1442},{"key":"expectoration","name":"EXPECTORATION","rubrics":414},{"key":"chest","name":"CHEST","rubrics":3165},{"key":"back","name":"BACK","rubrics":3640},{"key":"extremities","name":"EXTREMITIES","rubrics":14915},{"key":"sleep","name":"SLEEP","rubrics":1014},{"key":"chill","name":"CHILL","rubrics":736},{"key":"fever","name":"FEVER","rubrics":586},{"key":"perspiration","name":"PERSPIRATION","rubrics":413},{"key":"skin","name":"SKIN","rubrics":1164},{"key":"generalities","name":"GENERALITIES","rubrics":1898}];
            } else {
                repChapterNames = [];
            }
            repChapterNames = sortChaptersForBook(repCurrentBook, repChapterNames);
            renderChapterList();
        });
    }

    loadChaptersAndRender();
    repRenderEmptyState();

}
function renderChapterList(f){
    var d=document.getElementById('repChapterList');if(!d)return;
    var ch=repChapterNames;
    if(f){f=f.toLowerCase();ch=ch.filter(function(c){return c.name.toLowerCase().indexOf(f)!==-1;});}
    var h='';
    ch.forEach(function(c){h+='<div class="rep-chapter-item'+(c.key===repCurrentChapter?' active':'')+'" onclick="repOpenChapter(\''+String(c.key).replace(/'/g,"\\'")+'\')" title="'+escapeHtml(c.name)+' ('+c.rubrics+' rubrics)"><span class="rep-ch-ico">📖</span><span class="rep-ch-name">'+escapeHtml(c.name)+'</span><span class="rep-ch-n">'+c.rubrics+'</span></div>';});
    if(!ch.length)h='<div style="text-align:center;padding:16px;color:#9fb0bf;font-size:12px;">'+(currentLang==='ur'?'کوئی باب نہیں ملا':'No chapters')+'</div>';
    d.innerHTML=h;
}

function selectChapter(chKey, navRid){
    repCurrentChapter=chKey;renderChapterList();
    var nm=chKey;repChapterNames.forEach(function(c){if(c.key===chKey)nm=c.name;});
    repPendingNavRid=navRid||null;   // 🔑 remember which rubric to scroll to after render
    var cd=document.getElementById('repRubricContent');if(!cd)return;
    cd.innerHTML='<div style="text-align:center;padding:30px;">Loading <b>'+nm+'</b>...</div>';
    if(repTreeCache[chKey]){renderTree(chKey,nm,repTreeCache[chKey]);return;}
    var basePath=repCurrentBook==='kent'?'kent_chapters/':(repCurrentBook==='kent_de'?'kent_de_chapters/':(repCurrentBook==='synthesis91'?'synthesis91_raw_chapters/':'repertory_chapters/'));
    fetch(basePath+chKey+'.json?v=8').then(function(r){return r.json();}).then(function(d){
        var tree=buildRubricTree(d);repTreeCache[chKey]=tree;renderTree(chKey,nm,tree);
    }).catch(function(e){
        // 🔑 fallback: chapter FILE missing (e.g. kent_de) -> extract chapter from book's full data file
        function extractFromFull(fullData){
            var subset=null;
            if(fullData){
                Object.keys(fullData).forEach(function(k){ if(String(k).toLowerCase()===String(chKey).toLowerCase()) subset=fullData[k]; });
            }
            if(subset){
                var tree=buildRubricTree(subset); repTreeCache[chKey]=tree; renderTree(chKey,nm,tree);
            } else {
                cd.innerHTML='<div style="text-align:center;padding:30px;color:#e74c3c;"><p>❌ Failed to load '+nm+'</p><p style="font-size:11px;">'+(e.message||'chapter not available')+'</p></div>';
            }
        }
        if(_repFullData!==null){ extractFromFull(_repFullData); }
        else { loadRepData(function(d){ _repFullData=d; extractFromFull(d); }); }
    });
}


function _repSplitCommaOutsideParentheses(txt){
    txt = String(txt || '').trim();
    if(!txt) return [];
    var parts=[], buf='', depth=0;
    for(var i=0;i<txt.length;i++){
        var ch = txt.charAt(i);
        if(ch === '('){ depth++; buf += ch; continue; }
        if(ch === ')'){ if(depth>0) depth--; buf += ch; continue; }
        if(ch === ',' && depth === 0){
            if(buf.trim()) parts.push(buf.trim());
            buf = '';
            while(i+1<txt.length && /\s/.test(txt.charAt(i+1))) i++;
            continue;
        }
        buf += ch;
    }
    if(buf.trim()) parts.push(buf.trim());
    return parts;
}

function _repSplitSynthesisPathForTree(txt){
    txt = String(txt || '').trim();
    if(!txt) return [];
    // Synthesis 9.1 uses ' - ' for hierarchy. Commas are usually part of
    // inverted rubric labels, e.g. 'Abdomen, in general', 'acids, after',
    // 'Anaemia, chlorosis'. Therefore do NOT split Synthesis on comma.
    var parts=[], buf='', depth=0;
    for(var i=0;i<txt.length;i++){
        var ch = txt.charAt(i);
        if(ch === '('){ depth++; buf += ch; continue; }
        if(ch === ')'){ if(depth>0) depth--; buf += ch; continue; }
        if(depth===0 && ch===' ' && txt.substr(i,3)===' - '){
            if(buf.trim()) parts.push(buf.trim());
            buf=''; i += 2; // skip the full ' - '
            continue;
        }
        buf += ch;
    }
    if(buf.trim()) parts.push(buf.trim());
    return parts;
}

function _repFindKentParentPath(path, pathSet){
    // Some repertories (Kent English + Repertorium Publicum/oorep) have many
    // meaningful commas inside a single rubric label. Their hierarchy is
    // determined by actual existing rubric paths, not by every comma. Example:
    //   BALL, as if, ascending to throat
    //   BALL, as if, ascending to throat, rolling in
    // The parent of the second line is the full first line, so the child label is
    // only "rolling in". This also keeps phrases like "Hypochondrium, left"
    // and "Liver, as if a ball in" together.
    var parent = '';
    var depth = 0;
    for(var i=0;i<path.length;i++){
        var ch = path.charAt(i);
        if(ch === '('){ depth++; continue; }
        if(ch === ')'){ if(depth>0) depth--; continue; }
        if(ch === ',' && depth === 0){
            var prefix = path.substring(0, i).trim();
            if(prefix && pathSet[prefix]) parent = prefix;
        }
    }
    return parent;
}

function _repMergeRemedies(dst, src){
    src = src || {};
    Object.keys(src).forEach(function(abbr){
        var g = parseInt(src[abbr], 10) || 1;
        if(!dst.hasOwnProperty(abbr) || g > (parseInt(dst[abbr],10)||1)) dst[abbr] = g;
    });
}

function _repBuildTreeByExistingRubrics(data){
    var root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    var entries=[];
    var pathSet=Object.create(null);

    Object.keys(data).forEach(function(rid){
        var r=data[rid];
        if(!r)return;
        var txt=String(r.path||r.de_path||r.t||'').replace(/\s+,/g, ',').replace(/,\s*/g, ', ').replace(/  +/g,' ').trim();
        if(!txt)return;
        entries.push({rid:rid, rec:r, path:txt});
        pathSet[txt]=true;
    });

    var parentByPath=Object.create(null);
    entries.forEach(function(e){
        parentByPath[e.path] = _repFindKentParentPath(e.path, pathSet);
    });

    var nodeByPath=Object.create(null);
    function ensureNode(path){
        if(nodeByPath[path]) return nodeByPath[path];
        var parentPath = parentByPath[path] || '';
        var parentNode = parentPath ? ensureNode(parentPath) : root;
        var label = parentPath ? path.substring(parentPath.length).replace(/^,\s*/, '').trim() : path;
        if(!label) label = path;
        if(!parentNode.children[label]){
            parentNode.children[label]={name:label,children:{},order:[],remedies:{},count:0,hasRubric:false,path:'',oorep_id:null,fullPath:path};
            parentNode.order.push(label);
        }
        nodeByPath[path] = parentNode.children[label];
        return nodeByPath[path];
    }

    entries.forEach(function(e){
        var n = ensureNode(e.path);
        n.count++;
        n.hasRubric = true;
        n.path = e.path;
        if(!n.rid) n.rid = e.rid;
        if(!n.oorep_id && e.rec.oorep_id) n.oorep_id = e.rec.oorep_id;
        _repMergeRemedies(n.remedies, e.rec.r || {});
    });
    return root;
}

function buildRubricTree(data){
    // Kent English and Repertorium Publicum have many meaningful commas inside
    // a single rubric label. Therefore they must be nested by the longest
    // already-existing rubric prefix, not by every comma.
    // This fixes BUBO/BALL in Kent and oorep Publicum rubric ordering.
    if(repCurrentBook === 'kent' || repCurrentBook === 'publicum') return _repBuildTreeByExistingRubrics(data);

    var root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    
    Object.keys(data).forEach(function(rid){
        var r=data[rid];
        if(!r)return;
        var txt=r.path||r.de_path||r.t||'';
        if(!txt)return;
        var parts = (repCurrentBook === 'synthesis91') ? _repSplitSynthesisPathForTree(txt) : _repSplitCommaOutsideParentheses(txt);
        var n=root;
        for(var i=0;i<parts.length;i++){
            var pt=parts[i].trim();
            if(!pt)continue;
            if(!n.children[pt]){
                n.children[pt]={name:pt,children:{},order:[],remedies:{},count:0,hasRubric:false,path:'',oorep_id:null};
                n.order.push(pt);
            }
            n=n.children[pt];
            n.count++;
            if(i===parts.length-1){
                n.remedies=r.r||{};
                n.hasRubric=true;
                n.path=txt;
                n.oorep_id=r.oorep_id||null;
                n.rid=rid;
            }
        }
    });
    return root;
}

var repTreePage=0,repTreePageSize=50;
var repRidToFlatIndex={};   // (kept for API compat)
var repPendingNavRid=null;  // 🔑 rubric ID waiting to be scrolled-to after render

// ============================================================
// 🔑 HOMEOSETU-STYLE FOLDER NAVIGATION (layout clone)
// Chapter = root folder; each rubric with children = folder card;
// leaf rubric = document card. back/forward/up + breadcrumb.
// ============================================================
var repViewMode='grid';        // 'grid' | 'list'
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
    repClipViewOpen=false; repCurrentDetail=null; repPendingDetail=null;
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
    repCurrentDetail=null; repClipViewOpen=false; repPendingDetail=null;
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
    if(repCurrentDetail||repClipViewOpen){ repGo(repFolderPath); return; }   // detail/clipboard -> back to folder
    if(repFolderPath.length) repGo(repFolderPath.slice(0,-1));
}
function repOpenChapter(chKey){
    if(chKey===repCurrentChapter)return;
    repHistBack.push(repCurrentState()); repHistFwd=[];
    repCurrentDetail=null; repClipViewOpen=false; repPendingDetail=null;
    selectChapter(chKey);
}
function repBcGo(i){
    if(i<0){ return; }
    repGo(repFolderPath.slice(0,i+1));
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
    var h='<span class="rep-bc-seg rep-bc-book" onclick="repOpenBookRoot()">📖 '+escapeHtml(bookInfo.name)+'</span>';
    if(repCurrentChapter){
        h+='<span class="rep-bc-sep">›</span><span class="rep-bc-seg'+(repFolderPath.length?'':' active')+'" onclick="repGo([])">📁 '+escapeHtml(repCurrentChName)+'</span>';
        for(var i=0;i<repFolderPath.length;i++){
            h+='<span class="rep-bc-sep">›</span><span class="rep-bc-seg'+(i===repFolderPath.length-1?' active':'')+'" onclick="repBcGo('+i+')">'+escapeHtml(repFolderPath[i])+'</span>';
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

// 🔑 renders the whole folder view: header (RUBRICS IN X + filter) + cards + dock
function renderFolderView(){
    var cd=document.getElementById('repRubricContent'); if(!cd)return;
    repUpdateNavButtons(); repRenderBreadcrumb();
    var node=repResolveNode(repFolderPath);
    if(!node){ repFolderPath=[]; node=repCurrentTree; }
    var nm=repFolderPath.length?repFolderPath[repFolderPath.length-1]:repCurrentChName;
    var h='';
    h+='<div class="rep-content-head">'
      +'<div class="rep-content-title"><span class="rep-content-folder">📁</span>'
      +'<span>'+repLangText({ur:'ربرکس:',en:'RUBRICS IN',roman:'RUBRICS IN'})+'</span>'
      +'<b>'+escapeHtml(String(nm).toUpperCase())+'</b>'
      +'<span>('+String(node.order.length).toLocaleString()+')</span></div>'
      +'<input type="text" class="rep-folder-filter" id="repFolderFilterInput" value="'+escapeHtml(repFolderFilter)+'" oninput="repOnFolderFilter(this.value)" placeholder="'+escapeHtml(repLangText({ur:'اس فولڈر میں فلٹر کریں...',en:'Filter in current folder...',roman:'Is folder mein filter karein...'}))+'">'
      +'</div>';
    h+='<div id="repCardsArea"></div>';
    h+='<div id="repDockArea"></div>';
    cd.innerHTML=h;
    renderFolderCards();
    cd.scrollTop=0;
}
function repOnFolderFilter(v){
    repFolderFilter=v; repTreePage=0;
    renderFolderCards();
}
function repSetView(m){
    repViewMode=m;
    var g=document.getElementById('repViewGrid'),l=document.getElementById('repViewList');
    if(g)g.classList.toggle('active',m==='grid');
    if(l)l.classList.toggle('active',m==='list');
    renderFolderCards();
}

// 🔑 card building helpers
function _repNodeKids(c){ return (c.order&&c.order.length>0)||Object.keys(c.children||{}).length>0; }
function _repAttr(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function repCardHtml(it){
    var c=it.node,kids=_repNodeKids(c);
    var rems=Object.keys(c.remedies||{}).length;
    var rid=c.hasRubric&&c.rid?String(c.rid):'';
    var full=_repJoinSeg(repFullPathOf(repFolderPath),it.label);
    var badges='';
    if(kids) badges+='<span class="rpc-badge kids">📁 '+c.order.length+'</span>';
    if(rems) badges+='<span class="rpc-badge rems" onclick="event.stopPropagation();repOpenRubricDetail(_repFullOf(this),_repRidOf(this))" data-full="'+_repAttr(full)+'" data-rid="'+_repAttr(rid)+'">⚡ '+rems+' '+repLangText({ur:'ادویات',en:'remedies',roman:'remedies'})+'</span>';
    if(!badges) badges='<span class="rpc-empty">Empty</span>';
    return '<div class="rpc-card" data-kids="'+(kids?1:0)+'" data-label="'+_repAttr(it.label)+'"'+(rid?' data-rid="'+_repAttr(rid)+'"':'')+' onclick="repCardClick(this)">'
        +'<div class="rpc-card-top"><div class="rpc-ico '+(kids?'folder':'doc')+'">'+(kids?'📁':'📄')+'</div>'
        +'<button class="rpc-kebab" onclick="event.stopPropagation();repKebabShow(event,this)" data-full="'+_repAttr(full)+'" data-rid="'+_repAttr(rid)+'">⋮</button></div>'
        +'<div class="rpc-title" dir="ltr">'+escapeHtml(it.label)+'</div>'
        +'<div class="rpc-badges">'+badges+'</div>'
        +'</div>';
}
function repListRowHtml(it){
    var c=it.node,kids=_repNodeKids(c);
    var rems=Object.keys(c.remedies||{}).length;
    var rid=c.hasRubric&&c.rid?String(c.rid):'';
    var full=_repJoinSeg(repFullPathOf(repFolderPath),it.label);
    var badges='';
    if(kids) badges+='<span class="rpc-badge kids">📁 '+c.order.length+'</span>';
    if(rems) badges+='<span class="rpc-badge rems" onclick="event.stopPropagation();repOpenRubricDetail(_repFullOf(this),_repRidOf(this))" data-full="'+_repAttr(full)+'" data-rid="'+_repAttr(rid)+'">⚡ '+rems+'</span>';
    if(!badges) badges='<span class="rpc-empty">Empty</span>';
    return '<div class="rpl-row" data-kids="'+(kids?1:0)+'" data-label="'+_repAttr(it.label)+'"'+(rid?' data-rid="'+_repAttr(rid)+'"':'')+' onclick="repCardClick(this)">'
        +'<div class="rpc-ico '+(kids?'folder':'doc')+'" style="width:30px;height:30px;font-size:14px;">'+(kids?'📁':'📄')+'</div>'
        +'<div class="rpl-name" dir="ltr">'+escapeHtml(it.label)+'</div>'
        +'<div class="rpl-badges">'+badges+'</div>'
        +'</div>';
}
function _repFullOf(el){ return el.getAttribute('data-full')||''; }
function _repRidOf(el){ return el.getAttribute('data-rid')||''; }
function _repJs(s){ return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function repCardClick(el){
    repKebabHide();
    if(el.getAttribute('data-kids')==='1'){ repGo(repFolderPath.concat([el.getAttribute('data-label')])); }
    else { repOpenRubricDetail(_repFullOf(el),_repRidOf(el),repFolderPath.concat([el.getAttribute('data-label')])); }
}

function renderFolderCards(){
    var area=document.getElementById('repCardsArea'); if(!area)return;
    var node=repResolveNode(repFolderPath);
    if(!node){ area.innerHTML=''; renderFolderDock(0,0,0,0); return; }
    var items=node.order.map(function(k){ return {label:k,node:node.children[k]}; });
    if(repFolderFilter){
        var f=repFolderFilter.toLowerCase();
        items=items.filter(function(it){ return it.label.toLowerCase().indexOf(f)!==-1; });
    }
    items.sort(function(a,b){ var c=a.label.localeCompare(b.label); return repSortAsc?c:-c; });
    // 🔑 pending search navigation: jump to the page containing that rubric
    if(repPendingNavRid){
        for(var q=0;q<items.length;q++){
            if(items[q].node&&items[q].node.rid===repPendingNavRid){ repTreePage=Math.floor(q/repTreePageSize); break; }
        }
    }
    var total=items.length,totalPages=Math.ceil(total/repTreePageSize)||1;
    if(repTreePage>=totalPages)repTreePage=totalPages-1;
    if(repTreePage<0)repTreePage=0;
    var start=repTreePage*repTreePageSize,end=Math.min(start+repTreePageSize,total);
    var h='';
    if(!total){ h='<div class="rep-empty-folder">'+repLangText({ur:'اس فولڈر میں کوئی ربرک نہیں',en:'No rubrics in this folder',roman:'Is folder mein koi rubric nahi'})+'</div>'; }
    else if(repViewMode==='grid'){
        h='<div class="rep-cards-grid">';
        for(var i=start;i<end;i++) h+=repCardHtml(items[i]);
        h+='</div>';
    } else {
        h='<div class="rep-cards-list">';
        for(var j=start;j<end;j++) h+=repListRowHtml(items[j]);
        h+='</div>';
    }
    area.innerHTML=h;
    renderFolderDock(totalPages,total,start,end);
    if(repPendingNavRid){
        var fr=repPendingNavRid; repPendingNavRid=null;
        setTimeout(function(){ flashRubricRow(fr); },80);
    }
}

// 🔑 bottom floating dock: CLIPBOARDS (1-4) + page pills + sort + page size (HomeoSetu-style)
function repPageWindow(cur,totalPages){
    var arr=[],shown={};
    function add(p){ if(p>=0&&p<totalPages&&!shown[p]){ shown[p]=1; arr.push(p); } }
    add(0); add(totalPages-1);
    [cur-1,cur,cur+1].forEach(add);
    add(cur-2); add(cur+2);
    arr.sort(function(a,b){return a-b;});
    var out=[],prev=-1;
    arr.forEach(function(p){
        if(prev!==-1&&p-prev>1) out.push('...');
        out.push(p); prev=p;
    });
    return out;
}

// ==================== 4 CLIPBOARDS (floating, persisted) ====================
// HomeoSetu فنکشن کلون: نیچے فلوٹنگ ڈاک میں 4 کلپ بورڈز — ہر کلپ بورڈ ایک
// محفوظ ورکنگ لسٹ ہے (ربرکس جو آپ ریپرٹورائزیشن کے لیے اکٹھا کر رہے ہیں)۔
// ربرک کارڈ کے ⋮ مینو سے شامل/ہٹائیں؛ ڈاک کے نمبر پر کلک سے لسٹ کھلتی ہے۔
var repClipboards=[[],[],[],[]];   // each item: {book,ch,rid,path,rems,ts}
var repActiveClip=0;               // 0..3 (displayed 1..4)
var repClipViewOpen=false;         // clipboard list view currently shown?
var repDockTrashArm=0;             // 🗑 double-click arm (confirm)
var repDockCtx={folder:false,cur:0,totalPages:0,total:0,start:0,end:0};
function repClipsLoad(){
    try{ var s=localStorage.getItem('bc_rep_clipboards'); if(s){ var d=JSON.parse(s); if(d&&d.length===4){ repClipboards=d; return; } } }catch(e){}
    repClipboards=[[],[],[],[]];
}
function repClipsSave(){ try{ localStorage.setItem('bc_rep_clipboards', JSON.stringify(repClipboards)); }catch(e){} }
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
    if(!repDockTrashArm){ repDockTrashArm=1; repRenderDock(); setTimeout(function(){ repDockTrashArm=0; repRenderDock(); },2600); return; }
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
    renderClipView();
}
function repCloseClipView(){ repGo(repFolderPath); }

// 🔑 dock renderer — CLIPBOARDS group always; PAGES group only in folder view
function repRenderDock(){
    var d=document.getElementById('repDockArea'); if(!d)return;
    var h='<div class="rep-dock">';
    h+='<span class="rep-dock-label">'+repLangText({ur:'کلپ بورڈز',en:'CLIPBOARDS',roman:'CLIPBOARDS'})+'</span>';
    for(var i=0;i<4;i++){
        var n=(repClipboards[i]||[]).length;
        h+='<button class="rep-dock-clip'+((repClipViewOpen&&repActiveClip===i)?' active':'')+'" onclick="repToggleClipView('+i+')" title="'+repLangText({ur:'کلپ بورڈ '+(i+1),en:'Clipboard '+(i+1),roman:'Clipboard '+(i+1)})+'">'+(i+1)+(n?'<i class="rep-clip-n">'+n+'</i>':'')+'</button>';
    }
    h+='<button class="rep-dock-ico" onclick="repClipCopyAll()" title="'+repLangText({ur:'لسٹ کاپی کریں',en:'Copy list',roman:'List copy karein'})+'">📄</button>';
    if((repClipboards[repActiveClip]||[]).length){
        h+='<button class="rep-dock-ico'+(repDockTrashArm?' armed':'')+'" onclick="repClipTrash()" title="'+repLangText({ur:'کلپ بورڈ '+(repActiveClip+1)+' خالی کریں',en:'Clear clipboard '+(repActiveClip+1),roman:'Clipboard '+(repActiveClip+1)+' khali karein'})+'">'+(repDockTrashArm?'🗑؟':'🗑')+'</button>';
    }
    if(repClipViewOpen) h+='<button class="rep-dock-ico" onclick="repCloseClipView()" title="'+repLangText({ur:'واپس',en:'Back',roman:'Wapas'})+'">✕</button>';
    if(repDockCtx.folder&&repDockCtx.totalPages>0){
        h+='<span class="rep-dock-div"></span>';
        h+='<span class="rep-dock-label">'+repLangText({ur:'صفحات',en:'PAGES',roman:'PAGES'})+'</span>';
        repPageWindow(repDockCtx.cur,repDockCtx.totalPages).forEach(function(p){
            if(p==='...'){ h+='<span class="rep-dock-dots">…</span>'; return; }
            h+='<button class="rep-dock-page'+(p===repDockCtx.cur?' active':'')+'" onclick="repGoPage('+p+')">'+(p+1)+'</button>';
        });
        h+='<span class="rep-dock-div"></span>';
        h+='<button class="rep-dock-ico" onclick="repToggleSort()" title="Sort A-Z / Z-A">⇅ '+(repSortAsc?'A-Z':'Z-A')+'</button>';
        h+='<button class="rep-dock-ico" onclick="repCyclePageSize()" title="Cards per page">≡ '+repTreePageSize+'</button>';
        if(repDockCtx.total) h+='<span class="rep-dock-info">'+(repDockCtx.start+1)+'–'+repDockCtx.end+' / '+repDockCtx.total.toLocaleString()+'</span>';
    }
    h+='</div>';
    d.innerHTML=h;
}
function renderFolderDock(totalPages,total,start,end){
    repDockCtx={folder:true,cur:repTreePage,totalPages:totalPages,total:total,start:start,end:end};
    repRenderDock();
}
function repDockNoFolder(){
    repDockCtx={folder:false,cur:0,totalPages:0,total:0,start:0,end:0};
    repRenderDock();
}
function repGoPage(p){ repTreePage=p; renderFolderCards(); }
function repToggleSort(){ repSortAsc=!repSortAsc; renderFolderCards(); }
function repCyclePageSize(){
    var sizes=[50,100,200,500];
    var idx=sizes.indexOf(repTreePageSize); if(idx===-1)idx=0;
    repTreePageSize=sizes[(idx+1)%sizes.length];
    repTreePage=0; renderFolderCards();
}

// 🔑 clipboard contents view (main area)
function renderClipView(){
    var cd=document.getElementById('repRubricContent'); if(!cd)return;
    repUpdateNavButtons(); repRenderBreadcrumb();
    var l=repClipboards[repActiveClip]||[];
    var h='<div class="rep-clip-head"><div class="rep-content-title"><span>📋</span><span>'+repLangText({ur:'کلپ بورڈ',en:'CLIPBOARD',roman:'CLIPBOARD'})+'</span><b>'+(repActiveClip+1)+'</b><span class="cnt">('+l.length+')</span></div>'
        +'<div style="display:flex;gap:6px;">'
        +'<button class="rc-btn" onclick="repClipCopyAll()">📄 '+repLangText({ur:'کاپی',en:'Copy',roman:'Copy'})+'</button>'
        +'<button class="rc-btn danger" onclick="repClipTrash()">🗑 '+repLangText({ur:'خالی کریں',en:'Clear',roman:'Khali karein'})+'</button>'
        +'</div></div>';
    if(!l.length){
        h+='<div class="rep-empty-state"><div class="res-icon">📋</div><p class="res-title">'+repLangText({ur:'کلپ بورڈ '+(repActiveClip+1)+' خالی ہے',en:'Clipboard '+(repActiveClip+1)+' is empty',roman:'Clipboard '+(repActiveClip+1)+' khali hai'})+'</p><p class="res-sub">'+repLangText({ur:'کسی بھی ربرک کارڈ کے ⋮ مینو سے اسے شامل کریں',en:'Use the ⋮ menu on any rubric card to add it',roman:'Kisi bhi rubric card ke ⋮ menu se isay shamil karein'})+'</p></div>';
    } else {
        l.forEach(function(it,i){
            var bi=REP_BOOK_INFO[it.book]||{abbr:it.book,name:it.book};
            h+='<div class="rep-clip-row" onclick="repClipOpenItem('+i+')">'
                +'<span class="rep-book-badge" style="background:'+(it.book==='publicum'?'#1a5276':(it.book==='kent'?'#16a085':(it.book==='kent_de'?'#d35400':'#8e44ad')))+'">'+escapeHtml(bi.abbr)+'</span>'
                +'<span class="rc-path" dir="ltr">'+escapeHtml(it.path||'—')+'</span>'
                +(it.rems?'<span class="rpc-badge rems">⚡ '+it.rems+'</span>':'')
                +'<button class="rc-btn" onclick="event.stopPropagation();repClipOpenItem('+i+')">↩ '+repLangText({ur:'کھولیں',en:'Open',roman:'Kholen'})+'</button>'
                +'<button class="rc-btn danger" onclick="event.stopPropagation();repClipRemoveItem('+i+')">🗑</button>'
                +'</div>';
        });
    }
    h+='<div id="repDockArea"></div>';
    cd.innerHTML=h;
    cd.scrollTop=0;
    repDockNoFolder();
}
function repClipRemoveItem(i){
    var l=repClipboards[repActiveClip]||[];
    if(i<0||i>=l.length)return;
    l.splice(i,1); repClipsSave(); renderClipView();
}
function repClipOpenItem(i){
    var it=(repClipboards[repActiveClip]||[])[i]; if(!it)return;
    repClipViewOpen=false;
    navigateToRubric(it.book,it.ch,it.rid,true);
}

// 🔑 empty state (no chapter selected) — HomeoSetu-style dashed box
function repRenderEmptyState(){
    var cd=document.getElementById('repRubricContent'); if(!cd)return;
    cd.innerHTML='<div class="rep-empty-state"><div class="res-icon">📁</div>'
        +'<p class="res-title">'+repLangText({ur:'بائیں مینو سے کوئی باب منتخب کریں',en:'Select a chapter from the left menu',roman:'Bayen menu se koi chapter select karein'})+'</p>'
        +'<p class="res-sub">'+repLangText({ur:'ربرکس اور ادویات دیکھیں',en:'Browse rubrics and remedies',roman:'Rubrics aur remedies dekhein'})+'</p></div>'
        +'<div id="repDockArea"></div>';
    repRenderBreadcrumb(); repUpdateNavButtons(); repDockNoFolder();
}

// 🔑 kebab (⋮) popup menu — copy + detail + ADD/REMOVE in 4 clipboards
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
        for(var i=0;i<4;i++){
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
    });
}

// 🔑 Urdu glossary (lazy load) for word-by-word meaning
var _repGlossary=null,_repGlossaryLoading=false;
function ensureRepGlossary(cb){
    if(_repGlossary){ cb(); return; }
    if(_repGlossaryLoading){ setTimeout(function(){ ensureRepGlossary(cb); },300); return; }
    _repGlossaryLoading=true;
    fetch('glossary_en_ur.json?v=4').then(function(r){ return r.json(); }).then(function(d){
        _repGlossary=d; _repGlossaryLoading=false; cb();
    }).catch(function(e){ console.error('glossary load fail',e); _repGlossaryLoading=false; cb(); });
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
            gr[0].forEach(function(a){ h+='<span class="rep-remedy-tag g'+gr[1]+'" onclick="copyRemedyToPrescription(\''+escapeHtml(a)+'\')">'+escapeHtml(a)+'</span>'; });
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

// ============================================================
// 🔑 RUBRIC DETAIL PAGE (HomeoSetu clone — clinic layout)
// کارڈ کلک → ڈیٹیل پیج: عنوان کے آگے < آئکن سے ڈیٹیلز ایکسپینڈ/ہائیڈ،
// پھر پہلے REMEDIES سیکشن اور نیچے SUB-RUBRICS کے کلک ایبل کارڈز۔
// ڈیٹیلز: مطلب | مریض کا ورژن | صحیح استعمال | کراس ریفرنس (کھلی کتاب)
//         | کراس ریفرنس (ایپ — باقی تینوں ریپرٹریز میں متبادل)
// ============================================================
var REP_CHAPTER_UR={mind:'ذہن',vertigo:'چکر آنا',head:'سر',eye:'آنکھ',vision:'بصارت',ear:'کان',hearing:'سماعت',nose:'ناک',face:'چہرہ',mouth:'منہ',teeth:'دانت',throat:'حلق (اندرونی)',external_throat:'حلق (بیرونی)',stomach:'معدہ',abdomen:'پیٹ',rectum:'ملاچر',stool:'پاخانہ',bladder:'مثانہ',kidneys:'گردے',prostate_gland:'پروسٹیٹ',urethra:'پیشاب کی نالی',urine:'پیشاب',genitalia_male:'مردانہ اعضا',genitalia_female:'زنانہ اعضا',larynx_and_trachea:'حلقوم و سانس کی نالی',respiration:'سانس',cough:'کھانسی',expectoration:'بلغم',chest:'سینہ',back:'کمر',extremities:'ہاتھ پاؤں',sleep:'نیند',chill:'لرزہ',fever:'بخار',perspiration:'پسینہ',skin:'جلد',generalities:'عمومیات',appetite:'بھوک',blood:'خون',clinical:'کلینیکل'};
function repOpenRubricDetail(full,rid,labels){
    repKebabHide();
    repHistBack.push(repCurrentState()); repHistFwd=[];
    var e=(rid&&repRidPathMap[rid])?repRidPathMap[rid]:null;
    repCurrentDetail={
        full:full||(e?e.fullPath:''),
        rid:rid||'',
        labels:labels||(e?e.path.slice():repFolderPath.slice())
    };
    renderRubricDetail();
}
function repDetailNode(){
    var d=repCurrentDetail; if(!d)return null;
    if(d.rid&&repRidPathMap[d.rid]) return repRidPathMap[d.rid].node;
    if(d.labels&&d.labels.length) return repResolveNode(d.labels);
    return repCurrentTree;
}
function repDetailParentFull(){
    var d=repCurrentDetail; if(!d)return '';
    var labels=(d.labels&&d.labels.length)?d.labels.slice(0,-1):repFolderPath.slice();
    return repFullPathOf(labels);
}
function repToggleDetailInfo(){
    var el=document.getElementById('repDetailInfo'),ch=document.getElementById('repDetailChev');
    if(el)el.classList.toggle('open');
    if(ch)ch.classList.toggle('open');
}
// 🔑 glossary-backed meaning tokens (grammar phrases first, then words)
function repMeaningTokens(text){
    if(!_repGlossary) return [];
    var W=_repGlossary.words||{},A=_repGlossary.aliases||{},GP=_repGlossary.grammar_phrases||{};
    var t=String(text||'').toLowerCase().replace(/\((?:see|cmp|comp|cf)\.?[^)]*\)/gi,' ');
    var phraseHits=[];
    Object.keys(GP).forEach(function(p){ if(t.indexOf(p)!==-1) phraseHits.push(p); });
    phraseHits.sort(function(a,b){ return b.length-a.length; });
    var out=[],consumed=t;
    phraseHits.forEach(function(p){
        consumed=consumed.split(p).join(' ');
        var e=GP[p]; if(e&&e.ur) out.push({t:p,ur:e.ur,part:e.part||'phrase',ph:1});
    });
    var toks=consumed.match(/[a-z]+/g)||[],seen={};
    toks.forEach(function(w){
        if(seen[w])return; seen[w]=1;
        var e=W[w]||(A[w]?W[A[w]]:null);
        if(e&&e.ur) out.push({t:w,ur:e.ur,part:e.part||''});
    });
    return out;
}
function repSenseNoteFor(tokens){
    if(!_repGlossary||!_repGlossary.sense_notes)return '';
    var SN=_repGlossary.sense_notes;
    for(var i=0;i<tokens.length;i++){ if(SN[tokens[i].t]) return SN[tokens[i].t]; }
    return '';
}
// 🔑 Kent-style cross references: "(See Forsaken)" → ["Forsaken"]
function repExtractSeeTargets(text){
    var out=[],re=/\(\s*(?:see|cmp\.?|comp\.?|cf\.?)\s+([^)]+)\)/gi,m;
    while((m=re.exec(String(text||'')))){
        var v=m[1].trim().replace(/^[:.,;]+|[:.,;]+$/g,'');
        if(v&&out.indexOf(v)===-1) out.push(v);
    }
    return out;
}
// 🔑 cross-repertory normalizer: Kent "ABSENT-MINDED (See Forgetful), morning",
//    Syn "ABSENTMINDED - morning", Pub "absent-minded, morning" → same key
function repNormXrefPath(p){
    return String(p||'').toLowerCase()
        .replace(/\((?:see|cmp|comp|cf)\.?[^)]*\)/gi,'')
        .replace(/\s+-\s+/g,', ')
        .replace(/[^a-z0-9,]+/g,'')
        .replace(/,+/g,',').replace(/^,+|,+$/g,'');
}
var _repXrefIndex={};   // book -> {map:{norm:{ch,rid,path,rems}}, heads:{head:[{np,e}]}}
function buildXrefIndex(book,cb){
    if(_repXrefIndex[book]){ cb(_repXrefIndex[book]); return; }
    loadSingleBookData(book,function(sd){
        if(!sd){ cb(null); return; }
        var map={},heads={};
        Object.keys(sd).forEach(function(ck){
            var rubs=sd[ck];
            Object.keys(rubs).forEach(function(rid){
                var r=rubs[rid]; if(!r)return;
                var t=String(r.path||r.de_path||r.t||'').trim(); if(!t)return;
                var np=repNormXrefPath(t); if(!np)return;
                var e={ch:ck,rid:rid,path:t,rems:Object.keys(r.r||{}).length};
                if(!map[np]) map[np]=e;
                var head=np.split(',')[0];
                (heads[head]=heads[head]||[]).push({np:np,e:e});
            });
        });
        _repXrefIndex[book]={map:map,heads:heads};
        cb(_repXrefIndex[book]);
    });
}
function repBookBadgeHtml(book){
    var bi=REP_BOOK_INFO[book]||{abbr:book,name:book};
    var c=book==='publicum'?'#1a5276':(book==='kent'?'#16a085':(book==='kent_de'?'#d35400':'#8e44ad'));
    return '<span class="rep-book-badge" style="background:'+c+'">'+escapeHtml(bi.abbr)+'</span>';
}
var _repXrefSeq=0;   // cancels stale async fills when the detail view re-renders
// 🔑 async app cross-reference body (other 3 books, one by one)
function repRenderXrefAppBody(full,rid){
    var el=document.getElementById('repXrefAppBody'); if(!el)return;
    var mySeq=++_repXrefSeq;
    function stale(host){ return !host||mySeq!==_repXrefSeq; }
    var myNorm=repNormXrefPath(full);
    var myHead=myNorm?myNorm.split(',')[0]:'';
    var books=[]; Object.keys(REP_BOOK_INFO).forEach(function(bk){ if(bk!==repCurrentBook) books.push(bk); });
    var pos=0;
    function next(){
        var host=document.getElementById('repXrefAppBody'); if(stale(host))return;   // view changed
        if(pos>=books.length){
            host.innerHTML=host.innerHTML+'<div style="font-size:10.5px;color:#9fb0bf;margin-top:6px;">✅ '+repLangText({ur:'تمام ریپرٹریز چیک ہو گئیں',en:'All repertories checked',roman:'Tamam repertories check ho gayin'})+'</div>';
            return;
        }
        var bk=books[pos++];
        var bi=REP_BOOK_INFO[bk]||{abbr:bk,name:bk};
        var rowId='repXrefRow-'+bk;
        if(!document.getElementById(rowId)){
            host.insertAdjacentHTML('beforeend','<div class="rpd-xrow" id="'+rowId+'"><span class="rpd-xbook">'+repBookBadgeHtml(bk)+' '+escapeHtml(bi.name)+'</span><span class="rpd-xload">⏳</span></div>');
        }
        buildXrefIndex(bk,function(idx){
            var host2=document.getElementById(rowId);
            if(stale(host2)){ return; }
            var h='<span class="rpd-xbook">'+repBookBadgeHtml(bk)+' '+escapeHtml(bi.name)+'</span><span class="rpd-xchips">';
            if(idx){
                var ex=idx.map[myNorm];
                var chips='';
                if(ex){
                    chips+='<span class="rpd-xchip" onclick="navigateToRubric(\''+_repJs(bk)+'\',\''+_repJs(ex.ch)+'\',\''+_repJs(String(ex.rid))+'\',true)" title="'+_repAttr(ex.path)+'">🎯 '+escapeHtml(ex.path.length>52?ex.path.substring(0,49)+'…':ex.path)+' <i>'+ex.rems+' ⚡</i></span>';
                } else if(myHead&&idx.heads[myHead]){
                    var ms=idx.heads[myHead].slice(0,4);
                    ms.forEach(function(m2){
                        var tail=m2.np.split(',').slice(1).join(', ');
                        chips+='<span class="rpd-xchip" onclick="navigateToRubric(\''+_repJs(bk)+'\',\''+_repJs(m2.e.ch)+'\',\''+_repJs(String(m2.e.rid))+'\',true)" title="'+_repAttr(m2.e.path)+'">'+(tail?('…'+escapeHtml(tail.length>44?tail.substring(0,41)+'…':tail)):escapeHtml(m2.e.path))+' <i>'+m2.e.rems+' ⚡</i></span>';
                    });
                }
                h+=chips||'<span class="rpd-xnone">'+repLangText({ur:'متبادل نہیں ملا',en:'no match',roman:'mubadal nahi mila'})+'</span>';
            } else {
                h+='<span class="rpd-xnone">'+repLangText({ur:'ڈیٹا دستیاب نہیں',en:'data unavailable',roman:'data dastiyab nahi'})+'</span>';
            }
            h+='</span>';
            host2.innerHTML=h;
            setTimeout(next,30);
        });
    }
    setTimeout(next,40);
}
// 🔑 the detail page itself (glossary ensured first — meaning tokens need it)
function renderRubricDetail(){
    if(!_repGlossary){ ensureRepGlossary(function(){ renderRubricDetail(); }); return; }
    var cd=document.getElementById('repRubricContent'); if(!cd)return;
    repUpdateNavButtons(); repRenderBreadcrumb();
    var d=repCurrentDetail||{full:'',rid:'',labels:repFolderPath.slice()};
    var node=repDetailNode();
    var full=d.full||((node&&node.path)||'');
    var bi=REP_BOOK_INFO[repCurrentBook]||{abbr:repCurrentBook,name:repCurrentBook};
    var kids=node?node.order.slice():[];
    var rems=(node&&node.remedies)||{};
    var abbrs=Object.keys(rems);
    abbrs.sort(function(a,b){ return (rems[b]||1)-(rems[a]||1)||a.localeCompare(b); });
    var g3=[],g2=[],g1=[];
    abbrs.forEach(function(a){ var g=rems[a]||1; if(g>=3)g3.push(a); else if(g===2)g2.push(a); else g1.push(a); });
    var seeT=repExtractSeeTargets(full);
    var pureXref=!abbrs.length&&seeT.length>0&&!kids.length;
    var h='';
    // ---- title row: < chevron + rubric text + copy
    h+='<div class="rpd-titlerow">'
      +'<button class="rpd-chev" id="repDetailChev" onclick="repToggleDetailInfo()" title="'+repLangText({ur:'مکمل تفصیل دیکھیں/چھپائیں',en:'Show/hide full details',roman:'Mukammal tafseel dekhein/chhupaein'})+'">&lt;</button>'
      +'<div class="rpd-title" dir="ltr">'+escapeHtml(full||'—')+'</div>'
      +'<button class="rc-btn" onclick="repDetailCopy()">📋</button>'
      +'</div>';
    h+='<div class="rpd-meta">'+repBookBadgeHtml(repCurrentBook)+'<span>'+escapeHtml(bi.name)+'</span>'
      +'<span>📁 '+escapeHtml(repCurrentChName||'')+'</span>'
      +(d.rid?'<span>#'+escapeHtml(String(d.rid))+'</span>':'')
      +'<span>⚡ '+abbrs.length+' '+repLangText({ur:'ادویات',en:'remedies',roman:'remedies'})+'</span>'
      +(kids.length?'<span>📁 '+kids.length+' '+repLangText({ur:'ذیلی ربرکس',en:'sub-rubrics',roman:'zeli rubrics'})+'</span>':'')
      +'</div>';
    // ---- expandable details (collapsed by default, < toggles)
    h+='<div class="rpd-info" id="repDetailInfo">';
    // 1) MEANING
    var toks=repMeaningTokens(full);
    var sense=repSenseNoteFor(toks);
    h+='<div class="rpd-sec meaning"><span class="rpd-lab">📖 '+repLangText({ur:'مطلب (MEANING)',en:'MEANING',roman:'MATLAB (MEANING)'})+'</span>';
    if(toks.length){
        h+='<div class="rpd-tokchips">';
        toks.forEach(function(t){ h+='<span class="rpd-tok"><b dir="ltr">'+escapeHtml(t.t)+'</b> = '+escapeHtml(t.ur)+'</span>'; });
        h+='</div>';
    } else {
        h+='<div style="color:#8aa0b2;font-style:italic;">'+repLangText({ur:'اس ربرک کے الفاظ کا اردو ترجمہ لغت میں دستیاب نہیں',en:'No Urdu translation available for these words',roman:'In alfaaz ka Urdu tarjuma lughat mein dastiyab nahi'})+'</div>';
    }
    if(sense) h+='<div class="rpd-sense">💡 '+escapeHtml(sense)+'</div>';
    h+='</div>';
    // 2) PATIENT VERSION
    h+='<div class="rpd-sec patient"><span class="rpd-lab">🧑\u200d⚕ '+repLangText({ur:'مریض کا ورژن (PATIENT VERSION)',en:'PATIENT VERSION',roman:'MAREEZ KA VERSION'})+'</span>';
    if(toks.length){
        var urs=toks.map(function(t){ return t.ur; });
        var label=full.replace(/\((?:see|cmp|comp|cf)\.?[^)]*\)/gi,'').trim();
        h+='<div>مریض عام زبان میں اپنی شکایت یوں بیان کرے گا: <b>«'+escapeHtml(urs.join(' ، '))+'»</b></div>';
        if(label) h+='<div style="font-size:11.5px;color:#7d6608;margin-top:2px;">('+repLangText({ur:'ڈاکٹری اصطلاح',en:'medical term',roman:'daktari istilah'})+': <span dir="ltr">'+escapeHtml(label)+'</span> = '+escapeHtml(urs.slice(0,4).join(' ، '))+')</div>';
    } else {
        h+='<div>'+repLangText({ur:'مریض اپنی شکایت اپنے الفاظ میں بیان کرے گا — ربرک کا متن مریض کے الفاظ سے ملا کر دیکھا جائے۔',en:'The patient describes the complaint in their own words — match them with this rubric text.',roman:'Mareez apni shikayat apne alfaaz mein bayan karega — rubric ke mutabiq dekha jaye.'})+'</div>';
    }
    h+='</div>';
    // 3) WHEN TO USE
    var chUr=REP_CHAPTER_UR[String(repCurrentChapter).toLowerCase()]||'';
    h+='<div class="rpd-sec when"><span class="rpd-lab">✅ '+repLangText({ur:'صحیح استعمال کہاں (WHEN TO USE)',en:'WHEN TO USE',roman:'SAHIH ISTEMAL KAHAN'})+'</span>';
    h+='<div>'+(chUr?('یہ ربرک «<b>'+escapeHtml(chUr)+'</b>» باب میں آتی ہے۔ '):'');
    if(pureXref){
        h+='<span class="rpd-warn">⚠ '+repLangText({ur:'یہ صرفِ اشارہ ربرک ہے — خود کوئی ادویہ نہیں رکھتی۔ اصل ربرک «',en:'This is a cross-reference only — no remedies of its own. Open the real rubric «',roman:'Ye sirf ishara rubric hai — asal rubric «'})+'<b dir="ltr">'+escapeHtml(seeT[0]||'')+'</b>» '+repLangText({ur:'کھول کر استعمال کریں۔',en:'instead.',roman:'khol kar istemal karein.'})+'</span>';
    } else {
        if(kids.length) h+=repLangText({ur:'اس کے نیچے ',en:'It has ',roman:'Is ke neeche '})+'<b>'+kids.length+'</b> '+repLangText({ur:'ذیلی ربرکس ہیں (وقت، جگہ، حالت کے مطابق) — اگر مریض کی تفصیل معلوم ہو تو ذیلی ربرک زیادہ درست انتخاب ہے۔ ',en:'sub-rubrics (time, place, condition) — if details are known, a sub-rubric is more accurate. ',roman:'zeli rubrics hain — tafseel maloom ho to zeli rubric behtar hai.'});
        if(abbrs.length) h+=repLangText({ur:'اس ربرک پر ',en:'',roman:'Is rubric par '})+'<b>'+abbrs.length+'</b> '+repLangText({ur:'ادویات درج ہیں، جن میں ',en:' remedies are listed, including ',roman:'adwiyat darj hain, jin mein '})+'<b>'+g3.length+'</b> '+repLangText({ur:'مضبوط درجے (گریڈ 3) کی ہیں — ریپرٹورائزیشن میں پہلے انہی پر غور کریں۔ ',en:' strong grade-3 remedies — consider those first in repertorisation. ',roman:'grade-3 mazboot hain — pehle inhi par ghour karein.'});
        h+=repLangText({ur:'کیس ٹیکنگ میں مریض کے اپنے الفاظ اسی ربرک سے ملتے ہوں تو یہی ربرک منتخب کریں۔',en:'Pick this rubric when the patient\'s own words match it during case-taking.',roman:'Case-taking mein mareez ke alfaaz is rubric se milte hon to yehi muntakhib karein.'});
    }
    h+='</div></div>';
    // 4) CROSS REFERENCE (open repertory)
    h+='<div class="rpd-sec xbook"><span class="rpd-lab">🔗 '+repLangText({ur:'کراس ریفرنس — کھلی ریپرٹری (OPEN REPERTORY)',en:'CROSS REFERENCE (OPEN REPERTORY)',roman:'CROSS REFERENCE — khuli repertory'})+'</span>';
    if(seeT.length){
        h+='<div class="rpd-xchips">';
        seeT.forEach(function(t){ h+='<span class="rpd-xchip" onclick="repXrefGo(\''+_repJs(t)+'\')">➡ '+escapeHtml(t)+'</span>'; });
        h+='</div>';
    } else {
        var parentLabels=(d.labels&&d.labels.length>1)?d.labels.slice(0,-1):[];
        h+='<div style="color:#8aa0b2;font-size:11.5px;">'+repLangText({ur:'اس ربرک میں کتابی کراس ریفرنس درج نہیں۔',en:'No printed cross-reference on this rubric.',roman:'Is rubric mein kitabi cross reference darj nahi.'});
        if(parentLabels.length) h+=' '+repLangText({ur:'والدہ ربرک:',en:'Parent rubric:',roman:'Walida rubric:'})+' <span class="rpd-xchip" onclick="repGo('+JSON.stringify(parentLabels).replace(/"/g,'&quot;')+')" dir="ltr">'+escapeHtml(parentLabels[parentLabels.length-1])+'</span>';
        h+='</div>';
    }
    h+='</div>';
    // 5) CROSS REFERENCE (APP)
    h+='<div class="rpd-sec xapp"><span class="rpd-lab">🔗 '+repLangText({ur:'کراس ریفرنس — ایپ (APP: باقی تینوں ریپرٹریز)',en:'CROSS REFERENCE (APP: other 3 repertories)',roman:'CROSS REFERENCE — app (baqi teen repertories)'})+'</span><div id="repXrefAppBody" class="rpd-xbody"><span style="color:#8aa0b2;font-size:11.5px;">⏳ '+repLangText({ur:'دوسری ریپرٹریز میں متبادل تلاش ہو رہا ہے...',en:'Searching other repertories for matches...',roman:'Doosri repertories mein mutabad talash ho raha hai...'})+'</span></div></div>';
    h+='</div>'; // /rpd-info
    // ---- REMEDIES (FIRST — per user requirement)
    h+='<div class="rpd-sec-head">💊 '+repLangText({ur:'ادویات',en:'REMEDIES',roman:'ADWIYAT'})+' <span class="cnt">('+abbrs.length+')</span></div>';
    if(!abbrs.length){
        h+='<div class="rrp-norems">'+(pureXref?repLangText({ur:'یہ کراس ریفرنس ربرک ہے — اوپر اصل ربرک کھولیں',en:'This is a cross-reference rubric — open the real rubric above',roman:'Ye cross-reference rubric hai — asal rubric kholen'}):repLangText({ur:'اس ربرک میں کوئی ادویات محفوظ نہیں',en:'No remedies recorded under this rubric',roman:'Is rubric mein koi adwiyat mehfooz nahi'}))+'</div>';
    } else {
        h+='<div style="font-size:11.5px;color:#5d6d7e;margin-bottom:4px;">'+repLangText({ur:'کلک سے پریسکرپشن میں کاپی ہوگی',en:'click to copy to prescription',roman:'click se prescription mein copy'})+'</div>';
        [[g3,'3',repLangText({ur:'درجہ 3 — مضبوط',en:'Grade 3 — strong',roman:'Darja 3 — mazboot'})],
         [g2,'2',repLangText({ur:'درجہ 2 — درمیانہ',en:'Grade 2 — medium',roman:'Darja 2 — darmiyana'})],
         [g1,'1',repLangText({ur:'درجہ 1 — معمولی',en:'Grade 1 — light',roman:'Darja 1 — mamooli'})]].forEach(function(gr){
            if(!gr[0].length)return;
            h+='<div class="rrp-grade-head"><span class="rep-gr-dot d'+gr[1]+'"></span>'+gr[2]+' ('+gr[0].length+')</div><div class="rpd-chips">';
            gr[0].forEach(function(a){ h+='<span class="rep-remedy-tag g'+gr[1]+'" onclick="copyRemedyToPrescription(\''+escapeHtml(a)+'\')">'+escapeHtml(a)+'</span>'; });
            h+='</div>';
        });
    }
    // ---- SUB-RUBRICS (BELOW remedies — per user requirement)
    h+='<div class="rpd-sec-head">📁 '+repLangText({ur:'ذیلی ربرکس',en:'SUB-RUBRICS',roman:'ZELI RUBRICS'})+' <span class="cnt">('+kids.length+')</span></div>';
    if(!kids.length){
        h+='<div class="rrp-norems" style="font-style:italic;">'+repLangText({ur:'اس ربرک کے نیچے کوئی ذیلی ربرک نہیں',en:'No sub-rubrics under this rubric',roman:'Is rubric ke neeche koi zeli rubric nahi'})+'</div>';
    } else {
        var items=kids.map(function(k){ return {label:k,node:node.children[k]}; });
        items.sort(function(a,b){ var c=a.label.localeCompare(b.label); return repSortAsc?c:-c; });
        var LIMIT=60;
        h+='<div class="rep-cards-grid">';
        for(var i=0;i<items.length&&i<LIMIT;i++) h+=repDetailChildHtml(items[i]);
        h+='</div>';
        if(items.length>LIMIT){
            h+='<button class="rc-btn" style="margin-top:8px;" onclick="repGo('+'repCurrentDetail.labels'+')">📂 '+repLangText({ur:'تمام ',en:'Open all ',roman:'Tamam '})+items.length+repLangText({ur:' ذیلی ربرکس فولڈر ویو میں کھولیں',en:' sub-rubrics in folder view',roman:' zeli rubrics folder view mein'})+'</button>';
        }
    }
    h+='<div id="repDockArea"></div>';
    cd.innerHTML=h;
    cd.scrollTop=0;
    repDockNoFolder();
    // async: app cross-reference (other books)
    repRenderXrefAppBody(full,d.rid);
}
function repDetailCopy(){
    var d=repCurrentDetail||{};
    if(d.full&&navigator.clipboard){ navigator.clipboard.writeText(d.full).then(function(){ showToast('✅ '+d.full); }); }
}
function repDetailChildHtml(it){
    var c=it.node,kids=_repNodeKids(c);
    var rems=Object.keys(c.remedies||{}).length;
    var rid=c.hasRubric&&c.rid?String(c.rid):'';
    var full=_repJoinSeg(repDetailParentFull(),it.label);
    var labels=(repCurrentDetail&&repCurrentDetail.labels?repCurrentDetail.labels.slice(0,-1):repFolderPath.slice()).concat([it.label]);
    var badges='';
    if(kids) badges+='<span class="rpc-badge kids">📁 '+c.order.length+'</span>';
    if(rems) badges+='<span class="rpc-badge rems">⚡ '+rems+'</span>';
    if(!badges) badges='<span class="rpc-empty">Empty</span>';
    return '<div class="rpc-card" data-label="'+_repAttr(it.label)+'"'+(rid?' data-rid="'+_repAttr(rid)+'"':'')+' data-full="'+_repAttr(full)+'" data-labels="'+_repAttr(JSON.stringify(labels))+'" onclick="repDetailChildClick(this)">'
        +'<div class="rpc-card-top"><div class="rpc-ico '+(kids?'folder':'doc')+'">'+(kids?'📁':'📄')+'</div>'
        +'<button class="rpc-kebab" onclick="event.stopPropagation();repKebabShow(event,this)" data-full="'+_repAttr(full)+'" data-rid="'+_repAttr(rid)+'">⋮</button></div>'
        +'<div class="rpc-title" dir="ltr">'+escapeHtml(it.label)+'</div>'
        +'<div class="rpc-badges">'+badges+'</div>'
        +'</div>';
}
function repDetailChildClick(el){
    repKebabHide();
    var labels=[];
    try{ labels=JSON.parse(el.getAttribute('data-labels')||'[]'); }catch(e){}
    repOpenRubricDetail(_repFullOf(el),_repRidOf(el),labels);
}
// 🔑 See-target click: jump directly if the target exists in this chapter, else search
function repXrefGo(target){
    var tn=repNormXrefPath(target);
    var best=null;
    Object.keys(repRidPathMap).forEach(function(rid){
        var e=repRidPathMap[rid];
        var np=repNormXrefPath(e.fullPath);
        if(np===tn){ best=e; return; }
        if(!best&&np.split(',')[0]===tn) best=e;
    });
    if(best){ navigateToRubric(repCurrentBook,repCurrentChapter,best.rid,true); return; }
    var inp=document.getElementById('repBrowserSearch');
    if(inp){ inp.value=target; searchRepertoryBrowser(); showToast('🔍 '+target); }
}

// 🔑 chapter tree is ready -> enter folder view (root of chapter)
function renderTree(chKey,chName,tree){
    repCurrentTree=tree; repCurrentChName=chName; repCurrentChKey=chKey;
    buildRidPathMap(tree);
    // 🔑 a rubric detail page was requested while the chapter was loading
    if(repPendingDetail&&repRidPathMap.hasOwnProperty(repPendingDetail.rid)){
        var pe=repRidPathMap[repPendingDetail.rid];
        repFolderPath=pe.path.slice(0,-1);
        repCurrentDetail={full:pe.fullPath,rid:repPendingDetail.rid,labels:pe.path.slice()};
        repPendingDetail=null; repPendingNavRid=null;
        repCurrentFlatTree=[]; repRidToFlatIndex={}; repFolderFilter='';
        renderChapterList();
        renderRubricDetail();
        return;
    }
    repPendingDetail=null;
    repCurrentFlatTree=[]; repRidToFlatIndex={};
    repFolderFilter='';
    if(repPendingNavRid&&repRidPathMap.hasOwnProperty(repPendingNavRid)){
        var entry=repRidPathMap[repPendingNavRid];
        repFolderPath=entry.path.slice(0,-1);   // parent folder of the target rubric
        repTreePage=0; repCurrentDetail=null; repClipViewOpen=false;
        renderChapterList();
        renderFolderView();
        return;   // renderFolderCards flashes the pending rubric card
    }
    if(repPendingPath){ repFolderPath=repPendingPath.slice(); repPendingPath=null; }
    else { repFolderPath=[]; repTreePage=0; }
    repCurrentDetail=null; repClipViewOpen=false;
    renderChapterList();
    renderFolderView();
}
// 🔑 compat alias — old callers (restoreRepSearchContext) land here
function renderTreePage(chKey,chName,page){
    if(typeof page==='number') repTreePage=page;
    if(repCurrentTree) renderFolderView();
}

// 🔑 SEARCH MODE TOGGLE: 'all' = whole repertory, 'chapter' = only the open chapter
// 🔑 3 SEARCH MODES: 'chapter' = open chapter only | 'book' = current book, all chapters | 'all' = ALL books
var REP_MODE_ORDER = ['chapter', 'book', 'all'];
var repSearchMode = 'book';   // 🔑 default: search the whole open/current repertory (all its chapters)
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
    repLastSearchView=null;
    repCurrentDetail=null; repClipViewOpen=false;
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
        if(typeof initRepertoryBrowser === 'function') initRepertoryBrowser();
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
    var idx = REP_MODE_ORDER.indexOf(repSearchMode);
    repSearchMode = REP_MODE_ORDER[(idx+1) % REP_MODE_ORDER.length];
    updateRepSearchModeUI();
    _repSearchSeq++;
    _repSearchCache=''; _repSearchResults=null;
    var inp=document.getElementById('repBrowserSearch');
    if(inp && inp.value.trim().length>=2){ searchRepertoryBrowser(); }
    else { restoreRepSearchContext(); }
    var msgs = {
        chapter: {ur:'📖 صرف کھلے چیکٹر میں سرچ', en:'📖 Searching OPEN chapter only', roman:'📖 Open chapter mein search'},
        book:    {ur:'📚 اس ریپرٹری کے تمام چیپٹرز میں سرچ', en:'📚 Searching this repertory — ALL chapters', roman:'📚 Is repertory ke tamam chapters mein search'},
        all:     {ur:'🌐 تمام ریپرٹریز کے تمام چیپٹرز میں سرچ', en:'🌐 Searching ALL repertories — ALL chapters', roman:'🌐 Tamam repertories ke tamam chapters mein search'}
    };
    var m = msgs[repSearchMode] || msgs.book;
    showToast(repLangText(m));
}
function updateRepSearchModeUI(){
    // 🔑 new toolbar has a scope DROPDOWN instead of the old toggle button
    var sel=document.getElementById('repScopeSelect');
    if(sel&&sel.value!==repSearchMode) sel.value=repSearchMode;
    var placeholders = {
        chapter:{ur:'🔍 صرف کھلے چیکٹر میں تلاش کریں... (مثلاً pain)', en:'🔍 Search open chapter only... (e.g. pain)', roman:'🔍 Sirf open chapter mein search... (e.g. pain)'},
        book:   {ur:'🔍 اس ریپرٹری کے تمام چیپٹرز میں تلاش کریں... (مثلاً pain)', en:'🔍 Search this repertory — all chapters... (e.g. pain)', roman:'🔍 Is repertory ke tamam chapters mein search... (e.g. pain)'},
        all:    {ur:'🔍 تمام ریپرٹریز کے تمام چیپٹرز میں تلاش کریں... (مثلاً pain)', en:'🔍 Search all repertories — all chapters... (e.g. pain)', roman:'🔍 Tamam repertories ke tamam chapters mein search... (e.g. pain)'}
    };
    var inp=document.getElementById('repBrowserSearch');
    if(inp){
        inp.placeholder = repLangText(placeholders[repSearchMode] || placeholders.book);
    }
}
// 🔑 scope dropdown changed from the toolbar (HomeoSetu "Rubric / Subrubric" style)
function setRepSearchScope(v){
    if(REP_MODE_ORDER.indexOf(v)===-1) return;
    if(v===repSearchMode) return;
    repSearchMode=v;
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
    if(repSearchMode==='chapter' && !repCurrentChapter){
        cd.innerHTML='<div class="empty-state"><div class="icon">📖</div><p>'+repLangText({ur:'پہلے کوئی چیکٹر کھولیں، پھر سرچ کریں',en:'Open a chapter first, then search',roman:'Pehle chapter open karein, phir search'})+'</p></div>';
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
    repCurrentDetail=null; repClipViewOpen=false;   // new search leaves detail/clipboard view
    var searchSeq = ++_repSearchSeq;
    var cd=document.getElementById('repRubricContent');
    cd.innerHTML='<div style="text-align:center;padding:20px;">🔍 '+repLangText({ur:'تلاش جاری ہے...',en:'Searching...',roman:'Search ho raha hai...'})+(repSearchMode==='all'?' <br><small style="font-size:10px;">('+repLangText({ur:'تمام ریپرٹریز لوڈ ہو رہی ہیں — تھوڑا وقفہ',en:'loading all repertories — one moment',roman:'tamam repertories load ho rahi hain — ek lamha'})+')</small>':'')+'</div>';

    // legacy @chapter filter
    var chF=null,ai=q.indexOf('@');
    if(ai!==-1){
        var aa=q.substring(ai+1).split(/\s+/)[0],cf=aa.toLowerCase();
        repChapterNames.forEach(function(c){if(c.name.toLowerCase().indexOf(cf)!==-1)chF=c.key;});
        q=(q.substring(0,ai)+q.substring(ai+1+aa.length)).trim();
        if(q.length<2){ showRepSearchPlaceholder(); return; }
    }

    var cacheKey=q+'|'+(chF||'')+'|'+repSearchMode+'|'+repCurrentChapter+'|'+repCurrentBook;
    if(cacheKey===_repSearchCache && _repSearchResults!==null && repSearchMode!=='all'){
        displaySearchResults(_repSearchResults.results,_repSearchResults.info);
        return;
    }
    _repSearchCache=cacheKey; _repSearchMode=repSearchMode;
    q=q.toLowerCase();
    var qw=q.split(/\s+/).filter(function(w){return w.length>0;});

    function searchStillActive(){
        var activeInp=document.getElementById('repBrowserSearch');
        return searchSeq===_repSearchSeq && activeInp && activeInp.value.trim().length>=2;
    }
    function matches(text){
        if(!text) return false;
        if(qw.length===0) return true;
        var lt=text.toLowerCase();
        for(var i=0;i<qw.length;i++){ if(lt.indexOf(qw[i])===-1) return false; }
        return true;
    }
    function scanData(sd, bookKey, chFilter){
        var out=[];
        var chs = chFilter ? [chFilter] : Object.keys(sd);
        chs.forEach(function(ck){
            var rubs=sd[ck]; if(!rubs)return;
            Object.keys(rubs).forEach(function(rid){
                var rub=rubs[rid]; if(!rub)return;
                var t=rub.path||rub.de_path||rub.t||'';
                if(matches(t)) out.push({text:t, remedies:rub.r||{}, chapter:ck, rid:rid, book:bookKey});
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
        var modeLabel = repSearchMode==='chapter' ? repLangText({ur:'📖 کھلا چیکٹر',en:'📖 Open chapter',roman:'📖 Open chapter'})
                      : repSearchMode==='book'    ? repLangText({ur:'📚 اس ریپرٹری کے تمام چیپٹرز',en:'📚 This repertory — all chapters',roman:'📚 Is repertory ke tamam chapters'})
                      :                              repLangText({ur:'🌐 تمام ریپرٹریز کے تمام چیپٹرز',en:'🌐 ALL repertories — all chapters',roman:'🌐 Tamam repertories ke tamam chapters'});
        var info='🔍 '+modeLabel+' &nbsp;"'+escapeHtml(qw.join(' '))+'"';
        if(chF){ info+=' '+repLangText({ur:'میں',en:'in',roman:'mein'})+' <b>'+escapeHtml(getChapterDisplayName(repCurrentBook,chF))+'</b>'; }
        info+=' → <b>'+total.toLocaleString()+'</b> '+repLangText({ur:'ربرکس',en:'rubrics',roman:'rubrics'});
        // show per-book breakdown in all-books mode; no cap, all matching rubrics are displayed.
        if(repSearchMode==='all' && perBookCount){
            var parts=[];
            Object.keys(perBookCount).forEach(function(bk){
                var bi=REP_BOOK_INFO[bk]; if(!bi)return;
                parts.push(bi.abbr+':'+perBookCount[bk].toLocaleString());
            });
            if(parts.length>1) info+=' <small style="color:#555;">('+parts.join(' · ')+')</small>';
        }
        return info;
    }

    function loadSingleBookData(bookKey, cb){
        if(bookKey===repCurrentBook && _repFullData!==null){ cb(_repFullData); return; }
        if(_allBooksData && _allBooksData[bookKey]){ cb(_allBooksData[bookKey]); return; }
        var info = REP_BOOK_INFO[bookKey];
        if(!info){ cb(null); return; }
        fetch(info.dataFile).then(function(r){return r.json();}).then(function(d){
            if(!_allBooksData) _allBooksData = {};
            _allBooksData[bookKey] = d;
            if(bookKey===repCurrentBook) _repFullData = d;
            cb(d);
        }).catch(function(e){ console.error('book data load fail', bookKey, e); cb(null); });
    }
    function ensureSingleBookIndex(bookKey, dataForFallback, cb){
        if(_allBookChapters[bookKey]){ cb(); return; }
        if(bookKey===repCurrentBook && repChapterNames && repChapterNames.length){
            _allBookChapters[bookKey] = repChapterNames;
            cb(); return;
        }
        var info = REP_BOOK_INFO[bookKey];
        if(!info){ cb(); return; }
        fetch(info.chapDir+'_index.json').then(function(r){return r.json();}).then(function(d){
            _allBookChapters[bookKey]=d;
            cb();
        }).catch(function(){
            var src = dataForFallback || (_allBooksData && _allBooksData[bookKey]) || null;
            _allBookChapters[bookKey] = src ? Object.keys(src).map(function(k){
                return {key:k, name:k.replace(/_/g,' ').replace(/\b\w/g,function(c){return c.toUpperCase();}), rubrics:Object.keys(src[k]||{}).length};
            }) : [];
            cb();
        });
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
            var modeLabel = repLangText({ur:'🌐 تمام ریپرٹریز کے تمام چیپٹرز',en:'🌐 ALL repertories — all chapters',roman:'🌐 Tamam repertories ke tamam chapters'});
            return '🔍 '+modeLabel+' &nbsp;"'+escapeHtml(qw.join(' '))+'" → <b>'+total.toLocaleString()+'</b> '+repLangText({ur:'ربرکس',en:'rubrics',roman:'rubrics'})+countsText();
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
                var badgeColor = r.book==='publicum'?'#1a5276':(r.book==='kent'?'#16a085':(r.book==='kent_de'?'#d35400':'#8e44ad'));
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
            var badge = (r.book==='publicum'?'#1a5276':(r.book==='kent'?'#16a085':(r.book==='kent_de'?'#d35400':'#8e44ad')));
            h+='<div class="rep-rubric-item" style="cursor:pointer;border-radius:6px;margin:2px 0;padding:8px 10px;background:#fff;border:1px solid #eef2f5;" onclick="navigateToRubric(\''+safeBook+'\',\''+safeChapter+'\',\''+safeRid+'\')" onmouseover="this.style.background=\'#f0f8ff\'" onmouseout="this.style.background=\'#fff\'">';
            h+='<div class="rep-rubric-header" style="font-size:13px;line-height:1.5;"><span style="display:inline-block;background:'+badge+';color:white;padding:1px 6px;border-radius:5px;font-size:9px;font-weight:bold;margin-left:4px;vertical-align:middle;">'+bookInfo.abbr+'</span> '+highlighted+'</div>';
            h+='<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:2px;">';
            var rems=Object.keys(r.remedies||{});
            rems.sort(function(a,b){return(r.remedies[b]||1)-(r.remedies[a]||1)||a.localeCompare(b);});
            rems.slice(0,40).forEach(function(abbr){var g=r.remedies[abbr]||1;h+='<span class="rep-remedy-tag g'+g+'" onclick="event.stopPropagation();copyRemedyToPrescription(\''+escapeHtml(abbr)+'\')">'+escapeHtml(abbr)+'</span>';});
            if(rems.length>40) h+='<span style="font-size:10px;color:#7f8c8d;align-self:center;">+'+(rems.length-40)+' more</span>';
            h+='</div><div style="margin-top:4px;font-size:10px;color:#2980b9;font-weight:bold;">'+repLangText({ur:'↩ یہاں کھولیں',en:'↩ open here',roman:'↩ yahan kholen'})+'</div></div>';
            return h;
        }
        function appendBookResults(bookKey, results, done){
            if(!searchStillActive()) return;
            var container=document.getElementById('repAllSearchResults');
            if(!container) return;
            var bookInfo=REP_BOOK_INFO[bookKey] || {abbr:'?', name:bookKey};
            var color = bookKey==='publicum'?'#1a5276':(bookKey==='kent'?'#16a085':(bookKey==='kent_de'?'#d35400':'#8e44ad'));
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
    // @chapter always wins (searches current book, that one chapter)
    if(chF){
        setTimeout(function(){
            if(!searchStillActive()) return;
            function ds(sd){ finalize(scanData(sd, repCurrentBook, chF)); }
            if(_repFullData!==null){ ds(_repFullData); } else { loadRepData(function(d){ ds(d); }); }
        },10);
        return;
    }
    if(repSearchMode==='chapter'){
        // search only the open chapter
        setTimeout(function(){
            if(!searchStillActive()) return;
            var chKey=repCurrentChapter;
            if(!chKey){ showRepSearchPlaceholder(); return; }
            function run(raw){
                if(!searchStillActive()) return;
                var out=[];
                if(raw){
                    Object.keys(raw).forEach(function(rid){
                        var rub=raw[rid]; if(!rub)return;
                        var t=(rub.path||rub.de_path||rub.t||'').replace(/\s+,/g,',').replace(/,\s*/g,', ').replace(/  +/g,' ').trim();
                        if(matches(t)) out.push({text:t, remedies:rub.r||{}, chapter:chKey, rid:rid, book:repCurrentBook});
                    });
                }
                finalize(out);
            }
            var basePath = REP_BOOK_INFO[repCurrentBook].chapDir;
            fetch(basePath+chKey+'.json?v=8').then(function(rr){return rr.json();}).then(run).catch(function(){
                if(!searchStillActive()) return;
                // fallback to cached tree
                if(repTreeCache[chKey]){
                    var out=[];
                    (function walk(node){
                        (node.order||[]).forEach(function(k){
                            var c=node.children[k]; if(!c)return;
                            if(c.hasRubric&&c.rid){
                                if(matches(c.path)) out.push({text:c.path, remedies:c.remedies||{}, chapter:chKey, rid:c.rid, book:repCurrentBook});
                            }
                            if(c.order&&c.order.length) walk(c);
                        });
                    })(repTreeCache[chKey]);
                    finalize(out);
                } else {
                    cd.innerHTML='<div class="empty-state"><p>❌ '+escapeHtml('Chapter not loaded')+'</p></div>';
                }
            });
        },10);
        return;
    }
    if(repSearchMode==='book'){
        // search the whole current book: ALL chapters, no result cap
        setTimeout(function(){
            if(!searchStillActive()) return;
            function ds(sd){ finalize(scanData(sd, repCurrentBook, null)); }
            if(_repFullData!==null){ ds(_repFullData); } else { loadRepData(function(d){ ds(d); }); }
        },10);
        return;
    }
    // 'all' mode: search ALL books, ALL chapters, incrementally.
    // Current/open repertory is shown first; other repertories are appended one by one.
    setTimeout(function(){
        if(!searchStillActive()) return;
        runIncrementalAllSearch();
    },10);
}

function loadRepData(cb){
    if(_repFullData!==null){ cb(_repFullData); return; }
    var info = REP_BOOK_INFO[repCurrentBook];
    fetch(info.dataFile).then(function(r){return r.json();}).then(function(d){
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
            fetch(info.dataFile).then(function(r){return r.json();}).then(function(d){
                dataResult[bk]=d; pending--; done();
            }).catch(function(e){ console.error('data load fail',bk,e); pending--; done(); });
        }
        if(needIdx){
            fetch(info.chapDir+'_index.json').then(function(r){return r.json();}).then(function(d){
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
        rc.innerHTML='<div class="empty-state"><div class="icon">🔍</div><p>'+(currentLang==='ur'?'کوئی ربرک نہیں ملی':'No rubrics found')+'</p></div><div id="repDockArea"></div>';
        repDockNoFolder();
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
    var qw=(_repSearchCache.split('|')[0]||'').toLowerCase().split(/\s+/).filter(function(w){return w.length>0;});
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
            var badgeColor = r.book==='publicum'?'#1a5276':(r.book==='kent'?'#16a085':(r.book==='kent_de'?'#d35400':'#8e44ad'));
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
        h+='<div class="rep-rubric-header" style="font-size:13px;line-height:1.5;"><span style="display:inline-block;background:'+(''+(r.book==='publicum'?'#1a5276':(r.book==='kent'?'#16a085':(r.book==='kent_de'?'#d35400':'#8e44ad'))))+';color:white;padding:1px 6px;border-radius:5px;font-size:9px;font-weight:bold;margin-left:4px;vertical-align:middle;">'+bookInfo.abbr+'</span> '+highlighted+'</div>';
        h+='<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:2px;">';
        var rems=Object.keys(r.remedies);
        rems.sort(function(a,b){return(r.remedies[b]||1)-(r.remedies[a]||1)||a.localeCompare(b);});
        var remsShown=rems.slice(0,40);
        remsShown.forEach(function(abbr){var g=r.remedies[abbr]||1;h+='<span class="rep-remedy-tag g'+g+'" onclick="event.stopPropagation();copyRemedyToPrescription(\''+escapeHtml(abbr)+'\')">'+escapeHtml(abbr)+'</span>';});
        if(rems.length>40) h+='<span style="font-size:10px;color:#7f8c8d;align-self:center;">+'+(rems.length-40)+' more</span>';
        h+='</div>';
        h+='<div style="margin-top:4px;font-size:10px;color:#2980b9;font-weight:bold;">'+(currentLang==='ur'?'↩ یہاں کھولیں':'↩ open here')+'</div>';
        h+='</div>';
    });
    h+='<div id="repDockArea"></div>';
    rc.innerHTML=h;
    rc.scrollTop=0;
    repDockNoFolder();
}

// 🔑 PRECISE navigation: open the chapter (in the right book) and scroll/flash the exact rubric (by ID)
function navigateToRubric(bookKey, chKey, rid, openDetail){
    if(!chKey){ return; }
    rid = String(rid||'');
    bookKey = bookKey || repCurrentBook;
    chKey = normalizeChapterKey(bookKey, chKey);

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
        if(typeof initRepertoryBrowser === 'function') initRepertoryBrowser();
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
        var f=function(){ repRenderDock(); };
        if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',f);
        else f();
    })();
}

function closeRepertoryChart(){document.getElementById('repChartOverlay').classList.remove('active');}
