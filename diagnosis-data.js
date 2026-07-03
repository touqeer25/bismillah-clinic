// ==========================================
// Bismillah Clinic - Advanced Diagnosis DB
// 150+ Diseases | 300+ Symptoms
// Professional Medical Grade
// Part 1/3
// ==========================================

// ==========================================
// SYMPTOMS DATABASE (300+ symptoms)
// ==========================================

const SYMPTOMS_DB = {
    // ===== GENERAL =====
    fever: { ur: 'بخار', en: 'Fever', roman: 'Bukhar', category: 'general' },
    high_fever: { ur: 'تیز بخار (104°F+)', en: 'High Fever', roman: 'Tez Bukhar', category: 'general', severe: true },
    low_grade_fever: { ur: 'ہلکا بخار (99-100°F)', en: 'Low-grade Fever', roman: 'Halka Bukhar', category: 'general' },
    intermittent_fever: { ur: 'رک رک کر بخار', en: 'Intermittent Fever', roman: 'Ruk Ruk kar Bukhar', category: 'general' },
    chills: { ur: 'سردی لگنا', en: 'Chills', roman: 'Sardi Lagna', category: 'general' },
    sweating: { ur: 'پسینہ', en: 'Sweating', roman: 'Paseena', category: 'general' },
    night_sweats: { ur: 'رات کو پسینہ', en: 'Night Sweats', roman: 'Raat ka Paseena', category: 'general' },
    weakness: { ur: 'کمزوری', en: 'Weakness', roman: 'Kamzori', category: 'general' },
    fatigue: { ur: 'تھکاوٹ', en: 'Fatigue', roman: 'Thakawat', category: 'general' },
    body_ache: { ur: 'جسم درد', en: 'Body Ache', roman: 'Jism Dard', category: 'general' },
    loss_appetite: { ur: 'بھوک کم', en: 'Loss of Appetite', roman: 'Bhook Kam', category: 'general' },
    weight_loss: { ur: 'وزن کم ہونا', en: 'Weight Loss', roman: 'Wazan Kam', category: 'general' },
    weight_gain: { ur: 'وزن بڑھنا', en: 'Weight Gain', roman: 'Wazan Barhna', category: 'general' },
    excessive_thirst: { ur: 'زیادہ پیاس', en: 'Excessive Thirst', roman: 'Zyada Pyaas', category: 'general' },
    dehydration: { ur: 'پانی کی کمی', en: 'Dehydration', roman: 'Pani ki Kami', category: 'general' },
    swollen_glands: { ur: 'گلٹیاں', en: 'Swollen Glands', roman: 'Giltiyan', category: 'general' },
    pale_skin: { ur: 'زرد چہرہ', en: 'Pale Skin', roman: 'Zard Chehra', category: 'general' },
    
    // ===== HEAD & NEUROLOGICAL =====
    headache: { ur: 'سر درد', en: 'Headache', roman: 'Sar Dard', category: 'head' },
    migraine_pain: { ur: 'آدھے سر کا درد', en: 'Migraine', roman: 'Aadhay Sar ka Dard', category: 'head' },
    throbbing_pain: { ur: 'دھڑکتا درد', en: 'Throbbing Pain', roman: 'Dharaktha Dard', category: 'head' },
    forehead_pain: { ur: 'ماتھے کا درد', en: 'Forehead Pain', roman: 'Mathay ka Dard', category: 'head' },
    back_head_pain: { ur: 'پچھلے سر کا درد', en: 'Back of Head Pain', roman: 'Pichhle Sar ka Dard', category: 'head' },
    dizziness: { ur: 'چکر آنا', en: 'Dizziness', roman: 'Chakkar Aana', category: 'head' },
    vertigo: { ur: 'چکر (سب گھومے)', en: 'Vertigo', roman: 'Chakkar', category: 'head' },
    unconscious: { ur: 'بے ہوشی', en: 'Unconsciousness', roman: 'Behoshi', category: 'head', severe: true },
    seizure: { ur: 'دورہ / مرگی', en: 'Seizure', roman: 'Doura', category: 'head', severe: true },
    confusion: { ur: 'ذہنی الجھن', en: 'Confusion', roman: 'Zehni Uljhan', category: 'head', severe: true },
    memory_loss: { ur: 'یادداشت کمزور', en: 'Memory Loss', roman: 'Yaad Dasht Kamzor', category: 'head' },
    numbness: { ur: 'سنسناہٹ / سن ہونا', en: 'Numbness', roman: 'Sun Hona', category: 'head' },
    tingling: { ur: 'جھنجھناہٹ', en: 'Tingling', roman: 'Jhunjhnahat', category: 'head' },
    tremors: { ur: 'کپکپاہٹ', en: 'Tremors', roman: 'Kapkapahat', category: 'head' },
    facial_paralysis: { ur: 'چہرے کا فالج', en: 'Facial Paralysis', roman: 'Chehray ka Falij', category: 'head', severe: true },
    speech_difficulty: { ur: 'بولنے میں دشواری', en: 'Speech Difficulty', roman: 'Bolne mein Dushwari', category: 'head', severe: true },
    
    // ===== EYES =====
    red_eyes: { ur: 'آنکھیں سرخ', en: 'Red Eyes', roman: 'Aankhein Surkh', category: 'eyes' },
    eye_pain: { ur: 'آنکھ درد', en: 'Eye Pain', roman: 'Aankh Dard', category: 'eyes' },
    eye_discharge: { ur: 'آنکھ سے پیپ', en: 'Eye Discharge', roman: 'Aankh se Peep', category: 'eyes' },
    watery_eyes: { ur: 'آنسو بہنا', en: 'Watery Eyes', roman: 'Aansu Behna', category: 'eyes' },
    blurred_vision: { ur: 'دھندلا نظر', en: 'Blurred Vision', roman: 'Dhundla Nazar', category: 'eyes' },
    double_vision: { ur: 'دو نظر آنا', en: 'Double Vision', roman: 'Do Nazar', category: 'eyes', severe: true },
    light_sensitivity: { ur: 'روشنی سے تکلیف', en: 'Light Sensitivity', roman: 'Roshni se Takleef', category: 'eyes' },
    itchy_eyes: { ur: 'آنکھوں میں خارش', en: 'Itchy Eyes', roman: 'Aankh mein Kharish', category: 'eyes' },
    swollen_eyelid: { ur: 'پپوٹے پر سوجن', en: 'Swollen Eyelid', roman: 'Papote pe Soojan', category: 'eyes' },
    dry_eyes: { ur: 'خشک آنکھیں', en: 'Dry Eyes', roman: 'Khushk Aankhein', category: 'eyes' },
    ear_pain: { ur: 'کان درد', en: 'Ear Pain', roman: 'Kaan Dard', category: 'eyes' },
    ear_discharge: { ur: 'کان سے پانی', en: 'Ear Discharge', roman: 'Kaan se Pani', category: 'eyes' },
    hearing_loss: { ur: 'سنائی کم', en: 'Hearing Loss', roman: 'Sunai Kam', category: 'eyes' },
    tinnitus: { ur: 'کان میں گھنٹی', en: 'Tinnitus', roman: 'Kaan mein Ghanti', category: 'eyes' },
    ear_itching: { ur: 'کان میں خارش', en: 'Ear Itching', roman: 'Kaan mein Kharish', category: 'eyes' },
    
    // ===== NOSE =====
    runny_nose: { ur: 'ناک بہنا', en: 'Runny Nose', roman: 'Naak Behna', category: 'respiratory' },
    blocked_nose: { ur: 'ناک بند', en: 'Blocked Nose', roman: 'Naak Band', category: 'respiratory' },
    sneezing: { ur: 'چھینکیں', en: 'Sneezing', roman: 'Cheenkein', category: 'respiratory' },
    nose_bleeding: { ur: 'نکسیر', en: 'Nosebleed', roman: 'Nakseer', category: 'respiratory' },
    loss_smell: { ur: 'سونگھنا نہیں', en: 'Loss of Smell', roman: 'Soonghna Nahi', category: 'respiratory' },
    postnasal_drip: { ur: 'ناک سے گلے میں', en: 'Postnasal Drip', roman: 'Naak se Galay', category: 'respiratory' },
    
    // ===== MOUTH & THROAT =====
    sore_throat: { ur: 'گلا خراب', en: 'Sore Throat', roman: 'Gala Kharab', category: 'respiratory' },
    difficulty_swallowing: { ur: 'نگلنے میں دشواری', en: 'Difficulty Swallowing', roman: 'Nigalne mein Dushwari', category: 'respiratory' },
    hoarse_voice: { ur: 'آواز بیٹھی', en: 'Hoarse Voice', roman: 'Awaaz Baithi', category: 'respiratory' },
    dry_mouth: { ur: 'خشک منہ', en: 'Dry Mouth', roman: 'Khushk Munh', category: 'digestive' },
    bad_breath: { ur: 'منہ سے بو', en: 'Bad Breath', roman: 'Munh se Bu', category: 'digestive' },
    mouth_ulcers: { ur: 'منہ کے چھالے', en: 'Mouth Ulcers', roman: 'Munh ke Chaale', category: 'digestive' },
    bleeding_gums: { ur: 'مسوڑھوں سے خون', en: 'Bleeding Gums', roman: 'Masoron se Khoon', category: 'digestive' },
    tooth_pain: { ur: 'دانت درد', en: 'Toothache', roman: 'Daant Dard', category: 'digestive' },
    tongue_white: { ur: 'زبان سفید', en: 'White Tongue', roman: 'Zaban Safaid', category: 'digestive' },
    loss_taste: { ur: 'ذائقہ نہیں', en: 'Loss of Taste', roman: 'Zaiqa Nahi', category: 'digestive' },
    swollen_gums: { ur: 'مسوڑھے سوجے', en: 'Swollen Gums', roman: 'Masoray Soojay', category: 'digestive' },
    
    // ===== RESPIRATORY =====
    cough_dry: { ur: 'خشک کھانسی', en: 'Dry Cough', roman: 'Khushk Khansi', category: 'respiratory' },
    cough_wet: { ur: 'بلغم والی کھانسی', en: 'Wet Cough', roman: 'Balgham wali Khansi', category: 'respiratory' },
    cough_blood: { ur: 'خون کی کھانسی', en: 'Coughing Blood', roman: 'Khoon ki Khansi', category: 'respiratory', severe: true },
    breathing_difficulty: { ur: 'سانس کی تکلیف', en: 'Breathing Difficulty', roman: 'Saans ki Takleef', category: 'respiratory', severe: true },
    shortness_breath: { ur: 'سانس پھولنا', en: 'Shortness of Breath', roman: 'Saans Phoolna', category: 'respiratory' },
    chest_pain: { ur: 'سینے میں درد', en: 'Chest Pain', roman: 'Seenay mein Dard', category: 'respiratory', severe: true },
    chest_tightness: { ur: 'سینے میں جکڑن', en: 'Chest Tightness', roman: 'Seenay mein Jakran', category: 'respiratory' },
    wheezing: { ur: 'سانس میں سیٹی', en: 'Wheezing', roman: 'Saans mein Seeti', category: 'respiratory' },
    rapid_breathing: { ur: 'تیز سانس', en: 'Rapid Breathing', roman: 'Tez Saans', category: 'respiratory' },
    
    // ===== DIGESTIVE =====
    stomach_pain: { ur: 'پیٹ درد', en: 'Stomach Pain', roman: 'Pait Dard', category: 'digestive' },
    upper_abdomen_pain: { ur: 'اوپری پیٹ درد', en: 'Upper Abdomen Pain', roman: 'Upri Pait Dard', category: 'digestive' },
    lower_abdomen_pain: { ur: 'نچلا پیٹ درد', en: 'Lower Abdomen Pain', roman: 'Nichla Pait Dard', category: 'digestive' },
    cramping_pain: { ur: 'مروڑ درد', en: 'Cramping Pain', roman: 'Marod Dard', category: 'digestive' },
    nausea: { ur: 'متلی', en: 'Nausea', roman: 'Matli', category: 'digestive' },
    vomiting: { ur: 'الٹی', en: 'Vomiting', roman: 'Ulti', category: 'digestive' },
    vomiting_blood: { ur: 'خون کی الٹی', en: 'Vomiting Blood', roman: 'Khoon ki Ulti', category: 'digestive', severe: true },
    diarrhea: { ur: 'اسہال / دست', en: 'Diarrhea', roman: 'Ishaal', category: 'digestive' },
    watery_stools: { ur: 'پانی جیسے دست', en: 'Watery Stools', roman: 'Pani jaise Dast', category: 'digestive' },
    blood_stool: { ur: 'اجابت میں خون', en: 'Blood in Stool', roman: 'Ijabat mein Khoon', category: 'digestive', severe: true },
    black_stool: { ur: 'کالا پاخانہ', en: 'Black Stool', roman: 'Kala Paakhana', category: 'digestive', severe: true },
    mucus_stool: { ur: 'اجابت میں لعاب', en: 'Mucus in Stool', roman: 'Ijabat mein Laab', category: 'digestive' },
    constipation: { ur: 'قبض', en: 'Constipation', roman: 'Qabz', category: 'digestive' },
    acidity: { ur: 'تیزابیت', en: 'Acidity', roman: 'Tezabiyat', category: 'digestive' },
    heartburn: { ur: 'سینے کی جلن', en: 'Heartburn', roman: 'Seenay ki Jalan', category: 'digestive' },
    bloating: { ur: 'پیٹ پھولنا', en: 'Bloating', roman: 'Pait Phoolna', category: 'digestive' },
    gas: { ur: 'گیس', en: 'Gas', roman: 'Gas', category: 'digestive' },
    belching: { ur: 'ڈکار', en: 'Belching', roman: 'Dakar', category: 'digestive' },
    indigestion: { ur: 'بدہضمی', en: 'Indigestion', roman: 'Bad Hazmi', category: 'digestive' },
    anal_itching: { ur: 'مقعد میں خارش', en: 'Anal Itching', roman: 'Maqad mein Kharish', category: 'digestive' },
    anal_pain: { ur: 'مقعد میں درد', en: 'Anal Pain', roman: 'Maqad mein Dard', category: 'digestive' },
    hemorrhoids: { ur: 'بواسیر کی گانٹھ', en: 'Hemorrhoids', roman: 'Bawaseer', category: 'digestive' },
    worms_stool: { ur: 'اجابت میں کیڑے', en: 'Worms in Stool', roman: 'Keeray', category: 'digestive' },
    jaundice: { ur: 'یرقان', en: 'Jaundice', roman: 'Yarqaan', category: 'digestive', severe: true },
    
    // ===== SKIN =====
    rash: { ur: 'دانے / ریشز', en: 'Rash', roman: 'Danay', category: 'skin' },
    itching: { ur: 'خارش', en: 'Itching', roman: 'Kharish', category: 'skin' },
    dry_skin: { ur: 'خشک جلد', en: 'Dry Skin', roman: 'Khushk Jild', category: 'skin' },
    oily_skin: { ur: 'چکنی جلد', en: 'Oily Skin', roman: 'Chikni Jild', category: 'skin' },
    boils: { ur: 'پھوڑے', en: 'Boils', roman: 'Phoray', category: 'skin' },
    acne: { ur: 'کیل مہاسے', en: 'Acne', roman: 'Keel Muhasay', category: 'skin' },
    blisters: { ur: 'چھالے', en: 'Blisters', roman: 'Chaale', category: 'skin' },
    hives: { ur: 'چھپاکی', en: 'Hives', roman: 'Chapaki', category: 'skin' },
    scaly_skin: { ur: 'پپڑی دار جلد', en: 'Scaly Skin', roman: 'Papdi Daar Jild', category: 'skin' },
    skin_discoloration: { ur: 'جلد کا رنگ بدلنا', en: 'Skin Discoloration', roman: 'Jild ka Rang Badalna', category: 'skin' },
    white_patches: { ur: 'سفید داغ', en: 'White Patches', roman: 'Safaid Daagh', category: 'skin' },
    dark_patches: { ur: 'کالے داغ', en: 'Dark Patches', roman: 'Kaale Daagh', category: 'skin' },
    warts: { ur: 'مسے', en: 'Warts', roman: 'Musay', category: 'skin' },
    hair_loss: { ur: 'بال گرنا', en: 'Hair Loss', roman: 'Baal Girna', category: 'skin' },
    dandruff: { ur: 'خشکی', en: 'Dandruff', roman: 'Khushki', category: 'skin' },
    ringworm: { ur: 'داد', en: 'Ringworm', roman: 'Daad', category: 'skin' },
    fungal_infection: { ur: 'فنگل انفیکشن', en: 'Fungal Infection', roman: 'Fungal Infection', category: 'skin' },
    burning_skin: { ur: 'جلد میں جلن', en: 'Burning Skin', roman: 'Jild mein Jalan', category: 'skin' },
    pus_discharge: { ur: 'پیپ نکلنا', en: 'Pus Discharge', roman: 'Peep Nikalna', category: 'skin' },
    
    // ===== BONES & JOINTS =====
    joint_pain: { ur: 'جوڑوں کا درد', en: 'Joint Pain', roman: 'Joron ka Dard', category: 'joints' },
    joint_swelling: { ur: 'جوڑوں پر سوجن', en: 'Joint Swelling', roman: 'Joron par Soojan', category: 'joints' },
    joint_stiffness: { ur: 'جوڑوں کا اکڑاؤ', en: 'Joint Stiffness', roman: 'Joron ka Akraao', category: 'joints' },
    morning_stiffness: { ur: 'صبح کا اکڑاؤ', en: 'Morning Stiffness', roman: 'Subah ka Akraao', category: 'joints' },
    knee_pain: { ur: 'گھٹنے کا درد', en: 'Knee Pain', roman: 'Ghutne ka Dard', category: 'joints' },
    shoulder_pain: { ur: 'کندھے کا درد', en: 'Shoulder Pain', roman: 'Kandhay ka Dard', category: 'joints' },
    elbow_pain: { ur: 'کہنی کا درد', en: 'Elbow Pain', roman: 'Kohni ka Dard', category: 'joints' },
    wrist_pain: { ur: 'کلائی کا درد', en: 'Wrist Pain', roman: 'Kalai ka Dard', category: 'joints' },
    ankle_pain: { ur: 'ٹخنے کا درد', en: 'Ankle Pain', roman: 'Takhnay ka Dard', category: 'joints' },
    back_pain: { ur: 'کمر درد', en: 'Back Pain', roman: 'Kamar Dard', category: 'joints' },
    lower_back_pain: { ur: 'نچلی کمر درد', en: 'Lower Back Pain', roman: 'Nichli Kamar Dard', category: 'joints' },
    neck_pain: { ur: 'گردن درد', en: 'Neck Pain', roman: 'Gardan Dard', category: 'joints' },
    muscle_pain: { ur: 'پٹھوں کا درد', en: 'Muscle Pain', roman: 'Pathon ka Dard', category: 'joints' },
    muscle_cramps: { ur: 'پٹھوں میں اینٹھن', en: 'Muscle Cramps', roman: 'Pathon mein Enthan', category: 'joints' },
    muscle_weakness: { ur: 'پٹھوں کی کمزوری', en: 'Muscle Weakness', roman: 'Pathon ki Kamzori', category: 'joints' },
    heel_pain: { ur: 'ایڑی کا درد', en: 'Heel Pain', roman: 'Aidi ka Dard', category: 'joints' },
    swelling_hands: { ur: 'ہاتھوں پر سوجن', en: 'Swelling in Hands', roman: 'Hathon par Soojan', category: 'joints' },
    swelling_feet: { ur: 'پاؤں پر سوجن', en: 'Swelling in Feet', roman: 'Paon par Soojan', category: 'joints' },
    leg_pain_walking: { ur: 'چلنے پر پاؤں درد', en: 'Leg Pain on Walking', roman: 'Chalne par Paon Dard', category: 'joints' },
    
    // ===== URINARY =====
    burning_urine: { ur: 'پیشاب میں جلن', en: 'Burning Urination', roman: 'Peshab mein Jalan', category: 'urinary' },
    frequent_urine: { ur: 'بار بار پیشاب', en: 'Frequent Urination', roman: 'Baar Baar Peshab', category: 'urinary' },
    urgent_urine: { ur: 'پیشاب کی جلدی', en: 'Urgent Urination', roman: 'Peshab ki Jaldi', category: 'urinary' },
    difficulty_urine: { ur: 'پیشاب مشکل سے', en: 'Difficulty Urinating', roman: 'Peshab Mushkil se', category: 'urinary' },
    blood_urine: { ur: 'پیشاب میں خون', en: 'Blood in Urine', roman: 'Peshab mein Khoon', category: 'urinary', severe: true },
    cloudy_urine: { ur: 'گدلا پیشاب', en: 'Cloudy Urine', roman: 'Gadla Peshab', category: 'urinary' },
    low_urine: { ur: 'پیشاب کم', en: 'Low Urine Output', roman: 'Peshab Kam', category: 'urinary' },
    excess_urine: { ur: 'پیشاب زیادہ', en: 'Excessive Urine', roman: 'Peshab Zyada', category: 'urinary' },
    night_urine: { ur: 'رات کو پیشاب', en: 'Night Urination', roman: 'Raat ko Peshab', category: 'urinary' },
    bed_wetting: { ur: 'بستر گیلا', en: 'Bed Wetting', roman: 'Bistar Geela', category: 'urinary' },
    urine_incontinence: { ur: 'پیشاب پر کنٹرول نہیں', en: 'Urine Incontinence', roman: 'Peshab Control nahi', category: 'urinary' },
    kidney_pain: { ur: 'گردے کا درد', en: 'Kidney Pain', roman: 'Gurday ka Dard', category: 'urinary' },
    
    // ===== HEART/CIRCULATION =====
    palpitations: { ur: 'دل کی دھڑکن تیز', en: 'Palpitations', roman: 'Dil ki Dharkan Tez', category: 'chronic' },
    irregular_heartbeat: { ur: 'بے قاعدہ دھڑکن', en: 'Irregular Heartbeat', roman: 'Beqaida Dharkan', category: 'chronic', severe: true },
    slow_heartbeat: { ur: 'سست دھڑکن', en: 'Slow Heartbeat', roman: 'Sust Dharkan', category: 'chronic' },
    high_bp_symptom: { ur: 'ہائی بی پی', en: 'High BP', roman: 'High BP', category: 'chronic' },
    low_bp_symptom: { ur: 'لو بی پی', en: 'Low BP', roman: 'Low BP', category: 'chronic' },
    cold_hands_feet: { ur: 'ٹھنڈے ہاتھ پاؤں', en: 'Cold Hands & Feet', roman: 'Thanday Hath Paon', category: 'chronic' },
    varicose_veins: { ur: 'نیلی رگیں', en: 'Varicose Veins', roman: 'Neeli Ragein', category: 'chronic' },
    
    // ===== MENTAL =====
    anxiety: { ur: 'گھبراہٹ', en: 'Anxiety', roman: 'Ghabrahat', category: 'mental' },
    depression: { ur: 'اداسی', en: 'Depression', roman: 'Udasi', category: 'mental' },
    insomnia: { ur: 'نیند نہ آنا', en: 'Insomnia', roman: 'Neend na Aana', category: 'mental' },
    excessive_sleep: { ur: 'زیادہ نیند', en: 'Excessive Sleep', roman: 'Zyada Neend', category: 'mental' },
    irritability: { ur: 'چڑچڑاپن', en: 'Irritability', roman: 'Chirchirapan', category: 'mental' },
    anger: { ur: 'غصہ', en: 'Anger', roman: 'Ghussa', category: 'mental' },
    fear: { ur: 'خوف', en: 'Fear', roman: 'Khauf', category: 'mental' },
    panic: { ur: 'دہشت', en: 'Panic', roman: 'Dehshat', category: 'mental' },
    restlessness: { ur: 'بے چینی', en: 'Restlessness', roman: 'Bechaini', category: 'mental' },
    lack_concentration: { ur: 'توجہ نہیں', en: 'Lack of Concentration', roman: 'Tawajjah nahi', category: 'mental' },
    obsessive_thoughts: { ur: 'وہمی سوچ', en: 'Obsessive Thoughts', roman: 'Wehmi Soch', category: 'mental' },
    crying_spells: { ur: 'رونا آنا', en: 'Crying Spells', roman: 'Rona Aana', category: 'mental' },
    hopelessness: { ur: 'ناامیدی', en: 'Hopelessness', roman: 'Na Umeedi', category: 'mental' },
    suicidal_thoughts: { ur: 'خودکشی کے خیالات', en: 'Suicidal Thoughts', roman: 'Khudkushi', category: 'mental', severe: true },
    
    // ===== WOMEN =====
    irregular_periods: { ur: 'بے قاعدہ حیض', en: 'Irregular Periods', roman: 'Beqaida Haiz', category: 'women' },
    heavy_periods: { ur: 'زیادہ حیض', en: 'Heavy Periods', roman: 'Zyada Haiz', category: 'women' },
    scanty_periods: { ur: 'کم حیض', en: 'Scanty Periods', roman: 'Kam Haiz', category: 'women' },
    missed_periods: { ur: 'حیض بند', en: 'Missed Periods', roman: 'Haiz Band', category: 'women' },
    painful_periods: { ur: 'دردناک حیض', en: 'Painful Periods', roman: 'Dardnak Haiz', category: 'women' },
    white_discharge: { ur: 'سفید پانی', en: 'White Discharge', roman: 'Safaid Pani', category: 'women' },
    yellow_discharge: { ur: 'پیلا پانی', en: 'Yellow Discharge', roman: 'Peela Pani', category: 'women' },
    vaginal_itching: { ur: 'اندام میں خارش', en: 'Vaginal Itching', roman: 'Andaam mein Kharish', category: 'women' },
    breast_pain: { ur: 'چھاتی میں درد', en: 'Breast Pain', roman: 'Chhati mein Dard', category: 'women' },
    breast_lump: { ur: 'چھاتی میں گلٹی', en: 'Breast Lump', roman: 'Chhati mein Gilti', category: 'women', severe: true },
    hot_flashes: { ur: 'گرم لہریں', en: 'Hot Flashes', roman: 'Garm Lehrain', category: 'women' },
    mood_swings: { ur: 'مزاج بدلنا', en: 'Mood Swings', roman: 'Mizaj Badalna', category: 'women' },
    morning_sickness: { ur: 'حمل کی متلی', en: 'Morning Sickness', roman: 'Hamal ki Matli', category: 'women' },
    
    // ===== SPECIAL =====
    bleeding: { ur: 'خون آنا', en: 'Bleeding', roman: 'Khoon Aana', category: 'special', severe: true },
    bruising: { ur: 'نیل پڑنا', en: 'Easy Bruising', roman: 'Neel Parna', category: 'special' },
    swelling_body: { ur: 'جسم پر سوجن', en: 'Body Swelling', roman: 'Jism par Soojan', category: 'special' },
    yellowish_skin: { ur: 'یرقان', en: 'Yellowish Skin', roman: 'Yarqaan', category: 'special', severe: true },
    yellowish_eyes: { ur: 'آنکھیں پیلی', en: 'Yellow Eyes', roman: 'Aankhein Peeli', category: 'special', severe: true },
    dark_urine: { ur: 'گہرا پیلا پیشاب', en: 'Dark Urine', roman: 'Gehra Peela Peshab', category: 'special' },
    itching_all_over: { ur: 'پورے جسم پر خارش', en: 'Whole Body Itching', roman: 'Poore Jism par Kharish', category: 'special' }
};

// ==========================================
// DISEASES DATABASE - Part 1 (1-50)
// ==========================================

const DISEASES_DB = [
    // ===== RESPIRATORY (15) =====
    {
        id: 'common_cold',
        name: { ur: 'نزلہ زکام', en: 'Common Cold', roman: 'Nazla Zukam' },
        category: 'respiratory',
        symptoms: ['runny_nose', 'sneezing', 'blocked_nose', 'sore_throat', 'fever', 'headache'],
        keySymptoms: ['runny_nose', 'sneezing'],
        tests: [{ ur: 'عام طور پر ٹیسٹ کی ضرورت نہیں', en: 'Usually no tests needed' }],
        redFlags: ['high_fever', 'breathing_difficulty', 'chest_pain'],
        remedies: [
            { name: 'Allium Cepa 30', use: { ur: 'ناک/آنکھ سے پانی', en: 'Watery discharge' }, dose: '4 hourly' },
            { name: 'Arsenic Album 30', use: { ur: 'چھینکیں + بے چینی', en: 'Sneezing + restlessness' }, dose: '3 times daily' },
            { name: 'Natrum Mur 30', use: { ur: 'انڈے کی سفیدی جیسی رطوبت', en: 'Egg-white discharge' }, dose: '4 times daily' },
            { name: 'Aconite 30', use: { ur: 'اچانک ٹھنڈ سے', en: 'Sudden onset from cold' }, dose: 'Early stage' }
        ],
        advice: { ur: 'گرم پانی، شہد، آرام۔ ٹھنڈی چیزوں سے پرہیز۔', en: 'Warm water, honey, rest. Avoid cold.' }
    },
    {
        id: 'flu',
        name: { ur: 'انفلوئنزا (فلو)', en: 'Influenza', roman: 'Flu' },
        category: 'respiratory',
        symptoms: ['fever', 'body_ache', 'headache', 'cough_dry', 'weakness', 'runny_nose', 'sore_throat', 'chills'],
        keySymptoms: ['fever', 'body_ache', 'weakness'],
        tests: [
            { ur: 'CBC', en: 'CBC' },
            { ur: 'Rapid Flu Test', en: 'Rapid Flu Test' }
        ],
        redFlags: ['breathing_difficulty', 'chest_pain', 'high_fever'],
        remedies: [
            { name: 'Gelsemium 30', use: { ur: 'کمزوری، بھاری پن', en: 'Weakness' }, dose: '4 hourly' },
            { name: 'Eupatorium Perf 30', use: { ur: 'ہڈیوں میں درد', en: 'Bone-breaking pain' }, dose: '3 times daily' },
            { name: 'Bryonia 30', use: { ur: 'حرکت سے درد بڑھے', en: 'Worse from motion' }, dose: '4 hourly' },
            { name: 'Rhus Tox 30', use: { ur: 'حرکت سے آرام', en: 'Better from motion' }, dose: '3 times daily' }
        ],
        advice: { ur: 'مکمل آرام، مائع زیادہ، پرہیز۔', en: 'Complete rest, fluids, isolation.' }
    },
    {
        id: 'covid',
        name: { ur: 'کووڈ 19', en: 'COVID-19', roman: 'COVID-19' },
        category: 'respiratory',
        symptoms: ['fever', 'cough_dry', 'body_ache', 'weakness', 'loss_smell', 'loss_taste', 'breathing_difficulty', 'headache'],
        keySymptoms: ['loss_smell', 'loss_taste', 'cough_dry'],
        tests: [
            { ur: 'PCR Test', en: 'COVID PCR' },
            { ur: 'Rapid Antigen', en: 'Rapid Antigen' },
            { ur: 'CBC, D-Dimer', en: 'CBC, D-Dimer' },
            { ur: 'Chest X-Ray/CT', en: 'Chest X-Ray/CT' }
        ],
        redFlags: ['breathing_difficulty', 'chest_pain', 'high_fever', 'unconscious'],
        remedies: [
            { name: 'Arsenic Album 30', use: { ur: 'بے چینی + کمزوری', en: 'Restlessness + weakness' }, dose: '3 times daily' },
            { name: 'Bryonia 30', use: { ur: 'خشک کھانسی', en: 'Dry cough' }, dose: '4 hourly' },
            { name: 'Camphor Q', use: { ur: 'ابتدائی preventive', en: 'Early preventive' }, dose: '2 drops daily' },
            { name: 'Justicia Adhatoda Q', use: { ur: 'کھانسی + سانس', en: 'Cough + breathing' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'مکمل الگ تھلگ، ماسک، وٹامن سی، ڈاکٹر سے رابطہ۔', en: 'Isolation, mask, Vitamin C, consult doctor.' }
    },
    {
        id: 'cough',
        name: { ur: 'کھانسی', en: 'Cough', roman: 'Khansi' },
        category: 'respiratory',
        symptoms: ['cough_dry', 'cough_wet', 'sore_throat', 'chest_tightness'],
        keySymptoms: ['cough_dry', 'cough_wet'],
        tests: [
            { ur: 'اگر 3 ہفتے سے زیادہ: X-Ray Chest', en: 'If >3 weeks: Chest X-Ray' },
            { ur: 'Sputum test', en: 'Sputum test' }
        ],
        redFlags: ['breathing_difficulty', 'chest_pain', 'cough_blood'],
        remedies: [
            { name: 'Drosera 30', use: { ur: 'شدید خشک کھانسی، رات کو', en: 'Severe dry cough at night' }, dose: '3 hourly' },
            { name: 'Ipecac 30', use: { ur: 'بلغم + متلی', en: 'Cough with nausea' }, dose: '4 hourly' },
            { name: 'Bryonia 30', use: { ur: 'خشک کھانسی', en: 'Dry cough' }, dose: '4 hourly' },
            { name: 'Antim Tart 30', use: { ur: 'بلغم زیادہ', en: 'Heavy mucus' }, dose: '3 times daily' }
        ],
        advice: { ur: 'گرم پانی + شہد + ادرک۔', en: 'Warm water + honey + ginger.' }
    },
    {
        id: 'asthma',
        name: { ur: 'دمہ', en: 'Asthma', roman: 'Dama' },
        category: 'respiratory',
        symptoms: ['breathing_difficulty', 'wheezing', 'cough_dry', 'chest_tightness', 'shortness_breath'],
        keySymptoms: ['breathing_difficulty', 'wheezing'],
        tests: [
            { ur: 'Spirometry / PFT', en: 'Spirometry / PFT' },
            { ur: 'Chest X-Ray', en: 'Chest X-Ray' },
            { ur: 'Allergy Test', en: 'Allergy Test' }
        ],
        redFlags: ['breathing_difficulty', 'unconscious', 'chest_pain'],
        remedies: [
            { name: 'Arsenic Album 200', use: { ur: 'رات کو حملہ', en: 'Night attacks' }, dose: 'SOS' },
            { name: 'Antim Tart 30', use: { ur: 'بلغم بھرا سینہ', en: 'Rattling chest' }, dose: '3 times daily' },
            { name: 'Ipecac 30', use: { ur: 'اچانک دورہ', en: 'Sudden attack' }, dose: 'SOS' },
            { name: 'Blatta Orientalis Q', use: { ur: 'دائمی دمہ', en: 'Chronic asthma' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'دھول، دھواں سے بچیں۔ Inhaler ساتھ رکھیں۔', en: 'Avoid dust, smoke. Keep inhaler.' }
    },
    {
        id: 'bronchitis',
        name: { ur: 'برونکائٹس', en: 'Bronchitis', roman: 'Bronchitis' },
        category: 'respiratory',
        symptoms: ['cough_wet', 'chest_pain', 'chest_tightness', 'breathing_difficulty', 'fever', 'weakness'],
        keySymptoms: ['cough_wet', 'chest_pain'],
        tests: [
            { ur: 'Chest X-Ray', en: 'Chest X-Ray' },
            { ur: 'Sputum culture', en: 'Sputum culture' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['cough_blood', 'high_fever', 'breathing_difficulty'],
        remedies: [
            { name: 'Bryonia 30', use: { ur: 'خشک کھانسی، سینے میں درد', en: 'Dry cough, chest pain' }, dose: '4 hourly' },
            { name: 'Antim Tart 30', use: { ur: 'بلغم بھرا سینہ', en: 'Chest full of mucus' }, dose: '3 times daily' },
            { name: 'Pulsatilla 30', use: { ur: 'گاڑھا زرد بلغم', en: 'Thick yellow mucus' }, dose: '3 times daily' },
            { name: 'Kali Bich 30', use: { ur: 'چپکنے والا بلغم', en: 'Sticky mucus' }, dose: '3 times daily' }
        ],
        advice: { ur: 'گرم بھاپ، آرام، سگریٹ چھوڑیں۔', en: 'Steam, rest, no smoking.' }
    },
    {
        id: 'pneumonia',
        name: { ur: 'نمونیا', en: 'Pneumonia', roman: 'Pneumonia' },
        category: 'respiratory',
        symptoms: ['high_fever', 'cough_wet', 'chest_pain', 'breathing_difficulty', 'chills', 'weakness', 'rapid_breathing'],
        keySymptoms: ['cough_wet', 'chest_pain', 'high_fever'],
        tests: [
            { ur: 'Chest X-Ray (اہم)', en: 'Chest X-Ray (main)' },
            { ur: 'CBC', en: 'CBC' },
            { ur: 'Sputum culture', en: 'Sputum culture' },
            { ur: 'Blood culture', en: 'Blood culture' }
        ],
        redFlags: ['breathing_difficulty', 'chest_pain', 'unconscious', 'cough_blood'],
        remedies: [
            { name: 'Bryonia 200', use: { ur: 'دائیں پھیپھڑا متاثر', en: 'Right lung affected' }, dose: '4 hourly' },
            { name: 'Phosphorus 30', use: { ur: 'خشک کھانسی + سینہ درد', en: 'Dry cough + chest pain' }, dose: '3 hourly' },
            { name: 'Antim Tart 200', use: { ur: 'بلغم بھرا، بوڑھے/بچے', en: 'Mucus, elderly/children' }, dose: '3 hourly' },
            { name: 'Chelidonium 30', use: { ur: 'دائیں طرف', en: 'Right-sided' }, dose: '3 times daily' }
        ],
        advice: { ur: 'اسپتال داخل ہونا بہتر، آکسیجن۔', en: 'Hospital admission, oxygen.' }
    },
    {
        id: 'sinusitis',
        name: { ur: 'سائنوسائٹس', en: 'Sinusitis', roman: 'Sinusitis' },
        category: 'respiratory',
        symptoms: ['headache', 'forehead_pain', 'blocked_nose', 'runny_nose', 'postnasal_drip', 'fever', 'loss_smell'],
        keySymptoms: ['forehead_pain', 'blocked_nose'],
        tests: [
            { ur: 'X-Ray Sinuses', en: 'X-Ray Sinuses' },
            { ur: 'CT Sinuses', en: 'CT Sinuses' }
        ],
        redFlags: ['high_fever', 'facial_paralysis', 'confusion'],
        remedies: [
            { name: 'Kali Bich 30', use: { ur: 'چپکنے والا مادہ', en: 'Sticky discharge' }, dose: '3 times daily' },
            { name: 'Silicea 200', use: { ur: 'دائمی سائنوسائٹس', en: 'Chronic sinusitis' }, dose: 'Weekly' },
            { name: 'Hepar Sulph 30', use: { ur: 'پیپ کے ساتھ', en: 'With pus' }, dose: '3 times daily' },
            { name: 'Merc Sol 30', use: { ur: 'زرد پیپ + بو', en: 'Yellow pus + odor' }, dose: '3 times daily' }
        ],
        advice: { ur: 'گرم بھاپ، الرجی سے بچیں۔', en: 'Steam, avoid allergens.' }
    },
    {
        id: 'tonsillitis',
        name: { ur: 'ٹانسلز کی سوزش', en: 'Tonsillitis', roman: 'Tonsils' },
        category: 'respiratory',
        symptoms: ['sore_throat', 'difficulty_swallowing', 'fever', 'headache', 'body_ache', 'swollen_glands'],
        keySymptoms: ['sore_throat', 'difficulty_swallowing'],
        tests: [
            { ur: 'Throat Swab Culture', en: 'Throat Swab Culture' },
            { ur: 'ASO Titer', en: 'ASO Titer' }
        ],
        redFlags: ['breathing_difficulty', 'high_fever'],
        remedies: [
            { name: 'Belladonna 30', use: { ur: 'سرخ، سوجن', en: 'Red, swollen' }, dose: '3 hourly' },
            { name: 'Merc Sol 30', use: { ur: 'پیپ کے ساتھ', en: 'With pus' }, dose: '3 times daily' },
            { name: 'Baryta Carb 30', use: { ur: 'بچوں میں بار بار', en: 'Recurrent in children' }, dose: 'Twice daily' },
            { name: 'Hepar Sulph 30', use: { ur: 'پیپ بننے پر', en: 'When pus forming' }, dose: '4 hourly' }
        ],
        advice: { ur: 'نمک کے پانی سے غرارے، گرم پانی، آرام۔', en: 'Saltwater gargles, warm water.' }
    },
    {
        id: 'pharyngitis',
        name: { ur: 'گلے کی سوزش', en: 'Pharyngitis', roman: 'Galay ki Sozish' },
        category: 'respiratory',
        symptoms: ['sore_throat', 'difficulty_swallowing', 'hoarse_voice', 'fever'],
        keySymptoms: ['sore_throat', 'hoarse_voice'],
        tests: [
            { ur: 'Throat examination', en: 'Throat examination' },
            { ur: 'Rapid Strep Test', en: 'Rapid Strep Test' }
        ],
        redFlags: ['breathing_difficulty', 'high_fever'],
        remedies: [
            { name: 'Phytolacca 30', use: { ur: 'اہم گلے کی دوا', en: 'Main throat remedy' }, dose: '3 hourly' },
            { name: 'Belladonna 30', use: { ur: 'سرخ اور دردناک', en: 'Red and painful' }, dose: '4 hourly' },
            { name: 'Merc Sol 30', use: { ur: 'لعاب زیادہ', en: 'Excess saliva' }, dose: '3 times daily' }
        ],
        advice: { ur: 'گرم پانی، غرارے، ٹھنڈے سے پرہیز۔', en: 'Warm water, gargles.' }
    },
    {
        id: 'laryngitis',
        name: { ur: 'حنجرہ کی سوزش', en: 'Laryngitis', roman: 'Hanjrah' },
        category: 'respiratory',
        symptoms: ['hoarse_voice', 'sore_throat', 'cough_dry', 'difficulty_swallowing'],
        keySymptoms: ['hoarse_voice'],
        tests: [{ ur: 'Laryngoscopy اگر مسلسل', en: 'Laryngoscopy if persistent' }],
        redFlags: ['breathing_difficulty'],
        remedies: [
            { name: 'Causticum 30', use: { ur: 'آواز بیٹھنے کی خاص', en: 'Specific for hoarseness' }, dose: '3 times daily' },
            { name: 'Phosphorus 30', use: { ur: 'آواز مکمل بند', en: 'Complete voice loss' }, dose: '3 times daily' },
            { name: 'Arum Triphyllum 30', use: { ur: 'گلا کریدنا', en: 'Throat clearing' }, dose: '3 times daily' }
        ],
        advice: { ur: 'آواز کم استعمال، گرم پانی، بھاپ۔', en: 'Rest voice, warm water, steam.' }
    },
    {
        id: 'whooping_cough',
        name: { ur: 'کالی کھانسی', en: 'Whooping Cough', roman: 'Kaali Khansi' },
        category: 'respiratory',
        symptoms: ['cough_dry', 'vomiting', 'weakness', 'runny_nose', 'shortness_breath'],
        keySymptoms: ['cough_dry', 'vomiting'],
        tests: [
            { ur: 'Nasal Swab PCR', en: 'Nasal Swab PCR' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['breathing_difficulty', 'cough_blood', 'unconscious'],
        remedies: [
            { name: 'Drosera 200', use: { ur: 'اہم دوا کالی کھانسی', en: 'Main whooping cough' }, dose: '3 hourly' },
            { name: 'Coccus Cacti 30', use: { ur: 'کھانسی + الٹی', en: 'Cough with vomiting' }, dose: '3 hourly' },
            { name: 'Corallium Rubrum 30', use: { ur: 'مسلسل دورے', en: 'Constant spells' }, dose: '4 hourly' }
        ],
        advice: { ur: 'الگ تھلگ رکھیں، ٹیکہ لگوائیں۔', en: 'Isolation, vaccination.' }
    },
    {
        id: 'tuberculosis',
        name: { ur: 'ٹی بی (تپ دق)', en: 'Tuberculosis', roman: 'TB' },
        category: 'respiratory',
        symptoms: ['cough_dry', 'cough_wet', 'weight_loss', 'night_sweats', 'low_grade_fever', 'weakness', 'loss_appetite', 'cough_blood'],
        keySymptoms: ['cough_dry', 'weight_loss', 'night_sweats'],
        tests: [
            { ur: 'Sputum for AFB (3 samples)', en: 'Sputum for AFB' },
            { ur: 'GeneXpert', en: 'GeneXpert MTB/RIF' },
            { ur: 'Chest X-Ray', en: 'Chest X-Ray' },
            { ur: 'Mantoux Test', en: 'Mantoux Test' }
        ],
        redFlags: ['cough_blood', 'breathing_difficulty', 'chest_pain'],
        remedies: [
            { name: 'Tuberculinum 1M', use: { ur: 'دائمی ٹی بی', en: 'Chronic TB' }, dose: 'Monthly' },
            { name: 'Calcarea Phos 6X', use: { ur: 'ہڈی مضبوطی', en: 'Bone strength' }, dose: 'Daily' },
            { name: 'Bacillinum 200', use: { ur: 'خاندانی ٹی بی', en: 'Family history' }, dose: 'Weekly' },
            { name: 'Aspidosperma Q', use: { ur: 'سانس کی تکلیف', en: 'Breathing difficulty' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'DOTS treatment، اچھی خوراک، ماسک۔', en: 'DOTS treatment, nutrition, mask.' }
    },
    {
        id: 'allergic_rhinitis',
        name: { ur: 'الرجک رائنائٹس', en: 'Allergic Rhinitis', roman: 'Allergic Rhinitis' },
        category: 'respiratory',
        symptoms: ['sneezing', 'runny_nose', 'blocked_nose', 'itchy_eyes', 'watery_eyes', 'postnasal_drip'],
        keySymptoms: ['sneezing', 'runny_nose'],
        tests: [
            { ur: 'IgE Level', en: 'Total IgE' },
            { ur: 'Skin Prick Test', en: 'Skin Prick Test' }
        ],
        redFlags: ['breathing_difficulty'],
        remedies: [
            { name: 'Sabadilla 30', use: { ur: 'مسلسل چھینکیں', en: 'Constant sneezing' }, dose: '3 times daily' },
            { name: 'Arundo 30', use: { ur: 'ناک اور تالو خارش', en: 'Nose/palate itching' }, dose: '3 times daily' },
            { name: 'Allium Cepa 30', use: { ur: 'پیاز جیسی جلن', en: 'Onion-like burning' }, dose: '3 hourly' },
            { name: 'Galphimia Glauca Q', use: { ur: 'الرجی کی خاص', en: 'Specific for allergies' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'الرجن سے بچیں، ماسک، صفائی۔', en: 'Avoid allergens, mask.' }
    },
    {
        id: 'copd',
        name: { ur: 'دائمی سانس کی بیماری', en: 'COPD', roman: 'COPD' },
        category: 'respiratory',
        symptoms: ['breathing_difficulty', 'cough_wet', 'wheezing', 'chest_tightness', 'shortness_breath', 'weakness'],
        keySymptoms: ['breathing_difficulty', 'cough_wet'],
        tests: [
            { ur: 'Spirometry / PFT', en: 'Spirometry / PFT' },
            { ur: 'Chest X-Ray', en: 'Chest X-Ray' },
            { ur: 'ABGs', en: 'Arterial Blood Gases' }
        ],
        redFlags: ['breathing_difficulty', 'chest_pain', 'unconscious'],
        remedies: [
            { name: 'Antim Tart 30', use: { ur: 'بلغم بھرا سینہ', en: 'Rattling chest' }, dose: '3 times daily' },
            { name: 'Arsenic Album 200', use: { ur: 'کمزوری + بے چینی', en: 'Weakness + restlessness' }, dose: 'Twice daily' },
            { name: 'Silicea 200', use: { ur: 'کمزوری', en: 'Weakness' }, dose: 'Weekly' },
            { name: 'Justicia Adhatoda Q', use: { ur: 'سانس + کھانسی', en: 'Breathing + cough' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'سگریٹ چھوڑیں، سانس کی مشقیں، ویکسین۔', en: 'Quit smoking, breathing exercises.' }
    },
    
    // ===== FEVER & INFECTIONS (15) =====
    {
        id: 'viral_fever',
        name: { ur: 'وائرل بخار', en: 'Viral Fever', roman: 'Viral Fever' },
        category: 'general',
        symptoms: ['fever', 'headache', 'body_ache', 'weakness', 'loss_appetite', 'runny_nose'],
        keySymptoms: ['fever', 'body_ache'],
        tests: [{ ur: 'CBC', en: 'CBC' }, { ur: 'Dengue/Typhoid rule out', en: 'Rule out others' }],
        redFlags: ['high_fever', 'unconscious', 'bleeding'],
        remedies: [
            { name: 'Belladonna 200', use: { ur: 'تیز بخار، سرخ چہرہ', en: 'High fever, red face' }, dose: '3 hourly' },
            { name: 'Aconite 30', use: { ur: 'اچانک بخار', en: 'Sudden fever' }, dose: 'Early' },
            { name: 'Ferrum Phos 6X', use: { ur: 'ہلکا بخار', en: 'Mild fever' }, dose: '4 hourly' }
        ],
        advice: { ur: 'آرام، مائع زیادہ، پیراسیٹامول۔', en: 'Rest, fluids, paracetamol.' }
    },
    {
        id: 'malaria',
        name: { ur: 'ملیریا', en: 'Malaria', roman: 'Malaria' },
        category: 'general',
        symptoms: ['fever', 'chills', 'sweating', 'headache', 'body_ache', 'weakness', 'vomiting', 'intermittent_fever'],
        keySymptoms: ['fever', 'chills', 'sweating'],
        tests: [
            { ur: 'Malaria Parasite Slide (MP)', en: 'MP Slide' },
            { ur: 'ICT Malaria', en: 'ICT Malaria' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['unconscious', 'yellowish_skin', 'high_fever'],
        remedies: [
            { name: 'China Off 30', use: { ur: 'ملیریا کا اہم', en: 'Main remedy' }, dose: '4 hourly' },
            { name: 'Natrum Mur 200', use: { ur: 'دائمی ملیریا', en: 'Chronic malaria' }, dose: 'Weekly' },
            { name: 'Arsenic Album 30', use: { ur: 'کمزوری + بے چینی', en: 'Weakness' }, dose: '3 times daily' }
        ],
        advice: { ur: 'مچھر دانی، صفائی، پانی کھڑا نہ ہو۔', en: 'Mosquito net, cleanliness.' }
    },
    {
        id: 'typhoid',
        name: { ur: 'ٹائیفائیڈ', en: 'Typhoid Fever', roman: 'Typhoid' },
        category: 'general',
        symptoms: ['fever', 'headache', 'weakness', 'loss_appetite', 'stomach_pain', 'constipation', 'diarrhea', 'low_grade_fever'],
        keySymptoms: ['fever', 'weakness'],
        tests: [
            { ur: 'Widal Test', en: 'Widal Test' },
            { ur: 'Typhidot IgM', en: 'Typhidot IgM' },
            { ur: 'Blood Culture', en: 'Blood Culture' }
        ],
        redFlags: ['blood_stool', 'unconscious', 'high_fever'],
        remedies: [
            { name: 'Baptisia 30', use: { ur: 'ٹائیفائیڈ کا اہم', en: 'Main typhoid' }, dose: '3 hourly' },
            { name: 'Bryonia 30', use: { ur: 'قبض + پیاس', en: 'Constipation + thirst' }, dose: '4 hourly' },
            { name: 'Rhus Tox 30', use: { ur: 'بے چینی، اکڑاؤ', en: 'Restlessness' }, dose: '3 times daily' }
        ],
        advice: { ur: 'صاف پانی، ہلکی خوراک، مکمل آرام۔', en: 'Clean water, light diet, rest.' }
    },
    {
        id: 'dengue',
        name: { ur: 'ڈینگی بخار', en: 'Dengue Fever', roman: 'Dengue' },
        category: 'general',
        symptoms: ['high_fever', 'headache', 'body_ache', 'eye_pain', 'rash', 'weakness', 'nausea', 'bleeding'],
        keySymptoms: ['high_fever', 'eye_pain', 'rash'],
        tests: [
            { ur: 'Dengue NS1 Antigen', en: 'Dengue NS1' },
            { ur: 'Dengue IgM/IgG', en: 'Dengue IgM/IgG' },
            { ur: 'CBC (Platelets)', en: 'CBC (Platelets)' }
        ],
        redFlags: ['bleeding', 'unconscious', 'breathing_difficulty'],
        remedies: [
            { name: 'Eupatorium Perf 200', use: { ur: 'ڈینگی کا اہم', en: 'Main dengue' }, dose: '3 hourly' },
            { name: 'Carica Papaya Q', use: { ur: 'پلیٹلیٹس بڑھانے', en: 'Increase platelets' }, dose: '10 drops thrice' },
            { name: 'Crotalus Horridus 30', use: { ur: 'خون بہنے میں', en: 'For bleeding' }, dose: '3 times daily' }
        ],
        advice: { ur: 'مچھر سے بچاؤ، پانی زیادہ، پلیٹلیٹس چیک۔', en: 'Prevent mosquitoes, fluids.' }
    },
    {
        id: 'chikungunya',
        name: { ur: 'چکن گنیا', en: 'Chikungunya', roman: 'Chikungunya' },
        category: 'general',
        symptoms: ['fever', 'joint_pain', 'joint_swelling', 'rash', 'headache', 'body_ache', 'weakness'],
        keySymptoms: ['fever', 'joint_pain'],
        tests: [
            { ur: 'Chikungunya IgM', en: 'Chikungunya IgM' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['bleeding', 'unconscious'],
        remedies: [
            { name: 'Rhus Tox 200', use: { ur: 'جوڑوں کا درد', en: 'Joint pain' }, dose: '3 times daily' },
            { name: 'Eupatorium Perf 30', use: { ur: 'ہڈی توڑ بخار', en: 'Bone-breaking fever' }, dose: '4 hourly' },
            { name: 'Bryonia 200', use: { ur: 'حرکت سے بڑھے', en: 'Worse from motion' }, dose: '4 hourly' }
        ],
        advice: { ur: 'مچھر سے بچاؤ، جوڑوں کی مساج۔', en: 'Prevent mosquitoes, joint massage.' }
    },
    {
        id: 'measles',
        name: { ur: 'خسرہ', en: 'Measles', roman: 'Khasrah' },
        category: 'general',
        symptoms: ['fever', 'rash', 'runny_nose', 'cough_dry', 'red_eyes', 'weakness'],
        keySymptoms: ['fever', 'rash'],
        tests: [
            { ur: 'Measles IgM', en: 'Measles IgM' },
            { ur: 'Clinical diagnosis', en: 'Clinical diagnosis' }
        ],
        redFlags: ['high_fever', 'breathing_difficulty', 'unconscious'],
        remedies: [
            { name: 'Pulsatilla 30', use: { ur: 'اہم خسرہ کی دوا', en: 'Main measles' }, dose: '3 hourly' },
            { name: 'Aconite 30', use: { ur: 'شروع میں', en: 'Early stage' }, dose: 'First 24 hrs' },
            { name: 'Belladonna 30', use: { ur: 'تیز بخار', en: 'High fever' }, dose: '4 hourly' },
            { name: 'Bryonia 30', use: { ur: 'ریشز اندر جانے پر', en: 'Rash suppression' }, dose: '3 times daily' }
        ],
        advice: { ur: 'الگ رکھیں، وٹامن اے، آرام، ویکسین۔', en: 'Isolation, Vitamin A, rest.' }
    },
    {
        id: 'chickenpox',
        name: { ur: 'چیچک', en: 'Chickenpox', roman: 'Chechak' },
        category: 'general',
        symptoms: ['fever', 'rash', 'blisters', 'itching', 'weakness', 'loss_appetite'],
        keySymptoms: ['rash', 'blisters', 'itching'],
        tests: [
            { ur: 'Clinical diagnosis', en: 'Clinical diagnosis' },
            { ur: 'Varicella PCR', en: 'Varicella PCR' }
        ],
        redFlags: ['high_fever', 'breathing_difficulty'],
        remedies: [
            { name: 'Rhus Tox 30', use: { ur: 'اہم چیچک کی دوا', en: 'Main chickenpox' }, dose: '3 times daily' },
            { name: 'Antim Crud 30', use: { ur: 'چہرے پر زیادہ', en: 'More on face' }, dose: '3 times daily' },
            { name: 'Variolinum 200', use: { ur: 'حفاظتی خوراک', en: 'Preventive' }, dose: 'Weekly' }
        ],
        advice: { ur: 'الگ رکھیں، خارش نہ کریں، ناخن کاٹیں۔', en: 'Isolation, no scratching.' }
    },
    {
        id: 'mumps',
        name: { ur: 'کنپیڑے', en: 'Mumps', roman: 'Kanperay' },
        category: 'general',
        symptoms: ['fever', 'swollen_glands', 'headache', 'difficulty_swallowing', 'ear_pain', 'weakness'],
        keySymptoms: ['swollen_glands', 'fever'],
        tests: [
            { ur: 'Clinical diagnosis', en: 'Clinical diagnosis' },
            { ur: 'Serum Amylase', en: 'Serum Amylase' }
        ],
        redFlags: ['high_fever', 'breathing_difficulty', 'confusion'],
        remedies: [
            { name: 'Pilocarpinum 30', use: { ur: 'کنپیڑوں کی خاص', en: 'Specific for mumps' }, dose: '3 hourly' },
            { name: 'Merc Sol 30', use: { ur: 'لعاب زیادہ', en: 'Excess saliva' }, dose: '3 times daily' },
            { name: 'Belladonna 30', use: { ur: 'سرخ سوجن', en: 'Red swelling' }, dose: '4 hourly' }
        ],
        advice: { ur: 'الگ رکھیں، نرم غذا، ٹھنڈی سکائی۔', en: 'Isolation, soft food, cold compress.' }
    },
    {
        id: 'hepatitis',
        name: { ur: 'یرقان (ہیپاٹائٹس)', en: 'Hepatitis', roman: 'Yarqaan' },
        category: 'digestive',
        symptoms: ['yellowish_skin', 'yellowish_eyes', 'dark_urine', 'loss_appetite', 'nausea', 'vomiting', 'weakness', 'upper_abdomen_pain'],
        keySymptoms: ['yellowish_skin', 'dark_urine'],
        tests: [
            { ur: 'LFTs (Liver Function)', en: 'LFTs' },
            { ur: 'HBsAg', en: 'HBsAg' },
            { ur: 'Anti-HCV', en: 'Anti-HCV' },
            { ur: 'Anti-HAV IgM', en: 'Anti-HAV IgM' },
            { ur: 'Ultrasound Abdomen', en: 'Ultrasound' }
        ],
        redFlags: ['confusion', 'bleeding', 'vomiting_blood'],
        remedies: [
            { name: 'Chelidonium Q', use: { ur: 'جگر کی خاص دوا', en: 'Specific for liver' }, dose: '10 drops thrice' },
            { name: 'Carduus Marianus Q', use: { ur: 'جگر کا ٹانک', en: 'Liver tonic' }, dose: '10 drops thrice' },
            { name: 'Nux Vomica 30', use: { ur: 'الکحل سے', en: 'From alcohol' }, dose: 'Morning' },
            { name: 'Phosphorus 30', use: { ur: 'شدید یرقان', en: 'Severe jaundice' }, dose: '3 times daily' }
        ],
        advice: { ur: 'مکمل آرام، تلی چیزیں بند، پانی زیادہ۔', en: 'Rest, no fried food, hydration.' }
    },
    {
        id: 'scarlet_fever',
        name: { ur: 'قرمزی بخار', en: 'Scarlet Fever', roman: 'Qirmazi Bukhar' },
        category: 'general',
        symptoms: ['high_fever', 'rash', 'sore_throat', 'headache', 'tongue_white', 'swollen_glands'],
        keySymptoms: ['fever', 'rash', 'sore_throat'],
        tests: [{ ur: 'Throat Swab', en: 'Throat Swab' }, { ur: 'ASO Titer', en: 'ASO Titer' }],
        redFlags: ['high_fever', 'breathing_difficulty'],
        remedies: [
            { name: 'Belladonna 200', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '3 hourly' },
            { name: 'Ailanthus 30', use: { ur: 'گہرا سرخ ریش', en: 'Deep red rash' }, dose: '3 times daily' }
        ],
        advice: { ur: 'الگ رکھیں، آرام، اینٹی بائیوٹک۔', en: 'Isolation, rest, antibiotics.' }
    },
    {
        id: 'brucellosis',
        name: { ur: 'مالٹا فیور', en: 'Brucellosis', roman: 'Malta Fever' },
        category: 'general',
        symptoms: ['intermittent_fever', 'joint_pain', 'weakness', 'night_sweats', 'weight_loss', 'headache'],
        keySymptoms: ['intermittent_fever', 'joint_pain'],
        tests: [
            { ur: 'Brucella Agglutination', en: 'Brucella Agglutination' },
            { ur: 'Blood Culture', en: 'Blood Culture' }
        ],
        redFlags: ['high_fever'],
        remedies: [
            { name: 'Rhus Tox 30', use: { ur: 'جوڑوں کا درد', en: 'Joint pain' }, dose: '3 times daily' },
            { name: 'Bryonia 30', use: { ur: 'حرکت سے بڑھے', en: 'Worse motion' }, dose: '4 hourly' }
        ],
        advice: { ur: 'کچا دودھ نہ پئیں، پنیر ابال کر۔', en: 'Avoid raw milk.' }
    },
    {
        id: 'ear_infection',
        name: { ur: 'کان کا انفیکشن', en: 'Ear Infection', roman: 'Kaan Infection' },
        category: 'general',
        symptoms: ['ear_pain', 'ear_discharge', 'fever', 'hearing_loss', 'headache'],
        keySymptoms: ['ear_pain'],
        tests: [
            { ur: 'Ear Examination', en: 'Ear Examination' },
            { ur: 'Ear Discharge Culture', en: 'Ear Discharge Culture' }
        ],
        redFlags: ['high_fever', 'bleeding', 'facial_paralysis'],
        remedies: [
            { name: 'Belladonna 30', use: { ur: 'اچانک، شدید درد', en: 'Sudden severe pain' }, dose: '2 hourly' },
            { name: 'Pulsatilla 30', use: { ur: 'بچوں میں، رات کو', en: 'Children, at night' }, dose: '3 hourly' },
            { name: 'Chamomilla 30', use: { ur: 'شدید چڑچڑاپن', en: 'Extreme irritability' }, dose: '3 hourly' },
            { name: 'Hepar Sulph 30', use: { ur: 'پیپ کے ساتھ', en: 'With pus' }, dose: '3 times daily' }
        ],
        advice: { ur: 'کان میں پانی نہ جائے، گرم رکھیں۔', en: 'Keep dry and warm.' }
    },
    {
        id: 'meningitis',
        name: { ur: 'دماغی بخار', en: 'Meningitis', roman: 'Dimagi Bukhar' },
        category: 'general',
        symptoms: ['high_fever', 'headache', 'neck_pain', 'vomiting', 'light_sensitivity', 'confusion', 'seizure', 'unconscious'],
        keySymptoms: ['high_fever', 'neck_pain', 'headache'],
        tests: [
            { ur: 'Lumbar Puncture (CSF)', en: 'Lumbar Puncture' },
            { ur: 'CBC, CRP', en: 'CBC, CRP' },
            { ur: 'Blood Culture', en: 'Blood Culture' },
            { ur: 'CT/MRI Brain', en: 'CT/MRI Brain' }
        ],
        redFlags: ['unconscious', 'seizure', 'high_fever', 'confusion'],
        remedies: [
            { name: 'Belladonna 200', use: { ur: 'ابتدائی سٹیج', en: 'Early stage' }, dose: '2 hourly' },
            { name: 'Apis Mellifica 30', use: { ur: 'دماغی سوجن', en: 'Brain swelling' }, dose: '2 hourly' },
            { name: 'Helleborus 30', use: { ur: 'بے حسی', en: 'Stupor' }, dose: '3 times daily' }
        ],
        advice: { ur: '⚠️ ایمرجنسی! فوری ہسپتال جائیں۔', en: '⚠️ EMERGENCY! Rush to hospital.' }
    },
    {
        id: 'sepsis',
        name: { ur: 'خون میں انفیکشن', en: 'Sepsis', roman: 'Sepsis' },
        category: 'general',
        symptoms: ['high_fever', 'chills', 'rapid_breathing', 'confusion', 'weakness', 'low_bp_symptom'],
        keySymptoms: ['high_fever', 'chills', 'confusion'],
        tests: [
            { ur: 'Blood Culture', en: 'Blood Culture' },
            { ur: 'CBC, CRP', en: 'CBC, CRP' },
            { ur: 'Procalcitonin', en: 'Procalcitonin' }
        ],
        redFlags: ['unconscious', 'breathing_difficulty', 'confusion'],
        remedies: [
            { name: 'Arsenic Album 200', use: { ur: 'کمزوری + بے چینی', en: 'Weakness' }, dose: '2 hourly' },
            { name: 'Pyrogenium 200', use: { ur: 'انفیکشن کی خاص', en: 'Specific for sepsis' }, dose: '3 hourly' }
        ],
        advice: { ur: '⚠️ ایمرجنسی! فوری ICU۔', en: '⚠️ EMERGENCY! ICU needed.' }
    },
    
    // ===== NEUROLOGICAL (12) =====
    {
        id: 'tension_headache',
        name: { ur: 'ٹینشن سر درد', en: 'Tension Headache', roman: 'Tension Sar Dard' },
        category: 'head',
        symptoms: ['headache', 'neck_pain', 'joint_stiffness', 'anxiety'],
        keySymptoms: ['headache'],
        tests: [{ ur: 'عام طور پر ضرورت نہیں', en: 'Usually not needed' }],
        redFlags: ['unconscious', 'vomiting', 'high_fever', 'confusion'],
        remedies: [
            { name: 'Nux Vomica 30', use: { ur: 'ذہنی دباؤ سے', en: 'From stress' }, dose: 'Twice daily' },
            { name: 'Gelsemium 30', use: { ur: 'گردن سے شروع', en: 'From neck' }, dose: '3 times daily' },
            { name: 'Bryonia 30', use: { ur: 'حرکت سے بڑھے', en: 'Worse motion' }, dose: '4 hourly' }
        ],
        advice: { ur: 'آرام، پانی، ذہنی سکون، نیند پوری۔', en: 'Rest, hydration, stress management.' }
    },
    {
        id: 'migraine',
        name: { ur: 'درد شقیقہ', en: 'Migraine', roman: 'Migraine' },
        category: 'head',
        symptoms: ['migraine_pain', 'throbbing_pain', 'nausea', 'vomiting', 'light_sensitivity', 'dizziness'],
        keySymptoms: ['migraine_pain', 'nausea'],
        tests: [{ ur: 'CT/MRI اگر شدید', en: 'CT/MRI if severe' }],
        redFlags: ['unconscious', 'high_fever', 'seizure'],
        remedies: [
            { name: 'Belladonna 30', use: { ur: 'دائیں، دھڑکن', en: 'Right, throbbing' }, dose: 'SOS' },
            { name: 'Spigelia 30', use: { ur: 'بائیں، آنکھ کے پیچھے', en: 'Left, behind eye' }, dose: '3 times daily' },
            { name: 'Sanguinaria 30', use: { ur: 'دائیں، الٹی', en: 'Right, vomiting' }, dose: '3 hourly' },
            { name: 'Iris Versicolor 30', use: { ur: 'آنکھ سامنے چمک', en: 'Visual aura' }, dose: '3 times daily' }
        ],
        advice: { ur: 'اندھیرا کمرہ، آرام۔ Trigger foods سے بچیں۔', en: 'Dark room, avoid triggers.' }
    },
    {
        id: 'cluster_headache',
        name: { ur: 'کلسٹر سر درد', en: 'Cluster Headache', roman: 'Cluster' },
        category: 'head',
        symptoms: ['headache', 'eye_pain', 'watery_eyes', 'runny_nose'],
        keySymptoms: ['headache', 'eye_pain'],
        tests: [{ ur: 'CT/MRI Brain', en: 'CT/MRI Brain' }],
        redFlags: ['unconscious', 'seizure'],
        remedies: [
            { name: 'Sanguinaria 30', use: { ur: 'دائیں طرف', en: 'Right side' }, dose: 'SOS' },
            { name: 'Melilotus 30', use: { ur: 'دھڑکتا درد', en: 'Throbbing pain' }, dose: '3 hourly' }
        ],
        advice: { ur: 'ٹرگرز سے بچیں، اکسیجن تھراپی۔', en: 'Avoid triggers.' }
    },
    {
        id: 'vertigo',
        name: { ur: 'چکر', en: 'Vertigo', roman: 'Chakkar' },
        category: 'head',
        symptoms: ['vertigo', 'dizziness', 'nausea', 'vomiting', 'tinnitus'],
        keySymptoms: ['vertigo'],
        tests: [
            { ur: 'Ear examination', en: 'Ear examination' },
            { ur: 'MRI Brain', en: 'MRI Brain' },
            { ur: 'BP check', en: 'BP check' }
        ],
        redFlags: ['unconscious', 'facial_paralysis', 'speech_difficulty'],
        remedies: [
            { name: 'Cocculus 30', use: { ur: 'حرکت سے چکر', en: 'From motion' }, dose: '3 times daily' },
            { name: 'Conium 30', use: { ur: 'لیٹنے پر چکر', en: 'When lying down' }, dose: '3 times daily' },
            { name: 'Gelsemium 30', use: { ur: 'کمزوری کے ساتھ', en: 'With weakness' }, dose: '3 times daily' },
            { name: 'Bryonia 30', use: { ur: 'اٹھنے پر چکر', en: 'On rising' }, dose: '4 hourly' }
        ],
        advice: { ur: 'اچانک حرکت نہ کریں، پانی زیادہ۔', en: 'Avoid sudden movements.' }
    },
    {
        id: 'bells_palsy',
        name: { ur: 'چہرے کا فالج', en: "Bell's Palsy", roman: 'Chehray ka Falij' },
        category: 'head',
        symptoms: ['facial_paralysis', 'headache', 'ear_pain', 'loss_taste'],
        keySymptoms: ['facial_paralysis'],
        tests: [{ ur: 'MRI Brain', en: 'MRI Brain' }, { ur: 'Blood tests', en: 'Blood tests' }],
        redFlags: ['speech_difficulty', 'confusion'],
        remedies: [
            { name: 'Causticum 30', use: { ur: 'فالج کی اہم دوا', en: 'Main for paralysis' }, dose: '3 times daily' },
            { name: 'Gelsemium 30', use: { ur: 'کمزوری کے ساتھ', en: 'With weakness' }, dose: '3 times daily' },
            { name: 'Aconite 200', use: { ur: 'ٹھنڈ سے', en: 'From cold' }, dose: 'Early stage' }
        ],
        advice: { ur: 'گرم رکھیں، آنکھ حفاظت، فوری علاج۔', en: 'Keep warm, protect eye.' }
    },
    {
        id: 'sciatica',
        name: { ur: 'سیاٹیکا', en: 'Sciatica', roman: 'Sciatica' },
        category: 'head',
        symptoms: ['lower_back_pain', 'leg_pain_walking', 'numbness', 'tingling', 'muscle_weakness'],
        keySymptoms: ['lower_back_pain', 'leg_pain_walking'],
        tests: [{ ur: 'MRI Spine', en: 'MRI Lumbar Spine' }, { ur: 'X-Ray L-Spine', en: 'X-Ray L-Spine' }],
        redFlags: ['urine_incontinence', 'muscle_weakness'],
        remedies: [
            { name: 'Colocynth 200', use: { ur: 'دائیں سیاٹیکا', en: 'Right-sided' }, dose: '3 hourly' },
            { name: 'Magnesia Phos 6X', use: { ur: 'اینٹھن کے ساتھ', en: 'With cramps' }, dose: '4 hourly' },
            { name: 'Gnaphalium 30', use: { ur: 'سنسناہٹ', en: 'Numbness' }, dose: '3 times daily' },
            { name: 'Rhus Tox 200', use: { ur: 'حرکت سے آرام', en: 'Better from motion' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'صحیح posture، بھاری نہ اٹھائیں۔', en: 'Good posture, no heavy lifting.' }
    },
    {
        id: 'epilepsy',
        name: { ur: 'مرگی', en: 'Epilepsy', roman: 'Mirgi' },
        category: 'head',
        symptoms: ['seizure', 'unconscious', 'confusion', 'headache'],
        keySymptoms: ['seizure'],
        tests: [
            { ur: 'EEG', en: 'EEG' },
            { ur: 'MRI Brain', en: 'MRI Brain' },
            { ur: 'Blood Sugar', en: 'Blood Sugar' }
        ],
        redFlags: ['unconscious', 'seizure', 'breathing_difficulty'],
        remedies: [
            { name: 'Cicuta 30', use: { ur: 'مرگی کا دورہ', en: 'Convulsions' }, dose: 'Twice daily' },
            { name: 'Cuprum Met 30', use: { ur: 'اینٹھن کے ساتھ', en: 'With cramps' }, dose: 'Twice daily' },
            { name: 'Hyoscyamus 30', use: { ur: 'دورے کے بعد', en: 'Post-seizure' }, dose: '3 times daily' }
        ],
        advice: { ur: 'ڈاکٹری علاج ضروری، ڈرائیونگ سے پرہیز۔', en: 'Medical treatment essential.' }
    },
    {
        id: 'parkinsons',
        name: { ur: 'رعشہ', en: "Parkinson's Disease", roman: 'Parkinson' },
        category: 'head',
        symptoms: ['tremors', 'muscle_weakness', 'joint_stiffness', 'speech_difficulty', 'memory_loss'],
        keySymptoms: ['tremors', 'joint_stiffness'],
        tests: [
            { ur: 'Clinical diagnosis', en: 'Clinical diagnosis' },
            { ur: 'MRI Brain', en: 'MRI Brain' },
            { ur: 'DaT Scan', en: 'DaT Scan' }
        ],
        redFlags: ['unconscious', 'confusion'],
        remedies: [
            { name: 'Argentum Nit 200', use: { ur: 'کپکپاہٹ', en: 'Trembling' }, dose: 'Weekly' },
            { name: 'Rhus Tox 200', use: { ur: 'اکڑاؤ', en: 'Stiffness' }, dose: 'Twice daily' },
            { name: 'Mercurius 30', use: { ur: 'کپکپاہٹ + پسینہ', en: 'Trembling + sweating' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'ورزش، فزیوتھراپی، خاندانی مدد۔', en: 'Exercise, physiotherapy.' }
    },
    {
        id: 'stroke_awareness',
        name: { ur: 'فالج (سٹروک)', en: 'Stroke', roman: 'Falij' },
        category: 'head',
        symptoms: ['facial_paralysis', 'speech_difficulty', 'muscle_weakness', 'numbness', 'confusion', 'unconscious', 'headache'],
        keySymptoms: ['facial_paralysis', 'speech_difficulty'],
        tests: [
            { ur: 'CT Scan Brain (فوری)', en: 'CT Scan Brain (urgent)' },
            { ur: 'MRI Brain', en: 'MRI Brain' },
            { ur: 'ECG, Echo', en: 'ECG, Echo' }
        ],
        redFlags: ['unconscious', 'facial_paralysis', 'speech_difficulty', 'confusion'],
        remedies: [
            { name: 'Arnica 200', use: { ur: 'شروع میں', en: 'Immediately' }, dose: 'SOS' },
            { name: 'Causticum 200', use: { ur: 'فالج کے بعد', en: 'Post-stroke' }, dose: 'Twice daily' },
            { name: 'Baryta Carb 30', use: { ur: 'بوڑھوں میں', en: 'In elderly' }, dose: 'Daily' }
        ],
        advice: { ur: '⚠️ ایمرجنسی! FAST test۔ فوری ہسپتال۔', en: '⚠️ EMERGENCY! Rush in 4 hours.' }
    },
    {
        id: 'carpal_tunnel',
        name: { ur: 'ہاتھ کا اعصابی درد', en: 'Carpal Tunnel', roman: 'Carpal Tunnel' },
        category: 'head',
        symptoms: ['wrist_pain', 'numbness', 'tingling', 'muscle_weakness'],
        keySymptoms: ['wrist_pain', 'numbness'],
        tests: [{ ur: 'Nerve Conduction Study', en: 'Nerve Conduction Study' }, { ur: 'EMG', en: 'EMG' }],
        redFlags: ['muscle_weakness'],
        remedies: [
            { name: 'Hypericum 200', use: { ur: 'اعصابی درد', en: 'Nerve pain' }, dose: '3 times daily' },
            { name: 'Ruta 30', use: { ur: 'کلائی کی تکلیف', en: 'Wrist strain' }, dose: '3 times daily' },
            { name: 'Causticum 30', use: { ur: 'کمزوری', en: 'Weakness' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'کلائی کو آرام، ٹائپنگ کم، سپلنٹ۔', en: 'Wrist rest, splint.' }
    },
    {
        id: 'trigeminal_neuralgia',
        name: { ur: 'چہرے کا اعصابی درد', en: 'Trigeminal Neuralgia', roman: 'Chehray ka Asabi Dard' },
        category: 'head',
        symptoms: ['headache', 'facial_paralysis', 'tooth_pain'],
        keySymptoms: ['headache', 'facial_paralysis'],
        tests: [{ ur: 'MRI Brain', en: 'MRI Brain' }],
        redFlags: ['unconscious', 'speech_difficulty'],
        remedies: [
            { name: 'Spigelia 200', use: { ur: 'بائیں چہرے کا درد', en: 'Left facial pain' }, dose: '3 times daily' },
            { name: 'Magnesia Phos 6X', use: { ur: 'اینٹھن والا درد', en: 'Cramping pain' }, dose: 'SOS' },
            { name: 'Verbascum 30', use: { ur: 'بجلی جیسا درد', en: 'Electric pain' }, dose: '3 hourly' }
        ],
        advice: { ur: 'ٹرگرز سے بچیں، گرم پانی۔', en: 'Avoid triggers, warm water.' }
    },
    {
        id: 'neuropathy',
        name: { ur: 'اعصابی کمزوری', en: 'Peripheral Neuropathy', roman: 'Asabi Kamzori' },
        category: 'head',
        symptoms: ['numbness', 'tingling', 'muscle_weakness', 'joint_pain', 'burning_skin'],
        keySymptoms: ['numbness', 'tingling'],
        tests: [
            { ur: 'Nerve Conduction Study', en: 'Nerve Conduction' },
            { ur: 'Blood Sugar', en: 'Blood Sugar' },
            { ur: 'B12 Level', en: 'B12 Level' }
        ],
        redFlags: ['muscle_weakness', 'facial_paralysis'],
        remedies: [
            { name: 'Kali Phos 6X', use: { ur: 'اعصابی ٹانک', en: 'Nerve tonic' }, dose: 'Twice daily' },
            { name: 'Hypericum 30', use: { ur: 'اعصابی درد', en: 'Nerve pain' }, dose: '3 times daily' },
            { name: 'Gnaphalium 30', use: { ur: 'ٹانگوں میں سنسناہٹ', en: 'Leg numbness' }, dose: '3 times daily' }
        ],
        advice: { ur: 'شوگر کنٹرول، B12، ورزش۔', en: 'Control sugar, B12, exercise.' }
    },
    
    // ===== DIGESTIVE (starts, 8 in this message) =====
    {
        id: 'gastritis',
        name: { ur: 'معدے کی سوزش', en: 'Gastritis', roman: 'Gastritis' },
        category: 'digestive',
        symptoms: ['stomach_pain', 'nausea', 'acidity', 'bloating', 'loss_appetite', 'heartburn'],
        keySymptoms: ['stomach_pain', 'acidity'],
        tests: [
            { ur: 'H. Pylori Test', en: 'H. Pylori Test' },
            { ur: 'Endoscopy اگر شدید', en: 'Endoscopy if severe' }
        ],
        redFlags: ['blood_stool', 'vomiting_blood', 'chest_pain'],
        remedies: [
            { name: 'Nux Vomica 30', use: { ur: 'کھانے کے بعد بھاری پن', en: 'Heaviness after eating' }, dose: 'Before meals' },
            { name: 'Carbo Veg 30', use: { ur: 'گیس + ڈکار', en: 'Gas + belching' }, dose: '3 times daily' },
            { name: 'Robinia 30', use: { ur: 'رات کو تیزابیت', en: 'Night acidity' }, dose: 'At bedtime' },
            { name: 'Natrum Phos 6X', use: { ur: 'کھٹی ڈکار', en: 'Sour belching' }, dose: 'After meals' }
        ],
        advice: { ur: 'مصالحہ دار، تلی چیزیں کم۔ وقت پر کھائیں۔', en: 'Reduce spicy, fried. Eat on time.' }
    },
    {
        id: 'gerd',
        name: { ur: 'معدے کی جلن (GERD)', en: 'GERD / Acid Reflux', roman: 'GERD' },
        category: 'digestive',
        symptoms: ['heartburn', 'acidity', 'chest_pain', 'belching', 'nausea', 'sore_throat'],
        keySymptoms: ['heartburn', 'acidity'],
        tests: [
            { ur: 'Endoscopy', en: 'Endoscopy' },
            { ur: 'H. Pylori Test', en: 'H. Pylori Test' },
            { ur: '24-hr pH monitoring', en: '24-hr pH monitoring' }
        ],
        redFlags: ['difficulty_swallowing', 'vomiting_blood', 'chest_pain', 'weight_loss'],
        remedies: [
            { name: 'Robinia 30', use: { ur: 'رات کو تیزابیت', en: 'Night acidity' }, dose: 'At bedtime' },
            { name: 'Natrum Phos 6X', use: { ur: 'کھٹی ڈکار', en: 'Sour belching' }, dose: 'After meals' },
            { name: 'Nux Vomica 30', use: { ur: 'مصالحہ سے', en: 'From spicy food' }, dose: 'Morning' },
            { name: 'Iris Versicolor 30', use: { ur: 'شدید جلن', en: 'Severe burning' }, dose: '3 times daily' }
        ],
        advice: { ur: 'سر اونچا کر کے سوئیں، مصالحہ کم، وزن کم۔', en: 'Sleep head elevated, less spice.' }
    },
    {
        id: 'peptic_ulcer',
        name: { ur: 'معدے کا زخم', en: 'Peptic Ulcer', roman: 'Pait ka Zakhm' },
        category: 'digestive',
        symptoms: ['upper_abdomen_pain', 'stomach_pain', 'nausea', 'vomiting', 'heartburn', 'loss_appetite'],
        keySymptoms: ['upper_abdomen_pain', 'heartburn'],
        tests: [
            { ur: 'Endoscopy', en: 'Endoscopy' },
            { ur: 'H. Pylori Test', en: 'H. Pylori Test' },
            { ur: 'Stool for Occult Blood', en: 'Stool Occult Blood' }
        ],
        redFlags: ['vomiting_blood', 'black_stool', 'severe_pain'],
        remedies: [
            { name: 'Argentum Nit 30', use: { ur: 'شدید درد کھانے کے بعد', en: 'Severe pain after eating' }, dose: '3 times daily' },
            { name: 'Kali Bich 30', use: { ur: 'مخصوص جگہ درد', en: 'Localized pain' }, dose: '3 times daily' },
            { name: 'Uranium Nit 30', use: { ur: 'ذیابیطس والوں میں', en: 'In diabetics' }, dose: 'Twice daily' },
            { name: 'Hydrastis Q', use: { ur: 'ٹانک', en: 'Tonic' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'مصالحہ، سگریٹ، الکحل بند۔ چھوٹے وقفے سے کھائیں۔', en: 'No spice, smoking, alcohol.' }
    },
    {
        id: 'ibs',
        name: { ur: 'آنت کی خرابی (IBS)', en: 'IBS (Irritable Bowel)', roman: 'IBS' },
        category: 'digestive',
        symptoms: ['stomach_pain', 'bloating', 'constipation', 'diarrhea', 'gas', 'mucus_stool'],
        keySymptoms: ['stomach_pain', 'bloating'],
        tests: [
            { ur: 'Stool tests', en: 'Stool tests' },
            { ur: 'Colonoscopy اگر ضروری', en: 'Colonoscopy if needed' },
            { ur: 'Food allergy test', en: 'Food allergy test' }
        ],
        redFlags: ['blood_stool', 'weight_loss', 'severe_pain'],
        remedies: [
            { name: 'Nux Vomica 30', use: { ur: 'قبض کے ساتھ IBS', en: 'IBS-C' }, dose: 'Morning' },
            { name: 'Aloe Soc 30', use: { ur: 'اسہال کے ساتھ IBS', en: 'IBS-D' }, dose: '3 times daily' },
            { name: 'Lycopodium 200', use: { ur: 'گیس + پیٹ پھولنا', en: 'Gas + bloating' }, dose: 'Daily' },
            { name: 'Argentum Nit 30', use: { ur: 'ذہنی دباؤ سے', en: 'From anxiety' }, dose: '3 times daily' }
        ],
        advice: { ur: 'ذہنی سکون، ریشہ، پروبائیوٹکس، trigger foods سے بچیں۔', en: 'Stress management, fiber, probiotics.' }
    },
    {
        id: 'diarrhea_acute',
        name: { ur: 'اسہال (دست)', en: 'Acute Diarrhea', roman: 'Ishaal' },
        category: 'digestive',
        symptoms: ['diarrhea', 'watery_stools', 'stomach_pain', 'nausea', 'weakness'],
        keySymptoms: ['diarrhea'],
        tests: [
            { ur: 'Stool Test (اگر شدید)', en: 'Stool Test if severe' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['blood_stool', 'unconscious', 'high_fever', 'dehydration'],
        remedies: [
            { name: 'Arsenic Album 30', use: { ur: 'باسی کھانے سے', en: 'From stale food' }, dose: '2 hourly' },
            { name: 'Podophyllum 30', use: { ur: 'پیلا پانی جیسا دست', en: 'Watery yellow stools' }, dose: 'Frequent' },
            { name: 'Aloe Soc 30', use: { ur: 'صبح کے دست', en: 'Morning diarrhea' }, dose: '3 times' },
            { name: 'China Off 30', use: { ur: 'کمزوری کے ساتھ', en: 'With weakness' }, dose: '3 hourly' }
        ],
        advice: { ur: 'ORS ضرور، ہلکی خوراک، کھچڑی، دہی۔', en: 'ORS, light diet, rice, yogurt.' }
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
            { name: 'Nux Vomica 30', use: { ur: 'باربار کوشش، کچھ نہ آئے', en: 'Frequent urging' }, dose: 'Morning' },
            { name: 'Bryonia 30', use: { ur: 'خشک سخت پاخانہ', en: 'Dry hard stools' }, dose: 'Morning' },
            { name: 'Alumina 30', use: { ur: 'بالکل خواہش نہیں', en: 'No desire' }, dose: 'Daily' },
            { name: 'Silicea 30', use: { ur: 'واپس جائے', en: 'Stool recedes' }, dose: 'Daily' }
        ],
        advice: { ur: 'پانی زیادہ، ریشہ دار غذا، ورزش۔', en: 'Water, fiber, exercise.' }
    },
    {
        id: 'food_poisoning',
        name: { ur: 'فوڈ پوائزننگ', en: 'Food Poisoning', roman: 'Food Poisoning' },
        category: 'digestive',
        symptoms: ['vomiting', 'diarrhea', 'stomach_pain', 'nausea', 'fever', 'weakness'],
        keySymptoms: ['vomiting', 'diarrhea', 'stomach_pain'],
        tests: [{ ur: 'Stool Culture', en: 'Stool Culture' }, { ur: 'CBC', en: 'CBC' }],
        redFlags: ['blood_stool', 'unconscious', 'high_fever'],
        remedies: [
            { name: 'Arsenic Album 30', use: { ur: 'اہم - باسی کھانا', en: 'Main - stale food' }, dose: '2 hourly' },
            { name: 'Ipecac 30', use: { ur: 'مسلسل الٹی', en: 'Continuous vomiting' }, dose: 'SOS' },
            { name: 'Nux Vomica 30', use: { ur: 'زیادہ کھانے سے', en: 'Overeating' }, dose: '3 hourly' }
        ],
        advice: { ur: 'ORS، آرام، ہلکا کھانا۔', en: 'ORS, rest, light food.' }
    },
    {
        id: 'gallstones',
        name: { ur: 'پتے کی پتھری', en: 'Gallstones', roman: 'Pittay ki Pathri' },
        category: 'digestive',
        symptoms: ['upper_abdomen_pain', 'nausea', 'vomiting', 'yellowish_skin', 'stomach_pain'],
        keySymptoms: ['upper_abdomen_pain'],
        tests: [
            { ur: 'Ultrasound Abdomen', en: 'Ultrasound Abdomen' },
            { ur: 'LFTs', en: 'LFTs' },
            { ur: 'CT Abdomen', en: 'CT Abdomen if needed' }
        ],
        redFlags: ['yellowish_skin', 'high_fever', 'severe_pain'],
        remedies: [
            { name: 'Chelidonium Q', use: { ur: 'پتے کی خاص دوا', en: 'Specific for gallbladder' }, dose: '10 drops thrice' },
            { name: 'Berberis Vulgaris Q', use: { ur: 'پتھری کے لیے', en: 'For stones' }, dose: '10 drops thrice' },
            { name: 'Calcarea Carb 30', use: { ur: 'موٹے مریض', en: 'Obese patients' }, dose: 'Weekly' },
            { name: 'Cholesterinum 3X', use: { ur: 'پتھری تحلیل', en: 'Stone dissolution' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'کم چربی، وزن کم، پانی زیادہ۔', en: 'Low fat, weight loss, hydration.' }
    },
    // ===== DIGESTIVE (continued) =====
    {
        id: 'appendicitis',
        name: { ur: 'اپینڈکس', en: 'Appendicitis', roman: 'Appendix' },
        category: 'digestive',
        symptoms: ['lower_abdomen_pain', 'stomach_pain', 'nausea', 'vomiting', 'fever', 'loss_appetite'],
        keySymptoms: ['lower_abdomen_pain'],
        tests: [
            { ur: 'Ultrasound Abdomen', en: 'Ultrasound Abdomen' },
            { ur: 'CT Abdomen', en: 'CT Abdomen' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['severe_pain', 'high_fever', 'vomiting'],
        remedies: [
            { name: 'Belladonna 200', use: { ur: 'اچانک شدید درد', en: 'Sudden severe pain' }, dose: 'SOS' },
            { name: 'Bryonia 30', use: { ur: 'حرکت سے بڑھے', en: 'Worse motion' }, dose: '2 hourly' },
            { name: 'Iris Tenax 30', use: { ur: 'اپینڈکس کی خاص', en: 'Specific for appendix' }, dose: '3 hourly' }
        ],
        advice: { ur: '⚠️ ایمرجنسی! فوری سرجری کی ضرورت۔', en: '⚠️ EMERGENCY! Immediate surgery.' }
    },
    {
        id: 'hernia',
        name: { ur: 'ہرنیا (کوکڑی)', en: 'Hernia', roman: 'Hernia' },
        category: 'digestive',
        symptoms: ['lower_abdomen_pain', 'stomach_pain', 'swelling_body'],
        keySymptoms: ['lower_abdomen_pain'],
        tests: [
            { ur: 'Physical examination', en: 'Physical examination' },
            { ur: 'Ultrasound', en: 'Ultrasound' },
            { ur: 'CT Abdomen', en: 'CT Abdomen if needed' }
        ],
        redFlags: ['severe_pain', 'vomiting', 'high_fever'],
        remedies: [
            { name: 'Nux Vomica 30', use: { ur: 'ہرنیا کی عام دوا', en: 'General for hernia' }, dose: 'Twice daily' },
            { name: 'Lycopodium 200', use: { ur: 'دائیں طرف', en: 'Right-sided' }, dose: 'Weekly' },
            { name: 'Silicea 30', use: { ur: 'کمزوری', en: 'Weakness' }, dose: 'Daily' }
        ],
        advice: { ur: 'بھاری نہ اٹھائیں، سرجری بہتر۔', en: 'No heavy lifting, surgery best.' }
    },
    {
        id: 'fatty_liver',
        name: { ur: 'چربی والا جگر', en: 'Fatty Liver', roman: 'Fatty Liver' },
        category: 'digestive',
        symptoms: ['upper_abdomen_pain', 'weakness', 'fatigue', 'weight_gain', 'loss_appetite'],
        keySymptoms: ['upper_abdomen_pain', 'fatigue'],
        tests: [
            { ur: 'LFTs', en: 'LFTs' },
            { ur: 'Ultrasound Abdomen', en: 'Ultrasound Abdomen' },
            { ur: 'Lipid Profile', en: 'Lipid Profile' },
            { ur: 'FibroScan', en: 'FibroScan' }
        ],
        redFlags: ['yellowish_skin', 'confusion', 'bleeding'],
        remedies: [
            { name: 'Chelidonium Q', use: { ur: 'جگر کی خاص', en: 'Specific for liver' }, dose: '10 drops thrice' },
            { name: 'Carduus Marianus Q', use: { ur: 'جگر کا ٹانک', en: 'Liver tonic' }, dose: '10 drops thrice' },
            { name: 'Lycopodium 200', use: { ur: 'دائیں پیٹ میں درد', en: 'Right abdomen pain' }, dose: 'Weekly' },
            { name: 'Phosphorus 30', use: { ur: 'شدید صورت', en: 'Severe cases' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'وزن کم، ورزش، تلی چیزیں بند، شراب بند۔', en: 'Weight loss, exercise, no fried food.' }
    },
    {
        id: 'worm_infestation',
        name: { ur: 'کیڑے', en: 'Worm Infestation', roman: 'Keeray' },
        category: 'digestive',
        symptoms: ['stomach_pain', 'anal_itching', 'worms_stool', 'loss_appetite', 'weight_loss', 'weakness'],
        keySymptoms: ['worms_stool', 'anal_itching'],
        tests: [
            { ur: 'Stool for Ova & Parasites', en: 'Stool O&P' },
            { ur: 'CBC (Eosinophils)', en: 'CBC (Eosinophils)' }
        ],
        redFlags: ['severe_pain', 'blood_stool'],
        remedies: [
            { name: 'Cina 200', use: { ur: 'اہم بچوں میں', en: 'Main for children' }, dose: 'Twice daily' },
            { name: 'Teucrium 30', use: { ur: 'مقعد میں خارش', en: 'Anal itching' }, dose: '3 times daily' },
            { name: 'Santoninum 3X', use: { ur: 'گول کیڑے', en: 'Roundworms' }, dose: 'Daily' },
            { name: 'Filix Mas 30', use: { ur: 'ٹیپ ورم', en: 'Tapeworm' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'صفائی، ہاتھ دھوئیں، ناخن کاٹیں، کچی سبزی نہ کھائیں۔', en: 'Hygiene, wash hands, cut nails.' }
    },
    {
        id: 'dysentery',
        name: { ur: 'پیچش', en: 'Dysentery', roman: 'Pechish' },
        category: 'digestive',
        symptoms: ['diarrhea', 'blood_stool', 'mucus_stool', 'stomach_pain', 'fever', 'cramping_pain'],
        keySymptoms: ['blood_stool', 'mucus_stool'],
        tests: [
            { ur: 'Stool Test', en: 'Stool Test' },
            { ur: 'Stool Culture', en: 'Stool Culture' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['unconscious', 'high_fever', 'dehydration'],
        remedies: [
            { name: 'Merc Cor 30', use: { ur: 'پیچش کی اہم', en: 'Main dysentery' }, dose: '3 hourly' },
            { name: 'Ipecac 30', use: { ur: 'خون کے ساتھ', en: 'With blood' }, dose: '3 hourly' },
            { name: 'Aloe Soc 30', use: { ur: 'صبح کے دست', en: 'Morning stools' }, dose: '3 times daily' },
            { name: 'Nux Vomica 30', use: { ur: 'مسلسل کوشش', en: 'Constant urging' }, dose: '3 times daily' }
        ],
        advice: { ur: 'ORS، صاف پانی، ہلکی خوراک۔', en: 'ORS, clean water, light diet.' }
    },
    {
        id: 'piles',
        name: { ur: 'بواسیر', en: 'Piles / Hemorrhoids', roman: 'Bawaseer' },
        category: 'digestive',
        symptoms: ['constipation', 'stomach_pain', 'bleeding', 'anal_pain', 'anal_itching', 'hemorrhoids'],
        keySymptoms: ['constipation', 'bleeding', 'hemorrhoids'],
        tests: [
            { ur: 'Proctoscopy', en: 'Proctoscopy' },
            { ur: 'CBC اگر خون بہت', en: 'CBC if bleeding' }
        ],
        redFlags: ['bleeding', 'severe_pain'],
        remedies: [
            { name: 'Hamamelis Q', use: { ur: 'اہم علاج، خون بہنا', en: 'Main - bleeding piles' }, dose: '10 drops thrice' },
            { name: 'Aesculus 30', use: { ur: 'خشک، اندرونی', en: 'Dry, internal' }, dose: '3 times daily' },
            { name: 'Nux Vomica 30', use: { ur: 'قبض + خارش', en: 'Constipation + itching' }, dose: 'Morning' },
            { name: 'Sulphur 200', use: { ur: 'دائمی، خارش', en: 'Chronic, itching' }, dose: 'Weekly' }
        ],
        advice: { ur: 'مصالحہ کم، پانی زیادہ، قبض ٹھیک کریں۔', en: 'Less spice, more water.' }
    },
    {
        id: 'anal_fissure',
        name: { ur: 'مقعد میں شق', en: 'Anal Fissure', roman: 'Maqad mein Shaq' },
        category: 'digestive',
        symptoms: ['anal_pain', 'bleeding', 'constipation', 'anal_itching'],
        keySymptoms: ['anal_pain', 'bleeding'],
        tests: [{ ur: 'Physical examination', en: 'Physical examination' }],
        redFlags: ['bleeding', 'severe_pain'],
        remedies: [
            { name: 'Ratanhia 30', use: { ur: 'اہم، جلن والا درد', en: 'Main - burning pain' }, dose: '3 times daily' },
            { name: 'Nitric Acid 30', use: { ur: 'کاٹنے والا درد', en: 'Cutting pain' }, dose: '3 times daily' },
            { name: 'Paeonia 30', use: { ur: 'خارش کے ساتھ', en: 'With itching' }, dose: '3 times daily' }
        ],
        advice: { ur: 'قبض نہ ہو، پانی زیادہ، ریشہ۔', en: 'Prevent constipation, fiber.' }
    },
    {
        id: 'mouth_ulcers',
        name: { ur: 'منہ کے چھالے', en: 'Mouth Ulcers', roman: 'Munh ke Chaale' },
        category: 'digestive',
        symptoms: ['mouth_ulcers', 'difficulty_swallowing', 'bad_breath', 'loss_taste'],
        keySymptoms: ['mouth_ulcers'],
        tests: [
            { ur: 'Vitamin B12 Level', en: 'Vitamin B12 Level' },
            { ur: 'Iron studies', en: 'Iron studies' }
        ],
        redFlags: ['high_fever', 'weight_loss'],
        remedies: [
            { name: 'Borax 30', use: { ur: 'اہم منہ کے چھالوں کی', en: 'Main for mouth ulcers' }, dose: '3 times daily' },
            { name: 'Merc Sol 30', use: { ur: 'لعاب زیادہ + بو', en: 'Excess saliva + odor' }, dose: '3 times daily' },
            { name: 'Kali Bich 30', use: { ur: 'گہرے زخم', en: 'Deep ulcers' }, dose: '3 times daily' },
            { name: 'Nitric Acid 30', use: { ur: 'کاٹنے والا درد', en: 'Cutting pain' }, dose: '3 times daily' }
        ],
        advice: { ur: 'مصالحہ کم، وٹامن، صفائی۔', en: 'Less spice, vitamins.' }
    },
    {
        id: 'colitis',
        name: { ur: 'بڑی آنت کی سوزش', en: 'Colitis', roman: 'Colitis' },
        category: 'digestive',
        symptoms: ['lower_abdomen_pain', 'diarrhea', 'blood_stool', 'mucus_stool', 'weight_loss', 'weakness'],
        keySymptoms: ['diarrhea', 'blood_stool'],
        tests: [
            { ur: 'Colonoscopy', en: 'Colonoscopy' },
            { ur: 'Stool Test', en: 'Stool Test' },
            { ur: 'CBC, ESR', en: 'CBC, ESR' }
        ],
        redFlags: ['blood_stool', 'severe_pain', 'high_fever'],
        remedies: [
            { name: 'Merc Cor 30', use: { ur: 'خونی دست', en: 'Bloody diarrhea' }, dose: '3 hourly' },
            { name: 'Aloe Soc 30', use: { ur: 'صبح کے دست', en: 'Morning stools' }, dose: '3 times daily' },
            { name: 'Nux Vomica 30', use: { ur: 'مسلسل کوشش', en: 'Constant urging' }, dose: '3 times daily' },
            { name: 'Arsenic Album 30', use: { ur: 'کمزوری', en: 'Weakness' }, dose: '3 times daily' }
        ],
        advice: { ur: 'ذہنی سکون، probiotics، ریشہ۔', en: 'Stress management, probiotics.' }
    },
    {
        id: 'pancreatitis',
        name: { ur: 'لبلبے کی سوزش', en: 'Pancreatitis', roman: 'Lablabay ki Sozish' },
        category: 'digestive',
        symptoms: ['upper_abdomen_pain', 'back_pain', 'nausea', 'vomiting', 'fever', 'rapid_breathing'],
        keySymptoms: ['upper_abdomen_pain', 'back_pain'],
        tests: [
            { ur: 'Serum Amylase', en: 'Serum Amylase' },
            { ur: 'Serum Lipase', en: 'Serum Lipase' },
            { ur: 'CT Abdomen', en: 'CT Abdomen' }
        ],
        redFlags: ['severe_pain', 'vomiting', 'unconscious'],
        remedies: [
            { name: 'Iris Versicolor 30', use: { ur: 'لبلبے کی خاص', en: 'Specific for pancreas' }, dose: '3 hourly' },
            { name: 'Phosphorus 30', use: { ur: 'شدید صورت', en: 'Severe cases' }, dose: '3 hourly' },
            { name: 'Belladonna 30', use: { ur: 'اچانک درد', en: 'Sudden pain' }, dose: 'SOS' }
        ],
        advice: { ur: '⚠️ ایمرجنسی! ہسپتال داخل ہونا۔', en: '⚠️ EMERGENCY! Hospital admission.' }
    },
    {
        id: 'toothache',
        name: { ur: 'دانت درد', en: 'Toothache', roman: 'Daant Dard' },
        category: 'digestive',
        symptoms: ['tooth_pain', 'swollen_gums', 'bad_breath', 'headache', 'ear_pain'],
        keySymptoms: ['tooth_pain'],
        tests: [
            { ur: 'Dental X-Ray', en: 'Dental X-Ray' },
            { ur: 'Dental examination', en: 'Dental examination' }
        ],
        redFlags: ['high_fever', 'facial_paralysis', 'breathing_difficulty'],
        remedies: [
            { name: 'Plantago 30', use: { ur: 'اہم دانت درد', en: 'Main for toothache' }, dose: '2 hourly' },
            { name: 'Belladonna 30', use: { ur: 'دھڑکتا درد', en: 'Throbbing pain' }, dose: '3 hourly' },
            { name: 'Merc Sol 30', use: { ur: 'رات کو بڑھے', en: 'Worse at night' }, dose: '3 times daily' },
            { name: 'Chamomilla 30', use: { ur: 'برداشت نہ ہو', en: 'Unbearable' }, dose: 'SOS' }
        ],
        advice: { ur: 'دانتوں کا ڈاکٹر، برش صحیح، صفائی۔', en: 'Dentist visit, proper brushing.' }
    },
    {
        id: 'gum_disease',
        name: { ur: 'مسوڑھوں کی بیماری', en: 'Gum Disease', roman: 'Masoron ki Bimari' },
        category: 'digestive',
        symptoms: ['bleeding_gums', 'swollen_gums', 'bad_breath', 'tooth_pain', 'mouth_ulcers'],
        keySymptoms: ['bleeding_gums', 'swollen_gums'],
        tests: [
            { ur: 'Dental examination', en: 'Dental examination' },
            { ur: 'Dental X-Ray', en: 'Dental X-Ray' }
        ],
        redFlags: ['high_fever', 'severe_pain'],
        remedies: [
            { name: 'Merc Sol 30', use: { ur: 'مسوڑھوں سے خون', en: 'Bleeding gums' }, dose: '3 times daily' },
            { name: 'Kreosotum 30', use: { ur: 'گندے دانت', en: 'Decayed teeth' }, dose: '3 times daily' },
            { name: 'Phosphorus 30', use: { ur: 'خون آسانی سے', en: 'Easy bleeding' }, dose: '3 times daily' }
        ],
        advice: { ur: 'روزانہ برش، فلاسنگ، دانتوں کا چیک اپ۔', en: 'Daily brushing, flossing.' }
    },
    
    // ===== SKIN (15) =====
    {
        id: 'eczema',
        name: { ur: 'ایگزیما / خارش', en: 'Eczema', roman: 'Eczema' },
        category: 'skin',
        symptoms: ['itching', 'rash', 'dry_skin', 'burning_skin', 'scaly_skin'],
        keySymptoms: ['itching', 'rash'],
        tests: [
            { ur: 'Allergy Test', en: 'Allergy Test' },
            { ur: 'Skin biopsy اگر ضروری', en: 'Skin biopsy if needed' }
        ],
        redFlags: ['pus_discharge', 'high_fever'],
        remedies: [
            { name: 'Sulphur 30', use: { ur: 'خشک خارش، گرمی سے بڑھے', en: 'Dry itch, worse heat' }, dose: 'Weekly' },
            { name: 'Graphites 30', use: { ur: 'گاڑھا شہد جیسا رساو', en: 'Honey-like discharge' }, dose: 'Daily' },
            { name: 'Rhus Tox 30', use: { ur: 'چھالے، خارش', en: 'Blisters, itching' }, dose: '3 times daily' },
            { name: 'Arsenic Album 30', use: { ur: 'خشک، پپڑی', en: 'Dry, scaly' }, dose: 'Daily' }
        ],
        advice: { ur: 'موائسچرائزر، صابن کم، ہلکے کپڑے۔', en: 'Moisturizer, less soap.' }
    },
    {
        id: 'psoriasis',
        name: { ur: 'چنبل', en: 'Psoriasis', roman: 'Chambal' },
        category: 'skin',
        symptoms: ['rash', 'scaly_skin', 'itching', 'dry_skin', 'joint_pain'],
        keySymptoms: ['scaly_skin', 'rash'],
        tests: [
            { ur: 'Skin biopsy', en: 'Skin biopsy' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['joint_pain', 'high_fever'],
        remedies: [
            { name: 'Arsenic Album 200', use: { ur: 'خشک، پپڑی', en: 'Dry, scaly' }, dose: 'Weekly' },
            { name: 'Graphites 200', use: { ur: 'کھوپڑی پر چنبل', en: 'Scalp psoriasis' }, dose: 'Weekly' },
            { name: 'Sepia 200', use: { ur: 'عورتوں میں', en: 'In women' }, dose: 'Weekly' },
            { name: 'Sulphur 1M', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Monthly' }
        ],
        advice: { ur: 'موائسچرائزر، دھوپ کم، ذہنی سکون۔', en: 'Moisturizer, stress relief.' }
    },
    {
        id: 'acne',
        name: { ur: 'کیل مہاسے', en: 'Acne / Pimples', roman: 'Keel Muhasay' },
        category: 'skin',
        symptoms: ['acne', 'oily_skin', 'boils'],
        keySymptoms: ['acne'],
        tests: [
            { ur: 'Hormonal tests (خواتین)', en: 'Hormonal tests (women)' },
            { ur: 'Ultrasound Ovaries', en: 'Ultrasound Ovaries' }
        ],
        redFlags: [],
        remedies: [
            { name: 'Berberis Aquifolium Q', use: { ur: 'اہم دوا کیل کی', en: 'Main for acne' }, dose: '10 drops thrice' },
            { name: 'Kali Bromatum 30', use: { ur: 'گہرے مہاسے', en: 'Deep pimples' }, dose: '3 times daily' },
            { name: 'Hepar Sulph 30', use: { ur: 'پیپ کے ساتھ', en: 'With pus' }, dose: '3 times daily' },
            { name: 'Sulphur 30', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' }
        ],
        advice: { ur: 'صفائی، تلی چیزیں کم، پانی زیادہ۔', en: 'Cleanliness, less oil, water.' }
    },
    {
        id: 'fungal_skin',
        name: { ur: 'فنگل انفیکشن', en: 'Fungal Infection', roman: 'Fungal Infection' },
        category: 'skin',
        symptoms: ['fungal_infection', 'itching', 'rash', 'burning_skin', 'scaly_skin'],
        keySymptoms: ['fungal_infection', 'itching'],
        tests: [
            { ur: 'Skin scraping (KOH)', en: 'Skin scraping (KOH)' },
            { ur: 'Fungal culture', en: 'Fungal culture' }
        ],
        redFlags: ['high_fever', 'pus_discharge'],
        remedies: [
            { name: 'Sulphur 200', use: { ur: 'اہم فنگل کی', en: 'Main for fungal' }, dose: 'Weekly' },
            { name: 'Tellurium 30', use: { ur: 'داد کی خاص', en: 'Specific for ringworm' }, dose: '3 times daily' },
            { name: 'Sepia 200', use: { ur: 'گول ریش', en: 'Circular rash' }, dose: 'Weekly' },
            { name: 'Bacillinum 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Monthly' }
        ],
        advice: { ur: 'خشکی، ہوا دار کپڑے، صفائی۔', en: 'Keep dry, cotton clothes.' }
    },
    {
        id: 'ringworm',
        name: { ur: 'داد', en: 'Ringworm', roman: 'Daad' },
        category: 'skin',
        symptoms: ['ringworm', 'itching', 'rash', 'scaly_skin'],
        keySymptoms: ['ringworm'],
        tests: [
            { ur: 'Skin scraping KOH', en: 'KOH prep' },
            { ur: 'Wood\'s lamp', en: "Wood's lamp" }
        ],
        redFlags: ['pus_discharge'],
        remedies: [
            { name: 'Tellurium 30', use: { ur: 'اہم داد کی', en: 'Main for ringworm' }, dose: '3 times daily' },
            { name: 'Sepia 200', use: { ur: 'گول شکل', en: 'Circular shape' }, dose: 'Weekly' },
            { name: 'Chrysarobinum 3X', use: { ur: 'باہری استعمال', en: 'External use' }, dose: 'Apply local' }
        ],
        advice: { ur: 'الگ تولیہ، صفائی، خشک رکھیں۔', en: 'Separate towels, dry area.' }
    },
    {
        id: 'scabies',
        name: { ur: 'خارش (اسکیبیز)', en: 'Scabies', roman: 'Scabies' },
        category: 'skin',
        symptoms: ['itching', 'rash', 'blisters', 'burning_skin'],
        keySymptoms: ['itching', 'rash'],
        tests: [
            { ur: 'Skin scraping', en: 'Skin scraping' },
            { ur: 'Dermatoscopy', en: 'Dermatoscopy' }
        ],
        redFlags: ['pus_discharge', 'high_fever'],
        remedies: [
            { name: 'Sulphur 30', use: { ur: 'اہم خارش کی', en: 'Main for scabies' }, dose: '3 times daily' },
            { name: 'Psorinum 200', use: { ur: 'دائمی خارش', en: 'Chronic itching' }, dose: 'Weekly' },
            { name: 'Merc Sol 30', use: { ur: 'رات کو بڑھے', en: 'Worse at night' }, dose: '3 times daily' }
        ],
        advice: { ur: 'خاندان کا سب علاج، کپڑے دھوئیں۔', en: 'Treat whole family, wash clothes.' }
    },
    {
        id: 'allergy',
        name: { ur: 'الرجی', en: 'Allergy', roman: 'Allergy' },
        category: 'skin',
        symptoms: ['rash', 'itching', 'sneezing', 'runny_nose', 'red_eyes', 'hives'],
        keySymptoms: ['itching', 'sneezing'],
        tests: [
            { ur: 'IgE Level', en: 'IgE Level' },
            { ur: 'Skin Prick Test', en: 'Skin Prick Test' }
        ],
        redFlags: ['breathing_difficulty', 'swelling_body'],
        remedies: [
            { name: 'Histaminum 30', use: { ur: 'عام الرجی', en: 'General allergy' }, dose: '3 times daily' },
            { name: 'Apis Mellifica 30', use: { ur: 'سوجن + خارش', en: 'Swelling + itching' }, dose: 'SOS' },
            { name: 'Urtica Urens Q', use: { ur: 'چھپاکی', en: 'Urticaria' }, dose: '10 drops' },
            { name: 'Natrum Mur 30', use: { ur: 'دائمی الرجی', en: 'Chronic allergy' }, dose: 'Weekly' }
        ],
        advice: { ur: 'الرجن کی شناخت، پرہیز۔', en: 'Identify allergen, avoid.' }
    },
    {
        id: 'urticaria',
        name: { ur: 'چھپاکی', en: 'Urticaria / Hives', roman: 'Chapaki' },
        category: 'skin',
        symptoms: ['hives', 'itching', 'rash', 'swelling_body', 'burning_skin'],
        keySymptoms: ['hives', 'itching'],
        tests: [
            { ur: 'IgE Level', en: 'IgE Level' },
            { ur: 'CBC', en: 'CBC' },
            { ur: 'Allergy Panel', en: 'Allergy Panel' }
        ],
        redFlags: ['breathing_difficulty', 'swelling_body'],
        remedies: [
            { name: 'Urtica Urens Q', use: { ur: 'اہم چھپاکی', en: 'Main urticaria' }, dose: '10 drops SOS' },
            { name: 'Apis Mellifica 30', use: { ur: 'سوجن + جلن', en: 'Swelling + burning' }, dose: 'SOS' },
            { name: 'Rhus Tox 30', use: { ur: 'بارش/ٹھنڈ سے', en: 'From cold/rain' }, dose: '3 times daily' },
            { name: 'Astacus 30', use: { ur: 'خوراک کی الرجی', en: 'Food allergy' }, dose: '3 times daily' }
        ],
        advice: { ur: 'الرجن سے بچیں، antihistamine۔', en: 'Avoid allergens.' }
    },
    {
        id: 'boils',
        name: { ur: 'پھوڑے پھنسیاں', en: 'Boils / Furuncles', roman: 'Phoray Phunsian' },
        category: 'skin',
        symptoms: ['boils', 'swelling_body', 'itching', 'pus_discharge', 'burning_skin'],
        keySymptoms: ['boils'],
        tests: [
            { ur: 'Blood Sugar (اگر بار بار)', en: 'Blood Sugar' },
            { ur: 'Pus culture', en: 'Pus culture' }
        ],
        redFlags: ['high_fever'],
        remedies: [
            { name: 'Belladonna 30', use: { ur: 'شروع میں - سرخ، گرم', en: 'Early - red, hot' }, dose: '3 hourly' },
            { name: 'Hepar Sulph 30', use: { ur: 'پیپ بننے پر', en: 'When pus forms' }, dose: '4 hourly' },
            { name: 'Silicea 30', use: { ur: 'پیپ نکالنے', en: 'To discharge pus' }, dose: '3 times daily' },
            { name: 'Myristica 30', use: { ur: 'جلد ٹھیک ہو', en: 'Fast healing' }, dose: '3 times daily' }
        ],
        advice: { ur: 'صفائی، خون صاف کرنے والی غذا، شوگر چیک۔', en: 'Hygiene, check sugar.' }
    },
    {
        id: 'vitiligo',
        name: { ur: 'برص (وٹیلیگو)', en: 'Vitiligo', roman: 'Baras' },
        category: 'skin',
        symptoms: ['white_patches', 'skin_discoloration'],
        keySymptoms: ['white_patches'],
        tests: [
            { ur: 'Wood\'s Lamp', en: "Wood's Lamp" },
            { ur: 'Thyroid Tests', en: 'Thyroid Tests' },
            { ur: 'Vitamin B12', en: 'Vitamin B12' }
        ],
        redFlags: [],
        remedies: [
            { name: 'Arsenic Album 200', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Weekly' },
            { name: 'Silicea 200', use: { ur: 'کمزور مریض', en: 'Weak patients' }, dose: 'Weekly' },
            { name: 'Sulphur 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' },
            { name: 'Nitric Acid 30', use: { ur: 'داغ کے کنارے', en: 'Border of patches' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'دھوپ سے حفاظت، صبر، وٹامن۔', en: 'Sun protection, patience.' }
    },
    {
        id: 'warts',
        name: { ur: 'مسے', en: 'Warts', roman: 'Musay' },
        category: 'skin',
        symptoms: ['warts', 'skin_discoloration'],
        keySymptoms: ['warts'],
        tests: [{ ur: 'Clinical diagnosis', en: 'Clinical diagnosis' }],
        redFlags: ['bleeding'],
        remedies: [
            { name: 'Thuja 200', use: { ur: 'اہم مسوں کی دوا', en: 'Main for warts' }, dose: 'Weekly' },
            { name: 'Antim Crud 30', use: { ur: 'ہاتھوں پر مسے', en: 'Warts on hands' }, dose: 'Twice daily' },
            { name: 'Causticum 200', use: { ur: 'چہرے پر', en: 'On face' }, dose: 'Weekly' },
            { name: 'Nitric Acid 30', use: { ur: 'بڑے، دردناک', en: 'Large, painful' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'صبر، خود ٹھیک ہو جاتے ہیں۔', en: 'Patience, often self-heal.' }
    },
    {
        id: 'hair_loss',
        name: { ur: 'بال گرنا', en: 'Hair Loss', roman: 'Baal Girna' },
        category: 'skin',
        symptoms: ['hair_loss', 'dandruff', 'dry_skin', 'weakness'],
        keySymptoms: ['hair_loss'],
        tests: [
            { ur: 'CBC', en: 'CBC' },
            { ur: 'Thyroid Tests', en: 'Thyroid Tests' },
            { ur: 'Iron Studies', en: 'Iron Studies' },
            { ur: 'Vitamin D, B12', en: 'Vitamin D, B12' }
        ],
        redFlags: [],
        remedies: [
            { name: 'Wiesbaden 30', use: { ur: 'اہم بال گرنے کی', en: 'Main for hair loss' }, dose: 'Twice daily' },
            { name: 'Phosphorus 30', use: { ur: 'گچھوں میں گرنا', en: 'In patches' }, dose: '3 times daily' },
            { name: 'Sepia 200', use: { ur: 'حمل کے بعد', en: 'Post-pregnancy' }, dose: 'Weekly' },
            { name: 'Fluoric Acid 30', use: { ur: 'خشک، ٹوٹنا', en: 'Dry, breaking' }, dose: 'Twice daily' },
            { name: 'Arnica Q', use: { ur: 'باہری استعمال', en: 'External use' }, dose: 'Massage' }
        ],
        advice: { ur: 'اچھی خوراک، آئرن، وٹامن، ذہنی سکون۔', en: 'Good diet, iron, stress relief.' }
    },
    {
        id: 'dandruff',
        name: { ur: 'خشکی (سکری)', en: 'Dandruff', roman: 'Khushki' },
        category: 'skin',
        symptoms: ['dandruff', 'itching', 'dry_skin', 'hair_loss'],
        keySymptoms: ['dandruff'],
        tests: [{ ur: 'Scalp examination', en: 'Scalp examination' }],
        redFlags: [],
        remedies: [
            { name: 'Kali Sulph 6X', use: { ur: 'اہم خشکی کی', en: 'Main for dandruff' }, dose: '3 times daily' },
            { name: 'Thuja 30', use: { ur: 'خشک خشکی', en: 'Dry dandruff' }, dose: 'Twice daily' },
            { name: 'Sulphur 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' }
        ],
        advice: { ur: 'antifungal شیمپو، تیل، صفائی۔', en: 'Antifungal shampoo, hygiene.' }
    },
    {
        id: 'shingles',
        name: { ur: 'شنگلز (ناگ پھڑا)', en: 'Shingles (Herpes Zoster)', roman: 'Shingles' },
        category: 'skin',
        symptoms: ['rash', 'blisters', 'burning_skin', 'itching', 'fever', 'body_ache'],
        keySymptoms: ['rash', 'blisters', 'burning_skin'],
        tests: [
            { ur: 'Clinical diagnosis', en: 'Clinical diagnosis' },
            { ur: 'PCR test', en: 'PCR test if needed' }
        ],
        redFlags: ['eye_pain', 'facial_paralysis'],
        remedies: [
            { name: 'Rhus Tox 200', use: { ur: 'اہم دوا شنگلز', en: 'Main for shingles' }, dose: '3 times daily' },
            { name: 'Ranunculus Bulb 30', use: { ur: 'سینے پر شنگلز', en: 'Chest shingles' }, dose: '3 times daily' },
            { name: 'Mezereum 30', use: { ur: 'شدید جلن', en: 'Severe burning' }, dose: '3 times daily' },
            { name: 'Arsenic Album 30', use: { ur: 'رات کو بڑھے', en: 'Worse at night' }, dose: '3 times daily' }
        ],
        advice: { ur: 'آرام، antiviral، درد کش، آنکھ حفاظت۔', en: 'Rest, antivirals, protect eyes.' }
    },
    
    // ===== BONES & JOINTS (12) =====
    {
        id: 'arthritis',
        name: { ur: 'گٹھیا', en: 'Arthritis', roman: 'Gathiya' },
        category: 'joints',
        symptoms: ['joint_pain', 'joint_swelling', 'joint_stiffness', 'morning_stiffness'],
        keySymptoms: ['joint_pain', 'joint_stiffness'],
        tests: [
            { ur: 'RA Factor', en: 'RA Factor' },
            { ur: 'CRP, ESR', en: 'CRP, ESR' },
            { ur: 'Uric Acid', en: 'Uric Acid' },
            { ur: 'X-Ray joints', en: 'X-Ray joints' }
        ],
        redFlags: ['high_fever', 'swelling_body'],
        remedies: [
            { name: 'Rhus Tox 200', use: { ur: 'حرکت سے آرام', en: 'Better from motion' }, dose: 'Twice daily' },
            { name: 'Bryonia 30', use: { ur: 'حرکت سے بڑھے', en: 'Worse from motion' }, dose: '3 times daily' },
            { name: 'Colchicum 30', use: { ur: 'یورک ایسڈ', en: 'Uric acid' }, dose: '3 times daily' },
            { name: 'Calcarea Fluor 6X', use: { ur: 'ہڈی مضبوطی', en: 'Bone strength' }, dose: 'Daily' }
        ],
        advice: { ur: 'وزن کم، ہلکی ورزش، گرم سکائی۔', en: 'Weight loss, exercise, warm compress.' }
    },
    {
        id: 'rheumatoid_arthritis',
        name: { ur: 'RA (رومیٹائڈ)', en: 'Rheumatoid Arthritis', roman: 'Rheumatoid Arthritis' },
        category: 'joints',
        symptoms: ['joint_pain', 'joint_swelling', 'morning_stiffness', 'weakness', 'fatigue', 'weight_loss'],
        keySymptoms: ['joint_swelling', 'morning_stiffness'],
        tests: [
            { ur: 'RA Factor', en: 'RA Factor' },
            { ur: 'Anti-CCP', en: 'Anti-CCP' },
            { ur: 'CRP, ESR', en: 'CRP, ESR' },
            { ur: 'X-Ray hands/feet', en: 'X-Ray hands/feet' }
        ],
        redFlags: ['high_fever', 'chest_pain'],
        remedies: [
            { name: 'Rhus Tox 1M', use: { ur: 'اہم دوا RA', en: 'Main for RA' }, dose: 'Weekly' },
            { name: 'Bryonia 200', use: { ur: 'حرکت سے شدید', en: 'Severe on motion' }, dose: '3 times daily' },
            { name: 'Caulophyllum 30', use: { ur: 'چھوٹے جوڑ', en: 'Small joints' }, dose: '3 times daily' },
            { name: 'Ledum Pal 30', use: { ur: 'نیچے سے اوپر', en: 'Ascending' }, dose: '3 times daily' }
        ],
        advice: { ur: 'ذہنی سکون، فزیوتھراپی، مکمل علاج۔', en: 'Stress relief, physio, treatment.' }
    },
    {
        id: 'gout',
        name: { ur: 'یورک ایسڈ (گاؤٹ)', en: 'Gout', roman: 'Gout' },
        category: 'joints',
        symptoms: ['joint_pain', 'joint_swelling', 'burning_skin', 'high_fever'],
        keySymptoms: ['joint_pain', 'joint_swelling'],
        tests: [
            { ur: 'Serum Uric Acid', en: 'Serum Uric Acid' },
            { ur: 'Joint fluid analysis', en: 'Joint fluid analysis' },
            { ur: 'X-Ray affected joint', en: 'X-Ray joint' }
        ],
        redFlags: ['high_fever'],
        remedies: [
            { name: 'Colchicum 30', use: { ur: 'اہم گاؤٹ کی دوا', en: 'Main for gout' }, dose: '3 hourly' },
            { name: 'Benzoic Acid 30', use: { ur: 'یورک ایسڈ کم کرے', en: 'Reduces uric acid' }, dose: '3 times daily' },
            { name: 'Ledum Pal 30', use: { ur: 'انگوٹھے میں درد', en: 'Big toe pain' }, dose: '3 times daily' },
            { name: 'Urtica Urens Q', use: { ur: 'یورک ایسڈ', en: 'Uric acid' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'گوشت کم، پانی زیادہ، الکحل بند۔', en: 'Less meat, more water.' }
    },
    {
        id: 'back_pain',
        name: { ur: 'کمر درد', en: 'Back Pain', roman: 'Kamar Dard' },
        category: 'joints',
        symptoms: ['back_pain', 'lower_back_pain', 'joint_stiffness', 'muscle_weakness'],
        keySymptoms: ['back_pain'],
        tests: [
            { ur: 'X-Ray Spine', en: 'X-Ray Spine' },
            { ur: 'MRI اگر شدید', en: 'MRI if severe' }
        ],
        redFlags: ['urine_incontinence', 'muscle_weakness'],
        remedies: [
            { name: 'Rhus Tox 200', use: { ur: 'اکڑاؤ، حرکت سے آرام', en: 'Stiffness, better motion' }, dose: 'Twice daily' },
            { name: 'Bryonia 30', use: { ur: 'حرکت سے شدید', en: 'Severe on motion' }, dose: '3 times daily' },
            { name: 'Arnica 200', use: { ur: 'چوٹ سے', en: 'From injury' }, dose: '3 times' },
            { name: 'Hypericum 30', use: { ur: 'اعصابی درد', en: 'Nerve pain' }, dose: '3 times daily' }
        ],
        advice: { ur: 'صحیح posture، بھاری نہ اٹھائیں، ورزش۔', en: 'Good posture, exercise.' }
    },
    {
        id: 'cervical_spondylosis',
        name: { ur: 'گردن کا مہرہ', en: 'Cervical Spondylosis', roman: 'Cervical Spondylosis' },
        category: 'joints',
        symptoms: ['neck_pain', 'headache', 'numbness', 'tingling', 'muscle_weakness', 'dizziness'],
        keySymptoms: ['neck_pain'],
        tests: [
            { ur: 'X-Ray Cervical Spine', en: 'X-Ray C-Spine' },
            { ur: 'MRI Cervical', en: 'MRI C-Spine' }
        ],
        redFlags: ['muscle_weakness', 'urine_incontinence'],
        remedies: [
            { name: 'Rhus Tox 200', use: { ur: 'اکڑاؤ کے ساتھ', en: 'With stiffness' }, dose: 'Twice daily' },
            { name: 'Cimicifuga 30', use: { ur: 'گردن اور کندھے', en: 'Neck and shoulders' }, dose: '3 times daily' },
            { name: 'Guaiacum 30', use: { ur: 'اکڑاؤ', en: 'Stiffness' }, dose: '3 times daily' },
            { name: 'Hypericum 30', use: { ur: 'اعصابی درد', en: 'Nerve pain' }, dose: '3 times daily' }
        ],
        advice: { ur: 'صحیح posture، تکیہ، گردن ورزش۔', en: 'Posture, cervical pillow.' }
    },
    {
        id: 'frozen_shoulder',
        name: { ur: 'کندھا جم جانا', en: 'Frozen Shoulder', roman: 'Frozen Shoulder' },
        category: 'joints',
        symptoms: ['shoulder_pain', 'joint_stiffness', 'muscle_weakness'],
        keySymptoms: ['shoulder_pain', 'joint_stiffness'],
        tests: [
            { ur: 'X-Ray Shoulder', en: 'X-Ray Shoulder' },
            { ur: 'MRI Shoulder', en: 'MRI Shoulder' },
            { ur: 'Blood Sugar', en: 'Blood Sugar' }
        ],
        redFlags: [],
        remedies: [
            { name: 'Ferrum Met 30', use: { ur: 'دائیں کندھا', en: 'Right shoulder' }, dose: '3 times daily' },
            { name: 'Sanguinaria 30', use: { ur: 'دائیں کندھا، رات کو', en: 'Right, night' }, dose: '3 times daily' },
            { name: 'Rhus Tox 200', use: { ur: 'اکڑاؤ کے ساتھ', en: 'With stiffness' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'کندھے کی ورزش، فزیوتھراپی۔', en: 'Shoulder exercises, physio.' }
    },
    {
        id: 'osteoporosis',
        name: { ur: 'ہڈیوں کی کمزوری', en: 'Osteoporosis', roman: 'Osteoporosis' },
        category: 'joints',
        symptoms: ['back_pain', 'joint_pain', 'muscle_weakness'],
        keySymptoms: ['back_pain'],
        tests: [
            { ur: 'DEXA Scan (BMD)', en: 'DEXA Scan (BMD)' },
            { ur: 'Calcium, Vitamin D', en: 'Calcium, Vitamin D' },
            { ur: 'Alkaline Phosphatase', en: 'Alkaline Phosphatase' }
        ],
        redFlags: ['severe_pain'],
        remedies: [
            { name: 'Calcarea Phos 6X', use: { ur: 'اہم ہڈی کی', en: 'Main for bones' }, dose: '3 times daily' },
            { name: 'Calcarea Fluor 6X', use: { ur: 'ہڈی مضبوطی', en: 'Bone strength' }, dose: 'Daily' },
            { name: 'Symphytum 200', use: { ur: 'فریکچر ٹھیک', en: 'Fracture healing' }, dose: 'Twice daily' },
            { name: 'Silicea 6X', use: { ur: 'کمزور ہڈی', en: 'Weak bones' }, dose: 'Daily' }
        ],
        advice: { ur: 'کیلشیم، وٹامن ڈی، ورزش، دھوپ۔', en: 'Calcium, Vit D, exercise.' }
    },
    {
        id: 'tennis_elbow',
        name: { ur: 'کہنی کا درد', en: 'Tennis Elbow', roman: 'Tennis Elbow' },
        category: 'joints',
        symptoms: ['elbow_pain', 'wrist_pain', 'muscle_weakness'],
        keySymptoms: ['elbow_pain'],
        tests: [
            { ur: 'Physical examination', en: 'Physical exam' },
            { ur: 'MRI اگر ضروری', en: 'MRI if needed' }
        ],
        redFlags: [],
        remedies: [
            { name: 'Ruta 200', use: { ur: 'اہم کہنی کی', en: 'Main for elbow' }, dose: '3 times daily' },
            { name: 'Rhus Tox 30', use: { ur: 'حرکت سے آرام', en: 'Better motion' }, dose: '3 times daily' },
            { name: 'Bryonia 30', use: { ur: 'حرکت سے بڑھے', en: 'Worse motion' }, dose: '3 times daily' }
        ],
        advice: { ur: 'آرام، فزیوتھراپی، سپورٹ۔', en: 'Rest, physio, elbow support.' }
    },
    {
        id: 'plantar_fasciitis',
        name: { ur: 'ایڑی کا درد', en: 'Plantar Fasciitis', roman: 'Aidi ka Dard' },
        category: 'joints',
        symptoms: ['heel_pain', 'ankle_pain'],
        keySymptoms: ['heel_pain'],
        tests: [
            { ur: 'X-Ray Foot', en: 'X-Ray Foot' },
            { ur: 'Uric Acid', en: 'Uric Acid' }
        ],
        redFlags: [],
        remedies: [
            { name: 'Rhus Tox 200', use: { ur: 'اہم ایڑی کی', en: 'Main for heel' }, dose: 'Twice daily' },
            { name: 'Ammonium Mur 30', use: { ur: 'صبح کی سختی', en: 'Morning stiffness' }, dose: '3 times daily' },
            { name: 'Ledum Pal 30', use: { ur: 'اوپر کو جاتا درد', en: 'Ascending pain' }, dose: '3 times daily' },
            { name: 'Aranea Diadema 30', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'اچھے جوتے، وزن کم، ورزش۔', en: 'Good shoes, weight loss.' }
    },
    {
        id: 'fibromyalgia',
        name: { ur: 'پٹھوں کا دائمی درد', en: 'Fibromyalgia', roman: 'Fibromyalgia' },
        category: 'joints',
        symptoms: ['muscle_pain', 'muscle_weakness', 'fatigue', 'joint_stiffness', 'insomnia', 'depression', 'headache'],
        keySymptoms: ['muscle_pain', 'fatigue'],
        tests: [
            { ur: 'Clinical diagnosis', en: 'Clinical diagnosis' },
            { ur: 'CBC, CRP', en: 'CBC, CRP' },
            { ur: 'Thyroid', en: 'Thyroid tests' }
        ],
        redFlags: ['depression'],
        remedies: [
            { name: 'Rhus Tox 200', use: { ur: 'اکڑاؤ + درد', en: 'Stiffness + pain' }, dose: 'Twice daily' },
            { name: 'Arnica 200', use: { ur: 'پٹھوں کا درد', en: 'Muscle pain' }, dose: 'Twice daily' },
            { name: 'Kali Phos 6X', use: { ur: 'اعصابی ٹانک', en: 'Nerve tonic' }, dose: '3 times daily' },
            { name: 'Cimicifuga 30', use: { ur: 'ذہنی دباؤ', en: 'Mental stress' }, dose: '3 times daily' }
        ],
        advice: { ur: 'ورزش، ذہنی سکون، نیند پوری۔', en: 'Exercise, stress relief, sleep.' }
    },
    {
        id: 'muscle_spasm',
        name: { ur: 'پٹھوں میں اینٹھن', en: 'Muscle Spasm / Cramps', roman: 'Pathon mein Enthan' },
        category: 'joints',
        symptoms: ['muscle_cramps', 'muscle_pain', 'muscle_weakness'],
        keySymptoms: ['muscle_cramps'],
        tests: [
            { ur: 'Electrolytes', en: 'Electrolytes' },
            { ur: 'Calcium, Magnesium', en: 'Calcium, Magnesium' }
        ],
        redFlags: [],
        remedies: [
            { name: 'Magnesia Phos 6X', use: { ur: 'اہم اینٹھن کی', en: 'Main for cramps' }, dose: 'SOS' },
            { name: 'Cuprum Met 30', use: { ur: 'شدید اینٹھن', en: 'Severe cramps' }, dose: '3 hourly' },
            { name: 'Colocynth 30', use: { ur: 'گرمی سے آرام', en: 'Better from heat' }, dose: '3 hourly' }
        ],
        advice: { ur: 'پانی، الیکٹرولائٹس، مساج۔', en: 'Water, electrolytes, massage.' }
    },
    {
        id: 'ankylosing_spondylitis',
        name: { ur: 'ریڑھ کی اکڑن', en: 'Ankylosing Spondylitis', roman: 'AS' },
        category: 'joints',
        symptoms: ['back_pain', 'morning_stiffness', 'joint_pain', 'fatigue', 'weight_loss'],
        keySymptoms: ['back_pain', 'morning_stiffness'],
        tests: [
            { ur: 'HLA-B27', en: 'HLA-B27' },
            { ur: 'ESR, CRP', en: 'ESR, CRP' },
            { ur: 'X-Ray Sacroiliac', en: 'X-Ray Sacroiliac' },
            { ur: 'MRI Spine', en: 'MRI Spine' }
        ],
        redFlags: ['eye_pain', 'chest_pain'],
        remedies: [
            { name: 'Rhus Tox 1M', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Weekly' },
            { name: 'Cimicifuga 200', use: { ur: 'ریڑھ کی سختی', en: 'Spinal stiffness' }, dose: 'Twice daily' },
            { name: 'Kalmia 30', use: { ur: 'گردن سے نیچے درد', en: 'Pain from neck down' }, dose: '3 times daily' }
        ],
        advice: { ur: 'ورزش لازمی، فزیوتھراپی، سیدھی posture۔', en: 'Exercise essential, physio.' }
    },
    // ===== URINARY (10) =====
    {
        id: 'uti',
        name: { ur: 'پیشاب کی جلن (UTI)', en: 'Urinary Tract Infection', roman: 'UTI' },
        category: 'urinary',
        symptoms: ['burning_urine', 'frequent_urine', 'urgent_urine', 'stomach_pain', 'fever', 'cloudy_urine'],
        keySymptoms: ['burning_urine', 'frequent_urine'],
        tests: [
            { ur: 'Urine Routine', en: 'Urine R/E' },
            { ur: 'Urine Culture', en: 'Urine Culture' }
        ],
        redFlags: ['high_fever', 'blood_urine', 'kidney_pain'],
        remedies: [
            { name: 'Cantharis 30', use: { ur: 'شدید جلن', en: 'Severe burning' }, dose: '3 hourly' },
            { name: 'Apis Mellifica 30', use: { ur: 'آخری قطرے میں جلن', en: 'Burning at end' }, dose: '4 hourly' },
            { name: 'Sarsaparilla 30', use: { ur: 'شروع میں درد', en: 'Pain at start' }, dose: '3 times daily' },
            { name: 'Berberis Vulgaris Q', use: { ur: 'گردے کی طرف درد', en: 'Kidney pain' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'پانی زیادہ، صفائی، پیشاب روکیں نہیں۔', en: 'More water, hygiene.' }
    },
    {
        id: 'kidney_stones',
        name: { ur: 'گردے کی پتھری', en: 'Kidney Stones', roman: 'Guday ki Pathri' },
        category: 'urinary',
        symptoms: ['kidney_pain', 'lower_back_pain', 'blood_urine', 'burning_urine', 'nausea', 'vomiting'],
        keySymptoms: ['kidney_pain', 'blood_urine'],
        tests: [
            { ur: 'Ultrasound KUB', en: 'Ultrasound KUB' },
            { ur: 'CT KUB', en: 'CT KUB' },
            { ur: 'Urine Analysis', en: 'Urine Analysis' },
            { ur: 'Serum Creatinine', en: 'Serum Creatinine' }
        ],
        redFlags: ['high_fever', 'unconscious', 'severe_pain'],
        remedies: [
            { name: 'Berberis Vulgaris Q', use: { ur: 'اہم پتھری کی', en: 'Main for stones' }, dose: '10 drops thrice' },
            { name: 'Lycopodium 200', use: { ur: 'دائیں گردہ', en: 'Right kidney' }, dose: 'Weekly' },
            { name: 'Sarsaparilla 30', use: { ur: 'ریت والا پیشاب', en: 'Gravel in urine' }, dose: '3 times daily' },
            { name: 'Cantharis 30', use: { ur: 'شدید درد', en: 'Severe pain' }, dose: '2 hourly' },
            { name: 'Hydrangea Q', use: { ur: 'پتھری کی خاص', en: 'Stone dissolver' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'پانی 3-4 لیٹر، نمک کم، ٹماٹر/پالک کم۔', en: 'Water 3-4L daily.' }
    },
    {
        id: 'prostate_bph',
        name: { ur: 'مثانہ کی بیماری (پروسٹیٹ)', en: 'Prostate Enlargement (BPH)', roman: 'Prostate' },
        category: 'urinary',
        symptoms: ['difficulty_urine', 'frequent_urine', 'night_urine', 'urgent_urine', 'low_urine'],
        keySymptoms: ['difficulty_urine', 'frequent_urine'],
        tests: [
            { ur: 'PSA Test', en: 'PSA Test' },
            { ur: 'Ultrasound Prostate', en: 'Ultrasound Prostate' },
            { ur: 'Uroflowmetry', en: 'Uroflowmetry' },
            { ur: 'DRE', en: 'Digital Rectal Exam' }
        ],
        redFlags: ['blood_urine', 'weight_loss'],
        remedies: [
            { name: 'Sabal Serrulata Q', use: { ur: 'اہم دوا پروسٹیٹ', en: 'Main for prostate' }, dose: '10 drops thrice' },
            { name: 'Conium 200', use: { ur: 'بوڑھے مریض', en: 'Elderly patients' }, dose: 'Weekly' },
            { name: 'Chimaphila 30', use: { ur: 'پیشاب رکنا', en: 'Retention' }, dose: '3 times daily' },
            { name: 'Baryta Carb 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' }
        ],
        advice: { ur: 'شام کو پانی کم، ڈاکٹر سے۔', en: 'Less water at evening.' }
    },
    {
        id: 'nephritis',
        name: { ur: 'گردے کی سوزش', en: 'Nephritis', roman: 'Guday ki Sozish' },
        category: 'urinary',
        symptoms: ['kidney_pain', 'blood_urine', 'swelling_body', 'high_bp_symptom', 'low_urine', 'fever'],
        keySymptoms: ['blood_urine', 'swelling_body'],
        tests: [
            { ur: 'Urine R/E (Protein)', en: 'Urine R/E' },
            { ur: 'Serum Creatinine, BUN', en: 'Creatinine, BUN' },
            { ur: 'Kidney Biopsy', en: 'Kidney Biopsy' }
        ],
        redFlags: ['unconscious', 'high_bp_symptom', 'swelling_body'],
        remedies: [
            { name: 'Apis Mellifica 30', use: { ur: 'سوجن + کم پیشاب', en: 'Swelling + low urine' }, dose: '3 hourly' },
            { name: 'Terebinthina 30', use: { ur: 'خونی پیشاب', en: 'Bloody urine' }, dose: '3 times daily' },
            { name: 'Cantharis 30', use: { ur: 'جلن کے ساتھ', en: 'With burning' }, dose: '3 hourly' }
        ],
        advice: { ur: 'نمک بہت کم، پروٹین محدود، ڈاکٹر سے۔', en: 'Low salt, limited protein.' }
    },
    {
        id: 'enuresis',
        name: { ur: 'بستر گیلا کرنا', en: 'Bed Wetting (Enuresis)', roman: 'Bistar Geela' },
        category: 'pediatric',
        symptoms: ['bed_wetting', 'night_urine', 'urine_incontinence'],
        keySymptoms: ['bed_wetting'],
        tests: [
            { ur: 'Urine R/E', en: 'Urine R/E' },
            { ur: 'Ultrasound KUB', en: 'Ultrasound KUB' }
        ],
        redFlags: [],
        remedies: [
            { name: 'Causticum 200', use: { ur: 'اہم دوا بچوں کے', en: 'Main for children' }, dose: 'Twice daily' },
            { name: 'Kreosotum 30', use: { ur: 'گہری نیند', en: 'Deep sleep' }, dose: '3 times daily' },
            { name: 'Equisetum 30', use: { ur: 'خواب میں پیشاب', en: 'Urinating in dream' }, dose: 'Twice daily' },
            { name: 'Sepia 200', use: { ur: 'پہلی نیند میں', en: 'First sleep' }, dose: 'Weekly' }
        ],
        advice: { ur: 'رات کو مائع کم، سونے سے پہلے پیشاب۔', en: 'Less fluids at night.' }
    },
    {
        id: 'cystitis',
        name: { ur: 'مثانے کی سوزش', en: 'Cystitis', roman: 'Cystitis' },
        category: 'urinary',
        symptoms: ['burning_urine', 'frequent_urine', 'urgent_urine', 'lower_abdomen_pain', 'cloudy_urine'],
        keySymptoms: ['burning_urine', 'frequent_urine'],
        tests: [
            { ur: 'Urine R/E', en: 'Urine R/E' },
            { ur: 'Urine Culture', en: 'Urine Culture' }
        ],
        redFlags: ['high_fever', 'blood_urine', 'kidney_pain'],
        remedies: [
            { name: 'Cantharis 30', use: { ur: 'شدید جلن', en: 'Severe burning' }, dose: '2 hourly' },
            { name: 'Staphysagria 30', use: { ur: 'شادی کے بعد', en: 'Honeymoon cystitis' }, dose: '3 times daily' },
            { name: 'Equisetum 30', use: { ur: 'مسلسل بھرا احساس', en: 'Constant fullness' }, dose: '3 times daily' }
        ],
        advice: { ur: 'پانی زیادہ، صفائی۔', en: 'More water, hygiene.' }
    },
    {
        id: 'renal_colic',
        name: { ur: 'گردے کا شدید درد', en: 'Renal Colic', roman: 'Guday ka Dard' },
        category: 'urinary',
        symptoms: ['kidney_pain', 'lower_back_pain', 'blood_urine', 'nausea', 'vomiting', 'cramping_pain'],
        keySymptoms: ['kidney_pain'],
        tests: [
            { ur: 'Ultrasound KUB', en: 'Ultrasound KUB' },
            { ur: 'CT KUB', en: 'CT KUB' }
        ],
        redFlags: ['unconscious', 'high_fever', 'severe_pain'],
        remedies: [
            { name: 'Berberis Vulgaris Q', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '10 drops SOS' },
            { name: 'Colocynth 200', use: { ur: 'شدید درد', en: 'Severe pain' }, dose: 'SOS' },
            { name: 'Magnesia Phos 6X', use: { ur: 'اینٹھن کے ساتھ', en: 'With cramps' }, dose: 'SOS' }
        ],
        advice: { ur: '⚠️ فوری ڈاکٹر، پانی زیادہ۔', en: 'Urgent doctor, more water.' }
    },
    {
        id: 'proteinuria',
        name: { ur: 'پیشاب میں پروٹین', en: 'Proteinuria', roman: 'Proteinuria' },
        category: 'urinary',
        symptoms: ['cloudy_urine', 'swelling_body', 'weakness', 'fatigue'],
        keySymptoms: ['cloudy_urine'],
        tests: [
            { ur: '24-hr Urine Protein', en: '24-hr Urine Protein' },
            { ur: 'Serum Albumin', en: 'Serum Albumin' },
            { ur: 'Kidney Function Tests', en: 'KFT' }
        ],
        redFlags: ['swelling_body', 'blood_urine'],
        remedies: [
            { name: 'Apis Mellifica 30', use: { ur: 'سوجن کے ساتھ', en: 'With swelling' }, dose: '3 times daily' },
            { name: 'Arsenic Album 30', use: { ur: 'کمزوری', en: 'Weakness' }, dose: 'Twice daily' },
            { name: 'Terebinthina 30', use: { ur: 'خون کے ساتھ', en: 'With blood' }, dose: '3 times daily' }
        ],
        advice: { ur: 'نمک کم، پروٹین محدود۔', en: 'Low salt, limited protein.' }
    },
    {
        id: 'hydrocele',
        name: { ur: 'کیسہ (ہائیڈروسیل)', en: 'Hydrocele', roman: 'Hydrocele' },
        category: 'urinary',
        symptoms: ['swelling_body', 'lower_abdomen_pain'],
        keySymptoms: ['swelling_body'],
        tests: [
            { ur: 'Ultrasound Scrotum', en: 'Ultrasound Scrotum' }
        ],
        redFlags: ['severe_pain'],
        remedies: [
            { name: 'Rhododendron 30', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Twice daily' },
            { name: 'Pulsatilla 30', use: { ur: 'بچوں میں', en: 'In children' }, dose: '3 times daily' },
            { name: 'Silicea 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' }
        ],
        advice: { ur: 'ڈاکٹر سے، سرجری اگر ضروری۔', en: 'Doctor visit, surgery if needed.' }
    },
    {
        id: 'urethritis',
        name: { ur: 'یوریتھرا کی سوزش', en: 'Urethritis', roman: 'Urethritis' },
        category: 'urinary',
        symptoms: ['burning_urine', 'difficulty_urine', 'frequent_urine', 'pus_discharge'],
        keySymptoms: ['burning_urine', 'pus_discharge'],
        tests: [
            { ur: 'Urine Culture', en: 'Urine Culture' },
            { ur: 'STD Panel', en: 'STD Panel' }
        ],
        redFlags: ['high_fever', 'kidney_pain'],
        remedies: [
            { name: 'Cannabis Sat 30', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '3 times daily' },
            { name: 'Petroselinum 30', use: { ur: 'اچانک شدید خواہش', en: 'Sudden urgency' }, dose: '3 times daily' },
            { name: 'Thuja 30', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'صفائی، پانی زیادہ، سیفٹی۔', en: 'Hygiene, water, safety.' }
    },
    
    // ===== HEART/CIRCULATION (8) =====
    {
        id: 'hypertension',
        name: { ur: 'بلڈ پریشر (ہائی)', en: 'Hypertension', roman: 'High BP' },
        category: 'chronic',
        symptoms: ['headache', 'dizziness', 'chest_pain', 'palpitations', 'high_bp_symptom'],
        keySymptoms: ['headache', 'high_bp_symptom'],
        tests: [
            { ur: 'BP monitoring', en: 'BP monitoring' },
            { ur: 'ECG', en: 'ECG' },
            { ur: 'Lipid Profile', en: 'Lipid Profile' },
            { ur: 'Kidney Function', en: 'KFT' },
            { ur: 'Fundoscopy', en: 'Fundoscopy' }
        ],
        redFlags: ['unconscious', 'chest_pain', 'breathing_difficulty', 'speech_difficulty'],
        remedies: [
            { name: 'Rauwolfia Q', use: { ur: 'ہائی BP کا اہم', en: 'Main for high BP' }, dose: '10 drops thrice' },
            { name: 'Natrum Mur 200', use: { ur: 'نمک زیادہ سے', en: 'From high salt' }, dose: 'Weekly' },
            { name: 'Belladonna 30', use: { ur: 'دھڑکن، سرخ چہرہ', en: 'Throbbing, red face' }, dose: 'SOS' },
            { name: 'Aurum Met 30', use: { ur: 'ذہنی دباؤ سے', en: 'From mental stress' }, dose: 'Daily' },
            { name: 'Crataegus Q', use: { ur: 'دل کا ٹانک', en: 'Heart tonic' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'نمک کم، وزن کم، ورزش، BP روزانہ چیک۔', en: 'Less salt, exercise.' }
    },
    {
        id: 'hypotension',
        name: { ur: 'لو بلڈ پریشر', en: 'Hypotension', roman: 'Low BP' },
        category: 'chronic',
        symptoms: ['dizziness', 'weakness', 'fatigue', 'low_bp_symptom', 'cold_hands_feet', 'blurred_vision'],
        keySymptoms: ['low_bp_symptom', 'dizziness'],
        tests: [
            { ur: 'BP monitoring', en: 'BP monitoring' },
            { ur: 'ECG', en: 'ECG' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['unconscious', 'chest_pain'],
        remedies: [
            { name: 'Gelsemium 30', use: { ur: 'کمزوری + چکر', en: 'Weakness + dizziness' }, dose: '3 times daily' },
            { name: 'Natrum Mur 30', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Twice daily' },
            { name: 'China Off 30', use: { ur: 'کمزوری', en: 'Weakness' }, dose: '3 times daily' },
            { name: 'Carbo Veg 30', use: { ur: 'ٹھنڈے ہاتھ پاؤں', en: 'Cold hands feet' }, dose: '3 times daily' }
        ],
        advice: { ur: 'نمک تھوڑا زیادہ، پانی، آہستہ اٹھیں۔', en: 'Adequate salt, water.' }
    },
    {
        id: 'angina',
        name: { ur: 'دل کا درد (انجائنا)', en: 'Angina', roman: 'Angina' },
        category: 'chronic',
        symptoms: ['chest_pain', 'chest_tightness', 'shortness_breath', 'palpitations', 'sweating'],
        keySymptoms: ['chest_pain', 'chest_tightness'],
        tests: [
            { ur: 'ECG', en: 'ECG' },
            { ur: 'Echo', en: 'Echo' },
            { ur: 'ETT (Stress Test)', en: 'ETT' },
            { ur: 'Angiography', en: 'Angiography' }
        ],
        redFlags: ['chest_pain', 'unconscious', 'breathing_difficulty'],
        remedies: [
            { name: 'Cactus Grand Q', use: { ur: 'دل جکڑنے کا احساس', en: 'Chest constriction' }, dose: '10 drops SOS' },
            { name: 'Latrodectus Mac 30', use: { ur: 'شدید سینے کا درد', en: 'Severe chest pain' }, dose: 'SOS' },
            { name: 'Crataegus Q', use: { ur: 'دل کا ٹانک', en: 'Heart tonic' }, dose: '10 drops thrice' }
        ],
        advice: { ur: '⚠️ فوری ڈاکٹر! سرد ماحول سے پرہیز۔', en: '⚠️ Urgent doctor!' }
    },
    {
        id: 'palpitations',
        name: { ur: 'دل کی دھڑکن تیز', en: 'Palpitations', roman: 'Palpitations' },
        category: 'chronic',
        symptoms: ['palpitations', 'anxiety', 'chest_pain', 'dizziness', 'irregular_heartbeat'],
        keySymptoms: ['palpitations'],
        tests: [
            { ur: 'ECG', en: 'ECG' },
            { ur: 'Holter Monitor', en: 'Holter Monitor' },
            { ur: 'Thyroid', en: 'Thyroid tests' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['chest_pain', 'unconscious', 'breathing_difficulty'],
        remedies: [
            { name: 'Aconite 200', use: { ur: 'اچانک، خوف سے', en: 'Sudden, from fear' }, dose: 'SOS' },
            { name: 'Digitalis 30', use: { ur: 'سست دھڑکن', en: 'Slow heartbeat' }, dose: '3 times daily' },
            { name: 'Crataegus Q', use: { ur: 'دل کا ٹانک', en: 'Heart tonic' }, dose: '10 drops thrice' },
            { name: 'Kali Phos 6X', use: { ur: 'اعصابی سے', en: 'Nervous origin' }, dose: '3 times daily' }
        ],
        advice: { ur: 'کیفین کم، ذہنی سکون، ورزش۔', en: 'Less caffeine, relaxation.' }
    },
    {
        id: 'anemia',
        name: { ur: 'خون کی کمی', en: 'Anemia', roman: 'Khoon ki Kami' },
        category: 'chronic',
        symptoms: ['weakness', 'fatigue', 'pale_skin', 'dizziness', 'palpitations', 'shortness_breath', 'hair_loss'],
        keySymptoms: ['weakness', 'pale_skin', 'fatigue'],
        tests: [
            { ur: 'CBC with Peripheral Smear', en: 'CBC with PS' },
            { ur: 'Iron Studies', en: 'Iron Studies' },
            { ur: 'Ferritin', en: 'Ferritin' },
            { ur: 'Vitamin B12, Folate', en: 'B12, Folate' }
        ],
        redFlags: ['unconscious', 'chest_pain', 'breathing_difficulty'],
        remedies: [
            { name: 'Ferrum Phos 6X', use: { ur: 'اہم خون کی کمی', en: 'Main for anemia' }, dose: '3 times daily' },
            { name: 'Ferrum Met 30', use: { ur: 'زرد چہرہ', en: 'Pale face' }, dose: 'Twice daily' },
            { name: 'China Off 200', use: { ur: 'خون بہنے سے', en: 'From blood loss' }, dose: 'Weekly' },
            { name: 'Natrum Mur 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' },
            { name: 'Alfalfa Q', use: { ur: 'عمومی ٹانک', en: 'General tonic' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'آئرن والی غذا، پالک، انڈا، گوشت، آنولہ۔', en: 'Iron-rich food, spinach.' }
    },
    {
        id: 'varicose_veins',
        name: { ur: 'نیلی رگیں', en: 'Varicose Veins', roman: 'Neeli Ragein' },
        category: 'chronic',
        symptoms: ['varicose_veins', 'leg_pain_walking', 'swelling_feet', 'joint_pain'],
        keySymptoms: ['varicose_veins'],
        tests: [
            { ur: 'Doppler Ultrasound', en: 'Doppler Ultrasound' }
        ],
        redFlags: ['bleeding', 'severe_pain'],
        remedies: [
            { name: 'Hamamelis Q', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '10 drops thrice' },
            { name: 'Calcarea Fluor 6X', use: { ur: 'رگ کی مضبوطی', en: 'Vein strength' }, dose: 'Daily' },
            { name: 'Pulsatilla 30', use: { ur: 'خواتین میں', en: 'In women' }, dose: 'Twice daily' },
            { name: 'Fluoric Acid 30', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'کھڑے نہ رہیں، ٹانگیں اونچی، سٹاکنگز۔', en: 'Elevate legs, stockings.' }
    },
    {
        id: 'heart_failure',
        name: { ur: 'دل کی کمزوری', en: 'Heart Failure', roman: 'Dil ki Kamzori' },
        category: 'chronic',
        symptoms: ['breathing_difficulty', 'swelling_feet', 'fatigue', 'palpitations', 'cough_dry', 'weight_gain'],
        keySymptoms: ['breathing_difficulty', 'swelling_feet'],
        tests: [
            { ur: 'Echo', en: 'Echo' },
            { ur: 'ECG', en: 'ECG' },
            { ur: 'BNP/NT-proBNP', en: 'BNP/NT-proBNP' },
            { ur: 'Chest X-Ray', en: 'Chest X-Ray' }
        ],
        redFlags: ['breathing_difficulty', 'chest_pain', 'unconscious'],
        remedies: [
            { name: 'Digitalis 30', use: { ur: 'سست دھڑکن', en: 'Slow pulse' }, dose: '3 times daily' },
            { name: 'Crataegus Q', use: { ur: 'دل کا ٹانک', en: 'Heart tonic' }, dose: '10 drops thrice' },
            { name: 'Apis Mellifica 30', use: { ur: 'سوجن کے ساتھ', en: 'With edema' }, dose: '3 times daily' },
            { name: 'Adonis Vernalis Q', use: { ur: 'کمزور دل', en: 'Weak heart' }, dose: '5 drops thrice' }
        ],
        advice: { ur: 'نمک کم، پانی محدود، ڈاکٹر سے، آرام۔', en: 'Low salt, limited fluids.' }
    },
    {
        id: 'cholesterol',
        name: { ur: 'کولیسٹرول زیادہ', en: 'High Cholesterol', roman: 'Cholesterol' },
        category: 'chronic',
        symptoms: ['weight_gain', 'fatigue', 'chest_pain'],
        keySymptoms: ['weight_gain'],
        tests: [
            { ur: 'Lipid Profile', en: 'Lipid Profile' },
            { ur: 'LFTs', en: 'LFTs' },
            { ur: 'Blood Sugar', en: 'Blood Sugar' }
        ],
        redFlags: ['chest_pain'],
        remedies: [
            { name: 'Allium Sativum Q', use: { ur: 'کولیسٹرول کم کرے', en: 'Lowers cholesterol' }, dose: '10 drops thrice' },
            { name: 'Aurum Met 30', use: { ur: 'دل کی حفاظت', en: 'Heart protection' }, dose: 'Weekly' },
            { name: 'Chelidonium 30', use: { ur: 'جگر متاثر', en: 'Liver affected' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'تلی چیزیں کم، ورزش، وزن کم۔', en: 'Less oil, exercise.' }
    },
    
    // ===== MENTAL HEALTH (10) =====
    {
        id: 'insomnia',
        name: { ur: 'نیند کی کمی', en: 'Insomnia', roman: 'Neend ki Kami' },
        category: 'mental',
        symptoms: ['insomnia', 'anxiety', 'fatigue', 'irritability'],
        keySymptoms: ['insomnia'],
        tests: [
            { ur: 'Thyroid', en: 'Thyroid' },
            { ur: 'Sleep Study', en: 'Sleep Study' }
        ],
        redFlags: ['depression', 'suicidal_thoughts'],
        remedies: [
            { name: 'Coffea Cruda 30', use: { ur: 'زیادہ سوچنے سے', en: 'From overthinking' }, dose: 'At bedtime' },
            { name: 'Passiflora Q', use: { ur: 'عمومی نیند کی کمی', en: 'General insomnia' }, dose: '20 drops at bed' },
            { name: 'Kali Phos 6X', use: { ur: 'ذہنی تھکاوٹ', en: 'Mental fatigue' }, dose: 'Twice daily' },
            { name: 'Nux Vomica 30', use: { ur: 'صبح 3 بجے جاگنا', en: '3 AM waking' }, dose: 'Bedtime' }
        ],
        advice: { ur: 'موبائل سے دور، مقررہ وقت، ہلکی خوراک۔', en: 'Avoid mobile, fixed time.' }
    },
    {
        id: 'anxiety',
        name: { ur: 'گھبراہٹ / پریشانی', en: 'Anxiety', roman: 'Ghabrahat' },
        category: 'mental',
        symptoms: ['anxiety', 'insomnia', 'headache', 'chest_pain', 'palpitations', 'restlessness'],
        keySymptoms: ['anxiety'],
        tests: [
            { ur: 'Thyroid', en: 'Thyroid' },
            { ur: 'ECG اگر chest pain', en: 'ECG if chest pain' }
        ],
        redFlags: ['depression', 'chest_pain', 'suicidal_thoughts'],
        remedies: [
            { name: 'Aconite 200', use: { ur: 'اچانک حملہ', en: 'Sudden attack' }, dose: 'SOS' },
            { name: 'Arsenic Album 30', use: { ur: 'موت کا خوف', en: 'Fear of death' }, dose: '3 times daily' },
            { name: 'Gelsemium 30', use: { ur: 'امتحان/انٹرویو کا خوف', en: 'Exam fear' }, dose: 'Before event' },
            { name: 'Ignatia 200', use: { ur: 'غم سے', en: 'From grief' }, dose: 'Daily' }
        ],
        advice: { ur: 'دعا، ورزش، سانس کی مشقیں، مشاورت۔', en: 'Prayer, exercise, counseling.' }
    },
    {
        id: 'depression',
        name: { ur: 'اداسی / ڈپریشن', en: 'Depression', roman: 'Depression' },
        category: 'mental',
        symptoms: ['depression', 'hopelessness', 'insomnia', 'loss_appetite', 'weakness', 'crying_spells', 'lack_concentration'],
        keySymptoms: ['depression', 'hopelessness'],
        tests: [
            { ur: 'Thyroid', en: 'Thyroid tests' },
            { ur: 'Vitamin D, B12', en: 'Vitamin D, B12' },
            { ur: 'Clinical assessment', en: 'PHQ-9 assessment' }
        ],
        redFlags: ['suicidal_thoughts'],
        remedies: [
            { name: 'Ignatia 200', use: { ur: 'غم/صدمے سے', en: 'From grief' }, dose: 'Daily' },
            { name: 'Natrum Mur 200', use: { ur: 'خاموش غم', en: 'Silent grief' }, dose: 'Weekly' },
            { name: 'Aurum Met 200', use: { ur: 'شدید ڈپریشن', en: 'Severe depression' }, dose: 'Weekly' },
            { name: 'Sepia 200', use: { ur: 'عورتوں میں', en: 'In women' }, dose: 'Weekly' },
            { name: 'Kali Phos 6X', use: { ur: 'ذہنی تھکاوٹ', en: 'Mental fatigue' }, dose: '3 times daily' }
        ],
        advice: { ur: 'دعا، ورزش، دھوپ، مشاورت، ڈاکٹر سے۔', en: 'Prayer, exercise, counseling.' }
    },
    {
        id: 'panic_attacks',
        name: { ur: 'پینک اٹیک', en: 'Panic Attacks', roman: 'Panic Attacks' },
        category: 'mental',
        symptoms: ['panic', 'anxiety', 'palpitations', 'shortness_breath', 'chest_pain', 'dizziness', 'sweating'],
        keySymptoms: ['panic', 'palpitations'],
        tests: [
            { ur: 'ECG', en: 'ECG' },
            { ur: 'Thyroid', en: 'Thyroid' }
        ],
        redFlags: ['chest_pain', 'unconscious'],
        remedies: [
            { name: 'Aconite 1M', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'SOS' },
            { name: 'Arsenic Album 200', use: { ur: 'موت کا خوف', en: 'Fear of death' }, dose: 'SOS' },
            { name: 'Kali Phos 6X', use: { ur: 'اعصابی سکون', en: 'Nervous calming' }, dose: '3 times daily' }
        ],
        advice: { ur: 'سانس کی مشقیں، مشاورت۔', en: 'Breathing exercises, counseling.' }
    },
    {
        id: 'ocd',
        name: { ur: 'وہمی سوچ', en: 'OCD', roman: 'OCD' },
        category: 'mental',
        symptoms: ['obsessive_thoughts', 'anxiety', 'restlessness'],
        keySymptoms: ['obsessive_thoughts'],
        tests: [{ ur: 'Clinical diagnosis', en: 'Clinical diagnosis' }],
        redFlags: ['depression', 'suicidal_thoughts'],
        remedies: [
            { name: 'Arsenic Album 200', use: { ur: 'صفائی کا وہم', en: 'Cleanliness OCD' }, dose: 'Weekly' },
            { name: 'Silicea 200', use: { ur: 'مسلسل خیالات', en: 'Persistent thoughts' }, dose: 'Weekly' },
            { name: 'Anacardium 200', use: { ur: 'شدید وہم', en: 'Severe OCD' }, dose: 'Weekly' }
        ],
        advice: { ur: 'مشاورت (CBT)، دوا، صبر۔', en: 'Therapy (CBT), medication.' }
    },
    {
        id: 'ptsd',
        name: { ur: 'صدمے کے بعد', en: 'PTSD', roman: 'PTSD' },
        category: 'mental',
        symptoms: ['anxiety', 'insomnia', 'fear', 'depression', 'irritability', 'palpitations'],
        keySymptoms: ['fear', 'anxiety'],
        tests: [{ ur: 'Clinical assessment', en: 'Clinical assessment' }],
        redFlags: ['depression', 'suicidal_thoughts'],
        remedies: [
            { name: 'Aconite 1M', use: { ur: 'اچانک صدمہ', en: 'Sudden trauma' }, dose: 'Weekly' },
            { name: 'Opium 200', use: { ur: 'خوف سے', en: 'From fright' }, dose: 'Weekly' },
            { name: 'Stramonium 200', use: { ur: 'رات کے ڈراؤنے خواب', en: 'Nightmares' }, dose: 'Weekly' }
        ],
        advice: { ur: 'مشاورت، خاندانی مدد، ذہنی سکون۔', en: 'Counseling, family support.' }
    },
    {
        id: 'adhd',
        name: { ur: 'بچوں میں توجہ کی کمی', en: 'ADHD', roman: 'ADHD' },
        category: 'pediatric',
        symptoms: ['lack_concentration', 'restlessness', 'irritability', 'insomnia'],
        keySymptoms: ['lack_concentration', 'restlessness'],
        tests: [
            { ur: 'Clinical assessment', en: 'Clinical assessment' },
            { ur: 'Thyroid', en: 'Thyroid' }
        ],
        redFlags: [],
        remedies: [
            { name: 'Tarentula Hisp 200', use: { ur: 'بہت زیادہ حرکت', en: 'Hyperactive' }, dose: 'Weekly' },
            { name: 'Stramonium 200', use: { ur: 'خوف + غصہ', en: 'Fear + anger' }, dose: 'Weekly' },
            { name: 'Cina 200', use: { ur: 'چڑچڑاپن', en: 'Irritability' }, dose: 'Weekly' },
            { name: 'Baryta Carb 30', use: { ur: 'ذہنی کمزوری', en: 'Mental weakness' }, dose: 'Daily' }
        ],
        advice: { ur: 'روٹین بنائیں، اسکرین کم، ورزش۔', en: 'Routine, less screen time.' }
    },
    {
        id: 'stress',
        name: { ur: 'ذہنی دباؤ', en: 'Stress', roman: 'Stress' },
        category: 'mental',
        symptoms: ['anxiety', 'headache', 'insomnia', 'fatigue', 'irritability', 'muscle_pain'],
        keySymptoms: ['anxiety', 'headache'],
        tests: [{ ur: 'Clinical', en: 'Clinical' }],
        redFlags: ['depression'],
        remedies: [
            { name: 'Nux Vomica 30', use: { ur: 'کام کا دباؤ', en: 'Work stress' }, dose: 'Twice daily' },
            { name: 'Kali Phos 6X', use: { ur: 'ذہنی تھکاوٹ', en: 'Mental fatigue' }, dose: '3 times daily' },
            { name: 'Ignatia 200', use: { ur: 'جذباتی دباؤ', en: 'Emotional stress' }, dose: 'Daily' }
        ],
        advice: { ur: 'ورزش، نیند، تفریح، ذہنی سکون۔', en: 'Exercise, sleep, hobbies.' }
    },
    {
        id: 'phobias',
        name: { ur: 'خاص خوف (فوبیا)', en: 'Phobias', roman: 'Phobias' },
        category: 'mental',
        symptoms: ['fear', 'anxiety', 'panic', 'palpitations'],
        keySymptoms: ['fear'],
        tests: [{ ur: 'Clinical assessment', en: 'Clinical assessment' }],
        redFlags: ['depression'],
        remedies: [
            { name: 'Aconite 200', use: { ur: 'موت کا خوف', en: 'Fear of death' }, dose: 'SOS' },
            { name: 'Argentum Nit 200', use: { ur: 'اونچائی کا خوف', en: 'Fear of heights' }, dose: 'Weekly' },
            { name: 'Stramonium 200', use: { ur: 'اندھیرے کا خوف', en: 'Fear of dark' }, dose: 'Weekly' },
            { name: 'Gelsemium 30', use: { ur: 'امتحان کا خوف', en: 'Exam fear' }, dose: 'Before event' }
        ],
        advice: { ur: 'آہستہ آہستہ مقابلہ، مشاورت۔', en: 'Gradual exposure, therapy.' }
    },
    {
        id: 'grief',
        name: { ur: 'غم', en: 'Grief', roman: 'Gham' },
        category: 'mental',
        symptoms: ['depression', 'crying_spells', 'insomnia', 'loss_appetite', 'weakness'],
        keySymptoms: ['crying_spells', 'depression'],
        tests: [{ ur: 'Clinical', en: 'Clinical' }],
        redFlags: ['suicidal_thoughts'],
        remedies: [
            { name: 'Ignatia 200', use: { ur: 'اہم دوا غم کی', en: 'Main for grief' }, dose: 'Daily' },
            { name: 'Natrum Mur 200', use: { ur: 'خاموش غم', en: 'Silent grief' }, dose: 'Weekly' },
            { name: 'Aurum Met 200', use: { ur: 'شدید غم', en: 'Severe grief' }, dose: 'Weekly' }
        ],
        advice: { ur: 'دعا، خاندان کے ساتھ وقت، صبر۔', en: 'Prayer, family time.' }
    },
    
    // ===== WOMEN'S HEALTH (12) =====
    {
        id: 'menstrual_pain',
        name: { ur: 'حیض کا درد', en: 'Menstrual Pain (Dysmenorrhea)', roman: 'Haiz ka Dard' },
        category: 'women',
        symptoms: ['stomach_pain', 'back_pain', 'headache', 'nausea', 'painful_periods', 'cramping_pain'],
        keySymptoms: ['painful_periods', 'stomach_pain'],
        tests: [{ ur: 'Ultrasound Pelvis', en: 'Ultrasound Pelvis' }],
        redFlags: ['heavy_periods', 'high_fever'],
        remedies: [
            { name: 'Magnesia Phos 6X', use: { ur: 'اینٹھن والا درد', en: 'Cramping pain' }, dose: 'SOS' },
            { name: 'Colocynth 30', use: { ur: 'دبانے سے آرام', en: 'Better from pressure' }, dose: '3 hourly' },
            { name: 'Pulsatilla 30', use: { ur: 'بے قاعدہ، رونا', en: 'Irregular, weepy' }, dose: 'Daily' },
            { name: 'Sepia 200', use: { ur: 'بھاری پن', en: 'Heaviness' }, dose: 'Weekly' }
        ],
        advice: { ur: 'گرم پانی کی بوتل، آرام، ہلکی خوراک۔', en: 'Hot water bottle, rest.' }
    },
    {
        id: 'pcos',
        name: { ur: 'PCOS', en: 'PCOS', roman: 'PCOS' },
        category: 'women',
        symptoms: ['irregular_periods', 'weight_gain', 'acne', 'hair_loss', 'missed_periods', 'excess_urine'],
        keySymptoms: ['irregular_periods', 'weight_gain'],
        tests: [
            { ur: 'Ultrasound Pelvis', en: 'Ultrasound Pelvis' },
            { ur: 'Hormones (LH, FSH, Testosterone)', en: 'Hormones' },
            { ur: 'Blood Sugar', en: 'Blood Sugar, HbA1c' },
            { ur: 'Thyroid', en: 'Thyroid' }
        ],
        redFlags: ['heavy_periods'],
        remedies: [
            { name: 'Pulsatilla 200', use: { ur: 'بے قاعدہ حیض', en: 'Irregular periods' }, dose: 'Weekly' },
            { name: 'Sepia 200', use: { ur: 'اہم دوا PCOS', en: 'Main for PCOS' }, dose: 'Weekly' },
            { name: 'Apis Mellifica 30', use: { ur: 'اووریوں پر سسٹ', en: 'Ovarian cysts' }, dose: '3 times daily' },
            { name: 'Thuja 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' }
        ],
        advice: { ur: 'وزن کم، ورزش، شوگر کم، ڈاکٹر سے۔', en: 'Weight loss, exercise.' }
    },
    {
        id: 'leucorrhea',
        name: { ur: 'لیکوریا (سفید پانی)', en: 'Leucorrhea', roman: 'Leucorrhea' },
        category: 'women',
        symptoms: ['white_discharge', 'yellow_discharge', 'vaginal_itching', 'weakness'],
        keySymptoms: ['white_discharge', 'yellow_discharge'],
        tests: [
            { ur: 'Vaginal Swab', en: 'Vaginal Swab' },
            { ur: 'Pap Smear', en: 'Pap Smear' }
        ],
        redFlags: ['high_fever', 'bleeding'],
        remedies: [
            { name: 'Pulsatilla 30', use: { ur: 'گاڑھا سفید', en: 'Thick white' }, dose: '3 times daily' },
            { name: 'Sepia 200', use: { ur: 'زرد رنگ + بو', en: 'Yellow + odor' }, dose: 'Weekly' },
            { name: 'Kreosotum 30', use: { ur: 'خارش کے ساتھ', en: 'With itching' }, dose: '3 times daily' },
            { name: 'Alumina 30', use: { ur: 'شفاف پانی', en: 'Clear watery' }, dose: '3 times daily' }
        ],
        advice: { ur: 'صفائی، سوتی کپڑا، ذہنی سکون۔', en: 'Hygiene, cotton clothes.' }
    },
    {
        id: 'menopause',
        name: { ur: 'سن یاس', en: 'Menopause', roman: 'Sinn e Yaas' },
        category: 'women',
        symptoms: ['hot_flashes', 'mood_swings', 'insomnia', 'irregular_periods', 'irritability', 'weight_gain'],
        keySymptoms: ['hot_flashes', 'mood_swings'],
        tests: [
            { ur: 'FSH, LH', en: 'FSH, LH' },
            { ur: 'Estrogen', en: 'Estrogen' },
            { ur: 'Thyroid', en: 'Thyroid' },
            { ur: 'DEXA Scan', en: 'DEXA Scan' }
        ],
        redFlags: ['heavy_periods'],
        remedies: [
            { name: 'Lachesis 200', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Weekly' },
            { name: 'Sepia 1M', use: { ur: 'اداسی + گرمی', en: 'Sadness + heat' }, dose: 'Monthly' },
            { name: 'Sanguinaria 30', use: { ur: 'شدید گرم لہریں', en: 'Severe hot flashes' }, dose: '3 times daily' },
            { name: 'Amyl Nit 30', use: { ur: 'گرم لہروں کی', en: 'For hot flashes' }, dose: 'SOS' }
        ],
        advice: { ur: 'ٹھنڈا ماحول، ورزش، کیلشیم، مشاورت۔', en: 'Cool environment, calcium.' }
    },
    {
        id: 'pms',
        name: { ur: 'حیض سے پہلے کی علامات', en: 'PMS', roman: 'PMS' },
        category: 'women',
        symptoms: ['mood_swings', 'stomach_pain', 'breast_pain', 'irritability', 'headache', 'bloating', 'crying_spells'],
        keySymptoms: ['mood_swings', 'breast_pain'],
        tests: [{ ur: 'Clinical', en: 'Clinical diagnosis' }],
        redFlags: ['heavy_periods'],
        remedies: [
            { name: 'Pulsatilla 200', use: { ur: 'رونا، مزاج بدلنا', en: 'Weepy, mood changes' }, dose: 'Weekly' },
            { name: 'Sepia 200', use: { ur: 'چڑچڑاپن', en: 'Irritability' }, dose: 'Weekly' },
            { name: 'Lachesis 30', use: { ur: 'حیض سے پہلے شدید', en: 'Severe pre-menstrual' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'کیفین کم، ورزش، نیند، ذہنی سکون۔', en: 'Less caffeine, exercise.' }
    },
    {
        id: 'endometriosis',
        name: { ur: 'اینڈومیٹریوسس', en: 'Endometriosis', roman: 'Endometriosis' },
        category: 'women',
        symptoms: ['painful_periods', 'stomach_pain', 'lower_abdomen_pain', 'heavy_periods', 'back_pain'],
        keySymptoms: ['painful_periods', 'lower_abdomen_pain'],
        tests: [
            { ur: 'Ultrasound Pelvis', en: 'Ultrasound Pelvis' },
            { ur: 'MRI Pelvis', en: 'MRI Pelvis' },
            { ur: 'Laparoscopy', en: 'Laparoscopy' }
        ],
        redFlags: ['heavy_periods', 'severe_pain'],
        remedies: [
            { name: 'Sabina 30', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '3 times daily' },
            { name: 'Magnesia Phos 6X', use: { ur: 'شدید اینٹھن', en: 'Severe cramps' }, dose: 'SOS' },
            { name: 'Sepia 200', use: { ur: 'بھاری پن', en: 'Heaviness' }, dose: 'Weekly' }
        ],
        advice: { ur: 'گرم سکائی، ذہنی سکون، ڈاکٹر سے۔', en: 'Heat therapy, consult doctor.' }
    },
    {
        id: 'fibroids',
        name: { ur: 'رحم میں گلٹی', en: 'Uterine Fibroids', roman: 'Rehm mein Gilti' },
        category: 'women',
        symptoms: ['heavy_periods', 'painful_periods', 'lower_abdomen_pain', 'back_pain', 'frequent_urine'],
        keySymptoms: ['heavy_periods'],
        tests: [
            { ur: 'Ultrasound Pelvis', en: 'Ultrasound Pelvis' },
            { ur: 'MRI Pelvis', en: 'MRI Pelvis' }
        ],
        redFlags: ['heavy_periods', 'severe_pain'],
        remedies: [
            { name: 'Thlaspi Bursa Q', use: { ur: 'زیادہ خون', en: 'Heavy bleeding' }, dose: '10 drops thrice' },
            { name: 'Fraxinus Americana Q', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '10 drops thrice' },
            { name: 'Aurum Muriaticum 30', use: { ur: 'گلٹی کم کرے', en: 'Reduces fibroid' }, dose: 'Daily' },
            { name: 'Calcarea Iodata 30', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'صحت مند خوراک، وزن کنٹرول، ڈاکٹر سے۔', en: 'Healthy diet, doctor follow-up.' }
    },
    {
        id: 'morning_sickness',
        name: { ur: 'حمل کی متلی', en: 'Morning Sickness', roman: 'Hamal ki Matli' },
        category: 'women',
        symptoms: ['nausea', 'vomiting', 'morning_sickness', 'weakness', 'loss_appetite'],
        keySymptoms: ['morning_sickness', 'nausea'],
        tests: [
            { ur: 'Urine Ketones', en: 'Urine Ketones' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['vomiting_blood', 'weight_loss', 'dehydration'],
        remedies: [
            { name: 'Ipecac 30', use: { ur: 'مسلسل متلی', en: 'Continuous nausea' }, dose: '3 hourly' },
            { name: 'Nux Vomica 30', use: { ur: 'صبح کی متلی', en: 'Morning nausea' }, dose: 'On waking' },
            { name: 'Sepia 30', use: { ur: 'خالی پیٹ متلی', en: 'Empty stomach nausea' }, dose: '3 times daily' },
            { name: 'Symphoricarpus 30', use: { ur: 'شدید حمل کی الٹی', en: 'Severe pregnancy vomiting' }, dose: '3 hourly' }
        ],
        advice: { ur: 'چھوٹے وقفے سے کھانا، ادرک، آرام۔', en: 'Small frequent meals, ginger.' }
    },
    {
        id: 'infertility',
        name: { ur: 'بانجھ پن', en: 'Infertility', roman: 'Banjhpan' },
        category: 'women',
        symptoms: ['irregular_periods', 'missed_periods', 'weight_gain', 'acne'],
        keySymptoms: ['irregular_periods'],
        tests: [
            { ur: 'Hormones Full Panel', en: 'Hormonal panel' },
            { ur: 'Ultrasound Pelvis', en: 'Ultrasound Pelvis' },
            { ur: 'HSG', en: 'HSG' },
            { ur: 'Semen Analysis (شوہر)', en: 'Semen Analysis (husband)' }
        ],
        redFlags: [],
        remedies: [
            { name: 'Sepia 1M', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Monthly' },
            { name: 'Pulsatilla 200', use: { ur: 'بے قاعدہ حیض', en: 'Irregular periods' }, dose: 'Weekly' },
            { name: 'Aurum Met 200', use: { ur: 'ذہنی دباؤ سے', en: 'From stress' }, dose: 'Weekly' },
            { name: 'Natrum Phos 6X', use: { ur: 'تیزابی مزاج', en: 'Acidic constitution' }, dose: '3 times daily' }
        ],
        advice: { ur: 'صبر، وزن مناسب، دباؤ کم، ماہر ڈاکٹر۔', en: 'Patience, weight, less stress.' }
    },
    {
        id: 'vaginal_infection',
        name: { ur: 'اندام نہانی کا انفیکشن', en: 'Vaginal Infection', roman: 'Andaam Nihani Infection' },
        category: 'women',
        symptoms: ['white_discharge', 'yellow_discharge', 'vaginal_itching', 'burning_urine'],
        keySymptoms: ['vaginal_itching', 'white_discharge'],
        tests: [
            { ur: 'Vaginal Swab', en: 'Vaginal Swab' },
            { ur: 'Culture', en: 'Culture' }
        ],
        redFlags: ['high_fever', 'bleeding'],
        remedies: [
            { name: 'Kreosotum 30', use: { ur: 'شدید خارش + بو', en: 'Severe itch + odor' }, dose: '3 times daily' },
            { name: 'Borax 30', use: { ur: 'انڈے کی سفیدی جیسا', en: 'Egg-white discharge' }, dose: '3 times daily' },
            { name: 'Sepia 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' },
            { name: 'Helonias 30', use: { ur: 'کمزوری', en: 'With weakness' }, dose: 'Daily' }
        ],
        advice: { ur: 'صفائی، سوتی کپڑے، antifungal۔', en: 'Hygiene, cotton clothing.' }
    },
    {
        id: 'breast_pain',
        name: { ur: 'چھاتی میں درد', en: 'Breast Pain (Mastalgia)', roman: 'Chhati Dard' },
        category: 'women',
        symptoms: ['breast_pain', 'breast_lump'],
        keySymptoms: ['breast_pain'],
        tests: [
            { ur: 'Ultrasound Breast', en: 'Ultrasound Breast' },
            { ur: 'Mammography (40+)', en: 'Mammography if >40' }
        ],
        redFlags: ['breast_lump', 'bleeding'],
        remedies: [
            { name: 'Conium 200', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Weekly' },
            { name: 'Phytolacca 30', use: { ur: 'گلٹی کے ساتھ', en: 'With lump' }, dose: '3 times daily' },
            { name: 'Bryonia 30', use: { ur: 'حرکت سے بڑھے', en: 'Worse motion' }, dose: '3 times daily' }
        ],
        advice: { ur: 'خود چیک، ڈاکٹر سے، ماہانہ چیک اپ۔', en: 'Self-exam, doctor visit.' }
    },
    {
        id: 'postpartum',
        name: { ur: 'زچگی کے بعد کی کمزوری', en: 'Postpartum Issues', roman: 'Zachgi ke baad' },
        category: 'women',
        symptoms: ['weakness', 'fatigue', 'depression', 'insomnia', 'hair_loss', 'weight_gain'],
        keySymptoms: ['weakness', 'fatigue'],
        tests: [
            { ur: 'CBC', en: 'CBC' },
            { ur: 'Thyroid', en: 'Thyroid' },
            { ur: 'Iron studies', en: 'Iron studies' }
        ],
        redFlags: ['depression', 'suicidal_thoughts', 'high_fever'],
        remedies: [
            { name: 'Sepia 200', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Weekly' },
            { name: 'China Off 30', use: { ur: 'خون کی کمی سے', en: 'From blood loss' }, dose: '3 times daily' },
            { name: 'Alfalfa Q', use: { ur: 'عمومی ٹانک', en: 'General tonic' }, dose: '10 drops thrice' },
            { name: 'Kali Phos 6X', use: { ur: 'اعصابی کمزوری', en: 'Nervous weakness' }, dose: '3 times daily' }
        ],
        advice: { ur: 'اچھی خوراک، آرام، خاندانی مدد، مشاورت۔', en: 'Good nutrition, rest, support.' }
    },
    
    // ===== PEDIATRIC (10) =====
    {
        id: 'teething',
        name: { ur: 'بچوں کے دانت نکلنا', en: 'Teething', roman: 'Daant Nikalna' },
        category: 'pediatric',
        symptoms: ['fever', 'diarrhea', 'itching', 'irritability', 'loss_appetite'],
        keySymptoms: ['fever', 'irritability'],
        tests: [{ ur: 'ضرورت نہیں', en: 'Not needed' }],
        redFlags: ['high_fever'],
        remedies: [
            { name: 'Chamomilla 30', use: { ur: 'اہم دوا - چڑچڑاپن', en: 'Main - irritability' }, dose: '3 hourly' },
            { name: 'Calcarea Phos 6X', use: { ur: 'دانت آسانی سے', en: 'Easy teething' }, dose: 'Daily' },
            { name: 'Belladonna 30', use: { ur: 'بخار + سرخ چہرہ', en: 'Fever + red face' }, dose: '4 hourly' }
        ],
        advice: { ur: 'ٹھنڈی چیز چبانے کو، صفائی۔', en: 'Cold teether, hygiene.' }
    },
    {
        id: 'colic_baby',
        name: { ur: 'بچوں کے پیٹ درد', en: 'Baby Colic', roman: 'Bacchon ka Pait Dard' },
        category: 'pediatric',
        symptoms: ['stomach_pain', 'crying_spells', 'irritability', 'gas', 'bloating'],
        keySymptoms: ['stomach_pain', 'crying_spells'],
        tests: [{ ur: 'Physical examination', en: 'Physical exam' }],
        redFlags: ['high_fever', 'vomiting', 'blood_stool'],
        remedies: [
            { name: 'Colocynth 30', use: { ur: 'دبانے سے آرام', en: 'Better from pressure' }, dose: 'SOS' },
            { name: 'Chamomilla 30', use: { ur: 'گود میں لینے سے آرام', en: 'Better carried' }, dose: '3 hourly' },
            { name: 'Magnesia Phos 6X', use: { ur: 'گرمی سے آرام', en: 'Better from heat' }, dose: 'SOS' },
            { name: 'Aethusa 30', use: { ur: 'دودھ نہ ہضم ہو', en: 'Milk intolerance' }, dose: '3 times daily' }
        ],
        advice: { ur: 'گرم پانی کی بوتل، پیٹ کی مساج، دودھ صحیح۔', en: 'Warm bottle, tummy massage.' }
    },
    {
        id: 'diaper_rash',
        name: { ur: 'ڈائپر ریش', en: 'Diaper Rash', roman: 'Diaper Rash' },
        category: 'pediatric',
        symptoms: ['rash', 'itching', 'burning_skin', 'irritability'],
        keySymptoms: ['rash', 'burning_skin'],
        tests: [{ ur: 'ضرورت نہیں', en: 'Not needed' }],
        redFlags: ['pus_discharge', 'high_fever'],
        remedies: [
            { name: 'Calendula Q', use: { ur: 'باہری استعمال', en: 'External use' }, dose: 'Apply local' },
            { name: 'Sulphur 30', use: { ur: 'خشک ریش', en: 'Dry rash' }, dose: '3 times daily' },
            { name: 'Merc Sol 30', use: { ur: 'گیلا ریش', en: 'Wet rash' }, dose: '3 times daily' }
        ],
        advice: { ur: 'ڈائپر جلدی بدلیں، ہوا لگائیں، صاف کریں۔', en: 'Change diaper often, air.' }
    },
    {
        id: 'growth_issues',
        name: { ur: 'بچوں کی نشوونما میں کمی', en: 'Growth Issues', roman: 'Nashonuma Issues' },
        category: 'pediatric',
        symptoms: ['weight_loss', 'weakness', 'fatigue', 'pale_skin', 'loss_appetite'],
        keySymptoms: ['weight_loss', 'weakness'],
        tests: [
            { ur: 'Growth Chart', en: 'Growth Chart' },
            { ur: 'CBC', en: 'CBC' },
            { ur: 'Thyroid', en: 'Thyroid' },
            { ur: 'Vitamin D, Calcium', en: 'Vitamin D, Calcium' },
            { ur: 'Growth Hormone', en: 'Growth Hormone' }
        ],
        redFlags: ['high_fever', 'jaundice'],
        remedies: [
            { name: 'Calcarea Phos 6X', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '3 times daily' },
            { name: 'Silicea 6X', use: { ur: 'کمزور بچے', en: 'Weak children' }, dose: 'Daily' },
            { name: 'Baryta Carb 30', use: { ur: 'ذہنی/جسمانی کمزوری', en: 'Mental/physical weakness' }, dose: 'Twice daily' },
            { name: 'Alfalfa Q', use: { ur: 'عمومی ٹانک', en: 'General tonic' }, dose: '5 drops thrice' }
        ],
        advice: { ur: 'اچھی خوراک، وٹامن، دودھ، ورزش۔', en: 'Good nutrition, vitamins.' }
    },
    {
        id: 'recurrent_tonsillitis',
        name: { ur: 'بچوں کے ٹانسلز', en: 'Recurrent Tonsillitis (Kids)', roman: 'Bacchon ke Tonsils' },
        category: 'pediatric',
        symptoms: ['sore_throat', 'difficulty_swallowing', 'fever', 'swollen_glands'],
        keySymptoms: ['sore_throat', 'swollen_glands'],
        tests: [
            { ur: 'Throat Culture', en: 'Throat Culture' },
            { ur: 'ASO Titer', en: 'ASO Titer' }
        ],
        redFlags: ['breathing_difficulty', 'high_fever'],
        remedies: [
            { name: 'Baryta Carb 200', use: { ur: 'اہم دوا بچوں کی', en: 'Main for children' }, dose: 'Weekly' },
            { name: 'Calcarea Iodata 30', use: { ur: 'بڑے ٹانسلز', en: 'Enlarged tonsils' }, dose: 'Daily' },
            { name: 'Tuberculinum 200', use: { ur: 'بار بار انفیکشن', en: 'Recurrent infections' }, dose: 'Monthly' }
        ],
        advice: { ur: 'ٹھنڈے سے پرہیز، صفائی۔', en: 'Avoid cold, hygiene.' }
    },
    {
        id: 'delayed_milestones',
        name: { ur: 'ذہنی/جسمانی تاخیر', en: 'Delayed Milestones', roman: 'Delayed Milestones' },
        category: 'pediatric',
        symptoms: ['muscle_weakness', 'weakness', 'lack_concentration'],
        keySymptoms: ['muscle_weakness'],
        tests: [
            { ur: 'Developmental Assessment', en: 'Developmental Assessment' },
            { ur: 'Thyroid', en: 'Thyroid' },
            { ur: 'MRI Brain اگر ضروری', en: 'MRI Brain if needed' }
        ],
        redFlags: ['seizure', 'unconscious'],
        remedies: [
            { name: 'Calcarea Phos 6X', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Daily' },
            { name: 'Baryta Carb 30', use: { ur: 'ذہنی تاخیر', en: 'Mental delay' }, dose: 'Twice daily' },
            { name: 'Silicea 6X', use: { ur: 'جسمانی کمزوری', en: 'Physical weakness' }, dose: 'Daily' }
        ],
        advice: { ur: 'فزیوتھراپی، اسپیچ تھراپی، ماہر ڈاکٹر۔', en: 'Physio, speech therapy.' }
    },
    {
        id: 'child_worms',
        name: { ur: 'بچوں میں کیڑے', en: 'Worms in Children', roman: 'Bacchon mein Keeray' },
        category: 'pediatric',
        symptoms: ['anal_itching', 'stomach_pain', 'worms_stool', 'irritability', 'loss_appetite', 'weight_loss'],
        keySymptoms: ['anal_itching', 'worms_stool'],
        tests: [
            { ur: 'Stool for Ova', en: 'Stool for Ova' },
            { ur: 'CBC', en: 'CBC' }
        ],
        redFlags: ['blood_stool', 'severe_pain'],
        remedies: [
            { name: 'Cina 200', use: { ur: 'اہم بچوں میں', en: 'Main for children' }, dose: 'Weekly' },
            { name: 'Teucrium 30', use: { ur: 'مقعد میں خارش', en: 'Anal itching' }, dose: '3 times daily' },
            { name: 'Santoninum 3X', use: { ur: 'گول کیڑے', en: 'Roundworms' }, dose: 'Daily' }
        ],
        advice: { ur: 'صفائی، ہاتھ دھوئیں، ناخن کاٹیں۔', en: 'Hygiene, wash hands.' }
    },
    {
        id: 'autism_awareness',
        name: { ur: 'آٹزم (خودپسندی)', en: 'Autism Awareness', roman: 'Autism' },
        category: 'pediatric',
        symptoms: ['speech_difficulty', 'lack_concentration', 'irritability'],
        keySymptoms: ['speech_difficulty'],
        tests: [
            { ur: 'Developmental Assessment', en: 'Developmental Assessment' },
            { ur: 'ADOS Test', en: 'ADOS Test' }
        ],
        redFlags: ['seizure', 'self-harm'],
        remedies: [
            { name: 'Baryta Carb 200', use: { ur: 'ذہنی کمزوری', en: 'Mental weakness' }, dose: 'Weekly' },
            { name: 'Carcinosin 200', use: { ur: 'خاندانی', en: 'Family history' }, dose: 'Monthly' },
            { name: 'Stramonium 200', use: { ur: 'خوف + غصہ', en: 'Fear + anger' }, dose: 'Weekly' }
        ],
        advice: { ur: 'اسپیچ تھراپی، خصوصی تعلیم، ماہر ڈاکٹر۔', en: 'Speech therapy, special education.' }
    },
    {
        id: 'recurrent_infections',
        name: { ur: 'بچوں میں بار بار انفیکشن', en: 'Recurrent Infections (Kids)', roman: 'Bar Bar Infection' },
        category: 'pediatric',
        symptoms: ['fever', 'weakness', 'runny_nose', 'cough_dry', 'loss_appetite'],
        keySymptoms: ['fever', 'weakness'],
        tests: [
            { ur: 'CBC', en: 'CBC' },
            { ur: 'Immunoglobulins', en: 'Immunoglobulins' },
            { ur: 'Vitamin D', en: 'Vitamin D' }
        ],
        redFlags: ['high_fever', 'weight_loss'],
        remedies: [
            { name: 'Tuberculinum 200', use: { ur: 'خاندانی TB', en: 'Family TB' }, dose: 'Monthly' },
            { name: 'Baryta Carb 30', use: { ur: 'کمزور مدافعت', en: 'Weak immunity' }, dose: 'Daily' },
            { name: 'Calcarea Phos 6X', use: { ur: 'عمومی کمزوری', en: 'General weakness' }, dose: '3 times daily' },
            { name: 'Silicea 6X', use: { ur: 'جسمانی کمزوری', en: 'Physical weakness' }, dose: 'Daily' }
        ],
        advice: { ur: 'اچھی خوراک، وٹامن، صفائی، ویکسین۔', en: 'Nutrition, vitamins, vaccination.' }
    },
    {
        id: 'child_asthma',
        name: { ur: 'بچوں میں دمہ', en: 'Childhood Asthma', roman: 'Bacchon mein Dama' },
        category: 'pediatric',
        symptoms: ['breathing_difficulty', 'wheezing', 'cough_dry', 'chest_tightness'],
        keySymptoms: ['breathing_difficulty', 'wheezing'],
        tests: [
            { ur: 'Spirometry', en: 'Spirometry' },
            { ur: 'Allergy Test', en: 'Allergy Test' },
            { ur: 'Chest X-Ray', en: 'Chest X-Ray' }
        ],
        redFlags: ['breathing_difficulty', 'unconscious'],
        remedies: [
            { name: 'Arsenic Album 200', use: { ur: 'رات کو حملہ', en: 'Night attack' }, dose: 'SOS' },
            { name: 'Natrum Sulph 30', use: { ur: 'بچوں میں دمہ', en: 'Childhood asthma' }, dose: '3 times daily' },
            { name: 'Sambucus 30', use: { ur: 'ناک بند + دمہ', en: 'Blocked nose + asthma' }, dose: '3 times daily' },
            { name: 'Blatta Orientalis Q', use: { ur: 'دائمی', en: 'Chronic' }, dose: '5 drops thrice' }
        ],
        advice: { ur: 'دھول سے بچیں، Inhaler، صاف ماحول۔', en: 'Avoid dust, clean environment.' }
    },
    
    // ===== EYE/ENT (10) =====
    {
        id: 'conjunctivitis',
        name: { ur: 'آنکھ آنا', en: 'Conjunctivitis', roman: 'Aankh Aana' },
        category: 'eyes',
        symptoms: ['red_eyes', 'eye_pain', 'itchy_eyes', 'watery_eyes', 'eye_discharge'],
        keySymptoms: ['red_eyes'],
        tests: [{ ur: 'ضرورت نہیں', en: 'Usually not needed' }],
        redFlags: ['high_fever', 'blurred_vision'],
        remedies: [
            { name: 'Euphrasia 30', use: { ur: 'آنکھ کا اہم علاج', en: 'Main eye remedy' }, dose: '3 times daily' },
            { name: 'Argentum Nit 30', use: { ur: 'پیپ، سوجن', en: 'Pus, swelling' }, dose: '4 hourly' },
            { name: 'Belladonna 30', use: { ur: 'شدید سرخی', en: 'Severe redness' }, dose: '3 hourly' }
        ],
        advice: { ur: 'صاف پانی سے دھوئیں، شیئر نہ کریں۔', en: "Clean water wash, don't share." }
    },
    {
        id: 'stye',
        name: { ur: 'گوہانجنی (آنکھ کا پھوڑا)', en: 'Stye', roman: 'Gohanjani' },
        category: 'eyes',
        symptoms: ['swollen_eyelid', 'eye_pain', 'red_eyes', 'boils'],
        keySymptoms: ['swollen_eyelid'],
        tests: [{ ur: 'ضرورت نہیں', en: 'Not needed' }],
        redFlags: ['high_fever', 'blurred_vision'],
        remedies: [
            { name: 'Pulsatilla 30', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '3 times daily' },
            { name: 'Staphysagria 30', use: { ur: 'بار بار', en: 'Recurrent' }, dose: 'Daily' },
            { name: 'Hepar Sulph 30', use: { ur: 'پیپ کے ساتھ', en: 'With pus' }, dose: '3 times daily' }
        ],
        advice: { ur: 'گرم سکائی، صفائی، رگڑیں نہیں۔', en: 'Warm compress, hygiene.' }
    },
    {
        id: 'glaucoma',
        name: { ur: 'کالا موتیا', en: 'Glaucoma', roman: 'Kala Motia' },
        category: 'eyes',
        symptoms: ['eye_pain', 'blurred_vision', 'headache', 'nausea'],
        keySymptoms: ['eye_pain', 'blurred_vision'],
        tests: [
            { ur: 'Tonometry (IOP)', en: 'Tonometry' },
            { ur: 'Fundoscopy', en: 'Fundoscopy' },
            { ur: 'Visual Field', en: 'Visual Field' }
        ],
        redFlags: ['blurred_vision', 'severe_pain'],
        remedies: [
            { name: 'Phosphorus 30', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Twice daily' },
            { name: 'Physostigma 30', use: { ur: 'خاص گلوکوما', en: 'Specific for glaucoma' }, dose: '3 times daily' },
            { name: 'Ruta 30', use: { ur: 'آنکھ پر دباؤ', en: 'Eye strain' }, dose: '3 times daily' }
        ],
        advice: { ur: 'آنکھ کا ماہر ضروری، دوا مستقل۔', en: 'Regular ophthalmologist.' }
    },
    {
        id: 'cataract',
        name: { ur: 'سفید موتیا', en: 'Cataract', roman: 'Safaid Motia' },
        category: 'eyes',
        symptoms: ['blurred_vision', 'dry_eyes'],
        keySymptoms: ['blurred_vision'],
        tests: [
            { ur: 'Eye examination', en: 'Eye examination' },
            { ur: 'Slit Lamp', en: 'Slit Lamp' }
        ],
        redFlags: ['blurred_vision'],
        remedies: [
            { name: 'Calcarea Fluor 6X', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '3 times daily' },
            { name: 'Silicea 200', use: { ur: 'ابتدائی', en: 'Early stage' }, dose: 'Weekly' },
            { name: 'Natrum Mur 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' },
            { name: 'Cineraria Q', use: { ur: 'آنکھ ڈراپس (external)', en: 'Eye drops external' }, dose: '2 drops twice' }
        ],
        advice: { ur: 'دھوپ سے حفاظت، سرجری اکثر لازمی۔', en: 'Sun protection, surgery often needed.' }
    },
    {
        id: 'dry_eyes',
        name: { ur: 'خشک آنکھیں', en: 'Dry Eyes', roman: 'Khushk Aankhein' },
        category: 'eyes',
        symptoms: ['dry_eyes', 'red_eyes', 'itchy_eyes', 'blurred_vision'],
        keySymptoms: ['dry_eyes'],
        tests: [
            { ur: "Schirmer's Test", en: "Schirmer's Test" }
        ],
        redFlags: ['severe_pain', 'blurred_vision'],
        remedies: [
            { name: 'Alumina 30', use: { ur: 'خشکی', en: 'Dryness' }, dose: '3 times daily' },
            { name: 'Zincum Met 30', use: { ur: 'جلن + خشکی', en: 'Burning + dryness' }, dose: '3 times daily' },
            { name: 'Natrum Mur 30', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Daily' }
        ],
        advice: { ur: 'آنکھوں کے قطرے، پانی زیادہ، سکرین بریک۔', en: 'Eye drops, water, screen breaks.' }
    },
    {
        id: 'tinnitus',
        name: { ur: 'کان میں گھنٹی بجنا', en: 'Tinnitus', roman: 'Kaan mein Ghanti' },
        category: 'eyes',
        symptoms: ['tinnitus', 'hearing_loss', 'dizziness'],
        keySymptoms: ['tinnitus'],
        tests: [
            { ur: 'Audiometry', en: 'Audiometry' },
            { ur: 'MRI اگر ضروری', en: 'MRI if needed' },
            { ur: 'BP check', en: 'BP check' }
        ],
        redFlags: ['vertigo', 'hearing_loss', 'facial_paralysis'],
        remedies: [
            { name: 'Chininum Sulph 30', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '3 times daily' },
            { name: 'Salicylic Acid 30', use: { ur: 'مسلسل آواز', en: 'Constant noise' }, dose: '3 times daily' },
            { name: 'Kali Iodatum 30', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'شور سے بچیں، ذہنی سکون، BP چیک۔', en: 'Avoid noise, stress management.' }
    },
    {
        id: 'nasal_polyps',
        name: { ur: 'ناک میں گوشت بڑھنا', en: 'Nasal Polyps', roman: 'Naak mein Gosht' },
        category: 'eyes',
        symptoms: ['blocked_nose', 'runny_nose', 'loss_smell', 'postnasal_drip', 'sneezing'],
        keySymptoms: ['blocked_nose', 'loss_smell'],
        tests: [
            { ur: 'Nasal Endoscopy', en: 'Nasal Endoscopy' },
            { ur: 'CT Sinuses', en: 'CT Sinuses' }
        ],
        redFlags: ['breathing_difficulty', 'bleeding'],
        remedies: [
            { name: 'Sanguinaria Nit 30', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '3 times daily' },
            { name: 'Teucrium 30', use: { ur: 'خاص نیزل پولپ', en: 'Specific for polyps' }, dose: '3 times daily' },
            { name: 'Calcarea Carb 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' },
            { name: 'Thuja 200', use: { ur: 'بار بار', en: 'Recurrent' }, dose: 'Weekly' }
        ],
        advice: { ur: 'الرجی سے بچیں، ماہر ڈاکٹر۔', en: 'Avoid allergens, specialist.' }
    },
    {
        id: 'deviated_septum',
        name: { ur: 'ناک کا مہرہ ٹیڑھا', en: 'Deviated Nasal Septum', roman: 'Naak ka Mehra' },
        category: 'eyes',
        symptoms: ['blocked_nose', 'breathing_difficulty', 'runny_nose', 'headache'],
        keySymptoms: ['blocked_nose', 'breathing_difficulty'],
        tests: [
            { ur: 'Nasal examination', en: 'Nasal examination' },
            { ur: 'CT Nose', en: 'CT Nose' }
        ],
        redFlags: ['bleeding'],
        remedies: [
            { name: 'Kali Bich 30', use: { ur: 'گاڑھا رساو', en: 'Thick discharge' }, dose: '3 times daily' },
            { name: 'Silicea 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' },
            { name: 'Calcarea Sulph 6X', use: { ur: 'زرد رساو', en: 'Yellow discharge' }, dose: '3 times daily' }
        ],
        advice: { ur: 'سرجری اگر شدید ہو، بھاپ۔', en: 'Surgery if severe.' }
    },
    {
        id: 'earwax',
        name: { ur: 'کان کا میل', en: 'Ear Wax Impaction', roman: 'Kaan ka Mel' },
        category: 'eyes',
        symptoms: ['ear_pain', 'hearing_loss', 'ear_itching', 'tinnitus'],
        keySymptoms: ['hearing_loss', 'ear_itching'],
        tests: [{ ur: 'Ear examination', en: 'Ear examination' }],
        redFlags: ['bleeding', 'severe_pain'],
        remedies: [
            { name: 'Causticum 30', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Twice daily' },
            { name: 'Silicea 30', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Daily' }
        ],
        advice: { ur: 'ڈاکٹر سے صفائی، کان میں چیزیں نہ ڈالیں۔', en: 'Doctor cleaning, no cotton buds.' }
    },
    {
        id: 'sinus_headache',
        name: { ur: 'سائنس درد', en: 'Sinus Headache', roman: 'Sinus Dard' },
        category: 'eyes',
        symptoms: ['forehead_pain', 'headache', 'blocked_nose', 'facial_paralysis', 'runny_nose'],
        keySymptoms: ['forehead_pain', 'headache'],
        tests: [
            { ur: 'X-Ray Sinuses', en: 'X-Ray Sinuses' },
            { ur: 'CT Sinuses', en: 'CT Sinuses' }
        ],
        redFlags: ['high_fever', 'facial_paralysis'],
        remedies: [
            { name: 'Kali Bich 30', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '3 times daily' },
            { name: 'Silicea 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' },
            { name: 'Hepar Sulph 30', use: { ur: 'پیپ کے ساتھ', en: 'With pus' }, dose: '3 times daily' }
        ],
        advice: { ur: 'بھاپ، الرجی سے بچیں، پانی زیادہ۔', en: 'Steam, hydration.' }
    },
    
    // ===== ENDOCRINE/METABOLIC (8) =====
    {
        id: 'diabetes',
        name: { ur: 'ذیابیطس (شوگر)', en: 'Diabetes Mellitus', roman: 'Sugar' },
        category: 'chronic',
        symptoms: ['frequent_urine', 'excessive_thirst', 'weight_loss', 'weakness', 'itching', 'blurred_vision', 'fatigue'],
        keySymptoms: ['frequent_urine', 'excessive_thirst'],
        tests: [
            { ur: 'Fasting Blood Sugar', en: 'FBS' },
            { ur: 'HbA1c', en: 'HbA1c' },
            { ur: 'Random Blood Sugar', en: 'RBS' },
            { ur: 'Urine for Sugar', en: 'Urine Sugar' },
            { ur: 'Lipid Profile', en: 'Lipid Profile' }
        ],
        redFlags: ['unconscious', 'breathing_difficulty', 'blurred_vision'],
        remedies: [
            { name: 'Syzygium Jambolanum Q', use: { ur: 'شوگر کا اہم', en: 'Main for diabetes' }, dose: '10-15 drops thrice' },
            { name: 'Gymnema Sylvestre Q', use: { ur: 'شوگر کم کرے', en: 'Reduces sugar' }, dose: '10 drops thrice' },
            { name: 'Uranium Nitricum 30', use: { ur: 'پیاس + بھوک', en: 'Excessive thirst + hunger' }, dose: 'Twice daily' },
            { name: 'Cephalandra Ind Q', use: { ur: 'مدد گار', en: 'Supportive' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'میٹھا بند، وزن کم، ورزش، روزانہ چیک۔', en: 'No sugar, exercise, daily check.' }
    },
    {
        id: 'hypothyroid',
        name: { ur: 'تھائیرائیڈ کم (ہائپو)', en: 'Hypothyroidism', roman: 'Hypothyroid' },
        category: 'chronic',
        symptoms: ['weight_gain', 'fatigue', 'cold_hands_feet', 'constipation', 'hair_loss', 'depression', 'dry_skin'],
        keySymptoms: ['weight_gain', 'fatigue'],
        tests: [
            { ur: 'TSH', en: 'TSH' },
            { ur: 'Free T3, T4', en: 'Free T3, T4' },
            { ur: 'Anti-TPO', en: 'Anti-TPO Ab' }
        ],
        redFlags: ['unconscious', 'severe_swelling'],
        remedies: [
            { name: 'Calcarea Carb 200', use: { ur: 'موٹے، سست', en: 'Obese, sluggish' }, dose: 'Weekly' },
            { name: 'Thyroidinum 3X', use: { ur: 'خاص دوا', en: 'Specific remedy' }, dose: 'Daily' },
            { name: 'Sepia 200', use: { ur: 'عورتوں میں', en: 'In women' }, dose: 'Weekly' },
            { name: 'Iodum 30', use: { ur: 'کمزوری', en: 'Weakness' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'آئوڈین، سیلینیم، ورزش، ڈاکٹر کے ساتھ۔', en: 'Iodine, selenium, exercise.' }
    },
    {
        id: 'hyperthyroid',
        name: { ur: 'تھائیرائیڈ زیادہ (ہائپر)', en: 'Hyperthyroidism', roman: 'Hyperthyroid' },
        category: 'chronic',
        symptoms: ['weight_loss', 'palpitations', 'irritability', 'sweating', 'tremors', 'insomnia', 'excessive_thirst'],
        keySymptoms: ['weight_loss', 'palpitations'],
        tests: [
            { ur: 'TSH', en: 'TSH' },
            { ur: 'Free T3, T4', en: 'Free T3, T4' },
            { ur: 'Thyroid Antibodies', en: 'Thyroid Antibodies' },
            { ur: 'Thyroid Scan', en: 'Thyroid Scan' }
        ],
        redFlags: ['chest_pain', 'unconscious'],
        remedies: [
            { name: 'Iodum 30', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Twice daily' },
            { name: 'Natrum Mur 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' },
            { name: 'Lycopus Virginicus Q', use: { ur: 'دل کی دھڑکن', en: 'Palpitations' }, dose: '10 drops thrice' },
            { name: 'Thyroidinum 200', use: { ur: 'دائمی', en: 'Chronic' }, dose: 'Weekly' }
        ],
        advice: { ur: 'کیفین کم، ذہنی سکون، ڈاکٹر سے۔', en: 'Less caffeine, rest, doctor.' }
    },
    {
        id: 'obesity',
        name: { ur: 'موٹاپا', en: 'Obesity', roman: 'Motapa' },
        category: 'chronic',
        symptoms: ['weight_gain', 'fatigue', 'shortness_breath', 'joint_pain', 'palpitations'],
        keySymptoms: ['weight_gain'],
        tests: [
            { ur: 'BMI Calculation', en: 'BMI Calculation' },
            { ur: 'Thyroid', en: 'Thyroid' },
            { ur: 'Blood Sugar', en: 'Blood Sugar' },
            { ur: 'Lipid Profile', en: 'Lipid Profile' }
        ],
        redFlags: ['chest_pain', 'breathing_difficulty'],
        remedies: [
            { name: 'Calcarea Carb 200', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Weekly' },
            { name: 'Phytolacca Berry Q', use: { ur: 'وزن کم کرے', en: 'Weight reducer' }, dose: '10 drops thrice' },
            { name: 'Fucus Vesiculosus Q', use: { ur: 'میٹابولزم بڑھائے', en: 'Boosts metabolism' }, dose: '10 drops thrice' },
            { name: 'Ammonium Mur 30', use: { ur: 'کمر پر چربی', en: 'Abdominal fat' }, dose: 'Twice daily' }
        ],
        advice: { ur: 'ورزش، کم کیلوریز، پانی، صبر۔', en: 'Exercise, low calories, patience.' }
    },
    {
        id: 'vitamin_d_deficiency',
        name: { ur: 'وٹامن ڈی کی کمی', en: 'Vitamin D Deficiency', roman: 'Vitamin D Kami' },
        category: 'chronic',
        symptoms: ['fatigue', 'muscle_pain', 'joint_pain', 'muscle_weakness', 'back_pain', 'depression'],
        keySymptoms: ['muscle_pain', 'fatigue'],
        tests: [
            { ur: '25-Hydroxy Vitamin D', en: '25-OH Vitamin D' },
            { ur: 'Calcium, Phosphorus', en: 'Calcium, Phosphorus' }
        ],
        redFlags: [],
        remedies: [
            { name: 'Calcarea Phos 6X', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '3 times daily' },
            { name: 'Silicea 6X', use: { ur: 'ہڈی کمزوری', en: 'Bone weakness' }, dose: 'Daily' },
            { name: 'Symphytum 200', use: { ur: 'ہڈی مضبوطی', en: 'Bone strength' }, dose: 'Weekly' }
        ],
        advice: { ur: 'دھوپ، وٹامن ڈی سپلیمنٹ، دودھ، انڈا۔', en: 'Sunlight, Vit D supplements.' }
    },
    {
        id: 'iron_deficiency',
        name: { ur: 'آئرن کی کمی', en: 'Iron Deficiency', roman: 'Iron Kami' },
        category: 'chronic',
        symptoms: ['weakness', 'fatigue', 'pale_skin', 'hair_loss', 'palpitations', 'dizziness', 'shortness_breath'],
        keySymptoms: ['weakness', 'pale_skin'],
        tests: [
            { ur: 'CBC', en: 'CBC' },
            { ur: 'Serum Iron, Ferritin', en: 'Iron, Ferritin' },
            { ur: 'TIBC', en: 'TIBC' }
        ],
        redFlags: ['unconscious', 'chest_pain'],
        remedies: [
            { name: 'Ferrum Phos 6X', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: '3 times daily' },
            { name: 'Ferrum Met 30', use: { ur: 'شدید کمی', en: 'Severe deficiency' }, dose: 'Twice daily' },
            { name: 'China Off 30', use: { ur: 'خون کی کمی', en: 'Anemia' }, dose: '3 times daily' },
            { name: 'Alfalfa Q', use: { ur: 'ٹانک', en: 'Tonic' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'آئرن والی غذا، پالک، انڈا، گوشت، وٹامن سی۔', en: 'Iron-rich food, Vit C.' }
    },
    {
        id: 'b12_deficiency',
        name: { ur: 'وٹامن بی 12 کی کمی', en: 'B12 Deficiency', roman: 'B12 Kami' },
        category: 'chronic',
        symptoms: ['weakness', 'fatigue', 'numbness', 'tingling', 'memory_loss', 'depression', 'pale_skin'],
        keySymptoms: ['numbness', 'weakness'],
        tests: [
            { ur: 'Vitamin B12 Level', en: 'B12 Level' },
            { ur: 'CBC', en: 'CBC' },
            { ur: 'Folate', en: 'Folate' }
        ],
        redFlags: ['confusion', 'memory_loss'],
        remedies: [
            { name: 'Kali Phos 6X', use: { ur: 'اعصابی ٹانک', en: 'Nerve tonic' }, dose: '3 times daily' },
            { name: 'Alfalfa Q', use: { ur: 'عمومی ٹانک', en: 'General tonic' }, dose: '10 drops thrice' },
            { name: 'Avena Sativa Q', use: { ur: 'اعصابی کمزوری', en: 'Nervous weakness' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'انڈا، دودھ، گوشت، B12 سپلیمنٹ۔', en: 'Eggs, meat, B12 supplements.' }
    },
    {
        id: 'goitre',
        name: { ur: 'گلہڑ', en: 'Goitre', roman: 'Gilhar' },
        category: 'chronic',
        symptoms: ['swollen_glands', 'difficulty_swallowing', 'hoarse_voice', 'breathing_difficulty'],
        keySymptoms: ['swollen_glands'],
        tests: [
            { ur: 'TSH, T3, T4', en: 'Thyroid Panel' },
            { ur: 'Ultrasound Neck', en: 'Ultrasound Neck' },
            { ur: 'FNAC اگر ضروری', en: 'FNAC if needed' }
        ],
        redFlags: ['breathing_difficulty', 'weight_loss'],
        remedies: [
            { name: 'Iodum 30', use: { ur: 'اہم دوا', en: 'Main remedy' }, dose: 'Twice daily' },
            { name: 'Calcarea Iodata 30', use: { ur: 'گلٹی کے ساتھ', en: 'With nodules' }, dose: 'Twice daily' },
            { name: 'Spongia Tosta 30', use: { ur: 'سخت گلٹی', en: 'Hard swelling' }, dose: '3 times daily' },
            { name: 'Fucus Vesiculosus Q', use: { ur: 'مدد گار', en: 'Supportive' }, dose: '10 drops thrice' }
        ],
        advice: { ur: 'آئوڈین والا نمک، ڈاکٹر سے۔', en: 'Iodized salt, doctor consult.' }
    }
];

// ==========================================
// CATEGORIES DATABASE
// ==========================================

const CATEGORIES_DB = {
    all:         { ur: 'تمام',      en: 'All',           roman: 'All',           icon: '🏥' },
    general:     { ur: 'عمومی',     en: 'General',       roman: 'General',       icon: '🤒' },
    respiratory: { ur: 'سانس',      en: 'Respiratory',   roman: 'Respiratory',   icon: '🫁' },
    digestive:   { ur: 'ہاضمہ',     en: 'Digestive',     roman: 'Digestive',     icon: '🍽️' },
    head:        { ur: 'سر',        en: 'Head/Neuro',    roman: 'Sar',           icon: '🧠' },
    joints:      { ur: 'جوڑ',       en: 'Bones/Joints',  roman: 'Jor',           icon: '🦴' },
    skin:        { ur: 'جلد',       en: 'Skin',          roman: 'Jild',          icon: '🧴' },
    urinary:     { ur: 'پیشاب',     en: 'Urinary',       roman: 'Peshab',        icon: '💧' },
    mental:      { ur: 'دماغی',     en: 'Mental',        roman: 'Dimagi',        icon: '🧘' },
    chronic:     { ur: 'دائمی',     en: 'Chronic',       roman: 'Chronic',       icon: '💉' },
    women:       { ur: 'زنانہ',     en: 'Women',         roman: 'Zanana',        icon: '👩' },
    pediatric:   { ur: 'بچے',       en: 'Pediatric',     roman: 'Bache',         icon: '👶' },
    eyes:        { ur: 'آنکھ/کان',  en: 'Eyes/ENT',      roman: 'Aankh/Kaan',    icon: '👁️' },
    special:     { ur: 'خاص',       en: 'Special',       roman: 'Special',       icon: '⚠️' }
};

// ==========================================
// EXPORT TO GLOBAL SCOPE
// ==========================================
window.SYMPTOMS_DB = SYMPTOMS_DB;
window.DISEASES_DB = DISEASES_DB;
window.CATEGORIES_DB = CATEGORIES_DB;

console.log('✅ Diagnosis DB loaded:', DISEASES_DB.length, 'diseases,', Object.keys(SYMPTOMS_DB).length, 'symptoms');