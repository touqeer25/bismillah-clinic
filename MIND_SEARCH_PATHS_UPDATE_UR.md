# Kent MIND — سرچ میں مکمل tree paths (v144)

## طے شدہ source

صارف کی تصدیق کے مطابق **Kent/Homeoint کی موجودہ MIND کتابی hierarchy اور data** اصل ماخذ ہیں۔ Complete Dynamics / Complete Repertory 2026 کی تصویر صرف search-result کی semicolon breadcrumb پیشکش کی مثال ہے؛ اس کے remedies، counts یا اضافی hierarchy کو Kent data میں import نہیں کیا گیا۔

## کیا بدلا

- `tools/build_kent_mind_search_paths.js` موجودہ `rep-chapters.js` tree parser اور Kent v143 ordering/fix چلا کر `kent_search_paths/mind.json` بناتا ہے۔
- Sidecar میں **4,683 visible MIND rubrics** کے مکمل parent-label paths اور depth-first book-tree order محفوظ ہیں۔ 151 synthetic/twin anchors موجودہ Kent search کی طرح خارج ہیں۔ Sidecar میں remedies یا grades نہیں؛ وہ اصل `kent_chapters/mind.json` سے ہی پڑھے جاتے ہیں۔
- Kent/MIND کے search results اب، مثلاً، `MIND; ANGER, irascibility; morning` کی شکل میں مکمل hierarchy دکھاتے ہیں، پورا path truncate نہیں ہوتا، اور MIND کے matching results Kent book-tree order میں آتے ہیں۔ Text matching، rubric IDs، remedy badges اور rubric پر navigation برقرار ہیں۔
- تبدیلی صرف **search-result rendering** میں ہے۔ `rep-tree.js`, `rep-folders.js`, Kent chapter JSON اور v143 book-style tree fixes تبدیل نہیں کیے گئے؛ repertory view اپنی موجودہ کتابی presentation ہی رکھتا ہے۔ Service worker cache میں sidecar شامل ہے تاکہ offline app اسے پڑھ سکے۔

## تصدیق

- `node tools/build_kent_mind_search_paths.js --check` — sidecar تازہ ہے۔
- `node tests/kent_mind_search_paths_v144.test.js` — sidecar coverage، path rendering/escaping، ترتیب اور source separation کامیاب۔
- `node tests/kent_mind_search_flow_v144.test.js` — حقیقی Kent MIND data کے ساتھ end-to-end `anger` search کامیاب: **68 Kent MIND matches**، ہر نتیجے میں مکمل breadcrumb، ترتیب مستحکم۔
- `JSDOM_PATH=/tmp/jsd/node_modules/jsdom node tests/kent_tree_fix_v143.test.js` — تمام 37 Kent chapters کی کتابی tree integrity، MIND order اور remedy/grade حفاظت کامیاب۔
- موجودہ `tests/repertory_ui.jsdom.test.js` میں 4 analysis/coverage assertions ناکام ہوئیں؛ وہی ناکامیاں اصل `rep-search.js` بحال کرکے baseline پر بھی آئیں، اس لیے یہ اس تبدیلی سے متعلق نہیں۔ باقی UI assertions پاس ہوئیں۔

> Complete Repertory 2026 کے screenshot میں `anger` کے 766 نتائج تھے؛ وہ مختلف repertory/version ہے۔ یہاں 68 نتائج موجودہ Kent MIND data کے مطابق ہیں—اس تبدیلی کا مقصد تعداد برابر کرنا نہیں، بلکہ Kent search کے ہر نتیجے کا مکمل parent context دکھانا ہے۔

## دوبارہ بنانا اور test کرنا

Repository root سے:

```bash
node tools/build_kent_mind_search_paths.js
node tools/build_kent_mind_search_paths.js --check
node tests/kent_mind_search_paths_v144.test.js
node tests/kent_mind_search_flow_v144.test.js
```

Update ZIP میں صرف تبدیل/نئی فائلیں ہیں؛ اسے مکمل repository کے root میں extract/merge کریں۔ یہ update upstream GitHub پر push/commit نہیں کی گئی۔
