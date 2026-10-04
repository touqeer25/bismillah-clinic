'use strict';

// v151 — سرچ نتائج کا اپنا ٹیب:
//   📖 ریپرٹری ⇄ 🔍 نتائج (اور 🔬 تفریق) — ٹیب پٹی میں تیسرا ٹیب؛
//   نتائج اپنے خانے (#repSearchView) میں لکھے جاتے ہیں، ریپرٹری کا خانہ نہیں ہٹتا؛
//   نتائج کی سطر پر کلک سے ربرک 📖 ریپرٹری ٹیب میں کھلتی ہے؛ سرچ ختم کرنے پر واپس ریپرٹری۔
// Run: node tests/search_tab_v151.test.js
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.resolve(__dirname, '..');

// ---------- چھوٹا ڈھانچہ: style + classList والے خانے ----------
function el(id) {
    const classes = new Set();
    return {
        id: id, style: {}, innerHTML: '', textContent: '', scrollTop: 0,
        classList: {
            toggle: function (name, force) { if (force) classes.add(name); else classes.delete(name); },
            add: function (name) { classes.add(name); },
            contains: function (name) { return classes.has(name); }
        },
        querySelector: function () { return null; },
        querySelectorAll: function () { return []; },
        addEventListener: function () {},
        getAttribute: function () { return null; },
        insertAdjacentHTML: function () {}
    };
}
const ids = ['page-repertoryBrowser', 'repRubricContent', 'repSearchView', 'repDiffView',
    'repPageTabRep', 'repPageTabDiff', 'repPageTabSearch', 'repSearchTabCount'];
const dom = {};
ids.forEach(function (id) { dom[id] = el(id); });
// index.html کی ابتدائی حالت: ریپرٹری کھلی، نتائج اور تفریق چھپے
dom['repSearchView'].style.display = 'none';
dom['repDiffView'].style.display = 'none';
dom['repPageTabRep'].classList.add('on');   // index.html میں ریپرٹری ٹیب پہلے سے روشن ہے (class="rep-pagetab on")
const document = {
    readyState: 'complete',
    addEventListener: function () {},
    getElementById: function (id) { return dom[id] || null; },
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
    createElement: function () { return el('new'); },
    body: el('body')
};
const context = {
    window: {}, document: document, console: console, setTimeout: setTimeout,
    escapeHtml: function (v) { return String(v == null ? '' : v); },
    localStorage: { getItem: function () { return null; }, setItem: function () {} },
    REP_BOOK_INFO: { kent: { abbr: 'Kent', name: 'Kent' } },
    repCurrentBook: 'kent', repCurrentChapter: 'mind', currentLang: 'ur',
    repGradMin: 1, repTreeOpts: { rems: true }, repDiffSel: [], repDiffCtx: null,
    repDiffLast: null, repDiffOpts: {}, repDiffTab: 'excl',
    repDiffRenderHead: function () {}, repDiffRenderBody: function () {},
    repRenderDock: function () {}, repLangText: function (m) { return m.ur || m.en || ''; },
    getChapterDisplayName: function () { return 'MIND'; },
    normalizeChapterKey: function (b, c) { return c; }
};
vm.createContext(context);
// تفریق کے شیل میں ٹیب کا منطق ہے — وہی اصلی فائل چلائی جاتی ہے
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/differentiation/06-diff-shell.js'), 'utf8'), context,
    { filename: 'js/differentiation/06-diff-shell.js' });

const rep = dom['repRubricContent'], sv = dom['repSearchView'];
const tabRep = dom['repPageTabRep'], tabDiff = dom['repPageTabDiff'], tabSearch = dom['repPageTabSearch'];

// ---------- 1) ابتدا: ریپرٹری سامنے ----------
assert.strictEqual(rep.style.display, '' || undefined, 'ابتدا میں ریپرٹری کا خانہ کھلا ہے');
assert.strictEqual(sv.style.display, 'none', 'ابتدا میں نتائج کا خانہ چھپا ہے');
assert.strictEqual(tabRep.classList.contains('on'), true, 'ابتدا میں 📖 ریپرٹری ٹیب روشن ہے');

// ---------- 2) نتائج کا ٹیب ----------
context.repPageTab('search');
assert.strictEqual(sv.style.display, '', '🔍 نتائج کا ٹیب کھلنے پر نتائج کا خانہ سامنے آتا ہے');
assert.strictEqual(rep.style.display, 'none', 'نتائج کے ٹیب پر ریپرٹری کا خانہ چھپتا ہے');
assert.strictEqual(tabSearch.classList.contains('on'), true, '🔍 نتائج ٹیب روشن ہوتا ہے');
assert.strictEqual(tabRep.classList.contains('on'), false, '📖 ریپرٹری ٹیب بجھ جاتا ہے');

// ---------- 3) واپس ریپرٹری ----------
context.repPageTab('rep');
assert.strictEqual(rep.style.display, '', '📖 ریپرٹری پر واپس آنے پر پرانا خانہ سامنے آتا ہے');
assert.strictEqual(sv.style.display, 'none', 'اور نتائج کا خانہ چھپ جاتا ہے');
assert.strictEqual(tabRep.classList.contains('on'), true, '📖 ریپرٹری ٹیب دوبارہ روشن');

// ---------- 4) ریپرٹری اور نتائج دونوں کے درمیان بار بار ----------
context.repPageTab('search'); context.repPageTab('rep'); context.repPageTab('search');
assert.strictEqual(sv.style.display, '', 'بار بار ٹیب بدلنے پر بھی نتائج کا خانہ سلامت رہتا ہے');
assert.strictEqual(context.repActivePageTab, 'search', 'سامنے والا ٹیب یاد رہتا ہے (search)');

// ---------- 5) تفریق کا ٹیب بھی سلامت ----------
context.repPageTab('diff');
assert.strictEqual(dom['repDiffView'].style.display, '', '🔬 تفریق کا ٹیب پہلے کی طرح کام کرتا ہے');
assert.strictEqual(sv.style.display, 'none', 'تفریق کے ٹیب پر نتائج کا خانہ چھپتا ہے');
assert.strictEqual(rep.style.display, 'none', 'تفریق کے ٹیب پر ریپرٹری کا خانہ چھپتا ہے');
context.repPageTab('rep');

// ---------- 6) ڈھانچہ اور کوڈ کی جانچ ----------
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
assert(/id="repPageTabSearch"[^>]*onclick="repPageTab\('search'\)"/.test(html), 'index.html میں 🔍 نتائج کا تیسرا ٹیب موجود ہے');
assert(/<div id="repSearchView" class="rep-main-inner" style="display:none"><\/div>/.test(html), 'index.html میں #repSearchView کا نیا خانہ موجود ہے');
const order = html.indexOf('id="repPageTabSearch"') < html.indexOf('id="repSearchView"');
assert(order, 'ٹیب پٹی میں نتائج کا ٹیب خانے سے پہلے آتا ہے');

const src = fs.readFileSync(path.join(ROOT, 'js/repertory/rep-search.js'), 'utf8');
assert(/function repSearchHost\(\)\{[\s\S]{0,160}repSearchView/.test(src), 'تلاش نتائج #repSearchView میں لکھتی ہے');
assert(src.indexOf("repSearchTabShow(); repSearchTabCount(results?results.length:0);") > -1, 'نتائج آنے پر ٹیب خود بخود کھلتا اور گنتی لگتی ہے');
assert(/function navigateToRubric[\s\S]{0,220}repPageTab\('rep'\)/.test(src), 'نتائج کی سطر پر کلک سے 📖 ریپرٹری ٹیب کھلتا ہے');
assert(/function restoreRepSearchContext\(\)\{[\s\S]{0,200}repPageTab\('rep'\)/.test(src), 'سرچ ختم کرنے پر واپس 📖 ریپرٹری آتا ہے');
assert(src.indexOf("all.sort(function(a,b){return a.localeCompare(b);});") > -1, 'ادویات محض حروفِ تہجی سے'); 

const shell = fs.readFileSync(path.join(ROOT, 'js/differentiation/06-diff-shell.js'), 'utf8');
assert(shell.indexOf("var repActivePageTab='rep';") > -1, 'سامنے والے ٹیب کا نشان موجود ہے');
assert(/repActivePageTab!=='rep'\) repPageTab\('rep'\)/.test(shell), 'باب/بریڈکرمب پر کلک سے خود بخود ریپرٹری ٹیب');

console.log('PASS v151 search tab: 📖 ریپرٹری ⇄ 🔍 نتائج ⇄ 🔬 تفریق — تینوں ٹیب کلک سے، نتائج اپنے خانے میں، ادویات حروفِ تہجی سے۔');
