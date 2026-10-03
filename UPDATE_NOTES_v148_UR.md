# تازہ کاری — نسخہ 148

## سرچ نتائج کی شکل

- دونوں سرچ رینڈرر—عام تلاش اور تمام ریپرٹریز کی تدریجی تلاش—اب کارڈوں کے بجائے سادہ، کتابی فہرست دکھاتے ہیں۔ باب کا عنوان ایک گروپ سرخی میں آتا ہے؛ ہر ربرک ایک الگ فہرستی سطر ہے۔
- ربرک کی سطر پر کلک کرنے سے متعلقہ باب اور ربرک کھلتی ہے۔ دوا کی گنتی، موازنہ کے انتخاب اور درجے برقرار ہیں۔
- اوپر کا `💊` بٹن تلاش میں بھی کام کرتا ہے: پہلے کلک پر ادویات چھپتی ہیں، اگلے پر دوبارہ دکھتی ہیں۔ یہی حالت عام اور تمام ریپرٹریز کے نتائج پر لاگو ہے؛ تلاش کا صفحہ درخت سے تبدیل نہیں ہوتا۔
- تمام ریپرٹریز کے تدریجی نتائج میں موازنہ موڈ بدلنے پر موجودہ فہرست برقرار رہتی ہے اور قطاروں کے انتخابی بٹن تازہ ہوتے ہیں۔

## برقرار دائرہ اور ماخذ

- یہ تبدیلی نمائش تک محدود ہے؛ کینٹ کے ذہنی باب کے ریکارڈ، ادویات، درجات، ترجمے، تلاش کی مماثلت اور دوسرے ابواب کے مواد میں تبدیلی نہیں کی گئی۔
- منظور شدہ صفحہ 8 کا درختی راستہ برقرار ہے: `r284` «ANXIETY / sleep / before»، اس کے نیچے صرف `r285` «evening»، جبکہ `r286` تا `r291` «sleep» کے براہِ راست بچے ہیں۔ `r292` اصل ANXIETY سطح پر رہتا ہے۔
- درختی نمائش کی خرابی درست کی: نظر آنے والا راستہ `displayPathTitle` سے اور اصل ترجمہ-کلید `pathTitle`/`translationTitle` سے آتی ہے۔ شناختی راستہ نقشہ بھی یہی علیحدگی رکھتا ہے؛ ماخذی عنوان، والد، دوا یا درجہ تبدیل نہیں ہوا۔ نئی `B16` جانچ چھ ربرکس کے درختی اور شناختی راستے، دونوں کی تصدیق کرتی ہے۔
- کینٹ کے ذہنی باب میں جڑ ربرک کا `(See …)` حوالہ درخت اور سرچ فہرست کی نمائش سے خارج ہے؛ اصل ریکارڈ اور بچے کے اپنے کراس حوالہ جوں کے توں ہیں۔

## نسخہ اور متعلقہ فائلیں

```text
index.html: rep-folders.js?v=81 · rep-tree.js?v=148 · rep-rubric-detail.js?v=104
         rep-search.js?v=148 · rep-compare-mode.js?v=81
css/rep-search-results.css?v=1
service-worker.js: bhc-clinic-v148

js/repertory/rep-folders.js
js/repertory/rep-tree.js
js/repertory/rep-rubric-detail.js
js/repertory/rep-search.js
js/repertory/rep-compare-mode.js
css/rep-search-results.css
service-worker.js
```

## کامیاب جانچ

```text
node tests/search_results_list_v148.test.js
node tests/kent_mind_search_flow_v145.test.js
node tests/kent_mind_search_paths_v145.test.js
node tests/kent_mind_crossref_display.test.js
node tools/build_kent_mind_search_paths.js --check
node tests/kent_mind_homeoint_source.test.js
node tests/kent_mind_urdu_translation_render.test.js
JSDOM_PATH=/tmp/jsd/node_modules/jsdom node tests/kent_tree_fix_v145.test.js
JSDOM_PATH=/tmp/jsd/node_modules/jsdom node tests/tree_view_integrity.jsdom.test.js kent
JSDOM_PATH=/tmp/jsd/node_modules/jsdom node tests/rubrics_ur_v107.test.js
python3 tools/rekey_kent_mind_translation.py --check
python3 tests/test_kent_mind_translation_rekey.py
```

نئی فہرست جانچ میں عام/تمام ریپرٹریز کا نمونہ، ادویات کا دو مرحلوں والا ٹوگل، جڑ حوالہ کی عدم نمائش اور تدریجی نتائج میں موازنہ تازہ کرنا شامل ہے۔ کینٹ ذہنی باب کے `anger` تلاش میں 162 نتائج اور مکمل راستے برقرار رہے؛ ماخذی جانچ نے 4,356 ربرکس، 4,136 دوا والے، 220 خالی اور 30,787 دوا/درجہ اندراجات کی تصدیق کی۔

درختی جانچ `B16` میں پہلے نظر آنے والا راستہ درست مگر قطار کا `full` پرانا نکلا۔ مسئلہ ماخذی درخت میں نہیں، پرانی فہرستی نمائش میں تھا: وہ `displayPathTitle` کے بجائے `pathTitle` پڑھ رہی تھی۔ درست فہرستی رینڈر اور شناختی نقشہ لگانے کے بعد `B16` پاس ہوا؛ دکھائی جانے والی راہ نئی درختی جگہ سے اور اردو ترجمہ اصل عنوانی کلید سے آتا ہے۔ کینٹ کے تمام 37 ابواب کی درختی ساخت کی 347,037 پڑتالیں بھی کامیاب ہوئیں۔

## ماحول کی حد

`jsdom@26.1.0` صرف عارضی `/tmp/jsd` میں نصب ہے، زپ میں نہیں۔ اس کے ساتھ `kent_tree_fix_v145` کی تمام جانچیں، `tree_view_integrity` کی 347,037 پڑتالیں اور ذہنی باب کے اردو ٹیسٹ کامیاب ہوئے۔ عمومی اردو ٹیسٹ میں باقی 36 ابواب کی ترجمہ فائلیں نہ ہونے سے ان کا حصہ خودکار طور پر چھوڑا گیا؛ MIND کی تمام مخصوص پڑتالیں مکمل ہوئیں۔

## ترسیلی زپ اور ڈاؤن لوڈ

نسخہ 148 کی زپ دوبارہ بنائی گئی؛ اس میں 45 فائلیں ہیں۔ زپ کی سالمیت اور ہر اندراج کی ورک اسپیس سے عین مطابقت جانچی گئی۔ ڈاؤن لوڈ راستہ `DOWNLOADS.md` میں درج ہے؛ سرور پر نسخہ 148، 147 اور 146 کے `HEAD`/`GET` جواب 200 ملے، اور تازہ زپ درست دستخط کے ساتھ پوری ڈاؤن لوڈ ہوئی۔
