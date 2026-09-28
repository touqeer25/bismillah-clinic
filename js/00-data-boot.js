// ============================================================
// Bismillah Clinic — js/00-data-boot.js
// 🔑 v94: مواد (ڈیٹا) اب کوڈ کے اندر نہیں، الگ JSON فائلوں میں ہے۔
//
//   پہلے یہ چار فائلیں ہر بار چلتے ہوئے کوڈ کی صورت میں لوڈ ہوتی تھیں (≈۳۸۰ KB):
//       diagnosis-data.js · advanced-diagnosis-knowledge.js
//       js/10-treatment-data.js · js/12-treatment-more.js
//   اب وہی مواد یہاں سے آتا ہے:
//       data/diagnosis.json · data/dx-knowledge.json · data/treatment.json
//
//   فائدہ: (۱) مواد میں کوما غلط لگنے سے پوری ایپ نہیں رکتی — صرف وہی فائل ناکام ہوتی ہے
//          (۲) براؤزر اسے الگ کیش کرتا ہے، ?v= سے قابو میں رہتا ہے
//          (۳) مواد کی تدوین کے لیے جاوا اسکرپٹ جاننے کی ضرورت نہیں
//
//   ⚠ نام بالکل وہی ہیں جو پہلے تھے — SYMPTOMS_DB, DISEASES_DB, CATEGORIES_DB,
//     ADX_KNOWLEDGE, STUDIO_SYS, TREATMENT_LIB, TREATMENT_MORE — اس لیے باقی کسی
//     فائل میں ایک حرف بھی نہیں بدلا۔
// ⚠ یہ فائل سب سے پہلے لوڈ ہونی چاہیے۔
// ============================================================

var BC_DATA_V = 'v=94';
var BC_DATA_FILES = {
    'data/diagnosis.json':    ['SYMPTOMS_DB', 'DISEASES_DB', 'CATEGORIES_DB'],
    'data/treatment.json':    ['STUDIO_SYS', 'TREATMENT_LIB', 'TREATMENT_MORE'],
    'data/dx-knowledge.json': ['ADX_KNOWLEDGE']          // پوری فائل ہی ایک شے ہے
};
window.BC_DATA_STATE = { loaded: [], failed: [] };

function bcDataApply(file, json) {
    var keys = BC_DATA_FILES[file];
    if (keys.length === 1 && keys[0] === 'ADX_KNOWLEDGE') { window.ADX_KNOWLEDGE = json; }
    else { keys.forEach(function(k) { if (json && json[k] !== undefined) window[k] = json[k]; }); }
    window.BC_DATA_STATE.loaded.push(file);
}

// مواد آنے کے بعد: جو صفحہ پہلے سے کھلا ہے اور خالی رہ گیا ہے، اسے دوبارہ بنا دو
function bcDataRerender() {
    try {
        var g = document.getElementById('symptomsGrid');
        if (g && !g.querySelector('.symptom-chip') && typeof initDiagnosis === 'function') initDiagnosis();
    } catch (e) { console.warn('data-boot: initDiagnosis', e); }
    try {
        var l = document.getElementById('studioList');
        if (l && !l.innerHTML.trim() && typeof renderStudioAll === 'function') renderStudioAll();
    } catch (e) { console.warn('data-boot: renderStudioAll', e); }
    try { document.dispatchEvent(new CustomEvent('bc-data-ready', { detail: window.BC_DATA_STATE })); } catch (e) {}
}

window.BC_DATA_READY = Promise.all(Object.keys(BC_DATA_FILES).map(function(file) {
    return fetch(file + '?' + BC_DATA_V)
        .then(function(r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function(j) { bcDataApply(file, j); })
        .catch(function(e) {
            window.BC_DATA_STATE.failed.push(file);
            console.error('⚠ data file failed:', file, e && e.message ? e.message : e);
        });
})).then(function() {
    var s = window.BC_DATA_STATE;
    console.log('📦 data: ' + s.loaded.length + '/' + Object.keys(BC_DATA_FILES).length + ' files' +
                (s.failed.length ? ' — FAILED: ' + s.failed.join(', ') : ''));
    bcDataRerender();
    return s;
});

// اگر صفحہ پہلے تیار ہو جائے اور مواد بعد میں آئے — دونوں صورتیں سنبھال لی جائیں
document.addEventListener('DOMContentLoaded', function() { window.BC_DATA_READY.then(bcDataRerender); });
