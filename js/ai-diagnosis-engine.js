/* Bismillah Clinic — js/ai-diagnosis-engine.js
   Smart AI Homeopathic Diagnosis Assistant Module */

const AI_SERVER_URL = "http://localhost:8000";

const AIState = {
    step: 1,
    chief_complaint: "",
    case_type: "🔴 حاد (Acute)",
    search_mode: "books", // 'books' or 'ai'
    categories: [],
    selected_answers: [],
    extra_notes: "",
    candidate_remedies: [],
    diff_categories: [],
    final_prescription: "",
    sources: []
};

function openAIDiagnosisModal() {
    if (typeof switchDxView === "function") switchDxView("ai");
    else renderAIStep();
}

function closeAIDiagnosisModal() {
    const leftover = document.getElementById("ai-modal-overlay");
    if (leftover) leftover.classList.remove("active");
    if (typeof switchDxView === "function") switchDxView("studio");
}

function renderAIStep() {
    const root = document.getElementById("ai-page-root");
    if (!root) return;

    root.innerHTML = `
        <div class="card-title">🩺 Bismillah Clinic — AI Homeopathic Diagnosis Studio</div>
        <div class="disease-suggest-panel" style="display: flex; gap: 10px; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 12px;">
            <div>
                <label style="font-weight: bold; margin-right: 5px;">تلاش کا طریقہ (Search Mode):</label>
                <select id="ai-search-mode" onchange="AIState.search_mode = this.value;" class="btn btn-sm btn-light">
                    <option value="books" ${AIState.search_mode === 'books' ? 'selected' : ''}>📚 کتب موڈ (Local Books Only)</option>
                    <option value="ai" ${AIState.search_mode === 'ai' ? 'selected' : ''}>🧠 AI موڈ (Gemini Knowledge)</option>
                </select>
            </div>
            <div>
                <label style="font-weight: bold; margin-right: 5px;">نوعیت (Case Type):</label>
                <select id="ai-case-type" onchange="AIState.case_type = this.value;" class="btn btn-sm btn-light">
                    <option value="🔴 حاد (Acute)" ${AIState.case_type.includes('حاد') ? 'selected' : ''}>🔴 حاد (Acute)</option>
                    <option value="🔵 مزمن (Chronic)" ${AIState.case_type.includes('مزمن') ? 'selected' : ''}>🔵 مزمن (Chronic)</option>
                </select>
            </div>
        </div>
        <div id="ai-step-body"></div>
    `;
    const body = document.getElementById("ai-step-body");
    if (AIState.step === 1) renderAIStep1(body);
    else if (AIState.step === 2) renderAIStep2(body);
    else if (AIState.step === 3) renderAIStep3(body);
}

// STEP 1 UI
function renderAIStep1(container) {
    container.innerHTML = `
        <div class="card">
            <div class="card-title">📋 مرحلہ 1: بنیادی شکایت (Chief Complaint)</div>
            <div class="form-group">
                <label>مریض کی بنیادی تکلیف کیا ہے؟</label>
                <textarea id="ai-chief-input" placeholder="مثال: کھانسی، بخار، پیٹ درد، جلد پر خارش..." style="min-height: 90px; direction: rtl;">${AIState.chief_complaint}</textarea>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn btn-purple" onclick="startAICaseTaking()">
                    🚀 پوچھ گچھ شروع کریں (Start Case Taking)
                </button>
            </div>
        </div>
    `;
}

// STEP 2 UI (Clickable Option Chips)
function renderAIStep2(container) {
    let catsHtml = "";
    AIState.categories.forEach((cat, idx) => {
        catsHtml += `<div style="margin-bottom: 12px;">
            <div style="font-weight: bold; color: #1a5276; margin-bottom: 5px;">📂 ${cat.category}</div>
            <div class="tst-kw">`;
        
        cat.options.forEach(opt => {
            const isSel = AIState.selected_answers.includes(opt);
            catsHtml += `<span class="${isSel ? 'sel' : ''}" onclick="toggleAIAnswer('${opt.replace(/'/g, "\\'")}')">${isSel ? '✅ ' : ''}${opt}</span>`;
        });
        
        catsHtml += `</div></div>`;
    });

    let selectedChips = "";
    AIState.selected_answers.forEach(ans => {
        selectedChips += `<span class="selected-chip" onclick="toggleAIAnswer('${ans.replace(/'/g, "\\'")}')">${ans}</span>`;
    });

    container.innerHTML = `
        <div class="card">
            <div class="card-title">🔍 مرحلہ 2: کیس ٹیکنگ (سوالات پر کلک کر کے جواب منتخب کریں)</div>
            <div style="margin-bottom: 10px; font-size: 13px; color: #555;"><b>بنیادی شکایت:</b> ${AIState.chief_complaint}</div>
            
            ${catsHtml}
            
            <div class="section-divider">✅ منتخب شدہ جوابات</div>
            <div class="selected-symptoms-box">
                ${selectedChips || '<span style="color:#999; font-size:12px;">ابھی کوئی آپشن منتخب نہیں کیا گیا...</span>'}
            </div>

            <div class="form-group">
                <label>اضافی نوٹ (اختیاری):</label>
                <textarea id="ai-extra-notes" onchange="AIState.extra_notes = this.value" placeholder="جو تفصیل بٹنوں میں نہ ہو، یہاں لکھیں...">${AIState.extra_notes}</textarea>
            </div>

            <div style="display: flex; justify-content: space-between; gap: 10px; margin-top: 15px;">
                <button class="btn btn-light" onclick="AIState.step = 1; renderAIStep();">⬅️ پیچھے</button>
                <button class="btn btn-primary" onclick="submitAIStep2()">ادویات کی تلاش اور تفریقی تشخیص ➔</button>
            </div>
        </div>
    `;
}

// STEP 3 UI (Prescription & Auto-fill)
function renderAIStep3(container) {
    let remediesHtml = "";
    AIState.candidate_remedies.forEach((rem, i) => {
        remediesHtml += `
        <div class="remedy-item">
            <div class="remedy-name">${i + 1}. ${rem.remedy} (${rem.urdu_name || ''})</div>
            <div class="remedy-use"><b>وجہ:</b> ${rem.why}</div>
            <div class="remedy-dose"><b>کلیدی نکات:</b> ${Array.isArray(rem.keynotes) ? rem.keynotes.join(' • ') : rem.keynotes}</div>
            ${rem.source ? `<div style="font-size:10px; color:#17a2b8;">📖 ${rem.source}</div>` : ''}
        </div>`;
    });

    let diffHtml = "";
    AIState.diff_categories.forEach((cat, idx) => {
        diffHtml += `<div style="margin-bottom: 10px;">
            <div style="font-weight: bold; color: #8e44ad; margin-bottom: 4px;">⚖️ ${cat.category}</div>
            <div class="tst-kw">`;
        cat.options.forEach(opt => {
            const isSel = AIState.selected_answers.includes(opt);
            diffHtml += `<span class="${isSel ? 'sel' : ''}" onclick="toggleAIAnswer('${opt.replace(/'/g, "\\'")}')">${isSel ? '✅ ' : ''}${opt}</span>`;
        });
        diffHtml += `</div></div>`;
    });

    let sourcesTags = "";
    AIState.sources.forEach(s => {
        sourcesTags += `<span class="test-item">📖 ${s.book} (ص ${s.page})</span> `;
    });

    container.innerHTML = `
        <div class="card">
            <div class="card-title">🌿 مرحلہ 3: تفریقی تشخیص اور حتمی نسخہ</div>
            
            <div class="form-row">
                <div>
                    <h4>ممکنہ ادویات (Candidate Remedies)</h4>
                    ${remediesHtml || '<p style="color:#999;">کوئی ادویات نہیں ملیں</p>'}
                </div>
                <div>
                    <h4>تفریقی سوالات (درست دوائی چننے کے لیے)</h4>
                    ${diffHtml}
                </div>
            </div>

            <div style="margin-top: 15px; text-align: center;">
                <button class="btn btn-success btn-lg" onclick="generateAIFinalPrescription()">
                    ✅ حتمی نسخہ تجویز کریں (Generate Final Prescription)
                </button>
            </div>

            ${AIState.final_prescription ? `
            <div class="advice-box" style="margin-top: 20px; font-size: 14px; direction: rtl; white-space: pre-wrap;">
                <h3 style="color: #1e8449;">📋 حتمی نسخہ (Final Prescription)</h3>
                ${AIState.final_prescription}
                
                <hr>
                <div><b>📚 استعمال شدہ کتابی حوالے:</b><br>${sourcesTags}</div>
                
                <div style="margin-top: 15px; text-align: left;">
                    <button class="btn btn-purple" onclick="autoFillClinicPrescription()">
                        📋 کلینک فارم میں آٹو سیو کریں (Auto-Fill Clinic Form)
                    </button>
                </div>
            </div>
            ` : ''}

            <div style="display: flex; justify-content: space-between; margin-top: 15px;">
                <button class="btn btn-light" onclick="AIState.step = 2; renderAIStep();">⬅️ پیچھے</button>
                <button class="btn btn-danger" onclick="resetAIState(); renderAIStep();">🔄 نیا کیس</button>
            </div>
        </div>
    `;
}

// TOGGLE ANSWER CLICK
function toggleAIAnswer(ans) {
    const idx = AIState.selected_answers.indexOf(ans);
    if (idx > -1) {
        AIState.selected_answers.splice(idx, 1);
    } else {
        AIState.selected_answers.push(ans);
    }
    renderAIStep();
}

// API CALLS
async function startAICaseTaking() {
    const input = document.getElementById("ai-chief-input");
    if (!input || !input.value.trim()) {
        alert("براہ کرم بنیادی شکایت درج کریں۔");
        return;
    }
    AIState.chief_complaint = input.value.trim();

    showAILoader("کیس ٹیکنگ کے سوالات تیار ہو رہے ہیں...");
    try {
        const res = await fetch(`${AI_SERVER_URL}/api/ai/step1-categories`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chief_complaint: AIState.chief_complaint,
                case_type: AIState.case_type,
                search_mode: AIState.search_mode
            })
        });
        const data = await res.json();
        hideAILoader();
        if (res.ok) {
            AIState.categories = data.categories;
            AIState.step = 2;
            renderAIStep();
        } else {
            alert(data.detail || "ایرر آیا");
        }
    } catch (err) {
        hideAILoader();
        alert("پائتھن AI سرور سے کنکشن نہیں ہو سکا۔ یقینی بنائیں کہ server.py چل رہا ہے۔");
    }
}

async function submitAIStep2() {
    const notesInput = document.getElementById("ai-extra-notes");
    if (notesInput) AIState.extra_notes = notesInput.value;

    if (AIState.selected_answers.length === 0 && !AIState.extra_notes) {
        alert("کم از کم کچھ علامات یا نوٹس درج کریں۔");
        return;
    }

    showAILoader("کتابوں سے ادویات کی تلاش اور تفریقی سوالات تیار ہو رہے ہیں...");
    try {
        const res = await fetch(`${AI_SERVER_URL}/api/ai/step2-candidates`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chief_complaint: AIState.chief_complaint,
                case_type: AIState.case_type,
                selected_answers: AIState.selected_answers,
                extra_notes: AIState.extra_notes,
                search_mode: AIState.search_mode
            })
        });
        const data = await res.json();
        hideAILoader();
        if (res.ok) {
            AIState.candidate_remedies = data.candidates;
            AIState.diff_categories = data.diff_categories;
            AIState.sources = data.sources;
            AIState.step = 3;
            renderAIStep();
        } else {
            alert(data.detail || "ایرر آیا");
        }
    } catch (err) {
        hideAILoader();
        alert("سرور ایرر!");
    }
}

async function generateAIFinalPrescription() {
    showAILoader("میٹیریا میڈیکا سے تصدیق اور حتمی نسخہ تیار ہو رہا ہے...");
    try {
        const res = await fetch(`${AI_SERVER_URL}/api/ai/step3-prescription`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chief_complaint: AIState.chief_complaint,
                case_type: AIState.case_type,
                selected_answers: AIState.selected_answers,
                extra_notes: AIState.extra_notes,
                candidate_remedies: AIState.candidate_remedies,
                search_mode: AIState.search_mode
            })
        });
        const data = await res.json();
        hideAILoader();
        if (res.ok) {
            AIState.final_prescription = data.prescription;
            AIState.sources = data.sources;
            renderAIStep();
        } else {
            alert(data.detail || "ایرر آیا");
        }
    } catch (err) {
        hideAILoader();
        alert("سرور ایرر!");
    }
}

// Auto-fill into Bismillah Clinic Patient Form
function autoFillClinicPrescription() {
    // Search for clinic app's symptoms or diagnosis textareas
    const symptomsField = document.querySelector("textarea[name='symptoms'], #symptoms, .tst-note");
    const diagnosisField = document.querySelector("textarea[name='diagnosis'], #diagnosis");

    if (symptomsField) {
        symptomsField.value = `[AI Chief]: ${AIState.chief_complaint}\n[Symptoms]: ${AIState.selected_answers.join(", ")}`;
    }
    if (diagnosisField && AIState.final_prescription) {
        diagnosisField.value = AIState.final_prescription;
    }

    alert("✅ AI کا نسخہ اور علامات مریض کے کلینک فارم میں آٹو فل (Auto-fill) ہو گئی ہیں!");
    closeAIDiagnosisModal();
}

function resetAIState() {
    AIState.step = 1;
    AIState.chief_complaint = "";
    AIState.categories = [];
    AIState.selected_answers = [];
    AIState.extra_notes = "";
    AIState.candidate_remedies = [];
    AIState.diff_categories = [];
    AIState.final_prescription = "";
}

function showAILoader(msg) {
    let loader = document.getElementById("ai-loader");
    if (!loader) {
        loader = document.createElement("div");
        loader.id = "ai-loader";
        loader.className = "loading-overlay active";
        loader.innerHTML = `<div style="text-align:center;"><div class="spinner"></div><p style="margin-top:10px; font-weight:bold; color:#1a5276;">${msg}</p></div>`;
        document.body.appendChild(loader);
    } else {
        loader.querySelector("p").innerText = msg;
        loader.classList.add("active");
    }
}

function hideAILoader() {
    const loader = document.getElementById("ai-loader");
    if (loader) loader.classList.remove("active");
}
