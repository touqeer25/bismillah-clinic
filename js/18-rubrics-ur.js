// ============================================================
// Bismillah Clinic — js/18-rubrics-ur.js
// 🔑 v107: 📖 ربرک کی سطح کا اردو ترجمہ — «پورا راستہ → کینٹ کے مطلب کا جملہ»
//
//   پہلے ترجمے کی اکائی «ٹری کی ایک سطح کا لیبل» تھی (walking = چلنا)۔ اس سے ہر صف پر
//   صرف ٹکڑا دکھتا تھا اور «پورا جملہ» ٹکڑوں کی الٹی فہرست بنتا تھا۔ اب ہر ربرک کا اپنا
//   ہاتھ سے لکھا جملہ ہے — **بنیاد پہلے**:  «غصہ — تسلی دینے پر»
//
//   فائل:  ur/rubrics/<book>/<chapter>.json
//          { meta, rubrics: { "<key>": "اردو جملہ" }, locked: [ "<key>", … ] }
//   کلید:  پورا راستہ، چھوٹے حروف، «(See …)» نکال کر  ←  repRubKey()
//
//   ترجیح (صف پر):  ۱. ربرک کا جملہ (یہ فائل)  ۲. پرانا نظام (سیاق → لیبل → لفظی، ہلکے رنگ میں)
//   دکھاوا:  «پورا مطلب» (والد کا حصہ ہلکا + اِس صف کا اضافہ نمایاں)  یا  «صرف اضافہ» — بٹن سے بدلے
//
//   ⚠ یہ فائل کوئی نیا ترجمہ **نہیں بناتی** — جو ہاتھ سے لکھا ہے وہی دکھاتی ہے۔
// ============================================================

var _repRubUr = {};            // book → chapter → { rubrics:{}, locked:{} }
var _repRubUrLoading = {};     // 'book/chapter' → true جب تک منگوایا جا رہا ہو
var REP_RUBUR_MODE_KEY = 'bc_ur_mode';          // 'full' | 'delta'
var REP_RUBUR_V = '140';                                       // 🔑 ur/rubrics/**.json کے ہر بدلاؤ پر بڑھائیں (ساتھ CACHE_NAME بھی)
var REP_RUBUR_SEP_RE = /^(\s*[—–-]\s*|\s*،\s*|\s*,\s*|\s+)/;   // والد کے بعد جوڑنے والا نشان

// ---------- کلید: پورا راستہ → معیاری صورت ----------
function repRubKey(full) {
    var s = String(full || '').replace(/ \[\d+\]$/, '');
    s = s.replace(/\s*\(\s*see\b[^)]*\)/ig, '');                 // «(See …)» ربرک کا متن نہیں
    s = s.replace(/\s+,/g, ',').replace(/,\s*,/g, ',').replace(/,\s*$/, '').replace(/^\s*,/, '');
    s = s.replace(/\s+/g, ' ').replace(/,(\S)/g, ', $1').trim().toLowerCase();
    return s;
}

// ---------- دکھانے کا انداز ----------
function repRubUrMode() {
    try { return localStorage.getItem(REP_RUBUR_MODE_KEY) === 'delta' ? 'delta' : 'full'; } catch (e) { return 'full'; }
}
function repRubUrSetMode(m) {
    m = m === 'delta' ? 'delta' : 'full';
    try { localStorage.setItem(REP_RUBUR_MODE_KEY, m); } catch (e) {}
    repRubUrPaintBtn();
    if (typeof repTreeViews !== 'undefined') {                    // کھلے ہوئے ٹری دوبارہ بنیں
        Object.keys(repTreeViews).forEach(function (id) { if (document.getElementById(id) && typeof repTreeRemount === 'function') repTreeRemount(id); });
    }
}
function repRubUrToggle() { repRubUrSetMode(repRubUrMode() === 'full' ? 'delta' : 'full'); }
function repRubUrPaintBtn() {
    var b = document.getElementById('repUrModeBtn'); if (!b) return;
    var full = repRubUrMode() === 'full';
    b.classList.toggle('delta', !full);
    b.innerHTML = (full ? '📖 ' : '✂ ') + '<span dir="rtl">' + (full ? 'پورا مطلب' : 'صرف اضافہ') + '</span>';
    b.title = full ? 'اردو: ہر صف پر پورا مطلب دکھ رہا ہے — دبائیں تو صرف اِس صف کا اضافہ دکھے'
                   : 'اردو: صرف اِس صف کا اضافہ دکھ رہا ہے — دبائیں تو پورا مطلب دکھے';
    var on = (typeof repUrLabelsOn === 'function') ? repUrLabelsOn() : true;
    b.style.display = on ? '' : 'none';
}

// ---------- فائل منگوانا (باب کھلنے پر، ایک بار) ----------
function repRubUrHas(book, chapter) { return !!(_repRubUr[book] && _repRubUr[book][chapter]); }
function ensureRepRubricsUr(book, chapter, cbOnLoad) {
    if (!book || !chapter) return;
    if (repRubUrHas(book, chapter)) return;                       // پہلے سے موجود — cb نہیں (دوبارہ بنانے کا چکر نہ چلے)
    var id = book + '/' + chapter; if (_repRubUrLoading[id]) return;
    _repRubUrLoading[id] = true;
    fetch('ur/rubrics/' + book + '/' + chapter + '.json?v=' + REP_RUBUR_V)   // اپنا ورژن — ur/rubrics/ بدلے تو صرف یہ بڑھائیں
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (d) { repRubUrStore(book, chapter, d); _repRubUrLoading[id] = false; if (cbOnLoad) cbOnLoad(true); })
        .catch(function () { repRubUrStore(book, chapter, null); _repRubUrLoading[id] = false; });   // فائل نہیں = اس باب کا کام ابھی نہیں ہوا
}
function repRubUrStore(book, chapter, d) {
    _repRubUr[book] = _repRubUr[book] || {};
    var lk = {}; ((d && d.locked) || []).forEach(function (k) { lk[k] = 1; });
    _repRubUr[book][chapter] = { rubrics: (d && d.rubrics) || {}, locked: lk, meta: (d && d.meta) || {} };
}

// ---------- تلاش ----------
function repRubUrGet(book, chapter, full) {
    var d = _repRubUr[book] && _repRubUr[book][chapter]; if (!d) return null;
    var t = d.rubrics[repRubKey(full)]; return t ? String(t) : null;
}
// جس باب/کتاب میں بھی ملے (تفریق، کلپ بورڈ — وہاں باب معلوم نہیں ہوتا)
function repRubUrFind(full) {
    var k = repRubKey(full); if (!k) return '';
    var books = Object.keys(_repRubUr);
    for (var i = 0; i < books.length; i++) {
        var chs = _repRubUr[books[i]];
        for (var c in chs) { if (chs[c] && chs[c].rubrics[k]) return String(chs[c].rubrics[k]); }
    }
    return '';
}
// والد کا جملہ اگر بچے کے جملے کے شروع میں ہو → {base, delta}؛ ورنہ سب delta
function repRubUrSplit(t, parentT) {
    t = String(t || ''); parentT = String(parentT || '');
    if (parentT && t.length > parentT.length && t.indexOf(parentT) === 0) {
        var rest = t.slice(parentT.length), m = rest.match(REP_RUBUR_SEP_RE), sep = m ? m[0] : '';
        return { base: parentT, sep: sep, delta: rest.slice(sep.length) };
    }
    return { base: '', sep: '', delta: t };
}

// ---------- صف کے لیے تیار HTML (rep-tree.js یہی بلاتا ہے) ----------
// r = {label, labels, full, depth}  — labels[] راستہ ہے، اس لیے کوما والے لیبل («stabbed, so that …») نہیں ٹوٹتے
// «بنیاد» = قریب ترین بزرگ (والد، دادا … جڑ) جس کا جملہ اس جملے کے شروع میں موجود ہو
// («=…» والے جملے والد سے نہیں جڑتے مگر جڑ «بے چینی — » سے شروع ہوتے ہیں — تو بنیاد جڑ بنے گی)
// اردو کی «مائل» شکل: «لکھنا» → «لکھنے سے بیزار»، «حافظہ» → «حافظے کی کمزوری» — بزرگ کا آخری «ا/ہ» بچے میں «ے» بن جائے تو بھی بنیاد مانو
function repRubUrObl(a) { return /[اہ]$/.test(a) ? a.slice(0, -1) + 'ے' : ''; }
function repRubUrBase(book, ch, labels, t) {
    for (var i = labels.length - 1; i >= 1; i--) {
        var a = repRubUrGet(book, ch, labels.slice(0, i).join(', '));
        if (!a) continue;
        if (t.length > a.length && t.indexOf(a) === 0) return a;
        var o = repRubUrObl(a); if (o && t.length > o.length && t.indexOf(o) === 0) return o;
    }
    var m = _repRubUr[book] && _repRubUr[book][ch] && _repRubUr[book][ch].meta, root = m && m.root;   // باب کی جڑ («چکر — ») سب سے باہر کی بنیاد
    if (root && t.length > root.length && t.indexOf(root) === 0) return root;
    return null;
}
function repRubUrRowHtml(r) {
    if (!r || typeof repCurrentBook === 'undefined') return '';
    var book = repCurrentBook, ch = (typeof repCurrentChapter !== 'undefined') ? repCurrentChapter : '';
    var t = repRubUrGet(book, ch, r.full || (r.labels || []).join(', ')); if (!t) return '';
    var labels = r.labels || [], parentT = repRubUrBase(book, ch, labels, t);
    var p = repRubUrSplit(t, parentT), full = repRubUrMode() === 'full';
    var esc = (typeof escapeHtml === 'function') ? escapeHtml : function (s) { return String(s); };
    var h = '<span class="rtv-ur rub' + (full ? '' : ' delta-only') + '" dir="rtl" lang="ur" title="' + esc(t) + '">';
    if (p.base && full) h += '<span class="rub-base">' + esc(p.base) + esc(p.sep) + '</span>';
    h += '<span class="rub-delta">' + esc(p.delta) + '</span></span>';
    return h;
}

// ---------- شروع میں: بٹن جوڑو (index.html میں کوئی onclick نہیں) ----------
(function () {
    function init() {
        var b = document.getElementById('repUrModeBtn');
        if (b && !b._rubUrBound) { b._rubUrBound = true; b.addEventListener('click', function (ev) { ev.preventDefault(); repRubUrToggle(); }); }
        repRubUrPaintBtn();
    }
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
    }
})();
