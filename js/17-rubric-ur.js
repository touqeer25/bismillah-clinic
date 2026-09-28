// ============================================================
// Bismillah Clinic — js/17-rubric-ur.js
// 🔑 v101: 📖 پورے ربرک کا اردو جملہ — **دائیں سے بائیں** (صارف کی تحقیق کے مطابق)
//
//   کینٹ کا ربرک الٹی ترتیب میں لکھا ہوتا ہے:
//       [بنیادی علامت] ، [وقت / مقام] ، [سب سے خاص شرط]
//   اسے سیدھا پڑھنا بے معنی ہے — دائیں سے بائیں پڑھنا پڑتا ہے:
//       HEAD, PAIN, morning, waking, on   →   «صبح جاگنے پر سر میں درد»
//
//   یہ فائل تین کام کرتی ہے:
//     ۱. دُم کے حروف (on · while · after · agg. …) کو پچھلے ٹکڑے سے جوڑتی ہے → «جاگنے پر»
//     ۲. پھر پوری ترتیب الٹ دیتی ہے
//     ۳. «، » سے جوڑ کر ایک اردو جملہ بناتی ہے
//
//   ⚠ ترجمہ وہی ہے جو ur/rubric_labels_ur.json میں ہے — یہاں کوئی نیا ترجمہ نہیں ہوتا۔
//   ⚠ اگر کوئی ٹکڑا ترجمہ شدہ نہ ہو تو (سیٹنگ کے مطابق) یا تو انگریزی رہنے دیا جاتا ہے
//      یا پورا جملہ چھوڑ دیا جاتا ہے — تاکہ ادھورا ترجمہ گمراہ نہ کرے۔
// ============================================================


// ============================================================
// 🔑 v103 (صارف): کراس ریفرنس «(See …)» کا ترجمہ **نہیں** ہوتا
//   وجہ: وہ ربرک کا متن نہیں، ایک اشارہ ہے — «فلاں جگہ بھی دیکھیے»۔ اس کا ترجمہ کرنے سے
//   جملہ بگڑتا ہے اور دہرا نظر آتا ہے (مثلاً «متروک (چھوڑ دیا گیا) دیکھنا متروک …»)۔
//   اس لیے: (۱) ترجمہ صرف ربرک کے متن کا  (۲) کراس ریفرنس بڑے حروف سے **عنوانی حروف** میں،
//   تاکہ ایک نظر میں ربرک اور اشارے کا فرق نظر آئے۔
// ============================================================
var REP_XREF_SMALL = {'and':1,'or':1,'of':1,'the':1,'to':1,'in':1,'on':1,'with':1,'also':1,'from':1,'for':1,'a':1,'an':1};
function repTitleCase(s) {
    return String(s || '').replace(/[A-Za-z][A-Za-z'-]*/g, function (w, i) {
        var lw = w.toLowerCase();
        if (i > 0 && REP_XREF_SMALL[lw]) return lw;                       // چھوٹے الفاظ چھوٹے ہی
        return lw.charAt(0).toUpperCase() + lw.slice(1);
    });
}
// «ABANDONED (SEE FORSAKEN)» → {head:'ABANDONED', xref:'(See Forsaken)'}
function repXrefSplit(label) {
    var s = String(label || '').replace(/ \[\d+\]$/, '');
    var m = s.match(/^([\s\S]*?)\s*\(\s*see\b([^)]*)\)\s*([\s\S]*)$/i);
    if (!m) return { head: s.trim(), xref: '', tail: '' };
    return { head: (m[1] || '').trim(), xref: '(See' + repTitleCase(m[2]) + ')', tail: (m[3] || '').replace(/^,\s*/, '').trim() };
}
// دکھانے کے لیے: انگریزی متن + الگ انداز میں کراس ریفرنس
function repXrefHtml(label) {
    var x = repXrefSplit(label);
    if (!x.xref) return escapeHtml(label);
    return escapeHtml(x.head) + ' <span class="rep-xref">' + escapeHtml(x.xref) + '</span>'
         + (x.tail ? ', ' + escapeHtml(x.tail) : '');
}

var REP_UR_TAIL = ['on','in','from','after','before','during','while','when','with','to','agg.','amel.'];
var REP_UR_GLUE = { 'on':'پر','in':'میں','from':'سے','after':'کے بعد','before':'سے پہلے','during':'کے دوران',
                    'while':'کرتے ہوئے','when':'پر','with':'کے ساتھ','to':'تک','agg.':'سے بگاڑ','amel.':'سے آرام' };

function _repUrObl(u) {
    if (/(میں|پر|سے|کے ساتھ|کی طرف|کے بعد|کے دوران|تک)$/.test(u)) return u;   // پہلے سے حرفِ اضافت
    if (/نا$/.test(u))       return u.replace(/نا$/, 'نے');
    if (/ہ$/.test(u))        return u.replace(/ہ$/, 'ے');
    if (/[^ی]ا$/.test(u))    return u.replace(/ا$/, 'ے');
    return u;
}
function _repUrSeg(s) {                       // ایک ٹکڑے کا ترجمہ (صرف نظرثانی شدہ، خودکار لفظی نہیں)
    if (typeof repUrLabelObj !== 'function') return null;
    var x = repXrefSplit(s);                  // 🔑 v103: کراس ریفرنس ترجمے سے باہر
    var key = x.xref ? (x.head + (x.tail ? ', ' + x.tail : '')) : s;
    if (!key) return null;
    var o = repUrLabelObj(key);
    return (o && !o.auto) ? o.t : null;
}

// پورے ربرک کا اردو جملہ۔ opts.keepEnglish = true → غیر ترجمہ شدہ ٹکڑا انگریزی میں رہنے دو
function repRubricUrFull(title, opts) {
    opts = opts || {};
    var raw = String(title || '').replace(/ \[\d+\]$/, '').replace(/\s*\(\s*see\b[^)]*\)/ig, '').replace(/\s+,/g, ',').trim();   // 🔑 v103
    if (!raw) return '';
    if (typeof _repUrLabels === 'undefined' || !_repUrLabels) return '';
    var whole = _repUrSeg(raw);                                   // پورا ربرک پہلے سے لغت میں ہو تو وہی
    if (whole) return whole;

    var segs = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (segs.length < 2) { var one = _repUrSeg(raw); return one || ''; }

    var out = [], missing = 0;
    for (var i = 0; i < segs.length; i++) {
        var cur = segs[i], nxt = segs[i + 1];
        // «waking, on» جیسے جوڑے
        if (nxt && REP_UR_TAIL.indexOf(nxt.toLowerCase()) !== -1) {
            var both = _repUrSeg(cur + ', ' + nxt);
            if (both) { out.push(both); i++; continue; }
            var h = _repUrSeg(cur);
            if (h) { out.push(_repUrObl(h) + ' ' + REP_UR_GLUE[nxt.toLowerCase()]); i++; continue; }
        }
        var u = _repUrSeg(cur);
        if (u) out.push(u);
        else { missing++; if (opts.keepEnglish) out.push('<span dir="ltr">' + escapeHtml(cur) + '</span>'); }
    }
    if (!out.length) return '';
    if (missing && !opts.keepEnglish) return '';                  // ادھورا جملہ نہ دکھاؤ
    return out.reverse().join('، ');                              // 🔑 دائیں سے بائیں
}

// دکھانے کے لیے تیار ٹکڑا (اردو زبان میں ہی)
function repRubricUrHtml(title, cls) {
    if (typeof repUrLabelsOn === 'function' && !repUrLabelsOn()) return '';
    var t = repRubricUrFull(title);
    if (!t) return '';
    return '<span class="' + (cls || 'rep-ur-line') + '" dir="rtl" lang="ur" title="'
         + _repAttr('اردو — دائیں سے بائیں پڑھا گیا') + '">' + t + '</span>';
}

// راستہ (path) کی صورت میں بھی وہی کام — «HEAD - PAIN - morning» یا کوما والا، دونوں چلتے ہیں
function repPathUrHtml(path, cls) {
    var p = String(path || '').replace(/\s*[-–]\s*/g, ', ');
    return repRubricUrHtml(p, cls);
}

// ترجمہ فائل موجود ہو — جہاں ضرورت ہو وہاں خود منگوا لے
function repUrEnsure(cb) {
    if (typeof ensureRepUrLabels === 'function') ensureRepUrLabels(cb);
    else if (cb) cb();
}
