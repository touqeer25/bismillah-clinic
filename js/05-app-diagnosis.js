// ============================================================
// Bismillah Clinic — js/05-app-diagnosis.js
// DIAGNOSIS ENGINE + EXPORT/IMPORT + switchDxMode
// NOTE: Ye index.html ke inline script ka hissa hai (sirf jagah badli hai).
// WARNING: In files ka LOAD ORDER kabhi na badlein!
// ============================================================

// ==================== DIAGNOSIS ====================
let selectedSymptoms = new Set();
let currentCategory = 'all';
let diagnosisPatientId = null;

function initDiagnosis() {
    if (typeof SYMPTOMS_DB === 'undefined') {
        $('symptomsGrid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#e74c3c;">⚠️ diagnosis-data.js فائل نہیں ملی</div>';
        return;
    }
    renderCategoryTabs();
    renderSymptomsGrid();
    updateSelectedBox();
}

function renderCategoryTabs() {
    if (typeof CATEGORIES_DB === 'undefined') return;
    const container = $('categoryTabs');
    let html = '';
    Object.keys(CATEGORIES_DB).forEach(function(key) {
        const cat = CATEGORIES_DB[key];
        const active = key === currentCategory ? 'active' : '';
        html += '<button class="category-tab ' + active + '" onclick="filterByCategory(\'' + key + '\')">';
        html += cat.icon + ' ' + cat[currentLang] + '</button>';
    });
    container.innerHTML = html;
}

function filterByCategory(cat) {
    currentCategory = cat;
    renderCategoryTabs();
    renderSymptomsGrid();
}

function renderSymptomsGrid() {
    if (typeof SYMPTOMS_DB === 'undefined') return;
    const container = $('symptomsGrid');
    const searchQuery = $('symptomSearch').value.trim().toLowerCase();
    let html = '';
    Object.keys(SYMPTOMS_DB).forEach(function(key) {
        const symptom = SYMPTOMS_DB[key];
        if (currentCategory !== 'all' && symptom.category !== currentCategory) return;
        if (searchQuery) {
            const searchIn = (symptom.ur + ' ' + symptom.en + ' ' + symptom.roman).toLowerCase();
            if (!searchIn.includes(searchQuery)) return;
        }
        const selected = selectedSymptoms.has(key) ? 'selected' : '';
        const severe = symptom.severe ? 'severe' : '';
        html += '<div class="symptom-chip ' + selected + ' ' + severe + '" onclick="toggleSymptom(\'' + key + '\')">';
        html += (symptom.severe ? '⚠️ ' : '') + escapeHtml(symptom[currentLang]) + '</div>';
    });
    if (!html) html = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:#95a5a6;">😔 کوئی علامت نہیں ملی</div>';
    container.innerHTML = html;
}

function toggleSymptom(key) {
    if (selectedSymptoms.has(key)) selectedSymptoms.delete(key);
    else selectedSymptoms.add(key);
    renderSymptomsGrid();
    updateSelectedBox();
}

function updateSelectedBox() {
    const box = $('selectedSymptomsBox');
    $('selectedCount').textContent = selectedSymptoms.size;
    if (selectedSymptoms.size === 0) {
        box.innerHTML = '<div style="color:#95a5a6;font-size:13px;text-align:center;">' +
            ({ ur: 'نیچے سے علامات چنیں...', en: 'Select symptoms below...', roman: 'Neechay se alamat chunein...' }[currentLang]) + '</div>';
        return;
    }
    let html = '';
    selectedSymptoms.forEach(function(key) {
        const s = SYMPTOMS_DB[key];
        if (s) html += '<span class="selected-chip" onclick="toggleSymptom(\'' + key + '\')">' + escapeHtml(s[currentLang]) + '</span>';
    });
    box.innerHTML = html;
}

function clearAllSymptoms() {
    selectedSymptoms.clear();
    renderSymptomsGrid();
    updateSelectedBox();
    $('diagnosisResults').innerHTML = '';
}

function analyzeDiagnosis() {
    if (selectedSymptoms.size === 0) {
        showToast('⚠️ Please select symptoms', 'error');
        return;
    }
    const results = [];
    DISEASES_DB.forEach(function(disease) {
        const matched = disease.symptoms.filter(function(s) { return selectedSymptoms.has(s); });
        if (matched.length === 0) return;
        let score = 0;
        matched.forEach(function(s) {
            score += disease.keySymptoms && disease.keySymptoms.includes(s) ? 2 : 1;
        });
        const maxScore = disease.symptoms.length + (disease.keySymptoms ? disease.keySymptoms.length : 0);
        const percentage = Math.round((score / maxScore) * 100);
        if (percentage >= 25) {
            results.push({
                disease: disease, matchCount: matched.length,
                totalCount: disease.symptoms.length,
                percentage: Math.min(percentage, 99), matchedSymptoms: matched
            });
        }
    });
    results.sort(function(a, b) { return b.percentage - a.percentage; });
    displayDiagnosisResults(results);
}

function displayDiagnosisResults(results) {
    const container = $('diagnosisResults');
    if (results.length === 0) {
        container.innerHTML = '<div class="card"><div class="empty-state"><div class="icon">🤔</div><p>No match found</p></div></div>';
        return;
    }
    const hasSevere = Array.from(selectedSymptoms).some(function(s) {
        return SYMPTOMS_DB[s] && SYMPTOMS_DB[s].severe;
    });
    let html = '';
    if (hasSevere) {
        html += '<div class="emergency-alert">⚠️ خطرناک علامات! فوری میڈیکل امداد ضروری ہو سکتی ہے۔</div>';
    }
    html += '<div class="card">';
    html += '<div class="card-title">📊 Possible Conditions (' + results.length + ')</div>';
    results.slice(0, 5).forEach(function(r, idx) {
        const d = r.disease;
        const matchClass = r.percentage >= 70 ? 'high' : (r.percentage >= 45 ? 'medium' : 'low');
        const dIcon = d.icon || '💊';
        html += '<div class="disease-card ' + matchClass + '-match">';
        html += '<div class="disease-header">';
        html += '<div class="disease-name">' + dIcon + ' ' + (idx + 1) + '. ' + escapeHtml(d.name[currentLang]) + '</div>';
        html += '<span class="match-badge ' + matchClass + '">' + r.percentage + '%</span></div>';
        html += '<div style="font-size:12px;color:#7f8c8d;margin-bottom:8px;">✓ ' + r.matchCount + ' / ' + r.totalCount + ' symptoms</div>';
        html += '<div class="disease-section"><div class="disease-section-title">🔬 Tests</div><div>';
        d.tests.forEach(function(t) { html += '<span class="test-item">' + escapeHtml(t[currentLang] || t.en) + '</span>'; });
        html += '</div></div>';
        html += '<div class="disease-section"><div class="disease-section-title">💊 Remedies</div>';
        d.remedies.forEach(function(rem) {
            html += '<div class="remedy-item">';
            html += '<div class="remedy-name">💊 ' + escapeHtml(rem.name) + '</div>';
            html += '<div class="remedy-use">▸ ' + escapeHtml(rem.use[currentLang] || rem.use.en) + '</div>';
            html += '<div class="remedy-dose">🕐 ' + escapeHtml(rem.dose) + '</div></div>';
        });
        html += '</div>';
        if (d.redFlags && d.redFlags.length > 0) {
            html += '<div class="red-flags-box"><div class="red-flags-title">⚠️ Red Flags</div><div style="font-size:12px;">';
            d.redFlags.forEach(function(rf) {
                const s = SYMPTOMS_DB[rf];
                if (s) html += '• ' + escapeHtml(s[currentLang]) + ' &nbsp;';
            });
            html += '</div></div>';
        }
        if (d.advice) {
            html += '<div class="advice-box">📖 <strong>Advice:</strong> ' + escapeHtml(d.advice[currentLang] || d.advice.en) + '</div>';
        }
        html += '<div class="action-buttons">';
        if (diagnosisPatientId) {
            html += '<button class="btn btn-success btn-sm" onclick="copyToVisit(\'' + d.id + '\')">📋 Copy to Visit</button>';
        }
        html += '<button class="btn btn-info btn-sm" onclick="copyDiseaseInfo(\'' + d.id + '\')">📄 Copy</button>';
        html += '</div></div>';
    });
    html += '</div>';
    container.innerHTML = html;
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function copyDiseaseInfo(diseaseId) {
    const d = DISEASES_DB.find(function(x) { return x.id === diseaseId; });
    if (!d) return;
    let text = '📌 ' + d.name.ur + ' / ' + d.name.en + '\n\n🔬 Tests:\n';
    d.tests.forEach(function(t) { text += '• ' + (t.ur || t.en) + '\n'; });
    text += '\n💊 Remedies:\n';
    d.remedies.forEach(function(r) {
        text += '• ' + r.name + ' - ' + (r.use.ur || r.use.en) + ' (' + r.dose + ')\n';
    });
    if (d.advice) text += '\n📖 ' + (d.advice.ur || d.advice.en);
    navigator.clipboard.writeText(text).then(function() { showToast('✅ Copied!'); });
}

function copyToVisit(diseaseId) {
    const d = DISEASES_DB.find(function(x) { return x.id === diseaseId; });
    if (!d || !diagnosisPatientId) return;
    goToNewVisitPage(diagnosisPatientId);
    $('visitDiagnosis').value = d.name.ur + ' (' + d.name.en + ')';
    let prescText = '';
    d.remedies.forEach(function(r, i) {
        prescText += (i + 1) + '. ' + r.name + '\n   → ' + (r.use.ur || r.use.en) + '\n   → ' + r.dose + '\n\n';
    });
    $('visitPrescription').value = prescText.trim();
    if (d.advice) $('visitMethod').value = d.advice.ur || d.advice.en;
    const symptomsText = Array.from(selectedSymptoms).map(function(s) {
        return SYMPTOMS_DB[s] ? SYMPTOMS_DB[s].ur : '';
    }).filter(Boolean).join('، ');
    $('visitSymptoms').value = symptomsText;
    showToast('✅ Auto-filled!');
}

function clearDiagnosisPatient() {
    diagnosisPatientId = null;
    $('diagnosisPatientLink').style.display = 'none';
}

function openDiagnosisForPatient(patientId) {
    const patient = cachedPatients.find(function(p) { return p.id === patientId; });
    if (!patient) return;
    diagnosisPatientId = patientId;
    $('diagnosisPatientLink').style.display = 'block';
    $('diagnosisPatientName').textContent = patient.name + ' (' + patient.refNo + ')';
    const btn = document.querySelector('[data-page="diagnosis"]');
    showPage('diagnosis', btn);
    selectedSymptoms.clear();
    updateSelectedBox();
    $('diagnosisResults').innerHTML = '';
}

// ==================== EXPORT/IMPORT ====================
async function exportData() {
    showLoading();
    try {
        const data = { patients: cachedPatients, visits: cachedVisits, exportDate: new Date().toISOString() };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'clinic-backup-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('✅ Backup downloaded!');
    } catch(e) { showToast('❌ ' + e.message, 'error'); }
    finally { hideLoading(); }
}

async function importOldData() {
    const fileInput = $('importFile');
    const msgDiv = $('importMsg');
    if (!fileInput.files.length) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ Select a file</div>'; return; }
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.patients) { msgDiv.innerHTML = '<div class="alert alert-error">❌ Invalid format</div>'; return; }
            showLoading();
            let added = 0, skipped = 0, errors = 0;
            for (const p of data.patients) {
                try {
                    const exists = cachedPatients.find(function(cp) { return cp.refNo === p.refNo || (cp.phone === p.phone && cp.name === p.name); });
                    if (exists) { skipped++; continue; }
                    await savePatientDB({
                        id: p.id || generateId('P'), refNo: p.refNo, familyNo: p.familyNo || null,
                        name: p.name, fatherName: p.fatherName, age: p.age,
                        gender: p.gender, weight: p.weight, allergy: p.allergy,
                        phone: p.phone, address: p.address, initialSymptoms: p.initialSymptoms,
                        createdBy: p.createdBy || 'Imported'
                    });
                    added++;
                } catch(err) { errors++; }
            }
            if (data.visits) {
                for (const v of data.visits) {
                    try {
                        await saveVisitDB({
                            id: v.id || generateId('V'), patientId: v.patientId,
                            date: v.date, time: v.time, symptoms: v.symptoms, diagnosis: v.diagnosis,
                            prescription: v.prescription, days: v.days, method: v.method, notes: v.notes,
                            bp: v.bp, sugar: v.sugar, temperature: v.temperature, pulse: v.pulse,
                            type: v.type || 'registration', createdBy: v.createdBy || 'Imported'
                        });
                    } catch(err) { errors++; }
                }
            }
            await forceCacheRefresh();
            hideLoading();
            msgDiv.innerHTML = '<div class="alert alert-success">✅ Added: ' + added + ', Skipped: ' + skipped + (errors ? ', Errors: ' + errors : '') + '</div>';
            fileInput.value = '';
        } catch(err) { hideLoading(); msgDiv.innerHTML = '<div class="alert alert-error">❌ ' + err.message + '</div>'; }
    };
    reader.readAsText(fileInput.files[0]);
}

// ---------- switchDxMode (pehle index.html ke andar tha) ----------
    function switchDxMode(mode) {
        var ai = document.getElementById('dxModeAIContainer');
        var st = document.getElementById('dxModeStructContainer');
        var mn = document.getElementById('dxModeManualContainer');
        var btnAI = document.getElementById('dxTabBtnAI');
        var btnSt = document.getElementById('dxTabBtnStruct');
        var btnMn = document.getElementById('dxTabBtnManual');
        
        if(ai) ai.style.display = (mode === 'ai') ? 'block' : 'none';
        if(st) st.style.display = (mode === 'struct') ? 'block' : 'none';
        if(mn) mn.style.display = (mode === 'manual') ? 'block' : 'none';
        
        if(btnAI) btnAI.className = (mode === 'ai') ? 'btn btn-sm btn-purple' : 'btn btn-sm btn-light';
        if(btnSt) btnSt.className = (mode === 'struct') ? 'btn btn-sm btn-purple' : 'btn btn-sm btn-light';
        if(btnMn) btnMn.className = (mode === 'manual') ? 'btn btn-sm btn-purple' : 'btn btn-sm btn-light';
    }

    function loadDxTemplate(type) {
        var ta = document.getElementById('adxStatement');
        var templates = {
            fever: "مریض کو پچھلے 3 دن سے تیز بخار (104°F) ہے، ساتھ میں کپکپی اور سردی لگتی ہے، پیاس کم ہے، جسم میں شدید درد اور کمزوری ہے، سر درد اور پسینہ آتا ہے۔",
            cough: "خشک اور کھٹی کھانسی ہے جو رات کو لیٹنے سے بڑھ جاتی ہے، گلے میں خراش، سانس لینے میں تنگی اور سینے میں ہلکا درد ہے۔",
            stomach: "پیٹ میں شدید مروڑ اور درد ہے جو دباؤ سے کم ہوتا ہے، متلی، قے اور اسہال کی شکایت ہے، زبان پر سفید تہہ ہے۔",
            joint: "گٹھیا اور جوڑوں میں شدید درد ہے جو سردی اور بارش کے موسم میں بڑھ جاتا ہے، صبح اٹھتے وقت اکڑن ہوتی ہے، حرکت کرنے سے کچھ آرام ملتا ہے۔",
            chronic: "دائمی قبض، سستی، گرمی یا سردی کی شدت سے تکلیف، رات کو خواب میں خوفناک مناظر، چڑچڑاپن اور غصہ زیادہ آتا ہے۔"
        };
        if(ta && templates[type]) {
            ta.value = templates[type];
            switchDxMode('ai');
            if(window.showToast) showToast('ٹیمپلیٹ لوڈ ہو گیا ہے', 'success');
        }
    }

    function generateFromStructuredForm() {
        var comp = document.getElementById('structComplaint');
        var dur = document.getElementById('structDuration');
        var therm = document.getElementById('structThermal');
        var thirst = document.getElementById('structThirst');
        var mods = document.getElementById('structModalities');
        var ments = document.getElementById('structMentals');
        
        var statement = "مرکزی شکایت: " + (comp ? comp.value : '') + 
                        " | مدت: " + (dur ? dur.value : '') + 
                        " | تھرمل: " + (therm ? therm.value : '') + 
                        " | پیاس: " + (thirst ? thirst.value : '') + 
                        " | بڑھوتری/کمی: " + (mods ? mods.value : '') + 
                        " | ذہنی و جسمانی: " + (ments ? ments.value : '');
        
        var ta = document.getElementById('adxStatement');
        if(ta) ta.value = statement;
        switchDxMode('ai');
        var btn = document.getElementById('adxAnalyzeBtn');
        if(btn) btn.click();
    }
