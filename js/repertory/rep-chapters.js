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
    // 🔑 v143: کینٹ کی کتابی ترتیب اب buildRubricTree میں _repApplyKentTreeFix کے بعد چلتی ہے
    // (ترتیب سے پہلے درستی ضروری ہے — ورنہ نئے جڑ/rehome والے ربرک آخر میں رہ جاتے)
    return root;
}

// 🔑 v146: Kent MIND carries the source parent ID and page order on every row.
// Use those explicit relationships instead of inferring hierarchy from commas;
// then apply the one audited page-8 display-path correction from kent-tree-fix.js.
function _repHasKentMindSourceData(data){
    var ids=Object.keys(data||{});
    if(!ids.length)return false;
    for(var i=0;i<ids.length;i++){
        var r=data[ids[i]];
        if(!r || typeof r.source_order!=='number' || typeof r.source_label!=='string' ||
           !Object.prototype.hasOwnProperty.call(r,'source_parent_id')) return false;
    }
    return true;
}
function _repApplyKentMindDisplayTreeFix(byRid, fixes){
    (fixes||[]).forEach(function(fix){
        var parent=byRid[String(fix.parentRid)], rubric=byRid[String(fix.rubricRid)];
        if(!parent||!rubric) throw new Error('Missing Kent MIND display-tree anchor '+fix.parentRid+'/'+fix.rubricRid);
        if(String(parent.sourceLabel||'').toUpperCase()!=='ANXIETY' ||
           String(rubric.sourceLabel||'')!==String(fix.sourceLabel||'') ||
           String(rubric.source_parent_id)!==String(fix.parentRid)){
            throw new Error('Kent MIND display-tree anchor no longer matches the audited source at '+fix.rubricRid);
        }
        var oldLabel=String(rubric.name||rubric.sourceLabel||''), parentIndex=(parent.order||[]).indexOf(oldLabel);
        if(parentIndex<0 || parent.children[oldLabel]!==rubric){
            throw new Error('Kent MIND display-tree parent link is inconsistent at '+fix.rubricRid);
        }
        var folderLabel=String(fix.folderLabel||''), rubricLabel=String(fix.rubricLabel||'');
        if(!folderLabel||!rubricLabel||parent.children[folderLabel]){
            throw new Error('Kent MIND display-tree folder label is empty or already exists: '+folderLabel);
        }
        var keep=(fix.keepChildRids||[]).map(String), move=(fix.moveChildRids||[]).map(String);
        var expected=keep.concat(move), actual=(rubric.order||[]).map(function(k){
            var child=rubric.children[k]; return child&&child.rid?String(child.rid):'';
        });
        if(actual.length!==expected.length || actual.some(function(id,i){return id!==expected[i];})){
            throw new Error('Kent MIND display-tree children no longer match the audited source at '+fix.rubricRid);
        }
        var parentTitle=String(parent.displayPathTitle||parent.pathTitle||parent.path||parent.sourceLabel||'');
        var folderTitle=parentTitle?parentTitle+', '+folderLabel:folderLabel;
        var folder={
            name:folderLabel,sourceLabel:folderLabel,children:{},order:[],remedies:{},count:0,
            hasRubric:false,path:folderTitle,pathTitle:folderTitle,displayPathTitle:folderTitle,
            syntheticMindPath:true,displayParentRid:String(parent.rid||fix.parentRid),rid:null,oorep_id:null
        };
        delete parent.children[oldLabel];
        parent.children[folderLabel]=folder;
        parent.order[parentIndex]=folderLabel;

        rubric.name=rubricLabel;
        rubric.sourceLabel=rubricLabel;
        folder.children[rubricLabel]=rubric;
        folder.order.push(rubricLabel);
        rubric.displayPathTitle=folderTitle+', '+rubricLabel;

        move.forEach(function(rid){
            var child=byRid[rid], childLabel=child&&String(child.name||child.sourceLabel||'');
            if(!child || rubric.children[childLabel]!==child){
                throw new Error('Kent MIND display-tree child link is inconsistent at '+rid);
            }
            delete rubric.children[childLabel];
            rubric.order=rubric.order.filter(function(k){return k!==childLabel;});
            child.displayPathTitle=folderTitle+', '+String(child.sourceLabel||childLabel);
            if(folder.children[childLabel]) throw new Error('Duplicate Kent MIND display-tree child label '+childLabel);
            folder.children[childLabel]=child;
            folder.order.push(childLabel);
        });
    });
}
function _repBuildKentMindSourceTree(data){
    var root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    var entries=Object.keys(data).map(function(rid){return {rid:String(rid),rec:data[rid]};});
    entries.sort(function(a,b){return a.rec.source_order-b.rec.source_order;});
    var byRid=Object.create(null), lastOrder=-1;
    entries.forEach(function(e){
        var rec=e.rec, order=Number(rec.source_order);
        if(!isFinite(order)||order<=lastOrder) throw new Error('Invalid Kent MIND source order at '+e.rid);
        lastOrder=order;
        var parentId=rec.source_parent_id;
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent MIND source parent '+parentId+' for '+e.rid);
        var sourceLabel=String(rec.source_label||'');
        if(!sourceLabel) throw new Error('Empty Kent MIND source label at '+e.rid);
        var label=sourceLabel, duplicate=2;
        while(parent.children[label]) label=sourceLabel+' ['+(duplicate++)+']';
        var node={
            name:label,sourceLabel:sourceLabel,sourceOrder:order,source_parent_id:parentId,
            children:{},order:[],remedies:rec.r||{},count:1,hasRubric:true,
            path:String(rec.t||''),pathTitle:String(rec.t||''),oorep_id:null,rid:e.rid
        };
        parent.children[label]=node;
        parent.order.push(label);
        byRid[e.rid]=node;
    });
    var mindFix=window.KENT_TREE_FIX&&window.KENT_TREE_FIX.ch&&window.KENT_TREE_FIX.ch.mind;
    if(mindFix&&mindFix.displayTree) _repApplyKentMindDisplayTreeFix(byRid,mindFix.displayTree);
    return root;
}

// ============================================================
// 🔑 v143: کینٹ کا درخت کتاب کی اصل ساخت پر — homeoint.org + True-Original PDF سے موازنہ
// مسئلہ: OOREP مرج کے بعد کئی کتابی مین ربرکس (مثلاً «ANGER, irascibility»)
// OOREP کے چھوٹے مین («ANGER») کے نیچے بطور ذیلی ربرک چلے جاتے تھے، اور کچھ
// synthetic (ادویات کے بغیر) لنگر بھی بن گئے تھے۔
// حل: kent-tree-fix.js (آف لائن سکرپٹ سے تیار، دونوں مآخذ سے تصدیق شدہ):
//   (الف) h والے twin/synthetic لنگر ڈیٹا سطح پر فلٹر (اُن کی ادویات گروپ میں موجود رہتی ہیں)
//   (ب) g گروپس: کتابی مین کے بچے دوبارہ اُسی کے نیچے (کتابی لیبل کے ساتھ)
//   (ج) p کتابی مین جڑ پر (مکمل کتابی عنوان کے ساتھ) — مثلاً «ANGER, irascibility»
// تفصیل اور گنتی: KENT_ORDER_METHOD.md · HANDOFF.md v143
// ============================================================
function _repApplyKentTreeFix(tree){
    var fix=(window.KENT_TREE_FIX&&window.KENT_TREE_FIX.ch)?window.KENT_TREE_FIX.ch[repCurrentChapter]:null;
    if(!fix)return tree;
    var byRid={},parByRid={};
    (function walk(n,par){
        (n.order||[]).forEach(function(k){
            var c=n.children[k];if(!c)return;
            if(c.rid){byRid[String(c.rid)]=c;parByRid[String(c.rid)]=n;}
            walk(c,n);
        });
    })(tree,null);
    // (ب) گروپس — بچوں کو کتابی مین کے نیچے (لیبل = کتاب کا ذیلی ربرک)
    (fix.g||[]).forEach(function(g){
        var root=byRid[String(g[0])];if(!root)return;
        (g[1]||[]).forEach(function(pair){
            var c=byRid[String(pair[0])];if(!c)return;
            var par=parByRid[String(pair[0])];
            if(par&&par.children[c.name]===c){
                delete par.children[c.name];
                par.order=par.order.filter(function(x){return x!==c.name;});
            }
            var nm=String(pair[1]||c.name),base=nm,k2=2;
            while(root.children[nm]&&root.children[nm]!==c){nm=base+' ['+(k2++)+']';}
            if(root.children[nm]!==c){
                c.name=nm;
                if(!c.pathTitle)c.pathTitle=c.path||'';
                root.children[nm]=c;root.order.push(nm);
                byRid[String(pair[0])]=c;parByRid[String(pair[0])]=root;
            }
        });
    });
    // (ج) کتابی مین جڑ پر — مکمل کتابی عنوان کے ساتھ
    (fix.p||[]).forEach(function(id){
        var c=byRid[String(id)];if(!c)return;
        var par=parByRid[String(id)];if(!par)return;
        if(par.children[c.name]===c){
            delete par.children[c.name];
            par.order=par.order.filter(function(x){return x!==c.name;});
        }
        var nm=(c.path||c.name).replace(/\s+,/g,',').trim(),base=nm,k2=2;
        while(tree.children[nm]&&tree.children[nm]!==c){nm=base+' ['+(k2++)+']';}
        if(tree.children[nm]!==c){
            c.name=nm;
            if(!c.pathTitle)c.pathTitle=c.path||'';
            tree.children[nm]=c;tree.order.push(nm);
            parByRid[String(id)]=null;
        }
    });
    return tree;
}

// ============================================================
// 🔑 v130: کینٹ کی کتابی ترتیب بحال کرنا (صرف دکھانے/برآمد پر اثر — ڈیٹا، کلیدیں اور ترجمے جوں کے توں)
// مسئلہ: kent_chapters/*.json کی فائل ترتیب کتاب کی نہیں (پرانا merge سکرپٹ ہر سطح کو «سب سے چھوٹا
// OOREP id» ملا کر چنتا تھا)۔ لیکن کتاب کی اصل ترتیب ہمارے پرانے r-id میں محفوظ ہے۔
// کینٹ کا اپنا قانون (PREFACE، صفحہ I): «general rubric ... followed by the particulars, viz. the time of
// occurrence, the circumstances, and lastly the extensions» — یعنی: عام ربرک، پھر وقت، پھر شرائط،
// پھر محل/نوعیت، اور پھیلاؤ سب سے آخر میں۔
// قاعدہ: (الف) پرانے ربرک (r…) اپنی کتابی ترتیب پر (r نمبر کے حساب سے)۔ (ب) نئے ربرک (o/m) اُوپر
// والے پروٹوکول کے حساب سے درمیان میں ٹھیک جگہ پر۔ (ج) کسی سطح پر کوئی پرانا ربرک نہ ہو تو سب
// پروٹوکول کی ترتیب پر۔
function _repKentTimeRank(b){
    var T={daytime:0,morning:1,forenoon:2,noon:3,afternoon:4,evening:5,night:6,midnight:7,
           'before midnight':8,'after midnight':9};
    return T.hasOwnProperty(b)?T[b]:null;
}
function _repKentLabelKey(label){
    var b=String(label||'').replace(/\s*\[\d+\]\s*$/,'').trim().toLowerCase();
    if(b==='right'||b==='right, then left') return [0,0,b];
    if(b==='left'||b==='left, then right')  return [0,1,b];
    var t=_repKentTimeRank(b); if(t!==null) return [2,t,b];
    if(b==='before') return [3,0,b];
    if(b==='during') return [3,1,b];
    if(b==='after')  return [3,2,b];
    if(b==='amel.')  return [3,3,b];
    if(b==='agg.')   return [3,4,b];
    return [4,0,b];
}
function _repKentKeyCmp(a,b){
    if(a[0]!==b[0]) return a[0]<b[0]?-1:1;
    if(a[1]!==b[1]) return a[1]<b[1]?-1:1;
    return a[2] < b[2] ? -1 : (a[2] > b[2] ? 1 : 0);
}
function _repKentRNum(rid){ var m=/^r(\d+)$/.exec(String(rid||'')); return m?parseInt(m[1],10):null; }
// 🔑 v131: مین ربرک (جڑ) کی سطح کینٹ میں حروفِ تہجی سے ہے — کتاب سے تصدیق شدہ
// (تفصیل اور حوالے: KENT_ORDER_METHOD.md)۔ صرف دو استثنا: «… in general» والا عام ربرک سب سے اوپر
// (CHILL میں «COLDNESS in general»، FEVER میں «HEAT in general»)، اور وقت کا بلاک (daytime → … → midnight)
// جو اُن ابواب میں پہلے آتا ہے جہاں کتاب نے وقت کو مقدم رکھا (cough، expectoration، chill، fever،
// generalities، perspiration، vertigo)۔
function _repKentNormLabel(label){
    var s=String(label||'').replace(/\s*\[\d+\]\s*$/,'').replace(/\(See [^)]*\)/g,' ');
    s=s.replace(/&#140;/g,'OE').replace(/&#146;/g,"'").replace(/Æ/g,'AE').replace(/æ/g,'ae')
       .replace(/Œ/g,'OE').replace(/œ/g,'oe').replace(/’/g,"'");
    // 🔑 v131: hyphen پہلے ہٹا دیں (کتاب «RE-ECHO» کو «READING» سے بعد رکھتی ہے) — باقی علامات جگہ
    return s.toLowerCase().replace(/-/g,'').replace(/[^a-z0-9]+/g,' ').replace(/^\s+|\s+$/g,'');
}
function _repKentRootKey(label){
    var b=String(label||'').replace(/\s*\[\d+\]\s*$/,'').trim().toLowerCase();
    var n=_repKentNormLabel(label);
    if(/ in general$/.test(b)) return [0,0,n];
    var t=_repKentTimeRank(b); if(t!==null) return [1,t,n];
    return [2,0,n];
}
function _repSortTreeKentOrder(node, isRoot){
    if(!node||!node.order) return node;
    node.order.forEach(function(l){ _repSortTreeKentOrder(node.children[l], false); });
    var kids=node.order.map(function(l, i){
        var ch=node.children[l]||{};
        return {l:l, i:i, rid:ch.rid||'', dup:ch.dup, key:_repKentLabelKey(l)};
    });
    if(isRoot){
        // 🔑 v131: مین ربرک (جڑ) کی سطح — کینٹ کی کتاب میں مین ربرک حروفِ تہجی سے ہیں، اِس لیے اُنہیں
        // حروفِ تہجی کی ترتیب دی جائے۔ (p.1497 GENITALIA MALE کے آغاز اور دیگر ابواب سے تصدیق شدہ:
        // ABSCESS → ADDISON'S → BUBBLING → … ) اِس سے وہ ربرک بھی اپنی اصل جگہ پر آ جاتے ہیں جو
        // ڈیٹا میں باب کے آخری سرے پر پڑے تھے — مثال rectum کا «ASH-COLORED (See Gray)» (یہ اصل میں
        // STOOL کا مین ربرک ہے، کتاب صفحہ 1372) اب APHTHOUS کے بعد اور BALL سے پہلے آتا ہے۔
        // طریقہ کار، کتابی حوالے اور تصدیق: KENT_ORDER_METHOD.md
        // کلید کے تین درجے: [0] «… in general» سب سے اوپر · [1] وقت کا بلاک (DAYTIME … MIDNIGHT) · [2] باقی حروفِ تہجی
        kids.forEach(function(k){ k.rk=_repKentRootKey(k.l); });
        // «… in general» (کتاب کا عام ربرک — PREFACE: generals to particulars) کو سب سے اوپر صرف اُس وقت
        // رکھیں جب وہ اسی باب کا پہلا ربرک ہو: CHILL کا «COLDNESS in general» اور FEVER کا «HEAT in general»
        // (دونوں کتاب میں باب کے آغاز پر ہیں)۔ ورنہ (مثلاً GENERALITIES کا «SWELLING in general») وہ اپنی
        // حروفِ تہجی والی جگہ پر ہی رہے گا — کتاب میں وہ SWELLING کے نیچے درمیان میں آتا ہے۔
        var minRn=null;
        kids.forEach(function(k){ var r=_repKentRNum(k.rid); if(r!==null && (minRn===null || r<minRn)) minRn=r; });
        kids.forEach(function(k){
            if(k.rk[0]===0 && minRn!==null && _repKentRNum(k.rid)!==minRn) k.rk=[2,0,k.rk[2]];
        });
        kids.sort(function(a,b){ var c=_repKentKeyCmp(a.rk,b.rk); return c? c : (a.i-b.i); });
        node.order=kids.map(function(k){ return k.l; });
        return node;
    }
    var rkids=kids.filter(function(k){ return _repKentRNum(k.rid)!==null; })
                  .sort(function(a,b){ return _repKentRNum(a.rid)-_repKentRNum(b.rid); });
    var rest =kids.filter(function(k){ return _repKentRNum(k.rid)===null; })
                  .sort(function(a,b){ return _repKentKeyCmp(a.key,b.key); });
    if(!rkids.length){ node.order=rest.map(function(k){ return k.l; }); return node; }
    rest.forEach(function(e){
        // 🔑 نئے ربرک کو حروفِ تہجی کے حساب سے سب سے قریب پچھلے پرانے ربرک کے بعد رکھیں
        // (پرانے ربرک کتابی ترتیب پر ہیں جو عموماً حروفِ تہجی ہی ہے — مگر ہر باب میں نہیں)
        var best=-1;
        for(var j=0;j<rkids.length;j++){
            if(_repKentKeyCmp(rkids[j].key,e.key)<=0){
                if(best<0 || _repKentKeyCmp(rkids[j].key,rkids[best].key)>0) best=j;
            }
        }
        rkids.splice(best+1,0,e);
    });
    node.order=rkids.map(function(k){ return k.l; });
    return node;
}

function buildRubricTree(data){
    // 🔑 v146: MIND hierarchy/order use explicit Homeoint parents plus the audited page-8 display correction.
    if(repCurrentBook === 'kent' && repCurrentChapter === 'mind' && _repHasKentMindSourceData(data)){
        return _repBuildKentMindSourceTree(data);
    }
    // Kent English and Repertorium Publicum have many meaningful commas inside
    // a single rubric label. Therefore they must be nested by the longest
    // already-existing rubric prefix, not by every comma.
    // This fixes BUBO/BALL in Kent and oorep Publicum rubric ordering.
    if(repCurrentBook === 'kent' || repCurrentBook === 'publicum' || (REP_BOOK_INFO[repCurrentBook] && REP_BOOK_INFO[repCurrentBook].tree === 'prefix')){
        // 🔑 v143: کینٹ — چھپائے گئے twin/synthetic لنگر فلٹر (kent-tree-fix.js)
        if(repCurrentBook === 'kent' && window.KENT_TREE_FIX && window.KENT_TREE_FIX.ch){
            var _kf=window.KENT_TREE_FIX.ch[repCurrentChapter];
            if(_kf && _kf.h && _kf.h.length){
                var _hs={};_kf.h.forEach(function(id){_hs[id]=1;});
                var _d2={};Object.keys(data).forEach(function(k){if(!_hs[k])_d2[k]=data[k];});
                data=_d2;
            }
        }
        var _kt=_repBuildTreeByExistingRubrics(data);
        if(repCurrentBook === 'kent'){
            _kt=_repApplyKentTreeFix(_kt);
            _repSortTreeKentOrder(_kt, true);   // 🔑 v143: درستی کے بعد کتابی ترتیب (v130/v131 قانون)
        }
        return _kt;
    }

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

