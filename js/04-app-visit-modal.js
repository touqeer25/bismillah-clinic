// ============================================================
// Bismillah Clinic — js/04-app-visit-modal.js
// VISIT MODAL (purana visit edit)
// NOTE: Ye index.html ke inline script ka hissa hai (sirf jagah badli hai).
// WARNING: In files ka LOAD ORDER kabhi na badlein!
// ============================================================

// ==================== VISIT (redirects to New Visit Page) ====================
function openVisitModal(patientId) {
    goToNewVisitPage(patientId);
}

function openEditVisitModal(visitId, patientId) {
    const visit = cachedVisits.find(function(v) { return v.id === visitId; });
    const patient = cachedPatients.find(function(p) { return p.id === patientId; });
    if (!visit || !patient) return;
    $('visitPatientId').value = patientId;
    $('editVisitId').value = visitId;
    var editLabels = { ur: '✏️ ترمیم', en: '✏️ Edit', roman: '✏️ Tarmeemi' };
    $('visitModalTitle').textContent = (editLabels[currentLang] || '✏️ Edit') + ' - ' + patient.name;
    $('visitPatientInfo').innerHTML = '👤 <strong>' + escapeHtml(patient.name) + '</strong> | ' + escapeHtml(patient.refNo) + (patient.age ? ' | ' + escapeHtml(patient.age) : '') + (patient.gender ? ' | ' + translateGender(patient.gender) : '');
    $('visitRefNo').value = visit.visitRef || '—';
    if ($('visitFamilyNo')) $('visitFamilyNo').value = patient.familyNo || '—';
    if ($('visitAllergy')) $('visitAllergy').value = patient.allergy || '—';
    $('visitDate').value = visit.date || '';
    $('visitTime').value = visit.time || '';
    $('visitSymptoms').value = visit.symptoms || '';
    $('visitDiagnosis').value = visit.diagnosis || '';
    $('visitPrescription').value = visit.prescription || '';
    $('visitMethod').value = visit.method || '';
    $('visitDays').value = visit.days || '';
    $('visitNotes').value = visit.notes || '';
    $('visitBP').value = visit.bp || '';
    $('visitSugar').value = visit.sugar || '';
    $('visitTemp').value = visit.temperature || '';
    $('visitPulse').value = visit.pulse || '';
    $('visitMsg').innerHTML = '';
    $('visitModal').classList.add('active');
}

function closeVisitModal() { $('visitModal').classList.remove('active'); }

async function saveVisit() {
    const patientId = $('visitPatientId').value;
    const editingId = $('editVisitId').value;
    const isEditing = !!editingId;
    const symptoms = $('visitSymptoms').value.trim();
    const msgDiv = $('visitMsg');
    const saveBtn = $('saveVisitBtn');
    
    if (!symptoms) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ Symptoms required</div>'; return; }
    
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="loading-inline"></span>';
    
    const visitData = {
        date: $('visitDate').value, time: $('visitTime').value,
        symptoms: symptoms, diagnosis: $('visitDiagnosis').value.trim(),
        prescription: $('visitPrescription').value.trim(), method: $('visitMethod').value.trim(),
        days: $('visitDays').value.trim(), notes: $('visitNotes').value.trim(),
        bp: $('visitBP').value.trim(), sugar: $('visitSugar').value.trim(),
        temperature: $('visitTemp').value.trim(), pulse: $('visitPulse').value.trim()
    };
    
    try {
        if (isEditing) {
            const dbUpdates = {
                visit_date: visitData.date, visit_time: visitData.time,
                symptoms: visitData.symptoms || null, diagnosis: visitData.diagnosis || null,
                prescription: visitData.prescription || null, method: visitData.method || null,
                days: visitData.days || null, notes: visitData.notes || null,
                bp: visitData.bp || null, sugar: visitData.sugar || null,
                temperature: visitData.temperature || null, pulse: visitData.pulse || null
            };
            let savedOnline = false;
            if (navigator.onLine) {
                try { await updateVisitDB(editingId, dbUpdates); savedOnline = true; } catch(e) { console.error(e); }
            }
            if (!savedOnline) savePendingEdit({ id: editingId, type: 'visit', data: dbUpdates });
            const idx = cachedVisits.findIndex(function(v) { return v.id === editingId; });
            if (idx >= 0) Object.assign(cachedVisits[idx], visitData);
            localStorage.setItem('cached_visits', JSON.stringify(cachedVisits));
            closeVisitModal();
            showToast('✅ Updated!' + (savedOnline ? '' : ' (offline)'));
        } else {
            const newVisit = {
                id: generateId('V'), patientId: patientId, ...visitData,
                visitRef: $('visitRefNo').value || generateVisitRef(),
                type: 'followup',
                createdAt: new Date().toISOString(),
                createdBy: currentUserData ? currentUserData.name : 'Unknown'
            };
            let savedOnline = false;
            if (navigator.onLine) {
                try { await saveVisitDB(newVisit); savedOnline = true; await forceCacheRefresh(); } catch(e) { console.error(e); }
            }
            if (!savedOnline) {
                savePendingVisit(newVisit);
                cachedVisits.unshift(newVisit);
                localStorage.setItem('cached_visits', JSON.stringify(cachedVisits));
            }
            closeVisitModal();
            showToast('✅ Saved!' + (savedOnline ? '' : ' (offline)'));
        }
        showPatientDetail(patientId);
    } catch(err) {
        msgDiv.innerHTML = '<div class="alert alert-error">❌ ' + escapeHtml(err.message) + '</div>';
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span data-ur="💾 محفوظ کریں" data-en="💾 Save" data-roman="💾 Save">💾 Save</span>';
        applyLanguage();
    }
}
