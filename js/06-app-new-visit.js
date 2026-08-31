// ============================================================
// Bismillah Clinic — js/06-app-new-visit.js
// NEW VISIT PAGE + DASHBOARD STAT TABS
// NOTE: Ye index.html ke inline script ka hissa hai (sirf jagah badli hai).
// WARNING: In files ka LOAD ORDER kabhi na badlein!
// ============================================================

// ==================== NEW VISIT PAGE ====================
var nvCurrentPatientId = null;
var nvFamilyMembers = [];
var nvFamilyIndex = 0;

function nvSearchPatients() {
    var query = $('visitSearchInput').value.trim().toLowerCase();
    var div = $('visitSearchResults');
    if (!query || query.length < 2) { div.innerHTML = ''; return; }
    var results = cachedPatients.filter(function(p) {
        return (p.name && p.name.toLowerCase().includes(query)) ||
            (p.phone && p.phone.includes(query)) ||
            (p.refNo && p.refNo.toLowerCase().includes(query)) ||
            (p.familyNo && p.familyNo.toLowerCase().includes(query)) ||
            (p.fatherName && p.fatherName.toLowerCase().includes(query)) ||
            (p.address && p.address.toLowerCase().includes(query));
    });
    if (results.length === 0) { div.innerHTML = '<div style="padding:10px;color:#95a5a6;text-align:center;">😔 ' + ({ur:'کوئی نتیجہ نہیں',en:'No results',roman:'Koi nateeja nahi'}[currentLang]||'No results') + '</div>'; return; }
    var html = '<ul class="today-list" style="border:1px solid #ddd;border-radius:8px;">';
    results.slice(0, 8).forEach(function(p) {
        var visits = cachedVisits.filter(function(v) { return v.patientId === p.id; });
        html += '<li onclick="nvSelectPatient(\'' + p.id + '\')" style="cursor:pointer;">';
        html += '<div><div class="patient-list-name">' + escapeHtml(p.name) + '</div>';
        html += '<div class="patient-list-time">' + escapeHtml(p.refNo) + (p.familyNo ? ' | ' + escapeHtml(p.familyNo) : '') + ' | ' + escapeHtml(p.phone || '') + (p.address ? ' | ' + escapeHtml(p.address) : '') + '</div></div>';
        html += '<span class="badge badge-visit">' + visits.length + ' ' + ({ur:'وزٹ',en:'visits',roman:'visits'}[currentLang]||'visits') + '</span></li>';
    });
    html += '</ul>';
    div.innerHTML = html;
}

function nvSelectPatient(patientId) {
    var patient = cachedPatients.find(function(p) { return p.id === patientId; });
    if (!patient) return;
    nvCurrentPatientId = patientId;
    $('visitSearchResults').innerHTML = '';
    $('visitSearchInput').value = '';
    
    // Show patient info
    $('nvSelectedPatient').classList.remove('hidden');
    $('nvFormArea').classList.remove('hidden');
    $('nvPatientName').textContent = patient.name;
    $('nvPatientMeta').textContent = patient.refNo + (patient.age ? ' | ' + patient.age : '') + (patient.gender ? ' | ' + translateGender(patient.gender) : '') + (patient.phone ? ' | ' + patient.phone : '');
    $('nvPatientId').value = patientId;
    $('nvFamilyNo').value = patient.familyNo || '';
    $('nvAllergy').value = patient.allergy || '';
    $('nvVisitRef').value = generateVisitRef();
    
    var now = new Date();
    $('nvDate').value = now.toISOString().split('T')[0];
    $('nvTime').value = now.toTimeString().substring(0, 5);
    nvClearFormFields();
    
    // Build family dropdown (sorted by visit count)
    nvBuildFamilyDropdown(patient);
    
    // Show last visit, hide full history
    nvShowLastVisit(patientId);
    $('nvAllHistory').classList.add('hidden');
}

function nvBuildFamilyDropdown(patient) {
    var sel = $('nvFamilySelect');
    sel.innerHTML = '';
    nvFamilyMembers = [];
    if (patient.familyNo) {
        nvFamilyMembers = cachedPatients.filter(function(p) { return p.familyNo === patient.familyNo; });
        // Sort by visit count descending
        nvFamilyMembers.sort(function(a, b) {
            var va = cachedVisits.filter(function(v) { return v.patientId === a.id; }).length;
            var vb = cachedVisits.filter(function(v) { return v.patientId === b.id; }).length;
            return vb - va;
        });
    } else {
        nvFamilyMembers = [patient];
    }
    nvFamilyMembers.forEach(function(m, i) {
        var opt = document.createElement('option');
        opt.value = m.id;
        opt.textContent = m.name;
        if (m.id === patient.id) { opt.selected = true; nvFamilyIndex = i; }
        sel.appendChild(opt);
    });
}

function nvSelectFamilyMember(patientId) {
    if (patientId) nvSelectPatient(patientId);
}

function nvPrevFamily() {
    if (nvFamilyMembers.length <= 1) return;
    nvFamilyIndex = (nvFamilyIndex - 1 + nvFamilyMembers.length) % nvFamilyMembers.length;
    nvSelectPatient(nvFamilyMembers[nvFamilyIndex].id);
}

function nvNextFamily() {
    if (nvFamilyMembers.length <= 1) return;
    nvFamilyIndex = (nvFamilyIndex + 1) % nvFamilyMembers.length;
    nvSelectPatient(nvFamilyMembers[nvFamilyIndex].id);
}

function nvShowLastVisit(patientId) {
    var visits = cachedVisits.filter(function(v) { return v.patientId === patientId; });
    var container = $('nvLastVisit');
    var content = $('nvLastVisitContent');
    if (visits.length === 0) { container.classList.add('hidden'); return; }
    container.classList.remove('hidden');
    visits.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
    var last = visits[0];
    var html = '<div style="background:#f8f9fa;border-radius:8px;padding:12px;font-size:13px;">';
    html += '<div style="color:#2980b9;font-weight:bold;margin-bottom:6px;">📅 ' + escapeHtml(last.date || '-') + ' 🕐 ' + escapeHtml(last.time || '-') + (last.visitRef ? ' | ' + escapeHtml(last.visitRef) : '') + '</div>';
    if (last.symptoms) html += '<div><strong>' + ({ur:'📝 علامات',en:'📝 Symptoms',roman:'📝 Alamat'}[currentLang]) + ':</strong> ' + escapeHtml(last.symptoms) + '</div>';
    if (last.diagnosis) html += '<div><strong>' + ({ur:'🔬 تشخیص',en:'🔬 Diagnosis',roman:'🔬 Tashkhees'}[currentLang]) + ':</strong> ' + escapeHtml(last.diagnosis) + '</div>';
    if (last.prescription) html += '<div><strong>' + ({ur:'💊 نسخہ',en:'💊 Prescription',roman:'💊 Nuskha'}[currentLang]) + ':</strong> ' + escapeHtml(last.prescription) + '</div>';
    if (last.days) html += '<div><strong>' + ({ur:'📆 دن',en:'📆 Days',roman:'📆 Din'}[currentLang]) + ':</strong> ' + escapeHtml(last.days) + '</div>';
    html += '</div>';
    content.innerHTML = html;
}

function nvClearFormFields() {
    ['nvSymptoms','nvDiagnosis','nvPrescription','nvMethod','nvDays','nvNotes',
     'nvBP','nvSugar','nvTemp','nvPulse'].forEach(function(id) { if ($(id)) $(id).value = ''; });
}

function nvClearForm() {
    nvClearFormFields();
    $('newVisitPageMsg').innerHTML = '';
}

function nvClearPatient() {
    nvCurrentPatientId = null;
    $('nvSelectedPatient').classList.add('hidden');
    $('nvFormArea').classList.add('hidden');
    $('nvLastVisit').classList.add('hidden');
    $('nvAllHistory').classList.add('hidden');
    $('visitSearchInput').value = '';
    $('visitSearchResults').innerHTML = '';
    $('newVisitPageMsg').innerHTML = '';
}

async function nvSaveVisit() {
    var patientId = $('nvPatientId').value;
    if (!patientId) { showToast('⚠️ ' + ({ur:'پہلے مریض منتخب کریں',en:'Select patient first',roman:'Pehle mareez select karein'}[currentLang]), 'error'); return; }
    var symptoms = $('nvSymptoms').value.trim();
    if (!symptoms) { showToast('⚠️ ' + ({ur:'علامات لکھیں',en:'Enter symptoms',roman:'Alamat likhein'}[currentLang]), 'error'); return; }
    
    var saveBtn = $('nvSaveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="loading-inline"></span>';
    
    var visitData = {
        id: generateId('V'), patientId: patientId,
        visitRef: $('nvVisitRef').value || generateVisitRef(),
        date: $('nvDate').value, time: $('nvTime').value,
        symptoms: symptoms, diagnosis: $('nvDiagnosis').value.trim(),
        prescription: $('nvPrescription').value.trim(), method: $('nvMethod').value.trim(),
        days: $('nvDays').value.trim(), notes: $('nvNotes').value.trim(),
        bp: $('nvBP').value.trim(), sugar: $('nvSugar').value.trim(),
        temperature: $('nvTemp').value.trim(), pulse: $('nvPulse').value.trim(),
        type: 'followup',
        createdAt: new Date().toISOString(),
        createdBy: currentUserData ? currentUserData.name : 'Unknown'
    };
    
    try {
        var savedOnline = false;
        if (navigator.onLine) {
            try { await saveVisitDB(visitData); savedOnline = true; await forceCacheRefresh(); } catch(e) { console.error(e); }
        }
        if (!savedOnline) {
            savePendingVisit(visitData);
            cachedVisits.unshift(visitData);
            localStorage.setItem('cached_visits', JSON.stringify(cachedVisits));
        }
        
        var successMsg = {ur:'✅ وزٹ محفوظ ہو گئی!',en:'✅ Visit saved!',roman:'✅ Visit mehfooz ho gayi!'}[currentLang];
        $('newVisitPageMsg').innerHTML = '<div class="alert alert-success">' + successMsg + (savedOnline ? '' : ' (offline)') + '</div>';
        showToast(successMsg);
        
        // Don't clear - keep patient selected, just clear form fields and refresh
        nvClearFormFields();
        $('nvVisitRef').value = generateVisitRef();
        var now = new Date();
        $('nvDate').value = now.toISOString().split('T')[0];
        $('nvTime').value = now.toTimeString().substring(0, 5);
        nvShowLastVisit(patientId);
        nvBuildFamilyDropdown(cachedPatients.find(function(p) { return p.id === patientId; }));
        
        setTimeout(function() { $('newVisitPageMsg').innerHTML = ''; }, 5000);
    } catch(err) {
        $('newVisitPageMsg').innerHTML = '<div class="alert alert-error">❌ ' + escapeHtml(err.message) + '</div>';
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span data-ur="💾 محفوظ کریں" data-en="💾 Save" data-roman="💾 Mehfooz">💾 محفوظ کریں</span>';
        applyLanguage();
    }
}

function goToNewVisitPage(patientId) {
    showPage('newVisitPage', document.querySelector('.nav-btn[data-page="newVisitPage"]'));
    if (patientId) {
        setTimeout(function() { nvSelectPatient(patientId); }, 200);
    }
}

function nvShowFullHistory() {
    if (!nvCurrentPatientId) return;
    showPatientDetail(nvCurrentPatientId);
}

function nvToggleAllHistory() {
    if (!nvCurrentPatientId) return;
    var container = $('nvAllHistory');
    var content = $('nvAllHistoryContent');
    var lastVisit = $('nvLastVisit');
    
    // Toggle
    if (!container.classList.contains('hidden')) {
        container.classList.add('hidden');
        lastVisit.classList.remove('hidden');
        return;
    }
    
    // Hide last visit when showing all
    lastVisit.classList.add('hidden');
    
    var visits = cachedVisits.filter(function(v) { return v.patientId === nvCurrentPatientId; });
    visits.sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
    
    if (visits.length === 0) {
        content.innerHTML = '<div style="padding:15px;color:#95a5a6;text-align:center;">' + ({ur:'کوئی وزٹ نہیں',en:'No visits',roman:'Koi visit nahi'}[currentLang]) + '</div>';
        container.classList.remove('hidden');
        return;
    }
    
    var html = '';
    visits.forEach(function(v, idx) {
        var isReg = v.type === 'registration' || v.type === undefined;
        var badge = isReg ? '<span style="background:#fff8dc;color:#b8860b;padding:2px 8px;border-radius:10px;font-size:10px;">🌟 Registration</span>' : '<span style="background:#e8f4f8;color:#17a2b8;padding:2px 8px;border-radius:10px;font-size:10px;">Follow-up #' + (visits.length - idx) + '</span>';
        
        html += '<div style="background:#f8f9fa;border-radius:8px;padding:10px 12px;margin-bottom:8px;font-size:13px;border-left:3px solid ' + (isReg ? '#d4af37' : '#2980b9') + ';">';
        html += '<div style="color:#2980b9;font-weight:bold;margin-bottom:4px;">' + badge + ' 📅 ' + escapeHtml(v.date || '-') + ' 🕐 ' + escapeHtml(v.time || '-') + (v.visitRef ? ' | ' + escapeHtml(v.visitRef) : '') + '</div>';
        if (v.symptoms) html += '<div>📝 ' + escapeHtml(v.symptoms) + '</div>';
        if (v.diagnosis) html += '<div>🔬 ' + escapeHtml(v.diagnosis) + '</div>';
        if (v.prescription) html += '<div>💊 ' + escapeHtml(v.prescription) + '</div>';
        if (v.method) html += '<div>📖 ' + escapeHtml(v.method) + '</div>';
        if (v.days) html += '<div>📆 ' + escapeHtml(v.days) + ' ' + ({ur:'دن',en:'days',roman:'din'}[currentLang]) + '</div>';
        if (v.bp || v.sugar || v.temperature || v.pulse) {
            html += '<div style="color:#17a2b8;font-size:11px;margin-top:3px;">';
            if (v.bp) html += 'BP: ' + escapeHtml(v.bp) + ' ';
            if (v.sugar) html += 'Sugar: ' + escapeHtml(v.sugar) + ' ';
            if (v.temperature) html += 'Temp: ' + escapeHtml(v.temperature) + ' ';
            if (v.pulse) html += 'Pulse: ' + escapeHtml(v.pulse);
            html += '</div>';
        }
        html += '</div>';
    });
    
    content.innerHTML = html;
    container.classList.remove('hidden');
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==================== DASHBOARD STAT TABS ====================
var currentStatFilter = '';

function showStatPatients(type) {
    currentStatFilter = type;
    sessionStorage.setItem('activeStatTab', type);
    
    var filterSettings = getDashboardFilterSettings();
    var filterDuration = filterSettings.duration || 'allTime';
    var filterDateFrom = filterSettings.dateFrom || '';
    var filterDateTo = filterSettings.dateTo || '';
    
    // Calculate filter start date
    var now = new Date();
    var filterStartDate = '';
    if (filterDuration === '1month') {
        var d = new Date(now); d.setMonth(d.getMonth() - 1);
        filterStartDate = d.toISOString().split('T')[0];
    } else if (filterDuration === '3months') {
        var d = new Date(now); d.setMonth(d.getMonth() - 3);
        filterStartDate = d.toISOString().split('T')[0];
    } else if (filterDuration === '6months') {
        var d = new Date(now); d.setMonth(d.getMonth() - 6);
        filterStartDate = d.toISOString().split('T')[0];
    } else if (filterDuration === '1year') {
        var d = new Date(now); d.setFullYear(d.getFullYear() - 1);
        filterStartDate = d.toISOString().split('T')[0];
    }
    if (filterDateFrom) filterStartDate = filterDateFrom;
    var effectiveEndDate = filterDateTo || new Date().toISOString().split('T')[0];
    
    function inFilterRange(dateStr) {
        if (!dateStr) return true;
        var d = dateStr.substring(0, 10);
        if (filterStartDate && d < filterStartDate) return false;
        if (filterDateTo && d > filterDateTo) return false;
        return true;
    }
    
    var patients = cachedPatients;
    var visits = cachedVisits;
    var today = new Date().toISOString().split('T')[0];
    var thisMonth = today.substring(0, 7);
    var followupVisits = visits.filter(function(v) { return v.type === 'followup'; });
    
    var filteredPatients = [];
    var titleTexts = {
        ur: { today: '📅 آج کے مریض', followups: '🔄 فالو اپ وزٹس', newMonth: '🆕 نئے مریض (اس ماہ)', month: '📆 اس ماہ کے مریض', allTime: '📊 آل ٹائم مریض' },
        en: { today: "📅 Today's Patients", followups: '🔄 Follow-up Visits', newMonth: '🆕 New Patients (This Month)', month: "📆 This Month's Patients", allTime: '📊 All-Time Patients' },
        roman: { today: '📅 Aaj ke Mareez', followups: '🔄 Follow-up Visits', newMonth: '🆕 Naye Mareez (Is Mah)', month: '📆 Is Mah ke Mareez', allTime: '📊 All-Time Mareez' }
    };
    
    var panelTitle = titleTexts[currentLang][type] || titleTexts.en[type] || type;
    $('statPanelTitle').textContent = panelTitle;
    
    if (type === 'today') {
        var todaySet = new Set();
        patients.filter(function(p) { return p.createdAt && p.createdAt.startsWith(today); })
            .forEach(function(p) { todaySet.add(p.id); filteredPatients.push(p); });
        followupVisits.filter(function(v) { return v.date === today; })
            .forEach(function(v) {
                var p = patients.find(function(x) { return x.id === v.patientId; });
                if (p && !todaySet.has(p.id)) { todaySet.add(p.id); filteredPatients.push(p); }
            });
    } else if (type === 'followups') {
        var fuSet = new Set();
        followupVisits.forEach(function(v) {
            if (inFilterRange(v.date)) {
                var p = patients.find(function(x) { return x.id === v.patientId; });
                if (p && !fuSet.has(p.id)) { fuSet.add(p.id); filteredPatients.push(p); }
            }
        });
    } else if (type === 'newMonth') {
        patients.filter(function(p) { return p.createdAt && p.createdAt.startsWith(thisMonth); })
            .forEach(function(p) { filteredPatients.push(p); });
    } else if (type === 'month') {
        var monthSet = new Set();
        patients.filter(function(p) { return p.createdAt && p.createdAt.startsWith(thisMonth); })
            .forEach(function(p) { monthSet.add(p.id); filteredPatients.push(p); });
        visits.filter(function(v) { return v.date && v.date.startsWith(thisMonth); })
            .forEach(function(v) {
                var p = patients.find(function(x) { return x.id === v.patientId; });
                if (p && !monthSet.has(p.id)) { monthSet.add(p.id); filteredPatients.push(p); }
            });
    } else if (type === 'allTime') {
        filteredPatients = patients.filter(function(p) { return inFilterRange(p.createdAt); });
    }
    
    // Highlight active tab
    $$('.stat-card').forEach(function(card) { card.style.boxShadow = ''; card.style.border = ''; });
    var tabEl = $('statTab' + type.charAt(0).toUpperCase() + type.slice(1));
    if (tabEl) { tabEl.style.boxShadow = '0 0 0 3px #2980b9'; tabEl.style.border = '2px solid #2980b9'; }
    
    var panel = $('statPatientsPanel');
    var listDiv = $('statPatientsList');
    
    if (filteredPatients.length === 0) {
        var emptyTexts = { ur: 'کوئی مریض نہیں ملا', en: 'No patients found', roman: 'Koi mareez nahi mila' };
        listDiv.innerHTML = '<div class="empty-state"><div class="icon">😔</div><p>' + (emptyTexts[currentLang] || emptyTexts.en) + '</p></div>';
    } else {
        listDiv.innerHTML = renderPatientsTable(filteredPatients);
    }
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeStatPatients() {
    sessionStorage.removeItem('activeStatTab');
    $$('.stat-card').forEach(function(card) { card.style.boxShadow = ''; card.style.border = ''; });
    currentStatFilter = '';
    // Reset to today'''s patients
    showStatPatients('today');
}
