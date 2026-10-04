'use strict';

// v152 — ترتیب کی درستی: «ایک ہی سطر» کی درجہ بندی اب نمائش والے صاف راستے سے ہوتی ہے،
// ریکارڈ کے خام عنوان سے نہیں۔ پہلے «FEAR (See Anxiety), sleep, before» کا (See …) حصہ
// «anxiety sleep» کا جُڑا جوڑا گن لیا جاتا تھا، اِس لیے وہ ربرک ANXIETY; which prevents sleep
// سے اوپر آ جاتا تھا۔ اب: ANXIETY کا پورا بلاک پہلے، پھر «ANXIETY; which prevents sleep»،
// پھر FEAR کے ربرک کتابی ترتیب سے۔
// Run: node tests/search_order_v152.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const mind = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/mind.json'), 'utf8'));
const searchPaths = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_search_paths/mind.json'), 'utf8'));
const input = { value: 'anxiety sleep' };
const content = { innerHTML: '', scrollTop: 0, querySelector: function () { return null; } };
const document = {
    readyState: 'loading', addEventListener: function () {},
    getElementById: function (id) {
        if (id === 'repBrowserSearch') return input;
        if (id === 'repRubricContent' || id === 'repSearchView') return content;
        return null;
    }
};
const context = {
    window: {}, document: document, console: console, setTimeout: setTimeout,
    escapeHtml: function (v) { return String(v == null ? '' : v); },
    repClipsLoad: function () {}, repRenderDock: function () {}, repCmpSyncUI: function () {},
    repCmpChkHtml: function () { return ''; }, repGradeShow: function () { return true; }, repBookColor: function () { return '#000'; },
    REP_BOOK_INFO: { kent: { abbr: 'Kent', name: 'Kent', dataFile: 'kent_repertory.json', chapDir: 'kent_chapters/', tree: 'prefix' } },
    REP_DATA_V: 'v=18', REP_TYPE_LABELS: { rubric: { en: 'Rubric' } },
    REP_SEARCH_TYPES: ['rubric', 'remedy', 'rubric_remedy', 'clinical'], REP_SCOPE_ORDER: ['chapter', 'book', 'all'],
    currentLang: 'en', repCurrentBook: 'kent', repCurrentChapter: 'mind',
    repChapterNames: [{ key: 'mind', name: 'MIND' }], _allBookChapters: {},
    _repFullData: null, repSearchMode: 'rubric', repSearchScope: 'chapter', repSearchAllBooks: false,
    repTreePage: 0, repTreePageSize: 50, repCurrentDetail: null,
    repClipViewOpen: false, repWorkbenchOpen: false, repCompareOpen: false, repAnalysisOpen: -1,
    repParseBoolQuery: function (q) {
        const toks = String(q).toLowerCase().split(/\s+/).filter(Boolean);
        return { groups: [toks], neg: [], pos: toks };
    },
    repBoolMatch: function (qb, text) {
        const lt = String(text || '').toLowerCase();
        return (qb.pos || []).every(function (w) { return lt.indexOf(w) !== -1; });
    },
    fetch: function (url) {
        if (String(url).indexOf('kent_search_paths/mind.json') === 0) return Promise.resolve({ ok: true, json: () => Promise.resolve(searchPaths) });
        if (String(url).indexOf('kent_repertory.json') === 0) return Promise.resolve({ ok: true, json: () => Promise.resolve({ mind: mind }) });
        return Promise.reject(new Error('fetch ' + url));
    }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/kent-tree-fix.js'), 'utf8'), context, { filename: 'kent-tree-fix.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/rep-search.js'), 'utf8'), context, { filename: 'rep-search.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/rep-tree.js'), 'utf8'), context, { filename: 'rep-tree.js' });

context.searchRepertoryBrowser();
setTimeout(function () {
    try {
        const html = content.innerHTML;
        const rows = [];
        const re = /class="rep-rubric-item rep-search-row"[^>]*data-rid="(r\d+)"[^>]*data-full="([^"]*)"/g;
        let m;
        while ((m = re.exec(html)) !== null) rows.push({ rid: m[1], full: m[2] });
        assert(rows.length > 10, 'do word search returns MIND rows');

        const idx = function (rid) { return rows.findIndex(function (r) { return r.rid === rid; }); };
        const want = idx('r252');                       // ANXIETY, which prevents sleep
        const slumber = idx('r291');                    // ANXIETY; sleep; partial slumbering in the morning, during
        const fear = idx('r2248');                      // FEAR (See Anxiety), sleep, before
        assert(want > -1 && slumber > -1 && fear > -1, 'تینوں نمونہ ربرک نتائج میں ہیں');

        // «ANXIETY; sleep; partial slumbering…» کے نیچے ہی آنا چاہیے
        assert.strictEqual(want, slumber + 1, '«ANXIETY; which prevents sleep» صاف ستھرے کا اگلی سطر پر (partial slumbering کے نیچے) ہے');
        // اور ہر FEAR ربرک سے اوپر
        assert(want < fear, '«ANXIETY; which prevents sleep» ہر FEAR ربرک سے اوپر ہے');

        // ایک ہی سطر والے نتائج سب سے اوپر (v150 کا قاعدہ برقرار)
        const firstFear = Math.min.apply(null, rows.map(function (r, i) { return /MIND; FEAR/.test(r.full) ? i : 1e9; }));
        assert(firstFear > want, 'کوئی FEAR ربرک «ANXIETY; which prevents sleep» سے اوپر نہیں');
        assert(firstFear === rows.length - (rows.length - firstFear) && firstFear > 0, 'FEAR کا بلاک آخر میں ہے');
        for (let i = 0; i < firstFear; i++) {
            assert(/MIND; ANXIETY/.test(rows[i].full), '«' + rows[i].full + '» ANXIETY بلاک کا ربرک ہے');
        }
        const anxietySleep = rows.filter(function (r) { return /MIND; ANXIETY; sleep/.test(r.full); });
        assert.strictEqual(anxietySleep.length, 8, 'ایک ہی سطر والے آٹھ نتائج (ANXIETY; sleep; …) اوپر ہیں');
        assert.strictEqual(slumber, 7, '«partial slumbering in the morning, during» آٹھویں سطر ہے');

        // `(See …)` والا خام عنوان درجہ بندی میں استعمال نہیں ہوتا
        const fearRaw = String((mind.r2248 || {}).t || '');
        assert(/\(See Anxiety\)/i.test(fearRaw), 'نمونہ FEAR ربرک کے خام عنوان میں «(See Anxiety)» موجود ہے');
        assert(/anxiety sleep/i.test(fearRaw.replace(/\([^)]*\)/g, ' ')) === false,
            'خام عنوان سے حوالہ ہٹانے پر «anxiety sleep» جُڑا ہوا نہیں بچتا');

        // FEAR کے ربرک کتابی ترتیب سے
        const fearRows = rows.slice(firstFear);
        const orders = fearRows.map(function (r) { return (searchPaths.entries[r.rid] || {}).order; });
        for (let i = 1; i < orders.length; i++) {
            assert(orders[i - 1] <= orders[i], 'FEAR کے ربرک کتابی ترتیب (' + orders[i - 1] + ' ≤ ' + orders[i] + ') میں ہیں');
        }
        console.log('PASS v152 search order: «anxiety sleep» — 8 ایک ہی سطر والے نتائج، پھر «ANXIETY; which prevents sleep»، پھر FEAR کے ' +
            fearRows.length + ' ربرک کتابی ترتیب سے (پہلے یہ ANXIETY والا ربرک FEAR کے بیچ میں گھس رہا تھا)۔');
    } catch (error) {
        console.error(error.stack || error);
        process.exit(1);
    }
}, 600);
