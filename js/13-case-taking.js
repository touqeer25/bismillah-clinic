// Bismillah Clinic — js/13-case-taking.js  (v4 — MASTER LEVEL-1 PROTOCOL)
// Case Taking page: Acute (few questions) / Chronic (MASTER Level-1, سیکشن وائز)
//
// v4 — MASTER HOMEOPATHIC CASE-TAKING PROTOCOL کی مکمل شمولیت:
//   • باب 1 تا 8 (سٹیپ 1 تا 9): Q-1..10، PQ-1..10، P-03..20، M-01..15،
//     G-01..40، H/F/C، S-06..S-19 = 115 یونیک فیلڈز (ہر سیکشن کی ★ لازمی + اختیاری سوالات)
//   • ہر باب میں 🔴 لازمی بلاک (ہمیشہ کھلا) + ⚪ اختیاری/شرطی بلاک (details بند)
//   • 👤 پروفائل سٹرپ (نام/عمر/جنس) — خاتون منتخب کرنے پر ماہواری/جنسی سوالات خود ظاہر
//   • 🔍 خودکار Gap Check — پینل 8 میں 16 خانوں کی چیک لسٹ
//   • 🖨️ کیس پرنٹ رپورٹ — پورے کیس کا پرنٹ فرینڈلی خلاصہ
//   • دہرائی سے بچاؤ: P-01/P-02، S-01..S-11 کو PQ/P پینلز سے جوڑا (ایک فیلڈ)
//   • 💾 آٹو سیو (وہی key — پرانا ڈیٹا محفوظ رہتا ہے)
//   • ⚖️ Kent وزن (12/11/10/9/6) قابلِ ایڈجسٹ — غیر تبدیل
//   • 📊 بصری خلاصہ + 🌐 تینوں زبانیں (ur/en/roman)

var KENT_W = { mental: 12, mod: 11, part: 10, phys: 9, hist: 6 };
var CT_STORE = 'bcc_case_taking_v1';

var CT = {
    mode: 'acute',
    dx: 'piles',
    sel: {},
    hist: { cc: '', hpi: '', past: '' },
    notes: { particular: '', loc: '', sens: '', extra: '' },
    m: {},                                   // MASTER باب 1-8 کے جوابات (qid => متن)
    prof: { name: '', age: '', sex: '' },    // 👤 پروفائل — خاتون ہو تو ماہواری سوالات خود ظاہر
    results: [],
    _selKeys: [],
    w: { mental: 12, mod: 11, part: 10, phys: 9, hist: 6 },
    open: ['q'],
    _savedTs: 0
};

// ==================== CHIP DATA (3 languages) ====================

var CT_MENTAL = [
    { ur: 'غم / خاموش غم', en: 'Grief / silent grief', roman: 'Gham' },
    { ur: 'غصہ / چڑچڑا پن', en: 'Anger / irritability', roman: 'Gussa' },
    { ur: 'بے چینی / اضطراب', en: 'Anxiety / restlessness', roman: 'Bechaini' },
    { ur: 'موت کا خوف', en: 'Fear of death', roman: 'Maut ka khauf' },
    { ur: 'اندھیرے کا خوف', en: 'Fear of dark', roman: 'Andheray ka khauf' },
    { ur: 'تنہائی پسند', en: 'Aversion to company', roman: 'Tanhai pasand' },
    { ur: 'ساتھ کی خواہش', en: 'Desire for company', roman: 'Sath ki khwahish' },
    { ur: 'تسلی سے بدتر', en: 'Worse from consolation', roman: 'Tasalli se badtar' },
    { ur: 'رونا آتا ہے', en: 'Weeping easily', roman: 'Rona' },
    { ur: 'حسد', en: 'Jealousy', roman: 'Hasad' },
    { ur: 'ذہنی دباؤ / تناؤ', en: 'Mental strain / stress', roman: 'Zehni dabao' },
    { ur: 'شک و بدگمانی', en: 'Suspiciousness', roman: 'Shak o badgumani' },
    { ur: 'بھولنے کی عادت', en: 'Forgetful', roman: 'Bhoolnay ki adat' },
    { ur: 'جلد بازی کی عادت', en: 'Hurried / hasty', roman: 'Jald bazi' },
    { ur: 'بہت صفائی پسند', en: 'Fastidious', roman: 'Safai pasand' },
    { ur: 'صبح کو اداسی', en: 'Morning sadness', roman: 'Subah ko udasi' },
    { ur: 'غصے میں توڑ پھوڑ', en: 'Destructive in anger', roman: 'Ghusay mein tor phor' },
    { ur: 'مذہبی جوش', en: 'Religious affection', roman: 'Mazhabi josh' },
    { ur: 'جھگڑالو مزاج', en: 'Quarrelsome', roman: 'Jhagralu mizaj' },
    { ur: 'رحم دلی / ہمدردی', en: 'Sympathetic / kind', roman: 'Reham dili' },
    { ur: 'اکیلے رہنا پسند', en: 'Wants to be alone', roman: 'Akalay rehna pasand' }
];

var CT_PHYSICAL = [
    { ur: 'ٹھنڈا مزاج (Chilly)', en: 'Chilly patient', roman: 'Thanda mizaj' },
    { ur: 'گرم مزاج (Hot)', en: 'Hot patient', roman: 'Garam mizaj' },
    { ur: 'بہت پیاس (ایک ساتھ زیادہ پانی)', en: 'Thirsty — large quantity', roman: 'Bohat pyas' },
    { ur: 'تھوڑا تھوڑا بار بار پیاس', en: 'Thirsty — small frequent sips', roman: 'Thora thora pyas' },
    { ur: 'پیاس نہیں', en: 'Thirstless', roman: 'Pyas nahi' },
    { ur: 'زیادہ پسینہ', en: 'Profuse sweat', roman: 'Zyada pasina' },
    { ur: 'رات کا پسینہ', en: 'Night sweats', roman: 'Raat ka pasina' },
    { ur: 'سر / گردن کا پسینہ', en: 'Sweat on head / neck', roman: 'Sir ka pasina' },
    { ur: 'نیند سے آرام نہیں', en: 'Unrefreshing sleep', roman: 'Neend se aaram nahi' },
    { ur: 'آدھی رات کی بے خوابی', en: 'Midnight insomnia', roman: 'Adhi raat bekhwabi' },
    { ur: 'پیٹ کے بل سونا', en: 'Sleeps on abdomen', roman: 'Pait ke bal sona' },
    { ur: 'میٹھے کی خواہش', en: 'Craves sweets', roman: 'Meethe ki khwahish' },
    { ur: 'نمک کی خواہش', en: 'Craves salt', roman: 'Namak ki khwahish' },
    { ur: 'کھٹے کی خواہش', en: 'Craves sour', roman: 'Khatay ki khwahish' },
    { ur: 'مسالے کی خواہش', en: 'Craves spicy', roman: 'Masalay ki khwahish' },
    { ur: 'دودھ سے خرابی', en: 'Worse from milk', roman: 'Doodh se kharabi' },
    { ur: 'چربی سے نفرت', en: 'Aversion to fat', roman: 'Charbi se nafrat' },
    { ur: 'گوشت سے نفرت', en: 'Aversion to meat', roman: 'Gosht se nafrat' },
    { ur: 'انڈے سے نفرت', en: 'Aversion to eggs', roman: 'Anday se nafrat' },
    { ur: 'بھوک کم', en: 'Appetite low', roman: 'Bhook kam' },
    { ur: 'ہاضمہ کمزور', en: 'Weak digestion', roman: 'Hazma kamzor' },
    { ur: 'تھکاوٹ / کمزوری', en: 'Fatigue / weakness', roman: 'Thakawat' },
    { ur: 'قبض کا رجحان', en: 'Constipation tendency', roman: 'Qabz rujhan' },
    { ur: 'دست کا رجحان', en: 'Loose stool tendency', roman: 'Dast rujhan' },
    { ur: 'بار بار پیشاب', en: 'Frequent urination', roman: 'Bar bar peshab' }
];

var CT_MODAGG = [
    { ur: 'صبح کو بدتر', en: 'Worse morning', roman: 'Subah badtar' },
    { ur: 'شام کو بدتر', en: 'Worse evening', roman: 'Shaam badtar' },
    { ur: 'رات کو بدتر', en: 'Worse night', roman: 'Raat badtar' },
    { ur: 'آدھی رات کے بعد بدتر', en: 'Worse after midnight', roman: 'Adhi raat ke baad' },
    { ur: 'سورج نکلتے وقت بدتر', en: 'Worse at sunrise', roman: 'Suraj nikaltay waqt' },
    { ur: 'غروب آفتاب کے بعد بدتر', en: 'Worse after sunset', roman: 'Ghuroob ke baad' },
    { ur: 'ٹھنڈ سے بدتر', en: 'Worse from cold', roman: 'Thand se badtar' },
    { ur: 'ٹھنڈی نمی سے بدتر', en: 'Worse from cold damp', roman: 'Thandi nami se' },
    { ur: 'گرمی سے بدتر', en: 'Worse from heat', roman: 'Garmi se badtar' },
    { ur: 'دھوپ سے بدتر', en: 'Worse from sun', roman: 'Dhoop se badtar' },
    { ur: 'حرکت سے بدتر', en: 'Worse from motion', roman: 'Harkat se badtar' },
    { ur: 'سکون / لیٹنے سے بدتر', en: 'Worse from rest / lying', roman: 'Sukoon se badtar' },
    { ur: 'کھانے کے بعد بدتر', en: 'Worse after eating', roman: 'Khane ke baad' },
    { ur: 'ٹھنڈے پانی / کھانے سے بدتر', en: 'Worse from cold food / drinks', roman: 'Thanday se badtar' },
    { ur: 'چھونے سے بدتر', en: 'Worse from touch', roman: 'Chhoonay se badtar' },
    { ur: 'دباؤ سے بدتر', en: 'Worse from pressure', roman: 'Dabao se badtar' },
    { ur: 'خالی پیٹ بدتر', en: 'Worse empty stomach', roman: 'Khali pait badtar' },
    { ur: 'چلنے سے بدتر', en: 'Worse from walking', roman: 'Chalnay se badtar' },
    { ur: 'سیڑھیاں چڑھنے سے بدتر', en: 'Worse ascending steps', roman: 'Seerhiyan charhnay se' },
    { ur: 'نمی / تالاب کے پاس بدتر', en: 'Worse damp / near water', roman: 'Nami se badtar' },
    { ur: 'بارش کے موسم میں بدتر', en: 'Worse rainy season', roman: 'Barish mein badtar' },
    { ur: 'غصے کے بعد بدتر', en: 'Worse after anger', roman: 'Ghusay ke baad' },
    { ur: 'غم / صدمے کے بعد بدتر', en: 'Worse after grief / shock', roman: 'Gham ke baad' },
    { ur: 'دودھ پینے سے بدتر', en: 'Worse after milk', roman: 'Doodh ke baad' },
    { ur: 'بستر کی گرمی سے بدتر', en: 'Worse warmth of bed', roman: 'Bistar ki garmi se' }
];

var CT_MODAMEL = [
    { ur: 'شام کو بہتر', en: 'Better evening', roman: 'Shaam behtar' },
    { ur: 'رات کو بہتر', en: 'Better night', roman: 'Raat behtar' },
    { ur: 'گرمی سے بہتر', en: 'Better from warmth', roman: 'Garmi se behtar' },
    { ur: 'ٹھنڈک سے بہتر', en: 'Better from cold', roman: 'Thandak se behtar' },
    { ur: 'کھلی ہوا میں بہتر', en: 'Better open air', roman: 'Khuli hawa behtar' },
    { ur: 'حرکت سے بہتر', en: 'Better from motion', roman: 'Harkat se behtar' },
    { ur: 'مکمل سکون سے بہتر', en: 'Better complete rest', roman: 'Sukoon se behtar' },
    { ur: 'دباؤ سے بہتر', en: 'Better hard pressure', roman: 'Dabao se behtar' },
    { ur: 'گرم چیز رکھنے سے بہتر', en: 'Better hot applications', roman: 'Garam cheez se' },
    { ur: 'کھانے سے بہتر', en: 'Better eating', roman: 'Khane se behtar' },
    { ur: 'گرم مشروبات سے بہتر', en: 'Better warm drinks', roman: 'Garam mashroob se' },
    { ur: 'مختصر نیند سے بہتر', en: 'Better short nap', roman: 'Mukhtasar neend se' },
    { ur: 'بند کمرے میں بہتر', en: 'Better in closed room', roman: 'Band kamray mein' },
    { ur: 'جھک جانے سے بہتر', en: 'Better bending double', roman: 'Jhuknay se behtar' },
    { ur: 'پٹکے / ہوا کھانے سے بہتر', en: 'Better fanning / eructations', roman: 'Patakay se behtar' },
    { ur: 'پیٹ کے بل لیٹنے سے بہتر', en: 'Better lying on abdomen', roman: 'Pait ke bal behtar' }
];

var CT_FAMILY = [
    { ur: 'شوگر', en: 'Diabetes', roman: 'Sugar' },
    { ur: 'بلڈ پریشر', en: 'Blood pressure', roman: 'Blood pressure' },
    { ur: 'دل کا مرض', en: 'Heart disease', roman: 'Dil ka marz' },
    { ur: 'ٹی بی', en: 'Tuberculosis', roman: 'TB' },
    { ur: 'کینسر', en: 'Cancer', roman: 'Cancer' },
    { ur: 'دمہ', en: 'Asthma', roman: 'Damgha' },
    { ur: 'جلدی بیماری', en: 'Skin disease', roman: 'Jildi bimari' },
    { ur: 'اعصابی / ذہنی مرض', en: 'Nervous / mental illness', roman: 'Aasabi marz' },
    { ur: 'گٹھیا', en: 'Arthritis', roman: 'Garhiya' },
    { ur: 'پتھری', en: 'Stones', roman: 'Pathri' }
];

var CT_CAUSE = [
    { ur: 'غم / صدمے کے بعد', en: 'After grief / shock', roman: 'Gham ke baad' },
    { ur: 'غصے کے بعد', en: 'After anger', roman: 'Ghusay ke baad' },
    { ur: 'چوٹ کے بعد', en: 'After injury', roman: 'Chot ke baad' },
    { ur: 'بخار / وائرس کے بعد', en: 'After fever / virus', roman: 'Bukhar ke baad' },
    { ur: 'دواﺅں کے بعد', en: 'After medicines', roman: 'Dawaon ke baad' },
    { ur: 'ویکسینیشن کے بعد', en: 'After vaccination', roman: 'Vaccination ke baad' },
    { ur: 'زچگی / عمل کے بعد', en: 'After childbirth / operation', roman: 'Zachgi ke baad' },
    { ur: 'محنت / وزن اٹھانے سے', en: 'Strain / heavy lifting', roman: 'Mehnat se' },
    { ur: 'موسم کی تبدیلی سے', en: 'Weather change', roman: 'Mausam se' },
    { ur: 'سردی / گیلے میں رہنے سے', en: 'Cold / damp exposure', roman: 'Sardi geela pan' },
    { ur: 'چکنائی / مسالوں سے', en: 'Fatty / spicy food', roman: 'Chiknai masala' },
    { ur: 'نشے / تمباکو سے', en: 'Addictions / tobacco', roman: 'Nasha tambaku' }
];

var CT_MIASM = [
    { ur: 'سوریاٹک — خارش، جلن، سستی', en: 'Psoric — itching, burning, sluggish', roman: 'Psoric' },
    { ur: 'سکوسیٹک — گانٹھ، ورم، رطوبت', en: 'Sycotic — growths, swelling, discharges', roman: 'Sycotic' },
    { ur: 'سیفیلیٹک — انحطاط، زخم، خرابی', en: 'Syphilitic — destruction, ulcers, deformity', roman: 'Syphilitic' },
    { ur: 'مخلوط میاسم', en: 'Mixed miasm', roman: 'Mixed' }
];

var CT_ACUTE_Q = [
    { id: 'onset', ur: 'شروع کیسے ہوا؟', en: 'How did it start?', roman: 'Shuru kaise hua?', opts: [
        { ur: 'اچانک', en: 'Sudden', roman: 'Achanak' },
        { ur: 'آہستہ آہستہ', en: 'Gradual', roman: 'Ahista' }
    ]},
    { id: 'time', ur: 'کب بڑھتا ہے؟', en: 'When is it worse?', roman: 'Kab barhta hai?', opts: [
        { ur: 'رات', en: 'Night', roman: 'Raat' },
        { ur: 'صبح', en: 'Morning', roman: 'Subah' },
        { ur: 'دوپہر', en: 'Afternoon', roman: 'Dopahar' },
        { ur: 'شام', en: 'Evening', roman: 'Shaam' }
    ]}
];

// ==================== MASTER LEVEL-1 QUESTION BANK (v4) ====================
// منبع: "MASTER HOMEOPATHIC CASE-TAKING PROTOCOL" (Level-1) — سٹیپ 1 تا 9
// req:1 = ★ لازمی (ہر مریض سے)، req:0 = اختیاری/شرطی (دستاویز میں "اگر… کرے / صرف ضرورت پر / جہاں متعلق ہو")
// type: ta = textarea، in = input، chips = صرف چپس، both = چپس + textarea
// sex:'f' = صرف خاتون مریضہ کے لیے (پروفائل سٹرپ سے خودکار ظاہر/چھپاؤ)

var CT_SIDES = [
    { ur: 'دائیں طرف', en: 'Right side', roman: 'Dahin taraf' },
    { ur: 'بائیں طرف', en: 'Left side', roman: 'Baen taraf' },
    { ur: 'کبھی دونوں', en: 'Both / alternating', roman: 'Dono taraf' },
    { ur: 'درمیان میں', en: 'Central', roman: 'Darmiyan' }
];

var CT_THERM = [
    { ur: 'گرم مزاج — گرمی ناقابلِ برداشت', en: 'Hot patient — heat unbearable', roman: 'Garam mizaj' },
    { ur: 'ٹھنڈا مزاج — سردی ناقابلِ برداشت', en: 'Chilly patient — cold unbearable', roman: 'Thanda mizaj' },
    { ur: 'کوئی خاص فرق نہیں', en: 'No particular difference', roman: 'Farq nahi' }
];

// P-13 probes — صرف جب مریض کا کھلا جواب نامکمل ہو
var CT_P13A = [
    { ur: 'حرکت سے', en: 'From motion', roman: 'Harkat se' },
    { ur: 'آرام کرنے سے', en: 'From resting', roman: 'Aaram se' },
    { ur: 'چلنے سے', en: 'From walking', roman: 'Chalne se' },
    { ur: 'جھکنے سے', en: 'From bending', roman: 'Jhukne se' },
    { ur: 'سیدھا کھڑے ہونے سے', en: 'Standing erect', roman: 'Kharay hone se' },
    { ur: 'لیٹنے سے', en: 'Lying', roman: 'Letne se' },
    { ur: 'بیٹھنے سے', en: 'Sitting', roman: 'Baithne se' },
    { ur: 'کھانے سے', en: 'From eating', roman: 'Khane se' },
    { ur: 'خالی پیٹ', en: 'Empty stomach', roman: 'Khali pait' },
    { ur: 'کسی خاص غذا سے', en: 'Particular food', roman: 'Khas ghiza' },
    { ur: 'ٹھنڈی چیز سے', en: 'Cold things', roman: 'Thandi cheez' },
    { ur: 'گرم چیز سے', en: 'Hot things', roman: 'Garam cheez' },
    { ur: 'چھونے یا دبانے سے', en: 'Touch / pressure', roman: 'Chhoona dabao' },
    { ur: 'روشنی سے', en: 'Light', roman: 'Roshni se' },
    { ur: 'شور سے', en: 'Noise', roman: 'Shor se' },
    { ur: 'بو سے', en: 'Odours', roman: 'Boo se' },
    { ur: 'ذہنی محنت سے', en: 'Mental exertion', roman: 'Zehni mehnat' },
    { ur: 'جسمانی محنت سے', en: 'Physical exertion', roman: 'Jismani mehnat' },
    { ur: 'نیند کی کمی سے', en: 'Loss of sleep', roman: 'Neend ki kami' },
    { ur: 'جذباتی کیفیت کے بعد', en: 'After emotions', roman: 'Jazbati ke baad' }
];

// P-14 probes
var CT_P14A = [
    { ur: 'آرام', en: 'Rest', roman: 'Aaram' },
    { ur: 'حرکت', en: 'Motion', roman: 'Harkat' },
    { ur: 'دباؤ', en: 'Pressure', roman: 'Dabao' },
    { ur: 'مالش', en: 'Rubbing', roman: 'Malish' },
    { ur: 'گرمی', en: 'Heat', roman: 'Garmi' },
    { ur: 'سردی', en: 'Cold', roman: 'Sardi' },
    { ur: 'لیٹنا', en: 'Lying down', roman: 'Letna' },
    { ur: 'بیٹھنا', en: 'Sitting', roman: 'Baithna' },
    { ur: 'کھڑا ہونا', en: 'Standing', roman: 'Kharahona' },
    { ur: 'کھانا', en: 'Eating', roman: 'Khana' },
    { ur: 'پینا', en: 'Drinking', roman: 'Peena' },
    { ur: 'قے', en: 'Vomiting', roman: 'Qay' },
    { ur: 'پاخانہ', en: 'Stool', roman: 'Pakhana' },
    { ur: 'پیشاب', en: 'Urination', roman: 'Peshab' },
    { ur: 'نیند', en: 'Sleep', roman: 'Neend' },
    { ur: 'اندھیرا', en: 'Darkness', roman: 'Andhera' },
    { ur: 'خاموشی', en: 'Silence', roman: 'Khamoshi' }
];

var CT_M = [];

// ---------- باب 1: شکایتِ عمدہ + تاریخِ حال (Q-1..Q-10) ----------
CT_M.push({ id: 'q', num: 1, icon: '📖',
    t: { ur: 'باب 1 — شکایتِ عمدہ اور تاریخِ حال', en: 'Chief Complaint & Present Illness', ro: 'Chief Complaint aur Tareekh-e-Haal' },
    sub: { ur: 'پہلے مریض کو آزادانہ بولنے دیں — جو خود بتا دے وہ دوبارہ نہ پوچھیں', en: 'Let the patient speak freely — never repeat what is already told', ro: 'Pehle mareez ko azadana bolne dein' },
    qs: [
        { id: 'Q1', req: 1, type: 'ta', t: { ur: 'آغاز — "آپ اطمینان سے بیٹھیں، جلدی کی کوئی ضرورت نہیں۔ جس تکلیف کی وجہ سے آئے ہیں، شروع سے آخر تک اپنے الفاظ میں پوری تفصیل بیان کریں — میں پہلے صرف سنوں گا۔"', en: 'Opening question — full narrative in patient own words, listen without interrupting' } },
        { id: 'Q2', req: 1, type: 'ta', t: { ur: '"اگر اللہ کے حکم سے آج صرف ایک مسئلہ مکمل ختم کیا جا سکے تو سب سے پہلے کس سے نجات چاہیں گے؟ اور کیوں؟"', en: 'If only one problem could be fixed today, which one first — and why?' } },
        { id: 'Q3', req: 1, type: 'ta', t: { ur: 'بیماری کی پوری کہانی — پہلی بار کب محسوس ہوئی؟ اس وقت زندگی میں کیا حالات؟ شروع میں کیسی؟ وقت کے ساتھ کیا تبدیلیاں؟ آج کیا کیفیت؟', en: 'Illness story — onset, circumstances, progression, current state' } },
        { id: 'Q4', req: 1, type: 'ta', t: { ur: 'آپ کے اپنے خیال میں بیماری کس وجہ سے شروع ہوئی؟ (غم، ذہنی دباؤ، خوف، بے عزتی، مالی نقصان، چوٹ، انفیکشن، حمل، آپریشن، دوا — جو یاد ہو تفصیل سے)', en: 'Own view of the trigger — grief, stress, fear, loss, injury, infection, delivery, operation, medicines' } },
        { id: 'Q5', req: 1, type: 'ta', t: { ur: 'حملے کا انداز — اچانک شروع ہوتی ہے یا آہستہ؟ شدت ایک جیسی رہتی ہے یا بدلتی؟ اور ختم کیسے ہوتی ہے؟', en: 'Pattern — sudden or gradual, constant or changing intensity, how it ends' } },
        { id: 'Q6', req: 1, type: 'ta', t: { ur: 'تکرار و دورانیہ — کتنی بار ہوتی ہے؟ ایک حملہ کتنی دیر رہتا ہے؟ ختم ہونے پر مکمل نارمل ہو جاتے ہیں یا کچھ باقی رہتا ہے؟', en: 'Frequency, duration of each attack, full recovery or residue?' } },
        { id: 'Q7', req: 1, type: 'ta', t: { ur: 'روزمرہ زندگی پر اثر — کام، گھر، نیند، کھانا پینا، چلنے پھرنے، لوگوں سے ملنا جلنا، ذہنی سکون میں کیا تبدیلی؟', en: 'Impact on life — work, home, sleep, food, mobility, relations, peace of mind' } },
        { id: 'Q8', req: 1, type: 'ta', t: { ur: 'اب تک کا علاج — کون کون سے علاج کروائے؟ کس سے کتنا فائدہ؟ عارضی یا مستقل؟ کسی دوا سے نئی علامات بھی؟', en: 'Treatment history — what, how much benefit, temporary or lasting, new symptoms?' } },
        { id: 'Q9', req: 0, type: 'ta', t: { ur: 'ٹیسٹ/رپورٹس (اگر کروائے ہوں) — خون، الٹراساؤنڈ، ایکسرے، سی ٹی، ایم آر آئی میں کیا بتایا گیا؟', en: 'Investigations — labs, ultrasound, X-ray, CT, MRI findings' } },
        { id: 'Q10', req: 1, type: 'ta', t: { ur: 'خلاصہ تصدیق — "اگر میں آپ کی بات کا خلاصہ کروں تو آپ کی سب سے بڑی پریشانی یہ ہے کہ…" کیا میں نے صحیح سمجھا، یا کچھ شامل/درست کرنا چاہیں گے؟', en: 'Summary confirmation — did I understand you right, or correct/add something?' } }
    ]});

// ---------- باب 2: خاص شکایت — بنیادی دس سوالات (PQ-1..PQ-10) ----------
CT_M.push({ id: 'pq', num: 2, icon: '🔑',
    t: { ur: 'باب 2 — خاص شکایت: بنیادی دس سوالات', en: 'Particular Complaint — 10 Core Questions', ro: 'Khas Shikayat — 10 Buniyadi Sawal' },
    sub: { ur: 'ہر خاص شکایت (درد، جلن، خارش، کھانسی) کا مشترکہ ڈھانچہ', en: 'Common structure of every particular complaint', ro: 'Har shikayat ka mushtarka dhancha' },
    qs: [
        { id: 'PQ1', req: 1, type: 'in', t: { ur: 'مقام — ہاتھ سے وہ جگہ دکھائیں جہاں سب سے زیادہ تکلیف ہوتی ہے (ایک سے زیادہ جگہیں ہوں تو سب سے تکلیف والی پہلے)', en: 'Location — point with hand where it is felt most' } },
        { id: 'PQ2', req: 1, type: 'ta', t: { ur: 'احساس — اپنے الفاظ میں کیسی محسوس ہوتی ہے؟ (مثالیں آخر میں — پہلے مریض کی اپنی زبان: جلن، چبھنا، کھنچاؤ، دباؤ، دھڑکن، پھٹنے کا احساس…)', en: 'Sensation in own words — examples only if the patient cannot describe' } },
        { id: 'PQ3', req: 1, type: 'in', t: { ur: 'پھیلاؤ — صرف اسی جگہ رہتی ہے یا جسم کے کسی اور حصے کی طرف پھیلتی ہے؟ کس سمت؟', en: 'Radiation — stays local or spreads? which direction?' } },
        { id: 'PQ4', req: 1, type: 'in', ph: { ur: 'مثلاً: ابھی 6/10 — زیادہ سے زیادہ 9/10', en: 'e.g. now 6/10 — max 9/10' }, t: { ur: 'شدت — 0 (بالکل نہیں) تا 10 (شدید ترین): اس وقت کتنی؟ اور حملے میں زیادہ سے زیادہ کتنی؟', en: 'Intensity 0-10 — now and maximum' } },
        { id: 'PQ5', req: 1, type: 'in', t: { ur: 'وقت — دن یا رات کے کسی خاص وقت میں زیادہ؟ یا اس کا کوئی مقررہ وقت نہیں؟', en: 'Timing — any particular time of day or night?' } },
        { id: 'PQ6', req: 1, type: 'ta', t: { ur: 'موڈیلیٹیز — آپ نے خود کیا نوٹ کیا جس سے بڑھ جاتی ہے اور کن چیزوں سے آرام آتا ہے؟ (اپنے تجربے کے مطابق)', en: 'Modalities — patient own experience of what worsens and what relieves' } },
        { id: 'PQ7', req: 1, type: 'ta', t: { ur: 'ساتھ کیا ہوتا ہے؟ (متلی، قے، پسینہ، چکر، کمزوری، بے چینی، بخار یا کوئی اور علامت؟)', en: 'Concomitants — what else comes with it?' } },
        { id: 'PQ8', req: 0, type: 'ta', t: { ur: 'دورے کی ترتیب — حملہ شروع ہوتا ہے تو سب سے پہلی علامت کیا؟ پھر کیا؟ آخر میں کیسے ختم ہوتا ہے؟', en: 'Sequence of the attack — first, then, how it ends (if periodic)' } },
        { id: 'PQ9', req: 1, type: 'ta', t: { ur: 'فعل پر اثر — اس تکلیف کے دوران کون سا کام نہیں کر سکتے جو عام حالت میں آسانی سے کر لیتے تھے؟', en: 'Effect on function — what you cannot do during it' } },
        { id: 'PQ10', req: 1, type: 'ta', t: { ur: 'مریض کا اپنا بیان — اگر کسی ایسے شخص کو سمجھانی ہو جس نے یہ کبھی محسوس نہ کی ہو تو کیسے سمجھائیں گے؟', en: 'Patient own description — how to explain it to someone who never felt it' } }
    ]});

// ---------- باب 3: درد پروٹوکول (P-03..P-20) ----------
CT_M.push({ id: 'p', num: 3, icon: '🩹',
    t: { ur: 'باب 3 — درد پروٹوکول: تفصیلی سوالات', en: 'Pain Protocol — Detailed', ro: 'Dard Protocol — Tafseeli' },
    sub: { ur: 'صرف درد کی شکایت پر — P-01 اور P-02 باب 2 میں شامل ہیں', en: 'For pain complaints — P-01/P-02 live in chapter 2', ro: 'Sirf dard ki shikayat par' },
    note: { ur: 'دہرائی سے بچاؤ: P-01 (مقام) اور P-02 (پھیلاؤ) باب 2 کے PQ-1 اور PQ-3 میں محفوظ ہیں — وہی فیلڈ استعمال کریں۔ P-13 اور P-14 میں پہلے کھلا سوال کریں؛ نیچے دی گئی چیپس صرف اس وقت جوڑیں جب مریض کا جواب نامکمل ہو۔', en: 'P-01/P-02 are covered by PQ-1/PQ-3. Ask open questions first in P-13/P-14; attach chips only for incomplete answers.' },
    qs: [
        { id: 'P03', req: 0, type: 'chips', single: 1, opts: CT_SIDES, t: { ur: 'طرف — صرف دائیں، صرف بائیں، یا کبھی دائیں کبھی بائیں؟', en: 'Laterality — right, left, or alternating?' } },
        { id: 'P04', req: 1, type: 'ta', t: { ur: 'درد ہوتے وقت اصل میں کیسا محسوس ہوتا ہے؟ اپنے الفاظ میں کیفیت بیان کریں۔', en: 'What is the pain actually like — own words first' } },
        { id: 'P05', req: 1, type: 'ta', t: { ur: 'آغاز — حملے کے پہلے لمحے میں کیا محسوس ہوتا ہے؟ اچانک پوری شدت یا ہلکا شروع ہو کر آہستہ بڑھتا ہے؟', en: 'Onset — sudden full intensity or slowly building?' } },
        { id: 'P06', req: 1, type: 'ta', t: { ur: 'شروع ہونے سے کچھ دیر پہلے کوئی علامت محسوس ہوتی ہے جس سے اندازہ ہو جائے کہ درد آنے والا ہے؟', en: 'Warning symptoms before the attack?' } },
        { id: 'P07', req: 1, type: 'in', t: { ur: 'دورانیہ — ایک مرتبہ شروع ہو جائے تو عام طور پر کتنی دیر رہتا ہے؟ (چند منٹ، گھنٹے، اس سے زیادہ؟)', en: 'Duration of one attack?' } },
        { id: 'P08', req: 1, type: 'in', t: { ur: 'اختتام — اچانک ختم ہو جاتا ہے یا آہستہ آہستہ شدت کم ہوتی جاتی ہے؟', en: 'Termination — sudden or gradual fade?' } },
        { id: 'P09', req: 1, type: 'ta', t: { ur: 'پورے دورے میں شدت ایک جیسی رہتی ہے یا کبھی کم کبھی زیادہ؟ بدلتی ہو تو کس طرح؟', en: 'Constant intensity or fluctuating — how?' } },
        { id: 'P10', req: 1, type: 'ta', t: { ur: 'درد کے دوران سب سے مشکل یا ناقابلِ برداشت مرحلہ کون سا؟ اس وقت درد کیسا محسوس ہوتا ہے؟', en: 'Most unbearable phase — what is it like?' } },
        { id: 'P11', req: 1, type: 'in', t: { ur: 'خاص وقت — صبح اٹھتے، دوپہر، شام، رات، آدھی رات کے بعد؟ کوئی خاص وقت نہیں تو وہ بھی لکھیں۔', en: 'Particular time — morning, noon, evening, night, after midnight?' } },
        { id: 'P12', req: 1, type: 'in', t: { ur: 'تکرار — روزانہ، ہفتے میں چند بار، مہینے میں، یا کوئی مقررہ انداز نہیں؟', en: 'Frequency — daily, few times a week, monthly, irregular?' } },
        { id: 'P13', req: 1, type: 'both', opts: CT_P13A, t: { ur: 'بڑھانے والی چیزیں — آپ کے تجربے میں کیا چیزیں درد شروع کرتی یا بڑھاتی ہیں؟ (کھلا جواب پہلے)', en: 'Aggravations — open question first' } },
        { id: 'P14', req: 1, type: 'both', opts: CT_P14A, t: { ur: 'آرام — جب درد شروع ہو جائے تو کس چیز سے کچھ کم ہوتا ہے؟ کیا کرنے سے بہتر محسوس کرتے ہیں؟', en: 'Ameliorations — what makes it better?' } },
        { id: 'P15', req: 1, type: 'ta', t: { ur: 'ساتھ آنے والی علامات — درد کے وقت جسم/طبیعت میں اور کیا تبدیلی؟ (متلی، قے، پسینہ، چکر، کمزوری، بخار، کپکپی، بے چینی، سانس…)', en: 'Concomitants during the pain' } },
        { id: 'P16', req: 0, type: 'ta', t: { ur: 'پورا حملہ ترتیب سے — پہلے کیا، پھر کیا، درد کب زیادہ شدت پر پہنچتا، آخر میں کیا؟ (خاص طور پر جب کئی علامات ایک ساتھ ہوں)', en: 'Full attack sequence from start to end' } },
        { id: 'P17', req: 1, type: 'ta', t: { ur: 'کیا ہر مرتبہ بالکل اسی طرح ہوتا ہے، یا کبھی جگہ، شدت، نوعیت، وقت یا ساتھ کی علامات مختلف بھی ہوتی ہیں؟', en: 'Same attack every time, or do they differ?' } },
        { id: 'P18', req: 1, type: 'ta', t: { ur: 'شروع ہونے سے اب تک کیا تبدیلی؟ (پہلے ایک جگہ اب دوسری، پہلے ہلکا اب شدید، ساتھ کی علامت آ گئی/چلی گئی)', en: 'Evolution since onset — place, intensity, character changes' } },
        { id: 'P19', req: 1, type: 'ta', t: { ur: 'آپ نے اپنے طور پر کوئی ایسا تعلق یا انداز محسوس کیا جو میں نے ابھی نہیں پوچھا؟ (خاص وقت، موسم، غذا، حرکت، جذباتی کیفیت…)', en: 'Patient own observation not yet asked' } },
        { id: 'P20', req: 1, type: 'ta', t: { ur: '⚠️ حفاظتی سوال — کبھی بے ہوشی، اچانک کمزوری یا سن ہونا، بولنے میں مشکل، نظر میں اچانک تبدیلی، سانس کی شدید دشواری، سینے میں شدید دباؤ؟', en: 'Red flags — fainting, sudden weakness/numbness, speech/vision trouble, severe breathlessness, chest pressure' } }
    ]});

// ---------- باب 4: ذہنی و جذباتی کیفیت (M-01..M-15) ----------
CT_M.push({ id: 'm', num: 4, icon: '🧠',
    t: { ur: 'باب 4 — ذہنی و جذباتی کیفیت', en: 'Mental & Emotional State', ro: 'Zehni aur Jazbati Kaifiyat' },
    sub: { ur: 'مقصد دوا تلاش نہیں — مریض کی اپنی فطری کیفیت سامنے لانا (وزن 12)', en: 'Bring out the natural state — not to hunt a remedy (weight 12)', ro: 'Mareez ki fitri kaifiyat samne lana' },
    note: { ur: 'یہ 15 سوال ہر مریض سے ایک ایک کر کے نہیں پوچھنے — پہلے آزادانہ اظہار کا موقع دیں؛ جو خود سامنے آ جائے وہ دوبارہ نہیں۔ فہرستیں (غصے کے محرکات وغیرہ) شروع میں نہ سنیں۔', en: 'Do not ask all 15 one by one — let the patient speak first; never read out lists in the beginning.' },
    qs: [
        { id: 'M01', req: 1, type: 'ta', t: { ur: 'بیماری شروع ہونے کے بعد طبیعت، مزاج یا جذبات میں کیا تبدیلی محسوس کی؟ اگر ہوئی تو اپنے الفاظ میں۔', en: 'Change in mood/emotions since the illness began' } },
        { id: 'M02', req: 0, type: 'ta', t: { ur: 'پریشانی، دکھ یا غصے کا اظہار عموماً کیسے کرتے ہیں — بات کرتے، خاموش رہتے، روتے، غصہ کرتے، اندر رکھتے؟', en: 'How do you express emotions?' } },
        { id: 'M03', req: 0, type: 'ta', t: { ur: 'جب کوئی تسلی دینے یا ہمدردی کرنے کی کوشش کرتا ہے تو کیسا محسوس ہوتا ہے — اچھا لگتا، برا لگتا، یا کوئی خاص فرق نہیں؟', en: 'Reaction to consolation/sympathy' } },
        { id: 'M04', req: 1, type: 'ta', t: { ur: 'ذہنی پریشانی کے وقت طبیعت کس طرف جاتی ہے — کسی کے ساتھ رہنا چاہتے یا اکیلے؟ اور اس وقت دوسروں سے کیا چاہتے ہیں؟', en: 'Company or solitude when distressed — and what do you want from others?' } },
        { id: 'M05', req: 0, type: 'ta', t: { ur: 'غصہ — اس وقت اندر کیا ہوتا ہے؟ کیسا ظاہر ہوتا ہے؟ فوراً ظاہر کر دیتے یا روک لیتے؟ روکیں تو بعد میں کیا ہوتا ہے؟', en: 'Anger — inner state, expression, vented or suppressed, aftermath' } },
        { id: 'M06', req: 0, type: 'ta', t: { ur: 'کن حالات میں غصہ زیادہ آتا ہے؟ (اپنا تجربہ — توہین/ناانصافی کی فہرست شروع میں نہیں سنانے)', en: 'What situations trigger anger?' } },
        { id: 'M07', req: 1, type: 'ta', t: { ur: 'کن چیزوں یا حالات سے واقعی خوف محسوس ہوتا ہے؟ خوف کے وقت اندر اور جسم میں کیا تبدیلی اور ردِعمل کیا ہوتا ہے؟', en: 'Fears — and body/mind reaction during fear' } },
        { id: 'M08', req: 0, type: 'ta', t: { ur: 'کوئی مسئلہ درپیش ہو تو ذہن اس کے ساتھ کیا کرتا ہے — بار بار سوچتے رہتے، خود کو دوسرے کام میں لگا لیتے، کسی سے بات کرتے؟', en: 'How does the mind handle a problem — brooding, distraction, talking?' } },
        { id: 'M09', req: 0, type: 'ta', t: { ur: 'زندگی کے گزرے اہم واقعات (جن کا گہرا اثر پڑا) اب بھی ذہن میں اسی طرح رہتے ہیں یا وقت کے ساتھ اثر کم ہو گیا؟', en: 'Do past significant events still live with the same force?' } },
        { id: 'M10', req: 0, type: 'ta', t: { ur: 'بیماری شروع ہونے سے پہلے کوئی ایسا واقعہ، تبدیلی یا صورتِ حال جس کا اس بیماری سے کوئی تعلق محسوس ہو؟', en: 'Significant event before illness onset related to it?' } },
        { id: 'M11', req: 0, type: 'ta', t: { ur: 'کیا طبیعت کبھی اچانک ایک کیفیت سے دوسری کیفیت میں چلی جاتی ہے؟ ایسا ہوتا ہے تو کوئی مثال؟', en: 'Sudden mood shifts from one state to another — example?' } },
        { id: 'M12', req: 0, type: 'ta', t: { ur: 'رونے سے کیسا محسوس ہوتا ہے — دل ہلکا، مزید برا، یا کوئی اور کیفیت؟ دوسروں کے سامنے روتے ہیں یا اکیلے؟', en: 'Weeping — how it feels, in front of others or alone' } },
        { id: 'M13', req: 1, type: 'ta', t: { ur: 'لوگوں کے ساتھ رہتے ہوئے عام طور پر طبیعت کیسی رہتی ہے — گھلنا ملنا پسند یا اپنی جگہ رہنا؟ بیماری کے بعد کوئی تبدیلی؟', en: 'Company preference — social or reserved; change after illness?' } },
        { id: 'M14', req: 0, type: 'ta', t: { ur: 'اکیلے رہنے سے کیا ملتا ہے یا دوسروں کی موجودگی میں کیا چیز ناگوار لگتی ہے؟ (تنہائی کی خواہش کی وجہ اہم ہے)', en: 'Why solitude — what it gives, what feels offensive in company' } },
        { id: 'M15', req: 1, type: 'ta', t: { ur: 'بستر پر جاتے ہی ذہن پرسکون ہو جاتا ہے یا خیالات چلتے رہتے ہیں؟ چلتے ہیں تو کس قسم کے؟', en: 'At bedtime — calm mind or running thoughts? what kind?' } }
    ]});

// ---------- باب 5: جسمانی عمومی — بنیادی (G-01..G-27) ----------
CT_M.push({ id: 'g1', num: 5, icon: '🌡️',
    t: { ur: 'باب 5 — جسمانی عمومی: پیاس، بھوک، کھانا، حرارت، پسینہ، نیند', en: 'Physical Generals I — Thirst, Appetite, Food, Heat, Sweat, Sleep', ro: 'Jismani Umoomi — Pyas, Bhook, Khana, Hararat, Paseena, Neend' },
    sub: { ur: 'مقصد: معمول سے ہٹی ہوئی مستقل جسمانی کیفیت پکڑنا', en: 'Goal: catch the persistent deviant physical state', ro: 'Mamool se hatti hui mustaqil kaifiyat' },
    qs: [
        { id: 'G01', req: 1, type: 'ta', t: { ur: 'عام دنوں میں پیاس کس طرح لگتی ہے؟ دن بھر کتنی بار پانی پینا پڑتا ہے، اور کیا یہ آپ کا معمول ہے یا اس میں کوئی خاص بات؟', en: 'Overall thirst pattern — how often, normal or peculiar?' } },
        { id: 'G02', req: 0, type: 'ta', t: { ur: 'ایک وقت میں تھوڑا پانی پیتے ہیں یا کافی مقدار؟ پیاس پوری طرح بجھ جاتی ہے یا جلد دوبارہ لگ جاتی ہے؟', en: 'Sips or large drinks; thirst satisfied or returns soon?' } },
        { id: 'G03', req: 0, type: 'ta', t: { ur: 'پیاس دن کے کسی خاص وقت زیادہ؟ رات کو اس وجہ سے آنکھ کھلتی ہے؟ کتنی بار اٹھنا پڑتا؟', en: 'Thirst timing; waking at night for water — how often?' } },
        { id: 'G04', req: 0, type: 'in', t: { ur: 'پانی ہی پسند ہے یا کوئی اور مشروب؟ کوئی خاص خواہش والا مشروب؟', en: 'Water or any other preferred drink?' } },
        { id: 'G05', req: 1, type: 'ta', t: { ur: 'بھوک کس طرح لگتی ہے — وقت پر مناسب، بہت زیادہ، کم، یا کبھی بالکل نہیں؟', en: 'Appetite — normal, excessive, low, absent?' } },
        { id: 'G06', req: 0, type: 'ta', t: { ur: 'وقت پر کھانا نہ کھائیں تو طبیعت پر کیا اثر پڑتا ہے؟ (کمزوری، چڑچڑاپن، کپکپی، سر درد…)', en: 'Effect of missing a meal — weakness, irritability, trembling, headache?' } },
        { id: 'G07', req: 0, type: 'ta', t: { ur: 'کبھی ایسا ہوتا ہے کہ بھوک ہو مگر کھانا دیکھ کر یا شروع کرتے ہی دل نہ چاہے؟', en: 'Hunger without desire to eat?' } },
        { id: 'G08', req: 1, type: 'ta', t: { ur: 'کوئی خاص غذا جسے غیر معمولی طور پر زیادہ پسند / بار بار دل چاہتا ہو؟ خواہش کتنی شدید، کتنی بار، نہ ملے تو کیا فرق؟', en: 'Craving — which food, how intense, what if not available?' } },
        { id: 'G09', req: 1, type: 'ta', t: { ur: 'کوئی غذا جس سے خاص نفرت یا شدید ناگواری — حالانکہ پہلے عام کھا لیتے تھے؟ (بیماری کے بعد کی تبدیلی خاص اہم)', en: 'Aversion — especially a new one after illness' } },
        { id: 'G10', req: 1, type: 'ta', t: { ur: 'کوئی غذا جسے کھانے کے بعد طبیعت یا کوئی خاص تکلیف بہتر یا خراب ہو جاتی ہو؟', en: 'Food that improves or worsens the complaint' } },
        { id: 'G11', req: 1, type: 'ta', t: { ur: 'کھانے کے دوران اور بعد کی کیفیت — فوراً بعد یا کچھ دیر بعد؟ بھاری پن، متلی، پیٹ پھولنا، نیند، کمزوری؟', en: 'During/after eating — heaviness, nausea, bloating, sleepiness, weakness?' } },
        { id: 'G12', req: 1, type: 'both', single: 1, opts: CT_THERM, t: { ur: 'حرارت — اردگرد کے لوگوں کے مقابلے میں موسم اور درجۂ حرارت کیسا محسوس کرتے ہیں؟', en: 'Thermal reaction compared to the people around you' } },
        { id: 'G13', req: 0, type: 'ta', t: { ur: 'گرمی لگتی ہے تو سب سے کیا چیز ناگوار، اور بہتر محسوس کرنے کے لیے کیا کرنا پڑتا ہے؟ (کھڑکی، پنکھا، کپڑے کم…)', en: 'Heat intolerance — what bothers most, what do you do?' } },
        { id: 'G14', req: 0, type: 'ta', t: { ur: 'سردی لگتی ہے تو کیفیت کیا ہوتی ہے؟ کس چیز سے بہتر محسوس کرتے ہیں؟', en: 'Cold intolerance — state and what relieves' } },
        { id: 'G15', req: 0, type: 'ta', t: { ur: 'کیا جسم کے کسی خاص حصے میں دوسروں کے مقابلے زیادہ گرمی یا سردی محسوس ہوتی ہے؟', en: 'Local heat/cold in any particular body part?' } },
        { id: 'G16', req: 1, type: 'ta', t: { ur: 'موسم بدلنے سے مجموعی طبیعت یا بیماری کی علامات میں فرق؟ کس موسم یا کس طرح کے موسم میں؟', en: 'Weather change effect — which season or weather?' } },
        { id: 'G17', req: 1, type: 'ta', t: { ur: 'پسینہ عام طور پر کتنا آتا ہے — معمول کے مطابق، بہت زیادہ، بہت کم، یا کسی خاص وقت/حالت میں؟', en: 'Sweating — normal, profuse, scanty, particular time?' } },
        { id: 'G18', req: 0, type: 'ta', t: { ur: 'پسینہ پورے جسم پر آتا ہے یا کسی خاص حصے پر زیادہ؟', en: 'Sweat — whole body or particular part?' } },
        { id: 'G19', req: 0, type: 'ta', t: { ur: 'کن حالات میں زیادہ — آرام، حرکت، سوتے ہوئے، رات کو، کھانے کے بعد، جذباتی کیفیت؟', en: 'Sweat circumstances — rest, motion, sleep, night, eating, emotions?' } },
        { id: 'G20', req: 1, type: 'ta', t: { ur: 'پسینہ آنے کے وقت یا بعد طبیعت میں کیا تبدیلی؟ پسینے سے کوئی تکلیف بہتر یا خراب ہوتی ہے؟', en: 'State during/after sweat — does any complaint change?' } },
        { id: 'G21', req: 1, type: 'ta', t: { ur: 'نیند عام طور پر کیسی رہتی ہے — آسانی سے آ جاتی، دیر سے، بار بار ٹوٹتی، یا نیند کے باوجود تازگی نہیں؟', en: 'Overall sleep — easy, delayed, fragmented, unrefreshing?' } },
        { id: 'G22', req: 1, type: 'ta', t: { ur: 'کس وقت نیند آنے لگتی ہے اور کس وقت سونے جاتے ہیں؟ بیماری کے بعد اس معمول میں تبدیلی؟', en: 'Sleep routine; change after illness?' } },
        { id: 'G23', req: 0, type: 'ta', t: { ur: 'لیٹتے ہیں اور نیند نہ آئے تو کیا ہوتا ہے — خیالات چلتے ہیں، جسمانی بے آرامی، یا کوئی اور وجہ؟', en: 'When sleep does not come — thoughts, physical restlessness?' } },
        { id: 'G24', req: 1, type: 'ta', t: { ur: 'رات کو آنکھ کھل جائے تو عام طور پر کس وجہ سے؟ دوبارہ نیند آنے میں کیا ہوتا ہے؟', en: 'Night waking — cause, and falling asleep again' } },
        { id: 'G25', req: 1, type: 'ta', t: { ur: 'خواب باقاعدگی سے یاد رہتے ہیں؟ کوئی خواب یا خوابوں کا انداز بار بار آتا یا خاص متاثر کرتا ہے؟', en: 'Dreams — recurring or striking ones?' } },
        { id: 'G26', req: 1, type: 'ta', t: { ur: 'سوتے ہوئے جسم/طبیعت کی خاص کیفیت — بہت گرمی، سردی، پسینہ، بے چینی، بار بار کروٹ بدلنا؟', en: 'State during sleep — heat, cold, sweat, restlessness, tossing?' } },
        { id: 'G27', req: 1, type: 'ta', t: { ur: 'صبح/نیند سے جاگتے ہی طبیعت کیسی — تازگی، تھکن، بوجھل پن، چڑچڑاپن؟', en: 'On waking — fresh, tired, heavy, irritable?' } }
    ]});

// ---------- باب 6: جسمانی عمومی — توسیع (G-28..G-40) ----------
CT_M.push({ id: 'g2', num: 6, icon: '🔄',
    t: { ur: 'باب 6 — جسمانی عمومی: توانائی، اخراجات، ماہواری، حساسیت', en: 'Physical Generals II — Energy, Eliminations, Menses, Sensitivity', ro: 'Jismani Umoomi 2 — Tawanai, Ikhrajaat, Mahwari, Hasasiyat' },
    sub: { ur: 'بعض کیسز میں یہی علامات دوا کے انتخاب کو نمایاں طور پر بدل دیتی ہیں', en: 'These can decisively change remedy selection', ro: 'Yehi alamaat dawa badal sakti hain' },
    qs: [
        { id: 'G28', req: 1, type: 'ta', t: { ur: 'دن بھر جسمانی طاقت/توانائی کیسی — توانا، جلد تھک جاتے، یا خاص وقت میں واضح فرق؟ تھکن کیسی ہوتی ہے اور آرام سے کیا فرق؟', en: 'General energy through the day; fatigue type and rest effect' } },
        { id: 'G29', req: 0, type: 'ta', t: { ur: 'تھکن دن کے کس حصے میں زیادہ — صبح، دوپہر، شام، رات، یا کسی خاص کام کے بعد؟', en: 'Fatigue worse at which part of day?' } },
        { id: 'G30', req: 0, type: 'ta', t: { ur: 'تھکن کس چیز سے بڑھتی یا کم ہوتی ہے — معمولی کام، زیادہ محنت، چلنے پھرنے، ذہنی کام، آرام؟', en: 'Fatigue aggravations/ameliorations' } },
        { id: 'G31', req: 1, type: 'ta', t: { ur: 'پاخانے کا معمول — دن میں کتنی بار؟ حاجت کیسے محسوس، آسانی یا زور لگانا؟ فارغ ہونے کے بعد مکمل اطمینان یا کچھ باقی؟', en: 'Bowel habit — frequency, ease or straining, complete satisfaction?' } },
        { id: 'G32', req: 1, type: 'ta', t: { ur: 'پیشاب کا معمول — کتنی بار آتا، مقدار کیسی، کوئی ایسی تبدیلی جو خاص طور پر محسوس کی؟', en: 'Urination habit — frequency, quantity, notable change?' } },
        { id: 'G33', req: 0, type: 'ta', t: { ur: 'پاخانہ/پیشاب کے بعد طبیعت میں کوئی خاص فرق — کوئی تکلیف کم/بڑھتی یا نئی کیفیت؟', en: 'State after stool/urine — any complaint better/worse?' } },
        { id: 'G34', req: 1, sex: 'f', type: 'ta', t: { ur: 'ماہواری کا معمول — کتنے دن بعد آتی، کتنے دن رہتی، دوران کوئی خاص/غیر معمولی کیفیت؟', en: 'Menses routine — cycle length, days, peculiarities' } },
        { id: 'G35', req: 1, sex: 'f', type: 'ta', t: { ur: 'ماہواری سے پہلے جسمانی/ذہنی تبدیلی — کب شروع ہوتی، کیا تبدیلی آتی ہے؟', en: 'Before menses — what changes, when?' } },
        { id: 'G36', req: 1, sex: 'f', type: 'ta', t: { ur: 'دورانِ ماہواری — طبیعت اور موجودہ شکایت میں کیا تبدیلی؟ کوئی علامت بڑھتی/کم/نئی؟', en: 'During menses — changes in state and complaint' } },
        { id: 'G37', req: 1, sex: 'f', type: 'ta', t: { ur: 'ماہواری ختم ہونے کے بعد طبیعت میں کیا فرق محسوس ہوتا ہے؟', en: 'After menses — what difference?' } },
        { id: 'G38', req: 0, type: 'ta', t: { ur: 'جنسی عمومی رغبت میں کوئی نمایاں تبدیلی؟ (صرف مناسب ماحول اور رازداری کے ساتھ پوچھیں)', en: 'Sexual desire — any marked change (ask privately, with dignity)' } },
        { id: 'G39', req: 0, type: 'ta', t: { ur: 'جسم میں کوئی جگہ جہاں معمولی چھونا، دباؤ یا کپڑے کا لگنا بھی غیر معمولی ناگوار ہو؟ جگہ، کیفیت، درجہ؟', en: 'Touch/pressure sensitivity — site, quality, degree?' } },
        { id: 'G40', req: 0, type: 'ta', t: { ur: 'کوئی عمومی بے آرامی جسے آپ کسی ایک بیماری یا ایک جگہ سے متعلق نہیں سمجھتے؟ اپنے الفاظ میں۔', en: 'General unease not tied to one disease or site?' } }
    ]});

// ---------- باب 7: سابقہ بیماری، علاج، خاندانی، زندگی (H/F/C) ----------
CT_M.push({ id: 'h', num: 7, icon: '🏥',
    t: { ur: 'باب 7 — سابقہ بیماری، علاج، خاندانی تاریخ اور زندگی کے حالات', en: 'Past History, Treatment, Family & Life Circumstances', ro: 'Sabqa Bimari, Ilaaj, Khandani, Zindagi' },
    sub: { ur: 'ہر سابقہ بیماری خود بخود نسخے کی علامت نہیں — موجودہ کیس سے تعلق دیکھیں', en: 'A past illness is not automatically a present symptom', ro: 'Har sabqa bimari nuskhay ki alamat nahi' },
    qs: [
        { id: 'H01', req: 1, type: 'ta', t: { ur: 'موجودہ بیماری سے پہلے زندگی میں کون کون سی اہم بیماریاں؟ جو خاص طور پر یاد ہوں — کب ہوئیں، اس وقت کیا کیفیت؟ (فہرست نہ سنائیں — آزادانہ جواب)', en: 'Important past illnesses — when, what state? open answer first' } },
        { id: 'H02', req: 0, type: 'ta', t: { ur: 'ان بیماریوں کی زمانی ترتیب — پہلے کون سی، بعد میں کون سی، موجودہ بیماری سے پہلے آخری اہم تبدیلی کیا؟', en: 'Chronological order of past illnesses' } },
        { id: 'H03', req: 0, type: 'ta', t: { ur: 'کسی پچھلی بیماری کے بعد صحت/طبیعت میں کوئی مستقل تبدیلی محسوس کی؟', en: 'Permanent change after any past illness?' } },
        { id: 'H04', req: 1, type: 'ta', t: { ur: 'اب تک کے علاج — اس بیماری اور دوسری اہم تکالیف کے لیے کون کون سے؟ ہر علاج: کب، کتنے عرصے، کیا نتیجہ؟', en: 'All treatments so far — when, how long, result?' } },
        { id: 'H05', req: 1, type: 'ta', t: { ur: 'فائدہ کس طرح کا تھا — بیماری مکمل ختم، کچھ عرصے کا آرام، یا صرف ایک خاص علامت کم؟', en: 'Nature of benefit — cured, temporary relief, single symptom only?' } },
        { id: 'H06', req: 1, type: 'ta', t: { ur: 'کسی دوا یا علاج کے بعد کوئی نئی علامت جو پہلے نہیں تھی؟ یا پرانی علامت کی نوعیت واضح طور پر بدل گئی؟', en: 'New symptoms after any medicine, or changed character of old ones?' } },
        { id: 'H07', req: 1, type: 'ta', t: { ur: 'کبھی بڑا آپریشن، حادثہ، شدید چوٹ یا ایسا طبی واقعہ جس کے بعد صحت میں واضح تبدیلی؟ فوراً بعد کیا ہوا؟', en: 'Major operation, accident, injury — aftermath and lasting change?' } },
        { id: 'F01', req: 1, type: 'ta', t: { ur: 'قریبی خاندان (والدین، بہن بھائی، بچے) میں کوئی اہم یا بار بار ہونے والی بیماری؟', en: 'Important or recurrent diseases in close family?' } },
        { id: 'F02', req: 1, type: 'ta', t: { ur: 'کیا موجودہ بیماری جیسی شکایت خاندان کے کسی اور فرد کو بھی رہی؟ کس کو، کیسی تھی، نتیجہ کیا؟', en: 'Same complaint in a family member — who, what state, outcome?' } },
        { id: 'F03', req: 0, type: 'ta', t: { ur: 'کوئی ایسی خاندانی بیماری جس سے کئی افراد متاثر ہوئے یا جسے آپ خاندانی بیماری سمجھتے ہوں؟', en: 'Any wider family disease affecting many?' } },
        { id: 'C01', req: 1, type: 'ta', t: { ur: 'عام دن کس طرح گزرتا ہے — صبح اٹھنے سے رات سونے تک کا معمول؟', en: 'Typical day from waking to sleep' } },
        { id: 'C02', req: 1, type: 'ta', t: { ur: 'کام یا روزمرہ مصروفیت کی نوعیت — زیادہ جسمانی محنت، زیادہ بیٹھنا، یا زیادہ ذہنی کام؟', en: 'Nature of work — physical, sitting, mental?' } },
        { id: 'C03', req: 1, type: 'ta', t: { ur: 'رہنے اور کام کرنے کے ماحول میں کوئی خاص بات جو صحت یا موجودہ شکایت پر اثر ڈالتی محسوس ہو؟', en: 'Home/work environment affecting health or complaint?' } }
    ]});

// ---------- باب 8: نظام وار، خطرے کی علامات اور Gap Check (S) ----------
CT_M.push({ id: 's', num: 8, icon: '⚠️',
    t: { ur: 'باب 8 — نظام وار سوالات، خطرے کی علامات اور Gap Check', en: 'System-wise Questions, Red Flags & Gap Check', ro: 'Nizam-war, Khatray ki Alamaat, Gap Check' },
    sub: { ur: 'نسخے سے پہلے طبی حفاظت + آخری کھلا سوال', en: 'Medical safety before prescription + final open question', ro: 'Nuskhay se pehle hifazat' },
    gap: 1,
    note: { ur: 'دہرائی سے بچاؤ (یہ سوال اوپر کے بابوں میں مکمل ہو چکے ہیں): S-01 مقام، S-02 پھیلاؤ، S-03 کیفیت، S-04 شدت → باب 2 (PQ-1، PQ-3، PQ-2، PQ-4)؛ S-05 آغاز → باب 3 (P-05)؛ S-07 ارتقا → P-18؛ S-08 دورے کی ترتیب → PQ-8؛ S-09 بڑھنے/S-10 کم ہونے → PQ-6 اور P-13/P-14؛ S-11 ہمراہ علامات → PQ-7۔', en: 'No repetition: S-01..S-04 are covered in chapter 2; S-05..S-11 in chapters 2-3.' },
    qs: [
        { id: 'S06', req: 0, type: 'ta', t: { ur: 'بیماری پہلی بار شروع ہونے سے پہلے زندگی یا صحت میں کوئی خاص تبدیلی، واقعہ یا غیر معمولی کیفیت؟ (باب 1 کے Q-4 کی اضافی تفصیل)', en: 'Special event/change just before the first onset (extra detail to Q-4)' } },
        { id: 'S12', req: 1, type: 'ta', t: { ur: 'دوسری شکایتوں سے تعلق — ایک علامت شروع ہونے کے بعد دوسری آتی ہے؟ ایک کے بڑھنے سے دوسری بھی بڑھتی یا کم ہوتی ہے؟', en: 'Relation between complaints — sequence and co-variation' } },
        { id: 'S13', req: 1, type: 'ta', t: { ur: '⚠️ خطرے کی علامات — بے ہوشی، اچانک کمزوری یا سن ہونا، بولنے/دیکھنے میں دشواری، شدید سانس، خون آنا، بہت تیز بخار؟ (موجود ہوں تو پہلے طبی تشخیص/فوری توجہ)', en: 'Red flags — fainting, sudden weakness/numbness, speech/vision trouble, severe breathlessness, bleeding, high fever (seek medical care first)' } },
        { id: 'S14', req: 1, type: 'ta', t: { ur: 'جس عضو کی شکایت ہے، وہاں اس تکلیف کے علاوہ اور کیا کچھ غیر معمولی محسوس ہوتا ہے؟ (غیر متوقع/اضافی علامات)', en: 'Anything else unusual in the affected organ?' } },
        { id: 'S15', req: 0, type: 'ta', t: { ur: 'ظاہری تبدیلی — شکل، رنگ، سوجن، جلد، رطوبت؟ کب سے ہے اور کیسے کی؟', en: 'Visible local change — shape, colour, swelling, discharge? since when?' } },
        { id: 'S16', req: 1, type: 'ta', t: { ur: 'عضو کے معمول کے کام میں تبدیلی — پہلے کیا معمول تھا اور اب کیا فرق؟ (سانس، ہاضمہ، پیشاب، جوڑ کی حرکت، نظر…)', en: 'Change in organ function — before vs now' } },
        { id: 'S17', req: 1, type: 'ta', t: { ur: 'مقامی تکلیف بڑھتی ہے تو مجموعی طبیعت میں بھی تبدیلی؟ اور کم ہوتی ہے تو عمومی کیفیت بھی بدلتی ہے؟', en: 'Local complaint and general state move together?' } },
        { id: 'S18', req: 1, type: 'ta', t: { ur: 'ذہنی یا جذباتی کیفیت بدلنے سے اس جسمانی تکلیف میں بھی کوئی تبدیلی؟ (پہلے مریض خود تعلق بیان کرے)', en: 'Mental state affecting the physical complaint?' } },
        { id: 'S19', req: 1, type: 'ta', t: { ur: 'آخری کھلا سوال — "کیا اس تکلیف کے بارے میں کوئی ایسی بات ہے جو میں نے ابھی تک نہیں پوچھی اور آپ سمجھتے ہیں کہ میرے لیے جاننا ضروری ہے؟"', en: 'Final open question — anything important I have not asked?' } }
    ]});

// ==================== HELPERS ====================

function ctL() { return currentLang || 'ur'; }
function ctT(obj) { if (!obj) return ''; return obj[ctL()] || obj.en || obj.ur || ''; }
function ctEsc(s) { return (typeof escapeHtml === 'function') ? escapeHtml(s || '') : String(s || '').replace(/[&<>"]/g, function(c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]); }); }
function ctKey(t) { return String((t && (t.en || t.ur)) || t || '').toLowerCase(); }

function ctToggle(group, t) {
    var k = group + '|' + ctKey(t);
    if (CT.sel[k]) delete CT.sel[k]; else CT.sel[k] = t;
    ctAuto();
    renderCaseTaking();
}

// Single-select (miasm): naya chunay to purana group hat jaye
function ctToggleSingle(group, t) {
    var k = group + '|' + ctKey(t);
    if (CT.sel[k]) { delete CT.sel[k]; }
    else {
        Object.keys(CT.sel).forEach(function(x) { if (x.indexOf(group + '|') === 0) delete CT.sel[x]; });
        CT.sel[k] = t;
    }
    ctAuto();
    renderCaseTaking();
}

function ctOn(group, t) { return !!CT.sel[group + '|' + ctKey(t)]; }

CT._pools = CT._pools || {};
function ctChips(arr, group, single) {
    CT._pools[group] = arr;
    var h = '<div class="tst-kw">';
    arr.forEach(function(t, i) {
        var lab = typeof t === 'string' ? t : ctT(t);
        var fn = single ? 'ctToggleIdxS' : 'ctToggleIdx';
        h += '<span class="' + (ctOn(group, t) ? 'sel' : '') + '" onclick="' + fn + '(\'' + group + '\',' + i + ')">' + ctEsc(lab) + '</span>';
    });
    return h + '</div>';
}
function ctToggleIdx(group, i) {
    var arr = CT._pools[group] || [];
    if (arr[i]) ctToggle(group, arr[i]);
}
function ctToggleIdxS(group, i) {
    var arr = CT._pools[group] || [];
    if (arr[i]) ctToggleSingle(group, arr[i]);
}
window.ctToggleIdx = ctToggleIdx;
window.ctToggleIdxS = ctToggleIdxS;

function ctRemoveKey(i) {
    var k = CT._selKeys[i];
    if (k) { delete CT.sel[k]; ctAuto(); renderCaseTaking(); }
}
window.ctRemoveKey = ctRemoveKey;

// ==================== ACCORDION CSS (injected once) ====================

function ctCss() {
    if (document.getElementById('ctAccStyle')) return;
    var s = document.createElement('style');
    s.id = 'ctAccStyle';
    s.textContent =
        '.ct-acc{border:1px solid #e1d5ea;border-radius:12px;margin:0 0 10px;background:#fff;overflow:hidden;box-shadow:0 1px 3px rgba(108,52,131,.07)}' +
        '.ct-acc-head{display:flex;align-items:center;gap:9px;padding:10px 13px;cursor:pointer;user-select:none;background:linear-gradient(90deg,#faf7fc,#fff);transition:background .15s}' +
        '.ct-acc-head:hover{background:#f4ecf7}' +
        '.ct-acc.open .ct-acc-head{background:linear-gradient(90deg,#efe5f5,#fbf8fd)}' +
        '.ct-acc-num{background:#6c3483;color:#fff;border-radius:50%;min-width:23px;height:23px;display:inline-flex;align-items:center;justify-content:center;font-size:11.5px;font-weight:bold;flex-shrink:0}' +
        '.ct-acc-title{font-weight:bold;color:#6c3483;font-size:13.5px;flex:1;min-width:110px;line-height:1.7}' +
        '.ct-acc-sub{font-size:10px;color:#8e8e8e;font-weight:normal}' +
        '.ct-acc-badge{background:#27ae60;color:#fff;border-radius:12px;padding:1px 9px;font-size:10.5px;flex-shrink:0;direction:ltr;unicode-bidi:isolate}' +
        '.ct-acc-badge.off{background:#eaecee;color:#95a5a6}' +
        '.ct-acc-chev{color:#8e44ad;font-size:13px;flex-shrink:0;transition:transform .2s}' +
        '.ct-acc.open .ct-acc-chev{transform:rotate(180deg)}' +
        '.ct-acc-body{display:none;padding:6px 13px 12px;border-top:1px dashed #e8daef;background:#fffdf9}' +
        '.ct-acc.open .ct-acc-body{display:block;animation:ctFade .18s ease}' +
        '@keyframes ctFade{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}' +
        // ---- v4: MASTER پروٹوکول سٹائلز ----
        '.ct-prof{display:flex;gap:7px;flex-wrap:wrap;align-items:center;background:#f8f6fb;border:1px solid #d7bde2;border-radius:10px;padding:8px 11px;margin-bottom:12px}' +
        '.ct-in{padding:7px 10px;border:1px solid #d7bde2;border-radius:7px;font-size:12.5px;background:#fff;font-family:inherit;flex:1;min-width:110px}' +
        '.ct-in:focus{outline:none;border-color:#8e44ad}' +
        '.ct-ta{width:100%;min-height:52px;padding:7px 10px;border:1px solid #d7bde2;border-radius:7px;font-size:12.5px;background:#fff;margin-top:4px;box-sizing:border-box;font-family:inherit;line-height:1.8}' +
        '.ct-ta:focus{outline:none;border-color:#8e44ad}' +
        '.ct-q{border:1px solid #eee3f2;border-inline-start:3px solid #bdc3c7;border-radius:8px;padding:7px 10px;margin:8px 0;background:#fff}' +
        '.ct-q.req{border-inline-start-color:#e74c3c;background:#fffdfb}' +
        '.ct-q.done{border-inline-start-color:#27ae60;background:#fbfffc}' +
        '.ct-q.opt{border-inline-start-color:#95a5a6;background:#fcfcfd}' +
        '.ct-q-l{font-size:12.5px;color:#2c3e50;line-height:1.9}' +
        '.ct-qid{color:#8e44ad;font-family:Segoe UI,Arial;direction:ltr;unicode-bidi:isolate;font-size:10.5px;background:#f4ecf7;border-radius:5px;padding:0 6px;margin:0 4px;display:inline-block}' +
        '.ct-tag{border-radius:9px;padding:0 8px;font-size:9.5px;font-weight:bold;margin-inline-end:4px;white-space:nowrap;display:inline-block}' +
        '.ct-tag.r{background:#fdecea;color:#c0392b;border:1px solid #f5b7b1}' +
        '.ct-tag.o{background:#eef1f2;color:#7f8c8d;border:1px solid #d5dbdb}' +
        '.ct-q-note{font-size:10.5px;color:#8a6d1a;background:#fef9e7;border:1px solid #f9e79f;border-radius:6px;padding:4px 9px;margin:4px 0 8px;line-height:1.8}' +
        '.ct-blk-t{font-weight:bold;color:#c0392b;font-size:12px;margin:8px 0 4px}' +
        'details.ct-opt-blk{margin-top:10px;border:1px dashed #d5dbdb;border-radius:9px;background:#fcfcfd}' +
        'details.ct-opt-blk summary{cursor:pointer;padding:8px 10px;font-size:11.5px;font-weight:bold;color:#7f8c8d;border-radius:9px;list-style:none}' +
        'details.ct-opt-blk summary:hover{background:#f4f6f6;color:#566573}' +
        'details.ct-opt-blk[open] summary{border-bottom:1px dashed #e5e8e8;color:#566573}';
    document.head.appendChild(s);
}

// ==================== ACCORDION ACTIONS ====================

function ctAcc(id) {
    var i = CT.open.indexOf(id);
    if (i >= 0) CT.open.splice(i, 1); else CT.open.push(id);
    ctAuto();
    renderCaseTaking();
}
function ctAccAll(open) {
    CT.open = open ? ['acute', 'q', 'pq', 'p', 'm', 'g1', 'g2', 'h', 's', 'mental', 'phys', 'mod', 'part', 'hist', 'sum'] : [];
    ctAuto();
    renderCaseTaking();
}
window.ctAcc = ctAcc;
window.ctAccAll = ctAccAll;

function ctSetMode(m) {
    if (CT.mode === m) return;
    CT.mode = m;
    CT.results = [];
    if (m === 'acute' && CT.open.indexOf('acute') < 0) CT.open.push('acute');
    ctAuto();
    renderCaseTaking();
}
window.ctSetMode = ctSetMode;

// ==================== WEIGHT ADJUST (⚖️) ====================

function ctW(p, d) {
    var v = Math.max(1, Math.min(15, (CT.w[p] || 6) + d));
    CT.w[p] = v;
    ctAuto();
    renderCaseTaking();
}
function ctWReset() {
    CT.w = { mental: 12, mod: 11, part: 10, phys: 9, hist: 6 };
    ctAuto();
    renderCaseTaking();
}
function ctIsCustomW() {
    return JSON.stringify(CT.w) !== JSON.stringify(KENT_W);
}
window.ctW = ctW;
window.ctWReset = ctWReset;

function ctWTag(p) {
    var L = ctL();
    return L === 'ur' ? '(وزن ' + (CT.w[p] || 6) + ')' : '(weight ' + (CT.w[p] || 6) + ')';
}

// ==================== AUTO-SAVE (💾 localStorage) ====================

var _ctSaveT = null;

function ctSave() {
    try {
        CT._savedTs = Date.now();
        localStorage.setItem(CT_STORE, JSON.stringify({
            mode: CT.mode, dx: CT.dx, sel: CT.sel, hist: CT.hist, notes: CT.notes,
            m: CT.m, prof: CT.prof,
            w: CT.w, open: CT.open, results: CT.results, ts: CT._savedTs
        }));
    } catch (e) { /* storage full / private mode — chup rehna */ }
}

// Har input par foran call hota hai — debounced save + indicator update (re-render nahi)
function ctAuto() {
    if (_ctSaveT) clearTimeout(_ctSaveT);
    _ctSaveT = setTimeout(function() { ctSave(); ctSaveInd(); }, 350);
}

function ctSaveInd() {
    var el = document.getElementById('ctSaveInd');
    if (!el || !CT._savedTs) return;
    var L = ctL();
    var t = '';
    try { t = new Date(CT._savedTs).toLocaleTimeString(); } catch (e) { t = ''; }
    var lab = { ur: '💾 خودکار محفوظ', en: '💾 Auto-saved', roman: '💾 Auto save' }[L];
    el.innerHTML = lab + ' — <b dir="ltr">' + ctEsc(t) + '</b>';
}

function ctLoad() {
    try {
        var raw = localStorage.getItem(CT_STORE);
        if (!raw) return;
        var d = JSON.parse(raw);
        if (!d || typeof d !== 'object') return;
        if (d.mode === 'acute' || d.mode === 'chronic') CT.mode = d.mode;
        if (d.dx) CT.dx = d.dx;
        if (d.sel && typeof d.sel === 'object') CT.sel = d.sel;
        if (d.hist && typeof d.hist === 'object') CT.hist = d.hist;
        if (d.notes && typeof d.notes === 'object') CT.notes = d.notes;
        if (d.m && typeof d.m === 'object') CT.m = d.m;           // v4 — MASTER جوابات
        if (d.prof && typeof d.prof === 'object') CT.prof = d.prof; // v4 — پروفائل
        if (d.w && typeof d.w === 'object') {
            ['mental', 'mod', 'part', 'phys', 'hist'].forEach(function(p) {
                if (typeof d.w[p] === 'number' && d.w[p] >= 1 && d.w[p] <= 15) CT.w[p] = d.w[p];
            });
        }
        if (Array.isArray(d.open)) CT.open = d.open;
        if (Array.isArray(d.results)) CT.results = d.results;
        if (typeof d.ts === 'number') CT._savedTs = d.ts;
    } catch (e) { /* corrupt data — fresh start */ }
}

// ==================== DISEASE OPTIONS ====================

function ctDiseaseOptions() {
    if (typeof TREATMENT_LIB === 'undefined') return '';
    var h = '<select id="ctDx" class="btn btn-sm btn-light" style="max-width:100%;padding:8px 12px" onchange="CT.dx=this.value;ctAuto();renderCaseTaking()">';
    Object.keys(TREATMENT_LIB).forEach(function(k) {
        var d = TREATMENT_LIB[k];
        h += '<option value="' + k + '"' + (CT.dx === k ? ' selected' : '') + '>' + ctEsc(ctT(d.name)) + ' (' + ctEsc(d.name.en) + ')</option>';
    });
    return h + '</select>';
}

function ctDiseaseChips() {
    var d = (typeof TREATMENT_LIB !== 'undefined') ? TREATMENT_LIB[CT.dx] : null;
    if (!d) return '';
    var h = '';
    h += '<div class="tst-sub" style="margin-top:10px">🩺 ' + ({ ur: 'اس بیماری کی علامات (کلک کریں)', en: 'Disease symptoms (click)', roman: 'Bimari ki alamaat' }[ctL()]) + '</div>';
    h += ctChips(d.syms || [], 'part');
    var mods = [];
    function addMod(r) {
        if (!r || !r.mod) return;
        var p = (typeof studioParseMod === 'function') ? studioParseMod(r.mod) : null;
        if (p) {
            if (p.agg.en || p.agg.ur) mods.push({ kind: 'agg', t: p.agg });
            if (p.amel.en || p.amel.ur) mods.push({ kind: 'amel', t: p.amel });
        } else mods.push({ kind: 'agg', t: r.mod });
    }
    (d.rem || []).forEach(addMod);
    if (typeof TREATMENT_MORE !== 'undefined' && TREATMENT_MORE[CT.dx]) TREATMENT_MORE[CT.dx].forEach(addMod);
    var aggs = [], amels = [];
    var seen = {};
    mods.forEach(function(m) {
        var id = m.kind + ctKey(m.t);
        if (seen[id]) return;
        seen[id] = 1;
        if (m.kind === 'amel') amels.push(m.t); else aggs.push(m.t);
    });
    if (aggs.length) {
        h += '<div class="tst-sub">⬇️ ' + ({ ur: 'اس بیماری کی اگراویشن (Worse)', en: 'Disease aggravations (Worse)', roman: 'Bimari ki aggravation' }[ctL()]) + '</div>';
        h += ctChips(aggs.slice(0, 16), 'agg');
    }
    if (amels.length) {
        h += '<div class="tst-sub">⬆️ ' + ({ ur: 'اس بیماری کی ا میلوریشن (Better)', en: 'Disease ameliorations (Better)', roman: 'Bimari ki amelioration' }[ctL()]) + '</div>';
        h += ctChips(amels.slice(0, 16), 'amel');
    }
    return h;
}

// ==================== TOTALITY & SCORING (Kent hierarchy) ====================

function ctNorm(s) {
    if (typeof studioNorm === 'function') return studioNorm(s);
    return String(s || '').toLowerCase();
}

function ctTokens(s) {
    if (typeof studioTokens === 'function') return studioTokens(s);
    return ctNorm(s).split(/\s+/).filter(function(w) { return w.length >= 3; });
}

function ctPillar(k) {
    if (k.indexOf('mq_') === 0) {
        var mid = k.slice(3);
        if (mid.indexOf('PQ') === 0 || mid.charAt(0) === 'P' || mid.charAt(0) === 'S') return 'part';
        if (mid.charAt(0) === 'G') return 'phys';
        if (mid.charAt(0) === 'M') return 'mental';
        return 'hist';
    }
    if (k.indexOf('mental') === 0) return 'mental';
    if (k.indexOf('phys') === 0) return 'phys';
    if (k.indexOf('part') === 0) return 'part';
    if (k.indexOf('agg') === 0 || k.indexOf('amel') === 0 || k.indexOf('mod') === 0) return 'mod';
    return 'hist';
}

// Weight ab adjustable hai — Kent default (12/11/10/9/6) ya doctor ki pasand
function ctWeight(k) {
    var p = ctPillar(k);
    return (CT.w && CT.w[p]) || 6;
}

function ctAllSelectedText() {
    var parts = [];
    Object.keys(CT.sel).forEach(function(k) { parts.push(ctT(CT.sel[k]) + ' ' + (CT.sel[k].en || '') + ' ' + (CT.sel[k].ur || '') + ' ' + (CT.sel[k].roman || '')); });
    parts.push(CT.hist.cc || '', CT.hist.hpi || '', CT.hist.past || '');
    parts.push(CT.notes.particular || '', CT.notes.loc || '', CT.notes.sens || '', CT.notes.extra || '');
    parts.push(Object.keys(CT.m).map(function(id) { return String(CT.m[id] || ''); }).join(' ')); // MASTER باب 1-8 کے تمام جوابات
    return parts.join(' ');
}

function ctScoreRem(r, blobToks) {
    var blob = '';
    (r.syms || []).forEach(function(s) { blob += ' ' + (s.ur || '') + ' ' + (s.en || '') + ' ' + (s.roman || ''); });
    if (r.mod) blob += ' ' + (r.mod.ur || '') + ' ' + (r.mod.en || '') + ' ' + (r.mod.roman || '');
    blob = ctNorm(blob + ' ' + (r.n || ''));
    var score = 0, hits = [];
    var pillars = { mental: 0, phys: 0, mod: 0, part: 0, hist: 0 };
    Object.keys(CT.sel).forEach(function(k) {
        var t = CT.sel[k];
        var variants = [t.en, t.ur, t.roman].map(ctNorm).filter(Boolean);
        var hit = false;
        variants.forEach(function(v) { if (v.length >= 3 && blob.indexOf(v) >= 0) hit = true; });
        if (!hit) {
            variants.forEach(function(v) {
                ctTokens(v).forEach(function(tok) { if (blob.indexOf(tok) >= 0) hit = true; });
            });
        }
        if (hit) {
            var w = ctWeight(k);
            score += w;
            pillars[ctPillar(k)] += 1;
            hits.push(ctT(t));
        }
    });
    blobToks.forEach(function(tok) { if (tok.length >= 4 && blob.indexOf(tok) >= 0) score += 2; });
    return { score: score, hits: hits, pillars: pillars };
}

function ctCollectRems(onlyDx) {
    var out = [];
    function add(dxKey, r, src) {
        if (!r || !r.n) return;
        out.push({ dx: dxKey, r: r, src: src });
    }
    if (typeof TREATMENT_LIB === 'undefined') return out;
    var keys = onlyDx ? [onlyDx] : Object.keys(TREATMENT_LIB);
    keys.forEach(function(k) {
        var d = TREATMENT_LIB[k]; if (!d) return;
        (d.rem || []).forEach(function(r) { add(k, r, 'lib'); });
        if (typeof TREATMENT_MORE !== 'undefined' && TREATMENT_MORE[k]) {
            TREATMENT_MORE[k].forEach(function(r) { add(k, r, 'more'); });
        }
    });
    return out;
}

function ctFindRemedies() {
    var text = ctAllSelectedText();
    var L = ctL();
    if (!text.trim() && !Object.keys(CT.sel).length) {
        if (typeof showToast === 'function') showToast(({ ur: '⚠️ پہلے علامات / ہسٹری درج کریں', en: '⚠️ Enter symptoms / history first', roman: '⚠️ Pehle alamat / history darj karein' })[L], 'error');
        return;
    }
    // Totality mukammal hai? — charon soton ki rahnumai
    var cover = ctCoverage();
    var missing = [];
    if (!cover.mental.c) missing.push(({ ur: 'مینٹل جنرلز', en: 'Mental Generals', roman: 'Mental Generals' })[L]);
    if (!cover.phys.c) missing.push(({ ur: 'فزیکل جنرلز', en: 'Physical Generals', roman: 'Physical Generals' })[L]);
    if (!cover.mod.c) missing.push(({ ur: 'موڈیلیٹیز', en: 'Modalities', roman: 'Modalities' })[L]);
    if (!cover.part.c) missing.push(({ ur: 'پارٹیکلر علامات', en: 'Particulars', roman: 'Particulars' })[L]);
    if (CT.mode === 'chronic' && missing.length && typeof showToast === 'function') {
        showToast(({ ur: '💡 مکمل ٹوٹیلیٹی کے لیے یہ بھی شامل کریں: ', en: '💡 For full totality also add: ', roman: '💡 Full totality ke liye shamil karein: ' })[L] + missing.join('، '), 'info');
    }
    var toks = ctTokens(text);
    var only = CT.mode === 'acute' ? CT.dx : null; // مزمن میں پوری لائبریری — انفرادی علامات پر
    var ranked = ctCollectRems(only).map(function(it) {
        var sc = ctScoreRem(it.r, toks);
        return { dx: it.dx, r: it.r, score: sc.score, hits: sc.hits, pillars: sc.pillars };
    }).filter(function(x) { return x.score > 0; }).sort(function(a, b) { return b.score - a.score; });
    var seen = {};
    CT.results = ranked.filter(function(x) {
        var n = (x.r.n || '').toLowerCase();
        if (seen[n]) return false;
        seen[n] = 1;
        return true;
    }).slice(0, 12);
    ctSave();
    renderCaseTaking();
}

// ==================== TOTALITY SUMMARY ====================

function ctCounts() {
    var c = { mental: 0, phys: 0, mod: 0, part: 0, hist: 0 };
    Object.keys(CT.sel).forEach(function(k) { c[ctPillar(k)] += 1; });
    return c;
}

function ctCoverage() {
    var c = ctCounts();
    return {
        mental: { n: c.mental, c: c.mental > 0 },
        phys:   { n: c.phys,   c: c.phys > 0 },
        mod:    { n: c.mod,    c: c.mod > 0 },
        part:   { n: c.part,   c: c.part > 0 },
        hist:   { n: c.hist + (CT.hist.cc ? 1 : 0) + (CT.hist.hpi ? 1 : 0) + (CT.hist.past ? 1 : 0), c: c.hist > 0 || !!CT.hist.cc || !!CT.hist.hpi || !!CT.hist.past }
    };
}

function ctTotalityHtml() {
    var L = ctL();
    var cov = ctCoverage();
    var total = 0, done = 0;
    ['hist', 'mental', 'phys', 'mod', 'part'].forEach(function(p) { total += 1; if (cov[p].c) done += 1; });
    var pct = Math.round((done / total) * 100);
    var labels = {
        hist:   { ur: '📋 مکمل ہسٹری', en: '📋 History', roman: '📋 History' },
        mental: { ur: '🧠 مینٹل جنرلز', en: '🧠 Mental', roman: '🧠 Mental' },
        phys:   { ur: '🌡️ فزیکل جنرلز', en: '🌡️ Physical', roman: '🌡️ Physical' },
        mod:    { ur: '🔄 موڈیلیٹیز', en: '🔄 Modalities', roman: '🔄 Modalities' },
        part:   { ur: '🔑 پارٹیکلر', en: '🔑 Particulars', roman: '🔑 Particulars' }
    };
    var h = '<div style="background:#f8f6fb;border:1px solid #d7bde2;border-radius:10px;padding:10px 12px;margin-top:6px">';
    h += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">';
    ['hist', 'mental', 'phys', 'mod', 'part'].forEach(function(p) {
        var on = cov[p].c;
        h += '<span style="background:' + (on ? '#27ae60' : '#eaecee') + ';color:' + (on ? '#fff' : '#95a5a6') + ';border-radius:14px;padding:2px 11px;font-size:11px">' + ctT(labels[p]) + ': ' + cov[p].n + (on ? ' ✓' : '') + '</span>';
    });
    h += '</div>';
    h += '<div style="background:#fff;border:1px solid #e8daef;border-radius:8px;height:14px;overflow:hidden;margin-bottom:4px"><div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg,#9b59b6,#27ae60);transition:width .3s"></div></div>';
    h += '<div style="font-size:11px;color:#7d6608">' + ({ ur: 'ٹوٹیلیٹی کی تکمیل:', en: 'Totality completeness:', roman: 'Totality mukammal:' }[L]) + ' <b>' + pct + '%</b> (' + done + '/' + total + ' ' + ({ ur: 'حصے', en: 'pillars', roman: 'hissay' }[L]) + ')';
    if (pct < 100) h += ' — ' + ({ ur: 'کلاسیکی اصول: مکمل ٹوٹیلیٹی کے بغیر دوا غیر یقینی ہوتی ہے', en: 'Classical rule: without full totality the remedy is uncertain', roman: 'Classical usool: mukammal totality ke baghair dawa ghair yaqeeni' }[L]);
    h += '</div>';
    // منتخب علامات — کلک کر کے ہٹائیں
    CT._selKeys = Object.keys(CT.sel);
    if (CT._selKeys.length) {
        h += '<div style="margin-top:8px"><div class="tst-sub">✓ ' + ({ ur: 'منتخب شدہ علامات (ہٹانے کے لیے کلک کریں)', en: 'Selected symptoms (click to remove)', roman: 'Muntakhib alamaat (hatane ke liye click)' }[L]) + ' (' + CT._selKeys.length + ')</div>';
        h += '<div class="tst-kw">';
        var pc = { mental: '#6c3483', phys: '#c0392b', mod: '#b7950b', part: '#1a5276', hist: '#27ae60' };
        CT._selKeys.forEach(function(k, i) {
            var t = CT.sel[k];
            var col = pc[ctPillar(k)] || '#7f8c8d';
            h += '<span style="background:' + col + ';color:#fff" onclick="ctRemoveKey(' + i + ')">' + ctEsc(ctT(t)) + ' ✕</span>';
        });
        h += '</div></div>';
    }
    h += '</div>';
    return h;
}

// ==================== WEIGHT ADJUST UI (⚖️) ====================

function ctWeightsHtml() {
    var L = ctL();
    var items = [['mental', '🧠'], ['mod', '🔄'], ['part', '🔑'], ['phys', '🌡️'], ['hist', '📋']];
    var lbl = {
        mental: { ur: 'مینٹل', en: 'Mental', roman: 'Mental' },
        mod:    { ur: 'موڈیلیٹی', en: 'Modalities', roman: 'Modalities' },
        part:   { ur: 'پارٹیکلر', en: 'Particulars', roman: 'Particulars' },
        phys:   { ur: 'فزیکل', en: 'Physical', roman: 'Physical' },
        hist:   { ur: 'ہسٹری', en: 'History', roman: 'History' }
    };
    var custom = ctIsCustomW();
    var h = '<div style="background:#fdfefe;border:1px dashed #b7950b;border-radius:10px;padding:8px 10px;margin:6px 0 10px">';
    h += '<div style="font-size:12px;font-weight:bold;color:#b7950b;margin-bottom:6px">⚖️ ' + ({ ur: 'سیکشن وزن ایڈجسٹ — سکورنگ اسی وزن سے ہوگی', en: 'Adjust section weights — scoring uses these', roman: 'Section weight adjust — scoring inhi se hogi' }[L]);
    if (custom) h += ' <span style="background:#fdebd0;color:#b7950b;border-radius:10px;padding:0 9px;font-size:10px">' + ({ ur: 'حسبِ ضرورت', en: 'custom', roman: 'custom' }[L]) + '</span>';
    h += '</div>';
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap">';
    items.forEach(function(it) {
        var p = it[0], ic = it[1];
        h += '<div style="display:flex;align-items:center;gap:4px;background:#fff;border:1px solid #e8daef;border-radius:10px;padding:2px 7px">';
        h += '<span style="font-size:11px;color:#2c3e50">' + ic + ' ' + ctT(lbl[p]) + '</span>';
        h += '<button type="button" class="btn btn-sm btn-light" style="min-width:26px;padding:0 8px;line-height:1.7;font-weight:bold" onclick="ctW(\'' + p + '\',-1)">−</button>';
        h += '<b style="min-width:22px;text-align:center;color:#6c3483;direction:ltr;unicode-bidi:isolate">' + (CT.w[p] || 6) + '</b>';
        h += '<button type="button" class="btn btn-sm btn-light" style="min-width:26px;padding:0 8px;line-height:1.7;font-weight:bold" onclick="ctW(\'' + p + '\',1)">+</button>';
        h += '</div>';
    });
    h += '</div>';
    if (custom) h += '<button type="button" class="btn btn-sm btn-light" style="margin-top:7px;font-size:11px" onclick="ctWReset()">↩️ ' + ({ ur: 'Kent ڈیفالٹ واپس (12/11/10/9/6)', en: 'Reset to Kent defaults (12/11/10/9/6)', roman: 'Kent default wapas (12/11/10/9/6)' }[L]) + '</button>';
    h += '</div>';
    return h;
}

function ctWeightsLine() {
    return '🧠 ' + (CT.w.mental || 12) + ' › 🔄 ' + (CT.w.mod || 11) + ' › 🔑 ' + (CT.w.part || 10) + ' › 🌡️ ' + (CT.w.phys || 9) + ' › 📋 ' + (CT.w.hist || 6);
}

// ==================== VISUAL SUMMARY (📊 bars) ====================

function ctBarsHtml() {
    if (!CT.results || !CT.results.length) return '';
    var L = ctL();
    var max = CT.results[0].score || 1;
    var top = CT.results.slice(0, 8);
    var h = '<div style="margin-top:12px;background:#f8f6fb;border:1px solid #d7bde2;border-radius:10px;padding:10px 12px">';
    h += '<div style="font-weight:bold;color:#6c3483;font-size:13.5px;margin-bottom:8px">📊 ' + ({ ur: 'بصری خلاصہ — ادویات کا موازنہ', en: 'Visual summary — remedy comparison', roman: 'Bassri khulasa — adviat ka muwazna' }[L]) + '</div>';
    top.forEach(function(it, i) {
        var pct = Math.max(6, Math.round((it.score / max) * 100));
        var col = i === 0 ? 'linear-gradient(90deg,#27ae60,#58d68d)' : 'linear-gradient(90deg,#8e44ad,#af7ac5)';
        h += '<div style="display:flex;align-items:center;gap:8px;margin:5px 0">';
        h += '<span style="min-width:105px;max-width:135px;font-size:11.5px;font-weight:bold;color:#4a235a;font-family:Segoe UI,Arial;direction:ltr;unicode-bidi:isolate;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:0">' + ctEsc(it.r.n) + '</span>';
        h += '<div style="flex:1;background:#ede7f1;border-radius:9px;height:15px;overflow:hidden;direction:ltr"><div style="width:' + pct + '%;height:100%;background:' + col + ';border-radius:9px;transition:width .4s"></div></div>';
        h += '<span style="min-width:32px;text-align:center;background:' + (i === 0 ? '#27ae60' : '#6c3483') + ';color:#fff;border-radius:10px;padding:0 8px;font-size:10.5px;direction:ltr;unicode-bidi:isolate;flex-shrink:0">' + it.score + '</span>';
        h += '</div>';
    });
    h += '<div style="font-size:10.5px;color:#7f8c8d;margin-top:6px">▸ ' + ({ ur: 'سب سے لمبی بار = وزن کے حساب سے پہلی ترجیحی دوا', en: 'Longest bar = top remedy by weighted score', roman: 'Sab se lambi bar = weight ke hisab se pehli dawa' }[L]) + '</div>';
    h += '</div>';
    return h;
}

// ==================== RESULTS ====================

function ctResultsHtml() {
    if (!CT.results.length) return '';
    var L = ctL();
    var h = '<div class="tst-dtitle" style="margin-top:16px"><h3>💊 ' + ({ ur: 'انفرادی ٹوٹیلیٹی کے مطابق ادویات', en: 'Remedies matched to individual totality', roman: 'Individual totality ke mutabiq adviat' }[L]) + ' (' + CT.results.length + ')</h3></div>';
    h += ctBarsHtml();
    h += '<div style="font-size:11px;color:#7d6608;background:#fef9e7;border:1px solid #f7dc6f;border-radius:8px;padding:5px 10px;margin-bottom:8px;margin-top:8px">⚖️ ' +
        ({ ur: 'موجودہ وزن:', en: 'Current weights:', roman: 'Mojooda weight:' }[L]) + ' ' + ctWeightsLine() +
        (ctIsCustomW() ? ' — ' + ({ ur: 'حسبِ ضرورت', en: 'custom', roman: 'custom' }[L]) : '') + '</div>';
    CT.results.forEach(function(it, i) {
        var r = it.r;
        var dname = (TREATMENT_LIB[it.dx] && ctT(TREATMENT_LIB[it.dx].name)) || it.dx;
        var pl = it.pillars || {};
        h += '<div class="tst-rem">';
        h += '<div class="top"><span class="nm">' + (i + 1) + '. ' + ctEsc(r.n) + '</span>';
        if (r.pot) h += '<span class="pot">' + ctEsc(r.pot) + '</span>';
        h += '<span class="pot" style="background:#6c3483">' + ({ ur: 'اسکور', en: 'Score', roman: 'Score' }[L]) + ' ' + it.score + '</span></div>';
        h += '<div style="margin-top:4px;font-size:10.5px">';
        h += '<span style="background:#f4ecf7;color:#6c3483;border-radius:10px;padding:1px 8px">🧠 ' + (pl.mental || 0) + '</span> ';
        h += '<span style="background:#fef9e7;color:#b7950b;border-radius:10px;padding:1px 8px">🔄 ' + (pl.mod || 0) + '</span> ';
        h += '<span style="background:#eaf2f8;color:#1a5276;border-radius:10px;padding:1px 8px">🔑 ' + (pl.part || 0) + '</span> ';
        h += '<span style="background:#fdedec;color:#c0392b;border-radius:10px;padding:1px 8px">🌡️ ' + (pl.phys || 0) + '</span> ';
        h += '<span style="background:#eafaf1;color:#27ae60;border-radius:10px;padding:1px 8px">📋 ' + (pl.hist || 0) + '</span>';
        h += '</div>';
        if (CT.mode === 'chronic') h += '<div class="use" style="opacity:.8">📚 ' + ctEsc(dname) + '</div>';
        (r.syms || []).forEach(function(s) { h += '<div class="use">▸ ' + ctEsc(s[L] || s.ur) + '</div>'; });
        if (r.mod) h += '<div class="tst-mod">🔄 ' + ctEsc(r.mod[L] || r.mod.ur) + '</div>';
        if (it.hits && it.hits.length) {
            h += '<div style="margin-top:6px;background:#f5eef8;border-radius:8px;padding:6px 8px;font-size:12px;color:#4a235a">✓ ' + it.hits.slice(0, 10).map(ctEsc).join(' · ') + '</div>';
        }
        h += '</div>';
    });
    return h;
}

// ==================== ACCORDION PANEL BUILDER ====================

function ctPanel(id, num, icon, title, sub, count, bodyHtml) {
    var open = CT.open.indexOf(id) >= 0;
    var h = '<div class="ct-acc' + (open ? ' open' : '') + '">';
    h += '<div class="ct-acc-head" onclick="ctAcc(\'' + id + '\')">';
    h += '<span class="ct-acc-num">' + num + '</span>';
    h += '<span class="ct-acc-title">' + icon + ' ' + ctEsc(title) + (sub ? ' <span class="ct-acc-sub">' + ctEsc(sub) + '</span>' : '') + '</span>';
    h += '<span class="ct-acc-badge' + (count > 0 ? '' : ' off') + '">' + (count > 0 ? count + ' ✓' : '—') + '</span>';
    h += '<span class="ct-acc-chev">▾</span>';
    h += '</div>';
    h += '<div class="ct-acc-body">' + bodyHtml + '</div>';
    h += '</div>';
    return h;
}

// ==================== v4: MASTER QUESTION RENDERER ====================

// ایک سوال کا کارڈ — ★ لازمی / اختیاری ٹیگ + ٹیکسٹیریا/انپٹ/چیپس
function ctQ(q, pid) {
    var L = ctL();
    var val = String(CT.m[q.id] || '');
    var done = val.trim().length > 0 || ctSelHas('mq_' + q.id);
    var h = '<div class="ct-q ' + (q.req ? 'req' : 'opt') + (done ? ' done' : ' empty') + '" id="ctqw-' + q.id + '">';
    h += '<div class="ct-q-l"><span class="ct-tag ' + (q.req ? 'r' : 'o') + '">' +
        (q.req ? (L === 'ur' ? '★ ضروری' : '★ Required') : (L === 'ur' ? 'اختیاری' : 'Optional')) + '</span>' +
        '<span class="ct-qid">' + q.id + '</span> ' + ctEsc(ctT(q.t)) + '</div>';
    if (q.note) h += '<div class="ct-q-note">💡 ' + ctEsc(ctT(q.note)) + '</div>';
    if (q.ph) h = h.replace('</div>', '</div>', 1); // no-op guard
    var inp = 'oninput="CT.m[\'' + q.id + '\']=this.value;ctQMark(\'' + q.id + '\',\'' + pid + '\');ctAuto()"';
    if (q.type === 'chips' || q.type === 'both') {
        h += ctChips(q.opts, 'mq_' + q.id, q.single);
        if (q.type === 'both') h += '<textarea class="ct-ta" ' + inp + '>' + ctEsc(val) + '</textarea>';
    } else if (q.type === 'in') {
        var ph = q.ph ? ' placeholder="' + ctEsc(ctT(q.ph)) + '"' : '';
        h += '<input type="text" class="ct-in" style="width:100%;margin-top:4px" value="' + ctEsc(val) + '"' + ph + ' ' + inp + '>';
    } else {
        h += '<textarea class="ct-ta" ' + inp + '>' + ctEsc(val) + '</textarea>';
    }
    return h + '</div>';
}

// ٹائپ کرتے ہوئے فیلڈ کی ✅ حالت + پینل بیج براہِ راست اپ ڈیٹ (دوبارہ رینڈر کے بغیر)
function ctQMark(qid, pid) {
    var w = document.getElementById('ctqw-' + qid);
    var filled = String(CT.m[qid] || '').trim().length > 0;
    if (w) { w.classList.toggle('done', filled); w.classList.toggle('empty', !filled); }
    var sec = null;
    for (var i = 0; i < CT_M.length; i++) { if (CT_M[i].id === pid) { sec = CT_M[i]; break; } }
    if (!sec) return;
    var tot = 0, dn = 0;
    sec.qs.forEach(function(q) {
        if (q.sex === 'f' && CT.prof.sex === 'm') return;
        if (!q.req) return;
        tot++;
        if (String(CT.m[q.id] || '').trim() || ctSelHas('mq_' + q.id)) dn++;
    });
    var b = document.getElementById('ctb-' + pid);
    if (b) { b.textContent = dn + '/' + tot; b.classList.toggle('off', dn < tot); }
}

function ctSelHas(grp) {
    var p = grp + '|';
    var keys = Object.keys(CT.sel);
    for (var i = 0; i < keys.length; i++) { if (keys[i].indexOf(p) === 0) return true; }
    return false;
}

// ⚪ اختیاری بلاک کھلا/بند — صرف محفوظ، رینڈر نہیں
function ctODet(sec, open) {
    var id = 'od_' + sec, i = CT.open.indexOf(id);
    if (open && i < 0) CT.open.push(id);
    if (!open && i >= 0) CT.open.splice(i, 1);
    ctAuto();
}
window.ctODet = ctODet;

// 👤 پروفائل سٹرپ — خاتون منتخب کرنے پر ماہواری/جنسی سوالات خود ظاہر ہوتے ہیں
function ctSetSex(sx) { CT.prof.sex = sx; ctAuto(); renderCaseTaking(); }
window.ctSetSex = ctSetSex;

function ctProfileHtml() {
    var L = ctL();
    var h = '<div class="ct-prof">';
    h += '<span style="font-size:12px;font-weight:bold;color:#6c3483">👤 ' + ({ ur: 'مریض پروفائل', en: 'Patient profile', roman: 'Mareez profile' }[L]) + '</span>';
    h += '<input class="ct-in" style="max-width:170px;flex:2" placeholder="' + ({ ur: 'نام (اختیاری)', en: 'Name (optional)', roman: 'Naam' }[L]) + '" value="' + ctEsc(CT.prof.name || '') + '" oninput="CT.prof.name=this.value;ctAuto()">';
    h += '<input class="ct-in" style="max-width:76px;flex:0" placeholder="' + ({ ur: 'عمر', en: 'Age', roman: 'Umar' }[L]) + '" value="' + ctEsc(CT.prof.age || '') + '" oninput="CT.prof.age=this.value;ctAuto()">';
    h += '<span style="font-size:11.5px;color:#2c3e50">' + ({ ur: 'جنس:', en: 'Sex:', roman: 'Jins:' }[L]) + '</span>';
    ['m', 'f'].forEach(function(sx) {
        var lab = sx === 'm' ? ({ ur: '♂ مرد', en: '♂ Male', roman: 'Mard' }[L]) : ({ ur: '♀ خاتون', en: '♀ Female', roman: 'Khatoon' }[L]);
        h += '<button type="button" class="btn btn-sm ' + (CT.prof.sex === sx ? 'btn-purple' : 'btn-light') + '" onclick="ctSetSex(\'' + sx + '\')">' + lab + '</button>';
    });
    h += '<span style="font-size:10.5px;color:#7f8c8d">' + ({ ur: '— ♀ خاتون منتخب کرنے پر ماہواری سوالات خود ظاہر ہوں گے', en: '— select ♀ Female to show menses questions', roman: '— khatoon par mahwari sawalat zahir' }[L]) + '</span>';
    h += '</div>';
    return h;
}

// 🔍 Gap Check — دستاویز کی 18-خانی چیک لسٹ، جوابات سے خودکار نشان زد
var CT_GAP = [
    { ur: 'مقام', en: 'Location', k: ['PQ1'] },
    { ur: 'طرف (دائیں/بائیں)', en: 'Laterality', k: ['P03'] },
    { ur: 'پھیلاؤ', en: 'Radiation', k: ['PQ3'] },
    { ur: 'کیفیت / احساس', en: 'Sensation', k: ['PQ2', 'P04'] },
    { ur: 'آغاز', en: 'Onset', k: ['Q4', 'P05', 'S06'] },
    { ur: 'دورانیہ', en: 'Duration', k: ['P07', 'Q6'] },
    { ur: 'اختتام', en: 'Termination', k: ['P08'] },
    { ur: 'شدت', en: 'Intensity', k: ['PQ4'] },
    { ur: 'خاص وقت', en: 'Timing', k: ['PQ5', 'P11'] },
    { ur: 'تکرار', en: 'Frequency', k: ['P12'] },
    { ur: 'بڑھانے والی چیزیں', en: 'Aggravations', k: ['PQ6', 'P13'] },
    { ur: 'آرام دینے والی چیزیں', en: 'Ameliorations', k: ['P14'] },
    { ur: 'ساتھ آنے والی علامات', en: 'Concomitants', k: ['PQ7', 'P15'] },
    { ur: 'علامات کی ترتیب', en: 'Sequence', k: ['PQ8', 'P16'] },
    { ur: 'ارتقا (دورانِ بیماری تبدیلی)', en: 'Evolution', k: ['Q3', 'P18'] },
    { ur: 'خطرے کی علامات', en: 'Red flags', k: ['P20', 'S13'] }
];

function ctGapHtml() {
    var L = ctL();
    var done = 0;
    var h = '<div style="background:#fdf6ec;border:1px solid #f0d9a7;border-radius:10px;padding:9px 11px;margin-bottom:10px">';
    h += '<div style="font-weight:bold;color:#8a6d1a;font-size:12px;margin-bottom:6px">🔍 ' +
        ({ ur: 'Gap Check — باب بند کرنے سے پہلے دیکھیں کہ کون سا خانہ ابھی خالی ہے', en: 'Gap Check — which box is still empty before closing this chapter', roman: 'Gap Check — kaun sa khana khali hai' }[L]) + '</div>';
    h += '<div style="display:flex;flex-wrap:wrap;gap:5px">';
    CT_GAP.forEach(function(g) {
        var ok = g.k.some(function(id) { return String(CT.m[id] || '').trim() || ctSelHas('mq_' + id); });
        if (ok) done++;
        h += '<span style="background:' + (ok ? '#27ae60' : '#eaecee') + ';color:' + (ok ? '#fff' : '#95a5a6') + ';border-radius:12px;padding:1px 9px;font-size:10.5px">' + (ok ? '✓ ' : '✗ ') + ctT(g) + '</span>';
    });
    h += '</div>';
    h += '<div style="font-size:10.5px;color:#7d6608;margin-top:6px">▸ ' + done + '/' + CT_GAP.length + ' — ' +
        ({ ur: 'بنیادی اصول: ہر خانے کا جواب لینا ضروری ہے، مگر جو مریض خود بتا چکا ہے وہ دوبارہ نہیں پوچھنا — جو خانے خالی ہیں صرف اُنہی کو اگلا سوال بنائیں۔', en: 'Rule: every box needs an answer, but do not repeat what the patient already told you — ask only the empty boxes.', roman: 'Har khanay ka jawab zaroori, jo bata chuka wo dobara nahi.' }[L]) + '</div>';
    h += '</div>';
    return h;
}

// MASTER اکارڈین پینل — 🔴 لازمی بلاک ہمیشہ کھلا + ⚪ اختیاری بلاک (details)
function ctMPanelHtml(sec) {
    var L = ctL();
    var reqs = [], opts = [];
    sec.qs.forEach(function(q) {
        if (q.sex === 'f' && CT.prof.sex === 'm') return; // مرد مریض کے لیے ماہواری چھپی
        (q.req ? reqs : opts).push(q);
    });
    var dn = 0;
    reqs.forEach(function(q) { if (String(CT.m[q.id] || '').trim() || ctSelHas('mq_' + q.id)) dn++; });

    var body = '';
    if (sec.note) body += '<div class="ct-q-note">ℹ️ ' + ctEsc(ctT(sec.note)) + '</div>';
    if (sec.gap) body += ctGapHtml();
    if (reqs.length) {
        body += '<div class="ct-blk-t">🔴 ' + ({ ur: 'ضروری سوالات', en: 'Required questions', roman: 'Zaroori sawalat' }[L]) + ' (' + reqs.length + ')</div>';
        reqs.forEach(function(q) { body += ctQ(q, sec.id); });
    }
    if (opts.length) {
        var dOpen = CT.open.indexOf('od_' + sec.id) >= 0;
        body += '<details class="ct-opt-blk"' + (dOpen ? ' open' : '') + ' ontoggle="ctODet(\'' + sec.id + '\',this.open)">';
        body += '<summary>⚪ ' + ({ ur: 'اختیاری / شرطی سوالات', en: 'Optional / conditional questions', roman: 'Ikhtiyari / sharti sawalat' }[L]) +
            ' (' + opts.length + ') — ' + ({ ur: 'حسبِ ضرورت کھولیں', en: 'open as needed', roman: 'hisab zaroorat kholein' }[L]) + '</summary>';
        body += '<div style="padding:4px 10px 10px">';
        opts.forEach(function(q) { body += ctQ(q, sec.id); });
        body += '</div></details>';
    }

    var open = CT.open.indexOf(sec.id) >= 0;
    var h = '<div class="ct-acc' + (open ? ' open' : '') + '">';
    h += '<div class="ct-acc-head" onclick="ctAcc(\'' + sec.id + '\')">';
    h += '<span class="ct-acc-num">' + sec.num + '</span>';
    h += '<span class="ct-acc-title">' + sec.icon + ' ' + ctEsc(ctT(sec.t)) + (sec.sub ? ' <span class="ct-acc-sub">' + ctEsc(ctT(sec.sub)) + '</span>' : '') + '</span>';
    h += '<span class="ct-acc-badge' + (reqs.length && dn >= reqs.length ? '' : ' off') + '" id="ctb-' + sec.id + '">' + dn + '/' + reqs.length + '</span>';
    h += '<span class="ct-acc-chev">▾</span></div>';
    h += '<div class="ct-acc-body">' + body + '</div></div>';
    return h;
}

// 🖨️ کیس پرنٹ رپورٹ — پورے کیس کا پرنٹ فرینڈلی خلاصہ (نئی ونڈو)
function ctCaseReport() {
    var L = ctL();
    var w = null;
    try { w = window.open('', '_blank'); } catch (e) { w = null; }
    if (!w) {
        if (typeof showToast === 'function') showToast(({ ur: '⚠️ پرنٹ ونڈو نہیں کھلی — براؤزر پاپ اپ بلاک نہ کریں', en: '⚠️ Print window blocked — allow popups', roman: '⚠️ Print window nahi khuli' })[L], 'error');
        return;
    }
    var h = '<html dir="rtl" lang="ur"><head><meta charset="utf-8"><title>Case Report — Bismillah Clinic</title>';
    h += '<style>body{font-family:"Segoe UI",Tahoma,Arial,sans-serif;padding:16px;color:#222;max-width:820px;margin:0 auto}h1{font-size:17px;color:#6c3483;margin:0 0 4px}h2{font-size:13.5px;color:#6c3483;border-bottom:1.5px solid #d7bde2;padding-bottom:3px;margin:14px 0 7px}.meta{font-size:11px;color:#555;margin-bottom:10px}.q{margin:5px 0;font-size:11.5px;line-height:1.7}.qid{color:#8e44ad;font-weight:bold;font-family:Arial;direction:ltr;unicode-bidi:isolate}.rq{color:#c0392b;font-size:9.5px}.a{background:#f8f6fb;border:1px solid #e8daef;border-radius:6px;padding:3px 8px;margin-top:2px;white-space:pre-wrap}@media print{.a{background:#f6f3f8}}</style></head><body>';
    h += '<h1>📋 ' + ({ ur: 'کیس رپورٹ — بسم اللہ کلینک', en: 'Case Report — Bismillah Clinic', roman: 'Case Report' }[L]) + '</h1>';
    h += '<div class="meta">👤 ' + ctEsc(CT.prof.name || '—') + ' · ' + ({ ur: 'عمر', en: 'Age', roman: 'Umar' }[L]) + ': ' + ctEsc(CT.prof.age || '—') +
        ' · ' + ({ ur: 'موڈ', en: 'Mode', roman: 'Mode' }[L]) + ': ' + (CT.mode === 'acute' ? 'Acute' : 'Chronic / MASTER') +
        ' · ⚖️ ' + ctWeightsLine() + ' · ' + new Date().toLocaleDateString() + '</div>';
    CT_M.forEach(function(sec) {
        var any = false, buf = '<h2>' + sec.icon + ' ' + ctEsc(ctT(sec.t)) + '</h2>';
        sec.qs.forEach(function(q) {
            if (q.sex === 'f' && CT.prof.sex === 'm') return;
            var a = String(CT.m[q.id] || '').trim();
            var chips = [];
            Object.keys(CT.sel).forEach(function(k) { if (k.indexOf('mq_' + q.id + '|') === 0) chips.push(ctT(CT.sel[k])); });
            if (!a && !chips.length) return;
            any = true;
            buf += '<div class="q"><span class="qid">' + q.id + '</span>' + (q.req ? '<span class="rq"> ★</span>' : '') + ' ' + ctEsc(ctT(q.t));
            if (chips.length) buf += '<div class="a">☑ ' + ctEsc(chips.join('، ')) + '</div>';
            if (a) buf += '<div class="a">' + ctEsc(a) + '</div>';
            buf += '</div>';
        });
        if (any) h += buf;
    });
    var selKeys = Object.keys(CT.sel).filter(function(k) { return k.indexOf('mq_') !== 0; });
    if (selKeys.length) h += '<h2>🎯 ' + ({ ur: 'ریپرٹوری چپس', en: 'Repertory chips', roman: 'Repertory chips' }[L]) + '</h2><div class="q">' + ctEsc(selKeys.map(function(k) { return ctT(CT.sel[k]); }).join('، ')) + '</div>';
    if (String(CT.m.SUM || '').trim()) h += '<h2>🧩 ' + ({ ur: 'کیس سمری', en: 'Case summary', roman: 'Case summary' }[L]) + '</h2><div class="a">' + ctEsc(CT.m.SUM) + '</div>';
    if (CT.results && CT.results.length) {
        h += '<h2>💊 ' + ({ ur: 'ٹاپ ادویات (موجودہ وزن کے مطابق)', en: 'Top remedies (by current weights)', roman: 'Top adviat' }[L]) + '</h2><div class="q">';
        CT.results.slice(0, 6).forEach(function(r, i) { h += (i + 1) + '. <b>' + ctEsc(r.r.n) + '</b> — ' + ({ ur: 'اسکور', en: 'score', roman: 'score' }[L]) + ' ' + r.score + '<br>'; });
        h += '</div>';
    }
    h += '</body></html>';
    w.document.open();
    w.document.write(h);
    w.document.close();
    setTimeout(function() { try { w.focus(); w.print(); } catch (e) {} }, 500);
}
window.ctCaseReport = ctCaseReport;

// ==================== MAIN RENDER ====================

function renderCaseTaking() {
    var el = document.getElementById('ct-page-root');
    if (!el) return;
    ctCss();
    var L = ctL();
    var scrollY = window.scrollY || 0;
    var acuteOn = CT.mode === 'acute';
    var cov = ctCoverage();
    var h = '';

    h += '<div class="card-title">📋 ' + ({ ur: 'کیس ٹیکنگ فارم — ماسٹر لیول-1', en: 'Case Taking Form — MASTER Level-1', roman: 'Case Taking Form — Master Level-1' }[L]) +
        '<span style="font-size:11px;color:#7f8c8d;font-weight:normal"> — ' +
        ({ ur: 'باب 1 تا 8 (★ لازمی + اختیاری) + ریپرٹوری چپس — سب خود بخود محفوظ', en: 'Chapters 1-8 (★ required + optional) + repertory chips — all auto-saved', roman: 'Bab 1 ta 8 + chips — sab auto save' }[L]) + '</span></div>';

    // موڈ + اکارڈین کنٹرولز + سیو انڈیکیٹر
    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-bottom:14px">';
    h += '<button type="button" class="btn btn-sm ' + (acuteOn ? 'btn-purple' : 'btn-light') + '" onclick="ctSetMode(\'acute\')">🔴 ' + ({ ur: 'حاد (Acute)', en: 'Acute', roman: 'Haad (Acute)' }[L]) + '</button>';
    h += '<button type="button" class="btn btn-sm ' + (!acuteOn ? 'btn-purple' : 'btn-light') + '" onclick="ctSetMode(\'chronic\')">🔵 ' + ({ ur: 'مزمن (Chronic)', en: 'Chronic', roman: 'Muzmin (Chronic)' }[L]) + '</button>';
    h += '<button type="button" class="btn btn-sm btn-light" onclick="ctAccAll(true)" title="Expand all">⬇️ ' + ({ ur: 'سب کھولیں', en: 'Expand all', roman: 'Sab kholein' }[L]) + '</button>';
    h += '<button type="button" class="btn btn-sm btn-light" onclick="ctAccAll(false)" title="Collapse all">⬆️ ' + ({ ur: 'سب بند کریں', en: 'Collapse all', roman: 'Sab band karein' }[L]) + '</button>';
    h += '<span id="ctSaveInd" style="font-size:10.5px;color:#27ae60;margin-inline-start:auto"></span>';
    h += '</div>';

    if (acuteOn) {
        h += '<div class="alert alert-warning" style="margin-bottom:12px">⚡ ' +
            ({ ur: 'حاد موڈ: متعلقہ بیماری چنیں، چند سوالات/علامات ٹک کریں، پھر دوا تلاش کریں۔', en: 'Acute mode: pick the disease, tick a few questions, then find the remedy.', roman: 'Haad mode: bimari chunein, chand sawal tick karein.' }[L]) + '</div>';
        if (CT.open.indexOf('acute') < 0) CT.open.push('acute');
        var bodyAcute = '';
        bodyAcute += '<div class="form-group"><label>📚 ' + ({ ur: 'بیماری', en: 'Disease', roman: 'Bimari' }[L]) + '</label>' + ctDiseaseOptions() + '</div>';
        CT_ACUTE_Q.forEach(function(q) {
            bodyAcute += '<div class="tst-sub">' + ctT(q) + '</div>' + ctChips(q.opts, q.id);
        });
        bodyAcute += ctDiseaseChips();
        bodyAcute += '<div class="form-group" style="margin-top:12px"><label>' + ({ ur: 'اضافی نوٹ', en: 'Extra notes', roman: 'Izafi note' }[L]) + '</label>';
        bodyAcute += '<textarea style="min-height:70px" oninput="CT.notes.extra=this.value;ctAuto()" placeholder="' +
            ({ ur: 'جو سوال میں نہ ہو یہاں لکھیں...', en: 'Anything not in the questions...', roman: 'Jo sawal mein na ho...' }[L]) + '">' + ctEsc(CT.notes.extra) + '</textarea></div>';
        var acuteCount = Object.keys(CT.sel).length + (CT.notes.extra ? 1 : 0);
        h += ctPanel('acute', '⚡', '', ({ ur: 'حاد کیس — بنیادی معلومات', en: 'Acute case — basics', roman: 'Haad case — bunyadi maloomat' }[L]), '', acuteCount, bodyAcute);
    } else {
        h += '<div class="alert alert-warning" style="margin-bottom:12px">🌿 <b>' + ({ ur: 'ماسٹر لیول-1 کیس ٹیکنگ:', en: 'MASTER Level-1 case taking:', roman: 'Master Level-1 case taking:' }[L]) + '</b> ' +
            ({ ur: 'باب 1 تا 8 کے ★ لازمی سوالات مکمل کریں → چیپس علامات ٹک کریں → مکمل ٹوٹیلیٹی پر انفرادی دوا۔ ⚪ اختیاری سوالات حسبِ ضرورت کھولیں — جو مریض خود بتا دے وہ دوبارہ نہ پوچھیں۔',
               en: 'Complete ★ required questions of chapters 1-8 → tick chips → individual remedy from full totality. Open ⚪ optional questions only as needed — never repeat what the patient already told you.',
               roman: 'Bab 1 ta 8 ke zaroori sawal mukammal karein → chips tick → totality se dawa.' }[L]) + '</div>';

        // ---------- 👤 پروفائل سٹرپ ----------
        h += ctProfileHtml();

        // ---------- باب 1 تا 8 — MASTER Level-1 (سیکشن وائز، لازمی + اختیاری) ----------
        CT_M.forEach(function(sec) { h += ctMPanelHtml(sec); });

        // ---------- 🎯 چپس پینلز — ریپرٹوری ربرکس (سکورنگ انجن) ----------
        h += '<div class="tst-sub" style="margin:16px 0 6px;font-weight:bold;color:#6c3483;font-size:12.5px">🎯 ' +
            ({ ur: 'دوا تلاش کے لیے تیز چپس — ریپرٹوری ربرکس (بابوں کے جوابات کے ساتھ مل کر اسکور بنتا ہے)', en: 'Quick chips for remedy search — repertory rubrics (scored together with chapter answers)', roman: 'Dawa talash ke liye chips — repertory rubrics' }[L]) + '</div>';

        // 9) مینٹل چپس
        h += ctPanel('mental', 9, '🧠', ({ ur: 'مینٹل چپس', en: 'Mental chips', roman: 'Mental chips' }[L]),
            { ur: '— ذہنی علامات کے ربرکس ', en: '— mental rubrics ', roman: '— mental rubrics ' }[L] + ctWTag('mental'), cov.mental.n,
            ctChips(CT_MENTAL, 'mental'));

        // 10) فزیکل چپس
        h += ctPanel('phys', 10, '🌡️', ({ ur: 'فزیکل چپس', en: 'Physical chips', roman: 'Physical chips' }[L]),
            { ur: '— تھرمل، پیاس، پسینہ، نیند، خوراک ', en: '— thermal, thirst, sweat, sleep, food ', roman: '— thermal, pyas, paseena, neend ' }[L] + ctWTag('phys'), cov.phys.n,
            ctChips(CT_PHYSICAL, 'phys'));

        // 11) موڈیلیٹیز چپس
        var bodyMod = '';
        bodyMod += '<div class="tst-sub">⬇️ ' + ({ ur: 'اگراویشن — جس سے بڑھتا ہے (Worse)', en: 'Aggravation — worse from', roman: 'Aggravation — jis se barhta hai' }[L]) + '</div>';
        bodyMod += ctChips(CT_MODAGG, 'modagg');
        bodyMod += '<div class="tst-sub">⬆️ ' + ({ ur: 'امیلوریشن — جس سے کم ہوتا ہے (Better)', en: 'Amelioration — better from', roman: 'Amelioration — jis se kam hota hai' }[L]) + '</div>';
        bodyMod += ctChips(CT_MODAMEL, 'modamel');
        h += ctPanel('mod', 11, '🔄', ({ ur: 'موڈیلیٹیز چپس', en: 'Modalities chips', roman: 'Modalities chips' }[L]),
            { ur: '— بڑھوتری اور کمی ', en: '— aggravations & ameliorations ', roman: '— barhotori aur kami ' }[L] + ctWTag('mod'), cov.mod.n, bodyMod);

        // 12) پارٹیکلر چپس (بیماری کی مخصوص علامات)
        var bodyPart = '';
        bodyPart += '<div class="form-group"><label>📚 ' + ({ ur: 'متعلقہ بیماری (ریپرٹوری حد بندی)', en: 'Related disease (repertory scope)', roman: 'Mutaliqa bimari' }[L]) + '</label>' + ctDiseaseOptions() + '</div>';
        bodyPart += ctDiseaseChips();
        h += ctPanel('part', 12, '🔑', ({ ur: 'پارٹیکلر چپس', en: 'Particulars chips', roman: 'Particular chips' }[L]),
            { ur: '— بیماری کی مخصوص علامات ', en: '— disease specific symptoms ', roman: '— bimari khas alamaat ' }[L] + ctWTag('part'), cov.part.n, bodyPart);

        // 13) ہسٹری چپس (خاندان، وجہ، میاسم)
        var bodyHist = '';
        bodyHist += '<div class="tst-sub">👨‍👩‍👧 ' + ({ ur: 'خاندانی ہسٹری — تفصیلی جواب باب 7 (F-01) میں', en: 'Family history — details in chapter 7 (F-01)', roman: 'Khandani history — tafseel bab 7' }[L]) + '</div>';
        bodyHist += ctChips(CT_FAMILY, 'family');
        bodyHist += '<div class="tst-sub">🎯 ' + ({ ur: 'مرض کی وجہ / آغاز — تفصیلی جواب باب 1 (Q-4) میں', en: 'Cause / onset — details in chapter 1 (Q-4)', roman: 'Marz ki wajah — tafseel bab 1' }[L]) + '</div>';
        bodyHist += ctChips(CT_CAUSE, 'cause');
        bodyHist += '<div class="tst-sub">🧬 ' + ({ ur: 'میاسم (Miasm) — ایک منتخب کریں', en: 'Miasm — select one', roman: 'Miasm — ek muntakhib karein' }[L]) + '</div>';
        bodyHist += ctChips(CT_MIASM, 'miasm', true);
        h += ctPanel('hist', 13, '📋', ({ ur: 'ہسٹری چپس', en: 'History chips', roman: 'History chips' }[L]),
            { ur: '— خاندان، وجہ، میاسم ', en: '— family, etiology, miasm ', roman: '— khandan, wajah, miasm ' }[L] + ctWTag('hist'), cov.hist.n, bodyHist);

        // 14) ٹوٹیلیٹی سمری + وزن ایڈجسٹ + کیس سمری
        var doneP = 0;
        ['hist', 'mental', 'phys', 'mod', 'part'].forEach(function(p) { if (cov[p].c) doneP += 1; });
        var bodySum = '<div class="form-group" style="margin-bottom:10px"><label>🧩 ' +
            ({ ur: 'کلینیکل کیس سمری — پورے کیس کا مختصر خلاصہ، مریض کے اصل الفاظ محفوظ رکھتے ہوئے (سٹیپ 10 کا آخری خانہ)', en: 'Clinical Case Summary — brief whole-case summary, keeping patient own words (Step 10)', roman: 'Clinical Case Summary — mukammal kais ka khulasa' }[L]) + '</label>';
        bodySum += '<textarea style="min-height:80px" oninput="CT.m.SUM=this.value;ctAuto()" placeholder="' +
            ({ ur: 'مثلاً: مریض میں چھ ماہ سے دائیں طرف دھڑکن جیسے سر درد کے دورے ہیں، جو دوپہر کے بعد زیادہ ہوتے ہیں، شور سے بڑھتے ہیں اور اندھیرے میں لیٹنے سے کم…', en: 'e.g. right-sided throbbing headaches for 6 months, worse after noon and from noise, better lying in dark...', roman: 'Maslan: chhe mah se dahin sar dard ke daure...' }[L]) + '">' + ctEsc(CT.m.SUM || '') + '</textarea></div>';
        bodySum += ctWeightsHtml() + ctTotalityHtml();
        h += ctPanel('sum', 14, '🧩', ({ ur: 'مکمل ٹوٹیلیٹی — خلاصہ', en: 'Complete Totality — Summary', roman: 'Mukammal totality — khulasa' }[L]),
            { ur: '— وزن ایڈجسٹ + ٹوٹیلیٹی + کیس سمری', en: '— weights + totality + case summary', roman: '— weight + totality + summary' }[L], doneP, bodySum);
    }

    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:14px 0">';
    h += '<button type="button" class="btn btn-purple" onclick="ctFindRemedies()">💊 ' + ({ ur: 'ٹوٹیلیٹی سے دوا تلاش کریں', en: 'Find remedy from totality', roman: 'Totality se dawa talash karein' }[L]) + '</button>';
    h += '<button type="button" class="btn btn-light" onclick="ctCaseReport()">🖨️ ' + ({ ur: 'کیس پرنٹ رپورٹ', en: 'Print case report', roman: 'Case print report' }[L]) + '</button>';
    h += '<button type="button" class="btn btn-light" onclick="ctClearAll()">🔄 ' + ({ ur: 'فارم صاف', en: 'Clear form', roman: 'Form saaf' }[L]) + '</button>';
    h += '</div>';
    h += ctResultsHtml();
    el.innerHTML = h;
    var dx = document.getElementById('ctDx');
    if (dx) dx.value = CT.dx;
    ctSaveInd();
    if (scrollY) window.scrollTo(0, scrollY);
}

function ctClearAll() {
    CT.sel = {};
    CT.hist = { cc: '', hpi: '', past: '' };
    CT.notes = { particular: '', loc: '', sens: '', extra: '' };
    CT.m = {};
    CT.prof = { name: '', age: '', sex: '' };
    CT.results = [];
    ctSave();
    renderCaseTaking();
}
window.ctClearAll = ctClearAll;

// پہلی لوڈ پر محفوظ شدہ کیس بحال کریں (آٹو سیو)
ctLoad();

window.renderCaseTaking = renderCaseTaking;
window.ctToggle = ctToggle;
window.ctFindRemedies = ctFindRemedies;
window.ctQMark = ctQMark;
window.ctSetSex = ctSetSex;
window.ctODet = ctODet;
window.ctCaseReport = ctCaseReport;
window.CT = CT;
