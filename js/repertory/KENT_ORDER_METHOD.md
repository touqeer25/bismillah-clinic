# کینٹ ریپرٹری — ربرک کی ترتیب کا طریقہ کار

**یہ فائل کینٹ ریپرٹری کے کوڈ کے ساتھ منسلک ہے** (`js/repertory/rep-chapters.js` — وہیں ترتیب کا قانون لکھا ہوا ہے)۔
مقصد: آئندہ کوئی بھی کام کرنے والا (یا میں خود) ایک ہی نظر میں سمجھ لے کہ ربرک کس ترتیب سے لگتے ہیں،
کس کتابی حوالے سے، اور کون سی جانچ ہو چکی ہے — تاکہ دوبارہ پریشانی نہ ہو۔

- حالت: نافذ — **v131** (30 ستمبر 2026)
- رپورٹ (کیا بدلا، گنتی کے ساتھ): `ur/review/kent_order_fix_v131.md`
- جانچ کے ٹیسٹ: `tests/rubrics_ur_v107.test.js` (F1–F7 کتابی ترتیب · G1–G7 مین ربرک کی حروفِ تہجی ترتیب)

---

## 1. کینٹ کا اپنا قانون

کینٹ کے دیباچے (PREFACE، صفحہ I) کے مطابق ہر باب میں ترتیب یہ ہے:

1. پہلے **عام ربرک** (general rubric)،
2. پھر **تجزئیات** (particulars) — یعنی **وقت** (time of occurrence)،
3. پھر **شرائط** (circumstances / modalities)،
4. اور **آخر میں پھیلاؤ** (extensions) — «جس ربرک سے علامت پھیلتی ہے، وہی ربرک اصل ہے»۔

اور **مین ربرک (باب کے بڑے ربرک) کتاب میں حروفِ تہجی سے ہیں** — اِس کی تصدیق براہِ راست کتاب سے:

| باب | کتاب کا صفحہ (PDF) | کتاب کی ترتیب |
|---|---|---|
| KIDNEYS | 1426 (PDF1460) | `ABSCESS → ADDISON'S disease → BUBBLING sensation in region of → CATARRH → COLD sensation → FLUTTERING → FORMICATION → HEAT → HEAVINESS → INFLAMMATION → LAMENESS → NUMBNESS → PAIN …` |
| BACK | 1919 (PDF1953) | `ABSCESS → AIR → ASLEEP → BAR → BIFIDA → BLOOD → BLUISH → BOILS (See Eruptions) → BROWN spots on → BRUISES on spine → BUBBLING sensation in …` |
| RECTUM | 1309 (PDF1343) | `ABSCESS → … → APHTHOUS condition of anus → BALL in rectum, sensation of → BLACK → BOILS → CANCER …` |
| GENITALIA MALE | 1497 (PDF1531) | اسی طرح `ABSCESS → …` (پروفائل: ERECTIONS میں «troublesome → daytime → morning → …» وقت پہلے) |

**دو استثنا** (کتاب خود کرتی ہے، ہم نے اُسی طرح رکھا):

1. **`… in general` والا عام ربرک** باب کے بالکل شروع میں — مگر صرف اُس وقت جب کتاب میں وہ اسی باب کا **پہلا** ربرک ہو:
   CHILL میں `COLDNESS in general` (کتاب صفحہ 2770 / PDF2804) اور FEVER میں `HEAT in general` (صفحہ 2803 / PDF2838)۔
   ورنہ وہ اپنی حروفِ تہجی والی جگہ پر رہتا ہے — مثلاً GENERALITIES میں `SWELLING in general` (کتاب میں وہ `SWELLING` کے نیچے درمیان میں آتا ہے،
   اور باب کا آغاز `DAYTIME` سے ہوتا ہے)۔
2. **وقت کا بلاک** (`DAYTIME → MORNING → FORENOON → NOON → AFTERNOON → EVENING → NIGHT → MIDNIGHT`) —
   اُن ابواب میں پہلے جہاں کتاب نے وقت کو مقدم رکھا: COUGH (صفحہ 1686 / PDF1721)، VERTIGO، CHILL، FEVER، GENERALITIES، PERSPIRATION، EXPECTORATION۔

---

## 2. ہمارے ڈیٹا کی (سچی) حالت

`kent_chapters/<باب>.json` میں ہر ربرک کا ایک `id` ہے:

- `r…` — کینٹ کی کتاب سے اصل ترتیب میں نکالے گئے ربرک (r0، r1، r2 … یعنی **کتابی ترتیب**)،
- `m…` / `o…` — بعد میں جُڑے / کسی اَور ذریعے سے آئے ربرک (اِن کی ترتیب ڈیٹا میں کتابی نہیں)۔

پرانی merge سکرپٹ نے «سب سے چھوٹا id» کے حساب سے ترتیب بنائی تھی، اسی لیے **بعض ربرک باب کے آخری سرے پر پڑے رہتے تھے** —
مثلاً `rectum` میں `ASH-COLORED (See Gray)` (یہ دراصل STOOL کا مین ربرک ہے، کتاب صفحہ 1372 / PDF1406، اور `(See Gray)` کے ساتھ کراس ریفرنس بھی رکھتا ہے)،
یا `AUTUMN and spring` جیسے ربرک۔ اِسی لیے ترتیب «فائل سے نہیں، کتاب سے» لی جاتی ہے۔

---

## 3. قاعدہ (v131 — جو کوڈ میں لکھا ہے)

### الف) مین ربرک (جڑ / depth 0) کی سطح

1. کلید کے تین درجے بنتے ہیں (`_repKentRootKey`):
   - `[0]` — «… in general»، مگر دوسرے درجے پر (کتاب میں پہلا ربرک ہونے پر ہی)۔
   - `[1]` — وقت کا بلاک (daytime…midnight) جہاں کتاب نے وقت مقدم کیا۔
   - `[2]` — باقی سب: لیبل کو صاف کر کے **حروفِ تہجی** سے۔
2. لیبل صاف کرنے کا طریقہ (`_repKentNormLabel`):
   - `(See …)` حصہ کلید سے نکال دیا جاتا ہے (کراس ریفرنس ترتیب پر اثر نہیں ڈالتا)،
   - `Æ → AE`، `Œ → OE`، `&#140; → OE`، `’ → '`،
   - **ہائفن پہلے حذف** (اسی لیے COUGH میں کتاب کے مطابق `READING → RE-ECHO → RINGING` آتا ہے — کتاب PDF1771)،
   - باقی علامات خالی جگہ، پھر چھوٹے حروف۔
3. اِس سے وہ ربرک بھی اپنی حروفِ تہجی والی جگہ پر آ جاتے ہیں جو ڈیٹا میں باب کے آخر میں پڑے تھے
   (rectum کا `ASH-COLORED` اب `APHTHOUS` کے بعد اور `BALL` سے پہلے = #2)۔

### ب) اندرونی درجے (ذیلی ربرک — depth 1 سے نیچے)

یہ v130 والا قانون (جو پہلے سے نافذ اور صارف سے منظور شدہ) ہے:

1. پرانے ربرک (`r…`) — id کے حساب سے یعنی **کتابی ترتیب**،
2. نئے ربرک (`m…` / `o…`) — مندرجہ ذیل پروٹوکول کے حساب سے درمیان میں ٹھیک جگہ پر:
   **Side → Time → Modalities → Location → Character → Extension** (پھیلاؤ سب سے آخر — مثلاً GENITALIA MALE کا `COLDNESS`:
   `morning → evening → urination, during → penis → scrotum → testes`، کتاب صفحہ 1495 / PDF1531؛ اور `CONDYLOMATA`: `anus and → Bleed easily → … → penis → scrotum`، صفحہ 1496)۔

### ج) کوڈ میں کہاں ہے

| فنکشن | کام |
|---|---|
| `_repKentTimeRank` | وقت کے ناموں کا نمبر (daytime … midnight) |
| `_repKentNormLabel` | لیبل صاف کرنا (See ہٹانا، Æ، ہائفن) |
| `_repKentLabelKey` | *اندرونی* درجوں کی کلید (وقت / before → during → after → amel. → agg. → باقی) |
| `_repKentRootKey` | *جڑ* کی کلید (`[0] in general → [1] وقت → [2] حروفِ تہجی`) |
| `_repKentKeyCmp` | دو کلیدوں کا موازنہ |
| `_repKentRNum` | `r…` id سے نمبر نکالنا (کتابی ترتیب) |
| `_repSortTreeKentOrder(node, isRoot)` | اصل ترتیب دینے والا فنکشن — ٹری بننے کے بعد صرف کینٹ پر (`repCurrentBook === 'kent'`) |

---

## 4. کیا نہیں بدلتا

- ربرک کا **متن، ترجمہ، کلید یا گنتی** — ترتیب کا قانون صرف *دکھانے/برآمد* پر اثر ڈالتا ہے،
  یعنی `ur/rubrics/kent/*.json` کا کوئی اندراج نہیں چھیڑا جاتا (ترجمہ پوری انگریزی سطر سے جُڑتا ہے، ترتیب سے نہیں)۔
- `kent_chapters/`، `*_chapters/`، `mm/`، `library/`، `data/` — اِن فائلوں کو کبھی ہاتھ نہیں لگایا جاتا۔
- **باقی کتابیں** (Repertorium Publicum، Synthesis وغیرہ) — یہ قانون صرف کینٹ پر لاگو ہے۔
- `js/repertory/LOAD_ORDER.txt` کی ترتیب نہیں بدلی جاتی۔

---

## 5. جانچ (کیا ثابت ہو چکا)

| جانچ | نتیجہ |
|---|---|
| 37 ابواب کی کل ربرک قطاریں | **71,027** — v130 کے برابر، ایک بھی کم/زیادہ نہیں |
| مین ربرک (جڑ) کی گنتی | **4,709** — دونوں طرف برابر (کوئی ربرک گم نہیں ہوا) |
| مین ربرک جو اپنی جگہ پر آئے | **2,652** (37 ابواب میں) |
| rectum کا `ASH-COLORED (See Gray)` | #2 — `APHTHOUS` کے بعد، `BALL` سے پہلے (کتاب میں یہ STOOL کا ربرک ہے) |
| kidneys، back، stool، abdomen، generalities، mind کا آغاز | کتاب سے جوں کا توں ملایا گیا (PDF سے تصدیق) |
| chill اور fever کا پہلا ربرک | `COLDNESS in general` / `HEAT in general` — کتاب کے مطابق |
| `RE-ECHO` بمقابلہ `READING` (COUGH) | کتاب PDF1771 کے مطابق (ہائفن پہلے حذف) |
| ٹیسٹ | `tests/rubrics_ur_v107.test.js` — ALL PASS |

---

## 6. آگے کام کرنے والے کے لیے (ورک فلو)

1. **نئے باب کا کام اسی ترتیب پر ہوگا** — برآمد (TSV)، ریویو اور ایپ کی ترتیب تینوں ایک ہی `_repSortTreeKentOrder` سے آتی ہیں،
   اِس لیے جو سطر TSV میں اوپر ہوگی وہی ایپ میں بھی اوپر ہوگی۔
2. اگر کسی باب میں کوئی ربرک **پھر بھی غلط جگہ** لگے تو پہلے اُس کا لیبل دیکھیں:
   - موازنہ کریں کتاب سے (`homeoint.org` کی کینٹ ریپرٹری یا اصل PDF، صفحہ = PDF صفحہ − 34)؛
   - اگر لیبل میں کوئی خاص علامت ہو (ہائفن، Æ، «in general»، «See …») تو اوپر کے قاعدے کے مطابق کلید بدلے گی۔
3. کتاب کے صفحہ نمبر کا نقشہ (PDF صفحہ = کتابی صفحہ + 34): RECTUM PDF1343 · STOOL 1407 · BLADDER 1424 · KIDNEYS 1461 · URETHRA 1478 ·
   URINE 1505 · GENITALIA MALE 1529 · COUGH 1721 · STOMACH 1059 · ABDOMEN 1194 · BACK 1953 · EXTREMITIES 2107 · CHILL 2804 ·
   FEVER 2838 · SKIN 2883 · GENERALITIES 2946۔
4. کوڈ بدلنے سے پہلے منظوری لیں (یہ فارمولا: کوئی تبدیلی → `?v=` بڑھائیں، `CACHE_NAME` بڑھائیں، ٹیسٹ چلائیں، رپورٹ بنائیں)۔
