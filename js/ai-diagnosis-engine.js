/* Bismillah Homeopathic Clinic — js/ai-diagnosis-engine.js
   Streamlit Cloud Embedded AI Diagnosis Assistant Module */

// 🔗 یہاں اپنا Streamlit Cloud کا لائیو لنک درج کریں (آخر میں ?embed=true لازمی رہے)
const STREAMLIT_APP_URL = "https://bismillah-clinic-idanvfsabizt3qdx93yhkk.streamlit.app/?embed=true";

// 1. Modal Open
function openAIDiagnosisModal() {
    let overlay = document.getElementById("ai-modal-overlay");
    if (!overlay) {
        overlay = document.createElement("div");
        overlay.id = "ai-modal-overlay";
        overlay.className = "modal-overlay active";
        document.body.appendChild(overlay);
    }
    overlay.classList.add("active");
    renderAIStreamlitFrame();
}

// 2. Modal Close
function closeAIDiagnosisModal() {
    const overlay = document.getElementById("ai-modal-overlay");
    if (overlay) overlay.classList.remove("active");
}

// 3. Render Streamlit inside Clinic Iframe
function renderAIStreamlitFrame() {
    const overlay = document.getElementById("ai-modal-overlay");
    if (!overlay) return;

    overlay.innerHTML = `
    <div class="modal" style="max-width: 1050px; width: 95%; height: 88vh; padding: 15px; display: flex; flex-direction: column; font-family: 'Segoe UI', 'Noto Nastaliq Urdu', sans-serif;">
        <!-- Header -->
        <div class="modal-title" style="margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #ecf0f1; padding-bottom: 6px;">
            <span style="color: #1a5276; font-weight: bold; font-size: 17px;">
                🩺 Bismillah Homeopathic Clinic — AI Diagnosis Studio
            </span>
            <button class="modal-close" onclick="closeAIDiagnosisModal()">&times;</button>
        </div>
        
        <!-- Streamlit Embedded App Iframe -->
        <div style="flex: 1; width: 100%; height: 100%; overflow: hidden; border-radius: 8px; border: 1px solid #ddd;">
            <iframe src="${STREAMLIT_APP_URL}" width="100%" height="100%" style="border: none; width: 100%; height: 100%;"></iframe>
        </div>
    </div>
    `;
}
