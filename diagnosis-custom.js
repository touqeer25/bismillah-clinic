// ==========================================
// Bismillah Clinic - Custom Data Manager v3
// Full CRUD: Categories, Symptoms, Diseases
// Icon Library for Categories AND Diseases
// Smart Import: JSON + CSV auto-detect
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // ICON LIBRARY (50 icons - for Categories + Diseases)
    // ==========================================
    const ICON_LIBRARY = [
        { icon: '🏥', label: 'Hospital' },
        { icon: '🩺', label: 'Stethoscope' },
        { icon: '💊', label: 'Medicine' },
        { icon: '🔬', label: 'Microscope' },
        { icon: '🧬', label: 'DNA' },
        { icon: '🫁', label: 'Lungs' },
        { icon: '🧠', label: 'Brain' },
        { icon: '💗', label: 'Heart' },
        { icon: '🦴', label: 'Bone' },
        { icon: '🧴', label: 'Skin' },
        { icon: '👁️', label: 'Eye' },
        { icon: '👂', label: 'Ear' },
        { icon: '👃', label: 'Nose' },
        { icon: '🦷', label: 'Tooth' },
        { icon: '💧', label: 'Water/Urinary' },
        { icon: '🍽️', label: 'Digestive' },
        { icon: '🤒', label: 'Fever' },
        { icon: '🧘', label: 'Mental' },
        { icon: '👩', label: 'Women' },
        { icon: '👶', label: 'Baby' },
        { icon: '👴', label: 'Elderly' },
        { icon: '💉', label: 'Injection' },
        { icon: '🩸', label: 'Blood' },
        { icon: '🚨', label: 'Emergency' },
        { icon: '⚠️', label: 'Warning' },
        { icon: '❤️', label: 'Heart/Love' },
        { icon: '🎗️', label: 'Cancer' },
        { icon: '🦠', label: 'Virus' },
        { icon: '🌡️', label: 'Temperature' },
        { icon: '💪', label: 'Muscle' },
        { icon: '🤰', label: 'Pregnant' },
        { icon: '🧪', label: 'Lab' },
        { icon: '📋', label: 'Clipboard' },
        { icon: '🌿', label: 'Herbal' },
        { icon: '☀️', label: 'Sun' },
        { icon: '🌙', label: 'Moon/Night' },
        { icon: '🔥', label: 'Fire/Inflammation' },
        { icon: '❄️', label: 'Cold' },
        { icon: '💤', label: 'Sleep' },
        { icon: '😰', label: 'Anxiety' },
        { icon: '😢', label: 'Sad' },
        { icon: '🤧', label: 'Sneeze' },
        { icon: '🫀', label: 'Anatomical Heart' },
        { icon: '🫘', label: 'Kidney' },
        { icon: '🦵', label: 'Leg' },
        { icon: '🦶', label: 'Foot' },
        { icon: '✋', label: 'Hand' },
        { icon: '👅', label: 'Tongue' },
        { icon: '💅', label: 'Nail' },
        { icon: '🧫', label: 'Petri Dish' },
        { icon: '📌', label: 'Pin' }
    ];

    // ==========================================
    // STORAGE HELPERS
    // ==========================================
    function getCustomCategories() {
        return JSON.parse(localStorage.getItem('custom_categories') || '{}');
    }
    function saveCustomCategoriesStorage(data) {
        localStorage.setItem('custom_categories', JSON.stringify(data));
    }
    function getCustomSymptoms() {
        return JSON.parse(localStorage.getItem('custom_symptoms') || '{}');
    }
    function saveCustomSymptomsStorage(data) {
        localStorage.setItem('custom_symptoms', JSON.stringify(data));
    }
    function getCustomDiseases() {
        return JSON.parse(localStorage.getItem('custom_diseases') || '[]');
    }
    function saveCustomDiseasesStorage(data) {
        localStorage.setItem('custom_diseases', JSON.stringify(data));
    }

    // ==========================================
    // LOAD CUSTOM DATA INTO GLOBAL DBs
    // ==========================================
    function loadAllCustomData() {
        try {
            if (!window.CATEGORIES_DB || !window.SYMPTOMS_DB || !window.DISEASES_DB) {
                console.warn('⚠️ Main DBs not ready yet, retrying...');
                setTimeout(loadAllCustomData, 500);
                return;
            }

            var cats = getCustomCategories();
            var syms = getCustomSymptoms();
            var dis = getCustomDiseases();

            Object.keys(cats).forEach(function(k) {
                window.CATEGORIES_DB[k] = cats[k];
            });
            Object.keys(syms).forEach(function(k) {
                window.SYMPTOMS_DB[k] = syms[k];
            });
            dis.forEach(function(d) {
                var exists = window.DISEASES_DB.find(function(x) { return x.id === d.id; });
                if (!exists) window.DISEASES_DB.push(d);
            });

            console.log('✅ Custom data merged: ' +
                Object.keys(cats).length + ' categories, ' +
                Object.keys(syms).length + ' symptoms, ' +
                dis.length + ' diseases');
        } catch(e) {
            console.error('Custom data load error:', e);
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

    // Global: select icon for any input
    window.selectIconForInput = function(inputId, containerId, icon) {
        var input = document.getElementById(inputId);
        if (input) input.value = icon;
        renderIconPicker(containerId, inputId, icon);
    };

    // ==========================================
    // CATEGORY: Add/Edit
    // ==========================================
    window.openAddCategoryModal = function(editId) {
        var modal = document.getElementById('addCategoryModal');
        if (!modal) { console.error('Modal #addCategoryModal not found'); return; }

        var isEdit = !!editId;
        var cat = isEdit ? window.CATEGORIES_DB[editId] : null;

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

    window.saveNewCategory = function() {
        var oldId = document.getElementById('editCategoryOldId').value;
        var isEdit = !!oldId;
        var id = document.getElementById('newCategoryId').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        var ur = document.getElementById('newCategoryUr').value.trim();
        var en = document.getElementById('newCategoryEn').value.trim();
        var roman = document.getElementById('newCategoryRoman').value.trim();
        var icon = document.getElementById('newCategoryIcon').value.trim() || '📌';
        var msgDiv = document.getElementById('addCategoryMsg');

        if (!id) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID لازمی ہے</div>'; return; }
        if (!ur || !en) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ اردو اور انگلش نام لازمی ہیں</div>'; return; }
        if (!isEdit && window.CATEGORIES_DB[id]) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID پہلے سے موجود</div>'; return; }

        var newCat = { ur: ur, en: en, roman: roman || en, icon: icon };
        window.CATEGORIES_DB[id] = newCat;

        var storage = getCustomCategories();
        storage[id] = newCat;
        saveCustomCategoriesStorage(storage);

        msgDiv.innerHTML = '<div class="alert alert-success">✅ محفوظ ہو گئی!</div>';
        if (typeof showToast === 'function') showToast('✅ Category: ' + en);

        if (document.querySelector('#page-diagnosis.active') && typeof renderCategoryTabs === 'function') {
            renderCategoryTabs();
        }

        setTimeout(window.closeAddCategoryModal, 1000);
    };

    window.deleteCustomCategory = function(catId) {
        if (typeof showConfirm !== 'function') {
            if (!confirm('Delete category "' + catId + '"?')) return;
            doDeleteCategory(catId);
            return;
        }
        showConfirm('Delete category <b>' + catId + '</b>?', function() { doDeleteCategory(catId); });
    };

    function doDeleteCategory(catId) {
        var storage = getCustomCategories();
        delete storage[catId];
        saveCustomCategoriesStorage(storage);
        delete window.CATEGORIES_DB[catId];
        if (typeof showToast === 'function') showToast('🗑️ Deleted');
        window.viewCustomData();
        if (document.querySelector('#page-diagnosis.active') && typeof renderCategoryTabs === 'function') {
            renderCategoryTabs();
        }
    }

    // ==========================================
    // SYMPTOM: Add/Edit
    // ==========================================
    window.openAddSymptomModal = function(editId) {
        var modal = document.getElementById('addSymptomModal');
        if (!modal) { console.error('Modal #addSymptomModal not found'); return; }

        var isEdit = !!editId;
        var sym = isEdit ? window.SYMPTOMS_DB[editId] : null;

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

        // Build category dropdown
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

    window.saveNewSymptom = function() {
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
        if (!isEdit && window.SYMPTOMS_DB[id]) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID پہلے سے موجود</div>'; return; }

        var newSym = { ur: ur, en: en, roman: roman || en, category: category };
        if (severe) newSym.severe = true;

        window.SYMPTOMS_DB[id] = newSym;
        var storage = getCustomSymptoms();
        storage[id] = newSym;
        saveCustomSymptomsStorage(storage);

        msgDiv.innerHTML = '<div class="alert alert-success">✅ محفوظ!</div>';
        if (typeof showToast === 'function') showToast('✅ Symptom: ' + en);

        if (document.querySelector('#page-diagnosis.active') && typeof renderSymptomsGrid === 'function') {
            renderSymptomsGrid();
        }

        setTimeout(window.closeAddSymptomModal, 1000);
    };

    window.deleteCustomSymptom = function(symId) {
        if (typeof showConfirm !== 'function') {
            if (!confirm('Delete symptom "' + symId + '"?')) return;
            doDeleteSymptom(symId);
            return;
        }
        showConfirm('Delete symptom <b>' + symId + '</b>?', function() { doDeleteSymptom(symId); });
    };

    function doDeleteSymptom(symId) {
        var storage = getCustomSymptoms();
        delete storage[symId];
        saveCustomSymptomsStorage(storage);
        delete window.SYMPTOMS_DB[symId];
        if (typeof showToast === 'function') showToast('🗑️ Deleted');
        window.viewCustomData();
        if (document.querySelector('#page-diagnosis.active') && typeof renderSymptomsGrid === 'function') {
            renderSymptomsGrid();
        }
    }

    // ==========================================
    // DISEASE: Add/Edit
    // ==========================================
    window.openAddDiseaseModal = function(editId) {
        var modal = document.getElementById('addDiseaseModal');
        if (!modal) { console.error('Modal #addDiseaseModal not found'); return; }

        var isEdit = !!editId;
        var dis = isEdit ? window.DISEASES_DB.find(function(d) { return d.id === editId; }) : null;

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

        // Build category dropdown
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

        // Render icon picker for disease
        renderIconPicker('diseaseIconPickerContainer', 'newDiseaseIcon', isEdit && dis && dis.icon ? dis.icon : '💊');

        modal.classList.add('active');
    };

    window.closeAddDiseaseModal = function() {
        var m = document.getElementById('addDiseaseModal');
        if (m) m.classList.remove('active');
    };

    window.saveNewDisease = function() {
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
            advice: { ur: adviceUr, en: adviceEn }
        };

        if (isEdit) {
            var idx = window.DISEASES_DB.findIndex(function(d) { return d.id === id; });
            if (idx >= 0) window.DISEASES_DB[idx] = newDisease;
        } else {
            if (window.DISEASES_DB.find(function(d) { return d.id === id; })) {
                msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID پہلے سے موجود</div>';
                return;
            }
            window.DISEASES_DB.push(newDisease);
        }

        var storage = getCustomDiseases();
        var cIdx = storage.findIndex(function(d) { return d.id === id; });
        if (cIdx >= 0) storage[cIdx] = newDisease;
        else storage.push(newDisease);
        saveCustomDiseasesStorage(storage);

        msgDiv.innerHTML = '<div class="alert alert-success">✅ محفوظ!</div>';
        if (typeof showToast === 'function') showToast('✅ Disease: ' + en);

        setTimeout(window.closeAddDiseaseModal, 1000);
    };

    window.deleteCustomDisease = function(disId) {
        if (typeof showConfirm !== 'function') {
            if (!confirm('Delete disease "' + disId + '"?')) return;
            doDeleteDisease(disId);
            return;
        }
        showConfirm('Delete disease <b>' + disId + '</b>?', function() { doDeleteDisease(disId); });
    };

    function doDeleteDisease(disId) {
        var storage = getCustomDiseases();
        storage = storage.filter(function(d) { return d.id !== disId; });
        saveCustomDiseasesStorage(storage);
        window.DISEASES_DB = window.DISEASES_DB.filter(function(d) { return d.id !== disId; });
        if (typeof showToast === 'function') showToast('🗑️ Deleted');
        window.viewCustomData();
    }

    // ==========================================
    // VIEW ALL CUSTOM DATA (with Edit/Delete)
    // ==========================================
    window.viewCustomData = function() {
        var modal = document.getElementById('viewCustomModal');
        if (!modal) { console.error('Modal #viewCustomModal not found'); return; }

        var cats = getCustomCategories();
        var syms = getCustomSymptoms();
        var dis = getCustomDiseases();
        var esc = typeof escapeHtml === 'function' ? escapeHtml : function(t) { return (t || '').toString().replace(/[<>&"']/g, function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c];}); };

        var html = '';

        // === CATEGORIES ===
        html += '<h4 style="color:#8e44ad;margin:10px 0 8px;">🏷️ Categories (' + Object.keys(cats).length + ')</h4>';
        if (Object.keys(cats).length === 0) {
            html += '<p style="color:#95a5a6;font-size:13px;padding:5px;">کوئی custom category نہیں</p>';
        } else {
            html += '<div style="max-height:180px;overflow-y:auto;background:#f8f9fa;padding:8px;border-radius:6px;margin-bottom:12px;">';
            Object.keys(cats).forEach(function(k) {
                var c = cats[k];
                html += '<div style="padding:6px 8px;border-bottom:1px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center;font-size:13px;gap:8px;">';
                html += '<span style="flex:1;">' + c.icon + ' <strong>' + esc(c.ur) + '</strong> / ' + esc(c.en) + ' <small style="color:#95a5a6;">(' + esc(k) + ')</small></span>';
                html += '<span style="display:flex;gap:4px;">';
                html += '<button class="btn btn-edit btn-xs" onclick="openAddCategoryModal(\'' + k + '\')">✏️</button>';
                html += '<button class="btn btn-danger btn-xs" onclick="deleteCustomCategory(\'' + k + '\')">🗑️</button>';
                html += '</span></div>';
            });
            html += '</div>';
        }

        // === SYMPTOMS ===
        html += '<h4 style="color:#17a2b8;margin:10px 0 8px;">💡 Symptoms (' + Object.keys(syms).length + ')</h4>';
        if (Object.keys(syms).length === 0) {
            html += '<p style="color:#95a5a6;font-size:13px;padding:5px;">کوئی custom symptom نہیں</p>';
        } else {
            html += '<div style="max-height:180px;overflow-y:auto;background:#f8f9fa;padding:8px;border-radius:6px;margin-bottom:12px;">';
            Object.keys(syms).forEach(function(k) {
                var s = syms[k];
                html += '<div style="padding:6px 8px;border-bottom:1px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center;font-size:13px;gap:8px;">';
                html += '<span style="flex:1;">' + (s.severe ? '⚠️' : '•') + ' <strong>' + esc(s.ur) + '</strong> / ' + esc(s.en) + ' <small style="color:#95a5a6;">(' + esc(k) + ')</small></span>';
                html += '<span style="display:flex;gap:4px;">';
                html += '<button class="btn btn-edit btn-xs" onclick="openAddSymptomModal(\'' + k + '\')">✏️</button>';
                html += '<button class="btn btn-danger btn-xs" onclick="deleteCustomSymptom(\'' + k + '\')">🗑️</button>';
                html += '</span></div>';
            });
            html += '</div>';
        }

        // === DISEASES ===
        html += '<h4 style="color:#27ae60;margin:10px 0 8px;">🔬 Diseases (' + dis.length + ')</h4>';
        if (dis.length === 0) {
            html += '<p style="color:#95a5a6;font-size:13px;padding:5px;">کوئی custom disease نہیں</p>';
        } else {
            html += '<div style="max-height:180px;overflow-y:auto;background:#f8f9fa;padding:8px;border-radius:6px;margin-bottom:12px;">';
            dis.forEach(function(d) {
                var dIcon = d.icon || '💊';
                html += '<div style="padding:6px 8px;border-bottom:1px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center;font-size:13px;gap:8px;">';
                html += '<span style="flex:1;">' + dIcon + ' <strong>' + esc(d.name.ur) + '</strong> / ' + esc(d.name.en) + '</span>';
                html += '<span style="display:flex;gap:4px;">';
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

        document.getElementById('customDataContent').innerHTML = html;
        modal.classList.add('active');
    };

    window.closeViewCustomModal = function() {
        var m = document.getElementById('viewCustomModal');
        if (m) m.classList.remove('active');
    };

    // ==========================================
    // EXPORT JSON
    // ==========================================
    window.exportCustomData = function() {
        var data = {
            categories: getCustomCategories(),
            symptoms: getCustomSymptoms(),
            diseases: getCustomDiseases(),
            exportDate: new Date().toISOString(),
            appVersion: '3.0'
        };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'bhc-custom-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
        if (typeof showToast === 'function') showToast('✅ Exported!');
    };

    // ==========================================
    // SMART IMPORT (JSON + CSV Auto-Detect)
    // ==========================================
    window.smartImport = function() {
        var input = document.getElementById('importCustomFile');
        if (!input) {
            if (typeof showToast === 'function') showToast('❌ File input missing', 'error');
            return;
        }
        input.click();
    };

    function handleImportJSON(content) {
        try {
            var data = JSON.parse(content);
            var added = 0;

            if (data.categories) {
                var ec = getCustomCategories();
                Object.assign(ec, data.categories);
                saveCustomCategoriesStorage(ec);
                Object.assign(window.CATEGORIES_DB, data.categories);
                added += Object.keys(data.categories).length;
            }
            if (data.symptoms) {
                var es = getCustomSymptoms();
                Object.assign(es, data.symptoms);
                saveCustomSymptomsStorage(es);
                Object.assign(window.SYMPTOMS_DB, data.symptoms);
                added += Object.keys(data.symptoms).length;
            }
            if (data.diseases && Array.isArray(data.diseases)) {
                var ed = getCustomDiseases();
                data.diseases.forEach(function(d) {
                    if (!ed.find(function(x) { return x.id === d.id; })) ed.push(d);
                    if (!window.DISEASES_DB.find(function(x) { return x.id === d.id; })) window.DISEASES_DB.push(d);
                });
                saveCustomDiseasesStorage(ed);
                added += data.diseases.length;
            }

            if (typeof showToast === 'function') showToast('✅ JSON: ' + added + ' items imported');

            if (document.querySelector('#page-diagnosis.active')) {
                if (typeof renderCategoryTabs === 'function') renderCategoryTabs();
                if (typeof renderSymptomsGrid === 'function') renderSymptomsGrid();
            }
        } catch(err) {
            if (typeof showToast === 'function') showToast('❌ JSON error: ' + err.message, 'error');
        }
    }

    function handleImportCSV(content) {
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
                    var catData = { ur: row.ur, en: row.en, roman: row.roman || row.en, icon: row.icon || '📌' };
                    window.CATEGORIES_DB[row.id] = catData;
                    var cc = getCustomCategories();
                    cc[row.id] = catData;
                    saveCustomCategoriesStorage(cc);
                    added++;
                } else if (row.type === 'symptom' && row.id && row.ur && row.en) {
                    var symData = { ur: row.ur, en: row.en, roman: row.roman || row.en, category: row.category || 'general' };
                    if (row.severe === 'true' || row.severe === '1') symData.severe = true;
                    window.SYMPTOMS_DB[row.id] = symData;
                    var cs = getCustomSymptoms();
                    cs[row.id] = symData;
                    saveCustomSymptomsStorage(cs);
                    added++;
                }
            }

            if (typeof showToast === 'function') showToast('✅ CSV: ' + added + ' items imported');

            if (document.querySelector('#page-diagnosis.active')) {
                if (typeof renderCategoryTabs === 'function') renderCategoryTabs();
                if (typeof renderSymptomsGrid === 'function') renderSymptomsGrid();
            }
        } catch(err) {
            if (typeof showToast === 'function') showToast('❌ CSV error: ' + err.message, 'error');
        }
    }

    // Attach single file input handler (JSON + CSV)
    function attachImportHandler() {
        var input = document.getElementById('importCustomFile');
        if (!input) {
            setTimeout(attachImportHandler, 500);
            return;
        }

        // Remove old listeners by cloning
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
                    if (typeof showToast === 'function') showToast('❌ Only .json or .csv files', 'error');
                }

                newInput.value = '';
            };
            reader.readAsText(file);
        });

        console.log('✅ Import handler attached');
    }

    // ==========================================
    // INITIALIZATION
    // ==========================================
    loadAllCustomData();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(attachImportHandler, 800);
        });
    } else {
        setTimeout(attachImportHandler, 800);
    }

    window.ICON_LIBRARY = ICON_LIBRARY;
    console.log('✅ Custom Data Manager v3 loaded');

})();