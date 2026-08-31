// ============================================================
// Bismillah Clinic — js/02-app-auth.js
// AUTO-LOGIN + LOGIN + NAVIGATION
// NOTE: Ye index.html ke inline script ka hissa hai (sirf jagah badli hai).
// WARNING: In files ka LOAD ORDER kabhi na badlein!
// ============================================================

// ==================== AUTO-LOGIN ====================
async function checkAutoLogin() {
    try {
        let sessionStr = sessionStorage.getItem('clinic_session');
        let source = 'session';
        
        if (!sessionStr) {
            sessionStr = localStorage.getItem('clinic_session');
            source = 'local';
        }
        
        if (!sessionStr) return false;
        
        const session = JSON.parse(sessionStr);
        const now = Date.now();
        const age = now - session.timestamp;
        
        const maxAge = session.rememberMe ? 
            (30 * 24 * 60 * 60 * 1000) : 
            (24 * 60 * 60 * 1000);
        
        if (age > maxAge) {
            localStorage.removeItem('clinic_session');
            sessionStorage.removeItem('clinic_session');
            return false;
        }
        
        currentUserData = session.userData;
        session.timestamp = now;
        
        if (source === 'local' || session.rememberMe) {
            localStorage.setItem('clinic_session', JSON.stringify(session));
        }
        sessionStorage.setItem('clinic_session', JSON.stringify(session));
        
        $('loginPage').classList.add('hidden');
        $('mainApp').classList.remove('hidden');
        
        if (navigator.onLine) {
            await refreshCache();
        } else {
            loadOfflineCache();
            showToast('⚠️ Offline Mode', 'error');
        }
        
        updatePendingBadge();
        await updateDashboard();
        await generateRefNo();
        
        if (navigator.onLine) setTimeout(syncPendingData, 2000);
        
        return true;
    } catch(err) {
        console.error('Auto-login failed:', err);
        localStorage.removeItem('clinic_session');
        sessionStorage.removeItem('clinic_session');
        return false;
    }
}

function loadSavedCredentials() {
    try {
        const savedUser = localStorage.getItem('clinic_remember_username');
        const savedPass = localStorage.getItem('clinic_remember_password');
        
        if (savedUser && $('loginUsername')) {
            $('loginUsername').value = savedUser;
            if ($('rememberMe')) $('rememberMe').checked = true;
        }
        if (savedPass && $('loginPassword')) {
            try {
                $('loginPassword').value = atob(savedPass);
            } catch(e) {}
        }
    } catch(e) { console.error(e); }
}

// ==================== LOGIN ====================
async function handleLogin() {
    const username = $('loginUsername').value.trim();
    const password = $('loginPassword').value.trim();
    const rememberMe = $('rememberMe') ? $('rememberMe').checked : false;
    const errorDiv = $('loginError');
    const loginBtn = $('loginBtn');
    
    if (!username || !password) {
        errorDiv.textContent = '⚠️ Enter username and password';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="loading-inline"></span>';
    
    let user = null;
    let isOffline = false;
    
    if (navigator.onLine) {
        try {
            user = await loginDB(username, password);
            if (user) {
                const savedUsers = JSON.parse(localStorage.getItem('offline_users') || '[]');
                const idx = savedUsers.findIndex(function(u) { return u.username === username; });
                const toSave = { ...user, _pw: btoa(password) };
                if (idx >= 0) savedUsers[idx] = toSave; else savedUsers.push(toSave);
                localStorage.setItem('offline_users', JSON.stringify(savedUsers));
            }
        } catch(e) { console.error(e); }
    }
    
    if (!user) {
        const saved = JSON.parse(localStorage.getItem('offline_users') || '[]');
        const match = saved.find(function(u) { return u.username === username && atob(u._pw) === password; });
        if (match) { user = { ...match }; delete user._pw; isOffline = true; }
    }
    
    if (user) {
        currentUserData = user;
        errorDiv.classList.add('hidden');
        
        const sessionData = {
            userData: user,
            timestamp: Date.now(),
            rememberMe: rememberMe
        };
        
        localStorage.setItem('clinic_session', JSON.stringify(sessionData));
        sessionStorage.setItem('clinic_session', JSON.stringify(sessionData));
        
        if (rememberMe) {
            localStorage.setItem('clinic_remember_username', username);
            localStorage.setItem('clinic_remember_password', btoa(password));
        } else {
            localStorage.removeItem('clinic_remember_username');
            localStorage.removeItem('clinic_remember_password');
        }
        
        $('loginPage').classList.add('hidden');
        $('mainApp').classList.remove('hidden');
        
        if (isOffline) { showToast('⚠️ Offline Mode', 'error'); loadOfflineCache(); }
        else await refreshCache();
        
        updatePendingBadge();
        await updateDashboard();
        await generateRefNo();
        if (navigator.onLine) setTimeout(syncPendingData, 2000);
    } else {
        errorDiv.textContent = navigator.onLine ? '❌ Wrong username or password' : '❌ Offline: Login online first';
        errorDiv.classList.remove('hidden');
    }
    
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<span data-ur="🔓 لاگ ان" data-en="🔓 Login" data-roman="🔓 Login">🔓 لاگ ان</span>';
    applyLanguage();
}

function handleLogout() {
    showConfirm(
        ({ ur: 'کیا آپ لاگ آؤٹ کرنا چاہتے ہیں؟', en: 'Do you want to logout?', roman: 'Kya aap logout karna chahte hain?' }[currentLang]),
        function() {
            currentUserData = null;
            localStorage.removeItem('clinic_session');
            sessionStorage.removeItem('clinic_session');
            
            const hasRemembered = localStorage.getItem('clinic_remember_username');
            if (hasRemembered) {
                setTimeout(function() {
                    showConfirm(
                        ({ ur: 'کیا محفوظ شدہ لاگ ان معلومات بھی ڈیلیٹ کریں؟', en: 'Delete saved login credentials?', roman: 'Saved login info delete karein?' }[currentLang]),
                        function() {
                            localStorage.removeItem('clinic_remember_username');
                            localStorage.removeItem('clinic_remember_password');
                            $('loginUsername').value = '';
                            $('loginPassword').value = '';
                            if ($('rememberMe')) $('rememberMe').checked = false;
                            showToast('🗑️ Saved credentials deleted');
                        }
                    );
                }, 500);
            }
            
            $('mainApp').classList.add('hidden');
            $('loginPage').classList.remove('hidden');
            loadSavedCredentials();
        }
    );
}

// ==================== NAVIGATION ====================
async function showPage(pageId, btn) {
    if (!pageId) return;
    var pageEl = $('page-' + pageId);
    if (!pageEl) return;
    $$('.page').forEach(function(p) { p.classList.remove('active'); });
    pageEl.classList.add('active');
    $$('.nav-btn').forEach(function(b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
    window.scrollTo(0, 0);
    
    if (pageId === 'allPatients') {
        $('allPatientsList').innerHTML = '<div class="empty-state"><div class="icon">⏳</div><p>Loading...</p></div>';
    }
    
    requestAnimationFrame(async function() {
        try {
            if (pageId === 'dashboard') await updateDashboard();
            if (pageId === 'allPatients') await showAllPatients();
            if (pageId === 'newPatient') {
                await generateRefNo();
                if ($('firstVisitRef')) $('firstVisitRef').value = generateVisitRef();
                const now = new Date();
                $('firstVisitDate').value = now.toISOString().split('T')[0];
                $('firstVisitTime').value = now.toTimeString().substring(0, 5);
            }
            if (pageId === 'diagnosis') initDiagnosis();
            if (pageId === 'newVisitPage') {
                if ($('nvVisitRef') && !nvCurrentPatientId) $('nvVisitRef').value = generateVisitRef();
                var now2 = new Date();
                if ($('nvDate')) $('nvDate').value = now2.toISOString().split('T')[0];
                if ($('nvTime')) $('nvTime').value = now2.toTimeString().substring(0, 5);
            }
            if (pageId === 'settings') { updatePendingBadge(); loadDashboardFilterUI(); loadDiseaseSuggestSettingsUI(); }
            if (pageId === 'repertoryBrowser') {
                // 🔑 first-time init of the chapter list + sync toggle button state
                if (typeof updateRepSearchModeUI === 'function') updateRepSearchModeUI();
                if (repChapterNames.length === 0 && typeof initRepertoryBrowser === 'function') initRepertoryBrowser();
            }
        } catch(err) { console.error('Page error:', err); }
    });
}
