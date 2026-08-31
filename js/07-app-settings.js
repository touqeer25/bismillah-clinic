// ============================================================
// Bismillah Clinic — js/07-app-settings.js
// DISEASE AUTO-SUGGEST + DASHBOARD FILTERS + AI + SYMPTOM MODE
// NOTE: Ye index.html ke inline script ka hissa hai (sirf jagah badli hai).
// WARNING: In files ka LOAD ORDER kabhi na badlein!
// ============================================================

// ==================== DISEASE AUTO-SUGGEST ====================
var diseaseSuggestTimer = null;

function getDiseaseSuggestSettings() {
    try {
        return JSON.parse(localStorage.getItem('disease_suggest_settings') || '{"threshold":30,"maxDiseases":3}');
    } catch(e) { return { threshold: 30, maxDiseases: 3 }; }
}

function saveDiseaseSuggestSettings() {
    var settings = {
        threshold: parseInt($('suggestThreshold') ? $('suggestThreshold').value : 30),
        maxDiseases: parseInt($('suggestMaxDiseases') ? $('suggestMaxDiseases').value : 3)
    };
    localStorage.setItem('disease_suggest_settings', JSON.stringify(settings));
}

function loadDiseaseSuggestSettingsUI() {
    var settings = getDiseaseSuggestSettings();
    if ($('suggestThreshold')) { $('suggestThreshold').value = settings.threshold; $('suggestThresholdVal').textContent = settings.threshold + '%'; }
    if ($('suggestMaxDiseases')) $('suggestMaxDiseases').value = settings.maxDiseases;
}

function autoSuggestDiseases(textareaId, panelId) {
    // Clear previous timer
    if (diseaseSuggestTimer) clearTimeout(diseaseSuggestTimer);
    
    // Debounce: wait 600ms after typing stops
    diseaseSuggestTimer = setTimeout(function() {
        doAutoSuggest(textareaId, panelId);
    }, 600);
}

function doAutoSuggest(textareaId, panelId) {
    var textarea = $(textareaId);
    var panel = $(panelId);
    var contentDiv = $(panelId + 'Content');
    var countSpan = $(panelId.replace('DiseaseSuggest', 'DiseaseCount'));
    
    if (!textarea || !panel || !contentDiv) return;
    
    var text = textarea.value.trim();
    
    // Need at least 5 characters for matching
    if (text.length < 5) {
        panel.classList.add('hidden');
        return;
    }
    
    // Step 1: Find which SYMPTOMS_DB entries are mentioned in the text (fuzzy matching)
    var foundSymptoms = [];
    var textLower = text.toLowerCase();
    
    Object.keys(SYMPTOMS_DB).forEach(function(key) {
        var sym = SYMPTOMS_DB[key];
        if (!sym) return;
        // Check all 3 languages
        var urMatch = sym.ur && textLower.indexOf(sym.ur.toLowerCase()) !== -1;
        var enMatch = sym.en && textLower.indexOf(sym.en.toLowerCase()) !== -1;
        var romanMatch = sym.roman && textLower.indexOf(sym.roman.toLowerCase()) !== -1;
        if (urMatch || enMatch || romanMatch) {
            foundSymptoms.push(key);
        }
    });
    
    if (foundSymptoms.length === 0) {
        panel.classList.add('hidden');
        return;
    }
    
    var foundSet = new Set(foundSymptoms);
    
    // Step 2: Match against DISEASES_DB
    var settings = getDiseaseSuggestSettings();
    var threshold = settings.threshold || 30;
    var maxDiseases = settings.maxDiseases || 3;
    
    var results = [];
    
    (window.DISEASES_DB || []).forEach(function(disease) {
        if (!disease.symptoms || disease.symptoms.length === 0) return;
        var matched = disease.symptoms.filter(function(s) { return foundSet.has(s); });
        if (matched.length === 0) return;
        
        var score = 0;
        matched.forEach(function(s) {
            score += (disease.keySymptoms && disease.keySymptoms.indexOf(s) !== -1) ? 2 : 1;
        });
        var maxScore = disease.symptoms.length + (disease.keySymptoms ? disease.keySymptoms.length : 0);
        var percentage = Math.round((score / maxScore) * 100);
        
        if (percentage >= threshold) {
            results.push({
                disease: disease,
                matchCount: matched.length,
                percentage: Math.min(percentage, 99)
            });
        }
    });
    
    results.sort(function(a, b) { return b.percentage - a.percentage; });
    results = results.slice(0, maxDiseases);
    
    if (results.length === 0) {
        panel.classList.add('hidden');
        return;
    }
    
    // Step 3: Render results
    var lang = (typeof currentLang !== 'undefined') ? currentLang : 'ur';
    
    var labelTexts = {
        ur: { tests: '🔬 ٹیسٹ:', advice: '📖 پرہیز / احتیاط:', copyDiag: '📋 تشخیص میں کاپی', copyPresc: '💊 نسخے میں کاپی', noMatch: 'کوئی میچ نہیں' },
        en: { tests: '🔬 Tests:', advice: '📖 Advice / Diet:', copyDiag: '📋 Copy to Diagnosis', copyPresc: '💊 Copy to Prescription', noMatch: 'No match found' },
        roman: { tests: '🔬 Tests:', advice: '📖 Parhez / Ehtiyaat:', copyDiag: '📋 Diagnosis mein copy', copyPresc: '💊 Nuskhe mein copy', noMatch: 'Koi match nahi' }
    };
    var lbl = labelTexts[lang] || labelTexts.en;
    
    // Identify form type
    var formType = (panelId.indexOf('reg') !== -1) ? 'reg' : 'nv';
    
    var html = '';
    results.forEach(function(r, idx) {
        var d = r.disease;
        var dIcon = d.icon || '💊';
        var dName = d.name[lang] || d.name.en || 'Unknown';
        
        html += '<div class="disease-suggest-item">';
        html += '<div class="ds-name">';
        html += '<span>' + dIcon + ' ' + escapeHtml(dName) + ' <span style="font-size:11px;color:#7f8c8d;">(' + r.matchCount + ' symptoms)</span></span>';
        html += '<span class="ds-pct">' + r.percentage + '%</span>';
        html += '</div>';
        
        // Tests
        if (d.tests && d.tests.length > 0) {
            html += '<div class="ds-detail"><strong>' + lbl.tests + '</strong> ';
            d.tests.forEach(function(t) {
                html += '<span>' + escapeHtml(t[lang] || t.en || '') + '</span>';
            });
            html += '</div>';
        }
        
        // Advice / Diet
        if (d.advice && (d.advice[lang] || d.advice.en)) {
            html += '<div class="ds-detail"><strong>' + lbl.advice + '</strong> ';
            html += '<span>' + escapeHtml((d.advice[lang] || d.advice.en).substring(0, 120)) + '</span>';
            html += '</div>';
        }
        
        // Action buttons
        html += '<div class="ds-actions">';
        html += '<button onclick="copyDiseaseToForm(\'' + formType + '\',\'' + d.id + '\',\'diagnosis\')" title="' + lbl.copyDiag + '">📋</button>';
        html += '<button onclick="copyDiseaseToForm(\'' + formType + '\',\'' + d.id + '\',\'prescription\')" title="' + lbl.copyPresc + '">💊</button>';
        html += '<button onclick="copyDiseaseToForm(\'' + formType + '\',\'' + d.id + '\',\'both\')">📋+💊</button>';
        html += '</div>';
        
        html += '</div>';
    });
    
    contentDiv.innerHTML = html;
    if (countSpan) countSpan.textContent = '(' + results.length + ')';
    panel.classList.remove('hidden');
}

function copyDiseaseToForm(formType, diseaseId, target) {
    var d = (window.DISEASES_DB || []).find(function(x) { return x.id === diseaseId; });
    if (!d) return;
    
    var lang = (typeof currentLang !== 'undefined') ? currentLang : 'ur';
    var dName = d.name[lang] || d.name.en || '';
    
    // Determine which fields to fill
    var diagId = formType === 'reg' ? 'firstVisitDiagnosis' : 'nvDiagnosis';
    var prescId = formType === 'reg' ? 'firstVisitPrescription' : 'nvPrescription';
    var methodId = formType === 'reg' ? 'firstVisitMethod' : 'nvMethod';
    
    if (target === 'diagnosis' || target === 'both') {
        var diagField = $(diagId);
        if (diagField) {
            var current = diagField.value.trim();
            var newDiag = dName;
            if (current) newDiag = current + '\n' + newDiag;
            diagField.value = newDiag;
        }
    }
    
    if (target === 'prescription' || target === 'both') {
        var prescField = $(prescId);
        if (prescField && d.remedies) {
            var prescText = '';
            d.remedies.forEach(function(r, i) {
                prescText += (i + 1) + '. ' + r.name + '\n   Dose: ' + r.dose + '\n\n';
            });
            var current = prescField.value.trim();
            if (current) prescText = current + '\n\n' + prescText;
            prescField.value = prescText.trim();
        }
        
        // Also copy advice to method field
        if (target === 'both' && d.advice) {
            var methodField = $(methodId);
            if (methodField) {
                var adv = d.advice[lang] || d.advice.en || '';
                var curMethod = methodField.value.trim();
                if (curMethod) adv = curMethod + '\n' + adv;
                methodField.value = adv;
            }
        }
    }
    
    // Show toast
    var toastTexts = {
        ur: '✅ ' + dName + ' کاپی ہو گیا',
        en: '✅ Copied: ' + (d.name.en || dName),
        roman: '✅ ' + dName + ' copy ho gaya'
    };
    if (typeof showToast === 'function') showToast(toastTexts[lang] || toastTexts.en);
}

window.autoSuggestDiseases = autoSuggestDiseases;
window.copyDiseaseToForm = copyDiseaseToForm;
window.saveDiseaseSuggestSettings = saveDiseaseSuggestSettings;
window.loadDiseaseSuggestSettingsUI = loadDiseaseSuggestSettingsUI;

// ==================== DASHBOARD FILTER SETTINGS ====================
function getDashboardFilterSettings() {
    try {
        return JSON.parse(localStorage.getItem('dashboard_filter_settings') || '{}');
    } catch(e) { return {}; }
}

function saveDashboardFilterSettings(settings) {
    localStorage.setItem('dashboard_filter_settings', JSON.stringify(settings));
}

function applyDashboardFilter() {
    var duration = $('filterDuration') ? $('filterDuration').value : 'allTime';
    var dateFrom = $('filterDateFrom') ? $('filterDateFrom').value : '';
    var dateTo = $('filterDateTo') ? $('filterDateTo').value : '';
    
    saveDashboardFilterSettings({
        duration: duration,
        dateFrom: dateFrom,
        dateTo: dateTo
    });
    
    updateDashboard();
    
    var toastTexts = { ur: '✅ فلٹر اپلائی ہو گیا', en: '✅ Filter Applied', roman: '✅ Filter Apply Ho Gaya' };
    showToast(toastTexts[currentLang] || toastTexts.en);
}

function clearDateRange() {
    if ($('filterDateFrom')) $('filterDateFrom').value = '';
    if ($('filterDateTo')) $('filterDateTo').value = '';
    applyDashboardFilter();
}

function resetDashboardFilters() {
    if ($('filterDuration')) $('filterDuration').value = 'allTime';
    if ($('filterDateFrom')) $('filterDateFrom').value = '';
    if ($('filterDateTo')) $('filterDateTo').value = '';
    
    // Reset all tab toggles to checked
    var toggles = document.querySelectorAll('#dashboardTabToggles input[type=checkbox]');
    toggles.forEach(function(cb) { cb.checked = true; });
    
    saveDashboardFilterSettings({ duration: 'allTime', dateFrom: '', dateTo: '' });
    saveDashboardTabSettings();
    
    updateDashboard();
    
    var toastTexts = { ur: '🔄 فلٹر ری سیٹ', en: '🔄 Filters Reset', roman: '🔄 Filter Reset' };
    showToast(toastTexts[currentLang] || toastTexts.en);
}

function saveDashboardTabSettings() {
    var settings = {
        today: $('toggleTabToday') ? $('toggleTabToday').checked : true,
        followups: $('toggleTabFollowups') ? $('toggleTabFollowups').checked : true,
        newMonth: $('toggleTabNewMonth') ? $('toggleTabNewMonth').checked : true,
        month: $('toggleTabMonth') ? $('toggleTabMonth').checked : true,
        allTime: $('toggleTabAllTime') ? $('toggleTabAllTime').checked : true
    };
    localStorage.setItem('dashboard_tab_visibility', JSON.stringify(settings));
    applyDashboardTabVisibility();
}

function applyDashboardTabVisibility() {
    try {
        var settings = JSON.parse(localStorage.getItem('dashboard_tab_visibility') || '{}');
    } catch(e) { var settings = {}; }
    
    var tabs = ['today', 'followups', 'newMonth', 'month', 'allTime'];
    tabs.forEach(function(tab) {
        var el = $('statTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
        if (el) {
            var visible = settings[tab] !== undefined ? settings[tab] : true;
            el.style.display = visible ? '' : 'none';
        }
    });
}

function loadDashboardFilterUI() {
    var settings = getDashboardFilterSettings();
    if ($('filterDuration')) $('filterDuration').value = settings.duration || 'allTime';
    if ($('filterDateFrom')) $('filterDateFrom').value = settings.dateFrom || '';
    if ($('filterDateTo')) $('filterDateTo').value = settings.dateTo || '';
    
    // Load tab visibility
    try {
        var tabSettings = JSON.parse(localStorage.getItem('dashboard_tab_visibility') || '{}');
    } catch(e) { var tabSettings = {}; }
    if ($('toggleTabToday')) $('toggleTabToday').checked = tabSettings.today !== undefined ? tabSettings.today : true;
    if ($('toggleTabFollowups')) $('toggleTabFollowups').checked = tabSettings.followups !== undefined ? tabSettings.followups : true;
    if ($('toggleTabNewMonth')) $('toggleTabNewMonth').checked = tabSettings.newMonth !== undefined ? tabSettings.newMonth : true;
    if ($('toggleTabMonth')) $('toggleTabMonth').checked = tabSettings.month !== undefined ? tabSettings.month : true;
    if ($('toggleTabAllTime')) $('toggleTabAllTime').checked = tabSettings.allTime !== undefined ? tabSettings.allTime : true;
}

// ==================== AI ASSISTANT ====================
var AI_BASE_URL = 'http://localhost:11434';
var _aiPanelOpen = { reg: false, nv: false };

function toggleAIPanel(formType, panelId, textareaId) {
    var panel = document.getElementById(panelId);
    if (!panel) return;
    if (_aiPanelOpen[formType]) { panel.classList.add('hidden'); _aiPanelOpen[formType] = false; return; }
    askAI(textareaId, panelId);
    _aiPanelOpen[formType] = true;
}

async function askAI(textareaId, resultPanelId) {
    var textarea = document.getElementById(textareaId);
    var panel = document.getElementById(resultPanelId);
    if (!textarea || !panel) return;
    var symptoms = textarea.value.trim();
    if (symptoms.length < 10) { panel.classList.remove('hidden'); panel.innerHTML = '<div class="ai-panel-content"><p style="color:#ff6b6b;">⚠️ Please write at least 10 characters first</p></div>'; return; }
    panel.classList.remove('hidden');
    panel.innerHTML = '<div class="ai-panel-header">🤖 AI Assistant <span class="ai-badge">Llama 3.2</span></div><div class="ai-panel-content"><span class="spinner"></span> Analyzing symptoms...</div>';
    var prompt = 'You are a homeopathic assistant. Suggest rubrics, top 5 remedies, follow-up questions, and tests for these symptoms: ' + symptoms;
    try {
        var resp = await fetch(AI_BASE_URL + '/api/generate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'llama3.2',prompt:prompt,stream:false})});
        if (!resp.ok) throw new Error('Ollama not running');
        var data = await resp.json();
        var ans = (data.response||'No response').replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<b>$1</b>');
        panel.innerHTML = '<div class="ai-panel-header">🤖 AI Assistant<span class="ai-badge">Llama 3.2</span></div><div class="ai-panel-content">'+ans+'</div>';
    } catch(e) {
        panel.innerHTML = '<div class="ai-panel-header">🤖 AI Assistant<span class="ai-badge offline">Offline</span></div><div class="ai-panel-content"><p style="color:#ff6b6b;">🤖 Cannot connect to Ollama. Is it running?<br><small>Install: ollama.com | Run: ollama run llama3.2</small></p></div>';
    }
}

// ==================== SYMPTOM MODE SWITCHER ====================
var symptomModes = { reg: 'disease', nv: 'disease' };
function setSymptomMode(formType, mode) {
    symptomModes[formType] = mode;
    var bd = document.getElementById(formType + 'ModeDisease');
    var br = document.getElementById(formType + 'ModeRepertory');
    if (bd) bd.className = mode==='disease' ? 'mode-btn active-disease' : 'mode-btn';
    if (br) br.className = mode==='repertory' ? 'mode-btn active-repertory' : 'mode-btn';
}
