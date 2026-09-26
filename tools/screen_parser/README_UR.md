# Windows Screen Parser — پہلا قابلِ آزمائش ورژن (v82)

**مقصد:** کسی نظر آنے والی Windows ایپ/ویب/PDF کے متن پر ایک بار منتخب کیا گیا فریم؛ آپ اسکرول کریں، وہ نئی ساکن تصویریں *آف لائن* OCR کرے، ہر **ایک اصل PDF صفحے** کا آزاد دوسرا OCR، سطر/ربرک/دوا/گریڈ اور صفحے کی گنتی کا چیک کرے؛ خرابی ہو تو محفوظ تصویر کے ساتھ بڑا Review Mode، دستی تصحیح یا غلط الارم کی منظوری؛ صرف منظوری کے بعد اگلا صفحہ۔ مواد کلینک کے لیے **staging ZIP** میں؛ کلینک کی سرچ بعد میں الگ بنے گی۔ اس ورژن کا OCR/پارس **English-only** ہے۔

## Windows پر شروع کیسے کریں

1. کلینک کے مکمل repository فولڈر میں v82 update ZIP **extract over root** کریں (ڈیٹا JSON بدلنے کی ضرورت نہیں)۔
2. Windows پر Python 3.11–3.13 نصب کریں ("Add Python to PATH")۔ الگ سے **Tesseract OCR** with English traineddata نصب کریں۔ عام `C:\Program Files\Tesseract-OCR\tesseract.exe` راستہ پروگرام خود ڈھونڈتا ہے؛ کہیں اور نصب ہو تو `TESSERACT_CMD` ماحول متغیر میں پورا exe راستہ دیں۔ **OCR کے لیے انٹرنیٹ/API key نہیں چاہیے۔**
3. پہلی مرتبہ `INSTALL_SCREEN_PARSER_WINDOWS.bat` چلائیں (Python packages Pillow, mss, pytesseract, PyMuPDF)۔ پھر `START_SCREEN_PARSER_WINDOWS.bat`۔ Install script کو صرف پہلی بار پیکج ڈاؤن لوڈ کرنے کے لیے نیٹ درکار ہو سکتا ہے؛ کتابیں کسی کلاؤڈ پر نہیں جاتیں۔
4. اختیاری `.exe`: اپنے Windows کمپیوٹر پر `BUILD_SCREEN_PARSER_EXE_WINDOWS.bat` چلائیں؛ `dist\BismillahScreenParser.exe` بنے گا۔ **اصل Tesseract انسٹال ہونا اب بھی ضروری ہے۔** Linux سے Windows EXE نہیں بنایا گیا؛ پہلے batch/Python والا راستہ آزمایا گیا ہے۔

## پہلی کتاب اور صفحہ

- `＋` → کتاب کا **نام، ایڈیشن/نسخہ، پروفائل** (repertory / prescriber / materia_medica)، **کل اصل PDF صفحات**، اور مواد کے پہلے/آخری *physical PDF page* لکھیں۔ اختیاری اصل PDF چنیں: پیج گنتی خود لی جائے گی اور اچھا text layer ہو تو اُس متن کو تصویری OCR سے cross-check کیا جائے گا۔ صرف اسکرین کے ذریعے کل تعداد خود معتبر طور پر دریافت نہیں ہوسکتی: viewer نمبر سے تصدیق کرائیں۔
- Quick Bed-Side Prescriber: PDF viewer `24/750` اور کتاب پر چھپا `1` **الگ نمبر** ہیں۔ اسکرین پارسر کی کل/اگلا صفحہ گنتی physical PDF page کی ہوگی؛ `… → Printed page label` سے چھپا نمبر الگ درج ہوسکتا ہے۔ مقدماتی صفحات کے لیے شروع کی رینج مناسب رکھیں یا `… → Skip non-content page` وجہ کے ساتھ کریں۔
- `① Select text area`: **صرف ایک physical page** کا کتابی متن منتخب کریں، WhatsApp کا رابطہ/toolbar/دیگر صفحہ نہیں۔ ریپرٹری کے دو *کالم* ہوں تو Book Setup میں `2` columns دیں۔ اگر ایک ہی اسکرین پر دو **صفحات** ہیں تو زوم/فریم بدل کر ایک وقت میں ایک صفحہ منتخب کریں۔ چھوٹے ٹول بار کو منتخب فریم کے باہر لے جائیں۔
- اختیاری `Counter ROI`: viewer کا `24 of 750` نمبر منتخب کریں؛ ایک ہی صفحہ نظر آتا ہو تو ہی خودکار page-transition استعمال کریں۔ OCR یہ نمبر نہ پڑھ سکے یا source میں واضح counter نہ ہو تو ROI بند کریں؛ **ہر physical page کی آخری اسکرول پوزیشن پر `✔ Check page` دبائیں۔** صفحہ کی اصل تصویر لیے بغیر صرف نمبر پر بھروسا نہ کریں۔
- `▶ Watch scroll`: آپ آہستہ اسکرول کریں، ہر تبدیلی کے بعد ~ایک سیکنڈ رکیں۔ ٹول ساکن ہونے پر نیا فریم ریکارڈ کرتا ہے، متن کا مشترک حصہ جوڑتا ہے، برابر تصویر دوبارہ شمار نہیں ہوتی؛ تسلسل ثابت نہ ہو تو **scroll gap** روک دے گا۔ `📸 Grab` سے ایک فریم، `… → Import cropped screenshot` سے فائل، یا اگر اصل PDF منتخب ہے تو `… → Read original PDF page` سے بلند معیار کی تصویر/text layer لیا جاسکتا ہے۔

## فی صفحہ کراس چیک اور پریویو

- `✔ Check page`: پہلے پڑھے گئے تمام فریم مکمل ہوں، کالم الگ الگ جوڑے جائیں، پھر اصل OCR اور مختلف preprocessing والا دوسرا OCR، کم اعتماد سطریں، غیر حساب شدہ متن، چھپے count بمقابلہ شناخت شدہ ادویات، گریڈ/مخفف اور page-counter چیک ہوں۔ **صرف ان چیکس کا پاس ہونا تصویر کے ہر لفظ کی 100٪ ضمانت نہیں۔**
- مسئلہ ہو تو پوری اسکرین Review Mode: **بائیں محفوظ تصویر (warning پر کلک کریں تو متعلقہ لائن زوم)؛ دائیں editable OCR، entries/grades، advanced validated JSON، نیچے ہر warning۔** پیچھے کھلا اصل PDF اپنی جگہ رہتا ہے؛ capture کے دوران کوئی بڑا پریویو فریم نہیں ڈھانپتا۔
- OCR میں فرق ہو: `Changed OCR retry` (صرف **دو مختلف** passes، ہمیشہ وہی OCR نہیں) → فائدہ نہ ہو تو زوم بڑھا کر `Recapture`, یا **OCR text ہاتھ سے درست** کرکے `Reparse corrected transcription`؛ path/remedy/grade غلط ہو تو `Entries` ٹیبل میں اندراج اور `abbr:grade` ہاتھ سے درست کریں۔ ہر warning پر تصویر دیکھ کر **False alarm / Corrected / Verified on image** اور وجہ درج کریں۔ حقیقی غیر موجود گریڈ کو محض warning ختم کرکے output میں نہیں ڈال سکتے؛ structured field میں grade لکھنا لازم ہے۔ `Approve page →` تبھی، پھر اگلا صفحہ۔ مصدقہ صفحہ دوبارہ کھولنے پر اس کا **منفرد** شمار نہیں بڑھے گا۔
- `… → Set VERIFIED repertory colour grades`: اسی کتاب کی **چھپی legend دیکھ کر** ہی رنگ→درجہ طے کریں (جیسے `red=3, blue=2, teal=1` **صرف مثال، اصل کتاب کے لیے دعویٰ نہیں**)۔ باقی/کمزور رنگوں کے گریڈ manually verify ہوں گے۔ منظور شدہ صفحات کے بعد legend بدلنا روکا جاتا ہے تاکہ پرانا ڈیٹا چپکے سے نہ بدلے۔ Synthesis screenshot کی نہایت چھوٹی لکھائی پر بہت سے count/grade اختلافات آ سکتے ہیں؛ اسے بڑا زوم دیں یا اصل PDF فائل فراہم کریں۔

## نشستوں میں شمار، ڈیٹا اور حفاظت

- ٹول بار: `PDF 750 · Approved N · Today N · This session N · Next 24 · Review N`۔ مقامی timezone میں "Today" شمار؛ ایک (book, physical page) ہمیشہ ایک ہی ریکارڈ۔ source PDF کا fast fingerprint/ایڈیشن الگ شناخت ہے۔ page jump، دہرائی، changed total، غلط printed vs physical page یا بے تسلسل اسکرول پر warning۔ close/restart پر موجودہ کتاب/اگلا **نامنظور** صفحہ اور drafts وہی رہتے ہیں۔ اسکرین منتخب علاقہ، اصل OCR، درست متن، اصل ZIP metadata نہیں بلکہ SQLite ledger، screenshots، manual resolutions `%LOCALAPPDATA%\BismillahClinic\ScreenParser\` میں مقامی طور پر محفوظ ہیں۔
- `⬇ Export` صرف جب مقررہ رینج کا **ہر** physical page منظور یا وجہ سمیت جان بوجھ کر چھوڑا گیا ہو۔ ZIP کے اندر `staging/.../` میں کلینک جیسے JSON: Repertory `{rid:{t,r}}` + chapter index/master؛ Allen MM `{remedies:{abbr:{name,sections:[{h,p}]}},unmatched}`؛ Quick Prescriber کے لیے **دونوں** library `{sections:[{h,p}]}` اور `clinical_index` (واضح لکھے remedy/See حوالے — **کوئی من گھڑت grade نہیں**). `screen_parser/manifest.json` میں page status/manual approvals اور تصویروں کے hashes۔ **یہ staging ZIP کلینک میں ابھی خودکار امپورٹ نہیں ہوتا؛ search/import registration الگ اگلا مرحلہ ہے۔** ZIP کو موجودہ data JSON پر براہِ راست overwrite نہ کریں۔
- اصل تصاویر اور PDF Windows کمپیوٹر پر ہی رہتے ہیں؛ ZIP میں copyrighted تصاویر شامل نہیں، مگر نکالا ہوا متن کتاب کے حقوق کے تابع ہو سکتا ہے۔ نجی/کاپی رائٹ شدہ متن اجازت کے بغیر عوامی GitHub پر نہ ڈالیں۔

## حدود اور جانچ

- Windows کی دوسری *نظر آنے والی* ایپس کی اسکرین منتخب کرنا ممکن ہے؛ DRM/محفوظ ونڈوز یا بہت تیز اسکرول قابلِ بھروسا نہیں۔ پہلا overlay primary monitor پر ہے؛ ایک وقت میں ایک صفحہ، single/two column متن؛ خودکار counter detection **اختیاری** ہے۔ counters نہ ہوں تو physical page boundary خود اخذ کرنا ممکن نہیں، `Check page` لازم ہے۔
- "دو OCR passes متفق" یا "ہر OCR لائن استعمال ہوئی" کا مطلب لازماً اصل pixels کی 100٪ نقل نہیں؛ انسانی تصویری تصدیق/مشکوک سطروں کی جانچ اہم ہے۔ مخصوص کتاب کے نئے غیر معروف layouts کے لیے profile بہتر کرنا پڑے گا۔ اس اسکرین پارسر کے اندر کلینک کی سرچ **نہیں** ہے۔
- `python tests/test_screen_parser_v82.py -v` → unit/core/OCR/PDF checks۔ `python -m tools.screen_parser --image path\to\one_page.png --profile materia_medica` → بغیر کچھ محفوظ کیے ایک صفحہ ٹیسٹ؛ warnings ہوں تو exit code 2۔ Windows GUI کو sandbox میں چلانا ممکن نہیں تھا؛ Linux virtual display میں Tk window/review smoke test اور attached مثالوں پر مقامی Tesseract checks کیے گئے۔ اصل Windows مشین پر تنصیب/کیپچر کی آزمائش ابھی ضروری ہے۔
