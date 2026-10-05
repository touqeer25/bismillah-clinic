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
    { label: 'تجزیہ و موازنہ', source: 'js/repertory/rep-analysis-src', output: 'js/repertory/rep-analysis.js', count: 4 }
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

const result = cp.spawnSync(process.execPath, ['tools/build_repertory_functions.js', '--check'], {
    cwd: root, encoding: 'utf8'
});
ok(result.status === 0, 'تینوں تیار فعلی فائلیں اپنے الگ ماخذ حصوں سے یکساں ہیں');

console.log('فعلی فائل بندی کی جانچ مکمل، درست دعوے: ' + passes);
