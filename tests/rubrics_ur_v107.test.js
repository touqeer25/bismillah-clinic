// v107: ربرک کی سطح کا اردو جملہ (ur/rubrics/<book>/<chapter>.json) — ایپ + اوزار ایک ہی کلید بناتے ہیں،
// صف پر «بنیاد ہلکی + اضافہ نمایاں»، بٹن سے «پورا مطلب ⇄ صرف اضافہ»، تفصیل/تفریق میں ہاتھ کا جملہ سب سے پہلے۔
// چلانے کا طریقہ:  JSDOM_PATH=$PWD/node_modules/jsdom node tests/rubrics_ur_v107.test.js
const fs=require('fs'),path=require('path');const {JSDOM}=require(process.env.JSDOM_PATH||'/tmp/jsd/node_modules/jsdom');
const ROOT=path.resolve(__dirname,'..');
let fails=0;const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)fails++;};
const rd=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const L=require(path.join(ROOT,'tools/rubrics_ur_lib.js'));

// ---------- A. کلید: ایپ == اوزار (ایک ہی فنکشن) اور مشکل صورتیں ----------
const w=L.appWindow(); w.currentLang='ur'; w.repUrLabelsOn=()=>w.currentLang==='ur';
const K=w.repRubKey;
ok(K('ANGER, consoled, when')==='anger, consoled, when','A1 سادہ کلید چھوٹے حروف میں');
ok(K('ABSENT-MINDED (See Forgetful), reading, while')==='absent-minded, reading, while','A2 «(See …)» نکل جاتا ہے، لفظ کا «-» رہتا ہے');
ok(K('ANGER [12]')==='anger','A3 دواؤں کی گنتی [n] نکل جاتی ہے');
ok(K('AMOROUS (See Lewdness and Lascivious, also Genitalia)')==='amorous','A4 لمبا (See …) بھی نکلتا ہے');
ok(K('ANGER,  stabbed, so that he could have, any one')==='anger, stabbed, so that he could have, any one','A5 اندرونی کوما اور دہری جگہ درست');
ok(K('ANXIETY, afternoon, 3 p.m. to 6 p.m.')==='anxiety, afternoon, 3 p.m. to 6 p.m.','A6 وقت کے نقطے محفوظ');
const D=JSON.parse(rd('ur/rubrics/kent/mind.json'));
ok(D.meta&&D.meta.order==='base-first'&&D.rubrics&&Array.isArray(D.locked),'A7 mind.json کی بناوٹ {meta,rubrics,locked}');

// ---------- B. ڈیٹا: ہر کلید MIND کے ٹری میں موجود، کوئی خالی/انگریزی جملہ نہیں ----------
const rows=L.chapterRows(w,'kent','mind'); const keys=new Set(rows.map(r=>r.key));
const bad=Object.keys(D.rubrics).filter(k=>!keys.has(k));
ok(bad.length===0,'B1 mind.json کی ہر کلید MIND ٹری میں ہے'+(bad.length?' — نہیں ملیں: '+bad.slice(0,3).join(' | '):''));
const empty=Object.keys(D.rubrics).filter(k=>!String(D.rubrics[k]).trim());
ok(empty.length===0,'B2 کوئی خالی جملہ نہیں');
const latin=Object.keys(D.rubrics).filter(k=>/[A-Za-z]{2,}/.test(D.rubrics[k]));
ok(latin.length===0,'B3 کسی جملے میں انگریزی حروف نہیں'+(latin.length?' — '+latin.slice(0,3).join(' | '):''));
const urDig=/[\u06F0-\u06F9\u0660-\u0669]/;
ok(!Object.keys(D.rubrics).some(k=>urDig.test(D.rubrics[k])),'B3b صارف کا اصول: جملوں میں ہندسے 1 2 3 (اردو ہندسے نہیں)');
ok(!urDig.test(rd('ur/rubric_labels_ur.json'))&&!urDig.test(rd('ur/glossary_core_v1.json')),'B3c لیبل فائل اور لغت میں بھی اردو ہندسے نہیں');
ok(/REP_RUBUR_V\s*=\s*'\d+'/.test(rd('js/18-rubrics-ur.js'))&&/\.json\?v=' \+ REP_RUBUR_V/.test(rd('js/18-rubrics-ur.js')),'B3d ربرک فائلوں کا اپنا ورژن (REP_RUBUR_V)');
ok(Object.keys(D.rubrics).length===rows.length,'B4 MIND مکمل: ہر ربرک کا جملہ ('+Object.keys(D.rubrics).length+' / '+rows.length+')');
ok(D.rubrics['fear, death, of, menses, before']==='خوف — موت کا، حیض سے پہلے'&&D.rubrics['weeping']==='رونا','B4d بیچ 10 کی مثالیں (FEAR، WEEPING)');
ok(w.repRubUrObl('لکھنا')==='لکھنے'&&w.repRubUrObl('حافظہ')==='حافظے'&&w.repRubUrObl('خوف')==='','B4e مائل شکل: «لکھنا»→«لکھنے»، «حافظہ»→«حافظے»');
ok(D.rubrics['dullness']==='ذہنی سستی (کند ذہنی)'&&D.rubrics['escape, attempts to, window, from']==='فرار (بھاگ نکلنا) کی کوشش کرتا ہے، کھڑکی سے','B4c بیچ 9 کی مثالیں (DULLNESS، ESCAPE)');
ok(D.rubrics['delirium']==='ہذیان'&&D.rubrics['delusions, enlarged, chin is']==='وہم — کہ ٹھوڑی بڑھ گئی ہے','B4b بیچ 8 کی مثالیں (DELIRIUM، DELUSIONS enlarged chin)');
ok(D.rubrics['anger']==='غصہ'&&D.rubrics['anger, consoled, when']==='غصہ — تسلی دینے پر','B5 مثال: ANGER, consoled, when → «غصہ — تسلی دینے پر»');
ok(/^غصہ — غصے کے بعد پیدا ہونے والی شکایات، /.test(D.rubrics['anger, ailments after anger, with anxiety']||''),'B6 گہری سطح والد کے جملے + «، » سے بنتی ہے');
const uniq=new Set(rows.map(r=>r.key)); ok(uniq.size===rows.length||uniq.size>rows.length-40,'B7 کلیدیں تقریباً منفرد ('+(rows.length-uniq.size)+' دہرائی)');

// ---------- C. صف کی HTML: بنیاد/اضافہ، بٹن کا موڈ ----------
w.repRubUrStore('kent','mind',D); w.repCurrentBook='kent'; w.repCurrentChapter='mind';
const r1=rows.find(r=>r.full==='ANGER, consoled, when'); const r0=rows.find(r=>r.full==='ANGER');
const h1=w.repRubUrRowHtml(r1);
ok(/class="rtv-ur rub"/.test(h1)&&/rub-base">غصہ — <\/span>/.test(h1)&&/rub-delta">تسلی دینے پر<\/span>/.test(h1),'C1 صف: بنیاد «غصہ — » ہلکی + اضافہ «تسلی دینے پر» نمایاں');
ok(/lang="ur"/.test(h1)&&/dir="rtl"/.test(h1)&&/title="غصہ — تسلی دینے پر"/.test(h1),'C2 صف: dir=rtl, lang=ur, پورا جملہ title میں');
const h0=w.repRubUrRowHtml(r0); ok(!/rub-base/.test(h0)&&/rub-delta">غصہ<\/span>/.test(h0),'C3 جڑ ربرک: صرف اپنا جملہ');
const s=w.repRubUrSplit('بے چینی — شام 6 بجے','بے چینی — شام'); ok(s.base==='بے چینی — شام'&&s.sep===' '&&s.delta==='6 بجے','C4 جگہ سے جڑا اضافہ الگ ہوتا ہے');
const s2=w.repRubUrSplit('غصہ — تسلی دینے پر','خوشی'); ok(s2.base===''&&s2.delta==='غصہ — تسلی دینے پر','C5 والد میل نہ کھائے تو پورا جملہ اضافہ');
const rD=rows.find(r=>r.full==='ANXIETY, lying, amel.'); const hD=w.repRubUrRowHtml(rD);
ok(/rub-base">بے چینی — <\/span>/.test(hD),'C6 «=» والا جملہ: قریب ترین بزرگ (جڑ) بنیاد بنتی ہے');
ok(w.repRubUrBase('kent','mind',['WRITING','aversion to'],'لکھنے سے بیزار')==='لکھنے','C6b مائل بنیاد: «لکھنا» → «لکھنے سے بیزار» میں بنیاد «لکھنے»');
ok(w.repRubUrMode()==='full','C7 موڈ کی طے شدہ حالت «پورا مطلب»');
w.repRubUrSetMode('delta'); ok(w.repRubUrMode()==='delta'&&w.localStorage.getItem('bc_ur_mode')==='delta','C8 موڈ بدلتا اور محفوظ ہوتا ہے');
const h1d=w.repRubUrRowHtml(r1); ok(/delta-only/.test(h1d)&&!/rub-base/.test(h1d)&&/تسلی دینے پر/.test(h1d),'C9 «صرف اضافہ» موڈ میں بنیاد چھپ جاتی ہے');
w.repRubUrSetMode('full');
ok(w.repRubUrRowHtml({full:'ZZZ NOPE',labels:['ZZZ NOPE'],label:'ZZZ NOPE'})==='','C10 جملہ نہ ہو تو خالی (پرانا نظام چلے گا)');

// ---------- D. تفصیل/تفریق: ہاتھ کا جملہ سب سے پہلے ----------
const J=JSON.parse(rd('ur/rubric_labels_ur.json')); w._repUrLabels=J.labels; w._repUrCtx=J.ctx||{};
ok(w.repRubricUrFull('ANGER, consoled, when')==='غصہ — تسلی دینے پر','D1 repRubricUrFull ہاتھ کا جملہ دیتا ہے (پرانی الٹی ترتیب نہیں)');
ok(w.repPathUrHtml('ANGER - consoled, when').indexOf('غصہ — تسلی دینے پر')>=0,'D2 پرانا راستہ (A - B) بھی ہاتھ کا جملہ');
ok(w.repRubricUrFull('ABSENT-MINDED (See Forgetful), reading, while')==='غائب دماغی (دھیان کہیں اور، بھول پن) — پڑھتے ہوئے','D3 (See …) والا ربرک بھی ملتا ہے');
ok(w.repRubUrFind('ZZZ NOPE, wibble')==='','D4 نہ ملے تو خالی');

// ---------- E. ایپ میں جڑا ہوا ----------
const idx=rd('index.html'), sw=rd('service-worker.js'), tree=rd('js/repertory/rep-tree.js');
ok(/js\/18-rubrics-ur\.js\?v=\d+/.test(idx)&&/css\/rubrics-ur\.css\?v=\d+/.test(idx),'E1 index.html میں نئی js + css (?v= کے ساتھ)');
ok(idx.indexOf('<script src="js/17-rubric-ur.js')<idx.indexOf('<script src="js/18-rubrics-ur.js'),'E2 18-rubrics-ur.js، 17-rubric-ur.js کے بعد لوڈ ہوتی ہے');
ok(/id="repUrModeBtn"/.test(idx)&&!/repUrModeBtn"[^>]*onclick/.test(idx),'E3 ٹول بار میں بٹن #repUrModeBtn (onclick کے بغیر)');
ok(/'\.\/js\/18-rubrics-ur\.js'/.test(sw)&&/'\.\/css\/rubrics-ur\.css'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/mind\.json'/.test(sw),'E4 service-worker میں تینوں نئی فائلیں');
ok(/CACHE_NAME='bhc-clinic-v(1[1-9]\d)'/.test(sw),'E5 CACHE_NAME v110 یا بعد کا');
ok(/repRubUrRowHtml\(r\)/.test(tree)&&/ensureRepRubricsUr\(repCurrentBook,repCurrentChapter/.test(tree),'E6 rep-tree.js: صف پر جملہ + باب کی فائل منگوانا');
ok(!/ensureRepRubricsUr/.test(rd('js/repertory/LOAD_ORDER.txt')),'E7 LOAD_ORDER.txt نہیں چھیڑا');

console.log(fails?`\n${fails} FAIL`:'\nALL PASS'); process.exit(fails?1:0);
