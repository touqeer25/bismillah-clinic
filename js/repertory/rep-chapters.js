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
            parentNode.children[label]={name:label,children:{},order:[],remedies:{},count:0,hasRubric:false,path:'',oorep_id:null,fullPath:path,display:null};
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
            pn.children[dl]={name:dl,children:{},order:[],remedies:{},count:0,hasRubric:false,path:'',oorep_id:null,fullPath:e.path,dup:k,display:null};
            pn.order.push(dl); n=pn.children[dl];
        }
        n.count++;
        n.hasRubric = true;
        n.path = e.path;
        // v166: ربرک کے ساتھ محفوظ ظاہری ترجیح (display.weight/size) — ترمیم کار لکھتا ہے، درخت دکھاتا ہے
        if(!n.display && e.rec.display && typeof e.rec.display==='object' && !Array.isArray(e.rec.display)) n.display = e.rec.display;
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
// 🔑 v148: ذہنی باب کے منظور شدہ عمومی والد والے راستے کو اصلی ربرک شمار کیے بغیر دکھائیں
function _repApplyKentMindRootFolderFix(root,byRid,fixes){
    (fixes||[]).forEach(function(fix){
        var rubric=byRid[String(fix.rubricRid)];
        if(!rubric || rubric.source_parent_id!==null || Number(rubric.sourceOrder)!==Number(fix.sourceOrder)){
            throw new Error('Missing or changed Kent MIND root-folder rubric '+fix.rubricRid);
        }
        var oldLabel=String(rubric.name||rubric.sourceLabel||''), rootIndex=(root.order||[]).indexOf(oldLabel);
        var folderLabel=String(fix.folderLabel||''), rubricLabel=String(fix.rubricLabel||'');
        var fullPath=String(fix.fullPath||'');
        if(root.children[oldLabel]!==rubric || rootIndex<0 || !folderLabel || !rubricLabel ||
           root.children[folderLabel] || rubricLabel!==String(rubric.sourceLabel||oldLabel) ||
           fullPath!==folderLabel+', '+rubricLabel || String(rubric.pathTitle||'')!==fullPath){
            throw new Error('Kent MIND root-folder path no longer matches '+fix.rubricRid);
        }
        var folder={
            name:folderLabel,sourceLabel:folderLabel,children:{},order:[],remedies:{},count:0,
            hasRubric:false,path:folderLabel,pathTitle:folderLabel,displayPathTitle:folderLabel,
            syntheticMindPath:true,rid:null,oorep_id:null
        };
        delete root.children[oldLabel];
        root.children[folderLabel]=folder;
        root.order[rootIndex]=folderLabel;
        rubric.name=rubricLabel;
        rubric.sourceLabel=rubricLabel;
        rubric.displayPathTitle=fullPath;
        folder.children[rubricLabel]=rubric;
        folder.order.push(rubricLabel);
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
            path:String(rec.t||''),pathTitle:String(rec.t||''),oorep_id:null,rid:e.rid,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        byRid[e.rid]=node;
    });
    var mindFix=window.KENT_TREE_FIX&&window.KENT_TREE_FIX.ch&&window.KENT_TREE_FIX.ch.mind;
    if(mindFix&&mindFix.displayTree) _repApplyKentMindDisplayTreeFix(byRid,mindFix.displayTree);
    if(mindFix&&mindFix.rootFolders) _repApplyKentMindRootFolderFix(root,byRid,mindFix.rootFolders);
    return root;
}

// 🔑 v147: چکر باب کے صفحات 96–106 کا ماخذی راستہ؛ مقامی غیر ماخذی قطاریں محفوظ رہیں۔
var _REP_KENT_VERTIGO_SOURCE_MARKER='homeoint-vertigo-v1';
function _repKentVertigoSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_VERTIGO_SOURCE_MARKER;});
}
function _repHasKentVertigoSourceData(data){
    return _repKentVertigoSourceEntries(data).length>0;
}
function _repBuildKentVertigoSourceTree(data){
    var entries=_repKentVertigoSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==430) throw new Error('Expected 430 Kent Vertigo source rows (chapter root VERTIGO included); found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent Vertigo source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<96||page>106) throw new Error('Kent Vertigo source row outside pages 96–106: '+e.rid);
        if(!label) throw new Error('Empty Kent Vertigo source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent Vertigo source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent Vertigo source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent Vertigo source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent Vertigo source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent Vertigo source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent Vertigo sibling label '+label+' at '+e.rid);
        var remedies=rec.source_remedies;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent Vertigo source remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent Vertigo source medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}

// 🔑 v167: سر باب (صفحات 107–234) کا ماخذی درخت — homeoint.org MEDI-T صفحات سے خود مختار پارس
// (parse_head_source.py + crosswalk_head.py + overlay_head.py)؛ پرانی مقامی قطاریں فائل میں محفوظ
// مگر ماخذی درخت سے باہر۔ ہر ماخذی قطار پر source_parent_id + source_order + source_page موجود۔
var _REP_KENT_HEAD_SOURCE_MARKER='homeoint-head-v1';
var _REP_KENT_HEAD_PAGES={first:107,last:234}, _REP_KENT_HEAD_COUNT=6320;
function _repKentHeadSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_HEAD_SOURCE_MARKER;});
}
function _repHasKentHeadSourceData(data){
    return _repKentHeadSourceEntries(data).length===_REP_KENT_HEAD_COUNT;
}
function _repBuildKentHeadSourceTree(data){
    var entries=_repKentHeadSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_HEAD_COUNT) throw new Error('Expected '+_REP_KENT_HEAD_COUNT+' Kent HEAD source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent HEAD source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<107||page>234) throw new Error('Kent HEAD source row outside pages 107–234: '+e.rid);
        if(!label) throw new Error('Empty Kent HEAD source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent HEAD source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent HEAD source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent HEAD source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent HEAD source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent HEAD source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent HEAD sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent HEAD remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent HEAD medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}

// 🔑 v168: آنکھ (EYE) باب (صفحات 235–270) کا ماخذی درخت — وہی طرز جو چکر/سر بابوں میں ثابت ہوا
// (parse_eye_source.py + crosswalk_eye.py + overlay_eye.py)؛ پرانی مقامی قطاریں فائل میں محفوظ
// مگر ماخذی درخت سے باہر۔ مستند درستی: ص 238 دوسرا «evening : Nat-m.» = DRYNESS, canthi کی ذیلی
// (مطبوعہ کتاب + OOREP o30465)۔ ہر ماخذی قطار پر source_parent_id + source_order + source_page موجود۔
var _REP_KENT_EYE_SOURCE_MARKER='homeoint-eye-v1';
var _REP_KENT_EYE_PAGES={first:235,last:270}, _REP_KENT_EYE_COUNT=1694;
function _repKentEyeSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_EYE_SOURCE_MARKER;});
}
function _repHasKentEyeSourceData(data){
    return _repKentEyeSourceEntries(data).length===_REP_KENT_EYE_COUNT;
}
function _repBuildKentEyeSourceTree(data){
    var entries=_repKentEyeSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_EYE_COUNT) throw new Error('Expected '+_REP_KENT_EYE_COUNT+' Kent EYE source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent EYE source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<235||page>270) throw new Error('Kent EYE source row outside pages 235–270: '+e.rid);
        if(!label) throw new Error('Empty Kent EYE source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent EYE source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent EYE source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent EYE source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent EYE source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent EYE source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent EYE sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent EYE remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent EYE medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// 🔑 v169: وژن (VISION) باب (صفحات 271–285) کا ماخذی درخت — وہی طرز جو چکر/سر/آنکھ بابوں میں ثابت ہوا
// (parse_vision_source.py + crosswalk_vision.py + overlay_vision.py)؛ پرانی مقامی قطاریں فائل میں محفوظ
// مگر ماخذی درخت سے باہر۔ باب حد: VISION = 271–285 (kentvisi.htm اختتام p.285 + kentear.htm آغاز p.286؛ EAR
// کا آغاز ص 285 کے نصف میں)۔ مستند درستی: ص 281 «noon : Dig.» سے <dir> چوک = LIGHTNINGS کی ذیلی (OOREP o64045)۔
// ہر ماخذی قطار پر source_parent_id + source_order + source_page موجود۔
var _REP_KENT_VISION_SOURCE_MARKER='homeoint-vision-v1';
var _REP_KENT_VISION_PAGES={first:271,last:285}, _REP_KENT_VISION_COUNT=827;
function _repKentVisionSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_VISION_SOURCE_MARKER;});
}
function _repHasKentVisionSourceData(data){
    return _repKentVisionSourceEntries(data).length===_REP_KENT_VISION_COUNT;
}
function _repBuildKentVisionSourceTree(data){
    var entries=_repKentVisionSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_VISION_COUNT) throw new Error('Expected '+_REP_KENT_VISION_COUNT+' Kent VISION source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent VISION source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<271||page>285) throw new Error('Kent VISION source row outside pages 271–285: '+e.rid);
        if(!label) throw new Error('Empty Kent VISION source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent VISION source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent VISION source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent VISION source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent VISION source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent VISION source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent VISION sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent VISION remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent VISION medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// 🔑 v170: کان (EAR) باب (صفحات 285–320) کا ماخذی درخت — وہی طرز جو چکر/سر/آنکھ/وژن بابوں میں ثابت ہوا
// (parse_ear_source.py + crosswalk_ear.py + overlay_ear.py)؛ پرانی مقامی قطاریں فائل میں محفوظ
// مگر ماخذی درخت سے باہر۔ باب حد: EAR = 285–320 (kentear.htm ہیڈر + 36 فہرست اندراجات؛ آغاز ص 285 نصف میں،
// اختتام p.320 WORMS)۔ مستند درستیاں: ص 292 NOISES سرخی بحال، ص 300 سٹرے yawning حذف، ص 285 AIR اضافی
// <dir>، 37 run-on لفٹیں (OOREP دو-فارم ٹیسٹ) — مانی فیسٹ میں تفصیل۔ ہر قطار پر source_* موجود۔
var _REP_KENT_EAR_SOURCE_MARKER='homeoint-ear-v1';
var _REP_KENT_EAR_PAGES={first:285,last:320}, _REP_KENT_EAR_COUNT=1902;
function _repKentEarSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_EAR_SOURCE_MARKER;});
}
function _repHasKentEarSourceData(data){
    return _repKentEarSourceEntries(data).length===_REP_KENT_EAR_COUNT;
}
function _repBuildKentEarSourceTree(data){
    var entries=_repKentEarSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_EAR_COUNT) throw new Error('Expected '+_REP_KENT_EAR_COUNT+' Kent EAR source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent EAR source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<285||page>320) throw new Error('Kent EAR source row outside pages 285–320: '+e.rid);
        if(!label) throw new Error('Empty Kent EAR source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent EAR source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent EAR source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent EAR source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent EAR source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent EAR source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent EAR sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent EAR remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent EAR medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// 🔑 v171: سماعت (HEARING) باب (صفحات 321–323) کا ماخذی درخت — وہی طرز جو چکر/سر/آنکھ/وژن/کان بابوں میں ثابت ہوا
// (parse_hearing_source.py + crosswalk_hearing2.py + overlay_hearing.py)؛ پرانی مقامی قطاریں فائل میں محفوظ
// مگر ماخذی درخت سے باہر۔ باب حد: HEARING = 321–323 (kenthear.htm انڈیکس → kent0320.htm#P321-323؛ اختتام ص 323،
// ص 324 پر NOSE آغاز)۔ مستند درستیاں: 16 run-on لفٹیں (OOREP دو-فارم ٹیسٹ)، 8 دستی جوڑیاں (PDF کتاب سے
// ثابت OOREP لیبل-خوارافی)، 3 گم شدہ ربرکس بحال (OOREP id خلا 44981-83) — مانی فیسٹ + تصدیق-ضروری CSV میں تفصیل۔
var _REP_KENT_HEARING_SOURCE_MARKER='homeoint-hearing-v1';
var _REP_KENT_HEARING_PAGES={first:321,last:323}, _REP_KENT_HEARING_COUNT=146;
function _repKentHearingSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_HEARING_SOURCE_MARKER;});
}
function _repHasKentHearingSourceData(data){
    return _repKentHearingSourceEntries(data).length===_REP_KENT_HEARING_COUNT;
}
function _repBuildKentHearingSourceTree(data){
    var entries=_repKentHearingSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_HEARING_COUNT) throw new Error('Expected '+_REP_KENT_HEARING_COUNT+' Kent HEARING source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent HEARING source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<321||page>323) throw new Error('Kent HEARING source row outside pages 321–323: '+e.rid);
        if(!label) throw new Error('Empty Kent HEARING source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent HEARING source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent HEARING source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent HEARING source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent HEARING source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent HEARING source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent HEARING sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent HEARING remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent HEARING medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// ============================================================
// 🔑 v172: ناک (NOSE) باب کی ماخذی قطاریں (صفحات 324–354) — homeoint.org
// (parse_nose_source.py + crosswalk_nose.py + overlay_nose.py)؛ پرانی مقامی قطاریں فائل میں محفوظ
// مگر ماخذی درخت سے باہر۔ باب حد: NOSE = 324–354 (kentnose.htm انڈیکس → kent0320–kent0350؛ اختتام ص 354،
// ص 355 پر FACE آغاز)۔ مستند درستیاں: 8 خاندانی گہرائی-درستیاں (MEDI-T دوہرے <dir>؛ کتاب+OOREP سے اتفاق)،
// 1 صفحہ-مارکر کٹ (bare sides)، 2 دہرائے کتابی ربرکس ضم، 26 دستی جوڑیاں (Jaccard ≥ 0.96)،
// 4 گم شدہ ربرکس بحال (PULSATION×2، YELLOW، جڑ) — مانی فیسٹ + تصدیق-ضروری CSV میں تفصیل۔
var _REP_KENT_NOSE_SOURCE_MARKER='homeoint-nose-v1';
var _REP_KENT_NOSE_PAGES={first:324,last:354}, _REP_KENT_NOSE_COUNT=1428;
function _repKentNoseSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_NOSE_SOURCE_MARKER;});
}
function _repHasKentNoseSourceData(data){
    return _repKentNoseSourceEntries(data).length===_REP_KENT_NOSE_COUNT;
}
function _repBuildKentNoseSourceTree(data){
    var entries=_repKentNoseSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_NOSE_COUNT) throw new Error('Expected '+_REP_KENT_NOSE_COUNT+' Kent NOSE source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent NOSE source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<324||page>354) throw new Error('Kent NOSE source row outside pages 324–354: '+e.rid);
        if(!label) throw new Error('Empty Kent NOSE source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent NOSE source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent NOSE source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent NOSE source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent NOSE source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent NOSE source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent NOSE sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent NOSE remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent NOSE medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// ============================================================
// 🔑 v173: چہرہ (FACE) باب کی ماخذی قطاریں (صفحات 355–396) — homeoint.org
// (parse_face_source.py + crosswalk_face.py + overlay_face.py)؛ پرانی مقامی قطاریں فائل میں محفوظ
// مگر ماخذی درخت سے باہر۔ باب حد: FACE = 355–396 (kentface.htm انڈیکس سرخی p. 355-396، 42 اندراجات؛
// اختتام ص 396 — P397 پر MOUTH، kentmout.htm انڈیکس سرخی "MOUTH (p. 397-430)" سے ثابت)۔
// مستند درستیاں: 8 خاندانی گہرائی-درستیاں (ہر ایک کتاب کے صفحہ-تصویر + bbox x-координات سے تصدیق شدہ)،
// 8 دستی جوڑیاں (Jaccard = 1.000 یا عین-فارم)، 30 گم شدہ ربرکس بحال — مانی فیسٹ + CSV میں تفصیل۔
var _REP_KENT_FACE_SOURCE_MARKER='homeoint-face-v1';
var _REP_KENT_FACE_PAGES={first:355,last:396}, _REP_KENT_FACE_COUNT=1988;
function _repKentFaceSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_FACE_SOURCE_MARKER;});
}
function _repHasKentFaceSourceData(data){
    return _repKentFaceSourceEntries(data).length===_REP_KENT_FACE_COUNT;
}
function _repBuildKentFaceSourceTree(data){
    var entries=_repKentFaceSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_FACE_COUNT) throw new Error('Expected '+_REP_KENT_FACE_COUNT+' Kent FACE source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent FACE source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<355||page>396) throw new Error('Kent FACE source row outside pages 355–396: '+e.rid);
        if(!label) throw new Error('Empty Kent FACE source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent FACE source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent FACE source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent FACE source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent FACE source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent FACE source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent FACE sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent FACE remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent FACE medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// 🔑 v174: منہ (MOUTH) باب کی ماخذی قطاریں (صفحات 397–430) — homeoint.org
// (parse_mouth_source.py + crosswalk_mouth.py + overlay_mouth.py)؛ پرانی مقامی قطاریں فائل میں محفوظ
// مگر ماخذی درخت سے باہر۔ باب حد: MOUTH = 397–430 (kentmout.htm انڈیکس سرخی p. 397-430، 34 اندراجات = 34/34
// صفحہ-بریکرمب؛ اختتام ص 430 — PDF ثابت: مطبوعہ ص 930 MOUTH اختتام کے بعد ص 931 پر TEETH سرخی +
// ABSCESS of roots؛ kent0430 میں P431 = CARIES)۔
// مستند درستیاں: TEETH باب-آغاز کٹ (16 قطاریں — MEDI-T نے ص 430 کے اندر ڈالی تھیں)،
// 15 خاندانی گہرائی-درستیاں، 3 حقیقی کتابی دہرائے (max-گریڈ ضم)، 30 دستی جوڑیاں
// (Jaccard = 1.000) — مانی فیسٹ + CSV میں تفصیل۔
var _REP_KENT_MOUTH_SOURCE_MARKER='homeoint-mouth-v1';
var _REP_KENT_MOUTH_PAGES={first:397,last:430}, _REP_KENT_MOUTH_COUNT=1516;
function _repKentMouthSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_MOUTH_SOURCE_MARKER;});
}
function _repHasKentMouthSourceData(data){
    return _repKentMouthSourceEntries(data).length===_REP_KENT_MOUTH_COUNT;
}
function _repBuildKentMouthSourceTree(data){
    var entries=_repKentMouthSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_MOUTH_COUNT) throw new Error('Expected '+_REP_KENT_MOUTH_COUNT+' Kent MOUTH source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent MOUTH source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<397||page>430) throw new Error('Kent MOUTH source row outside pages 397–430: '+e.rid);
        if(!label) throw new Error('Empty Kent MOUTH source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent MOUTH source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent MOUTH source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent MOUTH source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent MOUTH source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent MOUTH source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent MOUTH sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent MOUTH remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent MOUTH medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// 🔑 v175: دانت (TEETH) باب کی ماخذی قطاریں (صفحات 430 نصف – 447) — homeoint.org
// (parse_teeth_source.py + crosswalk_teeth.py + overlay_teeth.py)؛ پرانی مقامی قطاریں فائل میں محفوظ
// مگر ماخذی درخت سے باہر۔ باب حد: TEETH = 430 (نصف) – 447 (kentteet.htm فہرست «TEETH (p. 430-447)» —
// 18 اندراجات = 18/18 صفحہ-بریکرمب؛ kent0430 کا P430 سیکشن MOUTH-دم (VESICLES…WOOD) + TEETH سرخی
// رکھتا ہے — v174 کا 16-قطار کٹ یہاں واپس؛ اختتام P448 = THROAT آغاز — PDF ثابت: TEETH = PDF
// 967–1001 (مطبوعہ ص 931–965)، THROAT آغاز PDF 1002)۔
// مستند درستیاں: ص 435 «biting teeth together, when» خاندانی لفٹ d2→d1 (OOREP o60574 بھائی-فارم)،
// ص 445 (مطبوعہ 948+949) کتابی دہرایا «stitching, stinging, left» max-گریڈ ضم، 29 دستی جوڑے
// (r145/r287 OOREP-aggregate واپسی سمیت) — مانی فیسٹ + CSV میں تفصیل۔
var _REP_KENT_TEETH_SOURCE_MARKER='homeoint-teeth-v1';
var _REP_KENT_TEETH_PAGES={first:430,last:447}, _REP_KENT_TEETH_COUNT=767;
function _repKentTeethSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_TEETH_SOURCE_MARKER;});
}
function _repHasKentTeethSourceData(data){
    return _repKentTeethSourceEntries(data).length===_REP_KENT_TEETH_COUNT;
}
function _repBuildKentTeethSourceTree(data){
    var entries=_repKentTeethSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_TEETH_COUNT) throw new Error('Expected '+_REP_KENT_TEETH_COUNT+' Kent TEETH source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent TEETH source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<430||page>447) throw new Error('Kent TEETH source row outside pages 430–447: '+e.rid);
        if(!label) throw new Error('Empty Kent TEETH source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent TEETH source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent TEETH source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent TEETH source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent TEETH source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent TEETH source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent TEETH sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent TEETH remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent TEETH medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// 🔑 v176: گلا (THROAT) باب کی ماخذی قطاریں (صفحات 448–470) — homeoint.org
// (parse_throat_source.py + crosswalk_throat.py + overlay_throat.py)؛ پرانی مقامی قطاریں فائل میں محفوظ
// مگر ماخذی درخت سے باہر۔ باب حد: THROAT = 448–470 (kentthro.htm فہرست «THROAT (p. 448-470)» —
// 23 اندراجات = 23/23 صفحہ-اندراجات subsequence؛ آغاز PDF 1002 = کتابی ص 448 سرخی سطرِ اول؛
// اختتام P471 = EXTERNAL THROAT آغاز — kentexth.htm انڈیکس + PDF 1048)۔
// مستند درستیاں: 3 خاندانی clamps (ص 460/465/468 — MEDI-T دوہرے <dir>؛ مثلاً ص 468 وقت-خاندان
// morning/forenoon/noon/evening «SWALLOWING, difficult» کے براہِ راست بچے)، ص 450 کتابی دہرایا
// «redness, dark red» max-گریڈ ضم (PDF 1007 پر دونوں واقعے ثابت)، 21 دستی J=1.00 جوڑے
// (r438 «PAIN, cold» اور r745 «PAIN, stitching, swallowing» aggregate واپسی + کتابی «on becoming»
// r733 سمیت) — مانی فیسٹ homeoint_throat_source_manifest.json + رپورٹس میں تفصیل۔
var _REP_KENT_THROAT_SOURCE_MARKER='homeoint-throat-v1';
var _REP_KENT_THROAT_PAGES={first:448,last:470}, _REP_KENT_THROAT_COUNT=982;
function _repKentThroatSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_THROAT_SOURCE_MARKER;});
}
function _repHasKentThroatSourceData(data){
    return _repKentThroatSourceEntries(data).length===_REP_KENT_THROAT_COUNT;
}
function _repBuildKentThroatSourceTree(data){
    var entries=_repKentThroatSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_THROAT_COUNT) throw new Error('Expected '+_REP_KENT_THROAT_COUNT+' Kent THROAT source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent THROAT source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<448||page>470) throw new Error('Kent THROAT source row outside pages 448–470: '+e.rid);
        if(!label) throw new Error('Empty Kent THROAT source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent THROAT source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent THROAT source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent THROAT source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent THROAT source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent THROAT source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent THROAT sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent THROAT remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent THROAT medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// 🔑 v177: بیرونی گلا (EXTERNAL THROAT) باب کی ماخذی قطاریں (صفحات 471–475) — homeoint.org
// (parse_extthroat_source.py + crosswalk_extthroat.py + overlay_extthroat.py)؛ پرانی مقامی قطاریں
// فائل میں محفوظ مگر ماخذی درخت سے باہر۔ باب حد: EXTERNAL THROAT = 471–475 (kentexth.htm فہرست
// «EXTERNAL THROAT (p. 471-475)» — 5 اندراجات = 5/5 صفحہ-اندراجات subsequence؛ آغاز PDF 1048 =
// کتابی ص 471؛ اختتام P475 = WARTS آخری مین، STOMACH از PDF 1059؛ P475 کتابی درستی kent0475
// ڈپ سیکشن سے کراس-تصدیق شدہ — عین 1493 حروف)۔
// مستند درستیاں: 2 خاندانی clamps (ص 472 «PAIN, burning, sides, right/left» d3→d2، ص 473
// «PAIN, pressing, sides, intermittent» d3→d2 — MEDI-T اضافی <dir>، بلا-وسط بچے)، 4 دستی J=1.00
// جوڑے (o15077 «6 p.m. to 9 p.m.» ↔ کتابی «6 to 9 p.m.» وقت-فارمیٹ PDF 1055 + o15122/o15125/o15126
// «TORTICOLLIS, cystic/fatty/recurrent fibroid» ↔ کتابی «TUMORS, side, …» — OOREP نام-تبدیل،
// PDF 1058 میں TUMORS, side ہی ہے) — مانی فیسٹ homeoint_extthroat_source_manifest.json۔
var _REP_KENT_EXTTHROAT_SOURCE_MARKER='homeoint-extthroat-v1';
var _REP_KENT_EXTTHROAT_PAGES={first:471,last:475}, _REP_KENT_EXTTHROAT_COUNT=248;
function _repKentExtThroatSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_EXTTHROAT_SOURCE_MARKER;});
}
function _repHasKentExtThroatSourceData(data){
    return _repKentExtThroatSourceEntries(data).length===_REP_KENT_EXTTHROAT_COUNT;
}
function _repBuildKentExtThroatSourceTree(data){
    var entries=_repKentExtThroatSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_EXTTHROAT_COUNT) throw new Error('Expected '+_REP_KENT_EXTTHROAT_COUNT+' Kent EXTERNAL THROAT source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent EXTERNAL THROAT source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<471||page>475) throw new Error('Kent EXTERNAL THROAT source row outside pages 471–475: '+e.rid);
        if(!label) throw new Error('Empty Kent EXTERNAL THROAT source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent EXTERNAL THROAT source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent EXTERNAL THROAT source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent EXTERNAL THROAT source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent EXTERNAL THROAT source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent EXTERNAL THROAT source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent EXTERNAL THROAT sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent EXTERNAL THROAT remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent EXTERNAL THROAT medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// ============================================================
// 🔑 v178: معدہ (STOMACH) باب کی ماخذی قطاریں (صفحات 476–540) — homeoint.org
// (parse_stomach_source.py + crosswalk_stomach.py + overlay_stomach.py)؛ پرانی مقامی قطاریں
// فائل میں محفوظ مگر ماخذی درخت سے باہر۔ باب حد: STOMACH = 476–540 (kentstom.htm فہرست
// «STOMACH (p. 476-540)» — 65 اندراجات = 65/65 صفحہ-اندراجات subsequence؛ آغاز PDF 1059 =
// کتابی ص 476؛ اختتام P540 = WATERBRASH/WEIGHT/WINE آخری مینز، ABDOMEN از PDF 1194؛
// P540 کتابی درستی kent0540 ڈپ سیکشن سے کراس-تصدیق شدہ — عین 2883 حروف)۔
// مستند درستیاں: 7 خاندانی clamps (ص484/486/501/506/510/512×2 — MEDI-T اضافی <dir>، بلا-وسط بچے)،
// 1 ماخذ ترمیم (ص535 MEDI-T flat «VOMITING, amel.» ← کتابی «VOMITING, wine, amel.» — PDF
// «wine agg. : Ant-c. / amel. : Kalm.»)، 47 دستی J=1.00 جوڑے (19 OOREP agg.-لاحقہ/سیگمنٹ-کٹی،
// 5 وقت-فارمیٹ، o58512 forenoon↔morning کتابی 11 a.m.، o59389 مبہم سے J=1.000، o59728
// کتابی لیبل «often, for»، باقی نام-مختصر سازی) — مانی فیسٹ homeoint_stomach_source_manifest.json۔
// PDF تیسرا ماخذ: 1059–1193 — ordered alignment 2936/2939، صفر drift؛ 3 فرق = صفحہ-سرحد
// آرٹی فیکٹ (Carb-v/Nat-c/Jug-r ناموں میں PDF صفحہ-نمبر سٹیمپ — ماخذ درست)۔
var _REP_KENT_STOMACH_SOURCE_MARKER='homeoint-stomach-v1';
var _REP_KENT_STOMACH_PAGES={first:476,last:540}, _REP_KENT_STOMACH_COUNT=2940;
function _repKentStomachSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_STOMACH_SOURCE_MARKER;});
}
function _repHasKentStomachSourceData(data){
    return _repKentStomachSourceEntries(data).length===_REP_KENT_STOMACH_COUNT;
}
function _repBuildKentStomachSourceTree(data){
    var entries=_repKentStomachSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_STOMACH_COUNT) throw new Error('Expected '+_REP_KENT_STOMACH_COUNT+' Kent STOMACH source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent STOMACH source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<476||page>540) throw new Error('Kent STOMACH source row outside pages 476–540: '+e.rid);
        if(!label) throw new Error('Empty Kent STOMACH source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent STOMACH source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent STOMACH source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent STOMACH source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent STOMACH source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent STOMACH source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent STOMACH sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent STOMACH remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent STOMACH medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}

// ============================================================
// 🔑 v179: شکم (ABDOMEN) باب کی ماخذی قطاریں (صفحات 541–605) — homeoint.org
// (parse_abdomen_source.py + crosswalk_abdomen.py + overlay_abdomen.py)؛ پرانی مقامی قطاریں
// فائل میں محفوظ مگر ماخذی درخت سے باہر۔ باب حد: ABDOMEN = 541–605 (kentabdo.htm فہرست
// «ABDOMEN (p. 541-605)» — 65 اندراجات؛ آغاز PDF 1194 = کتابی ص 541؛ اختتام P605 = TUMORS
// آخری مینز، RECTUM از PDF 1343؛ P605 کتابی درستی kent0605 ڈپ سیکشن سے کراس-تصدیق شدہ — عین 2162 حروف)۔
// مستند درستیاں: 10 خاندانی clamps (ص484/486/501/506/510/512×2 — MEDI-T اضافی <dir>، بلا-وسط بچے)،
// 1 ماخذ ترمیم (ص535 MEDI-T flat «VOMITING, amel.» ← کتابی «VOMITING, wine, amel.» — PDF
// «wine agg. : Ant-c. / amel. : Kalm.»)، 14 دستی J=1.00 جوڑے (19 OOREP agg.-لاحقہ/سیگمنٹ-کٹی،
// 5 وقت-فارمیٹ، o58512 forenoon↔morning کتابی 11 a.m.، o59389 مبہم سے J=1.000، o59728
// کتابی لیبل «often, for»، باقی نام-مختصر سازی) — مانی فیسٹ homeoint_stomach_source_manifest.json۔
// PDF تیسرا ماخذ: 1194–1342 — ordered alignment 3269/3275، صفر باقیات؛ 4 فرق سب دستاویزی
// (2 PDF لائن-ٹوٹ جوڑا ص553، ŒDEMA ص554 PDF-گلو، ص581 صفحہ-سٹیمپ nat1230c — ماخذ درست)۔
// انڈیکس-تصدیق 63/65 — 2 MEDI-T انڈیکس غلطیاں PDF ثابت (p570 spleen←Sides، p582 sides←liver)۔
var _REP_KENT_ABDOMEN_SOURCE_MARKER='homeoint-abdomen-v1';
var _REP_KENT_ABDOMEN_PAGES={first:541,last:605}, _REP_KENT_ABDOMEN_COUNT=3269;
function _repKentAbdomenSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_ABDOMEN_SOURCE_MARKER;});
}
function _repHasKentAbdomenSourceData(data){
    return _repKentAbdomenSourceEntries(data).length===_REP_KENT_ABDOMEN_COUNT;
}
function _repBuildKentAbdomenSourceTree(data){
    var entries=_repKentAbdomenSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_ABDOMEN_COUNT) throw new Error('Expected '+_REP_KENT_ABDOMEN_COUNT+' Kent ABDOMEN source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent ABDOMEN source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<541||page>605) throw new Error('Kent ABDOMEN source row outside pages 541–605: '+e.rid);
        if(!label) throw new Error('Empty Kent ABDOMEN source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent ABDOMEN source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent ABDOMEN source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent ABDOMEN source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent ABDOMEN source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent ABDOMEN source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent STOMACH sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent STOMACH remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent STOMACH medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
var _REP_KENT_RECTUM_SOURCE_MARKER='homeoint-rectum-v1';
var _REP_KENT_RECTUM_PAGES={first:606,last:635}, _REP_KENT_RECTUM_COUNT=1200;
function _repKentRectumSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_RECTUM_SOURCE_MARKER;});
}
function _repHasKentRectumSourceData(data){
    return _repKentRectumSourceEntries(data).length===_REP_KENT_RECTUM_COUNT;
}
function _repBuildKentRectumSourceTree(data){
    var entries=_repKentRectumSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_RECTUM_COUNT) throw new Error('Expected '+_REP_KENT_RECTUM_COUNT+' Kent RECTUM source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent RECTUM source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<606||page>635) throw new Error('Kent RECTUM source row outside pages 606–635: '+e.rid);
        if(!label) throw new Error('Empty Kent RECTUM source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent RECTUM source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent RECTUM source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent RECTUM source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent RECTUM source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent RECTUM source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent RECTUM sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent RECTUM remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent RECTUM medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// 🔑 v181: سٹول (STOOL) باب کی ماخذی قطاریں (صفحات 635–644) — homeoint.org
// (parse_stool_source.py + crosswalk_stool.py + overlay_stool.py)؛ پرانی مقامی قطاریں فائل میں محفوظ
// مگر ماخذی درخت سے باہر۔ باب حد: STOOL = 635–644 (MEDI-T انتساب — kentstoo.htm فہرست 10/10 صفحہ-اندراجات؛
// آغاز NAME="STOOL" اینکر — kent0635.htm کے P635 سیکشن کا آخر؛ اختتام P644 — kent0640.htm کے P645 سیکشن
// (URINARY ORGANS منتقلی + BLADDER) کٹ)۔ مطبوعہ کتاب (PDF) STOOL سرخی folio 1372 = کتابی ص 636 پر —
// MEDI-T انتساب کتاب سے ایک آگے، برقرار (manifest)۔ PDF alignment: 237/237 (1 folio-glue آرٹی فاکٹ aurm1376n)۔
var _REP_KENT_STOOL_SOURCE_MARKER='homeoint-stool-v1';
var _REP_KENT_STOOL_PAGES={first:635,last:644}, _REP_KENT_STOOL_COUNT=238;
function _repKentStoolSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_STOOL_SOURCE_MARKER;});
}
function _repHasKentStoolSourceData(data){
    return _repKentStoolSourceEntries(data).length===_REP_KENT_STOOL_COUNT;
}
function _repBuildKentStoolSourceTree(data){
    var entries=_repKentStoolSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_STOOL_COUNT) throw new Error('Expected '+_REP_KENT_STOOL_COUNT+' Kent STOOL source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent STOOL source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<635||page>644) throw new Error('Kent STOOL source row outside pages 635–644: '+e.rid);
        if(!label) throw new Error('Empty Kent STOOL source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent STOOL source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent STOOL source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent STOOL source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent STOOL source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent STOOL source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent STOOL sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent STOOL remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent STOOL medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// 🔑 v182: مثانہ (BLADDER) باب کی ماخذی قطاریں (صفحات 645–662) — homeoint.org
// (parse_bladder_source.py + crosswalk_bladder.py + overlay_bladder.py)؛ پرانی مقامی قطاریں
// فائل میں محفوظ مگر ماخذی درخت سے باہر۔ باب حد: BLADDER = 645–662 (MEDI-T انتساب — kenturor.htm
// فہرست 18/18 صفحہ-اندراجات subsequence)؛ آغاز NAME="BLADDER" اینکر (kent0645.htm — URINARY ORGANS
// سرخیاں اینکر سے پہلے کٹ)؛ اختتام kent0660.htm کے P662 سیکشن کے اندر NAME="KIDNEYS" اینکر
// (WORM in, sensation of آخری ربرک)۔ مطبوعہ کتاب (PDF) URINARY ORGANS/BLADDER سرخی folio 1389 =
// کتابی ص 646 پر — MEDI-T انتساب کتاب سے ایک آگے، برقرار (manifest)۔
// PDF alignment: 714/714 (660 عین + 51 PDF-نکالنے کے آرٹی فاکٹ قطاریں: 30 صفحہ-سرخی گلا
// urinaryorgans/blandder + فولیو-گلا crot1416t + لائن-ریپ گلا — سب PDF-طرفہ، ماخذ درست)۔
var _REP_KENT_BLADDER_SOURCE_MARKER='homeoint-bladder-v1';
var _REP_KENT_BLADDER_PAGES={first:645,last:662}, _REP_KENT_BLADDER_COUNT=711;
function _repKentBladderSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_BLADDER_SOURCE_MARKER;});
}
function _repHasKentBladderSourceData(data){
    return _repKentBladderSourceEntries(data).length===_REP_KENT_BLADDER_COUNT;
}
function _repBuildKentBladderSourceTree(data){
    var entries=_repKentBladderSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_BLADDER_COUNT) throw new Error('Expected '+_REP_KENT_BLADDER_COUNT+' Kent BLADDER source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent BLADDER source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<645||page>662) throw new Error('Kent BLADDER source row outside pages 645–662: '+e.rid);
        if(!label) throw new Error('Empty Kent BLADDER source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent BLADDER source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent BLADDER source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent BLADDER source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent BLADDER source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent BLADDER source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent BLADDER sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent BLADDER remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent BLADDER medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// 🔑 v183: گردے (KIDNEYS) باب کی ماخذی قطاریں (صفحات 662–667) — homeoint.org
// (parse_kidneys_source.py + crosswalk_kidneys.py + overlay_kidneys.py)؛ پرانی مقامی قطاریں
// فائل میں محفوظ مگر ماخذی درخت سے باہر۔ باب حد: KIDNEYS = 662–667 (MEDI-T انتساب — kenturor.htm
// فہرست 6/6 صفحہ-اندراجات subsequence)؛ آغاز kent0660.htm کے P662 سیکشن کے اندر NAME="KIDNEYS" اینکر
// (صفحہ-اینکر نہیں، سیکشن کے بیچ میں — ABSCESS پہلی قطار)؛ اختتام kent0665.htm کے P667 سیکشن میں
// NAME="PROSTATE" اینکر سے پہلے (آخری ربرک WEARINESS, region of)۔ kent0660 کے دم کا p666 stub
// (بغیر-اینکر سرخی + مارکر + >>>>> nav) stub-cut regex سے کٹ — دستاویزی۔ کتاب (PDF) KIDNEYS سرخی
// کتابی ص 663 (PDF index 1460) کی سطرِ اول — MEDI-T انتساب کتاب سے ایک پیچھے، برقرار (manifest)۔
// PDF alignment: 246/246 حرف-بہ-حرف عین مطابق، صفر فرق، صفر drift، صفر دونوں-طرفہ باقیات
// (11 صفحہ-سرخی گلا «X.urinaryorgans/kidneys» نکالنے پر ہی فلٹر — JUNK pattern)۔
// کتابی دہرائی: «PAIN, pulsating» دوبار (p663 Bufo + p665 Berb) — crosswalk merge union
// (گرےڈ max) = ایپ r41 عین — درخت میں ایک قطار (پہلی جگہ پر)۔
var _REP_KENT_KIDNEYS_SOURCE_MARKER='homeoint-kidneys-v1';
var _REP_KENT_KIDNEYS_PAGES={first:662,last:667}, _REP_KENT_KIDNEYS_COUNT=246;
function _repKentKidneysSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_KIDNEYS_SOURCE_MARKER;});
}
function _repHasKentKidneysSourceData(data){
    return _repKentKidneysSourceEntries(data).length===_REP_KENT_KIDNEYS_COUNT;
}
function _repBuildKentKidneysSourceTree(data){
    var entries=_repKentKidneysSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_KIDNEYS_COUNT) throw new Error('Expected '+_REP_KENT_KIDNEYS_COUNT+' Kent KIDNEYS source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent KIDNEYS source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<662||page>667) throw new Error('Kent KIDNEYS source row outside pages 662–667: '+e.rid);
        if(!label) throw new Error('Empty Kent KIDNEYS source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent KIDNEYS source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent KIDNEYS source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent KIDNEYS source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent KIDNEYS source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent KIDNEYS source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent KIDNEYS sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent KIDNEYS remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent KIDNEYS medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// 🔑 v184: پروسٹیٹ غدود (PROSTATE GLAND) باب کی ماخذی قطاریں (صفحات 667–668) — homeoint.org
// (parse_prostate_source.py + crosswalk_prostate.py + overlay_prostate.py)؛ پرانی مقامی قطاریں
// فائل میں محفوظ مگر ماخذی درخت سے باہر۔ باب حد: PROSTATE GLAND = 667–668 (MEDI-T انتساب — kenturor.htm
// فہرست 2/2 صفحہ-اندراجات: Prostate gland (p. 667) + Prostate gland, inflammation (p. 668))؛ آغاز
// kent0665.htm کے NAME="PROSTATE" اینکر (گردے باب کا اختتامی اینکر وہی تھا — بالکل سیکشن کے بعد،
// پہلی قطار BALL, sensation of sitting on a)؛ اختتام اُسی فائل میں URETHRA سیکشن-مارکر
// (<p><a HREF="...kenturet.htm">URETHRA</a> — اینکر نہیں، nav-مارکر؛ اس کے اندر P669 اینکر ہے جو
// کٹ کے ساتھ جاتا ہے) سے پہلے — آخری ربرک UNEASINESS (p668)۔ صفر clamp (صاف <dir> ساخت)، صفر
// کتابی دہرائی، 1 نئی جڑ h001 (PROSTATE GLAND)۔ OOREP برتن legacy: EMISSION erections/stool/
// urination + PAIN urination (کٹے ہوئے راستے — کتابی قطاریں ماخذی درخت پر مکمل ادویات کے ساتھ)۔
// PDF alignment: 92/92 حرف-بہ-حرف عین مطابق (verify_pdf_prostate.py — کتابی ص 667-668)۔
var _REP_KENT_PROSTATE_SOURCE_MARKER='homeoint-prostate-v1';
var _REP_KENT_PROSTATE_PAGES={first:667,last:668}, _REP_KENT_PROSTATE_COUNT=92;
function _repKentProstateSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_PROSTATE_SOURCE_MARKER;});
}
function _repHasKentProstateSourceData(data){
    return _repKentProstateSourceEntries(data).length===_REP_KENT_PROSTATE_COUNT;
}
function _repBuildKentProstateSourceTree(data){
    var entries=_repKentProstateSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_PROSTATE_COUNT) throw new Error('Expected '+_REP_KENT_PROSTATE_COUNT+' Kent PROSTATE GLAND source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent PROSTATE GLAND source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<667||page>668) throw new Error('Kent PROSTATE GLAND source row outside pages 667–668: '+e.rid);
        if(!label) throw new Error('Empty Kent PROSTATE GLAND source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent PROSTATE GLAND source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent PROSTATE GLAND source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent PROSTATE GLAND source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent PROSTATE GLAND source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent PROSTATE GLAND source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent PROSTATE GLAND sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent PROSTATE GLAND remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent PROSTATE GLAND medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
    return root;
}
// 🔑 v185: پیشاب کی نالی (URETHRA) باب کی ماخذی قطاریں (صفحات 669–680) — homeoint.org
// (parse_urethra_source.py + crosswalk_urethra.py + overlay_urethra.py)؛ پرانی مقامی قطاریں
// فائل میں محفوظ مگر ماخذی درخت سے باہر۔ باب حد: URETHRA = 669–680 (MEDI-T انتساب — kenturor.htm
// فہرست 8/8 صفحہ-اندراجات: 669/670/671/672/673/676/677/679/680)؛ آغاز kent0665.htm کے
// NAME="P669" اینکر سے (URETHRA nav-مارکر کے اندر — پروسٹیٹ باب کا اختتامی مارکر وہی تھا)؛
// اختتام kent0675 کے اندر URINE باب کی سرخی <b><p>URINE</p> (بغیر اینکر) سے پہلے —
// kent0675 میں p680 کا پورا URETHRA مواد ہے (region-of-neck + TENSION…VOLUPTUOUS، آخری ذیلی
// after : Thuj.)، اس لئے kent0680 کی URETHRA کے لیے کوئی ضرورت نہیں (پورا p680 dup ہے)۔
// فائل-دم artifacts (p671/p676 nav-بلاک سرخی-دہرائی قطاریں) حذف — دستاویزی۔
// 3 clamps (idx252 p674 waking,on d4→d3؛ idx351 p676 to-anus d4→d3؛ idx447 p678 urging,when d4→d3) — دستاویزی۔
// OOREP/kenturor راستوں کے phantom-سیگمنٹ (DISCHARGE,acrid کٹا؛ urination گھسا) — PDF x-coords
// (folio 1444/1455/1456/1457/1458) سے ثابت کہ ماخذ درخت کتاب کی عین indentation ہے؛
// متعلق OOREP برتن/یونین (PAIN 242→کتابی 23، DISCHARGE 132، PAIN burning urination 158 وغیرہ)
// legacy محفوظ — 58 legacy + 9 مبہم۔
// PDF alignment: 554/554 حرف-بہ-حرف عین مطابق، صفر فرق/drift/باقیات (verify_pdf_urethra.py — کتابی ص 669-680)۔
var _REP_KENT_URETHRA_SOURCE_MARKER='homeoint-urethra-v1';
var _REP_KENT_URETHRA_PAGES={first:669,last:680}, _REP_KENT_URETHRA_COUNT=555;
function _repKentUrethraSourceEntries(data){
    return Object.keys(data||{}).map(function(rid){return {rid:String(rid),rec:data[rid]};})
        .filter(function(e){return e.rec&&e.rec.source_canonical===_REP_KENT_URETHRA_SOURCE_MARKER;});
}
function _repHasKentUrethraSourceData(data){
    return _repKentUrethraSourceEntries(data).length===_REP_KENT_URETHRA_COUNT;
}
function _repBuildKentUrethraSourceTree(data){
    var entries=_repKentUrethraSourceEntries(data), root={children:{},order:[],remedies:{},count:0,hasRubric:false};
    if(entries.length!==_REP_KENT_URETHRA_COUNT) throw new Error('Expected '+_REP_KENT_URETHRA_COUNT+' Kent URETHRA source rows; found '+entries.length);
    entries.sort(function(a,b){return Number(a.rec.source_order)-Number(b.rec.source_order);});
    var byRid=Object.create(null);
    entries.forEach(function(e,index){
        var rec=e.rec, order=Number(rec.source_order), parentId=rec.source_parent_id;
        if(order!==index) throw new Error('Invalid Kent URETHRA source order at '+e.rid+': '+order);
        var page=Number(rec.source_page), depth=Number(rec.source_depth), label=String(rec.source_label||'');
        if(page<669||page>680) throw new Error('Kent URETHRA source row outside pages 669–680: '+e.rid);
        if(!label) throw new Error('Empty Kent URETHRA source label at '+e.rid);
        var labels=Array.isArray(rec.source_path_labels)?rec.source_path_labels.map(String):[];
        if(!labels.length||labels[labels.length-1]!==label||depth!==labels.length-1)
            throw new Error('Kent URETHRA source path/depth mismatch at '+e.rid);
        var sourcePath=String(rec.source_path||'');
        if(sourcePath!==labels.join(', ')) throw new Error('Kent URETHRA source full path mismatch at '+e.rid);
        var parent=parentId===null?root:byRid[String(parentId)];
        if(!parent) throw new Error('Missing earlier Kent URETHRA source parent '+parentId+' for '+e.rid);
        if(parentId!==null && Number(parent.sourceOrder)>=index)
            throw new Error('Kent URETHRA source parent must precede child at '+e.rid);
        var parentPath=parent===root?'':String(parent.pathTitle||'');
        var expectedPath=parentPath?parentPath+', '+label:label;
        if(expectedPath!==sourcePath) throw new Error('Kent URETHRA source parent link/path mismatch at '+e.rid);
        if(parent.children[label]) throw new Error('Duplicate Kent URETHRA sibling label '+label+' at '+e.rid);
        var remedies=rec.r;
        if(!remedies||typeof remedies!=='object'||Array.isArray(remedies))
            throw new Error('Missing Kent URETHRA remedies at '+e.rid);
        Object.keys(remedies).forEach(function(code){
            var grade=Number(remedies[code]);
            if(!code||grade<1||grade>3||Math.floor(grade)!==grade)
                throw new Error('Invalid Kent URETHRA medicine grade at '+e.rid+': '+code);
        });
        var node={
            name:label,sourceLabel:label,sourceOrder:order,sourceParentId:parentId,sourcePage:page,
            children:{},order:[],remedies:remedies,count:1,hasRubric:true,
            path:sourcePath,pathTitle:sourcePath,displayPathTitle:sourcePath,
            translationTitle:String(rec.translation_title||sourcePath),
            oorep_id:rec.oorep_id||null,rid:e.rid,sourceCanonical:true,
            display:rec.display&&typeof rec.display==='object'&&!Array.isArray(rec.display)?rec.display:null
        };
        parent.children[label]=node;
        parent.order.push(label);
        parent.count=(parent.count||0)+1;
        byRid[e.rid]=node;
    });
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
    // چکر باب کی ماخذی قطاریں الگ درخت بناتی ہیں؛ پرانی مقامی قطاریں فائل میں محفوظ رہتی ہیں۔
    if(repCurrentBook === 'kent' && repCurrentChapter === 'vertigo' && _repHasKentVertigoSourceData(data)){
        return _repBuildKentVertigoSourceTree(data);
    }
    // 🔑 v167: سر باب کی ماخذی قطاریں (صفحات 107–234) — وہی طرز جو چکر باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'head' && _repHasKentHeadSourceData(data)){
        return _repBuildKentHeadSourceTree(data);
    }
    // 🔑 v168: آنکھ باب کی ماخذی قطاریں (صفحات 235–270) — وہی طرز جو سر باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'eye' && _repHasKentEyeSourceData(data)){
        return _repBuildKentEyeSourceTree(data);
    }
    // 🔑 v169: وژن باب کی ماخذی قطاریں (صفحات 271–285) — وہی طرز جو آنکھ باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'vision' && _repHasKentVisionSourceData(data)){
        return _repBuildKentVisionSourceTree(data);
    }
    // 🔑 v170: کان باب کی ماخذی قطاریں (صفحات 285–320) — وہی طرز جو وژن باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'ear' && _repHasKentEarSourceData(data)){
        return _repBuildKentEarSourceTree(data);
    }
    // 🔑 v171: سماعت باب کی ماخذی قطاریں (صفحات 321–323) — وہی طرز جو کان باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'hearing' && _repHasKentHearingSourceData(data)){
        return _repBuildKentHearingSourceTree(data);
    }
    // 🔑 v172: ناک باب کی ماخذی قطاریں (صفحات 324–354) — وہی طرز جو سماعت باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'nose' && _repHasKentNoseSourceData(data)){
        return _repBuildKentNoseSourceTree(data);
    }
    // 🔑 v173: چہرہ باب کی ماخذی قطاریں (صفحات 355–396) — وہی طرز جو ناک باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'face' && _repHasKentFaceSourceData(data)){
        return _repBuildKentFaceSourceTree(data);
    }
    // 🔑 v174: منہ باب کی ماخذی قطاریں (صفحات 397–430) — وہی طرز جو چہرہ باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'mouth' && _repHasKentMouthSourceData(data)){
        return _repBuildKentMouthSourceTree(data);
    }
    // 🔑 v175: دانت باب کی ماخذی قطاریں (صفحات 430 نصف – 447) — وہی طرز جو منہ باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'teeth' && _repHasKentTeethSourceData(data)){
        return _repBuildKentTeethSourceTree(data);
    }
    // 🔑 v176: گلا باب کی ماخذی قطاریں (صفحات 448–470) — وہی طرز جو دانت باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'throat' && _repHasKentThroatSourceData(data)){
        return _repBuildKentThroatSourceTree(data);
    }
    // 🔑 v177: بیرونی گلا باب کی ماخذی قطاریں (صفحات 471–475) — وہی طرز جو گلا باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'external_throat' && _repHasKentExtThroatSourceData(data)){
        return _repBuildKentExtThroatSourceTree(data);
    }
    // 🔑 v178: معدہ باب کی ماخذی قطاریں (صفحات 476–540) — وہی طرز جو بیرونی گلا باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'stomach' && _repHasKentStomachSourceData(data)){
        return _repBuildKentStomachSourceTree(data);
    }
    // 🔑 v179: شکم باب کی ماخذی قطاریں (صفحات 541–605) — وہی طرز جو معدہ باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'abdomen' && _repHasKentAbdomenSourceData(data)){
        return _repBuildKentAbdomenSourceTree(data);
    }
    // 🔑 v180: مستقیم باب کی ماخذی قطاریں (صفحات 606–635) — وہی طرز جو شکم باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'rectum' && _repHasKentRectumSourceData(data)){
        return _repBuildKentRectumSourceTree(data);
    }
    // 🔑 v181: سٹول باب کی ماخذی قطاریں (صفحات 635–644) — وہی طرز جو مستقیم باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'stool' && _repHasKentStoolSourceData(data)){
        return _repBuildKentStoolSourceTree(data);
    }
    // 🔑 v182: مثانہ باب کی ماخذی قطاریں (صفحات 645–662) — وہی طرز جو سٹول باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'bladder' && _repHasKentBladderSourceData(data)){
        return _repBuildKentBladderSourceTree(data);
    }
    // 🔑 v183: گردے باب کی ماخذی قطاریں (صفحات 662–667) — وہی طرز جو مثانہ باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'kidneys' && _repHasKentKidneysSourceData(data)){
        return _repBuildKentKidneysSourceTree(data);
    }
    // 🔑 v184: پروسٹیٹ غدود باب کی ماخذی قطاریں (صفحات 667–668) — وہی طرز جو گردے باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'prostate_gland' && _repHasKentProstateSourceData(data)){
        return _repBuildKentProstateSourceTree(data);
    }
    // 🔑 v185: پیشاب کی نالی باب کی ماخذی قطاریں (صفحات 669–680) — وہی طرز جو پروسٹیٹ غدود باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'urethra' && _repHasKentUrethraSourceData(data)){
        return _repBuildKentUrethraSourceTree(data);
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
                n.children[pt]={name:pt,children:{},order:[],remedies:{},count:0,hasRubric:false,path:'',oorep_id:null,display:null};
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
                n.display=r.display&&typeof r.display==='object'&&!Array.isArray(r.display)?r.display:null;
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
    // چکر باب کی ماخذی قطاریں الگ درخت بناتی ہیں؛ پرانی مقامی قطاریں فائل میں محفوظ رہتی ہیں۔
    if(repCurrentBook === 'kent' && repCurrentChapter === 'vertigo' && _repHasKentVertigoSourceData(data)){
        return _repBuildKentVertigoSourceTree(data);
    }
    // 🔑 v167: سر باب کی ماخذی قطاریں (صفحات 107–234) — وہی طرز جو چکر باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'head' && _repHasKentHeadSourceData(data)){
        return _repBuildKentHeadSourceTree(data);
    }
    // 🔑 v168: آنکھ باب کی ماخذی قطاریں (صفحات 235–270) — وہی طرز جو سر باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'eye' && _repHasKentEyeSourceData(data)){
        return _repBuildKentEyeSourceTree(data);
    }
    // 🔑 v169: وژن باب کی ماخذی قطاریں (صفحات 271–285) — وہی طرز جو آنکھ باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'vision' && _repHasKentVisionSourceData(data)){
        return _repBuildKentVisionSourceTree(data);
    }
    // 🔑 v170: کان باب کی ماخذی قطاریں (صفحات 285–320) — وہی طرز جو وژن باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'ear' && _repHasKentEarSourceData(data)){
        return _repBuildKentEarSourceTree(data);
    }
    // 🔑 v171: سماعت باب کی ماخذی قطاریں (صفحات 321–323) — وہی طرز جو کان باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'hearing' && _repHasKentHearingSourceData(data)){
        return _repBuildKentHearingSourceTree(data);
    }
    // 🔑 v172: ناک باب کی ماخذی قطاریں (صفحات 324–354) — وہی طرز جو سماعت باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'nose' && _repHasKentNoseSourceData(data)){
        return _repBuildKentNoseSourceTree(data);
    }
    // 🔑 v173: چہرہ باب کی ماخذی قطاریں (صفحات 355–396) — وہی طرز جو ناک باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'face' && _repHasKentFaceSourceData(data)){
        return _repBuildKentFaceSourceTree(data);
    }
    // 🔑 v174: منہ باب کی ماخذی قطاریں (صفحات 397–430) — وہی طرز جو چہرہ باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'mouth' && _repHasKentMouthSourceData(data)){
        return _repBuildKentMouthSourceTree(data);
    }
    // 🔑 v175: دانت باب کی ماخذی قطاریں (صفحات 430 نصف – 447) — وہی طرز جو منہ باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'teeth' && _repHasKentTeethSourceData(data)){
        return _repBuildKentTeethSourceTree(data);
    }
    // 🔑 v176: گلا باب کی ماخذی قطاریں (صفحات 448–470) — وہی طرز جو دانت باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'throat' && _repHasKentThroatSourceData(data)){
        return _repBuildKentThroatSourceTree(data);
    }
    // 🔑 v177: بیرونی گلا باب کی ماخذی قطاریں (صفحات 471–475) — وہی طرز جو گلا باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'external_throat' && _repHasKentExtThroatSourceData(data)){
        return _repBuildKentExtThroatSourceTree(data);
    }
    // 🔑 v178: معدہ باب کی ماخذی قطاریں (صفحات 476–540) — وہی طرز جو بیرونی گلا باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'stomach' && _repHasKentStomachSourceData(data)){
        return _repBuildKentStomachSourceTree(data);
    }
    // 🔑 v179: شکم باب کی ماخذی قطاریں (صفحات 541–605) — وہی طرز جو معدہ باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'abdomen' && _repHasKentAbdomenSourceData(data)){
        return _repBuildKentAbdomenSourceTree(data);
    }
    // 🔑 v180: مستقیم باب کی ماخذی قطاریں (صفحات 606–635) — وہی طرز جو شکم باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'rectum' && _repHasKentRectumSourceData(data)){
        return _repBuildKentRectumSourceTree(data);
    }
    // 🔑 v181: سٹول باب کی ماخذی قطاریں (صفحات 635–644) — وہی طرز جو مستقیم باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'stool' && _repHasKentStoolSourceData(data)){
        return _repBuildKentStoolSourceTree(data);
    }
    // 🔑 v182: مثانہ باب کی ماخذی قطاریں (صفحات 645–662) — وہی طرز جو سٹول باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'bladder' && _repHasKentBladderSourceData(data)){
        return _repBuildKentBladderSourceTree(data);
    }
    // 🔑 v183: گردے باب کی ماخذی قطاریں (صفحات 662–667) — وہی طرز جو مثانہ باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'kidneys' && _repHasKentKidneysSourceData(data)){
        return _repBuildKentKidneysSourceTree(data);
    }
    // 🔑 v184: پروسٹیٹ غدود باب کی ماخذی قطاریں (صفحات 667–668) — وہی طرز جو گردے باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'prostate_gland' && _repHasKentProstateSourceData(data)){
        return _repBuildKentProstateSourceTree(data);
    }
    // 🔑 v185: پیشاب کی نالی باب کی ماخذی قطاریں (صفحات 669–680) — وہی طرز جو پروسٹیٹ غدود باب میں ثابت ہوا
    if(repCurrentBook === 'kent' && repCurrentChapter === 'urethra' && _repHasKentUrethraSourceData(data)){
        return _repBuildKentUrethraSourceTree(data);
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
                n.children[pt]={name:pt,children:{},order:[],remedies:{},count:0,hasRubric:false,path:'',oorep_id:null,display:null};
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
                n.display=r.display&&typeof r.display==='object'&&!Array.isArray(r.display)?r.display:null;
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

