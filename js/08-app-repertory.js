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
    synthesis91: { abbr: 'Syn',  name: 'Synthesis 9.1',        dataFile: 'synthesis91_raw_repertory_by_key.json', chapDir: 'synthesis91_raw_chapters/' }
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

function switchRepertoryBook() {
    var sel = document.getElementById('repBookSelect');
    if (sel) repCurrentBook = sel.value;
    repCurrentChapter = ''; repTreeCache = {}; _repFullData = null;
    document.getElementById('repChapterList').innerHTML = '<div class="empty-state"><p>Loading...</p></div>';
    document.getElementById('repRubricContent').innerHTML = '<div class="empty-state"><div class="icon">📖</div><p>Select a chapter</p></div>';
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
            repChapterNames = data;
            repChapterNames.sort(function(a,b){return a.name.localeCompare(b.name);});
            var t=0; repChapterNames.forEach(function(c){t+=c.rubrics;});
            if(infoEl) infoEl.textContent = repChapterNames.length+' chapters | '+t.toLocaleString()+' rubrics';
            renderChapterList();
        }).catch(function(e){
            console.error('Failed to load index', e);
            // Fallback to hardcoded for kent
            if (repCurrentBook === 'kent') {
                repChapterNames = [{"key":"mind","name":"MIND","rubrics":4212},{"key":"vertigo","name":"VERTIGO","rubrics":523},{"key":"head","name":"HEAD","rubrics":6266},{"key":"eye","name":"EYE","rubrics":1723},{"key":"vision","name":"VISION","rubrics":933},{"key":"ear","name":"EAR","rubrics":1910},{"key":"hearing","name":"HEARING","rubrics":201},{"key":"nose","name":"NOSE","rubrics":1455},{"key":"face","name":"FACE","rubrics":2053},{"key":"mouth","name":"MOUTH","rubrics":1536},{"key":"teeth","name":"TEETH","rubrics":806},{"key":"throat","name":"THROAT INTERNAL","rubrics":1042},{"key":"external_throat","name":"EXTERNAL THROAT","rubrics":305},{"key":"stomach","name":"STOMACH","rubrics":2999},{"key":"abdomen","name":"ABDOMEN","rubrics":3200},{"key":"rectum","name":"RECTUM","rubrics":1209},{"key":"stool","name":"STOOL","rubrics":283},{"key":"bladder","name":"BLADDER","rubrics":820},{"key":"kidneys","name":"KIDNEYS","rubrics":355},{"key":"prostate_gland","name":"PROSTATE GLAND","rubrics":143},{"key":"urethra","name":"URETHRA","rubrics":607},{"key":"urine","name":"URINE","rubrics":465},{"key":"genitalia_male","name":"MALE GENITALIA","rubrics":1126},{"key":"genitalia_female","name":"FEMALE GENITALIA","rubrics":1400},{"key":"larynx_and_trachea","name":"LARYNX AND TRACHEA","rubrics":796},{"key":"respiration","name":"RESPIRATION","rubrics":719},{"key":"cough","name":"COUGH","rubrics":1442},{"key":"expectoration","name":"EXPECTORATION","rubrics":414},{"key":"chest","name":"CHEST","rubrics":3165},{"key":"back","name":"BACK","rubrics":3640},{"key":"extremities","name":"EXTREMITIES","rubrics":14915},{"key":"sleep","name":"SLEEP","rubrics":1014},{"key":"chill","name":"CHILL","rubrics":736},{"key":"fever","name":"FEVER","rubrics":586},{"key":"perspiration","name":"PERSPIRATION","rubrics":413},{"key":"skin","name":"SKIN","rubrics":1164},{"key":"generalities","name":"GENERALITIES","rubrics":1898}];
            } else {
                repChapterNames = [];
            }
            repChapterNames.sort(function(a,b){return a.name.localeCompare(b.name);});
            var t=0; repChapterNames.forEach(function(c){t+=c.rubrics;});
            if(infoEl) infoEl.textContent = repChapterNames.length+' chapters | '+t.toLocaleString()+' rubrics';
            renderChapterList();
        });
    }

    function renderChapterList(){
        var d=document.getElementById('repChapterList');if(!d)return;
        var ch=repChapterNames;
        var h='';
        ch.forEach(function(c){h+='<div class="rep-chapter-item'+(c.key===repCurrentChapter?' active':'')+'" onclick="selectChapter(\''+c.key+'\')">'+c.name+' <small style="opacity:0.6;">('+c.rubrics+')</small></div>';});
        d.innerHTML=h;
    }

    loadChaptersAndRender();
    document.getElementById('repRubricContent').innerHTML = '<div class="empty-state"><div class="icon">📖</div><p>Select a chapter</p></div>';

}
function renderChapterList(f){
    var d=document.getElementById('repChapterList');if(!d)return;
    var ch=repChapterNames;
    if(f){f=f.toLowerCase();ch=ch.filter(function(c){return c.name.toLowerCase().indexOf(f)!==-1;});}
    var h='<div style="font-weight:bold;font-size:13px;margin-bottom:8px;color:#1a5276;">Chapters ('+ch.length+')</div>';
    ch.forEach(function(c){h+='<div class="rep-chapter-item'+(c.key===repCurrentChapter?' active':'')+'" onclick="selectChapter(\''+c.key+'\')">'+c.name+' <small style="opacity:0.6;">('+c.rubrics+')</small></div>';});
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
var repRidToFlatIndex={};   // 🔑 rubric ID -> flat index (for precise navigation)
var repPendingNavRid=null;  // 🔑 rubric ID waiting to be scrolled-to after render
function renderTree(chKey,chName,tree){
    repCurrentTree=tree;repCurrentChName=chName;repCurrentChKey=chKey;
    var flat=[];
    repRidToFlatIndex={};   // rebuild index for this chapter
    function flatten(node,depth){
        (node.order||Object.keys(node.children)).forEach(function(k){
            var c=node.children[k];
            if(!c)return;
            var hc=(c.order&&c.order.length>0)||Object.keys(c.children||{}).length>0;
            // 🔑 every node carries its rid (if it is a true rubric leaf) so we can navigate to it
            flat.push({name:k,depth:depth,remedies:c.remedies||{},count:c.count||0,hasChildren:hc,hasRubric:!!c.hasRubric,path:c.path||'',oorep_id:c.oorep_id||null,rid:c.rid||null});
            // 🔑 map rubric ID -> position in flat list (only when this node IS the rubric leaf)
            if(c.hasRubric && c.rid){ repRidToFlatIndex[c.rid]=flat.length-1; }
            if(hc)flatten(c,depth+1);
        });
    }
    flatten(tree,0);repCurrentFlatTree=flat;repTreePage=0;
    // 🔑 if a navigation is pending, jump to the page containing that rubric
    if(repPendingNavRid && repRidToFlatIndex.hasOwnProperty(repPendingNavRid)){
        var targetPage=Math.floor(repRidToFlatIndex[repPendingNavRid]/repTreePageSize);
        var flashRid=repPendingNavRid; repPendingNavRid=null;
        renderTreePage(chKey,chName,targetPage);
        setTimeout(function(){ flashRubricRow(flashRid); },80);
    } else {
        renderTreePage(chKey,chName,0);
    }
}
    function renderTreePage(chKey,chName,page){
    var cd=document.getElementById('repRubricContent');if(!cd)return;
    var flat=repCurrentFlatTree,total=flat.length,totalPages=Math.ceil(total/repTreePageSize)||1;
    if(page<0)page=0;if(page>=totalPages)page=totalPages-1;repTreePage=page;
    var start=page*repTreePageSize,end=Math.min(start+repTreePageSize,total);
    var h='';
    if(repLastSearchView){
        h+='<div style="margin-bottom:10px;padding:8px 10px;background:linear-gradient(135deg,#fef9e7,#fdf2e9);border:1px solid #f39c12;border-radius:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">';
        h+='<button onclick="backToSearchResults()" style="padding:6px 14px;border:none;border-radius:5px;background:linear-gradient(135deg,#f39c12,#d68910);color:white;font-weight:bold;cursor:pointer;font-family:inherit;font-size:12px;box-shadow:0 1px 4px rgba(0,0,0,0.2);">🔙 '+(currentLang==='ur'?'سرچ رزلٹس پر واپس':'Back to results')+'</button>';
        h+='<span style="font-size:11px;color:#856404;">'+(currentLang==='ur'?'آپ ایک سرچ ربرک پر آئے تھے — یہاں سے واپس جا سکتے ہیں':'You arrived here from a search — return anytime')+'</span>';
        h+='</div>';
    }
    h+='<div class="rep-breadcrumb">📖 Repertory / <span>'+escapeHtml(chName)+'</span> ('+total.toLocaleString()+' rubrics)';
    if(totalPages>1)h+=' <span style="font-size:11px;color:#7f8c8d;">Page '+(page+1)+'/'+totalPages+'</span>';h+='</div>';
    if(totalPages>1){h+='<div style="display:flex;gap:6px;margin-bottom:10px;align-items:center;">';h+='<button onclick="renderTreePage(repCurrentChKey,repCurrentChName,'+(page-1)+')" style="padding:4px 12px;border:1px solid #ddd;background:white;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;"'+(page===0?' disabled':'')+'>◀ Prev</button>';h+='<span style="font-size:11px;color:#555;">'+(start+1)+'-'+end+' of '+total.toLocaleString()+'</span>';h+='<button onclick="renderTreePage(repCurrentChKey,repCurrentChName,'+(page+1)+')" style="padding:4px 12px;border:1px solid #ddd;background:white;border-radius:4px;cursor:pointer;font-family:inherit;font-size:11px;"'+(page>=totalPages-1?' disabled':'')+'>Next ▶</button>';h+='<span style="flex:1;"></span>';h+='<select onchange="repTreePageSize=parseInt(this.value);renderTree(repCurrentChKey,repCurrentChName,repCurrentTree);" style="padding:3px 6px;border:1px solid #ddd;border-radius:4px;font-size:11px;font-family:inherit;"><option value="50"'+(repTreePageSize===50?' selected':'')+'>50/page</option><option value="100"'+(repTreePageSize===100?' selected':'')+'>100/page</option><option value="200"'+(repTreePageSize===200?' selected':'')+'>200/page</option><option value="500"'+(repTreePageSize===500?' selected':'')+'>500/page</option></select></div>';}
    h+='<div class="rep-tree">';
    for(var i=start;i<end;i++){var leaf=flat[i],d=leaf.depth;var rems=Object.keys(leaf.remedies||{});rems.sort(function(a,b){return(leaf.remedies[b]||1)-(leaf.remedies[a]||1)||a.localeCompare(b);});
        var ridAttr=leaf.rid?(' data-rid="'+escapeHtml(leaf.rid)+'"'):'';
        var ridData=leaf.rid?(' <small style="color:#bbb;font-size:9px;" title="Rubric ID">#'+escapeHtml(leaf.rid)+'</small>'):'';
        if(d===0){
            h+='<div class="rep-rubric-main-wrapper"'+ridAttr+'><div class="rep-rubric-main" style="margin-bottom:1px; text-transform: uppercase; font-weight: bold;">'+escapeHtml(leaf.name)+ridData+' <span style="font-weight:bold;">:</span></div>';
            if(rems.length>0){h+='<div class="rep-rubric-main-rems">';rems.forEach(function(abbr){var g=leaf.remedies[abbr]||1;h+='<span class="rep-remedy-tag g'+g+'" onclick="event.stopPropagation();copyRemedyToPrescription(\''+escapeHtml(abbr)+'\')">'+escapeHtml(abbr)+'</span>';});h+='</div>';}
            h+='</div>';
        }else{
            var cls='rep-rubric-d'+(d>3?3:d);h+='<div class="rep-tree-leaf '+cls+'"'+ridAttr+'>';
            if(d<=3)h+='<span class="rep-bullet"></span>';
            h+='<span class="rep-rubric-name">'+escapeHtml(leaf.name)+ridData+' <span style="font-weight:bold;">:</span></span>';
            if(rems.length>0){h+='<span style="margin-left:8px;">';rems.forEach(function(abbr){var g=leaf.remedies[abbr]||1;h+='<span class="rep-remedy-tag g'+g+'" onclick="event.stopPropagation();copyRemedyToPrescription(\''+escapeHtml(abbr)+'\')">'+escapeHtml(abbr)+'</span>';});h+='</span>';}
            h+='</div>';
        }
    }
    h+='</div>';cd.innerHTML=h;cd.scrollTop=0;
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
    var ctx = _repSearchBeforeContext;
    _repSearchBeforeContext = null;

    function showCurrentOrEmpty(){
        if(repCurrentChapter){
            if(repCurrentFlatTree && repCurrentFlatTree.length && repCurrentChKey===repCurrentChapter){
                renderTreePage(repCurrentChKey, repCurrentChName, repTreePage || 0);
            } else {
                var nm=repCurrentChapter; repChapterNames.forEach(function(c){ if(c.key===repCurrentChapter) nm=c.name; });
                if(repTreeCache[repCurrentChapter]) renderTree(repCurrentChapter, nm, repTreeCache[repCurrentChapter]);
                else selectChapter(repCurrentChapter);
            }
        } else {
            var cd=document.getElementById('repRubricContent');
            if(cd) cd.innerHTML='<div class="empty-state"><div class="icon">📖</div><p>'+repLangText({ur:'کوئی چیکٹر منتخب کریں',en:'Select a chapter',roman:'Koi chapter select karein'})+'</p></div>';
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
        if(repCurrentChapter===ctx.chapter && repCurrentFlatTree && repCurrentFlatTree.length){
            renderTreePage(repCurrentChKey, repCurrentChName, ctx.page || 0);
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
    var icon=document.getElementById('repSearchModeIcon');
    var lbl=document.getElementById('repSearchModeLabel');
    var btn=document.getElementById('repSearchModeBtn');
    if(!icon||!lbl||!btn)return;
    var labels = {
        chapter:{ur:'یہ چیکٹر', en:'Open Ch', roman:'Open Ch'},
        book:   {ur:'یہ کتاب',   en:'This Book', roman:'This Book'},
        all:    {ur:'سب کتابیں', en:'All Books', roman:'All Books'}
    };
    var titles = {
        chapter:{ur:'Mode 1/3: صرف کھلے چیکٹر میں سرچ۔ بدلنے کے لیے کلک کریں', en:'Mode 1/3: search only the OPEN chapter. Click to change', roman:'Mode 1/3: sirf open chapter mein search'},
        book:   {ur:'Mode 2/3: اس ریپرٹری کے تمام چیپٹرز میں سرچ۔ بدلنے کے لیے کلک کریں', en:'Mode 2/3: search this WHOLE repertory (all chapters). Click to change', roman:'Mode 2/3: is repertory ke tamam chapters mein search'},
        all:    {ur:'Mode 3/3: تمام ریپرٹریز کے تمام چیپٹرز میں سرچ۔ بدلنے کے لیے کلک کریں', en:'Mode 3/3: search ALL repertories (all chapters). Click to change', roman:'Mode 3/3: tamam repertories ke tamam chapters mein search'}
    };
    var placeholders = {
        chapter:{ur:'🔍 صرف کھلے چیکٹر میں تلاش کریں... (مثلاً pain)', en:'🔍 Search open chapter only... (e.g. pain)', roman:'🔍 Sirf open chapter mein search... (e.g. pain)'},
        book:   {ur:'🔍 اس ریپرٹری کے تمام چیپٹرز میں تلاش کریں... (مثلاً pain)', en:'🔍 Search this repertory — all chapters... (e.g. pain)', roman:'🔍 Is repertory ke tamam chapters mein search... (e.g. pain)'},
        all:    {ur:'🔍 تمام ریپرٹریز کے تمام چیپٹرز میں تلاش کریں... (مثلاً pain)', en:'🔍 Search all repertories — all chapters... (e.g. pain)', roman:'🔍 Tamam repertories ke tamam chapters mein search... (e.g. pain)'}
    };
    if(repSearchMode==='chapter'){
        icon.textContent='📖'; lbl.textContent=repLangText(labels.chapter);
        btn.style.background='linear-gradient(135deg,#8e44ad,#6c3483)';
        btn.title=repLangText(titles.chapter);
    } else if(repSearchMode==='book'){
        icon.textContent='📚'; lbl.textContent=repLangText(labels.book);
        btn.style.background='linear-gradient(135deg,#1a5276,#2980b9)';
        btn.title=repLangText(titles.book);
    } else {
        icon.textContent='🌐'; lbl.textContent=repLangText(labels.all);
        btn.style.background='linear-gradient(135deg,#c0392b,#e74c3c)';
        btn.title=repLangText(titles.all);
    }
    var inp=document.getElementById('repBrowserSearch');
    if(inp){
        inp.placeholder = repLangText(placeholders[repSearchMode] || placeholders.book);
    }
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
        rc.innerHTML='<div class="empty-state"><div class="icon">🔍</div><p>'+(currentLang==='ur'?'کوئی ربرک نہیں ملی':'No rubrics found')+'</p></div>';
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
    rc.innerHTML=h;
    rc.scrollTop=0;
}

// 🔑 PRECISE navigation: open the chapter (in the right book) and scroll/flash the exact rubric (by ID)
function navigateToRubric(bookKey, chKey, rid){
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
        if(typeof initRepertoryBrowser === 'function') initRepertoryBrowser();
        showToast((currentLang==='ur'?'🔄 ریپرٹری بدلی: ':'🔄 Switched to ')+ (REP_BOOK_INFO[bookKey]?REP_BOOK_INFO[bookKey].name:bookKey));
        setTimeout(function(){ selectChapter(chKey, rid); }, 700);
        return;
    }

    // 🔑 same book, same chapter already rendered -> jump+flash
    if(repCurrentChapter===chKey && repCurrentFlatTree && repCurrentFlatTree.length){
        if(repRidToFlatIndex && repRidToFlatIndex.hasOwnProperty(rid)){
            var targetPage = Math.floor(repRidToFlatIndex[rid]/repTreePageSize);
            renderTreePage(repCurrentChKey, repCurrentChName, targetPage);
            setTimeout(function(){ flashRubricRow(rid); }, 60);
            return;
        }
    }
    // load chapter; renderTree will pick up the pending rid
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
    var ring=row.querySelector('.rep-rubric-main, .rep-rubric-name');
    if(ring){ ring.style.color='#d68910'; }
    setTimeout(function(){
        row.style.background='';
        row.style.boxShadow='';
        if(ring) ring.style.color='';
    }, 3500);
}

function copyRemedyToPrescription(abbr){if(navigator.clipboard){navigator.clipboard.writeText(abbr).then(function(){if(typeof showToast==='function')showToast('✅ Copied: '+abbr);});}}

function closeRepertoryChart(){document.getElementById('repChartOverlay').classList.remove('active');}
