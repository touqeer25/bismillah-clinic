'use strict';

// UI-only suppression: preserve source paths/keys, omit top-level Kent MIND cross-references.
// Run: node tests/kent_mind_crossref_display.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

let xrefRendererInput = null;
const treeContext = {
    localStorage: { getItem: () => null, setItem: () => {} },
    escapeHtml,
    currentLang: 'en',
    repCurrentBook: 'kent',
    repCurrentChapter: 'mind',
    repUrLabelsOn: () => false,
    repCmpChkHtml: () => '',
    repLangText: map => map.en || map.ur || '',
    repXrefHtml: label => { xrefRendererInput = label; return escapeHtml(label); }
};
vm.createContext(treeContext);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/rep-tree.js'), 'utf8'), treeContext,
    { filename: 'js/repertory/rep-tree.js' });
treeContext.repTreeActsHtml = () => '';

function renderedTreeTitle(book, chapter, label, labels) {
    treeContext.repCurrentBook = book;
    treeContext.repCurrentChapter = chapter;
    const row = {
        label,
        labels,
        full: labels.join(', '),
        depth: 0,
        kids: false,
        node: { hasRubric: true, rid: 'r39', remedies: {}, order: [] }
    };
    const html = treeContext.repTreeRowHtml(row);
    const title = html.match(/<span class="rtv-lab[^\"]*">([\s\S]*?)<\/span>/);
    return { html, title: title && title[1], row };
}

const sourceRoot = 'ANGER, irascibility (See Irritability and Quarrelsome)';
const treeRoot = renderedTreeTitle('kent', 'mind', sourceRoot, [sourceRoot]);
assert.strictEqual(treeRoot.title, 'ANGER, irascibility', 'Kent MIND root rubric title omits the See reference');
assert.strictEqual(xrefRendererInput, 'ANGER, irascibility', 'xref renderer receives only the visible title');
assert.strictEqual(treeRoot.row.label, sourceRoot, 'source rubric label remains unchanged');
assert(treeRoot.html.includes('data-full="' + sourceRoot + '"'), 'navigation keeps the original full path');

const treeChild = renderedTreeTitle('kent', 'mind', sourceRoot, ['PARENT', sourceRoot]);
assert.strictEqual(treeChild.title, sourceRoot, 'a rubric with an ancestor remains unchanged even at the start of a mounted sub-tree');
const otherChapterRoot = renderedTreeTitle('kent', 'head', sourceRoot, [sourceRoot]);
assert.strictEqual(otherChapterRoot.title, sourceRoot, 'other Kent chapters are not changed');

const searchContext = { escapeHtml, repClipsLoad: () => {} };
vm.createContext(searchContext);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/rep-search.js'), 'utf8'), searchContext,
    { filename: 'js/repertory/rep-search.js' });
const sourcePath = ['MIND', sourceRoot, 'morning'];
const result = { book: 'kent', chapter: 'mind', text: 'morning', searchPath: sourcePath };
assert.strictEqual(searchContext.repSearchResultDisplayText(result), 'MIND; ANGER, irascibility; morning');
assert.deepStrictEqual(sourcePath, ['MIND', sourceRoot, 'morning'], 'search source breadcrumb remains unchanged');
const resultHtml = searchContext.repSearchResultTitleHtml(result, []);
assert(resultHtml.includes('MIND; ANGER, irascibility; morning'));
assert(!resultHtml.includes('Irritability and Quarrelsome'), 'hidden root reference is absent from visible and title text');
assert.strictEqual(searchContext.repSearchResultDisplayText({
    book: 'kent', chapter: 'head', text: 'head rubric', searchPath: ['HEAD', sourceRoot]
}), 'HEAD; ' + sourceRoot, 'other chapter search paths are unchanged');

console.log('PASS Kent MIND root cross-reference is hidden in tree and search display without changing source paths.');
