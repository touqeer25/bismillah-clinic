// 📚 v77: مطالعہ لائبریری — فلسفے کی کتابیں (Organon 6th، Chronic Diseases نظریاتی حصہ) جو ریمیڈی وار نہیں۔
// library/_index.json + library/<id>.json = {title,author,year,source,sections:[{h,p:[…]}]}  (tools/mm_build/hahnemann_books.py)
var repLibIndex=null, _repLibBooks={}, repLibView={book:null,sec:0,q:''};
function _repLibL(o){ return (typeof repLangText==='function')?repLangText(o):(o.en||''); }
function repLibEnsureIndex(cb){ if(repLibIndex){ cb&&cb(); return; }
    fetch('library/_index.json?v=1').then(function(r){ return r.json(); }).then(function(d){ repLibIndex=d||{books:[]}; if(window.PS&&PS.hookLibIndex)PS.hookLibIndex(repLibIndex); cb&&cb(); })
        .catch(function(){ repLibIndex={books:[]}; if(window.PS&&PS.hookLibIndex)PS.hookLibIndex(repLibIndex); cb&&cb(); }); }
function repLibLoad(id,cb){ if(_repLibBooks[id]){ cb&&cb(_repLibBooks[id]); return; }
    var m=(repLibIndex.books||[]).filter(function(b){ return b.id===id; })[0]; if(!m) return;
    fetch(m.file+'?v=1').then(function(r){ return r.json(); }).then(function(b){ if(window.PS&&PS.applyLibBook)b=PS.applyLibBook(id,b); _repLibBooks[id]=b; cb&&cb(b); }).catch(function(){ var pb=(window.PS&&PS.applyLibBook)?PS.applyLibBook(id,null):null; if(pb){ _repLibBooks[id]=pb; cb&&cb(pb); } }); }
function repLibOpen(id){
    var m=document.getElementById('repLibModal');
    if(!m){ m=document.createElement('div'); m.id='repLibModal'; m.className='rep-diff-modal';
        m.innerHTML='<div class="rep-diff-back" onclick="repLibClose()"></div><div class="rep-diff-win rep-lib-win"><div id="repLibHead"></div><div class="rep-lib-main"><div id="repLibToc" class="rep-lib-toc"></div><div id="repLibBody" class="rep-diff-body rep-lib-body" dir="ltr"></div></div></div>';
        document.body.appendChild(m);
        document.addEventListener('keydown',function(ev){ var mm=document.getElementById('repLibModal'); if(ev.key==='Escape'&&mm&&mm.style.display==='block') repLibClose(); }); }
    m.style.display='block';
    repLibEnsureIndex(function(){ var bs=repLibIndex.books||[]; repLibView.book=id||repLibView.book||(bs[0]&&bs[0].id); if(repLibView.book) repLibLoad(repLibView.book,repLibRender); repLibRender(); });
}
function repLibClose(){ var m=document.getElementById('repLibModal'); if(m) m.style.display='none'; }
function repLibSetBook(id){ repLibView.book=id; repLibView.sec=0; repLibLoad(id,repLibRender); repLibRender(); }
function repLibGo(i){ repLibView.sec=i; repLibView.q=''; var q=document.getElementById('repLibQ'); if(q)q.value=''; repLibRenderBody(); repLibRenderToc(); }
function repLibSearch(){ var q=document.getElementById('repLibQ'); repLibView.q=q?q.value:''; repLibRenderBody(); }
function repLibGoPara(){ var i=document.getElementById('repLibPara'); var b=_repLibBooks[repLibView.book]; if(!i||!b)return; var n=String(i.value).replace(/\D/g,''); if(!n)return;
    for(var k=0;k<b.sections.length;k++){ if(new RegExp('^§ '+n+'( |$)').test(b.sections[k].h)){ repLibGo(k); return; } } }
function repLibRender(){
    var head=document.getElementById('repLibHead'); if(!head) return; var L=_repLibL;
    var h='<div class="rep-diff-title"><b>📚 '+L({ur:'مطالعہ لائبریری',en:'READING LIBRARY',roman:'MUTALA LIBRARY'})+'</b><span class="rep-diff-sub">'+L({ur:'ہانیمن — فلسفہ',en:'Hahnemann — philosophy',roman:'Hahnemann'})+'</span><button class="rc-btn" onclick="repLibClose()">✕ '+L({ur:'بند',en:'Close',roman:'Band'})+'</button></div>';
    h+='<div class="rep-diff-ctl"><div class="rep-diff-tabs" style="margin:0">';
    (repLibIndex&&repLibIndex.books||[]).forEach(function(b){ h+='<button class="'+(b.id===repLibView.book?'on':'')+'" onclick="repLibSetBook(\''+b.id+'\')" title="'+escapeHtml(b.author+' ('+b.year+') — '+b.words+' words')+'">'+escapeHtml(b.title)+'</button>'; });
    h+='</div><label>§ <input id="repLibPara" type="text" inputmode="numeric" style="width:54px" onkeydown="if(event.key===\'Enter\')repLibGoPara()" placeholder="153"></label>'
      +'<label>🔎 <input type="text" id="repLibQ" dir="ltr" value="'+escapeHtml(repLibView.q)+'" oninput="repLibSearch()" placeholder="vital force, miasm" style="width:200px"></label></div>';
    head.innerHTML=h; repLibRenderToc(); repLibRenderBody();
}
function repLibRenderToc(){ var el=document.getElementById('repLibToc'), b=_repLibBooks[repLibView.book]; if(!el) return;
    if(!b){ el.innerHTML='⏳'; return; }
    el.innerHTML=b.sections.map(function(s,i){ return '<div class="rep-lib-ti'+(i===repLibView.sec?' on':'')+'" onclick="repLibGo('+i+')">'+escapeHtml(s.h)+'</div>'; }).join('');
    var on=el.querySelector('.on'); if(on&&on.scrollIntoView) try{ on.scrollIntoView({block:'nearest'}); }catch(e){} }
function _repLibRe(q){ var w=String(q||'').toLowerCase().split(/[,\s]+/).filter(function(x){ return x.length>1; }); if(!w.length) return null;
    return new RegExp('('+w.map(function(x){ return x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }).join('|')+')','gi'); }
function repLibRenderBody(){
    var el=document.getElementById('repLibBody'), b=_repLibBooks[repLibView.book]; if(!el) return; var L=_repLibL;
    if(!b){ el.innerHTML='<div class="rep-tool-loading">⏳</div>'; return; }
    var re=_repLibRe(repLibView.q), esc=function(t){ var x=escapeHtml(t); return re?x.replace(re,'<mark>$1</mark>'):x; };
    if(re){ var hits=[], words=String(repLibView.q).toLowerCase().split(/[,\s]+/).filter(function(x){ return x.length>1; });
        b.sections.forEach(function(s,i){ s.p.forEach(function(p){ var lp=p.toLowerCase(); if(words.every(function(w){ return lp.indexOf(w)!==-1; })) hits.push({i:i,h:s.h,p:p}); }); });
        el.innerHTML='<div class="rep-lib-meta">'+hits.length+' '+L({ur:'پیراگراف ملے (تمام الفاظ)',en:'paragraphs found (all words)',roman:'paragraph mile'})+'</div>'
            +hits.slice(0,300).map(function(x){ return '<div class="rep-lib-hit"><a onclick="repLibGo('+x.i+')">'+escapeHtml(x.h)+'</a> '+esc(x.p)+'</div>'; }).join('');
        return; }
    var s=b.sections[repLibView.sec]||b.sections[0];
    el.innerHTML='<div class="rep-lib-meta">'+escapeHtml(b.author+' — '+b.title+' ('+b.year+')')+' · <a href="'+escapeHtml(b.source)+'" target="_blank" rel="noopener">source</a>'+(b.note?'<br><i>'+escapeHtml(b.note)+'</i>':'')+'</div>'
        +'<h3 class="rep-lib-h">'+escapeHtml(s.h)+'</h3>'+s.p.map(function(p){ return '<p>'+esc(p)+'</p>'; }).join('')
        +'<div class="rep-lib-nav">'+(repLibView.sec>0?'<button class="rc-btn" onclick="repLibGo('+(repLibView.sec-1)+')">← '+escapeHtml(b.sections[repLibView.sec-1].h)+'</button>':'<span></span>')
        +(repLibView.sec<b.sections.length-1?'<button class="rc-btn" onclick="repLibGo('+(repLibView.sec+1)+')">'+escapeHtml(b.sections[repLibView.sec+1].h)+' →</button>':'')+'</div>';
    el.scrollTop=0;
}
