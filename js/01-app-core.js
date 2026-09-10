// ============================================================
// Bismillah Clinic — js/01-app-core.js
// CONFIG + UTILITIES + LANGUAGE + SYNC + DATABASE + CACHE
// NOTE: Ye index.html ke inline script ka hissa hai (sirf jagah badli hai).
// WARNING: In files ka LOAD ORDER kabhi na badlein!
// ============================================================

// ==================== CONFIG ====================
const SUPABASE_URL = 'https://eooujrqtmaxyuozdgfgc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvb3VqcnF0bWF4eXVvemRnZmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5Mjg5NTgsImV4cCI6MjA5ODUwNDk1OH0.Qy4WigE8GIs8x8gm0jwv7pndEy5kMvN-kycozNdCNvU';


function createOfflineSupabaseStub() {
    function result(data, message) {
        return { data: data === undefined ? null : data, error: message ? { message: message } : null };
    }
    function builder(defaultData) {
        var b = {
            select: function() { return b; },
            insert: function() { return b; },
            update: function() { return b; },
            upsert: function() { return b; },
            delete: function() { return b; },
            eq: function() { return b; },
            order: function() { return b; },
            limit: function() { return b; },
            maybeSingle: function() { return Promise.resolve(result(null, 'Supabase unavailable/offline')); },
            single: function() { return Promise.resolve(result(null, 'Supabase unavailable/offline')); },
            then: function(resolve, reject) { return Promise.resolve(result(defaultData || [], 'Supabase unavailable/offline')).then(resolve, reject); },
            catch: function(reject) { return Promise.resolve(result(defaultData || [], 'Supabase unavailable/offline')).catch(reject); }
        };
        return b;
    }
    return {
        from: function(table) { return builder([]); },
        __offlineStub: true
    };
}

const sb = (window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : createOfflineSupabaseStub();
if (sb.__offlineStub) {
    console.warn('⚠️ Supabase library not loaded. App is running in offline/local mode.');
}


let currentLang = localStorage.getItem('clinic_lang') || 'ur';
let currentUserData = null;
let cachedPatients = [];
let cachedVisits = [];
let confirmCallback = null;
let lastCacheRefresh = 0;
const CACHE_LIFETIME = 30000;

// ==================== UTILITIES ====================
function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelectorAll(sel); }

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function generateId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

function showLoading() { $('loadingOverlay').classList.add('active'); }
function hideLoading() { $('loadingOverlay').classList.remove('active'); }

function showToast(msg, type) {
    const toast = document.createElement('div');
    toast.textContent = msg;
    const bg = type === 'error' ? '#e74c3c' : '#2c3e50';
    toast.style.cssText = 'position:fixed;top:70px;left:50%;transform:translateX(-50%);background:' + bg + ';color:white;padding:10px 20px;border-radius:20px;z-index:9999;font-size:14px;box-shadow:0 5px 20px rgba(0,0,0,0.3);max-width:90%;text-align:center;';
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 3000);
}

// Expose globally for diagnosis-custom.js
window.escapeHtml = escapeHtml;
window.showToast = showToast;

// ==================== GENDER ====================
const GENDER_MAP = {
    male:   { ur: 'مرد',  en: 'Male',   roman: 'Mard'  },
    female: { ur: 'عورت', en: 'Female', roman: 'Aurat' },
    boy:    { ur: 'بچہ',  en: 'Boy',    roman: 'Bacha' },
    girl:   { ur: 'بچی',  en: 'Girl',   roman: 'Bachi' },
    'مرد':   { ur: 'مرد',  en: 'Male',   roman: 'Mard'  },
    'عورت': { ur: 'عورت', en: 'Female', roman: 'Aurat' },
    'بچہ':  { ur: 'بچہ',  en: 'Boy',    roman: 'Bacha' },
    'بچی':  { ur: 'بچی',  en: 'Girl',   roman: 'Bachi' }
};

function translateGender(gender) {
    if (!gender) return '-';
    const map = GENDER_MAP[gender];
    return map ? (map[currentLang] || gender) : gender;
}

function getGenderBadgeClass(gender) {
    if (gender === 'male' || gender === 'مرد') return 'badge-male';
    if (gender === 'female' || gender === 'عورت') return 'badge-female';
    return 'badge-child';
}

// ==================== LANGUAGE ====================
const LANGUAGES = ['ur', 'en', 'roman'];

function applyLanguage() {
    document.body.className = 'lang-' + currentLang;
    document.body.dir = currentLang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    $$('[data-ur]').forEach(function(el) {
        const text = el.getAttribute('data-' + currentLang);
        if (text) el.textContent = text;
    });
    // Update placeholders based on language
    $$('[data-ph-ur]').forEach(function(el) {
        const ph = el.getAttribute('data-ph-' + currentLang);
        if (ph) el.placeholder = ph;
    });
    const offlineTexts = {
        ur: 'آپ آفلائن ہیں - ڈیٹا مقامی طور پر محفوظ ہو رہا ہے',
        en: 'You are offline - Data saved locally',
        roman: 'Aap offline hain - Data locally save ho raha hai'
    };
    if ($('offlineNoticeText')) $('offlineNoticeText').textContent = offlineTexts[currentLang];
    // Keep repertory search button/placeholder in the selected app language.
    if (typeof updateRepSearchModeUI === 'function') updateRepSearchModeUI();
}

function toggleLanguage() {
    const idx = LANGUAGES.indexOf(currentLang);
    currentLang = LANGUAGES[(idx + 1) % LANGUAGES.length];
    localStorage.setItem('clinic_lang', currentLang);
    applyLanguage();
    if (window.syncAILang) syncAILang(); /* AI ہوميو اسسٹنٹ iframe کو نئی زبان بھیجو */
    updateConnectionStatus(navigator.onLine);
    const names = { ur: 'اردو', en: 'English', roman: 'Roman Urdu' };
    showToast('🌐 ' + names[currentLang]);
    const activePage = document.querySelector('.page.active');
    if (activePage) {
        const pageId = activePage.id.replace('page-', '');
        if (pageId === 'dashboard') updateDashboard();
        if (pageId === 'allPatients') showAllPatients();
        if (pageId === 'diagnosis') {
            renderCategoryTabs();
            renderSymptomsGrid();
            updateSelectedBox();
            if (typeof renderStudioAll === 'function') renderStudioAll();
        }
    }
    // Case-taking form (اکارڈین): زبان بدلتے ہی فوری دوبارہ رینڈر — بھرا ہوا ڈیٹا CT state میں محفوظ رہتا ہے
    const ctRoot = document.getElementById('ct-page-root');
    if (ctRoot && ctRoot.innerHTML.trim() && typeof renderCaseTaking === 'function') {
        try { renderCaseTaking(); } catch (e) { console.error('case re-render', e); }
    }
}

// ==================== CONNECTION ====================
function updateConnectionStatus(online) {
    const el = $('connStatus');
    if (!el) return;
    const dot = el.querySelector('.status-dot');
    const text = el.querySelector('.status-text');
    const onTexts = { ur: 'آن لائن', en: 'Online', roman: 'Online' };
    const offTexts = { ur: 'آف لائن', en: 'Offline', roman: 'Offline' };
    if (online) {
        dot.classList.remove('offline');
        text.textContent = onTexts[currentLang] || 'Online';
        $('offlineNotice').classList.add('hidden');
        setTimeout(syncPendingData, 1000);
    } else {
        dot.classList.add('offline');
        text.textContent = offTexts[currentLang] || 'Offline';
        $('offlineNotice').classList.remove('hidden');
    }
}

// ==================== PENDING DATA ====================
function getPendingPatients() {
    return JSON.parse(localStorage.getItem('pending_patients') || '[]');
}
function savePendingPatient(patient) {
    const pending = getPendingPatients();
    pending.push(patient);
    localStorage.setItem('pending_patients', JSON.stringify(pending));
    updatePendingBadge();
}
function getPendingVisits() {
    return JSON.parse(localStorage.getItem('pending_visits') || '[]');
}
function savePendingVisit(visit) {
    const pending = getPendingVisits();
    pending.push(visit);
    localStorage.setItem('pending_visits', JSON.stringify(pending));
    updatePendingBadge();
}
function getPendingEdits() {
    return JSON.parse(localStorage.getItem('pending_edits') || '[]');
}
function savePendingEdit(edit) {
    const pending = getPendingEdits();
    const idx = pending.findIndex(function(e) { return e.id === edit.id && e.type === edit.type; });
    if (idx >= 0) pending[idx] = edit;
    else pending.push(edit);
    localStorage.setItem('pending_edits', JSON.stringify(pending));
    updatePendingBadge();
}

function updatePendingBadge() {
    const pp = getPendingPatients().length;
    const pv = getPendingVisits().length;
    const pe = getPendingEdits().length;
    const total = pp + pv + pe;
    const badge = $('pendingBadge');
    if (total > 0) {
        badge.textContent = total;
        badge.classList.remove('hidden');
        const syncSection = $('syncSection');
        if (syncSection) {
            syncSection.classList.remove('hidden');
            $('syncInfo').textContent = pp + ' patients, ' + pv + ' visits, ' + pe + ' edits pending';
        }
    } else {
        badge.classList.add('hidden');
        const syncSection = $('syncSection');
        if (syncSection) syncSection.classList.add('hidden');
    }
}

async function syncPendingData() {
    if (!navigator.onLine) return;
    
    const pendingPatients = getPendingPatients();
    const pendingVisits = getPendingVisits();
    const pendingEdits = getPendingEdits();
    
    if (pendingPatients.length === 0 && pendingVisits.length === 0 && pendingEdits.length === 0) return;
    
    showToast('🔄 Syncing...');
    let synced = 0, errors = 0;
    const failedP = [], failedV = [], failedE = [];
    
    for (const p of pendingPatients) {
        try { 
            await savePatientDB(p); 
            synced++; 
        } catch(e) { 
            console.error('❌ Patient sync failed:', p.name, e.message || e);
            // If duplicate/conflict error, skip (already synced)
            if (e.code === '23505' || e.code === '409' || (e.message && (e.message.indexOf('duplicate') !== -1 || e.message.indexOf('Conflict') !== -1 || e.message.indexOf('conflict') !== -1 || e.message.indexOf('already exists') !== -1))) {
                console.log('⏭️ Skipping duplicate patient:', p.name);
                synced++;
            } else {
                failedP.push(p); 
                errors++; 
            }
        }
    }
    for (const v of pendingVisits) {
        try { 
            await saveVisitDB(v); 
            synced++; 
        } catch(e) { 
            console.error('❌ Visit sync failed:', v.patientId, e.message || e);
            if (e.code === '23505' || e.code === '409' || (e.message && (e.message.indexOf('duplicate') !== -1 || e.message.indexOf('Conflict') !== -1 || e.message.indexOf('conflict') !== -1))) {
                console.log('⏭️ Skipping duplicate visit');
                synced++;
            } else {
                failedV.push(v); 
                errors++; 
            }
        }
    }
    for (const e of pendingEdits) {
        try {
            if (e.type === 'patient') await updatePatientDB(e.id, e.data);
            else if (e.type === 'visit') await updateVisitDB(e.id, e.data);
            synced++;
        } catch(err) { 
            console.error('❌ Edit sync failed:', e.type, e.id, err.message || err);
            failedE.push(e); 
            errors++; 
        }
    }
    
    localStorage.setItem('pending_patients', JSON.stringify(failedP));
    localStorage.setItem('pending_visits', JSON.stringify(failedV));
    localStorage.setItem('pending_edits', JSON.stringify(failedE));
    updatePendingBadge();
    
    if (synced > 0) {
        showToast('✅ Synced: ' + synced + ' items');
        await forceCacheRefresh();
    }
    if (errors > 0) showToast('⚠️ ' + errors + ' failed - check console', 'error');
}

// ==================== DATABASE ====================
function dbToPatient(db) {
    return {
        id: db.id, refNo: db.ref_no, familyNo: db.family_no,
        name: db.name, fatherName: db.father_name, age: db.age,
        gender: db.gender, weight: db.weight, allergy: db.allergy,
        phone: db.phone, address: db.address, initialSymptoms: db.initial_symptoms,
        createdAt: db.created_at, createdBy: db.created_by
    };
}

function patientToDb(p) {
    const obj = {
        ref_no: p.refNo, family_no: p.familyNo || null,
        name: p.name, father_name: p.fatherName || null, age: p.age || null,
        gender: p.gender || null, weight: p.weight || null, allergy: p.allergy || null,
        phone: p.phone, address: p.address || null, initial_symptoms: p.initialSymptoms || null,
        created_by: p.createdBy || null
    };
    if (p.id) obj.id = p.id;
    return obj;
}

function dbToVisit(db) {
    return {
        id: db.id, patientId: db.patient_id,
        visitRef: db.visit_ref || null,
        date: db.visit_date, time: db.visit_time,
        symptoms: db.symptoms, diagnosis: db.diagnosis,
        prescription: db.prescription, days: db.days,
        bp: db.bp, sugar: db.sugar, temperature: db.temperature,
        pulse: db.pulse, method: db.method, notes: db.notes,
        type: db.visit_type || 'registration',
        createdAt: db.created_at, createdBy: db.created_by
    };
}

function visitToDb(v) {
    const obj = {
        patient_id: v.patientId,
        visit_date: v.date, visit_time: v.time,
        symptoms: v.symptoms || null, diagnosis: v.diagnosis || null,
        prescription: v.prescription || null, days: v.days || null,
        bp: v.bp || null, sugar: v.sugar || null,
        temperature: v.temperature || null, pulse: v.pulse || null,
        method: v.method || null, notes: v.notes || null,
        visit_type: v.type || 'followup',
        created_by: v.createdBy || null
    };
    if (v.id) obj.id = v.id;
    // visit_ref column - only include if value exists
    if (v.visitRef) obj.visit_ref = v.visitRef;
    return obj;
}

// Test if visit_ref column exists in Supabase
var _visitRefColumnExists = null;
async function checkVisitRefColumn() {
    if (_visitRefColumnExists !== null) return _visitRefColumnExists;
    try {
        var r = await sb.from('visits').select('visit_ref').limit(1);
        _visitRefColumnExists = !r.error;
    } catch(e) {
        _visitRefColumnExists = false;
    }
    if (!_visitRefColumnExists) {
        console.warn('⚠️ visit_ref column not found in Supabase. Visit refs stored locally only.');
    }
    return _visitRefColumnExists;
}

async function getPatients() {
    try {
        const r = await sb.from('patients').select('*').order('created_at', { ascending: false });
        if (r.error) { console.error(r.error); return []; }
        return r.data.map(dbToPatient);
    } catch(e) { console.error(e); return []; }
}

async function getVisits() {
    try {
        const r = await sb.from('visits').select('*').order('created_at', { ascending: false });
        if (r.error) { console.error(r.error); return []; }
        return r.data.map(dbToVisit);
    } catch(e) { console.error(e); return []; }
}

async function getVisitsByPatient(patientId) {
    try {
        const r = await sb.from('visits').select('*').eq('patient_id', patientId).order('visit_date', { ascending: false });
        if (r.error) return [];
        return r.data.map(dbToVisit);
    } catch(e) { return []; }
}

async function savePatientDB(patient) {
    var dbData = patientToDb(patient);
    console.log('📤 Saving patient:', dbData.name);
    // Check if already exists
    var existing = await sb.from('patients').select('id').eq('id', dbData.id).maybeSingle();
    if (existing.data) {
        console.log('⏭️ Patient already exists, updating:', dbData.name);
        var r = await sb.from('patients').update(dbData).eq('id', dbData.id).select();
        if (r.error) throw r.error;
        return r.data[0];
    }
    var r = await sb.from('patients').insert([dbData]).select();
    if (r.error) {
        console.error('Patient save error:', r.error.message);
        throw r.error;
    }
    return r.data[0];
}

async function saveVisitDB(visit) {
    var dbData = visitToDb(visit);
    console.log('📤 Saving visit:', dbData.id, 'ref:', dbData.visit_ref || 'none');
    // Check if already exists
    var existing = await sb.from('visits').select('id').eq('id', dbData.id).maybeSingle();
    if (existing.data) {
        console.log('⏭️ Visit already exists, updating');
        var updateData = Object.assign({}, dbData);
        delete updateData.id;
        var r = await sb.from('visits').update(updateData).eq('id', dbData.id).select();
        if (r.error) {
            // Retry without visit_ref
            delete updateData.visit_ref;
            r = await sb.from('visits').update(updateData).eq('id', dbData.id).select();
            if (r.error) throw r.error;
        }
        return r.data[0];
    }
    var r = await sb.from('visits').insert([dbData]).select();
    if (r.error) {
        console.error('Visit save error:', r.error.message);
        // Retry without visit_ref
        delete dbData.visit_ref;
        r = await sb.from('visits').insert([dbData]).select();
        if (r.error) throw r.error;
    }
    return r.data[0];
}

async function updatePatientDB(patientId, updates) {
    const r = await sb.from('patients').update(updates).eq('id', patientId).select();
    if (r.error) throw r.error;
    return r.data[0];
}

async function updateVisitDB(visitId, updates) {
    var r = await sb.from('visits').update(updates).eq('id', visitId).select();
    if (r.error) {
        // Retry without visit_ref if it causes error
        delete updates.visit_ref;
        r = await sb.from('visits').update(updates).eq('id', visitId).select();
        if (r.error) throw r.error;
    }
    return r.data[0];
}

async function deletePatientDB(patientId) {
    await sb.from('visits').delete().eq('patient_id', patientId);
    const r = await sb.from('patients').delete().eq('id', patientId);
    if (r.error) throw r.error;
}

async function deleteVisitDB(visitId) {
    const r = await sb.from('visits').delete().eq('id', visitId);
    if (r.error) throw r.error;
}

async function loginDB(username, password) {
    try {
        const r = await sb.from('users').select('*').eq('username', username).eq('password', password);
        if (r.error || !r.data || r.data.length === 0) return null;
        return r.data[0];
    } catch(e) { return null; }
}

// ==================== CACHE ====================
async function refreshCache(forceRefresh) {
    const now = Date.now();
    if (!forceRefresh && (now - lastCacheRefresh) < CACHE_LIFETIME && cachedPatients.length > 0) {
        return;
    }
    
    if (navigator.onLine) {
        try {
            loadOfflineCache();
            const dbPatients = await getPatients();
            const dbVisits = await getVisits();
            const pendingP = getPendingPatients();
            const pendingV = getPendingVisits();
            cachedPatients = mergeArrays(dbPatients, pendingP, 'id');
            cachedVisits = mergeArrays(dbVisits, pendingV, 'id');
            localStorage.setItem('cached_patients', JSON.stringify(cachedPatients));
            localStorage.setItem('cached_visits', JSON.stringify(cachedVisits));
            lastCacheRefresh = now;
        } catch(e) {
            console.error('Cache error:', e);
            loadOfflineCache();
        }
    } else {
        loadOfflineCache();
    }
}

async function forceCacheRefresh() {
    lastCacheRefresh = 0;
    await refreshCache(true);
}

function loadOfflineCache() {
    cachedPatients = JSON.parse(localStorage.getItem('cached_patients') || '[]');
    cachedVisits = JSON.parse(localStorage.getItem('cached_visits') || '[]');
    const pendingP = getPendingPatients();
    const pendingV = getPendingVisits();
    cachedPatients = mergeArrays(cachedPatients, pendingP, 'id');
    cachedVisits = mergeArrays(cachedVisits, pendingV, 'id');
}

function mergeArrays(arr1, arr2, key) {
    const map = new Map();
    arr1.forEach(function(item) { map.set(item[key], item); });
    arr2.forEach(function(item) { if (!map.has(item[key])) map.set(item[key], item); });
    return Array.from(map.values());
}
