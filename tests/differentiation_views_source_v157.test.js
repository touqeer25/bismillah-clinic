'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
let passes = 0;
function ok(value, message) {
    if (!value) throw new Error('ناکام: ' + message);
    passes++;
    console.log('درست: ' + message);
}

const sourceDir = path.join(root, 'js/differentiation/07-diff-views-src');
const parts = fs.readdirSync(sourceDir).filter((name) => name.endsWith('.js.part')).sort();
const manifest = read('js/differentiation/07-diff-views-src/main.js.src');
ok(parts.length === 3, 'تفریق کے نتائج کی نمائش کے 3 ماخذ حصے الگ موجود ہیں');
for (const part of parts) {
    ok(manifest.includes('/* @include: ' + part + ' */'), 'مرکزی آغاز میں ماخذ حصہ شامل ہے: ' + part);
    ok(fs.statSync(path.join(sourceDir, part)).size > 0, 'ماخذ حصہ خالی نہیں: ' + part);
}
const helpers = read('js/differentiation/07-diff-views-src/00-diff-view-helpers.js.part');
const renderer = read('js/differentiation/07-diff-views-src/01-diff-results-view.js.part');
const actions = read('js/differentiation/07-diff-views-src/02-diff-row-actions.js.part');
ok(helpers.includes('function repDiffRowHtml(') && helpers.includes('function repDiffDots('), 'نتیجے کی سطروں کے نمائش مددگار الگ حصے میں ہیں');
ok(renderer.includes('function repDiffRenderBody(') && !renderer.includes('function repDiffCompute('), 'نتائج کا صفحاتی منظر حسابی انجن سے الگ ہے');
ok(actions.includes('function repDiffClipToggle(') && !actions.includes('function repDiffRenderBody('), 'کلپ بورڈ کا عمل نمائش کے حصے سے الگ ہے');

const order = read('js/differentiation/LOAD_ORDER.txt').trim().split(/\r?\n/);
ok(order.length === 8 && order[6] === '07-diff-views.js' && order[7] === '08-diff-extract.js', 'تفریق کے نتائج اور نکاسی کی مقررہ لوڈ ترتیب برقرار ہے');
const runtime = read('js/differentiation/07-diff-views.js');
for (const name of ['repDiffInCaseSet', 'repDiffRowHtml', 'repDiffRenderBody', 'repDiffClipToggle']) {
    ok(runtime.includes('function ' + name + '('), 'موجودہ فعل تیار فائل میں برقرار ہے: ' + name);
}
const build = cp.spawnSync(process.execPath, ['tools/build_differentiation_functions.js', '--check'], {
    cwd: root, encoding: 'utf8'
});
ok(build.status === 0, 'تفریق، نمائش اور نکاسی کی تینوں تیار فائلیں ماخذ حصوں سے یکساں ہیں');
const syntax = cp.spawnSync(process.execPath, ['--check', 'js/differentiation/07-diff-views.js'], {
    cwd: root, encoding: 'utf8'
});
ok(syntax.status === 0, 'تفریق کے نتائج کی نمائش کی نحوی جانچ کامیاب');

console.log('تفریق کے نتائج کی ماخذ فائل بندی مکمل، درست دعوے: ' + passes);
