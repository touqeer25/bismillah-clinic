// Bismillah Clinic — js/repertory/rep-rubric-detail.js — ربرک ڈیٹیل پیج، نوٹس، cross-references
// (v78: 08-app-repertory.js کو بغیر کسی کوڈ تبدیلی کے حصوں میں بانٹا گیا؛ لوڈ ترتیب index.html میں وہی رکھیں)
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
            if(!repGradeShow(g))return;                                 // 🔑 v79: گریڈ فلٹر
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
    h+='<div class="rpd-sec-head">💊 '+repLangText({ur:'ادویات',en:'REMEDIES',roman:'ADWIYAT'})+' <span class="cnt">('+(repGradeMin?abbrs.filter(function(a){return repGradeShow(rems[a]);}).length+'/'+abbrs.length:abbrs.length)+')</span>'+(abbrs.length>1&&d.rid&&typeof repDiffOpenForRubric==='function'?' <button class="rst-link" onclick="repDiffOpenForRubric()" title="'+repLangText({ur:'ان ادویات میں کیا فرق ہے؟',en:'What distinguishes these remedies?',roman:'In adwiyat mein kya farq hai?'})+'">🔬 '+repLangText({ur:'ان میں فرق؟',en:'differentiate',roman:'farq?'})+'</button>':'')
        +(abbrs.length&&typeof repMMOpenForRubric==='function'?' <button class="rst-link" onclick="repMMOpenForRubric()" title="'+repLangText({ur:'ان ادویات کا میٹیریا میڈیکا متن (کینٹ، بورک، ایلن، نیش)',en:'Materia medica text of these remedies (Kent, Boericke, Allen, Nash)',roman:'Materia medica matn'})+'">📖 '+repLangText({ur:'میٹیریا میڈیکا',en:'materia medica',roman:'materia medica'})+'</button>':'')+'</div>';
    if(!abbrs.length){
        h+='<div class="rrp-norems">'+(pureXref?repLangText({ur:'یہ کراس ریفرنس ربرک ہے — اوپر اصل ربرک کھولیں',en:'This is a cross-reference rubric — open the real rubric above',roman:'Ye cross-reference rubric hai — asal rubric kholen'}):repLangText({ur:'اس ربرک میں کوئی ادویات محفوظ نہیں',en:'No remedies recorded under this rubric',roman:'Is rubric mein koi adwiyat mehfooz nahi'}))+'</div>';
    } else {
        // 🔑 تمام ریمیڈیز ایک ہی لسٹ میں (گریڈ ہیڈنگز نہیں) — ترتیب: گریڈ 3 → 2 → 1، رنگ سے گریڈ پہچان (v39: ہیلپر ٹیکسٹ ہٹا دیا گیا)
        h+='<div class="rpd-chips">';
        abbrs.forEach(function(a){
            var g=rems[a]||1; g=(g>=3)?3:((g===2)?2:1);
            if(!repGradeShow(g))return;                                 // 🔑 v79: گریڈ فلٹر
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
