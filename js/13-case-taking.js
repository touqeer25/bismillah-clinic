// Bismillah Clinic — js/13-case-taking.js  (v3 — STYLE C: ACCORDION)
// Case Taking page: Acute (few questions) / Chronic (complete totality)
// CHRONIC (کرانک) — کلاسیکی ہومیوپیتھک کیس ٹیکنگ:
//   1) مریض کی مکمل ہسٹری  2) مینٹل جنرلز  3) فزیکل جنرلز
//   4) موڈیلیٹیز  5) پارٹیکلر علامات  => مکمل ٹوٹیلیٹی پر انفرادی دوا کا انتخاب
//
// STYLE C (اکارڈین) + نئے فیچرز:
//   • اکارڈین سیکشنز — ایک وقت میں جو چاہیں کھولیں/بند کریں (پروگرس بیج کے ساتھ)
//   • 💾 آٹو سیو — ہر کلک/ٹائپ پر localStorage میں محفوظ، صفحہ ریفریش پر بحالی
//   • ⚖️ وزن ایڈجسٹ — Kent وزن (12/11/10/9/6) ڈاکٹر اپنی مرضی سے بدل سکتے ہیں
//   • 📊 بصری خلاصہ — ٹاپ ادویات کا بار چارٹ + ٹوٹیلیٹی پراگریس
//   • 🌐 تینوں زبانیں (ur/en/roman) — زبان بدلتے ہی فارم دوبارہ رینڈر ہوتا ہے

var KENT_W = { mental: 12, mod: 11, part: 10, phys: 9, hist: 6 };
var CT_STORE = 'bcc_case_taking_v1';

var CT = {
    mode: 'acute',
    dx: 'piles',
    sel: {},
    hist: { cc: '', hpi: '', past: '' },
    notes: { particular: '', loc: '', sens: '', extra: '' },
    results: [],
    _selKeys: [],
    w: { mental: 12, mod: 11, part: 10, phys: 9, hist: 6 },
    open: ['hist'],
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
        '@keyframes ctFade{from{opacity:0;transform:translateY(-3px)}to{opacity:1;transform:none}}';
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
    CT.open = open ? ['acute', 'hist', 'mental', 'phys', 'mod', 'part', 'sum'] : [];
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

    h += '<div class="card-title">📋 ' + ({ ur: 'کیس ٹیکنگ فارم', en: 'Case Taking Form', roman: 'Case Taking Form' }[L]) +
        '<span style="font-size:11px;color:#7f8c8d;font-weight:normal"> — ' +
        ({ ur: 'اکارڈین سٹائل: سیکشن کھولیں، علامات ٹک کریں — سب خود بخود محفوظ ہوتا رہے گا', en: 'Accordion style: open a section, tick symptoms — everything auto-saves', roman: 'Accordion style: section kholein, alamaat tick karein — sab auto save hoga' }[L]) + '</span></div>';

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
        h += '<div class="alert alert-warning" style="margin-bottom:12px">🌿 <b>' + ({ ur: 'کرانک کیس ٹیکنگ:', en: 'Chronic case taking:', roman: 'Chronic case taking:' }[L]) + '</b> ' +
            ({ ur: 'ہر سیکشن کھولیں → علامات ٹک کریں → مکمل ٹوٹیلیٹی پر انفرادی دوا۔',
               en: 'Open each section → tick symptoms → individual remedy from complete totality.',
               roman: 'Har section kholein → alamaat tick karein → mukammal totality par dawa.' }[L]) + '</div>';

        // ---------- 1) مکمل ہسٹری ----------
        var bodyHist = '';
        bodyHist += '<div class="form-group"><label>📌 ' + ({ ur: 'بنیادی شکایت + مدت (Chief Complaint & Duration)', en: 'Chief Complaint & Duration', roman: 'Buniyadi shikayat + muddat' }[L]) + '</label>';
        bodyHist += '<textarea style="min-height:60px" oninput="CT.hist.cc=this.value;ctAuto()" placeholder="' + ({ ur: 'مثلاً: قبل از وقت خون آنا — 2 سال سے', en: 'e.g. Rectal bleeding off and on — for 2 years', roman: 'Maslan: khoon aana — 2 saal se' }[L]) + '">' + ctEsc(CT.hist.cc) + '</textarea></div>';
        bodyHist += '<div class="form-group"><label>📖 ' + ({ ur: 'موجودہ بیماری کی ہسٹری (شروع کیسے ہوا، کیسے بڑھا)', en: 'History of present illness (onset & progress)', roman: 'Hazir bimari ki history' }[L]) + '</label>';
        bodyHist += '<textarea style="min-height:60px" oninput="CT.hist.hpi=this.value;ctAuto()">' + ctEsc(CT.hist.hpi) + '</textarea></div>';
        bodyHist += '<div class="form-group"><label>🏥 ' + ({ ur: 'پرانے مرض / سرجری / استعمال شدہ ادویات (Past History)', en: 'Past history — old illness / surgery / medicines', roman: 'Puranay marz / surgery / dawaein' }[L]) + '</label>';
        bodyHist += '<textarea style="min-height:60px" oninput="CT.hist.past=this.value;ctAuto()">' + ctEsc(CT.hist.past) + '</textarea></div>';
        bodyHist += '<div class="tst-sub">👨‍👩‍👧 ' + ({ ur: 'خاندانی ہسٹری', en: 'Family history', roman: 'Khandani history' }[L]) + '</div>';
        bodyHist += ctChips(CT_FAMILY, 'family');
        bodyHist += '<div class="tst-sub">🎯 ' + ({ ur: 'مرض کی وجہ / آغاز (Etiology)', en: 'Cause / onset (Etiology)', roman: 'Marz ki wajah' }[L]) + '</div>';
        bodyHist += ctChips(CT_CAUSE, 'cause');
        bodyHist += '<div class="tst-sub">🧬 ' + ({ ur: 'میاسم (Miasm) — ایک منتخب کریں', en: 'Miasm — select one', roman: 'Miasm — ek muntakhib karein' }[L]) + '</div>';
        bodyHist += ctChips(CT_MIASM, 'miasm', true);
        h += ctPanel('hist', 1, '📋', ({ ur: 'مریض کی مکمل ہسٹری', en: 'Complete Case History', roman: 'Mareez ki mukammal history' }[L]),
            { ur: '— کرانک دوا کی بنیاد', en: '— foundation of the chronic remedy', roman: '— chronic dawa ki bunyad' }[L], cov.hist.n, bodyHist);

        // ---------- 2) مینٹل جنرلز ----------
        h += ctPanel('mental', 2, '🧠', ({ ur: 'مینٹل جنرلز', en: 'Mental Generals', roman: 'Mental Generals' }[L]),
            { ur: '— انفرادیت کا سب سے اہم حصہ ', en: '— highest individualizing value ', roman: '— individualiat ka aham hissa ' }[L] + ctWTag('mental'), cov.mental.n,
            ctChips(CT_MENTAL, 'mental'));

        // ---------- 3) فزیکل جنرلز ----------
        h += ctPanel('phys', 3, '🌡️', ({ ur: 'فزیکل جنرلز', en: 'Physical Generals', roman: 'Physical Generals' }[L]),
            { ur: '— تھرمل، پیاس، پسینہ، نیند، خوراک ', en: '— thermal, thirst, sweat, sleep, food ', roman: '— thermal, pyas, paseena, neend ' }[L] + ctWTag('phys'), cov.phys.n,
            ctChips(CT_PHYSICAL, 'phys'));

        // ---------- 4) موڈیلیٹیز ----------
        var bodyMod = '';
        bodyMod += '<div class="tst-sub">⬇️ ' + ({ ur: 'اگراویشن — جس سے بڑھتا ہے (Worse)', en: 'Aggravation — worse from', roman: 'Aggravation — jis se barhta hai' }[L]) + '</div>';
        bodyMod += ctChips(CT_MODAGG, 'modagg');
        bodyMod += '<div class="tst-sub">⬆️ ' + ({ ur: 'امیلوریشن — جس سے کم ہوتا ہے (Better)', en: 'Amelioration — better from', roman: 'Amelioration — jis se kam hota hai' }[L]) + '</div>';
        bodyMod += ctChips(CT_MODAMEL, 'modamel');
        h += ctPanel('mod', 4, '🔄', ({ ur: 'موڈیلیٹیز', en: 'Modalities', roman: 'Modalities' }[L]),
            { ur: '— بڑھوتری اور کمی ', en: '— aggravations & ameliorations ', roman: '— barhotori aur kami ' }[L] + ctWTag('mod'), cov.mod.n, bodyMod);

        // ---------- 5) پارٹیکلر علامات ----------
        var bodyPart = '';
        bodyPart += '<div class="form-group"><label>📚 ' + ({ ur: 'متعلقہ بیماری (اختیاری — ریپرٹوری حد بندی)', en: 'Related disease (optional — repertory scope)', roman: 'Mutaliqa bimari (ikhtiyari)' }[L]) + '</label>' + ctDiseaseOptions() + '</div>';
        bodyPart += ctDiseaseChips();
        bodyPart += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px">';
        bodyPart += '<div style="flex:1;min-width:180px"><label style="font-size:12px;font-weight:bold;color:#2c3e50">📍 ' + ({ ur: 'مقام (Location)', en: 'Location', roman: 'Maqam' }[L]) + '</label>';
        bodyPart += '<input type="text" class="form-control" style="padding:8px;border:1px solid #cbd5e1;border-radius:6px;margin-top:4px" oninput="CT.notes.loc=this.value;ctAuto()" value="' + ctEsc(CT.notes.loc) + '"></div>';
        bodyPart += '<div style="flex:1;min-width:180px"><label style="font-size:12px;font-weight:bold;color:#2c3e50">⚡ ' + ({ ur: 'محسوسات / کیفیت (Sensation)', en: 'Sensation / character', roman: 'Mehsoosat' }[L]) + '</label>';
        bodyPart += '<input type="text" class="form-control" style="padding:8px;border:1px solid #cbd5e1;border-radius:6px;margin-top:4px" oninput="CT.notes.sens=this.value;ctAuto()" value="' + ctEsc(CT.notes.sens) + '"></div>';
        bodyPart += '</div>';
        bodyPart += '<div class="form-group" style="margin-top:10px"><label>✍️ ' + ({ ur: 'پارٹیکلر تفصیل — مریض کے الفاظ میں', en: 'Particulars in patient own words', roman: 'Particular tafseel — mareez ke alfaaz mein' }[L]) + '</label>';
        bodyPart += '<textarea style="min-height:70px" oninput="CT.notes.particular=this.value;ctAuto()">' + ctEsc(CT.notes.particular) + '</textarea></div>';
        h += ctPanel('part', 5, '🔑', ({ ur: 'پارٹیکلر علامات', en: 'Particular Symptoms', roman: 'Particular alamaat' }[L]),
            { ur: '— مقام، محسوسات، خصوصیت ', en: '— location, sensation, character ', roman: '— maqam, mehsoosat, khasusiyat ' }[L] + ctWTag('part'), cov.part.n, bodyPart);

        // ---------- 6) ٹوٹیلیٹی سمری + وزن ایڈجسٹ ----------
        var doneP = 0;
        ['hist', 'mental', 'phys', 'mod', 'part'].forEach(function(p) { if (cov[p].c) doneP += 1; });
        var bodySum = ctWeightsHtml() + ctTotalityHtml();
        h += ctPanel('sum', 6, '🧩', ({ ur: 'مکمل ٹوٹیلیٹی — خلاصہ', en: 'Complete Totality — Summary', roman: 'Mukammal totality — khulasa' }[L]),
            { ur: '— چاروں ستون مکمل کریں پھر دوا تلاش کریں', en: '— complete all pillars, then find the remedy', roman: '— charon sutoon mukammal karein' }[L], doneP, bodySum);
    }

    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:14px 0">';
    h += '<button type="button" class="btn btn-purple" onclick="ctFindRemedies()">💊 ' + ({ ur: 'ٹوٹیلیٹی سے دوا تلاش کریں', en: 'Find remedy from totality', roman: 'Totality se dawa talash karein' }[L]) + '</button>';
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
window.CT = CT;
