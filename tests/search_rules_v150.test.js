'use strict';

// v150 — سرچ کے چار قاعدے:
//   (الف) ایک ہی سطر میں جُڑے ہوئے الفاظ والے ربرکس پہلے، درمیان میں الفاظ والے بعد میں
//   (ب) سرچ کے نتائج میں ادویات محض حروفِ تہجی سے (v151 میں صارف کی تصحیح: گریڈ کی گروہ بندی نہیں)
//   (ج) سرچ کی سطر میں ادویات ربرک کے ساتھ اُسی سطر میں چلتی ہیں (درخت میں اگلی سطر جیسی تھی)
//   (د) ڈیفالٹ دائرہ «سرچ ان اوپن چیپٹر»
// Run: node tests/search_rules_v150.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const mind = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/mind.json'), 'utf8'));
const searchPaths = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_search_paths/mind.json'), 'utf8'));
const input = { value: 'anxiety night' };
const content = {
    innerHTML: '', scrollTop: 0,
    querySelector: function () { return null; }
};
const document = {
    readyState: 'loading',
    addEventListener: function () {},
    getElementById: function (id) {
        if (id === 'repBrowserSearch') return input;
        if (id === 'repRubricContent') return content;
        if (id === 'repSearchView') return content;   // 🔑 v151: نتائج اپنے خانے میں
        return null;
    }
};
function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
}
const context = {
    window: {}, document: document, console: console, setTimeout: setTimeout,
    escapeHtml: escapeHtml,
    repClipsLoad: function () {}, repRenderDock: function () {}, repCmpSyncUI: function () {},
    repCmpChkHtml: function () { return ''; }, repGradeShow: function () { return true; },
    repBookColor: function () { return '#805ad5'; },
    REP_BOOK_INFO: { kent: {
        abbr: 'Kent', name: 'Kent (English)', dataFile: 'kent_repertory.json',
        chapDir: 'kent_chapters/', tree: 'prefix'
    } },
    REP_DATA_V: 'v=18', REP_TYPE_LABELS: { rubric: { en: 'Rubric' } },
    REP_SEARCH_TYPES: ['rubric', 'remedy', 'rubric_remedy', 'clinical'],
    REP_SCOPE_ORDER: ['chapter', 'book', 'all'],
    currentLang: 'en', repCurrentBook: 'kent', repCurrentChapter: 'mind',
    repChapterNames: [{ key: 'mind', name: 'MIND' }], _allBookChapters: {},
    _repFullData: null, repSearchMode: 'rubric', repSearchScope: 'chapter', repSearchAllBooks: false,
    repTreePage: 0, repTreePageSize: 50, repCurrentDetail: null,
    repClipViewOpen: false, repWorkbenchOpen: false, repCompareOpen: false, repAnalysisOpen: -1,
    repParseBoolQuery: function (query) {
        return { groups: [String(query).trim().split(/\s+/).filter(Boolean)], neg: [], pos: String(query).trim().split(/\s+/).filter(Boolean) };
    },
    repBoolMatch: function (query, text) {
        const words = (query && query.pos) || [];
        return words.every(function (word) { return String(text || '').toLowerCase().includes(word); });
    },
    fetch: function (url) {
        if (String(url).indexOf('kent_search_paths/mind.json') === 0) {
            return Promise.resolve({ ok: true, json: function () { return Promise.resolve(searchPaths); } });
        }
        if (String(url).indexOf('kent_repertory.json') === 0) {
            return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ mind: mind }); } });
        }
        return Promise.reject(new Error('Unexpected test fetch: ' + url));
    }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/kent-tree-fix.js'), 'utf8'), context,
    { filename: 'js/repertory/kent-tree-fix.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/rep-search.js'), 'utf8'), context,
    { filename: 'js/repertory/rep-search.js' });
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/rep-tree.js'), 'utf8'), context,
    { filename: 'js/repertory/rep-tree.js' });

function normLine(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9\u0080-\ufaff\s]/g, ' ').replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
}
function expectedRemedyOrder(rid) {
    const rems = (mind[rid] || {}).r || {};
    return Object.keys(rems).sort(function (a, b) { return a.localeCompare(b); });
}

context.searchRepertoryBrowser();
setTimeout(function () {
    try {
        const html = content.innerHTML;
        // (د) ڈیفالٹ دائرہ + (ج) کی سی ایس ایس + (ب) کی ترتیب — ماخذ کی جانچ
        const detailSource = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-rubric-detail.js'), 'utf8');
        assert(/var repSearchScope = 'chapter';/.test(detailSource),
            '(د) ڈیفالٹ دائرہ «سرچ ان اوپن چیپٹر» ہے');
        const searchSource = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-search.js'), 'utf8');
        assert(searchSource.indexOf('all.sort(function(a,b){return a.localeCompare(b);});') > -1,
            '(ب) ادویات محض حروفِ تہجی سے');
        const css = fs.readFileSync(path.join(ROOT, 'css/rep-search-results.css'), 'utf8');
        assert(css.indexOf('.rep-search-results-list .rep-search-remedies{display:none;flex:1 1 0%') > -1 &&
            css.indexOf('.rep-search-results-list.show-remedies .rep-search-list-title{flex:0 1 auto;max-width:calc(100% - 220px)}') > -1,
            '(ج) سرچ کی سطر میں ادویات اُسی سطر میں چلتی ہیں (ربرک کی چوڑائی محدود، ادویات باقی سطر بھرتی ہیں)');
        const treeCss = fs.readFileSync(path.join(ROOT, 'css/repertory-tree.css'), 'utf8');
        assert(treeCss.indexOf('.rtv-rems{display:block;margin:1px 0 3px 38px') > -1,
            '(ج) درخت کی نمائش اپنی جگہ — ادویات اپنی سطر میں');

        // (الف) ترتیب: جُڑے ہوئے الفاظ والے ربرکس پہلے
        const rids = [];
        const rowRe = /class="rep-rubric-item rep-search-row"[^>]*data-rid="(r\d+)"/g;
        let m;
        while ((m = rowRe.exec(html)) !== null) rids.push(m[1]);
        assert(rids.length > 10, 'two-word search returns MIND rows');
        const phrase = normLine('anxiety night');
        const ranks = rids.map(function (rid) {
            return normLine((mind[rid] || {}).t || '').indexOf(phrase) !== -1 ? 0 : 1;
        });
        const tight = ranks.filter(function (r) { return r === 0; }).length;
        assert(tight > 0, '(الف) ایک ہی سطر میں جُڑے ہوئے نتائج موجود ہیں');
        assert(tight < ranks.length, '(الف) درمیان میں الفاظ والے نتائج بھی موجود ہیں');
        for (let i = 1; i < ranks.length; i++) {
            assert(ranks[i - 1] <= ranks[i],
                '(الف) جُڑا ہوا نتیجہ (سطر ' + i + ') درمیان والے سے پہلے آئے');
        }
        assert.strictEqual(ranks.indexOf(1) === -1 || ranks.lastIndexOf(0) < ranks.indexOf(1), true,
            '(الف) سب جُڑے ہوئے نتائج درمیان والوں سے اوپر ہیں');

        // (ب) عملی جانچ: ہر قطار کے دوا ٹیگ گریڈ 1 پہلے، پھر حروفِ تہجی میں
        const blocks = html.split('class="rep-rubric-item rep-search-row"').slice(1);
        let checked = 0;
        blocks.forEach(function (block) {
            const ridMatch = block.match(/data-rid="(r\d+)"/);
            if (!ridMatch) return;
            const rid = ridMatch[1];
            const tags = [];
            const tagRe = /class="rep-remedy-tag g(\d)[^"]*"[^>]*>([^<]+)</g;
            let t;
            while ((t = tagRe.exec(block)) !== null) tags.push(t[2]);
            // سرچ کی قطار دوا کا نام جوں کا توں دکھاتی ہے (درخت گریڈ 3 کو بڑے حروف میں دکھاتا ہے)
            const expected = expectedRemedyOrder(rid).slice(0, 40);
            if (expected.length < 2) return;
            assert.deepStrictEqual(tags, expected, '(ب) ' + rid + ' کی ادویات حروفِ تہجی میں (a → z)');
            checked++;
        });
        assert(checked >= 3, '(ب) کئی قطاروں کی دوا ترتیب جانچی گئی');
        console.log('PASS v150 search rules: ' + rids.length + ' rows for «anxiety night», ' + tight +
            ' line-joined matches first, remedies alphabetical, open-chapter default, same-line remedies.');
    } catch (error) {
        console.error(error.stack || error);
        process.exit(1);
    }
}, 800);
