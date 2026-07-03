// ==========================================
// Bismillah Clinic - Custom Data Manager
// Full CRUD: Categories, Symptoms, Diseases
// Export/Import: JSON + CSV
// ==========================================

(function() {
    'use strict';

    // ==========================================
    // ICON LIBRARY (Pre-built icons for selection)
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
        { icon: '🧫', label: 'Petri Dish' }
    ];

    // ==========================================
    // STORAGE FUNCTIONS
    // ==========================================
    function getCustomCategories() {
        return JSON.parse(localStorage.getItem('custom_categories') || '{}');
    }
    function saveCustomCategories(data) {
        localStorage.setItem('custom_categories', JSON.stringify(data));
    }
    function getCustomSymptoms() {
        return JSON.parse(localStorage.getItem('custom_symptoms') || '{}');
    }
    function saveCustomSymptoms(data) {
        localStorage.setItem('custom_symptoms', JSON.stringify(data));
    }
    function getCustomDiseases() {
        return JSON.parse(localStorage.getItem('custom_diseases') || '[]');
    }
    function saveCustomDiseases(data) {
        localStorage.setItem('custom_diseases', JSON.stringify(data));
    }

    // ==========================================
    // LOAD CUSTOM DATA ON START
    // ==========================================
    function loadAllCustomData() {
        try {
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

            console.log('✅ Custom data loaded: ' + Object.keys(cats).length + ' cats, ' + Object.keys(syms).length + ' syms, ' + dis.length + ' diseases');
        } catch(e) {
            console.error('Custom data load error:', e);
        }
    }

    // ==========================================
    // ICON PICKER HTML
    // ==========================================
    function renderIconPicker(selectedIcon) {
        var html = '<div style="display:flex;flex-wrap:wrap;gap:4px;max-height:120px;overflow-y:auto;padding:5px;background:#f8f9fa;border-radius:6px;border:1px solid #ddd;">';
        ICON_LIBRARY.forEach(function(item) {
            var sel = (item.icon === selectedIcon) ? 'background:#8e44ad;color:white;' : 'background:white;';
            html += '<button type="button" onclick="selectCategoryIcon(\'' + item.icon + '\')" style="' + sel + 'border:1px solid #ddd;border-radius:6px;padding:6px 8px;cursor:pointer;font-size:18px;min-width:40px;text-align:center;" title="' + item.label + '">' + item.icon + '</button>';
        });
        html += '</div>';
        return html;
    }

    // ==========================================
    // GLOBAL FUNCTIONS (window scope)
    // ==========================================

    // --- SELECT ICON ---
    window.selectCategoryIcon = function(icon) {
        var el = document.getElementById('newCategoryIcon');
        if (el) el.value = icon;
        var container = document.getElementById('iconPickerContainer');
        if (container) container.innerHTML = renderIconPicker(icon);
    };

    // --- CATEGORY: ADD ---
    window.openAddCategoryModal = function(editId) {
        var modal = document.getElementById('addCategoryModal');
        if (!modal) return;

        var isEdit = !!editId;
        var cat = isEdit ? window.CATEGORIES_DB[editId] : null;

        document.getElementById('editCategoryOldId').value = isEdit ? editId : '';
        document.getElementById('newCategoryId').value = isEdit ? editId : '';
        document.getElementById('newCategoryUr').value = isEdit && cat ? cat.ur : '';
        document.getElementById('newCategoryEn').value = isEdit && cat ? cat.en : '';
        document.getElementById('newCategoryRoman').value = isEdit && cat ? cat.roman : '';
        document.getElementById('newCategoryIcon').value = isEdit && cat ? cat.icon : '📌';

        if (isEdit) {
            document.getElementById('newCategoryId').readOnly = true;
            document.getElementById('newCategoryId').style.background = '#ecf0f1';
        } else {
            document.getElementById('newCategoryId').readOnly = false;
            document.getElementById('newCategoryId').style.background = '';
        }

        document.getElementById('iconPickerContainer').innerHTML = renderIconPicker(isEdit && cat ? cat.icon : '📌');
        document.getElementById('addCategoryMsg').innerHTML = '';
        document.getElementById('addCategoryTitle').textContent = isEdit ? '✏️ Edit Category' : '➕ Add Category';

        modal.classList.add('active');
    };

    window.closeAddCategoryModal = function() {
        document.getElementById('addCategoryModal').classList.remove('active');
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

        if (!id) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID required</div>'; return; }
        if (!ur || !en) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ Urdu & English names required</div>'; return; }
        if (!isEdit && window.CATEGORIES_DB[id]) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID already exists</div>'; return; }

        var newCat = { ur: ur, en: en, roman: roman || en, icon: icon };
        window.CATEGORIES_DB[id] = newCat;

        var custom = getCustomCategories();
        custom[id] = newCat;
        saveCustomCategories(custom);

        msgDiv.innerHTML = '<div class="alert alert-success">✅ Saved!</div>';
        if (typeof showToast === 'function') showToast('✅ Category: ' + en);

        if (document.querySelector('#page-diagnosis.active') && typeof renderCategoryTabs === 'function') {
            renderCategoryTabs();
        }

        setTimeout(window.closeAddCategoryModal, 1000);
    };

    // --- CATEGORY: DELETE ---
    window.deleteCustomCategory = function(catId) {
        if (typeof showConfirm === 'function') {
            showConfirm('Delete category <b>' + catId + '</b>?', function() {
                var custom = getCustomCategories();
                delete custom[catId];
                saveCustomCategories(custom);
                delete window.CATEGORIES_DB[catId];
                if (typeof showToast === 'function') showToast('🗑️ Deleted');
                window.viewCustomData();
                if (document.querySelector('#page-diagnosis.active') && typeof renderCategoryTabs === 'function') {
                    renderCategoryTabs();
                }
            });
        }
    };

    // --- SYMPTOM: ADD ---
    window.openAddSymptomModal = function(editId) {
        var modal = document.getElementById('addSymptomModal');
        if (!modal) return;

        var isEdit = !!editId;
        var sym = isEdit ? window.SYMPTOMS_DB[editId] : null;

        document.getElementById('editSymptomOldId').value = isEdit ? editId : '';
        document.getElementById('newSymptomId').value = isEdit ? editId : '';
        document.getElementById('newSymptomUr').value = isEdit && sym ? sym.ur : '';
        document.getElementById('newSymptomEn').value = isEdit && sym ? sym.en : '';
        document.getElementById('newSymptomRoman').value = isEdit && sym ? sym.roman : '';
        document.getElementById('newSymptomCategory').value = isEdit && sym ? sym.category : 'general';
        document.getElementById('newSymptomSevere').checked = isEdit && sym ? !!sym.severe : false;

        if (isEdit) {
            document.getElementById('newSymptomId').readOnly = true;
            document.getElementById('newSymptomId').style.background = '#ecf0f1';
        } else {
            document.getElementById('newSymptomId').readOnly = false;
            document.getElementById('newSymptomId').style.background = '';
        }

        // Build category dropdown
        var catSelect = document.getElementById('newSymptomCategory');
        catSelect.innerHTML = '';
        Object.keys(window.CATEGORIES_DB).forEach(function(k) {
            if (k === 'all' || k === 'special') return;
            var opt = document.createElement('option');
            opt.value = k;
            opt.textContent = window.CATEGORIES_DB[k].icon + ' ' + window.CATEGORIES_DB[k].en;
            if (isEdit && sym && sym.category === k) opt.selected = true;
            catSelect.appendChild(opt);
        });

        document.getElementById('addSymptomMsg').innerHTML = '';
        document.getElementById('addSymptomTitle').textContent = isEdit ? '✏️ Edit Symptom' : '➕ Add Symptom';
        modal.classList.add('active');
    };

    window.closeAddSymptomModal = function() {
        document.getElementById('addSymptomModal').classList.remove('active');
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

        if (!id || !ur || !en) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID, Urdu & English required</div>'; return; }
        if (!isEdit && window.SYMPTOMS_DB[id]) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID exists</div>'; return; }

        var newSym = { ur: ur, en: en, roman: roman || en, category: category };
        if (severe) newSym.severe = true;

        window.SYMPTOMS_DB[id] = newSym;
        var custom = getCustomSymptoms();
        custom[id] = newSym;
        saveCustomSymptoms(custom);

        msgDiv.innerHTML = '<div class="alert alert-success">✅ Saved!</div>';
        if (typeof showToast === 'function') showToast('✅ Symptom: ' + en);

        if (document.querySelector('#page-diagnosis.active') && typeof renderSymptomsGrid === 'function') {
            renderSymptomsGrid();
        }

        setTimeout(window.closeAddSymptomModal, 1000);
    };

    window.deleteCustomSymptom = function(symId) {
        if (typeof showConfirm === 'function') {
            showConfirm('Delete symptom <b>' + symId + '</b>?', function() {
                var custom = getCustomSymptoms();
                delete custom[symId];
                saveCustomSymptoms(custom);
                delete window.SYMPTOMS_DB[symId];
                if (typeof showToast === 'function') showToast('🗑️ Deleted');
                window.viewCustomData();
            });
        }
    };

    // --- DISEASE: ADD ---
    window.openAddDiseaseModal = function(editId) {
        var modal = document.getElementById('addDiseaseModal');
        if (!modal) return;

        var isEdit = !!editId;
        var dis = isEdit ? window.DISEASES_DB.find(function(d) { return d.id === editId; }) : null;

        document.getElementById('editDiseaseOldId').value = isEdit ? editId : '';
        document.getElementById('newDiseaseId').value = isEdit ? editId : '';
        document.getElementById('newDiseaseUr').value = isEdit && dis ? dis.name.ur : '';
        document.getElementById('newDiseaseEn').value = isEdit && dis ? dis.name.en : '';
        document.getElementById('newDiseaseRoman').value = isEdit && dis ? dis.name.roman : '';
        document.getElementById('newDiseaseCategory').value = isEdit && dis ? dis.category : 'general';
        document.getElementById('newDiseaseSymptoms').value = isEdit && dis ? dis.symptoms.join(', ') : '';
        document.getElementById('newDiseaseKeySymptoms').value = isEdit && dis ? dis.keySymptoms.join(', ') : '';
        document.getElementById('newDiseaseTests').value = isEdit && dis ? dis.tests.map(function(t) { return t.en; }).join('\n') : '';
        document.getElementById('newDiseaseRedFlags').value = isEdit && dis ? dis.redFlags.join(', ') : '';
        document.getElementById('newDiseaseRemedies').value = isEdit && dis ? dis.remedies.map(function(r) { return r.name + ' | ' + r.use.en + ' | ' + r.dose; }).join('\n') : '';
        document.getElementById('newDiseaseAdviceUr').value = isEdit && dis && dis.advice ? dis.advice.ur : '';
        document.getElementById('newDiseaseAdviceEn').value = isEdit && dis && dis.advice ? dis.advice.en : '';

        if (isEdit) {
            document.getElementById('newDiseaseId').readOnly = true;
            document.getElementById('newDiseaseId').style.background = '#ecf0f1';
        } else {
            document.getElementById('newDiseaseId').readOnly = false;
            document.getElementById('newDiseaseId').style.background = '';
        }

        // Build category dropdown
        var catSelect = document.getElementById('newDiseaseCategory');
        catSelect.innerHTML = '';
        Object.keys(window.CATEGORIES_DB).forEach(function(k) {
            if (k === 'all' || k === 'special') return;
            var opt = document.createElement('option');
            opt.value = k;
            opt.textContent = window.CATEGORIES_DB[k].icon + ' ' + window.CATEGORIES_DB[k].en;
            if (isEdit && dis && dis.category === k) opt.selected = true;
            catSelect.appendChild(opt);
        });

        document.getElementById('addDiseaseMsg').innerHTML = '';
        document.getElementById('addDiseaseTitle').textContent = isEdit ? '✏️ Edit Disease' : '➕ Add Disease';
        modal.classList.add('active');
    };

    window.closeAddDiseaseModal = function() {
        document.getElementById('addDiseaseModal').classList.remove('active');
    };

    window.saveNewDisease = function() {
        var oldId = document.getElementById('editDiseaseOldId').value;
        var isEdit = !!oldId;
        var id = document.getElementById('newDiseaseId').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
        var ur = document.getElementById('newDiseaseUr').value.trim();
        var en = document.getElementById('newDiseaseEn').value.trim();
        var roman = document.getElementById('newDiseaseRoman').value.trim();
        var category = document.getElementById('newDiseaseCategory').value;
        var symptomsStr = document.getElementById('newDiseaseSymptoms').value.trim();
        var keySymptomsStr = document.getElementById('newDiseaseKeySymptoms').value.trim();
        var testsStr = document.getElementById('newDiseaseTests').value.trim();
        var redFlagsStr = document.getElementById('newDiseaseRedFlags').value.trim();
        var remediesStr = document.getElementById('newDiseaseRemedies').value.trim();
        var adviceUr = document.getElementById('newDiseaseAdviceUr').value.trim();
        var adviceEn = document.getElementById('newDiseaseAdviceEn').value.trim();
        var msgDiv = document.getElementById('addDiseaseMsg');

        if (!id || !ur || !en) { msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID, Urdu & English required</div>'; return; }

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
                msgDiv.innerHTML = '<div class="alert alert-error">⚠️ ID exists</div>';
                return;
            }
            window.DISEASES_DB.push(newDisease);
        }

        var custom = getCustomDiseases();
        var cIdx = custom.findIndex(function(d) { return d.id === id; });
        if (cIdx >= 0) custom[cIdx] = newDisease;
        else custom.push(newDisease);
        saveCustomDiseases(custom);

        msgDiv.innerHTML = '<div class="alert alert-success">✅ Saved!</div>';
        if (typeof showToast === 'function') showToast('✅ Disease: ' + en);

        setTimeout(window.closeAddDiseaseModal, 1000);
    };

    window.deleteCustomDisease = function(disId) {
        if (typeof showConfirm === 'function') {
            showConfirm('Delete disease <b>' + disId + '</b>?', function() {
                var custom = getCustomDiseases();
                custom = custom.filter(function(d) { return d.id !== disId; });
                saveCustomDiseases(custom);
                window.DISEASES_DB = window.DISEASES_DB.filter(function(d) { return d.id !== disId; });
                if (typeof showToast === 'function') showToast('🗑️ Deleted');
                window.viewCustomData();
            });
        }
    };

    // --- VIEW ALL CUSTOM DATA ---
    window.viewCustomData = function() {
        var cats = getCustomCategories();
        var syms = getCustomSymptoms();
        var dis = getCustomDiseases();
        var esc = typeof escapeHtml === 'function' ? escapeHtml : function(t) { return t || ''; };

        var html = '';

        // Categories
        html += '<h4 style="color:#8e44ad;margin:10px 0;">🏷️ Categories (' + Object.keys(cats).length + ')</h4>';
        if (Object.keys(cats).length === 0) {
            html += '<p style="color:#95a5a6;font-size:13px;">No custom categories</p>';
        } else {
            html += '<div style="max-height:180px;overflow-y:auto;background:#f8f9fa;padding:8px;border-radius:6px;margin-bottom:10px;">';
            Object.keys(cats).forEach(function(k) {
                var c = cats[k];
                html += '<div style="padding:6px;border-bottom:1px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center;font-size:13px;">';
                html += '<span>' + c.icon + ' <strong>' + esc(c.ur) + '</strong> / ' + esc(c.en) + ' <small style="color:#95a5a6;">(' + k + ')</small></span>';
                html += '<span><button class="btn btn-edit btn-xs" onclick="openAddCategoryModal(\'' + k + '\')">✏️</button> ';
                html += '<button class="btn btn-danger btn-xs" onclick="deleteCustomCategory(\'' + k + '\')">🗑️</button></span>';
                html += '</div>';
            });
            html += '</div>';
        }

        // Symptoms
        html += '<h4 style="color:#17a2b8;margin:10px 0;">💡 Symptoms (' + Object.keys(syms).length + ')</h4>';
        if (Object.keys(syms).length === 0) {
            html += '<p style="color:#95a5a6;font-size:13px;">No custom symptoms</p>';
        } else {
            html += '<div style="max-height:180px;overflow-y:auto;background:#f8f9fa;padding:8px;border-radius:6px;margin-bottom:10px;">';
            Object.keys(syms).forEach(function(k) {
                var s = syms[k];
                html += '<div style="padding:5px;border-bottom:1px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center;font-size:13px;">';
                html += '<span>' + (s.severe ? '⚠️' : '•') + ' ' + esc(s.ur) + ' (' + esc(s.en) + ')</span>';
                html += '<span><button class="btn btn-edit btn-xs" onclick="openAddSymptomModal(\'' + k + '\')">✏️</button> ';
                html += '<button class="btn btn-danger btn-xs" onclick="deleteCustomSymptom(\'' + k + '\')">🗑️</button></span>';
                html += '</div>';
            });
            html += '</div>';
        }

        // Diseases
        html += '<h4 style="color:#27ae60;margin:10px 0;">🔬 Diseases (' + dis.length + ')</h4>';
        if (dis.length === 0) {
            html += '<p style="color:#95a5a6;font-size:13px;">No custom diseases</p>';
        } else {
            html += '<div style="max-height:180px;overflow-y:auto;background:#f8f9fa;padding:8px;border-radius:6px;margin-bottom:10px;">';
            dis.forEach(function(d) {
                html += '<div style="padding:5px;border-bottom:1px solid #ecf0f1;display:flex;justify-content:space-between;align-items:center;font-size:13px;">';
                html += '<span>• ' + esc(d.name.ur) + ' (' + esc(d.name.en) + ')</span>';
                html += '<span><button class="btn btn-edit btn-xs" onclick="openAddDiseaseModal(\'' + d.id + '\')">✏️</button> ';
                html += '<button class="btn btn-danger btn-xs" onclick="deleteCustomDisease(\'' + d.id + '\')">🗑️</button></span>';
                html += '</div>';
            });
            html += '</div>';
        }

        // Totals
        html += '<div style="margin-top:12px;padding:10px;background:#d1ecf1;border-radius:6px;font-size:12px;">';
        html += '📊 <strong>Total:</strong> Categories: ' + Object.keys(window.CATEGORIES_DB).length;
        html += ' | Symptoms: ' + Object.keys(window.SYMPTOMS_DB).length;
        html += ' | Diseases: ' + window.DISEASES_DB.length;
        html += '</div>';

        document.getElementById('customDataContent').innerHTML = html;
        document.getElementById('viewCustomModal').classList.add('active');
    };

    window.closeViewCustomModal = function() {
        document.getElementById('viewCustomModal').classList.remove('active');
    };

    // --- EXPORT ---
    window.exportCustomData = function() {
        var data = {
            categories: getCustomCategories(),
            symptoms: getCustomSymptoms(),
            diseases: getCustomDiseases(),
            exportDate: new Date().toISOString(),
            appVersion: '2.0'
        };
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'clinic-custom-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
        if (typeof showToast === 'function') showToast('✅ Exported!');
    };

    // --- IMPORT JSON ---
    window.importCustomData = function() {
        document.getElementById('importCustomFile').click();
    };

    // --- IMPORT CSV ---
    window.importCSVData = function() {
        document.getElementById('importCSVFile').click();
    };

    window.handleCSVImport = function(file) {
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var lines = e.target.result.split('\n');
                if (lines.length < 2) { if (typeof showToast === 'function') showToast('❌ Empty CSV', 'error'); return; }

                var headers = lines[0].split(',').map(function(h) { return h.trim().toLowerCase(); });
                var added = 0;

                for (var i = 1; i < lines.length; i++) {
                    var line = lines[i].trim();
                    if (!line) continue;

                    var values = line.split(',').map(function(v) { return v.trim().replace(/^"|"$/g, ''); });
                    var row = {};
                    headers.forEach(function(h, idx) { row[h] = values[idx] || ''; });

                    // Detect type
                    if (row.type === 'category' && row.id && row.ur && row.en) {
                        var catData = { ur: row.ur, en: row.en, roman: row.roman || row.en, icon: row.icon || '📌' };
                        window.CATEGORIES_DB[row.id] = catData;
                        var cc = getCustomCategories();
                        cc[row.id] = catData;
                        saveCustomCategories(cc);
                        added++;
                    } else if (row.type === 'symptom' && row.id && row.ur && row.en) {
                        var symData = { ur: row.ur, en: row.en, roman: row.roman || row.en, category: row.category || 'general' };
                        if (row.severe === 'true') symData.severe = true;
                        window.SYMPTOMS_DB[row.id] = symData;
                        var cs = getCustomSymptoms();
                        cs[row.id] = symData;
                        saveCustomSymptoms(cs);
                        added++;
                    }
                }

                if (typeof showToast === 'function') showToast('✅ CSV imported: ' + added + ' items');
            } catch(err) {
                if (typeof showToast === 'function') showToast('❌ CSV error: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    };

    // --- FILE INPUT HANDLERS ---
    setTimeout(function() {
        var jsonInput = document.getElementById('importCustomFile');
        if (jsonInput) {
            jsonInput.addEventListener('change', function(e) {
                var file = e.target.files[0];
                if (!file) return;
                var reader = new FileReader();
                reader.onload = function(ev) {
                    try {
                        var data = JSON.parse(ev.target.result);
                        if (data.categories) {
                            var ec = getCustomCategories();
                            Object.assign(ec, data.categories);
                            saveCustomCategories(ec);
                            Object.assign(window.CATEGORIES_DB, data.categories);
                        }
                        if (data.symptoms) {
                            var es = getCustomSymptoms();
                            Object.assign(es, data.symptoms);
                            saveCustomSymptoms(es);
                            Object.assign(window.SYMPTOMS_DB, data.symptoms);
                        }
                        if (data.diseases) {
                            var ed = getCustomDiseases();
                            data.diseases.forEach(function(d) {
                                if (!ed.find(function(x) { return x.id === d.id; })) ed.push(d);
                                if (!window.DISEASES_DB.find(function(x) { return x.id === d.id; })) window.DISEASES_DB.push(d);
                            });
                            saveCustomDiseases(ed);
                        }
                        if (typeof showToast === 'function') showToast('✅ JSON imported!');
                    } catch(err) {
                        if (typeof showToast === 'function') showToast('❌ Error: ' + err.message, 'error');
                    }
                };
                reader.readAsText(file);
                jsonInput.value = '';
            });
        }

        var csvInput = document.getElementById('importCSVFile');
        if (csvInput) {
            csvInput.addEventListener('change', function(e) {
                var file = e.target.files[0];
                if (file) window.handleCSVImport(file);
                csvInput.value = '';
            });
        }
    }, 1000);

    // --- LOAD ON START ---
    loadAllCustomData();

    // Make icon library available
    window.ICON_LIBRARY = ICON_LIBRARY;

    console.log('✅ Custom Data Manager loaded');

})();