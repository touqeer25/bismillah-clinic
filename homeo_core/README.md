# homeo_core — اے آئی ہومیو اسسٹنٹ 2.0 کا کور پیکیج

مریض کی **انفرادیت (Individualization)** کو مرکز رکھتے ہوئے بنایا گیا ماڈیولر انجن۔

## فلسفہ
> ایک کور انجن + دو کنفیگریشن فائلیں — اکیوٹ اور کرانک کا فرق **کوڈ میں نہیں، ڈیٹا میں** ہے۔

## ڈھانچہ

```
homeo_core/
├── config/
│   ├── acute_flow.json        # اکیوٹ: 4 مراحل
│   └── chronic_flow.json      # کرانک: 8 مراحل + میازم + فالو اپ
├── engine/                    # مشترکہ انجن (ایک بار لکھا گیا)
│   ├── llm.py                 # ملٹی ماڈل ایل ایل ایم (گروک/جیمنائی/جی ایل ایم/اوپن راؤٹر) + فال بیک
│   ├── rubric_mapper.py       # علامت → ربرک (مترادفات + رومن اردو + بائی گرام + ابوابی رہنمائی + ایل ایل ایم)
│   ├── sources.py             # ریپرٹری سورسز (کینٹ + سنتھیسس 9.1 + عمومی) + درجہ نارملائزیشن
│   ├── repertorizer.py        # ملٹی سورس گریڈنگ + عددی اسکورنگ (نظام کا دل)
│   ├── miasm.py               # میازم اینالائزر (4 میازم + اینٹی میازمیٹک فلٹر)
│   ├── potency.py             # پوٹینسی اور خوراک (حساسیت/عمر کے مطابق)
│   ├── differential.py        # تفریق میٹرکس (امتیازی ربرکس)
│   └── followup.py            # فالو اپ فیصلہ + ہیرنگ کا قانون
├── flows/
│   └── flow_runner.py         # کنفیگریشن سے چلنے والا فلو + مکملیت اسکور
└── ui/
    ├── streamlit_page.py      # مکمل اڈاپٹو یو آئی (اسٹریم لٹ)
    └── renderer.py            # چھوٹے مددگار رینڈر فنکشنز
```

## انٹری پوائنٹس
- `advanced_assistant.py` (ریپو کی جڑ میں) — مکمل اڈاپٹو اسسٹنٹ: `streamlit run advanced_assistant.py`
- `app.py` + `index.html` — موجودہ ایپ؛ نیا "⚕️ ایڈوانس اسسٹنٹ 2.0" ٹیب شامل کر دیا گیا ہے

## فوری آزمائش (بغیر اے آئی کیز کے)

```python
from homeo_core.flows.flow_runner import FlowRunner

# اکیوٹ فلو (4 مراحل، میازم بند)
runner = FlowRunner("acute")
res = runner.run_repertorization(["dry cough worse from motion", "great thirst for cold water"])
for r in res["remedies"][:5]:
    print(r["remedy"], r["score"], r["sources"])

# کرانک فلو (8 مراحل، میازم + اینٹی میازمیٹک فلٹر)
cr = FlowRunner("chronic")
res2 = cr.run_repertorization(["itching skin worse at night", "anxiety and fear", "craving sweets"])
print("غالب میازم:", res2["miasm_dominant"])
```

## ماحولیاتی متغیرات

| متغیر | کام |
|---|---|
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `ZAI_API_KEY` / `OPENROUTER_API_KEY` | اے آئی انجن (ایل ایل ایم ربرک انتخاب + حتمی نسخہ) |
| `HOMEOPATHY_DATA_DIR` | ریپرٹری ڈیٹا کا راستہ |

## ربرک میپنگ کی گہرائی (نسخہ 2.0)
1. **مترادفات** — "worse from" → "agg."، "better from" → "amel."
2. **رومن اردو** — "dard" → pain، "pyas" → thirst
3. **بائی گرام** — "cold water" کا درست فقری ملان
4. **ابوابی رہنمائی** — "کھانسی" → کھانسی کا باب ترجیح
5. **ایل ایل ایم انتخاب** — وجہ + اعتماد کے ساتھ، کیش شدہ، ناکامی پر مقامی فال بیک
