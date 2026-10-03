# اپ ڈیٹ — نسخہ 146

## دائرہ

یہ تبدیلی صرف کینٹ کے ذہنی باب کے اردو ترجمہ، درخت اور تلاش کی نمائش سے متعلق ہے۔ ماخذی باب کے 4,356 ریکارڈ، 220 خالی ربرکس، دوائیں، درجات، والدین، مطبوعہ ترتیب اور تلاش کے راستے نہیں بدلے۔ دوسرے ابواب کا مواد بھی نہیں بدلا۔

## اردو ترجمہ

- مخزن کی اصل اردو فائل اور پرانے باب کی شناختی فہرست محفوظ کی گئی۔
- مستحکم پرانی شناختوں کے ذریعے 4,239 جملے موجودہ ربرک کلیدوں سے جوڑے گئے۔ 117 نئے ماخذی ربرکس کے لیے محفوظ فائل میں ترجمہ نہیں تھا؛ انہیں خالی چھوڑا گیا، کوئی نیا جملہ خودکار طور پر نہیں بنایا۔
- ضم کا اوزار محفوظ فائلوں سے نتیجہ دوبارہ بناتا ہے؛ خام فائل دوبارہ ڈاؤنلوڈ کرنے کی ضرورت نہیں۔

## درخت اور تلاش

کینٹ کے ذہنی باب میں جڑ ربرک کا `(See …)` حوالہ درخت اور تلاش کے نتیجے کی نمائش سے ہٹایا گیا ہے۔ اصل عنوان، شناخت، تلاش کا محفوظ راستہ، تلاش کی مماثلت اور اردو ترجمہ برقرار ہیں۔ ذیلی ربرکس اور دوسرے ابواب پر یہ تبدیلی لاگو نہیں۔

## متعلقہ نسخے

```text
آف لائن ذخیرہ: 146
rep-tree.js: 146
rep-search.js: 146
18-rubrics-ur.js اور اردو ترجمہ سوالی نسخہ: 143
```

## جانچیں

```text
python3 tools/rekey_kent_mind_translation.py --check
python3 tests/test_kent_mind_translation_rekey.py
node tests/kent_mind_urdu_translation_render.test.js
node tests/kent_mind_crossref_display.test.js
node tests/kent_mind_search_paths_v145.test.js
node tests/kent_mind_search_flow_v145.test.js
python3 tools/build_kent_mind_homeoint.py --check
node tools/build_kent_mind_search_paths.js --check
node tests/kent_mind_homeoint_source.test.js
JSDOM_PATH=/tmp/jsd/node_modules/jsdom node tests/kent_tree_fix_v145.test.js
JSDOM_PATH=/tmp/jsd/node_modules/jsdom node tests/tree_view_integrity.jsdom.test.js kent
```

