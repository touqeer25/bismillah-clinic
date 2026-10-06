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
const listClasses = new Set();
const resultList = { classList: {
    toggle: function (name, force) {
        if (force) listClasses.add(name); else listClasses.delete(name);
    },
    contains: function (name) { return listClasses.has(name); }
} };
const content = {
    innerHTML: '', scrollTop: 0,
    querySelector: function (selector) {
        return selector === '.rep-search-results-list' ? resultList : null;
    }
};
const input = { value: 'anger' };
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
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/rep-tree.js'), 'utf8'), context,
    { filename: 'js/repertory/rep-tree.js' });

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
        const actualCount = (content.innerHTML.match(/class="[^"]*\brep-rubric-item\b[^"]*"/g) || []).length;
        assert.strictEqual(actualCount, countExpectedAngerMatches(), 'breadcrumb rendering must not change query matches');
        assert(actualCount > 0);
        assert(content.innerHTML.includes('rep-search-results-list show-remedies'), 'results use a plain list with remedies visible by default');
        assert(content.innerHTML.includes('rep-search-row'), 'each rubric is rendered as a list row');
        assert(content.innerHTML.includes('rep-search-remedies'), 'remedies remain attached to their rubric rows');
        assert(!content.innerHTML.includes('rpc-card') && !content.innerHTML.includes('rep-cards-grid'), 'search results no longer use cards');
        listClasses.add('show-remedies');
        context.repTreeToggleRems();
        assert.strictEqual(context.repTreeOpts.rems, false, '💊 toggle turns remedy display off');
        assert.strictEqual(listClasses.has('show-remedies'), false, 'first toggle hides search-result remedies');
        context.repTreeToggleRems();
        assert.strictEqual(context.repTreeOpts.rems, true, 'second 💊 toggle turns remedy display back on');
        assert.strictEqual(listClasses.has('show-remedies'), true, 'second toggle restores search-result remedies');
        const visibleAngerLabel = 'ANGER, irascibility (See Irritability and Quarrelsome)'; // v163: کراس ریفرنس بحال
        assert(content.innerHTML.includes('class="rep-search-chapter-name">MIND</span>'), 'chapter appears once as the section heading');
        assert(content.innerHTML.includes('title="' + visibleAngerLabel + '"'), 'root rubric is shown without a repeated chapter breadcrumb');
        assert(content.innerHTML.includes('title="' + visibleAngerLabel + '; morning"'), 'child row keeps its path below the chapter heading');
        assert(content.innerHTML.includes('Irritability and Quarrelsome'), 'v163: root cross-reference is visible in search results');
        assert(!content.innerHTML.includes('MIND; ANGER;'), 'no synthetic OOREP anchor is inserted');
        assert(content.innerHTML.indexOf('title="' + visibleAngerLabel + '"') <
            content.innerHTML.indexOf('title="' + visibleAngerLabel + '; morning"'), 'parent precedes child in printed source order');
        console.log('PASS end-to-end Kent MIND search: ' + actualCount +
            ' anger matches, complete semicolon breadcrumbs, stable Kent order.');
    } catch (error) {
        console.error(error.stack || error);
        process.exitCode = 1;
    }
}, 100);
