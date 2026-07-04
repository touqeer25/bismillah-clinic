// ==========================================
// Bismillah Clinic - Custom Data Manager v4
// FEATURES:
// - Supabase Cloud Sync
// - Offline Support with Auto-Sync
// - Full CRUD (Categories, Symptoms, Diseases)
// - Icon Library (for Categories + Diseases)
// - Promoted Flag System
// - Smart Backup (Full / Only New)
// - GitHub Export with Duplicate Detection
// - History Log
// - Migration Wizard
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // SUPABASE CLIENT (Use existing from index.html)
    // ==========================================
    function getSupabase() {
        if (typeof window.sb !== 'undefined') return window.sb;
        if (typeof sb !== 'undefined') return sb;
        return null;
    }

        // ==========================================
    // ICON LIBRARY (100+ icons - Complete Set)
    // ==========================================
    const ICON_LIBRARY = [
        // ===== 🏥 GENERAL MEDICAL =====
        { icon: '🏥', label: 'Hospital' },
        { icon: '🩺', label: 'Stethoscope' },
        { icon: '💊', label: 'Medicine/Pill' },
        { icon: '💉', label: 'Injection/Syringe' },
        { icon: '🧪', label: 'Lab Test Tube' },
        { icon: '🧫', label: 'Petri Dish' },
        { icon: '🔬', label: 'Microscope' },
        { icon: '🧬', label: 'DNA' },
        { icon: '⚕️', label: 'Medical Symbol' },
        { icon: '🩹', label: 'Bandage' },
        { icon: '🩼', label: 'Crutch' },
        { icon: '🦽', label: 'Wheelchair' },
        { icon: '🦯', label: 'Cane' },
        { icon: '📋', label: 'Clipboard/Chart' },
        { icon: '📝', label: 'Prescription' },
        { icon: '🏨', label: 'Clinic Building' },

        // ===== 🧠 HEAD & BRAIN =====
        { icon: '🧠', label: 'Brain' },
        { icon: '👤', label: 'Head/Person' },
        { icon: '💆', label: 'Head Massage' },
        { icon: '🤕', label: 'Head Injury' },

        // ===== 👁️ EYES =====
        { icon: '👁️', label: 'Eye' },
        { icon: '👀', label: 'Eyes' },
        { icon: '🦯', label: 'Blindness' },
        { icon: '👓', label: 'Glasses' },
        { icon: '🥽', label: 'Goggles' },

        // ===== 👂 EAR / NOSE / MOUTH =====
        { icon: '👂', label: 'Ear' },
        { icon: '🦻', label: 'Ear with Hearing Aid' },
        { icon: '👃', label: 'Nose' },
        { icon: '🤧', label: 'Sneezing' },
        { icon: '👄', label: 'Mouth/Lips' },
        { icon: '👅', label: 'Tongue' },
        { icon: '🦷', label: 'Tooth' },
        { icon: '😷', label: 'Face Mask' },

        // ===== 🫀 INNER ORGANS - VITAL =====
        { icon: '🫀', label: 'Heart (Anatomical)' },
        { icon: '❤️', label: 'Heart (Symbol)' },
        { icon: '💗', label: 'Heart (Beating)' },
        { icon: '💓', label: 'Heartbeat' },
        { icon: '🫁', label: 'Lungs' },
        { icon: '🫘', label: 'Kidney' },
        { icon: '🧠', label: 'Brain' },

        // ===== 🍽️ DIGESTIVE SYSTEM =====
        { icon: '🍽️', label: 'Digestive/Eating' },
        { icon: '🫃', label: 'Stomach/Belly' },
        { icon: '🫄', label: 'Pregnant Belly' },

        // ===== 💧 URINARY / FLUIDS =====
        { icon: '💧', label: 'Water/Urine' },
        { icon: '💦', label: 'Sweat/Fluids' },
        { icon: '🩸', label: 'Blood Drop' },
        { icon: '🧴', label: 'Lotion Bottle' },

        // ===== 🦴 BONES & JOINTS =====
        { icon: '🦴', label: 'Bone' },
        { icon: '💀', label: 'Skull' },
        { icon: '🦿', label: 'Mechanical Leg' },
        { icon: '🦾', label: 'Mechanical Arm' },

        // ===== 💪 MUSCLES & BODY =====
        { icon: '💪', label: 'Muscle/Bicep' },
        { icon: '🦵', label: 'Leg' },
        { icon: '🦶', label: 'Foot' },
        { icon: '👣', label: 'Footprints' },
        { icon: '✋', label: 'Hand' },
        { icon: '🖐️', label: 'Hand (Open)' },
        { icon: '👋', label: 'Waving Hand' },
        { icon: '🤚', label: 'Raised Hand' },
        { icon: '👐', label: 'Both Hands' },
        { icon: '🫲', label: 'Left Hand' },
        { icon: '🫱', label: 'Right Hand' },
        { icon: '💅', label: 'Nail' },
        { icon: '🧑‍🦱', label: 'Curly Hair' },
        { icon: '🧑‍🦰', label: 'Red Hair' },
        { icon: '🧑‍🦳', label: 'White Hair' },
        { icon: '🧑‍🦲', label: 'Bald' },

        // ===== 🤒 SYMPTOMS & CONDITIONS =====
        { icon: '🤒', label: 'Fever/Sick' },
        { icon: '🤕', label: 'Injured/Bandaged' },
        { icon: '🤧', label: 'Sneezing/Cold' },
        { icon: '🤢', label: 'Nausea' },
        { icon: '🤮', label: 'Vomiting' },
        { icon: '😷', label: 'Face Mask' },
        { icon: '🥴', label: 'Dizzy' },
        { icon: '😵', label: 'Unconscious' },
        { icon: '😵‍💫', label: 'Vertigo' },
        { icon: '🥵', label: 'Hot/Overheating' },
        { icon: '🥶', label: 'Cold/Freezing' },
        { icon: '😪', label: 'Sleepy' },
        { icon: '😴', label: 'Sleeping' },
        { icon: '💤', label: 'Sleep/Snore' },
        { icon: '🌡️', label: 'Temperature' },

        // ===== 🧘 MENTAL HEALTH =====
        { icon: '🧘', label: 'Meditation/Mental' },
        { icon: '😰', label: 'Anxiety/Anxious' },
        { icon: '😨', label: 'Fear/Afraid' },
        { icon: '😱', label: 'Panic/Shock' },
        { icon: '😢', label: 'Sad/Crying' },
        { icon: '😭', label: 'Loud Crying' },
        { icon: '😔', label: 'Depression' },
        { icon: '😞', label: 'Sad Face' },
        { icon: '😤', label: 'Anger/Frustration' },
        { icon: '🤯', label: 'Mind Blown' },
        { icon: '😖', label: 'Confounded' },
        { icon: '😣', label: 'Persevering' },
        { icon: '🥺', label: 'Pleading' },

        // ===== 👶 PEDIATRIC / WOMEN =====
        { icon: '👶', label: 'Baby' },
        { icon: '🧒', label: 'Child' },
        { icon: '👦', label: 'Boy' },
        { icon: '👧', label: 'Girl' },
        { icon: '👩', label: 'Woman' },
        { icon: '🤰', label: 'Pregnant Woman' },
        { icon: '🤱', label: 'Breastfeeding' },
        { icon: '👨', label: 'Man' },
        { icon: '👴', label: 'Old Man' },
        { icon: '👵', label: 'Old Woman' },

        // ===== 🚨 EMERGENCY & WARNINGS =====
        { icon: '🚨', label: 'Emergency Alert' },
        { icon: '⚠️', label: 'Warning' },
        { icon: '🆘', label: 'SOS' },
        { icon: '☠️', label: 'Danger/Skull' },
        { icon: '🔴', label: 'Red Alert' },
        { icon: '🟡', label: 'Yellow Alert' },
        { icon: '🟢', label: 'Safe/Green' },

        // ===== 🦠 INFECTIONS =====
        { icon: '🦠', label: 'Virus/Germ' },
        { icon: '🕷️', label: 'Spider (allergy)' },
        { icon: '🐛', label: 'Bug/Insect' },
        { icon: '🪱', label: 'Worm' },

        // ===== 🎗️ SPECIAL CONDITIONS =====
        { icon: '🎗️', label: 'Cancer Ribbon' },
        { icon: '🎀', label: 'Awareness Ribbon' },

        // ===== 🌿 HOMEOPATHY / HERBAL =====
        { icon: '🌿', label: 'Herbal' },
        { icon: '🍃', label: 'Leaf' },
        { icon: '🌱', label: 'Seedling/Herb' },
        { icon: '🌾', label: 'Wheat/Grain' },
        { icon: '🌻', label: 'Sunflower' },
        { icon: '🌷', label: 'Tulip' },
        { icon: '🌹', label: 'Rose' },
        { icon: '🍯', label: 'Honey' },
        { icon: '🥛', label: 'Milk' },

        // ===== ☀️ ENVIRONMENT =====
        { icon: '☀️', label: 'Sun/Day' },
        { icon: '🌙', label: 'Moon/Night' },
        { icon: '⭐', label: 'Star' },
        { icon: '🌟', label: 'Bright Star' },
        { icon: '🔥', label: 'Fire/Inflammation' },
        { icon: '❄️', label: 'Cold/Ice' },
        { icon: '☔', label: 'Rain' },
        { icon: '🌈', label: 'Rainbow' },

        // ===== 🍎 FOOD / DIET =====
        { icon: '🍎', label: 'Apple/Healthy' },
        { icon: '🥗', label: 'Salad/Diet' },
        { icon: '🍚', label: 'Rice' },
        { icon: '🥘', label: 'Food/Meal' },
        { icon: '🚫', label: 'No/Prohibited' },

        // ===== 🏃 ACTIVITY =====
        { icon: '🏃', label: 'Running/Exercise' },
        { icon: '🚶', label: 'Walking' },
        { icon: '🧘‍♂️', label: 'Yoga Man' },
        { icon: '🧘‍♀️', label: 'Yoga Woman' },
        { icon: '🏋️', label: 'Weightlifting' },
        { icon: '🚴', label: 'Cycling' },
        { icon: '🏊', label: 'Swimming' },

        // ===== 📌 MISCELLANEOUS =====
        { icon: '📌', label: 'Pin/Marker' },
        { icon: '🔖', label: 'Bookmark' },
        { icon: '📎', label: 'Attachment' },
        { icon: '🔒', label: 'Lock/Private' },
        { icon: '🔓', label: 'Unlock' },
        { icon: '⭕', label: 'Circle' },
        { icon: '✅', label: 'Check/Done' },
        { icon: '❌', label: 'Cross/Denied' },
        { icon: '❓', label: 'Question' },
        { icon: '❗', label: 'Exclamation' },
        { icon: '💯', label: '100 Percent' },
        { icon: '⚡', label: 'Energy/Fast' },
        { icon: '💫', label: 'Dizzy Star' }
    ];
    
    // ==========================================
    // LOCAL STORAGE HELPERS (Cache)
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
    // PENDING OPERATIONS (For Offline Support)
    // ==========================================
    function getPendingOps() {
        return JSON.parse(localStorage.getItem('pending_custom_ops') || '[]');
    }
    function addPendingOp(op) {
        var ops = getPendingOps();
        ops.push({ ...op, timestamp: Date.now() });
        localStorage.setItem('pending_custom_ops', JSON.stringify(ops));
    }
    function clearPendingOps() {
        localStorage.setItem('pending_custom_ops', '[]');
    }

    // ==========================================
    // HISTORY LOG (Local + Cloud)
    // ==========================================
    async function logHistory(action, itemType, itemId, itemName, details) {
        try {
            var user = 'Unknown';
            if (typeof window.currentUserData !== 'undefined' && window.currentUserData) {
                user = window.currentUserData.name || 'Unknown';
            }
            
            // Save locally
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
            // Keep only last 200
            if (history.length > 200) history = history.slice(0, 200);
            localStorage.setItem('custom_history_log', JSON.stringify(history));

            // Try to save to cloud
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
    // MERGE LOCAL + GLOBAL DBs
    // ==========================================
    function mergeIntoGlobalDBs() {
        if (!window.CATEGORIES_DB || !window.SYMPTOMS_DB || !window.DISEASES_DB) {
            console.warn('⏳ Main DBs not ready, retrying...');
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

        console.log('✅ Custom data merged: ' +
            Object.keys(cats).length + ' categories, ' +
            Object.keys(syms).length + ' symptoms, ' +
            dis.length + ' diseases');
    }

    // ==========================================
    // CLOUD SYNC: LOAD FROM SUPABASE
    // ==========================================
    async function syncFromCloud() {
        var sb = getSupabase();
        if (!sb || !navigator.onLine) {
            console.log('⚠️ Offline - Using cache');
            mergeIntoGlobalDBs();
            return false;
        }

        try {
            console.log('☁️ Syncing from cloud...');

            // Load Categories
            var catRes = await sb.from('custom_categories').select('*');
            if (catRes.data) {
                var catMap = {};
                catRes.data.forEach(function(c) {
                    catMap[c.id] = {
                        ur: c.ur,
                        en: c.en,
                        roman: c.roman,
                        icon: c.icon,
                        promoted: c.promoted,
                        created_at: c.created_at,
                        promoted_at: c.promoted_at
                    };
                });
                setCachedCategories(catMap);
            }

            // Load Symptoms
            var symRes = await sb.from('custom_symptoms').select('*');
            if (symRes.data) {
                var symMap = {};
                symRes.data.forEach(function(s) {
                    symMap[s.id] = {
                        ur: s.ur,
                        en: s.en,
                        roman: s.roman,
                        category: s.category,
                        severe: s.severe,
                        promoted: s.promoted,
                        created_at: s.created_at,
                        promoted_at: s.promoted_at
                    };
                });
                setCachedSymptoms(symMap);
            }

            // Load Diseases
            var disRes = await sb.from('custom_diseases').select('*');
            if (disRes.data) {
                var disArr = disRes.data.map(function(d) {
                    return {
                        id: d.id,
                        name: { ur: d.name_ur, en: d.name_en, roman: d.name_roman },
                        icon: d.icon,
                        category: d.category,
                        symptoms: d.symptoms || [],
                        keySymptoms: d.key_symptoms || [],
                        tests: d.tests || [],
                        redFlags: d.red_flags || [],
                        remedies: d.remedies || [],
                        advice: { ur: d.advice_ur || '', en: d.advice_en || '' },
                        promoted: d.promoted,
                        created_at: d.created_at,
                        promoted_at: d.promoted_at
                    };
                });
                setCachedDiseases(disArr);
            }

            mergeIntoGlobalDBs();

            // Process pending operations
            await processPendingOps();

            console.log('✅ Cloud sync complete');
            return true;
        } catch(e) {
            console.error('Cloud sync error:', e);
            mergeIntoGlobalDBs(); // Fall back to cache
            return false;
        }
    }

    // ==========================================
    // PROCESS PENDING OPERATIONS (Auto-Retry)
    // ==========================================
    async function processPendingOps() {
        var sb = getSupabase();
        if (!sb || !navigator.onLine) return;

        var ops = getPendingOps();
        if (ops.length === 0) return;

        console.log('🔄 Processing ' + ops.length + ' pending operations...');
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
                        promoted: true,
                        promoted_at: new Date().toISOString()
                    }).eq('id', op.data.id);
                }
                succeeded.push(i);
            } catch(e) {
                console.warn('Op failed, will retry:', op, e);
            }
        }

        // Remove succeeded ops
        var remaining = ops.filter(function(_, idx) { return succeeded.indexOf(idx) === -1; });
        localStorage.setItem('pending_custom_ops', JSON.stringify(remaining));

        if (succeeded.length > 0) {
            console.log('✅ Synced ' + succeeded.length + ' pending operations');
            if (typeof showToast === 'function') {
                showToast('✅ ' + succeeded.length + ' pending items synced');
            }
        }
    }

    // ==========================================
    // ICON PICKER RENDERER
    // ==========================================
    function renderIconPicker(containerId, hiddenInputId, selectedIcon) {
        var container = document.getElementById(containerId);
        if (!container) return;

        var html = '<div style="display:flex;flex-wrap:wrap;gap:4px;max-height:140px;overflow-y:auto;padding:6px;background:#f8f9fa;border-radius:6px;border:1px solid #ddd;">';
        ICON_LIBRARY.forEach(function(item) {
            var isSel = (item.icon === selectedIcon);
            var style = isSel
                ? 'background:#8e44ad;color:white;border:2px solid #6c3483;'
                : 'background:white;border:1px solid #ddd;';
            html += '<button type="button" onclick="selectIconForInput(\'' + hiddenInputId + '\',\'' + containerId + '\',\'' + item.icon + '\')" ' +
                'style="' + style + 'border-radius:6px;padding:6px 8px;cursor:pointer;font-size:20px;min-width:42px;text-align:center;transition:all 0.15s;" ' +
                'title="' + item.label + '">' + item.icon + '</button>';
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
    // CATEGORY: SAVE (Cloud + Local)
    // ==========================================
    async function saveCategoryToCloud(catData, isEdit) {
        var sb = getSupabase();
        var dbData = {
            id: catData.id,
            ur: catData.ur,
            en: catData.en,
            roman: catData.roman,
            icon: catData.icon,
            promoted: catData.promoted || false,
            created_by: (window.currentUserData ? window.currentUserData.name : 'Unknown')
        };

        if (sb && navigator.onLine) {
            try {
                await sb.from('custom_categories').upsert([dbData]);
                console.log('☁️ Category saved to cloud');
                return true;
            } catch(e) {
                console.error('Cloud save failed:', e);
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
        if (!modal) { console.error('Modal not found'); return; }

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
        if (titleEl) titleEl.textContent = isEdit ? '✏️ Edit Category' : '➕ Add Category';

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

        if (!id) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID لازمی ہے</div>'; return; }
        if (!ur || !en) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ اردو اور انگلش نام لازمی</div>'; return; }

        var cats = getCachedCategories();
        if (!isEdit && cats[id]) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID پہلے سے موجود</div>'; return; }

        var newCat = {
            id: id,
            ur: ur,
            en: en,
            roman: roman || en,
            icon: icon,
            promoted: cats[id] ? cats[id].promoted : false
        };

        // Save to global DB
        window.CATEGORIES_DB[id] = { ur: ur, en: en, roman: roman || en, icon: icon };

        // Save to local cache
        cats[id] = newCat;
        setCachedCategories(cats);

        // Save to cloud
        var cloudOk = await saveCategoryToCloud(newCat, isEdit);

        // Log history
        await logHistory(isEdit ? 'edit' : 'add', 'category', id, en, newCat);

        msgDiv.innerHTML = '<div class="alert alert-success">✅ محفوظ' + (cloudOk ? ' ☁️' : ' (offline - will sync)') + '</div>';
        if (typeof showToast === 'function') showToast('✅ Category: ' + en);

        if (document.querySelector('#page-diagnosis.active') && typeof renderCategoryTabs === 'function') {
            renderCategoryTabs();
        }

        setTimeout(window.closeAddCategoryModal, 1200);
    };

    window.deleteCustomCategory = function(catId) {
        var name = catId;
        var cats = getCachedCategories();
        if (cats[catId]) name = cats[catId].en;

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
            try {
                await sb.from('custom_categories').delete().eq('id', catId);
                console.log('☁️ Category deleted from cloud');
            } catch(e) {
                console.error('Cloud delete failed:', e);
                addPendingOp({ action: 'delete_category', data: { id: catId } });
            }
        } else {
            addPendingOp({ action: 'delete_category', data: { id: catId } });
        }

        await logHistory('delete', 'category', catId, name);

        if (typeof showToast === 'function') showToast('🗑️ Deleted');
        window.viewCustomData();
        if (document.querySelector('#page-diagnosis.active') && typeof renderCategoryTabs === 'function') {
            renderCategoryTabs();
        }
    }

    // ==========================================
    // SYMPTOM: SAVE (Cloud + Local)
    // ==========================================
    async function saveSymptomToCloud(symData, isEdit) {
        var sb = getSupabase();
        var dbData = {
            id: symData.id,
            ur: symData.ur,
            en: symData.en,
            roman: symData.roman,
            category: symData.category,
            severe: symData.severe || false,
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
        if (titleEl) titleEl.textContent = isEdit ? '✏️ Edit Symptom' : '➕ Add Symptom';

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

        if (!id || !ur || !en) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID, اردو اور انگلش لازمی</div>'; return; }

        var syms = getCachedSymptoms();
        if (!isEdit && syms[id]) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID پہلے سے موجود</div>'; return; }

        var newSym = {
            id: id,
            ur: ur,
            en: en,
            roman: roman || en,
            category: category,
            severe: severe,
            promoted: syms[id] ? syms[id].promoted : false
        };

        window.SYMPTOMS_DB[id] = { ur: ur, en: en, roman: roman || en, category: category };
        if (severe) window.SYMPTOMS_DB[id].severe = true;

        syms[id] = newSym;
        setCachedSymptoms(syms);

        var cloudOk = await saveSymptomToCloud(newSym, isEdit);
        await logHistory(isEdit ? 'edit' : 'add', 'symptom', id, en, newSym);

        msgDiv.innerHTML = '<div class="alert alert-success">✅ محفوظ' + (cloudOk ? ' ☁️' : ' (offline)') + '</div>';
        if (typeof showToast === 'function') showToast('✅ Symptom: ' + en);

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
            try {
                await sb.from('custom_symptoms').delete().eq('id', symId);
            } catch(e) {
                addPendingOp({ action: 'delete_symptom', data: { id: symId } });
            }
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
    // DISEASE: SAVE (Cloud + Local)
    // ==========================================
    async function saveDiseaseToCloud(disData, isEdit) {
        var sb = getSupabase();
        var dbData = {
            id: disData.id,
            name_ur: disData.name.ur,
            name_en: disData.name.en,
            name_roman: disData.name.roman,
            icon: disData.icon || '💊',
            category: disData.category,
            symptoms: disData.symptoms || [],
            key_symptoms: disData.keySymptoms || [],
            tests: disData.tests || [],
            red_flags: disData.redFlags || [],
            remedies: disData.remedies || [],
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
        if (titleEl) titleEl.textContent = isEdit ? '✏️ Edit Disease' : '➕ Add Disease';

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
            msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID پہلے سے موجود</div>';
            return;
        }

        var newDisease = {
            id: id,
            name: { ur: ur, en: en, roman: roman || en },
            icon: icon,
            category: category,
            symptoms: symptoms,
            keySymptoms: keySymptoms,
            tests: tests,
            redFlags: redFlags,
            remedies: remedies,
            advice: { ur: adviceUr, en: adviceEn },
            promoted: existing ? existing.promoted : false
        };

        // Update global DB
        var globalIdx = window.DISEASES_DB.findIndex(function(d) { return d.id === id; });
        if (globalIdx >= 0) window.DISEASES_DB[globalIdx] = newDisease;
        else window.DISEASES_DB.push(newDisease);

        // Update cache
        var cIdx = diseases.findIndex(function(d) { return d.id === id; });
        if (cIdx >= 0) diseases[cIdx] = newDisease;
        else diseases.push(newDisease);
        setCachedDiseases(diseases);

        var cloudOk = await saveDiseaseToCloud(newDisease, isEdit);
        await logHistory(isEdit ? 'edit' : 'add', 'disease', id, en, newDisease);

        msgDiv.innerHTML = '<div class="alert alert-success">✅ محفوظ' + (cloudOk ? ' ☁️' : ' (offline)') + '</div>';
        if (typeof showToast === 'function') showToast('✅ Disease: ' + en);

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
            try {
                await sb.from('custom_diseases').delete().eq('id', disId);
            } catch(e) {
                addPendingOp({ action: 'delete_disease', data: { id: disId } });
            }
        } else {
            addPendingOp({ action: 'delete_disease', data: { id: disId } });
        }

        await logHistory('delete', 'disease', disId, name);

        if (typeof showToast === 'function') showToast('🗑️ Deleted');
        window.viewCustomData();
    }

    // ==========================================
    // EXPOSE HELPERS TO WINDOW (for Part 2)
    // ==========================================
    window._customData = {
        getCachedCategories: getCachedCategories,
        setCachedCategories: setCachedCategories,
        getCachedSymptoms: getCachedSymptoms,
        setCachedSymptoms: setCachedSymptoms,
        getCachedDiseases: getCachedDiseases,
        setCachedDiseases: setCachedDiseases,
        mergeIntoGlobalDBs: mergeIntoGlobalDBs,
        syncFromCloud: syncFromCloud,
        processPendingOps: processPendingOps,
        logHistory: logHistory,
        getSupabase: getSupabase,
        addPendingOp: addPendingOp,
        ICON_LIBRARY: ICON_LIBRARY,
        renderIconPicker: renderIconPicker
    };

    console.log('✅ Custom Data Manager v4 - Part 1 loaded');

    // Part 2 will be appended below...

})();

    // ==========================================
    // VIEW ALL CUSTOM DATA (with Promoted flag)
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

        // Count promoted vs unpromoted
        var catPromoted = Object.values(cats).filter(function(c) { return c.promoted; }).length;
        var catUnpromoted = Object.keys(cats).length - catPromoted;
        var symPromoted = Object.values(syms).filter(function(s) { return s.promoted; }).length;
        var symUnpromoted = Object.keys(syms).length - symPromoted;
        var disPromoted = dis.filter(function(d) { return d.promoted; }).length;
        var disUnpromoted = dis.length - disPromoted;

        var html = '';

        // Legend
        html += '<div style="background:#fff3cd;padding:8px 12px;border-radius:6px;margin-bottom:12px;font-size:12px;color:#856404;">';
        html += '💡 <strong>Legend:</strong> ';
        html += '🆕 = New (backup میں شامل ہوگی) ';
        html += '| ✅ = Promoted (GitHub پر ہے، backup سے exclude)';
        html += '</div>';

        // === CATEGORIES ===
        html += '<h4 style="color:#8e44ad;margin:10px 0 8px;">🏷️ Categories (' + Object.keys(cats).length + ')';
        if (catPromoted > 0) html += ' <small style="color:#27ae60;">✅ ' + catPromoted + ' promoted</small>';
        if (catUnpromoted > 0) html += ' <small style="color:#f39c12;">🆕 ' + catUnpromoted + ' new</small>';
        html += '</h4>';
        if (Object.keys(cats).length === 0) {
            html += '<p style="color:#95a5a6;font-size:13px;padding:5px;">کوئی custom category نہیں</p>';
        } else {
            html += '<div style="max-height:180px;overflow-y:auto;background:#f8f9fa;padding:8px;border-radius:6px;margin-bottom:12px;">';
            Object.keys(cats).forEach(function(k) {
                var c = cats[k];
                var promoteBadge = c.promoted ? '<span style="background:#27ae60;color:white;padding:2px 6px;border-radius:8px;font-size:10px;">✅ GitHub</span>' : '<span style="background:#f39c12;color:white;padding:2px 6px;border-radius:8px;font-size:10px;">🆕 New</span>';
                html += '<div style="padding:6px 8px;border-bottom:1px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center;font-size:13px;gap:8px;">';
                html += '<span style="flex:1;">' + c.icon + ' <strong>' + esc(c.ur) + '</strong> / ' + esc(c.en) + ' ' + promoteBadge + '</span>';
                html += '<span style="display:flex;gap:3px;">';
                if (!c.promoted) {
                    html += '<button class="btn btn-success btn-xs" onclick="promoteItem(\'category\',\'' + k + '\')" title="Mark as promoted (GitHub میں add کر دی)">✅</button>';
                } else {
                    html += '<button class="btn btn-warning btn-xs" onclick="unpromoteItem(\'category\',\'' + k + '\')" title="Unmark promoted">↩️</button>';
                }
                html += '<button class="btn btn-edit btn-xs" onclick="openAddCategoryModal(\'' + k + '\')">✏️</button>';
                html += '<button class="btn btn-danger btn-xs" onclick="deleteCustomCategory(\'' + k + '\')">🗑️</button>';
                html += '</span></div>';
            });
            html += '</div>';
        }

        // === SYMPTOMS ===
        html += '<h4 style="color:#17a2b8;margin:10px 0 8px;">💡 Symptoms (' + Object.keys(syms).length + ')';
        if (symPromoted > 0) html += ' <small style="color:#27ae60;">✅ ' + symPromoted + ' promoted</small>';
        if (symUnpromoted > 0) html += ' <small style="color:#f39c12;">🆕 ' + symUnpromoted + ' new</small>';
        html += '</h4>';
        if (Object.keys(syms).length === 0) {
            html += '<p style="color:#95a5a6;font-size:13px;padding:5px;">کوئی custom symptom نہیں</p>';
        } else {
            html += '<div style="max-height:180px;overflow-y:auto;background:#f8f9fa;padding:8px;border-radius:6px;margin-bottom:12px;">';
            Object.keys(syms).forEach(function(k) {
                var s = syms[k];
                var promoteBadge = s.promoted ? '<span style="background:#27ae60;color:white;padding:2px 6px;border-radius:8px;font-size:10px;">✅</span>' : '<span style="background:#f39c12;color:white;padding:2px 6px;border-radius:8px;font-size:10px;">🆕</span>';
                html += '<div style="padding:6px 8px;border-bottom:1px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center;font-size:13px;gap:8px;">';
                html += '<span style="flex:1;">' + (s.severe ? '⚠️' : '•') + ' <strong>' + esc(s.ur) + '</strong> / ' + esc(s.en) + ' ' + promoteBadge + '</span>';
                html += '<span style="display:flex;gap:3px;">';
                if (!s.promoted) {
                    html += '<button class="btn btn-success btn-xs" onclick="promoteItem(\'symptom\',\'' + k + '\')" title="Mark as promoted">✅</button>';
                } else {
                    html += '<button class="btn btn-warning btn-xs" onclick="unpromoteItem(\'symptom\',\'' + k + '\')" title="Unmark">↩️</button>';
                }
                html += '<button class="btn btn-edit btn-xs" onclick="openAddSymptomModal(\'' + k + '\')">✏️</button>';
                html += '<button class="btn btn-danger btn-xs" onclick="deleteCustomSymptom(\'' + k + '\')">🗑️</button>';
                html += '</span></div>';
            });
            html += '</div>';
        }

        // === DISEASES ===
        html += '<h4 style="color:#27ae60;margin:10px 0 8px;">🔬 Diseases (' + dis.length + ')';
        if (disPromoted > 0) html += ' <small style="color:#27ae60;">✅ ' + disPromoted + ' promoted</small>';
        if (disUnpromoted > 0) html += ' <small style="color:#f39c12;">🆕 ' + disUnpromoted + ' new</small>';
        html += '</h4>';
        if (dis.length === 0) {
            html += '<p style="color:#95a5a6;font-size:13px;padding:5px;">کوئی custom disease نہیں</p>';
        } else {
            html += '<div style="max-height:180px;overflow-y:auto;background:#f8f9fa;padding:8px;border-radius:6px;margin-bottom:12px;">';
            dis.forEach(function(d) {
                var dIcon = d.icon || '💊';
                var promoteBadge = d.promoted ? '<span style="background:#27ae60;color:white;padding:2px 6px;border-radius:8px;font-size:10px;">✅</span>' : '<span style="background:#f39c12;color:white;padding:2px 6px;border-radius:8px;font-size:10px;">🆕</span>';
                html += '<div style="padding:6px 8px;border-bottom:1px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center;font-size:13px;gap:8px;">';
                html += '<span style="flex:1;">' + dIcon + ' <strong>' + esc(d.name.ur) + '</strong> / ' + esc(d.name.en) + ' ' + promoteBadge + '</span>';
                html += '<span style="display:flex;gap:3px;">';
                if (!d.promoted) {
                    html += '<button class="btn btn-success btn-xs" onclick="promoteItem(\'disease\',\'' + d.id + '\')" title="Mark as promoted">✅</button>';
                } else {
                    html += '<button class="btn btn-warning btn-xs" onclick="unpromoteItem(\'disease\',\'' + d.id + '\')" title="Unmark">↩️</button>';
                }
                html += '<button class="btn btn-edit btn-xs" onclick="openAddDiseaseModal(\'' + d.id + '\')">✏️</button>';
                html += '<button class="btn btn-danger btn-xs" onclick="deleteCustomDisease(\'' + d.id + '\')">🗑️</button>';
                html += '</span></div>';
            });
            html += '</div>';
        }

        // === TOTALS ===
        html += '<div style="margin-top:12px;padding:10px;background:#d1ecf1;border-radius:6px;font-size:12px;color:#0c5460;">';
        html += '📊 <strong>Grand Total:</strong> Categories: ' + Object.keys(window.CATEGORIES_DB).length;
        html += ' | Symptoms: ' + Object.keys(window.SYMPTOMS_DB).length;
        html += ' | Diseases: ' + window.DISEASES_DB.length;
        html += '</div>';

        // Cleanup suggestion
        var totalPromoted = catPromoted + symPromoted + disPromoted;
        if (totalPromoted >= 5) {
            html += '<div style="margin-top:10px;padding:10px;background:#fff3cd;border-radius:6px;font-size:12px;color:#856404;">';
            html += '💡 <strong>Suggestion:</strong> آپ کے پاس ' + totalPromoted + ' promoted items ہیں۔ ';
            html += '<button class="btn btn-warning btn-xs" onclick="cleanupPromoted()" style="margin-right:5px;">🧹 Cleanup Now</button>';
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
    // PROMOTE / UNPROMOTE ITEMS
    // ==========================================
    window.promoteItem = async function(type, id) {
        var confirmMsg = 'کیا آپ نے واقعی یہ item GitHub پر add کر دی ہے؟<br><br>' +
                        '<b>' + id + '</b><br><br>' +
                        'اگر ہاں تو اسے "Promoted" مارک کر دیں گے۔ ' +
                        'اگلے backup میں یہ شامل نہیں ہوگی۔';

        if (typeof showConfirm !== 'function') {
            if (!confirm('Mark "' + id + '" as promoted (added to GitHub)?')) return;
            await doPromote(type, id, true);
            return;
        }
        showConfirm(confirmMsg, function() { doPromote(type, id, true); });
    };

    window.unpromoteItem = async function(type, id) {
        if (typeof showConfirm !== 'function') {
            if (!confirm('Unmark "' + id + '" as promoted?')) return;
            await doPromote(type, id, false);
            return;
        }
        showConfirm('کیا اسے "unpromote" کریں؟ (پھر backup میں شامل ہوگی)', function() {
            doPromote(type, id, false);
        });
    };

    async function doPromote(type, id, promoted) {
        var sb = getSupabase();
        var table = type === 'category' ? 'custom_categories' :
                    type === 'symptom' ? 'custom_symptoms' : 'custom_diseases';

        // Update cache
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

        // Update cloud
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

        if (typeof showToast === 'function') {
            showToast(promoted ? '✅ Marked as promoted' : '↩️ Unmarked');
        }
        window.viewCustomData();
    }

    // ==========================================
    // BACKUP: FULL (Everything)
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
        if (typeof showToast === 'function') showToast('✅ Full backup downloaded!');
    };

    // ==========================================
    // BACKUP: ONLY NEW (Unpromoted only)
    // ==========================================
    window.exportOnlyNew = function() {
        var allCats = getCachedCategories();
        var allSyms = getCachedSymptoms();
        var allDis = getCachedDiseases();

        var newCats = {};
        var newSyms = {};
        var newDis = [];

        Object.keys(allCats).forEach(function(k) {
            if (!allCats[k].promoted) newCats[k] = allCats[k];
        });
        Object.keys(allSyms).forEach(function(k) {
            if (!allSyms[k].promoted) newSyms[k] = allSyms[k];
        });
        allDis.forEach(function(d) {
            if (!d.promoted) newDis.push(d);
        });

        var totalNew = Object.keys(newCats).length + Object.keys(newSyms).length + newDis.length;

        if (totalNew === 0) {
            if (typeof showToast === 'function') showToast('⚠️ No new items to backup (all are promoted)', 'error');
            return;
        }

        var data = {
            type: 'new_only_backup',
            categories: newCats,
            symptoms: newSyms,
            diseases: newDis,
            exportDate: new Date().toISOString(),
            appVersion: '4.0',
            note: 'This backup contains ONLY unpromoted items'
        };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'bhc-new-only-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
        if (typeof showToast === 'function') showToast('✅ New items backup: ' + totalNew + ' items');
    };

    // ==========================================
    // GITHUB EXPORT (Ready-to-paste for diagnosis-data.js)
    // ==========================================
    window.exportForGitHub = function() {
        var allCats = getCachedCategories();
        var allSyms = getCachedSymptoms();
        var allDis = getCachedDiseases();

        // Only export unpromoted (new) items
        var newCats = {};
        var newSyms = {};
        var newDis = [];

        Object.keys(allCats).forEach(function(k) {
            if (!allCats[k].promoted) newCats[k] = allCats[k];
        });
        Object.keys(allSyms).forEach(function(k) {
            if (!allSyms[k].promoted) newSyms[k] = allSyms[k];
        });
        allDis.forEach(function(d) {
            if (!d.promoted) newDis.push(d);
        });

        var totalNew = Object.keys(newCats).length + Object.keys(newSyms).length + newDis.length;

        if (totalNew === 0) {
            if (typeof showToast === 'function') showToast('⚠️ No new items to export', 'error');
            return;
        }

        // Generate JavaScript code
        var code = '// ===================================\n';
        code += '// GitHub Export - ' + new Date().toISOString().split('T')[0] + '\n';
        code += '// ' + totalNew + ' new items ready to paste\n';
        code += '// ===================================\n\n';

        // Categories
        if (Object.keys(newCats).length > 0) {
            code += '// ===== NEW CATEGORIES =====\n';
            code += '// Add these to CATEGORIES_DB in diagnosis-data.js\n\n';
            Object.keys(newCats).forEach(function(k) {
                var c = newCats[k];
                code += '    ' + k + ': { ur: ' + JSON.stringify(c.ur) + ', en: ' + JSON.stringify(c.en) + ', roman: ' + JSON.stringify(c.roman) + ', icon: ' + JSON.stringify(c.icon) + ' },\n';
            });
            code += '\n\n';
        }

        // Symptoms
        if (Object.keys(newSyms).length > 0) {
            code += '// ===== NEW SYMPTOMS =====\n';
            code += '// Add these to SYMPTOMS_DB in diagnosis-data.js\n\n';
            Object.keys(newSyms).forEach(function(k) {
                var s = newSyms[k];
                code += '    ' + k + ': { ur: ' + JSON.stringify(s.ur) + ', en: ' + JSON.stringify(s.en) + ', roman: ' + JSON.stringify(s.roman) + ', category: ' + JSON.stringify(s.category);
                if (s.severe) code += ', severe: true';
                code += ' },\n';
            });
            code += '\n\n';
        }

        // Diseases
        if (newDis.length > 0) {
            code += '// ===== NEW DISEASES =====\n';
            code += '// Add these to DISEASES_DB array in diagnosis-data.js\n\n';
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
            code += '\n\n';
        }

        code += '// ===================================\n';
        code += '// After adding to diagnosis-data.js:\n';
        code += '// 1. Push to GitHub\n';
        code += '// 2. Return to app\n';
        code += '// 3. Click "✅ Promoted" on each item\n';
        code += '// ===================================\n';

        // Download as .txt file
        var blob = new Blob([code], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'github-export-' + new Date().toISOString().split('T')[0] + '.txt';
        a.click();
        URL.revokeObjectURL(url);

        if (typeof showToast === 'function') showToast('✅ GitHub export ready: ' + totalNew + ' items');
    };

    // ==========================================
    // RESTORE / SMART IMPORT (JSON + CSV)
    // ==========================================
    window.smartImport = function() {
        var input = document.getElementById('importCustomFile');
        if (!input) {
            if (typeof showToast === 'function') showToast('❌ File input missing', 'error');
            return;
        }
        input.click();
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
                    await saveCategoryToCloud(data.categories[k], false);
                }
                setCachedCategories(ec);
            }
            if (data.symptoms) {
                var es = getCachedSymptoms();
                for (var k in data.symptoms) {
                    es[k] = data.symptoms[k];
                    added++;
                    await saveSymptomToCloud(data.symptoms[k], false);
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
                    await saveDiseaseToCloud(d, false);
                }
                setCachedDiseases(ed);
            }

            mergeIntoGlobalDBs();

            if (typeof showToast === 'function') showToast('✅ Imported ' + added + ' items');

            if (document.querySelector('#page-diagnosis.active')) {
                if (typeof renderCategoryTabs === 'function') renderCategoryTabs();
                if (typeof renderSymptomsGrid === 'function') renderSymptomsGrid();
            }
        } catch(err) {
            if (typeof showToast === 'function') showToast('❌ JSON error: ' + err.message, 'error');
        }
    }

    async function handleImportCSV(content) {
        try {
            var lines = content.split(/\r?\n/);
            if (lines.length < 2) {
                if (typeof showToast === 'function') showToast('❌ Empty CSV', 'error');
                return;
            }

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
                        roman: row.roman || row.en, icon: row.icon || '📌',
                        promoted: false
                    };
                    var cats = getCachedCategories();
                    cats[row.id] = catData;
                    setCachedCategories(cats);
                    await saveCategoryToCloud(catData, false);
                    added++;
                } else if (row.type === 'symptom' && row.id && row.ur && row.en) {
                    var symData = {
                        id: row.id, ur: row.ur, en: row.en,
                        roman: row.roman || row.en, category: row.category || 'general',
                        severe: (row.severe === 'true' || row.severe === '1'),
                        promoted: false
                    };
                    var syms = getCachedSymptoms();
                    syms[row.id] = symData;
                    setCachedSymptoms(syms);
                    await saveSymptomToCloud(symData, false);
                    added++;
                }
            }

            mergeIntoGlobalDBs();

            if (typeof showToast === 'function') showToast('✅ CSV: ' + added + ' items imported');

            if (document.querySelector('#page-diagnosis.active')) {
                if (typeof renderCategoryTabs === 'function') renderCategoryTabs();
                if (typeof renderSymptomsGrid === 'function') renderSymptomsGrid();
            }
        } catch(err) {
            if (typeof showToast === 'function') showToast('❌ CSV error: ' + err.message, 'error');
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
                } else {
                    if (typeof showToast === 'function') showToast('❌ Only .json or .csv', 'error');
                }
                newInput.value = '';
            };
            reader.readAsText(file);
        });

        console.log('✅ Import handler attached');
    }

    // ==========================================
    // CLEANUP PROMOTED ITEMS
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
            if (typeof showToast === 'function') showToast('✅ Nothing to cleanup');
            return;
        }

        var msg = '⚠️ کیا آپ واقعی ' + total + ' promoted items delete کرنا چاہتے ہیں؟<br><br>';
        msg += '• Categories: ' + promotedCats.length + '<br>';
        msg += '• Symptoms: ' + promotedSyms.length + '<br>';
        msg += '• Diseases: ' + promotedDis.length + '<br><br>';
        msg += '<strong>یقینی بنائیں کہ یہ سب GitHub پر موجود ہیں!</strong>';

        if (typeof showConfirm !== 'function') {
            if (!confirm('Delete ' + total + ' promoted items? Make sure they are on GitHub!')) return;
            doCleanup(promotedCats, promotedSyms, promotedDis);
            return;
        }
        showConfirm(msg, function() { doCleanup(promotedCats, promotedSyms, promotedDis); });
    };

    async function doCleanup(promotedCats, promotedSyms, promotedDis) {
        var sb = getSupabase();
        var deleted = 0;

        // Delete categories
        var cats = getCachedCategories();
        for (var i = 0; i < promotedCats.length; i++) {
            var k = promotedCats[i];
            delete cats[k];
            deleted++;
            if (sb && navigator.onLine) {
                try { await sb.from('custom_categories').delete().eq('id', k); } catch(e) {}
            }
        }
        setCachedCategories(cats);

        // Delete symptoms
        var syms = getCachedSymptoms();
        for (var i = 0; i < promotedSyms.length; i++) {
            var k = promotedSyms[i];
            delete syms[k];
            deleted++;
            if (sb && navigator.onLine) {
                try { await sb.from('custom_symptoms').delete().eq('id', k); } catch(e) {}
            }
        }
        setCachedSymptoms(syms);

        // Delete diseases
        var dis = getCachedDiseases();
        for (var i = 0; i < promotedDis.length; i++) {
            var d = promotedDis[i];
            dis = dis.filter(function(x) { return x.id !== d.id; });
            deleted++;
            if (sb && navigator.onLine) {
                try { await sb.from('custom_diseases').delete().eq('id', d.id); } catch(e) {}
            }
        }
        setCachedDiseases(dis);

        await logHistory('cleanup', 'batch', 'promoted', 'Cleanup', { count: deleted });

        if (typeof showToast === 'function') showToast('🧹 Cleaned up ' + deleted + ' items');
        window.viewCustomData();
    }

    // ==========================================
    // MIGRATION WIZARD (Guided workflow)
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
            if (typeof showToast === 'function') showToast('✅ Everything is promoted!');
            return;
        }

        var msg = '🚀 <strong>Migration Wizard</strong><br><br>';
        msg += 'آپ کے پاس ' + total + ' نئی items ہیں:<br>';
        msg += '• Categories: ' + unpCats + '<br>';
        msg += '• Symptoms: ' + unpSyms + '<br>';
        msg += '• Diseases: ' + unpDis + '<br><br>';
        msg += '<strong>Steps:</strong><br>';
        msg += '1. کیا GitHub export فائل download کریں؟<br>';
        msg += '2. پھر diagnosis-data.js میں paste کریں<br>';
        msg += '3. GitHub پر push کریں<br>';
        msg += '4. یہاں واپس آ کر "✅ Promoted" مارک کریں<br><br>';
        msg += 'کیا export فائل بنائیں؟';

        if (typeof showConfirm !== 'function') {
            if (!confirm('Start migration wizard? Export ' + total + ' items?')) return;
            window.exportForGitHub();
            return;
        }
        showConfirm(msg, function() {
            window.exportForGitHub();
            setTimeout(function() {
                if (typeof showToast === 'function') {
                    showToast('📝 Export downloaded! Add to GitHub, then mark as promoted');
                }
            }, 500);
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
                var actionIcon = h.action === 'add' ? '➕' :
                                h.action === 'edit' ? '✏️' :
                                h.action === 'delete' ? '🗑️' :
                                h.action === 'promote' ? '✅' :
                                h.action === 'unpromote' ? '↩️' :
                                h.action === 'cleanup' ? '🧹' : '📝';
                var date = new Date(h.performed_at).toLocaleString();
                html += '<div style="padding:6px 8px;border-bottom:1px solid #ecf0f1;font-size:12px;">';
                html += actionIcon + ' <strong>' + h.action.toUpperCase() + '</strong> ';
                html += h.item_type + ': <em>' + esc(h.item_name || h.item_id) + '</em><br>';
                html += '<small style="color:#95a5a6;">' + date + ' • by ' + esc(h.performed_by || 'Unknown') + '</small>';
                html += '</div>';
            });
            html += '</div>';
        }

        html += '<div class="action-buttons" style="margin-top:12px;">';
        html += '<button class="btn btn-danger btn-sm" onclick="clearHistory()">🗑️ Clear History</button>';
        html += '<button class="btn btn-light btn-sm" onclick="viewCustomData()">🔙 Back to Data</button>';
        html += '</div>';

        document.getElementById('customDataContent').innerHTML = html;
        modal.classList.add('active');
    };

    window.clearHistory = function() {
        if (typeof showConfirm !== 'function') {
            if (!confirm('Clear all history?')) return;
            localStorage.removeItem('custom_history_log');
            if (typeof showToast === 'function') showToast('🗑️ History cleared');
            window.viewHistory();
            return;
        }
        showConfirm('Clear all history log?', function() {
            localStorage.removeItem('custom_history_log');
            if (typeof showToast === 'function') showToast('🗑️ History cleared');
            window.viewHistory();
        });
    };

    // ==========================================
    // MANUAL SYNC BUTTON
    // ==========================================
    window.syncCustomData = async function() {
        if (typeof showToast === 'function') showToast('🔄 Syncing...');
        var ok = await syncFromCloud();
        if (ok) {
            if (typeof showToast === 'function') showToast('✅ Sync complete');
        } else {
            if (typeof showToast === 'function') showToast('⚠️ Offline - using cache', 'error');
        }
    };

    // ==========================================
    // INITIALIZATION
    // ==========================================
    function initialize() {
        console.log('🚀 Initializing Custom Data Manager v4...');

        // Try to sync from cloud
        setTimeout(function() {
            syncFromCloud().then(function() {
                console.log('✅ Initial sync done');
            });
        }, 1500);

        // Attach import handler
        setTimeout(attachImportHandler, 1000);

        // Auto-retry pending ops every 30 seconds when online
        setInterval(function() {
            if (navigator.onLine) processPendingOps();
        }, 30000);

        // Sync when coming back online
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

    // Expose ICON_LIBRARY for other uses
    window.ICON_LIBRARY = ICON_LIBRARY;

    console.log('✅ Custom Data Manager v4 - COMPLETE loaded (Part 1 + Part 2)');