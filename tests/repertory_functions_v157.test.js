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

const targets = [
    { label: 'بیرونی خول', source: 'js/repertory/rep-tabs-src', output: 'js/repertory/rep-tabs.js', count: 11 },
    { label: 'ورک بینچ', source: 'js/repertory/rep-workbench-src', output: 'js/repertory/rep-workbench.js', count: 8 },
    { label: 'تجزیہ و موازنہ', source: 'js/repertory/rep-analysis-src', output: 'js/repertory/rep-analysis.js', count: 4 },
    { label: 'تلاش', source: 'js/repertory/rep-search-src', output: 'js/repertory/rep-search.js', count: 5 },
    { label: 'کلپ بورڈ', source: 'js/repertory/rep-clipboards-src', output: 'js/repertory/rep-clipboards.js', count: 7 },
    { label: 'موازنہ موڈ', source: 'js/repertory/rep-compare-mode-src', output: 'js/repertory/rep-compare-mode.js', count: 5 },
    { label: 'درختی نمائش', source: 'js/repertory/rep-tree-src', output: 'js/repertory/rep-tree.js', count: 5 }
];
for (const target of targets) {
    const sourceDir = path.join(root, target.source);
    const parts = fs.readdirSync(sourceDir).filter((name) => name.endsWith('.js.part')).sort();
    const source = read(target.source + '/main.js.src');
    const runtime = read(target.output);
    ok(parts.length === target.count, target.label + ' کے ' + target.count + ' موضوعاتی فعلی حصے الگ موجود ہیں');
    for (const part of parts) {
        ok(source.includes('/* @include: ' + part + ' */'), 'مرکزی آغاز میں فعلی حصہ شامل ہے: ' + part);
        ok(fs.statSync(path.join(sourceDir, part)).size > 0, 'فعلی حصہ خالی نہیں: ' + part);
    }
    ok(!runtime.includes('@include:'), target.label + ' کی چلنے والی فائل میں ماخذی شامل کرنے کے نشان باقی نہیں');
}

const tabs = read('js/repertory/rep-tabs.js');
for (const name of ['installToolbar', 'installSideHeader', 'renderTabStrip', 'activateTab', 'openRepertory', 'installWrappers', 'init']) {
    ok(tabs.includes('function ' + name + '('), 'بیرونی خول کا موجودہ فعل تیار کوڈ میں برقرار ہے: ' + name);
}
const compareEngine = read('js/repertory/rep-analysis-src/01-compare-engine.js.part');
const compareView = read('js/repertory/rep-analysis-src/02-compare-view.js.part');
ok(compareEngine.includes('function _repCmpCompute(') && !compareEngine.includes('function renderCompare('), 'موازنہ کا حسابی فعل الگ ماخذی حصے میں ہے');
ok(compareView.includes('function renderCompare(') && !compareView.includes('function _repCmpCompute('), 'موازنہ صفحے کی نمائش الگ ماخذی حصے میں ہے');
const workbenchEngine = read('js/repertory/rep-workbench-src/06-workbench-grid-engine.js.part');
const workbenchView = read('js/repertory/rep-workbench-src/07-workbench-grid-view.js.part');
ok(workbenchEngine.includes('function _repWbGridCompute(') && !workbenchEngine.includes('function renderWbGrid('), 'ورک بینچ گرڈ کا حسابی فعل صفحاتی نمائش سے الگ ہے');
ok(workbenchView.includes('function renderWbGrid(') && !workbenchView.includes('function _repWbGridCompute('), 'ورک بینچ گرڈ کی نمائش حسابی فعل سے الگ ہے');
const searchEngine = read('js/repertory/rep-search-src/02-search-engine.js.part');
const searchView = read('js/repertory/rep-search-src/03-search-loading-and-results.js.part');
ok(searchEngine.includes('function searchRepertoryBrowser(') && !searchEngine.includes('function displaySearchResults('), 'تلاش کا حسابی عمل نتائج کی نمائش سے الگ ماخذ میں ہے');
ok(searchView.includes('function displaySearchResults(') && !searchView.includes('function searchRepertoryBrowser('), 'تلاش کے نتائج کی نمائش حسابی عمل سے الگ ماخذ میں ہے');
const clipStorage = read('js/repertory/rep-clipboards-src/04-clipboard-storage.js.part');
const clipItems = read('js/repertory/rep-clipboards-src/05-clipboard-items.js.part');
const clipView = read('js/repertory/rep-clipboards-src/06-clipboard-view.js.part');
ok(clipStorage.includes('function repClipsLoad(') && clipStorage.includes('function repClipsSave('), 'کلپ بورڈ محفوظ کرنے اور واپس پڑھنے کے افعال الگ ہیں');
ok(clipItems.includes('function repClipToggle(') && !clipItems.includes('function repToggleClipView('), 'کلپ بورڈ اندراجات کے اعمال صفحہ کھولنے سے الگ ہیں');
ok(clipView.includes('function repToggleClipView(') && !clipView.includes('function repClipToggle('), 'کلپ بورڈ کا منظر اندراجات کے اعمال سے الگ ہے');
const compareState = read('js/repertory/rep-compare-mode-src/00-compare-mode-state.js.part');
const comparePanel = read('js/repertory/rep-compare-mode-src/01-compare-selection-panel.js.part');
const compareDock = read('js/repertory/rep-compare-mode-src/02-clipboard-dock-view.js.part');
const compareMenu = read('js/repertory/rep-compare-mode-src/03-kebab-menu-actions.js.part');
const compareRemedy = read('js/repertory/rep-compare-mode-src/04-glossary-and-remedy-panel.js.part');
ok(compareState.includes('function repCmpModeSet(') && compareState.includes('function repCmpChkClick(') && !compareState.includes('function repCmpPanelRender('), 'موازنہ موڈ کی حالت اور انتخابی نشان الگ حصے میں ہیں');
ok(comparePanel.includes('function repCmpPanelRender(') && comparePanel.includes('function repSideAnalyze('), 'موازنہ انتخابی پینل اور تجزیے کی کارروائی الگ ہے');
ok(compareDock.includes('function repSyncDockTop(') && compareDock.includes('function renderClipView('), 'کلپ بورڈ پٹی اور منظر کے افعال الگ مجموعے میں ہیں');
ok(compareMenu.includes('function repKebabRenderMenu(') && compareMenu.includes('function repKebabDetail('), 'تین نقطوں والے مینو کے افعال ایک ماخذ حصے میں ہیں');
ok(compareRemedy.includes('function ensureRepGlossary(') && compareRemedy.includes('function repRenderRemedyPanel('), 'لغت اور دوا کے منظر کے افعال الگ حصے میں ہیں');
const treeState = read('js/repertory/rep-tree-src/00-tree-state-and-grade-controls.js.part');
const treeLabels = read('js/repertory/rep-tree-src/01-tree-flattening-and-urdu-labels.js.part');
const treeRows = read('js/repertory/rep-tree-src/02-tree-row-rendering-and-actions.js.part');
const treeMount = read('js/repertory/rep-tree-src/03-tree-mount-pagination-and-events.js.part');
const treeFolders = read('js/repertory/rep-tree-src/04-folder-card-rendering.js.part');
ok(treeState.includes('function repGradeSet(') && treeState.includes('var REP_TREE_CHUNK=300;') && !treeState.includes('function repTreeFlatten('), 'درخت کی حالت اور گریڈ اختیار درختی افعال سے الگ ہیں');
ok(treeLabels.includes('function repTreeFlatten(') && treeLabels.includes('function repUrLabelObj('), 'درخت کی ترتیب اور اردو لیبل کی مددگار منطق الگ ہے');
ok(treeRows.includes('function repTreeRowHtml(') && treeRows.includes('function repTreeAct(') && treeRows.includes('function repTreeVisibleLabel('), 'درختی سطر، کارروائیاں اور منظور شدہ ذہنی جڑ کی نمائش الگ حصے میں ہیں');
ok(treeMount.includes('function repTreeMount(') && treeMount.includes('function repTreeClick(') && !treeMount.includes('function renderFolderCards('), 'درخت لگانے، صفحے بندی اور کلک کے افعال الگ ہیں');
ok(treeFolders.includes('function repCardHtml(') && treeFolders.includes('function renderFolderCards(') && !treeFolders.includes('function repTreeMount('), 'فولڈر کارڈوں کی نمائش درخت لگانے کے عمل سے الگ ہے');

const result = cp.spawnSync(process.execPath, ['tools/build_repertory_functions.js', '--check'], {
    cwd: root, encoding: 'utf8'
});
ok(result.status === 0, 'ساتوں تیار فعلی فائلیں اپنے الگ ماخذ حصوں سے یکساں ہیں');

console.log('فعلی فائل بندی کی جانچ مکمل، درست دعوے: ' + passes);
