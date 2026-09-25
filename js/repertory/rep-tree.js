// Bismillah Clinic — js/repertory/rep-tree.js — 🌳 ربرکس کی ٹری، سطحیں، رنگ اور ہر ربرک کے بٹن
// (v78: 08-app-repertory.js کو بغیر کسی کوڈ تبدیلی کے حصوں میں بانٹا گیا؛ لوڈ ترتیب index.html میں وہی رکھیں)
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
// 🔑 v75: ربرکس کا اردو ترجمہ — ur/rubric_labels_ur.json (لیبل → اردو)؛ صرف اردو زبان میں دکھتا ہے
var _repUrLabels=null,_repUrLoading=false;
function repUrLabelsOn(){ return (typeof currentLang!=='undefined'?currentLang:'ur')==='ur'; }
function ensureRepUrLabels(cb){
    if(_repUrLabels||_repUrLoading){ if(_repUrLabels&&cb)cb(); return; }
    _repUrLoading=true;
    fetch('ur/rubric_labels_ur.json?'+REP_DATA_V).then(function(r){ if(!r.ok)throw 0; return r.json(); })
        .then(function(d){ _repUrLabels=(d&&d.labels)||{}; _repUrLoading=false; if(cb)cb(); })
        .catch(function(){ _repUrLabels={}; _repUrLoading=false; });
}
// ترتیب: (1) پورے لیبل کا ترجمہ → (2) کوما والے ہر حصے کا ترجمہ → (3) الفاظ کی لغت (glossary_en_ur.json) سے لفظی ترجمہ۔
// 2 اور 3 خودکار ہیں اس لیے {auto:true} — ہلکے رنگ میں دکھتے ہیں تاکہ معلوم رہے کہ یہ نظرثانی شدہ ترجمہ نہیں۔
function repUrWord(w){
    if(!_repGlossary) return '';
    var W=_repGlossary.words||{}, A=_repGlossary.aliases||{}, e=W[w]||(A[w]?W[A[w]]:null);
    return (e&&e.ur)||'';
}
function repUrLabelObj(label){
    if(!_repUrLabels) return null;
    var k=String(label||'').replace(/ \[\d+\]$/,'').toLowerCase().trim(); if(!k) return null;
    if(_repUrLabels[k]) return {t:_repUrLabels[k],auto:false};
    var segs=k.split(/,\s*/), out=[], any=false;
    for(var i=0;i<segs.length;i++){
        var sg=segs[i].trim(); if(!sg)continue;
        if(_repUrLabels[sg]){ out.push(_repUrLabels[sg]); any=true; continue; }
        if(/^[\d\s.:apm\-–]+$/.test(sg)){ out.push(sg); continue; }          // وقت/ہندسے جوں کے توں
        var ws=sg.match(/[a-z]+|\d+/g)||[], tw=[];
        ws.forEach(function(w){ var u=/^\d+$/.test(w)?w:repUrWord(w); if(u){ tw.push(u); any=true; } });
        if(tw.length) out.push(tw.join(' '));
    }
    return any&&out.length?{t:out.join('، '),auto:true}:null;
}
function repUrLabel(label){ var o=repUrLabelObj(label); return o?o.t:''; }
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
        +(function(){ if(!repUrLabelsOn())return ''; var u=repUrLabelObj(r.label); if(!u)return '';
            return '<span class="rtv-ur'+(u.auto?' auto':'')+'" dir="rtl" lang="ur"'+(u.auto?' title="خودکار لفظی ترجمہ — نظرثانی باقی"':'')+'>'+escapeHtml(u.t)+'</span>'; })()
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
    h+='<button class="rtv-a cmp'+(on?' on':'')+'" data-act="cmp" title="'+L({ur:'فعال کلپ بورڈ میں شامل/خارج',en:'Add to / remove from active clipboard',roman:'Compare'})+'">'+(on?'✓':'+')+'</button>';
    if(typeof repDiffOpenForRubric==='function'){
        h+='<button class="rtv-a diff" data-act="diff" title="'+L({ur:'اس ربرک کی تفریق (ذیلی/ہم رشتہ ربرکس)',en:'Differentiate this rubric',roman:'Tafreeq'})+'">🔬</button>';
        if(rems>1) h+='<button class="rtv-a rdiff" data-act="rdiff" title="'+L({ur:'ان ادویات میں کیا فرق ہے؟',en:'What distinguishes these remedies?',roman:'farq?'})+'">⚖</button>';
    }
    if(rems&&typeof repMMOpenForRubric==='function') h+='<button class="rtv-a mm" data-act="mm" title="'+L({ur:'ان ادویات کا میٹیریا میڈیکا',en:'Materia medica of these remedies',roman:'Materia medica'})+'">📖</button>';
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
        btn.classList.toggle('on',added); btn.innerHTML=added?'✓':'+';
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
    if(repUrLabelsOn()&&(!_repUrLabels||(!_repGlossary&&!_repGlossaryFailed))) ensureRepUrLabels(function(){ ensureRepGlossary(function(){ if(document.getElementById(elId)) repTreeRemount(elId); }); });
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
    // 🔑 v74 (صارف): ربرک پر کلک سے الگ صفحہ نہیں کھلتا — اسی جگہ تفصیل کھلتی/بند ہوتی ہے؛
    // صرف فولڈر (بغیر ادویات) پر کلک = شاخ کھولیں/بند کریں۔ مکمل صفحہ ⋮ مینو سے اب بھی دستیاب۔
    if(!t.closest('.rtv-lab')&&!t.closest('.rtv-tg')) return;           // ادویات کی خالی جگہ پر کلک = کچھ نہیں
    if(row.getAttribute('data-rems')==='0'&&row.getAttribute('data-kids')==='1'){
        if(!repFolderFilter){ if(repTreeCollapsed[full])delete repTreeCollapsed[full]; else repTreeCollapsed[full]=true; repTreeRemount(elId); }
        return;
    }
    var ib=row.querySelector('.rtv-a.info'); if(ib) repTreeAct(row,'info',ib);
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
// ==================== v79: گریڈ فلٹر (نچلی بار کے 1/2/3 آئیکن) ====================
// 3 = صرف گریڈ 3 · 2 = گریڈ 3+2 · 1 = گریڈ 3+2+1 (یعنی سب) · دوبارہ کلک = فلٹر آف
// اثر: body.rep-gf-N کلاس سے CSS ریپرٹری میں ہر `.rep-remedy-tag` / ٹری کے `.rtv-r` چھپا دیتا ہے
var repGradeFilterVal=0;                                    // 0 = فلٹر آف
function repGradeFilter(n){
    n=parseInt(n,10)||0;
    repGradeFilterVal=(repGradeFilterVal===n)?0:n;          // ایک ہی بار دوبارہ کلک = آف
    var b=document.body;
    if(b){ b.classList.remove('rep-gf-1','rep-gf-2','rep-gf-3'); if(repGradeFilterVal)b.classList.add('rep-gf-'+repGradeFilterVal); }
    var items=document.querySelectorAll('.rep-grad-item');
    for(var i=0;i<items.length;i++) items[i].classList.toggle('on',parseInt(items[i].getAttribute('data-g'),10)===repGradeFilterVal);
    return repGradeFilterVal;
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

