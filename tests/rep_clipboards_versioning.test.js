// v68.6: v54 clipboard migration + data cache-busting (js/08-app-repertory.js)
// run: JSDOM_PATH=/tmp/jsd2/node_modules/jsdom node tests/rep_clipboards_versioning.test.js
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd2/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
const dom=new JSDOM('<!doctype html><html><body></body></html>',{runScripts:'dangerously',url:'http://localhost/'});const w=dom.window;
w.currentLang='ur';w.escapeHtml=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
w.toasts=[];w.showToast=m=>w.toasts.push(String(m));w.repLangText=o=>o.ur;
const asks=[];
w.fetch=u=>{asks.push(String(u));return Promise.resolve({ok:true,json:()=>Promise.resolve({})});};
['js/08-app-repertory.js'].forEach(f=>w.eval(fs.readFileSync(path.join(ROOT,f),'utf8')));
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
// FIX A — 13 boards (a user who once ran a 16-board build) must keep the first 12, not lose everything
w.localStorage.setItem('bc_rep_clipboards', JSON.stringify(Array.from({length:13},(_,i)=>i<12?[{book:'kent',ch:'mind',rid:'r'+i,rems:3,ts:1,w:1}]:[{book:'kent',ch:'mind',rid:'z',rems:1,w:1}])));
w.repClipboards=[[],[],[],[],[],[],[],[],[],[],[],[]];
w.repClipsLoad();
ok(w.repClipboards.length===12,'13 stored boards → 12 live boards');
ok(w.repClipboards[0].length===1&&w.repClipboards[11].length===1&&w.repClipboards[5][0].rid==='r5','the 12 boards are restored (not silently dropped)');
// FIX A2 — a 12-board save still round-trips
w.repClipboards[3].unshift({book:'kent',ch:'cough',rid:'q1',rems:2,ts:2,w:1}); w.repClipsSave();
w.repClipboards=[[],[],[],[],[],[],[],[],[],[],[],[]]; w.repClipsLoad();
ok(w.repClipboards[3][0].rid==='q1','normal save/load round-trip unaffected');
// FIX C — every repertory data request carries the version stamp
asks.length=0; w.loadAllBooksData(function(){});
const bad=asks.filter(a=>/\.json(?!v=)|_index\.json(?!v=)/.test(a.split('?')[0]+'?'+(a.split('?')[1]||''))&&a.indexOf('REP_DATA_V')===-1&&a.indexOf('v=')===-1);
ok(asks.length>0&&asks.every(a=>/[?&]v=15$/.test(a)||a.indexOf('v=')!==-1),'all-books fetches are versioned: '+asks.slice(0,2).join(' , '));
ok(!asks.some(a=>/_index\.json$/.test(a)),'no chapter _index.json is fetched without a version');
console.log(fails?('FAILURES: '+fails):'ALL V68.6 CHECKS PASSED');process.exit(fails?1:0);
