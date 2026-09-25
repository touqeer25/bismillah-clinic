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
