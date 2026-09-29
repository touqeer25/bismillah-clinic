# v107 — 🌳 ربرک کی سطح کا اردو جملہ (MIND پائلٹ ۷۰۸ ربرک)

**تاریخ:** ۲۹ ستمبر ۲۰۲۶ · **کیش:** `bhc-clinic-v107` · **پچھلا:** v106

## یہ زپ کیسے لگائیں
1. زپ کو ریپو کی **جڑ** میں کھولیں — ہر فائل اپنی جگہ پر بیٹھ جائے گی (پرانی فائلیں بدل جائیں گی)۔
2. `git add -A && git commit -m "v107: rubric-level Urdu (MIND pilot 708)" && git push`
3. براؤزر میں **دو بار `Ctrl+Shift+R`** (سروس ورکر بدلا ہے)۔

## کیا بدلا — ایک نظر میں
| | پہلے (v106) | اب (v107) |
|---|---|---|
| صف پر اردو | ٹکڑے کا لغوی ترجمہ: `ANGER › consoled, when` پر «تسلی دیا جانے پر» | **پورا مطلب، بنیاد پہلے:** «<span style="color:#9db07f">غصہ — </span>**تسلی دینے پر**» |
| ذریعہ | `ur/rubric_labels_ur.json` (لیبل) | **`ur/rubrics/kent/mind.json`** (ربرک = پورا راستہ) — نہ ملے تو پرانا نظام خود چل پڑتا ہے |
| ٹول بار | — | نیا بٹن **«📖 پورا مطلب» ⇄ «✂ صرف اضافہ»** (یاد رہتا ہے) |
| ربرک کا صفحہ / تفریق / کلپ بورڈ | الٹی ترتیب کا خودکار جملہ | **ہاتھ کا جملہ** سب سے پہلے |
| MIND | ۶۵.۵٪ لیبل کوریج (دعویٰ «۷۷۵ مکمل» غلط تھا) | **۷۰۸ / ۴,۸۳۴ ربرک** کا جملہ (ABANDONED … CONFUSION) |

## نئی / بدلی فائلیں
```
index.html                      ?v=107 (rep-tree, 17-rubric-ur, 18-rubrics-ur, rubrics-ur.css) + بٹن #repUrModeBtn
service-worker.js               CACHE_NAME v107 + تین نئی فائلیں
js/18-rubrics-ur.js             🆕 ربرک-سطح کی پرت (کلید، لوڈ، بنیاد/اضافہ، موڈ بٹن)
js/repertory/rep-tree.js        صف پر پہلے ربرک-جملہ؛ باب کھلنے پر فائل منگوانا
js/17-rubric-ur.js              repRubricUrFull → پہلے ہاتھ کا جملہ
css/rubrics-ur.css              🆕 سجاوٹ (بنیاد ہلکی، اضافہ نمایاں، بٹن)
ur/rubrics/kent/mind.json       🆕 ۷۰۸ جملے (قفل ۰ — نظرثانی کے بعد)
ur/rubrics/kent/mind_batch1.tsv 🆕 بیچ ۷ کی ماخذ TSV
ur/BATCH_7_REVIEW.md            🆕 ڈاکٹر کی نظرثانی کے لیے — ۷۰۸ قطاریں، «اصلاح» کا خانہ خالی
tools/rubrics_ur_lib.js         🆕 مشترکہ (ایپ کا اصل کوڈ jsdom میں — کلید ایک ہی)
tools/export_rubrics_ur.js      🆕 باب کے ربرک TSV میں (ٹری کی ترتیب)
tools/merge_rubrics_ur.js       🆕 ضم (والد+اضافہ خود جوڑے؛ قفل کا احترام؛ --lock)
tools/qa_rubrics_ur.js          🆕 باب جیسا دکھے گا + مشتبہ جملے
tools/coverage_rubrics_ur.js    🆕 باب بہ باب کوریج
tests/rubrics_ur_v107.test.js   🆕 ۳۵ جانچیں — سب پاس
docs/ur_audit/                  🆕 آڈٹ رپورٹ، خاندانی درخت کا جائزہ، دکھانے کے انداز کا نمونہ، ۴ TSV
HANDOFF.md                      v107 حصہ §۴.۱۱، غلط دعوے درست، جال کی میز میں نئے اندراج
```

## ٹیسٹ (چلائے گئے)
- `tests/rubrics_ur_v107.test.js` — 35/35 پاس
- `tests/rubric_ur_v101.test.js`، `repertory_ui.jsdom`، `differentiation.jsdom`، `tree_view_integrity.jsdom` (355,172 جانچیں) — پاس
- پوری ایپ jsdom میں: 300 صفوں پر 300 ربرک-جملے، بٹن سے موڈ بدلتا ہے، ربرک کے صفحے پر «غصہ — تسلی دینے پر»، انگریزی زبان میں کچھ نہیں دکھتا، لوڈ پر نئی فائلوں کی کوئی خرابی نہیں
- `data_separation_v94`، `library_boger_v77`، `materia_medica`، `synthesis_tree_v80` یہاں ENOENT دیتے ہیں (مقامی نقل میں `data/`، `mm/`، `library/`، synthesis ابواب نہیں تھے) — کوڈ کی خرابی نہیں

## آپ سے درکار
1. **`ur/BATCH_7_REVIEW.md`** پڑھیں — جو جملہ غلط لگے، آخری خانے میں درست لکھ دیں (پورا جملہ یا صرف اضافہ)۔ واپس دیں تو ضم + قفل ہوگا۔
2. تین فیصلے: Delusions = «وہم» یا «مغالطہ»؟ · اوقات «رات ۴ بجے»/«سہ پہر ۵ بجے» منظور؟ · مذکر عمومی، مؤنث صرف جہاں کینٹ نے she/her لکھا — منظور؟

## اگلی نشست
MIND کے باقی ۴,۱۲۶ ربرک (CONSCIENTIOUS → YIELDING)، ≈۷۰۰ فی نشست — طریقہ HANDOFF §۴.۱۱ میں۔
