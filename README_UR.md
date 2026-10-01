# اردو ترجمہ — تازہ ترین زپ کی ہدایات (رولنگ فائل، ہر ورژن میں یہی بدلتی ہے)

**تازہ ترین:** v139 · 1 اکتوبر 2026 · کیش bhc-clinic-v139

## زپ کیسے لگائیں
1. زپ کو ریپو کی **جڑ** میں کھولیں (فائلیں اپنی جگہ بیٹھ جائیں گی)۔
2. کمٹ اور پش کریں۔ (`ur/review/` گٹ ہب پر ضروری نہیں — `.gitignore` میں ہے۔)
3. براؤزر میں **دو بار کنٹرول + شفٹ + آر**۔

## v142 میں کیا ہے — صفائی مکمل، پوری ریپرٹری صاف

پچھلے **23 ابواب کے 4,023 دہرائے ٹکڑے** صاف کر دیے گئے (سب سے زیادہ: اعضا 2,721 · پیٹھ 338 · سینہ 165)۔ اب **پوری کینٹ ریپرٹری میں ایک بھی دہرایا ٹکڑا نہیں**۔

مثالیں:

- «پیٹھ — **ہوا،** ہوا کا جھونکا برداشت نہ ہو» → «پیٹھ — ہوا کا جھونکا برداشت نہ ہو»
- «نیند — **خواب، گھوڑے،** گھوڑا چرانا» → «نیند — خواب، گھوڑا چرانا»
- «پیٹ — گیند، **جیسے،** گلے تک چڑھتی ہوئی» → «پیٹ — گیند، جیسے گلے تک چڑھتی ہوئی»

صفائی نئے اوزار `tools/dedupe_ur.py` سے ہوئی جو JSON کو ہاتھ سے نہیں چھیڑتا — وہی منظور شدہ قاعدہ لگا کر `merge_rubrics_ur.js` کے ذریعے لکھتا ہے۔

**پورے ترجمے کا جائزہ:** 71,026 ربرک پر سات چیک — خالی جملے، انگریزی حروف، اردو ہندسے، «(… دیکھیں)»، `agg.`/`amel.`، جڑ کی عدم موجودگی، دہری جگہ — **سب صفر**۔

---

## v141 میں کیا ہے — عمومیات (GENERALITIES) مکمل، **کینٹ ریپرٹری 100%**

کینٹ ریپرٹری کا سب سے بڑا باب **عمومیات (GENERALITIES)** مکمل ہو گیا — **2,239 ربرک، 288 بنیادی ربرک**۔ اِس کے ساتھ **پوری کینٹ ریپرٹری کا اردو ترجمہ مکمل** ہے: **71,027 / 71,027 = 100.0%**، **37 ابواب**۔

نمونے:

- `convulsions, epileptic, aura` → **عمومیات — مرگی کے دورے، مرگی والا، پیشگی علامت**
- `food, milk, amel.` → **عمومیات — غذا، دودھ سے آرام**
- `pulse, thready` → **عمومیات — نبض، دھاگے جیسی**
- `weakness, morning` → **عمومیات — کمزوری، صبح**

**اگلا کام:** پچھلے 31 ابواب کے **3,919 دہرائے ٹکڑوں کی صفائی** (صارف کی ہدایت — صفائی آخر میں) اور پھر پورے ترجمے کی کمی بیشی کا جائزہ۔

---

## v140 میں کیا ہے — جِلد (SKIN) مکمل (1,189 ربرک)

کینٹ ریپرٹری کا **جِلد (SKIN)** باب اب مکمل اردو میں ہے — **1,189 ربرک، 98 بنیادی ربرک**۔ باب کی جڑ **«جلد — »** ہے، اِس لیے ہر قطار پر بنیاد ہلکے رنگ میں اور نئی شرط نمایاں رنگ میں آتی ہے:

- `eruptions, blisters` → **جلد — دانے، چھالے**
- `ulcers, discharges` → **جلد — ناسور (زخم)، رطوبت**
- `eruptions, urticaria` → **جلد — دانے، کہیر**
- `formication` → **جلد — چیونٹیاں رینگنے کا احساس**

سب سے بڑے حصے: **دانے (ERUPTIONS) 507 ربرک**، **ناسور (ULCERS) 157**، **رنگت بدلنا (DISCOLORATION) 72**، **مسے (WARTS) 39**۔ اصطلاحات پچھلے 36 ابواب سے ملا کر رکھی گئی ہیں (مثلاً گٹھیا، چھالے، پیپ والے دانے، کھرنڈ)۔

**احاطہ اب 96.8%** (68,788 / 71,027) — 36 ابواب مکمل۔ صرف **عمومیات (GENERALITIES) 2,239** باقی ہے۔

---

## v139 میں کیا ہے — بخار (FEVER) اور پسینہ (PERSPIRATION) مکمل (1,036 ربرک)

| بات | تفصیل |
|---|---|
| ابواب | **بخار** — 609 ربرک (جڑ «بخار — »؛ **101 مین ربرک**، `HEAT in general` پہلا، `ZYMOTIC fevers` آخری) · **پسینہ** — 427 ربرک (جڑ «پسینہ — »؛ **96 مین ربرک**، `DAYTIME` پہلا، `WRITING` آخری)۔ آپ کی ہدایت پر **چھوٹے ابواب دو دو کر کے** |
| معیار | دونوں پر ⚠ مشتبہ = **0** · «دیکھیں» 0 · انگریزی حرف 0 · اردو ہندسے 0 · دہرا ٹکڑا 0 · جڑ دو بار 0 |
| طریقہ | بخار: چھ بیچ (`fever_b01..b06_ur.py`) · پسینہ: تین بیچ (`perspiration_b01..b03_ur.py`)۔ اوزار `/home/user/w/mkbatch_ur.py` نے merge سے پہلے گارڈ چلایا اور **14 ہاتھ کی خامیاں** پکڑیں (میں نے بچے میں والد کا ٹکڑا دہرا دیا تھا، مثلاً `afternoon, 2 p.m., followed by chill at 4 p.m.`) |
| نیا اصول | **«سرِ عنوان + وقفہ» کا دہراؤ بھی خودکار ہٹتا ہے**: «شام 6 بجے، شام 6 سے 8 بجے» → «شام 6 سے 8 بجے» (بخار میں 12، پسینے میں 5 جگہیں)۔ ساتھ ہی پرانے اصول: عین دہراؤ · مائل دہراؤ («کھانا، کھانے کے بعد») · اکیلے «جیسے» کا انضمام |
| نئی اصطلاحات | hectic «دقی (ہیکٹک)» · catarrhal «نزلے والا» · gastric «معدے کا» · inflammatory «سوزش والا» · puerperal «زچگی کا» · continued «مسلسل» · exanthematic «دانوں والے» · zymotic «تعفنی (زائموتک)» · typhoid «محرقہ (ٹائفائیڈ)» · intermittent «وقفوں والا» · remittent «اتر چڑھنے والا» · relapsing «بار بار لوٹنے والا» · paroxysm «دورہ» · stage «مرحلہ» · succession of stages «مراحل کی ترتیب» · shuddering «لرزہ» · colliquative «پگھلانے والا» · staining the linen «کپڑے داغدار کرنا» · clammy «چپچپا» · suppressed «دبایا ہوا» · **gout اور rheumatism دونوں «گٹھیا»** (پچھلے ابواب کا قائم اسلوب) |
| گنتی | کینٹ کل **67,599 / 71,027 (95.2%)** — **35 ابواب** مکمل |
| فائلیں | `ur/rubrics/kent/fever.json` · `perspiration.json` · `fever_b01..b06_ur.py` · `perspiration_b01..b03_ur.py` · دونوں `_batch1.tsv` · `js/18-rubrics-ur.js` (`REP_RUBUR_V='139'`) · `index.html` (`?v=139`) · `service-worker.js` (`bhc-clinic-v139` + `fever.json` + `perspiration.json`) · `tests/rubrics_ur_v107.test.js` (نئے ٹیسٹ **N1–N9** اور **O1–O9**؛ L-H11/H12 اپ ڈیٹ) |
| ٹیسٹ | `node tests/rubrics_ur_v107.test.js` → **ALL PASS** · `node tests/rubric_ur_v101.test.js` → **ALL v105 CHECKS PASSED** · دونوں ابواب پر `qa_rubrics_ur` → ⚠ 0 · ایپ کا اصل رینڈر کوڈ (`repRubUrStore` → `repRubUrBase` → `repRubUrRowHtml`) بھی دونوں ابواب پر چلا کر دیکھا |

### اگلا قدم
**(الف)** SKIN (1,189) · GENERALITIES (2,239) = 3,428 باقی۔ **(ب)** سب سے آخر میں صفائی: پچھلے 31 ابواب کے 3,919 دہرائے ٹکڑے (آپ کی ہدایت — صفائی آخر میں)۔

## v138 (پچھلا) — سردی لگنا (CHILL) مکمل (800 ربرک)

| بات | تفصیل |
|---|---|
| باب | **سردی لگنا** — 800 ربرک مکمل (جڑ «سردی لگنا — »؛ **800 اردو جملے**)؛ **109 مین ربرک** (`COLDNESS in general` پہلا، `WRITING` آخری)؛ ⚠ مشتبہ = 0 · «دیکھیں» 0 · انگریزی حرف 0 · اردو ہندسے 0 · دہرا ٹکڑا 0 · جڑ دو بار 0 |
| ترتیب | کتابی ترتیب برقرار — وقت کے عنوانات سب سے پہلے (`COLDNESS in general → DAYTIME → MORNING → FORENOON → NOON → AFTERNOON → EVENING → NIGHT → MIDNIGHT`)، پھر مین ربرک حروفِ تہجی میں (`AFFECTED parts → AIR → ALCOHOL → ALTERNATING → ANGER → ANTICIPATING → … → SHAKING → … → WARMTH → WATER → WIND → WRITING`) |
| طریقہ | آٹھ بیچ (`chill_b01..b08_ur.py` → `chill_batch1.tsv`)۔ **`TIME` کا ذیلی درخت (86 ربرک) خودکار**: نیا اوزار `/home/user/w/mkbatch_ur.py` ہر باب کے لیے قابلِ استعمال ہے — یہ بیچ فائلوں سے TSV بناتا ہے، merge سے پہلے گارڈ چلاتا ہے، اور «سرِ عنوان + شرط» کا دہراؤ خودکار ہٹاتا ہے۔ TM اوزار اِس باب پر نہیں آزمایا گیا |
| اسلوب | قائم قاعدے برقرار: ہر جملہ جڑ «سردی لگنا — » سے **ایک بار** · «(See …)» کا ترجمہ نہیں · ہندسے 1 2 3 · `agg.` «بگاڑ» / `amel.` «آرام» · جہاں والد سے جوڑنا بھدا لگتا ہے وہاں `=` پورا جملہ |
| اسلوبی فیصلہ (صارف کی منظوری) | «سرِ عنوان + شرط» کا دہراؤ **ہٹایا** گیا — v137 کے SLEEP والا اسلوب: «ٹھنڈک، حیض، حیض سے پہلے» → «ٹھنڈک، حیض سے پہلے» (CHILL میں **102 جگہیں**)۔ اِسی فیصلے کے تحت **پچھلے 31 ابواب کے 3,919 دہرائے ٹکڑے بھی صاف ہوں گے** (الگ ورژن v139) |
| وقت کا قاعدہ | `a.m.` 1–11 → «صبح N بجے» · `12 a.m.` (کینٹ میں دوپہر) → «دوپہر 12 بجے» · `p.m.` 1–4 → «سہ پہر» · 5–8 → «شام» · 9–11 → «رات» · `midnight` → «آدھی رات» · `N-30` → «صبح 10:30» · `N to M` → «صبح N سے M بجے» (مختلف پہر ہو تو «… سے … بجے تک») |
| نئی اصطلاحات | chill «سردی لگنا» · chilliness/coldness «ٹھنڈک» · SHAKING «کپکپی» · shivering «کانپنا» · trembling «لرزنا» · alternating «باری باری» · icy cold «برف جیسی ٹھنڈک» · pernicious «مہلک» · anticipating «وقت سے پہلے آنا» · postponing «وقت پیچھے کھسکنا» · tertian «تیسرے دن والا» · quartan «چوتھے دن والا» · quotidian «روزانہ» · apyrexia «بخار کا وقفہ» · siesta «دوپہر کی نیند» · draught «جھونکا» · warm stove «گرم چولہا» · UNCOVERED «بے ڈھکا» · WATER «جیسے پانی ڈالا جا رہا ہو» · WIND «جیسے ہوا چل رہی ہو» · scrobiculis cordis «دل کا گڑھا» · sacrum «تعلق کی ہڈی» · vertex «سر کی چوٹی» · scapula «کندھے کی ہڈی» · calves «پنڈلیاں» · buttocks «سُرین» · VEXATION «چڑ» |
| گنتی | کینٹ کل **66,563 / 71,027 (93.7%)** — **33 ابواب** مکمل |
| فائلیں | `ur/rubrics/kent/chill.json` · `ur/rubrics/kent/chill_b01..b08_ur.py` · `ur/rubrics/kent/chill_batch1.tsv` · `js/18-rubrics-ur.js` (`REP_RUBUR_V='138'`) · `index.html` (`?v=138`) · `service-worker.js` (`bhc-clinic-v138` + `chill.json`) · `tests/rubrics_ur_v107.test.js` (نئے ٹیسٹ **M1–M9**؛ L-H11/H12 اپ ڈیٹ) · **`.gitignore` دوبارہ بھیجا گیا** — v137 میں شامل کیا تھا مگر HEAD پر نہیں پہنچا (ریموٹ پر آج بھی دو لائنیں ہیں)، اِس لیے ٹیسٹ **E8** ابھی بھی ناکام ہے۔ **یہ پوشیدہ فائل ہے** — زپ کھولنے کے بعد تصدیق کر لیں |
| ٹیسٹ | `node tests/rubrics_ur_v107.test.js` → **ALL PASS** (M1–M9 شامل) · `node tools/qa_rubrics_ur.js kent chill` → ⚠ 0 · `node tools/coverage_rubrics_ur.js kent` → chill **100.0%** |

### اگلا قدم
**(الف) v139:** پچھلے 31 ابواب کے 3,919 دہرائے ٹکڑے صاف کریں (صارف کی منظوری شدہ)۔ **(ب)** FEVER (609) · PERSPIRATION (427) · SKIN (1,189) · GENERALITIES (2,239)۔

## v137 (پچھلا) — نیند (SLEEP) مکمل (1,066 ربرک)

| بات | تفصیل |
|---|---|
| باب | **نیند** — 1,066 ربرک مکمل (جڑ «نیند — »؛ **1,066 اردو جملے**)؛ **30 مین ربرک** (`ANXIOUS` پہلا، `YAWNING` آخری)؛ ⚠ مشتبہ = 0 · «دیکھیں» 0 · انگریزی حرف 0 · اردو ہندسے 0 · دہرا ٹکڑا 0 |
| ترتیب | کتابی ترتیب برقرار — مین ربرک حروفِ تہجی میں (`ANXIOUS → BAD → CHILL → COMATOSE → CONVULSIONS → DEEP → DISTURBED → DOZING → DREAMS → FALLING asleep → … → SLEEPINESS → SLEEPLESSNESS → SNORING → UNREFRESHING → WAKING → YAWNING`)؛ `SLEEPINESS` اور `YAWNING` کے اوقات کتاب کے مطابق (`morning → forenoon → noon → afternoon → evening → night`، گھنٹے بھی ترتیب میں) |
| طریقہ | **سب ہاتھ سے** — سات بیچ (`sleep_b01..b07_ur.py` → `sleep_batch1.tsv`)؛ TM اوزار نے صرف 9 ربرک خودکار دیے کیونکہ `DREAMS` کے 442 ربرک منفرد فقرے ہیں («کہ وہ زندہ دفن ہو رہا ہے»، «کہ اُسے چھری سے کاٹا جا رہا ہے»)۔ merge سے پہلے **گارڈ اسکین**: والد-آخری-لفظ / بچے-پہلے-لفظ + **پورے ٹکڑے کی تکرار** → 6 جگہیں درست کیں («پانی، پانی میں گرنا» → «پانی، اِس میں گرنا»؛ «رات، رات کا پہلا حصہ» → «رات کا پہلا حصہ»؛ «جاگنا، جاگنا ممکن نہیں» → «جاگنا ممکن نہیں»؛ «قتل، قتل کیے گئے لوگ» → «قتل، مقتول لوگ دیکھنا»؛ «باتیں کرتے ہوئے، باتیں کرتے ہوئے» → والد «باتیں کرنا») |
| اسلوب | قائم قاعدے برقرار: ہر جملہ جڑ «نیند — » سے شروع · «(See …)» کا ترجمہ نہیں · ہندسے 1 2 3 · `agg.` «بگاڑ» / `amel.` «آرام» · اوقات «صبح 5 بجے» «سہ پہر 5 بجے» «شام 8 بجے» «رات 11 بجے» · `10-30 a.m.` → «صبح 10:30» · جہاں والد سے جوڑنا بھدا لگتا ہے وہاں `=` پورا جملہ |
| نئی اصطلاحات | comatose «بے ہوشی» · semi-conscious «نیم بے ہوشی» · dozing «اونگھ» · sleepiness «غنودگی» · sleeplessness «بے خوابی» · dreams «خواب» · nightmare «ڈراؤنا خواب» · yawning «جمائی لینا» · waking «جاگنا» · falling asleep «آسانی سے آ جانا» · unrefreshing «تازگی نہ دینے والی» · catalepsy «اکڑن (کٹیلیپسی)» · clairvoyant «غیب نما» · carousing «عیاشی (شراب نوشی)» · banquet «دعوت» · tomb «قبر» · coffin «تابوت» · vermin «کیڑے مکوڑے» · dragons «اژدھا» · spectres «بھوت پریت» · twilight «گودھولی» · daybreak «صبح صادق» · homesickness «وطن کی یاد» · position «لیٹنے کا انداز» · coition «ہم بستری» |
| ہم آہنگی | 31 پچھلے ابواب سے موازنہ: تشنج · ہذیان · بے سدھی · غنودگی · خراٹے · چکر · بے چینی · حیض · سردی لگنا · دوپہر سے پہلے (forenoon) · دوپہر کا کھانا (dinner) · رات کا کھانا (supper) · جمائی لینا · چونک اٹھنا · منی کا اخراج · پیشاب کے زہر (یوریمیا) · سرے کی جلد (prepuce) · گل کر جھڑنا · بے عزتی (mortification) |
| گنتی | کینٹ کل **65,763 / 71,027 (92.6%)** — **32 ابواب** مکمل |
| فائلیں | `ur/rubrics/kent/sleep.json` · `js/18-rubrics-ur.js` (`REP_RUBUR_V='137'`) · `index.html` (`?v=137`) · `service-worker.js` (`bhc-clinic-v137` + `sleep.json`) · `tests/rubrics_ur_v107.test.js` (نئے ٹیسٹ **L1–L8**؛ L-H11/H12 اپ ڈیٹ) · `.gitignore` میں `ur/review/` (ٹیسٹ E8 اسی کا تقاضا کرتا تھا مگر HEAD پر درج نہیں تھا — **پہلے سے موجود خرابی ٹھیک ہوئی**) |
| ٹیسٹ | `node tests/rubrics_ur_v107.test.js` → **ALL PASS** (L1–L8 شامل) · `node tests/rubric_ur_v101.test.js` → **ALL v105 CHECKS PASSED** · `node tests/qa_rubrics_ur.js kent sleep` → ⚠ 0 · باقی سوٹ (differentiation 49 · repertory_ui 21 · materia_medica 72 · synthesis_tree 14 · app_smoke) بھی **ALL TESTS PASSED** |

### اگلا قدم
FEVER (609) · PERSPIRATION (427) · SKIN (1,189) · GENERALITIES (2,239)۔

## v136 — اعضا (EXTREMITIES) مکمل (16,057 ربرک)

| بات | تفصیل |
|---|---|
| باب | **اعضا** — 16,057 ربرک مکمل (جڑ «اعضا — »؛ **16,056 اردو جملے** — اصل ڈیٹا میں ایک انگریزی کلید `clenching, fingers` دو بار ہے)؛ **283 مین ربرک** (`ABDUCTED` پہلا، `WRINKLED` آخری)؛ ⚠ مشتبہ = 0 · «دیکھیں» 0 · انگریزی حرف 0 · اردو ہندسے 0 |
| ترتیب | کتابی ترتیب برقرار — مین ربرک حروفِ تہجی میں (`ABDUCTED → ABSCESS → AIR passing down… → ALIVE → ANÆSTHESIA → ANALGESIA … ULCERS → WARTS → WEAKNESS → WHIRLING → WIND → WITHERED → WOODEN sensation → WRINKLED`)؛ `PAIN` کی ذیلی اقسام کتاب کے مطابق (وقت پہلے: `right then left · left then right · morning · forenoon … night`؛ پھر `aching → boring → burning → cutting → drawing → gnawing → pressing → … → sprained → stitching → tearing`) |
| طریقہ | کینٹ کا سب سے بڑا باب ہے — سطری حوالے سے تقریباً ایک تہائی اردو جملے پہلے ابواب کے ٹکڑوں سے **خودکار** بنے (یادداشت + ٹکڑا ڈکشنری + گرامر قواعد: «extend→تک پھیلتا ہوا»، «N p.m.→سہ پہر N بجے»، «amel./agg.» کا جوڑ، جار کا کھنچاؤ، «(See …)» حذف) — کوئی عارضی فائل ریپو میں نہیں؛ نظرثانی کی فائل میں ہر جملہ موجود ہے |
| نئی اصطلاحات | patella «گھٹنے کی کاسہ (پیٹیلا)» · forearm «کلائی سے کہنی تک بازو» · tendo achillis «ایڑی کی رسی (ٹینڈو اکیلس)» · malleolus «ٹخنے کی ہڈی کا ابھار» · deltoid «کندھے کا پٹھا (ڈیلٹائیڈ)» · biceps/triceps «دو/تین سروں والا پٹھا (بائسپس/ٹرائسپس)» · radius «بازو کی باہر والی ہڈی (ریڈیئس)» · ulna «بازو کی اندر والی ہڈی (النہ)» · humerus «بازو کی ہڈی» · ilium «کولھے کی ہڈی» · bunions «پاؤں کے جوڑ کی سوجن (بنین)» · callosities «سخت گٹھے» · corns «گٹھے (مکئی)» · felon/paronychia «ناخن کے گرد پھوڑا» · bursae «تھیلیاں (برسا)» · exostoses «ہڈی کا ابھار» · caries of bone «ہڈی کا گلنا» · gressus «چال» · milk-leg «زچگی کے بعد ٹانگ کی سوجن (ملک لیگ)» · goose-flesh «رونگٹے کھڑے ہونا» |
| گنتی | کینٹ کل **64,697 / 71,027 (91.1%)** — **31 ابواب** مکمل |
| فائلیں | `ur/rubrics/kent/extremities.json` · `js/18-rubrics-ur.js` (`REP_RUBUR_V='136'`) · `index.html` (`?v=136`) · `service-worker.js` (`bhc-clinic-v136` + `extremities.json`) · `tests/rubrics_ur_v107.test.js` (نئے ٹیسٹ **K1–K7**؛ H11/H12 اپ ڈیٹ) |
| ٹیسٹ | `node tests/rubrics_ur_v107.test.js` → **136 PASS / ALL PASS** · `node tests/rubric_ur_v101.test.js` → **ALL v105 CHECKS PASSED** |

### اگلا قدم
SLEEP (1,066) — پھر CHILL (800) · FEVER (609) · PERSPIRATION (427) · SKIN (1,189) · GENERALITIES (2,239)۔

## v135 (پچھلا) — پیٹھ مکمل (3,888 ربرک)

| بات | تفصیل |
|---|---|
| باب | **پیٹھ** — 3,888 ربرک میں سے **3,888 مکمل** (جڑ «پیٹھ — »)؛ **87 مین ربرک** (`ABSCESS` پہلا، `WIND` آخری)؛ تیرہ بیچ سب ہاتھ سے (`back_b1..b13_ur.py` → `ur/rubrics/kent/back_batch1.tsv`)؛ ⚠ مشتبہ = 0 |
| ترتیب | کتابی ترتیب برقرار — مین ربرک حروفِ تہجی میں (`ABSCESS → AIR → ASLEEP → BAR → BIFIDA → BLOOD → BLUISH → BOILS → BROWN → … → STIFFNESS → STRAINING → SWELLING → TENSION → TINGLING → TREMBLING → TUMORS → TWITCHING → ULCERS → WARM → WARTS → WAVE → WEAKNESS → WIND`)؛ `PAIN` کی ذیلی اقسام کتاب کے مطابق (`aching → boring → burning → clawing → constricting … drawing → pressing → sore → stitching → tearing`) اور **پھیلاؤ سب سے آخر میں** (کینٹ کے پیش لفظ کا قاعدہ) |
| نئی اصطلاحات | sacrum «تعلق کی ہڈی» · coccyx «دم کی ہڈی» · vertebra «مہرہ/مہرے» · scapula «کندھے کی ہڈی» · nape «گردن کے پچھلے حصے» · nates «سُرین» · sciatics «عرق النسا» · flatus «ریاح» · erysipelas «سرخ بادہ (ایریسیپلس)» · formication «چیونٹیاں رینگنے کا احساس» · bifida «ریڑھ کے مہروں کا کھلا رہ جانا (بائفڈا)» · emposthotonos/opisthotonos «پیٹھ کی طرف اکڑ جانا (اوپس تھوٹونس)» · bar «سلاخ» · twitching «پھڑکن» · tingling «جھنجھناہٹ (سنسناہٹ)» · prickling «چبھن (سوئی جیسی)» · polypus «پولیپ» · sarcoma «سارکوما» · fistulae «نالیاں (فِسچولا)» · emaciation «دبلا ہونا» · hot sponge «گرم اسفنج» · riding in a carriage «بگھی میں سفر» |
| خود جانچ | merge سے پہلے **والد-آخری-لفظ / بچے-پہلے-لفظ** کا مکمل اسکین → **509 جگہیں** درست کیں (مثلاً «رات، رات، کپڑے اتارتے وقت» → «رات، کپڑے اتارتے وقت»؛ «درد، پھیلتا ہوا، بازو، بازو، بائیں» → «…، بازو، بائیں»؛ «گلٹیاں…، پیٹھ کا اوپری حصہ، کندھے کی ہڈیاں، پیٹھ کا اوپری حصہ، کندھے کی ہڈیاں، درمیان» → ایک ہی بار) · دو قطاریں (947 · 950) ہاتھ سے سیدھی کیں · بیچ 10 کا ایک سرکا ہوا نمبر (2818/2820) پکڑا اور درست کیا · پھر **final JSON پر دہرے لفظ کا اسکین = 0** · «(… دیکھیں)» = 0 · انگریزی حرف = 0 · اردو ہندسے = 0 |
| گنتی | کینٹ کل **48,640 / 71,027 (68.5%)** — **30 ابواب** مکمل |
| فائلیں | `ur/rubrics/kent/back.json` · `js/18-rubrics-ur.js` (`REP_RUBUR_V='135'`) · `index.html` (`?v=135`) · `service-worker.js` (`bhc-clinic-v135` + `back.json`) · `tests/rubrics_ur_v107.test.js` (نئے ٹیسٹ **J1–J7**؛ H11/H12 اپ ڈیٹ) |
| ٹیسٹ | `node tests/rubrics_ur_v107.test.js` → **129 PASS / ALL PASS** · `node tests/rubric_ur_v101.test.js` → **ALL v105 CHECKS PASSED** |

### اگلا قدم
EXTREMITIES (16,057) — پھر SLEEP (1,066) · CHILL (800) · FEVER (609) · PERSPIRATION (427) · SKIN (1,189) · GENERALITIES (2,239)۔

## v134 (پچھلا) — سینہ مکمل (3,433 ربرک)

| بات | تفصیل |
|---|---|
| باب | **سینہ** — 3,433 ربرک میں سے **3,433 مکمل** (جڑ «سینہ — »)؛ **174 مین ربرک** (`ABSCESS` پہلا، `WINE` آخری)؛ نو بیچ سب ہاتھ سے (`chest_b1..b9_ur.py` → `chest_batch1.tsv`)؛ ⚠ مشتبہ = 0 |
| ترتیب | کتابی ترتیب برقرار — مین ربرک حروفِ تہجی میں (`ABSCESS → ADHESION → AFFECTIONS of → … → WARTS on → WATER → WEAKNESS → WEIGHT → WHIRLING → WINE`)؛ `PAIN` کی ذیلی اقسام بھی کتاب کے مطابق (`burning → bursting → clawing → crampy → cutting → digging → drawing → gnawing → griping`)؛ `PALPITATION heart → PARALYSIS → PERSPIRATION → PETECHIAE → PHTHISIS → PLUG → PULSATION → PURRING → RATTLING → RESTLESSNESS` |
| نئی اصطلاحات | mammae «پستان» · nipple «نپل» · axilla «بغل» · sternum «سینے کی ہڈی» · clavicle «ہنسلی» · ڈایفرام «حجابِ حائل (ڈایفرام)» · emphysema «پھیپھڑوں میں ہوا بھر جانا» · empyema «سینے میں پیپ بھرنا» · hepatization «جگر جیسا ہو جانا» · petechiae «جسم پر سرخ دھبے (پیٹیشی)» · phthisis pulmonalis «پھیپھڑوں کی ٹی بی (دق)» · purring «بلی جیسی گھرگھراہٹ» · rattling «کھڑکھڑاہٹ» · stenocardia «انجائنا پیکٹورس» · aorta «شاہ رگ (ایورٹا)» · plug «جیسے پلگ ہو» |
| خود جانچ | merge سے پہلے **والد-آخری-لفظ / بچے-پہلے-لفظ** کا اسکین → 6 بےجا تکرار درست کیں («رات، رات 11 بجے…» → «رات، 11 بجے…»؛ «حیض، حیض کے دوران» → «حیض، کے دوران»؛ «پستان میں، میں» → «پستان میں، …»؛ «دائیں، دائیں پھیپھڑے کی چوٹی میں» → «دائیں، پھیپھڑے کی چوٹی میں»)؛ نیز **«(… دیکھیں)» کا پرانا اسلوب** صاف کیا — سینہ کے 27 جملوں اور v133 کھانسی کے 66 جملوں سے قوسین مکمل حذف (مثلاً «کھانسی — سرخ (خون کو دیکھیں)» → «کھانسی — سرخ»)؛ parents-keys 0/0/0 دوبارہ جانچے گئے |
| گنتی | کینٹ کل **44,752 / 71,027 (63.0%)** — **29 ابواب** مکمل |
| فائلیں | `ur/rubrics/kent/chest.json` · `ur/rubrics/kent/cough.json` (دوبارہ مرج — «دیکھیں» صفائی) · `js/18-rubrics-ur.js` (`REP_RUBUR_V='134'`) · `index.html` (`?v=134`) · `service-worker.js` (`bhc-clinic-v134` + `chest.json`) · `tests/rubrics_ur_v107.test.js` (نئے ٹیسٹ **I1–I6**؛ H11/H12 اپ ڈیٹ) |
| ٹیسٹ | `node tests/rubrics_ur_v107.test.js` → **122 PASS / ALL PASS** · `node tests/rubric_ur_v101.test.js` → **ALL v105 CHECKS PASSED** |

### اگلا قدم
BACK (3,888) — پھر EXTREMITIES (16,057) · SLEEP (1,066) · CHILL (800) · FEVER (609) · PERSPIRATION (427) · SKIN (1,189) · GENERALITIES (2,239)۔

## v133 (پچھلا) — حلقوم/سانس کا راستہ: چار ابواب مکمل (3,568 ربرک)

| بات | تفصیل |
|---|---|
| ابواب | **حلقوم اور سانس کی نالی 738** (جڑ «حلقوم — ») · **سانس 761** (جڑ «سانس — ») · **بلغم 379** (جڑ «بلغم — ») · **کھانسی 1,690** (جڑ «کھانسی — ») — چاروں 100% ہاتھ سے (`larynx_and_trachea_batch1.tsv` · `respiration_batch1.tsv` · `expectoration_batch1.tsv` · `cough_batch1.tsv`)؛ ⚠ مشتبہ = 0 |
| ترتیب | کتابی ترتیب برقرار — **کھانسی**: `DAYTIME → MORNING → FORENOON → NOON → AFTERNOON → EVENING → NIGHT` پھر حروفِ تہجی (`ACIDS agg. · ACRID … · AIR`) کتاب PDF1720–21 کے مطابق · **بلغم**: `MORNING` پہلے … `NIGHT` پھر `ACRID · AIR · ALBUMINOUS … · ASH-COLORED spots · BALL` |
| نئی اصطلاحات | larynx «حلقوم» · trachea «سانس کی نالی» · vocal cords «آواز کی ڈوریاں (ووکل کورڈز)» · epiglottis «کنٹھ (ایپیگلوٹس)» · croup «خناق (کروپ)» · coryza «زکام» · hawking «کھنکارنا» · hemming «ہم ہم کرنا (گلا صاف کرنا)» · viscid «چپچپا» · tenacious «لزج» · gelatinous «جیلی جیسی» · glairy «انڈے کی سفیدی جیسی» · ropy «رسی جیسا» · stertorous «خرخراہٹ بھرا» · stridulous «سیٹی دار (سٹریڈولس)» · asthmatic «دمے والی» · whooping «کالی کھانسی» · minute guns «منٹ گن (توپ)» |
| خود جانچ | والد اور بچے کے ملنے والے جملوں میں **دہرے لفظ کا خودکار اسکین** — 17 جگہیں درست کیں (مثلاً «صبح، صبح سویرے» → «صبح، سویرے»؛ «نیند، نیند کے دوران» → «نیند، کے دوران»)؛ نیز «سے بگاڑ» والا اسلوب اور کوئی انگریزی حرف نہ ہونے کی جانچ چاروں ابواب پر |
| گنتی | کینٹ کل **41,319 / 71,027 (58.2%)** — **28 ابواب** مکمل |
| فائلیں | `ur/rubrics/kent/larynx_and_trachea.json` · `respiration.json` · `expectoration.json` · `cough.json` · `js/18-rubrics-ur.js` (`REP_RUBUR_V='133'`) · `index.html` (`?v=133`) · `service-worker.js` (`bhc-clinic-v133` + چار نئی json) · `tests/rubrics_ur_v107.test.js` (نئے ٹیسٹ **H1–H12**) |
| ٹیسٹ | `node tests/rubrics_ur_v107.test.js` → **ALL PASS** · `node tests/rubric_ur_v101.test.js` → **ALL PASS** |

### اگلا قدم
CHEST (3,433) — پھر BACK (3,888) اور پھر EXTREMITIES (16,057)۔

## v132 (پچھلا) — GENITALIA FEMALE مکمل (1,471 ربرک)

| بات | تفصیل |
|---|---|
| باب | **تناسلی اعضاء (عورت)** — 1,471 ربرک میں سے **1,471 مکمل** (جڑ «تناسلی اعضاء (عورت) — »)؛ بیچ 1–4 سب ہاتھ سے (`genitalia_female_batch1..4.tsv`)؛ ⚠ مشتبہ = 0 |
| خود جانچ | پچھلے 23 ابواب سے خودکار موازنہ کر کے **144 قطاروں** کا اسلوب/اصطلاح درست کیا: «سے بڑھے» → **«سے بگاڑ»** (75) · numbness «سن ہونا»، swollen «سوجن»، fullness «بھراؤ»، nodules «گلٹیاں»، tubercles «گلٹیاں (گٹھلیاں)»، gangrene «گلنا (گینگرین)»، prolapsus «اترنا» (68) · ایک بےجا اضافہ ہٹایا (1) |
| نئی اصطلاحات | physometra «رحم میں ہوا کا جمع ہونا» · placenta retained «جفت (نال) باہر نہ نکلنا» · subinvolution «زچگی کے بعد رحم کا سکڑ کر واپس نہ آنا» · sterility «بانجھ پن» · vaginismus «اندرونی راستے کا تشنج (وجائنیزم)» · serous cysts «اندرونی راستے میں پانی بھری تھیلیاں (سسٹ)» · clitoris «عضو تناسل کی چوٹی (کلیٹورس)» |
| ترتیب | ربرک کتابی ترتیب پر ہی ہیں (v130/v131 کا نظام) — مثلاً `MENSES, daytime only` → `MENSES, morning`؛ `PAIN, pressing` → `PAIN, sharp`؛ `PHYSOMETRA` → `PLACENTA retained` → `POLYPUS` |
| گنتی | کینٹ کل **37,751 / 71,027 (53.2%)** — **24 ابواب** مکمل |
| فائلیں | `ur/rubrics/kent/genitalia_female.json` · `js/18-rubrics-ur.js` (`REP_RUBUR_V='132'`) · `index.html` (`?v=132`) · `service-worker.js` (`bhc-clinic-v132` + نئی json) · `tests/rubrics_ur_v107.test.js` (نئے ٹیسٹ **F8–F11**) |
| ٹیسٹ | `node tests/rubrics_ur_v107.test.js` → **ALL PASS** (F1–F11 + G1–G7) |

### اگلا قدم
LARYNX AND TRACHEA (738) + RESPIRATION (761) + COUGH (1,690) — تینوں ایک ہی ورژن میں (چھوٹے ابواب اکٹھے) — **مکمل (v133)**۔

## v131 میں کیا ہے — مین ربرک اپنی حروفِ تہجی والی جگہ پر آ گئے

| بات | تفصیل |
|---|---|
| مسئلہ | چند مین ربرک باب کے **آخری سرے** پر پڑے تھے (مثلاً rectum میں `ASH-COLORED (See Gray)` — یہ اصل میں **STOOL** کا ربرک ہے، کتاب صفحہ 1372)۔ کتاب میں مین ربرک حروفِ تہجی سے ہوتے ہیں، اِس لیے ایسے ربرک کی جگہ غلط لگ رہی تھی |
| کیا بدلا | صرف **مین ربرک (جڑ)** کی ترتیب — `js/repertory/rep-chapters.js` میں `_repKentRootKey` کے تین درجے: `[0]` «… in general» سب سے اوپر (مگر صرف جب وہ کتاب میں اُسی باب کا پہلا ربرک ہو — CHILL کا `COLDNESS in general`، FEVER کا `HEAT in general`) · `[1]` وقت کا بلاک (`DAYTIME → … → MIDNIGHT`) جہاں کتاب نے وقت مقدم کیا · `[2]` باقی سب **حروفِ تہجی** |
| صاف کرنے کے قاعدے | `(See …)` حصہ ترتیب پر اثر نہیں ڈالتا · `Æ → AE` · **ہائفن پہلے حذف** (اسی لیے کتاب کے مطابق `READING < RE-ECHO < RINGING`) |
| ذیلی ربرک | وہی v130 والا قانون — پرانے ربرک کتابی ترتیب پر، نئے ربرک پروٹوکول پر (عام → وقت → شرائط → محل → **پھیلاؤ آخر میں**) |
| تصدیق | کینٹ کی PDF سے ملایا گیا: KIDNEYS · BACK · RECTUM · STOOL · GENERALITIES · COUGH · CHILL · FEVER اور باقی — 18 ابواب کی ترتیب حرف بحرف مطابق |
| گنتی | 37 ابواب · قطاریں **71,027 ±0** · مین ربرک **4,709 ±0** — کوئی ربرک کم/زیادہ نہیں، کوئی ترجمہ/کلید نہیں چھیڑی گئی · 2,652 مین ربرک اپنی حروفِ تہجی والی جگہ پر آئے |
| نئی فائل | `js/repertory/KENT_ORDER_METHOD.md` — **ترتیب کا پورا طریقہ کار** (اصول، کتابی حوالے، گنتی، آگے کام کرنے کا طریقہ)؛ یہ فائل کینٹ ریپرٹری کے کوڈ کے ساتھ منسلک ہے |
| فائلیں | `js/repertory/rep-chapters.js` · `js/repertory/KENT_ORDER_METHOD.md` (نئی) · `index.html` (`?v=131`) · `service-worker.js` (`bhc-clinic-v131`) · `tests/rubrics_ur_v107.test.js` (نئے ٹیسٹ G1–G7) |
| ٹیسٹ | `node tests/rubrics_ur_v107.test.js` → **ALL PASS** (F1–F7 + G1–G7) |

### اگلا قدم (اُس وقت)
GENITALIA FEMALE (1,471 ربرک) — ترجمہ **کتابی ترتیب** پر ہوگا، اور اُس کا ریویو بھی اسی ترتیب میں نکلے گا — **مکمل (v132)**۔

## v130 (پچھلا ورژن) — کینٹ کی کتابی ترتیب درست ہو گئی

| بات | تفصیل |
|---|---|
| مسئلہ | کینٹ کے مین ربرک اور سب ربرک ایپ میں کتاب کی ترتیب پر نہیں، **فائل کی ترتیب** پر دکھ رہے تھے (پرانا merge سکرپٹ ہر سطح کو «سب سے چھوٹا OOREP id» ملا کر چنتا تھا) |
| کیا بدلا | صرف ایپ کا **ٹری بنانے/دکھانے کا** حصہ — نئی ترتیب دینے والی کارروائی `js/repertory/rep-chapters.js` میں (`_repSortTreeKentOrder`)۔ صرف کینٹ پر لاگو؛ باقی کتابیں جوں کی توں |
| نئی ترتیب کا قاعدہ | پرانے ربرک اپنی **کتابی ترتیب** پر (جو اُن کے `r…` نمبر میں محفوظ ہے) · نئے/OOREP ربرک کینٹ کے پروٹوکول کی جگہ پر: عام ربرک → **وقت** (daytime، morning … night) → **شرائط** (حروفِ تہجی) → **محل** → **پھیلاؤ سب سے آخر** (یہ ترتیب کینٹ کے اپنے پیش لفظ سے ہے) |
| تصدیق | آپ کی دی ہوئی کینٹ پی ڈی ایف سے: ERECTIONS بلاک (صفحہ 1497–1501) کی 63 سطروں میں **62 حرف بحرف** مطابق · rectum باب کا آغاز (صفحہ 1308) پورا مطابق · COLDNESS اور CONDYLOMATA (صفحہ 1495–1496) کے باریک ربرک بھی r-id ترتیب سے عین مطابق |
| کیا نہیں بدلا | **کوئی ترجمہ نہیں بدلا، کوئی کلید نہیں بدلی، کوئی ربرک کم/زیادہ نہیں** — 71,027 قطاریں جوں کی توں (ہر باب پر جانچا گیا) |
| بونس | آگے کی ابواب (GENITALIA FEMALE وغیرہ) کی TSV اور ریویو فائلیں بھی اب **کتابی ترتیب** میں نکلیں گی |
| فائلیں | `js/repertory/rep-chapters.js` · `index.html` (`rep-chapters.js?v=130`) · `service-worker.js` (`CACHE_NAME=bhc-clinic-v130`) · `tests/rubrics_ur_v107.test.js` (نئے ٹیسٹ F1–F7) |
| ٹیسٹ | `node tests/rubrics_ur_v107.test.js` → **ALL PASS** (پر قائم 23 ابواب کی جانچ بھی شامل) |

### مکمل ابواب (اُس وقت 23) — کل 36,280 ربرک (51.1%)
مائنڈ · چکر · سر · آنکھ · نظر · کان · سماعت · ناک · چہرہ · منہ · دانت · حلق · بیرونی گلا · معدہ · پیٹ · پاخانہ · مثانہ · گردے · پروسٹیٹ غدود · مقعد · پیشاب کی نالی · پیشاب · تناسلی اعضاء (مرد)

## پرانی یاد دہانی (وہی قاعدے)
- ہر تبدیلی پر `index.html` کا `?v=` اور `service-worker.js` کا `CACHE_NAME` بڑھائیں۔
- `LOAD_ORDER.txt` کی ترتیب کبھی نہ بدلیں؛ `*_chapters/` · `mm/` · `library/` · `data/` کی JSON نہ چھیڑیں۔
- اپلوڈ کے بعد براؤزر میں **دو بار کنٹرول + شفٹ + آر** (آف لائن کیش بدلنے کیلئے)۔
