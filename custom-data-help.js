// ==========================================
// Bismillah Clinic - Complete Help System
// Version: 1.0
// FEATURES:
// - Tooltips for all buttons
// - Detailed info modals
// - Interactive 10-step tour
// - Complete help center
// - FAQs and Pro Tips
// - Keyboard shortcuts (toggle-able)
// - Preferences system
// - Tips of the day
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // ALL CONTENT DATA (3 Languages - Pure Urdu)
    // ==========================================
    
    const HELP_CONTENT = {
        
        // ==========================================
        // BUTTON DESCRIPTIONS
        // ==========================================
        buttons: {
            
            // 1. Category Button
            category: {
                tooltip: {
                    ur: 'نئی کیٹگری بنائیں',
                    en: 'Add new category',
                    roman: 'Nayi Category banayen'
                },
                modal: {
                    ur: {
                        title: 'کیٹگری کے بارے میں',
                        icon: '🏷️',
                        content: `کیٹگری ایک "خانہ" ہوتا ہے جس میں بیماریوں کو ترتیب سے رکھا جاتا ہے۔

<b>مثال:</b>
کیٹگری: "دل کی بیماریاں" 💗
• ہارٹ اٹیک
• انجائنا
• کولیسٹرول

<b>کب استعمال کریں:</b>
جب کوئی نئی "ترتیب" بنانی ہو۔

<b>فائدہ:</b>
تشخیصی صفحے پر ٹیبز بنیں گے، بیماریوں کو منظم کر سکیں گے۔

<b>مثالیں:</b>
• 🎗️ "کینسر کی دیکھ بھال"
• 👩 "خواتین کے مسائل"
• 👶 "بچوں کی بیماریاں"
• 🧘 "ذہنی صحت"`
                    },
                    en: {
                        title: 'About Category',
                        icon: '🏷️',
                        content: `A Category is a "group" used to organize related diseases together.

<b>Example:</b>
Category: "Heart Care" 💗
• Heart Attack
• Angina
• Cholesterol

<b>When to use:</b>
When creating a new "grouping" or "type".

<b>Benefit:</b>
Creates tabs on diagnosis page, helps organize diseases systematically.

<b>Examples:</b>
• 🎗️ "Cancer Care"
• 👩 "Women's Health"
• 👶 "Pediatric Diseases"
• 🧘 "Mental Health"`
                    },
                    roman: {
                        title: 'Category ke baray mein',
                        icon: '🏷️',
                        content: `Category ek "group" hai jo related bemariyon ko organize karta hai.

<b>Example:</b>
Category: "Dil ki Bemariyan" 💗
• Heart Attack
• Angina
• Cholesterol

<b>Kab use karein:</b>
Jab koi nayi "tarteeb" ya "type" banani ho.

<b>Faida:</b>
Diagnosis page par tabs banain gay, bemariyon ko organize kar saken gay.`
                    }
                }
            },
            
            // 2. Symptom Button
            symptom: {
                tooltip: {
                    ur: 'نئی علامت شامل کریں',
                    en: 'Add new symptom',
                    roman: 'Nayi alamat shamil karein'
                },
                modal: {
                    ur: {
                        title: 'علامت کے بارے میں',
                        icon: '💡',
                        content: `علامت (سمپٹم) مریض کی "شکایت" ہوتی ہے۔

<b>مثالیں:</b>
• سر درد
• بخار
• کھانسی
• سینے میں جلن
• جوڑوں کا درد

<b>⚠️ خطرناک علامت:</b>
اگر علامت خطرناک ہے تو "خطرناک علامت" پر ٹک لگا دیں۔
تشخیص کے وقت ⚠️ کی علامت نظر آئے گی۔

<b>مثال خطرناک علامات:</b>
• شدید بخار (104°F+)
• سانس کی تکلیف
• بے ہوشی
• شدید درد

<b>کیٹگری منتخب کریں:</b>
ہر علامت کسی کیٹگری میں رکھی جاتی ہے۔
مثلاً "سر درد" → "دماغ" کیٹگری میں`
                    },
                    en: {
                        title: 'About Symptom',
                        icon: '💡',
                        content: `A Symptom is a patient's "complaint" or "sign" of illness.

<b>Examples:</b>
• Headache
• Fever
• Cough
• Chest burning
• Joint pain

<b>⚠️ Severe Symptom:</b>
Check "Severe/Red Flag" for dangerous symptoms.
The ⚠️ icon will appear in diagnosis.

<b>Examples of Severe:</b>
• High fever (104°F+)
• Breathing difficulty
• Unconsciousness
• Severe pain

<b>Select Category:</b>
Each symptom belongs to a category.
e.g. "Headache" → "Head/Neuro" category`
                    },
                    roman: {
                        title: 'Symptom ke baray mein',
                        icon: '💡',
                        content: `Symptom mareez ki "shikayat" ya "alamat" hoti hai.

<b>Examples:</b>
• Sar dard
• Bukhar
• Khansi
• Seenay mein jalan
• Joron ka dard

<b>⚠️ Khatarnak Symptom:</b>
Khatarnak alamat ke liye "Severe" tick karein.
Diagnosis mein ⚠️ nazar aayega.`
                    }
                }
            },
            
            // 3. Disease Button
            disease: {
                tooltip: {
                    ur: 'نئی بیماری کا مکمل پروٹوکول',
                    en: 'Add complete disease protocol',
                    roman: 'Nayi bimari ka protocol'
                },
                modal: {
                    ur: {
                        title: 'بیماری کے بارے میں',
                        icon: '🔬',
                        content: `بیماری میں مکمل معلومات شامل ہوتی ہیں:

<b>✓ نام:</b> اردو، انگلش، رومن
<b>✓ آئکن:</b> 💊 یا پسند کا کوئی
<b>✓ کیٹگری:</b> کس خانے میں
<b>✓ علامات:</b> جو علامتیں پائی جاتی ہیں
<b>✓ اہم علامات:</b> سب سے ضروری
<b>✓ ٹیسٹ:</b> کون سے ٹیسٹ کروانے
<b>✓ خطرے کی علامات:</b> ایمرجنسی
<b>✓ ادویات:</b> ہومیوپیتھک نسخے
<b>✓ مشورہ:</b> مریض کو کیا کہیں

<b>کب استعمال کریں:</b>
• اپنی تجربے کی بیماری شامل کرنے کے لیے
• جو بیماری پہلے سے موجود نہیں
• اپنا خاص پروٹوکول بنانے کے لیے

<b>مثال ادویات فارمیٹ:</b>
Aconite 30 | ابتدائی بخار | 4 گھنٹے میں

آپ کئی ادویات ایک ساتھ لکھ سکتے ہیں۔`
                    },
                    en: {
                        title: 'About Disease',
                        icon: '🔬',
                        content: `A Disease contains complete medical protocol:

<b>✓ Name:</b> Urdu, English, Roman
<b>✓ Icon:</b> 💊 or custom
<b>✓ Category:</b> Which group
<b>✓ Symptoms:</b> Related symptoms
<b>✓ Key Symptoms:</b> Most important
<b>✓ Tests:</b> Recommended tests
<b>✓ Red Flags:</b> Emergency signs
<b>✓ Remedies:</b> Homeopathic prescriptions
<b>✓ Advice:</b> Patient guidance

<b>When to use:</b>
• Add your experience-based diseases
• Diseases not already in database
• Create custom protocols

<b>Remedy Format:</b>
Aconite 30 | Initial fever | Every 4 hours

You can add multiple remedies.`
                    },
                    roman: {
                        title: 'Disease ke baray mein',
                        icon: '🔬',
                        content: `Disease mein poori medical protocol hoti hai:

<b>✓ Name:</b> 3 languages mein
<b>✓ Icon:</b> 💊 ya custom
<b>✓ Category</b>
<b>✓ Symptoms</b>
<b>✓ Key Symptoms</b>
<b>✓ Tests</b>
<b>✓ Red Flags</b>
<b>✓ Remedies</b>
<b>✓ Advice</b>`
                    }
                }
            },
            
            // 4. View / Edit / Delete
            view_edit_delete: {
                tooltip: {
                    ur: 'سب کسٹم ڈیٹا دیکھیں اور منظم کریں',
                    en: 'Manage all custom data',
                    roman: 'Sab custom data manage karein'
                },
                modal: {
                    ur: {
                        title: 'دیکھیں / ایڈٹ / ڈیلیٹ',
                        icon: '📋',
                        content: `یہاں سے آپ کر سکتے ہیں:

<b>✏️ ایڈٹ (تبدیل کریں):</b>
موجودہ چیزوں میں تبدیلی
• نام بدلیں
• کیٹگری بدلیں
• کوئی بھی معلومات update

<b>🗑️ ڈیلیٹ (مٹا دیں):</b>
غیر ضروری چیزیں ہٹا دیں
⚠️ احتیاط: واپس نہیں آئے گا

<b>✅ پروموٹ کریں:</b>
"یہ چیز میں نے گٹ ہب پر شامل کر دی"
اس پر نشان لگ جائے گا: ✅ گٹ ہب

<b>↩️ ان پروموٹ:</b>
غلطی سے پروموٹ کر دیا؟ نشان واپس لیں

<b>Badges کے مطلب:</b>

🆕 <b>New</b> = ابھی کلاؤڈ پر ہے
   • اگلی بیک اپ میں آئے گی
   • گٹ ہب پر نہیں گئی

✅ <b>GitHub</b> = پروموٹ ہو گئی
   • گٹ ہب پر شامل ہے
   • بیک اپ سے exclude`
                    },
                    en: {
                        title: 'View / Edit / Delete',
                        icon: '📋',
                        content: `From here you can:

<b>✏️ Edit:</b>
Modify existing items
• Change name
• Change category
• Update any info

<b>🗑️ Delete:</b>
Remove unwanted items
⚠️ Caution: Cannot be recovered

<b>✅ Promote:</b>
"This item is added to GitHub"
Mark it: ✅ GitHub

<b>↩️ Unpromote:</b>
Accidentally promoted? Undo it.

<b>Badge Meanings:</b>

🆕 <b>New</b> = Only on cloud
   • Will be in next backup
   • Not on GitHub yet

✅ <b>GitHub</b> = Promoted
   • Added to GitHub
   • Excluded from backup`
                    },
                    roman: {
                        title: 'View / Edit / Delete',
                        icon: '📋',
                        content: `Yahan se aap:

<b>✏️ Edit</b> - tabdeel karein
<b>🗑️ Delete</b> - mita dein
<b>✅ Promote</b> - GitHub mark
<b>↩️ Unpromote</b> - mark hataein

<b>Badges:</b>
🆕 New = abhi add ki
✅ GitHub = permanent`
                    }
                }
            },
            
            // 5. History
            history: {
                tooltip: {
                    ur: 'تمام تبدیلیوں کا ریکارڈ',
                    en: 'Log of all changes',
                    roman: 'Tabdeeliyon ka record'
                },
                modal: {
                    ur: {
                        title: 'ہسٹری (تاریخ)',
                        icon: '📚',
                        content: `ہسٹری لاگ میں نظر آئے گا:

<b>➕ Add:</b> کیا کیا شامل کیا
<b>✏️ Edit:</b> کیا کیا تبدیل کیا
<b>🗑️ Delete:</b> کیا کیا مٹایا
<b>✅ Promote:</b> کیا گٹ ہب پر گیا
<b>↩️ Unpromote:</b> نشان واپس لیا
<b>🧹 Cleanup:</b> کب صفائی کی

<b>ہر entry کے ساتھ:</b>
📅 تاریخ اور وقت
👤 کس یوزر نے کیا
🎯 کس آئٹم پر کیا

<b>کب استعمال کریں:</b>
• یاد کرنے کے لیے کیا کیا تھا
• کب کیا تھا
• اگر کچھ غلط ہو تو track کریں

<b>محدودیت:</b>
آخری 200 changes رکھی جاتی ہیں۔
پرانی خودکار ڈیلیٹ ہو جاتی ہیں۔

<b>صاف کرنا چاہیں تو:</b>
"ہسٹری صاف کریں" بٹن دبائیں۔`
                    },
                    en: {
                        title: 'History Log',
                        icon: '📚',
                        content: `History log shows:

<b>➕ Add:</b> What was added
<b>✏️ Edit:</b> What was edited
<b>🗑️ Delete:</b> What was deleted
<b>✅ Promote:</b> What went to GitHub
<b>↩️ Unpromote:</b> Mark removed
<b>🧹 Cleanup:</b> When cleaned up

<b>Each entry includes:</b>
📅 Date & Time
👤 Which user
🎯 Which item

<b>When to use:</b>
• Recall what you did
• When you did it
• Track if something wrong

<b>Limit:</b>
Last 200 changes kept.
Older auto-deleted.`
                    },
                    roman: {
                        title: 'History Log',
                        icon: '📚',
                        content: `History log dikhata hai:

<b>➕ Add</b> - kya add kiya
<b>✏️ Edit</b> - kya edit kiya
<b>🗑️ Delete</b> - kya delete kiya
<b>✅ Promote</b> - GitHub mark
<b>🧹 Cleanup</b> - safai

<b>Har entry:</b>
📅 Date & Time
👤 User
🎯 Item`
                    }
                }
            },
            
            // 6. Import
            import: {
                tooltip: {
                    ur: 'فائل سے ڈیٹا لائیں (جے سن یا سی ایس وی)',
                    en: 'Import data from file (JSON/CSV)',
                    roman: 'File se data laayein'
                },
                modal: {
                    ur: {
                        title: 'امپورٹ (فائل سے ڈیٹا لائیں)',
                        icon: '📥',
                        content: `دو قسم کی فائلیں امپورٹ ہو سکتی ہیں:

<b>1️⃣ .json فائل:</b>
• بیک اپ فائل
• دوسرے ڈاکٹر سے آئی
• آپ کی پرانی محفوظ

<b>2️⃣ .csv فائل:</b>
• ایکسل ٹیبل
• بلک ڈیٹا
• آسان بنانے کے لیے

<b>استعمالات:</b>

📱 <b>دوسرے ڈاکٹر سے:</b>
   ان کی بھیجی فائل امپورٹ کریں

💾 <b>بیک اپ سے:</b>
   اگر ڈیٹا کھو گیا واپس لائیں

📊 <b>ایکسل سے:</b>
   100+ چیزیں ایک ساتھ

<b>خودکار پہچان:</b>
سسٹم خود دیکھ لے گا فائل جے سن ہے یا سی ایس وی۔

<b>سی ایس وی فارمیٹ مثال:</b>
type,id,ur,en,roman,category,severe
category,heart,دل,Heart,Dil,,
symptom,cough,کھانسی,Cough,Khansi,respiratory,false`
                    },
                    en: {
                        title: 'Import (JSON/CSV)',
                        icon: '📥',
                        content: `Two types of files can be imported:

<b>1️⃣ .json file:</b>
• Backup file
• From another doctor
• Your old saved data

<b>2️⃣ .csv file:</b>
• Excel table
• Bulk data
• For easy input

<b>Use Cases:</b>

📱 <b>From another doctor:</b>
   Import their shared file

💾 <b>Restore backup:</b>
   Recover lost data

📊 <b>From Excel:</b>
   100+ items at once

<b>Auto Detection:</b>
System detects if file is JSON or CSV.

<b>CSV Format Example:</b>
type,id,ur,en,roman,category,severe
category,heart,Dil,Heart,Dil,,
symptom,cough,Khansi,Cough,Khansi,respiratory,false`
                    },
                    roman: {
                        title: 'Import (JSON/CSV)',
                        icon: '📥',
                        content: `2 files import ho sakti hain:

<b>1. .json file</b> (backup se)
<b>2. .csv file</b> (Excel table)

<b>Uses:</b>
📱 Doosray doctor se
💾 Backup restore
📊 Excel bulk

<b>Auto detection:</b>
System khud dekhta hai file type.`
                    }
                }
            },
            
            // 7. Full Backup
            full_backup: {
                tooltip: {
                    ur: 'سب کچھ محفوظ کریں (مکمل بیک اپ)',
                    en: 'Save everything (full backup)',
                    roman: 'Sab kuch save karein'
                },
                modal: {
                    ur: {
                        title: 'مکمل بیک اپ',
                        icon: '📦',
                        content: `مکمل بیک اپ میں شامل ہوگا:

<b>✅ سب کیٹگریز</b>
   نئی + پرانی (پروموٹڈ)

<b>✅ سب علامات</b>
   نئی + پرانی

<b>✅ سب بیماریاں</b>
   نئی + پرانی

<b>یعنی سب کچھ!</b>

<b>کب لیں:</b>

💾 <b>حفاظتی بیک اپ:</b>
   کچھ کھو جانے سے بچاؤ

📤 <b>شئیر کرنا:</b>
   دوسرے ڈاکٹر کو دینا

📱 <b>نئے ڈیوائس پر:</b>
   مکمل سیٹ اپ لے جانا

📅 <b>کتنی بار لیں:</b>
   مہینے میں کم از کم ایک بار

<b>فائل کا نام:</b>
<code>bhc-full-backup-2025-01-28.json</code>

<b>کہاں محفوظ کریں:</b>
• گوگل ڈرائیو
• ای میل میں
• ہارڈ ڈرائیو`
                    },
                    en: {
                        title: 'Full Backup',
                        icon: '📦',
                        content: `Full Backup includes:

<b>✅ All Categories</b>
   New + Old (promoted)

<b>✅ All Symptoms</b>
   New + Old

<b>✅ All Diseases</b>
   New + Old

<b>Everything!</b>

<b>When to use:</b>

💾 <b>Safety backup:</b>
   Prevent data loss

📤 <b>Sharing:</b>
   Give to another doctor

📱 <b>New device:</b>
   Complete setup transfer

📅 <b>Frequency:</b>
   At least once a month

<b>File name:</b>
<code>bhc-full-backup-2025-01-28.json</code>`
                    },
                    roman: {
                        title: 'Full Backup',
                        icon: '📦',
                        content: `Sab kuch save hoga:

<b>✅ Sab Categories</b>
<b>✅ Sab Symptoms</b>
<b>✅ Sab Diseases</b>

<b>Kab lein:</b>
💾 Safety ke liye
📤 Share karna
📱 Naye device

<b>Kitni baar:</b>
Maheenay mein 1 baar`
                    }
                }
            },
            
            // 8. Only New Backup
            only_new_backup: {
                tooltip: {
                    ur: 'صرف نئی چیزیں (جو گٹ ہب پر نہیں)',
                    en: 'Only new items (not on GitHub)',
                    roman: 'Sirf nayi items'
                },
                modal: {
                    ur: {
                        title: 'صرف نئی بیک اپ',
                        icon: '🆕',
                        content: `صرف <b>نئی (ان پروموٹڈ)</b> چیزیں محفوظ ہوں گی۔

<b>مطلب:</b>
✅ جو ابھی گٹ ہب پر نہیں گئیں
❌ پروموٹڈ چیزیں شامل نہیں

<b>کیوں مفید:</b>

🎯 <b>گٹ ہب پر بھیجنے سے پہلے:</b>
   بس نئی چیزوں کو دیکھنے کے لیے

🚫 <b>ڈپلیکیٹ سے بچاؤ:</b>
   دوبارہ گٹ ہب پر نہ چلی جائیں

📉 <b>چھوٹی فائل:</b>
   کم ڈیٹا، تیز کام

<b>مثال:</b>

آپ کے پاس ہے:
• 100 کل چیزیں
• 60 پروموٹڈ (گٹ ہب پر)
• 40 نئی

مکمل بیک اپ: 100 چیزیں
🆕 صرف نئی: <b>صرف 40 چیزیں</b>

<b>کب لیں:</b>
📅 ہر ہفتے
📅 گٹ ہب پر بھیجنے سے پہلے

<b>فائل کا نام:</b>
<code>bhc-new-only-2025-01-28.json</code>`
                    },
                    en: {
                        title: 'Only New Backup',
                        icon: '🆕',
                        content: `Only <b>new (unpromoted)</b> items will be saved.

<b>Meaning:</b>
✅ Items NOT yet on GitHub
❌ Promoted items excluded

<b>Why useful:</b>

🎯 <b>Before sending to GitHub:</b>
   Review only new items

🚫 <b>Avoid duplicates:</b>
   Don't re-add to GitHub

📉 <b>Smaller file:</b>
   Less data, faster work

<b>Example:</b>

You have:
• 100 total items
• 60 promoted (on GitHub)
• 40 new

Full Backup: 100 items
🆕 Only New: <b>Only 40 items</b>

<b>When to use:</b>
📅 Weekly
📅 Before GitHub push`
                    },
                    roman: {
                        title: 'Only New Backup',
                        icon: '🆕',
                        content: `Sirf <b>nayi (unpromoted)</b> items save hongi.

<b>Kyun useful:</b>
🎯 GitHub par bhejne se pehle
🚫 Duplicates se bachao
📉 Choti file

<b>Example:</b>
100 total, 60 promoted, 40 nayi
🆕 Only New = sirf 40`
                    }
                }
            },
            
            // 9. Export for GitHub
            export_github: {
                tooltip: {
                    ur: 'گٹ ہب میں پیسٹ کرنے کا کوڈ',
                    en: 'Ready-to-paste GitHub code',
                    roman: 'GitHub ke liye code'
                },
                modal: {
                    ur: {
                        title: 'گٹ ہب کے لیے ایکسپورٹ',
                        icon: '📝',
                        content: `یہ <b>جاوا اسکرپٹ کوڈ</b> بنائے گا جو diagnosis-data.js میں پیسٹ ہو جائے گا۔

<b>کوڈ میں شامل:</b>

✅ <b>کیٹگریز</b> → CATEGORIES_DB میں
✅ <b>علامات</b> → SYMPTOMS_DB میں
✅ <b>بیماریاں</b> → DISEASES_DB array میں

<b>صرف نئی چیزیں</b> (ڈپلیکیٹ نہیں)

<b>مکمل طریقہ:</b>

<b>مرحلہ 1:</b> بٹن دبائیں
       ↓
   .txt فائل ڈاؤن لوڈ

<b>مرحلہ 2:</b> فائل کھولیں
       ↓
   Notepad یا کوڈ ایڈیٹر میں

<b>مرحلہ 3:</b> گٹ ہب پر جائیں
       ↓
   اپنے پروجیکٹ میں

<b>مرحلہ 4:</b> diagnosis-data.js edit کریں
       ↓
   Categories → CATEGORIES_DB میں پیسٹ
   Symptoms → SYMPTOMS_DB میں پیسٹ
   Diseases → DISEASES_DB array میں پیسٹ

<b>مرحلہ 5:</b> Commit + Push

<b>مرحلہ 6:</b> ایپ میں واپس آ کر
       ↓
   ہر چیز پر "✅" دبائیں (پروموٹ)

<b>💡 آسان طریقہ:</b>
"مائیگریشن وزرڈ" استعمال کریں!`
                    },
                    en: {
                        title: 'Export for GitHub',
                        icon: '📝',
                        content: `Generates <b>JavaScript code</b> ready to paste into diagnosis-data.js

<b>Code includes:</b>

✅ <b>Categories</b> → for CATEGORIES_DB
✅ <b>Symptoms</b> → for SYMPTOMS_DB
✅ <b>Diseases</b> → for DISEASES_DB array

<b>Only new items</b> (no duplicates)

<b>Complete Process:</b>

<b>Step 1:</b> Click button
       ↓
   .txt file downloads

<b>Step 2:</b> Open the file
       ↓
   In Notepad or code editor

<b>Step 3:</b> Go to GitHub
       ↓
   Your project

<b>Step 4:</b> Edit diagnosis-data.js
       ↓
   Paste each section correctly

<b>Step 5:</b> Commit + Push

<b>Step 6:</b> Return to app
       ↓
   Click "✅" on each item (promote)

<b>💡 Easier way:</b>
Use "Migration Wizard"!`
                    },
                    roman: {
                        title: 'Export for GitHub',
                        icon: '📝',
                        content: `<b>JavaScript code</b> banata hai jo diagnosis-data.js mein paste hoga.

<b>Steps:</b>
1. Button dabayein
2. .txt file download
3. GitHub par edit karein
4. Paste karein
5. Commit + Push
6. App mein "✅" dabayein

<b>💡 Easy way:</b>
"Migration Wizard" use karein!`
                    }
                }
            },
            
            // 10. Migration Wizard
            migration_wizard: {
                tooltip: {
                    ur: 'مرحلہ وار رہنمائی',
                    en: 'Step-by-step guided workflow',
                    roman: 'Step-by-step guide'
                },
                modal: {
                    ur: {
                        title: 'مائیگریشن وزرڈ (منتقلی معاون)',
                        icon: '🚀',
                        content: `⭐ <b>نئے صارفین کے لیے بہترین!</b>

یہ آپ کو مرحلہ وار رہنمائی کرے گا:

<b>1️⃣ آپ کی چیزوں کی گنتی دکھائے گا</b>
   کتنی نئی ہیں، کتنی پروموٹڈ

<b>2️⃣ ایکسپورٹ فائل بنائے گا</b>
   خودکار ڈاؤن لوڈ

<b>3️⃣ ہدایات دے گا</b>
   کیا کرنا ہے

<b>4️⃣ تصدیق لے گا</b>
   ہر مرحلے پر پوچھے گا

<b>کب استعمال کریں:</b>

🎯 <b>پہلی بار:</b>
   جب گٹ ہب پر پہلی بار بھیج رہے ہوں

🤔 <b>الجھن ہو تو:</b>
   وزرڈ سب سنبھال لے گا

🚀 <b>تیز کام:</b>
   منٹوں میں مکمل عمل

<b>مہینے میں ایک بار</b> استعمال کریں!

<b>یہ کیوں بہتر:</b>

<b>عام طریقہ:</b>
❌ خود سب سوچنا
❌ فائلیں ڈھونڈنا
❌ غلطی کا خطرہ

<b>وزرڈ کے ساتھ:</b>
✅ خودکار سب کچھ
✅ صحیح ترتیب
✅ کوئی غلطی نہیں`
                    },
                    en: {
                        title: 'Migration Wizard',
                        icon: '🚀',
                        content: `⭐ <b>Best for beginners!</b>

Guides you step-by-step:

<b>1️⃣ Shows item count</b>
   How many new vs promoted

<b>2️⃣ Creates export file</b>
   Auto downloads

<b>3️⃣ Provides instructions</b>
   What to do next

<b>4️⃣ Asks for confirmation</b>
   At each step

<b>When to use:</b>

🎯 <b>First time:</b>
   Sending to GitHub first time

🤔 <b>If confused:</b>
   Wizard handles everything

🚀 <b>Fast work:</b>
   Complete process in minutes

Use <b>once a month</b>!

<b>Why better:</b>

<b>Normal way:</b>
❌ Think of everything yourself
❌ Find files
❌ Risk of mistakes

<b>With Wizard:</b>
✅ Automated everything
✅ Correct order
✅ No mistakes`
                    },
                    roman: {
                        title: 'Migration Wizard',
                        icon: '🚀',
                        content: `⭐ <b>Beginners ke liye BEST!</b>

Step-by-step guide karta hai:

<b>1️⃣ Items count</b>
<b>2️⃣ Export file</b>
<b>3️⃣ Instructions</b>
<b>4️⃣ Confirmation</b>

<b>Kab use karein:</b>
🎯 Pehli baar
🤔 Confuse ho to
🚀 Fast process

Maheenay mein 1 baar!`
                    }
                }
            },
            
            // 11. Cleanup Promoted
            cleanup: {
                tooltip: {
                    ur: 'گٹ ہب پر شامل ہو چکی چیزیں مٹا دیں',
                    en: 'Delete items already on GitHub',
                    roman: 'Promoted items delete karein'
                },
                modal: {
                    ur: {
                        title: 'پروموٹڈ صفائی',
                        icon: '🧹',
                        content: `⚠️ <b>احتیاط:</b> یہ چیزیں مٹا دے گا!

<b>کیا مٹے گا:</b>
✅ صرف <b>پروموٹڈ</b> چیزیں (✅ badge والی)
❌ <b>نئی</b> چیزیں (🆕 badge والی) محفوظ رہیں گی

<b>کیوں ضروری:</b>

کلاؤڈ میں duplicate ہونا کوئی مسئلہ نہیں لیکن:

🧹 <b>ڈیٹا صاف رکھنا</b> اچھی عادت
📉 <b>کلاؤڈ اسٹوریج</b> بہتر
🎯 <b>الجھن سے بچاؤ</b>

<b>کب دبائیں:</b>

<b>مرحلہ 1:</b> گٹ ہب پر اضافہ کریں
<b>مرحلہ 2:</b> ہر چیز پر "✅" دبائیں
<b>مرحلہ 3:</b> پھر یہ بٹن دبائیں

<b>مثال:</b>

<b>پہلے:</b>
کلاؤڈ پر: 100 چیزیں
• 80 پروموٹڈ (گٹ ہب پر ہیں)
• 20 نئی

<b>صفائی دبائیں:</b>
       ↓
80 پروموٹڈ حذف!

<b>بعد میں:</b>
کلاؤڈ پر: 20 چیزیں (سب نئی)
تشخیص میں:
• 150 ڈیفالٹ (diagnosis-data.js سے)
• 80 پروموٹڈ (اب سیدھا گٹ ہب سے)
• 20 نئی (کلاؤڈ سے)
کل: 250 چیزیں دستیاب
کوئی ڈپلیکیٹ نہیں! ✅`
                    },
                    en: {
                        title: 'Cleanup Promoted',
                        icon: '🧹',
                        content: `⚠️ <b>Warning:</b> This will delete items!

<b>What will be deleted:</b>
✅ Only <b>Promoted</b> items (with ✅ badge)
❌ <b>New</b> items (with 🆕 badge) remain safe

<b>Why important:</b>

Not required, but:

🧹 Keep data clean (best practice)
📉 Optimize cloud storage
🎯 Avoid confusion

<b>When to use:</b>

<b>Step 1:</b> Add to GitHub
<b>Step 2:</b> Click "✅" on each item
<b>Step 3:</b> Then click this button

<b>Example:</b>

<b>Before:</b>
Cloud: 100 items
• 80 promoted (on GitHub)
• 20 new

<b>Click Cleanup:</b>
       ↓
80 promoted deleted!

<b>After:</b>
Cloud: 20 items (all new)
Diagnosis:
• 150 default (from diagnosis-data.js)
• 80 promoted (now from GitHub)
• 20 new (from cloud)
Total: 250 items
No duplicates! ✅`
                    },
                    roman: {
                        title: 'Cleanup Promoted',
                        icon: '🧹',
                        content: `⚠️ <b>Warning:</b> Items delete honge!

<b>Kya delete hoga:</b>
✅ Sirf <b>Promoted</b> items
❌ <b>New</b> items safe rahengi

<b>Kab use karein:</b>
GitHub par add karne <b>ke baad</b>
"✅ Promoted" mark karne <b>ke baad</b>

<b>Faida:</b>
🧹 Data clean
📉 Storage optimize
🎯 No confusion`
                    }
                }
            },
            
            // 12. Sync Button
            sync: {
                tooltip: {
                    ur: 'کلاؤڈ سے تازہ ڈیٹا لیں',
                    en: 'Fetch fresh data from cloud',
                    roman: 'Cloud se fresh data'
                },
                modal: {
                    ur: {
                        title: 'سنک (کلاؤڈ سے فوری اپڈیٹ)',
                        icon: '☁️',
                        content: `کلاؤڈ سے تازہ ڈیٹا لے آئے گا۔

<b>کب دبائیں:</b>

✅ دوسرے ڈیوائس پر کچھ شامل کیا ہو
✅ ڈیٹا اپڈیٹ نہ ہو رہا ہو
✅ نئے ڈیوائس پر پہلی بار
✅ فوری تازہ چاہیے

<b>مثال:</b>

📱 <b>موبائل پر:</b>
   5 بیماریاں شامل کیں

💻 <b>ڈیسک ٹاپ پر آئے:</b>
   کوئی نظر نہیں آ رہی

<b>حل:</b>
"☁️ سنک" دبائیں!
       ↓
✅ سب کچھ آ گیا!

<b>خودکار سنک:</b>

عام طور پر آپ کو یہ بٹن نہیں دبانا پڑے گا کیونکہ:

⚡ <b>ہر 30 سیکنڈ میں</b> خودکار سنک
⚡ <b>انٹرنیٹ آنے پر</b> خودکار سنک
⚡ <b>ایپ کھلنے پر</b> خودکار سنک

یہ صرف <b>manual</b> کے لیے ہے۔

<b>سنک اسٹیٹس:</b>

🟢 <b>Ready</b> = سب ٹھیک
🟡 <b>Syncing</b> = ہو رہی ہے
🔴 <b>Offline</b> = انٹرنیٹ نہیں`
                    },
                    en: {
                        title: 'Sync (Instant Cloud Update)',
                        icon: '☁️',
                        content: `Fetches latest data from cloud.

<b>When to use:</b>

✅ Added items on another device
✅ Data not updating
✅ First time on new device
✅ Need instant refresh

<b>Example:</b>

📱 <b>On Mobile:</b>
   Added 5 diseases

💻 <b>Open Desktop:</b>
   Nothing visible

<b>Solution:</b>
Click "☁️ Sync"!
       ↓
✅ Everything appears!

<b>Automatic Sync:</b>

Usually you don't need to click:

⚡ <b>Every 30 seconds</b> auto-sync
⚡ <b>When online</b> auto-sync
⚡ <b>App opens</b> auto-sync

This is for <b>manual</b> only.

<b>Sync Status:</b>

🟢 <b>Ready</b> = All good
🟡 <b>Syncing</b> = In progress
🔴 <b>Offline</b> = No internet`
                    },
                    roman: {
                        title: 'Sync',
                        icon: '☁️',
                        content: `Cloud se latest data laata hai.

<b>Kab use karein:</b>
✅ Doosray device par kuch add
✅ Data update nahi ho raha
✅ Naye device par pehli baar

<b>Auto sync:</b>
Har 30 seconds mein
Internet aane par
App khulne par`
                    }
                }
            }
        },
        
        // ==========================================
        // TOUR STEPS (10 Complete Steps)
        // ==========================================
        tour: {
            welcome: {
                ur: {
                    title: '🎉 خوش آمدید!',
                    heading: 'بسم اللہ ہومیوپیتھک کلینک',
                    content: `کیا آپ چاہتے ہیں میں آپ کو پوری ایپ کا استعمال سکھاؤں؟

<b>ٹور میں شامل ہے:</b>
✅ مکمل رہنمائی
⏱️ صرف 5-7 منٹ
🎯 10 آسان مراحل
🎓 ہر چیز کی وضاحت

<b>آپ کر سکتے ہیں:</b>

🎓 مکمل ٹور شروع کریں
⚡ صرف اہم چیزیں (2 منٹ)
❌ ابھی نہیں، شکریہ

💡 بعد میں بھی مدد بٹن ❓ سے ٹور شروع کر سکتے ہیں`
                },
                en: {
                    title: '🎉 Welcome!',
                    heading: 'Bismillah Homeopathic Clinic',
                    content: `Would you like me to teach you the complete app usage?

<b>Tour includes:</b>
✅ Complete guidance
⏱️ Only 5-7 minutes
🎯 10 easy steps
🎓 Explanation of everything

<b>You can:</b>

🎓 Start Complete Tour
⚡ Quick Tour (2 minutes)
❌ Not now, thanks

💡 You can start tour later from ❓ Help button`
                },
                roman: {
                    title: '🎉 Khush Aamdeed!',
                    heading: 'Bismillah Homeopathic Clinic',
                    content: `Kya aap chahte hain main aap ko poori app ka use sikhaon?

<b>Tour mein:</b>
✅ Complete guidance
⏱️ 5-7 minutes
🎯 10 easy steps

<b>Aap kar sakte hain:</b>
🎓 Complete Tour
⚡ Quick Tour (2 min)
❌ Abhi nahi`
                }
            },
            
            steps: [
                // Step 1: Introduction
                {
                    id: 'intro',
                    target: null,
                    position: 'center',
                    content: {
                        ur: {
                            title: '🏥 ایپ کا تعارف',
                            body: `<b>بسم اللہ ہومیوپیتھک کلینک</b>

یہ ایپ آپ کے لیے مفید ہے:

✅ مریضوں کا مکمل ریکارڈ رکھنا
✅ ملاقاتیں (وزٹس) محفوظ کرنا
✅ خاندانی نظام (فیملی سسٹم)
✅ تشخیصی مدد (150+ بیماریاں)
✅ کلاؤڈ پر خودکار محفوظ
✅ آفلائن بھی کام کرتی ہے
✅ تین زبانوں میں: اردو، انگلش، رومن

آئیے شروع کرتے ہیں!`
                        },
                        en: {
                            title: '🏥 App Introduction',
                            body: `<b>Bismillah Homeopathic Clinic</b>

This app is useful for:

✅ Complete patient records
✅ Save consultations (visits)
✅ Family system
✅ Diagnostic assistance (150+ diseases)
✅ Auto cloud save
✅ Works offline too
✅ 3 languages: Urdu, English, Roman

Let's begin!`
                        },
                        roman: {
                            title: '🏥 App Introduction',
                            body: `<b>Bismillah Homeopathic Clinic</b>

Yeh app useful hai:

✅ Complete patient records
✅ Consultations save
✅ Family system
✅ Diagnostic help (150+ diseases)
✅ Auto cloud save
✅ Offline bhi kaam
✅ 3 languages

Chalo shuru karte hain!`
                        }
                    }
                },
                
                // Step 2: Login
                {
                    id: 'login',
                    target: null,
                    position: 'center',
                    content: {
                        ur: {
                            title: '🔓 لاگ ان سسٹم',
                            body: `<b>لاگ ان کیسے کریں:</b>

1. اپنا Username لکھیں
2. Password لکھیں
3. "🔓 لاگ ان" دبائیں

<b>💡 اہم فیچر: "مجھے یاد رکھیں"</b>

اگر آپ اس پر ٹک لگا دیں گے تو:
✅ اگلی بار خودکار لاگ ان
✅ Username/Password یاد رہے گا
✅ 30 دن تک محفوظ

<b>🔒 آپ کی معلومات محفوظ ہیں</b>

Demo: doctor / 1234

<b>لاگ آؤٹ:</b>
اوپر بائیں طرف 🚪 بٹن سے`
                        },
                        en: {
                            title: '🔓 Login System',
                            body: `<b>How to Login:</b>

1. Enter your Username
2. Enter Password
3. Click "🔓 Login"

<b>💡 Important: "Remember Me"</b>

If you check this:
✅ Auto-login next time
✅ Username/Password saved
✅ Valid for 30 days

<b>🔒 Your data is secure</b>

Demo: doctor / 1234

<b>Logout:</b>
Top-left 🚪 button`
                        },
                        roman: {
                            title: '🔓 Login System',
                            body: `<b>Login kaise karein:</b>

1. Username likhein
2. Password likhein
3. "🔓 Login" dabayein

<b>💡 "Remember Me":</b>
Tick karein to:
✅ Auto-login next time
✅ 30 din tak save

Demo: doctor / 1234`
                        }
                    }
                },
                
                // Step 3: Language
                {
                    id: 'language',
                    target: '#langBtn',
                    position: 'bottom',
                    content: {
                        ur: {
                            title: '🌐 زبان بدلیں',
                            body: `اوپر right میں 🌐 بٹن دیکھیں

<b>3 زبانیں دستیاب:</b>

🇵🇰 اردو (نستعلیق)
       ↓ (کلک)
🇬🇧 English
       ↓ (کلک)
🔤 Roman Urdu
       ↓ (کلک)
🇵🇰 اردو (واپس)

<b>💡 اہم بات:</b>

آپ کی پسند یاد رہے گی!
اگلی بار خودکار وہی زبان ہوگی۔

<b>Direction بھی بدلتی ہے:</b>
اردو = دائیں سے بائیں (RTL)
English/Roman = بائیں سے دائیں (LTR)

<b>سب کچھ ترجمہ ہوتا ہے:</b>
✅ Menu items
✅ Buttons
✅ Labels
✅ Messages`
                        },
                        en: {
                            title: '🌐 Language Switch',
                            body: `See 🌐 button at top right

<b>3 Languages Available:</b>

🇵🇰 Urdu (Nastaliq)
       ↓ (click)
🇬🇧 English
       ↓ (click)
🔤 Roman Urdu
       ↓ (click)
🇵🇰 Urdu (back)

<b>💡 Important:</b>

Your preference is remembered!
Same language next time.

<b>Direction changes too:</b>
Urdu = Right to Left (RTL)
English/Roman = Left to Right (LTR)`
                        },
                        roman: {
                            title: '🌐 Language',
                            body: `🌐 button top right mein

<b>3 languages:</b>
🇵🇰 Urdu
🇬🇧 English
🔤 Roman Urdu

Aap ki pasand yaad rahegi!`
                        }
                    }
                },
                
                // Step 4: Dashboard
                {
                    id: 'dashboard',
                    target: '[data-page="dashboard"]',
                    position: 'bottom',
                    content: {
                        ur: {
                            title: '🏠 ڈیش بورڈ',
                            body: `یہاں آپ کو نظر آئے گا:

<b>📊 اعداد و شمار:</b>
• 📅 آج کے مریض
• 📊 کل مریض
• 📆 اس ماہ کے مریض
• 🔄 فالو اپ وزٹس

<b>📅 آج کی سرگرمی:</b>
• آج کے تمام مریض
• رجسٹریشن یا فالو اپ
• وقت اور تفصیلات
• جنس اور دیگر معلومات

<b>💡 آسان استعمال:</b>
کسی بھی مریض کے نام پر کلک کریں
       ↓
اس کی مکمل تفصیل کھل جائے گی!

<b>Badges (نشانات):</b>
🟡 نئی رجسٹریشن
🔵 فالو اپ
💗 مرد / عورت / بچہ / بچی`
                        },
                        en: {
                            title: '🏠 Dashboard',
                            body: `Here you see:

<b>📊 Statistics:</b>
• 📅 Today's patients
• 📊 Total patients
• 📆 This month
• 🔄 Follow-up visits

<b>📅 Today's Activity:</b>
• All today's patients
• Registration or Follow-up
• Time and details
• Gender info

<b>💡 Easy Use:</b>
Click any patient name
       ↓
Complete details open!`
                        },
                        roman: {
                            title: '🏠 Dashboard',
                            body: `<b>Statistics:</b>
• Today's patients
• Total patients
• This month
• Follow-ups

<b>Today's Activity:</b>
Sab aaj ke patients

Click on any patient
       ↓
Details khul jayen ge`
                        }
                    }
                },
                
                // Step 5: New Registration
                {
                    id: 'registration',
                    target: '[data-page="newPatient"]',
                    position: 'bottom',
                    content: {
                        ur: {
                            title: '➕ نئی رجسٹریشن',
                            body: `اوپر مینو میں <b>"نئی رجسٹریشن"</b> پر کلک کریں

<b>دو حصے ہیں:</b>

<b>1️⃣ مریض کی معلومات:</b>
• 📋 حوالہ نمبر (خودکار)
• 👨‍👩‍👧‍👦 فیملی نمبر (اختیاری)
• 👤 نام مریض (لازمی)
• 📱 فون نمبر (لازمی)
• 👨 ولدیت / ازواجیت
• 🎂 عمر
• ⚧ جنس
• ⚖️ وزن
• ⚠️ الرجی
• 🏠 پتہ

<b>2️⃣ پہلی ملاقات کی تفصیل:</b>
• 📅 تاریخ اور وقت
• 💗 Vitals (BP، شوگر، بخار، نبض)
• 📝 علامات
• 🔬 تشخیص
• 💊 نسخہ
• 📖 طریقہ استعمال
• 📆 دن

<b>💡 اہم:</b>
فیملی نمبر خالی چھوڑ سکتے ہیں!
اگر ایک ہی فون سے دوسرا مریض آئے
تو خودکار فیملی نمبر ملے گا۔`
                        },
                        en: {
                            title: '➕ New Registration',
                            body: `Click <b>"New Registration"</b> in menu

<b>Two sections:</b>

<b>1️⃣ Patient Info:</b>
• 📋 Reference No (auto)
• 👨‍👩‍👧‍👦 Family No (optional)
• 👤 Patient Name (required)
• 📱 Phone (required)
• Other info

<b>2️⃣ First Visit:</b>
• 📅 Date & Time
• 💗 Vitals
• 📝 Symptoms
• 🔬 Diagnosis
• 💊 Prescription
• 📖 Method
• 📆 Days

<b>💡 Important:</b>
Family No can be blank!
Auto-detects if same phone.`
                        },
                        roman: {
                            title: '➕ New Registration',
                            body: `Menu mein "New Registration"

<b>2 sections:</b>

<b>1. Patient Info:</b>
Naam, phone, ref no auto

<b>2. First Visit:</b>
Vitals, symptoms, diagnosis

<b>💡 Tip:</b>
Family No khali chhor sakte hain`
                        }
                    }
                },
                
                // Step 6: Search
                {
                    id: 'search',
                    target: '[data-page="searchPatient"]',
                    position: 'bottom',
                    content: {
                        ur: {
                            title: '🔍 مریض کی تلاش',
                            body: `مینو میں <b>"تلاش"</b> پر کلک کریں

<b>آپ تلاش کر سکتے ہیں:</b>

✅ نام سے
   مثال: "احمد"، "فاطمہ"

✅ فون نمبر سے
   مثال: "0300"، "03001234567"

✅ حوالہ نمبر سے
   مثال: "BHC-001"، "0001"

✅ فیملی نمبر سے
   مثال: "F-001"

✅ ولدیت سے
   مثال: "محمد" (والد کا نام)

<b>💡 آسان فیچرز:</b>

⚡ <b>فوری تلاش:</b>
   جیسے آپ ٹائپ کرتے ہیں، نتائج ملتے جاتے ہیں

🎯 <b>Partial matching:</b>
   کچھ حصہ لکھیں، مکمل نہیں چاہیے

🔎 <b>Multi-field search:</b>
   ایک ساتھ نام یا فون سے بھی

<b>نتائج میں:</b>
• حوالہ نمبر
• نام + ولدیت
• عمر، جنس، فون
• فالو اپ کی تعداد
• Action buttons (👁️ ✏️ 🗑️)`
                        },
                        en: {
                            title: '🔍 Search Patient',
                            body: `Click <b>"Search"</b> in menu

<b>Search by:</b>

✅ Name (e.g. "Ahmad")
✅ Phone (e.g. "0300")
✅ Reference No
✅ Family No
✅ Father's Name

<b>💡 Easy Features:</b>

⚡ <b>Instant Search:</b>
   Results as you type

🎯 <b>Partial matching</b>

<b>Results show:</b>
• Reference No
• Name + Father
• Age, Gender, Phone
• Follow-up count
• Action buttons`
                        },
                        roman: {
                            title: '🔍 Search',
                            body: `Menu mein "Talash"

<b>Search kar sakte:</b>
✅ Naam se
✅ Phone se
✅ Reference No
✅ Family No

⚡ Instant search
🎯 Partial matching`
                        }
                    }
                },
                
                // Step 7: All Patients
                {
                    id: 'all_patients',
                    target: '[data-page="allPatients"]',
                    position: 'bottom',
                    content: {
                        ur: {
                            title: '📋 تمام مریض',
                            body: `یہاں تمام مریضوں کی فہرست:

<b>Table میں شامل:</b>
• حوالہ نمبر
• فیملی نمبر
• نام
• ولدیت
• عمر
• جنس (Badge کے ساتھ)
• فون نمبر
• فالو اپ کی تعداد
• Actions

<b>ہر مریض کے ساتھ 3 بٹن:</b>

👁️ <b>دیکھیں:</b>
   مکمل تفصیل، وزٹس، فیملی

✏️ <b>ایڈٹ:</b>
   معلومات میں تبدیلی

🗑️ <b>ڈیلیٹ:</b>
   مریض اور تمام وزٹس مٹا دیں
   ⚠️ واپس نہیں آئیں گی

<b>💡 تفصیل میں جا کر:</b>

<b>ہیڈر پر بٹن:</b>
• ✏️ Edit - معلومات بدلیں
• ➕ Visit - نئی ملاقات
• 🔬 Diagnose - تشخیص
• 👨‍👩‍👧‍👦 Family - خاندان دیکھیں
• 🔙 Back - واپس
• 🗑️ Delete - مٹا دیں

<b>Consultations:</b>
تمام وزٹس ترتیب سے
Registration + Follow-ups
ہر ایک کو Edit/Delete`
                        },
                        en: {
                            title: '📋 All Patients',
                            body: `Complete patient list here:

<b>Table shows:</b>
• Reference, Family No
• Name, Father
• Age, Gender
• Phone
• Follow-up count
• Actions

<b>3 buttons per patient:</b>

👁️ <b>View</b> - complete details
✏️ <b>Edit</b> - modify info
🗑️ <b>Delete</b> - remove (careful!)

<b>💡 In Details:</b>

Header buttons:
• Edit info
• New Visit
• Diagnose
• Family view
• Back
• Delete

All consultations shown in order`
                        },
                        roman: {
                            title: '📋 All Patients',
                            body: `Complete list yahan

<b>Table:</b>
Ref, Family, Name, Age, etc

<b>3 buttons:</b>
👁️ View
✏️ Edit
🗑️ Delete`
                        }
                    }
                },
                
                // Step 8: Family System
                {
                    id: 'family',
                    target: null,
                    position: 'center',
                    content: {
                        ur: {
                            title: '👨‍👩‍👧‍👦 فیملی سسٹم',
                            body: `<b>✨ خودکار فیملی ڈٹیکشن:</b>

اگر ایک ہی فون نمبر سے دوسرا مریض آئے تو ایپ خود بتائے گی:

✅ "یہ فیملی پہلے سے موجود ہے"
✅ "5 ممبرز ہیں"

<b>فیملی نمبر کیسے دیں:</b>

نئی رجسٹریشن میں:
📝 F-001 (خود لکھیں)
یا
📝 خالی چھوڑ دیں (خودکار ملے گا)

<b>ترتیب:</b>
F-001 (پہلا خاندان)
F-002 (دوسرا)
F-003 (تیسرا)
... (خود بخود بڑھتا ہے)

<b>💡 فوائد:</b>

✅ فیملی ممبرز اکٹھے دیکھیں
✅ ایک کلک سے سب دیکھیں
✅ خاندان کی history
✅ Genetic diseases track

<b>🎯 عملی مثال:</b>

<b>F-001 خاندان:</b>
• احمد علی (والد)
• فاطمہ (والدہ)
• علی احمد (بیٹا)
• سارہ احمد (بیٹی)

<b>فیملی بیج پر کلک کریں:</b>
       ↓
سب ممبرز نظر آئیں گے!

<b>Table میں فیملی نمبر پر کلک:</b>
تمام فیملی ممبرز کی list کھلے گی`
                        },
                        en: {
                            title: '👨‍👩‍👧‍👦 Family System',
                            body: `<b>✨ Auto Family Detection:</b>

Same phone = same family
App auto-detects and shows.

<b>Family Numbering:</b>

Format: F-001, F-002, F-003...
• Enter yourself
• Or leave blank (auto)

<b>💡 Benefits:</b>

✅ View family members together
✅ One-click family view
✅ Family history tracking
✅ Genetic diseases

<b>🎯 Example:</b>

<b>F-001 Family:</b>
• Ahmad Ali (Father)
• Fatima (Mother)
• Ali Ahmad (Son)
• Sara Ahmad (Daughter)

<b>Click family badge:</b>
       ↓
All members appear!`
                        },
                        roman: {
                            title: '👨‍👩‍👧‍👦 Family System',
                            body: `<b>Auto Detection:</b>
Same phone = same family

<b>Numbering:</b>
F-001, F-002, F-003
Khud likhein ya auto

<b>Benefits:</b>
✅ Family members together
✅ One click view
✅ Family history

Click family badge!`
                        }
                    }
                },
                
                // Step 9: Diagnosis
                {
                    id: 'diagnosis',
                    target: '[data-page="diagnosis"]',
                    position: 'bottom',
                    content: {
                        ur: {
                            title: '🔬 تشخیصی معاون',
                            body: `<b>✨ AI طرز کا تشخیصی نظام:</b>

مینو میں <b>"تشخیص"</b> پر کلک کریں

<b>3 آسان مراحل:</b>

<b>1️⃣ کیٹگری منتخب کریں:</b>
🫁 سانس | 🍽️ ہاضمہ | 🧠 دماغ
💗 دل | 🦴 جوڑ | 🧴 جلد
👩 خواتین | 👶 بچے | 💧 پیشاب

<b>2️⃣ علامات چنیں:</b>
☑️ بخار
☑️ کھانسی
☑️ سر درد
☑️ گلا خراب
... (جتنی چاہیں)

<b>3️⃣ "تشخیص کریں" دبائیں</b>

<b>📊 نتائج ملیں گے:</b>

<b>ممکنہ بیماریاں (Match %)</b>
🟢 90% - نزلہ زکام
🟡 65% - فلو
🔴 30% - سائنس

<b>ہر بیماری کے ساتھ:</b>
• 🔬 تجویز کردہ ٹیسٹ
• 💊 ہومیوپیتھک ادویات
• 📖 مریض کو مشورہ
• ⚠️ خطرے کی علامات

<b>💡 اضافی فیچر:</b>

📋 <b>Copy to Visit:</b>
اگر مریض کی وزٹ میں کاپی کرنا چاہیں
       ↓
سب کچھ خودکار fill ہو جائے گا!

📄 <b>Copy Info:</b>
Clipboard میں copy کر لیں

<b>Emergency Alert:</b>
⚠️ اگر خطرناک علامات ہوں تو ایپ فوری متنبہ کرے گی!`
                        },
                        en: {
                            title: '🔬 Diagnostic Assistant',
                            body: `<b>✨ AI-Style Diagnosis:</b>

Click <b>"Diagnosis"</b> in menu

<b>3 Easy Steps:</b>

<b>1️⃣ Select Category:</b>
🫁 Respiratory | 🍽️ Digestive
🧠 Neuro | 💗 Cardiac
🦴 Joints | 🧴 Skin

<b>2️⃣ Choose Symptoms:</b>
☑️ Fever
☑️ Cough
☑️ Headache
... (as many)

<b>3️⃣ Click "Analyze"</b>

<b>📊 Results:</b>

<b>Possible Diseases (Match %)</b>
🟢 90% - Common Cold
🟡 65% - Flu
🔴 30% - Sinusitis

<b>Each disease shows:</b>
• 🔬 Recommended Tests
• 💊 Homeopathic Remedies
• 📖 Patient Advice
• ⚠️ Red Flags

<b>💡 Extra Features:</b>

📋 <b>Copy to Visit:</b>
Auto-fills patient visit!

📄 <b>Copy Info:</b>
Copy to clipboard

⚠️ Emergency alerts for severe symptoms!`
                        },
                        roman: {
                            title: '🔬 Diagnosis',
                            body: `<b>AI-style diagnosis:</b>

<b>3 steps:</b>
1️⃣ Category select
2️⃣ Symptoms choose
3️⃣ "Analyze" dabayein

<b>Results:</b>
Possible diseases with match %
Tests, remedies, advice

<b>Extra:</b>
📋 Copy to visit
📄 Copy info
⚠️ Emergency alerts`
                        }
                    }
                },
                
                // Step 10: Settings & Custom Data
                {
                    id: 'settings',
                    target: '[data-page="settings"]',
                    position: 'bottom',
                    content: {
                        ur: {
                            title: '⚙️ سیٹنگز اور کسٹم ڈیٹا',
                            body: `<b>🎯 مرکزی کنٹرول پینل:</b>

<b>🏷️ کسٹم ڈیٹا مینیجر:</b>

اپنی مرضی کی چیزیں بنائیں:
• ➕ نئی کیٹگری
• 💡 نئی علامت
• 🔬 نئی بیماری

<b>☁️ کلاؤڈ سنک:</b>
• خودکار محفوظ
• ہر ڈیوائس پر مشترک
• آفلائن بھی کام

<b>💾 بیک اپ سسٹم:</b>
• 📦 مکمل بیک اپ
• 🆕 صرف نئی بیک اپ
• 📥 امپورٹ / ریسٹور

<b>📝 گٹ ہب کے لیے:</b>
• بیماریاں permanent add
• Migration Wizard
• Duplicate prevention

<b>🧹 صفائی:</b>
• پروموٹڈ چیزیں مٹائیں
• کلاؤڈ optimize

<b>📚 ہسٹری:</b>
سب تبدیلیوں کا ریکارڈ

<b>⚙️ ترجیحات:</b>
• ٹور آن/آف
• شارٹ کٹس آن/آف
• ٹپس آن/آف

═══════════════

<b>🎉 مبارک ہو!</b>

آپ نے مکمل ٹور دیکھ لیا۔
اب آپ ایپ کا مکمل استعمال کر سکتے ہیں!

<b>💡 مدد کے لیے:</b>
❓ بٹن ہمیشہ available ہے

<b>سیکھنا جاری رکھیں:</b>
• ہر بٹن پر ⓘ icon سے
• Help Center میں تفصیل`
                        },
                        en: {
                            title: '⚙️ Settings & Custom Data',
                            body: `<b>🎯 Central Control Panel:</b>

<b>🏷️ Custom Data Manager:</b>
Add your own:
• ➕ New Categories
• 💡 New Symptoms
• 🔬 New Diseases

<b>☁️ Cloud Sync:</b>
• Auto save
• Multi-device
• Works offline

<b>💾 Backup System:</b>
• 📦 Full Backup
• 🆕 Only New Backup
• 📥 Import/Restore

<b>📝 GitHub Export:</b>
• Permanent disease add
• Migration Wizard
• No duplicates

<b>🧹 Cleanup:</b>
• Delete promoted
• Optimize cloud

<b>📚 History:</b>
Log of all changes

<b>⚙️ Preferences:</b>
• Tour on/off
• Shortcuts on/off
• Tips on/off

═══════════════

<b>🎉 Congratulations!</b>

You've completed the tour!
Now use the app fully!

<b>💡 For help:</b>
❓ button always available`
                        },
                        roman: {
                            title: '⚙️ Settings',
                            body: `<b>Central Control:</b>

🏷️ Custom Data
☁️ Cloud Sync
💾 Backup
📝 GitHub Export
🧹 Cleanup
📚 History
⚙️ Preferences

<b>🎉 Mubarak ho!</b>
Tour complete!

Help: ❓ button`
                        }
                    }
                }
            ]
        }
    };
    
    // Expose to window for Part 2
    window.HELP_CONTENT = HELP_CONTENT;
    
    console.log('✅ Help Content Part 1 loaded (Buttons + Tour)');
    
    // Part 2 will be appended below...

    // ==========================================
    // HELP CENTER TOPICS (25+)
    // ==========================================
    HELP_CONTENT.helpCenter = {
        
        // 1. Login System
        login: {
            icon: '🔓',
            ur: {
                title: 'لاگ ان اور یاد رکھنے کا نظام',
                content: `<b>لاگ ان کیسے کریں:</b>

<b>مرحلہ 1:</b> Username لکھیں
<b>مرحلہ 2:</b> Password لکھیں
<b>مرحلہ 3:</b> "🔓 لاگ ان" دبائیں

<b>Demo اکاؤنٹ:</b>
Username: doctor
Password: 1234

═══════════════

<b>💡 "مجھے یاد رکھیں" فیچر:</b>

اگر آپ ٹک لگا دیں گے تو:
✅ اگلی بار خودکار لاگ ان
✅ 30 دن تک محفوظ
✅ Username/Password یاد رہے گا

<b>یہ کیسے کام کرتا ہے:</b>
Session localStorage میں save ہوتی ہے۔
جب آپ ایپ کھولیں گے:
       ↓
Session چیک کرے گا
       ↓
اگر valid ہے تو
       ↓
✅ خودکار لاگ ان!

═══════════════

<b>🔒 سکیورٹی:</b>

• Password base64 میں encoded
• صرف آپ کے device پر
• Cloud پر share نہیں
• آپ کنٹرول کر سکتے ہیں

<b>لاگ آؤٹ کرنے پر:</b>
پوچھا جائے گا:
"کیا محفوظ شدہ لاگ ان معلومات بھی مٹا دیں؟"

Yes = مکمل صفائی
No = صرف اس session کا لاگ آؤٹ`
            },
            en: {
                title: 'Login & Remember System',
                content: `<b>How to Login:</b>

<b>Step 1:</b> Enter Username
<b>Step 2:</b> Enter Password
<b>Step 3:</b> Click "🔓 Login"

<b>Demo Account:</b>
Username: doctor
Password: 1234

═══════════════

<b>💡 "Remember Me" Feature:</b>

If checked:
✅ Auto-login next time
✅ Saved for 30 days
✅ Username/Password remembered

<b>How it works:</b>
Session saved in localStorage
       ↓
When you open app
       ↓
Session validated
       ↓
✅ Auto-login!

═══════════════

<b>🔒 Security:</b>

• Password base64 encoded
• Only on your device
• Not shared to cloud
• You control it

<b>On Logout:</b>
Will ask:
"Also delete saved login credentials?"

Yes = Complete cleanup
No = Only this session logout`
            },
            roman: {
                title: 'Login System',
                content: `<b>Login:</b>
1. Username likhein
2. Password likhein
3. "🔓 Login" dabayein

<b>Demo:</b> doctor / 1234

<b>Remember Me:</b>
✅ Auto-login next time
✅ 30 din tak save
✅ Info yaad rahegi

<b>Security:</b>
• Password encoded
• Sirf device par
• Cloud par nahi`
            }
        },
        
        // 2. Dashboard
        dashboard: {
            icon: '🏠',
            ur: {
                title: 'ڈیش بورڈ کا مکمل استعمال',
                content: `<b>📊 4 اہم Statistics:</b>

<b>1. آج کے مریض</b>
اس تاریخ کو آنے والے سب مریض
(نئی رجسٹریشن + فالو اپ)

<b>2. کل مریض</b>
تمام registered مریضوں کی گنتی

<b>3. اس ماہ کے مریض</b>
موجودہ مہینے میں آنے والے
Unique count (ایک مریض ایک بار)

<b>4. فالو اپ وزٹس</b>
تمام فالو اپ visits کی گنتی
(Registration کے علاوہ)

═══════════════

<b>📅 آج کی سرگرمی:</b>

فہرست میں نظر آئے گا:
• نام مریض
• حوالہ نمبر
• وقت
• Badge:
  🟡 نئی رجسٹریشن
  🔵 فالو اپ
• Gender Badge

<b>💡 آسان navigation:</b>
مریض کے نام پر کلک
       ↓
مکمل تفصیل کھل جائے گی!

═══════════════

<b>🔄 آفلائن Notice:</b>

اگر آفلائن ہوں تو:
⚠️ نوٹس نظر آئے گا
"[🔄 Sync Now]" بٹن دستیاب

<b>Data کی مکمل تازگی:</b>
30 seconds کے cache کے ساتھ
تیز اور fresh data`
            },
            en: {
                title: 'Complete Dashboard Usage',
                content: `<b>📊 4 Important Statistics:</b>

<b>1. Today's Patients</b>
All visitors today
(Registration + Follow-ups)

<b>2. Total Patients</b>
All registered patients

<b>3. This Month</b>
Current month visitors
Unique count

<b>4. Follow-up Visits</b>
All follow-up visits
(Excluding registration)

═══════════════

<b>📅 Today's Activity:</b>

List shows:
• Patient name
• Reference No
• Time
• Badge:
  🟡 New Registration
  🔵 Follow-up
• Gender Badge

<b>💡 Easy Navigation:</b>
Click patient name
       ↓
Complete details open!

═══════════════

<b>🔄 Offline Notice:</b>

If offline:
⚠️ Notice appears
"[🔄 Sync Now]" available`
            },
            roman: {
                title: 'Dashboard Usage',
                content: `<b>4 Statistics:</b>
1. Today's patients
2. Total patients
3. This month
4. Follow-ups

<b>Today's Activity:</b>
Click naam se details

<b>Offline:</b>
Notice + Sync button`
            }
        },
        
        // 3. New Registration
        registration: {
            icon: '➕',
            ur: {
                title: 'نئی رجسٹریشن مکمل گائیڈ',
                content: `<b>مرحلہ وار طریقہ:</b>

<b>1️⃣ مینو میں "نئی رجسٹریشن"</b>

<b>2️⃣ مریض کی معلومات:</b>

<b>📋 حوالہ نمبر:</b>
خودکار بنتا ہے
Format: BHC-0001/01
(ماہ کے حساب سے)

<b>👨‍👩‍👧‍👦 فیملی نمبر:</b>
اختیاری - خالی چھوڑ سکتے ہیں
اگر لکھیں: F-001, F-002...
اگر خالی: خودکار پہچان (فون سے)

<b>👤 نام مریض (لازمی):</b>
مکمل نام لکھیں
مثال: "احمد علی خان"

<b>📱 فون نمبر (لازمی):</b>
Direction LTR
مثال: 03001234567

<b>👨 ولدیت / ازواجیت:</b>
باپ کا نام یا شوہر کا نام

<b>🎂 عمر:</b>
سال یا مہینے
مثال: "35 سال"، "6 مہینے"

<b>⚧ جنس:</b>
Dropdown سے:
• مرد / Male
• عورت / Female
• بچہ / Boy
• بچی / Girl

<b>⚖️ وزن:</b>
کلوگرام میں
مثال: "70 کلو"

<b>⚠️ الرجی:</b>
اگر کوئی ہو
مثال: "پینسلن سے الرجی"

<b>🏠 پتہ:</b>
مکمل پتہ

═══════════════

<b>3️⃣ پہلی ملاقات کی تفصیل:</b>

<b>📅 تاریخ:</b>
خودکار آج کی تاریخ

<b>🕐 وقت:</b>
خودکار موجودہ وقت

<b>💗 Vitals:</b>
• 🩸 بلڈ پریشر: 120/80
• 🍬 شوگر: mg/dL
• 🌡️ درجہ حرارت: 98.6°F
• 💓 نبض: 72/min

<b>📝 علامات:</b>
مریض کی شکایات

<b>🔬 تشخیص:</b>
آپ کی تشخیص

<b>💊 نسخہ:</b>
دوائیں + خوراک

<b>📖 طریقہ استعمال:</b>
کیسے لینی ہے

<b>📆 دن:</b>
کتنے دن کے لیے

<b>📝 اضافی نوٹس:</b>
کوئی خاص بات

═══════════════

<b>💾 محفوظ کریں:</b>

<b>"💾 محفوظ کریں"</b> دبائیں

آن لائن ہو تو:
✅ Supabase پر
✅ خودکار sync

آفلائن ہو تو:
💾 Local محفوظ
⏱️ بعد میں خودکار sync

═══════════════

<b>💡 خودکار Features:</b>

<b>Duplicate Detection:</b>
اگر وہی نام + فون ملے تو
⚠️ "مریض پہلے سے موجود"

<b>Auto Family:</b>
اگر وہی فون ملے تو
✅ "فیملی پہلے سے موجود (5 members)"
Family No خود بھر جائے گا

<b>Format کر لیتا ہے:</b>
"1" → "F-0001"
"F-1" → "F-0001"`
            },
            en: {
                title: 'New Registration Complete Guide',
                content: `<b>Step-by-step:</b>

<b>1️⃣ Menu → "New Registration"</b>

<b>2️⃣ Patient Information:</b>

<b>📋 Reference No:</b>
Auto-generated
Format: BHC-0001/01

<b>👨‍👩‍👧‍👦 Family No:</b>
Optional
If entered: F-001, F-002...
If blank: Auto-detect from phone

<b>👤 Patient Name (required):</b>
Full name

<b>📱 Phone (required):</b>
LTR direction

<b>Other fields:</b>
• Father/Spouse
• Age
• Gender dropdown
• Weight
• Allergy
• Address

═══════════════

<b>3️⃣ First Visit Details:</b>

<b>Auto-filled:</b>
📅 Today's date
🕐 Current time

<b>💗 Vitals:</b>
• BP, Sugar, Temp, Pulse

<b>Clinical:</b>
• Symptoms
• Diagnosis
• Prescription
• Method
• Days
• Notes

═══════════════

<b>💾 Save:</b>

Online → Supabase + auto sync
Offline → Local + later sync

═══════════════

<b>💡 Auto Features:</b>

<b>Duplicate Detection:</b>
Same name + phone
⚠️ "Patient already exists"

<b>Auto Family:</b>
Same phone
✅ "Family exists (5 members)"

<b>Auto Format:</b>
"1" → "F-0001"`
            },
            roman: {
                title: 'New Registration Guide',
                content: `<b>Steps:</b>

<b>1. Menu → "Nayi Registration"</b>

<b>2. Patient Info:</b>
Naam, phone required
Baaki optional

<b>3. First Visit:</b>
Vitals, symptoms, diagnosis

<b>Save:</b>
Online → Supabase
Offline → Local

<b>Auto Features:</b>
• Duplicate detection
• Auto family (from phone)
• Auto format`
            }
        },
        
        // 4. Search
        search: {
            icon: '🔍',
            ur: {
                title: 'مریض کی تلاش',
                content: `<b>مینو میں "تلاش" کلک کریں</b>

<b>تلاش کر سکتے ہیں:</b>

<b>✅ نام سے:</b>
"احمد" لکھیں
       ↓
سب "احمد" نام والے مریض

<b>✅ فون سے:</b>
"0300" لکھیں
       ↓
اس نمبر شروع والے سب

<b>✅ حوالہ نمبر سے:</b>
"BHC-001" یا "0001"
       ↓
مخصوص مریض

<b>✅ فیملی نمبر سے:</b>
"F-001"
       ↓
اس فیملی کے سب ممبرز

<b>✅ ولدیت سے:</b>
والد کا نام
       ↓
سب بچے/بہن بھائی

═══════════════

<b>💡 Features:</b>

<b>⚡ فوری Results:</b>
جیسے ٹائپ کرتے جائیں
نتائج ملتے جائیں

<b>🎯 Partial Match:</b>
مکمل نام نہیں چاہیے
"احم" بھی چلے گا

<b>🔎 Case Insensitive:</b>
"AHMAD" اور "ahmad" ایک

<b>📊 نتائج:</b>
مکمل table format میں
تمام معلومات کے ساتھ`
            },
            en: {
                title: 'Patient Search',
                content: `<b>Menu → "Search"</b>

<b>Search by:</b>

<b>✅ Name:</b>
Type "Ahmad"
       ↓
All patients named Ahmad

<b>✅ Phone:</b>
Type "0300"
       ↓
All starting with

<b>✅ Reference:</b>
"BHC-001" or "0001"

<b>✅ Family No:</b>
"F-001"
       ↓
All family members

<b>✅ Father's Name:</b>
All children/siblings

═══════════════

<b>💡 Features:</b>

<b>⚡ Instant Results</b>
<b>🎯 Partial Match</b>
<b>🔎 Case Insensitive</b>
<b>📊 Full Table Format</b>`
            },
            roman: {
                title: 'Patient Search',
                content: `<b>Menu → "Talash"</b>

<b>Search by:</b>
✅ Naam
✅ Phone
✅ Reference
✅ Family No
✅ Waldiyat

<b>Features:</b>
⚡ Instant
🎯 Partial match
🔎 Case insensitive`
            }
        },
        
        // 5. All Patients
        all_patients: {
            icon: '📋',
            ur: {
                title: 'تمام مریض کا صفحہ',
                content: `<b>مکمل فہرست یہاں ملے گی۔</b>

<b>📊 Table Columns:</b>

1. <b>حوالہ نمبر</b> - BHC-001/01
2. <b>فیملی</b> - F-001 badge
3. <b>نام</b> - مریض کا نام
4. <b>ولدیت</b> - والد/شوہر
5. <b>عمر</b> - سال یا مہینے
6. <b>جنس</b> - Colored badge
7. <b>فون</b> - LTR format
8. <b>فالو اپ</b> - گنتی
9. <b>ایکشن</b> - 3 buttons

═══════════════

<b>Badges (نشانات):</b>

<b>🟡 Pending Sync Badge:</b>
اگر ابھی کلاؤڈ پر نہیں گیا

<b>👨 Blue = Male</b>
<b>👩 Red = Female</b>
<b>👶 Green = Boy/Girl</b>

<b>Family Badge:</b>
🟨 Yellow با border
کلک کرنے پر فیملی ممبرز

═══════════════

<b>3 Action Buttons:</b>

<b>👁️ دیکھیں (Blue):</b>
مکمل patient detail
تمام visits/consultations
Family view
Diagnosis link

<b>✏️ ایڈٹ (Purple):</b>
Modal کھلے گا
سب معلومات edit کریں

<b>🗑️ ڈیلیٹ (Red):</b>
⚠️ Confirmation آئے گی
"X نام اور Y consultations delete؟"
مریض اور سب visits مٹا دے گا

═══════════════

<b>👥 مریض تفصیل صفحہ:</b>

<b>Header:</b>
• نام + Reference
• Follow-up count
• Family badge

<b>Header Actions:</b>
• ✏️ Edit Patient
• ➕ New Visit
• 🔬 Diagnose
• 👨‍👩‍👧‍👦 Family
• 🔙 Back
• 🗑️ Delete

<b>Patient Info Grid:</b>
سب معلومات cards میں

<b>Consultations:</b>
تمام visits ترتیب سے
• 🌟 Registration (پہلی)
• Follow-up #1, #2, ... (بعد میں)

<b>ہر Visit میں:</b>
• Date + Time
• Vitals (BP, Sugar, etc.)
• Symptoms
• Diagnosis
• Prescription
• Method
• Days
• Notes
• Edit/Delete buttons`
            },
            en: {
                title: 'All Patients Page',
                content: `<b>Complete list here.</b>

<b>📊 Table Columns:</b>

1. Reference
2. Family
3. Name
4. Father
5. Age
6. Gender (badge)
7. Phone
8. Follow-ups
9. Actions

═══════════════

<b>Badges:</b>

<b>🟡 Pending Sync</b>
<b>👨 Blue = Male</b>
<b>👩 Red = Female</b>
<b>👶 Green = Child</b>

<b>Family Badge (yellow):</b>
Click for family members

═══════════════

<b>3 Action Buttons:</b>

<b>👁️ View (Blue):</b>
Complete details
All visits
Family view

<b>✏️ Edit (Purple):</b>
Modal for editing

<b>🗑️ Delete (Red):</b>
⚠️ Confirmation
Removes patient + all visits

═══════════════

<b>👥 Patient Detail Page:</b>

<b>Header Actions:</b>
Edit, Visit, Diagnose,
Family, Back, Delete

<b>Consultations:</b>
🌟 Registration (first)
Follow-up #1, #2, ... (later)

<b>Each visit has:</b>
Date, Vitals, Symptoms,
Diagnosis, Prescription`
            },
            roman: {
                title: 'All Patients',
                content: `<b>Complete list</b>

<b>Table:</b>
Ref, Family, Naam, etc

<b>Badges:</b>
Blue = Male
Red = Female
Green = Child

<b>3 buttons:</b>
👁️ View
✏️ Edit
🗑️ Delete

<b>Detail Page:</b>
Header actions
Consultations list
Each visit full info`
            }
        },
        
        // 6. Family System
        family_system: {
            icon: '👨‍👩‍👧‍👦',
            ur: {
                title: 'فیملی سسٹم کا مکمل استعمال',
                content: `<b>✨ خودکار فیملی سسٹم!</b>

<b>کیسے کام کرتا ہے:</b>

<b>Scenario 1: نئی فیملی</b>

پہلا مریض (احمد علی):
Phone: 03001234567
Family No: خالی چھوڑا
       ↓
سسٹم دیکھے گا کوئی موجودہ فیملی نہیں
       ↓
Family No: NULL (خالی)

═══════════════

<b>Scenario 2: خودکار فیملی پہچان</b>

دوسرا مریض (فاطمہ):
Phone: 03001234567 (وہی)
       ↓
سسٹم فوراً پہچانے گا:
✅ "فیملی پہلے سے موجود (1 members)"
       ↓
Family No خود بھر جائے گا
Font: Green
       ↓
اب دونوں ایک فیملی میں!

═══════════════

<b>Scenario 3: خود Family No دیں</b>

نئی رجسٹریشن میں:
Family No: "F-001" لکھیں
       ↓
سسٹم accept کرے گا

Format Options:
✅ "F-001"
✅ "1" (خودکار "F-0001" بن جائے گا)
✅ "F-1" (خودکار "F-0001")

═══════════════

<b>💡 Family View:</b>

<b>Table میں Family Badge:</b>
🟨 F-001 badge کلک کریں
       ↓
اس فیملی کے سب ممبرز

<b>Patient Detail میں:</b>
"👨‍👩‍👧‍👦 (5)" button دبائیں
       ↓
سب family members کی list

═══════════════

<b>💼 عملی مثال:</b>

<b>F-005 خاندان:</b>
• محمد اسلم (والد)
• رابعہ (والدہ)
• علی محمد (بیٹا)
• سارہ محمد (بیٹی)

<b>فوائد:</b>

✅ فیملی genetic diseases track
✅ Insurance/billing آسان
✅ Communication آسان
✅ ایک ساتھ appointment
✅ Family medical history

═══════════════

<b>⚠️ اہم بات:</b>

اگر آپ مریض کا Family No تبدیل کریں
       ↓
باقی فیملی ممبرز پر اثر نہیں پڑے گا

<b>پوری فیملی تبدیل کرنے کے لیے:</b>
ہر ممبر کو الگ الگ edit کریں`
            },
            en: {
                title: 'Complete Family System',
                content: `<b>✨ Auto Family System!</b>

<b>How it works:</b>

<b>Scenario 1: New Family</b>

Patient 1 (Ahmad):
Phone: 03001234567
Family No: blank
       ↓
System checks - no existing family
       ↓
Family No: NULL

═══════════════

<b>Scenario 2: Auto Detection</b>

Patient 2 (Fatima):
Phone: 03001234567 (same)
       ↓
System recognizes:
✅ "Family exists (1 members)"
       ↓
Family No auto-fills
Font: Green
       ↓
Both in same family!

═══════════════

<b>Scenario 3: Manual Family No</b>

Enter: "F-001"
Format options:
✅ "F-001"
✅ "1" (becomes "F-0001")
✅ "F-1" (becomes "F-0001")

═══════════════

<b>💡 Family View:</b>

<b>Family Badge in table:</b>
Click 🟨 F-001
       ↓
All family members

<b>In Patient Detail:</b>
Click "👨‍👩‍👧‍👦 (5)"

═══════════════

<b>💼 Example:</b>

<b>F-005 Family:</b>
• Muhammad Aslam (Father)
• Rabia (Mother)
• Ali (Son)
• Sara (Daughter)

<b>Benefits:</b>
✅ Genetic diseases tracking
✅ Easy billing
✅ Communication
✅ Family appointments
✅ Medical history`
            },
            roman: {
                title: 'Family System',
                content: `<b>Auto Family!</b>

<b>Kaise kaam karta:</b>

Same phone = Same family
System khud batata:
"Family exists (5 members)"

<b>Format:</b>
F-001, F-002...
Ya "1" likhein
Auto ban jaye ga

<b>View:</b>
Family badge click
Ya patient detail mein

<b>Benefits:</b>
✅ Genetic tracking
✅ Easy billing
✅ Family history`
            }
        },
        
        // 7. Diagnosis
        diagnosis_help: {
            icon: '🔬',
            ur: {
                title: 'تشخیصی معاون کا مکمل استعمال',
                content: `<b>✨ AI طرز کی تشخیص!</b>

<b>150+ بیماریاں</b>
<b>220+ علامات</b>
<b>14 کیٹگریز</b>

═══════════════

<b>مکمل طریقہ:</b>

<b>مرحلہ 1: کیٹگری منتخب کریں</b>

اوپر tabs میں سے چنیں:
🏥 تمام | 🤒 عمومی
🫁 سانس | 🍽️ ہاضمہ
🧠 دماغ | 🦴 جوڑ
🧴 جلد | 💧 پیشاب
🧘 دماغی | 💉 دائمی
👩 خواتین | 👶 بچے
👁️ آنکھ/کان

<b>مرحلہ 2: علامات چنیں</b>

نیچے علامات کی fہرست
جتنی علامات مریض میں ہیں
سب پر کلک کریں (☑️)

<b>Selected Symptoms Box:</b>
اوپر منتخب علامات نظر آئیں گی

<b>مرحلہ 3: "تشخیص کریں"</b>

Purple button دبائیں
       ↓
Analysis شروع
       ↓
Results!

═══════════════

<b>📊 نتائج کیسے پڑھیں:</b>

<b>Match Percentage:</b>
🟢 70%+ = زیادہ امکان
🟡 45-70% = درمیانی
🔴 25-45% = کم امکان

<b>ہر بیماری کے لیے:</b>

<b>🔬 Tests:</b>
تجویز کردہ ٹیسٹس
مثال: CBC, X-Ray, ECG

<b>💊 Remedies:</b>
ہومیوپیتھک ادویات
• نام (potency کے ساتھ)
• استعمال
• خوراک (dose)

<b>⚠️ Red Flags:</b>
خطرے کی علامات
اگر یہ ہوں تو ایمرجنسی!

<b>📖 Advice:</b>
مریض کو مشورہ
• کیا کریں
• کیا نہ کریں
• پرہیز

═══════════════

<b>🚨 Emergency Alert:</b>

اگر خطرناک علامات ہوں:
Red pulsing box آئے گا:
"⚠️ خطرناک علامات! فوری میڈیکل امداد ضروری ہو سکتی ہے۔"

═══════════════

<b>💡 خصوصی Features:</b>

<b>📋 Copy to Visit:</b>
مریض کی وزٹ میں کاپی کرنا چاہیں:

1. پہلے patient detail سے
   "🔬 Diagnose" دبائیں
2. علامات چنیں
3. تشخیص کریں
4. کوئی بیماری منتخب کریں
5. "📋 Copy to Visit" دبائیں
       ↓
✅ Visit modal کھل جائے گا
✅ سب کچھ خودکار fill
✅ آپ save کر دیں

<b>📄 Copy Info:</b>
Clipboard میں copy
پھر کہیں بھی paste کریں
(WhatsApp, Notes, etc.)

<b>🎯 Search:</b>
اوپر search box میں لکھیں
مخصوص علامت ڈھونڈیں

═══════════════

<b>⚠️ اہم Disclaimer:</b>

یہ صرف رہنمائی کے لیے ہے۔
حتمی تشخیص ڈاکٹر ہی کریں۔`
            },
            en: {
                title: 'Complete Diagnosis Guide',
                content: `<b>✨ AI-Style Diagnosis!</b>

<b>150+ Diseases</b>
<b>220+ Symptoms</b>
<b>14 Categories</b>

═══════════════

<b>Complete Process:</b>

<b>Step 1: Select Category</b>

Tabs at top:
🏥 All | 🤒 General
🫁 Respiratory | 🍽️ Digestive
🧠 Neuro | 🦴 Joints
🧴 Skin | 💧 Urinary
🧘 Mental | 💉 Chronic
👩 Women | 👶 Pediatric
👁️ Eyes/ENT

<b>Step 2: Choose Symptoms</b>

List of symptoms below
Click on all matching ones (☑️)

<b>Selected Symptoms Box:</b>
Shows chosen symptoms

<b>Step 3: "Analyze"</b>

Click purple button
       ↓
Analysis starts
       ↓
Results!

═══════════════

<b>📊 Reading Results:</b>

<b>Match Percentage:</b>
🟢 70%+ = High probability
🟡 45-70% = Medium
🔴 25-45% = Low

<b>For each disease:</b>

<b>🔬 Tests</b>
<b>💊 Remedies</b>
<b>⚠️ Red Flags</b>
<b>📖 Advice</b>

═══════════════

<b>🚨 Emergency Alert:</b>

For dangerous symptoms:
"⚠️ Severe symptoms detected!"

═══════════════

<b>💡 Special Features:</b>

<b>📋 Copy to Visit:</b>
Auto-fill visit modal!

<b>📄 Copy Info:</b>
Clipboard copy

═══════════════

<b>⚠️ Disclaimer:</b>

For guidance only.
Final diagnosis by doctor.`
            },
            roman: {
                title: 'Diagnosis Guide',
                content: `<b>AI-style diagnosis!</b>
150+ diseases
220+ symptoms

<b>3 Steps:</b>
1. Category select
2. Symptoms choose
3. "Analyze" dabayein

<b>Results:</b>
Match %
Tests, Remedies
Red flags, Advice

<b>Features:</b>
📋 Copy to Visit
📄 Copy Info
⚠️ Emergency alerts`
            }
        },
        
        // 8. Cloud Sync
        cloud_sync: {
            icon: '☁️',
            ur: {
                title: 'کلاؤڈ سنک - مکمل رہنمائی',
                content: `<b>☁️ Supabase Cloud Sync!</b>

<b>یہ کیا ہے:</b>

آپ کا سب ڈیٹا:
✅ Cloud پر خودکار محفوظ
✅ Real-time sync
✅ Multi-device
✅ Automatic backup

═══════════════

<b>کیسے کام کرتا ہے:</b>

<b>Scenario 1: Add کریں</b>

📱 موبائل پر: نیا مریض add
       ↓ (2 seconds)
☁️ Cloud پر خودکار save
       ↓ (2 seconds)
💻 Desktop پر بھی نظر آ گیا!

<b>Scenario 2: Edit کریں</b>

💻 Desktop پر: patient edit
       ↓
☁️ Cloud پر update
       ↓
📱 Mobile پر بھی updated

<b>Scenario 3: Delete کریں</b>

Same automatic sync!

═══════════════

<b>🔄 خودکار Sync Timings:</b>

<b>ہر 30 seconds:</b>
Background میں check
Pending operations retry

<b>Internet آنے پر:</b>
فوری sync
سب pending items save

<b>App کھلنے پر:</b>
Fresh data fetch
Cache update

<b>ہر operation کے بعد:</b>
Cache refresh
Fresh render

═══════════════

<b>📱 آفلائن Support:</b>

آفلائن ہو تو کیا ہوتا؟

<b>1. Add/Edit/Delete کر سکتے:</b>
✅ Local storage میں save
✅ Cache update
⏱️ Pending queue میں

<b>2. Pending Badge نظر آئے گا:</b>
Header میں: 🟡 3
(3 items pending)

<b>3. آفلائن نوٹس:</b>
"⚠️ آپ آفلائن ہیں"

<b>4. Internet آنے پر:</b>
🔄 خودکار sync!
Pending badge disappear

═══════════════

<b>☁️ Sync Status:</b>

<b>Header میں 🟢/🔴:</b>
🟢 Online = Connected
🔴 Offline = Disconnected

<b>Custom Data Cloud Sync bar:</b>
Ready = Connected
Syncing = In progress

═══════════════

<b>💡 اہم فوائد:</b>

<b>1. کبھی ڈیٹا نہیں کھوئے گا</b>
Device خراب ہو، ڈیٹا محفوظ

<b>2. ہر device پر</b>
Mobile + Desktop + Tablet

<b>3. Team work</b>
اگر staff بھی ہو
سب ایک ہی ڈیٹا دیکھیں

<b>4. Automatic Backup</b>
Manual کی ضرورت نہیں

═══════════════

<b>🔒 Security:</b>

✅ Row Level Security enabled
✅ Encrypted connection (HTTPS)
✅ Only authenticated users
✅ Supabase professional platform`
            },
            en: {
                title: 'Cloud Sync - Complete Guide',
                content: `<b>☁️ Supabase Cloud Sync!</b>

<b>What is this:</b>

All your data:
✅ Auto-saved to cloud
✅ Real-time sync
✅ Multi-device
✅ Automatic backup

═══════════════

<b>How it works:</b>

<b>Add:</b>
📱 Mobile: add patient
       ↓
☁️ Cloud auto-save
       ↓
💻 Desktop also shows!

<b>Edit/Delete:</b>
Same automatic sync!

═══════════════

<b>🔄 Auto Sync Times:</b>

<b>Every 30 seconds</b>
<b>When online</b>
<b>App opens</b>
<b>After each operation</b>

═══════════════

<b>📱 Offline Support:</b>

If offline:
✅ Save locally
✅ Update cache
⏱️ Queue for later
🟡 Pending badge shows

When online:
🔄 Auto-sync!

═══════════════

<b>☁️ Sync Status:</b>

🟢 Online = Connected
🔴 Offline = Disconnected

═══════════════

<b>💡 Benefits:</b>

<b>1. Never lose data</b>
<b>2. Multi-device</b>
<b>3. Team work</b>
<b>4. Auto backup</b>

═══════════════

<b>🔒 Security:</b>

✅ Row Level Security
✅ HTTPS encrypted
✅ Professional platform`
            },
            roman: {
                title: 'Cloud Sync',
                content: `<b>Automatic cloud save!</b>

Kaam kaise karta:
📱 Add karein
       ↓
☁️ Auto save
       ↓
💻 Sab devices par

<b>Auto sync:</b>
Har 30 seconds
Online aane par
App khulne par

<b>Offline:</b>
Local save
Pending queue
Online par sync

<b>Benefits:</b>
✅ Data safe
✅ Multi-device
✅ Auto backup`
            }
        },
        
        // 9. Backup System
        backup_system: {
            icon: '💾',
            ur: {
                title: 'بیک اپ سسٹم',
                content: `<b>3 Layers کا Backup!</b>

<b>Layer 1: ☁️ Cloud (خودکار)</b>
سب کچھ real-time
Supabase پر محفوظ

<b>Layer 2: 💾 JSON Backup</b>
Manual download
آپ کے device پر

<b>Layer 3: 📁 GitHub</b>
Permanent (diagnosis-data.js)
سب users کے لیے

═══════════════

<b>📦 مکمل بیک اپ:</b>

<b>کیا save ہوگا:</b>
✅ سب کیٹگریز (نئی + پرانی)
✅ سب علامات
✅ سب بیماریاں
✅ Promoted + New

<b>کب لیں:</b>
📅 مہینے میں کم از کم ایک بار
🎁 دوسرے ڈاکٹر کو دینا ہو
📱 نئے device پر جانا ہو
💾 Safety کے لیے

<b>فائل کا نام:</b>
<code>bhc-full-backup-2025-01-28.json</code>

<b>کہاں save کریں:</b>
📁 گوگل ڈرائیو
📧 اپنی email پر
💽 External drive
🌐 OneDrive/Dropbox

═══════════════

<b>🆕 صرف نئی بیک اپ:</b>

<b>کیا save ہوگا:</b>
✅ صرف unpromoted items
❌ Promoted نہیں

<b>کیوں مفید:</b>
🎯 GitHub پر بھیجنے سے پہلے
🚫 Duplicates سے بچاؤ
📉 Small file size

<b>کب لیں:</b>
📅 ہر ہفتے
🔄 Regular workflow کے لیے

<b>فائل کا نام:</b>
<code>bhc-new-only-2025-01-28.json</code>

═══════════════

<b>📥 Import (Restore):</b>

<b>JSON فائل import:</b>
1. "📥 Import" دبائیں
2. .json فائل select
3. سب کچھ restore!

<b>CSV فائل import:</b>
1. Excel میں data بنائیں
2. CSV format میں save
3. Import کریں
4. Bulk data آ گیا!

<b>خودکار پہچان:</b>
System خود detect کرے گا:
• JSON extension = JSON handler
• CSV extension = CSV handler
• Content check بھی

═══════════════

<b>💡 بہترین Practice:</b>

<b>ہفتہ وار Schedule:</b>

<b>ہر اتوار:</b>
1. "🆕 صرف نئی بیک اپ"
2. گوگل ڈرائیو پر save

<b>مہینے کے آخر:</b>
1. "📦 مکمل بیک اپ"
2. Safety backup
3. Best items چنیں
4. GitHub پر بھیجیں

═══════════════

<b>⚠️ اہم Notes:</b>

<b>Import کرتے وقت:</b>
✅ موجودہ data overwrite ہوگا
   (اگر same ID ہو)
✅ نئی items add ہوں گی
✅ Automatic cloud sync

<b>Backup منظم رکھیں:</b>
📁 Folder structure:
   /backups
     /2025-01
       - bhc-new-only-week1.json
       - bhc-new-only-week2.json
       - bhc-full-backup-monthly.json
     /2025-02
       ...`
            },
            en: {
                title: 'Backup System',
                content: `<b>3-Layer Backup!</b>

<b>Layer 1: ☁️ Cloud (auto)</b>
<b>Layer 2: 💾 JSON Backup</b>
<b>Layer 3: 📁 GitHub</b>

═══════════════

<b>📦 Full Backup:</b>

<b>Contains:</b>
✅ All Categories
✅ All Symptoms
✅ All Diseases
✅ Promoted + New

<b>When:</b>
📅 Monthly (minimum)
🎁 To share
📱 New device
💾 Safety

═══════════════

<b>🆕 Only New Backup:</b>

<b>Contains:</b>
✅ Only unpromoted

<b>Why useful:</b>
🎯 Before GitHub
🚫 No duplicates
📉 Smaller file

<b>When:</b>
📅 Weekly

═══════════════

<b>📥 Import (Restore):</b>

<b>JSON:</b>
Complete restore

<b>CSV:</b>
Bulk data from Excel

<b>Auto-detection:</b>
System detects file type

═══════════════

<b>💡 Best Practice:</b>

<b>Weekly (Sunday):</b>
"🆕 Only New Backup"

<b>Monthly End:</b>
"📦 Full Backup"
Choose best items
Send to GitHub

═══════════════

<b>⚠️ Notes:</b>

Import overwrites same IDs
New items added
Auto cloud sync`
            },
            roman: {
                title: 'Backup System',
                content: `<b>3 Layer Backup:</b>
1. ☁️ Cloud (auto)
2. 💾 JSON download
3. 📁 GitHub

<b>Full Backup:</b>
Sab kuch
Maheenay mein 1 baar

<b>Only New:</b>
Sirf unpromoted
Har hafte

<b>Import:</b>
JSON ya CSV
Auto detection`
            }
        },
        
        // 10. GitHub Export
        github_export: {
            icon: '📝',
            ur: {
                title: 'گٹ ہب کے لیے ایکسپورٹ',
                content: `<b>📝 Permanent Diseases add کرنا</b>

<b>یہ کیوں ضروری:</b>

Cloud data آپ کے account میں
GitHub data سب کے لیے default!

═══════════════

<b>📊 Data Flow:</b>

<b>Level 1: Cloud</b>
آپ کی personal categories/diseases
Supabase پر

<b>Level 2: GitHub (Permanent)</b>
سب users کے لیے default
diagnosis-data.js میں

<b>مکمل Journey:</b>

<b>مرحلہ 1: Add کریں</b>
Cloud پر save

<b>مرحلہ 2: Test کریں</b>
Diagnosis میں استعمال کر کے دیکھیں

<b>مرحلہ 3: Best چنیں</b>
جو مفید ہو

<b>مرحلہ 4: GitHub پر بھیجیں</b>
"📝 Export for GitHub"

<b>مرحلہ 5: diagnosis-data.js update</b>
Paste correctly

<b>مرحلہ 6: Push کریں</b>
Commit + Push

<b>مرحلہ 7: Promote مارک کریں</b>
App میں "✅" دبائیں

<b>مرحلہ 8: Cleanup</b>
Cloud سے صفائی

═══════════════

<b>🚀 آسان طریقہ: Migration Wizard</b>

بجائے 8 مراحل خود کرنے کے:
"🚀 Migration Wizard" دبائیں
       ↓
Wizard سب کچھ handle کرے گا!

═══════════════

<b>📝 Export فائل کا Format:</b>

Downloaded .txt فائل میں:

<code>// GitHub Export - 2025-01-28
// 15 new items ready to paste

// ===== NEW CATEGORIES =====
    cancer_care: { ur: "کینسر", en: "Cancer Care", ... },

// ===== NEW SYMPTOMS =====
    new_pain: { ur: "نیا درد", en: "New Pain", ... },

// ===== NEW DISEASES =====
    {
        id: "kidney_cancer",
        name: { ... },
        ...
    },
</code>

═══════════════

<b>📁 diagnosis-data.js Structure:</b>

<b>3 مرکزی sections:</b>

<code>const CATEGORIES_DB = {
    // Categories yahan
};

const SYMPTOMS_DB = {
    // Symptoms yahan
};

const DISEASES_DB = [
    // Diseases yahan (array)
];</code>

<b>Paste کرنے کی جگہ:</b>
• Categories → CATEGORIES_DB میں
• Symptoms → SYMPTOMS_DB میں
• Diseases → DISEASES_DB array میں

═══════════════

<b>💡 اہم Tips:</b>

<b>1. Test بغیر add نہ کریں</b>
پہلے diagnosis میں test کریں

<b>2. Best چنیں</b>
سب کچھ add نہ کریں
صرف مفید

<b>3. Backup لیں</b>
GitHub push سے پہلے full backup

<b>4. Migration Wizard use کریں</b>
Error سے بچنے کا آسان طریقہ

═══════════════

<b>⚠️ Common Mistakes:</b>

❌ Same ID دو بار add کرنا
✅ Wizard خودکار detect کرتا ہے

❌ Wrong section میں paste
✅ Comments follow کریں

❌ Promoted کرنا بھول جانا
✅ App میں "✅" دبائیں

❌ Cleanup نہ کرنا
✅ آخری step لازمی`
            },
            en: {
                title: 'Export for GitHub',
                content: `<b>📝 Adding Permanent Diseases</b>

<b>Why important:</b>

Cloud data = Your account only
GitHub data = Default for everyone!

═══════════════

<b>📊 Data Flow:</b>

<b>Level 1: Cloud</b>
Personal (Supabase)

<b>Level 2: GitHub</b>
Default for all users

<b>Complete Journey:</b>

1. Add to cloud
2. Test in diagnosis
3. Choose best
4. Send to GitHub
5. Update diagnosis-data.js
6. Commit + Push
7. Mark as Promoted
8. Cleanup

═══════════════

<b>🚀 Easy Way: Migration Wizard</b>

Instead of 8 steps:
Click "🚀 Migration Wizard"
       ↓
Handles everything!

═══════════════

<b>📁 diagnosis-data.js:</b>

3 main sections:

<code>const CATEGORIES_DB = { ... };
const SYMPTOMS_DB = { ... };
const DISEASES_DB = [ ... ];</code>

<b>Paste locations:</b>
Categories → CATEGORIES_DB
Symptoms → SYMPTOMS_DB
Diseases → DISEASES_DB array

═══════════════

<b>💡 Important Tips:</b>

1. Test before adding
2. Choose best only
3. Backup before push
4. Use Migration Wizard

═══════════════

<b>⚠️ Common Mistakes:</b>

❌ Duplicate IDs
✅ Wizard auto-detects

❌ Wrong section
✅ Follow comments

❌ Forget to promote
✅ Click "✅" in app

❌ No cleanup
✅ Final step mandatory`
            },
            roman: {
                title: 'GitHub Export',
                content: `<b>Permanent add karna</b>

<b>Data Flow:</b>
Cloud = personal
GitHub = default for all

<b>Steps:</b>
1. Add karein
2. Test
3. Best chunain
4. GitHub bhejein
5. Push
6. Promote mark
7. Cleanup

<b>Easy way:</b>
Migration Wizard!

<b>diagnosis-data.js:</b>
CATEGORIES_DB
SYMPTOMS_DB
DISEASES_DB`
            }
        },
        
        // 11. Offline Mode
        offline_mode: {
            icon: '📱',
            ur: {
                title: 'آفلائن موڈ',
                content: `<b>📱 Internet نہ ہو تو بھی کام!</b>

<b>PWA Technology:</b>
یہ ایپ Progressive Web App ہے
مطلب: Native app کی طرح کام کرتی ہے

═══════════════

<b>💡 آفلائن Capabilities:</b>

<b>✅ کر سکتے ہیں:</b>

📝 نئی رجسٹریشن
✏️ Edit patients/visits
🗑️ Delete
🔍 Search (cached data)
📋 View all patients
🔬 Diagnosis (150+ diseases)
➕ کسٹم data add

<b>❌ نہیں کر سکتے:</b>

🔄 Cloud sync (بعد میں ہوگا)
📥 New data fetch (cached استعمال ہوگا)

═══════════════

<b>🔄 خودکار Behavior:</b>

<b>آفلائن جانے پر:</b>

🔴 Status: Offline
⚠️ نوٹس نظر آئے گا
✅ سب کچھ کام کرے گا

<b>Actions Storage:</b>

جو بھی add/edit/delete کریں:
       ↓
Pending queue میں save
       ↓
Local storage میں محفوظ
       ↓
🟡 Pending Badge نظر آئے گا

<b>مثال:</b>
📱 Header میں: 🟡 5
(5 items pending sync)

═══════════════

<b>🌐 Internet آنے پر:</b>

<b>خودکار sync:</b>

1. Connection detected
2. 🟢 Status: Online
3. ⚠️ Notice hide
4. Pending operations execute:
   • Add کریں
   • Edit کریں
   • Delete کریں
5. 🟡 Badge disappear
6. ✅ "5 items synced"

═══════════════

<b>💾 Cache System:</b>

<b>Cached Data:</b>
• Patients list
• Visits
• Custom data
• Icons/UI

<b>Cache Refresh:</b>
• ہر 30 seconds
• Manual sync دبانے پر
• Force refresh پر

═══════════════

<b>📊 Data Safety:</b>

<b>3 layer Protection:</b>

<b>1. Live State:</b>
Browser memory میں

<b>2. LocalStorage:</b>
Device پر محفوظ
Browser بند ہو تب بھی

<b>3. Cloud:</b>
Internet آتے ہی sync

<b>نتیجہ:</b>
✅ Data کبھی نہیں کھوئے گا!

═══════════════

<b>💡 اہم Tips:</b>

<b>1. Pending Badge Ignore نہ کریں:</b>
Internet آتے ہی چیک کریں کہ sync ہوا

<b>2. مہمی data منتقل کرنے سے پہلے:</b>
Backup ضرور لیں

<b>3. Battery Optimization:</b>
موبائل پر PWA کو
"Not optimized" رکھیں
(background sync کے لیے)`
            },
            en: {
                title: 'Offline Mode',
                content: `<b>📱 Works without Internet!</b>

<b>PWA Technology:</b>
Progressive Web App
Works like native app

═══════════════

<b>💡 Offline Capabilities:</b>

<b>✅ Can do:</b>
📝 New registration
✏️ Edit
🗑️ Delete
🔍 Search
📋 View all
🔬 Diagnosis
➕ Custom data

<b>❌ Cannot do:</b>
🔄 Real-time sync (later)
📥 Fresh data fetch

═══════════════

<b>🔄 Auto Behavior:</b>

<b>Going Offline:</b>
🔴 Status: Offline
⚠️ Notice appears
✅ Everything works

<b>Actions Storage:</b>
Pending queue
🟡 Pending badge

═══════════════

<b>🌐 Coming Online:</b>

Auto-sync:
1. Connection detected
2. 🟢 Online
3. Pending executes
4. 🟡 Badge disappears
5. ✅ "5 items synced"

═══════════════

<b>💾 Cache System:</b>

Cached data:
• Patients
• Visits
• Custom data

Refresh:
• Every 30 seconds
• Manual sync
• Force refresh

═══════════════

<b>📊 Data Safety:</b>

3-Layer Protection:
1. Live state
2. LocalStorage
3. Cloud

Result: Never lose data!`
            },
            roman: {
                title: 'Offline Mode',
                content: `<b>Internet nahi to bhi kaam!</b>

<b>Can do:</b>
Add, edit, delete
Search, view
Diagnosis
Custom data

<b>Cannot:</b>
Real-time sync

<b>Auto behavior:</b>
Offline → Pending queue
Online → Auto sync

<b>Data Safety:</b>
Live + Local + Cloud
Never lose data!`
            }
        }
    };
    
    // ==========================================
    // FAQ SECTION
    // ==========================================
    HELP_CONTENT.faqs = [
        {
            id: 'offline_work',
            question: {
                ur: 'کیا ایپ آفلائن بھی کام کرے گی؟',
                en: 'Does the app work offline?',
                roman: 'Kya app offline bhi kaam karti hai?'
            },
            answer: {
                ur: `✅ <b>ہاں! مکمل طور پر!</b>

آفلائن ہونے پر:
• سب کچھ کام کرے گا
• Data local محفوظ ہوگا
• 🟡 Pending badge نظر آئے گا

Internet آتے ہی:
• خودکار sync ہوگی
• سب کچھ cloud پر chala jayega
• Badge disappear`,
                en: `✅ <b>Yes! Completely!</b>

When offline:
• Everything works
• Data saved locally
• 🟡 Pending badge shows

When online:
• Auto-sync happens
• Everything goes to cloud
• Badge disappears`,
                roman: `✅ <b>Han! Bilkul!</b>

Offline mein:
• Sab kaam karta hai
• Local save hota hai
• 🟡 Pending badge

Online aane par:
• Auto sync
• Cloud par jata hai`
            }
        },
        {
            id: 'data_loss',
            question: {
                ur: 'کیا ڈیٹا کھو تو نہیں جائے گا؟',
                en: 'Can I lose my data?',
                roman: 'Kya data kho jayega?'
            },
            answer: {
                ur: `❌ <b>نہیں! کبھی نہیں!</b>

3 Layer Protection:

1. ☁️ Cloud (Supabase)
2. 💾 Local Storage (Device)
3. 📁 GitHub (اگر add کریں)

Extra Safety:
• 📦 Full Backup (Manual)
• 🆕 Only New Backup
• Google Drive پر save

آپ کا ڈیٹا مکمل محفوظ!`,
                en: `❌ <b>No! Never!</b>

3-Layer Protection:

1. ☁️ Cloud (Supabase)
2. 💾 Local Storage
3. 📁 GitHub (if added)

Extra Safety:
• 📦 Full Backup
• 🆕 Only New Backup
• Google Drive save

Your data is completely safe!`,
                roman: `❌ <b>Nahi! Kabhi nahi!</b>

3 Layer Safety:
1. Cloud
2. Local Storage
3. GitHub

Extra:
• Full Backup
• Only New Backup

Data safe hai!`
            }
        },
        {
            id: 'multi_device',
            question: {
                ur: 'کیا موبائل اور ڈیسک ٹاپ دونوں پر استعمال کر سکتے ہیں؟',
                en: 'Can I use on both mobile and desktop?',
                roman: 'Mobile aur desktop dono par use kar sakte?'
            },
            answer: {
                ur: `✅ <b>ہاں! کوئی مسئلہ نہیں!</b>

<b>کیسے:</b>
1. Login کریں دونوں پر
2. سب کچھ خودکار sync
3. Cloud پر save
4. Real-time update

<b>مثال:</b>
📱 موبائل: مریض add
       ↓
💻 Desktop: 2 seconds میں نظر آ گیا!`,
                en: `✅ <b>Yes! No problem!</b>

<b>How:</b>
1. Login on both
2. Auto-sync everything
3. Cloud saved
4. Real-time updates

<b>Example:</b>
📱 Mobile: add patient
       ↓
💻 Desktop: appears in 2 seconds!`,
                roman: `✅ <b>Han! Bilkul!</b>

Kaise:
1. Login dono par
2. Auto sync
3. Cloud save

Mobile par add → Desktop par bhi!`
            }
        },
        {
            id: 'family_number',
            question: {
                ur: 'فیملی نمبر کیسے دیں؟',
                en: 'How to assign family number?',
                roman: 'Family number kaise dein?'
            },
            answer: {
                ur: `<b>3 طریقے:</b>

<b>1. خود لکھیں:</b>
F-001, F-002...

<b>2. خالی چھوڑ دیں:</b>
اگر پہلا مریض ہے:
Family No = NULL

<b>3. خودکار پہچان:</b>
اگر same فون سے دوسرا مریض:
✅ خودکار family match
Green message: "Family exists"

<b>💡 مشورہ:</b>
خالی چھوڑ دیں!
System خود ہی sort کر لے گا۔`,
                en: `<b>3 ways:</b>

<b>1. Enter yourself:</b>
F-001, F-002...

<b>2. Leave blank:</b>
If first patient:
Family No = NULL

<b>3. Auto-detect:</b>
Same phone number:
✅ Auto family match
Green: "Family exists"

<b>💡 Tip:</b>
Leave blank!
System will sort automatically.`,
                roman: `<b>3 tarike:</b>

1. Khud likhein: F-001
2. Khali chhorein
3. Auto detect (same phone)

<b>Tip:</b>
Khali chhorein!
System auto detect kar lega.`
            }
        },
        {
            id: 'promote_meaning',
            question: {
                ur: 'پروموٹ کا کیا مطلب ہے؟',
                en: 'What does "Promote" mean?',
                roman: 'Promote ka kya matlab?'
            },
            answer: {
                ur: `<b>پروموٹ = "میں نے یہ گٹ ہب پر add کر دی"</b>

<b>مطلب:</b>

جب آپ ایپ میں نئی بیماری add کرتے ہیں:
🆕 New badge لگتا ہے
(صرف کلاؤڈ پر)

پھر آپ نے وہ GitHub میں add کر دی:
تو ایپ میں "✅" button دبائیں
✅ GitHub badge لگ جائے گا
       ↓
مطلب: "یہ اب permanent ہے"

<b>فائدہ:</b>
اگلی backup میں شامل نہیں ہوگی
Duplicate سے بچاؤ`,
                en: `<b>Promote = "I've added this to GitHub"</b>

<b>Meaning:</b>

When you add new disease in app:
🆕 New badge appears
(Only in cloud)

When you add it to GitHub:
Click "✅" button in app
✅ GitHub badge appears
       ↓
Means: "Now permanent"

<b>Benefit:</b>
Excluded from next backup
No duplicates`,
                roman: `<b>Promote = "Maine GitHub par add kar di"</b>

Naya add karein → 🆕 New
GitHub par jaein → "✅" dabayein
Ab: ✅ GitHub badge

<b>Faida:</b>
Next backup mein nahi
Duplicate se bachao`
            }
        },
        {
            id: 'when_backup',
            question: {
                ur: 'بیک اپ کب لینا چاہیے؟',
                en: 'When should I take backup?',
                roman: 'Backup kab lena chahiye?'
            },
            answer: {
                ur: `<b>Recommended Schedule:</b>

<b>📅 ہفتہ وار (اتوار):</b>
🆕 صرف نئی بیک اپ
Small file, quick

<b>📅 مہینے کے آخر:</b>
📦 مکمل بیک اپ
Complete safety

<b>خصوصی مواقع:</b>
• GitHub push سے پہلے
• Large data add کرنے کے بعد
• Format change کے پہلے

<b>محفوظ کہاں کریں:</b>
✅ گوگل ڈرائیو
✅ Email پر
✅ External drive
✅ Cloud storage`,
                en: `<b>Recommended Schedule:</b>

<b>📅 Weekly (Sunday):</b>
🆕 Only New Backup
Small, quick file

<b>📅 Monthly End:</b>
📦 Full Backup
Complete safety

<b>Special occasions:</b>
• Before GitHub push
• After large data add
• Before format change

<b>Where to save:</b>
✅ Google Drive
✅ Email
✅ External drive
✅ Cloud storage`
            },
            roman: {
                ur: null,
                en: null,
                roman: `<b>Schedule:</b>

Har hafte:
🆕 Only New Backup

Maheenay ke akhir:
📦 Full Backup

<b>Save karein:</b>
Google Drive
Email
External drive`
            }
        },
        {
            id: 'delete_patient',
            question: {
                ur: 'کیا مریض delete کرنے پر وزٹس بھی delete ہوں گی؟',
                en: 'If I delete patient, will visits also be deleted?',
                roman: 'Patient delete karne par visits bhi delete?'
            },
            answer: {
                ur: `⚠️ <b>ہاں! دونوں delete ہوں گے!</b>

<b>Confirmation آئے گی:</b>
"X نام اور Y consultations delete کریں؟"

Yes دبانے پر:
❌ مریض delete
❌ سب visits delete
❌ Cloud سے بھی
❌ Local سے بھی

<b>⚠️ واپس نہیں آئیں گی!</b>

<b>احتیاط:</b>
پہلے backup لیں!
یقین کرلیں delete کرنا ہے۔`,
                en: `⚠️ <b>Yes! Both will be deleted!</b>

<b>Confirmation appears:</b>
"Delete X name and Y consultations?"

Clicking Yes:
❌ Patient deleted
❌ All visits deleted
❌ From cloud
❌ From local

<b>⚠️ Cannot recover!</b>

<b>Caution:</b>
Take backup first!
Be sure before deleting.`,
                roman: `⚠️ <b>Han! Dono delete hongay!</b>

Confirmation:
"Delete X name aur Y consultations?"

Yes = Patient + Visits sab delete
⚠️ Wapis nahi aayen ge!

Backup lein pehle!`
            }
        },
        {
            id: 'language_change',
            question: {
                ur: 'زبان کیسے بدلیں؟',
                en: 'How to change language?',
                roman: 'Language kaise badlein?'
            },
            answer: {
                ur: `<b>آسان طریقہ:</b>

اوپر right میں 🌐 بٹن
       ↓
کلک کریں
       ↓
زبان بدل جائے گی!

<b>Cycle:</b>
🇵🇰 اردو → 🇬🇧 English → 🔤 Roman → واپس

<b>💡 اہم:</b>
✅ آپ کی پسند یاد رہے گی
✅ اگلی بار وہی زبان
✅ سب کچھ ترجمہ ہوگا

<b>Text Direction:</b>
اردو = RTL (دائیں سے بائیں)
English/Roman = LTR`,
                en: `<b>Easy way:</b>

🌐 button at top right
       ↓
Click it
       ↓
Language changes!

<b>Cycle:</b>
🇵🇰 Urdu → 🇬🇧 English → 🔤 Roman → back

<b>💡 Important:</b>
✅ Preference remembered
✅ Same language next time
✅ Everything translates

<b>Text Direction:</b>
Urdu = RTL
English/Roman = LTR`,
                roman: `<b>Easy:</b>

🌐 button top right
Click karein
Language change!

🇵🇰 → 🇬🇧 → 🔤 → back

Pasand yaad rahegi`
            }
        }
    ];
    
    // ==========================================
    // PRO TIPS
    // ==========================================
    HELP_CONTENT.tips = [
        {
            ur: `💡 <b>Migration Wizard استعمال کریں!</b>

جب بھی GitHub پر بیماریاں بھیجنی ہوں:
"🚀 Migration Wizard" دبائیں
مرحلہ وار سب کچھ ہو جائے گا۔`,
            en: `💡 <b>Use Migration Wizard!</b>

Whenever sending to GitHub:
Click "🚀 Migration Wizard"
Step-by-step handling.`,
            roman: `💡 <b>Migration Wizard use karein!</b>

GitHub par bhejne ke liye
Migration Wizard best hai!`
        },
        {
            ur: `💡 <b>ہفتہ وار بیک اپ لیں!</b>

ہر اتوار "🆕 صرف نئی بیک اپ" لیں
Google Drive پر save کریں
ڈیٹا محفوظ رہے گا۔`,
            en: `💡 <b>Weekly Backup!</b>

Every Sunday "🆕 Only New Backup"
Save on Google Drive
Data stays safe.`,
            roman: `💡 <b>Har hafte backup!</b>

Har Sunday "🆕 Only New"
Google Drive save
Data safe!`
        },
        {
            ur: `💡 <b>فیملی نمبر خالی چھوڑیں!</b>

اگر ایک ہی فون سے دوسرا مریض آئے
تو سسٹم خود بتائے گا کہ فیملی موجود ہے
اور خودکار number دے دے گا۔`,
            en: `💡 <b>Leave Family No blank!</b>

If same phone comes again
System auto-detects family exists
And gives number automatically.`,
            roman: `💡 <b>Family No khali chhorein!</b>

Same phone dobara aaye
System auto detect karega
Number khud dega!`
        },
        {
            ur: `💡 <b>تشخیص سے Copy to Visit!</b>

تشخیص میں کوئی بیماری match ہو
"📋 Copy to Visit" دبائیں
Patient کی visit میں خودکار fill!`,
            en: `💡 <b>Copy Diagnosis to Visit!</b>

When disease matches in diagnosis
Click "📋 Copy to Visit"
Auto-fills patient visit!`,
            roman: `💡 <b>Copy to Visit!</b>

Diagnosis mein match ho
"📋 Copy to Visit" dabayein
Visit auto fill!`
        },
        {
            ur: `💡 <b>Cleanup ضرور کریں!</b>

GitHub پر add کرنے کے بعد
"✅ Promoted" مارک کریں
پھر "🧹 Cleanup Promoted"
Cloud صاف رہے گا۔`,
            en: `💡 <b>Always Cleanup!</b>

After adding to GitHub
Mark as "✅ Promoted"
Then "🧹 Cleanup Promoted"
Cloud stays clean.`,
            roman: `💡 <b>Cleanup zaruri!</b>

GitHub add karne ke baad
✅ Promoted mark
🧹 Cleanup dabayein`
        },
        {
            ur: `💡 <b>Pending Badge ignore نہ کریں!</b>

اگر Header میں 🟡 نمبر نظر آئے
Internet آتے ہی چیک کریں کہ sync ہو گیا
سب pending items save ہو گئے۔`,
            en: `💡 <b>Don't ignore Pending Badge!</b>

If 🟡 number in header
Check when online that sync happened
All pending items saved.`,
            roman: `💡 <b>Pending Badge check karein!</b>

Header mein 🟡 dikha
Online aane par sync check karein`
        },
        {
            ur: `💡 <b>Diagnosis سے شروع کریں!</b>

نیا مریض آئے تو پہلے diagnosis استعمال کریں
150+ بیماریاں پہلے سے موجود
تشخیص میں مدد ملے گی۔`,
            en: `💡 <b>Start with Diagnosis!</b>

New patient? Use diagnosis first
150+ diseases already available
Get diagnostic help.`,
            roman: `💡 <b>Diagnosis se start!</b>

Naya patient
Pehle diagnosis
150+ diseases ready`
        },
        {
            ur: `💡 <b>Custom Data شامل کرتے رہیں!</b>

اپنی experience کی بیماریاں add کریں
مہینے میں GitHub پر بھیجیں
سب کے لیے default بن جائیں گی!`,
            en: `💡 <b>Keep adding Custom Data!</b>

Add your experience-based diseases
Send to GitHub monthly
Become default for everyone!`,
            roman: `💡 <b>Custom data add karte rahein!</b>

Apni experience ki diseases
Maheenay mein GitHub bhejein
Default ban jayen!`
        }
    ];
    
    // ==========================================
    // KEYBOARD SHORTCUTS INFO
    // ==========================================
    HELP_CONTENT.shortcuts = {
        ur: {
            title: '⌨️ کی بورڈ شارٹ کٹس',
            note: '💡 آپ سیٹنگز سے یہ آن/آف کر سکتے ہیں',
            items: [
                { key: '?', action: 'مدد سینٹر کھولیں' },
                { key: 'H', action: 'ہسٹری دیکھیں' },
                { key: 'B', action: 'مکمل بیک اپ لیں' },
                { key: 'N', action: 'نئی رجسٹریشن' },
                { key: 'S', action: 'مریض تلاش' },
                { key: 'D', action: 'ڈیش بورڈ پر جائیں' },
                { key: 'A', action: 'تمام مریض' },
                { key: 'X', action: 'تشخیص صفحہ' },
                { key: 'Esc', action: 'ماڈل / پاپ اپ بند کریں' }
            ]
        },
        en: {
            title: '⌨️ Keyboard Shortcuts',
            note: '💡 You can toggle these in Settings',
            items: [
                { key: '?', action: 'Open Help Center' },
                { key: 'H', action: 'View History' },
                { key: 'B', action: 'Take Full Backup' },
                { key: 'N', action: 'New Registration' },
                { key: 'S', action: 'Search Patient' },
                { key: 'D', action: 'Go to Dashboard' },
                { key: 'A', action: 'All Patients' },
                { key: 'X', action: 'Diagnosis Page' },
                { key: 'Esc', action: 'Close Modal / Popup' }
            ]
        },
        roman: {
            title: '⌨️ Keyboard Shortcuts',
            note: '💡 Settings se toggle kar sakte hain',
            items: [
                { key: '?', action: 'Help Center kholein' },
                { key: 'H', action: 'History dekhein' },
                { key: 'B', action: 'Full Backup lein' },
                { key: 'N', action: 'New Registration' },
                { key: 'S', action: 'Patient search' },
                { key: 'D', action: 'Dashboard' },
                { key: 'A', action: 'All Patients' },
                { key: 'X', action: 'Diagnosis' },
                { key: 'Esc', action: 'Modal band karein' }
            ]
        }
    };
    
    // ==========================================
    // QUICK TOUR (2-minute version)
    // ==========================================
    HELP_CONTENT.quickTour = {
        ur: [
            {
                title: '🏥 خوش آمدید',
                body: `یہ ایپ آپ کے کلینک کے لیے ہے۔
مریضوں، وزٹس، تشخیص - سب کچھ ایک جگہ!`
            },
            {
                title: '➕ مریض شامل کریں',
                body: `"نئی رجسٹریشن" سے نیا مریض add کریں
یا "تلاش" سے پرانا ڈھونڈیں۔`
            },
            {
                title: '🔬 تشخیصی مدد',
                body: `"تشخیص" میں علامات چنیں
150+ بیماریوں سے match کریں۔`
            },
            {
                title: '⚙️ کسٹم ڈیٹا',
                body: `"سیٹنگز" سے اپنی بیماریاں add کریں
GitHub پر permanent بھی کر سکتے ہیں۔`
            }
        ],
        en: [
            {
                title: '🏥 Welcome',
                body: `This app is for your clinic.
Patients, visits, diagnosis - all in one!`
            },
            {
                title: '➕ Add Patient',
                body: `Use "New Registration" for new patient
Or "Search" to find existing.`
            },
            {
                title: '🔬 Diagnostic Help',
                body: `In "Diagnosis" choose symptoms
Match with 150+ diseases.`
            },
            {
                title: '⚙️ Custom Data',
                body: `In "Settings" add your diseases
Can make permanent on GitHub.`
            }
        ],
        roman: [
            {
                title: '🏥 Welcome',
                body: `Aap ki clinic ke liye
Patients, visits, diagnosis - sab!`
            },
            {
                title: '➕ Patient Add',
                body: `"Nayi Registration" ya "Talash"`
            },
            {
                title: '🔬 Diagnosis',
                body: `Symptoms select
150+ diseases match`
            },
            {
                title: '⚙️ Custom Data',
                body: `Settings mein add
GitHub par permanent bhi`
            }
        ]
    };
    
    console.log('✅ Help Content Part 2 loaded (Help Center + FAQs + Tips)');

    // ==========================================
    // ========= FUNCTIONS PART 1 ===============
    // ==========================================
    
    // ==========================================
    // PREFERENCES SYSTEM (User Settings)
    // ==========================================
    
    const DEFAULT_PREFS = {
        showTour: true,           // First-time tour
        keyboardShortcuts: true,  // Keyboard shortcuts
        showTips: true,           // Tips of the day
        showTooltips: true,       // Hover tooltips
        tourCompleted: false      // Has user completed tour
    };
    
    function getPreferences() {
        try {
            const saved = localStorage.getItem('help_preferences');
            return saved ? { ...DEFAULT_PREFS, ...JSON.parse(saved) } : DEFAULT_PREFS;
        } catch(e) {
            return DEFAULT_PREFS;
        }
    }
    
    function savePreferences(prefs) {
        try {
            localStorage.setItem('help_preferences', JSON.stringify(prefs));
            return true;
        } catch(e) {
            console.error('Failed to save preferences:', e);
            return false;
        }
    }
    
    function updatePreference(key, value) {
        const prefs = getPreferences();
        prefs[key] = value;
        savePreferences(prefs);
        return prefs;
    }
    
    // Expose to window
    window.getPreferences = getPreferences;
    window.updatePreference = updatePreference;
    
    // ==========================================
    // LANGUAGE HELPER
    // ==========================================
    
    function getCurrentLang() {
        try {
            return localStorage.getItem('clinic_lang') || 'ur';
        } catch(e) {
            return 'ur';
        }
    }
    
    function getContent(contentObj) {
        const lang = getCurrentLang();
        if (contentObj && contentObj[lang]) return contentObj[lang];
        if (contentObj && contentObj.ur) return contentObj.ur;
        return null;
    }
    
    // ==========================================
    // TOOLTIP SYSTEM (Hover)
    // ==========================================
    
    let currentTooltip = null;
    let tooltipTimeout = null;
    
    function createTooltip(element, text) {
        // Remove existing
        removeTooltip();
        
        // Create tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'help-tooltip';
        tooltip.innerHTML = text;
        tooltip.style.cssText = `
            position: fixed;
            background: #2c3e50;
            color: white;
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 13px;
            font-family: inherit;
            z-index: 9999;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            max-width: 300px;
            text-align: center;
            line-height: 1.5;
        `;
        
        document.body.appendChild(tooltip);
        
        // Position tooltip
        const rect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        
        let top = rect.bottom + 8;
        let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        
        // Adjust if goes off screen
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top + tooltipRect.height > window.innerHeight - 10) {
            top = rect.top - tooltipRect.height - 8;
        }
        
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
        
        // Fade in
        setTimeout(() => { tooltip.style.opacity = '1'; }, 10);
        
        currentTooltip = tooltip;
        return tooltip;
    }
    
    function removeTooltip() {
        if (tooltipTimeout) {
            clearTimeout(tooltipTimeout);
            tooltipTimeout = null;
        }
        if (currentTooltip) {
            currentTooltip.remove();
            currentTooltip = null;
        }
    }
    
    function attachTooltip(element, tooltipKey) {
        if (!element) return;
        
        const prefs = getPreferences();
        if (!prefs.showTooltips) return;
        
        const buttonData = HELP_CONTENT.buttons[tooltipKey];
        if (!buttonData) return;
        
        const tooltip = getContent(buttonData.tooltip);
        if (!tooltip) return;
        
        // Mouse events
        element.addEventListener('mouseenter', function() {
            if (!getPreferences().showTooltips) return;
            tooltipTimeout = setTimeout(() => {
                createTooltip(element, tooltip);
            }, 500);
        });
        
        element.addEventListener('mouseleave', removeTooltip);
        
        // Touch events (mobile)
        element.addEventListener('touchstart', function(e) {
            if (!getPreferences().showTooltips) return;
            e.preventDefault();
            createTooltip(element, tooltip);
            setTimeout(removeTooltip, 2000);
        });
    }
    
    // ==========================================
    // INFO MODAL SYSTEM (Click ⓘ)
    // ==========================================
    
    function createInfoModal() {
        // Check if already exists
        if (document.getElementById('helpInfoModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'helpInfoModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width:600px;">
                <div class="modal-title">
                    <span id="helpInfoTitle">ℹ️ معلومات</span>
                    <button class="modal-close" onclick="closeHelpInfoModal()">✕</button>
                </div>
                <div id="helpInfoContent" style="line-height:1.8;font-size:14px;"></div>
                <div class="action-buttons" style="margin-top:20px;">
                    <button class="btn btn-primary" onclick="closeHelpInfoModal()" id="helpInfoOkBtn">
                        ✅ ٹھیک ہے
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Backdrop click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeHelpInfoModal();
        });
    }
    
    window.showInfoModal = function(buttonKey) {
        createInfoModal();
        
        const buttonData = HELP_CONTENT.buttons[buttonKey];
        if (!buttonData) {
            console.warn('Button data not found:', buttonKey);
            return;
        }
        
        const modalData = getContent(buttonData.modal);
        if (!modalData) return;
        
        // Update content
        document.getElementById('helpInfoTitle').innerHTML = 
            modalData.icon + ' ' + modalData.title;
        document.getElementById('helpInfoContent').innerHTML = 
            '<div style="white-space:pre-wrap;">' + modalData.content + '</div>';
        
        // Update button text based on language
        const lang = getCurrentLang();
        const btnText = {
            ur: '✅ ٹھیک ہے',
            en: '✅ Got it!',
            roman: '✅ Theek hai'
        };
        document.getElementById('helpInfoOkBtn').textContent = btnText[lang] || btnText.ur;
        
        // Show modal
        document.getElementById('helpInfoModal').classList.add('active');
    };
    
    window.closeHelpInfoModal = function() {
        const modal = document.getElementById('helpInfoModal');
        if (modal) modal.classList.remove('active');
    };
    
    // ==========================================
    // ADD INFO ICON TO BUTTONS
    // ==========================================
    
    function addInfoIcon(buttonElement, buttonKey) {
        if (!buttonElement) return;
        
        // Check if already has info icon
        if (buttonElement.querySelector('.help-info-icon')) return;
        
        // Attach tooltip
        attachTooltip(buttonElement, buttonKey);
        
        // Create info icon
        const infoIcon = document.createElement('span');
        infoIcon.className = 'help-info-icon';
        infoIcon.innerHTML = 'ⓘ';
        infoIcon.style.cssText = `
            display: inline-block;
            margin: 0 5px;
            color: #17a2b8;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            padding: 2px 4px;
            border-radius: 50%;
            background: rgba(23,162,184,0.1);
            transition: all 0.2s;
            vertical-align: middle;
        `;
        infoIcon.title = 'More info';
        
        // Hover effect
        infoIcon.addEventListener('mouseenter', function() {
            this.style.background = 'rgba(23,162,184,0.3)';
            this.style.transform = 'scale(1.2)';
        });
        infoIcon.addEventListener('mouseleave', function() {
            this.style.background = 'rgba(23,162,184,0.1)';
            this.style.transform = 'scale(1)';
        });
        
        // Click to show modal
        infoIcon.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showInfoModal(buttonKey);
        });
        
        // Add to button
        buttonElement.appendChild(infoIcon);
    }
    
    // ==========================================
    // ATTACH HELP TO ALL BUTTONS
    // ==========================================
    
    function attachAllHelpIcons() {
        // Map: button selector → help key
        const buttonMap = [
            { selector: 'button[onclick*="openAddCategoryModal()"]', key: 'category', filter: (el) => !el.textContent.includes('Edit') },
            { selector: 'button[onclick*="openAddSymptomModal()"]', key: 'symptom', filter: (el) => !el.textContent.includes('Edit') },
            { selector: 'button[onclick*="openAddDiseaseModal()"]', key: 'disease', filter: (el) => !el.textContent.includes('Edit') },
            { selector: 'button[onclick*="viewCustomData()"]', key: 'view_edit_delete' },
            { selector: 'button[onclick*="viewHistory()"]', key: 'history' },
            { selector: 'button[onclick*="smartImport()"]', key: 'import' },
            { selector: 'button[onclick*="exportCustomData()"]', key: 'full_backup' },
            { selector: 'button[onclick*="exportOnlyNew()"]', key: 'only_new_backup' },
            { selector: 'button[onclick*="exportForGitHub()"]', key: 'export_github' },
            { selector: 'button[onclick*="migrationWizard()"]', key: 'migration_wizard' },
            { selector: 'button[onclick*="cleanupPromoted()"]', key: 'cleanup' },
            { selector: 'button[onclick*="syncCustomData()"]', key: 'sync' }
        ];
        
        buttonMap.forEach(function(item) {
            const buttons = document.querySelectorAll(item.selector);
            buttons.forEach(function(btn) {
                if (item.filter && !item.filter(btn)) return;
                addInfoIcon(btn, item.key);
            });
        });
        
        console.log('✅ Help icons attached to all buttons');
    }
    
    // Re-attach when Settings page opens
    function watchForSettingsPage() {
        setInterval(function() {
            const settingsPage = document.querySelector('#page-settings.active');
            if (settingsPage) {
                attachAllHelpIcons();
            }
        }, 2000);
    }
    
    // ==========================================
    // FIX MISSING TRANSLATIONS IN SETTINGS
    // ==========================================
    
    function fixSettingsLabels() {
        const lang = getCurrentLang();
        
        // Translation map for Custom Data Manager section
        const labelFixes = {
            ur: {
                // Header
                'کسٹم ڈیٹا مینیجر (Cloud Sync)': 'کسٹم ڈیٹا مینیجر (کلاؤڈ سنک)',
                'Custom Data Cloud Sync': 'کسٹم ڈیٹا کلاؤڈ سنک',
                'Ready': 'تیار',
                
                // Sync button
                'Sync': 'سنک',
                
                // Description
                'Categories، Symptoms اور Diseases شامل، ترمیم اور حذف کریں۔ ☁️ Cloud پر خودکار sync ہو گا۔': 
                    'کیٹگری، علامات اور بیماریاں شامل، ترمیم اور حذف کریں۔ ☁️ کلاؤڈ پر خودکار سنک ہو گا۔',
                
                // Buttons
                'View / Edit / Delete': 'دیکھیں / ایڈٹ / ڈیلیٹ',
                'Import (JSON/CSV)': 'امپورٹ (جے سن/سی ایس وی)',
                'بیک اپ اور GitHub': 'بیک اپ اور گٹ ہب',
                'Full Backup': 'مکمل بیک اپ',
                'Only New Backup': 'صرف نئی بیک اپ',
                'Export JSON': 'ایکسپورٹ جے سن',
                'Export for GitHub': 'گٹ ہب کے لیے ایکسپورٹ',
                'Migration Wizard': 'مائیگریشن وزرڈ',
                'Cleanup Promoted': 'پروموٹڈ صفائی',
                'Cleanup Promoted Items': 'پروموٹڈ چیزیں صاف کریں',
                
                // Tips
                'Tip:': 'مشورہ:',
                'استعمال کریں - یہ آپ کو step-by-step guide کرے گا': 
                    'استعمال کریں - یہ آپ کو مرحلہ وار رہنمائی کرے گا',
                '← GitHub پر add ہو چکی items delete کریں': 
                    '← گٹ ہب پر شامل ہو چکی چیزیں مٹا دیں'
            },
            en: {
                // Keep English as is
            },
            roman: {
                'کیٹگری، علامات اور بیماریاں شامل، ترمیم اور حذف کریں۔ ☁️ کلاؤڈ پر خودکار سنک ہو گا۔':
                    'Categories, Symptoms aur Diseases add, edit aur delete karein. Cloud par auto sync.',
                'بیک اپ اور گٹ ہب': 'Backup aur GitHub',
                'مکمل بیک اپ': 'Full Backup',
                'صرف نئی بیک اپ': 'Only New Backup',
                'گٹ ہب کے لیے ایکسپورٹ': 'GitHub ke liye Export',
                'مائیگریشن وزرڈ': 'Migration Wizard',
                'پروموٹڈ صفائی': 'Promoted Cleanup',
                'دیکھیں / ایڈٹ / ڈیلیٹ': 'View / Edit / Delete',
                'ہسٹری': 'History',
                'امپورٹ (جے سن/سی ایس وی)': 'Import (JSON/CSV)'
            }
        };
        
        // Only apply Urdu fixes (English/Roman already correct in HTML)
        if (lang !== 'ur') return;
        
        const fixes = labelFixes.ur;
        
        // Walk through all text nodes in settings
        const settingsPage = document.querySelector('#page-settings');
        if (!settingsPage) return;
        
        // Fix button spans
        const buttons = settingsPage.querySelectorAll('button span, button, div.description span, .btn-group-row + div, small');
        buttons.forEach(function(el) {
            const originalText = el.textContent.trim();
            for (var key in fixes) {
                if (originalText === key || originalText.includes(key)) {
                    el.textContent = el.textContent.replace(key, fixes[key]);
                }
            }
        });
        
        // Fix descriptions
        const descriptions = settingsPage.querySelectorAll('.description, .description span');
        descriptions.forEach(function(el) {
            const originalText = el.textContent.trim();
            for (var key in fixes) {
                if (originalText === key || originalText.includes(key)) {
                    el.textContent = el.textContent.replace(key, fixes[key]);
                }
            }
        });
    }
    
    // Watch for language changes
    function watchLanguageChanges() {
        let lastLang = getCurrentLang();
        setInterval(function() {
            const currentLang = getCurrentLang();
            if (currentLang !== lastLang) {
                lastLang = currentLang;
                setTimeout(fixSettingsLabels, 300);
            }
        }, 1000);
    }
    
    // Expose helpers
    window._helpSystem = {
        getPreferences: getPreferences,
        updatePreference: updatePreference,
        getCurrentLang: getCurrentLang,
        getContent: getContent,
        attachTooltip: attachTooltip,
        addInfoIcon: addInfoIcon,
        attachAllHelpIcons: attachAllHelpIcons,
        fixSettingsLabels: fixSettingsLabels
    };
    
    console.log('✅ Help System Functions Part 1 loaded (Preferences + Tooltips + Modals)');

    // ==========================================
    // ========= FUNCTIONS PART 2 ===============
    // ==========================================
    
    // ==========================================
    // INTERACTIVE TOUR ENGINE
    // ==========================================
    
    let currentTourStep = 0;
    let tourActive = false;
    
    function createTourOverlay() {
        if (document.getElementById('helpTourOverlay')) return;
        
        const overlay = document.createElement('div');
        overlay.id = 'helpTourOverlay';
        overlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7);
            z-index: 9998;
            justify-content: center;
            align-items: center;
            padding: 20px;
        `;
        
        overlay.innerHTML = `
            <div id="helpTourBox" style="
                background: white;
                border-radius: 15px;
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                padding: 25px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.4);
                font-family: inherit;
            ">
                <div id="helpTourHeader" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 15px;
                    padding-bottom: 12px;
                    border-bottom: 2px solid #ecf0f1;
                ">
                    <h3 id="helpTourTitle" style="color:#1a5276;margin:0;font-size:18px;">Title</h3>
                    <button onclick="closeTour()" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: #7f8c8d;
                    ">✕</button>
                </div>
                <div id="helpTourBody" style="
                    line-height: 1.8;
                    font-size: 14px;
                    color: #2c3e50;
                    margin-bottom: 20px;
                    white-space: pre-wrap;
                "></div>
                <div id="helpTourProgress" style="
                    text-align: center;
                    color: #7f8c8d;
                    font-size: 12px;
                    margin-bottom: 15px;
                "></div>
                <div id="helpTourButtons" style="
                    display: flex;
                    gap: 8px;
                    justify-content: space-between;
                    flex-wrap: wrap;
                "></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }
    
    window.startTour = function(isQuickTour) {
        currentTourStep = 0;
        tourActive = true;
        createTourOverlay();
        
        const overlay = document.getElementById('helpTourOverlay');
        overlay.style.display = 'flex';
        
        if (isQuickTour) {
            showQuickTourStep();
        } else {
            showTourStep();
        }
    };
    
    window.showTourWelcome = function() {
        createTourOverlay();
        const overlay = document.getElementById('helpTourOverlay');
        overlay.style.display = 'flex';
        
        const welcome = getContent(HELP_CONTENT.tour.welcome);
        const lang = getCurrentLang();
        
        document.getElementById('helpTourTitle').textContent = welcome.title;
        document.getElementById('helpTourBody').innerHTML = `
            <div style="text-align:center;font-size:16px;font-weight:bold;color:#8e44ad;margin-bottom:15px;">
                ${welcome.heading}
            </div>
            <div style="white-space:pre-wrap;">${welcome.content}</div>
        `;
        document.getElementById('helpTourProgress').textContent = '';
        
        const btnTexts = {
            ur: { full: '🎓 مکمل ٹور', quick: '⚡ فوری ٹور (2 منٹ)', skip: '❌ ابھی نہیں' },
            en: { full: '🎓 Full Tour', quick: '⚡ Quick Tour (2 min)', skip: '❌ Skip' },
            roman: { full: '🎓 Full Tour', quick: '⚡ Quick (2 min)', skip: '❌ Skip' }
        };
        const btns = btnTexts[lang] || btnTexts.ur;
        
        document.getElementById('helpTourButtons').innerHTML = `
            <button class="btn btn-primary" onclick="startTour(false)" style="flex:1;">${btns.full}</button>
            <button class="btn btn-info" onclick="startTour(true)" style="flex:1;">${btns.quick}</button>
            <button class="btn btn-light" onclick="skipTourPermanently()" style="flex:1;">${btns.skip}</button>
        `;
    };
    
    function showTourStep() {
        const steps = HELP_CONTENT.tour.steps;
        if (currentTourStep >= steps.length) {
            completeTour();
            return;
        }
        
        const step = steps[currentTourStep];
        const content = getContent(step.content);
        const lang = getCurrentLang();
        
        document.getElementById('helpTourTitle').textContent = content.title;
        document.getElementById('helpTourBody').innerHTML = content.body;
        
        const progressTexts = {
            ur: `مرحلہ ${currentTourStep + 1} / ${steps.length}`,
            en: `Step ${currentTourStep + 1} of ${steps.length}`,
            roman: `Step ${currentTourStep + 1} / ${steps.length}`
        };
        document.getElementById('helpTourProgress').textContent = progressTexts[lang] || progressTexts.ur;
        
        const btnTexts = {
            ur: { prev: '◀ پیچھے', next: 'آگے ▶', close: 'ٹور بند کریں', finish: '🎉 مکمل' },
            en: { prev: '◀ Previous', next: 'Next ▶', close: 'Close Tour', finish: '🎉 Finish' },
            roman: { prev: '◀ Peechay', next: 'Aagay ▶', close: 'Tour Band', finish: '🎉 Complete' }
        };
        const btns = btnTexts[lang] || btnTexts.ur;
        
        const isLast = currentTourStep === steps.length - 1;
        const isFirst = currentTourStep === 0;
        
        let buttonsHTML = '';
        if (!isFirst) {
            buttonsHTML += `<button class="btn btn-light" onclick="prevTourStep()">${btns.prev}</button>`;
        } else {
            buttonsHTML += `<span></span>`;
        }
        buttonsHTML += `<button class="btn btn-light btn-sm" onclick="closeTour()" style="opacity:0.7;">${btns.close}</button>`;
        if (isLast) {
            buttonsHTML += `<button class="btn btn-success" onclick="completeTour()">${btns.finish}</button>`;
        } else {
            buttonsHTML += `<button class="btn btn-primary" onclick="nextTourStep()">${btns.next}</button>`;
        }
        
        document.getElementById('helpTourButtons').innerHTML = buttonsHTML;
        
        // Highlight target element if specified
        if (step.target) {
            highlightElement(step.target);
        } else {
            removeHighlight();
        }
    }
    
    function showQuickTourStep() {
        const steps = HELP_CONTENT.quickTour[getCurrentLang()] || HELP_CONTENT.quickTour.ur;
        if (currentTourStep >= steps.length) {
            completeTour();
            return;
        }
        
        const step = steps[currentTourStep];
        const lang = getCurrentLang();
        
        document.getElementById('helpTourTitle').textContent = step.title;
        document.getElementById('helpTourBody').innerHTML = step.body;
        
        const progressTexts = {
            ur: `${currentTourStep + 1} / ${steps.length}`,
            en: `${currentTourStep + 1} / ${steps.length}`,
            roman: `${currentTourStep + 1} / ${steps.length}`
        };
        document.getElementById('helpTourProgress').textContent = progressTexts[lang] || progressTexts.ur;
        
        const btnTexts = {
            ur: { prev: '◀ پیچھے', next: 'آگے ▶', finish: '🎉 مکمل', close: 'بند کریں' },
            en: { prev: '◀ Previous', next: 'Next ▶', finish: '🎉 Finish', close: 'Close' },
            roman: { prev: '◀ Peechay', next: 'Aagay ▶', finish: '🎉 Complete', close: 'Close' }
        };
        const btns = btnTexts[lang] || btnTexts.ur;
        
        const isLast = currentTourStep === steps.length - 1;
        const isFirst = currentTourStep === 0;
        
        let buttonsHTML = '';
        if (!isFirst) {
            buttonsHTML += `<button class="btn btn-light" onclick="prevQuickStep()">${btns.prev}</button>`;
        } else {
            buttonsHTML += `<span></span>`;
        }
        buttonsHTML += `<button class="btn btn-light btn-sm" onclick="closeTour()" style="opacity:0.7;">${btns.close}</button>`;
        if (isLast) {
            buttonsHTML += `<button class="btn btn-success" onclick="completeTour()">${btns.finish}</button>`;
        } else {
            buttonsHTML += `<button class="btn btn-primary" onclick="nextQuickStep()">${btns.next}</button>`;
        }
        
        document.getElementById('helpTourButtons').innerHTML = buttonsHTML;
    }
    
    window.nextTourStep = function() {
        currentTourStep++;
        showTourStep();
    };
    
    window.prevTourStep = function() {
        if (currentTourStep > 0) {
            currentTourStep--;
            showTourStep();
        }
    };
    
    window.nextQuickStep = function() {
        currentTourStep++;
        showQuickTourStep();
    };
    
    window.prevQuickStep = function() {
        if (currentTourStep > 0) {
            currentTourStep--;
            showQuickTourStep();
        }
    };
    
    window.closeTour = function() {
        tourActive = false;
        const overlay = document.getElementById('helpTourOverlay');
        if (overlay) overlay.style.display = 'none';
        removeHighlight();
    };
    
    window.completeTour = function() {
        updatePreference('tourCompleted', true);
        closeTour();
        
        const lang = getCurrentLang();
        const msgs = {
            ur: '🎉 ٹور مکمل! اب آپ ایپ استعمال کر سکتے ہیں',
            en: '🎉 Tour completed! You can now use the app',
            roman: '🎉 Tour complete! App use karein'
        };
        
        if (typeof showToast === 'function') {
            showToast(msgs[lang] || msgs.ur);
        }
    };
    
    window.skipTourPermanently = function() {
        updatePreference('showTour', false);
        updatePreference('tourCompleted', true);
        closeTour();
    };
    
    // ==========================================
    // ELEMENT HIGHLIGHTING (for tour)
    // ==========================================
    
    function highlightElement(selector) {
        removeHighlight();
        
        const el = document.querySelector(selector);
        if (!el) return;
        
        // Scroll into view
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add highlight
        setTimeout(() => {
            const rect = el.getBoundingClientRect();
            const highlight = document.createElement('div');
            highlight.id = 'tourHighlight';
            highlight.style.cssText = `
                position: fixed;
                top: ${rect.top - 5}px;
                left: ${rect.left - 5}px;
                width: ${rect.width + 10}px;
                height: ${rect.height + 10}px;
                border: 3px solid #f39c12;
                border-radius: 8px;
                pointer-events: none;
                z-index: 9997;
                box-shadow: 0 0 20px rgba(243,156,18,0.6);
                animation: tourPulse 2s infinite;
            `;
            document.body.appendChild(highlight);
        }, 500);
    }
    
    function removeHighlight() {
        const existing = document.getElementById('tourHighlight');
        if (existing) existing.remove();
    }
    
    // Add pulse animation
    if (!document.getElementById('tourAnimations')) {
        const style = document.createElement('style');
        style.id = 'tourAnimations';
        style.textContent = `
            @keyframes tourPulse {
                0%, 100% { box-shadow: 0 0 20px rgba(243,156,18,0.6); }
                50% { box-shadow: 0 0 30px rgba(243,156,18,1); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // ==========================================
    // HELP CENTER
    // ==========================================
    
    function createHelpCenterModal() {
        if (document.getElementById('helpCenterModal')) return;
        
        const modal = document.createElement('div');
        modal.id = 'helpCenterModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width:750px;">
                <div class="modal-title">
                    <span id="helpCenterTitle">📚 مدد اور رہنمائی</span>
                    <button class="modal-close" onclick="closeHelpCenter()">✕</button>
                </div>
                <div id="helpCenterContent"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeHelpCenter();
        });
    }
    
    window.openHelpCenter = function() {
        createHelpCenterModal();
        renderHelpCenter();
        document.getElementById('helpCenterModal').classList.add('active');
    };
    
    window.closeHelpCenter = function() {
        const modal = document.getElementById('helpCenterModal');
        if (modal) modal.classList.remove('active');
    };
    
    function renderHelpCenter() {
        const lang = getCurrentLang();
        const titles = {
            ur: '📚 مدد اور رہنمائی مرکز',
            en: '📚 Help & Guidance Center',
            roman: '📚 Help & Guidance Center'
        };
        document.getElementById('helpCenterTitle').innerHTML = titles[lang] || titles.ur;
        
        const searchPlaceholder = {
            ur: 'تلاش کریں...',
            en: 'Search...',
            roman: 'Search...'
        };
        
        const labels = {
            ur: {
                startTour: '🎓 مکمل ٹور دوبارہ شروع کریں',
                quickTour: '⚡ فوری ٹور (2 منٹ)',
                sections: '📖 حصوں کے حساب سے سیکھیں',
                buttons: '🔘 بٹنز کی رہنمائی',
                faqs: '❓ اکثر پوچھے جانے والے سوالات',
                tips: '💡 پرو ٹپس',
                shortcuts: '⌨️ کی بورڈ شارٹ کٹس',
                close: 'بند کریں'
            },
            en: {
                startTour: '🎓 Restart Complete Tour',
                quickTour: '⚡ Quick Tour (2 min)',
                sections: '📖 Learn by Sections',
                buttons: '🔘 Button Guide',
                faqs: '❓ Frequently Asked Questions',
                tips: '💡 Pro Tips',
                shortcuts: '⌨️ Keyboard Shortcuts',
                close: 'Close'
            },
            roman: {
                startTour: '🎓 Full Tour Restart',
                quickTour: '⚡ Quick Tour',
                sections: '📖 Sections',
                buttons: '🔘 Buttons',
                faqs: '❓ FAQs',
                tips: '💡 Pro Tips',
                shortcuts: '⌨️ Shortcuts',
                close: 'Close'
            }
        };
        const l = labels[lang] || labels.ur;
        
        let html = `
            <div style="margin-bottom:15px;">
                <input type="text" id="helpSearchInput" placeholder="🔍 ${searchPlaceholder[lang]}" 
                    style="width:100%;padding:10px;border:2px solid #ddd;border-radius:8px;font-family:inherit;">
            </div>
            
            <div id="helpSearchResults" style="display:none;"></div>
            
            <div id="helpMainContent">
                <!-- Tour Section -->
                <div style="background:#f4ecf7;padding:12px;border-radius:8px;margin-bottom:12px;">
                    <div style="font-weight:bold;color:#8e44ad;margin-bottom:8px;">${l.sections}</div>
                    <div style="display:flex;gap:8px;flex-wrap:wrap;">
                        <button class="btn btn-purple btn-sm" onclick="closeHelpCenter();showTourWelcome();">${l.startTour}</button>
                        <button class="btn btn-info btn-sm" onclick="closeHelpCenter();startTour(true);">${l.quickTour}</button>
                    </div>
                </div>
                
                <!-- Sections -->
                <div style="margin-bottom:15px;">
                    <h4 style="color:#1a5276;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">📖 ${l.sections}</h4>
                    <div id="helpSectionsList"></div>
                </div>
                
                <!-- Buttons -->
                <div style="margin-bottom:15px;">
                    <h4 style="color:#8e44ad;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">🔘 ${l.buttons}</h4>
                    <div id="helpButtonsList"></div>
                </div>
                
                <!-- FAQs -->
                <div style="margin-bottom:15px;">
                    <h4 style="color:#f39c12;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">❓ ${l.faqs}</h4>
                    <div id="helpFaqsList"></div>
                </div>
                
                <!-- Tips -->
                <div style="margin-bottom:15px;">
                    <h4 style="color:#27ae60;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">💡 ${l.tips}</h4>
                    <div id="helpTipsList"></div>
                </div>
                
                <!-- Shortcuts -->
                <div style="margin-bottom:15px;">
                    <h4 style="color:#17a2b8;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">⌨️ ${l.shortcuts}</h4>
                    <div id="helpShortcutsList"></div>
                </div>
            </div>
            
            <div class="action-buttons" style="margin-top:15px;">
                <button class="btn btn-light" onclick="closeHelpCenter()">${l.close}</button>
            </div>
        `;
        
        document.getElementById('helpCenterContent').innerHTML = html;
        
        // Populate sections
        renderHelpSections();
        renderHelpButtons();
        renderHelpFaqs();
        renderHelpTips();
        renderHelpShortcuts();
        
        // Search functionality
        document.getElementById('helpSearchInput').addEventListener('input', function(e) {
            handleHelpSearch(e.target.value);
        });
    }
    
    function renderHelpSections() {
        const list = document.getElementById('helpSectionsList');
        if (!list) return;
        
        let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">';
        
        Object.keys(HELP_CONTENT.helpCenter).forEach(function(key) {
            const item = HELP_CONTENT.helpCenter[key];
            const content = getContent(item);
            if (!content) return;
            
            html += `
                <button onclick="showHelpTopic('${key}')" style="
                    padding: 10px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: white;
                    cursor: pointer;
                    text-align: right;
                    font-family: inherit;
                    font-size: 13px;
                    transition: all 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                ">
                    <span style="font-size:18px;">${item.icon}</span>
                    <span>${content.title}</span>
                </button>
            `;
        });
        
        html += '</div>';
        list.innerHTML = html;
    }
    
    function renderHelpButtons() {
        const list = document.getElementById('helpButtonsList');
        if (!list) return;
        
        let html = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px;">';
        
        Object.keys(HELP_CONTENT.buttons).forEach(function(key) {
            const item = HELP_CONTENT.buttons[key];
            const modal = getContent(item.modal);
            if (!modal) return;
            
            html += `
                <button onclick="closeHelpCenter();showInfoModal('${key}')" style="
                    padding: 8px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    background: white;
                    cursor: pointer;
                    text-align: right;
                    font-family: inherit;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                ">
                    <span style="font-size:16px;">${modal.icon}</span>
                    <span>${modal.title}</span>
                </button>
            `;
        });
        
        html += '</div>';
        list.innerHTML = html;
    }
    
    function renderHelpFaqs() {
        const list = document.getElementById('helpFaqsList');
        if (!list) return;
        
        let html = '';
        HELP_CONTENT.faqs.forEach(function(faq, idx) {
            const q = getContent(faq.question);
            const a = getContent(faq.answer);
            if (!q || !a) return;
            
            html += `
                <div style="background:#f8f9fa;border-radius:6px;margin-bottom:8px;overflow:hidden;">
                    <div onclick="toggleFaq(${idx})" style="
                        padding: 10px 12px;
                        cursor: pointer;
                        font-weight: bold;
                        color: #2c3e50;
                        font-size: 13px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span>❓ ${q}</span>
                        <span id="faqIcon${idx}">▼</span>
                    </div>
                    <div id="faqAnswer${idx}" style="
                        display: none;
                        padding: 12px;
                        background: white;
                        border-top: 1px solid #ecf0f1;
                        line-height: 1.6;
                        font-size: 13px;
                        white-space: pre-wrap;
                    ">${a}</div>
                </div>
            `;
        });
        
        list.innerHTML = html;
    }
    
    window.toggleFaq = function(idx) {
        const answer = document.getElementById('faqAnswer' + idx);
        const icon = document.getElementById('faqIcon' + idx);
        if (answer.style.display === 'none') {
            answer.style.display = 'block';
            icon.textContent = '▲';
        } else {
            answer.style.display = 'none';
            icon.textContent = '▼';
        }
    };
    
    function renderHelpTips() {
        const list = document.getElementById('helpTipsList');
        if (!list) return;
        
        let html = '';
        HELP_CONTENT.tips.forEach(function(tip) {
            const content = getContent(tip);
            if (!content) return;
            
            html += `
                <div style="
                    background: linear-gradient(135deg, #d4edda, #c3e6cb);
                    padding: 10px 12px;
                    border-radius: 6px;
                    margin-bottom: 6px;
                    font-size: 13px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                ">${content}</div>
            `;
        });
        
        list.innerHTML = html;
    }
    
    function renderHelpShortcuts() {
        const list = document.getElementById('helpShortcutsList');
        if (!list) return;
        
        const shortcuts = getContent(HELP_CONTENT.shortcuts);
        if (!shortcuts) return;
        
        const prefs = getPreferences();
        const enabledText = {
            ur: prefs.keyboardShortcuts ? '✅ آن' : '❌ آف',
            en: prefs.keyboardShortcuts ? '✅ ON' : '❌ OFF',
            roman: prefs.keyboardShortcuts ? '✅ ON' : '❌ OFF'
        };
        const lang = getCurrentLang();
        
        let html = `
            <div style="background:#d1ecf1;padding:8px 12px;border-radius:6px;margin-bottom:10px;font-size:12px;">
                ${shortcuts.note} <strong>${enabledText[lang]}</strong>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;">
        `;
        
        shortcuts.items.forEach(function(item) {
            html += `
                <div style="
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: white;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 12px;
                ">
                    <kbd style="
                        background: #2c3e50;
                        color: white;
                        padding: 2px 8px;
                        border-radius: 4px;
                        font-weight: bold;
                        font-family: monospace;
                    ">${item.key}</kbd>
                    <span>${item.action}</span>
                </div>
            `;
        });
        
        html += '</div>';
        list.innerHTML = html;
    }
    
    window.showHelpTopic = function(topicKey) {
        const topic = HELP_CONTENT.helpCenter[topicKey];
        if (!topic) return;
        
        const content = getContent(topic);
        if (!content) return;
        
        const modalContent = document.getElementById('helpCenterContent');
        const backLabels = {
            ur: '◀ واپس مدد سینٹر',
            en: '◀ Back to Help Center',
            roman: '◀ Back to Help'
        };
        const lang = getCurrentLang();
        
        modalContent.innerHTML = `
            <div style="max-height:70vh;overflow-y:auto;">
                <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:15px;">
                    <h3 style="color:#1a5276;margin-bottom:10px;display:flex;align-items:center;gap:8px;">
                        <span style="font-size:24px;">${topic.icon}</span>
                        <span>${content.title}</span>
                    </h3>
                </div>
                <div style="line-height:1.8;font-size:14px;white-space:pre-wrap;padding:0 5px;">
                    ${content.content}
                </div>
            </div>
            <div class="action-buttons" style="margin-top:15px;">
                <button class="btn btn-light" onclick="renderHelpCenter()">${backLabels[lang]}</button>
                <button class="btn btn-primary" onclick="closeHelpCenter()">Close</button>
            </div>
        `;
    };
    
    // Search functionality
    function handleHelpSearch(query) {
        const resultsDiv = document.getElementById('helpSearchResults');
        const mainDiv = document.getElementById('helpMainContent');
        
        if (!query || query.trim().length < 2) {
            resultsDiv.style.display = 'none';
            mainDiv.style.display = 'block';
            return;
        }
        
        mainDiv.style.display = 'none';
        resultsDiv.style.display = 'block';
        
        const q = query.toLowerCase();
        const results = [];
        
        // Search buttons
        Object.keys(HELP_CONTENT.buttons).forEach(function(key) {
            const item = HELP_CONTENT.buttons[key];
            const modal = getContent(item.modal);
            if (!modal) return;
            
            const text = (modal.title + ' ' + modal.content).toLowerCase();
            if (text.includes(q)) {
                results.push({
                    type: 'button',
                    key: key,
                    icon: modal.icon,
                    title: modal.title,
                    preview: modal.content.substring(0, 100) + '...'
                });
            }
        });
        
        // Search help center
        Object.keys(HELP_CONTENT.helpCenter).forEach(function(key) {
            const item = HELP_CONTENT.helpCenter[key];
            const content = getContent(item);
            if (!content) return;
            
            const text = (content.title + ' ' + content.content).toLowerCase();
            if (text.includes(q)) {
                results.push({
                    type: 'topic',
                    key: key,
                    icon: item.icon,
                    title: content.title,
                    preview: content.content.substring(0, 100) + '...'
                });
            }
        });
        
        // Search FAQs
        HELP_CONTENT.faqs.forEach(function(faq) {
            const question = getContent(faq.question);
            const answer = getContent(faq.answer);
            if (!question || !answer) return;
            
            const text = (question + ' ' + answer).toLowerCase();
            if (text.includes(q)) {
                results.push({
                    type: 'faq',
                    key: faq.id,
                    icon: '❓',
                    title: question,
                    preview: answer.substring(0, 100) + '...'
                });
            }
        });
        
        let html = `<div style="margin-bottom:10px;font-size:13px;color:#7f8c8d;">
            ${results.length} results found
        </div>`;
        
        if (results.length === 0) {
            html += `<div style="text-align:center;padding:30px;color:#95a5a6;">
                🔍 No results found
            </div>`;
        } else {
            results.forEach(function(r) {
                let action = '';
                if (r.type === 'button') action = `onclick="closeHelpCenter();showInfoModal('${r.key}')"`;
                else if (r.type === 'topic') action = `onclick="showHelpTopic('${r.key}')"`;
                else action = `onclick="renderHelpCenter()"`;
                
                html += `
                    <div ${action} style="
                        padding: 12px;
                        border: 1px solid #ddd;
                        border-radius: 6px;
                        margin-bottom: 8px;
                        cursor: pointer;
                        background: white;
                    ">
                        <div style="font-weight:bold;color:#2c3e50;margin-bottom:4px;">
                            ${r.icon} ${r.title}
                        </div>
                        <div style="font-size:12px;color:#7f8c8d;">
                            ${r.preview}
                        </div>
                    </div>
                `;
            });
        }
        
        resultsDiv.innerHTML = html;
    }
    
    // ==========================================
    // TIPS OF THE DAY
    // ==========================================
    
    let currentTipIndex = 0;
    
    window.showTipOfTheDay = function() {
        const prefs = getPreferences();
        if (!prefs.showTips) return;
        
        const tips = HELP_CONTENT.tips;
        const tip = tips[currentTipIndex % tips.length];
        const content = getContent(tip);
        if (!content) return;
        
        // Create modal if needed
        let modal = document.getElementById('tipsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'tipsModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal" style="max-width:450px;">
                    <div class="modal-title">
                        <span>💡 آج کا مشورہ</span>
                        <button class="modal-close" onclick="closeTipsModal()">✕</button>
                    </div>
                    <div id="tipsContent" style="line-height:1.8;font-size:14px;padding:10px 0;white-space:pre-wrap;"></div>
                    <div style="margin-top:15px;">
                        <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:#7f8c8d;">
                            <input type="checkbox" id="disableTipsCheckbox" style="width:auto;">
                            <span id="disableTipsText">آئندہ نہ دکھائیں</span>
                        </label>
                    </div>
                    <div class="action-buttons" style="margin-top:15px;">
                        <button class="btn btn-primary" onclick="nextTip()" id="nextTipBtn">⏭️ اگلا مشورہ</button>
                        <button class="btn btn-success" onclick="closeTipsModal()" id="gotItTipBtn">✅ سمجھ گیا</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        const lang = getCurrentLang();
        const labels = {
            ur: { title: '💡 آج کا مشورہ', disable: 'آئندہ نہ دکھائیں', next: '⏭️ اگلا', got: '✅ سمجھ گیا' },
            en: { title: '💡 Tip of the Day', disable: "Don't show again", next: '⏭️ Next Tip', got: '✅ Got it' },
            roman: { title: '💡 Tip of the Day', disable: "Aainda na dikhaein", next: '⏭️ Next', got: '✅ Theek hai' }
        };
        const l = labels[lang] || labels.ur;
        
        modal.querySelector('.modal-title span:first-child').textContent = l.title;
        document.getElementById('disableTipsText').textContent = l.disable;
        document.getElementById('nextTipBtn').textContent = l.next;
        document.getElementById('gotItTipBtn').textContent = l.got;
        
        document.getElementById('tipsContent').innerHTML = content;
        modal.classList.add('active');
    };
    
    window.nextTip = function() {
        currentTipIndex++;
        showTipOfTheDay();
    };
    
    window.closeTipsModal = function() {
        const modal = document.getElementById('tipsModal');
        if (!modal) return;
        
        // Check if user wants to disable
        const checkbox = document.getElementById('disableTipsCheckbox');
        if (checkbox && checkbox.checked) {
            updatePreference('showTips', false);
        }
        
        modal.classList.remove('active');
    };
    
    // ==========================================
    // KEYBOARD SHORTCUTS
    // ==========================================
    
    function handleKeyboardShortcut(e) {
        const prefs = getPreferences();
        if (!prefs.keyboardShortcuts) return;
        
        // Skip if in input/textarea
        const tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        
        // Skip if any modal is open
        if (document.querySelector('.modal-overlay.active')) {
            if (e.key === 'Escape') {
                // Close topmost modal
                const modals = document.querySelectorAll('.modal-overlay.active');
                if (modals.length > 0) {
                    modals[modals.length - 1].classList.remove('active');
                }
            }
            return;
        }
        
        const key = e.key.toLowerCase();
        
        // Shortcuts
        switch(key) {
            case '?':
            case '/':
                e.preventDefault();
                openHelpCenter();
                break;
            case 'h':
                if (typeof viewHistory === 'function') {
                    e.preventDefault();
                    viewHistory();
                }
                break;
            case 'b':
                if (typeof exportCustomData === 'function') {
                    e.preventDefault();
                    exportCustomData();
                }
                break;
            case 'n':
                e.preventDefault();
                const newBtn = document.querySelector('[data-page="newPatient"]');
                if (newBtn) newBtn.click();
                break;
            case 's':
                e.preventDefault();
                const searchBtn = document.querySelector('[data-page="searchPatient"]');
                if (searchBtn) searchBtn.click();
                break;
            case 'd':
                e.preventDefault();
                const dashBtn = document.querySelector('[data-page="dashboard"]');
                if (dashBtn) dashBtn.click();
                break;
            case 'a':
                e.preventDefault();
                const allBtn = document.querySelector('[data-page="allPatients"]');
                if (allBtn) allBtn.click();
                break;
            case 'x':
                e.preventDefault();
                const diagBtn = document.querySelector('[data-page="diagnosis"]');
                if (diagBtn) diagBtn.click();
                break;
        }
    }
    
    // ==========================================
    // PREFERENCES UI (Settings Panel)
    // ==========================================
    
    window.openPreferencesModal = function() {
        let modal = document.getElementById('preferencesModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'preferencesModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal" style="max-width:500px;">
                    <div class="modal-title">
                        <span id="prefsTitle">⚙️ ترجیحات</span>
                        <button class="modal-close" onclick="closePreferencesModal()">✕</button>
                    </div>
                    <div id="prefsContent"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            modal.addEventListener('click', function(e) {
                if (e.target === modal) closePreferencesModal();
            });
        }
        
        renderPreferences();
        modal.classList.add('active');
    };
    
    window.closePreferencesModal = function() {
        const modal = document.getElementById('preferencesModal');
        if (modal) modal.classList.remove('active');
    };
    
    function renderPreferences() {
        const prefs = getPreferences();
        const lang = getCurrentLang();
        
        const labels = {
            ur: {
                title: '⚙️ ترجیحات (Preferences)',
                tour: { name: '🎓 پہلی بار ٹور', desc: 'اگلی بار خودکار شروع ہو' },
                shortcuts: { name: '⌨️ کی بورڈ شارٹ کٹس', desc: '? = مدد، H = ہسٹری، B = بیک اپ' },
                tips: { name: '💡 آج کا مشورہ', desc: 'ہر روز نیا مشورہ دکھائے' },
                tooltips: { name: '🎨 ٹول ٹپ (Hover)', desc: 'ماؤس ہوور پر معلومات' },
                on: '✅ آن',
                off: '❌ آف',
                save: '💾 محفوظ کریں',
                reset: '🔄 ری سیٹ',
                close: 'بند کریں'
            },
            en: {
                title: '⚙️ Preferences',
                tour: { name: '🎓 First-time Tour', desc: 'Auto-start next time' },
                shortcuts: { name: '⌨️ Keyboard Shortcuts', desc: '? = Help, H = History, B = Backup' },
                tips: { name: '💡 Tip of the Day', desc: 'Show new tip daily' },
                tooltips: { name: '🎨 Tooltips (Hover)', desc: 'Info on mouse hover' },
                on: '✅ ON',
                off: '❌ OFF',
                save: '💾 Save',
                reset: '🔄 Reset',
                close: 'Close'
            },
            roman: {
                title: '⚙️ Preferences',
                tour: { name: '🎓 First-time Tour', desc: 'Auto-start next time' },
                shortcuts: { name: '⌨️ Keyboard Shortcuts', desc: '? = Help, H = History' },
                tips: { name: '💡 Tip of the Day', desc: 'Har din naya tip' },
                tooltips: { name: '🎨 Tooltips', desc: 'Hover par info' },
                on: '✅ ON',
                off: '❌ OFF',
                save: '💾 Save',
                reset: '🔄 Reset',
                close: 'Close'
            }
        };
        const l = labels[lang] || labels.ur;
        
        document.getElementById('prefsTitle').textContent = l.title;
        
        const items = [
            { key: 'showTour', label: l.tour },
            { key: 'keyboardShortcuts', label: l.shortcuts },
            { key: 'showTips', label: l.tips },
            { key: 'showTooltips', label: l.tooltips }
        ];
        
        let html = '<div style="padding:10px 0;">';
        
        items.forEach(function(item) {
            const isOn = prefs[item.key];
            html += `
                <div style="
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 12px;
                ">
                    <div style="flex:1;">
                        <div style="font-weight:bold;color:#2c3e50;margin-bottom:4px;">${item.label.name}</div>
                        <div style="font-size:12px;color:#7f8c8d;">${item.label.desc}</div>
                    </div>
                    <label style="cursor:pointer;position:relative;display:inline-block;width:60px;height:30px;">
                        <input type="checkbox" 
                            ${isOn ? 'checked' : ''} 
                            onchange="togglePreference('${item.key}', this.checked)"
                            style="opacity:0;width:0;height:0;">
                        <span style="
                            position:absolute;
                            cursor:pointer;
                            top:0;left:0;right:0;bottom:0;
                            background:${isOn ? '#27ae60' : '#95a5a6'};
                            border-radius:34px;
                            transition:0.3s;
                        ">
                            <span style="
                                position:absolute;
                                content:'';
                                height:24px;
                                width:24px;
                                left:${isOn ? '33px' : '3px'};
                                bottom:3px;
                                background:white;
                                border-radius:50%;
                                transition:0.3s;
                            "></span>
                        </span>
                    </label>
                </div>
            `;
        });
        
        html += `
            </div>
            <div class="action-buttons" style="margin-top:15px;">
                <button class="btn btn-warning btn-sm" onclick="resetPreferences()">${l.reset}</button>
                <button class="btn btn-primary" onclick="closePreferencesModal()">${l.close}</button>
            </div>
        `;
        
        document.getElementById('prefsContent').innerHTML = html;
    }
    
    window.togglePreference = function(key, value) {
        updatePreference(key, value);
        setTimeout(renderPreferences, 100);
        
        if (typeof showToast === 'function') {
            const lang = getCurrentLang();
            const msgs = {
                ur: value ? '✅ آن کر دیا' : '❌ آف کر دیا',
                en: value ? '✅ Enabled' : '❌ Disabled',
                roman: value ? '✅ Enabled' : '❌ Disabled'
            };
            showToast(msgs[lang]);
        }
    };
    
    window.resetPreferences = function() {
        const lang = getCurrentLang();
        const msgs = {
            ur: 'کیا سب preferences default پر ری سیٹ کریں؟',
            en: 'Reset all preferences to default?',
            roman: 'Sab preferences default par reset karein?'
        };
        
        if (typeof showConfirm === 'function') {
            showConfirm(msgs[lang] || msgs.ur, function() {
                localStorage.removeItem('help_preferences');
                if (typeof showToast === 'function') {
                    showToast('✅ Reset done');
                }
                renderPreferences();
            });
        } else {
            if (confirm(msgs[lang] || msgs.ur)) {
                localStorage.removeItem('help_preferences');
                renderPreferences();
            }
        }
    };
    
    // ==========================================
    // ADD HELP BUTTON TO HEADER
    // ==========================================
    
    function addHelpButtonToHeader() {
        const header = document.querySelector('.header-right');
        if (!header) return;
        
        // Check if already exists
        if (document.getElementById('helpCenterBtn')) return;
        
        const helpBtn = document.createElement('button');
        helpBtn.id = 'helpCenterBtn';
        helpBtn.className = 'icon-btn';
        helpBtn.title = 'Help Center (?)';
        helpBtn.innerHTML = '❓';
        helpBtn.style.background = 'rgba(52,152,219,0.4)';
        helpBtn.onclick = openHelpCenter;
        
        // Insert before backup button
        const backupBtn = document.getElementById('backupBtn');
        if (backupBtn) {
            header.insertBefore(helpBtn, backupBtn);
        } else {
            header.appendChild(helpBtn);
        }
    }
    
    // ==========================================
    // INITIALIZATION
    // ==========================================
    
    function initialize() {
        console.log('🚀 Initializing Help System...');
        
        // Add keyboard shortcuts listener
        document.addEventListener('keydown', handleKeyboardShortcut);
        
        // Add help button to header
        setTimeout(addHelpButtonToHeader, 2000);
        
        // Watch for settings page
        watchForSettingsPage();
        
        // Watch for language changes
        watchLanguageChanges();
        
        // Fix labels initially
        setTimeout(fixSettingsLabels, 1500);
        
        // Show welcome tour if first time
        setTimeout(function() {
            const prefs = getPreferences();
            if (prefs.showTour && !prefs.tourCompleted) {
                showTourWelcome();
            }
        }, 3000);
        
        // Show tip of the day (30% chance)
        setTimeout(function() {
            const prefs = getPreferences();
            if (prefs.showTips && prefs.tourCompleted) {
                const lastTip = localStorage.getItem('last_tip_date');
                const today = new Date().toDateString();
                if (lastTip !== today && Math.random() < 0.3) {
                    localStorage.setItem('last_tip_date', today);
                    showTipOfTheDay();
                }
            }
        }, 5000);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        setTimeout(initialize, 500);
    }
    
    console.log('✅ Help System Functions Part 2 loaded (Tour + Help Center + Shortcuts)');
    console.log('✅ Complete Help System Ready!');

})();

})();

