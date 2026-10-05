'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const includePattern = /^[\t ]*\/\* @include: ([A-Za-z0-9_.-]+\.js\.part) \*\/[\t ]*\r?\n/gm;
const targets = [
    {
        label: 'تفریق کا صفحاتی خول',
        sourceDir: path.join(root, 'js', 'differentiation', '06-diff-shell-src'),
        entry: 'main.js.src',
        output: path.join(root, 'js', 'differentiation', '06-diff-shell.js')
    },
    {
        label: 'تفریق کے نتائج کی نمائش',
        sourceDir: path.join(root, 'js', 'differentiation', '07-diff-views-src'),
        entry: 'main.js.src',
        output: path.join(root, 'js', 'differentiation', '07-diff-views.js')
    },
    {
        label: 'نکاسی',
        sourceDir: path.join(root, 'js', 'differentiation', '08-diff-extract-src'),
        entry: 'main.js.src',
        output: path.join(root, 'js', 'differentiation', '08-diff-extract.js')
    }
];

function expandFile(target, name, stack) {
    if (stack.indexOf(name) !== -1) {
        throw new Error('فعلی حصوں میں بار بار شامل ہونے کا چکر: ' + stack.concat(name).join(' ← '));
    }
    const filePath = path.join(target.sourceDir, name);
    if (!filePath.startsWith(target.sourceDir + path.sep)) {
        throw new Error('فعلی حصے کا راستہ درست نہیں: ' + name);
    }
    if (!fs.existsSync(filePath)) {
        throw new Error('فعلی حصہ نہیں ملا: ' + name);
    }
    const source = fs.readFileSync(filePath, 'utf8');
    const nextStack = stack.concat(name);
    return source.replace(includePattern, function (_match, childName) {
        return expandFile(target, childName, nextStack);
    });
}

let failed = false;
for (const target of targets) {
    try {
        const entryPath = path.join(target.sourceDir, target.entry);
        if (!fs.existsSync(entryPath)) throw new Error('مرکزی ماخذ نہیں ملا: ' + target.entry);
        const generated = expandFile(target, target.entry, []);
        const current = fs.readFileSync(target.output, 'utf8');
        if (process.argv.includes('--check')) {
            if (current !== generated) {
                console.error(target.label + ': تیار فائل ماخذ حصوں سے مختلف ہے؛ دوبارہ جوڑنے کا حکم چلائیں');
                failed = true;
            } else {
                console.log(target.label + ': ماخذ حصے اور تیار فائل یکساں ہیں');
            }
        } else if (current !== generated) {
            fs.writeFileSync(target.output, generated, 'utf8');
            console.log(target.label + ': ماخذ حصے تیار فائل میں جوڑ دیے گئے');
        } else {
            console.log(target.label + ': تیار فائل پہلے ہی تازہ ہے');
        }
    } catch (error) {
        console.error(target.label + ': ' + (error.message || error));
        failed = true;
    }
}
if (failed) process.exitCode = 1;
