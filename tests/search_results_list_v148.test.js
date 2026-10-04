'use strict';

// Incremental all-repertories results use the same plain rows and remedies toggle as ordinary search.
// Run: node tests/search_results_list_v148.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const mind = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/mind.json'), 'utf8'));
const searchPaths = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_search_paths/mind.json'), 'utf8'));
const listClasses = new Set();
const resultList = { classList: {
    toggle: function (name, force) { if (force) listClasses.add(name); else listClasses.delete(name); },
    contains: function (name) { return listClasses.has(name); }
} };
const input = { value: 'anger' };
const content = {
    innerHTML: '', scrollTop: 0,
    querySelector: function (selector) { return selector === '.rep-search-results-list' ? resultList : null; }
};
const allResults = { innerHTML: '', insertAdjacentHTML: function (_where, html) { this.innerHTML += html; } };
const info = { innerHTML: '' }, status = { innerHTML: '' };
const document = {
    readyState: 'loading', addEventListener: function () {},
    getElementById: function (id) {
        if (id === 'repBrowserSearch') return input;
        if (id === 'repRubricContent') return content;
        if (id === 'repSearchView') return content;   // 🔑 v151: نتائج اپنے خانے میں
        if (id === 'repAllSearchResults') return allResults;
        if (id === 'repAllSearchInfo') return info;
        if (id === 'repAllSearchStatus') return status;
        return null;
    }
};
function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
}
const context = {
    window: {addEventListener: function () {}}, document: document, console: {warn: function () {}, error: function () {}}, 
    setTimeout: setTimeout, escapeHtml: escapeHtml,
    localStorage: {getItem: function () { return null; }, setItem: function () {}},
    repClipsLoad: function () {}, repRenderDock: function () {}, repCmpSyncUI: function () {},
    repCmpChkHtml: function () { return ''; }, repGradeShow: function () { return true; },
    repBookColor: function () { return '#805ad5'; },
    REP_BOOK_INFO: {kent: {abbr: 'Kent', name: 'Kent (English)', dataFile: 'kent_repertory.json', chapDir: 'kent_chapters/', tree: 'prefix'}},
    REP_DATA_V: 'v=148', REP_TYPE_LABELS: {rubric: {en: 'Rubric'}},
    REP_SEARCH_TYPES: ['rubric', 'remedy', 'rubric_remedy', 'clinical'],
    REP_SCOPE_ORDER: ['chapter', 'book', 'all'],
    currentLang: 'en', repCurrentBook: 'kent', repCurrentChapter: 'mind',
    repChapterNames: [{key: 'mind', name: 'MIND'}], _allBookChapters: {},
    _repFullData: null, repSearchMode: 'rubric', repSearchScope: 'all', repSearchAllBooks: true,
    repTreePage: 0, repTreePageSize: 50, repCurrentDetail: null,
    repClipViewOpen: false, repWorkbenchOpen: false, repCompareOpen: false, repAnalysisOpen: -1,
    repParseBoolQuery: function (query) { return {pos: String(query).trim().split(/\s+/).filter(Boolean)}; },
    repBoolMatch: function (query, text) {
        return (query.pos || []).every(function (word) { return String(text || '').toLowerCase().includes(word); });
    },
    fetch: function (url) {
        if (String(url).indexOf('kent_search_paths/mind.json') === 0) {
            return Promise.resolve({ok: true, json: function () { return Promise.resolve(searchPaths); }});
        }
        return Promise.reject(new Error('Unexpected fetch: ' + url));
    }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/kent-tree-fix.js'), 'utf8'), context,
    {filename: 'js/repertory/kent-tree-fix.js'});
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/rep-tree.js'), 'utf8'), context,
    {filename: 'js/repertory/rep-tree.js'});
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/rep-search.js'), 'utf8'), context,
    {filename: 'js/repertory/rep-search.js'});
// Keep this test focused on rendering: the production loaders deliver the same chapter object.
context.loadSingleBookData = function (_book, cb) { cb({mind: mind}); };
context.ensureSingleBookIndex = function (_book, _data, cb) { cb(); };

context.searchRepertoryBrowser();
setTimeout(function () {
    try {
        assert(content.innerHTML.includes('id="repAllSearchResults" class="rep-search-results-list show-remedies"'),
            'incremental all-repertories output starts with the shared list container');
        assert((allResults.innerHTML.match(/class="rep-rubric-item rep-search-row"/g) || []).length > 0,
            'all-repertories results are appended as list rows');
        assert(allResults.innerHTML.includes('rep-search-group-heading'), 'rows are grouped by book and chapter');
        assert(allResults.innerHTML.includes('rep-search-remedies'), 'each result can show its remedy line');
        assert(!allResults.innerHTML.includes('rpc-card') && !allResults.innerHTML.includes('rep-cards-grid'),
            'incremental results do not use cards');
        assert(!content.innerHTML.includes('Irritability and Quarrelsome') &&
            !allResults.innerHTML.includes('Irritability and Quarrelsome'), 'the main MIND root reference remains hidden');

        let compareRefreshes = 0;
        context.repSearchRefreshCompareButtons = function () { compareRefreshes++; return true; };
        vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/rep-compare-mode.js'), 'utf8'), context,
            {filename: 'js/repertory/rep-compare-mode.js'});
        context.repCmpRerender();
        assert.strictEqual(compareRefreshes, 1, 'compare-mode refresh updates incremental search rows in place');

        listClasses.add('show-remedies'); // mirror the class created when the browser parses the list markup
        context.repTreeToggleRems();
        assert.strictEqual(context.repTreeOpts.rems, false);
        assert.strictEqual(listClasses.has('show-remedies'), false, 'first click hides all-search remedies');
        context.repTreeToggleRems();
        assert.strictEqual(context.repTreeOpts.rems, true);
        assert.strictEqual(listClasses.has('show-remedies'), true, 'second click restores all-search remedies');
        const css = fs.readFileSync(path.join(ROOT, 'css/rep-search-results.css'), 'utf8');
        assert(css.includes('.rep-search-remedies{display:none') && css.includes('.show-remedies .rep-search-remedies{display:block'),
            'stylesheet implements the same two-state visibility toggle');
        console.log('PASS all-repertories search: plain rows, grouped headings, hidden root cross-reference, and working remedy toggle.');
    } catch (error) {
        console.error(error.stack || error);
        process.exitCode = 1;
    }
}, 300);
