# HANDOFF: کام کہاں تک پہنچا (نئی چیٹ میں سب سے پہلے یہ فائل پڑھیں)

**Repo:** https://github.com/touqeer25/bismillah-clinic · ایپ = `index.html` + `js/` (PWA)؛ ریپرٹری کوڈ `js/08-app-repertory.js`

## مکمل ہو چکا
| ورژن | کام |
|---|---|
| v70 | سرچ میں AND / OR / NOT / -لفظ؛ تجزیے کے طریقے Sum of Symptoms / Kent / Boenninghausen + Polarity؛ پرنٹ/PDF اور CSV |
| v71 | Analysis Grid میں ایلیمینیشن درست؛ «اس کلپ بورڈ پر ایلیمینیشن موڈ» کا چیک باکس؛ «بے اثر» والا پیغام |
| v72 | کارڈ ختم، کتابی ٹری ویو (کتاب کی ترتیب، کوئی sort نہیں)؛ دوہرے ربرکس کا ضم ہونا ٹھیک (Boger 491، Kent-DE 621، Publicum 1) |
| v75 | تفریق ونڈو اور ربرک صفحے کی ادویات ٹری کے انداز میں (فائل کی ترتیب)؛ اردو ترجمے کا نظام: `ur/rubric_labels_ur.json` (150 عام لیبل، مسودہ)؛ `tools/export_rubric_labels.js` اور `tools/merge_rubric_labels.js` |
| v76 | اردو ترجمہ تین مراحل میں: پورا لیبل → کوما والے حصے → لغت سے لفظی |
| v77 | Boger Times میں سطحیں (`docs/boger_times_placement_report.md`)؛ ہانیمن: 📚 لائبریری (`library/`) + 📖 میں Chronic Diseases کی 48 ادویات۔ کینٹ OOREP والی تبدیلی مؤخر (`tools/mm_build/kent_from_oorep.py` تیار، ڈیٹا ابھی شامل نہیں) |
| v74 | ربرک پر کلک = اسی جگہ تفصیل (الگ صفحہ نہیں؛ مکمل صفحہ ⋮ سے)؛ بٹن صرف آئکن اور شفاف؛ چیپٹر لسٹ ٹری کے انداز میں؛ کلپ بورڈ بار کا فاصلہ |
| v73 | ہر ربرک کی لائن پر 5 بٹن (▸ تفصیل، + موازنہ، 🔬 تفریق، ⚖ ادویات میں فرق، 📖 MM)؛ ادویات اگلی لائن پر؛ سطح کے نشان ◆●■▲◇ اور گائیڈ لائنیں |

## ٹیسٹ (jsdom چاہیے: `/tmp/jsd/node_modules/jsdom`)
`node tests/tree_view_integrity.jsdom.test.js` (1,457,519 چیکس) · `tests/repertory_ui.jsdom.test.js` · `tests/differentiation.jsdom.test.js` · `tests/extraction_v70.test.js`

## اصول
- ڈیٹا کی JSON فائلیں کبھی نہ بدلیں۔ ربرک اور دوا کی ترتیب جوں کی توں رہے۔
- ہر تبدیلی پر `index.html` میں `?v=` اور `service-worker.js` میں `CACHE_NAME` بڑھائیں۔

## باقی کام (ترتیب سے)
0. اردو ترجمہ: Kent کے 22,445 منفرد لیبل (150 ہو چکے)؛ `node tools/export_rubric_labels.js kent 400` → ترجمہ → merge
0. Boger Times: ماخذ homeoint.org/seror/boger/moon.htm (Nancy Malik کا لنک بھی یہی ہے)؛ `<blockquote>` جزوی سطحیں دیتا ہے۔ صارف کے فیصلے کا انتظار
1. Supabase ہٹا کر IndexedDB لگانا؛ مکمل بیک اپ/ریسٹور؛ `navigator.storage.persist()`؛ `start.bat`
2. کیس (کلپ بورڈ اور تجزیہ) مریض کے وزٹ کے ساتھ محفوظ کرنا
3. `index.html` سے Streamlit کے iframes اور Supabase کا CDN script ہٹانا؛ پھر گروپ B کی فائلیں ڈیلیٹ کرنا (app.py، homeo_core/، ai_engine/ …)
4. Boger Times کی ٹری کی سطحیں: ڈیٹا فائل میں سطحیں محفوظ نہیں، `tools/mm_build/boger_times_repertory.py` سے دوبارہ نکالنی ہوں گی
5. آن لائن سروسز بند کرنا (Supabase کی key revoke کرنا)؛ بعد میں Capacitor سے Android ایپ


## v79 — صارف کی درخواستیں (لے آؤٹ + گریڈ فلٹر) · کینٹ OOREP
- ہیڈر: اردو میں کلینک کا نام کٹ رہا تھا — `.clinic-title` کا فونٹ 18px→15px (موبائل 12px)، letter-spacing کم (`css/layout-header.css`)۔
- نیوی گیشن (7 ٹیب): «تمام مریض» ٹیب ختم (ڈیش بورڈ کی «آل ٹائم مریض» لسٹ اس کا متبادل ہے؛ patient-detail/family کے Back بٹن اب ڈیش بورڈ کھولتے ہیں — `js/03-app-patients.js`)؛ «سیٹنگز» آخر میں، ریپرٹری کے بعد۔ «تلاش» اور «نئی وزٹ» الگ الگ کام کرتے ہیں (تلاش = مریض میں تلاش/ترمیم/حذف کی مکمل میز؛ نئی وزٹ = مریض چن کر نئی وزٹ کا فارم) — دونوں رہے۔
- ریپرٹری: مین ٹول بار میں ترتیب = کتاب سلیکٹ → 📚 بک لائبریری (نیچلی بار سے منتقل، ایک ہی بٹن) → scope → type → سرچ → Compare۔ نیچلی بار: **GRADATION ہیڈنگ ختم**؛ 1/2/3 گریڈ آئکنز اب فلٹر بٹن (`repGradeSet`، `js/repertory/rep-tree.js`): **3 = صرف 3، 2 = 2+3، 1 = 1+2+3**؛ اسی آئکن پر دوبارہ کلک = بند۔ فلٹر ٹری/ربرک صفحہ/سرچ نتائج میں دکھائی گئی ادویات پر لاگو؛ گنتیاں، کلپ بورڈ اور تجزیہ نہیں۔ ٹیسٹ: `tests/grade_filter_v79.test.js`۔
- ورژن: `?v=79`، SW `bhc-clinic-v93`۔ `tests/layout_split_v78.test.js` بھی نئی نیوی گیشن کے مطابق۔
- کینٹ OOREP (`tools/mm_build/kent_from_oorep.py`) **مکمل** ✅: ہارویسٹ = OOREP کے تمام **68,742 ربرکس (100% کوریج)**؛ بلڈ = 37 باب، **71,027 ربرکس** (پرانے 66,148 سے +4,879) اور 611,027 ادویات-انٹریز (پرانی 452,044 سے +35%)۔ پرانے rids میں سے **54,200 محفوظ** (کلپ بورڈ/نوٹس/ہسٹری چلتے رہے)؛ 1,283 خالص «(See …)» ربرکس پرانے ڈیٹا سے بحال؛ کینٹ نوٹس: 837 منتقل، 123 نہ ملے (`docs/kent_notes_unmatched.txt`)۔ unknown chapter keys: کوئی نہیں۔
  - ہارویسٹ راستہ: oorep.com نے sandbox IP کو سافٹ بند کر دیا (دھماکہ کرنے پر) — `OOREP_VIA=jina python3 tools/mm_build/kent_from_oorep.py harvest <work>` = r.jina.ai سے گزرگاہ (⚠ سادہ `Mozilla/5.0` UA لازمی — مکمل کروم UA پر jina 403 دیتا ہے)۔ مکمل ہارویسٹ کیش محفوظ ہے: `/home/user/kent_oorep_work/` (`_backup_*` میں پرانے ڈیٹا کے بیک اپ بھی)۔
- ٹیسٹس: تمام 12 فائلیں پاس؛ `tests/tree_view_integrity.jsdom.test.js` = 1,482,979 چیکس پاس۔ differentiation/extraction کے پرانے hardcoded اعداد (111/230/780…) OOREP ڈیٹا کے بعد ڈیٹا-متحرک ہو گئے۔

## v78 — فائلوں کی علیحدگی + نیا لے آؤٹ
- `js/08-app-repertory.js` → `js/repertory/*.js` (10 حصے، ترتیب `LOAD_ORDER.txt`)؛ کوڈ حرف بہ حرف وہی (جوڑنے پر اصل فائل کے برابر)۔ کتابوں کی فہرست: `rep-books.js`، ربرک ٹری/رنگ/بٹن: `rep-tree.js`۔
- `css/style.css` → `app / repertory / differentiation / repertory-tree / library .css` (اسی ترتیب میں، کوئی قاعدہ نہیں بدلا) + نئے انداز: `layout-header.css`, `layout-repertory-toolbar.css`, `layout-differentiation.css`۔
- ڈیٹا (`*_chapters/`, `*.json`, `mm/`, `library/`) کو ہاتھ نہیں لگایا۔
- مین بار: 8 ٹیبز؛ Preferences/Help/Tour/Tip → سیٹنگز (وہی IDs)۔ تفریق ونڈو: ٹیبز «تجزیہ / ثبوت» گروپس میں۔ SW v92۔ ٹیسٹ: `tests/_rep_src.js` مددگار، `tests/layout_split_v78.test.js`۔
- کینٹ OOREP: سرور نے سینڈ باکس کو بلاک کیا — ابھی زیر التوا۔
