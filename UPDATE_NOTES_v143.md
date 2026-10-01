# v143 — کینٹ ریپرٹری کا درخت کتاب کی اصل ساخت پر

**تاریخ:** 1 اکتوبر 2026

## یہ زپ کیا ٹھیک کرتی ہے

OOREP مرج کے بعد کینٹ ریپرٹری میں کتابی مین ربرکس چھوٹے OOREP مین کے نیچے چلے جاتے تھے —
مثال: **ANGER کے نیچے پہلا ذیلی ربرک «irascibility»**۔ اب مین **«ANGER, irascibility»** ہے
(کتاب کے مطابق 137 ادویات کے ساتھ) اور پہلا ذیلی ربرک **«morning»** ہے — پوری ترتیب
homeoint.org اور آپ کی True-Original PDF دونوں سے موازنہ کر کے درست کی گئی ہے۔

- **35 ابواب** کے درخت کتاب کی ساخت پر — 1,300 twin/synthetic لنگر چھپائے گئے (ان کی ہر ادویہ
  محفوظ رہی)، ~870 کتابی مین جڑ پر اُن کے بچے ساتھ
- گنتی: 71,027 → **69,727 دکھائے گئے ربرکس** · اردو احاطہ **100.0% برقرار** · مین ربرک 4,816
- ترتیب کا قانون وہی (v130/v131): مین حروفِ تہجی سے، ذیلی ربرکس کتابی ترتیب (r-id) سے

## انسٹال (اپنی کلون پر)

1. زپ ریپو کی جڑ میں کھولیں — فائلیں اپنی جگہ پر لگ جائیں گی
2. دونوں فائلیں دیکھیں: `index.html` میں `kent-tree-fix.js?v=143` اور `service-worker.js` میں
   `CACHE_NAME='bhc-clinic-v143'` — پہلے سے درست لکھی ہیں
3. گٹ ہب پر پش کرنے کے بعد ایپ میں **دو بار Ctrl+Shift+R** (سروس ورکر کا کیش بدلا ہے)

## جانچ (سب ALL PASS)

```
JSDOM_PATH=$PWD/node_modules/jsdom node tests/kent_tree_fix_v143.test.js
JSDOM_PATH=$PWD/node_modules/jsdom node tests/rubrics_ur_v107.test.js
JSDOM_PATH=$PWD/node_modules/jsdom node tests/tree_view_integrity.jsdom.test.js
```

تفصیل: `ur/review/kent_order_fix_v143.md` · طریقہ کار: `js/repertory/KENT_ORDER_METHOD.md` §7
