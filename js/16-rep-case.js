// ============================================================
// Bismillah Clinic — js/16-rep-case.js
// 🔑 v95: 📋 ریپرٹری کا کیس مریض کی وزٹ کے ساتھ محفوظ کرنا
//
//   مسئلہ: آج آپ ربرکس جمع کر کے تجزیہ کرتے ہیں، مگر کل فالو اپ پر وہ کہیں نظر نہیں آتا۔
//   کیس کی تاریخ ادھوری رہ جاتی ہے۔
//
//   حل: کلپ بورڈ (سب بورڈ، ویٹ سمیت) اور تجزیے کی سرِفہرست دوائیں ایک «سنیپ شاٹ» میں
//        محفوظ ہو کر وزٹ کے ساتھ جڑ جاتی ہیں۔ بعد میں ایک کلک سے واپس ریپرٹری میں کھل جاتی ہیں۔
//
//   ⚠ ڈیٹا بیس کا خانہ (Supabase column) نہیں بنایا گیا — سنیپ شاٹ **اسی آلے پر**
//     localStorage میں رہتا ہے، وزٹ کی آئی ڈی کے ساتھ۔ اس لیے:
//       • آف لائن مکمل کام کرتا ہے
//       • کوئی اسکیما تبدیلی نہیں، وزٹ محفوظ کرنے کا پرانا راستہ بالکل نہیں چھیڑا گیا
//       • بیک اپ/ریسٹور کے ساتھ یہ بھی جاتا ہے (repCaseExportAll / repCaseImportAll)
// ============================================================

var REP_CASE_KEY = 'bc_visit_cases_v1';
var _repCaseStore = null;

function repCaseLoad() {
    if (_repCaseStore) return _repCaseStore;
    try { _repCaseStore = JSON.parse(localStorage.getItem(REP_CASE_KEY) || '{}') || {}; }
    catch (e) { _repCaseStore = {}; }
    return _repCaseStore;
}
function repCaseSave() { try { localStorage.setItem(REP_CASE_KEY, JSON.stringify(_repCaseStore || {})); } catch (e) {} }
function repCaseGet(visitId) { return repCaseLoad()[String(visitId)] || null; }
function repCaseCount() { return Object.keys(repCaseLoad()).length; }

// ---------- سنیپ شاٹ بنانا ----------
function repCaseSnapshot() {
    if (typeof repClipboards === 'undefined') return null;
    var clips = [], n = 0;
    repClipboards.forEach(function(list, i) {
        if (!list || !list.length) return;
        n += list.length;
        clips.push({
            i: i,
            name: (typeof repClipLabel === 'function' ? repClipLabel(i) : ('Clip ' + (i + 1))),
            items: list.map(function(it) {
                return { book: it.book, ch: it.ch, rid: it.rid, t: it.t || it.full || '', w: it.w, combined: it.combined || undefined, remsObj: it.remsObj || undefined };
            })
        });
    });
    if (!n) return null;
    // تجزیے کی سرِفہرست دوائیں — اگر گرڈ پہلے سے بنا ہوا ہو
    var top = [], method = '';
    try {
        var res = window._repAnaLast;           // آخری تجزیے کا نتیجہ (repAnaCompute رکھتا ہے)
        if (res && res.abbrs && res.col) {
            method = (typeof repAnaMethodLabel === 'function' && res.method) ? repAnaMethodLabel(res.method) : (res.method || '');
            top = res.abbrs.slice(0, 10).map(function(a) {
                var c = res.col[a] || {};
                return { abbr: a, cov: c.cov, score: Math.round((c.total || 0) * 100) / 100 };
            });
        }
    } catch (e) {}
    return { ts: Date.now(), clips: clips, items: n, top: top, method: method,
             book: (typeof repCurrentBook !== 'undefined' ? repCurrentBook : ''),
             by: (typeof currentUserData !== 'undefined' && currentUserData ? currentUserData.name : '') };
}

// ---------- وزٹ کے ساتھ جوڑنا / ہٹانا ----------
function repCaseAttach(visitId) {
    var snap = repCaseSnapshot();
    if (!snap) { showToast('⚠️ ' + repCaseL({ ur: 'کلپ بورڈ خالی ہے — پہلے ربرکس جمع کریں', en: 'Clipboard is empty — collect rubrics first' })); return false; }
    repCaseLoad()[String(visitId)] = snap; repCaseSave();
    showToast('📋 ' + repCaseL({ ur: snap.items + ' ربرکس اس وزٹ کے ساتھ محفوظ', en: snap.items + ' rubrics attached to this visit' }));
    return true;
}
function repCaseDetach(visitId) {
    var st = repCaseLoad();
    if (!st[String(visitId)]) return;
    if (!confirm(repCaseL({ ur: 'اس وزٹ کا ریپرٹری کیس ہٹا دیں؟', en: 'Remove the repertory case from this visit?' }))) return;
    delete st[String(visitId)]; repCaseSave();
    showToast('🗑 ' + repCaseL({ ur: 'ہٹا دیا', en: 'Removed' }));
    if (typeof showPatientDetail === 'function' && window._repCasePatient) showPatientDetail(window._repCasePatient);
}

// ---------- واپس ریپرٹری میں کھولنا ----------
function repCaseRestore(visitId) {
    var c = repCaseGet(visitId);
    if (!c) return;
    if (typeof repClipboards === 'undefined') { showToast('⚠️ Repertory not loaded'); return; }
    var busy = repClipboards.some(function(l) { return l && l.length; });
    if (busy && !confirm(repCaseL({ ur: 'موجودہ کلپ بورڈ کی جگہ یہ کیس رکھ دیا جائے؟', en: 'Replace the current clipboards with this case?' }))) return;
    for (var i = 0; i < repClipboards.length; i++) repClipboards[i] = [];
    c.clips.forEach(function(cl) { if (repClipboards[cl.i]) repClipboards[cl.i] = cl.items.slice(); });
    try { if (typeof repClipsSave === 'function') repClipsSave(); } catch (e) {}
    if (typeof showPage === 'function') showPage('repertoryBrowser');
    try { if (typeof repCmpPanelRender === 'function') repCmpPanelRender(); } catch (e) {}
    try { if (typeof repRenderDock === 'function') repRenderDock(); } catch (e) {}
    showToast('🔄 ' + repCaseL({ ur: c.items + ' ربرکس بحال — تجزیہ چلائیں', en: c.items + ' rubrics restored — press Analyze' }));
}

// ---------- وزٹ کی فہرست میں خلاصہ ----------
function repCaseL(o) { return (typeof repLangText === 'function') ? repLangText(o) : (o[(typeof currentLang !== 'undefined' ? currentLang : 'ur')] || o.ur || o.en); }
function repCaseSummaryHtml(visitId, patientId) {
    window._repCasePatient = patientId || window._repCasePatient;
    var c = repCaseGet(visitId), L = repCaseL;
    if (!c) {
        return '<div class="rep-case-row empty"><span class="rc-lbl">📋 ' + L({ ur: 'ریپرٹری کیس', en: 'Repertory case' }) + '</span>'
            + '<button class="btn btn-xs" onclick="repCaseAttachFromVisit(\'' + visitId + '\',\'' + (patientId || '') + '\')">🔗 '
            + L({ ur: 'موجودہ کلپ بورڈ منسلک کریں', en: 'Attach current clipboard' }) + '</button></div>';
    }
    var h = '<div class="rep-case-row"><span class="rc-lbl">📋 ' + L({ ur: 'ریپرٹری کیس', en: 'Repertory case' }) + '</span>'
        + '<span class="rc-cnt">' + c.items + ' ' + L({ ur: 'ربرکس', en: 'rubrics' }) + ' · ' + c.clips.length + ' ' + L({ ur: 'بورڈ', en: 'boards' }) + '</span>';
    if (c.top && c.top.length) {
        h += '<span class="rc-top">' + c.top.slice(0, 5).map(function(r) {
            return '<b dir="ltr">' + escapeHtml(r.abbr) + '</b>' + (r.cov != null ? '<small>' + r.cov + '</small>' : '');
        }).join(' ') + '</span>';
    }
    h += '<span class="rc-act">'
        + '<button class="btn btn-xs" onclick="repCaseRestore(\'' + visitId + '\')">🔄 ' + L({ ur: 'بحال', en: 'Restore' }) + '</button> '
        + '<button class="btn btn-xs" onclick="repCaseAttachFromVisit(\'' + visitId + '\',\'' + (patientId || '') + '\')">♻ ' + L({ ur: 'تازہ', en: 'Update' }) + '</button> '
        + '<button class="btn btn-danger btn-xs" onclick="repCaseDetach(\'' + visitId + '\')">🗑</button></span>';
    h += '<div class="rc-list">' + c.clips.map(function(cl) {
        return '<div><b>' + escapeHtml(cl.name) + '</b> — ' + cl.items.slice(0, 6).map(function(it) {
            return '<span dir="ltr">' + escapeHtml(String(it.t || '').substring(0, 46)) + '</span>';
        }).join(' · ') + (cl.items.length > 6 ? ' … +' + (cl.items.length - 6) : '') + '</div>';
    }).join('') + '</div></div>';
    return h;
}
function repCaseAttachFromVisit(visitId, patientId) {
    if (patientId) window._repCasePatient = patientId;
    if (repCaseAttach(visitId) && typeof showPatientDetail === 'function' && window._repCasePatient) showPatientDetail(window._repCasePatient);
}

// ---------- ریپرٹری کی طرف سے: «کیس وزٹ میں محفوظ کریں» ----------
function repCaseSaveDialog() {
    var snap = repCaseSnapshot(), L = repCaseL;
    if (!snap) { showToast('⚠️ ' + L({ ur: 'کلپ بورڈ خالی ہے', en: 'Clipboard is empty' })); return; }
    if (typeof cachedVisits === 'undefined' || typeof cachedPatients === 'undefined') { showToast('⚠️ Patients not loaded'); return; }
    var byPatient = {};
    cachedVisits.forEach(function(v) { (byPatient[v.patientId] = byPatient[v.patientId] || []).push(v); });
    var h = '<div class="rep-case-pick"><h3>📋 ' + L({ ur: 'کیس کس وزٹ کے ساتھ محفوظ کریں؟', en: 'Attach this case to which visit?' })
          + ' <small>' + snap.items + ' ' + L({ ur: 'ربرکس', en: 'rubrics' }) + '</small></h3>'
          + '<input type="text" id="repCasePickQ" placeholder="' + L({ ur: 'مریض کا نام یا نمبر…', en: 'patient name or ref…' }) + '" oninput="repCasePickRender()">'
          + '<div id="repCasePickList"></div>'
          + '<div class="rc-foot"><button class="btn btn-sm" onclick="repCasePickClose()">' + L({ ur: 'بند', en: 'Close' }) + '</button></div></div>';
    var ov = document.getElementById('repCasePickOv');
    if (!ov) { ov = document.createElement('div'); ov.id = 'repCasePickOv'; ov.className = 'rep-case-ov'; document.body.appendChild(ov); }
    ov.innerHTML = h; ov.style.display = 'flex';
    repCasePickRender();
}
function repCasePickClose() { var o = document.getElementById('repCasePickOv'); if (o) o.style.display = 'none'; }
function repCasePickRender() {
    var q = (document.getElementById('repCasePickQ') || {}).value || '';
    q = q.trim().toLowerCase();
    var out = [], L = repCaseL, shown = 0;
    cachedPatients.forEach(function(p) {
        if (shown >= 25) return;
        var hay = (p.name + ' ' + (p.refNo || '') + ' ' + (p.phone || '')).toLowerCase();
        if (q && hay.indexOf(q) === -1) return;
        var vs = cachedVisits.filter(function(v) { return v.patientId === p.id; })
                             .sort(function(a, b) { return String(b.date || '').localeCompare(String(a.date || '')); }).slice(0, 4);
        if (!vs.length) return;
        shown++;
        out.push('<div class="rc-p"><div class="rc-pn">👤 <b>' + escapeHtml(p.name) + '</b> <small>' + escapeHtml(p.refNo || '') + '</small></div>'
            + vs.map(function(v) {
                var has = !!repCaseGet(v.id);
                return '<button class="btn btn-xs' + (has ? ' has' : '') + '" onclick="repCasePickDo(\'' + v.id + '\',\'' + p.id + '\')">'
                     + escapeHtml(v.date || '-') + (v.visitRef ? ' · ' + escapeHtml(v.visitRef) : '') + (has ? ' 📋' : '') + '</button>';
            }).join(' ') + '</div>');
    });
    var el = document.getElementById('repCasePickList');
    if (el) el.innerHTML = out.join('') || '<div class="rc-none">' + L({ ur: 'کوئی وزٹ نہیں ملی', en: 'No visits found' }) + '</div>';
}
function repCasePickDo(visitId, patientId) {
    if (repCaseGet(visitId) && !confirm(repCaseL({ ur: 'اس وزٹ کا پرانا کیس بدل دیں؟', en: 'Replace the case already attached to this visit?' }))) return;
    window._repCasePatient = patientId;
    if (repCaseAttach(visitId)) repCasePickClose();
}

// ---------- بیک اپ ----------
function repCaseExportAll() { return { key: REP_CASE_KEY, cases: repCaseLoad() }; }
function repCaseImportAll(obj) {
    var src = (obj && (obj.cases || obj)) || {}, st = repCaseLoad(), n = 0;
    Object.keys(src).forEach(function(k) { if (src[k] && src[k].clips) { st[k] = src[k]; n++; } });
    repCaseSave(); return n;
}
