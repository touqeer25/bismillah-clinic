// ==========================================
// Bismillah Clinic - Custom Data Manager v4
// Complete Cloud Sync + Backup + GitHub Export
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // SUPABASE CLIENT
    // ==========================================
    function getSupabase() {
        if (typeof window.sb !== 'undefined') return window.sb;
        if (typeof sb !== 'undefined') return sb;
        return null;
    }

    // ==========================================
    // ICON LIBRARY (155+ icons)
    // ==========================================
    const ICON_LIBRARY = [
        // General Medical
        { icon: '🏥', label: 'Hospital' },
        { icon: '🩺', label: 'Stethoscope' },
        { icon: '💊', label: 'Medicine' },
        { icon: '💉', label: 'Injection' },
        { icon: '🧪', label: 'Lab' },
        { icon: '🧫', label: 'Petri Dish' },
        { icon: '🔬', label: 'Microscope' },
        { icon: '🧬', label: 'DNA' },
        { icon: '⚕️', label: 'Medical' },
        { icon: '🩹', label: 'Bandage' },
        { icon: '🩼', label: 'Crutch' },
        { icon: '🦽', label: 'Wheelchair' },
        { icon: '📋', label: 'Clipboard' },
        { icon: '📝', label: 'Prescription' },
        { icon: '🏨', label: 'Clinic' },
        // Head & Brain
        { icon: '🧠', label: 'Brain' },
        { icon: '👤', label: 'Head' },
        { icon: '💆', label: 'Massage' },
        { icon: '🤕', label: 'Injury' },
        // Eyes
        { icon: '👁️', label: 'Eye' },
        { icon: '👀', label: 'Eyes' },
        { icon: '👓', label: 'Glasses' },
        { icon: '🥽', label: 'Goggles' },
        // Ear/Nose/Mouth
        { icon: '👂', label: 'Ear' },
        { icon: '🦻', label: 'Hearing Aid' },
        { icon: '👃', label: 'Nose' },
        { icon: '🤧', label: 'Sneezing' },
        { icon: '👄', label: 'Mouth' },
        { icon: '👅', label: 'Tongue' },
        { icon: '🦷', label: 'Tooth' },
        { icon: '😷', label: 'Mask' },
        // Inner Organs
        { icon: '🫀', label: 'Heart Anatomical' },
        { icon: '❤️', label: 'Heart Symbol' },
        { icon: '💗', label: 'Heart Beating' },
        { icon: '💓', label: 'Heartbeat' },
        { icon: '🫁', label: 'Lungs' },
        { icon: '🫘', label: 'Kidney' },
        // Digestive
        { icon: '🍽️', label: 'Digestive' },
        { icon: '🫃', label: 'Stomach' },
        { icon: '🫄', label: 'Pregnant Belly' },
        // Urinary/Fluids
        { icon: '💧', label: 'Water' },
        { icon: '💦', label: 'Sweat' },
        { icon: '🩸', label: 'Blood' },
        { icon: '🧴', label: 'Lotion' },
        // Bones
        { icon: '🦴', label: 'Bone' },
        { icon: '💀', label: 'Skull' },
        { icon: '🦿', label: 'Leg Mech' },
        { icon: '🦾', label: 'Arm Mech' },
        // Muscles & Body
        { icon: '💪', label: 'Muscle' },
        { icon: '🦵', label: 'Leg' },
        { icon: '🦶', label: 'Foot' },
        { icon: '👣', label: 'Footprints' },
        { icon: '✋', label: 'Hand' },
        { icon: '🖐️', label: 'Hand Open' },
        { icon: '👋', label: 'Wave' },
        { icon: '🤚', label: 'Raised Hand' },
        { icon: '👐', label: 'Both Hands' },
        { icon: '💅', label: 'Nail' },
        // Symptoms
        { icon: '🤒', label: 'Fever' },
        { icon: '🤢', label: 'Nausea' },
        { icon: '🤮', label: 'Vomiting' },
        { icon: '🥴', label: 'Dizzy' },
        { icon: '😵', label: 'Unconscious' },
        { icon: '😵‍💫', label: 'Vertigo' },
        { icon: '🥵', label: 'Hot' },
        { icon: '🥶', label: 'Cold' },
        { icon: '😪', label: 'Sleepy' },
        { icon: '😴', label: 'Sleeping' },
        { icon: '💤', label: 'Sleep' },
        { icon: '🌡️', label: 'Temperature' },
        // Mental
        { icon: '🧘', label: 'Meditation' },
        { icon: '😰', label: 'Anxiety' },
        { icon: '😨', label: 'Fear' },
        { icon: '😱', label: 'Panic' },
        { icon: '😢', label: 'Sad' },
        { icon: '😭', label: 'Crying' },
        { icon: '😔', label: 'Depression' },
        { icon: '😞', label: 'Sad Face' },
        { icon: '😤', label: 'Anger' },
        { icon: '🤯', label: 'Mind Blown' },
        // Pediatric/Women
        { icon: '👶', label: 'Baby' },
        { icon: '🧒', label: 'Child' },
        { icon: '👦', label: 'Boy' },
        { icon: '👧', label: 'Girl' },
        { icon: '👩', label: 'Woman' },
        { icon: '🤰', label: 'Pregnant' },
        { icon: '🤱', label: 'Breastfeeding' },
        { icon: '👨', label: 'Man' },
        { icon: '👴', label: 'Old Man' },
        { icon: '👵', label: 'Old Woman' },
        // Emergency
        { icon: '🚨', label: 'Emergency' },
        { icon: '⚠️', label: 'Warning' },
        { icon: '🆘', label: 'SOS' },
        { icon: '☠️', label: 'Danger' },
        { icon: '🔴', label: 'Red Alert' },
        { icon: '🟡', label: 'Yellow' },
        { icon: '🟢', label: 'Green' },
        // Infections
        { icon: '🦠', label: 'Virus' },
        { icon: '🕷️', label: 'Spider' },
        { icon: '🐛', label: 'Bug' },
        { icon: '🪱', label: 'Worm' },
        // Special
        { icon: '🎗️', label: 'Cancer Ribbon' },
        { icon: '🎀', label: 'Ribbon' },
        // Herbal
        { icon: '🌿', label: 'Herbal' },
        { icon: '🍃', label: 'Leaf' },
        { icon: '🌱', label: 'Seedling' },
        { icon: '🌾', label: 'Grain' },
        { icon: '🍯', label: 'Honey' },
        { icon: '🥛', label: 'Milk' },
        // Environment
        { icon: '☀️', label: 'Sun' },
        { icon: '🌙', label: 'Moon' },
        { icon: '⭐', label: 'Star' },
        { icon: '🌟', label: 'Bright Star' },
        { icon: '🔥', label: 'Fire' },
        { icon: '❄️', label: 'Cold' },
        // Food/Diet
        { icon: '🍎', label: 'Apple' },
        { icon: '🥗', label: 'Salad' },
        { icon: '🍚', label: 'Rice' },
        { icon: '🚫', label: 'No' },
        // Activity
        { icon: '🏃', label: 'Running' },
        { icon: '🚶', label: 'Walking' },
        { icon: '🧘‍♂️', label: 'Yoga Man' },
        { icon: '🧘‍♀️', label: 'Yoga Woman' },
        { icon: '🏋️', label: 'Weightlifting' },
        // Misc
        { icon: '📌', label: 'Pin' },
        { icon: '🔒', label: 'Lock' },
        { icon: '✅', label: 'Check' },
        { icon: '❌', label: 'Cross' },
        { icon: '❓', label: 'Question' },
        { icon: '❗', label: 'Exclamation' },
        { icon: '💯', label: '100' },
        { icon: '⚡', label: 'Energy' }
    ];

    window.ICON_LIBRARY = ICON_LIBRARY;

    // ==========================================
    // STORAGE HELPERS
    // ==========================================
    function getCachedCategories() {
        return JSON.parse(localStorage.getItem('cache_custom_categories') || '{}');
    }
    function setCachedCategories(data) {
        localStorage.setItem('cache_custom_categories', JSON.stringify(data));
    }
    function getCachedSymptoms() {
        return JSON.parse(localStorage.getItem('cache_custom_symptoms') || '{}');
    }
    function setCachedSymptoms(data) {
        localStorage.setItem('cache_custom_symptoms', JSON.stringify(data));
    }
    function getCachedDiseases() {
        return JSON.parse(localStorage.getItem('cache_custom_diseases') || '[]');
    }
    function setCachedDiseases(data) {
        localStorage.setItem('cache_custom_diseases', JSON.stringify(data));
    }

    // ==========================================
    // PENDING OPERATIONS
    // ==========================================
    function getPendingOps() {
        return JSON.parse(localStorage.getItem('pending_custom_ops') || '[]');
    }
    function addPendingOp(op) {
        var ops = getPendingOps();
        ops.push(Object.assign({}, op, { timestamp: Date.now() }));
        localStorage.setItem('pending_custom_ops', JSON.stringify(ops));
    }

    // ==========================================
    // HISTORY LOG
    // ==========================================
    async function logHistory(action, itemType, itemId, itemName, details) {
        try {
            var user = 'Unknown';
            if (typeof window.currentUserData !== 'undefined' && window.currentUserData) {
                user = window.currentUserData.name || 'Unknown';
            }
            
            var history = JSON.parse(localStorage.getItem('custom_history_log') || '[]');
            history.unshift({
                action: action,
                item_type: itemType,
                item_id: itemId,
                item_name: itemName,
                details: details || null,
                performed_by: user,
                performed_at: new Date().toISOString()
            });
            if (history.length > 200) history = history.slice(0, 200);
            localStorage.setItem('custom_history_log', JSON.stringify(history));

            var sb = getSupabase();
            if (sb && navigator.onLine) {
                try {
                    await sb.from('custom_data_history').insert([{
                        action: action,
                        item_type: itemType,
                        item_id: itemId,
                        item_name: itemName,
                        details: details || null,
                        performed_by: user
                    }]);
                } catch(e) {
                    console.warn('History cloud save failed:', e);
                }
            }
        } catch(e) {
            console.error('History log error:', e);
        }
    }

    // ==========================================
    // MERGE INTO GLOBAL DBs
    // ==========================================
    function mergeIntoGlobalDBs() {
        if (!window.CATEGORIES_DB || !window.SYMPTOMS_DB || !window.DISEASES_DB) {
            setTimeout(mergeIntoGlobalDBs, 500);
            return;
        }

        var cats = getCachedCategories();
        var syms = getCachedSymptoms();
        var dis = getCachedDiseases();

        Object.keys(cats).forEach(function(k) {
            window.CATEGORIES_DB[k] = {
                ur: cats[k].ur,
                en: cats[k].en,
                roman: cats[k].roman || cats[k].en,
                icon: cats[k].icon || '📌'
            };
        });

        Object.keys(syms).forEach(function(k) {
            window.SYMPTOMS_DB[k] = {
                ur: syms[k].ur,
                en: syms[k].en,
                roman: syms[k].roman || syms[k].en,
                category: syms[k].category || 'general'
            };
            if (syms[k].severe) window.SYMPTOMS_DB[k].severe = true;
        });

        dis.forEach(function(d) {
            var exists = window.DISEASES_DB.find(function(x) { return x.id === d.id; });
            if (!exists) window.DISEASES_DB.push(d);
        });

        console.log('✅ Custom data merged');
    }

    // ==========================================
    // CLOUD SYNC
    // ==========================================
    async function syncFromCloud() {
        var sb = getSupabase();
        if (!sb || !navigator.onLine) {
            mergeIntoGlobalDBs();
            return false;
        }

        try {
            var catRes = await sb.from('custom_categories').select('*');
            if (catRes.data) {
                var catMap = {};
                catRes.data.forEach(function(c) {
                    catMap[c.id] = {
                        ur: c.ur, en: c.en, roman: c.roman, icon: c.icon,
                        promoted: c.promoted, created_at: c.created_at, promoted_at: c.promoted_at
                    };
                });
                setCachedCategories(catMap);
            }

            var symRes = await sb.from('custom_symptoms').select('*');
            if (symRes.data) {
                var symMap = {};
                symRes.data.forEach(function(s) {
                    symMap[s.id] = {
                        ur: s.ur, en: s.en, roman: s.roman, category: s.category,
                        severe: s.severe, promoted: s.promoted,
                        created_at: s.created_at, promoted_at: s.promoted_at
                    };
                });
                setCachedSymptoms(symMap);
            }

            var disRes = await sb.from('custom_diseases').select('*');
            if (disRes.data) {
                var disArr = disRes.data.map(function(d) {
                    return {
                        id: d.id,
                        name: { ur: d.name_ur, en: d.name_en, roman: d.name_roman },
                        icon: d.icon, category: d.category,
                        symptoms: d.symptoms || [], keySymptoms: d.key_symptoms || [],
                        tests: d.tests || [], redFlags: d.red_flags || [],
                        remedies: d.remedies || [],
                        advice: { ur: d.advice_ur || '', en: d.advice_en || '' },
                        promoted: d.promoted, created_at: d.created_at, promoted_at: d.promoted_at
                    };
                });
                setCachedDiseases(disArr);
            }

            mergeIntoGlobalDBs();
            await processPendingOps();
            return true;
        } catch(e) {
            console.error('Cloud sync error:', e);
            mergeIntoGlobalDBs();
            return false;
        }
    }

    async function processPendingOps() {
        var sb = getSupabase();
        if (!sb || !navigator.onLine) return;

        var ops = getPendingOps();
        if (ops.length === 0) return;

        var succeeded = [];
        for (var i = 0; i < ops.length; i++) {
            var op = ops[i];
            try {
                if (op.action === 'save_category') {
                    await sb.from('custom_categories').upsert([op.data]);
                } else if (op.action === 'delete_category') {
                    await sb.from('custom_categories').delete().eq('id', op.data.id);
                } else if (op.action === 'save_symptom') {
                    await sb.from('custom_symptoms').upsert([op.data]);
                } else if (op.action === 'delete_symptom') {
                    await sb.from('custom_symptoms').delete().eq('id', op.data.id);
                } else if (op.action === 'save_disease') {
                    await sb.from('custom_diseases').upsert([op.data]);
                } else if (op.action === 'delete_disease') {
                    await sb.from('custom_diseases').delete().eq('id', op.data.id);
                } else if (op.action === 'promote') {
                    await sb.from(op.data.table).update({
                        promoted: true, promoted_at: new Date().toISOString()
                    }).eq('id', op.data.id);
                }
                succeeded.push(i);
            } catch(e) {
                console.warn('Op failed:', e);
            }
        }

        var remaining = ops.filter(function(_, idx) { return succeeded.indexOf(idx) === -1; });
        localStorage.setItem('pending_custom_ops', JSON.stringify(remaining));

        if (succeeded.length > 0 && typeof showToast === 'function') {
            showToast('✅ ' + succeeded.length + ' items synced');
        }
    }

    // Expose to window
    window.syncFromCloud = syncFromCloud;
    window.processPendingOps = processPendingOps;

    // ==========================================
    // ICON PICKER
    // ==========================================
    function renderIconPicker(containerId, hiddenInputId, selectedIcon) {
        var container = document.getElementById(containerId);
        if (!container) return;

        var html = '<div style="display:flex;flex-wrap:wrap;gap:4px;max-height:140px;overflow-y:auto;padding:6px;background:#f8f9fa;border-radius:6px;border:1px solid #ddd;">';
        ICON_LIBRARY.forEach(function(item) {
            var isSel = (item.icon === selectedIcon);
            var style = isSel ? 'background:#8e44ad;color:white;border:2px solid #6c3483;' : 'background:white;border:1px solid #ddd;';
            html += '<button type="button" onclick="selectIconForInput(\'' + hiddenInputId + '\',\'' + containerId + '\',\'' + item.icon + '\')" style="' + style + 'border-radius:6px;padding:6px 8px;cursor:pointer;font-size:20px;min-width:42px;text-align:center;" title="' + item.label + '">' + item.icon + '</button>';
        });
        html += '</div>';
        container.innerHTML = html;
    }

    window.selectIconForInput = function(inputId, containerId, icon) {
        var input = document.getElementById(inputId);
        if (input) input.value = icon;
        renderIconPicker(containerId, inputId, icon);
    };

    // ==========================================
    // CATEGORY OPERATIONS
    // ==========================================
    async function saveCategoryToCloud(catData) {
        var sb = getSupabase();
        var dbData = {
            id: catData.id, ur: catData.ur, en: catData.en,
            roman: catData.roman, icon: catData.icon,
            promoted: catData.promoted || false,
            created_by: (window.currentUserData ? window.currentUserData.name : 'Unknown')
        };

        if (sb && navigator.onLine) {
            try {
                await sb.from('custom_categories').upsert([dbData]);
                return true;
            } catch(e) {
                addPendingOp({ action: 'save_category', data: dbData });
                return false;
            }
        } else {
            addPendingOp({ action: 'save_category', data: dbData });
            return false;
        }
    }

    window.openAddCategoryModal = function(editId) {
        var modal = document.getElementById('addCategoryModal');
        if (!modal) return;

        var isEdit = !!editId;
        var cats = getCachedCategories();
        var cat = isEdit ? cats[editId] : null;

        document.getElementById('editCategoryOldId').value = isEdit ? editId : '';
        document.getElementById('newCategoryId').value = isEdit ? editId : '';
        document.getElementById('newCategoryUr').value = isEdit && cat ? cat.ur : '';
        document.getElementById('newCategoryEn').value = isEdit && cat ? cat.en : '';
        document.getElementById('newCategoryRoman').value = isEdit && cat ? cat.roman : '';
        document.getElementById('newCategoryIcon').value = isEdit && cat ? cat.icon : '📌';

        var idField = document.getElementById('newCategoryId');
        if (isEdit) {
            idField.readOnly = true;
            idField.style.background = '#ecf0f1';
        } else {
            idField.readOnly = false;
            idField.style.background = '';
        }

        document.getElementById('addCategoryMsg').innerHTML = '';
        var titleEl = document.getElementById('addCategoryTitle');
        var _lang = (typeof getCurrentLang === 'function' ? getCurrentLang() : (localStorage.getItem('clinic_lang') || 'ur'));
        var _catTitles = { ur: ['✏️ کیٹگری ترمیم', '➕ کیٹگری شامل کریں'], en: ['✏️ Edit Category', '➕ Add Category'], roman: ['✏️ Category Tarmeemi', '➕ Category Shamil Karein'] };
        if (titleEl) titleEl.textContent = isEdit ? (_catTitles[_lang]||_catTitles.en)[0] : (_catTitles[_lang]||_catTitles.en)[1];

        renderIconPicker('iconPickerContainer', 'newCategoryIcon', isEdit && cat ? cat.icon : '📌');
        modal.classList.add('active');
    };

    window.closeAddCategoryModal = function() {
        var m = document.getElementById('addCategoryModal');
        if (m) m.classList.remove('active');
    };

    window.saveNewCategory = async function() {
        var oldId = document.getElementById('editCategoryOldId').value;
        var isEdit = !!oldId;
        var id = document.getElementById('newCategoryId').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        var ur = document.getElementById('newCategoryUr').value.trim();
        var en = document.getElementById('newCategoryEn').value.trim();
        var roman = document.getElementById('newCategoryRoman').value.trim();
        var icon = document.getElementById('newCategoryIcon').value.trim() || '📌';
        var msgDiv = document.getElementById('addCategoryMsg');

        if (!id) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ' + ({ur:'ID لازمی ہے',en:'ID is required',roman:'ID lazmi hai'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'ID is required') + '</div>'; return; }
        if (!ur || !en) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ' + ({ur:'اردو اور انگلش لازمی',en:'Urdu and English required',roman:'Urdu aur English lazmi'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'Urdu and English required') + '</div>'; return; }

        var cats = getCachedCategories();
        if (!isEdit && cats[id]) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ' + ({ur:'یہ ID پہلے سے موجود ہے',en:'This ID already exists',roman:'Yeh ID pehle se mojood hai'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'This ID already exists') + '</div>'; return; }

        var newCat = {
            id: id, ur: ur, en: en, roman: roman || en, icon: icon,
            promoted: cats[id] ? cats[id].promoted : false
        };

        window.CATEGORIES_DB[id] = { ur: ur, en: en, roman: roman || en, icon: icon };
        cats[id] = newCat;
        setCachedCategories(cats);

        var cloudOk = await saveCategoryToCloud(newCat);
        await logHistory(isEdit ? 'edit' : 'add', 'category', id, en, newCat);

        var _smsg = {ur:'✅ محفوظ',en:'✅ Saved',roman:'✅ Mehfooz'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'✅ Saved';
        msgDiv.innerHTML = '<div class="alert alert-success">' + _smsg + (cloudOk ? ' ☁️' : ' (offline)') + '</div>';
        if (typeof showToast === 'function') showToast('✅ ' + en);

        if (document.querySelector('#page-diagnosis.active') && typeof renderCategoryTabs === 'function') {
            renderCategoryTabs();
        }

        setTimeout(window.closeAddCategoryModal, 1200);
    };

    window.deleteCustomCategory = function(catId) {
        var cats = getCachedCategories();
        var name = cats[catId] ? cats[catId].en : catId;

        if (typeof showConfirm !== 'function') {
            if (!confirm('Delete category "' + name + '"?')) return;
            doDeleteCategory(catId);
            return;
        }
        showConfirm('Delete category <b>' + name + '</b>?', function() { doDeleteCategory(catId); });
    };

    async function doDeleteCategory(catId) {
        var cats = getCachedCategories();
        var name = cats[catId] ? cats[catId].en : catId;
        delete cats[catId];
        setCachedCategories(cats);
        delete window.CATEGORIES_DB[catId];

        var sb = getSupabase();
        if (sb && navigator.onLine) {
            try { await sb.from('custom_categories').delete().eq('id', catId); }
            catch(e) { addPendingOp({ action: 'delete_category', data: { id: catId } }); }
        } else {
            addPendingOp({ action: 'delete_category', data: { id: catId } });
        }

        await logHistory('delete', 'category', catId, name);
        if (typeof showToast === 'function') showToast({ur:'🗑️ حذف ہو گیا',en:'🗑️ Deleted',roman:'🗑️ Delete ho gaya'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'🗑️ Deleted');
        window.viewCustomData();
        if (document.querySelector('#page-diagnosis.active') && typeof renderCategoryTabs === 'function') {
            renderCategoryTabs();
        }
    }

    // ==========================================
    // SYMPTOM OPERATIONS
    // ==========================================
    async function saveSymptomToCloud(symData) {
        var sb = getSupabase();
        var dbData = {
            id: symData.id, ur: symData.ur, en: symData.en, roman: symData.roman,
            category: symData.category, severe: symData.severe || false,
            promoted: symData.promoted || false,
            created_by: (window.currentUserData ? window.currentUserData.name : 'Unknown')
        };

        if (sb && navigator.onLine) {
            try {
                await sb.from('custom_symptoms').upsert([dbData]);
                return true;
            } catch(e) {
                addPendingOp({ action: 'save_symptom', data: dbData });
                return false;
            }
        } else {
            addPendingOp({ action: 'save_symptom', data: dbData });
            return false;
        }
    }

    window.openAddSymptomModal = function(editId) {
        var modal = document.getElementById('addSymptomModal');
        if (!modal) return;

        var isEdit = !!editId;
        var syms = getCachedSymptoms();
        var sym = isEdit ? syms[editId] : null;

        document.getElementById('editSymptomOldId').value = isEdit ? editId : '';
        document.getElementById('newSymptomId').value = isEdit ? editId : '';
        document.getElementById('newSymptomUr').value = isEdit && sym ? sym.ur : '';
        document.getElementById('newSymptomEn').value = isEdit && sym ? sym.en : '';
        document.getElementById('newSymptomRoman').value = isEdit && sym ? sym.roman : '';
        document.getElementById('newSymptomSevere').checked = isEdit && sym ? !!sym.severe : false;

        var idField = document.getElementById('newSymptomId');
        if (isEdit) {
            idField.readOnly = true;
            idField.style.background = '#ecf0f1';
        } else {
            idField.readOnly = false;
            idField.style.background = '';
        }

        var catSelect = document.getElementById('newSymptomCategory');
        catSelect.innerHTML = '';
        Object.keys(window.CATEGORIES_DB).forEach(function(k) {
            if (k === 'all') return;
            var opt = document.createElement('option');
            opt.value = k;
            opt.textContent = window.CATEGORIES_DB[k].icon + ' ' + window.CATEGORIES_DB[k].en;
            if (isEdit && sym && sym.category === k) opt.selected = true;
            else if (!isEdit && k === 'general') opt.selected = true;
            catSelect.appendChild(opt);
        });

        document.getElementById('addSymptomMsg').innerHTML = '';
        var titleEl = document.getElementById('addSymptomTitle');
        var _lang = (typeof getCurrentLang === 'function' ? getCurrentLang() : (localStorage.getItem('clinic_lang') || 'ur'));
        var _symTitles = { ur: ['✏️ علامت ترمیم', '➕ علامت شامل کریں'], en: ['✏️ Edit Symptom', '➕ Add Symptom'], roman: ['✏️ Alamat Tarmeemi', '➕ Alamat Shamil Karein'] };
        if (titleEl) titleEl.textContent = isEdit ? (_symTitles[_lang]||_symTitles.en)[0] : (_symTitles[_lang]||_symTitles.en)[1];

        modal.classList.add('active');
    };

    window.closeAddSymptomModal = function() {
        var m = document.getElementById('addSymptomModal');
        if (m) m.classList.remove('active');
    };

    window.saveNewSymptom = async function() {
        var oldId = document.getElementById('editSymptomOldId').value;
        var isEdit = !!oldId;
        var id = document.getElementById('newSymptomId').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        var ur = document.getElementById('newSymptomUr').value.trim();
        var en = document.getElementById('newSymptomEn').value.trim();
        var roman = document.getElementById('newSymptomRoman').value.trim();
        var category = document.getElementById('newSymptomCategory').value;
        var severe = document.getElementById('newSymptomSevere').checked;
        var msgDiv = document.getElementById('addSymptomMsg');

        if (!id || !ur || !en) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ' + ({ur:'ID، اردو اور انگلش لازمی ہیں',en:'ID, Urdu and English required',roman:'ID, Urdu aur English lazmi hain'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'ID, Urdu and English required') + '</div>'; return; }

        var syms = getCachedSymptoms();
        if (!isEdit && syms[id]) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ' + ({ur:'یہ ID پہلے سے موجود ہے',en:'This ID already exists',roman:'Yeh ID pehle se mojood hai'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'This ID already exists') + '</div>'; return; }

        var newSym = {
            id: id, ur: ur, en: en, roman: roman || en,
            category: category, severe: severe,
            promoted: syms[id] ? syms[id].promoted : false
        };

        window.SYMPTOMS_DB[id] = { ur: ur, en: en, roman: roman || en, category: category };
        if (severe) window.SYMPTOMS_DB[id].severe = true;

        syms[id] = newSym;
        setCachedSymptoms(syms);

        var cloudOk = await saveSymptomToCloud(newSym);
        await logHistory(isEdit ? 'edit' : 'add', 'symptom', id, en, newSym);

        var _smsg = {ur:'✅ محفوظ',en:'✅ Saved',roman:'✅ Mehfooz'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'✅ Saved';
        msgDiv.innerHTML = '<div class="alert alert-success">' + _smsg + (cloudOk ? ' ☁️' : ' (offline)') + '</div>';
        if (typeof showToast === 'function') showToast('✅ ' + en);

        if (document.querySelector('#page-diagnosis.active') && typeof renderSymptomsGrid === 'function') {
            renderSymptomsGrid();
        }

        setTimeout(window.closeAddSymptomModal, 1200);
    };

    window.deleteCustomSymptom = function(symId) {
        var syms = getCachedSymptoms();
        var name = syms[symId] ? syms[symId].en : symId;

        if (typeof showConfirm !== 'function') {
            if (!confirm('Delete symptom "' + name + '"?')) return;
            doDeleteSymptom(symId);
            return;
        }
        showConfirm('Delete symptom <b>' + name + '</b>?', function() { doDeleteSymptom(symId); });
    };

    async function doDeleteSymptom(symId) {
        var syms = getCachedSymptoms();
        var name = syms[symId] ? syms[symId].en : symId;
        delete syms[symId];
        setCachedSymptoms(syms);
        delete window.SYMPTOMS_DB[symId];

        var sb = getSupabase();
        if (sb && navigator.onLine) {
            try { await sb.from('custom_symptoms').delete().eq('id', symId); }
            catch(e) { addPendingOp({ action: 'delete_symptom', data: { id: symId } }); }
        } else {
            addPendingOp({ action: 'delete_symptom', data: { id: symId } });
        }

        await logHistory('delete', 'symptom', symId, name);
        if (typeof showToast === 'function') showToast('🗑️ Deleted');
        window.viewCustomData();
        if (document.querySelector('#page-diagnosis.active') && typeof renderSymptomsGrid === 'function') {
            renderSymptomsGrid();
        }
    }

    // ==========================================
    // DISEASE OPERATIONS
    // ==========================================
    async function saveDiseaseToCloud(disData) {
        var sb = getSupabase();
        var dbData = {
            id: disData.id, name_ur: disData.name.ur, name_en: disData.name.en,
            name_roman: disData.name.roman, icon: disData.icon || '💊',
            category: disData.category, symptoms: disData.symptoms || [],
            key_symptoms: disData.keySymptoms || [], tests: disData.tests || [],
            red_flags: disData.redFlags || [], remedies: disData.remedies || [],
            advice_ur: (disData.advice && disData.advice.ur) || '',
            advice_en: (disData.advice && disData.advice.en) || '',
            promoted: disData.promoted || false,
            created_by: (window.currentUserData ? window.currentUserData.name : 'Unknown')
        };

        if (sb && navigator.onLine) {
            try {
                await sb.from('custom_diseases').upsert([dbData]);
                return true;
            } catch(e) {
                addPendingOp({ action: 'save_disease', data: dbData });
                return false;
            }
        } else {
            addPendingOp({ action: 'save_disease', data: dbData });
            return false;
        }
    }

    window.openAddDiseaseModal = function(editId) {
        var modal = document.getElementById('addDiseaseModal');
        if (!modal) return;

        var isEdit = !!editId;
        var diseases = getCachedDiseases();
        var dis = isEdit ? diseases.find(function(d) { return d.id === editId; }) : null;

        document.getElementById('editDiseaseOldId').value = isEdit ? editId : '';
        document.getElementById('newDiseaseId').value = isEdit ? editId : '';
        document.getElementById('newDiseaseUr').value = isEdit && dis ? dis.name.ur : '';
        document.getElementById('newDiseaseEn').value = isEdit && dis ? dis.name.en : '';
        document.getElementById('newDiseaseRoman').value = isEdit && dis ? dis.name.roman : '';
        document.getElementById('newDiseaseIcon').value = isEdit && dis && dis.icon ? dis.icon : '💊';
        document.getElementById('newDiseaseSymptoms').value = isEdit && dis ? (dis.symptoms || []).join(', ') : '';
        document.getElementById('newDiseaseKeySymptoms').value = isEdit && dis ? (dis.keySymptoms || []).join(', ') : '';
        document.getElementById('newDiseaseTests').value = isEdit && dis ? (dis.tests || []).map(function(t) { return t.en || t.ur || ''; }).join('\n') : '';
        document.getElementById('newDiseaseRedFlags').value = isEdit && dis ? (dis.redFlags || []).join(', ') : '';
        document.getElementById('newDiseaseRemedies').value = isEdit && dis ? (dis.remedies || []).map(function(r) {
            return r.name + ' | ' + (r.use.en || r.use.ur || '') + ' | ' + (r.dose || '');
        }).join('\n') : '';
        document.getElementById('newDiseaseAdviceUr').value = isEdit && dis && dis.advice ? dis.advice.ur : '';
        document.getElementById('newDiseaseAdviceEn').value = isEdit && dis && dis.advice ? dis.advice.en : '';

        var idField = document.getElementById('newDiseaseId');
        if (isEdit) {
            idField.readOnly = true;
            idField.style.background = '#ecf0f1';
        } else {
            idField.readOnly = false;
            idField.style.background = '';
        }

        var catSelect = document.getElementById('newDiseaseCategory');
        catSelect.innerHTML = '';
        Object.keys(window.CATEGORIES_DB).forEach(function(k) {
            if (k === 'all') return;
            var opt = document.createElement('option');
            opt.value = k;
            opt.textContent = window.CATEGORIES_DB[k].icon + ' ' + window.CATEGORIES_DB[k].en;
            if (isEdit && dis && dis.category === k) opt.selected = true;
            else if (!isEdit && k === 'general') opt.selected = true;
            catSelect.appendChild(opt);
        });

        document.getElementById('addDiseaseMsg').innerHTML = '';
        var titleEl = document.getElementById('addDiseaseTitle');
        var _lang = (typeof getCurrentLang === 'function' ? getCurrentLang() : (localStorage.getItem('clinic_lang') || 'ur'));
        var _disTitles = { ur: ['✏️ بیماری ترمیم', '➕ بیماری شامل کریں'], en: ['✏️ Edit Disease', '➕ Add Disease'], roman: ['✏️ Bimari Tarmeemi', '➕ Bimari Shamil Karein'] };
        if (titleEl) titleEl.textContent = isEdit ? (_disTitles[_lang]||_disTitles.en)[0] : (_disTitles[_lang]||_disTitles.en)[1];

        renderIconPicker('diseaseIconPickerContainer', 'newDiseaseIcon', isEdit && dis && dis.icon ? dis.icon : '💊');

        modal.classList.add('active');
    };

    window.closeAddDiseaseModal = function() {
        var m = document.getElementById('addDiseaseModal');
        if (m) m.classList.remove('active');
    };

    window.saveNewDisease = async function() {
        var oldId = document.getElementById('editDiseaseOldId').value;
        var isEdit = !!oldId;
        var id = document.getElementById('newDiseaseId').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        var ur = document.getElementById('newDiseaseUr').value.trim();
        var en = document.getElementById('newDiseaseEn').value.trim();
        var roman = document.getElementById('newDiseaseRoman').value.trim();
        var icon = document.getElementById('newDiseaseIcon').value.trim() || '💊';
        var category = document.getElementById('newDiseaseCategory').value;
        var symptomsStr = document.getElementById('newDiseaseSymptoms').value.trim();
        var keySymptomsStr = document.getElementById('newDiseaseKeySymptoms').value.trim();
        var testsStr = document.getElementById('newDiseaseTests').value.trim();
        var redFlagsStr = document.getElementById('newDiseaseRedFlags').value.trim();
        var remediesStr = document.getElementById('newDiseaseRemedies').value.trim();
        var adviceUr = document.getElementById('newDiseaseAdviceUr').value.trim();
        var adviceEn = document.getElementById('newDiseaseAdviceEn').value.trim();
        var msgDiv = document.getElementById('addDiseaseMsg');

        if (!id || !ur || !en) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID, اردو اور انگلش لازمی</div>'; return; }

        var symptoms = symptomsStr ? symptomsStr.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
        var keySymptoms = keySymptomsStr ? keySymptomsStr.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];
        var redFlags = redFlagsStr ? redFlagsStr.split(',').map(function(s) { return s.trim(); }).filter(Boolean) : [];

        var tests = [];
        if (testsStr) {
            testsStr.split('\n').forEach(function(line) {
                line = line.trim();
                if (line) tests.push({ ur: line, en: line });
            });
        }

        var remedies = [];
        if (remediesStr) {
            remediesStr.split('\n').forEach(function(line) {
                line = line.trim();
                if (!line) return;
                var parts = line.split('|').map(function(p) { return p.trim(); });
                remedies.push({
                    name: parts[0] || '',
                    use: { ur: parts[1] || '', en: parts[1] || '' },
                    dose: parts[2] || ''
                });
            });
        }

        var diseases = getCachedDiseases();
        var existing = diseases.find(function(d) { return d.id === id; });

        if (!isEdit && existing) {
            msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID موجود</div>';
            return;
        }

        var newDisease = {
            id: id, name: { ur: ur, en: en, roman: roman || en },
            icon: icon, category: category,
            symptoms: symptoms, keySymptoms: keySymptoms,
            tests: tests, redFlags: redFlags, remedies: remedies,
            advice: { ur: adviceUr, en: adviceEn },
            promoted: existing ? existing.promoted : false
        };

        var globalIdx = window.DISEASES_DB.findIndex(function(d) { return d.id === id; });
        if (globalIdx >= 0) window.DISEASES_DB[globalIdx] = newDisease;
        else window.DISEASES_DB.push(newDisease);

        var cIdx = diseases.findIndex(function(d) { return d.id === id; });
        if (cIdx >= 0) diseases[cIdx] = newDisease;
        else diseases.push(newDisease);
        setCachedDiseases(diseases);

        var cloudOk = await saveDiseaseToCloud(newDisease);
        await logHistory(isEdit ? 'edit' : 'add', 'disease', id, en, newDisease);

        var _smsg = {ur:'✅ محفوظ',en:'✅ Saved',roman:'✅ Mehfooz'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'✅ Saved';
        msgDiv.innerHTML = '<div class="alert alert-success">' + _smsg + (cloudOk ? ' ☁️' : ' (offline)') + '</div>';
        if (typeof showToast === 'function') showToast('✅ ' + en);

        setTimeout(window.closeAddDiseaseModal, 1200);
    };

    window.deleteCustomDisease = function(disId) {
        var diseases = getCachedDiseases();
        var dis = diseases.find(function(d) { return d.id === disId; });
        var name = dis ? dis.name.en : disId;

        if (typeof showConfirm !== 'function') {
            if (!confirm('Delete disease "' + name + '"?')) return;
            doDeleteDisease(disId);
            return;
        }
        showConfirm('Delete disease <b>' + name + '</b>?', function() { doDeleteDisease(disId); });
    };

    async function doDeleteDisease(disId) {
        var diseases = getCachedDiseases();
        var dis = diseases.find(function(d) { return d.id === disId; });
        var name = dis ? dis.name.en : disId;

        diseases = diseases.filter(function(d) { return d.id !== disId; });
        setCachedDiseases(diseases);
        window.DISEASES_DB = window.DISEASES_DB.filter(function(d) { return d.id !== disId; });

        var sb = getSupabase();
        if (sb && navigator.onLine) {
            try { await sb.from('custom_diseases').delete().eq('id', disId); }
            catch(e) { addPendingOp({ action: 'delete_disease', data: { id: disId } }); }
        } else {
            addPendingOp({ action: 'delete_disease', data: { id: disId } });
        }

        await logHistory('delete', 'disease', disId, name);
        if (typeof showToast === 'function') showToast('🗑️ Deleted');
        window.viewCustomData();
    }

    // ==========================================
    // VIEW CUSTOM DATA
    // ==========================================
    window.viewCustomData = function() {
        var modal = document.getElementById('viewCustomModal');
        if (!modal) return;

        var cats = getCachedCategories();
        var syms = getCachedSymptoms();
        var dis = getCachedDiseases();
        var esc = typeof escapeHtml === 'function' ? escapeHtml : function(t) {
            return (t || '').toString().replace(/[<>&"']/g, function(c) {
                return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c];
            });
        };

        var catPromoted = Object.values(cats).filter(function(c) { return c.promoted; }).length;
        var catUnpromoted = Object.keys(cats).length - catPromoted;
        var symPromoted = Object.values(syms).filter(function(s) { return s.promoted; }).length;
        var symUnpromoted = Object.keys(syms).length - symPromoted;
        var disPromoted = dis.filter(function(d) { return d.promoted; }).length;
        var disUnpromoted = dis.length - disPromoted;

        var html = '';

        html += '<div style="background:#fff3cd;padding:8px 12px;border-radius:6px;margin-bottom:12px;font-size:12px;color:#856404;">';
        html += '💡 <strong>Legend:</strong> 🆕 = New (backup میں شامل) | ✅ = Promoted (GitHub پر)';
        html += '</div>';

        // Categories
        html += '<h4 style="color:#8e44ad;margin:10px 0 8px;">🏷️ Categories (' + Object.keys(cats).length + ')';
        if (catPromoted > 0) html += ' <small style="color:#27ae60;">✅ ' + catPromoted + '</small>';
        if (catUnpromoted > 0) html += ' <small style="color:#f39c12;">🆕 ' + catUnpromoted + '</small>';
        html += '</h4>';
        if (Object.keys(cats).length === 0) {
            html += '<p style="color:#95a5a6;font-size:13px;">کوئی نہیں</p>';
        } else {
            html += '<div style="max-height:180px;overflow-y:auto;background:#f8f9fa;padding:8px;border-radius:6px;margin-bottom:12px;">';
            Object.keys(cats).forEach(function(k) {
                var c = cats[k];
                var badge = c.promoted ? '<span style="background:#27ae60;color:white;padding:2px 6px;border-radius:8px;font-size:10px;">✅</span>' : '<span style="background:#f39c12;color:white;padding:2px 6px;border-radius:8px;font-size:10px;">🆕</span>';
                html += '<div style="padding:6px 8px;border-bottom:1px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center;font-size:13px;gap:8px;">';
                html += '<span style="flex:1;">' + c.icon + ' <strong>' + esc(c.ur) + '</strong> / ' + esc(c.en) + ' ' + badge + '</span>';
                html += '<span style="display:flex;gap:3px;">';
                if (!c.promoted) {
                    html += '<button class="btn btn-success btn-xs" onclick="promoteItem(\'category\',\'' + k + '\')">✅</button>';
                } else {
                    html += '<button class="btn btn-warning btn-xs" onclick="unpromoteItem(\'category\',\'' + k + '\')">↩️</button>';
                }
                html += '<button class="btn btn-edit btn-xs" onclick="openAddCategoryModal(\'' + k + '\')">✏️</button>';
                html += '<button class="btn btn-danger btn-xs" onclick="deleteCustomCategory(\'' + k + '\')">🗑️</button>';
                html += '</span></div>';
            });
            html += '</div>';
        }

        // Symptoms
        html += '<h4 style="color:#17a2b8;margin:10px 0 8px;">💡 Symptoms (' + Object.keys(syms).length + ')';
        if (symPromoted > 0) html += ' <small style="color:#27ae60;">✅ ' + symPromoted + '</small>';
        if (symUnpromoted > 0) html += ' <small style="color:#f39c12;">🆕 ' + symUnpromoted + '</small>';
        html += '</h4>';
        if (Object.keys(syms).length === 0) {
            html += '<p style="color:#95a5a6;font-size:13px;">کوئی نہیں</p>';
        } else {
            html += '<div style="max-height:180px;overflow-y:auto;background:#f8f9fa;padding:8px;border-radius:6px;margin-bottom:12px;">';
            Object.keys(syms).forEach(function(k) {
                var s = syms[k];
                var badge = s.promoted ? '<span style="background:#27ae60;color:white;padding:2px 6px;border-radius:8px;font-size:10px;">✅</span>' : '<span style="background:#f39c12;color:white;padding:2px 6px;border-radius:8px;font-size:10px;">🆕</span>';
                html += '<div style="padding:6px 8px;border-bottom:1px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center;font-size:13px;gap:8px;">';
                html += '<span style="flex:1;">' + (s.severe ? '⚠️' : '•') + ' <strong>' + esc(s.ur) + '</strong> / ' + esc(s.en) + ' ' + badge + '</span>';
                html += '<span style="display:flex;gap:3px;">';
                if (!s.promoted) {
                    html += '<button class="btn btn-success btn-xs" onclick="promoteItem(\'symptom\',\'' + k + '\')">✅</button>';
                } else {
                    html += '<button class="btn btn-warning btn-xs" onclick="unpromoteItem(\'symptom\',\'' + k + '\')">↩️</button>';
                }
                html += '<button class="btn btn-edit btn-xs" onclick="openAddSymptomModal(\'' + k + '\')">✏️</button>';
                html += '<button class="btn btn-danger btn-xs" onclick="deleteCustomSymptom(\'' + k + '\')">🗑️</button>';
                html += '</span></div>';
            });
            html += '</div>';
        }

        // Diseases
        html += '<h4 style="color:#27ae60;margin:10px 0 8px;">🔬 Diseases (' + dis.length + ')';
        if (disPromoted > 0) html += ' <small style="color:#27ae60;">✅ ' + disPromoted + '</small>';
        if (disUnpromoted > 0) html += ' <small style="color:#f39c12;">🆕 ' + disUnpromoted + '</small>';
        html += '</h4>';
        if (dis.length === 0) {
            html += '<p style="color:#95a5a6;font-size:13px;">کوئی نہیں</p>';
        } else {
            html += '<div style="max-height:180px;overflow-y:auto;background:#f8f9fa;padding:8px;border-radius:6px;margin-bottom:12px;">';
            dis.forEach(function(d) {
                var dIcon = d.icon || '💊';
                var badge = d.promoted ? '<span style="background:#27ae60;color:white;padding:2px 6px;border-radius:8px;font-size:10px;">✅</span>' : '<span style="background:#f39c12;color:white;padding:2px 6px;border-radius:8px;font-size:10px;">🆕</span>';
                html += '<div style="padding:6px 8px;border-bottom:1px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center;font-size:13px;gap:8px;">';
                html += '<span style="flex:1;">' + dIcon + ' <strong>' + esc(d.name.ur) + '</strong> / ' + esc(d.name.en) + ' ' + badge + '</span>';
                html += '<span style="display:flex;gap:3px;">';
                if (!d.promoted) {
                    html += '<button class="btn btn-success btn-xs" onclick="promoteItem(\'disease\',\'' + d.id + '\')">✅</button>';
                } else {
                    html += '<button class="btn btn-warning btn-xs" onclick="unpromoteItem(\'disease\',\'' + d.id + '\')">↩️</button>';
                }
                html += '<button class="btn btn-edit btn-xs" onclick="openAddDiseaseModal(\'' + d.id + '\')">✏️</button>';
                html += '<button class="btn btn-danger btn-xs" onclick="deleteCustomDisease(\'' + d.id + '\')">🗑️</button>';
                html += '</span></div>';
            });
            html += '</div>';
        }

        html += '<div style="margin-top:12px;padding:10px;background:#d1ecf1;border-radius:6px;font-size:12px;">';
        html += '📊 <strong>Total:</strong> Categories: ' + Object.keys(window.CATEGORIES_DB).length;
        html += ' | Symptoms: ' + Object.keys(window.SYMPTOMS_DB).length;
        html += ' | Diseases: ' + window.DISEASES_DB.length;
        html += '</div>';

        var totalPromoted = catPromoted + symPromoted + disPromoted;
        if (totalPromoted >= 5) {
            html += '<div style="margin-top:10px;padding:10px;background:#fff3cd;border-radius:6px;font-size:12px;">';
            html += '💡 ' + totalPromoted + ' promoted items ہیں۔ ';
            html += '<button class="btn btn-warning btn-xs" onclick="cleanupPromoted()">🧹 Cleanup</button>';
            html += '</div>';
        }

        document.getElementById('customDataContent').innerHTML = html;
        modal.classList.add('active');
    };

    window.closeViewCustomModal = function() {
        var m = document.getElementById('viewCustomModal');
        if (m) m.classList.remove('active');
    };

    // ==========================================
    // PROMOTE/UNPROMOTE
    // ==========================================
    window.promoteItem = async function(type, id) {
        var msg = 'کیا آپ نے یہ GitHub پر add کر دی ہے؟<br><b>' + id + '</b>';

        if (typeof showConfirm !== 'function') {
            if (!confirm('Mark "' + id + '" as promoted?')) return;
            await doPromote(type, id, true);
            return;
        }
        showConfirm(msg, function() { doPromote(type, id, true); });
    };

    window.unpromoteItem = async function(type, id) {
        if (typeof showConfirm !== 'function') {
            if (!confirm('Unpromote?')) return;
            await doPromote(type, id, false);
            return;
        }
        showConfirm('Unpromote "' + id + '"?', function() { doPromote(type, id, false); });
    };

    async function doPromote(type, id, promoted) {
        var sb = getSupabase();
        var table = type === 'category' ? 'custom_categories' : type === 'symptom' ? 'custom_symptoms' : 'custom_diseases';

        if (type === 'category') {
            var cats = getCachedCategories();
            if (cats[id]) {
                cats[id].promoted = promoted;
                if (promoted) cats[id].promoted_at = new Date().toISOString();
                setCachedCategories(cats);
            }
        } else if (type === 'symptom') {
            var syms = getCachedSymptoms();
            if (syms[id]) {
                syms[id].promoted = promoted;
                if (promoted) syms[id].promoted_at = new Date().toISOString();
                setCachedSymptoms(syms);
            }
        } else {
            var diseases = getCachedDiseases();
            var idx = diseases.findIndex(function(d) { return d.id === id; });
            if (idx >= 0) {
                diseases[idx].promoted = promoted;
                if (promoted) diseases[idx].promoted_at = new Date().toISOString();
                setCachedDiseases(diseases);
            }
        }

        if (sb && navigator.onLine) {
            try {
                var updateData = { promoted: promoted };
                if (promoted) updateData.promoted_at = new Date().toISOString();
                else updateData.promoted_at = null;
                await sb.from(table).update(updateData).eq('id', id);
            } catch(e) {
                addPendingOp({ action: 'promote', data: { table: table, id: id, promoted: promoted } });
            }
        } else {
            addPendingOp({ action: 'promote', data: { table: table, id: id, promoted: promoted } });
        }

        await logHistory(promoted ? 'promote' : 'unpromote', type, id, id);
        if (typeof showToast === 'function') showToast(promoted ? ({ur:'✅ پروموٹ ہو گیا',en:'✅ Promoted',roman:'✅ Promote ho gaya'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'✅ Promoted') : ({ur:'↩️ واپس',en:'↩️ Unpromoted',roman:'↩️ Wapas'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'↩️ Unpromoted'));
        window.viewCustomData();
    }

    // ==========================================
    // BACKUP FUNCTIONS
    // ==========================================
    window.exportCustomData = function() {
        var data = {
            type: 'full_backup',
            categories: getCachedCategories(),
            symptoms: getCachedSymptoms(),
            diseases: getCachedDiseases(),
            exportDate: new Date().toISOString(),
            appVersion: '4.0'
        };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'bhc-full-backup-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
        if (typeof showToast === 'function') showToast({ur:'✅ مکمل بیک اپ!',en:'✅ Full backup!',roman:'✅ Mukammal backup!'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'✅ Full backup!');
    };

    window.exportOnlyNew = function() {
        var allCats = getCachedCategories();
        var allSyms = getCachedSymptoms();
        var allDis = getCachedDiseases();

        var newCats = {};
        var newSyms = {};
        var newDis = [];

        Object.keys(allCats).forEach(function(k) { if (!allCats[k].promoted) newCats[k] = allCats[k]; });
        Object.keys(allSyms).forEach(function(k) { if (!allSyms[k].promoted) newSyms[k] = allSyms[k]; });
        allDis.forEach(function(d) { if (!d.promoted) newDis.push(d); });

        var total = Object.keys(newCats).length + Object.keys(newSyms).length + newDis.length;

        if (total === 0) {
            if (typeof showToast === 'function') showToast({ur:'⚠️ کوئی نئی چیز نہیں',en:'⚠️ No new items',roman:'⚠️ Koi nayi cheez nahi'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'⚠️ No new items', 'error');
            return;
        }

        var data = {
            type: 'new_only_backup',
            categories: newCats, symptoms: newSyms, diseases: newDis,
            exportDate: new Date().toISOString(), appVersion: '4.0'
        };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'bhc-new-only-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
        if (typeof showToast === 'function') showToast('✅ ' + total + ' items');
    };

    window.exportForGitHub = function() {
        var allCats = getCachedCategories();
        var allSyms = getCachedSymptoms();
        var allDis = getCachedDiseases();

        var newCats = {};
        var newSyms = {};
        var newDis = [];

        Object.keys(allCats).forEach(function(k) { if (!allCats[k].promoted) newCats[k] = allCats[k]; });
        Object.keys(allSyms).forEach(function(k) { if (!allSyms[k].promoted) newSyms[k] = allSyms[k]; });
        allDis.forEach(function(d) { if (!d.promoted) newDis.push(d); });

        var total = Object.keys(newCats).length + Object.keys(newSyms).length + newDis.length;

        if (total === 0) {
            if (typeof showToast === 'function') showToast('⚠️ No new items', 'error');
            return;
        }

        var code = '// GitHub Export - ' + new Date().toISOString().split('T')[0] + '\n';
        code += '// ' + total + ' new items ready to paste\n\n';

        if (Object.keys(newCats).length > 0) {
            code += '// ===== NEW CATEGORIES =====\n';
            Object.keys(newCats).forEach(function(k) {
                var c = newCats[k];
                code += '    ' + k + ': { ur: ' + JSON.stringify(c.ur) + ', en: ' + JSON.stringify(c.en) + ', roman: ' + JSON.stringify(c.roman) + ', icon: ' + JSON.stringify(c.icon) + ' },\n';
            });
            code += '\n\n';
        }

        if (Object.keys(newSyms).length > 0) {
            code += '// ===== NEW SYMPTOMS =====\n';
            Object.keys(newSyms).forEach(function(k) {
                var s = newSyms[k];
                code += '    ' + k + ': { ur: ' + JSON.stringify(s.ur) + ', en: ' + JSON.stringify(s.en) + ', roman: ' + JSON.stringify(s.roman) + ', category: ' + JSON.stringify(s.category);
                if (s.severe) code += ', severe: true';
                code += ' },\n';
            });
            code += '\n\n';
        }

        if (newDis.length > 0) {
            code += '// ===== NEW DISEASES =====\n';
            newDis.forEach(function(d) {
                code += '    {\n';
                code += '        id: ' + JSON.stringify(d.id) + ',\n';
                code += '        name: { ur: ' + JSON.stringify(d.name.ur) + ', en: ' + JSON.stringify(d.name.en) + ', roman: ' + JSON.stringify(d.name.roman) + ' },\n';
                if (d.icon) code += '        icon: ' + JSON.stringify(d.icon) + ',\n';
                code += '        category: ' + JSON.stringify(d.category) + ',\n';
                code += '        symptoms: ' + JSON.stringify(d.symptoms || []) + ',\n';
                code += '        keySymptoms: ' + JSON.stringify(d.keySymptoms || []) + ',\n';
                code += '        tests: ' + JSON.stringify(d.tests || []) + ',\n';
                code += '        redFlags: ' + JSON.stringify(d.redFlags || []) + ',\n';
                code += '        remedies: ' + JSON.stringify(d.remedies || []) + ',\n';
                code += '        advice: { ur: ' + JSON.stringify((d.advice && d.advice.ur) || '') + ', en: ' + JSON.stringify((d.advice && d.advice.en) || '') + ' }\n';
                code += '    },\n';
            });
        }

        var blob = new Blob([code], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'github-export-' + new Date().toISOString().split('T')[0] + '.txt';
        a.click();
        URL.revokeObjectURL(url);

        if (typeof showToast === 'function') showToast('✅ GitHub export: ' + total + ' items');
    };

    // ==========================================
    // IMPORT
    // ==========================================
    window.smartImport = function() {
        var input = document.getElementById('importCustomFile');
        if (input) input.click();
    };

    async function handleImportJSON(content) {
        try {
            var data = JSON.parse(content);
            var added = 0;

            if (data.categories) {
                var ec = getCachedCategories();
                for (var k in data.categories) {
                    ec[k] = data.categories[k];
                    added++;
                    await saveCategoryToCloud(data.categories[k]);
                }
                setCachedCategories(ec);
            }
            if (data.symptoms) {
                var es = getCachedSymptoms();
                for (var k in data.symptoms) {
                    es[k] = data.symptoms[k];
                    added++;
                    await saveSymptomToCloud(data.symptoms[k]);
                }
                setCachedSymptoms(es);
            }
            if (data.diseases && Array.isArray(data.diseases)) {
                var ed = getCachedDiseases();
                for (var i = 0; i < data.diseases.length; i++) {
                    var d = data.diseases[i];
                    var existing = ed.findIndex(function(x) { return x.id === d.id; });
                    if (existing >= 0) ed[existing] = d;
                    else ed.push(d);
                    added++;
                    await saveDiseaseToCloud(d);
                }
                setCachedDiseases(ed);
            }

            mergeIntoGlobalDBs();
            if (typeof showToast === 'function') showToast('✅ Imported ' + added + ' items');
        } catch(err) {
            if (typeof showToast === 'function') showToast('❌ Error: ' + err.message, 'error');
        }
    }

    async function handleImportCSV(content) {
        try {
            var lines = content.split(/\r?\n/);
            if (lines.length < 2) return;

            var headers = lines[0].split(',').map(function(h) { return h.trim().toLowerCase().replace(/^"|"$/g, ''); });
            var added = 0;

            for (var i = 1; i < lines.length; i++) {
                var line = lines[i].trim();
                if (!line) continue;

                var values = line.split(',').map(function(v) { return v.trim().replace(/^"|"$/g, ''); });
                var row = {};
                headers.forEach(function(h, idx) { row[h] = values[idx] || ''; });

                if (row.type === 'category' && row.id && row.ur && row.en) {
                    var catData = {
                        id: row.id, ur: row.ur, en: row.en,
                        roman: row.roman || row.en, icon: row.icon || '📌', promoted: false
                    };
                    var cats = getCachedCategories();
                    cats[row.id] = catData;
                    setCachedCategories(cats);
                    await saveCategoryToCloud(catData);
                    added++;
                } else if (row.type === 'symptom' && row.id && row.ur && row.en) {
                    var symData = {
                        id: row.id, ur: row.ur, en: row.en,
                        roman: row.roman || row.en, category: row.category || 'general',
                        severe: (row.severe === 'true'), promoted: false
                    };
                    var syms = getCachedSymptoms();
                    syms[row.id] = symData;
                    setCachedSymptoms(syms);
                    await saveSymptomToCloud(symData);
                    added++;
                }
            }

            mergeIntoGlobalDBs();
            if (typeof showToast === 'function') showToast('✅ CSV: ' + added + ' items');
        } catch(err) {
            if (typeof showToast === 'function') showToast('❌ Error: ' + err.message, 'error');
        }
    }

    function attachImportHandler() {
        var input = document.getElementById('importCustomFile');
        if (!input) {
            setTimeout(attachImportHandler, 500);
            return;
        }

        var newInput = input.cloneNode(true);
        input.parentNode.replaceChild(newInput, input);

        newInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var fileName = file.name.toLowerCase();
            var reader = new FileReader();

            reader.onload = function(ev) {
                var content = ev.target.result;
                var trimmed = content.trim();
                var looksLikeJSON = (trimmed.charAt(0) === '{' || trimmed.charAt(0) === '[');

                if (fileName.endsWith('.json') || looksLikeJSON) {
                    handleImportJSON(content);
                } else if (fileName.endsWith('.csv')) {
                    handleImportCSV(content);
                }
                newInput.value = '';
            };
            reader.readAsText(file);
        });

        console.log('✅ Import handler attached');
    }

    // ==========================================
    // CLEANUP
    // ==========================================
    window.cleanupPromoted = function() {
        var cats = getCachedCategories();
        var syms = getCachedSymptoms();
        var dis = getCachedDiseases();

        var promotedCats = Object.keys(cats).filter(function(k) { return cats[k].promoted; });
        var promotedSyms = Object.keys(syms).filter(function(k) { return syms[k].promoted; });
        var promotedDis = dis.filter(function(d) { return d.promoted; });

        var total = promotedCats.length + promotedSyms.length + promotedDis.length;

        if (total === 0) {
            if (typeof showToast === 'function') showToast({ur:'✅ صفائی کی ضرورت نہیں',en:'✅ Nothing to cleanup',roman:'✅ Safai ki zaroorat nahi'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'✅ Nothing to cleanup');
            return;
        }

        var msg = '⚠️ Delete ' + total + ' promoted items?';

        if (typeof showConfirm !== 'function') {
            if (!confirm(msg)) return;
            doCleanup(promotedCats, promotedSyms, promotedDis);
            return;
        }
        showConfirm(msg, function() { doCleanup(promotedCats, promotedSyms, promotedDis); });
    };

    async function doCleanup(promotedCats, promotedSyms, promotedDis) {
        var sb = getSupabase();
        var deleted = 0;

        var cats = getCachedCategories();
        for (var i = 0; i < promotedCats.length; i++) {
            delete cats[promotedCats[i]];
            deleted++;
            if (sb && navigator.onLine) {
                try { await sb.from('custom_categories').delete().eq('id', promotedCats[i]); } catch(e) {}
            }
        }
        setCachedCategories(cats);

        var syms = getCachedSymptoms();
        for (var i = 0; i < promotedSyms.length; i++) {
            delete syms[promotedSyms[i]];
            deleted++;
            if (sb && navigator.onLine) {
                try { await sb.from('custom_symptoms').delete().eq('id', promotedSyms[i]); } catch(e) {}
            }
        }
        setCachedSymptoms(syms);

        var dis = getCachedDiseases();
        for (var i = 0; i < promotedDis.length; i++) {
            dis = dis.filter(function(x) { return x.id !== promotedDis[i].id; });
            deleted++;
            if (sb && navigator.onLine) {
                try { await sb.from('custom_diseases').delete().eq('id', promotedDis[i].id); } catch(e) {}
            }
        }
        setCachedDiseases(dis);

        await logHistory('cleanup', 'batch', 'promoted', 'Cleanup', { count: deleted });
        if (typeof showToast === 'function') showToast('🧹 Cleaned ' + deleted);
        window.viewCustomData();
    }

    // ==========================================
    // MIGRATION WIZARD
    // ==========================================
    window.migrationWizard = function() {
        var cats = getCachedCategories();
        var syms = getCachedSymptoms();
        var dis = getCachedDiseases();

        var unpCats = Object.keys(cats).filter(function(k) { return !cats[k].promoted; }).length;
        var unpSyms = Object.keys(syms).filter(function(k) { return !syms[k].promoted; }).length;
        var unpDis = dis.filter(function(d) { return !d.promoted; }).length;
        var total = unpCats + unpSyms + unpDis;

        if (total === 0) {
            if (typeof showToast === 'function') showToast({ur:'✅ سب پروموٹ ہو چکا!',en:'✅ Everything promoted!',roman:'✅ Sab promote ho chuka!'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'✅ Everything promoted!');
            return;
        }

        var msg = '🚀 <b>Migration Wizard</b><br><br>';
        msg += 'New items: ' + total + '<br>';
        msg += '• Categories: ' + unpCats + '<br>';
        msg += '• Symptoms: ' + unpSyms + '<br>';
        msg += '• Diseases: ' + unpDis + '<br><br>';
        msg += 'Export file بنائیں؟';

        if (typeof showConfirm !== 'function') {
            if (!confirm('Start migration? Export ' + total + ' items?')) return;
            window.exportForGitHub();
            return;
        }
        showConfirm(msg, function() {
            window.exportForGitHub();
        });
    };

    // ==========================================
    // HISTORY VIEWER
    // ==========================================
    window.viewHistory = function() {
        var modal = document.getElementById('viewCustomModal');
        if (!modal) return;

        var history = JSON.parse(localStorage.getItem('custom_history_log') || '[]');
        var esc = typeof escapeHtml === 'function' ? escapeHtml : function(t) { return t || ''; };

        var html = '<h4 style="color:#34495e;margin-bottom:10px;">📚 History Log (' + history.length + ')</h4>';

        if (history.length === 0) {
            html += '<p style="color:#95a5a6;">No history yet</p>';
        } else {
            html += '<div style="max-height:400px;overflow-y:auto;background:#f8f9fa;padding:8px;border-radius:6px;">';
            history.slice(0, 100).forEach(function(h) {
                var actionIcon = h.action === 'add' ? '➕' : h.action === 'edit' ? '✏️' : h.action === 'delete' ? '🗑️' : h.action === 'promote' ? '✅' : h.action === 'unpromote' ? '↩️' : h.action === 'cleanup' ? '🧹' : '📝';
                var date = new Date(h.performed_at).toLocaleString();
                html += '<div style="padding:6px 8px;border-bottom:1px solid #ecf0f1;font-size:12px;">';
                html += actionIcon + ' <strong>' + h.action.toUpperCase() + '</strong> ';
                html += h.item_type + ': <em>' + esc(h.item_name || h.item_id) + '</em><br>';
                html += '<small style="color:#95a5a6;">' + date + ' • ' + esc(h.performed_by || 'Unknown') + '</small>';
                html += '</div>';
            });
            html += '</div>';
        }

        html += '<div class="action-buttons" style="margin-top:12px;">';
        html += '<button class="btn btn-danger btn-sm" onclick="clearHistory()">🗑️ Clear</button>';
        html += '<button class="btn btn-light btn-sm" onclick="viewCustomData()">🔙 Back</button>';
        html += '</div>';

        document.getElementById('customDataContent').innerHTML = html;
        modal.classList.add('active');
    };

    window.clearHistory = function() {
        if (typeof showConfirm !== 'function') {
            if (!confirm('Clear all history?')) return;
            localStorage.removeItem('custom_history_log');
            if (typeof showToast === 'function') showToast({ur:'🗑️ صاف ہو گیا',en:'🗑️ Cleared',roman:'🗑️ Saaf ho gaya'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'🗑️ Cleared');
            window.viewHistory();
            return;
        }
        showConfirm('Clear all history?', function() {
            localStorage.removeItem('custom_history_log');
            if (typeof showToast === 'function') showToast('🗑️ Cleared');
            window.viewHistory();
        });
    };

    // ==========================================
    // MANUAL SYNC
    // ==========================================
    window.syncCustomData = async function() {
        if (typeof showToast === 'function') showToast({ur:'🔄 سنک ہو رہا ہے...',en:'🔄 Syncing...',roman:'🔄 Sync ho raha hai...'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'🔄 Syncing...');
        var ok = await syncFromCloud();
        if (ok) {
            if (typeof showToast === 'function') showToast({ur:'✅ سنک ہو گیا',en:'✅ Synced',roman:'✅ Sync ho gaya'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'✅ Synced');
        } else {
            if (typeof showToast === 'function') showToast({ur:'⚠️ آف لائن',en:'⚠️ Offline',roman:'⚠️ Offline'}[typeof getCurrentLang==='function'?getCurrentLang():'ur']||'⚠️ Offline', 'error');
        }
    };

    // ==========================================
    // INITIALIZATION
    // ==========================================
    function initialize() {
        console.log('🚀 Initializing Custom Data Manager v4...');

        setTimeout(function() {
            syncFromCloud().then(function() {
                console.log('✅ Initial sync done');
            });
        }, 1500);

        setTimeout(attachImportHandler, 1000);

        setInterval(function() {
            if (navigator.onLine) processPendingOps();
        }, 30000);

        window.addEventListener('online', function() {
            console.log('🌐 Back online - syncing...');
            syncFromCloud();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    console.log('✅ Custom Data Manager v4 - COMPLETE');

})();