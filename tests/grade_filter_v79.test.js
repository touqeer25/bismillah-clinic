// v79 (صارف): نیچلی بار کے گریڈ آئکنز = فلٹر — 3 = صرف 3، 2 = 2+3، 1 = 1+2+3؛ دوبارہ کلک = بند
// ساتھ ہی: GRADATION ہیڈنگ ختم، بک لائبریری مین ٹول بار میں، ہیڈر کلینک نام کا فونٹ چھوٹا
// Run: node tests/grade_filter_v79.test.js
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
// --- 1) index.html / css: ڈھانچہ ---
const idx=fs.readFileSync(ROOT+'/index.html','utf8');
ok(!/rep-grad-label|GRADATION:/.test(idx),'GRADATION heading removed from lower bar');
ok((idx.match(/rep-grad-item/g)||[]).length===3&&/rep-grad-item" data-g="1"[^>]*onclick="repGradeSet\(1\)"/.test(idx)&&/data-g="3"[^>]*onclick="repGradeSet\(3\)"/.test(idx),'3 grade icons are clickable filters (data-g + repGradeSet)');
ok(/rep-lib-btn" onclick="repLibOpen\(\)"/.test(idx)&&idx.indexOf('rep-lib-btn')<idx.indexOf('rep-navbar'),'Book Library button lives in the MAIN toolbar');
ok((idx.match(/onclick="repLibOpen\(\)"/g)||[]).length===1,'Book Library button appears exactly once (moved out of lower bar)');
const hdr=fs.readFileSync(ROOT+'/css/layout-header.css','utf8');
ok(/clinic-title\{font-size:1[0-6]px/.test(hdr.replace(/\s/g,'')),'clinic name font shrunk (fits Urdu without cutting)');
// --- 2) منطق: گریڈ فلٹر (rep-tree.js helper + repTreeRemsHtml) ---
const dom=new JSDOM('<!doctype html><html><body></body></html>',{runScripts:'outside-only',url:'http://localhost/'});
const w=dom.window;
w.currentLang='ur';w.escapeHtml=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));w.showToast=()=>{};
w.eval(require('./_rep_src')());
const rems={calc:3,lyc:2,sulph:1};
ok(w.repGradeShow(1)&&w.repGradeShow(2)&&w.repGradeShow(3),'filter OFF → grades 1/2/3 all show');
w.repGradeSet(3);
ok(!w.repGradeShow(1)&&!w.repGradeShow(2)&&w.repGradeShow(3)&&w.repGradeMin===3,'icon 3 → only grade-3 remedies');
ok(w.repTreeRemsHtml(rems).indexOf('calc')>-1&&w.repTreeRemsHtml(rems).indexOf('lyc')===-1&&w.repTreeRemsHtml(rems).indexOf('sulph')===-1,'tree rows under icon 3: only CALC');
w.repGradeSet(3); ok(w.repGradeMin===0,'click same icon again → filter off');
w.repGradeSet(2);
ok(!w.repGradeShow(1)&&w.repGradeShow(2)&&w.repGradeShow(3)&&w.repGradeMin===2,'icon 2 → grades 2 AND 3');
ok(w.repTreeRemsHtml(rems).indexOf('lyc')>-1&&w.repTreeRemsHtml(rems).indexOf('calc')>-1&&w.repTreeRemsHtml(rems).indexOf('sulph')===-1,'tree rows under icon 2: CALC + LYC');
w.repGradeSet(1);
ok(w.repGradeShow(1)&&w.repGradeShow(2)&&w.repGradeShow(3)&&w.repGradeMin===1,'icon 1 → grades 3, 2 and 1 (all three)');
ok(w.repTreeRemsHtml(rems).indexOf('sulph')>-1,'tree rows under icon 1: all three');
console.log(fails?'FAILURES: '+fails:'ALL v79 GRADE FILTER CHECKS PASSED');process.exit(fails?1:0);
