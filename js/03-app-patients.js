// ============================================================
// Bismillah Clinic — js/03-app-patients.js
// DASHBOARD + REF NO + SAVE/SEARCH/DETAIL/EDIT PATIENT
// NOTE: Ye index.html ke inline script ka hissa hai (sirf jagah badli hai).
// WARNING: In files ka LOAD ORDER kabhi na badlein!
// ============================================================

// ==================== DASHBOARD ====================
async function updateDashboard() {
    await refreshCache();
    const patients = cachedPatients;
    const visits = cachedVisits;
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.substring(0, 7);
    
    // Get filter settings
    const filterSettings = getDashboardFilterSettings();
    const filterDuration = filterSettings.duration || 'allTime';
    const filterDateFrom = filterSettings.dateFrom || '';
    const filterDateTo = filterSettings.dateTo || '';
    
    // Calculate filter date range
    let filterStartDate = '';
    const now = new Date();
    if (filterDuration === '1month') {
        const d = new Date(now); d.setMonth(d.getMonth() - 1);
        filterStartDate = d.toISOString().split('T')[0];
    } else if (filterDuration === '3months') {
        const d = new Date(now); d.setMonth(d.getMonth() - 3);
        filterStartDate = d.toISOString().split('T')[0];
    } else if (filterDuration === '6months') {
        const d = new Date(now); d.setMonth(d.getMonth() - 6);
        filterStartDate = d.toISOString().split('T')[0];
    } else if (filterDuration === '1year') {
        const d = new Date(now); d.setFullYear(d.getFullYear() - 1);
        filterStartDate = d.toISOString().split('T')[0];
    }
    // Override with custom date range if set
    if (filterDateFrom) filterStartDate = filterDateFrom;
    const effectiveEndDate = filterDateTo || today;
    
    // Helper: check if date falls within filter range
    function inFilterRange(dateStr) {
        if (!dateStr) return true; // no date = include
        if (!filterStartDate && !filterDateTo) return true; // no filter
        var d = dateStr.substring(0, 10);
        if (filterStartDate && d < filterStartDate) return false;
        if (filterDateTo && d > filterDateTo) return false;
        return true;
    }
    
    const totalPatients = patients.length;
    const allTimePatients = patients.length;
    
    const followupVisits = visits.filter(function(v) { return v.type === 'followup'; });
    const totalFollowups = followupVisits.length;
    
    // Today's patients
    const todayPatientIds = new Set();
    const todayRegistered = patients.filter(function(p) {
        return p.createdAt && p.createdAt.startsWith(today);
    });
    todayRegistered.forEach(function(p) { todayPatientIds.add(p.id); });
    const todayFollowups = followupVisits.filter(function(v) { return v.date === today; });
    todayFollowups.forEach(function(v) { todayPatientIds.add(v.patientId); });
    const todayCount = todayPatientIds.size;
    
    // New patients this month (first-time registrations this month)
    const newMonthPatientIds = new Set();
    patients.filter(function(p) { return p.createdAt && p.createdAt.startsWith(thisMonth); })
        .forEach(function(p) { newMonthPatientIds.add(p.id); });
    const newMonthCount = newMonthPatientIds.size;
    
    // This month's patients (any activity this month - registration or visit)
    const monthPatientIds = new Set();
    patients.filter(function(p) { return p.createdAt && p.createdAt.startsWith(thisMonth); })
        .forEach(function(p) { monthPatientIds.add(p.id); });
    followupVisits.filter(function(v) { return v.date && v.date.startsWith(thisMonth); })
        .forEach(function(v) { monthPatientIds.add(v.patientId); });
    visits.filter(function(v) { return v.date && v.date.startsWith(thisMonth) && v.type !== 'followup'; })
        .forEach(function(v) { monthPatientIds.add(v.patientId); });
    
    $('statToday').textContent = todayCount;
    $('statFollowups').textContent = totalFollowups;
    $('statNewMonth').textContent = newMonthCount;
    $('statMonth').textContent = monthPatientIds.size;
    $('statAllTime').textContent = allTimePatients;
    
    // Apply tab visibility from settings
    applyDashboardTabVisibility();
    
    // Highlight active stat tab
    // Default to today tab highlight
    var activeTab = sessionStorage.getItem('activeStatTab') || 'today';
    $$('.stat-card').forEach(function(card) { card.style.boxShadow = ''; card.style.border = ''; });
    var tabEl = $('statTab' + activeTab.charAt(0).toUpperCase() + activeTab.slice(1));
    if (tabEl) { tabEl.style.boxShadow = '0 0 0 3px #2980b9'; tabEl.style.border = '2px solid #2980b9'; }
    
    // Auto-show today'''s patients on dashboard load
    showStatPatients(activeTab);
    }

// ==================== REF NUMBER ====================
async function generateRefNo() {
    const allPatients = mergeArrays(cachedPatients, getPendingPatients(), 'id');
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    let maxNo = 0;
    allPatients.forEach(function(p) {
        if (p.refNo) {
            const parts = p.refNo.split('/')[0].split('-');
            const num = parseInt(parts[1]) || 0;
            if (num > maxNo) maxNo = num;
        }
    });
    $('refNo').value = 'BHC-' + String(maxNo + 1).padStart(4, '0') + '/' + currentMonth;
}

function generateVisitRef() {
    var allVisits = mergeArrays(cachedVisits, getPendingVisits(), 'id');
    var now = new Date();
    var currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    var maxNo = 0;
    allVisits.forEach(function(v) {
        if (v.visitRef) {
            var parts = v.visitRef.split('/')[0].split('-');
            var num = parseInt(parts[1]) || 0;
            if (num > maxNo) maxNo = num;
        }
    });
    return 'V-' + String(maxNo + 1).padStart(4, '0') + '/' + currentMonth;
}

function checkFamilyByPhone() {
    const phone = $('phone').value.trim();
    const familyInput = $('familyNo');
    const hint = $('familyHint');
    if (phone && !familyInput.value) {
        const existing = cachedPatients.filter(function(p) { return p.phone === phone && p.familyNo; });
        if (existing.length > 0) {
            familyInput.value = existing[0].familyNo;
            const members = cachedPatients.filter(function(p) { return p.familyNo === existing[0].familyNo; });
            hint.textContent = '✅ Family found (' + members.length + ' members)';
            hint.style.color = '#27ae60';
        }
    }
}

// ==================== SAVE PATIENT ====================
async function saveNewPatient() {
    const name = $('patientName').value.trim();
    const phone = $('phone').value.trim();
    let familyNo = $('familyNo').value.trim();
    const msgDiv = $('newPatientMsg');
    const saveBtn = $('savePatientBtn');
    
    if (!name) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ Name required</div>'; window.scrollTo(0,0); return; }
    if (!phone) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ Phone required</div>'; window.scrollTo(0,0); return; }
    
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="loading-inline"></span>';
    
    try {
        const allP = mergeArrays(cachedPatients, getPendingPatients(), 'id');
        const dup = allP.find(function(p) { return p.phone === phone && p.name.toLowerCase() === name.toLowerCase(); });
        if (dup) {
            msgDiv.innerHTML = '<div class="alert alert-error">⚠️ Patient exists (' + escapeHtml(dup.refNo) + ')</div>';
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<span data-ur="💾 محفوظ کریں" data-en="💾 Save" data-roman="💾 Save">💾 Save</span>';
            applyLanguage(); window.scrollTo(0,0); return;
        }
        
        if (familyNo) {
            if (!familyNo.match(/^F-/i)) familyNo = 'F-' + familyNo.replace(/\D/g, '').padStart(4, '0');
            familyNo = familyNo.toUpperCase();
        } else {
            const existing = allP.find(function(p) { return p.phone === phone && p.familyNo; });
            familyNo = existing ? existing.familyNo : null;
        }
        
        const patientId = generateId('P');
        const newPatient = {
            id: patientId, refNo: $('refNo').value, familyNo: familyNo,
            name: name, fatherName: $('fatherName').value.trim(),
            age: $('age').value.trim(), gender: $('gender').value,
            weight: $('weight').value.trim(), allergy: $('allergy').value.trim(),
            phone: phone, address: $('address').value.trim(),
            initialSymptoms: $('firstVisitSymptoms').value.trim(),
            createdAt: new Date().toISOString(),
            createdBy: currentUserData ? currentUserData.name : 'Unknown'
        };
        
        const firstVisit = {
            id: generateId('V'), patientId: patientId,
            visitRef: ($('firstVisitRef') ? $('firstVisitRef').value : '') || generateVisitRef(),
            date: $('firstVisitDate').value || new Date().toISOString().split('T')[0],
            time: $('firstVisitTime').value || new Date().toTimeString().substring(0, 5),
            symptoms: $('firstVisitSymptoms').value.trim(),
            diagnosis: $('firstVisitDiagnosis').value.trim(),
            prescription: $('firstVisitPrescription').value.trim(),
            method: $('firstVisitMethod').value.trim(),
            days: $('firstVisitDays').value.trim(),
            notes: $('firstVisitNotes').value.trim(),
            bp: $('firstBP').value.trim(), sugar: $('firstSugar').value.trim(),
            temperature: $('firstTemp').value.trim(), pulse: $('firstPulse').value.trim(),
            type: 'registration',
            createdAt: new Date().toISOString(),
            createdBy: currentUserData ? currentUserData.name : 'Unknown'
        };
        
        let patientSavedOnline = false;
        let visitSavedOnline = false;
        
        if (navigator.onLine) {
            // Save patient first
            try {
                await savePatientDB(newPatient);
                patientSavedOnline = true;
                console.log('✅ Patient saved online:', name);
            } catch(err) { 
                console.error('❌ Patient save failed:', err.message || err);
            }
            
            // Save visit separately
            try {
                await saveVisitDB(firstVisit);
                visitSavedOnline = true;
                console.log('✅ Visit saved online');
            } catch(err) { 
                console.error('❌ Visit save failed:', err.message || err);
            }
            
            if (patientSavedOnline && visitSavedOnline) {
                await forceCacheRefresh();
            }
        }
        
        // Only save to pending what WASN'T saved online
        if (!patientSavedOnline) {
            savePendingPatient(newPatient);
            cachedPatients.unshift(newPatient);
        }
        if (!visitSavedOnline) {
            savePendingVisit(firstVisit);
            cachedVisits.unshift(firstVisit);
        }
        if (!patientSavedOnline || !visitSavedOnline) {
            localStorage.setItem('cached_patients', JSON.stringify(cachedPatients));
            localStorage.setItem('cached_visits', JSON.stringify(cachedVisits));
        }
        
        const mode = (patientSavedOnline && visitSavedOnline) ? '' : ' (saved offline)';
        msgDiv.innerHTML = '<div class="alert alert-success">✅ "' + escapeHtml(name) + '" saved!' + mode + '</div>';
        clearNewPatientForm();
        await generateRefNo();
        window.scrollTo(0, 0);
    } catch(err) {
        msgDiv.innerHTML = '<div class="alert alert-error">❌ ' + escapeHtml(err.message) + '</div>';
        window.scrollTo(0, 0);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span data-ur="💾 محفوظ کریں" data-en="💾 Save" data-roman="💾 Save">💾 Save</span>';
        applyLanguage();
        setTimeout(function() { msgDiv.innerHTML = ''; }, 8000);
    }
}

function clearNewPatientForm() {
    ['patientName', 'familyNo', 'fatherName', 'age', 'weight', 'allergy', 'phone', 'address',
     'firstVisitSymptoms', 'firstVisitDiagnosis', 'firstVisitPrescription', 'firstVisitMethod',
     'firstVisitDays', 'firstVisitNotes', 'firstBP', 'firstSugar', 'firstTemp', 'firstPulse'].forEach(function(id) {
        if ($(id)) $(id).value = '';
    });
    $('gender').value = '';
    const now = new Date();
    $('firstVisitDate').value = now.toISOString().split('T')[0];
    $('firstVisitTime').value = now.toTimeString().substring(0, 5);
    if ($('firstVisitRef')) $('firstVisitRef').value = generateVisitRef();
}

// ==================== CONFIRM MODAL ====================
function showConfirm(message, callback) {
    $('confirmMessage').innerHTML = message;
    confirmCallback = callback;
    $('confirmModal').classList.add('active');
}
function closeConfirmModal() {
    $('confirmModal').classList.remove('active');
    confirmCallback = null;
}

// Expose globally for diagnosis-custom.js
window.showConfirm = showConfirm;

// ==================== DELETE ====================
async function confirmDeletePatient(patientId) {
    const patient = cachedPatients.find(function(p) { return p.id === patientId; });
    if (!patient) return;
    const visits = cachedVisits.filter(function(v) { return v.patientId === patientId; });
    
    showConfirm('Delete <b>' + escapeHtml(patient.name) + '</b> and <b>' + visits.length + '</b> consultations?', async function() {
        showLoading();
        try {
            if (navigator.onLine) await deletePatientDB(patientId);
            cachedPatients = cachedPatients.filter(function(p) { return p.id !== patientId; });
            cachedVisits = cachedVisits.filter(function(v) { return v.patientId !== patientId; });
            localStorage.setItem('pending_patients', JSON.stringify(getPendingPatients().filter(function(p) { return p.id !== patientId; })));
            localStorage.setItem('pending_visits', JSON.stringify(getPendingVisits().filter(function(v) { return v.patientId !== patientId; })));
            localStorage.setItem('cached_patients', JSON.stringify(cachedPatients));
            localStorage.setItem('cached_visits', JSON.stringify(cachedVisits));
            updatePendingBadge();
            showToast('🗑️ Deleted');
            showPage('allPatients', document.querySelector('.nav-btn[data-page="allPatients"]'));
        } catch(err) { showToast('❌ ' + err.message, 'error'); }
        finally { hideLoading(); }
    });
}

async function confirmDeleteVisit(visitId, patientId) {
    showConfirm('Delete this consultation?', async function() {
        showLoading();
        try {
            if (navigator.onLine) await deleteVisitDB(visitId);
            cachedVisits = cachedVisits.filter(function(v) { return v.id !== visitId; });
            localStorage.setItem('pending_visits', JSON.stringify(getPendingVisits().filter(function(v) { return v.id !== visitId; })));
            localStorage.setItem('cached_visits', JSON.stringify(cachedVisits));
            updatePendingBadge();
            showToast('🗑️ Deleted');
            showPatientDetail(patientId);
        } catch(err) { showToast('❌ ' + err.message, 'error'); }
        finally { hideLoading(); }
    });
}

// ==================== SEARCH ====================
function searchPatients() {
    const query = $('searchInput').value.trim().toLowerCase();
    const div = $('searchResults');
    if (!query) {
        div.innerHTML = '<div class="empty-state"><div class="icon">🔍</div><p>Type to search...</p></div>';
        return;
    }
    const results = cachedPatients.filter(function(p) {
        return (p.name && p.name.toLowerCase().includes(query)) ||
            (p.phone && p.phone.includes(query)) ||
            (p.refNo && p.refNo.toLowerCase().includes(query)) ||
            (p.familyNo && p.familyNo.toLowerCase().includes(query)) ||
            (p.fatherName && p.fatherName.toLowerCase().includes(query)) ||
            (p.address && p.address.toLowerCase().includes(query));
    });
    if (results.length === 0) {
        div.innerHTML = '<div class="empty-state"><div class="icon">😔</div><p>No results</p></div>';
        return;
    }
    div.innerHTML = renderPatientsTable(results);
}

async function showAllPatients() {
    await refreshCache();
    const div = $('allPatientsList');
    if (cachedPatients.length === 0) {
        div.innerHTML = '<div class="empty-state"><div class="icon">📋</div><p>No patients</p></div>';
        return;
    }
    div.innerHTML = renderPatientsTable(cachedPatients);
}

function renderPatientsTable(patients) {
    const pendingIds = new Set(getPendingPatients().map(function(p) { return p.id; }));
    const followupsByPatient = {};
    const lastVisitRefByPatient = {};
    cachedVisits.forEach(function(v) {
        if (v.type === 'followup') {
            followupsByPatient[v.patientId] = (followupsByPatient[v.patientId] || 0) + 1;
        }
        if (v.visitRef) {
            if (!lastVisitRefByPatient[v.patientId] || v.date > (lastVisitRefByPatient[v.patientId].date || '')) {
                lastVisitRefByPatient[v.patientId] = v;
            }
        }
    });
    
    const h = {
        ur: ['حوالہ', 'آخری وزٹ', 'فیملی', 'نام', 'ولدیت', 'عمر', 'جنس', 'فون', 'فالو اپ', 'ایکشن'],
        en: ['Ref', 'Last Visit', 'Family', 'Name', 'Father', 'Age', 'Gender', 'Phone', 'Follow-ups', 'Action'],
        roman: ['Ref', 'Aakhri Visit', 'Family', 'Naam', 'Waldiyat', 'Umar', 'Jins', 'Phone', 'Follow-ups', 'Action']
    }[currentLang];
    
    let html = '<div class="table-container"><table><thead><tr>';
    h.forEach(function(header, i) {
        const cls = [1,2,5,6,7,8,9].includes(i) ? ' class="td-center"' : '';
        html += '<th' + cls + '>' + header + '</th>';
    });
    html += '</tr></thead><tbody>';
    
    patients.forEach(function(p) {
        const followupCount = followupsByPatient[p.id] || 0;
        const gBadge = getGenderBadgeClass(p.gender);
        const isPending = pendingIds.has(p.id);
        const lastVisit = lastVisitRefByPatient[p.id];
        
        let familyCell = p.familyNo ?
            '<span class="family-badge" onclick="event.stopPropagation();showFamilyMembers(\'' + escapeHtml(p.familyNo) + '\')">' + escapeHtml(p.familyNo) + '</span>' :
            '<span class="family-badge-empty">-</span>';
        
        html += '<tr>';
        html += '<td><strong>' + escapeHtml(p.refNo) + '</strong>' + (isPending ? ' <span class="badge badge-pending">🔄</span>' : '') + '</td>';
        html += '<td class="td-center">' + (lastVisit ? '<span style="color:#8e44ad;font-weight:bold;font-size:11px;">' + escapeHtml(lastVisit.visitRef) + '</span>' : '<span style="color:#bdc3c7;">—</span>') + '</td>';
        html += '<td class="td-center">' + familyCell + '</td>';
        html += '<td>' + escapeHtml(p.name) + '</td>';
        html += '<td>' + escapeHtml(p.fatherName || '-') + '</td>';
        html += '<td class="td-center">' + escapeHtml(p.age || '-') + '</td>';
        html += '<td class="td-center"><span class="badge ' + gBadge + '">' + translateGender(p.gender) + '</span></td>';
        html += '<td class="td-phone td-center">' + escapeHtml(p.phone) + '</td>';
        html += '<td class="td-center"><strong>' + followupCount + '</strong></td>';
        html += '<td class="td-center"><div class="action-icons">';
        html += '<button class="btn btn-primary btn-xs" onclick="showPatientDetail(\'' + p.id + '\')">👁️</button> ';
        html += '<button class="btn btn-edit btn-xs" onclick="openEditPatientModal(\'' + p.id + '\')">✏️</button> ';
        html += '<button class="btn btn-danger btn-xs" onclick="confirmDeletePatient(\'' + p.id + '\')">🗑️</button>';
        html += '</div></td></tr>';
    });
    html += '</tbody></table></div><div style="margin-top:10px;color:#7f8c8d;font-size:12px;">Total: ' + patients.length + '</div>';
    return html;
}

function showFamilyMembers(familyNo) {
    if (!familyNo) return;
    const members = cachedPatients.filter(function(p) { return p.familyNo === familyNo; });
    const div = $('familyMembersContent');
    let html = '<div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">';
    html += '<span>👨‍👩‍👧‍👦 Family: ' + escapeHtml(familyNo) + ' (' + members.length + ')</span>';
    html += '<button class="btn btn-light btn-sm" onclick="showPage(\'allPatients\',document.querySelector(\'.nav-btn[data-page=allPatients]\'))">🔙 Back</button></div>';
    html += members.length ? renderPatientsTable(members) : '<div class="empty-state"><p>No members</p></div>';
    div.innerHTML = html;
    $$('.page').forEach(function(p) { p.classList.remove('active'); });
    $('page-familyMembers').classList.add('active');
    $$('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
    window.scrollTo(0, 0);
}

// ==================== PATIENT DETAIL ====================
async function showPatientDetail(patientId) {
    const patient = cachedPatients.find(function(p) { return p.id === patientId; });
    if (!patient) { showPage('allPatients', document.querySelector('.nav-btn[data-page="allPatients"]')); return; }
    
    let visits;
    if (navigator.onLine && !getPendingPatients().find(function(p) { return p.id === patientId; })) {
        visits = await getVisitsByPatient(patientId);
        const pendingForP = getPendingVisits().filter(function(v) { return v.patientId === patientId; });
        visits = mergeArrays(visits, pendingForP, 'id');
    } else {
        visits = cachedVisits.filter(function(v) { return v.patientId === patientId; });
    }
    
    visits.sort(function(a, b) { return new Date(a.date + ' ' + (a.time||'')) - new Date(b.date + ' ' + (b.time||'')); });
    
    const familyMembers = patient.familyNo ? cachedPatients.filter(function(p) { return p.familyNo === patient.familyNo; }) : [];
    const followupCount = visits.filter(function(v) { return v.type === 'followup'; }).length;
    
    let html = '<div class="patient-header">';
    html += '<div style="display:flex;justify-content:space-between;align-items:start;flex-wrap:wrap;gap:10px;">';
    html += '<div><h2>' + escapeHtml(patient.name) + '</h2>';
    html += '<div style="opacity:0.8;font-size:13px;">Ref: ' + escapeHtml(patient.refNo);
    if (patient.familyNo) html += ' | Family: ' + escapeHtml(patient.familyNo);
    html += ' | Follow-ups: ' + followupCount + '</div></div>';
    html += '<div style="display:flex;gap:5px;flex-wrap:wrap;">';
    html += '<button class="btn btn-edit btn-sm" onclick="openEditPatientModal(\'' + patient.id + '\')">✏️ Edit</button>';
    html += '<button class="btn btn-warning btn-sm" onclick="goToNewVisitPage(\'' + patient.id + '\')">➕ Visit</button>';
    html += '<button class="btn btn-purple btn-sm" onclick="openDiagnosisForPatient(\'' + patient.id + '\')">🔬 Diagnose</button>';
    if (patient.familyNo) html += '<button class="btn btn-info btn-sm" onclick="showFamilyMembers(\'' + escapeHtml(patient.familyNo) + '\')">👨‍👩‍👧‍👦 (' + familyMembers.length + ')</button>';
    html += '<button class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:white;" onclick="showPage(\'allPatients\',document.querySelector(\'.nav-btn[data-page=allPatients]\'))">🔙</button>';
    html += '<button class="btn btn-danger btn-sm" onclick="confirmDeletePatient(\'' + patient.id + '\')">🗑️</button>';
    html += '</div></div>';
    
    html += '<div class="patient-info-grid" style="margin-top:15px;">';
    const fields = [
        ['Father', patient.fatherName], ['Age', patient.age],
        ['Gender', translateGender(patient.gender)], ['Weight', patient.weight],
        ['Phone', patient.phone], ['Allergy', patient.allergy],
        ['Address', patient.address], ['By', patient.createdBy]
    ];
    fields.forEach(function(f) {
        html += '<div class="patient-info-item"><strong>' + f[0] + ':</strong> ' + escapeHtml(f[1] || '-') + '</div>';
    });
    html += '</div></div>';
    
    html += '<div class="card"><div class="card-title" style="display:flex;justify-content:space-between;align-items:center;">';
    html += '<span>📋 Consultations (' + visits.length + ')</span>';
    html += '<button class="btn btn-success btn-sm" onclick="goToNewVisitPage(\'' + patient.id + '\')">➕ New Visit</button></div>';
    
    if (visits.length === 0) {
        html += '<div class="empty-state"><div class="icon">📝</div><p>No consultations</p></div>';
    } else {
        const displayVisits = [...visits].reverse();
        let followupNum = followupCount;
        displayVisits.forEach(function(v) {
            const isReg = v.type === 'registration' || v.type === undefined;
            let visitLabel, cardClass;
            if (isReg) {
                visitLabel = '<span class="visit-type-badge visit-type-registration">🌟 Registration</span>';
                cardClass = 'visit-card registration';
            } else {
                visitLabel = '<span class="visit-type-badge visit-type-visit">Follow-up #' + followupNum + '</span>';
                followupNum--;
                cardClass = 'visit-card';
            }
            
            html += '<div class="' + cardClass + '"><div class="visit-date">';
            html += '<span>' + visitLabel + (v.visitRef ? ' <strong style="color:#8e44ad;">' + escapeHtml(v.visitRef) + '</strong>' : '') + ' 📅 ' + escapeHtml(v.date || '-') + ' 🕐 ' + escapeHtml(v.time || '-') + '</span>';
            html += '<div class="visit-actions">';
            html += '<button class="btn btn-edit btn-xs" onclick="openEditVisitModal(\'' + v.id + '\',\'' + patient.id + '\')">✏️</button> ';
            html += '<button class="btn btn-danger btn-xs" onclick="confirmDeleteVisit(\'' + v.id + '\',\'' + patient.id + '\')">🗑️</button>';
            html += '</div></div>';
            
            if (v.bp || v.sugar || v.temperature || v.pulse) {
                html += '<div class="vitals-display">';
                if (v.bp) html += '<span><strong>BP:</strong> ' + escapeHtml(v.bp) + '</span>';
                if (v.sugar) html += '<span><strong>Sugar:</strong> ' + escapeHtml(v.sugar) + '</span>';
                if (v.temperature) html += '<span><strong>Temp:</strong> ' + escapeHtml(v.temperature) + '</span>';
                if (v.pulse) html += '<span><strong>Pulse:</strong> ' + escapeHtml(v.pulse) + '</span>';
                html += '</div>';
            }
            
            html += '<div class="visit-detail">';
            const details = [
                ['📝 Symptoms', v.symptoms], ['🔬 Diagnosis', v.diagnosis],
                ['💊 Prescription', v.prescription], ['📖 Method', v.method],
                ['📆 Days', v.days]
            ];
            details.forEach(function(d) {
                html += '<div class="visit-detail-item"><div class="label">' + d[0] + '</div><div>' + escapeHtml(d[1] || '-') + '</div></div>';
            });
            if (v.notes) html += '<div class="visit-detail-item"><div class="label">📝 Notes</div><div>' + escapeHtml(v.notes) + '</div></div>';
            html += '</div>';
            html += '<div style="margin-top:6px;font-size:11px;color:#95a5a6;">By: ' + escapeHtml(v.createdBy || '-') + '</div></div>';
        });
    }
    html += '</div>';
    
    $('patientDetailContent').innerHTML = html;
    $$('.page').forEach(function(p) { p.classList.remove('active'); });
    $('page-patientDetail').classList.add('active');
    $$('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
    window.scrollTo(0, 0);
}

// ==================== EDIT PATIENT ====================
function openEditPatientModal(patientId) {
    const patient = cachedPatients.find(function(p) { return p.id === patientId; });
    if (!patient) return;
    $('editPatientId').value = patientId;
    $('editName').value = patient.name || '';
    $('editPhone').value = patient.phone || '';
    $('editFatherName').value = patient.fatherName || '';
    $('editAge').value = patient.age || '';
    $('editGender').value = patient.gender || '';
    $('editWeight').value = patient.weight || '';
    $('editFamilyNo').value = patient.familyNo || '';
    $('editAllergy').value = patient.allergy || '';
    $('editAddress').value = patient.address || '';
    $('editPatientMsg').innerHTML = '';
    $('editPatientModalTitle').textContent = '✏️ Edit: ' + patient.name;
    $('editPatientModal').classList.add('active');
}

function closeEditPatientModal() {
    $('editPatientModal').classList.remove('active');
}

async function saveEditPatient() {
    const patientId = $('editPatientId').value;
    const name = $('editName').value.trim();
    const phone = $('editPhone').value.trim();
    const msgDiv = $('editPatientMsg');
    const saveBtn = $('saveEditPatientBtn');
    
    if (!name) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ Name required</div>'; return; }
    if (!phone) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ Phone required</div>'; return; }
    
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="loading-inline"></span>';
    
    let familyNo = $('editFamilyNo').value.trim();
    if (familyNo && !familyNo.match(/^F-/i)) familyNo = 'F-' + familyNo.replace(/\D/g, '').padStart(4, '0');
    if (familyNo) familyNo = familyNo.toUpperCase();
    
    const updates = {
        name: name, phone: phone,
        father_name: $('editFatherName').value.trim() || null,
        age: $('editAge').value.trim() || null,
        gender: $('editGender').value || null,
        weight: $('editWeight').value.trim() || null,
        family_no: familyNo || null,
        allergy: $('editAllergy').value.trim() || null,
        address: $('editAddress').value.trim() || null
    };
    
    try {
        let savedOnline = false;
        if (navigator.onLine) {
            try { await updatePatientDB(patientId, updates); savedOnline = true; }
            catch(e) { console.error(e); }
        }
        if (!savedOnline) savePendingEdit({ id: patientId, type: 'patient', data: updates });
        
        const idx = cachedPatients.findIndex(function(p) { return p.id === patientId; });
        if (idx >= 0) {
            cachedPatients[idx].name = name;
            cachedPatients[idx].phone = phone;
            cachedPatients[idx].fatherName = updates.father_name;
            cachedPatients[idx].age = updates.age;
            cachedPatients[idx].gender = updates.gender;
            cachedPatients[idx].weight = updates.weight;
            cachedPatients[idx].familyNo = updates.family_no;
            cachedPatients[idx].allergy = updates.allergy;
            cachedPatients[idx].address = updates.address;
        }
        localStorage.setItem('cached_patients', JSON.stringify(cachedPatients));
        
        closeEditPatientModal();
        showToast('✅ Updated!' + (savedOnline ? '' : ' (offline)'));
        await showPatientDetail(patientId);
    } catch(err) {
        msgDiv.innerHTML = '<div class="alert alert-error">❌ ' + escapeHtml(err.message) + '</div>';
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span data-ur="💾 محفوظ کریں" data-en="💾 Save" data-roman="💾 Save">💾 Save</span>';
        applyLanguage();
    }
}
