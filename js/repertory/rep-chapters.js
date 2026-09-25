// Bismillah Clinic — js/repertory/rep-chapters.js — ابواب کی ترتیب، ڈیٹا/انڈیکس لوڈنگ
// (v78: 08-app-repertory.js کو بغیر کسی کوڈ تبدیلی کے حصوں میں بانٹا گیا؛ لوڈ ترتیب index.html میں وہی رکھیں)
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
        if (window.PS && PS.hasCustomRep && PS.hasCustomRep(repCurrentBook)) {
            repChapterNames = sortChaptersForBook(repCurrentBook, PS.customRepIndex(repCurrentBook));
            renderChapterList();
            repAutoOpenDefaultChapter();
            return;
        }
        fetch(indexFile+'?'+REP_DATA_V).then(function(r){return r.json();}).then(function(data){
            if (window.PS && PS.hookRepIndex) PS.hookRepIndex(repCurrentBook, data);
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
    if (window.PS && PS.hasCustomRep && PS.hasCustomRep(repCurrentBook)) {
        var _psd = PS.customRepChapter(repCurrentBook, chKey);
        var _pst = buildRubricTree(_psd); repTreeCache[chKey] = _pst; renderTree(chKey, nm, _pst);
        return;
    }
    fetch(basePath+chKey+'.json?'+REP_DATA_V).then(function(r){return r.json();}).then(function(d){
        if (window.PS && PS.applyRepOverrides) PS.applyRepOverrides(repCurrentBook, chKey, d);
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
        // 🔑 v80 (صارف فکس): Synthesis کا path ہمیشہ چیپٹر نام سے شروع ہوتا ہے (مثلاً «MIND - ABRUPT - ...»)۔
        // چیپٹر نام ربرک نہیں — اُسے ٹری سے ہٹا دو تاکہ اصل مین ربرکس (ABRUPT، ABSENTMINDED ...) سیدھا چیپٹر کے نیچے آئیں۔
        // (تمام 83 ابواب میں path کا پہلا سیگمنٹ == چیپٹر نام — تصدیق شدہ؛ دوسری کتابوں کی ٹری/ادویات متبدیل نہیں)
        if(repCurrentBook === 'synthesis91' && parts.length) parts = parts.slice(1);
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

