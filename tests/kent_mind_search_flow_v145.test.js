'use strict';

// End-to-end MIND search using explicit Homeoint parent IDs + the v145 path sidecar.
// Runs without a browser: node tests/kent_mind_search_flow_v145.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const mind = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/mind.json'), 'utf8'));
const searchPaths = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_search_paths/mind.json'), 'utf8'));
const content = { innerHTML: '', scrollTop: 0 };
const input = { value: 'anger' };
const document = {
    readyState: 'loading',
    addEventListener: function () {},
    getElementById: function (id) {
        if (id === 'repBrowserSearch') return input;
        if (id === 'repRubricContent') return content;
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
        return { pos: String(query).trim().split(/\s+/).filter(Boolean) };
    },
    repBoolMatch: function (query, text) {
        const words = query.pos || [];
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

function countExpectedAngerMatches() {
    const hidden = new Set(context.window.KENT_TREE_FIX.ch.mind.h.map(String));
    return Object.keys(mind).filter(function (rid) {
        const rubric = mind[rid] || {};
        const text = String(rubric.path || rubric.de_path || rubric.t || '').toLowerCase();
        return !hidden.has(String(rid)) && text.includes('anger');
    }).length;
}

context.searchRepertoryBrowser();
setTimeout(function () {
    try {
        const actualCount = (content.innerHTML.match(/class="rep-rubric-item"/g) || []).length;
        assert.strictEqual(actualCount, countExpectedAngerMatches(), 'breadcrumb rendering must not change query matches');
        assert(actualCount > 0);
        const visibleAngerLabel = 'ANGER, irascibility';
        assert(content.innerHTML.includes('MIND; ' + visibleAngerLabel), 'root cross-reference is omitted from the displayed breadcrumb');
        assert(content.innerHTML.includes('MIND; ' + visibleAngerLabel + '; morning'), 'child result retains the breadcrumb without the root cross-reference');
        assert(!content.innerHTML.includes('Irritability and Quarrelsome'), 'root cross-reference is not shown in search results');
        assert(!content.innerHTML.includes('MIND; ANGER;'), 'no synthetic OOREP anchor is inserted');
        assert(content.innerHTML.indexOf('MIND; ' + visibleAngerLabel + '"') <
            content.innerHTML.indexOf('MIND; ' + visibleAngerLabel + '; morning'), 'parent precedes child in printed source order');
        console.log('PASS end-to-end Kent MIND search: ' + actualCount +
            ' anger matches, complete semicolon breadcrumbs, stable Kent order.');
    } catch (error) {
        console.error(error.stack || error);
        process.exitCode = 1;
    }
}, 100);
