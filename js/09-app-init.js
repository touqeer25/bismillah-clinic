// ============================================================
// Bismillah Clinic — js/09-app-init.js
// window exports + EVENT LISTENERS (sab se aakhri!)
// NOTE: Ye index.html ke inline script ka hissa hai (sirf jagah badli hai).
// WARNING: In files ka LOAD ORDER kabhi na badlein!
// ============================================================

window.toggleAIPanel = toggleAIPanel;
window.setSymptomMode = setSymptomMode;
window.initRepertoryBrowser = initRepertoryBrowser;
window.selectChapter = selectChapter;
window.searchRepertoryBrowser = searchRepertoryBrowser;
window.copyRemedyToPrescription = copyRemedyToPrescription;
window.switchRepertoryBook = switchRepertoryBook;
window.closeRepertoryChart = closeRepertoryChart;
window.toggleRepSearchMode = toggleRepSearchMode;
window.navigateToRubric = navigateToRubric;
window.flashRubricRow = flashRubricRow;
window.backToSearchResults = backToSearchResults;

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 App initializing...');
    
    applyLanguage();
    loadSavedCredentials();
    
    // LOGIN
    if ($('loginBtn')) $('loginBtn').addEventListener('click', handleLogin);
    if ($('loginPassword')) {
        $('loginPassword').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') handleLogin();
        });
    }
    if ($('loginUsername')) {
        $('loginUsername').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') $('loginPassword').focus();
        });
    }
    
    // LANGUAGE
    if ($('langBtnLogin')) $('langBtnLogin').addEventListener('click', toggleLanguage);
    if ($('langBtn')) $('langBtn').addEventListener('click', toggleLanguage);
    
    // HEADER
    if ($('logoutBtn')) $('logoutBtn').addEventListener('click', handleLogout);
    if ($('backupBtn')) $('backupBtn').addEventListener('click', exportData);
    
    // NAVIGATION
    $$('.nav-btn[data-page]').forEach(function(btn) {
        btn.addEventListener('click', function() { showPage(btn.getAttribute('data-page'), btn); });
    });
    
    // NAV ACTION BUTTONS (Preferences, Help, Tour, Tip)
    var navActions = [
        { id: 'navPrefsBtn', fn: 'openPreferencesModal' },
        { id: 'navHelpBtn', fn: 'openHelpCenter' },
        { id: 'navTourBtn', fn: 'showTourWelcome' },
        { id: 'navTipBtn', fn: 'showTipOfTheDay' }
    ];
    navActions.forEach(function(item) {
        var btn = $(item.id);
        if (btn) {
            console.log('✅ Nav action button found: ' + item.id);
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔘 Clicked: ' + item.id + ', fn exists: ' + (typeof window[item.fn] === 'function'));
                if (typeof window[item.fn] === 'function') {
                    window[item.fn]();
                } else {
                    console.error('❌ Function not found: ' + item.fn);
                }
            });
        } else {
            console.warn('⚠️ Nav action button NOT found: ' + item.id);
        }
    });
    
    // FORMS
    if ($('savePatientBtn')) $('savePatientBtn').addEventListener('click', saveNewPatient);
    if ($('clearFormBtn')) $('clearFormBtn').addEventListener('click', clearNewPatientForm);
    if ($('phone')) $('phone').addEventListener('blur', checkFamilyByPhone);
    if ($('searchInput')) $('searchInput').addEventListener('input', searchPatients);
    
    // VISIT
    if ($('saveVisitBtn')) $('saveVisitBtn').addEventListener('click', saveVisit);
    if ($('closeVisitBtn')) $('closeVisitBtn').addEventListener('click', closeVisitModal);
    if ($('cancelVisitBtn')) $('cancelVisitBtn').addEventListener('click', closeVisitModal);
    
    // EDIT
    if ($('saveEditPatientBtn')) $('saveEditPatientBtn').addEventListener('click', saveEditPatient);
    if ($('closeEditPatientBtn')) $('closeEditPatientBtn').addEventListener('click', closeEditPatientModal);
    if ($('cancelEditPatientBtn')) $('cancelEditPatientBtn').addEventListener('click', closeEditPatientModal);
    
    // CONFIRM
    if ($('closeConfirmBtn')) $('closeConfirmBtn').addEventListener('click', closeConfirmModal);
    if ($('confirmNoBtn')) $('confirmNoBtn').addEventListener('click', closeConfirmModal);
    if ($('confirmYesBtn')) {
        $('confirmYesBtn').addEventListener('click', function() {
            if (confirmCallback) confirmCallback();
            closeConfirmModal();
        });
    }
    
    // IMPORT/SYNC
    if ($('importBtn')) $('importBtn').addEventListener('click', importOldData);
    if ($('syncNowBtn')) $('syncNowBtn').addEventListener('click', syncPendingData);
    if ($('manualSyncBtn')) $('manualSyncBtn').addEventListener('click', syncPendingData);
    if ($('clearPendingBtn')) $('clearPendingBtn').addEventListener('click', function() {
        var pp = getPendingPatients().length;
        var pv = getPendingVisits().length;
        var pe = getPendingEdits().length;
        var warningMsg = {
            ur: '⚠️ <b>انتباہ!</b> یہ ' + pp + ' مریض، ' + pv + ' وزٹس، ' + pe + ' ترامیم مستقل طور پر مٹا دے گا!<br><br>کیا آپ نے پہلے بیک اپ لے لیا ہے؟<br><br><b>مٹانے کے بعد واپس نہیں آئے گا!</b>',
            en: '⚠️ <b>Warning!</b> This will permanently delete ' + pp + ' patients, ' + pv + ' visits, ' + pe + ' edits!<br><br>Have you taken a backup?<br><br><b>Cannot be undone!</b>',
            roman: '⚠️ <b>Khabardar!</b> Yeh ' + pp + ' mareez, ' + pv + ' visits, ' + pe + ' edits hamesha ke liye mita de ga!<br><br>Kya backup le liya?<br><br><b>Wapas nahi aaye ga!</b>'
        };
        showConfirm(
            warningMsg[currentLang] || warningMsg.en,
            function() {
                // Save backup to localStorage before clearing
                var backup = {
                    patients: getPendingPatients(),
                    visits: getPendingVisits(),
                    edits: getPendingEdits(),
                    clearedAt: new Date().toISOString()
                };
                localStorage.setItem('last_cleared_backup', JSON.stringify(backup));
                console.log('💾 Backup saved before clear:', backup);
                
                localStorage.removeItem('pending_patients');
                localStorage.removeItem('pending_visits');
                localStorage.removeItem('pending_edits');
                updatePendingBadge();
                showToast('✅ Cleared (backup saved in console)');
            }
        );
    });
    
    // DIAGNOSIS
    if ($('symptomSearch')) $('symptomSearch').addEventListener('input', renderSymptomsGrid);
    if ($('analyzeBtn')) $('analyzeBtn').addEventListener('click', analyzeDiagnosis);
    
    // NEW VISIT PAGE
    if ($('visitSearchInput')) $('visitSearchInput').addEventListener('input', nvSearchPatients);
    if ($('nvSaveBtn')) $('nvSaveBtn').addEventListener('click', nvSaveVisit);
    if ($('clearSymptomsBtn')) $('clearSymptomsBtn').addEventListener('click', clearAllSymptoms);
    
    // MODAL BACKDROP
    if ($('visitModal')) $('visitModal').addEventListener('click', function(e) { if (e.target === this) closeVisitModal(); });
    if ($('editPatientModal')) $('editPatientModal').addEventListener('click', function(e) { if (e.target === this) closeEditPatientModal(); });
    if ($('confirmModal')) $('confirmModal').addEventListener('click', function(e) { if (e.target === this) closeConfirmModal(); });
    if ($('addCategoryModal')) $('addCategoryModal').addEventListener('click', function(e) { if (e.target === this) closeAddCategoryModal(); });
    if ($('addSymptomModal')) $('addSymptomModal').addEventListener('click', function(e) { if (e.target === this) closeAddSymptomModal(); });
    if ($('addDiseaseModal')) $('addDiseaseModal').addEventListener('click', function(e) { if (e.target === this) closeAddDiseaseModal(); });
    if ($('viewCustomModal')) $('viewCustomModal').addEventListener('click', function(e) { if (e.target === this) closeViewCustomModal(); });
    
    // ESCAPE
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeVisitModal();
            closeEditPatientModal();
            closeConfirmModal();
            if (typeof closeAddCategoryModal === 'function') closeAddCategoryModal();
            if (typeof closeAddSymptomModal === 'function') closeAddSymptomModal();
            if (typeof closeAddDiseaseModal === 'function') closeAddDiseaseModal();
            if (typeof closeViewCustomModal === 'function') closeViewCustomModal();
        }
    });
    
    // ONLINE/OFFLINE
    window.addEventListener('online', function() { updateConnectionStatus(true); });
    window.addEventListener('offline', function() { updateConnectionStatus(false); });
    updateConnectionStatus(navigator.onLine);
    
    console.log('✅ All events registered');
    
    // AUTO-LOGIN
    setTimeout(function() {
        checkAutoLogin().then(function(loggedIn) {
            console.log(loggedIn ? '✅ Auto-logged in' : '⚠️ Manual login needed');
        });
    }, 100);
});
