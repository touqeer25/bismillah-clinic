# کینٹ ریپرٹری — ترتیب کی درستی: تشخیص + تصدیق + عمل

تاریخ: 30 ستمبر 2026 · حیثیت: **v130 میں نافذ ہو گیا** (صرف دکھانے/برآمد کی ترتیب بدلی؛ ڈیٹا اور ترجمے جوں کے توں)

## 1. ایک نظر میں

- ایپ کینٹ کے ربرک اُسی ترتیب پر دکھاتی ہے جس ترتیب سے وہ فائل میں لکھے ہیں — اور وہ فائل ترتیب کتاب کی نہیں، ایک پرانے merge سکرپٹ کی ہے (ہر سطح «سب سے چھوٹا OOREP id» کے حساب سے)۔ اسی لیے کہیں بےترتیبی لگتی ہے اور کہیں الفابیٹیکل۔
- کتاب کی اصل ترتیب ہمارے ڈیٹا میں **محفوظ ہے** — ہر پرانے ربرک کے id میں (`r87`, `r88` …)۔ صرف دکھانے کا طریقہ اُسے نظر انداز کر رہا ہے۔
- اس لیے فکس محفوظ ہے: ترتیب **دکھاتے وقت** درست ہوگی۔ فائل کا ڈیٹا، ترجمے، کلیدیں — کچھ نہیں بدلے گا؛ ربرک ایک بھی شامل/خارج نہیں ہوگا۔

## 2. کینٹ کا اپنا قانون (آپ کی پی ڈی ایف کے پیش لفظ سے)

پی ڈی ایف کے صفحہ I (PREFACE) میں کینٹ خود لکھتے ہیں:

> It has been attempted to proceed in every case from generals to particulars, and in carrying this out the aim has been to give first of all a general rubric containing all the remedies which have produced the symptoms, followed by the particulars, viz. the time of occurrence, the circumstances, and lastly the extensions. Here it may be remarked, in regard to extensions, that the point from which a certain symptom extends is the one under which that symptom will be found, never under the point to which it extends.

یعنی: ہر مقام پر **عام (general) ربرک** پہلے — جس میں تمام ادویات ہوں — اُس کے بعد تفصیلات: **پہلے وقت (time of occurrence)، پھر شرائط (circumstances)، اور سب سے آخر میں پھیلاؤ (extensions)**۔

اس کے ساتھ آپ کی تحقیق (S-T-M-E-L-C) اور کتاب کے عملی ڈیٹا کو ملا کر حتمی رُول یہ بنتا ہے:

| ترتیب | عنصر | ثبوت |
|---|---|---|
| 1 | **عام ربرک** (تمام ادویات) | کینٹ کا پیش لفظ |
| 2 | **Side** (right / left) | آپ کی تحقیق · ڈیٹا: S→T 86%، S→M 82% |
| 3 | **Time** (daytime → morning → forenoon → noon → afternoon → evening → night → midnight) | کینٹ کا پیش لفظ · ڈیٹا: T→M 85%، T→C 98%، T→L 96%، T→E 99% |
| 4 | **Modalities/شرائط** (حروفِ تہجی سے: bed in, coughing when, eating after …) | پیش لفظ + ڈیٹا (M→L 64%) |
| 5 | **Location** (penis, scrotum, testes …) | ڈیٹا: L→E 96% |
| 6 | **Character** (burning, stitching …) | ڈیٹا: C→E 71% |
| 7 | **Extension** (extending/radiating …) — **سب سے آخر** | کینٹ کا پیش لفظ: «and lastly the extensions» |

نوٹ: مین ربرک عموماً حروفِ تہجی سے ہوتے ہیں؛ **7 ابواب** میں سب سے پہلے وقت کا بلاک آتا ہے (`cough`, `expectoration`, `chill`, `fever`, `generalities`, `perspiration`, `vertigo`) — یہی وہ استثنائی ابواب ہیں جو عام کتابوں میں «no strict alphabetical» کہلاتے ہیں۔

## 3. تصدیق 1 — آپ کی پی ڈی ایف: ERECTIONS (صفحہ 1497 تا 1501)

پی ڈی ایف میں GENITALIA MALE کا ERECTIONS بلاک اِس ترتیب سے چھپا ہے:

```
ERECTIONS, troublesome : Alum., am-c., am-m., anac., ant-c., arn., aur-m., aur., berb., cann-i.,
daytime : Anac., chel., clem., lach., phos., puls., sil.
morning : Agar., agn., all-c., aloe., Am-c., ambr., ars-h., ars-i., ars., asc-t., bar-c., brom., ...
only : Bar-c., pall.
standing, while : Ph-ac.
waking, on : Petr., ph-ac., pic-ac., plat., sil., sulph., thuj.
forenoon : Caps., caust., lach., nicc., ox-ac.
noon, after a nap : Nux-v.
afternoon : Carb-s., cham., lyss., nux-v., thuj.
sitting, while : Alum.
2 p.m. : Alumn.
evening : Alum., bar-c., cact., cinnb., fago., nat-s., phos.
shivering, with, with great desire : Bar-c.
night : Agar., aloe., alum., Aur., bar-c., bell., bry., calad., calc., Canth., ...
bed, when becoming warm in : Ant-c.
urinating, after : Aloe.
2 a.m. : Aloe.
child, in a : Aloe., lach., merc., tub.
coition, after : Agn., aur-s., bry., calad., cann-i., cann-s., caust., graph., grat., ...
continued : Agar., apis., arg-n., arn., bell., camph., cann-i., Canth., carb-s., ...
morning : Puls.
night : Fl-ac., nat-m., plat., sep., sin-n., thuj.
coughing, when : Cann-s., canth.
delayed : Bar-c., calc., canth., carb-s., iod., mag-c., merc-c., nit-ac., osm., par., pic-ac., sel., sil.
easy, too : Con., ferr., lyc., nux-v., phos., pic-ac., plb., rhod., sabin., sumb.
emission, after : Aloe., ars., grat., kali-c., mez., nit-ac., Ph-ac., rhod., sep.
excessive : Aur-m., Canth., cop., Fl-ac., graph., nat-m., op., ph-ac., pic-ac., staph.
lascivious thoughts, during : Cop., Pic-ac.
frequent : Agar., agn., alum., alumn., am-m., anth., anthro., apis., arund., aur-m., bell., ...
eating, after : Hyos.
old man, in an : Caust.
impetuous : Kali-c.
incomplete : Agar., Agn., arg-n., ars-i., ars., bar-c., calad., calc., camph., caust., ...
morning : Nat-c.
forenoon : Caust.
coition, during : Camph., con., form., Graph., Lyc., ph-ac., phos., sep., Sulph., ther.
penis becomes relaxed : Arg-n., nux-v., ph-ac.
lying, while : Ox-ac.
on the back : Onos.
painful (See Chordee, Urethra) : Agn., alum., ant-c., anthro., Arg-n., ...
morning : Agn., calad., nat-c., nux-v., sabad., sep., sil.
evening : Calc-p., cann-s.
night : Alum., ant-c., cact., caps., hep., merc., nat-m., nit-ac., phos.
coition, during : Hep.
after : Bry., calad., grat.
emission, after : Grat.
voluptuous dream, during : Chin.
swelling of prepuce, from : Jac-c.
riding, while : Bar-c., calc-p., cann-i., form.
with impotence at all other times : Bar-c.
seldom : Ars., carb-s., merc-c., nuph.
sexual desire, without : Agn., am-c., ambr., anac., arn., asc-t., bry., bufo., calad., ...
short : Arg-n., berb., calc., camph., carb-v., con., graph., lyc., nat-c., nux-m., ...
sleep, during : Aster., fl-ac., merc-c., nat-c., nux-v., op., rhod.
with impotence when awake : Op.
slow (See Delayed)
stool, during : Carl., ign., samb., thuj.
strong : Ars-i., Canth., cedr., cham., clem., corn., Fl-ac., graph., helon., lach., ...
pain in abdomen, with : Zinc.
supper, during : Nicc.
urinating, after : Aloe., form., lil-t., lith., nat-c., rhus-t.
violent : Agn., alum., am-c., ambr., anac., anan., arn., cann-i., canth., carb-s., ...
daytime : Sil.
```

نیچے ہمارے فکس (نمونہ) کا نتیجہ اُسی ترتیب سے — دونوں کا موازنہ:

| # | کتاب (آپ کی پی ڈی ایف، صفحہ 1497–1501) | ہمارا فکس میں اُس کا مقام | مطابقت |
|---|---|---|---|
| 1 | troublesome | ERECTIONS, troublesome | ✔ |
| 2 | daytime | ERECTIONS, daytime | ✔ |
| 3 | morning | ERECTIONS, morning | ✔ |
| 4 | only | ERECTIONS, morning, only | ✔ |
| 5 | standing, while | ERECTIONS, morning, standing, while | ✔ |
| 6 | waking, on | ERECTIONS, morning, waking, on | ✔ |
| 7 | forenoon | ERECTIONS, forenoon | ✔ |
| 8 | noon, after a nap | ERECTIONS, noon, after a nap | ✔ |
| 9 | afternoon | ERECTIONS, afternoon | ✔ |
| 10 | sitting, while | ERECTIONS, afternoon, sitting, while | ✔ |
| 11 | 2 p.m. | ERECTIONS, afternoon, 2 p.m. | ✔ |
| 12 | evening | ERECTIONS, evening | ✔ |
| 13 | shivering, with, with great desire | ERECTIONS, evening, shivering, with, with great desire | ✔ |
| 14 | night | ERECTIONS, night | ✔ |
| 15 | bed, when becoming warm in | ERECTIONS, night, bed, when becoming warm in | ✔ |
| 16 | urinating, after | ERECTIONS, night, urinating, after | ✔ |
| 17 | 2 a.m. | ERECTIONS, night, 2 a.m. | ✔ |
| 18 | child, in a | ERECTIONS, child, in a | ✔ |
| 19 | coition, after | ERECTIONS, coition, after | ✔ |
| 20 | continued | ERECTIONS, continued | ✔ |
| 21 | morning | ERECTIONS, continued, morning | ✔ |
| 22 | night | ERECTIONS, continued, night | ✔ |
| 23 | coughing, when | ERECTIONS, coughing, when | ✔ |
| 24 | delayed | ERECTIONS, delayed | ✔ |
| 25 | easy, too | ERECTIONS, easy, too | ✔ |
| 26 | emission, after | ERECTIONS, emission, after | ✔ |
| 27 | excessive | ERECTIONS, excessive | ✔ |
| 28 | lascivious thoughts, during | ERECTIONS, excessive, lascivious thoughts, during | ✔ |
| 29 | frequent | ERECTIONS, frequent | ✔ |
| 30 | eating, after | ERECTIONS, frequent, eating, after | ✔ |
| 31 | old man, in an | ERECTIONS, frequent, old man, in an | ✔ |
| 32 | impetuous | ERECTIONS, impetuous | ✔ |
| 33 | incomplete | ERECTIONS, incomplete | ✔ |
| 34 | morning | ERECTIONS, incomplete, morning | ✔ |
| 35 | forenoon | ERECTIONS, incomplete, forenoon | ✔ |
| 36 | coition, during | ERECTIONS, incomplete, coition, during | ✔ |
| 37 | penis becomes relaxed | ERECTIONS, incomplete, penis becomes relaxed | ✔ |
| 38 | lying, while | ERECTIONS, lying, while | ✔ |
| 39 | on the back | ERECTIONS, lying, on the back | ✔ |
| 40 | painful (See Chordee, Urethra) | — (نہیں ملا) | ✘ |
| 41 | morning | ERECTIONS, painful, morning | ✔ |
| 42 | evening | ERECTIONS, painful, evening | ✔ |
| 43 | night | ERECTIONS, painful, night | ✔ |
| 44 | coition, during | ERECTIONS, painful, night, coition, during | ✔ |
| 45 | after | ERECTIONS, painful, night, coition, after | ✔ |
| 46 | emission, after | ERECTIONS, painful, night, emission, after | ✔ |
| 47 | voluptuous dream, during | ERECTIONS, painful, night, voluptuous dream, during | ✔ |
| 48 | swelling of prepuce, from | ERECTIONS, swelling of prepuce, from | ✔ |
| 49 | riding, while | ERECTIONS, riding, while | ✔ |
| 50 | with impotence at all other times | ERECTIONS, riding, while, with impotence at all other times | ✔ |
| 51 | seldom | ERECTIONS, seldom | ✔ |
| 52 | sexual desire, without | ERECTIONS, sexual desire, without | ✔ |
| 53 | short | ERECTIONS, short | ✔ |
| 54 | sleep, during | ERECTIONS, sleep, during | ✔ |
| 55 | with impotence when awake | ERECTIONS, sleep, during, with impotence when awake | ✔ |
| 56 | slow (See Delayed) | ERECTIONS, slow (See Delayed) | ✔ |
| 57 | stool, during | ERECTIONS, stool, during | ✔ |
| 58 | strong | ERECTIONS, strong | ✔ |
| 59 | pain in abdomen, with | ERECTIONS, strong, pain in abdomen, with | ✔ |
| 60 | supper, during | ERECTIONS, supper, during | ✔ |
| 61 | urinating, after | ERECTIONS, urinating, after | ✔ |
| 62 | violent | ERECTIONS, violent | ✔ |
| 63 | daytime | ERECTIONS, violent, daytime | ✔ |

- کتاب کی 63 سطروں میں سے **62** اپنی درست جگہ پر ملیں · جو نہیں ملیں: **1**
- جو ایک سطر نہ ملی: کتاب میں «painful (See Chordee, Urethra)» لکھا ہے اور ہمارے ڈیٹا میں لیبل صرف «painful» ہے — یعنی یہ ترتیب کا نہیں، لیبل کے کوٹ (See…) کا فرق ہے، اور اُس کا مقام بھی درست ہے (سطر 45 دیکھیں)۔
- ہمارے فکس میں 5 اضافی سطریں ہیں جو اِس نکالی ہوئی فہرست میں نہیں — یہ زیادہ تر والد ربرک (جیسے ERECTIONS خود) اور نئے OOREP ربرک ہیں، جو کتاب میں موجود مگر اِس فہرست میں درج نہیں تھے: ERECTIONS · ERECTIONS, lying · ERECTIONS, painful · ERECTIONS, painful, night, coition

## 4. تصدیق 2 — دو باریک نمونے (صفحہ 1495 تا 1496)

**COLDNESS** — پی ڈی ایف میں: `COLDNESS → morning → evening → urination, during → Penis → Scrotum → Testes`

```
COLDNESS : Agar., Agn., aloe., berb., brom., calad., camph., cann-s., caps., carb-s., ...
morning : Sulph.
evening : Dios.
urination, during : Iris.
Penis : Agar., Agn., bar-c., berb., caps., dios., indg., Lyc., merc., onos., sulph.
glans : Berb., merc., onos., sulph.
prepuce : Berb., sulph., zinc., zing.
Scrotum : Aloe., berb., brom., caps., dios., iris., merc.
morning, on waking : Caps.
Testes : Agn., aloe., berb., brom., camph., caps., cer-s., gels., merc., zinc.
left : Brom.
evening : Aloe., merc.
night : Agn., aloe.
```

ہمارے ڈیٹا میں باریک بچے: `r29` morning · `r30` evening · **`r31` COLDNESS, urination, during** · `r32` penis · `r35` scrotum · `r37` testes — یعنی پرانے id کے حساب سے (r29 → r30 → r31 → r32 → r35 → r37) بالکل وہی ترتیب بنتی ہے جو کتاب میں ہے: وقت → شرط → محل۔

**CONDYLOMATA** — پی ڈی ایف میں: `CONDYLOMATA → anus, and → bleed easily → fetid, bleeding when touched → hot → itching → sensitive → smelling like stale cheese → soft → sticking pain → Penis → Scrotum`

```
CONDYLOMATA : Alum., apis., arg-n., aur-m-n., aur-m., aur., calc., cinnb., euphr., fl-ac., Hep., ...
anus, and : Nit-ac.
bleed easily : Calc., cinnb., med., mill., Nit-ac., sulph., thuj.
fetid, bleeding when touched : Cinnb., Nit-ac., thuj.
hot : Ph-ac.
itching : Lyc., psor., sabin., staph., thuj.
sensitive : Staph.
smelling like stale cheese : Calc., hep., sanic., thuj.
soft : Sep.
sticking pain : Nit-ac.
Penis : Alumn., apis., bell., calc., Cinnb., euphr., hep., lac-c., ...
Scrotum : Aur-m., aur., sil., Thuj.
```

ہمارے ڈیٹا میں: `r42` anus, and · `r43` bleed easily · `r45` hot · `r46` itching · `r47` sensitive · `r48` smelling like stale cheese · `r49` soft · `r50` sticking pain · `r51` penis · `r66` scrotum — یعنی ترتیب عین وہی نکلتی ہے۔

یہی چیز ثابت کرتی ہے کہ **id ترتیب = کتاب کی ترتیب**، اور فکس صرف اُسے استعمال کر رہا ہے۔

## 5. اعدادوشمار

- کل ابواب: 37 · کل ربرک قطاریں: 71,027
- 2 یا زیادہ بچوں والے گروپ: 7,831 · اِن میں ترتیب درست ہوگی: 4,077 (52.1%)
- قطاریں جو بدلے ہوئے گروپوں میں ہیں: 34,931 (49.2%)
- ربرک کم/زیادہ: **0** — دونوں طرف 71,027 قطاریں (ہر باب پر جانچا گیا)۔

| باب | گروپ | اب بدلیں گے | قطاریں |
|---|---|---|---|
| genitalia_male | 144 | 64 | 1,118 |
| rectum | 154 | 89 | 1,332 |
| urine | 40 | 20 | 408 |
| stomach | 357 | 200 | 3,213 |
| face | 249 | 139 | 2,098 |
| abdomen | 429 | 243 | 3,592 |
| mind | 445 | 213 | 4,834 |
| extremities | 1781 | 967 | 16,057 |

## 6. کیا بدلا (v130)

1. ایک نئی فائل بنی — `js/repertory/rep-chapters.js` کے اندر ہی (کوئی نئی فائل نہیں)۔
2. طریقہ: ٹری بننے کے بعد ہر والد کے بچوں کو ترتیب دی جائے گی —
   - پرانے ربرک (`r…`) اپنے id کے حساب سے (یعنی کتابی ترتیب)،
   - نئے ربرک (`o…`/`m…`) پروٹوکول کی جگہ پر: Side → Time → Modalities → Location → Character → Extension۔
3. صرف کینٹ پر لاگو؛ باقی تمام کتابوں کا رویہ جوں کا توں۔
4. `index.html` میں `rep-chapters.js?v=130` اور `service-worker.js` میں `CACHE_NAME=bhc-clinic-v130` — پرانا محفوظ ٹری نہ دکھے۔
5. ٹیسٹ چلیں گے؛ برآمد/ریویو کے اوزار بھی خودبخود کتابی ترتیب میں TSV نکالیں گے (اگلی ابواب کی ریویو اسی ترتیب پر ہوگی)۔

**کیا نہیں بدلے گا:** `ur/rubrics/kent/*.json` کا کوئی اندراج، کوئی کلید، کوئی ترجمہ — اور `kent_chapters/` کی کوئی فائل۔ (ترجمہ کا جوڑ پوری انگریزی سطر سے بنتا ہے، ترتیب سے نہیں — اسی لیے آدھا کام محفوظ ہے۔)

## 7. فیصلہ درکار

v130 نافذ ہو گیا (ٹیسٹ: سب پاس · 37 ابواب کی قطاریں جوں کی توں 71,027 · ERECTIONS کتاب سے ملایا گیا)۔

اگلا قدم: **GENITALIA FEMALE** — اب ترجمہ کتابی ترتیب پر ہوگا، اور برآمد/ریویو فائلیں بھی اُسی ترتیب میں نکلیں گی۔

**ایک بات نوٹ کر لیں:** ڈیٹا میں چند ربرک ایسے ہیں جو کتاب کے اُس باب میں چھپے ہی نہیں (مثلاً rectum میں آخر میں `ASH-COLORED (See Gray)`، جو اصل میں STOOL کا ربرک ہے) — ایسے ربرک باب کے آخر میں ہی رہیں گے۔ یہ ترتیب کا نقص نہیں بلکہ فائل ڈیٹا کی بات ہے؛ کہیں تو الگ سے صاف کر دیں گے۔
