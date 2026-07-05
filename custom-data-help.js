// ==========================================
// Bismillah Clinic - Help System v3
// Complete Fixed Version
// ==========================================

// ==========================================
// Bismillah Clinic - Help System v3
// Fixed: Functions defined at global scope
// ==========================================

(function() {

    // ==========================================
    // ALL CONTENT
    // ==========================================
    var HELP_CONTENT = {
        buttons: {
            category: {
                tooltip: { ur: 'نئی کیٹگری بنائیں', en: 'Add new category', roman: 'Nayi Category banayen' },
                modal: {
                    ur: { title: 'کیٹگری کے بارے میں', icon: '🏷️', content: 'کیٹگری ایک "خانہ" ہوتا ہے جس میں بیماریوں کو ترتیب سے رکھا جاتا ہے۔\n\n<b>مثال:</b>\nکیٹگری: "دل کی بیماریاں" 💗\n• ہارٹ اٹیک\n• انجائنا\n• کولیسٹرول\n\n<b>کب استعمال کریں:</b>\nجب کوئی نئی "ترتیب" بنانی ہو۔\n\n<b>فائدہ:</b>\nتشخیصی صفحے پر ٹیبز بنیں گے۔' },
                    en: { title: 'About Category', icon: '🏷️', content: 'A Category is a group used to organize related diseases.\n\n<b>Example:</b>\nCategory: "Heart Care" 💗\n• Heart Attack\n• Angina\n\n<b>When to use:</b>\nWhen creating a new grouping.' },
                    roman: { title: 'Category ke baray mein', icon: '🏷️', content: 'Category ek khaana hai jis mein bemariyon ko tarteeb se rakha jata hai.\n\n<b>Misaal:</b>\n"Dil ki Bemariyan" 💗\n• Heart Attack\n• Angina\n\n<b>Kab istemal karein:</b>\nJab koi nayi tarteeb banani ho.' }
                }
            },
            symptom: {
                tooltip: { ur: 'نئی علامت شامل کریں', en: 'Add new symptom', roman: 'Nayi alamat' },
                modal: {
                    ur: { title: 'علامت کے بارے میں', icon: '💡', content: 'علامت مریض کی "شکایت" ہوتی ہے۔\n\n<b>مثالیں:</b>\n• سر درد\n• بخار\n• کھانسی\n\n<b>⚠️ خطرناک علامت:</b>\nخطرناک ہو تو "خطرناک علامت" پر ٹک لگا دیں۔' },
                    en: { title: 'About Symptom', icon: '💡', content: 'A Symptom is a patient complaint.\n\n<b>Examples:</b>\n• Headache\n• Fever\n• Cough' },
                    roman: { title: 'Alamat ke baray mein', icon: '💡', content: 'Alamat mareez ki shikayat hoti hai.\n\n<b>Misaalein:</b>\n• Sar dard\n• Bukhar\n• Khansi\n\n<b>⚠️ Khatarnak alamat:</b>\nKhatarnak ho to tick laga dein.' }
                }
            },
            disease: {
                tooltip: { ur: 'نئی بیماری کا پروٹوکول', en: 'Add complete disease', roman: 'Nayi bimari' },
                modal: {
                    ur: { title: 'بیماری کے بارے میں', icon: '🔬', content: 'بیماری میں مکمل معلومات شامل ہوتی ہیں:\n\n✓ نام (3 زبانوں میں)\n✓ آئکن\n✓ کیٹگری\n✓ علامات\n✓ اہم علامات\n✓ ٹیسٹ\n✓ خطرے کی علامات\n✓ ادویات\n✓ مشورہ' },
                    en: { title: 'About Disease', icon: '🔬', content: 'A Disease contains complete protocol:\n\n✓ Name\n✓ Icon\n✓ Category\n✓ Symptoms\n✓ Tests\n✓ Remedies\n✓ Advice' },
                    roman: { title: 'Bimari ke baray mein', icon: '🔬', content: 'Bimari mein mukammal maloomat shamil hoti hain:\\n\\n✓ Naam (3 zabanon mein)\\n✓ Icon\\n✓ Category\\n✓ Alamaat\\n✓ Ahem alamaat\\n✓ Test\\n✓ Khatre ki alamaat\\n✓ Adwiyaat\\n✓ Mashwara' }
                }
            },
            view_edit_delete: {
                tooltip: { ur: 'سب کسٹم ڈیٹا منظم کریں', en: 'Manage all custom data', roman: 'Sab data manage' },
                modal: {
                    ur: { title: 'دیکھیں / ایڈٹ / ڈیلیٹ', icon: '📋', content: 'یہاں سے آپ کر سکتے ہیں:\n\n✏️ <b>ایڈٹ</b> - تبدیلی\n🗑️ <b>ڈیلیٹ</b> - مٹا دیں\n✅ <b>پروموٹ</b> - "گٹ ہب پر add کر دی"\n↩️ <b>ان پروموٹ</b> - نشان واپس\n\n<b>Badges:</b>\n🆕 New = ابھی کلاؤڈ پر\n✅ GitHub = پروموٹ ہو گئی' },
                    en: { title: 'View / Edit / Delete', icon: '📋', content: '✏️ Edit modify\n🗑️ Delete\n✅ Promote (added to GitHub)\n↩️ Unpromote\n\n🆕 New = only cloud\n✅ GitHub = promoted' },
                    roman: { title: 'Dekhein / Edit / Delete', icon: '📋', content: 'Yahan se aap kar sakte hain:\\n\\n✏️ <b>Edit</b> - tabdeeli\\n🗑️ <b>Delete</b> - mita dein\\n✅ <b>Promote</b> - GitHub par add kar di\\n↩️ <b>Unpromote</b> - nishan wapas\\n\\n<b>Badges:</b>\\n🆕 Naya = abhi cloud par\\n✅ GitHub = promote ho gayi' }
                }
            },
            history: {
                tooltip: { ur: 'تمام تبدیلیوں کا ریکارڈ', en: 'Log of all changes', roman: 'Record' },
                modal: {
                    ur: { title: 'ہسٹری', icon: '📚', content: 'ہسٹری لاگ میں نظر آئے گا:\n\n➕ Add\n✏️ Edit\n🗑️ Delete\n✅ Promote\n\nہر entry کے ساتھ تاریخ اور یوزر۔' },
                    en: { title: 'History Log', icon: '📚', content: 'Shows all changes with timestamps.' },
                    roman: { title: 'History Log', icon: '📚', content: 'History log mein nazar aaye ga:\\n\\n➕ Shamil\\n✏️ Tarmeemi\\n🗑️ Delete\\n✅ Promote\\n\\nHar entry ke saath taareekh aur user.' }
                }
            },
            import: {
                tooltip: { ur: 'فائل سے ڈیٹا لائیں', en: 'Import data from file', roman: 'File se data' },
                modal: {
                    ur: { title: 'امپورٹ', icon: '📥', content: '<b>2 قسم کی فائلیں:</b>\n\n1️⃣ .json فائل - بیک اپ سے\n2️⃣ .csv فائل - ایکسل ٹیبل\n\n<b>استعمالات:</b>\n📱 دوسرے ڈاکٹر سے\n💾 بیک اپ ریسٹور\n📊 بلک امپورٹ' },
                    en: { title: 'Import', icon: '📥', content: 'Import .json or .csv files.\n\n📱 From another doctor\n💾 Restore backup\n📊 Bulk import' },
                    roman: { title: 'Import', icon: '📥', content: '<b>2 qism ki files:</b>\\n\\n1️⃣ .json file - backup se\\n2️⃣ .csv file - Excel table\\n\\n<b>Istemaalaat:</b>\\n📱 Doosre doctor se\\n💾 Backup restore\\n📊 Bulk import' }
                }
            },
            full_backup: {
                tooltip: { ur: 'سب کچھ محفوظ کریں', en: 'Save everything', roman: 'Sab save' },
                modal: {
                    ur: { title: 'مکمل بیک اپ', icon: '📦', content: 'شامل ہوگا:\n✅ سب کیٹگریز\n✅ سب علامات\n✅ سب بیماریاں\n✅ Promoted + New\n\n<b>کب لیں:</b>\nمہینے میں ایک بار' },
                    en: { title: 'Full Backup', icon: '📦', content: 'All Categories, Symptoms, Diseases\n\nUse monthly.' },
                    roman: { title: 'Mukammal Backup', icon: '📦', content: 'Shamil hoga:\\n✅ Sab categories\\n✅ Sab alamaat\\n✅ Sab bimariyan\\n✅ Promoted + Nayi\\n\\n<b>Kab lein:</b>\\nMaheenay mein ek baar' }
                }
            },
            only_new_backup: {
                tooltip: { ur: 'صرف نئی چیزیں', en: 'Only new items', roman: 'Sirf nayi' },
                modal: {
                    ur: { title: 'صرف نئی بیک اپ', icon: '🆕', content: 'صرف <b>ان پروموٹڈ</b> چیزیں۔\n\n<b>کیوں مفید:</b>\n🎯 گٹ ہب سے پہلے\n🚫 ڈپلیکیٹ سے بچاؤ\n📉 چھوٹی فائل\n\n<b>کب:</b> ہر ہفتے' },
                    en: { title: 'Only New Backup', icon: '🆕', content: 'Only unpromoted items.\n\nBefore GitHub push.\nWeekly.' },
                    roman: { title: 'Sirf Nayi Backup', icon: '🆕', content: 'Sirf <b>un-promoted</b> cheezein.\\n\\n<b>Kyun mufeed:</b>\\n🎯 GitHub se pehle\\n🚫 Duplicate se bachao\\n📉 Chhoti file\\n\\n<b>Kab:</b> Har hafte' }
                }
            },
            export_github: {
                tooltip: { ur: 'گٹ ہب کا کوڈ', en: 'GitHub code', roman: 'GitHub code' },
                modal: {
                    ur: { title: 'گٹ ہب کے لیے ایکسپورٹ', icon: '📝', content: '<b>diagnosis-data.js کے لیے کوڈ</b>\n\n<b>مراحل:</b>\n1. بٹن دبائیں\n2. .txt ڈاؤن لوڈ\n3. گٹ ہب پر پیسٹ\n4. Push کریں\n5. ایپ میں "✅" دبائیں\n\n💡 مائیگریشن وزرڈ آسان!' },
                    en: { title: 'Export for GitHub', icon: '📝', content: 'Code ready for diagnosis-data.js\n\n1. Click button\n2. Download .txt\n3. Paste on GitHub\n4. Push\n5. Mark promoted' },
                    roman: { title: 'GitHub Export', icon: '📝', content: '<b>diagnosis-data.js ke liye code</b>\\n\\n<b>Marahil:</b>\\n1. Button dabayein\\n2. .txt download\\n3. GitHub par paste\\n4. Push karein\\n5. App mein ✅ dabayein\\n\\n💡 Migration Wizard aasaan!' }
                }
            },
            migration_wizard: {
                tooltip: { ur: 'مرحلہ وار رہنمائی', en: 'Step-by-step guide', roman: 'Guide' },
                modal: {
                    ur: { title: 'مائیگریشن وزرڈ', icon: '🚀', content: '⭐ <b>نئے صارفین کے لیے بہترین!</b>\n\n<b>مراحل:</b>\n1️⃣ چیزوں کی گنتی\n2️⃣ ایکسپورٹ فائل\n3️⃣ ہدایات\n4️⃣ تصدیق\n\n<b>مہینے میں ایک بار!</b>' },
                    en: { title: 'Migration Wizard', icon: '🚀', content: '⭐ Best for beginners!\n\n1. Count items\n2. Export file\n3. Instructions\n4. Confirmation\n\nMonthly!' },
                    roman: { title: 'Migration Wizard', icon: '🚀', content: '⭐ <b>Naye users ke liye behtareen!</b>\n\n<b>Marahil:</b>\n1️⃣ Cheezon ki ginti\n2️⃣ Export file\n3️⃣ Hidayaat\n4️⃣ Tasdeeq\n\n<b>Maheenay mein ek baar!</b>' }
                }
            },
            cleanup: {
                tooltip: { ur: 'پروموٹڈ چیزیں مٹائیں', en: 'Delete promoted', roman: 'Cleanup' },
                modal: {
                    ur: { title: 'پروموٹڈ صفائی', icon: '🧹', content: '⚠️ <b>احتیاط:</b> صرف Promoted مٹے گی!\n\n✅ Promoted (✅) = ڈیلیٹ\n❌ New (🆕) = محفوظ\n\n<b>کب:</b>\nگٹ ہب push کے بعد\n"✅" مارک کے بعد' },
                    en: { title: 'Cleanup Promoted', icon: '🧹', content: '⚠️ Only Promoted deleted!\n✅ Promoted = Deleted\n❌ New = Safe' },
                    roman: { title: 'Promoted Saaf Karein', icon: '🧹', content: '⚠️ <b>Ehtiyaat:</b> Sirf Promoted mite gi!\\n\\n✅ Promoted (✅) = Delete\\n❌ Nayi (🆕) = Mehfooz\\n\\n<b>Kab:</b>\\nGitHub push ke baad\\n"✅" mark ke baad' }
                }
            },
            sync: {
                tooltip: { ur: 'کلاؤڈ سے تازہ ڈیٹا', en: 'Fetch fresh data', roman: 'Fresh data' },
                modal: {
                    ur: { title: 'سنک', icon: '☁️', content: 'کلاؤڈ سے تازہ ڈیٹا۔\n\n<b>کب دبائیں:</b>\n✅ دوسرے ڈیوائس پر کچھ کیا\n✅ ڈیٹا update نہیں ہو رہا\n\n<b>خودکار:</b> ہر 30 seconds' },
                    en: { title: 'Sync', icon: '☁️', content: 'Fetch latest from cloud.\n\nAuto every 30 seconds.' },
                    roman: { title: 'Sync', icon: '☁️', content: 'Cloud se taaza data.\\n\\n<b>Kab dabayein:</b>\\n✅ Doosre device par kuch kiya\\n✅ Data update nahi ho raha\\n\\n<b>Khudkar:</b> Har 30 seconds' }
                }
            }
        },
        tour: {
            welcome: {
                ur: { title: '🎉 خوش آمدید!', heading: 'بسم اللہ ہومیوپیتھک کلینک', content: 'کیا آپ چاہتے ہیں میں آپ کو پوری ایپ سکھاؤں؟\n\n✅ مکمل رہنمائی\n⏱️ 5-7 منٹ\n🎯 10 مراحل' },
                en: { title: '🎉 Welcome!', heading: 'Bismillah Homeopathic Clinic', content: 'Would you like a complete tour?\n\n✅ Full guidance\n⏱️ 5-7 min\n🎯 10 steps' },
                roman: { title: '🎉 Khush Aamdeed!', heading: 'Bismillah Homeopathic Clinic', content: 'Kya aap chahte hain app ka tour lein?\n\n✅ Mukammal rahnumai\n⏱️ 5-7 minute\n🎯 10 marahil' }
            },
            steps: [
                { content: {
                    ur: { title: '🏥 ایپ کا تعارف', body: 'یہ ایپ آپ کے کلینک کے لیے:\n\n✅ مریضوں کا ریکارڈ\n✅ ملاقاتیں محفوظ\n✅ خاندانی نظام\n✅ تشخیصی مدد (150+)\n✅ کلاؤڈ سنک\n✅ آفلائن کام' },
                    en: { title: '🏥 App Intro', body: 'This app for your clinic:\n\n✅ Patient records\n✅ Consultations\n✅ Family system\n✅ Diagnosis (150+)\n✅ Cloud sync\n✅ Offline' },
                    roman: { title: '🏥 App ka Taaruf', body: 'Yeh app aap ke clinic ke liye:\n\n✅ Mareezon ka record\n✅ Mulaqatein mehfooz\n✅ Khandani nizam\n✅ Tashkheesi madad (150+)\n✅ Cloud sync\n✅ Offline kaam' }
                }},
                { content: {
                    ur: { title: '🔓 لاگ ان', body: '<b>لاگ ان:</b>\n1. Username لکھیں\n2. Password لکھیں\n3. لاگ ان دبائیں\n\n<b>💡 مجھے یاد رکھیں:</b>\n30 دن تک خودکار\n\n<b>Demo:</b> doctor / 1234' },
                    en: { title: '🔓 Login', body: '<b>Login:</b>\n1. Username\n2. Password\n3. Click Login\n\n<b>Remember Me:</b>\n30 days auto-login\n\nDemo: doctor / 1234' },
                    roman: { title: '🔓 Login', body: '<b>Login:</b>\n1. Username likhein\n2. Password likhein\n3. Login dabayein\n\n<b>💡 Yaad Rakhein:</b> 30 din tak khudkar\n\n<b>Demo:</b> doctor / 1234' }
                }},
                { content: {
                    ur: { title: '🌐 زبان بدلیں', body: 'اوپر right میں 🌐 بٹن\n\nکلک سے:\n🇵🇰 اردو → 🇬🇧 English → 🔤 Roman\n\n<b>💡 آپ کی پسند یاد رہے گی!</b>' },
                    en: { title: '🌐 Language', body: '🌐 button top right\n\nClick to change:\n🇵🇰 Urdu → 🇬🇧 English → 🔤 Roman\n\nPreference saved!' },
                    roman: { title: '🌐 Zaban Badlein', body: '🌐 button upar right mein\n\nClick se:\n🇵🇰 Urdu → 🇬🇧 English → 🔤 Roman\n\n<b>💡 Aap ki pasand yaad rahe gi!</b>' }
                }},
                { content: {
                    ur: { title: '🏠 ڈیش بورڈ', body: '<b>4 Statistics:</b>\n📅 آج کے مریض\n📊 کل مریض\n📆 اس ماہ\n🔄 فالو اپ\n\n<b>آج کی سرگرمی:</b>\nآج کے تمام مریض\n\n💡 نام پر کلک = تفصیل' },
                    en: { title: '🏠 Dashboard', body: '<b>4 Stats:</b>\n📅 Today\n📊 Total\n📆 Month\n🔄 Follow-ups\n\nClick patient for details.' },
                    roman: { title: '🏠 Dashboard', body: '<b>4 Statistics:</b>\\n📅 Aaj ke mareez\\n📊 Kul mareez\\n📆 Is maah\\n🔄 Follow-up\\n\\n<b>Aaj ki activity:</b>\\nAaj ke tamam mareez\\n\\n💡 Naam par click = tafseel' }
                }},
                { content: {
                    ur: { title: '➕ نئی رجسٹریشن', body: '<b>2 حصے:</b>\n\n<b>1. مریض کی معلومات:</b>\n• نام (لازمی)\n• فون (لازمی)\n• عمر، جنس، فیملی\n\n<b>2. پہلی ملاقات:</b>\n• Vitals\n• علامات\n• تشخیص\n• نسخہ' },
                    en: { title: '➕ New Registration', body: '<b>2 sections:</b>\n\n<b>1. Patient Info:</b>\nName + Phone required\n\n<b>2. First Visit:</b>\nVitals, Symptoms, Diagnosis' },
                    roman: { title: '➕ Nayi Registration', body: '<b>2 hisse:</b>\\n\\n<b>1. Mareez ki maloomaat:</b>\\n• Naam (lazmi)\\n• Phone (lazmi)\\n• Umar, jins, family\\n\\n<b>2. Pehli mulaqat:</b>\\n• Vitals\\n• Alamaat\\n• Tashkhees\\n• Nuskha' }
                }},
                { content: {
                    ur: { title: '🔍 تلاش', body: '<b>تلاش کر سکتے ہیں:</b>\n✅ نام سے\n✅ فون سے\n✅ حوالہ نمبر\n✅ فیملی نمبر\n\n<b>💡 فوری Results!</b>' },
                    en: { title: '🔍 Search', body: '<b>Search by:</b>\n✅ Name\n✅ Phone\n✅ Reference\n✅ Family No\n\nInstant results!' },
                    roman: { title: '🔍 Talash', body: '<b>Talash kar sakte hain:</b>\\n✅ Naam se\\n✅ Phone se\\n✅ Hawala number\\n✅ Family number\\n\\n<b>💡 Fori Results!</b>' }
                }},
                { content: {
                    ur: { title: '📋 تمام مریض', body: '<b>مکمل فہرست:</b>\n• حوالہ، نام، عمر، فون\n• فیملی، فالو اپ\n\n<b>Actions:</b>\n👁️ دیکھیں\n✏️ ایڈٹ\n🗑️ ڈیلیٹ' },
                    en: { title: '📋 All Patients', body: '<b>Complete list</b>\n\n<b>Actions:</b>\n👁️ View\n✏️ Edit\n🗑️ Delete' },
                    roman: { title: '📋 Tamam Mareez', body: '<b>Mukammal fehrist:</b>\\n• Hawala, naam, umar, phone\\n• Family, follow-up\\n\\n<b>Actions:</b>\\n👁️ Dekhein\\n✏️ Edit\\n🗑️ Delete' }
                }},
                { content: {
                    ur: { title: '👨‍👩‍👧‍👦 فیملی نظام', body: '<b>✨ خودکار پہچان!</b>\n\nSame phone = same family\n\n<b>Format:</b> F-001, F-002...\n\n<b>فوائد:</b>\n✅ فیملی اکٹھی\n✅ خاندانی تاریخ' },
                    en: { title: '👨‍👩‍👧‍👦 Family', body: '<b>Auto Detection!</b>\n\nSame phone = same family\n\nFormat: F-001, F-002...' },
                    roman: { title: '👨‍👩‍👧‍👦 Family Nizam', body: '<b>✨ Khudkar pehchaan!</b>\\n\\nSame phone = same family\\n\\n<b>Format:</b> F-001, F-002...\\n\\n<b>Fawaid:</b>\\n✅ Family ikattha\\n✅ Khandani taareekh' }
                }},
                { content: {
                    ur: { title: '🔬 تشخیص', body: '<b>✨ AI طرز تشخیص!</b>\n\n<b>3 مراحل:</b>\n1️⃣ کیٹگری\n2️⃣ علامات ☑️\n3️⃣ "تشخیص کریں"\n\n<b>نتائج:</b>\nMatch %, Tests, Remedies' },
                    en: { title: '🔬 Diagnosis', body: '<b>AI-style!</b>\n\n<b>3 steps:</b>\n1. Category\n2. Symptoms\n3. Analyze\n\nResults with match %' },
                    roman: { title: '🔬 Tashkhees', body: '<b>✨ AI taraz tashkhees!</b>\\n\\n<b>3 marahil:</b>\\n1️⃣ Category\\n2️⃣ Alamaat ☑️\\n3️⃣ "Tashkhees Karein"\\n\\n<b>Nataij:</b>\\nMatch %, Tests, Adwiyaat' }
                }},
                { content: {
                    ur: { title: '⚙️ سیٹنگز', body: '<b>🎯 مرکزی کنٹرول:</b>\n\n🏷️ کسٹم ڈیٹا\n☁️ کلاؤڈ سنک\n💾 بیک اپ\n📝 گٹ ہب\n📚 ہسٹری\n\n<b>🎉 مبارک ہو!</b>\n\nٹور مکمل! مدد کے لیے ❓ بٹن' },
                    en: { title: '⚙️ Settings', body: '<b>Control Panel:</b>\n\n🏷️ Custom Data\n☁️ Cloud Sync\n💾 Backup\n📝 GitHub\n📚 History\n\n<b>🎉 Congratulations!</b>' },
                    roman: { title: '⚙️ Settings', body: '<b>🎯 Markazi control:</b>\n\n🏷️ Custom Data\n☁️ Cloud Sync\n💾 Backup\n📝 GitHub\n📚 History\n\n<b>🎉 Mubarak ho!</b>\n\nTour mukammal!' }
                }}
            ]
        },
        helpCenter: {
            login: { icon: '🔓',
                ur: { title: 'لاگ ان', content: 'Username, Password لکھیں۔\nDemo: doctor / 1234\n\n"مجھے یاد رکھیں" = 30 دن' },
                en: { title: 'Login', content: 'Username, Password.\nDemo: doctor / 1234\n\nRemember Me = 30 days' },
                roman: { title: 'Login', content: 'Username, Password likhein.\nDemo: doctor / 1234\n\n"Yaad Rakhein" = 30 din' }
            },
            dashboard: { icon: '🏠',
                ur: { title: 'ڈیش بورڈ', content: '4 Statistics + آج کی سرگرمی\nClick patient = details' },
                en: { title: 'Dashboard', content: '4 stats + today activity' },
                roman: { title: 'Dashboard', content: '4 Statistics + aaj ki activity\\nMareez par click = tafseel' }
            },
            registration: { icon: '➕',
                ur: { title: 'نئی رجسٹریشن', content: '2 حصے:\n1. مریض کی معلومات\n2. پہلی ملاقات\n\nAuto family detection!' },
                en: { title: 'Registration', content: '2 sections: Info + Visit\nAuto family detection' },
                roman: { title: 'Nayi Registration', content: '2 hisse:\\n1. Mareez ki maloomaat\\n2. Pehli mulaqat\\n\\nKhudkar family pehchaan!' }
            },
            search: { icon: '🔍',
                ur: { title: 'تلاش', content: 'نام، فون، حوالہ، فیملی سے تلاش\nفوری Results!' },
                en: { title: 'Search', content: 'By Name, Phone, Ref, Family\nInstant!' },
                roman: { title: 'Talash', content: 'Naam, phone, hawala, family se talash\\nFori nataij!' }
            },
            family_system: { icon: '👨‍👩‍👧‍👦',
                ur: { title: 'فیملی سسٹم', content: 'خودکار پہچان: same phone = same family\nFormat: F-001, F-002...\n\nفوائد:\n✅ فیملی اکٹھی\n✅ خاندانی تاریخ' },
                en: { title: 'Family System', content: 'Auto: same phone = same family\nFormat: F-001, F-002' },
                roman: { title: 'Family Nizam', content: 'Khudkar pehchaan: same phone = same family\\nFormat: F-001, F-002...\\n\\nFawaid:\\n✅ Family ikattha\\n✅ Khandani taareekh' }
            },
            diagnosis_help: { icon: '🔬',
                ur: { title: 'تشخیص', content: '150+ بیماریاں\n\n3 مراحل:\n1. کیٹگری\n2. علامات\n3. تشخیص کریں\n\nنتائج: Match %, Tests, Remedies' },
                en: { title: 'Diagnosis', content: '150+ diseases\n\n3 steps: Category, Symptoms, Analyze\nResults with match %' },
                roman: { title: 'Tashkhees', content: '150+ bimariyan\\n\\n3 marahil:\\n1. Category\\n2. Alamaat\\n3. Tashkhees karein\\n\\nNataij: Match %, Tests, Adwiyaat' }
            },
            cloud_sync: { icon: '☁️',
                ur: { title: 'کلاؤڈ سنک', content: 'خودکار محفوظ\nReal-time sync\n\nAuto sync: ہر 30 seconds\n\nآفلائن: local save + پھر sync' },
                en: { title: 'Cloud Sync', content: 'Auto save, real-time\n30 seconds\n\nOffline: local + later sync' },
                roman: { title: 'Cloud Sync', content: 'Khudkar mehfooz\\nReal-time sync\\n\\nKhudkar sync: har 30 seconds\\n\\nOffline: local save + phir sync' }
            },
            backup_system: { icon: '💾',
                ur: { title: 'بیک اپ', content: '3 Layers:\n1. Cloud\n2. JSON Backup\n3. GitHub\n\nFull: مہینے میں\nOnly New: ہفتے میں' },
                en: { title: 'Backup', content: '3 layers: Cloud, JSON, GitHub\nFull monthly, Only New weekly' },
                roman: { title: 'Backup', content: '3 Layers:\\n1. Cloud\\n2. JSON Backup\\n3. GitHub\\n\\nMukammal: maheenay mein\\nSirf nayi: hafte mein' }
            },
            offline_mode: { icon: '📱',
                ur: { title: 'آفلائن', content: 'سب کچھ آفلائن کام\n\nData local save\nOnline aane par auto sync\n\nData کبھی نہیں کھوئے گا!' },
                en: { title: 'Offline', content: 'Everything works offline\nAuto sync when online' },
                roman: { title: 'Offline', content: 'Sab kuch offline kaam karta hai\\n\\nData local save\\nOnline aane par khudkar sync\\n\\nData kabhi nahi khoye ga!' }
            }
        },
        faqs: [
            { question: { ur: 'کیا آفلائن کام کرے گی؟', en: 'Works offline?', roman: 'Kya offline kaam kare gi?' },
              answer: { ur: '✅ ہاں! سب کچھ آفلائن کام کرے گا۔ Internet آنے پر خودکار sync!', en: '✅ Yes! Everything works offline. Auto-sync when online!', roman: '✅ Han! Sab kuch offline kaam kare ga. Internet aane par khudkar sync!' }},
            { question: { ur: 'ڈیٹا کھو سکتا ہے؟', en: 'Can lose data?', roman: 'Kya data kho sakta hai?' },
              answer: { ur: '❌ نہیں! 3 Layer Protection:\n1. Cloud\n2. Local\n3. GitHub', en: '❌ No! 3-Layer Protection: Cloud, Local, GitHub', roman: '❌ Nahi! 3 Layer Hifazat:\\n1. Cloud\\n2. Local\\n3. GitHub' }},
            { question: { ur: 'موبائل + ڈیسک ٹاپ دونوں پر؟', en: 'Mobile + desktop?', roman: 'Mobile aur desktop dono par?' },
              answer: { ur: '✅ ہاں! خودکار sync، دونوں پر ایک ڈیٹا', en: '✅ Yes! Auto-sync, same data', roman: '✅ Han! Khudkar sync, dono par ek data' }},
            { question: { ur: 'فیملی نمبر کیسے دیں؟', en: 'How to assign family number?', roman: 'Family number kaise dein?' },
              answer: { ur: '3 طریقے:\n1. خود لکھیں (F-001)\n2. خالی چھوڑیں\n3. خودکار (same phone)', en: '3 ways: 1. Enter, 2. Blank, 3. Auto', roman: '3 tarikay:\\n1. Khud likhein (F-001)\\n2. Khali chhorein\\n3. Khudkar (same phone)' }},
            { question: { ur: 'پروموٹ کا مطلب؟', en: 'What is Promote?', roman: 'Promote ka matlab?' },
              answer: { ur: 'پروموٹ = "میں نے یہ گٹ ہب پر add کر دی"\nNext backup میں شامل نہیں ہوگی', en: 'Promote = "Added to GitHub"\nExcluded from next backup', roman: 'Promote = "Maine yeh GitHub par add kar di"\\nAgle backup mein shamil nahi hogi' }},
            { question: { ur: 'بیک اپ کب لیں؟', en: 'When to backup?', roman: 'Backup kab lein?' },
              answer: { ur: 'ہفتہ وار: صرف نئی\nمہینہ وار: مکمل\nGoogle Drive پر محفوظ کریں', en: 'Weekly: Only New\nMonthly: Full\nSave on Google Drive', roman: 'Hafta waar: Sirf nayi\\nMaheena waar: Mukammal\\nGoogle Drive par mehfooz karein' }}
        ],
        tips: [
            { ur: '💡 <b>مائیگریشن وزرڈ استعمال کریں!</b>\nگٹ ہب پر بھیجنے کے لیے آسان ترین', en: '💡 <b>Use Migration Wizard!</b>\nEasiest for GitHub push', roman: '💡 <b>Migration Wizard istemal karein!</b>\\nGitHub par bhejne ke liye aasaan tareen' },
            { ur: '💡 <b>ہفتہ وار بیک اپ!</b>\nہر اتوار "🆕 صرف نئی"', en: '💡 <b>Weekly Backup!</b>\nSunday: Only New', roman: '💡 <b>Hafta waar backup!</b>\\nHar itwaar "🆕 Sirf Nayi"' },
            { ur: '💡 <b>فیملی نمبر خالی چھوڑیں!</b>\nخودکار پہچان ہو جائے گی', en: '💡 <b>Leave Family No blank!</b>\nAuto-detects', roman: '💡 <b>Family number khali chhorein!</b>\\nKhudkar pehchaan ho jaye gi' },
            { ur: '💡 <b>Copy to Visit!</b>\nتشخیص → مریض میں خودکار fill', en: '💡 <b>Copy to Visit!</b>\nDiagnosis → auto fill', roman: '💡 <b>Visit mein copy karein!</b>\\nTashkhees → mareez mein khudkar fill' },
            { ur: '💡 <b>Cleanup ضرور کریں!</b>\nگٹ ہب push کے بعد', en: '💡 <b>Always Cleanup!</b>\nAfter GitHub push', roman: '💡 <b>Cleanup zaroor karein!</b>\\nGitHub push ke baad' }
        ],
        shortcuts: {
            ur: { title: '⌓ کی بورڈ شارٹ کٹس', note: '💡 سیٹنگز سے آن/آف',
                items: [{ key: '?', action: 'مدد سینٹر' },{ key: 'H', action: 'ہسٹری' },{ key: 'B', action: 'بیک اپ' },{ key: 'N', action: 'نئی رجسٹریشن' },{ key: 'S', action: 'تلاش' },{ key: 'D', action: 'ڈیش بورڈ' },{ key: 'A', action: 'تمام مریض' },{ key: 'X', action: 'تشخیص' },{ key: 'Esc', action: 'بند' }] },
            en: { title: '⌨️ Keyboard Shortcuts', note: '💡 Toggle in Settings',
                items: [{ key: '?', action: 'Help Center' },{ key: 'H', action: 'History' },{ key: 'B', action: 'Backup' },{ key: 'N', action: 'New Registration' },{ key: 'S', action: 'Search' },{ key: 'D', action: 'Dashboard' },{ key: 'A', action: 'All Patients' },{ key: 'X', action: 'Diagnosis' },{ key: 'Esc', action: 'Close' }] },
            roman: { title: '⌨️ Shortcuts', note: '💡 Settings se on/off karein',
                items: [{ key: '?', action: 'Help' },{ key: 'H', action: 'History' },{ key: 'B', action: 'Backup' },{ key: 'N', action: 'New' },{ key: 'S', action: 'Search' },{ key: 'D', action: 'Dashboard' },{ key: 'A', action: 'All Patients' },{ key: 'X', action: 'Diagnosis' },{ key: 'Esc', action: 'Close' }] }
        }
    };
    
    window.HELP_CONTENT = HELP_CONTENT;

    // ==========================================
    // PREFERENCES
    // ==========================================
    var DEFAULT_PREFS = { showTour: true, keyboardShortcuts: true, showTips: true, showTooltips: true, tourCompleted: false };
    
    function getPreferences() {
        try { var s = localStorage.getItem('help_preferences'); return s ? Object.assign({}, DEFAULT_PREFS, JSON.parse(s)) : DEFAULT_PREFS; }
        catch(e) { return DEFAULT_PREFS; }
    }
    function savePreferences(p) { try { localStorage.setItem('help_preferences', JSON.stringify(p)); return true; } catch(e) { return false; } }
    function updatePreference(k, v) { var p = getPreferences(); p[k] = v; savePreferences(p); return p; }
    
    window.getPreferences = getPreferences;
    window.updatePreference = updatePreference;

    // ==========================================
    // LANGUAGE
    // ==========================================
    function getCurrentLang() { try { return localStorage.getItem('clinic_lang') || 'ur'; } catch(e) { return 'ur'; } }
    function getContent(c) { var l = getCurrentLang(); if (c && c[l]) return c[l]; if (c && c.ur) return c.ur; return null; }

    // ==========================================
    // LABEL FIXES - No longer needed!
    // All labels now use proper data-ur/data-en/data-roman
    // in index.html directly. The applyLanguage() function
    // in index.html handles switching automatically.
    // ==========================================

    // ==========================================
    // TOOLTIPS
    // ==========================================
    var currentTooltip = null;
    var tooltipTimeout = null;
    
    function createTooltip(el, text) {
        removeTooltip();
        var t = document.createElement('div');
        t.className = 'help-tooltip';
        t.innerHTML = text;
        t.style.cssText = 'position:fixed;background:#2c3e50;color:white;padding:8px 14px;border-radius:6px;font-size:13px;font-family:inherit;z-index:9999;pointer-events:none;opacity:0;transition:opacity 0.2s;box-shadow:0 4px 15px rgba(0,0,0,0.2);max-width:300px;text-align:center;line-height:1.5;';
        document.body.appendChild(t);
        
        var rect = el.getBoundingClientRect();
        var tRect = t.getBoundingClientRect();
        var top = rect.bottom + 8;
        var left = rect.left + (rect.width / 2) - (tRect.width / 2);
        
        if (left < 10) left = 10;
        if (left + tRect.width > window.innerWidth - 10) left = window.innerWidth - tRect.width - 10;
        if (top + tRect.height > window.innerHeight - 10) top = rect.top - tRect.height - 8;
        
        t.style.top = top + 'px';
        t.style.left = left + 'px';
        setTimeout(function() { t.style.opacity = '1'; }, 10);
        currentTooltip = t;
    }
    
    function removeTooltip() {
        if (tooltipTimeout) { clearTimeout(tooltipTimeout); tooltipTimeout = null; }
        if (currentTooltip) { currentTooltip.remove(); currentTooltip = null; }
    }
    
    function attachTooltip(el, key) {
        if (!el) return;
        var buttonData = HELP_CONTENT.buttons[key];
        if (!buttonData) return;
        
        el.addEventListener('mouseenter', function() {
            if (!getPreferences().showTooltips) return;
            var tip = getContent(buttonData.tooltip);
            if (!tip) return;
            tooltipTimeout = setTimeout(function() { createTooltip(el, tip); }, 500);
        });
        el.addEventListener('mouseleave', removeTooltip);
    }

    // ==========================================
    // INFO MODAL
    // ==========================================
    function createInfoModal() {
        if (document.getElementById('helpInfoModal')) return;
        var m = document.createElement('div');
        m.id = 'helpInfoModal';
        m.className = 'modal-overlay';
        m.innerHTML = '<div class="modal" style="max-width:600px;"><div class="modal-title"><span id="helpInfoTitle">ℹ️</span><button class="modal-close" onclick="closeHelpInfoModal()">✕</button></div><div id="helpInfoContent" style="line-height:1.8;font-size:14px;white-space:pre-wrap;"></div><div class="action-buttons" style="margin-top:20px;"><button class="btn btn-primary" onclick="closeHelpInfoModal()" id="helpInfoOkBtn">✅ ٹھیک ہے</button></div></div>';
        document.body.appendChild(m);
        m.addEventListener('click', function(e) { if (e.target === m) closeHelpInfoModal(); });
    }
    
    window.showInfoModal = function(key) {
        createInfoModal();
        var buttonData = HELP_CONTENT.buttons[key];
        if (!buttonData) return;
        var modalData = getContent(buttonData.modal);
        if (!modalData) return;
        
        document.getElementById('helpInfoTitle').innerHTML = modalData.icon + ' ' + modalData.title;
        document.getElementById('helpInfoContent').innerHTML = modalData.content;
        
        var lang = getCurrentLang();
        var btnText = { ur: '✅ ٹھیک ہے', en: '✅ Got it!', roman: '✅ Theek hai' };
        document.getElementById('helpInfoOkBtn').textContent = btnText[lang] || btnText.ur;
        
        document.getElementById('helpInfoModal').classList.add('active');
    };
    
    window.closeHelpInfoModal = function() {
        var m = document.getElementById('helpInfoModal');
        if (m) m.classList.remove('active');
    };

    // ==========================================
    // ADD ⓘ ICONS (Beautiful Inline Design v2)
    // ==========================================
    
    // Inject global CSS for help info buttons (once)
    function injectHelpStyles() {
        if (document.getElementById('helpIconStyles')) return;
        var style = document.createElement('style');
        style.id = 'helpIconStyles';
        style.textContent = [
            '.help-info-btn {',
            '  display:inline-flex !important;',
            '  align-items:center;',
            '  justify-content:center;',
            '  width:18px;',
            '  height:18px;',
            '  min-width:18px;',
            '  margin:0 2px;',
            '  padding:0;',
            '  color:#fff;',
            '  background:linear-gradient(135deg,#17a2b8,#138496);',
            '  border:none;',
            '  border-radius:50%;',
            '  cursor:pointer;',
            '  font-size:11px;',
            '  font-weight:bold;',
            '  font-style:italic;',
            '  font-family:Georgia,serif;',
            '  vertical-align:middle;',
            '  transition:all 0.2s ease;',
            '  line-height:1;',
            '  box-shadow:0 1px 3px rgba(0,0,0,0.15);',
            '  flex-shrink:0;',
            '  position:relative;',
            '  top:-1px;',
            '}',
            '.help-info-btn:hover {',
            '  background:linear-gradient(135deg,#138496,#0f6674);',
            '  transform:scale(1.2);',
            '  box-shadow:0 2px 8px rgba(23,162,184,0.4);',
            '}',
            '.help-info-btn:active {',
            '  transform:scale(0.95);',
            '}',
            '/* Make btn-group-row flex-wrap and align items center */',
            '.btn-group-row {',
            '  display:flex;',
            '  gap:6px;',
            '  flex-wrap:wrap;',
            '  align-items:center;',
            '}'
        ].join('\n');
        document.head.appendChild(style);
    }
    
    function addInfoIcon(btn, key) {
        if (!btn) return;
        
        var parent = btn.parentElement;
        if (!parent) return;
        
        // Skip if already has ⓘ next to it
        var next = btn.nextElementSibling;
        if (next && next.classList && next.classList.contains('help-info-btn')) return;
        
        attachTooltip(btn, key);
        
        // Create beautiful small ⓘ button
        var infoBtn = document.createElement('button');
        infoBtn.type = 'button';
        infoBtn.className = 'help-info-btn';
        infoBtn.innerHTML = 'i';
        infoBtn.title = 'More info';
        
        infoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showInfoModal(key);
        });
        
        // Insert right after the button in the same flow
        if (btn.nextSibling) {
            parent.insertBefore(infoBtn, btn.nextSibling);
        } else {
            parent.appendChild(infoBtn);
        }
    }
    
    function attachAllHelpIcons() {
        // Inject CSS once
        injectHelpStyles();
        
        var map = [
            { sel: '.custom-manager-box button[onclick*="openAddCategoryModal()"]', key: 'category' },
            { sel: '.custom-manager-box button[onclick*="openAddSymptomModal()"]', key: 'symptom' },
            { sel: '.custom-manager-box button[onclick*="openAddDiseaseModal()"]', key: 'disease' },
            { sel: '.custom-manager-box button[onclick*="viewCustomData()"]', key: 'view_edit_delete' },
            { sel: '.custom-manager-box button[onclick*="viewHistory()"]', key: 'history' },
            { sel: '.custom-manager-box button[onclick*="smartImport()"]', key: 'import' },
            { sel: '.custom-manager-box button[onclick*="exportCustomData()"]', key: 'full_backup' },
            { sel: '.custom-manager-box button[onclick*="exportOnlyNew()"]', key: 'only_new_backup' },
            { sel: '.custom-manager-box button[onclick*="exportForGitHub()"]', key: 'export_github' },
            { sel: '.custom-manager-box button[onclick*="migrationWizard()"]', key: 'migration_wizard' },
            { sel: '.custom-manager-box button[onclick*="cleanupPromoted()"]', key: 'cleanup' }
        ];
        map.forEach(function(item) {
            var btns = document.querySelectorAll(item.sel);
            btns.forEach(function(btn) { addInfoIcon(btn, item.key); });
        });
        
        // Sync button in Custom Data Manager section (not header)
        var syncBtns = document.querySelectorAll('.custom-manager-box button[onclick*="syncCustomData()"]');
        syncBtns.forEach(function(btn) { addInfoIcon(btn, 'sync'); });
    }
    
    function watchForSettingsPage() {
        var lastState = false;
        setInterval(function() {
            var isActive = !!document.querySelector('#page-settings.active');
            if (isActive && !lastState) {
                // Settings page just opened - attach icons once
                setTimeout(attachAllHelpIcons, 300);
            }
            lastState = isActive;
        }, 1000);
    }

    // ==========================================
    // TOUR
    // ==========================================
    var currentTourStep = 0;
    
    function createTourOverlay() {
        if (document.getElementById('helpTourOverlay')) return;
        var o = document.createElement('div');
        o.id = 'helpTourOverlay';
        o.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9998;justify-content:center;align-items:center;padding:20px;';
        o.innerHTML = '<div style="background:white;border-radius:15px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;padding:25px;box-shadow:0 20px 60px rgba(0,0,0,0.4);font-family:inherit;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:12px;border-bottom:2px solid #ecf0f1;"><h3 id="helpTourTitle" style="color:#1a5276;margin:0;font-size:18px;">Title</h3><button onclick="closeTour()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#7f8c8d;">✕</button></div><div id="helpTourBody" style="line-height:1.8;font-size:14px;color:#2c3e50;margin-bottom:20px;white-space:pre-wrap;"></div><div id="helpTourProgress" style="text-align:center;color:#7f8c8d;font-size:12px;margin-bottom:15px;"></div><div id="helpTourButtons" style="display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;"></div></div>';
        document.body.appendChild(o);
    }
    
    window.startTour = function() {
        currentTourStep = 0;
        createTourOverlay();
        document.getElementById('helpTourOverlay').style.display = 'flex';
        showTourStep();
    };
    
    window.showTourWelcome = function() {
        createTourOverlay();
        document.getElementById('helpTourOverlay').style.display = 'flex';
        var w = getContent(HELP_CONTENT.tour.welcome);
        var lang = getCurrentLang();
        document.getElementById('helpTourTitle').textContent = w.title;
        document.getElementById('helpTourBody').innerHTML = '<div style="text-align:center;font-size:16px;font-weight:bold;color:#8e44ad;margin-bottom:15px;">' + w.heading + '</div><div style="white-space:pre-wrap;">' + w.content + '</div>';
        document.getElementById('helpTourProgress').textContent = '';
        var btnT = { ur: { full: '🎓 ٹور شروع', skip: '❌ ابھی نہیں' }, en: { full: '🎓 Start Tour', skip: '❌ Skip' }, roman: { full: '🎓 Tour Shuru', skip: '❌ Abhi Nahi' }};
        var b = btnT[lang] || btnT.ur;
        document.getElementById('helpTourButtons').innerHTML = '<button class="btn btn-primary" onclick="startTour()" style="flex:1;">' + b.full + '</button><button class="btn btn-light" onclick="skipTourPermanently()" style="flex:1;">' + b.skip + '</button>';
    };
    
    function showTourStep() {
        var steps = HELP_CONTENT.tour.steps;
        if (currentTourStep >= steps.length) { completeTour(); return; }
        var step = steps[currentTourStep];
        var content = getContent(step.content);
        var lang = getCurrentLang();
        document.getElementById('helpTourTitle').textContent = content.title;
        document.getElementById('helpTourBody').innerHTML = content.body;
        var pT = { ur: 'مرحلہ ' + (currentTourStep + 1) + ' / ' + steps.length, en: 'Step ' + (currentTourStep + 1) + ' of ' + steps.length, roman: 'Step ' + (currentTourStep + 1) + ' / ' + steps.length };
        document.getElementById('helpTourProgress').textContent = pT[lang] || pT.ur;
        var bT = { ur: { prev: '◀ پیچھے', next: 'آگے ▶', close: 'بند', finish: '🎉 مکمل' }, en: { prev: '◀ Previous', next: 'Next ▶', close: 'Close', finish: '🎉 Finish' }, roman: { prev: '◀ Peechhe', next: 'Aagay ▶', close: 'Band', finish: '🎉 Mukammal' }};
        var b = bT[lang] || bT.ur;
        var isLast = currentTourStep === steps.length - 1;
        var isFirst = currentTourStep === 0;
        var html = '';
        if (!isFirst) html += '<button class="btn btn-light" onclick="prevTourStep()">' + b.prev + '</button>';
        else html += '<span></span>';
        html += '<button class="btn btn-light btn-sm" onclick="closeTour()" style="opacity:0.7;">' + b.close + '</button>';
        if (isLast) html += '<button class="btn btn-success" onclick="completeTour()">' + b.finish + '</button>';
        else html += '<button class="btn btn-primary" onclick="nextTourStep()">' + b.next + '</button>';
        document.getElementById('helpTourButtons').innerHTML = html;
    }
    
    window.nextTourStep = function() { currentTourStep++; showTourStep(); };
    window.prevTourStep = function() { if (currentTourStep > 0) { currentTourStep--; showTourStep(); } };
    window.closeTour = function() { var o = document.getElementById('helpTourOverlay'); if (o) o.style.display = 'none'; };
    
    // ==========================================
    // TIP OF THE DAY
    // ==========================================
    window.showTipOfTheDay = function() {
        var tips = HELP_CONTENT.tips;
        if (!tips || tips.length === 0) return;
        var dayIndex = new Date().getDate() % tips.length;
        var tip = getContent(tips[dayIndex]);
        if (!tip) tip = getContent(tips[0]);
        if (!tip) return;
        
        createInfoModal();
        var lang = getCurrentLang();
        var titles = { ur: '💡 آج کا مشورہ', en: '💡 Tip of the Day', roman: '💡 Aaj ka Mashwara' };
        document.getElementById('helpInfoTitle').innerHTML = titles[lang] || titles.ur;
        document.getElementById('helpInfoContent').innerHTML = '<div style="font-size:15px;line-height:1.8;padding:10px 0;">' + tip + '</div>';
        var btnText = { ur: '✅ شکریہ!', en: '✅ Thanks!', roman: '✅ Shukriya!' };
        document.getElementById('helpInfoOkBtn').textContent = btnText[lang] || btnText.ur;
        document.getElementById('helpInfoModal').classList.add('active');
    };
    window.completeTour = function() { updatePreference('tourCompleted', true); closeTour(); if (typeof showToast === 'function') showToast('🎉 ٹور مکمل!'); };
    window.skipTourPermanently = function() { updatePreference('showTour', false); updatePreference('tourCompleted', true); closeTour(); };

    // ==========================================
    // HELP CENTER
    // ==========================================
    function createHelpCenterModal() {
        if (document.getElementById('helpCenterModal')) return;
        var m = document.createElement('div');
        m.id = 'helpCenterModal';
        m.className = 'modal-overlay';
        m.innerHTML = '<div class="modal" style="max-width:750px;"><div class="modal-title"><span id="helpCenterTitle">📚 مدد سینٹر</span><button class="modal-close" onclick="closeHelpCenter()">✕</button></div><div id="helpCenterContent"></div></div>';
        document.body.appendChild(m);
        m.addEventListener('click', function(e) { if (e.target === m) closeHelpCenter(); });
    }
    
    window.openHelpCenter = function() {
        createHelpCenterModal();
        renderHelpCenter();
        document.getElementById('helpCenterModal').classList.add('active');
    };
    
    window.closeHelpCenter = function() {
        var m = document.getElementById('helpCenterModal');
        if (m) m.classList.remove('active');
    };
    
    function renderHelpCenter() {
        var lang = getCurrentLang();
        var titles = { ur: '📚 مدد اور رہنمائی مرکز', en: '📚 Help & Guidance Center', roman: '📚 Madad aur Rahnumai Markaz' };
        document.getElementById('helpCenterTitle').innerHTML = titles[lang] || titles.ur;
        
        var l = {
            ur: { tour: '🎓 ٹور شروع', sections: '📖 حصے', buttons: '🔘 بٹنز', faqs: '❓ سوالات', tips: '💡 مشورے', shortcuts: '⌨️ شارٹ کٹس', close: 'بند' },
            en: { tour: '🎓 Start Tour', sections: '📖 Sections', buttons: '🔘 Buttons', faqs: '❓ FAQs', tips: '💡 Tips', shortcuts: '⌨️ Shortcuts', close: 'Close' },
            roman: { tour: '🎓 Tour Shuru', sections: '📖 Hisse', buttons: '🔘 Buttons', faqs: '❓ Sawalaat', tips: '💡 Mashware', shortcuts: '⌨️ Shortcuts', close: 'Band Karein' }
        }[lang] || {};
        
        var html = '<div style="max-height:70vh;overflow-y:auto;">';
        html += '<div style="background:#f4ecf7;padding:12px;border-radius:8px;margin-bottom:12px;"><button class="btn btn-purple btn-sm" onclick="closeHelpCenter();showTourWelcome();">' + l.tour + '</button></div>';
        
        // Sections
        html += '<div style="margin-bottom:15px;"><h4 style="color:#1a5276;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">' + l.sections + '</h4><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">';
        Object.keys(HELP_CONTENT.helpCenter).forEach(function(k) {
            var i = HELP_CONTENT.helpCenter[k];
            var c = getContent(i);
            if (!c) return;
            html += '<button onclick="showHelpTopic(\'' + k + '\')" style="padding:10px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;font-family:inherit;font-size:13px;display:flex;align-items:center;gap:6px;text-align:right;"><span style="font-size:18px;">' + i.icon + '</span><span>' + c.title + '</span></button>';
        });
        html += '</div></div>';
        
        // Buttons
        html += '<div style="margin-bottom:15px;"><h4 style="color:#8e44ad;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">' + l.buttons + '</h4><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px;">';
        Object.keys(HELP_CONTENT.buttons).forEach(function(k) {
            var i = HELP_CONTENT.buttons[k];
            var m = getContent(i.modal);
            if (!m) return;
            html += '<button onclick="closeHelpCenter();showInfoModal(\'' + k + '\')" style="padding:8px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;font-family:inherit;font-size:12px;display:flex;align-items:center;gap:6px;text-align:right;"><span style="font-size:16px;">' + m.icon + '</span><span>' + m.title + '</span></button>';
        });
        html += '</div></div>';
        
        // FAQs
        html += '<div style="margin-bottom:15px;"><h4 style="color:#f39c12;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">' + l.faqs + '</h4>';
        HELP_CONTENT.faqs.forEach(function(f, idx) {
            var q = getContent(f.question);
            var a = getContent(f.answer);
            if (!q || !a) return;
            html += '<div style="background:#f8f9fa;border-radius:6px;margin-bottom:8px;overflow:hidden;"><div onclick="toggleFaq(' + idx + ')" style="padding:10px 12px;cursor:pointer;font-weight:bold;color:#2c3e50;font-size:13px;">❓ ' + q + '</div><div id="faqA' + idx + '" style="display:none;padding:12px;background:white;border-top:1px solid #ecf0f1;line-height:1.6;font-size:13px;white-space:pre-wrap;">' + a + '</div></div>';
        });
        html += '</div>';
        
        // Tips
        html += '<div style="margin-bottom:15px;"><h4 style="color:#27ae60;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">' + l.tips + '</h4>';
        HELP_CONTENT.tips.forEach(function(t) {
            var c = getContent(t);
            if (!c) return;
            html += '<div style="background:linear-gradient(135deg,#d4edda,#c3e6cb);padding:10px 12px;border-radius:6px;margin-bottom:6px;font-size:13px;line-height:1.6;white-space:pre-wrap;">' + c + '</div>';
        });
        html += '</div>';
        
        // Shortcuts
        var sc = getContent(HELP_CONTENT.shortcuts);
        if (sc) {
            html += '<div style="margin-bottom:15px;"><h4 style="color:#17a2b8;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">' + l.shortcuts + '</h4><div style="background:#d1ecf1;padding:8px 12px;border-radius:6px;margin-bottom:10px;font-size:12px;">' + sc.note + '</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;">';
            sc.items.forEach(function(it) {
                html += '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:white;border:1px solid #ddd;border-radius:6px;font-size:12px;"><kbd style="background:#2c3e50;color:white;padding:2px 8px;border-radius:4px;font-weight:bold;">' + it.key + '</kbd><span>' + it.action + '</span></div>';
            });
            html += '</div></div>';
        }
        
        html += '</div><div class="action-buttons" style="margin-top:15px;"><button class="btn btn-light" onclick="closeHelpCenter()">' + l.close + '</button></div>';
        document.getElementById('helpCenterContent').innerHTML = html;
    }
    
    window.renderHelpCenter = renderHelpCenter;
    
    window.toggleFaq = function(idx) {
        var a = document.getElementById('faqA' + idx);
        if (a.style.display === 'none') a.style.display = 'block';
        else a.style.display = 'none';
    };
    
    window.showHelpTopic = function(k) {
        var topic = HELP_CONTENT.helpCenter[k];
        if (!topic) return;
        var content = getContent(topic);
        if (!content) return;
        var lang = getCurrentLang();
        var back = { ur: '◀ واپس', en: '◀ Back', roman: '◀ Wapas' };
        var html = '<div style="max-height:70vh;overflow-y:auto;"><div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:15px;"><h3 style="color:#1a5276;margin-bottom:10px;display:flex;align-items:center;gap:8px;"><span style="font-size:24px;">' + topic.icon + '</span><span>' + content.title + '</span></h3></div><div style="line-height:1.8;font-size:14px;white-space:pre-wrap;padding:0 5px;">' + content.content + '</div></div><div class="action-buttons" style="margin-top:15px;"><button class="btn btn-light" onclick="renderHelpCenter()">' + back[lang] + '</button><button class="btn btn-primary" onclick="closeHelpCenter()">Close</button></div>';
        document.getElementById('helpCenterContent').innerHTML = html;
    };

    // ==========================================
    // PREFERENCES MODAL
    // ==========================================
    window.openPreferencesModal = function() {
        var m = document.getElementById('preferencesModal');
        var lang = getCurrentLang();
        var titles = { ur: '⚙️ ترجیحات', en: '⚙️ Preferences', roman: '⚙️ Tarjeehaat' };
        if (!m) {
            m = document.createElement('div');
            m.id = 'preferencesModal';
            m.className = 'modal-overlay';
            m.innerHTML = '<div class="modal" style="max-width:500px;"><div class="modal-title"><span id="prefsModalTitle">⚙️ Preferences</span><button class="modal-close" onclick="closePreferencesModal()">✕</button></div><div id="prefsContent"></div></div>';
            document.body.appendChild(m);
            m.addEventListener('click', function(e) { if (e.target === m) closePreferencesModal(); });
        }
        var titleEl = document.getElementById('prefsModalTitle');
        if (titleEl) titleEl.textContent = titles[lang] || titles.en;
        renderPreferences();
        m.classList.add('active');
    };
    
    window.closePreferencesModal = function() { var m = document.getElementById('preferencesModal'); if (m) m.classList.remove('active'); };
    
    function renderPreferences() {
        var p = getPreferences();
        var lang = getCurrentLang();
        var l = {
            ur: { tour: { name: '🎓 پہلی بار ٹور', desc: 'اگلی بار خودکار' }, shortcuts: { name: '⌨️ شارٹ کٹس', desc: '? = مدد' }, tips: { name: '💡 مشورہ', desc: 'روزانہ' }, tooltips: { name: '🎨 ٹول ٹپ', desc: 'ماؤس ہوور' }, close: 'بند' },
            en: { tour: { name: '🎓 First Tour', desc: 'Auto next time' }, shortcuts: { name: '⌨️ Shortcuts', desc: '? = Help' }, tips: { name: '💡 Tips', desc: 'Daily' }, tooltips: { name: '🎨 Tooltips', desc: 'On hover' }, close: 'Close' },
            roman: { tour: { name: '🎓 Pehli Baar Tour', desc: 'Agli baar khudkar' }, shortcuts: { name: '⌨️ Shortcuts', desc: '? = Madad' }, tips: { name: '💡 Mashwara', desc: 'Rozana' }, tooltips: { name: '🎨 Tooltips', desc: 'Mouse hover' }, close: 'Band Karein' }
        }[lang] || {};
        
        var items = [{ key: 'showTour', label: l.tour }, { key: 'keyboardShortcuts', label: l.shortcuts }, { key: 'showTips', label: l.tips }, { key: 'showTooltips', label: l.tooltips }];
        var html = '<div style="padding:10px 0;">';
        items.forEach(function(it) {
            var on = p[it.key];
            html += '<div style="background:#f8f9fa;padding:12px;border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px;"><div style="flex:1;"><div style="font-weight:bold;color:#2c3e50;margin-bottom:4px;">' + it.label.name + '</div><div style="font-size:12px;color:#7f8c8d;">' + it.label.desc + '</div></div><label style="cursor:pointer;position:relative;display:inline-block;width:60px;height:30px;"><input type="checkbox" ' + (on ? 'checked' : '') + ' onchange="togglePreference(\'' + it.key + '\', this.checked)" style="opacity:0;width:0;height:0;"><span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:' + (on ? '#27ae60' : '#95a5a6') + ';border-radius:34px;transition:0.3s;"><span style="position:absolute;height:24px;width:24px;left:' + (on ? '33px' : '3px') + ';bottom:3px;background:white;border-radius:50%;transition:0.3s;"></span></span></label></div>';
        });
        html += '</div><div class="action-buttons" style="margin-top:15px;"><button class="btn btn-primary" onclick="closePreferencesModal()">' + l.close + '</button></div>';
        document.getElementById('prefsContent').innerHTML = html;
    }
    
    window.togglePreference = function(k, v) {
        updatePreference(k, v);
        setTimeout(renderPreferences, 100);
        var lang = getCurrentLang();
        var onTexts = { ur: '✅ آن', en: '✅ On', roman: '✅ On' };
        var offTexts = { ur: '❌ آف', en: '❌ Off', roman: '❌ Off' };
        if (typeof showToast === 'function') showToast(v ? (onTexts[lang] || onTexts.en) : (offTexts[lang] || offTexts.en));
    };

    // ==========================================
    // KEYBOARD SHORTCUTS
    // ==========================================
    function handleKeyboardShortcut(e) {
        var p = getPreferences();
        if (!p.keyboardShortcuts) return;
        var tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        if (document.querySelector('.modal-overlay.active')) {
            if (e.key === 'Escape') {
                var modals = document.querySelectorAll('.modal-overlay.active');
                if (modals.length > 0) modals[modals.length - 1].classList.remove('active');
            }
            return;
        }
        var key = e.key.toLowerCase();
        switch(key) {
            case '?': case '/': e.preventDefault(); openHelpCenter(); break;
            case 'h': if (typeof viewHistory === 'function') { e.preventDefault(); viewHistory(); } break;
            case 'b': if (typeof exportCustomData === 'function') { e.preventDefault(); exportCustomData(); } break;
            case 'n': e.preventDefault(); var n = document.querySelector('[data-page="newPatient"]'); if (n) n.click(); break;
            case 's': e.preventDefault(); var s = document.querySelector('[data-page="searchPatient"]'); if (s) s.click(); break;
            case 'd': e.preventDefault(); var d = document.querySelector('[data-page="dashboard"]'); if (d) d.click(); break;
            case 'a': e.preventDefault(); var a = document.querySelector('[data-page="allPatients"]'); if (a) a.click(); break;
            case 'x': e.preventDefault(); var x = document.querySelector('[data-page="diagnosis"]'); if (x) x.click(); break;
        }
    }

    // ==========================================
    // HELP BUTTON - Now in nav bar (no header button needed)
    // ==========================================
    function addHelpButtonToHeader() {
        // Help button is now in the nav bar as a nav-btn
        // No need to add to header anymore
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    function initialize() {
        console.log('🚀 Help System v3 initializing...');
        document.addEventListener('keydown', handleKeyboardShortcut);
        setTimeout(addHelpButtonToHeader, 2000);
        watchForSettingsPage();
        
        setTimeout(function() {
            var p = getPreferences();
            if (p.showTour && !p.tourCompleted) showTourWelcome();
        }, 3000);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        setTimeout(initialize, 500);
    }
    
    console.log('✅ Help System v3 - COMPLETE');
    console.log('✅ Functions check:', 
        'openPreferencesModal=' + (typeof window.openPreferencesModal),
        'openHelpCenter=' + (typeof window.openHelpCenter),
        'showTourWelcome=' + (typeof window.showTourWelcome),
        'showTipOfTheDay=' + (typeof window.showTipOfTheDay)
    );

})();

// ==========================================
// GLOBAL ALIASES - Ensure functions are accessible
// even if IIFE scoping causes issues in some browsers
// ==========================================
if (typeof openPreferencesModal === 'undefined' && typeof window._bhcOpenPrefs === 'function') {
    window.openPreferencesModal = window._bhcOpenPrefs;
}

// Fallback: re-define on window directly if missing
(function() {
    var checkAndFix = function() {
        var fns = ['openPreferencesModal', 'openHelpCenter', 'showTourWelcome', 'showTipOfTheDay'];
        var missing = fns.filter(function(fn) { return typeof window[fn] !== 'function'; });
        if (missing.length > 0) {
            console.warn('⚠️ Missing functions after IIFE:', missing.join(', '));
            console.warn('⚠️ This means custom-data-help.js IIFE had an error.');
        } else {
            console.log('✅ All 4 nav functions confirmed on window');
        }
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndFix);
    } else {
        setTimeout(checkAndFix, 100);
    }
})();