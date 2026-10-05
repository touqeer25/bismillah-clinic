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

const sourceDir = path.join(root, 'js/differentiation/06-diff-shell-src');
const parts = fs.readdirSync(sourceDir).filter((name) => name.endsWith('.js.part')).sort();
const manifest = read('js/differentiation/06-diff-shell-src/main.js.src');
ok(parts.length === 4, 'تفریق کے صفحاتی خول کے 4 ماخذ حصے الگ موجود ہیں');
for (const part of parts) {
    ok(manifest.includes('/* @include: ' + part + ' */'), 'مرکزی آغاز میں ماخذ حصہ شامل ہے: ' + part);
    ok(fs.statSync(path.join(sourceDir, part)).size > 0, 'ماخذ حصہ خالی نہیں: ' + part);
}
const shell = read('js/differentiation/06-diff-shell-src/00-diff-page-shell.js.part');
const header = read('js/differentiation/06-diff-shell-src/01-diff-page-header.js.part');
const controls = read('js/differentiation/06-diff-shell-src/02-diff-page-controls.js.part');
const runner = read('js/differentiation/06-diff-shell-src/03-diff-page-runner.js.part');
ok(shell.includes('function repDiffShow(') && shell.includes('function repDiffClose('), 'صفحہ کھولنے، دکھانے اور بند کرنے کے افعال اپنے حصے میں ہیں');
ok(header.includes('function repDiffRenderHead(') && !header.includes('function repDiffRun('), 'صفحاتی عنوان اور کنٹرولوں کی نمائش حسابی چکر سے الگ ہے');
ok(controls.includes('function repDiffToggleRem(') && controls.includes('function repDiffSetOpt(') && !controls.includes('function repDiffRun('), 'دوا اور اختیار بدلنے کے اعمال حسابی چکر سے الگ ہیں');
ok(runner.includes('function repDiffRun(') && !runner.includes('function repDiffRenderHead('), 'حساب چلانے والا رابطہ صفحاتی نمائش سے الگ ہے');

const order = read('js/differentiation/LOAD_ORDER.txt').trim().split(/\r?\n/);
ok(order.length === 8 && order[5] === '06-diff-shell.js' && order[6] === '07-diff-views.js' && order[7] === '08-diff-extract.js', 'تفریق کے آخری 3 ماڈیولوں کی مقررہ لوڈ ترتیب برقرار ہے');
const runtime = read('js/differentiation/06-diff-shell.js');
for (const name of ['repDiffOpenForRubric', 'repPageTab', 'repDiffRenderHead', 'repDiffToggleRem', 'repDiffRun']) {
    ok(runtime.includes('function ' + name + '('), 'موجودہ فعل تیار فائل میں برقرار ہے: ' + name);
}

const build = cp.spawnSync(process.execPath, ['tools/build_differentiation_functions.js', '--check'], {
    cwd: root, encoding: 'utf8'
});
ok(build.status === 0, 'تفریق اور نکاسی کی دونوں تیار فائلیں ماخذ حصوں سے یکساں ہیں');
const syntax = cp.spawnSync(process.execPath, ['--check', 'js/differentiation/06-diff-shell.js'], {
    cwd: root, encoding: 'utf8'
});
ok(syntax.status === 0, 'تفریق کے صفحاتی خول کی نحوی جانچ کامیاب');

console.log('تفریق کے صفحاتی خول کی ماخذ فائل بندی مکمل، درست دعوے: ' + passes);
