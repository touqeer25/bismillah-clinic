'use strict';

// Search breadcrumbs are a derived sidecar; the explicit Homeoint MIND tree is the authority.
// Run: node tests/kent_mind_search_paths_v145.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const { buildKentMindSearchPaths } = require('../tools/build_kent_mind_search_paths');
const sourceBytesBefore = fs.readFileSync(path.join(ROOT, 'kent_chapters/mind.json'), 'utf8');

const sidecar = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_search_paths/mind.json'), 'utf8'));
const freshlyBuilt = buildKentMindSearchPaths();
assert.strictEqual(JSON.stringify(sidecar), JSON.stringify(freshlyBuilt),
    'saved sidecar must match the current Kent MIND tree parser');
assert.strictEqual(sidecar.schema, 'kent-search-paths-v1');
assert.strictEqual(sidecar.tree_fix_version, '145');
assert.strictEqual(sidecar.source_record_count, 4356);
assert.strictEqual(sidecar.hidden_anchor_count, 0);
assert.strictEqual(sidecar.visible_rubric_count, 4356);
assert.strictEqual(Object.keys(sidecar.entries).length, sidecar.visible_rubric_count);

// Kent's displayed, book-style path—not the third-party Complete Repertory's
// separate hierarchy—is saved for search. The chapter heading is supplied by UI.
const angerLabel = 'ANGER, irascibility (See Irritability and Quarrelsome)';
assert.deepStrictEqual(sidecar.entries.r39.path, [angerLabel]);
assert.deepStrictEqual(sidecar.entries.r40.path, [angerLabel, 'morning']);
assert.deepStrictEqual(sidecar.entries.r45.path, [angerLabel, 'absent persons, at']);
assert(sidecar.entries.r39.order < sidecar.entries.r40.order);
assert(sidecar.entries.r40.order < sidecar.entries.r45.order);
assert.strictEqual(sidecar.hidden_anchor_count, 0, 'no source rubric is hidden');

assert.strictEqual(fs.readFileSync(path.join(ROOT, 'kent_chapters/mind.json'), 'utf8'), sourceBytesBefore,
    'source chapter file remains untouched during path-index generation');
assert(!Object.prototype.hasOwnProperty.call(sidecar.entries.r39, 'remedies'),
    'sidecar contains paths/order only, never a second remedy/grade source');

const escapeHtml = function (value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
    });
};
const searchContext = {
    console: { warn: function () {} },
    escapeHtml: escapeHtml,
    repClipsLoad: function () {},
    REP_BOOK_INFO: { kent: { abbr: 'Kent', name: 'Kent (English)' } },
    repCurrentBook: 'kent',
    repChapterNames: [{ key: 'mind', name: 'MIND' }],
    _allBookChapters: {}
};
vm.createContext(searchContext);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/rep-search.js'), 'utf8'), searchContext,
    { filename: 'js/repertory/rep-search.js' });
searchContext._repSearchKentMindPaths = sidecar;

const pathInfo = searchContext.repSearchPathForRecord('kent', 'mind', 'r45');
assert.deepStrictEqual(JSON.parse(JSON.stringify(pathInfo.path)),
    ['MIND', angerLabel, 'absent persons, at']);
assert.strictEqual(pathInfo.order, sidecar.entries.r45.order);
assert.strictEqual(searchContext.repSearchResultDisplayText({
    text: 'ANGER, absent persons, at', searchPath: pathInfo.path
}), 'MIND; ' + angerLabel + '; absent persons, at');

const rendered = searchContext.repSearchResultTitleHtml({
    text: 'leaf', searchPath: ['MIND', 'ANGER, irascibility', 'morning']
}, ['anger']);
assert(rendered.includes('MIND; '));
assert(rendered.includes('ANGER, irascibility; morning'));
assert(rendered.includes('<mark style=') && rendered.includes('>ANGER</mark>'));
assert(rendered.includes('class="rep-search-tree-path"'));

const longPath = ['MIND', 'PARENT '.repeat(35), 'leaf'];
const longHtml = searchContext.repSearchResultTitleHtml({ text: 'leaf', searchPath: longPath }, []);
assert(longHtml.includes(longPath.join('; ')), 'full tree paths must not be truncated');
const escaped = searchContext.repSearchResultTitleHtml({
    text: 'leaf', searchPath: ['MIND', '<script>alert(1)</script>']
}, []);
assert(!escaped.includes('<script>'));
assert(escaped.includes('&lt;script&gt;'));

const earlier = { book:'kent', chapter:'mind', text:'z title', searchOrder:10 };
const later = { book:'kent', chapter:'mind', text:'a title', searchOrder:11 };
assert(searchContext.repCompareSearchResults(earlier, later) < 0,
    'search results follow the saved Kent book-tree order, not alphabetical leaf text');

const resultContainer = { innerHTML: '', scrollTop: 99 };
searchContext.document = { getElementById: function (id) {
    return id === 'repRubricContent' ? resultContainer : null;
} };
searchContext.currentLang = 'en';
searchContext.repSearchCache = 'anger|';
searchContext.repParseBoolQuery = function () { return { pos: ['anger'] }; };
searchContext.repBookColor = function () { return '#805ad5'; };
searchContext.repCmpChkHtml = function () { return ''; };
searchContext.repGradeShow = function () { return true; };
searchContext.repRenderDock = function () {};
searchContext.repCurrentBook = 'kent';
searchContext.repCurrentChapter = 'mind';
searchContext.displaySearchResults([{
    book: 'kent', chapter: 'mind', rid: 'r45',
    text: 'ANGER, absent persons, at',
    searchPath: ['MIND', angerLabel, 'absent persons, at'],
    searchOrder: sidecar.entries.r45.order,
    remedies: { aur: 2 }
}], 'Search test');
assert(resultContainer.innerHTML.includes('MIND; '));
assert(resultContainer.innerHTML.includes(angerLabel + '; absent persons, at'));
assert(resultContainer.innerHTML.includes("navigateToRubric(\'kent\',\'mind\',\'r45\')"));
assert.strictEqual(resultContainer.scrollTop, 0);

console.log('PASS Kent MIND: ' + sidecar.visible_rubric_count + ' saved search paths; search shows full breadcrumbs; book-view tree is untouched.');
