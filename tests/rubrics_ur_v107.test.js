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
// ---------- C2. VERTIGO: باب کی جڑ «چکر — » ہر صف کی بنیاد ----------
const V=JSON.parse(rd('ur/rubrics/kent/vertigo.json')); w.repRubUrStore('kent','vertigo',V);
const vrows=L.chapterRows(w,'kent','vertigo'); ok(V.meta.root==='چکر — '&&vrows.every(r=>V.rubrics[r.key]&&V.rubrics[r.key].indexOf('چکر — ')===0),'V1 VERTIGO مکمل ('+vrows.length+') اور ہر جملہ «چکر — » سے شروع');
w.repCurrentChapter='vertigo'; const vh=w.repRubUrRowHtml(vrows.find(r=>r.full==='AFTERNOON'));
ok(/rub-base">چکر — <\/span>/.test(vh)&&/rub-delta">سہ پہر<\/span>/.test(vh),'V2 جڑ والے باب میں سرِ عنوان صف: «چکر — » ہلکا، «سہ پہر» نمایاں');
const vh2=w.repRubUrRowHtml(vrows.find(r=>r.full==='FALL, tendency to, backward'));
ok(/rub-base">چکر — گرنے کا رجحان، <\/span>/.test(vh2)&&/rub-delta">پیچھے کو<\/span>/.test(vh2),'V3 گہری سطح: والد کا جملہ بنیاد، اضافہ «پیچھے کو»');
ok(!vrows.some(r=>/[\u06F0-\u06F9]/.test(V.rubrics[r.key])),'V4 VERTIGO میں اردو ہندسے نہیں');
// ---------- C3. HEAD: PAIN کے سوا سب (2,249)، جڑ «سر — » ----------
const H=JSON.parse(rd('ur/rubrics/kent/head.json')); w.repRubUrStore('kent','head',H);
const hrows=L.chapterRows(w,'kent','head'); const hNonPain=hrows.filter(r=>!/^PAIN\b/.test(r.full));
ok(H.meta.root==='سر — '&&hNonPain.every(r=>H.rubrics[r.key]&&H.rubrics[r.key].indexOf('سر — ')===0),'H1 HEAD: PAIN کے سوا ہر ربرک کا جملہ ('+hNonPain.length+') اور ہر جملہ «سر — » سے شروع');
ok(!hrows.some(r=>H.rubrics[r.key]&&/[\u06F0-\u06F9]/.test(H.rubrics[r.key])),'H2 HEAD میں اردو ہندسے نہیں');
ok(H.rubrics['pain']==='سر — درد'&&H.rubrics['pain, evening, bed, in agg.']==='سر — درد، شام بستر میں بگاڑ','H3 HEAD › PAIN کی عمومی شرطیں (799) موجود');
ok(H.rubrics['pain, forehead, eyes, above, left, lying on left side amel.']==='سر — درد، بائیں آنکھ کے اوپر، بائیں پہلو لیٹنے سے آرام'&&H.rubrics['pain, vertex, touch, by laying hand on it, amel.']==='سر — درد، چوٹی میں، ہاتھ رکھنے سے آرام','H4 HEAD › PAIN کے مقام (ماتھا، گدی، پہلو، کنپٹیاں، چوٹی) موجود');
ok(hrows.every(r=>H.rubrics[r.key]&&H.rubrics[r.key].indexOf('سر — ')===0),'H5 HEAD مکمل: ہر ربرک کا جملہ ('+hrows.length+')');
ok(H.rubrics['pain, pressing, forehead, eyes, over, right, upward and inward']==='سر — درد، دبانے والا، دائیں آنکھ کے اوپر، اوپر اور اندر کی طرف'&&H.rubrics['pain, lying, amel.']==='سر — درد، لیٹنے سے آرام','H6 PAIN کی قسموں کی مثالیں');
// ---------- C4. EYE مکمل، جڑ «آنکھ — » ----------
const EY=JSON.parse(rd('ur/rubrics/kent/eye.json')); w.repRubUrStore('kent','eye',EY);
const erows=L.chapterRows(w,'kent','eye');
ok(EY.meta.root==='آنکھ — '&&erows.every(r=>EY.rubrics[r.key]&&EY.rubrics[r.key].indexOf('آنکھ — ')===0),'EY1 EYE مکمل: ہر ربرک کا جملہ ('+erows.length+') اور ہر جملہ «آنکھ — » سے شروع');
ok(!erows.some(r=>/[\u06F0-\u06F9]/.test(EY.rubrics[r.key])),'EY2 EYE میں اردو ہندسے نہیں');
// ---------- C5. VISION مکمل، جڑ «نظر — » ----------
const VI=JSON.parse(rd('ur/rubrics/kent/vision.json')); w.repRubUrStore('kent','vision',VI);
const virows=L.chapterRows(w,'kent','vision');
ok(VI.meta.root==='نظر — '&&virows.every(r=>VI.rubrics[r.key]&&VI.rubrics[r.key].indexOf('نظر — ')===0),'VI1 VISION مکمل: ہر ربرک کا جملہ ('+virows.length+')');
ok(!virows.some(r=>/[\u06F0-\u06F9]/.test(VI.rubrics[r.key])),'VI2 VISION میں اردو ہندسے نہیں');
// ---------- C6. EAR مکمل، جڑ «کان — » ----------
const EA=JSON.parse(rd('ur/rubrics/kent/ear.json')); w.repRubUrStore('kent','ear',EA);
const earows=L.chapterRows(w,'kent','ear');
ok(EA.meta.root==='کان — '&&earows.every(r=>EA.rubrics[r.key]&&EA.rubrics[r.key].indexOf('کان — ')===0),'EA1 EAR مکمل: ہر ربرک کا جملہ ('+earows.length+')');
ok(!earows.some(r=>/[\u06F0-\u06F9]/.test(EA.rubrics[r.key]))&&Array.isArray(EA.meta.auto),'EA2 EAR میں اردو ہندسے نہیں؛ meta.auto موجود');
// ---------- C7. HEARING + NOSE + FACE مکمل ----------
[['hearing','سماعت — '],['nose','ناک — '],['face','چہرہ — '],['mouth','منہ — '],['teeth','دانت — '],['throat','گلا — '],['external_throat','بیرونی گلا — '],['stomach','معدہ — '],['abdomen','پیٹ — '],['stool','پاخانہ — '],['bladder','مثانہ — '],['kidneys','گردے — '],['prostate_gland','پروسٹیٹ غدود — '],['rectum','مقعد — '],['urethra','پیشاب کی نالی — '],['urine','پیشاب — '],['genitalia_male','تناسلی اعضاء (مرد) — ']].forEach(function(p){ const J=JSON.parse(rd('ur/rubrics/kent/'+p[0]+'.json')); w.repRubUrStore('kent',p[0],J); const rs=L.chapterRows(w,'kent',p[0]);
  ok(J.meta.root===p[1]&&rs.every(r=>J.rubrics[r.key]&&J.rubrics[r.key].indexOf(p[1])===0)&&!rs.some(r=>/[\u06F0-\u06F9]/.test(J.rubrics[r.key])),'CH '+p[0]+' مکمل ('+rs.length+')، جڑ «'+p[1]+'»، اردو ہندسے نہیں'); });
w.repCurrentChapter='mind';
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
ok(/CACHE_NAME='bhc-clinic-v(119|1[2-9]\d)'/.test(sw),'E5 CACHE_NAME v119 یا بعد کا');
ok(/'\.\/ur\/rubrics\/kent\/hearing\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/nose\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/face\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/mouth\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/teeth\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/throat\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/external_throat\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/stomach\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/abdomen\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/stool\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/bladder\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/kidneys\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/prostate_gland\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/rectum\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/urethra\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/urine\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/genitalia_male\.json'/.test(sw),'E4f service-worker میں hearing/nose/face/mouth/teeth/throat/external_throat/stomach/abdomen/stool/bladder/kidneys/prostate_gland/rectum/urethra/urine/genitalia_male json');
ok(/'\.\/ur\/rubrics\/kent\/ear\.json'/.test(sw),'E4e service-worker میں ear.json');
ok(fs.existsSync(path.join(ROOT,'tools/review_rubrics_ur.js'))&&/ur\/review\//.test(rd('.gitignore')),'E8 نظرثانی کا اوزار موجود، ur/review/ گٹ میں نظر انداز');
ok(/'\.\/ur\/rubrics\/kent\/vision\.json'/.test(sw),'E4d service-worker میں vision.json');
ok(/'\.\/ur\/rubrics\/kent\/eye\.json'/.test(sw),'E4c service-worker میں eye.json');
ok(/'\.\/ur\/rubrics\/kent\/vertigo\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/head\.json'/.test(sw),'E4b service-worker میں vertigo.json اور head.json');
ok(/repRubUrRowHtml\(r\)/.test(tree)&&/ensureRepRubricsUr\(repCurrentBook,repCurrentChapter/.test(tree),'E6 rep-tree.js: صف پر جملہ + باب کی فائل منگوانا');
ok(!/ensureRepRubricsUr/.test(rd('js/repertory/LOAD_ORDER.txt')),'E7 LOAD_ORDER.txt نہیں چھیڑا');

// ---------- F. کینٹ کتابی ترتیب (v130) ----------
const gmR=L.chapterRows(w,'kent','genitalia_male'); const gi=f=>gmR.findIndex(r=>r.full===f);
ok(gmR.length===1118&&gi('ERECTIONS, troublesome')<gi('ERECTIONS, daytime')&&gi('ERECTIONS, daytime')<gi('ERECTIONS, morning')&&gi('ERECTIONS, morning')<gi('ERECTIONS, forenoon')&&gi('ERECTIONS, forenoon')<gi('ERECTIONS, afternoon')&&gi('ERECTIONS, afternoon')<gi('ERECTIONS, evening')&&gi('ERECTIONS, evening')<gi('ERECTIONS, night'),'F1 ERECTIONS کتابی ترتیب میں (troublesome → daytime → morning → forenoon → afternoon → evening → night)');
ok(gi('ERECTIONS, lying')<gi('ERECTIONS, painful')&&gi('ERECTIONS, painful')<gi('ERECTIONS, seldom')&&gi('ERECTIONS, seldom')<gi('ERECTIONS, violent')&&gi('ERECTIONS, violent')<gi('ERECTIONS, wanting (impotency)'),'F2 ERECTIONS کی ذیلی ربرکیں بھی کتابی ترتیب میں (lying → painful → seldom → violent → wanting)');
const rcR=L.chapterRows(w,'kent','rectum'); const ri=f=>rcR.findIndex(r=>r.full===f);
ok(ri('APHTHOUS condition of anus')<ri('BALL in rectum, sensation of (See Lump)')&&ri('BALL in rectum, sensation of (See Lump)')<ri('BLACK')&&ri('BLACK')<ri('BOILS in anus')&&ri('BOILS in anus')<ri('CANCER')&&ri('CANCER')<ri('CATARRH of the rectum (See Mucus, Moisture)')&&ri('CHILLINESS in rectum before stool')<ri('CHOLERA')&&ri('CHOLERA')<ri('COLDNESS in anus'),'F3 rectum کا آغازکتابی ترتیب میں (کتاب صفحہ 1308 سے ملایا گیا)');
const ci=f=>gmR.findIndex(r=>r.full===f);
ok(ci('COLDNESS, morning')<ci('COLDNESS, evening')&&ci('COLDNESS, evening')<ci('COLDNESS, urination, during')&&ci('COLDNESS, urination, during')<ci('COLDNESS, penis')&&ci('COLDNESS, penis')<ci('COLDNESS, scrotum')&&ci('COLDNESS, scrotum')<ci('COLDNESS, testes'),'F4 COLDNESS: وقت → شرط → محل (کتاب صفحہ 1495)');
const rch=rd('js/repertory/rep-chapters.js');
ok(/_repSortTreeKentOrder/.test(rch)&&/repCurrentBook === 'kent'/.test(rch),'F5 ترتیب کا فنکشن موجود اور صرف کینٹ پر لاگو');
ok(/js\/repertory\/rep-chapters\.js\?v=13\d/.test(idx),'F6 index.html میں rep-chapters.js کا نیا ورژن (v130/131)');
ok(/CACHE_NAME='bhc-clinic-v13\d'/.test(sw),'F7 CACHE_NAME v130/131');

// ---------- G. مین ربرک حروفِ تہجی + «آخر میں پھنسے ہوئے» ربرک اپنی جگہ (v131) ----------
const rc131=L.chapterRows(w,'kent','rectum'); const r131=i=>rc131.findIndex(f=>f.full===i);
ok(rc131.filter(f=>f.depth===0).findIndex(f=>f.full==='ASH-COLORED (See Gray)')===2,'G1 rectum: «ASH-COLORED (See Gray)» مین ربرک اپنی حروفِ تہجی والی جگہ پر (APHTHOUS کے بعد، BALL سے پہلے) #2');
const kd131=L.chapterRows(w,'kent','kidneys').filter(f=>f.depth===0).map(f=>f.full);
ok(kd131[0]==='ABSCESS'&&kd131.indexOf('HEAT')>0&&kd131.indexOf('HEAT')<kd131.indexOf('HEAVINESS')&&kd131.indexOf('NUMBNESS')<kd131.indexOf('PAIN'),'G2 kidneys کتابی ترتیب پر (ABSCESS پہلا؛ HEAT → HEAVINESS؛ NUMBNESS → PAIN — کتاب PDF1460)');
const gn131=L.chapterRows(w,'kent','generalities').filter(f=>f.depth===0).map(f=>f.full);
ok(gn131[0]==='DAYTIME'&&gn131.indexOf('DAYTIME')<gn131.indexOf('MORNING')&&gn131.indexOf('SWELLING')+1===gn131.indexOf('SWELLING in general'),'G3 generalities: DAYTIME پہلا (کتاب کا آغاز) اور «SWELLING in general» اپنی جگہ پر — «… in general» صرف اُس وقت سب سے اوپر جب وہ باب کا پہلا ربرک ہو');
const cl131=L.chapterRows(w,'kent','chill').filter(f=>f.depth===0).map(f=>f.full);
ok(cl131[0]==='COLDNESS in general'&&cl131[1]==='DAYTIME','G4 chill: «COLDNESS in general» پہلا پھر DAYTIME (کتاب صفحہ 2770 / PDF2804)');
const fv131=L.chapterRows(w,'kent','fever').filter(f=>f.depth===0).map(f=>f.full);
ok(fv131[0]==='HEAT in general'&&fv131[1]==='MORNING','G5 fever: «HEAT in general» پہلا پھر MORNING (کتاب صفحہ 2803 / PDF2838)');
const bk131=L.chapterRows(w,'kent','back').filter(f=>f.depth===0).map(f=>f.full);
const bIdx=x=>bk131.indexOf(x);
ok(bIdx('BOILS (See Eruptions)')<bIdx('BROWN')&&bIdx('BROWN')<bIdx('BROWN spots on')&&bIdx('BROWN spots on')<bIdx('BRUISES on spine (See Injuries)'),'G6 back: BOILS → BROWN → BROWN spots on → BRUISES (کتاب PDF1953)');
let rootCount=0; L.chapterRows(w,'kent','mind');
['mind','vertigo','head','eye','vision','ear','nose','face','mouth','teeth','throat','external_throat','stomach','abdomen','rectum','stool','bladder','kidneys','prostate_gland','urethra','urine','genitalia_male','genitalia_female','cough','expectoration','chest','back','extremities','sleep','chill','fever','perspiration','skin','generalities','larynx_and_trachea','respiration','hearing'].forEach(function(c){ try{ rootCount += L.chapterRows(w,'kent',c).filter(function(f){return f.depth===0;}).length; }catch(e){} });
ok(rootCount===4709,'G7 37 ابواب کی مین ربرک: '+rootCount+' (کوئی کم/زیادہ نہیں — کوئی ربرک گم نہیں ہوا)');

console.log(fails?`\n${fails} FAIL`:'\nALL PASS'); process.exit(fails?1:0);
