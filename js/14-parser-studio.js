/* js/14-parser-studio.js — v81: پارسر اسٹوڈیو — کسی بھی ماخذ (PDF/ایپ/ویب) سے ایپ-فارمیٹ میں دستی صفحہ-بہ-صفحہ پارس +
   کراس-چیک (بالکل درست اور مکمل) + موجودہ ریپرٹری/کتابوں کا ایڈیٹر + اووررائیڈ/اپنی مواد + ZIP ایکسپورٹ (دستی push) */
(function () {
  'use strict';
  var PE = window.PE;
  var KEY = 'bc_parser_store_v1';
  var S = null;
  function dflt() { return { overrides: { rep: {}, lib: {}, mm: {} }, custom: { rep: {}, lib: {}, mm: {} }, staging: {}, profiles: {} }; }
  function loadStore() { try { S = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { S = null; } if (!S) S = dflt(); ['overrides', 'custom', 'staging', 'profiles'].forEach(function (k) { if (!S[k]) S[k] = (k === 'profiles' || k === 'staging') ? {} : { rep: {}, lib: {}, mm: {} }; }); return S; }
  function saveStore() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }
  function st() { return S || loadStore(); }

  /* ============ ہکس: لوڈرز یہاں سے اووررائیڈ/اپنی مواد لگاتے ہیں ============ */
  function hasCustomRep(bookId) { return bookId === 'custom_rep'; }
  function customRepIndex() {
    var c = st().custom.rep;
    return Object.keys(c).map(function (n) { return { key: n, name: n, rubrics: Object.keys(c[n]).length }; });
  }
  function customRepChapter(bookId, name) {
    if (!hasCustomRep(bookId)) return {};
    var ch = st().custom.rep[name];
    return ch ? JSON.parse(JSON.stringify(ch)) : {};
  }
  function applyRepOverrides(bookId, chKey, chData) {
    var ov = st().overrides.rep[bookId]; if (!ov) return chData;
    var chOv = ov[chKey]; if (!chOv) return chData;
    Object.keys(chOv).forEach(function (rid) {
      if (chOv[rid] == null) delete chData[rid]; else chData[rid] = chOv[rid];
    });
    return chData;
  }
  function hookRepIndex(bookId, names) {
    var ov = st().overrides.rep[bookId]; if (!ov) return names;
    names.forEach(function (n) {
      var chOv = ov[n.key]; if (!chOv) return;
      var add = 0, del = 0;
      Object.keys(chOv).forEach(function (rid) { if (chOv[rid] == null) del++; else add++; });
      n.rubrics = Math.max(0, (n.rubrics || 0) + add - del);
    });
    return names;
  }
  function findRid(bookId, rid) {
    var stO = st();
    var c = stO.custom.rep;
    var names = Object.keys(c);
    for (var i = 0; i < names.length; i++) {
      if (c[names[i]][rid]) return { n: 1, rid: rid, book: 'custom_rep', chapter: names[i], rec: JSON.parse(JSON.stringify(c[names[i]][rid])), chData: customRepChapter('custom_rep', names[i]) };
    }
    var ov = stO.overrides.rep[bookId] || {};
    var chs = Object.keys(ov);
    for (var j = 0; j < chs.length; j++) {
      if (Object.prototype.hasOwnProperty.call(ov[chs[j]], rid) && ov[chs[j]][rid] != null) {
        return { n: 1, rid: rid, book: bookId, chapter: chs[j], rec: ov[chs[j]][rid], chData: {} };
      }
    }
    return null;
  }
  function isDeletedRid(bookId, rid) {
    var ov = st().overrides.rep[bookId] || {};
    var chs = Object.keys(ov);
    for (var j = 0; j < chs.length; j++) {
      if (Object.prototype.hasOwnProperty.call(ov[chs[j]], rid) && ov[chs[j]][rid] == null) return true;
    }
    return false;
  }
  function applyRepSearchParsed(bookId, parsed) {
    var ov = st().overrides.rep[bookId]; if (!ov || !parsed) return parsed;
    var chOv = ov[parsed.ch || parsed.chapter]; if (!chOv) return parsed;
    if (Object.prototype.hasOwnProperty.call(chOv, parsed.rid)) {
      if (chOv[parsed.rid] == null) parsed.rec = null; else parsed.rec = chOv[parsed.rid];
    }
    return parsed;
  }
  function applyAllBooks(bookId, master) {
    var ov = st().overrides.rep[bookId]; if (!ov) return master;
    Object.keys(ov).forEach(function (chKey) {
      var chOv = ov[chKey]; if (!chOv) return;
      if (!master[chKey]) master[chKey] = {};
      Object.keys(chOv).forEach(function (rid) {
        if (chOv[rid] == null) delete master[chKey][rid]; else master[chKey][rid] = chOv[rid];
      });
    });
    return master;
  }
  function hookLibIndex(idx) {
    var stO = st();
    Object.keys(stO.custom.lib).forEach(function (id) {
      var b = stO.custom.lib[id];
      if (!idx.books.some(function (x) { return x.id === id; })) {
        idx.books.push({ id: id, title: b.title, author: b.author || '', year: b.year || '', file: 'library/' + id + '.json', sections: b.sections.length, words: 0, source: b.source || 'custom' });
      }
    });
    Object.keys(stO.overrides.lib).forEach(function (id) {
      if (!stO.overrides.lib[id]) idx.books = idx.books.filter(function (x) { return x.id !== id; });
    });
    return idx;
  }
  function applyLibBook(id, book) {
    var stO = st();
    if (stO.overrides.lib[id] === null) return null;
    if (stO.overrides.lib[id]) return JSON.parse(JSON.stringify(stO.overrides.lib[id]));
    if (stO.custom.lib[id]) return JSON.parse(JSON.stringify(stO.custom.lib[id]));
    return book;
  }
  function hookMMIndex(idx) {
    var stO = st();
    Object.keys(stO.custom.mm).forEach(function (id) {
      var b = stO.custom.mm[id];
      if (!idx.books[id]) idx.books[id] = { title: b.title, author: b.author || '', year: b.year || '', file: id + '.json', remedies: Object.keys(b.remedies).length };
    });
    return idx;
  }
  function customRepMaster() {
    var c = st().custom.rep; var out = {};
    Object.keys(c).forEach(function (n) {
      out[n] = JSON.parse(JSON.stringify(c[n]));
      var ov = st().overrides.rep.custom_rep && st().overrides.rep.custom_rep[n];
      if (ov) Object.keys(ov).forEach(function (rid) { if (ov[rid] == null) delete out[n][rid]; else out[n][rid] = ov[rid]; });
    });
    return out;
  }
  function bustCaches() {
    try {
      if (typeof repTreeCache !== 'undefined' && repTreeCache) Object.keys(repTreeCache).forEach(function (k) { delete repTreeCache[k]; });
      if (typeof _repFullData !== 'undefined') _repFullData = null;
      if (typeof _allBooksData !== 'undefined') _allBooksData = null;
    } catch (e) {}
  }
  function applyMMBook(id, data) {
    var stO = st();
    if (stO.custom.mm[id]) return JSON.parse(JSON.stringify(stO.custom.mm[id]));
    return data;
  }

  /* ============ ZIP ایکسپورٹ: محض تبدیل شدہ فائلیں، مکمل منظور شدہ مواد ============ */
  function buildExportFiles(done) {
    var stO = st(); var files = {}; var pend = 0; var notes = [];
    function fin() { pend--; if (pend <= 0) done(files, notes); }
    function getJSON(u, cb) { pend++; fetch(u).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) { cb(j || {}); fin(); }).catch(function () { cb({}); fin(); }); }
    pend++;
    Object.keys(stO.overrides.rep).forEach(function (bookId) {
      var info = (window.REP_BOOK_INFO || {})[bookId] || {};
      var chapDir = info.chapDir || (bookId + '_chapters/');
      var dataFile = info.dataFile || (bookId + '_repertory.json');
      getJSON(dataFile, function (master) {
        Object.keys(stO.overrides.rep[bookId]).forEach(function (chKey) {
          getJSON(chapDir + encodeURIComponent(chKey) + '.json', function (base) {
            var chOv = stO.overrides.rep[bookId][chKey];
            Object.keys(chOv).forEach(function (rid) {
              if (chOv[rid] == null) { delete base[rid]; if (master[chKey]) delete master[chKey][rid]; }
              else { base[rid] = chOv[rid]; if (!master[chKey]) master[chKey] = {}; master[chKey][rid] = chOv[rid]; }
            });
            files[chapDir + encodeURIComponent(chKey) + '.json'] = JSON.stringify(base, null, 1);
            files[dataFile] = JSON.stringify(master, null, 1);
            notes.push(bookId + ' ← ' + chKey + ' (' + Object.keys(chOv).length + ' تبدیلیاں)');
          });
        });
      });
    });
    // اپنی ریپرٹری
    if (Object.keys(stO.custom.rep).length) {
      var chNames = Object.keys(stO.custom.rep);
      var master = {}; var idx = [];
      chNames.forEach(function (n) {
        var data = stO.custom.rep[n];
        master[n] = data;
        files['custom_rep_chapters/' + encodeURIComponent(n) + '.json'] = JSON.stringify(data, null, 1);
        idx.push({ key: n, name: n, rubrics: Object.keys(data).length });
        var ch = stO.overrides.rep.custom_rep && stO.overrides.rep.custom_rep[n];
        if (ch) Object.keys(ch).forEach(function (rid) { if (ch[rid] == null) delete data[rid]; else data[rid] = ch[rid]; });
      });
      files['custom_repertory.json'] = JSON.stringify(master, null, 1);
      files['custom_rep_chapters/_index.json'] = JSON.stringify(idx, null, 1);
      notes.push('اپنی ریپرٹری (' + chNames.length + ' باب)');
    }
    Object.keys(stO.custom.lib).forEach(function (id) {
      files['library/' + id + '.json'] = JSON.stringify(stO.custom.lib[id], null, 1);
      notes.push('کتاب: ' + stO.custom.lib[id].title);
    });
    Object.keys(stO.overrides.lib).forEach(function (id) {
      if (stO.overrides.lib[id] === null) { notes.push('کتاب حذف: ' + id); return; }
      files['library/' + id + '.json'] = JSON.stringify(stO.overrides.lib[id], null, 1);
      notes.push('کتاب اووررائیڈ: ' + id);
    });
    Object.keys(stO.custom.mm).forEach(function (id) {
      files['mm/' + id + '.json'] = JSON.stringify(stO.custom.mm[id], null, 1);
      notes.push('ایم ایم: ' + stO.custom.mm[id].title);
    });
    files['PARSER_EXPORT_NOTES.txt'] = 'پارسر اسٹوڈیو — برآمد فائلیں\nانہیں ان کے راستوں پر اَن زِپ کریں (repo root پر اووررائیڈ) پھر GitHub پر push کریں۔\n' + notes.join('\n');
    fin();
  }
  function exportZip() {
    buildExportFiles(function (files, notes) {
      if (!Object.keys(files).length) { alert('ابھی کوئی تبدیلی محفوظ نہیں — پہلے پارس/ایڈیٹ محفوظ کریں۔'); return; }
      var zip = PE.makeZip(files);
      var d = new Date(); var pad = function (x) { return String(x).padStart(2, '0'); };
      var fname = 'bhc-parsed-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.zip';
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([zip], { type: 'application/zip' }));
      a.download = fname; a.click();
      alert('ZIP تیار: ' + fname + '\n' + Object.keys(files).length + ' فائلیں — repo root پر اَن زِپ کریں۔');
    });
  }

  /* ============ ذخیرہ پر ایڈیٹر آپس (اووررائیڈ/اپنی محفوظ) ============ */
  function rowRid(bookId, chKey, rid) { var stO = st(); if (!stO.overrides.rep[bookId]) stO.overrides.rep[bookId] = {}; if (!stO.overrides.rep[bookId][chKey]) stO.overrides.rep[bookId][chKey] = {}; return stO.overrides.rep[bookId][chKey]; }
  function commitRepRow(bookId, chKey, rid, rec) { rowRid(bookId, chKey, rid)[rid] = rec ? JSON.parse(JSON.stringify(rec)) : null; saveStore(); bustCaches(); }
  function commitCustomRow(chName, rid, rec) { var stO = st(); if (!stO.custom.rep[chName]) stO.custom.rep[chName] = {}; if (rec == null) delete stO.custom.rep[chName][rid]; else stO.custom.rep[chName][rid] = JSON.parse(JSON.stringify(rec)); saveStore(); bustCaches(); }
  function commitLibBook(id, bookOrNull) { st().overrides.lib[id] = bookOrNull ? JSON.parse(JSON.stringify(bookOrNull)) : null; saveStore(); bustCaches(); }
  function commitCustomLib(id, book) { st().custom.lib[id] = JSON.parse(JSON.stringify(book)); saveStore(); bustCaches(); }
  function commitCustomMM(id, book) { st().custom.mm[id] = JSON.parse(JSON.stringify(book)); saveStore(); bustCaches(); }

  /* ============ PDF (lazy) / URL ============ */
  function loadPdfJs(cb, err) {
    if (window.pdfjsLib) return cb(window.pdfjsLib);
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = function () {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      cb(window.pdfjsLib);
    };
    s.onerror = err;
    document.head.appendChild(s);
  }
  function extractPdf(file, cb, prog) {
    loadPdfJs(function (pdfjs) {
      var fr = new FileReader();
      fr.onload = function () {
        pdfjs.getDocument({ data: fr.result }).promise.then(function (pdf) {
          var pages = []; var n = pdf.numPages; var i = 1;
          function next() {
            if (i > n) return cb(pages.map(function (t) { return t.join('\n'); }).join('\f'), n);
            pdf.getPage(i).then(function (pg) {
              return pg.getTextContent();
            }).then(function (tc) {
              var lines = {}; var last = null;
              tc.items.forEach(function (it) {
                var y = Math.round(it.transform[5]);
                if (last !== null && Math.abs(y - last) > 2) { /* نئی لکیر */ }
                if (!lines[y]) lines[y] = [];
                lines[y].push(it.str);
                last = y;
              });
              var keys = Object.keys(lines).map(Number).sort(function (a, b) { return b - a; });
              pages.push(keys.map(function (k) { return lines[k].join(' '); }));
              i++; if (prog) prog(i - 1, n);
              next();
            }).catch(function () { i++; next(); });
          }
          next();
        }).catch(function (e) { alert('PDF نہیں کھلی: ' + e); });
      };
      fr.readAsArrayBuffer(file);
    }, function () { alert('PDF انجن (CDN) لوڈ نہیں ہو سکا — متبادل طریقہ: PDF کھول کر صفحات کاپی/پیسٹ کریں۔'); });
  }
  function fetchUrl(u, cb, err) {
    var prox = 'https://r.jina.ai/' + u;
    fetch(prox, { headers: { 'x-respond-with': 'text' } }).then(function (r) { return r.text(); }).then(function (t) {
      if (!t || t.length < 30) throw new Error('خالی');
      cb(t);
    }).catch(function () {
      fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(u)).then(function (r) { return r.text(); }).then(cb).catch(err);
    });
  }

  /* ============ UI ============ */
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var PROF_KEY = 'bc_parser_profile_v1';
  function loadProf() {
    try { return JSON.parse(localStorage.getItem(PROF_KEY) || 'null') || { sep: 'dash', join: 'dash', gradeStyle: 'digits', remSplit: 'auto', pageMode: 'formfeed', skipRe: '', chapterRe: '', headRe: '', entryRe: '', defaultName: 'Text' }; } catch (e) { return { sep: 'dash', join: 'dash', gradeStyle: 'digits', remSplit: 'auto', pageMode: 'formfeed', skipRe: '', chapterRe: '', headRe: '', entryRe: '', defaultName: 'Text' }; }
  }
  function saveProf(p) { try { localStorage.setItem(PROF_KEY, JSON.stringify(p)); } catch (e) {} }

  var sess = { type: 'rep', pages: [], cur: 0, prof: loadProf(), known: null, rows: [], unmatched: [], cc: null };

  function ensureKnown(cb) {
    if (sess.known) return cb(sess.known);
    fetch('remedy_names.json').then(function (r) { return r.json(); }).then(function (j) { sess.known = j; cb(j); }).catch(function () { sess.known = {}; cb({}); });
  }

  function open() {
    if (el('psOverlay')) { el('psOverlay').style.display = 'flex'; return; }
    var ov = document.createElement('div');
    ov.id = 'psOverlay';
    ov.innerHTML = [
      '<div class="ps-panel">',
      ' <div class="ps-head"><b>📚 پارسر اسٹوڈیو</b> — کسی بھی ماخذ سے ایپ فارمیٹ میں',
      '  <span class="ps-tabs"><button class="ps-tab ps-on" data-t="parse">📥 پارس/درآمد</button><button class="ps-tab" data-t="edit">✏️ ایڈیٹر</button></span>',
      '  <span class="ps-hd-actions"><button id="psZipBtn" class="ps-btn">⬇️ ZIP ایکسپورٹ</button><button id="psClose" class="ps-x">✕</button></span>',
      ' </div>',
      ' <div id="psBody" class="ps-body"></div>',
      '</div>'].join('');
    document.body.appendChild(ov);
    el('psClose').onclick = function () { ov.style.display = 'none'; };
    el('psZipBtn').onclick = exportZip;
    ov.querySelectorAll('.ps-tab').forEach(function (b) {
      b.onclick = function () {
        ov.querySelectorAll('.ps-tab').forEach(function (x) { x.classList.remove('ps-on'); });
        b.classList.add('ps-on');
        render(b.getAttribute('data-t'));
      };
    });
    render('parse');
  }

  function profForm() {
    var p = sess.prof;
    function sel(id, label, opts, val) {
      return '<label class="ps-l">' + label + ' <select id="' + id + '">' + opts.map(function (o) {
        return '<option value="' + o[0] + '"' + (val === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select></label>';
    }
    return '<div class="ps-prof">' +
      sel('psType', 'قسم', [['rep', '📚 ریپرٹری'], ['book', '📖 کتاب / مواد'], ['mm', '💊 مٹیریا میڈیکا']], sess.type) +
      sel('psSep', 'ربرک تقسیم', [['auto', 'خودکار'], ['dash', ' - (ڈیش)'], ['comma', ', (کوما)'], ['2sp', 'دو خالی جگہ'], ['colon', ': (کولن)'], ['tab', 'ٹیب']], p.sep) +
      sel('psJoin', 'ٹری جوڑنے کا انداز', [['dash', ' - '], ['tab', 'چھوٹی لکیر'], ['comma', ', ']], p.join) +
      sel('psGrade', 'گریڈ انداز', [['digits', '1/2/3'], ['roman', 'I/II/III'], ['stars', '* ** ***'], ['none', 'بغیر (سب 1)']], p.gradeStyle) +
      sel('psRemSplit', 'rem تقسیم', [['auto', 'خودکار'], ['2sp', 'دو خالی جگہ'], ['colon', ':'], ['tab', 'ٹیب']], p.remSplit) +
      sel('psPageMode', 'صفحہ تقسیم', [['formfeed', 'فارم-فیڈ (\f)'], ['every', 'ہر N لکیریں'], ['regex', 'ریجکس'], ['single', 'ایک صفحہ']], p.pageMode) +
      '<label class="ps-l">صفحہ N <input id="psPageN" type="number" min="1" value="' + (p.pageN || 20) + '" style="width:56px"></label>' +
      '<label class="ps-l">صفحہ ریجکس <input id="psPageRe" value="' + esc(p.pageRegex || '') + '" placeholder="^Page \\d+"></label>' +
      '<label class="ps-l">باب ریجکس <input id="psChapRe" value="' + esc(p.chapterRe || '') + '" placeholder="^CHAPTER"></label>' +
      '<label class="ps-l">نکالنے (skip) ریجکس <input id="psSkipRe" value="' + esc(p.skipRe || '') + '" placeholder="^\\d+$"></label>' +
      '<label class="ps-l">مواد سرخی ریجکس <input id="psHeadRe" value="' + esc(p.headRe || '') + '" placeholder="^CHAPTER|^§"></label>' +
      '<label class="ps-l">مواد اندراج ریجکس <input id="psEntryRe" value="' + esc(p.entryRe || '') + '" placeholder="^(Aconitum|Belladonna)"></label>' +
      '</div>';
  }
  function readProf() {
    var g = function (id) { return el(id) ? el(id).value : ''; };
    sess.prof = {
      sep: g('psSep') || 'auto', join: g('psJoin') || 'dash', gradeStyle: g('psGrade') || 'digits',
      remSplit: g('psRemSplit') || 'auto', pageMode: g('psPageMode') || 'formfeed',
      pageN: parseInt(g('psPageN') || '20', 10), pageRegex: g('psPageRe'),
      chapterRe: g('psChapRe'), skipRe: g('psSkipRe'), headRe: g('psHeadRe'), entryRe: g('psEntryRe'), defaultName: 'Text'
    };
    sess.type = g('psType') || 'rep';
    saveProf(sess.prof);
  }
  function profObj() {
    var p = sess.prof;
    return {
      sep: p.sep === 'auto' ? null : p.sep, join: p.join || 'dash', gradeStyle: p.gradeStyle,
      remSplit: p.remSplit, known: sess.known || {},
      chapterRe: p.chapterRe ? new RegExp(p.chapterRe) : null,
      skipRe: p.skipRe ? new RegExp(p.skipRe, 'm') : null,
      headRe: p.headRe ? new RegExp(p.headRe, 'm') : null,
      entryRe: p.entryRe ? new RegExp(p.entryRe, 'm') : null,
      defaultName: p.defaultName
    };
  }

  function doSplit() {
    readProf();
    var txt = el('psText').value;
    if (!txt.trim()) { alert('پہلے متن درج کریں (پیسٹ/فائل/URL)'); return; }
    var mode = sess.prof.pageMode;
    var opts = { mode: mode, n: sess.prof.pageN || 20, regex: sess.prof.pageRegex ? new RegExp(sess.prof.pageRegex, 'm') : null };
    sess.pages = PE.splitPages(txt, opts);
    sess.cur = 0;
    ensureKnown(function () { loadPage(0); });
  }

  function loadPage(i) {
    if (i < 0 || i >= sess.pages.length) return;
    sess.cur = i;
    var page = sess.pages[i];
    if (sess.type === 'rep') {
      sess.pageParsed = PE.parseRepPage(page.text, profObj());
      sess.cc = PE.crossCheckRep(page.text, sess.pageParsed, profObj());
    } else {
      sess.pageParsed = PE.parseContentPage(page.text, profObj());
      sess.cc = PE.crossCheckContent(page.text, sess.pageParsed);
    }
    renderPagePanel();
  }

  function renderPagePanel() {
    var wrap = el('psPagePanel'); if (!wrap) return;
    var page = sess.pages[sess.cur];
    var P = sess.pageParsed, cc = sess.cc;
    var badge = cc.ok
      ? '<span class="ps-badge ps-ok">✔ بالکل درست اور مکمل</span>'
      : '<span class="ps-badge ps-bad">✖ ناقص — نیچے سرخ لکیریں دیکھیں</span>';
    var h = '<div class="ps-pagehead">' + badge +
      ' <span class="ps-count">صفحہ ' + (sess.cur + 1) + '/' + sess.pages.length + ' — لکیریں: ' + cc.lines.total + '، حساب: ' + (cc.lines.total - (cc.lines.unmatched || []).length) + '، بغیر حساب: ' + (cc.lines.unmatched || []).length + '</span>' +
      ' <span class="ps-nav"><button class="ps-btn" id="psPrev">◀ پچھلا</button><button class="ps-btn" id="psNext">اگلا ▶</button></span></div>';
    if (sess.type === 'rep') {
      h += '<table class="ps-rows"><tr><th>راستہ (ٹری)</th><th>ریمیڈیاں + گریڈ</th><th>لکیریں</th></tr>';
      (P.rows || []).forEach(function (r, ri) {
        h += '<tr><td><input class="ps-in-p" data-ri="' + ri + '" value="' + esc(r.path) + '"></td>' +
          '<td><input class="ps-in-r" data-ri="' + ri + '" value="' + esc(r.remRaw || Object.keys(r.rem).map(function (a) { return a + (r.rem[a] > 1 ? ' ' + r.rem[a] : ''); }).join(' ')) + '"></td>' +
          '<td class="ps-ls">' + r.lines.join(',') + (r.unknown && r.unknown.length ? ' ⚠' : '') + '</td></tr>';
      });
      h += '</table>';
    } else {
      (P.entries || []).forEach(function (e) {
        h += '<div class="ps-entry">◾ <b>' + esc(e.name) + '</b> (' + e.sections.length + ' سیکشن)';
        e.sections.forEach(function (s) {
          h += '<div class="ps-sec">§ ' + esc(s.h || '(بلا عنوان)') + ' — ' + s.p.length + ' پیراگراف<br><span class="ps-prev2">' + esc((s.p[0] || '').slice(0, 90)) + '</span></div>';
        });
        h += '</div>';
      });
    }
    var um = (cc.lines.unmatched || []);
    if (um.length) {
      h += '<div class="ps-um"><b> بغیر حساب لکیریں (' + um.length + ')</b>';
      um.forEach(function (ln) {
        var t = (page.text.split('\n')[ln] || '');
        h += '<div class="ps-um-l"><code>' + esc(t.slice(0, 70)) + '</code> ' +
          (sess.type === 'rep' ? '<button class="ps-btn ps-um-add" data-ln="' + ln + '">نئی ربرک بنائیں</button>' : '<button class="ps-btn ps-um-mark" data-ln="' + ln + '">سیکشن/مواد بنائیں</button>') +
          '</div>';
      });
      h += '</div>';
    }
    if (cc.lines.dups && cc.lines.dups.length) h += '<div class="ps-warn">دہری ربرکس: ' + cc.lines.dups.map(function (d) { return esc(d.t); }).join('؛ ') + '</div>';
    if (cc.remCheck && cc.remCheck.length) h += '<div class="ps-warn">rem/گریڈ اختلاف: ' + cc.remCheck.length + ' (دوبارہ چیک کریں)</div>';
    wrap.innerHTML = h;
    el('psPrev').onclick = function () { loadPage(sess.cur - 1); };
    el('psNext').onclick = function () { loadPage(sess.cur + 1); };
    wrap.querySelectorAll('.ps-in-p').forEach(function (inp) {
      inp.onchange = function () { P.rows[+inp.getAttribute('data-ri')].path = inp.value; };
    });
    wrap.querySelectorAll('.ps-in-r').forEach(function (inp) {
      inp.onchange = function () {
        var ri = +inp.getAttribute('data-ri');
        var pr = PE.parseRemTokens(inp.value, sess.prof.gradeStyle, sess.known);
        P.rows[ri].rem = pr.rem; P.rows[ri].remRaw = inp.value; P.rows[ri].unknown = pr.unknown;
        renderPagePanel();
      };
    });
    wrap.querySelectorAll('.ps-um-add').forEach(function (b) {
      b.onclick = function () {
        var ln = +b.getAttribute('data-ln');
        var t = (page.text.split('\n')[ln] || '').trim();
        var pth = prompt('راستہ (ٹری) درج کریں — کوما/ڈیش سے درجہ بندی:', t);
        if (pth == null) return;
        P.rows.push({ path: pth, segs: PE.segs(pth, sess.prof.sep || 'comma'), rem: {}, remRaw: '', unknown: [], badGrade: [], lines: [ln], chapter: P.chapter });
        cc.lines.unmatched = cc.lines.unmatched.filter(function (x) { return x !== ln; });
        cc.ok = cc.lines.unmatched.length === 0 && (!cc.remCheck || !cc.remCheck.length);
        renderPagePanel();
      };
    });
    wrap.querySelectorAll('.ps-um-mark').forEach(function (b) {
      b.onclick = function () {
        var ln = +b.getAttribute('data-ln');
        var t = (page.text.split('\n')[ln] || '').trim();
        var isHead = prompt('یہ لکیر کیا ہے؟ (h = سرخی/سیکشن، p = پیراگراف، x = نادیدہ)', 'h');
        if (isHead == null) return;
        if (isHead === 'x') { cc.lines.unmatched = cc.lines.unmatched.filter(function (x) { return x !== ln; }); }
        else if (isHead === 'h') {
          var e0 = P.entries[0] || { name: sess.prof.defaultName, abbr: '', sections: [] };
          if (!P.entries.length) P.entries.push(e0);
          e0.sections.push({ h: t, p: [] });
          P.curSec = e0.sections[e0.sections.length - 1];
          cc.lines.unmatched = cc.lines.unmatched.filter(function (x) { return x !== ln; });
        } else {
          var e1 = P.entries[0] || { name: sess.prof.defaultName, abbr: '', sections: [] };
          if (!P.entries.length) P.entries.push(e1);
          if (!e1.sections.length) e1.sections.push({ h: '', p: [] });
          e1.sections[e1.sections.length - 1].p.push(t);
          cc.lines.unmatched = cc.lines.unmatched.filter(function (x) { return x !== ln; });
        }
        cc.ok = cc.lines.unmatched.length === 0;
        renderPagePanel();
      };
    });
  }

  function acceptPage() {
    var P = sess.pageParsed;
    st().staging[(sess.type) + ':' + (sess.cur)] = JSON.parse(JSON.stringify({ P: P, ok: sess.cc.ok }));
    saveStore();
    alert('صفحہ ' + (sess.cur + 1) + ' محفوظ (اسٹیجنگ) — سب صفحات کے بعد "محفوظ کریں" دبائیں۔');
    if (sess.cur + 1 < sess.pages.length) loadPage(sess.cur + 1); else finalizeForm();
  }

  function finalizeForm() {
    readProf();
    var wrap = el('psFinal');
    var h = '<div class="ps-final"><b>🏁 حتمی درآمد</b><br>';
    if (sess.type === 'rep') {
      h += '<label class="ps-l">منزل <select id="psDest"><option value="custom">📚 اپنی ریپرٹری (نیا/جدا)</option><option value="override">📖 موجودہ کتاب میں اووررائیڈ</option></select></label> ' +
        '<label class="ps-l">باب/نام <input id="psChName" placeholder="باب کا نام"></label> ' +
        '<label class="ps-l">کتاب <select id="psBookSel">' + Object.keys(window.REP_BOOK_INFO || {}).map(function (b) { return '<option value="' + b + '">' + esc((REP_BOOK_INFO[b].name || REP_BOOK_INFO[b].label || b)) + '</option>'; }).join('') + '</select></label> ' +
        '<label class="ps-l">ضم انداز <select id="psMerge"><option value="new">صرف نئی (دہری چھوڑیں)</option><option value="merge">ضم (adv) — بلند grade رہے</option><option value="overwrite">مکمل بدل دو</option></select></label><br>' +
        '<button class="ps-btn ps-save" id="psDoSave">✅ محفوظ کریں (staging → ذخیرہ)</button>';
    } else if (sess.type === 'book') {
      h += '<label class="ps-l">عنوان <input id="psBTitle"></label> <label class="ps-l">مصنف <input id="psBAuthor"></label> <label class="ps-l">سال <input id="psBYear"></label> ' +
        '<label class="ps-l">فائل نام <input id="psBFile" placeholder="my_book"></label><br><button class="ps-btn ps-save" id="psDoSave">✅ کتاب محفوظ کریں</button>';
    } else {
      h += '<label class="ps-l">MM عنوان <input id="psBTitle"></label> <label class="ps-l">id <input id="psBFile" placeholder="my_mm"></label> ' +
        '<label class="ps-l">مصنف <input id="psBAuthor"></label><br><button class="ps-btn ps-save" id="psDoSave">✅ MM محفوظ کریں</button>';
    }
    h += '</div>';
    wrap.innerHTML = h;
    el('psDoSave').onclick = doSave;
  }

  function gatherRows() {
    var rows = [];
    Object.keys(st().staging).forEach(function (k) {
      if (k.indexOf('rep:') !== 0) return;
      var P = st().staging[k].P;
      (P.rows || []).forEach(function (r) { rows.push(r); });
    });
    return rows;
  }
  function gatherEntries() {
    var ents = [];
    Object.keys(st().staging).forEach(function (k) {
      if (k.indexOf('book:') !== 0 && k.indexOf('mm:') !== 0) return;
      var P = st().staging[k].P;
      (P.entries || []).forEach(function (e) { ents.push(e); });
    });
    return ents;
  }

  function doSave() {
    if (sess.type === 'rep') {
      var dest = el('psDest').value, chName = el('psChName').value.trim() || 'Chapter';
      var bookId = el('psBookSel').value, mode = el('psMerge').value;
      var rows = gatherRows();
      if (!rows.length) { alert('کوئی سطر نہیں — پہلے صفحات پارس/منظور کریں'); return; }
      if (dest === 'custom') {
        var data = st().custom.rep[chName] || {};
        var m = PE.mergeChapter(data, rows, { mode: mode, sep: sess.prof.sep || 'dash' });
        st().custom.rep[chName] = data;
        saveStore();
        alert('✅ ' + rows.length + ' ربرکس → اپنی ریپرٹری [' + chName + '] (نئی: ' + m.added + '، ضم: ' + (m.merged || 0) + '، چھوڑی: ' + ((m.dups && m.dups.length) || 0) + ')');
      } else {
        var chKey = chName;
        ensureKnown(function () {
          fetch(((window.REP_BOOK_INFO || {})[bookId] || {}).chapDir ? REP_BOOK_INFO[bookId].chapDir + encodeURIComponent(chKey) + '.json' : 'x').then(function (r) { return r.json(); }).catch(function () { return {}; }).then(function (base) {
            var m2 = PE.mergeChapter(base, rows, { mode: mode === 'overwrite' ? 'overwrite' : (mode === 'merge' ? 'merge' : 'new') , sep: sess.prof.sep || 'dash' });
            Object.keys(base).forEach(function (rid) { commitRepRow(bookId, chKey, rid, base[rid]); });
            alert('✅ ' + rows.length + ' ربرکس → ' + bookId + ' [' + chKey + '] (نئی: ' + m2.added + '، ضم: ' + (m2.merged || 0) + ')');
          });
        });
      }
    } else if (sess.type === 'book') {
      var ents = gatherEntries();
      var bk = PE.contentToLibBook(ents, { title: el('psBTitle').value || 'Untitled', author: el('psBAuthor').value || '', year: parseInt(el('psBYear').value || '0', 10) || '', source: 'parser-studio' });
      var fid = (el('psBFile').value || 'book_' + Date.now()).replace(/[^a-z0-9_\-]/gi, '_');
      commitCustomLib(fid, bk);
      alert('✅ کتاب محفوظ: ' + bk.title + ' (' + bk.sections.length + ' سیکشن) — ریفریش پر لائبریری میں نظر آئے گی');
    } else {
      var ents2 = gatherEntries().map(function (e) { return { name: e.name, abbr: (e.abbr || e.name.split(/\s+/)[0]).toLowerCase(), sections: e.sections }; });
      var mmB = PE.contentToMMBook(ents2, { id: (el('psBFile').value || 'mm_' + Date.now()), title: el('psBTitle').value || 'Untitled MM', author: el('psBAuthor').value || '', source: 'parser-studio' });
      commitCustomMM(mmB.id, mmB);
      alert('✅ MM محفوظ: ' + mmB.title);
    }
    st().staging = {}; saveStore();
  }

  /* ---------- ایڈیٹر ٹیب ---------- */
  var ed = { kind: 'rep', bookId: 'synthesis91', chKey: '', q: '' };
  function renderEdit() {
    var body = el('psBody');
    var stO = st();
    var books = Object.keys(window.REP_BOOK_INFO || {});
    var h = '<div class="ps-edit">' +
      '<label class="ps-l">قسم <select id="edKind"><option value="rep"' + (ed.kind === 'rep' ? ' selected' : '') + '>ریپرٹری</option><option value="lib"' + (ed.kind === 'lib' ? ' selected' : '') + '>کتاب</option><option value="mm"' + (ed.kind === 'mm' ? ' selected' : '') + '>MM</option></select></label> ';
    if (ed.kind === 'rep') {
      h += '<label class="ps-l">کتاب <select id="edBook">' + books.map(function (b) { return '<option value="' + b + '"' + (ed.bookId === b ? ' selected' : '') + '>' + esc((REP_BOOK_INFO[b] || {}).name || (REP_BOOK_INFO[b] || {}).label || b) + '</option>'; }).join('') + '<option value="custom_rep"' + (ed.bookId === 'custom_rep' ? ' selected' : '') + '>📚 اپنی ریپرٹری</option></select></label> ' +
        '<label class="ps-l">باب <select id="edCh">' + chapterOptions() + '</select></label> ' +
        '<label class="ps-l">تلاش <input id="edQ" value="' + esc(ed.q) + '"></label> ' +
        '<button class="ps-btn" id="edReload">🔄 لوڈ کریں</button><br><div id="edRows" class="ps-erows"></div>' +
        '<div class="ps-eops"><button class="ps-btn" id="edAdd">➕ نئی ربرک (اصلاح)</button> <button class="ps-btn" id="edSaveRub">💾 ربرک محفوظ کریں</button> <span class="ps-note">ترمیم = localStorage اووررائیڈ؛ ZIP ایکسپورٹ سے مستقل فائل بنے گی</span></div>';
    } else {
      var ids = ed.kind === 'lib' ? ['(نئی کتاب)'].concat(Object.keys(stO.custom.lib)) : ['(نئی MM)'].concat(Object.keys(stO.custom.mm));
      h += '<label class="ps-l">کتاب <select id="edBook">' + ids.map(function (id) { return '<option value="' + esc(id) + '">' + esc(id) + '</option>'; }).join('') + '</select></label><br><div id="edRows"></div>';
    }
    h += '</div>';
    body.innerHTML = h;
    if (ed.kind === 'rep') {
      el('edKind').onchange = function () { ed.kind = this.value; renderEdit(); };
      el('edBook').onchange = function () { ed.bookId = this.value; ed.chKey = ''; renderEdit(); };
      el('edCh').onchange = function () { ed.chKey = this.value; renderEdit(); };
      el('edQ').oninput = function () { ed.q = this.value; renderEditRows(); };
      el('edReload').onclick = function () { renderEditRows(true); };
      el('edAdd').onclick = function () {
        var t = prompt('نئی ربرک کا راستہ (کوما/ڈیش سے درجہ بندی):'); if (!t) return;
        var rr = prompt('ریمیڈیاں (adv 3, bell 2):', '');
        var rid = 'x' + Math.random().toString(36).slice(2, 8);
        var rec = { t: t, r: (PE.parseRemTokens(rr || '', sess.prof.gradeStyle, sess.known || {}).rem) };
        commitRepRow(ed.bookId, ed.chKey || 'Chapter', rid, rec);
        renderEditRows();
      };
      el('edSaveRub').onclick = function () { renderEditRows(); alert('محفوظ — نیچے فی ربرک دکمے بھی ہیں (adv/حذف/منتقل)'); };
      renderEditRows(true);
    } else {
      el('edKind').onchange = function () { ed.kind = this.value; renderEdit(); };
      renderContentEditRows();
    }
  }
  function chapterOptions() {
    if (ed.bookId === 'custom_rep') return Object.keys(st().custom.rep).map(function (n) { return '<option value="' + esc(n) + '">' + esc(n) + '</option>'; }).join('');
    var info = (window.REP_BOOK_INFO || {})[ed.bookId] || {};
    var out = [];
    // sync نہیں — محفوظ ہندسہ یا ڈیفالٹ
    var stO = st(); var ovs = (stO.overrides.rep[ed.bookId] || {});
    Object.keys(ovs).forEach(function (k) { out.push('<option value="' + esc(k) + '">' + esc(k) + '</option>'); });
    if (!out.length) out.push('<option value="">(باب نام لکھ کر نیا بنائیں)</option>');
    return out.join('');
  }
  function renderEditRows(reload) {
    var wrap = el('edRows'); if (!wrap) return;
    var data = {};
    if (ed.bookId === 'custom_rep') data = st().custom.rep[ed.chKey] || {};
    else {
      // اووررائیڈ + (ممکن ہو) بیس — بیس async: یہاں صرف اووررائیڈ + خالی
      var ov = st().overrides.rep[ed.bookId] || {};
      data = JSON.parse(JSON.stringify(ov[ed.chKey] || {}));
    }
    var ids = Object.keys(data).filter(function (rid) {
      return !ed.q || (data[rid].t || '').toLowerCase().indexOf(ed.q.toLowerCase()) > -1 || rid.indexOf(ed.q) > -1;
    });
    var h = '<div class="ps-note">' + ids.length + ' ربرکس (اس فہرست میں) — ٹری پاتھ = کوما/ڈیش تقسیم پر بنی</div>';
    ids.forEach(function (rid) {
      var rec = data[rid];
      h += '<div class="ps-erow" data-rid="' + esc(rid) + '">' +
        '<input class="ps-e-t" value="' + esc(rec.t) + '" data-rid="' + esc(rid) + '" title="ٹری پاتھ — اس طرح بدلیں"> ' +
        '<input class="ps-e-r" value="' + esc(Object.keys(rec.r || {}).map(function (a) { return a + ' ' + rec.r[a]; }).join(', ')) + '" data-rid="' + esc(rid) + '" title="adv + grade"> ' +
        '<button class="ps-btn ps-e-upd" data-rid="' + esc(rid) + '">✔ محفوظ</button>' +
        '<button class="ps-btn ps-e-del" data-rid="' + esc(rid) + '">🗑 ربرک حذف (بچے والد پر)</button>' +
        '<button class="ps-btn ps-e-mov" data-rid="' + esc(rid) + '">↗ منتقل</button>' +
        '<button class="ps-btn ps-e-gr" data-rid="' + esc(rid) + '">⚙ grade</button></div>';
    });
    wrap.innerHTML = h;
    wrap.querySelectorAll('.ps-e-upd').forEach(function (b) {
      b.onclick = function () {
        var rid = b.getAttribute('data-rid');
        var t = wrap.querySelector('.ps-e-t[data-rid="' + rid + '"]').value;
        var rTxt = wrap.querySelector('.ps-e-r[data-rid="' + rid + '"]').value;
        var rec = { t: t, r: PE.parseRemTokens(rTxt, sess.prof.gradeStyle, sess.known || {}).rem };
        if (ed.bookId === 'custom_rep') commitCustomRow(ed.chKey, rid, rec); else commitRepRow(ed.bookId, ed.chKey, rid, rec);
        renderEditRows();
      };
    });
    wrap.querySelectorAll('.ps-e-del').forEach(function (b) {
      b.onclick = function () {
        var rid = b.getAttribute('data-rid');
        if (!confirm('ربرک حذف کریں؟ بچوں کو والد پر منتقل کر دیا جائے گا۔')) return;
        if (ed.bookId === 'custom_rep') {
          var d = st().custom.rep[ed.chKey] || {};
          PE.opDelRubric(d, rid, { reparent: true, sep: sess.prof.sep === 'auto' ? 'comma' : (sess.prof.sep || 'comma') });
          st().custom.rep[ed.chKey] = d; saveStore();
        } else {
          var d2 = {}; // ہندسے موجود ہیں؟
          var ov = st().overrides.rep[ed.bookId] || {};
          var base = JSON.parse(JSON.stringify(ov[ed.chKey] || {}));
          PE.opDelRubric(base, rid, { reparent: true, sep: sess.prof.sep === 'auto' ? 'comma' : (sess.prof.sep || 'comma') });
          commitRepRow(ed.bookId, ed.chKey, rid, null);
          Object.keys(base).forEach(function (r2) { commitRepRow(ed.bookId, ed.chKey, r2, base[r2]); });
        }
        renderEditRows();
      };
    });
    wrap.querySelectorAll('.ps-e-mov').forEach(function (b) {
      b.onclick = function () {
        var rid = b.getAttribute('data-rid');
        var to = prompt('نیا راستہ/والد لکھیں:'); if (!to) return;
        var d = ed.bookId === 'custom_rep' ? (st().custom.rep[ed.chKey] || {}) : ((st().overrides.rep[ed.bookId] || {})[ed.chKey] || {});
        if (!d[rid]) { alert('پہلے یہ ربرک اس فہرست میں محفوظ کریں (اور بیس لوڈ کریں)'); return; }
        PE.opSetPath(d, rid, to);
        if (ed.bookId === 'custom_rep') { st().custom.rep[ed.chKey] = d; saveStore(); } else commitRepRow(ed.bookId, ed.chKey, rid, d[rid]);
        renderEditRows();
      };
    });
    wrap.querySelectorAll('.ps-e-gr').forEach(function (b) {
      b.onclick = function () {
        var rid = b.getAttribute('data-rid');
        var d = ed.bookId === 'custom_rep' ? (st().custom.rep[ed.chKey] || {}) : ((st().overrides.rep[ed.bookId] || {})[ed.chKey] || {});
        if (!d[rid]) { alert('پہلے محفوظ کریں'); return; }
        var rem = prompt('adv + grade (adv 3, bell 2):', Object.keys(d[rid].r || {}).map(function (a) { return a + ' ' + d[rid].r[a]; }).join(', '));
        if (rem == null) return;
        d[rid].r = PE.parseRemTokens(rem, sess.prof.gradeStyle, sess.known || {}).rem;
        if (ed.bookId === 'custom_rep') { st().custom.rep[ed.chKey] = d; saveStore(); } else commitRepRow(ed.bookId, ed.chKey, rid, d[rid]);
        renderEditRows();
      };
    });
  }
  function renderContentEditRows() {
    var wrap = el('edRows'); if (!wrap) return;
    var stO = st();
    var isLib = ed.kind === 'lib';
    var id = el('edBook') ? el('edBook').value : '';
    var h = '<div class="ps-note">نئی مواد پارس ٹیب سے بنائیں — یہاں سیکشن/پیراگراف ترمیم</div>';
    if (!id || id.indexOf('نئی') > -1 || id.indexOf('(نئی') > -1) { wrap.innerHTML = h + '<i>پہلے پارس ٹیب سے کتاب بنائیں</i>'; return; }
    var book = isLib ? (stO.custom.lib[id] || stO.overrides.lib[id]) : stO.custom.mm[id];
    if (!book) { wrap.innerHTML = h + '<i>نہیں ملی</i>'; return; }
    var secs = isLib ? book.sections : [];
    h += '<b>' + esc(book.title) + '</b><br>';
    secs.forEach(function (s, si) {
      h += '<div class="ps-sec-e">§ <input class="ps-s-h" data-si="' + si + '" value="' + esc(s.h) + '"> ' +
        '<button class="ps-btn ps-s-del" data-si="' + si + '">🗑</button><br>' +
        '<textarea class="ps-s-p" data-si="' + si + '" rows="3">' + esc(s.p.join('\n')) + '</textarea></div>';
    });
    h += '<button class="ps-btn" id="edCSave">💾 محفوظ</button>';
    wrap.innerHTML = h;
    el('edCSave').onclick = function () {
      wrap.querySelectorAll('.ps-s-h').forEach(function (inp) { book.sections[+inp.getAttribute('data-si')].h = inp.value; });
      wrap.querySelectorAll('.ps-s-p').forEach(function (ta) { book.sections[+ta.getAttribute('data-si')].p = ta.value.split('\n').filter(function (x) { return x.trim(); }); });
      if (isLib) commitCustomLib(id, book); else commitCustomMM(id, book);
      alert('✅ محفوظ');
    };
    wrap.querySelectorAll('.ps-s-del').forEach(function (b) {
      b.onclick = function () {
        book.sections.splice(+b.getAttribute('data-si'), 1);
        if (isLib) commitCustomLib(id, book); else commitCustomMM(id, book);
        renderContentEditRows();
      };
    });
  }

  function render(tab) {
    if (tab === 'edit') { renderEdit(); return; }
    var body = el('psBody');
    body.innerHTML = [
      '<div class="ps-parse">',
      ' <div class="ps-src">',
      '  <label class="ps-l">📎 فائل <input type="file" id="psFile" accept=".txt,.md,.html,.htm,.json,.pdf"></label>',
      '  <label class="ps-l">🔗 URL <input id="psUrl" placeholder="https://…"><button class="ps-btn" id="psUrlGo">لاؤ</button></label>',
      '  <button class="ps-btn" id="psPdfGo">📄 PDF سے نکالو (CDN)</button>',
      ' </div>' + profForm(),
      ' <textarea id="psText" class="ps-text" rows="8" placeholder="یہاں متن پیسٹ کریں (صفحات فارم-فیڈ \\f سے الگ)…"></textarea>',
      ' <div class="ps-actions"><button class="ps-btn ps-big" id="psSplit">🔍 تقسیم + پارس</button> <span class="ps-note">ہر صفحہ الگ پارس/کراس-چیک ہوگا — منظوری صفحہ بہ صفحہ</span></div>',
      ' <div id="psPagePanel"></div>',
      ' <div class="ps-actions"><button class="ps-btn ps-big" id="psAccept">✅ یہ صفحہ منظور</button></div>',
      ' <div id="psFinal"></div>',
      '</div>'].join('');
    el('psFile').onchange = function () {
      var f = this.files[0]; if (!f) return;
      if (/\.pdf$/i.test(f.name)) { extractPdf(f, function (txt, n) { el('psText').value = txt; alert('PDF کے ' + n + ' صفحات نکالے'); }); return; }
      var fr = new FileReader();
      fr.onload = function () { el('psText').value = fr.result; };
      fr.readAsText(f);
    };
    el('psUrlGo').onclick = function () {
      var u = el('psUrl').value.trim(); if (!u) return;
      fetchUrl(u, function (t) { el('psText').value = t; alert('مواد آ گیا (' + t.length + ' حروف)'); }, function () { alert('URL نہیں مل سکا — کاپی/پیسٹ کریں'); });
    };
    el('psPdfGo').onclick = function () { el('psFile').click(); };
    el('psSplit').onclick = doSplit;
    el('psAccept').onclick = acceptPage;
    el('psType').onchange = function () { sess.type = this.value; };
  }

  /* ============ init: رجسٹری + بٹن + لوڈر ہک ============ */
  function init() {
    loadStore();
    // اپنی ریپرٹری رجسٹری
    if (window.REP_BOOK_INFO && !REP_BOOK_INFO['custom_rep']) {
      REP_BOOK_INFO['custom_rep'] = { abbr: 'Mine', name: '📚 اپنی ریپرٹری', dataFile: 'custom_repertory.json', chapDir: 'custom_rep_chapters/', color: '#2e6b4f', tree: 'prefix' };
    }
    var sel = document.getElementById('repBookSelect');
    if (sel && !sel.querySelector('option[value="custom_rep"]')) {
      var op = document.createElement('option');
      op.value = 'custom_rep'; op.textContent = '📚 اپنی ریپرٹری';
      sel.appendChild(op);
    }
    var btn = document.getElementById('psOpenBtn');
    if (btn) btn.onclick = open;
    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'psOpenBtn') open();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.PS = {
    init: init, open: open, exportZip: exportZip,
    hasCustomRep: hasCustomRep, customRepIndex: customRepIndex, customRepChapter: customRepChapter, customRepMaster: customRepMaster, bustCaches: bustCaches,
    applyRepOverrides: applyRepOverrides, hookRepIndex: hookRepIndex,
    findRid: findRid, isDeletedRid: isDeletedRid, applyRepSearchParsed: applyRepSearchParsed,
    applyAllBooks: applyAllBooks,
    hookLibIndex: hookLibIndex, applyLibBook: applyLibBook,
    hookMMIndex: hookMMIndex, applyMMBook: applyMMBook,
    _st: st
  };
})();
