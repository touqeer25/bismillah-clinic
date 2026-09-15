# -*- coding: utf-8 -*-
"""
rubric_grammar.py — ربرک کی گرامر (ربرک کو ٹکڑوں میں کھولنا)
================================================================
⚠️ بنیادی اصول (صارف کی ہدایت — نسخہ 3.0):
   یہ ماڈیول **الفاظ کو ٹکڑوں کی صورت میں جمع نہیں کرتا**۔
   یہ **ربرک کو اُس کے ٹکڑوں (اجزاء) میں کھولتا ہے**۔

فرق صاف سمجھ لیں:
   ✗ پرانا طریقہ: ربرک کا متن → الفاظ کی تھیلی → لفظ ملا تو نمبر
   ✓ نیا طریقہ:   ربرک = ایک بڑا جملہ (چند الفاظ، ترتیب + کاما)
                  اس جملے کے ٹکڑے = مقام / احساس / سمت / وقت / موڈیلٹی / پھیلاؤ / ہمراہ
                  ہر ٹکڑا الگ، پورا، اپنی شناخت کے ساتھ

کاما کا قانون یہاں لاگو ہوتا ہے (تفصیل: ربرک-کاما-اور-اسلوب-تحقیق.md):
   • Synthesis میں ہر درجہ `path` میں پہلے سے الگ ہے (" - " سے بٹا ہوا)
   • Kent (انگریزی) فلیٹ متن ہے، مگر **ہر کاما ایک درجہ** ہے
   • ترتیب: کلی → سمت → وقت → موڈیلٹی → پھیلاؤ (کینٹ کا S-T-M-E)

دوسرا بنیادی اصول — **علامت کی تکمیل** (نسخہ 3.0):
   معالج کیس لیتے وقت علامات "جمع" نہیں کرتا، وہ ہر علامت کو **مکمل** کرتا ہے:
       مقام کہاں؟ + احساس کیسا؟ + موڈیلٹی کس سے بگڑتا/بنتر ہے؟ (+ ہمراہ کیا ہوا؟)
   اسی لیے یہاں `read_symptom()` بھی ہے جو مریض کے جملے کو اُنہی خانوں میں بانٹتی ہے
   اور `missing_of()` بتاتی ہے کہ علامت میں کیا کمی ہے — تاکہ معالج وہی پوچھے۔

اِستعمال:
    from homeo_core.engine import rubric_grammar as rg
    g = rg.RubricGrammar()              # سنتھیسس + کینٹ
    r = g.explain("circulation::r123")  # ایک ربرک کی مکمل پڑھائی
    s = rg.read_symptom("heart feels as if squeezed")
    rg.print_case_read(CASE_SYMPTOMS)   # سارے کیس کی پڑھائی
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# ------------------------------------------------------------------ #
# 1) ذخیرۂ الفاظ — ہر لفظ ایک **جزو** سے بندھا ہوا ہے (انگریزی → اردو)
#    نوٹ: یہ لفظوں کی تھیلی نہیں — یہ کاموں کی پہچان کے اوزار ہیں۔
#         ایک ٹکڑا اپنے کل مفہوم کے ساتھ اِن میں سے ایک جزو بنتا ہے۔
# ------------------------------------------------------------------ #

# مقام (Location) — عضو، حصہ، عضوِ خاص
LOCATION_UR: Dict[str, str] = {
    # سر و چہرہ
    "head": "سر", "forehead": "پیشانی", "vertex": "سر کے اوپری حصے", "occiput": "سر کے پچھلے حصے",
    "temple": "کنپٹی", "temples": "کنپٹیاں", "brain": "دماغ", "scalp": "کھوپڑی",
    "face": "چہرہ", "cheek": "گال", "cheeks": "گال", "jaw": "جبڑا", "chin": "ٹھوڑی", "lips": "ہونٹ",
    "eye": "آنکھ", "eyes": "آنکھیں", "eyelid": "پپوٹا", "eyelids": "پپوٹے", "orbits": "آنکھ کا گڑھا",
    "ear": "کان", "ears": "کان", "hearing": "سماعت", "vision": "نظر",
    "nose": "ناک", "nostrils": "نتھنے", "smell": "سونگھنے کی حس",
    "mouth": "منہ", "teeth": "دانت", "tooth": "دانت", "gums": "مسوڑھے", "tongue": "زبان",
    "throat": "گلا", "tonsils": "ٹانسل", "palate": "تالو",
    # گردن و سینہ
    "neck": "گردن", "nape": "گدی", "cervical region": "گردن کے مہروں",
    "chest": "سینہ", "mammae": "پستان", "breast": "چھاتی", "nipples": "نپل",
    "heart": "دل", "lungs": "پھیپھڑے", "axilla": "بغل", "axillae": "بغل",
    "diaphragm": "حجابِ حاجز", "ribs": "پسلیاں",
    # پیٹ و پاخانہ
    "stomach": "معدہ", "abdomen": "پیٹ", "belly": "شکم", "hypochondria": "پسلیوں کے نیچے کے حصے",
    "hypogastrium": "پیٹ کے نچلے حصے", "navel": "ناف", "liver": "جگر", "spleen": "تلی",
    "rectum": "مقعد", "anus": "مقعد کا منہ", "stool": "پاخانہ", "haemorrhoids": "بواسیر", "hemorrhoids": "بواسیر",
    "kidney": "گردہ", "kidneys": "گردے", "bladder": "مثانہ", "urine": "پیشاب", "urination": "پیشاب کا عمل",
    "urethra": "پیشاب کی نالی", "prostate": "پروسٹیٹ",
    # تولیدی
    "genitalia": "شرم گاہ", "genitalia male": "مردانہ عضو", "genitalia female": "زنانہ عضو",
    "uterus": "رحم", "ovaries": "بیضہ دانی", "menses": "حیض", "menstruation": "حیض کا عمل",
    "leucorrhoea": "سفیدی", "coition": "ہم بستری", "pregnancy": "حمل", "childbirth": "زچگی",
    # سانس
    "larynx": "حنجرہ", "trachea": "سنسنی کی نالی", "respiration": "سانس", "breathing": "سانس لینا",
    "cough": "کھانسی", "expectoration": "بلغم نکالنا", "sputum": "بلغم (تھوک)",
    # پشت
    "back": "پیٹھ", "spine": "ریڑھ کی ہڈی", "lumbar": "کمر", "lumbar region": "کمر میں",
    "sacrum": "کمر کے نچلے مہروں", "coccyx": "دم", "dorsal region": "پشت کے درمیانی حصے",
    # ہاتھ پاؤں
    "extremities": "ہاتھ پاؤں", "upper limbs": "بازو (اوپری عضو)", "lower limbs": "ٹانگیں (نچلا عضو)", "limbs": "اعضا",
    "arm": "بازو", "arms": "بازو", "hand": "ہاتھ", "hands": "ہاتھ", "wrist": "کلائی",
    "finger": "انگلی", "fingers": "انگلیاں", "thumb": "انگوٹھا", "nails": "ناخن",
    "shoulder": "کندھا", "elbow": "کہنی", "hip": "کولہا", "thigh": "ران", "knee": "گھٹنا", "knees": "گھٹنے",
    "leg": "ٹانگ", "legs": "ٹانگیں", "calf": "پنڈلی", "ankle": "ٹخنہ", "foot": "پاؤں", "feet": "پاؤں",
    "toe": "پاؤں کی انگلی", "toes": "پاؤں کی انگلیاں", "sole": "تلا", "heel": "ایڑی", "joints": "جوڑ",
    # نظام و عمومی
    "skin": "جلد", "bones": "ہڈیاں", "glands": "غدود", "muscles": "پٹھے", "nerves": "اعصاب",
    "blood": "خون", "circulation": "دورانِ خون", "nervous system": "عصبی نظام",
    "sleep": "نیند", "dreams": "خواب", "perspiration": "پسینہ", "sweat": "پسینہ بہنا",
    "chill": "سردی لگنا", "fever": "بخار", "heat": "گرمی", "vertigo": "چکر",
    "mind": "ذہن و دماغ", "generalities": "پوری حالت", "general": "عمومی",
    "heart and region of": "دل اور اُس کے ارد گرد",
}

# احساس (Sensation) — مریض کو کیسا لگتا ہے
SENSATION_UR: Dict[str, str] = {
    "pain": "درد", "pains": "درد", "aching": "ٹسٹساہٹ/درد", "sore": "زخم جیسا درد", "soreness": "زخم جیسا درد",
    "burning": "جلن", "scalding": "بھاپ سے جلن جیسا",
    "stitching": "سوئی جیسی چبھن", "sticking": "چبھنا (لگا رہنے والا)", "pricking": "کانٹے جیسی چبھن", "cutting": "کٹنے جیسی",
    "tearing": "پھاڑنے جیسی", "drawing": "کھینچاؤ", "pressing": "دبانے والا درد", "pressure": "دباؤ",
    "bursting": "پھٹنے جیسی", "throbbing": "دھک دھک کے ساتھ", "pulsating": "نبض جیسی دھڑکن", "hammering": "ہتھوڑے جیسی",
    "cramping": "اینٹھنے والا", "cramp": "تشنج (اینٹھن)", "spasms": "مروڑ/تشنج", "spasmodic": "مروڑ والا",
    "constriction": "سکڑاؤ", "tightness": "تنی ہوئی", "oppression": "بوجھ/دباؤ", "heaviness": "بھاری پن",
    "numbness": "بےحسی", "numb": "بےحس", "deadness": "بےجان پن", "tingling": "جھنجھناہٹ", "deadness": "بےجان پن", "tingling": "جھنجھناہٹ",
    "palpitation": "دل کی دھڑکن", "trembling": "کپکپی", "tremor": "رعشہ (لرزش)", "quivering": "تھرتھرانا",
    "weakness": "کمزوری", "weak": "کمزوری", "prostration": "شدید کمزوری", "fatigue": "تھکن", "faintness": "غشی",
    "coldness": "ٹھنڈک", "cold": "سردی", "heat sensation": "گرمی کا احساس", "flushes": "گرمی کے اچھالے",
    "discharge": "اخراج", "swelling": "سوجن", "itching": "خارش", "eruption": "دانوں کا اخراج",
    "anxiety": "بےچینی", "fear": "خوف", "grief": "غم", "sadness": "اداسی", "weeping": "رونا",
    "irritability": "چڑچڑاپن", "restlessness": "بےآرامی", "excitement": "جذباتی ہیجان",
    "anger": "غصہ", "anguish": "تڑپ", "delirium": "بک بک", "moaning": "آہ و زاری", "groaning": "کراہنا",
    "sighing": "آہیں بھرنا", "lamenting": "ماتم کرنا", "fainting": "بے ہوشی", "weakness in chest": "سینے میں کمزوری",
    "nausea": "متلی", "vomiting": "قے", "eructation": "ڈکار", "thirst": "پیاس", "appetite": "بھوک",
    "hunger": "شدید بھوک", "sneezing": "چھینک", "hiccough": "ہچکی", "yawning": "جمائی", "coughing": "کھانسی",
    "cease": "رُک جانا", "ceasing": "رُک جانا", "stopped": "رُکا ہوا", "stopping": "رُکنا", "rushing": "زور سے اچھلنا", "rush": "زور سے اچھلنا", "orgasm": "اچھال (خون کا)",
    "squeezing": "نچوڑا جانا", "squeezed": "نچوڑا جانا", "squeeze": "نچوڑا جانا",
    "compressed": "دبایا جانا", "weight": "بوجھ", "load": "بوجھ (لدا ہوا)", "chattering": "کھڑکھڑانا/بجنا",
    "shivering": "کپکپاہٹ", "shuddering": "سنسنانا", "chilliness": "سردی لگنے کا احساس",
    "attack": "دورہ", "attacks": "دورے", "paroxysm": "شدید دورہ", "paroxysms": "شدید دورے",
    "fluttering": "پھڑپھڑاہٹ", "vibration": "کمپن", "twitching": "پھڑکن", "jerking": "جھٹکے",
}

# موڈیلٹی (Modality) — کس حالت کے ساتھ بندھی ہوئی ہے
MODALITY_UR: Dict[str, str] = {
    "lying": "لیٹنا", "lying down": "لیٹ کر", "lying in bed": "بستر پر لیٹنا", "lying (in bed)": "بستر پر لیٹنا",
    "sitting": "بیٹھنا", "standing": "کھڑا ہونا", "kneeling": "گھٹنوں کے بل بیٹھنا",
    "walking": "چلنا", "motion": "حرکت", "movement": "ہلنا/چلنا", "rest": "آرام", "exertion": "محنت",
    "ascending": "سیڑھیاں چڑھنا", "descending": "اترنا", "running": "دوڑنا", "riding": "سواری",
    "bending": "جھکنا", "stooping": "خم ہونا", "bent forward": "آگے جھک کر", "sits up": "اٹھ کر بیٹھنا", "turning": "مڑنا", "lifting": "اٹھانا",
    "eating": "کھاتے ہوئے", "drinking": "پینا", "food": "خوراک", "fasting": "بھوکے رہنا",
    "stool": "پاخانہ", "urination": "پیشاب", "menses": "حیض", "menstruation": "حیض کا عمل",
    "cough": "کھانسی", "sneezing": "چھینک", "talking": "بات کرنا", "speech": "بولنا",
    "touch": "لمس", "pressure": "دباؤ", "jarring": "جھٹکا", "rubbing": "ملنا/رگڑنا",
    "air": "ہوا", "air open": "کھلی ہوا", "cold air": "ٹھنڈی ہوا", "draft": "ہوا کا جھونکا",
    "heat": "گرمی", "warmth": "حرارت (نرم گرمی)", "warm room": "گرم کمرہ", "warm bed": "گرم بستر",
    "bathing": "غسل", "washing": "دھونا", "water": "پانی", "cold water": "ٹھنڈا پانی",
    "weather": "موسم", "wind": "تیز ہوا", "damp": "نمی", "storm": "طوفان",
    "sleep": "نیند", "waking": "جاگنا", "sleeping": "سوتے ہوئے", "dreams": "خواب",
    "reading": "پڑھنا", "writing": "لکھنا", "thinking": "سوچنا", "mental exertion": "ذہنی محنت",
    "music": "موسیقی", "noise": "شور", "light": "روشنی", "odors": "بوئیں", "smell": "بو",
    "swallowing": "نگلنا", "inspiration": "سانس اندر لینا", "expiration": "سانس باہر چھوڑنا",
    "excitement": "جذباتی ہیجان", "anger": "غصہ", "vexation": "دل آزاری", "grief": "غم",
    "emotion": "جذبات", "fright": "ڈر", "company": "صحبت", "alone": "تنہائی", "consolation": "تسلی",
    "closing eyes": "آنکھیں بند کرنا", "opening eyes": "آنکھیں کھولنا", "uncovering": "کپڑے ہٹانا",
    "lie": "لیٹنا", "lies": "لیٹنا", "reclining": "ٹیک لگانا", "sits": "بیٹھنا", "sat": "بیٹھنا",
}

# ضمنی مقام — یہ احساس اپنے ساتھ مقام بھی لے آتے ہیں
IMPLIED_LOCATION: Dict[str, str] = {
    "palpitation": "دل", "heart felt": "دل", "pulse": "نبض", "menses": "رحم",
    "menstruation": "رحم", "urination": "مثانہ", "stool": "مقعد", "sneezing": "ناک",
    "cough": "سانس کی نالی", "vision": "آنکھیں", "hearing": "کان", "thirst": "منہ و گلا",
    "appetite": "معدہ", "nausea": "معدہ", "vomiting": "معدہ", "sweat": "جلد", "perspiration": "جلد",
}

# شکایت / مرض کا نام (ربرک کا مرکزی لفظ) — نسخہ 3.1
COMPLAINT_UR: Dict[str, str] = {
    # جلد
    "eczema": "ایگزیما (خارش)", "psoriasis": "چنبل", "pemphigus": "پیمفیگس (پھپھولے)",
    "erysipelas": "سرخ بادہ", "ulcer": "ناسور", "ulcers": "ناسور", "abscess": "پھوڑا",
    "boil": "پھنسی", "boils": "پھنسیاں", "wart": "مسہ", "warts": "مسے", "corn": "گٹھلی",
    "blister": "پھپھولا", "blisters": "پھپھولے", "rash": "سرخ دھبے/دانوں کا اخراج", "herpes": "ہرپس",
    "scabies": "کھجلی (بیماری)", "eruption": "دانوں کا نکلنا", "eruptions": "دانوں کا نکلنا",
    "dryness": "خشکی", "cracks": "دراڑیں", "fissure": "دراڑ", "wrinkles": "جھریاں",
    "itching": "خارش", "perspiration": "پسینہ", "discoloration": "بےرنگی",
    # سانس / کھانسی
    "cough": "کھانسی", "coryza": "نزلہ", "asthma": "دمہ", "wheezing": "سانس میں سیٹی",
    "sneezing": "چھینکیں", "hiccough": "ہچکی", "yawning": "جمائی", "sobbing": "سسکیاں",
    "sighing": "آہیں", "moaning": "آہ و زاری", "groaning": "کراہنا", "snoring": "خراٹے",
    "interrupted": "رُک رُک کر", "impeded": "رکاوٹ", "paralysis": "فالج",
    # ہاضمہ / پاخانہ
    "diarrhoea": "دست", "diarrhea": "دست", "constipation": "قبض", "vomiting": "قے",
    "nausea": "متلی", "indigestion": "بدہضمی", "flatulence": "ریاح", "colic": "پیچش",
    "haemorrhoids": "بواسیر", "hemorrhoids": "بواسیر", "involuntary": "بےاختیار",
    "urging to": "دباؤ/تاکید", "gummy": "لِسدار", "noisy": "شور والا", "bloody": "خونی",
    # سر / عمومی
    "headache": "سر درد", "migraine": "آدھے سر کا درد", "vertigo": "چکر", "insomnia": "بےخوابی",
    "fever": "بخار", "chill": "سردی لگنا", "thirst": "پیاس", "appetite": "بھوک",
    "weakness": "کمزوری", "fainting": "بے ہوشی", "convulsions": "دورے", "spasm": "تشنج",
    "swelling": "سوجن", "oedema": "ورم", "edema": "ورم", "dropsy": "استسقاء",
    "haemorrhage": "خون کا بہاؤ", "hemorrhage": "خون کا بہاؤ", "bleeding": "خون آنا",
}

# ذہنی حالتیں (MIND باب کا مرکزی لفظ)
MENTAL_UR: Dict[str, str] = {
    "fear": "خوف", "anxiety": "بےچینی", "anguish": "تڑپ", "grief": "غم", "sadness": "اداسی",
    "weeping": "رونا", "despair": "مایوسی", "cheerful": "خوش طبع", "mirth": "مسرت",
    "laughing": "ہنسنا", "ecstasy": "وجد", "haughty": "مغرور", "pride": "غرور",
    "jealousy": "رشک", "envy": "حسد", "anger": "غصہ", "rage": "طیش", "irritability": "چڑچڑاپن",
    "contempt": "حقارت", "loathing": "نفرت", "hatred": "بغض", "love": "محبت",
    "frightened": "ڈرا ہوا", "terror": "دہشت", "panic": "گھبراہٹ", "restlessness": "بےآرامی",
    "impatience": "بےصبری", "hurry": "جلد بازی", "confusion": "الجھن", "delirium": "بک بک",
    "delusion": "وہم", "illusion": "فریبِ نظر", "hallucination": "خیالی",
    "forgetful": "بھولنے والا", "memory": "یادداشت", "dullness": "سستیِ ذہن",
    "hypochondriasis": "احساسِ بیماری کا وہم", "hysteria": "ہسٹیریا", "mania": "جنون",
    "melancholy": "سوداوی مزاج", "depression": "افسردگی", "indifference": "بےحسی",
    "indolence": "آرام پسندی", "aversion": "نفرت/گریز", "desire": "خواہش", "craving": "شدید خواہش",
    "sympathy": "ہمدردی", "consolation": "تسلی", "company": "صحبت", "alone": "تنہائی",
    "sensitive": "حساس", "sentimental": "جذباتی", "obstinate": "ضدی", "vexation": "دل آزاری",
    "mortification": "ذلت کا احساس", "quarrelsome": "جھگڑالو", "mildness": "نرمی",
    "amusement": "دل لگی", "brooding": "فکر میں ڈوبنا", "cares": "فکریں", "frivolous": "اوچھا پن",
    "excitement": "جذباتی ہیجان", "starting": "چونک اٹھنا", "shrieking": "چیخ",
    "suicide": "خودکشی کا خیال", "doubtful": "شک میں", "faithless": "بےوفا پن",
}

# ہر باب کا اردو نام (سنتھیسس اور کینٹ دونوں کے کلید)
CHAPTER_UR: Dict[str, str] = {
    "mind": "ذہن و دماغ", "vertigo": "چکر", "head": "سر", "eye": "آنکھ", "eyes": "آنکھیں",
    "vision": "نظر", "ear": "کان", "ears": "کان", "hearing": "سماعت", "nose": "ناک",
    "face": "چہرہ", "mouth": "منہ", "teeth": "دانت", "throat": "گلا",
    "external_throat": "گلے کا باہری حصہ", "neck_and_external_throat": "گردن و گلے کا باہری حصہ",
    "stomach": "معدہ", "abdomen": "پیٹ", "hypochondria": "پسلیوں کے نیچے کے حصے",
    "external_abdomen": "پیٹ کا باہری حصہ", "rectum": "مقعد", "stool": "پاخانہ",
    "bladder": "مثانہ", "kidney": "گردہ", "urethra": "پیشاب کی نالی", "urine": "پیشاب",
    "urinary_organs": "پیشاب کے اعضا", "genitalia_male": "مردانہ عضو",
    "genitalia_female": "زنانہ عضو", "genitalia": "شرم گاہ", "female_sexual_system": "زنانہ نظام",
    "male_sexual_system": "مردانہ نظام", "menstruation": "حیض", "pregnancy": "حمل",
    "larynx_and_trachea": "حنجرہ و سنسنی کی نالی", "respiration": "سانس", "cough": "کھانسی",
    "expectoration": "بلغم", "chest": "سینہ", "heart_&_circulation": "دل و دورانِ خون",
    "circulation": "دورانِ خون", "circulatory_system": "نظامِ دورانِ خون", "back": "پیٹھ",
    "extremities": "ہاتھ پاؤں", "upper_extremities": "بازو", "lower_extremities": "ٹانگیں",
    "locomotor_system": "حرکتی نظام", "nervous_system": "عصبی نظام", "sleep": "نیند",
    "dreams": "خواب", "chill": "سردی لگنا", "fever": "بخار", "heat_and_fever_in_general": "گرمی و بخار",
    "perspiration": "پسینہ", "sweat": "پسینہ", "skin": "جلد", "skin_and_exterior_body": "جلد و باہر کا جسم",
    "generalities": "پوری حالت", "clinical": "کلینیکل", "blood": "خون", "bones": "ہڈیاں",
    "conditions_in_general": "عمومی حالات", "modalities": "موڈیلٹیز",
    "sensations_and_complaints_in_general": "عمومی احساسات و شکایات",
    "conditions_of_aggravation_and_amelioration_in_general": "عمومی بگاڑ و بہتری",
    "urinary_system": "نظامِ پیشاب", "digestive_system": "نظامِ ہاضمہ", "respiratory_system": "نظامِ تنفس",
}

# وقت (Time) — کب؟
TIME_UR: Dict[str, str] = {
    "daytime": "دن کے وقت", "day": "دن", "morning": "صبح", "forenoon": "دن چڑھے", "noon": "دوپہر",
    "afternoon": "سہ پہر", "evening": "شام", "twilight": "جھٹ پٹا", "night": "رات",
    "midnight": "آدھی رات", "midnight to morning": "آدھی رات سے صبح",
    "before": "سے پہلے", "during": "کے دوران", "after": "کے بعد", "while": "کے وقت (جب)", "when": "جب",
    "on": "پر", "at": "بوقت", "until": "تک", "since": "سے",
    "spring": "بہار", "summer": "گرمی", "autumn": "خزاں", "winter": "سردی",
    "periodical": "وقفے وقفے سے", "periodic": "مقررہ وقفوں سے", "intermittent": "وقفے کے ساتھ",
    "alternating": "باری باری", "repeated": "بار بار", "sudden": "اچانک",
}

# سمت (Side)
SIDE_UR: Dict[str, str] = {
    "right": "دائیں", "left": "بائیں", "side": "طرف", "sides": "دونوں طرف",
    "unilateral": "ایک طرف", "alternating sides": "باری باری طرف",
}

# نوع/شدت (Quality) — کیسا اور کتنا
QUALITY_UR: Dict[str, str] = {
    "violent": "شدید", "tumultuous": "بےقابو", "vehement": "زوردار", "intense": "تشدّد کے ساتھ",
    "severe": "سخت", "sudden": "اچانک", "gradual": "بتدریج", "slow": "آہستہ", "quick": "تیز",
    "constant": "مسلسل", "intermittent": "وقفے وقفے سے", "periodic": "وقفوں سے", "dull": "مدھم",
    "sharp": "تیز", "deep": "گہری", "superficial": "سطحی", "slight": "ہلکی", "great": "شدید",
    "spasmodic": "مروڑ والا", "paroxysmal": "دورے دار", "short": "مختصر", "long": "طویل",
    "flushes": "اچھالے", "sensations": "احساسات", "painful": "درد بھرا",
}

# تشبیہ (Simile) — «گویا…»، «جیسے…» (احساس کا لازمی حصہ)
SIMILE_FRAGMENTS = ("as if", "as though", "as in", "like", "sensation as if")

# نفی (Negation) — بہت اہم: «نہیں سکتا» بمقابلہ «رجحان»
NEG_FRAGMENTS = ("cannot", "can not", "can't", "could not", "not", "no ", "without", "never", "unable")

# بے وزن ٹکڑے (کوئی جزو نہیں، صرف لفظی جوڑ)
LEAN_FRAGMENTS = {"etc", "etc.", "sense of", "in general", "general", "inner", "internal",
                  "external", "outer", "inner head", "external head", "whole body", "parts",
                  "of", "the", "a", "an", "as", "in", "into", "to", "and", "or",
                  "with", "on", "at", "like", "such", "that", "which", "who", "is", "are",
                  "sensation", "sensation of", "feeling", "feels", "again", "yet", "still"}

_ROLE_ORDER = ["section", "complaint", "location", "sensation", "side", "time", "modality",
               "quality", "extension", "concomitant", "negation", "simile", "reference", "other"]


# ------------------------------------------------------------------ #
# 2) ایک ربرک کا خاکہ (RubricParts)
# ------------------------------------------------------------------ #
class RubricParts:
    """ایک ربرک = مکمل جملہ۔ اُس کے ٹکڑے = اُس جملے کے اجزاء۔
    (یہ الفاظ کی تھیلی نہیں؛ ہر ٹکڑا اپنے کام/کردار کے ساتھ محفوظ ہوتا ہے)"""

    __slots__ = ("rid", "chapter", "source", "fragments", "family", "polarity", "see_ref",
                 "remedy_count")

    def __init__(self, rid: str, chapter: str, source: str = ""):
        self.rid = rid
        self.chapter = chapter
        self.source = source
        self.fragments: List[Tuple[str, str, str]] = []   # (متن، کردار، اردو)
        self.family = ""          # PAIN / Aggravation / Amelioration / Concomitants
        self.polarity = ""        # agg / amel
        self.see_ref = ""         # (See …)
        self.remedy_count = 0

    # ---------- اجزاء نکالنا ----------
    def of(self, role: str) -> List[str]:
        return [ur for (_t, r, ur) in self.fragments if r == role and ur]

    def has(self, role: str) -> bool:
        return bool(self.of(role))

    @property
    def location(self) -> List[str]:
        return self.of("location")

    @property
    def complaint(self) -> List[str]:
        return self.of("complaint")

    @property
    def sensation(self) -> List[str]:
        return self.of("sensation") + self.of("quality")

    @property
    def modality(self) -> List[str]:
        return self.of("modality")

    @property
    def time(self) -> List[str]:
        return self.of("time")

    @property
    def side(self) -> List[str]:
        return self.of("side")

    @property
    def negative(self) -> bool:
        return self.has("negation")

    @property
    def depth(self) -> int:
        """گہرائی = ربرک میں ترتیب سے بنے درجوں کی تعداد (کاما/پاتھ کے ٹکڑے)"""
        return len([f for f in self.fragments if f[1] not in ("section", "reference")])

    def components(self) -> Dict[str, List[str]]:
        """چھ اجزاء — مکمل علامت کے معیار کے مطابق"""
        return {
            "location": self.location,
            "sensation": self.sensation,
            "modality": self.modality,
            "time": self.time,
            "side": self.side,
            "concomitant": self.of("concomitant"),
        }

    def completeness(self) -> str:
        """مکمل علامت کے چار بنیادی اجزاء میں سے کتنے موجود ہیں"""
        core = [bool(self.location), bool(self.of("sensation") + self.of("quality")),
                bool(self.modality), bool(self.of("concomitant"))]
        return f"{sum(core)}/4"

    def missing(self) -> List[str]:
        ur = {"location": "مقام", "sensation": "احساس", "modality": "موڈیلٹی", "concomitant": "ہمراہ"}
        out = []
        if not self.location:
            out.append(ur["location"])
        if not (self.of("sensation") + self.of("quality")):
            out.append(ur["sensation"])
        if not self.modality:
            out.append(ur["modality"])
        if not self.of("concomitant"):
            out.append(ur["concomitant"])
        return out

    # ---------- اردو سینٹنس ----------
    def sentence_ur(self) -> str:
        """ربرک کو ایک مکمل جملے کی صورت میں پڑھنا (کاما کا قانون لاگو کر کے)"""
        return build_sentence_ur(self)

    def to_dict(self) -> dict:
        return {
            "rid": self.rid, "chapter": self.chapter, "source": self.source,
            "family": self.family, "polarity": self.polarity, "see_ref": self.see_ref,
            "fragments": [{"text": t, "role": r, "ur": ur} for (t, r, ur) in self.fragments],
            "location": self.location, "sensation": self.sensation, "modality": self.modality,
            "time": self.time, "side": self.side, "negative": self.negative,
            "concomitant": self.of("concomitant"), "extension": self.of("extension"),
            "depth": self.depth, "remedy_count": self.remedy_count,
            "sentence_ur": self.sentence_ur(), "completeness": self.completeness(),
        }


# ------------------------------------------------------------------ #
# 3) ٹکڑے پہچاننے کے اوزار
# ------------------------------------------------------------------ #
def _norm(s: str) -> str:
    s = str(s or "").strip().lower()
    s = (s.replace("œ", "oe").replace("æ", "ae").replace("ü", "u").replace("ä", "a").replace("ö", "o"))
    s = re.sub(r"\s+", " ", s)
    return s


def _lookup_vocab(phrase: str, vocab: Dict[str, str]) -> Optional[str]:
    """پورا فقرہ ورنہ اُس کے الفاظ — دونوں طرح ڈھونڈنا"""
    p = _norm(phrase)
    if p in vocab:
        return vocab[p]
    p2 = p.rstrip(".,;:")
    if p2 in vocab:
        return vocab[p2]
    # plurals
    if p2.endswith("s") and p2[:-1] in vocab:
        return vocab[p2[:-1]]
    for w in p2.replace(",", " ").split():
        if w in vocab:
            return vocab[w]
    return None


def _strip_ref(text: str) -> Tuple[str, str]:
    """(See …) الگ کرنا — یہ ربرک نہیں، حوالہ ہے"""
    m = re.search(r"\((?:see|see also)\s+([^)]*)\)", str(text), flags=re.I)
    if not m:
        return str(text), ""
    return re.sub(r"\((?:see|see also)[^)]*\)", " ", str(text), flags=re.I), m.group(1).strip()


def _tag_fragment(frag: str) -> Tuple[str, str]:
    """ایک ٹکڑا → (کردار، اردو) — یہیں کاما کے قانون کا اطلاق ہوتا ہے"""
    f = _norm(frag)
    if not f:
        return ("", "")
    # تشبیہ
    if any(sim == f or sim in f for sim in SIMILE_FRAGMENTS) and len(f) <= 22:
        return ("simile", "گویا")
    # نفی
    if any(neg in f for neg in NEG_FRAGMENTS):
        return ("negation", "نفی: " + f)
    # موڈیلٹی کے نشان
    if re.fullmatch(r"(agg|agg\.|<|worse|worse\.)", f):
        return ("modality", "")           # پولیرٹی الگ لگائی جاتی ہے
    if re.fullmatch(r"(amel|amel\.|>|better|better\.)", f):
        return ("modality", "")
    # وقت کے جوڑ
    if f in ("before", "during", "after", "while", "when", "until", "since", "on", "at"):
        return ("time", TIME_UR.get(f, f))
    # پھیلاؤ
    if "extending" in f or f.startswith("extension") or "extends" in f:
        return ("extension", "پھیلاؤ")
    # حوالہ
    if f.startswith("see ") or f.startswith("(see"):
        return ("reference", f)
    # سمت
    ur = _lookup_vocab(f, SIDE_UR)
    if ur and f.split()[-1] in SIDE_UR:
        return ("side", ur)
    # خالی/بے وزن
    if f in LEAN_FRAGMENTS:
        return ("", "")
    # مخصوص اوزار
    if f in ("concomitants", "concomitant"):
        return ("", "")
    # وقت
    ur = _lookup_vocab(f, TIME_UR)
    if ur:
        return ("time", ur)
    # موڈیلٹی
    ur = _lookup_vocab(f, MODALITY_UR)
    if ur:
        return ("modality", ur)
    # احساس
    ur = _lookup_vocab(f, SENSATION_UR)
    if ur:
        return ("sensation", ur)
    # مقام
    ur = _lookup_vocab(f, LOCATION_UR)
    if ur:
        return ("location", ur)
    # شدت/نوع
    ur = _lookup_vocab(f, QUALITY_UR)
    if ur:
        return ("quality", ur)
    return ("other", f)




def _keys(pieces: List[str], vocab: Dict[str, str]) -> List[str]:
    """اِن ٹکڑوں میں سے وہ کلیدی الفاظ جو دیئے گئے ذخیرے میں موجود ہوں"""
    out = []
    for piece in pieces:
        p = _norm(piece).rstrip(".,;:")
        if p in vocab:
            out.append(p)
            continue
        if p.endswith("s") and p[:-1] in vocab:
            out.append(p[:-1])
    return out


def _tag_pieces(pieces: List[str]) -> List[Tuple[str, str, str]]:
    """کاما سے بٹے ٹکڑے → (متن، اردو، کردار)
       پہلے جوڑی/سہ لفظی فقرے، پھر اکیلے الفاظ، پھر باقی الفاظ ایک ایک کر کے۔"""
    out: List[Tuple[str, str, str]] = []
    used = [False] * len(pieces)

    # (الف) جوڑے/سہ لفظی فقرے (air + open = air open → کھلی ہوا)
    for size in (3, 2):
        for i in range(len(pieces) - size + 1):
            if any(used[i:i + size]):
                continue
            phrase = " ".join(_norm(pieces[i + j]).rstrip(".,;:") for j in range(size))
            for vocab, role in ((MODALITY_UR, "modality"), (SENSATION_UR, "sensation"),
                                (LOCATION_UR, "location"), (TIME_UR, "time"), (QUALITY_UR, "quality")):
                if phrase in vocab:
                    out.append((phrase, vocab[phrase], role))
                    for j in range(size):
                        used[i + j] = True
                    break

    # (ب) اکیلے ٹکڑے، ورنہ اُس کے اندر کے الفاظ
    for i, piece in enumerate(pieces):
        if used[i]:
            continue
        low = _norm(piece)
        # موڈیلٹی کے نشان والا ٹکڑا: «back agg.» → شرط + بگاڑ
        m = re.search(r"\b(agg|amel)\.?\b", low)
        if m and not any(c in low for c in ("aggravation", "amelioration")):
            rest = re.sub(r"\b(agg|amel)\.?\b", " ", low).strip()
            role, ur = _tag_fragment(rest) if rest else ("", "")
            mark_ur = "بگاڑ" if m.group(1) == "agg" else "بہتری"
            base = ur or rest or piece
            out.append((piece, f"{base} ({mark_ur})" if base else mark_ur, "modality"))
            continue
        # وقت کے جوڑ سے شروع ہونے والا لمبا ٹکڑا: «after violent rushes of blood»
        first = low.split()[0] if low.split() else ""
        if first in TIME_UR and len(low.split()) > 2:
            out.append((first, TIME_UR[first], "time"))
            rest = " ".join(low.split()[1:])
            for w in re.split(r"\s+|\bof\b|\band\b", rest):
                if not w or w in ("of", "and"):
                    continue
                r2, u2 = _tag_fragment(w)
                if r2:
                    out.append((w, u2, r2))
            continue
        role, ur = _tag_fragment(piece)
        if role:
            out.append((piece, ur, role))
            continue
        # بے وزن ٹکڑا؟ (internal, sense of …) → مکمل چھوڑ دیں
        if low in LEAN_FRAGMENTS or all(w in LEAN_FRAGMENTS for w in low.split()):
            continue
        # (ج) باقی: اندر کے الفاظ ایک ایک (right leg → دائیں + ٹانگ)
        got = False
        for w in re.split(r"\s+|,|/", low):
            if len(w) < 3:
                continue
            r2, u2 = _tag_fragment(w)
            if r2 and r2 != "other":
                out.append((w, u2, r2))
                got = True
        if not got:
            out.append((piece, piece, "other"))
    return out


def _condition_ur(pieces: List[str]) -> Tuple[str, Dict[str, str]]:
    """موڈیلٹی کی شاخ کا پورا مفہوم: «پیٹ میں دباؤ»، «دائیں کرواٹ پر لیٹنا» وغیرہ"""
    loc, mod, time_, side, qual = [], [], [], [], []
    for piece in pieces:
        role, ur = _tag_fragment(piece)
        if role == "location":
            loc.append(ur)
        elif role == "modality":
            mod.append(ur)
        elif role == "time":
            time_.append(ur)
        elif role == "side":
            side.append(ur)
        elif role == "quality":
            qual.append(ur)
        elif role == "sensation":
            mod.append(ur)          # «درد کے دوران» — یہاں احساس بھی شرط ہے
        elif role == "other":
            mod.append(piece)
    parts = []
    if loc and mod:
        parts.append("، ".join(loc) + " میں " + "، ".join(mod))
    elif mod:
        parts.append("، ".join(mod))
    elif loc:
        parts.append("، ".join(loc))
    if qual:
        parts.append("، ".join(qual))
    out = {
        "text": " ".join(parts),
        "side": "، ".join(side),
        "time": "، ".join(time_),
    }
    return out["text"], out


# ------------------------------------------------------------------ #
# 4) گرامر کا انجن
# ------------------------------------------------------------------ #
class RubricGrammar:
    """سنتھیسس/کینٹ کے ربرکس کو ٹکڑوں میں کھولنے والا ماڈیول"""

    SOURCES = {
        "synthesis": {"dir": "synthesis91_raw_chapters", "kind": "path", "chapter_ur": {
            "chest": "سینہ", "circulation": "دورانِ خون", "head": "سر", "upper_extremities": "بازو",
            "lower_extremities": "ٹانگیں", "extremities": "ہاتھ پاؤں", "chill": "سردی لگنا",
            "teeth": "دانت", "mind": "ذہن و دماغ", "back": "پیٹھ", "stool": "پاخانہ",
            "respiration": "سانس", "cough": "کھانسی", "stomach": "معدہ", "eyes": "آنکھیں",
            "face": "چہرہ", "mouth": "منہ", "throat": "گلا", "abdomen": "پیٹ", "skin": "جلد",
        }},
        "kent": {"dir": "kent_chapters", "kind": "commas", "chapter_ur": {}},
    }

    def __init__(self, repo_dir: Optional[Path] = None, sources: Optional[List[str]] = None):
        self.repo = Path(repo_dir or os.getenv("BISMILLAH_REPO", Path(__file__).resolve().parents[2]))
        self.sources = sources or ["synthesis", "kent"]
        self._store: Dict[str, dict] = {}          # rid -> خام ریکارڈ (باب کیش)
        self._cache: Dict[str, RubricParts] = {}

    # ---------- لوڈنگ ----------
    def _chapters(self, source: str) -> List[str]:
        d = self.repo / self.SOURCES[source]["dir"]
        if not d.exists():
            return []
        return sorted(p.stem for p in d.glob("*.json") if p.stem != "_index")

    def _record(self, source: str, chapter: str, key: str) -> dict:
        ck = f"{source}::{chapter}"
        if ck not in self._store:
            f = self.repo / self.SOURCES[source]["dir"] / f"{chapter}.json"
            try:
                data = json.loads(f.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    data = {f"r{i}": v for i, v in enumerate(data) if isinstance(v, dict)}
            except Exception:
                data = {}
            self._store[ck] = data if isinstance(data, dict) else {}
        return self._store[ck].get(key, {}) or {}

    # ---------- ایک ربرک کھولنا (کاما کے درجے → اجزاء) ----------
    def parse(self, rid: str, source: str = "synthesis") -> Optional[RubricParts]:
        if rid in self._cache:
            return self._cache[rid]
        chapter, key = (rid.split("::", 1) + [""])[:2]
        rec = self._record(source, chapter, key)
        if not rec:
            return None
        np = RubricParts(rid, chapter, source)
        np.remedy_count = len(rec.get("r") or {})

        if self.SOURCES.get(source, {}).get("kind") == "path" and rec.get("path"):
            levels = [x.strip() for x in str(rec["path"]).split(" - ") if x.strip()]
        else:
            levels = [x.strip() for x in str(rec.get("t") or "").split(",") if x.strip()]

        family = ""          # لاگو ہونے والا خاندان
        complaint_candidates: List[str] = []
        for i, lvl in enumerate(levels):
            text, ref = _strip_ref(lvl)
            if ref:
                np.see_ref = ref
            if i == 0 and self.SOURCES.get(source, {}).get("kind") == "path":
                np.fragments.append((lvl, "section", CHAPTER_UR.get(
                    _norm(lvl).replace(" ", "_"), self.SOURCES[source]["chapter_ur"].get(
                        _norm(lvl).replace(" ", "_"), ""))))
                continue
            low = _norm(text)

            # باب کا دہرایا ہوا نام → «باب» (مقام نہیں)
            first_piece = low.split(",")[0].strip()
            if i <= 1 and (low == _norm(chapter) or first_piece == _norm(chapter)):
                # صرف «Chill, etc.» / «Chest» جیسی دہرائی — نہ کہ «Chilliness…»
                np.fragments.append((text, "section", CHAPTER_UR.get(_norm(chapter).replace(" ", "_"), "")))
                continue

            # ---- خاندان کا تعین (کاما کا قانون) ----
            if low.startswith("aggravation"):
                family, np.family, np.polarity = "agg", "Aggravation", "agg"
                continue
            if low.startswith("amelioration"):
                family, np.family, np.polarity = "amel", "Amelioration", "amel"
                continue
            if low.startswith("concomitant"):
                family, np.family = "con", "Concomitants"
                continue
            if low == "pain" or low.startswith("pain,"):
                np.family = np.family or "PAIN"
                np.fragments.append((text, "sensation", "درد"))
                continue

            # «X and with Y» / «X with Y» → Y ہمراہ علامت ہے (نسخہ 3.1)
            con_tail: List[str] = []
            m_con = re.search(r"\s(?:and\s+)?with\s+(.+)$", text, flags=re.I)
            if m_con and family == "":
                con_tail = [m_con.group(1).strip()]
                text = text[:m_con.start()].strip()
            pieces = [x.strip() for x in re.split(r"[,;]", text) if x.strip()]
            # مرکب ٹکڑے: «arm and right leg» → «arm» + «right leg»
            expanded: List[str] = []
            for pc in pieces:
                if re.search(r"\band\b|\bor\b", pc, flags=re.I) and len(pc.split()) > 2:
                    expanded.extend([x.strip() for x in re.split(r"\band\b|\bor\b", pc, flags=re.I) if x.strip()])
                else:
                    expanded.append(pc)
            pieces = expanded

            # ---- خاندان کے مطابق کردار ----
            if family in ("agg", "amel"):
                # موڈیلٹی کی شاخ: یہاں کے سب ٹکڑے «حالت/شرط» ہیں (مقام بھی شرط کا حصہ)
                ur, comps = _condition_ur(pieces)
                if comps.get("time"):
                    np.fragments.append((text, "time", comps["time"]))
                if comps.get("side"):
                    np.fragments.append((text, "side", comps["side"]))
                if ur:
                    np.fragments.append((text, "modality", ur))
                elif not comps.get("time") and not comps.get("side"):
                    # الفاظ ذخیرے میں نہیں — پھر بھی یہ «شرط» ہے، خالی نہ چھوڑیں
                    np.fragments.append((text, "modality", "، ".join(pieces)))
                continue

            if family == "con":
                # ہمراہ علامت: اُس کے اپنے اجزاء (مقام + احساس + وقت/سمت)
                loc_ur, sen_ur, tim_ur, sid_ur = [], [], [], []
                for piece in pieces:
                    for (_t, ur, r) in _tag_pieces([piece]):
                        if r == "location":
                            loc_ur.append(ur)
                        elif r == "sensation":
                            sen_ur.append(ur)
                        elif r == "time":
                            tim_ur.append(ur)
                        elif r == "side":
                            sid_ur.append(ur)
                        elif r == "modality" and ur:
                            loc_ur.append(ur)
                parts = []
                if loc_ur:
                    parts.append("، ".join(dict.fromkeys(loc_ur)) + " کا")
                if sen_ur:
                    parts.append("، ".join(dict.fromkeys(sen_ur)))
                tail = "، ".join(dict.fromkeys(tim_ur + sid_ur))
                txt = " ".join(parts).strip() or text
                if tail:
                    txt += f" ({tail})"
                np.fragments.append((text, "concomitant", txt))
                continue

            # ---- عام شاخ: مقام / احساس / نوع / سمت / وقت / موڈیلٹی ----
            tagged = _tag_pieces(pieces)          # ہر آئٹم = (متن، اردو، کردار)
            for piece, ur, role in tagged:
                if role:
                    np.fragments.append((piece, role, ur))
            # ہمراہ حصہ الگ کردار کے ساتھ
            for tail in con_tail:
                for (_t2, u2, _r2) in _tag_pieces([tail]):
                    if u2:
                        np.fragments.append((tail, "concomitant", u2))

            # اگر اس درجے میں کچھ پہچان نہ ہوئی تو اُسے «شکایت» کے امیدوار کے طور پر رکھیں
            # (حتمی فیصلہ آخر میں: صرف اُس ربرک میں شکایت بنے گی جس میں کوئی اور جزو نہ ہو)
            recognised = ("location", "sensation", "quality", "modality", "time",
                          "side", "concomitant", "extension", "negation")
            if tagged and not any(r in recognised for (_t, _u, r) in tagged):
                complaint_candidates.append("، ".join(t for (t, _u, _r) in tagged) or text)

        # «شکایت» کا حتمی فیصلہ: صرف جب ربرک میں کوئی اور جزو نہ ہو
        recognised_roles = ("location", "sensation", "quality", "modality", "time",
                            "side", "concomitant", "extension", "negation", "complaint")
        if complaint_candidates and not any(f[1] in recognised_roles for f in np.fragments):
            main = complaint_candidates[0]
            ur_c = (_lookup_vocab(main, COMPLAINT_UR) or _lookup_vocab(main, MENTAL_UR)
                    or _lookup_vocab(main, SENSATION_UR) or main)
            np.fragments.append((main, "complaint", ur_c))

        # تکرار ہٹائیں (ایک ہی ٹکڑا دو بار نہ گنے)
        seen = set()
        uniq = []
        for frag in np.fragments:
            k = (frag[0].lower(), frag[1], frag[2])
            if k in seen:
                continue
            seen.add(k)
            uniq.append(frag)
        np.fragments = [f for f in uniq if f[1] or f[2]]

        # ضمنی مقام: احساس خود جس مقام کا تقاضا کرے
        if not np.has("location"):
            for (_t, r, ur) in list(np.fragments):
                if r == "sensation":
                    for k, v in IMPLIED_LOCATION.items():
                        if v and _norm(ur) == _norm(v) or k in _norm(ur):
                            np.fragments.insert(0, (k, "location", v))
                            break
                if np.has("location"):
                    break
        self._cache[rid] = np
        return np

    def chapter_records(self, source: str, chapter: str) -> dict:
        """باب کے تمام ریکارڈ (ڈیمو/جانچ کے لیے)"""
        self._record(source, chapter, "")
        return self._store.get(f"{source}::{chapter}", {})

    def find(self, source: str, chapter: str, needle: str) -> Optional[str]:
        """باب میں کوئی ربرک ڈھونڈنا (متن کا ٹکڑا دے کر) — ہر بار کا راستہ"""
        n = _norm(needle)
        for k, v in self.chapter_records(source, chapter).items():
            hay = _norm((v.get("path") or v.get("t") or ""))
            if n in hay:
                return f"{chapter}::{k}"
        return None

    def find_any(self, source: str, needle: str, chapters: Optional[List[str]] = None) -> Optional[str]:
        """کسی بھی باب میں ربرک ڈھونڈنا (متن کا ٹکڑا دے کر)"""
        for ch in (chapters or self._chapters(source)):
            rid = self.find(source, ch, needle)
            if rid:
                return rid
        return None

    def explain(self, rid: str, source: str = "synthesis") -> str:
        np = self.parse(rid, source)
        if np is None:
            return f"ربرک نہیں ملی: {rid}"
        return format_rubric(np)


# ------------------------------------------------------------------ #
# 5) اردو سینٹنس بنانا (کاما کے قانون کے مطابق جوڑنا)
# ------------------------------------------------------------------ #
# مقام کے رپو (اردو گرامر): «انگلیاں» → «انگلیوں»
_LOC_OBLIQUE = {
    "انگلیاں": "انگلیوں", "آنکھیں": "آنکھوں", "ہاتھ": "ہاتھوں", "ٹانگیں": "ٹانگوں",
    "گھٹنے": "گھٹنوں", "کان": "کانوں", "دانت": "دانت", "ہونٹ": "ہونٹوں", "پاؤں": "پاؤں",
    "بازو": "بازو", "کندھا": "کندھے", "جسم": "جسم", "ہڈیاں": "ہڈیوں", "پٹھے": "پٹھوں",
    "پپوٹے": "پپوٹوں", "مسوڑھے": "مسوڑھوں", "جوڑ": "جوڑوں", "غدود": "غدود", "اعصاب": "اعصاب",
}


def _loc_oblique(phrase: str) -> str:
    """«انگلیاں میں» نہیں، «انگلیوں میں»"""
    words = phrase.split()
    out = []
    for w in words:
        out.append(_LOC_OBLIQUE.get(w, w))
    return " ".join(out)


def _oblique(phrase: str) -> str:
    """اردو: مصدر کو اُردو گرامر کے مطابق ڈھالنا (لیٹنا → لیٹنے)"""
    words = phrase.split()
    if not words:
        return phrase
    if words[-1].endswith("نا") and len(words[-1]) > 3:
        words[-1] = words[-1][:-1] + "ے"      # لیٹنا → لیٹنے
    return " ".join(words)


def build_sentence_ur(np: RubricParts) -> str:
    """ربرک کے ٹکڑوں کو جوڑ کر پورا جملہ بنانا
    ترتیب (کینٹ کا S-T-M-E): مقام → احساس → نوع → سمت → وقت → موڈیلٹی → پھیلاؤ → ہمراہ
    قاعدہ: ہر کاما ایک نیا شرط ہے — اس لیے ٹکڑے «اور» سے نہیں، «—» سے جڑتے ہیں۔"""
    loc = np.of("location")
    sens = np.of("sensation")
    qual = np.of("quality")
    side = np.of("side")
    time_ = np.of("time")
    mod = np.of("modality")
    ext = np.of("extension")
    con = np.of("concomitant")
    simile = np.has("simile")

    clauses: List[str] = []

    # مقام (باب کا نام بھی مدد کرتا ہے)
    loc_txt = ""
    chapter_txt = _chapter_ur(np)
    if loc:
        seen = []
        for x in loc:
            if x not in seen:
                seen.append(x)
        loc_txt = _loc_oblique("، ".join(seen)) + " میں"
    elif chapter_txt and not sens:
        loc_txt = ""
    clauses.append(loc_txt) if loc_txt else None

    # شکایت (مرکزی لفظ)
    if np.complaint and not sens:
        clauses.append("، ".join(dict.fromkeys(np.complaint)))

    # احساس (+ تشبیہ)
    if sens:
        core = "، ".join(dict.fromkeys(sens))
        clauses.append(("گویا " + core) if simile else core)
    if qual:
        clauses.append("، ".join(dict.fromkeys(qual)))

    # موڈیلٹی/شرط + وقت
    if mod:
        cond = "، ".join(dict.fromkeys(mod))
        if np.polarity == "agg":
            cond = _oblique(cond) + (" سے" if np.family == "Aggravation" else " سے بگڑتا ہے")
        elif np.polarity == "amel":
            cond = _oblique(cond) + (" سے" if np.family == "Amelioration" else " سے بہتر ہوتا ہے")
        if time_:
            cond = cond + " (" + "، ".join(dict.fromkeys(time_)) + ")"
        clauses.append(cond)
    elif time_:
        clauses.append("، ".join(dict.fromkeys(time_)))

    # سمت
    if side:
        clauses.append("، ".join(dict.fromkeys(f"{x} طرف" for x in side)))

    # نفی — واضح الفاظ میں
    if np.has("negation"):
        clauses.append("(نفی — «نہیں»)")

    if ext:
        clauses.append("آگے تک پھیلتا ہے")

    sentence = " — ".join([c for c in clauses if c]).strip()
    if not sentence:
        sentence = chapter_txt or "عمومی"

    # جن ربرکس میں شکایت کا نام ہی خاندان ہے (صرف موڈیلٹی والا بگاڑ/بہتری)
    if not sens and np.polarity:
        chap = _chapter_ur(np)
        word = "بگاڑ" if np.polarity == "agg" else "بہتری"
        body = " — ".join([c for c in clauses if c])
        sentence = f"{chap} کا {word} — {body}" if body else f"{chap} کا {word}"

    if con:
        sentence += " | ہمراہ: " + "، ".join(dict.fromkeys(con))
    if np.see_ref:
        sentence += f" | (دیکھیں: {np.see_ref})"
    return sentence.strip(" |").strip("—").strip()


def _chapter_ur(np: RubricParts) -> str:
    sec = [ur for (_t, r, ur) in np.fragments if r == "section" and ur]
    if sec:
        return sec[0]
    ch = _norm(np.chapter).replace(" ", "_")
    if ch in CHAPTER_UR:
        return CHAPTER_UR[ch]
    return np.chapter.replace("_", " ")


CHAPTER_UR_FOR = CHAPTER_UR


def format_rubric(np: RubricParts) -> str:
    """ایک ربرک کی مکمل «پڑھائی» — جیسے یہ صفحے پر دکھائی جائے گی"""
    lines = []
    lines.append(f"▸ [{np.chapter}] {np.rid}   ({np.remedy_count} دوائیں · گہرائی {np.depth} · مکمل {np.completeness()})")
    lines.append(f"   پڑھائی: «{np.sentence_ur()}»")
    role_ur = {"section": "باب", "location": "مقام", "sensation": "احساس", "quality": "نوع/شدت",
               "side": "سمت", "time": "وقت", "modality": "موڈیلٹی", "extension": "پھیلاؤ",
               "concomitant": "ہمراہ", "negation": "نفی", "reference": "حوالہ", "other": "دیگر"}
    for (t, r, ur) in np.fragments:
        if r:
            lines.append(f"      • {role_ur.get(r, r)}: «{t}»" + (f" → {ur}" if ur else ""))
    if np.missing():
        lines.append(f"   ربرک میں کمی: {', '.join(np.missing())}")
    return "\n".join(lines)


# ------------------------------------------------------------------ #
# 6) دوسری طرف: **علامت کی تکمیل** (معالج کا کام — نسخہ 3.0)
# ------------------------------------------------------------------ #
def read_symptom(text: str) -> dict:
    """
    مریض کے ایک جملے کو وہی خانوں میں بانٹنا جو ربرک کے ٹکڑوں کے ہیں۔
    یہ «علامت جمع کرنا» نہیں، «علامت کو مکمل کرنے» کا پہلا قدم ہے۔
    """
    out = {"text": text, "location": [], "sensation": [], "modality": [], "time": [],
           "side": [], "quality": [], "negative": False, "other": []}
    t = _norm(text)
    if any(neg in t for neg in NEG_FRAGMENTS):
        out["negative"] = True
    # پورے فقرے پہلے دیکھیں (ترتیب: لمبا سے چھوٹا)
    for vocab, key in ((SENSATION_UR, "sensation"), (MODALITY_UR, "modality"),
                       (LOCATION_UR, "location"), (QUALITY_UR, "quality"), (TIME_UR, "time"),
                       (SIDE_UR, "side")):
        for phrase in sorted(vocab.keys(), key=len, reverse=True):
            if re.search(r"\b" + re.escape(phrase) + r"\b", t):
                if vocab[phrase] not in out[key]:
                    out[key].append(vocab[phrase])
                t = re.sub(r"\b" + re.escape(phrase) + r"\b", " ", t)
    out["other"] = [w for w in t.split() if len(w) > 3]
    return out


def missing_of(components: dict) -> List[str]:
    """علامت میں کون سے اجزاء کی کمی ہے — یہی وہ سوالات ہیں جو معالج کرے گا"""
    need = (("location", "مقام"), ("sensation", "احساس"), ("modality", "موڈیلٹی"))
    return [ur for k, ur in need if not components.get(k)]


def print_case_read(symptoms: List[str], title: str = "کیس کی پڑھائی") -> None:
    print("\n" + "=" * 78)
    print(title + " — ہر علامت کو مکمل کرنا (مقام + احساس + موڈیلٹی)")
    print("=" * 78)
    for s in symptoms:
        c = read_symptom(s)
        miss = missing_of(c)
        got = []
        if c["location"]:
            got.append("مقام: " + "، ".join(c["location"][:2]))
        if c["sensation"]:
            got.append("احساس: " + "، ".join(c["sensation"][:2]))
        if c["modality"]:
            got.append("موڈیلٹی: " + "، ".join(c["modality"][:2]))
        if c["side"]:
            got.append("سمت: " + "، ".join(c["side"]))
        flag = "✅ مکمل" if not miss else "⚠️ ادھوری"
        print(f"\n{flag} «{s[:70]}»")
        if got:
            print("   ملا: " + " · ".join(got))
        if miss:
            print("   پوچھیں: " + "، ".join(miss) + "؟")


# ------------------------------------------------------------------ #
# 7) اِستعمال کی مثال (ڈیمو)
# ------------------------------------------------------------------ #
if __name__ == "__main__":
    import sys
    repo = sys.argv[1] if len(sys.argv) > 1 else "/tmp/bc/repo"
    g = RubricGrammar(repo)

    # کیس کی حقیقی ربرکیں — دونوں سورس سے ڈھونڈ کر پڑھیں
    WANT = [
        ("synthesis", "squeezed; as if"),
        ("synthesis", "Aggravation - lying (in bed) - right side"),
        ("synthesis", "coldness, sense of - occiput"),
        ("synthesis", "Chattering rattling"),
        ("synthesis", "concomitants - teeth - teeth - chattering"),
        ("synthesis", "RESTLESSNESS - lying, while"),
        ("synthesis", "Numb, deadness - fingers"),
        ("synthesis", "Amelioration - lying"),
        ("synthesis", "ceasing, as if - after violent rushes"),
        ("kent", "PALPITATION heart, stool, during"),
        ("kent", "LIE down, could not"),
        ("kent", "NUMBNESS (See Tingling), left, arm and right leg"),
        ("kent", "CHATTERING"),
    ]
    print("=" * 84)
    print("ربرکس کی «پڑھائی» — کیس کی حقیقی ربرکیں (ٹکڑوں کے ساتھ)")
    print("=" * 84)
    for source, needle in WANT:
        rid = g.find_any(source, needle)
        if not rid:
            print(f"\n✗ نہیں ملی: [{source}] {needle}")
            continue
        np = g.parse(rid, source)
        if np:
            print()
            print(format_rubric(np))
            print(f"   ({source})")

    CASE = [
        "heart attacks",
        "heart feels as if squeezed",
        "cannot lie down",
        "violent palpitation",
        "cold shivering with chattering of teeth",
        "numbness of the right leg from toe to above knees",
        "frequent feeling as if heart stopped followed by rush of blood to the heart",
        "lying on right side brings on palpitation and weight on left side of chest",
        "fingers numb at times, especially the right",
        "no organic lesion discovered by auscultation",
    ]
    print_case_read(CASE, "مسز صبا کا کیس")
