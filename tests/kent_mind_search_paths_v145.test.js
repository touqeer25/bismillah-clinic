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
assert.strictEqual(sidecar.tree_fix_version, '147');
assert.strictEqual(sidecar.display_tree_override_count, 2);
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
const anxietySleepPaths = {
    r284: ['ANXIETY', 'sleep', 'before'],
    r285: ['ANXIETY', 'sleep', 'before', 'evening'],
    r286: ['ANXIETY', 'sleep', 'on going to'],
    r287: ['ANXIETY', 'sleep', 'during (See Dreams)'],
    r288: ['ANXIETY', 'sleep', 'loss of sleep'],
    r289: ['ANXIETY', 'sleep', 'menses, after'],
    r290: ['ANXIETY', 'sleep', 'on starting from'],
    r291: ['ANXIETY', 'sleep', 'partial slumbering in the morning, during']
};
Object.keys(anxietySleepPaths).forEach(rid => {
    assert.deepStrictEqual(sidecar.entries[rid].path, anxietySleepPaths[rid], 'audited sleep breadcrumb ' + rid);
});
assert.deepStrictEqual(Object.keys(anxietySleepPaths).map(rid => sidecar.entries[rid].order),
    [283, 284, 285, 286, 287, 288, 289, 290], 'printed source order remains continuous through the corrected branch');
const ideasDeficiencyPaths = {
    h2528: ['IDEAS', 'deficiency of'],
    o48406: ['IDEAS', 'deficiency of', 'extra exertion, on'],
    o48407: ['IDEAS', 'deficiency of', 'interruption, from any'],
    o48408: ['IDEAS', 'deficiency of', 'vomiting amel.']
};
Object.keys(ideasDeficiencyPaths).forEach(rid => {
    assert.deepStrictEqual(sidecar.entries[rid].path, ideasDeficiencyPaths[rid], 'reviewed IDEAS deficiency path ' + rid);
});
assert.deepStrictEqual(Object.keys(ideasDeficiencyPaths).map(rid => sidecar.entries[rid].order),
    [2529, 2530, 2531, 2532], 'page order remains intact despite the reviewed tree branch');
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
const sleepPathInfo = searchContext.repSearchPathForRecord('kent', 'mind', 'r286');
assert.deepStrictEqual(JSON.parse(JSON.stringify(sleepPathInfo.path)),
    ['MIND', 'ANXIETY', 'sleep', 'on going to']);
assert.strictEqual(searchContext.repSearchResultDisplayText({
    book: 'kent', chapter: 'mind', text: 'ANXIETY, on going to', searchPath: sleepPathInfo.path
}), 'MIND; ANXIETY; sleep; on going to');
assert.strictEqual(sleepPathInfo.order, sidecar.entries.r286.order);
const duringPathInfo = searchContext.repSearchPathForRecord('kent', 'mind', 'r287');
assert(searchContext.repSearchResultDisplayText({
    book: 'kent', chapter: 'mind', text: 'during', searchPath: duringPathInfo.path
}).includes('during (See Dreams)'), 'sub-rubric cross-references remain visible');
assert.strictEqual(searchContext.repSearchResultDisplayText({
    book: 'kent', chapter: 'mind', text: 'ANGER, absent persons, at', searchPath: pathInfo.path
}), 'MIND; ANGER, irascibility; absent persons, at');
assert.deepStrictEqual(JSON.parse(JSON.stringify(pathInfo.path)),
    ['MIND', angerLabel, 'absent persons, at'], 'the source breadcrumb is retained unchanged');

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
assert(resultContainer.innerHTML.includes('ANGER, irascibility; absent persons, at'));
assert(!resultContainer.innerHTML.includes('Irritability and Quarrelsome'),
    'the root-rubric cross-reference is hidden in rendered search results');
assert(resultContainer.innerHTML.includes("navigateToRubric(\'kent\',\'mind\',\'r45\')"));
assert.strictEqual(resultContainer.scrollTop, 0);
searchContext.displaySearchResults([{
    book: 'kent', chapter: 'mind', rid: 'r286', text: 'on going to',
    searchPath: sleepPathInfo.path, searchOrder: sleepPathInfo.order,
    remedies: { calc: 2 }
}], 'Sleep hierarchy test');
assert(resultContainer.innerHTML.includes('MIND; ANXIETY; sleep; on going to'));
assert(resultContainer.innerHTML.includes("navigateToRubric(\'kent\',\'mind\',\'r286\')"));

console.log('PASS Kent MIND: ' + sidecar.visible_rubric_count + ' saved search paths; audited sleep breadcrumbs; unchanged source coverage.');
