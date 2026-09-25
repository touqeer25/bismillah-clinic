// ============================================================
// Bismillah Clinic — js/parser-engine.js — v81 پارسر انجن (خالص منطق — UI/ڈیٹا بغیر)
// ہر طرح کے ٹیکسٹ (PDF/ایپ/ویب سے کاپی، HTML، txt) کو ہمارے فارمیٹ میں:
//   • صفحہ-بح-صفحہ مینولی پارس (ریپرٹری + بکس + مٹیریا میڈیکا)
//   • کراس-چیک: ہر سطر کا حساب + ادویات/گریڈز کی مکمل مطابقت
//   • ایڈیٹر آپریشنز: ربرک جوڑ/حذف، ٹری درست، ریمیڈی/گریڈ
//   • ZIP ایکسپورٹ (بنا کمپریشن، CRC32) — ریپو میں ڈالنے کے لیے
// Node/tests میں بھی چلتا ہے (module.exports)۔
// ============================================================
(function (root) {
'use strict';
var PE = {};

// ---------- عمومی مدد ----------
PE.normAbbr = function (a) {
    return String(a == null ? '' : a).trim().toLowerCase()
        .replace(/\u00a0/g, ' ').replace(/\s+/g, '')
        .replace(/^[\(,\-–—]+/, '').replace(/[\.,;:\)\-–—]+$/, '');
};
PE.stripCr = function (t) { return String(t || '').replace(/\r/g, ''); };
PE.lines = function (t) { return PE.stripCr(t).split('\n'); };
PE.isKnownAbbr = function (a, known) {
    if (!known) return null;                       // null = معلوم نہیں
    var k = PE.normAbbr(a);
    return Object.prototype.hasOwnProperty.call(known, k);
};
PE.abbrLooksRemedy = function (tok, known, nextTok) {
    var k = PE.normAbbr(tok);
    if (!k || k.length > 14) return false;
    if (!/^[a-z][a-z0-9\-\.]*$/.test(k)) return false;
    var hit = PE.isKnownAbbr(k, known);
    if (hit === true) return true;
    if (hit === false && known && Object.keys(known).length >= 100) {
        // بڑی معلوم فہرست میں نہیں = ریمیڈی نہیں
        return false;
    }
    // فہرست نہ ہو/چھوٹی ہو: روایتی نشانیاں — آخری نقطہ، a-b دھچکا، یا فوراً بعد grade
    if (/\.$/.test(String(tok).trim())) return true;
    if (/^[a-z]{1,8}-[a-z]{1,5}\.?$/.test(k)) return true;
    if (nextTok && /^[1-5]$/.test(String(nextTok)) && /^[a-z]{2,8}$/.test(k)) return true;
    return false;
};

// ---------- گریڈ اسٹائل ----------
// 'digits' (1/2/3) | 'roman' (I/II/III) | 'stars' (* ** ***) | 'none' (سب 1)
PE.parseRemTokens = function (str, gradeStyle, known) {
    var rem = {}, unknown = [], raw = [], badGrade = [];
    var s = ' ' + String(str || '').replace(/[\u00a0\|\u2013\u2014]/g, ' ').replace(/[;,]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
    if (!str || !s.trim()) return { rem: rem, unknown: unknown, raw: raw, badGrade: badGrade };
    var roman = { 'i': 1, 'ii': 2, 'iii': 3 };
    // ٹوکن: [abbr] [grade]? — grade یا تو نمبر ہے، یا roman، یا ستارے
    var re = /([a-zA-Z][a-zA-Z0-9\-\.']{0,13}\.?)\s*(?:([1-5])|(\*{1,3})|([iI]{1,3}))?(?=\s|$)/g;
    // اوپر والا regex الفاظ کو کاٹتا ہے — grade الفاظ کے درمیان بھی ہو سکتا ہے: سادہ ٹوکنائز کرتے ہیں
    var toks = s.split(/\s+/).filter(function (x) { return x.length; });
    var i = 0;
    while (i < toks.length) {
        var t = toks[i];
        if (/^[1-5]$/.test(t) || /^\*{1,3}$/.test(t) || /^(i|ii|iii|I|II|III)$/.test(t)) {
            // تنہا grade ٹوکن — پچھلے rem کو دو
            var keys = Object.keys(rem);
            if (keys.length) {
                var last = keys[keys.length - 1];
                var g = /^[1-5]$/.test(t) ? parseInt(t, 10) : (/^\*{1,3}$/.test(t) ? t.length : roman[t.toLowerCase()] || 1);
                if (g >= 1 && g <= 5) rem[last] = g <= 3 ? g : 3;
                else badGrade.push(t);
                i++;
                continue;
            }
        }
        var m = /^([a-zA-Z][a-zA-Z0-9\-\.']{0,13}\.?)((?:\s*[1-5])?(?:\*{1,3})?)$/.exec(t);
        if (!m) { i++; continue; }
        var ab = PE.normAbbr(m[1]);
        if (!ab || /^\d+$/.test(ab)) { i++; continue; }
        // طے شدہ grade: چپکا ہوا یا اگلا ٹوکن (nextTok پہلے محفوظ کرو — شناخت کے لیے)
        var nextTok = toks[i + 1];
        var g = 1;
        var glued = m[2] ? m[2].trim() : '';
        if (/^[1-5]$/.test(glued)) g = parseInt(glued, 10);
        else if (/^\*{1,3}$/.test(glued)) g = glued.length;
        else if (i + 1 < toks.length) {
            var nx = toks[i + 1];
            if (/^[1-5]$/.test(nx)) { g = parseInt(nx, 10); i++; }
            else if (/^\*{1,3}$/.test(nx)) { g = nx.length; i++; }
            else if (/^(i|ii|iii|I|II|III)$/.test(nx) && (gradeStyle || 'digits') === 'roman') { g = roman[nx.toLowerCase()] || 1; i++; }
        }
        if (gradeStyle === 'roman' && /^(i|ii|iii|I|II|III)$/.test(glued)) g = roman[glued.toLowerCase()] || 1;
        if (gradeStyle === 'none') g = 1;
        if (!(g >= 1 && g <= 5)) { badGrade.push(t); g = 1; }
        var isRem = PE.abbrLooksRemedy(m[1], known, nextTok);
        if (!isRem) {
            // الفاظ: صرف انہیں ریمیڈی سمجھو جو معلوم ہوں یا روایتی شکل رکھتے ہوں
            unknown.push(ab);
            i++;
            continue;
        }
        if (PE.isKnownAbbr(ab, known) === false) unknown.push(ab);
        rem[ab] = g > 3 ? 3 : g;
        raw.push(t);
        i++;
    }
    return { rem: rem, unknown: unknown, raw: raw, badGrade: badGrade };
};

// ---------- صفحے ----------
PE.splitPages = function (text, opts) {
    opts = opts || {};
    var t = PE.stripCr(text);
    var pages = [];
    var mode = opts.mode || 'formfeed';
    if (mode === 'single') { pages.push({ no: 1, text: t, startLine: 0 }); return pages; }
    if (mode === 'formfeed') {
        var parts = t.split(/\f|(?:\n[ \t]*\n[ \t]*<<<PAGE>>>[ \t]*\n)/);
        var ln = 0;
        parts.forEach(function (p, i) {
            pages.push({ no: i + 1, text: p, startLine: ln });
            ln += PE.lines(p).length;
        });
        return pages.filter(function (p) { return p.text.trim().length; });
    }
    if (mode === 'every') {
        var n = Math.max(1, parseInt(opts.n, 10) || 25);
        var ls = PE.lines(t), ln2 = 0;
        for (var i = 0; i < ls.length; i += n) {
            var seg = ls.slice(i, i + n).join('\n');
            pages.push({ no: pages.length + 1, text: seg, startLine: i });
        }
        return pages.filter(function (p) { return p.text.trim().length; });
    }
    if (mode === 'regex') {
        var re = opts.regex ? new RegExp(opts.regex, 'gim') : /^\s*page\s+\d+/gim;
        var last = 0, lastLine = 0, whole = PE.lines(t);
        var idxs = [];
        var m2;
        var pos = 0;
        whole.forEach(function (line, li) {
            re.lastIndex = 0;
            if (re.test(line)) idxs.push({ startLine: li });
        });
        idxs.forEach(function (ix, i2) {
            var end = i2 + 1 < idxs.length ? idxs[i2 + 1].startLine : whole.length;
            pages.push({ no: i2 + 1, text: whole.slice(ix.startLine, end).join('\n'), startLine: ix.startLine });
        });
        return pages.filter(function (p) { return p.text.trim().length; });
    }
    pages.push({ no: 1, text: t, startLine: 0 });
    return pages;
};

// ---------- HTML سے ٹیکسٹ (bold/italic = گریڈ کے اشارے) ----------
PE.htmlLines = function (html) {
    var s = String(html || '');
    var out = [];          // {text, styles:[{s,e,style}]}
    var cur = { text: '', styles: [] };
    var stack = [];
    var i = 0;
    function pushLine() { if (cur.text.length || cur.styles.length) out.push(cur); cur = { text: '', styles: [] }; }
    while (i < s.length) {
        if (s.charAt(i) === '<') {
            var j = s.indexOf('>', i);
            if (j < 0) break;
            var tag = s.substring(i + 1, j).toLowerCase().trim();
            if (tag === 'br' || tag === 'br/' || /^p\b/.test(tag) || /^div\b/.test(tag) || /^h[1-6]\b/.test(tag) || tag === '/p' || tag === '/div' || /^\/h[1-6]/.test(tag)) {
                if (cur.text.trim() || cur.styles.length) pushLine();
            } else if (/^(b|strong)\b/.test(tag)) stack.push('b');
            else if (/^(i|em)\b/.test(tag)) stack.push('i');
            else if (/^\/(b|strong|i|em)/.test(tag)) stack.pop();
            i = j + 1;
            continue;
        }
        if (s.charAt(i) === '\n') { pushLine(); i++; continue; }
        var k = i;
        while (k < s.length && s.charAt(k) !== '<' && s.charAt(k) !== '\n') k++;
        var chunk = s.substring(i, k);
        chunk = chunk.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        if (stack.length) cur.styles.push({ s: cur.text.length, e: cur.text.length + chunk.length, style: stack[stack.length - 1] });
        cur.text += chunk;
        i = k;
    }
    if (cur.text.trim() || cur.styles.length) pushLine();
    return out.map(function (o) { o.text = o.text.replace(/\s+$/, ''); return o; });
};

// ---------- ریپرٹری: سطر کو path + rem میں تقسیم ----------
PE.splitPathRem = function (line, prof) {
    prof = prof || {};
    var t = String(line || '').replace(/\s+$/, '');
    var seps = {
        '2sp': /\s{2,}|\t+/,
        'colon': /\s*:\s+/,
        'dash3': /\s\.\s\.\s\.\s*|\s…+\s*/,
        'tab': /\t+/
    };
    var sp = seps[prof.remSplit] || null;
    if (prof.remSplit === 'auto' || !prof.remSplit) {
        // ترجیح: 2+ خالی جگہ → : → تین نقطے
        sp = /\s{2,}|\t+/;
        if (!sp.test(t) && /\s*:\s+\S/.test(t) && !/https?:/.test(t)) sp = /\s*:\s+/;
        else if (!sp.test(t) && /\s(\.\s\.\s\.\s*|…+\s*)/.test(t)) sp = /\s\.\s\.\s\.\s*|\s…+\s*/;
    }
    var cut = -1, remStr = '';
    if (sp) {
        var mm = null, re2 = new RegExp(sp.source, 'g');
        while ((mm = re2.exec(t))) cut = mm.index;      // آخری تقسیم = rem کی شروعات
        if (cut > 0) { remStr = t.substring(cut).replace(/^[\s:\.…]+/, ''); }
    }
    if (cut <= 0) {
        // ٹیل-رون: آخر سے مسلسل ریمیڈی ٹوکن ڈھونڈھو (معلوم فہرست کے ساتھ)
        var toks = t.split(/\s+/);
        var start = -1;
        for (var i = toks.length - 1; i >= 0; i--) {
            var tk = toks[i];
            if (/^[1-5]$/.test(tk) || /^\*{1,3}$/.test(tk) || /^(i|ii|iii|I|II|III)$/.test(tk)) continue;
            if (PE.abbrLooksRemedy(tk, prof.known, toks[i + 1])) { start = i; continue; }
            break;
        }
        // کم از کم ایک واضح ریمیڈی + اس سے پہلے path جیسا لفظ
        if (start > 0) {
            var remToks = toks.slice(start);
            var remOK = remToks.filter(function (x) { return !/^[1-5*]+$/.test(x) && !/^(i|ii|iii|I|II|III)$/i.test(x); });
            if (remOK.length && remOK.every(function (x) { return PE.abbrLooksRemedy(x, prof.known); })) {
                cut = t.indexOf(toks[start]);
                remStr = t.substring(cut);
            }
        }
    }
    if (cut <= 0) return { path: t.trim(), remStr: '' };
    return { path: t.substring(0, cut).replace(/[\s:\.…\-–—]+$/, '').trim(), remStr: remStr.trim() };
};

// ---------- path سیگمنٹس ----------
PE.segs = function (path, sep) {
    path = String(path || '').trim();
    if (!path) return [];
    if (sep === 'dash') return path.split(/\s+-\s+/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (sep === 'tab') return path.split(/\t+/).map(function (x) { return x.trim(); }).filter(Boolean);
    // comma (default): کوما پیرنٹھیسس سے باہر
    var parts = [], buf = '', depth = 0;
    for (var i = 0; i < path.length; i++) {
        var ch = path.charAt(i);
        if (ch === '(') { depth++; buf += ch; continue; }
        if (ch === ')') { if (depth > 0) depth--; buf += ch; continue; }
        if (ch === ',' && depth === 0) {
            if (buf.trim()) parts.push(buf.trim());
            buf = '';
            while (i + 1 < path.length && /\s/.test(path.charAt(i + 1))) i++;
            continue;
        }
        buf += ch;
    }
    if (buf.trim()) parts.push(buf.trim());
    return parts;
};
PE.joinSegs = function (segs, sep) {
    return (segs || []).join(sep === 'dash' ? ' - ' : ', ');
};

// ---------- ریپرٹری صفحہ پارس ----------
PE.parseRepPage = function (pageText, prof) {
    prof = prof || {};
    var known = prof.known || null;
    var gradeStyle = prof.gradeStyle || 'digits';
    var skipRe = prof.skipRe ? new RegExp(prof.skipRe, 'i') : null;
    var chapterRe = prof.chapterRe ? new RegExp(prof.chapterRe, 'i') : null;
    var contRe = /^\s{2,}\S/;                          // ہندسہ-دار تسلسل = پچھلی سطر کی rem کا حصہ
    var ls = PE.lines(pageText);
    var rows = [], unmatched = [], lineMap = {}, chapter = null, issues = [];
    var lastRow = -1;
    ls.forEach(function (line, i) {
        if (!line.trim()) { lineMap[i] = 'blank'; return; }
        if (skipRe && skipRe.test(line)) { lineMap[i] = 'skip'; return; }
        if (chapterRe) {
            var cm = chapterRe.exec(line);
            if (cm) {
                chapter = (cm[1] || cm[0] || '').replace(/^[\s:#.\-–—]+|[\s:#.\-–—]+$/g, '');
                lineMap[i] = 'chapter';
                return;
            }
        }
        // تسلسل سطر: ہندسہ-دار یا صرف-ریمیڈی سطر = پچھلی ربرک میں ضم
        var trim = line.trim();
        var lToks = trim.split(/\s+/).filter(Boolean);
        var allRem = lToks.length && lToks.every(function (x, xi) {
            return /^[1-5*]+$/.test(x) || /^(i|ii|iii)$/i.test(x) || PE.abbrLooksRemedy(x, known, lToks[xi + 1]);
        });
        if (prof.contIndent !== false && lastRow >= 0 && (/^\s{2,}/.test(line) || allRem) && (!PE.splitPathRem(line, prof).remStr || allRem)) {
            if (allRem && Object.keys(PE.parseRemTokens(trim, gradeStyle, known).rem).length) {
                var extra = PE.parseRemTokens(trim, gradeStyle, known);
                var prev = rows[lastRow];
                Object.keys(extra.rem).forEach(function (a) { prev.rem[a] = extra.rem[a]; });
                prev.lines.push(i);
                lineMap[i] = 'cont';
                return;
            }
        }
        var pr = PE.splitPathRem(line, prof);
        var segs = PE.segs(pr.path, prof.sep || 'comma');
        if (!segs.length) { unmatched.push(i); lineMap[i] = 'unmatched'; return; }
        var parsedRem = PE.parseRemTokens(pr.remStr, gradeStyle, known);
        // ساخت: rem ہو، یا کئی سیگمنٹ ہوں، یا راستے میں الگ-کنندہ نشان — ورنہ سطر مشکوک (دستی فیصلہ)
        var hasStruct = !!pr.remStr || segs.length > 1 || /[,\-–—:;()]/.test(pr.path);
        if (!hasStruct) { unmatched.push(i); lineMap[i] = 'unmatched'; return; }
        var row = {
            path: pr.path,
            segs: segs,
            rem: parsedRem.rem,
            remRaw: pr.remStr,
            unknown: parsedRem.unknown,
            badGrade: parsedRem.badGrade,
            lines: [i],
            chapter: chapter
        };
        rows.push(row);
        lastRow = rows.length - 1;
        lineMap[i] = 'row:' + lastRow;
    });
    return { rows: rows, chapter: chapter, unmatched: unmatched, lineMap: lineMap, total: ls.length, issues: issues };
};

// ---------- کراس-چیک (صفحے کی تصدیق) ----------
PE.crossCheckRep = function (pageText, parsed, prof) {
    prof = prof || {};
    var known = prof.known || null;
    var ls = PE.lines(pageText);
    var issues = [], remCheck = [], unknownAbbr = [], badGrade = [], dups = {};
    var mapped = 0, skipped = 0, cont = 0;
    var srcChars = 0, rowChars = 0;
    Object.keys(parsed.lineMap).forEach(function (k) {
        var v = parsed.lineMap[k];
        if (v === 'skip') skipped++;
        else if (v === 'cont') { cont++; mapped++; }
        else if (v.indexOf('row:') === 0 || v === 'chapter') mapped++;
    });
    parsed.rows.forEach(function (row, ri) {
        // 1) دوبارہ نکال: سطر(وں) سے rem ٹوکن — نتیجہ row.rem سے ملا
        var src = row.lines.map(function (li) { return ls[li] || ''; }).join(' ');
        var pr = PE.splitPathRem(src, prof);
        var again = PE.parseRemTokens(pr.remStr || (row.lines.length > 1 ? src.replace(row.path, '') : ''), prof.gradeStyle || 'digits', known);
        var missing = [], extra = [], gradeDiff = [];
        var srcRem = again.rem;
        Object.keys(row.rem).forEach(function (a) {
            if (!srcRem.hasOwnProperty(a)) {
                // ہو سکتا ہے splitPathRem نے rem سٹرنگ الگ لی ہو — poore src سے دوبارہ
                var whole = PE.parseRemTokens(src.replace(row.path, ''), prof.gradeStyle || 'digits', known).rem;
                if (whole.hasOwnProperty(a)) srcRem[a] = Math.max(srcRem[a] || 0, whole[a]);
                else missing.push(a);
            } else if (srcRem[a] !== row.rem[a]) gradeDiff.push(a + ':' + row.rem[a] + '≠' + srcRem[a]);
        });
        Object.keys(srcRem).forEach(function (a) { if (!row.rem.hasOwnProperty(a)) extra.push(a); });
        // پوشیدہ دوبارہ: اگر missing/extra ہو تو پوری سطر سے صرف rem-رول دوبارہ لگاؤ (path الفاظ چھوڑ کر)
        if (missing.length || extra.length) {
            var bare = row.lines.map(function (li) { return ls[li] || ''; }).join(' ');
            var tail = bare.replace(row.path, ' ');
            var alt = PE.parseRemTokens(tail, prof.gradeStyle || 'digits', known).rem;
            missing = missing.filter(function (a) { return !alt.hasOwnProperty(a); });
            extra = extra.filter(function (a) { return !(row.rem.hasOwnProperty(a) && !alt.hasOwnProperty(a)) && !row.rem.hasOwnProperty(a); });
            Object.keys(alt).forEach(function (a) {
                if (row.rem.hasOwnProperty(a) && alt[a] !== row.rem[a]) gradeDiff.push(a + ':' + row.rem[a] + '≠' + alt[a]);
            });
        }
        if (missing.length || extra.length || gradeDiff.length) remCheck.push({ row: ri, path: row.path, missing: missing, extra: extra, gradeDiff: gradeDiff });
        (row.unknown || []).forEach(function (a) { if (unknownAbbr.indexOf(a) < 0) unknownAbbr.push(a); });
        (row.badGrade || []).forEach(function (g) { badGrade.push(g); });
        var key = row.path.toLowerCase();
        if (dups[key]) dups[key].push(ri); else dups[key] = [ri];
        srcChars += src.length;
        rowChars += row.path.length + row.remRaw.length;
    });
    var dupList = Object.keys(dups).filter(function (k) { return dups[k].length > 1; })
        .map(function (k) { return { path: k, rows: dups[k] }; });
    var unmatched = (parsed.unmatched || []).map(function (i) { return { i: i, text: (ls[i] || '').trim() }; });
    var tot = parsed.total || ls.length;
    var accounted = mapped + skipped + unmatched.length;
    var coverage = tot ? Math.min(1, (rowChars) / Math.max(1, srcChars || 1)) : 1;
    // حتمی فیصلہ: ہر سطر کا حساب + ہر rem ٹوکن مطابق + گریڈز درست
    var ok = unmatched.length === 0 && remCheck.length === 0 && badGrade.length === 0 && parsed.rows.length > 0;
    if (unmatched.length) issues.push(parsed.unmatched.length + ' سطر(یں) بغیر حساب (نیچے دیکھیں)');
    if (remCheck.length) issues.push(remCheck.length + ' ربرک میں ادویات/گریڈز کی مکمل مطابقت نہیں');
    if (badGrade.length) issues.push('غیر معیاری گریڈ');
    if (!parsed.rows.length) issues.push('کوئی ربرک پارس نہیں ہوا');
    return {
        ok: ok,
        lines: { total: tot, mapped: mapped, skipped: skipped, cont: cont, unmatched: unmatched },
        remCheck: remCheck,
        unknownAbbr: unknownAbbr,
        badGrade: badGrade,
        dups: dupList,
        coverage: coverage,
        issues: issues
    };
};

// ---------- مواد (بک / مٹیریا میڈیکا) پارس ----------
// prof: {entryRe, headRe, skipRe} — entryRe = نام سطر (باب/ریمیڈی)، headRe = اندر کا عنوان
PE.parseContentPage = function (pageText, prof) {
    prof = prof || {};
    var ls = PE.lines(pageText);
    var entries = [], lineMap = {}, unmatched = [];
    var entryRe = prof.entryRe ? new RegExp(prof.entryRe) : null;
    var headRe = prof.headRe ? new RegExp(prof.headRe, 'i') : null;
    var skipRe = prof.skipRe ? new RegExp(prof.skipRe, 'i') : null;
    var cur = null, curSec = null, paraBuf = [];
    function flushPara() {
        if (paraBuf.length && cur && curSec) { curSec.p.push(paraBuf.join(' ')); paraBuf = []; }
    }
    ls.forEach(function (line, i) {
        if (!line.trim()) { flushPara(); lineMap[i] = 'blank'; return; }
        if (skipRe && skipRe.test(line)) { flushPara(); lineMap[i] = 'skip'; return; }
        if (entryRe) {
            var em = entryRe.exec(line);
            if (em) {
                flushPara();
                cur = { name: (em[1] || line).trim(), abbr: prof.entryAbbrFromName ? String(em[1] || line).trim().split(/\s+/)[0].toLowerCase() : '', sections: [] };
                entries.push(cur);
                curSec = null;
                lineMap[i] = 'entry:' + (entries.length - 1);
                var restE = line.substring(em[0].length).trim();
                if (restE) { curSec = { h: '', p: [] }; cur.sections.push(curSec); paraBuf.push(restE); }
                return;
            }
        }
        if (headRe) {
            var hm = headRe.exec(line);
            if (hm) {
                flushPara();
                if (!cur) { cur = { name: prof.defaultName || 'Text', abbr: '', sections: [] }; entries.push(cur); }
                curSec = { h: (hm[1] != null ? hm[1] : line).trim(), p: [] };
                cur.sections.push(curSec);
                lineMap[i] = 'head:' + (entries.length - 1);
                var restH = line.substring(hm[0].length).trim();
                if (restH) paraBuf.push(restH);
                return;
            }
        }
        if (!cur) { cur = { name: prof.defaultName || 'Text', abbr: '', sections: [] }; entries.push(cur); }
        if (!curSec) { curSec = { h: '', p: [] }; cur.sections.push(curSec); }
        paraBuf.push(line.trim());
        lineMap[i] = 'para:' + (entries.length - 1);
    });
    flushPara();
    var tot = ls.length, mapped = 0, skipped = 0;
    Object.keys(lineMap).forEach(function (k) { var v = lineMap[k]; if (v === 'skip') skipped++; else if (v !== 'unmatched' && v !== 'blank') mapped++; });
    return { entries: entries, lineMap: lineMap, unmatched: unmatched, total: tot };
};
PE.crossCheckContent = function (pageText, parsed) {
    var ls = PE.lines(pageText);
    var tot = parsed.total || ls.length;
    var mapped = 0, skipped = 0, blank = 0, chars = 0, got = 0;
    Object.keys(parsed.lineMap).forEach(function (k) {
        var v = parsed.lineMap[k], i = +k;
        if (v === 'skip') skipped++;
        else if (v === 'blank') blank++;
        else if (v !== 'unmatched') { mapped++; got += ((ls[i] || '').trim().length); }
        if (v !== 'blank' && v !== 'skip') chars += ((ls[i] || '').trim().length);
    });
    var ok = parsed.entries.length > 0 && mapped + skipped + blank === tot;
    return {
        ok: ok,
        lines: { total: tot, mapped: mapped, skipped: skipped, cont: 0, unmatched: (parsed.unmatched || []).map(function (i) { return { i: i, text: ls[i] }; }) },
        coverage: chars ? Math.min(1, got / chars) : 1,
        issues: ok ? [] : ['کچھ سطریں بغیر حساب']
    };
};

// ---------- ایپ فارمیٹ ----------
PE.rowsToChapter = function (rows, opts) {
    opts = opts || {};
    var sep = opts.sep || 'comma';
    var data = {}, n = opts.start || 0;
    rows.forEach(function (row) {
        n++;
        var rid = 'x' + n;
        var path = row.path || PE.joinSegs(row.segs, sep);
        data[rid] = { t: path, r: row.rem || {} };
    });
    return { data: data, next: n };
};
PE.contentToLibBook = function (entries, meta) {
    meta = meta || {};
    var sections = [];
    entries.forEach(function (e) {
        if (!e.sections.length) sections.push({ h: e.name, p: [] });
        e.sections.forEach(function (s) { sections.push({ h: s.h || e.name, p: s.p.slice() }); });
    });
    var words = 0;
    sections.forEach(function (s) { s.p.forEach(function (p) { words += p.split(/\s+/).length; }); });
    return {
        title: meta.title || 'Untitled', author: meta.author || '', year: meta.year || '',
        source: meta.source || '', sections: sections,
        _words: words
    };
};
PE.contentToMMBook = function (entries, meta) {
    meta = meta || {};
    var remedies = {};
    entries.forEach(function (e) {
        var ab = PE.normAbbr(e.abbr || e.name);
        remedies[ab] = { name: e.name, sections: e.sections.map(function (s) { return { h: s.h, p: s.p.slice() }; }) };
    });
    return {
        id: meta.id || 'custom_mm', title: meta.title || 'Untitled', author: meta.author || '',
        year: meta.year || '', source: meta.source || '', license: meta.license || 'public domain',
        remedies: remedies, unmatched: []
    };
};

// ---------- ایڈیٹر آپریشنز (سب in-place؛ data = {rid:{t,r}}) ----------
PE.opAddRubric = function (data, path, rem, opts) {
    opts = opts || {};
    var rid = opts.rid || ('x' + (Date.now() % 1000000) + Math.floor(Math.random() * 90 + 10));
    data[rid] = { t: String(path), r: rem || {} };
    return rid;
};
PE.opDelRubric = function (data, rid, opts) {
    opts = opts || {};
    var rec = data[rid];
    if (!rec) return { deleted: 0, reparented: 0 };
    var sep = opts.sep === 'dash' ? ' - ' : ', ';
    var pfx = rec.t + sep;
    var deleted = 1, reparented = 0;
    Object.keys(data).forEach(function (k) {
        if (k === rid) return;
        var t = data[k].t;
        if (t.indexOf(pfx) === 0) {
            if (opts.reparent) {
                var parentPfx = '';
                var si = rec.t.lastIndexOf(sep === ' - ' ? /\s+-\s+/ : /,\s*/.test(rec.t) ? ',' : sep);
                // والد = rec.t سے آخری سیگمنٹ ہٹاؤ
                var segs = PE.segs(rec.t, opts.sep || 'comma');
                segs = segs.slice(0, -1);
                parentPfx = segs.length ? PE.joinSegs(segs, opts.sep || 'comma') + sep : '';
                data[k].t = parentPfx + t.substring(pfx.length);
                reparented++;
            } else {
                delete data[k];
                deleted++;
            }
        }
    });
    delete data[rid];
    return { deleted: deleted, reparented: reparented };
};
PE.opSetPath = function (data, rid, newPath) {
    if (!data[rid]) return false;
    data[rid].t = String(newPath);
    return true;
};
PE.opMoveSubtree = function (data, rid, newParentPath, opts) {   // ٹری درست: ذیل کو نئے والد نیچے منتقل
    opts = opts || {};
    var rec = data[rid];
    if (!rec) return 0;
    var sep = opts.sep === 'dash' ? ' - ' : ', ';
    var segs = PE.segs(rec.t, opts.sep || 'comma');
    var label = segs[segs.length - 1];
    var np = String(newParentPath || '').replace(new RegExp(sep.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$'), '');
    var nt = np ? np + sep + label : label;
    var oldPfx = rec.t + sep, newPfx = nt + sep, n = 0;
    Object.keys(data).forEach(function (k) {
        if (data[k].t.indexOf(oldPfx) === 0) {
            data[k].t = newPfx + data[k].t.substring(oldPfx.length);
            n++;
        }
    });
    rec.t = nt;
    return n + 1;
};
PE.opAddRem = function (data, rid, abbr, g) {
    if (!data[rid]) return false;
    abbr = PE.normAbbr(abbr);
    if (!abbr) return false;
    g = Math.max(1, Math.min(3, parseInt(g, 10) || 1));
    data[rid].r[abbr] = g;
    return true;
};
PE.opDelRem = function (data, rid, abbr) {
    if (!data[rid] || !data[rid].r) return false;
    delete data[rid].r[PE.normAbbr(abbr)];
    return true;
};
PE.opSetGrade = function (data, rid, abbr, g) {
    return PE.opAddRem(data, rid, abbr, g);
};

// ---------- ضم (پیج کمیٹ → ہدف) ----------
// mode: 'new' (نیا ربرک ہی، دہرا چھوڑ) | 'merge' (remedies ضم، grade = بلند) | 'overwrite'
PE.mergeChapter = function (base, rows, opts) {
    opts = opts || {};
    var mode = opts.mode || 'new';
    var sep = opts.sep === 'dash' ? ' - ' : ', ';
    var byPath = {};
    Object.keys(base).forEach(function (rid) { byPath[base[rid].t.toLowerCase()] = rid; });
    var added = 0, merged = 0, dups = [], next = opts.next || Object.keys(base).length;
    rows.forEach(function (row) {
        var path = row.path || PE.joinSegs(row.segs, opts.sep || 'comma');
        var key = path.toLowerCase();
        if (byPath[key]) {
            if (mode === 'new') { dups.push(path); return; }
            var rid2 = byPath[key];
            if (mode === 'overwrite') { base[rid2].r = row.rem || {}; merged++; return; }
            Object.keys(row.rem || {}).forEach(function (a) {
                var g = row.rem[a] || 1;
                if (!base[rid2].r[a] || base[rid2].r[a] < g) base[rid2].r[a] = g;
            });
            merged++;
        } else {
            next++;
            var rid = 'x' + next;
            base[rid] = { t: path, r: row.rem || {} };
            byPath[key] = rid;
            added++;
        }
    });
    return { added: added, merged: merged, dups: dups, next: next };
};

// ---------- _index.json بناؤ (ریپرٹری) ----------
PE.buildIndex = function (chapters /* {chKey:{name, data}} */) {
    return Object.keys(chapters).map(function (k) {
        return { key: k, name: chapters[k].name, rubrics: Object.keys(chapters[k].data).length };
    });
};

// ---------- CRC32 + ZIP (store) ----------
var CRC_T = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t[n] = c >>> 0;
    }
    return t;
})();
PE.crc32 = function (buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) c = CRC_T[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
};
PE.makeZip = function (files) {
    // files: {'path': str|Uint8Array} → ZIP (method=0 store)
    var enc = new TextEncoder();
    var parts = [], central = [], offset = 0;
    Object.keys(files).forEach(function (name) {
        var nb = enc.encode(name);
        var data = typeof files[name] === 'string' ? enc.encode(files[name]) : files[name];
        var crc = PE.crc32(data);
        var lh = new Uint8Array(30 + nb.length);
        var dv = new DataView(lh.buffer);
        dv.setUint32(0, 0x04034b50, true);
        dv.setUint16(4, 20, true); dv.setUint16(6, 0x0800, true); dv.setUint16(8, 0, true);
        dv.setUint16(10, 0, true); dv.setUint16(12, 0x2A21, true);
        dv.setUint32(14, crc, true); dv.setUint32(18, data.length, true); dv.setUint32(22, data.length, true);
        dv.setUint16(26, nb.length, true); dv.setUint16(28, 0, true);
        lh.set(nb, 30);
        parts.push(lh, data);
        var ch = new Uint8Array(46 + nb.length);
        var cv = new DataView(ch.buffer);
        cv.setUint32(0, 0x02014b50, true);
        cv.setUint16(4, 20, true); cv.setUint16(6, 20, true); cv.setUint16(8, 0x0800, true); cv.setUint16(10, 0, true);
        cv.setUint16(12, 0, true); cv.setUint16(14, 0x2A21, true);
        cv.setUint32(16, crc, true); cv.setUint32(20, data.length, true); cv.setUint32(24, data.length, true);
        cv.setUint16(28, nb.length, true);
        cv.setUint32(42, offset, true);
        ch.set(nb, 46);
        central.push(ch);
        offset += lh.length + data.length;
    });
    var cdSize = central.reduce(function (a, b) { return a + b.length; }, 0);
    var end = new Uint8Array(22);
    var ev = new DataView(end.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(8, Object.keys(files).length, true);
    ev.setUint16(10, Object.keys(files).length, true);
    ev.setUint32(12, cdSize, true);
    ev.setUint32(16, offset, true);
    var total = offset + cdSize + 22;
    var out = new Uint8Array(total);
    var at = 0;
    parts.forEach(function (p) { out.set(p, at); at += p.length; });
    central.forEach(function (p) { out.set(p, at); at += p.length; });
    out.set(end, at);
    return out;
};

root.PE = PE;
if (typeof module !== 'undefined' && module.exports) module.exports = PE;
})(typeof window !== 'undefined' ? window : globalThis);
