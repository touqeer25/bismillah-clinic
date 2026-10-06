'use strict';

// 🔑 v163 (صارف): کراس ریفرنس بحال — Kent MIND جڑ سطح سمیت ہر ربرک پر (See …) نظر آئے گا
// (ماضی کی v146 UI-suppression ہٹا دی گئی؛ ماخذی راستے/کلیدیں پہلے ہی جوں کے توں ہیں)
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

// ۱) جڑ سطح: کراس ریفرنس نظر آئے — visible title میں اور renderer کے انداز میں
const treeRoot = renderedTreeTitle('kent', 'mind', sourceRoot, [sourceRoot]);
assert.strictEqual(treeRoot.title, escapeHtml(sourceRoot),
    'Kent MIND root rubric keeps its See reference in the visible title');
assert.strictEqual(xrefRendererInput, sourceRoot,
    'xref renderer receives the full source label including the See reference');
assert(treeRoot.html.includes('(See Irritability'), 'See reference text is rendered');
assert.strictEqual(treeRoot.row.label, sourceRoot, 'source rubric label remains unchanged');
assert(treeRoot.html.includes('data-full="' + sourceRoot + '"'), 'navigation keeps the original full path');

// ۲) اصل ماخذ data فائل کبھی نہ بدلے — لیبل وہی رہے
const mind = JSON.parse(fs.readFileSync(path.join(ROOT, 'kent_chapters/mind.json'), 'utf8'));
assert.strictEqual(mind['r0'].t, 'ABANDONED (See Forsaken)', 'source data keeps See references');
assert.strictEqual(mind['r0'].source_label, 'ABANDONED (See Forsaken)', 'source label keeps See references');

// ۳) تلاش: breadcrumb میں بھی کراس ریفرنس برقرار
const searchContext = { escapeHtml, repClipsLoad: () => {} };
vm.createContext(searchContext);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/repertory/rep-search.js'), 'utf8'), searchContext,
    { filename: 'js/repertory/rep-search.js' });
const sourcePath = ['MIND', sourceRoot, 'morning'];
const result = { book: 'kent', chapter: 'mind', text: 'morning', searchPath: sourcePath };
assert.strictEqual(searchContext.repSearchResultDisplayText(result), 'MIND; ' + sourceRoot + '; morning',
    'search breadcrumb shows the root See reference again');
assert.deepStrictEqual(sourcePath, ['MIND', sourceRoot, 'morning'], 'search source breadcrumb remains unchanged');
const resultHtml = searchContext.repSearchResultTitleHtml(result, []);
assert(resultHtml.includes('MIND; ' + sourceRoot + '; morning'), 'search title includes the See reference');

// ۴) دوسرے ابواب متاثر نہ ہوں
assert.strictEqual(searchContext.repSearchResultDisplayText({
    book: 'kent', chapter: 'head', text: 'head rubric', searchPath: ['HEAD', sourceRoot]
}), 'HEAD; ' + sourceRoot, 'other chapter search paths are unchanged');

console.log('PASS Kent MIND cross-references are visible again in tree and search without changing source paths.');
