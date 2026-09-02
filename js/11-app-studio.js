// ============================================================
// Bismillah Clinic — js/11-app-studio.js
// HYBRID TREATMENT STUDIO (Option 3+4: system tabs + left list + right detail)
// Tabs: علامات → علاج → خوراک → احتیاط  (3 languages: ur/en/roman)
// Needs: js/10-treatment-data.js (TREATMENT_LIB, STUDIO_SYS, T)
// ============================================================

var studioSys = 'all';
var studioDx = 'piles';
var studioTab = 'sym';
var studioViewInit = false;
var studioSelSyms = new Set();   // selected disease symptom indexes
var studioNote = '';             // manually written symptoms
var studioShowNoteBox = false;
var studioSelRems = new Set();   // selected remedy keys ('r2'=d.rem[2], 'm1'=extra pool)
var studioFieldSrc = null;       // textarea id when opened from New Visit / Registration form
var studioFieldPage = null;      // page id to return to

var STUDIO_TABS = [
    ['sym',  '🔑', { ur: 'علامات', en: 'Symptoms', roman: 'Alamaat' }],
    ['rem',  '💊', { ur: 'علاج',   en: 'Treatment', roman: 'Ilaj' }],
    ['diet', '🥗', { ur: 'خوراک',  en: 'Diet', roman: 'Khurak' }],
    ['rf',   '⚠️', { ur: 'احتیاط', en: 'Caution', roman: 'Ehtiyat' }]
];

function studioEsc(s) { return escapeHtml(s || ''); }
function studioL() { return ({ ur: 'ur', en: 'en', roman: 'roman' })[currentLang] || 'ur'; }
function studioTx(obj) { return studioEsc(obj ? (obj[currentLang] || obj.ur) : ''); }

// ---------- VIEW SWITCHER (studio ↔ classic modes) ----------
function switchDxView(v) {
    var s = $('dxStudioView'), c = $('dxClassicView');
    var bs = $('dxViewBtnStudio'), bc = $('dxViewBtnClassic');
    if (!s || !c) return;
    var studio = (v === 'studio');
    s.classList.toggle('hidden', !studio);
    c.classList.toggle('hidden', studio);
    if (bs) bs.className = studio ? 'btn btn-sm btn-purple' : 'btn btn-sm btn-light';
    if (bc) bc.className = studio ? 'btn btn-sm btn-light' : 'btn btn-sm btn-purple';
    if (studio && !studioViewInit) { studioViewInit = true; renderStudioAll(); }
    try { localStorage.setItem('dx_view', studio ? 'studio' : 'classic'); } catch (e) {}
}

// ---------- RENDER: SYSTEM TABS ----------
function renderStudioSysTabs() {
    var el = $('studioSysTabs'); if (!el) return;
    var keys = Object.keys(TREATMENT_LIB);
    var h = '';
    STUDIO_SYS.forEach(function(s) {
        var n = s.k === 'all' ? keys.length : keys.filter(function(k) { return TREATMENT_LIB[k].sys === s.k; }).length;
        h += '<div class="tst-sys' + (studioSys === s.k ? ' on' : '') + '" style="--c:' + s.c + ';--bg:' + s.bg + '" onclick="studioPickSys(\'' + s.k + '\')">';
        h += '<div class="ic">' + s.ic + '</div><div class="lb">' + studioTx(s.nm) + '</div><div class="n">' + n + '</div></div>';
    });
    el.innerHTML = h;
}

// ---------- RENDER: NAV LIST (LEFT panel) ----------
function renderStudioList() {
    var el = $('studioList'); if (!el) return;
    var qEl = $('studioSearch');
    var q = qEl ? qEl.value.trim().toLowerCase() : '';
    var h = '', last = '';
    Object.keys(TREATMENT_LIB).forEach(function(k) {
        var d = TREATMENT_LIB[k];
        if (studioSys !== 'all' && d.sys !== studioSys) return;
        var nm = d.name[currentLang] || d.name.ur;
        if (q && (nm + ' ' + d.name.en).toLowerCase().indexOf(q) < 0) return;
        var sys = STUDIO_SYS.find(function(x) { return x.k === d.sys; });
        if (studioSys === 'all' && sys && sys.nm.en !== last) {
            h += '<div class="tst-grp">' + sys.ic + ' ' + studioTx(sys.nm) + '</div>';
            last = sys.nm.en;
        }
        h += '<div class="tst-row' + (k === studioDx ? ' on' : '') + '" onclick="studioPickDx(\'' + k + '\')">';
        h += '<span class="ic">' + d.ic + '</span>' + studioEsc(nm) + '<span class="en">' + studioEsc(d.name.en) + '</span></div>';
    });
    var none = { ur: '😔 کوئی بیماری نہیں ملی', en: '😔 No disease found', roman: '😔 Koi bimari nahi mili' };
    el.innerHTML = h || '<div class="tst-empty">' + none[currentLang] + '</div>';
}

// ---------- RENDER: DETAIL (RIGHT panel) ----------
function renderStudioDetail() {
    var d = TREATMENT_LIB[studioDx]; if (!d) return;
    var L = currentLang;
    var head = $('studioDHead'), meta = $('studioDMeta');
    if (head) head.innerHTML = d.ic + ' ' + studioTx(d.name) + (L !== 'en' ? ' <span class="latin">(' + studioEsc(d.name.en) + ')</span>' : '');
    var pool = studioPool(d);
    if (meta) meta.textContent = (studioTab === 'sym' || studioTab === 'rem')
        ? (studioTab === 'sym' ? pool.length : d.rem.length) + ' ' + ({ ur: 'ادویات', en: 'remedies', roman: 'adviat' }[L]) : '';

    // linked patient bar
    var pb = $('studioPatientBar');
    if (pb) {
        if (diagnosisPatientId) {
            var p = cachedPatients.find(function(x) { return x.id === diagnosisPatientId; });
            pb.style.display = 'flex';
            var pn = $('studioPatientName');
            if (pn) pn.textContent = p ? (p.name + ' (' + p.refNo + ')') : diagnosisPatientId;
        } else { pb.style.display = 'none'; }
    }

    // tabs
    var tabsEl = $('studioTabs');
    if (tabsEl) {
        tabsEl.innerHTML = STUDIO_TABS.map(function(t) {
            return '<span class="tst-dtab' + (studioTab === t[0] ? ' on' : '') + '" onclick="studioPickTab(\'' + t[0] + '\')">' + t[1] + ' ' + studioTx(t[2]) + '</span>';
        }).join('');
    }

    var b = $('studioBody'); if (!b) return;
    var hh = '';
    var selCount = studioSelSyms.size + studioSelRems.size + (studioNote.trim() ? 1 : 0);
    var saveLbl = studioFieldSrc
        ? { ur: 'فارم میں محفوظ کریں', en: 'Save to form', roman: 'Form mein mehfooz karein' }[L]
        : { ur: 'مریض علامات میں محفوظ', en: 'Save to patient symptoms', roman: 'Mareez alamat mein mehfooz' }[L];

    if (studioTab === 'sym') {
        if (studioFieldSrc) {
            hh += '<div class="tst-fieldbar"><span>📝 ' + ({ ur: 'آپ وزٹ/رجسٹریشن فارم سے آئے ہیں — علامات اور ادویات منتخب کر کے «محفوظ کریں» دبائیں', en: 'You came from the Visit/Registration form — select symptoms & remedies, then press Save', roman: 'Aap visit/registration form se aaye hain — alamat aur adviat muntakhib kar ke Mehfooz dabain' }[L]) + '</span>';
            hh += '<button class="tst-btn i" style="padding:2px 10px" onclick="studioCancelField()">✕ ' + ({ ur: 'واپس', en: 'Back', roman: 'Wapas' }[L]) + '</button></div>';
        }
        hh += '<div class="tst-dtitle"><h3>🔑 ' + ({ ur: 'علامات — ', en: 'Symptoms — ', roman: 'Alamaat — ' }[L]) + studioTx(d.name) + '</h3>';
        hh += '<div class="tst-acts">';
        hh += '<button class="tst-btn i" onclick="studioToggleNote()">✍️ ' + ({ ur: 'علامات لکھیں', en: 'Write symptoms', roman: 'Alamat likhein' }[L]) + '</button>';
        hh += '<button class="tst-btn g" onclick="studioSaveSymptoms()">📋 ' + saveLbl + (selCount ? ' (' + selCount + ')' : '') + '</button>';
        hh += '</div></div>';
        if (studioShowNoteBox) {
            hh += '<textarea id="studioNoteBox" class="tst-note" oninput="studioNote=this.value" placeholder="' +
                ({ ur: 'مریض کی علامات یہاں لکھیں...', en: 'Write patient symptoms here...', roman: 'Mareez ki alamat yahan likhein...' }[L]) + '">' + studioEsc(studioNote) + '</textarea>';
        }
        hh += '<div class="tst-sub">🩺 ' + ({ ur: 'بیماری کی اہم علامات (بٹن پریس کر کے منتخب کریں)', en: 'Key symptoms of the disease (press to select)', roman: 'Bimari ki aham alamaat (button dabakar muntakhib karein)' }[L]) + '</div>';
        hh += '<div class="tst-kw">' + d.syms.map(function(s, i) {
            return '<span class="' + (studioSelSyms.has(i) ? 'sel' : '') + '" onclick="studioToggleSym(' + i + ')">' + studioEsc(s[currentLang] || s.ur) + '</span>';
        }).join('') + '</div>';
        hh += '<div class="tst-intro">📖 ' + studioTx(d.intro) + '</div>';
        hh += '<div class="tst-sub" style="color:#6c3483">💊 ' + ({ ur: 'تمام متعلقہ ہومیوپیتھک ادویات — ', en: 'All related homeopathic remedies — ', roman: 'Tamam mutaliqa homeopathic adviat — ' }[L]) +
            studioTx(d.name) + ' (' + pool.length + ' ' + ({ ur: 'ادویات', en: 'remedies', roman: 'adviat' }[L]) + ')</div>';
        hh += '<div class="tst-poolhint" style="margin:0 0 6px">👆 ' + ({ ur: 'دوا کارڈ پر کلک کر کے منتخب کریں (سبز = منتخب شدہ)', en: 'Click a remedy card to select it (green = selected)', roman: 'Dawa card par click kar ke muntakhib karein (sabz = muntakhib shuda)' }[L]) + '</div>';
        hh += studioRemCards(d, L, true);
    } else if (studioTab === 'rem') {
        hh += '<div class="tst-dtitle"><h3>💊 ' + ({ ur: 'تجویز شدہ دوائیں (', en: 'Prescribed Remedies (', roman: 'Tajweez shuda dwain (' }[L]) + d.rem.length + ')</h3>';
        hh += '<div class="tst-acts">';
        hh += '<button class="tst-btn g" onclick="studioMakeRx()">📋 ' + ({ ur: 'نسخہ بنائیں', en: 'Make Prescription', roman: 'Nuskhah banayein' }[L]) + '</button>';
        hh += '<button class="tst-btn p" onclick="studioCaseAnalysis()">🔬 ' + ({ ur: 'کیس تجزیہ', en: 'Case Analysis', roman: 'Case tajzia' }[L]) + '</button>';
        hh += '<button class="tst-btn i" onclick="studioTogglePatientSearch(true)">👤 ' + ({ ur: 'مریض سے جوڑیں', en: 'Link Patient', roman: 'Mareez se jorein' }[L]) + '</button>';
        hh += '</div></div>';
        hh += studioRemCards(d, L, false);
        hh += '<div class="tst-rem"><div class="dose">🕐 ' + ({ ur: 'ہر دوا ڈاکٹر کی ہدایت کے مطابق', en: 'Every remedy as directed by the doctor', roman: 'Har dawa doctor ki hidayat ke mutabiq' }[L]) + '</div></div>';
        hh += '<div class="tst-two"><div class="tst-box rf">⚠️ ' + studioTx(d.rf) + '</div><div class="tst-box diet">🥗 ' + studioTx(d.diet) + '</div></div>';
    } else if (studioTab === 'diet') {
        hh += '<div class="tst-dtitle"><h3>🥗 ' + ({ ur: 'خوراک و ہدایات — ', en: 'Diet & Guidance — ', roman: 'Khurak aur hidayat — ' }[L]) + studioTx(d.name) + '</h3></div>';
        hh += '<div class="tst-box diet">🥗 ' + studioTx(d.diet) + '</div>';
        hh += '<div class="tst-intro">📖 ' + studioTx(d.intro) + '</div>';
    } else {
        hh += '<div class="tst-dtitle"><h3>⚠️ ' + ({ ur: 'احتیاط و خبرداری — ', en: 'Caution & Red Flags — ', roman: 'Ehtiyat aur khabardari — ' }[L]) + studioTx(d.name) + '</h3></div>';
        hh += '<div class="tst-box rf">' + studioTx(d.rf) + '</div>';
        hh += '<div class="tst-intro">📖 ' + studioTx(d.intro) + '</div>';
    }
    b.innerHTML = hh;
}

// pool = standard remedies + supplementary pool (TREATMENT_MORE), duplicates removed
function studioPool(d) {
    var extra = (typeof TREATMENT_MORE !== 'undefined' && TREATMENT_MORE[studioDx]) ? TREATMENT_MORE[studioDx] : [];
    var names = d.rem.map(function(r) { return (r.n || '').toLowerCase(); });
    return d.rem.map(function(r, i) { return { r: r, key: 'r' + i }; })
        .concat(extra.filter(function(r) { return r && r.n && names.indexOf(r.n.toLowerCase()) < 0; })
            .map(function(r, i) { return { r: r, key: 'm' + i }; }));
}

function studioRemCards(d, L, sel) {
    var items = sel ? studioPool(d) : d.rem.map(function(r, i) { return { r: r, key: 'r' + i }; });
    return items.map(function(it, i) {
        var r = it.r, on = sel && studioSelRems.has(it.key);
        var h = '<div class="tst-rem' + (sel ? ' click' : '') + (on ? ' selrem' : '') + '"' + (sel ? ' onclick="studioToggleRem(\'' + it.key + '\')"' : '') + '>';
        h += '<div class="top"><span class="nm">' + (i + 1) + '. ' + studioEsc(r.n) + '</span>' + (r.pot ? '<span class="pot">' + studioEsc(r.pot) + '</span>' : '') + '</div>';
        h += r.syms.map(function(s) { return '<div class="use">▸ ' + studioEsc(s[currentLang] || s.ur) + '</div>'; }).join('');
        if (r.mod) h += '<div class="tst-mod">🔄 ' + ({ ur: 'موڈیلیٹیز: ', en: 'Modalities: ', roman: 'Modalities: ' }[L]) + studioEsc(r.mod[currentLang] || r.mod.ur) + '</div>';
        return h + '</div>';
    }).join('');
}

function studioToggleRem(k) {
    if (studioSelRems.has(k)) studioSelRems.delete(k); else studioSelRems.add(k);
    renderStudioDetail();
}

// ---------- ACTIONS ----------
function renderStudioAll() { renderStudioSysTabs(); renderStudioList(); renderStudioDetail(); }

function studioPickSys(k) {
    studioSys = k;
    if (TREATMENT_LIB[studioDx] && TREATMENT_LIB[studioDx].sys !== k) {
        var f = Object.keys(TREATMENT_LIB).find(function(x) { return TREATMENT_LIB[x].sys === k; });
        if (f) studioDx = f;
    }
    studioSelSyms.clear(); studioSelRems.clear(); studioNote = ''; studioShowNoteBox = false;
    renderStudioAll();
}

function studioPickDx(k) {
    studioDx = k; studioTab = 'sym';
    studioSelSyms.clear(); studioSelRems.clear(); studioNote = ''; studioShowNoteBox = false;
    renderStudioList(); renderStudioDetail();
}

function studioPickTab(t) { studioTab = t; renderStudioDetail(); }

function studioToggleSym(i) {
    if (studioSelSyms.has(i)) studioSelSyms.delete(i); else studioSelSyms.add(i);
    renderStudioDetail();
}

function studioToggleNote() { studioShowNoteBox = !studioShowNoteBox; renderStudioDetail(); }

function studioSaveSymptoms() {
    var d = TREATMENT_LIB[studioDx]; if (!d) return;
    var L = currentLang;
    var parts = [];
    if (studioNote.trim()) parts.push(studioNote.trim());
    var arr = Array.from(studioSelSyms).sort(function(a, b2) { return a - b2; })
        .map(function(i) { return d.syms[i][currentLang] || d.syms[i].ur; });
    if (arr.length) parts.push(arr.join('، '));
    var pool = studioPool(d);
    var rems = Array.from(studioSelRems).sort()
        .map(function(k) { var it = pool.find(function(x) { return x.key === k; }); return it ? it.r.n : null; })
        .filter(Boolean);
    if (rems.length) parts.push({ ur: 'متعلقہ ادویات: ', en: 'Related remedies: ', roman: 'Mutaliqa adviat: ' }[L] + rems.join(', '));
    if (!parts.length) {
        showToast({ ur: '⚠️ پہلے علامات منتخب کریں یا لکھیں', en: '⚠️ Select or write symptoms first', roman: '⚠️ Pehle alamat muntakhib karein ya likhein' }[L], 'error');
        return;
    }
    var text = parts.join('\n');
    // (A) opened from New Visit / Registration form → fill that field and go back
    if (studioFieldSrc) {
        var el = $(studioFieldSrc);
        if (el) el.value = el.value.trim() ? (el.value.trim() + '\n' + text) : text;
        var pg = studioFieldPage;
        studioFieldSrc = null; studioFieldPage = null;
        studioSelSyms.clear(); studioSelRems.clear(); studioNote = ''; studioShowNoteBox = false;
        if (pg) showPage(pg, document.querySelector('.nav-btn[data-page="' + pg + '"]'));
        showToast('✅ ' + ({ ur: 'علامات و ادویات فارم میں منتقل ہو گئیں', en: 'Symptoms & remedies moved to the form', roman: 'Alamat aur adviat form mein muntaqil ho gain' }[L]));
        return;
    }
    // (B) normal studio flow (needs linked patient)
    if (!diagnosisPatientId) {
        showToast({ ur: '⚠️ پہلے مریض جوڑیں', en: '⚠️ Link a patient first', roman: '⚠️ Pehle mareez jorein' }[L], 'error');
        studioTogglePatientSearch(true);
        return;
    }
    goToNewVisitPage(diagnosisPatientId);
    setTimeout(function() { if ($('nvSymptoms')) $('nvSymptoms').value = text; }, 700);
    showToast('✅ ' + ({ ur: 'علامات وزٹ فارم میں محفوظ ہو گئیں', en: 'Symptoms saved to visit form', roman: 'Alamat visit form mein mehfooz ho gain' }[L]));
}

// ---------- LINK FROM NEW VISIT / REGISTRATION FORM ----------
function studioFromField(pageId, fieldId) {
    studioFieldPage = pageId; studioFieldSrc = fieldId; studioTab = 'sym';
    showPage('diagnosis', document.querySelector('.nav-btn[data-page="diagnosis"]'));
    switchDxView('studio');
    renderStudioAll();
    showToast('🧪 ' + ({ ur: 'بیماری منتخب کریں، علامات اور ادویات پر کلک کریں پھر «محفوظ کریں» دبائیں', en: 'Pick a disease, click symptoms & remedies, then press Save', roman: 'Bimari muntakhib karein, alamat aur adviat par click karein phir Mehfooz dabain' }[currentLang]));
}

function studioCancelField() {
    var pg = studioFieldPage;
    studioFieldSrc = null; studioFieldPage = null;
    if (pg) showPage(pg, document.querySelector('.nav-btn[data-page="' + pg + '"]'));
    renderStudioDetail();
}

function studioMakeRx() {
    var d = TREATMENT_LIB[studioDx]; if (!d) return;
    var L = currentLang;
    if (!diagnosisPatientId) {
        showToast({ ur: '⚠️ پہلے مریض جوڑیں', en: '⚠️ Link a patient first', roman: '⚠️ Pehle mareez jorein' }[L], 'error');
        studioTogglePatientSearch(true);
        return;
    }
    var rx = d.rem.map(function(r, i) {
        return (i + 1) + '. ' + r.n + ' (' + r.pot + ')\n   → ' + r.syms.map(function(s) { return s[currentLang] || s.ur; }).join('; ') + '\n   → 🔄 ' + (r.mod[currentLang] || r.mod.ur);
    }).join('\n\n');
    goToNewVisitPage(diagnosisPatientId);
    setTimeout(function() {
        if ($('nvDiagnosis')) $('nvDiagnosis').value = d.name[currentLang] + ' (' + d.name.en + ')';
        if ($('nvPrescription')) $('nvPrescription').value = rx;
        if ($('nvMethod')) $('nvMethod').value = d.diet[currentLang] || d.diet.ur;
    }, 700);
    showToast('✅ ' + ({ ur: 'نسخہ وزٹ فارم میں منتقل ہو گیا', en: 'Prescription copied to visit form', roman: 'Nuskhah visit form mein muntaqil ho gaya' }[L]));
}

function studioCaseAnalysis() {
    var d = TREATMENT_LIB[studioDx]; if (!d) return;
    var L = currentLang;
    var text = d.syms.map(function(s) { return s[currentLang] || s.ur; }).join('، ') + '. ' + (d.intro[currentLang] || d.intro.ur);
    switchDxView('classic');
    switchDxMode('ai');
    if ($('adxStatement')) $('adxStatement').value = text;
    showToast('🔬 ' + ({ ur: 'کیس تجزیہ (AI) میں منتقل ہو گیا', en: 'Moved to Case Analysis (AI)', roman: 'Case tajzia (AI) mein muntaqil ho gaya' }[L]));
}

// ---------- PATIENT LINK ----------
function studioRefreshPatient() { if ($('studioSysTabs')) renderStudioDetail(); }

function studioTogglePatientSearch(show) {
    var el = $('studioPatientSearch'); if (!el) return;
    el.style.display = show ? 'block' : 'none';
    if (show) {
        var q = $('studioPatientQuery'), r = $('studioPatientResults');
        if (q) { q.value = ''; q.focus(); }
        if (r) r.innerHTML = '';
    }
}

function studioSearchPatients() {
    var qEl = $('studioPatientQuery'), div = $('studioPatientResults');
    if (!qEl || !div) return;
    var q = qEl.value.trim().toLowerCase();
    if (!q || q.length < 2) { div.innerHTML = ''; return; }
    var res = cachedPatients.filter(function(p) {
        return (p.name && p.name.toLowerCase().indexOf(q) >= 0) ||
            (p.phone && p.phone.indexOf(q) >= 0) ||
            (p.refNo && p.refNo.toLowerCase().indexOf(q) >= 0) ||
            (p.familyNo && p.familyNo.toLowerCase().indexOf(q) >= 0);
    });
    if (!res.length) {
        div.innerHTML = '<div style="padding:8px;color:#95a5a6;text-align:center;font-size:12px;">' +
            ({ ur: '😔 کوئی مریض نہیں ملا', en: '😔 No patient found', roman: '😔 Koi mareez nahi mila' }[currentLang]) + '</div>';
        return;
    }
    var h = '<ul>';
    res.slice(0, 6).forEach(function(p) {
        h += '<li onclick="studioPickPatient(\'' + p.id + '\')"><span>' + escapeHtml(p.name) + '</span><span style="color:#7f8c8d;font-size:11px;">' + escapeHtml(p.refNo) + (p.phone ? ' | ' + escapeHtml(p.phone) : '') + '</span></li>';
    });
    div.innerHTML = h + '</ul>';
}

function studioPickPatient(id) {
    var p = cachedPatients.find(function(x) { return x.id === id; });
    if (!p) return;
    diagnosisPatientId = id;
    var link = $('diagnosisPatientLink');
    if (link) link.style.display = 'block';
    var nm = $('diagnosisPatientName');
    if (nm) nm.textContent = p.name + ' (' + p.refNo + ')';
    studioTogglePatientSearch(false);
    renderStudioDetail();
    showToast('👤 ' + p.name);
}

function studioClearPatient() {
    diagnosisPatientId = null;
    var link = $('diagnosisPatientLink');
    if (link) link.style.display = 'none';
    renderStudioDetail();
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', function() {
    if (!$('studioSysTabs')) return;
    var q = $('studioSearch');
    if (q) q.addEventListener('input', renderStudioList);
    var pq = $('studioPatientQuery');
    if (pq) pq.addEventListener('input', studioSearchPatients);
    // restore last view
    var saved = null;
    try { saved = localStorage.getItem('dx_view'); } catch (e) {}
    switchDxView(saved === 'classic' ? 'classic' : 'studio');
    renderStudioAll();
});
