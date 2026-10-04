/* نسخہ 154 — ریپرٹری کا بیرونی ٹیب اور نیویگیشن خول */
(function(){
    'use strict';

    var VERSION='154';
    var started=false;
    var raw={};
    var shell={
        root:null, strip:null, hostRoot:null, hosts:null, templates:null, layout:null,
        sideCol:null, sideHeader:null, compareTools:null, dockArea:null, toolbarExtras:[],
        tabs:[], byId:Object.create(null), activeId:null, lastRepId:null,
        sidebarMode:'chapters', sidebarHidden:false, suppress:false,
        locks:[], pendingAction:null, searchLock:null, diffLock:null,
        detailLock:null, indexLocks:[], chapterLocks:[],
        toolbar:null, searchInput:null, sideList:null, sideTools:null,
        menus:{}, controls:{}, baseToolsHtml:''
    };

    var STATE_KEYS=[
        'repCurrentBook','repCurrentChapter','repChapterNames','repTreeCache','_repFullData',
        'repCurrentChKey','repCurrentChName','repCurrentFlatTree','repCurrentTree',
        'repTreePage','repTreePageSize','repRidToFlatIndex','repPendingNavRid',
        'repFolderPath','repHistBack','repHistFwd','repFolderFilter','repSortAsc','repRidPathMap',
        'repPendingPath','repCurrentDetail','repPendingDetail',
        'repClipViewOpen','repWorkbenchOpen','repCompareOpen','repAnalysisOpen','repCompareSel','repActiveClip',
        'repLastSearchView','_repSearchBeforeContext','_repSearchCache','_repSearchResults','_repSearchMode',
        'repSearchMode','repSearchScope','repSearchAllBooks',
        'repTreeCollapsed','repTreeViews','repGradeMin','repWbTab','_repWbArm','repAskOpen',
        'repActivePageTab','repDiffCtx','repDiffSel','repDiffTab','repDiffLast','repDiffTheme',
        'repDiffPoolOpen','repDiffOpts','repDiffBookTab'
    ];
    var REFERENCE_KEYS={
        repTreeCache:1,_repFullData:1,repCurrentTree:1,repCurrentFlatTree:1,repRidToFlatIndex:1,
        repRidPathMap:1,repLastSearchView:1,_repSearchResults:1,repDiffCtx:1,repDiffLast:1
    };

    var api={
        openRepertory:openRepertory,
        openBooks:openBooks,
        openSearch:openSearchFromCurrent,
        openDiff:openDiff,
        openCompare:openCompare,
        openClipboard:openClipboard,
        openLibrary:openLibrary,
        toggleSidebar:toggleSidebar,
        closeTab:closeTab,
        setSidebarMode:setSidebarMode,
        activate:activateTab,
        version:VERSION
    };
    window.RepWorkspaceTabs=api;

    function text(map){
        if(typeof window.repLangText==='function') return window.repLangText(map);
        return (map&&(map.ur||map.en||map.roman))||'';
    }
    function escapeHtml(s){
        return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }
    function bookInfo(key){ return (window.REP_BOOK_INFO&&window.REP_BOOK_INFO[key])||{name:key||'Kent',abbr:key||'Kent'}; }
    function clonePlain(value){
        if(value===null||typeof value!=='object') return value;
        if(Array.isArray(value)) return value.map(clonePlain);
        var proto=Object.getPrototypeOf(value);
        if(proto!==Object.prototype&&proto!==null) return value;
        var out={}; Object.keys(value).forEach(function(k){ out[k]=clonePlain(value[k]); }); return out;
    }
    function copyStateValue(key,value){
        if(REFERENCE_KEYS[key]) return value;
        if(key==='repTreeViews') return Object.assign({},value||{});
        if(key==='repChapterNames') return Array.isArray(value)?value.map(function(x){return Object.assign({},x);}):value;
        if(key==='repHistBack'||key==='repHistFwd'||key==='repFolderPath'||key==='repPendingPath'||key==='repCurrentDetail'||key==='repPendingDetail'||key==='_repSearchBeforeContext'||key==='repTreeCollapsed'||key==='repCompareSel'||key==='repDiffSel'||key==='repDiffOpts') return clonePlain(value);
        return value;
    }
    function readState(){
        var out={};
        STATE_KEYS.forEach(function(key){ if(key in window) out[key]=copyStateValue(key,window[key]); });
        return out;
    }
    function restoreState(state){
        if(!state) return;
        STATE_KEYS.forEach(function(key){
            if(Object.prototype.hasOwnProperty.call(state,key)) window[key]=copyStateValue(key,state[key]);
        });
        var select=document.getElementById('repBookSelect');
        if(select&&window.repCurrentBook) select.value=window.repCurrentBook;
    }
    function liveTab(){ return shell.byId[shell.activeId]||null; }
    function findTab(id){ return shell.byId[id]||null; }
    function repId(book){ return 'rep:'+String(book||'kent'); }
    function getRepTab(book){ return findTab(repId(book)); }
    function currentInputValue(){ return shell.searchInput?shell.searchInput.value:''; }
    function setInputValue(value){ if(shell.searchInput) shell.searchInput.value=value==null?'':String(value); }

    function makeTab(type,key){
        var tab={id:'',type:type,book:null,clip:null,hosts:null,vars:null,returnId:null,
            searchValue:'',sidebarMode:'chapters',sideHtml:null,toolsHtml:null,sideScroll:0,
            page:'rep',created:Date.now()};
        if(type==='repertory'){
            tab.book=key||'kent'; tab.id=repId(tab.book);
        } else if(type==='clipboard'){
            tab.clip=Number(key)||0; tab.id='clip:'+tab.clip;
        } else {
            tab.id=type;
        }
        return tab;
    }
    function registerTab(tab){
        shell.tabs.push(tab); shell.byId[tab.id]=tab;
        return tab;
    }
    function newHostSet(){
        var set={};
        ['diff','search','rep'].forEach(function(key){
            var n=shell.templates[key].cloneNode(false);
            n.innerHTML='';
            if(key==='diff'||key==='search') n.style.display='none';
            else n.style.display='';
            set[key]=n;
        });
        return set;
    }
    function detachHostSet(){
        var set=shell.hosts;
        if(!set) return null;
        ['diff','search','rep'].forEach(function(key){ if(set[key]&&set[key].parentNode) set[key].parentNode.removeChild(set[key]); });
        shell.hosts=null;
        return set;
    }
    function attachHostSet(tab){
        if(!tab.hosts) tab.hosts=newHostSet();
        shell.hosts=tab.hosts;
        ['diff','search','rep'].forEach(function(key){ shell.hostRoot.appendChild(tab.hosts[key]); });
    }
    function readSide(tab,keepSearchValue){
        if(!tab) return;
        if(!keepSearchValue) tab.searchValue=currentInputValue();
        if(shell.sideList){ tab.sideHtml=shell.sideList.innerHTML; tab.sideScroll=shell.sideList.scrollTop; }
        if(shell.sideTools) tab.toolsHtml=shell.sideTools.innerHTML;
        tab.sidebarMode=shell.sidebarMode;
        tab.page=window.repActivePageTab||tab.page||'rep';
    }
    function saveActiveTab(keepSearchValue){
        var tab=liveTab();
        if(!tab) return null;
        tab.vars=readState();
        readSide(tab,!!keepSearchValue);
        tab.hosts=detachHostSet();
        return tab;
    }
    function pageForTab(tab){
        if(tab&&tab.type==='search') return 'search';
        if(tab&&tab.type==='diff') return 'diff';
        return 'rep';
    }
    function setPageForTab(tab){
        var page=pageForTab(tab);
        tab.page=page;
        if(raw.pageTab){
            shell.suppress=true;
            try{ raw.pageTab(page); }finally{ shell.suppress=false; }
        }
    }
    function callIf(name){
        var f=window[name]; if(typeof f==='function') try{f();}catch(e){console.warn('rep shell sync:',name,e);}
    }
    function restoreSide(tab){
        if(!tab) return;
        shell.sidebarMode=tab.sidebarMode||'chapters';
        if(shell.sideTools&&tab.toolsHtml!==null&&tab.toolsHtml!==undefined) shell.sideTools.innerHTML=tab.toolsHtml;
        if(shell.sideList){
            if(tab.sideHtml!==null&&tab.sideHtml!==undefined) shell.sideList.innerHTML=tab.sideHtml;
            shell.sideList.scrollTop=tab.sideScroll||0;
        }
        updateSideHeader();
        if(shell.sidebarMode==='books') renderBookList();
        else if(raw.renderChapterList) raw.renderChapterList();
        if(shell.sideList) shell.sideList.scrollTop=tab.sideScroll||0;
    }
    function activateTab(id,options){
        options=options||{};
        var tab=findTab(id); if(!tab) return false;
        if(shell.activeId===id){
            if(options.ensurePage) setPageForTab(tab);
            renderTabStrip();
            return true;
        }
        if(isBusy()&&!options.skipBusy){
            queueAction(function(){activateTab(id,{skipBusy:true});});
            return false;
        }
        saveActiveTab(!!options.keepSearchValue);
        shell.activeId=id;
        if(window._repXrefSeq!==undefined&&typeof window._repXrefSeq==='number') window._repXrefSeq++;
        if(options.resetBook) resetRepStateForBook(options.resetBook);
        else if(options.restore!==false&&tab.vars) restoreState(tab.vars);
        attachHostSet(tab);
        if(options.restore!==false&&tab.searchValue!==undefined) setInputValue(tab.searchValue);
        if(options.restore!==false) restoreSide(tab);
        else {
            shell.sidebarMode=tab.sidebarMode||'chapters';
            if(shell.sideTools&&tab.toolsHtml!==null&&tab.toolsHtml!==undefined) shell.sideTools.innerHTML=tab.toolsHtml;
            if(shell.sideList&&tab.sideHtml!==null&&tab.sideHtml!==undefined) shell.sideList.innerHTML=tab.sideHtml;
            updateSideHeader();
            if(shell.sidebarMode==='books') renderBookList();
            else if(raw.renderChapterList) raw.renderChapterList();
        }
        var select=document.getElementById('repBookSelect');
        if(select&&window.repCurrentBook) select.value=window.repCurrentBook;
        setPageForTab(tab);
        syncVisibleState(tab);
        if(tab.type==='repertory') shell.lastRepId=tab.id;
        renderTabStrip();
        return true;
    }
    function syncVisibleState(tab){
        if(shell.sideList&&tab) shell.sideList.scrollTop=tab.sideScroll||0;
        if(shell.compareTools) shell.compareTools.style.display=tab&&tab.type==='compare'?'':'none';
        updateSearchControls();
        updateSideHeader();
        if(typeof window.repCmpSyncUI==='function') callIf('repCmpSyncUI');
        if(typeof window.repTreeSyncBtns==='function') callIf('repTreeSyncBtns');
        if(typeof window.repGradeSyncBtns==='function') callIf('repGradeSyncBtns');
        if(typeof window.repUpdateNavButtons==='function') callIf('repUpdateNavButtons');
        if(typeof window.repRenderBreadcrumb==='function') callIf('repRenderBreadcrumb');
        if(typeof window.repRenderDock==='function') callIf('repRenderDock');
        if(shell.sidebarMode==='books') renderBookList();
        if(tab&&tab.type==='repertory'&&window.repCurrentDetail&&typeof window.repRenderXrefAppBody==='function'){
            var x=document.getElementById('repXrefAppBody');
            if(x&&x.querySelector('.rpd-xload')){
                try{window.repRenderXrefAppBody(window.repCurrentDetail.full||'',window.repCurrentDetail.rid||'');}catch(e){}
            }
        }
        updateToolbarButtons();
    }

    function getNearestRep(tab){
        tab=tab||liveTab();
        if(tab&&tab.type==='repertory') return tab;
        var cur=tab, seen={};
        while(cur&&cur.returnId&&!seen[cur.returnId]){
            seen[cur.returnId]=1;
            cur=findTab(cur.returnId);
            if(cur&&cur.type==='repertory') return cur;
        }
        if(shell.lastRepId&&findTab(shell.lastRepId)) return findTab(shell.lastRepId);
        for(var i=shell.tabs.length-1;i>=0;i--) if(shell.tabs[i].type==='repertory') return shell.tabs[i];
        return null;
    }
    function getSearchReturnTab(ctx){
        var current=liveTab();
        var wanted=ctx&&ctx.book?getRepTab(ctx.book):null;
        if(wanted) return wanted;
        var byReturn=current&&findTab(current.returnId);
        if(byReturn&&byReturn.type==='repertory') return byReturn;
        return getNearestRep(current);
    }

    function toastWaiting(){
        if(typeof window.showToast==='function'){
            try{window.showToast(text({ur:'موجودہ کام مکمل ہونے دیں، پھر ٹیب کھلے گا',en:'Please wait for the current task to finish',roman:'Maujooda kaam mukammal hone dein, phir tab khulega'}));}catch(e){}
        }
    }
    function isBusy(){ return shell.locks.length>0; }
    function queueAction(fn){
        shell.pendingAction=fn;
        toastWaiting();
    }
    function addLock(type,timeout,cancel){
        var lock={type:type,cancel:cancel||null,timer:null,observer:null,done:false};
        shell.locks.push(lock);
        if(timeout&&timeout>0){
            lock.timer=setTimeout(function(){
                if(lock.done) return;
                if(typeof lock.cancel==='function'){
                    try{lock.cancel();}catch(e){}
                }
                finishLock(lock,true);
            },timeout);
        }
        return lock;
    }
    function finishLock(lock,runPending){
        if(!lock||lock.done) return;
        lock.done=true;
        if(lock.timer) clearTimeout(lock.timer);
        if(lock.observer) try{lock.observer.disconnect();}catch(e){}
        var i=shell.locks.indexOf(lock); if(i!==-1) shell.locks.splice(i,1);
        if(runPending!==false&&!isBusy()&&shell.pendingAction){
            var next=shell.pendingAction; shell.pendingAction=null;
            setTimeout(function(){try{next();}catch(e){console.error('rep shell queued action failed',e);}},0);
        }
    }
    function finishType(type,runPending){
        shell.locks.slice().forEach(function(lock){if(lock.type===type)finishLock(lock,runPending);});
    }
    function cancelSearch(runPending){
        if(typeof window._repSearchSeq==='number') window._repSearchSeq++;
        finishType('search',runPending!==false);
        shell.searchLock=null;
    }
    function finishChapter(book,ch){
        for(var i=shell.chapterLocks.length-1;i>=0;i--){
            var l=shell.chapterLocks[i];
            if(l.book===book&&(!ch||l.chapter===ch)){
                shell.chapterLocks.splice(i,1); finishLock(l,true); return;
            }
        }
    }
    function finishIndex(book){
        for(var i=shell.indexLocks.length-1;i>=0;i--){
            var l=shell.indexLocks[i];
            if(l.book===book){shell.indexLocks.splice(i,1);finishLock(l,true);return;}
        }
    }

    function makeButton(id,icon,titleMap,action,extraClass){
        var b=document.createElement('button');
        b.type='button'; b.id=id; b.className='rep-shell-icon'+(extraClass?' '+extraClass:'');
        b.textContent=icon; b.setAttribute('aria-label',text(titleMap)); b.title=text(titleMap);
        b.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();action();});
        return b;
    }
    function menuButton(id,icon,titleMap,kind,items,selectFn){
        var wrap=document.createElement('span'); wrap.className='rep-shell-menu-wrap';
        var b=makeButton(id,icon,titleMap,function(){toggleMenu(kind);});
        var arr=document.createElement('span'); arr.className='rep-shell-arrow'; arr.textContent='▾'; b.appendChild(arr);
        var menu=document.createElement('div'); menu.className='rep-shell-menu'; menu.setAttribute('role','menu'); menu.dataset.menuKind=kind;
        items.forEach(function(item){
            var opt=document.createElement('button'); opt.type='button'; opt.dataset.value=item.value; opt.setAttribute('role','menuitemradio');
            opt.addEventListener('click',function(ev){ev.preventDefault();ev.stopPropagation();selectFn(item.value);closeMenus();updateSearchControls();});
            menu.appendChild(opt);
        });
        wrap.appendChild(b); wrap.appendChild(menu);
        shell.menus[kind]={wrap:wrap,button:b,menu:menu,items:items};
        return wrap;
    }
    function toggleMenu(kind){
        Object.keys(shell.menus).forEach(function(k){
            var m=shell.menus[k]; if(!m)return;
            m.menu.classList.toggle('open',k===kind&&!m.menu.classList.contains('open'));
            if(k===kind&&m.menu.classList.contains('open')) positionMenu(m);
        });
        updateSearchControls();
    }
    function positionMenu(menu){
        if(!menu||!menu.button||!menu.menu) return;
        var r=menu.button.getBoundingClientRect(),dir=(document.documentElement.dir||'rtl');
        menu.menu.style.position='fixed';menu.menu.style.top=(r.bottom+5)+'px';
        menu.menu.style.left='auto';menu.menu.style.right='auto';
        if(dir==='rtl'){
            var right=Math.max(8,window.innerWidth-r.right);
            menu.menu.style.right=Math.min(right,Math.max(8,window.innerWidth-menu.menu.offsetWidth-8))+'px';
        } else {
            var left=Math.max(8,r.left);
            menu.menu.style.left=Math.min(left,Math.max(8,window.innerWidth-menu.menu.offsetWidth-8))+'px';
        }
        if(r.bottom+menu.menu.offsetHeight+8>window.innerHeight) menu.menu.style.top=Math.max(8,r.top-menu.menu.offsetHeight-5)+'px';
        menu.menu.style.direction=dir;
    }
    function closeMenus(){Object.keys(shell.menus).forEach(function(k){var m=shell.menus[k];if(m)m.menu.classList.remove('open');});}
    function scopeItems(){
        return [
            {value:'chapter',map:{ur:'کھلے باب میں تلاش',en:'Search in open chapter',roman:'Khule baab mein talash'}},
            {value:'book',map:{ur:'اس ریپرٹری میں تلاش',en:'Search in this repertory',roman:'Is repertory mein talash'}},
            {value:'all',map:{ur:'تمام ریپرٹریز میں تلاش',en:'Search in all repertories',roman:'Tamam repertories mein talash'}}
        ];
    }
    function typeItems(){
        return [
            {value:'rubric',map:{ur:'ربرک اور ذیلی ربرک',en:'Rubric and subrubric',roman:'Rubric aur subrubric'}},
            {value:'remedy',map:{ur:'ادویہ',en:'Remedies',roman:'Adwiyeh'}},
            {value:'rubric_remedy',map:{ur:'ربرک اور ادویہ',en:'Rubric and remedies',roman:'Rubric aur adwiyeh'}},
            {value:'clinical',map:{ur:'کلینیکل حالت',en:'Clinical condition',roman:'Clinical halat'}}
        ];
    }
    function updateSearchControls(){
        var values={scope:window.repSearchScope||'chapter',kind:window.repSearchMode||'rubric'};
        ['scope','kind'].forEach(function(key){
            var menu=shell.menus[key]; if(!menu)return;
            var value=values[key];
            var item=menu.items.filter(function(x){return x.value===value;})[0]||menu.items[0];
            var label=item?text(item.map):'';
            menu.button.title=label; menu.button.setAttribute('aria-label',label);
            menu.menu.querySelectorAll('button').forEach(function(btn){
                var selected=btn.dataset.value===value;
                btn.classList.toggle('selected',selected); btn.setAttribute('aria-checked',selected?'true':'false');
                var found=menu.items.filter(function(x){return x.value===btn.dataset.value;})[0];
                btn.textContent=found?text(found.map):'';
            });
        });
    }
    function updateToolbarButtons(){
        var active=liveTab();
        if(shell.controls.books){
            shell.controls.books.classList.toggle('on',shell.sidebarMode==='books');
            shell.controls.books.title=text({ur:'ریپرٹریوں کی فہرست',en:'Repertory list',roman:'Repertories ki fehrist'});
            shell.controls.books.setAttribute('aria-label',shell.controls.books.title);
        }
        if(shell.controls.clip){
            shell.controls.clip.classList.toggle('on',active&&active.type==='clipboard');
            shell.controls.clip.title=text({ur:'فعال کلپ بورڈ کھولیں',en:'Open active clipboard',roman:'Active clipboard kholen'});
            shell.controls.clip.setAttribute('aria-label',shell.controls.clip.title);
        }
    }
    function installToolbar(){
        var toolbar=shell.toolbar, searchWrap=toolbar.querySelector('.rep-search-wrap');
        if(!toolbar||!searchWrap) return;
        toolbar.classList.add('rep-shell-toolbar');
        shell.controls.books=makeButton('repShellBooksBtn','📚',{ur:'ریپرٹریوں کی فہرست',en:'Repertory list',roman:'Repertories ki fehrist'},openBooks);
        shell.controls.library=makeButton('repShellLibraryBtn','📖',{ur:'مطالعہ لائبریری',en:'Reading library',roman:'Mutala library'},openLibrary);
        shell.controls.clip=makeButton('repShellClipboardBtn','📋',{ur:'فعال کلپ بورڈ کھولیں',en:'Open active clipboard',roman:'Active clipboard kholen'},function(){openClipboard(window.repActiveClip||0);});
        var scopeWrap=menuButton('repShellScopeBtn','🔍',{ur:'تلاش کا دائرہ',en:'Search scope',roman:'Talash ka daira'},'scope',scopeItems(),function(v){if(typeof window.setRepSearchScope==='function')window.setRepSearchScope(v);});
        var kindWrap=menuButton('repShellTypeBtn','🏷️',{ur:'تلاش کی قسم',en:'Search type',roman:'Talash ki qisam'},'kind',typeItems(),function(v){if(typeof window.setRepSearchType==='function')window.setRepSearchType(v);});
        toolbar.insertBefore(shell.controls.books,searchWrap);
        toolbar.insertBefore(shell.controls.library,searchWrap);
        toolbar.insertBefore(shell.controls.clip,searchWrap);
        toolbar.insertBefore(scopeWrap,searchWrap);
        toolbar.insertBefore(kindWrap,searchWrap);
        var cmpMode=document.getElementById('repCmpModeBtn');
        var diff=makeButton('repShellDiffBtn','🔬',{ur:'تفریق اور نکاسی',en:'Differentiation and extraction',roman:'Tafreeq aur nikaasi'},openDiff);
        var compare=makeButton('repShellCompareBtn','⇄',{ur:'کلپ بورڈز کا موازنہ',en:'Compare clipboards',roman:'Clipboards ka muwazna'},openCompare,'rep-shell-compare');
        if(cmpMode&&cmpMode.parentNode){cmpMode.parentNode.insertBefore(diff,cmpMode);cmpMode.parentNode.insertBefore(compare,cmpMode);}
        else {toolbar.appendChild(diff);toolbar.appendChild(compare);}
        (shell.toolbarExtras||[]).forEach(function(extra){toolbar.appendChild(extra);});
        shell.controls.diff=diff; shell.controls.compare=compare;
        shell.controls.menus=[scopeWrap,kindWrap];
        document.addEventListener('click',function(ev){
            if(!ev.target.closest('.rep-shell-menu-wrap')) closeMenus();
        });
        updateSearchControls(); updateToolbarButtons();
    }
    function installSideHeader(){
        var parent=shell.sideCol;
        if(!parent) return;
        var row=document.createElement('div'); row.className='rep-shell-side-tools-row'; row.id='repShellSideToolsRow';
        var title=document.createElement('span'); title.className='rep-shell-side-title'; title.id='repShellSideTitle';
        var hide=document.createElement('button'); hide.type='button'; hide.className='rep-shell-side-btn'; hide.id='repShellHideSideBtn';
        hide.dataset.repShellAction='hide'; hide.textContent='◀'; hide.setAttribute('aria-label',text({ur:'سائیڈ بار چھپائیں',en:'Hide sidebar',roman:'Sidebar chhupaein'}));
        row.appendChild(title); row.appendChild(hide);
        parent.insertBefore(row,shell.sideList||parent.firstChild);
        shell.sideHeader=row;
        row.addEventListener('click',function(ev){
            var b=ev.target.closest('[data-rep-shell-action="hide"]');
            if(b){ev.preventDefault();ev.stopPropagation();toggleSidebar();}
        });
        updateSideHeader();
    }
    function moveNavbarControls(){
        var navbar=shell.root&&shell.root.querySelector('.rep-navbar');
        if(!navbar||!shell.toolbar) return;
        var group=document.createElement('div'); group.className='rep-shell-nav-group'; group.setAttribute('aria-label',text({ur:'صفحہ نیویگیشن',en:'Page navigation',roman:'Safha navigation'}));
        ['repBtnBack','repBtnFwd','repBtnUp'].forEach(function(id){
            var button=document.getElementById(id);if(button)group.appendChild(button);
        });
        shell.toolbar.insertBefore(group,shell.toolbar.firstChild);
        var crumb=document.getElementById('repBreadcrumb');
        if(crumb){
            crumb.classList.add('rep-shell-breadcrumb');
            shell.toolbar.insertBefore(crumb,group.nextSibling);
        }
        var gradation=navbar.querySelector('.rep-gradation');
        var views=navbar.querySelector('.rep-viewtoggle');
        shell.toolbarExtras=[];
        if(gradation){gradation.classList.add('rep-shell-toolbar-extra');shell.toolbarExtras.push(gradation);}
        if(views){views.classList.add('rep-shell-toolbar-extra');shell.toolbarExtras.push(views);}
        navbar.remove();
        if(shell.searchInput) shell.searchInput.setAttribute('dir','auto');
    }
    function updateDockPosition(){
        var dock=shell.dockArea||document.getElementById('repDockArea');
        if(!dock||!shell.root||!shell.sideCol) return;
        var pageRect=shell.root.getBoundingClientRect();
        if(pageRect.width<=0||pageRect.height<=0) return;
        var top=Math.round(shell.sideCol.getBoundingClientRect().top);
        if(top>0) dock.style.top=Math.max(8,top)+'px';
        else if(top<=0) dock.style.top='8px';
    }
    function installDockPositioning(){
        if(typeof raw.syncDockTop==='function'){
            window.repSyncDockTop=function(){
                if(!started||shell.suppress) return raw.syncDockTop.apply(this,arguments);
                updateDockPosition();
            };
        }
        window.addEventListener('resize',updateDockPosition);
        window.addEventListener('scroll',updateDockPosition,{passive:true});
        window.addEventListener('load',updateDockPosition);
        if(document.fonts&&document.fonts.addEventListener){
            try{document.fonts.addEventListener('loadingdone',updateDockPosition);}catch(e){}
        }
        setTimeout(updateDockPosition,700);setTimeout(updateDockPosition,1600);setTimeout(updateDockPosition,2600);
    }
    function installCompareTools(main){
        if(!main||!shell.sideTools) return;
        shell.compareTools=document.createElement('div');
        shell.compareTools.id='repShellCompareTools';
        shell.compareTools.className='rep-shell-compare-tools';
        shell.compareTools.setAttribute('aria-label',text({ur:'موازنہ اور کلپ بورڈ کے اوزار',en:'Compare and clipboard tools',roman:'Muwazna aur clipboard tools'}));
        shell.compareTools.style.display='none';
        main.insertBefore(shell.compareTools,shell.hostRoot);
        shell.compareTools.appendChild(shell.sideTools);
    }
    function installSidebarEvents(){
        if(shell.sideList){
            shell.sideList.addEventListener('click',function(ev){
                var b=ev.target.closest('.rep-shell-book-item');
                if(b&&b.dataset.bookKey){ev.preventDefault();openRepertory(b.dataset.bookKey);}
            });
        }
    }
    function updateSideHeader(){
        var title=document.getElementById('repShellSideTitle');
        var hide=document.getElementById('repShellHideSideBtn');
        if(title) title.textContent=shell.sidebarMode==='books'
            ?text({ur:'ریپرٹریوں کی فہرست',en:'Repertories',roman:'Repertories ki fehrist'})
            :text({ur:'ابواب',en:'Chapters',roman:'Abwaab'});
        if(hide){
            hide.textContent=shell.sidebarHidden?'▶':'◀';
            hide.setAttribute('aria-label',shell.sidebarHidden?text({ur:'سائیڈ بار دکھائیں',en:'Show sidebar',roman:'Sidebar dikhayein'}):text({ur:'سائیڈ بار چھپائیں',en:'Hide sidebar',roman:'Sidebar chhupaein'}));
            hide.title=hide.getAttribute('aria-label');
        }
    }
    function toggleSidebar(){
        shell.sidebarHidden=!shell.sidebarHidden;
        var col=document.querySelector('#page-repertoryBrowser .rep-side-col');
        if(col) col.classList.toggle('rep-shell-collapsed',shell.sidebarHidden);
        updateSideHeader();
        if(shell.controls.books) shell.controls.books.classList.toggle('on',shell.sidebarMode==='books');
    }
    function setSidebarMode(mode){
        shell.sidebarMode=(mode==='books')?'books':'chapters';
        var tab=liveTab(); if(tab)tab.sidebarMode=shell.sidebarMode;
        updateSideHeader();
        if(shell.sidebarMode==='books') renderBookList();
        else if(raw.renderChapterList) raw.renderChapterList();
        updateToolbarButtons();
    }
    function openBooks(){
        var tab=liveTab();
        if(shell.sidebarHidden) toggleSidebar();
        setSidebarMode(shell.sidebarMode==='books'?'chapters':'books');
        if(tab) tab.sidebarMode=shell.sidebarMode;
    }
    function renderBookList(){
        var box=shell.sideList;
        if(!box) return;
        box.innerHTML='';
        var head=document.createElement('div'); head.className='rep-shell-list-head';
        var icon=document.createElement('span'); icon.textContent='📚';
        var label=document.createElement('span'); label.textContent=text({ur:'ریپرٹریاں',en:'Repertories',roman:'Repertories'});
        head.appendChild(icon);head.appendChild(label);box.appendChild(head);
        var list=document.createElement('div');list.className='rep-shell-book-list';
        var books=Object.keys(window.REP_BOOK_INFO||{});
        books.forEach(function(key){
            var info=bookInfo(key),b=document.createElement('button');
            b.type='button';b.className='rep-shell-book-item'+(window.repCurrentBook===key?' active':'');
            b.dataset.bookKey=key;b.title=info.name||key;
            var ico=document.createElement('span');ico.className='rep-shell-book-icon';ico.textContent='📘';
            var name=document.createElement('span');name.className='rep-shell-book-name';name.textContent=info.name||key;
            b.appendChild(ico);b.appendChild(name);list.appendChild(b);
        });
        box.appendChild(list);
    }

    function tabIcon(tab){
        if(tab.type==='repertory') return '📘';
        if(tab.type==='search') return '🔍';
        if(tab.type==='diff') return '🔬';
        if(tab.type==='compare') return '⇄';
        if(tab.type==='clipboard') return '📋';
        if(tab.type==='library') return '📖';
        return '📄';
    }
    function tabLabel(tab){
        if(tab.type==='repertory') return bookInfo(tab.book).name||tab.book;
        if(tab.type==='search') return text({ur:'تلاش کے نتائج',en:'Search results',roman:'Talash ke nataij'});
        if(tab.type==='diff') return text({ur:'تفریق / نکاسی',en:'Differentiation / extraction',roman:'Tafreeq / nikaasi'});
        if(tab.type==='compare') return text({ur:'موازنہ',en:'Compare',roman:'Muwazna'});
        if(tab.type==='clipboard'){
            var custom=(window.repClipNames&&window.repClipNames[tab.clip])||'';
            return custom||text({ur:'کلپ بورڈ '+(tab.clip+1),en:'Clipboard '+(tab.clip+1),roman:'Clipboard '+(tab.clip+1)});
        }
        if(tab.type==='library') return text({ur:'مطالعہ لائبریری',en:'Reading library',roman:'Mutala library'});
        return tab.id;
    }
    function tabSub(tab){
        if(tab.type==='repertory'){
            var vars=tab.id===shell.activeId?readState():tab.vars;
            var ch=vars&&vars.repCurrentChapter;
            if(!ch) return '';
            var names=vars.repChapterNames||[];
            var found=names.filter(function(x){return x.key===ch;})[0];
            return found?found.name:ch;
        }
        if(tab.type==='clipboard') return '';
        if(tab.type==='search'){
            var value=tab.id===shell.activeId?(window.repLastSearchView&&window.repLastSearchView.results||[]):
                (tab.vars&&tab.vars.repLastSearchView&&tab.vars.repLastSearchView.results||[]);
            return value.length?String(value.length):'';
        }
        return '';
    }
    function renderTabStrip(){
        var strip=shell.strip; if(!strip) return;
        strip.innerHTML='';
        shell.tabs.forEach(function(tab){
            var button=document.createElement('div');
            button.className='rep-workspace-tab'+(tab.id===shell.activeId?' active':'');
            button.dataset.tabId=tab.id;button.setAttribute('role','tab');button.tabIndex=0;
            button.setAttribute('aria-selected',tab.id===shell.activeId?'true':'false');
            button.title=tabLabel(tab)+(tabSub(tab)?' — '+tabSub(tab):'');
            var icon=document.createElement('span');icon.className='rep-tab-icon';icon.textContent=tabIcon(tab);
            var label=document.createElement('span');label.className='rep-tab-label';label.textContent=tabLabel(tab);
            button.appendChild(icon);button.appendChild(label);
            var sub=tabSub(tab);
            if(sub){var small=document.createElement('span');small.className='rep-tab-sub';small.textContent=sub;button.appendChild(small);}
            var close=document.createElement('button');close.type='button';close.className='rep-tab-close';
            close.dataset.closeTab=tab.id;close.textContent='×';
            close.setAttribute('aria-label',text({ur:'یہ ٹیب بند کریں: ',en:'Close tab: ',roman:'Yeh tab band karein: '})+tabLabel(tab));
            close.title=text({ur:'ٹیب بند کریں',en:'Close tab',roman:'Tab band karein'});
            button.appendChild(close);strip.appendChild(button);
        });
        updateToolbarButtons();
    }
    function installTabEvents(){
        shell.strip.addEventListener('click',function(ev){
            var close=ev.target.closest('[data-close-tab]');
            if(close){ev.preventDefault();ev.stopPropagation();closeTab(close.dataset.closeTab);return;}
            var tab=ev.target.closest('[data-tab-id]');
            if(tab){ev.preventDefault();activateTab(tab.dataset.tabId);}
        });
        shell.strip.addEventListener('keydown',function(ev){
            if(ev.key!=='Enter'&&ev.key!==' ') return;
            var tab=ev.target.closest('[data-tab-id]');
            if(tab&&!ev.target.closest('[data-close-tab]')){ev.preventDefault();activateTab(tab.dataset.tabId);}
        });
    }
    function closeTab(id,skipBusy){
        var tab=findTab(id); if(!tab) return false;
        if(id===shell.activeId&&isBusy()&&!skipBusy){queueAction(function(){closeTab(id,true);});return false;}
        var wasActive=id===shell.activeId;
        var replacement=null;
        if(wasActive){
            replacement=(tab.returnId&&findTab(tab.returnId))?findTab(tab.returnId):null;
            if(!replacement){
                var ix=shell.tabs.indexOf(tab);
                replacement=shell.tabs[ix+1]||shell.tabs[ix-1]||null;
            }
            saveActiveTab();
        }
        shell.tabs=shell.tabs.filter(function(t){return t.id!==id;});
        delete shell.byId[id];
        if(shell.lastRepId===id){
            shell.lastRepId=null;
            for(var li=shell.tabs.length-1;li>=0;li--){if(shell.tabs[li].type==='repertory'){shell.lastRepId=shell.tabs[li].id;break;}}
        }
        shell.tabs.forEach(function(t){if(t.returnId===id)t.returnId=(replacement&&replacement.type==='repertory')?replacement.id:(shell.lastRepId||null);});
        if(wasActive){
            shell.activeId=null; shell.hosts=null;
            if(replacement&&findTab(replacement.id)) activateTab(replacement.id,{skipBusy:true});
            else createFallbackRepertory();
        }
        renderTabStrip();
        return true;
    }
    function createFallbackRepertory(){
        var tab=registerTab(makeTab('repertory','kent'));
        tab.vars=null;tab.searchValue='';tab.sidebarMode='chapters';tab.sideHtml=null;tab.toolsHtml=shell.baseToolsHtml;
        shell.activeId=null;
        activateTab(tab.id,{skipBusy:true,restore:false,resetBook:'kent'});
        if(raw.switchBook) raw.switchBook();
    }

    function makeContextTab(type,key,existingBehavior){
        var source=liveTab();
        var sourceVars=readState();
        var sourceSideMode=shell.sidebarMode;
        var sourceSideHtml=shell.sideList?shell.sideList.innerHTML:null;
        var sourceToolsHtml=shell.sideTools?shell.sideTools.innerHTML:null;
        var sourceScroll=shell.sideList?shell.sideList.scrollTop:0;
        var target=type==='clipboard'?findTab('clip:'+key):findTab(type);
        var isNew=!target;
        if(!target) target=registerTab(makeTab(type,key));
        target.returnId=(getNearestRep(source)&&getNearestRep(source).id)||shell.lastRepId;
        if(isNew||existingBehavior==='context'){
            target.vars=sourceVars;
            target.sidebarMode=sourceSideMode;
            target.sideHtml=sourceSideHtml;
            target.toolsHtml=sourceToolsHtml;
            target.sideScroll=sourceScroll;
            target.searchValue=currentInputValue();
        }
        if(type==='diff'&&existingBehavior==='fresh'){
            target.vars=sourceVars;
            target.hosts=newHostSet();
            target.sidebarMode=sourceSideMode;
            target.sideHtml=sourceSideHtml;
            target.toolsHtml=sourceToolsHtml;
            target.sideScroll=sourceScroll;
            target.searchValue=currentInputValue();
        }
        if(!isNew&&existingBehavior!=='fresh'&&source&&source.id!==target.id&&target.type!=='repertory'){
            target.returnId=(getNearestRep(source)&&getNearestRep(source).id)||target.returnId;
        }
        if(type==='clipboard') target.clip=Number(key)||0;
        activateTab(target.id,{restore:!(isNew||existingBehavior==='context'||existingBehavior==='fresh')});
        return {tab:target,isNew:isNew,source:source};
    }

    function openRepertory(book){
        if(!window.REP_BOOK_INFO||!window.REP_BOOK_INFO[book]) return false;
        if(isBusy()){queueAction(function(){openRepertory(book);});return false;}
        var existing=getRepTab(book);
        if(existing){
            if(!activateTab(existing.id)) return false;
            shell.sidebarMode='chapters';existing.sidebarMode='chapters';
            if(shell.sideList&&raw.renderChapterList) raw.renderChapterList();
            updateSideHeader();renderTabStrip();return true;
        }
        var tab=registerTab(makeTab('repertory',book));
        tab.vars=null;tab.searchValue='';tab.sidebarMode='chapters';tab.sideHtml=null;tab.toolsHtml=shell.baseToolsHtml;
        if(!activateTab(tab.id,{restore:false,resetBook:book})) return false;
        shell.sidebarMode='chapters';tab.sidebarMode='chapters';
        var select=document.getElementById('repBookSelect');if(select)select.value=book;
        if(raw.switchBook) raw.switchBook();
        renderTabStrip();return true;
    }
    function openSearchFromCurrent(query){
        if(isBusy()) return false;
        var source=liveTab();
        if(source&&source.type==='search') return true;
        var ret=getNearestRep(source);
        var search=findTab('search');
        var isNew=!search;
        if(!search) search=registerTab(makeTab('search'));
        search.returnId=(ret&&ret.id)||shell.lastRepId;
        search.vars=readState();
        search.hosts=newHostSet();
        search.searchValue=query==null?currentInputValue():String(query);
        search.sidebarMode=shell.sidebarMode;
        search.sideHtml=shell.sideList?shell.sideList.innerHTML:null;
        search.toolsHtml=shell.sideTools?shell.sideTools.innerHTML:null;
        search.sideScroll=shell.sideList?shell.sideList.scrollTop:0;
        if(!activateTab(search.id,{restore:false,keepSearchValue:true})) return false;
        setInputValue(search.searchValue);
        setPageForTab(search);
        renderTabStrip();return true;
    }
    function openDiff(){
        if(isBusy()){queueAction(openDiff);return false;}
        var found=findTab('diff');
        if(found){return activateTab(found.id);}
        var made=makeContextTab('diff',null,'context');
        if(made.isNew&&raw.diffShow){try{raw.diffShow();}catch(e){console.error(e);}}
        return true;
    }
    function openCompare(){
        if(isBusy()){queueAction(openCompare);return false;}
        if(typeof window.repOpenCompare==='function') return window.repOpenCompare();
        var made=makeContextTab('compare',null,'context');
        return !!made;
    }
    function openClipboard(index){
        index=parseInt(index,10);if(!isFinite(index)||index<0)index=0;
        if(window.REP_N_CLIPS&&index>=window.REP_N_CLIPS)index=window.REP_N_CLIPS-1;
        if(isBusy()){queueAction(function(){openClipboard(index);});return false;}
        var target=findTab('clip:'+index);
        if(target){
            target.returnId=(getNearestRep(liveTab())&&getNearestRep(liveTab()).id)||target.returnId;
            return activateTab(target.id);
        }
        var made=makeContextTab('clipboard',index,'context');
        if(typeof raw.toggleClip==='function'){
            try{raw.toggleClip(index);}catch(e){console.error(e);}
        }
        renderTabStrip();return !!made;
    }
    function openLibrary(id){
        if(isBusy()){queueAction(function(){openLibrary(id);});return false;}
        var target=findTab('library'),isNew=!target;
        if(!target){
            var made=makeContextTab('library',null,'context');target=made.tab;
        } else {
            target.returnId=(getNearestRep(liveTab())&&getNearestRep(liveTab()).id)||target.returnId;
            activateTab(target.id);
        }
        if(isNew&&typeof window.repLibOpen==='function'){
            try{window.repLibOpen(id);}catch(e){console.error(e);}
            moveLibraryIntoActiveHost();
        }
        renderTabStrip();return true;
    }
    function openCompareFresh(){
        var made=makeContextTab('compare',null,'context');
        if(typeof raw.openCompare==='function') raw.openCompare();
        return made;
    }
    function findRootBookForContext(ctx){
        if(ctx&&ctx.book&&window.REP_BOOK_INFO&&window.REP_BOOK_INFO[ctx.book]) return ctx.book;
        var tab=getNearestRep(liveTab());return tab?tab.book:(window.repCurrentBook||'kent');
    }
    function restoreFromSearch(ctx){
        var current=liveTab();
        var input=currentInputValue();
        var book=findRootBookForContext(ctx);
        var target=getRepTab(book)|| (current&&findTab(current.returnId));
        if(!target||target.type!=='repertory'){
            openRepertory(book);target=getRepTab(book);
        } else activateTab(target.id,{skipBusy:true});
        if(input.trim()===''){target.searchValue='';setInputValue('');}
        if(ctx&&input.trim().length<2) window._repSearchBeforeContext=clonePlain(ctx);
        if(raw.pageTab){shell.suppress=true;try{raw.pageTab('rep');}finally{shell.suppress=false;}}
        renderTabStrip();return true;
    }
    function openClipboardTabClose(){
        var tab=liveTab(); if(tab&&tab.type==='clipboard') return closeTab(tab.id);
        return false;
    }

    function resetRepStateForBook(book){
        var defaults={
            repCurrentBook:book,repCurrentChapter:'',repChapterNames:[],repTreeCache:{},_repFullData:null,
            repCurrentChKey:'',repCurrentChName:'',repCurrentFlatTree:[],repCurrentTree:null,
            repTreePage:0,repTreePageSize:50,repRidToFlatIndex:{},repPendingNavRid:null,
            repFolderPath:[],repHistBack:[],repHistFwd:[],repFolderFilter:'',repSortAsc:true,repRidPathMap:{},
            repPendingPath:null,repCurrentDetail:null,repPendingDetail:null,
            repClipViewOpen:false,repWorkbenchOpen:false,repCompareOpen:false,repAnalysisOpen:-1,
            repCompareSel:[false,false,false,false,false,false,false,false],repLastSearchView:null,
            _repSearchBeforeContext:null,_repSearchCache:'',_repSearchResults:null,_repSearchMode:'',
            repSearchMode:'rubric',repSearchScope:'chapter',repSearchAllBooks:false,
            repTreeCollapsed:{},repTreeViews:{},repGradeMin:0,repWbTab:'clips',_repWbArm:-1,repAskOpen:false,
            repActivePageTab:'rep',repDiffCtx:null,repDiffSel:[],repDiffTab:'excl',repDiffLast:null,
            repDiffTheme:'',repDiffPoolOpen:false
        };
        Object.keys(defaults).forEach(function(k){window[k]=defaults[k];});
        shell.sidebarMode='chapters';
        var select=document.getElementById('repBookSelect');if(select)select.value=book;
    }

    function moveLibraryIntoActiveHost(){
        var modal=document.getElementById('repLibModal');
        var host=document.getElementById('repRubricContent');
        if(modal&&host&&modal.parentNode!==host) host.appendChild(modal);
    }

    function installTabState(){
        var page=shell.root;
        if(!page) return false;
        shell.toolbar=page.querySelector('.rep-toolbar');
        shell.sideCol=page.querySelector('.rep-side-col');
        shell.sideList=document.getElementById('repChapterList');
        shell.sideTools=document.getElementById('repSideTools');
        shell.searchInput=document.getElementById('repBrowserSearch');
        shell.dockArea=document.getElementById('repDockArea');
        var main=page.querySelector('.rep-main');
        var layout=page.querySelector('.rep-layout');
        shell.layout=layout;
        var tabbar=document.getElementById('repPageTabs');
        var diff=document.getElementById('repDiffView');
        var search=document.getElementById('repSearchView');
        var rep=document.getElementById('repRubricContent');
        if(!main||!tabbar||!diff||!search||!rep||!shell.toolbar) return false;
        shell.templates={diff:diff.cloneNode(false),search:search.cloneNode(false),rep:rep.cloneNode(false)};
        shell.hostRoot=document.createElement('div');
        shell.hostRoot.id='repShellHostRoot';
        shell.hostRoot.setAttribute('role','tabpanel');
        main.insertBefore(shell.hostRoot,diff);
        shell.hosts={diff:diff,search:search,rep:rep};
        ['diff','search','rep'].forEach(function(k){shell.hostRoot.appendChild(shell.hosts[k]);});
        shell.strip=document.createElement('div');
        shell.strip.id='repWorkspaceTabs';shell.strip.setAttribute('role','tablist');
        shell.strip.setAttribute('aria-label',text({ur:'کھلے صفحات',en:'Open pages',roman:'Khule safhe'}));
        if(layout&&layout.parentNode) layout.parentNode.insertBefore(shell.strip,layout);
        else tabbar.parentNode.insertBefore(shell.strip,shell.hostRoot);
        moveNavbarControls();
        installSideHeader();
        installCompareTools(main);
        shell.baseToolsHtml=shell.sideTools?shell.sideTools.innerHTML:'';
        var first=makeTab('repertory',window.repCurrentBook||'kent');
        first.hosts=shell.hosts;first.vars=readState();first.searchValue=currentInputValue();
        first.sidebarMode='chapters';first.sideHtml=shell.sideList?shell.sideList.innerHTML:null;
        first.toolsHtml=shell.sideTools?shell.sideTools.innerHTML:null;first.sideScroll=shell.sideList?shell.sideList.scrollTop:0;
        registerTab(first);shell.activeId=first.id;shell.lastRepId=first.id;
        shell.sidebarMode='chapters';
        return true;
    }

    function searchLockTimeout(lock){
        if(typeof window._repSearchSeq==='number') window._repSearchSeq++;
        if(shell.searchLock===lock) shell.searchLock=null;
    }
    function observeAllSearch(lock){
        var host=document.getElementById('repSearchView');
        if(!host||!window.MutationObserver) return;
        lock.observer=new MutationObserver(function(){
            var status=host.querySelector('#repAllSearchStatus');
            var value=status?status.textContent:'';
            if(/All repertories loaded|تمام ریپرٹریز مکمل|Tamam repertories complete/i.test(value)){
                finishLock(lock,true);if(shell.searchLock===lock)shell.searchLock=null;
                renderTabStrip();
            }
        });
        lock.observer.observe(host,{subtree:true,childList:true,characterData:true});
    }
    function startSearchLock(){
        var lock=addLock('search',180000,searchLockTimeout);
        shell.searchLock=lock;observeAllSearch(lock);return lock;
    }
    function needsDetailWait(){
        var book=window.repCurrentBook,info=bookInfo(book);
        if(window._repGlossary===null&&!window._repGlossaryFailed) return true;
        if(info&&info.notesFile&&window._repNotes&&!Object.prototype.hasOwnProperty.call(window._repNotes,book)) return true;
        if(window._repRemedyNames===null&&!window._repRemedyNamesLoading) return true;
        return false;
    }

    function installWrappers(){
        raw.pageTab=window.repPageTab;
        raw.switchBook=window.switchRepertoryBook;
        raw.initBook=window.initRepertoryBrowser;
        raw.renderChapterList=window.renderChapterList;
        raw.selectChapter=window.selectChapter;
        raw.renderTree=window.renderTree;
        raw.search=window.searchRepertoryBrowser;
        raw.displaySearchResults=window.displaySearchResults;
        raw.searchTabCount=window.repSearchTabCount;
        raw.openChapter=window.repOpenChapter;
        raw.navigate=window.navigateToRubric;
        raw.toggleClip=window.repToggleClipView;
        raw.closeClip=window.repCloseClipView;
        raw.closeTool=window.repCloseToolView;
        raw.go=window.repGo;raw.back=window.repBack;raw.fwd=window.repFwd;raw.up=window.repUp;
        raw.openRubricDetail=window.repOpenRubricDetail;
        raw.ensureAllBooks=window.repEnsureAllBooks;
        raw.openWorkbench=window.repOpenWorkbench;
        raw.openAnalysis=window.repOpenAnalysis;
        raw.compareToggle=window.repCompareToggle;
        raw.openCompare=window.repOpenCompare;
        raw.diffShow=window.repDiffShow;
        raw.diffRun=window.repDiffRun;
        raw.diffRenderBody=window.repDiffRenderBody;
        raw.diffOpenRubric=window.repDiffOpenForRubric;
        raw.diffOpenRemedies=window.repDiffOpenWithRemedies;
        raw.libOpen=window.repLibOpen;
        raw.libClose=window.repLibClose;
        raw.libEnsure=window.repLibEnsureIndex;
        raw.libLoad=window.repLibLoad;
        raw.renderRubricDetail=window.renderRubricDetail;
        raw.renderXref=window.repRenderXrefAppBody;
        raw.applyLanguage=window.applyLanguage;
        raw.syncDockTop=window.repSyncDockTop;

        if(raw.pageTab){
            window.repPageTab=function(which){
                if(!started||shell.suppress) return raw.pageTab.apply(this,arguments);
                var current=liveTab();
                if(which==='rep'&&current&&current.type==='search'){
                    var query=currentInputValue();
                    var ctx=window._repSearchBeforeContext?clonePlain(window._repSearchBeforeContext):null;
                    if(query.trim().length<2){shell.pendingAction=null;cancelSearch(false);}
                    if(isBusy()){
                        queueAction(function(){restoreFromSearch(ctx);});return;
                    }
                    restoreFromSearch(ctx);return;
                }
                if(which==='rep'&&current&&current.type==='diff'&&current.returnId){
                    var target=findTab(current.returnId);
                    if(target){activateTab(target.id);return;}
                }
                if(which==='diff'&&current&&current.type!=='diff'){
                    openDiff();return;
                }
                return raw.pageTab.apply(this,arguments);
            };
        }
        if(raw.switchBook){
            window.switchRepertoryBook=function(){
                if(!started||shell.suppress) return raw.switchBook.apply(this,arguments);
                var select=document.getElementById('repBookSelect');
                if(select&&select.value) return openRepertory(select.value);
                return raw.switchBook.apply(this,arguments);
            };
        }
        if(raw.initBook){
            window.initRepertoryBrowser=function(){
                if(!started||shell.suppress) return raw.initBook.apply(this,arguments);
                var lock=addLock('book-index',0);
                lock.book=window.repCurrentBook;
                shell.indexLocks.push(lock);
                try{return raw.initBook.apply(this,arguments);}catch(e){
                    var i=shell.indexLocks.indexOf(lock);if(i!==-1)shell.indexLocks.splice(i,1);finishLock(lock,true);throw e;
                }
            };
        }
        if(raw.renderChapterList){
            window.renderChapterList=function(){
                var result=raw.renderChapterList.apply(this,arguments);
                if(started){
                    var tab=liveTab();
                    if(tab&&shell.sidebarMode==='books'){
                        tab.chapterHtml=shell.sideList?shell.sideList.innerHTML:null;
                        renderBookList();
                    }
                    finishIndex(window.repCurrentBook);
                    renderTabStrip();
                }
                return result;
            };
        }
        if(raw.selectChapter){
            window.selectChapter=function(chKey){
                if(!started||shell.suppress) return raw.selectChapter.apply(this,arguments);
                var book=window.repCurrentBook,chapter=chKey;
                var lock=addLock('chapter',0);lock.book=book;lock.chapter=chapter;shell.chapterLocks.push(lock);
                try{
                    var result=raw.selectChapter.apply(this,arguments);
                    if(shell.chapterLocks.indexOf(lock)!==-1&&!document.getElementById('repRubricContent')){
                        shell.chapterLocks.splice(shell.chapterLocks.indexOf(lock),1);finishLock(lock,true);
                    }
                    renderTabStrip();return result;
                }catch(e){
                    var i=shell.chapterLocks.indexOf(lock);if(i!==-1)shell.chapterLocks.splice(i,1);finishLock(lock,true);throw e;
                }
            };
        }
        if(raw.renderTree){
            window.renderTree=function(chKey){
                var result=raw.renderTree.apply(this,arguments);
                if(started) finishChapter(window.repCurrentBook,chKey||window.repCurrentChapter);
                return result;
            };
        }
        if(raw.search){
            window.searchRepertoryBrowser=function(){
                if(!started||shell.suppress) return raw.search.apply(this,arguments);
                var q=currentInputValue().trim();
                var active=liveTab();
                if(active&&active.type==='search'&&shell.searchLock) cancelSearch(false);
                if(q.length>=1&&(!active||active.type!=='search')){
                    if(isBusy()){
                        queueAction(function(){window.searchRepertoryBrowser();});return;
                    }
                    var opened=openSearchFromCurrent(q);
                    if(!opened){queueAction(function(){window.searchRepertoryBrowser();});return;}
                    active=liveTab();
                }
                if(active&&active.type==='search') active.searchValue=q;
                if(q.length>=2){
                    var lock=startSearchLock();
                    try{
                        var result=raw.search.apply(this,arguments);
                        var host=document.getElementById('repSearchView');
                        if(host&&host.querySelector('.empty-state')){finishLock(lock,true);if(shell.searchLock===lock)shell.searchLock=null;}
                        renderTabStrip();return result;
                    }catch(e){finishLock(lock,true);if(shell.searchLock===lock)shell.searchLock=null;throw e;}
                }
                return raw.search.apply(this,arguments);
            };
        }
        if(raw.displaySearchResults){
            window.displaySearchResults=function(){
                var result=raw.displaySearchResults.apply(this,arguments);
                if(started){finishType('search',true);shell.searchLock=null;renderTabStrip();}
                return result;
            };
        }
        if(raw.searchTabCount){
            window.repSearchTabCount=function(){
                var result=raw.searchTabCount.apply(this,arguments);
                if(started)renderTabStrip();
                return result;
            };
        }
        ['go','back','fwd','up'].forEach(function(name){
            var fn=raw[name];if(!fn)return;
            var publicName={go:'repGo',back:'repBack',fwd:'repFwd',up:'repUp'}[name];
            window[publicName]=function(){
                if(!started||shell.suppress) return fn.apply(this,arguments);
                if(isBusy()){
                    var args=Array.prototype.slice.call(arguments);
                    queueAction(function(){window[publicName].apply(window,args);});return;
                }
                return fn.apply(this,arguments);
            };
        });
        if(raw.openRubricDetail){
            window.repOpenRubricDetail=function(){
                if(!started||shell.suppress) return raw.openRubricDetail.apply(this,arguments);
                if(isBusy()){
                    var args=Array.prototype.slice.call(arguments);
                    queueAction(function(){window.repOpenRubricDetail.apply(window,args);});return;
                }
                return raw.openRubricDetail.apply(this,arguments);
            };
        }
        if(raw.ensureAllBooks){
            window.repEnsureAllBooks=function(cb){
                if(!started||shell.suppress) return raw.ensureAllBooks.apply(this,arguments);
                var lock=addLock('all-books',0);
                try{return raw.ensureAllBooks.call(this,function(all){try{if(cb)cb(all);}finally{finishLock(lock,true);}});}
                catch(e){finishLock(lock,true);throw e;}
            };
        }
        if(raw.openChapter){
            window.repOpenChapter=function(chKey){
                if(!started||shell.suppress) return raw.openChapter.apply(this,arguments);
                if(isBusy()){
                    queueAction(function(){window.repOpenChapter(chKey);});return;
                }
                var current=liveTab();
                if(current&&current.type!=='repertory'){
                    var root=getNearestRep(current);
                    if(isBusy()){
                        queueAction(function(){if(root)activateTab(root.id,{skipBusy:true});window.repOpenChapter(chKey);});return;
                    }
                    if(root) activateTab(root.id);
                }
                return raw.openChapter.apply(this,arguments);
            };
        }
        if(raw.navigate){
            window.navigateToRubric=function(book,ch,rid,openDetail){
                if(!started||shell.suppress) return raw.navigate.apply(this,arguments);
                if(isBusy()){
                    var args=Array.prototype.slice.call(arguments);
                    queueAction(function(){window.navigateToRubric.apply(window,args);});return;
                }
                var targetBook=book||window.repCurrentBook||'kent';
                var target=getRepTab(targetBook);
                if(!target){openRepertory(targetBook);target=getRepTab(targetBook);}
                else activateTab(target.id);
                return raw.navigate.call(this,book,ch,rid,openDetail);
            };
        }
        if(raw.toggleClip){
            window.repToggleClipView=function(index){
                if(!started||shell.suppress) return raw.toggleClip.apply(this,arguments);
                index=parseInt(index,10);if(!isFinite(index))index=window.repActiveClip||0;
                var active=liveTab();
                if(active&&active.type==='clipboard'&&active.clip===index) return;
                return openClipboard(index);
            };
        }
        if(raw.closeClip){
            window.repCloseClipView=function(){
                if(started&&liveTab()&&liveTab().type==='clipboard') return closeTab(liveTab().id);
                return raw.closeClip.apply(this,arguments);
            };
        }
        if(raw.closeTool){
            window.repCloseToolView=function(){
                if(started&&liveTab()&&liveTab().type==='compare'){
                    if((window.repWorkbenchOpen||Number(window.repAnalysisOpen)>=0)&&typeof window.repOpenCompare==='function') return window.repOpenCompare();
                    return closeTab(liveTab().id);
                }
                return raw.closeTool.apply(this,arguments);
            };
        }
        if(raw.openWorkbench){
            window.repOpenWorkbench=function(){
                if(!started||shell.suppress) return raw.openWorkbench.apply(this,arguments);
                if(isBusy()){
                    var args=Array.prototype.slice.call(arguments);
                    queueAction(function(){window.repOpenWorkbench.apply(window,args);});return;
                }
                return raw.openWorkbench.apply(this,arguments);
            };
        }
        if(raw.openAnalysis){
            window.repOpenAnalysis=function(){
                if(!started||shell.suppress) return raw.openAnalysis.apply(this,arguments);
                if(isBusy()){
                    var args=Array.prototype.slice.call(arguments);
                    queueAction(function(){window.repOpenAnalysis.apply(window,args);});return;
                }
                return raw.openAnalysis.apply(this,arguments);
            };
        }
        if(raw.compareToggle){
            window.repCompareToggle=function(){
                if(!started||shell.suppress) return raw.compareToggle.apply(this,arguments);
                if(isBusy()){
                    var args=Array.prototype.slice.call(arguments);
                    queueAction(function(){window.repCompareToggle.apply(window,args);});return;
                }
                return raw.compareToggle.apply(this,arguments);
            };
        }
        if(raw.openCompare){
            window.repOpenCompare=function(){
                if(!started||shell.suppress) return raw.openCompare.apply(this,arguments);
                if(isBusy()){queueAction(function(){window.repOpenCompare();});return;}
                if(!liveTab()||liveTab().type!=='compare') makeContextTab('compare',null,'context');
                var result=raw.openCompare.apply(this,arguments);
                renderTabStrip();return result;
            };
        }
        if(raw.diffOpenRubric){
            window.repDiffOpenForRubric=function(){
                if(!started||shell.suppress||liveTab()&&liveTab().type==='diff') return raw.diffOpenRubric.apply(this,arguments);
                if(isBusy()){queueAction(function(){window.repDiffOpenForRubric();});return;}
                makeContextTab('diff',null,'fresh');
                return raw.diffOpenRubric.apply(this,arguments);
            };
        }
        if(raw.diffOpenRemedies){
            window.repDiffOpenWithRemedies=function(){
                if(!started||shell.suppress||liveTab()&&liveTab().type==='diff') return raw.diffOpenRemedies.apply(this,arguments);
                if(isBusy()){
                    var args=Array.prototype.slice.call(arguments);
                    queueAction(function(){window.repDiffOpenWithRemedies.apply(window,args);});return;
                }
                makeContextTab('diff',null,'fresh');
                return raw.diffOpenRemedies.apply(this,arguments);
            };
        }
        if(raw.diffRun){
            window.repDiffRun=function(){
                if(!started||shell.suppress) return raw.diffRun.apply(this,arguments);
                if(window._repDiffBusy&&shell.diffLock) return raw.diffRun.apply(this,arguments);
                var lock=addLock('diff',0);
                shell.diffLock=lock;
                var result;
                try{result=raw.diffRun.apply(this,arguments);}catch(e){finishLock(lock,true);shell.diffLock=null;throw e;}
                if(!window._repDiffBusy){finishLock(lock,true);shell.diffLock=null;}
                return result;
            };
        }
        if(raw.diffRenderBody){
            window.repDiffRenderBody=function(){
                var result=raw.diffRenderBody.apply(this,arguments);
                if(started&&shell.diffLock&&!window._repDiffBusy){finishLock(shell.diffLock,true);shell.diffLock=null;renderTabStrip();}
                return result;
            };
        }
        if(raw.libOpen){
            window.repLibOpen=function(id){
                if(!started||shell.suppress) return raw.libOpen.apply(this,arguments);
                if(isBusy()){queueAction(function(){window.repLibOpen(id);});return;}
                var tab=findTab('library');
                if(!tab) makeContextTab('library',null,'context');
                else activateTab(tab.id);
                var result=raw.libOpen.apply(this,arguments);
                moveLibraryIntoActiveHost();renderTabStrip();return result;
            };
        }
        if(raw.libClose){
            window.repLibClose=function(){
                if(started&&liveTab()&&liveTab().type==='library') return closeTab(liveTab().id);
                return raw.libClose.apply(this,arguments);
            };
        }
        if(raw.libEnsure){
            window.repLibEnsureIndex=function(cb){
                if(!started||shell.suppress) return raw.libEnsure.apply(this,arguments);
                var lock=addLock('library-index',0);
                return raw.libEnsure.call(this,function(){try{if(cb)cb();}finally{finishLock(lock,true);}});
            };
        }
        if(raw.libLoad){
            window.repLibLoad=function(id,cb){
                if(!started||shell.suppress) return raw.libLoad.apply(this,arguments);
                var lock=addLock('library-book',0);
                return raw.libLoad.call(this,id,function(){try{if(cb)cb.apply(this,arguments);}finally{finishLock(lock,true);}});
            };
        }
        if(raw.renderRubricDetail){
            window.renderRubricDetail=function(){
                if(!started||shell.suppress) return raw.renderRubricDetail.apply(this,arguments);
                if(needsDetailWait()&&!shell.detailLock) shell.detailLock=addLock('detail-render',0);
                var result=raw.renderRubricDetail.apply(this,arguments);
                if(shell.detailLock&&!needsDetailWait()){
                    finishLock(shell.detailLock,true);shell.detailLock=null;renderTabStrip();
                }
                return result;
            };
        }
        if(raw.renderXref){
            window.repRenderXrefAppBody=function(){return raw.renderXref.apply(this,arguments);};
        }
        if(raw.applyLanguage){
            window.applyLanguage=function(){
                var result=raw.applyLanguage.apply(this,arguments);
                if(started){
                    renderTabStrip();updateSearchControls();updateToolbarButtons();updateSideHeader();
                    if(shell.sidebarMode==='books')renderBookList();
                }
                return result;
            };
        }
    }

    function init(){
        if(started) return;
        shell.root=document.getElementById('page-repertoryBrowser');
        if(!shell.root) return;
        if(!installTabState()) return;
        installToolbar();installSidebarEvents();installTabEvents();
        installWrappers();
        started=true;
        installDockPositioning();
        setPageForTab(liveTab());
        syncVisibleState(liveTab());
        renderTabStrip();
        document.querySelector('#page-repertoryBrowser .rep-side-col')?.classList.toggle('rep-shell-collapsed',shell.sidebarHidden);
        console.log('Repertory outer tabs ready — v'+VERSION);
    }

    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
    else init();
})();
