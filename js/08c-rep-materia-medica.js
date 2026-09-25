// ==================== 📖 MATERIA MEDICA (پبلک ڈومین کتابیں) + 🤖 خودکار مسودہ + ✍ ڈاکٹر کے نوٹس (v56) ====================
// مرحلہ دوم: ریپرٹری «کہاں فرق ہے» بتاتی ہے؛ یہ ماڈیول «کیفیت» دیتا ہے — کینٹ لیکچرز، بورک، ایلن کی نوٹس، نیش لیڈرز کا اصل متن
// (mm/*.json، homeoint.org سے، پبلک ڈومین)۔ موضوع کے الفاظ سے ہر ریمیڈی کے متعلقہ جملے نکلتے ہیں، حوالے کے ساتھ۔
// 🤖 مسودہ = بہترین جملوں کا خودکار انتخاب (extractive) مع حوالہ — ڈاکٹر کی تصدیق باقی۔ ✍ نوٹس localStorage میں (bc_rep_diff_notes)،
// JSON ایکسپورٹ/امپورٹ سے گٹ ہب پر جا سکتے ہیں۔ یہ ماڈیول 08b کے بعد لوڈ ہوتا ہے اور تفریق ونڈو میں «📖 میٹیریا میڈیکا» ٹیب جوڑتا ہے۔

var REP_MM_INDEX_FILE='mm/_index.json';
var REP_MM_MAX_PER_BOOK=6;      // فی کتاب فی ریمیڈی زیادہ سے زیادہ جملے
var REP_MM_DRAFT_N=4;           // مسودے میں جملے
var repMMIndex=null;            // {books:{id:{title,author,year,file,remedies}}, avail:{abbr:[bookIds]}}
var _repMMBooks={};             // id -> book json
var _repMMLoading={};
/* 🔑 v68.1: allen_fevers (ایلن — بخار کا علاج) کو ایلن کی دوسری کتابوں کے ساتھ اوپر رکھا — 7 نشانوں کی قطار میں نظر آنے کے لیے */
var repMMBookOrder=['kent_lectures','boericke','clarke_dictionary','hering_guiding','hering_condensed','allen_keynotes','allen_fevers','nash_leaders','farrington_clinical','lippe_keynotes','hutchison_700','guernsey_keynotes','allen_primer','boger_synoptic','boenninghausen_char','dewey_essentials','allen_clinical_hints','allen_nosodes','lippe_textbook','kent_new_remedies','hahnemann_chronic'];
var REP_MM_SHORT={kent_lectures:'Kent',boericke:'Boericke',allen_keynotes:'Allen',nash_leaders:'Nash',lippe_keynotes:'Lippe',hutchison_700:'Hutchison',guernsey_keynotes:'Guernsey',allen_primer:'T.F.Allen',boger_synoptic:'Boger',boenninghausen_char:'Boenn.',dewey_essentials:'Dewey',allen_clinical_hints:'Clin.Hints',clarke_dictionary:'Clarke',farrington_clinical:'Farrington',hering_condensed:'Hering C.',hering_guiding:'Hering GS',allen_nosodes:'Allen Nos.',lippe_textbook:'Lippe TB',kent_new_remedies:'Kent New',allen_fevers:'Allen Fevers',hahnemann_chronic:'Hahn. CD'};
var REP_MM_COLOR={kent_lectures:'#1a5276',boericke:'#117a65',allen_keynotes:'#7d6608',nash_leaders:'#6c3483',lippe_keynotes:'#a04000',hutchison_700:'#7b241c',guernsey_keynotes:'#1f618d',allen_primer:'#4d5656',boger_synoptic:'#0e6655',boenninghausen_char:'#784212',dewey_essentials:'#154360',allen_clinical_hints:'#9a7d0a',clarke_dictionary:'#922b21',farrington_clinical:'#1b4f72',hering_condensed:'#4a235a',hering_guiding:'#6e2c00',allen_nosodes:'#145a32',lippe_textbook:'#873600',kent_new_remedies:'#1a5276',allen_fevers:'#a93226',hahnemann_chronic:'#4a235a'};

// ---------- لوڈنگ ----------
function repMMEnsureIndex(cb){
    if(repMMIndex){ cb(repMMIndex); return; }
    if(_repMMLoading.__index){ _repMMLoading.__index.push(cb); return; }
    _repMMLoading.__index=[cb];
    fetch(REP_MM_INDEX_FILE+'?v=2').then(function(r){ return r.json(); }).then(function(d){ repMMIndex=d||{books:{},avail:{}}; if(window.PS&&PS.hookMMIndex)PS.hookMMIndex(repMMIndex); })
        .catch(function(e){ console.warn('MM index load fail',e); repMMIndex={books:{},avail:{}}; })
        .then(function(){ var q=_repMMLoading.__index; delete _repMMLoading.__index; (q||[]).forEach(function(f){ f(repMMIndex); }); });
}
function repMMLoadBook(id,cb){
    if(_repMMBooks[id]){ cb(_repMMBooks[id]); return; }
    if(_repMMLoading[id]){ _repMMLoading[id].push(cb); return; }
    _repMMLoading[id]=[cb];
    repMMEnsureIndex(function(ix){
        var meta=ix.books&&ix.books[id]; var file=(meta&&meta.file)||('mm/'+id+'.json');
        fetch(file+'?v=2').then(function(r){ return r.json(); }).then(function(d){ if(window.PS&&PS.applyMMBook)d=PS.applyMMBook(id,d); _repMMBooks[id]=d; })
            .catch(function(e){ console.warn('MM book load fail',id,e); _repMMBooks[id]=(window.PS&&PS.applyMMBook)?PS.applyMMBook(id,{id:id,remedies:{}}):{id:id,remedies:{}}; })
            .then(function(){ var q=_repMMLoading[id]; delete _repMMLoading[id]; (q||[]).forEach(function(f){ f(_repMMBooks[id]); }); });
    });
}
function repMMPublicIds(){ var ids=repMMIndex?Object.keys(repMMIndex.books||{}):[]; return repMMBookOrder.filter(function(b){ return ids.indexOf(b)!==-1; }).concat(ids.filter(function(b){ return repMMBookOrder.indexOf(b)===-1; })); }
function repMMBookIds(){ return repMMPublicIds().concat(repPrivIds()); }
function repMMEnsureAll(cb,onProgress){
    repPrivPrefLoad(); repNotesSeed(); repNotesShared();
    repPrivLoadAll(function(){
        repMMEnsureIndex(function(){
            var ids=repMMPublicIds(); if(!ids.length){ cb({}); return; }
            var pending=ids.length; ids.forEach(function(id){ repMMLoadBook(id,function(){ if(onProgress)onProgress(id,ids.length-pending+1,ids.length); if(--pending===0) cb(_repMMBooks); }); });
        });
    });
}
function repMMLoadedCount(){ return repMMPublicIds().filter(function(id){ return !!_repMMBooks[id]; }).length; }
function repMMLoaded(){ return !!repMMIndex && _repPrivLoaded && repMMPublicIds().every(function(id){ return !!_repMMBooks[id]; }); }
function repMMAvail(abbr){
    var pub=(repMMIndex&&repMMIndex.avail&&repMMIndex.avail[abbr])||[]; var order=repMMPublicIds();
    pub=pub.slice().sort(function(a,b){ var ia=order.indexOf(a),ib=order.indexOf(b); return (ia<0?999:ia)-(ib<0?999:ib); });   // کتابوں کی مقررہ ترتیب (کینٹ پہلے)
    return pub.concat(repPrivAvail(abbr));
}
function repMMEntry(id,abbr){ if(repPrivIs(id)) return repPrivEntry(id,abbr); var b=_repMMBooks[id]; return (b&&b.remedies&&b.remedies[abbr])||null; }
function repMMBookLabel(id){ if(repPrivIs(id)){ var pb=_repPrivMem[id]; return pb?((pb.author?pb.author+' — ':'')+pb.title+(pb.year?' ('+pb.year+')':'')+' 🔒'):id; } var m=repMMIndex&&repMMIndex.books&&repMMIndex.books[id]; return m?(m.author.split(' ').pop()+' — '+m.title+' ('+m.year+')'):id; }
function repMMShort(id){ if(REP_MM_SHORT[id]) return REP_MM_SHORT[id]; var pb=_repPrivMem[id]; if(pb){
        var a=(pb.author||'').split(/[ &,]+/).filter(Boolean);
        // 🔑 v68.2: ایک مصنف کی کئی نجی کتابیں — صرف خاندانی نام لکھنے سے سب ایک جیسی دکھتی تھیں، اب کتاب کا اپنا نام
        var t=String(pb.title||'').replace(/^(the|a|an)\s+/i,'').trim();
        if(t){ if(t.length>26) t=t.substring(0,26).replace(/[\s,;:&-]+$/,'')+'…'; return t; }
        return (a.length?a[a.length-1]:'').substring(0,12); } return id; }
function repMMBadge(id){ var priv=repPrivIs(id); return '<span class="rep-mm-badge'+(priv?' priv':'')+'" style="background:'+(priv?'#5b2c6f':(REP_MM_COLOR[id]||'#555'))+'" title="'+_repAttr(repMMBookLabel(id))+'">'+(priv?'🔒 ':'')+escapeHtml(repMMShort(id))+'</span>'; }

// ---------- 🔒 نجی کتابیں (IndexedDB — صرف اسی آلے پر؛ گٹ ہب پر کبھی نہیں) ----------
// tools/qdrant_to_private_books.py سے بنی JSON فائلیں: {id,title,author,year,private:true,format:'pages',pages:[{p,t}]} یا {books:[...]}
// ریمیڈی وار ملاپ: وہ صفحات جن میں ریمیڈی کا نام/مخفف آتا ہے؛ موضوع کے جملے انہی صفحات سے۔
var REP_PRIV_DB='bc_private_books', REP_PRIV_STORE='books';
var _repPrivMem={}, _repPrivLoaded=false, _repPrivAvailCache={}, _repPrivEntryCache={};
var REP_PRIV_PREF_KEY='bc_rep_priv_prefs', _repPrivPrefs={hideEmpty:false,inDraft:true};   // 🔑 v68.3: «جس نجی کتاب میں اِس ریمیڈی کا کچھ نہ ہو» چھپانے کا رجحان (اِسی آلے پر)
function repPrivPrefLoad(){ try{ var d=JSON.parse(localStorage.getItem(REP_PRIV_PREF_KEY)||'{}'); _repPrivPrefs.hideEmpty=!!d.hideEmpty; if(typeof d.inDraft==='boolean')_repPrivPrefs.inDraft=d.inDraft; }catch(e){} }
function repPrivPrefSave(){ try{ localStorage.setItem(REP_PRIV_PREF_KEY,JSON.stringify(_repPrivPrefs)); }catch(e){} }
function repPrivDraftToggle(){ _repPrivPrefs.inDraft=!_repPrivPrefs.inDraft; repPrivPrefSave(); if(typeof repDiffRenderBody==='function') repDiffRenderBody(); }
function repPrivHideEmptyToggle(){ _repPrivPrefs.hideEmpty=!_repPrivPrefs.hideEmpty; repPrivPrefSave();
    if(typeof repMMView!=='undefined'&&repMMView.abbr) repMMRender();
    if(typeof repDiffTab!=='undefined'&&repDiffTab==='mm'&&typeof repDiffRenderBody==='function') repDiffRenderBody(); }
function repPrivIs(id){ return !!_repPrivMem[id]; }
function repPrivIds(){ return Object.keys(_repPrivMem).sort(); }
function repPrivDB(cb){
    try{ if(typeof indexedDB==='undefined'||!indexedDB){ cb(null); return; }
        var req=indexedDB.open(REP_PRIV_DB,1);
        req.onupgradeneeded=function(e){ var db=e.target.result; if(!db.objectStoreNames.contains(REP_PRIV_STORE)) db.createObjectStore(REP_PRIV_STORE,{keyPath:'id'}); };
        req.onsuccess=function(e){ cb(e.target.result); }; req.onerror=function(){ cb(null); };
    }catch(e){ cb(null); }
}
function repPrivLoadAll(cb){
    if(_repPrivLoaded){ cb(_repPrivMem); return; }
    repPrivDB(function(db){
        if(!db){ _repPrivLoaded=true; cb(_repPrivMem); return; }
        try{ var tx=db.transaction(REP_PRIV_STORE,'readonly'); var rq=tx.objectStore(REP_PRIV_STORE).getAll();
            rq.onsuccess=function(){ (rq.result||[]).forEach(function(b){ if(b&&b.id) _repPrivMem[b.id]=b; }); _repPrivLoaded=true; cb(_repPrivMem); };
            rq.onerror=function(){ _repPrivLoaded=true; cb(_repPrivMem); };
        }catch(e){ _repPrivLoaded=true; cb(_repPrivMem); }
    });
}
function repPrivSave(book,cb){
    _repPrivMem[book.id]=book; _repPrivAvailCache={}; _repPrivEntryCache={};
    repPrivDB(function(db){ if(!db){ cb&&cb(false); return; } try{ var tx=db.transaction(REP_PRIV_STORE,'readwrite'); tx.objectStore(REP_PRIV_STORE).put(book); tx.oncomplete=function(){ cb&&cb(true); }; tx.onerror=function(){ cb&&cb(false); }; }catch(e){ cb&&cb(false); } });
}
function repPrivDelete(id){
    delete _repPrivMem[id]; _repPrivAvailCache={}; _repPrivEntryCache={};
    repPrivDB(function(db){ if(!db)return; try{ var tx=db.transaction(REP_PRIV_STORE,'readwrite'); tx.objectStore(REP_PRIV_STORE)['delete'](id); }catch(e){} });
    showToast('🗑 '+id); if(typeof repDiffRenderBody==='function') repDiffRenderBody();
}
function repPrivNormalize(b){
    if(!b||typeof b!=='object'||!Array.isArray(b.pages)) return null;
    var pages=b.pages.filter(function(x){ return x&&typeof x.t==='string'&&x.t.trim(); }).map(function(x){ return {p:String(x.p==null?'':x.p),t:String(x.t)}; });
    if(!pages.length) return null;
    var id=String(b.id||('priv_'+String(b.title||'book').toLowerCase().replace(/[^a-z0-9]+/g,'_').substring(0,40)));
    if(id.indexOf('priv_')!==0) id='priv_'+id;
    return {id:id,title:String(b.title||id),author:String(b.author||''),year:b.year||0,private:true,format:'pages',source:String(b.source||''),pages:pages,imported:Date.now()};
}
function repPrivImportText(txt,cb){
    var d; try{ d=JSON.parse(txt); }catch(e){ showToast('⚠ '+repLangText({ur:'یہ JSON فائل نہیں',en:'Not a JSON file',roman:'JSON nahi'})); cb&&cb(0); return; }
    if(!repLooksLikePrivateBooks(d)&&repLooksLikeNotes(d)){ showToast('✍ '+repLangText({ur:'یہ نوٹس کی فائل ہے — نوٹس میں امپورٹ کر رہا ہوں',en:'This is a notes file — importing as notes',roman:'Ye notes file hai'})); repNotesImportText(txt); if(typeof repDiffRenderBody==='function') repDiffRenderBody(); cb&&cb(0); return; }
    var list=Array.isArray(d)?d:(d&&Array.isArray(d.books)?d.books:[d]); var books=list.map(repPrivNormalize).filter(Boolean);
    if(!books.length){ showToast(repLangText({ur:'⚠ فائل میں نجی کتاب کا فارمیٹ نہیں (pages چاہیے)',en:'⚠ Not a private-book file (needs pages)',roman:'⚠ Format ghalat'})); cb&&cb(0); return; }
    var pending=books.length, okN=0;
    books.forEach(function(b){ repPrivSave(b,function(){ okN++; if(--pending===0){ showToast('🔒 '+repLangText({ur:okN+' نجی کتابیں امپورٹ — صرف اس آلے پر',en:okN+' private books imported — this device only',roman:okN+' private books import'})); if(typeof repDiffRenderBody==='function') repDiffRenderBody(); cb&&cb(okN); } }); });
}
function repPrivImportFile(inp){ var f=inp&&inp.files&&inp.files[0]; if(!f)return; showToast('⏳ '+repLangText({ur:'فائل پڑھی جا رہی ہے ('+Math.round(f.size/1e6)+' ایم بی)…',en:'Reading file ('+Math.round(f.size/1e6)+' MB)…',roman:'File parhi ja rahi hai…'})); var r=new FileReader(); r.onload=function(){ repPrivImportText(String(r.result||'')); }; r.onerror=function(){ showToast('⚠ '+repLangText({ur:'فائل پڑھی نہ جا سکی',en:'Could not read the file',roman:'File parhi na ja saki'})); }; r.readAsText(f); inp.value=''; }
// ریمیڈی کا نام/مخفف پہچاننے والا ریجیکس
function repPrivRemedyRegex(abbr){
    var name=repRemedyTitle(abbr).replace(/^.*= /,''); var parts=name.split(/\s+/).filter(Boolean); var pats=[];
    function esc(x){ return x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
    if(parts.length>=2) pats.push('\\b'+esc(parts[0])+'\\s+'+esc(parts[1].substring(0,Math.min(4,parts[1].length)))+'\\w*');
    if(parts.length>=2&&parts[0].length>=4) pats.push('\\b'+esc(parts[0])+'\\b');   // v68.4: کتاب اکثر صرف «Hyoscyamus» لکھتی ہے، «Hyoscyamus niger» نہیں
    else if(parts.length===1&&parts[0].length>=4) pats.push('\\b'+esc(parts[0])+'\\b');
    var ab=String(abbr||'').split('-'); if(ab[0]&&ab[0].length>=3) pats.push('\\b'+ab.map(esc).join('[-.\\s]?\\s?')+'\\b');
    try{ return pats.length?new RegExp(pats.join('|'),'i'):null; }catch(e){ return null; }
}
function repPrivPagesFor(id,abbr){
    var key=id+'|'+abbr; if(_repPrivEntryCache[key]) return _repPrivEntryCache[key];
    var b=_repPrivMem[id]; var re=repPrivRemedyRegex(abbr); var out=[];
    if(b&&re){ for(var i=0;i<b.pages.length&&out.length<80;i++){ if(re.test(b.pages[i].t)) out.push(b.pages[i]); } }
    _repPrivEntryCache[key]=out; return out;
}
function repPrivAvail(abbr){
    if(_repPrivAvailCache[abbr]) return _repPrivAvailCache[abbr];
    var ids=repPrivIds().filter(function(id){ return repPrivPagesFor(id,abbr).length>0; }); _repPrivAvailCache[abbr]=ids; return ids;
}
function repPrivEntry(id,abbr){
    var pages=repPrivPagesFor(id,abbr); var b=_repPrivMem[id]; if(!b||!pages.length) return null;
    return {name:repRemedyTitle(abbr).replace(/^.*= /,''),common:'',src:b.source||'',sections:pages.map(function(pg){ return {h:'p. '+pg.p,p:[pg.t]}; })};
}
function repPrivSearchPages(id,re,cap){ var b=_repPrivMem[id]; var out=[]; if(!b||!re) return out; for(var i=0;i<b.pages.length&&out.length<(cap||80);i++){ if(re.test(b.pages[i].t)) out.push(b.pages[i]); } return out; }
function repPrivPanelHtml(){
    var L=repLangText, ids=repPrivIds();
    var _tgl='';   // v68.5: نجی کتابیں خودکار مسودے میں شامل رکھنے کا سوئچ
    if(ids.length){ var _tl=L({ur:'خودکار مسودے میں نجی کتابوں کے جملے بھی لیں',en:'let private books feed the auto draft',roman:'Musawwade mein shamil'});
        _tgl='<label class="rc-btn" style="cursor:pointer" title="'+_repAttr(_tl)+'"><input type="checkbox" '+(_repPrivPrefs.inDraft?'checked':'')+' onchange="repPrivDraftToggle()"> 🤖</label>'; }

    var h='<div class="rep-mm-priv"><div class="rep-mm-privhead">🔒 '+L({ur:'نجی کتابیں — صرف اس آلے پر (IndexedDB)، گٹ ہب پر کبھی نہیں',en:'Private books — this device only (IndexedDB), never on GitHub',roman:'Private books — sirf is device par'})+' <span class="cnt">('+ids.length+')</span>'
        +'<label class="rc-btn primary" style="cursor:pointer;margin-inline-start:auto">📥 '+L({ur:'نجی کتابیں امپورٹ (JSON)',en:'Import private books (JSON)',roman:'Private books import (JSON)'})+'<input type="file" accept=".json,application/json" style="display:none" onchange="repPrivImportFile(this)"></label>'+_tgl+'</div>';
    if(!ids.length) h+='<div class="rep-tool-note">'+L({ur:'کیوڈرینٹ بیک اپ سے بنی فائل (tools/qdrant_to_private_books.py → private_books_all.json یا ایک کتاب کی فائل) امپورٹ کریں۔',en:'Import the file made by tools/qdrant_to_private_books.py (private_books_all.json or a single book).',roman:'qdrant_to_private_books.py se bani file import karein.'})+'</div>';
    else { h+='<div class="rep-mm-privlist">'; ids.forEach(function(id){ var b=_repPrivMem[id]; h+='<div class="rep-mm-privrow" title="'+_repAttr(b.title+' — '+(b.author||''))+'">'+repMMBadge(id)+' <span class="t">'+escapeHtml(b.title)+'</span> <small>'+b.pages.length+'p</small><button class="rst-chip-x" onclick="repPrivDelete(\''+_repJs(id)+'\')" title="'+L({ur:'اس آلے سے ہٹائیں',en:'Remove from this device',roman:'Hataein'})+'">✕</button></div>'; }); h+='</div>'; }
    return h+'</div>';
}

// ---------- متن ----------
function repMMFmt(t){
    var h=escapeHtml(String(t||''));
    h=h.replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
    h=h.replace(/(^|[^A-Za-z0-9])_([^_\n]{1,240}?)_(?=[^A-Za-z0-9]|$)/g,'$1<i>$2</i>');
    return h.replace(/\n/g,'<br>');
}
function repMMPlain(t){ return String(t||'').replace(/\*\*/g,'').replace(/(^|[^A-Za-z0-9])_([^_\n]{1,240}?)_(?=[^A-Za-z0-9]|$)/g,'$1$2'); }
function repMMSentences(text){
    var out=[], re=/[^.;!?]+(?:[.;!?]+["”')\]]*|$)/g, m, s=String(text||'');
    while((m=re.exec(s))){ var x=m[0].trim(); if(x.length>2) out.push(x); if(m.index===re.lastIndex) re.lastIndex++; }
    return out;
}
function repMMThemeRegex(words){ return (typeof repDiffThemeRegex==='function')?repDiffThemeRegex(words):null; }
// 🧹 کچرا جملے: فہرست/انڈیکس کے صفحات (بہت سے نمبر)، بڑے حروف کی قطاریں، بہت لمبی فہرستیں
function repMMIsJunk(plain){
    var t=String(plain||''); if(t.length<12||t.length>420) return true;
    var nums=(t.match(/\d+/g)||[]).length; if(nums>=5) return true;
    if(/\b(contents|index of|table of|chapter\s+\d|see page|pp?\.\s*\d|\$\s*\$)\b/i.test(t)) return true;
    var words=t.split(/\s+/), caps=words.filter(function(w){ return w.length>3&&/^[A-Z][A-Z\-]+$/.test(w); }).length; if(words.length>=6&&caps/words.length>0.35) return true;
    var letters=(t.match(/[A-Za-z]/g)||[]).length; if(letters<t.length*0.55) return true;
    return false;
}
// سیکشن کی مناسبت: ذہنی ربرک کے لیے Mind/Mental سیکشن اوپر، جسمانی سیکشن نیچے؛ دوسرے ابواب کے لیے اسی نام کا سیکشن اوپر
var REP_MM_GENERIC_SEC=/^(|characteristics|clinical|relations|synopsis|generalities|modalities|region|worse|better|causation|keynotes?)$/i;
function repMMSecBoost(h,chHint){
    h=String(h||''); var ch=String(chHint||'').toLowerCase();
    if(/^p\. /.test(h)) return 0;                                     // نجی کتاب کے صفحات — معلوم نہیں
    if(REP_MM_GENERIC_SEC.test(h)) return 0.5;
    if(ch==='mind'||ch==='gemuet'){ if(/mind|mental|disposition|sensorium|psych|intellect/i.test(h)) return 3; return -2.5; }
    if(ch){ var key=ch.replace(/_/g,' ').split(' ')[0]; if(key.length>=3&&h.toLowerCase().indexOf(key.substring(0,4))!==-1) return 3; if(/mind|mental/i.test(h)) return -1; return -1.5; }
    return 0;
}
// ریمیڈی کے تمام جملے جو موضوع سے ملتے ہیں — [{book,section,text,score}]
function repMMMatches(abbr,re,perBook,chHint){
    var out=[]; if(!re) return out;
    if(chHint===undefined&&typeof repDiffCtx!=='undefined'&&repDiffCtx) chHint=repDiffCtx.ch;
    repMMBookIds().forEach(function(id){
        if(!repPrivIs(id)&&!_repMMBooks[id]) return;       // ابھی لوڈ نہیں ہوئی
        var priv=repPrivIs(id);
        var e=repMMEntry(id,abbr); if(!e) return; var found=[], seen={};
        (e.sections||[]).forEach(function(sec){
            var boost=repMMSecBoost(sec.h,chHint);
            (sec.p||[]).forEach(function(p,pi){
                repMMSentences(p).forEach(function(sn){
                    var plain=repMMPlain(sn); if(repMMIsJunk(plain)) return;
                    var hits=(plain.match(new RegExp(re.source,'gi'))||[]).length; if(!hits) return;
                    var key=plain.toLowerCase().replace(/\W+/g,' ').trim().substring(0,120); if(seen[key]) return; seen[key]=1;
                    var bold=(sn.match(/\*\*/g)||[]).length/2, ital=(sn.match(/_/g)||[]).length/2;
                    // v68.5: نجی کتاب کے صفحات بھی مقابلے میں شامل — صرف بہت لمبے پیراگراف (نوٹ کے لیے ناخوانا) کٹتے ہیں
                    var score=Math.min(hits,3)*2+bold*2+ital*1+boost+(plain.length<220?0.5:0)+(priv?0.15:0);
                    if(priv&&plain.length>900) return;
                    found.push({book:id,section:sec.h||'',text:sn,score:score,pi:pi});
                });
            });
        });
        found.sort(function(a,b){ return (b.score-a.score)||(a.pi-b.pi); });
        out=out.concat(found.slice(0,perBook||REP_MM_MAX_PER_BOOK));   // v68.5: نجی کتابوں پر الگ سے تین کی حد نہیں
    });
    return out;
}
function repMMHighlight(html,re){ if(!re) return html; try{ return html.replace(new RegExp('('+re.source+')(?![^<]*>)','gi'),'<mark>$1</mark>'); }catch(e){ return html; } }
function repMMRef(m){ return '['+repMMShort(m.book)+(m.section?' § '+m.section:'')+']'; }
// 🤖 خودکار مسودہ (extractive): بہترین جملے، فی کتاب زیادہ سے زیادہ 2، مع حوالہ
function repMMDraft(abbr,re){
    var ms=repMMMatches(abbr,re,3).slice().sort(function(a,b){ return b.score-a.score; });
    var per={},pick=[];
    ms.forEach(function(m){ if(m.score<2) return; if(!_repPrivPrefs.inDraft&&repPrivIs(m.book)) return;   // v68.5: پسند کے مطابق نجی کتابیں مسودے میں بھی
    var cap=2; per[m.book]=(per[m.book]||0); if(per[m.book]<cap&&pick.length<REP_MM_DRAFT_N){ per[m.book]++; pick.push(m); } });
    return pick;
}
function repMMDraftText(abbr,re){
    var pick=repMMDraft(abbr,re); if(!pick.length) return '';
    return pick.map(function(m){ return '• '+repMMPlain(m.text).replace(/\s+/g,' ').trim()+' '+repMMRef(m); }).join('\n');
}

// ---------- ✍ ڈاکٹر کے نوٹس (مرحلہ سوم کا بیج) ----------
var REP_NOTES_KEY='bc_rep_diff_notes';
var _repNotesStore=null;
function repNotesLoad(){ if(_repNotesStore) return _repNotesStore; try{ _repNotesStore=JSON.parse(localStorage.getItem(REP_NOTES_KEY)||'{}')||{}; }catch(e){ _repNotesStore={}; } return _repNotesStore; }
function repNotesSave(){ try{ localStorage.setItem(REP_NOTES_KEY,JSON.stringify(_repNotesStore||{})); }catch(e){} }
function repNoteKey(ctx,abbr){ return (ctx?(ctx.book+'|'+ctx.ch+'|'+ctx.rid):'general')+'|'+abbr; }
function repNoteGet(ctx,abbr){ return repNotesLoad()[repNoteKey(ctx,abbr)]||null; }
function repNoteSet(ctx,abbr,text,status){
    var st=repNotesLoad(); var k=repNoteKey(ctx,abbr); text=String(text||'').trim();
    if(!text){ delete st[k]; } else { st[k]={text:text,status:status||'draft',ts:Date.now(),rubric:ctx?ctx.full:'',book:ctx?ctx.book:'',ch:ctx?ctx.ch:'',rid:ctx?ctx.rid:'',abbr:abbr}; }
    repNotesSave(); return st[k]||null;
}
function repNotesCount(){ var st=repNotesLoad(),n=0,a=0; Object.keys(st).forEach(function(k){ n++; if(st[k].status==='approved')a++; }); return {total:n,approved:a}; }
function repNotesExport(){
    var st=repNotesLoad(); var data=JSON.stringify({exported:new Date().toISOString(),count:Object.keys(st).length,notes:st},null,1);
    try{ var blob=new Blob([data],{type:'application/json'}); var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='differentiation_notes.json'; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },500); showToast('📤 '+repLangText({ur:Object.keys(st).length+' نوٹس ایکسپورٹ',en:Object.keys(st).length+' notes exported',roman:Object.keys(st).length+' notes export'})); }
    catch(e){ if(navigator.clipboard) navigator.clipboard.writeText(data); showToast('📋 JSON copied'); }
}
function repLooksLikePrivateBooks(d){ if(!d||typeof d!=='object') return false; if(Array.isArray(d.pages)) return true; if(Array.isArray(d.books)&&d.books.some(function(b){ return b&&Array.isArray(b.pages); })) return true; if(Array.isArray(d)&&d.some(function(b){ return b&&Array.isArray(b.pages); })) return true; return false; }
function repLooksLikeNotes(d){ if(!d||typeof d!=='object') return false; var notes=d.notes||d; return Object.keys(notes).some(function(k){ return notes[k]&&typeof notes[k]==='object'&&typeof notes[k].text==='string'; }); }
function repNotesImportText(txt){
    var d; try{ d=JSON.parse(txt); }catch(e){ showToast('⚠ '+repLangText({ur:'یہ JSON فائل نہیں',en:'Not a JSON file',roman:'JSON nahi'})); return 0; }
    if(repLooksLikePrivateBooks(d)){ showToast('🔒 '+repLangText({ur:'یہ نجی کتابوں کی فائل ہے — نجی کتابوں میں امپورٹ کر رہا ہوں',en:'This is a private-books file — importing as private books',roman:'Ye private books file hai'})); repPrivImportText(txt); return -1; }
    if(!repLooksLikeNotes(d)){ showToast('⚠ '+repLangText({ur:'اس فائل میں نوٹس نہیں (differentiation_notes.json چاہیے)',en:'No notes in this file (expected differentiation_notes.json)',roman:'Is file mein notes nahi'})); return 0; }
    var notes=d.notes||d, st=repNotesLoad(), n=0; Object.keys(notes).forEach(function(k){ if(notes[k]&&notes[k].text){ st[k]=notes[k]; n++; } }); repNotesSave();
    showToast('📥 '+repLangText({ur:n+' نوٹس امپورٹ ہوئے',en:n+' notes imported',roman:n+' notes import'})); return n;
}
// 🌱 بیج مسودے (mm/drafts_seed.json) — پہلی بار خودکار ضم؛ موجودہ نوٹس کبھی اوور رائٹ نہیں ہوتے
function repNotesSeed(cb){
    var flag='bc_rep_notes_seed_v'; var ver='2'; try{ if(localStorage.getItem(flag)===ver){ if(cb)cb(0); return; } }catch(e){}
    fetch('mm/drafts_seed.json?v='+ver).then(function(r){ return r.json(); }).then(function(d){
        var st=repNotesLoad(), n=0; Object.keys((d&&d.notes)||{}).forEach(function(k){ if(!st[k]){ st[k]=d.notes[k]; n++; } });
        repNotesSave(); try{ localStorage.setItem(flag,ver); }catch(e){}
        if(n) showToast('🌱 '+repLangText({ur:n+' بیج مسودے شامل (تصدیق باقی)',en:n+' seed drafts added (unverified)',roman:n+' seed drafts'}));
        if(cb)cb(n);
    }).catch(function(){ if(cb)cb(0); });
}
// 🌐 مشترکہ نوٹس (mm/notes_shared.json — ڈاکٹر کے منظور شدہ نوٹس جو repo میں کمٹ کیے گئے) — ہر سیشن ایک بار ضم؛ مقامی نیا ہو تو مقامی جیتتا ہے
var _repNotesSharedDone=false;
function repNotesShared(cb){
    if(_repNotesSharedDone){ if(cb)cb(0); return; } _repNotesSharedDone=true;
    fetch('mm/notes_shared.json?v='+Date.now()).then(function(r){ return r.ok?r.json():null; }).then(function(d){
        if(!d||!d.notes){ if(cb)cb(0); return; }
        var st=repNotesLoad(), n=0;
        Object.keys(d.notes).forEach(function(k){ var inc=d.notes[k]; if(!inc||!inc.text) return; var cur=st[k]; if(!cur||((inc.ts||0)>(cur.ts||0)&&cur.status!=='approved')||(inc.status==='approved'&&cur.status!=='approved'&&(inc.ts||0)>=(cur.ts||0))){ st[k]=inc; n++; } });
        if(n){ repNotesSave(); showToast('🌐 '+repLangText({ur:n+' مشترکہ نوٹس ضم',en:n+' shared notes merged',roman:n+' shared notes merged'})); }
        if(cb)cb(n);
    }).catch(function(){ if(cb)cb(0); });
}
// ربرک صفحے کے لیے: اس ربرک کے تمام نوٹس (منظور شدہ پہلے)
function repNotesForRubric(book,ch,rid){
    var st=repNotesLoad(), pre=book+'|'+ch+'|'+rid+'|', out=[];
    Object.keys(st).forEach(function(k){ if(k.indexOf(pre)===0){ var n=st[k]; out.push({abbr:n.abbr||k.substring(pre.length),note:n}); } });
    out.sort(function(a,b){ return ((b.note.status==='approved')-(a.note.status==='approved'))||((b.note.ts||0)-(a.note.ts||0)); });
    return out;
}
function repNoteMark(book,ch,rid,abbr){ var n=repNotesLoad()[book+'|'+ch+'|'+rid+'|'+abbr]; return n?(n.status==='approved'?'✔':'✎'):''; }
// ربرک صفحے کا سیکشن «✍ تفریقی نوٹس»
function repRubricNotesHtml(book,ch,rid,rems){
    var L=repLangText, list=repNotesForRubric(book,ch,rid); if(!list.length) return '';
    var h='<div class="rpd-sec-head">✍ '+L({ur:'تفریقی نوٹس',en:'DIFFERENTIATION NOTES',roman:'TAFREEQI NOTES'})+' <span class="cnt">('+list.length+')</span>'
        +' <button class="rst-link" onclick="repDiffOpenForRubric();setTimeout(function(){repDiffSetTab(\'mm\');},60)" title="'+L({ur:'نوٹس کی ترمیم/منظوری تفریق ونڈو کے 📖 ٹیب میں',en:'Edit/approve notes in the 📖 tab of the differentiation window',roman:'📖 tab mein tarmeem'})+'">✎ '+L({ur:'ترمیم',en:'edit',roman:'tarmeem'})+'</button></div>';
    h+='<div class="rep-notes-list">';
    list.forEach(function(x){ var n=x.note, g=rems?repDiffGradeSafe(rems[x.abbr]):0;
        h+='<div class="rep-note-card'+(n.status==='approved'?' ok':'')+'"><div class="rep-note-head"><span class="rep-remedy-tag g'+(g||1)+'" title="'+_repAttr(repRemedyTitle(x.abbr))+'" onclick="copyRemedyToPrescription(\''+_repJs(x.abbr)+'\')">'+escapeHtml(x.abbr)+'</span>'
            +'<span class="rep-mm-status '+(n.status||'draft')+'">'+(n.status==='approved'?'✔ '+L({ur:'منظور',en:'approved',roman:'manzoor'}):'✎ '+L({ur:'مسودہ — تصدیق باقی',en:'draft — unverified',roman:'draft'}))+'</span>'
            +(n.src?'<small class="rep-note-src">'+escapeHtml(n.src)+'</small>':'')+'</div>'
            +'<div class="rep-note-text" dir="auto">'+escapeHtml(n.ur||n.text||'').replace(/\n/g,'<br>')+(n.ur&&n.en?'<div class="rep-note-en" dir="ltr">'+escapeHtml(n.en)+'</div>':'')+'</div></div>'; });
    h+='</div>';
    return h;
}
function repDiffGradeSafe(g){ g=g||0; return g>=3?3:(g===2?2:(g>0?1:0)); }
function repNotesImportFile(inp){ var f=inp&&inp.files&&inp.files[0]; if(!f)return; var r=new FileReader(); r.onload=function(){ repNotesImportText(String(r.result||'')); if(typeof repDiffRenderBody==='function')repDiffRenderBody(); }; r.readAsText(f); }
function repNoteEditorHtml(ctx,abbr,draft){
    var L=repLangText, n=repNoteGet(ctx,abbr), id='repNote_'+abbr.replace(/[^a-z0-9]/gi,'_');
    var h='<div class="rep-mm-note'+(n&&n.status==='approved'?' ok':'')+'">';
    h+='<div class="rep-mm-notehead">✍ '+L({ur:'ڈاکٹر کا تفریقی نوٹ',en:'Doctor\'s differentiation note',roman:'Doctor ka note'})+(ctx?' — <span dir="ltr">'+escapeHtml(_repTruncPath(ctx.full||'',40))+'</span>':'')
        +(n?'<span class="rep-mm-status '+n.status+'">'+(n.status==='approved'?'✔ '+L({ur:'منظور',en:'approved',roman:'manzoor'}):'✎ '+L({ur:'مسودہ',en:'draft',roman:'draft'}))+'</span>':'')+'</div>';
    h+='<textarea id="'+id+'" rows="4" dir="auto" placeholder="'+L({ur:'اردو/انگریزی میں 2–4 سطریں — یہ ریمیڈی اس ربرک پر باقیوں سے کیسے الگ ہے؟',en:'2–4 lines — how does this remedy differ from the others in this rubric?',roman:'2–4 satrein'})+'">'+escapeHtml(n?n.text:'')+'</textarea>';
    h+='<div class="rep-mm-notebtns">'
        +(draft?'<button class="rc-btn" onclick="repNoteAdoptDraft(\''+_repJs(abbr)+'\',\''+id+'\')" title="'+L({ur:'خودکار مسودہ ایڈیٹر میں ڈالیں (پھر ترمیم کریں)',en:'Put the auto draft into the editor (then edit)',roman:'Draft editor mein daalein'})+'">🤖→✍ '+L({ur:'مسودہ اپنائیں',en:'Adopt draft',roman:'Draft apnaein'})+'</button>':'')
        +'<button class="rc-btn" onclick="repNoteSaveFrom(\''+_repJs(abbr)+'\',\''+id+'\',\'draft\')">💾 '+L({ur:'محفوظ (مسودہ)',en:'Save (draft)',roman:'Save (draft)'})+'</button>'
        +'<button class="rc-btn primary" onclick="repNoteSaveFrom(\''+_repJs(abbr)+'\',\''+id+'\',\'approved\')">✔ '+L({ur:'منظور',en:'Approve',roman:'Manzoor'})+'</button>'
        +(n?'<button class="rc-btn danger" onclick="repNoteSaveFrom(\''+_repJs(abbr)+'\',\''+id+'\',\'delete\')">🗑</button>':'')
        +'</div></div>';
    return h;
}
var _repNoteDrafts={};   // abbr -> draft text (for adopt)
function repNoteAdoptDraft(abbr,id){ var ta=document.getElementById(id); if(!ta)return; var d=_repNoteDrafts[abbr]||''; ta.value=(ta.value.trim()?ta.value.trim()+'\n':'')+d; ta.focus(); }
function repNoteSaveFrom(abbr,id,status){
    var ta=document.getElementById(id); if(!ta)return; var ctx=(typeof repDiffCtx!=='undefined')?repDiffCtx:null;
    if(status==='delete'){ repNoteSet(ctx,abbr,'',''); showToast('🗑'); }
    else { if(!ta.value.trim()){ showToast(repLangText({ur:'نوٹ خالی ہے',en:'Note is empty',roman:'Note khali hai'})); return; } repNoteSet(ctx,abbr,ta.value,status); showToast((status==='approved'?'✔ ':'💾 ')+abbr); }
    if(typeof repDiffRenderBody==='function') repDiffRenderBody();
}

// ---------- تفریق ونڈو کا «📖 میٹیریا میڈیکا» ٹیب ----------
function repDiffMMTabHtml(last){
    var L=repLangText, ctx=(typeof repDiffCtx!=='undefined')?repDiffCtx:null;
    var R=(typeof repDiffSel!=='undefined')?repDiffSel.slice():[];
    if(!R.length&&ctx&&ctx.rems){ var rems=ctx.rems; R=Object.keys(rems).sort(function(a,b){ return ((rems[b]>=3?3:rems[b])-(rems[a]>=3?3:rems[a]))||a.localeCompare(b); }).slice(0,5); }
    var theme=(typeof repDiffTheme!=='undefined')?repDiffTheme:'';
    var h='<p class="rep-tool-sub">'+L({ur:'چار پبلک ڈومین کتابوں کا اصل متن (کینٹ لیکچرز 1905، بورک 1927، ایلن کی نوٹس 1898، نیش لیڈرز 1913)۔ موضوع کے الفاظ سے ہر ریمیڈی کے متعلقہ جملے، حوالہ [کتاب § سیکشن] کے ساتھ۔ 🤖 مسودہ = ان جملوں کا خودکار انتخاب — ڈاکٹر کی تصدیق باقی؛ ✍ میں اپنا نوٹ لکھیں، ✔ منظور کریں، 📤 سے JSON ایکسپورٹ۔',en:'Original text of four public-domain books (Kent Lectures 1905, Boericke 1927, Allen Keynotes 1898, Nash Leaders 1913). Theme words select each remedy\'s relevant sentences with a reference [book § section]. 🤖 draft = automatic pick of those sentences — awaiting the doctor\'s verification; write your own note in ✍, ✔ approve, 📤 export JSON.',roman:'Chaar public-domain kitabon ka asal matn; 🤖 draft = khudkar intikhab; ✍ apna note.'})+'</p>';
    var nc=repNotesCount();
    h+='<div class="rep-diff-theme"><label>🔎 '+L({ur:'موضوع کے الفاظ:',en:'Theme words:',roman:'Theme words:'})+' <input type="text" id="repDiffThemeInp" value="'+_repAttr(theme)+'" dir="ltr" placeholder="grief, sigh, consol" onkeydown="if(event.key===\'Enter\')repDiffThemeApplyMM()"></label> <button class="rc-btn" onclick="repDiffThemeApplyMM()">↻</button>'
        +'<span class="cnt">✍ '+L({ur:'نوٹس:',en:'notes:',roman:'notes:'})+' '+nc.total+' ('+nc.approved+' ✔)</span>'
        +'<button class="rst-link" onclick="repNotesExport()" title="'+L({ur:'اپنے نوٹس JSON فائل میں (differentiation_notes.json) — مشترکہ کرنے کے لیے mm/notes_shared.json کے نام سے repo میں رکھیں',en:'Your notes as JSON (differentiation_notes.json) — commit as mm/notes_shared.json to share',roman:'Notes JSON export'})+'">📤 '+L({ur:'نوٹس ایکسپورٹ',en:'Export notes',roman:'Notes export'})+'</button>'
        +'<label class="rst-link" style="cursor:pointer" title="'+L({ur:'نوٹس کی JSON فائل امپورٹ (نجی کتابوں کی فائل خودبخود پہچان لی جاتی ہے)',en:'Import a notes JSON (a private-books file is detected automatically)',roman:'Notes JSON import'})+'">📥 '+L({ur:'نوٹس امپورٹ',en:'Import notes',roman:'Notes import'})+'<input type="file" accept=".json" style="display:none" onchange="repNotesImportFile(this)"></label>'
        +'<button class="rst-link priv" onclick="repPrivPanelToggle()" title="'+L({ur:'کاپی رائٹ کتابیں صرف اس آلے پر — امپورٹ/فہرست/حذف',en:'Copyrighted books on this device only — import / list / delete',roman:'Private books panel'})+'">🔒 '+L({ur:'نجی کتابیں',en:'Private books',roman:'Private books'})+' ('+repPrivIds().length+')</button>'
        +'</div>';
    if(_repPrivPanelOpen) h+=repPrivPanelHtml();
    if(!R.length) return h+'<div class="rep-tool-note">'+L({ur:'پہلے ریمیڈیز چنیں',en:'Pick remedies first',roman:'Pehle remedies chunein'})+'</div>';
    if(!repMMLoaded()){
        var rerender=function(){ if(typeof repDiffTab!=='undefined'&&repDiffTab==='mm'&&typeof repDiffRenderBody==='function') repDiffRenderBody(); };
        if(!_repMMEnsureKicked){ _repMMEnsureKicked=true; repMMEnsureAll(rerender,function(){ rerender(); }); }
        if(!repMMIndex||!repMMLoadedCount()) return h+'<div class="rep-tool-loading">⏳ '+L({ur:'میٹیریا میڈیکا لوڈ ہو رہی ہے (پہلی بار ~40 ایم بی، پھر کیش سے)…',en:'Loading materia medica (first time ~40 MB, then cached)…',roman:'Materia medica load ho rahi hai…'})+'</div>';
        h+='<div class="rep-tool-note">⏳ '+L({ur:'کتابیں لوڈ ہو رہی ہیں: '+repMMLoadedCount()+' / '+repMMPublicIds().length+' — نتائج خودبخود مکمل ہوں گے',en:'Books loading: '+repMMLoadedCount()+' / '+repMMPublicIds().length+' — results fill in automatically',roman:'Books loading '+repMMLoadedCount()+'/'+repMMPublicIds().length})+'</div>';
    }
    var re=repMMThemeRegex(theme);
    if(!re) h+='<div class="rep-tool-note">'+L({ur:'موضوع کے الفاظ لکھیں — ورنہ صرف پورا متن (📖) دستیاب ہے',en:'Enter theme words — otherwise only the full text (📖) is available',roman:'Theme words likhein'})+'</div>';
    // ---------- ڈیزائن E: لکھنے کا موڈ — بائیں ایک ریمیڈی کا مواد، دائیں مستقل ایڈیٹر؛ 📊 سب کا خلاصہ (ڈیزائن B)؛ تنگ سکرین پر ایڈیٹر نیچے چپکا ----------
    if(!repMMTabRem||R.indexOf(repMMTabRem)===-1) repMMTabRem=R[0];
    var a=repMMTabRem; _repMMPickPool=[];
    var noteMark=function(x){ var n=repNoteGet(ctx,x); return n?(n.status==='approved'?' ✔':' ✎'):''; };
    h+='<div class="rep-mm-rt">'+R.map(function(x){ return '<button class="rep-mm-rtb'+(x===a?' on':'')+'" onclick="repMMTabSelect(\''+_repJs(x)+'\')" title="'+_repAttr(repRemedyTitle(x))+'"><span dir="ltr">'+escapeHtml(x)+'</span>'+noteMark(x)+'</button>'; }).join('')
        +'<button class="rst-link" onclick="repMMTabSummaryToggle()">📊 '+L({ur:'سب کا خلاصہ',en:'Summary of all',roman:'Sab ka khulasa'})+(repMMTabSummary?' ▴':' ▾')+'</button></div>';
    if(repMMTabSummary){
        h+='<div class="rep-mm-sumwrap"><table class="rep-mm-sumtbl"><thead><tr><th>'+L({ur:'ریمیڈی',en:'Remedy',roman:'Remedy'})+'</th><th>🤖 '+L({ur:'مسودہ (پہلے 2 جملے)',en:'Draft (first 2 sentences)',roman:'Draft'})+'</th><th>'+L({ur:'جملے',en:'Sent.',roman:'Sent.'})+'</th><th>✍ '+L({ur:'نوٹ',en:'Note',roman:'Note'})+'</th></tr></thead><tbody>';
        R.forEach(function(x){
            var msx=re?repMMMatches(x,re):[]; var dr=re?repMMDraft(x,re).slice(0,2):[]; var n=repNoteGet(ctx,x);
            h+='<tr class="'+(x===a?'on':'')+'" onclick="repMMTabSelect(\''+_repJs(x)+'\')"><td class="rem"><b dir="ltr">'+escapeHtml(x)+'</b><br><small>'+escapeHtml(repRemedyTitle(x).replace(/^.*= /,''))+'</small></td>'
                +'<td class="dr" dir="ltr">'+(dr.length?dr.map(function(m){ return '• '+repMMHighlight(repMMFmt(m.text),re)+' <span class="rep-mm-ref">'+escapeHtml(repMMRef(m))+'</span>'; }).join('<br>'):'<span class="rep-mm-none">—</span>')+'</td>'
                +'<td class="n">'+msx.length+'</td><td class="st">'+(n?'<span class="rep-mm-status '+n.status+'">'+(n.status==='approved'?'✔':'✎')+'</span> <small>'+escapeHtml(_repTruncPath((n.ur||n.text||''),60))+'</small>':'<span class="rep-mm-none">—</span>')+'</td></tr>';
        });
        h+='</tbody></table></div>';
    }
    var av=repMMAvail(a);
    var ms=(av.length&&re)?repMMMatches(a,re):[]; var cnt={}; ms.forEach(function(m){ cnt[m.book]=(cnt[m.book]||0)+1; });
    var avSorted=av.slice().sort(function(x,y){ return (cnt[y]||0)-(cnt[x]||0); });
    var shown=avSorted.filter(function(id){ return !repPrivIs(id); }).slice(0,7).concat(avSorted.filter(repPrivIs)), more=avSorted.length-shown.length;   // نجی کتابیں ہمیشہ دکھائیں
    h+='<div class="rep-mm-e"><div class="rep-mm-e-left">';
    h+='<div class="rep-mm-cardhead"><b dir="ltr">'+escapeHtml(a)+'</b> <small>'+escapeHtml(repRemedyTitle(a).replace(/^.*= /,''))+'</small>'
        +(av.length?'<button class="rc-btn" onclick="repMMOpen(\''+_repJs(a)+'\')">📖 '+L({ur:'پورا متن',en:'Full text',roman:'Poora matn'})+'</button>':'')+'</div>'
        +'<div class="rep-mm-av">'+(av.length?shown.map(function(id){ return repMMBadge(id)+(cnt[id]?'<sup>'+cnt[id]+'</sup>':''); }).join('')+(more>0?'<span class="rep-mm-more-b" title="'+_repAttr(avSorted.filter(function(id){ return shown.indexOf(id)===-1; }).map(repMMShort).join(', '))+'">+'+more+'</span>':''):'<i>'+L({ur:'ان کتابوں میں نہیں',en:'not in these books',roman:'in kitabon mein nahi'})+'</i>')
        +' <small class="rep-mm-avn">'+av.length+' '+L({ur:'کتابیں',en:'books',roman:'books'})+' · '+ms.length+' '+L({ur:'جملے',en:'sentences',roman:'jumle'})+'</small></div>';
    var pickBtn=function(m){ _repMMPickPool.push('• '+repMMPlain(m.text).replace(/\s+/g,' ').trim()+' '+repMMRef(m)); return '<button class="rep-mm-pick" onclick="repMMPick('+(_repMMPickPool.length-1)+')" title="'+L({ur:'یہ جملہ حوالے سمیت نوٹ میں ڈالیں',en:'Add this sentence with its reference to the note',roman:'Note mein daalein'})+'">＋ '+L({ur:'نوٹ میں',en:'to note',roman:'note mein'})+'</button>'; };
    if(av.length&&re){
        var draftList=repMMDraft(a,re); _repNoteDrafts[a]=repMMDraftText(a,re);
        if(draftList.length){
            h+='<div class="rep-mm-draft"><div class="rep-mm-drafthead">🤖 '+L({ur:'خودکار مسودہ (حوالہ جات کے ساتھ) — تصدیق باقی',en:'Auto draft (with references) — unverified',roman:'Khudkar musawwada — tasdeeq baqi'})+'</div>';
            draftList.forEach(function(m){ h+='<div class="rep-mm-draftline" dir="ltr">• '+repMMHighlight(repMMFmt(m.text),re)+' <span class="rep-mm-ref" style="color:'+(REP_MM_COLOR[m.book]||'#555')+'">'+escapeHtml(repMMRef(m))+'</span> '+pickBtn(m)+'</div>'; });
            h+='</div>';
        } else { var _hint=(typeof repMMAvail==='function')?repMMAvail(a):[];   // v68.4: «کوئی جملہ نہیں» پر بھی بتاؤ کہ کون سی کتاب اِس دوا کو جانتی ہے
            h+='<div class="rep-tool-note">'+(_hint.length?L({ur:'اِس دوا کے بارے میں '+_hint.length+' کتابوں میں متن ہے — نیچے کسی خانے پر کلک کر کے 📖 پورا متن دیکھیں',en:_hint.length+' books do carry this remedy — open a tab and use the full text',roman:_hint.length+' kitabon mein text hai'}):'')+' · ';
            h+=L({ur:'اس موضوع پر ان کتابوں میں اس ریمیڈی کا کوئی جملہ نہیں ملا — الفاظ بدل کر دیکھیں یا 📖 پورا متن',en:'No sentence for this remedy on this theme — try other words or 📖 full text',roman:'Koi jumla nahi mila'})+'</div>'; }
        if(ms.length){
            var byBook={}; ms.forEach(function(m){ (byBook[m.book]=byBook[m.book]||[]).push(m); });
            h+='<details class="rep-mm-more" '+(ms.length<=12?'open':'')+'><summary>'+L({ur:'تمام متعلقہ جملے',en:'All matching sentences',roman:'Tamam jumle'})+' ('+ms.length+') — '+L({ur:'ہر جملے پر «＋ نوٹ میں»',en:'each with «＋ to note»',roman:'har jumle par «＋»'})+'</summary>';
            repMMBookIds().forEach(function(id){ var arr=byBook[id]; if(!arr)return; h+='<div class="rep-mm-bookblk">'+repMMBadge(id)+' <small>'+escapeHtml(repMMBookLabel(id))+'</small>';
                arr.forEach(function(m){ h+='<div class="rep-mm-sent" dir="ltr">'+repMMHighlight(repMMFmt(m.text),re)+(m.section?' <span class="rep-mm-sec">§ '+escapeHtml(m.section)+'</span>':'')+' '+pickBtn(m)+'</div>'; }); h+='</div>'; });
            h+='</details>';
        }
    }
    // ریپرٹری کے حقائق (تفریق ونڈو کے نتیجے سے): اس ریمیڈی کے خصوصی ربرکس — «＋» سے [Rep: …] نوٹ میں
    var res=last&&last.res; var ex=(res&&res.excl&&res.excl[a])?res.excl[a].slice(0,6):[];
    if(ex.length){
        h+='<div class="rep-mm-facts"><div class="rep-mm-drafthead">📗 '+L({ur:'ریپرٹری کے حقائق — صرف اس ریمیڈی کے ربرکس (باقی چنی ہوئی غائب)',en:'Repertory facts — rubrics where only this remedy is present',roman:'Repertory facts'})+'</div>';
        ex.forEach(function(r){ var line='[Rep: '+r.x.t+' — g'+r.g+', '+r.N+' rem]'; _repMMPickPool.push(line); h+='<div class="rep-mm-fact" dir="ltr"><span class="rep-diff-dot d'+r.g+'">'+r.g+'</span> '+escapeHtml(r.x.t)+' <small>('+r.N+')</small> <button class="rep-mm-pick" onclick="repMMPick('+(_repMMPickPool.length-1)+')">＋ '+L({ur:'نوٹ میں',en:'to note',roman:'note mein'})+'</button></div>'; });
        h+='</div>';
    } else if(res&&R.length>1) h+='<div class="rep-tool-note">'+L({ur:'ریپرٹری کے حقائق «🎯 خصوصی» ٹیب میں',en:'Repertory facts are in the «🎯 Exclusive» tab',roman:'Repertory facts «Exclusive» tab mein'})+'</div>';
    h+='</div>';   // /left
    // دائیں: مستقل ایڈیٹر + اسی ربرک کے باقی نوٹس
    h+='<div class="rep-mm-e-right">'+repNoteEditorHtml(ctx,a,!!_repNoteDrafts[a]);
    var others=ctx?repNotesForRubric(ctx.book,ctx.ch,ctx.rid).filter(function(x){ return x.abbr!==a; }):[];
    if(others.length){
        h+='<div class="rep-mm-others"><div class="rep-mm-drafthead">✍ '+L({ur:'اسی ربرک کے دوسرے نوٹس',en:'Other notes of this rubric',roman:'Isi rubric ke doosre notes'})+' ('+others.length+')</div>';
        others.slice(0,8).forEach(function(x){ var n=x.note; h+='<div class="rep-mm-other'+(n.status==='approved'?' ok':'')+'" onclick="repMMTabSelectAny(\''+_repJs(x.abbr)+'\')"><b dir="ltr">'+escapeHtml(x.abbr)+'</b> <span class="rep-mm-status '+(n.status||'draft')+'">'+(n.status==='approved'?'✔':'✎')+'</span> <small>'+escapeHtml(_repTruncPath(n.ur||n.text||'',70))+'</small></div>'; });
        h+='</div>';
    }
    h+='</div></div>';   // /right /e
    return h;
}
var repMMTabRem=null, repMMTabSummary=false, _repMMPickPool=[];
function repMMTabSelect(a){ repMMTabRem=a; if(typeof repDiffRenderBody==='function') repDiffRenderBody(); }
function repMMTabSelectAny(a){ if(typeof repDiffSel!=='undefined'&&repDiffSel.length&&repDiffSel.indexOf(a)===-1&&repDiffSel.length<REP_DIFF_MAX_REMS){ repDiffSel.push(a); } repMMTabSelect(a); }
function repMMTabSummaryToggle(){ repMMTabSummary=!repMMTabSummary; if(typeof repDiffRenderBody==='function') repDiffRenderBody(); }
// «＋ نوٹ میں»: جملہ/حقیقت حوالے سمیت ایڈیٹر میں جوڑیں (ایڈیٹر کو محفوظ نہیں کرتا — 💾/✔ آپ دبائیں)
function repMMPick(i){
    var line=_repMMPickPool[i]; if(!line) return; var a=repMMTabRem||''; var ta=document.getElementById('repNote_'+a.replace(/[^a-z0-9]/gi,'_')); if(!ta){ showToast('✍ ?'); return; }
    ta.value=(ta.value.trim()?ta.value.trim()+'\n':'')+line; ta.scrollTop=ta.scrollHeight; ta.focus();
    showToast('＋ '+repLangText({ur:'نوٹ میں جوڑ دیا — 💾 یا ✔ دبانا نہ بھولیں',en:'Added to the note — remember 💾 or ✔',roman:'Note mein jor diya — 💾/✔ dabayein'}));
}
var _repPrivPanelOpen=false; var _repMMEnsureKicked=false;
function repPrivPanelToggle(){ _repPrivPanelOpen=!_repPrivPanelOpen; if(typeof repDiffRenderBody==='function') repDiffRenderBody(); }
function repDiffThemeApplyMM(){ var i=document.getElementById('repDiffThemeInp'); if(i&&typeof repDiffTheme!=='undefined'){ repDiffTheme=i.value; } if(typeof repDiffRenderBody==='function') repDiffRenderBody(); }

// ---------- 📖 پورا متن — ماڈل ----------
var repMMView={abbr:null,book:null,q:'',list:[]};
function repMMOpen(abbr,theme,list){
    repMMView.abbr=String(abbr||'').toLowerCase(); repMMView.list=list||repMMView.list||[];
    if(theme!==undefined) repMMView.q=theme||''; else if(!repMMView.q&&typeof repDiffTheme!=='undefined') repMMView.q=repDiffTheme||'';
    var m=document.getElementById('repMMModal');
    if(!m){ m=document.createElement('div'); m.id='repMMModal'; m.className='rep-diff-modal'; m.innerHTML='<div class="rep-diff-back" onclick="repMMClose()"></div><div class="rep-diff-win"><div id="repMMHead"></div><div id="repMMBody" class="rep-diff-body"></div></div>'; document.body.appendChild(m);
        document.addEventListener('keydown',function(ev){ if(ev.key==='Escape'){ var mm=document.getElementById('repMMModal'); if(mm&&mm.style.display==='block') repMMClose(); } }); }
    m.style.display='block';
    repMMEnsureAll(function(){ var av=repMMAvail(repMMView.abbr); if(!repMMView.book||av.indexOf(repMMView.book)===-1) repMMView.book=av[0]||null; repMMRender(); });
    repMMRender();
}
function repMMClose(){ var m=document.getElementById('repMMModal'); if(m)m.style.display='none'; }
function repMMOpenForRubric(){
    var d=(typeof repCurrentDetail!=='undefined'&&repCurrentDetail)||{}; var node=(typeof repDetailNode==='function')?repDetailNode():null; var rems=(node&&node.remedies)||{};
    var list=Object.keys(rems).sort(function(a,b){ return ((rems[b]>=3?3:rems[b])-(rems[a]>=3?3:rems[a]))||a.localeCompare(b); });
    var ctx={book:repCurrentBook,ch:repCurrentChapter,rid:String(d.rid||''),full:d.full||'',rems:rems};
    var theme=(typeof repDiffThemeWordsFor==='function')?repDiffThemeWordsFor(ctx):'';
    repMMOpen(list[0]||'',theme,list);
}
function repMMSetBook(id){ repMMView.book=id; repMMRender(); }
function repMMSetRem(a){ repMMView.abbr=a; var av=repMMAvail(a); if(av.indexOf(repMMView.book)===-1) repMMView.book=av[0]||null; repMMRender(); }
function repMMSearch(){ var i=document.getElementById('repMMQ'); if(i){ repMMView.q=i.value; repMMRenderBody(); } }
function repMMWholeToggle(on){ repMMView.whole=!!on; repMMRenderBody(); }
function repMMRender(){
    var L=repLangText, head=document.getElementById('repMMHead'); if(!head)return;
    var a=repMMView.abbr, av=repMMAvail(a);
    var h='<div class="rep-diff-title"><b>📖 '+L({ur:'میٹیریا میڈیکا',en:'MATERIA MEDICA',roman:'MATERIA MEDICA'})+'</b><span class="rep-diff-sub"><b dir="ltr">'+escapeHtml(a)+'</b> — '+escapeHtml(repRemedyTitle(a).replace(/^.*= /,''))+'</span>'+(typeof repLibOpen==='function'?'<button class="rc-btn" onclick="repLibOpen()" title="'+_repAttr(L({ur:'مطالعہ لائبریری — ہانیمن: آرگینن (چھٹا ایڈیشن)، کرانک ڈیزیزز',en:'Reading library — Hahnemann: Organon 6th ed., Chronic Diseases',roman:'Library'}))+'">📚</button>':'')+'<button class="rc-btn" onclick="repMMClose()">✕ '+L({ur:'بند',en:'Close',roman:'Band'})+'</button></div>';
    if(repMMView.list&&repMMView.list.length>1){
        h+='<div class="rep-mm-remlist">'; repMMView.list.slice(0,80).forEach(function(x){ var has=repMMAvail(x).length>0; h+='<button class="rep-mm-rembtn'+(x===a?' on':'')+(has?'':' none')+'" onclick="repMMSetRem(\''+_repJs(x)+'\')" title="'+(has?repMMAvail(x).map(function(b){return REP_MM_SHORT[b]||b;}).join(', '):L({ur:'ان کتابوں میں نہیں',en:'not in these books',roman:'nahi'}))+'"><span dir="ltr">'+escapeHtml(x)+'</span></button>'; }); h+='</div>';
    }
    h+='<div class="rep-diff-ctl"><div class="rep-diff-tabs" style="margin:0">';
    if(!repMMIndex) h+='<span class="rep-tool-loading">⏳</span>';
    var _privEmptyN=0;
    repMMBookIds().forEach(function(id){ var priv=repPrivIs(id), has=av.indexOf(id)!==-1;
        if(priv&&!has){ _privEmptyN++; if(_repPrivPrefs.hideEmpty) return; }
        // 🔑 v68.2: نجی کتاب کے «✕» سے وہ کتاب اِسی آلے سے ہٹ جاتی ہے؛ عام کتاب کے «✕» صرف یہ بتاتے ہیں کہ اِس ریمیڈی کا اُس میں کچھ نہیں
        h+='<button class="'+(repMMView.book===id?'on':'')+(has?'':' none')+(priv?' priv':'')+'" '+(has?'onclick="repMMSetBook(\''+id+'\')"':'disabled')+' title="'+_repAttr(repMMBookLabel(id))+'">'
            +(priv?'🔒 ':'')+escapeHtml(repMMShort(id))
            +(priv&&!has?'<span class="rep-mm-tabx del" onclick="repPrivDelete(\''+_repJs(id)+'\')" title="'+_repAttr(L({ur:'یہ نجی کتاب اِسی آلے سے ہٹا دیں',en:'Remove this private book from this device',roman:'Ye kitab is device se hata dein'}))+'">✕</span>':(has?'':' ✕'))
            +'</button>'; });
    var _privToggle='';
    if(_privEmptyN){
        var _lbl=_repPrivPrefs.hideEmpty?L({ur:'دکھائیں',en:'show',roman:'dikhayein'}):L({ur:'چھپا دیں',en:'hide',roman:'chhpa dein'});
        var _tip=L({ur:'صرف اِس قطار سے چھپتی ہیں — کتاب اِسی آلے میں محفوظ رہتی ہے',en:'hidden from this row only — the book stays on this device',roman:'sirf is qataar se chhupti hain'});
        _privToggle='<button class="rst-link'+(_repPrivPrefs.hideEmpty?' on':'')+'" onclick="repPrivHideEmptyToggle()" title="'+_repAttr(_tip)+'">🔒 '+_privEmptyN+' '+_lbl+'</button>';
    }
    h+='</div>'+_privToggle+'<label>🔎 <input type="text" id="repMMQ" value="'+_repAttr(repMMView.q)+'" dir="ltr" placeholder="absent, forget" oninput="repMMSearch()" style="width:220px;border:1px solid #cfdbe6;border-radius:8px;padding:4px 8px;font-family:inherit;font-size:12px"></label>'
        +(repPrivIs(repMMView.book)?'<label title="'+L({ur:'نجی کتاب: ریمیڈی کے صفحات کی بجائے پوری کتاب میں الفاظ تلاش کریں',en:'Private book: search the words in the whole book instead of the remedy pages',roman:'Poori kitab mein talash'})+'"><input type="checkbox" '+(repMMView.whole?'checked':'')+' onchange="repMMWholeToggle(this.checked)"> '+L({ur:'پوری کتاب',en:'whole book',roman:'poori kitab'})+'</label>':'')
        +'<button class="rc-btn" onclick="repMMCopy()" title="'+L({ur:'اس کتاب کا متن کاپی',en:'Copy this book\'s text',roman:'Copy'})+'">📋</button></div>';
    head.innerHTML=h; repMMRenderBody();
}
function repMMRenderBody(){
    var L=repLangText, body=document.getElementById('repMMBody'); if(!body)return;
    var a=repMMView.abbr, id=repMMView.book;
    if(!repMMIndex||(id&&!repPrivIs(id)&&!_repMMBooks[id])){ body.innerHTML='<div class="rep-tool-loading">⏳ '+L({ur:'لوڈ ہو رہا ہے…',en:'Loading…',roman:'Load ho raha hai…'})+'</div>'; return; }
    var re=repMMThemeRegex(repMMView.q), h='';
    var e=id?repMMEntry(id,a):null;
    if(id&&repPrivIs(id)&&repMMView.whole&&re){ var pgs=repPrivSearchPages(id,re,120); e={name:_repPrivMem[id].title,common:'',src:'',sections:pgs.map(function(pg){ return {h:'p. '+pg.p,p:[pg.t]}; })}; if(!pgs.length) e=null; }
    if(!e){ body.innerHTML='<div class="rep-tool-loading">'+L({ur:'اس ریمیڈی کا متن ان کتابوں میں نہیں',en:'No text for this remedy in these books',roman:'Is remedy ka matn nahi'})+'</div>'; return; }
    if(repPrivIs(id)) h+='<div class="rep-mm-src">'+repMMBadge(id)+' <b>'+escapeHtml(e.name||a)+'</b> — '+escapeHtml(repMMBookLabel(id))+' · '+L({ur:'نجی کتاب — اس آلے پر، '+e.sections.length+' صفحات',en:'private book — this device, '+e.sections.length+' pages',roman:'private — '+e.sections.length+' pages'})+'</div>';
    else h+='<div class="rep-mm-src">'+repMMBadge(id)+' <b>'+escapeHtml(e.name||a)+'</b>'+(e.common?' <small>('+escapeHtml(e.common)+')</small>':'')+' — '+escapeHtml(repMMBookLabel(id))+' · <a href="'+_repAttr((_repMMBooks[id]&&_repMMBooks[id].source)||'#')+'" target="_blank" rel="noopener">homeoint.org</a> · public domain</div>';
    var nHit=0;
    (e.sections||[]).forEach(function(sec){
        h+='<div class="rep-mm-section">'+(sec.h?'<div class="rep-mm-h">'+escapeHtml(sec.h)+'</div>':'');
        (sec.p||[]).forEach(function(p){ var html=repMMFmt(p); if(re){ var hit=re.test(repMMPlain(p)); if(hit){ nHit++; html=repMMHighlight(html,re); } h+='<p class="rep-mm-p'+(hit?' hit':'')+'" dir="ltr">'+html+'</p>'; } else h+='<p class="rep-mm-p" dir="ltr">'+html+'</p>'; });
        h+='</div>';
    });
    if(re) h='<div class="rep-mm-hits">'+nHit+' '+L({ur:'پیراگراف موضوع سے ملتے ہیں (نمایاں)',en:'paragraphs match the theme (highlighted)',roman:'paragraphs match'})+'</div>'+h;
    body.innerHTML=h; body.scrollTop=0;
    var first=body.querySelector('.rep-mm-p.hit'); if(first&&re){ try{ first.scrollIntoView({block:'start'}); }catch(err){} }
}
function repMMCopy(){ var e=repMMView.book?repMMEntry(repMMView.book,repMMView.abbr):null; if(!e)return; var txt=e.name+' — '+repMMBookLabel(repMMView.book)+'\n\n'+(e.sections||[]).map(function(s){ return (s.h?s.h.toUpperCase()+'\n':'')+(s.p||[]).map(repMMPlain).join('\n'); }).join('\n\n'); if(navigator.clipboard) navigator.clipboard.writeText(txt).then(function(){ showToast('📋 '+repLangText({ur:'کاپی ہو گیا',en:'Copied',roman:'Copy ho gaya'})); }); }
