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
    nosodes:     { abbr: 'Nos',   name: 'Intercurrent Nosodes & Sarcodes',    dataFile: 'nosodes_repertory.json',     chapDir: 'nosodes_chapters/',     color:'#117a65', tree:'prefix', keepOrder:true },
    // 🔑 v67: ہیرنگ — اینالیٹیکل ریپرٹری آف دی سمپٹمز آف دی مائنڈ (1881) — او سی آر سے تبدیل؛ گریڈ: II=3، I=2، باقی 1
    hering_mind: { abbr: 'H-Mind', name: 'Hering — Analytical Repertory of the Mind', dataFile: 'hering_mind_repertory.json', chapDir: 'hering_mind_chapters/', color:'#6e2c00', tree:'prefix', keepOrder:true },
    // 🔑 v68: بوگر — ٹائمز آف دی ریمیڈیز اینڈ مون فیزز (homeoint.org Séror ایڈیشن) — رنگ = اصل I/II مارکس
    boger_times: { abbr: 'Times', name: 'Boger — Times of Remedies & Moon Phases', dataFile: 'boger_times_repertory.json', chapDir: 'boger_times_chapters/', color:'#b9770e', tree:'prefix', keepOrder:true },
    // 🔑 v68: بورک و ڈیوی — ٹشو ریمیڈیز کا تھراپیوٹک حصہ (homeopathybooks.in) — rubric = disease، remedies = 12 نمک
    tissues_bd: { abbr: 'Tiss', name: 'Boericke & Dewey — Tissue Remedies', dataFile: 'tissues_bd_repertory.json', chapDir: 'tissues_bd_chapters/', color:'#16a085', tree:'prefix', keepOrder:true }
};
/* 🔑 کتاب کے مطابق رنگ / فولڈر — ہر جگہ یہی helper استعمال ہو (hard-coded ternaries نہیں) */
function repBookColor(book){ var bi=REP_BOOK_INFO[book]; return (bi&&bi.color)||'#8e44ad'; }
function repChapDir(book){ var bi=REP_BOOK_INFO[book||repCurrentBook]; return (bi&&bi.chapDir)||'repertory_chapters/'; }
// 🔑 v68.6: پوری کتاب، ایک باب اور ہر فہرست اِسی ایک نمبر سے منگوائی جائے — پہلے 'v=14' تین جگہ لکھا تھا اور
// _index.json بالکل بغیر نمبر کے، اس لیے نئی کتاب کا فہرست پرانے کیش سے پڑھا جاتا رہتا تھا۔
var REP_DATA_V='v=16';
var _allBooksData = null;       // {publicum:{...}, kent:{...}, ...} cache for all-books mode
var _allBookChapters = {};      // {publicum:[{key,name,rubrics}], ...} per-book chapter index (for name lookup)
var repLastSearchView = null;   // {results, info} saved for the "back to results" button
// 🔑 v45: ڈیفالٹ کتاب = Kent (صارف درخواست — ڈراپ ڈاؤن میں کینٹ ٹاپ پر)
var repCurrentBook = 'kent';
// 🔑 v45: ہر ریپرٹری کا ڈیفالٹ چیپٹر — کتاب کھلنے پر مائنڈ خود بخود کھلتا ہے (صارف درخواست)
var REP_DEFAULT_CHAPTER = { kent:'mind', publicum:'mind', synthesis91:'mind', kent_de:'gemuet', allen_fever:'type', hs_clinical:'clinical_clarke', keynotes_cc:'generalities', nosodes:'generalities', hering_mind:'ailments_from_emotions_and_exertions_of_the_mind', boger_times:'general_hour', tissues_bd:'tissue_therapeutics' };
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
    repCmpSyncUI();                                        // 🔑 v54: ☑ کمپیئر موڈ بٹن/پینل کی حالت
    if(typeof repNotesSeed==='function'){ repNotesSeed(); repNotesShared(); }   // 🔑 v59: بیج + مشترکہ نوٹس شروع میں ہی ضم
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
        fetch(indexFile+'?'+REP_DATA_V).then(function(r){return r.json();}).then(function(data){
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
    fetch(basePath+chKey+'.json?'+REP_DATA_V).then(function(r){return r.json();}).then(function(d){
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
        // 🔑 v72: ایک ہی متن کا ربرک باب میں دوبارہ آئے (مثلاً Boger Times میں «3 A. M» مختلف جگہوں پر) تو
        // پہلے دونوں کی ادویات ایک میں ضم ہو جاتی تھیں اور دوسرا ربرک غائب ہو جاتا تھا۔ اب ہر ایک الگ ربرک
        // «[2]»، «[3]» کے ساتھ، اپنی ادویات اور فائل والی جگہ پر۔
        if(n.hasRubric){
            var pp=parentByPath[e.path]||'', pn=pp?nodeByPath[pp]:root, base=n.name, k=2;
            while(pn.children[base+' ['+k+']']) k++;
            var dl=base+' ['+k+']';
            pn.children[dl]={name:dl,children:{},order:[],remedies:{},count:0,hasRubric:false,path:'',oorep_id:null,fullPath:e.path,dup:k};
            pn.order.push(dl); n=pn.children[dl];
        }
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
            var _par=n; n=n.children[pt];
            if(!n.__par) Object.defineProperty(n,'__par',{value:_par,enumerable:false});
            n.count++;
            if(i===parts.length-1){
                if(n.hasRubric){   // 🔑 v72: دوہرا ربرک — پہلے والا اوور رائٹ ہو کر غائب ہو جاتا تھا؛ اب الگ «[2]»
                    var par=n.__par||root, k2=2; while(par.children[pt+' ['+k2+']'])k2++;
                    var dl2=pt+' ['+k2+']'; par.children[dl2]={name:dl2,children:{},order:[],remedies:{},count:1,hasRubric:false,path:'',oorep_id:null,dup:k2};
                    par.order.push(dl2); n=par.children[dl2];
                }
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
var repViewMode='tree';        // v72: صرف کتابی ٹری
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
      +(repFolderPath.length?'<button class="rpd-chev" id="repDetailChev" onclick="repToggleDetailInfo()" title="'+repLangText({ur:'مکمل تفصیل دیکھیں/چھپائیں',en:'Show/hide full details',roman:'Mukammal tafseel dekhein/chhupaein'})+'">&#9656;</button>':'')
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
function repSetView(m){ repViewMode='tree'; renderFolderCards(); }   // v72: کارڈ/لسٹ ختم — صرف ٹری


// ==================== 🌳 v72: کتابی ٹری ویو (کارڈ سسٹم کی جگہ) ====================
// ریپرٹری کتاب/Radar کی طرح: ہر ربرک اپنی ٹری کی سطح پر اِنڈینٹ کے ساتھ، اسی ترتیب میں جو کتاب (چیپٹر فائل) میں ہے۔
// ⚠ کوئی sort نہیں — node.order اور node.remedies کی اصل ترتیب جوں کی توں۔ ڈیٹا صرف پڑھا جاتا ہے، بدلا نہیں جاتا۔
var repTreeOpts={rems:true};
try{ var _to=JSON.parse(localStorage.getItem('bc_rep_tree_opts')||'{}'); if(_to&&_to.rems===false)repTreeOpts.rems=false; }catch(e){}
function repTreeOptsSave(){ try{ localStorage.setItem('bc_rep_tree_opts',JSON.stringify(repTreeOpts)); }catch(e){} }
var repTreeCollapsed={};              // full path → true (صرف اس سیشن کے لیے)
var repTreeViews={};                  // elId → {rows,shown}
var REP_TREE_CHUNK=300;
function repTreeFlatten(node,labels,parentFull,depth,out,filt){
    var any=false;
    (node.order||[]).forEach(function(k){                       // کتاب کی اصل ترتیب
        var c=node.children[k]; if(!c)return;
        var lab=labels.concat([k]), full=_repJoinSeg(parentFull,k), kids=_repNodeKids(c);
        var row={label:k,labels:lab,full:full,depth:depth,node:c,kids:kids};
        var pos=out.length; out.push(row);
        var selfHit=!filt||k.toLowerCase().indexOf(filt)!==-1;
        var kidHit=false;
        if(kids&&(filt||!repTreeCollapsed[full])) kidHit=repTreeFlatten(c,lab,full,depth+1,out,filt);
        if(filt&&!selfHit&&!kidHit){ out.length=pos; return; }  // فلٹر: نہ خود ملے نہ اولاد میں → ہٹاؤ
        any=true;
    });
    return any;
}
function repTreeRemsHtml(rems){
    var ks=Object.keys(rems||{}); if(!ks.length) return '';
    var h='<span class="rtv-rems">';
    for(var i=0;i<ks.length;i++){
        var a=ks[i], g=rems[a]||1; g=g>=3?3:(g===2?2:1);
        h+='<i class="rtv-r g'+g+'" data-a="'+_repAttr(a)+'">'+escapeHtml(g===3?a.toUpperCase():a)+'</i>'+(i<ks.length-1?' ':'');
    }
    return h+'</span>';
}
function repTreeRowHtml(r){
    var c=r.node, rems=Object.keys(c.remedies||{}).length, rid=c.hasRubric&&c.rid?String(c.rid):'';
    var open=r.kids&&(repFolderFilter||!repTreeCollapsed[r.full]);
    return '<div class="rtv-row'+(r.depth===0?' top':'')+'" style="--d:'+r.depth+';padding-left:'+(6+r.depth*18)+'px" data-full="'+_repAttr(r.full)+'" data-labels="'+_repAttr(JSON.stringify(r.labels))+'" data-rems="'+rems+'" data-kids="'+(r.kids?1:0)+'"'+(rid?' data-rid="'+_repAttr(rid)+'"':'')+'>'
        +'<span class="rtv-tg">'+(r.kids?(open?'▾':'▸'):'·')+'</span>'
        +repTreeLevelIcon(r.depth,r.kids)
        +repCmpChkHtml(repCurrentBook,repCurrentChapter,rid,r.full,rems,'row')
        +'<span class="rtv-lab'+(r.kids?' has-kids':'')+'">'+escapeHtml(r.label)+'</span>'
        +(rems?'<span class="rtv-n">('+rems+')</span>':'')
        +(r.kids?'<span class="rtv-k" title="'+repLangText({ur:'ذیلی ربرکس',en:'sub-rubrics',roman:'zeli rubrics'})+'">📁'+c.order.length+'</span>':'')
        +(rid?'<span class="rtv-colon">:</span>'+repTreeActsHtml(rid,rems):'')
        +'<button class="rpc-kebab rtv-kebab" onclick="event.stopPropagation();repKebabShow(event,this)" data-full="'+_repAttr(r.full)+'" data-rid="'+_repAttr(rid)+'">⋮</button>'
        +(repTreeOpts.rems&&rems?repTreeRemsHtml(c.remedies):'')
        +'</div>';
}
// 🔑 v73: سطح کی پہچان — ہر گہرائی کا اپنا رنگ اور نشان (1 ◆ نیلا، 2 ● سبز، 3 ■ نارنجی، 4 ▲ جامنی، 5+ ◇ سرمئی)
var REP_TREE_LV=[['◆','#1f618d'],['●','#1e8449'],['■','#ca6f1e'],['▲','#7d3c98'],['◇','#707b7c']];
function repTreeLevelIcon(depth,kids){
    var lv=REP_TREE_LV[Math.min(depth,REP_TREE_LV.length-1)];
    return '<span class="rtv-lv" style="color:'+lv[1]+'" title="'+repLangText({ur:'سطح ',en:'Level ',roman:'Level '})+(depth+1)+(kids?'':' — '+repLangText({ur:'آخری ربرک',en:'leaf',roman:'leaf'}))+'">'+lv[0]+'<sub>'+(depth+1)+'</sub></span>';
}
// 🔑 v73: ہر ربرک کی لائن پر 5 بٹن (ڈیٹیل پیج والے): ▸ تفصیل · + موازنہ · 🔬 تفریق · 🔬 ادویات میں فرق · 📖 میٹیریا میڈیکا
function repTreeActsHtml(rid,rems){
    var on=repClipFind(repActiveClip,repCurrentBook,rid)!==-1, L=repLangText, h='<span class="rtv-acts">';
    h+='<button class="rtv-a info" data-act="info" title="'+L({ur:'مطلب / مریض کا ورژن / استعمال / کراس ریفرنس',en:'Meaning / patient version / usage / cross-refs',roman:'Tafseel'})+'">▸</button>';
    h+='<button class="rtv-a cmp'+(on?' on':'')+'" data-act="cmp" title="'+L({ur:'فعال کلپ بورڈ میں شامل/خارج',en:'Add to / remove from active clipboard',roman:'Compare'})+'">'+(on?'✓':'+')+' '+L({ur:'موازنہ',en:'Compare',roman:'Compare'})+'</button>';
    if(typeof repDiffOpenForRubric==='function'){
        h+='<button class="rtv-a diff" data-act="diff" title="'+L({ur:'اس ربرک کی تفریق (ذیلی/ہم رشتہ ربرکس)',en:'Differentiate this rubric',roman:'Tafreeq'})+'">🔬 '+L({ur:'تفریق',en:'Differentiate',roman:'Differentiate'})+'</button>';
        if(rems>1) h+='<button class="rtv-a rdiff" data-act="rdiff" title="'+L({ur:'ان ادویات میں کیا فرق ہے؟',en:'What distinguishes these remedies?',roman:'farq?'})+'">⚖ '+L({ur:'ادویات میں فرق',en:'differentiate',roman:'farq'})+'</button>';
    }
    if(rems&&typeof repMMOpenForRubric==='function') h+='<button class="rtv-a mm" data-act="mm" title="'+L({ur:'ان ادویات کا میٹیریا میڈیکا',en:'Materia medica of these remedies',roman:'Materia medica'})+'">📖 '+L({ur:'میٹیریا میڈیکا',en:'materia medica',roman:'materia medica'})+'</button>';
    return h+'</span>';
}
// ڈیٹیل پیج والے فنکشن repCurrentDetail پر چلتے ہیں — عارضی طور پر اس لائن کا سیاق دے کر چلاؤ
function repTreeWithCtx(row,fn){
    var sv=repCurrentDetail, labels=[]; try{ labels=JSON.parse(row.getAttribute('data-labels')||'[]'); }catch(e){}
    repCurrentDetail={full:row.getAttribute('data-full')||'',rid:row.getAttribute('data-rid')||'',labels:labels};
    try{ fn(); } finally { repCurrentDetail=sv; }
}
function repTreeAct(row,act,btn){
    var rid=row.getAttribute('data-rid')||'', full=row.getAttribute('data-full')||'';
    if(act==='cmp'){
        var rems=parseInt(row.getAttribute('data-rems')||'0',10)||0;
        var added=repClipToggle(repActiveClip,repCurrentBook,repCurrentChapter,rid,full,rems);
        btn.classList.toggle('on',added); btn.innerHTML=(added?'✓ ':'+ ')+repLangText({ur:'موازنہ',en:'Compare',roman:'Compare'});
        if(typeof repCmpSyncChecks==='function') repCmpSyncChecks(repCurrentBook,rid,added);
        if(typeof repCmpPanelRender==='function') repCmpPanelRender();
        showToast((added?'☑ ':'☐ ')+repClipLabel(repActiveClip)); return;
    }
    if(act==='diff'){ repTreeWithCtx(row,function(){ repDiffOpenForRubric(); }); return; }
    if(act==='rdiff'){   // ⚖ سب سے اونچے گریڈ کی 5 تک ادویات کا آپس میں تقابل
        var en=repRidPathMap[rid], rm=(en&&en.node.remedies)||{};
        var top=Object.keys(rm).sort(function(x,y){ return (Math.min(3,rm[y]||1)-Math.min(3,rm[x]||1)); }).slice(0,5);   // مستحکم sort: برابر گریڈ میں فائل کی ترتیب
        repDiffOpenWithRemedies(top,{book:repCurrentBook,ch:repCurrentChapter,rid:rid,full:full,rems:rm}); return;
    }
    if(act==='mm'){ repTreeWithCtx(row,function(){ repMMOpenForRubric(); }); return; }
    if(act==='info'){
        var nx=row.nextElementSibling;
        if(nx&&nx.classList.contains('rtv-info')){ nx.remove(); btn.classList.remove('open'); btn.innerHTML='▸'; return; }
        var e=repRidPathMap[rid], node=e?e.node:null; if(!node)return;
        var ab=Object.keys(node.remedies||{}), labels=[]; try{ labels=JSON.parse(row.getAttribute('data-labels')||'[]'); }catch(x){}
        var ih=repDetailInfoHtml({full:full,rid:rid,kidsCount:(node.order||[]).length,abbrs:ab,g3:ab.filter(function(a){return (node.remedies[a]||1)>=3;}),
            pureXref:false,seeT:repExtractSeeTargets(full),parentLabels:labels.slice(0,-1),showRems:false,remsObj:node.remedies||{}});
        ih=ih.replace('id="repDetailInfo"','').replace('class="rpd-info"','class="rpd-info open"');
        row.insertAdjacentHTML('afterend','<div class="rtv-info" style="margin-left:'+(parseInt(row.style.paddingLeft,10)||0)+'px">'+ih+'</div>');
        btn.classList.add('open'); btn.innerHTML='▾';
    }
}
// ٹری کو کسی div میں لگاؤ۔ node = جس کی اولاد دکھانی ہے، labels = اس تک کا راستہ
function repTreeMount(elId,node,labels,parentFull,ensureRid){
    var el=document.getElementById(elId); if(!el||!node)return;
    var rows=[]; repTreeFlatten(node,labels||[],parentFull||'',0,rows,(repFolderFilter||'').toLowerCase());
    var v=repTreeViews[elId]={rows:rows,shown:0,node:node,labels:labels,parentFull:parentFull};
    var need=REP_TREE_CHUNK;
    if(ensureRid){ for(var i=0;i<rows.length;i++){ if(rows[i].node.rid&&String(rows[i].node.rid)===String(ensureRid)){ need=Math.max(need,i+50); break; } } }
    el.innerHTML='<div class="rtv" dir="ltr"></div><div class="rtv-more"></div>';
    if(!rows.length){ el.firstChild.innerHTML='<div class="rep-empty-folder">'+repLangText({ur:'کوئی ربرک نہیں',en:'No rubrics',roman:'Koi rubric nahi'})+'</div>'; return; }
    el.firstChild.onclick=repTreeClick;
    repTreeMore(elId,need);
}
function repTreeMore(elId,n){
    var v=repTreeViews[elId], el=document.getElementById(elId); if(!v||!el)return;
    var box=el.querySelector('.rtv'), more=el.querySelector('.rtv-more'); if(!box)return;
    var end=Math.min(v.rows.length,v.shown+(n||REP_TREE_CHUNK)), h='';
    for(var i=v.shown;i<end;i++) h+=repTreeRowHtml(v.rows[i]);
    box.insertAdjacentHTML('beforeend',h); v.shown=end;
    if(v.shown<v.rows.length){
        more.innerHTML='<button class="rc-btn">⬇ '+repLangText({ur:'مزید ربرکس',en:'More rubrics',roman:'Mazeed rubrics'})+' ('+(v.rows.length-v.shown).toLocaleString()+')</button>';
        more.firstChild.onclick=function(){ repTreeMore(elId); };
        if(window.IntersectionObserver){                        // اسکرول پر خود بخود اگلا حصہ
            if(v.io)v.io.disconnect();
            v.io=new IntersectionObserver(function(en){ if(en[0].isIntersecting){ v.io.disconnect(); repTreeMore(elId); } },{root:document.getElementById('repRubricContent'),rootMargin:'600px'});
            v.io.observe(more);
        }
    } else { more.innerHTML=''; if(v.io)v.io.disconnect(); }
}
function repTreeRemount(elId){
    var v=repTreeViews[elId], sc=document.getElementById('repRubricContent'), top=sc?sc.scrollTop:0, shown=v?v.shown:0;
    if(!v)return;
    repTreeMount(elId,v.node,v.labels,v.parentFull);
    if(shown>REP_TREE_CHUNK) repTreeMore(elId,shown-REP_TREE_CHUNK);
    if(sc)sc.scrollTop=top;
}
function repTreeClick(ev){
    var t=ev.target;
    if(t.closest('.rpc-chk')||t.closest('.rpc-kebab')) return;   // اپنے ہینڈلر
    if(t.closest('.rtv-info')) return;
    var row=t.closest('.rtv-row'); if(!row)return;
    repKebabHide();
    var ab=t.closest('.rtv-a'); if(ab){ repTreeAct(row,ab.getAttribute('data-act'),ab); return; }
    if(t.classList.contains('rtv-r')){ copyRemedyToPrescription(t.getAttribute('data-a')); return; }
    var elId=row.closest('[id]').id, full=row.getAttribute('data-full');
    if(t.classList.contains('rtv-tg')&&row.getAttribute('data-kids')==='1'&&!repFolderFilter){
        if(repTreeCollapsed[full])delete repTreeCollapsed[full]; else repTreeCollapsed[full]=true;
        repTreeRemount(elId); return;
    }
    var labels=[]; try{ labels=JSON.parse(row.getAttribute('data-labels')||'[]'); }catch(e){}
    if(row.getAttribute('data-rems')==='0'&&row.getAttribute('data-kids')==='1'){ repGo(labels); return; }
    repOpenRubricDetail(full,row.getAttribute('data-rid')||'',labels);
}
function repTreeToggleRems(){ repTreeOpts.rems=!repTreeOpts.rems; repTreeOptsSave(); repTreeSyncBtns(); Object.keys(repTreeViews).forEach(function(id){ if(document.getElementById(id))repTreeRemount(id); }); }
function repTreeExpandAll(open){
    Object.keys(repTreeViews).forEach(function(id){
        var v=repTreeViews[id]; if(!document.getElementById(id))return;
        if(open) repTreeCollapsed={};
        else { var rows=[]; repTreeCollapsed={}; repTreeFlatten(v.node,v.labels||[],v.parentFull||'',0,rows,''); rows.forEach(function(r){ if(r.kids)repTreeCollapsed[r.full]=true; }); }
        repTreeRemount(id);
    });
}
function repTreeSyncBtns(){ var b=document.getElementById('repTreeRemsBtn'); if(b)b.classList.toggle('active',!!repTreeOpts.rems); }

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
        +'<div class="rpc-card-top"><div class="rpc-top-l">'+repCmpChkHtml(repCurrentBook,repCurrentChapter,String(node.rid||''),repFullPathOf(repFolderPath),rems)+'<div class="rpc-ico doc self">📄</div></div>'
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
        +repCmpChkHtml(repCurrentBook,repCurrentChapter,String(node.rid||''),repFullPathOf(repFolderPath),rems,'row')+'<div class="rpc-ico doc self" style="width:30px;height:30px;font-size:14px;">📄</div>'
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
        +'<div class="rpc-card-top"><div class="rpc-top-l">'+repCmpChkHtml(repCurrentBook,repCurrentChapter,rid,full,rems)+'<div class="rpc-ico '+(kids?'folder':'doc')+'">'+(kids?'📁':'📄')+'</div></div>'
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
        +repCmpChkHtml(repCurrentBook,repCurrentChapter,rid,full,rems,'row')+'<div class="rpc-ico '+(kids?'folder':'doc')+'" style="width:30px;height:30px;font-size:14px;">'+(kids?'📁':'📄')+'</div>'
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
    // 🌳 v72: کتابی ٹری — مین ربرک کی اپنی ادویات اوپر کی تفصیل میں پہلے سے ہیں؛ نیچے پوری اولاد ترتیب وار
    area.innerHTML='<div id="repTreeMain"></div>';
    var nav=repPendingNavRid; repPendingNavRid=null;
    repTreeMount('repTreeMain',node,repFolderPath.slice(),repFullPathOf(repFolderPath),nav);
    repTreeSyncBtns();
    repRenderDock();
    if(nav) setTimeout(function(){ flashRubricRow(nav); },80);
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

// ==================== ☑ COMPARE MODE (HomeoSetu "Compare" بٹن کا کلون) ====================
// موڈ آن: ہر ربرک کارڈ / قطار / سرچ نتیجے پر چیک باکس — ٹک = فعال کلپ بورڈ میں شامل، دوبارہ ٹک = ہٹانا۔
// سائیڈ بار پینل: "N منتخب / کلیئر / اینالائز" + منتخب ربرکس کی چپس۔ کلپ بورڈ وہی 12 ہیں (الگ لسٹ نہیں)۔
function repCmpModeToggle(){ repCmpModeSet(!repCompareMode); }
function repCmpModeSet(on){
    repCompareMode=!!on;
    try{ localStorage.setItem('bc_rep_cmp_mode',repCompareMode?'1':'0'); }catch(e){}
    repCmpSyncUI();
    showToast(repCompareMode
        ? repLangText({ur:'☑ کمپیئر موڈ آن — کارڈز پر ٹک لگائیں، ربرک '+repClipLabel(repActiveClip)+' میں جمع ہوں گے',en:'☑ Compare Mode ON — tick rubric cards to collect them in '+repClipLabel(repActiveClip),roman:'☑ Compare Mode ON — cards par tick lagaein'})
        : repLangText({ur:'☐ کمپیئر موڈ آف',en:'☐ Compare Mode OFF',roman:'☐ Compare Mode OFF'}));
    repCmpRerender();
}
function repCmpSyncUI(){
    var b=document.getElementById('repCmpModeBtn');
    if(b){ b.classList.toggle('on',repCompareMode); b.title=repLangText({ur:'کمپیئر موڈ: کارڈز پر ٹک لگا کر ربرکس فعال کلپ بورڈ میں جمع کریں، پھر اینالائز',en:'Compare Mode: tick rubric cards to collect them into the active clipboard, then Analyze',roman:'Compare Mode: cards par tick, phir Analyze'}); }
    var tools=document.getElementById('repSideTools'); if(tools)tools.classList.toggle('cmp',repCompareMode);
    repCmpPanelRender();
}
function repIsSearchView(){ var rc=document.getElementById('repRubricContent'); return !!(rc&&repLastSearchView&&rc.querySelector('.rep-rubric-item')); }
function repCmpRerender(){
    if(repClipViewOpen||repWorkbenchOpen||repCompareOpen||repAnalysisOpen>=0) return;
    if(repCurrentDetail){ renderRubricDetail(); return; }
    if(repIsSearchView()){ displaySearchResults(repLastSearchView.results, repLastSearchView.info); return; }
    if(repCurrentChapter) renderFolderCards();
}
function repCmpChkHtml(book,ch,rid,full,rems,extra){
    if(!repCompareMode||!rid) return '';
    var on=repClipFind(repActiveClip,book,rid)!==-1;
    return '<button type="button" class="rpc-chk'+(on?' on':'')+(extra?' '+extra:'')+'" data-book="'+_repAttr(book)+'" data-ch="'+_repAttr(ch)+'" data-rid="'+_repAttr(rid)+'" data-full="'+_repAttr(full)+'" data-rems="'+(parseInt(rems,10)||0)+'" onclick="event.stopPropagation();repCmpChkClick(this)" title="'+repLangText({ur:'موازنے کے لیے منتخب کریں → '+repClipLabel(repActiveClip),en:'Select for comparison → '+repClipLabel(repActiveClip),roman:'Compare ke liye select karein → '+repClipLabel(repActiveClip)})+'">'+(on?'✓':'')+'</button>';
}
function repCmpChkClick(btn){
    var book=btn.getAttribute('data-book')||repCurrentBook, ch=btn.getAttribute('data-ch')||repCurrentChapter, rid=btn.getAttribute('data-rid')||'';
    var full=btn.getAttribute('data-full')||'', rems=parseInt(btn.getAttribute('data-rems')||'0',10)||0;
    if(!rid) return;
    var added=repClipToggle(repActiveClip,book,ch,rid,full,rems);
    repCmpSyncChecks(book,rid,added);
    showToast((added?'☑ ':'☐ ')+repLangText({ur:added?repClipLabel(repActiveClip)+' میں شامل':repClipLabel(repActiveClip)+' سے ہٹا دیا',en:added?'Added to '+repClipLabel(repActiveClip):'Removed from '+repClipLabel(repActiveClip),roman:added?repClipLabel(repActiveClip)+' mein shamil':repClipLabel(repActiveClip)+' se hata diya'}));
    repCmpPanelRender();
}
function repCmpSyncChecks(book,rid,on){
    var list=document.querySelectorAll('.rpc-chk');
    for(var i=0;i<list.length;i++){ var b=list[i]; if(b.getAttribute('data-book')===book&&b.getAttribute('data-rid')===String(rid)){ b.classList.toggle('on',!!on); b.textContent=on?'✓':''; } }
    var db=document.getElementById('repDetailCmpBtn'); if(db&&repCurrentDetail&&String(repCurrentDetail.rid)===String(rid)&&repCurrentBook===book){ db.outerHTML=repDetailCmpBtnHtml(); }
}
// سائیڈ بار کا کمپیئر پینل ("N منتخب / کلیئر / اینالائز" کے نیچے)
function repCmpPanelRender(){
    var p=document.getElementById('repCmpPanel'); if(!p)return;
    if(!repCompareMode){ p.style.display='none'; p.innerHTML=''; return; }
    var l=repClipboards[repActiveClip]||[];
    var h='<div class="rst-cmp-head">☑ '+repLangText({ur:'کمپیئر موڈ',en:'Compare Mode',roman:'Compare Mode'})+' → <b>'+escapeHtml(repClipLabel(repActiveClip))+'</b>'
        +'<button class="rst-x" onclick="repCmpModeSet(false)" title="'+repLangText({ur:'کمپیئر موڈ بند کریں',en:'Turn Compare Mode off',roman:'Compare Mode band karein'})+'">✕</button></div>';
    if(!l.length){
        h+='<div class="rst-cmp-hint">'+repLangText({ur:'کارڈز پر ☐ ٹک لگائیں — ربرک یہاں جمع ہوں گے',en:'Tick ☐ on rubric cards — they collect here',roman:'Cards par ☐ tick lagaein'})+'</div>';
    } else {
        h+='<div class="rst-chips">';
        l.forEach(function(it,i){
            h+='<span class="rst-chip'+(it.combined?' comb':'')+'" title="'+_repAttr((REP_BOOK_INFO[it.book]?REP_BOOK_INFO[it.book].abbr+': ':'')+(it.path||''))+'">'
                +'<span class="rst-chip-t" dir="ltr" onclick="repClipOpenIdx('+repActiveClip+','+i+')">'+(it.combined?'⊕ ':'')+escapeHtml(_repTruncPath(it.path||'—',26))+'</span>'
                +'<button class="rst-chip-x" onclick="repCmpChipRemove('+i+')" title="'+repLangText({ur:'ہٹائیں',en:'Remove',roman:'Hataein'})+'">✕</button></span>';
        });
        h+='</div>';
    }
    h+='<div class="rst-cmp-links">'
        +'<button class="rst-link" onclick="repCmpAllSearch()" title="'+repLangText({ur:'سرچ سکوپ = سب ریپرٹریز، پھر اوپر سرچ باکس میں لکھیں — نتائج پر بھی ☐ ملے گا',en:'Search scope = all repertories; results also get ☐',roman:'Scope = sab repertories'})+'">🌐 '+repLangText({ur:'سب کتابوں میں تلاش',en:'Search all books',roman:'Sab kitabon mein talash'})+'</button>'
        +'<button class="rst-link" onclick="repOpenCompare()" title="'+repLangText({ur:'کلپ بورڈز آمنے سامنے (کلاسک موازنہ ویو)',en:'Clipboards side by side (classic compare view)',roman:'Clipboards aamne saamne'})+'">⇄ '+repLangText({ur:'کلپ بورڈز کا موازنہ',en:'Compare clipboards',roman:'Clipboards ka moazna'})+'</button>'
        +'</div>';
    p.innerHTML=h; p.style.display='';
}
function repCmpChipRemove(i){
    var l=repClipboards[repActiveClip]||[]; var it=l[i]; if(!it)return;
    l.splice(i,1); repClipsSave(); repRenderDock();
    repCmpSyncChecks(it.book,it.rid,false);
    repCmpPanelRender();
    if(repClipViewOpen)renderClipView(); else if(repWorkbenchOpen)renderWorkbench();
}
function repCmpAllSearch(){
    var sel=document.getElementById('repScopeSelect'); if(sel)sel.value='all';
    setRepSearchScope('all');
    var inp=document.getElementById('repBrowserSearch'); if(inp){ inp.focus(); if(inp.value.trim().length>=2)searchRepertoryBrowser(); }
}
// سائیڈ بار "اینالائز" = HomeoSetu: تمام کلپ بورڈز → ورک بینچ گرڈ (ویٹ + ایلی منیشن)
function repSideAnalyze(){
    var total=0; for(var i=0;i<REP_N_CLIPS;i++)total+=(repClipboards[i]||[]).length;
    if(!total){ showToast(repLangText({ur:'کلپ بورڈز خالی ہیں — پہلے ربرکس منتخب کریں (☑ کمپیئر موڈ یا ⋮ مینو)',en:'Clipboards are empty — select rubrics first (☑ Compare Mode or ⋮ menu)',roman:'Clipboards khali hain — pehle rubrics select karein'})); return; }
    repOpenWorkbench('grid');
}

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
                +repCombBadge(it)+repWChip(it.w)
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
    repClipGoto(it.book,it.ch,it.rid);
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
    var open=false;
    if(el){ el.classList.toggle('open'); open=el.classList.contains('open'); }
    // 🔑 v54.3 (صارف): بٹن گھومتا نہیں — علامت بدلتی ہے: بند = ▸ (تفصیل کھولیں)، کھلا = ▾ (تفصیل نیچے کھلی ہے)
    if(ch){ ch.classList.toggle('open',open); ch.innerHTML=open?'&#9662;':'&#9656;'; }
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
    fetch(info.dataFile + '?'+REP_DATA_V).then(function(r){return r.json();}).then(function(d){
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
    fetch(info.chapDir+'_index.json?'+REP_DATA_V).then(function(r){return r.json();}).then(function(d){
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
    var note=repNoteFor(full,o.rid)||{};   // 🔑 Homeosetu سے درآمد شدہ نوٹس (اگر اس ربرک کے لیے موجود ہوں)
    var srcTag='<span class="rpd-src">📘 Homeosetu</span>';
    var h='<div class="rpd-info" id="repDetailInfo">';
    // 🔑 v54.3 (صارف): ایپ کے اپنے بنائے ہوئے مطلب (لغت کے ٹوکن)، مریض کا ورژن (خودکار جملہ) اور
    // «کب استعمال» کا عمومی متن ختم — اب یہ تینوں سیکشن صرف Homeosetu کے اصل نوٹس کے ساتھ دکھتے ہیں
    // (جس ربرک کا نوٹ نہ ہو، اس پر سیکشن ہی نہیں بنتا)۔ کراس ریفرنس اور کلینیکل سیکشن پہلے کی طرح ہیں۔
    // 1) MEANING (Homeosetu)
    if(note.m){
        h+='<div class="rpd-sec meaning"><span class="rpd-lab">📖 '+repLangText({ur:'مطلب (MEANING)',en:'MEANING',roman:'MATLAB (MEANING)'})+'</span>';
        h+='<div class="rpd-note" dir="ltr">'+srcTag+escapeHtml(note.m)+'</div>';
        h+='</div>';
    }
    // 2) PATIENT VERSION (Homeosetu)
    if(note.pv||note.pv2){
        h+='<div class="rpd-sec patient"><span class="rpd-lab">🧑\u200d⚕ '+repLangText({ur:'مریض کا ورژن (PATIENT VERSION)',en:'PATIENT VERSION',roman:'MAREEZ KA VERSION'})+'</span>';
        if(note.pv) h+='<div class="rpd-note" dir="ltr">'+srcTag+escapeHtml(note.pv)+'</div>';
        if(note.pv2) h+='<div class="rpd-note" dir="ltr">'+srcTag+escapeHtml(note.pv2)+'</div>';
        h+='</div>';
    }
    // 3) WHEN TO USE (Homeosetu)
    if(note.wu){
        h+='<div class="rpd-sec when"><span class="rpd-lab">✅ '+repLangText({ur:'صحیح استعمال کہاں (WHEN TO USE)',en:'WHEN TO USE',roman:'SAHIH ISTEMAL KAHAN'})+'</span>';
        h+='<div class="rpd-note" dir="ltr">'+srcTag+escapeHtml(note.wu)+'</div>';
        h+='</div>';
    }
    // 3a) صرفِ اشارہ ربرک (اپنی ادویہ نہیں) — چھوٹی تنبیہ برقرار، کیونکہ یہ ڈیٹا کی وضاحت ہے نہ کہ «مطلب»
    if(pureXref){
        h+='<div class="rpd-sec when"><span class="rpd-warn">⚠ '+repLangText({ur:'یہ صرفِ اشارہ ربرک ہے — خود کوئی ادویہ نہیں رکھتی۔ اصل ربرک «',en:'This is a cross-reference only — no remedies of its own. Open the real rubric «',roman:'Ye sirf ishara rubric hai — asal rubric «'})+'<b dir="ltr">'+escapeHtml(seeT[0]||'')+'</b>» '+repLangText({ur:'کھول کر استعمال کریں۔',en:'» instead.',roman:'» khol kar istemal karein.'})+'</span></div>';
    }
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
      +'<button class="rpd-chev" id="repDetailChev" onclick="repToggleDetailInfo()" title="'+repLangText({ur:'مکمل تفصیل دیکھیں/چھپائیں',en:'Show/hide full details',roman:'Mukammal tafseel dekhein/chhupaein'})+'">&#9656;</button>'
      +repDetailCmpBtnHtml()
      +repDetailDiffBtnHtml()
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
    h+='<div class="rpd-sec-head">💊 '+repLangText({ur:'ادویات',en:'REMEDIES',roman:'ADWIYAT'})+' <span class="cnt">('+abbrs.length+')</span>'+(abbrs.length>1&&d.rid&&typeof repDiffOpenForRubric==='function'?' <button class="rst-link" onclick="repDiffOpenForRubric()" title="'+repLangText({ur:'ان ادویات میں کیا فرق ہے؟',en:'What distinguishes these remedies?',roman:'In adwiyat mein kya farq hai?'})+'">🔬 '+repLangText({ur:'ان میں فرق؟',en:'differentiate',roman:'farq?'})+'</button>':'')
        +(abbrs.length&&typeof repMMOpenForRubric==='function'?' <button class="rst-link" onclick="repMMOpenForRubric()" title="'+repLangText({ur:'ان ادویات کا میٹیریا میڈیکا متن (کینٹ، بورک، ایلن، نیش)',en:'Materia medica text of these remedies (Kent, Boericke, Allen, Nash)',roman:'Materia medica matn'})+'">📖 '+repLangText({ur:'میٹیریا میڈیکا',en:'materia medica',roman:'materia medica'})+'</button>':'')+'</div>';
    if(!abbrs.length){
        h+='<div class="rrp-norems">'+(pureXref?repLangText({ur:'یہ کراس ریفرنس ربرک ہے — اوپر اصل ربرک کھولیں',en:'This is a cross-reference rubric — open the real rubric above',roman:'Ye cross-reference rubric hai — asal rubric kholen'}):repLangText({ur:'اس ربرک میں کوئی ادویات محفوظ نہیں',en:'No remedies recorded under this rubric',roman:'Is rubric mein koi adwiyat mehfooz nahi'}))+'</div>';
    } else {
        // 🔑 تمام ریمیڈیز ایک ہی لسٹ میں (گریڈ ہیڈنگز نہیں) — ترتیب: گریڈ 3 → 2 → 1، رنگ سے گریڈ پہچان (v39: ہیلپر ٹیکسٹ ہٹا دیا گیا)
        h+='<div class="rpd-chips">';
        abbrs.forEach(function(a){
            var g=rems[a]||1; g=(g>=3)?3:((g===2)?2:1);
            var nm=(typeof repNoteMark==='function'&&d.rid)?repNoteMark(repCurrentBook,repCurrentChapter,String(d.rid),a):'';
            h+='<span class="rep-remedy-tag g'+g+(nm?' noted':'')+'" title="'+_repAttr(repRemedyTitle(a)+(nm?(nm==='✔'?' — ✔ منظور شدہ تفریقی نوٹ':' — ✎ نوٹ کا مسودہ'):''))+'" onclick="copyRemedyToPrescription(\''+escapeHtml(a)+'\')">'+escapeHtml(a)+(nm?'<sup class="rep-note-sup">'+nm+'</sup>':'')+'</span>';
        });
        h+='</div>';
    }
    // ---- ✍ تفریقی نوٹس (v59: منظور شدہ/مسودہ نوٹس ربرک کے صفحے پر)
    if(d.rid&&typeof repRubricNotesHtml==='function') h+=repRubricNotesHtml(repCurrentBook,repCurrentChapter,String(d.rid),rems);
    // ---- SUB-RUBRICS (بس جب ذیلی ربرکس موجود ہوں — خالی سیکشن بالکل نہیں دکھانا)
    if(kids.length){
        h+='<div class="rpd-sec-head">📁 '+repLangText({ur:'ذیلی ربرکس',en:'SUB-RUBRICS',roman:'ZELI RUBRICS'})+' <span class="cnt">('+kids.length+')</span></div>';
        h+='<div id="repTreeDetail"></div>';   // 🌳 v72: ذیلی ربرکس بھی کتابی ٹری میں، اصل ترتیب سے
        if(false){
            h+='<button class="rc-btn" style="margin-top:8px;" onclick="repGo('+'repCurrentDetail.labels'+')">📂 '+repLangText({ur:'تمام ',en:'Open all ',roman:'Tamam '})+items.length+repLangText({ur:' ذیلی ربرکس فولڈر ویو میں کھولیں',en:' sub-rubrics in folder view',roman:' zeli rubrics folder view mein'})+'</button>';
        }
    }
    cd.innerHTML=h;
    cd.scrollTop=0;
    if(kids.length){ var _svF=repFolderFilter; repFolderFilter=''; repTreeMount('repTreeDetail',node,(d.labels||[]).slice(),repDetailParentFull()); repFolderFilter=_svF; }
    repRenderDock();
    // async: app cross-reference (other books)
    repRenderXrefAppBody(full,d.rid);
}
// 🔑 ڈیٹیل پیج کا 📋 بٹن: ربرک کا متن سسٹم کلپ بورڈ میں کاپی کرنے کے بجائے
// اب ربرک کو فعال ریپرٹورائزیشن کلپ بورڈ (repActiveClip) میں شامل کرتا ہے۔
// 🔑 v54: HomeoSetu "+ Compare / ✓ Compared" — ڈیٹیل پیج سے فعال کلپ بورڈ میں شامل/خارج (ٹوگل)
// 🔑 v55: 🔬 تفریق / ایکسٹریکشن (js/09-rep-differentiation.js) — ربرک کی ریمیڈیز کا تقابل + ریمیڈی بمقابلہ ریمیڈی
function repDetailDiffBtnHtml(){
    var d=repCurrentDetail||{}; if(!d.rid||typeof repDiffOpenForRubric!=='function') return '';
    return '<button class="rc-btn rpd-diff" onclick="repDiffOpenForRubric()" title="'+repLangText({ur:'اس ربرک کی ریمیڈیز میں فرق — ذیلی/ہم رشتہ ربرکس، ریمیڈی بمقابلہ ریمیڈی ایکسٹریکشن، کتابوں کی گواہی',en:'Differentiate the remedies of this rubric — sub/related rubrics, remedy-vs-remedy extraction, books witness',roman:'Is rubric ki remedies mein farq — extraction'})+'">🔬 '+repLangText({ur:'تفریق',en:'Differentiate',roman:'Tafreeq'})+'</button>';
}
function repDetailCmpBtnHtml(){
    var d=repCurrentDetail||{}; if(!d.rid) return '';
    var on=repClipFind(repActiveClip,repCurrentBook,d.rid)!==-1;
    return '<button class="rc-btn rpd-cmp'+(on?' on':'')+'" id="repDetailCmpBtn" onclick="repDetailCmpToggle()" title="'+repLangText({ur:(on?'فعال کلپ بورڈ سے ہٹائیں: ':'فعال کلپ بورڈ میں شامل کریں: ')+repClipLabel(repActiveClip),en:(on?'Remove from ':'Add to ')+repClipLabel(repActiveClip),roman:(on?'Hataein: ':'Shamil karein: ')+repClipLabel(repActiveClip)})+'">'
        +(on?'✓ '+repLangText({ur:'موازنے میں',en:'Compared',roman:'Compared'}):'+ '+repLangText({ur:'موازنہ',en:'Compare',roman:'Compare'}))+'</button>';
}
function repDetailCmpToggle(){
    var d=repCurrentDetail||{};
    if(!d.rid){ showToast(repLangText({ur:'یہ ربرک کلپ بورڈ میں شامل نہیں ہو سکتی',en:'This rubric cannot be added to a clipboard',roman:'Ye rubric clipboard mein shamil nahi ho sakti'})); return; }
    var rems=0; var e=repRidPathMap[d.rid]; if(e)rems=Object.keys(e.node.remedies||{}).length;
    var added=repClipToggle(repActiveClip,repCurrentBook,repCurrentChapter,String(d.rid),d.full,rems);
    var b=document.getElementById('repDetailCmpBtn'); if(b) b.outerHTML=repDetailCmpBtnHtml();
    showToast((added?'☑ ':'☐ ')+repLangText({ur:added?repClipLabel(repActiveClip)+' میں شامل ہو گیا':repClipLabel(repActiveClip)+' سے ہٹا دیا',en:added?'Added to '+repClipLabel(repActiveClip):'Removed from '+repClipLabel(repActiveClip),roman:added?repClipLabel(repActiveClip)+' mein shamil':repClipLabel(repActiveClip)+' se hata diya'}));
    repCmpSyncChecks(repCurrentBook,String(d.rid),added);
    repCmpPanelRender();
}
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
        +'<div class="rpc-card-top"><div class="rpc-top-l">'+repCmpChkHtml(repCurrentBook,repCurrentChapter,rid,full,rems)+'<div class="rpc-ico '+(kids?'folder':'doc')+'">'+(kids?'📁':'📄')+'</div></div>'
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
