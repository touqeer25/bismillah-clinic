# ذہنی باب کے تلاش راستے — نسخہ 145

**آخری تجدید:** 3 اکتوبر 2026۔ اس نوٹ میں موجودہ ذہنی باب اور تلاش کے راستوں کی حالت درج ہے۔ ذیل میں نسخہ 144 کی گنتی کا ذکر صرف تاریخی ریکارڈ ہے؛ اسے موجودہ ذہنی باب کی گنتی نہ سمجھیں۔

## منظور شدہ ماخذ اور دائرہ

کینٹ کے ذہنی باب کے ربرکس، والدین، مطبوعہ ترتیب، دواؤں اور درجات کا حتمی ماخذ:

```text
http://www.homeoint.org/books/kentrep/kentmind.htm
http://www.homeoint.org/books/kentrep/kent0000.htm تا http://www.homeoint.org/books/kentrep/kent0090.htm
```

اس باب کے صفحات 1–95 سے **4,356** ماخذی ربرکس ثابت ہوئے ہیں۔ ان میں **4,136** کے ساتھ دوائیں/درجات اور **220** خالی ربرکس ہیں۔ تمام 4,356 ربرکس درخت اور تلاش دونوں میں دکھائے جاتے ہیں؛ کوئی پوشیدہ لنگر نہیں۔ دواؤں اور درجات کے لیے کسی دوسری ریپرٹری کو کینٹ کا متبادل ماخذ نہیں بنایا گیا۔

## موجودہ درخت اور تلاش

- درخت ماخذی والد کی شناخت اور مطبوعہ ترتیب سے بنتا ہے؛ عبارت کے کوما یا پرانی مصنوعی گروہ بندی سے نہیں۔ ہر ریکارڈ میں اصل لیبل، ماخذی صفحہ، والد اور ترتیب محفوظ ہیں۔
- درخت میں **527 جڑیں** اور **3,829 والد-بچے روابط** ہیں۔ ترتیب 0 سے 4,355 تک ہے۔
- صفحہ 49 کی `night`، `FRIGHTENED easily (See Starting)` کے نیچے ہے۔ صفحہ 63 کی `daytime`، `LOQUACITY (See Speech)` کے نیچے ہے۔
- تلاش کی راستہ فائل میں **4,356 راستے، 0 پوشیدہ لنگر** ہیں۔ ہر نتیجے کا مکمل والد راستہ دکھتا ہے؛ نتائج کا متن، دوا کے نشان اور ربرک پر جانا اصل باب سے ہی چلتا ہے۔
- درختی اصلاح کا نسخہ 145 ہے۔ ذہنی باب کی پرانی چھپانے، گروہ بندی اور جڑ پر منتقل کرنے کی فہرستیں خالی ہیں؛ باقی ابواب کے نقشے برقرار ہیں۔

## جانچ کے نتائج

درج ذیل جانچیں کامیاب ہیں:

```text
python3 tools/build_kent_mind_homeoint.py --check
node tools/build_kent_mind_search_paths.js --check
node tests/kent_mind_homeoint_source.test.js
node tests/kent_mind_search_paths_v145.test.js
node tests/kent_mind_search_flow_v145.test.js
JSDOM_PATH=/tmp/jsd/node_modules/jsdom node tests/kent_tree_fix_v145.test.js
```

ذہنی باب کے ماخذی ٹیسٹ نے مستقل محفوظ تمام 4,356 ریکارڈوں کو ایک بہ ایک ملایا، جن میں والد، صفحہ، عنوان، دوا اور ہر درجہ شامل ہیں۔ خام صفحات عارضی ڈائریکٹری میں رہتے ہیں؛ پارس شدہ ریکارڈ، اختصارات اور ان کے ہیش مستقل محفوظ ہیں۔

```text
kent_sources/homeoint_mind_candidates.json
kent_sources/homeoint_remedy_abbreviations.json
kent_sources/homeoint_mind_source_manifest.json
```

## متعلقہ فائلیں اور دوبارہ تیاری

```text
tools/audit_kent_mind_homeoint.py
tools/build_kent_mind_homeoint.py
tools/build_kent_mind_search_paths.js
kent_chapters/mind.json
kent_repertory.json
kent_chapters/_index.json
kent_search_paths/mind.json
js/repertory/rep-chapters.js
js/repertory/kent-tree-fix.js
```

ذہنی باب کا مواد مستقل محفوظ ماخذ سے دوبارہ بنانے کے لیے:

```text
python3 tools/build_kent_mind_homeoint.py --write
node tools/build_kent_mind_search_paths.js
```

تازہ ویب آڈٹ درکار ہو تو خام صفحات عارضی جگہ میں کھینچیں اور پارس شدہ نقل محفوظ کریں:

```text
python3 tools/audit_kent_mind_homeoint.py --save-snapshot
```

تازگی کی جانچ کے لیے دونوں بلڈر `--check` کے ساتھ چلائیں۔ دوسرے ابواب کی فائلوں میں تبدیلی نہ کریں۔ ایپ کا آف لائن ذخیرہ نسخہ 145 ہے؛ ڈیٹا کے سوالی نسخے 18، اور `index.html` میں متعلقہ اسکرپٹ نسخے تازہ کیے گئے ہیں۔

## تاریخی نوٹ — نسخہ 144

نسخہ 144 میں پرانے مقامی ذہنی باب سے 4,683 دکھائے جانے والے ربرکس کے راستے محفوظ تھے اور 151 لنگر خارج ہوتے تھے۔ یہ اعداد ماخذی مکمل آڈٹ نہیں تھے۔ نسخہ 145 نے منظور شدہ ماخذ سے ذہنی باب کی نئی 4,356 ریکارڈ فہرست بنائی، تمام خالی ربرکس سمیت؛ اس لیے پرانی تعداد اور ٹیسٹ نام موجودہ حالت کی نمائندگی نہیں کرتے۔
