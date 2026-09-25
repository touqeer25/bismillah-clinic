// v80 (صارف فکس): Synthesis 9.1 — چیپٹر نام کا WRAPPER ربرک نہیں! مین ربرکس سطحِ اوپر؛ ادویات/گریڈز/باہمی ٹری بغیر تبدیلی
// نوٹ: 13 ابواب میں چیپٹر-ہیڈ مین ربرک بھی ہے (مثلاً THIRST → «Thirst») — وہ اصل ربرک ہے، رہتا ہے (صارف ہدایت: باقی ٹری نہ بدلیں)
// Run: node tests/synthesis_tree_v80.test.js
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const dom=new JSDOM('<!doctype html><html><body></body></html>',{runScripts:'outside-only',url:'http://localhost/'});
const w=dom.window;
w.currentLang='ur';w.escapeHtml=s=>String(s==null?'':s);w.showToast=()=>{};
w.eval(require('./_rep_src')());
w.repCurrentBook='synthesis91';
const idx=JSON.parse(fs.readFileSync(ROOT+'/synthesis91_raw_chapters/_index.json','utf8'));

// --- 1) MIND نمونہ: مین ربرکس سطحِ اوپر، چیپٹر-نام کا wrapper نہیں ---
const mind=JSON.parse(fs.readFileSync(ROOT+'/synthesis91_raw_chapters/mind.json','utf8'));
const t=w.buildRubricTree(mind);
ok(t.order.indexOf('MIND')===-1,'MIND: چیپٹر-نام کا wrapper سطحِ اوپر نہیں');
ok(t.order.indexOf('ABRUPT')>-1&&t.order.indexOf('ABSENTMINDED')>-1,'MIND: مین ربرکس (ABRUPT/ABSENTMINDED) سیدھا چیپٹر کے نیچے');
ok(t.order.indexOf('Absence of mind, lost in thoughts, absent minded')>-1,'MIND: ایک سطحی مین ربرک بھی سطحِ اوپر');
const ab=t.children['ABRUPT'];
ok(ab&&ab.order.join('|')==='affectionate; rough yet|harsh','ABRUPT کے سب ربرکس بالکل وہی جو تھے');
const leaf=t.children['ABRUPT'].children['harsh']&&t.children['ABRUPT'].children['harsh'].children['children; in'];
ok(leaf&&leaf.remedies.bac===1,'گہری سب ربرک + ادویات طے شدہ (bac:1)');
ok(t.children['Mind']&&t.children['Mind'].order.indexOf('Absence')>-1,'حقیقی چیپٹر-ہیڈ ربرک «Mind» (4 ربرکس) اپنی جگہ محفوظ');

// --- 2) mind: ربرکس/ادویات/گریڈز 100% محفوظ ---
const leaves={};(function walk(n){Object.keys(n.children||{}).forEach(function(k){const c=n.children[k];if(c.hasRubric)leaves[c.rid]=c;walk(c);});})(t);
const rids=Object.keys(mind);
ok(rids.length===Object.keys(leaves).length,'mind: ربرکس کی تعداد برقرار ('+rids.length+')');
let same=true;
rids.forEach(function(rid){const a=mind[rid].r||{},b=(leaves[rid]&&leaves[rid].remedies)||{};if(JSON.stringify(a)!==JSON.stringify(b))same=false;});
ok(same,'mind: ہر ربرک کی ادویات اور گریڈز بالکل وہی');

// --- 3) تمام 83 ابواب: چیپٹر-نام کا exact wrapper کہیں نہیں + کوئی ربرک غائب نہیں ---
let allTop=true,allCnt=true,nch=0;
idx.forEach(function(c){
  const d=JSON.parse(fs.readFileSync(ROOT+'/synthesis91_raw_chapters/'+c.key+'.json','utf8'));
  const tr=w.buildRubricTree(d);nch++;
  if(tr.order.indexOf(c.name)>-1) allTop=false;
  let n=0;(function wk(node){Object.keys(node.children||{}).forEach(function(k){const ch=node.children[k];if(ch.hasRubric)n++;wk(ch);});})(tr);
  if(n!==Object.keys(d).length) allCnt=false;
});
ok(allTop&&nch===idx.length,'تمام '+nch+' ابواب: چیپٹر-نام کا wrapper کہیں بھی مین ربرک نہیں');
ok(allCnt,'تمام '+nch+' ابواب: ہر ربرک موجود (کوئی غائب نہیں)');

// --- 4) حقیقی چیپٹر-ہیڈ مین ربرکس محفوظ (THIRST/HICCOUGH نمونے) ---
const th=w.buildRubricTree(JSON.parse(fs.readFileSync(ROOT+'/synthesis91_raw_chapters/thirst.json','utf8')));
ok(th.children['Thirst']&&th.children['Thirst'].hasRubric&&Object.keys(th.children['Thirst'].remedies).length>50&&th.children['Thirst'].order.indexOf('anger, after')>-1,'THIRST: «Thirst» مین ربرک (114 ادویات + سب ربرکس) محفوظ');
const hi=w.buildRubricTree(JSON.parse(fs.readFileSync(ROOT+'/synthesis91_raw_chapters/hiccough.json','utf8')));
ok(hi.children['Hiccough']&&Object.keys(hi.children['Hiccough'].remedies).length>50,'HICCOUGH: «Hiccough» مین ربرک (108 ادویات) محفوظ');

// --- 5) دوسری کتابوں کی ٹری متبدیل نہیں (Kent prefix-طریقہ پہلے جیسا) ---
w.repCurrentBook='kent';
const kt=w.buildRubricTree({a:{t:'BALL, as if, ascending to throat',r:{lyc:2}},b:{t:'BALL, as if, ascending to throat, rolling in',r:{lyc:1}}});
const ballKey=kt.order[0];
ok(kt.order.length===1&&ballKey==='BALL, as if, ascending to throat'&&kt.children[ballKey].order[0]==='rolling in','Kent/prefix-کتابیں: وہی ٹری (comma+parent-prefix)');

// --- 6) Synthesis تقسیم: parentheses کے اندر " - " سیگمنٹ نہیں بنتا ---
const sp=w._repSplitSynthesisPathForTree('MIND - X (a - b) - Y');
ok(sp.length===3&&sp[0]==='MIND'&&sp[1]==='X (a - b)'&&sp[2]==='Y','Synthesis " - " تقسیم paren-safe');
console.log(fails?'FAILURES: '+fails:'ALL v80 SYNTHESIS TREE CHECKS PASSED');process.exit(fails?1:0);
