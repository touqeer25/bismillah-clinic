// ==========================================
// Bismillah Clinic - Custom Extensions
// ==========================================
// یہاں اپنی categories، diseases، اور symptoms
// شامل کریں - Main فائل کو نہ چھیڑیں
// ==========================================

// ⏳ Wait for main file to load
(function() {
    'use strict';
    
    if (typeof window.SYMPTOMS_DB === 'undefined' || 
        typeof window.DISEASES_DB === 'undefined' || 
        typeof window.CATEGORIES_DB === 'undefined') {
        console.error('❌ Main diagnosis-data.js not loaded first!');
        return;
    }

    console.log('📦 Loading custom extensions...');

    // ==========================================
    // 🔹 نئی CATEGORIES یہاں add کریں
    // ==========================================
    const CUSTOM_CATEGORIES = {
        // مثال - آپ اپنی categories add کریں:
        
        dental: {
            ur: 'دانت',
            en: 'Dental',
            roman: 'Daant',
            icon: '🦷'
        },
        
        emergency: {
            ur: 'ایمرجنسی',
            en: 'Emergency',
            roman: 'Emergency',
            icon: '🚨'
        },
        
        elderly: {
            ur: 'بوڑھوں کی',
            en: 'Geriatric',
            roman: 'Buzurgon ki',
            icon: '👴'
        },
        
        sexual_health: {
            ur: 'جنسی صحت',
            en: 'Sexual Health',
            roman: 'Sexual Health',
            icon: '❤️'
        },
        
        // اپنی مزید categories یہاں add کریں...
        // مثلاً:
        /*
        my_category: {
            ur: 'میری کیٹگری',
            en: 'My Category',
            roman: 'Meri Category',
            icon: '📌'
        },
        */
    };

    // ==========================================
    // 🔹 نئی SYMPTOMS یہاں add کریں
    // ==========================================
    const CUSTOM_SYMPTOMS = {
        // مثال - آپ اپنی symptoms add کریں:
        
        // Dental symptoms
        gum_bleeding: { 
            ur: 'مسوڑھوں سے خون', 
            en: 'Gum Bleeding', 
            roman: 'Masoron se Khoon', 
            category: 'dental' 
        },
        tooth_sensitivity: { 
            ur: 'دانتوں کی حساسیت', 
            en: 'Tooth Sensitivity', 
            roman: 'Daanton ki Hassasiyat', 
            category: 'dental' 
        },
        
        // Emergency symptoms
        severe_bleeding: { 
            ur: 'شدید خون بہنا', 
            en: 'Severe Bleeding', 
            roman: 'Shadeed Khoon', 
            category: 'emergency', 
            severe: true 
        },
        cardiac_arrest_signs: { 
            ur: 'دل بند ہونے کی علامات', 
            en: 'Cardiac Arrest Signs', 
            roman: 'Dil band hone ki alamat', 
            category: 'emergency', 
            severe: true 
        },
        
        // اپنی مزید symptoms یہاں add کریں...
    };

    // ==========================================
    // 🔹 نئی DISEASES یہاں add کریں
    // ==========================================
    const CUSTOM_DISEASES = [
        // مثال - آپ اپنی diseases add کریں:
        
        {
            id: 'dental_caries',
            name: { 
                ur: 'دانتوں میں کیڑا', 
                en: 'Dental Caries', 
                roman: 'Daanton mein Keera' 
            },
            category: 'dental',
            symptoms: ['tooth_pain', 'tooth_sensitivity', 'bad_breath'],
            keySymptoms: ['tooth_pain'],
            tests: [
                { ur: 'Dental Examination', en: 'Dental Examination' },
                { ur: 'Dental X-Ray', en: 'Dental X-Ray' }
            ],
            redFlags: ['high_fever', 'facial_paralysis'],
            remedies: [
                { name: 'Plantago 30', use: { ur: 'اہم دانت درد', en: 'Main tooth pain' }, dose: '3 hourly' },
                { name: 'Kreosotum 30', use: { ur: 'گلا سڑا دانت', en: 'Decayed tooth' }, dose: '3 times daily' },
                { name: 'Silicea 6X', use: { ur: 'دانت مضبوطی', en: 'Tooth strength' }, dose: 'Daily' }
            ],
            advice: { 
                ur: 'دانت صاف کریں، مٹھائی کم، دانتوں کا ڈاکٹر۔', 
                en: 'Brush teeth, less sweets, dentist.' 
            }
        },
        
        {
            id: 'heat_stroke',
            name: { 
                ur: 'لو لگنا', 
                en: 'Heat Stroke', 
                roman: 'Lu Lagna' 
            },
            category: 'emergency',
            symptoms: ['high_fever', 'headache', 'dizziness', 'nausea', 'weakness', 'confusion'],
            keySymptoms: ['high_fever', 'confusion'],
            tests: [
                { ur: 'Body temperature', en: 'Body temperature' },
                { ur: 'Electrolytes', en: 'Electrolytes' }
            ],
            redFlags: ['unconscious', 'seizure', 'confusion'],
            remedies: [
                { name: 'Glonoine 30', use: { ur: 'اہم لو کی دوا', en: 'Main for heat stroke' }, dose: 'SOS' },
                { name: 'Belladonna 200', use: { ur: 'سرخ چہرہ', en: 'Red face' }, dose: '2 hourly' },
                { name: 'Natrum Carb 30', use: { ur: 'کمزوری', en: 'Weakness' }, dose: '3 times daily' }
            ],
            advice: { 
                ur: '⚠️ ٹھنڈی جگہ، پانی، ORS، فوری ڈاکٹر۔', 
                en: '⚠️ Cool place, water, ORS, urgent doctor.' 
            }
        },
        
        {
            id: 'sexual_weakness',
            name: { 
                ur: 'جنسی کمزوری', 
                en: 'Sexual Weakness', 
                roman: 'Jinsi Kamzori' 
            },
            category: 'sexual_health',
            symptoms: ['weakness', 'fatigue', 'anxiety', 'depression'],
            keySymptoms: ['weakness'],
            tests: [
                { ur: 'Hormones (Testosterone)', en: 'Hormones' },
                { ur: 'Blood Sugar', en: 'Blood Sugar' },
                { ur: 'Thyroid', en: 'Thyroid' }
            ],
            redFlags: [],
            remedies: [
                { name: 'Damiana Q', use: { ur: 'عمومی ٹانک', en: 'General tonic' }, dose: '10 drops thrice' },
                { name: 'Agnus Castus 200', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Weekly' },
                { name: 'Selenium 30', use: { ur: 'ذہنی/جسمانی کمزوری', en: 'Mental/physical' }, dose: 'Daily' },
                { name: 'Ashwagandha Q', use: { ur: 'ٹانک', en: 'Tonic' }, dose: '10 drops thrice' }
            ],
            advice: { 
                ur: 'ورزش، اچھی خوراک، ذہنی سکون، ماہر ڈاکٹر۔', 
                en: 'Exercise, good diet, stress relief.' 
            }
        }
        
        // اپنی مزید diseases یہاں add کریں...
    ];

    // ==========================================
    // 🔧 خودکار Merge (کچھ نہ چھیڑیں)
    // ==========================================
    
    // Categories add کریں
    Object.assign(window.CATEGORIES_DB, CUSTOM_CATEGORIES);
    
    // Symptoms add کریں
    Object.assign(window.SYMPTOMS_DB, CUSTOM_SYMPTOMS);
    
    // Diseases add کریں (duplicates check کریں)
    CUSTOM_DISEASES.forEach(function(disease) {
        const exists = window.DISEASES_DB.find(function(d) { 
            return d.id === disease.id; 
        });
        if (!exists) {
            window.DISEASES_DB.push(disease);
        } else {
            console.warn('⚠️ Duplicate disease ID:', disease.id);
        }
    });
    
    console.log('✅ Custom extensions loaded:');
    console.log('   - Categories added:', Object.keys(CUSTOM_CATEGORIES).length);
    console.log('   - Symptoms added:', Object.keys(CUSTOM_SYMPTOMS).length);
    console.log('   - Diseases added:', CUSTOM_DISEASES.length);
    console.log('   - Total diseases now:', window.DISEASES_DB.length);
    console.log('   - Total categories now:', Object.keys(window.CATEGORIES_DB).length);
    
})();