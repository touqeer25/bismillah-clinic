// ============================================================
// Bismillah Clinic — js/10-treatment-data.js
// HYBRID TREATMENT STUDIO — TREATMENT_LIB (31 diseases, 3 languages)
// NOTE: Preview data — final content doctor-approved before use.
// WARNING: Load AFTER 01-app-core.js, BEFORE 11-app-studio.js
// ============================================================
// ============================================================
// Bismillah Clinic — js/10-treatment-data.js
// HYBRID TREATMENT STUDIO — TREATMENT_LIB (31 diseases, 3 languages)
// NOTE: Preview data structure — final content doctor-approved.
// WARNING: Load AFTER 01-app-core.js (currentLang), BEFORE 11-app-studio.js
// ============================================================

function T(u, e, r) { return { ur: u, en: e, roman: r }; }

const STUDIO_SYS = [
 {k:'all',    ic:'🧿', c:'#8e44ad', bg:'#f4ecf7', nm:T('سب','All','Sab')},
 {k:'digest', ic:'🍔', c:'#e67e22', bg:'#fef5e7', nm:T('ہاضمہ','Digestive','Hazma')},
 {k:'joints', ic:'🦴', c:'#2980b9', bg:'#eaf2f8', nm:T('جوڑ و عضلات','Joints & Muscles','Jor aur Azlaat')},
 {k:'skin',   ic:'🌸', c:'#e91e63', bg:'#fdeff4', nm:T('جلد','Skin','Jild')},
 {k:'nerves', ic:'🧠', c:'#8e44ad', bg:'#f4ecf7', nm:T('سر و اعصاب','Head & Nerves','Sir aur Aasaab')},
 {k:'general',ic:'🌡️', c:'#e74c3c', bg:'#fdedec', nm:T('بخار و عام','Fever & General','Bukhar aur Aam')},
 {k:'resp',   ic:'🫁', c:'#16a085', bg:'#e8f6f3', nm:T('سانس','Respiratory','Saans')},
 {k:'women',  ic:'🚺', c:'#e91e63', bg:'#fdeff4', nm:T('خواتین','Women','Khawateen')},
 {k:'male',   ic:'♂️', c:'#d35400', bg:'#fdf2e9', nm:T('مردانہ','Male','Mardana')},
 {k:'renal',  ic:'🫘', c:'#2980b9', bg:'#eaf2f8', nm:T('گردہ و بول','Kidney & Urinary','Gurda aur Baul')},
 {k:'ear',    ic:'👂', c:'#2c3e50', bg:'#ebedef', nm:T('کان','Ear','Kaan')}
];

const TREATMENT_LIB = {
 piles:{sys:'digest',ic:'🩸',name:T('بواسیر','Piles / Hemorrhoids','Bawaseer'),
  syms:[T('مقعد سے تازہ خون','Fresh rectal bleeding','Maqad se taaza khoon'),T('گانٹھ','Lumps at anus','Gaanth'),T('قبض','Constipation','Qabz'),T('جلن','Burning','Jalan'),T('بیٹھنے میں دقت','Difficulty in sitting','Baithnay mein diqqat')],
  intro:T('مقعد کی رگوں کا پھول جانا۔ قبض، گرم مصالحہ اور زیادہ بیٹھنے سے بڑھتا ہے۔','Swelling of rectal veins. Aggravated by constipation, spicy food and prolonged sitting.','Maqad ki raghon ka phool jana. Qabz, garam masala aur zyada baithnay se barhta hai.'),
  diet:T('سبزیاں، فیبرز، 12 گلاس پانی — مرچ مصالحہ بند۔','Vegetables, fiber, 12 glasses of water — avoid spices.','Sabziyan, fiber, 12 glass pani — mirch masala band.'),
  rf:T('مسلسل خون آنا یا شدید درد — فوری معائنہ','Continuous bleeding or severe pain — immediate examination','Musalsal khoon aana ya shadeed dard — fori muaina'),
  rem:[
   {n:'Aesculus',pot:'30 / BD',syms:[T('بغیر خون کے درد اور بھرے پن کا احساس','Painful fullness without much bleeding','Baghair khoon ke dard aur bhare pan ka ehsas'),T('مقعد کی جھلی میں جلن اور کھجلی','Burning and itching of rectal mucosa','Maqad ki jhili mein jalan aur khujli'),T('کمر اور کولہوں کا درد','Back and hips pain','Kamar aur koolhon ka dard')],mod:T('بدتر: کھڑے ہونے، حرکت اور نیند کے بعد؛ بہتر: تیز ہوا سے','Worse: standing, motion, after sleep; Better: cool open air','Badtar: kharay honay, harkat, neend ke baad; Behtar: taiz hawa se')},
   {n:'Hamamelis',pot:'30 / BD',syms:[T('تازہ سرخ خون آنا','Fresh red bleeding','Taaza surkh khoon aana'),T('رگوں کی کمزوری اور پھول جانا','Weak and engorged veins','Ragon ki kamzori aur phool jana'),T('متاثرہ جگہ نہایت حساس','Very sensitive affected part','Mutasirra jagah nahayat hassas')],mod:T('بدتر: حرکت اور دباؤ سے؛ بہتر: مکمل سکون سے','Worse: motion and pressure; Better: complete rest','Badtar: harkat aur dabao se; Behtar: mukammal sukoon se')},
   {n:'Nux Vomica',pot:'200 / OD',syms:[T('قبض اور بار بار ناکام خواہش','Constipation with frequent ineffectual urging','Qabz aur bar bar nakam khwahish'),T('جلن کے ساتھ درد','Pain with burning','Jalan ke sath dard'),T('مسالہ، شراب اور نشست زندگی سے','From spices, alcohol, sedentary life','Masala, sharab aur nasht zindagi se')],mod:T('بدتر: صبح، مسالوں سے؛ بہتر: مختصر نیند سے','Worse: morning, spices; Better: short nap','Badtar: subah, masalon se; Behtar: mukhtasar neend se')},
   {n:'Collinsonia',pot:'Q / BD',syms:[T('قبض والا بواسیر','Constipation piles','Qabz wala bawaseer'),T('شدید خارش اور جلن','Severe itching and burning','Shadeed khujli aur jalan'),T('متبادل قبض اور دست','Alternating constipation and diarrhea','Mubadil qabz aur dast')],mod:T('بدتر: گرمی سے؛ بہتر: ٹھنڈک سے','Worse: heat; Better: coolness','Badtar: garmi se; Behtar: thandak se')},
   {n:'Aloe',pot:'30 / BD',syms:[T('بھری ہوئی نیلی رگوں کی سوجن','Swollen engorged bluish veins','BHri hui neeli raghon ki sojan'),T('پیٹ میں گیس اور بے چینی','Abdominal gas and restlessness','Pait mein gas aur bechaini'),T('پاخانہ کے وقت بے چینی','Restlessness during stool','Pakhana ke waqt bechaini')],mod:T('بدتر: صبح اور کھڑے ہونے سے؛ بہتر: ٹھنڈے پانی سے','Worse: morning, standing; Better: cold water','Badtar: subah, kharay honay se; Behtar: thanday pani se')},
   {n:'Sulphur',pot:'200 / W',syms:[T('شدید جلن اور خارش','Severe burning and itching','Shadeed jalan aur khujli'),T('گرمی ناگوار، چادر پھینک دیتا ہے','Heat intolerable, throws off covers','Garmi nagawar, chadar phenk deta hai'),T('پرانا بار بار آنے والا بواسیر','Old recurrent piles','Purana bar bar anay wala bawaseer')],mod:T('بدتر: گرمی، دھلائی، بستر کی گرمی سے؛ بہتر: خشک موسم سے','Worse: heat, washing, warmth of bed; Better: dry weather','Badtar: garmi, dhulai, bistar ki garmi se; Behtar: khushk mausam se')},
   {n:'Ratanhia',pot:'30 / BD',syms:[T('پاخانہ کے بعد شدید جلن','Severe burning after stool','Pakhana ke baad shadeed jalan'),T('جیسے جلتی انگاروں پر گزر رہا ہو','As if walking on burning coals','Jaisay jalti ingaron par guzar raha ho'),T('پاخانہ کے قبل درد','Pain before stool','Pakhana se pehle dard')],mod:T('بدتر: پاخانہ کے بعد؛ بہتر: چکنا کرنے والی چیز سے','Worse: after stool; Better: lubrication','Badtar: pakhana ke baad; Behtar: chikna karne wali cheez se')},
   {n:'Calcarea Fluorica',pot:'200 / W',syms:[T('سخت گانٹھیں والا بواسیر','Hard lumpy piles','Sakht gaanthan wala bawaseer'),T('اندرونی بواسیر','Internal piles','Andruni bawaseer'),T('رگوں کی سختی اور کمزوری','Hardness and weakness of veins','Ragon ki sakhti aur kamzori')],mod:T('بدتر: بارش والے موسم میں؛ بہتر: حرکت سے','Worse: damp rainy weather; Better: motion','Badtar: barish wale mausam mein; Behtar: harkat se')}
 ]},
 constipation:{sys:'digest',ic:'🚽',name:T('قبض','Constipation','Qabz'),
  syms:[T('سخت پاخانہ','Hard stool','Sakht pakhana'),T('دیر سے آنے والی حرکت','Sluggish bowel movement','Der se anay wali harkat'),T('پیٹ بھرا','Bloated abdomen','Pait bhara'),T('زبان پر تہہ','Coated tongue','Zaban par taha'),T('مساس','Piles','Masas')],
  intro:T('آنکوں کی سستی حرکت۔ خشک غذا اور کم پانی سے عام۔','Sluggish intestines. Common with dry diet and low water intake.','Aanton ki sust harkat. Khushk ghiza aur kam pani se aam.'),
  diet:T('پانی، پپیتا، سبزیاں — چائے کم۔','Water, papaya, vegetables — less tea.','Pani, papita, sabziyan — chai kam.'),
  rf:T('اچانک قبض + قے — فوری','Sudden constipation with vomiting — urgent','Achanak qabz + ulti — fori'),
  rem:[
   {n:'Nux Vomica',pot:'200 / OD',syms:[T('بار بار ناکام خواہش، تھوڑا تھوڑا آنا','Frequent ineffectual urging, small stool','Bar bar nakam khwahish, thora thora ana'),T('سخت ناقص پاخانہ','Hard incomplete stool','Sakht naqis pakhana'),T('بدہضمی اور پیٹ بھاری','Indigestion and heavy abdomen','Badhazmi aur pait bhari')],mod:T('بدتر: صبح، مسالا اور کافی سے؛ بہتر: مختصر نیند سے','Worse: morning, spices, coffee; Better: short nap','Badtar: subah, masala, coffee se; Behtar: mukhtasar neend se')},
   {n:'Opium',pot:'30 / BD',syms:[T('مکمل بے خواہشی، کوئی اشارہ نہیں','Complete absence of urging','Mukammal be-khwahishi, koi ishara nahi'),T('سخت گول پاخانہ','Hard round stool balls','Sakht gol pakhana'),T('آنتوں کی مکمل سستی','Complete intestinal lethargy','Aanton ki mukammal susti')],mod:T('بدتر: سستی اور نشہ سے؛ بہتر: ٹھنڈک سے','Worse: inactivity, stimulants; Better: cold','Badtar: susti aur nasha se; Behtar: thandak se')},
   {n:'Bryonia',pot:'30 / BD',syms:[T('سیاہ، سخت، خشک پاخانہ','Black hard dry stool','Siyah sakht khushk pakhana'),T('پیٹ درد ہر حرکت سے','Abdominal pain from any motion','Pait dard har harkat se'),T('بے تحاشا پیاس','Excessive thirst','Be-tahasha pyas')],mod:T('بدتر: حرکت اور گرمی سے؛ بہتر: سکون اور ٹھنڈک سے','Worse: motion, heat; Better: rest, cold','Badtar: harkat, garmi se; Behtar: sukoon, thandak se')},
   {n:'Alumina',pot:'30 / BD',syms:[T('بغیر کوشش پاخانہ نہیں آتا','No stool without straining','Baghair koshish pakhana nahi ata'),T('نرم پاخانہ بھی بڑی محنت سے','Even soft stool passes with great effort','Naram pakhana bhi bari mehnat se'),T('جسم کے حصے سن سن لگنا','Parts feel numb','Jism ke hissay sun sun lagna')],mod:T('بدتر: صبح سے؛ بہتر: شام کو','Worse: morning; Better: evening','Badtar: subah se; Behtar: sham ko')},
   {n:'Lycopodium',pot:'200 / OD',syms:[T('پیٹ میں گیس اور پھولاؤ','Abdominal gas and bloating','Pait mein gas aur phoolao'),T('احساس کہ پاخانہ باقی رہ گیا','Sensation of incomplete evacuation','Ehsas ke pakhana baqi reh gaya'),T('شام 4 سے 8 بجے خرابی','Aggravation 4 to 8 pm','Sham 4 se 8 bajay kharabi')],mod:T('بدتر: شام 4-8 بجے؛ بہتر: گرم مشروب سے','Worse: 4-8 pm; Better: warm drinks','Badtar: sham 4-8 baje; Behtar: garam mashroob se')}
 ]},
 stomach:{sys:'digest',ic:'🔥',name:T('معدہ درد','Stomach Pain','Meda Dard'),
  syms:[T('جلن','Heartburn','Jalan'),T('مروڑ','Colic','Moror'),T('متلی','Nausea','Mutli'),T('کھٹیا','Sour eructations','Khatiya'),T('دل بھری','Nauseous fullness','Dil bhari')],
  intro:T('معدے کی جلن و درد — مسالا، خالی پیٹ اور تناؤ سے بڑھتا ہے۔','Gastric burning and pain — worse from spices, empty stomach and stress.','Meday ki jalan o dard — masala, khali pait aur tanao se barhta hai.'),
  diet:T('ہلکی گرم غذا — چائے/کولڈ ڈرنک بند۔','Light warm food — no tea/cold drinks.','Halki garam ghiza — chai/cold drink band.'),
  rf:T('کالی قے یا شدید درد — فوری','Coffee-ground vomiting or severe pain — urgent','Kali qay ya shadeed dard — fori'),
  rem:[
   {n:'Nux Vomica',pot:'30 / BD',syms:[T('خالی پیٹ درد اور متلی','Empty stomach pain and nausea','Khali pait dard aur mutli'),T('منہ کا ذائقہ کڑوا','Bitter taste in mouth','Munh ka zaiqa karwa'),T('کھانے کے بعد نیند کا غلبہ','Drowsiness after eating','Khanay ke baad neend ka ghalba')],mod:T('بدتر: مسالا، کافی، تناؤ سے؛ بہتر: مختصر نیند سے','Worse: spices, coffee, stress; Better: short nap','Badtar: masala, coffee, tanao se; Behtar: mukhtasar neend se')},
   {n:'Carbo Veg',pot:'30 / BD',syms:[T('اوپر نیچے گیس کا دباؤ','Gas pressure upward and downward','Upar neeche gas ka dabao'),T('ہوا کے دانے نکالنے کی خواہش','Desire to fan for air','Hawa ke danay nikalne ki khwahish'),T('کھانے کے بعد کمزوری اور سینی بھاری','Weakness and heavy chest after eating','Khanay ke baad kamzori aur seena bhari')],mod:T('بہتر: ہوا، پٹکے اور چھاپے سے؛ بدتر: چکنائی سے','Better: air, fanning, eructations; Worse: fats','Behtar: hawa, patakay, chhapay se; Badtar: chiknai se')},
   {n:'Colocynth',pot:'30 / BD',syms:[T('مروڑی درد، جسم جھکا کر دباؤ','Colicky pain, bending double with pressure','Morori dard, jism jhuka kar dabao'),T('غصے کے بعد خرابی','Complaints after anger','Ghusay ke baad kharabi'),T('بغیر وجہ چڑچڑا پن','Irritability without cause','Baghair wajah chirchirapan')],mod:T('بدتر: غصہ اور کھانے سے؛ بہتر: دباؤ اور گرم چیز سے','Worse: anger, eating; Better: pressure, warmth','Badtar: ghusa, khana se; Behtar: dabao, garam cheez se')},
   {n:'Arsenicum',pot:'30 / 3H',syms:[T('جلن اور بے چینی','Burning and restlessness','Jalan aur bechaini'),T('تھوڑا تھوڑا بار بار پیاس','Thirst for small frequent sips','Thora thora bar bar pyas'),T('کمزوری اور ٹھنڈ لگنا','Weakness and chilliness','Kamzori aur thand lagna')],mod:T('بدتر: ٹھنڈے پانی، آدھی رات سے؛ بہتر: گرم پانی سے','Worse: cold water, midnight; Better: warm drinks','Badtar: thanday pani, adhi raat se; Behtar: garam pani se')},
   {n:'Pulsatilla',pot:'30 / BD',syms:[T('چکنائی کھانے کے بعد خرابی','Worse after fatty food','Chiknai khane ke baad kharabi'),T('مزاج بدلتا رہے، رونا آئے','Changeable mood, weepy','Mizaj badalta rahe, rona aaye'),T('بھوک کم مگر منہ مزا','Little appetite but tastes good','Bhook kam magar munh maza')],mod:T('بدتر: چکنائی، گرم کمرے سے؛ بہتر: کھلی ہوا سے','Worse: fats, warm room; Better: open air','Badtar: chiknai, garam kamray se; Behtar: khuli hawa se')}
 ]},
 appetite:{sys:'digest',ic:'🍽️',name:T('بھوک کی کمی','Loss of Appetite','Bhook ki Kami'),
  syms:[T('غذا میں دلچسپی نہیں','No interest in food','Ghiza mein dilchaspi nahi'),T('جلدی سیر','Early satiety','Jaldi sair'),T('کمزوری','Weakness','Kamzori'),T('وزن میں کمی','Weight loss','Wazan mein kami'),T('بدمزاجی','Bad mood','Badmizaji')],
  intro:T('بھوک کی کمی — معدے کی سستی، ہاضمے کی کمزوری یا ذہنی دباؤ سے۔','Loss of appetite — from sluggish stomach, weak digestion or mental stress.','Bhook ki kami — meday ki susti, hazmay ki kamzori ya zehni dabao se.'),
  diet:T('چھوٹے چھوٹے کھانے، تازہ کھانا۔','Small frequent meals, fresh food.','Chhote chhote khanay, taaza khana.'),
  rf:T('وزن مسلسل گرے تو ٹیسٹ کریں','If weight keeps dropping, run tests','Wazan musalsal giray to test karein'),
  rem:[
   {n:'Alfalfa',pot:'Q / BD',syms:[T('بھوک اور وزن میں اضافہ','Improves appetite and weight','Bhook aur wazan mein izafa'),T('اعصابی کمزوری میں بہتری','Improves nervous weakness','Aasabi kamzori mein behtari'),T('نیند کا قوام درست','Normalizes sleep','Neend ka qawam durust')],mod:T('صبح و شام باقاعدہ استعمال سے بہتری','Improves with regular use morning and evening','Subah o sham baqaida istemal se behtari')},
   {n:'Gentian',pot:'Q / BD',syms:[T('کھانے سے آدھا گھنٹہ پہلے دیں تو بھوک بڑھے','Increases appetite if taken half hour before meals','Khanay se aadha ghanta pehle dein to bhook barhay'),T('ہاضمہ قوی ہوتا ہے','Strengthens digestion','Hazma qawi hota hai'),T('پیٹ کی سستی دور','Removes gastric sluggishness','Pait ki susti door')],mod:T('کھانے سے پہلے استعمال بہتر','Best taken before meals','Khanay se pehle istemal behtar')},
   {n:'Cinchona',pot:'30 / BD',syms:[T('خون کی کمی اور کمزوری کے بعد بھوک ختم','Appetite lost after anemia and debility','Khoon ki kami aur kamzori ke baad bhook khatam'),T('پیٹ میں گیس و بھاری پن','Gas and heaviness in abdomen','Pait mein gas o bhari pan'),T('جسم میں دباؤ کا درد','Soreness of body','Jism mein dabao ka dard')],mod:T('بدتر: ہلکے کھانے اور چھونے سے؛ بہتر: گرمی سے','Worse: light food, touch; Better: warmth','Badtar: halkay khanay, chhunay se; Behtar: garmi se')},
   {n:'Ipecac',pot:'30 / BD',syms:[T('مسلسل متلی، منہ میں لار','Constant nausea, salivation','Musalsal mutli, munh mein laar'),T('صفائی کے باوجود متلی نہ جائے','Nausea persists despite vomiting','Safai ke bawajood mutli na jaye'),T('زبان صاف مگر دل بھرا','Clean tongue but sinking feeling','Zaban saaf magar dil bhara')],mod:T('بدتر: کھانے سے؛ بہتر: کھلی ہوا سے','Worse: after eating; Better: open air','Badtar: khane se; Behtar: khuli hawa se')}
 ]},
 jaundice:{sys:'digest',ic:'💛',name:T('یرقان','Jaundice','Yarqan'),
  syms:[T('اکھیں پیلی','Yellow eyes','Aankhein peeli'),T('پیشاب گہرا','Dark urine','Peshab gehra'),T('کھجلی','Itching','Khujli'),T('تھکاوٹ','Fatigue','Thakawat'),T('بھوک کم','Poor appetite','Bhook kam')],
  intro:T('بلڈ کی خرابی سے جسم پیلا — جگر کی نالی بند ہونے سے۔','Yellowing of body from blood disorder — blocked bile ducts.','Khoon ki kharabi se jism peela — jigar ki nali band honay se.'),
  diet:T('چکنائی مکمل بند — ہلکا، آسان ہضم کھانا۔','No fats at all — light, easily digestible food.','Chiknai mukammal band — halka, asaan hazam khana.'),
  rf:T('بخار + شدید پیٹ درد — فوری','Fever with severe abdominal pain — urgent','Bukhar + shadeed pait dard — fori'),
  rem:[
   {n:'Chelidonium',pot:'30 / BD',syms:[T('دائیں پسلی کے نیچے درد کندھے تک','Right hypochondrium pain radiating to shoulder','Dahin pasli ke neeche dard kandhay tak'),T('پیشاب پیلے رنگ کا','Deep yellow urine','Peshab peelay rang ka'),T('زبان پر موٹی سفید تہہ','Thick white coated tongue','Zaban par moti safaid taha')],mod:T('بدتر: کھانے سے فوراً؛ بہتر: گرم مشروب سے','Worse: immediately after eating; Better: hot drinks','Badtar: khane se fauran; Behtar: garam mashroob se')},
   {n:'Carduus Mar',pot:'Q / BD',syms:[T('جگر کا ٹونک','Liver tonic','Jigar ka tonic'),T('بھوک کم، قبض','Poor appetite, constipation','Bhook kam, qabz'),T('دائیں پسلی کے نیچے بھاری پن','Heaviness in right hypochondrium','Dahin pasli ke neeche bhari pan')],mod:T('ٹونک — باقاعدہ کورس بہتر','Tonic — regular course is better','Tonic — baqaida course behtar')},
   {n:'Lycopodium',pot:'200 / OD',syms:[T('گیس، پیلا رنگ، پیٹ پھول','Gas, sallow color, bloating','Gas, peela rang, pait phool'),T('شام 4-8 بجے خرابی','Worse 4-8 pm','Sham 4-8 baje kharabi'),T('چکنائی ناگوار','Fats intolerable','Chiknai nagawar')],mod:T('بدتر: شام 4-8 بجے؛ بہتر: گرم مشروب سے','Worse: 4-8 pm; Better: warm drinks','Badtar: sham 4-8 baje; Behtar: garam mashroob se')},
   {n:'Nux Vomica',pot:'200 / OD',syms:[T('بند نالی، قبض','Blocked ducts, constipation','Band nali, qabz'),T('بدہضمی','Indigestion','Badhazmi'),T('چڑچڑا مزاج','Irritable mood','Chirchira mizaj')],mod:T('بدتر: صبح، مسالا سے؛ بہتر: مختصر نیند سے','Worse: morning, spices; Better: short nap','Badtar: subah, masala se; Behtar: mukhtasar neend se')}
 ]},
 gallstone:{sys:'digest',ic:'🪨',name:T('پتے کی پتھری','Gall Stone','Pittay ki Pathri'),
  syms:[T('دائیں پسلیوں کے نیچے درد','Pain below right ribs','Dahin paslion ke neeche dard'),T('کھانے کے بعد بھاری','Heaviness after meals','Khanay ke baad bhari'),T('متلی','Nausea','Mutli'),T('گیس','Gas','Gas'),T('چکنائی سے بڑھنا','Worse from fats','Chiknai se barhna')],
  intro:T('پتے میں پتھری — چکنائی والی غذا سے درد کے دورے۔','Gallstones — attacks of pain from fatty food.','Pittay mein pathri — chiknai wali ghiza se dard ke dauray.'),
  diet:T('چکنائی، انڈا، وغیرہ بند۔','No fats, eggs etc.','Chiknai, anda, waghera band.'),
  rf:T('یرقان + بخار — فوری','Jaundice with fever — urgent','Yarqan + bukhar — fori'),
  rem:[
   {n:'Chelidonium',pot:'200 / W',syms:[T('پتے کا درد دائیں کندھے تک','Gallbladder pain to right shoulder','Pittay ka dard dahin kandhay tak'),T('متلی اور کھٹیا','Nausea and sour eructations','Mutli aur khatiya'),T('دائیں پسلی کے نیچے دباؤ','Pressure below right ribs','Dahin pasli ke neeche dabao')],mod:T('بدتر: کھانے سے؛ بہتر: گرم مشروب سے','Worse: after eating; Better: hot drinks','Badtar: khane se; Behtar: garam mashroob se')},
   {n:'Lycopodium',pot:'200 / W',syms:[T('گیس اور پھولاؤ','Gas and bloating','Gas aur phoolao'),T('چکنائی سے بگڑنا','Worse from fats','Chiknai se bigarna'),T('شام کو خرابی','Evening aggravation','Sham ko kharabi')],mod:T('بدتر: شام 4-8 بجے؛ بہتر: گرم مشروب سے','Worse: 4-8 pm; Better: warm drinks','Badtar: sham 4-8 baje; Behtar: garam mashroob se')},
   {n:'Calcarea Carb',pot:'200 / W',syms:[T('موٹا، ٹھنڈا، پسینہ والا مزاج','Fat, chilly, sweaty constitution','Mota, thanda, paseena wala mizaj'),T('دودھ سے خرابی','Worse from milk','Doodh se kharabi'),T('بھاری جسم','Heavy body','Bhari jism')],mod:T('بدتر: نمی اور دودھ سے؛ بہتر: خشکی سے','Worse: damp, milk; Better: dryness','Badtar: nami, doodh se; Behtar: khushki se')},
   {n:'China',pot:'30 / BD',syms:[T('کمزوری کے بعد پتے کا درد','Gall pain after debility','Kamzori ke baad pittay ka dard'),T('گیس','Gas','Gas'),T('جسم میں دباؤ کا درد','Soreness all over','Jism mein dabao ka dard')],mod:T('بدتر: ہلکے کھانے سے؛ بہتر: آرام سے','Worse: light food, touch; Better: rest','Badtar: halkay khane se; Behtar: aaram se')}
 ]},
 abdomen:{sys:'digest',ic:'😮',name:T('پیٹ درد','Abdominal Pain','Pait Dard'),
  syms:[T('مروڑ','Colic','Moror'),T('درد کا بدلنا','Shifting pain','Dard ka badalna'),T('سوجن','Distension','Sojan'),T('آنتوں کی آوازیں','Bowel sounds','Aanton ki awazein')],
  intro:T('آنتوں کے مروڑ اور عام پیٹ درد۔','Intestinal colic and general abdominal pain.','Aanton ke moror aur aam pait dard.'),
  diet:T('گرم پانی، ہلکا کھانا۔','Warm water, light food.','Garam pani, halka khana.'),
  rf:T('دائیں نیچے شدید درد (اپینڈکس) — فوری','Severe right lower pain (appendix) — urgent','Dahin neeche shadeed dard (appendix) — fori'),
  rem:[
   {n:'Colocynth',pot:'30 / 15M',syms:[T('مروڑ، جسم جھکا کر دباؤ','Colic, bending double with pressure','Moror, jism jhuka kar dabao'),T('غصے کے بعد','After anger','Ghusay ke baad'),T('درد بجلی جیسا','Lightning-like pain','Dard bijli jaisa')],mod:T('بدتر: غصہ اور کھانے سے؛ بہتر: دباؤ اور گرمی سے','Worse: anger, food; Better: pressure, heat','Badtar: ghusa, khana se; Behtar: dabao, garmi se')},
   {n:'Mag Phos',pot:'30 / BD',syms:[T('اعصابی مروڑ','Nervous colic','Aasabi moror'),T('گرم پانی سے فوری آرام','Quick relief from hot water','Garam pani se fori aaram'),T('درد بجلی جیسا چڑھتا','Shooting lightning pain','Dard bijli jaisa charhta')],mod:T('بدتر: ٹھنڈک اور رات سے؛ بہتر: گرمی اور دباؤ سے','Worse: cold, night; Better: heat, pressure','Badtar: thandak, raat se; Behtar: garmi, dabao se')},
   {n:'Belladonna',pot:'30 / 1H',syms:[T('اچانک شدید درد','Sudden severe pain','Achanak shadeed dard'),T('پیٹ سرخ گرم','Red hot abdomen','Pait surkh garam'),T('بخار ساتھ','Fever along','Bukhar sath')],mod:T('بدتر: چھونا، جھٹکا سے؛ بہتر: ٹھنڈک سے','Worse: touch, jar; Better: cold','Badtar: chhoona, jhatka se; Behtar: thandak se')},
   {n:'Dioscorea',pot:'30 / BD',syms:[T('درد پیٹھ اور سینے تک چڑھتا','Pain radiates to back and chest','Dard peeth aur seenay tak charhta'),T('جھک جانے سے بہتری','Better bending backward','Jhuk janay se behtari'),T('مروڑی درد','Twisting colic','Morori dard')],mod:T('بدتر: سیدھا کھڑا ہونے سے؛ بہتر: جھکنے سے','Worse: standing erect; Better: bending','Badtar: sidha kharay honay se; Behtar: jhuknay se')}
 ]},
 cholesterol:{sys:'digest',ic:'🧈',name:T('کولیسٹرول','High Cholesterol','Cholesterol'),
  syms:[T('سینی بھاری','Heavy chest','Seena bhari'),T('سانس پھولنا','Breathlessness','Saans phoolna'),T('کمزوری','Weakness','Kamzori'),T('چکر','Dizziness','Chakkar')],
  intro:T('خون میں چکنائی زیادہ — رگیں تنگ ہوتی ہیں۔','Excess blood fats — arteries narrow down.','Khoon mein chiknai zyada — ragain tang hoti hain.'),
  diet:T('گھی/چکنائی کم — روز چہل قدمی۔','Less ghee/fat — daily walk.','Ghee/chiknai kam — roz chal phir.'),
  rf:T('سینی درد یا دباؤ — فوری','Chest pain or pressure — urgent','Seena dard ya dabao — fori'),
  rem:[
   {n:'Crataegus',pot:'Q / BD',syms:[T('دل کا ٹونک','Heart tonic','Dil ka tonic'),T('سینی بھاری اور دھڑکن تیز','Heavy chest, rapid pulse','Seena bhari aur dharkan tez'),T('بلڈ پریشر کے ساتھ','With high blood pressure','Blood pressure ke sath')],mod:T('ٹونک — باقاعدہ کورس بہتر','Tonic — regular course better','Tonic — baqaida course behtar')},
   {n:'Aurum Met',pot:'200 / W',syms:[T('رگوں کی سختی','Arteriosclerosis','Ragon ki sakhti'),T('بلڈ پریشر زیادہ','High blood pressure','Blood pressure zyada'),T('بڑی عمر کے مریض','Elderly patients','Bari umar ke mareez')],mod:T('بدتر: سردی سے؛ بہتر: کھلی ہوا اور ورزش سے','Worse: cold; Better: open air, exercise','Badtar: sardi se; Behtar: khuli hawa, warzish se')},
   {n:'Allium Sativa',pot:'Q / BD',syms:[T('قدرتی صفائی','Natural cleansing','Quadrati safai'),T('ہائی کولیسٹرول','High cholesterol','High cholesterol'),T('ہاضمے کی مدد','Aids digestion','Hazmay ki madad')],mod:T('باقاعدہ استعمال بہتر','Regular use better','Baqaida istemal behtar')},
   {n:'Baryta Mur',pot:'30 / BD',syms:[T('بڑی عمر کی رگوں کی سختی','Arterial stiffness in elderly','Bari umar ki raghon ki sakhti'),T('چکر','Dizziness','Chakkar'),T('یادداشت کمزور','Weak memory','Yaddasht kamzor')],mod:T('بدتر: سردی سے؛ بہتر: گرمی سے','Worse: cold; Better: warmth','Badtar: sardi se; Behtar: garmi se')}
 ]},
 joints:{sys:'joints',ic:'🦴',name:T('جوڑوں کا درد','Joint Pain','Joron ka Dard'),
  syms:[T('صبح اکڑن','Morning stiffness','Subah akran'),T('سوجن','Swelling','Sojan'),T('گرمی','Heat','Garmi'),T('حرکت سے تبدیلی','Changes with motion','Harkat se tabdeeli')],
  intro:T('جوڑوں کا گٹھیا — سردی و نمی سے بڑھتا ہے۔','Joint arthritis — worse from cold and damp.','Joron ka gathia — sardi o nami se barhta hai.'),
  diet:T('جسم خشک گرم رکھیں۔','Keep body dry and warm.','Jism khushk garam rakhein.'),
  rf:T('ایک جوڑ + بخار — ٹیسٹ','Single joint with fever — get tested','Aik jor + bukhar — test'),
  rem:[
   {n:'Rhus Tox',pot:'200 / OD',syms:[T('پہلی حرکت پر درد پھر آسانی','Pain on first motion then ease','Pehli harkat par dard phir asani'),T('جوڑوں میں اکڑن','Stiffness in joints','Joron mein akran'),T('سردی اور نمی سے بڑھنا','Worse from cold damp','Sardi aur nami se barhna')],mod:T('بدتر: آرام، سردی و نمی سے؛ بہتر: ہلکی حرکت اور گرمی سے','Worse: rest, cold damp; Better: continued motion, heat','Badtar: aaram, sardi nami se; Behtar: halki harkat, garmi se')},
   {n:'Bryonia',pot:'30 / BD',syms:[T('ہر حرکت سے شدید درد','Severe pain from any motion','Har harkat se shadeed dard'),T('سوجن گرم اور چمکدار','Hot shining swelling','Sojan garam aur chamakdar'),T('بے تحاشا پیاس','Excessive thirst','Be-tahasha pyas')],mod:T('بدتر: کسی حرکت سے؛ بہتر: مکمل سکون اور ٹھنڈک سے','Worse: any motion; Better: rest, cold','Badtar: kisi harkat se; Behtar: mukammal sukoon, thandak se')},
   {n:'Ruta',pot:'30 / BD',syms:[T('لگاموں اور ہڈیوں کا درد','Pain of ligaments and bones','Ligamon aur haddiyon ka dard'),T('جیسے چوٹ لگی ہو','Feels bruised','Jaisay chot lagi ho'),T('زیادہ کام سے بگڑنا','Worse from overuse','Zyada kam se bigarna')],mod:T('بدتر: زیادہ کام اور ٹھنڈک سے؛ بہتر: گرمی سے','Worse: overexertion, cold; Better: warmth','Badtar: zyada kam, thandak se; Behtar: garmi se')},
   {n:'Ledum',pot:'30 / BD',syms:[T('درد نیچے سے اوپر چڑھتا ہے','Pain ascends from below upward','Dard neeche se upar charhta hai'),T('جوڑ ٹھنڈے مگر ٹھنڈک لگے تو آرام','Joints cold yet cold applications relieve','Jor thanday magar thandak lage to aaram'),T('چوٹ کے بعد نیلی سوجن','Bluish swelling after injury','Chot ke baad neeli sojan')],mod:T('بدتر: رات اور حرکت سے؛ بہتر: ٹھنڈی پٹی سے','Worse: night, motion; Better: cold applications','Badtar: raat, harkat se; Behtar: thandi patti se')}
 ]},
 neck:{sys:'joints',ic:'🦴',name:T('گردن درد','Neck Pain','Gardan Dard'),
  syms:[T('گردن سخت','Stiff neck','Gardan sakht'),T('دباؤ','Tension','Dabao'),T('کندھے تک درد','Pain to shoulders','Kandhay tak dard'),T('چکر','Dizziness','Chakkar')],
  intro:T('گردن کی ہڈیوں/پٹھوں کا دباؤ — کمپیوٹر، غلط تکیہ۔','Cervical muscle/bone strain — computer work, wrong pillow.','Gardan ki haddiyon/puthon ka dabao — computer, ghalat takia.'),
  diet:T('صحیح تکیہ، آرام۔','Proper pillow, rest.','Sahi takia, aaram.'),
  rf:T('ہاتھ میں سن ہونا — معائنہ','Numbness in hand — examination','Haath mein sun hona — muaina'),
  rem:[
   {n:'Cimicifuga',pot:'30 / BD',syms:[T('گردن اور کندھوں کے پٹھے سخت','Stiff muscles of neck and shoulders','Gardan aur kandhon ke puthay sakht'),T('درد گردن سے سر اور بازو تک','Pain neck to head and arms','Dard gardan se sar aur bazoo tak'),T('حساسیت بڑھی ہوئی','Heightened sensitivity','Hassasiyat barhi hui')],mod:T('بدتر: سردی سے؛ بہتر: گرمی اور آرام سے','Worse: cold; Better: warmth, rest','Badtar: sardi se; Behtar: garmi, aaram se')},
   {n:'Rhus Tox',pot:'200 / OD',syms:[T('صبح اکڑن، حرکت کے بعد بہتری','Morning stiffness, better after motion','Subah akran, harkat ke baad behtari'),T('گردن میں سختی','Stiffness of neck','Gardan mein sakhti'),T('نمی والی سردی سے','From cold damp','Nami wali sardi se')],mod:T('بدتر: آرام اور نمی سے؛ بہتر: حرکت اور گرم سیک سے','Worse: rest, damp; Better: motion, hot fomentation','Badtar: aaram, nami se; Behtar: harkat, garam sek se')},
   {n:'Conium',pot:'30 / BD',syms:[T('سخت دھاگے نما پٹھے','Hard cord-like muscles','Sakht dhagay numa puthay'),T('سر گھومنے کا احساس','Sensation of vertigo','Sar ghumanay ka ehsas'),T('اوپر جھانکنے سے چکر','Dizzy looking upward','Upar jhanknay se chakkar')],mod:T('بدتر: رات اور جسم موڑنے سے؛ بہتر: سر نیچے رکھنے سے','Worse: night, turning; Better: head low','Badtar: raat, jism morne se; Behtar: sar neeche rakhnay se')},
   {n:'Lachnanthes',pot:'30 / BD',syms:[T('گردن کو ہمیشہ ٹھنڈا محسوس','Neck constantly feels cold','Gardan ko hamesha thanda mehsoos'),T('گرم پٹی باندھنے سے آرام','Relief from warm bandage','Garam patti bandhnay se aaram'),T('سر کے پیچھے درد','Pain at back of head','Sar ke peechay dard')],mod:T('بدتر: حرکت اور ٹھنڈک سے؛ بہتر: گرمی سے','Worse: motion, cold; Better: heat','Badtar: harkat, thandak se; Behtar: garmi se')}
 ]},
 muscle:{sys:'joints',ic:'💪',name:T('پٹھے درد + سوجن','Muscle Pain & Swelling','Puthe Dard aur Sojan'),
  syms:[T('کھنچاؤ','Strain','Khinchao'),T('سوجن','Swelling','Sojan'),T('گرمی','Heat','Garmi'),T('تھکاوٹ','Fatigue','Thakawat')],
  intro:T('پٹھوں کا درد — مشقت، چوٹ یا وائرس سے۔','Muscular pain — from exertion, injury or virus.','Puton ka dard — mushqat, chot ya virus se.'),
  diet:T('آرام، گرم سیک۔','Rest, hot fomentation.','Aaram, garam sek.'),
  rf:T('سیاہ نشان زیادہ — معائنہ','Excessive bruising — examination','Siyah nishan zyada — muaina'),
  rem:[
   {n:'Arnica',pot:'200 / OD',syms:[T('چوٹ اور نشان والی جگہ درد','Painful bruised spots','Chot aur nishan wali jagah dard'),T('چھونے سے درد مگر کہتا ہے ٹھیک ہوں','Sore yet says he is fine','Chhunay se dard magar kehta hai theek hoon'),T('کثرت سے چلنے پھرنے کے بعد','After excessive walking','Kasrat se chalne phirne ke baad')],mod:T('بدتر: چھونا اور حرکت سے؛ بہتر: لیٹنے سے','Worse: touch, motion; Better: lying down','Badtar: chhoona, harkat se; Behtar: letnay se')},
   {n:'Rhus Tox',pot:'200 / OD',syms:[T('پٹھوں میں کھنچاؤ','Muscular strain','Puton mein khinchao'),T('نمی سردی سے خرابی','Worse from cold damp','Nami sardi se kharabi'),T('بے چینی، بار بار پوزیشن بدلے','Restless, changes position','Bechaini, bar bar position badlay')],mod:T('بدتر: سردی اور آرام سے؛ بہتر: حرکت اور گرمی سے','Worse: cold, rest; Better: motion, heat','Badtar: sardi, aaram se; Behtar: harkat, garmi se')},
   {n:'Ruta',pot:'30 / BD',syms:[T('ہڈیوں اور لگاموں کا درد','Bone and ligament pain','Haddiyon aur ligamon ka dard'),T('زیادہ لکھنے پڑھنے سے ہاتھ کا درد','Hand pain from overwork','Zyada likhne parhne se haath ka dard'),T('جیسے ہڈی پر چوٹ','Feels bruised on bone','Jaisay haddi par chot')],mod:T('بدتر: زیادہ کام اور ٹھنڈک سے؛ بہتر: گرمی سے','Worse: overuse, cold; Better: warmth','Badtar: zyada kam, thandak se; Behtar: garmi se')},
   {n:'Mag Phos',pot:'30 / BD',syms:[T('اعصابی مروڑ اور کھنچاؤ','Nervous cramps and strains','Aasabi moror aur khinchao'),T('گرم پانی کی سیکی سے فوری آرام','Quick relief from hot fomentation','Garam pani ki seki se fori aaram'),T('درد بجلی جیسا','Lightning-like pains','Dard bijli jaisa')],mod:T('بدتر: ٹھنڈک اور رات سے؛ بہتر: گرمی اور دباؤ سے','Worse: cold, night; Better: heat, pressure','Badtar: thandak, raat se; Behtar: garmi, dabao se')}
 ]},
 uric:{sys:'joints',ic:'🧪',name:T('یورک ایسڈ','Uric Acid / Gout','Uric Acid / Gout'),
  syms:[T('انگوٹھے میں شدید درد','Severe big toe pain','Angoothay mein shadeed dard'),T('رات کو بڑھنا','Worse at night','Raat ko barhna'),T('سوجن','Swelling','Sojan'),T('سرخی','Redness','Surkhi')],
  intro:T('خون میں یورک ایسڈ کے کرسٹل جوڑوں میں جمع — گاؤٹ۔','Uric acid crystals deposit in joints — gout.','Khoon mein uric acid ke crystal joron mein jamay — gout.'),
  diet:T('گوشت/دال کم — پانی زیادہ۔','Less meat/pulses — more water.','Gosht/dal kam — pani zyada.'),
  rf:T('گردہ درد یا بخار — ٹیسٹ','Kidney pain or fever — test','Gurda dard ya bukhar — test'),
  rem:[
   {n:'Colchicum',pot:'30 / BD',syms:[T('جوڑ چھونا بھی ناگوار','Joint too tender to touch','Jor chhoona bhi nagawar'),T('متاثرہ جوڑ سرخ گرم','Affected joint red and hot','Mutasirra jor surkh garam'),T('جسم کے رخ بدلنے سے درد','Pain from changing position','Jism ka rakh badalne se dard')],mod:T('بدتر: رات اور موسم خزاں سے؛ بہتر: سکون سے','Worse: night, autumn; Better: rest','Badtar: raat, mausam khazan se; Behtar: sukoon se')},
   {n:'Ledum',pot:'200 / W',syms:[T('درد انگوٹھے سے شروع','Starts in big toe','Dard angoothay se shuru'),T('ٹھنڈی پٹی بہتر لگے','Cold applications feel better','Thandi patti behtar lage'),T('جوڑ ٹھنڈے مگر سوجن','Cold joints with swelling','Jor thanday magar sojan')],mod:T('بدتر: رات اور حرکت سے؛ بہتر: ٹھنڈک سے','Worse: night, motion; Better: cold','Badtar: raat, harkat se; Behtar: thandak se')},
   {n:'Benzoic Acid',pot:'30 / BD',syms:[T('پیشاب کی شدید بدبو','Strong smelling urine','Peshab ki shadeed badboo'),T('جوڑوں میں کرسٹل جمع','Crystal deposits in joints','Joron mein crystal jamay'),T('پاخانے کے بعد بہتری','Better after stool','Pakhana ke baad behtari')],mod:T('بدتر: رات سے؛ بہتر: پیشاب کے بعد','Worse: night; Better: after urination','Badtar: raat se; Behtar: peshab ke baad')},
   {n:'Urtica Urens',pot:'Q / BD',syms:[T('جوڑوں کے ساتھ جلدی خارش','Joint pain with skin rash','Joron ke sath jildi khujli'),T('زیادہ پانی پینے سے بہتری','Better drinking more water','Zyada pani peenay se behtari'),T('دائیں طرف خرابی','Right sided complaints','Dahin taraf kharabi')],mod:T('بدتر: گرمی اور پانی کم پینے سے؛ بہتر: ٹھنڈک سے','Worse: heat, low water; Better: cold','Badtar: garmi, kam pani se; Behtar: thandak se')}
 ]},
 itching:{sys:'skin',ic:'🌸',name:T('خارش','Itching','Khujli'),
  syms:[T('کھجلی','Itching','Khujli'),T('سرخی','Redness','Surkhi'),T('خشکی','Dryness','Khushki'),T('رات کو بڑھنا','Worse at night','Raat ko barhna')],
  intro:T('جلد کی عام خارش — خشکی، الرجی یا گرمی سے۔','Common skin itching — from dryness, allergy or heat.','Jild ki aam khujli — khushki, allergy ya garmi se.'),
  diet:T('گرم مصالحہ کم، صابن ہلکا۔','Less spicy food, mild soap.','Garam masala kam, sabun halka.'),
  rf:T('چہرے/سینے پر پھیلے — معائنہ','Spreading to face/chest — examination','Chehray/seenay par phailay — muaina'),
  rem:[
   {n:'Rhus Tox',pot:'30 / BD',syms:[T('پھنسیوں والی خارش','Itching with vesicles','Phansion wali khujli'),T('نمی اور سردی سے بڑھنا','Worse from damp cold','Nami aur sardi se barhna'),T('بے چینی، بدلتی جگہ','Restless, shifting','Bechaini, badalti jagah')],mod:T('بدتر: سردی و نمی سے؛ بہتر: گرمی اور خشکی سے','Worse: cold damp; Better: warmth, dry','Badtar: sardi nami se; Behtar: garmi, khushki se')},
   {n:'Sulphur',pot:'200 / W',syms:[T('جلانے والی خارش','Burning itching','Jalanay wali khujli'),T('رات کو گرم بستر میں شدید','Worse in warm bed at night','Raat ko garam bistar mein shadeed'),T('دوبارہ آنے والی شکایت','Recurring complaint','Dobara anay wala shikayat')],mod:T('بدتر: گرمی، دھلائی، بستر کی گرمی سے؛ بہتر: خشک موسم سے','Worse: heat, washing, bed warmth; Better: dry weather','Badtar: garmi, dhulai, bistar ki garmi se; Behtar: khushk mausam se')},
   {n:'Mezereum',pot:'30 / BD',syms:[T('خارش کے ساتھ دانے','Eruptions with itching','Danon ke sath khujli'),T('خارش شدید، رات کو زیادہ','Intense itching, worse night','Khujli shadeed, raat ko zyada'),T('جلد کی پرتیں اٹھنا','Skin scales off','Jild ki partain uthna')],mod:T('بدتر: رات اور چھونے سے؛ بہتر: کھلی ہوا سے','Worse: night, touch; Better: open air','Badtar: raat, chhoonay se; Behtar: khuli hawa se')},
   {n:'Urtica Urens',pot:'Q / BD',syms:[T('اچانک جلدی خارش','Sudden skin itching','Achanak jildi khujli'),T('پھنسیوں کے ساتھ','With wheals','Phansion ke sath'),T('گیس والی غذا سے','From gassy food','Gas wali ghiza se')],mod:T('بدتر: گرمی اور گرم کمرے سے؛ بہتر: ٹھنڈک سے','Worse: heat, warm room; Better: cold','Badtar: garmi, garam kamray se; Behtar: thandak se')}
 ]},
 scabies:{sys:'skin',ic:'🔬',name:T('کھجلی (دوائی خارش)','Scabies','Khujli (Scabies)'),
  syms:[T('انگلیوں کے درمیان','Between fingers','Unglion ke darmiyan'),T('رات کی کھجلی','Night itching','Raat ki khujli'),T('خاندانی','Family spread','Khandani'),T('دھاگے نما راستے','Thread-like burrows','Dhagay numa rastay')],
  intro:T('کُھجلی کا کیڑا — رات کھجلی زیادہ، گھر میں پھیلے۔','Scabies mite — worse at night, spreads in family.','Kharish ka keera — raat khujli zyada, ghar mein phailay.'),
  diet:T('گھر کی مکمل صفائی، کپڑے ابالیں۔','Full home hygiene, boil clothes.','Ghar ki mukammal safai, kapray ubalein.'),
  rf:T('پیپ والا دھبہ + بخار','Pustular patches with fever','Peeep wala dhabba + bukhar'),
  rem:[
   {n:'Sulphur',pot:'200 / W',syms:[T('رات کی شدید خارش','Severe night itching','Raat ki shadeed khujli'),T('دانے جلتے لگتے ہیں','Eruptions feel burning','Danay jaltay lagtay hain'),T('صفائی کے باوجود باقی','Persists despite hygiene','Safai ke bawajood baqi')],mod:T('بدتر: گرمی اور بستر کی گرمی سے؛ بہتر: خشکی سے','Worse: heat, bed warmth; Better: dryness','Badtar: garmi, bistar ki garmi se; Behtar: khushki se')},
   {n:'Psorinum',pot:'200 / W',syms:[T('شدید اور بار بار آنے والی خارش','Severe recurrent itching','Shadeed bar bar anay wali khujli'),T('شدید کمزوری کے ساتھ','With profound weakness','Shadeed kamzori ke sath'),T('سردی ناگوار','Cold intolerable','Sardi nagawar')],mod:T('بدتر: سردی سے؛ بہتر: گرم کپڑوں سے','Worse: cold; Better: warm clothing','Badtar: sardi se; Behtar: garam kapron se')},
   {n:'Arsenicum',pot:'30 / BD',syms:[T('خارش کے ساتھ جلن','Itching with burning','Khujli ke sath jalan'),T('خشک جلد، پھیکا رنگ','Dry skin, pale look','Khushk jild, feeka rang'),T('بے چینی','Restlessness','Bechaini')],mod:T('بدتر: آدھی رات اور ٹھنڈک سے؛ بہتر: گرمی سے','Worse: midnight, cold; Better: heat','Badtar: adhi raat, thandak se; Behtar: garmi se')},
   {n:'Hepar Sulph',pot:'30 / BD',syms:[T('پیپ والے دانے','Pustular eruptions','Peep walay danay'),T('ہر چیز ناگوار، حساس','Oversensitive to everything','Har cheez nagawar, hassas'),T('ٹھنڈی ہوا کا فوری اثر','Quick effect of cold air','Thandi hawa ka fori asar')],mod:T('بدتر: ٹھنڈک اور چھونے سے؛ بہتر: گرمی سے','Worse: cold, touch; Better: warmth','Badtar: thandak, chhoonay se; Behtar: garmi se')}
 ]},
 urticaria:{sys:'skin',ic:'🌸',name:T('پھپڑیاں','Urticaria / Hives','Phphriyan'),
  syms:[T('اچانک سفید دھبے','Sudden white patches','Achanak safaid dhabbay'),T('کھجلی','Itching','Khujli'),T('جلن','Burning','Jalan'),T('کھانے/سردی سے','From food/cold','Khanay/sardi se')],
  intro:T('الرجی سے اچانک اٹھنے والے دھبے — پھپڑیاں۔','Allergic sudden raised patches — hives.','Allergy se achanak uthnay walay dhabbay — phphriyan.'),
  diet:T('الرجک کھانے بند کریں۔','Stop allergenic foods.','Allergic khanay band karein.'),
  rf:T('سانس تنگ = فوری ایمرجنسی','Breathlessness = emergency','Saans tang = fori emergency'),
  rem:[
   {n:'Apis Mel',pot:'30 / BD',syms:[T('جلی ہوئی پھپڑیاں','Stinging hives','Jali hui phphriyan'),T('چھونا ناگوار','Tender to touch','Chhoona nagawar'),T('ٹھنڈی پٹی سے فوری آرام','Quick relief from cold compress','Thandi patti se fori aaram')],mod:T('بدتر: گرمی اور دباؤ سے؛ بہتر: ٹھنڈک سے','Worse: heat, pressure; Better: cold','Badtar: garmi, dabao se; Behtar: thandak se')},
   {n:'Urtica Urens',pot:'Q / 3H',syms:[T('پھپڑیوں کی خاص دوا','Specific remedy for hives','Phphrion ki khas dawa'),T('کھانے کے بعد اٹھنے والے دھبے','Patches after eating','Khanay ke baad uthnay walay dhabbay'),T('جلن و خارش','Burning and itching','Jalan aur khujli')],mod:T('بدتر: گرم کمرے سے؛ بہتر: ٹھنڈک سے','Worse: warm room; Better: cold','Badtar: garam kamray se; Behtar: thandak se')},
   {n:'Nat Mur',pot:'30 / BD',syms:[T('ہونٹوں کے کنارے دھبے','Patches on lip borders','Honton ke kinare dhabbay'),T('دھوپ سے بگڑنا','Worse from sun','Dhoop se bigarna'),T('پیاس زیادہ','Excessive thirst','Pyas zyada')],mod:T('بدتر: دھوپ اور سمندری ہوا سے؛ بہتر: کھلی ہوا سے','Worse: sun, seaside; Better: open air','Badtar: dhoop, samandari hawa se; Behtar: khuli hawa se')},
   {n:'Rhus Tox',pot:'30 / BD',syms:[T('سردی لگنے سے پھپڑیاں','Hives after chill','Sardi lagnay se phphriyan'),T('خارش کے ساتھ','With itching','Khujli ke sath'),T('بدلتی جگہ کی خواہش','Desire to keep moving','Badalti jagah ki khwahish')],mod:T('بدتر: سردی و نمی سے؛ بہتر: گرمی سے','Worse: cold damp; Better: warmth','Badtar: sardi nami se; Behtar: garmi se')}
 ]},
 acne:{sys:'skin',ic:'🔴',name:T('داندانے','Acne','Danay'),
  syms:[T('دھبے چہرے پر','Patches on face','Dhabbay chehray par'),T('پیپ','Pustules','Peep'),T('چکنائی','Oily skin','Chiknai'),T('نشان','Marks','Nishan')],
  intro:T('چہرے کے دانے — ہارمون، چکنائی اور جلد کی صفائی سے۔','Facial acne — hormones, oiliness and skin hygiene.','Chehray ke danay — hormone, chiknai aur jild ki safai se.'),
  diet:T('چکنائی/چاکلیٹ کم، پانی زیادہ۔','Less fat/chocolate, more water.','Chiknai/chocolate kam, pani zyada.'),
  rf:T('شدید سسٹک والے — معائنہ','Severe cystic cases — examination','Shadeed cystic walay — muaina'),
  rem:[
   {n:'Hepar Sulph',pot:'200 / W',syms:[T('پیپ والے دردناک دانے','Painful pustular acne','Peep walay dardnak danay'),T('پکنے سے پہلے ہی درد','Painful before suppuration','Phootnay se pehle hi dard'),T('ہر چیز ناگوار','Oversensitive','Har cheez nagawar')],mod:T('بدتر: ٹھنڈک اور چھونے سے؛ بہتر: گرمی سے','Worse: cold, touch; Better: warmth','Badtar: thandak, chhoonay se; Behtar: garmi se')},
   {n:'Silicea',pot:'200 / W',syms:[T('پکے ہوئے گہرے دانے','Deep matured pimples','Pakay huay gehray danay'),T('سوراخ نما نشان','Pitted scars','Surakh numa nishan'),T('جلد کی کمزوری','Weak skin','Jild ki kamzori')],mod:T('بدتر: ٹھنڈک سے؛ بہتر: گرم پانی سے','Worse: cold; Better: warm water','Badtar: thandak se; Behtar: garam pani se')},
   {n:'Kali Brom',pot:'30 / BD',syms:[T('چہرہ، کندھے اور پیٹھ پر','On face, shoulders, back','Chehra, kandhay aur peeth par'),T('ذہنی دباؤ سے بڑھنا','Worse with mental stress','Zehni dabao se barhna'),T('نشان ڈال دینا','Leaves marks','Nishan daal dena')],mod:T('بدتر: فکرمی سے؛ بہتر: آرام سے','Worse: worry; Better: rest','Badtar: fikri se; Behtar: aaram se')},
   {n:'Berberis Aq',pot:'Q / BD',syms:[T('دانوں کے سیاہ نشان','Dark marks of pimples','Danon ke siyah nishan'),T('جلد کی رنگت صاف کرتا ہے','Clears skin complexion','Jild ki rangat saaf karta hai'),T('چکنائی والی جلد','Oily skin','Chiknai wali jild')],mod:T('باقاعدہ استعمال بہتر','Regular use better','Baqaida istemal behtar')}
 ]},
 corn:{sys:'skin',ic:'🦶',name:T('کور (گھٹیا)','Corn','Corn (Ghathia)'),
  syms:[T('پاؤں کی سخت گاٹھی','Hard lump on foot','Paon ki sakht gaanth'),T('دباؤ میں درد','Pain on pressure','Dabao mein dard'),T('پیلا مرکز','Yellow core','Peela markaz'),T('چلنے میں دقت','Difficulty walking','Chalne mein diqqat')],
  intro:T('جوتے کے دباؤ سے جلد کی سخت گاٹھی۔','Hard skin lump from shoe pressure.','Jootay ke dabao se jild ki sakht gaanth.'),
  diet:T('نرم جوتے۔','Soft shoes.','Narm jootay.'),
  rf:T('شوگر مریض — فوٹ کیئر ضروری!','Diabetic — foot care essential!','Sugar mareez — foot care zaroori!'),
  rem:[
   {n:'Antimonium Crud',pot:'200 / W',syms:[T('جوتے کے دباؤ والی سخت گاٹھی','Hard corn from shoe pressure','Jootay ke dabao wali sakht gaanth'),T('دباؤ میں درد، چلنا مشکل','Painful on pressure, walking hard','Dabao mein dard, chalna mushkil'),T('زبان پر سفید تہہ','White coated tongue','Zaban par safaid taha')],mod:T('بدتر: گرمی اور دباؤ سے؛ بہتر: آرام سے','Worse: heat, pressure; Better: rest','Badtar: garmi, dabao se; Behtar: aaram se')},
   {n:'Thuja',pot:'200 / W',syms:[T('پکے سخت گول گاٹھی','Hard round corn','Pakay sakht gol gaanth'),T('پیلا رنگ','Yellowish color','Peela rang'),T('پسینہ میں میٹھی بدبو','Sweet odor of sweat','Paseena mein mithi badboo')],mod:T('بدتر: نمی سے؛ بہتر: خشکی سے','Worse: damp; Better: dry','Badtar: nami se; Behtar: khushki se')},
   {n:'Graphites',pot:'30 / BD',syms:[T('خشک سخت گاٹھی','Dry hard corn','Khushk sakht gaanth'),T('جلد کی دراڑیں','Skin cracks','Jild ki daradein'),T('موٹاپے کے ساتھ','With obesity','Motapay ke sath')],mod:T('بدتر: سردی و نمی سے؛ بہتر: گرمی سے','Worse: cold damp; Better: warmth','Badtar: sardi nami se; Behtar: garmi se')}
 ]},
 leukorrhea:{sys:'women',ic:'🩸',name:T('لیوکوریا','Leukorrhea','Leukorrhea'),
  syms:[T('سفید اخراج','White discharge','Safaid ikhraj'),T('کمزوری','Weakness','Kamzori'),T('کمر درد','Backache','Kamar dard'),T('جلن','Burning','Jalan')],
  intro:T('خواتین کا سفید اخراج — کمزوری اور صفائی سے۔','White vaginal discharge — from weakness and poor hygiene.','Khawateen ka safaid ikhraj — kamzori aur safai se.'),
  diet:T('صفائی، پہنا، کمزوری پوری کریں۔','Hygiene, cotton clothing, treat anemia.','Safai, soot kapray, kamzori puri karein.'),
  rf:T('خون ملے تو معائنہ','If blood mixed — examination','Khoon milay to muaina'),
  rem:[
   {n:'Sepia',pot:'200 / W',syms:[T('سفید، دودھ جیسا اخراج','Milky white discharge','Safaid doodh jaisa ikhraj'),T('کمر کے نچلے حصے کا درد','Low back pain','Kamar ke nichlay hissay ka dard'),T('ڈگھے کا احساس، جھکنا ناگوار','Sagging feeling, bending intolerable','Dhagay ka ehsas, jhukna nagawar')],mod:T('بدتر: ڈگھے اور دھوپ سے؛ بہتر: تیز حرکت سے','Worse: prolapse feeling, sun; Better: vigorous motion','Badtar: dhagay, dhoop se; Behtar: tez harkat se')},
   {n:'Calcarea Carb',pot:'200 / W',syms:[T('دودھ جیسا بے بو اخراج','Odorless milky discharge','Doodh jaisa be-boo ikhraj'),T('ٹھنڈ لگنا، پیروں کا پسینہ','Chilly, sweaty feet','Thand lagna, pairon ka paseena'),T('موٹا سست مزاج','Fat flabby constitution','Mota sust mizaj')],mod:T('بدتر: نمی اور دودھ سے؛ بہتر: خشکی سے','Worse: damp, milk; Better: dryness','Badtar: nami, doodh se; Behtar: khushki se')},
   {n:'Pulsatilla',pot:'30 / BD',syms:[T('سبز پیلا اخراج','Greenish yellow discharge','Sabz peela ikhraj'),T('مزاج بدلتا، رونا آئے','Changeable mood, weepy','Mizaj badalta, rona aaye'),T('کھلی ہوا کی خواہش','Desire for open air','Khuli hawa ki khwahish')],mod:T('بدتر: گرم کمرہ اور چکنائی سے؛ بہتر: کھلی ہوا سے','Worse: warm room, fats; Better: open air','Badtar: garam kamra, chiknai se; Behtar: khuli hawa se')},
   {n:'Borax',pot:'30 / BD',syms:[T('گرمی اور داغ والا اخراج','Hot discharge with staining','Garmi aur dagh wala ikhraj'),T('ماہواری سے پہلے درد','Pain before menses','Mahwari se pehle dard'),T('نیچے اترنے کا خوف','Fear of downward motion','Neeche utarne ka khauf')],mod:T('بدتر: نیچے اترنے سے؛ بہتر: —','Worse: downward motion; Better: —','Badtar: neeche utarne se; Behtar: —')}
 ]},
 amenorrhea:{sys:'women',ic:'🩸',name:T('حیض بند ہونا','Amenorrhea','Haiz Band Hona'),
  syms:[T('مدت گزرنا','Missed period','Muddat guzarna'),T('کمزوری','Weakness','Kamzori'),T('سر درد','Headache','Sar dard'),T('موڈ بدلنا','Mood changes','Mood badalna')],
  intro:T('حیض کا آنا بند — خون کی کمی، تناؤ یا ہارمون۔','Stopped menses — anemia, stress or hormones.','Haiz ka ana band — khoon ki kami, tanao ya hormone.'),
  diet:T('آئرن والی غذا، آرام۔','Iron rich diet, rest.','Iron wali ghiza, aaram.'),
  rf:T('پہلے حمل کا امکان چیک!','Rule out pregnancy first!','Pehle hamal ka imkan check!'),
  rem:[
   {n:'Pulsatilla',pot:'30 / BD',syms:[T('ماہواری دیر سے اور کم','Delayed scanty menses','Mahwari der se aur kam'),T('مزاج متاثر، رونا آئے','Emotional, weepy','Mizaj mutasir, rona aaye'),T('گرمی ناگوار','Heat intolerable','Garmi nagawar')],mod:T('بدتر: گرم کمرہ، چکنائی سے؛ بہتر: کھلی ہوا سے','Worse: warm room, fats; Better: open air','Badtar: garam kamra, chiknai se; Behtar: khuli hawa se')},
   {n:'Sepia',pot:'200 / W',syms:[T('حیض بند یا نہایت کم','Suppressed or very scanty menses','Haiz band ya nahayat kam'),T('ڈگھے کا احساس','Prolapse sensation','Dhagay ka ehsas'),T('دھوپ میں بگڑنا','Worse in sun','Dhoop mein bigarna')],mod:T('بدتر: دھوپ اور ڈگھے سے؛ بہتر: تیز حرکت سے','Worse: sun, sagging; Better: vigorous exercise','Badtar: dhoop, dhagay se; Behtar: tez harkat se')},
   {n:'Ferrum Met',pot:'30 / BD',syms:[T('خون کی کمی کے ساتھ','With anemia','Khoon ki kami ke sath'),T('چہرہ بے وقت پیلا سرخ','Pale flushing face','Chehra be-waqt peela surkh'),T('عمومی کمزوری','General weakness','Umoomi kamzori')],mod:T('بدتر: رات اور جسم ہلکانے سے؛ بہتر: آہستہ چلنے سے','Worse: night, loss of fluids; Better: slow walking','Badtar: raat, jism hilkanay se; Behtar: aahista chalne se')},
   {n:'Senecio',pot:'Q / BD',syms:[T('حیض کا مکمل بند ہونا','Complete suppression of menses','Haiz ka mukammal band hona'),T('گرمی اور جلن','Heat and burning','Garmi aur jalan'),T('بھوک کم','Poor appetite','Bhook kam')],mod:T('باقاعدہ کورس بہتر','Regular course better','Baqaida course behtar')}
 ]},
 fibroid:{sys:'women',ic:'🩸',name:T('رحم کی گاٹھی','Uterine Fibroid','Reham ki Gaanth'),
  syms:[T('زیادہ خون','Heavy bleeding','Zyada khoon'),T('گاٹھی کا احساس','Mass sensation','Gaanth ka ehsas'),T('پیشاب بار بار','Frequent urination','Peshab bar bar'),T('کمزوری','Weakness','Kamzori')],
  intro:T('رحم کی غیر سرطانی گاٹھی — سائز کے مطابق علاج۔','Non-cancerous uterine mass — treat per size.','Reham ki ghair sartani gaanth — size ke mutabiq ilaj.'),
  diet:T('آئرن، آرام۔','Iron, rest.','Iron, aaram.'),
  rf:T('الٹرا ساؤنڈ باقاعدہ — سائز بڑھے تو معائنہ','Regular ultrasound — examine if growing','Ultrasound baqaida — size barhay to muaina'),
  rem:[
   {n:'Fraxinus Am',pot:'Q / BD',syms:[T('رحم کا ٹونک','Uterine tonic','Reham ka tonic'),T('بھاری پن اور درد','Heaviness and pain','Bhari pan aur dard'),T('ماہواری میں کمی','Scanty menses','Mahwari mein kami')],mod:T('ٹونک — باقاعدہ کورس بہتر','Tonic — regular course better','Tonic — baqaida course behtar')},
   {n:'Sepia',pot:'200 / W',syms:[T('بھاری بوجھ کا احساس','Heavy bearing-down feeling','Bhari bojh ka ehsas'),T('ڈگھا','Prolapse feeling','Dhaga'),T('ماہواری زیادہ دردناک','Painful heavy menses','Mahwari zyada dardnak')],mod:T('بدتر: ڈگھے سے؛ بہتر: تیز حرکت سے','Worse: prolapse; Better: vigorous motion','Badtar: dhagay se; Behtar: tez harkat se')},
   {n:'Calc Carb',pot:'200 / W',syms:[T('سخت گاٹھی','Hard fibroid','Sakht gaanth'),T('ٹھنڈا پسینہ والا مزاج','Chilly sweaty constitution','Thanda paseena wala mizaj'),T('خوف زیادہ','Fearful','Khauf zyada')],mod:T('بدتر: نمی سے؛ بہتر: خشکی سے','Worse: damp; Better: dry','Badtar: nami se; Behtar: khushki se')},
   {n:'Thlaspi',pot:'Q / BD',syms:[T('ماہواری بہت زیادہ اور دیر تک','Profuse prolonged menses','Mahwari bohat zyada aur der tak'),T('لوتھڑے کا درد','Cramping pain','Lothray ka dard'),T('خون کی کمی','Anemia','Khoon ki kami')],mod:T('باقاعدہ نگرانی ضروری','Regular monitoring essential','Baqaida nigrai zaroori')}
 ]},
 asthma:{sys:'resp',ic:'🫁',name:T('دمہ','Asthma','Dama'),
  syms:[T('سانس تنگ','Shortness of breath','Saans tang'),T('سیٹی','Wheezing','Seeti'),T('رات کو کھانسی','Night cough','Raat ko khansi'),T('سینی بھاری','Chest tightness','Seena bhari')],
  intro:T('سانس کی نالیاں تنگ — رات اور دھول سے بڑھتا ہے۔','Constricted airways — worse at night and from dust.','Saans ki naliyan tang — raat aur dhool se barhta hai.'),
  diet:T('دھول/دھواں بند، ٹھنڈا پانی کم۔','Avoid dust/smoke, less cold water.','Dhool/dhuan band, thanda pani kam.'),
  rf:T('ہونٹ نیلے = فوری ایمرجنسی','Blue lips = emergency','Hont neelay = fori emergency'),
  rem:[
   {n:'Arsenicum',pot:'200 / OD',syms:[T('رات 12 سے 2 بجے شدید','Worse 12 to 2 am','Raat 12 se 2 baje shadeed'),T('بیٹھ کر سانس، بے چینی','Sits up to breathe, restless','Baith kar saans, bechaini'),T('پیاس تھوڑا تھوڑا','Sips of water','Thora thora pyas')],mod:T('بدتر: آدھی رات، ٹھنڈک سے؛ بہتر: گرمی اور اونچا سر','Worse: midnight, cold; Better: warmth, head elevated','Badtar: adhi raat, thandak se; Behtar: garmi, ooncha sar')},
   {n:'Ipecac',pot:'30 / BD',syms:[T('سانس میں خرر، بلغم زیادہ','Rattling breath, much mucus','Saans mein kharhar, balghum zyada'),T('مسلسل متلی','Constant nausea','Musalsal mutli'),T('سانس پھولنا مگر بلغم نہ اترنا','Grunting breath, no expectoration','Saans phoolna magar balghum na utarna')],mod:T('بدتر: کھانے کے بعد؛ بہتر: کھلی ہوا سے','Worse: after eating; Better: open air','Badtar: khane ke baad; Behtar: khuli hawa se')},
   {n:'Blatta',pot:'Q / BD',syms:[T('دمے کا خاص ٹونک','Specific asthma tonic','Damay ka khas tonic'),T('سخت بلغم','Tenacious mucus','Sakht balghum'),T('کمزوری والا دمہ','Asthma with weakness','Kamzori wala dama')],mod:T('ٹونک — دورے کے بعد باقاعدہ','Tonic — regular after attacks','Tonic — dauray ke baad baqaida')},
   {n:'Antim Tart',pot:'30 / BD',syms:[T('سیٹی جیسی آواز','Whistling sound','Seeti jaisi awaz'),T('بلغم نیچے نہ آئے','Mucus does not come up','Balghum neeche na aaye'),T('بزرگ اور کمزور مریض','Elderly weak patients','Buzurg kamzor mareez')],mod:T('بدتر: آرام اور گرمی سے؛ بہتر: ٹھنڈی کھلی ہوا اور بیٹھ کر','Worse: rest, warmth; Better: cool open air, sitting','Badtar: aaram, garmi se; Behtar: thandi khuli hawa, baith kar')}
 ]},
 fever:{sys:'general',ic:'🌡️',name:T('بخار','Fever','Bukhar'),
  syms:[T('تیز حرارت','High temperature','Tez hararat'),T('کپکپی','Chills','Kapkapi'),T('جسم درد','Body ache','Jism dard'),T('سر درد','Headache','Sar dard')],
  intro:T('بخار — وائرس، انفیکشن یا موسم سے۔','Fever — virus, infection or weather.','Bukhar — virus, infection ya mausam se.'),
  diet:T('آرام، مائعات زیادہ۔','Rest, plenty of fluids.','Aaram, maiyate zyada.'),
  rf:T('5 دن سے زیادہ یا بچے — ٹیسٹ','Over 5 days or children — test','5 din se zyada ya bachay — test'),
  rem:[
   {n:'Aconite',pot:'200 / OD',syms:[T('اچانک تیز بخار','Sudden high fever','Achanak tez bukhar'),T('سردی لگنے اور خوف کے بعد','After chill and fright','Sardi lagnay aur khauf ke baad'),T('خشک گرم جلد، دھڑکن تیز','Dry hot skin, rapid pulse','Khushk garam jild, dharkan tez')],mod:T('بدتر: رات اور گرم کمرے سے؛ بہتر: پسینہ آنے پر','Worse: night, warm room; Better: on sweating','Badtar: raat, garam kamray se; Behtar: paseena anay par')},
   {n:'Belladonna',pot:'30 / BD',syms:[T('سرخ گرم جلد','Red hot skin','Surkh garam jild'),T('دھڑکتا سر درد','Throbbing headache','Dharkta sar dard'),T('روشنی اور شور ناگوار','Light and noise intolerable','Roshni aur shor nagawar')],mod:T('بدتر: چھونا، روشنی، جھٹکے سے؛ بہتر: ٹھنڈک سے','Worse: touch, light, jar; Better: cold','Badtar: chhoona, roshni, jhatka se; Behtar: thandak se')},
   {n:'Rhus Tox',pot:'30 / BD',syms:[T('کپکپی والا بخار','Chilly fever','Kapkapi wala bukhar'),T('پورا جسم درد','Whole body ache','Poora jism dard'),T('سردی نمی سے شروع','Starts from cold damp','Sardi nami se shuru')],mod:T('بدتر: آرام سے؛ بہتر: حرکت اور خشکی سے','Worse: rest; Better: motion, dry','Badtar: aaram se; Behtar: harkat, khushki se')},
   {n:'Gelsemium',pot:'30 / BD',syms:[T('شدید کمزوری، پلکیں بھاری','Profound weakness, heavy eyelids','Shadeed kamzori, palkain bhari'),T('بغیر پیاس کپکپی','Chills without thirst','Baghair pyas kapkapi'),T('سستی اور بے حسی','Dullness and apathy','Susti aur be-hasi')],mod:T('بدتر: خبر بدلنے اور نمی سے؛ بہتر: پیشاب آنے کے بعد','Worse: damp weather, emotions; Better: after urination','Badtar: mausam badalne, nami se; Behtar: peshab ke baad')}
 ]},
 inflammation:{sys:'general',ic:'🦵',name:T('سوزش','Inflammation','Sozish'),
  syms:[T('سرخی','Redness','Surkhi'),T('گرمی','Heat','Garmi'),T('سوجن','Swelling','Sojan'),T('درد','Pain','Dard')],
  intro:T('جسم کے کسی حصے کی سوزش — انفیکشن یا چوٹ سے۔','Inflammation of any body part — infection or injury.','Jism ke kisi hissay ki sozish — infection ya chot se.'),
  diet:T('آرام، ٹھنڈی پٹی (بعض صورتوں میں گرم)۔','Rest, cold pack (warm in some cases).','Aaram, thandi patti (kis sooraton mein garam).'),
  rf:T('سوزش پھیلے + بخار','Spreading inflammation with fever','Sozish phailay + bukhar'),
  rem:[
   {n:'Belladonna',pot:'30 / BD',syms:[T('اچانک تیز سوزش','Sudden intense inflammation','Achanak tez sozish'),T('سرخ گرم چمکتی سوجن','Red hot shining swelling','Surkh garam chamakti sojan'),T('دھڑکتا درد','Throbbing pain','Dharkta dard')],mod:T('بدتر: چھونا، حرکت سے؛ بہتر: ٹھنڈی پٹی سے','Worse: touch, motion; Better: cold pack','Badtar: chhoona, harkat se; Behtar: thandi patti se')},
   {n:'Apis Mel',pot:'30 / BD',syms:[T('جلدی سرخ سوجن','Red edematous swelling','Jildi surkh sojan'),T('جلی لگتی، چھونا ناگوار','Stinging, tender to touch','Jali lagti, chhoona nagawar'),T('پانی جیسا جمع پن','Watery puffiness','Pani jaisa jama pan')],mod:T('بدتر: گرمی، چھونے سے؛ بہتر: ٹھنڈک سے','Worse: heat, touch; Better: cold','Badtar: garmi, chhoonay se; Behtar: thandak se')},
   {n:'Bryonia',pot:'30 / BD',syms:[T('حرکت سے بڑھنے والی سوزش','Inflammation worse by motion','Harkat se barhnay wali sozish'),T('سوجن سخت','Hard swelling','Sojan sakht'),T('پیاس زیادہ','Much thirst','Pyas zyada')],mod:T('بدتر: کسی حرکت سے؛ بہتر: سکون، ٹھنڈک سے','Worse: any motion; Better: rest, cold','Badtar: kisi harkat se; Behtar: sukoon, thandak se')},
   {n:'Ferr Phos',pot:'30 / 2H',syms:[T('شروع کی سوزش','First stage inflammation','Shuru ki sozish'),T('ہلکا بخار ساتھ','Mild fever along','Halka bukhar sath'),T('گلے/کان کی ابتدائی سوزش','Early throat/ear inflammation','Galay/kan ki ibtadai sozish')],mod:T('بدتر: حرکت، رات سے؛ بہتر: ٹھنڈک سے','Worse: motion, night; Better: cold','Badtar: harkat, raat se; Behtar: thandak se')}
 ]},
 swelling:{sys:'general',ic:'🦵',name:T('سوجن (ایڈیما)','Swelling / Edema','Sojan (Edema)'),
  syms:[T('پاؤں سوجن','Swollen feet','Paon sojan'),T('دباؤ سے نشان','Pitting on pressure','Dabao se nishan'),T('وزن بڑھنا','Weight gain','Wazan barhna'),T('پیشاب کم','Less urination','Peshab kam')],
  intro:T('جسم میں پانی جمع — گردہ، دل یا کمزوری سے۔','Water retention — kidney, heart or weakness.','Jism mein pani jamay — gurda, dil ya kamzori se.'),
  diet:T('نمک کم، پانی معمول کے مطابق۔','Less salt, normal water intake.','Namak kam, pani mamool ke mutabiq.'),
  rf:T('سانس تنگ یا سینے کی سوجن — فوری','Breathlessness or chest edema — urgent','Saans tang ya seenay ki sojan — fori'),
  rem:[
   {n:'Apis Mel',pot:'30 / BD',syms:[T('جلدی سفید گلابی سوجن','Pale pinkish puffy swelling','Jildi safaid gulabi sojan'),T('جلی لگتی','Stinging sensation','Jali lagti'),T('پانی جیسا جمع پن','Watery puffiness','Pani jaisa jama pan')],mod:T('بدتر: گرمی، چھونے سے؛ بہتر: ٹھنڈک سے','Worse: heat, touch; Better: cold','Badtar: garmi, chhoonay se; Behtar: thandak se')},
   {n:'Arsenicum',pot:'30 / BD',syms:[T('کمزوری والی سوجن','Edema with weakness','Kamzori wali sojan'),T('رات کو بگڑنا','Worse at night','Raat ko bigarna'),T('پیاس تھوڑا تھوڑا','Sips of water','Thora thora pyas')],mod:T('بدتر: آدھی رات، ٹھنڈک سے؛ بہتر: گرمی سے','Worse: midnight, cold; Better: warmth','Badtar: adhi raat, thandak se; Behtar: garmi se')},
   {n:'Nat Mur',pot:'200 / W',syms:[T('پانی جمع، ہلکی سوجن','Water retention, mild swelling','Pani jamay, halki sojan'),T('کمزوری، منہ میں لار','Weakness, salivation','Kamzori, munh mein laar'),T('دھوپ سے سر درد','Sun headache','Dhoop se sar dard')],mod:T('بدتر: دھوپ اور سمندری ہوا سے؛ بہتر: کھلی ہوا سے','Worse: sun, seaside; Better: open air','Badtar: dhoop, samandari hawa se; Behtar: khuli hawa se')},
   {n:'Solidago',pot:'Q / BD',syms:[T('گردوں کا ٹونک','Kidney tonic','Gurdon ka tonic'),T('پیشاب کم اور گہرا','Scanty dark urine','Peshab kam aur gehra'),T('کمر کا نچلا حصہ بھاری','Heavy low back','Kamar ka nichla hissa bhari')],mod:T('باقاعدہ کورس بہتر','Regular course better','Baqaida course behtar')}
 ]},
 migraine:{sys:'nerves',ic:'🧠',name:T('آدھے سر درد','Migraine','Aadhay Sar Dard'),
  syms:[T('آدھا سر','One sided head','Aadha sar'),T('متلی','Nausea','Mutli'),T('روشنی سے تکلیف','Light sensitivity','Roshni se takleef'),T('آنکھ کے پیچھے درد','Pain behind eye','Aankh ke peechay dard')],
  intro:T('نصف سر کا دھڑکتا درد — روشنی/شور سے بڑھتا ہے۔','One-sided throbbing headache — worse from light/noise.','Nim sar ka dharkta dard — roshni/shor se barhta hai.'),
  diet:T('نشتراقی چیز، خالی پیٹ نہ رہیں۔','Avoid triggers, do not stay empty stomach.','Triggers chhorein, khali pait na rahein.'),
  rf:T('زندگی کا بدترین سر درد — فوری','Worst headache of life — urgent','Zindagi ka badtar sar dard — fori'),
  rem:[
   {n:'Belladonna',pot:'200 / OD',syms:[T('دھڑکتا آدھے سر کا درد','Throbbing one-sided headache','Dharkta aadhay sar ka dard'),T('سرخ چہرہ، گرمی','Red hot face','Surkh chehra, garmi'),T('روشنی اور شور ناگوار','Light and noise intolerable','Roshni aur shor nagawar')],mod:T('بدتر: روشنی، شور، جھٹکے سے؛ بہتر: دباؤ اور ٹھنڈک سے','Worse: light, noise, jar; Better: pressure, cold','Badtar: roshni, shor, jhatka se; Behtar: dabao, thandak se')},
   {n:'Iris T',pot:'30 / BD',syms:[T('در سے پہلے آنکھوں میں دھبے','Visual aura before attack','Dauray se pehle aankhon mein dhabbay'),T('شدید متلی و قے','Intense nausea and vomiting','Shadeed mutli o qay'),T('خاص طور پر دائیں طرف','Mainly right sided','Khas taur par dahin taraf')],mod:T('بدتر: ہفتہ وار آرام سے؛ بہتر: حرکت سے','Worse: weekly rest periods; Better: motion','Badtar: hafta war aaram se; Behtar: harkat se')},
   {n:'Nat Mur',pot:'200 / W',syms:[T('دوپہر 11 سے 3 بجے درد','Headache 11 am to 3 pm','Dopahar 11 se 3 baje dard'),T('آنسوؤں کے ساتھ چبھتا درد','Stitching pain with tears','Ansoon ke sath chubhta dard'),T('چمک جیسے برف کے ٹکڑے','Glitter like ice fragments','Chamak jaisay barf ke tukray')],mod:T('بدتر: دھوپ اور 10-11 صبح سے؛ بہتر: کھلی ہوا سے','Worse: sun, 10-11 am; Better: open air','Badtar: dhoop, 10-11 subah se; Behtar: khuli hawa se')},
   {n:'Glonoinum',pot:'30 / BD',syms:[T('سر میں دھڑکن اور گرمی','Pulsation and heat in head','Sar mein dharkan aur garmi'),T('سر اونچا رکھنا بہتر','Better with head elevated','Sar ooncha rakhna behtar'),T('بولتے ہوئے بگڑتا','Worse while talking','Bolte hue bigarta')],mod:T('بدتر: دھوپ اور شراب سے؛ بہتر: سر اونچا اور ٹھنڈک','Worse: sun, alcohol; Better: head high, cold','Badtar: dhoop, sharab se; Behtar: sar ooncha, thandak')}
 ]},
 headache:{sys:'nerves',ic:'💥',name:T('سر درد','Headache','Sar Dard'),
  syms:[T('پیشانی','Forehead','Peshani'),T('دباؤ','Pressure','Dabao'),T('دھڑکن','Throbbing','Dharkan'),T('قبض ساتھ','Constipation along','Qabz sath')],
  intro:T('عام سر درد — تناؤ، قبض یا موسم سے۔','Common headache — tension, constipation or weather.','Aam sar dard — tanao, qabz ya mausam se.'),
  diet:T('آرام، پانی، نیند۔','Rest, water, sleep.','Aaram, pani, neend.'),
  rf:T('بخار + گردن اکڑے — فوری','Fever with stiff neck — urgent','Bukhar + gardan akray — fori'),
  rem:[
   {n:'Bryonia',pot:'30 / BD',syms:[T('پیشانی بھاری، حرکت ناگوار','Heavy forehead, motion intolerable','Peshani bhari, harkat nagawar'),T('آنکھیں بند رکھنا بہتر','Better keeping eyes closed','Aankhein band rakhna behtar'),T('پیاس زیادہ','Much thirst','Pyas zyada')],mod:T('بدتر: ہر حرکت سے؛ بہتر: دباؤ اور سکون سے','Worse: any motion; Better: pressure, rest','Badtar: har harkat se; Behtar: dabao, sukoon se')},
   {n:'Belladonna',pot:'30 / BD',syms:[T('دھڑکتا، اچانک شروع','Throbbing, sudden onset','Dharkta, achanak shuru'),T('چہرہ سرخ','Red face','Chehra surkh'),T('روشنی ناگوار','Light intolerable','Roshni nagawar')],mod:T('بدتر: روشنی، شور سے؛ بہتر: ٹھنڈک سے','Worse: light, noise; Better: cold','Badtar: roshni, shor se; Behtar: thandak se')},
   {n:'Gelsemium',pot:'30 / BD',syms:[T('آنکھوں تک بھاری درد','Heavy pain to eyes','Aankhon tak bhari dard'),T('پیچھے سے پیشانی تک','From occiput to forehead','Peechay se peshani tak'),T('پلکیں جھکتی','Drooping eyelids','Palkain jhukti')],mod:T('بدتر: خبر بدلنے، نمی سے؛ بہتر: پیشاب کے بعد','Worse: weather change, damp; Better: after urination','Badtar: mausam badalne, nami se; Behtar: peshab ke baad')},
   {n:'Nat Mur',pot:'30 / BD',syms:[T('جیسے چھوٹے ہتھوڑے مارتے','Like little hammers striking','Jaisay chhote hathoray martay'),T('تناؤ اور غم کے بعد','After tension and grief','Tanao aur gham ke baad'),T('آنکھوں میں جلتے آنسو','Burning tears','Aankhon mein jaltay aansoo')],mod:T('بدتر: دھوپ اور 10-11 بجے سے؛ بہتر: کھلی ہوا سے','Worse: sun, 10-11 am; Better: open air','Badtar: dhoop, 10-11 baje se; Behtar: khuli hawa se')}
 ]},
 anxiety:{sys:'nerves',ic:'😟',name:T('گھبراہٹ + معدہ','Anxiety with Gastric','Ghabrahat + Meda'),
  syms:[T('گھبراہٹ','Anxiety','Ghabrahat'),T('دل تیز','Palpitation','Dil tez'),T('معدہ خراب','Upset stomach','Meda kharab'),T('نیند ٹوٹنا','Broken sleep','Neend tootna')],
  intro:T('ذہنی دباؤ معدے پر اترتا ہے — دونوں ساتھ علاج۔','Mental stress reflects on stomach — treat both.','Zehni dabao meday par utarta hai — dono sath ilaj.'),
  diet:T('چائے/کیفین کم، سوندے وقت آرام۔','Less tea/caffeine, relax before sleep.','Chai/caffeine kam, soney waqt aaram.'),
  rf:T('سینی درد ساتھ ہو — فوری','Chest pain along — urgent','Seena dard sath ho — fori'),
  rem:[
   {n:'Argentum Nit',pot:'30 / BD',syms:[T('جلد بازی، فوراً جانے کی خواہش','Hurry, wants things done fast','Jaldi bazi, fauran janay ki khwahish'),T('اونچی جگہ کا خوف','Fear of high places','Oonchi jagah ka khauf'),T('مٹھائی سے معدہ خراب','Sweets upset stomach','Mithai se meda kharab')],mod:T('بدتر: گرمی اور مٹھائی سے؛ بہتر: ٹھنڈک، کھلی ہوا سے','Worse: heat, sweets; Better: cold, open air','Badtar: garmi, mithai se; Behtar: thandak, khuli hawa se')},
   {n:'Gelsemium',pot:'30 / BD',syms:[T('کپکپی اور کمزوری','Trembling and weakness','Kapkapi aur kamzori'),T('نیند نہ آئے مگر سستی','Sleepless yet drowsy','Neend na aaye magar susti'),T('خبر سنتے ہی پانی بہہ آئے','Diarrhea from bad news','Khabar suntay hi pani beh aaye')],mod:T('بدتر: خبر اور نمی سے؛ بہتر: پیشاب کے بعد','Worse: news, damp; Better: after urination','Badtar: khabar, nami se; Behtar: peshab ke baad')},
   {n:'Arsenicum',pot:'200 / W',syms:[T('رات کا خوف، اکیلے ڈر','Night fear, fear of solitude','Raat ka khauf, akeley dar'),T('بے چینی، جگہ بدلتا','Restless, changes place','Bechaini, jagah badalta'),T('کمزوری','Prostration','Kamzori')],mod:T('بدتر: آدھی رات، ٹھنڈک سے؛ بہتر: گرمی اور رفاقت سے','Worse: midnight, cold; Better: warmth, company','Badtar: adhi raat, thandak se; Behtar: garmi, rifaqat se')},
   {n:'Kali Phos',pot:'30 / BD',syms:[T('اعصابی تھکاوٹ','Nervous exhaustion','Aasabi thakawat'),T('ذہنی کام کے بعد سر درد','Headache after mental work','Zehni kam ke baad sar dard'),T('نیند میں بے چینی','Restless sleep','Neend mein bechaini')],mod:T('بہتر: آرام اور غذائیت سے','Better: rest and nutrition','Behtar: aaram aur ghizaiyat se')}
 ]},
 impotence:{sys:'male',ic:'♂️',name:T('نامردی','Impotence','Namardi'),
  syms:[T('کمزوری','Weakness','Kamzori'),T('خواہش کم','Low desire','Khwahish kam'),T('جلدی','Premature','Jaldi'),T('اضطراب','Anxiety','Iztirab')],
  intro:T('جنسی کمزوری — ذہنی دباؤ، ہارمون یا شوگر سے۔','Sexual weakness — stress, hormones or diabetes.','Jinsi kamzori — zehni dabao, hormone ya sugar se.'),
  diet:T('آرام، ورزش، تناؤ کم۔','Rest, exercise, less stress.','Aaram, warzish, tanao kam.'),
  rf:T('شوگر/ہارمون ٹیسٹ ضروری','Sugar/hormone tests essential','Sugar/hormone test zaroori'),
  rem:[
   {n:'Agnus Castus',pot:'Q / BD',syms:[T('خواہش میں کمی','Diminished desire','Khwahish mein kami'),T('عضو ٹھنڈا محسوس','Parts feel cold','Uzoo thanda mehsoos'),T('ذہنی دباؤ اور غم','Mental stress and sadness','Zehni dabao aur gham')],mod:T('دیرپا استعمال میں بہتری','Improves with prolonged use','Derpa istemal mein behtari')},
   {n:'Yohimbinum',pot:'Q / BD',syms:[T('خواہش و طاقت بڑھتی','Increases desire and power','Khwahish o taqat barhti'),T('اعصابی کمزوری','Nervous weakness','Aasabi kamzori'),T('ٹونک کے طور پر','As a tonic','Tonic ke taur par')],mod:T('ٹونک — باقاعدہ کورس بہتر','Tonic — regular course better','Tonic — baqaida course behtar')},
   {n:'Lycopodium',pot:'200 / W',syms:[T('جلدی اختتام','Premature ending','Jaldi ikhtitam'),T('اعتماد کی کمی','Low confidence','Aitmad ki kami'),T('گیس اور پیٹ پھولاؤ','Gas and bloating','Gas aur pait phoolao')],mod:T('بدتر: شام 4-8 بجے؛ بہتر: گرم مشروب سے','Worse: 4-8 pm; Better: warm drinks','Badtar: sham 4-8 baje; Behtar: garam mashroob se')},
   {n:'Selenium',pot:'30 / BD',syms:[T('جسم کی تھکاوٹ','Easy fatigue of body','Jism ki thakawat'),T('پسینے کی بدبو اور جلدی خارش','Offensive sweat, skin itching','Paseenay ki badboo, jildi khujli'),T('خواہش ہے مگر طاقت کم','Desire present but weak power','Khwahish hai magar taqat kam')],mod:T('بدتر: گرمی سے؛ بہتر: آرام سے','Worse: heat; Better: rest','Badtar: garmi se; Behtar: aaram se')}
 ]},
 kidney:{sys:'renal',ic:'🫘',name:T('گردے کی پتھری','Kidney Stone','Gurday ki Pathri'),
  syms:[T('کمر سے پیٹھ تک درد','Loin to groin pain','Kamar se peeth tak dard'),T('پیشاب جلن','Burning urination','Peshab jalan'),T('متلی','Nausea','Mutli'),T('پیشاب میں خون','Blood in urine','Peshab mein khoon')],
  intro:T('گردے/مثانے کی پتھری — درد کے تیز دورے۔','Kidney/bladder stones — intense pain attacks.','Gurday/masanay ki pathri — dard ke tez dauray.'),
  diet:T('پانی زیادہ، ٹماٹر/پالک کم۔','More water, less tomato/spinach.','Pani zyada, tamatar/palak kam.'),
  rf:T('بخار + بند پیشاب — فوری','Fever with blocked urine — urgent','Bukhar + band peshab — fori'),
  rem:[
   {n:'Berberis Vul',pot:'Q / BD',syms:[T('بائیں طرف درد','Left sided pain','Baain taraf dard'),T('درد کمر سے مثانے تک بیل کی طرح','Pain radiates loin to bladder like a cord','Dard kamar se masanay taq bail ki tarah'),T('پیشاب جلن و تلچھٹ','Burning urine with sediment','Peshab jalan o tilchhat')],mod:T('بدتر: حرکت اور جھٹکے سے؛ بہتر: سکون سے','Worse: motion, jar; Better: rest','Badtar: harkat, jhatka se; Behtar: sukoon se')},
   {n:'Lycopodium',pot:'200 / OD',syms:[T('دائیں طرف پتھری','Right sided stone','Dahin taraf pathri'),T('پیشاب میں ریت','Sand in urine','Peshab mein reet'),T('پیٹ پھولاؤ','Abdominal bloating','Pait phoolao')],mod:T('بدتر: شام 4-8 بجے؛ بہتر: گرم مشروب سے','Worse: 4-8 pm; Better: warm drinks','Badtar: sham 4-8 baje; Behtar: garam mashroob se')},
   {n:'Cantharis',pot:'30 / 15M',syms:[T('پیشاب میں شدید جلن','Intense burning urination','Peshab mein shadeed jalan'),T('بار بار خواہش، تھوڑا آئے','Constant urging, passes little','Bar bar khwahish, thora aaye'),T('بے چینی','Restlessness','Bechaini')],mod:T('بدتر: پیشاب سے پہلے و بعد؛ بہتر: ٹھنڈک سے','Worse: before/after urination; Better: cold','Badtar: peshab se pehle o baad; Behtar: thandak se')},
   {n:'Sarsaparilla',pot:'Q / BD',syms:[T('اخیر میں درد','Pain at close of urination','Aakhir mein dard'),T('پیشاب رک کر نکلنا','Urine flows in feeble stream','Peshab ruk kar nikalta'),T('کانتے جیسا درد','Intense cutting pain','Kantay jaisa dard')],mod:T('بہتر: بیٹھ کر پیشاب','Better: urinating while seated','Behtar: baith kar peshab')}
 ]},
 ear:{sys:'ear',ic:'👂',name:T('کان درد','Ear Pain','Kaan Dard'),
  syms:[T('درد','Pain','Dard'),T('بھنبھناہٹ','Ringing','Bhanbhnahat'),T('سماں کم','Reduced hearing','Suna kam'),T('بچوں میں رات','Night in children','Bachon mein raat')],
  intro:T('کان کا درد — سردی، گلے کے انفیکشن سے پہنچتا ہے۔','Ear pain — from cold, throat infection spread.','Kaan ka dard — sardi, galay ke infection se pahunchta hai.'),
  diet:T('سردی سے بچاؤ۔','Protect from cold.','Sardi se bachao.'),
  rf:T('پیپ یا بخار — معائنہ','Discharge or fever — examination','Peep ya bukhar — muaina'),
  rem:[
   {n:'Belladonna',pot:'30 / BD',syms:[T('اچانک تیز درد','Sudden severe pain','Achanak tez dard'),T('کان سرخ گرم','Red hot ear','Kaan surkh garam'),T('چھونا ناگوار','Tender to touch','Chhoona nagawar')],mod:T('بدتر: چھونا اور شور سے؛ بہتر: ٹھنڈک سے','Worse: touch, noise; Better: cold','Badtar: chhoona, shor se; Behtar: thandak se')},
   {n:'Chamomilla',pot:'30 / BD',syms:[T('بچے چڑچڑے، سکون نہیں','Children irritable, inconsolable','Bachay chirchiray, sukoon nahi'),T('ایک رخ درد','One sided pain','Aik rukh dard'),T('درد پر چیخیں','Screaming with pain','Dard par cheekhein')],mod:T('بدتر: رات اور گرمی سے؛ بہتر: ٹھنڈک سے','Worse: night, heat; Better: cold','Badtar: raat, garmi se; Behtar: thandak se')},
   {n:'Pulsatilla',pot:'30 / BD',syms:[T('بلغم والا درد','Catarrhal earache','Balghum wala dard'),T('سماں کم','Reduced hearing','Suna kam'),T('گرمی ناگوار','Heat intolerable','Garmi nagawar')],mod:T('بدتر: گرم کمرہ اور شام سے؛ بہتر: کھلی ٹھنڈی ہوا','Worse: warm room, evening; Better: cool open air','Badtar: garam kamra, sham se; Behtar: khuli thandi hawa')},
   {n:'Hepar Sulph',pot:'30 / BD',syms:[T('پیپ بننے کا رجحان','Tendency to suppuration','Peep banne ka rujhan'),T('ہلکی ٹھنڈ سے بگڑنا','Worse from slight chill','Halki thand se bigarna'),T('حساسیت زیادہ','Marked sensitivity','Hassasiyat zyada')],mod:T('بدتر: ٹھنڈک اور چھونے سے؛ بہتر: گرمی سے','Worse: cold, touch; Better: warmth','Badtar: thandak, chhoonay se; Behtar: garmi se')}
 ]},
 deafness:{sys:'ear',ic:'👂',name:T('بہرپن','Deafness','Behrapan'),
  syms:[T('سماں کم','Reduced hearing','Suna kam'),T('بھنبھناہٹ','Ringing','Bhanbhnahat'),T('بولنے میں دقت','Difficulty understanding','Bolne mein diqqat'),T('پانی بہنا','Discharge','Pani behna')],
  intro:T('سننے کی کمزوری — نالی بند یا اعصاب کی کمزوری۔','Hearing loss — blocked tube or nerve weakness.','Sunne ki kamzori — nali band ya aasaab ki kamzori.'),
  diet:T('کان صاف، سردی بچاؤ۔','Keep ears clean, avoid cold.','Kaan saaf, sardi bachao.'),
  rf:T('اچانک بہراپن — فوری','Sudden deafness — urgent','Achanak behrapan — fori'),
  rem:[
   {n:'Graphites',pot:'30 / BD',syms:[T('کان میں خارش اور جلی پرتیں','Itching and crusty eruptions in ear','Kaan mein khujli aur jali partain'),T('سماں کم','Reduced hearing','Suna kam'),T('جسم ٹھنڈا، موٹاپا','Cold body, obesity','Jism thanda, motapa')],mod:T('بدتر: سردی و نمی سے؛ بہتر: گرمی سے','Worse: cold damp; Better: warmth','Badtar: sardi nami se; Behtar: garmi se')},
   {n:'Kali Mur',pot:'30 / BD',syms:[T('سردی کے بعد بند نالی','Blocked tube after cold','Sardi ke baad band nali'),T('بلغم والی بہرپن','Catarrhal deafness','Balghum wali behrapan'),T('کان بھاری','Heavy ears','Kaan bhari')],mod:T('سردی والی بہرپن کی خاص دوا','Specific for cold-type deafness','Sardi wali behrapan ki khas dawa')},
   {n:'Chenopodium',pot:'Q / BD',syms:[T('بھنبھناہٹ','Buzzing tinnitus','Bhanbhnahat'),T('جزوی سماں','Partial hearing','Juzwi suna'),T('سر چکر','Vertigo','Sar chakkar')],mod:T('باقاعدہ ٹیسٹ اور نگرانی ضروری','Regular testing and monitoring essential','Baqaida test aur nigrai zaroori')},
   {n:'Verbascum',pot:'Q / BD',syms:[T('اعصابی سننا','Nerve deafness','Aasabi sunna'),T('کان خشک، خارش','Dry itchy ears','Kaan khushk, khujli'),T('بھنبھناہٹ کے ساتھ','With tinnitus','Bhanbhnahat ke sath')],mod:T('باقاعدہ کورس بہتر','Regular course better','Baqaida course behtar')}
 ]}
};

if (typeof window !== 'undefined') { window.TREATMENT_LIB = TREATMENT_LIB; window.STUDIO_SYS = STUDIO_SYS; }
