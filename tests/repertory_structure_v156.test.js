'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
let passes = 0;
function ok(value, message) {
    if (!value) throw new Error('ناکام: ' + message);
    passes++;
    console.log('درست: ' + message);
}

const index = read('index.html');
const sw = read('service-worker.js');
const sourceRoot = path.join(root, 'ui/repertory');
const fragments = fs.readdirSync(sourceRoot).filter((name) => name.endsWith('.html'));
ok(fragments.length >= 20, 'ریپرٹری کے ساختی ٹکڑے الگ فائلوں میں موجود ہیں');
ok(!index.includes('@include:'), 'تیار صفحے میں کوئی نامکمل شمولیتی نشان باقی نہیں');
ok(index.includes('<!-- BEGIN GENERATED REPERTORY STRUCTURE -->') && index.includes('<!-- END GENERATED REPERTORY STRUCTURE -->'), 'مرکزی صفحے میں ساختی حصے کی حدیں محفوظ ہیں');
const cssVersion = (index.match(/repertory-tabs\.css\?v=(\d+)/) || [])[1];
const jsVersion = (index.match(/rep-tabs\.js\?v=(\d+)/) || [])[1];
const swVersion = (sw.match(/CACHE_NAME='bhc-clinic-v(\d+)'/) || [])[1];
ok(!!cssVersion && cssVersion === jsVersion && jsVersion === swVersion, 'صفحے، بیرونی خول اور سروس ورکر کے نسخے ایک جیسے ہیں');

const requiredIds = [
    'page-repertoryBrowser', 'repWorkspaceTabs', 'repShellStripNav', 'repShellHideSideBtn',
    'repShellSideToolsRow', 'repSideTools', 'repChapterList', 'repShellCompareTools',
    'repShellHostRoot', 'repPageTabs', 'repDiffView', 'repSearchView', 'repRubricContent',
    'repDockArea', 'repAskFab', 'repAskPanel', 'repPanelOverlay', 'repKebabMenu', 'repChartOverlay'
];
for (const id of requiredIds) {
    const matches = index.match(new RegExp('\\bid="' + id.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&') + '"', 'g')) || [];
    ok(matches.length === 1, 'ساختی شناختی نشان ' + id + ' صرف ایک مرتبہ درج ہے');
}

const hostAt = index.indexOf('id="repShellHostRoot"');
const diffAt = index.indexOf('id="repDiffView"');
const searchAt = index.indexOf('id="repSearchView"');
const repAt = index.indexOf('id="repRubricContent"');
ok(hostAt < diffAt && diffAt < searchAt && searchAt < repAt, 'تفریق، تلاش اور ریپرٹری کے خانے مقررہ ترتیب میں ہیں');
ok(index.indexOf('id="repShellCompareTools"') < hostAt, 'موازنہ کا خالی ساختی خانہ مواد کے میزبان سے پہلے ہے');

const buildCheck = cp.spawnSync(process.execPath, ['tools/build_repertory_ui.js', '--check'], {
    cwd: root, encoding: 'utf8'
});
ok(buildCheck.status === 0, 'مرکزی صفحہ ساختی فائلوں سے تازہ بنا ہوا ہے');

const loadOrder = read('js/repertory/LOAD_ORDER.txt').trim().split(/\r?\n/);
ok(loadOrder.join('|') === [
    'rep-books.js', 'kent-tree-fix.js', 'rep-chapters.js', 'rep-folders.js', 'rep-tree.js',
    'rep-clipboards.js', 'rep-compare-mode.js', 'rep-rubric-detail.js', 'rep-search.js',
    'rep-workbench.js', 'rep-analysis.js'
].join('|'), 'مقررہ ریپرٹری لوڈ ترتیب بعینہٖ برقرار ہے');

console.log('ساختی جانچ مکمل، درست دعوے: ' + passes);
