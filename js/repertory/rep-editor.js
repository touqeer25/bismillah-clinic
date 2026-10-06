/* ریپرٹری ترمیم کار — الگ فائل؛ باب/ترجمہ صرف صارف کی چنی ہوئی فائلوں سے پڑھے */
(function(root){
'use strict';

function clone(value){ return value==null?value:JSON.parse(JSON.stringify(value)); }
function isObject(value){ return !!value && typeof value==='object' && !Array.isArray(value); }
function fieldFrom(record, choices){
    for(var i=0;i<choices.length;i++) if(typeof record[choices[i]]==='string') return choices[i];
    return null;
}
function objectFieldFrom(record, choices){
    for(var i=0;i<choices.length;i++) if(isObject(record[choices[i]])) return choices[i];
    return null;
}
function repKeyFallback(full){
    var s=String(full||'').replace(/ \[\d+\]$/,'');
    s=s.replace(/\s*\(\s*see\b[^)]*\)/ig,'');
    s=s.replace(/\s+,/g,',').replace(/,\s*,/g,',').replace(/,\s*$/,'').replace(/^\s*,/,'');
    return s.replace(/\s+/g,' ').replace(/,(\S)/g,', $1').trim().toLowerCase();
}
function makeKey(full, keyFn){ return (keyFn||repKeyFallback)(full); }
function prefixSeparator(child,parent){
    if(!parent || child.indexOf(parent)!==0) return ', ';
    var rest=child.slice(parent.length);
    if(rest.indexOf(', ')===0)return ', ';
    if(rest.indexOf(' - ')===0)return ' - ';
    if(rest.indexOf(' > ')===0)return ' > ';
    if(rest.indexOf('/')===0)return '/';
    return ', ';
}
function inferParentByPath(entries, byId){
    var all=entries.map(function(e){return e;});
    all.forEach(function(entry){
        if(entry.parentField && Object.prototype.hasOwnProperty.call(entry.record,entry.parentField)){
            var raw=entry.record[entry.parentField];
            entry.parentId=(raw===null||raw===''||raw===undefined)?null:String(raw);
            if(entry.parentId && !byId[entry.parentId]) entry.parentInvalid=true;
            return;
        }
        var best=null;
        all.forEach(function(candidate){
            if(candidate.id===entry.id || !candidate.originalPath || !entry.originalPath) return;
            if(candidate.originalPath.length>=entry.originalPath.length) return;
            var rest=entry.originalPath.slice(candidate.originalPath.length);
            if(entry.originalPath.indexOf(candidate.originalPath)!==0) return;
            if(!(rest.indexOf(', ')===0||rest.indexOf(' - ')===0||rest.indexOf(' > ')===0||rest.indexOf('/')===0)) return;
            if(!best || candidate.originalPath.length>best.originalPath.length) best=candidate;
        });
        entry.parentId=best?best.id:null;
        if(best){
            entry.separator=prefixSeparator(entry.originalPath,best.originalPath);
            var suffix=entry.originalPath.slice(best.originalPath.length+entry.separator.length);
            if(!entry.label)entry.label=suffix;
        }
    });
}
function analyzeChapter(doc, keyFn){
    if(!isObject(doc)) return {kind:'raw',doc:doc,ids:[],nodes:[],fields:{},errors:['باب کی جڑ ایک JSON آبجیکٹ نہیں']};
    var ids=Object.keys(doc), entries=[];
    ids.forEach(function(id,index){
        var rec=doc[id];
        if(!isObject(rec)) return;
        var titleField=fieldFrom(rec,['t','path','de_path','full_path']);
        if(!titleField) return;
        entries.push({id:String(id),index:index,record:rec,titleField:titleField,originalPath:String(rec[titleField]||''),label:'',parentId:null,separator:', ',order:index});
    });
    if(!entries.length) return {kind:'raw',doc:doc,ids:[],nodes:[],fields:{},errors:['اس فائل میں پہچانی ہوئی ربرک ساخت نہیں؛ خام متن کی تدوین دستیاب ہے']};

    function commonField(fieldList, predicate){
        var counts={};
        entries.forEach(function(e){ fieldList.forEach(function(f){ if(predicate(e.record[f]))counts[f]=(counts[f]||0)+1; }); });
        var best=null,n=0; Object.keys(counts).forEach(function(k){if(counts[k]>n){best=k;n=counts[k];}});
        return n>=Math.ceil(entries.length*0.6)?best:null;
    }
    var parentField=commonField(['source_parent_id','parent_id','parentId','parent'],function(v){return v===null||v===undefined||typeof v==='string'||typeof v==='number';});
    var labelField=commonField(['source_label','label','name'],function(v){return typeof v==='string';});
    var orderField=commonField(['source_order','order','position'],function(v){return typeof v==='number'&&isFinite(v);});
    var remediesField=commonField(['r','remedies','medicines','grades'],isObject);
    var byId=Object.create(null);
    entries.forEach(function(e){
        byId[e.id]=e;
        e.parentField=parentField;e.labelField=labelField;e.orderField=orderField;
        e.remediesField=objectFieldFrom(e.record,['r','remedies','medicines','grades'])||remediesField;
        if(labelField && typeof e.record[labelField]==='string')e.label=String(e.record[labelField]);
        if(orderField && typeof e.record[orderField]==='number')e.order=Number(e.record[orderField]);
    });
    inferParentByPath(entries,byId);
    entries.forEach(function(e){
        if(!e.label){
            var p=e.parentId&&byId[e.parentId];
            if(p && e.originalPath.indexOf(p.originalPath)===0){
                e.separator=prefixSeparator(e.originalPath,p.originalPath);
                e.label=e.originalPath.slice(p.originalPath.length+e.separator.length);
            } else e.label=e.originalPath;
        }
        if(!e.label)e.label=e.originalPath;
        if(!e.parentId)e.parentId=null;
        if(e.parentId&&byId[e.parentId]&&e.separator===', ')e.separator=prefixSeparator(e.originalPath,byId[e.parentId].originalPath);
        e.fullPath=e.originalPath||e.label;
        e.record=e.record;
        e.remediesField=objectFieldFrom(e.record,['r','remedies','medicines','grades'])||remediesField;
        e.display=isObject(e.record.display)?e.record.display:{};
        e.key=makeKey(e.fullPath,keyFn);
    });
    entries.sort(function(a,b){return a.order===b.order?a.index-b.index:a.order-b.order;});
    var model={kind:'record-map',doc:doc,ids:entries.map(function(e){return e.id;}),nodes:entries,byId:Object.create(null),fields:{parent:parentField,label:labelField,order:orderField,remedies:remediesField},errors:[]};
    entries.forEach(function(e){model.byId[e.id]=e;});
    return model;
}
function refreshPaths(model, doc){
    if(!model||model.kind!=='record-map')return model;
    var byId=model.byId, visiting=Object.create(null), done=Object.create(null);
    function visit(id){
        var node=byId[id]; if(!node)return '';
        if(done[id])return node.fullPath;
        if(visiting[id])return node.fullPath||node.label;
        visiting[id]=1;
        var parent=node.parentId&&byId[String(node.parentId)], full;
        if(parent){
            var parentPath=visit(String(parent.id));
            var sep=node.separator||', ';
            full=parentPath+sep+String(node.label||'');
        } else full=String(node.label||'');
        node.fullPath=full;
        node.key=repKeyFallback(full);
        if(node.titleField)node.record[node.titleField]=full;
        if(model.fields.label && node.record[model.fields.label]!==undefined)node.record[model.fields.label]=String(node.label||'');
        if(node.parentField)node.record[node.parentField]=node.parentId==null?null:String(node.parentId);
        done[id]=1;visiting[id]=0;
        return full;
    }
    model.nodes.forEach(function(n){visit(String(n.id));});
    if(doc)model.doc=doc;
    return model;
}
function analyzeTranslation(doc){
    if(!isObject(doc))return {kind:'raw',doc:doc,rubrics:null,locked:[],errors:['ترجمے کی جڑ ایک JSON آبجیکٹ نہیں']};
    if(!isObject(doc.rubrics))return {kind:'raw',doc:doc,rubrics:null,locked:Array.isArray(doc.locked)?doc.locked.slice():[],errors:['اس فائل میں rubrics کا نقشہ نہیں؛ خام متن کی تدوین دستیاب ہے']};
    var locked=Array.isArray(doc.locked)?doc.locked.map(String):[];
    return {kind:'rubric-map',doc:doc,rubrics:doc.rubrics,locked:locked,errors:[]};
}
function descendants(model,id){
    if(!model||model.kind!=='record-map')return [];
    var out=[],changed=true,seen=Object.create(null);seen[String(id)]=1;
    while(changed){changed=false;model.nodes.forEach(function(n){if(n.parentId!=null&&seen[String(n.parentId)]&&!seen[String(n.id)]){seen[String(n.id)]=1;out.push(String(n.id));changed=true;}});}
    return out;
}
function validateModel(model,keyFn){
    var errors=[],warnings=[];
    if(!model||model.kind!=='record-map')return {errors:errors,warnings:['اس فائل کے لیے بصری ساخت دستیاب نہیں؛ خام متن جانچیں'],keys:{}};
    var ids=Object.create(null),keyIds=Object.create(null);
    model.nodes.forEach(function(n){ids[String(n.id)]=1;});
    model.nodes.forEach(function(n){
        if(!String(n.label||'').trim())errors.push('خالی ربرک عنوان: '+n.id);
        if(n.parentInvalid || (n.parentId&&!ids[String(n.parentId)]))errors.push('والد ربرک موجود نہیں: '+n.id+' → '+n.parentId);
        if(n.parentId && (String(n.parentId)===String(n.id)||descendants(model,n.id).indexOf(String(n.parentId))!==-1))errors.push('والدینی چکر: '+n.id);
        var k=makeKey(n.fullPath,keyFn);
        (keyIds[k]||(keyIds[k]=[])).push(String(n.id));
        if(n.remediesField && !isObject(n.record[n.remediesField]))errors.push('دواؤں کا خانہ آبجیکٹ نہیں: '+n.id);
        if(n.remediesField&&isObject(n.record[n.remediesField])){
            Object.keys(n.record[n.remediesField]).forEach(function(code){
                var grade=n.record[n.remediesField][code];
                if(!String(code).trim())errors.push('دوا کا خالی نام: '+n.id);
                if(grade===null||grade===undefined||String(grade).trim()==='')warnings.push('دوا کا خالی درجہ: '+n.id+' / '+code);
            });
        }
    });
    Object.keys(keyIds).forEach(function(k){if(keyIds[k].length>1)warnings.push('ترجمے کی کلید دہرائی گئی: '+k+' ('+keyIds[k].length+')');});
    return {errors:errors,warnings:warnings,keys:keyIds};
}
var core={clone:clone,keyFallback:repKeyFallback,keyFor:makeKey,analyzeChapter:analyzeChapter,analyzeTranslation:analyzeTranslation,refreshPaths:refreshPaths,descendants:descendants,validateModel:validateModel};
root.RepEditorCore=core;
if(typeof module!=='undefined'&&module.exports)module.exports=core;
if(!root.document)return;

var doc=root.document;
var rootEl=doc.getElementById('repEditorRoot');
if(!rootEl)return;
var state={chapter:null,translation:null,selectedId:null,selectedIds:[],search:'',expanded:Object.create(null),undo:[],redo:[],associatedKeys:Object.create(null),mappingDecisions:Object.create(null),showOrphans:false,activeTab:'rubric',translationInputSnapshot:false};
var text={
    openChapter:{ur:'باب کی فائل کھولیں',en:'Open chapter file',roman:'Bab ki file kholen'},
    openTranslation:{ur:'اردو ترجمے کی فائل کھولیں',en:'Open Urdu translation file',roman:'Urdu tarjume ki file kholen'},
    fileOpen:{ur:'فائل کھلی',en:'File opened',roman:'File khuli'},
    noFile:{ur:'ابھی فائل نہیں کھلی',en:'No file open',roman:'Abhi file nahi khuli'},
    openFirst:{ur:'پہلے ایک باب کی فائل کھولیں',en:'Open a chapter file to begin',roman:'Pehle bab ki file kholen'},
    saved:{ur:'محفوظ ہو گیا',en:'Saved',roman:'Mehfooz ho gaya'},
    downloaded:{ur:'فائل اتارنے کے لیے تیار ہے؛ اصل جگہ پر خود رکھیں',en:'Download created; replace the original file yourself',roman:'File download ho gayi; asal jagah par khud rakhein'},
    bothSaved:{ur:'دونوں فائلیں محفوظ ہو گئیں',en:'Both files saved',roman:'Dono files mehfooz ho gayin'},
    chapterSaved:{ur:'باب محفوظ ہو گیا',en:'Chapter saved',roman:'Bab mehfooz ho gaya'},
    translationSaved:{ur:'ترجمہ محفوظ ہو گیا',en:'Translation saved',roman:'Tarjuma mehfooz ho gaya'},
    partialSave:{ur:'ایک فائل محفوظ ہوئی؛ دوسری میں مسئلہ آیا، مسودہ محفوظ ہے',en:'One file saved; the other failed. Its draft is retained',roman:'Aik file mehfooz hui; doosri mein masla aya, musawadda baqi hai'},
    invalidJson:{ur:'درست JSON فائل منتخب کریں',en:'Choose a valid JSON file',roman:'Durust JSON file muntakhib karein'},
    replaceDirty:{ur:'اس فائل میں غیر محفوظ تبدیلیاں ہیں؛ نئی فائل کھولنے سے وہ ختم ہو جائیں گی۔ جاری رکھیں؟',en:'This file has unsaved changes. Opening another will discard them. Continue?',roman:'Is file mein ghair mehfooz tabdeeliyan hain; nayi file kholne se zaya hongi. Jari rakhein?'},
    locked:{ur:'یہ ترجمہ قفل شدہ ہے؛ متن نہیں بدلے گا',en:'This translation is locked and cannot be edited',roman:'Yeh tarjuma lock hai; matn nahi badlega'},
    noSelection:{ur:'پہلے درخت سے ربرک منتخب کریں',en:'Select a rubric from the tree first',roman:'Pehle darakht se rubric muntakhib karein'},
    titleRequired:{ur:'ربرک کا عنوان خالی نہیں ہو سکتا',en:'Rubric title cannot be empty',roman:'Rubric ka unwan khali nahi ho sakta'},
    noTranslation:{ur:'اردو ترجمے کی فائل ابھی نہیں کھلی',en:'The Urdu translation file is not open',roman:'Urdu tarjume ki file abhi nahi khuli'},
    rawApplied:{ur:'خام متن جانچ کر لاگو کیا گیا',en:'Raw text validated and applied',roman:'Khaam matn jaanch kar laagu kiya gaya'},
    rawInvalid:{ur:'متن درست JSON نہیں؛ مسودہ نہیں بدلا',en:'The text is not valid JSON; the draft was not changed',roman:'Matn durust JSON nahi; musawadda nahi badla'},
    mappingPending:{ur:'پرانی اور نئی کلید کی نسبت آپ کے فیصلے کی منتظر ہے',en:'The old-to-new key link needs your decision',roman:'Purani aur nayi kunji ka rabt aap ke faislay ka muntazir hai'},
    mapOld:{ur:'پرانا ترجمہ نئی کلید پر منتقل کریں',en:'Move old translation to the new key',roman:'Purana tarjuma nayi kunji par muntaqil karein'},
    keepOld:{ur:'پرانا ترجمہ پرانی کلید پر رہنے دیں',en:'Keep the translation at the old key',roman:'Purana tarjuma purani kunji par rehne dein'},
    noUntranslated:{ur:'نئی ربرک کا اردو متن خالی رہے گا؛ کوئی ترجمہ خود سے نہیں بنے گا',en:'A new rubric stays untranslated; no text is generated',roman:'Nayi rubric ka Urdu matn khali rahega; koi tarjuma khud nahi banega'},
    newRubric:{ur:'نئی ربرک کا عنوان لکھیں',en:'Enter the new rubric label',roman:'Nayi rubric ka unwan likhein'},
    splitSecond:{ur:'تقسیم کے دوسرے حصے کا عنوان لکھیں',en:'Enter the second split label',roman:'Taqseem ke doosray hissay ka unwan likhein'},
    splitChild:{ur:'کیا دوسرا حصہ منتخب ربرک کی ذیلی ربرک ہو؟ ٹھیک = ہاں، منسوخ = ہم درجہ',en:'Should the second part be a child? OK = yes; Cancel = sibling',roman:'Doosra hissa zeli ho? Theek = haan; mansookh = hum darja'},
    splitNote:{ur:'تقسیم ہو گئی؛ دوائیں پہلے ربرک میں رہیں، دوسری میں کوئی دوا یا ترجمہ نقل نہیں کیا گیا',en:'Split created; remedies stay on the first rubric, none were copied to the second',roman:'Taqseem hui; dawayein pehli rubric mein rahin, doosri mein kuch copy nahi hua'},
    mergeSameParent:{ur:'جوڑنے کے لیے دونوں ربرکس پہلے ایک ہی والد کے نیچے رکھیں',en:'Move both rubrics under the same parent before merging',roman:'Jorne se pehle dono rubrics aik hi walid ke neeche rakhein'},
    mergeGradeConflict:{ur:'مشترک دوا کے درجے مختلف ہیں؛ پہلے دونوں ربرکس میں درجہ ایک جیسا کریں، پھر جوڑیں',en:'Conflicting grades for a shared remedy; resolve them before merging',roman:'Mushtarka dawa ke darjay mukhtalif hain; pehle barabar karein'},
    mergeTitle:{ur:'جوڑی ہوئی ربرک کا نیا عنوان لکھیں',en:'Enter the merged rubric label',roman:'Jori hui rubric ka naya unwan likhein'},
    deleteConfirm:{ur:'یہ ربرک حذف کریں؟ اس کی ترجمہ کلید ترجمہ فائل میں محفوظ رہے گی',en:'Delete this rubric? Its translation key remains in the translation file',roman:'Yeh rubric hazf karein? Is ki tarjuma kunji file mein baqi rahegi'},
    deleteParent:{ur:'اس ربرک کے ذیلی ربرکس ہیں؛ اسے حذف کرکے ذیلی ربرکس کو اس کے والد کے نیچے منتقل کریں؟',en:'This rubric has children. Delete it and move children to its parent?',roman:'Is rubric ki zeli rubrics hain; isay hazf kar ke bachon ko walid ke neeche le jayen?'},
    removeTranslation:{ur:'اس کلید کی اردو عبارت حذف کریں؟',en:'Remove the Urdu text for this key?',roman:'Is kunji ki Urdu ibarat hazf karein?'},
    conflictSave:{ur:'کچھ ترجمے نئی ربرک کلید سے ابھی نہیں جڑے؛ پرانی کلیدیں محفوظ رہیں گی۔ پھر بھی دونوں فائلیں محفوظ کریں؟',en:'Some translations are not linked to the new rubric keys; old keys will be retained. Save both anyway?',roman:'Kuch tarjume nayi kunji se nahi juray; purani kunjiyan mehfooz rahengi. Phir bhi save karein?'},
    rawUnknown:{ur:'اس باب کی ساخت پہچانی نہیں گئی؛ باب کا خام متن دیکھیں یا تدوین کریں',en:'This chapter structure is not recognized; review or edit its raw text',roman:'Is bab ki saakht pehchani nahi gayi; bab ka khaam matn dekhein ya badlein'},
    translationRawUnknown:{ur:'ترجمے کی ساخت پہچانی نہیں گئی؛ حفاظت کے لیے خام متن صرف مطالعے کے لیے ہے',en:'Translation structure is not recognized; raw text is read-only for protection',roman:'Tarjume ki saakht pehchani nahi gayi; hifazat ke liye khaam matn sirf mutala hai'},
    validationOk:{ur:'ساختی جانچ میں کوئی رکاوٹ نہیں ملی',en:'No structural errors found',roman:'Saakhti jaanch mein rukawat nahi mili'},
    unmatched:{ur:'بے جوڑ ترجمے',en:'Unmatched translations',roman:'Be jor tarjume'},
    noOrphans:{ur:'کوئی بے جوڑ ترجمہ نہیں',en:'No unmatched translations',roman:'Koi be jor tarjuma nahi'},
    savedDraft:{ur:'مسودہ محفوظ ہے',en:'Draft saved',roman:'Musawadda mehfooz hai'},
    unsavedDraft:{ur:'مسودے میں غیر محفوظ تبدیلیاں ہیں',en:'There are unsaved changes',roman:'Musawadday mein tabdeeliyan hain'},
    noChanges:{ur:'کوئی تبدیلی نہیں',en:'No changes',roman:'Koi tabdeeli nahi'},
    unavailable:{ur:'یہ عمل اس فائل کی پہچانی ہوئی ساخت میں دستیاب ہے؛ خام متن کا راستہ کھولیں',en:'This action requires a recognized structure; use raw text mode',roman:'Yeh amal pehchani saakht mein dastiyab hai; khaam matn kholen'}
};
function L(key){var v=text[key];if(!v)return String(key);var lang=root.currentLang||'ur';return v[lang]||v.ur;}
function say(ur,en,roman){var lang=root.currentLang||'ur';return ({ur:ur,en:en,roman:roman})[lang]||ur;}
function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(ch){return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]);});}
function sortedChildren(model,parentId){
    if(!model||model.kind!=='record-map')return [];
    return model.nodes.filter(function(n){
        var p=n.parentId==null?null:String(n.parentId);
        if(parentId==null)return p===null||!model.byId[p];
        return p===String(parentId);
    }).sort(function(a,b){return a.order===b.order?a.index-b.index:a.order-b.order;});
}
function currentKey(node){
    if(!node)return '';
    var fn=typeof root.repRubKey==='function'?root.repRubKey:null;
    return makeKey(node.fullPath,fn);
}
function findNode(id){return state.chapter&&state.chapter.model&&state.chapter.model.byId[String(id)]||null;}
function translationMap(){return state.translation&&state.translation.model&&state.translation.model.kind==='rubric-map'?state.translation.model.rubrics:null;}
function isLocked(key){return !!(state.translation&&state.translation.model&&state.translation.model.locked.indexOf(String(key))!==-1);}
function objectEqual(a,b){return JSON.stringify(a)===JSON.stringify(b);}
function getIndent(raw){var m=String(raw||'').match(/\n([ \t]+)"/);return m?m[1].length:2;}
function parseJsonText(raw){var s=String(raw||'').replace(/^\uFEFF/,'');return JSON.parse(s);}
function orderedNodeIds(model){
    var out=[],seen=Object.create(null);
    function walk(parentId){sortedChildren(model,parentId).forEach(function(n){var id=String(n.id);if(seen[id])return;seen[id]=1;out.push(id);walk(id);});}
    walk(null);
    model.nodes.forEach(function(n){var id=String(n.id);if(!seen[id]){seen[id]=1;out.push(id);walk(id);}});
    return out;
}
function rebuildOrderedDoc(chapter){
    if(!chapter||!chapter.model||chapter.model.kind!=='record-map')return;
    var old=chapter.doc,next={},ids=orderedNodeIds(chapter.model),set=Object.create(null);
    ids.forEach(function(id){if(Object.prototype.hasOwnProperty.call(old,id)){next[id]=old[id];set[id]=1;}});
    Object.keys(old).forEach(function(k){if(!set[k])next[k]=old[k];});
    chapter.doc=next;
    chapter.model.doc=next;
}
function normalizeOrder(chapter){
    if(!chapter||!chapter.model||chapter.model.kind!=='record-map')return;
    var ids=orderedNodeIds(chapter.model),field=chapter.model.fields.order;
    ids.forEach(function(id,index){var n=chapter.model.byId[id];n.order=index;n.index=index;if(field)n.record[field]=index;});
    rebuildOrderedDoc(chapter);
}
function baselineKeys(model){
    var out=Object.create(null);
    if(model&&model.kind==='record-map')model.nodes.forEach(function(n){out[String(n.id)]=currentKey(n);});
    return out;
}
function initAssociatedKeys(){
    if(!state.chapter||state.chapter.model.kind!=='record-map')return;
    var base=state.chapter.baseKeys||{};
    state.chapter.model.nodes.forEach(function(n){
        var id=String(n.id);
        if(!Object.prototype.hasOwnProperty.call(state.associatedKeys,id))state.associatedKeys[id]=base[id]||'';
    });
}
function chooseRecordId(model){
    var ids=model&&model.ids||[], nums=[],prefix=null;
    ids.forEach(function(id){var m=String(id).match(/^([A-Za-z_-]*)(\d+)$/);if(m){prefix=prefix===null?m[1]:(prefix===m[1]?prefix:null);nums.push(Number(m[2]));}});
    if(prefix!==null&&nums.length){var next=Math.max.apply(Math,nums)+1;var candidate=prefix+next;while(model.byId[candidate])candidate=prefix+(++next);return candidate;}
    var i=1,c='editor_'+i;while(model.byId[c])c='editor_'+(++i);return c;
}
function updateRecordPath(chapter){
    if(!chapter||!chapter.model||chapter.model.kind!=='record-map')return;
    core.refreshPaths(chapter.model,chapter.doc);
}
function childrenOf(id){return state.chapter?sortedChildren(state.chapter.model,id):[];}
function allCurrentKeys(){
    var set=Object.create(null);
    if(state.chapter&&state.chapter.model.kind==='record-map')state.chapter.model.nodes.forEach(function(n){var k=currentKey(n);if(k)set[k]=1;});
    return set;
}
function currentMappingFor(id){
    if(!state.chapter||!state.translation||state.translation.model.kind!=='rubric-map')return null;
    var node=findNode(id);if(!node)return null;
    var oldKey=state.associatedKeys[String(id)]||'';var newKey=currentKey(node);
    if(!oldKey||oldKey===newKey)return null;
    var oldValue=state.translation.model.rubrics[oldKey];
    if(oldValue===undefined)return null;
    var decision=state.mappingDecisions[String(id)+'>'+newKey];
    if(decision)return null;
    return {id:String(id),oldKey:oldKey,newKey:newKey,oldValue:String(oldValue),locked:isLocked(oldKey)};
}
function orphanKeys(){
    var map=translationMap(),current=allCurrentKeys();
    if(!map)return [];
    return Object.keys(map).filter(function(k){return !current[k];}).sort(function(a,b){return a.localeCompare(b);});
}
function pendingMappings(){
    if(!state.chapter||!state.translation||state.translation.model.kind!=='rubric-map')return [];
    var out=[];state.chapter.model.nodes.forEach(function(n){var p=currentMappingFor(n.id);if(p)out.push(p);});return out;
}
function currentText(){var n=findNode(state.selectedId);return n?currentKey(n):'';}
function renderFileMeta(){
    var chName=doc.getElementById('rpeChapterName'),urName=doc.getElementById('rpeTranslationName');
    var chMeta=doc.getElementById('rpeChapterMeta'),urMeta=doc.getElementById('rpeTranslationMeta');
    if(chName)chName.textContent=state.chapter?state.chapter.name:L('noFile');
    if(urName)urName.textContent=state.translation?state.translation.name:L('noFile');
    if(chMeta)chMeta.textContent=state.chapter?(state.chapter.model.kind==='record-map'?say(state.chapter.model.nodes.length+' ربرکس',state.chapter.model.nodes.length+' rubrics',state.chapter.model.nodes.length+' rubrics'):L('rawUnknown')):'—';
    if(urMeta)urMeta.textContent=state.translation?(state.translation.model.kind==='rubric-map'?say(Object.keys(state.translation.model.rubrics).length+' ترجمے',Object.keys(state.translation.model.rubrics).length+' translations',Object.keys(state.translation.model.rubrics).length+' tarjume'):L('translationRawUnknown')):'—';
}
function setBadge(message,kind){var el=doc.getElementById('rpeDirtyBadge');if(!el)return;el.textContent=message;el.className='rpe-badge'+(kind?' '+kind:'');}
function renderStatus(){
    var el=doc.getElementById('rpeStatus'), save=doc.getElementById('rpeSaveStatus');
    var chDirty=state.chapter&&state.chapter.dirty,urDirty=state.translation&&state.translation.dirty;
    if(el){
        if(!state.chapter)el.textContent=L('openFirst');
        else if(chDirty||urDirty)el.textContent=L('unsavedDraft');
        else el.textContent=say('مسودہ محفوظ ہے','Draft is saved','Musawadda mehfooz hai');
    }
    if(save){
        if(chDirty||urDirty){save.textContent=L('unsavedDraft');}
        else save.textContent=L('savedDraft');
    }
    if(chDirty||urDirty)setBadge(L('unsavedDraft'),'warn');
    else if(state.chapter||state.translation)setBadge(L('savedDraft'),'good');
    else setBadge(L('noFile'),'');
}
function markDirty(){
    if(state.chapter)state.chapter.dirty=!objectEqual(state.chapter.doc,state.chapter.baseDoc);
    if(state.translation)state.translation.dirty=!objectEqual(state.translation.doc,state.translation.baseDoc);
    renderStatus();updateButtons();
}
function updateButtons(){
    var hasCh=!!state.chapter,hasUr=!!state.translation,hasNode=!!findNode(state.selectedId),structured=hasCh&&state.chapter.model.kind==='record-map';
    function disabled(id,val){var e=doc.getElementById(id);if(e)e.disabled=!!val;}
    disabled('rpeUndo',!state.undo.length);disabled('rpeRedo',!state.redo.length);
    ['rpeSaveChapter'].forEach(function(id){disabled(id,!hasCh);});
    disabled('rpeSaveTranslation',!hasUr);disabled('rpeSaveBoth',!(hasCh&&hasUr));
    rootEl.querySelectorAll('[data-rpe-action="add-child"],[data-rpe-action="add-sibling"],[data-rpe-action="split"],[data-rpe-action="delete"],[data-rpe-action="move-up"],[data-rpe-action="move-down"]').forEach(function(b){b.disabled=!(structured&&hasNode);});
    var addRoot=rootEl.querySelector('[data-rpe-action="add-root"]');if(addRoot)addRoot.disabled=!structured;
    var merge=rootEl.querySelector('[data-rpe-action="merge"]');if(merge)merge.disabled=!(structured&&state.selectedIds.length===2);
    var addRem=rootEl.querySelector('[data-rpe-action="add-remedy"]');if(addRem)addRem.disabled=!(structured&&hasNode);
    var transDelete=rootEl.querySelector('[data-rpe-action="delete-translation"]');if(transDelete)transDelete.disabled=!(state.translation&&state.translation.model.kind==='rubric-map'&&hasNode&&!isLocked(currentText()));
}
function renderCounts(){
    var m=state.chapter&&state.chapter.model.kind==='record-map'?state.chapter.model:null,map=translationMap(),keys=Object.create(null),matched=0,missing=0,orphans=orphanKeys().length;
    if(m)m.nodes.forEach(function(n){var k=currentKey(n);if(!k)return;keys[k]=1;});
    var unique=Object.keys(keys);
    unique.forEach(function(k){if(map&&typeof map[k]==='string'&&map[k].trim())matched++;else missing++;});
    var a=doc.getElementById('rpeMatched'),b=doc.getElementById('rpeMissing'),c=doc.getElementById('rpeOrphans');
    if(a)a.textContent=say('ملاپ: '+(map?matched:'—'),'Matched: '+(map?matched:'—'),'Milap: '+(map?matched:'—'));
    if(b)b.textContent=say('ترجمہ درکار: '+(map?missing:'—'),'Translation needed: '+(map?missing:'—'),'Tarjuma darkar: '+(map?missing:'—'));
    if(c)c.textContent=say('بے جوڑ پرانے ترجمے: '+(map?orphans:'—'),'Unmatched old translations: '+(map?orphans:'—'),'Be jor puranay tarjume: '+(map?orphans:'—'));
    var sc=doc.getElementById('rpeSelectionCount');if(sc)sc.textContent=say(state.selectedIds.length+' منتخب',state.selectedIds.length+' selected',state.selectedIds.length+' muntakhib');
}
function filteredTreeIds(){
    if(!state.chapter||state.chapter.model.kind!=='record-map')return {visible:Object.create(null),matches:Object.create(null)};
    var q=String(state.search||'').trim().toLowerCase(),visible=Object.create(null),matches=Object.create(null);
    if(!q){state.chapter.model.nodes.forEach(function(n){visible[String(n.id)]=1;});return {visible:visible,matches:matches};}
    function visit(n){
        var self=(String(n.label||'').toLowerCase().indexOf(q)!==-1||String(n.fullPath||'').toLowerCase().indexOf(q)!==-1),child=false;
        childrenOf(n.id).forEach(function(c){if(visit(c))child=true;});
        if(self||child)visible[String(n.id)]=1;
        if(self)matches[String(n.id)]=1;
        return self||child;
    }
    childrenOf(null).forEach(visit);
    state.chapter.model.nodes.forEach(function(n){if(!visible[String(n.id)]&&!n.parentId)visit(n);});
    return {visible:visible,matches:matches};
}
function renderTree(){
    var el=doc.getElementById('rpeTree');if(!el)return;
    if(!state.chapter){el.innerHTML='<div class="rpe-empty">'+esc(say('باب کی فائل کھولنے کے بعد درخت یہاں دکھے گا','Open a chapter file to show its tree','Bab ki file kholne ke baad darakht yahan dikhega'))+'</div>';return;}
    if(state.chapter.model.kind!=='record-map'){
        el.innerHTML='<div class="rpe-empty">'+esc(L('rawUnknown'))+'</div>';return;
    }
    var filtered=filteredTreeIds(),q=String(state.search||'').trim();
    function renderNode(n,depth){
        if(!filtered.visible[String(n.id)])return '';
        var children=childrenOf(n.id).filter(function(c){return filtered.visible[String(c.id)];});
        var expanded=!!q||!!state.expanded[String(n.id)],remedies=n.remediesField&&isObject(n.record[n.remediesField])?Object.keys(n.record[n.remediesField]).length:0;
        var row='<div class="rpe-tree-row'+(String(n.id)===String(state.selectedId)?' selected':'')+'" style="margin-left:'+(Math.min(depth,12)*14)+'px">';
        row+='<input class="rpe-tree-pick" type="checkbox" aria-label="'+esc(say('ضم کے لیے منتخب','Select for merge','Jor ke liye muntakhib'))+'" data-rpe-check-id="'+esc(n.id)+'"'+(state.selectedIds.indexOf(String(n.id))!==-1?' checked':'')+'>';
        row+='<button type="button" class="rpe-tree-toggle" data-rpe-toggle="'+esc(n.id)+'" aria-label="'+esc(expanded?'شاخ بند کریں':'شاخ کھولیں')+'">'+(children.length?(expanded?'▾':'▸'):'·')+'</button>';
        row+='<button type="button" class="rpe-tree-label" data-rpe-select-id="'+esc(n.id)+'" title="'+esc(n.fullPath)+'">'+esc(n.label)+'</button>';
        row+='<span class="rpe-tree-count">'+remedies+'</span></div>';
        return '<li class="rpe-tree-item" role="treeitem" aria-expanded="'+(children.length?expanded:'false')+'">'+row+(children.length&&expanded?'<ul class="rpe-tree-list">'+children.map(function(c){return renderNode(c,depth+1);}).join('')+'</ul>':'')+'</li>';
    }
    var roots=childrenOf(null).filter(function(n){return filtered.visible[String(n.id)];});
    el.innerHTML=roots.length?'<ul class="rpe-tree-list">'+roots.map(function(n){return renderNode(n,0);}).join('')+'</ul>':'<div class="rpe-empty">'+esc(say('کوئی ربرک نہیں ملی','No rubric found','Koi rubric nahi mili'))+'</div>';
}
function renderParentOptions(node){
    var select=doc.getElementById('rpeParent');if(!select)return;
    var options=['<option value="">'+esc(say('جڑ','Root','Jar'))+'</option>'];
    if(!state.chapter||state.chapter.model.kind!=='record-map'){select.innerHTML=options.join('');return;}
    var blocked=Object.create(null);blocked[String(node.id)]=1;core.descendants(state.chapter.model,node.id).forEach(function(id){blocked[id]=1;});
    orderedNodeIds(state.chapter.model).forEach(function(id){var n=findNode(id);if(!n||blocked[id])return;var label=(n.fullPath||n.label);options.push('<option value="'+esc(id)+'">'+esc(label)+'</option>');});
    select.innerHTML=options.join('');select.value=node.parentId==null?'':String(node.parentId);
}
function renderRemedies(node){
    var body=doc.getElementById('rpeRemedies');if(!body)return;
    if(!node){body.innerHTML='<tr><td colspan="3">'+esc(say('پہلے ربرک منتخب کریں','Select a rubric first','Pehle rubric muntakhib karein'))+'</td></tr>';return;}
    var field=node.remediesField,rem=field&&isObject(node.record[field])?node.record[field]:{},codes=Object.keys(rem).sort(function(a,b){return a.localeCompare(b);});
    if(!codes.length){body.innerHTML='<tr><td colspan="3">'+esc(say('اس ربرک میں دوا درج نہیں','No remedies on this rubric','Is rubric mein dawa darj nahi'))+'</td></tr>';return;}
    body.innerHTML=codes.map(function(code){
        var val=rem[code],str=String(val),opts=['1','2','3'];if(opts.indexOf(str)===-1)opts.push(str);
        var select='<select class="rpe-grade-select" data-rpe-grade="'+esc(code)+'" aria-label="'+esc(code)+' '+esc(say('کا درجہ','grade','ka darja'))+'">'+opts.map(function(o){return '<option value="'+esc(o)+'"'+(o===str?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select>';
        return '<tr><td>'+esc(code)+'</td><td>'+select+'</td><td><button type="button" class="btn btn-danger btn-xs" data-rpe-remove-remedy="'+esc(code)+'" title="'+esc(say('دوا حذف کریں','Remove remedy','Dawa hazf karein'))+'">×</button></td></tr>';
    }).join('');
}
function renderSelected(){
    var node=findNode(state.selectedId),label=doc.getElementById('rpeLabel'),full=doc.getElementById('rpeFullPath'),idEl=doc.getElementById('rpeSelectedId'),parent=doc.getElementById('rpeParent'),weight=doc.getElementById('rpeWeight'),size=doc.getElementById('rpeSize'),order=doc.getElementById('rpeOrder');
    var structured=!!(state.chapter&&state.chapter.model.kind==='record-map');
    if(idEl)idEl.textContent=node?String(node.id):'—';
    if(label){label.disabled=!node||!structured;label.value=node?String(node.label||''):'';}
    if(full)full.textContent=node?String(node.fullPath||''):'—';
    if(parent){parent.disabled=!node||!structured;renderParentOptions(node||{id:'',parentId:null});}
    var display=node&&isObject(node.record.display)?node.record.display:{};
    if(weight){weight.disabled=!node||!structured;weight.value=(display.weight==='bold'||display.weight==='normal')?display.weight:(node&&node.parentId==null?'bold':'normal');}
    if(size){size.disabled=!node||!structured;size.value=['small','large'].indexOf(display.size)!==-1?display.size:'normal';}
    if(order){order.disabled=!node||!structured;var siblings=node?childrenOf(node.parentId):[];order.value=node?String(Math.max(1,siblings.findIndex(function(n){return String(n.id)===String(node.id);})+1)):'';}
    var lock=doc.getElementById('rpeNodeLock');if(lock)lock.textContent=node&&state.chapter&&state.chapter.model.kind==='record-map'?say('شناخت '+node.id,'ID '+node.id,'Shanakht '+node.id):'';
    renderRemedies(node);
    renderTranslation(node);
    rootEl.querySelectorAll('[data-rpe-case]').forEach(function(b){b.classList.toggle('sel',!!node&&String(node.label||'')===applyCase(String(node.label||''),b.getAttribute('data-rpe-case')));});
}
function applyCase(value,mode){
    var s=String(value||'');
    if(mode==='upper')return s.toUpperCase();
    if(mode==='lower')return s.toLowerCase();
    if(mode==='title')return s.toLowerCase().replace(/(^|[\s,()\[\]-])([a-z])/g,function(_,a,b){return a+b.toUpperCase();});
    return s;
}
function renderTranslation(node){
    var textarea=doc.getElementById('rpeTranslationText'),keyEl=doc.getElementById('rpeKey'),stateEl=doc.getElementById('rpeTranslationState'),mapping=doc.getElementById('rpeMapping');
    var tmodel=state.translation&&state.translation.model,map=translationMap(),key=node?currentKey(node):'';
    if(keyEl)keyEl.textContent=key||'—';
    if(textarea){
        var val=map&&key&&typeof map[key]==='string'?map[key]:'';
        textarea.value=val;
        textarea.disabled=!(node&&tmodel&&tmodel.kind==='rubric-map')||isLocked(key);
        textarea.placeholder=!state.translation?L('noTranslation'):(tmodel&&tmodel.kind==='raw'?L('translationRawUnknown'):say('اس ربرک کی کوئی اردو عبارت موجود نہیں','No Urdu text exists for this rubric','Is rubric ki Urdu ibarat mojood nahi'));
    }
    if(stateEl)stateEl.textContent=isLocked(key)?say('🔒 قفل شدہ','🔒 Locked','🔒 Qufl shuda'):(tmodel&&tmodel.kind==='rubric-map'?say('کلید دیکھی گئی','Key checked','Kunji dekhi gayi'):(tmodel?L('translationRawUnknown'):''));
    if(mapping){var pend=node?currentMappingFor(node.id):null;
        if(pend){mapping.hidden=false;mapping.innerHTML='<strong>'+esc(L('mappingPending'))+'</strong><div>'+esc(say('پرانی کلید: ','Old key: ','Purani kunji: '))+'<code>'+esc(pend.oldKey)+'</code></div><div>'+esc(say('نئی کلید: ','New key: ','Nayi kunji: '))+'<code>'+esc(pend.newKey)+'</code></div>'+(!pend.locked?'<div class="rpe-translation-actions"><button type="button" class="btn btn-warning btn-xs" data-rpe-map-old="'+esc(node.id)+'">'+esc(L('mapOld'))+'</button><button type="button" class="btn btn-light btn-xs" data-rpe-keep-old="'+esc(node.id)+'">'+esc(L('keepOld'))+'</button></div>':'<div>'+esc(L('locked'))+'</div>')+'<small>'+esc(L('noUntranslated'))+'</small>';}
        else {mapping.hidden=true;mapping.innerHTML='';}
    }
    renderOrphanList();
}
function renderOrphanList(){
    var box=doc.getElementById('rpeOrphanList');if(!box)return;
    if(!state.showOrphans){box.hidden=true;box.innerHTML='';return;}
    var keys=orphanKeys();box.hidden=false;
    if(!keys.length){box.innerHTML='<div class="rpe-empty">'+esc(L('noOrphans'))+'</div>';return;}
    box.innerHTML=keys.slice(0,150).map(function(k){return '<div class="rpe-orphan-row"><code title="'+esc(k)+'">'+esc(k)+'</code><button type="button" class="btn btn-light btn-xs" data-rpe-orphan-key="'+esc(k)+'">'+esc(say('منتخب ربرک سے جوڑیں','Link to selected rubric','Muntakhib rubric se jorein'))+'</button></div>';}).join('')+(keys.length>150?'<div class="rpe-help">'+esc(say('مزید '+(keys.length-150)+' اندراجات فہرست میں نہیں دکھائے گئے','More entries omitted: '+(keys.length-150),'Mazeed '+(keys.length-150)+' entries nahi dikhaye'))+'</div>':'');
}
function renderRawEditors(){
    var panel=doc.getElementById('rpeRawEditors');if(!panel)return;
    var chapterArea=doc.getElementById('rpeChapterRaw'),translationArea=doc.getElementById('rpeTranslationRaw');
    if(chapterArea)chapterArea.value=state.chapter?JSON.stringify(state.chapter.doc,null,state.chapter.indent||2):'';
    if(translationArea){translationArea.value=state.translation?JSON.stringify(state.translation.doc,null,state.translation.indent||2):'';translationArea.readOnly=true;}
}
function renderValidation(){
    var el=doc.getElementById('rpeValidation');if(!el)return;
    var items=[];
    if(state.chapter){
        var res=core.validateModel(state.chapter.model,root.repRubKey);
        res.errors.forEach(function(x){items.push({type:'error',text:x});});
        res.warnings.forEach(function(x){items.push({type:'warn',text:x});});
        if(state.translation&&state.translation.model.kind==='rubric-map'){
            var miss=0;Object.keys(res.keys).forEach(function(k){if(typeof state.translation.model.rubrics[k]!=='string'||!state.translation.model.rubrics[k].trim())miss++;});
            if(miss)items.push({type:'warn',text:say('ترجمہ درکار کلیدیں: '+miss,'Translation needed for '+miss+' keys','Tarjuma darkar: '+miss)});
            var orph=orphanKeys().length;if(orph)items.push({type:'warn',text:say('بے جوڑ پرانے ترجمے: '+orph,'Unmatched old translations: '+orph,'Be jor puranay tarjume: '+orph)});
            var pend=pendingMappings().length;if(pend)items.push({type:'warn',text:say('تصدیق طلب نسبتیں: '+pend,'Links awaiting confirmation: '+pend,'Tasdeeq darkar rabt: '+pend)});
        }
    }
    if(state.translation&&state.translation.model.kind==='rubric-map'){
        Object.keys(state.translation.model.rubrics).forEach(function(k){if(typeof state.translation.model.rubrics[k]!=='string')items.push({type:'error',text:say('ترجمہ عبارت متنی نہیں: ','Translation value is not text: ','Tarjuma matn nahi: ')+k});});
    }
    if(state.translation&&state.translation.model.kind==='raw')items.push({type:'warn',text:L('translationRawUnknown')});
    if(!items.length&&state.chapter)items.push({type:'item',text:L('validationOk')});
    el.innerHTML=items.map(function(i){return '<div class="item '+i.type+'">'+esc(i.text)+'</div>';}).join('');
}
function renderTabs(){
    rootEl.querySelectorAll('[data-rpe-tab]').forEach(function(b){var on=b.getAttribute('data-rpe-tab')===state.activeTab;b.classList.toggle('on',on);b.setAttribute('aria-selected',on?'true':'false');});
    rootEl.querySelectorAll('[data-rpe-pane]').forEach(function(p){var on=p.getAttribute('data-rpe-pane')===state.activeTab;p.hidden=!on;p.classList.toggle('on',on);});
}
function renderAll(){
    renderFileMeta();renderStatus();renderCounts();renderTree();renderSelected();renderTabs();renderRawEditors();renderValidation();updateButtons();
}
function pushUndo(){
    state.undo.push({chapterDoc:state.chapter?clone(state.chapter.doc):null,translationDoc:state.translation?clone(state.translation.doc):null,selectedId:state.selectedId,selectedIds:state.selectedIds.slice(),associatedKeys:clone(state.associatedKeys),mappingDecisions:clone(state.mappingDecisions),expanded:clone(state.expanded)});
    if(state.undo.length>60)state.undo.shift();state.redo=[];
}
function restoreSnapshot(snap){
    if(state.chapter&&snap.chapterDoc){state.chapter.doc=snap.chapterDoc;state.chapter.model=core.analyzeChapter(state.chapter.doc,root.repRubKey);}
    if(state.translation&&snap.translationDoc){state.translation.doc=snap.translationDoc;state.translation.model=core.analyzeTranslation(state.translation.doc);}
    state.selectedId=snap.selectedId;state.selectedIds=snap.selectedIds||[];state.associatedKeys=snap.associatedKeys||Object.create(null);state.mappingDecisions=snap.mappingDecisions||Object.create(null);state.expanded=snap.expanded||Object.create(null);
    markDirty();renderAll();
}
function doUndo(){if(!state.undo.length)return;state.redo.push({chapterDoc:state.chapter?clone(state.chapter.doc):null,translationDoc:state.translation?clone(state.translation.doc):null,selectedId:state.selectedId,selectedIds:state.selectedIds.slice(),associatedKeys:clone(state.associatedKeys),mappingDecisions:clone(state.mappingDecisions),expanded:clone(state.expanded)});restoreSnapshot(state.undo.pop());}
function doRedo(){if(!state.redo.length)return;state.undo.push({chapterDoc:state.chapter?clone(state.chapter.doc):null,translationDoc:state.translation?clone(state.translation.doc):null,selectedId:state.selectedId,selectedIds:state.selectedIds.slice(),associatedKeys:clone(state.associatedKeys),mappingDecisions:clone(state.mappingDecisions),expanded:clone(state.expanded)});restoreSnapshot(state.redo.pop());}
function commit(mutator){pushUndo();mutator();if(state.chapter){state.chapter.model=core.analyzeChapter(state.chapter.doc,root.repRubKey);if(state.chapter.model.kind==='record-map')state.chapter.model.nodes.forEach(function(n){n.key=currentKey(n);});}if(state.translation)state.translation.model=core.analyzeTranslation(state.translation.doc);markDirty();renderAll();}
function loadAssociations(){
    if(!state.chapter||state.chapter.model.kind!=='record-map')return;
    state.chapter.model.nodes.forEach(function(n){var id=String(n.id);if(!Object.prototype.hasOwnProperty.call(state.associatedKeys,id)){state.associatedKeys[id]=(state.chapter.baseKeys&&state.chapter.baseKeys[id])||'';}});
}
function changeNodeLabel(id,newLabel){
    var node=findNode(id);if(!node)return;
    newLabel=String(newLabel||'').trim();if(!newLabel){notify(L('titleRequired'));renderSelected();return;}
    if(newLabel===String(node.label||''))return;
    commit(function(){
        node=findNode(id);node.label=newLabel;
        if(node.labelField)node.record[node.labelField]=newLabel;
        updateRecordPath(state.chapter);
        normalizeOrder(state.chapter);
    });
}
function changeParent(id,parentId){
    var node=findNode(id);if(!node)return;
    parentId=parentId?String(parentId):null;
    if(parentId===String(node.parentId||''))return;
    if(parentId && (parentId===String(id)||core.descendants(state.chapter.model,id).indexOf(parentId)!==-1)){notify(say('اپنی اولاد کو والد نہیں بنایا جا سکتا','A rubric cannot be its own descendant parent','Apni aulaad ko walid nahi bana sakte'));renderSelected();return;}
    commit(function(){
        node=findNode(id);node.parentId=parentId;node.parentInvalid=false;
        if(node.parentField)node.record[node.parentField]=parentId;
        node.separator=node.separator||', ';
        updateRecordPath(state.chapter);normalizeOrder(state.chapter);
    });
}
function setDisplay(id,field,value){
    var node=findNode(id);if(!node)return;
    var current=isObject(node.record.display)?node.record.display:{};
    if(current[field]===value)return;
    if(node.record.display!==undefined&&!isObject(node.record.display)){notify(say('اس ربرک میں ظاہری انداز کا خانہ کسی اور صورت میں ہے؛ خام تدوین سے بدلیں','This rubric has a non-object display field; use raw editing','Is rubric mein zahiri andaz ka khana doosri soorat mein hai; khaam edit se badlein'));return;}
    commit(function(){
        node=findNode(id);
        if(!isObject(node.record.display))node.record.display={};
        node.record.display[field]=value;
    });
}
function addNode(parentId,label,afterId){
    if(!state.chapter||state.chapter.model.kind!=='record-map')return null;
    label=String(label||'').trim();if(!label)return null;
    var model=state.chapter.model,fields=model.fields,id=chooseRecordId(model),rec={},parent=parentId?findNode(parentId):null;
    var template=model.nodes[0];if(!template)return null;
    var titleField=template.titleField||'t',labelField=fields.label,remediesField=fields.remedies||template.remediesField||'r',parentField=fields.parent,orderField=fields.order;
    rec[titleField]=label;if(labelField)rec[labelField]=label;if(remediesField)rec[remediesField]={};if(parentField)rec[parentField]=parent?String(parent.id):null;if(orderField)rec[orderField]=model.nodes.length;
    var separator=(parent&&parent.separator)|| (afterId&&findNode(afterId)&&findNode(afterId).separator)||', ';
    var newNode={id:id,index:model.nodes.length,record:rec,titleField:titleField,labelField:labelField,parentField:parentField,orderField:orderField,remediesField:remediesField,label:label,parentId:parent?String(parent.id):null,separator:separator,order:model.nodes.length,fullPath:'',originalPath:'',key:'',display:{}};
    state.chapter.doc[id]=rec;model.nodes.push(newNode);model.byId[id]=newNode;model.ids.push(id);
    updateRecordPath(state.chapter);
    if(afterId){
        var sibs=childrenOf(newNode.parentId),from=sibs.findIndex(function(n){return String(n.id)===String(id);}),target=sibs.findIndex(function(n){return String(n.id)===String(afterId);});
        if(from>=0&&target>=0){sibs.splice(from,1);sibs.splice(target+1,0,newNode);setSiblingOrder(newNode.parentId,sibs);}
    }
    normalizeOrder(state.chapter);state.associatedKeys[id]='';state.selectedId=id;state.selectedIds=[];
    return id;
}
function setSiblingOrder(parentId,list){
    list.forEach(function(n,index){n.order=index;if(n.orderField)n.record[n.orderField]=index;});
}
function performAdd(kind){
    if(!state.chapter||state.chapter.model.kind!=='record-map'){notify(L('unavailable'));return;}
    var selected=findNode(state.selectedId),parentId=null,afterId=null;
    if(kind==='child'){if(!selected){notify(L('noSelection'));return;}parentId=String(selected.id);}
    else if(kind==='sibling'){if(!selected){notify(L('noSelection'));return;}parentId=selected.parentId==null?null:String(selected.parentId);afterId=String(selected.id);}
    var label=root.prompt(L('newRubric'),'');if(label===null)return;label=label.trim();if(!label){notify(L('titleRequired'));return;}
    commit(function(){var id=addNode(parentId,label,afterId);state.selectedId=id;});
}
function addRoot(){performAdd('root');}
function addChild(){performAdd('child');}
function addSibling(){performAdd('sibling');}
function splitNode(){
    var node=findNode(state.selectedId);if(!node){notify(L('noSelection'));return;}
    var first=root.prompt(L('newRubric'),String(node.label||''));if(first===null)return;first=first.trim();if(!first)return;
    var second=root.prompt(L('splitSecond'),'');if(second===null)return;second=second.trim();if(!second)return;
    var asChild=root.confirm(L('splitChild'));
    commit(function(){
        node=findNode(state.selectedId);node.label=first;if(node.labelField)node.record[node.labelField]=first;updateRecordPath(state.chapter);
        var parentId=asChild?String(node.id):(node.parentId==null?null:String(node.parentId));
        var id=addNode(parentId,second,asChild?null:String(node.id));state.selectedId=id;
    });
    notify(L('splitNote'));
}
function mergeNodes(){
    if(!state.chapter||state.chapter.model.kind!=='record-map'||state.selectedIds.length!==2){notify(say('جوڑنے کے لیے ٹھیک 2 ربرکس منتخب کریں','Select exactly 2 rubrics to merge','Jorne ke liye theek 2 rubrics muntakhib karein'));return;}
    var a=findNode(state.selectedIds[0]),b=findNode(state.selectedIds[1]);if(!a||!b)return;
    if(String(a.parentId||'')!==String(b.parentId||'')){notify(L('mergeSameParent'));return;}
    var title=root.prompt(L('mergeTitle'),'');if(title===null)return;title=title.trim();if(!title){notify(L('titleRequired'));return;}
    var af=a.remediesField, bf=b.remediesField, ar=af&&isObject(a.record[af])?a.record[af]:{},br=bf&&isObject(b.record[bf])?b.record[bf]:{};
    var conflicts=Object.keys(ar).filter(function(code){return Object.prototype.hasOwnProperty.call(br,code)&&String(ar[code])!==String(br[code]);});
    if(conflicts.length){notify(L('mergeGradeConflict')+': '+conflicts.join(', '));return;}
    if(!root.confirm(say('پہلا منتخب شناختی اندراج برقرار رہے گا؛ دواؤں کا مجموعہ شامل ہوگا؛ دوسرے کی اردو کلید خودکار طور پر نہیں مٹے گی۔ جوڑیں؟','The first rubric ID will remain; remedies are combined; the second translation key will not be removed. Merge?','Pehli muntakhib shanakht rahegi; dawayein milengi; doosri tarjuma kunji khud nahi mitegi. Jorein?')))return;
    commit(function(){
        a=findNode(state.selectedIds[0]);b=findNode(state.selectedIds[1]);
        var targetField=a.remediesField||af||'r';if(!isObject(a.record[targetField]))a.record[targetField]={};
        Object.keys(br).forEach(function(code){if(!Object.prototype.hasOwnProperty.call(a.record[targetField],code))a.record[targetField][code]=br[code];});
        var kids=childrenOf(String(b.id));kids.forEach(function(child){child.parentId=String(a.id);if(child.parentField)child.record[child.parentField]=String(a.id);});
        a.label=title;if(a.labelField)a.record[a.labelField]=title;
        delete state.chapter.doc[String(b.id)];state.chapter.model.nodes=state.chapter.model.nodes.filter(function(n){return String(n.id)!==String(b.id);});delete state.chapter.model.byId[String(b.id)];state.chapter.model.ids=state.chapter.model.ids.filter(function(x){return String(x)!==String(b.id);});
        updateRecordPath(state.chapter);normalizeOrder(state.chapter);state.selectedId=String(a.id);state.selectedIds=[];
    });
}
function deleteNode(){
    var node=findNode(state.selectedId);if(!node){notify(L('noSelection'));return;}
    var kids=childrenOf(String(node.id));
    if(kids.length){if(!root.confirm(L('deleteParent')))return;}
    else if(!root.confirm(L('deleteConfirm')))return;
    var oldId=String(node.id),parentId=node.parentId==null?null:String(node.parentId);
    commit(function(){
        var curr=findNode(oldId);childrenOf(oldId).forEach(function(child){child.parentId=parentId;if(child.parentField)child.record[child.parentField]=parentId;});
        delete state.chapter.doc[oldId];state.chapter.model.nodes=state.chapter.model.nodes.filter(function(n){return String(n.id)!==oldId;});delete state.chapter.model.byId[oldId];state.chapter.model.ids=state.chapter.model.ids.filter(function(x){return String(x)!==oldId;});
        updateRecordPath(state.chapter);normalizeOrder(state.chapter);state.selectedId=kids.length?String(kids[0].id):(childrenOf(parentId)[0]?String(childrenOf(parentId)[0].id):'');state.selectedIds=[];
    });
}
function moveSibling(id,targetIndex){
    var node=findNode(id);if(!node)return;
    var list=childrenOf(node.parentId),from=list.findIndex(function(n){return String(n.id)===String(id);});
    if(from<0)return;targetIndex=Math.max(0,Math.min(list.length-1,targetIndex));if(from===targetIndex)return;
    list.splice(from,1);list.splice(targetIndex,0,node);
    commit(function(){setSiblingOrder(node.parentId,list);normalizeOrder(state.chapter);});
}
function moveBy(id,delta){var node=findNode(id);if(!node)return;var list=childrenOf(node.parentId),i=list.findIndex(function(n){return String(n.id)===String(id);});moveSibling(id,i+delta);}
function setPosition(id,value){var node=findNode(id);if(!node)return;var list=childrenOf(node.parentId),pos=Math.max(1,parseInt(value,10)||1);moveSibling(id,pos-1);}
function addRemedy(){
    var node=findNode(state.selectedId);if(!node){notify(L('noSelection'));return;}
    var input=doc.getElementById('rpeNewRemedy'),grade=doc.getElementById('rpeNewGrade'),code=String(input&&input.value||'').trim();if(!code)return;
    var field=node.remediesField||state.chapter.model.fields.remedies||'r',rem=node.record[field];if(!isObject(rem))rem={};
    if(Object.prototype.hasOwnProperty.call(rem,code)){notify(say('یہ دوا پہلے سے موجود ہے','This remedy already exists','Yeh dawa pehle se mojood hai'));return;}
    var gradeValue=grade?Number(grade.value):1;
    commit(function(){node=findNode(state.selectedId);if(!node.record[field]||!isObject(node.record[field]))node.record[field]={};node.record[field][code]=gradeValue;node.remediesField=field;});
    if(input)input.value='';
}
function setRemedyGrade(id,code,value){
    var node=findNode(id);if(!node)return;var field=node.remediesField,rem=field&&node.record[field];if(!isObject(rem)||!Object.prototype.hasOwnProperty.call(rem,code))return;
    var old=rem[code],newVal=value;
    if(typeof old==='number'&&value!==''&&isFinite(Number(value)))newVal=Number(value);
    if(String(old)===String(newVal))return;
    commit(function(){node=findNode(id);node.record[field][code]=newVal;});
}
function removeRemedy(id,code){
    var node=findNode(id);if(!node)return;var field=node.remediesField,rem=field&&node.record[field];if(!isObject(rem)||!Object.prototype.hasOwnProperty.call(rem,code))return;
    commit(function(){node=findNode(id);delete node.record[field][code];});
}
function setTranslationText(value){
    var node=findNode(state.selectedId),map=translationMap();if(!node||!map||isLocked(currentKey(node)))return;
    var key=currentKey(node),old=map[key];if(String(old===undefined?'':old)===String(value))return;
    if(!state.translationInputSnapshot){pushUndo();state.translationInputSnapshot=true;}
    if(value===''&&old===undefined){renderCounts();markDirty();return;}
    map[key]=String(value);state.translation.model.rubrics=map;markDirty();renderCounts();renderValidation();
}
function mapOldToNew(id,oldKey,force){
    var node=findNode(id),map=translationMap();if(!node||!map)return;
    var newKey=currentKey(node),source=String(oldKey||state.associatedKeys[String(id)]||'');
    if(!source||source===newKey||map[source]===undefined)return;
    if(isLocked(source)){notify(L('locked'));return;}
    if(Object.prototype.hasOwnProperty.call(map,newKey)&&!force){
        var question=say('نئی کلید پر پہلے سے اردو عبارت ہے۔ کیا پرانی عبارت اس پر چڑھا دیں؟','The new key already has text. Replace it with the old text?','Nayi kunji par pehle se ibarat hai. Purani ibarat rakh dein?');
        if(!root.confirm(question))return;
    }
    if(isLocked(newKey)){notify(L('locked'));return;}
    commit(function(){
        var m=translationMap(),value=m[source];m[newKey]=value;delete m[source];
        state.associatedKeys[String(id)]=newKey;state.mappingDecisions[String(id)+'>'+newKey]='moved';
    });
}
function keepOldMapping(id){var node=findNode(id);if(!node)return;var newKey=currentKey(node);state.mappingDecisions[String(id)+'>'+newKey]='leave';renderSelected();renderCounts();renderValidation();}
function deleteTranslation(){
    var node=findNode(state.selectedId),map=translationMap();if(!node||!map)return;var key=currentKey(node);if(isLocked(key)){notify(L('locked'));return;}if(map[key]===undefined)return;
    if(!root.confirm(L('removeTranslation')))return;
    commit(function(){delete translationMap()[key];});
}
function mapOrphanToSelected(oldKey){var node=findNode(state.selectedId);if(!node){notify(L('noSelection'));return;}mapOldToNew(String(node.id),String(oldKey),false);}
function renderReview(){
    var ch=state.chapter,ur=state.translation;
    if(!ch&&!ur){notify(L('openFirst'));return;}
    var body=[];
    if(ch&&ch.model.kind==='record-map'){
        var base=ch.baseDoc||{},now=ch.doc||{},oldIds=Object.keys(base).filter(function(k){return base[k]&&typeof base[k]==='object'&&(typeof base[k].t==='string'||typeof base[k].path==='string'||typeof base[k].de_path==='string');}),newIds=ch.model.ids;
        var added=newIds.filter(function(id){return !Object.prototype.hasOwnProperty.call(base,id);}),deleted=oldIds.filter(function(id){return !Object.prototype.hasOwnProperty.call(now,id);}),changed=newIds.filter(function(id){return Object.prototype.hasOwnProperty.call(base,id)&&JSON.stringify(base[id])!==JSON.stringify(now[id]);});
        body.push('<div class="rpe-review-block"><strong>'+esc(say('باب کی فائل','Chapter file','Bab ki file'))+'</strong><div>'+esc(say('نئی ربرکس: ','Added rubrics: ','Nayi rubrics: '))+added.length+' · '+esc(say('حذف: ','Deleted: ','Hazf: '))+deleted.length+' · '+esc(say('بدلی: ','Changed: ','Badli: '))+changed.length+'</div></div>');
        var affected=changed.concat(added).concat(deleted).slice(0,60);
        if(affected.length)body.push('<ul>'+affected.map(function(id){var n=findNode(id);return '<li><code>'+esc(id)+'</code> — '+esc(n?n.fullPath:say('حذف شد','deleted','hazf shuda'))+'</li>';}).join('')+'</ul>');
    }
    if(ur&&ur.model.kind==='rubric-map'){
        var oldMap=ur.baseDoc&&isObject(ur.baseDoc.rubrics)?ur.baseDoc.rubrics:{},newMap=ur.model.rubrics,keys=new Set(Object.keys(oldMap).concat(Object.keys(newMap))),changedKeys=0,addedKeys=0,removedKeys=0;
        keys.forEach(function(k){if(oldMap[k]===undefined&&newMap[k]!==undefined)addedKeys++;else if(oldMap[k]!==undefined&&newMap[k]===undefined)removedKeys++;else if(oldMap[k]!==newMap[k])changedKeys++;});
        body.push('<div class="rpe-review-block"><strong>'+esc(say('اردو ترجمے کی فائل','Urdu translation file','Urdu tarjume ki file'))+'</strong><div>'+esc(say('نئی کلیدیں: ','New keys: ','Nayi kunjiyan: '))+addedKeys+' · '+esc(say('حذف شدہ کلیدیں: ','Removed keys: ','Hazf shuda kunjiyan: '))+removedKeys+' · '+esc(say('بدلی عبارتیں: ','Changed texts: ','Badli ibaratein: '))+changedKeys+'</div></div>');
    }
    var p=pendingMappings();if(p.length)body.push('<div class="rpe-review-warning">'+esc(L('mappingPending'))+': '+p.length+'</div>');
    openModal(say('تبدیلیوں کا جائزہ','Review changes','Tabdeeliyon ka jaiza'),body.join('')||'<p>'+esc(L('noChanges'))+'</p>',[{label:say('بند کریں','Close','Band karein'),action:'close-modal',primary:true}]);
}
function validateAll(showModal){
    var result={errors:[],warnings:[]};
    if(state.chapter){var c=core.validateModel(state.chapter.model,root.repRubKey);result.errors=result.errors.concat(c.errors);result.warnings=result.warnings.concat(c.warnings);}
    if(state.translation&&state.translation.model.kind==='rubric-map'){
        Object.keys(state.translation.model.rubrics).forEach(function(k){if(typeof state.translation.model.rubrics[k]!=='string')result.errors.push('ترجمہ عبارت متنی نہیں: '+k);});
        if(state.chapter&&state.chapter.model.kind==='record-map'){
            var current=allCurrentKeys(),map=state.translation.model.rubrics;
            Object.keys(current).forEach(function(k){if(typeof map[k]!=='string'||!map[k].trim())result.warnings.push('اردو ترجمہ درکار: '+k);});
            orphanKeys().forEach(function(k){result.warnings.push('پرانا بے جوڑ ترجمہ محفوظ: '+k);});
            pendingMappings().forEach(function(p){result.warnings.push('نسبت کا فیصلہ باقی: '+p.oldKey+' → '+p.newKey);});
        }
    }
    renderValidation();
    if(showModal){
        var html=[];
        result.errors.forEach(function(x){html.push('<div class="item error">'+esc(x)+'</div>');});
        result.warnings.slice(0,100).forEach(function(x){html.push('<div class="item warn">'+esc(x)+'</div>');});
        if(result.warnings.length>100)html.push('<div class="item warn">'+esc(say('مزید ','More ','Mazeed ')+(result.warnings.length-100))+'</div>');
        if(!html.length)html.push('<div class="item good">'+esc(L('validationOk'))+'</div>');
        openModal(say('مطابقت کی جانچ','Validation','Mutabiqat ki jaanch'),html.join(''),[{label:say('بند کریں','Close','Band karein'),action:'close-modal',primary:true}]);
    }
    return result;
}
function openModal(title,html,actions){
    var modal=doc.getElementById('rpeModal');if(!modal)return;
    doc.getElementById('rpeModalTitle').textContent=title;
    doc.getElementById('rpeModalBody').innerHTML=html;
    doc.getElementById('rpeModalActions').innerHTML=(actions||[]).map(function(a){return '<button type="button" class="btn '+(a.primary?'btn-primary':'btn-light')+' btn-sm" data-rpe-action="'+esc(a.action)+'">'+esc(a.label)+'</button>';}).join('');
    modal.hidden=false;
}
function closeModal(){var modal=doc.getElementById('rpeModal');if(modal)modal.hidden=true;}
function notify(message){if(typeof root.showToast==='function')root.showToast(String(message));else if(root.console)root.console.log(message);}
function downloadFile(name,textContent){
    var blob=new Blob([textContent],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=doc.createElement('a');
    a.href=url;a.download=name||'repertory.json';a.style.display='none';doc.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},1500);
}
function serializeFile(fileState){var newline=fileState.newline||'\n';var txt=JSON.stringify(fileState.doc,null,fileState.indent||2).replace(/\n/g,newline)+newline;return (fileState.bom?'\uFEFF':'')+txt;}
async function writeFileState(fileState,kind){
    var out=serializeFile(fileState),handle=fileState.handle;
    if(handle&&typeof handle.createWritable==='function'){
        try{
            var permission='granted';if(handle.queryPermission)permission=await handle.queryPermission({mode:'readwrite'});
            if(permission!=='granted'&&handle.requestPermission)permission=await handle.requestPermission({mode:'readwrite'});
            if(permission==='granted'){
                var writer=await handle.createWritable();await writer.write(out);await writer.close();
                fileState.baseDoc=clone(fileState.doc);fileState.dirty=false;return {direct:true};
            }
        }catch(e){if(root.console)root.console.warn('Direct file save failed; using download',e);}
    }
    downloadFile(fileState.name|| (kind==='chapter'?'chapter.json':'translation.json'),out);
    fileState.baseDoc=clone(fileState.doc);fileState.dirty=false;return {direct:false};
}
async function saveOne(kind){
    var f=kind==='chapter'?state.chapter:state.translation;if(!f)return;
    var validation=validateAll(false);if(validation.errors.length){validateAll(true);return;}
    try{var result=await writeFileState(f,kind);markDirty();renderAll();notify(result.direct?(kind==='chapter'?L('chapterSaved'):L('translationSaved')):L('downloaded'));}
    catch(e){notify(say('محفوظ کاری ناکام؛ مسودہ برقرار ہے: ','Save failed; draft retained: ','Save nakam; musawadda baqi hai: ')+(e&&e.message||''));}
}
async function saveBoth(){
    if(!state.chapter||!state.translation)return;
    var validation=validateAll(false);if(validation.errors.length){validateAll(true);return;}
    var pending=pendingMappings();
    if(pending.length&&!root.confirm(L('conflictSave')))return;
    try{
        var first=await writeFileState(state.chapter,'chapter');
        try{var second=await writeFileState(state.translation,'translation');markDirty();renderAll();notify(first.direct&&second.direct?L('bothSaved'):L('downloaded'));}
        catch(secondError){markDirty();renderAll();notify(L('partialSave')+': '+(secondError&&secondError.message||''));}
    }catch(e){markDirty();renderAll();notify(say('محفوظ کاری ناکام؛ مسودہ برقرار ہے: ','Save failed; draft retained: ','Save nakam; musawadda baqi hai: ')+(e&&e.message||''));}
}
function makeFileState(name,handle,textValue,docValue,kind){
    return {name:name|| (kind==='chapter'?'chapter.json':'translation.json'),handle:handle||null,rawText:textValue||'',doc:docValue,baseDoc:clone(docValue),indent:getIndent(textValue),newline:String(textValue||'').indexOf('\r\n')!==-1?'\r\n':'\n',bom:String(textValue||'').charCodeAt(0)===0xFEFF,dirty:false,kind:kind};
}
function loadChapterText(name,handle,raw){
    var data;try{data=parseJsonText(raw);}catch(e){notify(L('invalidJson')+': '+(e.message||''));return false;}
    if(state.chapter&&state.chapter.dirty&&!root.confirm(L('replaceDirty')))return false;
    var model=core.analyzeChapter(data,root.repRubKey);
    state.chapter=makeFileState(name,handle,raw,data,'chapter');state.chapter.model=model;state.chapter.baseKeys=baselineKeys(model);
    state.associatedKeys=Object.create(null);state.mappingDecisions=Object.create(null);state.selectedIds=[];state.expanded=Object.create(null);
    if(model.kind==='record-map'){state.selectedId=model.nodes.length?String(model.nodes[0].id):null;model.nodes.forEach(function(n){state.associatedKeys[String(n.id)]=state.chapter.baseKeys[String(n.id)]||'';});}
    else {state.selectedId=null;doc.getElementById('rpeRawEditors').hidden=false;}
    loadAssociations();renderAll();
    if(model.kind==='raw')notify(L('rawUnknown'));
    return true;
}
function loadTranslationText(name,handle,raw){
    var data;try{data=parseJsonText(raw);}catch(e){notify(L('invalidJson')+': '+(e.message||''));return false;}
    if(state.translation&&state.translation.dirty&&!root.confirm(L('replaceDirty')))return false;
    state.translation=makeFileState(name,handle,raw,data,'translation');state.translation.model=core.analyzeTranslation(data);
    if(state.chapter){state.associatedKeys=Object.create(null);state.chapter.model.nodes&&state.chapter.model.nodes.forEach(function(n){state.associatedKeys[String(n.id)]=(state.chapter.baseKeys&&state.chapter.baseKeys[String(n.id)])||'';});}
    state.mappingDecisions=Object.create(null);renderAll();
    if(state.translation.model.kind==='raw')notify(L('translationRawUnknown'));
    return true;
}
async function loadSelectedFile(kind,file,handle){if(!file)return;try{var raw=await file.text();if(kind==='chapter')loadChapterText(file.name,handle,raw);else loadTranslationText(file.name,handle,raw);}catch(e){notify(L('invalidJson')+': '+(e.message||''));}}
async function openFile(kind){
    var types=[{description:'باب یا اردو ترجمہ',accept:{'application/json':['.json']}}];
    if(typeof root.showOpenFilePicker==='function'){
        try{var handles=await root.showOpenFilePicker({multiple:false,types:types,excludeAcceptAllOption:false});if(handles&&handles[0]){var file=await handles[0].getFile();await loadSelectedFile(kind,file,handles[0]);return;}}
        catch(e){if(e&&e.name==='AbortError')return;}
    }
    var input=doc.getElementById(kind==='chapter'?'rpeChapterInput':'rpeTranslationInput');if(input){input.value='';input.click();}
}
function showRaw(){
    var panel=doc.getElementById('rpeRawEditors');if(!panel)return;panel.hidden=!panel.hidden;renderRawEditors();
}
function applyRaw(kind){
    if(kind==='translation'){notify(say('ترجمے کی فائل کے نامعلوم خواص محفوظ رکھنے کے لیے یہاں تبدیلی بند ہے؛ اردو عبارت الگ خانے سے بدلیں','Raw translation editing is disabled to protect metadata; edit the Urdu text field instead','Tarjume ke ghair-manoos khawas bachane ke liye yahan tabdeeli band hai; Urdu ibarat alag khanay se badlein'));return;}
    var area=doc.getElementById('rpeChapterRaw');if(!area)return;
    var parsed;try{parsed=parseJsonText(area.value);}catch(e){notify(L('rawInvalid')+': '+(e.message||''));return;}
    commit(function(){
        if(kind==='chapter'&&state.chapter){state.chapter.doc=parsed;state.chapter.model=core.analyzeChapter(parsed,root.repRubKey);if(state.chapter.model.kind==='record-map'){state.chapter.model.nodes.forEach(function(n){if(!state.associatedKeys[String(n.id)])state.associatedKeys[String(n.id)]=currentKey(n);});state.chapter.model.nodes.forEach(function(n){if(!state.selectedId)state.selectedId=String(n.id);});}}
        if(kind==='translation'&&state.translation){state.translation.doc=parsed;state.translation.model=core.analyzeTranslation(parsed);}
    });
    notify(L('rawApplied'));
}
function clearSearch(){var e=doc.getElementById('rpeSearch');if(e)e.value='';state.search='';renderTree();}
function toggleOrphans(){state.showOrphans=!state.showOrphans;renderOrphanList();}
function onClick(event){
    var tab=event.target.closest('[data-rpe-tab]');if(tab){state.activeTab=tab.getAttribute('data-rpe-tab');renderTabs();return;}
    var caseButton=event.target.closest('[data-rpe-case]');if(caseButton){var n=findNode(state.selectedId);if(!n)return;var mode=caseButton.getAttribute('data-rpe-case'),value=applyCase(n.label,mode);if(value!==n.label)changeNodeLabel(String(n.id),value);return;}
    var select=event.target.closest('[data-rpe-select-id]');if(select){state.selectedId=String(select.getAttribute('data-rpe-select-id'));renderTree();renderSelected();updateButtons();return;}
    var toggle=event.target.closest('[data-rpe-toggle]');if(toggle){var id=String(toggle.getAttribute('data-rpe-toggle'));state.expanded[id]=!state.expanded[id];renderTree();return;}
    var check=event.target.closest('[data-rpe-check-id]');if(check){var checkedId=String(check.getAttribute('data-rpe-check-id')),i=state.selectedIds.indexOf(checkedId);if(check.checked){if(i<0)state.selectedIds.push(checkedId);}else if(i>=0)state.selectedIds.splice(i,1);renderCounts();updateButtons();return;}
    var mapButton=event.target.closest('[data-rpe-map-old]');if(mapButton){var mid=String(mapButton.getAttribute('data-rpe-map-old'));mapOldToNew(mid,state.associatedKeys[mid]);return;}
    var keepButton=event.target.closest('[data-rpe-keep-old]');if(keepButton){keepOldMapping(String(keepButton.getAttribute('data-rpe-keep-old')));return;}
    var orphanButton=event.target.closest('[data-rpe-orphan-key]');if(orphanButton){mapOrphanToSelected(orphanButton.getAttribute('data-rpe-orphan-key'));return;}
    var rmButton=event.target.closest('[data-rpe-remove-remedy]');if(rmButton){removeRemedy(String(state.selectedId),rmButton.getAttribute('data-rpe-remove-remedy'));return;}
    var modalAction=event.target.closest('#rpeModal [data-rpe-action]');if(modalAction&&modalAction.getAttribute('data-rpe-action')==='close-modal'){closeModal();return;}
    var action=event.target.closest('[data-rpe-action]');if(!action)return;
    switch(action.getAttribute('data-rpe-action')){
        case 'open-chapter':openFile('chapter');break;
        case 'open-translation':openFile('translation');break;
        case 'undo':doUndo();break;
        case 'redo':doRedo();break;
        case 'validate':validateAll(true);break;
        case 'review':renderReview();break;
        case 'raw':showRaw();break;
        case 'close-raw':doc.getElementById('rpeRawEditors').hidden=true;break;
        case 'apply-chapter-raw':applyRaw('chapter');break;
        case 'apply-translation-raw':applyRaw('translation');break;
        case 'clear-search':clearSearch();break;
        case 'add-root':addRoot();break;
        case 'add-child':addChild();break;
        case 'add-sibling':addSibling();break;
        case 'split':splitNode();break;
        case 'merge':mergeNodes();break;
        case 'delete':deleteNode();break;
        case 'move-up':if(state.selectedId)moveBy(String(state.selectedId),-1);break;
        case 'move-down':if(state.selectedId)moveBy(String(state.selectedId),1);break;
        case 'add-remedy':addRemedy();break;
        case 'delete-translation':deleteTranslation();break;
        case 'show-orphans':toggleOrphans();break;
        case 'save-chapter':saveOne('chapter');break;
        case 'save-translation':saveOne('translation');break;
        case 'save-both':saveBoth();break;
    }
}
function onChange(event){
    var target=event.target;
    if(target.id==='rpeLabel'){if(state.selectedId)changeNodeLabel(String(state.selectedId),target.value);return;}
    if(target.id==='rpeParent'){if(state.selectedId)changeParent(String(state.selectedId),target.value);return;}
    if(target.id==='rpeWeight'){if(state.selectedId)setDisplay(String(state.selectedId),'weight',target.value);return;}
    if(target.id==='rpeSize'){if(state.selectedId)setDisplay(String(state.selectedId),'size',target.value);return;}
    if(target.id==='rpeOrder'){if(state.selectedId)setPosition(String(state.selectedId),target.value);return;}
    if(target.id==='rpeChapterInput'||target.id==='rpeTranslationInput'){
        var file=target.files&&target.files[0];if(file)loadSelectedFile(target.id==='rpeChapterInput'?'chapter':'translation',file,null);return;
    }
    if(target.matches&&target.matches('[data-rpe-grade]')){setRemedyGrade(String(state.selectedId),target.getAttribute('data-rpe-grade'),target.value);return;}
}
function onInput(event){
    var target=event.target;
    if(target.id==='rpeSearch'){state.search=target.value||'';renderTree();return;}
    if(target.id==='rpeTranslationText'){setTranslationText(target.value);return;}
}
function onKeyDown(event){
    if(event.key==='Enter'&&event.target&&event.target.id==='rpeNewRemedy'){event.preventDefault();addRemedy();}
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();if(event.shiftKey)doRedo();else doUndo();}
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();doRedo();}
}
rootEl.addEventListener('click',onClick);
rootEl.addEventListener('change',onChange);
rootEl.addEventListener('input',onInput);
rootEl.addEventListener('focusin',function(e){if(e.target&&e.target.id==='rpeTranslationText')state.translationInputSnapshot=false;});
rootEl.addEventListener('focusout',function(e){if(e.target&&e.target.id==='rpeTranslationText')state.translationInputSnapshot=false;});
rootEl.addEventListener('keydown',onKeyDown);
root.addEventListener('beforeunload',function(event){
    if((state.chapter&&state.chapter.dirty)||(state.translation&&state.translation.dirty)){
        event.preventDefault();event.returnValue='';
    }
});

var langObserver=null;
if(root.MutationObserver){langObserver=new root.MutationObserver(function(records){if(records.some(function(r){return r.attributeName==='class';}))renderAll();});langObserver.observe(doc.body,{attributes:true,attributeFilter:['class']});}
renderAll();
})(typeof window!=='undefined'?window:globalThis);
