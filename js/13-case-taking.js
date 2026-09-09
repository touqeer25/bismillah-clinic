// Bismillah Clinic — js/13-case-taking.js
// Case Taking page: Acute (few questions) / Chronic (totality)

var CT = {
    mode: 'acute',
    dx: 'piles',
    sel: {},
    notes: { cc: '', particular: '', extra: '' },
    results: []
};

var CT_MENTAL = [
    { ur: 'غم / غمگین خاموشی', en: 'Grief / silent grief', roman: 'Gham' },
    { ur: 'غصہ / چڑچڑا پن', en: 'Anger / irritability', roman: 'Gussa' },
    { ur: 'بے چینی / اضطراب', en: 'Anxiety / restlessness', roman: 'Bechaini' },
    { ur: 'موت کا خوف', en: 'Fear of death', roman: 'Maut ka khauf' },
    { ur: 'تنہائی پسند', en: 'Aversion to company', roman: 'Tanhai pasand' },
    { ur: 'ساتھ کی خواہش', en: 'Desire for company', roman: 'Sath ki khwahish' },
    { ur: 'تسلی سے بدتر', en: 'Worse from consolation', roman: 'Tasalli se badtar' },
    { ur: 'رونا آتا ہے', en: 'Weeping easily', roman: 'Rona' },
    { ur: 'حسد', en: 'Jealousy', roman: 'Hasad' },
    { ur: 'ذہنی دباؤ / تناؤ', en: 'Mental strain / stress', roman: 'Zehni dabao' }
];

var CT_PHYSICAL = [
    { ur: 'ٹھنڈا مزاج (Chilly)', en: 'Chilly patient', roman: 'Thanda mizaj' },
    { ur: 'گرم مزاج (Hot)', en: 'Hot patient', roman: 'Garam mizaj' },
    { ur: 'زیادہ پیاس', en: 'Thirsty', roman: 'Zyada pyas' },
    { ur: 'پیاس نہیں', en: 'Thirstless', roman: 'Pyas nahi' },
    { ur: 'زیادہ پسینہ', en: 'Profuse sweat', roman: 'Zyada pasina' },
    { ur: 'رات کا پسینہ', en: 'Night sweats', roman: 'Raat ka pasina' },
    { ur: 'نمک کی خواہش', en: 'Craves salt', roman: 'Namak ki khwahish' },
    { ur: 'میٹھے کی خواہش', en: 'Craves sweets', roman: 'Meethe ki khwahish' },
    { ur: 'چربی سے نفرت', en: 'Aversion to fat', roman: 'Charbi se nafrat' },
    { ur: 'نیند سے آرام نہیں', en: 'Unrefreshing sleep', roman: 'Neend se aaram nahi' }
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

function ctL() { return currentLang || 'ur'; }
function ctT(obj) { if (!obj) return ''; return obj[ctL()] || obj.en || obj.ur || ''; }
function ctEsc(s) { return (typeof escapeHtml === 'function') ? escapeHtml(s || '') : String(s || '').replace(/[&<>"]/g, function(c) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]); }); }
function ctKey(t) { return String((t && (t.en || t.ur)) || t || '').toLowerCase(); }

function ctToggle(group, t) {
    var k = group + '|' + ctKey(t);
    if (CT.sel[k]) delete CT.sel[k]; else CT.sel[k] = t;
    renderCaseTaking();
}

function ctOn(group, t) { return !!CT.sel[group + '|' + ctKey(t)]; }

CT._pools = CT._pools || {};
function ctChips(arr, group) {
    CT._pools[group] = arr;
    var h = '<div class="tst-kw">';
    arr.forEach(function(t, i) {
        var lab = typeof t === 'string' ? t : ctT(t);
        h += '<span class="' + (ctOn(group, t) ? 'sel' : '') + '" onclick="ctToggleIdx(\'' + group + '\',' + i + ')">' + ctEsc(lab) + '</span>';
    });
    return h + '</div>';
}
function ctToggleIdx(group, i) {
    var arr = CT._pools[group] || [];
    if (arr[i]) ctToggle(group, arr[i]);
}
window.ctToggleIdx = ctToggleIdx;

function ctDiseaseOptions() {
    if (typeof TREATMENT_LIB === 'undefined') return '';
    var h = '<select id="ctDx" class="btn btn-sm btn-light" style="max-width:100%;padding:8px 12px" onchange="CT.dx=this.value;CT.sel={};renderCaseTaking()">';
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
        h += '<div class="tst-sub">⬇️ ' + ({ ur: 'اگراویشن (Worse)', en: 'Aggravation (Worse)', roman: 'Aggravation' }[ctL()]) + '</div>';
        h += ctChips(aggs.slice(0, 16), 'agg');
    }
    if (amels.length) {
        h += '<div class="tst-sub">⬆️ ' + ({ ur: 'امیلوریشن (Better)', en: 'Amelioration (Better)', roman: 'Amelioration' }[ctL()]) + '</div>';
        h += ctChips(amels.slice(0, 16), 'amel');
    }
    return h;
}

function ctNorm(s) {
    if (typeof studioNorm === 'function') return studioNorm(s);
    return String(s || '').toLowerCase();
}

function ctTokens(s) {
    if (typeof studioTokens === 'function') return studioTokens(s);
    return ctNorm(s).split(/\s+/).filter(function(w) { return w.length >= 3; });
}

function ctAllSelectedText() {
    var parts = [];
    Object.keys(CT.sel).forEach(function(k) { parts.push(ctT(CT.sel[k]) + ' ' + (CT.sel[k].en || '') + ' ' + (CT.sel[k].ur || '')); });
    parts.push(CT.notes.cc || '', CT.notes.particular || '', CT.notes.extra || '');
    return parts.join(' ');
}

function ctScoreRem(r, blobToks) {
    var blob = '';
    (r.syms || []).forEach(function(s) { blob += ' ' + (s.ur || '') + ' ' + (s.en || '') + ' ' + (s.roman || ''); });
    if (r.mod) blob += ' ' + (r.mod.ur || '') + ' ' + (r.mod.en || '') + ' ' + (r.mod.roman || '');
    blob = ctNorm(blob + ' ' + (r.n || ''));
    var score = 0, hits = [];
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
            var w = k.indexOf('mental') === 0 ? 12 : (k.indexOf('phys') === 0 ? 10 : 8);
            score += w;
            hits.push(ctT(t));
        }
    });
    blobToks.forEach(function(tok) { if (tok.length >= 4 && blob.indexOf(tok) >= 0) score += 2; });
    return { score: score, hits: hits };
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
    if (!text.trim() && !Object.keys(CT.sel).length) {
        if (typeof showToast === 'function') showToast(({ ur: '⚠️ پہلے علامات منتخب کریں', en: '⚠️ Select symptoms first', roman: '⚠️ Pehle alamat muntakhib karein' })[ctL()], 'error');
        return;
    }
    var toks = ctTokens(text);
    var only = CT.mode === 'acute' ? CT.dx : null;
    var ranked = ctCollectRems(only).map(function(it) {
        var sc = ctScoreRem(it.r, toks);
        return { dx: it.dx, r: it.r, score: sc.score, hits: sc.hits };
    }).filter(function(x) { return x.score > 0; }).sort(function(a, b) { return b.score - a.score; });
    var seen = {};
    CT.results = ranked.filter(function(x) {
        var n = (x.r.n || '').toLowerCase();
        if (seen[n]) return false;
        seen[n] = 1;
        return true;
    }).slice(0, 12);
    renderCaseTaking();
}

function ctResultsHtml() {
    if (!CT.results.length) return '';
    var L = ctL();
    var h = '<div class="tst-dtitle" style="margin-top:16px"><h3>💊 ' + ({ ur: 'منتخب ٹوٹیلیٹی کے مطابق ادویات', en: 'Remedies by selected totality', roman: 'Totality ke mutabiq adviat' }[L]) + ' (' + CT.results.length + ')</h3></div>';
    CT.results.forEach(function(it, i) {
        var r = it.r;
        var dname = (TREATMENT_LIB[it.dx] && ctT(TREATMENT_LIB[it.dx].name)) || it.dx;
        h += '<div class="tst-rem">';
        h += '<div class="top"><span class="nm">' + (i + 1) + '. ' + ctEsc(r.n) + '</span>';
        if (r.pot) h += '<span class="pot">' + ctEsc(r.pot) + '</span>';
        h += '<span class="pot" style="background:#6c3483">' + it.score + '</span></div>';
        if (CT.mode === 'chronic') h += '<div class="use" style="opacity:.8">📚 ' + ctEsc(dname) + '</div>';
        (r.syms || []).forEach(function(s) { h += '<div class="use">▸ ' + ctEsc(s[L] || s.ur) + '</div>'; });
        if (r.mod) h += '<div class="tst-mod">🔄 ' + ctEsc(r.mod[L] || r.mod.ur) + '</div>';
        if (it.hits && it.hits.length) {
            h += '<div style="margin-top:6px;background:#f5eef8;border-radius:8px;padding:6px 8px;font-size:12px;color:#4a235a">✓ ' + it.hits.map(ctEsc).join(' · ') + '</div>';
        }
        h += '</div>';
    });
    return h;
}

function renderCaseTaking() {
    var el = document.getElementById('ct-page-root');
    if (!el) return;
    var L = ctL();
    var acuteOn = CT.mode === 'acute';
    var h = '';
    h += '<div class="card-title">📋 ' + ({ ur: 'کیس ٹیکنگ فارم', en: 'Case Taking Form', roman: 'Case Taking Form' }[L]) +
        '<span style="font-size:11px;color:#7f8c8d;font-weight:normal"> — ' +
        ({ ur: 'حاد سوالات یا مزمن ٹوٹیلیٹی', en: 'Acute questions or chronic totality', roman: 'Haad sawal ya muzmin totality' }[L]) + '</span></div>';

    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px">';
    h += '<button type="button" class="btn btn-sm ' + (acuteOn ? 'btn-purple' : 'btn-light') + '" onclick="CT.mode=\'acute\';CT.results=[];renderCaseTaking()">🔴 ' + ({ ur: 'حاد (Acute)', en: 'Acute', roman: 'Haad (Acute)' }[L]) + '</button>';
    h += '<button type="button" class="btn btn-sm ' + (!acuteOn ? 'btn-purple' : 'btn-light') + '" onclick="CT.mode=\'chronic\';CT.results=[];renderCaseTaking()">🔵 ' + ({ ur: 'مزمن (Chronic)', en: 'Chronic', roman: 'Muzmin (Chronic)' }[L]) + '</button>';
    h += '</div>';

    if (acuteOn) {
        h += '<div class="alert alert-warning" style="margin-bottom:12px">⚡ ' +
            ({ ur: 'حاد موڈ: متعلقہ بیماری چنیں، چند سوالات/علامات ٹک کریں، پھر دوا تلاش کریں۔', en: 'Acute mode: pick the disease, tick a few questions, then find the remedy.', roman: 'Haad mode: bimari chunein, chand sawal tick karein.' }[L]) + '</div>';
        h += '<div class="form-group"><label>📚 ' + ({ ur: 'بیماری', en: 'Disease', roman: 'Bimari' }[L]) + '</label>' + ctDiseaseOptions() + '</div>';
        CT_ACUTE_Q.forEach(function(q) {
            h += '<div class="tst-sub">' + ctT(q) + '</div>' + ctChips(q.opts, q.id);
        });
        h += ctDiseaseChips();
        h += '<div class="form-group" style="margin-top:12px"><label>' + ({ ur: 'اضافی نوٹ', en: 'Extra notes', roman: 'Izafi note' }[L]) + '</label>';
        h += '<textarea id="ctExtra" style="min-height:70px" oninput="CT.notes.extra=this.value" placeholder="' +
            ({ ur: 'جو سوال میں نہ ہو یہاں لکھیں...', en: 'Anything not in the questions...', roman: 'Jo sawal mein na ho...' }[L]) + '">' + ctEsc(CT.notes.extra) + '</textarea></div>';
    } else {
        h += '<div class="alert alert-warning" style="margin-bottom:12px">🌿 ' +
            ({ ur: 'مزمن موڈ: پارٹیکلر + مینٹل جنرل + فزیکل جنرل + موڈیلیٹیز = مکمل ٹوٹیلیٹی۔ انفرادی تصویر پر دوا چنیں۔', en: 'Chronic mode: particulars + mental generals + physical generals + modalities = full totality.', roman: 'Muzmin: particular, mental, physical, modalities = totality.' }[L]) + '</div>';
        h += '<div class="form-group"><label>📋 ' + ({ ur: 'بنیادی شکایت (Chief Complaint)', en: 'Chief Complaint', roman: 'Buniyadi shikayat' }[L]) + '</label>';
        h += '<textarea id="ctCc" style="min-height:70px" oninput="CT.notes.cc=this.value">' + ctEsc(CT.notes.cc) + '</textarea></div>';
        h += '<div class="form-group"><label>📚 ' + ({ ur: 'اگر مخصوص بیماری ہو (اختیاری)', en: 'Related disease (optional)', roman: 'Bimari (ikhtiyari)' }[L]) + '</label>' + ctDiseaseOptions() + '</div>';

        h += '<div class="tst-sub" style="margin-top:8px">🧠 ' + ({ ur: 'مینٹل جنرلز', en: 'Mental Generals', roman: 'Mental generals' }[L]) + '</div>';
        h += ctChips(CT_MENTAL, 'mental');
        h += '<div class="tst-sub">🌡️ ' + ({ ur: 'فزیکل جنرلز', en: 'Physical Generals', roman: 'Physical generals' }[L]) + '</div>';
        h += ctChips(CT_PHYSICAL, 'phys');
        h += '<div class="tst-sub">🔑 ' + ({ ur: 'پارٹیکلر علامات (اس بیماری / شکایت کی)', en: 'Particular symptoms', roman: 'Particular alamaat' }[L]) + '</div>';
        h += ctDiseaseChips();
        h += '<div class="form-group" style="margin-top:10px"><label>' + ({ ur: 'پارٹیکلر تفصیل (خود لکھیں)', en: 'Particulars in own words', roman: 'Particular tafseel' }[L]) + '</label>';
        h += '<textarea id="ctPart" style="min-height:70px" oninput="CT.notes.particular=this.value">' + ctEsc(CT.notes.particular) + '</textarea></div>';
        h += '<div class="form-group"><label>' + ({ ur: 'مکمل کیس / دیگر ٹوٹیلیٹی', en: 'Rest of totality', roman: 'Baagi totality' }[L]) + '</label>';
        h += '<textarea id="ctExtra" style="min-height:70px" oninput="CT.notes.extra=this.value">' + ctEsc(CT.notes.extra) + '</textarea></div>';
    }

    h += '<div style="display:flex;gap:8px;flex-wrap:wrap;margin:14px 0">';
    h += '<button type="button" class="btn btn-purple" onclick="ctFindRemedies()">💊 ' + ({ ur: 'ٹوٹیلیٹی سے دوا تلاش کریں', en: 'Find remedy from totality', roman: 'Totality se dawa talash karein' }[L]) + '</button>';
    h += '<button type="button" class="btn btn-light" onclick="CT.sel={};CT.notes={cc:\'\',particular:\'\',extra:\'\'};CT.results=[];renderCaseTaking()">🔄 ' + ({ ur: 'فارم صاف', en: 'Clear form', roman: 'Form saaf' }[L]) + '</button>';
    h += '</div>';
    h += ctResultsHtml();
    el.innerHTML = h;
    var dx = document.getElementById('ctDx');
    if (dx) dx.value = CT.dx;
}

window.renderCaseTaking = renderCaseTaking;
window.ctToggle = ctToggle;
window.ctFindRemedies = ctFindRemedies;
window.CT = CT;
