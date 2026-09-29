# کینٹ ریپرٹری — مین ربرک کی حروفِ تہجی ترتیب (v131)

تاریخ: 30 ستمبر 2026 · یہ رپورٹ خودکار طور پر `tests/` اور ایپ کے اصل کوڈ سے بنی ہے (کوئی اندازہ نہیں، براہِ راست گنتی)۔
طریقہ کار مکمل: `js/repertory/KENT_ORDER_METHOD.md`۔

## 1. ایک نظر میں

- ابواب: 37 · کل ربرک قطاریں: **71,027** (v130 کے برابر — کوئی سطر کم/زیادہ نہیں، کوئی ترجمہ یا کلید نہیں چھیڑی گئی)۔
- مین ربرک (جڑ): 4,709 — v130 میں بھی 4,709 تھے (کوئی ربرک گم نہیں ہوا)۔
- اِن میں سے **2,652 مین ربرک اپنی جگہ بدل کر حروفِ تہجی میں آ گئے** (کتاب کے مطابق)۔
- وجہ: v130 تک مین ربرک بھی ڈیٹا کی (r-id) ترتیب پر تھے؛ اُن میں وہ ربرک جو ڈیٹا میں بعد میں جُڑے تھے
  (مثلاً rectum کا `ASH-COLORED (See Gray)` — یہ اصل میں STOOL کا ربرک ہے) باب کے آخری سرے پر پڑے رہتے تھے۔

## 2. کیا بدلا — فی باب

| باب | مین ربرک | اپنی جگہ پر آئے | مثال |
|---|---|---|---|
| mind | 557 | 481 | CLAIRVOYANCE |
| generalities | 291 | 278 | ANAEMIA |
| extremities | 283 | 242 | ABDUCTED |
| mouth | 178 | 171 | BITE, together, desire to (See Clinch) |
| cough | 374 | 146 | LYING |
| vertigo | 175 | 144 | MORNING |
| abdomen | 135 | 135 | ABSCESS |
| chest | 174 | 124 | CRACKING in sternum on bending chest backwards |
| expectoration | 117 | 102 | MORNING |
| rectum | 101 | 99 | ASH-COLORED (See Gray) |
| vision | 100 | 95 | BLEEDING (See Discharges) |
| chill | 109 | 88 | AUTUMN and spring |
| stomach | 104 | 85 | AVERSION |
| stool | 85 | 84 | AIR passes (See Gas) |
| throat | 114 | 76 | ENLARGEMENT of tonsils |
| eye | 204 | 74 | COLDNESS |
| perspiration | 96 | 46 | INTERMITTENT |
| genitalia_female | 103 | 38 | ABORTION |
| back | 87 | 37 | OPISTHOTONOS |
| skin | 102 | 29 | INELASTICITY |
| head | 178 | 24 | FALLING |
| kidneys | 19 | 12 | HEAT |
| larynx_and_trachea | 78 | 10 | IRRITATION |
| bladder | 62 | 8 | HÆMORRHAGE (See Urine, Bloody) |
| urethra | 53 | 7 | HAEMORRHAGE |
| fever | 101 | 6 | ALTERNATING with |
| ear | 93 | 5 | ITCHING |
| face | 143 | 4 | PAIN, bruised (See Sore) |
| urine | 42 | 2 | ODOR |

## 3. اصل مسئلہ اور حل (کتاب سے ثابت)

کینٹ کی کتاب میں مین ربرک حروفِ تہجی سے ہیں (`ABSCESS → ADHESION → ALIVE → ANEURISM → ANXIETY …`) —
مگر ہمارے ڈیٹا میں چند ربرک باب کے آخری سرے پر لگے ہوئے تھے۔ v131 میں جڑ کی سطح کو حروفِ تہجی کی ترتیب دی گئی:

1. `[0]` «… in general» سب سے اوپر — مگر صرف اُس وقت جب وہ کتاب میں اسی باب کا **پہلا** ربرک ہو
   (CHILL کا `COLDNESS in general` اور FEVER کا `HEAT in general` — دونوں باب کے آغاز پر ہیں)۔
2. `[1]` وقت کا بلاک (`DAYTIME → MORNING → FORENOON → NOON → AFTERNOON → EVENING → NIGHT → MIDNIGHT`) —
   اُن ابواب میں پہلے جہاں کتاب نے وقت کو مقدم کیا (COUGH، VERTIGO، CHILL، FEVER، GENERALITIES)۔
3. `[2]` باقی سب — حروفِ تہجی سے (`(See …)` حصہ کلید سے نکال دیا جاتا ہے، `Æ → AE`، ہائفن پہلے حذف)۔

### نکات جو ثابت ہوئے

- rectum: `ABSCESS · APHTHOUS condition of anus · **ASH-COLORED (See Gray)** · BALL in rectum, sensation of · BLACK …`
  — پہلے یہ باب کے آخری سرے پر تھا (STOOL کا اضافی ربرک)؛ اب #2 پر (تصدیق: STOOL کا ربرک، کتاب صفحہ 1372 / PDF1406)۔
- kidneys: `ABSCESS · ADDISON'S disease · BUBBLING sensation in region of · CATARRH · COLD sensation · FLUTTERING … HEAT · HEAVINESS · INFLAMMATION` (کتاب PDF1460)۔
- back: `BOILS (See Eruptions) · BROWN · BROWN spots on · BRUISES on spine` (کتاب PDF1953)۔
- generalities: پہلا ربرک `DAYTIME` (کتاب کا آغاز، PDF2946) — پہلے `SWELLING in general` اوپر آ رہا تھا؛ اب وہ `SWELLING` کے فوراً بعد اپنی جگہ پر۔
- cough: `DAYTIME → MORNING → … → NIGHT` پھر `ACIDS agg. · ACRID fluid … · AFTERNOON · AGITATION · AIR …` (کتاب PDF1721–1723)۔
- expectoration: وقت کا بلاک پہلے (`MORNING · FORENOON · NOON · AFTERNOON · EVENING · NIGHT`)، پھر حروفِ تہجی (کتاب PDF1067+)۔

## 4. کیا نہیں بدلا

- `ur/rubrics/kent/*.json` — ایک بھی ترجمہ، کلید یا اندراج نہیں بدلا (71,027 قطاریں جوں کی توں)۔
- `kent_chapters/*.json`، `*_chapters/`، `mm/`، `library/`، `data/` — ان فائلوں کو ہاتھ نہیں لگایا۔
- باقی کتابیں (Repertorium Publicum، Synthesis وغیرہ) — ترتیب کا یہ قانون صرف کینٹ پر لاگو ہے۔
- ذیلی ربرک (اندرونی درجے) v130 والے قانون پر ہی ہیں: پرانے `r…` ربرک اپنی کتابی ترتیب پر،
  نئے `o…`/`m…` ربرک پروٹوکول کی جگہ پر (Side → Time → Modalities → Location → Character → Extension)۔

## 5. جانچ (ٹیسٹ)

- `tests/rubrics_ur_v107.test.js` — ALL PASS (F1–F7 کتابی ترتیب کے، G1–G7 مین ربرک کی حروفِ تہجی ترتیب کے)۔
- 37 ابواب کی قطاریں: 71,027 ± 0 · مین ربرک: 4,709 ± 0۔
- آزمائشی جگہیں کتاب کے PDF سے ملا کر دیکھی گئیں (rectum · kidneys · back · stool · vertigo · cough · expectoration · chill · fever · generalities · mind · abdomen)۔

## 6. اگلا مرحلہ

اب ہر نیا باب اسی ترتیب پر برآمد ہوگا (TSV، ریویو اور ایپ — تینوں جگہ ایک ہی ترتیب)، اِس لیے
**GENITALIA FEMALE** (1,471 ربرک) سے کام کتابی ترتیب پر ہی آگے بڑھے گا۔
