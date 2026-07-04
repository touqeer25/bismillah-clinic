// ==========================================
// Bismillah Clinic - Complete Help System
// Version 2.0 - Pure Urdu + Tour + Help Center
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // ALL CONTENT (3 Languages - Pure Urdu)
    // ==========================================
    
    var HELP_CONTENT = {
        buttons: {
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
                        content: 'کیٹگری ایک "خانہ" ہوتا ہے جس میں بیماریوں کو ترتیب سے رکھا جاتا ہے۔\n\n<b>مثال:</b>\nکیٹگری: "دل کی بیماریاں" 💗\n• ہارٹ اٹیک\n• انجائنا\n• کولیسٹرول\n\n<b>کب استعمال کریں:</b>\nجب کوئی نئی "ترتیب" بنانی ہو۔\n\n<b>فائدہ:</b>\nتشخیصی صفحے پر ٹیبز بنیں گے، بیماریوں کو منظم کر سکیں گے۔'
                    },
                    en: {
                        title: 'About Category',
                        icon: '🏷️',
                        content: 'A Category is a group used to organize related diseases together.\n\n<b>Example:</b>\nCategory: "Heart Care" 💗\n• Heart Attack\n• Angina\n• Cholesterol\n\n<b>When to use:</b>\nWhen creating a new grouping.'
                    },
                    roman: {
                        title: 'Category ke baray mein',
                        icon: '🏷️',
                        content: 'Category ek group hai jo related bemariyon ko organize karta hai.\n\n<b>Example:</b>\n"Dil ki Bemariyan" 💗'
                    }
                }
            },
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
                        content: 'علامت (سمپٹم) مریض کی "شکایت" ہوتی ہے۔\n\n<b>مثالیں:</b>\n• سر درد\n• بخار\n• کھانسی\n• سینے میں جلن\n\n<b>⚠️ خطرناک علامت:</b>\nاگر علامت خطرناک ہے تو "خطرناک علامت" پر ٹک لگا دیں۔'
                    },
                    en: {
                        title: 'About Symptom',
                        icon: '💡',
                        content: 'A Symptom is a patient complaint or sign of illness.\n\n<b>Examples:</b>\n• Headache\n• Fever\n• Cough'
                    },
                    roman: {
                        title: 'Symptom ke baray mein',
                        icon: '💡',
                        content: 'Symptom mareez ki shikayat hoti hai.\n\n<b>Examples:</b>\n• Sar dard\n• Bukhar\n• Khansi'
                    }
                }
            },
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
                        content: 'بیماری میں مکمل معلومات شامل ہوتی ہیں:\n\n✓ نام (3 زبانوں میں)\n✓ آئکن\n✓ کیٹگری\n✓ علامات\n✓ اہم علامات\n✓ ٹیسٹ\n✓ خطرے کی علامات\n✓ ادویات\n✓ مشورہ'
                    },
                    en: {
                        title: 'About Disease',
                        icon: '🔬',
                        content: 'A Disease contains complete medical protocol:\n\n✓ Name (3 languages)\n✓ Icon\n✓ Category\n✓ Symptoms\n✓ Tests\n✓ Remedies\n✓ Advice'
                    },
                    roman: {
                        title: 'Disease ke baray mein',
                        icon: '🔬',
                        content: 'Disease mein poori medical protocol hoti hai.'
                    }
                }
            },
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
                        content: 'یہاں سے آپ کر سکتے ہیں:\n\n<b>✏️ ایڈٹ:</b> موجودہ چیزوں میں تبدیلی\n<b>🗑️ ڈیلیٹ:</b> غیر ضروری چیزیں ہٹا دیں\n<b>✅ پروموٹ:</b> "میں نے یہ گٹ ہب پر add کر دی"\n<b>↩️ ان پروموٹ:</b> نشان واپس لیں\n\n<b>Badges:</b>\n🆕 New = ابھی کلاؤڈ پر ہے\n✅ GitHub = پروموٹ ہو گئی'
                    },
                    en: {
                        title: 'View / Edit / Delete',
                        icon: '📋',
                        content: 'From here you can:\n\n<b>✏️ Edit:</b> Modify existing items\n<b>🗑️ Delete:</b> Remove items\n<b>✅ Promote:</b> Mark as added to GitHub\n<b>↩️ Unpromote:</b> Remove mark'
                    },
                    roman: {
                        title: 'View / Edit / Delete',
                        icon: '📋',
                        content: 'Yahan se aap Edit, Delete, Promote kar sakte hain.'
                    }
                }
            },
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
                        content: 'ہسٹری لاگ میں نظر آئے گا:\n\n➕ Add - کیا شامل کیا\n✏️ Edit - کیا تبدیل کیا\n🗑️ Delete - کیا مٹایا\n✅ Promote - کیا گٹ ہب پر گیا\n\nہر entry کے ساتھ تاریخ، وقت اور یوزر۔'
                    },
                    en: {
                        title: 'History Log',
                        icon: '📚',
                        content: 'History log shows all Add, Edit, Delete, and Promote actions with timestamps.'
                    },
                    roman: {
                        title: 'History Log',
                        icon: '📚',
                        content: 'History log mein sab tabdeeliyan nazar aayen gi.'
                    }
                }
            },
            import: {
                tooltip: {
                    ur: 'فائل سے ڈیٹا لائیں',
                    en: 'Import data from file',
                    roman: 'File se data laayein'
                },
                modal: {
                    ur: {
                        title: 'امپورٹ (فائل سے ڈیٹا)',
                        icon: '📥',
                        content: 'دو قسم کی فائلیں امپورٹ ہو سکتی ہیں:\n\n<b>1️⃣ .json فائل</b> - بیک اپ سے\n<b>2️⃣ .csv فائل</b> - ایکسل ٹیبل\n\n<b>استعمالات:</b>\n📱 دوسرے ڈاکٹر سے\n💾 بیک اپ ریسٹور\n📊 ایکسل سے بلک'
                    },
                    en: {
                        title: 'Import (JSON/CSV)',
                        icon: '📥',
                        content: 'Import .json or .csv files.\n\nUse cases:\n📱 From another doctor\n💾 Restore backup\n📊 Bulk from Excel'
                    },
                    roman: {
                        title: 'Import',
                        icon: '📥',
                        content: 'JSON ya CSV file import kar sakte hain.'
                    }
                }
            },
            full_backup: {
                tooltip: {
                    ur: 'سب کچھ محفوظ کریں',
                    en: 'Save everything',
                    roman: 'Sab kuch save karein'
                },
                modal: {
                    ur: {
                        title: 'مکمل بیک اپ',
                        icon: '📦',
                        content: 'مکمل بیک اپ میں شامل ہوگا:\n\n✅ سب کیٹگریز\n✅ سب علامات\n✅ سب بیماریاں\n✅ Promoted + New\n\n<b>کب لیں:</b>\n📅 مہینے میں ایک بار\n🎁 شئیر کرنے کے لیے\n📱 نئے ڈیوائس پر'
                    },
                    en: {
                        title: 'Full Backup',
                        icon: '📦',
                        content: 'Full Backup includes:\n\n✅ All Categories\n✅ All Symptoms\n✅ All Diseases\n\nUse monthly for safety.'
                    },
                    roman: {
                        title: 'Full Backup',
                        icon: '📦',
                        content: 'Sab kuch save hoga. Maheenay mein 1 baar.'
                    }
                }
            },
            only_new_backup: {
                tooltip: {
                    ur: 'صرف نئی چیزیں (گٹ ہب پر نہیں)',
                    en: 'Only new items',
                    roman: 'Sirf nayi items'
                },
                modal: {
                    ur: {
                        title: 'صرف نئی بیک اپ',
                        icon: '🆕',
                        content: 'صرف <b>نئی (ان پروموٹڈ)</b> چیزیں محفوظ ہوں گی۔\n\n<b>کیوں مفید:</b>\n🎯 گٹ ہب پر بھیجنے سے پہلے\n🚫 ڈپلیکیٹ سے بچاؤ\n📉 چھوٹی فائل\n\n<b>کب لیں:</b>\n📅 ہر ہفتے'
                    },
                    en: {
                        title: 'Only New Backup',
                        icon: '🆕',
                        content: 'Only unpromoted items will be saved.\n\nUseful before GitHub push.\nWeekly recommended.'
                    },
                    roman: {
                        title: 'Only New Backup',
                        icon: '🆕',
                        content: 'Sirf nayi items. Har hafte lein.'
                    }
                }
            },
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
                        content: 'یہ کوڈ بنائے گا جو diagnosis-data.js میں پیسٹ ہو جائے گا۔\n\n<b>Steps:</b>\n1. Button دبائیں\n2. .txt فائل ڈاؤن لوڈ\n3. GitHub پر paste\n4. Commit + Push\n5. App میں "✅" دبائیں\n\n💡 "Migration Wizard" آسان ہے!'
                    },
                    en: {
                        title: 'Export for GitHub',
                        icon: '📝',
                        content: 'Generates code ready to paste into diagnosis-data.js\n\nSteps:\n1. Click button\n2. Download .txt\n3. Paste on GitHub\n4. Push\n5. Mark as promoted'
                    },
                    roman: {
                        title: 'Export for GitHub',
                        icon: '📝',
                        content: 'GitHub ke liye ready code. Migration Wizard easier!'
                    }
                }
            },
            migration_wizard: {
                tooltip: {
                    ur: 'مرحلہ وار رہنمائی',
                    en: 'Step-by-step guided workflow',
                    roman: 'Step-by-step guide'
                },
                modal: {
                    ur: {
                        title: 'مائیگریشن وزرڈ',
                        icon: '🚀',
                        content: '⭐ <b>نئے صارفین کے لیے بہترین!</b>\n\nیہ آپ کو مرحلہ وار رہنمائی کرے گا:\n\n1️⃣ چیزوں کی گنتی\n2️⃣ ایکسپورٹ فائل\n3️⃣ ہدایات\n4️⃣ تصدیق\n\n<b>مہینے میں ایک بار</b> استعمال کریں!'
                    },
                    en: {
                        title: 'Migration Wizard',
                        icon: '🚀',
                        content: '⭐ Best for beginners!\n\nGuides you step-by-step through GitHub migration.\n\nUse once a month!'
                    },
                    roman: {
                        title: 'Migration Wizard',
                        icon: '🚀',
                        content: '⭐ Beginners ke liye BEST!\nStep-by-step guide. Maheenay mein 1 baar.'
                    }
                }
            },
            cleanup: {
                tooltip: {
                    ur: 'گٹ ہب پر شامل چیزیں مٹا دیں',
                    en: 'Delete promoted items',
                    roman: 'Promoted items delete'
                },
                modal: {
                    ur: {
                        title: 'پروموٹڈ صفائی',
                        icon: '🧹',
                        content: '⚠️ <b>احتیاط:</b> صرف Promoted چیزیں مٹے گی!\n\n✅ Promoted (✅ badge) = ڈیلیٹ\n❌ New (🆕 badge) = محفوظ\n\n<b>کب دبائیں:</b>\nگٹ ہب پر add کرنے کے بعد\n"✅ Promoted" مارک کرنے کے بعد'
                    },
                    en: {
                        title: 'Cleanup Promoted',
                        icon: '🧹',
                        content: '⚠️ Warning: Deletes promoted items only!\n\n✅ Promoted = Deleted\n❌ New = Safe\n\nUse after GitHub push.'
                    },
                    roman: {
                        title: 'Cleanup Promoted',
                        icon: '🧹',
                        content: '⚠️ Sirf Promoted items delete. New safe.'
                    }
                }
            },
            sync: {
                tooltip: {
                    ur: 'کلاؤڈ سے تازہ ڈیٹا لیں',
                    en: 'Fetch fresh data from cloud',
                    roman: 'Cloud se fresh data'
                },
                modal: {
                    ur: {
                        title: 'سنک',
                        icon: '☁️',
                        content: 'کلاؤڈ سے تازہ ڈیٹا لے آئے گا۔\n\n<b>کب دبائیں:</b>\n✅ دوسرے ڈیوائس پر کچھ add کیا\n✅ ڈیٹا update نہ ہو رہا\n✅ نئے ڈیوائس پر پہلی بار\n\n<b>خودکار sync:</b>\nہر 30 seconds میں'
                    },
                    en: {
                        title: 'Sync',
                        icon: '☁️',
                        content: 'Fetches latest data from cloud.\n\nUse when data added on another device or not updating.\n\nAuto-sync every 30 seconds.'
                    },
                    roman: {
                        title: 'Sync',
                        icon: '☁️',
                        content: 'Cloud se latest data. Auto sync har 30 seconds.'
                    }
                }
            }
        },
        
        tour: {
            welcome: {
                ur: {
                    title: '🎉 خوش آمدید!',
                    heading: 'بسم اللہ ہومیوپیتھک کلینک',
                    content: 'کیا آپ چاہتے ہیں میں آپ کو پوری ایپ کا استعمال سکھاؤں؟\n\n✅ مکمل رہنمائی\n⏱️ صرف 5-7 منٹ\n🎯 10 آسان مراحل'
                },
                en: {
                    title: '🎉 Welcome!',
                    heading: 'Bismillah Homeopathic Clinic',
                    content: 'Would you like a tour of the complete app?\n\n✅ Complete guidance\n⏱️ 5-7 minutes\n🎯 10 easy steps'
                },
                roman: {
                    title: '🎉 Khush Aamdeed!',
                    heading: 'Bismillah Homeopathic Clinic',
                    content: 'Tour lena chahenge?\n\n✅ Complete guide\n⏱️ 5-7 minutes\n🎯 10 steps'
                }
            },
            steps: [
                {
                    content: {
                        ur: {
                            title: '🏥 ایپ کا تعارف',
                            body: 'یہ ایپ آپ کے لیے مفید ہے:\n\n✅ مریضوں کا مکمل ریکارڈ\n✅ ملاقاتیں محفوظ رکھنا\n✅ خاندانی نظام\n✅ تشخیصی مدد (150+ بیماریاں)\n✅ کلاؤڈ پر خودکار محفوظ\n✅ آفلائن بھی کام'
                        },
                        en: {
                            title: '🏥 App Introduction',
                            body: 'This app helps you:\n\n✅ Complete patient records\n✅ Save consultations\n✅ Family system\n✅ Diagnosis (150+ diseases)\n✅ Auto cloud save\n✅ Works offline'
                        },
                        roman: {
                            title: '🏥 App Introduction',
                            body: 'Yeh app aap ke liye:\n\n✅ Patient records\n✅ Consultations\n✅ Family system\n✅ Diagnosis help\n✅ Cloud save\n✅ Offline work'
                        }
                    }
                },
                {
                    content: {
                        ur: {
                            title: '🔓 لاگ ان',
                            body: '<b>لاگ ان کیسے کریں:</b>\n\n1. Username لکھیں\n2. Password لکھیں\n3. "🔓 لاگ ان" دبائیں\n\n<b>💡 "مجھے یاد رکھیں":</b>\nٹک لگا دیں تو 30 دن تک خودکار لاگ ان!\n\n<b>Demo:</b> doctor / 1234'
                        },
                        en: {
                            title: '🔓 Login',
                            body: '<b>How to Login:</b>\n\n1. Enter Username\n2. Enter Password\n3. Click "Login"\n\n<b>💡 "Remember Me":</b>\nCheck for auto-login for 30 days!\n\n<b>Demo:</b> doctor / 1234'
                        },
                        roman: {
                            title: '🔓 Login',
                            body: 'Username, Password likhein.\n\nRemember Me tick karein for 30 days auto-login.\n\nDemo: doctor / 1234'
                        }
                    }
                },
                {
                    content: {
                        ur: {
                            title: '🌐 زبان بدلیں',
                            body: 'اوپر right میں 🌐 بٹن دیکھیں\n\nکلک کرنے سے:\n🇵🇰 اردو → 🇬🇧 English → 🔤 Roman → واپس\n\n<b>💡 آپ کی پسند یاد رہے گی!</b>'
                        },
                        en: {
                            title: '🌐 Language',
                            body: '🌐 button at top right\n\nClick to change:\n🇵🇰 Urdu → 🇬🇧 English → 🔤 Roman\n\nYour preference is saved!'
                        },
                        roman: {
                            title: '🌐 Language',
                            body: '🌐 button top right\nClick to change language.\nPreference saved.'
                        }
                    }
                },
                {
                    content: {
                        ur: {
                            title: '🏠 ڈیش بورڈ',
                            body: '<b>4 اہم Statistics:</b>\n\n📅 آج کے مریض\n📊 کل مریض\n📆 اس ماہ\n🔄 فالو اپ\n\n<b>آج کی سرگرمی:</b>\nآج کے تمام مریض\n\n💡 مریض کے نام پر کلک = مکمل تفصیل!'
                        },
                        en: {
                            title: '🏠 Dashboard',
                            body: '<b>4 Statistics:</b>\n\n📅 Today\n📊 Total\n📆 This month\n🔄 Follow-ups\n\nClick patient name for details!'
                        },
                        roman: {
                            title: '🏠 Dashboard',
                            body: '4 statistics: Today, Total, Month, Follow-ups.\nClick patient for details.'
                        }
                    }
                },
                {
                    content: {
                        ur: {
                            title: '➕ نئی رجسٹریشن',
                            body: '<b>دو حصے ہیں:</b>\n\n<b>1️⃣ مریض کی معلومات:</b>\n• حوالہ نمبر (خودکار)\n• نام (لازمی)\n• فون (لازمی)\n• ولدیت، عمر، جنس\n• فیملی نمبر (اختیاری)\n\n<b>2️⃣ پہلی ملاقات:</b>\n• Vitals\n• علامات\n• تشخیص\n• نسخہ'
                        },
                        en: {
                            title: '➕ New Registration',
                            body: '<b>2 sections:</b>\n\n<b>1️⃣ Patient Info:</b>\nName + Phone required\n\n<b>2️⃣ First Visit:</b>\nVitals, Symptoms, Diagnosis, Prescription'
                        },
                        roman: {
                            title: '➕ New Registration',
                            body: '2 parts:\n1. Patient info\n2. First visit\n\nName aur phone required.'
                        }
                    }
                },
                {
                    content: {
                        ur: {
                            title: '🔍 مریض تلاش',
                            body: '<b>تلاش کر سکتے ہیں:</b>\n\n✅ نام سے\n✅ فون سے\n✅ حوالہ نمبر\n✅ فیملی نمبر\n✅ ولدیت سے\n\n💡 <b>فوری Results!</b>\nجیسے ٹائپ کریں، نتائج ملتے جائیں'
                        },
                        en: {
                            title: '🔍 Search',
                            body: '<b>Search by:</b>\n\n✅ Name\n✅ Phone\n✅ Reference\n✅ Family No\n✅ Father name\n\n💡 Instant results!'
                        },
                        roman: {
                            title: '🔍 Search',
                            body: 'Search by name, phone, reference, family.\nInstant results!'
                        }
                    }
                },
                {
                    content: {
                        ur: {
                            title: '📋 تمام مریض',
                            body: '<b>Table میں سب معلومات:</b>\n• حوالہ، نام، عمر، فون\n• فیملی، فالو اپ\n\n<b>ہر مریض کے ساتھ:</b>\n👁️ دیکھیں - مکمل تفصیل\n✏️ ایڈٹ - تبدیلی\n🗑️ ڈیلیٹ - مٹا دیں'
                        },
                        en: {
                            title: '📋 All Patients',
                            body: '<b>Complete list with:</b>\n• Ref, Name, Age, Phone\n\n<b>Actions:</b>\n👁️ View\n✏️ Edit\n🗑️ Delete'
                        },
                        roman: {
                            title: '📋 All Patients',
                            body: 'Complete list.\n3 buttons: View, Edit, Delete.'
                        }
                    }
                },
                {
                    content: {
                        ur: {
                            title: '👨‍👩‍👧‍👦 فیملی نظام',
                            body: '<b>✨ خودکار پہچان!</b>\n\nایک ہی فون سے دوسرا مریض:\n✅ "فیملی موجود ہے"\n✅ خودکار Family No\n\n<b>Format:</b> F-001, F-002...\n\n<b>💡 فوائد:</b>\nفیملی ممبرز اکٹھے، خاندانی history'
                        },
                        en: {
                            title: '👨‍👩‍👧‍👦 Family System',
                            body: '<b>✨ Auto Detection!</b>\n\nSame phone = same family\n\nFormat: F-001, F-002...\n\n<b>Benefits:</b>\nFamily view together!'
                        },
                        roman: {
                            title: '👨‍👩‍👧‍👦 Family',
                            body: 'Auto family detection.\nSame phone = same family.\nF-001, F-002 format.'
                        }
                    }
                },
                {
                    content: {
                        ur: {
                            title: '🔬 تشخیصی معاون',
                            body: '<b>✨ AI طرز کی تشخیص!</b>\n\n<b>3 مراحل:</b>\n1️⃣ کیٹگری منتخب کریں\n2️⃣ علامات چنیں (☑️)\n3️⃣ "تشخیص کریں" دبائیں\n\n<b>نتائج:</b>\n• Match % (🟢 90%)\n• ٹیسٹ\n• ادویات\n• مشورہ\n\n💡 "Copy to Visit" سے خودکار fill!'
                        },
                        en: {
                            title: '🔬 Diagnosis',
                            body: '<b>✨ AI-style Diagnosis!</b>\n\n<b>3 Steps:</b>\n1. Select category\n2. Choose symptoms\n3. Click Analyze\n\n<b>Results:</b>\nMatch %, Tests, Remedies, Advice'
                        },
                        roman: {
                            title: '🔬 Diagnosis',
                            body: '3 steps:\n1. Category\n2. Symptoms\n3. Analyze\n\nResults with match %.'
                        }
                    }
                },
                {
                    content: {
                        ur: {
                            title: '⚙️ سیٹنگز',
                            body: '<b>🎯 مرکزی کنٹرول:</b>\n\n🏷️ کسٹم ڈیٹا مینیجر\n☁️ کلاؤڈ سنک\n💾 بیک اپ سسٹم\n📝 گٹ ہب ایکسپورٹ\n🧹 صفائی\n📚 ہسٹری\n⚙️ ترجیحات\n\n<b>🎉 مبارک ہو!</b>\n\nآپ نے ٹور مکمل کیا۔\nمدد کے لیے ❓ بٹن ہمیشہ available ہے!'
                        },
                        en: {
                            title: '⚙️ Settings',
                            body: '<b>🎯 Control Panel:</b>\n\n🏷️ Custom Data\n☁️ Cloud Sync\n💾 Backup\n📝 GitHub Export\n🧹 Cleanup\n📚 History\n⚙️ Preferences\n\n<b>🎉 Congratulations!</b>\n\nTour complete!\n❓ button always available.'
                        },
                        roman: {
                            title: '⚙️ Settings',
                            body: 'Central control panel.\nCustom Data, Cloud Sync, Backup, etc.\n\n🎉 Tour complete!'
                        }
                    }
                }
            ]
        },
        
        helpCenter: {
            login: {
                icon: '🔓',
                ur: {
                    title: 'لاگ ان اور یاد رکھنا',
                    content: '<b>لاگ ان:</b>\n1. Username لکھیں\n2. Password لکھیں\n3. لاگ ان دبائیں\n\n<b>Demo:</b> doctor / 1234\n\n<b>Remember Me:</b>\n30 دن تک خودکار لاگ ان'
                },
                en: {
                    title: 'Login System',
                    content: '<b>Login:</b>\n1. Username\n2. Password\n3. Click Login\n\n<b>Demo:</b> doctor / 1234\n\n<b>Remember Me:</b>\n30 days auto-login'
                },
                roman: {
                    title: 'Login',
                    content: 'Login: Username, Password.\nDemo: doctor / 1234\nRemember Me = 30 days.'
                }
            },
            dashboard: {
                icon: '🏠',
                ur: {
                    title: 'ڈیش بورڈ',
                    content: '<b>4 Statistics:</b>\n• آج کے مریض\n• کل مریض\n• اس ماہ\n• فالو اپ\n\n<b>آج کی سرگرمی:</b>\nآج کے سب مریض نظر آئیں گے\n\n<b>Click patient = full details</b>'
                },
                en: {
                    title: 'Dashboard',
                    content: '<b>4 Statistics:</b>\n• Today\n• Total\n• Month\n• Follow-ups\n\n<b>Today Activity:</b>\nAll today patients\n\nClick for details.'
                },
                roman: {
                    title: 'Dashboard',
                    content: '4 statistics + today activity.\nClick patient for details.'
                }
            },
            registration: {
                icon: '➕',
                ur: {
                    title: 'نئی رجسٹریشن',
                    content: '<b>1️⃣ مریض کی معلومات:</b>\n• حوالہ نمبر (خودکار)\n• نام (لازمی)\n• فون (لازمی)\n• عمر، جنس\n• فیملی نمبر\n\n<b>2️⃣ پہلی ملاقات:</b>\n• Vitals\n• علامات\n• تشخیص\n• نسخہ\n\n<b>💡 Auto Family:</b>\nایک ہی فون = خودکار فیملی'
                },
                en: {
                    title: 'New Registration',
                    content: '<b>1. Patient Info:</b>\nName + Phone required\n\n<b>2. First Visit:</b>\nVitals, Symptoms, Diagnosis\n\n<b>Auto Family Detection!</b>'
                },
                roman: {
                    title: 'Registration',
                    content: 'Patient info + First visit.\nAuto family detection.'
                }
            },
            search: {
                icon: '🔍',
                ur: {
                    title: 'مریض تلاش',
                    content: '<b>تلاش کر سکتے ہیں:</b>\n• نام\n• فون\n• حوالہ نمبر\n• فیملی نمبر\n• ولدیت\n\n<b>💡 فوری Results:</b>\nٹائپ کرتے ہی نتائج!'
                },
                en: {
                    title: 'Search',
                    content: '<b>Search by:</b>\n• Name\n• Phone\n• Reference\n• Family No\n• Father name\n\nInstant results!'
                },
                roman: {
                    title: 'Search',
                    content: 'Name, Phone, Reference, Family search.\nInstant!'
                }
            },
            family_system: {
                icon: '👨‍👩‍👧‍👦',
                ur: {
                    title: 'فیملی سسٹم',
                    content: '<b>✨ خودکار پہچان:</b>\n\nSame Phone = Same Family\n\n<b>Format:</b>\nF-001, F-002, F-003...\n\n<b>فوائد:</b>\n✅ فیملی ممبرز اکٹھے\n✅ خاندانی تاریخ\n✅ آسان bulk registration'
                },
                en: {
                    title: 'Family System',
                    content: '<b>Auto Detection:</b>\nSame phone = same family\n\n<b>Format:</b>\nF-001, F-002...\n\n<b>Benefits:</b>\n✅ Family view\n✅ History tracking'
                },
                roman: {
                    title: 'Family System',
                    content: 'Auto detection.\nSame phone = same family.\nF-001 format.'
                }
            },
            diagnosis_help: {
                icon: '🔬',
                ur: {
                    title: 'تشخیصی معاون',
                    content: '<b>150+ بیماریاں, 220+ علامات</b>\n\n<b>3 مراحل:</b>\n1️⃣ کیٹگری\n2️⃣ علامات ☑️\n3️⃣ "تشخیص کریں"\n\n<b>نتائج:</b>\n🟢 90%+ = زیادہ امکان\n🟡 45-70% = درمیانی\n🔴 25-45% = کم\n\n<b>ہر بیماری کے ساتھ:</b>\n🔬 ٹیسٹ\n💊 ادویات\n⚠️ خطرے کی علامات\n📖 مشورہ'
                },
                en: {
                    title: 'Diagnosis',
                    content: '<b>150+ Diseases, 220+ Symptoms</b>\n\n<b>3 Steps:</b>\n1. Category\n2. Symptoms\n3. Analyze\n\n<b>Results include:</b>\nTests, Remedies, Red Flags, Advice'
                },
                roman: {
                    title: 'Diagnosis',
                    content: '150+ diseases.\n3 steps: Category, Symptoms, Analyze.\nComplete results.'
                }
            },
            cloud_sync: {
                icon: '☁️',
                ur: {
                    title: 'کلاؤڈ سنک',
                    content: '<b>Supabase Cloud Sync!</b>\n\n✅ خودکار محفوظ\n✅ Real-time\n✅ ہر ڈیوائس پر\n\n<b>Auto Sync:</b>\n• ہر 30 seconds\n• Internet آنے پر\n• App کھلنے پر\n\n<b>آفلائن:</b>\nLocal save → Internet آتے ہی sync'
                },
                en: {
                    title: 'Cloud Sync',
                    content: '<b>Supabase Cloud Sync!</b>\n\n✅ Auto-save\n✅ Real-time\n✅ Multi-device\n\n<b>Auto Sync:</b>\nEvery 30 seconds\n\n<b>Offline:</b>\nLocal save, sync when online'
                },
                roman: {
                    title: 'Cloud Sync',
                    content: 'Auto cloud save.\nMulti-device.\nOffline support.'
                }
            },
            backup_system: {
                icon: '💾',
                ur: {
                    title: 'بیک اپ سسٹم',
                    content: '<b>3 Layer Backup:</b>\n\n1. ☁️ Cloud (خودکار)\n2. 💾 JSON Backup\n3. 📁 GitHub Permanent\n\n<b>📦 مکمل بیک اپ:</b>\nمہینے میں 1 بار\n\n<b>🆕 صرف نئی:</b>\nہر ہفتے'
                },
                en: {
                    title: 'Backup System',
                    content: '<b>3 Layers:</b>\n1. Cloud (auto)\n2. JSON Backup\n3. GitHub\n\n<b>Full Backup:</b> Monthly\n<b>Only New:</b> Weekly'
                },
                roman: {
                    title: 'Backup',
                    content: '3 layer backup.\nFull: Monthly, Only New: Weekly.'
                }
            },
            offline_mode: {
                icon: '📱',
                ur: {
                    title: 'آفلائن موڈ',
                    content: '<b>✅ آفلائن کام:</b>\n• نئی رجسٹریشن\n• Edit/Delete\n• Search\n• Diagnosis\n\n<b>Auto Behavior:</b>\nآفلائن → Local save + Pending\nInternet → Auto sync\n\n<b>💡 Data کبھی نہیں کھوئے گا!</b>'
                },
                en: {
                    title: 'Offline Mode',
                    content: '<b>✅ Works offline:</b>\nAll features available\n\n<b>Auto:</b>\nOffline: Local save\nOnline: Auto sync\n\nData never lost!'
                },
                roman: {
                    title: 'Offline Mode',
                    content: 'Offline sab kaam.\nAuto sync jab online.\nData safe!'
                }
            }
        },
        
        faqs: [
            {
                question: {
                    ur: 'کیا ایپ آفلائن بھی کام کرے گی؟',
                    en: 'Does the app work offline?',
                    roman: 'Kya app offline kaam karti hai?'
                },
                answer: {
                    ur: '✅ <b>ہاں! مکمل!</b>\n\nآفلائن ہونے پر:\n• سب کچھ کام کرے گا\n• Local محفوظ\n• 🟡 Pending badge\n\nInternet آتے ہی خودکار sync!',
                    en: '✅ <b>Yes! Completely!</b>\n\nOffline:\n• Everything works\n• Saved locally\n• 🟡 Pending badge\n\nAuto-sync when online!',
                    roman: '✅ Han bilkul!\nOffline sab kaam.\nOnline aane par sync.'
                }
            },
            {
                question: {
                    ur: 'کیا ڈیٹا کھو تو نہیں جائے گا؟',
                    en: 'Can I lose data?',
                    roman: 'Data kho sakta hai?'
                },
                answer: {
                    ur: '❌ <b>نہیں! کبھی نہیں!</b>\n\n<b>3 Layer Protection:</b>\n1. Cloud\n2. Local Storage\n3. GitHub\n\n<b>Plus Backup فائلیں</b>\n\nمکمل محفوظ!',
                    en: '❌ <b>No! Never!</b>\n\n<b>3-Layer Protection:</b>\n1. Cloud\n2. Local Storage\n3. GitHub\n\nCompletely safe!',
                    roman: 'Nahi! Kabhi nahi!\n3 layer safety.\nData safe.'
                }
            },
            {
                question: {
                    ur: 'موبائل اور ڈیسک ٹاپ دونوں پر استعمال؟',
                    en: 'Use on both mobile and desktop?',
                    roman: 'Mobile aur desktop dono?'
                },
                answer: {
                    ur: '✅ <b>ہاں! کوئی مسئلہ نہیں!</b>\n\nLogin کریں دونوں پر\nخودکار sync\n2 seconds میں نظر آ جائے گا',
                    en: '✅ <b>Yes! No problem!</b>\n\nLogin on both.\nAuto-sync.\nAppears in 2 seconds.',
                    roman: 'Han! Login dono par.\nAuto sync.'
                }
            },
            {
                question: {
                    ur: 'فیملی نمبر کیسے دیں؟',
                    en: 'How to assign family number?',
                    roman: 'Family number kaise?'
                },
                answer: {
                    ur: '<b>3 طریقے:</b>\n\n1. خود لکھیں: F-001\n2. خالی چھوڑ دیں\n3. خودکار پہچان (same phone)\n\n<b>💡 خالی چھوڑنا آسان!</b>',
                    en: '<b>3 ways:</b>\n\n1. Enter: F-001\n2. Leave blank\n3. Auto-detect\n\n<b>Tip:</b> Leave blank!',
                    roman: '3 tarikay:\n1. Khud likhein\n2. Khali\n3. Auto detect'
                }
            },
            {
                question: {
                    ur: 'پروموٹ کا کیا مطلب ہے؟',
                    en: 'What does Promote mean?',
                    roman: 'Promote ka matlab?'
                },
                answer: {
                    ur: '<b>پروموٹ = "میں نے یہ گٹ ہب پر add کر دی"</b>\n\nنیا add کریں: 🆕 New\nGitHub پر جائے: "✅" دبائیں\nBadge: ✅ GitHub\n\n<b>فائدہ:</b>\nاگلی backup میں شامل نہیں',
                    en: '<b>Promote = "Added to GitHub"</b>\n\nAdd new: 🆕 New\nOn GitHub: Click "✅"\nBadge: ✅ GitHub\n\nExcluded from next backup',
                    roman: 'Promote = GitHub par add\nNext backup se exclude'
                }
            },
            {
                question: {
                    ur: 'بیک اپ کب لینا چاہیے؟',
                    en: 'When to take backup?',
                    roman: 'Backup kab?'
                },
                answer: {
                    ur: '<b>Schedule:</b>\n\n📅 ہفتہ وار: 🆕 صرف نئی\n📅 مہینہ وار: 📦 مکمل\n\n<b>محفوظ کریں:</b>\nGoogle Drive, Email',
                    en: '<b>Schedule:</b>\n\n📅 Weekly: Only New\n📅 Monthly: Full Backup\n\n<b>Save to:</b>\nGoogle Drive, Email',
                    roman: 'Weekly: Only New\nMonthly: Full'
                }
            }
        ],
        
        tips: [
            {
                ur: '💡 <b>Migration Wizard استعمال کریں!</b>\n\nGitHub پر بھیجنے کے لیے\n"🚀 Migration Wizard" دبائیں',
                en: '💡 <b>Use Migration Wizard!</b>\n\nFor GitHub push\nClick "🚀 Migration Wizard"',
                roman: '💡 Migration Wizard use karein!'
            },
            {
                ur: '💡 <b>ہفتہ وار بیک اپ!</b>\n\nہر اتوار "🆕 صرف نئی بیک اپ"\nGoogle Drive پر save',
                en: '💡 <b>Weekly Backup!</b>\n\nSunday: "🆕 Only New"\nSave on Google Drive',
                roman: '💡 Weekly backup!'
            },
            {
                ur: '💡 <b>فیملی نمبر خالی!</b>\n\nSame phone = خودکار پہچان',
                en: '💡 <b>Leave Family No blank!</b>\n\nAuto-detects from phone',
                roman: '💡 Family No khali chhorein!'
            },
            {
                ur: '💡 <b>Copy to Visit!</b>\n\nتشخیص میں match\n"📋 Copy to Visit" دبائیں\nخودکار fill',
                en: '💡 <b>Copy to Visit!</b>\n\nAfter diagnosis match\nClick "📋 Copy to Visit"',
                roman: '💡 Copy to Visit!'
            },
            {
                ur: '💡 <b>Cleanup ضرور کریں!</b>\n\nGitHub push کے بعد\nCloud صاف رکھیں',
                en: '💡 <b>Always Cleanup!</b>\n\nAfter GitHub push\nKeep cloud clean',
                roman: '💡 Cleanup zaruri!'
            }
        ],
        
        shortcuts: {
            ur: {
                title: '⌨️ کی بورڈ شارٹ کٹس',
                note: '💡 سیٹنگز سے آن/آف کر سکتے ہیں',
                items: [
                    { key: '?', action: 'مدد سینٹر' },
                    { key: 'H', action: 'ہسٹری' },
                    { key: 'B', action: 'بیک اپ' },
                    { key: 'N', action: 'نئی رجسٹریشن' },
                    { key: 'S', action: 'تلاش' },
                    { key: 'D', action: 'ڈیش بورڈ' },
                    { key: 'A', action: 'تمام مریض' },
                    { key: 'X', action: 'تشخیص' },
                    { key: 'Esc', action: 'ماڈل بند' }
                ]
            },
            en: {
                title: '⌨️ Keyboard Shortcuts',
                note: '💡 Toggle in Settings',
                items: [
                    { key: '?', action: 'Help Center' },
                    { key: 'H', action: 'History' },
                    { key: 'B', action: 'Backup' },
                    { key: 'N', action: 'New Registration' },
                    { key: 'S', action: 'Search' },
                    { key: 'D', action: 'Dashboard' },
                    { key: 'A', action: 'All Patients' },
                    { key: 'X', action: 'Diagnosis' },
                    { key: 'Esc', action: 'Close Modal' }
                ]
            },
            roman: {
                title: '⌨️ Shortcuts',
                note: '💡 Settings se toggle',
                items: [
                    { key: '?', action: 'Help' },
                    { key: 'H', action: 'History' },
                    { key: 'B', action: 'Backup' },
                    { key: 'N', action: 'New' },
                    { key: 'S', action: 'Search' },
                    { key: 'D', action: 'Dashboard' },
                    { key: 'A', action: 'All Patients' },
                    { key: 'X', action: 'Diagnosis' },
                    { key: 'Esc', action: 'Close' }
                ]
            }
        }
    };
    
    window.HELP_CONTENT = HELP_CONTENT;
    
    // ==========================================
    // PREFERENCES
    // ==========================================
    var DEFAULT_PREFS = {
        showTour: true,
        keyboardShortcuts: true,
        showTips: true,
        showTooltips: true,
        tourCompleted: false
    };
    
    function getPreferences() {
        try {
            var saved = localStorage.getItem('help_preferences');
            return saved ? Object.assign({}, DEFAULT_PREFS, JSON.parse(saved)) : DEFAULT_PREFS;
        } catch(e) {
            return DEFAULT_PREFS;
        }
    }
    
    function savePreferences(prefs) {
        try {
            localStorage.setItem('help_preferences', JSON.stringify(prefs));
            return true;
        } catch(e) {
            return false;
        }
    }
    
    function updatePreference(key, value) {
        var prefs = getPreferences();
        prefs[key] = value;
        savePreferences(prefs);
        return prefs;
    }
    
    window.getPreferences = getPreferences;
    window.updatePreference = updatePreference;
    
    // ==========================================
    // LANGUAGE
    // ==========================================
    function getCurrentLang() {
        try {
            return localStorage.getItem('clinic_lang') || 'ur';
        } catch(e) {
            return 'ur';
        }
    }
    
    function getContent(contentObj) {
        var lang = getCurrentLang();
        if (contentObj && contentObj[lang]) return contentObj[lang];
        if (contentObj && contentObj.ur) return contentObj.ur;
        return null;
    }
    
    // ==========================================
    // TOOLTIPS
    // ==========================================
    var currentTooltip = null;
    var tooltipTimeout = null;
    
    function createTooltip(element, text) {
        removeTooltip();
        
        var tooltip = document.createElement('div');
        tooltip.className = 'help-tooltip';
        tooltip.innerHTML = text;
        tooltip.style.cssText = 'position:fixed;background:#2c3e50;color:white;padding:8px 14px;border-radius:6px;font-size:13px;font-family:inherit;z-index:9999;pointer-events:none;opacity:0;transition:opacity 0.2s;box-shadow:0 4px 15px rgba(0,0,0,0.2);max-width:300px;text-align:center;line-height:1.5;';
        
        document.body.appendChild(tooltip);
        
        var rect = element.getBoundingClientRect();
        var tooltipRect = tooltip.getBoundingClientRect();
        
        var top = rect.bottom + 8;
        var left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        
        if (left < 10) left = 10;
        if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
        }
        if (top + tooltipRect.height > window.innerHeight - 10) {
            top = rect.top - tooltipRect.height - 8;
        }
        
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
        
        setTimeout(function() { tooltip.style.opacity = '1'; }, 10);
        
        currentTooltip = tooltip;
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
        
        var buttonData = HELP_CONTENT.buttons[tooltipKey];
        if (!buttonData) return;
        
        element.addEventListener('mouseenter', function() {
            if (!getPreferences().showTooltips) return;
            var tooltip = getContent(buttonData.tooltip);
            if (!tooltip) return;
            tooltipTimeout = setTimeout(function() {
                createTooltip(element, tooltip);
            }, 500);
        });
        
        element.addEventListener('mouseleave', removeTooltip);
    }
    
    // ==========================================
    // INFO MODAL
    // ==========================================
    function createInfoModal() {
        if (document.getElementById('helpInfoModal')) return;
        
        var modal = document.createElement('div');
        modal.id = 'helpInfoModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = '<div class="modal" style="max-width:600px;"><div class="modal-title"><span id="helpInfoTitle">ℹ️ معلومات</span><button class="modal-close" onclick="closeHelpInfoModal()">✕</button></div><div id="helpInfoContent" style="line-height:1.8;font-size:14px;white-space:pre-wrap;"></div><div class="action-buttons" style="margin-top:20px;"><button class="btn btn-primary" onclick="closeHelpInfoModal()" id="helpInfoOkBtn">✅ ٹھیک ہے</button></div></div>';
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeHelpInfoModal();
        });
    }
    
    window.showInfoModal = function(buttonKey) {
        createInfoModal();
        
        var buttonData = HELP_CONTENT.buttons[buttonKey];
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
        var modal = document.getElementById('helpInfoModal');
        if (modal) modal.classList.remove('active');
    };
    
    // ==========================================
    // ADD INFO ICONS
    // ==========================================
    function addInfoIcon(buttonElement, buttonKey) {
        if (!buttonElement) return;
        if (buttonElement.querySelector('.help-info-icon')) return;
        
        attachTooltip(buttonElement, buttonKey);
        
        var infoIcon = document.createElement('span');
        infoIcon.className = 'help-info-icon';
        infoIcon.innerHTML = 'ⓘ';
        infoIcon.style.cssText = 'display:inline-block;margin:0 5px;color:#17a2b8;cursor:pointer;font-size:14px;font-weight:bold;padding:2px 4px;border-radius:50%;background:rgba(23,162,184,0.1);transition:all 0.2s;vertical-align:middle;';
        infoIcon.title = 'More info';
        
        infoIcon.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showInfoModal(buttonKey);
        });
        
        buttonElement.appendChild(infoIcon);
    }
    
    function attachAllHelpIcons() {
        var buttonMap = [
            { selector: 'button[onclick*="openAddCategoryModal()"]', key: 'category' },
            { selector: 'button[onclick*="openAddSymptomModal()"]', key: 'symptom' },
            { selector: 'button[onclick*="openAddDiseaseModal()"]', key: 'disease' },
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
            var buttons = document.querySelectorAll(item.selector);
            buttons.forEach(function(btn) {
                addInfoIcon(btn, item.key);
            });
        });
    }
    
    function watchForSettingsPage() {
        setInterval(function() {
            var settingsPage = document.querySelector('#page-settings.active');
            if (settingsPage) {
                attachAllHelpIcons();
            }
        }, 2000);
    }
    
    // ==========================================
    // TOUR
    // ==========================================
    var currentTourStep = 0;
    
    function createTourOverlay() {
        if (document.getElementById('helpTourOverlay')) return;
        
        var overlay = document.createElement('div');
        overlay.id = 'helpTourOverlay';
        overlay.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:9998;justify-content:center;align-items:center;padding:20px;';
        
        overlay.innerHTML = '<div id="helpTourBox" style="background:white;border-radius:15px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;padding:25px;box-shadow:0 20px 60px rgba(0,0,0,0.4);font-family:inherit;"><div id="helpTourHeader" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;padding-bottom:12px;border-bottom:2px solid #ecf0f1;"><h3 id="helpTourTitle" style="color:#1a5276;margin:0;font-size:18px;">Title</h3><button onclick="closeTour()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#7f8c8d;">✕</button></div><div id="helpTourBody" style="line-height:1.8;font-size:14px;color:#2c3e50;margin-bottom:20px;white-space:pre-wrap;"></div><div id="helpTourProgress" style="text-align:center;color:#7f8c8d;font-size:12px;margin-bottom:15px;"></div><div id="helpTourButtons" style="display:flex;gap:8px;justify-content:space-between;flex-wrap:wrap;"></div></div>';
        
        document.body.appendChild(overlay);
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
        
        var welcome = getContent(HELP_CONTENT.tour.welcome);
        var lang = getCurrentLang();
        
        document.getElementById('helpTourTitle').textContent = welcome.title;
        document.getElementById('helpTourBody').innerHTML = '<div style="text-align:center;font-size:16px;font-weight:bold;color:#8e44ad;margin-bottom:15px;">' + welcome.heading + '</div><div style="white-space:pre-wrap;">' + welcome.content + '</div>';
        document.getElementById('helpTourProgress').textContent = '';
        
        var btnTexts = {
            ur: { full: '🎓 مکمل ٹور', skip: '❌ ابھی نہیں' },
            en: { full: '🎓 Start Tour', skip: '❌ Skip' },
            roman: { full: '🎓 Tour Start', skip: '❌ Skip' }
        };
        var btns = btnTexts[lang] || btnTexts.ur;
        
        document.getElementById('helpTourButtons').innerHTML = '<button class="btn btn-primary" onclick="startTour()" style="flex:1;">' + btns.full + '</button><button class="btn btn-light" onclick="skipTourPermanently()" style="flex:1;">' + btns.skip + '</button>';
    };
    
    function showTourStep() {
        var steps = HELP_CONTENT.tour.steps;
        if (currentTourStep >= steps.length) {
            completeTour();
            return;
        }
        
        var step = steps[currentTourStep];
        var content = getContent(step.content);
        var lang = getCurrentLang();
        
        document.getElementById('helpTourTitle').textContent = content.title;
        document.getElementById('helpTourBody').innerHTML = content.body;
        
        var progressTexts = {
            ur: 'مرحلہ ' + (currentTourStep + 1) + ' / ' + steps.length,
            en: 'Step ' + (currentTourStep + 1) + ' of ' + steps.length,
            roman: 'Step ' + (currentTourStep + 1) + ' / ' + steps.length
        };
        document.getElementById('helpTourProgress').textContent = progressTexts[lang] || progressTexts.ur;
        
        var btnTexts = {
            ur: { prev: '◀ پیچھے', next: 'آگے ▶', close: 'بند', finish: '🎉 مکمل' },
            en: { prev: '◀ Previous', next: 'Next ▶', close: 'Close', finish: '🎉 Finish' },
            roman: { prev: '◀ Peechay', next: 'Aagay ▶', close: 'Close', finish: '🎉 Finish' }
        };
        var btns = btnTexts[lang] || btnTexts.ur;
        
        var isLast = currentTourStep === steps.length - 1;
        var isFirst = currentTourStep === 0;
        
        var buttonsHTML = '';
        if (!isFirst) {
            buttonsHTML += '<button class="btn btn-light" onclick="prevTourStep()">' + btns.prev + '</button>';
        } else {
            buttonsHTML += '<span></span>';
        }
        buttonsHTML += '<button class="btn btn-light btn-sm" onclick="closeTour()" style="opacity:0.7;">' + btns.close + '</button>';
        if (isLast) {
            buttonsHTML += '<button class="btn btn-success" onclick="completeTour()">' + btns.finish + '</button>';
        } else {
            buttonsHTML += '<button class="btn btn-primary" onclick="nextTourStep()">' + btns.next + '</button>';
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
    
    window.closeTour = function() {
        var overlay = document.getElementById('helpTourOverlay');
        if (overlay) overlay.style.display = 'none';
    };
    
    window.completeTour = function() {
        updatePreference('tourCompleted', true);
        closeTour();
        
        var lang = getCurrentLang();
        var msgs = {
            ur: '🎉 ٹور مکمل!',
            en: '🎉 Tour completed!',
            roman: '🎉 Tour complete!'
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
    // HELP CENTER
    // ==========================================
    function createHelpCenterModal() {
        if (document.getElementById('helpCenterModal')) return;
        
        var modal = document.createElement('div');
        modal.id = 'helpCenterModal';
        modal.className = 'modal-overlay';
        modal.innerHTML = '<div class="modal" style="max-width:750px;"><div class="modal-title"><span id="helpCenterTitle">📚 مدد سینٹر</span><button class="modal-close" onclick="closeHelpCenter()">✕</button></div><div id="helpCenterContent"></div></div>';
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
        var modal = document.getElementById('helpCenterModal');
        if (modal) modal.classList.remove('active');
    };
    
    function renderHelpCenter() {
        var lang = getCurrentLang();
        var titles = {
            ur: '📚 مدد اور رہنمائی مرکز',
            en: '📚 Help & Guidance Center',
            roman: '📚 Help Center'
        };
        document.getElementById('helpCenterTitle').innerHTML = titles[lang] || titles.ur;
        
        var labels = {
            ur: { tour: '🎓 ٹور شروع کریں', sections: '📖 حصے', buttons: '🔘 بٹنز', faqs: '❓ سوالات', tips: '💡 مشورے', shortcuts: '⌨️ شارٹ کٹس', close: 'بند کریں' },
            en: { tour: '🎓 Start Tour', sections: '📖 Sections', buttons: '🔘 Buttons', faqs: '❓ FAQs', tips: '💡 Tips', shortcuts: '⌨️ Shortcuts', close: 'Close' },
            roman: { tour: '🎓 Tour', sections: '📖 Sections', buttons: '🔘 Buttons', faqs: '❓ FAQs', tips: '💡 Tips', shortcuts: '⌨️ Shortcuts', close: 'Close' }
        };
        var l = labels[lang] || labels.ur;
        
        var html = '<div style="max-height:70vh;overflow-y:auto;">';
        
        // Tour
        html += '<div style="background:#f4ecf7;padding:12px;border-radius:8px;margin-bottom:12px;">';
        html += '<button class="btn btn-purple btn-sm" onclick="closeHelpCenter();showTourWelcome();">' + l.tour + '</button>';
        html += '</div>';
        
        // Sections
        html += '<div style="margin-bottom:15px;"><h4 style="color:#1a5276;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">' + l.sections + '</h4><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;">';
        Object.keys(HELP_CONTENT.helpCenter).forEach(function(key) {
            var item = HELP_CONTENT.helpCenter[key];
            var content = getContent(item);
            if (!content) return;
            html += '<button onclick="showHelpTopic(\'' + key + '\')" style="padding:10px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;font-family:inherit;font-size:13px;display:flex;align-items:center;gap:6px;"><span style="font-size:18px;">' + item.icon + '</span><span>' + content.title + '</span></button>';
        });
        html += '</div></div>';
        
        // Buttons
        html += '<div style="margin-bottom:15px;"><h4 style="color:#8e44ad;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">' + l.buttons + '</h4><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:6px;">';
        Object.keys(HELP_CONTENT.buttons).forEach(function(key) {
            var item = HELP_CONTENT.buttons[key];
            var modal = getContent(item.modal);
            if (!modal) return;
            html += '<button onclick="closeHelpCenter();showInfoModal(\'' + key + '\')" style="padding:8px;border:1px solid #ddd;border-radius:6px;background:white;cursor:pointer;font-family:inherit;font-size:12px;display:flex;align-items:center;gap:6px;"><span style="font-size:16px;">' + modal.icon + '</span><span>' + modal.title + '</span></button>';
        });
        html += '</div></div>';
        
        // FAQs
        html += '<div style="margin-bottom:15px;"><h4 style="color:#f39c12;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">' + l.faqs + '</h4>';
        HELP_CONTENT.faqs.forEach(function(faq, idx) {
            var q = getContent(faq.question);
            var a = getContent(faq.answer);
            if (!q || !a) return;
            html += '<div style="background:#f8f9fa;border-radius:6px;margin-bottom:8px;overflow:hidden;"><div onclick="toggleFaq(' + idx + ')" style="padding:10px 12px;cursor:pointer;font-weight:bold;color:#2c3e50;font-size:13px;">❓ ' + q + '</div><div id="faqAnswer' + idx + '" style="display:none;padding:12px;background:white;border-top:1px solid #ecf0f1;line-height:1.6;font-size:13px;white-space:pre-wrap;">' + a + '</div></div>';
        });
        html += '</div>';
        
        // Tips
        html += '<div style="margin-bottom:15px;"><h4 style="color:#27ae60;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">' + l.tips + '</h4>';
        HELP_CONTENT.tips.forEach(function(tip) {
            var content = getContent(tip);
            if (!content) return;
            html += '<div style="background:linear-gradient(135deg,#d4edda,#c3e6cb);padding:10px 12px;border-radius:6px;margin-bottom:6px;font-size:13px;line-height:1.6;white-space:pre-wrap;">' + content + '</div>';
        });
        html += '</div>';
        
        // Shortcuts
        var shortcuts = getContent(HELP_CONTENT.shortcuts);
        if (shortcuts) {
            html += '<div style="margin-bottom:15px;"><h4 style="color:#17a2b8;margin-bottom:10px;border-bottom:2px solid #ecf0f1;padding-bottom:5px;">' + l.shortcuts + '</h4>';
            html += '<div style="background:#d1ecf1;padding:8px 12px;border-radius:6px;margin-bottom:10px;font-size:12px;">' + shortcuts.note + '</div>';
            html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;">';
            shortcuts.items.forEach(function(item) {
                html += '<div style="display:flex;justify-content:space-between;padding:8px 12px;background:white;border:1px solid #ddd;border-radius:6px;font-size:12px;"><kbd style="background:#2c3e50;color:white;padding:2px 8px;border-radius:4px;font-weight:bold;">' + item.key + '</kbd><span>' + item.action + '</span></div>';
            });
            html += '</div></div>';
        }
        
        html += '</div><div class="action-buttons" style="margin-top:15px;"><button class="btn btn-light" onclick="closeHelpCenter()">' + l.close + '</button></div>';
        
        document.getElementById('helpCenterContent').innerHTML = html;
    }
    
    window.toggleFaq = function(idx) {
        var answer = document.getElementById('faqAnswer' + idx);
        if (answer.style.display === 'none') {
            answer.style.display = 'block';
        } else {
            answer.style.display = 'none';
        }
    };
    
    window.showHelpTopic = function(topicKey) {
        var topic = HELP_CONTENT.helpCenter[topicKey];
        if (!topic) return;
        
        var content = getContent(topic);
        if (!content) return;
        
        var lang = getCurrentLang();
        var backLabels = { ur: '◀ واپس', en: '◀ Back', roman: '◀ Back' };
        
        var html = '<div style="max-height:70vh;overflow-y:auto;"><div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:15px;"><h3 style="color:#1a5276;margin-bottom:10px;display:flex;align-items:center;gap:8px;"><span style="font-size:24px;">' + topic.icon + '</span><span>' + content.title + '</span></h3></div><div style="line-height:1.8;font-size:14px;white-space:pre-wrap;padding:0 5px;">' + content.content + '</div></div><div class="action-buttons" style="margin-top:15px;"><button class="btn btn-light" onclick="renderHelpCenter()">' + backLabels[lang] + '</button><button class="btn btn-primary" onclick="closeHelpCenter()">Close</button></div>';
        
        document.getElementById('helpCenterContent').innerHTML = html;
    };
    
    // ==========================================
    // TIPS
    // ==========================================
    var currentTipIndex = 0;
    
    window.showTipOfTheDay = function() {
        var prefs = getPreferences();
        if (!prefs.showTips) return;
        
        var tips = HELP_CONTENT.tips;
        var tip = tips[currentTipIndex % tips.length];
        var content = getContent(tip);
        if (!content) return;
        
        var modal = document.getElementById('tipsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'tipsModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = '<div class="modal" style="max-width:450px;"><div class="modal-title"><span>💡 آج کا مشورہ</span><button class="modal-close" onclick="closeTipsModal()">✕</button></div><div id="tipsContent" style="line-height:1.8;font-size:14px;padding:10px 0;white-space:pre-wrap;"></div><div class="action-buttons" style="margin-top:15px;"><button class="btn btn-primary" onclick="nextTip()">⏭️ اگلا</button><button class="btn btn-success" onclick="closeTipsModal()">✅ سمجھ گیا</button></div></div>';
            document.body.appendChild(modal);
        }
        
        document.getElementById('tipsContent').innerHTML = content;
        modal.classList.add('active');
    };
    
    window.nextTip = function() {
        currentTipIndex++;
        showTipOfTheDay();
    };
    
    window.closeTipsModal = function() {
        var modal = document.getElementById('tipsModal');
        if (modal) modal.classList.remove('active');
    };
    
    // ==========================================
    // PREFERENCES MODAL
    // ==========================================
    window.openPreferencesModal = function() {
        var modal = document.getElementById('preferencesModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'preferencesModal';
            modal.className = 'modal-overlay';
            modal.innerHTML = '<div class="modal" style="max-width:500px;"><div class="modal-title"><span>⚙️ ترجیحات</span><button class="modal-close" onclick="closePreferencesModal()">✕</button></div><div id="prefsContent"></div></div>';
            document.body.appendChild(modal);
        }
        
        renderPreferences();
        modal.classList.add('active');
    };
    
    window.closePreferencesModal = function() {
        var modal = document.getElementById('preferencesModal');
        if (modal) modal.classList.remove('active');
    };
    
    function renderPreferences() {
        var prefs = getPreferences();
        var lang = getCurrentLang();
        
        var labels = {
            ur: {
                tour: { name: '🎓 پہلی بار ٹور', desc: 'اگلی بار خودکار شروع' },
                shortcuts: { name: '⌨️ کی بورڈ شارٹ کٹس', desc: '? = مدد، H = ہسٹری' },
                tips: { name: '💡 آج کا مشورہ', desc: 'روزانہ نیا مشورہ' },
                tooltips: { name: '🎨 ٹول ٹپ', desc: 'ماؤس ہوور پر معلومات' },
                close: 'بند کریں'
            },
            en: {
                tour: { name: '🎓 First-time Tour', desc: 'Auto-start next time' },
                shortcuts: { name: '⌨️ Keyboard Shortcuts', desc: '? = Help, H = History' },
                tips: { name: '💡 Tip of the Day', desc: 'Show new tip daily' },
                tooltips: { name: '🎨 Tooltips', desc: 'Info on hover' },
                close: 'Close'
            },
            roman: {
                tour: { name: '🎓 Tour', desc: 'Auto-start' },
                shortcuts: { name: '⌨️ Shortcuts', desc: '? = Help' },
                tips: { name: '💡 Tips', desc: 'Daily tip' },
                tooltips: { name: '🎨 Tooltips', desc: 'Hover info' },
                close: 'Close'
            }
        };
        var l = labels[lang] || labels.ur;
        
        var items = [
            { key: 'showTour', label: l.tour },
            { key: 'keyboardShortcuts', label: l.shortcuts },
            { key: 'showTips', label: l.tips },
            { key: 'showTooltips', label: l.tooltips }
        ];
        
        var html = '<div style="padding:10px 0;">';
        
        items.forEach(function(item) {
            var isOn = prefs[item.key];
            html += '<div style="background:#f8f9fa;padding:12px;border-radius:8px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;gap:12px;">';
            html += '<div style="flex:1;"><div style="font-weight:bold;color:#2c3e50;margin-bottom:4px;">' + item.label.name + '</div><div style="font-size:12px;color:#7f8c8d;">' + item.label.desc + '</div></div>';
            html += '<label style="cursor:pointer;position:relative;display:inline-block;width:60px;height:30px;">';
            html += '<input type="checkbox" ' + (isOn ? 'checked' : '') + ' onchange="togglePreference(\'' + item.key + '\', this.checked)" style="opacity:0;width:0;height:0;">';
            html += '<span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:' + (isOn ? '#27ae60' : '#95a5a6') + ';border-radius:34px;transition:0.3s;"><span style="position:absolute;height:24px;width:24px;left:' + (isOn ? '33px' : '3px') + ';bottom:3px;background:white;border-radius:50%;transition:0.3s;"></span></span>';
            html += '</label></div>';
        });
        
        html += '</div><div class="action-buttons" style="margin-top:15px;"><button class="btn btn-primary" onclick="closePreferencesModal()">' + l.close + '</button></div>';
        
        document.getElementById('prefsContent').innerHTML = html;
    }
    
    window.togglePreference = function(key, value) {
        updatePreference(key, value);
        setTimeout(renderPreferences, 100);
        
        if (typeof showToast === 'function') {
            showToast(value ? '✅ آن' : '❌ آف');
        }
    };
    
    // ==========================================
    // KEYBOARD SHORTCUTS
    // ==========================================
    function handleKeyboardShortcut(e) {
        var prefs = getPreferences();
        if (!prefs.keyboardShortcuts) return;
        
        var tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        
        if (document.querySelector('.modal-overlay.active')) {
            if (e.key === 'Escape') {
                var modals = document.querySelectorAll('.modal-overlay.active');
                if (modals.length > 0) {
                    modals[modals.length - 1].classList.remove('active');
                }
            }
            return;
        }
        
        var key = e.key.toLowerCase();
        
        switch(key) {
            case '?':
            case '/':
                e.preventDefault();
                openHelpCenter();
                break;
            case 'h':
                if (typeof viewHistory === 'function') { e.preventDefault(); viewHistory(); }
                break;
            case 'b':
                if (typeof exportCustomData === 'function') { e.preventDefault(); exportCustomData(); }
                break;
            case 'n':
                e.preventDefault();
                var newBtn = document.querySelector('[data-page="newPatient"]');
                if (newBtn) newBtn.click();
                break;
            case 's':
                e.preventDefault();
                var searchBtn = document.querySelector('[data-page="searchPatient"]');
                if (searchBtn) searchBtn.click();
                break;
            case 'd':
                e.preventDefault();
                var dashBtn = document.querySelector('[data-page="dashboard"]');
                if (dashBtn) dashBtn.click();
                break;
            case 'a':
                e.preventDefault();
                var allBtn = document.querySelector('[data-page="allPatients"]');
                if (allBtn) allBtn.click();
                break;
            case 'x':
                e.preventDefault();
                var diagBtn = document.querySelector('[data-page="diagnosis"]');
                if (diagBtn) diagBtn.click();
                break;
        }
    }
    
    // ==========================================
    // HELP BUTTON IN HEADER
    // ==========================================
    function addHelpButtonToHeader() {
        var header = document.querySelector('.header-right');
        if (!header) return;
        if (document.getElementById('helpCenterBtn')) return;
        
        var helpBtn = document.createElement('button');
        helpBtn.id = 'helpCenterBtn';
        helpBtn.className = 'icon-btn';
        helpBtn.title = 'Help Center (?)';
        helpBtn.innerHTML = '❓';
        helpBtn.style.background = 'rgba(52,152,219,0.4)';
        helpBtn.onclick = openHelpCenter;
        
        var backupBtn = document.getElementById('backupBtn');
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
        
        document.addEventListener('keydown', handleKeyboardShortcut);
        
        setTimeout(addHelpButtonToHeader, 2000);
        watchForSettingsPage();
        
        setTimeout(function() {
            var prefs = getPreferences();
            if (prefs.showTour && !prefs.tourCompleted) {
                showTourWelcome();
            }
        }, 3000);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        setTimeout(initialize, 500);
    }
    
    console.log('✅ Help System v2 - COMPLETE');

})();