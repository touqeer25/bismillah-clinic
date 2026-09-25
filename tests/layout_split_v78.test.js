// v78: layout/data separation — split files load in order, header tabs, tools moved to Settings, diff tab groups
const fs=require('fs'),path=require('path');const ROOT=path.resolve(__dirname,'..');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const idx=fs.readFileSync(ROOT+'/index.html','utf8');
const order=fs.readFileSync(ROOT+'/js/repertory/LOAD_ORDER.txt','utf8').split(/\s+/).filter(Boolean);
ok(order.length===10&&order.every(f=>fs.existsSync(ROOT+'/js/repertory/'+f)),'10 repertory JS parts exist');
let last=-1,inOrder=true;order.forEach(f=>{const i=idx.indexOf('js/repertory/'+f);if(i<=last)inOrder=false;last=i;});
ok(inOrder&&idx.indexOf('js/repertory/rep-analysis.js')<idx.indexOf('js/08b-rep-differentiation.js'),'index.html loads parts in LOAD_ORDER, before 08b');
ok(!/08-app-repertory\.js|css\/style\.css/.test(idx),'old monolithic files no longer referenced');
const css=['app','repertory','differentiation','repertory-tree','library','layout-header','layout-repertory-toolbar','layout-differentiation'];
last=-1;inOrder=true;css.forEach(n=>{const i=idx.indexOf('css/'+n+'.css');if(i<=last)inOrder=false;last=i;});ok(inOrder,'CSS files linked in cascade order');
const nav=idx.slice(idx.indexOf('<nav class="nav-bar">'),idx.indexOf('</nav>'));
// v79: 7 ٹیبز — «تمام مریض» ہٹائی (ڈیش بورڈ کا «آل ٹائم مریض» ٹیب ہے)، سیٹنگز آخر میں (ریپرٹری کے بعد)
ok((nav.match(/data-page=/g)||[]).length===7&&!/navHelpBtn|navTourBtn|navPrefsBtn|navTipBtn/.test(nav),'main nav = 7 page tabs only');
const navPages=(nav.match(/data-page="([^"]+)"/g)||[]).map(s=>s.slice(11,-1));
ok(JSON.stringify(navPages)===JSON.stringify(['dashboard','newPatient','newVisitPage','searchPatient','diagnosis','repertoryBrowser','settings']),'nav order: settings LAST (after repertory), no allPatients — got '+navPages.join(','));
// v79: نچلی بار — GRADATION ہیڈنگ ہٹی، گریڈ بٹن قابلِ کلک،📚 لائبریری اب مین ٹول بار میں
const tb=idx.slice(idx.indexOf('<div class="rep-toolbar">'),idx.indexOf('rep-layout'));
ok(tb.indexOf('repLibOpen()')>0 && /repBookSelect/.test(tb),'📚 library button moved INTO the main toolbar');
const nb=idx.slice(idx.indexOf('rep-navbar'),idx.indexOf('repRubricContent'));
ok(!/GRADATION:/.test(nb) && (nb.match(/rep-grad-item/g)||[]).length===3 && /repGradeFilter\(3\)/.test(nb),'lower bar: GRADATION heading gone, 3 clickable grade buttons');
ok(!/onclick="repLibOpen\(\)"/.test(nb),'📚 no longer duplicated in the lower bar');
const tree=fs.readFileSync(ROOT+'/js/repertory/rep-tree.js','utf8');
ok(/function repGradeFilter\(/.test(tree)&&/rep-gf-/.test(tree),'repGradeFilter defined (body.rep-gf-N → CSS hides lower grades)');
const rcss=fs.readFileSync(ROOT+'/css/repertory.css','utf8');
ok(/body\.rep-gf-3[\s\S]*?rep-remedy-tag\.g1/.test(rcss)&&/body\.rep-gf-3[\s\S]*?rtv-r\.g1/.test(rcss)&&/body\.rep-gf-2[\s\S]*?g1/.test(rcss),'grade filter CSS: gf-3 hides g1+g2, gf-2 hides g1 (tags + tree)');
const hcss=fs.readFileSync(ROOT+'/css/layout-header.css','utf8');
ok(/body\[dir="rtl"\][\s\S]*?clinic-title\{font-size:15px/.test(hcss),'Urdu (RTL) clinic title font reduced to 15px');
const set=idx.slice(idx.indexOf('id="page-settings"'));
ok(['navPrefsBtn','navHelpBtn','navTourBtn','navTipBtn'].every(id=>set.indexOf('id="'+id+'"')>0),'Preferences/Help/Tour/Tip live in Settings (same ids)');
const sw=fs.readFileSync(ROOT+'/service-worker.js','utf8');
ok(order.every(f=>sw.includes('./js/repertory/'+f))&&css.every(n=>sw.includes('./css/'+n+'.css')),'service worker caches every split file');
const d=fs.readFileSync(ROOT+'/js/08b-rep-differentiation.js','utf8');
ok(/rep-diff-tabgrp/.test(d)&&d.indexOf("tab('rubric'")<d.indexOf("tab('excl'"),'diff tabs grouped (Analysis → Evidence), rubric comparison first');
console.log(fails?'FAILURES: '+fails:'ALL v78 LAYOUT CHECKS PASSED');process.exit(fails?1:0);
