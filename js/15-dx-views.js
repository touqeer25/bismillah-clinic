// Bismillah Clinic — js/15-dx-views.js
// 🔑 v93: یہ کوڈ پہلے index.html کے اندر دو <script> بلاکس میں پڑا تھا۔
//   (۱) اے آئی اسسٹنٹ کے آئی فریموں کو زبان + مریض کا سیاق بھیجنا
//   (۲) تشخیص کے نظاروں کا سوئچ — یہ پہلے «window.switchDxView = window.switchDxView || …»
//       یعنی ایک پیچ کی صورت میں تھا؛ اب سیدھی، واحد تعریف ہے۔
// ⚠ منطق میں کوئی تبدیلی نہیں — صرف جگہ بدلی اور پیچ والی شرط ہٹائی گئی۔

/* AI Homeo Assistant: زبان ہم آہنگی — دونوں iframe کو ?lang= بھیجتا ہے (ur/en/roman)
   + ایڈوانس اسسٹنٹ 2.0 کو فعال مریض کا سیاق بھیجتا ہے (?patient= JSON) */
(function(){
    function syncAILang(){
        ['dxAIframe', 'dxAI2frame'].forEach(function(id){
            var f = document.getElementById(id);
            if (!f) return;
            var lang = (localStorage.getItem('clinic_lang') || 'ur');
            try {
                var u = new URL(f.src, location.href);
                if (u.searchParams.get('lang') !== lang) {
                    u.searchParams.set('lang', lang);
                    f.src = u.toString();
                }
            } catch(e){}
        });
    }
    var lastPatientSent = undefined;
    function syncAI2Context(){
        var f = document.getElementById('dxAI2frame');
        if (!f) return;
        var pid = null;
        try { pid = (typeof diagnosisPatientId !== 'undefined') ? diagnosisPatientId : null; } catch(e){}
        if (pid === lastPatientSent) return;
        lastPatientSent = pid;
        try {
            var u = new URL(f.src, location.href);
            var p = null;
            if (pid) {
                var cpl = [];
                try { cpl = JSON.parse(localStorage.getItem('cached_patients') || '[]'); } catch(e){}
                p = cpl.find(function(x){ return x.id === pid; });
            }
            if (p && p.name) {
                u.searchParams.set('patient', JSON.stringify({
                    name: p.name, age: p.age || '', gender: p.gender || ''
                }));
            } else {
                u.searchParams.delete('patient');
            }
            f.src = u.toString();
        } catch(e){}
    }
    window.syncAILang = syncAILang;
    window.syncAI2Context = syncAI2Context;
    syncAILang();
    syncAI2Context();
})();

window.switchDxView = function(v) {
                v = (v === 'classic' || v === 'ai' || v === 'ai2' || v === 'case') ? v : 'studio';
                var ids = { studio: 'dxStudioView', classic: 'dxClassicView', ai: 'dxAIView', ai2: 'dxAI2View', case: 'dxCaseView' };
                var btns = { studio: 'dxViewBtnStudio', classic: 'dxViewBtnClassic', ai: 'dxViewBtnAI', ai2: 'dxViewBtnAI2', case: 'dxViewBtnCase' };
                Object.keys(ids).forEach(function(k) {
                    var el = document.getElementById(ids[k]);
                    if (!el) return;
                    var on = k === v;
                    el.classList.toggle('hidden', !on);
                    el.style.display = on ? '' : 'none';
                });
                Object.keys(btns).forEach(function(k) {
                    var b = document.getElementById(btns[k]);
                    if (b) b.className = k === v ? 'btn btn-sm btn-purple' : 'btn btn-sm btn-light';
                });
                if (v === 'studio' && typeof renderStudioAll === 'function') renderStudioAll();
                if (v === 'case' && typeof renderCaseTaking === 'function') renderCaseTaking();
            };
