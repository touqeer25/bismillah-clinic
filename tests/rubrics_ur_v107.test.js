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
// v143: چھپائے گئے twins کی کلیدیں جائز طور پر ٹری میں غیر حاضر ہیں (kent-tree-fix.js) — h میں r-id ہیں، کلید = repRubKey(t)
const _mindData=JSON.parse(rd('kent_chapters/mind.json'));
const hideSet=new Set((w.KENT_TREE_FIX&&w.KENT_TREE_FIX.ch['mind'])?w.KENT_TREE_FIX.ch['mind'].h.map(id=>w.repRubKey((_mindData[id]||{}).t||'')):[]);
const bad=Object.keys(D.rubrics).filter(k=>!keys.has(k)&&!hideSet.has(k));
ok(bad.length===0,'B1 mind.json کی ہر کلید MIND ٹری میں ہے'+(bad.length?' — نہیں ملیں: '+bad.slice(0,3).join(' | '):''));
const empty=Object.keys(D.rubrics).filter(k=>!String(D.rubrics[k]).trim());
ok(empty.length===0,'B2 کوئی خالی جملہ نہیں');
const latin=Object.keys(D.rubrics).filter(k=>/[A-Za-z]{2,}/.test(D.rubrics[k]));
ok(latin.length===0,'B3 کسی جملے میں انگریزی حروف نہیں'+(latin.length?' — '+latin.slice(0,3).join(' | '):''));
const urDig=/[\u06F0-\u06F9\u0660-\u0669]/;
ok(!Object.keys(D.rubrics).some(k=>urDig.test(D.rubrics[k])),'B3b صارف کا اصول: جملوں میں ہندسے 1 2 3 (اردو ہندسے نہیں)');
ok(!urDig.test(rd('ur/rubric_labels_ur.json'))&&!urDig.test(rd('ur/glossary_core_v1.json')),'B3c لیبل فائل اور لغت میں بھی اردو ہندسے نہیں');
ok(/REP_RUBUR_V\s*=\s*'\d+'/.test(rd('js/18-rubrics-ur.js'))&&/\.json\?v=' \+ REP_RUBUR_V/.test(rd('js/18-rubrics-ur.js')),'B3d ربرک فائلوں کا اپنا ورژن (REP_RUBUR_V)');
ok(rows.length===4358&&Object.keys(D.rubrics).length===4358&&D.meta.untranslated_count===0,'B4 MIND مکمل 4,358/4,358 — v157: 2 سرخی-ربرکس (ANXIETY chill, during · MISTAKES words, mispronounces) بھی ترجمہ شدہ، کوئی زیرِ ترجمہ نہیں');
ok(D.rubrics['fear, death, of, menses, before']==='خوف — موت کا، حیض سے پہلے'&&D.rubrics['weeping, tearful mood, etc.']==='رونا — رونے والا مزاج وغیرہ','B4d ماخذی عنوان کے مطابق FEAR اور WEEPING کی مثالیں');
ok(w.repRubUrObl('لکھنا')==='لکھنے'&&w.repRubUrObl('حافظہ')==='حافظے'&&w.repRubUrObl('خوف')==='','B4e مائل شکل: «لکھنا»→«لکھنے»، «حافظہ»→«حافظے»');
ok(D.rubrics['dullness, sluggishness, difficulty of thinking and comprehending']==='ذہنی سستی (کند ذہنی) — سست روی، سوچنے اور سمجھنے میں دشواری'&&D.rubrics['escape, attempts to, window, from']==='فرار (بھاگ نکلنا) کی کوشش کرتا ہے، کھڑکی سے','B4c موجودہ ماخذی عنوان کے مطابق DULLNESS اور ESCAPE کی مثالیں');
ok(D.rubrics['delirium']==='ہذیان'&&D.rubrics['delusions, imaginations, hallucinations, illusions, enlarged, chin is']==='وہم — کہ ٹھوڑی بڑھ گئی ہے','B4b ماخذی DELIRIUM اور DELUSIONS عنوان کی مثالیں');
ok(D.rubrics['anger, irascibility']==='غصہ — چڑچڑاپن، بات بات پر بھڑک اٹھنا'&&D.rubrics['anger, irascibility, consoled, when']==='غصہ — تسلی دینے پر','B5 ماخذی ANGER, irascibility راستے کی مثالیں');
ok(/^غصہ — غصے کے بعد پیدا ہونے والی شکایات، /.test(D.rubrics['anger, irascibility, ailments after anger with anxiety']||''),'B6 گہری سطح موجودہ والد کے جملے + «، » کے مطابق ہے');
const uniq=new Set(rows.map(r=>r.key)); ok(uniq.size===rows.length||uniq.size>rows.length-40,'B7 کلیدیں تقریباً منفرد ('+(rows.length-uniq.size)+' دہرائی)');

// ---------- C. صف کی HTML: بنیاد/اضافہ، بٹن کا موڈ ----------
w.repRubUrStore('kent','mind',D); w.repCurrentBook='kent'; w.repCurrentChapter='mind';
const r1=rows.find(r=>r.full==='ANGER, irascibility (See Irritability and Quarrelsome), consoled, when');   // موجودہ ماخذی والد «ANGER, irascibility»
const h1=w.repRubUrRowHtml(r1);
// v143: والد اب «ANGER, irascibility» ہے — اس کا جملہ ('غصہ — چڑچڑاپن…') بچے کے جملے کا سابقہ نہیں،
// اس لیے پورا جملہ ایک اضافہ دکھایا جاتا ہے (C5 کا منظور شدہ قاعدہ) — جملہ مکمل اور درست رہتا ہے
ok(/class="rtv-ur rub"/.test(h1)&&/title="غصہ — تسلی دینے پر"/.test(h1)&&/rub-delta">غصہ — تسلی دینے پر<\/span>/.test(h1),'C1 صف: پورا جملہ «غصہ — تسلی دینے پر» نمایاں (v143: والد ANGER, irascibility)');
ok(/lang="ur"/.test(h1)&&/dir="rtl"/.test(h1)&&/title="غصہ — تسلی دینے پر"/.test(h1),'C2 صف: dir=rtl, lang=ur, پورا جملہ title میں');
const r0=rows.find(r=>r.full==='ANGER, irascibility (See Irritability and Quarrelsome)');   // جڑ کا ماخذی عنوان برقرار ہے؛ صرف نمائش میں حوالہ چھپتا ہے
const h0=w.repRubUrRowHtml(r0); ok(!/rub-base/.test(h0)&&/rub-delta">غصہ — چڑچڑاپن، بات بات پر بھڑک اٹھنا<\/span>/.test(h0),'C3 جڑ ربرک: صرف اپنا جملہ (ANGER, irascibility)');
const s=w.repRubUrSplit('بے چینی — شام 6 بجے','بے چینی — شام'); ok(s.base==='بے چینی — شام'&&s.sep===' '&&s.delta==='6 بجے','C4 جگہ سے جڑا اضافہ الگ ہوتا ہے');
const s2=w.repRubUrSplit('غصہ — تسلی دینے پر','خوشی'); ok(s2.base===''&&s2.delta==='غصہ — تسلی دینے پر','C5 والد میل نہ کھائے تو پورا جملہ اضافہ');
const rD=rows.find(r=>r.full==='ANXIETY, lying, while, amel.'); const hD=w.repRubUrRowHtml(rD);
ok(/rub-base">بے چینی — <\/span>/.test(hD),'C6 «=» والا جملہ: قریب ترین بزرگ (جڑ) بنیاد بنتی ہے');
ok(w.repRubUrObl('لکھنا')==='لکھنے','C6b موجودہ جڑ ساخت میں بھی مصدر کی مائل صورت «لکھنے» محفوظ');
// اس ورک اسپیس کی جزوی نقل میں صرف MIND کی تازہ ترجمہ فائل موجود ہے۔
// دوسرے ابواب کے پرانے جامع ٹیسٹ ان کی فائلیں حاضر ہوں تو چلیں؛ انہیں غائب مواد سے نہ بھریں۔
const requiredOtherChapters=['vertigo','head','eye','vision','ear','hearing','nose','face','mouth','teeth','throat','external_throat','stomach','abdomen','stool','bladder','kidneys','prostate_gland','rectum','urethra','urine','genitalia_male','genitalia_female','larynx_and_trachea','respiration','expectoration','cough','chest','back','extremities','sleep','chill','fever','perspiration','skin','generalities'];
const missingOtherChapters=requiredOtherChapters.filter(c=>!fs.existsSync(path.join(ROOT,'ur/rubrics/kent',c+'.json')));
if(missingOtherChapters.length){
  console.log('SKIP باقی بابوں کی جانچ: اس جزوی ورک اسپیس میں ان کی ترجمہ فائلیں موجود نہیں؛ MIND کی جانچ اوپر مکمل ہوئی۔');
  process.exit(fails?1:0);
}

// ---------- C2. VERTIGO: باب کی جڑ «چکر — » ہر صف کی بنیاد ----------
const V=JSON.parse(rd('ur/rubrics/kent/vertigo.json')); w.repRubUrStore('kent','vertigo',V);
const vrows=L.chapterRows(w,'kent','vertigo'); ok(V.meta.root==='چکر — '&&vrows.every(r=>V.rubrics[r.key]&&(r.key==='vertigo'?V.rubrics[r.key]==='چکر':V.rubrics[r.key].indexOf('چکر — ')===0)),'V1 VERTIGO مکمل ('+vrows.length+') اور ہر جملہ «چکر — » سے شروع (جڑ: «چکر»)');
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
[['hearing','سماعت — '],['nose','ناک — '],['face','چہرہ — '],['mouth','منہ — '],['teeth','دانت — '],['throat','گلا — '],['external_throat','بیرونی گلا — '],['stomach','معدہ — '],['abdomen','پیٹ — '],['stool','پاخانہ — '],['bladder','مثانہ — '],['kidneys','گردے — '],['prostate_gland','پروسٹیٹ غدود — '],['rectum','مقعد — '],['urethra','پیشاب کی نالی — '],['urine','پیشاب — '],['genitalia_male','تناسلی اعضاء (مرد) — '],['genitalia_female','تناسلی اعضاء (عورت) — ']].forEach(function(p){ const J=JSON.parse(rd('ur/rubrics/kent/'+p[0]+'.json')); w.repRubUrStore('kent',p[0],J); const rs=L.chapterRows(w,'kent',p[0]);
  ok(J.meta.root===p[1]&&rs.every(r=>J.rubrics[r.key]&&J.rubrics[r.key].indexOf(p[1])===0)&&!rs.some(r=>/[\u06F0-\u06F9]/.test(J.rubrics[r.key])),'CH '+p[0]+' مکمل ('+rs.length+')، جڑ «'+p[1]+'»، اردو ہندسے نہیں'); });
w.repCurrentChapter='mind';
ok(w.repRubUrMode()==='full','C7 موڈ کی طے شدہ حالت «پورا مطلب»');
w.repRubUrSetMode('delta'); ok(w.repRubUrMode()==='delta'&&w.localStorage.getItem('bc_ur_mode')==='delta','C8 موڈ بدلتا اور محفوظ ہوتا ہے');
const h1d=w.repRubUrRowHtml(r1); ok(/delta-only/.test(h1d)&&!/rub-base/.test(h1d)&&/تسلی دینے پر/.test(h1d),'C9 «صرف اضافہ» موڈ میں بنیاد چھپ جاتی ہے');
w.repRubUrSetMode('full');
ok(w.repRubUrRowHtml({full:'ZZZ NOPE',labels:['ZZZ NOPE'],label:'ZZZ NOPE'})==='','C10 جملہ نہ ہو تو خالی (پرانا نظام چلے گا)');

// ---------- D. تفصیل/تفریق: ہاتھ کا جملہ سب سے پہلے ----------
const J=JSON.parse(rd('ur/rubric_labels_ur.json')); w._repUrLabels=J.labels; w._repUrCtx=J.ctx||{};
ok(w.repRubricUrFull('ANGER, irascibility (See Irritability and Quarrelsome), consoled, when')==='غصہ — تسلی دینے پر','D1 repRubricUrFull ماخذی والد کے راستے کا ہاتھ والا جملہ دیتا ہے');
ok(w.repPathUrHtml('ANGER, irascibility (See Irritability and Quarrelsome) - consoled, when').indexOf('غصہ — تسلی دینے پر')>=0,'D2 راستے کے جملے میں بھی ماخذی والد کے مطابق ترجمہ ملتا ہے');
ok(w.repRubricUrFull('ABSENT-MINDED (See Forgetful), reading, while')==='غائب دماغی (دھیان کہیں اور، بھول پن) — پڑھتے ہوئے','D3 (See …) والا ربرک بھی ملتا ہے');
ok(w.repRubUrFind('ZZZ NOPE, wibble')==='','D4 نہ ملے تو خالی');

// ---------- E. ایپ میں جڑا ہوا ----------
const idx=rd('index.html'), sw=rd('service-worker.js'), tree=rd('js/repertory/rep-tree.js');
ok(/js\/18-rubrics-ur\.js\?v=\d+/.test(idx)&&/css\/rubrics-ur\.css\?v=\d+/.test(idx),'E1 index.html میں نئی js + css (?v= کے ساتھ)');
ok(idx.indexOf('<script src="js/17-rubric-ur.js')<idx.indexOf('<script src="js/18-rubrics-ur.js'),'E2 18-rubrics-ur.js، 17-rubric-ur.js کے بعد لوڈ ہوتی ہے');
ok(/id="repUrModeBtn"/.test(idx)&&!/repUrModeBtn"[^>]*onclick/.test(idx),'E3 ٹول بار میں بٹن #repUrModeBtn (onclick کے بغیر)');
ok(/'\.\/js\/18-rubrics-ur\.js'/.test(sw)&&/'\.\/css\/rubrics-ur\.css'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/mind\.json'/.test(sw),'E4 service-worker میں تینوں نئی فائلیں');
ok(/CACHE_NAME='bhc-clinic-v(119|1[2-9]\d)'/.test(sw),'E5 CACHE_NAME v119 یا بعد کا');
ok(/'\.\/ur\/rubrics\/kent\/hearing\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/nose\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/face\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/mouth\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/teeth\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/throat\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/external_throat\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/stomach\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/abdomen\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/stool\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/bladder\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/kidneys\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/prostate_gland\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/rectum\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/urethra\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/urine\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/genitalia_male\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/genitalia_female\.json'/.test(sw),'E4f service-worker میں hearing/nose/face/mouth/teeth/throat/external_throat/stomach/abdomen/stool/bladder/kidneys/prostate_gland/rectum/urethra/urine/genitalia_male/genitalia_female json');
ok(/'\.\/ur\/rubrics\/kent\/ear\.json'/.test(sw),'E4e service-worker میں ear.json');
ok(fs.existsSync(path.join(ROOT,'tools/review_rubrics_ur.js'))&&/ur\/review\//.test(rd('.gitignore')),'E8 نظرثانی کا اوزار موجود، ur/review/ گٹ میں نظر انداز');
ok(/'\.\/ur\/rubrics\/kent\/vision\.json'/.test(sw),'E4d service-worker میں vision.json');
ok(/'\.\/ur\/rubrics\/kent\/eye\.json'/.test(sw),'E4c service-worker میں eye.json');
ok(/'\.\/ur\/rubrics\/kent\/vertigo\.json'/.test(sw)&&/'\.\/ur\/rubrics\/kent\/head\.json'/.test(sw),'E4b service-worker میں vertigo.json اور head.json');
ok(/repRubUrRowHtml\(r\)/.test(tree)&&/ensureRepRubricsUr\(repCurrentBook,repCurrentChapter/.test(tree),'E6 rep-tree.js: صف پر جملہ + باب کی فائل منگوانا');
ok(!/ensureRepRubricsUr/.test(rd('js/repertory/LOAD_ORDER.txt')),'E7 LOAD_ORDER.txt نہیں چھیڑا');

// ---------- F. کینٹ کتابی ترتیب (v130) ----------
const gmR=L.chapterRows(w,'kent','genitalia_male'); const gi=f=>gmR.findIndex(r=>r.full===f);
ok(gmR.length===1089,'F1 GENITALIA MALE مکمل: 1089 ربرک (v143: 29 twin لنگر چھپے — ادویات محفوظ) ('+gmR.length+')');
const erSub=gmR.filter(r=>r.depth>=1&&r.labels[0]==='ERECTIONS, troublesome'); const erD1=erSub.filter(r=>r.depth===1).map(r=>r.label);
const erT=['daytime','morning','forenoon','noon, after a nap','afternoon','evening','night'].map(t=>erD1.indexOf(t));
ok(erD1[0]==='daytime'&&erT.every((v,i)=>v>=0&&(i===0||v>erT[i-1])),'F1 ERECTIONS, troublesome کی ذیلی ترتیب کتاب کے مطابق — وقت پہلے (daytime → morning → forenoon → noon, after a nap → afternoon → evening → night) پھر باقی حروفِ تہجی میں (کتاب صفحہ 1531/PDF1565)');
ok(erSub.some(r=>r.depth===2&&r.label==='waking, on'&&r.labels[1]==='morning'),'F1b «waking, on» صبح کے نیچے دوسرے درجے پر — کتاب کے جوں کا توں');
ok(gi('ERECTIONS, lying')<gi('ERECTIONS, painful')&&gi('ERECTIONS, painful')<gi('ERECTIONS, seldom')&&gi('ERECTIONS, seldom')<gi('ERECTIONS, violent')&&gi('ERECTIONS, violent')<gi('ERECTIONS, wanting (impotency)'),'F2 ERECTIONS کی ذیلی ربرکیں بھی کتابی ترتیب میں (lying → painful → seldom → violent → wanting)');
const rcR=L.chapterRows(w,'kent','rectum'); const ri=f=>rcR.findIndex(r=>r.full===f);
ok(ri('APHTHOUS condition of anus')<ri('BALL in rectum, sensation of (See Lump)')&&ri('BALL in rectum, sensation of (See Lump)')<ri('BLACK')&&ri('BLACK')<ri('BOILS in anus')&&ri('BOILS in anus')<ri('CANCER')&&ri('CANCER')<ri('CATARRH of the rectum (See Mucus, Moisture)')&&ri('CHILLINESS in rectum before stool')<ri('CHOLERA')&&ri('CHOLERA')<ri('COLDNESS in anus'),'F3 rectum کا آغازکتابی ترتیب میں (کتاب صفحہ 1308 سے ملایا گیا)');
const ci=f=>gmR.findIndex(r=>r.full===f);
ok(ci('COLDNESS, morning')<ci('COLDNESS, evening')&&ci('COLDNESS, evening')<ci('COLDNESS, urination, during')&&ci('COLDNESS, urination, during')<ci('COLDNESS, penis')&&ci('COLDNESS, penis')<ci('COLDNESS, scrotum')&&ci('COLDNESS, scrotum')<ci('COLDNESS, testes'),'F4 COLDNESS: وقت → شرط → محل (کتاب صفحہ 1495)');
const rch=rd('js/repertory/rep-chapters.js');
ok(/_repSortTreeKentOrder/.test(rch)&&/repCurrentBook === 'kent'/.test(rch),'F5 ترتیب کا فنکشن موجود اور صرف کینٹ پر لاگو');
ok(/js\/repertory\/rep-chapters\.js\?v=176/.test(idx)&&/kent-tree-fix\.js\?v=17\d/.test(idx),'F6 index.html میں rep-chapters.js + kent-tree-fix.js کا نیا ورژن (v176: گلا باب)');
ok(/CACHE_NAME='bhc-clinic-v(13\d|14\d|15\d|16\d|17\d)'/.test(sw),'F7 CACHE_NAME v13x/v14x/v15x/v16x');

// ---------- F8. GENITALIA FEMALE (v132) ----------
const gfR=L.chapterRows(w,'kent','genitalia_female'); const fi=f=>gfR.findIndex(r=>r.full===f);
ok(gfR.length===1458&&gfR.filter(r=>r.depth===0).length===105,'F8 GENITALIA FEMALE مکمل: 1458 ربرک (v143: 13 twin چھپے)، 105 مین ربرک');
ok(fi('MENSES, daytime only')<fi('MENSES, morning')&&fi('PAIN, pressing')<fi('PAIN, sharp')&&fi('PHYSOMETRA (See Flatus)')<fi('PLACENTA retained')&&fi('PLACENTA retained')<fi('POLYPUS'),'F9 FEMALE کی کتابی ترتیب (MENSES → PAIN → PHYSOMETRA → PLACENTA → POLYPUS)');
const GF=JSON.parse(rd('ur/rubrics/kent/genitalia_female.json'));
ok(GF.rubrics['swollen']==='تناسلی اعضاء (عورت) — سوجن'&&GF.rubrics['numbness']==='تناسلی اعضاء (عورت) — سن ہونا'&&GF.rubrics['fullness']==='تناسلی اعضاء (عورت) — بھراؤ (بھرا بھرا لگنا)'&&GF.rubrics['nodules']==='تناسلی اعضاء (عورت) — گلٹیاں'&&GF.rubrics['gangrene']==='تناسلی اعضاء (عورت) — گلنا (گینگرین)','F10 FEMALE کی اصطلاحات پچھلے ابواب سے موازنہ شدہ (سوجن · سن ہونا · بھراؤ · گلٹیاں · گلنا (گینگرین))');
ok(GF.rubrics['pain, sore, walking agg.']==='تناسلی اعضاء (عورت) — درد، دکھتا، کچلا ہوا، چلنے سے بگاڑ'&&!gfR.some(r=>/سے بڑھے|بڑھیں/.test(GF.rubrics[r.key]||'')),'F11 «سے بگاڑ» والا اسلوب پچھلے 23 ابواب کے مطابق («سے بڑھے» نہیں)');

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
ok(rootCount===4623,'G7 37 ابواب کی مین ربرک (v176: گلا باب ماخذی درخت — THROAT ماخذی درخت، کل 4623)')

// ---------- H. LARYNX+RESPIRATION+EXPECTORATION+COUGH (v133) ----------
const larR=L.chapterRows(w,'kent','larynx_and_trachea'); const li=f=>larR.findIndex(r=>r.full===f);
ok(larR.length===701&&larR.filter(r=>r.depth===0).length===78,'H1 LARYNX AND TRACHEA مکمل: 701 ربرک (v143: 37 twin چھپے)، 78 مین ربرک');
ok(li('CLOSED, nearly')<li('COATED, seems (See Velvety)')&&li('COATED, seems (See Velvety)')<li('COLD, sensation on breathing')&&li('COLD, sensation on breathing')<li('CONDYLOMATA, larynx')&&larR[0].full==='ANAESTHESIA','H2 LARYNX کی کتابی ترتیب (ANAESTHESIA پہلا؛ CLOSED, nearly → COATED → COLD, sensation on breathing → CONDYLOMATA, larynx — کتابی عنوانات)');
const rsR=L.chapterRows(w,'kent','respiration'); const ri2=f=>rsR.findIndex(r=>r.full===f);
ok(rsR.length===758&&rsR.filter(r=>r.depth===0).length===50&&rsR[0].full==='ABDOMINAL','H3 RESPIRATION مکمل: 758 ربرک (v143)، 50 مین ربرک، ABDOMINAL پہلا');
ok(ri2('WHEEZING')<ri2('WHISTLING')&&ri2('SUPERFICIAL')<ri2('TREMULOUS')&&ri2('TREMULOUS')<ri2('VEHEMENT, expiration'),'H4 RESPIRATION کی ذیلی ترتیب (SUPERFICIAL → TREMULOUS → VEHEMENT, expiration → WHEEZING → WHISTLING) — کتاب کے مین عنوانات');
const exR=L.chapterRows(w,'kent','expectoration'); const ei=f=>exR.findIndex(r=>r.full===f);
ok(exR.length===348&&exR.filter(r=>r.depth===0).length===116&&exR[0].full==='MORNING','H5 EXPECTORATION مکمل: 348 ربرک (v143)، 116 مین ربرک، «وقت پہلے» (MORNING → … → NIGHT پھر حروفِ تہجی)');
ok(ei('MORNING')<ei('FORENOON')&&ei('FORENOON')<ei('NIGHT')&&ei('NIGHT')<ei('ACRID')&&ei('ASH-COLORED spots')<ei('BALL, feels like a round, and rushes into mouth'),'H6 EXPECTORATION کی کتابی ترتیب (وقت → ACRID → ASH-COLORED spots → BALL, feels like a round…)');
const coR=L.chapterRows(w,'kent','cough'); const coi=f=>coR.findIndex(r=>r.full===f);
ok(coR.length===1542&&coR.filter(r=>r.depth===0).length===375&&coR[0].full==='DAYTIME','H7 COUGH مکمل: 1,542 ربرک (v143)، 375 مین ربرک، DAYTIME پہلا');
ok(coi('DAYTIME')<coi('NIGHT')&&coi('NIGHT')<coi('ACIDS agg.')&&coi('ACIDS agg.')<coi('ACRID fluid through posterior nares, sensation of, from'),'H8 COUGH کی کتابی ترتیب (DAYTIME → MORNING → … → NIGHT → ACIDS agg. → ACRID fluid… — وقت پھر حروفِ تہجی)');
const LJ=JSON.parse(rd('ur/rubrics/kent/larynx_and_trachea.json')), RJ=JSON.parse(rd('ur/rubrics/kent/respiration.json')), EJ=JSON.parse(rd('ur/rubrics/kent/expectoration.json')), CJ=JSON.parse(rd('ur/rubrics/kent/cough.json'));
ok(LJ.rubrics['crumb']==='حلقوم — چورا (روٹی کا ذرہ)'&&LJ.rubrics['velvety sensation (downy)']==='حلقوم — مخملی پن کا احساس (روئیں دار)'&&RJ.rubrics['wheezing']==='سانس — گھرگھر کی آواز'&&EJ.rubrics['rusty']==='بلغم — زنگ آلود'&&EJ.rubrics['frothy']==='بلغم — جھاگ دار'&&CJ.rubrics['barking']==='کھانسی — بھونکنے والی'&&CJ.rubrics['whooping']==='کھانسی — کالی کھانسی','H9 چاروں ابواب کی اصطلاحات پچھلے ابواب سے موازنہ شدہ (چورا · مخملی پن · گھرگھر · زنگ آلود · جھاگ دار · بھونکنے والی · کالی کھانسی)');
[['حلقوم',LJ],['سانس',RJ],['بلغم',EJ],['کھانسی',CJ]].forEach(function(pr){ const root=pr[0], J=pr[1]; const ks=Object.keys(J.rubrics);
  const noRoot=ks.filter(k=>J.rubrics[k].indexOf(root+' — ')===0?false:true).length;
  const latin=ks.filter(k=>/[A-Za-z]/.test(J.rubrics[k])).length;
  const style=ks.filter(k=>/سے بڑھے|بڑھیں/.test(J.rubrics[k])).length;
  ok(noRoot===0&&latin===0&&style===0,'H10 '+root+': ہر جملے میں جڑ «'+root+' — » · کوئی انگریزی حرف نہیں · اسلوب «سے بگاڑ» (کوئی «سے بڑھے» نہیں) — '+ks.length+' جملے');
});
ok(/js\/18-rubrics-ur\.js\?v=168/.test(idx)&&/var REP_RUBUR_V = '168';/.test(rd('js/18-rubrics-ur.js'))&&/CACHE_NAME='bhc-clinic-v176'/.test(sw)&&/rubric-ur\.css\?v=103/.test(idx)&&/js\/repertory\/rep-books\.js\?v=81/.test(idx)&&/REP_DATA_V='v=19'/.test(rd('js/repertory/rep-books.js'))&&/repertory-tabs\.css\?v=176/.test(idx)&&/library-tab\.css\?v=158/.test(idx)&&/rep-tabs\.js\?v=176/.test(idx)&&/repertory-editor\.css\?v=166/.test(idx)&&/rep-editor\.js\?v=166/.test(idx)&&/rep-chapters\.js\?v=176/.test(idx)&&/rep-tree\.js\?v=149/.test(idx)&&/rep-search\.js\?v=153/.test(idx)&&/rep-rubric-detail\.js\?v=105/.test(idx)&&/\.\/css\/library-tab\.css/.test(sw)&&/\.\/css\/repertory-editor\.css/.test(sw)&&/\.\/js\/repertory\/rep-editor\.js/.test(sw),'L-H11 بیرونی خول و اندازنامے (ٹیبز v176، لائبریری v158) · ترجمہ ڈیٹا v168 · سروس ورکر v176');
ok(sw.indexOf("'./ur/rubrics/kent/larynx_and_trachea.json'")>=0&&sw.indexOf("'./ur/rubrics/kent/respiration.json'")>=0&&sw.indexOf("'./ur/rubrics/kent/expectoration.json'")>=0&&sw.indexOf("'./ur/rubrics/kent/cough.json'")>=0&&sw.indexOf("'./ur/rubrics/kent/chest.json'")>=0&&sw.indexOf("'./ur/rubrics/kent/back.json'")>=0&&sw.indexOf("'./ur/rubrics/kent/extremities.json'")>=0&&sw.indexOf("'./ur/rubrics/kent/sleep.json'")>=0&&sw.indexOf("'./ur/rubrics/kent/chill.json'")>=0&&sw.indexOf("'./ur/rubrics/kent/fever.json'")>=0&&sw.indexOf("'./ur/rubrics/kent/perspiration.json'")>=0,'H12 service-worker میں نئی json (larynx/respiration/expectoration/cough/chest/back/extremities/sleep/chill/fever/perspiration)');

// ---------- I. CHEST (v134) ----------
const chR=L.chapterRows(w,'kent','chest'); const chi=f=>chR.findIndex(r=>r.full===f);
const chMain=chR.filter(r=>r.depth===0).map(r=>r.full);
ok(chR.length===3392&&chMain.length===173&&chMain[0]==='ABSCESS'&&chMain[chMain.length-1]==='WINE, agg.','I1 CHEST مکمل: 3,392 ربرک (v143)، 173 مین ربرک (ABSCESS پہلا، WINE, agg. آخری — کتابی عنوان)');
ok(chi('ABSCESS')<chi('ADHESION, sensation of')&&chi('ADHESION, sensation of')<chi('AFFECTIONS of the cartilages')&&chi('AFFECTIONS of the cartilages')<chi('AIR, sensitive to'),'I2 CHEST کے مین ربرک حروفِ تہجی میں (ABSCESS → ADHESION, sensation of → AFFECTIONS of the cartilages → AIR, sensitive to)');
ok(chi('PAIN, burning')<chi('PAIN, bursting')&&chi('PAIN, bursting')<chi('PAIN, clawing')&&chi('PAIN, clawing')<chi('PAIN, crampy')&&chi('PAIN, crampy')<chi('PAIN, cutting (sudden sharp pain)')&&chi('PAIN, cutting (sudden sharp pain)')<chi('PAIN, digging')&&chi('PAIN, digging')<chi('PAIN, drawing')&&chi('PAIN, drawing')<chi('PAIN, gnawing')&&chi('PAIN, gnawing')<chi('PAIN, griping'),'I3 PAIN کی ذیلی ربرکیں کتابی ترتیب میں (burning → bursting → clawing → crampy → cutting → digging → drawing → gnawing → griping)');
ok(chi('PAIN, stitching, sides, right')>chi('PAIN, stitching, sides')&&chi('PALPITATION heart')<chi('PARALYSIS, diaphragm')&&chi('PARALYSIS, diaphragm')<chi('PERSPIRATION')&&chi('PERSPIRATION')<chi('PETECHIAE')&&chi('PETECHIAE')<chi('PHTHISIS pulmonalis')&&chi('PHTHISIS pulmonalis')<chi('PLUG, sensation of')&&chi('PLUG, sensation of')<chi('PULSATION')&&chi('PULSATION')<chi('PURRING, feeling in region of heart'),'I4 CHEST کی ترتیب (PALPITATION → PARALYSIS, diaphragm → PERSPIRATION → PETECHIAE → PHTHISIS → PLUG, sensation of → PULSATION → PURRING…) اور ذیلی درجہ بندی محفوظ');
const CH=JSON.parse(rd('ur/rubrics/kent/chest.json')); const chKs=Object.keys(CH.rubrics);
ok(chKs.length===3433&&CH.rubrics['abscess']==='سینہ — پھوڑا'&&CH.rubrics['palpitation heart']==='سینہ — دل کی دھڑکن'&&CH.rubrics['pulsation']==='سینہ — دھڑکن'&&CH.rubrics['purring']==='سینہ — بلی جیسی گھرگھراہٹ'&&CH.rubrics['rattling in']==='سینہ — کھڑکھڑاہٹ'&&CH.rubrics['paralysis']==='سینہ — فالج'&&CH.rubrics['phthisis pulmonalis']==='سینہ — پھیپھڑوں کی ٹی بی (دق)'&&CH.rubrics['oppression']==='سینہ — دباؤ','I5 CHEST کی اصطلاحات پچھلے ابواب سے موازنہ شدہ (پھوڑا · دل کی دھڑکن · دھڑکن · بلی جیسی گھرگھراہٹ · کھڑکڑاہٹ · فالج · دق · دباؤ)');
ok(chKs.every(k=>CH.rubrics[k].indexOf('سینہ — ')===0)&&chKs.filter(k=>/[A-Za-z]/.test(CH.rubrics[k])).length===0&&chKs.filter(k=>/سے بڑھے|بڑھیں/.test(CH.rubrics[k])).length===0&&!/دیکھیں/.test(rd('ur/rubrics/kent/chest.json'))&&chKs.filter(k=>/[\u06F0-\u06F9\u0660-\u0669]/.test(CH.rubrics[k])).length===0,'I6 CHEST: ہر جملے میں جڑ «سینہ — » · کوئی انگریزی حرف نہیں · اسلوب «سے بگاڑ» · کوئی «(… دیکھیں)» نہیں · ہندسے 1 2 3 — 3,433 جملے');

// ---------- J. BACK (v135) ----------
const bkR=L.chapterRows(w,'kent','back'); const bki=f=>bkR.findIndex(r=>r.full===f);
const bkMain=bkR.filter(r=>r.depth===0).map(r=>r.full);
ok(bkR.length===3865&&bkMain.length===87&&bkMain[0]==='ABSCESS'&&bkMain[bkMain.length-1]==='WIND, as if blowing between shoulders','J1 BACK مکمل: 3,865 ربرک (v143)، 87 مین ربرک (ABSCESS پہلا، WIND, as if blowing between shoulders آخری — کتابی عنوان)');
ok(bki('BOILS (See Eruptions)')<bki('BROWN')&&bki('BROWN')<bki('BROWN spots on')&&bki('BROWN spots on')<bki('BRUISES on spine (See Injuries)')&&bki('BRUISES on spine (See Injuries)')<bki('BUBBLING sensation in'),'J2 BACK کے مین ربرک حروفِ تہجی میں (BOILS → BROWN → BROWN spots on → BRUISES → BUBBLING)');
ok(bki('PAIN, aching')<bki('PAIN, boring')&&bki('PAIN, boring')<bki('PAIN, burning')&&bki('PAIN, burning')<bki('PAIN, clawing')&&bki('PAIN, clawing')<bki('PAIN, constricting')&&bki('PAIN, drawing')<bki('PAIN, pressing')&&bki('PAIN, pressing')<bki('PAIN, sore')&&bki('PAIN, sore')<bki('PAIN, stitching')&&bki('PAIN, stitching')<bki('PAIN, tearing'),'J3 PAIN کی ذیلی ربرکیں کتابی ترتیب میں (aching → boring → burning → clawing → constricting … drawing → pressing → sore → stitching → tearing)');
ok(bki('STIFFNESS')<bki('STRAINING, easy')&&bki('STRAINING, easy')<bki('SWELLING')&&bki('SWELLING')<bki('TENSION')&&bki('TENSION')<bki('TINGLING (See Formication)')&&bki('TUMORS, pediculated bluish as large as a cherry')<bki('TWITCHING')&&bki('TWITCHING')<bki('ULCERS')&&bki('ULCERS')<bki('WEAKNESS')&&bki('WEAKNESS')<bki('WIND, as if blowing between shoulders'),'J4 BACK کی ترتیب (STIFFNESS → STRAINING, easy → SWELLING → TENSION → TINGLING … TUMORS, pediculated… → TWITCHING → ULCERS → WEAKNESS → WIND…)');
const BK=JSON.parse(rd('ur/rubrics/kent/back.json')); const bkKs=Object.keys(BK.rubrics);
ok(bkKs.length===3888&&BK.rubrics['abscess']==='پیٹھ — پھوڑا'&&BK.rubrics['numbness']==='پیٹھ — سن ہونا'&&BK.rubrics['stiffness']==='پیٹھ — سختی'&&BK.rubrics['tension']==='پیٹھ — تناؤ'&&BK.rubrics['twitching']==='پیٹھ — پھڑکن'&&BK.rubrics['warts']==='پیٹھ — مسے'&&BK.rubrics['wind']==='پیٹھ — ہوا'&&BK.rubrics['ulcers']==='پیٹھ — ناسور (زخم)'&&BK.rubrics['formication']==='پیٹھ — چیونٹیاں رینگنے کا احساس'&&BK.rubrics['erysipelas']==='پیٹھ — سرخ بادہ (ایریسیپلس)','J5 BACK کی اصطلاحات پچھلے ابواب سے موازنہ شدہ (پھوڑا · سن ہونا · سختی · تناؤ · پھڑکن · مسے · ہوا · ناسور · چیونٹیاں · سرخ بادہ)');
ok(bkKs.every(k=>BK.rubrics[k].indexOf('پیٹھ — ')===0)&&bkKs.filter(k=>/[A-Za-z]/.test(BK.rubrics[k])).length===0&&bkKs.filter(k=>/سے بڑھے|بڑھیں/.test(BK.rubrics[k])).length===0&&!/دیکھیں/.test(rd('ur/rubrics/kent/back.json'))&&bkKs.filter(k=>/[\u06F0-\u06F9\u0660-\u0669]/.test(BK.rubrics[k])).length===0,'J6 BACK: ہر جملے میں جڑ «پیٹھ — » · کوئی انگریزی حرف نہیں · اسلوب «سے بگاڑ» · کوئی «(… دیکھیں)» نہیں · ہندسے 1 2 3 — 3,888 جملے');
ok(bkKs.filter(k=>{const s=BK.rubrics[k].split('، '); return s.some((x,i)=>i&&x===s[i-1]);}).length===0,'J7 BACK: کوئی لفظ والد کے بعد دہرایا نہیں گیا (جوڑ کا ڈھانچہ صاف)');


// ---------- K. EXTREMITIES (v136) ----------
const xmR=L.chapterRows(w,'kent','extremities'); const xmi=f=>xmR.findIndex(r=>r.full===f);
const xmMain=xmR.filter(r=>r.depth===0).map(r=>r.full);
ok(xmR.length===15956&&xmMain.length===284&&xmMain[0]==='ABDUCTED, lies with limbs'&&xmMain[xmMain.length-1]==='WRINKLED','K1 EXTREMITIES مکمل: 15,956 ربرک (v143)، 284 مین ربرک (ABDUCTED, lies with limbs پہلا، WRINKLED آخری — کتابی عنوان)');
ok(xmi('ABDUCTED, lies with limbs')<xmi('ABSCESS, joints')&&xmi('ABSCESS, joints')<xmi('AIR passing down from shoulder to finger, sensation as if')&&xmi('AIR passing down from shoulder to finger, sensation as if')<xmi('ALIVE, sensation of')&&xmi('ALIVE, sensation of')<xmi('ANÆSTHESIA (See Numbness)')&&xmi('ANÆSTHESIA (See Numbness)')<xmi('ANALGESIA (See Insensibility, Numbness)'),'K2 EXTREMITIES کے مین ربرک حروفِ تہجی میں (ABDUCTED, lies with limbs → ABSCESS, joints → AIR passing down… → ALIVE, sensation of → ANÆSTHESIA → ANALGESIA)');
ok(xmi('PAIN, aching')<xmi('PAIN, boring')&&xmi('PAIN, boring')<xmi('PAIN, burning')&&xmi('PAIN, burning')<xmi('PAIN, cutting')&&xmi('PAIN, cutting')<xmi('PAIN, drawing')&&xmi('PAIN, drawing')<xmi('PAIN, gnawing')&&xmi('PAIN, gnawing')<xmi('PAIN, pressing')&&xmi('PAIN, pressing')<xmi('PAIN, stitching')&&xmi('PAIN, stitching')<xmi('PAIN, tearing'),'K3 PAIN کی ذیلی ربرکیں کتابی ترتیب میں (aching → boring → burning → cutting → drawing → gnawing → pressing → stitching → tearing؛ وقت پہلے)');
ok(xmi('FORMICATION')<xmi('GOOSE-FLESH (See Skin)')&&xmi('ULCERS')<xmi('WARTS')&&xmi('WARTS')<xmi('WEAKNESS')&&xmi('WEAKNESS')<xmi('WHIRLING')&&xmi('WHIRLING')<xmi('WIND, upper limbs, cold wind blowing on it, as if')&&xmi('WIND, upper limbs, cold wind blowing on it, as if')<xmi('WITHERED')&&xmi('WITHERED')<xmi('WOODEN sensation, hand')&&xmi('WOODEN sensation, hand')<xmi('WRINKLED'),'K4 EXTREMITIES کی ترتیب (FORMICATION → GOOSE-FLESH … ULCERS → WARTS → WEAKNESS → WHIRLING → WIND, upper limbs… → WITHERED → WOODEN sensation, hand → WRINKLED)');
const EXJ=JSON.parse(rd('ur/rubrics/kent/extremities.json')); const exKs=Object.keys(EXJ.rubrics);
ok(exKs.length===16056&&EXJ.rubrics['abscess']==='اعضا — پھوڑا'&&EXJ.rubrics['numbness']==='اعضا — سن ہونا'&&EXJ.rubrics['cramps']==='اعضا — اینٹھن'&&EXJ.rubrics['tingling']==='اعضا — جھنجھناہٹ (سنسناہٹ)'&&EXJ.rubrics['warts']==='اعضا — مسے'&&EXJ.rubrics['tension']==='اعضا — تناؤ'&&EXJ.rubrics['twitching']==='اعضا — پھڑکن'&&EXJ.rubrics['coldness']==='اعضا — ٹھنڈک'&&EXJ.rubrics['ulcers']==='اعضا — ناسور (زخم)'&&EXJ.rubrics['formication']==='اعضا — چیونٹیاں رینگنے کا احساس'&&EXJ.rubrics['erysipelas']==='اعضا — سرخ بادہ (ایریسیپلس)','K5 EXTREMITIES کی اصطلاحات پچھلے ابواب سے موازنہ شدہ (پھوڑا · سن ہونا · اینٹھن · جھنجھناہٹ · مسے · تناؤ · پھڑکن · ٹھنڈک · ناسور · چیونٹیاں · سرخ بادہ)');
ok(exKs.every(k=>EXJ.rubrics[k].indexOf('اعضا — ')===0)&&exKs.filter(k=>/[A-Za-z]/.test(EXJ.rubrics[k])).length===0&&exKs.filter(k=>/سے بڑھے|بڑھیں/.test(EXJ.rubrics[k])).length===0&&!/دیکھیں/.test(rd('ur/rubrics/kent/extremities.json'))&&exKs.filter(k=>/[\u06F0-\u06F9\u0660-\u0669]/.test(EXJ.rubrics[k])).length===0,'K6 EXTREMITIES: ہر جملے میں جڑ «اعضا — » · کوئی انگریزی حرف نہیں · اسلوب «سے بگاڑ» · کوئی «(… دیکھیں)» نہیں · ہندسے 1 2 3 — 16,056 جملے');
ok(exKs.filter(k=>{const s=EXJ.rubrics[k].split('، '); return s.some((x,i)=>i&&x===s[i-1]);}).length===0,'K7 EXTREMITIES: کوئی لفظ والد کے بعد دہرایا نہیں گیا (جوڑ کا ڈھانچہ صاف)');

// ---------- L. SLEEP (v137) ----------
const slR=L.chapterRows(w,'kent','sleep'); const sli=f=>slR.findIndex(r=>r.full===f);
const slMain=slR.filter(r=>r.depth===0).map(r=>r.full);
ok(slR.length===1059&&slMain.length===39&&slMain[0]==='ANXIOUS (See Mind, dreams)'&&slMain[slMain.length-1]==='YAWNING','L1 SLEEP مکمل: 1,059 ربرک (v143)، 39 مین ربرک — کتاب کے مطابق DREAMS, absurd اب مین ہے (ANXIOUS پہلا، YAWNING آخری)');
ok(sli('ANXIOUS (See Mind, dreams)')<sli('BAD')&&sli('BAD')<sli('CHILL, during')&&sli('CHILL, during')<sli('COMATOSE')&&sli('COMATOSE')<sli('CONVULSIONS, during')&&sli('CONVULSIONS, during')<sli('DEEP')&&sli('DEEP')<sli('DISTURBED')&&sli('DISTURBED')<sli('DOZING')&&sli('DOZING')<sli('DREAMS, absurd'),'L2 SLEEP کے مین ربرک حروفِ تہجی میں (ANXIOUS → BAD → CHILL, during → COMATOSE → CONVULSIONS, during → DEEP → DISTURBED → DOZING → DREAMS, absurd)');
ok(sli('SLEEPINESS, morning')<sli('SLEEPINESS, forenoon')&&sli('SLEEPINESS, forenoon')<sli('SLEEPINESS, noon')&&sli('SLEEPINESS, noon')<sli('SLEEPINESS, afternoon')&&sli('SLEEPINESS, afternoon')<sli('SLEEPINESS, evening')&&sli('SLEEPINESS, afternoon, 1 p.m. to 2 p.m.')<sli('SLEEPINESS, afternoon, 2 p.m.')&&sli('SLEEPINESS, afternoon, 4 p.m. to 6 p.m.')<sli('SLEEPINESS, afternoon, 5 p.m.'),'L3 SLEEPINESS کے اوقات کتابی ترتیب میں (morning → forenoon → noon → afternoon → evening؛ گھنٹے بھی ترتیب میں)');
ok(sli('POSITION, abdomen, on')<sli('PROFOUND (See Deep)')&&sli('PROFOUND (See Deep)')<sli('PROLONGED')&&sli('PROLONGED')<sli('RESTLESS')&&sli('RESTLESS')<sli('SEMI-CONSCIOUS')&&sli('SEMI-CONSCIOUS')<sli('SHORT')&&sli('SHORT')<sli('SLEEPINESS')&&sli('SLEEPINESS')<sli('SLEEPLESSNESS')&&sli('SLEEPLESSNESS')<sli('SNORING (See Respiration)')&&sli('SNORING (See Respiration)')<sli('UNREFRESHING')&&sli('UNREFRESHING')<sli('WAKING, 2 a.m. to 3 a.m.')&&sli('WAKING, 2 a.m. to 3 a.m.')<sli('YAWNING'),'L4 SLEEP کی ترتیب (POSITION, abdomen, on → PROFOUND → PROLONGED → RESTLESS → SEMI-CONSCIOUS → SHORT → SLEEPINESS → SLEEPLESSNESS → SNORING → UNREFRESHING → WAKING, 2 a.m. to 3 a.m. → YAWNING)');
const SLJ=JSON.parse(rd('ur/rubrics/kent/sleep.json')); const slKs=Object.keys(SLJ.rubrics);
ok(slKs.length===1066&&SLJ.rubrics['sleeplessness']==='نیند — بے خوابی'&&SLJ.rubrics['sleepiness']==='نیند — غنودگی'&&SLJ.rubrics['dreams']==='نیند — خواب'&&SLJ.rubrics['yawning']==='نیند — جمائی لینا'&&SLJ.rubrics['comatose']==='نیند — بے ہوشی'&&SLJ.rubrics['convulsions']==='نیند — تشنج'&&SLJ.rubrics['snoring']==='نیند — خراٹے'&&SLJ.rubrics['dozing']==='نیند — اونگھ'&&SLJ.rubrics['waking']==='نیند — جاگنا','L5 SLEEP کی اصطلاحات پچھلے 31 ابواب سے موازنہ شدہ (بے خوابی · غنودگی · خواب · جمائی لینا · بے ہوشی · تشنج · خراٹے · اونگھ · جاگنا)');
ok(slKs.every(k=>SLJ.rubrics[k].indexOf('نیند — ')===0)&&slKs.filter(k=>/[A-Za-z]/.test(SLJ.rubrics[k])).length===0&&!/دیکھیں/.test(rd('ur/rubrics/kent/sleep.json'))&&slKs.filter(k=>/[\u06F0-\u06F9\u0660-\u0669]/.test(SLJ.rubrics[k])).length===0&&slKs.filter(k=>/agg\./.test(SLJ.rubrics[k])).length===0,'L6 SLEEP: ہر جملے میں جڑ «نیند — » · کوئی انگریزی حرف نہیں · کوئی «(… دیکھیں)» نہیں · ہندسے 1 2 3 · «agg.» لفظ باقی نہیں — 1,066 جملے');
ok(slKs.filter(k=>{const t=SLJ.rubrics[k].split('، '); return t.some((x,i)=>i&&x===t[i-1]);}).length===0,'L7 SLEEP: کوئی ٹکڑا والد کے بعد دہرایا نہیں گیا (جوڑ کا ڈھانچہ صاف)');
ok(SLJ.rubrics['dreams, anxious, menses, before']==='نیند — خواب، بے چین کرنے والے، حیض سے پہلے'&&SLJ.rubrics['sleeplessness, night, after 11 p.m., until 1 a.m.']==='نیند — بے خوابی، رات 11 بجے کے بعد، صبح 1 بجے تک'&&SLJ.rubrics['position, side, right, impossible']==='نیند — لیٹنے کا انداز، دائیں کروٹ لیٹنا ممکن نہیں','L8 SLEEP کے گہرے رستے درست جڑے (خواب › حیض سے پہلے · بے خوابی › رات 11 بجے کے بعد › صبح 1 بجے تک · دائیں کروٹ ممکن نہیں)');

// ---------- M. CHILL (v138) ----------
const clR=L.chapterRows(w,'kent','chill'); const cli=f=>clR.findIndex(r=>r.full===f);
const clMain=clR.filter(r=>r.depth===0).map(r=>r.full);
ok(clR.length===759&&clMain.length===121&&clMain[0]==='COLDNESS in general'&&clMain[clMain.length-1]==='WRITING, while','M1 CHILL مکمل: 759 ربرک (v143)، 121 مین ربرک (COLDNESS in general پہلا، WRITING, while آخری — کتابی عنوان)');
ok(clMain[1]==='DAYTIME'&&clMain[2]==='MORNING'&&clMain[3]==='FORENOON'&&clMain[4]==='NOON'&&clMain[5]==='AFTERNOON'&&clMain[6]==='EVENING'&&clMain[7]==='NIGHT'&&clMain[8]==='MIDNIGHT','M2 CHILL: وقت کے عنوانات کتابی ترتیب میں سب سے پہلے (DAYTIME → MORNING → FORENOON → NOON → AFTERNOON → EVENING → NIGHT → MIDNIGHT)');
ok(cli('AFFECTED parts')<cli('AIR, in the open')&&cli('AIR, in the open')<cli('ALCOHOL, abuse of')&&cli('ALCOHOL, abuse of')<cli('ALTERNATING')&&cli('ALTERNATING')<cli('ANGER, after')&&cli('ANGER, after')<cli('ANTICIPATING')&&cli('ANTICIPATING')<cli('ANXIETY, caused by')&&cli('ANXIETY, caused by')<cli('ARSENIC, abuse of'),'M3 CHILL کے مین ربرک حروفِ تہجی میں (AFFECTED parts → AIR, in the open → ALCOHOL, abuse of → ALTERNATING → ANGER, after → ANTICIPATING → ANXIETY, caused by → ARSENIC, abuse of)');
ok(cli('LONG LASTING (See Shaking)')<cli('LYING')&&cli('LYING')<cli('MENSES, before')&&cli('MENSES, before')<cli('MENTAL exertion, after')&&cli('MENTAL exertion, after')<cli('MOTION')&&cli('MOTION')<cli('PAIN, with')&&cli('PAIN, with')<cli('PERIODICITY')&&cli('PERIODICITY')<cli('PERNICIOUS')&&cli('PERNICIOUS')<cli('PERSPIRATION, with')&&cli('PERSPIRATION, with')<cli('POSTPONING')&&cli('POSTPONING')<cli('QUARTAN')&&cli('QUARTAN')<cli('SHAKING, shivering, rigors'),'M4 CHILL کی ترتیب (LONG LASTING → LYING → MENSES, before → MENTAL exertion, after → MOTION → PAIN, with → PERIODICITY → PERNICIOUS → PERSPIRATION, with → POSTPONING → QUARTAN → SHAKING, shivering, rigors)');
const CLJ=JSON.parse(rd('ur/rubrics/kent/chill.json')); const clKs=Object.keys(CLJ.rubrics);
ok(clKs.length===800&&clKs.filter(k=>k==='time'||k.indexOf('time, ')===0).length===86&&CLJ.rubrics['time, 3 a.m.']==='سردی لگنا — وقت، صبح 3 بجے'&&CLJ.rubrics['time, 12 p.m.']==='سردی لگنا — وقت، دوپہر 12 بجے'&&CLJ.rubrics['time, 9 p.m.']==='سردی لگنا — وقت، رات 9 بجے'&&CLJ.rubrics['time, 2 p.m., to, 4 p.m.']==='سردی لگنا — وقت، سہ پہر 2 سے 4 بجے','M5 CHILL › وقت کے 86 ربرک اور قائم وقت کا اسلوب (صبح 3 بجے · دوپہر 12 بجے · رات 9 بجے · سہ پہر 2 سے 4 بجے)');
ok(CLJ.rubrics['shaking']==='سردی لگنا — کپکپی'&&CLJ.rubrics['chilliness']==='سردی لگنا — ٹھنڈک'&&CLJ.rubrics['alternating']==='سردی لگنا — باری باری'&&CLJ.rubrics['quartan']==='سردی لگنا — چوتھے دن والا'&&CLJ.rubrics['tertian']==='سردی لگنا — تیسرے دن والا'&&CLJ.rubrics['quotidian']==='سردی لگنا — روزانہ'&&CLJ.rubrics['pernicious']==='سردی لگنا — مہلک'&&CLJ.rubrics['anticipating']==='سردی لگنا — وقت سے پہلے آنا'&&CLJ.rubrics['postponing']==='سردی لگنا — وقت پیچھے کھسکنا','M6 CHILL کی اصطلاحات پچھلے 32 ابواب سے موازنہ شدہ (کپکپی · ٹھنڈک · باری باری · چوتھے/تیسرے دن والا · روزانہ · مہلک · وقت سے پہلے آنا · وقت پیچھے کھسکنا)');
ok(clKs.every(k=>CLJ.rubrics[k].indexOf('سردی لگنا — ')===0)&&clKs.filter(k=>/[A-Za-z]/.test(CLJ.rubrics[k])).length===0&&!/دیکھیں/.test(rd('ur/rubrics/kent/chill.json'))&&clKs.filter(k=>/[\u06F0-\u06F9\u0660-\u0669]/.test(CLJ.rubrics[k])).length===0&&clKs.filter(k=>/agg\./.test(CLJ.rubrics[k])).length===0&&clKs.filter(k=>CLJ.rubrics[k].indexOf('سردی لگنا — سردی لگنا')===0).length===0,'M7 CHILL: ہر جملے میں جڑ «سردی لگنا — » ایک بار · کوئی انگریزی حرف نہیں · کوئی «(… دیکھیں)» نہیں · ہندسے 1 2 3 · «agg.» باقی نہیں — 800 جملے');
ok(clKs.filter(k=>{const t=CLJ.rubrics[k].split('، '); return t.some((x,i)=>i&&x===t[i-1]);}).length===0,'M8 CHILL: کوئی ٹکڑا والد کے بعد دہرایا نہیں گیا (جوڑ کا ڈھانچہ صاف)');
ok(CLJ.rubrics['wind, as if it were blowing cold, between the shoulder blades']==='سردی لگنا — ہوا کا جھونکا، جیسے ٹھنڈی چل رہی ہو، کندھوں کے درمیان'&&CLJ.rubrics['water, as if, poured over him']==='سردی لگنا — پانی، جیسے اُس پر ڈالا جا رہا ہو'&&CLJ.rubrics['icy coldness of the body, as if lying on ice']==='سردی لگنا — جسم کی برف جیسی ٹھنڈک، جیسے برف پر لیٹا ہو'&&CLJ.rubrics['trembling and shivering']==='سردی لگنا — لرزنا اور کانپنا','M9 CHILL کے گہرے رستے درست جڑے (ہوا کا جھونکا › کندھوں کے درمیان · پانی › جیسے اُس پر ڈالا جا رہا ہو · برف جیسی ٹھنڈک · لرزنا اور کانپنا)');

// ---------- N. FEVER (v139) ----------
const fvR=L.chapterRows(w,'kent','fever'); const fvi=f=>fvR.findIndex(r=>r.full===f);
const fvMain=fvR.filter(r=>r.depth===0).map(r=>r.full);
ok(fvR.length===578&&fvMain.length===105&&fvMain[0]==='HEAT in general'&&fvMain[fvMain.length-1]==='ZYMOTIC fevers','N1 FEVER مکمل: 578 ربرک (v143)، 105 مین ربرک (HEAT in general پہلا، ZYMOTIC fevers آخری)');
ok(fvMain[1]==='MORNING'&&fvMain[2]==='FORENOON'&&fvMain[3]==='NOON'&&fvMain[4]==='AFTERNOON'&&fvMain[5]==='EVENING'&&fvMain[6]==='NIGHT'&&fvMain[7]==='MIDNIGHT'&&fvMain[8]==='AFFECTED parts','N2 FEVER: وقت کے عنوانات کتابی ترتیب میں سب سے پہلے (MORNING → FORENOON → NOON → AFTERNOON → EVENING → NIGHT → MIDNIGHT → AFFECTED parts)');
ok(fvi('AIR, increased in the open')<fvi('ALTERNATING with')&&fvi('ALTERNATING with')<fvi('ANGER, paroxysms brought on by')&&fvi('ANGER, paroxysms brought on by')<fvi('ANTICIPATING')&&fvi('ANTICIPATING')<fvi('ASCENDING')&&fvi('ASCENDING')<fvi('AUTUMNAL')&&fvi('AUTUMNAL')<fvi('BED')&&fvi('BED')<fvi('BODY, anterior part')&&fvi('BODY, anterior part')<fvi('BURNING heat'),'N3 FEVER کے مین ربرک حروفِ تہجی میں (AIR, increased in the open → ALTERNATING with → ANGER, paroxysms… → ANTICIPATING → ASCENDING → AUTUMNAL → BED → BODY, anterior part → BURNING heat)');
ok(fvi('CHANGING, paroxysms')<fvi('CHILL absent, fever without chill')&&fvi('CHILL absent, fever without chill')<fvi('CHILL, with')&&fvi('CHILL, with')<fvi('CHILLINESS, with')&&fvi('CHILLINESS, with')<fvi('COLDNESS, external with')&&fvi('COLDNESS, external with')<fvi('CONTINUED fever, typhus, typhoid')&&fvi('CONTINUED fever, typhus, typhoid')<fvi('DRY heat')&&fvi('DRY heat')<fvi('EXTERNAL heat')&&fvi('EXTERNAL heat')<fvi('HECTIC fever')&&fvi('HECTIC fever')<fvi('INTERMITTENT, chronic')&&fvi('INTERMITTENT, chronic')<fvi('REMITTENT'),'N4 FEVER کی ترتیب (CHANGING → CHILL absent… → CHILL, with → CHILLINESS, with → COLDNESS, external with → CONTINUED fever… → DRY heat → EXTERNAL heat → HECTIC → INTERMITTENT, chronic → REMITTENT)');
const FVJ=JSON.parse(rd('ur/rubrics/kent/fever.json')); const fvKs=Object.keys(FVJ.rubrics);
ok(fvKs.length===609&&FVJ.rubrics['evening, 6 p.m., to 8 p.m.']==='بخار — شام 6 سے 8 بجے'&&FVJ.rubrics['chill absent, evening, 6 p.m., to 7 p.m.']==='بخار — سردی نہ لگنا، شام 6 سے 7 بجے'&&FVJ.rubrics['morning, bed, in, 5 a.m. followed by shaking chill']==='بخار — صبح 5 بجے، بستر میں، اِس کے بعد کپکپی والی سردی','N5 FEVER کے اوقات قائم قاعدے پر (شام 6 سے 8 بجے · سردی نہ لگنا › شام 6 سے 7 بجے) اور سرِ عنوان دہرایا نہیں گیا');
ok(FVJ.rubrics['hectic fever']==='بخار — دقی (ہیکٹک) بخار'&&FVJ.rubrics['catarrhal fever']==='بخار — نزلے والا بخار'&&FVJ.rubrics['gastric fever']==='بخار — معدے کا بخار'&&FVJ.rubrics['inflammatory fever']==='بخار — سوزش والا بخار'&&FVJ.rubrics['puerperal fever']==='بخار — زچگی کا بخار'&&FVJ.rubrics['continued fever']==='بخار — مسلسل بخار'&&FVJ.rubrics['exanthematic fevers']==='بخار — دانوں والے بخار'&&FVJ.rubrics['zymotic fevers']==='بخار — تعفنی (زائموتک) بخار','N6 FEVER کی قسمیں پچھلے 34 ابواب سے موازنہ شدہ (دقی/ہیکٹک · نزلے والا · معدے کا · سوزش والا · زچگی کا · مسلسل · دانوں والے · تعفنی/زائموتک)');
ok(FVJ.rubrics['intermittent']==='بخار — وقفوں والا'&&FVJ.rubrics['remittent']==='بخار — اتر چڑھنے والا'&&FVJ.rubrics['relapsing']==='بخار — بار بار لوٹنے والا'&&FVJ.rubrics['paroxysms']==='بخار — دورے'&&FVJ.rubrics['shuddering']==='بخار — لرزہ'&&FVJ.rubrics['irregular stages']==='بخار — بے قاعدہ مراحل','N7 FEVER کی اصطلاحات (وقفوں والا · اتر چڑھنے والا · بار بار لوٹنے والا · دورے · لرزہ · بے قاعدہ مراحل — پچھلے ابواب کے «وقفے وقفے سے» «دورہ» «لرزہ» «مرحلہ» سے میل کھاتی ہیں)');
ok(fvKs.every(k=>FVJ.rubrics[k].indexOf('بخار — ')===0)&&fvKs.filter(k=>/[A-Za-z]/.test(FVJ.rubrics[k])).length===0&&!/دیکھیں/.test(rd('ur/rubrics/kent/fever.json'))&&fvKs.filter(k=>/[\u06F0-\u06F9\u0660-\u0669]/.test(FVJ.rubrics[k])).length===0&&fvKs.filter(k=>/agg\./.test(FVJ.rubrics[k])).length===0&&fvKs.filter(k=>FVJ.rubrics[k].indexOf('بخار — بخار')===0).length===0,'N8 FEVER: ہر جملے میں جڑ «بخار — » ایک بار · کوئی انگریزی حرف نہیں · کوئی «(… دیکھیں)» نہیں · ہندسے 1 2 3 · «agg.» باقی نہیں — 609 جملے');
ok(fvKs.filter(k=>{const t=FVJ.rubrics[k].split('، '); return t.some((x,i)=>i&&x===t[i-1]);}).length===0&&FVJ.rubrics['succession of stages, chill, then, sweat, then heat']==='بخار — مراحل کی ترتیب، سردی، اِس کے بعد، پسینہ، پھر گرمی'&&FVJ.rubrics['dry heat, night, menses, before']==='بخار — خشک گرمی، رات، حیض سے پہلے','N9 FEVER: کوئی ٹکڑا دہرایا نہیں گیا اور گہرے رستے درست جڑے (مراحل کی ترتیب › سردی › پسینہ › پھر گرمی · خشک گرمی › رات › حیض سے پہلے)');

// ---------- O. PERSPIRATION (v139) ----------
const peR=L.chapterRows(w,'kent','perspiration'); const pei=f=>peR.findIndex(r=>r.full===f);
const peMain=peR.filter(r=>r.depth===0).map(r=>r.full);
ok(peR.length===378&&peMain.length===98&&peMain[0]==='DAYTIME'&&peMain[peMain.length-1]==='WRITING, while','O1 PERSPIRATION مکمل: 378 ربرک (v143)، 98 مین ربرک (DAYTIME پہلا، WRITING, while آخری — کتابی عنوان)');
ok(peMain[1]==='MORNING'&&peMain[2]==='FORENOON'&&peMain[3]==='NOON'&&peMain[4]==='AFTERNOON'&&peMain[5]==='EVENING'&&peMain[6]==='NIGHT'&&peMain[7]==='MIDNIGHT','O2 PERSPIRATION: وقت کے عنوانات کتابی ترتیب میں سب سے پہلے (MORNING → FORENOON → NOON → AFTERNOON → EVENING → NIGHT → MIDNIGHT)');
ok(pei('ACRID')<pei('AFFECTED parts, on')&&pei('AFFECTED parts, on')<pei('AIR, in the open')&&pei('AIR, in the open')<pei('AIR, in the open agg.')&&pei('AIR, in the open agg.')<pei('ANGER, from')&&pei('ANGER, from')<pei('ANXIETY, during')&&pei('ANXIETY, during')<pei('ASCENDS')&&pei('ASCENDS')<pei('AWAKE only, while'),'O3 PERSPIRATION کے مین ربرک حروفِ تہجی میں (ACRID → AFFECTED parts, on → AIR, in the open → ANGER, from → ANXIETY, during → ASCENDS → AWAKE only, while)');
ok(pei('CLAMMY')<pei('COLD')&&pei('COLD')<pei('COLDNESS, during')&&pei('COLDNESS, during')<pei('COLLIQUATIVE')&&pei('COLLIQUATIVE')<pei('DIARRHOEA')&&pei('DIARRHOEA')<pei('DRINKING, after')&&pei('DRINKING, after')<pei('DYSPNOEA')&&pei('DYSPNOEA')<pei('EATING')&&pei('EATING')<pei('OCCUPATION, during')&&pei('OCCUPATION, during')<pei('ODOR, aromatic')&&pei('ODOR, aromatic')<pei('OILY'),'O4 PERSPIRATION کی ترتیب (CLAMMY → COLD → COLDNESS, during → COLLIQUATIVE → DIARRHOEA → DRINKING, after → DYSPNOEA → EATING → OCCUPATION, during → ODOR, aromatic → OILY)');
const PEJ=JSON.parse(rd('ur/rubrics/kent/perspiration.json')); const peKs=Object.keys(PEJ.rubrics);
ok(peKs.length===427&&PEJ.rubrics['night, 10 p.m., to 10 a.m.']==='پسینہ — رات 10 سے صبح 10 بجے'&&PEJ.rubrics['midnight, after, 2 a.m., to 5 a.m.']==='پسینہ — آدھی رات کے بعد، صبح 2 سے 5 بجے'&&PEJ.rubrics['closing the eyes, on']==='پسینہ — آنکھیں بند کرتے ہی','O5 PERSPIRATION کے اوقات قائم قاعدے پر (رات 10 سے صبح 10 بجے · آدھی رات کے بعد › صبح 2 سے 5 بجے) اور «آنکھیں بند کرنا، آنکھیں بند کرتے ہی» والا دہراؤ نہیں');
ok(PEJ.rubrics['colliquative']==='پسینہ — پگھلانے والا'&&PEJ.rubrics['odor, cadaverous']==='پسینہ — بو، لاش جیسی'&&PEJ.rubrics['staining the linen, yellow']==='پسینہ — کپڑے داغدار کرنا، پیلے'&&PEJ.rubrics['scanty sweat, after a severe chill']==='پسینہ — تھوڑا پسینہ، سخت سردی کے بعد','O6 PERSPIRATION کی اصطلاحات (پگھلانے والا · بو، لاش جیسی · کپڑے داغدار کرنا · تھوڑا پسینہ)');
ok(PEJ.rubrics['clammy, starting from sleep, with']==='پسینہ — چپچپا، نیند سے چونکتے وقت'&&PEJ.rubrics['sides, left']==='پسینہ — پہلو، بائیں'&&PEJ.rubrics['single parts, lain on']==='پسینہ — الگ الگ حصے، جن پر لیٹا ہو','O7 PERSPIRATION کی اصطلاحات پچھلے ابواب سے میل (چپچپا · پہلو · الگ الگ حصے · جن پر لیٹا ہو)');
ok(peKs.every(k=>PEJ.rubrics[k].indexOf('پسینہ — ')===0)&&peKs.filter(k=>/[A-Za-z]/.test(PEJ.rubrics[k])).length===0&&!/دیکھیں/.test(rd('ur/rubrics/kent/perspiration.json'))&&peKs.filter(k=>/[\u06F0-\u06F9\u0660-\u0669]/.test(PEJ.rubrics[k])).length===0&&peKs.filter(k=>/agg\./.test(PEJ.rubrics[k])).length===0&&peKs.filter(k=>PEJ.rubrics[k].indexOf('پسینہ — پسینہ')===0).length===0,'O8 PERSPIRATION: ہر جملے میں جڑ «پسینہ — » ایک بار · کوئی انگریزی حرف نہیں · کوئی «(… دیکھیں)» نہیں · ہندسے 1 2 3 · «agg.» باقی نہیں — 427 جملے');
ok(peKs.filter(k=>{const t=PEJ.rubrics[k].split('، '); return t.some((x,i)=>i&&x===t[i-1]);}).length===0&&PEJ.rubrics['odor, offensive, night, midnight']==='پسینہ — بو، ناگوار، رات، آدھی رات'&&PEJ.rubrics['suppressed, complaints from']==='پسینہ — دبایا ہوا، دبانے سے شکایات','O9 PERSPIRATION: کوئی ٹکڑا دہرایا نہیں گیا اور گہرے رستے درست جڑے (بو › ناگوار › رات › آدھی رات · دبایا ہوا › دبانے سے شکایات)');

// ---------- P. v140: SKIN (جلد) مکمل ----------
const cp=require('child_process');
const PJ=JSON.parse(rd('ur/rubrics/kent/skin.json')); const pk=Object.keys(PJ.rubrics);
ok(rd('js/18-rubrics-ur.js').indexOf("REP_RUBUR_V = '168'")>-1,'P1 ربرک فائلوں کا ورژن 168');
ok(pk.length===1189&&PJ.locked.length===0&&pk.every(k=>PJ.rubrics[k].trim()!==''),'P2 SKIN مکمل: 1189 ربرک، کوئی خالی جملہ نہیں، کوئی قفل نہیں ('+pk.length+')');
ok(PJ.meta.root==='جلد — '&&pk.filter(k=>!k.includes(',')).length===98,'P3 SKIN کی جڑ «جلد — » اور 98 مین ربرک');
ok(rd('service-worker.js').indexOf('bhc-clinic-v176')>-1&&rd('service-worker.js').indexOf('ur/rubrics/kent/skin.json')>-1&&rd('index.html').indexOf('18-rubrics-ur.js?v=168')>-1,'P4 خدمت کار نسخہ 176، ترجمہ ڈیٹا v168، اور جِلد کا JSON درج');
[['eruptions','جلد — دانے'],['eruptions, blisters','جلد — دانے، چھالے'],['eruptions, carbuncle','جلد — دانے، کاربنکل (بڑا پھوڑا)'],['eruptions, eczema','جلد — دانے، خارش (ایگزما)'],['eruptions, pustules','جلد — دانے، پیپ والے دانے'],['eruptions, vesicular','جلد — دانے، چھالوں والے'],['eruptions, urticaria','جلد — دانے، کہیر'],['erysipelas','جلد — دانہ مخملی (اریسی پیلس)'],['ulcers','جلد — ناسور (زخم)'],['ulcers, discharges','جلد — ناسور (زخم)، رطوبت'],['warts','جلد — مسے'],['formication','جلد — چیونٹیاں رینگنے کا احساس'],['gangrene','جلد — گلنا (گینگرین)'],['lupus','جلد — لیوپس'],['itching','جلد — خارش'],['intertrigo','جلد — رگڑ سے چھلنے والی جلد (انٹرٹریگو)'],['wrinkled','جلد — جھریوں والا'],['goose flesh','جلد — رونگٹے'],['eruptions, scabies','جلد — دانے، کھجلی (اسکیبیز)'],['eruptions, itching, warmth','جلد — دانے، خارش، گرمی']].forEach(([k,v])=>ok(PJ.rubrics[k]===v,'P5 SKIN اصطلاح «'+k+'» → '+(PJ.rubrics[k]||'غائب')));
ok(pk.every(k=>!/[\u06F0-\u06F9\u0660-\u0669]/.test(PJ.rubrics[k])&&PJ.rubrics[k].indexOf('جلد — جلد')!==0)&&pk.filter(k=>/[A-Za-z]/.test(PJ.rubrics[k])).length===0&&pk.filter(k=>/agg\./.test(PJ.rubrics[k])).length===0&&!/دیکھیں/.test(rd('ur/rubrics/kent/skin.json')),'P6 SKIN: ہر جملہ «جلد — » سے · کوئی انگریزی حرف نہیں · ہندسے 1 2 3 · «(… دیکھیں)» نہیں');
{
  const qa=cp.execSync('node '+path.join(ROOT,'tools/qa_rubrics_ur.js')+' kent skin',{encoding:'utf8'});
  ok(/⚠ مشتبہ 0/.test(qa),'P7 SKIN کا معائنہ صاف (مشتبہ صفر)');
  const bad=pk.filter(k=>{const t=PJ.rubrics[k].replace('جلد — ','').split('، ');return t.some((x,i)=>i&&(x===t[i-1]||(t[i-1].length>1&&(t[i].indexOf(t[i-1])===0||(/[اہ]$/.test(t[i-1])&&t[i].indexOf(t[i-1].slice(0,-1))===0&&/[ہاےیوں]/.test(t[i][t[i-1].length-1]))))));});
  ok(bad.length===0,'P8 SKIN میں کوئی ٹکڑا دہرایا نہیں گیا ('+bad.length+(bad.length?' · مثال '+bad[0]:'')+')');
}
{
  const w2=L.appWindow(); w2.currentLang='ur'; w2.repUrLabelsOn=()=>true;
  w2.repCurrentBook='kent'; w2.repCurrentChapter='skin';
  w2.repRubUrStore('kent','skin',PJ);
  const sR=L.chapterRows(w2,'kent','skin');
  ok(sR.length===1174,'P9 ایپ کو جِلد کی 1174 قطاریں ملیں (v143: 15 twin چھپے) ('+sR.length+')');
  const h2=w2.repRubUrRowHtml(sR.find(r=>r.key==='eruptions, blisters'));
  ok(/rub-base/.test(h2)&&/rub-delta/.test(h2)&&/چھالے/.test(h2),'P9 ایپ جِلد «چھالے» کی صف: بنیاد «جلد — دانے» + اضافہ «چھالے»');
  const cov=cp.execSync('node '+path.join(ROOT,'tools/coverage_rubrics_ur.js')+' kent',{encoding:'utf8'});
  ok(/skin\s+1174\s+1174\s+0\s+100\.0%/.test(cov),'P9 احاطہ: جِلد 100.0% (v143: دکھائے گئے 1174 — 15 twin چھپے، ترجمہ محفوظ)');
}

// ---------- Q. v141: GENERALITIES (عمومیات) مکمل — کینٹ 100% ----------
const QJ=JSON.parse(rd('ur/rubrics/kent/generalities.json')); const qk=Object.keys(QJ.rubrics);
ok(rd('js/18-rubrics-ur.js').indexOf("REP_RUBUR_V = '168'")>-1,'Q1 ربرک فائلوں کا ورژن 166');
ok(qk.length===2239&&QJ.locked.length===0&&qk.every(k=>QJ.rubrics[k].trim()!==''),'Q2 GENERALITIES مکمل: 2239 ربرک، کوئی خالی جملہ نہیں، کوئی قفل نہیں ('+qk.length+')');
ok(QJ.meta.root==='عمومیات — '&&qk.filter(k=>!k.includes(',')).length===288,'Q3 GENERALITIES کی جڑ «عمومیات — » اور 288 مین ربرک');
ok(rd('service-worker.js').indexOf('bhc-clinic-v176')>-1&&rd('service-worker.js').indexOf('ur/rubrics/kent/generalities.json')>-1&&rd('index.html').indexOf('18-rubrics-ur.js?v=168')>-1,'Q4 خدمت کار نسخہ 176، ترجمہ ڈیٹا v168، اور عمومیات کا JSON درج');
[['convulsions','عمومیات — مرگی کے دورے'],['convulsions, epileptic, aura','عمومیات — مرگی کے دورے، مرگی والا، پیشگی علامت'],['food','عمومیات — غذا'],['food, milk, amel.','عمومیات — غذا، دودھ سے آرام'],['faintness','عمومیات — غشی'],['pain','عمومیات — درد'],['pain, stitching','عمومیات — درد، سوئی جیسا'],['pulse, thready','عمومیات — نبض، دھاگے جیسی'],['weakness','عمومیات — کمزوری'],['paralysis','عمومیات — فالج'],['trembling','عمومیات — لرزنا'],['swelling','عمومیات — سوجن'],['wounds','عمومیات — زخم'],['ulcers','عمومیات — ناسور (زخم)'],['tumors','عمومیات — رسولیاں'],['chorea','عمومیات — رقصہ (چوریا)'],['perspiration','عمومیات — پسینہ'],['measles','عمومیات — خسرہ'],['gangrene','عمومیات — گلنا (گینگرین)'],['leukaemia','عمومیات — خون کا کینسر (لیوکیمیا)'],['sleep','عمومیات — نیند'],['morning, 7 a.m.','عمومیات — صبح 7 بجے'],['night, 1 a.m.','عمومیات — رات 1 بجے']].forEach(([k,v])=>ok(QJ.rubrics[k]===v,'Q5 GENERALITIES اصطلاح «'+k+'» → '+(QJ.rubrics[k]||'غائب')));
ok(qk.every(k=>!/[\u06F0-\u06F9\u0660-\u0669]/.test(QJ.rubrics[k])&&QJ.rubrics[k].indexOf('عمومیات — عمومیات')!==0)&&qk.filter(k=>/[A-Za-z]/.test(QJ.rubrics[k])).length===0&&qk.filter(k=>/agg\./.test(QJ.rubrics[k])).length===0&&!/دیکھیں/.test(rd('ur/rubrics/kent/generalities.json')),'Q6 GENERALITIES: ہر جملہ «عمومیات — » سے · کوئی انگریزی حرف نہیں · ہندسے 1 2 3 · «(… دیکھیں)» نہیں');
{
  const qa=cp.execSync('node '+path.join(ROOT,'tools/qa_rubrics_ur.js')+' kent generalities',{encoding:'utf8'});
  ok(/⚠ مشتبہ 0/.test(qa),'Q7 GENERALITIES کا معائنہ صاف (مشتبہ صفر)');
  const bad=qk.filter(k=>{const t=QJ.rubrics[k].replace('عمومیات — ','').split('، ');return t.some((x,i)=>i&&(x===t[i-1]||(t[i-1].length>1&&(t[i].indexOf(t[i-1])===0||(/[اہ]$/.test(t[i-1])&&t[i].indexOf(t[i-1].slice(0,-1))===0&&/[ہاےیوں]/.test(t[i][t[i-1].length-1]))))));});
  ok(bad.length===0,'Q8 GENERALITIES میں کوئی ٹکڑا دہرایا نہیں گیا ('+bad.length+(bad.length?' · مثال '+bad[0]:'')+')');
}
{
  const w3=L.appWindow(); w3.currentLang='ur'; w3.repUrLabelsOn=()=>true;
  w3.repCurrentBook='kent'; w3.repCurrentChapter='generalities';
  w3.repRubUrStore('kent','generalities',QJ);
  const gR=L.chapterRows(w3,'kent','generalities');
  ok(gR.length===2162,'Q9 ایپ کو عمومیات کی 2162 قطاریں ملیں (v143: 77 twin چھپے) ('+gR.length+')');
  const h3=w3.repRubUrRowHtml(gR.find(r=>r.key==='food, milk, amel.'));
  ok(/rub-base/.test(h3)&&/rub-delta/.test(h3)&&/دودھ سے آرام/.test(h3),'Q9 ایپ عمومیات «دودھ سے آرام» کی صف: بنیاد «عمومیات — غذا» + اضافہ');
  const cov=cp.execSync('node '+path.join(ROOT,'tools/coverage_rubrics_ur.js')+' kent',{encoding:'utf8'});
  // v148: ذہنی باب کی نئی ماخذی تعمیر (4,834 → 4,356) کے بعد دکھائے گئے ربرک 71,027 − 1,149 چھپے لنگر = 69,400
  // اور اُن میں سے 69,283 کے پاس اردو جملہ ہے (ذہنی باب کے 117 نئے ربرکس دانستہ خالی)۔ عمومیات جوں کی توں 100%
  ok(/generalities\s+2162\s+2162\s+0\s+100\.0%/.test(cov)&&/mind\s+4358\s+4358\s+0\s+100\.0%/.test(cov)&&/کل\s+68262\s+68262\s+0\s+100\.0%/.test(cov),'Q9 کینٹ ریپرٹری مکمل: 68,262 دکھائے گئے ربرک · 68,262 جملے · 100.0% (v176: گلا باب ماخذی درخت — 982 فعال ربرک 100% ترجمہ)');
}

console.log(fails?`\n${fails} FAIL`:'\nALL PASS'); process.exit(fails?1:0);
