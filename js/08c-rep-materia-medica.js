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
var repMMBookOrder=['kent_lectures','boericke','allen_keynotes','nash_leaders'];
var REP_MM_SHORT={kent_lectures:'Kent',boericke:'Boericke',allen_keynotes:'Allen',nash_leaders:'Nash'};
var REP_MM_COLOR={kent_lectures:'#1a5276',boericke:'#117a65',allen_keynotes:'#7d6608',nash_leaders:'#6c3483'};

// ---------- لوڈنگ ----------
function repMMEnsureIndex(cb){
    if(repMMIndex){ cb(repMMIndex); return; }
    if(_repMMLoading.__index){ _repMMLoading.__index.push(cb); return; }
    _repMMLoading.__index=[cb];
    fetch(REP_MM_INDEX_FILE+'?v=1').then(function(r){ return r.json(); }).then(function(d){ repMMIndex=d||{books:{},avail:{}}; })
        .catch(function(e){ console.warn('MM index load fail',e); repMMIndex={books:{},avail:{}}; })
        .then(function(){ var q=_repMMLoading.__index; delete _repMMLoading.__index; (q||[]).forEach(function(f){ f(repMMIndex); }); });
}
function repMMLoadBook(id,cb){
    if(_repMMBooks[id]){ cb(_repMMBooks[id]); return; }
    if(_repMMLoading[id]){ _repMMLoading[id].push(cb); return; }
    _repMMLoading[id]=[cb];
    repMMEnsureIndex(function(ix){
        var meta=ix.books&&ix.books[id]; var file=(meta&&meta.file)||('mm/'+id+'.json');
        fetch(file+'?v=1').then(function(r){ return r.json(); }).then(function(d){ _repMMBooks[id]=d; })
            .catch(function(e){ console.warn('MM book load fail',id,e); _repMMBooks[id]={id:id,remedies:{}}; })
            .then(function(){ var q=_repMMLoading[id]; delete _repMMLoading[id]; (q||[]).forEach(function(f){ f(_repMMBooks[id]); }); });
    });
}
function repMMBookIds(){ var ids=repMMIndex?Object.keys(repMMIndex.books||{}):[]; return repMMBookOrder.filter(function(b){ return ids.indexOf(b)!==-1; }).concat(ids.filter(function(b){ return repMMBookOrder.indexOf(b)===-1; })); }
function repMMEnsureAll(cb){
    repNotesSeed();
    repMMEnsureIndex(function(){
        var ids=repMMBookIds(); if(!ids.length){ cb({}); return; }
        var pending=ids.length; ids.forEach(function(id){ repMMLoadBook(id,function(){ if(--pending===0) cb(_repMMBooks); }); });
    });
}
function repMMLoaded(){ return !!repMMIndex && repMMBookIds().every(function(id){ return !!_repMMBooks[id]; }); }
function repMMAvail(abbr){ return (repMMIndex&&repMMIndex.avail&&repMMIndex.avail[abbr])||[]; }
function repMMEntry(id,abbr){ var b=_repMMBooks[id]; return (b&&b.remedies&&b.remedies[abbr])||null; }
function repMMBookLabel(id){ var m=repMMIndex&&repMMIndex.books&&repMMIndex.books[id]; return m?(m.author.split(' ').pop()+' — '+m.title+' ('+m.year+')'):id; }
function repMMBadge(id){ return '<span class="rep-mm-badge" style="background:'+(REP_MM_COLOR[id]||'#555')+'">'+escapeHtml(REP_MM_SHORT[id]||id)+'</span>'; }

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
// ریمیڈی کے تمام جملے جو موضوع سے ملتے ہیں — [{book,section,text,score}]
function repMMMatches(abbr,re,perBook){
    var out=[]; if(!re) return out;
    repMMBookIds().forEach(function(id){
        var e=repMMEntry(id,abbr); if(!e) return; var found=[];
        (e.sections||[]).forEach(function(sec){
            (sec.p||[]).forEach(function(p,pi){
                repMMSentences(p).forEach(function(sn){
                    var plain=repMMPlain(sn); var hits=(plain.match(new RegExp(re.source,'gi'))||[]).length; if(!hits) return;
                    var bold=(sn.match(/\*\*/g)||[]).length/2, ital=(sn.match(/_/g)||[]).length/2;
                    var score=hits*2+bold*2+ital*1+((sec.h||'').toLowerCase()==='mind'?1:0)+(plain.length<220?0.5:0);
                    found.push({book:id,section:sec.h||'',text:sn,score:score,pi:pi});
                });
            });
        });
        found.sort(function(a,b){ return (b.score-a.score)||(a.pi-b.pi); });
        out=out.concat(found.slice(0,perBook||REP_MM_MAX_PER_BOOK));
    });
    return out;
}
function repMMHighlight(html,re){ if(!re) return html; try{ return html.replace(new RegExp('('+re.source+')(?![^<]*>)','gi'),'<mark>$1</mark>'); }catch(e){ return html; } }
function repMMRef(m){ return '['+(REP_MM_SHORT[m.book]||m.book)+(m.section?' § '+m.section:'')+']'; }
// 🤖 خودکار مسودہ (extractive): بہترین جملے، فی کتاب زیادہ سے زیادہ 2، مع حوالہ
function repMMDraft(abbr,re){
    var ms=repMMMatches(abbr,re,3).slice().sort(function(a,b){ return b.score-a.score; });
    var per={},pick=[];
    ms.forEach(function(m){ per[m.book]=(per[m.book]||0); if(per[m.book]<2&&pick.length<REP_MM_DRAFT_N){ per[m.book]++; pick.push(m); } });
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
function repNotesImportText(txt){
    try{ var d=JSON.parse(txt); var notes=d.notes||d; var st=repNotesLoad(); var n=0; Object.keys(notes).forEach(function(k){ if(notes[k]&&notes[k].text){ st[k]=notes[k]; n++; } }); repNotesSave(); showToast('📥 '+n+' notes'); return n; }catch(e){ showToast('⚠ JSON?'); return 0; }
}
// 🌱 بیج مسودے (mm/drafts_seed.json) — پہلی بار خودکار ضم؛ موجودہ نوٹس کبھی اوور رائٹ نہیں ہوتے
function repNotesSeed(cb){
    var flag='bc_rep_notes_seed_v'; var ver='1'; try{ if(localStorage.getItem(flag)===ver){ if(cb)cb(0); return; } }catch(e){}
    fetch('mm/drafts_seed.json?v='+ver).then(function(r){ return r.json(); }).then(function(d){
        var st=repNotesLoad(), n=0; Object.keys((d&&d.notes)||{}).forEach(function(k){ if(!st[k]){ st[k]=d.notes[k]; n++; } });
        repNotesSave(); try{ localStorage.setItem(flag,ver); }catch(e){}
        if(n) showToast('🌱 '+repLangText({ur:n+' بیج مسودے شامل (تصدیق باقی)',en:n+' seed drafts added (unverified)',roman:n+' seed drafts'}));
        if(cb)cb(n);
    }).catch(function(){ if(cb)cb(0); });
}
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
        +'<button class="rst-link" onclick="repNotesExport()">📤 '+L({ur:'ایکسپورٹ',en:'Export',roman:'Export'})+'</button>'
        +'<label class="rst-link" style="cursor:pointer">📥 '+L({ur:'امپورٹ',en:'Import',roman:'Import'})+'<input type="file" accept=".json" style="display:none" onchange="repNotesImportFile(this)"></label>'
        +'</div>';
    if(!R.length) return h+'<div class="rep-tool-note">'+L({ur:'پہلے ریمیڈیز چنیں',en:'Pick remedies first',roman:'Pehle remedies chunein'})+'</div>';
    if(!repMMLoaded()){
        repMMEnsureAll(function(){ if(typeof repDiffTab!=='undefined'&&repDiffTab==='mm'&&typeof repDiffRenderBody==='function') repDiffRenderBody(); });
        return h+'<div class="rep-tool-loading">⏳ '+L({ur:'میٹیریا میڈیکا لوڈ ہو رہی ہے (پہلی بار ~5 ایم بی)…',en:'Loading materia medica (first time ~5 MB)…',roman:'Materia medica load ho rahi hai…'})+'</div>';
    }
    var re=repMMThemeRegex(theme);
    if(!re) h+='<div class="rep-tool-note">'+L({ur:'موضوع کے الفاظ لکھیں — ورنہ صرف پورا متن (📖) دستیاب ہے',en:'Enter theme words — otherwise only the full text (📖) is available',roman:'Theme words likhein'})+'</div>';
    h+='<div class="rep-mm-cards">';
    R.forEach(function(a){
        var av=repMMAvail(a);
        h+='<div class="rep-mm-card"><div class="rep-mm-cardhead"><b dir="ltr">'+escapeHtml(a)+'</b> <small>'+escapeHtml(repRemedyTitle(a).replace(/^.*= /,''))+'</small>'
            +'<span class="rep-mm-av">'+(av.length?av.map(repMMBadge).join(''):'<i>'+L({ur:'ان کتابوں میں نہیں',en:'not in these books',roman:'in kitabon mein nahi'})+'</i>')+'</span>'
            +(av.length?'<button class="rc-btn" onclick="repMMOpen(\''+_repJs(a)+'\')">📖 '+L({ur:'پورا متن',en:'Full text',roman:'Poora matn'})+'</button>':'')+'</div>';
        if(av.length&&re){
            var ms=repMMMatches(a,re); var draft=repMMDraftText(a,re); _repNoteDrafts[a]=draft;
            if(draft){
                h+='<div class="rep-mm-draft"><div class="rep-mm-drafthead">🤖 '+L({ur:'خودکار مسودہ (حوالہ جات کے ساتھ) — تصدیق باقی',en:'Auto draft (with references) — unverified',roman:'Khudkar musawwada — tasdeeq baqi'})+'</div>';
                repMMDraft(a,re).forEach(function(m){ h+='<div class="rep-mm-draftline" dir="ltr">• '+repMMHighlight(repMMFmt(m.text),re)+' <span class="rep-mm-ref" style="color:'+(REP_MM_COLOR[m.book]||'#555')+'">'+escapeHtml(repMMRef(m))+'</span></div>'; });
                h+='</div>';
            } else h+='<div class="rep-tool-note">'+L({ur:'اس موضوع پر ان کتابوں میں اس ریمیڈی کا کوئی جملہ نہیں ملا — الفاظ بدل کر دیکھیں یا 📖 پورا متن',en:'No sentence for this remedy on this theme — try other words or 📖 full text',roman:'Koi jumla nahi mila'})+'</div>';
            if(ms.length){
                var byBook={}; ms.forEach(function(m){ (byBook[m.book]=byBook[m.book]||[]).push(m); });
                h+='<details class="rep-mm-more"><summary>'+L({ur:'تمام متعلقہ جملے',en:'All matching sentences',roman:'Tamam jumle'})+' ('+ms.length+')</summary>';
                repMMBookIds().forEach(function(id){ var arr=byBook[id]; if(!arr)return; h+='<div class="rep-mm-bookblk">'+repMMBadge(id)+' <small>'+escapeHtml(repMMBookLabel(id))+'</small>';
                    arr.forEach(function(m){ h+='<div class="rep-mm-sent" dir="ltr">'+repMMHighlight(repMMFmt(m.text),re)+(m.section?' <span class="rep-mm-sec">§ '+escapeHtml(m.section)+'</span>':'')+'</div>'; }); h+='</div>'; });
                h+='</details>';
            }
        }
        h+=repNoteEditorHtml(ctx,a,!!_repNoteDrafts[a]);
        h+='</div>';
    });
    h+='</div>';
    return h;
}
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
function repMMRender(){
    var L=repLangText, head=document.getElementById('repMMHead'); if(!head)return;
    var a=repMMView.abbr, av=repMMAvail(a);
    var h='<div class="rep-diff-title"><b>📖 '+L({ur:'میٹیریا میڈیکا',en:'MATERIA MEDICA',roman:'MATERIA MEDICA'})+'</b><span class="rep-diff-sub"><b dir="ltr">'+escapeHtml(a)+'</b> — '+escapeHtml(repRemedyTitle(a).replace(/^.*= /,''))+'</span><button class="rc-btn" onclick="repMMClose()">✕ '+L({ur:'بند',en:'Close',roman:'Band'})+'</button></div>';
    if(repMMView.list&&repMMView.list.length>1){
        h+='<div class="rep-mm-remlist">'; repMMView.list.slice(0,80).forEach(function(x){ var has=repMMAvail(x).length>0; h+='<button class="rep-mm-rembtn'+(x===a?' on':'')+(has?'':' none')+'" onclick="repMMSetRem(\''+_repJs(x)+'\')" title="'+(has?repMMAvail(x).map(function(b){return REP_MM_SHORT[b]||b;}).join(', '):L({ur:'ان کتابوں میں نہیں',en:'not in these books',roman:'nahi'}))+'"><span dir="ltr">'+escapeHtml(x)+'</span></button>'; }); h+='</div>';
    }
    h+='<div class="rep-diff-ctl"><div class="rep-diff-tabs" style="margin:0">';
    if(!repMMIndex) h+='<span class="rep-tool-loading">⏳</span>';
    repMMBookIds().forEach(function(id){ var has=av.indexOf(id)!==-1; h+='<button class="'+(repMMView.book===id?'on':'')+(has?'':' none')+'" '+(has?'onclick="repMMSetBook(\''+id+'\')"':'disabled')+' title="'+_repAttr(repMMBookLabel(id))+'">'+escapeHtml(REP_MM_SHORT[id]||id)+(has?'':' ✕')+'</button>'; });
    h+='</div><label>🔎 <input type="text" id="repMMQ" value="'+_repAttr(repMMView.q)+'" dir="ltr" placeholder="absent, forget" oninput="repMMSearch()" style="width:220px;border:1px solid #cfdbe6;border-radius:8px;padding:4px 8px;font-family:inherit;font-size:12px"></label>'
        +'<button class="rc-btn" onclick="repMMCopy()" title="'+L({ur:'اس کتاب کا متن کاپی',en:'Copy this book\'s text',roman:'Copy'})+'">📋</button></div>';
    head.innerHTML=h; repMMRenderBody();
}
function repMMRenderBody(){
    var L=repLangText, body=document.getElementById('repMMBody'); if(!body)return;
    var a=repMMView.abbr, id=repMMView.book;
    if(!repMMIndex||(id&&!_repMMBooks[id])){ body.innerHTML='<div class="rep-tool-loading">⏳ '+L({ur:'لوڈ ہو رہا ہے…',en:'Loading…',roman:'Load ho raha hai…'})+'</div>'; return; }
    var e=id?repMMEntry(id,a):null;
    if(!e){ body.innerHTML='<div class="rep-tool-loading">'+L({ur:'اس ریمیڈی کا متن ان کتابوں میں نہیں',en:'No text for this remedy in these books',roman:'Is remedy ka matn nahi'})+'</div>'; return; }
    var re=repMMThemeRegex(repMMView.q), h='';
    var meta=repMMIndex.books[id]||{};
    h+='<div class="rep-mm-src">'+repMMBadge(id)+' <b>'+escapeHtml(e.name||a)+'</b>'+(e.common?' <small>('+escapeHtml(e.common)+')</small>':'')+' — '+escapeHtml(repMMBookLabel(id))+' · <a href="'+_repAttr((_repMMBooks[id]&&_repMMBooks[id].source)||'#')+'" target="_blank" rel="noopener">homeoint.org</a> · public domain</div>';
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
