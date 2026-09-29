# HANDOFF — کام کہاں تک پہنچا
**آخری تجدید:** 30 ستمبر 2026 · **v135** · **ریپو:** https://github.com/touqeer25/bismillah-clinic
**لائیو:** https://bismillah-clinic.vercel.app · **ایپ:** `index.html` + `js/` (PWA، کوئی بنڈلر نہیں)

> **نئی نشست یہاں سے شروع کرے۔** پہلے یہ پوری فائل پڑھیں، پھر «باقی کام» والا حصہ۔

---

# 0. سب سے پہلے — کام کرنے کا طریقہ

| اصول | تفصیل |
|---|---|
| **زبان** | صارف سے **مکمل اردو** میں بات کریں (29 ستمبر 2026 کی ہدایت): جملوں کے اندر انگریزی لفظ **نہ** لکھیں — انگریزی اصطلاح **اردو رسم الخط** میں لکھیں (زپ، فائل، ٹیسٹ، ریپرٹری، چیپٹر)۔ فائلوں کے نام صرف کوڈ بلاک میں، الگ سطر پر |
| **ہندسے** | ہر جگہ **1 2 3** (اردو ہندسے ۱ ۲ ۳ نہیں) — چیٹ، دستاویز، **اور ریپرٹری کے اردو ترجمے** میں بھی (v108 میں سب پرانی فائلیں بدل دی گئیں؛ `merge_rubrics_ur.js` خود بدل دیتا ہے، `qa_rubrics_ur.js` اردو ہندسوں پر ⚠ دیتا ہے) |
| **اجازت** | **بغیر اجازت کوڈ نہ بدلیں۔** پہلے تجویز، پھر منظوری، پھر کام |
| **ڈیٹا** | `*_chapters/` · `mm/` · `library/` · `data/` کی JSON **کبھی نہ بدلیں** (ترجمے کی `ur/` فائلوں کے سوا) |
| **ورژن** | ہر تبدیلی پر `index.html` میں `?v=` اور `service-worker.js` میں `CACHE_NAME` بڑھائیں |
| **ترتیب** | `LOAD_ORDER.txt` کی ترتیب کبھی نہ بدلیں |
| **سجاوٹ** | نئی CSS **نئی فائل** میں؛ پرانے قاعدے پر قاعدہ نہ چڑھائیں |
| **ترسیل** | ہر کام کے آخر میں **زپ** بنائیں جس کی ساخت ریپو کی جڑ جیسی ہو (جڑ میں کھولتے ہی فائلیں اپنی جگہ) + اردو README |
| **ٹیسٹ** | ہر تبدیلی کے بعد متعلقہ ٹیسٹ چلائیں (نیچے طریقہ) |
| **پش** | صارف خود گٹ ہب پر پش کرتا ہے۔ **کبھی credentials نہ مانگیں** |

---

# 1. موجودہ ساخت

```
index.html                 صرف ڈھانچہ — ایک سطر بھی چلتا کوڈ نہیں
service-worker.js          آف لائن کیش (اس وقت bhc-clinic-v135 — ہر تبدیلی پر بڑھائیں)
data/*.json                تشخیص · علاج · نالج کا مواد (v94 میں کوڈ سے نکالا)
js/00-data-boot.js         مواد کا لوڈر — سب سے پہلے چلتا ہے
js/01 … js/16              ایپ کے حصے
js/repertory/              ریپرٹری — 10 فائلیں + LOAD_ORDER.txt
js/differentiation/        تفریق / نکاسی — 8 فائلیں + LOAD_ORDER.txt
css/                       14 فائلیں، ترتیب سے
ur/                        اردو ترجمہ (نیچے تفصیل)
tools/                     اوزار (ترجمہ، جانچ، ڈیٹا بلڈ، اسکرین پارسر)
tests/                     23 فائلیں
```

## اہم عالمی نام
`repClipboards` · `repActiveClip` · `repCurrentBook` · `window._repAnaLast` (آخری تجزیہ) ·
`SYMPTOMS_DB` `DISEASES_DB` `CATEGORIES_DB` `ADX_KNOWLEDGE` `STUDIO_SYS` `TREATMENT_LIB` `TREATMENT_MORE` (سب `data/*.json` سے)

---

# 2. ٹیسٹ کیسے چلائیں

```bash
npm install jsdom                              # صرف ایک بار
export JSDOM_PATH=$PWD/node_modules/jsdom
node tests/data_separation_v94.test.js
node tests/rep_case_v95.test.js
node tests/differentiation.jsdom.test.js
node tests/layout_split_v78.test.js
node tests/rubric_ur_v101.test.js              # اردو جملہ (پرانا لیبل نظام)
node tests/rubrics_ur_v107.test.js             # 🌳 ربرک-سطح کا اردو (v107)
node tests/tree_view_integrity.jsdom.test.js   # ٹری — 71,027 ربرک
# … باقی tests/ میں
# پوری ایپ کا smoke: python3 -m http.server 8080 &  ;  node tests/app_smoke.jsdom.test.js
```

> ⚠ کچھ ٹیسٹ بڑی JSON (kent_repertory.json, mm/) مانگتے ہیں۔ اگر مقامی نقل ادھوری ہو تو وہ ENOENT دیں گے — یہ کوڈ کی خرابی نہیں۔

---

# 3. v83 سے v96 تک کیا ہوا

| ورژن | کام |
|---|---|
| v83 | میٹیریا میڈیکا کے جملے ادھورے کٹنے کی اصلاح (اوسط 40 → 99 حروف) |
| v83 | `08b-rep-differentiation.js` → `js/differentiation/` کی 8 فائلیں (حرف بہ حرف تصدیق شدہ) |
| v84 | «کتابوں کی گواہی»: 56 MB خودکار ڈاؤن لوڈ ختم → کتاب منتخب کریں + «دوبارہ کوشش» |
| v85–87 | تفریق **ٹیب** بن گئی (پاپ اپ نہیں)؛ کلپ بورڈ دونوں ٹیبوں پر |
| v88 | تقابل کی میز میں `G` کالم کا کٹنا ختم |
| v89 | خودکار مسودے میں مکرر مضمون ختم (جیکارڈ 0.55 / شمولیت 0.80) |
| v90 | مترادفات **خودکار نہیں** — صرف «＋» تجاویز + «کس لفظ سے ملی» |
| v91–92 | ہیڈر سمٹا (315 → 115 px)؛ ▸ سے دواؤں کا ذخیرہ؛ خلاصہ اکارڈین |
| v93 | **7 ٹوٹے ٹیسٹ بحال**؛ `index.html` سے کھلا کوڈ اور `switchDxView` پیچ ختم |
| v94 | **مواد کوڈ سے الگ** → `data/*.json`؛ 5 مردہ CSS قاعدے ہٹے |
| v95 | **📋 ریپرٹری کیس ↔ مریض کی وزٹ**؛ `exportForGitHub` اب `diagnosis.json` بناتا ہے |
| **v101** | **اردو ترجمہ: لغت + بیچ 1** (نیچے تفصیل) |
| v102–v106 | لیبل بیچ 2–6، «(See …)» حوالوں کے لنک (`repXrefHtml`)، سیاق (`ctx`) ترجمے، `rep-tree.js` کی اردو صف — (اُس وقت اس میز میں درج نہیں ہوئے تھے؛ تفصیل §4) |
| **v107** | **🌳 ربرک کی سطح کا اردو جملہ** — نئی پرت `ur/rubrics/<book>/<chapter>.json` + `js/18-rubrics-ur.js`، بٹن «پورا مطلب ⇄ صرف اضافہ»، MIND پائلٹ 708 ربرک (§4.11) |
| **v108** | بیچ 8: MIND کے مزید 714 ربرک (CONSCIENTIOUS … DELUSIONS «insane») → **1,422 / 4,834**؛ **ہندسے 1 2 3** ہر ترجمے میں (لیبل فائل، لغت، ربرک فائل)؛ `REP_RUBUR_V` (ربرک فائلوں کا اپنا ورژن) |
| **v109** | بیچ 9: MIND کے مزید 683 ربرک (DELUSIONS «insects» … ESTRANGED) → **2,105 / 4,834**؛ ڈاکٹر کے تین فیصلے طے (وہم · اوقات · جنس کینٹ کے مطابق) |
| **v110** | بیچ 10: MIND کے آخری 2,729 ربرک (EXCITEMENT … WRONG) → **MIND مکمل 4,834 / 4,834**؛ بنیاد کی «مائل» شکل (`repRubUrObl`: «لکھنا»→«لکھنے»)؛ QA ⚠ = 0 |
| **v111** | بیچ 11: **VERTIGO مکمل 567 / 567** (`ur/rubrics/kent/vertigo.json`)؛ **باب کی جڑ** (`meta.root` = «چکر — »): `merge --root`، ایپ اور QA میں جڑ سب سے باہر کی بنیاد؛ SW میں vertigo.json |
| **v112** | بیچ 12: **HEAD — PAIN کے سوا سب 2,249 / 6,921** (`ur/rubrics/kent/head.json`، جڑ «سر — »)؛ باقی صرف `HEAD › PAIN` کے 4,672 ربرک (قطار 1457–6128) |
| **v113** | بیچ 13: **HEAD › PAIN کی عمومی شرطیں 799** (وقت، موسم، کھانا، حرکت، نیند …) → HEAD 3,048 / 6,921؛ باقی PAIN کی قسمیں اور مقام 3,873 |
| **v114** | بیچ 14: **HEAD › PAIN کے مقام 993** (ماتھا، گدی، پہلو، کنپٹیاں، چوٹی) → HEAD 4,041 / 6,921؛ باقی صرف درد کی قسمیں 2,880 |
| **v115** | بیچ 15: **HEAD › PAIN کی قسمیں 2,880 → HEAD مکمل 6,921 / 6,921**؛ 1,876 قطاریں «ترجمہ یادداشت» (اپنی ہی عبارتوں کے ٹکڑے) سے خودکار جوڑی گئیں (`BATCH_15_REVIEW.md` میں ⚙)، 1,004 ہاتھ سے |
| **v116** | بیچ 16: **EYE مکمل 1,804 / 1,804** (`ur/rubrics/kent/eye.json`، جڑ «آنکھ — »)؛ درد کے 430 ⚙ خودکار، باقی ہاتھ سے؛ SW میں eye.json |
| **v117** | بیچ 17: **VISION مکمل 885 / 885** (`ur/rubrics/kent/vision.json`، جڑ «نظر — »)، سب ہاتھ سے؛ SW میں vision.json |
| **v118** | بیچ 18: **EAR مکمل 2,015 / 2,015** (جڑ «کان — »؛ 681 ⚙ خودکار)؛ **صفائی:** نظرثانی کی فائلیں اب `tools/review_rubrics_ur.js` سے بنتی ہیں (`ur/review/`، `.gitignore` میں — گٹ ہب پر ضروری نہیں)؛ فی ورژن README ختم → ایک `README_UR.md`؛ json کی `meta.auto` میں ⚙ کلیدیں |
| **v119** | بیچ 19: **HEARING مکمل 158** (جڑ «سماعت — ») + **NOSE مکمل 1,514** (جڑ «ناک — »؛ درد کے 223 ⚙) |
| **v120** | بیچ 20: **FACE مکمل 2,098 / 2,098** (جڑ «چہرہ — ») — بیچ 1–7 سب ہاتھ سے (`face_batch1..7.tsv`)؛ ⚠ = 0؛ نئی `tools/tm_rubrics_ur.js` (ترجمہ یادداشت — پہلے ابواب کے ٹکڑوں سے خودکار تجویز، فی الحال رہنمائی کے لیے) |
| **v121** | بیچ 21: **MOUTH مکمل 1,643 / 1,643** (جڑ «منہ — ») — بیچ 1–6 سب ہاتھ سے (`mouth_batch1..6.tsv`)؛ ⚠ = 0 |
| **v122** | بیچ 22: **TEETH مکمل 861 / 861** (جڑ «دانت — ») — بیچ 1–4 سب ہاتھ سے (`teeth_batch1..4.tsv`)؛ ⚠ = 0۔ نیز **MOUTH کی پچھلے ابواب سے ہم آہنگی** (203 قطاریں؛ ماخذ `mouth_final.tsv`) |
| **v123** | بیچ 23: **THROAT مکمل 1,049 / 1,049** (جڑ «گلا — ») — بیچ 1–5 سب ہاتھ سے (`throat_batch1..5.tsv`)؛ ⚠ = 0۔ ہم آہنگی: 20 قطاریں پچھلے ابواب کے مطابق (چکتے، سکڑاؤ، چھل جانا، باہری چیز، چیونٹیاں رینگنے کا احساس، لعابی چتیاں) |
| **v124** | بیچ 24: **EXTERNAL THROAT مکمل 255 / 255** (جڑ «بیرونی گلا — ») — ایک ہی بیچ میں (`extthroat_batch1.tsv`)؛ ⚠ = 0۔ **ابواب کی باہمی ہم آہنگی مکمل:** چہرہ+سر+آنکھ+کان+ناک کی 56 قطاریں (vesicles «آبلے»، pustules «پیپ والے دانے»، «کھرنڈ دار»، «گلٹیاں»، «خشکی، ہونٹوں پر/ناک پر»، «کیل مہاسے» وغیرہ) |
| **v125** | بیچ 25: **STOMACH مکمل 3,213 / 3,213** (جڑ «معدہ — ») — بیچ 1–10 سب ہاتھ سے (`stomach_batch1..10.tsv`؛ 400+300+350+310+340+320+320+320+320+233)؛ ⚠ = 0۔ **ہم آہنگی:** 50 قطاریں پچھلے ابواب کے مطابق (cancer «سرطان (کینسر)»، ulcers «ناسور (زخم)»، quivering «پھڑپھڑاہٹ (لرزنا)»، trembling «لرزنا» 16، sinking «دھنسنا» 23، HÆMORRHAGE «خون کا بہاؤ (معدے سے)»، OPEN «کھلا ہوا»، درد darting «تیر جیسا» / shooting «دوڑتا ہوا»)۔ کینٹ کل **27,817 / 71,027 (39.2%)** |
| **v126** | بیچ 26: **ABDOMEN مکمل 3,592 / 3,592** (جڑ «پیٹ — ») — بیچ 1–10 سب ہاتھ سے (`abdomen_batch1..10.tsv`؛ 400+360+360+360+360+360+360+360+360+312)؛ ⚠ = 0۔ **ہم آہنگی:** 10 قطاریں (painful «دردناک» 4، double-up/«چلنے سے»، «بایاں حصہ» 2، «بواسیر کا خون بند ہو جانے سے»، «ناف کا علاقہ»، «کولھے کی طرف» — iliac region کی transliteration ہٹائی)؛ باب کے 135 سیکشن-نام پچھلے 14 ابواب سے موازنہ کیے (TEETH «ناسور (زخم)»، SHOCKS «جھٹکے»، TENSION «تناؤ»، PULSATION «دھڑکن»، PERSPIRATION «پسینہ»، RE/.. «گڑگڑاہٹ»/«کھڑکھڑاہٹ»، SWASHING «پانی کے ہلنے کی آواز (غرارہ)» وغیرہ)۔ کینٹ کل **31,409 / 71,027 (44.2%)** |
| **v127** | بیچ 27: **چھوٹے ابواب ایک ساتھ — STOOL 256** (جڑ «پاخانہ — ») · **BLADDER 781** (جڑ «مثانہ — ») · **KIDNEYS 264** (جڑ «گردے — ») · **PROSTATE GLAND 101** (جڑ «پروسٹیٹ غدود — ») — چاروں 100% ہاتھ سے (`stool_batch1.tsv` · `bladder_batch1..2.tsv` · `kidneys_batch1.tsv` · `prostate_batch1.tsv`)؛ ⚠ = 0۔ باہمی ہم آہنگی: acrid/constriction/اینٹھن/بڑھوتری/induration «سختی»/catarrh «نزلہ (کیٹار)»/ulceration «ناسور (زخم)»/stone «پتھر»/sore tender «چھونے پر دردناک» وغیرہ۔ کینٹ کل **32,811 / 71,027 (46.2%)**۔ ⚠ سبق: بیچ TSV میں ہر مکمل جملے سے پہلے `=` لازمی — ورنہ merge اوزار والد سے جوڑ کر جملہ دگنا کر دیتا ہے (v127 میں پکڑا اور درست کیا) |
| **v128** | بیچ 28: **تین ابواب ایک ساتھ — RECTUM 1,332** (جڑ «مقعد — ») · **URETHRA 611** (جڑ «پیشاب کی نالی — ») · **URINE 408** (جڑ «پیشاب — ») — سب ہاتھ سے (`rectum_batch1..3.tsv` · `urethra_batch1..2.tsv` · `urine_batch1..2.tsv`)؛ ⚠ = 0۔ **خود جانچ (v122 کا قاعدہ):** نئے ابواب کا پرانے 19 ابواب سے خودکار موازنہ (بالکل مماثل کلیدیں + ہر ٹکڑا) → 128 قطاریں درست کیں (`rectum_batchfix.tsv` 40 · `urethra_batchfix.tsv` 58 · `urethra_batchfix2.tsv` 4 · `urine_batchfix.tsv` 26): وقت «صبح 7 بجے» (فاصلہ نہیں)، griping «مروڑتے ہوئے»، sticking «گڑتا ہوا»، biting «کاٹتا ہوا»، scraping «کھرچتا ہوا»، tumor «رسولی»، spasm «اینٹھن»، irritation «خراش (چڑچڑاہٹ)»، hardness/induration «سختی»، scanty «تھوڑا»، gelatinous «جیلی جیسی»، «پیشاب کے آخر میں»، fistula «ناسور (فسچولا)»، condylomata «مسے (کنڈائلوما)»، cancer «سرطان (کینسر)»، itching+burning «جلتی ہوئی»۔ کینٹ کل **35,162 / 71,027 (49.5%)** — 22 ابواب |
| **v129** | بیچ 29: **GENITALIA MALE مکمل 1,118 / 1,118** (جڑ «تناسلی اعضاء (مرد) — ») — بیچ 1–3 سب ہاتھ سے (`genitalia_male_batch1..3.tsv`؛ 400 + 400 + 318) + `genitalia_male_batchfix.tsv` (67 اصلاح)؛ ⚠ = 0۔ اصطلاحات: spermatic cord «نالی (سپرمیٹک کورڈ)» · testes «خصیے» · scrotum «خصیوں کی تھیلی» · glans «عضو تناسل کا سرا» · prepuce «سرے کی جلد» · fraenum «لگام (فرینم)» · erections «عضو کی سختی (انتشار)» · seminal emissions «احتلام (رات کا اخراج)» · masturbation «مشت زنی» · hydrocele «خصیوں میں پانی کا جمع ہونا (ہائیڈروسِیل)» · phimosis «سرے کی جلد کا تنگ ہونا (فیموسِس)» · varicocele «خصیے کی رگوں کی سوجن (وَیریکوسیل)» · HANDLES «تناسلی اعضاء کو ہاتھ لگانا» (کینٹ کا مطلب، حوالہ سے تصدیق شدہ)۔ **ہم آہنگی:** 67 قطاریں پرانے 22 ابواب کے مطابق (bubbling «بلبلے اٹھنے کا احساس»، crawling «رینگنے کا احساس»، relaxed «ڈھیلا ہوا»، shrivelled «سکڑا ہوا»، enlarged «بڑھا ہوا»، motion «حرکت»، eruptions urticaria «پِتّی»/crusts «کھرنڈ»/rash «ریش»/moist «نم»، cramping «اینٹھن والا»، «پیشاب کے بعد» (کاما کے بغیر)، ulcers burning «جلتے ہوئے»)۔ کینٹ کل **36,280 / 71,027 (51.1%)** — 23 ابواب |
| **v130** | **ترتیب کی درستی (کوئی ترجمہ نہیں بدلا):** کینٹ کے ربرک اب **کتاب کی اصل ترتیب** پر دکھتے ہیں۔ وجہ: `kent_chapters/*.json` کی فائل ترتیب کتاب کی نہیں تھی (پرانا merge سکرپٹ ہر سطح کو «سب سے چھوٹا OOREP id» ملا کر چنتا تھا)؛ مگر کتاب کی ترتیب پرانے `r…` id میں محفوظ تھی۔ حل: `js/repertory/rep-chapters.js` میں `_repSortTreeKentOrder` — پرانے ربرک اپنے r-نمبر پر، نئے (o/m) کینٹ کے پروٹوکول پر (کینٹ کا پیش لفظ: عام ربرک → **وقت** → **شرائط** → **محل** → **پھیلاؤ سب سے آخر**)۔ **تصدیق:** صارف کی PDF (کینٹ) سے ERECTIONS بلاک صفحہ 1497–1501 کی 63 سطروں میں 62 حرف بحرف · rectum صفحہ 1308 کا آغاز · COLDNESS/CONDYLOMATA (صفحہ 1495–96) کا r-id سے میل۔ **اثر:** 7,831 گروپوں میں 4,077 (52.1%) کی ترتیب درست؛ قطاریں جوں کی توں **71,027** (کوئی ربرک کم/زیادہ نہیں)۔ **bump:** `index.html` `rep-chapters.js?v=130` · `CACHE_NAME=bhc-clinic-v130` · ٹیسٹ F1–F7 شامل |
| **v131** | **مین ربرک (جڑ) اب کتاب کی طرح حروفِ تہجی سے (والد صارف کا حکم):** rectum کا `ASH-COLORED (See Gray)` — جو اصل میں **STOOL** کا مین ربرک ہے (کتاب صفحہ 1372 / PDF1406) اور `(See Gray)` کراس ریفرنس رکھتا ہے — پہلے باب کے آخری سرے پر پڑا تھا، اب **#2** پر (`ABSCESS · APHTHOUS condition of anus · ASH-COLORED · BALL in rectum, sensation of · BLACK`)، اور اِسی طرح ہر باب کے وہ تمام ربرک اپنی حروفِ تہجی والی جگہ پر آ گئے۔ **کس طرح:** `_repKentRootKey` — کلید کے تین درجے: `[0]` «… in general» سب سے اوپر (مگر صرف جب وہ کتاب میں اُسی باب کا **پہلا** ربرک ہو: CHILL کا `COLDNESS in general` صفحہ 2770 · FEVER کا `HEAT in general` صفحہ 2803؛ ورنہ GENERALITIES کا `SWELLING in general` اپنی حروفِ تہجی والی جگہ `SWELLING` کے بعد) · `[1]` وقت کا بلاک (جہاں کتاب نے وقت مقدم کیا) · `[2]` باقی حروفِ تہجی (`(See …)` کلید سے خارج، `Æ→AE`، ہائفن پہلے حذف تاکہ `READING < RE-ECHO < RINGING` — کتاب PDF1771)۔ **تصدیق (کتاب PDF):** KIDNEYS PDF1460 (`ABSCESS … HEAT · HEAVINESS · INFLAMMATION`) · BACK PDF1953 (`BOILS · BROWN · BROWN spots on · BRUISES`) · GENERALITIES PDF2946 (`DAYTIME` پہلا) · COUGH PDF1721 (`DAYTIME → … → NIGHT` پھر `ACIDS agg. · ACRID … · AIR`) · RECTUM PDF1343 · STOOL PDF1407 · CHILL PDF2804 · FEVER PDF2838 · 18 ابواب کی مکمل مطابقت۔ **گنتی:** 37 ابواب · قطاریں **71,027 ±0** · مین ربرک **4,709 ±0** · اِن میں سے **2,652 جڑیں** اپنی حروفِ تہجی والی جگہ پر آئیں · کوئی ترجمہ/کلید نہیں چھیڑی گئی۔ **طریقہ کار کی فائل (قائم شدہ):** `js/repertory/KENT_ORDER_METHOD.md` (کینٹ ریپرٹری کے کوڈ کے ساتھ منسلک — اصول، حوالے، گنتی، ورک فلو) · رپورٹ `ur/review/kent_order_fix_v131.md`۔ **bump:** `index.html` `rep-chapters.js?v=131` · `CACHE_NAME=bhc-clinic-v131` · ٹیسٹ F1–F7 + نئے **G1–G7** (ALL PASS)۔ |
| **v132** | بیچ 30: **GENITALIA FEMALE مکمل 1,471 / 1,471** (جڑ «تناسلی اعضاء (عورت) — ») — بیچ 1–4 سب ہاتھ سے (`genitalia_female_batch1..4.tsv`؛ 400 + 400 + 400 + 271)؛ ⚠ = 0۔ **خود جانچ (v122 کا قاعدہ — 23 مکمل ابواب سے موازنہ):** 144 قطاریں درست کیں: **(الف)** 75 قطاروں میں «سے بڑھے / پر بڑھے / سے بڑھیں» → «سے بگاڑ» (پچھلے ابواب کا اسلوب: abdomen «اٹھنے سے بگاڑ»، bladder «کھڑے ہونے سے بگاڑ» …) اور «کھینچتا ہوا درد» جیسی تکرار ہٹائی؛ **(ب)** 68 قطاروں کی اصطلاحات: numbness «بے حسی» → **«سن ہونا»** (abdomen/bladder/ear کے مطابق؛ INSENSIBILITY «بے حسی» ہی رہا) · swollen «پھولا ہوا» → **«سوجن»** (bladder/eye) · fullness «بھرا پن» → **«بھراؤ (بھرا بھرا لگنا)»** (abdomen) · nodules «گٹھلیاں» → **«گلٹیاں»** (genitalia_male) · tubercles «گلٹیاں» → **«گلٹیاں (گٹھلیاں)»** (ear «گلٹی») · gangrene «گل جانا» → **«گلنا (گینگرین)»** (abdomen/bladder/face) · prolapsus «اتر جانا» → **«اترنا»** (rectum «مقعد کا اترنا»)؛ **(ج)** 1 قطار «SENSITIVE, vagina» سے بےجا اضافہ ہٹایا۔ **نئی اصطلاحات:** physometra «رحم میں ہوا کا جمع ہونا» · placenta retained «جفت (نال) باہر نہ نکلنا» · subinvolution «زچگی کے بعد رحم کا سکڑ کر واپس نہ آنا» · sterility «بانجھ پن» · vaginismus «اندرونی راستے کا تشنج (وجائنیزم)» · serous cysts «اندرونی راستے میں پانی بھری تھیلیاں (سسٹ)» · clitoris «عضو تناسل کی چوٹی (کلیٹورس)» · pubes «پیوبس (ناف کے نیچے کے ابھار)»۔ کینٹ کل **37,751 / 71,027 (53.2%)** — 24 ابواب۔ **bump:** `index.html` `js/18-rubrics-ur.js?v=132` · `js/18-rubrics-ur.js` میں `REP_RUBUR_V='132'` · `CACHE_NAME=bhc-clinic-v132` · SW میں `genitalia_female.json` · ٹیسٹ **F8–F11** شامل (ALL PASS)۔ |

| **v133** | بیچ 31: **چار ابواب ایک ساتھ — LARYNX AND TRACHEA 738** (جڑ «حلقوم — ») · **RESPIRATION 761** (جڑ «سانس — ») · **EXPECTORATION 379** (جڑ «بلغم — ») · **COUGH 1,690** (جڑ «کھانسی — ») — سب ہاتھ سے (`larynx_and_trachea_batch1.tsv` · `respiration_batch1.tsv` · `expectoration_batch1.tsv` · `cough_batch1.tsv`؛ 380+358 · 400+361 · 379 · 430+470+450+340)؛ ⚠ = 0۔ **ترتیب (کتاب PDF سے تصدیق شدہ):** COUGH `DAYTIME → MORNING → FORENOON → NOON → AFTERNOON → EVENING → NIGHT` پھر حروفِ تہجی (`ACIDS agg. · ACRID … · AIR · ALCOHOL`) — PDF1720–21؛ EXPECTORATION `MORNING … NIGHT` پھر `ACRID · AIR · AIR agg. · ALBUMINOUS … ASH-COLORED spots · BALL`۔ **خود جانچ (نیا آلہ):** merge سے پہلے **والد-آخری-لفظ / بچے-پہلے-لفظ** کا خودکار اسکین → 17 جگہیں درست کیں («صبح، صبح سویرے» → «صبح، سویرے»؛ «نیند، نیند کے دوران» → «نیند، کے دوران»؛ «کروٹ، کروٹ لیٹنے سے آرام» → «کروٹ، لیٹنے سے آرام»؛ «ٹھنڈی، ٹھنڈی ہوا میں» → «ٹھنڈی، ہوا میں» وغیرہ)۔ **اصطلاحات:** larynx «حلقوم» · trachea «سانس کی نالی» · vocal cords «آواز کی ڈوریاں (ووکل کورڈز)» · epiglottis «کنٹھ (ایپیگلوٹس)» · glottis «گلٹس» · croup «خناق (کروپ)» · coryza «زکام» · hawking «کھنکارنا» · hemming «ہم ہم کرنا (گلا صاف کرنا)» · hoarseness «آواز بیٹھنا» · husky «بھاری اور کھردری (ہسکی)» · crumb «چورا (روٹی کا ذرہ)» · plug «پلگ (رکاوٹ)» · stertorous «خرخراہٹ بھرا» · stridulous «سیٹی دار (سٹریڈولس)» · gasping «ہانپنا (دم بھرنا)» · asphyxia «دم گھٹنا» · viscid «چپچپا» · tenacious «لزج» · gelatinous «جیلی جیسی» · glairy «انڈے کی سفیدی جیسی» · ropy «رسی جیسا» · rusty «زنگ آلود» · whooping «کالی کھانسی» · minute guns «منٹ گن (توپ)» · scarlatina «سرخن (سرخ بخار)»۔ کینٹ کل **41,319 / 71,027 (58.2%)** — **28 ابواب**۔ **bump:** `index.html` `js/18-rubrics-ur.js?v=133` · `REP_RUBUR_V='133'` · `CACHE_NAME=bhc-clinic-v133` · SW میں چاروں نئی json · ٹیسٹ **H1–H12** شامل (ALL PASS؛ v101 بھی ALL PASS)۔ |
| **v134** | بیچ 32: **CHEST (سینہ) مکمل 3,433 / 3,433** (جڑ «سینہ — »؛ **174 مین ربرک** — `ABSCESS` پہلا · `WINE` آخری) — نو بیچ سب ہاتھ سے (`chest_b1..b9_ur.py` → `ur/rubrics/kent/chest_batch1.tsv`)؛ ⚠ = 0۔ **ترتیب (کتاب PDF سے مطابق):** مین ربرک حروفِ تہجی میں (`ABSCESS → ADHESION → AFFECTIONS of → AFFECTIONS of the cartilages → AIR` … `WARTS on · WATER · WEAKNESS · WEIGHT · WHIRLING · WINE`)؛ `PAIN` کی اقسام بھی کتاب کے مطابق (`burning → bursting → clawing → crampy → cutting (sudden sharp pain) → digging → drawing → gnawing → griping → …`)۔ **خود جانچ (v134):** merge سے پہلے depth-stack کا **والد-آخری-لفظ / بچے-پہلے-لفظ** اسکین — 6 بےجا تکرار درست کیں («رات، رات 11 بجے، لیٹنے کے بعد» → «رات، 11 بجے، لیٹنے کے بعد»؛ «رات، رات 4 بجے» → «رات، 4 بجے»؛ «پستان میں، میں» → «پستان میں، …»؛ «دائیں، دائیں پھیپھڑے کی چوٹی میں» → «دائیں، پھیپھڑے کی چوٹی میں»؛ «حیض، حیض کے دوران» → «حیض، کے دوران»؛ «حیض، حیض کے بجائے» → «حیض، کے بجائے»)۔ **«(See …)» اسلوب کی اصلاح (ادھورا کام پورا):** قائم قاعدہ = قوسین شدہ See-text **مکمل حذف** (ترجمہ نہیں) — chest کے 27 جملوں اور **v133 کھانسی کے 66 جملوں** سے `(… دیکھیں)` ہٹایا: `cgh_b1..b4_ur.py` میں 25+5+15+21 = 66 strip → `mkbatch` دوبارہ → `cough.json` دوبارہ مرج («نئے: 0 · بدلے: 74 · ویسے ہی: 1,616»؛ 1,690/1,690 · 0/0/0)۔ **نئی اصطلاحات:** mammae «پستان» · nipple «نپل» · axilla «بغل» · sternum «سینے کی ہڈی» · clavicle «ہنسلی» · diaphragm «حجابِ حائل (ڈایفرام)» · emphysema «پھیپھڑوں میں ہوا بھر جانا» · empyema «سینے میں پیپ بھرنا» · hepatization «جگر جیسا ہو جانا» · petechiae «جسم پر سرخ دھبے (پیٹیشی)» · phthisis pulmonalis «پھیپھڑوں کی ٹی بی (دق)» · purring «بلی جیسی گھرگھراہٹ» · rattling «کھڑکھڑاہٹ» · stenosis/stenocardia «انجائنا پیکٹورس» · aorta «شاہ رگ (ایورٹا)» · plug «جیسے پلگ ہو»۔ کینٹ کل **44,752 / 71,027 (63.0%)** — **29 ابواب**۔ **bump:** `index.html` `js/18-rubrics-ur.js?v=134` · `REP_RUBUR_V='134'` · `CACHE_NAME=bhc-clinic-v134` · SW میں `chest.json` · ٹیسٹ **I1–I6** شامل + H11/H12 اپ ڈیٹ (v107: **122 PASS / ALL PASS** · v101: **ALL v105 CHECKS PASSED**)۔ |
| **v135** | بیچ 33: **BACK (پیٹھ) مکمل 3,888 / 3,888** (جڑ «پیٹھ — »؛ **87 مین ربرک** — `ABSCESS` پہلا · `AIR` · `ASLEEP` · … · `WEAKNESS` · `WIND` آخری) — تیرہ بیچ سب ہاتھ سے (`back_b1..b13_ur.py` → `ur/rubrics/kent/back_batch1.tsv`)؛ ⚠ = 0۔ **ترتیب (کتاب PDF1952 سے مطابق):** مین ربرک حروفِ تہجی میں (`ABSCESS → AIR → ASLEEP → BAR → BIFIDA → BLOOD → BLUISH → BOILS → BROWN → BROWN spots on → BRUISES … STIFFNESS → STRAINING → SWELLING → TENSION → TINGLING → TREMBLING → TUBERCLES → TUMORS → TWITCHING → ULCERS → WARM → WARTS → WAVE → WEAKNESS → WIND`)؛ `PAIN` کی اقسام بھی کتاب کے مطابق (`aching → boring → break → broken → bruised → burning → … → pressing → sore → sprained → standing → stepping → stitching → stool → stooping → tearing`) اور **پھیلاؤ (extending) آخری**۔ **خود جانچ (سبق v134 سے آگے):** یہاں تکرار **دو طرح** کا تھا — (۱) بچہ والد کا **آخری** لفظ دہراتا تھا، (۲) بچہ والد کا **پورا آخری ٹکڑا** دہراتا تھا («…، پیٹھ کا اوپری حصہ، کندھے کی ہڈیاں، پیٹھ کا اوپری حصہ، کندھے کی ہڈیاں، درمیان»)۔ دونوں کا خودکار اسکین (parent-label tail ⇄ child prefix) لگا کر **509 جگہیں** درست کیں؛ دو قطاریں (947 · 950) ہاتھ سے؛ بیچ 10 کا ایک **سرکا ہوا نمبر** (2818 ↔ 2820) پکڑ کر درست کیا؛ پھر **final `back.json` پر دوبارہ اسکین = 0** («دیکھیں» 0 · انگریزی حرف 0 · اردو ہندسے 0)۔ **نئی اصطلاحات:** sacrum «تعلق کی ہڈی» · coccyx «دم کی ہڈی» · vertebra «مہرہ/مہرے» · scapula «کندھے کی ہڈی» · nape «گردن کے پچھلے حصے» · nates «سُرین» · sciatics «عرق النسا» · flatus «ریاح» · erysipelas «سرخ بادہ (ایریسیپلس)» · formication «چیونٹیاں رینگنے کا احساس» · bifida «ریڑھ کے مہروں کا کھلا رہ جانا (بائفڈا)» · emprosthotonos/opisthotonos «پیٹھ کی طرف اکڑ جانا» · bar «سلاخ» · twitching «پھڑکن» · tingling «جھنجھناہٹ (سنسناہٹ)» · prickling «چبھن (سوئی جیسی)» · polypus «پولیپ» · sarcoma «سارکوما» · fistulae «نالیاں (فِسچولا)» · emaciation «دبلا ہونا» · hot sponge «گرم اسفنج» · riding in a carriage «بگھی میں سفر»۔ کینٹ کل **48,640 / 71,027 (68.5%)** — **30 ابواب**۔ **bump:** `index.html` `js/18-rubrics-ur.js?v=135` · `REP_RUBUR_V='135'` · `CACHE_NAME=bhc-clinic-v135` · SW میں `back.json` · ٹیسٹ **J1–J7** شامل + H11/H12 اپ ڈیٹ (v107: **129 PASS / ALL PASS** · v101: **ALL v105 CHECKS PASSED**)۔ |
### حذف شدہ (تصدیق شدہ 404)
`js/08b-rep-differentiation.js` · `diagnosis-data.js` · `advanced-diagnosis-knowledge.js` ·
`js/10-treatment-data.js` · `js/12-treatment-more.js` · `js/differentiation/README_URDU.md`

---

# 4. 🔤 اردو ترجمہ — مکمل ہدایات (v96)

## 4.1 نظام کیسے کام کرتا ہے

ترجمہ **پورے ربرک کا نہیں، ٹری کی ایک سطح کے لیبل کا** ہوتا ہے:

```
ur/rubric_labels_ur.json  →  { "labels": { "eating, after": "کھانے کے بعد", … } }
```

پورا ربرک انہی ٹکڑوں کو جوڑ کر بنتا ہے۔ **اسی لیے ایک ٹکڑا ہزاروں ربرکس میں کام آتا ہے۔**

## 4.2 طے شدہ اصول (صارف کی منظوری کے ساتھ)

1. **ایک انگریزی اصطلاح = ہمیشہ ایک ہی اردو۔** کبھی تنوع نہیں
2. **سادہ اردو** — کتابی نہیں۔ (`anxiety` = بے چینی، نہ کہ اضطراب)
3. **کینٹ کی ساخت محفوظ** — `walking, while` = «چلتے ہوئے»، الٹ کر جملہ نہ بنائیں
4. **انگریزی ساتھ دکھائی جائے گی**
5. **محاورہ/مریض کی زبان لیبل میں نہیں** — وہ آگے چل کر تلاش کے مترادفات میں جائے گی
6. **شک ہو تو خالی چھوڑیں**، اندازہ نہ لگائیں۔ غلط ترجمہ غائب ترجمے سے بدتر ہے
7. **جہاں کینٹ خود دو الگ ربرک بناتا ہے، وہاں ترجمہ بھی الگ** — مثلاً
   `starting` = چونک اٹھنا (ذہن) مگر `starting (see jerking)` = جھٹکے لگنا (اعضا)
8. درد کی تشبیہ ہمیشہ «… جیسا» (کاٹنے جیسا، چٹکی جیسا)

## 4.3 فائلیں

> **📁 فائلیں بڑھتی نہیں:** ہر بیچ **انہی دو فائلوں** کو تازہ کرتا ہے —
> `ur/rubric_labels_ur.json` (ایپ یہی پڑھتی ہے) اور `ur/glossary_core_v1.json`۔
> صرف `BATCH_n_REVIEW.md` جمع ہوتی ہیں؛ نظرثانی کے بعد انہیں `docs/` میں منتقل یا حذف کیا جا سکتا ہے۔

| فائل | کیا |
|---|---|
| `ur/glossary_core_v1.json` | **بنیادی لغت** — 664 اصطلاحات + نوٹس + aliases |
| `ur/rubric_labels_ur.json` | **اصل لیبل فائل** جو ایپ پڑھتی ہے — 864 لیبل |
| `ur/GLOSSARY_REVIEW_v2.md` | ڈاکٹر کی نظرثانی والی دستاویز |
| `ur/BATCH_1_REVIEW.md` | بیچ 1 کے 400 لیبل |
| `ur/BATCH_2_REVIEW.md` | بیچ 2 کے 800 لیبل |
| `ur/BATCH_3_REVIEW.md` | بیچ 3 کے 1500 لیبل |
| `ur/BATCH_4_REVIEW.md` | بیچ 4 کے حل شدہ 1706 لیبل |
| ~~`ur/BATCH_5_REVIEW.md`~~ | بیچ 5/6 (لیبل) کی الگ فائل **نہیں بنی تھی** — براہِ راست ضم ہوئے |
| **`ur/rubrics/kent/mind.json`** | **ربرک کی سطح کے جملے** (MIND مکمل، 4,834)؛ صرف `tools/merge_rubrics_ur.js` سے لکھیں |
| **`ur/rubrics/kent/vertigo.json`** | VERTIGO مکمل 567 — `meta.root` «چکر — » (ہر جملہ اسی سے شروع)؛ ماخذ `vertigo_batch1.tsv` |
| **`ur/rubrics/kent/head.json`** | **HEAD مکمل 6,921** — جڑ «سر — »؛ ماخذ `head_batch1..4.tsv` (ترتیب سے ضم کریں) |
| **`ur/rubrics/kent/eye.json`** | **EYE مکمل 1,804** — جڑ «آنکھ — »؛ ماخذ `eye_batch1.tsv` |
| **`ur/rubrics/kent/vision.json`** | **VISION مکمل 885** — جڑ «نظر — »؛ ماخذ `vision_batch1.tsv` |
| **`ur/rubrics/kent/ear.json`** | **EAR مکمل 2,015** — جڑ «کان — »؛ ماخذ `ear_batch1.tsv` (NOISES/PAIN کے سوا) + `ear_batch2.tsv` |
| **`ur/rubrics/kent/hearing.json`** · **`nose.json`** | HEARING 158 (جڑ «سماعت — »)، NOSE 1,514 (جڑ «ناک — »)؛ ماخذ `hearing_batch1.tsv`، `nose_batch1.tsv` + `nose_batch2.tsv` |
| **`ur/rubrics/kent/face.json`** | **FACE مکمل 2,098** — جڑ «چہرہ — »؛ ماخذ `face_batch1..7.tsv` (452 + 375 + 343 + 305 + 307 + 191 + 125؛ `face_batch4_fix.tsv` = ایک اصلاح) |
| **`ur/rubrics/kent/mouth.json`** | **MOUTH مکمل 1,643** — جڑ «منہ — »؛ ماخذ `mouth_batch1..6.tsv` (341 + 268 + 246 + 350 + 303 + 135) |
| **`ur/rubrics/kent/teeth.json`** | **TEETH مکمل 861** — جڑ «دانت — »؛ ماخذ `teeth_batch1..4.tsv` (124 + 276 + 270 + 191) |
| **`ur/rubrics/kent/throat.json`** | **THROAT مکمل 1,049** — جڑ «گلا — »؛ ماخذ `throat_batch1..5.tsv` (230 + 230 + 230 + 230 + 129) |
| **`ur/rubrics/kent/external_throat.json`** | **EXTERNAL THROAT مکمل 255** — جڑ «بیرونی گلا — »؛ ماخذ `extthroat_batch1.tsv` (255) |
| **`ur/rubrics/kent/stomach.json`** | **STOMACH مکمل 3,213** — جڑ «معدہ — »؛ ماخذ `stomach_batch1..10.tsv` (400 + 300 + 350 + 310 + 340 + 320 + 320 + 320 + 320 + 233) |
| **`ur/rubrics/kent/abdomen.json`** | **ABDOMEN مکمل 3,592** — جڑ «پیٹ — »؛ ماخذ `abdomen_batch1..10.tsv` (400 + 360 + 360 + 360 + 360 + 360 + 360 + 360 + 360 + 312) |
| **`ur/rubrics/kent/stool.json`** | **STOOL مکمل 256** — جڑ «پاخانہ — »؛ ماخذ `stool_batch1.tsv` (256) |
| **`ur/rubrics/kent/bladder.json`** | **BLADDER مکمل 781** — جڑ «مثانہ — »؛ ماخذ `bladder_batch1..2.tsv` (400 + 381) |
| **`ur/rubrics/kent/kidneys.json`** | **KIDNEYS مکمل 264** — جڑ «گردے — »؛ ماخذ `kidneys_batch1.tsv` (264) |
| **`ur/rubrics/kent/prostate_gland.json`** | **PROSTATE GLAND مکمل 101** — جڑ «پروسٹیٹ غدود — »؛ ماخذ `prostate_batch1.tsv` (101) |
| **`ur/rubrics/kent/rectum.json`** | **RECTUM مکمل 1,332** — جڑ «مقعد — »؛ ماخذ `rectum_batch1..3.tsv` (400 + 400 + 532) + `rectum_batchfix.tsv` (40 اصلاح) |
| **`ur/rubrics/kent/urethra.json`** | **URETHRA مکمل 611** — جڑ «پیشاب کی نالی — »؛ ماخذ `urethra_batch1..2.tsv` (311 + 300) + `urethra_batchfix.tsv` (58) + `urethra_batchfix2.tsv` (4) |
| **`ur/rubrics/kent/urine.json`** | **URINE مکمل 408** — جڑ «پیشاب — »؛ ماخذ `urine_batch1..2.tsv` (204 + 204) + `urine_batchfix.tsv` (26) |
| **`ur/rubrics/kent/genitalia_male.json`** | **GENITALIA MALE مکمل 1,118** — جڑ «تناسلی اعضاء (مرد) — »؛ ماخذ `genitalia_male_batch1..3.tsv` (400 + 400 + 318) + `genitalia_male_batchfix.tsv` (67) |
| `ur/review/kent_<chapter>_REVIEW.md` | نظرثانی کی فائلیں — `node tools/review_rubrics_ur.js kent <chapter>` (یا `--all`) سے بنیں؛ 🔒 قفل، ⚙ خودکار جوڑ؛ گٹ میں نظر انداز (`.gitignore`) |
| `ur/rubrics/kent/mind_batch1..4.tsv` | بیچ 7–10 کی ماخذ TSV (key · depth · en · ur) — دوبارہ ضم کے لیے (ترتیب سے ضم کریں: 1، 2، 3، 4) |
| **`ur/BATCH_7_REVIEW.md`** | **بیچ 7 (ربرک-جملے) — ڈاکٹر کی نظرثانی کے لیے** 708 ربرک، اصلاح کا خانہ خالی |
| **`ur/BATCH_8_REVIEW.md`** | **بیچ 8 — نظرثانی کے لیے** 714 ربرک (قطار 709–1422: CONSCIENTIOUS … DELUSIONS «insane») |
| **`ur/BATCH_9_REVIEW.md`** | **بیچ 9 — نظرثانی کے لیے** 683 ربرک (قطار 1423–2105: DELUSIONS «insects» … ESTRANGED) |
| **`ur/BATCH_10_REVIEW.md`** | **بیچ 10 — نظرثانی کے لیے** 2,729 ربرک (قطار 2106–4834: EXCITEMENT … WRONG) |
| **`ur/BATCH_11_REVIEW.md`** | **بیچ 11 — نظرثانی کے لیے** VERTIGO 567 |
| **`ur/BATCH_12_REVIEW.md`** | **بیچ 12 — نظرثانی کے لیے** HEAD (PAIN کے سوا) 2,249 |
| **`ur/BATCH_13_REVIEW.md`** | **بیچ 13 — نظرثانی کے لیے** HEAD › PAIN عمومی شرطیں 799 |
| **`ur/BATCH_14_REVIEW.md`** | **بیچ 14 — نظرثانی کے لیے** HEAD › PAIN مقام 993 |
| **`ur/BATCH_15_REVIEW.md`** | **بیچ 15 — نظرثانی کے لیے** HEAD › PAIN قسمیں 2,880 (⚙ = خودکار جوڑ — پہلے یہ دیکھیں) |
| **`ur/BATCH_16_REVIEW.md`** | **بیچ 16 — نظرثانی کے لیے** EYE 1,804 |
| ~~`ur/BATCH_7…17_REVIEW.md`~~ | v118 میں ہٹا دی گئیں — اب `ur/review/` میں فی باب فائل، اوزار سے دوبارہ بنتی ہے |
| `docs/ur_audit/AUDIT_REPORT.md` | لیبل نظام کا آڈٹ (v107): خودکار لیبلوں میں ≈35–40٪ غلطی، قفل شدہ ≈97٪ درست |
| `docs/ur_audit/FAMILY_TREE_REVIEW.md` | **فیصلہ کن دستاویز:** لیبل نظام ٹکڑے ترجمہ کرتا ہے ربرک نہیں → ربرک-سطح کا ڈیزائن + 7 مرحلوں کا منصوبہ |
| `docs/ur_audit/DISPLAY_OPTIONS_DEMO.html` | صف پر دکھانے کے تین انداز (الف/ب/ج) کا نمونہ — **ج منظور** |

## 4.4 🔎 ترجمے کی خودکار جانچ — **اب اسکرین شاٹ کی ضرورت نہیں**

```
node tools/qa_ur.js kent 40
```

یہ **خود** مشتبہ ترجمے ڈھونڈتا ہے اور **ظہور کی تعداد** کے لحاظ سے ترتیب دیتا ہے — یعنی
جو غلطی سب سے زیادہ نظر آتی ہے وہ سب سے اوپر۔ سات قاعدے:

| قاعدہ | مثال |
|---|---|
| اردو ہی نہیں / انگریزی الفاظ | `… (دیکھیے Fever)` |
| قوسین میں **متبادل** (ایک چنیں) | «تیز (جلانے والا)» |
| دہرا لفظ (تکرار کی اجازت: باری باری، بار بار…) | «گروہوں میں میں» |
| حرفِ اضافت سے شروع | «سے اوپر کولھے» |
| ادھورا — حرفِ اضافت پر ختم | «خون آنا آسانی سے» |
| بلا وجہ «کا» سے شروع | «کا سر» |
| بہت لمبا ترجمہ | 2 انگریزی الفاظ → 7 اردو |

منظور شدہ مستثنیات `KEEP` میں درج ہیں (`leg`, `dinner`, `fits`, …)۔

**نتیجہ (v104):** مشتبہ **3,573 → 111**، اور باقی بھی زیادہ تر غلط الارم ہیں۔

## 4.5 🔒 قفل — نظرثانی شدہ ترجمے کبھی نہ بدلیں

**صارف کی شکایت:** «ہر بار پچھلی اصلاح بھی بدل جاتی ہے۔»
**وجہ:** بیچ ضم کرتے وقت خودکار ترجمہ ہاتھ سے کیے ترجمے پر چڑھ جاتا تھا۔

**حل:** `ur/rubric_labels_ur.json` میں `"locked": [...]` — ان کلیدوں کو کوئی خودکار عمل نہیں چھوتا۔
**ہمیشہ `tools/merge_ur.js` سے ضم کریں** (براہِ راست فائل نہ لکھیں):

```
node tools/compose_ur.js /tmp/b.tsv > /tmp/b_draft.tsv
node tools/merge_ur.js /tmp/b_draft.tsv      →  نئے: N   بدلے: M   🔒 محفوظ: K
```

اس وقت **2,378 ترجمے قفل شدہ** ہیں (ساری بنیادی لغت + صارف کی ہر اصلاح)۔

## 4.6 🌳 سیاق — والد ربرک کے ساتھ ترجمہ

**صارف کی تجویز:** «ذیلی ربرک کا ترجمہ اس کے اوپر والے ربرک ٹری کے ساتھ ملا کر ہو۔»

اکیلا لیبل اکثر مبہم ہوتا ہے:

```
during                  →  کے دوران            (کس کے؟)
menses › during         →  حیض کے دوران        ✅
anger › absent persons, at  →  غیر حاضر لوگوں پر غصہ  ✅
```

**فائل:** `"ctx": { "والد|بچہ": "اردو" }` — «پورا > راستہ|بچہ» بھی چلتا ہے (زیادہ خاص کو ترجیح)۔
**ایپ:** `repUrLabelObj(label, ancestors)` پہلے سیاق دیکھتی ہے، پھر عام ترجمہ (`.rtv-ur.ctx` نقطہ دار لکیر سے نشان زد)۔

**اوزار:**
```
node tools/ctx_ur.js  kent 40     ← کن جوڑوں کو سیاق چاہیے (تعداد کے ساتھ)
node tools/gen_ctx.js kent 4000   ← خودکار: والد + بچہ جوڑ کر سیاق بنائے
```
```
node tools/gen_ctx2.js kent       ← ذہنی والدین کے **سانچے**:
                                     delusions › X  →  «مغالطہ — X»
                                     fear › X, of   →  «X کا خوف»
                                     anger › X, at  →  «X پر غصہ»
                                     ailments from › X → «X کے بعد شکایات»
                                     (24 والدین کے سانچے `TPL` میں)
```
اس وقت **≈1,900 سیاق**۔ خودکار بننے کے بعد ایک صفائی چلتی ہے جو
ادھورے/بے تکے سیاق (قوسین، «کہ … ہے»، 6 سے زیادہ الفاظ) **خارج** کر دیتی ہے —
کیونکہ غلط سیاق نہ ہونے سے بدتر ہے۔

## 4.7 اوزار

```bash
export JSDOM_PATH=$PWD/node_modules/jsdom

# 1. اگلے بیچ کے لیبل نکالیں (زیادہ استعمال والے پہلے)
node tools/export_rubric_labels.js kent 100000 > /tmp/todo.tsv
head -800 /tmp/todo.tsv > /tmp/b2.tsv

# 2. لغت + صرفی قواعد سے خودکار ترجمہ (جو نہ بنے = «?»)
node tools/compose_ur.js /tmp/b2.tsv > /tmp/b2_draft.tsv
awk -F'\t' '$4=="نامکمل"{print $1}' /tmp/b2_draft.tsv     # یہ ہاتھ سے کرنے ہیں

# 3. ہاتھ والے ترجمے glossary_core_v1.json کے terms میں ڈالیں، پھر 2 دوبارہ چلائیں

# 4. جانچ — ٹکراؤ، بےقاعدگی، لغت کی پابندی
node tools/check_rubric_labels.js

# 5. کوریج
node tools/coverage_ur.js kent
```

### `compose_ur.js` کے صرفی قواعد (پہلے سے موجود)
- مصدر → مجرور: `چلنا` → **چلنے** سے بگاڑ
- مصدر → مسلسل: `بولنا` → **بولتے ہوئے**
- `کمرہ` → **کمرے** · `کندھا` → **کندھے** · `دھبے` → **دھبوں**
- وقت کے الفاظ: `رات agg.` → **رات کو بگاڑ** (نہ کہ «رات سے»)
- گھڑی: `9 a.m.` → **صبح 9 بجے** · `11 p.m.` → **رات 11 بجے** (اردو ہندسے)
- استثناء: `بایاں`→بائیں · `قے`→قے (لسٹ `OBL_EX` میں)

## 4.8 اب تک کی پیش رفت

| | |
|---|---|
| لغت | **3,076 اصطلاحات** |
| لیبل فائل | **11,371 لیبل** (781 فالتو «(see …)» حذف) |
| **کینٹ کی کوریج** | **60,557 / 71,027 = 85.3٪** |
| جانچ | **0 خرابی** · 369 تنبیہ (سب کینٹ کے اپنے املا کے فرق — aliases میں درج) |
| MIND باب (لیبل نظام) | ⚠ پہلے یہاں «775 ربرکس مکمل» لکھا تھا — **غلط تھا**۔ پیمائش (v107 آڈٹ): MIND کی لیبل کوریج **65.5٪ — سب سے کم باب**؛ 557 سرِ عنوان میں سے صرف 265 لیبل فائل میں |
| **MIND باب (ربرک نظام v110)** | **✅ مکمل 4,834 / 4,834** (`ur/rubrics/kent/mind.json`) — بیچ 7 (1–708)، 8 (709–1422)، 9 (1423–2105)، 10 (2106–4834)؛ ڈاکٹر کی نظرثانی باقی، قفل 0 |

## 4.9 اگلے بیچ

| بیچ | لیبل | کوریج |
|---|---|---|
| 1 ✅ | 400 | 55.5٪ |
| 2 ✅ | 800 | **64.1٪** |
| 3 ✅ | 1500 | **71.0٪** |
| 4 ✅ | 3000 (1706 حل، 1294 باقی) | **75.1٪** |
| 5 ✅ | باقی سب پر قواعد (5,797 حل) | **83.4٪** |
| 6 ✅ | 246 عام الفاظ + قواعد (1,240 حل) | **85.2٪** |
| 7 | باقی 10,283 | — |

### ⚠ باقی 10,283 کے بارے میں ایک اہم بات
یہ سب **ایک ایک بار** آنے والے لمبے فقرے ہیں (مثلاً `old rags are as fine as silk`،
`child awakens terrified, knows no one`)۔ ان کے لیے قاعدہ نہیں بن سکتا — ہر ایک ہاتھ سے کرنا پڑے گا،
اور فائدہ فی لیبل بہت کم ہے۔

**مگر ایپ ان پر بھی خالی نہیں چھوڑتی:** `repUrLabelObj()` میں تیسرا درجہ پہلے سے موجود ہے —
`glossary_en_ur.json` سے **لفظ بہ لفظ** ترجمہ، جو `auto:true` کے ساتھ **ہلکے رنگ** میں دکھایا جاتا ہے
تاکہ ڈاکٹر کو معلوم رہے کہ یہ نظرثانی شدہ نہیں۔ اس لیے ترجمے کا کام یہاں **روکا جا سکتا ہے**
اور زیادہ قیمتی کاموں کی طرف بڑھا جا سکتا ہے۔

> **بیچ 4 کا سبق:** یہاں سے آگے ہر لیبل **ایک ہی بار** آتا ہے (زیادہ تر ذہنی باب کے مغالطے)۔
> 3000 میں سے 1294 ابھی حل نہیں ہوئے — وہ **اگلے بیچ میں دوبارہ آئیں گے**، کیونکہ
> `export_rubric_labels.js` ہمیشہ صرف **باقی ماندہ** نکالتا ہے۔ ادھورا کچھ ضائع نہیں ہوتا۔

**تجربہ:** بیچ 3 میں 1500 میں سے 735 لغت سے اور 735 قاعدے سے بنے — یعنی **آدھا کام قواعد نے کیا**۔
v98 میں composer **تکراری** بنا دیا گیا: اب وہ لمبے لیبل کے ٹکڑے خود توڑ کر حل کرتا ہے
(مثلاً `alternating with pain in chest` → `pain in chest` → `chest`)۔ نئے عام قواعد بھی شامل:
`alternating with X` · `(See Y)` · `loss of X` · `near X` · `between X and Y` · `X tastes` ·
`abuse of X` · `X region` · `X muscles` · `suppression of X` · `until N بجے`
v99 میں مزید: `as if in X` · `extending from X to Y` · `must X` · `using X` · `opening/closing X, on` ·
`turning X up/down` · `X gradually` · `over whole X` · `X weather` · `waves of X`

**⚠ صارف کے طے شدہ اصول:**
1. `alternating with X` = «**باری باری** X کے ساتھ» (باری باری پہلے)
2. **کراس ریفرنس `(See …)` کا ترجمہ نہیں ہوتا** — وہ ربرک کا متن نہیں، اشارہ ہے۔
   `repXrefSplit()` اسے الگ کرتا ہے، `repTitleCase()` بڑے حروف کو **عنوانی حروف** بناتا ہے
   (`(SEE FORSAKEN)` → `(See Forsaken)`)، اور `.rep-xref` اسے ہلکے ترچھے حروف میں دکھاتا ہے۔
   لیبل فائل میں دونوں کلیدیں موجود ہیں — «(see …)» کے ساتھ اور بغیر۔

**طریقہ وہی:** نکالیں → خودکار → «?» والے ہاتھ سے → جانچ → صارف کی نظرثانی → لیبل فائل میں ضم۔

---

## 4.10 📖 پورے ربرک کا اردو جملہ — **دائیں سے بائیں**

کینٹ کا ربرک **الٹی ترتیب** میں لکھا ہوتا ہے: پہلے بنیادی علامت، پھر وقت/مقام، آخر میں سب سے خاص شرط۔
اسے **دائیں سے بائیں** پڑھنا پڑتا ہے:

```
HEAD, PAIN, morning, waking, on   →  «صبح جاگنے پر سر میں درد»
```

`tools/rubric_ur.js` یہی کرتا ہے:
1. دُم کے حروف (`on` `while` `after` `agg.` …) کو پچھلے ٹکڑے سے جوڑتا ہے → «جاگنے پر»
2. پھر پوری ترتیب **الٹ** دیتا ہے
3. «، » سے جوڑ دیتا ہے

```
ANGER, consoled, when          →  تسلی دیا جانے پر، غصہ
ABSENT-MINDED, reading, while  →  پڑھتے ہوئے، غافل
ASLEEP, eating, after          →  کھانے کے بعد، سویا ہوا
```

**✅ v101 میں ایپ کے اندر لگ گیا** — `js/17-rubric-ur.js`:

| فنکشن | کام |
|---|---|
| `repRubricUrFull(title,opts)` | پورا اردو جملہ (الٹی ترتیب)؛ ادھورا ہو تو **خالی** لوٹاتا ہے |
| `repRubricUrHtml(title,cls)` | تیار `<span dir="rtl">` — صرف اردو زبان میں |
| `repPathUrHtml(path,cls)` | `A - B - C` والا راستہ بھی چلتا ہے |

**کہاں لگا:** تفریق کی ہر سطر (`rep-diff-ur`) · ورک بینچ کا کلپ بورڈ (`rep-wb-ur`) · ربرک کے صفحے کا عنوان (`rpd-title-ur`)
**سجاوٹ:** `css/rubric-ur.css` · **ٹیسٹ:** `tests/rubric_ur_v101.test.js` (17 جانچیں)
**اصل کینٹ پر:** 11,378 مرکب ربرکس میں سے **7,909 (70٪)** کا مکمل اردو جملہ بنتا ہے۔


## 4.11 🌳 ربرک کی سطح کا اردو جملہ (v107) — **اب یہی اصل نظام ہے**

**مسئلہ (ثابت شدہ، `docs/ur_audit/FAMILY_TREE_REVIEW.md`):** لیبل نظام ہر ٹکڑے کا الگ لغوی ترجمہ کرتا ہے، ربرک کا نہیں —
`GENITALIA F › PAIN › grinding › ovaries` پر «دانت پیسنا»، `PROSTATE › EMISSION` پر «احتلام»، `VISION › CIRCLES › turning` پر «کروٹ لینا»۔
ڈاکٹر کینٹ کے ربرک کا مطلب اس کے **پورے راستے** سے بنتا ہے، اس لیے ترجمہ بھی پورے راستے کا ہونا چاہیے۔

**حل:** ہر ربرک (پورا راستہ) → ایک ہاتھ کا لکھا جملہ، **بنیاد پہلے** (والد کا حصہ، پھر اِس صف کا اضافہ):

```
ANGER                                   → غصہ
ANGER, consoled, when                   → غصہ — تسلی دینے پر
ANGER, ailments after anger, with anxiety → غصہ — غصے کے بعد پیدا ہونے والی شکایات، ساتھ بے چینی
ANXIETY, lying, amel.                   → بے چینی — لیٹنے سے آرام
```

| فائل | کام |
|---|---|
| `ur/rubrics/<book>/<chapter>.json` | `{meta, rubrics:{key:"جملہ"}, locked:[keys]}` — ایک باب ایک فائل؛ ایپ باب کھلنے پر ایک بار منگواتی ہے (`?v=`+`REP_RUBUR_V` — **یہ فائلیں بدلیں تو `js/18-rubrics-ur.js` میں `REP_RUBUR_V` بڑھائیں**)؛ فائل نہ ہو (404) تو خاموشی سے پرانا نظام |
| `js/18-rubrics-ur.js` | `repRubKey(full)` (کلید: `[n]` اور `(See …)` نکال کر، چھوٹے حروف)، `ensureRepRubricsUr`، `repRubUrGet/Find`، `repRubUrBase/Split` (بنیاد = قریب ترین بزرگ جس کے جملے سے یہ جملہ شروع ہو؛ v110: بزرگ کی «مائل» شکل بھی — `repRubUrObl`: «لکھنا»→«لکھنے»، «حافظہ»→«حافظے»)، `repRubUrRowHtml(r)`، موڈ `repRubUrMode/SetMode/Toggle` (`localStorage: bc_ur_mode`، طے شدہ `full`) |
| `js/repertory/rep-tree.js` | صف پر پہلے `repRubUrRowHtml`، نہ ملے تو پرانا `repUrLabelObj`؛ `repTreeMount` میں `ensureRepRubricsUr(...)` → لوڈ پر `repTreeRemount` |
| `js/17-rubric-ur.js` | `repRubricUrFull` اب **پہلے** `repRubUrFind` (ہاتھ کا جملہ) — تفصیل کا عنوان، تفریق، کلپ بورڈ سب پر |
| `css/rubrics-ur.css` | `.rtv-ur.rub` · `.rub-base` (ہلکا) · `.rub-delta` (نمایاں) · `.rep-ur-mode-btn` |
| `index.html` | ٹول بار میں `#repUrModeBtn` («📖 پورا مطلب» ⇄ «✂ صرف اضافہ») — onclick نہیں، JS میں بندھتا ہے؛ انگریزی زبان میں چھپ جاتا ہے |
| `tests/rubrics_ur_v107.test.js` | 35 جانچیں — کلید، ڈیٹا، صف کی HTML، موڈ، تفصیل، وائرنگ |

**اوزار (سب `tools/rubrics_ur_lib.js` پر — ایپ کا اصل کوڈ jsdom میں چلا کر ٹری کی صفیں اور کلیدیں بناتا ہے):**

```bash
export JSDOM_PATH=$PWD/node_modules/jsdom
node tools/export_rubrics_ur.js kent mind 708 400 > /tmp/mind_b8.tsv   # 708 سے 400 ربرک (ٹری کی ترتیب) — آخری خانہ «ur» خالی
#   ur میں لکھیں:  اضافہ           → والد + « — » (سطح 1) یا «، » (گہری) + اضافہ
#                  +اضافہ          → والد + ایک جگہ + اضافہ   (مثلاً «شام» + «+6 بجے» = «شام 6 بجے»)
#                  =پورا جملہ      → جوں کا توں (جب والد صرف عنوان ہو: «=بے چینی — لیٹنے سے آرام»)
node tools/merge_rubrics_ur.js kent mind /tmp/mind_b8.tsv            # ضم (قفل شدہ نہیں بدلتا؛ والد پہلے، بچے بعد)
#   جسمانی/علامتی ابواب (VERTIGO, HEAD …): --root "چکر — "  → ہر جملہ جڑ سے شروع، سطح 1 بھی «، » سے جڑتی ہے؛ ایپ جڑ کو ہلکی بنیاد دکھاتی ہے
node tools/qa_rubrics_ur.js kent mind                                # باب جیسا دکھے گا + مشتبہ (انگریزی حروف، «ہوے»، بزرگ سے نہ جڑا)
node tools/merge_rubrics_ur.js kent mind /tmp/mind_b8.tsv --lock     # ڈاکٹر کی نظرثانی کے بعد ہی
node tools/coverage_rubrics_ur.js kent                               # باب بہ باب کوریج
node tools/tm_rubrics_ur.js kent face                                # «ترجمہ یادداشت»: پہلے ابواب کے ٹکڑوں سے خودکار تجویز (start/count، --src، --vote u|m)
```

**بیچ کا چکر:** export → ہاتھ سے جملے (کینٹ کا مطلب، لغوی نہیں) → merge → qa (⚠ = 0) → `ur/BATCH_n_REVIEW.md` → ڈاکٹر کی اصلاح → merge اصلاحات → `--lock`۔

**طے شدہ اصطلاحات (بیچ 7–8):** agg. «بگاڑ» · amel. «آرام» · Anxiety «بے چینی» · Anguish «سخت کرب (دلی اذیت)» · Confusion «ذہنی الجھن» · Concentration «ذہن جمانا» · Company aversion «لوگوں سے بیزاری» · Cheerful «خوش مزاجی» · Absent-minded «غائب دماغی» · Delirium «ہذیان» · Delusions «وہم» (بچے: «وہم — کہ …»؛ دیکھنے والے: «… دکھائی دیتے ہیں») · Death «موت» · «(See …)» ترجمہ نہیں · ہندسے 1 2 3۔
**✅ ڈاکٹر کے فیصلے (29 ستمبر 2026):** Delusions = **«وہم»** · اوقات «رات 4 بجے»/«سہ پہر 5 بجے» **منظور** · جنس **بالکل کینٹ کی ترتیب سے** (he → مذکر، she → مؤنث، نہ ہو تو مذکر)۔ ⚠ خودکار جانچ ممکن نہیں (اردو فعل اسم کی جنس سے بدلتا ہے: «شادی ہو چکی ہے»، «موسیقی سنائی دیتی ہے») — ہاتھ سے دیکھیں۔

**پیش رفت:** MIND ✅ 4,834 · VERTIGO ✅ 567 · HEAD ✅ 6,921 · EYE ✅ 1,804 · VISION ✅ 885 · EAR ✅ 2,015 · HEARING ✅ 158 · NOSE ✅ 1,514 · FACE ✅ 2,098 · MOUTH ✅ 1,643 · TEETH ✅ 861 · THROAT ✅ 1,049 · EXTERNAL THROAT ✅ 255 · STOMACH ✅ 3,213 · ABDOMEN ✅ 3,592 · STOOL ✅ 256 · BLADDER ✅ 781 · KIDNEYS ✅ 264 · PROSTATE GLAND ✅ 101 · RECTUM ✅ 1,332 · URETHRA ✅ 611 · URINE ✅ 408 · GENITALIA MALE ✅ 1,118 · GENITALIA FEMALE ✅ 1,471 · LARYNX AND TRACHEA ✅ 738 · RESPIRATION ✅ 761 · EXPECTORATION ✅ 379 · COUGH ✅ 1,690 · CHEST ✅ 3,433 · BACK ✅ 3,888 · قفل 0 · کینٹ کل **48,640 / 71,027 (68.5%)**۔ **30 ابواب مکمل** — آدھے سے زیادہ کینٹ پار۔ **اگلا باب:** EXTREMITIES (16,057) · SLEEP (1,066) · CHILL (800) · FEVER (609) · PERSPIRATION (427) · SKIN (1,189) · GENERALITIES (2,239)۔ ⚠ **ترجمے کی ہم آہنگی کا قاعدہ (v122):** ہر نئے باب کے بعد اُس کے سیکشن-نام اور اصطلاحات پچھلے ابواب سے موازنہ کریں (depth-0 نام + آخری ٹکڑے)؛ مکمل جملے ہمیشہ `=` کے ساتھ لکھیں ورنہ merge اوزار والد سے جوڑ کر جملہ دگنا کر دیتا ہے۔ ⚠ ورک اسپیس 128 MB سے بڑھ جائے تو فائلیں نشستوں کے بیچ غائب ہو جاتی ہیں — بڑی عارضی فائلیں (all_rubrics.json، پرانی زپ) نہ رکھیں۔ **رفتار کا طریقہ (v115):** جسمانی ابواب میں ربرک «قسم + مقام + شرط» کے ٹکڑوں سے بنتے ہیں — پہلے عمومی شرطیں اور مقام ہاتھ سے کریں، پھر `/home/user/ur_audit/_work` جیسا «ترجمہ یادداشت» (اپنی ہی عبارتوں سے TM) بنا کر باقی خودکار جوڑیں، نامعلوم ٹکڑے ہاتھ سے؛ نظرثانی کی فائل میں ⚙ لگائیں۔ پرانا نوٹ: `HEAD › PAIN` کی **قسمیں** 2,880 (قطار 1457–6128 میں جن کا جملہ نہیں): pressing 671 «دبانے والا»، stitching 455 «چبھتا»، tearing 430 «چیرتا»، drawing 229 «کھینچتا»، boring 160 «برما سا»، shooting 157 «دوڑتا (تیر جیسا)»، sore 135 «دکھتا، کچلا ہوا»، burning 101 «جلتا»، cutting 98 «کاٹتا»، bursting 96 «پھٹنے جیسا»، jerking 46، lancinating 39، stunning 36، burrowing 35، extending 29، morning 26، nail 26، periodic 25، cramping 24، brain 21، lying 20؛ ہر قسم کا جملہ «سر — درد، دبانے والا، ماتھے میں، …»؛ جڑ وہی «سر — »، PAIN کا جملہ «سر — درد، …» (ذیلی اقسام: aching «ہلکا مسلسل درد»، boring «برما سا درد»، bursting «پھٹنے جیسا»، pressing «دبانے والا»، stitching «چبھن»، tearing «چیرنے والا»…)؛ ضم `--root "سر — "` کے ساتھ اسی head.json میں۔ پھر eye, vision, ear … رفتار: ایک نشست میں ≈2,700 ربرک ہو سکتے ہیں (بیچ 10) — صارف چاہتا ہے **پورا باب ایک بار میں**۔
**منصوبہ (`FAMILY_TREE_REVIEW.md` §6):** ② MIND باقی 4,126 · ③ سب ابواب کے سرِ عنوان 4,150 · ④ GENERALITIES/SLEEP/VERTIGO/FEVER/CHILL/PERSPIRATION ≈6,700 · ⑤ modifier قواعد + ترکیب · ⑥ بدن کے ابواب ≈15,000 — کل ≈40 نشستیں۔
**پرانا لیبل نظام** (`rubric_labels_ur.json`, `compose_ur.js`) اب صرف **فال بیک** ہے — جہاں جملہ نہیں وہاں پہلے جیسا دکھتا ہے؛ اس پر نئے بیچ نہ چلائیں۔

# 5. 📋 باقی کام (ترتیب سے)

## 🔴 پہلی ترجیح

**1. اسکرین پارسر کا ونڈوز پر اصل ٹیسٹ** — v82/v83 دونوں میں کھلا۔ لینکس پر 31 ٹیسٹ پاس، مگر اصل ونڈوز انسٹالر/EXE کبھی نہیں چلا۔ **یہ صرف صارف کر سکتا ہے۔**

**2. پارسر کا مواد ایپ میں درآمد** — پارسر `staging` ZIP بناتا ہے مگر ایپ میں شامل نہیں ہوتا۔ درآمد + تلاش لکھی ہی نہیں گئی۔

## 🟡 دوسری ترجیح

**3. Supabase → IndexedDB** — CDN ابھی `index.html` میں ہے۔ ساتھ: مکمل بیک اپ/ریسٹور، `navigator.storage.persist()`، `start.bat`۔ پھر Supabase کی key منسوخ کریں۔
> ⚠ v95 کے ریپرٹری کیس بھی `localStorage` میں ہیں (`bc_visit_cases_v1`) — منتقلی میں `repCaseExportAll()` / `repCaseImportAll()` استعمال کریں۔

**4. Streamlit کے دو آئی فریم ہٹانا** — `bismillah-clinic-homeo.streamlit.app` اور `bismillah-homeo-clinic.streamlit.app`۔ ان کے بعد ہی `app.py` · `homeo_core/` · `ai_engine/` حذف ہو سکیں گی۔

## 🟢 تیسری ترجیح

**5. اردو ترجمہ — اب صرف ربرک-سطح (§4.11)** — اگلی نشست: (الف) ڈاکٹر کی `BATCH_7/8/9_REVIEW.md` اصلاحات ضم + `--lock`؛ (ب) ✅ MIND مکمل — اب اگلے ابواب **پورے کے پورے** (VERTIGO → HEAD → EYE → VISION → EAR → HEARING → NOSE → FACE ✅ 2,098؛ MOUTH ✅ 1,643 · EXTERNAL THROAT ✅ 255؛ اگلا **STOMACH 3,213، جڑ «معدہ — »**)، ہر باب کی اپنی `ur/rubrics/kent/<chapter>.json` + `BATCH_n_REVIEW.md`، ہر بار SW فہرست میں نئی json شامل کریں؛ (ج) باقی ابواب کے سرِ عنوان 4,150؛ منصوبہ `docs/ur_audit/FAMILY_TREE_REVIEW.md` §6۔ **لیبل نظام (`compose_ur.js`) پر مزید بیچ نہ چلائیں** — وہ قفل کے بغیر درست ہاتھ کے ترجمے مٹا دیتا ہے۔

**6. Boger Times کی ٹری سطحیں** — `tools/mm_build/boger_times_repertory.py` سے دوبارہ نکالنی ہوں گی۔ **صارف کے فیصلے کا انتظار**

**7. ڈیٹا کا دہراؤ ختم** — ہر ریپرٹری دو بار محفوظ ہے: پوری کتاب (57 MB) + باب در باب (56 MB)۔ `loadAllBooksData` کو ابواب سے چلانے پر ≈57 MB کی بچت

**8. تفریق کا نیا لے آؤٹ** — تین ڈیزائن بنائے جا چکے۔ «ڈیزائن الف» لگ چکا (v91–92)۔ **ب** (بائیں کنٹرول ریل) اور **ج** (سب ایک نظر میں) باقی — صارف کے فیصلے کا انتظار

**9. Capacitor سے اینڈرائیڈ ایپ** — سب سے آخر میں

## ⚪ چھوٹی صفائیاں
- `UPDATE_NOTES_v79/82/83.txt` → `docs/` میں
- `index.html` میں 217 `style=""` اور 113 `onclick=""` — بتدریج
- تفریق کے پاپ اپ والی مردہ CSS (≈15 سطریں) — فال بیک ختم کرنے کے بعد

---

# 6. معلوم جال (دوبارہ نہ پھنسیں)

| جال | حقیقت |
|---|---|
| `js/08-app-repertory.js` | v78 میں ختم — اب `js/repertory/` |
| ٹیسٹ اور تقسیم | فائلیں توڑیں تو `tests/_rep_src.js` / `_diff_src.js` خود سنبھال لیتے ہیں |
| سروس ورکر | نئی فائل بنائیں تو **اس میں بھی** شامل کریں، ورنہ آف لائن ٹوٹے گا |
| `boring` | درد کی قسم؛ مگر `boring with finger` = انگلی گھسانا |
| `leg` | کینٹ میں گھٹنے سے نیچے؛ `calf` اور `thigh` الگ ربرکس |
| `dinner` | کینٹ میں دن کا بڑا کھانا؛ `supper` = رات کا |
| `timidity` ≠ بزدلی | `COWARDICE` کینٹ میں الگ ربرک ہے |
| کیش | صارف کو ہمیشہ **دو بار** `Ctrl+Shift+R` کا کہیں اگر SW بدلا ہو |
| `ur/rubrics/*.json` | **ہاتھ سے نہ لکھیں** — صرف `tools/merge_rubrics_ur.js`؛ کلید ہمیشہ ایپ کے `repRubKey()` سے (اوزار وہی فنکشن jsdom میں چلاتے ہیں) |
| `compose_ur.js` دوبارہ چلانا | غیر قفل شدہ درست ترجمے مٹ جاتے ہیں (شکایت: «ہر بار پچھلی اصلاح بدل جاتی ہے») — پہلے قفل، پھر چلائیں؛ بہتر ہے بالکل نہ چلائیں |
| «MIND 775 مکمل» | پرانا دعویٰ غلط تھا — لیبل کوریج 65.5٪؛ ربرک-جملے 708/4,834 (v107) |
| `node_modules` | نشست کے snapshot میں محفوظ نہیں رہتا — `npm install jsdom` دوبارہ، اور `JSDOM_PATH=$PWD/node_modules/jsdom` |
| ورک اسپیس 128 MB | اس سے بڑھنے پر کچھ فائلیں (خاص کر `ur/` والا کام) نشستوں کے بیچ غائب ہو جاتی ہیں (v121 میں ہوا)۔ **حل:** مقامی نقل (clone) سے بھاری اور غیر ضروری حصے ہٹا رکھیں — `mm/`، `kent_de_chapters/`، `synthesis91_raw_chapters/`، `repertory_chapters/`، `kent_de_repertory_by_key.json`، `synthesis91_raw_repertory_by_key.json`، `repertory-data.json`، `kent_repertory.json`؛ ضرورت پڑے تو `git clone https://github.com/touqeer25/bismillah-clinic.git` سے دوبارہ لے لیں (گزشتہ v120 کا کام زپ سے بحال ہوا تھا)۔ |
