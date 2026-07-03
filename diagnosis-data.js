// ==========================================
// Bismillah Clinic - Diagnosis Database
// 30+ Diseases with Symptoms, Tests, Remedies
// ==========================================

const SYMPTOMS_DB = {
    // General
    fever: { ur: 'بخار', en: 'Fever', roman: 'Bukhar', category: 'general' },
    high_fever: { ur: 'تیز بخار (104°F+)', en: 'High Fever', roman: 'Tez Bukhar', category: 'general', severe: true },
    chills: { ur: 'سردی لگنا', en: 'Chills', roman: 'Sardi Lagna', category: 'general' },
    sweating: { ur: 'پسینہ', en: 'Sweating', roman: 'Paseena', category: 'general' },
    weakness: { ur: 'کمزوری', en: 'Weakness', roman: 'Kamzori', category: 'general' },
    body_ache: { ur: 'جسم درد', en: 'Body Ache', roman: 'Jism Dard', category: 'general' },
    fatigue: { ur: 'تھکاوٹ', en: 'Fatigue', roman: 'Thakawat', category: 'general' },
    loss_appetite: { ur: 'بھوک کم', en: 'Loss of Appetite', roman: 'Bhook Kam', category: 'general' },
    
    // Head & Neurological
    headache: { ur: 'سر درد', en: 'Headache', roman: 'Sar Dard', category: 'head' },
    migraine_pain: { ur: 'آدھے سر کا درد', en: 'Migraine (One-sided)', roman: 'Aadhay Sar ka Dard', category: 'head' },
    dizziness: { ur: 'چکر آنا', en: 'Dizziness', roman: 'Chakkar Aana', category: 'head' },
    unconscious: { ur: 'بے ہوشی', en: 'Unconsciousness', roman: 'Behoshi', category: 'head', severe: true },
    
    // Eyes
    red_eyes: { ur: 'آنکھیں سرخ', en: 'Red Eyes', roman: 'Aankhein Surkh', category: 'eyes' },
    eye_pain: { ur: 'آنکھوں میں درد', en: 'Eye Pain', roman: 'Aankhon mein Dard', category: 'eyes' },
    
    // Respiratory
    cough_dry: { ur: 'خشک کھانسی', en: 'Dry Cough', roman: 'Khushk Khansi', category: 'respiratory' },
    cough_wet: { ur: 'بلغم والی کھانسی', en: 'Wet Cough (with mucus)', roman: 'Balgham wali Khansi', category: 'respiratory' },
    runny_nose: { ur: 'ناک بہنا', en: 'Runny Nose', roman: 'Naak Behna', category: 'respiratory' },
    blocked_nose: { ur: 'ناک بند', en: 'Blocked Nose', roman: 'Naak Band', category: 'respiratory' },
    sneezing: { ur: 'چھینکیں', en: 'Sneezing', roman: 'Cheenkein', category: 'respiratory' },
    sore_throat: { ur: 'گلا خراب', en: 'Sore Throat', roman: 'Gala Kharab', category: 'respiratory' },
    breathing_difficulty: { ur: 'سانس کی تکلیف', en: 'Breathing Difficulty', roman: 'Saans ki Takleef', category: 'respiratory', severe: true },
    chest_pain: { ur: 'سینے میں درد', en: 'Chest Pain', roman: 'Seenay mein Dard', category: 'respiratory', severe: true },
    wheezing: { ur: 'سانس میں سیٹی', en: 'Wheezing', roman: 'Saans mein Seeti', category: 'respiratory' },
    
    // Digestive
    stomach_pain: { ur: 'پیٹ درد', en: 'Stomach Pain', roman: 'Pait Dard', category: 'digestive' },
    nausea: { ur: 'متلی', en: 'Nausea', roman: 'Matli', category: 'digestive' },
    vomiting: { ur: 'الٹی', en: 'Vomiting', roman: 'Ulti', category: 'digestive' },
    diarrhea: { ur: 'اسہال / دست', en: 'Diarrhea', roman: 'Ishaal / Dast', category: 'digestive' },
    constipation: { ur: 'قبض', en: 'Constipation', roman: 'Qabz', category: 'digestive' },
    acidity: { ur: 'تیزابیت / سینے کی جلن', en: 'Acidity / Heartburn', roman: 'Tezabiyat', category: 'digestive' },
    bloating: { ur: 'پیٹ پھولنا', en: 'Bloating', roman: 'Pait Phoolna', category: 'digestive' },
    blood_stool: { ur: 'اجابت میں خون', en: 'Blood in Stool', roman: 'Ijabat mein Khoon', category: 'digestive', severe: true },
    
    // Skin
    rash: { ur: 'دانے / ریشز', en: 'Rash', roman: 'Danay / Rash', category: 'skin' },
    itching: { ur: 'خارش', en: 'Itching', roman: 'Kharish', category: 'skin' },
    dry_skin: { ur: 'خشک جلد', en: 'Dry Skin', roman: 'Khushk Jild', category: 'skin' },
    boils: { ur: 'پھوڑے', en: 'Boils', roman: 'Phoray', category: 'skin' },
    
    // Joints
    joint_pain: { ur: 'جوڑوں کا درد', en: 'Joint Pain', roman: 'Joron ka Dard', category: 'joints' },
    swelling: { ur: 'سوجن', en: 'Swelling', roman: 'Soojan', category: 'joints' },
    stiffness: { ur: 'اکڑاؤ', en: 'Stiffness', roman: 'Akraao', category: 'joints' },
    back_pain: { ur: 'کمر درد', en: 'Back Pain', roman: 'Kamar Dard', category: 'joints' },
    
    // Urinary
    burning_urine: { ur: 'پیشاب میں جلن', en: 'Burning Urination', roman: 'Peshab mein Jalan', category: 'urinary' },
    frequent_urine: { ur: 'بار بار پیشاب', en: 'Frequent Urination', roman: 'Baar Baar Peshab', category: 'urinary' },
    
    // Mental
    anxiety: { ur: 'گھبراہٹ / پریشانی', en: 'Anxiety', roman: 'Ghabrahat', category: 'mental' },
    insomnia: { ur: 'نیند نہ آنا', en: 'Insomnia', roman: 'Neend na Aana', category: 'mental' },
    depression: { ur: 'اداسی', en: 'Depression', roman: 'Udasi', category: 'mental' },
    
    // Special
    yellowish_skin: { ur: 'یرقان / پیلاہٹ', en: 'Jaundice / Yellowish', roman: 'Yarqaan', category: 'special', severe: true },
    bleeding: { ur: 'خون آنا', en: 'Bleeding', roman: 'Khoon Aana', category: 'special', severe: true }
};

// ==========================================
// DISEASES DATABASE (30+ diseases)
// ==========================================

const DISEASES_DB = [
    // ===== RESPIRATORY =====
    {
        id: 'common_cold',
        name: { ur: 'نزلہ زکام', en: 'Common Cold', roman: 'Nazla Zukam' },
        category: 'respiratory',
        symptoms: ['runny_nose', 'sneezing', 'blocked_nose', 'sore_throat', 'fever'],
        keySymptoms: ['runny_nose', 'sneezing'],
        tests: [
            { ur: 'عام طور پر ٹیسٹ کی ضرورت نہیں', en: 'Usually no tests needed' }
        ],
        redFlags: ['high_fever', 'breathing_difficulty', 'chest_pain'],
        remedies: [
            { name: 'Allium Cepa 30', use: { ur: 'ناک/آنکھ سے پانی', en: 'Watery discharge' }, dose: '4-4 hourly' },
            { name: 'Arsenic Album 30', use: { ur: 'چھینکیں + بے چینی', en: 'Sneezing + restlessness' }, dose: '3 times daily' },
            { name: 'Natrum Mur 30', use: { ur: 'انڈے کی سفیدی جیسی رطوبت', en: 'Egg-white discharge' }, dose: '4 times daily' },
            { name: 'Aconite 30', use: { ur: 'اچانک ٹھنڈ سے', en: 'Sudden onset from cold' }, dose: 'Early stage' }
        ],
        advice: {
            ur: 'گرم پانی، شہد، آرام۔ ٹھنڈی چیزوں سے پرہیز۔',
            en: 'Warm water, honey, rest. Avoid cold things.'
        }
    },
    {
        id: 'flu',
        name: { ur: 'انفلوئنزا (فلو)', en: 'Influenza (Flu)', roman: 'Flu' },
        category: 'respiratory',
        symptoms: ['fever', 'body_ache', 'headache', 'cough_dry', 'weakness', 'runny_nose', 'sore_throat'],
        keySymptoms: ['fever', 'body_ache', 'weakness'],
        tests: [
            { ur: 'CBC', en: 'CBC' },
            { ur: 'Rapid Flu Test (اگر ضروری)', en: 'Rapid Flu Test if needed' }
        ],
        redFlags: ['breathing_difficulty', 'chest_pain', 'high_fever'],
        remedies: [
            { name: 'Gelsemium 30', use: { ur: 'کمزوری، بھاری پن', en: 'Weakness, heaviness' }, dose: '4 hourly' },
            { name: 'Eupatorium Perf 30', use: { ur: 'ہڈیوں میں درد', en: 'Bone-breaking pain' }, dose: '3 times daily' },
            { name: 'Bryonia 30', use: { ur: 'حرکت سے درد بڑھے', en: 'Pain worse from motion' }, dose: '4 hourly' },
            { name: 'Rhus Tox 30', use: { ur: 'حرکت سے آرام', en: 'Better from motion' }, dose: '3 times daily' }
        ],
        advice: {
            ur: 'مکمل آرام، مائع زیادہ لیں، پرہیز کریں۔',
            en: 'Complete rest, fluids, isolation.'
        }
    },
    {
        id: 'cough',
        name: { ur: 'کھانسی', en: 'Cough', roman: 'Khansi' },
        category: 'respiratory',
        symptoms: ['cough_dry', 'cough_wet', 'sore_throat'],
        keySymptoms: ['cough_dry', 'cough_wet'],
        tests: [
            { ur: 'اگر 3 ہفتے سے زیادہ: X-Ray Chest', en: 'If >3 weeks: Chest X-Ray' },
            { ur: 'Sputum test اگر ضروری', en: 'Sputum test if needed' }
        ],
        redFlags: ['breathing_difficulty', 'chest_pain', 'bleeding'],
        remedies: [
            { name: 'Drosera 30', use: { ur: 'شدید خشک کھانسی، رات کو', en: 'Severe dry cough at night' }, dose: '3 hourly' },
            { name: 'Ipecac 30', use: { ur: 'بلغم + متلی', en: 'Cough with nausea' }, dose: '4 hourly' },
            { name: 'Bryonia 30', use: { ur: 'خشک کھانسی، حرکت سے بڑھے', en: 'Dry cough worse from motion' }, dose: '4 hourly' },
            { name: 'Antim Tart 30', use: { ur: 'بلغم زیادہ، نکلے نہیں', en: 'Heavy mucus, hard to cough out' }, dose: '3 times daily' }
        ],
        advice: {
            ur: 'گرم پانی + شہد + ادرک۔ ٹھنڈی چیزوں سے پرہیز۔',
            en: 'Warm water + honey + ginger. Avoid cold.'
        }
    },
    {
        id: 'asthma',
        name: { ur: 'دمہ', en: 'Asthma', roman: 'Dama' },
        category: 'respiratory',
        symptoms: ['breathing_difficulty', 'wheezing', 'cough_dry', 'chest_pain'],
        keySymptoms: ['breathing_difficulty', 'wheezing'],
        tests: [
            { ur: 'Spirometry / PFT', en: 'Spirometry / PFT' },
            { ur: 'Chest X-Ray', en: 'Chest X-Ray' },
            { ur: 'Allergy Test', en: 'Allergy Test' }
        ],
        redFlags: ['breathing_difficulty', 'unconscious'],
        remedies: [
            { name: 'Arsenic Album 200', use: { ur: 'رات کو حملہ، بے چینی', en: 'Night attacks, restlessness' }, dose: 'SOS' },
            { name: 'Antim Tart 30', use: { ur: 'بلغم بھرا سینہ', en: 'Rattling chest' }, dose: '3 times daily' },
            { name: 'Ipecac 30', use: { ur: 'اچانک دورہ + الٹی', en: 'Sudden attack + vomiting' }, dose: 'SOS' },
            { name: 'Blatta Orientalis Q', use: { ur: 'دائمی دمہ کا خاص علاج', en: 'Specific for chronic asthma' }, dose: '10 drops thrice daily' }
        ],
        advice: {
            ur: 'دھول، دھواں، سرد ہوا سے بچیں۔ Inhaler ساتھ رکھیں۔',
            en: 'Avoid dust, smoke, cold air. Keep inhaler.'
        }
    },
    
    // ===== FEVER =====
    {
        id: 'viral_fever',
        name: { ur: 'وائرل بخار', en: 'Viral Fever', roman: 'Viral Fever' },
        category: 'general',
        symptoms: ['fever', 'headache', 'body_ache', 'weakness', 'loss_appetite'],
        keySymptoms: ['fever', 'body_ache'],
        tests: [
            { ur: 'CBC', en: 'CBC' },
            { ur: 'Dengue/Typhoid rule out', en: 'Rule out Dengue/Typhoid' }
        ],
        redFlags: ['high_fever', 'unconscious', 'bleeding'],
        remedies: [
            { name: 'Belladonna 200', use: { ur: 'تیز بخار، سرخ چہرہ', en: 'High fever, red face' }, dose: '3 hourly' },
            { name: 'Aconite 30', use: { ur: 'اچانک بخار', en: 'Sudden fever' }, dose: 'Early' },
            { name: 'Ferrum Phos 6X', use: { ur: 'ہلکا بخار', en: 'Mild fever' }, dose: '4 hourly' }
        ],
        advice: {
            ur: 'آرام، مائع زیادہ، پیراسیٹامول اگر ضروری۔',
            en: 'Rest, fluids, paracetamol if needed.'
        }
    },
    {
        id: 'malaria',
        name: { ur: 'ملیریا', en: 'Malaria', roman: 'Malaria' },
        category: 'general',
        symptoms: ['fever', 'chills', 'sweating', 'headache', 'body_ache', 'weakness', 'vomiting'],
        keySymptoms: ['fever', 'chills', 'sweating'],
        tests: [
            { ur: 'Malaria Parasite (MP) Slide', en: 'Malaria Parasite (MP) Slide' },
            { ur: 'ICT Malaria', en: 'ICT Malaria' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['unconscious', 'yellowish_skin', 'high_fever'],
        remedies: [
            { name: 'China Off 30', use: { ur: 'ملیریا کا اہم علاج', en: 'Main remedy for malaria' }, dose: '4 hourly' },
            { name: 'Natrum Mur 200', use: { ur: 'دائمی ملیریا', en: 'Chronic malaria' }, dose: 'Weekly' },
            { name: 'Arsenic Album 30', use: { ur: 'کمزوری + بے چینی', en: 'Weakness + restlessness' }, dose: '3 times daily' }
        ],
        advice: {
            ur: 'مچھر دانی، صفائی، پانی کھڑا نہ ہو۔',
            en: 'Mosquito net, cleanliness, no stagnant water.'
        }
    },
    {
        id: 'typhoid',
        name: { ur: 'ٹائیفائیڈ', en: 'Typhoid', roman: 'Typhoid' },
        category: 'general',
        symptoms: ['fever', 'headache', 'weakness', 'loss_appetite', 'stomach_pain', 'constipation', 'diarrhea'],
        keySymptoms: ['fever', 'weakness'],
        tests: [
            { ur: 'Widal Test', en: 'Widal Test' },
            { ur: 'Typhidot', en: 'Typhidot' },
            { ur: 'Blood Culture', en: 'Blood Culture' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['blood_stool', 'unconscious', 'high_fever'],
        remedies: [
            { name: 'Baptisia 30', use: { ur: 'ٹائیفائیڈ کا اہم علاج', en: 'Main typhoid remedy' }, dose: '3 hourly' },
            { name: 'Bryonia 30', use: { ur: 'قبض + پیاس', en: 'Constipation + thirst' }, dose: '4 hourly' },
            { name: 'Rhus Tox 30', use: { ur: 'بے چینی، اکڑاؤ', en: 'Restlessness, stiffness' }, dose: '3 times daily' }
        ],
        advice: {
            ur: 'صاف پانی، ہلکی خوراک، مکمل آرام۔',
            en: 'Clean water, light diet, complete rest.'
        }
    },
    {
        id: 'dengue',
        name: { ur: 'ڈینگی بخار', en: 'Dengue Fever', roman: 'Dengue' },
        category: 'general',
        symptoms: ['high_fever', 'headache', 'body_ache', 'eye_pain', 'rash', 'weakness', 'nausea'],
        keySymptoms: ['high_fever', 'eye_pain', 'rash'],
        tests: [
            { ur: 'Dengue NS1 Antigen', en: 'Dengue NS1 Antigen' },
            { ur: 'Dengue IgM/IgG', en: 'Dengue IgM/IgG' },
            { ur: 'CBC (Platelets)', en: 'CBC (Platelets)' }
        ],
        redFlags: ['bleeding', 'unconscious', 'breathing_difficulty'],
        remedies: [
            { name: 'Eupatorium Perf 200', use: { ur: 'ڈینگی کا اہم علاج', en: 'Main dengue remedy' }, dose: '3 hourly' },
            { name: 'Carica Papaya Q', use: { ur: 'پلیٹلیٹس بڑھانے', en: 'Increases platelets' }, dose: '10 drops thrice' },
            { name: 'Crotalus Horridus 30', use: { ur: 'خون بہنے میں', en: 'For bleeding tendency' }, dose: '3 times daily' }
        ],
        advice: {
            ur: 'مچھر سے بچاؤ، پانی + جوس زیادہ، پلیٹلیٹس چیک کریں۔',
            en: 'Prevent mosquitoes, fluids, monitor platelets.'
        }
    },
    
    // ===== HEAD =====
    {
        id: 'headache_tension',
        name: { ur: 'ٹینشن سر درد', en: 'Tension Headache', roman: 'Tension Sar Dard' },
        category: 'head',
        symptoms: ['headache', 'stiffness', 'anxiety'],
        keySymptoms: ['headache'],
        tests: [
            { ur: 'عام طور پر ضرورت نہیں', en: 'Usually not needed' },
            { ur: 'اگر مسلسل: BP، Eye check', en: 'If persistent: BP, Eye check' }
        ],
        redFlags: ['unconscious', 'vomiting', 'high_fever'],
        remedies: [
            { name: 'Nux Vomica 30', use: { ur: 'ذہنی دباؤ سے', en: 'From mental stress' }, dose: 'Twice daily' },
            { name: 'Gelsemium 30', use: { ur: 'گردن کی طرف سے', en: 'Starting from neck' }, dose: '3 times daily' },
            { name: 'Bryonia 30', use: { ur: 'حرکت سے بڑھے', en: 'Worse from motion' }, dose: '4 hourly' }
        ],
        advice: {
            ur: 'آرام، پانی، ذہنی سکون، نیند پوری۔',
            en: 'Rest, hydration, stress management, sleep.'
        }
    },
    {
        id: 'migraine',
        name: { ur: 'درد شقیقہ (مائیگرین)', en: 'Migraine', roman: 'Migraine' },
        category: 'head',
        symptoms: ['migraine_pain', 'nausea', 'vomiting', 'dizziness'],
        keySymptoms: ['migraine_pain', 'nausea'],
        tests: [
            { ur: 'CT/MRI اگر شدید', en: 'CT/MRI if severe' }
        ],
        redFlags: ['unconscious', 'high_fever'],
        remedies: [
            { name: 'Belladonna 30', use: { ur: 'دائیں طرف، دھڑکن', en: 'Right side, throbbing' }, dose: 'SOS' },
            { name: 'Spigelia 30', use: { ur: 'بائیں طرف، آنکھ کے پیچھے', en: 'Left side, behind eye' }, dose: '3 times daily' },
            { name: 'Sanguinaria 30', use: { ur: 'دائیں طرف، الٹی', en: 'Right side, vomiting' }, dose: '3 hourly' },
            { name: 'Iris Versicolor 30', use: { ur: 'آنکھ کے سامنے چمک', en: 'Visual aura' }, dose: '3 times daily' }
        ],
        advice: {
            ur: 'اندھیرا کمرہ، آرام۔ Trigger foods (چائے، چاکلیٹ) سے بچیں۔',
            en: 'Dark room, rest. Avoid trigger foods.'
        }
    },
    
    // ===== DIGESTIVE =====
    {
        id: 'gastritis',
        name: { ur: 'معدے کی سوزش', en: 'Gastritis', roman: 'Gastritis' },
        category: 'digestive',
        symptoms: ['stomach_pain', 'nausea', 'acidity', 'bloating', 'loss_appetite'],
        keySymptoms: ['stomach_pain', 'acidity'],
        tests: [
            { ur: 'H. Pylori Test', en: 'H. Pylori Test' },
            { ur: 'Endoscopy اگر شدید', en: 'Endoscopy if severe' }
        ],
        redFlags: ['blood_stool', 'vomiting', 'chest_pain'],
        remedies: [
            { name: 'Nux Vomica 30', use: { ur: 'کھانے کے بعد بھاری پن', en: 'Heaviness after eating' }, dose: 'Before meals' },
            { name: 'Carbo Veg 30', use: { ur: 'گیس + ڈکار', en: 'Gas + belching' }, dose: '3 times daily' },
            { name: 'Robinia 30', use: { ur: 'رات کو تیزابیت', en: 'Night acidity' }, dose: 'At bedtime' },
            { name: 'Natrum Phos 6X', use: { ur: 'کھٹی ڈکار', en: 'Sour belching' }, dose: 'After meals' }
        ],
        advice: {
            ur: 'مصالحہ دار، تلی چیزیں، چائے کم کریں۔ وقت پر کھائیں۔',
            en: 'Reduce spicy, fried, tea. Eat on time.'
        }
    },
    {
        id: 'diarrhea_acute',
        name: { ur: 'اسہال (دست)', en: 'Acute Diarrhea', roman: 'Ishaal / Dast' },
        category: 'digestive',
        symptoms: ['diarrhea', 'stomach_pain', 'nausea', 'weakness'],
        keySymptoms: ['diarrhea'],
        tests: [
            { ur: 'Stool Test (اگر شدید)', en: 'Stool Test if severe' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['blood_stool', 'unconscious', 'high_fever'],
        remedies: [
            { name: 'Arsenic Album 30', use: { ur: 'باسی کھانے سے', en: 'From stale food' }, dose: '2 hourly' },
            { name: 'Podophyllum 30', use: { ur: 'پیلا پانی جیسا دست', en: 'Watery yellow stools' }, dose: 'Frequent' },
            { name: 'Aloe Soc 30', use: { ur: 'صبح کے دست', en: 'Morning diarrhea' }, dose: '3 times' },
            { name: 'China Off 30', use: { ur: 'کمزوری کے ساتھ', en: 'With weakness' }, dose: '3 hourly' }
        ],
        advice: {
            ur: 'ORS ضرور دیں، ہلکی خوراک، کھچڑی، دہی۔',
            en: 'ORS, light diet, rice, yogurt.'
        }
    },
    {
        id: 'constipation',
        name: { ur: 'قبض', en: 'Constipation', roman: 'Qabz' },
        category: 'digestive',
        symptoms: ['constipation', 'stomach_pain', 'bloating', 'headache'],
        keySymptoms: ['constipation'],
        tests: [
            { ur: 'اگر مستقل: Colonoscopy', en: 'If chronic: Colonoscopy' },
            { ur: 'Thyroid test', en: 'Thyroid test' }
        ],
        redFlags: ['blood_stool', 'weight_loss'],
        remedies: [
            { name: 'Nux Vomica 30', use: { ur: 'باربار کوشش، کچھ نہ آئے', en: 'Frequent urging, nothing passes' }, dose: 'Morning' },
            { name: 'Bryonia 30', use: { ur: 'خشک سخت پاخانہ', en: 'Dry hard stools' }, dose: 'Morning' },
            { name: 'Alumina 30', use: { ur: 'بالکل خواہش نہیں', en: 'No desire at all' }, dose: 'Daily' },
            { name: 'Silicea 30', use: { ur: 'کوشش کے بعد واپس جائے', en: 'Stool recedes' }, dose: 'Daily' }
        ],
        advice: {
            ur: 'پانی زیادہ، ریشہ دار غذا، ورزش، صبح کا وقت مقرر کریں۔',
            en: 'Water, fiber, exercise, fixed morning time.'
        }
    },
    {
        id: 'food_poisoning',
        name: { ur: 'فوڈ پوائزننگ', en: 'Food Poisoning', roman: 'Food Poisoning' },
        category: 'digestive',
        symptoms: ['vomiting', 'diarrhea', 'stomach_pain', 'nausea', 'fever', 'weakness'],
        keySymptoms: ['vomiting', 'diarrhea', 'stomach_pain'],
        tests: [
            { ur: 'Stool Culture', en: 'Stool Culture' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['blood_stool', 'unconscious', 'high_fever'],
        remedies: [
            { name: 'Arsenic Album 30', use: { ur: 'اہم علاج - باسی کھانا', en: 'Main - stale food' }, dose: '2 hourly' },
            { name: 'Ipecac 30', use: { ur: 'مسلسل الٹی', en: 'Continuous vomiting' }, dose: 'SOS' },
            { name: 'Nux Vomica 30', use: { ur: 'زیادہ کھانے سے', en: 'Overeating' }, dose: '3 hourly' }
        ],
        advice: {
            ur: 'ORS، آرام، ہلکا کھانا، صاف پانی۔',
            en: 'ORS, rest, light food, clean water.'
        }
    },
    
    // ===== SKIN =====
    {
        id: 'eczema',
        name: { ur: 'ایگزیما / خارش', en: 'Eczema', roman: 'Eczema' },
        category: 'skin',
        symptoms: ['itching', 'rash', 'dry_skin'],
        keySymptoms: ['itching', 'rash'],
        tests: [
            { ur: 'Allergy Test', en: 'Allergy Test' },
            { ur: 'Skin biopsy اگر ضروری', en: 'Skin biopsy if needed' }
        ],
        redFlags: [],
        remedies: [
            { name: 'Sulphur 30', use: { ur: 'خشک خارش، گرمی سے بڑھے', en: 'Dry itch, worse from heat' }, dose: 'Weekly' },
            { name: 'Graphites 30', use: { ur: 'گاڑھا شہد جیسا رساو', en: 'Honey-like discharge' }, dose: 'Daily' },
            { name: 'Rhus Tox 30', use: { ur: 'چھالے، خارش', en: 'Blisters, itching' }, dose: '3 times daily' },
            { name: 'Arsenic Album 30', use: { ur: 'خشک، پپڑی', en: 'Dry, scaly' }, dose: 'Daily' }
        ],
        advice: {
            ur: 'موائسچرائزر، صابن کم، ہلکے کپڑے، الرجی سے بچیں۔',
            en: 'Moisturizer, less soap, cotton clothes.'
        }
    },
    {
        id: 'allergy',
        name: { ur: 'الرجی', en: 'Allergy', roman: 'Allergy' },
        category: 'skin',
        symptoms: ['rash', 'itching', 'sneezing', 'runny_nose', 'red_eyes'],
        keySymptoms: ['itching', 'sneezing'],
        tests: [
            { ur: 'IgE Level', en: 'IgE Level' },
            { ur: 'Skin Prick Test', en: 'Skin Prick Test' }
        ],
        redFlags: ['breathing_difficulty', 'swelling'],
        remedies: [
            { name: 'Histaminum 30', use: { ur: 'عام الرجی', en: 'General allergy' }, dose: '3 times daily' },
            { name: 'Apis Mellifica 30', use: { ur: 'سوجن + خارش', en: 'Swelling + itching' }, dose: 'SOS' },
            { name: 'Urtica Urens Q', use: { ur: 'چھپاکی', en: 'Urticaria' }, dose: '10 drops' },
            { name: 'Natrum Mur 30', use: { ur: 'دائمی الرجی', en: 'Chronic allergy' }, dose: 'Weekly' }
        ],
        advice: {
            ur: 'الرجن کی شناخت، پرہیز، ماحول صاف رکھیں۔',
            en: 'Identify allergen, avoid, clean environment.'
        }
    },
    
    // ===== JOINTS =====
    {
        id: 'arthritis',
        name: { ur: 'گٹھیا / جوڑوں کا درد', en: 'Arthritis', roman: 'Gathiya' },
        category: 'joints',
        symptoms: ['joint_pain', 'swelling', 'stiffness'],
        keySymptoms: ['joint_pain', 'stiffness'],
        tests: [
            { ur: 'RA Factor', en: 'RA Factor' },
            { ur: 'CRP, ESR', en: 'CRP, ESR' },
            { ur: 'Uric Acid', en: 'Uric Acid' },
            { ur: 'X-Ray joints', en: 'X-Ray joints' }
        ],
        redFlags: ['high_fever', 'swelling'],
        remedies: [
            { name: 'Rhus Tox 200', use: { ur: 'حرکت سے آرام', en: 'Better from motion' }, dose: 'Twice daily' },
            { name: 'Bryonia 30', use: { ur: 'حرکت سے بڑھے', en: 'Worse from motion' }, dose: '3 times daily' },
            { name: 'Colchicum 30', use: { ur: 'یورک ایسڈ، بڑا انگوٹھا', en: 'Uric acid, big toe' }, dose: '3 times daily' },
            { name: 'Calcarea Fluor 6X', use: { ur: 'ہڈی کی مضبوطی', en: 'Bone strength' }, dose: 'Daily' }
        ],
        advice: {
            ur: 'وزن کم، ہلکی ورزش، گرم پانی سے سکائی۔',
            en: 'Weight loss, light exercise, warm compress.'
        }
    },
    {
        id: 'back_pain',
        name: { ur: 'کمر درد', en: 'Back Pain', roman: 'Kamar Dard' },
        category: 'joints',
        symptoms: ['back_pain', 'stiffness'],
        keySymptoms: ['back_pain'],
        tests: [
            { ur: 'X-Ray Spine', en: 'X-Ray Spine' },
            { ur: 'MRI اگر شدید', en: 'MRI if severe' }
        ],
        redFlags: ['unconscious', 'weakness'],
        remedies: [
            { name: 'Rhus Tox 200', use: { ur: 'اکڑاؤ، حرکت سے آرام', en: 'Stiffness, better from motion' }, dose: 'Twice daily' },
            { name: 'Bryonia 30', use: { ur: 'حرکت سے شدید درد', en: 'Severe pain on motion' }, dose: '3 times daily' },
            { name: 'Arnica 200', use: { ur: 'چوٹ سے', en: 'From injury' }, dose: '3 times' },
            { name: 'Hypericum 30', use: { ur: 'اعصابی درد', en: 'Nerve pain' }, dose: '3 times daily' }
        ],
        advice: {
            ur: 'صحیح posture، بھاری چیز نہ اٹھائیں، ورزش۔',
            en: 'Good posture, avoid heavy lifting, exercise.'
        }
    },
    
    // ===== URINARY =====
    {
        id: 'uti',
        name: { ur: 'پیشاب کی جلن (UTI)', en: 'Urinary Tract Infection', roman: 'Peshab ki Jalan' },
        category: 'urinary',
        symptoms: ['burning_urine', 'frequent_urine', 'stomach_pain', 'fever'],
        keySymptoms: ['burning_urine', 'frequent_urine'],
        tests: [
            { ur: 'Urine Routine', en: 'Urine R/E' },
            { ur: 'Urine Culture', en: 'Urine Culture' }
        ],
        redFlags: ['high_fever', 'bleeding'],
        remedies: [
            { name: 'Cantharis 30', use: { ur: 'شدید جلن', en: 'Severe burning' }, dose: '3 hourly' },
            { name: 'Apis Mellifica 30', use: { ur: 'آخری قطرے میں جلن', en: 'Burning at end of urine' }, dose: '4 hourly' },
            { name: 'Sarsaparilla 30', use: { ur: 'شروع میں درد', en: 'Pain at start' }, dose: '3 times daily' },
            { name: 'Berberis Vulgaris Q', use: { ur: 'گردے کی طرف درد', en: 'Kidney pain radiating' }, dose: '10 drops thrice' }
        ],
        advice: {
            ur: 'پانی زیادہ، صفائی، پیشاب روکیں نہیں۔',
            en: 'More water, hygiene, don\'t hold urine.'
        }
    },
    
    // ===== MENTAL =====
    {
        id: 'insomnia',
        name: { ur: 'نیند کی کمی', en: 'Insomnia', roman: 'Neend ki Kami' },
        category: 'mental',
        symptoms: ['insomnia', 'anxiety', 'fatigue'],
        keySymptoms: ['insomnia'],
        tests: [
            { ur: 'Thyroid', en: 'Thyroid' },
            { ur: 'اگر ضروری: Sleep Study', en: 'If needed: Sleep Study' }
        ],
        redFlags: ['depression'],
        remedies: [
            { name: 'Coffea Cruda 30', use: { ur: 'زیادہ سوچنے سے', en: 'From overthinking' }, dose: 'At bedtime' },
            { name: 'Passiflora Q', use: { ur: 'عمومی نیند کی کمی', en: 'General insomnia' }, dose: '20 drops at bed' },
            { name: 'Kali Phos 6X', use: { ur: 'ذہنی تھکاوٹ', en: 'Mental fatigue' }, dose: 'Twice daily' },
            { name: 'Nux Vomica 30', use: { ur: 'صبح 3 بجے جاگنا', en: '3 AM waking' }, dose: 'Bedtime' }
        ],
        advice: {
            ur: 'موبائل سے دور، مقررہ وقت، ہلکی خوراک۔',
            en: 'Avoid mobile, fixed time, light dinner.'
        }
    },
    {
        id: 'anxiety',
        name: { ur: 'گھبراہٹ / پریشانی', en: 'Anxiety', roman: 'Ghabrahat' },
        category: 'mental',
        symptoms: ['anxiety', 'insomnia', 'headache', 'chest_pain'],
        keySymptoms: ['anxiety'],
        tests: [
            { ur: 'Thyroid', en: 'Thyroid' },
            { ur: 'ECG اگر chest pain', en: 'ECG if chest pain' }
        ],
        redFlags: ['depression', 'chest_pain'],
        remedies: [
            { name: 'Aconite 200', use: { ur: 'اچانک حملہ', en: 'Sudden attack' }, dose: 'SOS' },
            { name: 'Arsenic Album 30', use: { ur: 'موت کا خوف', en: 'Fear of death' }, dose: '3 times daily' },
            { name: 'Gelsemium 30', use: { ur: 'امتحان/انٹرویو کا خوف', en: 'Exam/interview fear' }, dose: 'Before event' },
            { name: 'Ignatia 200', use: { ur: 'غم سے', en: 'From grief' }, dose: 'Daily' }
        ],
        advice: {
            ur: 'دعا، ورزش، سانس کی مشقیں، مشاورت۔',
            en: 'Prayer, exercise, breathing, counseling.'
        }
    },
    
    // ===== SPECIAL =====
    {
        id: 'hypertension',
        name: { ur: 'بلڈ پریشر', en: 'Hypertension', roman: 'Blood Pressure' },
        category: 'chronic',
        symptoms: ['headache', 'dizziness', 'chest_pain'],
        keySymptoms: ['headache'],
        tests: [
            { ur: 'BP monitoring', en: 'BP monitoring' },
            { ur: 'ECG', en: 'ECG' },
            { ur: 'Lipid Profile', en: 'Lipid Profile' },
            { ur: 'Kidney Function', en: 'Kidney Function' }
        ],
        redFlags: ['unconscious', 'chest_pain', 'breathing_difficulty'],
        remedies: [
            { name: 'Rauwolfia Q', use: { ur: 'ہائی BP کا اہم علاج', en: 'Main for high BP' }, dose: '10 drops thrice' },
            { name: 'Natrum Mur 200', use: { ur: 'نمک زیادہ کھانے سے', en: 'From high salt' }, dose: 'Weekly' },
            { name: 'Belladonna 30', use: { ur: 'دھڑکن، سرخ چہرہ', en: 'Throbbing, red face' }, dose: 'SOS' },
            { name: 'Aurum Met 30', use: { ur: 'ذہنی دباؤ سے', en: 'From mental stress' }, dose: 'Daily' }
        ],
        advice: {
            ur: 'نمک کم، وزن کم، ورزش، BP روزانہ چیک کریں۔',
            en: 'Less salt, weight loss, exercise, daily BP check.'
        }
    },
    {
        id: 'diabetes',
        name: { ur: 'ذیابیطس (شوگر)', en: 'Diabetes', roman: 'Sugar' },
        category: 'chronic',
        symptoms: ['frequent_urine', 'weakness', 'weight_loss', 'itching'],
        keySymptoms: ['frequent_urine'],
        tests: [
            { ur: 'Fasting Blood Sugar', en: 'FBS' },
            { ur: 'HbA1c', en: 'HbA1c' },
            { ur: 'Urine for Sugar', en: 'Urine for Sugar' }
        ],
        redFlags: ['unconscious', 'breathing_difficulty'],
        remedies: [
            { name: 'Syzygium Jambolanum Q', use: { ur: 'شوگر کا اہم علاج', en: 'Main diabetes remedy' }, dose: '10-15 drops thrice' },
            { name: 'Gymnema Sylvestre Q', use: { ur: 'شوگر کم کرے', en: 'Reduces sugar' }, dose: '10 drops thrice' },
            { name: 'Uranium Nitricum 30', use: { ur: 'پیاس + بھوک زیادہ', en: 'Excessive thirst + hunger' }, dose: 'Twice daily' }
        ],
        advice: {
            ur: 'میٹھا بند، وزن کم، ورزش، شوگر روزانہ چیک۔',
            en: 'No sugar, weight loss, exercise, daily sugar check.'
        }
    },
    
    // ===== EYE =====
    {
        id: 'conjunctivitis',
        name: { ur: 'آنکھ آنا', en: 'Conjunctivitis', roman: 'Aankh Aana' },
        category: 'eyes',
        symptoms: ['red_eyes', 'eye_pain', 'itching'],
        keySymptoms: ['red_eyes'],
        tests: [
            { ur: 'عام طور پر ضرورت نہیں', en: 'Usually not needed' }
        ],
        redFlags: ['high_fever'],
        remedies: [
            { name: 'Euphrasia 30', use: { ur: 'آنکھ کا اہم علاج', en: 'Main eye remedy' }, dose: '3 times daily' },
            { name: 'Argentum Nit 30', use: { ur: 'پیپ، سوجن', en: 'Pus, swelling' }, dose: '4 hourly' },
            { name: 'Belladonna 30', use: { ur: 'شدید سرخی', en: 'Severe redness' }, dose: '3 hourly' }
        ],
        advice: {
            ur: 'صاف پانی سے دھوئیں، شیئر نہ کریں، ہاتھ صاف رکھیں۔',
            en: 'Clean water wash, don\'t share, hand hygiene.'
        }
    },
    
    // ===== CHILDREN =====
    {
        id: 'teething',
        name: { ur: 'بچوں کے دانت نکلنا', en: 'Teething Problems', roman: 'Daant Nikalna' },
        category: 'pediatric',
        symptoms: ['fever', 'diarrhea', 'itching', 'anxiety'],
        keySymptoms: ['fever'],
        tests: [
            { ur: 'ضرورت نہیں', en: 'Not needed' }
        ],
        redFlags: ['high_fever'],
        remedies: [
            { name: 'Chamomilla 30', use: { ur: 'اہم علاج - چڑچڑاپن', en: 'Main - irritability' }, dose: '3 hourly' },
            { name: 'Calcarea Phos 6X', use: { ur: 'دانت آسانی سے نکلیں', en: 'Easy teething' }, dose: 'Daily' },
            { name: 'Belladonna 30', use: { ur: 'بخار + سرخ چہرہ', en: 'Fever + red face' }, dose: '4 hourly' }
        ],
        advice: {
            ur: 'ٹھنڈی چیز چبانے کو دیں، صفائی رکھیں۔',
            en: 'Cold teether, hygiene.'
        }
    },
    
    // ===== WOMEN =====
    {
        id: 'menstrual_pain',
        name: { ur: 'حیض کا درد', en: 'Menstrual Pain', roman: 'Haiz ka Dard' },
        category: 'women',
        symptoms: ['stomach_pain', 'back_pain', 'headache', 'nausea'],
        keySymptoms: ['stomach_pain'],
        tests: [
            { ur: 'اگر شدید: Ultrasound', en: 'If severe: Ultrasound' }
        ],
        redFlags: ['bleeding', 'high_fever'],
        remedies: [
            { name: 'Magnesia Phos 6X', use: { ur: 'اینٹھن والا درد', en: 'Cramping pain' }, dose: 'SOS' },
            { name: 'Colocynth 30', use: { ur: 'دبانے سے آرام', en: 'Better from pressure' }, dose: '3 hourly' },
            { name: 'Pulsatilla 30', use: { ur: 'بے قاعدہ، رونے کو دل چاہے', en: 'Irregular, weepy' }, dose: 'Daily' },
            { name: 'Sepia 200', use: { ur: 'بھاری پن، تھکاوٹ', en: 'Heaviness, fatigue' }, dose: 'Weekly' }
        ],
        advice: {
            ur: 'گرم پانی کی بوتل، آرام، ہلکی خوراک۔',
            en: 'Hot water bottle, rest, light diet.'
        }
    },
    
    // ===== BOILS/BLISTERS =====
    {
        id: 'boils',
        name: { ur: 'پھوڑے پھنسیاں', en: 'Boils / Furuncles', roman: 'Phoray Phunsian' },
        category: 'skin',
        symptoms: ['boils', 'swelling', 'itching'],
        keySymptoms: ['boils'],
        tests: [
            { ur: 'Blood Sugar (اگر بار بار)', en: 'Blood Sugar (if recurrent)' }
        ],
        redFlags: ['high_fever'],
        remedies: [
            { name: 'Belladonna 30', use: { ur: 'شروع میں - سرخ، گرم', en: 'Early - red, hot' }, dose: '3 hourly' },
            { name: 'Hepar Sulph 30', use: { ur: 'پیپ بننے پر', en: 'When pus forms' }, dose: '4 hourly' },
            { name: 'Silicea 30', use: { ur: 'پیپ نکالنے', en: 'To discharge pus' }, dose: '3 times daily' },
            { name: 'Myristica 30', use: { ur: 'جلد ٹھیک ہو', en: 'Fast healing' }, dose: '3 times daily' }
        ],
        advice: {
            ur: 'صفائی، خون صاف کرنے والی غذا، شوگر چیک۔',
            en: 'Hygiene, blood purifying diet, check sugar.'
        }
    },
    
    // ===== EAR =====
    {
        id: 'ear_pain',
        name: { ur: 'کان درد', en: 'Ear Pain (Otitis)', roman: 'Kaan Dard' },
        category: 'general',
        symptoms: ['fever', 'headache'],
        keySymptoms: [],
        tests: [
            { ur: 'Ear Examination', en: 'Ear Examination' }
        ],
        redFlags: ['high_fever', 'bleeding'],
        remedies: [
            { name: 'Belladonna 30', use: { ur: 'اچانک، شدید درد', en: 'Sudden severe pain' }, dose: '2 hourly' },
            { name: 'Pulsatilla 30', use: { ur: 'بچوں میں، رات کو بڑھے', en: 'Children, worse at night' }, dose: '3 hourly' },
            { name: 'Chamomilla 30', use: { ur: 'شدید چڑچڑاپن', en: 'Extreme irritability' }, dose: '3 hourly' },
            { name: 'Hepar Sulph 30', use: { ur: 'پیپ نکلے', en: 'Discharge with pus' }, dose: '3 times daily' }
        ],
        advice: {
            ur: 'کان میں پانی نہ جائے، گرم رکھیں۔',
            en: 'Keep dry and warm.'
        }
    },
    
    // ===== PILES =====
    {
        id: 'piles',
        name: { ur: 'بواسیر', en: 'Piles / Hemorrhoids', roman: 'Bawaseer' },
        category: 'digestive',
        symptoms: ['constipation', 'stomach_pain', 'bleeding'],
        keySymptoms: ['constipation', 'bleeding'],
        tests: [
            { ur: 'Proctoscopy', en: 'Proctoscopy' },
            { ur: 'CBC اگر خون بہت', en: 'CBC if bleeding' }
        ],
        redFlags: ['bleeding'],
        remedies: [
            { name: 'Hamamelis Q', use: { ur: 'اہم علاج، خون بہنا', en: 'Main - bleeding piles' }, dose: '10 drops thrice' },
            { name: 'Aesculus 30', use: { ur: 'خشک، اندرونی', en: 'Dry, internal' }, dose: '3 times daily' },
            { name: 'Nux Vomica 30', use: { ur: 'قبض + خارش', en: 'Constipation + itching' }, dose: 'Morning' },
            { name: 'Sulphur 200', use: { ur: 'دائمی، خارش', en: 'Chronic, itching' }, dose: 'Weekly' }
        ],
        advice: {
            ur: 'مصالحہ کم، پانی زیادہ، قبض ٹھیک کریں۔',
            en: 'Less spice, more water, treat constipation.'
        }
    }
];

// Categories for filtering
const CATEGORIES_DB = {
    all:         { ur: 'تمام', en: 'All', roman: 'All', icon: '🏥' },
    general:     { ur: 'عمومی', en: 'General', roman: 'General', icon: '🤒' },
    respiratory: { ur: 'سانس', en: 'Respiratory', roman: 'Respiratory', icon: '🫁' },
    digestive:   { ur: 'ہاضمہ', en: 'Digestive', roman: 'Digestive', icon: '🍽️' },
    head:        { ur: 'سر', en: 'Head/Neuro', roman: 'Sar', icon: '🧠' },
    joints:      { ur: 'جوڑ', en: 'Bones/Joints', roman: 'Jor', icon: '🦴' },
    skin:        { ur: 'جلد', en: 'Skin', roman: 'Jild', icon: '🧴' },
    urinary:     { ur: 'پیشاب', en: 'Urinary', roman: 'Peshab', icon: '💧' },
    mental:      { ur: 'دماغی', en: 'Mental', roman: 'Dimagi', icon: '🧘' },
    chronic:     { ur: 'دائمی', en: 'Chronic', roman: 'Chronic', icon: '💉' },
    women:       { ur: 'زنانہ', en: 'Women', roman: 'Zanana', icon: '👩' },
    pediatric:   { ur: 'بچے', en: 'Pediatric', roman: 'Bache', icon: '👶' },
    eyes:        { ur: 'آنکھ', en: 'Eyes', roman: 'Aankh', icon: '👁️' }
};

// Make available globally
window.SYMPTOMS_DB = SYMPTOMS_DB;
window.DISEASES_DB = DISEASES_DB;
window.CATEGORIES_DB = CATEGORIES_DB;