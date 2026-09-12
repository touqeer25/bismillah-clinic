"""
app.py — اسٹریم لٹ انٹری پوائنٹ (ڈسپیچر)
-----------------------------------------
ایک ہی ایپ دونوں صفحات چلاتی ہے — فرق ?view= سے:

    ?embed=true&lang=ur            → پرانا AI ہومیو اسسٹنٹ (AI Diagnosis)
    ?embed=true&lang=ur&view=ai2   → ایڈوانس اسسٹنٹ 2.0 (نیا اڈاپٹو اسسٹنٹ)

تفصیل homeo_core/ui/dispatch.py میں ہے۔
"""

from homeo_core.ui.dispatch import run

run()
