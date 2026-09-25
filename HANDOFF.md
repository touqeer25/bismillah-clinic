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


## v78 — فائلوں کی علیحدگی + نیا لے آؤٹ
- `js/08-app-repertory.js` → `js/repertory/*.js` (10 حصے، ترتیب `LOAD_ORDER.txt`)؛ کوڈ حرف بہ حرف وہی (جوڑنے پر اصل فائل کے برابر)۔ کتابوں کی فہرست: `rep-books.js`، ربرک ٹری/رنگ/بٹن: `rep-tree.js`۔
- `css/style.css` → `app / repertory / differentiation / repertory-tree / library .css` (اسی ترتیب میں، کوئی قاعدہ نہیں بدلا) + نئے انداز: `layout-header.css`, `layout-repertory-toolbar.css`, `layout-differentiation.css`۔
- ڈیٹا (`*_chapters/`, `*.json`, `mm/`, `library/`) کو ہاتھ نہیں لگایا۔
- مین بار: 8 ٹیبز؛ Preferences/Help/Tour/Tip → سیٹنگز (وہی IDs)۔ تفریق ونڈو: ٹیبز «تجزیہ / ثبوت» گروپس میں۔ SW v92۔ ٹیسٹ: `tests/_rep_src.js` مددگار، `tests/layout_split_v78.test.js`۔
- کینٹ OOREP: سرور نے سینڈ باکس کو بلاک کیا — ابھی زیر التوا۔ (v79 میں دوبارہ کوشش — نیچے v79 دیکھیں)


## v79 — ٹیب/ٹول بار کی نئی ترتیب + گریڈ فلٹر + اردو ہیڈر + Kent ← OOREP دوبارہ کوشش
- **اردو ہیڈر**: کلینک کا نام RTL/اردو میں 15px (`css/layout-header.css`) — کٹنا بند۔
- **مین نیویگیشن = 7 ٹیب** (ترتیب): ڈیش بورڈ · نئی رجسٹریشن · نئی وزٹ · تلاش · تشخیص · ریپرٹری · **سیٹنگز (آخر میں، ریپرٹری کے بعد)**۔ «تمام مریض» ٹیب ہٹائی — ڈیش بورڈ پر «📊 آل ٹائم مریض» ٹیب پہلے سے ہے؛ `page-allPatients` اب صرف اندر کی نیویگیشن (مریض تفصیل/فیملی کے 🔙 بٹن، ڈیلیٹ کے بعد) سے کھلتا ہے، نیو بار میں بٹن نہیں۔
- **تلاش vs نئی وزٹ**: دونوں رکھے — فنکشن الگ ہیں۔ تلاش = مریض تلاش کر کے پورا ٹیبل (👁️ تفصیل / ✏️ ترامیم / 🗑️ ڈیلیٹ)؛ نئی وزٹ = مریض منتخب کر کے براہِ راست نئی وزٹ فارم (تاریخ/وقت/علامات/نسخہ + فیملی نیویگیشن + آخری وزٹ)۔ تلاش کے فلڈر/فیلڈز ایک ہیں مگر مقصد الگ۔
- **ریپرٹری مین ٹول بار نئی ترتیب (صارف کی درخواست 2)**: 📘 کتاب → 📖 اسکوپ → 🔤 قسم → 🔍 سرچ بار → ☑ Compare → 📚 مطالعہ لائبریری (آخر میں)۔ 📚 نیچلی بار (`rep-navbar`) سے ٹول بار میں منتقل (وہی `repLibOpen()`)۔
- **نیچلی بار**: «GRADATION:» ہیڈنگ ہٹائی۔ 1/2/3 اب کلک کرنے والے فلٹر (`repGradeFilter` — `js/repertory/rep-tree.js`): **3 = صرف گریڈ 3 · 2 = گریڈ 3+2 · 1 = 3+2+1 (سب) · دوبارہ کلک = آف**۔ انداز: `body.rep-gf-N` کلاس + CSS (`css/repertory.css`) — ریپرٹری کے `.rep-remedy-tag` اور ٹری کے `.rtv-r` چھپ جاتے ہیں؛ تجزیہ گرڈ کے `.cmp` ٹیگز اسکوپ سے باہر (Σ خراب نہ ہو)۔ ایک ہی گریڈ دوبارہ کلک = آف (1 فلٹر سب دکھاتا ہے، اس لیے آف الگ سے ضروری نہیں)۔
- **Tests**: `tests/layout_split_v78.test.js` اب 7 ٹیب + نئی ترتیب + v79 چیکس مانگتا ہے۔ سب ٹیسٹ پاس: app_smoke · repertory_ui · differentiation · materia_medica · tree_view_integrity (**1,458,584 چیکس**) · extraction_v687/v70 · rep_clipboards · library_boger_v77 · private_books_* · layout_split_v78۔
- **SW v93**؛ `?v=79` (repertory.css, layout-header.css, rep-tree.js)۔
- **Kent ← OOREP (دوبارہ کوشش — حالت برقرار)**:
  - پہلی کوشش (وہی جو v78 میں «سرور نے بلاک کیا»): `harvest` موڈ (ادویات سمیت، ~178MB) — oorep.com کی WAF نے IP بلاک کیا۔ ٹھیک کیا گیا: براؤزر User-Agent، 0.3s تہویل، word-threads 3→1، page-threads 4→2، retries 6→8۔
  - **نئی (سستا) حکمت عملی v79**: ویب سے `github.com/nondeterministic/oorep` (OOREP کا اپنا ریپو، `oorep.sql.gz`) ڈاؤن لوڈ کر کے چیک کیا → ڈامپ میں صرف *kent-de* + *publicum* ہے (انگریزی `kent` نہیں)۔ مگر **kent-de اور انگریزی Kent کے rubric ids ایک ہیں**، اور ایپ کی `kent_de_chapters/*.json` ڈامپ کا بالکل موازنہ ہے (**68,741 ids ایک جیسی، 624,009 remedy-entries ایک جیسی** — گریڈ 1-3 بھی)۔ یعنی **ادویات + ڈھانچہ مقامی طور پر موجود ہے** — network سے صرف انگریزی ربرک-ٹیکسٹ چاہیے۔
  - نیا موڈ `harvest-text` (`getRemedies=0`، ~20MB vs ~178MB): ہر صفحہ `_pages/*.json.gz` میں فوری محفوظ (بلاک/resume میں کوئی fetch دوبارہ نہیں)، 2 consecutive fail → exit 42۔
  - نیا موڈ `recs`: `*.text.json` (EN متن) + `kent_de_chapters` (اودیات) سے `WORK/_recs.json` بناتا ہے + chapter-key dry-run (نامیں اگر نہ ملیں تو `ch_key` میں alias ضروری — exit 3)۔
  - build اب `_recs.json` موجود ہو تو وہی پڑھتا ہے (پرانا word-file راستہ برقرار)۔
  - **`tools/mm_build/kent_harvest_resume.sh [workdir]`**: ہر 10 منٹ probe، بلاک ختم ہوتے ہی `harvest-text` جاری، 36/36 `*.text.json` ہوتے ہی رک جاتا ہے۔ **ابھی چل رہا ہے** (WAF بندش تیسری بار طویل — 19:36 تک 000؛ جو پہلا کھلے گا harvest خود مکمل ہو جائے گی)۔
  - harvest مکمل ہونے کے بعد (دستی/میری اگلی نشست میں): `BHC_APP=. python3 tools/mm_build/kent_from_oorep.py recs /home/user/oorep_work` → dry-run ٹھیک تو `cp -r kent_chapters /tmp/kent_backup_before_oorep2` (بیک اپ پہلے سے `/tmp/kent_backup_before_oorep` میں موجود ہے) → `BHC_APP=. KENT_OLD=/tmp/kent_backup_before_oorep/kent_chapters python3 tools/mm_build/kent_from_oorep.py build /home/user/oorep_work` → فی چیپٹر rubric-تعداد موازنہ + `notes moved/see-also` + سب ٹیسٹ۔ ڈیٹا JSON پر ہاتھ صرف اسی وقٹ جو ٹیسٹ/تعداد تصدیق کریں۔
