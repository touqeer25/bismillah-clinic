// ============================================================
// Bismillah Clinic — js/11-app-studio.js
// HYBRID TREATMENT STUDIO (Option 3+4: system tabs + left list + right detail)
// Tabs: علامات → علاج → خوراک → احتیاط  (3 languages: ur/en/roman)
// Symptoms tab = disease symptoms only. Treatment tab = remedies ranked by ticked symptoms.
// Needs: js/10-treatment-data.js (TREATMENT_LIB, STUDIO_SYS, T)
// ============================================================

var studioSys = 'all';
var studioDx = 'piles';
var studioTab = 'sym';
var studioViewInit = false;
var studioSelSyms = new Set();   // selected indexes into studioSymPool
var studioSymPool = [];          // mixed pathological + remedy symptoms (no drug names)
var studioSymPoolDx = '';
var studioNote = '';             // manually written symptoms
var studioShowNoteBox = false;
var studioSelRems = new Set();   // selected remedy keys ('r2'=d.rem[2], 'm1'=extra pool)
var studioFieldSrc = null;       // textarea id when opened from New Visit / Registration form
var studioFieldPage = null;      // page id to return to

var STUDIO_TABS = [
    ['sym',  '🔑', { ur: 'علامات', en: 'Symptoms', roman: 'Alamaat' }],
    ['rem',  '💊', { ur: 'علاج',   en: 'Treatment', roman: 'Ilaj' }],
    ['diet', '🥗', { ur: 'خوراک',  en: 'Diet', roman: 'Khurak' }],
    ['rf',   '⚠️', { ur: 'احتیاط', en: 'Caution', roman: 'Ehtiyat' }]
];

var STUDIO_STOP = {
    the:1, and:1, with:1, from:1, of:1, in:1, to:1, for:1, a:1, an:1, or:1, on:1, at:1,
    is:1, it:1, by:1, after:1, before:1, without:1, much:1, more:1, than:1, this:1, that:1,
    se:1, ki:1, ka:1, ke:1, ko:1, mein:1, aur:1, wali:1, wala:1, walay:1, hai:1, hain:1,
    ka:1, ki:1, ke:1, par:1, tak:1, nahi:1, ho:1, hona:1, the:1
};

function studioEsc(s) { return escapeHtml(s || ''); }
function studioL() { return ({ ur: 'ur', en: 'en', roman: 'roman' })[currentLang] || 'ur'; }
function studioTx(obj) { return studioEsc(obj ? (obj[currentLang] || obj.ur) : ''); }

function studioNorm(s) {
    return String(s || '').toLowerCase().replace(/[^\w\u0600-\u06FF\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function studioTokens(s) {
    return studioNorm(s).split(' ').filter(function(w) {
        return w.length >= 3 && !STUDIO_STOP[w];
    });
}

function studioBlob(r) {
    var parts = [];
    (r.syms || []).forEach(function(s) {
        parts.push(s.ur || '', s.en || '', s.roman || '');
    });
    if (r.mod) parts.push(r.mod.ur || '', r.mod.en || '', r.mod.roman || '');
    if (r.n) parts.push(r.n);
    return studioNorm(parts.join(' '));
}

function studioShuffle(arr, seed) {
    var a = arr.slice();
    var s = 2166136261;
    seed = String(seed || 'x');
    for (var i = 0; i < seed.length; i++) s = ((s ^ seed.charCodeAt(i)) * 16777619) >>> 0;
    function rnd() { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(rnd() * (i + 1));
        var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
}

function studioDedupKey(t) {
    return studioNorm((t && (t.en || t.ur || t.roman)) || '');
}

function studioParseMod(raw) {
    var out = { agg: { ur: '', en: '', roman: '' }, amel: { ur: '', en: '', roman: '' } };
    if (!raw) return out;
    var marks = {
        ur: { agg: /بدتر\s*[:：]?\s*/g, amel: /بہتر\s*[:：]?\s*/g },
        en: { agg: /worse\s*[:：]?\s*/gi, amel: /better\s*[:：]?\s*/gi },
        roman: { agg: /badtar\s*[:：]?\s*/gi, amel: /behtar\s*[:：]?\s*/gi }
    };
    ['ur', 'en', 'roman'].forEach(function(lang) {
        var s = String(raw[lang] || '').trim();
        if (!s) return;
        var aggIdx = s.search(marks[lang].agg);
        var amelIdx = s.search(marks[lang].amel);
        function strip(txt, kind) {
            return txt.replace(marks[lang][kind], '').replace(/^[,،;؛\-\s]+/, '').replace(/[,،;؛\s]+$/, '').trim();
        }
        if (aggIdx >= 0 && amelIdx >= 0) {
            if (aggIdx < amelIdx) {
                out.agg[lang] = strip(s.slice(aggIdx, amelIdx), 'agg');
                out.amel[lang] = strip(s.slice(amelIdx), 'amel');
            } else {
                out.amel[lang] = strip(s.slice(amelIdx, aggIdx), 'amel');
                out.agg[lang] = strip(s.slice(aggIdx), 'agg');
            }
        } else if (aggIdx >= 0) {
            out.agg[lang] = strip(s.slice(aggIdx), 'agg');
        } else if (amelIdx >= 0) {
            out.amel[lang] = strip(s.slice(amelIdx), 'amel');
        } else {
            out.agg[lang] = s;
        }
    });
    return out;
}

function studioEnsureSymPool(d) {
    if (studioSymPoolDx === studioDx && studioSymPool && studioSymPool.length) return studioSymPool;
    var map = {};
    var list = [];
    function add(t, key, kind) {
        if (!t) return;
        var k = kind + '|' + studioDedupKey(t);
        if (!k || k === kind + '|') return;
        if (map[k]) {
            if (key && map[k].keys.indexOf(key) < 0) map[k].keys.push(key);
            return;
        }
        var item = { t: t, keys: key ? [key] : [], kind: kind || 'sym' };
        map[k] = item;
        list.push(item);
    }
    (d.syms || []).forEach(function(s) { add(s, null, 'sym'); });
    studioPool(d).forEach(function(it) {
        if (it.r.mod) {
            var raw = it.r.mod;
            var parts = [];
            ['ur', 'en', 'roman'].forEach(function(lang) {
                if (!raw[lang]) return;
                raw[lang].split(/[;؛]/).forEach(function(p, idx) {
                    if (!parts[idx]) parts[idx] = { ur: '', en: '', roman: '' };
                    parts[idx][lang] = p.trim();
                });
            });
            if (!parts.length) parts = [raw];
            parts.forEach(function(p) { add(p, it.key, 'mod'); });
        }
        (it.r.syms || []).forEach(function(s) { add(s, it.key, 'acc'); });
    });
    var a = list.filter(function(x) { return x.kind === 'sym'; });
    var b = studioShuffle(list.filter(function(x) { return x.kind === 'mod'; }), studioDx + '-m');
    var c = studioShuffle(list.filter(function(x) { return x.kind === 'acc'; }), studioDx + '-a');
    studioSymPool = a.concat(b, c);
    studioSymPoolDx = studioDx;
    return studioSymPool;
}

function studioSelTexts(d) {
    var pool = studioEnsureSymPool(d);
    return Array.from(studioSelSyms).sort(function(a, b) { return a - b; }).map(function(i) {
        var it = pool[i];
        return it ? (it.t[currentLang] || it.t.ur) : '';
    }).filter(Boolean);
}

function studioScoreRem(it, d) {
    if (!studioSelSyms.size) return 0;
    var pool = studioEnsureSymPool(d);
    var blob = studioBlob(it.r || it);
    var score = 0;
    studioSelSyms.forEach(function(i) {
        var item = pool[i]; if (!item) return;
        if (it.key && item.keys.indexOf(it.key) >= 0) { score += 14; return; }
        var variants = [item.t.ur, item.t.en, item.t.roman].map(studioNorm).filter(Boolean);
        var hit = false;
        variants.forEach(function(v) { if (v.length >= 2 && blob.indexOf(v) >= 0) hit = true; });
        if (!hit) {
            variants.forEach(function(v) {
                studioTokens(v).forEach(function(tok) { if (blob.indexOf(tok) >= 0) hit = true; });
            });
        }
        if (hit) score += 8;
    });
    return score;
}

// ---------- VIEW SWITCHER (studio ↔ classic modes) ----------
function switchDxView(v) {
    var s = $('dxStudioView'), c = $('dxClassicView');
    var bs = $('dxViewBtnStudio'), bc = $('dxViewBtnClassic');
    if (!s || !c) return;
    var studio = (v === 'studio');
    s.classList.toggle('hidden', !studio);
    c.classList.toggle('hidden', studio);
    if (bs) bs.className = studio ? 'btn btn-sm btn-purple' : 'btn btn-sm btn-light';
    if (bc) bc.className = studio ? 'btn btn-sm btn-light' : 'btn btn-sm btn-purple';
    if (studio && !studioViewInit) { studioViewInit = true; renderStudioAll(); }
    try { localStorage.setItem('dx_view', studio ? 'studio' : 'classic'); } catch (e) {}
}

// ---------- RENDER: SYSTEM TABS ----------
function renderStudioSysTabs() {
    var el = $('studioSysTabs'); if (!el) return;
    var keys = Object.keys(TREATMENT_LIB);
    var h = '';
    STUDIO_SYS.forEach(function(s) {
        var n = s.k === 'all' ? keys.length : keys.filter(function(k) { return TREATMENT_LIB[k].sys === s.k; }).length;
        h += '<div class="tst-sys' + (studioSys === s.k ? ' on' : '') + '" style="--c:' + s.c + ';--bg:' + s.bg + '" onclick="studioPickSys(\'' + s.k + '\')">';
        h += '<div class="ic">' + s.ic + '</div><div class="lb">' + studioTx(s.nm) + '</div><div class="n">' + n + '</div></div>';
    });
    el.innerHTML = h;
}

// ---------- RENDER: NAV LIST (LEFT panel) ----------
function renderStudioList() {
    var el = $('studioList'); if (!el) return;
    var qEl = $('studioSearch');
    var q = qEl ? qEl.value.trim().toLowerCase() : '';
    var h = '', last = '';
    Object.keys(TREATMENT_LIB).forEach(function(k) {
        var d = TREATMENT_LIB[k];
        if (studioSys !== 'all' && d.sys !== studioSys) return;
        var nm = d.name[currentLang] || d.name.ur;
        if (q && (nm + ' ' + d.name.en).toLowerCase().indexOf(q) < 0) return;
        var sys = STUDIO_SYS.find(function(x) { return x.k === d.sys; });
        if (studioSys === 'all' && sys && sys.nm.en !== last) {
            h += '<div class="tst-grp">' + sys.ic + ' ' + studioTx(sys.nm) + '</div>';
            last = sys.nm.en;
        }
        h += '<div class="tst-row' + (k === studioDx ? ' on' : '') + '" onclick="studioPickDx(\'' + k + '\')">';
        h += '<span class="ic">' + d.ic + '</span>' + studioEsc(nm) + '<span class="en">' + studioEsc(d.name.en) + '</span></div>';
    });
    var none = { ur: '😔 کوئی بیماری نہیں ملی', en: '😔 No disease found', roman: '😔 Koi bimari nahi mili' };
    el.innerHTML = h || '<div class="tst-empty">' + none[currentLang] + '</div>';
}

// ---------- RENDER: DETAIL (RIGHT panel) ----------
function renderStudioDetail() {
    var d = TREATMENT_LIB[studioDx]; if (!d) return;
    var L = currentLang;
    var head = $('studioDHead'), meta = $('studioDMeta');
    if (head) head.innerHTML = d.ic + ' ' + studioTx(d.name) + (L !== 'en' ? ' <span class="latin">(' + studioEsc(d.name.en) + ')</span>' : '');
    var poolSyms = [];
    var ranked = [];
    try {
        poolSyms = studioEnsureSymPool(d) || [];
        ranked = studioRankedRems(d) || [];
    } catch (err) {
        console.error('studio pool', err);
        poolSyms = (d.syms || []).map(function(s) { return { t: s, keys: [] }; });
        ranked = studioPool(d).map(function(it) { return { r: it.r, key: it.key, score: 0 }; });
    }
    if (meta) {
        if (studioTab === 'sym') {
            meta.textContent = poolSyms.length + ' ' + ({ ur: 'علامات', en: 'symptoms', roman: 'alamaat' }[L]);
        } else if (studioTab === 'rem') {
            var shown = studioSelSyms.size ? ranked.filter(function(x) { return x.score > 0; }).length : ranked.length;
            meta.textContent = shown + ' ' + ({ ur: 'ادویات', en: 'remedies', roman: 'adviat' }[L]);
        } else {
            meta.textContent = '';
        }
    }

    var pb = $('studioPatientBar');
    if (pb) {
        if (diagnosisPatientId) {
            var p = cachedPatients.find(function(x) { return x.id === diagnosisPatientId; });
            pb.style.display = 'flex';
            var pn = $('studioPatientName');
            if (pn) pn.textContent = p ? (p.name + ' (' + p.refNo + ')') : diagnosisPatientId;
        } else { pb.style.display = 'none'; }
    }

    var tabsEl = $('studioTabs');
    if (tabsEl) {
        tabsEl.innerHTML = STUDIO_TABS.map(function(t) {
            return '<span class="tst-dtab' + (studioTab === t[0] ? ' on' : '') + '" onclick="studioPickTab(\'' + t[0] + '\')">' + t[1] + ' ' + studioTx(t[2]) + '</span>';
        }).join('');
    }

    var b = $('studioBody'); if (!b) return;
    var hh = '';
    var selCount = studioSelSyms.size + studioSelRems.size + (studioNote.trim() ? 1 : 0);
    var saveLbl = studioFieldSrc
        ? { ur: 'فارم میں محفوظ کریں', en: 'Save to form', roman: 'Form mein mehfooz karein' }[L]
        : { ur: 'مریض علامات میں محفوظ', en: 'Save to patient symptoms', roman: 'Mareez alamat mein mehfooz' }[L];

    if (studioTab === 'sym') {
        if (studioFieldSrc) {
            hh += '<div class="tst-fieldbar"><span>📝 ' + ({ ur: 'آپ وزٹ/رجسٹریشن فارم سے آئے ہیں — علامات منتخب کر کے «محفوظ کریں» دبائیں', en: 'You came from the Visit/Registration form — select symptoms, then press Save', roman: 'Aap visit/registration form se aaye hain — alamat muntakhib kar ke Mehfooz dabain' }[L]) + '</span>';
            hh += '<button class="tst-btn i" style="padding:2px 10px" onclick="studioCancelField()">✕ ' + ({ ur: 'واپس', en: 'Back', roman: 'Wapas' }[L]) + '</button></div>';
        }
        hh += '<div class="tst-dtitle"><h3>🔑 ' + ({ ur: 'علامات — ', en: 'Symptoms — ', roman: 'Alamaat — ' }[L]) + studioTx(d.name) + '</h3>';
        hh += '<div class="tst-acts">';
        hh += '<button class="tst-btn i" onclick="studioToggleNote()">✍️ ' + ({ ur: 'علامات لکھیں', en: 'Write symptoms', roman: 'Alamat likhein' }[L]) + '</button>';
        hh += '<button class="tst-btn g" onclick="studioSaveSymptoms()">📋 ' + saveLbl + (selCount ? ' (' + selCount + ')' : '') + '</button>';
        hh += '</div></div>';
        if (studioShowNoteBox) {
            hh += '<textarea id="studioNoteBox" class="tst-note" oninput="studioNote=this.value" placeholder="' +
                ({ ur: 'مریض کی علامات یہاں لکھیں...', en: 'Write patient symptoms here...', roman: 'Mareez ki alamat yahan likhein...' }[L]) + '">' + studioEsc(studioNote) + '</textarea>';
        }
        function studioKwGroup(kind, title) {
            var chips = [];
            poolSyms.forEach(function(item, i) {
                if ((item.kind || 'sym') !== kind) return;
                chips.push('<span class="' + (studioSelSyms.has(i) ? 'sel' : '') + '" onclick="studioToggleSym(' + i + ')">' + studioEsc(item.t[currentLang] || item.t.ur) + '</span>');
            });
            if (!chips.length) return '';
            return '<div class="tst-sub" style="margin-top:12px">' + title + '</div><div class="tst-kw">' + chips.join('') + '</div>';
        }
        hh += studioKwGroup('sym', '🩺 ' + ({ ur: 'علامات', en: 'Symptoms', roman: 'Alamaat' }[L]));
        var modAgg = studioKwGroup('agg', '⬇️ ' + ({ ur: 'اگراویشن (Worse)', en: 'Aggravation (Worse)', roman: 'Aggravation (Worse)' }[L]));
        var modAmel = studioKwGroup('amel', '⬆️ ' + ({ ur: 'امیلوریشن (Better)', en: 'Amelioration (Better)', roman: 'Amelioration (Better)' }[L]));
        if (modAgg || modAmel) {
            hh += '<div class="tst-sub" style="margin-top:14px">🔄 ' + ({ ur: 'موڈیلیٹیز', en: 'Modalities', roman: 'Modalities' }[L]) + '</div>';
            hh += modAgg + modAmel;
        }
        hh += studioKwGroup('acc', '🤝 ' + ({ ur: 'Concomitant علامات', en: 'Concomitant symptoms', roman: 'Concomitant alamaat' }[L]));
        hh += '<div class="tst-poolhint" style="margin:8px 0 4px;color:#7d3c98;font-size:12px">👆 ' +
            ({ ur: 'منتخب (ٹک شدہ) علامات کے مطابق علاج ٹیب میں ادویات رینک ہوں گی', en: 'Ticked symptoms will rank remedies on the Treatment tab', roman: 'Tick shuda alamaat ke mutabiq Ilaj tab mein adviat rank hongi' }[L]) + '</div>';
        hh += '<div class="tst-intro">📖 ' + studioTx(d.intro) + '</div>';
        if (studioSelSyms.size) {
            hh += '<div class="tst-acts" style="margin-top:10px"><button class="tst-btn p" onclick="studioPickTab(\'rem\')">💊 ' +
                ({ ur: 'منتخب علامات کے مطابق علاج دیکھیں', en: 'See remedies for selected symptoms', roman: 'Muntakhib alamaat ke mutabiq ilaj dekhein' }[L]) +
                ' (' + studioSelSyms.size + ')</button></div>';
        }
    } else if (studioTab === 'rem') {
        var matchItems = studioSelSyms.size ? ranked.filter(function(x) { return x.score > 0; }) : ranked;
        hh += '<div class="tst-dtitle"><h3>💊 ' + ({ ur: 'تجویز شدہ دوائیں (', en: 'Prescribed Remedies (', roman: 'Tajweez shuda dwain (' }[L]) + matchItems.length + ')</h3>';
        hh += '<div class="tst-acts">';
        hh += '<button class="tst-btn g" onclick="studioMakeRx()">📋 ' + ({ ur: 'نسخہ بنائیں', en: 'Make Prescription', roman: 'Nuskhah banayein' }[L]) + '</button>';
        hh += '<button class="tst-btn p" onclick="studioCaseAnalysis()">🔬 ' + ({ ur: 'کیس تجزیہ', en: 'Case Analysis', roman: 'Case tajzia' }[L]) + '</button>';
        hh += '<button class="tst-btn i" onclick="studioTogglePatientSearch(true)">👤 ' + ({ ur: 'مریض سے جوڑیں', en: 'Link Patient', roman: 'Mareez se jorein' }[L]) + '</button>';
        hh += '</div></div>';
        if (!studioSelSyms.size) {
            hh += '<div class="tst-poolhint" style="margin:0 0 10px">🔑 ' +
                ({ ur: 'علامات ٹیب سے بیماری کی علامات ٹک کریں تاکہ ادویات انہی کے مطابق اوپر آئیں۔ ابھی بیماری کی تمام ادویات دکھائی جا رہی ہیں۔', en: 'Tick disease symptoms on the Symptoms tab to rank remedies. Showing all disease remedies for now.', roman: 'Alamaat tab se tick karein taake adviat rank hon. Abhi tamam adviat dikhai ja rahi hain.' }[L]) +
                '</div>';
        } else {
            var selNames = studioSelTexts(d).map(studioEsc);
            hh += '<div class="tst-sub">🔑 ' + ({ ur: 'منتخب علامات: ', en: 'Selected symptoms: ', roman: 'Muntakhib alamaat: ' }[L]) + selNames.join(' · ') + '</div>';
        }
        if (!matchItems.length) {
            hh += '<div class="tst-empty">😔 ' + ({ ur: 'منتخب علامات سے کوئی دوا میچ نہیں ہوئی — علامات بدل کر دیکھیں', en: 'No remedy matched the selected symptoms — try different ticks', roman: 'Muntakhib alamaat se koi dawa match nahi hui' }[L]) + '</div>';
        } else {
            hh += '<div class="tst-poolhint" style="margin:0 0 6px">👆 ' +
                ({ ur: 'سبز کارڈ = منتخب۔ اوپر والی ادویات منتخب علامات سے زیادہ میچ کرتی ہیں', en: 'Green card = selected. Top remedies match the ticked symptoms most', roman: 'Sabz card = muntakhib. Upar wali adviat zyada match karti hain' }[L]) + '</div>';
            hh += studioRemCardsFromItems(matchItems, L, true);
        }
        hh += '<div class="tst-rem"><div class="dose">🕐 ' + ({ ur: 'ہر دوا ڈاکٹر کی ہدایت کے مطابق', en: 'Every remedy as directed by the doctor', roman: 'Har dawa doctor ki hidayat ke mutabiq' }[L]) + '</div></div>';
        hh += '<div class="tst-two"><div class="tst-box rf">⚠️ ' + studioTx(d.rf) + '</div><div class="tst-box diet">🥗 ' + studioTx(d.diet) + '</div></div>';
    } else if (studioTab === 'diet') {
        hh += '<div class="tst-dtitle"><h3>🥗 ' + ({ ur: 'خوراک و ہدایات — ', en: 'Diet & Guidance — ', roman: 'Khurak aur hidayat — ' }[L]) + studioTx(d.name) + '</h3></div>';
        hh += '<div class="tst-box diet">🥗 ' + studioTx(d.diet) + '</div>';
        hh += '<div class="tst-intro">📖 ' + studioTx(d.intro) + '</div>';
    } else {
        hh += '<div class="tst-dtitle"><h3>⚠️ ' + ({ ur: 'احتیاط و خبرداری — ', en: 'Caution & Red Flags — ', roman: 'Ehtiyat aur khabardari — ' }[L]) + studioTx(d.name) + '</h3></div>';
        hh += '<div class="tst-box rf">' + studioTx(d.rf) + '</div>';
        hh += '<div class="tst-intro">📖 ' + studioTx(d.intro) + '</div>';
    }
    b.innerHTML = hh;
}

function studioPool(d) {
    var extra = (typeof TREATMENT_MORE !== 'undefined' && TREATMENT_MORE[studioDx]) ? TREATMENT_MORE[studioDx] : [];
    var names = d.rem.map(function(r) { return (r.n || '').toLowerCase(); });
    return d.rem.map(function(r, i) { return { r: r, key: 'r' + i }; })
        .concat(extra.filter(function(r) { return r && r.n && names.indexOf(r.n.toLowerCase()) < 0; })
            .map(function(r, i) { return { r: r, key: 'm' + i }; }));
}

function studioRankedRems(d) {
    return studioPool(d).map(function(it) {
        return { r: it.r, key: it.key, score: studioScoreRem(it, d) };
    }).sort(function(a, b) {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.key).localeCompare(String(b.key));
    });
}

function studioMatchedSelForRem(it, d) {
    if (!studioSelSyms.size) return [];
    var pool = studioEnsureSymPool(d);
    var blob = studioBlob(it.r);
    var out = [];
    Array.from(studioSelSyms).sort(function(a, b) { return a - b; }).forEach(function(i) {
        var item = pool[i]; if (!item) return;
        var hit = !!(it.key && item.keys && item.keys.indexOf(it.key) >= 0);
        if (!hit) {
            var variants = [item.t.ur, item.t.en, item.t.roman].map(studioNorm).filter(Boolean);
            variants.forEach(function(v) { if (v.length >= 2 && blob.indexOf(v) >= 0) hit = true; });
            if (!hit) {
                variants.forEach(function(v) {
                    studioTokens(v).forEach(function(tok) { if (blob.indexOf(tok) >= 0) hit = true; });
                });
            }
        }
        if (hit) out.push(item.t[currentLang] || item.t.ur);
    });
    return out;
}

function studioRemCardsFromItems(items, L, sel) {
    var d = TREATMENT_LIB[studioDx];
    var ownLbl = { ur: 'دوا کی علامات', en: 'Remedy symptoms', roman: 'Dawa ki alamaat' }[L];
    var patLbl = { ur: 'مریض کی منتخب علامات (اس دوا میں)', en: 'Patient selected symptoms (in this remedy)', roman: 'Mareez ki muntakhib alamaat' }[L];
    var noneLbl = { ur: 'منتخب علامات اس دوا میں نہیں ملیں', en: 'No selected symptoms found in this remedy', roman: 'Is dawa mein nahi milin' }[L];
    return items.map(function(it, i) {
        var r = it.r, on = sel && studioSelRems.has(it.key);
        var matched = studioSelSyms.size ? studioMatchedSelForRem(it, d) : [];
        var h = '<div class="tst-rem' + (sel ? ' click' : '') + (on ? ' selrem' : '') + '"' + (sel ? ' onclick="studioToggleRem(\'' + it.key + '\')"' : '') + '>';
        h += '<div class="top"><span class="nm">' + (i + 1) + '. ' + studioEsc(r.n) + '</span>';
        if (studioSelSyms.size) h += '<span class="pot" style="background:#6c3483">' + matched.length + '/' + studioSelSyms.size + '</span>';
        if (r.pot) h += '<span class="pot">' + studioEsc(r.pot) + '</span>';
        h += '</div>';
        h += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px;align-items:stretch">';
        h += '<div style="flex:1;min-width:220px;background:#eafaf1;border:1px solid #a9dfbf;border-radius:8px;padding:8px 10px">';
        h += '<div style="font-size:11px;font-weight:700;color:#196f3d;margin-bottom:6px">💊 ' + ownLbl + '</div>';
        h += (r.syms || []).map(function(s) { return '<div class="use">▸ ' + studioEsc(s[currentLang] || s.ur) + '</div>'; }).join('');
        if (r.mod) h += '<div class="tst-mod">🔄 ' + ({ ur: 'موڈیلیٹیز: ', en: 'Modalities: ', roman: 'Modalities: ' }[L]) + studioEsc(r.mod[currentLang] || r.mod.ur) + '</div>';
        h += '</div>';
        if (studioSelSyms.size) {
            h += '<div style="flex:1;min-width:220px;background:#f5eef8;border:1px solid #d2b4de;border-radius:8px;padding:8px 10px">';
            h += '<div style="font-size:11px;font-weight:700;color:#6c3483;margin-bottom:6px">🔑 ' + patLbl + '</div>';
            if (matched.length) {
                h += matched.map(function(t) { return '<div class="use" style="color:#4a235a">✓ ' + studioEsc(t) + '</div>'; }).join('');
            } else {
                h += '<div class="use" style="opacity:.7">— ' + noneLbl + '</div>';
            }
            h += '</div>';
        }
        h += '</div></div>';
        return h;
    }).join('');
}

function studioToggleRem(k) {
    if (studioSelRems.has(k)) studioSelRems.delete(k); else studioSelRems.add(k);
    renderStudioDetail();
}

function renderStudioAll() { renderStudioSysTabs(); renderStudioList(); renderStudioDetail(); }

function studioPickSys(k) {
    studioSys = k;
    if (TREATMENT_LIB[studioDx] && TREATMENT_LIB[studioDx].sys !== k) {
        var f = Object.keys(TREATMENT_LIB).find(function(x) { return TREATMENT_LIB[x].sys === k; });
        if (f) studioDx = f;
    }
    studioSelSyms.clear(); studioSelRems.clear(); studioNote = ''; studioShowNoteBox = false;
    studioSymPool = []; studioSymPoolDx = '';
    renderStudioAll();
}

function studioPickDx(k) {
    studioDx = k; studioTab = 'sym';
    studioSelSyms.clear(); studioSelRems.clear(); studioNote = ''; studioShowNoteBox = false;
    studioSymPool = []; studioSymPoolDx = '';
    renderStudioList(); renderStudioDetail();
}

function studioPickTab(t) { studioTab = t; renderStudioDetail(); }

function studioToggleSym(i) {
    if (studioSelSyms.has(i)) studioSelSyms.delete(i); else studioSelSyms.add(i);
    renderStudioDetail();
}

function studioToggleNote() { studioShowNoteBox = !studioShowNoteBox; renderStudioDetail(); }

function studioSaveSymptoms() {
    var d = TREATMENT_LIB[studioDx]; if (!d) return;
    var L = currentLang;
    var parts = [];
    if (studioNote.trim()) parts.push(studioNote.trim());
    var arr = studioSelTexts(d);
    if (arr.length) parts.push(arr.join('، '));
    var pool = studioPool(d);
    var rems = Array.from(studioSelRems).sort()
        .map(function(k) { var it = pool.find(function(x) { return x.key === k; }); return it ? it.r.n : null; })
        .filter(Boolean);
    if (rems.length) parts.push({ ur: 'متعلقہ ادویات: ', en: 'Related remedies: ', roman: 'Mutaliqa adviat: ' }[L] + rems.join(', '));
    if (!parts.length) {
        showToast({ ur: '⚠️ پہلے علامات منتخب کریں یا لکھیں', en: '⚠️ Select or write symptoms first', roman: '⚠️ Pehle alamat muntakhib karein ya likhein' }[L], 'error');
        return;
    }
    var text = parts.join('\n');
    if (studioFieldSrc) {
        var el = $(studioFieldSrc);
        if (el) el.value = el.value.trim() ? (el.value.trim() + '\n' + text) : text;
        var pg = studioFieldPage;
        studioFieldSrc = null; studioFieldPage = null;
        studioSelSyms.clear(); studioSelRems.clear(); studioNote = ''; studioShowNoteBox = false;
        if (pg) showPage(pg, document.querySelector('.nav-btn[data-page="' + pg + '"]'));
        showToast('✅ ' + ({ ur: 'علامات فارم میں منتقل ہو گئیں', en: 'Symptoms moved to the form', roman: 'Alamat form mein muntaqil ho gain' }[L]));
        return;
    }
    if (!diagnosisPatientId) {
        showToast({ ur: '⚠️ پہلے مریض جوڑیں', en: '⚠️ Link a patient first', roman: '⚠️ Pehle mareez jorein' }[L], 'error');
        studioTogglePatientSearch(true);
        return;
    }
    goToNewVisitPage(diagnosisPatientId);
    setTimeout(function() { if ($('nvSymptoms')) $('nvSymptoms').value = text; }, 700);
    showToast('✅ ' + ({ ur: 'علامات وزٹ فارم میں محفوظ ہو گئیں', en: 'Symptoms saved to visit form', roman: 'Alamat visit form mein mehfooz ho gain' }[L]));
}

function studioFromField(pageId, fieldId) {
    studioFieldPage = pageId; studioFieldSrc = fieldId; studioTab = 'sym';
    showPage('diagnosis', document.querySelector('.nav-btn[data-page="diagnosis"]'));
    switchDxView('studio');
    renderStudioAll();
    showToast('🧪 ' + ({ ur: 'بیماری منتخب کریں، علامات ٹک کریں پھر «محفوظ کریں» دبائیں', en: 'Pick a disease, tick symptoms, then press Save', roman: 'Bimari muntakhib karein, alamat tick karein phir Mehfooz dabain' }[currentLang]));
}

function studioCancelField() {
    var pg = studioFieldPage;
    studioFieldSrc = null; studioFieldPage = null;
    if (pg) showPage(pg, document.querySelector('.nav-btn[data-page="' + pg + '"]'));
    renderStudioDetail();
}

function studioMakeRx() {
    var d = TREATMENT_LIB[studioDx]; if (!d) return;
    var L = currentLang;
    if (!diagnosisPatientId) {
        showToast({ ur: '⚠️ پہلے مریض جوڑیں', en: '⚠️ Link a patient first', roman: '⚠️ Pehle mareez jorein' }[L], 'error');
        studioTogglePatientSearch(true);
        return;
    }
    var ranked = studioRankedRems(d);
    var items = studioSelSyms.size ? ranked.filter(function(x) { return x.score > 0; }) : ranked;
    if (studioSelRems.size) {
        items = ranked.filter(function(x) { return studioSelRems.has(x.key); });
    }
    var rx = items.map(function(it, i) {
        var r = it.r;
        return (i + 1) + '. ' + r.n + (r.pot ? ' (' + r.pot + ')' : '') + '\n   → ' + r.syms.map(function(s) { return s[currentLang] || s.ur; }).join('; ') + (r.mod ? '\n   → 🔄 ' + (r.mod[currentLang] || r.mod.ur) : '');
    }).join('\n\n');
    goToNewVisitPage(diagnosisPatientId);
    setTimeout(function() {
        if ($('nvDiagnosis')) $('nvDiagnosis').value = d.name[currentLang] + ' (' + d.name.en + ')';
        if ($('nvPrescription')) $('nvPrescription').value = rx;
        if ($('nvMethod')) $('nvMethod').value = d.diet[currentLang] || d.diet.ur;
    }, 700);
    showToast('✅ ' + ({ ur: 'نسخہ وزٹ فارم میں منتقل ہو گیا', en: 'Prescription copied to visit form', roman: 'Nuskhah visit form mein muntaqil ho gaya' }[L]));
}

function studioCaseAnalysis() {
    var d = TREATMENT_LIB[studioDx]; if (!d) return;
    var L = currentLang;
    var list = studioSelSyms.size ? studioSelTexts(d)
        : studioEnsureSymPool(d).map(function(it) { return it.t[currentLang] || it.t.ur; });
    var text = list.join('، ') + '. ' + (d.intro[currentLang] || d.intro.ur);
    switchDxView('classic');
    switchDxMode('ai');
    if ($('adxStatement')) $('adxStatement').value = text;
    showToast('🔬 ' + ({ ur: 'کیس تجزیہ (AI) میں منتقل ہو گیا', en: 'Moved to Case Analysis (AI)', roman: 'Case tajzia (AI) mein muntaqil ho gaya' }[L]));
}

function studioRefreshPatient() { if ($('studioSysTabs')) renderStudioDetail(); }

function studioTogglePatientSearch(show) {
    var el = $('studioPatientSearch'); if (!el) return;
    el.style.display = show ? 'block' : 'none';
    if (show) {
        var q = $('studioPatientQuery'), r = $('studioPatientResults');
        if (q) { q.value = ''; q.focus(); }
        if (r) r.innerHTML = '';
    }
}

function studioSearchPatients() {
    var qEl = $('studioPatientQuery'), div = $('studioPatientResults');
    if (!qEl || !div) return;
    var q = qEl.value.trim().toLowerCase();
    if (!q || q.length < 2) { div.innerHTML = ''; return; }
    var res = cachedPatients.filter(function(p) {
        return (p.name && p.name.toLowerCase().indexOf(q) >= 0) ||
            (p.phone && p.phone.indexOf(q) >= 0) ||
            (p.refNo && p.refNo.toLowerCase().indexOf(q) >= 0) ||
            (p.familyNo && p.familyNo.toLowerCase().indexOf(q) >= 0);
    });
    if (!res.length) {
        div.innerHTML = '<div style="padding:8px;color:#95a5a6;text-align:center;font-size:12px;">' +
            ({ ur: '😔 کوئی مریض نہیں ملا', en: '😔 No patient found', roman: '😔 Koi mareez nahi mila' }[currentLang]) + '</div>';
        return;
    }
    var h = '<ul>';
    res.slice(0, 6).forEach(function(p) {
        h += '<li onclick="studioPickPatient(\'' + p.id + '\')"><span>' + escapeHtml(p.name) + '</span><span style="color:#7f8c8d;font-size:11px;">' + escapeHtml(p.refNo) + (p.phone ? ' | ' + escapeHtml(p.phone) : '') + '</span></li>';
    });
    div.innerHTML = h + '</ul>';
}

function studioPickPatient(id) {
    var p = cachedPatients.find(function(x) { return x.id === id; });
    if (!p) return;
    diagnosisPatientId = id;
    var link = $('diagnosisPatientLink');
    if (link) link.style.display = 'block';
    var nm = $('diagnosisPatientName');
    if (nm) nm.textContent = p.name + ' (' + p.refNo + ')';
    studioTogglePatientSearch(false);
    renderStudioDetail();
    showToast('👤 ' + p.name);
}

function studioClearPatient() {
    diagnosisPatientId = null;
    var link = $('diagnosisPatientLink');
    if (link) link.style.display = 'none';
    renderStudioDetail();
}

document.addEventListener('DOMContentLoaded', function() {
    if (!$('studioSysTabs')) return;
    var q = $('studioSearch');
    if (q) q.addEventListener('input', renderStudioList);
    var pq = $('studioPatientQuery');
    if (pq) pq.addEventListener('input', studioSearchPatients);
    var saved = null;
    try { saved = localStorage.getItem('dx_view'); } catch (e) {}
    switchDxView(saved === 'classic' ? 'classic' : 'studio');
    renderStudioAll();
});
