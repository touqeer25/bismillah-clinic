"""
advanced_assistant.py — اسٹریم لٹ انٹری پوائنٹ (ڈسپیچر)
-------------------------------------------------------
app.py کی طرح یہ بھی وہی ڈسپیچر چلاتا ہے:

    ?embed=true&lang=ur            → پرانا AI ہومیو اسسٹنٹ (AI Diagnosis)
    ?embed=true&lang=ur&view=ai2   → ایڈوانس اسسٹنٹ 2.0 (نیا اڈاپٹو اسسٹنٹ)

تفصیل homeo_core/ui/dispatch.py میں ہے۔
"""

from homeo_core.ui.dispatch import run

run()
