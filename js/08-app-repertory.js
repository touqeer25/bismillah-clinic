// ============================================================
// Bismillah Clinic — js/08-app-repertory.js
// REPERTORY BROWSER (books, chapters, tree, search)
// NOTE: Ye index.html ke inline script ka hissa hai (sirf jagah badli hai).
// WARNING: In files ka LOAD ORDER kabhi na badlein!
// ============================================================

// ==================== REPERTORY BROWSER ====================
// 🔑 per-book metadata so we can (a) load data/index files, (b) show abbreviations
var REP_BOOK_INFO = {
    publicum:    { abbr: 'Pub',  name: 'Repertorium Publicum', dataFile: 'repertory-data.json',                 chapDir: 'repertory_chapters/',        color:'#1a5276', tree:'prefix' },
    kent:        { abbr: 'Kent', name: 'Kent (English)',       dataFile: 'kent_repertory.json',                  chapDir: 'kent_chapters/',             color:'#16a085', tree:'prefix', notesFile:'kent_rubric_notes.json' },
    kent_de:     { abbr: 'K-DE', name: 'Kent (German)',        dataFile: 'kent_de_repertory_by_key.json',        chapDir: 'kent_de_chapters/',          color:'#d35400' },
    synthesis91: { abbr: 'Syn',  name: 'Syn 9.1 (Supplement)',  dataFile: 'synthesis91_raw_repertory_by_key.json', chapDir: 'synthesis91_raw_chapters/', color:'#8e44ad' },
    /* 🔑 Homeosetu سے کلون کی گئی 4 ریپرٹریز (Sep 2026) — ابواب کی ترتیب کتاب کے مطابق (keepOrder) */
    allen_fever: { abbr: 'A-Fev', name: 'Allen Fever Repertory',              dataFile: 'allen_fever_repertory.json', chapDir: 'allen_fever_chapters/', color:'#c0392b', tree:'prefix', keepOrder:true },
    hs_clinical: { abbr: 'Clin',  name: 'Clinical Repertory (Clarke/Boericke/Allen/Hering)', dataFile: 'hs_clinical_repertory.json', chapDir: 'hs_clinical_chapters/', color:'#2e86c1', tree:'prefix', keepOrder:true },
    keynotes_cc: { abbr: 'Key',   name: 'Keynotes & Clinical Concordance',    dataFile: 'keynotes_cc_repertory.json', chapDir: 'keynotes_cc_chapters/', color:'#7d6608', tree:'prefix', keepOrder:true },
    nosodes:     { abbr: 'Nos',   name: 'Intercurrent Nosodes & Sarcodes',    dataFile: 'nosodes_repertory.json',     chapDir: 'nosodes_chapters/',     color:'#117a65', tree:'prefix', keepOrder:true }
};
/* 🔑 کتاب کے مطابق رنگ / فولڈر — ہر جگہ یہی helper استعمال ہو (hard-coded ternaries نہیں) */
function repBookColor(book){ var bi=REP_BOOK_INFO[book]; return (bi&&bi.color)||'#8e44ad'; }
function repChapDir(book){ var bi=REP_BOOK_INFO[book||repCurrentBook]; return (bi&&bi.chapDir)||'repertory_chapters/'; }
var _allBooksData = null;       // {publicum:{...}, kent:{...}, ...} cache for all-books mode
var _allBookChapters = {};      // {publicum:[{key,name,rubrics}], ...} per-book chapter index (for name lookup)
var repLastSearchView = null;   // {results, info} saved for the "back to results" button
// 🔑 v45: ڈیفالٹ کتاب = Kent (صارف درخواست — ڈراپ ڈاؤن میں کینٹ ٹاپ پر)
var repCurrentBook = 'kent';
// 🔑 v45: ہر ریپرٹری کا ڈیفالٹ چیپٹر — کتاب کھلنے پر مائنڈ خود بخود کھلتا ہے (صارف درخواست)
var REP_DEFAULT_CHAPTER = { kent:'mind', publicum:'mind', synthesis91:'mind', kent_de:'gemuet', allen_fever:'type', hs_clinical:'clinical_clarke', keynotes_cc:'generalities', nosodes:'generalities' };
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
    if (!order && REP_BOOK_INFO[book] && REP_BOOK_INFO[book].keepOrder) {
        return arr.slice();   // 🔑 _index.json کی ترتیب = کتاب کی اصل ترتیب (Allen Fever وغیرہ)
    }
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


function initRepertoryBrowser(noAutoChapter) {
    ensureRemedyNames();                                   // 🔑 background: ادویات کے پورے نام
    ensureRepNotes(repCurrentBook, function(){});          // 🔑 background: ربرک نوٹس (اگر کتاب کے پاس ہوں)
    var infoEl = document.getElementById('repCountInfo');
    if (infoEl) infoEl.textContent = 'Loading chapters...';

    // 🔑 v45: کتاب کھلنے پر ڈیفالٹ چیپٹر (مائنڈ) خود بخود کھولو — جب کوئی چیپٹر پہلے سے کھلا نہ ہو
    // (noAutoChapter=true اندرونی فلو (سرچ بحالی / ربرک نیویگیشن) کے لیے — وہاں منزل بعد میں خود آتی ہے)
    function repAutoOpenDefaultChapter(){
        if(noAutoChapter) return;
        if(repCurrentChapter) return;
        var dk = REP_DEFAULT_CHAPTER[repCurrentBook] || 'mind';
        var found = false;
        for(var i=0;i<repChapterNames.length;i++){ if(repChapterNames[i].key===dk){ found=true; break; } }
        if(!found && repChapterNames.length){ dk=repChapterNames[0].key; found=true; }   // 🔑 نئی کتابیں: پہلا باب
        if(found) selectChapter(dk);
    }

    function loadChaptersAndRender() {
        var basePath = repChapDir(repCurrentBook);
        var indexFile = basePath + '_index.json';
        fetch(indexFile).then(function(r){return r.json();}).then(function(data){
            // data is array of {key, name, rubrics}
            repChapterNames = sortChaptersForBook(repCurrentBook, data);
            var t=0; repChapterNames.forEach(function(c){t+=c.rubrics;});
            renderChapterList();
            repAutoOpenDefaultChapter();
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
            repAutoOpenDefaultChapter();
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
    var basePath=repChapDir(repCurrentBook);
    fetch(basePath+chKey+'.json?v=14').then(function(r){return r.json();}).then(function(d){
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
    if(repCurrentBook === 'kent' || repCurrentBook === 'publicum' || (REP_BOOK_INFO[repCurrentBook] && REP_BOOK_INFO[repCurrentBook].tree === 'prefix')) return _repBuildTreeByExistingRubrics(data);

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
      +(repFolderPath.length?'<button class="rpd-chev" id="repDetailChev" onclick="repToggleDetailInfo()" title="'+repLangText({ur:'مکمل تفصیل دیکھیں/چھپائیں',en:'Show/hide full details',roman:'Mukammal tafseel dekhein/chhupaein'})+'">&#9662;</button>':'')
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
// 🔑 v45: فولڈر ویو میں «یہ ربرک خود» کارڈ — مین ربرک کی اپنی ریمیڈیز اب یہاں سے کھلتی ہیں
// (صارف: ABSENT-MINDED کی 111 ریمیڈیز فولڈر کھولنے پر نہیں دکھ رہی تھیں — چاروں ریپرٹریز کے ہر فولڈر پر لاگو)
function repSelfOpen(){
    var node=repResolveNode(repFolderPath);
    if(!node||!node.rid) return;
    repOpenRubricDetail(repFullPathOf(repFolderPath),String(node.rid),repFolderPath.slice());
}
function repSelfCardHtml(node){
    var rems=Object.keys(node.remedies||{}).length;
    var label=repFolderPath[repFolderPath.length-1];
    return '<div class="rpc-card self" onclick="repSelfOpen()">'
        +'<div class="rpc-card-top"><div class="rpc-ico doc self">📄</div>'
        +'<span class="rpc-self-tag">'+repLangText({ur:'مین ربرک',en:'MAIN RUBRIC',roman:'MAIN RUBRIC'})+'</span></div>'
        +'<div class="rpc-title" dir="ltr">'+escapeHtml(label)+'</div>'
        +'<div class="rpc-badges"><span class="rpc-badge rems" onclick="event.stopPropagation();repSelfOpen()">⚡ '+rems+' '+repLangText({ur:'ادویات',en:'remedies',roman:'remedies'})+'</span>'
        +'<span class="rpc-self-hint">👁 '+repLangText({ur:'اس ربرک کی اپنی ادویات دیکھیں',en:'view this rubric\'s own remedies',roman:'is rubric ki apni adwiyat dekhein'})+'</span></div>'
        +'</div>';
}
function repSelfRowHtml(node){
    var rems=Object.keys(node.remedies||{}).length;
    var label=repFolderPath[repFolderPath.length-1];
    return '<div class="rpl-row self" onclick="repSelfOpen()">'
        +'<div class="rpc-ico doc self" style="width:30px;height:30px;font-size:14px;">📄</div>'
        +'<div class="rpl-name" dir="ltr">'+escapeHtml(label)+'</div>'
        +'<div class="rpl-badges"><span class="rpc-self-tag">'+repLangText({ur:'مین ربرک',en:'MAIN RUBRIC',roman:'MAIN RUBRIC'})+'</span>'
        +'<span class="rpc-badge rems" onclick="event.stopPropagation();repSelfOpen()">⚡ '+rems+'</span></div>'
        +'</div>';
}
function repCardHtml(it){
    var c=it.node,kids=_repNodeKids(c);
    var rems=Object.keys(c.remedies||{}).length;
    var rid=c.hasRubric&&c.rid?String(c.rid):'';
    var full=_repJoinSeg(repFullPathOf(repFolderPath),it.label);
    var badges='';
    if(kids) badges+='<span class="rpc-badge kids">📁 '+c.order.length+'</span>';
    if(rems) badges+='<span class="rpc-badge rems" onclick="event.stopPropagation();repOpenRubricDetail(_repFullOf(this),_repRidOf(this))" data-full="'+_repAttr(full)+'" data-rid="'+_repAttr(rid)+'">⚡ '+rems+' '+repLangText({ur:'ادویات',en:'remedies',roman:'remedies'})+'</span>';
    if(!badges) badges='<span class="rpc-empty">Empty</span>';
    return '<div class="rpc-card" data-kids="'+(kids?1:0)+'" data-label="'+_repAttr(it.label)+'" data-full="'+_repAttr(full)+'" data-rems="'+rems+'"'+(rid?' data-rid="'+_repAttr(rid)+'"':'')+' onclick="repCardClick(this)">'
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
    return '<div class="rpl-row" data-kids="'+(kids?1:0)+'" data-label="'+_repAttr(it.label)+'" data-full="'+_repAttr(full)+'" data-rems="'+rems+'"'+(rid?' data-rid="'+_repAttr(rid)+'"':'')+' onclick="repCardClick(this)">'
        +'<div class="rpc-ico '+(kids?'folder':'doc')+'" style="width:30px;height:30px;font-size:14px;">'+(kids?'📁':'📄')+'</div>'
        +'<div class="rpl-name" dir="ltr">'+escapeHtml(it.label)+'</div>'
        +'<div class="rpl-badges">'+badges+'</div>'
        +'<button class="rpc-kebab rpl-kebab" onclick="event.stopPropagation();repKebabShow(event,this)" data-full="'+_repAttr(full)+'" data-rid="'+_repAttr(rid)+'" title="'+repLangText({ur:'کاپی / تفصیل / کلپ بورڈ میں شامل کریں',en:'Copy / details / add to clipboard',roman:'Copy / tafseel / clipboard mein shamil'})+'">⋮</button>'
        +'</div>';
}
function _repFullOf(el){ return el.getAttribute('data-full')||''; }
function _repRidOf(el){ return el.getAttribute('data-rid')||''; }
function _repJs(s){ return String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function repCardClick(el){
    repKebabHide();
    var labels=repFolderPath.concat([el.getAttribute('data-label')]);
    // 🔑 v46: ربرک کی اپنی ریمیڈیز ہوں تو پہلے ہی کلک پر ڈیٹیل پیج (ریمیڈیز فوراً نظر آئیں) —
    // فولڈر ویو کا اضافی قدم ختم (صارف: پہلا کلک صرف چوڑائی بڑھاتا تھا، دوسرے کلک پر ریمیڈیز آتی تھیں)۔
    // ذیلی ربرکس ڈیٹیل پیج کے SUB-RUBRICS سیکشن میں ہی مل جاتے ہیں۔
    if((el.getAttribute('data-rems')||'0')!=='0'){ repOpenRubricDetail(_repFullOf(el),_repRidOf(el),labels); return; }
    if(el.getAttribute('data-kids')==='1'){ repGo(labels); }
    else { repOpenRubricDetail(_repFullOf(el),_repRidOf(el),labels); }
}

function renderFolderCards(){
    var area=document.getElementById('repCardsArea'); if(!area)return;
    var node=repResolveNode(repFolderPath);
    if(!node){ area.innerHTML=''; repRenderDock(); return; }
    // 🔑 v45: فولڈر کی اپنی ربرک کے پاس ریمیڈیز ہوں تو اوپر خصوصی «مین ربرک» کارڈ — فلٹر سے متاثر نہیں ہوتا
    var selfHtml='';
    if(repFolderPath.length && node.hasRubric && node.rid && Object.keys(node.remedies||{}).length){
        selfHtml = (repViewMode==='grid') ? repSelfCardHtml(node) : repSelfRowHtml(node);
    }
    var items=node.order.map(function(k){ return {label:k,node:node.children[k]}; });
    if(repFolderFilter){
        var f=repFolderFilter.toLowerCase();
        items=items.filter(function(it){ return it.label.toLowerCase().indexOf(f)!==-1; });
    }
    items.sort(function(a,b){ var c=a.label.localeCompare(b.label); return repSortAsc?c:-c; });
    // 🔑 v42 صارف درخواست: پیجیشن ختم — پورے فولڈر/باب کی تمام ربرکس ایک ہی صفحے پر رینڈر ہوتی ہیں
    var total=items.length;
    var h=selfHtml;
    if(!total){
        if(!selfHtml) h='<div class="rep-empty-folder">'+repLangText({ur:'اس فولڈر میں کوئی ربرک نہیں',en:'No rubrics in this folder',roman:'Is folder mein koi rubric nahi'})+'</div>';
    }
    else if(repViewMode==='grid'){
        h+='<div class="rep-cards-grid">';
        for(var i=0;i<total;i++) h+=repCardHtml(items[i]);
        h+='</div>';
    } else {
        h+='<div class="rep-cards-list">';
        for(var j=0;j<total;j++) h+=repListRowHtml(items[j]);
        h+='</div>';
    }
    area.innerHTML=h;
    repRenderDock();
    if(repPendingNavRid){
        var fr=repPendingNavRid; repPendingNavRid=null;
        setTimeout(function(){ flashRubricRow(fr); },80);
    }
}

// 🔑 v42: پیجیشن ہٹا دی گئی — repPageWindow/repGoPage/repTreePageSize سلائسنگ اب موجود نہیں؛
// تمام ربرکس ایک صفحے پر، ڈاک میں 12 کلپ بورڈ چپس (موبائل پر افقی، ڈیسک ٹاپ پر بائیں پٹی میں عمودی)

// ==================== 12 CLIPBOARDS (floating, persisted) — v45: 8 سے 12 (صارف درخواست) ====================
// HomeoSetu فنکشن کلون: فلوٹنگ ڈاک میں 12 کلپ بورڈز — ہر کلپ بورڈ ایک
// محفوظ ورکنگ لسٹ ہے (ربرکس جو آپ ریپرٹورائزیشن کے لیے اکٹھا کر رہے ہیں)۔
// ربرک کارڈ کے ⋮ مینو سے شامل/ہٹائیں؛ ڈاک کے نمبر پر کلک سے لسٹ کھلتی ہے۔
var REP_N_CLIPS=12;
var repClipboards=[[],[],[],[],[],[],[],[],[],[],[],[]];   // each item: {book,ch,rid,path,rems,ts,w,sel}
var repActiveClip=0;               // 0..11 (displayed 1..12)
var repClipElims=[false,false,false,false,false,false,false,false,false,false,false,false];  // 🔑 Elimination Mode per clipboard (workbench)
var repClipNames=['','','','','','','','','','','',''];    // 🔑 custom clipboard names (workbench ✏ rename)
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
        while(d.length<REP_N_CLIPS)d.push([]); if(d.length===REP_N_CLIPS)repClipboards=d; } } }catch(e){}
    // 🔑 v38 migration: every item gets a multiplier weight (default 1x)
    for(var i=0;i<REP_N_CLIPS;i++)(repClipboards[i]||[]).forEach(function(it){ if(typeof it.w!=='number')it.w=1; });
    repClipOptsLoad();
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
                +repWChip(it.w)
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
    navigateToRubric(it.book,it.ch,it.rid,true);
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

// ============================================================
// 🔑 RUBRIC DETAIL PAGE (HomeoSetu clone — clinic layout)
// کارڈ کلک → ڈیٹیل پیج: عنوان کے آگے < آئکن سے ڈیٹیلز ایکسپینڈ/ہائیڈ،
// پھر پہلے REMEDIES سیکشن اور نیچے SUB-RUBRICS کے کلک ایبل کارڈز۔
// ڈیٹیلز: مطلب | مریض کا ورژن | صحیح استعمال | کراس ریفرنس (کھلی کتاب)
//         | کراس ریفرنس (ایپ — باقی تینوں ریپرٹریز میں متبادل)
// ============================================================
var REP_CHAPTER_UR_EXTRA={type:'قسم',time:'وقت',cause:'سبب',prodrome:'ابتدائی علامات',commencement_of_chill:'لرزے کا آغاز',chill_location_of:'لرزہ — جگہ',chill_aggravated:'لرزہ — اضافہ',chill_ameliorated_by:'لرزہ — کمی',symptoms_during_the_chill:'لرزے کے دوران علامات',chill_character_of:'لرزے کی نوعیت',chill_symptoms_during:'لرزے کے دوران علامات',chill_followed_by:'لرزے کے بعد',heat_aggravated_by:'حرارت — اضافہ',heat_ameliorated_by:'حرارت — کمی',heat_absent:'حرارت غائب',heat_symptoms_during:'حرارت کے دوران علامات',heat_followed_by:'حرارت کے بعد',heat_characteristics_of:'حرارت کی نوعیت',sweat_aggravated_by:'پسینہ — اضافہ',sweat_ameliorated_by:'پسینہ — کمی',sweat_followed_by:'پسینے کے بعد',sweat_produced_by:'پسینہ کس سے',sweat_character_of:'پسینے کی نوعیت',sweat_time_of:'پسینے کا وقت',sweat_location_of:'پسینہ — جگہ',sweat_symptoms_during:'پسینے کے دوران علامات',symptoms_of_tongue_appetite_taste:'زبان، بھوک، ذائقہ',apyrexia_symptoms_during:'بخار کے وقفے کی علامات',typhoid_typhus_prodromic_stage:'ٹائیفائیڈ/ٹائیفس ابتدائی مرحلہ',symptoms_of_the_mind:'ذہنی علامات',sensorium:'حواس',head_internal:'سر (اندرونی)',head_external:'سر (بیرونی)',eyes_and_sight:'آنکھیں اور بینائی',hearing_and_ears:'سماعت اور کان',smell_and_nose:'سونگھنا اور ناک',gastric:'معدی',clinical_clarke:'کلینیکل (Clarke)',clinical_boericke:'کلینیکل (Boericke)',clinical_allen:'کلینیکل (Allen)',clinical_hering:'کلینیکل (Hering)',clinical_hempel:'کلینیکل (Hempel)',clinical_pulte:'کلینیکل (Pulte)',clinical_conditions:'کلینیکل حالتیں',children:'بچے',respiratory_system:'نظامِ تنفس',observation:'مشاہدہ',stools:'پاخانہ',urinary_organs:'پیشاب کے اعضا',larynx_trachea:'حلقوم و سانس کی نالی',ears_nose_throat:'کان ناک حلق',female_reproductive_system:'زنانہ تولیدی نظام',voice_speech:'آواز و گفتگو',circulatory_system_heart_pulse:'دورانِ خون (دل/نبض)',sensation:'احساس',relationships:'ادویات کے تعلقات',fever_chills_heat_sweat:'بخار-لرزہ-حرارت-پسینہ',central_nervous_system:'مرکزی اعصابی نظام',relations:'تعلقات',eyes:'آنکھیں',male:'مردانہ',female:'زنانہ',respiratory:'تنفس',circulation:'دورانِ خون'};
var REP_CHAPTER_UR={mind:'ذہن',vertigo:'چکر آنا',head:'سر',eye:'آنکھ',vision:'بصارت',ear:'کان',hearing:'سماعت',nose:'ناک',face:'چہرہ',mouth:'منہ',teeth:'دانت',throat:'حلق (اندرونی)',external_throat:'حلق (بیرونی)',stomach:'معدہ',abdomen:'پیٹ',rectum:'ملاچر',stool:'پاخانہ',bladder:'مثانہ',kidneys:'گردے',prostate_gland:'پروسٹیٹ',urethra:'پیشاب کی نالی',urine:'پیشاب',genitalia_male:'مردانہ اعضا',genitalia_female:'زنانہ اعضا',larynx_and_trachea:'حلقوم و سانس کی نالی',respiration:'سانس',cough:'کھانسی',expectoration:'بلغم',chest:'سینہ',back:'کمر',extremities:'ہاتھ پاؤں',sleep:'نیند',chill:'لرزہ',fever:'بخار',perspiration:'پسینہ',skin:'جلد',generalities:'عمومیات',appetite:'بھوک',blood:'خون',clinical:'کلینیکل'};
Object.keys(REP_CHAPTER_UR_EXTRA).forEach(function(k){ if(!REP_CHAPTER_UR[k]) REP_CHAPTER_UR[k]=REP_CHAPTER_UR_EXTRA[k]; });
// ============================================================
// 🔑 RUBRIC NOTES (Homeosetu سے درآمد: meaning / patient version / when to use / clinical conditions)
//    فائل: REP_BOOK_INFO[book].notesFile → {chapterKey:{rid:{t,m,pv,pv2,wu,cc}}}
//    Kent کا اصل ڈیٹا (kent_chapters/) بالکل نہیں چھیڑا گیا — نوٹس الگ فائل میں ہیں۔
// ============================================================
var _repNotes={};          // book -> data | null(failed)
var _repNotesByTitle={};   // book -> {normTitle: note}
function repNotesNorm(t){
    return String(t||'').toLowerCase().replace(/\((?:see|cmp|comp|cf)\.?[^)]*\)/gi,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
function ensureRepNotes(book,cb){
    book=book||repCurrentBook;
    var bi=REP_BOOK_INFO[book];
    if(!bi||!bi.notesFile){ cb(null); return; }
    if(_repNotes.hasOwnProperty(book)){ cb(_repNotes[book]); return; }
    fetch(bi.notesFile+'?v=1').then(function(r){ return r.json(); }).then(function(d){
        _repNotes[book]=d||null;
        var idx={};
        Object.keys(d||{}).forEach(function(ck){ Object.keys(d[ck]).forEach(function(rid){ var e=d[ck][rid]; if(e&&e.t){ var k=repNotesNorm(e.t); if(!idx[k]) idx[k]=e; } }); });
        _repNotesByTitle[book]=idx;
        cb(_repNotes[book]);
    }).catch(function(){ _repNotes[book]=null; _repNotesByTitle[book]={}; cb(null); });
}
function repNoteFor(full,rid,book,chKey){
    book=book||repCurrentBook; chKey=chKey||repCurrentChapter;
    var d=_repNotes[book]; if(!d) return null;
    var ch=d[chKey]||d[String(chKey).toLowerCase()];
    if(ch&&rid&&ch[rid]) return ch[rid];
    var idx=_repNotesByTitle[book]||{};
    return idx[repNotesNorm(full)]||null;
}
// 🔑 remedy full names (abbr -> Latin name) — remedy_names.json (homeosetu fullForm سے)
var _repRemedyNames=null,_repRemedyNamesLoading=false;
function ensureRemedyNames(cb){
    if(_repRemedyNames){ if(cb)cb(_repRemedyNames); return; }
    if(_repRemedyNamesLoading){ if(cb)setTimeout(function(){ensureRemedyNames(cb);},300); return; }
    _repRemedyNamesLoading=true;
    fetch('remedy_names.json?v=1').then(function(r){return r.json();}).then(function(d){ _repRemedyNames=d||{}; _repRemedyNamesLoading=false; if(cb)cb(_repRemedyNames); })
    .catch(function(){ _repRemedyNames={}; _repRemedyNamesLoading=false; if(cb)cb(_repRemedyNames); });
}
function repRemedyTitle(abbr){
    var a=String(abbr||'').toLowerCase();
    var n=_repRemedyNames&&(_repRemedyNames[a]||_repRemedyNames[a.replace(/\.$/,'')]);
    return n?(abbr+' = '+n):abbr;
}
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
// 🔑 v45 فکس: loadSingleBookData/ensureSingleBookIndex پہلے searchRepertoryBrowser کے نیسٹڈ اسکوپ میں تھے —
// buildXrefIndex (ٹاپ لیول) کے لیے ReferenceError دیتا تھا → ایپ کراس-ریفرنس پینل ⏳ پر اٹک جاتا تھا۔ اب ٹاپ لیول۔
function loadSingleBookData(bookKey, cb){
    if(bookKey===repCurrentBook && _repFullData!==null){ cb(_repFullData); return; }
    if(_allBooksData && _allBooksData[bookKey]){ cb(_allBooksData[bookKey]); return; }
    var info = REP_BOOK_INFO[bookKey];
    if(!info){ cb(null); return; }
    fetch(info.dataFile + '?v=14').then(function(r){return r.json();}).then(function(d){
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
    var c=repBookColor(book);
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
// 🔑 shared expandable details block (detail page + folder header دونوں استعمال کرتے ہیں)
// سیکشنز: مطلب (لغت) | مریض کا ورژن | صحیح استعمال | کراس ریفرنس (کھلی کتاب)
//         | کراس ریفرنس (ایپ — باقی تینوں ریپرٹریز)
// o: {full, rid, kidsCount, abbrs, g3, pureXref, seeT, parentLabels}
function repDetailInfoHtml(o){
    var full=o.full||'';
    var seeT=o.seeT||[];
    var pureXref=!!o.pureXref;
    var kidsCount=o.kidsCount||0;
    var abbrs=o.abbrs||[];
    var g3=o.g3||[];
    var toks=repMeaningTokens(full);
    var sense=repSenseNoteFor(toks);
    var chUr=REP_CHAPTER_UR[String(repCurrentChapter).toLowerCase()]||'';
    var note=repNoteFor(full,o.rid)||{};   // 🔑 Homeosetu سے درآمد شدہ نوٹس (اگر اس ربرک کے لیے موجود ہوں)
    var srcTag='<span class="rpd-src">📘 Homeosetu</span>';
    var h='<div class="rpd-info" id="repDetailInfo">';
    // 1) MEANING
    h+='<div class="rpd-sec meaning"><span class="rpd-lab">📖 '+repLangText({ur:'مطلب (MEANING)',en:'MEANING',roman:'MATLAB (MEANING)'})+'</span>';
    if(note.m) h+='<div class="rpd-note" dir="ltr">'+srcTag+escapeHtml(note.m)+'</div>';
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
    if(note.pv) h+='<div class="rpd-note" dir="ltr">'+srcTag+escapeHtml(note.pv)+'</div>';
    if(note.pv2) h+='<div class="rpd-note" dir="ltr">'+srcTag+escapeHtml(note.pv2)+'</div>';
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
    h+='<div class="rpd-sec when"><span class="rpd-lab">✅ '+repLangText({ur:'صحیح استعمال کہاں (WHEN TO USE)',en:'WHEN TO USE',roman:'SAHIH ISTEMAL KAHAN'})+'</span>';
    if(note.wu) h+='<div class="rpd-note" dir="ltr">'+srcTag+escapeHtml(note.wu)+'</div>';
    h+='<div>'+(chUr?('یہ ربرک «<b>'+escapeHtml(chUr)+'</b>» باب میں آتی ہے۔ '):'');
    if(pureXref){
        h+='<span class="rpd-warn">⚠ '+repLangText({ur:'یہ صرفِ اشارہ ربرک ہے — خود کوئی ادویہ نہیں رکھتی۔ اصل ربرک «',en:'This is a cross-reference only — no remedies of its own. Open the real rubric «',roman:'Ye sirf ishara rubric hai — asal rubric «'})+'<b dir="ltr">'+escapeHtml(seeT[0]||'')+'</b>» '+repLangText({ur:'کھول کر استعمال کریں۔',en:'instead.',roman:'khol kar istemal karein.'})+'</span>';
    } else {
        if(kidsCount) h+=repLangText({ur:'اس کے نیچے ',en:'It has ',roman:'Is ke neeche '})+'<b>'+kidsCount+'</b> '+repLangText({ur:'ذیلی ربرکس ہیں (وقت، جگہ، حالت کے مطابق) — اگر مریض کی تفصیل معلوم ہو تو ذیلی ربرک زیادہ درست انتخاب ہے۔ ',en:'sub-rubrics (time, place, condition) — if details are known, a sub-rubric is more accurate. ',roman:'zeli rubrics hain — tafseel maloom ho to zeli rubric behtar hai.'});
        if(abbrs.length) h+=repLangText({ur:'اس ربرک پر ',en:'',roman:'Is rubric par '})+'<b>'+abbrs.length+'</b> '+repLangText({ur:'ادویات درج ہیں، جن میں ',en:' remedies are listed, including ',roman:'adwiyat darj hain, jin mein '})+'<b>'+g3.length+'</b> '+repLangText({ur:'مضبوط درجے (گریڈ 3) کی ہیں — ریپرٹورائزیشن میں پہلے انہی پر غور کریں۔ ',en:' strong grade-3 remedies — consider those first in repertorisation. ',roman:'grade-3 mazboot hain — pehle inhi par ghour karein.'});
        h+=repLangText({ur:'کیس ٹیکنگ میں مریض کے اپنے الفاظ اسی ربرک سے ملتے ہوں تو یہی ربرک منتخب کریں۔',en:'Pick this rubric when the patient\'s own words match it during case-taking.',roman:'Case-taking mein mareez ke alfaaz is rubric se milte hon to yehi muntakhib karein.'});
    }
    h+='</div></div>';
    // 3.5) 🔑 v45: ربرک کی اپنی ادویات (صرف فولڈر ویو کا ایکسپینڈ ایبل پینل — showRems فلیگ سے)
    if(o.showRems && abbrs.length){
        var rmObj=o.remsObj||{};
        var sorted=abbrs.slice().sort(function(a,b){ return (rmObj[b]||1)-(rmObj[a]||1)||a.localeCompare(b); });
        h+='<div class="rpd-sec rems"><span class="rpd-lab">💊 '+repLangText({ur:'اس ربرک کی اپنی ادویات (OWN REMEDIES)',en:'OWN REMEDIES OF THIS RUBRIC',roman:'IS RUBRIC KI APNI ADWIYAT'})+'</span>';
        h+='<div class="rpd-chips">';
        sorted.forEach(function(a){
            var g=rmObj[a]||1; g=(g>=3)?3:((g===2)?2:1);
            h+='<span class="rep-remedy-tag g'+g+'" onclick="copyRemedyToPrescription(\''+escapeHtml(a)+'\')">'+escapeHtml(a)+'</span>';
        });
        h+='</div>';
        h+='<div style="font-size:10.5px;color:#9a7d0a;margin-top:4px;">'+repLangText({ur:'کلک سے پریسکرپشن میں کاپی ہوگی',en:'click a remedy to copy it',roman:'click se copy ho jayegi'})+'</div>';
        h+='</div>';
    }
    // 3b) CLINICAL CONDITIONS (Homeosetu tags — کن امراض میں یہ ربرک کام آتی ہے)
    if(note.cc){
        h+='<div class="rpd-sec clinical"><span class="rpd-lab">🩺 '+repLangText({ur:'کلینیکل حالتیں (CLINICAL CONDITIONS)',en:'CLINICAL CONDITIONS',roman:'CLINICAL CONDITIONS'})+'</span><div class="rpd-tokchips">';
        String(note.cc).split(/\s*,\s*/).forEach(function(cc){ if(cc) h+='<span class="rpd-tok rpd-cc" dir="ltr">'+escapeHtml(cc)+'</span>'; });
        h+='</div><div class="rpd-srcline">'+srcTag+repLangText({ur:'ماخذ: Homeosetu Kent — کلینیکل اشارے',en:'source: Homeosetu Kent clinical tags',roman:'source: Homeosetu Kent clinical tags'})+'</div></div>';
    }
    // 4) CROSS REFERENCE (open repertory)
    h+='<div class="rpd-sec xbook"><span class="rpd-lab">🔗 '+repLangText({ur:'کراس ریفرنس — کھلی ریپرٹری (OPEN REPERTORY)',en:'CROSS REFERENCE (OPEN REPERTORY)',roman:'CROSS REFERENCE — khuli repertory'})+'</span>';
    if(seeT.length){
        h+='<div class="rpd-xchips">';
        seeT.forEach(function(t){ h+='<span class="rpd-xchip" onclick="repXrefGo(\''+_repJs(t)+'\')">➡ '+escapeHtml(t)+'</span>'; });
        h+='</div>';
    } else {
        var parentLabels=o.parentLabels||[];
        h+='<div style="color:#8aa0b2;font-size:11.5px;">'+repLangText({ur:'اس ربرک میں کتابی کراس ریفرنس درج نہیں۔',en:'No printed cross-reference on this rubric.',roman:'Is rubric mein kitabi cross reference darj nahi.'});
        if(parentLabels.length) h+=' '+repLangText({ur:'والدہ ربرک:',en:'Parent rubric:',roman:'Walida rubric:'})+' <span class="rpd-xchip" onclick="repGo('+JSON.stringify(parentLabels).replace(/"/g,'&quot;')+')" dir="ltr">'+escapeHtml(parentLabels[parentLabels.length-1])+'</span>';
        h+='</div>';
    }
    h+='</div>';
    // 5) CROSS REFERENCE (APP)
    h+='<div class="rpd-sec xapp"><span class="rpd-lab">🔗 '+repLangText({ur:'کراس ریفرنس — ایپ (APP: باقی ریپرٹریز)',en:'CROSS REFERENCE (APP: other repertories)',roman:'CROSS REFERENCE — app (baqi repertories)'})+'</span><div id="repXrefAppBody" class="rpd-xbody"><span style="color:#8aa0b2;font-size:11.5px;">⏳ '+repLangText({ur:'دوسری ریپرٹریز میں متبادل تلاش ہو رہا ہے...',en:'Searching other repertories for matches...',roman:'Doosri repertories mein mutabad talash ho raha hai...'})+'</span></div></div>';
    h+='</div>'; // /rpd-info
    return h;
}
// 🔑 the detail page itself (glossary ensured first — meaning tokens need it)
function renderRubricDetail(){
    if(!_repGlossary&&!_repGlossaryFailed){ ensureRepGlossary(function(){ renderRubricDetail(); }); return; }
    var _bi=REP_BOOK_INFO[repCurrentBook];
    if(_bi&&_bi.notesFile&&!_repNotes.hasOwnProperty(repCurrentBook)){ ensureRepNotes(repCurrentBook,function(){ renderRubricDetail(); }); return; }
    if(!_repRemedyNames&&!_repRemedyNamesLoading){ ensureRemedyNames(function(){ renderRubricDetail(); }); return; }
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
    // ---- title row: rubric text + < expander AFTER text + copy
    h+='<div class="rpd-titlerow">'
      +'<div class="rpd-title" dir="ltr">'+escapeHtml(full||'—')+'</div>'
      +'<button class="rpd-chev" id="repDetailChev" onclick="repToggleDetailInfo()" title="'+repLangText({ur:'مکمل تفصیل دیکھیں/چھپائیں',en:'Show/hide full details',roman:'Mukammal tafseel dekhein/chhupaein'})+'">&#9662;</button>'
      +'<button class="rc-btn" onclick="repDetailAddClip()" title="'+repLangText({ur:'فعال کلپ بورڈ میں شامل کریں',en:'Add to active clipboard',roman:'Faal clipboard mein shamil karein'})+'">📋</button>'
      +'</div>';
    h+='<div class="rpd-meta">'+repBookBadgeHtml(repCurrentBook)+'<span>'+escapeHtml(bi.name)+'</span>'
      +'<span>📁 '+escapeHtml(repCurrentChName||'')+'</span>'
      +(d.rid?'<span>#'+escapeHtml(String(d.rid))+'</span>':'')
      +'<span>⚡ '+abbrs.length+' '+repLangText({ur:'ادویات',en:'remedies',roman:'remedies'})+'</span>'
      +(kids.length?'<span>📁 '+kids.length+' '+repLangText({ur:'ذیلی ربرکس',en:'sub-rubrics',roman:'zeli rubrics'})+'</span>':'')
      +'</div>';
    // ---- expandable details (collapsed by default, < toggles) — shared builder
    h+=repDetailInfoHtml({full:full,rid:d.rid,kidsCount:kids.length,abbrs:abbrs,g3:g3,
        pureXref:pureXref,seeT:seeT,
        parentLabels:(d.labels&&d.labels.length>1)?d.labels.slice(0,-1):[]});
    // ---- REMEDIES (FIRST — per user requirement)
    h+='<div class="rpd-sec-head">💊 '+repLangText({ur:'ادویات',en:'REMEDIES',roman:'ADWIYAT'})+' <span class="cnt">('+abbrs.length+')</span></div>';
    if(!abbrs.length){
        h+='<div class="rrp-norems">'+(pureXref?repLangText({ur:'یہ کراس ریفرنس ربرک ہے — اوپر اصل ربرک کھولیں',en:'This is a cross-reference rubric — open the real rubric above',roman:'Ye cross-reference rubric hai — asal rubric kholen'}):repLangText({ur:'اس ربرک میں کوئی ادویات محفوظ نہیں',en:'No remedies recorded under this rubric',roman:'Is rubric mein koi adwiyat mehfooz nahi'}))+'</div>';
    } else {
        // 🔑 تمام ریمیڈیز ایک ہی لسٹ میں (گریڈ ہیڈنگز نہیں) — ترتیب: گریڈ 3 → 2 → 1، رنگ سے گریڈ پہچان (v39: ہیلپر ٹیکسٹ ہٹا دیا گیا)
        h+='<div class="rpd-chips">';
        abbrs.forEach(function(a){
            var g=rems[a]||1; g=(g>=3)?3:((g===2)?2:1);
            h+='<span class="rep-remedy-tag g'+g+'" title="'+_repAttr(repRemedyTitle(a))+'" onclick="copyRemedyToPrescription(\''+escapeHtml(a)+'\')">'+escapeHtml(a)+'</span>';
        });
        h+='</div>';
    }
    // ---- SUB-RUBRICS (بس جب ذیلی ربرکس موجود ہوں — خالی سیکشن بالکل نہیں دکھانا)
    if(kids.length){
        h+='<div class="rpd-sec-head">📁 '+repLangText({ur:'ذیلی ربرکس',en:'SUB-RUBRICS',roman:'ZELI RUBRICS'})+' <span class="cnt">('+kids.length+')</span></div>';
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
    cd.innerHTML=h;
    cd.scrollTop=0;
    repRenderDock();
    // async: app cross-reference (other books)
    repRenderXrefAppBody(full,d.rid);
}
// 🔑 ڈیٹیل پیج کا 📋 بٹن: ربرک کا متن سسٹم کلپ بورڈ میں کاپی کرنے کے بجائے
// اب ربرک کو فعال ریپرٹورائزیشن کلپ بورڈ (repActiveClip) میں شامل کرتا ہے۔
function repDetailAddClip(){
    var d=repCurrentDetail||{};
    if(!d.rid){ showToast(repLangText({ur:'یہ ربرک کلپ بورڈ میں شامل نہیں ہو سکتی',en:'This rubric cannot be added to a clipboard',roman:'Ye rubric clipboard mein shamil nahi ho sakti'})); return; }
    var ci=repActiveClip;
    if(repClipFind(ci,repCurrentBook,d.rid)!==-1){
        showToast(repLangText({ur:'ℹ️ یہ ربرک پہلے سے '+repClipLabel(ci)+' میں موجود ہے',en:'ℹ️ Already in '+repClipLabel(ci),roman:'Ye rubric pehle se '+repClipLabel(ci)+' mein mojood hai'}));
        return;
    }
    var remsCount=0;
    var e=(d.rid&&repRidPathMap[d.rid])?repRidPathMap[d.rid]:null;
    if(e) remsCount=Object.keys(e.node.remedies||{}).length;
    repClipboards[ci].unshift({book:repCurrentBook,ch:repCurrentChapter,rid:String(d.rid),path:d.full,rems:remsCount,ts:Date.now()});
    repClipsSave(); repRenderDock();
    showToast('➕ '+repLangText({ur:repClipLabel(ci)+' میں شامل ہو گیا',en:'Added to '+repClipLabel(ci),roman:repClipLabel(ci)+' mein shamil ho gaya'}));
    if(repClipViewOpen) renderClipView();
}
function repDetailChildHtml(it){
    var c=it.node,kids=_repNodeKids(c);
    var rems=Object.keys(c.remedies||{}).length;
    var rid=c.hasRubric&&c.rid?String(c.rid):'';
    var full=_repJoinSeg(repDetailParentFull(),it.label);
    // 🔑 v48: والد کی پوری زنجیر محفوظ رکھو — پہلے slice(0,-1) موجودہ ربرک خود کو ہٹا دیتا تھا،
    // جس سے گہرائی میں جاتے ہوئے breadcrumb زنجیر مین ربرک کھو دیتی تھی (صارف کی شکایت)
    var labels=(repCurrentDetail&&repCurrentDetail.labels?repCurrentDetail.labels.slice():repFolderPath.slice()).concat([it.label]);
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
        repTreePage=0; repCurrentDetail=null; repClipViewOpen=false;repWorkbenchOpen=false;repCompareOpen=false;repAnalysisOpen=-1;
        renderChapterList();
        renderFolderView();
        return;   // renderFolderCards flashes the pending rubric card
    }
    if(repPendingPath){ repFolderPath=repPendingPath.slice(); repPendingPath=null; }
    else { repFolderPath=[]; repTreePage=0; }
    repCurrentDetail=null; repClipViewOpen=false;repWorkbenchOpen=false;repCompareOpen=false;repAnalysisOpen=-1;
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
// 🔑 HomeoSetu search TYPE dropdown (image 2026-09-19_06-12-59): 4 modes
var REP_SEARCH_TYPES = ['rubric', 'remedy', 'rubric_remedy', 'clinical'];
var REP_TYPE_LABELS = {
    rubric:       {ur:'🔤 ربرک / سب ربرک', en:'🔤 Rubric / Subrubric', roman:'🔤 Rubric / Subrubric'},
    remedy:       {ur:'💊 ادویہ', en:'💊 Remedy', roman:'💊 Remedy'},
    rubric_remedy:{ur:'🔤💊 ربرک + ادویہ', en:'🔤💊 Rubric + Remedy', roman:'🔤💊 Rubric + Remedy'},
    clinical:     {ur:'🏥 کلینیکل حالت', en:'🏥 Clinical Condition', roman:'🏥 Clinical Condition'}
};
var repSearchMode = 'rubric';   // 🔑 default type: rubric / subrubric text search
// 🔑 v40 RESTORED: search SCOPE dropdown — 'chapter' = open chapter only | 'book' = current repertory | 'all' = ALL repertories
var REP_SCOPE_ORDER = ['chapter', 'book', 'all'];
var repSearchScope = 'book';    // default: whole current repertory (old v47 behaviour)
var repSearchAllBooks = false;  // 🔒 v41: sidebar all-books search REMOVED — flag kept (always false) for engine routing; use scope dropdown 'all' instead
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
    var qw=q.split(/\s+/).filter(function(w){return w.length>0;});

    function searchStillActive(){
        var activeInp=document.getElementById('repBrowserSearch');
        return searchSeq===_repSearchSeq && activeInp && activeInp.value.trim().length>=2;
    }
    function matchesText(text){
        if(!text) return false;
        if(qw.length===0) return true;
        var lt=text.toLowerCase();
        for(var i=0;i<qw.length;i++){ if(lt.indexOf(qw[i])===-1) return false; }
        return true;
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
            h+='<div class="rep-rubric-header" style="font-size:13px;line-height:1.5;"><span style="display:inline-block;background:'+badge+';color:white;padding:1px 6px;border-radius:5px;font-size:9px;font-weight:bold;margin-left:4px;vertical-align:middle;">'+bookInfo.abbr+'</span> '+highlighted+'</div>';
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
    fetch(info.dataFile + '?v=14').then(function(r){return r.json();}).then(function(d){
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
            fetch(info.dataFile + '?v=14').then(function(r){return r.json();}).then(function(d){
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
        h+='<div class="rep-rubric-header" style="font-size:13px;line-height:1.5;"><span style="display:inline-block;background:'+repBookColor(r.book)+';color:white;padding:1px 6px;border-radius:5px;font-size:9px;font-weight:bold;margin-left:4px;vertical-align:middle;">'+bookInfo.abbr+'</span> '+highlighted+'</div>';
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
        var f=function(){ repRenderDock(); };
        if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',f);
        else f();
    })();
}

function closeRepertoryChart(){document.getElementById('repChartOverlay').classList.remove('active');}

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
    if(it.book===repCurrentBook&&repRidPathMap&&repRidPathMap[String(it.rid)]) return repRidPathMap[String(it.rid)].node.remedies||{};
    var sd=all?all[it.book]:null; if(!sd)return {};
    var ch=sd[it.ch]||sd[normalizeChapterKey(it.book,it.ch)]||null; if(!ch)return {};
    var r=ch[String(it.rid)]||null;
    return (r&&r.r)?r.r:{};
}
function _repAnaCompute(items,all){
    // 🔑 v38 weighted scoring: item.w = 0.5x | 1x | 2x | 4x | -1x (negative = subtract / eliminate)
    var rows=[],col={},denom=0;
    items.forEach(function(it){
        var w=(typeof it.w==='number')?it.w:1;
        var rems=repClipItemRemedies(it,all)||{};
        rows.push({it:it,rems:rems,w:w});
        if(w>0)denom+=w;
        Object.keys(rems).forEach(function(a){
            var g=rems[a]||1; g=g>=3?3:(g===2?2:1);
            var e=col[a]; if(!e)e=col[a]={cov:0,total:0};
            if(w>0){ e.cov+=w; e.total+=g*w; }
            else   { e.cov-=1; e.total-=g*Math.abs(w); }
        });
    });
    if(denom<=0)denom=1;
    var abbrs=Object.keys(col).sort(function(a,b){
        var d=col[b].cov-col[a].cov; if(d)return d;
        d=col[b].total-col[a].total; if(d)return d;
        return a.localeCompare(b);
    });
    return {rows:rows,col:col,abbrs:abbrs,denom:denom};
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
function repOpenWorkbench(){
    repKebabHide(); repWbMenuHide();
    repHistBack.push(repCurrentState()); repHistFwd=[];
    repWorkbenchOpen=true; repCompareOpen=false; repAnalysisOpen=-1; repCurrentDetail=null; repClipViewOpen=false;
    repWbTab='clips';
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
    navigateToRubric(it.book,it.ch,it.rid,true);
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
    if(repWorkbenchOpen)renderWorkbench();
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
    h+='<button class="danger" onclick="repWbMenuHide();repClipDelete('+ci+','+i+')">🗑 '+repLangText({ur:'ربرک ڈیلیٹ کریں',en:'Delete Rubric',roman:'Delete Rubric'})+'</button>';
    return h;
}
function renderWorkbench(){
    var cd=document.getElementById('repRubricContent'); if(!cd)return;
    repUpdateNavButtons(); repRenderBreadcrumb();
    var h='<div class="rep-tool-head"><div class="rep-content-title"><span>⚙</span><b>'+repLangText({ur:'کیس ریپرٹورائزیشن — ورک بینچ',en:'CASE REPERTORISATION — WORKBENCH',roman:'CASE REPERTORISATION — WORKBENCH'})+'</b></div>'
        +'<button class="rc-btn" onclick="repCloseToolView()">✕ '+repLangText({ur:'بند کریں',en:'Close',roman:'Band karein'})+'</button></div>';
    // tabs: Clipboards | Grid (N remedies) — HomeoSetu style
    h+='<div class="rep-wb-tabs">'
        +'<button class="'+(repWbTab!=='grid'?'on':'')+'" onclick="repWbSetTab(\'clips\')">📋 '+repLangText({ur:'کلپ بورڈز',en:'Clipboards',roman:'Clipboards'})+'</button>'
        +'<button class="'+(repWbTab==='grid'?'on':'')+'" onclick="repWbSetTab(\'grid\')">📊 '+repLangText({ur:'گرڈ',en:'Grid',roman:'Grid'})+' <span id="repWbGridN" class="cnt">…</span></button>'
        +'</div>';
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
    var h='<p class="rep-tool-sub">'+repLangText({ur:'بارہ کلپ بورڈز ایک جگہ — ہر ربرک پر ⋮ مینو (ترتیب، ویٹ، منتقلی، ڈیلیٹ)۔ ایلی منیشن موڈ والے کلپ بورڈ کے بغیر ادویات گرڈ سے ہٹ جاتی ہیں۔',en:'All 12 clipboards in one place — every rubric has a ⋮ menu (order, weight, move, delete). Remedies not covered by an Elimination-Mode clipboard are removed from the Grid.',roman:'Barah clipboards aik jagah — har rubric ka ⋮ menu (tarteeb, weight, move, delete).'})+'</p>';
    h+='<div class="rep-wb-grid">';
    for(var ci=0;ci<REP_N_CLIPS;ci++){
        var l=repClipboards[ci]||[];
        h+='<div class="rep-wb-panel'+(repActiveClip===ci?' active':'')+(repClipElims[ci]?' elim':'')+'">';
        h+='<div class="rep-wb-head"><button class="rep-wb-title" onclick="repToggleClipView('+ci+')" title="'+repLangText({ur:'لسٹ ویو میں کھولیں',en:'Open in list view',roman:'List view mein kholen'})+'">📋 '+escapeHtml(repClipLabel(ci))+' <span class="cnt">('+l.length+')</span></button>'
            +'<div class="rep-wb-actions">'
            +'<button class="rc-btn" onclick="repClipRename('+ci+')" title="'+repLangText({ur:'نام بدلیں',en:'Rename',roman:'Rename'})+'">✏</button>'
            +'<button class="rc-btn" onclick="repSetClipActive('+ci+')" title="'+repLangText({ur:'فعال بنائیں',en:'Make active',roman:'Faal banayein'})+'">🎯</button>'
            +'<button class="rc-btn" onclick="repOpenAnalysis('+ci+')" title="'+repLangText({ur:'اس کلپ بورڈ کا گرڈ',en:'This clipboard\'s grid',roman:'Is clipboard ka grid'})+'">📊</button>'
            +'<button class="rc-btn danger" onclick="repWorkbenchClear('+ci+')" title="'+repLangText({ur:'خالی کریں (دو بار دبائیں)',en:'Clear (press twice)',roman:'Khali karein (do bar dabaein)'})+'">🗑</button>'
            +'</div></div>';
        h+='<label class="rep-wb-elim" title="'+repLangText({ur:'گرڈ میں صرف وہی ادویات رہیں گی جو اس کلپ بورڈ کے ربرکس میں موجود ہوں',en:'Grid keeps only remedies covered by this clipboard\'s rubrics',roman:'Grid mein sirf wohi adwiyat rahengi'})+'">'
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
                    +repWChip(it.w)
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
        if(w>0)denom+=w;
        Object.keys(rems).forEach(function(a){
            var g=rems[a]||1; g=g>=3?3:(g===2?2:1);
            var e=col[a]; if(!e)e=col[a]={cov:0,total:0};
            if(w>0){ e.cov+=w; e.total+=g*w; }
            else   { e.cov-=1; e.total-=g*Math.abs(w); }
        });
    });
    if(denom<=0)denom=1;
    // Elimination Mode: a clipboard marked as elimination keeps ONLY remedies covered by its rubrics
    var elimNotes=[];
    for(var ci=0;ci<REP_N_CLIPS;ci++){
        if(!repClipElims[ci])continue;
        var items=(repClipboards[ci]||[]).filter(function(it){ return repWbSelCount()===0||it.sel; });
        if(!items.length)continue;
        var keep={};
        items.forEach(function(it){ var rems=repClipItemRemedies(it,all)||{}; Object.keys(rems).forEach(function(a){keep[a]=1;}); });
        var removed=0;
        Object.keys(col).forEach(function(a){ if(!keep[a]){ removed++; delete col[a]; } });
        if(removed||Object.keys(keep).length) elimNotes.push({clip:ci,removed:removed});
    }
    var abbrs=Object.keys(col).sort(function(a,b){
        var d=col[b].cov-col[a].cov; if(d)return d;
        d=col[b].total-col[a].total; if(d)return d;
        return a.localeCompare(b);
    });
    return {rows:rows,col:col,abbrs:abbrs,denom:denom,elimNotes:elimNotes};
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
            +'</div>';
        hh+='<div class="rep-ana-wrap"><table class="rep-ana-table"><thead><tr><th class="ana-rub">'+repLangText({ur:'ربرک',en:'Rubric',roman:'Rubric'})+'</th>';
        abbrs.forEach(function(a){ hh+='<th class="ana-rem'+(a===winner?' win':'')+'" dir="ltr" onclick="copyRemedyToPrescription(\''+escapeHtml(a)+'\')" title="'+escapeHtml(a)+' — '+res.col[a].cov+' / w'+res.col[a].total+'">'+escapeHtml(a.length>10?a.substring(0,9)+'…':a)+'</th>'; });
        hh+='</tr></thead><tbody>';
        res.rows.forEach(function(r){
            var it=r.it;
            hh+='<tr><td class="ana-rub" onclick="navigateToRubric(\''+_repJs(it.book)+'\',\''+_repJs(it.ch)+'\',\''+_repJs(String(it.rid))+'\',true)">'
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
        hh+='</tr></tfoot></table></div>';
        hh+='<p class="rep-tool-note">'+repLangText({ur:'گرڈ = بارہ کلپ بورڈز کے منتخب ربرکس (بغیر سلیکشن سب شامل)۔ ویٹ (0.5x–4x) اسکور کو گنا دیتا ہے، ‎-1x منہا ہے۔ ایلی منیشن موڈ والے کلپ بورڈ کے بغیر ادویات نکل جاتی ہیں۔ ڈاٹ = گریڈ، ربرک پر کلک = کھولیں۔',en:'Grid = selected rubrics of ALL clipboards (everything if none selected). Weights (0.5x–4x) multiply the score, -1x subtracts. Remedies not covered by an Elimination-Mode clipboard are removed. Dot = grade, click a rubric to open it.',roman:'Grid = tamam clipboards ke muntakhib rubrics. Weight score ko guna deta hai, -1x manfi hai.'})+'</p>';
        body2.innerHTML=hh;
    });
}

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
    h+='<div id="repAnaBody"><div class="rep-tool-loading">⏳ '+repLangText({ur:'ریپرٹری ڈیٹا لوڈ ہو رہا ہے...',en:'Loading repertory data...',roman:'Repertory data load ho raha hai...'})+'</div></div>';
    cd.innerHTML=h; cd.scrollTop=0;
    repRenderDock();
    repEnsureAllBooks(function(all){
        var body=document.getElementById('repAnaBody'); if(!body)return;
        var res=_repAnaCompute(l,all);
        if(!res.abbrs.length){ body.innerHTML='<div class="rep-tool-loading">'+repLangText({ur:'ان ربرکس پر کوئی ادویہ درج نہیں',en:'No remedies recorded on these rubrics',roman:'In rubrics par koi adwiyeh darj nahi'})+'</div>'; return; }
        var COLS=20, abbrs=res.abbrs.slice(0,COLS);
        var winner=abbrs[0], wcol=res.col[winner];
        var hh='<div class="rep-ana-sum">'
            +'<span class="rep-ana-winner">🏆 '+repLangText({ur:'سب سے زیادہ کور:',en:'Top coverage:',roman:'Sab se ziyada koor:'})+' <b dir="ltr">'+escapeHtml(winner)+'</b> — '+repFmtCov(wcol.cov,res.denom)+' ('+Math.max(0,Math.round(wcol.cov*100/res.denom))+'%)</span>'
            +(res.abbrs.length>COLS?'<span class="rep-ana-more">+'+(res.abbrs.length-COLS)+' '+repLangText({ur:'مزید ادویات',en:'more remedies',roman:'mazeed adwiyeh'})+'</span>':'')
            +'</div>';
        hh+='<div class="rep-ana-wrap"><table class="rep-ana-table"><thead><tr><th class="ana-rub">'+repLangText({ur:'ربرک',en:'Rubric',roman:'Rubric'})+'</th>';
        abbrs.forEach(function(a){ hh+='<th class="ana-rem'+(a===winner?' win':'')+'" dir="ltr" onclick="copyRemedyToPrescription(\''+escapeHtml(a)+'\')" title="'+escapeHtml(a)+' — '+res.col[a].cov+'/'+res.rows.length+'">'+escapeHtml(a.length>10?a.substring(0,9)+'…':a)+'</th>'; });
        hh+='</tr></thead><tbody>';
        res.rows.forEach(function(r){
            var it=r.it;
            hh+='<tr><td class="ana-rub" onclick="navigateToRubric(\''+_repJs(it.book)+'\',\''+_repJs(it.ch)+'\',\''+_repJs(String(it.rid))+'\',true)">'
                +repBookBadgeHtml(it.book)+' <span dir="ltr">'+escapeHtml(_repTruncPath(it.path||'—',52))+'</span></td>';
            abbrs.forEach(function(a){
                var g=r.rems[a]||0;
                hh+='<td class="ana-cell">'+(g?'<i class="rep-gr-dot d'+(g>=3?3:(g===2?2:1))+'" title="'+escapeHtml(a)+' = '+g+'"></i>':'')+'</td>';
            });
            hh+='</tr>';
        });
        hh+='</tbody><tfoot><tr><td class="ana-rub">'+repLangText({ur:'کوریج',en:'Coverage',roman:'Korage'})+'</td>';
        abbrs.forEach(function(a){ var e=res.col[a]; hh+='<td class="ana-total'+(a===winner?' win':'')+'">'+repFmtCov(e.cov,res.denom)+'</td>'; });
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
                hh+='<tr><td class="ana-rub">'+repBookBadgeHtml(u.it.book)+' <span dir="ltr" style="cursor:pointer;" onclick="navigateToRubric(\''+_repJs(u.it.book)+'\',\''+_repJs(u.it.ch)+'\',\''+_repJs(String(u.it.rid))+'\',true)">'+escapeHtml(_repTruncPath(u.it.path||'—',52))+'</span></td>';
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
    if(/(compare|کمپئیر|موازنہ)/.test(lq)){
        return B(repLangText({ur:'<b>⇄ موازنہ (Compare)</b> — 2 سے 12 کلپ بورڈز منتخب کریں: پہلے ربرکس آمنے سامنے (✓)، پھر <b>مشترکہ ادویات</b> — جو ہر کلپ بورڈ کی کم از کم ایک ربرک میں موجود ہوں؛ Σ بڑا = زیادہ کور۔',en:'<b>⇄ Compare</b> — pick 2–12 clipboards: first the rubrics side by side (✓), then the <b>common remedies</b> — those present in at least one rubric of every clipboard; higher Σ = more coverage.',roman:'Compare — 2-12 clipboards chunein: rubrics ✓, phir mushtarka adwiyeh; Σ barha = ziyada koor.'})+repAskActs([{fn:'repOpenCompare()',lab:'⇄ '+repLangText({ur:'Compare کھولیں',en:'Open Compare',roman:'Compare kholen'})}]));
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
    el.textContent=repLangText({ur:n+' منتخب',en:n+' selected',roman:n+' selected'});
}
